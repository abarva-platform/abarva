import { SourcePortfolioPage } from "@/components/source/SourcePortfolioPage";
import { SourcePortfolioBookPage } from "@/components/source/SourcePortfolioBookPage";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { listSourcingEvents } from "@/lib/source/queries";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { loadSourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";

export const metadata = { title: "Source Portfolio · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * The Source portfolio book. This is the canonical `/source` landing surface;
 * old queue links redirect here so users do not enter a second Source home.
 */
export default async function SourcePortfolioRoute({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string; demo?: string }>;
}) {
  const [events, params, activeClient, tenancy] = await Promise.all([
    listSourcingEvents(),
    searchParams,
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const governedSnapshot = activeClient?.key
    ? await loadSourceV4WorkspaceSnapshot(activeClient.key).catch(() => null)
    : null;
  const sourceAccessPolicy =
    activeClient && tenancy
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
        }).catch(() => null)
      : null;
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  // source_analytics · the redesigned "Your sourcing book" home. Platform
  // default ON: every Source tenant should render the realigned book. The table
  // fallback remains only as emergency rollback plumbing.
  const sourceAnalyticsEnabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? null,
      clientId: activeClient?.id ?? null,
    },
    "source_analytics",
  );
  const canViewFinancialValues =
    sourceAccessPolicy?.canViewFinancialData === true;

  if (sourceAnalyticsEnabled) {
    return (
      <SourcePortfolioBookPage
        events={events}
        tenantName={activeClientDisplayName}
        canViewFinancialValues={canViewFinancialValues}
        governedSnapshot={governedSnapshot}
      />
    );
  }

  return (
    <SourcePortfolioPage
      events={events}
      searchParams={params}
      tenantName={activeClientDisplayName}
      canViewFinancialValues={canViewFinancialValues}
    />
  );
}
