import type { CSSProperties } from 'react';
import { stageIndex, stageStepCount } from '@/lib/source/portfolio-derivations';
import type { SourceStageKey } from '@/lib/source/types';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import { PORTFOLIO } from './portfolio-tokens';

interface MiniRailProps {
  currentStageKey: SourceStageKey;
}

/**
 * Linear-style segmented progress bar + numeric label. Replaces the prior
 * 11-dot rail. The bar carries the *progress* signal at a glance; the label
 * carries the *step name* without competing for attention.
 *
 *   ▰▰▱▱▱▱▱▱▱▱▱   02 / 11 · Scope
 */
export function MiniRail({ currentStageKey }: MiniRailProps) {
  const idx = stageIndex(currentStageKey);
  const total = stageStepCount();
  const stageLabel = SOURCE_STAGE_LABELS[currentStageKey];
  const numberLabel = `${String(idx + 1).padStart(2, '0')} / ${total}`;

  return (
    <div
      role="img"
      aria-label={`Stage ${idx + 1} of ${total}: ${stageLabel}`}
      style={WRAPPER_STYLE}
    >
      <div style={BAR_STYLE}>
        <div
          style={{
            ...BAR_FILL_STYLE,
            width: `${((idx + 1) / total) * 100}%`,
          }}
        />
      </div>
      <span style={LABEL_STYLE}>
        <span style={NUMBER_STYLE}>{numberLabel}</span>
        <span style={SEP_STYLE}>·</span>
        <span style={NAME_STYLE}>{stageLabel}</span>
      </span>
    </div>
  );
}

const WRAPPER_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  whiteSpace: 'nowrap',
};

const BAR_STYLE: CSSProperties = {
  position: 'relative',
  height: 4,
  width: 88,
  borderRadius: 2,
  background: PORTFOLIO.RULE,
  overflow: 'hidden',
  flexShrink: 0,
};

const BAR_FILL_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: PORTFOLIO.INK,
  borderRadius: 2,
};

const LABEL_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 6,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  lineHeight: 1.3,
};

const NUMBER_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: PORTFOLIO.GRAY_DK,
};

const SEP_STYLE: CSSProperties = {
  color: PORTFOLIO.GRAY,
  fontSize: PORTFOLIO.T_BODY_SMALL,
};

const NAME_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 500,
  color: PORTFOLIO.INK,
};
