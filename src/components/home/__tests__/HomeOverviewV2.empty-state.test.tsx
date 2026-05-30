/**
 * HomeOverviewV2 · Wave 3 PR-6 · empty-state snapshot tests
 *
 * Covers verdict §5.6 brand-new-tenant empty state contracts:
 *
 *   1. TrustStrip renders four hollow-dot chips when the spine has
 *      zero substrate segments (the EMPTY_CHIPS path on TrustStrip).
 *   2. Action queue is replaced by a single primary editorial card
 *      ("Upload your first dataset to begin grounding.") with two
 *      ghost suggestions linking to org_structure and kpi_dictionary.
 *   3. Posture grid is replaced by the 4-column upload affordance
 *      naming Organization · KPIs · Vendors · Customer.
 *   4. Steward orientation renders the single editorial line, not the
 *      "0 categories loaded" two-column.
 *   5. Audit ribbon empty-line is preserved.
 *   6. Non-empty path renders the standard action queue, posture grid,
 *      and Steward two-column — no regressions.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import { emptyPostureCards } from '@/components/admin/PostureGrid';
import { spineToChips, type TrustStripChip } from '@/components/admin/TrustStrip';
import type { TrustSpine } from '@/lib/admin/broker/trust-spine-broker';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';
import type { HomeOverviewV2Extras } from '@/lib/admin/home-overview-v2';

function emptySpine(): TrustSpine {
  return {
    tenantKey: 'brand-new',
    refreshedAtIso: '2026-05-30T00:00:00Z',
    substrate: {
      segmentsTotal: 0,
      mature: 0,
      sparse: 0,
      missing: 0,
      lastIngestIso: null,
      topSparseSegment: null,
      evidence: 'estimated',
    },
    isolation: {
      rlsCoveragePct: 0,
      tenantResolutionEvents24h: 0,
      anomaliesLast24h: 0,
      topAnomaly: null,
      evidence: 'estimated',
    },
    integration: {
      connectorsTotal: 0,
      connectorsLive: 0,
      connectorsDegraded: 0,
      lastPullIso: null,
      topDegraded: null,
      evidence: 'estimated',
    },
    governance: {
      ssoConfigured: false,
      openApprovals: 0,
      policyDriftCount: 0,
      openInvites: 0,
      evidence: 'estimated',
    },
    audit: { last24hEvents: [] },
  };
}

const EMPTY_CHIPS_FOR_TEST: ReadonlyArray<TrustStripChip> = spineToChips(
  emptySpine(),
);

function emptyBlocks(): OverviewBlocks {
  return {
    status: {
      tenantName: 'Brand New Co',
      readinessPercent: null,
      agentLevel: 'blank',
      blockedCapabilityTracks: 0,
    },
    orientation: {
      tenantName: 'Brand New Co',
      industryPhrase: null,
      loadedSummary:
        'AbarVa has no substrate for this tenant. Once you load enterprise profile, Sentinel can begin answering with provenance.',
      missingSummary:
        'No segments are loaded yet. Start with org structure or KPI dictionary — the two highest-leverage first loads.',
      nextLoadName: null,
      nextLoadConsequence: null,
      isEmptyTenant: true,
    },
    actionQueue: { items: [], totalPending: 0 },
    recentActivity: { items: [] },
  };
}

function emptyExtras(): HomeOverviewV2Extras {
  return {
    masthead: {
      segmentsLoaded: 0,
      totalRecords: 0,
      panelsAttention: 0,
      refreshedLabel: null,
    },
    readiness: [],
    panels: [],
  };
}

function nonEmptyBlocks(): OverviewBlocks {
  return {
    status: {
      tenantName: 'Apex Retail Group',
      readinessPercent: 68,
      agentLevel: 'partial',
      blockedCapabilityTracks: 2,
    },
    orientation: {
      tenantName: 'Apex Retail Group',
      industryPhrase: 'Retail enterprise · omnichannel',
      loadedSummary: 'three categories are loaded',
      missingSummary: 'two are still authored only',
      nextLoadName: 'KPI Dictionary',
      nextLoadConsequence: 'Sentinel can attribute margin moves to specific KPIs.',
      isEmptyTenant: false,
    },
    actionQueue: {
      items: [
        {
          id: 'a1',
          severity: 'high',
          label: 'Approve 2 program briefs',
          consequence: 'unlocks Phase 0',
          href: '/admin/programs/approvals',
          panelLabel: 'Approvals',
        },
      ],
      totalPending: 1,
    },
    recentActivity: { items: [] },
  };
}

describe('<HomeOverviewV2 /> · brand-new-tenant empty state', () => {
  function emptyHtml(): string {
    return renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Brand New Co"
        clientKey={null}
        blocks={emptyBlocks()}
        extras={emptyExtras()}
        trustChips={EMPTY_CHIPS_FOR_TEST}
        liveSnapshotPresent={false}
        auditEvents={[]}
        postureCards={emptyPostureCards()}
        emptyTenant
      />,
    );
  }

  it('renders all four trust chips with hollow dots when emptyTenant', () => {
    const html = emptyHtml();
    // Hollow dot: estimated style uses `background: transparent`
    // and a faint border. The four EMPTY_CHIPS all share this.
    const occurrences = (html.match(/data-chip-evidence="estimated"/g) ?? [])
      .length;
    expect(occurrences).toBe(4);
    expect(html).toContain('no data yet');
    expect(html).toContain('data-chip-id="substrate"');
    expect(html).toContain('data-chip-id="isolation"');
    expect(html).toContain('data-chip-id="integrations"');
    expect(html).toContain('data-chip-id="governance"');
  });

  it('renders single primary action card with two ghost suggestions in place of the action queue', () => {
    const html = emptyHtml();
    expect(html).toContain('home-overview-empty-action-card');
    expect(html).toContain(
      'Upload your first dataset to begin grounding.',
    );
    // Two ghost suggestions linking to data-trust with segment pre-seeded.
    expect(html).toContain('home-overview-empty-ghost-org');
    expect(html).toContain('home-overview-empty-ghost-kpi');
    expect(html).toContain(
      'href="/admin/data-trust?segment=org_structure"',
    );
    expect(html).toContain(
      'href="/admin/data-trust?segment=kpi_dictionary"',
    );
    // The existing action-queue items array is empty AND emptyTenant
    // is true, so the existing action-queue UI must be absent.
    expect(html).not.toContain('Approve');
  });

  it('replaces 2x2 PostureGrid with the 4-column upload affordance', () => {
    const html = emptyHtml();
    expect(html).toContain('admin-empty-tenant-upload-affordance');
    // Four named tiles per verdict §5.6.
    expect(html).toContain('admin-empty-tenant-tile-organization');
    expect(html).toContain('admin-empty-tenant-tile-kpis');
    expect(html).toContain('admin-empty-tenant-tile-vendors');
    expect(html).toContain('admin-empty-tenant-tile-customer');
    // The standard 2×2 grid must NOT render in the empty state.
    expect(html).not.toContain('admin-posture-grid');
    expect(html).not.toContain('admin-posture-card-substrate');
  });

  it('renders the editorial Steward line, not the two-column loaded/missing', () => {
    const html = emptyHtml();
    expect(html).toContain('home-overview-steward-empty');
    expect(html).toContain(
      'AbarVa has no substrate for this tenant. Once you load enterprise profile, Sentinel can begin answering with provenance.',
    );
    // Two-column eyebrows must NOT appear in the empty state.
    expect(html).not.toContain('Loaded · grounded');
    expect(html).not.toContain('Missing · authored only');
    // The "next load" callout is suppressed when emptyTenant is true.
    expect(html).not.toContain('Next load · highest leverage');
  });

  it('audit ribbon empty line preserved (stewarded copy · PRE-W4-PR-5)', () => {
    const html = emptyHtml();
    expect(html).toContain('audit-ribbon-empty');
    // The flat 24h line was replaced by a stewarded sentence naming
    // what fills the ribbon (PRE-W4-PR-5 bonus fix, persona §9 #8).
    expect(html).toContain('No activity yet');
    expect(html).toContain('Events will appear here');
  });

  // ── PRE-W4-PR-5 additions ────────────────────────────────────────

  it('renders SETUP eyebrow (unified masthead label, fix #6)', () => {
    const html = emptyHtml();
    // The eyebrow noun was conflicting with "Setup · AbarVa" browser
    // tab + "Setup · Admin" sidebar header. Unified to SETUP.
    expect(html).toContain('SETUP ');
    expect(html).not.toContain('HOME · <span');
  });

  it('renders the Section 01 readiness empty-state placeholder, not four red bars (fix #7)', () => {
    const html = emptyHtml();
    expect(html).toContain('home-overview-readiness-empty');
    expect(html).toContain('Readiness will compute when your first dataset lands');
    // Per-module readiness CARDS must NOT appear when readiness is
    // empty. We assert on the load-bearing artifacts of a rendered
    // ReadyCard (the "% READY" suffix and the "Open <module> →" CTA),
    // since the placeholder prose itself does mention the module names.
    expect(html).not.toContain('% READY');
    expect(html).not.toContain('Open Tower →');
    expect(html).not.toContain('Open Source →');
  });
});

describe('<HomeOverviewV2 /> · non-empty path unaffected', () => {
  function nonEmptyHtml(): string {
    return renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={nonEmptyBlocks()}
        extras={emptyExtras()}
        trustChips={null}
        liveSnapshotPresent={false}
        auditEvents={[]}
        postureCards={emptyPostureCards()}
        emptyTenant={false}
      />,
    );
  }

  it('does NOT render the empty-action-card or upload-affordance', () => {
    const html = nonEmptyHtml();
    expect(html).not.toContain('home-overview-empty-action-card');
    expect(html).not.toContain('admin-empty-tenant-upload-affordance');
  });

  it('renders the standard 2×2 PostureGrid', () => {
    const html = nonEmptyHtml();
    expect(html).toContain('admin-posture-grid');
  });

  it('renders the standard Steward two-column read', () => {
    const html = nonEmptyHtml();
    expect(html).toContain('Loaded · grounded');
    expect(html).toContain('Missing · authored only');
    expect(html).not.toContain('home-overview-steward-empty');
  });

  it('renders the existing action-queue when items exist', () => {
    const html = nonEmptyHtml();
    expect(html).toContain('Approve 2 program briefs');
  });
});

// Defensive: the spineToChips empty-substrate path is the canonical
// way to derive the four hollow-dot chips. Cover it directly so the
// page composer can rely on it without a dedicated branch.
describe('spineToChips · empty substrate', () => {
  it('returns four estimated chips with hollow-dot styling when segmentsTotal === 0', () => {
    const chips = spineToChips(emptySpine());
    expect(chips).toHaveLength(4);
    expect(chips.every((c) => c.evidence === 'estimated')).toBe(true);
    expect(chips.every((c) => c.metric.label === 'no data yet')).toBe(true);
  });
});
