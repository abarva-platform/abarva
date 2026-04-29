'use client';

/**
 * SynthesisDiffPanel — REASON-32
 *
 * Renders a "Compare with previous" toggle panel below the synthesis
 * confidence bar in both SourceProvenanceRibbon and ProgramProvenanceRibbon.
 *
 * Behaviour:
 *   • Toggle button: "Compare with previous" — collapses / expands the panel.
 *   • When expanded: computes a SynthesisDiff between `context` (current) and
 *     a simulated "before" state (current context with the last evidence item
 *     removed via `simulateBeforeContext`). No network call is needed — the
 *     diff is computed purely from the SynthesisContext already in scope.
 *   • Renders:
 *       – Green pills for gatesImproved
 *       – Red pills for gatesWorsened
 *       – Orange pills for newContradictions
 *       – Green pills for resolvedContradictions
 *       – ΔConfidence badge (mint for positive, rust for negative, muted for zero)
 *   • Empty diff → "No changes detected" message.
 *   • Toggle off → panel collapses.
 *
 * Props:
 *   context  — the current SynthesisContext (already computed server-side, passed down)
 *   surface  — 'source' | 'program' (used for aria labels only)
 */

import { useState, useMemo } from 'react';
import type { SynthesisContext, GateEvaluation, ContradictionDetection } from '@/lib/reasoning/types';
import {
  computeSynthesisDiff,
  isSynthesisDiffEmpty,
  simulateBeforeContext,
  type SynthesisDiff,
} from '@/lib/reasoning/synthesis-diff';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SynthesisDiffPanelProps {
  context: SynthesisContext;
  surface: 'source' | 'program';
}

// ─── Pill colour tokens ───────────────────────────────────────────────────────

const PILL_GREEN_BG = SHELL.MINT_BG;
const PILL_GREEN_TEXT = SHELL.MINT_TEXT;
const PILL_GREEN_BORDER = SHELL.MINT_LINE;

const PILL_RED_BG = SHELL.RUST_BG;
const PILL_RED_TEXT = SHELL.RUST_TEXT;
const PILL_RED_BORDER = '#ddb9aa';

const PILL_ORANGE_BG = SHELL.PEACH_BG;
const PILL_ORANGE_TEXT = SHELL.PEACH_TEXT;
const PILL_ORANGE_BORDER = SHELL.PEACH_LINE;

// ─── Component ────────────────────────────────────────────────────────────────

export function SynthesisDiffPanel({ context, surface }: SynthesisDiffPanelProps) {
  const [open, setOpen] = useState(false);

  // Memoize so clicking the toggle doesn't recompute every render
  const diff: SynthesisDiff = useMemo(() => {
    const before = simulateBeforeContext(context);
    return computeSynthesisDiff(before, context);
  }, [context]);

  const isEmpty = isSynthesisDiffEmpty(diff);

  return (
    <div
      data-testid="synthesis-diff-panel"
      aria-label={`Synthesis diff for ${surface} instance`}
      style={{ marginTop: 8 }}
    >
      {/* Toggle button */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev: boolean) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: 999,
          padding: '3px 10px',
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          color: SHELL.INK_SOFT,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: 2,
            background: open ? SHELL.MINT_TEXT : SHELL.INK_MUTED,
            transition: 'background 0.15s',
          }}
        />
        Compare with previous
      </button>

      {/* Collapsed state — render nothing more */}
      {!open ? null : (
        <div
          style={{
            marginTop: 8,
            padding: '10px 12px',
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 6,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            fontFamily: SHELL.SANS,
            fontSize: 11,
          }}
        >
          {isEmpty ? (
            <span style={{ color: SHELL.INK_MUTED, fontStyle: 'italic' }}>
              No changes detected
            </span>
          ) : (
            <>
              {/* ΔConfidence badge */}
              <ConfidenceDeltaBadge delta={diff.confidenceDelta} />

              {/* Gates improved */}
              {diff.gatesImproved.map((g) => (
                <GatePill
                  key={`improved-${g.criterionId}`}
                  gate={g}
                  kind="improved"
                />
              ))}

              {/* Gates worsened */}
              {diff.gatesWorsened.map((g) => (
                <GatePill
                  key={`worsened-${g.criterionId}`}
                  gate={g}
                  kind="worsened"
                />
              ))}

              {/* New contradictions */}
              {diff.newContradictions.map((c) => (
                <ContradictionPill
                  key={`new-${c.templateId}`}
                  contradiction={c}
                  kind="new"
                />
              ))}

              {/* Resolved contradictions */}
              {diff.resolvedContradictions.map((c) => (
                <ContradictionPill
                  key={`resolved-${c.templateId}`}
                  contradiction={c}
                  kind="resolved"
                />
              ))}

              {/* Evidence delta (informational, only when non-zero) */}
              {diff.evidenceDelta !== 0 ? (
                <EvidenceDeltaBadge delta={diff.evidenceDelta} />
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceDeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;

  const positive = delta > 0;
  const bg = positive ? PILL_GREEN_BG : PILL_RED_BG;
  const text = positive ? PILL_GREEN_TEXT : PILL_RED_TEXT;
  const border = positive ? PILL_GREEN_BORDER : PILL_RED_BORDER;
  const sign = positive ? '+' : '';

  return (
    <span
      title={`Synthesis confidence changed by ${sign}${delta}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: '2px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {sign}{delta} confidence
    </span>
  );
}

function EvidenceDeltaBadge({ delta }: { delta: number }) {
  const positive = delta > 0;
  const bg = positive ? PILL_GREEN_BG : PILL_RED_BG;
  const text = positive ? PILL_GREEN_TEXT : PILL_RED_TEXT;
  const border = positive ? PILL_GREEN_BORDER : PILL_RED_BORDER;
  const sign = positive ? '+' : '';

  return (
    <span
      title={`Citation count changed by ${sign}${delta}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: '2px 9px',
        fontFamily: SHELL.MONO,
        fontSize: 10,
        whiteSpace: 'nowrap',
      }}
    >
      {sign}{delta} citation{Math.abs(delta) === 1 ? '' : 's'}
    </span>
  );
}

function GatePill({
  gate,
  kind,
}: {
  gate: GateEvaluation;
  kind: 'improved' | 'worsened';
}) {
  const improved = kind === 'improved';
  const bg = improved ? PILL_GREEN_BG : PILL_RED_BG;
  const text = improved ? PILL_GREEN_TEXT : PILL_RED_TEXT;
  const border = improved ? PILL_GREEN_BORDER : PILL_RED_BORDER;
  const prefix = improved ? '↑ ' : '↓ ';
  // Use description if available (GateCriterionResult), otherwise fall back to criterionId
  const label =
    'description' in gate && typeof gate.description === 'string'
      ? gate.description
      : gate.criterionId;

  return (
    <span
      title={`Gate ${kind}: ${label} (${gate.stageId})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: '2px 9px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {prefix}
      {label}
    </span>
  );
}

function ContradictionPill({
  contradiction,
  kind,
}: {
  contradiction: ContradictionDetection;
  kind: 'new' | 'resolved';
}) {
  const resolved = kind === 'resolved';
  const bg = resolved ? PILL_GREEN_BG : PILL_ORANGE_BG;
  const text = resolved ? PILL_GREEN_TEXT : PILL_ORANGE_TEXT;
  const border = resolved ? PILL_GREEN_BORDER : PILL_ORANGE_BORDER;
  const prefix = resolved ? '✓ ' : '⚠ ';

  return (
    <span
      title={`${resolved ? 'Resolved' : 'New'} contradiction: ${contradiction.label} (${contradiction.severity})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 999,
        padding: '2px 9px',
        fontFamily: SHELL.SANS,
        fontSize: 10,
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {prefix}
      {contradiction.label}
    </span>
  );
}
