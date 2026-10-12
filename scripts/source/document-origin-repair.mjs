import { isDeepStrictEqual } from "node:util";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";
import Papa from "papaparse";
import { BlobServiceClient } from "@azure/storage-blob";
import { ManagedIdentityCredential } from "@azure/identity";

const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const fields = new Set([
  "processor_system",
  "source_basis",
  "upstream_source_system",
  "upstream_source_file",
  "upstream_source_row_id",
  "upstream_source_owner",
  "upstream_document_type",
  "source_manifest",
  "source_manifest_sha256",
  "source_origin_review_state",
]);
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function validateOriginRepairPlan(plan) {
  check(
    plan?.operation === "metadata_only_origin_repair" &&
      plan.mutableRelation === "doc.file" &&
      isDeepStrictEqual(plan.mutableColumns, ["metadata_json"]) &&
      plan.fullPackageReload === false,
    "Metadata-only operation required",
  );
  for (const key of ["tenant_key", "contract_id", "dataset_version"])
    check(typeof plan[key] === "string" && plan[key].trim(), `Missing ${key}`);
  check(
    /^[a-f0-9]{64}$/.test(plan.proposedManifestSha256),
    "Manifest hash required",
  );
  check(
    Array.isArray(plan.targets) &&
      plan.targets.length > 0 &&
      plan.targets.length === plan.expectedUpdatedRows &&
      plan.targets.length === plan.proposedManifestRows,
    "Exact positive target count required",
  );
  check(
    new Set(plan.targets.map((t) => t.file_id)).size === plan.targets.length,
    "Duplicate file identity",
  );
  for (const t of plan.targets) {
    check(
      t.tenant_key === plan.tenant_key &&
        t.contract_ref === plan.contract_id &&
        t.file_id &&
        /^[a-f0-9]{64}$/.test(t.expected_content_sha256) &&
        t.expected_load_run_id,
      "Target scope or before-image identity conflict",
    );
    const before = t.expected_metadata_json;
    const after = t.proposed_metadata_json;
    check(
      before?.dataset_version === plan.dataset_version &&
        before.synthetic_policy === "synthetic_demo_only_not_client_truth",
      "Expected synthetic dataset required",
    );
    check(
      after &&
        Object.entries(before).every(([key, value]) =>
          isDeepStrictEqual(after[key], value),
        ),
      "Existing metadata must be preserved",
    );
    check(
      Object.keys(after).every(
        (key) => Object.hasOwn(before, key) || fields.has(key),
      ),
      "Metadata field expansion refused",
    );
    check(
      after.source_basis === "declared_synthetic_manifest" &&
        after.upstream_source_system?.startsWith("Synthetic ") &&
        after.source_manifest_sha256 === plan.proposedManifestSha256 &&
        after.source_origin_review_state === "synthetic_origin_pending_review",
      "Synthetic pending-review origin required",
    );
  }
  return plan;
}

export function compareOriginBeforeImages(plan, rows) {
  validateOriginRepairPlan(plan);
  return plan.targets.flatMap((t) => {
    const matches = rows.filter((r) => r.file_id === t.file_id);
    const r = matches[0];
    return matches.length !== 1 ||
      r.tenant_key !== t.tenant_key ||
      r.contract_ref !== t.contract_ref ||
      r.content_sha256 !== t.expected_content_sha256 ||
      r.load_run_id !== t.expected_load_run_id ||
      !isDeepStrictEqual(r.metadata_json, t.expected_metadata_json)
      ? [{ file_id: t.file_id, reason: "Exact before-image mismatch" }]
      : [];
  });
}

export function originRepairInputs(env) {
  const required = (key) => {
    check(env[key]?.trim(), `${key} required`);
    return env[key].trim();
  };
  const mode = required("SOURCE_ORIGIN_MODE");
  check(
    ["preflight", "apply", "verify", "restore"].includes(mode),
    "Invalid repair mode",
  );
  const planBytes = Buffer.from(
    required("SOURCE_ORIGIN_PLAN_SECRET"),
    "base64",
  );
  const manifestBytes = Buffer.from(
    required("SOURCE_ORIGIN_MANIFEST_SECRET"),
    "base64",
  );
  const approval = JSON.parse(
    Buffer.from(required("SOURCE_ORIGIN_APPROVAL_SECRET"), "base64").toString(),
  );
  const plan = validateOriginRepairPlan(JSON.parse(planBytes.toString()));
  const planSha256 = sha(planBytes);
  check(
    approval.status === "approved_with_execution_conditions" &&
      approval.decisionId &&
      approval.decisionMaker &&
      approval.authorityFile,
    "Explicit attributed approval required",
  );
  check(
    approval.planSha256 === planSha256 &&
      approval.manifestSha256 === sha(manifestBytes) &&
      approval.manifestSha256 === plan.proposedManifestSha256 &&
      approval.tenantKey === plan.tenant_key &&
      approval.contractId === plan.contract_id &&
      approval.datasetVersion === plan.dataset_version &&
      approval.expectedUpdatedRows === plan.targets.length &&
      approval.mutableRelation === "doc.file" &&
      isDeepStrictEqual(approval.mutableColumns, ["metadata_json"]),
    "Approval scope or sealed hash mismatch",
  );
  const csv = Papa.parse(manifestBytes.toString(), {
    header: true,
    skipEmptyLines: true,
  });
  check(
    !csv.errors.length && csv.data.length === plan.targets.length,
    "Manifest count mismatch",
  );
  for (const t of plan.targets) {
    const m = csv.data.filter((r) => r.source_file_id === t.file_id);
    check(
      m.length === 1 &&
        m[0].tenant_key === plan.tenant_key &&
        m[0].contract_id === plan.contract_id &&
        m[0].dataset_version === plan.dataset_version &&
        m[0].source_system ===
          t.proposed_metadata_json.upstream_source_system &&
        m[0].source_owner === t.proposed_metadata_json.upstream_source_owner,
      "Manifest declaration mismatch",
    );
  }
  const meta = {
    runId: required("SOURCE_ORIGIN_RUN_ID"),
    jobName: required("SOURCE_ORIGIN_JOB_NAME"),
    operator: required("SOURCE_ORIGIN_OPERATOR"),
    gitSha: required("SOURCE_ORIGIN_GIT_SHA"),
    imageDigest: required("SOURCE_ORIGIN_IMAGE_DIGEST"),
    buildVersion: required("SOURCE_ORIGIN_BUILD_VERSION"),
    inputVersion: plan.dataset_version,
    idempotencyKey: required("SOURCE_ORIGIN_IDEMPOTENCY_KEY"),
    executionId: env.CONTAINER_APP_JOB_EXECUTION_NAME ?? null,
    timeoutSeconds: 120,
    retryCount: 0,
  };
  check(
    /^[a-zA-Z0-9._-]+$/.test(meta.runId) &&
      /^[a-f0-9]{40}$/.test(meta.gitSha) &&
      /^sha256:[a-f0-9]{64}$/.test(meta.imageDigest),
    "Invalid run or runtime identity",
  );
  check(required("ACA_JOB_NAME") === meta.jobName, "ACA job identity mismatch");
  if (["apply", "restore"].includes(mode)) {
    check(
      env.SOURCE_ORIGIN_MODE_TOKEN === `SOURCE_ORIGIN_${mode.toUpperCase()}`,
      "Explicit mutation token required",
    );
    check(
      approval.approvedCodeGitSha === meta.gitSha &&
        approval.approvedImageDigest === meta.imageDigest,
      "Reviewed code and runtime approval required",
    );
  }
  let restoreProof;
  if (mode === "restore") {
    const bytes = Buffer.from(
      required("SOURCE_ORIGIN_RESTORE_PROOF_SECRET"),
      "base64",
    );
    check(
      sha(bytes) === required("SOURCE_ORIGIN_RESTORE_PROOF_SHA256"),
      "Restore proof hash mismatch",
    );
    restoreProof = JSON.parse(bytes.toString());
    check(
      restoreProof.planSha256 === planSha256 &&
        restoreProof.committed === true &&
        restoreProof.mode === "apply" &&
        restoreProof.approvalDecisionId === approval.decisionId &&
        restoreProof.afterRowsSha256 ===
          sha(JSON.stringify(restoreProof.afterRows)),
      "Apply proof required for guarded restore",
    );
  }
  return { mode, plan, planSha256, approval, meta, restoreProof };
}

async function snapshot(client, plan, lock) {
  const result = await client.query(
    `SELECT to_jsonb(f) AS row FROM doc.file f
    WHERE tenant_key=$1 AND contract_ref=$2 ORDER BY file_id${lock ? " FOR UPDATE" : ""}`,
    [plan.tenant_key, plan.contract_id],
  );
  return result.rows.map((r) => r.row);
}

function requireImages(plan, rows, after = false) {
  const expected = after
    ? {
        ...plan,
        targets: plan.targets.map((t) => ({
          ...t,
          expected_metadata_json: t.proposed_metadata_json,
        })),
      }
    : plan;
  // Keep the original plan validation independent of the after-image comparison.
  const mismatches = plan.targets.filter((t, i) => {
    const matched = rows.filter((r) => r.file_id === t.file_id);
    const r = matched[0];
    return (
      matched.length !== 1 ||
      r.tenant_key !== t.tenant_key ||
      r.contract_ref !== t.contract_ref ||
      r.content_sha256 !== t.expected_content_sha256 ||
      r.load_run_id !== t.expected_load_run_id ||
      !isDeepStrictEqual(
        r.metadata_json,
        expected.targets[i].expected_metadata_json,
      )
    );
  });
  check(
    mismatches.length === 0,
    "Exact current before/after-image mismatch; stop on drift",
  );
}

export async function runOriginRepair(client, inputs, persist) {
  const { mode, plan, planSha256, approval, meta, restoreProof } = inputs;
  const mutate = ["apply", "restore"].includes(mode);
  let committed = false;
  let proof = {
    ...meta,
    mode,
    planSha256,
    approvalDecisionId: approval.decisionId,
    tenantKey: plan.tenant_key,
    contractId: plan.contract_id,
    expectedRows: plan.targets.length,
    startedAt: new Date().toISOString(),
    committed: false,
    updatedRows: 0,
    state: "running",
  };
  try {
    await client.query(
      mutate
        ? "BEGIN ISOLATION LEVEL SERIALIZABLE"
        : "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY",
    );
    await client.query("SELECT set_config('app.tenant_key',$1,true)", [
      plan.tenant_key,
    ]);
    await client.query("SET LOCAL statement_timeout='120s'");
    if (mutate)
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [`source-origin:${plan.tenant_key}:${plan.contract_id}`],
      );
    const beforeRows = await snapshot(client, plan, mutate);
    requireImages(plan, beforeRows, mode === "verify" || mode === "restore");
    if (mode === "restore")
      check(
        isDeepStrictEqual(beforeRows, restoreProof.afterRows),
        "Guarded restore refuses any full after-image drift",
      );
    proof = {
      ...proof,
      beforeRows,
      beforeRowsSha256: sha(JSON.stringify(beforeRows)),
    };
    if (mutate) {
      proof.preparedProofUrl = await persist(`${meta.runId}-before`, proof);
      for (const t of plan.targets) {
        const from =
          mode === "restore"
            ? t.proposed_metadata_json
            : t.expected_metadata_json;
        const to =
          mode === "restore"
            ? t.expected_metadata_json
            : t.proposed_metadata_json;
        const updated = await client.query(
          `UPDATE doc.file SET metadata_json=$1::jsonb
          WHERE tenant_key=$2 AND contract_ref=$3 AND file_id=$4 AND content_sha256=$5
            AND load_run_id=$6 AND metadata_json=$7::jsonb RETURNING file_id`,
          [
            JSON.stringify(to),
            plan.tenant_key,
            plan.contract_id,
            t.file_id,
            t.expected_content_sha256,
            t.expected_load_run_id,
            JSON.stringify(from),
          ],
        );
        check(updated.rowCount === 1, "Exact affected-count guard failed");
        proof.updatedRows++;
      }
      check(
        proof.updatedRows === plan.targets.length,
        "Total affected-count guard failed",
      );
    }
    const afterRows = await snapshot(client, plan, false);
    requireImages(plan, afterRows, mode !== "restore" && mode !== "preflight");
    check(
      beforeRows.length === afterRows.length,
      "Contract document row count changed",
    );
    for (const before of beforeRows) {
      const after = afterRows.find((r) => r.file_id === before.file_id);
      const target = plan.targets.find((t) => t.file_id === before.file_id);
      const expected =
        target && mutate
          ? {
              ...before,
              metadata_json:
                mode === "restore"
                  ? target.expected_metadata_json
                  : target.proposed_metadata_json,
            }
          : before;
      check(
        isDeepStrictEqual(after, expected),
        "Non-metadata or unapproved row change detected",
      );
    }
    proof = {
      ...proof,
      afterRows,
      afterRowsSha256: sha(JSON.stringify(afterRows)),
      state: "validated",
    };
    if (mutate)
      proof.validatedProofUrl = await persist(`${meta.runId}-validated`, proof);
    await client.query("COMMIT");
    committed = mutate;
    proof = {
      ...proof,
      committed,
      state: "succeeded",
      finishedAt: new Date().toISOString(),
    };
    const resultProofUrl = await persist(`${meta.runId}-result`, proof);
    return { ...proof, resultProofUrl };
  } catch (error) {
    if (!committed) await client.query("ROLLBACK").catch(() => {});
    proof = {
      ...proof,
      committed,
      state: committed ? "committed_proof_failed" : "failed_rolled_back",
      updatedRows: committed ? proof.updatedRows : 0,
      finishedAt: new Date().toISOString(),
      error: error.message,
    };
    await persist(`${meta.runId}-failure`, proof).catch(() => {});
    throw new Error(
      committed
        ? "Repair committed; final proof failed. Verify before retrying."
        : error.message,
      { cause: error },
    );
  }
}

async function privateProofTarget(env) {
  const {
    SOURCE_ORIGIN_BLOB_ACCOUNT_URL: url,
    SOURCE_ORIGIN_BLOB_CONTAINER: container,
    SOURCE_ORIGIN_BLOB_PREFIX: prefix,
    AZURE_CLIENT_ID: clientId,
  } = env;
  check(
    /^https:\/\/[a-z0-9-]+\.blob\.core\.windows\.net\/?$/.test(url ?? "") &&
      /^[a-z0-9-]+$/.test(container ?? "") &&
      /^[a-zA-Z0-9/_-]+$/.test(prefix ?? "") &&
      /^[a-f0-9-]{36}$/i.test(clientId ?? ""),
    "Private Blob proof target required",
  );
  const client = new BlobServiceClient(
    url,
    new ManagedIdentityCredential(clientId),
  ).getContainerClient(container);
  check(
    !(await client.getProperties()).blobPublicAccess,
    "Proof container must be private",
  );
  return async (name, proof) => {
    const body = Buffer.from(JSON.stringify(proof));
    const blob = client.getBlockBlobClient(`${prefix}/${name}.json`);
    await blob.uploadData(body, {
      blobHTTPHeaders: { blobContentType: "application/json" },
      conditions: { ifNoneMatch: "*" },
    });
    check(
      sha(await blob.downloadToBuffer()) === sha(body),
      "Private Blob proof readback mismatch",
    );
    return blob.url;
  };
}

async function main() {
  // All scope, approval, manifest and runtime gates run before opening Postgres.
  const inputs = originRepairInputs(process.env);
  const persistBlob = await privateProofTarget(process.env);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "source-origin-proof-"));
  const persist = async (name, proof) => {
    fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(proof));
    return persistBlob(name, proof);
  };
  check(process.env.DATABASE_URL?.trim(), "DATABASE_URL required");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
    statement_timeout: 120000,
  });
  try {
    await client.connect();
    const result = await runOriginRepair(client, inputs, persist);
    console.log(
      JSON.stringify({
        mode: result.mode,
        state: result.state,
        committed: result.committed,
        updatedRows: result.updatedRows,
        runId: result.runId,
        planSha256: result.planSha256,
        afterRowsSha256: result.afterRowsSha256,
        resultProofUrl: result.resultProofUrl,
      }),
    );
  } finally {
    await client.end();
    const tar = spawnSync(
      "tar",
      ["-czf", "-", "-C", path.dirname(out), path.basename(out)],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    if (tar.status !== 0) throw new Error("Proof bundle failed");
    console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
    console.log(tar.stdout.toString("base64"));
    console.log("__SEMANTIC2_PROOF_TGZ_END__");
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
