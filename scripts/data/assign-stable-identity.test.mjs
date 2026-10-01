import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assign-stable-identity.mjs');
const TENANT = 'fixture-tenant';
const INPUT_ROOT = `datasets/tenant-inputs/active/${TENANT}/current`;
const LEDGER = `datasets/tenant-inputs/${TENANT}/identity-ledger.json`;

/**
 * The minter reads everything relative to its working directory, so each case builds a minimal
 * repository in a temp dir: a registry declaring one tenant, a one-type ontology whose home
 * dimension has an alternate key column, the dimension, the relationships file and a ledger.
 */
function fixtureRepo({ orgRows, edges, ledgerEntries }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stable-identity-'));
  const write = (rel, body) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  };
  write(
    'datasets/tenant-inputs/tenant-input-registry.json',
    JSON.stringify({ activeTenants: [{ tenantKey: TENANT, canonicalInputRoot: INPUT_ROOT }] }),
  );
  write(
    'datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json',
    JSON.stringify({
      nodeTypes: [
        {
          type: 'org_unit',
          homeDimension: '02_org_ownership.csv',
          keyColumn: 'org_unit',
          alternateKeyColumns: ['leader_name_or_role'],
        },
      ],
    }),
  );
  write(`${INPUT_ROOT}/02_org_ownership.csv`, `${Papa.unparse({ fields: ['org_unit', 'leader_name_or_role', 'org_unit_id'], data: orgRows }, { newline: '\n' })}\n`);
  write(
    `${INPUT_ROOT}/12_relationships.csv`,
    `${Papa.unparse({
      fields: ['from_object_type', 'from_object_name', 'to_object_type', 'to_object_name', 'from_object_id', 'to_object_id'],
      data: edges,
    }, { newline: '\n' })}\n`,
  );
  write(LEDGER, JSON.stringify({ schemaVersion: 1, tenantKey: TENANT, entries: ledgerEntries }));
  return root;
}

function mint(root) {
  const run = spawnSync(process.execPath, [SCRIPT, '--tenant', TENANT], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const read = (file) => Papa.parse(fs.readFileSync(path.join(root, INPUT_ROOT, file), 'utf8').trim(), { header: true }).data;
  return { orgs: read('02_org_ownership.csv'), edges: read('12_relationships.csv') };
}

const entry = (id, canonicalName, aliases = []) => ({ id, type: 'org_unit', canonicalName, aliases, firstSeen: 'wave1' });

test('an edge whose name now matches two rows keeps the declared id it already carried', () => {
  // The full row is named by its leader title through the alternate key; a stub appended later
  // carries that title as its own name. Both now answer to "general counsel". The edge was
  // resolved to the full row when only it existed, and re-running must not move it to the stub.
  const root = fixtureRepo({
    orgRows: [
      { org_unit: 'General Counsel & Chief Legal Officer', leader_name_or_role: 'General Counsel', org_unit_id: 'ORG-full000001' },
      { org_unit: 'General Counsel', leader_name_or_role: '', org_unit_id: '' },
    ],
    edges: [
      { from_object_type: 'org_unit', from_object_name: 'General Counsel', to_object_type: 'org_unit', to_object_name: 'General Counsel & Chief Legal Officer', from_object_id: 'ORG-full000001', to_object_id: 'ORG-full000001' },
    ],
    ledgerEntries: [entry('ORG-full000001', 'General Counsel & Chief Legal Officer')],
  });
  const { orgs, edges } = mint(root);
  assert.equal(orgs[0].org_unit_id, 'ORG-full000001');
  assert.match(orgs[1].org_unit_id, /^ORG-[0-9a-f]{10}$/);
  assert.notEqual(orgs[1].org_unit_id, 'ORG-full000001', 'the stub is its own object, so it gets its own id');
  assert.equal(edges[0].from_object_id, 'ORG-full000001', 'the ambiguous endpoint stays on the row it already named');
});

test('an edge whose prior id the name no longer identifies is re-resolved to the named row', () => {
  // Two rows inherited one id from a template spread. The ledger names the first, so the second
  // is minted its own id, and an edge naming the second must follow it rather than keep the
  // shared value -- stability applies only while the prior id is still one of the candidates.
  const root = fixtureRepo({
    orgRows: [
      { org_unit: 'Network Operations', leader_name_or_role: '', org_unit_id: 'ORG-shared0001' },
      { org_unit: 'Crew Planning', leader_name_or_role: '', org_unit_id: 'ORG-shared0001' },
    ],
    edges: [
      { from_object_type: 'org_unit', from_object_name: 'Crew Planning', to_object_type: 'org_unit', to_object_name: 'Network Operations', from_object_id: 'ORG-shared0001', to_object_id: 'ORG-shared0001' },
    ],
    ledgerEntries: [entry('ORG-shared0001', 'Network Operations')],
  });
  const { orgs, edges } = mint(root);
  assert.equal(orgs[0].org_unit_id, 'ORG-shared0001');
  assert.notEqual(orgs[1].org_unit_id, 'ORG-shared0001');
  assert.equal(edges[0].from_object_id, orgs[1].org_unit_id);
  assert.equal(edges[0].to_object_id, 'ORG-shared0001');
});

test('a renamed row keeps its declared id through a ledger alias, and its edge keeps it too', () => {
  const root = fixtureRepo({
    orgRows: [{ org_unit: 'Outstation Data — Austin (AUS)', leader_name_or_role: '', org_unit_id: 'ORG-renamed001' }],
    edges: [
      { from_object_type: 'org_unit', from_object_name: 'Outstation Data — Austin (AUS)', to_object_type: '', to_object_name: '', from_object_id: 'ORG-renamed001', to_object_id: '' },
    ],
    ledgerEntries: [entry('ORG-renamed001', 'Outstation Data', ['Outstation Data — Austin (AUS)'])],
  });
  const { orgs, edges } = mint(root);
  assert.equal(orgs[0].org_unit_id, 'ORG-renamed001');
  assert.equal(edges[0].from_object_id, 'ORG-renamed001');
});

test('a rewritten file keeps the row terminator it was written with', () => {
  // Papa.unparse ends rows with CRLF unless told otherwise; appending a final LF to that left
  // LF-only intake files mixing both, and readers disagree on how many rows such a file has.
  const root = fixtureRepo({
    orgRows: [{ org_unit: 'Network Operations', leader_name_or_role: 'VP Network', org_unit_id: '' }],
    edges: [],
    ledgerEntries: [],
  });
  const crlfFile = path.join(root, INPUT_ROOT, '12_relationships.csv');
  fs.writeFileSync(crlfFile, 'from_object_type,from_object_name,to_object_type,to_object_name\r\norg_unit,Network Operations,,\r\n');
  mint(root);
  const lf = fs.readFileSync(path.join(root, INPUT_ROOT, '02_org_ownership.csv'), 'utf8');
  assert.equal(lf.includes('\r'), false, 'an LF file gains no CR');
  assert.ok(lf.endsWith('\n'));
  const crlf = fs.readFileSync(crlfFile, 'utf8');
  assert.equal(crlf.split('\r\n').length - 1, crlf.split('\n').length - 1, 'every LF in a CRLF file is part of a CRLF');
  assert.ok(crlf.endsWith('\r\n'));
});
