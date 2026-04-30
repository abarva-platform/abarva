'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SHELL } from '@/lib/shell/shell-tokens';

export type StageStatus = 'passed' | 'current' | 'upcoming' | 'blocked';

type StageTrackerVariant = 'compact' | 'journey';

interface StageTrackerStripProps {
  stages: string[];
  activeStage: string;
  onStageSelect?: (stage: string) => void;
  /** Optional gate-driven state per stage. When provided, overrides color logic. */
  stageStates?: Record<string, StageStatus>;
  /** Source uses the journey variant so the stage path reads as a user traversal, not a tiny status barcode. */
  variant?: StageTrackerVariant;
  personaLabel?: string;
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

export function StageTrackerStrip({
  stages,
  activeStage,
  onStageSelect,
  stageStates,
  variant = 'compact',
  personaLabel = 'Sourcing lead',
}: StageTrackerStripProps) {
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

  if (variant === 'journey') {
    return (
      <div
        aria-label={`${personaLabel} sourcing journey`}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(150px, 0.24fr) minmax(0, 1fr)',
          alignItems: 'center',
          gap: 14,
          padding: '8px 0 9px',
        }}
      >
        <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8.5,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: SHELL.INK_MUTED,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            Sourcing journey
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: SHELL.INK,
                color: SHELL.PAPER,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SHELL.MONO,
                fontSize: 8,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              SL
            </span>
            <div style={{ display: 'grid', gap: 1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  fontWeight: 800,
                  color: SHELL.INK,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {personaLabel}
              </span>
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: AMBER,
                  whiteSpace: 'nowrap',
                }}
              >
                Step {activeIndex + 1 > 0 ? activeIndex + 1 : '-'} of {stages.length}: {activeStage || 'Select stage'}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '2px 2px 0',
          }}
        >
          {stages.map((stage, index) => {
            const { pipColor, labelColor, labelWeight } = resolveStageColors(
              stage,
              index,
              activeIndex,
              stageStates,
            );
            const status = stageStates?.[stage] ?? (index < activeIndex ? 'passed' : index === activeIndex ? 'current' : 'upcoming');
            const isCurrent = index === activeIndex;
            const isDone = status === 'passed';
            const isBlocked = status === 'blocked';
            const nextStage = stages[index + 1];

            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: '1 0 84px', minWidth: 84 }}>
                <button
                  type="button"
                  onClick={() => handleStageClick(stage)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleStageClick(stage); }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${stage} stage ${index + 1} of ${stages.length}${isCurrent ? ', current stage' : ''}`}
                  style={{
                    appearance: 'none',
                    border: isCurrent ? `1px solid ${SHELL.INK}` : `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 14,
                    background: isCurrent
                      ? `linear-gradient(180deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.PAPER} 100%)`
                      : 'transparent',
                    boxShadow: isCurrent ? '0 8px 20px rgba(12, 26, 58, 0.14)' : 'none',
                    padding: isCurrent ? '5px 7px 6px' : '4px 4px',
                    display: 'grid',
                    justifyItems: 'center',
                    gap: 4,
                    minWidth: isCurrent ? 76 : 64,
                    transform: isCurrent ? 'translateY(-1px)' : 'none',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {isCurrent && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -9,
                        borderRadius: 999,
                        background: AMBER,
                        color: SHELL.CARD_WHITE,
                        padding: '2px 6px',
                        fontFamily: SHELL.MONO,
                        fontSize: 7,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontWeight: 900,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      You are here
                    </span>
                  )}
                  <span
                    style={{
                      width: isCurrent ? 24 : 18,
                      height: isCurrent ? 24 : 18,
                      borderRadius: 999,
                      border: `2px solid ${pipColor}`,
                      background: isDone ? pipColor : isCurrent ? SHELL.CARD_WHITE : isBlocked ? '#fff7ed' : SHELL.PAPER_SOFT,
                      color: isDone ? SHELL.CARD_WHITE : pipColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: SHELL.MONO,
                      fontSize: isCurrent ? 9 : 8,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: isCurrent ? 9 : 8,
                      color: labelColor,
                      fontWeight: isCurrent ? 900 : labelWeight,
                      letterSpacing: '0.04em',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stage}
                  </span>
                </button>
                {nextStage && (
                  <div
                    aria-hidden
                    style={{
                      height: 3,
                      flex: '1 1 26px',
                      minWidth: 18,
                      borderRadius: 999,
                      background: index < activeIndex ? SHELL.MINT_TEXT : SHELL.CARD_LINE,
                      margin: '0 -1px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
