'use client';

// Intelligence v3 · 7-stage tab navigation.
//
// Renders the seven exploration stages from the design intent doc.
// Tab pill shows label + maturity tier ("Stage 1/2/3"). Active tab gets
// solid navy treatment.

import { COLORS, FONT, RADIUS, SPACING, BORDER } from '@/lib/design/abarva-theme';
import { STAGES, type StageKey } from './types';

interface Props {
  active: StageKey;
  onChange: (key: StageKey) => void;
}

export function IntelligenceV3StageTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Intelligence stages"
      style={{
        display: 'flex',
        gap: SPACING.xs,
        flexWrap: 'wrap',
        borderBottom: BORDER.hairlineSoft,
        paddingBottom: SPACING.md,
        marginBottom: SPACING.lg,
      }}
    >
      {STAGES.map((stage) => {
        const isActive = stage.key === active;
        return (
          <button
            key={stage.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`stage-panel-${stage.key}`}
            onClick={() => onChange(stage.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              border: isActive
                ? `1px solid ${COLORS.navy}`
                : `1px solid ${COLORS.border}`,
              background: isActive ? COLORS.navy : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.body,
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.pill,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{stage.label}</span>
            <span
              style={{
                fontFamily: FONT.mono,
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              Stage {stage.stage}
            </span>
          </button>
        );
      })}
    </div>
  );
}
