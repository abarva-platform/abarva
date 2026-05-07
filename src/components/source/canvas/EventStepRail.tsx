'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { CANVAS } from './canvas-tokens';

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
 *   - Click navigates to /source/events/[id]?stage=<key>
 */
export function EventStepRail({ eventId, currentStage, viewStage }: EventStepRailProps) {
  const currentIdx = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const selectedKey = viewStage ?? currentStage;
  const selectedIdx = SOURCE_STAGE_ORDER.indexOf(selectedKey);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <nav
      data-testid="source-canvas-step-rail"
      aria-label="Sourcing lifecycle steps"
      style={RAIL_STYLE}
    >
      <div style={TRACK_STYLE}>
        <div style={LINE_STYLE} />
        <div
          style={{
            ...LINE_DONE_STYLE,
            width: `${(currentIdx / (SOURCE_STAGE_ORDER.length - 1)) * 100}%`,
          }}
        />
        {SOURCE_STAGE_ORDER.map((stage, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
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

          return (
            <Link
              key={stage}
              href={`/source/events/${eventId}?stage=${stage}`}
              style={{
                ...NODE_STYLE,
                left: `calc(${(i / (SOURCE_STAGE_ORDER.length - 1)) * 100}% - 16px)`,
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              title={`${i + 1}. ${SOURCE_STAGE_LABELS[stage]}`}
              data-testid={`source-canvas-step-${stage}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span style={DOT_WRAPPER_STYLE}>
                {showHalo ? <span aria-hidden style={HALO_STYLE} /> : null}
                <span
                  style={{
                    ...DOT_STYLE,
                    background: dotBg,
                    borderColor: dotBorder,
                    transform: isHover && !isSelected ? 'scale(1.12)' : 'scale(1)',
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
