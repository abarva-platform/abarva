import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  blobPath,
  configFromEnv,
  pageReadback,
  validateStageProof,
} from "../operate-rich-synthetic-serving.mjs";

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const assessment = `tower-rich-synthetic-candidate-${"a".repeat(16)}`;
const tenant = "meridian-health";
const release = "docs/releases/records/2026-10-13-tower-rich-synthetic-serving-control.md";
const stageRelease = "docs/releases/records/2026-10-13-tower-rich-synthetic-serving-control.md";
const stageUri = `https://proofstore.blob.core.windows.net/private/operator-proof/tower-rich-synthetic-stage/${tenant}/${assessment}/run1/tower-stage-proof.tgz`;
const pages = [
  "tower_command_center", "tower_value_proof", "tower_decision_lanes", "tower_evidence",
  "tower_recommended_actions", "tower_ai_portfolio", "tower_cost_lens",
  "tower_risk_lens", "tower_adoption_lens",
];

function fixture() {
  const source = { source_set_hash: "b".repeat(64), files: [], object_count: 987 };
  const pageProof = Object.fromEntries(pages.map((page) => {
    const pageKey = {
      tower_command_center: "command_center", tower_value_proof: "value_proof",
      tower_decision_lanes: "decision_lanes", tower_evidence: "evidence",
      tower_recommended_actions: "recommended_actions", tower_ai_portfolio: "ai_portfolio",
      tower_cost_lens: "cost_lens", tower_risk_lens: "risk_lens",
      tower_adoption_lens: "adoption_lens",
    }[page];
    const rows = [{ page_key: pageKey, row_key: page, source_hash: "c".repeat(64) }];
    return [page, { row_count: 1, row_fingerprint_sha256: sha(stableJson(rows)), rows }];
  }));
  const selector = [{ assessment_id: "previous", projection_version: 6 }];
  const proof = {
    proof_type: "tower_rich_synthetic_private_stage_v1", tenant_key: tenant,
    assessment_id: assessment, projection_version: 2,
    source_set_hash: source.source_set_hash, source_files: source.files,
    release_record: stageRelease, build_version: "build1", idempotency_key: "stage1",
    image_digest: `sha256:${"d".repeat(64)}`,
    quality_gate: { status: "passed", issues: [] },
    prior_active_assessments: selector, post_active_assessments: selector,
    pages: pageProof,
  };
  proof.proof_content_sha256 = sha(stableJson(proof));
  const summary = {
    status: "private_stage_verified", issues: [],
    job_contract: {
      tenant_scope: tenant, assessment_id: assessment,
      build_version: "build1", input_source_version: "input1",
      idempotency_key: "stage1", image_digest: proof.image_digest,
      git_sha: "e".repeat(40), run_id: "run1",
    },
    prior_active_assessments: selector,
    readback: { active_assessments: selector },
  };
  const packageManifest = {
    no_runtime_load: false, assessment_id: assessment,
    tenant_key: tenant, source_set_hash: source.source_set_hash,
  };
  const config = {
    tenant, assessment, releaseRecord: release,
    stageUri, container: "private", account: "proofstore",
    buildVersion: "build1", inputSourceVersion: "input1",
  };
  return { source, proof, summary, packageManifest, config };
}

test("exact stage proof and unchanged selector pass local validation", () => {
  const value = fixture();
  assert.deepEqual(validateStageProof(value.proof, value.summary,
    value.source, value.packageManifest, value.config), []);
});

test("stage proof fails if a page, selector, or digest differs", () => {
  const value = fixture();
  value.proof.pages.tower_ai_portfolio.rows[0].source_hash = "f".repeat(64);
  assert.ok(validateStageProof(value.proof, value.summary,
    value.source, value.packageManifest, value.config).includes("stage_page_fingerprint_invalid"));
  const changed = fixture();
  changed.summary.readback.active_assessments = [{ assessment_id: "other", projection_version: 6 }];
  assert.ok(validateStageProof(changed.proof, changed.summary,
    changed.source, changed.packageManifest, changed.config).includes("stage_summary_or_selector_mismatch"));
});

test("stage proof accepts a row key reused on another page and rejects a duplicate within one page", () => {
  const value = fixture();
  const first = value.proof.pages.tower_command_center;
  first.rows.push({ page_key: "decision_lanes", row_key: first.rows[0].row_key, source_hash: "d".repeat(64) });
  first.row_count = first.rows.length;
  first.row_fingerprint_sha256 = sha(stableJson(first.rows));
  value.proof.proof_content_sha256 = sha(stableJson(Object.fromEntries(
    Object.entries(value.proof).filter(([key]) => key !== "proof_content_sha256"),
  )));
  assert.deepEqual(validateStageProof(value.proof, value.summary,
    value.source, value.packageManifest, value.config), []);
  first.rows[1].page_key = first.rows[0].page_key;
  assert.ok(validateStageProof(value.proof, value.summary,
    value.source, value.packageManifest, value.config).includes("stage_page_fingerprint_invalid"));
});

test("job config requires digest-pinned ACA lane and scoped stage Blob", () => {
  const env = {
    TOWER_RICH_SERVING_TENANT_KEY: tenant,
    TOWER_RICH_SERVING_ASSESSMENT_ID: assessment,
    TOWER_RICH_SERVING_STAGE_BUNDLE_URI: stageUri,
    TOWER_RICH_SERVING_STAGE_BUNDLE_SHA256: "a".repeat(64),
    TOWER_RICH_SERVING_PROOF_BLOB_ACCOUNT: "proofstore",
    TOWER_RICH_SERVING_PROOF_BLOB_CONTAINER: "private",
    TOWER_RICH_SERVING_RUN_ID: "run2",
    TOWER_RICH_SERVING_JOB_NAME: "private_operator",
    TOWER_RICH_SERVING_IDEMPOTENCY_KEY: "serve1",
    TOWER_RICH_SERVING_BUILD_VERSION: "build1",
    TOWER_RICH_SERVING_INPUT_SOURCE_VERSION: "input1",
    TOWER_RICH_SERVING_OPERATOR_IDENTITY: "operator",
    TOWER_RICH_SERVING_IMAGE_DIGEST: `sha256:${"1".repeat(64)}`,
    TOWER_RICH_SERVING_GIT_SHA: "2".repeat(40),
    TOWER_RICH_SERVING_RELEASE_RECORD: release,
    ABARVA_OPERATOR_IMAGE_DIGEST: `sha256:${"1".repeat(64)}`,
    TOWER_RICH_SERVING_EXECUTION_LANE: "aca_operator_job",
    DATABASE_URL: "postgres://test",
    AZURE_CLIENT_ID: "test",
  };
  assert.equal(configFromEnv("check", env).assessment, assessment);
  assert.equal(blobPath(stageUri, configFromEnv("check", env)).endsWith("/tower-stage-proof.tgz"), true);
  assert.throws(() => configFromEnv("check", {
    ...env, TOWER_RICH_SERVING_EXECUTION_LANE: "local",
  }), /identity or release binding/);
  assert.throws(() => configFromEnv("check", {
    ...env, TOWER_RICH_SERVING_STAGE_BUNDLE_URI: stageUri.replace("proofstore", "otherstore"),
  }), /outside the declared Blob scope/);
});

test("physical and serving reads use their respective page partitions", async () => {
  const queries = [];
  const client = { query: async (sql) => {
    queries.push(sql);
    return { rows: [{ row_key: "same", source_hash: "f".repeat(64) }] };
  } };
  const physical = await pageReadback(client, "ecl_projection", tenant, assessment, 2);
  assert.equal(Object.keys(physical).length, 9);
  assert.ok(queries.some((sql) => sql.includes("display_payload_json ->> 'page_key'")));
  queries.length = 0;
  const serving = await pageReadback(client, "serving", tenant, assessment, 2);
  assert.equal(Object.keys(serving).length, 9);
  assert.ok(queries.every((sql) => !sql.includes("display_payload_json")));
  assert.ok(queries.some((sql) => sql.includes("from serving.tower_adoption_lens")));
});
