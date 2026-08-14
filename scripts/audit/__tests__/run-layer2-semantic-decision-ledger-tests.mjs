import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-layer2-semantic-ledger-test-'));
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
const ledgerPath = path.join(outDir, 'layer2-semantic-decision-ledger.json');
assert.equal(fs.existsSync(classificationPath), true);
assert.equal(fs.existsSync(ledgerPath), true);

const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));

assert.equal(ledger.mode, 'layer2-semantic-decision-ledger-report-only');
assert.deepEqual(ledger.truthSplit, {
  productionTenantDataWritten: false,
  activeTenantAccessLayerUpdated: false,
  moduleRuntimeBehaviorChanged: false,
  adaptersExecuted: false,
  aliasesActivated: false,
  registryActivated: false,
  canonicalObjectsWritten: false,
});
assert.equal(
  ledger.summary.profileFailuresEvaluated,
  classification.summary.uniqueProfileFailuresClassified,
);
assert.equal(
  ledger.summary.semanticDecisionProfiles,
  classification.summary.byRecommendedAction.hard_gate_decision ?? 0,
);
assert.equal(ledger.summary.activationReadyProfiles, 0);
assert.equal(ledger.decisions.length, ledger.summary.semanticDecisionProfiles);

for (const decision of ledger.decisions) {
  assert.equal(decision.decisionState, 'requires_explicit_approval');
  assert.equal(decision.approvalGate, 'semantic identity alias activation');
  assert.ok(decision.approvalRequiredBeforeFix);
  assert.ok(decision.semanticFields.length > 0);
  assert.ok(decision.blockedActions.includes('registry activation'));
  assert.ok(decision.blockedActions.includes('data-plane load/write'));
}

console.log(`layer2 semantic decision ledger test passed: ${ledgerPath}`);
