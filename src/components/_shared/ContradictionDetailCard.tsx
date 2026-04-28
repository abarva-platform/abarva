/**
 * ContradictionDetailCard — REASON-30
 *
 * Surfaces the *details* of each `ContradictionDetection` produced by the
 * `LifecycleContradictionDetector`. The provenance ribbon already shows a
 * count; this card lists each active contradiction with party labels,
 * severity, triggering keywords, confidence, and the pattern-authored
 * `resolutionPath`.
 *
 * Server-friendly presentation (no React hooks, no event handlers attached
 * server-side). The optional `onMarkResolved` handler is invoked from a
 * `'use client'` wrapper — when omitted the action button is not rendered.
 *
 * Empty list renders nothing — caller decides the empty state.
 */

import type { ContradictionDetection } from '@/lib/reasoning/types';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface ContradictionDetailCardProps {
  /** All currently-active (non-resolved) contradictions for the instance. */
  contradictions: ContradictionDetection[];
  /**
   * Optional handler — when provided, renders a "Mark resolved" ghost button
   * on each card. The id passed is `{instanceId}::{templateId}` per the
   * resolution-state convention; callers wire the prefix.
   */
  onMarkResolved?: (id: string) => void;
  /**
   * The id of the instance these contradictions belong to. Used to build the
   * resolution id passed to `onMarkResolved`. Required when the handler is
   * provided.
   */
  instanceId?: string;
}

const SEVERITY_DOT_COLOR: Record<ContradictionDetection['severity'], string> = {
  high: SHELL.RUST_TEXT,
  medium: SHELL.AMBER_DOT,
  low: SHELL.INK_MUTED,
};

const SEVERITY_LABEL: Record<ContradictionDetection['severity'], string> = {
  high: 'High severity',
  medium: 'Medium severity',
  low: 'Low severity',
};

export function ContradictionDetailCard({
  contradictions,
  onMarkResolved,
  instanceId,
}: ContradictionDetailCardProps) {
  if (contradictions.length === 0) return null;

  return (
    <section
      data-testid="contradiction-detail-card"
      style={{
        marginTop: 16,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
        }}
      >
        Contradictions · {contradictions.length} active
      </div>

      {contradictions.map((c) => {
        const dotColor = SEVERITY_DOT_COLOR[c.severity];
        const confidencePct = Math.round(c.confidence * 100);
        const resolutionId = instanceId ? `${instanceId}::${c.templateId}` : c.templateId;
        const matchedKeywords = c.triggeringEvidence.map((e) => e.field);

        return (
          <article
            key={c.templateId}
            data-testid={`contradiction-card-${c.templateId}`}
            style={{
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 8,
              background: SHELL.CARD_WHITE,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Header row: severity dot + title + confidence */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span
                aria-label={SEVERITY_LABEL[c.severity]}
                title={SEVERITY_LABEL[c.severity]}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: dotColor,
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontFamily: SHELL.SERIF,
                    fontSize: 16,
                    fontWeight: 500,
                    color: SHELL.INK,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {c.label}
                </h3>
              </div>
              <span
                title={`Detection confidence ${confidencePct}%`}
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_SOFT,
                  background: SHELL.GRAY_BG,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {confidencePct}%
              </span>
            </div>

            {/* Parties row — chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <PartyChip label={c.partyA} />
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: SHELL.INK_MUTED,
                }}
              >
                vs
              </span>
              <PartyChip label={c.partyB} />
            </div>

            {/* Detected from — matched evidence keys */}
            {matchedKeywords.length > 0 && (
              <div
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  letterSpacing: '0.04em',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Detected from
                </span>
                <span style={{ marginLeft: 8 }}>{matchedKeywords.join(' · ')}</span>
              </div>
            )}

            {/* Resolution path block */}
            <div
              style={{
                background: SHELL.PAPER_SOFT,
                border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: SHELL.INK_MUTED,
                }}
              >
                Resolution path
              </span>
              <p
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 12,
                  color: SHELL.INK_SOFT,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {c.resolutionPath}
              </p>
            </div>

            {/* Action row */}
            {onMarkResolved && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  data-testid={`contradiction-mark-resolved-${c.templateId}`}
                  onClick={() => onMarkResolved(resolutionId)}
                  style={{
                    fontFamily: SHELL.MONO,
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: SHELL.INK_SOFT,
                    background: 'transparent',
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 4,
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Mark resolved
                </button>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

function PartyChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 500,
        color: SHELL.INK,
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 999,
        padding: '2px 10px',
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}
