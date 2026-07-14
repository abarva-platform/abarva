import { NextRequest, NextResponse } from "next/server";

import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { cachedInventorySnapshot } from "@/app/(maestro)/admin/_cached-helpers";
import {
  canonicalClientDisplayName,
  getClientOption,
} from "@/lib/client-config";
import { getTenantSourceFiles } from "@/lib/context-ingestion/tenant-context-read-model";
import {
  type HomeSummarySnapshotMode,
} from "@/lib/home/home-summary-snapshot";
import { buildHomeRuntimeSummarySnapshot } from "@/lib/home/home-summary-runtime";
import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";
import { getHomeV7ContextBrowser } from "@/lib/home/v7-context-browser";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_CLIENT_BY_CANONICAL: Record<string, string> = {
  "apex-retail": "apexretail",
  "first-capital": "firstcapital",
  "lakeshore-holdings": "lakeshore",
  "lakeshore-industries": "lakeshore",
  "meridian-health": "meridian",
  "skyharbor-air": "skyharbor",
};

export async function GET(req: NextRequest) {
  const tenantParam =
    req.nextUrl.searchParams.get("tenantKey") ??
    req.nextUrl.searchParams.get("client") ??
    "skyharbor";
  const requestedMode = req.nextUrl.searchParams.get("mode");
  const mode: HomeSummarySnapshotMode =
    requestedMode === "candidate_preview"
      ? "candidate_preview"
      : "active_home_context";

  const tenant = await resolveTenant({
    requestedClient: tenantParam,
    surfaceClientKey: tenantParam,
    allowFallback: false,
  }).catch(() => null);
  const canonicalTenantKey = tenant?.canonicalKey ?? tenantParam;
  const appClientKey =
    APP_CLIENT_BY_CANONICAL[canonicalTenantKey] ?? tenantParam;
  const clientOption = getClientOption(appClientKey);
  const displayName =
    canonicalClientDisplayName({
      key: appClientKey,
      name: tenant?.displayName ?? clientOption?.name,
    }) ??
    tenant?.displayName ??
    clientOption?.name ??
    canonicalTenantKey;
  const browser =
    (await getHomeV7ContextBrowser({ tenantKey: appClientKey }).catch(
      () => null,
    )) ?? getHomeV6ContextBrowser(appClientKey);
  const setupControl =
    clientOption && tenant?.clientId
      ? buildAdminSetupControlReadModel({
          tenantKey: clientOption.id,
          displayName,
          coverName: clientOption.name,
          snapshot: await cachedInventorySnapshot(
            clientKeyToInventorySubstrateKey(clientOption.id),
          ).catch(() => null),
          sourceFiles: await getTenantSourceFiles(tenant.clientId).catch(
            () => [],
          ),
        })
      : null;

  const snapshot = await buildHomeRuntimeSummarySnapshot({
    tenantId: tenant?.clientId ?? null,
    tenantKey: canonicalTenantKey,
    displayName,
    industry: clientOption?.vertical ?? null,
    mode,
    browser,
    setupControl,
  });

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
