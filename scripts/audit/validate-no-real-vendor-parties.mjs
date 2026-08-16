#!/usr/bin/env node

/**
 * Fails when a real company appears as a contracting party in a synthetic contract document.
 *
 * This exists because it already happened: the repository carried documents titled as executed
 * agreements with Microsoft, Salesforce and Workday, attributing invented commercial terms to
 * them, in a public repo. The `_SYNTHETIC` filename suffix did not make that safe.
 *
 * The rule this enforces is narrow and deliberate:
 *
 *   A real company MAY appear in an inventory. Recording that a business runs Microsoft 365,
 *   or that evidence came from ServiceNow CMDB, is a fact about that business.
 *
 *   A real company MAY NOT appear as a PARTY to a document that looks executed, or in the
 *   filename of one, because that fabricates an agreement in a real company's name.
 *
 * So the scan is scoped to documents and to the fields that carry party identity, not to every
 * mention of a brand.
 *
 * Note on matching: no \b anchors. Underscore is a word character, so /\bWorkday/ does not
 * match inside CF-003_Workday_Inc__EXECUTED-AGREEMENT.pdf — which is exactly the filename this
 * check is meant to catch. That bug silently passed a real violation once already.
 *
 * Usage:
 *   node scripts/audit/validate-no-real-vendor-parties.mjs [--dir <path>]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const di = process.argv.indexOf('--dir');
const TARGET = di > -1 ? process.argv[di + 1] : 'datasets/source/contract-intelligence';

/**
 * Companies that must never be a contracting party in a synthetic document. Extend freely —
 * a false positive here costs a rename, a false negative costs a real company's name on a
 * fabricated agreement in a public repository.
 */
const REAL_COMPANIES = [
  'Microsoft', 'Salesforce', 'Workday', 'MuleSoft', 'Tableau', 'Oracle', 'SAP',
  'ServiceNow', 'Deloitte', 'Accenture', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini',
  'IBM', 'Epic Systems', 'Cerner', 'Adobe', 'Google', 'Amazon Web Services',
];
const RE = new RegExp(`(${REAL_COMPANIES.join('|')})`, 'i');

/** Columns whose value names a party to the agreement. */
const PARTY_COLUMNS = [
  'vendor_name', 'supplier_name', 'supplier_legal_entity', 'supplier_short_name',
  'counterparty', 'party', 'buyer_legal_entity', 'contract_name',
];

/** Directories whose files are contract documents rather than inventory tables. */
const DOC_DIR = /(^|\/)documents(\/|$)/;

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const violations = [];
const files = walk(path.resolve(ROOT, TARGET));

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const base = path.basename(file);

  // 1. A document filename may not name a real company.
  if (DOC_DIR.test(rel) && RE.test(base)) {
    violations.push(`${rel}\n      document filename names ${base.match(RE)[1]}`);
  }

  // 2. Party columns in any table may not name a real company.
  if (/\.csv$/i.test(base)) {
    const text = fs.readFileSync(file, 'utf8');
    const [header, ...lines] = text.split('\n');
    if (!header) continue;
    const cols = header.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const idx = cols
      .map((c, i) => (PARTY_COLUMNS.includes(c) ? i : -1))
      .filter((i) => i > -1);
    if (!idx.length) continue;
    lines.forEach((line, n) => {
      if (!line.trim()) return;
      const cells = line.split(',');
      for (const i of idx) {
        const v = (cells[i] ?? '').replace(/^"|"$/g, '');
        if (RE.test(v)) {
          violations.push(`${rel}:${n + 2}\n      ${cols[i]} = "${v}" names a real company as a party`);
        }
      }
    });
  }

  // 3. A markdown document may not name a real company as supplier or in its title.
  if (/\.md$/i.test(base) && DOC_DIR.test(rel)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n').slice(0, 25)) {
      if (/^(#|Supplier:|Customer:|Parties:)/i.test(line.trim()) && RE.test(line)) {
        violations.push(`${rel}\n      ${line.trim().slice(0, 90)}`);
      }
    }
  }
}

console.log(`scanned ${files.length} files under ${TARGET}`);
if (violations.length) {
  console.log(`\nREAL COMPANY NAMED AS A CONTRACTING PARTY (${violations.length}):`);
  for (const v of violations.slice(0, 30)) console.log(`  - ${v}`);
  if (violations.length > 30) console.log(`  ... and ${violations.length - 30} more`);
  console.log('\nUse an invented cover entity. Inventory rows may name real vendors; documents may not.');
  process.exit(1);
}
console.log('pass — no real company appears as a contracting party in a synthetic document.');
