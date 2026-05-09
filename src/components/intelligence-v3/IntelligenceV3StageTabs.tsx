'use client';

// Intelligence v3 · stage tab navigation.
//
// Renders the Intelligence submenu as a quiet toolbar: text labels,
// one active underline, no stage badges, no pill row.

import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
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
        alignItems: 'center',
        gap: SPACING.xxl,
        overflowX: 'auto',
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        padding: `0 ${SPACING.xs}px`,
        margin: 0,
        width: '100%',
        maxWidth: '100%',
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
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 42,
              border: 'none',
              borderBottom: `2px solid ${isActive ? COLORS.navy : 'transparent'}`,
              background: 'transparent',
              color: isActive ? COLORS.ink : COLORS.muted,
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: 0,
              padding: `${SPACING.md}px 0 ${SPACING.sm}px`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'border-color 140ms ease, color 140ms ease',
            }}
          >
            {stage.label}
          </button>
        );
      })}
    </div>
  );
}
