#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";
import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import { resolveTenantAlias } from "../../src/lib/tenant/aliases";
import { buildDiscoveryBlueprintInputFromProgram, resolveDeclaredProgramArchetypeId } from "../../src/lib/programs/discovery/evidence-readiness";
import { getDiscoveryBlueprint } from "../../src/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import { blobProofStore, PROOF_CONTAINER, type ProofStore } from "../ecl/synthetic_enterprise_home_job";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const AUTH_PATH = "docs/governance/data-repairs/moves-gdf-evidence-client-key-20261006.json";
const MANIFEST_PATH = "docs/governance/dataset-manifests/moves-gdf-discovery-aca-smoke-20261006.json";
const JOB_NAME = "job-abarva-private-operator-eus";
const FAMILIES = [
  "data_governance_ownership", "semantic_layer_certification", "data_lineage_audit_trail",
  "data_quality_rules", "source_system_data_access", "platform_architecture_readiness",
  "master_identity_resolution", "privacy_security_controls", "model_risk_responsible_ai_controls",
  "measurement_owner_cadence", "finance_baseline_value_plan",
] as const;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};
const jsonFile = (file: string) => JSON.parse(readFileSync(path.join(ROOT, file), "utf8")) as Record<string, unknown>;
const stableUuid = (...parts: string[]) => {
  const bytes = Buffer.from(sha256(parts.join("|")).slice(0, 32), "hex");
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

type EvidenceRow = { id: string; tenant_key: string; program_id: string; phase: number; step_id: string;
  extracted_structured: Record<string, unknown> };
type ReviewRow = { id: string; tenant_key: string; program_id: string; evidence_id: string;
  family_key: string; archetype_id: string; phase: number; decision: string;
  auto_promoted: boolean; reviewed_at: string | null; source_ref: Record<string, unknown> };

function verifyRows(evidence: EvidenceRow[], reviews: ReviewRow[], auth: Record<string, unknown>, tenantKey: string): void {
  if (evidence.length !== 11 || reviews.length !== 11) throw new Error("Expected exactly 11 evidence rows and 11 review rows for this Move");
  const evidenceById = new Map(evidence.map((row) => [row.id, row]));
  if (evidenceById.size !== 11) throw new Error("Duplicate evidence IDs");
  const familySet = new Set<string>();
  for (const row of reviews) {
    const evidenceId = stableUuid(String(auth.dataset_id), String(auth.move_id), String(auth.source_set_hash), row.family_key, "evidence");
    const reviewId = stableUuid(String(auth.dataset_id), String(auth.move_id), String(auth.source_set_hash), row.family_key, "review");
    const item = evidenceById.get(row.evidence_id);
    if (!FAMILIES.includes(row.family_key as typeof FAMILIES[number]) || familySet.has(row.family_key) ||
        row.id !== reviewId || row.evidence_id !== evidenceId || !item ||
        row.program_id !== auth.move_id || item.program_id !== auth.move_id ||
        row.tenant_key !== tenantKey || item.tenant_key !== tenantKey ||
        row.archetype_id !== "governed_data_foundation" || row.phase !== 2 || item.phase !== 2 ||
        item.step_id !== `current-state:${row.family_key}` || row.decision !== "pending" ||
        row.auto_promoted || row.reviewed_at !== null ||
        row.source_ref?.governance_dataset_id !== auth.dataset_id ||
        row.source_ref?.source_set_hash !== auth.source_set_hash ||
        row.source_ref?.synthetic !== true || row.source_ref?.client_attested !== false ||
        item.extracted_structured?.governance_dataset_id !== auth.dataset_id ||
        item.extracted_structured?.source_set_hash !== auth.source_set_hash ||
        item.extracted_structured?.synthetic !== true ||
        item.extracted_structured?.client_attested !== false ||
        item.extracted_structured?.agent_readiness_status !== "not_reviewed") {
      throw new Error(`Evidence row failed exact synthetic pending scope check: ${row.family_key}`);
    }
    familySet.add(row.family_key);
  }
  if (FAMILIES.some((family) => !familySet.has(family))) throw new Error("Missing required family in exact repair scope");
}

async function writeJsonOnce(store: ProofStore, blobPath: string, value: unknown): Promise<void> {
  const result = await store.writeOnce(blobPath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"));
  if (!result.created) throw new Error("Proof blob already exists for this run");
}

async function main(): Promise<void> {
  const auth = jsonFile(AUTH_PATH);
  const manifest = jsonFile(MANIFEST_PATH);
  const manifestApproval = manifest.load_approval as Record<string, unknown> | null;
  const runId = required("MOVES_REKEY_RUN_ID");
  const releaseRecord = required("MOVES_REKEY_RELEASE_RECORD");
  const image = required("ABARVA_OPERATOR_IMAGE");
  const imageDigest = required("ABARVA_OPERATOR_IMAGE_DIGEST");
  const gitSha = required("ABARVA_OPERATOR_BRANCH_COMMIT");
  const inputSourceVersion = required("MOVES_REKEY_INPUT_SOURCE_VERSION");
  const idempotencyKey = required("MOVES_REKEY_IDEMPOTENCY_KEY");
  const operatorIdentity = required("MOVES_REKEY_OPERATOR_IDENTITY");
  const buildVersion = required("MOVES_REKEY_BUILD_VERSION");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId) ||
      !/^[0-9a-f]{40}$/.test(gitSha) || !/@sha256:[0-9a-f]{64}$/i.test(image) ||
      imageDigest !== image.slice(image.lastIndexOf("@") + 1) ||
      required("MOVES_REKEY_APPLY") !== "true") throw new Error("Job identity, pinned image, or apply flag is invalid");
  if (auth.repair_id !== "moves-gdf-evidence-client-key-20261006" ||
      auth.dataset_id !== manifest.dataset_id || auth.move_id !== manifestApproval?.move_id ||
      auth.source_set_hash !== manifestApproval?.source_set_hash ||
      auth.expected_evidence_items !== 11 || auth.expected_pending_reviews !== 11 ||
      auth.approved_by !== "Anand Sundaram" ||
      auth.approval_basis !== "delegated_automated_smoke_test_user_instruction_2026-10-06" ||
      auth.release_record !== releaseRecord || inputSourceVersion !== auth.source_set_hash ||
      idempotencyKey !== `moves-gdf-rekey-v1:${sha256(`${auth.move_id}|${auth.source_set_hash}|${auth.from_tenant_key}|${auth.to_tenant_key}`)}`) {
    throw new Error("Repair authorization, source version, release record, or idempotency binding differs");
  }
  if (manifest.tenant_scope !== "move_registry" || manifest.client_key !== null ||
      manifest.ingestion_method !== "operator_aca_job") throw new Error("Move-scoped manifest contract changed");
  const databaseUrl = required("ABARVA_AZURE_DATABASE_URL");
  let databaseHost = "";
  try { databaseHost = new URL(databaseUrl).hostname.toLowerCase(); } catch { throw new Error("Unparseable database URL"); }
  if (!databaseHost.endsWith(".postgres.database.azure.com") && !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(databaseHost)) {
    throw new Error("Refusing a non-Azure database target");
  }
  const startedAt = new Date().toISOString();
  const prefix = `moves-gdf-discovery/repairs/${runId}`;
  const store = await blobProofStore(required("AZURE_STORAGE_ACCOUNT_NAME"), required("ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID"),
    { statementTimeoutMs: 60_000, lockTimeoutMs: 15_000, proofStoreTimeoutMs: 30_000 });
  const client = new Client(postgresClientOptions(databaseUrl, "moves-gdf-evidence-key-repair-job"));
  const progress: Array<{ checkpoint: string; at: string }> = [];
  const checkpoint = async (name: string) => {
    const entry = { checkpoint: name, at: new Date().toISOString() };
    await writeJsonOnce(store, `${prefix}/progress/${name}.json`, { job_name: JOB_NAME, run_id: runId, ...entry });
    progress.push(entry);
    console.log(JSON.stringify({ run_id: runId, ...entry }));
  };
  let stage = "start";
  let transactionStarted = false;
  let committed = false;
  try {
    await checkpoint("00-authorization-validated");
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    transactionStarted = true;
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query("SET LOCAL lock_timeout = '15s'");
    stage = "move-authentication";
    const moveRows = await client.query<{ id: string; client_id: string; name: string; program_archetype: string | null;
      function_pack_key: string | null; charter: Record<string, unknown> | null; current_phase: number;
      tenant_key: string | null; slug: string | null }>(
      `SELECT e.id, e.client_id, e.name, e.program_archetype, e.function_pack_key, e.charter,
              e.current_phase, c.tenant_key, c.slug
         FROM engagements e JOIN clients c ON c.id = e.client_id
        WHERE e.id = $1::uuid AND e.deleted_at IS NULL FOR UPDATE OF e`, [auth.move_id]);
    if (moveRows.rowCount !== 1) throw new Error("Move registry did not authenticate exactly one Move");
    const move = moveRows.rows[0]!;
    const profile = resolveTenantAlias(move.tenant_key);
    if (!profile || move.slug !== profile.appClientKey ||
        auth.from_tenant_key !== profile.canonicalKey || auth.to_tenant_key !== profile.appClientKey ||
        (move.charter?.classification as Record<string, unknown> | undefined)?.archetype !== "governed_data_foundation" ||
        move.current_phase !== 1) throw new Error("Persisted Move tenant, declaration, or phase differs from repair authorization");
    const blueprintInput = { functionPackKey: move.function_pack_key, archetype: move.program_archetype,
      name: move.name, problemStatement: null, targetOutcome: null, charter: move.charter };
    const declared = resolveDeclaredProgramArchetypeId(blueprintInput);
    const blueprint = getDiscoveryBlueprint(buildDiscoveryBlueprintInputFromProgram(blueprintInput), declared);
    if (declared !== "governed_data_foundation" || blueprint.blueprintId !== declared ||
        JSON.stringify(blueprint.evidenceFamilies.filter((family) => family.required).map((family) => family.id)) !== JSON.stringify(FAMILIES)) {
      throw new Error("Persisted Move blueprint no longer matches the 11-family authorization");
    }
    const approval = resolveLoadApproval([manifest], {
      dataset_id: String(auth.dataset_id), tenant_key: profile.appClientKey, move_id: move.id,
      assessment_id: move.id, source_set_hash: String(auth.source_set_hash), object_count: 11,
      ingestion_method: "operator_aca_job",
    });
    if (!approval.approved) throw new Error(`Move-scoped load approval refused app client key: ${approval.reasons.join("; ")}`);
    if (approval.approval.approved_by !== auth.approved_by) throw new Error("Move-scoped approval identity differs");
    await checkpoint("01-move-and-app-key-authenticated");
    stage = "exact-row-preflight";
    const evidence = await client.query<EvidenceRow>(
      `SELECT id, tenant_key, program_id, phase, step_id, extracted_structured
         FROM program_evidence_items WHERE program_id = $1::uuid FOR UPDATE`, [move.id]);
    const reviews = await client.query<ReviewRow>(
      `SELECT id, tenant_key, program_id, evidence_id, family_key, archetype_id, phase,
              decision, auto_promoted, reviewed_at, source_ref
         FROM program_evidence_reviews WHERE program_id = $1::uuid FOR UPDATE`, [move.id]);
    const keys = new Set([...evidence.rows, ...reviews.rows].map((row) => row.tenant_key));
    if (keys.size !== 1 || (!keys.has(String(auth.from_tenant_key)) && !keys.has(String(auth.to_tenant_key)))) {
      throw new Error("Move evidence has mixed or unexpected tenant keys");
    }
    const priorKey = [...keys][0]!;
    verifyRows(evidence.rows, reviews.rows, auth, priorKey);
    await checkpoint("02-exact-22-rows-verified");
    stage = "scoped-tenant-key-update";
    let updatedEvidence = 0;
    let updatedReviews = 0;
    if (priorKey === auth.from_tenant_key) {
      const evidenceIds = evidence.rows.map((row) => row.id);
      const reviewIds = reviews.rows.map((row) => row.id);
      const evidenceUpdate = await client.query(
        `UPDATE program_evidence_items SET tenant_key = $1
          WHERE program_id = $2::uuid AND tenant_key = $3 AND id = ANY($4::uuid[])`,
        [auth.to_tenant_key, move.id, auth.from_tenant_key, evidenceIds]);
      const reviewUpdate = await client.query(
        `UPDATE program_evidence_reviews SET tenant_key = $1
          WHERE program_id = $2::uuid AND tenant_key = $3 AND id = ANY($4::uuid[])`,
        [auth.to_tenant_key, move.id, auth.from_tenant_key, reviewIds]);
      updatedEvidence = evidenceUpdate.rowCount ?? 0;
      updatedReviews = reviewUpdate.rowCount ?? 0;
      if (updatedEvidence !== 11 || updatedReviews !== 11) throw new Error("Scoped update did not touch exactly 11 rows per table");
    }
    await checkpoint("03-scoped-updates-complete");
    const inTxnEvidence = await client.query<EvidenceRow>(
      `SELECT id, tenant_key, program_id, phase, step_id, extracted_structured
         FROM program_evidence_items WHERE program_id = $1::uuid`, [move.id]);
    const inTxnReviews = await client.query<ReviewRow>(
      `SELECT id, tenant_key, program_id, evidence_id, family_key, archetype_id, phase,
              decision, auto_promoted, reviewed_at, source_ref
         FROM program_evidence_reviews WHERE program_id = $1::uuid`, [move.id]);
    verifyRows(inTxnEvidence.rows, inTxnReviews.rows, auth, String(auth.to_tenant_key));
    await client.query("COMMIT");
    transactionStarted = false;
    committed = true;
    await checkpoint("04-transaction-committed");
    stage = "post-commit-readback";
    const afterEvidence = await client.query<EvidenceRow>(
      `SELECT id, tenant_key, program_id, phase, step_id, extracted_structured
         FROM program_evidence_items WHERE program_id = $1::uuid`, [move.id]);
    const afterReviews = await client.query<ReviewRow>(
      `SELECT id, tenant_key, program_id, evidence_id, family_key, archetype_id, phase,
              decision, auto_promoted, reviewed_at, source_ref
         FROM program_evidence_reviews WHERE program_id = $1::uuid`, [move.id]);
    verifyRows(afterEvidence.rows, afterReviews.rows, auth, String(auth.to_tenant_key));
    const phase = await client.query<{ current_phase: number }>("SELECT current_phase FROM engagements WHERE id = $1::uuid", [move.id]);
    if (phase.rows[0]?.current_phase !== 1) throw new Error("Move phase changed during repair");
    await checkpoint("05-independent-readback-passed");
    const countsByFamily = Object.fromEntries(FAMILIES.map((family) => [family, 1]));
    const validation = { status: "PASS", move_id: move.id, app_client_key: auth.to_tenant_key,
      canonical_tenant_key: auth.from_tenant_key, source_set_hash: auth.source_set_hash,
      evidence_items: 11, pending_reviews: 11, counts_by_family: countsByFamily,
      updated_evidence_items: updatedEvidence, updated_reviews: updatedReviews,
      current_phase: phase.rows[0]?.current_phase, approved_reviews: 0, rejected_reviews: 0 };
    const qualityGate = { status: "PASS", exact_move_and_source_hash: true,
      move_registry_app_client_key_verified: true, load_approval_move_bound: true,
      exact_11_plus_11_scope: true, pending_review_only: true, no_phase_transition: true };
    const proofUri = store.uriFor(`${prefix}/proof.json`);
    const validationUri = store.uriFor(`${prefix}/validation.json`);
    const qualityUri = store.uriFor(`${prefix}/quality-gate.json`);
    await writeJsonOnce(store, `${prefix}/validation.json`, validation);
    await writeJsonOnce(store, `${prefix}/quality-gate.json`, qualityGate);
    await writeJsonOnce(store, `${prefix}/proof.json`, {
      job_name: JOB_NAME, run_id: runId, tenant_scope: auth.to_tenant_key,
      build_version: buildVersion, input_source_version: inputSourceVersion,
      idempotency_key: idempotencyKey, started_at: startedAt, finished_at: new Date().toISOString(),
      operator_identity: operatorIdentity, approved_by: auth.approved_by, approval_basis: auth.approval_basis,
      git_sha: gitSha, image, image_digest: imageDigest, status: "succeeded", retry_count: 0,
      timeout_seconds: 1800, proof_container: PROOF_CONTAINER, blob_proof_bundle: proofUri,
      validation_output: validationUri, quality_gate_output: qualityUri,
      release_record: releaseRecord, progress, validation, quality_gate: qualityGate,
    });
    console.log(JSON.stringify({ event: "moves_gdf_evidence_key_repair",
      run_id: runId, blob_proof_bundle: proofUri, validation_output: validationUri,
      quality_gate_output: qualityUri, ...validation }));
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "unknown repair error";
    await writeJsonOnce(store, `${prefix}/failure.json`, {
      job_name: JOB_NAME, run_id: runId, tenant_scope: auth.to_tenant_key,
      build_version: buildVersion, input_source_version: inputSourceVersion,
      idempotency_key: idempotencyKey, started_at: startedAt, finished_at: new Date().toISOString(),
      operator_identity: operatorIdentity, git_sha: gitSha, image, image_digest: imageDigest,
      status: "failed", retry_count: 0, timeout_seconds: 1800, failed_stage: stage,
      error: message, mutation_committed: committed, release_record: releaseRecord, progress,
    }).catch(() => undefined);
    console.error(JSON.stringify({ event: "moves_gdf_evidence_key_repair", status: "failed",
      run_id: runId, failed_stage: stage, mutation_committed: committed, error: message }));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

void main().catch((error) => {
  console.error(JSON.stringify({ event: "moves_gdf_evidence_key_repair", status: "failed_before_start",
    error: error instanceof Error ? error.message : "unknown repair error" }));
  process.exitCode = 1;
});
