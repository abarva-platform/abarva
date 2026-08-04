import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkspaceClient } from "./WorkspaceClient";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { sourceV4CubeUiCatalogForAgent } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { loadSourceWorkspacePortfolio } from "./live/portfolioAdapter";

export const metadata: Metadata = {
  title: "Source Workspace · Live",
};

export const dynamic = "force-dynamic";

// SkyHarbor's demo dataset runs on a synthetic "current" date (2027-06-30),
// documented in src/lib/source/data-model/types.ts — the real-world clock
// would put every renewal/notice calculation on the wrong side of "today."
// Every other tenant defaults to the real current date. `?asOf=` overrides
// either, matching /source/vendor-portfolio's existing convention.
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
  searchParams: Promise<{ asOf?: string }>;
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

  const [activeClient, params] = await Promise.all([
    getActiveClientRow().catch(() => null),
    searchParams,
  ]);

  const tenantKey = activeClient?.key ?? tenancy.clientKey ?? "";
  const defaultAsOf = tenantKey.includes("skyharbor")
    ? SKYHARBOR_SYNTHETIC_AS_OF
    : new Date().toISOString();
  const asOfDateIso = params.asOf?.trim() || defaultAsOf;

  const portfolio = tenantKey
    ? await loadSourceWorkspacePortfolio(tenantKey, asOfDateIso)
    : {
        tenantKey: "",
        asOfDateIso,
        semanticLayer: sourceV4CubeUiCatalogForAgent(),
        contracts: [],
        vendors: [],
        applicationScope: [],
        initiativeDependencies: [],
        isEmpty: true,
        reads: {
          contracts: "missing" as const,
          vendors: "missing" as const,
          applicationScope: "missing" as const,
          initiativeDependencies: "missing" as const,
        },
      };

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <WorkspaceClient portfolio={portfolio} tenantName={tenantName} />
    </div>
  );
}
