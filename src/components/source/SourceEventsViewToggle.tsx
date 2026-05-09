'use client';

// Source events page · view-mode toggle (list / kanban / value chart).
//
// Mirrors the toggle pattern from src/components/strategic-moves/
// StrategicMovesHomeClient.tsx. List view wraps the existing
// SourcingEventTable; kanban groups events by current stage; value chart
// shows portfolio exposure by stage/status with ranked open events.
//
// Persists non-default active modes in localStorage so a refresh keeps the
// user where they were. The portfolio itself defaults to Kanban because the
// table is a drill-down surface, not the CXO/operator landing posture.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type {
  SourceLifecycleStatus,
  SourcingEventSummary,
} from '@/lib/source/types';
import { formatSourceFinancialValue } from '@/lib/source/financial-display';
import {
  STAGE_BANDS,
  needsAttention,
  stageBandFor,
  type StageBandKey,
} from '@/lib/source/portfolio-filtering';

export type ViewMode = 'list' | 'kanban' | 'scatter';

const STORAGE_KEY = 'source-events-view-mode';
const DEFAULT_VIEW_MODE: ViewMode = 'kanban';

export function readStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') return DEFAULT_VIEW_MODE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'value') return 'scatter';
    if (stored === 'kanban' || stored === 'scatter') return stored;
    if (stored === 'list') {
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_VIEW_MODE);
      return DEFAULT_VIEW_MODE;
    }
  } catch { /* ignore */ }
  return DEFAULT_VIEW_MODE;
}

export function persistViewMode(mode: ViewMode) {
  try { window.localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
}

function viewModeLabel(mode: ViewMode): string {
  if (mode === 'list') return 'Table';
  if (mode === 'kanban') return 'Kanban';
  return 'Value chart';
}

interface Props {
  events: ReadonlyArray<SourcingEventSummary>;
  /** The list-mode rendering. Server-rendered upstream and passed in. */
  listView: React.ReactNode;
  /** Whether to show actual financial values vs the restricted label. */
  canViewFinancialValues?: boolean;
}

const readStoredMode = readStoredViewMode;

export function SourceEventsViewToggle({
  events,
  listView,
  canViewFinancialValues = false,
}: Props) {
  // Lazy initializer reads localStorage once on mount (SSR-safe via the
  // typeof-window guard in readStoredMode). Avoids setting state inside effects.
  const [requestedMode, setRequestedMode] = useState<ViewMode>(readStoredMode);

  const mode = requestedMode;

  function persist(next: ViewMode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function activate(next: ViewMode) {
    setRequestedMode(next);
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
            const disabled = false;
            const active = mode === m;
            const label = viewModeLabel(m);
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={() => !disabled && activate(m)}
                title={label}
                style={{
                  ...TOGGLE_BTN_STYLE,
                  ...(active ? TOGGLE_BTN_ACTIVE_STYLE : {}),
                  ...(disabled ? TOGGLE_BTN_DISABLED_STYLE : {}),
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'list' ? listView : null}
      {mode === 'kanban' ? (
        <KanbanBoard events={events} canViewFinancialValues={canViewFinancialValues} />
      ) : null}
      {mode === 'scatter' ? (
        <ScatterPlot events={events} canViewFinancialValues={canViewFinancialValues} />
      ) : null}
    </div>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────

export function KanbanBoard({
  events,
  canViewFinancialValues,
}: {
  events: ReadonlyArray<SourcingEventSummary>;
  canViewFinancialValues: boolean;
}) {
  const grouped = useMemo(() => groupKanbanEventsByStageBand(events), [events]);

  return (
    <div style={KANBAN_GRID_STYLE}>
      {Object.values(STAGE_BANDS).map((band) => {
        const inStage = grouped.get(band.key) ?? [];
        return (
          <section key={band.key} style={KANBAN_COL_STYLE}>
            <header style={KANBAN_COL_HEAD_STYLE}>
              <span style={KANBAN_COL_BADGE_STYLE}>
                {kanbanBandCode(band.key)}
              </span>
              <span style={KANBAN_COL_LABEL_STYLE}>{band.title}</span>
              <span style={KANBAN_COL_COUNT_STYLE}>{inStage.length}</span>
            </header>
            <div style={KANBAN_COL_LIST_STYLE}>
              {inStage.length === 0 ? (
                <div style={KANBAN_EMPTY_STYLE}>—</div>
              ) : (
                inStage.map((event) => (
                  <Link
                    key={event.id}
                    href={`/source/events/${event.id}`}
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
                      {event.currentStageLabel} · {event.statusLabel} · {event.agingDays}d
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

// ── Value chart ───────────────────────────────────────────────────────────

export function ScatterPlot({
  events,
  canViewFinancialValues,
}: {
  events: ReadonlyArray<SourcingEventSummary>;
  canViewFinancialValues: boolean;
}) {
  if (events.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No events match the current filters.
      </div>
    );
  }
  const openEvents = events.filter((event) => event.status !== 'completed' && event.status !== 'archived');
  const rows = buildValueRows(openEvents).filter((row) => row.count > 0);
  const totalValueUsd = openEvents.reduce((sum, event) => sum + Math.max(0, event.valueAtStakeUsd ?? 0), 0);
  const hasCapturedValue = totalValueUsd > 0;
  const atRiskEvents = openEvents.filter((event) => needsAttention(event));
  const totalAtRiskUsd = atRiskEvents.reduce(
    (sum, event) => sum + Math.max(0, event.valueAtStakeUsd ?? 0),
    0,
  );
  const maxBasis = Math.max(...rows.map((row) => row.basis), 1);
  const largestOpenEvents = [...openEvents]
    .sort((a, b) => {
      const valueDelta = (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0);
      if (valueDelta !== 0) return valueDelta;
      return b.agingDays - a.agingDays;
    })
    .slice(0, 5);

  return (
    <div style={VALUE_VIEW_STYLE} data-testid="source-portfolio-value-chart">
      <div style={VALUE_VIEW_HEADER_STYLE}>
        <div>
          <div style={VALUE_VIEW_TITLE_STYLE}>Open value by stage</div>
          <div style={VALUE_VIEW_SUBTITLE_STYLE}>
            Stage exposure, at-risk value, and the largest open events.
          </div>
        </div>
        <div style={VALUE_SUMMARY_STYLE}>
          <ValueSummaryItem
            label="Total"
            value={formatValueLabel(totalValueUsd, openEvents.length, hasCapturedValue, canViewFinancialValues)}
          />
          <ValueSummaryItem
            label="Needs attention"
            value={formatValueLabel(
              totalAtRiskUsd,
              atRiskEvents.length,
              hasCapturedValue,
              canViewFinancialValues,
            )}
            accent="#B91C1C"
          />
        </div>
      </div>

      <div style={VALUE_LAYOUT_STYLE}>
        <div style={VALUE_STAGE_PANEL_STYLE}>
          {rows.map((row) => (
            <div key={row.key} style={VALUE_STAGE_ROW_STYLE}>
              <div style={VALUE_STAGE_LABEL_STYLE}>
                <span style={VALUE_STAGE_NAME_STYLE}>{row.label}</span>
                <span style={VALUE_STAGE_META_STYLE}>
                  {row.count} {row.count === 1 ? 'event' : 'events'}
                </span>
              </div>
              <div style={VALUE_BAR_CELL_STYLE}>
                <div style={VALUE_BAR_TRACK_STYLE} aria-hidden>
                  <div
                    style={{
                      ...VALUE_BAR_WIDTH_STYLE,
                      width: `${Math.max(row.basis > 0 ? 5 : 0, (row.basis / maxBasis) * 100)}%`,
                    }}
                  >
                    {row.segments.map((segment) => (
                      <span
                        key={segment.key}
                        style={{
                          ...VALUE_BAR_SEGMENT_STYLE,
                          width: `${segment.widthPct}%`,
                          background: segment.color,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={VALUE_BAR_META_STYLE}>
                  <span>{formatValueLabel(row.valueUsd, row.count, hasCapturedValue, canViewFinancialValues)}</span>
                  <span>{row.atRiskCount > 0 ? `${row.atRiskCount} needs attention` : 'on track'}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={VALUE_LEGEND_STYLE}>
            <span style={legendDotStyle('#1B2B5C')}>Active</span>
            <span style={legendDotStyle('#B7791F')}>Waiting</span>
            <span style={legendDotStyle('#B91C1C')}>Needs attention</span>
            <span style={legendDotStyle('#0E8A65')}>Completed</span>
          </div>
        </div>

        <aside style={VALUE_RANK_PANEL_STYLE} aria-label="Largest open sourcing exposures">
          <div style={VALUE_RANK_HEADER_STYLE}>Largest open exposure</div>
          <div style={VALUE_RANK_LIST_STYLE}>
            {largestOpenEvents.map((event) => (
              <Link key={event.id} href={`/source/events/${event.id}`} style={VALUE_RANK_LINK_STYLE}>
                <span
                  aria-hidden
                  style={{
                    ...VALUE_RANK_DOT_STYLE,
                    background: needsAttention(event)
                      ? '#B91C1C'
                      : statusFillColor(event.status, event.isAtRisk),
                  }}
                />
                <span style={VALUE_RANK_BODY_STYLE}>
                  <span style={VALUE_RANK_TITLE_STYLE}>{event.name}</span>
                  <span style={VALUE_RANK_META_STYLE}>
                    {event.code} · {event.currentStageLabel} · {event.statusLabel} · {event.agingDays}d
                  </span>
                </span>
                <span style={VALUE_RANK_VALUE_STYLE}>
                  {formatValueLabel(
                    event.valueAtStakeUsd ?? 0,
                    1,
                    hasCapturedValue,
                    canViewFinancialValues,
                  )}
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>

      {!hasCapturedValue ? (
        <div style={VALUE_FOOTNOTE_STYLE}>
          Values are not captured on these events yet, so this view falls back to event counts.
        </div>
      ) : null}
    </div>
  );
}

function ValueSummaryItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <span style={VALUE_SUMMARY_ITEM_STYLE}>
      <span style={VALUE_SUMMARY_LABEL_STYLE}>{label}</span>
      <span style={{ ...VALUE_SUMMARY_VALUE_STYLE, color: accent ?? '#0C1A3A' }}>{value}</span>
    </span>
  );
}

interface ValueStageRow {
  key: StageBandKey;
  label: string;
  count: number;
  atRiskCount: number;
  valueUsd: number;
  basis: number;
  segments: Array<{
    key: ValueSegmentKey;
    basis: number;
    widthPct: number;
    color: string;
  }>;
}

type ValueSegmentKey = 'active' | 'waiting' | 'attention' | 'completed';

const VALUE_SEGMENTS: Array<{ key: ValueSegmentKey; color: string }> = [
  { key: 'active', color: '#1B2B5C' },
  { key: 'waiting', color: '#B7791F' },
  { key: 'attention', color: '#B91C1C' },
  { key: 'completed', color: '#0E8A65' },
];

function buildValueRows(events: ReadonlyArray<SourcingEventSummary>): ValueStageRow[] {
  const hasCapturedValue = events.some((event) => (event.valueAtStakeUsd ?? 0) > 0);
  return Object.values(STAGE_BANDS).map((band) => {
    const bucket = events.filter((event) => stageBandFor(event.currentStageKey, event.status) === band.key);
    const valueUsd = bucket.reduce((sum, event) => sum + Math.max(0, event.valueAtStakeUsd ?? 0), 0);
    const basis = hasCapturedValue ? valueUsd : bucket.length;
    const segments = VALUE_SEGMENTS.map((segment) => {
      const matching = bucket.filter((event) => valueSegmentFor(event) === segment.key);
      const segmentBasis = hasCapturedValue
        ? matching.reduce((sum, event) => sum + Math.max(0, event.valueAtStakeUsd ?? 0), 0)
        : matching.length;
      return {
        key: segment.key,
        basis: segmentBasis,
        widthPct: basis > 0 ? (segmentBasis / basis) * 100 : 0,
        color: segment.color,
      };
    }).filter((segment) => segment.basis > 0);

    return {
      key: band.key,
      label: band.title,
      count: bucket.length,
      atRiskCount: bucket.filter((event) => needsAttention(event)).length,
      valueUsd,
      basis,
      segments,
    };
  });
}

function valueSegmentFor(event: SourcingEventSummary): ValueSegmentKey {
  if (needsAttention(event)) return 'attention';
  if (event.status === 'completed' || event.status === 'archived') return 'completed';
  if (isWaitingStatus(event.status)) return 'waiting';
  return 'active';
}

function formatValueLabel(
  valueUsd: number,
  count: number,
  hasCapturedValue: boolean,
  canViewFinancialValues: boolean,
): string {
  if (!hasCapturedValue) return `${count} ${count === 1 ? 'event' : 'events'}`;
  if (!canViewFinancialValues) return 'Restricted';
  return formatSourceFinancialValue(valueUsd, canViewFinancialValues);
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
    borderLeft: `8px solid ${color}`,
    paddingLeft: 7,
  };
}

function groupKanbanEventsByStageBand(
  events: ReadonlyArray<SourcingEventSummary>,
): Map<StageBandKey, SourcingEventSummary[]> {
  const grouped = new Map<StageBandKey, SourcingEventSummary[]>();
  for (const band of Object.values(STAGE_BANDS)) {
    grouped.set(band.key, []);
  }
  for (const event of events) {
    grouped.get(stageBandFor(event.currentStageKey, event.status))?.push(event);
  }
  for (const [band, bucket] of grouped.entries()) {
    grouped.set(
      band,
      [...bucket].sort((a, b) => {
        if (b.agingDays !== a.agingDays) return b.agingDays - a.agingDays;
        return (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0);
      }),
    );
  }
  return grouped;
}

function kanbanBandCode(band: StageBandKey): string {
  if (band === 'completed') return '✓';
  const order = Object.keys(STAGE_BANDS).indexOf(band) + 1;
  return String(order).padStart(2, '0');
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
  gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
  gap: 14,
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
  padding: '10px 12px',
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
  padding: '12px',
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

const VALUE_VIEW_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  background: '#FFFFFF',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
  padding: 18,
};
const VALUE_VIEW_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
};
const VALUE_VIEW_TITLE_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 16,
  fontWeight: 700,
  color: '#0A0C12',
};
const VALUE_VIEW_SUBTITLE_STYLE: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};
const VALUE_SUMMARY_STYLE: CSSProperties = {
  display: 'inline-flex',
  gap: 18,
  flexWrap: 'wrap',
};
const VALUE_SUMMARY_ITEM_STYLE: CSSProperties = {
  display: 'grid',
  gap: 3,
  justifyItems: 'end',
};
const VALUE_SUMMARY_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
};
const VALUE_SUMMARY_VALUE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 14,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};
const VALUE_LAYOUT_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 22,
  alignItems: 'start',
};
const VALUE_STAGE_PANEL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  minWidth: 0,
};
const VALUE_STAGE_ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(150px, 0.32fr) minmax(0, 0.68fr)',
  gap: 14,
  alignItems: 'center',
};
const VALUE_STAGE_LABEL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 3,
  minWidth: 0,
};
const VALUE_STAGE_NAME_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 700,
  color: '#0A0C12',
};
const VALUE_STAGE_META_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};
const VALUE_BAR_CELL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 5,
  minWidth: 0,
};
const VALUE_BAR_TRACK_STYLE: CSSProperties = {
  height: 12,
  width: '100%',
  background: '#ECEAE3',
  borderRadius: 999,
  overflow: 'hidden',
};
const VALUE_BAR_WIDTH_STYLE: CSSProperties = {
  display: 'flex',
  height: '100%',
  borderRadius: 999,
  overflow: 'hidden',
};
const VALUE_BAR_SEGMENT_STYLE: CSSProperties = {
  display: 'block',
  height: '100%',
  minWidth: 2,
};
const VALUE_BAR_META_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_SOFT,
};
const VALUE_LEGEND_STYLE: CSSProperties = {
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
  fontFamily: SHELL.SANS,
};
const VALUE_RANK_PANEL_STYLE: CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 12,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 6,
  background: '#FAF9F6',
};
const VALUE_RANK_HEADER_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  fontWeight: 700,
};
const VALUE_RANK_LIST_STYLE: CSSProperties = {
  display: 'grid',
  gap: 2,
};
const VALUE_RANK_LINK_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '8px minmax(0, 1fr) auto',
  gap: 9,
  alignItems: 'center',
  padding: '8px 0',
  borderTop: '1px solid rgba(17, 24, 39, 0.08)',
  color: '#0A0C12',
  textDecoration: 'none',
};
const VALUE_RANK_DOT_STYLE: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
};
const VALUE_RANK_BODY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
};
const VALUE_RANK_TITLE_STYLE: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: SHELL.SANS,
  fontSize: 12,
  fontWeight: 700,
};
const VALUE_RANK_META_STYLE: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_SOFT,
};
const VALUE_RANK_VALUE_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 11,
  fontWeight: 700,
  color: '#0C1A3A',
  fontVariantNumeric: 'tabular-nums',
};
const VALUE_FOOTNOTE_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
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
