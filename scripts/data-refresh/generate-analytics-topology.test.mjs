import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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

/**
 * D-515. The header claims "Running it twice produces identical output", and that held only for
 * the generated SET -- not for the file it writes. The generated rows are appended to everything
 * already in the file, including the rows an earlier run put there, so a second `--apply` emitted
 * a second copy of every feed and serving hop. The ledger gate caught the result, which is why
 * this was found at all, but the generator is what produced it.
 *
 * The acceptance is byte-identity rather than a row count, because a count is satisfied by a
 * rewrite that reorders rows or drops a terminator and an operator diffing the file would see
 * churn that means nothing.
 */
const fivePathIn = (root) => path.join(root, INPUT_ROOT, '05_data_assets_integrations.csv');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const applyAgain = (root) => {
  const again = run(root, GENERATOR, ['--tenant', TENANT, '--apply']);
  assert.equal(again.status, 0, again.stderr);
  return again;
};

test('a second --apply on an already-generated tenant leaves the file byte-identical', () => {
  const root = fixtureRepo();
  const { generated } = generate(root);
  const before = sha256(fivePathIn(root));

  applyAgain(root);

  assert.equal(sha256(fivePathIn(root)), before, 'the second --apply rewrote the file');
  // Byte-identity is the acceptance, but state the defect's own shape too: a duplicate of every
  // generated row is what byte-identity is standing in for here.
  const after = readFive(root);
  const names = after.map((row) => row.data_asset_name);
  assert.deepEqual(
    names.filter((name, i) => names.indexOf(name) !== i),
    [],
    'the second --apply appended rows the file already held',
  );
  assert.equal(after.filter((row) => row.source_file === 'generated:analytics-topology').length, generated.length);
});

test('a second --apply after the owning minter has run leaves the ledger gate passing', () => {
  const root = fixtureRepo();
  generate(root);
  const minted = run(root, MINTER, ['--tenant', TENANT]);
  assert.equal(minted.status, 0, minted.stderr);
  assert.equal(run(root, GATE, ['--check']).status, 0, 'the fixture does not start from a passing gate');
  const before = sha256(fivePathIn(root));
  const idsBefore = readFive(root).map((row) => `${row.data_asset_name}=${row.data_asset_id}`);

  applyAgain(root);

  // The minted ids are the reason this is a skip rather than a rebuild: regenerating the rows
  // would blank ids the ledger has already declared, which the gate reads as a lost object.
  assert.deepEqual(readFive(root).map((row) => `${row.data_asset_name}=${row.data_asset_id}`), idsBefore);
  assert.equal(sha256(fivePathIn(root)), before, 'the second --apply rewrote a minted file');
  const gate = run(root, GATE, ['--check']);
  assert.equal(gate.status, 0, gate.stdout + gate.stderr);
  assert.match(gate.stdout, new RegExp(`${TENANT}: PASS`));
});

test('a CRLF input keeps its CRLF terminators', () => {
  const root = fixtureRepo();
  const five = fivePathIn(root);
  fs.writeFileSync(five, fs.readFileSync(five, 'utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'));

  const result = run(root, GENERATOR, ['--tenant', TENANT, '--apply']);
  assert.equal(result.status, 0, result.stderr);

  // The minter has preserved the terminator the file arrived with since D-501; a generator that
  // rewrites the same file LF-only makes every run after a CRLF intake a whole-file diff.
  const written = fs.readFileSync(five, 'utf8');
  assert.ok(written.includes('\r\n'), 'the CRLF terminators were rewritten LF-only');
  // Remove the CRLF pairs and nothing that ends a line may be left. A `/(.?)\n/` scan cannot
  // express this: `.` excludes \r, so it reports every correct CRLF as a bare LF.
  assert.equal(written.replace(/\r\n/g, '').includes('\n'), false, 'the rewritten file mixes bare LF into a CRLF file');
  assert.equal((written.match(/\r\n/g) ?? []).length, written.split('\r\n').length - 1);
});

/**
 * The counterpart direction, and the reason the terminator is detected rather than fixed to either
 * value. Every tenant input in the repository is LF today, so a generator hard-wired to CRLF --
 * which is what `Papa.unparse` would default to, and the defect the minter's own D-501 comment
 * warns about -- would turn a one-row change into a whole-file diff just as surely.
 *
 * This case is NOT red on the pre-D-515 generator: that generator wrote LF unconditionally and so
 * satisfied it by accident. It is here because the CRLF case alone leaves the LF direction
 * unguarded, and a mutation fixing the terminator to '\r\n' passes every other case in this file.
 */
test('an LF input stays LF', () => {
  const root = fixtureRepo();
  generate(root);
  assert.equal(fs.readFileSync(fivePathIn(root), 'utf8').includes('\r'), false, 'an LF intake was rewritten with CRLF');
});
