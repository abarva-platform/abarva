import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { BoardPackRenderInput, BoardPackRenderResult } from "./types";
import { renderBoardPack } from "./render-engine";

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

export async function saveGeneratedArtifact(
  input: BoardPackRenderInput,
  rendered: BoardPackRenderResult,
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
      evidence_ledger_ids: rendered.evidenceLedgerIds,
      cited_input_ids: rendered.evidenceLedgerIds,
      generation_egress_audit: rendered.generationEgressAudit,
      rendered_by: input.renderedBy,
      quarantine_reason: rendered.quarantineReason,
      metadata: {
        title: input.title,
        factCount: input.facts.length,
        sectionCount: input.sections.length,
        renderedHtml: rendered.html,
        originalBlobUrl: rendered.blobUrl,
      },
    })
    .select("*")
    .single();

  if (error)
    throw new Error(`generated_artifacts insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
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

export async function saveRenderedBoardGradeMoveArtifact(input: {
  clientId: string;
  moveId: string;
  artifactId: string;
  title: string;
  html: string;
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
      },
    })
    .select("*")
    .single();

  if (error)
    throw new Error(`generated_artifacts insert failed: ${error.message}`);
  return rowToRecord(data as Record<string, unknown>);
}
