import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_TENANT_KEYS } from "../../src/config/tenants/CANONICAL_TENANTS";
import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import { buildIntegratedInsightPlan } from "../../src/lib/ecl/insights/engine";
import { readInsightInput } from "../../src/lib/ecl/insights/read-input";
import { persistInsightCandidates, verifyInsightCandidates } from "../../src/lib/ecl/insights/store";
import { readDatasetManifests } from "./load_synthetic_enterprise_v1";
import {
  applySqlLimits, blobProofStore, commitTransaction, connectDatabase,
  jobLimits, jobRecord, jobRun, proofBytes,
  type JobClient, type ProofStore,
} from "./synthetic_enterprise_home_job";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
type Env = Record<string, string | undefined>;
export type InsightRuntime = {
  connect: (url: string) => Promise<JobClient>;
  manifests: () => Promise<unknown[]>;
  recordExists: (file: string) => boolean;
  store: (env: Env) => Promise<ProofStore>;
};

const defaultRuntime: InsightRuntime = {
  connect: connectDatabase,
  manifests: readDatasetManifests,
  recordExists: (file) => existsSync(path.join(root, file)),
  store: (env) => blobProofStore(env.ECL_INSIGHT_STORAGE_ACCOUNT ?? "", env.AZURE_CLIENT_ID ?? "", jobLimits(env)),
};

export function emitInsightProofBundle(proof: unknown, report: (line: string) => void = console.log) {
  const directory = mkdtempSync(path.join(tmpdir(), "integrated-insight-proof-"));
  try {
    writeFileSync(path.join(directory, "proof.json"), JSON.stringify(proof));
    const archive = path.join(directory, "proof.tgz");
    execFileSync("tar", ["-czf", archive, "-C", directory, "proof.json"], { timeout: 10_000 });
    const encoded = readFileSync(archive).toString("base64");
    if (encoded.length > 960_000) throw new Error("Proof exceeds bounded log transport; use the authoritative private Blob proof");
    report("__SEMANTIC2_PROOF_TGZ_BEGIN__");
    for (let offset = 0; offset < encoded.length; offset += 4000) report(encoded.slice(offset, offset + 4000));
    report("__SEMANTIC2_PROOF_TGZ_END__");
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

export async function runInsightJob(env: Env, mode: "inventory" | "plan" | "apply", runtime = defaultRuntime) {
  const tenant = env.ECL_INSIGHT_TENANT_KEY ?? "";
  if (!(CANONICAL_TENANT_KEYS as readonly string[]).includes(tenant)) throw new Error("An explicit canonical tenant is required");
  const run = jobRun({ ...env,
    ECL_SYNTHETIC_RUN_ID: env.ECL_INSIGHT_RUN_ID,
    ECL_SYNTHETIC_OPERATOR_IDENTITY: env.ECL_INSIGHT_OPERATOR_IDENTITY,
    ECL_SYNTHETIC_BUILD_VERSION: env.ECL_INSIGHT_BUILD_VERSION,
    ECL_SYNTHETIC_RELEASE_RECORD: env.ECL_INSIGHT_RELEASE_RECORD,
    ECL_SYNTHETIC_IMAGE_DIGEST: env.ABARVA_OPERATOR_IMAGE,
  }, "enterprise-integrated-insights");
  if (!runtime.recordExists(run.releaseRecord)) throw new Error("Release record is absent from this image");
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const limits = jobLimits(env);
  const db = await runtime.connect(env.DATABASE_URL);
  let transaction = false;
  let committed = false;
  try {
    await db.query(mode === "apply" ? "begin isolation level serializable" : "begin isolation level repeatable read read only");
    transaction = true;
    await applySqlLimits(db, limits);
    await db.query("select set_config('app.tenant_key', $1, true)", [tenant]);
    console.log(JSON.stringify({ checkpoint: "canonical_read", mode, tenant_scope: tenant, run_id: run.runId }));
    if (mode === "inventory") {
      const objects = await db.query(
        `select assessment_id, coalesce(nullif(attributes_json->>'canonical_semantic_type',''),object_type) as object_type,
           review_state, count(*)::int as rows from ecl_context.object where tenant_key=$1
           group by assessment_id, 2, review_state order by assessment_id, 2, review_state`, [tenant]);
      const measures = await db.query(
        `select assessment_id, metric_key, unit, scenario, review_state, count(*)::int as rows
           from ecl_context.measure where tenant_key=$1 group by assessment_id, metric_key, unit, scenario, review_state
           order by assessment_id, metric_key, unit, scenario, review_state`, [tenant]);
      await db.query("rollback"); transaction = false;
      const proofPath = `${tenant}/enterprise-insights/inventory/runs/${run.runId}/proof.json`;
      const store = await runtime.store(env);
      const proof = { ...jobRecord(run, { tenantScope: tenant, inputSourceVersion: "inventory-only",
        idempotencyKey: run.runId, status: "succeeded", proofUri: store.uriFor(proofPath), limits }),
        mode, mutation_applied: false, objects: objects.rows, measures: measures.rows,
        validation: { tenant_fenced: true, transaction_read_only: true },
        quality_gate: { product_serving_changed: false, approval_required_for_load: true } };
      await store.writeOnce(proofPath, proofBytes(proof));
      return proof;
    }
    const assessment = env.ECL_INSIGHT_ASSESSMENT_ID ?? "";
    const datasetId = env.ECL_INSIGHT_DATASET_ID ?? "";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,119}$/.test(datasetId)) throw new Error("A safe dataset ID is required");
    const input = await readInsightInput(db, tenant, assessment, env.ECL_INSIGHT_AS_OF ?? "");
    const plan = buildIntegratedInsightPlan(input);
    const manifests = await runtime.manifests();
    const approval = resolveLoadApproval(manifests, { dataset_id: datasetId, tenant_key: tenant,
      assessment_id: assessment, source_set_hash: plan.loadVersionHash,
      object_count: plan.findings.length, ingestion_method: "operator_aca_job" });
    let receipt: { findings: number; idempotentReplay: boolean } | null = null;
    const store = await runtime.store(env);
    const proofPath = `${tenant}/enterprise-insights/${datasetId}/${plan.loadVersionHash}/runs/${run.runId}/proof.json`;
    const inputPath = `${tenant}/enterprise-insights/${datasetId}/${plan.loadVersionHash}/runs/${run.runId}/input.json`;
    const inputBytes = proofBytes(input as unknown as Record<string, unknown>);
    const inputReceipt = await store.writeOnce(inputPath, inputBytes);
    if (!inputReceipt.created && !(await store.read(inputReceipt.uri)).equals(inputBytes)) {
      throw new Error("Existing immutable input snapshot differs; use a fresh run ID");
    }
    const record = jobRecord(run, { tenantScope: tenant, inputSourceVersion: plan.loadVersionHash,
      idempotencyKey: plan.releaseId, status: "succeeded", proofUri: store.uriFor(proofPath), limits });
    if (mode === "apply") {
      if (env.ECL_INSIGHT_EXPECTED_VERSION_HASH !== plan.loadVersionHash) throw new Error("Exact planned input/rule/result version hash required; changed candidates need a new approval");
      console.log(JSON.stringify({ checkpoint: "approval_check", load_version_hash: plan.loadVersionHash }));
      receipt = await persistInsightCandidates(db, plan, { datasetId, manifests,
        recordExists: runtime.recordExists, runId: run.runId, releaseRecord: run.releaseRecord, jobRecord: record });
      await commitTransaction(db, "Insight candidate load", "no new candidates persisted");
      transaction = false; committed = true;
      const verifier = await runtime.connect(env.DATABASE_URL);
      try {
        await verifier.query("begin read only");
        await applySqlLimits(verifier, limits);
        await verifier.query("select set_config('app.tenant_key', $1, true)", [tenant]);
        const readback = await verifier.query<{ rows: number; ready: number }>(
          `select count(*)::int as rows, count(*) filter (where agent_ready)::int as ready
             from serving.enterprise_insight_candidates where tenant_key=$1 and assessment_id=$2 and release_id=$3`,
          [tenant, assessment, plan.releaseId]);
        if (readback.rows[0]?.rows !== plan.findings.length || readback.rows[0]?.ready !== 0) throw new Error("Independent serving readback failed");
        const release = await verifier.query<{ first_run_id: string; result_hash: string }>(
          `select first_run_id, result_hash from ecl_projection.enterprise_insight_release
           where tenant_key=$1 and assessment_id=$2 and id=$3`, [tenant, assessment, plan.releaseId]);
        if (release.rows.length !== 1 || release.rows[0].result_hash !== plan.resultHash) throw new Error("Independent release readback failed");
        await verifyInsightCandidates(verifier, plan, release.rows[0].first_run_id);
        await verifier.query("rollback");
      } finally { await verifier.end(); }
    } else {
      await db.query("rollback"); transaction = false;
    }
    const proof = { ...record, mode, mutation_applied: committed, plan, receipt, load_approval: approval,
      input_snapshot_uri: store.uriFor(inputPath), input_snapshot_hash: plan.sourceSetHash,
      validation: { tenant_fenced: true, reproducible: true, exact_version_binding: plan.loadVersionHash },
      quality_gate: { product_serving_changed: false, candidate_only: true, agent_ready: false,
        human_review_required: true, load_approved: approval.approved } };
    await store.writeOnce(proofPath, proofBytes(proof));
    return proof;
  } catch (error) {
    if (transaction) await db.query("rollback").catch(() => undefined);
    if (committed) throw new Error("Candidates committed, but final verification/proof failed; inspect the release before retrying", { cause: error });
    throw error;
  } finally { await db.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  const mode = arg === "--inventory" ? "inventory" : arg === "--plan" ? "plan" : arg === "--apply" ? "apply" : null;
  if (!mode) throw new Error("Use --inventory, --plan or --apply");
  runInsightJob(process.env, mode).then((proof) => {
    const plan = "plan" in proof ? proof.plan : null;
    const metadata: Record<string, unknown> = proof;
    console.log(JSON.stringify({ checkpoint: "complete", mode, run_id: metadata.run_id,
      proof_uri: metadata.blob_proof_bundle, mutation_applied: proof.mutation_applied,
      load_version_hash: plan?.loadVersionHash ?? null, finding_count: plan?.findings.length ?? null,
      evaluations: plan?.evaluations ?? [], quality_gate: proof.quality_gate }));
    if (process.env.ECL_INSIGHT_EMIT_PROOF_BUNDLE === "true") {
      try { emitInsightProofBundle(proof); }
      catch (error) { throw new Error("Job completed and private Blob proof is stored, but local review-package export failed; inspect the completion summary before retrying", { cause: error }); }
    }
  }).catch((error) => {
    console.error(error); process.exitCode = 1;
  });
}
