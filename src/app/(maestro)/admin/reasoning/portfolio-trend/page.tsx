// /admin/reasoning/portfolio-trend — Portfolio health progression timeline.
//
// Server component. Uses stage transition dates from SOURCE_EVENT_INSTANCES to
// construct a simulated timeline. Groups transitions by month (YYYY-MM) and
// shows them newest-first. Also renders a current stage distribution bar chart.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portfolio trend · AbarVa Admin',
};

// ─── Data model ────────────────────────────────────────────────────────────────

interface TransitionEvent {
  instanceId: string;
  instanceName: string;
  fromStage: string | null;
  toStage: string;
  enteredAt: string; // ISO date string
  advancedBy: string;
  month: string; // YYYY-MM
  isForward: boolean;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function buildTransitionEvents(): TransitionEvent[] {
  const events: TransitionEvent[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const history = inst.stageHistory ?? [];
    for (let i = 0; i < history.length; i++) {
      const transition = history[i];
      const prev = i > 0 ? history[i - 1] : null;
      const fromStage = prev ? prev.stageId : null;
      const toStage = transition.stageId;
      const enteredAt = transition.enteredAt;

      // Determine YYYY-MM from the ISO date
      const month = enteredAt.slice(0, 7); // e.g. "2026-03"

      // A transition is "forward" if it goes to a later index stage
      // or if it's the first stage entry (no prior stage)
      const isForward = fromStage === null || i > 0;

      events.push({
        instanceId: inst.id,
        instanceName: inst.name,
        fromStage,
        toStage,
        enteredAt,
        advancedBy: transition.advancedBy,
        month,
        isForward,
      });
    }
  }

  // Sort newest first
  events.sort((a, b) => b.enteredAt.localeCompare(a.enteredAt));

  return events;
}

interface MonthGroup {
  month: string;        // YYYY-MM
  label: string;        // "Apr 2026"
  events: TransitionEvent[];
}

function groupByMonth(events: TransitionEvent[]): MonthGroup[] {
  const map = new Map<string, TransitionEvent[]>();
  for (const e of events) {
    const list = map.get(e.month) ?? [];
    list.push(e);
    map.set(e.month, list);
  }

  // Sort months descending
  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  return sorted.map(([month, evts]) => ({
    month,
    label: formatMonth(month),
    events: evts,
  }));
}

function formatMonth(yyyyMM: string): string {
  const [year, mon] = yyyyMM.split('-');
  const MONTHS = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const n = parseInt(mon, 10);
  return `${MONTHS[n] ?? mon} ${year}`;
}

function formatDate(iso: string): string {
  // e.g. "2026-04-18" → "18 Apr 2026"
  const [year, mon, day] = iso.split('-');
  const MONTHS = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const n = parseInt(mon, 10);
  return `${parseInt(day, 10)} ${MONTHS[n] ?? mon} ${year}`;
}

// ─── Current stage distribution ───────────────────────────────────────────────

interface StageCount {
  stageId: string;
  count: number;
}

function buildStageDistribution(): StageCount[] {
  const map = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const stage = inst.currentStage ?? 'Unknown';
    map.set(stage, (map.get(stage) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([stageId, count]) => ({ stageId, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function buildSummary(events: TransitionEvent[]): {
  total: number;
  earliestDate: string;
  latestDate: string;
  instanceCount: number;
} {
  const dates = events.map((e) => e.enteredAt).sort();
  const instanceIds = new Set(events.map((e) => e.instanceId));
  return {
    total: events.length,
    earliestDate: dates[0] ?? '—',
    latestDate: dates[dates.length - 1] ?? '—',
    instanceCount: instanceIds.size,
  };
}

// ─── Cell styles (reused from admin pattern) ──────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left' as const,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  instanceCount,
  earliestDate,
  latestDate,
  transitionCount,
}: {
  instanceCount: number;
  earliestDate: string;
  latestDate: string;
  transitionCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.navy,
          fontWeight: 600,
        }}
      >
        {instanceCount} instance{instanceCount === 1 ? '' : 's'} tracked
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
        }}
      >
        {transitionCount} stage transitions
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
        }}
      >
        from{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono }}>{earliestDate}</span>
        {' '}to{' '}
        <span style={{ fontFamily: TYPOGRAPHY.mono }}>{latestDate}</span>
      </span>
    </div>
  );
}

// ─── Stage distribution chart ─────────────────────────────────────────────────

function StageDistributionChart({ stages }: { stages: StageCount[] }) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Active stage distribution
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          As of today — how many instances are in each stage
        </div>
      </header>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {stages.map((s) => {
          const pct = (s.count / maxCount) * 100;
          return (
            <div key={s.stageId} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}cc`,
                  width: 160,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.stageId}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 20,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: COLORS.mintSoft,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.mintInk}33`,
                    minWidth: pct > 0 ? 4 : 0,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  color: COLORS.mintInk,
                  fontWeight: 600,
                  width: 24,
                  textAlign: 'right' as const,
                  flexShrink: 0,
                }}
              >
                {s.count}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Transition pill ──────────────────────────────────────────────────────────

function TransitionArrow({ from, to, isForward }: { from: string | null; to: string; isForward: boolean }) {
  const arrowColor = isForward ? COLORS.mintInk : `${COLORS.ink}88`;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
      }}
    >
      {from !== null ? (
        <>
          <span style={{ color: `${COLORS.ink}88` }}>{from}</span>
          <span style={{ color: arrowColor, fontWeight: 700, fontSize: 12 }}>→</span>
        </>
      ) : (
        <span style={{ color: `${COLORS.ink}55`, fontStyle: 'italic', fontSize: 10 }}>start</span>
      )}
      <span
        style={{
          color: isForward ? COLORS.mintInk : COLORS.ink,
          fontWeight: isForward ? 600 : 400,
          background: isForward ? COLORS.mintSoft : `${COLORS.ink}08`,
          borderRadius: RADIUS.pill,
          padding: '1px 8px',
        }}
      >
        {to}
      </span>
    </span>
  );
}

// ─── Month group section ──────────────────────────────────────────────────────

function MonthSection({ group }: { group: MonthGroup }) {
  return (
    <div>
      {/* Month header */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.md}`,
          background: `${COLORS.ink}06`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {group.label}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {group.events.length} transition{group.events.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Transition rows */}
      {group.events.map((evt, idx) => (
        <div
          key={`${evt.instanceId}-${evt.enteredAt}-${idx}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: SPACING.md,
            alignItems: 'center',
            padding: `${SPACING.sm} ${SPACING.md}`,
            borderBottom: `1px solid ${COLORS.ink}08`,
            background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}02`,
          }}
        >
          {/* Instance name + transition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.ink,
              }}
            >
              {evt.instanceName}
            </span>
            <TransitionArrow from={evt.fromStage} to={evt.toStage} isForward={evt.isForward} />
          </div>

          {/* Date */}
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}99`,
              whiteSpace: 'nowrap',
            }}
          >
            {formatDate(evt.enteredAt)}
          </span>

          {/* Advanced by */}
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              background: `${COLORS.ink}08`,
              borderRadius: RADIUS.pill,
              padding: '2px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            {evt.advancedBy}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline table ───────────────────────────────────────────────────────────

function TimelineTable({ groups }: { groups: MonthGroup[] }) {
  if (groups.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}aa`,
        }}
      >
        No stage transitions found in fixture data.
      </div>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Stage progression timeline
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Newest first · grouped by month ·{' '}
            <span style={{ fontFamily: TYPOGRAPHY.mono, color: COLORS.mintInk }}>advancing</span>
            {' '}highlighted
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {groups.length} month{groups.length === 1 ? '' : 's'}
        </span>
      </header>

      {groups.map((group) => (
        <MonthSection key={group.month} group={group} />
      ))}
    </section>
  );
}

// ─── Monthly activity count bar ────────────────────────────────────────────────

function MonthlyActivityBar({ groups }: { groups: MonthGroup[] }) {
  const maxEvents = Math.max(...groups.map((g) => g.events.length), 1);
  // Show months in chronological order (oldest first)
  const chronological = [...groups].sort((a, b) => a.month.localeCompare(b.month));
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: `${SPACING.md} ${SPACING.lg}`, borderBottom: `1px solid ${COLORS.ink}10` }}>
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Monthly activity
        </h2>
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${COLORS.ink}88`, marginTop: 4 }}>
          Stage transitions per calendar month — oldest to newest
        </div>
      </header>
      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          alignItems: 'flex-end',
          gap: SPACING.sm,
          overflowX: 'auto',
        }}
      >
        {chronological.map((group) => {
          const barHeight = Math.max(Math.round((group.events.length / maxEvents) * 80), 4);
          return (
            <div
              key={group.month}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: COLORS.navy,
                  fontWeight: 600,
                }}
              >
                {group.events.length}
              </span>
              <div
                style={{
                  width: 32,
                  height: barHeight,
                  background: COLORS.skyPale,
                  border: `1px solid ${COLORS.navy}33`,
                  borderRadius: `${RADIUS.sm} ${RADIUS.sm} 0 0`,
                }}
              />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 9,
                  color: `${COLORS.ink}88`,
                  whiteSpace: 'nowrap',
                  writingMode: 'vertical-rl' as const,
                  transform: 'rotate(180deg)',
                  height: 48,
                }}
              >
                {group.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page component ────────────────────────────────────────────────────────────

export default function PortfolioTrendPage() {
  const allTransitions = buildTransitionEvents();
  const groups = groupByMonth(allTransitions);
  const summary = buildSummary(allTransitions);
  const stageDistribution = buildStageDistribution();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Portfolio trend"
        subtitle="Stage progression timeline across all instances — derived from stage history timestamps."
      >
        <SummaryStrip
          instanceCount={summary.instanceCount}
          earliestDate={summary.earliestDate}
          latestDate={summary.latestDate}
          transitionCount={summary.total}
        />

        <MonthlyActivityBar groups={groups} />

        <StageDistributionChart stages={stageDistribution} />

        <TimelineTable groups={groups} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
