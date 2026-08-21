// =============================================================================
// Move Artifact Vault — durable Blob + Postgres registry for every Move artifact.
// -----------------------------------------------------------------------------
// saveMoveArtifact: upload rendered bytes to Azure Blob at the canonical path,
// register in move_artifacts with version lineage (supersede prior current),
// return the registry id. listMoveArtifacts: the File Cabinet data. signed URL:
// short-lived download. No Move artifact is left in browser-only Downloads.
// =============================================================================

import "server-only";
import { createHash } from "node:crypto";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";

const BUCKET = process.env.DATA_PLANE_OBJECT_STORE_CONTAINER ?? "context-drops";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  html: "text/html; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
  pdf: "application/pdf",
};

export type ArtifactFamily =
  | "generated_deliverable"
  | "uploaded_evidence"
  | "template"
  | "session_artifact"
  | "approval_artifact"
  | "historical_version";

export interface SaveMoveArtifactInput {
  moveId: string;
  phase: number;
  archetype?: string;
  artifactType: string;
  artifactFamily?: ArtifactFamily;
  title: string;
  description?: string;
  fileName: string;
  fileFormat: string; // docx|html|xlsx|pptx|md|pdf
  body: Buffer | Uint8Array | string;
  status?: string;
  generatedBy?: string;
  qualityScore?: number | null;
  unsupportedClaimsCount?: number;
  sourceBasis?: string;
  confidence?: string;
  citationReady?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MoveArtifactRow {
  artifact_id: string;
  move_id: string;
  phase: number | null;
  artifact_type: string;
  artifact_family: string;
  title: string;
  file_name: string;
  file_format: string;
  blob_container: string;
  blob_path: string;
  file_size: number | null;
  version: number;
  status: string;
  generated_by: string | null;
  generated_at: string | null;
  quality_score: number | null;
  unsupported_claims_count: number;
  lifecycle_state: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

function toBuffer(b: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(b)) return b;
  if (typeof b === "string") return Buffer.from(b, "utf-8");
  return Buffer.from(b);
}

/**
 * Persist a Move artifact: upload bytes to Blob (canonical path), register in
 * move_artifacts as a new version, supersede the prior current of the same type.
 * Best-effort on Blob (if storage is unconfigured the registry row still records
 * the intended location, marked storage:unconfigured) — but never silently lies
 * about whether the bytes were stored.
 */
export async function saveMoveArtifact(
  ctx: TenancyCtx,
  input: SaveMoveArtifactInput,
): Promise<{
  artifactId: string;
  version: number;
  blobPath: string;
  blobStored: boolean;
}> {
  const tenantKey = ctx.clientKey ?? "";
  const sb = getAzureWriteFluentClient();
  const body = toBuffer(input.body);
  const sha = createHash("sha256").update(body).digest("hex");
  const family = input.artifactFamily ?? "generated_deliverable";

  // Next version for this (move, artifactType) among current rows.
  let version = 1;
  let priorId: string | null = null;
  try {
    const { data } = await sb
      .from("move_artifacts")
      .select("artifact_id, version")
      .eq("move_id", input.moveId)
      .eq("artifact_type", input.artifactType)
      .eq("lifecycle_state", "current")
      .order("version", { ascending: false })
      .limit(1);
    const prior = (
      data as Array<{ artifact_id: string; version: number }>
    )?.[0];
    if (prior) {
      version = prior.version + 1;
      priorId = prior.artifact_id;
    }
  } catch {
    /* fresh */
  }

  const folder =
    family === "uploaded_evidence"
      ? `uploads/${input.artifactType}/v${version}`
      : family === "session_artifact"
        ? `sessions/${input.artifactType}/v${version}`
        : family === "approval_artifact"
          ? `approvals/p${input.phase}/v${version}`
          : `generated/p${input.phase}/${input.artifactType}/v${version}`;
  const blobPath = `moves/${tenantKey}/${input.moveId}/${folder}/${input.fileName}`;

  let blobStored = false;
  try {
    await getObjectStorageAdapter().upload(BUCKET, blobPath, body, {
      contentType: MIME[input.fileFormat] ?? "application/octet-stream",
    });
    blobStored = true;
  } catch {
    blobStored = false;
  }

  const meta = {
    ...(input.metadata ?? {}),
    sha256: sha,
    storage: blobStored ? "azure_blob" : "unconfigured",
  };
  const { data, error } = await sb
    .from("move_artifacts")
    .insert({
      tenant_id: ctx.clientId,
      tenant_key: tenantKey,
      move_id: input.moveId,
      phase: input.phase,
      archetype: input.archetype ?? null,
      artifact_type: input.artifactType,
      artifact_family: family,
      title: input.title,
      description: input.description ?? null,
      file_name: input.fileName,
      file_format: input.fileFormat,
      blob_container: BUCKET,
      blob_path: blobPath,
      blob_sha256: sha,
      file_size: body.length,
      version,
      status: input.status ?? "draft",
      generated_by: input.generatedBy ?? ctx.userId ?? null,
      generated_at: new Date().toISOString(),
      source_basis: input.sourceBasis ?? null,
      confidence: input.confidence ?? null,
      citation_ready: input.citationReady ?? false,
      quality_score: input.qualityScore ?? null,
      unsupported_claims_count: input.unsupportedClaimsCount ?? 0,
      supersedes_artifact_id: priorId,
      lifecycle_state: "current",
      metadata: meta,
    })
    .select("artifact_id")
    .single();
  if (error) throw error;
  const artifactId = (data as { artifact_id: string }).artifact_id;

  // Supersede the prior current of this type (version history preserved).
  if (priorId) {
    await sb
      .from("move_artifacts")
      .update({
        lifecycle_state: "superseded",
        status: "superseded",
        superseded_by_artifact_id: artifactId,
        updated_at: new Date().toISOString(),
      })
      .eq("artifact_id", priorId);
  }

  return { artifactId, version, blobPath, blobStored };
}

/** File Cabinet data: artifacts for a move (filterable), newest first. */
export async function listMoveArtifacts(
  ctx: TenancyCtx,
  moveId: string,
  opts: { family?: ArtifactFamily; currentOnly?: boolean } = {},
): Promise<MoveArtifactRow[]> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey || !moveId) return [];
  try {
    const sb = getAzureWriteFluentClient();
    let q = sb
      .from("move_artifacts")
      .select("*")
      .eq("tenant_key", tenantKey)
      .eq("move_id", moveId);
    if (opts.family) q = q.eq("artifact_family", opts.family);
    if (opts.currentOnly) q = q.eq("lifecycle_state", "current");
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data as MoveArtifactRow[];
  } catch {
    return [];
  }
}

/** Tenant File Cabinet data across all Moves, newest first. */
export async function listMoveArtifactsForTenant(
  ctx: TenancyCtx,
  opts: { currentOnly?: boolean; limit?: number } = {},
): Promise<MoveArtifactRow[]> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey) return [];
  try {
    const sb = getAzureWriteFluentClient();
    let q = sb.from("move_artifacts").select("*").eq("tenant_key", tenantKey);
    if (opts.currentOnly) q = q.eq("lifecycle_state", "current");
    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 300);
    if (error || !Array.isArray(data)) return [];
    return data as MoveArtifactRow[];
  } catch {
    return [];
  }
}

export async function getMoveArtifactForTenant(
  ctx: TenancyCtx,
  artifactId: string,
): Promise<MoveArtifactRow | null> {
  const tenantKey = ctx.clientKey ?? "";
  if (!tenantKey || !artifactId) return null;
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("move_artifacts")
      .select("*")
      .eq("tenant_key", tenantKey)
      .eq("artifact_id", artifactId)
      .maybeSingle();
    if (error || !data) return null;
    return data as MoveArtifactRow;
  } catch {
    return null;
  }
}

/** Stream an artifact's bytes from Blob (tenant-scoped). Robust download path
 *  that doesn't depend on SAS generation under managed identity. */
export async function downloadArtifactBytes(
  ctx: TenancyCtx,
  artifactId: string,
): Promise<{ bytes: Buffer; fileName: string; fileFormat: string } | null> {
  const tenantKey = ctx.clientKey ?? "";
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("move_artifacts")
      .select("blob_container, blob_path, file_name, file_format, tenant_key")
      .eq("artifact_id", artifactId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      blob_container: string;
      blob_path: string;
      file_name: string;
      file_format: string;
      tenant_key: string;
    };
    if (row.tenant_key !== tenantKey) return null; // tenant isolation
    const bytes = await getObjectStorageAdapter().download(
      row.blob_container,
      row.blob_path,
    );
    return { bytes, fileName: row.file_name, fileFormat: row.file_format };
  } catch {
    return null;
  }
}

/** A short-lived signed download URL for an artifact (tenant-scoped). */
export async function getArtifactSignedUrl(
  ctx: TenancyCtx,
  artifactId: string,
  expiresInSeconds = 600,
): Promise<{ url: string; fileName: string } | null> {
  const tenantKey = ctx.clientKey ?? "";
  try {
    const sb = getAzureWriteFluentClient();
    const { data, error } = await sb
      .from("move_artifacts")
      .select("blob_container, blob_path, file_name, tenant_key")
      .eq("artifact_id", artifactId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      blob_container: string;
      blob_path: string;
      file_name: string;
      tenant_key: string;
    };
    if (row.tenant_key !== tenantKey) return null; // tenant isolation
    const url = await getObjectStorageAdapter().createSignedUrl(
      row.blob_container,
      row.blob_path,
      expiresInSeconds,
    );
    return { url, fileName: row.file_name };
  } catch {
    return null;
  }
}
