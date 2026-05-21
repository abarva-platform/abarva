// Healthcare Function Packs — clinical supply chain and clinical workforce
// & staffing.
//
// These two packs extend the healthcare reference depth into the operational
// cost base of a health system — the supply chain and the clinical workforce,
// the two largest cost lines after one another. This suite asserts each one
// meets the §6 depth bar (FUNCTION_PACK_DEPTH_MINIMUMS), is reachable through
// resolveFunctionPack, and carries the marquee archetypes its function
// expects.

import {
  FUNCTION_PACK_DEPTH_MINIMUMS,
  REQUIRED_DELIVERABLE_ARTIFACTS,
} from '../function-pack-types';
import {
  checkFunctionPackDepth,
  resolveFunctionPack,
} from '../function-pack-registry';
import { clinicalSupplyChainPack } from '../healthcare/clinical-supply-chain';
import { clinicalWorkforceStaffingPack } from '../healthcare/clinical-workforce-staffing';

describe('clinicalSupplyChainPack — §6 depth bar', () => {
  const pack = clinicalSupplyChainPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'clinical_supply_chain'),
    ).toBe(pack);
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

  it('specifies the six required clinical-supply-chain archetypes', () => {
    const keys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(keys).toContain('clinical_supply_demand_forecasting');
    expect(keys).toContain('automated_par_optimization');
    expect(keys).toContain('expiration_waste_reduction');
    expect(keys).toContain('ppi_cost_analytics');
    expect(keys).toContain('shortage_substitute_management');
    expect(keys).toContain('po_invoice_match_automation');
  });

  it('every archetype moves only metrics the pack actually defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.metricsMoved.length).toBeGreaterThan(0);
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });

  it('carries the supply-chain systems of record in its vocabulary', () => {
    const names = pack.vocabulary.systemsOfRecord
      .map((s) => s.name.toLowerCase())
      .join(' | ');
    expect(names).toContain('erp');
    expect(names).toContain('inventory');
    expect(names).toContain('item master');
  });

  it('every benchmark stays a labelled planning range', () => {
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
    }
    for (const factor of pack.valueModel.dominantHaircutFactors) {
      expect(factor.typicalHaircut.label).toBe('planning-range');
    }
    for (const benchmark of pack.valueModel.valueBenchmarks) {
      expect(benchmark.range.label).toBe('planning-range');
    }
  });
});

describe('clinicalWorkforceStaffingPack — §6 depth bar', () => {
  const pack = clinicalWorkforceStaffingPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'clinical_workforce_staffing'),
    ).toBe(pack);
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

  it('specifies the six required clinical-workforce archetypes', () => {
    const keys = new Set(pack.aiUseCaseArchetypes.map((a) => a.key));
    expect(keys).toContain('predictive_census_staffing');
    expect(keys).toContain('ai_scheduling_self_scheduling');
    expect(keys).toContain('agency_spend_optimization');
    expect(keys).toContain('attrition_risk_prediction');
    expect(keys).toContain('float_pool_optimization');
    expect(keys).toContain('credential_competency_management');
  });

  it('every archetype moves only metrics the pack actually defines', () => {
    const metricKeys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.metricsMoved.length).toBeGreaterThan(0);
      for (const moved of archetype.metricsMoved) {
        expect(metricKeys.has(moved)).toBe(true);
      }
    }
  });

  it('treats safe staffing as a hard floor — the staffing archetype is not autonomous', () => {
    const predictive = pack.aiUseCaseArchetypes.find(
      (a) => a.key === 'predictive_census_staffing',
    );
    expect(predictive).toBeDefined();
    expect(predictive?.controlPosture).toBe('human-on-the-loop');
    // The control-risk notes must name the safe-minimum / ratio floor.
    const notes = predictive!.controlRiskNotes.join(' ').toLowerCase();
    expect(notes).toMatch(/minimum|ratio/);
  });

  it('names the state nurse-staffing-ratio frame as a regulatory constraint', () => {
    const frames = pack.vocabulary.regulatoryFrames
      .map((f) => f.name.toLowerCase())
      .join(' | ');
    expect(frames).toContain('staffing');
  });

  it('every benchmark stays a labelled planning range', () => {
    for (const metric of pack.operatingMetrics) {
      expect(metric.benchmarkRange.label).toBe('planning-range');
    }
    for (const factor of pack.valueModel.dominantHaircutFactors) {
      expect(factor.typicalHaircut.label).toBe('planning-range');
    }
    for (const benchmark of pack.valueModel.valueBenchmarks) {
      expect(benchmark.range.label).toBe('planning-range');
    }
  });
});
