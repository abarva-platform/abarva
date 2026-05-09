'use client';

// Intelligence v3 · stage tab navigation.
//
// Renders the Intelligence submenu as one quiet toolbar. The stage
// metadata stays in the route model; the CXO-facing navigation only
// shows the destination names with a clear active underline.

import { COLORS, FONT, RADIUS, SPACING } from '@/lib/design/abarva-theme';
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
        gap: 2,
        overflowX: 'auto',
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
        background: COLORS.surface2,
        padding: 4,
        margin: 0,
        width: 'fit-content',
        maxWidth: '100%',
        boxShadow: '0 1px 2px rgba(10, 12, 18, 0.03)',
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
              minHeight: 34,
              border: 'none',
              background: isActive ? COLORS.surface : 'transparent',
              color: isActive ? COLORS.ink : COLORS.muted,
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: 0,
              padding: `${SPACING.sm}px ${SPACING.md + 2}px ${SPACING.sm + 2}px`,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isActive
                ? `0 1px 4px rgba(10, 12, 18, 0.08), inset 0 -2px 0 ${COLORS.navy}`
                : 'inset 0 -2px 0 transparent',
              transition: 'background 140ms ease, color 140ms ease, box-shadow 140ms ease',
            }}
          >
            {stage.label}
          </button>
        );
      })}
    </div>
  );
}
