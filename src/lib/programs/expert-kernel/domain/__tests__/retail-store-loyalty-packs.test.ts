// Retail Function Packs — store operations and customer loyalty &
// personalization.
//
// These two packs extend the retail vertical beyond the margin-and-mix spine
// (spec §3). This suite asserts each one meets the §6 depth bar
// (FUNCTION_PACK_DEPTH_MINIMUMS), is reachable through resolveFunctionPack,
// and carries the named operating metrics and AI use-case archetypes the
// build task specified.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from '../function-pack-types';
import {
  checkFunctionPackDepth,
  resolveFunctionPack,
} from '../function-pack-registry';
import { storeOperationsPack } from '../retail/store-operations';
import { customerLoyaltyPersonalizationPack } from '../retail/customer-loyalty-personalization';

describe('storeOperationsPack — §6 depth bar', () => {
  const pack = storeOperationsPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(resolveFunctionPack('retail', 'store_operations')).toBe(pack);
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('store_operations');
    expect(pack.functionLabel).toBe('Store operations');
  });

  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it('meets every §6 minimum layer count', () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('carries an outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('carries the named store-operations operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'sales_per_labor_hour',
      'conversion_rate',
      'shrink_rate',
      'on_shelf_availability',
      'task_completion_rate',
      'checkout_wait_time',
      'planogram_compliance_rate',
      'labor_schedule_adherence',
      'store_nps',
      'units_per_transaction',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
      expect(metric.benchmarkRange.high).toBeGreaterThanOrEqual(
        metric.benchmarkRange.low,
      );
    }
  });

  it('specifies the named store-operations AI archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'ai_labor_scheduling_forecasting',
      'store_task_orchestration',
      'osa_vision_detection',
      'shrink_loss_detection',
      'store_associate_assist',
      'store_level_sales_forecasting',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('customerLoyaltyPersonalizationPack — §6 depth bar', () => {
  const pack = customerLoyaltyPersonalizationPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('retail', 'customer_loyalty_personalization'),
    ).toBe(pack);
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('customer_loyalty_personalization');
    expect(pack.functionLabel).toBe('Customer loyalty & personalization');
  });

  it('passes the machine-checkable depth bar with no shortfalls', () => {
    const result = checkFunctionPackDepth(pack);
    expect(result.shortfalls).toEqual([]);
    expect(result.passes).toBe(true);
  });

  it('meets every §6 minimum layer count', () => {
    expect(pack.operatingMetrics.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.operatingMetrics,
    );
    expect(pack.painThemes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.painThemes,
    );
    expect(pack.aiUseCaseArchetypes.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.aiUseCaseArchetypes,
    );
    expect(pack.referenceSolutionPatterns.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.referenceSolutionPatterns,
    );
    expect(pack.evidenceAnchors.length).toBeGreaterThanOrEqual(
      FUNCTION_PACK_DEPTH_MINIMUMS.evidenceAnchors,
    );
  });

  it('carries an outline for each of the four Moves phase artifacts', () => {
    const artifacts = pack.deliverableOutlines.map((o) => o.artifact).sort();
    expect(artifacts).toEqual([...REQUIRED_DELIVERABLE_ARTIFACTS].sort());
  });

  it('carries the named loyalty & personalization operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'active_loyalty_membership',
      'loyalty_sales_penetration',
      'repeat_purchase_rate',
      'customer_lifetime_value',
      'customer_churn_rate',
      'reward_redemption_rate',
      'personalization_attributed_revenue',
      'member_basket_premium',
      'segment_coverage_rate',
      'customer_nps',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
      expect(metric.benchmarkRange.high).toBeGreaterThanOrEqual(
        metric.benchmarkRange.low,
      );
    }
  });

  it('specifies the named loyalty & personalization AI archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'next_best_offer_recommendation',
      'churn_prediction_retention',
      'clv_modeling',
      'personalized_journeys_messaging',
      'loyalty_reward_optimization',
      'segmentation_audience_building',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });
});
