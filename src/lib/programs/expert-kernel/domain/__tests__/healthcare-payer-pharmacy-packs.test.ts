// Healthcare Function Packs — payer / claims operations and pharmacy.
//
// These two packs cover payer claims operations and pharmacy in the healthcare
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
import { payerClaimsOperationsPack } from '../healthcare/payer-claims-operations';
import { pharmacyPack } from '../healthcare/pharmacy';

describe('payerClaimsOperationsPack — §6 depth bar', () => {
  const pack = payerClaimsOperationsPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'payer_claims_operations'),
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

  it('carries the named claims-operations operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'auto_adjudication_rate',
      'claims_cycle_time',
      'payment_accuracy_rate',
      'claims_rework_rate',
      'prior_auth_processing_turnaround',
      'appeals_grievances_rate',
      'provider_data_accuracy_rate',
      'denial_overturn_rate',
      'first_pass_payment_rate',
      'administrative_cost_per_claim',
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

  it('specifies the named claims AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'claims_auto_adjudication',
      'payment_integrity_fwa',
      'prior_authorization_automation',
      'claims_document_intake',
      'appeals_triage',
      'provider_data_management',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('pharmacyPack — §6 depth bar', () => {
  const pack = pharmacyPack;

  it('resolves through the registry under its (industry, function) key', () => {
    expect(resolveFunctionPack('healthcare-provider', 'pharmacy')).toBe(pack);
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

  it('carries the named pharmacy operating metrics', () => {
    const keys = new Set(pack.operatingMetrics.map((m) => m.key));
    for (const expected of [
      'medication_turnaround_time',
      'drug_spend_per_adjusted_day',
      'formulary_compliance_rate',
      'dispensing_error_rate',
      'capture_340b_rate',
      'inventory_carrying_cost',
      'iv_room_throughput',
      'clinical_intervention_rate',
      'medication_prior_auth_turnaround',
      'specialty_pharmacy_capture_rate',
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

  it('specifies the named pharmacy AI use-case archetypes, each with a value mechanism', () => {
    const keys = pack.aiUseCaseArchetypes.map((a) => a.key);
    for (const expected of [
      'drug_spend_medication_use_analytics',
      'capture_340b_optimization',
      'dispensing_error_detection',
      'inventory_expiry_optimization',
      'medication_prior_authorization',
      'clinical_surveillance_stewardship',
      'specialty_pharmacy_patient_management',
    ]) {
      expect(keys).toContain(expected);
    }
    for (const archetype of pack.aiUseCaseArchetypes) {
      expect(archetype.valueMechanism.trim().length).toBeGreaterThan(0);
    }
  });
});
