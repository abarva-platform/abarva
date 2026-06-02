// Wave 1 PR-3 (2026-05-30) · Per SETUP_AUDIT_2026-05-30_VERDICT §5.3, the
// reconnect page now renders inside AdminCanonShellV2 + AdminSidebar
// (canonical Setup IA), not the legacy SubNavStrip.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { ConnectorReconnectPage } from '@/components/setup/ConnectorReconnectPage';
import { getReconnectableSetupConnectorDetail } from '@/lib/setup/shell-setup-fixture';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

interface Props {
  params: Promise<{ connectorId: string }>;
}

export const metadata: Metadata = { title: 'Reconnect · Admin' };

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = getReconnectableSetupConnectorDetail(connectorId);
  if (!detail) notFound();
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to connector"
          primaryActionHref={`/admin/connectors/${detail.id}`}
        />
      }
    >
      <ConnectorReconnectPage detail={detail} tenantName={tenant.tenantName} />
    </AdminCanonShellV2>
  );
}
