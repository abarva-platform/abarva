// function-pack-registry — unit tests.
//
// Covers the resolver contract (spec §5): both value-based-care reference
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

  it('returns null for an unknown function in a known industry', () => {
    expect(
      resolveFunctionPack('healthcare-provider', 'revenue_cycle'),
    ).toBeNull();
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
  it('lists exactly the two catalogued value-based-care packs', () => {
    const coverage = listFunctionPackCoverage();
    expect(coverage).toHaveLength(2);
    const keys = coverage.map((c) => c.functionKey).sort();
    expect(keys).toEqual([
      'care_delivery_care_management',
      'population_health_value_based_care',
    ]);
    expect(coverage.every((c) => c.industryKey === 'healthcare-provider')).toBe(
      true,
    );
  });
});
