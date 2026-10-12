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
const TRUST = JSON.parse(
  fs.readFileSync(
    new URL("./document-origin-trust.json", import.meta.url),
    "utf8",
  ),
);
const EXECUTION_TRUST = JSON.parse(
  fs.readFileSync(
    new URL("./document-origin-execution-trust.json", import.meta.url),
    "utf8",
  ),
);
const CODE_FILES = [
  "scripts/source/document-origin-repair.mjs",
  "scripts/source/document-origin-trust.json",
  "scripts/ops/submit-aca-operator-job.mjs",
  "package-lock.json",
];
const codeFingerprints = () =>
  Object.fromEntries(
    CODE_FILES.map((f) => [
      f,
      sha(
        fs.readFileSync(
          path.resolve(fileURLToPath(new URL("../../", import.meta.url)), f),
        ),
      ),
    ]),
  );

export function verifyOriginCodeCertificate(
  bytes,
  trust,
  fingerprints,
  grant = TRUST,
) {
  check(
    trust.contract_version === "source-origin-execution-trust/v1" &&
      trust.status === "active" &&
      sha(bytes) === trust.certificate_sha256,
    "Independent released code certification required",
  );
  const certificate = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  check(
    certificate.contract_version === "source-origin-code-certificate/v1" &&
      certificate.status === "active" &&
      certificate.review_id &&
      certificate.authority_sha256 === grant.authority_sha256 &&
      certificate.decision_sha256 === grant.decision_sha256 &&
      certificate.runtime_policy === "repo_owned_current_main" &&
      isDeepStrictEqual(certificate.fingerprints, fingerprints),
    "Reviewed operator/helper/dependency closure mismatch",
  );
  return certificate;
}

export function verifyOriginRuntimeWitness(witness, meta) {
  const expected = `acrabarvalab001.azurecr.io/abarva/web@${meta.imageDigest}`;
  check(
    witness.templateImage === expected &&
      witness.revisionImage === expected &&
      witness.operatorImage === expected &&
      witness.trafficWeight === 100 &&
      witness.trafficRevisionCount === 1 &&
      witness.healthState === "Healthy" &&
      witness.active === true &&
      witness.revisionName?.endsWith(`--m${meta.gitSha.slice(0, 8)}`) &&
      witness.mainCommitSha === meta.gitSha &&
      witness.mainDeploySucceeded === true &&
      witness.operatorExecutionName &&
      witness.operatorRunId === meta.runId &&
      isDeepStrictEqual(
        Object.keys(witness.workerImages).sort(),
        ["job-abarva-deliv-worker", "job-abarva-deliv-worker-event"].sort(),
      ) &&
      Object.values(witness.workerImages).every((image) => image === expected),
    "Native approved main web/revision/workers/operator image invariant failed",
  );
  return witness;
}

async function nativeRuntimeWitness(env, meta, credential) {
  const token = await credential.getToken(
    "https://management.azure.com/.default",
  );
  check(token?.token, "Managed identity ARM token required");
  const resource =
    "https://management.azure.com/subscriptions/701a8554-a166-46e9-bf13-743bc50e3b20/resourceGroups/rg-abarva-controlplane-lab-eastus/providers/Microsoft.App";
  const get = async (relative) => {
    const result = await fetch(
      `${resource}/${relative}?api-version=2024-03-01`,
      {
        headers: { Authorization: `Bearer ${token.token}` },
        signal: AbortSignal.timeout(30000),
      },
    );
    check(result.ok, `Native runtime read failed (${result.status})`);
    return result.json();
  };
  const web = await get("containerApps/ca-abarva-web-lab-eastus");
  const traffic = (web.properties.configuration.ingress.traffic ?? []).filter(
    (t) => t.weight > 0,
  );
  check(
    traffic.length === 1 &&
      traffic[0].weight === 100 &&
      traffic[0].revisionName,
    "Exact serving revision required",
  );
  const revision = await get(
    `containerApps/ca-abarva-web-lab-eastus/revisions/${encodeURIComponent(traffic[0].revisionName)}`,
  );
  const image = (containers) => {
    check(
      containers?.length === 1,
      "Single approved runtime container required",
    );
    return containers[0].image;
  };
  const workerImages = {};
  for (const name of [
    "job-abarva-deliv-worker",
    "job-abarva-deliv-worker-event",
  ])
    workerImages[name] = image(
      (await get(`jobs/${name}`)).properties.template.containers,
    );
  const executions = await get(
    `jobs/${encodeURIComponent(meta.jobName)}/executions`,
  );
  const own = (executions.value ?? []).filter(
    (e) =>
      e.properties.status === "Running" &&
      e.properties.template?.containers?.some((c) =>
        c.env?.some(
          (v) => v.name === "SOURCE_ORIGIN_RUN_ID" && v.value === meta.runId,
        ),
      ),
  );
  check(own.length === 1, "Exact native operator execution witness required");
  const gh = await fetch(
    `https://api.github.com/repos/abarva-platform/abarva/actions/workflows/aca-main-deploy.yml/runs?head_sha=${encodeURIComponent(meta.gitSha)}&event=push&status=success&per_page=5`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "source-origin-runtime-proof",
      },
      signal: AbortSignal.timeout(30000),
    },
  );
  check(gh.ok, "Repo-owned main deployment witness unavailable");
  const runs = (await gh.json()).workflow_runs ?? [];
  const witness = {
    templateImage: image(web.properties.template.containers),
    revisionImage: image(revision.properties.template.containers),
    revisionName: traffic[0].revisionName,
    trafficWeight: traffic[0].weight,
    trafficRevisionCount: traffic.length,
    healthState: revision.properties.healthState,
    active: revision.properties.active,
    workerImages,
    operatorImage: image(own[0].properties.template.containers),
    operatorExecutionName: own[0].name,
    operatorRunId: meta.runId,
    mainCommitSha: meta.gitSha,
    mainDeploySucceeded: runs.some(
      (r) =>
        r.head_sha === meta.gitSha &&
        r.head_branch === "main" &&
        r.event === "push" &&
        r.conclusion === "success",
    ),
    observedAt: new Date().toISOString(),
  };
  return verifyOriginRuntimeWitness(witness, meta);
}

export function verifyOriginExecutionBinding(
  bytes,
  expectedHash,
  inputs,
  certificateHash,
  currentCode,
) {
  check(
    /^[a-f0-9]{64}$/.test(expectedHash ?? "") && sha(bytes) === expectedHash,
    "Exact sealed execution binding required",
  );
  const binding = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  check(
    binding.contract_version === "source-origin-execution-binding/v1" &&
      binding.state === "manager_reviewed" &&
      binding.decision_sha256 === inputs.delegationProof.decisionSha256 &&
      binding.authority_sha256 === inputs.delegationProof.authoritySha256 &&
      binding.plan_sha256 === inputs.planSha256 &&
      binding.manifest_sha256 === inputs.plan.proposedManifestSha256 &&
      binding.code_certificate_sha256 === certificateHash &&
      isDeepStrictEqual(binding.code_fingerprints, currentCode) &&
      binding.tenant_key === inputs.plan.tenant_key &&
      binding.contract_id === inputs.plan.contract_id &&
      binding.dataset_version === inputs.plan.dataset_version &&
      binding.target_count === inputs.plan.targets.length &&
      binding.git_sha === inputs.meta.gitSha &&
      binding.image_digest === inputs.meta.imageDigest &&
      binding.job_name === inputs.meta.jobName &&
      binding.run_id === inputs.meta.runId &&
      binding.idempotency_key === inputs.meta.idempotencyKey &&
      binding.mode === inputs.mode &&
      binding.actor_session_id === "01a11323-f628-7870-95b6-d8c00b50bd27" &&
      binding.preflight_proof_uri &&
      /^[a-f0-9]{64}$/.test(binding.preflight_proof_sha256),
    "Execution binding does not match exact current candidate/runtime/request",
  );
  originPrivateProofLocation(binding.preflight_proof_uri, "data");
  return binding;
}

export function verifyOriginDelegationBytes(
  authorityBytes,
  decisionBytes,
  trust = TRUST,
  now = Date.now(),
) {
  check(
    trust.status === "active" &&
      trust.contract_version === "source-document-origin-trust/v1",
    "Current release-controlled Source grant required",
  );
  check(
    authorityBytes.byteLength <= 1_000_000 &&
      decisionBytes.byteLength <= 1_000_000 &&
      sha(authorityBytes) === trust.authority_sha256 &&
      sha(decisionBytes) === trust.decision_sha256,
    "Independent authority or certified decision byte hash mismatch",
  );
  const authority = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(authorityBytes),
  );
  const decision = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(decisionBytes),
  );
  check(
    authority.contract_version === "nexus-delegated-approval-authority/v1" &&
      authority.authority_id === trust.authority_id &&
      authority.status === "active" &&
      authority.source_message_independently_read === true &&
      authority.actor?.kind === "delegated_agent" &&
      authority.actor.session_id ===
        authority.human_authorization_reference?.thread_id &&
      sha(authority.human_authorization_text ?? "") ===
        authority.human_authorization_reference?.text_sha256 &&
      authority.scope?.allowed_operations?.includes("metadata_repair"),
    "Verified metadata-repair delegation required",
  );
  const from = Date.parse(authority.valid_from);
  const decided = Date.parse(decision.decidedAt);
  check(
    Number.isFinite(from) &&
      Number.isFinite(decided) &&
      from <= decided &&
      decided <= now &&
      (authority.expires_at === null ||
        (Number.isFinite(Date.parse(authority.expires_at)) &&
          now < Date.parse(authority.expires_at))) &&
      decision.decisionId === trust.decision_id &&
      decision.status === "approved_with_execution_conditions" &&
      decision.independentClientOrFinanceAttestation === false,
    "Current certified conditional Source decision required",
  );
  return {
    authority,
    decision,
    authoritySha256: trust.authority_sha256,
    decisionSha256: trust.decision_sha256,
  };
}

export function originPrivateProofLocation(uri, kind) {
  const url = new URL(uri);
  const prefix =
    kind === "approval"
      ? "/ecl-synthetic-intake/operator-proof/delegated-approvals/"
      : "/ecl-synthetic-intake/operator-proof/source-origin-repair/";
  check(
    url.origin === "https://stabarvaprivatedplab001.blob.core.windows.net" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith(prefix) &&
      !url.pathname.includes("%") &&
      /^[a-zA-Z0-9/_.-]+$/.test(url.pathname.slice(prefix.length)) &&
      !url.pathname.split("/").some((s) => s === "." || s === ".."),
    "Approved private proof account and path required",
  );
  return url.pathname.slice("/ecl-synthetic-intake/".length);
}

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

export function originRepairInputs(env, documents) {
  const required = (key) => {
    check(env[key]?.trim(), `${key} required`);
    return env[key].trim();
  };
  const mode = required("SOURCE_ORIGIN_MODE");
  check(
    ["preflight", "apply", "verify", "restore"].includes(mode),
    "Invalid repair mode",
  );
  const planBytes =
    documents?.planBytes ??
    Buffer.from(required("SOURCE_ORIGIN_PLAN_SECRET"), "base64");
  const manifestBytes =
    documents?.manifestBytes ??
    Buffer.from(required("SOURCE_ORIGIN_MANIFEST_SECRET"), "base64");
  const approval =
    documents?.delegation.decision ??
    JSON.parse(
      Buffer.from(
        required("SOURCE_ORIGIN_APPROVAL_SECRET"),
        "base64",
      ).toString(),
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
    if (!documents)
      check(
        approval.approvedCodeGitSha === meta.gitSha &&
          approval.approvedImageDigest === meta.imageDigest,
        "Reviewed code and runtime approval required",
      );
  }
  let restoreProof;
  if (mode === "restore") {
    const bytes =
      documents?.restoreProofBytes ??
      Buffer.from(required("SOURCE_ORIGIN_RESTORE_PROOF_SECRET"), "base64");
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
  return {
    mode,
    plan,
    planSha256,
    approval,
    meta,
    restoreProof,
    delegationProof: documents?.delegation && {
      authoritySha256: documents.delegation.authoritySha256,
      decisionSha256: documents.delegation.decisionSha256,
    },
  };
}

async function loadPrivateOriginInputs(env) {
  check(
    /^[a-f0-9-]{36}$/i.test(env.AZURE_CLIENT_ID ?? ""),
    "Managed identity required for private proof read",
  );
  const service = new BlobServiceClient(
    "https://stabarvaprivatedplab001.blob.core.windows.net",
    new ManagedIdentityCredential(env.AZURE_CLIENT_ID),
  );
  const container = service.getContainerClient("ecl-synthetic-intake");
  check(
    !(await container.getProperties()).blobPublicAccess,
    "Approval proof container must be private",
  );
  const read = async (uri, kind) => {
    const blob = container.getBlobClient(originPrivateProofLocation(uri, kind));
    const properties = await blob.getProperties();
    check(
      Number.isSafeInteger(properties.contentLength) &&
        properties.contentLength <= 1_000_000,
      "Private proof exceeds bounded size",
    );
    return blob.downloadToBuffer();
  };
  const base =
    "https://stabarvaprivatedplab001.blob.core.windows.net/ecl-synthetic-intake/operator-proof/delegated-approvals";
  const authorityBytes = await read(
    `${base}/${TRUST.authority_id}/${TRUST.authority_sha256}/authority.json`,
    "approval",
  );
  const decisionBytes = await read(
    `${base}/${TRUST.authority_id}/${TRUST.decision_id}/${TRUST.decision_sha256}/decision.json`,
    "approval",
  );
  const delegation = verifyOriginDelegationBytes(authorityBytes, decisionBytes);
  const planBytes = await read(env.SOURCE_ORIGIN_PLAN_BLOB, "data");
  const manifestBytes = await read(env.SOURCE_ORIGIN_MANIFEST_BLOB, "data");
  const restoreProofBytes =
    env.SOURCE_ORIGIN_MODE === "restore"
      ? await read(env.SOURCE_ORIGIN_RESTORE_PROOF_BLOB, "data")
      : undefined;
  const inputs = originRepairInputs(env, {
    delegation,
    planBytes,
    manifestBytes,
    restoreProofBytes,
  });
  const currentCode = codeFingerprints();
  const certificateBytes = fs.readFileSync(
    new URL("./document-origin-code-certificate.json", import.meta.url),
  );
  if (["apply", "restore"].includes(inputs.mode)) {
    verifyOriginCodeCertificate(certificateBytes, EXECUTION_TRUST, currentCode);
    const bindingBytes = await read(
      env.SOURCE_ORIGIN_EXECUTION_BINDING_BLOB,
      "data",
    );
    const binding = verifyOriginExecutionBinding(
      bindingBytes,
      env.SOURCE_ORIGIN_EXECUTION_BINDING_SHA256,
      inputs,
      sha(certificateBytes),
      currentCode,
    );
    const preflightBytes = await read(binding.preflight_proof_uri, "data");
    check(
      sha(preflightBytes) === binding.preflight_proof_sha256,
      "Reviewed preflight proof bytes changed",
    );
    const preflight = JSON.parse(preflightBytes.toString());
    check(
      preflight.mode === "preflight" &&
        preflight.state === "succeeded" &&
        preflight.committed === false &&
        preflight.updatedRows === 0 &&
        preflight.planSha256 === inputs.planSha256 &&
        preflight.delegationProof?.decisionSha256 === TRUST.decision_sha256 &&
        isDeepStrictEqual(preflight.codeFingerprints, currentCode) &&
        preflight.runtimeWitness?.templateImage ===
          `acrabarvalab001.azurecr.io/abarva/web@${inputs.meta.imageDigest}`,
      "Independent current reviewed preflight required",
    );
    inputs.executionBinding = {
      sha256: sha(bindingBytes),
      preflightSha256: sha(preflightBytes),
    };
  }
  inputs.codeFingerprints = currentCode;
  inputs.runtimeWitness = await nativeRuntimeWitness(
    env,
    inputs.meta,
    new ManagedIdentityCredential(env.AZURE_CLIENT_ID),
  );
  return inputs;
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
    delegationProof: inputs.delegationProof ?? null,
    codeFingerprints: inputs.codeFingerprints ?? null,
    runtimeWitness: inputs.runtimeWitness ?? null,
    executionBinding: inputs.executionBinding ?? null,
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
  const inputs = await loadPrivateOriginInputs(process.env);
  const persistBlob = await privateProofTarget(process.env);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "source-origin-proof-"));
  const persist = async (name, proof) => {
    fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(proof));
    return persistBlob(name, proof);
  };
  await persist(`${inputs.meta.runId}-startup`, {
    ...inputs.meta,
    mode: inputs.mode,
    planSha256: inputs.planSha256,
    delegationProof: inputs.delegationProof,
    codeFingerprints: inputs.codeFingerprints,
    runtimeWitness: inputs.runtimeWitness,
    executionBinding: inputs.executionBinding ?? null,
    state: "startup_validated_no_database_opened",
    observedAt: new Date().toISOString(),
  });
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
