#!/usr/bin/env node

// Select an independently staged Tower generation only after exact-version review.
// The Layer 4 build owns its rows; this operator changes only the serving selector.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATASET_ID = "tower-rich-synthetic-source-reconciliation-20261013";
const PACKAGE_DIR = path.join(ROOT, "datasets/tenant-inputs/generated/meridian-health/tower-layer1-v2026-10-reconciled-rich");
const MANIFEST_DIR = path.join(ROOT, "docs/governance/dataset-manifests");
const REGISTRY = path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json");
const SHA256 = /^[0-9a-f]{64}$/;
const ID = /^[a-zA-Z0-9_-]+$/;
const SOURCE_NAMES = [
  "20_it_budget_by_domain.csv", "21_it_project_portfolio.csv", "22_ai_business_cases.csv",
  "23_ai_tool_rollout.csv", "24_monthly_value_tracking.csv", "25_finance_approval_ledger.csv",
  "26_evidence_register.csv",
];
const PAGES = Object.freeze({
  tower_command_center: ["tower_command_center", null],
  tower_value_proof: ["tower_value_chain", null],
  tower_decision_lanes: ["tower_command_center", "decision_lanes"],
  tower_evidence: ["tower_evidence_queue", "evidence"],
  tower_recommended_actions: ["tower_command_center", "recommended_actions"],
  tower_ai_portfolio: ["tower_ai_portfolio", "ai_portfolio"],
  tower_cost_lens: ["tower_value_chain", "cost_lens"],
  tower_risk_lens: ["tower_evidence_queue", "risk_lens"],
  tower_adoption_lens: ["tower_ai_portfolio", "adoption_lens"],
});

const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const proofBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const required = (env, key) => {
  const value = env[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
};

function sourceRowCount(value) {
  let quoted = false;
  let records = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"') {
      if (quoted && value[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (value[index] === "\n" && !quoted) records += 1;
  }
  if (quoted) throw new Error("Source CSV has an unclosed quoted field");
  if (value.length && value.at(-1) !== "\n") records += 1;
  return Math.max(records - 1, 0);
}

export function sourceIdentity(packageDir = PACKAGE_DIR) {
  const files = SOURCE_NAMES.map((name) => {
    const file = `layer_1_client_intake/source_system_extracts/${name}`;
    const bytes = fs.readFileSync(path.join(packageDir, file));
    return { file, rows: sourceRowCount(bytes.toString("utf8")), sha256: sha(bytes) };
  }).sort((left, right) => left.file.localeCompare(right.file));
  return {
    files,
    object_count: files.reduce((sum, entry) => sum + entry.rows, 0),
    source_set_hash: sha(JSON.stringify(files)),
  };
}

export function configFromEnv(mode, env = process.env) {
  if (!["check", "promote", "rollback"].includes(mode)) throw new Error("Use check, promote, or rollback");
  const get = (suffix) => required(env, `TOWER_RICH_SERVING_${suffix}`);
  const config = {
    mode, tenant: get("TENANT_KEY"), assessment: get("ASSESSMENT_ID"),
    stageUri: get("STAGE_BUNDLE_URI"), stageSha: get("STAGE_BUNDLE_SHA256"),
    account: get("PROOF_BLOB_ACCOUNT"), container: get("PROOF_BLOB_CONTAINER"),
    runId: get("RUN_ID"), jobName: get("JOB_NAME"),
    idempotencyKey: get("IDEMPOTENCY_KEY"), buildVersion: get("BUILD_VERSION"),
    inputSourceVersion: get("INPUT_SOURCE_VERSION"),
    operatorIdentity: get("OPERATOR_IDENTITY"),
    imageDigest: get("IMAGE_DIGEST"), gitSha: get("GIT_SHA"),
    releaseRecord: get("RELEASE_RECORD"),
    preflightUri: mode === "promote" ? get("PREFLIGHT_URI") : null,
    preflightSha: mode === "promote" ? get("PREFLIGHT_SHA256") : null,
    promotionUri: mode === "rollback" ? get("PROMOTION_URI") : null,
    promotionSha: mode === "rollback" ? get("PROMOTION_SHA256") : null,
  };
  if (!ID.test(config.tenant) || !/^tower-rich-synthetic-candidate-[0-9a-f]{16}$/.test(config.assessment) ||
      !ID.test(config.runId) || !ID.test(config.jobName) ||
      !/^[a-z0-9-]{3,24}$/.test(config.account) || !/^[a-z0-9-]{3,63}$/.test(config.container) ||
      !/^[0-9a-f]{40}$/.test(config.gitSha) ||
      !/^sha256:[0-9a-f]{64}$/.test(config.imageDigest) ||
      env.ABARVA_OPERATOR_IMAGE_DIGEST !== config.imageDigest ||
      env.TOWER_RICH_SERVING_EXECUTION_LANE !== "aca_operator_job" ||
      !/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(config.releaseRecord) ||
      !fs.existsSync(path.join(ROOT, config.releaseRecord)) ||
      !SHA256.test(config.stageSha) ||
      (config.preflightSha && !SHA256.test(config.preflightSha)) ||
      (config.promotionSha && !SHA256.test(config.promotionSha))) {
    throw new Error("Rich Tower serving job identity or release binding is invalid");
  }
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!env.AZURE_STORAGE_CONNECTION_STRING && !env.AZURE_CLIENT_ID) {
    throw new Error("Private Blob credential is required");
  }
  const stagePath = blobPath(config.stageUri, config);
  if (!stagePath.startsWith(`operator-proof/tower-rich-synthetic-stage/${config.tenant}/${config.assessment}/`) ||
      !stagePath.endsWith("/tower-stage-proof.tgz")) {
    throw new Error("Stage bundle URI is outside the exact assessment lane");
  }
  if (config.preflightUri && !blobPath(config.preflightUri, config).startsWith(
    `operator-proof/tower-rich-synthetic-serving/${config.tenant}/${config.assessment}/`)) {
    throw new Error("Preflight URI is outside the exact assessment lane");
  }
  if (config.promotionUri && !blobPath(config.promotionUri, config).startsWith(
    `operator-proof/tower-rich-synthetic-serving/${config.tenant}/${config.assessment}/`)) {
    throw new Error("Promotion URI is outside the exact assessment lane");
  }
  return config;
}

export function blobPath(uri, config) {
  const url = new URL(uri);
  const prefix = `/${config.container}/`;
  if (url.protocol !== "https:" || url.hostname !== `${config.account}.blob.core.windows.net` ||
      !url.pathname.startsWith(prefix) || url.search || url.hash) {
    throw new Error("Private proof URI is outside the declared Blob scope");
  }
  const name = decodeURIComponent(url.pathname.slice(prefix.length));
  if (!name || name.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Private proof Blob path is invalid");
  }
  return name;
}

async function containerClient(config) {
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
  const bytes = await container.getBlockBlobClient(blobPath(uri, config)).downloadToBuffer();
  if (sha(bytes) !== expectedSha) throw new Error("Private proof SHA-256 mismatch");
  return bytes;
}

async function uploadExact(container, config, name, value) {
  const bytes = proofBytes(value);
  const blobName = `operator-proof/tower-rich-synthetic-serving/${config.tenant}/${config.assessment}/${config.runId}/${name}`;
  const blob = container.getBlockBlobClient(blobName);
  try {
    await blob.uploadData(bytes, {
      blobHTTPHeaders: { blobContentType: "application/json" },
      conditions: { ifNoneMatch: "*" },
    });
  } catch (error) {
    if (![409, 412].includes(error?.statusCode)) throw error;
  }
  const stored = await blob.downloadToBuffer();
  if (!stored.equals(bytes)) throw new Error("Immutable proof Blob differs from this run");
  return {
    uri: `https://${config.account}.blob.core.windows.net/${config.container}/${blobName}`,
    sha256: sha(bytes),
  };
}

export function extractStageProof(bundle) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "tower-rich-stage-"));
  try {
    const archive = path.join(temporary, "stage.tgz");
    fs.writeFileSync(archive, bundle);
    const listed = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
    if (listed.status !== 0) throw new Error("Stage bundle is not a readable tar archive");
    const names = listed.stdout.trim().split("\n");
    if (names.some((name) => name.startsWith("/") || name.split("/").includes(".."))) {
      throw new Error("Stage bundle contains an unsafe path");
    }
    const proofName = names.find((name) => name.endsWith("/tower_private_stage_proof.json"));
    const summaryName = names.find((name) => name.endsWith("/tower_layer4_product_cube_load_summary.json"));
    if (!proofName || !summaryName || names.filter((name) => name === proofName).length !== 1 ||
        names.filter((name) => name === summaryName).length !== 1) {
      throw new Error("Stage bundle lacks a unique proof and summary");
    }
    const extract = (name) => {
      const result = spawnSync("tar", ["-xOzf", archive, name], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
      if (result.status !== 0) throw new Error("Stage proof extraction failed");
      return JSON.parse(result.stdout);
    };
    return { proof: extract(proofName), summary: extract(summaryName) };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function validateStageProof(proof, summary, source, packageManifest, config) {
  const { proof_content_sha256, ...content } = proof ?? {};
  const expectedPages = Object.keys(PAGES).sort();
  const pages = Object.keys(proof?.pages ?? {}).sort();
  const gaps = [];
  const stageRunId = blobPath(config.stageUri, config).split("/").at(-2);
  if (proof?.proof_type !== "tower_rich_synthetic_private_stage_v1" ||
      proof.tenant_key !== config.tenant || proof.assessment_id !== config.assessment ||
      proof.projection_version !== 2 || proof.source_set_hash !== source.source_set_hash ||
      stableJson(proof.source_files) !== stableJson(source.files) ||
      !/^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/.test(proof.release_record ?? "") ||
      !fs.existsSync(path.join(ROOT, proof.release_record)) ||
      !/^sha256:[0-9a-f]{64}$/.test(proof.image_digest ?? "") ||
      proof.quality_gate?.status !== "passed" ||
      (proof.quality_gate?.issues ?? []).length !== 0 ||
      proof.build_version !== config.buildVersion ||
      !proof.idempotency_key ||
      proof_content_sha256 !== sha(stableJson(content))) gaps.push("stage_proof_identity_or_hash_mismatch");
  if (summary?.status !== "private_stage_verified" ||
      summary?.job_contract?.assessment_id !== config.assessment ||
      summary?.job_contract?.tenant_scope !== config.tenant ||
      summary?.job_contract?.build_version !== config.buildVersion ||
      summary?.job_contract?.input_source_version !== config.inputSourceVersion ||
      summary?.job_contract?.idempotency_key !== proof?.idempotency_key ||
      summary?.job_contract?.image_digest !== proof?.image_digest ||
      !/^[0-9a-f]{40}$/.test(summary?.job_contract?.git_sha ?? "") ||
      summary?.job_contract?.run_id !== stageRunId ||
      stableJson(summary.prior_active_assessments) !== stableJson(proof?.prior_active_assessments) ||
      stableJson(summary.readback?.active_assessments) !== stableJson(proof?.post_active_assessments) ||
      (summary.issues ?? []).length ||
      stableJson(proof?.prior_active_assessments) !== stableJson(proof?.post_active_assessments)) {
    gaps.push("stage_summary_or_selector_mismatch");
  }
  if (pages.join() !== expectedPages.join() || pages.some((page) => {
    const entry = proof.pages[page];
    return !Array.isArray(entry.rows) || entry.rows.length < 1 ||
      entry.row_count !== entry.rows.length ||
      entry.row_fingerprint_sha256 !== sha(stableJson(entry.rows)) ||
      entry.rows.some((row) => typeof row.row_key !== "string" || !SHA256.test(row.source_hash ?? "")) ||
      new Set(entry.rows.map((row) => row.row_key)).size !== entry.rows.length;
  })) gaps.push("stage_page_fingerprint_invalid");
  if (packageManifest.no_runtime_load !== false ||
      packageManifest.assessment_id !== config.assessment ||
      packageManifest.tenant_key !== config.tenant ||
      packageManifest.source_set_hash !== source.source_set_hash) {
    gaps.push("package_not_eligible_for_loaded_stage");
  }
  return gaps;
}

async function servingApproval(config, source, stage) {
  const { resolveServingApproval } = await import("../../src/lib/governance/dataset-manifest.ts");
  const manifests = fs.readdirSync(MANIFEST_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => readJson(path.join(MANIFEST_DIR, name)));
  return resolveServingApproval(manifests, {
    dataset_id: DATASET_ID, tenant_key: config.tenant,
    assessment_id: config.assessment, source_set_hash: source.source_set_hash,
    object_count: source.object_count, ingestion_method: "operator_aca_job",
    release_record: config.releaseRecord, load_release_record: stage.release_record,
    surface: "tower",
  });
}

function pageFingerprint(rows) {
  return sha(stableJson(rows.map(({ row_key, source_hash }) => ({ row_key, source_hash }))
    .sort((left, right) => left.row_key.localeCompare(right.row_key) ||
      left.source_hash.localeCompare(right.source_hash))));
}

export async function pageReadback(client, schema, tenant, assessment, version) {
  const result = {};
  for (const [page, [table, pageKey]] of Object.entries(PAGES)) {
    const predicate = schema === "serving" || pageKey === null ? "true" : table === "tower_ai_portfolio"
      ? "coalesce(display_payload_json ->> 'page_key', 'ai_portfolio') = $4"
      : "page_key = $4";
    const rows = (await client.query(
      `select row_key, source_hash from ${schema}.${schema === "serving" ? page : table} where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and ${predicate} order by row_key, source_hash`,
      [tenant, assessment, version, pageKey],
    )).rows;
    result[page] = { row_count: rows.length, row_fingerprint_sha256: pageFingerprint(rows) };
  }
  return result;
}

async function lifecycle(client, tenant) {
  const declared = (await client.query(
    "select assessment_id, projection_version, state from ecl_projection.tower_assessment_lifecycle where tenant_key=$1 order by state, assessment_id",
    [tenant],
  )).rows;
  const resolved = (await client.query(
    "select assessment_id, projection_version from serving.tower_active_assessment_keys() where tenant_key=$1",
    [tenant],
  )).rows;
  return { declared, resolved };
}

function sameGeneration(left, right) {
  return left?.assessment_id === right?.assessment_id &&
    Number(left?.projection_version) === Number(right?.projection_version);
}

export async function inspect(client, config, stage) {
  const state = await lifecycle(client, config.tenant);
  const active = state.declared.filter((row) => row.state === "active");
  const candidate = state.declared.filter((row) => row.assessment_id === config.assessment);
  const prior = stage.prior_active_assessments;
  const gaps = [];
  if (prior?.length !== 1 || active.length !== 1 || state.resolved.length !== 1 ||
      !sameGeneration(active[0], prior[0]) || !sameGeneration(state.resolved[0], prior[0]) ||
      candidate.length !== 0) gaps.push("active_or_candidate_selector_changed");
  const physical = await pageReadback(client, "ecl_projection", config.tenant, config.assessment, 2);
  for (const page of Object.keys(PAGES)) {
    if (physical[page].row_count !== stage.pages[page].row_count ||
        physical[page].row_fingerprint_sha256 !== stage.pages[page].row_fingerprint_sha256) {
      gaps.push(`physical_page_changed:${page}`);
    }
  }
  const priorPhysical = prior?.length === 1
    ? await pageReadback(client, "ecl_projection", config.tenant,
      prior[0].assessment_id, Number(prior[0].projection_version)) : null;
  return {
    status: gaps.length ? "blocked" : "ready",
    prior_active: prior?.[0] ?? null,
    prior_physical: priorPhysical,
    candidate_physical: physical,
    gaps,
  };
}

async function withReadOnly(client, tenant, action) {
  await client.query("begin transaction read only");
  try {
    await client.query("select set_config('app.tenant_key', $1, true)", [tenant]);
    const value = await action();
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function switchSelector(client, config, stage, reviewed) {
  await client.query("begin isolation level serializable");
  try {
    await client.query("select set_config('app.tenant_key', $1, true)", [config.tenant]);
    await client.query("select pg_advisory_xact_lock(hashtext('tower-lifecycle'), hashtext($1))", [config.tenant]);
    const current = await inspect(client, config, stage);
    if (current.status !== "ready" || stableJson(current) !== stableJson(reviewed.inspection)) {
      throw new Error("Reviewed preflight differs from locked selector and rows");
    }
    const old = current.prior_active;
    const retired = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='retired', retired_at=now() where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and state='active'",
      [config.tenant, old.assessment_id, old.projection_version],
    );
    if (retired.rowCount !== 1) throw new Error("Prior selector changed during promotion");
    await client.query(
      "insert into ecl_projection.tower_assessment_lifecycle (tenant_key,assessment_id,projection_version,state,activated_at,retired_at,build_version,note) values ($1,$2,2,'active',now(),null,$3,$4)",
      [config.tenant, config.assessment, config.buildVersion, `Serving approval ${config.releaseRecord}`],
    );
    const selected = await lifecycle(client, config.tenant);
    if (selected.resolved.length !== 1 || !sameGeneration(selected.resolved[0], {
      assessment_id: config.assessment, projection_version: 2,
    })) throw new Error("Candidate is not the sole selected generation");
    const serving = await pageReadback(client, "serving", config.tenant, config.assessment, 2);
    for (const page of Object.keys(PAGES)) {
      if (stableJson(serving[page]) !== stableJson(current.candidate_physical[page])) {
        throw new Error(`Serving readback differs from staged physical page: ${page}`);
      }
    }
    await client.query("commit");
    return serving;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function rollbackSelector(client, config, promotion) {
  await client.query("begin isolation level serializable");
  try {
    await client.query("select set_config('app.tenant_key', $1, true)", [config.tenant]);
    await client.query("select pg_advisory_xact_lock(hashtext('tower-lifecycle'), hashtext($1))", [config.tenant]);
    const state = await lifecycle(client, config.tenant);
    const active = state.declared.filter((row) => row.state === "active");
    const prior = state.declared.filter((row) => row.state === "retired" &&
      sameGeneration(row, promotion.prior_active));
    if (active.length !== 1 || prior.length !== 1 || state.resolved.length !== 1 ||
        !sameGeneration(active[0], promotion.promoted) ||
        !sameGeneration(state.resolved[0], promotion.promoted)) {
      throw new Error("Rollback selector state changed");
    }
    const candidate = await pageReadback(client, "ecl_projection", config.tenant, config.assessment, 2);
    const previous = await pageReadback(client, "ecl_projection", config.tenant,
      promotion.prior_active.assessment_id, promotion.prior_active.projection_version);
    if (stableJson(candidate) !== stableJson(promotion.candidate_physical) ||
        stableJson(previous) !== stableJson(promotion.prior_physical)) {
      throw new Error("Rollback generations changed");
    }
    const retired = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='retired', retired_at=now() where tenant_key=$1 and assessment_id=$2 and projection_version=2 and state='active'",
      [config.tenant, config.assessment],
    );
    const restored = await client.query(
      "update ecl_projection.tower_assessment_lifecycle set state='active', activated_at=now(), retired_at=null where tenant_key=$1 and assessment_id=$2 and projection_version=$3 and state='retired'",
      [config.tenant, promotion.prior_active.assessment_id, promotion.prior_active.projection_version],
    );
    if (retired.rowCount !== 1 || restored.rowCount !== 1) throw new Error("Rollback pointer update failed");
    const serving = await pageReadback(client, "serving", config.tenant,
      promotion.prior_active.assessment_id, promotion.prior_active.projection_version);
    if (stableJson(serving) !== stableJson(previous)) throw new Error("Prior serving readback mismatch");
    await client.query("commit");
    return serving;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

export async function main(mode, env = process.env) {
  const config = configFromEnv(mode, env);
  const registry = readJson(REGISTRY);
  if (!registry.activeTenants?.some((entry) => entry.tenantKey === config.tenant)) {
    throw new Error("Tower tenant is not active in the canonical intake registry");
  }
  const packageManifest = readJson(path.join(PACKAGE_DIR, "package_manifest.json"));
  const source = sourceIdentity();
  const blob = await containerClient(config);
  const bundle = await downloadExact(blob, config, config.stageUri, config.stageSha);
  const { proof: stage, summary } = extractStageProof(bundle);
  const stageGaps = validateStageProof(stage, summary, source, packageManifest, config);
  if (stageGaps.length) throw new Error(`Staged candidate is ineligible: ${stageGaps.join(",")}`);
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    if (mode === "rollback") {
      const bytes = await downloadExact(blob, config, config.promotionUri, config.promotionSha);
      const promotion = JSON.parse(bytes.toString("utf8"));
      const committed = promotion.contract_version === "tower-rich-synthetic-promotion/v1" &&
        promotion.status === "promoted";
      const pending = promotion.contract_version === "tower-rich-synthetic-promotion-pending/v1";
      if ((!committed && !pending) || promotion.tenant_key !== config.tenant ||
          promotion.assessment_id !== config.assessment ||
          promotion.stage_bundle_sha256 !== config.stageSha ||
          promotion.source_set_hash !== source.source_set_hash ||
          promotion.release_record !== config.releaseRecord ||
          promotion.source_object_count !== source.object_count ||
          promotion.stage_image_digest !== stage.image_digest ||
          promotion.stage_git_sha !== summary.job_contract.git_sha ||
          !promotion.prior_active?.assessment_id ||
          !Number.isInteger(Number(promotion.prior_active?.projection_version)) ||
          !promotion.prior_physical || !promotion.candidate_physical ||
          (committed && !sameGeneration(promotion.promoted, {
            assessment_id: config.assessment, projection_version: 2,
          }))) {
        throw new Error("Promotion proof does not bind this exact rollback target");
      }
      if (pending) promotion.promoted = { assessment_id: config.assessment, projection_version: 2 };
      const serving = await rollbackSelector(client, config, promotion);
      const independent = await withReadOnly(client, config.tenant, () => pageReadback(client,
        "serving", config.tenant, promotion.prior_active.assessment_id,
        promotion.prior_active.projection_version));
      if (stableJson(independent) !== stableJson(serving)) throw new Error("Independent rollback readback differs");
      const result = await uploadExact(blob, config, "rollback.json", {
        contract_version: "tower-rich-synthetic-rollback/v1", status: "rolled_back",
        tenant_key: config.tenant, assessment_id: config.assessment,
        promotion_proof_uri: config.promotionUri, promotion_proof_sha256: config.promotionSha,
        restored: promotion.prior_active, serving_readback: independent,
        image_digest: config.imageDigest, git_sha: config.gitSha,
        release_record: config.releaseRecord,
        idempotency_key: config.idempotencyKey,
        operator_identity: config.operatorIdentity,
        job_name: config.jobName, run_id: config.runId,
      });
      console.log(JSON.stringify({ status: "rolled_back", proof: result }));
      return;
    }
    const approval = await servingApproval(config, source, stage);
    const inspection = await withReadOnly(client, config.tenant,
      () => inspect(client, config, stage));
    const gaps = [...inspection.gaps, ...(approval.approved ? [] : approval.reasons.map((reason) => `serving_approval:${reason}`))];
    const preflight = {
      contract_version: "tower-rich-synthetic-preflight/v1",
      status: gaps.length ? "blocked" : "ready",
      tenant_key: config.tenant, assessment_id: config.assessment,
      source_set_hash: source.source_set_hash, source_object_count: source.object_count,
      stage_bundle_uri: config.stageUri, stage_bundle_sha256: config.stageSha,
      stage_image_digest: stage.image_digest,
      stage_git_sha: summary.job_contract.git_sha,
      image_digest: config.imageDigest, git_sha: config.gitSha,
      release_record: config.releaseRecord,
      idempotency_key: config.idempotencyKey,
      operator_identity: config.operatorIdentity,
      serving_approval: approval.approved ? approval.approval : null,
      inspection, gaps,
    };
    if (mode === "check") {
      const result = await uploadExact(blob, config, "preflight.json", preflight);
      console.log(JSON.stringify({ status: preflight.status, gaps, proof: result }));
      if (gaps.length) process.exitCode = 2;
      return;
    }
    if (gaps.length) throw new Error(`Rich Tower serving is blocked: ${gaps.join(",")}`);
    const reviewed = JSON.parse((await downloadExact(blob, config,
      config.preflightUri, config.preflightSha)).toString("utf8"));
    if (stableJson(reviewed) !== stableJson(preflight) || reviewed.status !== "ready") {
      throw new Error("Reviewed preflight differs from current readback or approval");
    }
    const pending = {
      contract_version: "tower-rich-synthetic-promotion-pending/v1",
      tenant_key: config.tenant, assessment_id: config.assessment,
      stage_bundle_uri: config.stageUri, stage_bundle_sha256: config.stageSha,
      preflight_uri: config.preflightUri, preflight_sha256: config.preflightSha,
      prior_active: inspection.prior_active, prior_physical: inspection.prior_physical,
      candidate_physical: inspection.candidate_physical,
      source_set_hash: source.source_set_hash, source_object_count: source.object_count,
      stage_image_digest: stage.image_digest, stage_git_sha: summary.job_contract.git_sha,
      image_digest: config.imageDigest, git_sha: config.gitSha,
      release_record: config.releaseRecord, serving_approval: approval.approval,
      idempotency_key: config.idempotencyKey,
      operator_identity: config.operatorIdentity,
      job_name: config.jobName, run_id: config.runId,
    };
    await uploadExact(blob, config, "promotion-pending.json", pending);
    const serving = await switchSelector(client, config, stage, reviewed);
    const independent = await withReadOnly(client, config.tenant, async () => {
      const state = await lifecycle(client, config.tenant);
      const pages = await pageReadback(client, "serving", config.tenant, config.assessment, 2);
      return { state, pages };
    });
    if (independent.state.resolved.length !== 1 ||
        !sameGeneration(independent.state.resolved[0], { assessment_id: config.assessment, projection_version: 2 }) ||
        stableJson(independent.pages) !== stableJson(serving)) {
      throw new Error("Independent post-promotion serving readback differs; inspect pending proof and roll back");
    }
    const result = await uploadExact(blob, config, "promotion.json", {
      contract_version: "tower-rich-synthetic-promotion/v1", status: "promoted",
      tenant_key: config.tenant, assessment_id: config.assessment,
      promoted: { assessment_id: config.assessment, projection_version: 2 },
      prior_active: inspection.prior_active, prior_physical: inspection.prior_physical,
      candidate_physical: inspection.candidate_physical,
      serving_readback: independent.pages,
      stage_bundle_uri: config.stageUri, stage_bundle_sha256: config.stageSha,
      preflight_uri: config.preflightUri, preflight_sha256: config.preflightSha,
      source_set_hash: source.source_set_hash, source_object_count: source.object_count,
      serving_approval: approval.approval,
      stage_image_digest: stage.image_digest, stage_git_sha: summary.job_contract.git_sha,
      image_digest: config.imageDigest, git_sha: config.gitSha,
      idempotency_key: config.idempotencyKey,
      operator_identity: config.operatorIdentity,
      job_name: config.jobName, run_id: config.runId,
      release_record: config.releaseRecord,
    });
    console.log(JSON.stringify({ status: "promoted", proof: result }));
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
