// function-pack-registry — unit tests.
//
// Covers the resolver contract (spec §5): all twelve healthcare reference
// packs resolve; an unknown industry-function returns `null`, never a faked
// pack; the coverage list reflects exactly the catalogued packs.

import {
  listFunctionPackCoverage,
  resolveFunctionPack,
} from '../function-pack-registry';

describe('resolveFunctionPack', () => {
  it('resolves the care-delivery & care-management pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'care_delivery_care_management',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('care_delivery_care_management');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Care delivery & care management');
  });

  it('resolves the population-health & value-based-care pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'population_health_value_based_care',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('population_health_value_based_care');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Population health & value-based care');
  });

  it('resolves the clinical-operations & documentation pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'clinical_operations_documentation',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('clinical_operations_documentation');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Clinical operations & documentation');
  });

  it('resolves the patient-access, engagement & experience pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'patient_access_engagement_experience',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('patient_access_engagement_experience');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe(
      'Patient access, engagement & experience',
    );
  });

  it('resolves the quality, safety & regulatory pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'quality_safety_regulatory',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('quality_safety_regulatory');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe(
      'Clinical quality, patient safety & regulatory compliance',
    );
  });

  it('resolves the health information & interoperability pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'health_information_interoperability',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('health_information_interoperability');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe(
      'Health information management, data & interoperability',
    );
  });

  it('resolves the research & clinical-trials pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'research_clinical_trials',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('research_clinical_trials');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Research & clinical trials');
  });

  it('resolves the revenue-cycle pack', () => {
    const pack = resolveFunctionPack('healthcare-provider', 'revenue_cycle');
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('revenue_cycle');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Revenue cycle');
  });

  it('resolves the clinical-supply-chain pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'clinical_supply_chain',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('clinical_supply_chain');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Clinical supply chain');
  });

  it('resolves the clinical-workforce & staffing pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'clinical_workforce_staffing',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('clinical_workforce_staffing');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Clinical workforce & staffing');
  });

  it('resolves the payer & claims-operations pack', () => {
    const pack = resolveFunctionPack(
      'healthcare-provider',
      'payer_claims_operations',
    );
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('payer_claims_operations');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Payer & claims operations');
  });

  it('resolves the pharmacy pack', () => {
    const pack = resolveFunctionPack('healthcare-provider', 'pharmacy');
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('pharmacy');
    expect(pack?.industryKey).toBe('healthcare-provider');
    expect(pack?.functionLabel).toBe('Pharmacy');
  });

  it('resolves the retail demand & inventory-planning pack', () => {
    const pack = resolveFunctionPack('retail', 'demand_inventory_planning');
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('demand_inventory_planning');
    expect(pack?.industryKey).toBe('retail');
    expect(pack?.functionLabel).toBe('Demand & inventory planning');
  });

  it('resolves the retail supply-chain & fulfillment pack', () => {
    const pack = resolveFunctionPack('retail', 'supply_chain_fulfillment');
    expect(pack).not.toBeNull();
    expect(pack?.functionKey).toBe('supply_chain_fulfillment');
    expect(pack?.industryKey).toBe('retail');
    expect(pack?.functionLabel).toBe('Supply chain & fulfillment');
  });

  it('returns null for an unknown function in a known industry', () => {
    // The healthcare provider taxonomy is complete at twelve catalogued
    // functions; a healthcare function outside that set (e.g. telehealth &
    // virtual care) has no pack yet — a known gap, never a faked pack.
    expect(
      resolveFunctionPack('healthcare-provider', 'telehealth_virtual_care'),
    ).toBeNull();
  });

  it('returns null for an unknown function in the retail industry', () => {
    // The retail vertical has opened with two functions; a retail function
    // outside that set (e.g. merchandising & assortment) has no pack yet —
    // a known gap, never a faked pack.
    expect(
      resolveFunctionPack('retail', 'merchandising_assortment'),
    ).toBeNull();
  });

  it('returns null when the function key is entirely unrecognised', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'not_a_real_function'),
    ).toBeNull();
  });

  it('does not cross-resolve a function key to the wrong industry', () => {
    // The healthcare functions must not resolve under the retail industry.
    expect(
      resolveFunctionPack('retail', 'population_health_value_based_care'),
    ).toBeNull();
  });
});

describe('listFunctionPackCoverage', () => {
  it('lists the twelve catalogued healthcare packs', () => {
    const coverage = listFunctionPackCoverage();
    const healthcareKeys = coverage
      .filter((c) => c.industryKey === 'healthcare-provider')
      .map((c) => c.functionKey)
      .sort();
    expect(healthcareKeys).toEqual([
      'care_delivery_care_management',
      'clinical_operations_documentation',
      'clinical_supply_chain',
      'clinical_workforce_staffing',
      'health_information_interoperability',
      'patient_access_engagement_experience',
      'payer_claims_operations',
      'pharmacy',
      'population_health_value_based_care',
      'quality_safety_regulatory',
      'research_clinical_trials',
      'revenue_cycle',
    ]);
  });

  it('lists the catalogued retail packs', () => {
    const coverage = listFunctionPackCoverage();
    const retailKeys = coverage
      .filter((c) => c.industryKey === 'retail')
      .map((c) => c.functionKey)
      .sort();
    expect(retailKeys).toEqual([
      'demand_inventory_planning',
      'supply_chain_fulfillment',
    ]);
  });

  it('covers only the known industry verticals', () => {
    const coverage = listFunctionPackCoverage();
    expect(
      coverage.every(
        (c) =>
          c.industryKey === 'healthcare-provider' ||
          c.industryKey === 'retail',
      ),
    ).toBe(true);
  });
});
