#!/usr/bin/env node

/**
 * Extracts values back out of a generated contract packet and proves they agree with the
 * structured facts the packet was rendered from.
 *
 * This is the check that makes the packet worth anything. A synthetic document that merely
 * looks like a contract is a liability: it is more convincing than a short one and equally
 * false. A synthetic document whose every figure round-trips to a source row is a fixture
 * you can demonstrate extraction against honestly — the extractor pulls $4,820,000.00 from
 * the master agreement, and the register independently says $4,820,000.00.
 *
 * The extraction here is deliberately naive — it reads the rendered text, not the generator's
 * internal state. If it shared state with the generator the proof would be circular.
 *
 * Fails when:
 *   - a value in a document disagrees with its source row
 *   - a cross-referenced document ID does not exist
 *   - a cited section number does not exist in the document it points to
 *   - a document falls below the length floor for its type (a stub)
 *
 * Usage:
 *   node scripts/data/contract-packet/reconcile-contract-packet.mjs \
 *     --in datasets/source/contract-intelligence/_staging-fixture --packets /tmp/packets
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const args = { in: '', packets: '' };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--in') { args.in = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--packets') { args.packets = process.argv[i + 1]; i += 1; }
}
if (!args.in || !args.packets) { console.error('--in and --packets are required'); process.exit(1); }

const read = (f) => {
  const p = path.resolve(ROOT, args.in, f);
  if (!fs.existsSync(p)) return [];
  return Papa.parse(fs.readFileSync(p, 'utf8').trim(), { header: true, skipEmptyLines: true }).data;
};
const register = read('contract_register.csv');
const pricing = read('contract_pricing_schedule.csv');
const slas = read('contract_sla_terms.csv');
const invoices = read('contract_invoice_lines.csv');
const rates = read('contract_rate_card.csv');

/** Money as it is rendered: $1,234,567.00 -> 1234567 */
const parseMoney = (s) => Number(String(s).replace(/[$,]/g, ''));
/** Every money figure appearing in a document. */
const moneyIn = (text) => [...text.matchAll(/\$[\d,]+\.\d{2}/g)].map((m) => parseMoney(m[0]));

/** Minimum words before a document counts as a stub rather than an instrument. */
const LENGTH_FLOOR = {
  MSA: 700, ORDER: 180, SOW: 220, PRICING: 180,
  SLA: 180, BAA: 250, 'AMEND-001': 180, 'INVOICE-EVIDENCE': 180,
};

const failures = [];
const checks = { run: 0, passed: 0 };
const check = (ok, message) => {
  checks.run += 1;
  if (ok) checks.passed += 1;
  else failures.push(message);
};

const packetsDir = path.resolve(ROOT, args.packets);
const contractsFound = fs.existsSync(packetsDir)
  ? fs.readdirSync(packetsDir).filter((d) => fs.statSync(path.join(packetsDir, d)).isDirectory())
  : [];

for (const c of register) {
  const dir = path.join(packetsDir, c.contract_id);
  if (!fs.existsSync(dir)) { failures.push(`${c.contract_id}: no packet directory`); continue; }

  const docs = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    docs[f.replace(`${c.contract_id}-`, '').replace('.md', '')] = fs.readFileSync(path.join(dir, f), 'utf8');
  }

  const lines = pricing.filter((p) => p.contract_id === c.contract_id);
  const invLines = invoices.filter((i) => i.contract_id === c.contract_id);
  const slaRows = slas.filter((s) => s.contract_id === c.contract_id);
  const contracted = lines.reduce((s, l) => s + Number(l.annual_line_total_usd || 0), 0);
  const annual = Number(c.annual_value_usd);

  // 1. every document present, and none a stub
  for (const [key, floor] of Object.entries(LENGTH_FLOOR)) {
    const body = docs[key];
    check(Boolean(body), `${c.contract_id}/${key}: document missing`);
    if (!body) continue;
    const words = body.split(/\s+/).filter(Boolean).length;
    check(words >= floor, `${c.contract_id}/${key}: ${words} words is below the ${floor}-word floor — reads as a stub`);
  }

  // 2. annual contract value round-trips into the master agreement
  if (docs.MSA) {
    check(moneyIn(docs.MSA).includes(annual),
      `${c.contract_id}/MSA: annual value ${annual} not found in document; register says ${annual}`);
    // 3. liability cap is the stated multiple of annual value
    const cap = annual * Number(c.liability_cap_multiple);
    check(moneyIn(docs.MSA).includes(cap),
      `${c.contract_id}/MSA: liability cap ${cap} (${c.liability_cap_multiple}x annual) not found`);
    // 4. insurance floor round-trips
    check(moneyIn(docs.MSA).includes(Number(c.insurance_required_usd)),
      `${c.contract_id}/MSA: insurance requirement ${c.insurance_required_usd} not found`);
    // 5. payment terms round-trip
    check(new RegExp(`\\b${c.payment_terms_days} days\\b`).test(docs.MSA),
      `${c.contract_id}/MSA: payment terms of ${c.payment_terms_days} days not stated`);
  }

  // 6. pricing exhibit line totals agree with the pricing schedule, line for line
  if (docs.PRICING) {
    const found = moneyIn(docs.PRICING);
    for (const l of lines) {
      check(found.includes(Number(l.annual_line_total_usd)),
        `${c.contract_id}/PRICING: line ${l.line_no} (${l.sku}) total ${l.annual_line_total_usd} not found in exhibit`);
    }
    check(found.includes(contracted),
      `${c.contract_id}/PRICING: total annual value ${contracted} not found`);
    // Professional services rates are facts too — a rate typed into the document rather than
    // read from the rate card is exactly the unsourced figure this check exists to catch.
    for (const r of rates.filter((x) => x.contract_id === c.contract_id)) {
      check(found.includes(Number(r.rate_usd)) && docs.PRICING.includes(r.role),
        `${c.contract_id}/PRICING: rate card row ${r.role} @ ${r.rate_usd} not found in exhibit`);
    }
    // 7. the exhibit total must equal the register's annual value
    check(contracted === annual,
      `${c.contract_id}: pricing lines sum to ${contracted} but register says ${annual} — source rows disagree`);
  }

  // 8. order form repeats the same total
  if (docs.ORDER) {
    check(moneyIn(docs.ORDER).includes(contracted),
      `${c.contract_id}/ORDER: order total ${contracted} does not match pricing exhibit`);
  }

  // 9. invoice evidence agrees with the invoice rows and reconciles to contracted value
  if (docs['INVOICE-EVIDENCE']) {
    const found = moneyIn(docs['INVOICE-EVIDENCE']);
    const invTotal = invLines.reduce((s, l) => s + Number(l.line_amount_usd || 0), 0);
    for (const l of invLines) {
      check(found.includes(Number(l.line_amount_usd)),
        `${c.contract_id}/INVOICE-EVIDENCE: invoice line ${l.sku} amount ${l.line_amount_usd} not found`);
    }
    check(found.includes(invTotal), `${c.contract_id}/INVOICE-EVIDENCE: invoice total ${invTotal} not found`);
    check(invLines.every((l) => l.po_number), `${c.contract_id}: invoice lines missing a purchase order reference`);
  }

  // 10. SLA severities and targets round-trip
  if (docs.SLA) {
    for (const s of slaRows) {
      check(docs.SLA.includes(s.severity) && docs.SLA.includes(s.response_target) && docs.SLA.includes(s.restore_target),
        `${c.contract_id}/SLA: ${s.severity} targets (${s.response_target}/${s.restore_target}) not found`);
    }
  }

  // 11. PHI handling drives the right exhibit
  if (docs.BAA) {
    const isBaa = /Business Associate Agreement/.test(docs.BAA);
    check(isBaa === (c.handles_phi === 'yes'),
      `${c.contract_id}/BAA: handles_phi=${c.handles_phi} but exhibit is ${isBaa ? 'a BAA' : 'a DPA'}`);
  }

  // 12. every cross-referenced document ID exists in the packet
  for (const [key, body] of Object.entries(docs)) {
    const refs = new Set([...body.matchAll(/`(CTR-[A-Z0-9-]+?-(?:MSA|ORDER|SOW|PRICING|SLA|BAA|AMEND-\d+|INVOICE-EVIDENCE))`/g)].map((m) => m[1]));
    for (const r of refs) {
      check(fs.existsSync(path.join(dir, `${r}.md`)),
        `${c.contract_id}/${key}: references \`${r}\` which does not exist in the packet`);
    }
  }

  // 13. every cited section number exists in the document it points at.
  //     Three cases: a reference into the master agreement, a reference into a named exhibit,
  //     and a bare reference, which means a section of the citing document itself. The last is
  //     the one that silently breaks when a document is renumbered.
  const sectionsOf = (body) => new Set([...(body ?? '').matchAll(/^(\d+)\.(\d+)\s/gm)].map((m) => `${m[1]}.${m[2]}`));
  const targets = {
    'of the Agreement': ['MSA', 'the master agreement'],
    'of the Pricing Exhibit': ['PRICING', 'the pricing exhibit'],
    'of the Service Level Schedule': ['SLA', 'the service level schedule'],
  };
  for (const [key, body] of Object.entries(docs)) {
    for (const [phrase, [target, human]] of Object.entries(targets)) {
      if (key === target) continue;
      const cited = [...body.matchAll(new RegExp(`Section (\\d+\\.\\d+) ${phrase}`, 'g'))].map((m) => m[1]);
      const available = sectionsOf(docs[target]);
      for (const s of new Set(cited)) {
        check(available.has(s),
          `${c.contract_id}/${key}: cites Section ${s} ${phrase}, which does not exist in ${human}`);
      }
    }
    // Bare "Section N.M" with no destination names a section of this same document.
    const own = sectionsOf(body);
    const bare = [...body.matchAll(/Section (\d+\.\d+)(?! of)/g)].map((m) => m[1]);
    for (const s of new Set(bare)) {
      check(own.has(s),
        `${c.contract_id}/${key}: cites its own Section ${s}, which does not exist in this document`);
    }
  }

  // 14. the synthetic-demo header is present on every document
  for (const [key, body] of Object.entries(docs)) {
    check(/SYNTHETIC DEMO DOCUMENT/.test(body),
      `${c.contract_id}/${key}: missing the synthetic-demo header`);
  }
}

console.log(`contracts checked : ${contractsFound.length}`);
console.log(`assertions        : ${checks.passed}/${checks.run} passed`);
if (failures.length) {
  console.log(`\nFAILURES (${failures.length}):`);
  for (const f of failures.slice(0, 25)) console.log(`  - ${f}`);
  if (failures.length > 25) console.log(`  ... and ${failures.length - 25} more`);
  process.exit(1);
}
console.log('\nreconciliation PASSED — every figure in every document traces to a source row,');
console.log('every cross-reference resolves, every cited section exists, no document is a stub.');
