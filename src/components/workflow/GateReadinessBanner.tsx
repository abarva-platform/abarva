'use client';

// GateReadinessBanner · File 10 §4.12 P0
//
// Renders the phase-gate state for a program: ready-to-advance, blocked,
// or already-advanced. Replaces the scattered ad-hoc gate language across
// surfaces.
//
// Four states per File 10 §4.12 spec:
//   ready          — all prerequisites met; advance affordance active
//   blocked        — one or more prerequisites not met; list them
//   advanced       — gate cleared; show approver + timestamp
//   not_applicable — program not at a gate boundary yet
//
// Not in scope for this component: the actual advance action. Consumers
// pass their own `onAdvance` handler which typically posts to
// /api/programs/phase-gate with the tenant gate per C2-07.

import type { ReactNode } from 'react';

export type GateReadinessState = 'ready' | 'blocked' | 'advanced' | 'not_applicable';

export interface GatePrerequisite {
  label: string;
  met: boolean;
  /** Optional short qualifier when prerequisite is met/unmet, e.g. "3 of 5 sign-offs received". */
  note?: string;
}

export interface GateReadinessBannerProps {
  state: GateReadinessState;
  /** Which phase this banner governs (e.g. "Phase 2 → Phase 3" or "P1 → P2"). */
  transitionLabel: string;
  /** Prerequisites checklist (shown inline for ready/blocked; collapsed after advance). */
  prerequisites: GatePrerequisite[];
  /** For advanced state — who advanced it + when. */
  advancedBy?: { name: string; at: string };
  /** Click handler for the Advance button (ready state only). */
  onAdvance?: () => void;
  /** Optional custom child (extra context below prerequisites). */
  children?: ReactNode;
}

const STATE_META: Record<GateReadinessState, { label: string; tone: string; accent: string; bg: string }> = {
  ready: {
    label: 'Ready to advance',
    tone: 'All prerequisites met; sponsor may advance this phase.',
    accent: '#14B8A6',
    bg: 'rgba(20,184,166,0.08)',
  },
  blocked: {
    label: 'Blocked',
    tone: 'One or more prerequisites remain open. Resolve below before advancing.',
    accent: '#E04444',
    bg: 'rgba(224,68,68,0.08)',
  },
  advanced: {
    label: 'Gate cleared',
    tone: 'This phase has advanced. The record below is the audit trail.',
    accent: '#2DD4BF',
    bg: 'rgba(45,212,191,0.08)',
  },
  not_applicable: {
    label: 'Not at a gate yet',
    tone: 'This program has no active phase boundary to advance.',
    accent: '#8a7e72',
    bg: 'rgba(138,126,114,0.08)',
  },
};

export function GateReadinessBanner({
  state,
  transitionLabel,
  prerequisites,
  advancedBy,
  onAdvance,
  children,
}: GateReadinessBannerProps) {
  const meta = STATE_META[state];
  const unmet = prerequisites.filter((p) => !p.met);
  const showPrereqs = state === 'ready' || state === 'blocked';

  return (
    <section
      className={`gate-readiness gate-${state}`}
      role="status"
      aria-label={`Gate readiness · ${meta.label}`}
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        background: meta.bg,
        border: `1px solid ${meta.accent}55`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: meta.accent,
            padding: '3px 10px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: `1px solid ${meta.accent}`,
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: '#6d625a',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {transitionLabel}
        </span>
      </header>

      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: '#3d342d' }}>{meta.tone}</p>

      {showPrereqs && prerequisites.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {prerequisites.map((p) => (
            <li key={p.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: p.met ? meta.accent : 'transparent',
                  border: `1.5px solid ${p.met ? meta.accent : '#8a7e72'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  alignSelf: 'center',
                }}
              >
                {p.met ? '✓' : ''}
              </span>
              <span style={{ color: p.met ? '#3d342d' : '#1a1612', fontWeight: p.met ? 400 : 600 }}>
                {p.label}
              </span>
              {p.note ? (
                <span style={{ color: '#6d625a', fontStyle: 'italic' }}>— {p.note}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {state === 'advanced' && advancedBy ? (
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.1em',
            color: '#6d625a',
          }}
        >
          advanced by {advancedBy.name} · {new Date(advancedBy.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      ) : null}

      {children ? <div>{children}</div> : null}

      {state === 'ready' && onAdvance ? (
        <button
          type="button"
          onClick={onAdvance}
          className="gate-advance-btn"
          style={{
            alignSelf: 'flex-start',
            padding: '9px 16px',
            borderRadius: 999,
            background: meta.accent,
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Advance {transitionLabel} →
        </button>
      ) : state === 'blocked' ? (
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: meta.accent,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {unmet.length} prerequisite{unmet.length === 1 ? '' : 's'} open
        </div>
      ) : null}
    </section>
  );
}
