import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { NotificationsInboxPage } from '@/components/admin/NotificationsInboxPage';
import { AgentRail } from '@/components/admin/AgentRail';
import { getActiveClientRow } from '@/lib/active-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInboxRoute() {
  const client = await getActiveClientRow();

  return (
    <AdminCanonShellV2
      tenantName={client?.name ?? undefined}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Notification policy"
          primaryActionHref="/admin/users-access/notifications"
        />
      }
    >
      <NotificationsInboxPage />
    </AdminCanonShellV2>
  );
}
