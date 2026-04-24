'use client';

// PhaseGateIndicator · File 10 §8.2 P0
//
// Inline indicator for phase-gate status on program cards and Tower
// surfaces. Compact variant of GateReadinessBanner — a dot + label +
// phase transition. Use in lists where a full banner is too heavy.
//
// States match GateReadinessState · keeps semantics aligned with the
// banner so the reader never sees contradictory cues on the same page.

import type { GateReadinessState } from './GateReadinessBanner';

export interface PhaseGateIndicatorProps {
  state: GateReadinessState;
  /** Phase transition label · e.g. "P2 → P3" or "Phase 1 gate". */
  label: string;
  /** Optional small tooltip / hover title. */
  title?: string;
  /** Compact · 11px dot + label; inline · same but smaller padding. */
  size?: 'compact' | 'inline';
}

const STATE_META: Record<GateReadinessState, { color: string; label: string; ring: string }> = {
  ready: { color: '#14B8A6', label: 'Ready', ring: 'rgba(20,184,166,0.25)' },
  blocked: { color: '#E04444', label: 'Blocked', ring: 'rgba(224,68,68,0.25)' },
  advanced: { color: '#2DD4BF', label: 'Advanced', ring: 'rgba(45,212,191,0.25)' },
  not_applicable: { color: '#8a7e72', label: 'No gate', ring: 'rgba(138,126,114,0.18)' },
};

export function PhaseGateIndicator({ state, label, title, size = 'inline' }: PhaseGateIndicatorProps) {
  const meta = STATE_META[state];
  const dotSize = size === 'compact' ? 10 : 8;
  const fontSize = size === 'compact' ? 11 : 10;

  return (
    <span
      className={`phase-gate-indicator phase-gate-${state}`}
      data-state={state}
      title={title ?? `${meta.label} · ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: meta.color,
        padding: size === 'compact' ? '3px 8px' : '2px 6px',
        borderRadius: 999,
        background: `${meta.color}14`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: meta.color,
          boxShadow: `0 0 0 3px ${meta.ring}`,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
      <span style={{ opacity: 0.7, fontWeight: 600, marginLeft: 2 }}>· {meta.label}</span>
    </span>
  );
}
