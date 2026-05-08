'use client';

// Intelligence v3 · stage tab navigation.
//
// Renders the canonical Brief + Map pair (PR-K2 · primary tabs) at
// the front of the row, then the seven exploration stages from the
// original design intent. Primary tabs get a Fraunces label + thin
// divider; the rest stay as the original Stage 1/2/3 pills.

import { COLORS, FONT, RADIUS, SPACING, BORDER } from '@/lib/design/abarva-theme';
import { STAGES, type StageKey } from './types';

interface Props {
  active: StageKey;
  onChange: (key: StageKey) => void;
}

export function IntelligenceV3StageTabs({ active, onChange }: Props) {
  const primary = STAGES.filter((s) => s.primary);
  const secondary = STAGES.filter((s) => !s.primary);

  return (
    <div
      role="tablist"
      aria-label="Intelligence stages"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        borderBottom: BORDER.hairlineSoft,
        paddingBottom: SPACING.md,
        marginBottom: SPACING.lg,
      }}
    >
      {/* Primary tabs · Brief + Map (the canonical corpus-grounded pair) */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: SPACING.xs }}>
        {primary.map((stage) => {
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
                alignItems: 'baseline',
                gap: SPACING.xs,
                border: isActive ? `1px solid ${COLORS.ink}` : `1px solid ${COLORS.border}`,
                background: isActive ? COLORS.ink : COLORS.surface,
                color: isActive ? COLORS.surface : COLORS.ink,
                fontFamily: 'var(--font-fraunces), Georgia, serif',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                padding: `${SPACING.sm - 2}px ${SPACING.md + 2}px`,
                borderRadius: RADIUS.pill,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider between primary and secondary */}
      <span
        aria-hidden="true"
        style={{
          height: 18,
          width: 1,
          background: COLORS.border,
          margin: `0 ${SPACING.xs}px`,
        }}
      />

      {/* Secondary tabs · Today / By function / etc. */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' }}>
        {secondary.map((stage) => {
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
                border: isActive ? `1px solid ${COLORS.navy}` : `1px solid ${COLORS.border}`,
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
    </div>
  );
}
