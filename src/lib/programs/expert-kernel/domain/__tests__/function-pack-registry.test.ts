// function-pack-registry — unit tests.
//
// Covers the resolver contract (spec §5): all ten healthcare reference packs
// resolve; an unknown industry-function returns `null`, never a faked pack;
// the coverage list reflects exactly the catalogued packs.

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

  it('returns null for an unknown function in a known industry', () => {
    // pharmacy has no pack yet — a known gap, never a faked pack.
    expect(resolveFunctionPack('healthcare-provider', 'pharmacy')).toBeNull();
  });

  it('returns null for an unknown industry', () => {
    // retail has no packs yet — a known gap, never a faked pack.
    expect(
      resolveFunctionPack('retail', 'care_delivery_care_management'),
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
  it('lists exactly the ten catalogued healthcare packs', () => {
    const coverage = listFunctionPackCoverage();
    expect(coverage).toHaveLength(10);
    const keys = coverage.map((c) => c.functionKey).sort();
    expect(keys).toEqual([
      'care_delivery_care_management',
      'clinical_operations_documentation',
      'clinical_supply_chain',
      'clinical_workforce_staffing',
      'health_information_interoperability',
      'patient_access_engagement_experience',
      'population_health_value_based_care',
      'quality_safety_regulatory',
      'research_clinical_trials',
      'revenue_cycle',
    ]);
    expect(coverage.every((c) => c.industryKey === 'healthcare-provider')).toBe(
      true,
    );
  });
});
