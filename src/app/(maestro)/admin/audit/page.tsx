// Wave 1 PR-3 (2026-05-30) · Per SETUP_AUDIT_2026-05-30_VERDICT §5.5, the
// audit page now renders inside AdminCanonShellV2 + AdminSidebar (canonical
// Setup IA), not the legacy SubNavStrip.
//
// Wave 1 PR-6 (2026-05-30) · `?source=<source>` from the landing-page
// AuditRibbon click is forwarded as a server-side filter into the audit
// page. Unknown / missing values render the full list — no 4xx, no
// redirect.
//
// Wave 2 PR-2 (2026-05-30) · Snowflake-style sub-nav tabs: Activity
// (default) · Isolation · Approvals. Isolation surfaces the new
// IsolationLane (STRESS-P0-006 triage). Approvals tab maps to the
// existing PR-6 source=approval filter so the two filter mechanisms
// coexist without collision.
//
// Wave 2 PR-E (2026-05-30) · P0 Apex-leak fix. SetupAuditPage now
// accepts `tenantSlug` and reads via `getAdminAuditEvents` (broker)
// instead of `AUDIT_LOG_FIXTURE`. Non-Apex tenants see an empty
// activity tab — they no longer leak Apex audit events.
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { AgentRail } from '@/components/admin/AgentRail';
import {
  SetupAuditPage,
  isAuditSourceFilter,
} from '@/components/setup/SetupAuditPage';
import {
  SetupAuditTabs,
  isSetupAuditTab,
  type SetupAuditTabKey,
} from '@/components/admin/SetupAuditTabs';
import { IsolationLane } from '@/components/admin/IsolationLane';
import { resolveAdminTenant } from '@/lib/admin/admin-tenant';
import { getIsolationPosture } from '@/lib/admin/broker/isolation-posture-broker';

export const metadata = { title: 'Admin · Audit log · AbarVa' };

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawTab = params.tab;
  const tabCandidate = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const activeTab: SetupAuditTabKey = isSetupAuditTab(tabCandidate)
    ? tabCandidate
    : 'activity';

  const rawSource = params.source;
  const sourceCandidate = Array.isArray(rawSource) ? rawSource[0] : rawSource;
  // When the user lands on ?tab=approvals we apply the PR-6 source filter
  // implicitly so the existing audit ribbon scopes itself to approval rows.
  // ?source=… continues to work independently of ?tab=… for back-compat.
  const explicitSource = isAuditSourceFilter(sourceCandidate)
    ? sourceCandidate
    : null;
  const filterSource =
    activeTab === 'approvals' && !explicitSource ? 'approval' : explicitSource;

  const tenant = await resolveAdminTenant();

  // Isolation lane needs the broker. Load it only when the lane is
  // active to avoid an extra ai_egress_audit query on the default
  // tab. Graceful: the broker returns an estimated fallback on any
  // failure rather than throwing.
  const isolationPosture =
    activeTab === 'isolation'
      ? await getIsolationPosture(tenant.tenantSlug)
      : null;
  const refreshedAtIso = new Date().toISOString();

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
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '20px 32px 0 32px' }}>
          <SetupAuditTabs activeTab={activeTab} />
        </div>
        {activeTab === 'isolation' && isolationPosture ? (
          <IsolationLane
            posture={isolationPosture}
            refreshedAtIso={refreshedAtIso}
          />
        ) : (
          <SetupAuditPage
            tenantSlug={tenant.tenantSlug}
            filterSource={filterSource}
          />
        )}
      </div>
    </AdminCanonShellV2>
  );
}
