import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateTenantIdentity } from './identity-ledger-check.mjs';

const ontology = {
  nodeTypes: [
    { type: 'infrastructure', homeDimension: '06_infrastructure_platforms.csv', keyColumn: 'platform_name' },
    { type: 'org_unit', homeDimension: '02_org_ownership.csv', keyColumn: 'org_unit', alternateKeyColumns: ['leader_name_or_role'] },
  ],
};

const entry = (id, type, canonicalName, aliases = []) => ({ id, type, canonicalName, aliases });

/** A tenant that is clean in every respect; each case below breaks exactly one thing. */
function cleanTenant() {
  return {
    ontology,
    ledger: {
      entries: [
        entry('INF-aaaaaaaaaa', 'infrastructure', 'DC-East'),
        entry('INF-bbbbbbbbbb', 'infrastructure', 'Vendor SaaS'),
        entry('ORG-cccccccccc', 'org_unit', 'General Counsel & Chief Legal Officer'),
      ],
    },
    files: {
      '06_infrastructure_platforms.csv': {
        fields: ['platform_name', 'infrastructure_id'],
        rows: [
          { platform_name: 'DC-East', infrastructure_id: 'INF-aaaaaaaaaa' },
          { platform_name: 'Vendor SaaS', infrastructure_id: 'INF-bbbbbbbbbb' },
        ],
      },
      '02_org_ownership.csv': {
        fields: ['org_unit', 'leader_name_or_role', 'org_unit_id'],
        rows: [{ org_unit: 'General Counsel & Chief Legal Officer', leader_name_or_role: 'General Counsel', org_unit_id: 'ORG-cccccccccc' }],
      },
      '12_relationships.csv': {
        fields: ['from_object_type', 'from_object_name', 'to_object_type', 'to_object_name', 'from_object_id', 'to_object_id'],
        rows: [
          {
            from_object_type: 'org_unit',
            from_object_name: 'General Counsel',
            to_object_type: 'infrastructure',
            to_object_name: 'Vendor SaaS',
            from_object_id: 'ORG-cccccccccc',
            to_object_id: 'INF-bbbbbbbbbb',
          },
        ],
      },
    },
  };
}

const kinds = (result) => result.findings.map((finding) => finding.kind).sort();

test('a tenant whose files agree with its ledger has no findings, and counts match per type', () => {
  const result = evaluateTenantIdentity(cleanTenant());
  assert.deepEqual(result.findings, []);
  const infra = result.perType.find((t) => t.type === 'infrastructure');
  assert.equal(infra.distinctIds, 2);
  assert.equal(infra.ledgerEntries, 2);
  assert.equal(infra.unreachedLedgerEntries, 0);
  assert.deepEqual(result.edges, { file: '12_relationships.csv', edges: 1, endpoints: 2, resolved: 2 });
});

test('two rows inheriting one id are a shared_id, even when the ledger declares that id', () => {
  const tenant = cleanTenant();
  tenant.files['06_infrastructure_platforms.csv'].rows[1].infrastructure_id = 'INF-aaaaaaaaaa';
  // Keep the edge consistent with the inherited id so only the row-level failure is under test.
  tenant.files['12_relationships.csv'].rows[0].to_object_id = 'INF-aaaaaaaaaa';
  const result = evaluateTenantIdentity(tenant);
  const shared = result.findings.filter((f) => f.kind === 'shared_id');
  assert.equal(shared.length, 1);
  assert.equal(shared[0].id, 'INF-aaaaaaaaaa');
  assert.deepEqual(shared[0].rows.map((r) => r.row), [2, 3]);
});

test('an id the ledger never declared is undeclared_id, and so is a declared id of another type', () => {
  const tenant = cleanTenant();
  tenant.files['06_infrastructure_platforms.csv'].rows[0].infrastructure_id = 'GEN-ANL-0001';
  tenant.files['06_infrastructure_platforms.csv'].rows[1].infrastructure_id = 'ORG-cccccccccc';
  tenant.files['12_relationships.csv'].rows = [];
  assert.deepEqual(kinds(evaluateTenantIdentity(tenant)), ['undeclared_id', 'undeclared_id']);
});

test('a named row with no id, or a file with no id column, is unstamped_row', () => {
  const tenant = cleanTenant();
  tenant.files['06_infrastructure_platforms.csv'].rows[1].infrastructure_id = '';
  tenant.files['02_org_ownership.csv'].fields = ['org_unit', 'leader_name_or_role'];
  tenant.files['12_relationships.csv'].rows = [];
  assert.deepEqual(kinds(evaluateTenantIdentity(tenant)), ['unstamped_row', 'unstamped_row']);
});

test('a row with no name is not an object, so it owes no id', () => {
  const tenant = cleanTenant();
  tenant.files['06_infrastructure_platforms.csv'].rows.push({ platform_name: '  ', infrastructure_id: '' });
  assert.deepEqual(evaluateTenantIdentity(tenant).findings, []);
});

test('an edge carrying an id the ledger does not declare is edge_id_undeclared', () => {
  const tenant = cleanTenant();
  tenant.files['12_relationships.csv'].rows[0].to_object_id = 'INF-zzzzzzzzzz';
  assert.deepEqual(kinds(evaluateTenantIdentity(tenant)), ['edge_id_undeclared']);
});

test('an edge carrying a declared id of another type is edge_id_undeclared, not a wrong-row edge', () => {
  // The remedy differs: a wrong-row edge needs re-resolving, a wrong-type id was never valid here.
  const tenant = cleanTenant();
  tenant.files['12_relationships.csv'].rows[0].to_object_id = 'ORG-cccccccccc';
  assert.deepEqual(kinds(evaluateTenantIdentity(tenant)), ['edge_id_undeclared']);
});

test('an edge whose id is real but belongs to a row other than the one it names is edge_id_unreached', () => {
  const tenant = cleanTenant();
  tenant.files['12_relationships.csv'].rows[0].to_object_id = 'INF-aaaaaaaaaa';
  assert.deepEqual(kinds(evaluateTenantIdentity(tenant)), ['edge_id_unreached']);
});

test('an edge naming a row by its alternate key, or by a ledger alias, reaches that row', () => {
  const tenant = cleanTenant();
  tenant.ledger.entries[1].aliases = ['Vendor SaaS Platform'];
  tenant.files['12_relationships.csv'].rows[0].to_object_name = 'Vendor SaaS Platform';
  assert.deepEqual(evaluateTenantIdentity(tenant).findings, []);
});

test('a declared entry no row carries is counted, not failed -- the ledger is append-only', () => {
  const tenant = cleanTenant();
  tenant.ledger.entries.push(entry('INF-dddddddddd', 'infrastructure', 'Retired platform'));
  const result = evaluateTenantIdentity(tenant);
  assert.deepEqual(result.findings, []);
  assert.equal(result.perType.find((t) => t.type === 'infrastructure').unreachedLedgerEntries, 1);
});
