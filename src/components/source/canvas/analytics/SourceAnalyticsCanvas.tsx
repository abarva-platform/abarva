'use client';

import type { CSSProperties } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { AskAnythingBar } from '@/components/agent/AskAnythingBar';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { ANALYTICS } from './analytics-tokens';
import { AnalyticsStageRail } from './AnalyticsStageRail';
import { ScopeAnalyticsStage } from './ScopeAnalyticsStage';
import { AvaLauncher } from './AvaLauncher';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import {
  SAMPLE_SCOPE_AVA,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_VALUE_STAGE,
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
 * (COMMITTED_VALUE_V1, flips committed value live), Value the realized-value actuals
 * (VALUE_REALIZATION_V1, flips value realization live); every other stage shares the
 * Scope exemplar until its own live view wires in. This is what makes clicking a
 * stage render that stage (not the Scope placeholder) when no live view is supplied.
 */
function sampleStageViewFor(stageKey: SourceStageKey): StageAnalyticsView {
  if (stageKey === 'strategy') return SAMPLE_STRATEGY_STAGE;
  if (stageKey === 'rfp') return SAMPLE_RFP_STAGE;
  if (stageKey === 'bafo') return SAMPLE_BAFO_STAGE;
  if (stageKey === 'selection') return SAMPLE_SELECTION_STAGE;
  if (stageKey === 'value') return SAMPLE_VALUE_STAGE;
  return SAMPLE_SCOPE_STAGE;
}

/** The matching aVa launcher scope for a viewing stage. */
function sampleAvaFor(stageKey: SourceStageKey): AvaLauncherView {
  return stageKey === 'strategy' ? SAMPLE_STRATEGY_AVA : SAMPLE_SCOPE_AVA;
}

/**
 * Same "N of M complete" derivation `ScopeAnalyticsStage` uses for its progress
 * bar — reused here (not re-invented) so the launcher's status claim can never
 * contradict what the page itself already shows. A task counts complete when
 * the server marked it done OR its persisted evidence (facts/artifact) makes
 * it complete.
 */
function taskCompletion(view: StageAnalyticsView): { done: number; total: number } {
  const total = view.tasks.length;
  const done = view.tasks.filter(
    (task) => task.state === 'done' || task.evidenceComplete === true,
  ).length;
  return { done, total };
}

/**
 * The launcher's context line, honest against the REAL stage view on screen.
 * The sample launchers (`SAMPLE_SCOPE_AVA` / `SAMPLE_STRATEGY_AVA`) carry a
 * specific, hardcoded claim ("Two steps left on Scope — volumetrics and the
 * sponsor letter…") that is only true for the sample data it was written
 * against. When the route supplies a LIVE stage view (`stageView` prop) but no
 * matching `avaLauncher`, falling back to that sample text would show a
 * specific claim that can contradict the real event — exactly the bug seen
 * live where Scope was actually complete. This computes an honest,
 * non-contradictory replacement from the SAME completion counters the page's
 * own progress bar renders, instead of inventing a new status source.
 */
function honestAvaContext(view: StageAnalyticsView): string {
  const { done, total } = taskCompletion(view);
  if (total === 0) return 'Ask me about this stage.';
  if (done >= total) {
    return `All ${total} step${total === 1 ? '' : 's'} on ${view.stageName} are complete. Ask me anything about the evidence or what's next.`;
  }
  const remaining = total - done;
  return `${remaining} of ${total} step${total === 1 ? '' : 's'} left on ${view.stageName}. Ask me what's outstanding or for help with any of them.`;
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
  // Bottom padding leaves room for the fixed AskAnythingBar mounted below
  // (outside <main>) so page content isn't hidden behind it.
  padding: '32px 40px 160px',
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
  // The launcher's role/suggestions are harmless generic copy either way, but
  // its `context` line makes a SPECIFIC claim. When the route did not supply
  // an explicit `avaLauncher` (the common case today), we would otherwise
  // fall back to the stage's SAMPLE launcher — whose context is written
  // against sample data and can contradict a real, live stage view (e.g.
  // claiming steps are outstanding on an event where they are actually
  // complete). Route-supplied `avaLauncher` is trusted as-is; only the
  // no-explicit-launcher fallback gets the honest, status-derived context —
  // computed from `resolvedStageView.tasks`, the SAME evidence backing the
  // page's own "N of M complete" counter.
  const resolvedAva: AvaLauncherView = avaLauncher
    ? avaLauncher
    : stageView
      ? { ...sampleAvaFor(viewStage), context: honestAvaContext(resolvedStageView) }
      : sampleAvaFor(viewStage);
  const stageLabel = SOURCE_STAGE_LABELS[viewStage] ?? resolvedStageView.stageName;

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
        {/* Raised so the fixed AskAnythingBar (mounted below, outside <main>)
         * does not sit on top of / collide with this FAB. */}
        <AvaLauncher launcher={resolvedAva} bottomOffset={112} />
      </main>
      {/* The real, typed chat input for this canvas. AvaLauncher above is a
       * presentational, proactive-nudge FAB with sample suggestion chips —
       * it has no text input and its chips do nothing when clicked. This is
       * the reachable path into the grounded Source aVa answer pipeline:
       * AskAnythingBar reads `surfaceContext` from the SAME AtlasPageState
       * this AppShell already populates above (`surfaceContext.sourceEventId`
       * flows straight through — see AppShell's `surfaceContext` prop passed
       * a few lines up), so no new context plumbing is needed. `surface`
       * matches the surface AppShell was given so the two stay in lockstep. */}
      <AskAnythingBar
        agent="sentinel"
        scopeLabel={`${event.code} · ${stageLabel}`}
        surface="source-detail"
        placeholder={`Ask aVa about ${stageLabel}…`}
      />
    </AppShell>
  );
}
