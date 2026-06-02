import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { ContextBar } from '@/components/admin/ContextBar';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { listTemplates } from '@/lib/templates/registry';
import { TemplatesAdminClient } from './TemplatesAdminClient';

export const metadata = {
  title: 'Templates | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminTemplatesPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const templates = await listTemplates({ limit: 100 }).catch(() => []);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / Templates"
        title="Templates"
        subtitle="Versioned Move and Source workflow templates with gate, artifact, review, and instantiation state."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Authoring"
          agent="Steward"
          data={`${templates.length} records`}
          liveStatus="Live"
          liveStatusKind="live"
        />
        <TemplatesAdminClient initialTemplates={templates} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
