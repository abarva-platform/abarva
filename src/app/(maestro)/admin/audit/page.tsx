// Wave 1 PR-3 (2026-05-30) · Per SETUP_AUDIT_2026-05-30_VERDICT §5.5, the
// audit page now renders inside AdminCanonShellV2 + AdminSidebar (canonical
// Setup IA), not the legacy SubNavStrip.
//
// Wave 1 PR-6 (2026-05-30) · `?source=<source>` from the landing-page
// AuditRibbon click is forwarded as a server-side filter into the audit
// page. Unknown / missing values render the full list — no 4xx, no
// redirect.
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import { SetupAuditPage, isAuditSourceFilter } from '@/components/setup/SetupAuditPage';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';

export const metadata = { title: 'Setup · Audit log · AbarVa' };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawSource = params.source;
  const candidate = Array.isArray(rawSource) ? rawSource[0] : rawSource;
  const filterSource = isAuditSourceFilter(candidate) ? candidate : null;
  const tenant = await resolveAdminTenant();
  return (
    <AdminCanonShellV2
      tenantName={tenant.tenantName}
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Review audit"
          primaryActionHref="/admin/audit"
        />
      }
    >
      <SetupAuditPage filterSource={filterSource} />
    </AdminCanonShellV2>
  );
}
