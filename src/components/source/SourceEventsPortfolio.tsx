import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildLinkedProgramBadgeView } from '@/lib/source/linked-program-badge-view';
import type {
  SourceLifecycleStatus,
  SourceAlertSeverity,
  SourceStageKey,
  SourcingEventSummary,
} from '@/lib/source/types';
import {
  formatSourceFinancialValue,
  redactSourceFinancialText,
} from '@/lib/source/financial-display';
import { SourceAlertPanel } from './SourceAlertPanel';
import { SourcingEventTable } from './SourcingEventTable';

const SURFACE_CARD: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const CONTEXT_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
};

const CONTEXT_TILE: CSSProperties = {
  border: '1px solid rgba(17, 24, 39, 0.08)',
  borderRadius: 12,
  background: '#FBFAF7',
  padding: '12px 14px',
  display: 'grid',
  gap: 6,
};

const FILTER_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
};

const FILTER_GROUP: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
};

const FILTER_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.INK_SOFT,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const STACK: CSSProperties = {
  display: 'grid',
  gap: 16,
};

const TWO_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.85fr)',
  gap: 16,
  alignItems: 'start',
};

const BRIEF_CARD: CSSProperties = {
  ...SURFACE_CARD,
  borderLeft: '3px solid #1B2B5C',
  padding: '18px 20px',
};

const RAIL_CARD: CSSProperties = {
  ...SURFACE_CARD,
  padding: '16px 18px',
};

const CHIP_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const STAGE_LABELS: Array<{ key: SourceStageKey; label: string }> = [
  { key: 'bafo', label: 'BAFO' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'responses', label: 'Responses' },
  { key: 'selection', label: 'Selection' },
];

const STATUS_LABELS: Array<{ key: SourceLifecycleStatus; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'waiting_on_vendor', label: 'Waiting on Vendor' },
  { key: 'waiting_on_client', label: 'Waiting on Client' },
];

const SOURCE_SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const SOURCE_MUTED: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

const SOURCE_METRIC_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: SHELL.INK_MUTED,
};

const SOURCE_METRIC_VALUE: CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 24,
  color: SHELL.INK,
};

const SOURCE_METRIC_DETAIL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
};

const SOURCE_ACTION_LINK_PRIMARY: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid ' + SHELL.INK,
  background: SHELL.INK,
  color: SHELL.CARD_WHITE,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
};

const SOURCE_ACTION_LINK_SECONDARY: CSSProperties = {
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 11px',
  borderRadius: 999,
  border: '1px solid ' + SHELL.CARD_LINE,
  background: 'transparent',
  color: SHELL.INK,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
};

type Props = {
  events: SourcingEventSummary[];
  activeStage: string | null;
  activeStatus: string | null;
  canViewFinancialValues?: boolean;
};

export function SourceEventsPortfolio({
  events,
  activeStage,
  activeStatus,
  canViewFinancialValues = true,
}: Props) {
  const filteredEvents = events.filter((event) => {
    const matchesStage = !activeStage || event.currentStageKey === activeStage;
    const matchesStatus = !activeStatus || event.status === activeStatus;
    return matchesStage && matchesStatus;
  });

  const activeEvents = filteredEvents.filter((event) => event.status === 'active').length;
  const atRiskEvents = filteredEvents.filter((event) => event.isAtRisk).length;
  const waitingEvents = filteredEvents.filter((event) => event.status.startsWith('waiting_on_')).length;
  const openAlerts = filteredEvents.reduce((sum, event) => sum + event.openAlerts, 0);
  const valueAtStake = filteredEvents.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);
  const topEvent =
    [...filteredEvents].sort((left, right) => {
      if (Number(right.isAtRisk) !== Number(left.isAtRisk)) {
        return Number(right.isAtRisk) - Number(left.isAtRisk);
      }
      if (right.openAlerts !== left.openAlerts) return right.openAlerts - left.openAlerts;
      return right.valueAtStakeUsd - left.valueAtStakeUsd;
    })[0]
    ?? events[0]
    ?? null;
  const linkedProgramCount = filteredEvents.filter((event) => buildLinkedProgramBadgeView(event.id)).length;

  const eventContextById = Object.fromEntries(
    filteredEvents.map((event) => [
      event.id,
      {
        name: event.name,
        valueAtStakeUsd: event.valueAtStakeUsd,
        agingDays: event.agingDays,
        statusLabel: event.statusLabel,
        blocker: event.blocker ? redactSourceFinancialText(event.blocker, canViewFinancialValues) : null,
      },
    ]),
  );

  const attentionItems: Array<{
    id: string;
    eventId: string;
    title: string;
    detail: string;
    severity: SourceAlertSeverity;
    owner: string;
    actionLabel: string;
  }> = filteredEvents.slice(0, 3).map((event) => ({
    id: `portfolio-${event.id}`,
    eventId: event.id,
    title: `${event.name} needs portfolio attention`,
    detail: redactSourceFinancialText(
      event.blocker
        ? `${event.blocker}. Next action: ${event.nextAction}.`
        : `${event.nextDecision}. Next action: ${event.nextAction}.`,
      canViewFinancialValues,
    ),
    severity: event.isAtRisk ? 'critical' : event.openAlerts > 0 ? 'warning' : 'info',
    owner: event.owner,
    actionLabel: 'Open event',
  }));

  return (
    <div style={STACK}>
      <section style={SURFACE_CARD}>
        <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>Source event portfolio</div>
        <div style={CONTEXT_GRID}>
          <ContextTile
            label="Portfolio posture"
            value={`${filteredEvents.length} events in view`}
            detail={activeStage || activeStatus ? 'Filtered portfolio posture' : 'All seeded sourcing events'}
          />
          <ContextTile
            label="Commercial pressure"
            value={`${atRiskEvents} at risk`}
            detail={`${openAlerts} open alert${openAlerts === 1 ? '' : 's'} across the queue`}
          />
          <ContextTile
            label="Waiting state"
            value={`${waitingEvents} waiting`}
            detail={`${activeEvents} active sourcing workflows`}
          />
          <ContextTile
            label="Linked programs"
            value={`${linkedProgramCount} linked`}
            detail="Program linkage is deterministic where seeded"
          />
          <ContextTile
            label="Value at stake"
            value={formatSourceFinancialValue(valueAtStake, canViewFinancialValues)}
            detail="Projected sourcing value in the filtered queue"
          />
        </div>
      </section>

      <div style={TWO_COL}>
        <article style={BRIEF_CARD}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>Sentinel brief</div>
          <h2
            style={{
              margin: '2px 0 8px',
              fontFamily: SHELL.SERIF,
              fontSize: '28px',
              lineHeight: 1.2,
              color: SHELL.INK,
            }}
          >
            {buildBriefHeadline(filteredEvents, topEvent)}
          </h2>
          <p style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 720 }}>
            {buildBriefBody(filteredEvents, activeStage, activeStatus)}
          </p>
          <div style={{ marginTop: 12, ...CHIP_ROW }}>
            <ChoiceChip href={buildChoiceHref({ stage: 'bafo' })} label="Review BAFO events" />
            <ChoiceChip href={buildChoiceHref({ stage: 'evaluation' })} label="Review evaluation queue" />
            <ChoiceChip href={buildChoiceHref({ status: 'at_risk' })} label="Review at-risk events" />
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(17, 24, 39, 0.08)',
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={FILTER_LABEL}>Context used</div>
            <div style={{ ...SOURCE_MUTED, fontSize: '13px' }}>
              Seeded event list, stage labels, alert counts, value-at-stake, and linked-program hints. Vendor counts and live bid timelines are not surfaced at the portfolio layer yet.
            </div>
            <label htmlFor="source-events-custom-input" style={{ display: 'grid', gap: 6 }}>
              <div style={{ ...FILTER_LABEL, marginTop: 8 }}>Ask Sentinel (deferred)</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="source-events-custom-input"
                  type="text"
                  readOnly
                  disabled
                  aria-disabled="true"
                  placeholder="Ask Sentinel about this event portfolio, stage priorities, blockers, or evidence..."
                  style={{
                    ...SOURCE_SECTION_LABEL,
                    background: '#F8FAFC',
                    border: '1px solid #D0D8E8',
                    borderRadius: 8,
                    color: '#6B7280',
                    fontFamily: SHELL.SANS,
                    padding: '8px 10px',
                    fontWeight: 500,
                    fontSize: 12,
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Open a Source event to talk to Sentinel. Portfolio Sentinel runtime is deferred."
                  style={{
                    ...SOURCE_ACTION_LINK_SECONDARY,
                    whiteSpace: 'nowrap',
                    cursor: 'not-allowed',
                    opacity: 0.72,
                  }}
                >
                  Submit (disabled until runtime)
                </button>
              </div>
            </label>
          </div>
        </article>

        <aside style={RAIL_CARD}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>What is missing</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <MissingItem
              title="Vendor counts at portfolio level"
              detail="The current event summary contract does not expose vendor totals on `/source/events`. Review vendor depth inside each event canvas."
            />
            <MissingItem
              title="Saved views and full drawer behavior"
              detail="This wave keeps filters simple and server-rendered. Drawer-heavy portfolio workflows remain deferred."
            />
            <MissingItem
              title="Live procurement telemetry"
              detail="The portfolio is deterministic seed-backed. No live bid ingestion, approvals, or workflow automation are implied."
            />
          </div>
        </aside>
      </div>

      <section style={SURFACE_CARD}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>Filter posture</div>
              <div style={{ ...SOURCE_MUTED, margin: 0, maxWidth: 760 }}>
                Narrow the seeded queue by sourcing stage or lifecycle posture. Filters are deterministic and update the portfolio in place through route query params.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/source/compare"
                style={{
                  color: SHELL.INK_SOFT,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  fontFamily: SHELL.MONO,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                }}
              >
                Compare events →
              </Link>
              {(activeStage || activeStatus) ? (
                <Link href="/source/events" style={SOURCE_ACTION_LINK_SECONDARY}>
                  Reset filters
                </Link>
              ) : null}
            </div>
          </div>

          <div style={FILTER_ROW}>
            <div style={FILTER_GROUP}>
              <span style={FILTER_LABEL}>Stage</span>
              <FilterLink
                href={buildChoiceHref({ status: activeStatus ?? undefined })}
                active={!activeStage}
              >
                All
              </FilterLink>
              {STAGE_LABELS.map((stage) => (
                <FilterLink
                  key={stage.key}
                  href={buildChoiceHref({ stage: stage.key, status: activeStatus ?? undefined })}
                  active={activeStage === stage.key}
                >
                  {stage.label}
                </FilterLink>
              ))}
            </div>
            <div style={FILTER_GROUP}>
              <span style={FILTER_LABEL}>Status</span>
              <FilterLink href={buildChoiceHref({ stage: activeStage ?? undefined })} active={!activeStatus}>
                All
              </FilterLink>
              {STATUS_LABELS.map((status) => (
                <FilterLink
                  key={status.key}
                  href={buildChoiceHref({ stage: activeStage ?? undefined, status: status.key })}
                  active={activeStatus === status.key}
                >
                  {status.label}
                </FilterLink>
              ))}
            </div>
          </div>
        </div>
      </section>

      {filteredEvents.length > 0 ? (
        <SourcingEventTable
          events={filteredEvents}
          variant="light"
          canViewFinancialValues={canViewFinancialValues}
        />
      ) : (
        <section style={SURFACE_CARD}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>Event queue</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: SHELL.INK }}>
            No events match the current filter posture.
          </div>
          <div style={SOURCE_MUTED}>
            Reset the portfolio filters to return to the seeded Source queue. Vendor and BAFO detail remain available inside each event canvas rather than this portfolio surface.
          </div>
          <div>
            <Link href="/source/events" style={SOURCE_ACTION_LINK_PRIMARY}>
              Reset filters
            </Link>
          </div>
        </section>
      )}

      <div style={TWO_COL}>
        <SourceAlertPanel
          alerts={attentionItems}
          title="Sentinel mission strip"
          emptyLabel="No seeded attention items are open in the current filter view."
          eventContextById={eventContextById}
          variant="light"
          canViewFinancialValues={canViewFinancialValues}
        />

        <section style={RAIL_CARD}>
          <div style={{ ...SOURCE_SECTION_LABEL, color: '#1B2B5C' }}>Portfolio workflow guidance</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <MetricLine
              label="Where am I?"
              detail="You are in the Source Events Portfolio command surface for seeded sourcing work."
            />
            <MetricLine
              label="What matters?"
              detail={
                topEvent
                  ? `${topEvent.name} is the most exposed filtered event; exact value is ${
                      canViewFinancialValues
                        ? formatSourceFinancialValue(topEvent.valueAtStakeUsd, true)
                        : 'restricted'
                    }.`
                  : 'No events are in the current filtered view.'
              }
            />
            <MetricLine
              label="What is blocked?"
              detail={redactSourceFinancialText(
                topEvent?.blocker ?? 'Portfolio-level blockers are limited to seeded event summaries in this wave.',
                canViewFinancialValues,
              )}
            />
            <MetricLine
              label="Agent recommendation"
              detail={redactSourceFinancialText(
                topEvent ? topEvent.nextAction : 'Reset filters or return to the seeded queue to inspect an event.',
                canViewFinancialValues,
              )}
            />
            <MetricLine
              label="Next action"
              detail={topEvent ? `Open ${topEvent.code} for stage-level commercial, risk, BAFO, and readiness detail.` : 'Review another Source route with seeded events.'}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function buildBriefHeadline(
  events: SourcingEventSummary[],
  topEvent: SourcingEventSummary | null,
): string {
  if (events.length === 0) return 'No seeded source events match this portfolio view.';
  if (!topEvent) return `${events.length} sourcing events are in view.`;
  return `${events.length} sourcing event${events.length === 1 ? '' : 's'} need attention. ${topEvent.name} leads the queue.`;
}

function buildBriefBody(
  events: SourcingEventSummary[],
  activeStage: string | null,
  activeStatus: string | null,
): string {
  if (events.length === 0) {
    return 'No Source events match the current filter posture. Reset filters to return to the seeded portfolio queue.';
  }

  const riskCount = events.reduce((sum, event) => sum + event.openAlerts, 0);
  const stageLabel = activeStage ? STAGE_LABELS.find((stage) => stage.key === activeStage)?.label ?? activeStage : 'all stages';
  const statusLabel = activeStatus ? STATUS_LABELS.find((status) => status.key === activeStatus)?.label ?? activeStatus : 'all lifecycle states';

  return `Sentinel is using the seeded Source portfolio to compare ${events.length} event${events.length === 1 ? '' : 's'} across ${stageLabel.toLowerCase()} and ${statusLabel.toLowerCase()} posture. ${riskCount} open alert${riskCount === 1 ? '' : 's'} remain in view, and commercial detail beyond stage, blocker, value, and next action still belongs inside each event canvas.`;
}

function buildChoiceHref({
  stage,
  status,
}: {
  stage?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (stage) params.set('stage', stage);
  if (status) params.set('status', status);
  const query = params.toString();
  return query ? `/source/events?${query}` : '/source/events';
}

function ContextTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={CONTEXT_TILE}>
      <div style={SOURCE_METRIC_LABEL}>{label}</div>
      <div style={SOURCE_METRIC_VALUE}>{value}</div>
      <div style={SOURCE_METRIC_DETAIL}>{detail}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? '#1B2B5C' : 'rgba(17, 24, 39, 0.10)'}`,
        background: active ? 'rgba(27, 43, 92, 0.08)' : '#FFFFFF',
        color: active ? '#0F172A' : SHELL.INK_SOFT,
        fontFamily: SHELL.SANS,
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {children}
    </Link>
  );
}

function ChoiceChip({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={SOURCE_ACTION_LINK_PRIMARY}>
      {label}
    </Link>
  );
}

function MissingItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        border: '1px solid rgba(17, 24, 39, 0.08)',
        borderRadius: 10,
        background: '#FBFAF7',
        padding: '12px 14px',
        display: 'grid',
        gap: 5,
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 700, color: SHELL.INK }}>{title}</div>
      <div style={{ ...SOURCE_MUTED, fontSize: '12px' }}>{detail}</div>
    </div>
  );
}

function MetricLine({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={FILTER_LABEL}>{label}</div>
      <div style={{ ...SOURCE_MUTED, fontSize: '13px', color: SHELL.INK }}>{detail}</div>
    </div>
  );
}
