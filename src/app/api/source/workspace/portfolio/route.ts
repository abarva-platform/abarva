import { NextResponse } from "next/server";
import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { SOURCE_V4_CUBE_AS_OF_DATE } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";
import {
  loadSourceWorkspacePortfolio,
  type SourceWorkspacePortfolioData,
  type SourceWorkspaceProviderMode,
} from "@/app/(maestro)/source/preview/workspace/live/portfolioAdapter";

export const dynamic = "force-dynamic";

const SOURCE_WORKSPACE_DEFAULT_AS_OF = `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`;

export async function GET(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === "unauthenticated") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "tenancy_unavailable" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const requestedClient = requestUrl.searchParams.get("client")?.trim() || null;
  const requestedClientKey = appClientKeyForTenant(requestedClient);
  if (requestedClient && !requestedClientKey) {
    return NextResponse.json({ error: "unknown_client" }, { status: 404 });
  }
  if (requestedClientKey && requestedClientKey !== tenancy.clientKey) {
    const access = await checkTenantAccessByKey(requestedClientKey);
    if (!access.ok) {
      const status =
        access.reason === "unauthenticated"
          ? 401
          : access.reason === "forbidden"
            ? 403
            : 404;
      return NextResponse.json({ error: access.reason }, { status });
    }
  }

  const activeClient = requestedClientKey
    ? null
    : await getActiveClientRow().catch(() => null);
  const tenantKey =
    requestedClientKey ?? activeClient?.key ?? tenancy.clientKey ?? "";
  if (!tenantKey) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }

  const requestedProvider = sourceProviderFromRequest(requestUrl);
  const portfolio = await loadSourceWorkspacePortfolio(
    tenantKey,
    requestUrl.searchParams.get("asOf")?.trim() ||
      SOURCE_WORKSPACE_DEFAULT_AS_OF,
    requestedProvider,
  );

  return NextResponse.json({
    portfolio,
    sourceProviderKey: sourceProviderModeFromPortfolio(portfolio),
  });
}

function sourceProviderFromRequest(
  requestUrl: URL,
): SourceWorkspaceProviderMode | null {
  if (process.env.SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE !== "true") {
    return null;
  }
  const normalized = (
    requestUrl.searchParams.get("sourceProvider") ??
    requestUrl.searchParams.get("provider") ??
    ""
  ).trim();
  if (
    normalized === "legacy" ||
    normalized === "ecl_projection" ||
    normalized === "ecl_projection_db"
  ) {
    return normalized;
  }
  return null;
}

function sourceProviderModeFromPortfolio(
  portfolio: SourceWorkspacePortfolioData,
): SourceWorkspaceProviderMode {
  if (
    portfolio.workspaceDiagnostics.exploreProvider === "EclProjectionDbProvider"
  ) {
    return "ecl_projection_db";
  }
  if (
    portfolio.workspaceDiagnostics.exploreProvider ===
    "EclProjectionCsvProvider"
  ) {
    return "ecl_projection";
  }
  return "legacy";
}
