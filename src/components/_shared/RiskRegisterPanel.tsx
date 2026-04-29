/**
 * RiskRegisterPanel — joins contradictions + failure modes into a single
 * prioritised risk register.
 *
 * Server-friendly: no React hooks, no event handlers. Pure presentational.
 * Renders nothing when `risks` is empty unless the caller opts in via the
 * `showEmptyState` flag.
 */

import type { RiskItem } from '@/lib/reasoning/risk-register';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface RiskRegisterPanelProps {
  /** All risk rows, already sorted by `buildRiskRegisterForInstance`/portfolio. */
  risks: RiskItem[];
  /** Optional title shown above the table. */
  title?: string;
  /** Optional cap on rendered rows; defaults to all. */
  maxRows?: number;
  /**
   * When true, renders the "No risks detected" line even with an empty list.
   * Defaults to true so the panel is self-explanatory.
   */
  showEmptyState?: boolean;
}

const SEVERITY_DOT: Record<RiskItem['severity'], string> = {
  high: SHELL.RUST_TEXT,
  medium: SHELL.AMBER_DOT,
  low: SHELL.INK_MUTED,
};

const SEVERITY_LABEL: Record<RiskItem['severity'], string> = {
  high: 'High severity',
  medium: 'Medium severity',
  low: 'Low severity',
};

const KIND_LABEL: Record<RiskItem['kind'], string> = {
  contradiction: 'Contradiction',
  'failure-mode': 'Failure mode',
};

const KIND_BG: Record<RiskItem['kind'], string> = {
  contradiction: SHELL.PEACH_BG,
  'failure-mode': SHELL.GRAY_BG,
};

const KIND_LINE: Record<RiskItem['kind'], string> = {
  contradiction: SHELL.PEACH_LINE,
  'failure-mode': SHELL.GRAY_LINE,
};

function excerpt(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function RiskRegisterPanel({
  risks,
  title = 'Risk register',
  maxRows,
  showEmptyState = true,
}: RiskRegisterPanelProps) {
  const rows = typeof maxRows === 'number' ? risks.slice(0, maxRows) : risks;

  if (rows.length === 0 && !showEmptyState) return null;

  return (
    <section
      data-testid="risk-register-panel"
      style={{
        marginTop: 16,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SHELL.INK_MUTED,
          }}
        >
          {title} · {rows.length} {rows.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div
          data-testid="risk-register-empty"
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 12,
            color: SHELL.INK_MUTED,
            padding: '8px 0',
          }}
        >
          No risks detected.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r) => {
            const confidencePct = Math.round(r.confidence * 100);
            return (
              <article
                key={`${r.kind}::${r.instanceId}::${r.id}`}
                data-testid={`risk-register-row-${r.kind}-${r.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 7,
                }}
              >
                {/* Severity dot */}
                <span
                  aria-label={SEVERITY_LABEL[r.severity]}
                  title={SEVERITY_LABEL[r.severity]}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: SEVERITY_DOT[r.severity],
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Header row: kind badge + label + confidence */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: SHELL.INK_SOFT,
                        background: KIND_BG[r.kind],
                        border: `1px solid ${KIND_LINE[r.kind]}`,
                        borderRadius: 999,
                        padding: '1px 8px',
                      }}
                    >
                      {KIND_LABEL[r.kind]}
                    </span>
                    <span
                      style={{
                        fontFamily: SHELL.SANS,
                        fontSize: 13,
                        color: SHELL.INK,
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {r.label}
                    </span>
                    <span
                      title={`Detection confidence ${confidencePct}%`}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        color: SHELL.INK_SOFT,
                        background: SHELL.GRAY_BG,
                        border: `1px solid ${SHELL.CARD_LINE}`,
                        padding: '1px 8px',
                        borderRadius: 999,
                        marginLeft: 'auto',
                      }}
                    >
                      {confidencePct}%
                    </span>
                  </div>

                  {/* Instance + mitigation excerpt */}
                  <div
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Instance
                    </span>
                    <span style={{ marginLeft: 8 }}>{r.instanceLabel}</span>
                  </div>
                  {r.mitigation.length > 0 && (
                    <p
                      style={{
                        fontFamily: SHELL.SANS,
                        fontSize: 12,
                        color: SHELL.INK_SOFT,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {excerpt(r.mitigation)}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
