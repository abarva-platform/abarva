import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { ContextBar } from '@/components/admin/ContextBar';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { listInstrumentTemplates } from '@/lib/instruments/authoring';
import { InstrumentAdminClient } from './InstrumentAdminClient';

export const metadata = {
  title: 'Instruments | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInstrumentsPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const templates = await listInstrumentTemplates({ limit: 100 }).catch(() => []);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / Instruments"
        title="Instruments"
        subtitle="Versioned discovery instruments, review workflow, depth status, and downloadable render formats."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Authoring"
          agent="Steward"
          data={`${templates.length} records`}
          liveStatus="Live"
          liveStatusKind="live"
        />
        <InstrumentAdminClient initialTemplates={templates} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
