/**
 * HandoffNarrativePanel — REASON-31
 *
 * Vertical list of stage-to-stage transitions describing the evidence handoff
 * from one lifecycle stage to the next. Sits below the lifecycle mini-graph
 * on Source event and Program detail pages.
 *
 * Server-friendly: no hooks, no event handlers, purely presentational.
 * Inputs come from `buildStageHandoffNarratives` (pure helper).
 *
 * AbarVa palette only — uses `SHELL` tokens for colour, type, and rule lines.
 */

import type { HandoffNarrative } from '@/lib/reasoning/stage-handoff-narrative';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface HandoffNarrativePanelProps {
  narratives: HandoffNarrative[];
}

export function HandoffNarrativePanel({ narratives }: HandoffNarrativePanelProps) {
  if (!narratives || narratives.length === 0) {
    return (
      <div
        data-testid="handoff-narrative-panel-empty"
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          padding: '12px 0',
        }}
      >
        Single-stage lifecycle — no handoffs
      </div>
    );
  }

  return (
    <section
      data-testid="handoff-narrative-panel"
      aria-label="Stage handoff narratives"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <header
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: SHELL.INK_MUTED,
          marginBottom: 2,
        }}
      >
        Stage handoffs · {narratives.length}
      </header>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {narratives.map((h, i) => (
          <li
            key={`${h.fromStageId}->${h.toStageId}`}
            data-testid="handoff-narrative-row"
            style={{
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${SHELL.CARD_LINE_SOFT}`,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 14,
                fontWeight: 600,
                color: SHELL.INK,
                lineHeight: 1.3,
                marginBottom: 4,
                letterSpacing: '-0.005em',
              }}
            >
              {h.fromLabel} <span style={{ color: SHELL.INK_MUTED }}>→</span>{' '}
              {h.toLabel}
            </div>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_SOFT,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {h.narrative}
            </p>
            {h.expectedHandoffArtifacts.length > 0 && (
              <div
                data-testid="handoff-narrative-chips"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {h.expectedHandoffArtifacts.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 9,
                      letterSpacing: '0.04em',
                      color: SHELL.INK_SOFT,
                      background: SHELL.PAPER_SOFT,
                      border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
                      borderRadius: 3,
                      padding: '2px 6px',
                    }}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
