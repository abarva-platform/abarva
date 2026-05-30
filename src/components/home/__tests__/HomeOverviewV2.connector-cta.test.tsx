/**
 * /admin landing · Connector onboarding CTA · Wave 2 PR-6.
 *
 * Pins the verdict §4 Persona A friction fix: the Connectors panel
 * card on the Setup landing must surface an "Add connector" CTA
 * pointing at `/admin/connectors?add=open` so first-time tenant
 * admins can reach the onboarding drawer without navigating away
 * from the landing first.
 *
 * Asserts both the static composer output (panel `cta` field) and
 * the DOM (the CTA element is rendered with the right deep-link).
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import { composeHomeV2Extras } from '@/lib/admin/home-overview-v2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';
import type { InventorySegmentRollup } from '@/lib/admin/setup-acts-registry';

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

const SEGMENTS: ReadonlyArray<InventorySegmentRollup> = [];

describe('HomeOverviewV2 connector onboarding CTA', () => {
  it('composer emits an Add connector CTA on the Connectors panel', () => {
    const extras = composeHomeV2Extras({
      segments: SEGMENTS,
      programsCount: 0,
      programsP6Count: 0,
      sourceEventsCount: 0,
      sourceEventsAtRiskCount: 0,
      initiativesCount: 0,
      initiativesAtRiskCount: 0,
      lastIngestedAt: null,
    });
    const connectorsPanel = extras.panels.find((p) => p.name === 'Connectors');
    expect(connectorsPanel).toBeTruthy();
    expect(connectorsPanel!.cta).toBeTruthy();
    expect(connectorsPanel!.cta!.label).toBe('Add connector');
    expect(connectorsPanel!.cta!.href).toBe('/admin/connectors?add=open');
    expect(connectorsPanel!.cta!.telemetryEvent).toBe(
      'connector_onboarding_landing_cta_clicked',
    );
  });

  it('renders the Add connector CTA on the Connectors panel card', () => {
    const extras = composeHomeV2Extras({
      segments: SEGMENTS,
      programsCount: 0,
      programsP6Count: 0,
      sourceEventsCount: 0,
      sourceEventsAtRiskCount: 0,
      initiativesCount: 0,
      initiativesAtRiskCount: 0,
      lastIngestedAt: null,
    });
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={extras}
        trustChips={null}
        liveSnapshotPresent={false}
      />,
    );
    expect(html).toContain('data-panel-cta-href="/admin/connectors?add=open"');
    // The connectors panel uses '03' as its num — assert the CTA sits
    // inside the connectors card by checking both substrings appear.
    expect(html).toContain('data-panel-num="03"');
  });
});
