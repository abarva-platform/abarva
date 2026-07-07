// GET /api/v1/source/:eventId/artifacts/:artifactCode/render?format=...&variant=...
//
// Unified Source artifact render route (Slice 8.4). Replaces the four
// per-format routes (render-xlsx, render-docx, render-html, render-pdf)
// + render-comparison-xlsx with a single endpoint that takes the
// requested format as a query parameter and routes through the
// SourceDeliverableSpec dispatcher.
//
// Query params:
//   - format=xlsx|docx|html|pdf  (optional — falls back to the kind's
//                                  default per format-router.ts)
//   - variant=template|comparison (optional — for d19; default template)
//
// Response shape:
//   200 with the rendered bytes + content-type matching the format,
//   plus audit headers (x-source-artifact-code / x-source-event-code /
//   x-source-artifact-format / x-source-artifact-variant).
//
// The legacy per-format routes still work in parallel during the
// transition; Slice 8.5 deletes them once canvas anchors point here.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";

import { renderSourceDeliverable } from "@/lib/source/exports/dispatch";
import { eventCodeFromSpec } from "@/lib/source/exports/metadata";
import {
  buildSourceDeliverableSpec,
  canonicalArtifactCodeFor,
  kindForArtifactCode,
} from "@/lib/source/exports/spec-builder";
import type { DeliverableFormat } from "@/lib/programs/exports/types";
import { resolveAuthoritativeArtifact } from "@/lib/source/client-final-artifacts";
import { downloadArtifactBytes } from "@/lib/source/file-cabinet/blob-store";
import { artifactContentDisposition } from "@/lib/source/file-cabinet/content-disposition";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import {
  contentTypeFor,
  type ArtifactFileFormat,
  type SourceArtifactRecord,
} from "@/lib/source/file-cabinet/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

const VALID_FORMATS: ReadonlySet<string> = new Set([
  "xlsx",
  "docx",
  "html",
  "pdf",
]);
const VALID_VARIANTS: ReadonlySet<string> = new Set(["template", "comparison"]);

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

async function readPostRenderOptions(req: NextRequest): Promise<{
  format?: string | null;
  variant?: string | null;
}> {
  const payload = (await req.json().catch(() => null)) as {
    format?: unknown;
    variant?: unknown;
  } | null;
  return {
    format: typeof payload?.format === "string" ? payload.format : null,
    variant: typeof payload?.variant === "string" ? payload.variant : null,
  };
}

async function renderArtifact(
  req: NextRequest,
  { params }: RouteCtx,
  method: "GET" | "POST",
) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const { eventId, artifactCode } = await params;
  const url = new URL(req.url);
  const requestedClientId = url.searchParams.get("client");
  const postOptions = method === "POST" ? await readPostRenderOptions(req) : {};

  // Resolve event context before validating format, variant, or artifact code.
  // Cross-tenant callers must always see the same generic 404; otherwise a
  // bad format/code can reveal that the route exists before tenant scoping ran.
  const ctx = await buildSourceGenerationContext(eventId, {
    requestedClientId,
  });
  if (!ctx) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  // Auth gate (same as legacy routes).
  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow(requestedClientId).catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const accessPolicy = activeClient
    ? await loadUserSourceAccessPolicy(tenancy, {
        activeClientKey: activeClient.key,
        sourceEventId: ctx.event.id,
      }).catch(() => null)
    : null;
  const canonicalAdminFallbackAllowed =
    !activeClient && isCanonicalClientAdminEmail(currentUser?.email);
  const canExport = Boolean(
    accessPolicy?.canUploadSourceArtifacts ||
    accessPolicy?.canGenerateSourcingArtifacts ||
    canonicalAdminFallbackAllowed,
  );
  if (!canExport) {
    return Response.json(
      {
        error: "forbidden",
        detail: "Source artifact rights are required to export documents.",
      },
      { status: 403 },
    );
  }

  const formatParam =
    url.searchParams.get("format") ?? postOptions.format ?? null;
  const variantParam =
    url.searchParams.get("variant") ?? postOptions.variant ?? undefined;

  // Validate format param.
  let requestedFormat: DeliverableFormat | undefined;
  if (formatParam) {
    if (!VALID_FORMATS.has(formatParam)) {
      return Response.json(
        {
          error: "invalid_format",
          detail: `Format "${formatParam}" is not one of: xlsx, docx, html, pdf.`,
        },
        { status: 400 },
      );
    }
    requestedFormat = formatParam as DeliverableFormat;
  }

  // Validate variant param.
  if (variantParam && !VALID_VARIANTS.has(variantParam)) {
    return Response.json(
      {
        error: "invalid_variant",
        detail: `Variant "${variantParam}" is not one of: template, comparison.`,
      },
      { status: 400 },
    );
  }

  if (requestedFormat && variantParam !== "comparison" && activeClient) {
    const canonicalArtifactCode = canonicalArtifactCodeFor(artifactCode);
    const clientFinalResponse = await streamClientFinalIfAvailable({
      sourceEventId: ctx.event.id,
      clientId: activeClient.id,
      artifactCode: canonicalArtifactCode,
      requestedArtifactCode: artifactCode,
      eventCode: ctx.event.code,
      requestedFormat,
    });
    if (clientFinalResponse) return clientFinalResponse;
  }

  // Resolve artifact code → kind after the event/auth boundary.
  const canonicalArtifactCode = canonicalArtifactCodeFor(
    artifactCode,
    variantParam === "comparison" ? "comparison" : "template",
  );
  const kind = kindForArtifactCode(
    canonicalArtifactCode,
    variantParam === "comparison" ? "comparison" : "template",
  );
  if (!kind) {
    return Response.json(
      {
        error: "unsupported_artifact",
        detail: `No SourceDeliverableKind wired for artifact code "${artifactCode}".`,
      },
      { status: 404 },
    );
  }

  // Build spec + render.
  const generatedAt = new Date().toISOString();
  let result;
  let responseEventCode = ctx.event.code;
  try {
    const spec = await buildSourceDeliverableSpec(ctx, kind, generatedAt);
    responseEventCode = eventCodeFromSpec(spec, ctx.event.code);
    result = await renderSourceDeliverable(spec, requestedFormat);
  } catch (err) {
    console.error(
      "[GET /api/v1/source/:eventId/artifacts/:artifactCode/render] renderer error",
      err,
    );
    return Response.json(
      {
        error: "render_failed",
        detail: err instanceof Error ? err.message : "render failed",
      },
      { status: 500 },
    );
  }

  // HTML responses render in the browser; everything else downloads.
  const dispositionHeader: Record<string, string> =
    result.format === "html"
      ? {}
      : { "content-disposition": `attachment; filename="${result.filename}"` };

  return new Response(result.buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "content-type": result.contentType,
      "cache-control": "no-store",
      "x-source-artifact-code": canonicalArtifactCode,
      ...(canonicalArtifactCode !== artifactCode
        ? { "x-source-requested-artifact-code": artifactCode }
        : {}),
      "x-source-event-code": responseEventCode,
      "x-source-artifact-format": result.format,
      "x-source-artifact-kind": kind,
      ...(variantParam ? { "x-source-artifact-variant": variantParam } : {}),
      ...dispositionHeader,
    },
  });
}

async function streamClientFinalIfAvailable(args: {
  sourceEventId: string;
  clientId: string;
  artifactCode: string;
  requestedArtifactCode: string;
  eventCode: string;
  requestedFormat: DeliverableFormat;
}): Promise<Response | null> {
  const requestedFileFormat = deliverableFormatToFileFormat(
    args.requestedFormat,
  );
  if (!requestedFileFormat) return null;
  const artifacts = await listSourceArtifacts(
    args.sourceEventId,
    args.clientId,
    {
      includeHistory: false,
    },
  );
  const authoritative = resolveAuthoritativeArtifact(
    artifacts.filter((artifact) => artifact.artifactType === args.artifactCode),
  );
  if (!authoritative || !authoritative.isClientFinal) return null;
  if (authoritative.fileFormat !== requestedFileFormat) return null;
  return streamFileCabinetRecord(authoritative, {
    eventCode: args.eventCode,
    artifactCode: args.artifactCode,
    requestedArtifactCode: args.requestedArtifactCode,
  });
}

function deliverableFormatToFileFormat(
  format: DeliverableFormat,
): ArtifactFileFormat | null {
  if (
    format === "docx" ||
    format === "html" ||
    format === "xlsx" ||
    format === "pdf"
  ) {
    return format;
  }
  return null;
}

async function streamFileCabinetRecord(
  record: SourceArtifactRecord,
  audit: {
    eventCode: string;
    artifactCode: string;
    requestedArtifactCode: string;
  },
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
      "x-source-artifact-code": audit.artifactCode,
      ...(audit.requestedArtifactCode !== audit.artifactCode
        ? { "x-source-requested-artifact-code": audit.requestedArtifactCode }
        : {}),
      "x-source-event-code": audit.eventCode,
      "x-source-artifact-version": String(record.version),
      "x-source-artifact-format": record.fileFormat,
      "x-source-artifact-authoritative": "client-final",
    },
  });
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return renderArtifact(req, ctx, "GET");
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  return renderArtifact(req, ctx, "POST");
}
