/**
 * HomeOverviewV2 masthead · TenantSwitcher smoke — Wave 2 PR-5.
 *
 * Verdict §5.6 Zone A: the masthead carries an inline switcher chip
 * for founder + multi-tenant admins. Non-admins see a static label in
 * the same DOM slot. This file pins both arms via SSR-rendered markup.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import { composeHomeV2Extras } from '@/lib/admin/home-overview-v2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';

function fixtureBlocks(): OverviewBlocks {
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
    actionQueue: { items: [], totalPending: 0 },
    recentActivity: { items: [] },
  };
}

const SWITCH_OPTIONS = [
  { canonicalKey: 'apex-retail', displayName: 'Apex Retail Group', industryLabel: 'Retail' },
  { canonicalKey: 'meridian-health', displayName: 'Meridian Health System', industryLabel: 'Healthcare' },
  { canonicalKey: 'first-capital', displayName: 'First Capital Financial', industryLabel: 'Financial Services' },
  { canonicalKey: 'northstar-clinical', displayName: 'Northstar Clinical Technologies', industryLabel: 'Clinical Technology' },
  { canonicalKey: 'skyharbor-air', displayName: 'SkyHarbor Air', industryLabel: 'Global Airline' },
];

function ssrExtras() {
  return composeHomeV2Extras({
    segments: [],
    programsCount: 0,
    programsP6Count: 0,
    sourceEventsCount: 0,
    sourceEventsAtRiskCount: 0,
    initiativesCount: 0,
    initiativesAtRiskCount: 0,
    lastIngestedAt: null,
  });
}

describe('HomeOverviewV2 masthead TenantSwitcher', () => {
  it('renders the inline switcher chip for admins', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={ssrExtras()}
        canSwitchTenant
        currentCanonicalTenantKey="apex-retail"
        tenantSwitchOptions={SWITCH_OPTIONS}
      />,
    );
    expect(html).toContain('data-testid="tenant-switcher"');
    expect(html).toContain('data-testid="tenant-switcher-chip"');
    // Static label MUST NOT also render.
    expect(html).not.toContain('data-testid="tenant-switcher-static"');
  });

  it('renders the static label (no chip) when canSwitchTenant=false', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={ssrExtras()}
        canSwitchTenant={false}
      />,
    );
    expect(html).toContain('data-testid="tenant-switcher-static"');
    expect(html).not.toContain('data-testid="tenant-switcher-chip"');
  });

  it('falls back to the static label when canSwitchTenant=true but options are missing', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={ssrExtras()}
        canSwitchTenant
        currentCanonicalTenantKey={null}
        tenantSwitchOptions={SWITCH_OPTIONS}
      />,
    );
    // canonical key missing → render static label, never POST without
    // a known current tenant.
    expect(html).toContain('data-testid="tenant-switcher-static"');
    expect(html).not.toContain('data-testid="tenant-switcher-chip"');
  });
});
