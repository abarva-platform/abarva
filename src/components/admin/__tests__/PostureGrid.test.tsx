/**
 * PostureGrid · Wave 2 PR-4 · tests
 *
 * Covers verdict §5.6 Zone D contracts:
 *  - 4 cards render in fixed order: substrate → connector → isolation
 *    → approvals.
 *  - Status border color follows the locked palette per status.
 *  - Click target maps to the correct group destination, including
 *    approvals branching on openApprovals > 0.
 *  - Estimated cards render in the muted state.
 *  - `emptyPostureCards()` covers the brand-new-tenant case.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import {
  EmptyTenantUploadAffordance,
  PostureGrid,
  emptyPostureCards,
  firstFourDatasetTiles,
  spineToPostureCards,
  type PostureCard,
} from '../PostureGrid';
import type { TrustSpine } from '@/lib/admin/broker/trust-spine-broker';

function fixtureSpine(overrides: Partial<TrustSpine> = {}): TrustSpine {
  return {
    tenantKey: 'apex-retail',
    refreshedAtIso: '2026-05-30T12:00:00Z',
    substrate: {
      segmentsTotal: 14,
      mature: 11,
      sparse: 3,
      missing: 0,
      lastIngestIso: '2026-05-29T12:00:00Z',
      topSparseSegment: {
        id: 'kpi_dictionary',
        label: 'KPI dictionary',
        unlocks: 'Load KPI dictionary to unlock causal reasoning.',
      },
      evidence: 'live',
    },
    isolation: {
      rlsCoveragePct: 96,
      tenantResolutionEvents24h: 220,
      anomaliesLast24h: 0,
      topAnomaly: null,
      evidence: 'live',
    },
    integration: {
      connectorsTotal: 6,
      connectorsLive: 5,
      connectorsDegraded: 1,
      lastPullIso: '2026-05-30T10:00:00Z',
      topDegraded: {
        id: 'sf',
        name: 'Salesforce',
        reason: 'sync failed 4h ago — re-auth',
      },
      evidence: 'live',
    },
    governance: {
      ssoConfigured: true,
      openApprovals: 2,
      policyDriftCount: 0,
      openInvites: 3,
      evidence: 'live',
    },
    audit: { last24hEvents: [] },
    ...overrides,
  };
}

describe('spineToPostureCards', () => {
  it('returns 4 cards in fixed order: substrate, connector, isolation, approvals', () => {
    const cards = spineToPostureCards(fixtureSpine());
    expect(cards.map((c) => c.id)).toEqual([
      'substrate',
      'connector',
      'isolation',
      'approvals',
    ]);
  });

  it('substrate status thresholds: ready (≥5 mature), attention (1-4), breach (0)', () => {
    const ready = spineToPostureCards(fixtureSpine())[0];
    expect(ready.status).toBe('ready');
    const attention = spineToPostureCards(
      fixtureSpine({
        substrate: {
          segmentsTotal: 3,
          mature: 2,
          sparse: 1,
          missing: 0,
          lastIngestIso: null,
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    )[0];
    expect(attention.status).toBe('attention');
    const breach = spineToPostureCards(
      fixtureSpine({
        substrate: {
          segmentsTotal: 0,
          mature: 0,
          sparse: 0,
          missing: 0,
          lastIngestIso: null,
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    )[0];
    expect(breach.status).toBe('breach');
  });

  it('substrate footer uses topSparseSegment.unlocks copy when present', () => {
    const card = spineToPostureCards(fixtureSpine())[0];
    expect(card.footer).toContain('KPI dictionary');
  });

  it('substrate footer honest when all segments grounded', () => {
    const card = spineToPostureCards(
      fixtureSpine({
        substrate: {
          segmentsTotal: 10,
          mature: 10,
          sparse: 0,
          missing: 0,
          lastIngestIso: null,
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    )[0];
    expect(card.footer).toBe('All segments grounded.');
  });

  it('connector status thresholds: breach (>2 degraded), attention (>0), ready (0)', () => {
    const attention = spineToPostureCards(fixtureSpine())[1];
    expect(attention.status).toBe('attention');
    const breach = spineToPostureCards(
      fixtureSpine({
        integration: {
          connectorsTotal: 6,
          connectorsLive: 2,
          connectorsDegraded: 4,
          lastPullIso: null,
          topDegraded: { id: 'x', name: 'X', reason: 'broken' },
          evidence: 'live',
        },
      }),
    )[1];
    expect(breach.status).toBe('breach');
    const ready = spineToPostureCards(
      fixtureSpine({
        integration: {
          connectorsTotal: 3,
          connectorsLive: 3,
          connectorsDegraded: 0,
          lastPullIso: null,
          topDegraded: null,
          evidence: 'live',
        },
      }),
    )[1];
    expect(ready.status).toBe('ready');
  });

  it('connector marked estimated when integration evidence is estimated', () => {
    const card = spineToPostureCards(
      fixtureSpine({
        integration: {
          connectorsTotal: 0,
          connectorsLive: 0,
          connectorsDegraded: 0,
          lastPullIso: null,
          topDegraded: null,
          evidence: 'estimated',
        },
      }),
    )[1];
    expect(card.status).toBe('estimated');
  });

  it('isolation status: ready when 0 anomalies, breach otherwise; estimated short-circuits', () => {
    const ready = spineToPostureCards(fixtureSpine())[2];
    expect(ready.status).toBe('ready');
    const breach = spineToPostureCards(
      fixtureSpine({
        isolation: {
          rlsCoveragePct: 96,
          tenantResolutionEvents24h: 220,
          anomaliesLast24h: 1,
          topAnomaly: {
            id: 'a',
            description: 'Cross-tenant query observed',
            severity: 'high',
          },
          evidence: 'live',
        },
      }),
    )[2];
    expect(breach.status).toBe('breach');
    expect(breach.footer).toBe('Cross-tenant query observed');
    const estimated = spineToPostureCards(
      fixtureSpine({
        isolation: {
          rlsCoveragePct: 0,
          tenantResolutionEvents24h: 0,
          anomaliesLast24h: 0,
          topAnomaly: null,
          evidence: 'estimated',
        },
      }),
    )[2];
    expect(estimated.status).toBe('estimated');
  });

  it('governance status: attention when openApprovals > 0 OR openInvites > 5', () => {
    const attention = spineToPostureCards(fixtureSpine())[3];
    expect(attention.status).toBe('attention');
    const invitesOnly = spineToPostureCards(
      fixtureSpine({
        governance: {
          ssoConfigured: true,
          openApprovals: 0,
          policyDriftCount: 0,
          openInvites: 9,
          evidence: 'live',
        },
      }),
    )[3];
    expect(invitesOnly.status).toBe('attention');
    const ready = spineToPostureCards(
      fixtureSpine({
        governance: {
          ssoConfigured: true,
          openApprovals: 0,
          policyDriftCount: 0,
          openInvites: 1,
          evidence: 'live',
        },
      }),
    )[3];
    expect(ready.status).toBe('ready');
  });

  it('approvals href routes to /admin/programs/approvals when openApprovals > 0, else /admin/users-access', () => {
    const withApprovals = spineToPostureCards(fixtureSpine())[3];
    expect(withApprovals.href).toBe('/admin/programs/approvals');
    const noApprovals = spineToPostureCards(
      fixtureSpine({
        governance: {
          ssoConfigured: false,
          openApprovals: 0,
          policyDriftCount: 0,
          openInvites: 0,
          evidence: 'live',
        },
      }),
    )[3];
    expect(noApprovals.href).toBe('/admin/users-access');
  });

  it('substrate · connector · isolation hrefs hit verdict-pinned routes', () => {
    const cards = spineToPostureCards(fixtureSpine());
    expect(cards[0].href).toBe('/admin/data-trust');
    expect(cards[1].href).toBe('/admin/connectors');
    expect(cards[2].href).toBe('/admin/audit?tab=isolation');
  });
});

describe('emptyPostureCards', () => {
  it('returns 4 estimated cards in fixed order with no-data copy', () => {
    const cards = emptyPostureCards();
    expect(cards).toHaveLength(4);
    expect(cards.map((c) => c.id)).toEqual([
      'substrate',
      'connector',
      'isolation',
      'approvals',
    ]);
    for (const c of cards) {
      expect(c.status).toBe('estimated');
      expect(c.stat).toBe('no data yet');
    }
  });
});

describe('<PostureGrid />', () => {
  function fixtureCards(): PostureCard[] {
    return spineToPostureCards(fixtureSpine());
  }

  it('renders 4 cards in fixed order with the expected testids', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={fixtureCards()} />);
    const ids = ['substrate', 'connector', 'isolation', 'approvals'];
    let lastIdx = -1;
    for (const id of ids) {
      const idx = html.indexOf(`admin-posture-card-${id}`);
      expect(idx).toBeGreaterThan(-1);
      expect(idx).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });

  it('exposes status on each card via data-status', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={fixtureCards()} />);
    // substrate ready, connector attention, isolation ready, approvals attention
    expect(html).toContain('data-status="ready"');
    expect(html).toContain('data-status="attention"');
  });

  it('renders status border colors from the locked palette', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={fixtureCards()} />);
    // substrate ready → teal #0E8A65; connector attention → amber #92400E
    expect(html).toMatch(/border-left:\s*3px solid #0E8A65/i);
    expect(html).toMatch(/border-left:\s*3px solid #92400E/i);
  });

  it('renders cards as anchors with href targeting the correct group route', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={fixtureCards()} />);
    expect(html).toContain('href="/admin/data-trust"');
    expect(html).toContain('href="/admin/connectors"');
    expect(html).toContain('href="/admin/audit?tab=isolation"');
    expect(html).toContain('href="/admin/programs/approvals"');
  });

  it('muted estimated state uses the faint border tone', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={emptyPostureCards()} />);
    // estimated → faint #6B7280
    expect(html).toMatch(/border-left:\s*3px solid #6B7280/i);
    expect(html).toContain('data-status="estimated"');
    expect(html).toContain('no data yet');
  });

  it('empty cards prop array renders no cards (defensive)', () => {
    const html = renderToStaticMarkup(<PostureGrid cards={[]} />);
    expect(html).toContain('admin-posture-grid');
    expect(html).not.toContain('admin-posture-card-');
  });
});

// Wave 3 PR-6 · empty-tenant 4-column upload affordance per §5.6.
describe('firstFourDatasetTiles', () => {
  it('returns four tiles in fixed order: organization, kpis, vendors, customer', () => {
    const tiles = firstFourDatasetTiles();
    expect(tiles.map((t) => t.id)).toEqual([
      'organization',
      'kpis',
      'vendors',
      'customer',
    ]);
  });

  it('each tile href pre-seeds the data-trust segment selector with a canonical segment slug', () => {
    const tiles = firstFourDatasetTiles();
    expect(tiles[0].href).toBe('/admin/data-trust?segment=org_structure');
    expect(tiles[1].href).toBe('/admin/data-trust?segment=kpi_dictionary');
    expect(tiles[2].href).toBe('/admin/data-trust?segment=vendor_contracts');
    expect(tiles[3].href).toBe('/admin/data-trust?segment=customer_signals');
  });
});

describe('<EmptyTenantUploadAffordance />', () => {
  it('renders 4 tiles in fixed order with the expected testids', () => {
    const html = renderToStaticMarkup(<EmptyTenantUploadAffordance />);
    expect(html).toContain('admin-empty-tenant-upload-affordance');
    const ids = ['organization', 'kpis', 'vendors', 'customer'];
    let lastIdx = -1;
    for (const id of ids) {
      const idx = html.indexOf(`admin-empty-tenant-tile-${id}`);
      expect(idx).toBeGreaterThan(-1);
      expect(idx).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });

  it('renders an Upload anchor per tile pointing at the canonical data-trust route', () => {
    const html = renderToStaticMarkup(<EmptyTenantUploadAffordance />);
    expect(html).toContain('admin-empty-tenant-upload-organization');
    expect(html).toContain('admin-empty-tenant-upload-kpis');
    expect(html).toContain('admin-empty-tenant-upload-vendors');
    expect(html).toContain('admin-empty-tenant-upload-customer');
    expect(html).toContain('href="/admin/data-trust?segment=org_structure"');
    expect(html).toContain('href="/admin/data-trust?segment=kpi_dictionary"');
    expect(html).toContain('href="/admin/data-trust?segment=vendor_contracts"');
    expect(html).toContain('href="/admin/data-trust?segment=customer_signals"');
  });

  it('honors a custom tiles override for branch reuse', () => {
    const html = renderToStaticMarkup(
      <EmptyTenantUploadAffordance
        tiles={[
          {
            id: 'foo',
            noun: 'Foo',
            descriptor: 'Custom tile.',
            href: '/admin/data-trust?segment=foo',
          },
        ]}
      />,
    );
    expect(html).toContain('admin-empty-tenant-tile-foo');
    expect(html).not.toContain('admin-empty-tenant-tile-organization');
  });
});
