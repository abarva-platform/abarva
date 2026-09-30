// P0 invariant — getInitiativeDeepView NEVER returns cross-tenant data.
//
// Same shape as the Atlas synthesis-route Fix A invariant: construct a
// Meridian initiative AND an Apex initiative, call getInitiativeDeepView
// with the Meridian id + Meridian tenancy, and assert that zero Apex data
// appears in the result. Then reverse the pair — Apex id + Apex tenancy
// must not surface Meridian content either.

import { getInitiativeDeepView } from '../retrieve';
import { mockClient } from '../_test-mock-client';
import { CANONICAL_TENANT_KEYS, LEGACY_TENANT_ALIASES } from '@/lib/tenant/aliases';

const MERIDIAN = { clientId: 'client-meridian', userId: null };
const APEX = { clientId: 'client-apex', userId: null };

function twoTenantFixtures() {
  return {
    ai_initiatives: [
      {
        initiative_id: 'MR-01',
        client_id: 'client-meridian',
        display_id: 'MR-01',
        name: 'Ambient Clinical Documentation (Abridge)',
        description: 'Meridian-only — clinical documentation',
        primary_category_id: 'CAT-07',
        stage: 'pilot',
        owner_name: 'Dr Alex Chen',
        owner_title: 'CMIO',
        committed_annual_usd: 4_000_000,
        committed_total_usd: null,
        measured_value_usd: 1_200_000,
        confidence_level: 'HIGH',
        status_summary: 'Abridge rollout to 8 hospitals.',
      },
      {
        initiative_id: 'AR-02',
        client_id: 'client-apex',
        display_id: 'AR-02',
        name: 'Copilot for Retail Associates',
        description: 'Apex-only — retail associate copilot',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 1_000_000,
        committed_total_usd: null,
        measured_value_usd: 250_000,
        confidence_level: 'HIGH',
        status_summary: 'Pilot in 40 retail locations.',
      },
    ],
    ai_initiative_kpis: [
      {
        initiative_id: 'MR-01',
        kpi_name: 'Note-completion time saved',
        kpi_unit: 'minutes per encounter',
        quarter: '2026-Q1',
        kpi_value: 4.2,
        target_value: 5,
      },
      {
        initiative_id: 'AR-02',
        kpi_name: 'Associate task completion',
        kpi_unit: 'percent',
        quarter: '2026-Q1',
        kpi_value: 88,
        target_value: 92,
      },
    ],
    clients: [
      { id: 'client-meridian', industry_code: 'HEALTHCARE' },
      { id: 'client-apex', industry_code: 'RETAIL' },
    ],
    engagements: [],
    signal_firings: [],
    tower_ai_tool_usage: [],
    tower_dora_metrics: [],
    phase_approvals: [],
    engagement_phases: [],
  } as Record<string, Record<string, unknown>[]>;
}

function rendered(view: unknown): string {
  return JSON.stringify(view ?? {});
}

describe('tenant scoping — P0 invariant', () => {
  it('Meridian tenancy returns Meridian data only — no Apex content leaks', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('MR-01', MERIDIAN, client);
    expect(view).not.toBeNull();
    const blob = rendered(view);
    expect(blob).toContain('Abridge');
    // Apex-only tokens must not appear anywhere in the result.
    expect(blob).not.toContain('Copilot for Retail Associates');
    expect(blob).not.toContain('Carlos Rivera');
    expect(blob).not.toContain('AR-02');
    expect(blob).not.toContain('Associate task completion');
  });

  it('Apex tenancy returns Apex data only — no Meridian content leaks', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    const blob = rendered(view);
    expect(blob).toContain('Copilot for Retail Associates');
    expect(blob).not.toContain('Abridge');
    expect(blob).not.toContain('Dr Alex Chen');
    expect(blob).not.toContain('MR-01');
    expect(blob).not.toContain('Note-completion time saved');
  });

  it('Meridian tenancy passed an Apex initiative id returns null — no row crossing', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('AR-02', MERIDIAN, client);
    expect(view).toBeNull();
  });

  it('Apex tenancy passed a Meridian initiative id returns null — no row crossing', async () => {
    const client = mockClient(twoTenantFixtures());
    const view = await getInitiativeDeepView('MR-01', APEX, client);
    expect(view).toBeNull();
  });

  it('portfolio percentile uses ONLY the caller-tenant initiatives', async () => {
    const fx = twoTenantFixtures();
    // Add Apex peers AND Meridian peers to confirm cross-tenant rows do not
    // contaminate the percentile distribution.
    fx.ai_initiatives.push(
      {
        initiative_id: 'AR-99',
        client_id: 'client-apex',
        display_id: 'AR-99',
        name: 'Apex peer A',
        description: '',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 500_000,
        committed_total_usd: null,
        measured_value_usd: 50_000, // attainment 0.1
        confidence_level: 'MED',
        status_summary: null,
      },
      {
        initiative_id: 'AR-98',
        client_id: 'client-apex',
        display_id: 'AR-98',
        name: 'Apex peer B',
        description: '',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 1_000_000,
        committed_total_usd: null,
        measured_value_usd: 150_000, // attainment 0.15
        confidence_level: 'MED',
        status_summary: null,
      },
      // Meridian initiative with an absurdly high attainment — if the percentile
      // computation leaks across tenants this WILL change Apex's result.
      {
        initiative_id: 'MR-99',
        client_id: 'client-meridian',
        display_id: 'MR-99',
        name: 'Meridian high attainment',
        description: '',
        primary_category_id: 'CAT-07',
        stage: 'scaled',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 100_000,
        committed_total_usd: null,
        measured_value_usd: 9_999_999, // attainment ≫ 1; would dominate
        confidence_level: 'HIGH',
        status_summary: null,
      },
    );
    const client = mockClient(fx);
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    // AR-02 attainment = 0.25; Apex peers AR-99 (0.1) and AR-98 (0.15) both lower.
    // If Meridian's MR-99 (attainment 99.99) leaked in, this would be ~33, not 66/67.
    expect(view!.portfolioPosition.valueAttainmentPercentileInTenant).toBe(67);
  });

  // Every read the view makes, seeded for BOTH tenants with a marker per
  // carrier. Each carrier is asserted on its own: a sibling carrier cannot
  // satisfy it, and the own-tenant marker must be present so an empty join
  // cannot pass as a fenced one.
  function everyCarrierFixtures(): Record<string, Record<string, unknown>[]> {
    const fx = twoTenantFixtures();
    const tenants = [
      { clientId: 'client-meridian', initiativeId: 'MR-01', tag: 'MER' },
      { clientId: 'client-apex', initiativeId: 'AR-02', tag: 'APX' },
    ];
    fx.clients = tenants.map((t) => ({ id: t.clientId, industry_code: `IND_${t.tag}` }));
    // Each tenant also holds a hostile engagement tagged with the OTHER
    // tenant's initiative id, listed first so an unfenced lookup takes it.
    // Only the client_id fence stands between the caller and those gates.
    const engagementsOf = (t: (typeof tenants)[number], index: number) => [
      { id: `eng-${t.tag}`, initiativeId: t.initiativeId, tag: t.tag },
      { id: `eng-collide-${t.tag}`, initiativeId: tenants[1 - index].initiativeId, tag: t.tag },
    ];
    const allEngagements = tenants.flatMap((t, index) =>
      engagementsOf(t, index).map((e) => ({ ...e, clientId: t.clientId })),
    );
    fx.engagements = [
      ...allEngagements.filter((e) => e.id.startsWith('eng-collide-')),
      ...allEngagements.filter((e) => !e.id.startsWith('eng-collide-')),
    ].map((e) => ({
      id: e.id,
      client_id: e.clientId,
      name: `Engagement ${e.tag}`,
      current_phase: 'build',
      metadata: { initiative_id: e.initiativeId },
    }));
    fx.phase_approvals = allEngagements.map((e) => ({
      engagement_id: e.id,
      phase_id: `ph-${e.id}`,
      approved_at: '2026-01-15T00:00:00Z',
      approver_role: `Approver ${e.tag}`,
      phase_name: `Passed gate ${e.tag}`,
      phase_index: 1,
    }));
    fx.engagement_phases = allEngagements.map((e) => ({
      id: `next-${e.id}`,
      engagement_id: e.id,
      phase_index: 2,
      phase_name: `Upcoming gate ${e.tag}`,
      due_by: '2026-06-30',
      status: 'pending',
    }));
    fx.signal_firings = tenants.flatMap((t, index) => [
      // Stray row: this tenant's signal pointing at the OTHER tenant's
      // engagement. Only the client_id fence on the engagement read drops it.
      {
        id: `sig-stray-${t.tag}`,
        client_id: t.clientId,
        engagement_id: `eng-${tenants[1 - index].tag}`,
        severity: 'high',
        headline: `Stray signal ${t.tag}`,
        state: 'actioned',
        fired_at: '2026-02-03T00:00:00Z',
      },
      {
        id: `sig-eng-${t.tag}`,
        client_id: t.clientId,
        engagement_id: `eng-${t.tag}`,
        severity: 'high',
        headline: `Engagement signal ${t.tag}`,
        state: 'actioned',
        fired_at: '2026-02-01T00:00:00Z',
      },
      {
        id: `sig-portfolio-${t.tag}`,
        client_id: t.clientId,
        engagement_id: null,
        severity: 'medium',
        headline: `Portfolio signal ${t.tag}`,
        state: 'new',
        fired_at: '2026-02-02T00:00:00Z',
      },
    ]);
    fx.tower_ai_tool_usage = tenants.map((t) => ({
      client_id: t.clientId,
      tool_name: `Tool${t.tag}`,
      active_users: 10,
      license_count: 20,
      observed_at: '2026-03-01T00:00:00Z',
    }));
    // DORA surfaces numbers only, so the marker is the value itself.
    fx.tower_dora_metrics = tenants.map((t, index) => ({
      client_id: t.clientId,
      deploy_frequency_per_week: index === 0 ? 111 : 777,
      lead_time_hours: null,
      change_failure_rate_pct: null,
      mttr_hours: null,
      observed_at: '2026-03-01T00:00:00Z',
    }));
    return fx;
  }

  type Carrier = { name: string; marker: (tag: 'MER' | 'APX') => (view: unknown) => boolean };
  const carriers: Carrier[] = [
    {
      name: 'gates.passed (phase_approvals via engagements)',
      marker: (tag) => (view) =>
        (view as { gates: { passed: { name: string }[] } }).gates.passed.some(
          (gate) => gate.name === `Passed gate ${tag}`,
        ),
    },
    {
      name: 'gates.upcoming (engagement_phases via engagements)',
      marker: (tag) => (view) =>
        (view as { gates: { upcoming: { name: string } | null } }).gates.upcoming?.name ===
        `Upcoming gate ${tag}`,
    },
    {
      name: 'signals, engagement-scoped read',
      marker: (tag) => (view) =>
        (view as { signals: { signalId: string }[] }).signals.some(
          (signal) => signal.signalId === `sig-eng-${tag}` || signal.signalId === `sig-stray-${tag}`,
        ),
    },
    {
      name: 'signals, portfolio backfill read',
      marker: (tag) => (view) =>
        (view as { signals: { signalId: string }[] }).signals.some(
          (signal) => signal.signalId === `sig-portfolio-${tag}`,
        ),
    },
    {
      name: 'baselineMetrics from tower_ai_tool_usage',
      marker: (tag) => (view) =>
        (view as { baselineMetrics: { label: string }[] }).baselineMetrics.some(
          (metric) => metric.label === `Tool${tag} active users`,
        ),
    },
    {
      name: 'baselineMetrics from tower_dora_metrics',
      marker: (tag) => (view) =>
        (view as { baselineMetrics: { key: string; measured: number | null }[] }).baselineMetrics.some(
          (metric) =>
            metric.key === 'tower_dora_metrics.deploy_frequency_per_week' &&
            metric.measured === (tag === 'MER' ? 111 : 777),
        ),
    },
  ];

  const pairs = [
    { name: 'Meridian caller', id: 'MR-01', tenancy: MERIDIAN, own: 'MER', other: 'APX' },
    { name: 'Apex caller', id: 'AR-02', tenancy: APEX, own: 'APX', other: 'MER' },
  ] as const;

  for (const pair of pairs) {
    for (const carrier of carriers) {
      it(`${pair.name}: ${carrier.name} carries only the caller tenant's rows`, async () => {
        const view = await getInitiativeDeepView(pair.id, pair.tenancy, mockClient(everyCarrierFixtures()));
        expect(view).not.toBeNull();
        expect({
          carrier: carrier.name,
          own: carrier.marker(pair.own)(view),
          other: carrier.marker(pair.other)(view),
        }).toEqual({ carrier: carrier.name, own: true, other: false });
      });
    }
  }

  it('reads the industry code of the caller tenant only', async () => {
    // The industry code feeds the kernel business case and is not echoed in
    // the view, so the probe records which `clients` row the view asked for.
    const fx = everyCarrierFixtures();
    const base = mockClient(fx);
    const asked: unknown[] = [];
    const spying = {
      from(table: string) {
        const builder = base.from(table) as unknown as Record<string, (...args: unknown[]) => unknown>;
        if (table !== 'clients') return builder;
        const eq = builder.eq;
        builder.eq = (col: unknown, val: unknown) => {
          if (col === 'id') asked.push(val);
          return eq(col, val);
        };
        return builder;
      },
    } as unknown as typeof base;
    await getInitiativeDeepView('AR-02', APEX, spying);
    expect(asked).toEqual(['client-apex']);
  });

  // The byte scan this replaces asked whether a tenant key is written into the
  // module. What matters is whether one changes its behaviour, so ask that: the
  // same data under a tenant key and under a neutral one must produce the same
  // view, whether the key is special-cased or used as a literal filter. The
  // keys come from code, canonical and legacy alike, never a typed list.
  const tenantKeys = [...new Set([...CANONICAL_TENANT_KEYS, ...LEGACY_TENANT_ALIASES])];

  it.each(tenantKeys)(
    'treats tenant key %s exactly like a neutral key',
    async (tenantKey) => {
      const relabel = (from: string, to: string) => {
        const fx = everyCarrierFixtures();
        for (const rows of Object.values(fx)) {
          for (const row of rows) {
            if (row.client_id === from) row.client_id = to;
            if (row.id === from) row.id = to;
          }
        }
        return fx;
      };
      const named = await getInitiativeDeepView(
        'MR-01',
        { clientId: tenantKey, userId: null },
        mockClient(relabel('client-meridian', tenantKey)),
      );
      const neutral = await getInitiativeDeepView(
        'MR-01',
        { clientId: 'tenant-neutral', userId: null },
        mockClient(relabel('client-meridian', 'tenant-neutral')),
      );
      expect(neutral).not.toBeNull();
      expect(named).toEqual(neutral);
    },
  );
});
