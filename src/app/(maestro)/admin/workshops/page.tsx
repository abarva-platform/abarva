import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { ContextBar } from '@/components/admin/ContextBar';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { listWorkshopTemplates } from '@/lib/workshops/authoring';
import { WorkshopAdminClient } from './WorkshopAdminClient';

export const metadata = {
  title: 'Workshops | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminWorkshopsPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const templates = await listWorkshopTemplates({ limit: 100 }).catch(() => []);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / Workshops"
        title="Workshops"
        subtitle="Versioned workshop templates, review workflow, timed agenda slots, and facilitator-pack rendering."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Authoring"
          agent="Steward"
          data={`${templates.length} records`}
          liveStatus="Live"
          liveStatusKind="live"
        />
        <WorkshopAdminClient initialTemplates={templates} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
