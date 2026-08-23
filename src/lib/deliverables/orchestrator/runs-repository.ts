// Deliverable runs repository — async status ledger access.
//
// Tracks board-grade generation runs in Postgres so the multi-replica app can poll a
// run's status across replicas. The DB client is injectable so the mapping is unit-
// tested without the data plane.

import "server-only";
import { randomUUID } from "node:crypto";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  createTxSession,
  type SqlRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import type { GenerationMode } from "@/lib/programs/assert-phase-ready";
import type { AdaptiveDepthDecision } from "@/lib/deliverables/adaptive-depth";

export type DeliverableRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "blocked"
  | "failed";

/**
 * The full job payload persisted on the run row so the worker can reconstruct the
 * generation input from the row alone (the web replica that enqueued it may be gone).
 * Mirrors the non-identity fields of GenerateDeliverableServiceInput; clientId/tenantKey/
 * userId live in dedicated columns.
 */
export interface OrchestratorDeliverableRunJobPayload {
  kind?: "orchestrator_deliverable";
  module: string;
  useCaseArchetype: string;
  /** Canonical deliverables_v2 registry key when it differs from the orchestrator type. */
  deliverableTypeKey?: string;
  deliverableType: string;
  audience?: string[];
  decisionContext: string;
  /** Human-approved P3 option, bound separately so structured generation cannot omit it. */
  approvedSolutionApproach?: string;
  /** Immutable decision/context lineage captured at queue time and revalidated by the worker. */
  decisionLineage?: {
    decisionHash: string;
    decisionVersion: string;
    approvedOptionId: string;
    approvedOptionVersion: string;
    contextSnapshotHash: string;
    architectureModelVersion: string;
  };
  clientDisplayName: string;
  initiativeDisplayName: string;
  sourceArtifactRef: string;
  evidenceQuery?: string;
  outputFormats?: string[];
  adaptiveDepth?: AdaptiveDepthDecision;
  model?: string;
}

export interface MovesPremiumArtifactRunJobPayload {
  kind: "moves_premium_artifact";
  module: "moves";
  useCaseArchetype: string;
  deliverableType: string;
  decisionContext: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  sourceArtifactRef: string;
  phase: number;
  artifact: DeliverableKey;
  generationMode: GenerationMode;
  title?: string;
  useCaseQuery?: string;
  model?: string;
}

export type DeliverableRunJobPayload =
  | OrchestratorDeliverableRunJobPayload
  | MovesPremiumArtifactRunJobPayload;

export interface DeliverableRunRecord {
  id: string;
  clientId: string;
  tenantKey: string;
  userId: string;
  module: string;
  archetype: string;
  deliverableType: string;
  status: DeliverableRunStatus;
  artifactId: string | null;
  sectionCount: number | null;
  retrievedEvidence: number | null;
  blockers: string[];
  warnings: string[];
  error: string | null;
  /** 0..100 progress of the multi-pass generation; null until the first pass completes. */
  progressPct: number | null;
  /** human-facing label for the pass now in flight (e.g. "Pressure-testing for gaps"). */
  progressLabel: string | null;
  /** lease bookkeeping: when the current worker last claimed/heartbeat this run. */
  claimedAt: string | null;
  /** id of the worker process that holds the lease (hostname+pid+ts). */
  workerId: string | null;
  /** self-contained job payload the worker runs the generation from. */
  jobPayload: DeliverableRunJobPayload | null;
  batchId: string | null;
  sequenceNo: number | null;
  dependsOnRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRunInput {
  clientId: string;
  tenantKey: string;
  userId: string;
  module: string;
  archetype: string;
  deliverableType: string;
  jobPayload: DeliverableRunJobPayload;
}

export interface CompleteRunInput {
  status: "succeeded" | "blocked" | "failed";
  artifactId?: string | null;
  sectionCount?: number | null;
  retrievedEvidence?: number | null;
  blockers?: string[];
  warnings?: string[];
  error?: string | null;
}

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

/**
 * Raw-SQL runner for the atomic claim/sweep statements that the fluent client cannot
 * express (`FOR UPDATE SKIP LOCKED`, `RETURNING`). Backed by the write-side transaction
 * session (`createTxSession` — opens one pg connection, wraps the body in BEGIN/COMMIT,
 * ROLLBACKs on throw). Injectable so the claim/sweep are unit-tested without the data plane.
 */
export type RawSqlRunner = <R = Record<string, unknown>>(
  fn: (run: SqlRunner) => Promise<R>,
) => Promise<R>;

const defaultRawSql: RawSqlRunner = createTxSession(
  "abarva-deliverable-runs-claim",
);

function parsePayload(value: unknown): DeliverableRunJobPayload | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as DeliverableRunJobPayload;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as DeliverableRunJobPayload;
  return null;
}

function rowToRecord(row: Record<string, unknown>): DeliverableRunRecord {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    tenantKey: String(row.tenant_key),
    userId: String(row.user_id),
    module: String(row.module),
    archetype: String(row.archetype),
    deliverableType: String(row.deliverable_type),
    status: row.status as DeliverableRunStatus,
    artifactId: row.artifact_id ? String(row.artifact_id) : null,
    sectionCount:
      row.section_count === null || row.section_count === undefined
        ? null
        : Number(row.section_count),
    retrievedEvidence:
      row.retrieved_evidence === null || row.retrieved_evidence === undefined
        ? null
        : Number(row.retrieved_evidence),
    blockers: arr(row.blockers),
    warnings: arr(row.warnings),
    error: typeof row.error === "string" ? row.error : null,
    progressPct:
      row.progress_pct === null || row.progress_pct === undefined
        ? null
        : Number(row.progress_pct),
    progressLabel:
      typeof row.progress_label === "string" ? row.progress_label : null,
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
    workerId: typeof row.worker_id === "string" ? row.worker_id : null,
    jobPayload: parsePayload(row.job_payload),
    batchId: row.batch_id ? String(row.batch_id) : null,
    sequenceNo:
      row.sequence_no === null || row.sequence_no === undefined
        ? null
        : Number(row.sequence_no),
    dependsOnRunId: row.depends_on_run_id
      ? String(row.depends_on_run_id)
      : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export interface SequentialRunInput extends CreateRunInput {
  sequenceNo: number;
}

/** Insert a complete ordered generation batch in one statement; Postgres commits all rows or none. */
export async function createSequentialDeliverableRunBatch(
  inputs: SequentialRunInput[],
  opts: { idempotencyKey: string; db?: DbClient },
): Promise<DeliverableRunRecord[]> {
  if (!inputs.length) return [];
  const db = opts.db ?? getAzureWriteFluentClient();
  const batchId = randomUUID();
  const ids = inputs.map(() => randomUUID());
  const rows = inputs.map((input, index) => ({
    id: ids[index],
    client_id: input.clientId,
    tenant_key: input.tenantKey,
    user_id: input.userId,
    module: input.module,
    archetype: input.archetype,
    deliverable_type: input.deliverableType,
    status: "queued",
    job_payload: input.jobPayload,
    batch_id: batchId,
    sequence_no: input.sequenceNo,
    depends_on_run_id: index > 0 ? ids[index - 1] : null,
    idempotency_key: opts.idempotencyKey,
  }));
  const { data, error } = await db
    .from("deliverable_runs")
    .insert(rows)
    .select("*");
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      const { data: existing, error: readError } = await db
        .from("deliverable_runs")
        .select("*")
        .eq("client_id", inputs[0].clientId)
        .eq("idempotency_key", opts.idempotencyKey)
        .order("sequence_no", { ascending: true });
      if (!readError && existing?.length === inputs.length) {
        return (existing as Array<Record<string, unknown>>).map(rowToRecord);
      }
    }
    throw new Error(`deliverable_runs batch insert failed: ${error.message}`);
  }
  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(rowToRecord)
    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0));
}

export async function createDeliverableRun(
  input: CreateRunInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<DeliverableRunRecord> {
  const { data, error } = await db
    .from("deliverable_runs")
    .insert({
      client_id: input.clientId,
      tenant_key: input.tenantKey,
      user_id: input.userId,
      module: input.module,
      archetype: input.archetype,
      deliverable_type: input.deliverableType,
      // Enqueue only — the durable worker (process-deliverable-queue) claims and runs it.
      // No model work happens in the request, so a recycled web replica cannot orphan it.
      status: "queued",
      job_payload: input.jobPayload,
    })
    .select("*")
    .single();
  if (error)
    throw new Error(`deliverable_runs insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}

/**
 * Atomically claim the next runnable row for `workerId`. A row is runnable when it is
 * 'queued' OR it is 'running' but its lease went stale (claimed_at older than the lease
 * window — the previous worker died mid-run). The claim is a single UPDATE … WHERE id =
 * (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1) so two concurrent workers can never grab the
 * same row: SKIP LOCKED makes the loser's sub-select skip the row the winner row-locked,
 * and it falls through to the next candidate (or null). Returns the claimed row (with
 * job_payload) or null when the queue is empty.
 */
export async function claimNextDeliverableRun(
  workerId: string,
  opts: { leaseMinutes?: number; rawSql?: RawSqlRunner } = {},
): Promise<DeliverableRunRecord | null> {
  const leaseMinutes = opts.leaseMinutes ?? 5;
  const rawSql = opts.rawSql ?? defaultRawSql;
  const sql = `
    UPDATE deliverable_runs
       SET status = 'running',
           claimed_at = now(),
           worker_id = $1,
           updated_at = now()
     WHERE id = (
       SELECT r.id FROM deliverable_runs r
        WHERE (
          r.status = 'queued'
          AND (
            r.depends_on_run_id IS NULL
            OR EXISTS (
              SELECT 1 FROM deliverable_runs predecessor
               WHERE predecessor.id = r.depends_on_run_id
                 AND predecessor.client_id = r.client_id
                 AND predecessor.tenant_key = r.tenant_key
                 AND predecessor.status = 'succeeded'
                 AND predecessor.artifact_id IS NOT NULL
            )
          )
        ) OR (r.status = 'running' AND r.claimed_at < now() - ($2 || ' minutes')::interval)
        ORDER BY r.created_at, r.sequence_no NULLS FIRST
        FOR UPDATE SKIP LOCKED
        LIMIT 1
     )
    RETURNING *`;
  const rows = await rawSql((run) =>
    run<Record<string, unknown>>(sql, [workerId, String(leaseMinutes)]),
  );
  const row = Array.isArray(rows) ? rows[0] : undefined;
  return row ? rowToRecord(row) : null;
}

/**
 * Keep a long-but-alive run from being reclaimed: bump its lease (claimed_at) on each
 * progress update. Scoped to the holding worker so a reclaimer that already took over
 * cannot have its lease pushed by a zombie. Best-effort — callers should swallow errors.
 */
export async function heartbeatDeliverableRun(
  id: string,
  workerId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const { error } = await db
    .from("deliverable_runs")
    .update({
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("worker_id", workerId);
  if (error)
    throw new Error(`deliverable_runs heartbeat failed: ${error.message}`);
}

/**
 * Hard deadline reaper: fail runs that are genuinely stuck, never healthy pending work.
 *
 * Two different conditions, two different bounds — collapsing them is a bug:
 *  • RUNNING: a claimed run whose heartbeat (`updated_at`, bumped each progress pass) is
 *    older than `deadlineMinutes` ⇒ its worker died mid-run ⇒ reclaim it.
 *  • QUEUED: NOT stuck — it is waiting for a worker slot. A backlog larger than one
 *    worker batch (or several phases enqueued at once) can legitimately sit queued far
 *    longer than `deadlineMinutes` before a serial worker reaches it. Reaping it on the
 *    running-deadline marks healthy pending work as "failed" even though a worker would
 *    have processed it. Queued runs only get reclaimed at a much longer abandonment bound
 *    (`queuedDeadlineMinutes`, default 6h) — i.e. a queue entry no worker ever came for.
 *
 * The worker runs this once at the start of each invocation. Returns the ids it reclaimed.
 */
export async function sweepStaleDeliverableRuns(
  deadlineMinutes = 15,
  opts: { rawSql?: RawSqlRunner; queuedDeadlineMinutes?: number } = {},
): Promise<string[]> {
  const rawSql = opts.rawSql ?? defaultRawSql;
  const queuedDeadlineMinutes = opts.queuedDeadlineMinutes ?? 360;
  const sql = `
    UPDATE deliverable_runs
       SET status = 'failed',
           error = 'reclaimed: worker did not complete within deadline',
           updated_at = now()
     WHERE (status = 'running' AND updated_at < now() - ($1 || ' minutes')::interval)
        OR (status = 'queued' AND depends_on_run_id IS NULL AND updated_at < now() - ($2 || ' minutes')::interval)
    RETURNING id`;
  const rows = await rawSql((run) =>
    run<{ id: string }>(sql, [
      String(deadlineMinutes),
      String(queuedDeadlineMinutes),
    ]),
  );
  return (Array.isArray(rows) ? rows : []).map((r) => String(r.id));
}

/** Resolve queued descendants of a blocked/failed predecessor immediately. */
export async function blockRunsWithFailedDependencies(
  opts: { rawSql?: RawSqlRunner } = {},
): Promise<string[]> {
  const rawSql = opts.rawSql ?? defaultRawSql;
  const sql = `
    WITH RECURSIVE blocked_descendants AS (
      SELECT child.id, parent.deliverable_type AS upstream_type
        FROM deliverable_runs child
        JOIN deliverable_runs parent ON parent.id = child.depends_on_run_id
         AND parent.client_id = child.client_id
         AND parent.tenant_key = child.tenant_key
       WHERE child.status = 'queued' AND parent.status IN ('blocked', 'failed')
      UNION ALL
      SELECT child.id, blocked_descendants.upstream_type
        FROM deliverable_runs child
        JOIN blocked_descendants ON child.depends_on_run_id = blocked_descendants.id
       WHERE child.status = 'queued'
    )
    UPDATE deliverable_runs target
       SET status = 'blocked',
           error = 'dependency_not_satisfied',
           blockers = jsonb_build_array(
             'Upstream deliverable ' || blocked_descendants.upstream_type || ' did not complete successfully'
           ),
           updated_at = now()
      FROM blocked_descendants
     WHERE target.id = blocked_descendants.id
    RETURNING target.id`;
  const rows = await rawSql((run) => run<{ id: string }>(sql, []));
  return (Array.isArray(rows) ? rows : []).map((row) => String(row.id));
}

export async function completeDeliverableRun(
  id: string,
  input: CompleteRunInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const { error } = await db
    .from("deliverable_runs")
    .update({
      status: input.status,
      artifact_id: input.artifactId ?? null,
      section_count: input.sectionCount ?? null,
      retrieved_evidence: input.retrievedEvidence ?? null,
      // blockers/warnings are JSONB columns. The write client binds params raw,
      // so a non-empty JS array reaches Postgres as an array literal ({a,b}) and
      // JSONB rejects it ("invalid input syntax for type json") — empty arrays
      // slip through only because they bind as {}. Pre-serialize to a JSON string
      // so JSONB always accepts it (the read path parses it back to an array).
      blockers: JSON.stringify(input.blockers ?? []),
      warnings: JSON.stringify(input.warnings ?? []),
      error: input.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error)
    throw new Error(`deliverable_runs update failed: ${error.message}`);
}

/**
 * Update live progress for a running generation. Called from the background worker
 * after each orchestrator pass; best-effort (a failed progress write must never abort
 * the generation), so callers should swallow errors.
 */
export async function updateDeliverableRunProgress(
  id: string,
  progress: {
    pct: number;
    label: string;
    pass?: string | null;
    workerId?: string | null;
  },
  db: DbClient = getAzureWriteFluentClient(),
): Promise<void> {
  const pct = Math.min(Math.max(Math.round(progress.pct), 0), 100);
  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = {
    progress_pct: pct,
    progress_label: progress.label,
    progress_pass: progress.pass ?? null,
    updated_at: nowIso,
  };
  // When a worker drives the run, every progress write doubles as a heartbeat so a
  // long-but-alive generation does not trip the claim lease and get reclaimed.
  if (progress.workerId) update.claimed_at = nowIso;
  const { error } = await db
    .from("deliverable_runs")
    .update(update)
    .eq("id", id);
  if (error)
    throw new Error(
      `deliverable_runs progress update failed: ${error.message}`,
    );
}

/** Read a run, scoped to the owning client (tenant-isolation defense-in-depth). */
export async function getDeliverableRun(
  id: string,
  clientId: string,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<DeliverableRunRecord | null> {
  const { data, error } = await db
    .from("deliverable_runs")
    .select("*")
    .eq("id", id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(`deliverable_runs read failed: ${error.message}`);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

/**
 * Latest SUCCEEDED run per deliverable type for a Move. The source-artifact ref
 * (the moveId) lives inside the JSONB job_payload, not a top-level column, so we
 * read the client's recent succeeded runs (newest first) and filter in code,
 * keeping only the first (latest) run seen for each deliverableType. Used to show
 * orchestrator / Approve & Build output (which lands in generated_artifacts, not
 * deliverables_v2) as "built" on the browse surfaces, with the artifactId for
 * download via /api/v1/artifacts/{id}.
 */
export async function listSucceededRunsForMove(
  clientId: string,
  moveId: string,
  db: DbClient = getAzureWriteFluentClient(),
  limit = 300,
): Promise<DeliverableRunRecord[]> {
  const { data, error } = await db
    .from("deliverable_runs")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "succeeded")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error(`deliverable_runs move list failed: ${error.message}`);
  const rows = ((data as Record<string, unknown>[] | null) ?? []).map(
    rowToRecord,
  );
  const latestByType = new Map<string, DeliverableRunRecord>();
  for (const r of rows) {
    if (r.jobPayload?.sourceArtifactRef !== moveId) continue;
    if (!r.artifactId) continue;
    if (!latestByType.has(r.deliverableType))
      latestByType.set(r.deliverableType, r);
  }
  return [...latestByType.values()];
}
