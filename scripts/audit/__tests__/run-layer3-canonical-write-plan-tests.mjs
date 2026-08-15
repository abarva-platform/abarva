#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-layer3-write-plan-test-'));
const layerDir = path.join(outRoot, 'layer-reconciliation');
const reportDir = path.join(outRoot, 'layer3-plan');
const sourceSha = 'test-sha';

const layerResult = spawnSync(
  process.execPath,
  [
    'scripts/audit/tenant-layer-refresh.mjs',
    '--tenant',
    'all',
    '--out',
    layerDir,
    '--no-package',
  ],
  {
    cwd: repoRoot,
    encoding: 'utf8',
  },
);

assert.equal(layerResult.status, 0, layerResult.stderr || layerResult.stdout);

const planResult = spawnSync(
  'npm',
  [
    'run',
    'audit:layer3-canonical-write-plan',
    '--',
    '--layer-dir',
    layerDir,
    '--out-dir',
    reportDir,
    '--source-sha',
    sourceSha,
  ],
  {
    cwd: repoRoot,
    encoding: 'utf8',
  },
);

assert.equal(planResult.status, 0, planResult.stderr || planResult.stdout);

const jsonPath = path.join(reportDir, 'layer3-canonical-write-plan.json');
const markdownPath = path.join(reportDir, 'layer3-canonical-write-plan.md');
assert.equal(fs.existsSync(jsonPath), true);
assert.equal(fs.existsSync(markdownPath), true);

const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

assert.equal(report.sourceSha, sourceSha);
assert.equal(report.mode, 'report_only_no_canonical_write_no_registry_activation_no_data_plane_load_no_projection_refresh');
assert.equal(report.publicDisclosure.includes('Tenant identifiers are anonymized'), true);
assert.equal(report.summary.tenantsPlanned, 7);
assert.equal(report.summary.layer2ProfileDryRunRows, 133);
assert.equal(report.summary.profileRowsWouldRun, report.summary.layer2ProfileDryRunRows);
assert.equal(report.summary.canonicalObjectsWritten, 0);
assert.equal(report.summary.factsWritten, 0);
assert.equal(report.summary.canonicalStoreWriteReadyWithoutHardGates, false);
assert.equal(report.acceptance.allLayer2ProfileRowsWouldRun, true);
assert.equal(report.acceptance.everyPlannedObjectHasRegistryDefinition, true);
assert.equal(report.acceptance.everyPlannedFactHasAuthorityDefinition, true);
assert.equal(report.acceptance.dataPlaneWritesPerformed, false);
assert.equal(report.acceptance.registryActivationPerformed, false);
assert.equal(report.acceptance.projectionRefreshPerformed, false);
assert.ok(report.summary.wouldWriteCanonicalObjects > 0);
assert.ok(report.summary.wouldEvaluateFactValues > 0);
assert.ok(report.objectPlan.length > 0);
assert.ok(report.factPlan.length > 0);
assert.equal(report.perTenant.every((tenant) => /^tenant-\d\d$/.test(tenant.tenant)), true);
assert.equal(report.profilePlans.every((profile) => /^tenant-\d\d$/.test(profile.tenant)), true);
assert.ok(report.gatesLeftClosed.includes('No Azure/Postgres write or data-plane load.'));

console.log(`layer3 canonical write plan test passed: ${jsonPath}`);
