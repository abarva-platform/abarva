/**
 * HomeOverviewV2 · PR-2613 (P0 follow-up to PR-2606) · banner test
 *
 * When `snapshotLoadFailed` is true the page must render a "Live data
 * temporarily unavailable" banner above the Trust strip with a Retry
 * link back to /admin. When the prop is false (or omitted) the banner
 * MUST NOT appear — otherwise we would scare users on every clean
 * page render.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';
import type { HomeOverviewV2Extras } from '@/lib/admin/home-overview-v2';

function baseBlocks(): OverviewBlocks {
  return {
    status: {
      tenantName: 'Meridian Health',
      readinessPercent: 60,
      agentLevel: 'partial',
      blockedCapabilityTracks: 1,
    },
    orientation: {
      tenantName: 'Meridian Health',
      industryPhrase: 'Healthcare IDN',
      loadedSummary: 'three categories are loaded',
      missingSummary: 'two are still authored only',
      nextLoadName: 'KPI Dictionary',
      nextLoadConsequence: 'Sentinel can attribute outcomes to KPIs.',
      isEmptyTenant: false,
    },
    actionQueue: { items: [], totalPending: 0 },
    recentActivity: { items: [] },
  };
}

function baseExtras(): HomeOverviewV2Extras {
  return {
    masthead: {
      segmentsLoaded: 14,
      totalRecords: 403,
      panelsAttention: 0,
      refreshedLabel: null,
    },
    readiness: [],
    panels: [],
  };
}

describe('<HomeOverviewV2 /> · snapshotLoadFailed banner', () => {
  it('renders the banner with Retry link when snapshotLoadFailed is true', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Meridian Health"
        clientKey="meridian"
        blocks={baseBlocks()}
        extras={baseExtras()}
        snapshotLoadFailed
      />,
    );
    expect(html).toContain('data-testid="home-overview-v2-snapshot-load-failed"');
    expect(html).toContain('Live data temporarily unavailable');
    expect(html).toContain('Showing authored baseline');
    expect(html).toContain('Retry');
    expect(html).toContain('href="/admin"');
    // Accessibility: status role announces to assistive tech.
    expect(html).toContain('role="status"');
  });

  it('does not render the banner when snapshotLoadFailed is false (default)', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Meridian Health"
        clientKey="meridian"
        blocks={baseBlocks()}
        extras={baseExtras()}
      />,
    );
    expect(html).not.toContain('home-overview-v2-snapshot-load-failed');
    expect(html).not.toContain('Live data temporarily unavailable');
  });

  it('does not render the banner when snapshotLoadFailed is explicitly false', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Meridian Health"
        clientKey="meridian"
        blocks={baseBlocks()}
        extras={baseExtras()}
        snapshotLoadFailed={false}
      />,
    );
    expect(html).not.toContain('home-overview-v2-snapshot-load-failed');
  });
});
