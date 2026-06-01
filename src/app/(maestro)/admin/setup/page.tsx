import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
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

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow={`Setup · Data loads · ${tenant.tenantName}`}
        title="Data Load Center"
        subtitle="Pilot data onboarding in one place: access, consent, landing-zone upload, quarantine, validation, approval, load history, and the templates each data family unlocks."
      >
        <SetupDataLoadCenter model={model} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
