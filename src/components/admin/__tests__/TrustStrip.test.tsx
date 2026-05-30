/**
 * TrustStrip · Wave 1 PR-5 unit tests.
 *
 * Pins the four-state render contract from verdict §5.6:
 *   - ready: filled dot, ink/body label
 *   - attention: amber dot, amber label
 *   - breach: red dot, red label
 *   - estimated: hollow dot, muted label, "(estimated)" suffix
 *
 * Also pins `spineToChips`:
 *   - Composes the four-chip array in fixed order from a TrustSpine.
 *   - Falls through to the empty-state shape when substrate is empty.
 *   - Honours the broker's `evidence` flag — does not lie about live
 *     vs estimated.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import {
  TrustStrip,
  spineToChips,
  type TrustStripChip,
} from '../TrustStrip';
import type { TrustSpine } from '@/lib/admin/broker/trust-spine-broker';

function chip(overrides: Partial<TrustStripChip> = {}): TrustStripChip {
  return {
    id: 'substrate',
    noun: 'Substrate',
    metric: { value: '11', label: 'mature / 3 sparse' },
    status: 'ready',
    evidence: 'live',
    href: '/admin/data-trust',
    ...overrides,
  };
}

function spine(overrides: Partial<TrustSpine> = {}): TrustSpine {
  const base: TrustSpine = {
    substrate: {
      segmentsTotal: 14,
      mature: 11,
      sparse: 3,
      missing: 0,
      lastIngestIso: '2026-05-29T00:00:00Z',
      topSparseSegment: null,
      evidence: 'live',
    },
    isolation: {
      rlsCoveragePct: 100,
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
      openApprovals: 2,
      policyDriftCount: 0,
      openInvites: 0,
      evidence: 'live',
    },
    audit: { last24hEvents: [] },
    refreshedAtIso: '2026-05-30T00:00:00Z',
    tenantKey: 'apex-retail',
  };
  return { ...base, ...overrides };
}

describe('TrustStrip · render contract', () => {
  it('renders one anchor per chip with the chip noun, metric and href', () => {
    const html = renderToStaticMarkup(
      <TrustStrip
        chips={[
          chip({ id: 'substrate' }),
          chip({ id: 'isolation', noun: 'Isolation', metric: { value: '0', label: 'anomalies 24h' }, evidence: 'estimated', href: '/admin/audit' }),
          chip({ id: 'integrations', noun: 'Integrations', metric: { value: '1', label: 'degraded' }, status: 'attention', evidence: 'estimated', href: '/admin/connectors' }),
          chip({ id: 'governance', noun: 'Governance', metric: { value: '2', label: 'approvals pending' }, status: 'attention', href: '/home/queue' }),
        ]}
      />,
    );
    expect(html).toContain('data-testid="admin-trust-strip"');
    expect(html).toContain('data-chip-id="substrate"');
    expect(html).toContain('data-chip-id="isolation"');
    expect(html).toContain('data-chip-id="integrations"');
    expect(html).toContain('data-chip-id="governance"');
    expect(html).toContain('href="/admin/data-trust"');
    expect(html).toContain('href="/admin/audit"');
    expect(html).toContain('href="/admin/connectors"');
    expect(html).toContain('href="/home/queue"');
    expect(html).toContain('Substrate');
    expect(html).toContain('Isolation');
    expect(html).toContain('Integrations');
    expect(html).toContain('Governance');
    expect(html).toContain('mature / 3 sparse');
    expect(html).toContain('approvals pending');
  });

  it('marks each chip with its status and evidence for downstream selectors', () => {
    const html = renderToStaticMarkup(
      <TrustStrip
        chips={[
          chip({ status: 'ready', evidence: 'live' }),
          chip({ id: 'isolation', noun: 'Isolation', status: 'attention', evidence: 'estimated' }),
          chip({ id: 'integrations', noun: 'Integrations', status: 'breach', evidence: 'live' }),
          chip({ id: 'governance', noun: 'Governance', status: 'ready', evidence: 'estimated' }),
        ]}
      />,
    );
    expect(html).toContain('data-chip-status="ready"');
    expect(html).toContain('data-chip-status="attention"');
    expect(html).toContain('data-chip-status="breach"');
    expect(html).toContain('data-chip-evidence="live"');
    expect(html).toContain('data-chip-evidence="estimated"');
  });

  it('marks estimated chips with a visible "(estimated)" suffix', () => {
    const html = renderToStaticMarkup(
      <TrustStrip chips={[chip({ evidence: 'estimated' })]} />,
    );
    expect(html).toContain('(estimated)');
  });

  it('does NOT show "(estimated)" on a live chip', () => {
    const html = renderToStaticMarkup(
      <TrustStrip chips={[chip({ evidence: 'live' })]} />,
    );
    expect(html).not.toContain('(estimated)');
  });
});

describe('spineToChips', () => {
  it('returns substrate, isolation, integrations, governance in that fixed order', () => {
    const chips = spineToChips(spine());
    expect(chips.map((c) => c.id)).toEqual([
      'substrate',
      'isolation',
      'integrations',
      'governance',
    ]);
  });

  it('decomposes substrate "11 mature / 3 sparse" with the live flag', () => {
    const chips = spineToChips(spine());
    const substrate = chips[0]!;
    expect(substrate.metric.value).toBe('11');
    expect(substrate.metric.label).toBe('mature / 3 sparse');
    expect(substrate.status).toBe('attention'); // 3 sparse → attention
    expect(substrate.evidence).toBe('live');
    expect(substrate.href).toBe('/admin/data-trust');
  });

  it('marks isolation chip as estimated per broker evidence', () => {
    const chips = spineToChips(spine());
    const isolation = chips[1]!;
    expect(isolation.evidence).toBe('estimated');
    expect(isolation.status).toBe('ready'); // 0 anomalies
    expect(isolation.metric.label).toBe('anomalies 24h');
  });

  it('routes the isolation chip to the dedicated lane (Wave 2 PR-2)', () => {
    // Verdict §4 / §5.6: isolation chip click destination is the
    // dedicated lane, not the activity tab. STRESS-P0-006 triage.
    const chips = spineToChips(spine());
    expect(chips[1]!.href).toBe('/admin/audit?tab=isolation');
  });

  it('routes the empty-state isolation chip to the lane as well', () => {
    const empty = spineToChips(
      spine({
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
    );
    expect(empty[1]!.href).toBe('/admin/audit?tab=isolation');
  });

  it('routes governance to /home/queue when open approvals > 0, else users-access', () => {
    const open = spineToChips(spine({ governance: { ...spine().governance, openApprovals: 2 } }))[3]!;
    expect(open.href).toBe('/home/queue');
    expect(open.status).toBe('attention');

    const empty = spineToChips(spine({ governance: { ...spine().governance, openApprovals: 0 } }))[3]!;
    expect(empty.href).toBe('/admin/users-access');
    expect(empty.status).toBe('ready');
  });

  it('escalates governance to breach when more than two approvals are pending', () => {
    const chips = spineToChips(
      spine({ governance: { ...spine().governance, openApprovals: 5 } }),
    );
    expect(chips[3]!.status).toBe('breach');
  });

  it('escalates substrate to attention when any segments are missing', () => {
    const chips = spineToChips(
      spine({
        substrate: {
          segmentsTotal: 14,
          mature: 10,
          sparse: 0,
          missing: 4,
          lastIngestIso: null,
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    );
    expect(chips[0]!.status).toBe('attention');
  });

  it('returns four "no data yet" chips on an empty substrate', () => {
    const chips = spineToChips(
      spine({
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
    );
    expect(chips).toHaveLength(4);
    for (const c of chips) {
      expect(c.metric.label).toBe('no data yet');
      expect(c.evidence).toBe('estimated');
    }
  });

  it('uses the degraded count when any connector is degraded', () => {
    const chips = spineToChips(
      spine({
        integration: {
          connectorsTotal: 4,
          connectorsLive: 3,
          connectorsDegraded: 1,
          lastPullIso: null,
          topDegraded: null,
          evidence: 'live',
        },
      }),
    );
    const integrations = chips[2]!;
    expect(integrations.metric.value).toBe('1');
    expect(integrations.metric.label).toBe('degraded');
    expect(integrations.status).toBe('attention');
  });
});
