import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-layer2-classification-test-'));
const outDir = path.join(outRoot, 'layer-reconciliation');

const result = spawnSync(
  process.execPath,
  [
    'scripts/audit/tenant-layer-refresh.mjs',
    '--tenant',
    'all',
    '--out',
    outDir,
    '--no-package',
  ],
  {
    cwd: repoRoot,
    encoding: 'utf8',
  },
);

assert.equal(result.status, 0, result.stderr || result.stdout);

const failuresPath = path.join(outDir, 'layer2-adapter-dry-run-failures.json');
const classificationPath = path.join(outDir, 'layer2-dry-run-failure-classification.json');
assert.equal(fs.existsSync(failuresPath), true);
assert.equal(fs.existsSync(classificationPath), true);

const failures = JSON.parse(fs.readFileSync(failuresPath, 'utf8'));
const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));

assert.equal(classification.mode, 'layer2-dry-run-failure-classification');
assert.deepEqual(classification.truthSplit, {
  productionTenantDataWritten: false,
  activeTenantAccessLayerUpdated: false,
  moduleRuntimeBehaviorChanged: false,
  adaptersExecuted: false,
  canonicalObjectsWritten: false,
});
assert.equal(
  classification.summary.uniqueProfileFailuresClassified,
  failures.profileFailures.length,
);
assert.equal(
  classification.summary.mirroredDimensionFailures,
  failures.dimensionFailures.length,
);

const allowedActions = new Set([
  'mapping_alias_code_only_fix',
  'source_data_gated_fix',
  'hard_gate_decision',
]);
assert.equal(classification.classifications.length, failures.profileFailures.length);
for (const item of classification.classifications) {
  assert.equal(allowedActions.has(item.recommendedAction), true);
  assert.equal(Array.isArray(item.missingFields), true);
  assert.ok(item.missingFields.length > 0);
  assert.ok(item.approvalRequiredBeforeFix);
}

assert.equal(
  classification.nextPrSizedSafeCodeSlice.expectedOutput,
  'layer2-dry-run-failure-classification.json',
);

console.log(`layer2 failure classification test passed: ${classificationPath}`);
