#!/usr/bin/env node

/**
 * Scores generated documents against the clause topics a practitioner expects to find,
 * defined in document-benchmark.json.
 *
 * The reconciler proves the numbers are true. This proves the documents are complete —
 * a different question, and the one a procurement lead actually applies when they decide
 * whether something reads as an instrument or as a summary wearing a contract's clothes.
 *
 * Required clauses fail the run. Expected clauses are reported but do not fail: they mark
 * where a real agreement would go further than a demo fixture reasonably needs to.
 *
 * Usage:
 *   node scripts/data/contract-packet/benchmark-contract-packet.mjs --packets <dir> [--strict]
 *
 * --strict also fails on missing 'expected' clauses.
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const args = { packets: '', in: '', strict: false };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--packets') { args.packets = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--in') { args.in = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--strict') args.strict = true;
}
if (!args.packets) { console.error('--packets is required'); process.exit(1); }

const benchmark = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/data/contract-packet/document-benchmark.json'), 'utf8'),
);

/** Contracts that do not touch PHI get a DPA where a PHI contract gets a BAA; the
 *  regulatory clause list only applies to the latter. */
let phiByContract = {};
if (args.in) {
  const p = path.resolve(ROOT, args.in, 'contract_register.csv');
  if (fs.existsSync(p)) {
    for (const r of Papa.parse(fs.readFileSync(p, 'utf8').trim(), { header: true, skipEmptyLines: true }).data) {
      phiByContract[r.contract_id] = r.handles_phi === 'yes';
    }
  }
}

const packetsDir = path.resolve(ROOT, args.packets);
const contracts = fs.existsSync(packetsDir)
  ? fs.readdirSync(packetsDir).filter((d) => fs.statSync(path.join(packetsDir, d)).isDirectory()).sort()
  : [];

const missingRequired = [];
const missingExpected = [];
const rows = [];

for (const cid of contracts) {
  for (const [docType, spec] of Object.entries(benchmark.documents)) {
    const file = path.join(packetsDir, cid, `${cid}-${docType}.md`);
    if (!fs.existsSync(file)) {
      missingRequired.push(`${cid}/${docType}: document not generated`);
      continue;
    }
    const body = fs.readFileSync(file, 'utf8');
    const words = body.split(/\s+/).filter(Boolean).length;
    let req = 0; let reqTotal = 0; let exp = 0; let expTotal = 0;

    for (const clause of spec.clauses) {
      // A contract that handles no PHI gets a data protection exhibit rather than a BAA. The
      // HIPAA-specific clauses do not apply to it — but everything else still does, so the
      // exhibit is scored rather than skipped.
      if (clause.phi_only && phiByContract[cid] !== true) continue;
      // JS has no inline (?i) group; the JSON uses it as a readable marker, so translate it.
      const ci = clause.pattern.startsWith('(?i)');
      const hit = new RegExp(ci ? clause.pattern.slice(4) : clause.pattern, ci ? 'im' : 'm').test(body);
      if (clause.weight === 'required') {
        reqTotal += 1;
        if (hit) req += 1;
        else missingRequired.push(`${cid}/${docType}: missing ${clause.label}${clause.cite ? `  [${clause.cite}]` : ''}`);
      } else {
        expTotal += 1;
        if (hit) exp += 1;
        else missingExpected.push(`${cid}/${docType}: no ${clause.label}${clause.cite ? `  [${clause.cite}]` : ''}`);
      }
    }
    if (words < spec.min_words) {
      missingRequired.push(`${cid}/${docType}: ${words} words, benchmark floor is ${spec.min_words}`);
    }
    rows.push({ cid, docType, words, floor: spec.min_words, req, reqTotal, exp, expTotal });
  }
}

// Report one line per document type, aggregated across contracts — the per-contract detail
// is in the failure list and repeating it here just makes the table unreadable.
const byType = new Map();
for (const r of rows) {
  const cur = byType.get(r.docType) ?? { words: 0, n: 0, floor: r.floor, req: 0, reqTotal: 0, exp: 0, expTotal: 0 };
  cur.words += r.words; cur.n += 1;
  cur.req += r.req; cur.reqTotal += r.reqTotal; cur.exp += r.exp; cur.expTotal += r.expTotal;
  byType.set(r.docType, cur);
}

console.log(`benchmark: ${Object.keys(benchmark.documents).length} document types, ${contracts.length} contract(s)\n`);
console.log('document           words   floor   required clauses   expected clauses');
console.log('-----------------------------------------------------------------------');
for (const [docType, v] of byType) {
  const avg = Math.round(v.words / v.n);
  const reqPct = v.reqTotal ? Math.round((v.req / v.reqTotal) * 100) : 100;
  const mark = v.req === v.reqTotal && avg >= v.floor ? ' ' : '!';
  console.log(
    `${mark} ${docType.padEnd(17)}${String(avg).padStart(5)}${String(v.floor).padStart(8)}` +
    `${`${v.req}/${v.reqTotal} (${reqPct}%)`.padStart(19)}${`${v.exp}/${v.expTotal}`.padStart(19)}`,
  );
}

const uniq = (a) => [...new Set(a.map((s) => s.replace(/^CTR-[A-Z0-9-]+\//, '')))];
if (missingExpected.length) {
  console.log(`\nexpected-but-absent (does not fail):`);
  for (const m of uniq(missingExpected)) console.log(`  · ${m}`);
}
if (missingRequired.length) {
  console.log(`\nREQUIRED CLAUSES MISSING (${missingRequired.length} across contracts, ${uniq(missingRequired).length} distinct):`);
  for (const m of uniq(missingRequired)) console.log(`  - ${m}`);
  process.exit(1);
}
if (args.strict && missingExpected.length) {
  console.log('\n--strict: expected clauses are absent');
  process.exit(1);
}
console.log('\nbenchmark PASSED — every required clause topic present in every document.');
