'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

export type StageStatus = 'passed' | 'current' | 'upcoming' | 'blocked';

interface StageTrackerStripProps {
  stages: string[];
  activeStage: string;
  onStageSelect?: (stage: string) => void;
  /** Optional gate-driven state per stage. When provided, overrides color logic. */
  stageStates?: Record<string, StageStatus>;
}

// Pipe divider positions — after index (0-based): after RFI(1), RFP(4), BAFO(7), Award(8)
// indices for standard 10-stage: Plan(0) RFI(1) Shortlist(2) RFP(3) Q&A(4) Initial-Bid(5) BAFO(6) Selection(7) Award(8) Onboard(9)
// Dividers after: index 1, 4, 6, 8
const PIPE_AFTER = new Set([1, 4, 6, 8]);

// Color values for blocked (amber) — SHELL.AMBER_DOT is available
const AMBER = SHELL.AMBER_DOT;

/**
 * Resolve pip/label colors from a gate-driven StageStatus.
 * Exported for unit testing.
 */
export function colorsForStatus(status: StageStatus): {
  pipColor: string;
  labelColor: string;
  labelWeight: number;
} {
  switch (status) {
    case 'passed':
      return { pipColor: SHELL.MINT_TEXT, labelColor: SHELL.MINT_TEXT, labelWeight: 400 };
    case 'current':
      return { pipColor: SHELL.INK, labelColor: SHELL.INK, labelWeight: 600 };
    case 'upcoming':
      return { pipColor: SHELL.GRAY_LINE, labelColor: SHELL.INK_MUTED, labelWeight: 400 };
    case 'blocked':
      return { pipColor: AMBER, labelColor: AMBER, labelWeight: 600 };
  }
}

/**
 * Compute the display colors for a stage given the full strip context.
 * Used in both the component and tests to verify the coloring logic.
 *
 * @param stage        Stage label
 * @param index        Position in stages array
 * @param activeIndex  Index of activeStage
 * @param stageStates  Optional gate-driven states (when provided, overrides index logic)
 */
export function resolveStageColors(
  stage: string,
  index: number,
  activeIndex: number,
  stageStates?: Record<string, StageStatus>,
): { pipColor: string; labelColor: string; labelWeight: number } {
  if (stageStates) {
    const status: StageStatus = stageStates[stage] ?? 'upcoming';
    return colorsForStatus(status);
  }
  const isDone = index < activeIndex;
  const isCurrent = index === activeIndex;
  return {
    pipColor: isDone ? SHELL.MINT_TEXT : isCurrent ? SHELL.INK : SHELL.GRAY_LINE,
    labelColor: isCurrent ? SHELL.INK : isDone ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
    labelWeight: isCurrent ? 600 : 400,
  };
}

export function StageTrackerStrip({ stages, activeStage, onStageSelect, stageStates }: StageTrackerStripProps) {
  const activeIndex = stages.indexOf(activeStage);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleStageClick(stage: string) {
    if (onStageSelect) {
      onStageSelect(stage);
      return;
    }
    // Default: toggle ?stage= query param so the page can filter/highlight.
    // Clicking the already-active stage clears the filter.
    const params = new URLSearchParams(searchParams.toString());
    if (stage === activeStage) {
      params.delete('stage');
    } else {
      params.set('stage', stage);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0 }}>
      {stages.map((stage, index) => {
        const showPipe = PIPE_AFTER.has(index) && index < stages.length - 1;

        // Gate-driven coloring when stageStates is provided; index-based fallback otherwise.
        const { pipColor, labelColor, labelWeight } = resolveStageColors(
          stage, index, activeIndex, stageStates,
        );

        return (
          <div
            key={stage}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
          >
            {/* Stage pip + label */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleStageClick(stage)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStageClick(stage); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '0 6px',
                cursor: 'pointer',
              }}
            >
              {/* Pip rectangle */}
              <div
                style={{
                  width: 16,
                  height: 4,
                  borderRadius: 2,
                  background: pipColor,
                  transition: 'background 0.15s',
                }}
              />
              {/* Label */}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  color: labelColor,
                  fontWeight: labelWeight,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {stage}
              </span>
            </div>

            {/* Pipe divider after certain groups */}
            {showPipe && (
              <div
                style={{
                  borderLeft: `1px solid ${SHELL.CARD_LINE}`,
                  height: 20,
                  flexShrink: 0,
                  margin: '0 4px',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
