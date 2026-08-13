#!/usr/bin/env node

/**
 * Wave 0 of the enrichment sequence: fix graph semantics before any volume is added.
 *
 * Three defects, all found by the ontology validator and invisible to every other gate:
 *
 *   1. `role` endpoints. The type meant both an executive position and a job family and
 *      had no home dimension. Retyped to `org_unit` or `workforce_role` by resolving the
 *      name against the actual dimensions — never by guessing from the string.
 *   2. `has_risk` edges pointing backwards (risk -> system). Direction swapped so the
 *      subject owns the risk, matching the declared domain and range.
 *   3. One dangling `function` endpoint whose name carried a parenthetical the dimension
 *      does not, so it resolved to nothing.
 *
 * Only these three transformations are applied. Rows are never added or removed, and no
 * column other than the four relationship endpoint/type columns is touched.
 *
 * Usage: node scripts/data/apply-ontology-wave0-fixes.mjs --tenant skyharbor-air [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

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

const readCsv = (f) => {
  const p = abs(`${root}/${f}`);
  if (!fs.existsSync(p)) return { rows: [], fields: [] };
  const parsed = Papa.parse(fs.readFileSync(p, 'utf8').trim(), { header: true, skipEmptyLines: true });
  // The source carries mixed line endings. Left alone, a parse/unparse round trip leaves a
  // stray carriage return in the final column of every CRLF row -- a silent corruption that
  // would travel all the way into the load.
  for (const row of parsed.data) {
    for (const key of Object.keys(row)) {
      if (typeof row[key] === 'string' && row[key].includes('\r')) row[key] = row[key].replace(/\r/g, '');
    }
  }
  return { rows: parsed.data, fields: (parsed.meta.fields ?? []).map((f) => f.replace(/\r/g, '')) };
};
const pick = (prefix) => fs.readdirSync(abs(root)).find((f) => f.startsWith(prefix) && f.endsWith('.csv')) ?? '';

const orgFile = pick('02_'), wfFile = pick('03_'), fnFile = pick('01_'), relFile = pick('12_');
const org = readCsv(orgFile).rows;
const orgNames = new Set([
  ...org.map((r) => String(r.org_unit ?? '').trim()),
  ...org.map((r) => String(r.leader_name_or_role ?? '').trim()),
].filter(Boolean));
const wfNames = new Set(readCsv(wfFile).rows.map((r) => String(r.persona_or_role ?? '').trim()).filter(Boolean));
const fnNames = new Set(readCsv(fnFile).rows.map((r) => String(r.function_name ?? '').trim()).filter(Boolean));

const { rows, fields } = readCsv(relFile);
const before = rows.length;
const changes = { retypedOrgUnit: 0, retypedWorkforceRole: 0, retypeUnresolved: [], directionSwapped: 0, functionRenamed: 0 };

for (const row of rows) {
  // 1. retype `role` by resolving the name, not by pattern-matching it
  for (const side of ['from', 'to']) {
    if (String(row[`${side}_object_type`] ?? '').trim() !== 'role') continue;
    const name = String(row[`${side}_object_name`] ?? '').trim();
    if (orgNames.has(name)) { row[`${side}_object_type`] = 'org_unit'; changes.retypedOrgUnit += 1; }
    else if (wfNames.has(name)) { row[`${side}_object_type`] = 'workforce_role'; changes.retypedWorkforceRole += 1; }
    else if (!changes.retypeUnresolved.includes(name)) changes.retypeUnresolved.push(name);
  }

  // 2. has_risk must run subject -> risk
  if (String(row.relationship_type ?? '').trim() === 'has_risk'
      && String(row.from_object_type ?? '').trim() === 'risk'
      && String(row.to_object_type ?? '').trim() !== 'risk') {
    const ft = row.from_object_type, fn = row.from_object_name;
    row.from_object_type = row.to_object_type; row.from_object_name = row.to_object_name;
    row.to_object_type = ft; row.to_object_name = fn;
    changes.directionSwapped += 1;
  }

  // 3. one function endpoint carries a parenthetical the dimension does not
  for (const side of ['from', 'to']) {
    if (String(row[`${side}_object_type`] ?? '').trim() !== 'function') continue;
    const name = String(row[`${side}_object_name`] ?? '').trim();
    if (fnNames.has(name)) continue;
    const stripped = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (stripped && fnNames.has(stripped)) { row[`${side}_object_name`] = stripped; changes.functionRenamed += 1; }
  }
}

if (rows.length !== before) { console.error('row count changed; refusing to write'); process.exit(1); }

if (!args.dryRun) fs.writeFileSync(abs(`${root}/${relFile}`), `${Papa.unparse({ fields, data: rows })}\n`);

console.log(`${args.tenant} ${args.dryRun ? '(dry run)' : ''}`);
console.log(`  role -> org_unit          : ${changes.retypedOrgUnit}`);
console.log(`  role -> workforce_role    : ${changes.retypedWorkforceRole}`);
console.log(`  has_risk direction fixed  : ${changes.directionSwapped}`);
console.log(`  function name resolved    : ${changes.functionRenamed}`);
console.log(`  rows in/out               : ${before}/${rows.length}`);
if (changes.retypeUnresolved.length) console.log(`  UNRESOLVED (left as-is)   : ${JSON.stringify(changes.retypeUnresolved)}`);
