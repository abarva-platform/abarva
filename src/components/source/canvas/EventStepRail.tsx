import type { CSSProperties } from 'react';
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
 * 11-step rail across the lifecycle. Click navigates to /source/events/[id]?stage=<key>.
 * Visually elegant — single thin progress line, dots only at the current and selected step.
 */
export function EventStepRail({ eventId, currentStage, viewStage }: EventStepRailProps) {
  const currentIdx = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const selectedKey = viewStage ?? currentStage;
  const selectedIdx = SOURCE_STAGE_ORDER.indexOf(selectedKey);

  return (
    <nav data-testid="source-canvas-step-rail" aria-label="Sourcing lifecycle steps" style={RAIL_STYLE}>
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

          return (
            <Link
              key={stage}
              href={`/source/events/${eventId}?stage=${stage}`}
              style={{
                ...NODE_STYLE,
                left: `calc(${(i / (SOURCE_STAGE_ORDER.length - 1)) * 100}% - 14px)`,
              }}
              title={`${i + 1}. ${SOURCE_STAGE_LABELS[stage]}`}
              data-testid={`source-canvas-step-${stage}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                style={{
                  ...DOT_STYLE,
                  background: isDone || isCurrent ? CANVAS.INK : '#ffffff',
                  border: `1px solid ${isDone || isCurrent ? CANVAS.INK : CANVAS.RULE_STRONG}`,
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span
                style={{
                  ...LABEL_STYLE,
                  color: isSelected ? CANVAS.INK : CANVAS.INK_SOFT,
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <span style={NUMBER_STYLE}>{String(i + 1).padStart(2, '0')}</span>
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
  padding: '20px 14px 28px',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const TRACK_STYLE: CSSProperties = {
  position: 'relative',
  height: 48,
};

const LINE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 7,
  left: 14,
  right: 14,
  height: 1,
  background: CANVAS.RULE,
};

const LINE_DONE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 7,
  left: 14,
  height: 1,
  background: CANVAS.INK,
};

const NODE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 0,
  width: 28,
  display: 'grid',
  gap: 6,
  justifyItems: 'center',
  textDecoration: 'none',
  color: CANVAS.INK,
};

const DOT_STYLE: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 999,
  display: 'inline-block',
  transition: 'transform 120ms ease',
};

const LABEL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 1,
  justifyItems: 'center',
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  whiteSpace: 'nowrap',
};

const NUMBER_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.06em',
  color: CANVAS.GRAY_DK,
};

const NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11,
};
