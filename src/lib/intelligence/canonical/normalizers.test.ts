import {
  normalizeConfidenceLevel,
  normalizeEnterpriseArea,
  normalizeFunction,
  normalizeIndustry,
  normalizeMaturityLevel,
  normalizeProcessArea,
  normalizeStrategicMovePhase,
  normalizeUseCaseCategory,
} from './normalizers';

describe('canonical pattern normalizers', () => {
  it.each([
    ['financial-services', ['financial_services']],
    ['financial_services,energy', ['financial_services', 'energy']],
    ['retail-cpg', ['retail']],
    ['cross-industry', ['cross_industry']],
    ['healthcare/provider', ['healthcare']],
    ['health-care', ['healthcare']],
    ['fs', ['financial_services']],
    ['cpg', ['retail']],
  ])('normalizes industry alias %s', (input, expected) => {
    expect(normalizeIndustry(input).values).toEqual(expected);
  });

  it('returns other and preserves unresolved industry input for unknown values', () => {
    expect(normalizeIndustry('space-mining').values).toEqual(['other']);
    expect(normalizeIndustry('space-mining').unresolved).toEqual(['space-mining']);
  });

  it('returns structured unresolved output for unknown enterprise areas', () => {
    expect(normalizeEnterpriseArea('field-office')).toEqual({
      raw: ['field-office'],
      values: [],
      unresolved: ['field-office'],
    });
  });

  it('normalizes enterprise area aliases', () => {
    expect(normalizeEnterpriseArea('customer experience').values).toEqual(['front_office']);
    expect(normalizeEnterpriseArea('operations').values).toEqual(['middle_office']);
    expect(normalizeEnterpriseArea('procurement').values).toEqual(['back_office']);
    expect(normalizeEnterpriseArea('data-platform').values).toEqual(['enterprise_platform']);
  });

  it('normalizes freeform function, process, and use-case category values', () => {
    expect(normalizeFunction('Contact Center').values).toEqual(['contact_center']);
    expect(normalizeProcessArea('Prior Auth').values).toEqual(['prior_auth']);
    expect(normalizeUseCaseCategory('Agentic Workflow').values).toEqual(['agentic_workflow']);
  });

  it('returns other for empty freeform values', () => {
    expect(normalizeFunction('').values).toEqual(['other']);
    expect(normalizeProcessArea(null).values).toEqual(['other']);
    expect(normalizeUseCaseCategory(undefined).values).toEqual(['other']);
  });

  it('normalizes simplified Strategic Moves phases without execute', () => {
    expect(normalizeStrategicMovePhase('P0').values).toEqual(['originate']);
    expect(normalizeStrategicMovePhase('charter').values).toEqual(['charter']);
    expect(normalizeStrategicMovePhase('Diagnose / Discover').values).toEqual(['diagnose_discover']);
    expect(normalizeStrategicMovePhase('Design').values).toEqual(['design']);
    expect(normalizeStrategicMovePhase('Roadmap / Estimates / Business Case / Change / Value Realization Plan').values)
      .toEqual(['roadmap_business_case_change_value_plan']);
    expect(normalizeStrategicMovePhase('Mobilize & Handoff').values).toEqual(['mobilize_handoff']);
    expect(normalizeStrategicMovePhase('Execute')).toEqual({
      raw: ['Execute'],
      values: [],
      unresolved: ['Execute'],
    });
  });

  it('normalizes confidence level aliases and numeric confidence', () => {
    expect(normalizeConfidenceLevel('med').values).toEqual(['medium']);
    expect(normalizeConfidenceLevel('verified').values).toEqual(['validated']);
    expect(normalizeConfidenceLevel(0.85).values).toEqual(['high']);
    expect(normalizeConfidenceLevel(0.7).values).toEqual(['medium']);
    expect(normalizeConfidenceLevel(0.4).values).toEqual(['low']);
  });

  it('normalizes maturity aliases', () => {
    expect(normalizeMaturityLevel('frontier').values).toEqual(['experimental']);
    expect(normalizeMaturityLevel('mature').values).toEqual(['proven']);
    expect(normalizeMaturityLevel('advanced').values).toEqual(['scaled']);
  });
});
