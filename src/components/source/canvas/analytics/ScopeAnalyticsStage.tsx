'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
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
}

type StageTab = 'inputs' | 'intel';

/**
 * The redesigned Source stage page — aligned to the standalone design:
 *
 *   [ H1 + purpose ]
 *   [ progress bar · N of M complete · Continue to gate → ]
 *   [ tabs: Inputs to gate | ✦ Intelligence ]     ← directly under the header
 *
 * The "Inputs to gate" tab carries the task checklist (beat 2) and the gate
 * (beat 3). The "Intelligence" tab foregrounds the engine's read for THIS stage
 * ("What Source brings to <stage>") — and the value-type waterfall ONLY when the
 * stage actually has one. Intake stages (Scope) have no waterfall: the value
 * pool is a downstream artifact, not something to fabricate at Scope.
 */
export function ScopeAnalyticsStage({
  view,
  eventId,
  stageKey,
}: ScopeAnalyticsStageProps) {
  const [tab, setTab] = useState<StageTab>('inputs');
  const gateRef = useRef<HTMLDivElement>(null);

  const { done, total } = useMemo(() => {
    const t = view.tasks.length;
    const d = view.tasks.filter((task) => task.state === 'done').length;
    return { done: d, total: t };
  }, [view.tasks]);
  const allComplete = total > 0 && done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const goToGate = () => {
    setTab('inputs');
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

      {/* Tabs — directly under the header/progress bar (per design). */}
      <div
        style={{
          display: 'inline-flex',
          background: ANALYTICS.SOFT,
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          borderRadius: 11,
          padding: 3,
          gap: 2,
          margin: '0 0 20px',
        }}
      >
        <TabButton active={tab === 'inputs'} onClick={() => setTab('inputs')}>
          Inputs to gate
        </TabButton>
        <TabButton active={tab === 'intel'} onClick={() => setTab('intel')}>
          <span style={{ color: ANALYTICS.TEAL_BRIGHT, marginRight: 6 }}>✦</span>
          Intelligence
        </TabButton>
      </div>

      {tab === 'inputs' ? (
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
              Intelligence tab (per design), not above the tabs. */}
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        background: active ? ANALYTICS.CARD : 'none',
        boxShadow: active ? ANALYTICS.SHADOW_SM : 'none',
        padding: '8px 16px',
        borderRadius: ANALYTICS.RADIUS_SM,
        fontSize: 13.5,
        fontWeight: 600,
        color: active ? ANALYTICS.INK : ANALYTICS.MUTED,
        cursor: 'pointer',
        fontFamily: ANALYTICS.SANS,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}
