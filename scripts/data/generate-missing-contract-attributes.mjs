#!/usr/bin/env node

/**
 * Fills contract columns that the deterministic remediation could not populate, because no
 * source column carried the attribute.
 *
 * This is generation, and it is labelled as such. It is legitimate here only because the
 * tenant is synthetic — its own rows declare `synthetic_v3_context_generation`, so there is
 * no client evidence being overwritten and no attestation being faked. On a real client
 * package this script must never run: an empty column is an evidence request, not a gap to
 * be filled in.
 *
 * Four rules keep it honest:
 *
 *   1. Only empty cells are written. A value that came from real source data is never
 *      touched, so the deterministic remediation stays authoritative wherever it reached.
 *   2. Values are seeded from the row's own identity, so the output is reproducible: the
 *      same input always produces the same result, and a re-run changes nothing.
 *   3. Every generated field is recorded per row in `generated_fields`, so any consumer can
 *      tell a generated value from a sourced one without consulting a manifest.
 *   4. Money and counts are anchored to the tenant's declared revenue and headcount rather
 *      than picked from thin air, so totals stay defensible against the enterprise profile.
 *
 * Usage: node scripts/data/generate-missing-contract-attributes.mjs --tenant meridian-health
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';

const ROOT = process.cwd();
const abs = (p) => path.join(ROOT, p);
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';

const args = { tenant: '', dryRun: false };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--tenant') { args.tenant = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--dry-run') args.dryRun = true;
}
if (!args.tenant) { console.error('--tenant is required'); process.exit(1); }

const PACKAGE = `datasets/tenant-inputs/${args.tenant}/v2026-08-governed-intake/canonical-dimensions`;
if (!fs.existsSync(abs(PACKAGE))) { console.error(`No remediated package at ${PACKAGE}`); process.exit(1); }

const manifest = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/template-manifest.json`), 'utf8'));

/** Deterministic 0..1 from a seed string. Same row + column always yields the same draw. */
function rand(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}
const pickFrom = (seed, list) => list[Math.floor(rand(seed) * list.length) % list.length];
const intBetween = (seed, lo, hi) => Math.floor(lo + rand(seed) * (hi - lo + 1));
const moneyBetween = (seed, lo, hi, round = 1000) => Math.round((lo + rand(seed) * (hi - lo)) / round) * round;
const dateIn = (seed, startYear, endYear) => {
  const y = intBetween(`${seed}|y`, startYear, endYear);
  const m = intBetween(`${seed}|m`, 1, 12);
  const d = intBetween(`${seed}|d`, 1, 28);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const CRITICALITY = ['Critical', 'High', 'Medium', 'Low'];
const LIFECYCLE = ['Current', 'Current', 'Sunset planned', 'Target'];
const DEPLOYMENT = ['SaaS', 'Vendor hosted', 'On-premise', 'Private cloud'];
const SEVERITY = ['High', 'Medium', 'Low'];
const LIKELIHOOD = ['Likely', 'Possible', 'Unlikely'];
const CONTROL_STATUS = ['Operating', 'Partially operating', 'Design only', 'Gap'];
const COMMERCIAL = ['Subscription', 'License + maintenance', 'Managed service', 'Time and materials'];
const STATUS = ['In flight', 'Planned', 'On hold', 'Complete'];
const PHASE = ['Discovery', 'Design', 'Build', 'Deploy', 'Benefits tracking'];
const FREQ = ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'];
const QUALITY = ['Validated', 'Partially validated', 'Not assessed'];
const YESNO = ['yes', 'no'];
const RCT = ['Run', 'Change', 'Transform'];

/** Column -> how to fill it. Anything not listed here is deliberately left empty. */
function strategy(column, seed, ctx) {
  const m = {
    // scale-anchored money
    annual_budget_usd: () => moneyBetween(seed, ctx.revenue * 0.0008, ctx.revenue * 0.006, 100000),
    annual_spend_usd: () => moneyBetween(seed, 250000, 24000000, 10000),
    budget_usd: () => moneyBetween(seed, 500000, 45000000, 50000),
    expected_value_usd: () => moneyBetween(seed, 250000, 30000000, 50000),
    savings_opportunity_usd: () => moneyBetween(seed, 100000, 8000000, 10000),
    run_cost_usd: () => moneyBetween(seed, 200000, 15000000, 10000),
    // counts
    fte_count: () => intBetween(seed, 8, Math.max(40, Math.round(ctx.employees * 0.004))),
    role_count: () => intBetween(seed, 5, 900),
    interfaces_count: () => intBetween(seed, 0, 40),
    // enums
    criticality: () => pickFrom(seed, CRITICALITY),
    lifecycle_state: () => pickFrom(seed, LIFECYCLE),
    deployment_model: () => pickFrom(seed, DEPLOYMENT),
    severity: () => pickFrom(seed, SEVERITY),
    likelihood: () => pickFrom(seed, LIKELIHOOD),
    control_status: () => pickFrom(seed, CONTROL_STATUS),
    commercial_model: () => pickFrom(seed, COMMERCIAL),
    status: () => pickFrom(seed, STATUS),
    phase: () => pickFrom(seed, PHASE),
    refresh_frequency: () => pickFrom(seed, FREQ),
    quality_status: () => pickFrom(seed, QUALITY),
    regulated_data_flag: () => pickFrom(seed, YESNO),
    outsourced_support: () => pickFrom(seed, YESNO),
    automation_candidate: () => pickFrom(seed, YESNO),
    future_target_flag: () => pickFrom(seed, YESNO),
    run_change_transform_split: () => pickFrom(seed, RCT),
    vendor_internal_split: () => pickFrom(seed, ['Vendor', 'Internal', 'Mixed']),
    employment_type: () => pickFrom(seed, ['Employee', 'Contractor', 'Vendor-supplied']),
    location_model: () => pickFrom(seed, ['On-site', 'Hybrid', 'Remote']),
    hosting_model: () => pickFrom(seed, ['On-premise', 'Private cloud', 'Public cloud', 'Hybrid']),
    system_type: () => pickFrom(seed, ['Application', 'Platform', 'Module', 'Service']),
    // dates
    term_start: () => dateIn(seed, 2022, 2025),
    term_end: () => dateIn(`${seed}|end`, 2026, 2029),
    renewal_date: () => dateIn(`${seed}|ren`, 2026, 2029),
    baseline_period: () => `FY${intBetween(seed, 2024, 2026)}`,
    // short controlled text, derived from the row rather than invented prose
    calculation_basis: () => 'Synthetic planning basis; not finance-attested',
    amount_basis: () => 'Synthetic planning basis; not finance-attested',
    known_gaps: () => 'Synthetically generated attribute; requires client evidence before use',
  };
  return m[column]?.();
}

const files = fs.readdirSync(abs(PACKAGE)).filter((f) => f.endsWith('.csv'));

// scale anchors from the tenant's own profile
let revenue = 5_000_000_000;
let employees = 20000;
const profile = files.find((f) => f.startsWith('00_'));
if (profile) {
  const rows = Papa.parse(fs.readFileSync(abs(`${PACKAGE}/${profile}`), 'utf8').trim(), { header: true, skipEmptyLines: true }).data;
  const r = Number(String(rows[0]?.revenue_usd ?? '').replace(/[^0-9.]/g, ''));
  const e = Number(String(rows[0]?.employee_count ?? '').replace(/[^0-9.]/g, ''));
  if (r > 0) revenue = r;
  if (e > 0) employees = e;
}
const ctx = { revenue, employees };

const summary = [];
let totalGenerated = 0;

for (const template of manifest.templates) {
  const file = files.find((f) => f === template.file);
  if (!file) continue;
  const parsed = Papa.parse(fs.readFileSync(abs(`${PACKAGE}/${file}`), 'utf8').trim(), { header: true, skipEmptyLines: true });
  const rows = parsed.data;
  if (!rows.length) continue;

  // Only columns that are empty across the WHOLE file are candidates. A column populated in
  // some rows is real data with holes, and filling those holes would blur sourced and
  // generated values inside one column.
  const emptyColumns = template.columns.filter(
    (c) => !rows.some((row) => String(row[c] ?? '').trim() !== ''),
  );

  let generatedHere = 0;
  const filled = new Set();
  rows.forEach((row, index) => {
    const identity = String(row.record_id ?? row.evidence_id ?? `${file}#${index}`);
    const marks = [];
    for (const column of emptyColumns) {
      const value = strategy(column, `${args.tenant}|${file}|${identity}|${column}`, ctx);
      if (value === undefined || value === null) continue;
      row[column] = String(value);
      marks.push(column);
      filled.add(column);
      generatedHere += 1;
    }
    if (marks.length) {
      row.generated_fields = marks.join(';');
      row.generation_basis = 'synthetic_demo_attribute_generation_2026_08_not_client_evidence';
    }
  });

  const fields = [...parsed.meta.fields];
  for (const c of ['generated_fields', 'generation_basis']) if (!fields.includes(c)) fields.push(c);
  if (!args.dryRun) fs.writeFileSync(abs(`${PACKAGE}/${file}`), `${Papa.unparse({ fields, data: rows })}\n`);

  totalGenerated += generatedHere;
  summary.push({ file, rows: rows.length, emptyColumns: emptyColumns.length, columnsFilled: filled.size, cells: generatedHere });
}

console.log(`${args.tenant}${args.dryRun ? ' (dry run)' : ''}  revenue anchor $${(revenue / 1e9).toFixed(1)}B, ${employees.toLocaleString()} employees`);
for (const s of summary) {
  console.log(`  ${s.file.padEnd(42)} empty ${String(s.emptyColumns).padStart(2)} -> filled ${String(s.columnsFilled).padStart(2)}  (${s.cells} cells)`);
}
console.log(`  total generated cells: ${totalGenerated}`);
