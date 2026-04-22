'use client';

import { useState, type CSSProperties } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PhaseState, ProgramFullState } from '@/lib/programs/types.ui';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';

interface Props {
  program: ProgramFullState;
}

// Distinct visual signature per C17 §3 · 5-phase horizontal sequence with
// current phase expanded to show deliverables + gate requirements. Desktop
// renders the 5 cards side-by-side with connecting arrows; mobile stacks
// vertically with the current phase expanded by default.
export function ProgramJourneyView({ program }: Props) {
  const reducedMotion = useReducedMotion();
  // Tracks which phase card is expanded on desktop. Null means only the
  // current phase expands; non-null overrides.
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const phases = program.phases;
  const currentPhase = program.currentPhase;

  const phaseState = (phase: PhaseState): 'complete' | 'current' | 'upcoming' | 'blocked' => {
    if (phase.canonicalPhase < currentPhase) return 'complete';
    if (phase.canonicalPhase === currentPhase) {
      return program.gateStatus === 'blocked' ? 'blocked' : 'current';
    }
    return 'upcoming';
  };

  const phaseToneColor = (state: ReturnType<typeof phaseState>) => {
    if (state === 'complete') return COLORS.teal;
    if (state === 'current') return COLORS.teal;
    if (state === 'blocked') return COLORS.amber;
    return 'rgba(255,255,255,0.35)';
  };

  // Per-phase deliverables for the expand panel.
  const deliverablesForPhase = (n: number) =>
    program.deliverables.filter((d) => {
      const mod = program.modules.find((m) => m.moduleKey === d.moduleKey);
      return mod?.phase === n;
    });

  return (
    <section aria-labelledby="journey-heading" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <EyebrowLabel tone="teal" size="sm">JOURNEY · 5-PHASE FRAMEWORK</EyebrowLabel>
          <SectionHeading id="journey-heading" size="lg" style={{ marginTop: 6 }}>
            {program.name}
          </SectionHeading>
          <Body tone="secondary" size="sm" style={{ marginTop: 4 }}>
            {program.gateSummary}
          </Body>
        </div>
        <div
          aria-label="Agent choreography"
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'rgba(245,245,240,0.55)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          AGENTS · <span style={{ color: COLORS.teal }}>NEXUS</span>
          {currentPhase <= 2 ? <span style={{ color: COLORS.teal, marginLeft: 6 }}>SENTINEL</span> : <span style={{ marginLeft: 6 }}>sentinel</span>}
          {currentPhase <= 3 ? <span style={{ color: COLORS.teal, marginLeft: 6 }}>ATLAS</span> : <span style={{ marginLeft: 6 }}>atlas</span>}
          <span style={{ color: COLORS.teal, marginLeft: 6 }}>STEWARD</span>
        </div>
      </div>

      {/* Horizontal phase strip · 5 cards on desktop, collapses to vertical
          under 960px via container queries (fallback: media query). */}
      <div
        className="journey-phase-strip"
        role="list"
        aria-label="Program phases"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))`,
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        {phases.map((phase, idx) => {
          const state = phaseState(phase);
          const tone = phaseToneColor(state);
          const isExpandable = state === 'current' || expandedPhase === phase.canonicalPhase;
          const isDefaultExpanded = state === 'current' && expandedPhase === null;
          const isExpanded = expandedPhase === phase.canonicalPhase || isDefaultExpanded;

          const cardStyle: CSSProperties = {
            position: 'relative',
            padding: 16,
            borderRadius: 10,
            background:
              state === 'current' ? 'rgba(20,184,166,0.08)'
                : state === 'complete' ? 'rgba(20,184,166,0.03)'
                : state === 'blocked' ? 'rgba(245,158,11,0.06)'
                : 'rgba(255,255,255,0.02)',
            border: `${state === 'current' ? 1 : 0.5}px ${state === 'upcoming' ? 'dashed' : 'solid'} ${state === 'current' ? tone : state === 'blocked' ? COLORS.amber : 'rgba(255,255,255,0.08)'}`,
            opacity: state === 'upcoming' ? 0.72 : 1,
            transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.inPlace}, border-color ${TRANSITIONS.inPlace}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 140,
          };

          return (
            <div key={phase.canonicalPhase} role="listitem" style={{ position: 'relative' }}>
              {idx > 0 ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: 58,
                    width: 6,
                    height: 1,
                    background: 'rgba(255,255,255,0.25)',
                  }}
                />
              ) : null}
              <article style={cardStyle}>
                <EyebrowLabel tone={state === 'blocked' ? 'amber' : state === 'upcoming' ? 'muted' : 'teal'} size="xs">
                  PHASE {phase.canonicalPhase} · {phase.gateType === 'hard' ? 'HARD GATE' : phase.gateType === 'soft' ? 'SOFT GATE' : ''}
                </EyebrowLabel>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 17,
                    fontWeight: 400,
                    color: COLORS.textPrimary,
                    lineHeight: 1.3,
                  }}
                >
                  {phase.name}
                </div>
                <Body size="xs" tone="muted" style={{ flex: 1 }}>
                  {phase.summary}
                </Body>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: tone,
                  }}
                >
                  {state === 'complete' && '✓ COMPLETE'}
                  {state === 'current' && '◆ IN PROGRESS'}
                  {state === 'blocked' && '⚠ BLOCKED AT GATE'}
                  {state === 'upcoming' && '· UPCOMING'}
                </div>

                {isExpandable ? (
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedPhase(isExpanded ? (isDefaultExpanded ? -1 : null) : phase.canonicalPhase)}
                    style={{
                      marginTop: 4,
                      background: 'transparent',
                      border: 'none',
                      color: COLORS.teal,
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 12,
                      fontWeight: 500,
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {isExpanded ? 'Hide deliverables' : 'Show deliverables'}
                  </button>
                ) : null}
              </article>
            </div>
          );
        })}
      </div>

      {/* Current-phase expansion · deliverables + gate requirements. Renders
          below the phase strip rather than inline to preserve the horizontal
          signature. */}
      {phases.map((phase) => {
        const state = phaseState(phase);
        const isDefault = state === 'current' && expandedPhase === null;
        const isExpanded = expandedPhase === phase.canonicalPhase || isDefault;
        if (!isExpanded || expandedPhase === -1) return null;
        const deliverables = deliverablesForPhase(phase.canonicalPhase);

        return (
          <div
            key={`expansion-${phase.canonicalPhase}`}
            style={{
              padding: 20,
              background: 'rgba(20,184,166,0.04)',
              border: '0.5px solid rgba(20,184,166,0.2)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <EyebrowLabel tone="teal" size="sm">PHASE {phase.canonicalPhase} · {phase.name.toUpperCase()}</EyebrowLabel>
              <MetaLabel>{phase.summary}</MetaLabel>
            </div>

            {deliverables.length === 0 ? (
              <Body size="sm" tone="muted">
                No deliverables logged for this phase yet.
              </Body>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {deliverables.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                      gap: 16,
                      alignItems: 'baseline',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '0.5px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                    }}
                  >
                    <Body size="sm" weight={500} tone="primary">
                      {d.title}
                      <span style={{ marginLeft: 8, color: 'rgba(245,245,240,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.08em' }}>
                        v{d.version}
                      </span>
                    </Body>
                    <EyebrowLabel tone={d.status === 'signed_off' ? 'teal' : d.status === 'in_review' ? 'amber' : 'muted'} size="xs">
                      {d.status.replace('_', ' ')}
                    </EyebrowLabel>
                    <MetaLabel>
                      {d.updatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </MetaLabel>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              <Body size="sm" tone="secondary">
                <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Gate · </strong>
                {program.gateSummary}
              </Body>
              <EyebrowLabel
                tone={program.gateStatus === 'cleared' ? 'teal' : program.gateStatus === 'blocked' ? 'amber' : 'muted'}
                size="xs"
              >
                {program.gateStatus === 'cleared' ? 'GATE PASSED' : program.gateStatus === 'blocked' ? 'GATE BLOCKED' : 'GATE PENDING'}
              </EyebrowLabel>
            </div>
          </div>
        );
      })}

      {/* Scoped responsive + focus + reduced-motion rules. */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .journey-phase-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 640px) {
          .journey-phase-strip {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
        button:focus-visible {
          outline: none;
          box-shadow: ${FOCUS_RING.brand};
          border-radius: 4px;
        }
      `}</style>
    </section>
  );
}
