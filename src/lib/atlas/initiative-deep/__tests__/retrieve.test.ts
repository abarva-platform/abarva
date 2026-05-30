// Wave-2 retrieval — happy-path coverage for getInitiativeDeepView.

import { getInitiativeDeepView } from '../retrieve';
import { mockClient } from '../_test-mock-client';

const APEX = { clientId: 'client-apex', userId: null };

function baseFixtures() {
  return {
    ai_initiatives: [
      {
        initiative_id: 'AR-02',
        client_id: 'client-apex',
        display_id: 'AR-02',
        name: 'Copilot for Retail Associates',
        description: 'Copilot rollout',
        primary_category_id: 'CAT-01',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 1_000_000,
        committed_total_usd: 3_000_000,
        measured_value_usd: 250_000,
        confidence_level: 'HIGH',
        status_summary: 'Pilot expanding to additional stores in Q3.',
      },
      // Peers — used by portfolio percentile.
      {
        initiative_id: 'AR-01',
        client_id: 'client-apex',
        display_id: 'AR-01',
        name: 'LLM Productivity',
        description: 'baseline',
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
        initiative_id: 'AR-03',
        client_id: 'client-apex',
        display_id: 'AR-03',
        name: 'Pricing AI',
        description: '',
        primary_category_id: 'CAT-05',
        stage: 'scaled',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 800_000,
        committed_total_usd: null,
        measured_value_usd: 100_000, // attainment 0.125
        confidence_level: 'MED',
        status_summary: null,
      },
      {
        initiative_id: 'AR-04',
        client_id: 'client-apex',
        display_id: 'AR-04',
        name: 'Fraud Scoring',
        description: '',
        primary_category_id: 'CAT-05',
        stage: 'scaled',
        owner_name: 'a',
        owner_title: 'b',
        committed_annual_usd: 600_000,
        committed_total_usd: null,
        measured_value_usd: 120_000, // attainment 0.2
        confidence_level: 'MED',
        status_summary: null,
      },
    ],
    ai_initiative_kpis: [
      {
        initiative_id: 'AR-02',
        kpi_name: 'Containment rate',
        kpi_unit: 'percent',
        quarter: '2026-Q1',
        kpi_value: 22,
        target_value: 30,
      },
      {
        initiative_id: 'AR-02',
        kpi_name: 'Containment rate',
        kpi_unit: 'percent',
        quarter: '2025-Q4',
        kpi_value: 18,
        target_value: 30,
      },
    ],
    clients: [{ id: 'client-apex', industry_code: 'RETAIL' }],
    engagements: [],
    signal_firings: [],
    tower_ai_tool_usage: [],
    tower_dora_metrics: [],
    phase_approvals: [],
    engagement_phases: [],
  } as Record<string, Record<string, unknown>[]>;
}

describe('getInitiativeDeepView (happy path)', () => {
  it('returns the core registry fields', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.initiativeId).toBe('AR-02');
    expect(view!.code).toBe('AR-02');
    expect(view!.name).toBe('Copilot for Retail Associates');
    expect(view!.archetypeKey).toBe('CAT-01');
    expect(view!.status).toBe('pilot');
    expect(view!.ownerLabel).toBe('Carlos Rivera · CIO');
  });

  it('rolls KPI history into baseline metrics, picking the latest quarter per KPI', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    const containment = view!.baselineMetrics.find((m) => m.key === 'containment_rate');
    expect(containment).toBeDefined();
    // 2026-Q1 wins lexicographically over 2025-Q4.
    expect(containment!.measured).toBe(22);
    expect(containment!.target).toBe(30);
    expect(containment!.unit).toBe('percent');
    expect(containment!.asOf).toBe('2026-Q1');
  });

  it('computes value attestation from measured vs committed', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.valueAttestation.measured).toBe(250_000);
    // 250k / 1M × 100 = 25
    expect(view!.valueAttestation.attainmentPct).toBe(25);
  });

  it('surfaces empty gates and signals honestly when no engagement is linked', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.gates.passed).toEqual([]);
    expect(view!.gates.upcoming).toBeNull();
    expect(view!.signals).toEqual([]);
  });

  it('computes within-tenant portfolio position from peers', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    // AR-02 attainment = 0.25; peers 0.1, 0.125, 0.2 — all strictly lower.
    // percentile = 3 / (3 + 1) × 100 = 75
    expect(view!.portfolioPosition.valueAttainmentPercentileInTenant).toBe(75);
    expect(view!.portfolioPosition.confidenceTier).toBe('medium');
  });

  it('builds evidence anchors only from real data', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('AR-02', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.evidenceAnchors.length).toBeGreaterThan(0);
    // First anchor is the status summary.
    expect(view!.evidenceAnchors[0].claim).toContain('Pilot expanding');
    // KPI anchor included.
    const kpiAnchor = view!.evidenceAnchors.find((a) => a.claim.includes('Containment rate'));
    expect(kpiAnchor).toBeDefined();
  });

  it('returns null for an initiative the tenant does not own', async () => {
    const client = mockClient(baseFixtures());
    const view = await getInitiativeDeepView('NON-EXISTENT', APEX, client);
    expect(view).toBeNull();
  });
});
