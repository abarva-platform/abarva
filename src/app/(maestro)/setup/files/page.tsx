import { AdminCanonShellV2 } from "@/components/admin/AdminCanonShellV2";
import { WorkspaceExplorer } from "@/components/workspace-explorer/WorkspaceExplorer";
import { resolveAdminTenant } from "@/lib/admin/admin-tenant";
import { requireTenancy } from "@/lib/auth/tenancy";
import { listTenantVaultWorkspaceItems } from "@/lib/workspace-explorer/tenant-vault-adapter";

export const metadata = { title: "All Files | AbarVa Setup" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SetupFilesPage() {
  const [tenant, tenancy] = await Promise.all([
    resolveAdminTenant(),
    requireTenancy(),
  ]);
  const items = await listTenantVaultWorkspaceItems(tenancy);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <WorkspaceExplorer
        eyebrow={`${tenant.tenantName} · Tenant vault`}
        title="All files"
        backHref="/admin/setup"
        backLabel="Back to setup"
        items={items}
      />
    </AdminCanonShellV2>
  );
}
