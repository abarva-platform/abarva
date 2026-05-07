/**
 * SSR smoke test for the redesigned `/source` portfolio page.
 *
 * Auth-gated routes can't be visited in the dev server without real Clerk keys,
 * so this test renders SourcePortfolioPage directly with synthesized event
 * fixtures and asserts that:
 *   - the new redesign elements render (header, KPI strip, filter pills, table)
 *   - the deprecated UI is NOT present (no agent canvas, work dock, mission preview)
 *   - test artifacts (E2E-CRAWL) are filtered out before render
 *   - the empty / partial / mature state determination works end-to-end
 *
 * The component requires a router and is a client component, so we wrap it in
 * the minimum context to render to static markup.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SourcingEventSummary } from '@/lib/source/types';

// AppShell + AppTopBar use next/navigation hooks that have no router context
// during pure react-dom/server rendering. Stub them with no-op fakes so the
// page tree can render to static markup for assertion.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/source',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
}));

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourcePortfolioPage } from '@/components/source/SourcePortfolioPage';

function makeEvent(overrides: Partial<SourcingEventSummary> = {}): SourcingEventSummary {
  return {
    id: 'evt-fix-1',
    code: 'SRC-APX-101',
    name: 'POS Systems Modernization',
    accountName: 'Apex Retail Group',
    leadAgent: 'Sentinel',
    archetype: 'Managed Service',
    rigor: 'standard',
    status: 'active',
    statusLabel: 'Active',
    priority: 'medium',
    currentStageKey: 'evaluation',
    currentStageLabel: 'Evaluation',
    openAlerts: 0,
    owner: 'Avery Lee',
    agingDays: 1,
    blocker: null,
    nextAction: 'Run evaluation cycle',
    isAtRisk: false,
    valueAtStakeUsd: 5_000_000,
    projectedValueUsd: 5_000_000,
    realizedValueUsd: 0,
    nextDecision: 'Down-select to two finalists',
    ...overrides,
  };
}

function render(events: SourcingEventSummary[], demo?: string) {
  return renderToStaticMarkup(
    createElement(SourcePortfolioPage, {
      events,
      tenantName: 'Apex Retail Group',
      searchParams: { demo },
      canViewFinancialValues: true,
    }),
  );
}

describe('SourcePortfolioPage redesigned render', () => {
  it('renders empty state when no real events exist', () => {
    const html = render([]);

    expect(html).toContain('source-portfolio-page');
    expect(html).toContain('data-portfolio-state="empty"');
    expect(html).toContain('source-portfolio-empty-state');
    expect(html).toContain('Get started');
    expect(html).toContain('Run technology sourcing events');
    expect(html).toContain('Create your first sourcing event');
    expect(html).toContain('/source/new');
  });

  it('forces empty state via ?demo=empty even when events exist', () => {
    const html = render([makeEvent()], 'empty');
    expect(html).toContain('data-portfolio-state="empty"');
    expect(html).toContain('source-portfolio-empty-state');
  });

  it('strips E2E-CRAWL test artifacts before rendering', () => {
    // Each event needs a unique code or dedupeByEventCode collapses them.
    const events = [
      makeEvent({ id: 'real-1', code: 'SRC-APX-A1', name: 'Real Event A' }),
      makeEvent({
        id: 'crawl-1',
        code: 'E2E-APX-1',
        name: 'E2E-CRAWL-test-2026-05-02-firstcapital',
      }),
      makeEvent({ id: 'real-2', code: 'SRC-APX-A2', name: 'Real Event B' }),
      makeEvent({ id: 'crawl-2', code: 'SRC-APX-Z1', name: 'event-20260502T175236Z' }),
    ];
    const html = render(events);
    expect(html).not.toContain('E2E-CRAWL');
    expect(html).not.toContain('20260502T175236Z');
    expect(html).toContain('Real Event A');
    expect(html).toContain('Real Event B');
  });

  it('dedupes events that share the same event_code (seed-loader artifact)', () => {
    const events = [
      makeEvent({ id: 'a', code: 'SRC-DUP-001', currentStageKey: 'scope' }),
      makeEvent({ id: 'b', code: 'SRC-DUP-001', currentStageKey: 'rfp' }),
      makeEvent({ id: 'c', code: 'SRC-DUP-001', currentStageKey: 'pricing' }),
      makeEvent({ id: 'd', code: 'SRC-OTHER-001', name: 'Other Event' }),
    ];
    const html = render(events);
    // Count <tr> rows. The link inside uses `source-portfolio-row-link-{id}`,
    // so we exclude any testid that contains `-link-`.
    const allMatches = html.match(/data-testid="source-portfolio-row-[a-z0-9-]+"/g) ?? [];
    const trRows = allMatches.filter((m) => !m.includes('-link-'));
    expect(trRows.length).toBe(2);
    // The most-advanced stage wins for the duplicate (pricing → 06 of 11).
    expect(html).toContain('06 / 11');
  });

  it('renders empty state when only test artifacts exist', () => {
    const html = render([
      makeEvent({ name: 'E2E-CRAWL-only' }),
      makeEvent({ name: 'E2E-test-only' }),
    ]);
    expect(html).toContain('data-portfolio-state="empty"');
  });

  it('renders partial state with compact header, filter sidebar, and ungrouped table when 1-9 events', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({ id: `evt-${i}`, code: `SRC-APX-${100 + i}`, name: `Event ${i}` }),
    );
    const html = render(events);

    expect(html).toContain('data-portfolio-state="partial"');
    expect(html).toContain('source-portfolio-header');
    expect(html).toContain('source-portfolio-filter-sidebar');
    expect(html).toContain('source-portfolio-events-table');
    expect(html).toContain('source-portfolio-search');
    // No stage-band groups in partial state.
    expect(html).toContain('data-group-by="none"');
    expect(html).not.toContain('source-portfolio-group-discovery');
    // Compact pattern: KPI cards + attention banners are intentionally gone.
    expect(html).not.toContain('source-portfolio-kpi-strip');
    expect(html).not.toContain('source-portfolio-attention-stack');
  });

  it('renders mature state with stage-band groups and filter sidebar at 10+ events', () => {
    const events = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeEvent({
          id: `disc-${i}`,
          code: `SRC-APX-D${i}`,
          name: `Discovery ${i}`,
          currentStageKey: 'strategy',
          currentStageLabel: 'Strategy',
        }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeEvent({
          id: `eval-${i}`,
          code: `SRC-APX-E${i}`,
          name: `Eval ${i}`,
          currentStageKey: 'evaluation',
          currentStageLabel: 'Evaluation',
        }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeEvent({
          id: `dec-${i}`,
          code: `SRC-APX-X${i}`,
          name: `Decision ${i}`,
          currentStageKey: 'executive_decision',
          currentStageLabel: 'Executive Decision',
        }),
      ),
    ];
    const html = render(events);

    expect(html).toContain('data-portfolio-state="mature"');
    expect(html).toContain('data-group-by="stage-band"');
    expect(html).toContain('source-portfolio-group-discovery');
    expect(html).toContain('source-portfolio-group-evaluation');
    expect(html).toContain('source-portfolio-group-decision');
    expect(html).toContain('Discovery &amp; Scope');
    expect(html).toContain('Evaluation &amp; Pricing');
    expect(html).toContain('BAFO &amp; Decision');
    // Sidebar carries the filter taxonomy.
    expect(html).toContain('source-portfolio-filter-sidebar');
  });

  it('shows attention count via the legend + subline (no separate banner stack)', () => {
    const events = [
      makeEvent({
        id: 'r1',
        code: 'SRC-A',
        isAtRisk: true,
        agingDays: 6,
        name: 'Stuck on Vendor',
      }),
      makeEvent({
        id: 'r2',
        code: 'SRC-B',
        status: 'waiting_on_executive_decision',
        statusLabel: 'Waiting on Executive Decision',
        agingDays: 5,
        name: 'Approval Pending',
      }),
      makeEvent({ id: 'r3', code: 'SRC-C', name: 'Healthy event' }),
    ];
    const html = render(events);
    // Banners removed — counts surface in the table rows themselves
    // (red aging, agent-tagged blocker) and the header subline.
    expect(html).not.toContain('source-portfolio-attention-stack');
    expect(html).toMatch(/need your attention today/);
    // Both at-risk events still appear in the table.
    expect(html).toContain('Stuck on Vendor');
    expect(html).toContain('Approval Pending');
  });

  it('renders elegant row density: agent-tag prefix, value range with v2 caveat', () => {
    const events = [
      makeEvent({
        id: 'row-1',
        code: 'SRC-APX-001',
        name: 'AMS Outsourcing 2026',
        currentStageKey: 'scope',
        currentStageLabel: 'Scope',
        blocker: 'Ticket history missing from L2/L3 incidents',
        valueAtStakeUsd: 10_000_000,
      }),
    ];
    const html = render(events);

    // Mini-rail aria label (Stage X of 11)
    expect(html).toContain('Stage 2 of 11');
    // Numeric label + stage name in the mini-rail
    expect(html).toContain('02 / 11');
    // Agent tag derived from current stage (Scope → Nexus)
    expect(html).toContain('NEXUS');
    expect(html).toContain('Ticket history missing');
    // Value range derived ±20% with v2 caveat
    expect(html).toContain('$8.0M – $12.0M');
    expect(html).toContain('v2 pending');
    // "entered N days ago" copy
    expect(html).toContain('entered 1 day ago');
  });

  it('does not include any pulse animation class — productivity-first design', () => {
    const html = render([makeEvent({ isAtRisk: true })]);
    expect(html).not.toContain('src-portfolio-pulse');
    expect(html).not.toMatch(/animation:\s*[a-z-]*pulse/);
  });

  it('exposes the filter sidebar with the four essential filter groups', () => {
    const events = [
      makeEvent({
        id: 'a',
        code: 'SRC-APX-1',
        currentStageKey: 'scope',
        accountName: 'Apex Retail Group',
      }),
      makeEvent({
        id: 'b',
        code: 'SRC-MER-1',
        currentStageKey: 'evaluation',
        accountName: 'Meridian Health System',
        rigor: 'strategic',
      }),
    ];
    const html = render(events);
    expect(html).toContain('source-portfolio-filter-sidebar');
    // Four essential groups — Aging / Value band / Rigor / Flags removed
    // intentionally to reduce filter-bar bloat (per founder feedback).
    expect(html).toContain('Status');
    expect(html).toContain('Stage band');
    expect(html).toContain('Lead agent');
    expect(html).toContain('Tenant');
    // Tenant group only renders when 2+ tenants are in view.
    expect(html).toContain('Apex Retail Group');
    expect(html).toContain('Meridian Health System');
    // Removed filter groups should NOT appear as group headers in the sidebar.
    // ("Aging" is still a TABLE COLUMN heading; "Value" is in column too — so
    // we check for the disambiguating multi-word group labels only.)
    expect(html).not.toContain('Value band');
    expect(html).not.toContain('Rigor');
    expect(html).not.toContain('Flags');
  });

  it('agent-tags use stage-specific lead — Steward for evaluation, Atlas for decision', () => {
    const events = [
      makeEvent({
        id: 'eval-1',
        code: 'SRC-EVAL-1',
        currentStageKey: 'evaluation',
        currentStageLabel: 'Evaluation',
        blocker: 'EA security weight disputed',
      }),
      makeEvent({
        id: 'dec-1',
        code: 'SRC-DEC-1',
        currentStageKey: 'executive_decision',
        currentStageLabel: 'Executive Decision',
        blocker: 'Awaiting CFO sign-off',
      }),
    ];
    const html = render(events);
    expect(html).toContain('STEWARD');
    expect(html).toContain('ATLAS');
  });

  it('does NOT render any of the deprecated /source UI elements', () => {
    const html = render([makeEvent({ id: 'a' }), makeEvent({ id: 'b', name: 'Event B' })]);

    // §8 deprecated elements
    expect(html).not.toContain('Ask Sentinel');
    expect(html).not.toContain('Start with one move');
    expect(html).not.toContain('Open event form');
    expect(html).not.toContain('Event formation');
    expect(html).not.toContain('Sentinel mission preview');
    expect(html).not.toContain('IT-only sourcing scope');
    expect(html).not.toContain('source-work-dock');
    expect(html).not.toContain('source-mission-preview');
    expect(html).not.toContain('source-portfolio-agent-canvas');
    expect(html).not.toContain('source-portfolio-legacy');
    // Status tab strip from old design
    expect(html).not.toContain('All source 2');
    expect(html).not.toContain('At risk 0');
  });

  it('builds the dynamic header subline with event/tenant/attention counts', () => {
    const events = [
      makeEvent({
        id: 'a',
        code: 'SRC-A',
        accountName: 'Apex Retail Group',
        isAtRisk: true,
        agingDays: 6,
      }),
      makeEvent({ id: 'b', code: 'SRC-B', accountName: 'Apex Retail Group' }),
      makeEvent({ id: 'c', code: 'SRC-C', accountName: 'Meridian Health System' }),
    ];
    const html = render(events);
    expect(html).toMatch(/3 events across 2 tenants/);
    expect(html).toMatch(/1 needs your decision today/);
  });
});
