/**
 * /admin landing · per-zone Suspense boundary smoke · Wave 3 PR-7.
 *
 * Pins the verdict §5.6 Loading state invariant: each Trust Plane
 * zone has its OWN Suspense boundary inside HomeOverviewV2. The
 * masthead is synchronous; trust strip, action queue, posture grid,
 * steward orientation, and audit ribbon each stream independently
 * with their matching skeleton fallback.
 *
 * Strategy: pass a "never-resolving" promise component as each zone's
 * slot prop. React.renderToStaticMarkup will emit the Suspense
 * fallback for any slot whose component suspends. That lets us assert
 * each skeleton renders inside the correct DOM region without
 * spinning up a full streaming renderer.
 *
 * The companion `HomeOverviewV2.dom-order.test.tsx` continues to pin
 * the eager (static-prop) rendering path, so callers that don't yet
 * pass slots keep working.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';
import type { HomeOverviewV2Extras } from '@/lib/admin/home-overview-v2';

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

function fixtureExtras(): HomeOverviewV2Extras {
  return {
    readiness: [],
    panels: [],
    masthead: {
      segmentsLoaded: 14,
      totalRecords: 403,
      panelsAttention: 0,
      refreshedLabel: '5 minutes ago',
    },
  };
}

/**
 * A component that suspends forever. React server-rendering treats
 * `use(promise)` as a suspend signal, so renderToStaticMarkup will
 * fall through to the Suspense fallback in this call.
 */
function NeverResolves(): React.ReactNode {
  // Throwing a never-resolving promise is the classic Suspense trigger
  // that works with renderToStaticMarkup synchronously.
  throw new Promise(() => {
    /* never resolves */
  });
}

describe('/admin HomeOverviewV2 per-zone Suspense boundaries (Wave 3 PR-7)', () => {
  it('renders the TrustStripSkeleton when trustStripSlot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        trustStripSlot={<NeverResolves />}
      />,
    );
    expect(html).toContain('data-testid="admin-trust-strip-skeleton"');
  });

  it('renders the ActionQueueSkeleton when actionQueueSlot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        actionQueueSlot={<NeverResolves />}
      />,
    );
    expect(html).toContain('data-testid="admin-action-queue-skeleton"');
  });

  it('renders the PostureGridSkeleton when postureGridSlot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        postureGridSlot={<NeverResolves />}
      />,
    );
    expect(html).toContain('data-testid="admin-posture-grid-skeleton"');
  });

  it('renders the StewardOrientationSkeleton when stewardOrientationSlot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        stewardOrientationSlot={<NeverResolves />}
      />,
    );
    expect(html).toContain('data-testid="admin-steward-orientation-skeleton"');
  });

  it('renders the AuditRibbonSkeleton when auditRibbonSlot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        auditRibbonSlot={<NeverResolves />}
      />,
    );
    expect(html).toContain('data-testid="admin-audit-ribbon-skeleton"');
  });

  it('renders the masthead synchronously even when every zone slot suspends', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        trustStripSlot={<NeverResolves />}
        actionQueueSlot={<NeverResolves />}
        postureGridSlot={<NeverResolves />}
        stewardOrientationSlot={<NeverResolves />}
        auditRibbonSlot={<NeverResolves />}
      />,
    );
    // Masthead — tenant name and "WHERE YOU STAND" eyebrow are
    // synchronous; they must appear even though every zone is
    // suspended.
    expect(html).toContain('Apex Retail Group');
    expect(html).toContain('WHERE YOU STAND AND WHAT TO DO NEXT');
  });

  it('preserves DOM order under Suspense: TrustStrip skeleton BEFORE ActionQueue skeleton BEFORE Posture grid skeleton BEFORE Steward skeleton BEFORE Audit skeleton', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        trustStripSlot={<NeverResolves />}
        actionQueueSlot={<NeverResolves />}
        postureGridSlot={<NeverResolves />}
        stewardOrientationSlot={<NeverResolves />}
        auditRibbonSlot={<NeverResolves />}
      />,
    );
    const stripIdx = html.indexOf('admin-trust-strip-skeleton');
    const queueIdx = html.indexOf('admin-action-queue-skeleton');
    const gridIdx = html.indexOf('admin-posture-grid-skeleton');
    const stewardIdx = html.indexOf('admin-steward-orientation-skeleton');
    const auditIdx = html.indexOf('admin-audit-ribbon-skeleton');
    expect(stripIdx).toBeGreaterThan(-1);
    expect(queueIdx).toBeGreaterThan(-1);
    expect(gridIdx).toBeGreaterThan(-1);
    expect(stewardIdx).toBeGreaterThan(-1);
    expect(auditIdx).toBeGreaterThan(-1);
    expect(stripIdx).toBeLessThan(queueIdx);
    expect(queueIdx).toBeLessThan(gridIdx);
    expect(gridIdx).toBeLessThan(stewardIdx);
    expect(stewardIdx).toBeLessThan(auditIdx);
  });

  it('does not render any spinner anywhere on the suspended page', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        liveSnapshotPresent={true}
        trustStripSlot={<NeverResolves />}
        actionQueueSlot={<NeverResolves />}
        postureGridSlot={<NeverResolves />}
        stewardOrientationSlot={<NeverResolves />}
        auditRibbonSlot={<NeverResolves />}
      />,
    );
    expect(html).not.toMatch(/spinner/i);
    expect(html).not.toMatch(/role="progressbar"/i);
    expect(html).not.toMatch(/<svg/i);
    expect(html).not.toMatch(/loading\.gif/i);
    expect(html).not.toMatch(/@keyframes/i);
  });
});
