import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  enqueueSourceArtifactGenerationJob,
  isSourceArtifactGenerationQueueUnavailable,
  processSourceArtifactGenerationJob,
  type SourceArtifactGenerationJobRow,
} from "@/lib/source/artifact-generation-queue";
import {
  getPromptTemplate,
  listSupportedGenerationCodes,
} from "@/lib/source/agent-generation";
import { specsForStage } from "@/lib/source/canonical-specs";
import type { SourceEventArtifactStateRow } from "@/lib/source/canvas-substrate/types";
import type { SourceStageKey } from "@/lib/source/types";

export interface AutoDraftOnStageEntryInput {
  eventId: string;
  clientKey: string;
  enteredStage: SourceStageKey;
}

export interface AutoDraftOnStageEntryResult {
  queued: string[];
  generated: string[];
  skipped: string[];
  failed: string[];
}

type AutoDraftArtifactRow = Pick<
  SourceEventArtifactStateRow,
  "id" | "artifact_code" | "body" | "status"
>;

export interface AutoDraftOnStageEntryDeps {
  request?: Request;
  loadArtifactRows?: (
    input: AutoDraftOnStageEntryInput,
  ) => Promise<AutoDraftArtifactRow[]>;
  generateArtifact?: (input: {
    eventId: string;
    artifactCode: string;
    request?: Request;
  }) => Promise<Response>;
  enqueueGenerationJob?: (input: {
    eventId: string;
    clientKey: string;
    artifactCode: string;
    artifactRowId: string;
    stageKey: SourceStageKey;
  }) => Promise<SourceArtifactGenerationJobRow>;
  processGenerationJob?: (input: {
    job: SourceArtifactGenerationJobRow;
    eventId: string;
    artifactCode: string;
    request?: Request;
  }) => Promise<Response>;
  updateArtifactStatus?: (input: {
    clientKey: string;
    artifactRowId: string;
    status: "drafting";
  }) => Promise<void>;
  waitForDraftableUpstream?: (input: {
    eventId: string;
    artifactCode: string;
    requiredCodes: string[];
  }) => Promise<string[]>;
  log?: Pick<Console, "warn" | "error">;
}

const TERMINAL_ARTIFACT_STATUSES = new Set(["locked", "superseded"]);
const UPSTREAM_DRAFT_WAIT_TIMEOUT_MS = 20 * 60 * 1000;
const UPSTREAM_DRAFT_WAIT_INTERVAL_MS = 5_000;

export function autoDraftCodesForStage(stage: SourceStageKey): string[] {
  const supported = new Set(listSupportedGenerationCodes());
  return specsForStage(stage)
    .filter((spec) => spec.requirementLevel === "required" || spec.gateDefining)
    .map((spec) => spec.code)
    .filter((code) => supported.has(code));
}

export async function autoDraftOnStageEntry(
  input: AutoDraftOnStageEntryInput,
  deps: AutoDraftOnStageEntryDeps = {},
): Promise<AutoDraftOnStageEntryResult> {
  const log = deps.log ?? console;
  const result: AutoDraftOnStageEntryResult = {
    queued: [],
    generated: [],
    skipped: [],
    failed: [],
  };

  const codes = autoDraftCodesForStage(input.enteredStage);
  if (codes.length === 0) {
    result.skipped.push(`${input.enteredStage}:no_supported_templates`);
    return result;
  }

  let rows: AutoDraftArtifactRow[];
  try {
    rows = deps.loadArtifactRows
      ? await deps.loadArtifactRows(input)
      : await loadArtifactRowsForStage(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.failed.push(`${input.enteredStage}:artifact_lookup_failed`);
    log.error("[source stage autodraft] artifact lookup failed", {
      ...input,
      message,
    });
    return result;
  }

  const rowsByCode = new Map(rows.map((row) => [row.artifact_code, row]));
  for (const artifactCode of codes) {
    const row = rowsByCode.get(artifactCode);
    if (!row) {
      result.skipped.push(`${artifactCode}:missing_artifact_row`);
      continue;
    }
    if (row.body && row.body.trim().length > 0) {
      result.skipped.push(`${artifactCode}:already_authored`);
      continue;
    }
    if (TERMINAL_ARTIFACT_STATUSES.has(row.status)) {
      result.skipped.push(`${artifactCode}:${row.status}`);
      continue;
    }

    try {
      const requiredCodes =
        getPromptTemplate(artifactCode)?.upstreamRequired ?? [];
      if (
        requiredCodes.length > 0 &&
        (!deps.loadArtifactRows || deps.waitForDraftableUpstream)
      ) {
        const missingUpstream = await (
          deps.waitForDraftableUpstream ?? defaultWaitForDraftableUpstream
        )({
          eventId: input.eventId,
          artifactCode,
          requiredCodes,
        });
        if (missingUpstream.length > 0) {
          result.failed.push(`${artifactCode}:upstream_required`);
          log.warn("[source stage autodraft] upstream draft not ready", {
            ...input,
            artifactCode,
            missingUpstream,
          });
          continue;
        }
      }

      await (deps.updateArtifactStatus ?? defaultUpdateArtifactStatus)({
        clientKey: input.clientKey,
        artifactRowId: row.id,
        status: "drafting",
      });
      const job = await (
        deps.enqueueGenerationJob ?? defaultEnqueueGenerationJob
      )({
        eventId: input.eventId,
        clientKey: input.clientKey,
        artifactCode,
        artifactRowId: row.id,
        stageKey: input.enteredStage,
      });
      result.queued.push(artifactCode);
      const response = await (deps.processGenerationJob
        ? deps.processGenerationJob({
            job,
            eventId: input.eventId,
            artifactCode,
            request: deps.request,
          })
        : processQueuedGenerationJob({
            job,
            eventId: input.eventId,
            artifactCode,
            request: deps.request,
            generateArtifact: deps.generateArtifact,
          }));
      if (!response.ok) {
        const payload = await safeReadJson(response);
        const detail =
          typeof payload?.error === "string"
            ? payload.error
            : `http_${response.status}`;
        result.failed.push(`${artifactCode}:${detail}`);
        log.warn("[source stage autodraft] generation returned non-ok", {
          ...input,
          artifactCode,
          status: response.status,
          detail,
        });
        continue;
      }
      result.generated.push(artifactCode);
    } catch (error) {
      if (isSourceArtifactGenerationQueueUnavailable(error)) {
        log.warn(
          "[source stage autodraft] durable queue unavailable; falling back to direct generation",
          {
            ...input,
            artifactCode,
            message: error instanceof Error ? error.message : String(error),
          },
        );
        const fallbackResponse = await runDirectGeneration({
          eventId: input.eventId,
          artifactCode,
          request: deps.request,
          generateArtifact: deps.generateArtifact,
        });
        if (fallbackResponse.ok) {
          result.generated.push(artifactCode);
          continue;
        }
        const payload = await safeReadJson(fallbackResponse);
        const detail =
          typeof payload?.error === "string"
            ? payload.error
            : `http_${fallbackResponse.status}`;
        result.failed.push(`${artifactCode}:${detail}`);
        continue;
      }
      const message = error instanceof Error ? error.message : String(error);
      result.failed.push(`${artifactCode}:generation_failed`);
      log.error("[source stage autodraft] generation failed", {
        ...input,
        artifactCode,
        message,
      });
    }
  }

  return result;
}

async function defaultEnqueueGenerationJob(input: {
  eventId: string;
  clientKey: string;
  artifactCode: string;
  artifactRowId: string;
  stageKey: SourceStageKey;
}): Promise<SourceArtifactGenerationJobRow> {
  return enqueueSourceArtifactGenerationJob({
    clientKey: input.clientKey,
    sourceEventId: input.eventId,
    artifactRowId: input.artifactRowId,
    artifactCode: input.artifactCode,
    stageKey: input.stageKey,
    qualityTier: "real_engagement",
    requestedVia: "stage_entry",
  });
}

async function defaultUpdateArtifactStatus(input: {
  clientKey: string;
  artifactRowId: string;
  status: "drafting";
}): Promise<void> {
  const write = await selectSourceWriteAdapter(
    undefined,
    input.clientKey,
  ).updateArtifactStatus({
    artifactRowId: input.artifactRowId,
    status: input.status,
    updatedAtIso: new Date().toISOString(),
  });
  if (!write.ok) {
    throw new Error(write.error ?? "artifact status update failed");
  }
}

async function processQueuedGenerationJob(input: {
  job: SourceArtifactGenerationJobRow;
  eventId: string;
  artifactCode: string;
  request?: Request;
  generateArtifact?: (input: {
    eventId: string;
    artifactCode: string;
    request?: Request;
  }) => Promise<Response>;
}): Promise<Response> {
  const stageAutoDraftRequest = withStageAutoDraftHeaders(input.request);
  const result = await processSourceArtifactGenerationJob(
    { jobId: input.job.id, request: stageAutoDraftRequest },
    {
      generateArtifact: input.generateArtifact
        ? () =>
            input.generateArtifact!({
              eventId: input.eventId,
              artifactCode: input.artifactCode,
              request: stageAutoDraftRequest,
            })
        : undefined,
    },
  );
  if (result.ok) return Response.json({ ok: true, jobId: result.jobId });
  return Response.json(
    { error: result.error ?? "generation_failed", jobId: result.jobId },
    { status: 502 },
  );
}

async function runDirectGeneration(input: {
  eventId: string;
  artifactCode: string;
  request?: Request;
  generateArtifact?: (input: {
    eventId: string;
    artifactCode: string;
    request?: Request;
  }) => Promise<Response>;
}): Promise<Response> {
  return input.generateArtifact
    ? input.generateArtifact({
        ...input,
        request: withStageAutoDraftHeaders(input.request),
      })
    : defaultGenerateArtifact({
        ...input,
        request: withStageAutoDraftHeaders(input.request),
      });
}

function withStageAutoDraftHeaders(request?: Request): Request {
  const headers = new Headers(request?.headers);
  headers.set("x-source-stage-autodraft", "1");
  headers.set("x-source-worker-call", "1");
  return new Request(request?.url ?? "https://app.abarva.ai/source-autodraft", {
    method: "POST",
    headers,
  });
}

async function loadArtifactRowsForStage(
  input: AutoDraftOnStageEntryInput,
): Promise<AutoDraftArtifactRow[]> {
  const supabase = getAzureReadFluentClient();
  const { data, error } = await supabase
    .from("source_event_artifact_states")
    .select("id, artifact_code, body, status")
    .eq("source_event_id", input.eventId)
    .eq("stage_key", input.enteredStage);
  if (error) throw new Error(error.message);
  return ((data ?? []) as SourceEventArtifactStateRow[]).map((row) => ({
    id: row.id,
    artifact_code: row.artifact_code,
    body: row.body,
    status: row.status,
  }));
}

async function defaultWaitForDraftableUpstream(input: {
  eventId: string;
  artifactCode: string;
  requiredCodes: string[];
}): Promise<string[]> {
  const deadline = Date.now() + UPSTREAM_DRAFT_WAIT_TIMEOUT_MS;
  let lastMissing = [...input.requiredCodes];

  while (Date.now() <= deadline) {
    const state = await readDraftableUpstreamState(
      input.eventId,
      input.requiredCodes,
    );
    lastMissing = state.missingCodes;
    if (lastMissing.length === 0) return [];
    if (!state.hasActiveUpstreamJob) return lastMissing;
    await sleep(UPSTREAM_DRAFT_WAIT_INTERVAL_MS);
  }

  return lastMissing;
}

async function readDraftableUpstreamState(
  eventId: string,
  requiredCodes: string[],
): Promise<{ missingCodes: string[]; hasActiveUpstreamJob: boolean }> {
  const supabase = getAzureReadFluentClient();
  const { data: rows, error: rowsError } = await supabase
    .from("source_event_artifact_states")
    .select("artifact_code, body")
    .eq("source_event_id", eventId)
    .in("artifact_code", requiredCodes);
  if (rowsError) throw new Error(rowsError.message);

  const satisfied = new Set(
    (
      (rows ?? []) as Pick<
        SourceEventArtifactStateRow,
        "artifact_code" | "body"
      >[]
    )
      .filter((row) => row.body && row.body.trim().length > 0)
      .map((row) => row.artifact_code),
  );
  const missingCodes = requiredCodes.filter((code) => !satisfied.has(code));
  if (missingCodes.length === 0) {
    return { missingCodes: [], hasActiveUpstreamJob: false };
  }

  const { data: jobs, error: jobsError } = await supabase
    .from("source_artifact_generation_jobs")
    .select("id")
    .eq("source_event_id", eventId)
    .in("status", ["queued", "running"])
    .limit(1);
  if (jobsError) throw new Error(jobsError.message);

  return {
    missingCodes,
    hasActiveUpstreamJob: (jobs ?? []).length > 0,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function defaultGenerateArtifact(input: {
  eventId: string;
  artifactCode: string;
  request?: Request;
}): Promise<Response> {
  const { generateSourceArtifactDraft } =
    await import("@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route");
  return generateSourceArtifactDraft(
    input.request ?? new Request("https://app.abarva.ai/source-autodraft"),
    {
      params: Promise.resolve({
        eventId: input.eventId,
        artifactCode: input.artifactCode,
      }),
    },
  );
}

async function safeReadJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
