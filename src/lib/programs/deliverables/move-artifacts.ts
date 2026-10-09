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
import {
  moveArtifactBytesNeverRetained,
  type MoveArtifactDownloadRefusalReason,
} from "@/lib/programs/move-artifact-download-refusal";

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

export function safeArtifactSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return slug || "file";
}

export function artifactTypeForUpload({
  body,
  family,
  fileName,
  phase,
}: {
  body: Buffer;
  family: ArtifactFamily;
  fileName: string;
  phase: number;
}): string {
  if (family === "session_artifact") {
    return `session_artifact_p${phase}_${safeArtifactSlug(fileName)}`;
  }
  if (family !== "uploaded_evidence") return family;
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
  return `uploaded_evidence_p${phase}_${safeArtifactSlug(fileName)}_${hash}`;
}

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
  requireBlobStored?: boolean;
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

  if (!blobStored && input.requireBlobStored) {
    throw new Error("artifact_blob_storage_unavailable");
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

export interface MoveArtifactBytes {
  bytes: Buffer;
  fileName: string;
  fileFormat: string;
}

/**
 * The outcome of an artifact download attempt, with the cause NAMED.
 *
 * `downloadArtifactBytes` collapses all three failures to `null`, which is all
 * its nine other callers need (they each have their own fallback). The one
 * caller that reports the failure to a person — the cabinet's download route —
 * needs to know WHICH failure it was, because the three have three different
 * remedies. See `@/lib/programs/move-artifact-download-refusal`.
 */
export type MoveArtifactDownloadOutcome =
  | { ok: true; file: MoveArtifactBytes }
  | { ok: false; reason: MoveArtifactDownloadRefusalReason };

/** Stream an artifact's bytes from Blob (tenant-scoped). Robust download path
 *  that doesn't depend on SAS generation under managed identity. */
export async function downloadArtifactBytes(
  ctx: TenancyCtx,
  artifactId: string,
  moveId?: string,
): Promise<MoveArtifactBytes | null> {
  const outcome = await downloadArtifactOutcome(ctx, artifactId, moveId);
  return outcome.ok ? outcome.file : null;
}

/** As `downloadArtifactBytes`, but says WHY when there are no bytes. */
export async function downloadArtifactOutcome(
  ctx: TenancyCtx,
  artifactId: string,
  moveId?: string,
): Promise<MoveArtifactDownloadOutcome> {
  const tenantKey = ctx.clientKey ?? "";
  let row: {
    blob_container: string;
    blob_path: string;
    file_name: string;
    file_format: string;
    tenant_key: string;
    metadata: unknown;
  };
  try {
    const sb = getAzureWriteFluentClient();
    let query = sb
      .from("move_artifacts")
      // `metadata` carries the `storage` stamp `saveMoveArtifact` writes, and
      // it is the ONLY way to tell a row whose bytes were never retained from
      // one whose storage is merely unreachable. Dropping it from this list
      // silently collapses those two causes back into one.
      .select(
        "blob_container, blob_path, file_name, file_format, tenant_key, metadata",
      )
      .eq("artifact_id", artifactId)
      .eq("tenant_key", tenantKey);
    if (moveId) query = query.eq("move_id", moveId);
    const { data, error } = await query.maybeSingle();
    // A read error and an absent row are the same answer to the reader: no
    // such file is filed here. Neither says whether the id exists elsewhere.
    if (error || !data) return { ok: false, reason: "artifact_not_found" };
    row = data as typeof row;
    // Belt-and-braces against the `.eq("tenant_key", …)` filter above; a row
    // that got past it is reported exactly as an absent one.
    if (row.tenant_key !== tenantKey) {
      return { ok: false, reason: "artifact_not_found" };
    }
  } catch {
    return { ok: false, reason: "artifact_not_found" };
  }

  try {
    const bytes = await getObjectStorageAdapter().download(
      row.blob_container,
      row.blob_path,
    );
    // Truth over the stamp: a row marked unretained whose bytes ARE fetchable
    // is served, because the stamp records one past attempt, not the present.
    return {
      ok: true,
      file: {
        bytes,
        fileName: row.file_name,
        fileFormat: row.file_format,
      },
    };
  } catch {
    return {
      ok: false,
      reason: moveArtifactBytesNeverRetained(row.metadata)
        ? "bytes_never_retained"
        : "storage_unreachable",
    };
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
