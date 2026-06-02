import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { ContextBar } from '@/components/admin/ContextBar';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { listPatterns } from '@/lib/corpus/authoring';
import { CorpusAdminClient } from './CorpusAdminClient';

export const metadata = {
  title: 'Corpus | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCorpusPage() {
  await connection();
  const tenant = await resolveAdminTenant();
  const patterns = await listPatterns({ limit: 100 }).catch(() => []);

  return (
    <AdminCanonShellV2 tenantName={tenant.tenantName}>
      <EditorialCanvas
        eyebrow="Admin / Corpus"
        title="Corpus"
        subtitle="Versioned patterns, review workflow, retrieval metadata, and publish state."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Authoring"
          agent="Steward"
          data={`${patterns.length} records`}
          liveStatus="Live"
          liveStatusKind="live"
        />
        <CorpusAdminClient initialPatterns={patterns} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
