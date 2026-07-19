'use client';

import { useMemo, useRef, type CSSProperties } from 'react';
import { ANALYTICS } from './analytics-tokens';
import { IntelPanel } from './IntelPanel';
import { TaskChecklist } from './TaskChecklist';
import { ScopeGate } from './ScopeGate';
import { ValueWaterfall } from './ValueWaterfall';
import { StepInsightPanel } from './insights';
import type { StageAnalyticsView } from './view-model';

interface ScopeAnalyticsStageProps {
  view: StageAnalyticsView;
  /**
   * The Source event id + stage key. When present, `provide` dropzones become
   * real uploaders (persist to Azure Blob + the artifact registry). Absent →
   * the dropzones stay presentational (sample/preview mode).
   */
  eventId?: string;
  stageKey?: string;
  activeWorkspace?: 'workflow' | 'intelligence';
  onWorkspaceChange?: (workspace: 'workflow' | 'intelligence') => void;
}

/**
 * The redesigned Source stage page — aligned to the standalone design:
 *
 *   [ H1 + purpose ]
 *   [ progress bar · N of M complete · Continue to gate → ]
 *   [ three workflow blocks ]                     ← directly under progress
 *
 * The workflow carries the task checklist (beat 2) and gate-readiness handoff
 * (beat 3). The rail's Intelligence option foregrounds the engine's read for
 * THIS stage — and the value-type waterfall ONLY when the stage actually has
 * one. Intake stages (Scope) have no waterfall: the value pool is downstream.
 */
export function ScopeAnalyticsStage({
  view,
  eventId,
  stageKey,
  activeWorkspace = 'workflow',
  onWorkspaceChange = () => {},
}: ScopeAnalyticsStageProps) {
  const gateRef = useRef<HTMLDivElement>(null);

  const { done, total } = useMemo(() => {
    const t = view.tasks.length;
    // Count a task complete when the server marked it done OR its persisted
    // evidence (facts/artifact) makes it complete — so the top progress bar +
    // "N of M complete" counter survive a reload / tab switch, matching the
    // checklist below. Honest: `evidenceComplete` is only set from real evidence.
    const d = view.tasks.filter(
      (task) => task.state === 'done' || task.evidenceComplete === true,
    ).length;
    return { done: d, total: t };
  }, [view.tasks]);
  const allComplete = total > 0 && done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const openCount = Math.max(total - done, 0);

  const goToGate = () => {
    onWorkspaceChange('workflow');
    // Let the tab switch commit, then reveal the gate.
    requestAnimationFrame(() =>
      gateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const headStyle: CSSProperties = { marginBottom: 18 };

  return (
    <div data-testid="scope-analytics-stage">
      <div style={headStyle}>
        <h1
          style={{
            fontFamily: ANALYTICS.SERIF,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '-0.8px',
            color: ANALYTICS.INK,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {view.stageName}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: ANALYTICS.MUTED,
            lineHeight: 1.5,
            margin: '10px 0 0',
            maxWidth: '62ch',
          }}
        >
          {view.purpose}
        </p>
      </div>

      {/* Progress bar + Continue to gate — the design's top control. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          margin: '0 0 18px',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: ANALYTICS.SOFT,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: 999,
                background: ANALYTICS.GREEN,
                transition: 'width 240ms ease',
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: ANALYTICS.MUTED,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <b style={{ color: ANALYTICS.INK }}>{done}</b> of {total} complete
        </div>
        <button
          type="button"
          onClick={goToGate}
          disabled={!allComplete}
          style={{
            border: `1px solid ${allComplete ? ANALYTICS.INK : ANALYTICS.LINE}`,
            background: allComplete ? ANALYTICS.INK : 'transparent',
            color: allComplete ? '#fff' : ANALYTICS.FAINT,
            padding: '8px 16px',
            borderRadius: ANALYTICS.RADIUS_SM,
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: ANALYTICS.SANS,
            cursor: allComplete ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
          }}
        >
          Continue to gate →
        </button>
      </div>

      <div
        aria-label={`${view.stageName} workflow`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          margin: '0 0 18px',
        }}
      >
        <WorkflowBlockCard
          active={activeWorkspace === 'workflow' && !allComplete}
          title="1. Define the work"
          subtitle="Scope, owner, exclusions, evidence"
          count={`${done}/${total}`}
          onClick={() => onWorkspaceChange('workflow')}
        />
        <WorkflowBlockCard
          active={activeWorkspace === 'intelligence'}
          title="2. Check intelligence"
          subtitle="Risks, traps, value signals"
          count={view.intel.points.length > 0 ? 'ready' : 'none'}
          onClick={() => onWorkspaceChange('intelligence')}
        />
        <WorkflowBlockCard
          active={activeWorkspace === 'workflow' && allComplete}
          title="3. Prepare approval"
          subtitle="Packet, rationale, next-stage handoff"
          count={allComplete ? 'ready' : `${openCount} open`}
          onClick={goToGate}
        />
      </div>

      {activeWorkspace === 'workflow' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Beat 2 — the task checklist. */}
          <TaskChecklist
            tasks={view.tasks}
            eventId={eventId}
            stageKey={stageKey}
          />
          {/* Beat 3 — the gate. */}
          <div ref={gateRef}>
            <ScopeGate gate={view.gate} stageName={view.stageName} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Per-step KILLER INSIGHT leads the tab when this step carries one:
              Strategy → value pool, Pricing → value bridge, Evaluation →
              should-cost. Each foregrounds its "so what" headline above the
              chart. Absent → the IntelPanel read carries the tab. */}
          {view.stepInsight ? (
            <StepInsightPanel insight={view.stepInsight} />
          ) : null}
          {/* Beat 1 — "What Source brings to <stage>" lives INSIDE the
              Intelligence explorer, not above the workflow. */}
          <IntelPanel intel={view.intel} stageName={view.stageName} />
          {/* The value-type waterfall renders ONLY when the stage genuinely
              carries one (value/analytical stages) AND the step insight is not
              already the value bridge (which renders its own waterfall — no
              double render). Intake stages fabricate nothing. */}
          {view.waterfall && view.stepInsight?.kind !== 'value_bridge' ? (
            <ValueWaterfall waterfall={view.waterfall} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function WorkflowBlockCard({
  active,
  title,
  subtitle,
  count,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  count: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? ANALYTICS.BLUE : ANALYTICS.LINE}`,
        background: ANALYTICS.CARD,
        borderRadius: ANALYTICS.RADIUS_SM,
        padding: '11px 13px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: ANALYTICS.SANS,
        boxShadow: active ? '0 0 0 1px rgba(48,111,255,0.08)' : 'none',
        minHeight: 58,
      }}
    >
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          color: ANALYTICS.INK,
          fontSize: 13.5,
          fontWeight: 700,
          lineHeight: 1.3,
        }}
      >
        <span>{title}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {count}
        </span>
      </span>
      <span
        style={{
          display: 'block',
          color: ANALYTICS.INK_2,
          fontSize: 12,
          lineHeight: 1.4,
          marginTop: 6,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}
