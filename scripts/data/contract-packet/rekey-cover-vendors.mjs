#!/usr/bin/env node

/**
 * Replaces real vendor identities with invented cover entities across the synthetic contract
 * evidence packages.
 *
 * The packages contained documents titled as agreements with Microsoft, Salesforce and Workday,
 * carrying fabricated commercial terms — a $35,800,000 annual value attributed to Microsoft, a
 * $43,500,000 one to Salesforce — in a public repository. The `_SYNTHETIC` filename suffix does
 * not fix that: what a reader sees is a document that looks like a real company's executed
 * agreement with invented numbers in it.
 *
 * Scope is deliberately narrow. Only datasets/source/contract-intelligence/ is touched. Naming a
 * real vendor in a tenant's application or vendor INVENTORY is a legitimate fact about that
 * company and is left alone; the problem is specifically a real vendor appearing as a
 * contracting party in a document that looks executed.
 *
 * Branded product names go too. Leaving "the agreement covers Azure committed consumption" in a
 * document whose supplier is now Northgate would be incoherent, and it is the fabricated
 * commercial terms attached to those products that make them awkward rather than the names.
 *
 * Binary PDFs are not rewritten here — their text is data-backed in contract_pdf_page_text.csv,
 * so they are regenerated from the re-keyed rows by regenerate-contract-pdfs.mjs and their
 * hashes recomputed.
 *
 * Usage:
 *   node scripts/data/contract-packet/rekey-cover-vendors.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry-run');
const NO_RENAME = process.argv.includes('--no-rename');
const ti = process.argv.indexOf('--target');
const TARGET = ti > -1 ? process.argv[ti + 1] : 'datasets/source/contract-intelligence';

/**
 * Longest-first. Order matters: "Microsoft 365 E5" must be consumed before "Microsoft 365",
 * and "Microsoft Azure" before either "Microsoft" or "Azure", or the replacements compound
 * into nonsense like "Northgate Northgate Cloud".
 */
const MAP = [
  // --- Microsoft -> Northgate Cloud Corporation
  ['Microsoft Azure', 'Northgate Cloud'],
  ['Microsoft Corporation', 'Northgate Cloud Corporation'],
  ['Microsoft 365 E5', 'Northgate Workplace E5'],
  ['Microsoft 365', 'Northgate Workplace'],
  ['GitHub Copilot', 'Northgate Copilot'],
  ['GitHub', 'Northgate Code'],
  ['Power BI Premium', 'Northgate Insight Premium'],
  ['Power BI', 'Northgate Insight'],
  ['POWER BI', 'NORTHGATE-INSIGHT'],
  ['GITHUB COPILOT', 'NORTHGATE-COPILOT'],
  ['GITHUB', 'NORTHGATE-CODE'],
  ['Azure Cost Management', 'Northgate Cloud Cost Management'],
  ['Azure', 'Northgate Cloud'],
  ['AZURE', 'NORTHGATE CLOUD'],
  ['MICROSOFT', 'NORTHGATE'],
  ['Microsoft', 'Northgate'],
  ['microsoft', 'northgate'],

  // --- Salesforce -> Vantage Data Cloud, Inc.
  ['Salesforce, Inc.', 'Vantage Data Cloud, Inc.'],
  ['Salesforce Inc.', 'Vantage Data Cloud, Inc.'],
  ['Sales Cloud', 'Vantage Sales Suite'],
  ['Service Cloud', 'Vantage Service Suite'],
  ['MuleSoft', 'Vantage Integrate'],
  ['MULESOFT', 'VANTAGE-INTEGRATE'],
  ['SERVICE CLOUD', 'VANTAGE-SERVICE-SUITE'],
  ['SALES CLOUD', 'VANTAGE-SALES-SUITE'],
  ['TABLEAU', 'VANTAGE-VISUALISE'],
  ['Tableau', 'Vantage Visualise'],
  ['SALESFORCE', 'VANTAGE'],
  ['Salesforce', 'Vantage'],
  ['salesforce', 'vantage'],

  // --- Workday -> Sterling Workforce Systems, Inc.
  ['Workday Inc.', 'Sterling Workforce Systems, Inc.'],
  ['Workday, Inc.', 'Sterling Workforce Systems, Inc.'],
  ['Adaptive Planning', 'Sterling Planning'],
  ['Prism Analytics', 'Sterling Prism'],
  ['PRISM ANALYTICS', 'STERLING-PRISM'],
  ['ADAPTIVE PLANNING', 'STERLING-PLANNING'],
  ['WORKDAY', 'STERLING'],
  ['Workday', 'Sterling'],
  ['workday', 'sterling'],
];

/**
 * Phrases that survive the pass untouched, because they are not a contracting party.
 *
 * A blanket token replacement got these wrong, and each one would have been a real defect:
 *
 *  - "Azure Blob original" describes where WE store the file. Re-keying our own storage
 *    architecture to a fictional vendor turns a true statement into nonsense.
 *  - "Azure East US 2" and "Azure West Europe" are region names in a cloud account inventory
 *    that also lists "AWS us-east-1" and "Google us-central1". Renaming only the Azure rows
 *    while leaving the other two real is incoherent on its face.
 *  - "Azure Synapse" and "Azure Analytics Landing Zone" sit in platform and application
 *    inventories beside Databricks. Naming the platforms a company actually runs is a fact
 *    about that company, which is the case the policy explicitly permits.
 *
 * The line being drawn is the one that matters: a real vendor may appear in an INVENTORY, and
 * may not appear as a PARTY to a document that looks executed.
 */
/** Masking token. NUL cannot occur in these text files, so it cannot collide with real content. */
const SENTINEL = (i) => `\u0000PROTECT${i}\u0000`;

const PROTECT = [
  // Our own environment variables and identifiers. Re-keying these would rename the connection
  // strings every data-plane script reads, breaking the repo. Longest first so the shorter
  // names cannot consume a prefix of the longer ones.
  'ABARVA_AZURE_DATABASE_URL',
  'AZURE_CLIENT_DATABASE_URL',
  'AZURE_LAB_DATABASE_URL',
  'AZURE_DATABASE_URL',
  'AZURE_COST_EXPORT_MONTHLY',
  'AZURE_COST_MONTHLY',

  'Azure Blob',
  'Azure East US',
  'Azure West Europe',
  'Azure Synapse',
  'Azure Resource Graph',
  'Azure Analytics Landing Zone',
];

/** Files whose bytes are not text; handled by the PDF regeneration step instead. */
const BINARY = new Set(['.pdf', '.xlsx', '.png', '.jpg', '.jpeg', '.zip']);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const files = walk(path.join(ROOT, TARGET));
const tally = new Map();
const protectedHits = new Map();
let changedFiles = 0;
let renamed = 0;
const pending = [];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (BINARY.has(ext)) continue;

  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  // Mask the protected phrases so the substitution cannot see them, then restore.
  PROTECT.forEach((phrase, i) => {
    if (after.includes(phrase)) {
      const hits = after.split(phrase).length - 1;
      after = after.split(phrase).join(SENTINEL(i));
      protectedHits.set(phrase, (protectedHits.get(phrase) ?? 0) + hits);
    }
  });

  for (const [from, to] of MAP) {
    if (!after.includes(from)) continue;
    const n = after.split(from).length - 1;
    after = after.split(from).join(to);
    tally.set(from, (tally.get(from) ?? 0) + n);
  }

  PROTECT.forEach((phrase, i) => {
    after = after.split(SENTINEL(i)).join(phrase);
  });
  if (after !== before) {
    changedFiles += 1;
    if (!DRY) fs.writeFileSync(file, after);
  }

  // Filenames carry the vendor too: CTR-061_Microsoft_Executed_Agreement_SYNTHETIC.pdf
  const base = path.basename(file);
  let newBase = base;
  for (const [from, to] of MAP) {
    if (newBase.includes(from)) newBase = newBase.split(from).join(to.replace(/[ ,]+/g, '_'));
  }
  if (newBase !== base && !NO_RENAME) pending.push([file, path.join(path.dirname(file), newBase)]);
}

// Rename after the content pass so a rename cannot hide a file from it.
for (const [from, to] of pending) {
  renamed += 1;
  if (!DRY) fs.renameSync(from, to);
}

console.log(`${DRY ? 'DRY RUN — ' : ''}re-key of ${TARGET}`);
console.log(`  text files changed : ${changedFiles}`);
console.log(`  files renamed      : ${renamed}`);
if (protectedHits.size) {
  console.log('\nprotected from substitution (inventory / our own infrastructure):');
  for (const [p, n] of protectedHits) console.log(`  ${String(n).padStart(5)}  ${p}`);
}
console.log('\nsubstitutions applied:');
for (const [from, n] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
  const to = MAP.find(([f]) => f === from)[1];
  console.log(`  ${String(n).padStart(5)}  ${from}  ->  ${to}`);
}
