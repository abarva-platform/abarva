#!/usr/bin/env node

/**
 * Wave 1: give every graph node a stable identity, so edges join on an ID rather than a
 * display name.
 *
 * Today an edge says `to_object_name = "Amadeus IT Group"`. Rename that vendor and every
 * edge pointing at it silently stops resolving — and after a load, the breakage is in
 * Postgres with every projection built on top of it. Renaming is not exotic: it happens on
 * every merger, rebrand, and data-quality pass.
 *
 * Identity is PERSISTED, not derived. An ID is minted once and recorded in a per-tenant
 * identity ledger; every later run looks the name up and reuses the existing ID. This is the
 * distinction that makes the exercise worth anything: an ID derived from the name changes
 * when the name changes, which is precisely the failure it claims to prevent.
 *
 * A rename is therefore an ALIAS against an existing ID, declared in the ledger, not guessed
 * by the script. Automatic rename detection is string similarity wearing a suit; it would
 * silently merge two real objects the first time two vendors had similar names.
 *
 * Additive only. Columns are added; none are removed or rewritten.
 *
 * Usage: node scripts/data/assign-stable-identity.mjs --tenant <key> [--dry-run]
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
  if (process.argv[i] === '--tenant') {
    args.tenant = process.argv[i + 1];
    i += 1;
  } else if (process.argv[i] === '--dry-run') {
    args.dryRun = true;
  }
}
if (!args.tenant) {
  console.error('--tenant is required. Tenancy is declared, never inferred.');
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(abs('datasets/tenant-inputs/tenant-input-registry.json'), 'utf8'));
const tenant = (registry.activeTenants ?? []).find((entry) => entry.tenantKey === args.tenant);
if (!tenant) {
  console.error(`Tenant "${args.tenant}" is not registry-declared.`);
  process.exit(1);
}
const root = tenant.canonicalInputRoot;
const ontology = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/ontology.json`), 'utf8'));

/**
 * Normalisation is deliberately conservative — case and whitespace only. Anything more
 * aggressive (stripping punctuation, expanding abbreviations) would merge genuinely
 * distinct objects into a single identity, which is worse than leaving them separate.
 */
const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const ABBREVIATION = {
  system: 'SYS',
  infrastructure: 'INF',
  function: 'FN',
  org_unit: 'ORG',
  workforce_role: 'WFR',
  vendor: 'VEN',
  data_asset: 'DAT',
  program: 'PRG',
  risk: 'RSK',
  metric: 'MET',
  use_case: 'UC',
  tower_initiative: 'TI',
};

function stableId(type, name) {
  const digest = crypto
    .createHash('sha256')
    .update(`${args.tenant}|${type}|${normalise(name)}`)
    .digest('hex')
    .slice(0, 10);
  return `${ABBREVIATION[type] ?? type.toUpperCase().slice(0, 3)}-${digest}`;
}

function readCsv(file) {
  const target = abs(`${root}/${file}`);
  if (!fs.existsSync(target)) return null;
  const parsed = Papa.parse(fs.readFileSync(target, 'utf8').trim(), { header: true, skipEmptyLines: true });
  // Mixed line endings otherwise leave a stray carriage return in the final column of every
  // CRLF row on a parse/unparse round trip.
  for (const row of parsed.data) {
    for (const key of Object.keys(row)) {
      if (typeof row[key] === 'string' && row[key].includes('\r')) row[key] = row[key].replace(/\r/g, '');
    }
  }
  // A transform must never write a file it could not parse cleanly. Two source files carry an
  // unbalanced quote, which makes the parser merge a hundred fields into one row; writing that
  // interpretation back would silently delete rows. Refuse instead, and report it.
  const fatal = parsed.errors.filter((e) => e.code === 'TooManyFields' || e.code === 'TooFewFields' || e.code === 'MissingQuotes');
  return {
    rows: parsed.data,
    fields: (parsed.meta.fields ?? []).map((field) => field.replace(/\r/g, '')),
    parseErrors: fatal,
  };
}

function pick(contractFile) {
  const prefix = /^(\d{2})_/.exec(contractFile)?.[1];
  const files = fs.readdirSync(abs(root)).filter((file) => file.endsWith('.csv'));
  return (
    files.find((file) => file === contractFile) ??
    files.find((file) => /^(\d{2})_/.exec(file)?.[1] === prefix) ??
    ''
  );
}

// ---- identity ledger -------------------------------------------------------------------
const ledgerPath = `datasets/tenant-inputs/${args.tenant}/identity-ledger.json`;
const ledger = fs.existsSync(abs(ledgerPath))
  ? JSON.parse(fs.readFileSync(abs(ledgerPath), 'utf8'))
  : {
      schemaVersion: 1,
      tenantKey: args.tenant,
      why: 'An ID minted once and reused is what makes a rename survivable. Renaming an object updates its label and adds an alias here; the ID never moves, so no edge breaks.',
      renameProcedure: 'Add the new name to the aliases array of the existing entry, then re-run. Never delete an entry: a deleted ID orphans every edge that referenced it.',
      entries: [],
    };

const ledgerByAlias = new Map();
for (const entry of ledger.entries) {
  for (const alias of [entry.canonicalName, ...(entry.aliases ?? [])]) {
    ledgerByAlias.set(`${entry.type} ${normalise(alias)}`, entry);
  }
}

let minted = 0;
let reused = 0;

function identityFor(type, name) {
  const key = `${type} ${normalise(name)}`;
  const existing = ledgerByAlias.get(key);
  if (existing) {
    reused += 1;
    return existing.id;
  }
  const id = stableId(type, name);
  const entry = { id, type, canonicalName: name, aliases: [], firstSeen: 'wave1' };
  ledger.entries.push(entry);
  ledgerByAlias.set(key, entry);
  minted += 1;
  return id;
}

const summary = [];
const blocked = [];
const idByTypeName = new Map();
const claimedHomeDimensions = new Set();

// 1. Stamp an ID column on every node-type home dimension.
for (const spec of ontology.nodeTypes) {
  if (spec.resolutionMode === 'external-evidence-root') continue;
  const file = pick(spec.homeDimension);
  if (!file) continue;
  // Two node types can declare the same home dimension (a declared-gap type pointing at an
  // existing table). Only the first stamps an ID column; a second would put two different
  // IDs on the same row for the same object.
  if (claimedHomeDimensions.has(file)) continue;
  claimedHomeDimensions.add(file);
  const parsed = readCsv(file);
  if (!parsed) continue;

  const idColumn = `${spec.type}_id`;
  const keyColumns = [spec.keyColumn, ...(spec.alternateKeyColumns ?? [])];
  let stamped = 0;

  for (const row of parsed.rows) {
    const name = keyColumns.map((key) => String(row[key] ?? '').trim()).find(Boolean) ?? '';
    if (!name) {
      row[idColumn] = '';
      continue;
    }
    const id = identityFor(spec.type, name);
    row[idColumn] = id;
    stamped += 1;
    for (const key of keyColumns) {
      const value = String(row[key] ?? '').trim();
      if (value) idByTypeName.set(`${spec.type} ${normalise(value)}`, id);
    }
  }

  if (parsed.parseErrors.length) {
    blocked.push({ file, reason: parsed.parseErrors[0].message });
    continue;
  }
  const fields = parsed.fields.includes(idColumn) ? parsed.fields : [...parsed.fields, idColumn];
  if (!args.dryRun) fs.writeFileSync(abs(`${root}/${file}`), `${Papa.unparse({ fields, data: parsed.rows })}\n`);
  summary.push({ file, idColumn, rows: parsed.rows.length, stamped });
}

// 2. Resolve every edge endpoint to an ID. An endpoint that cannot be resolved gets a blank
//    ID and is reported — never a fabricated one, which would look like a working edge.
const relationshipsFile = pick('12_relationships.csv');
let edgeStats = null;
if (relationshipsFile) {
  const parsed = readCsv(relationshipsFile);
  if (parsed.parseErrors.length) {
    blocked.push({ file: relationshipsFile, reason: parsed.parseErrors[0].message });
    parsed.rows = [];
  }
  let resolved = 0;
  let unresolved = 0;
  const unresolvedByType = {};

  for (const row of parsed.rows) {
    for (const side of ['from', 'to']) {
      const type = String(row[`${side}_object_type`] ?? '').trim();
      const name = String(row[`${side}_object_name`] ?? '').trim();
      // Resolve through the ledger, not just the dimension's current names. An edge that
      // still carries a pre-rename label must still resolve to the same object, otherwise
      // the ledger protects the node and abandons every edge pointing at it.
      const key = type && name ? `${type} ${normalise(name)}` : '';
      const id = key ? (idByTypeName.get(key) ?? ledgerByAlias.get(key)?.id) : undefined;
      row[`${side}_object_id`] = id ?? '';
      if (id) resolved += 1;
      else if (type && name) {
        unresolved += 1;
        unresolvedByType[type] = (unresolvedByType[type] ?? 0) + 1;
      }
    }
  }

  const fields = [...parsed.fields];
  for (const column of ['from_object_id', 'to_object_id']) {
    if (!fields.includes(column)) fields.push(column);
  }
  if (!args.dryRun && parsed.rows.length) {
    fs.writeFileSync(abs(`${root}/${relationshipsFile}`), `${Papa.unparse({ fields, data: parsed.rows })}\n`);
  }
  edgeStats = { edges: parsed.rows.length, resolved, unresolved, unresolvedByType };
}

if (!args.dryRun) {
  fs.mkdirSync(path.dirname(abs(ledgerPath)), { recursive: true });
  ledger.entries.sort((a, b) => a.type.localeCompare(b.type) || a.canonicalName.localeCompare(b.canonicalName));
  fs.writeFileSync(abs(ledgerPath), `${JSON.stringify(ledger, null, 2)}\n`);
}

console.log(`${args.tenant}${args.dryRun ? ' (dry run)' : ''}`);
console.log(`  identity ledger: ${ledger.entries.length} entries (minted ${minted}, reused ${reused}) -> ${ledgerPath}`);
for (const entry of summary) {
  console.log(`  ${entry.file.padEnd(44)} ${entry.idColumn.padEnd(20)} ${entry.stamped}/${entry.rows}`);
}
if (blocked.length) {
  console.log('  BLOCKED (malformed CSV, not written):');
  for (const b of blocked) console.log(`    ${b.file} -- ${b.reason}`);
}
if (edgeStats) {
  const total = edgeStats.resolved + edgeStats.unresolved;
  const pct = Math.round((100 * edgeStats.resolved) / Math.max(1, total));
  console.log(`  edges ${edgeStats.edges}: endpoints resolved to an ID ${edgeStats.resolved}/${total} (${pct}%)`);
  if (edgeStats.unresolved) {
    console.log(`    unresolved by type: ${JSON.stringify(edgeStats.unresolvedByType)}`);
  }
}
