#!/usr/bin/env tsx

/** Private ACA operator entrypoint. No web route or direct API load path. */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AssumptionRecord } from "../../../src/lib/programs/assumption-register/model";
import type { TenancyCtx } from "../../../src/lib/programs/types.db";
import {
  APPLY_CONFIRMATION, JOB_NAME, loadManifests, PROOF_PREFIX, RELEASE_RECORD,
  runDenialsSeedJob, type DenialsJobBinding, type JobArgs, type JobDeps,
  type JobProof, type LiveScope,
} from "./seed-job";
import { readExactProposal, SEED_DATASET_ID, sourceSetSha256 } from "./seed-contract";

interface RunnerArgs extends JobArgs {
  databaseUrl: string;
  timeoutSeconds: number;
  storageAccount: string | null;
  storageIdentityClientId: string | null;
  outDir: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{64}$/;

export function parseArgs(env: Record<string, string | undefined> = process.env): RunnerArgs {
  const required = (key: string): string => {
    const value = env[key]?.trim();
    if (!value) throw new Error(`${key}_required`);
    return value;
  };
  const mode = required("MOVES_DENIALS_SEED_MODE");
  if (mode !== "preflight" && mode !== "dry_run" && mode !== "apply")
    throw new Error("denials_seed_mode_invalid");
  const moveId = required("MOVES_DENIALS_SEED_MOVE_ID");
  const operatorPersonId = required("MOVES_DENIALS_SEED_OPERATOR_PERSON_ID");
  const operatorClerkId = required("MOVES_DENIALS_SEED_OPERATOR_CLERK_ID");
  const sourceHash = required("MOVES_DENIALS_SEED_SOURCE_SET_SHA256");
  const buildVersion = required("MOVES_DENIALS_SEED_BUILD_VERSION");
  const imageDigest = required("MOVES_DENIALS_SEED_IMAGE_DIGEST");
  const runId = required("MOVES_DENIALS_SEED_RUN_ID");
  const databaseUrl = required("DATABASE_URL");
  if (!UUID.test(moveId) || !UUID.test(operatorPersonId) ||
    !operatorClerkId.startsWith("user_") || !SHA.test(sourceHash) ||
    !/^[0-9a-f]{40}$/.test(buildVersion) || !/^sha256:[0-9a-f]{64}$/.test(imageDigest) ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]{5,80}$/.test(runId))
    throw new Error("denials_seed_job_identity_or_version_invalid");
  const host = new URL(databaseUrl).hostname.toLowerCase();
  if (!host.endsWith(".postgres.database.azure.com") &&
    !/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host))
    throw new Error("denials_seed_non_azure_database_refused");
  if (required("MOVES_DENIALS_SEED_TENANT_KEY") !== "meridian-health" ||
    required("MOVES_DENIALS_SEED_RETRY_COUNT") !== "0")
    throw new Error("denials_seed_scope_or_retry_policy_invalid");
  const timeoutSeconds = Number(required("MOVES_DENIALS_SEED_TIMEOUT_SECONDS"));
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > 7200)
    throw new Error("denials_seed_timeout_invalid");
  const bindingJson = env.MOVES_DENIALS_SEED_BINDING_JSON?.trim();
  const binding = bindingJson ? JSON.parse(bindingJson) as DenialsJobBinding : null;
  const idempotencyKey = env.MOVES_DENIALS_SEED_IDEMPOTENCY_KEY?.trim() || null;
  if (mode !== "preflight" && (!binding || !idempotencyKey))
    throw new Error("denials_seed_bound_preflight_and_idempotency_required");
  const confirmation = env.MOVES_DENIALS_SEED_CONFIRMATION?.trim() || null;
  const storageAccount = env.AZURE_STORAGE_ACCOUNT_NAME?.trim() || null;
  const storageIdentityClientId = env.ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID?.trim() || null;
  if (mode === "apply" && (confirmation !== APPLY_CONFIRMATION ||
    !storageAccount || !storageIdentityClientId))
    throw new Error("denials_seed_apply_confirmation_or_blob_target_required");
  return {
    mode, moveId, operatorClerkId, operatorPersonId,
    approvalRef: required("MOVES_DENIALS_SEED_APPROVAL_REFERENCE"),
    sourceHash, idempotencyKey, binding, confirmation, runId, buildVersion,
    imageDigest, databaseUrl, timeoutSeconds, storageAccount, storageIdentityClientId,
    outDir: path.join(env.MOVES_DENIALS_SEED_OUT_PARENT ?? "/tmp",
      `moves-denials-register-seed-${runId}`),
  };
}

async function readLiveScope(moveId: string, operatorPersonId: string): Promise<LiveScope> {
  const { getAzureWriteFluentClient } = await import("../../../src/lib/data-plane/postgresCompat");
  const { listAssumptions } = await import("../../../src/lib/programs/assumption-register/store");
  const db = getAzureWriteFluentClient();
  const readOne = async (table: string, columns: string, column: string, value: string) => {
    const { data, error } = await db.from(table).select(columns).eq(column, value).maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  };
  const readMany = async (table: string, columns: string, column: string, value: string) => {
    const { data, error } = await db.from(table).select(columns).eq(column, value);
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  };
  const move = await readOne("engagements",
    "id,client_id,name,current_phase,created_at,updated_at,deleted_at", "id", moveId);
  const client = move?.client_id
    ? await readOne("clients", "id,tenant_key,slug", "id", String(move.client_id)) : null;
  const person = await readOne("persons", "id,email,graph_node_id,primary_role", "id", operatorPersonId);
  const memberships = await readMany("person_client_memberships",
    "client_id,access_level,can_admin_users", "person_id", operatorPersonId);
  const participants = (await readMany("engagement_participants",
    "user_id,program_access_level,can_approve_phase_gates", "engagement_id", moveId))
    .filter((row) => row.user_id === operatorPersonId);
  const originations = (await readMany("module_state_log",
    "changed_by_user_id,module_key,new_state", "engagement_id", moveId))
    .filter((row) => row.module_key === "origination" && row.new_state === "completed");
  const auditRows = (await readMany("admin_audit_log",
    "client_id,action,metadata,target_id", "target_id", operatorPersonId))
    .filter((row) => row.action === "synthetic_e2e_operator.identity_bound" &&
      row.client_id === move?.client_id);
  const events = await readMany("move_assumption_events",
    "assumption_id,actor_user_id,actor_kind,event_type", "program_id", moveId);
  const ctx: TenancyCtx = { clientId: String(move?.client_id ?? ""), clientKey: "meridian",
    userId: operatorPersonId };
  const registerRows = move ? await listAssumptions(ctx, moveId) : [];
  return {
    move: move ? {
      id: String(move.id), clientId: String(move.client_id), name: String(move.name),
      currentPhase: Number(move.current_phase), createdAt: String(move.created_at),
      updatedAt: String(move.updated_at), deletedAt: move.deleted_at == null ? null : String(move.deleted_at),
    } : null,
    clientTenantKey: client?.tenant_key == null ? null : String(client.tenant_key),
    clientSlug: client?.slug == null ? null : String(client.slug),
    person: person ? { id: String(person.id),
      email: person.email == null ? null : String(person.email),
      graphNodeId: person.graph_node_id == null ? null : String(person.graph_node_id),
      primaryRole: person.primary_role == null ? null : String(person.primary_role) } : null,
    memberships: memberships.map((row) => ({ clientId: String(row.client_id),
      accessLevel: String(row.access_level), canAdminUsers: row.can_admin_users === true })),
    participants: participants.map((row) => ({ userId: String(row.user_id),
      accessLevel: String(row.program_access_level), canApproveGates: row.can_approve_phase_gates === true })),
    originationActorIds: originations.map((row) => String(row.changed_by_user_id ?? "")),
    identityApprovalRefs: auditRows.map((row) => {
      const metadata = row.metadata as Record<string, unknown> | null;
      return typeof metadata?.approvalRef === "string" ? metadata.approvalRef : "";
    }),
    registerRows: registerRows as AssumptionRecord[],
    creationEvents: events.map((row) => ({ assumptionId: String(row.assumption_id),
      actorUserId: String(row.actor_user_id), actorKind: String(row.actor_kind),
      eventType: String(row.event_type) })),
  };
}

function makeDeps(args: RunnerArgs): JobDeps {
  return {
    readLive: readLiveScope,
    manifests: loadManifests(),
    async create(ctx, moveId, input, actor, options) {
      const { createAssumption } = await import("../../../src/lib/programs/assumption-register/store");
      return createAssumption(ctx, moveId, input, actor, options);
    },
    async withTransaction(moveId, work) {
      const { withAzureWriteTransaction } = await import("../../../src/lib/data-plane/postgresCompat");
      return withAzureWriteTransaction(args.databaseUrl, async (query) => {
        const move = await query("SELECT id FROM engagements WHERE id = $1 FOR UPDATE", [moveId]);
        if (move.rowCount !== 1) throw new Error("denials_move_lock_missing");
        await query("SELECT id FROM move_assumptions WHERE program_id = $1 FOR UPDATE", [moveId]);
        await query("SELECT id FROM engagement_participants WHERE engagement_id = $1 FOR UPDATE", [moveId]);
        return work();
      });
    },
  };
}

function writeProofBundle(outDir: string, proof: Record<string, unknown>,
  status: "succeeded" | "failed", startedAtUtc: string, timeoutSeconds: number): void {
  mkdirSync(outDir, { recursive: true });
  const file = (name: string, body: Record<string, unknown>) =>
    writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
  const finishedAtUtc = new Date().toISOString();
  file("proof-manifest.json", { schemaVersion: 1, status, startedAtUtc,
    finishedAtUtc, retryCount: 0, timeoutSeconds,
    validationOutput: "validation.json", qualityGateOutput: "quality-gate.json",
    progressOutput: "progress.json", ...proof });
  file("progress.json", { status, runId: proof.runId, jobName: JOB_NAME,
    retryCount: 0, startedAtUtc, finishedAtUtc });
  file("validation.json", { status, moveId: proof.moveId,
    sourceSetHash: proof.sourceSetHash, postcommitReadback: proof.postcommitReadback ?? "unavailable" });
  const modePassed = proof.mode === "preflight"
    ? proof.qualityGate === "preflight_only"
    : proof.mode === "dry_run" ? proof.qualityGate === "dry_run_only"
      : proof.qualityGate === "passed" && proof.blobProofLocation != null;
  file("quality-gate.json", { passed: status === "succeeded" && modePassed,
    mode: proof.mode, applyBlocked: proof.mode !== "apply",
    committed: proof.committed ?? "unknown", reason: proof.error ?? null });
  const parent = path.dirname(outDir);
  const base = path.basename(outDir);
  const tarPath = path.join(parent, `${base}.tgz`);
  const tar = spawnSync("tar", ["-czf", tarPath, "-C", parent, base], { encoding: "utf8" });
  if (tar.status !== 0) throw new Error(tar.stderr || "denials_proof_bundle_failed");
  const encoded = readFileSync(tarPath).toString("base64");
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  for (let i = 0; i < encoded.length; i += 7600) console.log(encoded.slice(i, i + 7600));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
  console.log(`__MOVES_DENIALS_SEED_PROOF_SUMMARY__${JSON.stringify({
    status, runId: proof.runId, mode: proof.mode, moveId: proof.moveId,
    sourceSetHash: proof.sourceSetHash, committed: proof.committed,
    postcommitReadback: proof.postcommitReadback,
    blobProofLocation: proof.blobProofLocation ?? null,
    error: proof.error ?? null,
  })}`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--seed-hash")) {
    console.log(JSON.stringify({ datasetId: SEED_DATASET_ID,
      proposalSha256: readExactProposal().sha256,
      sourceSetSha256: sourceSetSha256(), objectCount: 22,
      applyCapability: "blocked_until_fresh_move_and_exact_named_load_approval" }, null, 2));
    return;
  }
  const args = parseArgs();
  const startedAtUtc = new Date().toISOString();
  let proof: JobProof | null = null;
  try {
    // Resolve the Blob target before any apply write. A failed proof write after
    // commit remains a failed job with explicit committed state and no retry.
    const store = args.mode === "apply"
      ? await (await import("../../ecl/synthetic_enterprise_home_job"))
        .blobProofStore(args.storageAccount!, args.storageIdentityClientId!,
          { statementTimeoutMs: 60000, lockTimeoutMs: 15000, proofStoreTimeoutMs: 30000 })
      : null;
    proof = await runDenialsSeedJob(args, makeDeps(args));
    if (store) {
      const blobPath = `${PROOF_PREFIX}/${args.runId}/proof.json`;
      const saved = await store.writeOnce(blobPath, Buffer.from(`${JSON.stringify(proof, null, 2)}\n`));
      if (!saved.created) throw new Error("denials_proof_blob_already_exists_no_retry");
      proof.blobProofLocation = saved.uri;
    }
    writeProofBundle(args.outDir, proof as unknown as Record<string, unknown>, "succeeded",
      startedAtUtc, args.timeoutSeconds);
  } catch (error) {
    process.exitCode = 1;
    const { writeTransactionOutcome } = await import("../../../src/lib/data-plane/postgresCompat");
    const failure: Record<string, unknown> = {
      event: "moves_denials_register_seed_failure", mode: args.mode, jobName: JOB_NAME,
      runId: args.runId, buildVersion: args.buildVersion, imageDigest: args.imageDigest,
      moveId: args.moveId, operatorClerkId: args.operatorClerkId,
      operatorPersonId: args.operatorPersonId, sourceSetHash: args.sourceHash,
      idempotencyKey: args.idempotencyKey, releaseRecord: RELEASE_RECORD,
      committed: proof?.committed ?? "unknown; inspect live readback before any new run",
      transactionOutcome: writeTransactionOutcome(error),
      postcommitReadback: proof?.postcommitReadback ?? "unavailable",
      qualityGate: "failed", actualWrites: proof?.actualWrites ?? "unknown",
      error: error instanceof Error ? error.message : String(error),
    };
    writeProofBundle(args.outDir, failure, "failed", startedAtUtc, args.timeoutSeconds);
  }
}

if (process.argv[1]?.endsWith("seed-job-runner.ts")) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
