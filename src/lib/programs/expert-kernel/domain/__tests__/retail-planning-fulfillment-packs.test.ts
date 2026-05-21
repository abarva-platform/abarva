// Retail Function Packs — demand & inventory planning and supply chain &
// fulfillment.
//
// These two packs open the retail vertical (spec §3, §8) — the same eight-
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
import { demandInventoryPlanningPack } from '../retail/demand-inventory-planning';
import { supplyChainFulfillmentPack } from '../retail/supply-chain-fulfillment';

describe('demandInventoryPlanningPack — §6 depth bar', () => {
  const pack = demandInventoryPlanningPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('retail', 'demand_inventory_planning'),
    ).toBe(pack);
  });

  it('is keyed to the retail industry vertical', () => {
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('demand_inventory_planning');
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

  it('carries the named demand & inventory-planning operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'forecast_accuracy_mape',
      'inventory_turns',
      'weeks_of_supply',
      'in_stock_availability_rate',
      'excess_obsolete_inventory_pct',
      'stockout_rate',
      'inventory_carrying_cost',
      'allocation_accuracy',
      'lost_sales_estimate',
      'days_inventory_outstanding',
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

  it('specifies the named planning AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'demand_forecasting',
      'automated_replenishment',
      'allocation_distribution_optimization',
      'new_store_new_product_forecasting',
      'inventory_position_optimization',
      'markdown_liquidation_timing',
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

describe('supplyChainFulfillmentPack — §6 depth bar', () => {
  const pack = supplyChainFulfillmentPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('retail', 'supply_chain_fulfillment'),
    ).toBe(pack);
  });

  it('is keyed to the retail industry vertical', () => {
    expect(pack.industryKey).toBe('retail');
    expect(pack.functionKey).toBe('supply_chain_fulfillment');
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

  it('carries the named supply-chain & fulfillment operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'on_time_in_full',
      'order_cycle_time',
      'perfect_order_rate',
      'cost_to_serve_per_order',
      'fill_rate',
      'transportation_cost_pct_sales',
      'warehouse_throughput',
      'last_mile_cost_per_delivery',
      'delivery_promise_accuracy',
      'returns_processing_time',
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

  it('specifies the named fulfillment AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'fulfillment_node_ship_from_optimization',
      'delivery_promise_eta_prediction',
      'transportation_route_optimization',
      'warehouse_labour_slotting_optimization',
      'supply_disruption_detection',
      'inventory_to_fulfillment_balancing',
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
