import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { SetupChatRail } from '@/components/admin/SetupChatRail';
import { ADMIN_PAGE_HEADER_STYLES } from '@/components/admin/admin-page-header-styles';
import type { ReactNode } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import {
  buildCustomerAdminPageView,
  type CustomerAdminAiEgressPanel,
  type CustomerAdminAuditPanel,
  type CustomerAdminDocumentEconomicsPanel,
  type CustomerAdminSubstratePanel,
  type CustomerAdminUsagePanel,
  type CustomerAdminWeeklyUsageReport,
  type CustomerAdminUsersPanel,
} from '@/lib/admin/customer-admin-read-model';

export const metadata = {
  title: 'Customer Admin | AbarVa Admin',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function shortDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not recorded';
  const iso = value instanceof Date ? value.toISOString() : String(value);
  return iso.slice(0, 16).replace('T', ' ');
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.md,
        background: COLORS.white,
        padding: SPACING.md,
        minHeight: 92,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: `${COLORS.ink}90`,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 28,
          lineHeight: 1,
          color: COLORS.ink,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}99`,
          marginTop: 8,
          lineHeight: 1.45,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: COLORS.navy,
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 24,
            lineHeight: 1.15,
            margin: 0,
            color: COLORS.ink,
          }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: TYPOGRAPHY.sans,
        color: `${COLORS.ink}99`,
        lineHeight: 1.55,
        fontSize: 14,
      }}
    >
      {children}
    </p>
  );
}

function AuditPanel({ audit }: { audit: CustomerAdminAuditPanel }) {
  return (
    <Panel eyebrow="Read-only ledger" title="Audit log">
      {audit.events.length === 0 ? (
        <EmptyState>No audit events are available for this tenant yet.</EmptyState>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {audit.events.map((event) => (
            <div
              key={event.id}
              style={{
                border: `1px solid ${COLORS.ink}10`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: SPACING.md,
              }}
            >
              <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}99` }}>
                {shortDate(event.createdAt)}
              </div>
              <div>
                <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                  {event.action}
                </div>
                <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}a8`, marginTop: 3 }}>
                  {event.summary}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function UsersPanel({ users }: { users: CustomerAdminUsersPanel }) {
  return (
    <Panel eyebrow="Read-only roster" title="Users">
      {users.users.length === 0 ? (
        <EmptyState>No user rows are available for this tenant yet.</EmptyState>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {users.users.slice(0, 8).map((user) => (
            <div
              key={user.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.5fr 0.8fr',
                gap: SPACING.md,
                alignItems: 'center',
                borderBottom: `1px solid ${COLORS.ink}10`,
                padding: `${SPACING.sm} 0`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
              }}
            >
              <strong>{user.displayName}</strong>
              <span style={{ color: `${COLORS.ink}b8` }}>{user.email}</span>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{user.status}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AiEgressPanel({ aiEgress }: { aiEgress: CustomerAdminAiEgressPanel }) {
  return (
    <Panel eyebrow="Provider boundary" title="AI egress audit">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACING.md }}>
        <MetricTile label="Events" value={aiEgress.totalRows} detail="Recent tenant-scoped rows" />
        <MetricTile label="Allowed" value={aiEgress.allowed} detail="Policy decision allow" />
        <MetricTile label="Blocked" value={aiEgress.deniedOrBlocked} detail="Deny, redact, or error" />
      </div>
      {aiEgress.rows.length === 0 ? (
        <EmptyState>No AI egress rows are available for this tenant in the current read plane.</EmptyState>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {aiEgress.rows.slice(0, 6).map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 100px 100px',
                gap: SPACING.md,
                padding: `${SPACING.sm} 0`,
                borderBottom: `1px solid ${COLORS.ink}10`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
              }}
            >
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{shortDate(row.created_at)}</span>
              <span>{row.workflow}</span>
              <span>{row.provider}</span>
              <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{row.policy_decision}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function formatUsd(value: number | null, digits = 4): string {
  return value === null ? 'Not metered' : `$${value.toFixed(digits)}`;
}

function formatPercent(value: number | null): string {
  return value === null ? 'Not configured' : `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function UsagePanel({
  usage,
  documentEconomics,
  weeklyUsageReport,
}: {
  usage: CustomerAdminUsagePanel;
  documentEconomics: CustomerAdminDocumentEconomicsPanel;
  weeklyUsageReport: CustomerAdminWeeklyUsageReport;
}) {
  const tokens =
    usage.inputTokens === null && usage.outputTokens === null
      ? 'Not metered'
      : `${usage.inputTokens ?? 0} in / ${usage.outputTokens ?? 0} out`;
  const cost = formatUsd(usage.estimatedCostUsd);
  const cacheHitRate =
    documentEconomics.cacheHitRate === null ? 'Not metered' : `${documentEconomics.cacheHitRate}%`;

  return (
    <Panel eyebrow="Cost and usage" title="Document economics">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: SPACING.md }}>
        <MetricTile label="Calls" value={usage.calls} detail="Rows in AI egress audit window" />
        <MetricTile label="Tokens" value={tokens} detail="Only when provider metadata records tokens" />
        <MetricTile label="Cost" value={cost} detail={usage.costBasis === 'provider_metadata' ? 'Provider metadata' : 'No first-class billing column yet'} />
        <MetricTile label="Cache hit rate" value={cacheHitRate} detail="Document/prompt cache telemetry when present" />
      </div>
      <div
        style={{
          border: `1px solid ${COLORS.navy}20`,
          borderRadius: RADIUS.md,
          background: `${COLORS.navy}08`,
          padding: SPACING.md,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: SPACING.md,
          alignItems: 'start',
        }}
      >
        <MetricTile
          label="Weekly report"
          value={weeklyUsageReport.reportReady ? 'Ready' : 'Not ready'}
          detail={weeklyUsageReport.status.replaceAll('_', ' ')}
        />
        <MetricTile
          label="Cap used"
          value={formatPercent(weeklyUsageReport.tokenPercentOfCap)}
          detail={weeklyUsageReport.tokenCap === null ? 'No cap audit metadata' : `${weeklyUsageReport.tokenCap.toLocaleString()} token cap`}
        />
        <MetricTile
          label="Overage"
          value={`$${weeklyUsageReport.overageRateUsdPerMillionTokens}/M`}
          detail={`${weeklyUsageReport.includedMonthlyTokenAllowance.toLocaleString()} included monthly tokens`}
        />
        <div
          style={{
            gridColumn: '1 / -1',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            lineHeight: 1.5,
            color: COLORS.ink,
          }}
        >
          {weeklyUsageReport.customerNotice}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: SPACING.md }}>
        <MetricTile label="Documents" value={documentEconomics.totalDocuments} detail={`${documentEconomics.meteredDocuments} with cost metadata`} />
        <MetricTile label="Parse cost" value={formatUsd(documentEconomics.parseCostUsd)} detail="Document extraction/parse metadata" />
        <MetricTile label="Chat cost" value={formatUsd(documentEconomics.chatCostUsd)} detail="Document-bound model egress metadata" />
      </div>
      {documentEconomics.documents.length === 0 ? (
        <EmptyState>
          No document-attributed usage metadata is available yet. Costs will appear after parser and agent calls include document keys, parse cost, and provider usage metadata.
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {documentEconomics.documents.slice(0, 6).map((document) => (
            <div
              key={document.documentKey}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 80px 90px 90px 80px',
                gap: SPACING.md,
                padding: `${SPACING.sm} 0`,
                borderBottom: `1px solid ${COLORS.ink}10`,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <div>
                <strong>{document.label}</strong>
                <div style={{ color: `${COLORS.ink}99`, fontSize: 12, marginTop: 2 }}>
                  {shortDate(document.lastSeenAt)}
                </div>
              </div>
              <span>{document.calls} calls</span>
              <span>{formatUsd(document.parseCostUsd, 5)}</span>
              <span>{formatUsd(document.chatCostUsd, 5)}</span>
              <span>{document.cacheHitRate === null ? 'n/a' : `${document.cacheHitRate}%`}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function SubstratePanel({ substrate }: { substrate: CustomerAdminSubstratePanel }) {
  return (
    <Panel eyebrow="Tenant substrate" title="Substrate inventory">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: SPACING.md }}>
        <MetricTile label="Records" value={substrate.totalRecords} detail={substrate.source === 'live_snapshot' ? 'Live snapshot' : 'Authored fallback'} />
        <MetricTile label="Chunks" value={substrate.totalChunks} detail="Context chunks loaded" />
        <MetricTile label="Nodes" value={substrate.totalNodes} detail="Graph nodes loaded" />
        <MetricTile label="Edges" value={substrate.totalEdges} detail="Graph edges loaded" />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {substrate.segments.slice(0, 8).map((segment) => (
          <div
            key={segment.segmentId}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 90px 90px',
              gap: SPACING.md,
              padding: `${SPACING.sm} 0`,
              borderBottom: `1px solid ${COLORS.ink}10`,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
            }}
          >
            <strong>{segment.segmentName}</strong>
            <span>{segment.recordCount} rows</span>
            <span>{segment.healthState}</span>
            <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11 }}>{Math.round(segment.coverageScore)}%</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default async function CustomerAdminPage() {
  const view = await buildCustomerAdminPageView();

  if (!view.access.allowed) {
    return (
      <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={view.tenant.tenantName}>
        <main style={{ padding: SPACING.xl, background: COLORS.cream, minHeight: '100%' }}>
          <Panel eyebrow="Restricted" title="Customer admin access required">
            <EmptyState>
              This read-only customer admin workspace is restricted to tenant administrators for the active tenant.
            </EmptyState>
          </Panel>
        </main>
      </AdminCanonShellV2>
    );
  }

  return (
    <AdminCanonShellV2 agentRail={<SetupChatRail />} tenantName={view.tenant.tenantName}>
      <main
        data-testid="customer-admin-page"
        style={{
          padding: SPACING.xl,
          background: COLORS.cream,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
            maxWidth: 940,
          }}
        >
          <div
            style={{
              ...ADMIN_PAGE_HEADER_STYLES.eyebrow,
            }}
          >
            Admin · Customer Admin · {view.tenant.tenantName}
          </div>
          <h1
            style={{
              ...ADMIN_PAGE_HEADER_STYLES.title,
            }}
          >
            Customer admin
          </h1>
          <p
            style={{
              ...ADMIN_PAGE_HEADER_STYLES.subtitle,
            }}
          >
            Read-only tenant control room for users, audit activity, AI egress, usage, and substrate inventory.
            Every panel is scoped to the active tenant and exposes no mutation actions.
          </p>
        </header>

        {view.banners.length > 0 ? (
          <section
            aria-label="Customer admin data notices"
            style={{
              display: 'grid',
              gap: 8,
            }}
          >
            {view.banners.map((banner) => (
              <div
                key={banner}
                style={{
                  border: `1px solid ${COLORS.amberInk}55`,
                  borderRadius: RADIUS.md,
                  background: COLORS.amberSoft,
                  color: COLORS.ink,
                  padding: SPACING.md,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                {banner}
              </div>
            ))}
          </section>
        ) : null}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: SPACING.md }}>
          <MetricTile label="Read-only panels" value={view.readOnlySections.length} detail="No create, update, delete, invite, sync, or export actions" />
          <MetricTile label="Active users" value={view.users.activeUsers} detail={`${view.users.pendingInvites} invited or pending`} />
          <MetricTile label="Audit events" value={view.audit.totalEvents} detail="Tenant-scoped recent events" />
          <MetricTile label="Last AI egress" value={shortDate(view.aiEgress.lastSeenAt)} detail="Most recent tenant provider-boundary row" />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: SPACING.lg }}>
          <AuditPanel audit={view.audit} />
          <UsersPanel users={view.users} />
          <AiEgressPanel aiEgress={view.aiEgress} />
          <UsagePanel
            usage={view.usage}
            weeklyUsageReport={view.weeklyUsageReport}
            documentEconomics={view.documentEconomics}
          />
        </div>
        <SubstratePanel substrate={view.substrate} />
      </main>
    </AdminCanonShellV2>
  );
}
