#!/usr/bin/env node

import assert from 'node:assert/strict';

import {
  AVA_SURFACES,
  READINESS_STATES,
  buildAvaReadinessLedger,
  buildAvaReadinessRow,
  summarize,
} from '../ava-readiness-ledger.mjs';

const localProof = {
  layer2ProfilesThatWouldRun: 18,
  layer2DimensionFailures: 1,
  graphRelationshipCandidates: 12,
  graphQuarantinedRelationships: 3,
  proofArtifacts: ['reports/example.json'],
};

const row = buildAvaReadinessRow({
  tenantKey: 'tenant-a',
  surface: 'home',
  localProof,
});

assert.equal(row.sourceEvidenceState, READINESS_STATES.verified);
assert.equal(row.loadedState, READINESS_STATES.notVerified);
assert.equal(row.indexedState, READINESS_STATES.notVerified);
assert.equal(row.retrievableState, READINESS_STATES.notVerified);
assert.equal(row.citedState, READINESS_STATES.notVerified);
assert.equal(row.agentReady, false);
assert.match(row.blockers, /data-plane loaded readback/);
assert.match(row.blockers, /cite-render verification/);

const ledger = buildAvaReadinessLedger([{ tenantKey: 'tenant-a' }, { tenantKey: 'tenant-b' }]);
assert.equal(ledger.length, AVA_SURFACES.length * 2);
assert.equal(summarize(ledger).agentReady, 0);

console.log('ava-readiness-ledger tests passed');
