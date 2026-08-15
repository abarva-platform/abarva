#!/usr/bin/env node

import assert from 'node:assert/strict';

import { buildDecisionRows } from '../build-graph-source-data-gated-decision-matrix.mjs';

const tenantAliases = new Map([['tenant-key-a', 'tenant-01']]);
const endpoints = [
  {
    tenantKey: 'tenant-key-a',
    relationshipId: 'rel-1',
    sourceRowNumber: '12',
    objectType: 'application_system',
    endpointName: 'Missing System',
    opportunityClass: 'source_data_dimension_or_edge_type_correction_gate',
  },
  {
    tenantKey: 'tenant-key-a',
    relationshipId: 'rel-2',
    sourceRowNumber: '22',
    objectType: 'application_system',
    endpointName: 'Missing System',
    opportunityClass: 'source_data_dimension_or_edge_type_correction_gate',
  },
  {
    tenantKey: 'tenant-key-a',
    relationshipId: 'rel-3',
    sourceRowNumber: '31',
    objectType: 'organization_unit',
    endpointName: 'CFO',
    opportunityClass: 'code_only_acronym_alias_candidate',
  },
];

const sanitizedRows = buildDecisionRows({ endpoints, tenantAliases, includeEndpointLabels: false });
assert.equal(sanitizedRows.length, 1);
assert.equal(sanitizedRows[0].tenant, 'tenant-01');
assert.equal(sanitizedRows[0].endpointLabel, '');
assert.equal(sanitizedRows[0].unresolvedEndpointOccurrences, 2);
assert.equal(sanitizedRows[0].affectedRelationshipRows, 2);
assert.equal(sanitizedRows[0].firstSourceRowNumber, 12);
assert.equal(sanitizedRows[0].hardGateRequiredBeforeWrite, true);
assert.equal(sanitizedRows[0].reportOnly, true);
assert.match(sanitizedRows[0].decisionId, /^sdg-[a-f0-9]{16}$/);

const labeledRows = buildDecisionRows({ endpoints, tenantAliases, includeEndpointLabels: true });
assert.equal(labeledRows[0].endpointLabel, 'Missing System');

console.log('graph-source-data-gated-decision-matrix tests passed');
