'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { PortfolioHeader } from '@/components/source/portfolio/PortfolioHeader';
import { KpiStrip } from '@/components/source/portfolio/KpiStrip';
import { AttentionStack } from '@/components/source/portfolio/AttentionStack';
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
  attentionEvents,
  computePortfolioKpis,
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
  const visibleEvents = useMemo(() => filterOutTestArtifacts(events), [events]);
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
      <PortfolioHeader eventCount={0} tenantCount={0} attentionCount={0} variant="empty" />
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
  const banners = useMemo(() => attentionEvents(events).slice(0, 4), [events]);

  // Apply sidebar filters + search to produce the table set.
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
      <PortfolioHeader
        eventCount={events.length}
        tenantCount={tenantCount}
        attentionCount={kpis.attentionCount}
        variant={portfolioState}
      />
      <KpiStrip kpis={kpis} canViewFinancialValues={canViewFinancialValues} />
      <AttentionStack banners={banners} />

      <section
        aria-label="Sourcing events with filters"
        data-testid="source-portfolio-detail-shell"
        style={DETAIL_SHELL_STYLE}
      >
        <PortfolioFilterSidebar events={events} state={filters} onChange={setFilters} />
        <div style={TABLE_COLUMN_STYLE}>
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            visibleCount={filteredEvents.length}
            totalCount={events.length}
            activeFilterCount={totalFilterCount(filters)}
          />
          <PortfolioEventsTable
            rows={tableRows}
            groupBy={isMature ? 'stage-band' : 'none'}
            canViewFinancialValues={canViewFinancialValues}
          />
        </div>
      </section>
    </>
  );
}

function SearchBar({
  query,
  onChange,
  visibleCount,
  totalCount,
  activeFilterCount,
}: {
  query: string;
  onChange: (q: string) => void;
  visibleCount: number;
  totalCount: number;
  activeFilterCount: number;
}) {
  return (
    <div style={SEARCH_ROW_STYLE}>
      <input
        type="search"
        placeholder="Search events, codes, owners…"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        data-testid="source-portfolio-search"
        aria-label="Search events"
        style={SEARCH_INPUT_STYLE}
      />
      <span style={RESULT_COUNT_STYLE}>
        {visibleCount === totalCount && activeFilterCount === 0
          ? `${totalCount} ${totalCount === 1 ? 'event' : 'events'}`
          : `${visibleCount} of ${totalCount}`}
      </span>
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

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  background: PORTFOLIO.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: `0 ${PORTFOLIO.S_PAGE}px 64px`,
};

const DETAIL_SHELL_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '232px minmax(0, 1fr)',
  gap: 32,
  alignItems: 'start',
};

const TABLE_COLUMN_STYLE: CSSProperties = {
  display: 'grid',
  gap: 12,
  minWidth: 0,
};

const SEARCH_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '4px 0 0',
};

const SEARCH_INPUT_STYLE: CSSProperties = {
  flex: 1,
  fontFamily: PORTFOLIO.SANS,
  fontSize: PORTFOLIO.T_BODY_SMALL,
  padding: '8px 14px',
  borderRadius: PORTFOLIO.RADIUS_TIGHT,
  border: `1px solid ${PORTFOLIO.RULE}`,
  background: PORTFOLIO.CARD,
  color: PORTFOLIO.INK,
  outline: 'none',
};

const RESULT_COUNT_STYLE: CSSProperties = {
  fontFamily: PORTFOLIO.MONO,
  fontSize: PORTFOLIO.T_MICRO,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: PORTFOLIO.INK_MUTED,
  whiteSpace: 'nowrap',
};
