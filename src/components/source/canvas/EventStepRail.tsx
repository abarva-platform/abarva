'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from './canvas-tokens';

/**
 * Stages to show when the rail is collapsed (audit M2).
 * We show: all done stages + current + the next one gate (if any).
 * Everything else hides behind "All stages" toggle.
 */
function getVisibleStageIndices(currentIdx: number, total: number): Set<number> {
  const visible = new Set<number>();
  for (let i = 0; i <= currentIdx; i++) visible.add(i); // done + current
  if (currentIdx + 1 < total) visible.add(currentIdx + 1); // next
  return visible;
}

interface EventStepRailProps {
  eventId: string;
  currentStage: SourceStageKey;
  /** Optional viewing stage (when user navigates to a different step than current). */
  viewStage?: SourceStageKey;
}

/**
 * 11-step rail across the lifecycle.
 *
 *   - Done dots: filled ink, hairline border
 *   - Current dot: filled ink + soft halo ring (so "you are here" reads instantly)
 *   - Future dots: outlined, hairline border
 *   - Selected (viewing) overrides current treatment with the strong ring
 *   - Progress line fills behind done + current
 *   - Hover: subtle scale + label color shift
 *   - Past/current steps navigate to /source/events/[id]?stage=<key>
 *   - Future steps are locked; advancement must use the Gate promotion action.
 */
export function EventStepRail({ eventId, currentStage, viewStage }: EventStepRailProps) {
  const currentIdx = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const selectedKey = viewStage ?? currentStage;
  const selectedIdx = SOURCE_STAGE_ORDER.indexOf(selectedKey);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Audit M2: collapsed by default — show done + current + next only.
  // "All stages" toggle reveals the full 11-node rail.
  const hasFutureStages = currentIdx < SOURCE_STAGE_ORDER.length - 2;
  const [showAll, setShowAll] = useState(false);
  const visibleIndices = showAll
    ? null // null = show all
    : getVisibleStageIndices(currentIdx, SOURCE_STAGE_ORDER.length);

  return (
    <nav
      data-testid="source-canvas-step-rail"
      aria-label="Sourcing lifecycle steps"
      style={RAIL_STYLE}
    >
      {hasFutureStages && (
        <div style={TOGGLE_ROW_STYLE}>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={TOGGLE_BTN_STYLE}
            aria-expanded={showAll}
          >
            {showAll ? 'Collapse stages' : 'All stages'}
          </button>
        </div>
      )}
      <div style={TRACK_STYLE}>
        <div style={LINE_STYLE} />
        <div
          style={{
            ...LINE_DONE_STYLE,
            width: `${(currentIdx / (SOURCE_STAGE_ORDER.length - 1)) * 100}%`,
          }}
        />
        {SOURCE_STAGE_ORDER.map((stage, i) => {
          // Hide stages outside the visible set (collapsed view).
          if (visibleIndices && !visibleIndices.has(i)) return null;
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const isSelected = i === selectedIdx;
          const isHover = i === hoverIdx;

          // Halo only on the SELECTED step (which is current by default).
          const showHalo = isSelected;
          const dotBg = isDone || isCurrent ? CANVAS.INK : '#ffffff';
          const dotBorder = isDone || isCurrent ? CANVAS.INK : CANVAS.RULE_STRONG;

          const labelColor = isSelected
            ? CANVAS.INK
            : isDone || isCurrent || isHover
              ? CANVAS.INK_2
              : CANVAS.INK_MUTED;

          const nodeStyle = {
            ...NODE_STYLE,
            left: `calc(${(i / (SOURCE_STAGE_ORDER.length - 1)) * 100}% - 16px)`,
            cursor: isFuture ? 'not-allowed' : 'pointer',
          };
          const nodeBody = (
            <>
              <span style={DOT_WRAPPER_STYLE}>
                {showHalo ? <span aria-hidden style={HALO_STYLE} /> : null}
                <span
                  style={{
                    ...DOT_STYLE,
                    background: dotBg,
                    borderColor: dotBorder,
                    transform: isHover && !isSelected && !isFuture ? 'scale(1.12)' : 'scale(1)',
                    opacity: isFuture ? 0.58 : 1,
                  }}
                />
              </span>
              <span
                style={{
                  ...LABEL_STYLE,
                  color: labelColor,
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <span
                  style={{
                    ...NUMBER_STYLE,
                    color: isSelected ? CANVAS.INK : CANVAS.GRAY_DK,
                    fontWeight: isSelected ? 700 : 600,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={NAME_STYLE}>{SOURCE_STAGE_LABELS[stage]}</span>
              </span>
            </>
          );

          return isFuture ? (
            <span
              key={stage}
              style={nodeStyle}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              title={`${i + 1}. ${SOURCE_STAGE_LABELS[stage]} · locked until prior gate promotion`}
              data-testid={`source-canvas-step-${stage}`}
              aria-disabled="true"
            >
              {nodeBody}
            </span>
          ) : (
            <Link
              key={stage}
              href={`/source/events/${eventId}?stage=${stage}`}
              style={nodeStyle}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              title={`${i + 1}. ${SOURCE_STAGE_LABELS[stage]}`}
              data-testid={`source-canvas-step-${stage}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {nodeBody}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const RAIL_STYLE: CSSProperties = {
  padding: '24px 16px 28px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const TRACK_STYLE: CSSProperties = {
  position: 'relative',
  height: 52,
};

const LINE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 9,
  left: 16,
  right: 16,
  height: 2,
  background: CANVAS.RULE,
  borderRadius: 2,
};

const LINE_DONE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 9,
  left: 16,
  height: 2,
  background: CANVAS.INK,
  borderRadius: 2,
};

const NODE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  width: 32,
  display: 'grid',
  gap: 8,
  justifyItems: 'center',
  textDecoration: 'none',
  color: CANVAS.INK,
};

const DOT_WRAPPER_STYLE: CSSProperties = {
  position: 'relative',
  width: 20,
  height: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const HALO_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 999,
  border: `2px solid ${CANVAS.INK}`,
  opacity: 0.18,
  pointerEvents: 'none',
};

const DOT_STYLE: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  display: 'inline-block',
  border: '1.5px solid',
  transition: 'transform 120ms ease, background 120ms ease, border-color 120ms ease',
};

const LABEL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 2,
  justifyItems: 'center',
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  whiteSpace: 'nowrap',
  transition: 'color 120ms ease',
};

const NUMBER_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.08em',
};

const NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11,
};

// Audit M2 additions
const TOGGLE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 4,
};

const TOGGLE_BTN_STYLE: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 5,
  padding: '2px 8px',
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: CANVAS.INK_MUTED,
  cursor: 'pointer',
};
