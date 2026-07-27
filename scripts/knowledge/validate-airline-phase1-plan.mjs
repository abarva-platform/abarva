#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const ROOT = "clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package";

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

const main = read(`${ROOT}/01-infrastructure-as-code/main.bicep`);
const foundation = read(`${ROOT}/01-infrastructure-as-code/airdn-lab-foundation.bicep`);
const params = read(`${ROOT}/01-infrastructure-as-code/airdn.lab.bicepparam`);
const whatIf = read(`${ROOT}/02-preapply-report/what-if-eastus2-20260727.txt`);
const safety = readJson(`${ROOT}/02-preapply-report/WHAT_IF_SAFETY_GATE.json`);
const preApply = readJson(`${ROOT}/02-preapply-report/PRE_APPLY_REPORT.json`);
const blockedManifest = readJson("clients/airline-demo-new/execution/airline-demo-new-source-corpus-v1.0.0.blocked-manifest.json");

const requiredNames = [
  "rg-abarva-airdn-lab-eus-001",
  "vnet-abarva-airdn-lab-eus-001",
  "cae-abarva-airdn-lab-eus-001",
  "pg-abarva-airdn-lab-eus2-001",
  "abarva_airline_demo_new_knowledge_lab",
  "stabairdnlabeus001",
  "stabairdnevallab001",
  "kv-abarva-airdn-lab-001",
  "law-abarva-airdn-lab-eus-001",
];

assert.match(main, /targetScope = 'subscription'/);
assert.match(main, /resourceGroups@2022-09-01/);
assert.match(params, /resourceGroupName = 'rg-abarva-airdn-lab-eus-001'/);
assert.match(params, /postgresLocation = 'eastus2'/);
assert.match(foundation, /location: postgresLocation/);

for (const name of requiredNames) {
  assert.match(foundation + params + whatIf, new RegExp(name), `missing required resource ${name}`);
  assert.equal(safety.requiredNamesPresent[name], true, `safety gate did not confirm ${name}`);
}

assert.equal(safety.status, "pass");
assert.equal(safety.resourceChanges.delete, 0);
assert.ok(safety.resourceChanges.create >= 0);
assert.ok(safety.resourceChanges.create <= 53);
assert.ok(safety.resourceChanges.modify >= 0);
assert.equal(safety.blockedSignals.delete, false);
assert.equal(safety.blockedSignals.unsafe_modify, false);
assert.equal(safety.blockedSignals.public_postgres, false);
assert.equal(safety.blockedSignals.public_storage, false);
assert.equal(safety.blockedSignals.wrong_subscription, false);

assert.equal(preApply.sourceCorpus.sourceLandingAllowed, false);
assert.equal(preApply.sourceCorpus.parserAllowed, false);
assert.equal(preApply.sourceCorpus.publicationAllowed, false);
assert.equal(preApply.migration.migrationApplyAllowedInThisPackage, false);
assert.equal(blockedManifest.release_state, "blocked_before_phase_0_freeze");
assert.ok(blockedManifest.disallowed_actions.includes("provision_tenant_infrastructure_for_load"));

assert.match(foundation, /publicNetworkAccess: 'Disabled'/);
assert.match(foundation, /allowBlobPublicAccess: false/);
assert.ok(foundation.includes("networkAcls: { defaultAction: 'Deny', bypass: 'None' }"));
assert.ok(foundation.includes("node scripts/knowledge/hcdn-job-runner.mjs --tenant airline-demo-new"));
assert.doesNotMatch(foundation + params + main, /hc-demo-new|healthcare|stabhcdemonewlab001|pg-abarva-hc-demo-new/);
assert.doesNotMatch(foundation + params + main, /TENANT=all|hidden-truth.*ingest|sourceLandingAllowed.*true/);

console.log("Airline Phase 1 zero-data Azure plan validation passed.");
