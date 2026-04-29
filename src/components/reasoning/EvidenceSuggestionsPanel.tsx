'use client';

/**
 * EvidenceSuggestionsPanel — REASON-37
 *
 * Collapsible panel listing context-sensitive suggestions for what evidence
 * a user should upload to satisfy unmet gate criteria.
 *
 * - High priority (rust)   — hard gate, status 'unmet'
 * - Medium priority (amber) — hard gate 'partial' or soft gate 'unmet'
 * - Low priority (gray)    — soft gate 'partial'
 * - Empty state            — "All gate criteria covered" in mint
 *
 * AbarVa palette only. Strict TypeScript — no `any`.
 */

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { EvidenceSuggestion, EvidencePriority } from '@/lib/reasoning/evidence-suggestions';

// ─── Priority display config ───────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  EvidencePriority,
  { bg: string; border: string; text: string; label: string }
> = {
  high: {
    bg: SHELL.RUST_BG,
    border: '#d9957a',
    text: SHELL.RUST_TEXT,
    label: 'High',
  },
  medium: {
    bg: '#fdf0cc',
    border: '#e6c96e',
    text: '#7a6020',
    label: 'Medium',
  },
  low: {
    bg: SHELL.GRAY_BG,
    border: SHELL.GRAY_LINE,
    text: SHELL.GRAY_TEXT,
    label: 'Low',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EvidenceSuggestionsPanelProps {
  suggestions: EvidenceSuggestion[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EvidenceSuggestionsPanel({
  suggestions,
}: EvidenceSuggestionsPanelProps) {
  const [open, setOpen] = useState(false);

  const isEmpty = suggestions.length === 0;

  return (
    <div
      data-testid="evidence-suggestions-panel"
      style={{
        marginTop: 16,
        border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        borderRadius: 10,
        background: SHELL.CARD_WHITE,
        overflow: 'hidden',
      }}
    >
      {/* ── Collapsible trigger ─────────────────────────────────────────── */}
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: isEmpty ? 'default' : 'pointer',
          fontFamily: SHELL.MONO,
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: SHELL.INK_MUTED,
          textAlign: 'left',
        }}
        aria-expanded={open}
        aria-controls="evidence-suggestions-body"
        onClick={() => {
          if (!isEmpty) setOpen((v: boolean) => !v);
        }}
        disabled={isEmpty}
      >
        {isEmpty ? (
          <span style={{ color: SHELL.MINT_TEXT }}>
            All gate criteria covered ✓
          </span>
        ) : (
          <>
            <span>Evidence gaps · {suggestions.length} unmet</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Priority summary chips */}
              {(['high', 'medium', 'low'] as EvidencePriority[]).map(
                (priority) => {
                  const count = suggestions.filter(
                    (s) => s.priority === priority,
                  ).length;
                  if (count === 0) return null;
                  const cfg = PRIORITY_CONFIG[priority];
                  return (
                    <span
                      key={priority}
                      style={{
                        background: cfg.bg,
                        color: cfg.text,
                        fontFamily: SHELL.MONO,
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 999,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      {count} {cfg.label.toLowerCase()}
                    </span>
                  );
                },
              )}
              <span
                style={{
                  fontFamily: SHELL.MONO,
                  fontSize: 10,
                  color: SHELL.INK_MUTED,
                  marginLeft: 2,
                }}
              >
                {open ? '▲' : '▼'}
              </span>
            </span>
          </>
        )}
      </button>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {open && !isEmpty && (
        <div
          id="evidence-suggestions-body"
          style={{
            borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {suggestions.map((suggestion) => {
            const cfg = PRIORITY_CONFIG[suggestion.priority];
            return (
              <div
                key={suggestion.criterionId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '10px 12px',
                  background: SHELL.PAPER,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 7,
                  borderLeft: `3px solid ${cfg.border}`,
                }}
              >
                {/* Header row: priority badge + description */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: cfg.bg,
                      color: cfg.text,
                      fontFamily: SHELL.MONO,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 999,
                      border: `1px solid ${cfg.border}`,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {cfg.label}
                  </span>
                  <span
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 12,
                      color: SHELL.INK,
                      lineHeight: 1.45,
                      flex: 1,
                    }}
                  >
                    {suggestion.criterionDescription}
                  </span>
                </div>

                {/* Sub-bullets: suggested evidence types */}
                <ul
                  style={{
                    margin: '0 0 0 16px',
                    padding: 0,
                    listStyle: 'disc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {suggestion.suggestedEvidenceTypes.map((type) => (
                    <li
                      key={type}
                      style={{
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        color: SHELL.INK_SOFT,
                        lineHeight: 1.5,
                        paddingLeft: 2,
                      }}
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
