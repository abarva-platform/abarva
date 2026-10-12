import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { blobPathFromUri, configFromEnv, operatorEnv, preflightProofLog, promotionErrorState, stageInputs, validateReviewedProof,
  validateServingPage, servingRowsForPage } from "../run-registered-candidate-aca-job.mjs";

const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const assessment = "tower-registry-candidate-aaaaaaaaaaaaaaaa";
const account = "stfixture";
const container = "private-proof";
const stageUri = `https://${account}.blob.core.windows.net/${container}/operator-proof/tower-registered-partial/${assessment}/stage_run/tower-stage-proof.zip`;
const releaseRecord = "docs/releases/records/2026-10-11-tower-registered-intake-serving-promotion.md";
const digest = `sha256:${"a".repeat(64)}`;
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function env(overrides = {}) {
  return { DATABASE_URL: "postgres://fixture", AZURE_CLIENT_ID: "fixture-identity",
    ABARVA_OPERATOR_IMAGE_DIGEST: digest, TOWER_PROMOTION_EXECUTION_LANE: "aca_operator_job",
    TOWER_PROMOTION_TENANT_KEY: "fixture", TOWER_PROMOTION_ASSESSMENT_ID: assessment,
    TOWER_PROMOTION_STAGE_PROOF_URI: stageUri, TOWER_PROMOTION_STAGE_PROOF_SHA256: sha("stage"),
    TOWER_PROMOTION_CANDIDATE_SHA256: sha("candidate"), TOWER_PROMOTION_INPUT_SHA256: sha("source"),
    TOWER_PROMOTION_PROOF_BLOB_ACCOUNT: account, TOWER_PROMOTION_PROOF_BLOB_CONTAINER: container,
    TOWER_PROMOTION_RUN_ID: "run_001", TOWER_PROMOTION_IDEMPOTENCY_KEY: "idempotency_001",
    TOWER_PROMOTION_JOB_NAME: "fixture-job", TOWER_PROMOTION_OPERATOR_IDENTITY: "fixture-operator",
    TOWER_PROMOTION_IMAGE_DIGEST: digest, TOWER_PROMOTION_GIT_SHA: "b".repeat(40),
    TOWER_PROMOTION_RETRY_COUNT: "0", TOWER_PROMOTION_TIMEOUT_SECONDS: "1800",
    TOWER_PROMOTION_RELEASE_RECORD: releaseRecord,
    TOWER_PROMOTION_APPROVAL_REF: releaseRecord,
    TOWER_PROMOTION_PREFLIGHT_PROOF_URI: `https://${account}.blob.core.windows.net/${container}/operator-proof/tower-registered-promotion/fixture/${assessment}/prior/preflight.json`,
    TOWER_PROMOTION_PREFLIGHT_PROOF_SHA256: sha("reviewed"), ...overrides };
}

test("job configuration requires exact digest, release, approval, and private proof scope", () => {
  assert.equal(configFromEnv("preflight", env()).mode, "preflight");
  assert.equal(configFromEnv("promote", env()).approvalRef, releaseRecord);
  assert.throws(() => configFromEnv("promote", env({ TOWER_PROMOTION_APPROVAL_REF: "other" })), /Serving approval reference/);
  assert.throws(() => configFromEnv("preflight", env({ ABARVA_OPERATOR_IMAGE_DIGEST: `sha256:${"c".repeat(64)}` })), /identity or release binding/);
  assert.throws(() => configFromEnv("preflight", env({ TOWER_PROMOTION_INPUT_SHA256: "bad" })), /input SHA-256/);
  assert.throws(() => configFromEnv("preflight", env({ TOWER_PROMOTION_STAGE_PROOF_URI: "https://other.blob.core.windows.net/private-proof/proof.zip" })), /outside the declared Blob scope/);
  assert.throws(() => blobPathFromUri(`https://${account}.blob.core.windows.net/${container}/../outside`, account, container), /outside the declared Blob scope/);
});

test("staged ZIP must bind exact candidate bytes, receipt, and passing quality proof", async () => {
  const { default: JSZip } = await import("jszip");
  const candidateBytes = Buffer.from(JSON.stringify({ tenant_key: "fixture", assessment_id: assessment,
    input_fingerprint_sha256: sha("source") }));
  const counts = { command_center: 1 };
  const fingerprints = { command_center: sha("page") };
  const receipt = { tenant_key: "fixture", assessment_id: assessment, candidate_sha256: sha(candidateBytes),
    input_fingerprint_sha256: sha("source"), proof_bundle_uri: stageUri,
    stage_status: "staged_pending_independent_readback", quality_gate_status: "pass", runtime_eligible: true,
    source_file_count: 1, source_record_count: 2, object_count: 3,
    view_counts: counts, view_fingerprints: fingerprints };
  const receiptBytes = Buffer.from(JSON.stringify(receipt));
  const validation = { status: "pass", materialized: true, source_file_count: 1, source_record_count: 2,
    canonical_object_count: 3, view_counts: counts, view_fingerprints: fingerprints };
  const quality = { status: "pass", checks: { unapproved_evidence_records_loaded: 0,
    user_detail_records_loaded: 0, approved_fy_budget_known: false, claimable_value_known: false } };
  const zip = new JSZip();
  zip.file("candidate.json", candidateBytes);
  zip.file("stage-receipt.json", receiptBytes);
  zip.file("stage-validation.json", JSON.stringify(validation));
  zip.file("stage-quality-gate.json", JSON.stringify(quality));
  const zipBytes = await zip.generateAsync({ type: "nodebuffer" });
  const config = configFromEnv("preflight", env({ TOWER_PROMOTION_STAGE_PROOF_SHA256: sha(zipBytes),
    TOWER_PROMOTION_CANDIDATE_SHA256: sha(candidateBytes) }));
  const fakeContainer = { getBlockBlobClient: () => ({ downloadToBuffer: async () => zipBytes }) };
  const extracted = await stageInputs(fakeContainer, config);
  assert.ok(extracted.candidateBytes.equals(candidateBytes));
  assert.ok(extracted.receiptBytes.equals(receiptBytes));
  await assert.rejects(stageInputs(fakeContainer, { ...config, candidateSha: sha("changed") }), /candidate bytes mismatch/);
  await assert.rejects(stageInputs(fakeContainer, { ...config, stageSha: sha("changed") }), /SHA-256 mismatch/);
});

test("reviewed preflight proof must be ready and bound to the exact stage", () => {
  const config = configFromEnv("promote", env());
  const receiptBytes = Buffer.from("receipt");
  const pages = ["command_center", "decision_lanes", "recommended_actions", "value_proof", "cost_lens",
    "evidence", "risk_lens", "ai_portfolio", "adoption_lens"];
  const proof = { contract_version: "tower-candidate-promotion-preflight/v1", status: "ready",
    tenant_key: config.tenant, candidate_assessment_id: config.assessment,
    input_fingerprint_sha256: config.sourceSha, candidate_file_sha256: config.candidateSha,
    stage_receipt_sha256: sha(receiptBytes), private_blob_proof: { status: "verified", sha256: config.stageSha },
    gaps: [], physical_view_counts: Object.fromEntries(pages.map((page) => [page, 1])),
    physical_view_fingerprints: Object.fromEntries(pages.map((page) => [page, sha(page)])) };
  assert.doesNotThrow(() => validateReviewedProof(proof, config, receiptBytes));
  assert.throws(() => validateReviewedProof({ ...proof, status: "blocked" }, config, receiptBytes), /not ready/);
  assert.throws(() => validateReviewedProof({ ...proof, stage_receipt_sha256: sha("other") }, config, receiptBytes), /not ready/);
  assert.throws(() => validateReviewedProof({ ...proof, physical_view_counts: { ...proof.physical_view_counts, cost_lens: 0.5 } }, config, receiptBytes), /not ready/);
});

test("guarded operator receives the validated private Blob scope", () => {
  const config = configFromEnv("preflight", env());
  const inherited = { TOWER_RELOAD_PROOF_BLOB_ACCOUNT: "wrong", TOWER_RELOAD_PROOF_BLOB_CONTAINER: "wrong" };
  const passed = operatorEnv(config, inherited);
  assert.equal(passed.TOWER_RELOAD_PROOF_BLOB_ACCOUNT, account);
  assert.equal(passed.TOWER_RELOAD_PROOF_BLOB_CONTAINER, container);
  assert.equal(inherited.TOWER_RELOAD_PROOF_BLOB_ACCOUNT, "wrong");
});

test("serving readback rejects stale view rows even when physical rows match", () => {
  const config = { assessment };
  const receipt = { projection_version: 4 };
  const rows = [{ row_key: "one", source_hash: sha("one") }];
  const priorRows = [{ row_key: "prior", source_hash: sha("prior") }];
  const reviewed = { physical_view_counts: { command_center: 1 },
    physical_view_fingerprints: { command_center: sha(JSON.stringify(rows)) },
    prior_view_fingerprints: { command_center: { rows: 1, fingerprint_sha256: sha(JSON.stringify(priorRows)) } } };
  const served = [{ assessment_id: assessment, projection_version: 4, ...rows[0] }];
  assert.equal(validateServingPage("command_center", rows, served, priorRows, config, receipt, reviewed).served_count, 1);
  assert.throws(() => validateServingPage("command_center", rows,
    [{ ...served[0], assessment_id: "old" }], priorRows, config, receipt, reviewed), /Serving page readback differs/);
  assert.throws(() => validateServingPage("command_center", rows,
    [{ ...served[0], source_hash: sha("changed") }], priorRows, config, receipt, reviewed), /Serving page readback differs/);
  assert.throws(() => validateServingPage("command_center", rows, [], priorRows, config, receipt, reviewed), /Serving page readback differs/);
});

test("serving value view includes only checked value and cost populations", () => {
  const config = { assessment };
  const receipt = { projection_version: 4 };
  const value = { assessment_id: assessment, projection_version: 4, page_key: "value_proof",
    row_key: "value", source_hash: sha("value") };
  const cost = { assessment_id: assessment, projection_version: 4, page_key: "cost_lens",
    row_key: "cost", source_hash: sha("cost") };
  const reviewed = { physical_view_counts: { cost_lens: 1 },
    physical_view_fingerprints: { cost_lens: sha(JSON.stringify([{ row_key: cost.row_key, source_hash: cost.source_hash }])) } };
  assert.deepEqual(servingRowsForPage("value_proof", [cost, value], config, receipt, reviewed), [value]);
  assert.throws(() => servingRowsForPage("value_proof", [value, { ...cost, source_hash: sha("other") }],
    config, receipt, reviewed), /cost population differs/);
  assert.throws(() => servingRowsForPage("value_proof", [value, { ...cost, page_key: "risk_lens" }],
    config, receipt, reviewed), /unexpected generation or page/);
});

test("post-error selector observation distinguishes a committed candidate", () => {
  const config = { tenant: "fixture", assessment };
  const active = [{ assessment_id: assessment, projection_version: 4 }];
  const lifecycle = [{ assessment_id: assessment, projection_version: 4, state: "active" }];
  assert.equal(promotionErrorState(active, lifecycle, config).candidate_active, true);
  assert.equal(promotionErrorState([{ assessment_id: "old", projection_version: 2 }], lifecycle,
    config).candidate_active, false);
  assert.equal(promotionErrorState(active, [{ ...lifecycle[0], state: "retired" }],
    config).candidate_active, false);
  assert.equal(promotionErrorState(active, [...lifecycle,
    { assessment_id: "other", projection_version: 2, state: "active" }], config).candidate_active, false);
});

test("preflight job log carries the exact persisted proof and SHA", () => {
  const bytes = Buffer.from('{"status":"ready"}\n');
  const output = { uri: stageUri, sha256: sha(bytes) };
  const log = preflightProofLog(bytes, output);
  const saved = log.split("__TOWER_PREFLIGHT_PROOF_JSON_BEGIN__\n")[1]
    .split("__TOWER_PREFLIGHT_PROOF_JSON_END__\n")[0];
  assert.ok(Buffer.from(saved).equals(bytes));
  assert.match(log, new RegExp(output.sha256));
});

test("ACA wrapper binds promotion job metadata before planning either script", (t) => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "tower-promotion-plan-"));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  const image = `registry.example/web@${digest}`;
  const binding = [
    "--env", `TOWER_PROMOTION_IMAGE_DIGEST=${digest}`,
    "--env", "TOWER_PROMOTION_JOB_NAME=operator-job",
    "--env", "TOWER_PROMOTION_TIMEOUT_SECONDS=1800",
    "--env", "TOWER_PROMOTION_EXECUTION_LANE=aca_operator_job",
  ];
  const plan = (script, overrides = []) => spawnSync(process.execPath,
    [path.join(repo, "scripts/ops/submit-aca-operator-job.mjs"), "--plan-only", "--image", image,
      "--script", script, "--job", "operator-job", "--timeout", "1800", "--out-dir", out,
      ...binding, ...overrides], { cwd: repo, encoding: "utf8" });
  for (const script of ["tower:registered-intake:preflight-job", "tower:registered-intake:promote-job"]) {
    assert.equal(plan(script).status, 0);
    const saved = JSON.parse(fs.readFileSync(path.join(out, "plan.json"), "utf8"));
    assert.ok(saved.commands.start.includes(script));
  }
  assert.match(plan("tower:registered-intake:promote-job",
    ["--env", "TOWER_PROMOTION_JOB_NAME=wrong-job"]).stderr, /exactly one TOWER_PROMOTION_JOB_NAME/);
  assert.match(plan("tower:registered-intake:preflight-job",
    ["--env", "TOWER_PROMOTION_IMAGE_DIGEST=sha256:" + "c".repeat(64)]).stderr,
  /exactly one TOWER_PROMOTION_IMAGE_DIGEST/);
});
