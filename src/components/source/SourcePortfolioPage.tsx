'use client';

import React, { useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import {
  PortfolioFilterSidebar,
  EMPTY_FILTER_STATE,
  eventMatchesFilters,
  totalFilterCount,
  type PortfolioFilterState,
} from '@/components/source/portfolio/PortfolioFilterSidebar';
import {
  PortfolioEventsTable,
  type PortfolioRow,
} from '@/components/source/portfolio/PortfolioEventsTable';
import { PortfolioEmptyState } from '@/components/source/portfolio/PortfolioEmptyState';
import { PORTFOLIO } from '@/components/source/portfolio/portfolio-tokens';
import {
  SourceOnboardingTour,
  SourceTourEntryLink,
} from '@/components/source/onboarding/SourceOnboardingTour';
import {
  KanbanBoard,
  ScatterPlot,
  SCATTER_VALUE_COVERAGE_THRESHOLD,
  readStoredViewMode,
  persistViewMode,
  type ViewMode,
} from '@/components/source/SourceEventsViewToggle';
import { SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import {
  computePortfolioKpis,
  dedupeByEventCode,
  determinePortfolioState,
  filterOutTestArtifacts,
  groupEventsByStageBand,
  STAGE_BANDS,
} from '@/lib/source/portfolio-filtering';
import type { SourcingEventSummary } from '@/lib/source/types';

interface SourcePortfolioPageProps {
  events: SourcingEventSummary[];
  tenantName: string;
  searchParams: {
    stage?: string;
    status?: string;
    demo?: string;
    tour?: string;
  };
  canViewFinancialValues?: boolean;
}

export function SourcePortfolioPage({
  events,
  tenantName,
  searchParams,
  canViewFinancialValues = true,
}: SourcePortfolioPageProps) {
  // Strip test artifacts AND dedupe by event_code so the seed-loader's
  // duplicate inserts don't pollute the list.
  const visibleEvents = useMemo(
    () => dedupeByEventCode(filterOutTestArtifacts(events)),
    [events],
  );
  const portfolioState = determinePortfolioState(visibleEvents.length);
  const isDemoEmpty = searchParams.demo === 'empty';
  const renderEmpty = portfolioState === 'empty' || isDemoEmpty;

  return (
    <AppShell
      surface="source"
      agentName="Sentinel"
      surfaceContext={{
        sourcePortfolioMode: true,
        sourceEventCount: visibleEvents.length,
        sourceActiveCount: visibleEvents.filter((event) => event.status === 'active').length,
        sourceAtRiskCount: visibleEvents.filter((event) => event.isAtRisk).length,
        eventType: 'sourcing portfolio overview',
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `Source · ${visibleEvents.length} events`,
      }}
    >
      <main
        data-testid="source-portfolio-page"
        data-portfolio-state={renderEmpty ? 'empty' : portfolioState}
        style={MAIN_STYLE}
      >
        <div style={CONTAINER_STYLE}>
          {renderEmpty ? (
            <EmptyView />
          ) : (
            <PopulatedView
              events={visibleEvents}
              portfolioState={portfolioState}
              canViewFinancialValues={canViewFinancialValues}
            />
          )}
        </div>
        <SourceOnboardingTour
          active={searchParams.tour === '1'}
          config={{
            step: 1,
            title: 'Welcome to Source.',
            body: (
              <>
                This is your sourcing portfolio. Each row is a live event —
                stage, aging, value at stake. Click <strong>New sourcing
                event</strong> when you&rsquo;re ready to start the next one.
              </>
            ),
            nextHref: '/source/new?tour=1',
            nextLabel: 'Show me the intake',
          }}
        />
      </main>
    </AppShell>
  );
}

/** Renders the "Take the tour" entry link — exposed so callers (e.g.
 *  the empty state) can place it inline next to other CTAs. */
export { SourceTourEntryLink };

function EmptyView() {
  return (
    <>
      <CompactHeader eventCount={0} attentionCount={0} variant="empty" />
      <PortfolioEmptyState />
    </>
  );
}

interface PopulatedViewProps {
  events: SourcingEventSummary[];
  portfolioState: 'partial' | 'mature';
  canViewFinancialValues: boolean;
}

function PopulatedView({
  events,
  portfolioState,
  canViewFinancialValues,
}: PopulatedViewProps) {
  const [filters, setFilters] = useState<PortfolioFilterState>(EMPTY_FILTER_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  const isMature = portfolioState === 'mature';

  const tenantCount = useMemo(
    () => new Set(events.map((e) => e.accountName)).size,
    [events],
  );
  const kpis = useMemo(() => computePortfolioKpis(events), [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => eventMatchesFilters(event, filters))
      .filter((event) => matchesSearch(event, searchQuery));
  }, [events, filters, searchQuery]);

  const tableRows = useMemo<PortfolioRow[]>(() => {
    const sorted = [...filteredEvents].sort(byAgingDesc);
    if (!isMature) {
      return sorted.map((event) => ({ kind: 'event', event }));
    }
    const grouped = groupEventsByStageBand(sorted);
    const rows: PortfolioRow[] = [];
    for (const band of Object.values(STAGE_BANDS)) {
      const bucket = grouped.get(band.key) ?? [];
      if (bucket.length === 0) continue;
      rows.push({ kind: 'group', band: band.key, count: bucket.length });
      for (const event of bucket) {
        rows.push({ kind: 'event', event });
      }
    }
    return rows;
  }, [filteredEvents, isMature]);

  const oldestAgingDays = useMemo(
    () => events.reduce((acc, e) => Math.max(acc, e.agingDays | 0), 0),
    [events],
  );

  const valueCapturedCount = useMemo(
    () => filteredEvents.filter((e) => (e.valueAtStakeUsd ?? 0) > 0).length,
    [filteredEvents],
  );
  const scatterAvailable =
    filteredEvents.length === 0 ||
    valueCapturedCount / filteredEvents.length >= SCATTER_VALUE_COVERAGE_THRESHOLD;

  function handleViewMode(next: ViewMode) {
    const safe = next === 'scatter' && !scatterAvailable ? 'list' : next;
    setViewMode(safe);
    persistViewMode(safe);
  }

  return (
    <>
      <CompactHeader
        eventCount={events.length}
        tenantCount={tenantCount}
        attentionCount={kpis.attentionCount}
        variant={portfolioState}
      />
      <DashboardStrip
        attention={kpis.attentionCount}
        waiting={kpis.waiting}
        active={kpis.active}
        completed={kpis.completed}
        valueAtStakeUsd={kpis.valueAtStakeUsd}
        oldestAgingDays={oldestAgingDays}
        canViewFinancialValues={canViewFinancialValues}
      />
      <SubHeader
        eventCount={events.length}
        visibleCount={filteredEvents.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={totalFilterCount(filters)}
        viewMode={viewMode}
        onViewModeChange={handleViewMode}
        scatterAvailable={scatterAvailable}
        valueCapturedCount={valueCapturedCount}
      />

      {viewMode === 'list' ? (
        <section
          aria-label="Sourcing events with filters"
          data-testid="source-portfolio-detail-shell"
          style={DETAIL_SHELL_STYLE}
        >
          <PortfolioFilterSidebar events={events} state={filters} onChange={setFilters} />
          <PortfolioEventsTable
            rows={tableRows}
            groupBy={isMature ? 'stage-band' : 'none'}
            canViewFinancialValues={canViewFinancialValues}
          />
        </section>
      ) : null}

      {viewMode === 'kanban' ? (
        <div style={FULLWIDTH_VIEW_STYLE} data-testid="source-portfolio-kanban">
          <KanbanBoard events={filteredEvents} canViewFinancialValues={canViewFinancialValues} />
        </div>
      ) : null}

      {viewMode === 'scatter' && scatterAvailable ? (
        <div style={FULLWIDTH_VIEW_STYLE} data-testid="source-portfolio-scatter">
          <ScatterPlot events={filteredEvents} canViewFinancialValues={canViewFinancialValues} />
        </div>
      ) : null}
    </>
  );
}

// ── Compact header — title + subline + CTA ──────────────────────────────────
// Title row stays focused on identity. Status counts live in the dedicated
// DashboardStrip directly below, where they have room to breathe.

interface CompactHeaderProps {
  eventCount: number;
  tenantCount?: number;
  attentionCount: number;
  variant: 'empty' | 'partial' | 'mature';
}

function CompactHeader({
  eventCount,
  tenantCount = 0,
  attentionCount,
  variant,
}: CompactHeaderProps) {
  const showCta = variant !== 'empty';
  const subline = buildSubline(eventCount, tenantCount, attentionCount);

  return (
    <header data-testid="source-portfolio-header" style={HEADER_STYLE}>
      <div style={HEADER_TOP_STYLE}>
        <div style={{ minWidth: 0, display: 'grid', gap: 4 }}>
          <div style={EYEBROW_STYLE}>Source · Sourcing portfolio</div>
          <h1 style={H1_STYLE}>Sourcing events</h1>
        </div>
        {showCta ? (
          <Link href="/source/new" data-testid="source-create-event-cta" style={CTA_STYLE}>
            New sourcing event
          </Link>
        ) : null}
      </div>
      {subline ? <p style={SUBLINE_STYLE}>{subline}</p> : null}
    </header>
  );
}

// ── Thin dashboard strip — sits above the search bar / table ─────────────────
// One horizontal row. Status pills on the left (At risk · Waiting · Active ·
// Completed) + portfolio aggregates on the right (Value at stake · Oldest aging).
// Replaces the inline legend that previously crowded the title row.

interface DashboardStripProps {
  attention: number;
  waiting: number;
  active: number;
  completed: number;
  valueAtStakeUsd: number;
  oldestAgingDays: number;
  canViewFinancialValues: boolean;
}

function DashboardStrip({
  attention,
  waiting,
  active,
  completed,
  valueAtStakeUsd,
  oldestAgingDays,
  canViewFinancialValues,
}: DashboardStripProps) {
  return (
    <div data-testid="source-portfolio-dashboard-strip" style={STRIP_STYLE}>
      <div style={STRIP_LEFT_STYLE}>
        <StripStat color={PORTFOLIO.BLOCKED} label="At risk" count={attention} />
        <StripStat color={PORTFOLIO.WAITING} label="Waiting" count={waiting} />
        <StripStat color={PORTFOLIO.ACTIVE} label="Active" count={active} />
        <StripStat color={PORTFOLIO.COMPLETED} label="Completed" count={completed} />
      </div>
      <div style={STRIP_RIGHT_STYLE}>
        <StripMetric
          label="Value at stake"
          value={canViewFinancialValues ? formatCompactUsd(valueAtStakeUsd) : '—'}
        />
        <StripMetric
          label="Oldest aging"
          value={oldestAgingDays === 0 ? '—' : `${oldestAgingDays}d`}
          accent={oldestAgingDays >= 5 ? PORTFOLIO.BLOCKED : oldestAgingDays >= 3 ? PORTFOLIO.WAITING : undefined}
        />
      </div>
    </div>
  );
}

function StripStat({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={STRIP_STAT_STYLE}>
      <span aria-hidden style={{ ...STRIP_DOT_STYLE, background: color }} />
      <span style={STRIP_LABEL_STYLE}>{label}</span>
      <span style={STRIP_COUNT_STYLE}>{count}</span>
    </span>
  );
}

function StripMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <span style={STRIP_STAT_STYLE}>
      <span style={STRIP_LABEL_STYLE}>{label}</span>
      <span
        style={{
          ...STRIP_VALUE_STYLE,
          color: accent ?? PORTFOLIO.INK,
        }}
      >
        {value}
      </span>
    </span>
  );
}

function formatCompactUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '—';
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${usd}`;
}

function buildSubline(
  eventCount: number,
  tenantCount: number,
  attentionCount: number,
): string | null {
  if (eventCount === 0) return null;
  const tenantText = tenantCount === 1 ? '1 tenant' : `${tenantCount} tenants`;
  const eventText = eventCount === 1 ? '1 event' : `${eventCount} events`;
  const lead = `${eventText} across ${tenantText}.`;
  if (attentionCount === 0) return `${lead} Nothing needs your attention today.`;
  if (attentionCount === 1) return `${lead} 1 needs your decision today.`;
  return `${lead} ${attentionCount} need your attention today.`;
}

// ── Sub-header strip — count · search · view toggle ──────────────────────────

function SubHeader({
  eventCount,
  visibleCount,
  searchQuery,
  onSearchChange,
  activeFilterCount,
  viewMode,
  onViewModeChange,
  scatterAvailable,
  valueCapturedCount,
}: {
  eventCount: number;
  visibleCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  scatterAvailable: boolean;
  valueCapturedCount: number;
}) {
  const showFiltered = visibleCount !== eventCount || activeFilterCount > 0;
  return (
    <div style={SUB_HEADER_STYLE}>
      {/* Left: result count */}
      <span style={SUB_LABEL_STYLE}>
        {showFiltered
          ? `${visibleCount} of ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
          : `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`}
      </span>

      {/* Right: search + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="search"
          placeholder="Search events, codes, owners…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="source-portfolio-search"
          aria-label="Search events"
          style={SEARCH_INPUT_STYLE}
        />

        {/* View toggle — list · kanban · scatter */}
        <div
          role="tablist"
          aria-label="Portfolio view"
          style={VIEW_TOGGLE_GROUP_STYLE}
        >
          {(
            [
              { mode: 'list' as const, icon: <ListIcon />, label: 'List view', disabled: false },
              { mode: 'kanban' as const, icon: <KanbanIcon />, label: 'Kanban view', disabled: false },
              {
                mode: 'scatter' as const,
                icon: <ScatterIcon />,
                label: scatterAvailable
                  ? 'Scatter chart'
                  : `Scatter requires value data on ≥50% of events (${valueCapturedCount}/${eventCount} captured)`,
                disabled: !scatterAvailable,
              },
            ] satisfies Array<{ mode: ViewMode; icon: React.ReactNode; label: string; disabled: boolean }>
          ).map(({ mode, icon, label, disabled }) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              aria-label={label}
              title={label}
              disabled={disabled}
              onClick={() => !disabled && onViewModeChange(mode)}
              style={{
                ...VIEW_TOGGLE_BTN_STYLE,
                ...(viewMode === mode ? VIEW_TOGGLE_BTN_ACTIVE : {}),
                ...(disabled ? VIEW_TOGGLE_BTN_DISABLED : {}),
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── View toggle icons (inline SVG — no dep) ───────────────────────────────────

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="1.5" width="3.5" height="11" rx="1" fill="currentColor" />
      <rect x="5.25" y="1.5" width="3.5" height="7.5" rx="1" fill="currentColor" />
      <rect x="9.5" y="1.5" width="3.5" height="9.5" rx="1" fill="currentColor" />
    </svg>
  );
}

function ScatterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="3.5" cy="10" r="1.25" fill="currentColor" />
      <circle cx="6.5" cy="6" r="1.25" fill="currentColor" />
      <circle cx="10.5" cy="3.5" r="1.25" fill="currentColor" />
      <circle cx="9" cy="8.5" r="1.25" fill="currentColor" />
      <circle cx="4.5" cy="4.5" r="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function matchesSearch(event: SourcingEventSummary, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return (
    event.name.toLowerCase().includes(trimmed) ||
    event.code.toLowerCase().includes(trimmed) ||
    (event.owner ?? '').toLowerCase().includes(trimmed) ||
    event.accountName.toLowerCase().includes(trimmed)
  );
}

function byAgingDesc(a: SourcingEventSummary, b: SourcingEventSummary): number {
  if (b.agingDays !== a.agingDays) return b.agingDays - a.agingDays;
  return (
    SOURCE_STAGE_ORDER.indexOf(a.currentStageKey) -
    SOURCE_STAGE_ORDER.indexOf(b.currentStageKey)
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  background: PORTFOLIO.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  // Fluid full-width — productivity-app pattern (Linear / Notion / Datadog).
  // Compact bottom padding (48px); the filter sidebar + events table fill
  // the remaining viewport.
  padding: `0 ${PORTFOLIO.S_PAGE}px 48px`,
};

const HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: '20px 0 16px',
  borderBottom: `1px solid ${PORTFOLIO.HAIRLINE}`,
};

const HEADER_TOP_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: 16,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: PORTFOLIO.GRAY_DK,
};

const H1_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SERIF,
  fontSize: 30,
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
  color: PORTFOLIO.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  lineHeight: 1.45,
  color: PORTFOLIO.INK_SOFT,
  maxWidth: 720,
};

const STRIP_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '10px 16px',
  marginTop: 16,
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  border: `1px solid ${PORTFOLIO.HAIRLINE}`,
  background: PORTFOLIO.CARD,
  flexWrap: 'wrap',
};

const STRIP_LEFT_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
};

const STRIP_RIGHT_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
};

const STRIP_STAT_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const STRIP_DOT_STYLE: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  display: 'inline-block',
};

const STRIP_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_SOFT,
  fontWeight: 600,
};

const STRIP_COUNT_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  fontWeight: 700,
  color: PORTFOLIO.INK,
  fontVariantNumeric: 'tabular-nums',
};

const STRIP_VALUE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};

const CTA_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  background: PORTFOLIO.INK,
  color: '#ffffff',
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const SUB_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '12px 0',
  marginBottom: 16,
};

const SUB_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_SOFT,
  fontWeight: 600,
};

const SEARCH_INPUT_STYLE: CSSProperties = {
  width: 280,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  padding: '6px 12px',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  border: `1px solid ${PORTFOLIO.RULE}`,
  background: PORTFOLIO.CARD,
  color: PORTFOLIO.INK,
  outline: 'none',
};

const DETAIL_SHELL_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '220px minmax(0, 1fr)',
  gap: 28,
  alignItems: 'start',
};

const FULLWIDTH_VIEW_STYLE: CSSProperties = {
  width: '100%',
  marginTop: 4,
};

const VIEW_TOGGLE_GROUP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: `1px solid ${PORTFOLIO.RULE}`,
  borderRadius: 6,
  background: PORTFOLIO.CARD,
  overflow: 'hidden',
  flexShrink: 0,
};

const VIEW_TOGGLE_BTN_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 30,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: PORTFOLIO.INK_SOFT,
  transition: 'background 100ms ease, color 100ms ease',
};

const VIEW_TOGGLE_BTN_ACTIVE: CSSProperties = {
  background: PORTFOLIO.INK,
  color: '#ffffff',
};

const VIEW_TOGGLE_BTN_DISABLED: CSSProperties = {
  opacity: 0.35,
  cursor: 'not-allowed',
};
