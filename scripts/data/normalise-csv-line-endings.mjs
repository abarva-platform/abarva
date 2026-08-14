#!/usr/bin/env node

/**
 * Normalises inconsistent row terminators in tenant CSV files.
 *
 * One root cause, four symptoms. A handful of rows in two files end with a bare `\n` while
 * the rest end with `\r\n`. Python's csv module copes; the parser used across this codebase
 * detects the dominant terminator and then merges the odd row into its neighbour. That single
 * inconsistency was responsible for:
 *
 *   - a vendor (`Infosys BPM`) appearing to be missing from the vendor dimension, reported as
 *     an unresolved graph endpoint
 *   - four workforce roles vanishing on read
 *   - identity assignment refusing to write both files
 *   - segmentation refusing to write both files
 *
 * The bare newlines are outside quoted fields, verified before writing, so this changes row
 * terminators only. No field value is altered and no row is added or removed — the rows were
 * always there; one parser could not see them.
 *
 * Usage: node scripts/data/normalise-csv-line-endings.mjs --tenant <key> [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const abs = (p) => path.join(ROOT, p);

const args = { tenant: '', dryRun: false };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--tenant') { args.tenant = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--dry-run') args.dryRun = true;
}
if (!args.tenant) { console.error('--tenant is required'); process.exit(1); }

const registry = JSON.parse(fs.readFileSync(abs('datasets/tenant-inputs/tenant-input-registry.json'), 'utf8'));
const tenant = (registry.activeTenants ?? []).find((t) => t.tenantKey === args.tenant);
if (!tenant) { console.error(`Tenant "${args.tenant}" is not registry-declared.`); process.exit(1); }
const root = tenant.canonicalInputRoot;

let touched = 0;
for (const file of fs.readdirSync(abs(root)).filter((f) => f.endsWith('.csv'))) {
  const target = abs(`${root}/${file}`);
  const raw = fs.readFileSync(target);

  const bare = [];
  let quotes = 0;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === 0x22) quotes += 1;
    if (raw[i] === 0x0a && (i === 0 || raw[i - 1] !== 0x0d)) {
      // Odd quote count means this newline sits inside a quoted field, where it is a
      // legitimate part of the value and must not be touched.
      bare.push({ offset: i, insideQuotes: quotes % 2 === 1 });
    }
  }
  // A bare newline at end-of-file is a trailing terminator and harms nothing. Only newlines
  // with content after them can merge two rows, and only those are worth touching: rewriting
  // every file's EOF byte would produce a large diff that fixes nothing.
  const fixable = bare.filter((b) => !b.insideQuotes && b.offset < raw.length - 1);
  const protectedInside = bare.filter((b) => b.insideQuotes);
  if (!fixable.length) continue;

  const text = raw.toString('utf8');
  const normalised = text.replace(/(?<!\r)\n/g, (match, offset) => {
    const entry = bare.find((b) => b.offset === offset);
    if (entry && entry.insideQuotes) return match;
    if (offset >= raw.length - 1) return match;
    return '\r\n';
  });

  if (!args.dryRun) fs.writeFileSync(target, normalised, 'utf8');
  touched += 1;
  console.log(`  ${file.padEnd(44)} normalised ${fixable.length} row terminator(s)` +
    (protectedInside.length ? `, left ${protectedInside.length} in-field newline(s) untouched` : ''));
}

console.log(`${args.tenant}${args.dryRun ? ' (dry run)' : ''}: ${touched} file(s) changed`);
