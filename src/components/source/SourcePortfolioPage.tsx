'use client';

import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SourceEventsPortfolio } from '@/components/source/SourceEventsPortfolio';
import { SourcePortfolioAgentCanvas } from '@/components/source/SourcePortfolioAgentCanvas';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';
import { SourcingEventTable } from '@/components/source/SourcingEventTable';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceLifecycleStatus, SourceStageKey, SourcingEventSummary } from '@/lib/source/types';
import { formatUsd } from '@/lib/source/value-ledger';

interface SourcePortfolioPageProps {
  events: SourcingEventSummary[];
  searchParams: {
    stage?: string;
    status?: string;
    demo?: string;
  };
}

const STAGE_FILTERS: Array<{ key: SourceStageKey; label: string }> = [
  { key: 'orals_bafo', label: 'BAFO' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'vendor_responses', label: 'Responses' },
];

const STATUS_FILTERS: Array<{ key: SourceLifecycleStatus; label: string }> = [
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At risk' },
  { key: 'waiting_on_vendor', label: 'Waiting' },
];

export function SourcePortfolioPage({ events, searchParams }: SourcePortfolioPageProps) {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const activeStage = searchParams.stage ?? null;
  const activeStatus = searchParams.status ?? null;
  const isDemoEmpty = searchParams.demo === 'empty';
  const eventsInView = useMemo(
    () => filterEvents(events, activeStage, activeStatus),
    [events, activeStage, activeStatus],
  );

  const handleArtifact = useCallback((artifact: Artifact) => {
    setArtifacts((previous) => {
      const key = JSON.stringify(artifact);
      if (previous.some((item) => JSON.stringify(item) === key)) return previous;
      return [...previous, artifact];
    });
  }, []);

  const filterPills = useMemo(() => {
    const pushFilter = (stage?: string, status?: string) => {
      const params = new URLSearchParams();
      if (stage) params.set('stage', stage);
      if (status) params.set('status', status);
      const query = params.toString();
      router.push(query ? `/source?${query}` : '/source', { scroll: false });
    };

    return [
      {
        key: 'all',
        label: 'All source',
        count: events.length,
        active: !activeStage && !activeStatus,
        onClick: () => pushFilter(),
      },
      ...STAGE_FILTERS.map((stage) => ({
        key: `stage-${stage.key}`,
        label: stage.label,
        count: events.filter((event) => event.currentStageKey === stage.key).length,
        active: activeStage === stage.key,
        onClick: () => pushFilter(stage.key, activeStatus ?? undefined),
      })),
      ...STATUS_FILTERS.map((status) => ({
        key: `status-${status.key}`,
        label: status.label,
        count: events.filter((event) => event.status === status.key).length,
        active: activeStatus === status.key,
        onClick: () => pushFilter(activeStage ?? undefined, status.key),
      })),
    ];
  }, [activeStage, activeStatus, events, router]);

  return (
    <AppShell
      surface="source"
      agentName="Nexus"
      surfaceContext={{
        sourcePortfolioMode: true,
        sourceEventCount: eventsInView.length,
        sourceActiveCount: eventsInView.filter((event) => event.status === 'active').length,
        sourceAtRiskCount: eventsInView.filter((event) => event.isAtRisk || event.status === 'at_risk').length,
        eventType: 'application managed services sourcing intake and portfolio triage',
      }}
      topBarProps={{
        tenantName: 'Apex Retail Group',
        showLocked: true,
        context: `Source - ${eventsInView.length} events in view`,
      }}
      middleStrip={<FilterPillStrip pills={filterPills} />}
      onArtifact={handleArtifact}
    >
      {isDemoEmpty || events.length === 0 ? (
        <SourceEmptyState />
      ) : (
        <main
          data-testid="source-portfolio-page"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            background: SHELL.PAPER,
            padding: '10px 20px 24px',
          }}
        >
          <SourceCommandHeader eventsInView={eventsInView.length} events={eventsInView} />

          <SourcePortfolioAgentCanvas
            quote={buildPortfolioQuote(eventsInView)}
            events={eventsInView}
            activeStage={activeStage}
            activeStatus={activeStatus}
            artifacts={artifacts}
            onArtifact={handleArtifact}
          />

          <SourceWorkDock />

          <SourceMissionPreview events={eventsInView} />

          <SourcingEventTable events={eventsInView} variant="light" />

          <details
            data-testid="source-portfolio-legacy"
            style={{
              marginBottom: 20,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              background: SHELL.PAPER,
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                fontFamily: SHELL.MONO,
                fontSize: 11,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: SHELL.GRAY_TEXT,
                fontWeight: 700,
                userSelect: 'none',
              }}
            >
              Source events - grid view - {eventsInView.length} in view - {events.filter((event) => event.status === 'completed').length} awarded
            </summary>
            <div style={{ padding: '16px' }}>
              <SourceEventsPortfolio
                events={events}
                activeStage={activeStage}
                activeStatus={activeStatus}
              />
            </div>
          </details>
        </main>
      )}
    </AppShell>
  );
}

function SourceCommandHeader({
  eventsInView,
  events,
}: {
  eventsInView: number;
  events: SourcingEventSummary[];
}) {
  const activeEvents = events.filter((event) => event.status === 'active').length;
  const waitingEvents = events.filter((event) => event.status.startsWith('waiting_on')).length;
  const atRiskEvents = events.filter((event) => event.isAtRisk || event.status === 'at_risk').length;
  const valueAtStake = events.reduce((sum, event) => sum + event.valueAtStakeUsd, 0);

  return (
    <section
      aria-label="Source command center introduction"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, auto)',
        gap: 14,
        alignItems: 'center',
        marginBottom: 10,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            marginBottom: 3,
          }}
        >
          Source command center - {eventsInView} events in view
        </div>
        <h1
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 22,
            fontWeight: 700,
            color: SHELL.INK,
            margin: 0,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
          }}
        >
          Create, run, and govern IT sourcing events
        </h1>
        <p
          style={{
            margin: '5px 0 0',
            maxWidth: 760,
            fontFamily: SHELL.SANS,
            fontSize: 12.4,
            lineHeight: 1.35,
            color: SHELL.INK_SOFT,
          }}
        >
          Source is the operating room for technology and IT sourcing: scope, evidence, gates, vendor risk,
          value, and next action stay visible while Nexus runs the thread.
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 7,
          justifyItems: 'end',
        }}
      >
        <a
          href="/source/new"
          data-testid="source-create-event-cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: SHELL.INK,
            color: SHELL.PAPER,
            padding: '8px 13px',
            fontFamily: SHELL.MONO,
            fontSize: 9.8,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 18px rgba(12,26,58,0.16)',
          }}
        >
          + Create sourcing event
        </a>
        <div
          aria-label="Source portfolio pressure summary"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(58px, 1fr))',
            gap: 8,
            width: '100%',
            maxWidth: 380,
          }}
        >
          <HeaderMetric label="Active" value={String(activeEvents)} />
          <HeaderMetric label="Waiting" value={String(waitingEvents)} />
          <HeaderMetric label="At risk" value={String(atRiskEvents)} />
          <HeaderMetric label="Value" value={formatUsd(valueAtStake)} compact />
        </div>
      </div>
    </section>
  );
}

function HeaderMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        padding: '6px 8px',
        display: 'grid',
        gap: 2,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: compact ? SHELL.SANS : SHELL.SERIF,
          fontSize: compact ? 11.2 : 17,
          fontWeight: 800,
          color: SHELL.INK,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SourceWorkDock() {
  const workItems = [
    {
      label: 'Attach evidence',
      detail: 'Paperclip for files; evidence form for validated metadata.',
    },
    {
      label: 'Generate artifact',
      detail: 'Strategy memo, RFP pack, pricing workbook, BAFO brief.',
    },
    {
      label: 'Run workshop',
      detail: 'Agenda, capture template, decisions, actions, next step.',
    },
    {
      label: 'Request approval',
      detail: 'Steward blocks or advances only when gate evidence is met.',
    },
  ];

  return (
    <section aria-label="Source work dock" style={WORK_DOCK}>
      {workItems.map((item) => (
        <article key={item.label} style={WORK_DOCK_CARD}>
          <div style={WORK_DOCK_LABEL}>{item.label}</div>
          <p style={WORK_DOCK_COPY}>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}

function SourceMissionPreview({ events }: { events: SourcingEventSummary[] }) {
  const topEvent = selectTopEvent(events);

  return (
    <section
      aria-label="Source mission preview"
      data-testid="source-mission-preview"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(220px, 0.8fr)',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 12,
          background: SHELL.CARD_WHITE,
          padding: '14px 16px',
          display: 'grid',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#1B2B5C',
            fontWeight: 800,
          }}
        >
          Nexus mission preview
        </div>
        <div
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 21,
            lineHeight: 1.2,
            color: SHELL.INK,
            fontWeight: 700,
          }}
        >
          {topEvent
            ? `${topEvent.name} is the first sourcing event to open.`
            : 'No IT sourcing events match this portfolio view.'}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: SHELL.SANS,
            fontSize: 13,
            lineHeight: 1.48,
            color: SHELL.INK_SOFT,
          }}
        >
          {topEvent
            ? `${topEvent.currentStageLabel} · ${topEvent.statusLabel}. ${topEvent.blocker ?? topEvent.nextDecision} Next action: ${topEvent.nextAction}.`
            : 'Reset filters or create a technology sourcing event with owner, scope, value basis, and evidence posture before starting workflow.'}
        </p>
      </div>
      <div
        style={{
          border: '1px solid rgba(15,118,110,0.22)',
          borderRadius: 12,
          background: 'rgba(15,118,110,0.08)',
          padding: '14px 16px',
          display: 'grid',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#0F766E',
            fontWeight: 800,
          }}
        >
          IT-only sourcing scope
        </div>
        <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 12.8, lineHeight: 1.48, color: SHELL.INK_SOFT }}>
          Use Source for AMS, cloud, data, AI, cybersecurity, enterprise software, SI partners, and technology operating-model work. Non-technology procurement belongs elsewhere.
        </p>
      </div>
    </section>
  );
}

const WORK_DOCK = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 8,
  marginBottom: 12,
} satisfies CSSProperties;

const WORK_DOCK_CARD = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: '10px 11px',
  minHeight: 0,
} satisfies CSSProperties;

const WORK_DOCK_LABEL = {
  fontFamily: SHELL.MONO,
  fontSize: 8.8,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_MUTED,
  fontWeight: 800,
} satisfies CSSProperties;

const WORK_DOCK_COPY = {
  margin: '5px 0 0',
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.35,
  color: SHELL.INK_SOFT,
} satisfies CSSProperties;

function filterEvents(
  events: SourcingEventSummary[],
  activeStage: string | null,
  activeStatus: string | null,
): SourcingEventSummary[] {
  return events.filter((event) => {
    const matchesStage = !activeStage || event.currentStageKey === activeStage;
    const matchesStatus = !activeStatus || event.status === activeStatus;
    return matchesStage && matchesStatus;
  });
}

function buildPortfolioQuote(events: SourcingEventSummary[]): string {
  if (events.length === 0) {
    return 'No source events match this filter. Reset the portfolio view before drawing a sourcing conclusion.';
  }

  const active = events.filter((event) => event.status === 'active').length;
  const atRisk = events.filter((event) => event.isAtRisk || event.status === 'at_risk').length;
  const topEvent = [...events].sort((left, right) => {
    if (Number(right.isAtRisk) !== Number(left.isAtRisk)) return Number(right.isAtRisk) - Number(left.isAtRisk);
    if (right.openAlerts !== left.openAlerts) return right.openAlerts - left.openAlerts;
    return right.valueAtStakeUsd - left.valueAtStakeUsd;
  })[0];

  return `${events.length} source events in view - ${active} active - ${atRisk} at risk. ${topEvent.name} is the top mission signal at ${topEvent.currentStageLabel}; next action: ${topEvent.nextAction}.`;
}

function selectTopEvent(events: SourcingEventSummary[]): SourcingEventSummary | null {
  return [...events].sort((left, right) => {
    if (Number(right.isAtRisk) !== Number(left.isAtRisk)) return Number(right.isAtRisk) - Number(left.isAtRisk);
    if (right.openAlerts !== left.openAlerts) return right.openAlerts - left.openAlerts;
    return right.valueAtStakeUsd - left.valueAtStakeUsd;
  })[0] ?? null;
}
