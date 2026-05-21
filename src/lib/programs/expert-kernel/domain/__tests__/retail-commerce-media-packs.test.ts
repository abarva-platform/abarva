// Retail Function Packs — digital commerce and marketing & retail media.
//
// These two packs extend the retail vertical (spec §3, §8) — the same eight-
// layer schema ported from healthcare. This suite asserts each one meets the
// §6 depth bar (FUNCTION_PACK_DEPTH_MINIMUMS), is reachable through
// resolveFunctionPack under the `retail` industry key, and carries the named
// operating metrics and AI use-case archetypes the build task specified.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from '../function-pack-types';
import {
  checkFunctionPackDepth,
  resolveFunctionPack,
} from '../function-pack-registry';
import { digitalCommercePack } from '../retail/digital-commerce';
import { marketingRetailMediaPack } from '../retail/marketing-retail-media';

describe('digitalCommercePack — §6 depth bar', () => {
  const pack = digitalCommercePack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(resolveFunctionPack('retail', 'digital_commerce')).toBe(pack);
  });

  it('is keyed to the retail industry vertical', () => {
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('digital_commerce');
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

  it('carries the named digital-commerce operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'ecommerce_conversion_rate',
      'average_order_value',
      'cart_abandonment_rate',
      'site_search_success_rate',
      'page_load_core_web_vitals',
      'mobile_conversion_rate',
      'checkout_completion_rate',
      'pdp_engagement_rate',
      'online_return_rate',
      'digital_revenue_mix',
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

  it('specifies the named digital-commerce AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'semantic_search_discovery',
      'product_recommendations',
      'conversion_rate_optimization',
      'dynamic_onsite_merchandising',
      'product_content_generation',
      'checkout_fraud_detection',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });

  it('every archetype moves only metrics the pack defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });
});

describe('marketingRetailMediaPack — §6 depth bar', () => {
  const pack = marketingRetailMediaPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(resolveFunctionPack('retail', 'marketing_retail_media')).toBe(pack);
  });

  it('is keyed to the retail industry vertical', () => {
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('marketing_retail_media');
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

  it('carries the named marketing & retail-media operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'marketing_roas',
      'retail_media_network_revenue',
      'customer_acquisition_cost',
      'campaign_incrementality',
      'attribution_coverage',
      'share_of_voice',
      'content_production_velocity',
      'audience_match_rate',
      'retail_media_take_rate',
      'brand_funded_marketing_pct',
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

  it('specifies the named marketing & retail-media AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'media_mix_budget_optimization',
      'campaign_creative_generation',
      'retail_media_yield_optimization',
      'audience_activation_targeting',
      'incrementality_measurement',
      'multi_touch_attribution_modeling',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });

  it('every archetype moves only metrics the pack defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });
});
