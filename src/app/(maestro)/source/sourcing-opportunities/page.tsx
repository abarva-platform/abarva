import { redirect } from "next/navigation";
import { SourceSourcingOpportunitiesPage } from "@/components/source/SourceSourcingOpportunitiesPage";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { listContractVendor360 } from "@/lib/source/data-model/read-adapter";

export const metadata = { title: "Sourcing Opportunities · Source · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * Sourcing Opportunities — section 5 of the recommended Source workspace
 * restructure. Reads the same source.contract_vendor_360 rows as the Vendor
 * & Contract Portfolio page; ranking is computed client-side by
 * computeSourcingOpportunities (see that module for why this isn't a read
 * against a dedicated Postgres view).
 */
export default async function SourceSourcingOpportunitiesRoute({
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
  const asOfDateIso = params.asOf?.trim() || new Date().toISOString();

  const rows = tenantKey
    ? await listContractVendor360(tenantKey).catch(() => [])
    : [];

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  return (
    <SourceSourcingOpportunitiesPage
      rows={rows}
      tenantName={tenantName}
      asOfDateIso={asOfDateIso}
    />
  );
}
