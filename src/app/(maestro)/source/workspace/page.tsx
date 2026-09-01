import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { WorkspaceClient } from "../preview/workspace/WorkspaceClient";
import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  SOURCE_V4_CUBE_AS_OF_DATE,
  sourceV4CubeUiCatalogForAgent,
} from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { createEmptySourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";
import { evaluateContractCategoryQuality } from "@/lib/source/data-model/contract-category-quality";
import {
  appClientKeyForTenant,
  tenantProfileForClientKey,
} from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  buildSourceVendor360Cockpit,
  loadSourceWorkspacePortfolio,
  type SourceWorkspacePortfolioData,
  type SourceWorkspaceProviderMode,
} from "../preview/workspace/live/portfolioAdapter";

export const metadata: Metadata = {
  title: "Source Workspace · AbarVa",
};

export const dynamic = "force-dynamic";

// Source V4 and the contract-depth Source package carry a governed as-of date.
// Renewal and notice math must use that stable cut by default; `?asOf=`
// remains the operator override for explicit live-date comparisons.
const SOURCE_WORKSPACE_DEFAULT_AS_OF = `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`;

/**
 * /source/workspace — product Source workspace: native analytical canvas +
 * contextual Ask aVa, bound to the governed Source data plane
 * (source.contract_360, source.vendor_contract_portfolio,
 * source.contract_application_scope, source.contract_initiative_dependency).
 * Reads only; never writes. See docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md
 * for what was fabricated in the earlier illustrative build and how each
 * figure here now traces back to a real row or a governed pure function.
 */
export default async function SourceWorkspacePage({
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
  const requestedClientKey = appClientKeyForTenant(requestedClient);
  if (requestedClient && !requestedClientKey) {
    notFound();
  }
  if (requestedClientKey && requestedClientKey !== tenancy.clientKey) {
    const access = await checkTenantAccessByKey(requestedClientKey);
    if (!access.ok) {
      if (access.reason === "tenant_not_found") {
        notFound();
      }
      if (access.reason === "unauthenticated") {
        redirect("/sign-in");
      }
      return <SourceWorkspaceTenantAccessDenied />;
    }
  }

  const tenant = requestedClientKey
    ? null
    : await resolveTenant({ allowFallback: true }).catch(() => null);
  const activeClient = requestedClientKey
    ? null
    : tenant
      ? await getActiveClientRow(tenant.appClientKey).catch(() => null)
      : null;
  const requestedTenantProfile = requestedClientKey
    ? tenantProfileForClientKey(requestedClientKey)
    : null;

  const tenantKey =
    requestedClientKey ??
    activeClient?.key ??
    tenant?.appClientKey ??
    tenancy.clientKey ??
    "";
  const defaultAsOf = SOURCE_WORKSPACE_DEFAULT_AS_OF;
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

  const portfolioPromise = tenantKey
    ? loadSourceWorkspacePortfolio(
        tenantKey,
        asOfDateIso,
        requestedSourceProvider,
      )
    : Promise.resolve({
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
        impact: {
          evidenceCoverage: [],
          actionCandidates: [],
          claimCards: [],
          vendorPositions: [],
          storyline: [],
          avaGroundingBundles: [],
        },
        contracts: [],
        vendors: [],
        applicationScope: [],
        initiativeDependencies: [],
        isEmpty: true,
        reads: emptyReads,
      });

  const tenantName =
    canonicalClientDisplayName({
      key: tenantKey,
      name:
        activeClient?.name ??
        requestedTenantProfile?.displayName ??
        tenant?.displayName,
    }) ??
    requestedTenantProfile?.displayName ??
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
      <Suspense fallback={<SourceWorkspaceLoadingShell tenantName={tenantName} />}>
        <SourceWorkspaceDataBoundary
          portfolioPromise={portfolioPromise}
          tenantName={tenantName}
          tenantKey={tenantKey}
          initialContractId={requestedContractId}
          initialContractTab={requestedContractTab}
        />
      </Suspense>
    </div>
  );
}

async function SourceWorkspaceDataBoundary({
  portfolioPromise,
  tenantName,
  tenantKey,
  initialContractId,
  initialContractTab,
}: {
  portfolioPromise: Promise<SourceWorkspacePortfolioData>;
  tenantName: string;
  tenantKey: string;
  initialContractId?: string | null;
  initialContractTab?: string | null;
}) {
  const portfolio = await portfolioPromise;

  return (
    <WorkspaceClient
      portfolio={portfolio}
      tenantName={tenantName}
      sourceClientKey={tenantKey}
      sourceProviderKey={sourceProviderModeFromPortfolio(portfolio)}
      initialContractId={initialContractId}
      initialContractTab={initialContractTab}
    />
  );
}

function SourceWorkspaceLoadingShell({ tenantName }: { tenantName: string }) {
  return (
    <section
      aria-label="Source 360 is preparing"
      style={{
        minHeight: "100%",
        background: "#f5f1eb",
        color: "#0a0a0b",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 56,
          background: "#0a0a0b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 40px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 21,
            fontWeight: 600,
          }}
        >
          Abar<span style={{ color: "#2fbf8f" }}>Va</span>
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.62)",
          }}
        >
          Source 360
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,.62)",
          }}
        >
          {tenantName}
        </span>
      </div>
      <div style={{ padding: "28px 40px 40px" }}>
        <p
          style={{
            margin: "0 0 8px",
            color: "#0a7c63",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Source 360
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "Fraunces, Georgia, serif",
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: 0,
            lineHeight: 1.1,
          }}
        >
          Preparing the governed contract book.
        </h1>
        <p
          style={{
            margin: "10px 0 26px",
            color: "#5f5e5a",
            fontSize: 14,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Loading portfolio rows, vendor rollups, action candidates, and
          evidence coverage before the executive view opens.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(112px, 1fr))",
            border: "1px solid rgba(10,10,11,.22)",
            borderBottom: "3px solid #0a0a0b",
            background: "#f5f1eb",
            maxWidth: 920,
          }}
        >
          {[
            "Verdict",
            "Vendors",
            "Contracts",
            "Optimize",
            "Evidence",
            "Contract graph",
          ].map((label) => (
            <div
              key={label}
              style={{
                padding: "16px 18px",
                borderRight: "1px solid rgba(10,10,11,.22)",
                background: label === "Verdict" ? "#0a0a0b" : "#fff",
                color: label === "Verdict" ? "#fff" : "#5f5e5a",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
            gap: 12,
            maxWidth: 920,
          }}
        >
          {["Portfolio", "Evidence", "Actions"].map((label) => (
            <div
              key={label}
              style={{
                height: 92,
                border: "1px solid rgba(10,10,11,.12)",
                borderRadius: 7,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,.95), rgba(255,255,255,.7))",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  color: "#888780",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  marginTop: 18,
                  height: 10,
                  width: "72%",
                  borderRadius: 999,
                  background: "rgba(10,10,11,.12)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SourceWorkspaceTenantAccessDenied() {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "grid",
        placeItems: "center",
        padding: "48px 24px",
        background: "#f5f7fb",
      }}
    >
      <section
        role="status"
        aria-live="polite"
        style={{
          width: "min(560px, 100%)",
          border: "1px solid #d7deea",
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
          padding: 28,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            color: "#5d6b82",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Source workspace blocked
        </p>
        <h1
          style={{
            margin: 0,
            color: "#0f1f3d",
            fontSize: 28,
            lineHeight: 1.12,
            letterSpacing: 0,
          }}
        >
          This session cannot open the requested tenant.
        </h1>
        <p
          style={{
            margin: "14px 0 0",
            color: "#475569",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          No Source contracts, vendor rollups, claim cards, evidence, or aVa
          grounding bundles were loaded. Switch to an authorized tenant session
          before using this workspace.
        </p>
      </section>
    </div>
  );
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
