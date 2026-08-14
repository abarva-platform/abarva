#!/usr/bin/env node

/**
 * Wave 2: declare segmentation once on the function dimension, then inherit it across the
 * graph.
 *
 * The point of doing it this way: a client tags roughly twenty business functions, not five
 * hundred systems. Everything that connects to a function through a propagating edge picks
 * up that function's line of business and tier. Asking a client to segment every system by
 * hand is how segmentation projects die.
 *
 * Two rules that decide whether the result is trustworthy:
 *
 *   1. Inheritance yields a SET, not a value. A system supporting both care delivery and the
 *      patient portal is correctly both middle and front, and flattening that to one value
 *      would be a lie that reads as precision.
 *   2. A node connected to no segmented function is written as UNDECLARED and counted. It is
 *      never defaulted to back office. A defaulted segment is a wrong answer wearing the
 *      appearance of a right one, and it is unfalsifiable downstream.
 *
 * Additive: two columns are added to the function dimension and two to every other node
 * dimension. Nothing is removed or rewritten.
 *
 * Usage: node scripts/data/apply-segmentation.mjs --tenant <key> [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const abs = (p) => path.join(ROOT, p);
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';
const UNDECLARED = 'UNDECLARED';

const args = { tenant: '', dryRun: false, packageRoot: '' };
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--tenant') { args.tenant = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--package-root') { args.packageRoot = process.argv[i + 1]; i += 1; }
  else if (process.argv[i] === '--dry-run') args.dryRun = true;
}
if (!args.tenant) { console.error('--tenant is required. Tenancy is declared, never inferred.'); process.exit(1); }

const registry = JSON.parse(fs.readFileSync(abs('datasets/tenant-inputs/tenant-input-registry.json'), 'utf8'));
const tenantEntry = (registry.activeTenants ?? []).find((t) => t.tenantKey === args.tenant);
if (!tenantEntry) { console.error(`Tenant "${args.tenant}" is not registry-declared.`); process.exit(1); }
const root = args.packageRoot || tenantEntry.canonicalInputRoot;

const segPath = `datasets/tenant-inputs/${args.tenant}/segmentation.json`;
if (!fs.existsSync(abs(segPath))) { console.error(`No segmentation declaration at ${segPath}`); process.exit(1); }
const segmentation = JSON.parse(fs.readFileSync(abs(segPath), 'utf8'));
const ontology = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/ontology.json`), 'utf8'));

const propagating = new Set(ontology.segmentation?.inheritance?.propagatesVia ?? []);
const nodeTypes = ontology.nodeTypes.filter((n) => n.resolutionMode !== 'external-evidence-root');

const normalise = (v) => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

function readCsv(file) {
  const target = abs(`${root}/${file}`);
  if (!fs.existsSync(target)) return null;
  const parsed = Papa.parse(fs.readFileSync(target, 'utf8').trim(), { header: true, skipEmptyLines: true });
  for (const row of parsed.data) {
    for (const key of Object.keys(row)) {
      if (typeof row[key] === 'string' && row[key].includes('\r')) row[key] = row[key].replace(/\r/g, '');
    }
  }
  const fatal = parsed.errors.filter((e) => ['TooManyFields', 'TooFewFields', 'MissingQuotes'].includes(e.code));
  return { rows: parsed.data, fields: (parsed.meta.fields ?? []).map((f) => f.replace(/\r/g, '')), fatal };
}

function pick(contractFile) {
  const prefix = /^(\d{2})_/.exec(contractFile)?.[1];
  const files = fs.readdirSync(abs(root)).filter((f) => f.endsWith('.csv'));
  return files.find((f) => f === contractFile) ?? files.find((f) => /^(\d{2})_/.exec(f)?.[1] === prefix) ?? '';
}

const write = (file, fields, rows) => {
  if (!args.dryRun) fs.writeFileSync(abs(`${root}/${file}`), `${Papa.unparse({ fields, data: rows })}\n`);
};

const blocked = [];

// ---- 1. stamp the declared segments onto the function dimension -------------------------
const functionFile = pick('01_business_functions.csv');
const declaredByFunction = new Map(
  segmentation.functions.map((f) => [normalise(f.function_name), f]),
);
let functionsSegmented = 0;
let functionsUnsegmented = 0;

if (functionFile) {
  const parsed = readCsv(functionFile);
  if (parsed.fatal.length) {
    blocked.push({ file: functionFile, reason: parsed.fatal[0].message });
  } else {
    for (const row of parsed.rows) {
      const name = String(row.function_name ?? '').trim();
      const declared = declaredByFunction.get(normalise(name));
      if (declared) {
        row.line_of_business = declared.line_of_business;
        row.function_tier = declared.function_tier;
        functionsSegmented += 1;
      } else {
        row.line_of_business = UNDECLARED;
        row.function_tier = UNDECLARED;
        functionsUnsegmented += 1;
      }
    }
    const fields = [...parsed.fields];
    for (const c of ['line_of_business', 'function_tier']) if (!fields.includes(c)) fields.push(c);
    write(functionFile, fields, parsed.rows);
  }
}

// ---- 2. build function-name -> segments, then walk the graph ----------------------------
const segmentsByFunctionName = new Map();
for (const f of segmentation.functions) {
  segmentsByFunctionName.set(normalise(f.function_name), {
    lob: new Set(String(f.line_of_business).split(';').map((s) => s.trim()).filter(Boolean)),
    tier: new Set(String(f.function_tier).split(';').map((s) => s.trim()).filter(Boolean)),
  });
}

/**
 * `${type}|${normalisedName}` -> { lob:Set, tier:Set, hops:number }
 *
 * Segmentation propagates outward from functions along propagating edges until it stops
 * spreading or hits the hop limit. One hop is a system that supports a function; two is the
 * infrastructure that system runs on; three is a risk attached to that infrastructure. The
 * hop count is written out with the segments, because a three-hop inference and a declared
 * value are not the same claim and should not look alike downstream.
 */
const MAX_HOPS = 3;
const inherited = new Map();
const relFile = pick('12_relationships.csv');
let edgesConsidered = 0;
let edgeList = [];

if (relFile) {
  const parsed = readCsv(relFile);
  if (parsed.fatal.length) {
    blocked.push({ file: relFile, reason: parsed.fatal[0].message });
  } else {
    for (const row of parsed.rows) {
      const type = String(row.relationship_type ?? '').trim();
      if (!propagating.has(type)) continue;
      const a = { type: String(row.from_object_type ?? '').trim(), name: String(row.from_object_name ?? '').trim() };
      const b = { type: String(row.to_object_type ?? '').trim(), name: String(row.to_object_name ?? '').trim() };
      if (!a.type || !a.name || !b.type || !b.name) continue;
      edgeList.push([a, b]);
    }
  }
}

const keyOf = (end) => `${end.type}|${normalise(end.name)}`;

// Seed: every function that carries a declared segment.
for (const [name, segs] of segmentsByFunctionName) {
  inherited.set(`function|${name}`, { lob: new Set(segs.lob), tier: new Set(segs.tier), hops: 0 });
}

// Spread outward one hop at a time. Segments only ever accumulate, so this converges.
for (let hop = 1; hop <= MAX_HOPS; hop += 1) {
  let changed = false;
  for (const [a, b] of edgeList) {
    for (const [src, dst] of [[a, b], [b, a]]) {
      const from = inherited.get(keyOf(src));
      if (!from || from.hops !== hop - 1) continue;
      if (dst.type === 'function') continue;
      const key = keyOf(dst);
      const existing = inherited.get(key);
      if (existing && existing.hops < hop) {
        // Already reached by a shorter path; still union the segments, keep the shorter hop.
        const before = existing.lob.size + existing.tier.size;
        for (const v of from.lob) existing.lob.add(v);
        for (const v of from.tier) existing.tier.add(v);
        if (existing.lob.size + existing.tier.size !== before) changed = true;
        continue;
      }
      const target = existing ?? { lob: new Set(), tier: new Set(), hops: hop };
      const before = target.lob.size + target.tier.size;
      for (const v of from.lob) target.lob.add(v);
      for (const v of from.tier) target.tier.add(v);
      if (!existing || target.lob.size + target.tier.size !== before) changed = true;
      inherited.set(key, target);
      edgesConsidered += 1;
    }
  }
  if (!changed) break;
}

// ---- 3. write inherited segments onto every other node dimension ------------------------
const coverage = [];
const hopHistogram = {};
// Two node types can share a home dimension (a declared-gap type pointing at an existing
// table). Processing it twice makes the second pass overwrite the first with UNDECLARED.
const claimedHomes = new Set();
for (const spec of nodeTypes) {
  if (spec.type === 'function') continue;
  const file = pick(spec.homeDimension);
  if (!file || claimedHomes.has(file)) continue;
  claimedHomes.add(file);
  const parsed = readCsv(file);
  if (!parsed) continue;
  if (parsed.fatal.length) { blocked.push({ file, reason: parsed.fatal[0].message }); continue; }

  const keyColumns = [spec.keyColumn, ...(spec.alternateKeyColumns ?? [])];
  let declared = 0;
  for (const row of parsed.rows) {
    const name = keyColumns.map((k) => String(row[k] ?? '').trim()).find(Boolean) ?? '';
    const segs = name ? inherited.get(`${spec.type}|${normalise(name)}`) : undefined;
    if (segs && (segs.lob.size || segs.tier.size)) {
      row.inherited_line_of_business = [...segs.lob].sort().join(';') || UNDECLARED;
      row.inherited_function_tier = [...segs.tier].sort().join(';') || UNDECLARED;
      row.inherited_segment_hops = String(segs.hops);
      declared += 1;
      hopHistogram[segs.hops] = (hopHistogram[segs.hops] ?? 0) + 1;
    } else {
      row.inherited_line_of_business = UNDECLARED;
      row.inherited_function_tier = UNDECLARED;
      row.inherited_segment_hops = '';
    }
  }
  const fields = [...parsed.fields];
  for (const c of ['inherited_line_of_business', 'inherited_function_tier', 'inherited_segment_hops']) if (!fields.includes(c)) fields.push(c);
  write(file, fields, parsed.rows);
  coverage.push({ file, type: spec.type, rows: parsed.rows.length, declared });
}

console.log(`${args.tenant}${args.dryRun ? ' (dry run)' : ''}  root=${root}`);
console.log(`  functions segmented        : ${functionsSegmented}`);
console.log(`  functions left UNDECLARED  : ${functionsUnsegmented}`);
console.log(`  propagating edge traversals: ${edgesConsidered}`);
for (const c of coverage) {
  const pct = c.rows ? Math.round((100 * c.declared) / c.rows) : 0;
  console.log(`  ${c.file.padEnd(42)} ${String(c.declared).padStart(4)}/${String(c.rows).padEnd(5)} segmented (${pct}%)`);
}
console.log(`  hop distance of inherited segments: ${JSON.stringify(hopHistogram)}  (0 = declared on the function itself)`);
if (blocked.length) {
  console.log('  BLOCKED (malformed CSV, not written):');
  for (const b of blocked) console.log(`    ${b.file} -- ${b.reason}`);
}
