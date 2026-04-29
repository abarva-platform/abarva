'use client';

/**
 * SourceJourneyTrackerClient — REASON-31/32 thin client wrapper
 *
 * Wraps `SourceJourneyTracker` with:
 *   - `StageSynthesisDrawer` — opened per-stage via "View synthesis →" button
 *   - `HandoffNarrativePanel` — collapsed/expanded section below the tracker
 *
 * Accepts the same `stages` prop as `SourceJourneyTracker` plus:
 *   - `instanceId`      — lifecycle-pattern instance id (for the API call)
 *   - `patternStageMap` — Record<stageLabel, stageId> mapping stage labels
 *                          (as rendered in the tracker chips) to the
 *                          LifecyclePatternSeed stage id required by the drawer
 *   - `handoffNarratives` — pre-built narrative list (pure, no LLM)
 *
 * Server parent passes all data down; this component owns only the open/close
 * toggle state.
 */

import { useState } from 'react';

import { SHELL } from '@/lib/shell/shell-tokens';
import type { HandoffNarrative } from '@/lib/reasoning/stage-handoff-narrative';
import type { WorkflowStage } from '@/lib/source/types';

import { SourceJourneyTracker } from './SourceJourneyTracker';
import { StageSynthesisDrawer } from '@/components/_shared/StageSynthesisDrawer';
import { HandoffNarrativePanel } from '@/components/_shared/HandoffNarrativePanel';

export interface SourceJourneyTrackerClientProps {
  stages: WorkflowStage[];
  /** Instance id passed to the stage-synthesis API. */
  instanceId: string;
  /**
   * Maps each stage label (as rendered in the SourceJourneyTracker chips,
   * e.g. "BAFO") to the LifecyclePatternSeed stage id (e.g. "BAFO").
   * Build this with: `Object.fromEntries(pattern.stages.map(s => [s.label, s.id]))`
   */
  patternStageMap: Record<string, string>;
  /** Pre-built handoff narratives (from `buildStageHandoffNarratives`). */
  handoffNarratives: HandoffNarrative[];
}

export function SourceJourneyTrackerClient({
  stages,
  instanceId,
  patternStageMap,
  handoffNarratives,
}: SourceJourneyTrackerClientProps) {
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const [showHandoffs, setShowHandoffs] = useState(false);

  const handleSynthesisClick = (stageKey: string, stageLabel: string) => {
    // Prefer label-based lookup (e.g. "BAFO" → "BAFO") then fall back to key
    const patternId = patternStageMap[stageLabel] ?? patternStageMap[stageKey] ?? stageLabel;
    setOpenStageId(patternId);
  };

  const openStageLabel = openStageId != null
    ? (Object.entries(patternStageMap).find(([, id]) => id === openStageId)?.[0] ?? openStageId)
    : '';

  return (
    <>
      <SourceJourneyTracker
        stages={stages}
        onSynthesisClick={handleSynthesisClick}
      />

      {/* REASON-31 — Stage handoff narrative expandable */}
      <div
        data-testid="source-journey-handoff-section"
        style={{
          borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          marginTop: 0,
        }}
      >
        <button
          type="button"
          data-testid="source-journey-handoff-toggle"
          onClick={() => setShowHandoffs((v) => !v)}
          aria-expanded={showHandoffs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            width: '100%',
            textAlign: 'left',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              transition: 'transform 120ms ease',
              transform: showHandoffs ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: 8,
              lineHeight: 1,
            }}
          >
            ▶
          </span>
          Stage handoffs · {handoffNarratives.length}
        </button>
        {showHandoffs && (
          <div
            data-testid="source-journey-handoff-panel"
            style={{ padding: '0 18px 14px' }}
          >
            <HandoffNarrativePanel narratives={handoffNarratives} />
          </div>
        )}
      </div>

      {/* REASON-32 — Per-stage LLM-streamed synthesis drawer */}
      {openStageId && (
        <StageSynthesisDrawer
          open
          instanceId={instanceId}
          stageId={openStageId}
          stageLabel={openStageLabel}
          onClose={() => setOpenStageId(null)}
        />
      )}
    </>
  );
}
