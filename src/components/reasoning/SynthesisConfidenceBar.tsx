/**
 * SynthesisConfidenceBar — REASON-30
 *
 * Renders a thin horizontal progress bar (6 px height) expressing the
 * computed synthesis confidence score for a given SynthesisContext.
 *
 * - Bar fill:  mint (high ≥ 75) · amber (medium ≥ 45) · rust (low < 45)
 * - Label:     "Synthesis confidence: <score>"
 * - Tooltip:   factors joined by newline (via `title` attribute)
 * - Width:     200 px, inline in ribbon footer
 *
 * Server component: no `"use client"`, no hooks, no event handlers.
 */

import type { SynthesisContext } from '@/lib/reasoning/types';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import { SHELL } from '@/lib/shell/shell-tokens';

interface SynthesisConfidenceBarProps {
  context: SynthesisContext;
}

// ─── Grade → fill colour mapping ─────────────────────────────────────────────

const GRADE_FILL: Record<'high' | 'medium' | 'low', string> = {
  high: SHELL.MINT_TEXT,
  medium: SHELL.AMBER_DOT,
  low: SHELL.RUST_TEXT,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SynthesisConfidenceBar({ context }: SynthesisConfidenceBarProps) {
  const { score, grade, factors } = computeSynthesisConfidence(context);
  const fillColor = GRADE_FILL[grade];
  const tooltipText = factors.join('\n');

  return (
    <div
      title={tooltipText}
      aria-label={`Synthesis confidence: ${score}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 3,
        width: 200,
      }}
    >
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          color: SHELL.INK_MUTED,
          whiteSpace: 'nowrap',
        }}
      >
        Synthesis confidence:{' '}
        <span style={{ color: SHELL.INK, fontWeight: 600 }}>{score}</span>
      </span>
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: 'relative',
          width: '100%',
          height: 6,
          background: SHELL.CARD_LINE,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${score}%`,
            background: fillColor,
            borderRadius: 999,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
