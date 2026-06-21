'use client';

import React, { useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
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
  readStoredViewMode,
  persistViewMode,
  type ViewMode,
} from '@/components/source/SourceEventsViewToggle';
import { SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import {
  computePortfolioKpis,
  determinePortfolioState,
  groupEventsByStageBand,
  STAGE_BANDS,
  attentionEvents,
} from '@/lib/source/portfolio-filtering';
import { selectVisibleSourceEvents } from '@/lib/source/portfolio-metrics';
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
  // Canonical visible set — the SAME selection the Events surface and Decision
  // Queue use (audit 2026-06-03, Tier 0), so portfolio counts/value can never
  // drift from the other surfaces. Strips test artifacts + dedupes by code.
  const visibleEvents = useMemo(
    () => selectVisibleSourceEvents(events),
    [events],
  );
  const portfolioState = determinePortfolioState(visibleEvents.length);
  const isDemoEmpty = searchParams.demo === 'empty';
  const renderEmpty = portfolioState === 'empty' || isDemoEmpty;

  return (
    <AppShell
      surface="source"
      agentName="Ava"
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
      subNav={<SourceSubNav />}
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

  function handleViewMode(next: ViewMode) {
    setViewMode(next);
    persistViewMode(next);
  }

  return (
    <>
      <CompactHeader
        eventCount={events.length}
        tenantCount={tenantCount}
        attentionCount={kpis.attentionCount}
        variant={portfolioState}
      />
      <PortfolioScorecard
        events={events}
        kpis={kpis}
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

      {viewMode === 'scatter' ? (
        <div style={FULLWIDTH_VIEW_STYLE} data-testid="source-portfolio-value-view">
          <ScatterPlot events={filteredEvents} canViewFinancialValues={canViewFinancialValues} />
        </div>
      ) : null}
    </>
  );
}

function PortfolioScorecard({
  events,
  kpis,
  oldestAgingDays,
  canViewFinancialValues,
}: {
  events: SourcingEventSummary[];
  kpis: ReturnType<typeof computePortfolioKpis>;
  oldestAgingDays: number;
  canViewFinancialValues: boolean;
}) {
  const attentionQueue = attentionEvents(events);
  const openEvents = events
    .filter((event) => event.status !== 'completed' && event.status !== 'archived')
  const openValueUsd = openEvents.reduce((sum, event) => sum + (event.valueAtStakeUsd ?? 0), 0);
  const attentionValueUsd = attentionQueue.reduce(
    (sum, item) => sum + (item.event.valueAtStakeUsd ?? 0),
    0,
  );

  return (
    <section
      aria-label="Source portfolio scorecard"
      data-testid="source-portfolio-scorecard"
      style={SCORECARD_STYLE}
    >
      <div style={SCORECARD_METRICS_STYLE}>
        <ScoreMetric
          label="Total value"
          value={canViewFinancialValues ? formatCompactUsd(kpis.valueAtStakeUsd) : 'Restricted'}
          detail={`${kpis.total} sourcing event${kpis.total === 1 ? '' : 's'}`}
        />
        <ScoreMetric
          label="Open pipeline"
          value={canViewFinancialValues ? formatCompactUsd(openValueUsd) : 'Restricted'}
          detail={`${openEvents.length} active or waiting event${openEvents.length === 1 ? '' : 's'}`}
        />
        <ScoreMetric
          label="Active events"
          value={String(kpis.active)}
          detail="moving through gates"
        />
        <ScoreMetric
          label="Waiting"
          value={String(kpis.waiting)}
          detail="client, vendor, or executive hold"
          accent={kpis.waiting > 0 ? PORTFOLIO.WAITING : undefined}
        />
        <ScoreMetric
          label="At-risk exposure"
          value={canViewFinancialValues ? formatCompactUsd(attentionValueUsd) : 'Restricted'}
          detail={`${kpis.attentionCount} event${kpis.attentionCount === 1 ? '' : 's'} need attention`}
          accent={kpis.attentionCount > 0 ? PORTFOLIO.BLOCKED : undefined}
        />
        <ScoreMetric
          label="Oldest stage age"
          value={oldestAgingDays === 0 ? '—' : `${oldestAgingDays}d`}
          detail={`${kpis.waiting} waiting · ${kpis.completed} completed`}
          accent={oldestAgingDays >= 5 ? PORTFOLIO.BLOCKED : oldestAgingDays >= 3 ? PORTFOLIO.WAITING : undefined}
        />
      </div>
    </section>
  );
}

function ScoreMetric({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <div style={SCORE_METRIC_STYLE}>
      <div style={SCORE_METRIC_LABEL_STYLE}>{label}</div>
      <div style={{ ...SCORE_METRIC_VALUE_STYLE, color: accent ?? PORTFOLIO.INK }}>
        {value}
      </div>
      <div style={SCORE_METRIC_DETAIL_STYLE}>{detail}</div>
    </div>
  );
}

// ── Compact header — title + subline + CTA ──────────────────────────────────
// Title row stays focused on identity. Portfolio value and mix live in the
// scorecard below, where they can read as analysis instead of navigation.

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
}: {
  eventCount: number;
  visibleCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}) {
  const showFiltered = visibleCount !== eventCount || activeFilterCount > 0;
  const viewOptions = [
    { mode: 'list' as const, icon: <ListIcon />, label: 'Table', title: 'Table view', disabled: false },
    { mode: 'kanban' as const, icon: <KanbanIcon />, label: 'Kanban', title: 'Kanban view', disabled: false },
    {
      mode: 'scatter' as const,
      icon: <ScatterIcon />,
      label: 'Value chart',
      title: 'Value chart',
      disabled: false,
    },
  ] satisfies Array<{ mode: ViewMode; icon: React.ReactNode; label: string; title: string; disabled: boolean }>;

  return (
    <div style={SUB_HEADER_STYLE}>
      {/* Left: result count */}
      <span style={SUB_LABEL_STYLE}>
        {showFiltered
          ? `${visibleCount} of ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
          : `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`}
      </span>

      {/* Right: search + view toggle */}
      <div style={SUB_ACTIONS_STYLE}>
        <input
          type="search"
          placeholder="Search events, codes, owners…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="source-portfolio-search"
          aria-label="Search events"
          style={SEARCH_INPUT_STYLE}
        />

        <div style={VIEW_SWITCHER_STYLE}>
          <span style={VIEW_SWITCHER_LABEL_STYLE}>Portfolio view</span>
          <div
            role="tablist"
            aria-label="Portfolio view"
            style={VIEW_TOGGLE_GROUP_STYLE}
          >
            {viewOptions.map(({ mode, icon, label, title, disabled }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                aria-label={title}
                title={title}
                disabled={disabled}
                onClick={() => !disabled && onViewModeChange(mode)}
                style={{
                  ...VIEW_TOGGLE_BTN_STYLE,
                  ...(viewMode === mode ? VIEW_TOGGLE_BTN_ACTIVE : {}),
                  ...(disabled ? VIEW_TOGGLE_BTN_DISABLED : {}),
                }}
              >
                <span aria-hidden style={VIEW_TOGGLE_ICON_STYLE}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
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

const SCORECARD_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 0,
  marginTop: 16,
  padding: '12px 16px',
  border: `1px solid ${PORTFOLIO.HAIRLINE}`,
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  background: PORTFOLIO.CARD,
};

const SCORECARD_METRICS_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(124px, 1fr))',
  gap: 14,
  alignItems: 'stretch',
};

const SCORE_METRIC_STYLE: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 4,
  minWidth: 0,
};

const SCORE_METRIC_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_MUTED,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const SCORE_METRIC_VALUE_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: 18,
  lineHeight: 1.18,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
};

const SCORE_METRIC_DETAIL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  lineHeight: 1.35,
  color: PORTFOLIO.INK_SOFT,
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
  padding: '14px 0',
  marginBottom: 16,
  flexWrap: 'wrap',
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
  width: 320,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  padding: '8px 12px',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  border: `1px solid ${PORTFOLIO.RULE}`,
  background: PORTFOLIO.CARD,
  color: PORTFOLIO.INK,
  outline: 'none',
};

const SUB_ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 12,
  flexWrap: 'wrap',
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
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  background: PORTFOLIO.CARD,
  overflow: 'hidden',
  flexShrink: 0,
};

const VIEW_SWITCHER_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const VIEW_SWITCHER_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_MUTED,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const VIEW_TOGGLE_BTN_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 86,
  height: 34,
  padding: '0 11px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: PORTFOLIO.INK_SOFT,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_META,
  fontWeight: 700,
  transition: 'background 100ms ease, color 100ms ease',
};

const VIEW_TOGGLE_ICON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const VIEW_TOGGLE_BTN_ACTIVE: CSSProperties = {
  background: PORTFOLIO.INK,
  color: '#ffffff',
};

const VIEW_TOGGLE_BTN_DISABLED: CSSProperties = {
  opacity: 0.35,
  cursor: 'not-allowed',
};
