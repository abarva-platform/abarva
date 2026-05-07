'use client';

import { useMemo, useState, type CSSProperties } from 'react';
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
      </main>
    </AppShell>
  );
}

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

  return (
    <>
      <CompactHeader
        eventCount={events.length}
        tenantCount={tenantCount}
        attentionCount={kpis.attentionCount}
        activeCount={kpis.active}
        completedCount={kpis.completed}
        waitingCount={kpis.waiting}
        variant={portfolioState}
      />
      <SubHeader
        eventCount={events.length}
        visibleCount={filteredEvents.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilterCount={totalFilterCount(filters)}
      />

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
    </>
  );
}

// ── Compact header — title row + status legend + subline ─────────────────────
// Strategic Moves' Portfolio map pattern: title left, legend right, subline below.
// No KPI cards, no attention banners — counts are in the subline + table rows.

interface CompactHeaderProps {
  eventCount: number;
  tenantCount?: number;
  attentionCount: number;
  activeCount?: number;
  completedCount?: number;
  waitingCount?: number;
  variant: 'empty' | 'partial' | 'mature';
}

function CompactHeader({
  eventCount,
  tenantCount = 0,
  attentionCount,
  activeCount = 0,
  completedCount = 0,
  waitingCount = 0,
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
        <div style={HEADER_RIGHT_STYLE}>
          {variant !== 'empty' ? (
            <StatusLegend
              attention={attentionCount}
              active={activeCount}
              waiting={waitingCount}
              completed={completedCount}
            />
          ) : null}
          {showCta ? (
            <Link href="/source/new" data-testid="source-create-event-cta" style={CTA_STYLE}>
              New sourcing event
            </Link>
          ) : null}
        </div>
      </div>
      {subline ? <p style={SUBLINE_STYLE}>{subline}</p> : null}
    </header>
  );
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

function StatusLegend({
  attention,
  active,
  waiting,
  completed,
}: {
  attention: number;
  active: number;
  waiting: number;
  completed: number;
}) {
  return (
    <div style={LEGEND_STYLE} aria-label="Status legend">
      <LegendItem color={PORTFOLIO.BLOCKED} label="At risk" count={attention} />
      <LegendItem color={PORTFOLIO.WAITING} label="Waiting" count={waiting} />
      <LegendItem color={PORTFOLIO.ACTIVE} label="Active" count={active} />
      <LegendItem color={PORTFOLIO.COMPLETED} label="Completed" count={completed} />
    </div>
  );
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={LEGEND_ITEM_STYLE}>
      <span aria-hidden style={{ ...LEGEND_DOT_STYLE, background: color }} />
      <span style={LEGEND_LABEL_STYLE}>{label}</span>
      <span style={LEGEND_COUNT_STYLE}>{count}</span>
    </span>
  );
}

// ── Sub-header strip — search + result count ─────────────────────────────────
// Strategic Moves equivalent of "14 MOVES · ALL TENANTS · SORT: PHASE ▾". For
// Source we keep it minimal: search + count. Sort/view-toggle are deferred.

function SubHeader({
  eventCount,
  visibleCount,
  searchQuery,
  onSearchChange,
  activeFilterCount,
}: {
  eventCount: number;
  visibleCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilterCount: number;
}) {
  const showFiltered = visibleCount !== eventCount || activeFilterCount > 0;
  return (
    <div style={SUB_HEADER_STYLE}>
      <span style={SUB_LABEL_STYLE}>
        {showFiltered
          ? `${visibleCount} of ${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
          : `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`}
      </span>
      <input
        type="search"
        placeholder="Search events, codes, owners…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        data-testid="source-portfolio-search"
        aria-label="Search events"
        style={SEARCH_INPUT_STYLE}
      />
    </div>
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

const HEADER_RIGHT_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
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

const LEGEND_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const LEGEND_ITEM_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const LEGEND_DOT_STYLE: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
  display: 'inline-block',
};

const LEGEND_LABEL_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_SOFT,
  fontWeight: 600,
};

const LEGEND_COUNT_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO_SMALL,
  fontWeight: 700,
  color: PORTFOLIO.INK,
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
