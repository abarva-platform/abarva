/**
 * /admin landing · DOM order smoke · Wave 1 PR-5.
 *
 * Pins the verdict §5.6 layout invariant: the Trust strip is rendered
 * AHEAD of the Action queue in the document order. The rest of the
 * page evolves; this assertion does not.
 *
 * If a future PR moves the strip below the queue or removes it from
 * /admin, this test fails loudly — that's by design. The strip is
 * the pivotal screen; its position is load-bearing.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { HomeOverviewV2 } from '../HomeOverviewV2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';
import type { HomeOverviewV2Extras } from '@/lib/admin/home-overview-v2';
import type { TrustStripChip } from '@/components/admin/TrustStrip';
import type { PostureCard } from '@/components/admin/PostureGrid';

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
    },
    actionQueue: {
      items: [
        {
          id: 'aq-1',
          label: 'Approve CDP program brief',
          consequence: 'Phase 6 blocked until approval lands.',
          panelLabel: 'Approvals',
          href: '/home/queue',
          severity: 'high',
        },
      ],
      totalPending: 1,
    },
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

function fixtureChips(): TrustStripChip[] {
  return [
    {
      id: 'substrate',
      noun: 'Substrate',
      metric: { value: '11', label: 'mature / 3 sparse' },
      status: 'attention',
      evidence: 'live',
      href: '/admin/data-trust',
    },
    {
      id: 'isolation',
      noun: 'Isolation',
      metric: { value: '0', label: 'anomalies 24h' },
      status: 'ready',
      evidence: 'estimated',
      href: '/admin/audit',
    },
    {
      id: 'integrations',
      noun: 'Integrations',
      metric: { value: '0', label: 'connectors' },
      status: 'ready',
      evidence: 'estimated',
      href: '/admin/connectors',
    },
    {
      id: 'governance',
      noun: 'Governance',
      metric: { value: '2', label: 'approvals pending' },
      status: 'attention',
      evidence: 'live',
      href: '/home/queue',
    },
  ];
}

function fixturePostureCards(): PostureCard[] {
  return [
    {
      id: 'substrate',
      noun: 'Substrate readiness',
      descriptor: 'Segment coverage and depth of ingest.',
      stat: '11 mature / 3 sparse',
      footer: 'Load KPI dictionary to unlock causal reasoning.',
      status: 'attention',
      href: '/admin/data-trust',
    },
    {
      id: 'connector',
      noun: 'Connector health',
      descriptor: 'Live integrations and last successful pull.',
      stat: '5 live / 1 degraded',
      footer: 'Salesforce — re-auth.',
      status: 'attention',
      href: '/admin/connectors',
    },
    {
      id: 'isolation',
      noun: 'Auth & RLS posture',
      descriptor: 'Tenant isolation, RLS coverage, anomaly count.',
      stat: '0 anomalies 24h · RLS 96%',
      footer: 'No anomalies in 24h.',
      status: 'ready',
      href: '/admin/audit?tab=isolation',
    },
    {
      id: 'approvals',
      noun: 'Approvals & policy',
      descriptor: 'Pending decisions, invites, and SSO posture.',
      stat: '2 pending · 3 invites',
      footer: 'SSO configured.',
      status: 'attention',
      href: '/admin/programs/approvals',
    },
  ];
}

describe('/admin HomeOverviewV2 DOM order', () => {
  it('renders the Trust strip BEFORE the Action queue', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
      />,
    );
    const stripIdx = html.indexOf('data-testid="admin-trust-strip"');
    const queueIdx = html.indexOf('WHAT NEEDS YOU TODAY');
    expect(stripIdx).toBeGreaterThan(-1);
    expect(queueIdx).toBeGreaterThan(-1);
    expect(stripIdx).toBeLessThan(queueIdx);
  });

  it('renders the Action queue BEFORE the Steward orientation block (operator-first)', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
      />,
    );
    const queueIdx = html.indexOf('WHAT NEEDS YOU TODAY');
    const stewardIdx = html.indexOf('STEWARD VOICE');
    expect(queueIdx).toBeGreaterThan(-1);
    expect(stewardIdx).toBeGreaterThan(-1);
    expect(queueIdx).toBeLessThan(stewardIdx);
  });

  it('does NOT render the unconditional "Substrate live" pill when liveSnapshotPresent is false', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={false}
      />,
    );
    expect(html).not.toContain('Substrate live');
  });

  it('renders the "Substrate live" pill when liveSnapshotPresent is true', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
      />,
    );
    expect(html).toContain('Substrate live');
  });

  it('omits the Trust strip block entirely when trustChips is null', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={null}
        liveSnapshotPresent={true}
      />,
    );
    expect(html).not.toContain('data-testid="admin-trust-strip"');
  });

  it('renders the Posture grid BETWEEN the Action queue and the Steward orientation block (Wave 2 PR-4)', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
        postureCards={fixturePostureCards()}
      />,
    );
    const queueIdx = html.indexOf('WHAT NEEDS YOU TODAY');
    const gridIdx = html.indexOf('data-testid="admin-posture-grid"');
    const stewardIdx = html.indexOf('STEWARD VOICE');
    expect(queueIdx).toBeGreaterThan(-1);
    expect(gridIdx).toBeGreaterThan(-1);
    expect(stewardIdx).toBeGreaterThan(-1);
    expect(queueIdx).toBeLessThan(gridIdx);
    expect(gridIdx).toBeLessThan(stewardIdx);
  });

  it('omits the Posture grid block when postureCards is null', () => {
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
        postureCards={null}
      />,
    );
    expect(html).not.toContain('data-testid="admin-posture-grid"');
    expect(html).not.toContain('POSTURE AT A GLANCE');
  });

  it('no longer renders the 64×64 brand-initials avatar tile', () => {
    // The deleted avatar block had width/height: 64 in inline styles
    // on a <span> with the tenant initials. We assert the tenant
    // initials "AR" do not appear inside a 64×64 styled element.
    const html = renderToStaticMarkup(
      <HomeOverviewV2
        tenantName="Apex Retail Group"
        clientKey="apexretail"
        blocks={fixtureBlocks()}
        extras={fixtureExtras()}
        trustChips={fixtureChips()}
        liveSnapshotPresent={true}
      />,
    );
    // The pre-PR-5 masthead emitted width:64px;height:64px on the
    // brand tile. The Trust strip uses 56px chip height, not 64.
    expect(html).not.toContain('width:64px;height:64px');
  });
});
