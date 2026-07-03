// GET /api/v1/source/artifacts/{artifactId}/download
//
// Streams the artifact bytes from Azure Blob (durable store) with a download
// disposition. Tenant-scoped: the metadata row must belong to the caller's client.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { getSourceArtifactRegistryRecord } from "@/lib/source/artifact-registry";
import {
  getSourceArtifact,
  listSourceArtifacts,
} from "@/lib/source/file-cabinet/repository";
import { downloadArtifactBytes } from "@/lib/source/file-cabinet/blob-store";
import { artifactContentDisposition } from "@/lib/source/file-cabinet/content-disposition";
import {
  contentTypeFor,
  type ArtifactFileFormat,
  type SourceArtifactRecord,
} from "@/lib/source/file-cabinet/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INLINE_REGISTRY_URI_PREFIX = "inline://source-event-artifact-state/";
const DOWNLOAD_FORMATS = new Set<ArtifactFileFormat>([
  "docx",
  "html",
  "md",
  "xlsx",
  "pptx",
  "pdf",
  "csv",
  "json",
]);

export async function GET(
  req: NextRequest,
  ctxParam: { params: Promise<{ artifactId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { artifactId } = await ctxParam.params;
    if (!artifactId?.trim()) {
      return Response.json(
        { error: "bad_request", detail: "artifactId is required." },
        { status: 400 },
      );
    }

    const requestedFormat = parseRequestedFormat(req);
    if (requestedFormat === "invalid") {
      return Response.json(
        {
          error: "bad_request",
          detail: "Unsupported artifact download format.",
        },
        { status: 400 },
      );
    }
    const record = await getSourceArtifact(artifactId, ctx.clientId);
    if (!record) return streamRegistryArtifact(artifactId);

    if (requestedFormat === "md") {
      return streamMarkdownSourceFromArtifactState(record);
    }

    const targetRecord = requestedFormat
      ? await resolveFormatRecord(record, requestedFormat, ctx.clientId)
      : record;
    if (!targetRecord) {
      return Response.json(
        {
          error: "format_not_available",
          detail: `No ${requestedFormat} rendition is available for this artifact.`,
        },
        { status: 404 },
      );
    }
    return streamFileCabinetRecord(targetRecord);
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[GET /api/v1/source/artifacts/[artifactId]/download]", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

function parseRequestedFormat(
  req: NextRequest,
): ArtifactFileFormat | "invalid" | null {
  const raw = req.nextUrl.searchParams.get("format")?.trim().toLowerCase();
  if (!raw) return null;
  if (!DOWNLOAD_FORMATS.has(raw as ArtifactFileFormat)) {
    return "invalid";
  }
  return raw as ArtifactFileFormat;
}

function baseArtifactType(artifactType: string): string {
  return artifactType.replace(/__(preview|source|companion)$/i, "");
}

async function resolveFormatRecord(
  record: SourceArtifactRecord,
  format: ArtifactFileFormat,
  clientId: string,
): Promise<SourceArtifactRecord | null> {
  if (record.fileFormat === format) return record;
  const baseType = baseArtifactType(record.artifactType);
  const targetType = format === "html" ? `${baseType}__preview` : baseType;
  const siblings = await listSourceArtifacts(record.sourceEventId, clientId, {
    artifactGroup: record.artifactGroup,
  });
  return (
    siblings.find(
      (candidate) =>
        candidate.artifactType === targetType &&
        candidate.fileFormat === format,
    ) ?? null
  );
}

async function streamFileCabinetRecord(
  record: SourceArtifactRecord,
): Promise<Response> {
  const bytes = await downloadArtifactBytes({
    bucket: record.blobContainer,
    path: record.blobPath,
  });
  const disposition = record.fileFormat === "html" ? "inline" : "attachment";
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": contentTypeFor(record.fileFormat),
      "content-disposition": artifactContentDisposition(
        disposition,
        record.fileName,
      ),
      "content-length": String(bytes.length),
      "cache-control": "private, no-store",
      "x-source-artifact-id": record.id,
      "x-source-artifact-version": String(record.version),
      "x-source-artifact-format": record.fileFormat,
    },
  });
}

async function streamMarkdownSourceFromArtifactState(
  record: SourceArtifactRecord,
): Promise<Response> {
  const artifactCode = baseArtifactType(record.artifactType);
  const { data, error } = await getAzureWriteFluentClient()
    .from("source_event_artifact_states")
    .select("body, body_format")
    .eq("source_event_id", record.sourceEventId)
    .eq("artifact_code", artifactCode)
    .maybeSingle<{ body: string | null; body_format: string | null }>();
  if (error) throw new Error(error.message);

  const body = data?.body?.trim();
  if (!body) {
    return Response.json(
      {
        error: "not_available",
        detail: "This generated artifact has no internal markdown source body.",
      },
      { status: 409 },
    );
  }
  const bytes = Buffer.from(body, "utf8");
  const filename = `${artifactCode}_source_v${record.version}.md`;
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": artifactContentDisposition("attachment", filename),
      "content-length": String(bytes.length),
      "cache-control": "private, no-store",
      "x-source-artifact-id": record.id,
      "x-source-artifact-version": String(record.version),
      "x-source-artifact-format": "md",
      "x-source-artifact-internal-source": "true",
    },
  });
}

async function streamRegistryArtifact(artifactId: string): Promise<Response> {
  const [record, activeClient] = await Promise.all([
    getSourceArtifactRegistryRecord(artifactId),
    getActiveClientRow().catch(() => null),
  ]);
  if (!record || record.deletedAt) {
    return Response.json(
      { error: "not_found", detail: "Artifact not found for this tenant." },
      { status: 404 },
    );
  }
  const activeTenantKey = activeClient?.key
    ? clientKeyToInventorySubstrateKey(activeClient.key)
    : null;
  if (!activeTenantKey || record.tenantKey !== activeTenantKey) {
    return Response.json(
      { error: "not_found", detail: "Artifact not found for this tenant." },
      { status: 404 },
    );
  }

  if (record.blobUri.startsWith(INLINE_REGISTRY_URI_PREFIX)) {
    const { data, error } = await getAzureWriteFluentClient()
      .from("source_event_artifact_states")
      .select("body, body_format")
      .eq("source_event_id", record.sourceEventId)
      .eq("artifact_code", record.artifactKind)
      .maybeSingle<{ body: string | null; body_format: string | null }>();
    if (error) throw new Error(error.message);

    const body = data?.body?.trim();
    if (!body) {
      return Response.json(
        {
          error: "not_available",
          detail:
            "This generated artifact is registered but has no authored body yet.",
        },
        { status: 409 },
      );
    }

    const bytes = Buffer.from(body, "utf8");
    const contentType =
      data?.body_format === "html"
        ? "text/html; charset=utf-8"
        : record.mimeType || "text/markdown; charset=utf-8";
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": artifactContentDisposition(
          "inline",
          record.originalName,
        ),
        "content-length": String(bytes.length),
        "cache-control": "private, no-store",
        "x-source-artifact-id": record.id,
        "x-source-artifact-version": String(record.version),
        "x-source-artifact-registry": "source_artifacts",
        "x-source-artifact-inline": "true",
      },
    });
  }

  const bytes = await getObjectStorageAdapter().download(
    "source-artifacts",
    record.blobUri,
  );
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": record.mimeType || "application/octet-stream",
      "content-disposition": artifactContentDisposition(
        "attachment",
        record.originalName,
      ),
      "content-length": String(bytes.length),
      "cache-control": "private, no-store",
      "x-source-artifact-id": record.id,
      "x-source-artifact-version": String(record.version),
      "x-source-artifact-registry": "source_artifacts",
    },
  });
}
