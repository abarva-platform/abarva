#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const PACKAGE_ROOT =
  "clients/healthcare-demo-new/20-phase1-azure-infrastructure-execution-package";
const FREEZE_MANIFEST =
  "clients/healthcare-demo-new/execution/healthcare-demo-new-source-corpus-v1.0.0.freeze-manifest.json";
const CONSUMPTION_REGISTRY =
  "clients/shared/20-phase3c2d-consumption-contracts/CONSUMPTION_PROJECTION_REGISTRY.json";
const EXPECTED = {
  tenant: "healthcare-demo-new",
  release: "healthcare-demo-new-source-corpus-v1.0.0",
  manifestSha: "06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd",
  consumptionContractVersion: "phase3c2d-consumption-contracts-v1.0.0",
};

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function sha256(rel) {
  return crypto.createHash("sha256").update(read(rel)).digest("hex");
}

function walk(dir) {
  const abs = path.join(ROOT, dir);
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

const files = walk(PACKAGE_ROOT);
const body = files.map((file) => `${file}\n${read(file)}`).join("\n---\n");
const consumptionRegistry = JSON.parse(read(CONSUMPTION_REGISTRY));
const results = {
  phase0ManifestHashMatches: sha256(FREEZE_MANIFEST) === EXPECTED.manifestSha,
  consumptionContractVersionMatches:
    consumptionRegistry.version === EXPECTED.consumptionContractVersion &&
    body.includes(EXPECTED.consumptionContractVersion),
  packageFilesPresent: files.length >= 14,
  tenantKeyExplicit: body.includes(EXPECTED.tenant),
  releaseIdExplicit: body.includes(EXPECTED.release),
  approvalManifestShaExplicit: body.includes(EXPECTED.manifestSha),
  wildcardTenantBlocked:
    body.includes('"tenant_key=*"') && !body.includes("allow_tenant_all: true"),
  latestReleaseBlocked: body.includes('"release_id=latest"'),
  airlineOnlyBlocked:
    body.includes("airline-demo-new") &&
    body.includes('"state": "blocked"') &&
    body.includes("must_not_be_included_in_phase_1_apply"),
  noApplyClaimed: body.includes("plan_only") && body.includes("not_run_in_plan_pr"),
  noProductWiring: body.includes("product_runtime_wiring"),
  ageDisabled:
    body.includes('"age_enabled": false') &&
    body.includes('"age_required_for_phase1": false') &&
    body.includes('"age_zero_data_acceptance_dependency": false') &&
    !body.match(/^age,/m),
  relationalGraphDeclared:
    body.includes("relationship_node_v1") &&
    body.includes("relationship_edge_v1") &&
    body.includes("relationship_evidence_v1") &&
    body.includes("recursive_sql"),
  legacyUpstreamBlocked:
    body.includes("legacy_home_packs") &&
    body.includes("v6_demo_packs") &&
    body.includes("v7_demo_packs") &&
    body.includes("current_source_operational_tables") &&
    body.includes("current_moves_workflow_tables") &&
    body.includes("current_tower_marts"),
};

const failed = Object.entries(results)
  .filter(([, ok]) => !ok)
  .map(([name]) => name);

const out = {
  schema: "abarva.healthcare-demo-new.phase1.local-validation/v1",
  packageRoot: PACKAGE_ROOT,
  filesChecked: files.length,
  expected: EXPECTED,
  results,
  status: failed.length === 0 ? "pass" : "fail",
  failed,
};

console.log(JSON.stringify(out, null, 2));
if (failed.length) process.exit(1);
