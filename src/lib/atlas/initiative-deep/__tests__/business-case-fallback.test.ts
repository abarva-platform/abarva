// Honest null when the kernel cannot compute a business case for the
// initiative — the second honesty-contract invariant.
//
// The expert kernel binds a Move to a curated Domain Function Pack via
// `bindMoveFunctionPack`. When no industry code (or function pack key)
// resolves a pack, the kernel returns `bound: false` and the deep view's
// `businessCaseSkeleton` MUST be `null`. We surface that honest dead-end —
// never a fabricated verdict, never invented kill criteria.

import { getInitiativeDeepView } from '../retrieve';
import { mockClient } from '../_test-mock-client';

const APEX = { clientId: 'client-apex', userId: null };

function fixturesWithMissingIndustry() {
  return {
    ai_initiatives: [
      {
        initiative_id: 'AR-77',
        client_id: 'client-apex',
        display_id: 'AR-77',
        name: 'Highly speculative AI initiative',
        description: 'No curated pack covers this niche.',
        primary_category_id: 'CAT-03',
        stage: 'pilot',
        owner_name: 'Carlos Rivera',
        owner_title: 'CIO',
        committed_annual_usd: 500_000,
        committed_total_usd: null,
        measured_value_usd: null,
        confidence_level: 'LOW',
        status_summary: 'No baseline metrics recorded yet.',
      },
    ],
    ai_initiative_kpis: [],
    // No industry_code on the tenant — kernel cannot resolve a pack.
    clients: [{ id: 'client-apex', industry_code: null }],
    engagements: [],
    signal_firings: [],
    tower_ai_tool_usage: [],
    tower_dora_metrics: [],
    phase_approvals: [],
    engagement_phases: [],
  } as Record<string, Record<string, unknown>[]>;
}

describe('business-case fallback — honest null when kernel cannot compute', () => {
  it('returns businessCaseSkeleton: null when no industry code resolves a pack', async () => {
    const client = mockClient(fixturesWithMissingIndustry());
    const view = await getInitiativeDeepView('AR-77', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.businessCaseSkeleton).toBeNull();
  });

  it('returns valueAttestation.projectedRange: null when the kernel did not run', async () => {
    const client = mockClient(fixturesWithMissingIndustry());
    const view = await getInitiativeDeepView('AR-77', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.valueAttestation.projectedRange).toBeNull();
  });

  it('valueAttestation.attainmentPct is null when measured value is missing', async () => {
    const client = mockClient(fixturesWithMissingIndustry());
    const view = await getInitiativeDeepView('AR-77', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.valueAttestation.measured).toBeNull();
    expect(view!.valueAttestation.attainmentPct).toBeNull();
    // Confidence downgrades when measured + committed are missing.
    expect(view!.valueAttestation.confidenceTier).toBe('low');
  });

  it('portfolioPosition is null when there are too few peer initiatives', async () => {
    const client = mockClient(fixturesWithMissingIndustry());
    const view = await getInitiativeDeepView('AR-77', APEX, client);
    expect(view).not.toBeNull();
    expect(view!.portfolioPosition.valueAttainmentPercentileInTenant).toBeNull();
    expect(view!.portfolioPosition.confidenceTier).toBe('low');
  });
});
