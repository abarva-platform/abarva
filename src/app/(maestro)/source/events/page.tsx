import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { StageTrackerStrip } from '@/components/shell/StageTrackerStrip';
import { SentinelAgentColumn } from '@/components/source/SentinelAgentColumn';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { SourceEventsPortfolio } from '@/components/source/SourceEventsPortfolio';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';
import { AdminSourceEventApprovalQueue } from '@/components/source/AdminSourceEventApprovalQueue';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';
import { listSourcingEvents, getPendingSourceEvents } from '@/lib/source/queries';
import { AMS_SOURCE_EVENT } from '@/lib/source/shell-source-fixture';
import type { SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy } from '@/lib/auth/tenancy';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';

export const dynamic = 'force-dynamic';

export default async function SourceEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string }>;
}) {
  const { stage, status } = await searchParams;
  const events = await listSourcingEvents();

  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const sourceAccessPolicy = activeClient && tenancy
    ? await loadUserSourceAccessPolicy(tenancy, { activeClientKey: activeClient.key }).catch(() => null)
    : null;
  const pendingEvents = sourceAccessPolicy?.canApproveSourceStages && activeClient
    ? await getPendingSourceEvents(activeClient.key)
    : [];

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClient?.name ?? 'AbarVa Client',
        showLocked: true,
        context: 'Source · Events portfolio',
      }}
      middleStrip={
        <StageTrackerStrip
          stages={AMS_SOURCE_EVENT.stages}
          activeStage={stage ?? AMS_SOURCE_EVENT.activeStage}
          variant="journey"
          personaLabel="Sourcing lead"
        />
      }
    >
      {events.length === 0 ? (
        <SourceEmptyState />
      ) : (
        <>
          <SourceWorkingPane>
            {pendingEvents.length > 0 && (
              <AdminSourceEventApprovalQueue events={pendingEvents} />
            )}
            <SourceEventsEntryHeader events={events} />
            <SourceEventsPortfolio
              events={events}
              activeStage={stage ?? null}
              activeStatus={status ?? null}
            />
          </SourceWorkingPane>
          <SentinelAgentColumn
            quote="Events portfolio command read: sort the IT sourcing queue by active pressure, weak evidence, blocked gates, and value exposure before opening a canvas."
            agentContext="Sentinel · Source events portfolio · active-client scoped facts"
            actions={[
              { letter: 'A', text: 'Start IT sourcing event', detail: 'Open the deterministic create-event entry path' },
              { letter: 'B', text: 'Review BAFO events', detail: 'Sourcing events currently in Orals/BAFO stage' },
              { letter: 'C', text: 'Review at-risk events', detail: 'Events flagged with blockers or governance gaps' },
            ]}
          />
        </>
      )}
    </AppShell>
  );
}

function SourceEventsEntryHeader({
  events,
}: {
  events: SourcingEventSummary[];
}) {
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const waitingEvents = events.filter((event) => event.status.startsWith('waiting_on')).length;
  const blockedEvents = events.filter((event) => event.isAtRisk || event.blocker).length;
  const linkedEvents = events.filter((event) => buildLinkedProgramBadgeView(event.id)).length;
  const valueAtStake = events.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);

  return (
    <section
      aria-label="Source events portfolio command surface"
      data-testid="source-events-entry-header"
      style={{
        display: 'grid',
        gap: 14,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 16,
          alignItems: 'end',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 800,
            }}
          >
            Source events portfolio
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              lineHeight: 1.12,
              color: SHELL.INK,
              fontWeight: 800,
            }}
          >
            IT sourcing operating queue
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 780,
              fontFamily: SHELL.SANS,
              fontSize: 13.2,
              lineHeight: 1.48,
              color: SHELL.INK_SOFT,
            }}
          >
            Nexus leads the IT sourcing queue by naming the next sourcing move, the evidence behind it, and the gate
            that could block it. The table is supporting evidence: lifecycle, owner, linked program, value exposure,
            blocker, aging, and next action.
          </p>
        </div>
        <Link
          href="/source/new"
          data-testid="source-events-start-it-sourcing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: SHELL.INK,
            color: SHELL.PAPER,
            padding: '10px 15px',
            fontFamily: SHELL.MONO,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Start IT sourcing event
        </Link>
      </div>

      <div
        aria-label="Source events portfolio summary"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}
      >
        <PortfolioMetric label="Events" value={String(events.length)} detail={`${activeEvents} active`} />
        <PortfolioMetric label="Waiting" value={String(waitingEvents)} detail="client, vendor, or owner hold" />
        <PortfolioMetric label="Blocked" value={String(blockedEvents)} detail="gate or evidence pressure visible" />
        <PortfolioMetric label="Linked programs" value={String(linkedEvents)} detail="deterministic program hints" />
        <PortfolioMetric label="Value at stake" value={formatUsd(valueAtStake)} detail="seeded projected exposure" />
      </div>
    </section>
  );
}

function PortfolioMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        background: SHELL.CARD_WHITE,
        padding: '11px 13px',
        display: 'grid',
        gap: 5,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: SHELL.SERIF, fontSize: 23, color: SHELL.INK, fontWeight: 800, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, lineHeight: 1.35 }}>
        {detail}
      </div>
    </div>
  );
}
