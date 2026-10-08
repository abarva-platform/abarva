#!/usr/bin/env tsx

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";
import { resolveLoadApproval } from "../../src/lib/governance/dataset-manifest";
import { evaluateGovernedObject, POLICY_VERSION } from "../../src/lib/governance/context-corpus-policy";
import { resolveTenantAlias } from "../../src/lib/tenant/aliases";
import { buildDiscoveryBlueprintInputFromProgram, resolveDeclaredProgramArchetypeId } from "../../src/lib/programs/discovery/evidence-readiness";
import { getDiscoveryBlueprint } from "../../src/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import { blobProofStore, PROOF_CONTAINER, type JobLimits, type ProofStore } from "../ecl/synthetic_enterprise_home_job";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATASET_ID = "moves_gdf_discovery_aca_smoke_20261006";
const SOURCE_ROOT = "scripts/moves/fixtures/gdf-discovery-aca-smoke";
const SOURCE_LIST = `${SOURCE_ROOT}/00_demo/upload_manifest.json`;
const MANIFEST_DIR = "docs/governance/dataset-manifests";
const TARGET_ARCHETYPE = "governed_data_foundation";
const JOB_NAME = "job-abarva-private-operator-eus";
const LIMITS: JobLimits = { statementTimeoutMs: 60_000, lockTimeoutMs: 15_000, proofStoreTimeoutMs: 30_000 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;
const EXPECTED_FAMILIES = [
  "data_governance_ownership",
  "semantic_layer_certification",
  "data_lineage_audit_trail",
  "data_quality_rules",
  "source_system_data_access",
  "platform_architecture_readiness",
  "master_identity_resolution",
  "privacy_security_controls",
  "model_risk_responsible_ai_controls",
  "measurement_owner_cadence",
  "finance_baseline_value_plan",
] as const;

type Source = { familyKey: string; phase: number; evidenceType: string; path: string; sha256: string; text: string; title: string };
type Config = {
  runId: string; moveId: string; expectedTenantKey: string; sourceHash: string;
  idempotencyKey: string; releaseRecord: string; operatorIdentity: string;
  buildVersion: string; gitSha: string; image: string; imageDigest: string;
  retryCount: number; timeoutSeconds: number; storageAccount: string; storageIdentity: string;
  databaseUrl: string;
};

function hash(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}
function stableUuid(...parts: string[]): string {
  const bytes = Buffer.from(hash(parts.join("|")).slice(0, 32), "hex");
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sources(): { files: Source[]; sourceHash: string } {
  const upload = JSON.parse(readFileSync(path.join(ROOT, SOURCE_LIST), "utf8")) as {
    source_set_id?: string;
    synthetic?: boolean;
    client_attested?: boolean;
    default_review_state?: string;
    ingestion_method?: string;
    initial_uploads?: Array<{ path: string; phase: number; evidence_type: string; family_key: string | null }>;
  };
  if (upload.source_set_id !== DATASET_ID || upload.synthetic !== true || upload.client_attested !== false ||
      upload.default_review_state !== "pending" || upload.ingestion_method !== "operator_aca_job") {
    throw new Error("ACA source set is not an exact synthetic pending-review job declaration");
  }
  const listed = (upload.initial_uploads ?? []).filter((item) => item.family_key);
  if (JSON.stringify(listed.map((item) => item.family_key)) !== JSON.stringify(EXPECTED_FAMILIES)) {
    throw new Error("Source package does not contain exactly the 11 required families in blueprint order");
  }
  const files = listed.map((item) => {
    if (item.phase !== 2 || item.evidence_type !== "uploaded_evidence" || !item.family_key) {
      throw new Error(`Invalid source descriptor for ${item.path}`);
    }
    const relative = path.posix.join(SOURCE_ROOT, item.path);
    const absolute = path.resolve(ROOT, relative);
    if (!absolute.startsWith(`${path.resolve(ROOT, SOURCE_ROOT)}${path.sep}`)) throw new Error("Source path escapes fixture root");
    const bytes = readFileSync(absolute);
    const text = bytes.toString("utf8");
    if (!/SYNTHETIC[^\n]*(NOT CLIENT-ATTESTED|fictional|simulated)|SYNTHETIC_NOT_(?:VALIDATED|GRANTED)/i.test(text)) {
      throw new Error(`Source is missing synthetic provenance: ${relative}`);
    }
    if (/(?:\b\w+@\w+\.\w+\b|password\s*[:=]|api[_ -]?key\s*[:=])/i.test(text)) {
      throw new Error(`Source may contain contact data or credentials: ${relative}`);
    }
    const heading = text.match(/^# (.+)$/m)?.[1];
    const title = heading ?? item.family_key.replace(/_/g, " ");
    return { familyKey: item.family_key, phase: 2, evidenceType: item.evidence_type, path: relative, sha256: hash(bytes), text, title };
  });
  const sourceHash = hash(JSON.stringify(files.map(({ familyKey, phase, evidenceType, path, sha256 }) => ({ familyKey, phase, evidenceType, path, sha256 }))));
  return { files, sourceHash };
}

function registryManifests(): unknown[] {
  const dir = path.join(ROOT, MANIFEST_DIR);
  return readdirSync(dir).filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), "utf8")));
}

function parseConfig(env: NodeJS.ProcessEnv, sourceHash: string): Config {
  const runId = required(env, "MOVES_DISCOVERY_RUN_ID");
  const moveId = required(env, "MOVES_DISCOVERY_MOVE_ID");
  const expectedTenantKey = required(env, "MOVES_DISCOVERY_EXPECTED_TENANT_KEY");
  const inputVersion = required(env, "MOVES_DISCOVERY_INPUT_SOURCE_VERSION");
  const idempotencyKey = required(env, "MOVES_DISCOVERY_IDEMPOTENCY_KEY");
  const releaseRecord = required(env, "MOVES_DISCOVERY_RELEASE_RECORD");
  const gitSha = required(env, "ABARVA_OPERATOR_BRANCH_COMMIT");
  const image = required(env, "ABARVA_OPERATOR_IMAGE");
  const imageDigest = required(env, "ABARVA_OPERATOR_IMAGE_DIGEST");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(runId) || !UUID.test(moveId)) throw new Error("Invalid run or Move id");
  if (!SHA.test(sourceHash) || inputVersion !== sourceHash) throw new Error("Input source version differs from exact source-set hash");
  if (idempotencyKey !== `moves-gdf-discovery-v1:${hash(`${moveId}|${sourceHash}`)}`) throw new Error("Idempotency key is not bound to Move and source set");
  if (!/^[0-9a-f]{40}$/.test(gitSha) || !/@sha256:[0-9a-f]{64}$/i.test(image) || imageDigest !== image.slice(image.lastIndexOf("@") + 1)) {
    throw new Error("Operator image, digest, or git SHA is not pinned");
  }
  if (required(env, "MOVES_DISCOVERY_APPLY") !== "true") throw new Error("Explicit apply flag is required");
  const databaseUrl = required(env, "ABARVA_AZURE_DATABASE_URL");
  let databaseHost = "";
  try { databaseHost = new URL(databaseUrl).hostname.toLowerCase(); } catch { throw new Error("Unparseable database URL"); }
  if (!databaseHost.endsWith(".postgres.database.azure.com") && !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(databaseHost)) {
    throw new Error("Refusing a non-Azure database target");
  }
  const retryCount = Number(env.MOVES_DISCOVERY_RETRY_COUNT ?? "0");
  const timeoutSeconds = Number(env.MOVES_DISCOVERY_TIMEOUT_SECONDS ?? "1800");
  if (!Number.isInteger(retryCount) || retryCount < 0 || !Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > 7200) {
    throw new Error("Invalid retry count or timeout");
  }
  return {
    runId, moveId, expectedTenantKey, sourceHash, idempotencyKey, releaseRecord,
    operatorIdentity: required(env, "MOVES_DISCOVERY_OPERATOR_IDENTITY"),
    buildVersion: required(env, "MOVES_DISCOVERY_BUILD_VERSION"), gitSha, image, imageDigest,
    retryCount, timeoutSeconds,
    storageAccount: required(env, "AZURE_STORAGE_ACCOUNT_NAME"),
    storageIdentity: required(env, "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID"),
    databaseUrl,
  };
}

function assertActiveTenant(tenantKey: string): void {
  const registry = JSON.parse(readFileSync(path.join(ROOT, "datasets/tenant-inputs/tenant-input-registry.json"), "utf8")) as {
    activeTenants?: Array<{ tenantKey?: string }>;
  };
  if (!registry.activeTenants?.some((item) => item.tenantKey === tenantKey)) {
    throw new Error("Move tenant is not active in the canonical tenant-input registry");
  }
}

async function writeJsonOnce(store: ProofStore, blobPath: string, value: unknown): Promise<string> {
  const result = await store.writeOnce(blobPath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"));
  if (!result.created) throw new Error("Proof blob already exists for this run");
  return result.uri;
}

async function main(): Promise<void> {
  const source = sources();
  if (process.argv.includes("--source-hash")) {
    console.log(JSON.stringify({ dataset_id: DATASET_ID, source_set_hash: source.sourceHash, object_count: source.files.length, families: source.files.map((file) => file.familyKey) }, null, 2));
    return;
  }
  const config = parseConfig(process.env, source.sourceHash);
  const startedAt = new Date().toISOString();
  const prefix = `moves-gdf-discovery/runs/${config.runId}`;
  const store = await blobProofStore(config.storageAccount, config.storageIdentity, LIMITS);
  const progress: Array<{ checkpoint: string; status: string; at: string }> = [];
  let stage = "started";
  let transactionStarted = false;
  let committed = false;
  const checkpoint = async (name: string) => {
    const entry = { checkpoint: name, status: "passed", at: new Date().toISOString() };
    await writeJsonOnce(store, `${prefix}/progress/${name}.json`, { job_name: JOB_NAME, run_id: config.runId, ...entry });
    progress.push(entry);
    console.log(JSON.stringify({ run_id: config.runId, ...entry }));
  };
  const client = new Client(postgresClientOptions(config.databaseUrl, "moves-gdf-discovery-smoke-job"));
  try {
    await checkpoint("00-source-and-job-contract-validated");
    await client.connect();
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    transactionStarted = true;
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query("SET LOCAL lock_timeout = '15s'");
    stage = "move-authentication";
    const moveRows = await client.query<{
      id: string; client_id: string; name: string; program_archetype: string | null;
      function_pack_key: string | null; charter: Record<string, unknown> | null;
      current_phase: number; tenant_key: string | null; slug: string | null;
    }>(`SELECT e.id, e.client_id, e.name, e.program_archetype, e.function_pack_key,
              e.charter, e.current_phase, c.tenant_key, c.slug
         FROM engagements e JOIN clients c ON c.id = e.client_id
        WHERE e.id = $1::uuid AND e.deleted_at IS NULL FOR UPDATE OF e`, [config.moveId]);
    if (moveRows.rowCount !== 1) throw new Error("Move registry lookup did not authenticate exactly one Move");
    const move = moveRows.rows[0]!;
    const declaredKeys = [move.tenant_key, move.slug].filter((value): value is string => !!value);
    const profiles = declaredKeys.map((value) => resolveTenantAlias(value));
    if (profiles.length === 0 || profiles.some((profile) => !profile || profile.canonicalKey !== profiles[0]?.canonicalKey)) {
      throw new Error("Move client aliases do not resolve to one canonical tenant");
    }
    const canonicalTenantKey = profiles[0]!.canonicalKey;
    const tenantKey = profiles[0]!.appClientKey;
    assertActiveTenant(canonicalTenantKey);
    if (canonicalTenantKey !== config.expectedTenantKey || move.slug !== tenantKey) {
      throw new Error("Authenticated Move canonical tenant or app client key differs from registry precondition");
    }
    const declaration = (move.charter?.classification as Record<string, unknown> | undefined)?.archetype;
    if (declaration !== TARGET_ARCHETYPE || move.current_phase !== 1) throw new Error("Move declaration or phase changed since authorized preflight");
    const resolverInput = {
      functionPackKey: move.function_pack_key, archetype: move.program_archetype, name: move.name,
      problemStatement: null, targetOutcome: null, charter: move.charter,
    };
    const declaredId = resolveDeclaredProgramArchetypeId(resolverInput);
    const blueprint = getDiscoveryBlueprint(buildDiscoveryBlueprintInputFromProgram(resolverInput), declaredId);
    if (declaredId !== TARGET_ARCHETYPE || blueprint.blueprintId !== TARGET_ARCHETYPE ||
        JSON.stringify(blueprint.evidenceFamilies.filter((family) => family.required).map((family) => family.id)) !== JSON.stringify(EXPECTED_FAMILIES)) {
      throw new Error("Persisted Move does not resolve to the authorized 11-family blueprint");
    }
    await checkpoint("01-move-tenant-and-blueprint-authenticated");

    stage = "load-authorization";
    const approval = resolveLoadApproval(registryManifests(), {
      dataset_id: DATASET_ID, tenant_key: tenantKey, move_id: move.id,
      assessment_id: move.id, source_set_hash: source.sourceHash,
      object_count: source.files.length, ingestion_method: "operator_aca_job",
    });
    if (!approval.approved) throw new Error(`Move-scoped load authorization refused: ${approval.reasons.join("; ")}`);
    if (approval.approval.release_record !== config.releaseRecord) throw new Error("Release record binding differs from committed approval");
    await checkpoint("02-move-scoped-load-approval-verified");

    stage = "policy-and-existing-state";
    const governedByFamily = new Map<string, Record<string, unknown>>();
    for (const file of source.files) {
      const id = stableUuid(DATASET_ID, move.id, source.sourceHash, file.familyKey, "evidence");
      const governed = {
        id, tenant_id: move.client_id, client_key: canonicalTenantKey, object_type: "program_evidence_item",
        source_layer: "uploaded_evidence", industry: null, enterprise_area: "back_office",
        function: "HR analytics", process_area: null, use_case_category: "data_foundation",
        strategic_move_phase_applicability: ["P2"], applicable_agents: [],
        source_basis: "Fictional synthetic scenario for a delegated Moves smoke test; not client-attested",
        source_references: [`${file.path}#sha256=${file.sha256}`], classification: "internal",
        compliance_basis: null, agent_readiness_status: "not_reviewed", retrievability: "not_indexed",
        confidence_level: "unverified", confidence_rationale: "Synthetic test input; no client attestation",
        cited_render_verified_at: null, last_reviewed_at: null, owner: "AbarVa Moves product team",
        data_domains: [], required_kpis: [], baseline_requirements: [], measurement_method: null,
        value_levers: [], known_failure_modes: [], guardrails: [], human_in_loop_controls: ["Evidence review before approval"],
        allowed_agent_actions: [], blocked_agent_actions: ["Use pending evidence for generation"],
        provenance: { source_file: file.path, ingestion_run_id: config.runId, parse_method: "exact_utf8_fixture", committed_at: null, indexed_at: null, index_name: null },
        policy_version: POLICY_VERSION, contract_hash: source.sourceHash, created_at: null, updated_at: null,
      };
      const policy = evaluateGovernedObject(governed);
      if (policy.decision === "block" || policy.agentReady) throw new Error(`Governed object policy refused pending file ${file.familyKey}: ${policy.errors.join("; ")}`);
      governedByFamily.set(file.familyKey, governed);
    }
    const existing = await client.query<{ id: string; family_key: string; decision: string; source_ref: Record<string, unknown>; evidence_id: string }>(
      `SELECT r.id, r.family_key, r.decision, r.source_ref, r.evidence_id
         FROM program_evidence_reviews r WHERE r.program_id = $1::uuid AND r.tenant_key = $2`, [move.id, tenantKey]);
    const other = existing.rows.filter((row) => row.source_ref?.governance_dataset_id !== DATASET_ID);
    if (other.length) throw new Error("Move has unrelated evidence reviews; refusing to mix this smoke load with another source set");
    if (existing.rows.length > 0 && existing.rows.length !== source.files.length) throw new Error("Partial prior load requires investigation before retry");
    for (const row of existing.rows) {
      const file = source.files.find((candidate) => candidate.familyKey === row.family_key);
      if (!file || row.decision !== "pending" || row.evidence_id !== stableUuid(DATASET_ID, move.id, source.sourceHash, file.familyKey, "evidence") ||
          row.id !== stableUuid(DATASET_ID, move.id, source.sourceHash, file.familyKey, "review") ||
          row.source_ref?.source_set_hash !== source.sourceHash || row.source_ref?.source_file_sha256 !== file.sha256) {
        throw new Error("Prior review row does not match the exact pending source set");
      }
    }
    const crossTenantEvidence = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM program_evidence_items WHERE program_id = $1::uuid AND tenant_key <> $2`, [move.id, tenantKey]);
    const crossTenantReviews = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM program_evidence_reviews WHERE program_id = $1::uuid AND tenant_key <> $2`, [move.id, tenantKey]);
    if (Number(crossTenantEvidence.rows[0]?.count ?? 0) !== 0 || Number(crossTenantReviews.rows[0]?.count ?? 0) !== 0) {
      throw new Error("Move evidence contains another tenant key; refusing to load");
    }
    const evidenceCount = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM program_evidence_items WHERE program_id = $1::uuid AND tenant_key = $2`, [move.id, tenantKey]);
    if (Number(evidenceCount.rows[0]?.count ?? 0) !== existing.rows.length) throw new Error("Evidence/review count mismatch before load");
    await checkpoint("03-policy-and-existing-state-verified");

    stage = "pending-evidence-write";
    let inserted = 0;
    if (existing.rows.length === 0) {
      for (const file of source.files) {
        const evidenceId = stableUuid(DATASET_ID, move.id, source.sourceHash, file.familyKey, "evidence");
        const reviewId = stableUuid(DATASET_ID, move.id, source.sourceHash, file.familyKey, "review");
        const sourceRef = {
          governance_dataset_id: DATASET_ID, source_set_hash: source.sourceHash,
          source_file: file.path, source_file_sha256: file.sha256,
          filename: path.basename(file.path), title: file.title,
          mime_type: file.path.endsWith(".csv") ? "text/csv" : "text/markdown",
          parse_method: "exact_utf8_fixture", confidence: 1,
          evidence_type: file.evidenceType, synthetic: true, client_attested: false,
        };
        await client.query(
          `INSERT INTO program_evidence_items
             (id, tenant_key, program_id, attachment_id, phase, step_id, evidence_type,
              title, summary, extracted_text, extracted_structured, confidence, created_by_user_id)
           VALUES ($1::uuid, $2, $3::uuid, NULL, 2, $4, 'uploaded_evidence',
                   $5, $6, $7, $8::jsonb, 1, $9)`,
          [evidenceId, tenantKey, move.id, `current-state:${file.familyKey}`, file.title,
           `SYNTHETIC - NOT CLIENT-ATTESTED. Pending review for ${file.familyKey}.`, file.text,
           JSON.stringify({ synthetic: true, client_attested: false, governance_dataset_id: DATASET_ID, source_set_hash: source.sourceHash,
             source_file: file.path, source_file_sha256: file.sha256, agent_readiness_status: "not_reviewed", retrievability: "not_indexed",
             governance: governedByFamily.get(file.familyKey),
             flexible: { citations: [{ quote: "SYNTHETIC - NOT CLIENT-ATTESTED", locator: file.path }] } }),
           config.operatorIdentity],
        );
        await client.query(
          `INSERT INTO program_evidence_reviews
             (id, tenant_key, program_id, evidence_id, family_key, archetype_id, phase,
              decision, auto_promoted, rationale, source_ref, submitted_by_user_id,
              reviewed_by_user_id, reviewed_at)
           VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, $6, 2,
                   'pending', false, $7, $8::jsonb, $9, NULL, NULL)`,
          [reviewId, tenantKey, move.id, evidenceId, file.familyKey, TARGET_ARCHETYPE,
           "Delegated automated smoke-test load of synthetic, non-client-attested evidence; human review pending.",
           JSON.stringify(sourceRef), config.operatorIdentity],
        );
        inserted += 1;
      }
    }
    await checkpoint("04-pending-evidence-written");

    stage = "transaction-readback";
    const readback = await client.query<{ family_key: string; decision: string; auto_promoted: boolean; reviewed_at: string | null; count: string; evidence_count: string }>(
      `SELECT r.family_key, r.decision, r.auto_promoted, r.reviewed_at,
              count(*)::text AS count, count(e.id)::text AS evidence_count
         FROM program_evidence_reviews r
         JOIN program_evidence_items e ON e.id = r.evidence_id
        WHERE r.program_id = $1::uuid AND r.tenant_key = $2
        GROUP BY r.family_key, r.decision, r.auto_promoted, r.reviewed_at
        ORDER BY r.family_key`, [move.id, tenantKey]);
    const counts = Object.fromEntries(readback.rows.map((row) => [row.family_key, Number(row.count)]));
    if (JSON.stringify(Object.keys(counts).sort()) !== JSON.stringify([...EXPECTED_FAMILIES].sort()) ||
        readback.rows.some((row) => row.decision !== "pending" || row.auto_promoted || row.reviewed_at !== null || Number(row.count) !== 1 || Number(row.evidence_count) !== 1)) {
      throw new Error("Transactional readback did not show exactly one unreviewed pending item per required family");
    }
    await client.query("COMMIT");
    transactionStarted = false;
    committed = true;
    await checkpoint("05-transaction-committed-and-pending-readback-passed");

    stage = "post-commit-readback";
    const after = await client.query<{ family_key: string; decision: string; count: string; source_hash: string; readiness: string; reviewer_count: string }>(
      `SELECT r.family_key, r.decision, count(*)::text AS count,
              min(e.extracted_structured->>'source_set_hash') AS source_hash,
              min(e.extracted_structured->>'agent_readiness_status') AS readiness,
              count(r.reviewed_at)::text AS reviewer_count
         FROM program_evidence_reviews r JOIN program_evidence_items e ON e.id = r.evidence_id
        WHERE r.program_id = $1::uuid AND r.tenant_key = $2 AND e.program_id = $1::uuid AND e.tenant_key = $2
        GROUP BY r.family_key, r.decision ORDER BY r.family_key, r.decision`, [move.id, tenantKey]);
    if (after.rows.length !== 11 || after.rows.some((row) => row.decision !== "pending" || Number(row.count) !== 1 ||
        row.source_hash !== source.sourceHash || row.readiness !== "not_reviewed" || Number(row.reviewer_count) !== 0)) {
      throw new Error("Independent post-commit readback did not show 11 pending review rows");
    }
    const phase = await client.query<{ current_phase: number }>("SELECT current_phase FROM engagements WHERE id = $1::uuid", [move.id]);
    if (phase.rows[0]?.current_phase !== 1) throw new Error("Move phase changed during evidence load");
    await checkpoint("06-post-commit-readback-passed");

    stage = "proof-writing";
    const finishedAt = new Date().toISOString();
    const validation = { status: "PASS", move_id: move.id, tenant_key: tenantKey, canonical_tenant_key: canonicalTenantKey, blueprint_id: TARGET_ARCHETYPE,
      source_set_hash: source.sourceHash, inserted, idempotent_retry: inserted === 0,
      total_evidence_items: 11, total_pending_reviews: 11,
      counts_by_family: counts, current_phase: phase.rows[0]?.current_phase,
      approved_reviews: 0, rejected_reviews: 0, agent_ready_claim: false };
    const qualityGate = { status: "PASS", move_registry_tenant_authenticated: true,
      load_approval_move_bound: true, source_hash_verified: true, policy_preflight_passed: true,
      pending_review_only: true, no_phase_transition: true, no_approval: true };
    const proofUri = store.uriFor(`${prefix}/proof.json`);
    const validationUri = store.uriFor(`${prefix}/validation.json`);
    const qualityUri = store.uriFor(`${prefix}/quality-gate.json`);
    await writeJsonOnce(store, `${prefix}/validation.json`, validation);
    await writeJsonOnce(store, `${prefix}/quality-gate.json`, qualityGate);
    await writeJsonOnce(store, `${prefix}/proof.json`, {
      job_name: JOB_NAME, run_id: config.runId, tenant_scope: tenantKey,
      build_version: config.buildVersion, input_source_version: source.sourceHash,
      idempotency_key: config.idempotencyKey, started_at: startedAt, finished_at: finishedAt,
      operator_identity: config.operatorIdentity, git_sha: config.gitSha,
      image: config.image, image_digest: config.imageDigest, status: "succeeded",
      retry_count: config.retryCount, timeout_seconds: config.timeoutSeconds,
      proof_container: PROOF_CONTAINER, blob_proof_bundle: proofUri,
      validation_output: validationUri, quality_gate_output: qualityUri,
      release_record: config.releaseRecord, progress, validation, quality_gate: qualityGate,
    });
    console.log(JSON.stringify({ event: "moves_gdf_pending_load_proof", run_id: config.runId,
      status: "succeeded", blob_proof_bundle: proofUri, validation_output: validationUri,
      quality_gate_output: qualityUri, counts_by_family: counts, inserted, tenant_scope: tenantKey }));
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "unknown operator job error";
    const failure = { job_name: JOB_NAME, run_id: config.runId, tenant_scope: config.expectedTenantKey,
      build_version: config.buildVersion, input_source_version: source.sourceHash,
      idempotency_key: config.idempotencyKey, started_at: startedAt, finished_at: new Date().toISOString(),
      operator_identity: config.operatorIdentity, git_sha: config.gitSha, image: config.image,
      image_digest: config.imageDigest, status: "failed", retry_count: config.retryCount,
      timeout_seconds: config.timeoutSeconds, failed_stage: stage, error: message,
      mutation_committed: committed, release_record: config.releaseRecord, progress };
    await writeJsonOnce(store, `${prefix}/failure.json`, failure).catch(() => undefined);
    console.error(JSON.stringify({ event: "moves_gdf_pending_load_proof", status: "failed", run_id: config.runId,
      failed_stage: stage, mutation_committed: committed, error: message }));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

void main().catch((error) => {
  console.error(JSON.stringify({ event: "moves_gdf_pending_load_proof", status: "failed_before_start",
    error: error instanceof Error ? error.message : "unknown operator job error" }));
  process.exitCode = 1;
});
