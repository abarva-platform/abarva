import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { NotificationsInboxPage } from '@/components/admin/NotificationsInboxPage';
import { AgentRail } from '@/components/admin/AgentRail';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInboxRoute() {
  const tenant = await resolveAdminTenant();

  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
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
