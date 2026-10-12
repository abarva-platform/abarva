#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { verifyProofBundleContents } from "./operate-registered-intake-candidate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHA256 = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-zA-Z0-9_-]+$/;
const PAGE_TABLE = Object.freeze({
  command_center: ["tower_command_center", "page_key"],
  decision_lanes: ["tower_command_center", "page_key"],
  recommended_actions: ["tower_command_center", "page_key"],
  value_proof: ["tower_value_chain", "page_key"],
  cost_lens: ["tower_value_chain", "page_key"],
  evidence: ["tower_evidence_queue", "page_key"],
  risk_lens: ["tower_evidence_queue", "page_key"],
  ai_portfolio: ["tower_ai_portfolio", "display_payload_json"],
  adoption_lens: ["tower_ai_portfolio", "display_payload_json"],
});
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function boundedInteger(env, key, minimum) {
  const value = Number(required(env, key));
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${key} is invalid`);
  return value;
}

export function configFromEnv(mode, env = process.env) {
  if (!["preflight", "promote"].includes(mode)) throw new Error("Use preflight or promote");
  const get = (suffix) => required(env, `TOWER_PROMOTION_${suffix}`);
  const config = {
    mode,
    tenant: get("TENANT_KEY"), assessment: get("ASSESSMENT_ID"),
    stageUri: get("STAGE_PROOF_URI"), stageSha: get("STAGE_PROOF_SHA256"),
    candidateSha: get("CANDIDATE_SHA256"), sourceSha: get("INPUT_SHA256"),
    account: get("PROOF_BLOB_ACCOUNT"), container: get("PROOF_BLOB_CONTAINER"),
    runId: get("RUN_ID"), idempotencyKey: get("IDEMPOTENCY_KEY"),
    jobName: get("JOB_NAME"), operatorIdentity: get("OPERATOR_IDENTITY"),
    imageDigest: get("IMAGE_DIGEST"), gitSha: get("GIT_SHA"),
    retryCount: boundedInteger(env, "TOWER_PROMOTION_RETRY_COUNT", 0),
    timeoutSeconds: boundedInteger(env, "TOWER_PROMOTION_TIMEOUT_SECONDS", 1),
    releaseRecord: get("RELEASE_RECORD"),
    approvalRef: mode === "promote" ? get("APPROVAL_REF") : null,
    reviewedUri: mode === "promote" ? get("PREFLIGHT_PROOF_URI") : null,
    reviewedSha: mode === "promote" ? get("PREFLIGHT_PROOF_SHA256") : null,
  };
  for (const [key, value] of [["stage proof", config.stageSha], ["candidate", config.candidateSha],
    ["input", config.sourceSha], ["reviewed preflight", config.reviewedSha]]) {
    if (value !== null && !SHA256.test(value)) throw new Error(`${key} SHA-256 is invalid`);
  }
  if (!/^tower-registry-candidate-[a-f0-9]{16}$/.test(config.assessment) ||
      !ID.test(config.tenant) || !ID.test(config.runId) || !ID.test(config.jobName) ||
      !/^[a-z0-9-]{3,24}$/.test(config.account) || !/^[a-z0-9-]{3,63}$/.test(config.container) ||
      !GIT_SHA.test(config.gitSha) || !/^sha256:[a-f0-9]{64}$/.test(config.imageDigest) ||
      env.ABARVA_OPERATOR_IMAGE_DIGEST !== config.imageDigest ||
      env.TOWER_PROMOTION_EXECUTION_LANE !== "aca_operator_job" ||
      !/^docs\/releases\/records\/[a-zA-Z0-9._-]+\.md$/.test(config.releaseRecord) ||
      !fs.existsSync(path.join(ROOT, config.releaseRecord))) {
    throw new Error("Tower promotion job identity or release binding is invalid");
  }
  if (mode === "promote" && (!/^docs\/releases\/records\/[a-zA-Z0-9._-]+\.md$/.test(config.approvalRef) ||
      config.approvalRef !== config.releaseRecord)) throw new Error("Serving approval reference must match the release record");
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!env.AZURE_STORAGE_CONNECTION_STRING && !env.AZURE_CLIENT_ID) throw new Error("Private Blob credential is required");
  blobPathFromUri(config.stageUri, config.account, config.container);
  if (config.reviewedUri) {
    const reviewedPath = blobPathFromUri(config.reviewedUri, config.account, config.container);
    if (!new RegExp(`^operator-proof/tower-registered-promotion/${config.tenant}/${config.assessment}/[a-zA-Z0-9_-]+/preflight\\.json$`).test(reviewedPath)) {
      throw new Error("Reviewed preflight URI is outside the candidate proof lane");
    }
  }
  return config;
}

export function blobPathFromUri(uri, account, container) {
  const url = new URL(uri);
  const prefix = `/${container}/`;
  if (url.protocol !== "https:" || url.hostname !== `${account}.blob.core.windows.net` ||
      !url.pathname.startsWith(prefix) || url.search || url.hash) throw new Error("Private proof URI is outside the declared Blob scope");
  const blobPath = decodeURIComponent(url.pathname.slice(prefix.length));
  if (!blobPath || blobPath.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Private proof Blob path is invalid");
  }
  return blobPath;
}

function blobUri(config, name) {
  return `https://${config.account}.blob.core.windows.net/${config.container}/${name}`;
}

function outputPath(config, name) {
  return `operator-proof/tower-registered-promotion/${config.tenant}/${config.assessment}/${config.runId}/${name}`;
}

async function blobClient(config) {
  const { BlobServiceClient } = await import("@azure/storage-blob");
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
    return BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)
      .getContainerClient(config.container);
  }
  const { DefaultAzureCredential } = await import("@azure/identity");
  const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID });
  return new BlobServiceClient(`https://${config.account}.blob.core.windows.net`, credential)
    .getContainerClient(config.container);
}

async function downloadExact(container, config, uri, expectedSha) {
  const bytes = await container.getBlockBlobClient(blobPathFromUri(uri, config.account, config.container)).downloadToBuffer();
  if (sha(bytes) !== expectedSha) throw new Error("Private proof SHA-256 mismatch");
  return bytes;
}

async function uploadAndReadback(container, config, name, bytes, immutable = true) {
  const blob = container.getBlockBlobClient(outputPath(config, name));
  try {
    await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: "application/json" },
      ...(immutable ? { conditions: { ifNoneMatch: "*" } } : {}) });
  } catch (error) {
    if (!immutable || ![409, 412].includes(error?.statusCode)) throw error;
  }
  const stored = await blob.downloadToBuffer();
  if (!stored.equals(bytes)) throw new Error(`Private Blob readback differs: ${name}`);
  return { uri: blobUri(config, outputPath(config, name)), sha256: sha(bytes) };
}

export async function stageInputs(container, config) {
  const stagePath = blobPathFromUri(config.stageUri, config.account, config.container);
  if (!new RegExp(`^operator-proof/tower-registered-partial/${config.assessment}/[a-zA-Z0-9_-]+/tower-stage-proof\\.zip$`).test(stagePath)) {
    throw new Error("Stage proof URI does not bind the candidate assessment");
  }
  const zipBytes = await downloadExact(container, config, config.stageUri, config.stageSha);
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(zipBytes);
  const candidateBytes = await zip.file("candidate.json")?.async("nodebuffer");
  const receiptBytes = await zip.file("stage-receipt.json")?.async("nodebuffer");
  if (!candidateBytes || !receiptBytes || sha(candidateBytes) !== config.candidateSha) throw new Error("Staged candidate bytes mismatch");
  const candidate = JSON.parse(candidateBytes);
  const receipt = JSON.parse(receiptBytes);
  if (candidate.tenant_key !== config.tenant || candidate.assessment_id !== config.assessment ||
      candidate.input_fingerprint_sha256 !== config.sourceSha || receipt.proof_bundle_uri !== config.stageUri ||
      receipt.candidate_sha256 !== config.candidateSha || receipt.input_fingerprint_sha256 !== config.sourceSha ||
      receipt.stage_status !== "staged_pending_independent_readback" || receipt.quality_gate_status !== "pass" ||
      receipt.runtime_eligible !== true) throw new Error("Stage receipt identity or gate mismatch");
  await verifyProofBundleContents(zipBytes, candidateBytes, receiptBytes);
  return { candidateBytes, receiptBytes, candidate, receipt };
}

export function validateReviewedProof(proof, config, receiptBytes) {
  if (proof.contract_version !== "tower-candidate-promotion-preflight/v1" || proof.status !== "ready" ||
      proof.tenant_key !== config.tenant || proof.candidate_assessment_id !== config.assessment ||
      proof.input_fingerprint_sha256 !== config.sourceSha || proof.candidate_file_sha256 !== config.candidateSha ||
      proof.stage_receipt_sha256 !== sha(receiptBytes) || proof.private_blob_proof?.status !== "verified" ||
      proof.private_blob_proof.sha256 !== config.stageSha || proof.gaps?.length !== 0 ||
      Object.keys(PAGE_TABLE).some((page) => !Number.isInteger(proof.physical_view_counts?.[page]) ||
        !SHA256.test(proof.physical_view_fingerprints?.[page] ?? ""))) {
    throw new Error("Reviewed preflight proof is not ready for this exact staged candidate");
  }
}

export function operatorEnv(config, env = process.env) {
  return { ...env, TOWER_RELOAD_PROOF_BLOB_ACCOUNT: config.account,
    TOWER_RELOAD_PROOF_BLOB_CONTAINER: config.container };
}

function runOperator(mode, candidatePath, receiptPath, outPath, config, reviewedPath = null) {
  const args = [path.join(ROOT, "scripts/tower/operate-registered-intake-candidate.mjs"), mode,
    "--candidate", candidatePath, "--stage-receipt", receiptPath, "--out", outPath];
  if (mode === "promote") args.push("--preflight-proof", reviewedPath,
    "--expected-proof-sha256", config.reviewedSha, "--expected-input-sha256", config.sourceSha,
    "--approval-ref", config.approvalRef);
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", timeout: config.timeoutSeconds * 1000,
    maxBuffer: 5 * 1024 * 1024, env: operatorEnv(config) });
  if (result.error || ![0, ...(mode === "preflight" ? [2] : [])].includes(result.status) || !fs.existsSync(outPath)) {
    const error = new Error(`Tower ${mode} operator failed: ${result.error?.message ?? result.stderr?.slice(0, 1000) ?? result.status}`);
    if (fs.existsSync(outPath)) error.operatorProofBytes = fs.readFileSync(outPath);
    throw error;
  }
  const bytes = fs.readFileSync(outPath);
  const proof = JSON.parse(bytes);
  if ((mode === "preflight" && (result.status === 0) !== (proof.status === "ready")) ||
      (mode === "promote" && proof.status !== "promoted")) {
    const error = new Error(`Tower ${mode} proof status mismatch`);
    error.operatorProofBytes = bytes;
    throw error;
  }
  return { bytes, proof, exitStatus: result.status };
}

export function validateServingPage(page, rows, served, priorRows, config, receipt, reviewed) {
  const count = rows.length;
  const fingerprint = sha(JSON.stringify(rows));
  const servedFingerprint = sha(JSON.stringify(served.map(({ row_key, source_hash }) => ({ row_key, source_hash }))));
  const prior = { rows: priorRows.length, fingerprint_sha256: sha(JSON.stringify(priorRows)) };
  if (count !== reviewed.physical_view_counts[page] ||
      fingerprint !== reviewed.physical_view_fingerprints[page] ||
      served.length !== count || servedFingerprint !== fingerprint ||
      served.some((row) => row.assessment_id !== config.assessment ||
        Number(row.projection_version) !== receipt.projection_version) ||
      JSON.stringify(prior) !== JSON.stringify(reviewed.prior_view_fingerprints?.[page])) {
    throw new Error(`Serving page readback differs: ${page}`);
  }
  return { count, fingerprint, served_count: served.length, served_fingerprint: servedFingerprint, prior };
}

export function servingRowsForPage(page, allRows, config, receipt, reviewed) {
  const allowed = page === "value_proof" ? ["value_proof", "cost_lens"] : [page];
  if (allRows.some((row) => !allowed.includes(row.page_key) || row.assessment_id !== config.assessment ||
      Number(row.projection_version) !== receipt.projection_version)) {
    throw new Error(`Serving view has an unexpected generation or page: ${page}`);
  }
  if (page === "value_proof") {
    const costRows = allRows.filter((row) => row.page_key === "cost_lens");
    const costFingerprint = sha(JSON.stringify(costRows.map(({ row_key, source_hash }) => ({ row_key, source_hash }))));
    if (costRows.length !== reviewed.physical_view_counts.cost_lens ||
        costFingerprint !== reviewed.physical_view_fingerprints.cost_lens) {
      throw new Error("Serving value view cost population differs");
    }
  }
  return allRows.filter((row) => row.page_key === page);
}

export async function servingReadback(config, receipt, reviewed) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin transaction read only");
    await client.query("select set_config('app.tenant_key', $1, true)", [config.tenant]);
    const lifecycle = (await client.query(
      "select assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle where tenant_key=$1",
      [config.tenant],
    )).rows;
    const selected = (await client.query(
      "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key=$1",
      [config.tenant],
    )).rows;
    const counts = {};
    const fingerprints = {};
    const servingCounts = {};
    const servingFingerprints = {};
    const servingViewTotalCounts = {};
    const prior = {};
    for (const [page, [table, column]] of Object.entries(PAGE_TABLE)) {
      const predicate = column === "page_key" ? "page_key=$4" : "display_payload_json->>'page_key'=$4";
      const query = `select row_key, source_hash from ecl_projection.${table} where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and ${predicate} order by row_key, source_hash`;
      const rows = (await client.query(query, [config.tenant, config.assessment, receipt.projection_version, page])).rows;
      const priorRows = (await client.query(query, [config.tenant, reviewed.prior_active.assessment_id,
        reviewed.prior_active.projection_version, page])).rows;
      const servedAll = (await client.query(
        `select assessment_id, projection_version, page_key, row_key, source_hash from serving.tower_${page} where tenant_key=$1 order by row_key, source_hash`,
        [config.tenant],
      )).rows;
      servingViewTotalCounts[page] = servedAll.length;
      const served = servingRowsForPage(page, servedAll, config, receipt, reviewed);
      const checked = validateServingPage(page, rows, served, priorRows, config, receipt, reviewed);
      counts[page] = checked.count;
      fingerprints[page] = checked.fingerprint;
      servingCounts[page] = checked.served_count;
      servingFingerprints[page] = checked.served_fingerprint;
      prior[page] = checked.prior;
    }
    if (selected.length !== 1 || selected[0].assessment_id !== config.assessment ||
        Number(selected[0].projection_version) !== receipt.projection_version ||
        lifecycle.filter((row) => row.state === "active").length !== 1 ||
        !lifecycle.some((row) => row.assessment_id === config.assessment && row.state === "active" &&
          Number(row.projection_version) === receipt.projection_version) ||
        !lifecycle.some((row) => row.assessment_id === reviewed.prior_active.assessment_id && row.state === "retired" &&
          Number(row.projection_version) === reviewed.prior_active.projection_version)) {
      throw new Error("Serving selector or lifecycle readback differs");
    }
    await client.query("commit");
    return { contract_version: "tower-candidate-serving-readback/v1", status: "pass", tenant_key: config.tenant,
      assessment_id: config.assessment, projection_version: receipt.projection_version,
      active_selector: selected[0], lifecycle, view_counts: counts, view_fingerprints: fingerprints,
      serving_view_counts: servingCounts, serving_view_fingerprints: servingFingerprints,
      serving_view_total_counts: servingViewTotalCounts,
      prior_view_fingerprints: prior };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

export function promotionErrorState(selected, lifecycle, config) {
  const candidateActive = selected.length === 1 && selected[0].assessment_id === config.assessment &&
    lifecycle.filter((row) => row.state === "active").length === 1 &&
    lifecycle.some((row) => row.assessment_id === config.assessment && row.state === "active" &&
      Number(row.projection_version) === Number(selected[0].projection_version));
  return { contract_version: "tower-candidate-selector-after-error/v1", status: "observed",
    tenant_key: config.tenant, candidate_assessment_id: config.assessment,
    candidate_active: candidateActive, active_selector: selected, lifecycle };
}

async function selectorAfterPromotionError(config) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin transaction read only");
    await client.query("select set_config('app.tenant_key', $1, true)", [config.tenant]);
    const selected = (await client.query(
      "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key=$1",
      [config.tenant],
    )).rows;
    const lifecycle = (await client.query(
      "select assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle where tenant_key=$1",
      [config.tenant],
    )).rows;
    await client.query("commit");
    return promotionErrorState(selected, lifecycle, config);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

function jobMetadata(config, startedAt, status, outputs = {}, error = null) {
  return { contract_version: "tower-candidate-aca-job/v1", status, mode: config.mode,
    job_name: config.jobName, job_run_id: config.runId, tenant_key: config.tenant,
    candidate_assessment_id: config.assessment, build_version: "tower-candidate-promotion/v1",
    input_source_version: config.sourceSha, idempotency_key: config.idempotencyKey,
    operator_identity: config.operatorIdentity, git_sha: config.gitSha, image_digest: config.imageDigest,
    retry_count: config.retryCount, timeout_seconds: config.timeoutSeconds,
    started_at: startedAt, finished_at: status === "running" ? null : new Date().toISOString(),
    stage_proof_uri: config.stageUri, stage_proof_sha256: config.stageSha,
    candidate_sha256: config.candidateSha, reviewed_preflight_uri: config.reviewedUri,
    reviewed_preflight_sha256: config.reviewedSha, release_record: config.releaseRecord,
    progress_output_uri: blobUri(config, outputPath(config, "progress.json")),
    validation_output_uri: outputs.validation?.uri ?? null,
    quality_gate_output_uri: outputs.quality?.uri ?? null,
    proof_bundle_uri: outputs.proof?.uri ?? null, outputs, error };
}

export function preflightProofLog(bytes, output) {
  return `__TOWER_PREFLIGHT_PROOF_JSON_BEGIN__\n${bytes.toString("utf8")}` +
    `__TOWER_PREFLIGHT_PROOF_JSON_END__\n${JSON.stringify({ event: "tower_candidate_preflight_proof",
      uri: output.uri, sha256: output.sha256 })}\n`;
}

async function progress(container, config, startedAt, status, detail = {}) {
  const value = { contract_version: "tower-candidate-aca-progress/v1", status, mode: config.mode,
    job_run_id: config.runId, tenant_key: config.tenant, assessment_id: config.assessment,
    started_at: startedAt, updated_at: new Date().toISOString(), ...detail };
  return uploadAndReadback(container, config, "progress.json", jsonBytes(value), false);
}

export async function execute(mode, env = process.env) {
  const config = configFromEnv(mode, env);
  const startedAt = new Date().toISOString();
  const container = await blobClient(config);
  const outputs = {};
  let stage;
  let reviewed;
  let promotionAttempted = false;
  try {
    await progress(container, config, startedAt, "running", { checkpoint: "fetch_stage_proof" });
    stage = await stageInputs(container, config);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tower-candidate-operator-"));
    const candidatePath = path.join(dir, "candidate.json");
    const receiptPath = path.join(dir, "stage-receipt.json");
    fs.writeFileSync(candidatePath, stage.candidateBytes);
    fs.writeFileSync(receiptPath, stage.receiptBytes);
    if (mode === "preflight") {
      await progress(container, config, startedAt, "running", { checkpoint: "read_only_preflight" });
      const result = runOperator("preflight", candidatePath, receiptPath, path.join(dir, "preflight.json"), config);
      outputs.proof = await uploadAndReadback(container, config, "preflight.json", result.bytes);
      outputs.validation = outputs.proof;
      outputs.quality = { uri: stage.receipt.quality_gate_output_uri };
      outputs.preflight_gate_status = result.proof.status;
      outputs.validation_gaps = result.proof.gaps;
      const status = result.proof.status === "ready" ? "succeeded" : "failed";
      await progress(container, config, startedAt, status, { checkpoint: "preflight_persisted",
        proof_sha256: outputs.proof.sha256, gate_status: result.proof.status });
      outputs.job_contract = await uploadAndReadback(container, config, "job-contract.json",
        jsonBytes(jobMetadata(config, startedAt, status, outputs,
          result.proof.status === "ready" ? null : "preflight_blocked")));
      process.stdout.write(preflightProofLog(result.bytes, outputs.proof));
      return { status: result.proof.status === "ready" ? "succeeded" : "blocked", outputs, gaps: result.proof.gaps };
    }
    const reviewedBytes = await downloadExact(container, config, config.reviewedUri, config.reviewedSha);
    reviewed = JSON.parse(reviewedBytes);
    validateReviewedProof(reviewed, config, stage.receiptBytes);
    const reviewedPath = path.join(dir, "reviewed-preflight.json");
    fs.writeFileSync(reviewedPath, reviewedBytes);
    await progress(container, config, startedAt, "running", { checkpoint: "guarded_promotion" });
    promotionAttempted = true;
    const result = runOperator("promote", candidatePath, receiptPath, path.join(dir, "promotion.json"), config, reviewedPath);
    outputs.proof = await uploadAndReadback(container, config, "promotion.json", result.bytes);
    await progress(container, config, startedAt, "running", { checkpoint: "serving_readback", proof_sha256: outputs.proof.sha256 });
    const readback = await servingReadback(config, stage.receipt, reviewed);
    outputs.quality = await uploadAndReadback(container, config, "serving-readback.json", jsonBytes(readback));
    outputs.validation = outputs.proof;
    await progress(container, config, startedAt, "succeeded", { checkpoint: "proof_readback_verified",
      promotion_proof_sha256: outputs.proof.sha256, serving_readback_sha256: outputs.quality.sha256 });
    outputs.job_contract = await uploadAndReadback(container, config, "job-contract.json",
      jsonBytes(jobMetadata(config, startedAt, "succeeded", outputs)));
    return { status: "succeeded", outputs, gaps: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (promotionAttempted) {
      if (error.operatorProofBytes) {
        try {
          outputs.operator_status = await uploadAndReadback(container, config, "promotion-operator-status.json",
            error.operatorProofBytes);
        } catch (proofError) {
          outputs.operator_status_gap = String(proofError);
        }
      }
      try {
        const selector = await selectorAfterPromotionError(config);
        outputs.selector_after_error_state = selector.candidate_active ? "candidate_active" : "candidate_not_selected";
        outputs.selector_after_error = await uploadAndReadback(container, config,
          "selector-after-error.json", jsonBytes(selector));
        if (selector.candidate_active && stage && reviewed) {
          try {
            const readback = await servingReadback(config, stage.receipt, reviewed);
            outputs.serving_after_error = await uploadAndReadback(container, config,
              "serving-after-error.json", jsonBytes(readback));
          } catch (readbackError) {
            outputs.serving_after_error_gap = String(readbackError);
          }
        }
      } catch (selectorError) {
        outputs.selector_after_error_gap = String(selectorError);
      }
    }
    try {
      outputs.job_contract = await uploadAndReadback(container, config, "job-contract.json",
        jsonBytes(jobMetadata(config, startedAt, "failed", outputs, message)));
      await progress(container, config, startedAt, "failed", { checkpoint: "stopped", error: message });
    } catch (proofError) {
      throw new Error(`${message}; private failure proof unavailable: ${String(proofError)}`);
    }
    throw new Error(`${message}; selector_after_error=${outputs.selector_after_error_state ?? "unverified"}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute(process.argv[2]).then((result) => {
    process.stdout.write(`${JSON.stringify({ event: "tower_candidate_aca_job", ...result })}\n`);
    if (result.status !== "succeeded") process.exitCode = 2;
  }).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
