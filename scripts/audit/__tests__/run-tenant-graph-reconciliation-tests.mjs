#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  applyApprovedSemanticNodeAliases,
  buildNodeIndex,
  classifyQuarantineReason,
  classifyQuarantineReasons,
  dispositionForQuarantineClass,
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
assert.equal(quarantined.quarantine.quarantineClass, 'dangling_reference');
assert.equal(
  quarantined.quarantine.quarantineDisposition,
  'catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge',
);
assert.equal(classifyQuarantineReason('unknown-relationship-type:foo'), 'vocabulary_or_endpoint_type_defect');
assert.equal(
  classifyQuarantineReasons(['missing-from-object-name', 'unresolved-to-node']),
  'empty_endpoint_or_required_field_missing',
);
assert.equal(
  dispositionForQuarantineClass('empty_endpoint_or_required_field_missing'),
  'permanent-quarantine-until-upstream-source-fields-exist-or-no-graph-is-declared',
);

const objectRegistry = [
  {
    objectType: 'application_system',
    objectFamily: 'application',
    identityAttributes: ['systemName'],
  },
];
const profiles = [
  {
    mappingProfile: 'applications-systems-v3/v1',
    rules: [
      {
        sourceField: 'system_name',
        sourceAliases: ['business_name', 'system_code'],
        targetObjectType: 'application_system',
        targetAttribute: 'systemName',
      },
    ],
  },
];

const uniqueAliasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-graph-alias-unique-'));
fs.writeFileSync(
  path.join(uniqueAliasRoot, '04_applications_systems.csv'),
  [
    'tenant_key,system_name,business_name,system_code',
    'test-tenant,Claims Platform,Claims Workbench,CW-001',
  ].join('\n'),
);
const uniqueAliasIndex = buildNodeIndex({
  tenantKey: 'test-tenant',
  activeRoot: uniqueAliasRoot,
  profiles,
  objectRegistry,
});
assert.equal(uniqueAliasIndex.aliasLookup.added, 2);
assert.equal(uniqueAliasIndex.semanticAliasLookup.records, 0);
assert.equal(
  uniqueAliasIndex.byObjectAndName.get('application_system:claims-workbench')?.nodeId,
  'test-tenant:application_system:claims-platform',
);

const ambiguousAliasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-graph-alias-ambiguous-'));
fs.writeFileSync(
  path.join(ambiguousAliasRoot, '04_applications_systems.csv'),
  [
    'tenant_key,system_name,business_name,system_code',
    'test-tenant,Claims Platform,Shared Alias,CW-001',
    'test-tenant,Policy Platform,Shared Alias,PP-001',
  ].join('\n'),
);
const ambiguousAliasIndex = buildNodeIndex({
  tenantKey: 'test-tenant',
  activeRoot: ambiguousAliasRoot,
  profiles,
  objectRegistry,
});
assert.equal(ambiguousAliasIndex.aliasLookup.ambiguous, 1);
assert.equal(ambiguousAliasIndex.byObjectAndName.has('application_system:shared-alias'), false);

const semanticAliasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-graph-semantic-alias-'));
fs.writeFileSync(
  path.join(semanticAliasRoot, '02_org_ownership.csv'),
  ['tenant_key,org_unit_name', 'test-tenant,Chief Financial Officer'].join('\n'),
);
const orgRegistry = [
  {
    objectType: 'organization_unit',
    objectFamily: 'organization',
    identityAttributes: ['orgUnitName'],
  },
];
const orgProfiles = [
  {
    mappingProfile: 'organization-ownership/v1',
    rules: [
      {
        sourceField: 'org_unit_name',
        sourceAliases: [],
        targetObjectType: 'organization_unit',
        targetAttribute: 'orgUnitName',
      },
    ],
  },
];
const semanticAliasIndex = buildNodeIndex({
  tenantKey: 'test-tenant',
  activeRoot: semanticAliasRoot,
  profiles: orgProfiles,
  objectRegistry: orgRegistry,
  semanticAliases: [
    {
      tenant: 'tenant-01',
      objectType: 'organization_unit',
      alias: 'CFO',
      canonicalDisplayName: 'Chief Financial Officer',
      canonicalSourceRowNumber: 2,
      canonicalMappingProfile: 'organization-ownership/v1',
    },
  ],
});
assert.equal(semanticAliasIndex.semanticAliasLookup.records, 1);
assert.equal(semanticAliasIndex.semanticAliasLookup.added, 1);
assert.equal(
  semanticAliasIndex.byObjectAndName.get('organization_unit:cfo')?.nodeId,
  'test-tenant:organization_unit:chief-financial-officer',
);

assert.throws(
  () =>
    applyApprovedSemanticNodeAliases({
      byObjectAndName: semanticAliasIndex.byObjectAndName,
      semanticAliases: [
        {
          tenant: 'tenant-01',
          objectType: 'organization_unit',
          alias: 'CHRO',
          canonicalDisplayName: 'Chief Financial Officer',
          canonicalSourceRowNumber: 99,
          canonicalMappingProfile: 'organization-ownership/v1',
        },
      ],
    }),
  /canonical row mismatch/,
);

console.log('tenant-graph-reconciliation tests passed');
