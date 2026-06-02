// GET /api/v1/source/:eventId/cxo-report?format=html|pptx
//
// Source CXO Narrative Report — a boardroom slide story generated from
// the same Source Deal Pack input. The Deal Pack remains the full audit
// appendix; this route emits the executive narrative deck.

import type { NextRequest } from "next/server";

import { getActiveClientRow } from "@/lib/active-client";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";
import { assembleDealPack } from "@/lib/source/exports/deal-pack/assemble-deal-pack";
import { buildSourceCxoNarrativeReport } from "@/lib/source/exports/cxo-report/source-cxo-narrative-report";
import {
  SOURCE_CXO_HTML_CONTENT_TYPE,
  renderSourceCxoNarrativeHtml,
} from "@/lib/source/exports/cxo-report/source-cxo-narrative-html";

// Keep the PPTX renderer off the route's module graph. `pptxgenjs`
// has runtime-specific dependencies; loading it lazily lets the
// serverless function boot and return a structured fallback if PPTX
// support is unavailable in the deployment environment.
const SOURCE_CXO_PPTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteCtx = { params: Promise<{ eventId: string }> };

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function GET(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "html";
  if (format !== "html" && format !== "pptx") {
    return Response.json(
      {
        error: "invalid_format",
        detail: `CXO report supports format=html or format=pptx (got "${format}").`,
      },
      { status: 400 },
    );
  }

  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: "not_found", detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const accessPolicy =
    tenancy && activeClient
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
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: "forbidden",
        detail: "Source artifact rights are required to export the CXO report.",
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  try {
    const dealPack = await assembleDealPack(ctx, generatedAt);
    const report = buildSourceCxoNarrativeReport(dealPack.input);
    if (format === "pptx") {
      let renderSourceCxoNarrativePptx: (typeof import("@/lib/source/exports/cxo-report/source-cxo-narrative-pptx"))["renderSourceCxoNarrativePptx"];
      try {
        const mod =
          await import("@/lib/source/exports/cxo-report/source-cxo-narrative-pptx");
        renderSourceCxoNarrativePptx = mod.renderSourceCxoNarrativePptx;
      } catch (loadErr) {
        console.error(
          "[GET /api/v1/source/:eventId/cxo-report] pptx renderer unavailable",
          loadErr,
        );
        return Response.json(
          {
            error: "pptx_unavailable",
            detail:
              "PPTX export is not available in this environment. Use format=html for the CXO narrative report.",
            ops: "Verify pptxgenjs is installed and bundled for the Node.js runtime; check Vercel function logs for the underlying require error.",
            fallback: { format: "html", url: `${url.pathname}?format=html` },
          },
          { status: 503 },
        );
      }
      const buffer = await renderSourceCxoNarrativePptx(report);
      return new Response(buffer as unknown as ArrayBuffer, {
        status: 200,
        headers: {
          "content-type": SOURCE_CXO_PPTX_CONTENT_TYPE,
          "content-disposition": `attachment; filename="${filenameFor(ctx.event.code, generatedAt, "pptx")}"`,
          "cache-control": "no-store",
          "x-source-event-code": ctx.event.code,
          "x-source-cxo-report-format": "pptx",
        },
      });
    }

    const html = renderSourceCxoNarrativeHtml(report);
    return new Response(Buffer.from(html, "utf8") as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": SOURCE_CXO_HTML_CONTENT_TYPE,
        "cache-control": "no-store",
        "x-source-event-code": ctx.event.code,
        "x-source-cxo-report-format": "html",
      },
    });
  } catch (err) {
    console.error("[GET /api/v1/source/:eventId/cxo-report] render error", err);
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error ? err.message : "CXO report rendering failed.",
      },
      { status: 500 },
    );
  }
}

function filenameFor(
  eventCode: string,
  generatedAt: string,
  ext: "pptx",
): string {
  const safeEvent = eventCode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `abarva-source-cxo-report-${safeEvent}-${generatedAt.slice(0, 10)}.${ext}`;
}
