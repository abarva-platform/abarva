import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-layer2-alias-impact-test-'));
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

const classificationPath = path.join(outDir, 'layer2-dry-run-failure-classification.json');
const aliasImpactPath = path.join(outDir, 'layer2-code-only-alias-impact.json');
assert.equal(fs.existsSync(classificationPath), true);
assert.equal(fs.existsSync(aliasImpactPath), true);

const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
const aliasImpact = JSON.parse(fs.readFileSync(aliasImpactPath, 'utf8'));

assert.equal(aliasImpact.mode, 'layer2-code-only-alias-impact-report-only');
assert.deepEqual(aliasImpact.truthSplit, {
  productionTenantDataWritten: false,
  activeTenantAccessLayerUpdated: false,
  moduleRuntimeBehaviorChanged: false,
  adaptersExecuted: false,
  aliasesActivated: false,
  canonicalObjectsWritten: false,
});
assert.equal(
  aliasImpact.summary.profileFailuresEvaluated,
  classification.summary.uniqueProfileFailuresClassified,
);
assert.equal(
  aliasImpact.summary.codeOnlyAliasCandidates,
  classification.summary.byRecommendedAction.mapping_alias_code_only_fix ?? 0,
);
assert.equal(
  aliasImpact.summary.remainingHardGateDecisions,
  classification.summary.byRecommendedAction.hard_gate_decision ?? 0,
);

for (const candidate of aliasImpact.candidateProfiles) {
  assert.equal(candidate.activationState, 'not_activated_report_only');
  assert.equal(candidate.wouldClearDryRunFailure, true);
  assert.ok(candidate.fieldResolutions.length > 0);
}

console.log(`layer2 code-only alias impact test passed: ${aliasImpactPath}`);
