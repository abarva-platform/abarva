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
const SOURCE_WORKSPACE_PORTFOLIO_CACHE_TTL_MS = 60_000;

type PortfolioCacheEntry = {
  readonly expiresAt: number;
  readonly value: Promise<{
    readonly portfolio: SourceWorkspacePortfolioData;
    readonly sourceProviderKey: SourceWorkspaceProviderMode;
  }>;
};

const portfolioCache = new Map<string, PortfolioCacheEntry>();

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
  const asOfDateIso =
    requestUrl.searchParams.get("asOf")?.trim() ||
    SOURCE_WORKSPACE_DEFAULT_AS_OF;
  const { value, cacheState } = loadCachedPortfolio({
    tenantKey,
    asOfDateIso,
    requestedProvider,
  });
  const { portfolio, sourceProviderKey } = await value;

  return NextResponse.json({
    portfolio,
    sourceProviderKey,
  }, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Source-Portfolio-Cache": cacheState,
    },
  });
}

function loadCachedPortfolio({
  tenantKey,
  asOfDateIso,
  requestedProvider,
}: {
  readonly tenantKey: string;
  readonly asOfDateIso: string;
  readonly requestedProvider: SourceWorkspaceProviderMode | null;
}) {
  const cacheKey = [
    tenantKey,
    asOfDateIso,
    requestedProvider ?? "default",
  ].join("|");
  const now = Date.now();
  const cached = portfolioCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { value: cached.value, cacheState: "hit" as const };
  }

  const value = loadSourceWorkspacePortfolio(
    tenantKey,
    asOfDateIso,
    requestedProvider,
  )
    .then((portfolio) => ({
      portfolio,
      sourceProviderKey: sourceProviderModeFromPortfolio(portfolio),
    }))
    .catch((error) => {
      portfolioCache.delete(cacheKey);
      throw error;
    });

  portfolioCache.set(cacheKey, {
    expiresAt: now + SOURCE_WORKSPACE_PORTFOLIO_CACHE_TTL_MS,
    value,
  });
  return { value, cacheState: "miss" as const };
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
