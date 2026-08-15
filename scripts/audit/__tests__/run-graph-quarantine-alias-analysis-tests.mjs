#!/usr/bin/env node

import assert from 'node:assert/strict';

import {
  acronym,
  analyzeAliasOpportunities,
  buildReviewRows,
  classifyEndpointOpportunity,
  compactSlug,
  splitReasons,
} from '../build-graph-quarantine-alias-analysis.mjs';

assert.equal(compactSlug('Chief Financial Officer'), 'chieffinancialofficer');
assert.equal(compactSlug('C.F.O.'), 'cfo');
assert.equal(acronym('Chief Financial Officer'), 'cfo');
assert.deepEqual(splitReasons('unresolved-to-node; unresolved-from-node'), [
  'unresolved-to-node',
  'unresolved-from-node',
]);

const buckets = new Map([
  [
    'tenant-a|organization_unit',
    [
      {
        tenantKey: 'tenant-a',
        objectType: 'organization_unit',
        displayName: 'Chief Financial Officer',
        sourceRowNumber: 7,
        mappingProfile: 'organization-ownership/v1',
      },
    ],
  ],
]);

assert.deepEqual(
  classifyEndpointOpportunity({
    endpoint: {
      objectType: 'organization_unit',
      objectName: 'CFO',
    },
    tenantKey: 'tenant-a',
    buckets,
  }),
  {
    opportunityClass: 'code_only_acronym_alias_candidate',
    candidateCount: 1,
    matchRule: 'endpoint-label-is-unique-acronym-of-canonical-label',
    proposedCanonical: 'Chief Financial Officer',
    proposedCanonicalSourceRowNumber: 7,
    proposedCanonicalMappingProfile: 'organization-ownership/v1',
    proposedDisposition: 'semantic-identity-alias-activation-gated',
  },
);

assert.equal(
  classifyEndpointOpportunity({
    endpoint: {
      objectType: 'organization_unit',
      objectName: 'Not Catalogued',
    },
    tenantKey: 'tenant-a',
    buckets,
  }).opportunityClass,
  'source_data_dimension_or_edge_type_correction_gate',
);

const analysis = analyzeAliasOpportunities({
  nodes: [
    {
      tenantKey: 'tenant-a',
      objectType: 'organization_unit',
      displayName: 'Chief Financial Officer',
      sourceRowNumber: 7,
      mappingProfile: 'organization-ownership/v1',
    },
  ],
  quarantineRows: [
    {
      tenantKey: 'tenant-a',
      relationshipId: 'rel-1',
      sourceRowNumber: '2',
      quarantineReasons: 'unresolved-to-node',
      fromObjectType: 'business_function',
      fromObjectName: 'Finance',
      fromNodeId: 'tenant-a:business_function:finance',
      toObjectType: 'organization_unit',
      toObjectName: 'CFO',
      toNodeId: '',
    },
    {
      tenantKey: 'tenant-a',
      relationshipId: 'rel-2',
      sourceRowNumber: '3',
      quarantineReasons: 'unresolved-from-node; unresolved-to-node',
      fromObjectType: 'organization_unit',
      fromObjectName: 'Missing From',
      fromNodeId: '',
      toObjectType: 'organization_unit',
      toObjectName: 'CFO',
      toNodeId: '',
    },
  ],
});

assert.equal(analysis.endpoints.length, 3);
assert.equal(
  analysis.rowClassifications.find((row) => row.relationshipId === 'rel-1')?.rowOpportunityClass,
  'all_unresolved_endpoints_code_only_candidate',
);
assert.equal(
  analysis.rowClassifications.find((row) => row.relationshipId === 'rel-2')?.rowOpportunityClass,
  'mixed_code_only_and_gated_endpoints',
);

assert.deepEqual(
  buildReviewRows({
    endpoints: analysis.endpoints,
    tenantAliases: new Map([['tenant-a', 'tenant-01']]),
  }).filter((row) => row.semanticIdentityAliasActivated === false),
  [
    {
      tenant: 'tenant-01',
      endpointName: 'CFO',
      proposedCanonical: 'Chief Financial Officer',
      objectType: 'organization_unit',
      opportunityClass: 'code_only_acronym_alias_candidate',
      matchRule: 'endpoint-label-is-unique-acronym-of-canonical-label',
      evidenceForMapping:
        'endpoint-label-is-unique-acronym-of-canonical-label; unique_candidate_count=1; canonical_source_row=7; canonical_mapping_profile=organization-ownership/v1',
      affectedEndpointOccurrences: 2,
      semanticIdentityAliasActivated: false,
      graphMaterialized: false,
    },
  ],
);

console.log('graph-quarantine-alias-analysis tests passed');
