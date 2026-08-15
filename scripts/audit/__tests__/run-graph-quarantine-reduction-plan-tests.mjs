#!/usr/bin/env node

import assert from 'node:assert/strict';

import {
  buildReasonBreakdown,
  buildReductionBreakdown,
  classifyReductionPath,
  dispositionForReductionPath,
} from '../build-graph-quarantine-reduction-plan.mjs';

assert.equal(classifyReductionPath(['unknown-relationship-type:foo']), 'code_dictionary_or_endpoint_alias_repair');
assert.equal(classifyReductionPath(['tenant-key-mismatch']), 'tenant_identity_source_gate');
assert.equal(classifyReductionPath(['missing-evidence-basis']), 'evidence_basis_source_gate');
assert.equal(classifyReductionPath(['missing-from-object-name']), 'upstream_source_absence_or_no_graph_disposition');
assert.equal(classifyReductionPath(['unresolved-to-node']), 'source_data_dimension_or_edge_type_correction_gate');
assert.equal(classifyReductionPath(['unclassified']), 'manual_review_gate');

assert.equal(
  dispositionForReductionPath('source_data_dimension_or_edge_type_correction_gate'),
  'catalogue-object-from-real-evidence-or-correct-edge-type-never-create-node-to-satisfy-edge',
);

const rows = [
  { quarantineReasons: 'unresolved-to-node; unresolved-from-node' },
  { quarantineReasons: 'missing-from-object-name' },
  { quarantineReasons: 'unknown-to-object-type:capability' },
];

assert.deepEqual(buildReasonBreakdown(rows), [
  { reason: 'missing-from-object-name', count: 1 },
  { reason: 'unknown-to-object-type:capability', count: 1 },
  { reason: 'unresolved-from-node', count: 1 },
  { reason: 'unresolved-to-node', count: 1 },
]);
assert.deepEqual(buildReductionBreakdown(rows), [
  {
    reductionPath: 'code_dictionary_or_endpoint_alias_repair',
    count: 1,
    disposition: 'safe-code-slice-if-a-canonical-dictionary-or-unique-identity-alias-can-resolve-it',
  },
  {
    reductionPath: 'source_data_dimension_or_edge_type_correction_gate',
    count: 1,
    disposition: 'catalogue-object-from-real-evidence-or-correct-edge-type-never-create-node-to-satisfy-edge',
  },
  {
    reductionPath: 'upstream_source_absence_or_no_graph_disposition',
    count: 1,
    disposition: 'permanent-quarantine-or-declare-no-graph-until-required-endpoint-fields-exist',
  },
]);

console.log('graph-quarantine-reduction-plan tests passed');
