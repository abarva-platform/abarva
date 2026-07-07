// Wave 1 PR-3 (2026-05-30) · Per SETUP_AUDIT_2026-05-30_VERDICT §5.5, the
// policies page now renders inside AdminCanonShellV2 + AdminSidebar
// (canonical Setup IA), not the legacy SubNavStrip.
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { SetupPoliciesPage } from '@/components/setup/SetupPoliciesPage';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const metadata = { title: 'Admin · Policies · AbarVa' };

export default async function AdminPoliciesPage() {
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open policies"
          primaryActionHref="/admin/policies"
        />
      }
    >
      <SetupPoliciesPage />
    </AdminCanonShellV2>
  );
}
