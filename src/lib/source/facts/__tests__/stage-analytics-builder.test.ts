// The stage builder composes a LIVE StageAnalyticsView end-to-end from committed
// facts: real AMS value-lever rules → deterministic evaluators → cited waterfall.
// Under test: enough facts → a live view whose waterfall is quantified + cited;
// too-thin facts → null (route then shows the honestly-marked sample); the intel
// beat is marked live; insufficient levers surface as needs-evidence bands.

import {
  buildLiveStageView,
  resolveValueArchetype,
} from '../view/stage-analytics-builder';
import { quantifiedRollup } from '../view/waterfall-view-adapter';
import type { FactSourceCitation } from '../fact-types';

const ARCHETYPE_ID = 'AMS_MANAGED_SERVICES';

/** Facts that satisfy the ENHANCEMENT_LEAKAGE lever (and only that one fully). */
const LEAKAGE_INPUTS = {
  annual_change_order_spend: 1_000_000,
  recurring_avoidable_pct: 20,
  term_years: 3,
};

const LEAKAGE_CITATIONS: Record<string, FactSourceCitation | null> = {
  annual_change_order_spend: {
    doc: 'Incumbent AMS contract',
    locator: 'Exhibit C',
  },
  recurring_avoidable_pct: {
    doc: 'ServiceNow export',
    locator: 'recurring share',
  },
  term_years: { doc: 'Vendor proposal', locator: 'term' },
};

describe('resolveValueArchetype', () => {
  it('resolves authored rules only for the event archetype', () => {
    expect(resolveValueArchetype('ams')?.id).toBe(ARCHETYPE_ID);
    expect(resolveValueArchetype(null)).toBeNull();
    expect(resolveValueArchetype('nonexistent')).toBeNull();
  });

  it('fails closed when a resolved archetype has no deterministic rules', () => {
    expect(resolveValueArchetype('software', 'data_ai_platform')).toBeNull();
  });

  it('never overrides a governed classifier result with a different event-type pack', () => {
    expect(resolveValueArchetype('managed_service', 'data_ai_platform')).toBeNull();
  });

  it('resolves the authored Cloud FinOps pack from the classified category', () => {
    expect(resolveValueArchetype('infrastructure', 'cloud_finops')?.id).toBe(
      'CLOUD_FINOPS',
    );
  });

  it('resolves Contract Renewal only from its governed classified category', () => {
    expect(resolveValueArchetype('managed_service', 'saas_renewal')?.id).toBe(
      'CONTRACT_RENEWAL',
    );
  });
});

describe('buildLiveStageView', () => {
  it('builds a LIVE stage view when at least one lever computes', () => {
    const view = buildLiveStageView({
      inputs: LEAKAGE_INPUTS,
      citations: LEAKAGE_CITATIONS,
      archetypeId: ARCHETYPE_ID,
      baselineLabel: 'Value at stake',
      baselineAmount: 14_000_000,
      stageKey: 'scope',
    });
    expect(view).not.toBeNull();
    expect(view!.waterfall).toBeDefined();
    expect(view!.waterfall!.provenance).toBe('live');
    expect(view!.intel.provenance).toBe('live');

    // The leakage lever computed and is cited from a committed fact.
    const leakage = view!.waterfall!.bands.find(
      (b) => b.id === 'wf.AMS.ENHANCEMENT_LEAKAGE',
    )!;
    expect(leakage.state).toBe('quantified');
    expect(leakage.amountHigh).toBeGreaterThan(0);
    expect(leakage.citation).not.toBeNull();

    // Levers without evidence surface as needs-evidence, never as $0 findings.
    const insufficient = view!.waterfall!.bands.filter(
      (b) => b.state === 'insufficient_evidence',
    );
    expect(insufficient.length).toBeGreaterThan(0);
    for (const band of insufficient) {
      expect(band.citation).toBeNull();
    }

    // The roll-up counts only quantified bands.
    const roll = quantifiedRollup(view!.waterfall!.bands);
    expect(roll.quantifiedBandCount).toBeGreaterThanOrEqual(1);
    expect(roll.high).toBeGreaterThan(0);
  });

  it('returns null when no lever can be computed (route falls back to sample)', () => {
    const view = buildLiveStageView({
      inputs: {},
      citations: {},
      archetypeId: ARCHETYPE_ID,
    });
    expect(view).toBeNull();
  });

  it('builds Cloud FinOps analytics without evaluating AMS rules', () => {
    const view = buildLiveStageView({
      inputs: {
        annual_eligible_cloud_spend: 10_000_000,
        uncovered_commitment_pct: 40,
        benchmark_commitment_discount_pct: 25,
        term_years: 1,
      },
      citations: {},
      eventType: 'infrastructure',
      classifiedCategory: 'cloud_finops',
      stageKey: 'pricing',
    });
    expect(view).not.toBeNull();
    expect(view!.intel.points.find((point) => point.tag === 'Archetype')?.text).toContain(
      'Cloud / Infrastructure / FinOps',
    );
    expect(view!.waterfall!.bands.some((band) => band.id.includes('CLOUD.'))).toBe(
      true,
    );
    expect(view!.waterfall!.bands.some((band) => band.id.includes('AMS.'))).toBe(
      false,
    );
  });
});
