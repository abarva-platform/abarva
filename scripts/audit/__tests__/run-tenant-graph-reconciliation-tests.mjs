#!/usr/bin/env node

import assert from 'node:assert/strict';

import {
  evaluateRelationshipRow,
  objectTypeForEndpoint,
  slug,
} from '../tenant-graph-reconciliation.mjs';

const nodeIndex = new Map([
  [
    'application_system:claims-platform',
    {
      nodeId: 'test-tenant:application_system:claims-platform',
      objectType: 'application_system',
    },
  ],
  [
    'business_function:claims-operations',
    {
      nodeId: 'test-tenant:business_function:claims-operations',
      objectType: 'business_function',
    },
  ],
]);

const normalizeRelationshipType = (raw) =>
  raw === 'supports'
    ? {
        relationshipType: 'SUPPORTS',
      }
    : undefined;

assert.equal(slug('Claims Platform!'), 'claims-platform');
assert.equal(objectTypeForEndpoint('system'), 'application_system');
assert.equal(objectTypeForEndpoint('data domain'), 'data_asset');
assert.equal(objectTypeForEndpoint('contract'), 'vendor_contract');
assert.equal(objectTypeForEndpoint('platform'), 'infrastructure_platform');
assert.equal(objectTypeForEndpoint('owner'), 'workforce_role');
assert.equal(objectTypeForEndpoint('interview'), 'evidence_source');
assert.equal(objectTypeForEndpoint('tower initiative'), 'program_initiative');

const accepted = evaluateRelationshipRow({
  tenantKey: 'test-tenant',
  row: {
    tenant_key: 'test-tenant',
    from_object_type: 'system',
    from_object_name: 'Claims Platform',
    relationship_type: 'supports',
    to_object_type: 'function',
    to_object_name: 'Claims Operations',
    evidence_basis: 'source row 12',
    confidence: 'high',
    known_gaps: 'none',
  },
  rowNumber: 2,
  nodeIndex,
  normalizeRelationshipType,
});

assert.equal(accepted.quarantine, null);
assert.equal(accepted.candidate.normalizedRelationshipType, 'SUPPORTS');
assert.equal(accepted.candidate.fromNodeId, 'test-tenant:application_system:claims-platform');

const quarantined = evaluateRelationshipRow({
  tenantKey: 'test-tenant',
  row: {
    tenant_key: 'test-tenant',
    from_object_type: 'system',
    from_object_name: 'Missing Platform',
    relationship_type: 'vendor matched to supported system evidence note',
    to_object_type: 'function',
    to_object_name: 'Claims Operations',
  },
  rowNumber: 3,
  nodeIndex,
  normalizeRelationshipType,
});

assert.equal(quarantined.candidate, null);
assert.match(quarantined.quarantine.quarantineReasons, /unknown-relationship-type/);
assert.match(quarantined.quarantine.quarantineReasons, /unresolved-from-node/);
assert.match(quarantined.quarantine.quarantineReasons, /missing-evidence-basis/);

console.log('tenant-graph-reconciliation tests passed');
