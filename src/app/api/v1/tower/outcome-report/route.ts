// GET /api/v1/tower/outcome-report?format=docx|xlsx[&client=<key>]
//
// G8 — the Control Tower surface produced nothing downloadable. This
// route assembles the active tenant's real Tower substrate (tracked
// initiatives, their measurement model / KPIs, vendor portfolio,
// realized-vs-forecast posture, 90-day activity) into an outcome /
// measurement report and streams it back as a DOCX or XLSX download.
//
// GET (not POST) so the Tower page download button can be a plain
// anchor — no client-side fetch + Blob plumbing.
//
// Auth: requireTenancy + program-access policy (any access level other
// than no_program_access), with a canonical-client-admin fallback for
// internal pilot accounts that have no resolvable active client — same
// shape the Source render routes use.
//
// No-fabrication contract: the payload assembler reads only loaded
// substrate; for a thin tenant the renderers emit an honest sparse
// report. Nothing here invents counts or figures.

import type { NextRequest } from "next/server";
import { Packer } from "docx";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import {
  canonicalClientDisplayName,
  inferClientKeyFromEmail,
} from "@/lib/client-config";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";
import {
  listInitiativesForClient,
  listVendorsForClient,
  listKpisForClient,
} from "@/lib/admin/ai-initiatives/queries";
import { buildTowerBandMetrics } from "@/lib/tower/band-metrics-view";
import { resolveTowerToday } from "@/lib/tower/today-resolution";
import {
  DOCX_CONTENT_TYPE,
  XLSX_CONTENT_TYPE,
  buildTowerOutcomeReportPayload,
  renderTowerOutcomeReportDocx,
  renderTowerOutcomeReportXlsx,
  type TowerOutcomeKpiInput,
} from "@/lib/tower/exports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function isSameClientAdminFallback(
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
  activeClient: Awaited<ReturnType<typeof getActiveClientRow>>,
): boolean {
  if (!currentUser || !activeClient) return false;
  const metadataClientKey = appClientKeyForTenant(
    currentUser.metadataClientKey,
  );
  const emailClientKey = inferClientKeyFromEmail(currentUser.email);
  const isSameClient =
    metadataClientKey === activeClient.key ||
    emailClientKey === activeClient.key;
  const isAdminLike =
    currentUser.primaryRole === "maestro" ||
    isCanonicalClientAdminEmail(currentUser.email);
  return isSameClient && isAdminLike;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "docx").toLowerCase();
  const requestedClientKey = url.searchParams.get("client") ?? undefined;

  if (format !== "docx" && format !== "xlsx") {
    return Response.json(
      {
        error: "unsupported_format",
        detail: `format must be "docx" or "xlsx"; received "${format}".`,
      },
      { status: 400 },
    );
  }

  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const [activeClient, currentUser] = await Promise.all([
    getActiveClientRow(requestedClientKey).catch(() => null),
    getCurrentUser().catch(() => null),
  ]);

  // Authorization: a caller needs Tower (program) access for the active
  // tenant, OR — when no active client resolves — be a canonical client
  // admin (internal pilot account).
  let canExport = false;
  if (tenancy && activeClient && tenancy.clientId === activeClient.id) {
    const policy = await loadUserProgramAccessPolicy(tenancy).catch(() => null);
    canExport = Boolean(policy && policy.accessLevel !== "no_program_access");
  }
  if (
    !canExport &&
    activeClient &&
    isSameClientAdminFallback(currentUser, activeClient)
  ) {
    canExport = true;
  }
  if (
    !canExport &&
    !activeClient &&
    isCanonicalClientAdminEmail(currentUser?.email)
  ) {
    canExport = true;
  }
  if (!canExport) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: "forbidden",
        detail:
          "Control Tower access is required to export the outcome report.",
      },
      { status: 403 },
    );
  }

  if (!activeClient) {
    return Response.json(
      {
        error: "no_active_client",
        detail: "No active client could be resolved for the outcome report.",
      },
      { status: 404 },
    );
  }

  // Load the real Tower substrate. Each loader is tenant-scoped by
  // client id and fails soft to an empty set, so a thin tenant yields a
  // valid (sparse) report rather than a 500.
  const clientId = activeClient.id;
  const [initiatives, vendors, kpis] = await Promise.all([
    listInitiativesForClient(clientId).catch(() => []),
    listVendorsForClient(clientId).catch(() => []),
    listKpisForClient(clientId).catch(() => []),
  ]);

  const towerToday = resolveTowerToday();
  const generatedAt = new Date().toISOString();
  const tenantName =
    canonicalClientDisplayName({
      key: activeClient.key,
      name: activeClient.name,
    }) ?? activeClient.name;

  const bandMetrics = buildTowerBandMetrics(
    initiatives,
    vendors,
    towerToday,
    "value",
  );

  const kpiInputs: TowerOutcomeKpiInput[] = kpis.map((k) => ({
    initiativeId: k.initiativeId,
    initiativeDisplayId: k.initiativeDisplayId,
    initiativeName: k.initiativeName,
    kpiName: k.kpiName,
    kpiUnit: k.kpiUnit,
    quarter: k.quarter,
    kpiValue: k.kpiValue,
    targetValue: k.targetValue,
    peerMedian: k.peerMedian,
    confidenceLevel: k.confidenceLevel,
  }));

  const payload = buildTowerOutcomeReportPayload({
    tenantName,
    tenantKey: activeClient.key,
    generatedAt,
    towerToday,
    initiatives,
    vendors,
    kpis: kpiInputs,
    bandMetrics,
  });

  const datePart = generatedAt.slice(0, 10);

  try {
    if (format === "docx") {
      const document = renderTowerOutcomeReportDocx(payload);
      const buffer = await Packer.toBuffer(document);
      return new Response(buffer as unknown as ArrayBuffer, {
        status: 200,
        headers: {
          "content-type": DOCX_CONTENT_TYPE,
          "content-disposition": `attachment; filename="tower-outcome-report__${activeClient.key}__${datePart}.docx"`,
          "cache-control": "no-store",
          "x-tower-report-format": "docx",
          "x-tower-report-tenant": activeClient.key,
        },
      });
    }

    const workbook = renderTowerOutcomeReportXlsx(payload);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": XLSX_CONTENT_TYPE,
        "content-disposition": `attachment; filename="tower-outcome-report__${activeClient.key}__${datePart}.xlsx"`,
        "cache-control": "no-store",
        "x-tower-report-format": "xlsx",
        "x-tower-report-tenant": activeClient.key,
      },
    });
  } catch (err) {
    console.error("[GET /api/v1/tower/outcome-report] renderer error", err);
    return Response.json(
      {
        error: "render_failed",
        detail:
          err instanceof Error ? err.message : "outcome-report renderer failed",
      },
      { status: 500 },
    );
  }
}
