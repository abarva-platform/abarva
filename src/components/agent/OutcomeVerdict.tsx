'use client';

// OutcomeVerdict · Maestro Intake three-outcome pressure-test display
//
// Renders a GO / REFINE / REDIRECT verdict card after the agent finishes
// pressure-testing an intake. Matches File 01 FM-01 spec — visible outcome,
// visible rationale, factor decomposition, next-step affordance.
//
// This component is the Code lane's share of FM-01. Codex's Stage 5
// composition produces the `OutcomeVerdictShape` from the intake turn +
// tenant context + pattern library retrieval. This file just renders what
// it's handed.
//
// Anti-patterns the component rejects:
// - No verdict: never render a fallback "still thinking" card with an
//   outcome shape; either the verdict is produced, or the intake surface
//   shows sparsity prose from §10.4 vocabulary.
// - No hiding LOW-confidence verdicts behind HIGH-confidence styling:
//   confidence tier is always visible.
// - No implicit conversion of REDIRECT into soft GO: the three outcomes
//   are discrete; REDIRECT reads as REDIRECT.

import { useCallback } from 'react';
import type { OutcomeVerdictShape } from '@/lib/agent/outcomeVerdict';
import { OUTCOME_META } from '@/lib/agent/outcomeVerdict';
import { SparsitySignal } from './SparsitySignal';

interface OutcomeVerdictProps {
  verdict: OutcomeVerdictShape;
  onNextStep?: () => void;
}

export function OutcomeVerdict({ verdict, onNextStep }: OutcomeVerdictProps) {
  const meta = OUTCOME_META[verdict.outcome];

  const handleNext = useCallback(() => {
    if (verdict.next_step.href) {
      if (typeof window !== 'undefined') window.location.assign(verdict.next_step.href);
      return;
    }
    onNextStep?.();
  }, [verdict.next_step, onNextStep]);

  return (
    <section
      className={`outcome-verdict outcome-${verdict.outcome.toLowerCase()}`}
      role="region"
      aria-label={`Intake verdict · ${meta.label}`}
      style={{
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        padding: '20px 22px',
        borderRadius: 16,
        background: `${meta.accent}12`,
        border: `1px solid ${meta.accent}55`,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {verdict.sparse_retrieval ? <SparsitySignal /> : null}

      <header style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <span
          className="outcome-pill"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            padding: '6px 12px',
            borderRadius: 999,
            background: meta.accent,
            color: '#0A0A0B',
          }}
        >
          {meta.label}
        </span>
        <span style={{ fontSize: 12, color: '#6d625a', fontStyle: 'italic' }}>{meta.tone}</span>
        <span
          className="outcome-confidence"
          style={{
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#8a7e72',
            fontWeight: 700,
          }}
        >
          confidence · {verdict.confidence}
        </span>
      </header>

      <h3
        style={{
          margin: 0,
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 20,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: '#1a1612',
        }}
      >
        {verdict.headline}
      </h3>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#3d342d' }}>
        {verdict.rationale}
      </p>

      {verdict.factors.length > 0 ? (
        <div
          className="outcome-factors"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingTop: 10,
            borderTop: '1px solid rgba(26,22,18,0.08)',
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#8a7e72',
              fontWeight: 700,
            }}
          >
            Factors weighed
          </div>
          {verdict.factors.map((factor) => (
            <div key={factor.label} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    factor.signal === 'strong' ? '#14B8A6' :
                    factor.signal === 'mixed' ? '#F59E0B' :
                    '#E04444',
                  flexShrink: 0,
                  alignSelf: 'center',
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1612', minWidth: 150 }}>
                {factor.label}
              </span>
              <span style={{ fontSize: 13, color: '#544b42', lineHeight: 1.5 }}>{factor.note}</span>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleNext}
        className="outcome-next-step"
        style={{
          alignSelf: 'flex-start',
          marginTop: 4,
          padding: '10px 16px',
          borderRadius: 999,
          border: `1px solid ${meta.accent}`,
          background: '#FFFFFF',
          color: meta.accent,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = meta.accent;
          e.currentTarget.style.color = '#0A0A0B';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF';
          e.currentTarget.style.color = meta.accent;
        }}
      >
        {verdict.next_step.label} →
      </button>
    </section>
  );
}
