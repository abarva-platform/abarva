#!/usr/bin/env node

/**
 * Reads a tenant's committed intake against its identity ledger and fails on any object id the
 * ledger cannot stand behind.
 *
 * `assign-stable-identity.mjs` is the only thing allowed to mint an object id, and it records
 * every id it mints in `datasets/tenant-inputs/<tenant>/identity-ledger.json`. Nothing checked
 * that the files still agreed with it, and three ways of disagreeing went unseen for weeks:
 *
 *   - a row appended as `{ ...template }` inherits the template row's id, so fourteen platforms
 *     answered to one id and every edge naming any of them resolved to whichever came first;
 *   - a generator stamped ids of its own (`GEN-ANL-0001`...) that no ledger declares;
 *   - rows appended after the last mint carried no id at all.
 *
 * Each is a layer-3 identity failure, and each looked like a working id to every reader. This
 * check reads the committed files as they stand -- deliberately not a dry run of the minter,
 * which reports what it *would* fix and so passes on exactly the files that need fixing.
 *
 * Usage: node scripts/data/identity-ledger-check.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';

/** Same normalisation as the minter: case and whitespace only. */
export const normalise = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/** The home-dimension file a node type stamps, chosen exactly as the minter chooses it. */
export function homeFiles(ontology, fileNames) {
  const claimed = new Set();
  const result = [];
  for (const spec of ontology.nodeTypes) {
    if (spec.resolutionMode === 'external-evidence-root') continue;
    const prefix = /^(\d{2})_/.exec(spec.homeDimension)?.[1];
    const file =
      fileNames.find((name) => name === spec.homeDimension) ??
      fileNames.find((name) => /^(\d{2})_/.exec(name)?.[1] === prefix);
    if (!file || claimed.has(file)) continue;
    claimed.add(file);
    result.push({ spec, file });
  }
  return result;
}

/**
 * @param {object} input
 * @param {{ nodeTypes: object[] }} input.ontology
 * @param {Record<string, { fields: string[], rows: object[] }>} input.files  parsed CSVs by name
 * @param {{ entries: { id: string, type: string, canonicalName: string, aliases?: string[] }[] }} input.ledger
 * @returns {{ findings: object[], perType: object[], edges: object | null }}
 */
export function evaluateTenantIdentity({ ontology, files, ledger }) {
  const findings = [];
  const declared = new Map(ledger.entries.map((entry) => [entry.id, entry]));
  const reach = new Map();
  const addReach = (type, name, id) => {
    const key = `${type} ${normalise(name)}`;
    if (!reach.has(key)) reach.set(key, new Set());
    reach.get(key).add(id);
  };
  for (const entry of ledger.entries) {
    for (const alias of [entry.canonicalName, ...(entry.aliases ?? [])]) addReach(entry.type, alias, entry.id);
  }

  const perType = [];
  for (const { spec, file } of homeFiles(ontology, Object.keys(files))) {
    const { fields, rows } = files[file];
    const idColumn = `${spec.type}_id`;
    const keyColumns = [spec.keyColumn, ...(spec.alternateKeyColumns ?? [])];
    const carriers = new Map();
    let named = 0;
    rows.forEach((row, index) => {
      const name = keyColumns.map((key) => String(row[key] ?? '').trim()).find(Boolean) ?? '';
      if (!name) return;
      named += 1;
      const id = String(row[idColumn] ?? '').trim();
      if (!fields.includes(idColumn) || !id) {
        findings.push({ kind: 'unstamped_row', type: spec.type, file, row: index + 2, name });
        return;
      }
      const entry = declared.get(id);
      if (!entry || entry.type !== spec.type) {
        findings.push({ kind: 'undeclared_id', type: spec.type, file, row: index + 2, name, id });
      }
      if (!carriers.has(id)) carriers.set(id, []);
      carriers.get(id).push({ row: index + 2, name });
      for (const key of keyColumns) {
        const value = String(row[key] ?? '').trim();
        if (value) addReach(spec.type, value, id);
      }
    });
    for (const [id, rowsCarrying] of carriers) {
      if (rowsCarrying.length > 1) findings.push({ kind: 'shared_id', type: spec.type, file, id, rows: rowsCarrying });
    }
    const ledgerIds = ledger.entries.filter((entry) => entry.type === spec.type).map((entry) => entry.id);
    perType.push({
      type: spec.type,
      file,
      rows: rows.length,
      named,
      distinctIds: carriers.size,
      ledgerEntries: ledgerIds.length,
      // Declared but carried by no row. Not a failure -- the ledger is append-only by rule, so a
      // removed row leaves its entry behind on purpose -- but it is printed, because an id the
      // ledger declares and nothing carries is exactly what a renumbering looks like.
      unreachedLedgerEntries: ledgerIds.filter((id) => !carriers.has(id)).length,
    });
  }

  const relationshipsFile = Object.keys(files).find((name) => /^12_/.test(name));
  let edges = null;
  if (relationshipsFile) {
    const { rows } = files[relationshipsFile];
    let resolved = 0;
    let endpoints = 0;
    rows.forEach((row, index) => {
      for (const side of ['from', 'to']) {
        const type = String(row[`${side}_object_type`] ?? '').trim();
        const name = String(row[`${side}_object_name`] ?? '').trim();
        const id = String(row[`${side}_object_id`] ?? '').trim();
        if (type && name) endpoints += 1;
        if (!id) continue;
        resolved += 1;
        const entry = declared.get(id);
        if (!entry || entry.type !== type) {
          findings.push({ kind: 'edge_id_undeclared', file: relationshipsFile, row: index + 2, side, type, name, id });
        } else if (!reach.get(`${type} ${normalise(name)}`)?.has(id)) {
          // The id is real, but the name on this edge does not reach it: the edge points at a row
          // other than the one it names. This is what an inherited id does to every edge.
          findings.push({ kind: 'edge_id_unreached', file: relationshipsFile, row: index + 2, side, type, name, id });
        }
      }
    });
    edges = { file: relationshipsFile, edges: rows.length, endpoints, resolved };
  }

  return { findings, perType, edges };
}

function readTenant(root, tenant) {
  const abs = (rel) => path.join(root, rel);
  const ledgerPath = `datasets/tenant-inputs/${tenant.tenantKey}/identity-ledger.json`;
  if (!fs.existsSync(abs(ledgerPath))) return { ledgerPath, ledger: null };
  const ledger = JSON.parse(fs.readFileSync(abs(ledgerPath), 'utf8'));
  const ontology = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/ontology.json`), 'utf8'));
  const files = {};
  for (const name of fs.readdirSync(abs(tenant.canonicalInputRoot)).filter((file) => file.endsWith('.csv'))) {
    const parsed = Papa.parse(fs.readFileSync(abs(`${tenant.canonicalInputRoot}/${name}`), 'utf8').replace(/\r/g, '').trim(), {
      header: true,
      skipEmptyLines: true,
    });
    files[name] = { fields: parsed.meta.fields ?? [], rows: parsed.data };
  }
  return { ledgerPath, ledger, ontology, files };
}

function main() {
  if (!process.argv.includes('--check')) {
    console.error('Usage: node scripts/data/identity-ledger-check.mjs --check');
    process.exit(2);
  }
  const root = process.cwd();
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'datasets/tenant-inputs/tenant-input-registry.json'), 'utf8'));
  let failures = 0;
  let measured = 0;
  for (const tenant of registry.activeTenants ?? []) {
    const { ledgerPath, ledger, ontology, files } = readTenant(root, tenant);
    if (!ledger) {
      // Printed, never skipped silently: "no ledger" and "clean" must not look alike. And it fails:
      // every registered tenant is minted, so a missing ledger is one deleted or never written, and
      // a tenant nobody can measure must not pass on the strength of the ones somebody can.
      console.log(`${tenant.tenantKey}: NOT MEASURED -- no identity ledger at ${ledgerPath}`);
      failures += 1;
      continue;
    }
    measured += 1;
    const { findings, perType, edges } = evaluateTenantIdentity({ ontology, files, ledger });
    console.log(`${tenant.tenantKey}: ${findings.length ? `FAIL ${findings.length}` : 'PASS'}`);
    for (const t of perType) {
      console.log(
        `  ${t.type.padEnd(18)} ${t.file.padEnd(40)} rows ${t.rows}  ids ${t.distinctIds}  ledger ${t.ledgerEntries}  declared-but-uncarried ${t.unreachedLedgerEntries}`,
      );
    }
    if (edges) console.log(`  ${edges.file}: ${edges.edges} edges, endpoints with an id ${edges.resolved}/${edges.endpoints}`);
    const byKind = {};
    for (const finding of findings) byKind[finding.kind] = (byKind[finding.kind] ?? 0) + 1;
    for (const [kind, count] of Object.entries(byKind)) {
      console.log(`  ${kind}: ${count}`);
      for (const finding of findings.filter((f) => f.kind === kind).slice(0, 5)) console.log(`    ${JSON.stringify(finding)}`);
    }
    failures += findings.length;
  }
  if (!measured) {
    console.error('No registered tenant has an identity ledger, so nothing was checked.');
    process.exit(1);
  }
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
