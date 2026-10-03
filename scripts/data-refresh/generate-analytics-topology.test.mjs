import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATOR = path.join(HERE, 'generate-analytics-topology.mjs');
const MINTER = path.join(HERE, '..', 'data', 'assign-stable-identity.mjs');
const GATE = path.join(HERE, '..', 'data', 'identity-ledger-check.mjs');
const TENANT = 'fixture-tenant';
const INPUT_ROOT = `datasets/tenant-inputs/active/${TENANT}/current`;
const LEDGER = `datasets/tenant-inputs/${TENANT}/identity-ledger.json`;

/**
 * Every destination the generator routes to must exist in 04 or it aborts, so the fixture
 * declares each one. Names are copied from the generator's route tables on purpose: a renamed
 * route that this list did not follow fails loudly at the generator's own `need()` check.
 */
const PLATFORMS = [
  'Teradata Enterprise Warehouse — Crew & Ops Subject Area',
  'Teradata Enterprise Warehouse — Finance Subject Area',
  'Teradata Enterprise Warehouse — Cargo Subject Area',
  'Teradata Enterprise Warehouse — Loyalty Legacy Subject Area',
  'Snowflake — Commercial Analytics Domain',
  'Snowflake — Loyalty & Personalization Domain',
  'Databricks — MRO Predictive Workspace',
  'Databricks — Ops AI Workspace',
  'Tableau Enterprise BI',
  'Power BI Premium (Finance & Ops)',
];
const INTEGRATION = 'Confluent Kafka Event Backbone';

const DECLARED = [
  { id: 'DAT-0000000001', name: 'Fares feed to inventory', source: 'Fare Engine', target: 'Inventory Hub', domain: 'Revenue Management & Pricing' },
  { id: 'DAT-0000000002', name: 'Crew roster sync', source: 'Crew Rostering', target: 'Inventory Hub', domain: 'Crew Operations' },
  { id: 'DAT-0000000003', name: 'Ledger postings', source: 'General Ledger', target: 'Inventory Hub', domain: 'Finance & Accounting' },
];

const FIVE_FIELDS = [
  'tenant_key', 'data_asset_id', 'data_asset_name', 'data_domain', 'source_system', 'target_system',
  'integration_type', 'platform_or_database', 'current_state_or_target_state', 'refresh_frequency',
  'quality_status', 'regulated_data_flag', 'analytics_usage', 'source_file', 'source_date', 'confidence',
  'known_gaps', 'source_classification', 'consolidation_rule_used',
];

/**
 * The generator, the minter and the gate all read relative to their working directory, so each
 * case builds a minimal repository in a temp dir: one registry-declared tenant, a one-type
 * ontology (data_asset, home dimension 05), the systems file, three operational flows whose ids
 * the ledger already declares, an empty relationships file and that ledger.
 */
function fixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'analytics-topology-'));
  const write = (rel, body) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  };
  const csv = (fields, data) => `${Papa.unparse({ fields, data }, { newline: '\n' })}\n`;
  write(
    'datasets/tenant-inputs/tenant-input-registry.json',
    JSON.stringify({ activeTenants: [{ tenantKey: TENANT, canonicalInputRoot: INPUT_ROOT }] }),
  );
  write(
    'datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json',
    JSON.stringify({ nodeTypes: [{ type: 'data_asset', homeDimension: '05_data_assets_integrations.csv', keyColumn: 'data_asset_name' }] }),
  );
  const systems = [
    ...PLATFORMS.map((name) => ({ system_name: name, system_category: 'Data & Analytics Platform' })),
    { system_name: INTEGRATION, system_category: 'Integration Platform' },
    ...['Fare Engine', 'Crew Rostering', 'General Ledger', 'Inventory Hub'].map((name) => ({ system_name: name, system_category: 'Operational' })),
  ];
  write(`${INPUT_ROOT}/04_applications_systems.csv`, csv(['system_name', 'system_category'], systems));
  write(
    `${INPUT_ROOT}/05_data_assets_integrations.csv`,
    csv(FIVE_FIELDS, DECLARED.map((d) => ({
      tenant_key: TENANT, data_asset_id: d.id, data_asset_name: d.name, data_domain: d.domain,
      source_system: d.source, target_system: d.target, refresh_frequency: 'daily_batch', regulated_data_flag: 'false',
    }))),
  );
  write(
    `${INPUT_ROOT}/12_relationships.csv`,
    csv(['from_object_type', 'from_object_name', 'to_object_type', 'to_object_name', 'from_object_id', 'to_object_id'], []),
  );
  write(
    LEDGER,
    JSON.stringify({
      schemaVersion: 1,
      tenantKey: TENANT,
      entries: DECLARED.map((d) => ({ id: d.id, type: 'data_asset', canonicalName: d.name, aliases: [], firstSeen: 'fixture' })),
    }),
  );
  return root;
}

const run = (root, script, args) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
const readFive = (root) =>
  Papa.parse(fs.readFileSync(path.join(root, INPUT_ROOT, '05_data_assets_integrations.csv'), 'utf8').trim(), { header: true }).data;
const readLedgerIds = (root) => new Set(JSON.parse(fs.readFileSync(path.join(root, LEDGER), 'utf8')).entries.map((e) => e.id));

function generate(root) {
  const result = run(root, GENERATOR, ['--tenant', TENANT, '--apply']);
  assert.equal(result.status, 0, result.stderr);
  const rows = readFive(root);
  const generated = rows.filter((row) => row.source_file === 'generated:analytics-topology');
  // A generator that produced nothing would pass every assertion below vacuously.
  assert.ok(generated.length >= 3, `expected generated rows, got ${generated.length}`);
  return { rows, generated };
}

test('the generator stamps no id of its own on the rows it generates', () => {
  const root = fixtureRepo();
  const { generated } = generate(root);
  const stamped = generated.filter((row) => row.data_asset_id.trim());
  assert.deepEqual(stamped.map((row) => `${row.data_asset_id} ${row.data_asset_name}`), []);
});

test('after a generator run, every id in the file is one the ledger declares', () => {
  const root = fixtureRepo();
  const { rows } = generate(root);
  const declared = readLedgerIds(root);
  const undeclared = rows.map((row) => row.data_asset_id.trim()).filter((id) => id && !declared.has(id));
  assert.deepEqual(undeclared, []);
  // The operational rows it was handed keep the ids they arrived with.
  for (const d of DECLARED) assert.equal(rows.find((row) => row.data_asset_name === d.name)?.data_asset_id, d.id);
});

test('a generator run followed by the owning minter leaves the ledger gate passing', () => {
  const root = fixtureRepo();
  const { generated } = generate(root);
  const minted = run(root, MINTER, ['--tenant', TENANT]);
  assert.equal(minted.status, 0, minted.stderr);
  const gate = run(root, GATE, ['--check']);
  assert.equal(gate.status, 0, gate.stdout + gate.stderr);
  assert.match(gate.stdout, new RegExp(`${TENANT}: PASS`));

  const declared = readLedgerIds(root);
  const after = readFive(root);
  for (const row of generated) {
    const id = after.find((r) => r.data_asset_name === row.data_asset_name)?.data_asset_id ?? '';
    assert.match(id, /^DAT-/, `${row.data_asset_name} was not minted by the owning minter`);
    assert.ok(declared.has(id), `${id} is not in the ledger`);
  }
});
