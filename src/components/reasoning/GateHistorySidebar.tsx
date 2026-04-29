'use client';

/**
 * GateHistorySidebar — REASON-38
 *
 * Collapsible panel showing the session audit trail of gate waivers, approvals,
 * and rejections for a given program instance.
 *
 * Behaviour:
 *   - Default: collapsed.
 *   - On expand: fetches /api/reasoning/gate-history/:instanceId.
 *   - Auto-refreshes every 30 s while expanded.
 *   - Shows a compact timeline: coloured dot + criterion ID + action + truncated
 *     justification + relative time.
 *   - Empty state: "No gate actions this session".
 *
 * Colours (AbarVa design tokens):
 *   amber = waived   (SHELL.AMBER_DOT / SHELL.PEACH_BG)
 *   mint  = approved (SHELL.MINT_LINE / SHELL.MINT_BG)
 *   rust  = rejected (SHELL.RUST_TEXT / SHELL.RUST_BG)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Types ─────────────────────────────────────────────────────────────────────

type GateAction = 'waived' | 'approved' | 'rejected';

interface GateHistoryEntry {
  criterionId: string;
  action: GateAction;
  justification?: string;
  timestamp: string;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface GateHistorySidebarProps {
  instanceId: string;
}

// ─── Colour helpers ────────────────────────────────────────────────────────────

const ACTION_DOT_COLOUR: Record<GateAction, string> = {
  waived: SHELL.AMBER_DOT,
  approved: SHELL.MINT_TEXT,
  rejected: SHELL.RUST_TEXT,
};

const ACTION_BG: Record<GateAction, string> = {
  waived: SHELL.PEACH_BG,
  approved: SHELL.MINT_BG,
  rejected: SHELL.RUST_BG,
};

const ACTION_BORDER: Record<GateAction, string> = {
  waived: SHELL.PEACH_LINE,
  approved: SHELL.MINT_LINE,
  rejected: '#ddb9aa',
};

// ─── Relative-time helper ─────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diffMs = Date.now() - Date.parse(timestamp);
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 30_000;
const MAX_JUSTIFICATION_LEN = 80;

export function GateHistorySidebar({ instanceId }: GateHistorySidebarProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<GateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/reasoning/gate-history/${encodeURIComponent(instanceId)}`);
      if (!res.ok) {
        setError('Failed to load gate history.');
        return;
      }
      const data = (await res.json()) as { entries: GateHistoryEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      setError('Failed to load gate history.');
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  // On open: fetch immediately, then schedule auto-refresh.
  // On close: clear interval.
  useEffect(() => {
    if (!open) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setLoading(true);
    void fetchHistory();

    intervalRef.current = setInterval(() => {
      void fetchHistory();
    }, AUTO_REFRESH_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, fetchHistory]);

  const count = entries.length;
  const headerLabel = open ? `Gate history (${count})` : `Gate history`;

  return (
    <div
      data-testid="gate-history-sidebar"
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 16,
        background: SHELL.CARD_WHITE,
      }}
    >
      {/* ── Header / toggle ─────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
          }}
        >
          {headerLabel}
          {open && count > 0 && (
            <span
              style={{
                marginLeft: 6,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: SHELL.GRAY_BG,
                fontFamily: SHELL.SANS,
                fontSize: 9,
                fontWeight: 700,
                color: SHELL.INK_SOFT,
              }}
            >
              {count}
            </span>
          )}
        </span>
        <span
          aria-hidden
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: SHELL.INK_MUTED,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{ borderTop: `1px solid ${SHELL.CARD_LINE}`, padding: '10px 12px' }}>
          {loading && (
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
              }}
            >
              Loading…
            </p>
          )}

          {!loading && error && (
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.RUST_TEXT,
              }}
            >
              {error}
            </p>
          )}

          {!loading && !error && entries.length === 0 && (
            <p
              style={{
                margin: 0,
                fontFamily: SHELL.SANS,
                fontSize: 12,
                color: SHELL.INK_MUTED,
              }}
            >
              No gate actions this session
            </p>
          )}

          {!loading && !error && entries.length > 0 && (
            <ol
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {entries.map((entry, idx) => {
                const dotColour = ACTION_DOT_COLOUR[entry.action];
                const bg = ACTION_BG[entry.action];
                const border = ACTION_BORDER[entry.action];
                const truncated =
                  entry.justification && entry.justification.length > MAX_JUSTIFICATION_LEN
                    ? `${entry.justification.slice(0, MAX_JUSTIFICATION_LEN).trimEnd()}…`
                    : entry.justification;
                const rel = relativeTime(entry.timestamp);

                return (
                  <li
                    key={`${entry.criterionId}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      background: bg,
                      border: `1px solid ${border}`,
                    }}
                  >
                    {/* Coloured dot */}
                    <span
                      aria-hidden
                      style={{
                        flexShrink: 0,
                        marginTop: 3,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: dotColour,
                      }}
                    />

                    {/* Content */}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {/* Criterion ID + action badge */}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: SHELL.MONO,
                            fontSize: 10,
                            color: SHELL.INK,
                            fontWeight: 600,
                            wordBreak: 'break-all',
                          }}
                        >
                          {entry.criterionId}
                        </span>
                        <span
                          style={{
                            fontFamily: SHELL.MONO,
                            fontSize: 9,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: dotColour,
                            fontWeight: 700,
                          }}
                        >
                          {entry.action}
                        </span>
                      </span>

                      {/* Justification */}
                      {truncated && (
                        <span
                          title={entry.justification}
                          style={{
                            display: 'block',
                            marginTop: 2,
                            fontFamily: SHELL.SANS,
                            fontSize: 11,
                            color: SHELL.INK_SOFT,
                            lineHeight: 1.4,
                          }}
                        >
                          {truncated}
                        </span>
                      )}

                      {/* Relative time */}
                      <span
                        style={{
                          display: 'block',
                          marginTop: 3,
                          fontFamily: SHELL.MONO,
                          fontSize: 9,
                          color: SHELL.INK_MUTED,
                        }}
                      >
                        {rel}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
