'use client';

import type { CSSProperties } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { ANALYTICS } from './analytics-tokens';
import { AnalyticsStageRail } from './AnalyticsStageRail';
import { ScopeAnalyticsStage } from './ScopeAnalyticsStage';
import { AvaLauncher } from './AvaLauncher';
import { SAMPLE_SCOPE_AVA, SAMPLE_SCOPE_STAGE } from './sample-view-model';
import type { AvaLauncherView, StageAnalyticsView } from './view-model';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';

interface SourceAnalyticsCanvasProps {
  event: SourcingEventSummary;
  viewStage: SourceStageKey;
  tenantName: string;
  /**
   * The stage view to render. Defaults to the sample Scope exemplar while the
   * value-analytics evaluator slice is being wired — at integration, the route
   * passes the live `StageAnalyticsView` and the sample falls away.
   */
  stageView?: StageAnalyticsView;
  /** aVa's launcher scope. Defaults to the sample Scope scope. */
  avaLauncher?: AvaLauncherView;
}

const MAIN_STYLE: CSSProperties = {
  background: ANALYTICS.PAGE_BG,
  minHeight: '100%',
  fontFamily: ANALYTICS.SANS,
  color: ANALYTICS.INK,
};

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 260px) minmax(0, 1fr)',
  gap: 40,
  maxWidth: 1180,
  margin: '0 auto',
  padding: '32px 40px 96px',
  alignItems: 'start',
};

/**
 * The redesigned Source stage canvas — the "three-beat" page. Ships DARK behind
 * `source_analytics`: when the flag is OFF the route renders the current
 * `UniversalCanvasShell` untouched; when ON, this canvas renders alongside it.
 *
 * It mounts inside `AppShell surface="source-detail"` (no second nav) and uses
 * the Source sub-nav, exactly like the current shell. Scope is the worked
 * exemplar; other stages plug in the same `StageAnalyticsView`.
 */
export function SourceAnalyticsCanvas({
  event,
  viewStage,
  tenantName,
  stageView = SAMPLE_SCOPE_STAGE,
  avaLauncher = SAMPLE_SCOPE_AVA,
}: SourceAnalyticsCanvasProps) {
  const eventMeta = [event.accountName, event.archetype].filter(Boolean).join(' · ');

  return (
    <AppShell
      surface="source-detail"
      agentName="aVa"
      surfaceContext={{
        sourceEventId: event.id,
        sourceEventCode: event.code,
        viewStage,
        surfaceVariant: 'source_analytics',
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `${event.code} · ${event.name}`,
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-analytics-canvas" style={MAIN_STYLE}>
        <div style={GRID_STYLE}>
          <AnalyticsStageRail
            eventId={event.id}
            eventName={event.name}
            eventMeta={eventMeta}
            viewStage={viewStage}
            currentStage={event.currentStageKey}
          />
          <ScopeAnalyticsStage view={stageView} />
        </div>
        <AvaLauncher launcher={avaLauncher} />
      </main>
    </AppShell>
  );
}
