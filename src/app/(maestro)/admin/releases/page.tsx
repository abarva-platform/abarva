import { connection } from 'next/server';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { ContextBar } from '@/components/admin/ContextBar';
import { AgentRail } from '@/components/admin/AgentRail';
import { ReleaseLedgerSurface } from '@/components/admin/releases/ReleaseLedgerSurface';
import { buildReleaseLedgerView } from '@/lib/admin/release-ledger';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const metadata = {
  title: 'Release Ledger | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminReleaseLedgerPage() {
  await connection();
  const generatedAt = new Date().toISOString();
  const [tenant, view] = await Promise.all([
    resolveAdminTenant(),
    Promise.resolve(buildReleaseLedgerView()),
  ]);

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open release policy"
          primaryActionHref="/admin/releases"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Admin · Release Control"
        title="Release Ledger"
        subtitle="Plain-English record of what changed, which layer moved, who is affected, how it was validated, and how it can be rolled back."
      >
        <ContextBar
          tenant={tenant.tenantName}
          mode="Release governance"
          agent="Steward"
          data="docs/releases/records"
          liveStatus="Markdown-backed audit ledger"
          liveStatusKind="partial"
        />
        <ReleaseLedgerSurface view={view} generatedAt={generatedAt} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
