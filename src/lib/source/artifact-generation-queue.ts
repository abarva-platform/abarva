import { getAzureReadFluentClient, getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";

export type SourceArtifactGenerationJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type SourceArtifactGenerationQualityTier =
  | "standard"
  | "real_engagement"
  | "premium_final";

export interface SourceArtifactGenerationJobRow {
  id: string;
  client_key: string;
  source_event_id: string;
  artifact_row_id: string;
  artifact_code: string;
  stage_key: string;
  status: SourceArtifactGenerationJobStatus;
  quality_tier: SourceArtifactGenerationQualityTier;
  requested_via: "stage_entry" | "manual_retry" | "worker_replay";
  requested_by_user_id: string | null;
  attempt_count: number;
  max_attempts: number;
  locked_by: string | null;
  locked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  result_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EnqueueSourceArtifactGenerationJobInput {
  clientKey: string;
  sourceEventId: string;
  artifactRowId: string;
  artifactCode: string;
  stageKey: string;
  requestedByUserId?: string | null;
  requestedVia?: SourceArtifactGenerationJobRow["requested_via"];
  qualityTier?: SourceArtifactGenerationQualityTier;
}

export interface ProcessSourceArtifactGenerationJobInput {
  jobId: string;
  request?: Request;
  workerId?: string;
}

export interface ProcessSourceArtifactGenerationJobResult {
  ok: boolean;
  jobId: string;
  status: SourceArtifactGenerationJobStatus;
  artifactCode?: string;
  error?: string;
}

export function isSourceArtifactGenerationQueueUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /source_artifact_generation_jobs|schema cache|does not exist|relation .* does not exist/i.test(
    message,
  );
}

export async function enqueueSourceArtifactGenerationJob(
  input: EnqueueSourceArtifactGenerationJobInput,
): Promise<SourceArtifactGenerationJobRow> {
  const nowIso = new Date().toISOString();
  const payload = {
    client_key: input.clientKey,
    source_event_id: input.sourceEventId,
    artifact_row_id: input.artifactRowId,
    artifact_code: input.artifactCode,
    stage_key: input.stageKey,
    status: "queued",
    quality_tier: input.qualityTier ?? "real_engagement",
    requested_via: input.requestedVia ?? "stage_entry",
    requested_by_user_id: input.requestedByUserId ?? null,
    result_metadata: {},
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data, error } = await getAzureWriteFluentClient()
    .from("source_artifact_generation_jobs")
    .insert(payload)
    .select("*")
    .single<SourceArtifactGenerationJobRow>();

  if (!error && data) return data;

  const message = error?.message ?? "source artifact generation job insert failed";
  if (/duplicate key|already exists|23505/i.test(message)) {
    const existing = await findActiveSourceArtifactGenerationJob(
      input.artifactRowId,
    );
    if (existing) return existing;
  }
  throw new Error(message);
}

export async function findActiveSourceArtifactGenerationJob(
  artifactRowId: string,
): Promise<SourceArtifactGenerationJobRow | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_artifact_generation_jobs")
    .select("*")
    .eq("artifact_row_id", artifactRowId)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SourceArtifactGenerationJobRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function processSourceArtifactGenerationJob(
  input: ProcessSourceArtifactGenerationJobInput,
  deps: {
    generateArtifact?: (job: SourceArtifactGenerationJobRow) => Promise<Response>;
  } = {},
): Promise<ProcessSourceArtifactGenerationJobResult> {
  const job = await markSourceArtifactGenerationJobRunning(
    input.jobId,
    input.workerId ?? "source-artifact-generation-worker",
  );
  if (!job) {
    return {
      ok: false,
      jobId: input.jobId,
      status: "failed",
      error: "job_not_found_or_not_queued",
    };
  }

  const generate =
    deps.generateArtifact ??
    ((queuedJob: SourceArtifactGenerationJobRow) =>
      defaultGenerateQueuedArtifact(queuedJob, input.request));

  try {
    const response = await generate(job);
    const payload = await safeReadJson(response);
    if (!response.ok) {
      const error =
        typeof payload?.error === "string"
          ? payload.error
          : `http_${response.status}`;
      await markSourceArtifactGenerationJobFailed(job.id, error, payload);
      return {
        ok: false,
        jobId: job.id,
        status: "failed",
        artifactCode: job.artifact_code,
        error,
      };
    }

    await markSourceArtifactGenerationJobSucceeded(job.id, payload);
    return {
      ok: true,
      jobId: job.id,
      status: "succeeded",
      artifactCode: job.artifact_code,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markSourceArtifactGenerationJobFailed(job.id, message, null);
    return {
      ok: false,
      jobId: job.id,
      status: "failed",
      artifactCode: job.artifact_code,
      error: message,
    };
  }
}

async function markSourceArtifactGenerationJobRunning(
  jobId: string,
  workerId: string,
): Promise<SourceArtifactGenerationJobRow | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_artifact_generation_jobs")
    .update({
      status: "running",
      attempt_count: 1,
      locked_by: workerId,
      locked_at: nowIso,
      started_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle<SourceArtifactGenerationJobRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

async function markSourceArtifactGenerationJobSucceeded(
  jobId: string,
  resultMetadata: Record<string, unknown> | null,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await getAzureWriteFluentClient()
    .from("source_artifact_generation_jobs")
    .update({
      status: "succeeded",
      completed_at: nowIso,
      updated_at: nowIso,
      result_metadata: resultMetadata ?? {},
      last_error: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function markSourceArtifactGenerationJobFailed(
  jobId: string,
  errorMessage: string,
  resultMetadata: Record<string, unknown> | null,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await getAzureWriteFluentClient()
    .from("source_artifact_generation_jobs")
    .update({
      status: "failed",
      completed_at: nowIso,
      updated_at: nowIso,
      last_error: errorMessage,
      result_metadata: resultMetadata ?? {},
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function defaultGenerateQueuedArtifact(
  job: SourceArtifactGenerationJobRow,
  request?: Request,
): Promise<Response> {
  const { generateSourceArtifactDraft } = await import(
    "@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route"
  );
  // Pass X-Source-Worker-Call so the generate route resets the sync budget
  // and always attempts the quality-gate rewrite regardless of generation time.
  const workerRequest =
    request ??
    new Request("https://app.abarva.ai/source-artifact-worker", {
      headers: { "x-source-worker-call": "1" },
    });
  return generateSourceArtifactDraft(workerRequest, {
    params: Promise.resolve({
      eventId: job.source_event_id,
      artifactCode: job.artifact_code,
    }),
  });
}

/**
 * Find the oldest queued job without claiming it. Use this to discover the
 * next job to process; the actual claim/lock happens inside
 * `processSourceArtifactGenerationJob` via an optimistic WHERE status='queued'
 * update, so concurrent workers are safe.
 */
export async function findNextQueuedSourceArtifactGenerationJob(): Promise<SourceArtifactGenerationJobRow | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_artifact_generation_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<SourceArtifactGenerationJobRow>();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Mark jobs that have been in 'running' status longer than `staleAfterMs` as
 * failed. Board-grade (d09) jobs can take 20+ minutes including the rewrite
 * pass, so the default deadline is generous (90 min).
 */
export async function sweepStaleSourceArtifactGenerationJobs(
  staleAfterMs = 90 * 60 * 1000,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - staleAfterMs).toISOString();
  const nowIso = new Date().toISOString();
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_artifact_generation_jobs")
    .update({
      status: "failed",
      completed_at: nowIso,
      updated_at: nowIso,
      last_error:
        "job_timed_out: reclaimed by stale sweep — worker was killed mid-run",
    })
    .eq("status", "running")
    .lt("locked_at", cutoff)
    .select("id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
}

async function safeReadJson(response: Response): Promise<Record<
  string,
  unknown
> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
