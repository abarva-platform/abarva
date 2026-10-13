import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { richStageBlobConfig, uploadRichStageProof } from "../upload-rich-synthetic-stage-proof.mjs";
import { privateStageProof } from "../load-healthcare-demo-layer4-products.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ASSESSMENT = "tower-rich-synthetic-candidate-c50d17bfb71b92b7";
const config = {
  account: "proofaccount",
  container: "privateproof",
  runId: "run_42",
  imageDigest: `sha256:${"a".repeat(64)}`,
};
const stableJson = (value) => Array.isArray(value)
  ? `[${value.map(stableJson).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`
    : JSON.stringify(value);

test("stage Blob input requires a scoped run and digest-pinned image", () => {
  assert.throws(() => richStageBlobConfig({}), /Private stage needs Blob/);
  assert.deepEqual(richStageBlobConfig({
    TOWER_RICH_STAGE_PROOF_BLOB_ACCOUNT: config.account,
    TOWER_RICH_STAGE_PROOF_BLOB_CONTAINER: config.container,
    TOWER_RICH_STAGE_RUN_ID: config.runId,
    ABARVA_OPERATOR_IMAGE_DIGEST: config.imageDigest,
    AZURE_CLIENT_ID: "managed-identity",
  }), config);
});

test("stage proof upload is immutable and verifies the stored bytes", async () => {
  let stored;
  let uploadedPath;
  const containerClient = {
    getBlockBlobClient(blobPath) {
      uploadedPath = blobPath;
      return {
        async uploadData(bytes, options) {
          assert.equal(options.conditions.ifNoneMatch, "*");
          if (stored) throw Object.assign(new Error("already exists"), { statusCode: 409 });
          stored = Buffer.from(bytes);
        },
        async downloadToBuffer() { return stored; },
      };
    },
  };
  const bytes = Buffer.from("private stage proof");
  const input = { tenantKey: "fixture-tenant", assessmentId: ASSESSMENT, config, containerClient };
  const receipt = await uploadRichStageProof(bytes, input);
  assert.match(receipt.uri, new RegExp(`${ASSESSMENT}/${config.runId}/tower-stage-proof\\.tgz$`));
  assert.match(uploadedPath, /^operator-proof\/tower-rich-synthetic-stage\/fixture-tenant\//);
  assert.equal(receipt.sha256.length, 64);
  assert.deepEqual(await uploadRichStageProof(bytes, input), receipt);
  await assert.rejects(uploadRichStageProof(Buffer.from("changed"), input), /readback differs/);
});

test("private stage receipt binds source, unchanged selector and page fingerprints", () => {
  const proof = privateStageProof({
    packageDir: path.join(ROOT, "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-10-reconciled-rich"),
    tenantKey: "meridian-health",
    assessmentId: ASSESSMENT,
    releaseRecord: "docs/releases/records/2026-10-13-tower-rich-synthetic-source-reconciliation.md",
    buildVersion: "test-build",
    idempotencyKey: "test-key",
  }, [{ assessment_id: "retained-active", projection_version: 2 }], {
    active_assessments: [{ assessment_id: "retained-active", projection_version: 2 }],
    physical_page_rows: { tower_ai_portfolio: [{ row_key: "case-1", source_hash: "a".repeat(64) }] },
  });
  assert.equal(proof.source_set_hash, "c50d17bfb71b92b7392e247ca75f33965b9ee4639b6a6fd295ebf9a5884e0c40");
  assert.deepEqual(proof.prior_active_assessments, proof.post_active_assessments);
  assert.equal(proof.pages.tower_ai_portfolio.row_count, 1);
  assert.equal(proof.quality_gate.status, "passed");
  const { proof_content_sha256, ...unsigned } = proof;
  assert.equal(proof_content_sha256, crypto.createHash("sha256").update(stableJson(unsigned)).digest("hex"));
});

test("dry Layer 4 SQL carries source PMO period and never switches the serving selector", () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-rich-stage-dry-"));
  try {
    const result = spawnSync(path.join(ROOT, "node_modules/.bin/tsx"), [
      path.join(ROOT, "scripts/tower/load-healthcare-demo-layer4-products.mjs"),
      "--out-dir", outDir,
    ], { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(fs.readFileSync(path.join(outDir, "tower_layer4_product_cube_load_summary.json"), "utf8"));
    assert.equal(summary.job_contract.assessment_id, ASSESSMENT);
    const sql = fs.readFileSync(summary.load_sql, "utf8");
    assert.doesNotMatch(sql, /tower_assessment_lifecycle/);
    assert.match(sql, /"project_budget_fiscal_year":"FY26"/);
    assert.match(sql, /"project_spend_as_of_date":"2026-08-24"/);
    assert.match(sql, /"actual_spend_ytd_usd":/);
    assert.match(sql, /"source_plan_basis":"synthetic_sponsor_scenario_not_finance_actual"/);
    assert.match(sql, /"project_id":"PRJ-MER-/);
    assert.match(sql, /"source_file":"21_it_project_portfolio.csv"/);
    const readback = fs.readFileSync(summary.readback_sql, "utf8");
    assert.match(readback, /physical_page_rows/);
    assert.match(readback, /serving_target_counts/);
    assert.match(readback, /ai_project_spend_field_survival/);
    assert.match(readback, /source_file' = '21_it_project_portfolio\.csv'/);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
