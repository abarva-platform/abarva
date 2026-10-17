// Admin → Rate cards. A workspace admin loads and approves the workspace's own
// rate card here, once, before any Move; every Moves estimate then prices on
// it. The /admin layout already restricts this tree to platform admins and
// workspace admins; the import and approve routes re-check the same rule.
import { connection } from "next/server";

import { RateCardManager, type RateCardRead } from "@/components/admin/RateCardManager";
import { AppShell } from "@/components/shell/AppShell";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { CLIENT_ENTERPRISE_RATE_CARD_CODE } from "@/lib/pricing/governed-load/constants";
import { listRateCardLines, listRateCardVersions } from "@/lib/pricing/rate-card-repository";
import { loadCommittedRateCardCodes } from "@/lib/pricing/moves-workflow/rom-reference";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const metadata = { title: "Rate cards | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function readCard(tenantKey: string): Promise<RateCardRead> {
  try {
    const versions = await listRateCardVersions("client", tenantKey, CLIENT_ENTERPRISE_RATE_CARD_CODE);
    const current = versions.find((v) => v.is_current && v.status === "approved") ?? null;
    const lines = current ? await listRateCardLines(current.id) : [];
    return {
      status: "ready",
      current: current
        ? { version: current.version, approvedAt: current.approved_at, approvalRationale: current.approval_rationale }
        : null,
      lines: lines.map((l) => ({
        roleOrBandRef: l.role_or_band_ref,
        level: l.level,
        providerRef: l.provider_ref,
        locationRef: l.location_ref,
        unit: l.unit,
        rateValue: l.rate_value,
        currency: l.currency,
      })),
      history: versions.slice(0, 8).map((v) => ({ version: v.version, status: v.status, approvedAt: v.approved_at })),
    };
  } catch {
    // A failed read must never look like "no card loaded".
    return { status: "error" };
  }
}

export default async function AdminRateCardsPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const card = await readCard(canonicalTenantKey(tenant.clientKey));
  return (
    <AppShell surface="setup" topBarProps={{ tenantName: tenant.tenantName, context: "Rate cards" }}>
      <RateCardManager tenantName={tenant.tenantName} card={card} codes={loadCommittedRateCardCodes()} />
    </AppShell>
  );
}
