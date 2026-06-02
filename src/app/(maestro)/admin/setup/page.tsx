import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupDataLoadCenter } from '@/components/admin/SetupDataLoadCenter';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { buildSetupDataLoadCenterModel } from '@/lib/admin/setup-data-load-center';

export const metadata = { title: 'Data Load Center | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSetupDataLoadCenterPage() {
  const tenant = await resolveAdminTenant();
  const model = buildSetupDataLoadCenterModel({
    clientId: tenant.clientId,
    clientKey: tenant.clientKey,
    tenantName: tenant.tenantName,
  });

  // The Studio renders its own calm hero (eyebrow + serif H1 + one-line
  // summary strip), so an EditorialCanvas wrapper would double the title.
  // Mount the Studio directly inside the shell for a single, calm header.
  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <SetupDataLoadCenter model={model} />
    </AdminCanonShellV2>
  );
}
