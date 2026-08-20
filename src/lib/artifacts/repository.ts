import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { recordContextRefreshEvent } from "@/lib/intelligence/refresh-events";
import type { BoardPackRenderInput, BoardPackRenderResult } from "./types";
import { renderBoardPack } from "./render-engine";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** evidence_ledger_ids / cited_input_ids are UUID[] columns; only genuine UUIDs may be written. */
function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export interface GeneratedArtifactRecord {
  id: string;
  clientId: string;
  artifactType: BoardPackRenderResult["artifactType"];
  sourceArtifactRef: string;
  renderEngine: BoardPackRenderResult["renderEngine"];
  outputFormat: BoardPackRenderResult["outputFormat"];
  blobUrl: string;
  blobSha256: string;
  qualityScore: number | null;
  evidenceLedgerIds: string[];
  citedInputIds: string[];
  generationEgressAudit: string | null;
  renderedAt: string;
  renderedBy: string;
  quarantineReason: string | null;
  /** Set when a newer version supersedes this one; null = current. */
  supersededBy: string | null;
  metadata: Record<string, unknown>;
}

function rowToRecord(row: Record<string, unknown>): GeneratedArtifactRecord {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    artifactType: row.artifact_type as GeneratedArtifactRecord["artifactType"],
    sourceArtifactRef: String(row.source_artifact_ref),
    renderEngine: row.render_engine as GeneratedArtifactRecord["renderEngine"],
    outputFormat: row.output_format as GeneratedArtifactRecord["outputFormat"],
    blobUrl: String(row.blob_url),
    blobSha256: String(row.blob_sha256),
    qualityScore: row.quality_score === null ? null : Number(row.quality_score),
    evidenceLedgerIds: Array.isArray(row.evidence_ledger_ids)
      ? row.evidence_ledger_ids.map(String)
      : [],
    citedInputIds: Array.isArray(row.cited_input_ids)
      ? row.cited_input_ids.map(String)
      : [],
    generationEgressAudit:
      typeof row.generation_egress_audit === "string"
        ? row.generation_egress_audit
        : null,
    renderedAt: String(row.rendered_at),
    renderedBy: String(row.rendered_by),
    quarantineReason:
      typeof row.quarantine_reason === "string" ? row.quarantine_reason : null,
    supersededBy:
      typeof row.superseded_by === "string" ? row.superseded_by : null,
    metadata:
      row.metadata &&
      typeof row.metadata === "object" &&
      !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generatedArtifactUrl(id: string): string {
  return `/api/v1/artifacts/${encodeURIComponent(id)}`;
}

export function renderedHtmlFromGeneratedArtifact(
  record: GeneratedArtifactRecord,
): string | null {
  const html = record.metadata.renderedHtml;
  return typeof html === "string" && html.length > 0 ? html : null;
}

/**
 * The structured `RenderableDeliverable` persisted with the artifact (under
 * `metadata.renderableDoc`), if present. Returned untyped here to keep the
 * repository free of an orchestrator import; the download route narrows it.
 * Older artifacts predating structured persistence return null (the route falls
 * back to the stored HTML).
 */
export function renderableDocFromGeneratedArtifact(
  record: GeneratedArtifactRecord,
): Record<string, unknown> | null {
  const doc = record.metadata.renderableDoc;
  return doc && typeof doc === "object" && !Array.isArray(doc)
    ? (doc as Record<string, unknown>)
    : null;
}

export async function saveGeneratedArtifact(
  input: BoardPackRenderInput,
  rendered: BoardPackRenderResult,
  /**
   * Extra metadata merged into the artifact's `metadata` JSON column. Used to
   * carry the structured `renderableDoc` so any prescribed format (docx/xlsx/html)
   * can be re-rendered on demand at download time. Backward-compatible: omitting
   * it preserves the prior metadata shape exactly.
   */
  extraMetadata: Record<string, unknown> = {},
): Promise<GeneratedArtifactRecord> {
  const id = randomUUID();
  const { data, error } = await getAzureWriteFluentClient()
    .from("generated_artifacts")
    .insert({
      id,
      client_id: input.clientId,
      artifact_type: rendered.artifactType,
      source_artifact_ref: rendered.sourceArtifactRef,
      render_engine: rendered.renderEngine,
      output_format: rendered.outputFormat,
      blob_url: generatedArtifactUrl(id),
      blob_sha256: rendered.blobSha256,
      quality_score: rendered.qualityScore,
      // Both columns are UUID[]. Governed-evidence refs sourced from the Azure
      // tenant-context index are composite reference strings ("ctx:<tenant>:<segment>:…"),
      // not ledger UUIDs — they belong in the document's source register, not these
      // UUID audit columns. Write only the values that are genuine UUIDs so a
      // tenant-context-grounded deliverable persists instead of failing the uuid insert.
      evidence_ledger_ids: rendered.evidenceLedgerIds.filter(isUuid),
      cited_input_ids: rendered.evidenceLedgerIds.filter(isUuid),
      generation_egress_audit: rendered.generationEgressAudit,
      rendered_by: input.renderedBy,
      quarantine_reason: rendered.quarantineReason,
      metadata: {
        title: input.title,
        factCount: input.facts.length,
        sectionCount: input.sections.length,
        renderedHtml: rendered.html,
        originalBlobUrl: rendered.blobUrl,
        ...extraMetadata,
      },
    })
    .select("*")
    .single();

  if (error)
    throw new Error(`generated_artifacts insert failed: ${error.message}`);
  const record = rowToRecord(data as Record<string, unknown>);

  // Supersede any prior, still-active artifact of the SAME logical deliverable
  // (same client + same Move + same canonical deliverableTypeKey). Without this,
  // every regeneration of e.g. "target_architecture" for a Move inserts a brand
  // new row under whatever title the model happened to author that run, and the
  // vault accumulates unbounded near-duplicates with no way to tell which is
  // current. Best-effort: a failure here must never fail the save that already
  // succeeded — the new artifact is real and correct even if the old one didn't
  // get marked.
  const deliverableTypeKey = extraMetadata.deliverableTypeKey;
  if (typeof deliverableTypeKey === "string" && deliverableTypeKey.length > 0) {
    await supersedePriorDeliverableVersions({
      clientId: input.clientId,
      sourceArtifactRef: rendered.sourceArtifactRef,
      deliverableTypeKey,
      supersededById: record.id,
    }).catch((supersessionError) => {
      console.warn("[generated-artifacts] supersession step failed", {
        clientId: input.clientId,
        deliverableTypeKey,
        newArtifactId: record.id,
        error:
          supersessionError instanceof Error
            ? supersessionError.message
            : String(supersessionError),
      });
    });
  }

  await recordContextRefreshEvent({
    clientId: input.clientId,
    triggeredBy: "move_artifact",
    sourceLabel: input.title,
    rowsSeen: 1,
    rowsAccepted: 1,
    approvalRequired: false,
    affectedSurfaces: ["moves", "change-log"],
    receiptUrl: record.blobUrl,
  }).catch((refreshError) => {
    console.warn("[generated-artifacts] refresh event failed", {
      clientId: input.clientId,
      artifactType: rendered.artifactType,
      error:
        refreshError instanceof Error
          ? refreshError.message
          : String(refreshError),
    });
  });
  return record;
}

/**
 * Marks every prior, still-active (`superseded_by IS NULL`) artifact of the same
 * logical deliverable — same client, same Move (`sourceArtifactRef`), same
 * canonical `deliverableTypeKey` (stored in `metadata`, since it is not an
 * indexed column) — as superseded by the newly-persisted artifact. Excludes the
 * new record itself (it cannot match its own predecessor query, since it did not
 * exist yet at query time, but the exclusion is explicit for clarity and safety
 * against any future refactor). Never throws on a "nothing to supersede" result
 * — that is the normal case for a deliverable's first-ever generation.
 */
async function supersedePriorDeliverableVersions(args: {
  clientId: string;
  sourceArtifactRef: string;
  deliverableTypeKey: string;
  supersededById: string;
}): Promise<void> {
  const client = getAzureWriteFluentClient();
  const { data: priorRows, error: lookupError } = await client
    .from("generated_artifacts")
    .select("id")
    .eq("client_id", args.clientId)
    .eq("source_artifact_ref", args.sourceArtifactRef)
    .contains("metadata", { deliverableTypeKey: args.deliverableTypeKey })
    .is("superseded_by", null);
  if (lookupError)
    throw new Error(
      `generated_artifacts supersession lookup failed: ${lookupError.message}`,
    );

  const priorIds = ((priorRows as Record<string, unknown>[] | null) ?? [])
    .map((row) => String(row.id))
    .filter((id) => id !== args.supersededById);
  if (priorIds.length === 0) return;

  const { error: updateError } = await client
    .from("generated_artifacts")
    .update({ superseded_by: args.supersededById })
    .eq("client_id", args.clientId)
    .in("id", priorIds);
  if (updateError)
    throw new Error(
      `generated_artifacts supersession update failed: ${updateError.message}`,
    );
}

export async function generateAndSaveBoardPack(
  input: BoardPackRenderInput,
): Promise<{
  rendered: BoardPackRenderResult;
  record: GeneratedArtifactRecord;
}> {
  const rendered = await renderBoardPack(input);
  const record = await saveGeneratedArtifact(input, rendered);
  return { rendered, record };
}

export async function getGeneratedArtifactById(
  artifactId: string,
  options: { clientId?: string | null } = {},
): Promise<GeneratedArtifactRecord | null> {
  const query = getAzureWriteFluentClient()
    .from("generated_artifacts")
    .select("*")
    .eq("id", artifactId);
  if (options.clientId) query.eq("client_id", options.clientId);

  const { data, error } = await query.maybeSingle();
  if (error)
    throw new Error(`generated_artifacts lookup failed: ${error.message}`);
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

export async function getLatestGeneratedArtifact(args: {
  clientId: string;
  artifactType: BoardPackRenderResult["artifactType"];
  sourceArtifactRef: string;
  outputFormat?: BoardPackRenderResult["outputFormat"];
}): Promise<GeneratedArtifactRecord | null> {
  const query = getAzureWriteFluentClient()
    .from("generated_artifacts")
    .select("*")
    .eq("client_id", args.clientId)
    .eq("artifact_type", args.artifactType)
    .eq("source_artifact_ref", args.sourceArtifactRef);
  if (args.outputFormat) query.eq("output_format", args.outputFormat);

  const { data, error } = await query
    .order("rendered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    throw new Error(
      `generated_artifacts latest lookup failed: ${error.message}`,
    );
  return data ? rowToRecord(data as Record<string, unknown>) : null;
}

export async function listGeneratedArtifactsForMove(args: {
  clientId: string;
  moveId: string;
  limit?: number;
}): Promise<GeneratedArtifactRecord[]> {
  const sourceRefPrefix = `move:${args.moveId}:%`;
  const { data, error } = await getAzureWriteFluentClient()
    .from("generated_artifacts")
    .select("*")
    .eq("client_id", args.clientId)
    .like("source_artifact_ref", sourceRefPrefix)
    .order("rendered_at", { ascending: false })
    .limit(args.limit ?? 50);
  if (error)
    throw new Error(`generated_artifacts move lookup failed: ${error.message}`);
  return ((data as Record<string, unknown>[] | null) ?? []).map(rowToRecord);
}

/**
 * All generated artifacts for a Move, across BOTH source_artifact_ref conventions:
 * the orchestrated / decomposed path stores the bare `moveId`; the legacy
 * board-grade path stores `move:{moveId}:{artifactId}`. Returns a de-duplicated,
 * newest-first list so a caller (e.g. the File Cabinet) sees every built document.
 */
export async function listGeneratedArtifactsForMoveAllRefs(args: {
  clientId: string;
  moveId: string;
  limit?: number;
}): Promise<GeneratedArtifactRecord[]> {
  const client = getAzureWriteFluentClient();
  const limit = args.limit ?? 50;
  const [exact, prefixed] = await Promise.all([
    client
      .from("generated_artifacts")
      .select("*")
      .eq("client_id", args.clientId)
      .eq("source_artifact_ref", args.moveId)
      .order("rendered_at", { ascending: false })
      .limit(limit),
    client
      .from("generated_artifacts")
      .select("*")
      .eq("client_id", args.clientId)
      .like("source_artifact_ref", `move:${args.moveId}:%`)
      .order("rendered_at", { ascending: false })
      .limit(limit),
  ]);
  if (exact.error)
    throw new Error(`generated_artifacts move(exact) lookup failed: ${exact.error.message}`);
  if (prefixed.error)
    throw new Error(`generated_artifacts move(prefix) lookup failed: ${prefixed.error.message}`);
  const byId = new Map<string, GeneratedArtifactRecord>();
  for (const row of [
    ...((exact.data as Record<string, unknown>[] | null) ?? []),
    ...((prefixed.data as Record<string, unknown>[] | null) ?? []),
  ]) {
    const rec = rowToRecord(row);
    byId.set(rec.id, rec);
  }
  return [...byId.values()].sort((a, b) =>
    a.renderedAt < b.renderedAt ? 1 : a.renderedAt > b.renderedAt ? -1 : 0,
  );
}

export async function listGeneratedArtifactsForClient(args: {
  clientId: string;
  limit?: number;
}): Promise<GeneratedArtifactRecord[]> {
  const { data, error } = await getAzureWriteFluentClient()
    .from("generated_artifacts")
    .select("*")
    .eq("client_id", args.clientId)
    .order("rendered_at", { ascending: false })
    .limit(args.limit ?? 300);
  if (error)
    throw new Error(
      `generated_artifacts client lookup failed: ${error.message}`,
    );
  return ((data as Record<string, unknown>[] | null) ?? []).map(rowToRecord);
}

export async function saveRenderedBoardGradeMoveArtifact(input: {
  clientId: string;
  moveId: string;
  artifactId: string;
  title: string;
  html: string;
  renderableDoc?: Record<string, unknown>;
  renderableMetadata?: Record<string, unknown>;
  renderedBy: string;
  routePath: string;
  generatedOn: string;
  citedInputIds?: string[];
  qualityScore?: number | null;
  generationEgressAudit?: string | null;
}): Promise<GeneratedArtifactRecord> {
  const id = randomUUID();
  const sourceArtifactRef = `move:${input.moveId}:${input.artifactId}`;
  const { data, error } = await getAzureWriteFluentClient()
    .from("generated_artifacts")
    .insert({
      id,
      client_id: input.clientId,
      artifact_type: "move_board_pack",
      source_artifact_ref: sourceArtifactRef,
      render_engine: "internal",
      output_format: "html",
      blob_url: generatedArtifactUrl(id),
      blob_sha256: sha256(input.html),
      quality_score: input.qualityScore ?? null,
      evidence_ledger_ids: [],
      cited_input_ids: input.citedInputIds ?? [],
      generation_egress_audit: input.generationEgressAudit ?? null,
      rendered_by: input.renderedBy,
      quarantine_reason: null,
      metadata: {
        title: input.title,
        moveId: input.moveId,
        artifactId: input.artifactId,
        routePath: input.routePath,
        generatedOn: input.generatedOn,
        renderedHtml: input.html,
        ...(input.renderableDoc ? { renderableDoc: input.renderableDoc } : {}),
        ...(input.renderableMetadata
          ? { renderableMetadata: input.renderableMetadata }
          : {}),
      },
    })
    .select("*")
    .single();

  if (error)
    throw new Error(`generated_artifacts insert failed: ${error.message}`);
  const record = rowToRecord(data as Record<string, unknown>);
  await recordContextRefreshEvent({
    clientId: input.clientId,
    triggeredBy: "move_artifact",
    sourceLabel: input.title,
    rowsSeen: 1,
    rowsAccepted: 1,
    approvalRequired: false,
    affectedSurfaces: ["moves", "change-log"],
    receiptUrl: record.blobUrl,
  }).catch((refreshError) => {
    console.warn("[generated-artifacts] refresh event failed", {
      clientId: input.clientId,
      artifactId: input.artifactId,
      error:
        refreshError instanceof Error
          ? refreshError.message
          : String(refreshError),
    });
  });
  return record;
}
