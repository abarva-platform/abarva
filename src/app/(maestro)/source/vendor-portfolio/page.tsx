import { redirect } from "next/navigation";
import { SourceVendorPortfolioPage } from "@/components/source/SourceVendorPortfolioPage";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { listContractVendor360 } from "@/lib/source/data-model/read-adapter";

export const metadata = {
  title: "Vendor & Contract Portfolio · Source · AbarVa",
};
export const dynamic = "force-dynamic";

/**
 * Vendor & Contract Portfolio — first slice of the new cross-domain Source
 * data model wired into a real page (section 2 of the recommended 8-section
 * Source workspace restructure). Reads source.contract_vendor_360 only;
 * never writes to it, never copies its facts into a Source-owned table.
 *
 * `asOf` accepts an optional override so a demo tenant on a synthetic
 * timeline (e.g. SkyHarbor's fictional 2027 scenario) can be driven against
 * its own "current" date instead of the real-world clock — the renewal-
 * exposure math is wrong against the wrong as-of date, so this must be
 * explicit, not inferred. Defaults to the real current date for every other
 * tenant.
 */
export default async function SourceVendorPortfolioRoute({
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
    <SourceVendorPortfolioPage
      rows={rows}
      tenantName={tenantName}
      asOfDateIso={asOfDateIso}
    />
  );
}
