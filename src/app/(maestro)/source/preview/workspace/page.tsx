import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceClient } from "./WorkspaceClient";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { createEmptySourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";
import { evaluateContractCategoryQuality } from "@/lib/source/data-model/contract-category-quality";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  buildSourceVendor360Cockpit,
  loadSourceWorkspacePortfolio,
  type SourceWorkspaceProviderMode,
} from "./live/portfolioAdapter";

export const metadata: Metadata = {
  title: "Source Workspace · Live",
};

export const dynamic = "force-dynamic";

// SkyHarbor's demo dataset runs on a synthetic "current" date (2027-06-30),
// documented in src/lib/source/data-model/types.ts — the real-world clock
// would put every renewal/notice calculation on the wrong side of "today."
// Every other tenant defaults to the real current date. `?asOf=` overrides
// either, preserving the legacy Vendor 360 as-of convention.
const SKYHARBOR_SYNTHETIC_AS_OF = "2027-06-30T00:00:00Z";

/**
 * /source/preview/workspace — Finder-style explorer + native analytical
 * canvas + contextual Ask aVa, bound to the governed Source data plane
 * (source.contract_360, source.vendor_contract_portfolio,
 * source.contract_application_scope, source.contract_initiative_dependency).
 * Reads only; never writes. See docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md
 * for what was fabricated in the earlier illustrative build and how each
 * figure here now traces back to a real row or a governed pure function.
 */
export default async function SourceWorkspacePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    asOf?: string;
    client?: string;
    contractId?: string;
    contractTab?: string;
    provider?: string;
    sourceProvider?: string;
    tab?: string;
  }>;
}) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === "unauthenticated") {
      redirect("/sign-in");
    }
    throw err;
  }

  const params = await searchParams;
  const requestedClient = params.client?.trim() || null;
  const requestedContractId = params.contractId?.trim() || null;
  const requestedContractTab =
    params.contractTab?.trim() || params.tab?.trim() || null;
  const requestedSourceProvider = sourceProviderOverrideFromRequest(
    params.sourceProvider ?? params.provider,
  );
  const tenant = await resolveTenant({
    requestedClient,
    allowFallback: !requestedClient,
  }).catch(() => null);
  const activeClient = tenant
    ? await getActiveClientRow(tenant.appClientKey).catch(() => null)
    : null;

  const tenantKey =
    activeClient?.key ??
    tenant?.appClientKey ??
    (!requestedClient ? tenancy.clientKey : "") ??
    "";
  const defaultAsOf = tenantKey.includes("skyharbor")
    ? SKYHARBOR_SYNTHETIC_AS_OF
    : new Date().toISOString();
  const asOfDateIso = params.asOf?.trim() || defaultAsOf;
  const emptyV4Snapshot = createEmptySourceV4WorkspaceSnapshot(
    asOfDateIso,
    tenantKey.includes("meridian")
      ? {
          datasetId: "meridian-health-source-v1-202608",
          datasetLabel: "Meridian Health Source v1",
        }
      : undefined,
  );
  const emptyWorkspaceDiagnostics = {
    datasetLabel: emptyV4Snapshot.datasetLabel,
    datasetId: emptyV4Snapshot.datasetId,
    datasetVersion: emptyV4Snapshot.datasetVersion,
    analyticsProvider: emptyV4Snapshot.analyticsProvider,
    activeLoadRunId: emptyV4Snapshot.activeLoadRunId,
    asOfDateIso: emptyV4Snapshot.asOfDateIso,
    v4ContractCount: 0,
    v4VendorCount: 0,
    legacyContractCount: 0,
    legacyVendorCount: 0,
    exploreProvider: "LegacySourceContract360Provider" as const,
    exploreMatchesV4: true,
    mismatchWarning: null,
  };
  const emptyReads = {
    contracts: "missing" as const,
    vendors: "missing" as const,
    applicationScope: "missing" as const,
    initiativeDependencies: "missing" as const,
  };

  const portfolio = tenantKey
    ? await loadSourceWorkspacePortfolio(
        tenantKey,
        asOfDateIso,
        requestedSourceProvider,
      )
    : {
        tenantKey: "",
        asOfDateIso,
        semanticLayer: sourceV4CubeUiCatalogForAgent(),
        v4Snapshot: emptyV4Snapshot,
        categoryQuality: evaluateContractCategoryQuality([]),
        workspaceDiagnostics: emptyWorkspaceDiagnostics,
        cockpit: buildSourceVendor360Cockpit({
          contracts: [],
          vendors: [],
          applicationScope: [],
          initiativeDependencies: [],
          v4Snapshot: emptyV4Snapshot,
          workspaceDiagnostics: emptyWorkspaceDiagnostics,
          reads: emptyReads,
          asOfDateIso,
        }),
        contracts: [],
        vendors: [],
        applicationScope: [],
        initiativeDependencies: [],
        isEmpty: true,
        reads: emptyReads,
      };

  const tenantName =
    canonicalClientDisplayName({
      key: tenantKey,
      name: activeClient?.name ?? tenant?.displayName,
    }) ??
    tenant?.displayName ??
    "AbarVa Client";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <WorkspaceClient
        portfolio={portfolio}
        tenantName={tenantName}
        sourceClientKey={tenant?.appClientKey ?? activeClient?.key ?? tenantKey}
        initialContractId={requestedContractId}
        initialContractTab={requestedContractTab}
      />
    </div>
  );
}

function sourceProviderOverrideFromRequest(
  value?: string,
): SourceWorkspaceProviderMode | null {
  if (process.env.SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE !== "true") {
    return null;
  }
  const normalized = value?.trim();
  if (
    normalized === "legacy" ||
    normalized === "ecl_projection" ||
    normalized === "ecl_projection_db"
  ) {
    return normalized;
  }
  return null;
}
