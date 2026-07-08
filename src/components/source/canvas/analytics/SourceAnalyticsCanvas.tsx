'use client';

import type { CSSProperties } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { ANALYTICS } from './analytics-tokens';
import { AnalyticsStageRail } from './AnalyticsStageRail';
import { ScopeAnalyticsStage } from './ScopeAnalyticsStage';
import { AvaLauncher } from './AvaLauncher';
import {
  SAMPLE_SCOPE_AVA,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_SELECTION_STAGE,
} from './sample-view-model';
import {
  SAMPLE_STRATEGY_AVA,
  SAMPLE_STRATEGY_STAGE,
} from './strategy-sample-view-model';
import type {
  AvaLauncherView,
  StageAnalyticsView,
  StepInsightView,
} from './view-model';
import type { SourceStageKey, SourcingEventSummary } from '@/lib/source/types';

/**
 * The honest SAMPLE stage view for a given viewing stage. Strategy is the
 * mandate/intake exemplar; RFP, BAFO, and Selection each have their own scaffold so
 * their dropzone offers the stage-specific upload — RFP the clause checklist
 * (RFP_CLAUSES_V1, flips RFP clause coverage live), BAFO the concession actuals
 * (BAFO_CONCESSIONS_V1, flips BAFO progress live), Selection the award commitments
 * (COMMITTED_VALUE_V1, flips committed value live); every other stage shares the
 * Scope exemplar until its own live view wires in. This is what makes clicking a
 * stage render that stage (not the Scope placeholder) when no live view is supplied.
 */
function sampleStageViewFor(stageKey: SourceStageKey): StageAnalyticsView {
  if (stageKey === 'strategy') return SAMPLE_STRATEGY_STAGE;
  if (stageKey === 'rfp') return SAMPLE_RFP_STAGE;
  if (stageKey === 'bafo') return SAMPLE_BAFO_STAGE;
  if (stageKey === 'selection') return SAMPLE_SELECTION_STAGE;
  return SAMPLE_SCOPE_STAGE;
}

/** The matching aVa launcher scope for a viewing stage. */
function sampleAvaFor(stageKey: SourceStageKey): AvaLauncherView {
  return stageKey === 'strategy' ? SAMPLE_STRATEGY_AVA : SAMPLE_SCOPE_AVA;
}

interface SourceAnalyticsCanvasProps {
  event: SourcingEventSummary;
  viewStage: SourceStageKey;
  tenantName: string;
  /**
   * The stage view to render. When omitted, the canvas renders the honest SAMPLE
   * view for `viewStage` (Strategy → the mandate exemplar; every other stage →
   * the Scope exemplar). At integration the route passes the live
   * `StageAnalyticsView` and the sample falls away.
   */
  stageView?: StageAnalyticsView;
  /**
   * The per-step killer insight for `viewStage` (value pool / value bridge /
   * should-cost). Attached onto whichever stage view renders (live or sample),
   * so the "✦ Intelligence" tab leads with it. Absent → the tab shows the
   * IntelPanel read only.
   */
  stepInsight?: StepInsightView;
  /** aVa's launcher scope. Defaults to the sample scope for `viewStage`. */
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
  stageView,
  stepInsight,
  avaLauncher,
}: SourceAnalyticsCanvasProps) {
  const eventMeta = [event.accountName, event.archetype].filter(Boolean).join(' · ');
  // Select the stage view: the live view when the route supplied one, else the
  // honest SAMPLE view for the stage on screen. This is the fix for the rail —
  // clicking Strategy renders the Strategy stage, not the Scope placeholder.
  const baseStageView = stageView ?? sampleStageViewFor(viewStage);
  // Attach the per-step insight onto whichever view resolved. The insight rides
  // its own provenance (live/sample/model), independent of the stage view's.
  const resolvedStageView: StageAnalyticsView = stepInsight
    ? { ...baseStageView, stepInsight }
    : baseStageView;
  const resolvedAva = avaLauncher ?? sampleAvaFor(viewStage);

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
          <ScopeAnalyticsStage
            view={resolvedStageView}
            eventId={event.id}
            stageKey={viewStage}
          />
        </div>
        <AvaLauncher launcher={resolvedAva} />
      </main>
    </AppShell>
  );
}
