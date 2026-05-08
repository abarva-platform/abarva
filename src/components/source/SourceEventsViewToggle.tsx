'use client';

// Source events page · view-mode toggle (list / kanban / scatter).
//
// Mirrors the toggle pattern from src/components/strategic-moves/
// StrategicMovesHomeClient.tsx. List view wraps the existing
// SourcingEventTable; kanban groups events by current stage; scatter
// is gated on value-at-stake coverage (≥ 50% of events with a value)
// and disabled with a tooltip otherwise.
//
// Persists the active mode in localStorage so a refresh keeps the
// user where they were.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type {
  SourceLifecycleStatus,
  SourceStageKey,
  SourcingEventSummary,
} from '@/lib/source/types';
import { formatSourceFinancialValue } from '@/lib/source/financial-display';

type ViewMode = 'list' | 'kanban' | 'scatter';

const STORAGE_KEY = 'source-events-view-mode';
const SCATTER_VALUE_COVERAGE_THRESHOLD = 0.5;

interface Props {
  events: ReadonlyArray<SourcingEventSummary>;
  /** The list-mode rendering. Server-rendered upstream and passed in. */
  listView: React.ReactNode;
  /** Whether to show actual financial values vs the restricted label. */
  canViewFinancialValues?: boolean;
}

export function SourceEventsViewToggle({
  events,
  listView,
  canViewFinancialValues = false,
}: Props) {
  const [mode, setMode] = useState<ViewMode>('list');

  // Restore prior mode on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'list' || stored === 'kanban' || stored === 'scatter') {
        setMode(stored);
      }
    } catch {
      // ignore — localStorage may be unavailable
    }
  }, []);

  const valueCapturedCount = useMemo(
    () => events.filter((e) => (e.valueAtStakeUsd ?? 0) > 0).length,
    [events],
  );
  const scatterAvailable =
    events.length === 0 ||
    valueCapturedCount / events.length >= SCATTER_VALUE_COVERAGE_THRESHOLD;

  // Auto-fall-back to list if scatter becomes unavailable.
  useEffect(() => {
    if (!scatterAvailable && mode === 'scatter') {
      setMode('list');
      persist('list');
    }
  }, [scatterAvailable, mode]);

  function persist(next: ViewMode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function activate(next: ViewMode) {
    setMode(next);
    persist(next);
  }

  return (
    <div style={WRAP_STYLE}>
      <div style={TOGGLE_BAR_STYLE}>
        <span style={COUNT_LABEL_STYLE}>
          {events.length} event{events.length === 1 ? '' : 's'}
        </span>
        <div style={TOGGLE_GROUP_STYLE} role="tablist" aria-label="View mode">
          {(['list', 'kanban', 'scatter'] as const).map((m) => {
            const disabled = m === 'scatter' && !scatterAvailable;
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={() => !disabled && activate(m)}
                title={
                  disabled
                    ? `Scatter requires value-at-stake on ≥ ${Math.round(
                        SCATTER_VALUE_COVERAGE_THRESHOLD * 100,
                      )}% of events. Currently ${valueCapturedCount}/${events.length}.`
                    : undefined
                }
                style={{
                  ...TOGGLE_BTN_STYLE,
                  ...(active ? TOGGLE_BTN_ACTIVE_STYLE : {}),
                  ...(disabled ? TOGGLE_BTN_DISABLED_STYLE : {}),
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'list' ? listView : null}
      {mode === 'kanban' ? (
        <KanbanBoard events={events} canViewFinancialValues={canViewFinancialValues} />
      ) : null}
      {mode === 'scatter' && scatterAvailable ? (
        <ScatterPlot events={events} canViewFinancialValues={canViewFinancialValues} />
      ) : null}
      {mode === 'scatter' && !scatterAvailable ? (
        <div style={EMPTY_STATE_STYLE}>
          Scatter view requires value-at-stake on at least{' '}
          {Math.round(SCATTER_VALUE_COVERAGE_THRESHOLD * 100)}% of events.
          Currently {valueCapturedCount}/{events.length} captured.
        </div>
      ) : null}
    </div>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────

function KanbanBoard({
  events,
  canViewFinancialValues,
}: {
  events: ReadonlyArray<SourcingEventSummary>;
  canViewFinancialValues: boolean;
}) {
  return (
    <div style={KANBAN_GRID_STYLE}>
      {SOURCE_STAGE_ORDER.map((stageKey) => {
        const inStage = events.filter((e) => e.currentStageKey === stageKey);
        const label = SOURCE_STAGE_LABELS[stageKey];
        return (
          <section key={stageKey} style={KANBAN_COL_STYLE}>
            <header style={KANBAN_COL_HEAD_STYLE}>
              <span style={KANBAN_COL_BADGE_STYLE}>
                {String(SOURCE_STAGE_ORDER.indexOf(stageKey) + 1).padStart(2, '0')}
              </span>
              <span style={KANBAN_COL_LABEL_STYLE}>{label}</span>
              <span style={KANBAN_COL_COUNT_STYLE}>{inStage.length}</span>
            </header>
            <div style={KANBAN_COL_LIST_STYLE}>
              {inStage.length === 0 ? (
                <div style={KANBAN_EMPTY_STYLE}>—</div>
              ) : (
                inStage.map((event) => (
                  <Link
                    key={event.id}
                    href={`/source/events/${event.code}`}
                    style={{
                      ...KANBAN_CARD_STYLE,
                      ...statusBorderStyle(event.status, event.isAtRisk),
                    }}
                  >
                    <div style={KANBAN_CARD_TITLE_STYLE}>{event.name}</div>
                    <div style={KANBAN_CARD_META_STYLE}>
                      {event.code} · {event.accountName}
                    </div>
                    <div style={KANBAN_CARD_STATUS_STYLE}>
                      {event.statusLabel} · {event.agingDays}d
                    </div>
                    {event.valueAtStakeUsd > 0 ? (
                      <div style={KANBAN_CARD_VALUE_STYLE}>
                        {formatSourceFinancialValue(
                          event.valueAtStakeUsd,
                          canViewFinancialValues,
                        )}
                      </div>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Scatter ───────────────────────────────────────────────────────────────

function ScatterPlot({
  events,
  canViewFinancialValues,
}: {
  events: ReadonlyArray<SourcingEventSummary>;
  canViewFinancialValues: boolean;
}) {
  // X: aging days · Y: value at stake (log scale for spread)
  const valueEvents = events.filter((e) => e.valueAtStakeUsd > 0);
  if (valueEvents.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No events have a captured value-at-stake yet.
      </div>
    );
  }
  const maxAging = Math.max(...valueEvents.map((e) => e.agingDays), 30);
  const maxValue = Math.max(...valueEvents.map((e) => e.valueAtStakeUsd));
  const PLOT_W = 720;
  const PLOT_H = 360;
  const PAD = 48;

  return (
    <div style={SCATTER_WRAP_STYLE}>
      <svg width={PLOT_W} height={PLOT_H} style={SCATTER_SVG_STYLE}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`gx-${t}`}
            x1={PAD + t * (PLOT_W - 2 * PAD)}
            y1={PAD}
            x2={PAD + t * (PLOT_W - 2 * PAD)}
            y2={PLOT_H - PAD}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`gy-${t}`}
            x1={PAD}
            y1={PLOT_H - PAD - t * (PLOT_H - 2 * PAD)}
            x2={PLOT_W - PAD}
            y2={PLOT_H - PAD - t * (PLOT_H - 2 * PAD)}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        {/* Axes labels */}
        <text x={PAD} y={PLOT_H - 12} fontSize={11} fill="#6B7280">
          Aging (days)
        </text>
        <text
          x={12}
          y={PAD - 8}
          fontSize={11}
          fill="#6B7280"
        >
          Value at stake
        </text>
        {/* Points */}
        {valueEvents.map((e) => {
          const x = PAD + (e.agingDays / maxAging) * (PLOT_W - 2 * PAD);
          const y =
            PLOT_H - PAD - (e.valueAtStakeUsd / maxValue) * (PLOT_H - 2 * PAD);
          const color = statusFillColor(e.status, e.isAtRisk);
          return (
            <Link key={e.id} href={`/source/events/${e.code}`}>
              <g>
                <circle cx={x} cy={y} r={8} fill={color} fillOpacity={0.7} />
                <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={1.5} />
                <title>
                  {e.name} · {e.statusLabel} · {e.agingDays}d ·{' '}
                  {formatSourceFinancialValue(e.valueAtStakeUsd, canViewFinancialValues)}
                </title>
              </g>
            </Link>
          );
        })}
      </svg>
      <div style={SCATTER_LEGEND_STYLE}>
        <span style={legendDotStyle('#1B2B5C')}>Active</span>
        <span style={legendDotStyle('#0E8A65')}>Completed</span>
        <span style={legendDotStyle('#B7791F')}>Waiting</span>
        <span style={legendDotStyle('#B91C1C')}>At risk</span>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isWaitingStatus(status: SourceLifecycleStatus): boolean {
  return status.startsWith('waiting_') || status === 'paused';
}

function isCompletedStatus(status: SourceLifecycleStatus): boolean {
  return status === 'archived';
}

function statusBorderStyle(
  status: SourceLifecycleStatus,
  isAtRisk: boolean,
): CSSProperties {
  if (isAtRisk || status === 'at_risk') return { borderLeftColor: '#B91C1C' };
  if (isCompletedStatus(status)) return { borderLeftColor: '#0E8A65' };
  if (isWaitingStatus(status)) return { borderLeftColor: '#B7791F' };
  return { borderLeftColor: '#1B2B5C' };
}

function statusFillColor(
  status: SourceLifecycleStatus,
  isAtRisk: boolean,
): string {
  if (isAtRisk || status === 'at_risk') return '#B91C1C';
  if (isCompletedStatus(status)) return '#0E8A65';
  if (isWaitingStatus(status)) return '#B7791F';
  return '#1B2B5C';
}

function legendDotStyle(color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: SHELL.INK_SOFT,
  };
}

// ── Styles ────────────────────────────────────────────────────────────────

const WRAP_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const TOGGLE_BAR_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};
const COUNT_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
};
const TOGGLE_GROUP_STYLE: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 6,
  background: '#F8F7F4',
  overflow: 'hidden',
};
const TOGGLE_BTN_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  padding: '6px 14px',
  background: 'transparent',
  color: SHELL.INK_SOFT,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 120ms ease',
};
const TOGGLE_BTN_ACTIVE_STYLE: CSSProperties = {
  background: '#0C1A3A',
  color: '#FAF7F1',
};
const TOGGLE_BTN_DISABLED_STYLE: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
};

const KANBAN_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(11, minmax(180px, 1fr))',
  gap: 12,
  overflowX: 'auto',
  paddingBottom: 8,
};
const KANBAN_COL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 180,
};
const KANBAN_COL_HEAD_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 10px',
  background: '#F8F7F4',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 6,
};
const KANBAN_COL_BADGE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.10em',
  background: '#0C1A3A',
  color: '#FAF7F1',
  borderRadius: 3,
  padding: '2px 5px',
};
const KANBAN_COL_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 600,
  color: '#0A0C12',
  flex: 1,
};
const KANBAN_COL_COUNT_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};
const KANBAN_COL_LIST_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 60,
};
const KANBAN_CARD_STYLE: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderLeft: '3px solid #1B2B5C',
  borderRadius: 6,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  textDecoration: 'none',
  color: '#0A0C12',
  transition: 'transform 100ms ease, box-shadow 100ms ease',
};
const KANBAN_CARD_TITLE_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.3,
};
const KANBAN_CARD_META_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_SOFT,
};
const KANBAN_CARD_STATUS_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};
const KANBAN_CARD_VALUE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  fontWeight: 600,
  color: '#0C1A3A',
  marginTop: 2,
};
const KANBAN_EMPTY_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  color: '#9CA3AF',
  textAlign: 'center',
  padding: '20px 0',
};

const SCATTER_WRAP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: '#FFFFFF',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
  padding: 16,
  alignItems: 'flex-start',
};
const SCATTER_SVG_STYLE: CSSProperties = { maxWidth: '100%', height: 'auto' };
const SCATTER_LEGEND_STYLE: CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  fontFamily: SHELL.SANS,
};

const EMPTY_STATE_STYLE: CSSProperties = {
  background: '#FFFFFF',
  border: '1px dashed ' + SHELL.CARD_LINE,
  borderRadius: 8,
  padding: 24,
  textAlign: 'center',
  color: SHELL.INK_SOFT,
  fontFamily: SHELL.SANS,
  fontSize: 13,
};
