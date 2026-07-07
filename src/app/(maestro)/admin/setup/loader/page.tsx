import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { AdminLoaderClient } from "@/components/setup/loader/AdminLoaderClient";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";

export const metadata = { title: "Load Context | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin Loader — intelligent context loader.
 * Drop anything → preserve (Gate 0) → understand (parse + map + Steward) →
 * review → commit via the governed bulk pipeline. See docs/build/setup-admin-loader/.
 */
export default async function AdminContextLoaderPage() {
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <AdminLoaderClient clientId={tenant.clientId} tenantName={tenant.tenantName} />
    </AdminCanonShellV2>
  );
}
