'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { FilterPillStrip } from '@/components/shell/FilterPillStrip';
import { SourceEventsPortfolio } from '@/components/source/SourceEventsPortfolio';
import { SourcePortfolioAgentCanvas } from '@/components/source/SourcePortfolioAgentCanvas';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';
import type { Artifact } from '@/lib/agent/artifacts';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceLifecycleStatus, SourceStageKey, SourcingEventSummary } from '@/lib/source/types';

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
            padding: '20px 28px 28px',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: SHELL.INK_MUTED,
                marginBottom: 4,
              }}
            >
              Sentinel - procurement workspace - seeded portfolio
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 22,
                fontWeight: 700,
                color: SHELL.INK,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              Ask Sentinel what is open in sourcing
            </h1>
          </div>

          <SourcePortfolioAgentCanvas
            quote={buildPortfolioQuote(eventsInView)}
            events={eventsInView}
            activeStage={activeStage}
            activeStatus={activeStatus}
            artifacts={artifacts}
            onArtifact={handleArtifact}
          />

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
