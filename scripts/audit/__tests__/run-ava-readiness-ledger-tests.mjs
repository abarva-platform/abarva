#!/usr/bin/env node

import assert from 'node:assert/strict';

import {
  READINESS_STATES,
  anonymizeTenants,
  buildAvaReadinessRow,
  refusalTests,
  summarize,
} from '../ava-readiness-ledger.mjs';

assert.deepEqual(anonymizeTenants(['tenant-a', 'tenant-b']), new Map([
  ['tenant-a', 'tenant-01'],
  ['tenant-b', 'tenant-02'],
]));

const row = buildAvaReadinessRow({
  tenantAlias: 'tenant-01',
  tenantKey: 'sensitive-key',
  surface: 'home',
  localProof: {
    layer2ProfilesThatWouldRun: 23,
    layer2DimensionFailures: 0,
    graphRelationshipCandidates: 100,
    graphQuarantinedRelationships: 25,
    proofArtifactTypes: ['layer2_adapter_reconciliation'],
  },
});

assert.equal(row.tenant, 'tenant-01');
assert.equal(Object.hasOwn(row, 'tenantKey'), false);
assert.equal(row.sourceEvidenceState, READINESS_STATES.verified);
assert.equal(row.loadedState, READINESS_STATES.notVerified);
assert.equal(row.indexedState, READINESS_STATES.notVerified);
assert.equal(row.retrievableState, READINESS_STATES.notVerified);
assert.equal(row.citedState, READINESS_STATES.notVerified);
assert.equal(row.agentReady, false);
assert.match(row.blockers, /graph relationship quarantine remains/);

const rowWithKey = buildAvaReadinessRow({
  includeTenantKey: true,
  tenantAlias: 'tenant-01',
  tenantKey: 'operator-key',
  surface: 'home',
  localProof: {
    layer2ProfilesThatWouldRun: 0,
    layer2DimensionFailures: 0,
    graphRelationshipCandidates: 0,
    graphQuarantinedRelationships: 0,
    proofArtifactTypes: [],
  },
});
assert.equal(rowWithKey.tenantKey, 'operator-key');
assert.equal(rowWithKey.sourceEvidenceState, READINESS_STATES.notVerified);

assert.deepEqual(summarize([row, { ...row, surface: 'tower' }]), {
  tenants: 1,
  surfaces: 5,
  rows: 2,
  loadedVerified: 0,
  indexedVerified: 0,
  retrievableVerified: 0,
  citedVerified: 0,
  agentReady: 0,
});

assert.deepEqual(
  refusalTests().map((test) => [test.promptClass, test.runtimeTestRun]),
  [
    ['conflict_metric', false],
    ['undeclared_segment', false],
  ],
);

console.log('ava-readiness-ledger tests passed');
