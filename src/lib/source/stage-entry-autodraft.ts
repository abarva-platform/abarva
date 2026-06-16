import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { listSupportedGenerationCodes } from "@/lib/source/agent-generation";
import type { SourceEventArtifactStateRow } from "@/lib/source/canvas-substrate/types";
import type { SourceStageKey } from "@/lib/source/types";

export interface AutoDraftOnStageEntryInput {
  eventId: string;
  clientKey: string;
  enteredStage: SourceStageKey;
}

export interface AutoDraftOnStageEntryResult {
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
  log?: Pick<Console, "warn" | "error">;
}

const TERMINAL_ARTIFACT_STATUSES = new Set(["locked", "superseded"]);

const AUTO_DRAFT_PRIMARY_CODES_BY_STAGE: Partial<
  Record<SourceStageKey, readonly string[]>
> = {
  strategy: ["d01_strategy_memo"],
  scope: ["d05_scope_memo"],
  rfp: ["d09_rfp_pack"],
};

export function autoDraftCodesForStage(stage: SourceStageKey): string[] {
  const supported = new Set(listSupportedGenerationCodes());
  return [...(AUTO_DRAFT_PRIMARY_CODES_BY_STAGE[stage] ?? [])].filter((code) =>
    supported.has(code),
  );
}

export async function autoDraftOnStageEntry(
  input: AutoDraftOnStageEntryInput,
  deps: AutoDraftOnStageEntryDeps = {},
): Promise<AutoDraftOnStageEntryResult> {
  const log = deps.log ?? console;
  const result: AutoDraftOnStageEntryResult = {
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
      const response = await (deps.generateArtifact
        ? deps.generateArtifact({
            eventId: input.eventId,
            artifactCode,
            request: deps.request,
          })
        : defaultGenerateArtifact({
            eventId: input.eventId,
            artifactCode,
            request: deps.request,
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

async function defaultGenerateArtifact(input: {
  eventId: string;
  artifactCode: string;
  request?: Request;
}): Promise<Response> {
  const { generateSourceArtifactDraft } = await import(
    "@/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route"
  );
  return generateSourceArtifactDraft(
    input.request ?? new Request("http://localhost/source-autodraft"),
    {
      params: Promise.resolve({
        eventId: input.eventId,
        artifactCode: input.artifactCode,
      }),
    },
  );
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
