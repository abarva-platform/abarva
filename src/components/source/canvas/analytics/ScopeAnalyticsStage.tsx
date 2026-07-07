'use client';

import { useState, type CSSProperties } from 'react';
import { ANALYTICS } from './analytics-tokens';
import { IntelPanel } from './IntelPanel';
import { TaskChecklist } from './TaskChecklist';
import { ScopeGate } from './ScopeGate';
import { ValueWaterfall } from './ValueWaterfall';
import type { StageAnalyticsView } from './view-model';

interface ScopeAnalyticsStageProps {
  view: StageAnalyticsView;
}

type StageTab = 'inputs' | 'intel';

/**
 * The redesigned Source stage page — the three-beat pattern rendered on the
 * canvas:
 *
 *   [ Intel we bring ]  +  [ Your inputs & feedback ]  →  [ Deliverable ]
 *
 * Beat 1 (intel) is always present. The "Inputs to gate" tab carries beats 2
 * (task checklist) and 3 (the gate); the "Intelligence" tab foregrounds the
 * engine's read + the value-type waterfall. This is the Scope stage as the
 * intake exemplar — every intake stage renders from the same `StageAnalyticsView`.
 */
export function ScopeAnalyticsStage({ view }: ScopeAnalyticsStageProps) {
  const [tab, setTab] = useState<StageTab>('inputs');

  const headStyle: CSSProperties = { marginBottom: 20 };

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

      {/* Beat 1 — always on the page, above the fold. */}
      <IntelPanel intel={view.intel} />

      {/* Tabs: Inputs to gate (beats 2 → 3) · Intelligence (the read + waterfall) */}
      <div
        style={{
          display: 'inline-flex',
          background: ANALYTICS.SOFT,
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          borderRadius: 11,
          padding: 3,
          gap: 2,
          margin: '22px 0 20px',
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
          <TaskChecklist tasks={view.tasks} />
          {/* Beat 3 — the gate. */}
          <ScopeGate gate={view.gate} stageName={view.stageName} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {view.waterfall ? (
            <ValueWaterfall waterfall={view.waterfall} />
          ) : (
            <p style={{ fontSize: 13.5, color: ANALYTICS.MUTED }}>
              No value-type analysis on this stage yet.
            </p>
          )}
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
