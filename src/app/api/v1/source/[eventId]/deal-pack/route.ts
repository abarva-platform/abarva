// GET /api/v1/source/:eventId/deal-pack?format=html
//
// Source Deal Pack — one self-contained HTML file per event that
// bundles every artifact across the IT-sourcing lifecycle (stages 0-7)
// into a single offline-openable document with a sticky TOC, Headline
// Fast Answer strip, per-stage sections rendering each existing
// artifact inline, and an Evidence Ledger + Decision History at the
// bottom.
//
// Same auth shape as the per-artifact /render routes. Only `format=html`
// is supported today; future formats (pdf, docx) can be added without
// breaking the URL contract.

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { buildSourceGenerationContext } from "@/lib/source/agent-generation/server";
import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  contractOptimizationDealPackFilename,
  isSkyHarborContractOptimizationEvent,
  renderContractOptimizationDealPackHtml,
} from "@/lib/source/contract-optimization";
import { assembleDealPack } from "@/lib/source/exports/deal-pack/assemble-deal-pack";

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

export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    return await handleGet(req, ctx);
  } catch (err) {
    console.error(
      "[GET /api/v1/source/:eventId/deal-pack] unhandled error",
      err,
    );
    return Response.json(
      {
        error: "deal_pack_unavailable",
        detail:
          err instanceof Error
            ? err.message
            : "Deal Pack export crashed before producing a response.",
        ops: "Check Vercel function logs for the underlying error; this route requires the Node.js runtime and the Source data plane.",
      },
      { status: 503 },
    );
  }
}

async function handleGet(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId } = await params;
  const url = new URL(req.url);
  const formatParam = url.searchParams.get("format") ?? "html";
  if (formatParam !== "html") {
    return Response.json(
      {
        error: "invalid_format",
        detail: `Deal Pack only supports format=html today (got "${formatParam}").`,
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

  // Auth gate — mirrors the per-artifact render route.
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
        detail: "Source artifact rights are required to export the Deal Pack.",
      },
      { status: 403 },
    );
  }

  const generatedAt = new Date().toISOString();
  if (
    isSkyHarborContractOptimizationEvent({
      activeClientKey: activeClient?.key,
      eventCode: ctx.event.code,
      eventName: ctx.event.name,
    })
  ) {
    const html = renderContractOptimizationDealPackHtml({
      tenantName: "Airline Demo",
      eventCode: "SKYH-AMS-CONTRACT-OPT-2026",
      eventName: ctx.event.name,
      generatedAt,
      profile: buildContractOptimizationMveProfile(
        buildSkyHarborAmsExistingContractInput({
          sourceEventId: ctx.event.id,
          tenantKey: activeClient?.key ?? "skyharbor-air",
        }),
      ),
    });
    return new Response(Buffer.from(html, "utf8") as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `attachment; filename="${contractOptimizationDealPackFilename({
          eventCode: "SKYH-AMS-CONTRACT-OPT-2026",
          generatedAt,
        })}"`,
        "cache-control": "no-store",
        "x-source-event-code": "SKYH-AMS-CONTRACT-OPT-2026",
        "x-source-deal-pack-format": "html",
        "x-source-deal-pack-motion": "contract-optimization",
      },
    });
  }

  let result;
  try {
    result = await assembleDealPack(ctx, generatedAt);
  } catch (err) {
    console.error(
      "[GET /api/v1/source/:eventId/deal-pack] assemble error",
      err,
    );
    return Response.json(
      {
        error: "assemble_failed",
        detail:
          err instanceof Error ? err.message : "Deal Pack assembly failed.",
      },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(result.html, "utf8");
  return new Response(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `attachment; filename="${result.filename}"`,
      "cache-control": "no-store",
      "x-source-event-code": ctx.event.code,
      "x-source-deal-pack-format": "html",
    },
  });
}
