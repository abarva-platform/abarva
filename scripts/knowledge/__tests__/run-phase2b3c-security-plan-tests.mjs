#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const PHASE_ROOT = "18-phase2b3c-azure-lab-implementation";
const TENANTS = [
  { key: "hc-demo-new", display: "HC Demo New" },
  { key: "airline-demo-new", display: "Airline Demo New" },
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), "utf8"));
}

function readText(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function collectText(rootRel) {
  const root = path.join(REPO_ROOT, rootRel);
  const parts = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.(md|json|yaml|yml|csv|bicep|bicepparam|txt)$/i.test(entry.name)) {
        parts.push(fs.readFileSync(full, "utf8"));
      }
    }
  };
  visit(root);
  return parts.join("\n");
}

for (const tenant of TENANTS) {
  const root = `clients/${tenant.key}/${PHASE_ROOT}`;
  const plan = readJson(`${root}/11-security-hardening-plan/SECURITY_HARDENING_PLAN.json`);
  const validation = readJson(`${root}/validation/phase2b3c2b-security-hardening-validation-summary.json`);
  const firewall = readText(`${root}/11-security-hardening-plan/EVALUATOR_FIREWALL_MATRIX.csv`);
  const rbac = readText(`${root}/11-security-hardening-plan/RBAC_ASSIGNMENT_MATRIX.csv`);
  const zeroData = readText(`${root}/11-security-hardening-plan/ZERO_DATA_PREFLIGHT_CHECKS.csv`);
  const bicep = readText(`${root}/11-security-hardening-plan/phase2b3c2b-security-hardening.bicep`);
  const manifest = readText(`${root}/01-infrastructure-as-code/AZURE_CONTROL_PLANE_MANIFEST.yaml`);

  assert.equal(plan.tenant.key, tenant.key, `${tenant.key} plan tenant mismatch`);
  assert.equal(validation.passed, true, `${tenant.key} validation must pass`);
  assert.notEqual(plan.boundaries.operationalStorage, plan.boundaries.evaluatorStorage, `${tenant.key} evaluator storage must be separate`);
  assert.equal(plan.boundaries.ingestRuntimeCannotReadHiddenTruth, true, `${tenant.key} ingest/runtime hidden-truth firewall missing`);
  assert.equal(plan.boundaries.evaluatorCannotMutateKnowledge, true, `${tenant.key} evaluator mutation deny missing`);
  assert.match(firewall, /parser_ingest,[^,\n]+,no,no,candidate-only/, `${tenant.key} parser/ingest must not read hidden truth`);
  assert.match(firewall, /runtime_reader,[^,\n]+,no,yes,no/, `${tenant.key} runtime reader must not read hidden truth`);
  assert.match(firewall, /evaluator,[^,\n]+,yes,yes,no/, `${tenant.key} evaluator must be read-only to Knowledge`);
  assert.match(rbac, /AcrPull/, `${tenant.key} ACR pull RBAC missing`);
  assert.match(rbac, /Storage Blob Data Contributor/, `${tenant.key} storage contributor RBAC missing`);
  assert.match(rbac, /Key Vault Secrets User/, `${tenant.key} key vault RBAC missing`);
  assert.match(zeroData, /wrong_tenant_zero_reads_zero_writes/, `${tenant.key} wrong-tenant preflight check missing`);
  assert.match(bicep, /roleAssignments@2022-04-01/, `${tenant.key} RBAC overlay missing`);
  assert.match(bicep, /privateDnsZoneGroups@2023-11-01/, `${tenant.key} private DNS zone group missing`);
  assert.match(bicep, /diagnosticSettings@2021-05-01-preview/, `${tenant.key} diagnostics overlay missing`);
  assert.match(manifest, new RegExp(`tenant_key: ${tenant.key}`), `${tenant.key} manifest tenant key missing`);
}

const airlineText = collectText(`clients/airline-demo-new`);
assert.doesNotMatch(airlineText, /skyharbor-air/i, "Airline clean root must not reuse legacy tenant key");
assert.doesNotMatch(airlineText, /SkyHarbor/i, "Airline clean root must not reuse legacy display name");
assert.match(airlineText, /airline-demo-new/, "Airline clean root must use the new tenant key");
assert.match(airlineText, /stabairdnevallab001/, "Airline clean root must include evaluator storage");

const rollup = readJson("reports/phase2b3c-security-hardening/rollup.json");
assert.equal(rollup.azureApplyBlocked, true, "rollup must preserve Azure apply block");
assert.deepEqual(
  rollup.tenants.map((tenant) => tenant.tenant_key).sort(),
  ["airline-demo-new", "hc-demo-new"],
  "rollup must include exactly the two future manifests",
);
assert.equal(rollup.tenants.every((tenant) => tenant.validation_passed), true, "all tenant validations must pass");

console.log("phase2b3c-security-plan tests passed");
