import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { SetupDataLoadCenter } from "@/components/admin/SetupDataLoadCenter";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { getClientOption } from "@/lib/client-config";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getSetupInventorySnapshot } from "@/lib/admin/setup-data-broker";
import { buildLoadStudioView } from "@/lib/admin/setup-load-studio-view";

export const metadata = { title: "Data Loads | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSetupDataLoadCenterPage() {
  const tenant = await resolveAdminTenant();

  // ── Real per-tenant inventory (same broker the /admin landing and
  //    Data Trust use). Falls back to a calm empty state if the
  //    substrate is unreachable or the tenant has loaded nothing —
  //    never an invented number (build-for-pilot doctrine). ──────────
  const brokerTenantKey = clientKeyToInventorySubstrateKey(tenant.clientKey);
  const snapshot = brokerTenantKey
    ? await getSetupInventorySnapshot(brokerTenantKey).catch(() => null)
    : null;

  const clientOption = getClientOption(tenant.clientKey);
  const view = buildLoadStudioView({
    tenantName: tenant.tenantName,
    vertical: clientOption?.vertical ?? null,
    snapshot,
  });

  // The Studio renders its own calm identity band (mark + serif H1 +
  // summary), so mounting it directly inside the shell keeps a single,
  // calm header rather than doubling the title.
  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <SetupDataLoadCenter view={view} clientId={tenant.clientId} />
    </AdminCanonShellV2>
  );
}
