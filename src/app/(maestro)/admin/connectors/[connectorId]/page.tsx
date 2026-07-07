// Wave 1 PR-3 (2026-05-30) · Per SETUP_AUDIT_2026-05-30_VERDICT §5.3, the
// connector detail page now renders inside AdminCanonShellV2 + AdminSidebar
// (canonical Setup IA), not the legacy SubNavStrip.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { ConnectorDetailPage } from '@/components/setup/ConnectorDetailPage';
import { getSetupConnectorDetail } from '@/lib/setup/shell-setup-fixture';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

interface Props {
  params: Promise<{ connectorId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { connectorId } = await params;
  const detail = getSetupConnectorDetail(connectorId);
  return { title: detail ? `${detail.name} · Admin` : 'Connector · Admin' };
}

export default async function Page({ params }: Props) {
  const { connectorId } = await params;
  const detail = getSetupConnectorDetail(connectorId);
  if (!detail) notFound();
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to connectors"
          primaryActionHref="/admin/connectors"
        />
      }
    >
      <ConnectorDetailPage detail={detail} />
    </AdminCanonShellV2>
  );
}
