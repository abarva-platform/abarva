import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkRichSyntheticLoadApproval,
  deriveRichSyntheticSourceIdentity,
} from "../assert-rich-synthetic-load-approval.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SOURCE = path.join(
  ROOT,
  "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-10-reconciled-rich",
);
const RELEASE_RECORD =
  "docs/releases/records/2026-10-13-tower-rich-synthetic-source-reconciliation.md";
const DATASET_ID = "tower-rich-synthetic-source-reconciliation-20261013";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tower-rich-approval-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packageDir = path.join(root, "package");
  const manifestDir = path.join(root, "manifests");
  fs.cpSync(SOURCE, packageDir, { recursive: true });
  fs.mkdirSync(manifestDir);
  const packageManifestPath = path.join(packageDir, "package_manifest.json");
  const packageManifest = JSON.parse(fs.readFileSync(packageManifestPath, "utf8"));
  packageManifest.no_runtime_load = false;
  fs.writeFileSync(packageManifestPath, JSON.stringify(packageManifest));
  const declaration = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "docs/governance/dataset-manifests", `${DATASET_ID}.json`),
      "utf8",
    ),
  );
  declaration.approved_by = "Taylor Example";
  declaration.load_approval = {
    approved_by: "Taylor Example",
    approved_at: "2026-10-13",
    assessment_id: packageManifest.assessment_id,
    source_set_hash: packageManifest.source_set_hash,
    release_record: RELEASE_RECORD,
  };
  const declarationPath = path.join(manifestDir, `${DATASET_ID}.json`);
  fs.writeFileSync(declarationPath, JSON.stringify(declaration));
  return {
    packageDir,
    manifestDir,
    packageManifest,
    declarationPath,
    declaration,
    binding: {
      packageDir,
      manifestDir,
      assessmentId: packageManifest.assessment_id,
      tenantKey: packageManifest.tenant_key,
      releaseRecord: RELEASE_RECORD,
    },
  };
}

test("offline declaration reports pending without authorizing a load", async (t) => {
  const f = fixture(t);
  f.packageManifest.no_runtime_load = true;
  fs.writeFileSync(path.join(f.packageDir, "package_manifest.json"), JSON.stringify(f.packageManifest));
  f.declaration.approved_by = "Pending human review";
  f.declaration.load_approval = null;
  fs.writeFileSync(f.declarationPath, JSON.stringify(f.declaration));
  const result = await checkRichSyntheticLoadApproval(f.binding);
  assert.equal(result.status, "pending");
  assert.match(result.reasons.join("; "), /no_runtime_load|no load_approval/);
});

test("exact named fixture approval passes check-only without database access", async (t) => {
  const f = fixture(t);
  const result = await checkRichSyntheticLoadApproval(f.binding);
  assert.equal(result.status, "approved", result.reasons.join("; "));
  assert.equal(result.binding.object_count, 987);
  assert.equal(result.binding.source_set_hash, deriveRichSyntheticSourceIdentity(f.packageDir).source_set_hash);
});

test("assessment, source hash and release record mismatches fail closed", async (t) => {
  const f = fixture(t);
  const badAssessment = await checkRichSyntheticLoadApproval({
    ...f.binding,
    assessmentId: "another-assessment",
  });
  assert.equal(badAssessment.status, "pending");
  assert.match(badAssessment.reasons.join("; "), /assessment/);

  const unregisteredTenant = await checkRichSyntheticLoadApproval({
    ...f.binding,
    tenantKey: "unregistered-tenant",
  });
  assert.equal(unregisteredTenant.status, "pending");
  assert.match(unregisteredTenant.reasons.join("; "), /tenant input registry/);

  const sourceFile = path.join(
    f.packageDir,
    "layer_1_client_intake/source_system_extracts/20_it_budget_by_domain.csv",
  );
  fs.appendFileSync(sourceFile, "\n");
  const badHash = await checkRichSyntheticLoadApproval(f.binding);
  assert.equal(badHash.status, "pending");
  assert.match(badHash.reasons.join("; "), /source-set hash/);
  fs.copyFileSync(
    path.join(SOURCE, "layer_1_client_intake/source_system_extracts/20_it_budget_by_domain.csv"),
    sourceFile,
  );

  const canonicalFile = path.join(f.packageDir, "layer_3_canonical/canonical_projects.csv");
  fs.appendFileSync(canonicalFile, "\n");
  const changedOutput = await checkRichSyntheticLoadApproval(f.binding);
  assert.equal(changedOutput.status, "pending");
  assert.match(changedOutput.reasons.join("; "), /package output files differ/);
  fs.copyFileSync(path.join(SOURCE, "layer_3_canonical/canonical_projects.csv"), canonicalFile);

  const badRelease = await checkRichSyntheticLoadApproval({
    ...f.binding,
    releaseRecord: "docs/releases/records/2026-10-13-other.md",
  });
  assert.equal(badRelease.status, "pending");
  assert.match(badRelease.reasons.join("; "), /release record/);
});
