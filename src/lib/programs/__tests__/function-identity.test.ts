// Function-identity spine tests — the bridge that resolves a Move to its
// `(industryKey, functionKey)` so a curated Domain Function Pack can bind.
//
// Three things under test:
//   1. `industryKeyForCode`         — industry_code → FunctionPackIndustryKey.
//   2. `classifyFunctionKey`        — deterministic brief → function key, with
//                                     an honest `null` for an ambiguous brief.
//   3. `resolveMoveFunctionIdentity` — function-key resolution, column-first
//      with a `charter.functionPackKey` fallback.

import {
  CHARTER_FUNCTION_PACK_KEY,
  classifyFunctionKey,
  FUNCTION_CLASSIFY_CONFIDENCE_FLOOR,
  industryKeyForCode,
  resolveFunctionPackKey,
  resolveMoveFunctionIdentity,
} from '../function-identity';
import {
  listFunctionPackCoverage,
  resolveFunctionPack,
} from '../expert-kernel/domain/function-pack-registry';
import type { FunctionPackIndustryKey } from '../expert-kernel/domain/function-pack-types';

describe('industryKeyForCode', () => {
  it('maps the three canonical engagements.industry_code values', () => {
    expect(industryKeyForCode('RETAIL')).toBe('retail');
    expect(industryKeyForCode('HEALTHCARE_IDN')).toBe('healthcare-provider');
    expect(industryKeyForCode('FINSERV')).toBe('financial-services');
  });

  it('is tolerant of case and surrounding whitespace', () => {
    expect(industryKeyForCode('retail')).toBe('retail');
    expect(industryKeyForCode('  Healthcare_Idn  ')).toBe('healthcare-provider');
    expect(industryKeyForCode('finserv')).toBe('financial-services');
  });

  it('recognises known aliases', () => {
    expect(industryKeyForCode('healthcare')).toBe('healthcare-provider');
    expect(industryKeyForCode('financial_services')).toBe('financial-services');
    expect(industryKeyForCode('financial-services')).toBe('financial-services');
  });

  it('returns null for an unknown / absent code — never a guess', () => {
    expect(industryKeyForCode('BANKING')).toBeNull();
    expect(industryKeyForCode('')).toBeNull();
    expect(industryKeyForCode('   ')).toBeNull();
    expect(industryKeyForCode(null)).toBeNull();
    expect(industryKeyForCode(undefined)).toBeNull();
  });
});

describe('classifyFunctionKey — representative briefs across all 3 verticals', () => {
  // Each case: an industry, a brief that genuinely names a function's terms,
  // and the function key the classifier must resolve it to.
  const cases: {
    label: string;
    industryKey: FunctionPackIndustryKey;
    brief: string;
    expected: string;
  }[] = [
    {
      label: 'retail · pricing & promotions',
      industryKey: 'retail',
      brief:
        'We want to optimise everyday base prices and rebuild our promotional ' +
        'calendar and promotion mechanics to protect price image and lift ' +
        'promotional ROI and price realisation across the assortment.',
      expected: 'pricing_promotions',
    },
    {
      label: 'retail · loss prevention',
      industryKey: 'retail',
      brief:
        'Reduce shrink and inventory loss at the point of sale; investigate ' +
        'organised retail crime, theft and fraud to strengthen loss prevention.',
      expected: 'loss_prevention',
    },
    {
      label: 'retail · demand & inventory planning',
      industryKey: 'retail',
      brief:
        'Sharpen demand forecasting and inventory replenishment planning to ' +
        'cut stockouts and lower excess inventory across stores.',
      expected: 'demand_inventory_planning',
    },
    {
      label: 'healthcare · revenue cycle',
      industryKey: 'healthcare-provider',
      brief:
        'Cut our initial denial rate and days in accounts receivable by ' +
        'automating prior authorisation, claim scrubbing and denial appeals ' +
        'across the revenue cycle.',
      expected: 'revenue_cycle',
    },
    {
      label: 'healthcare · clinical operations & documentation',
      industryKey: 'healthcare-provider',
      brief:
        'Reduce clinician documentation burden with ambient clinical scribing ' +
        'and better clinical documentation in clinical operations.',
      expected: 'clinical_operations_documentation',
    },
    {
      label: 'healthcare · member-service Agent Assist',
      industryKey: 'healthcare-provider',
      brief:
        'Scale AI agent assist for member services so contact-center agents ' +
        'can answer claims status, benefits, eligibility, prior authorization, ' +
        'CRM history and knowledge-base questions with PHI controls, fewer ' +
        'transfers, better first contact resolution and less after-call work.',
      expected: 'member_service_agent_assist',
    },
    {
      label: 'financial-services · fraud & financial crime',
      industryKey: 'financial-services',
      brief:
        'Detect fraud and financial crime faster with stronger transaction ' +
        'monitoring, AML alert triage and money-laundering investigation.',
      expected: 'fraud_financial_crime',
    },
    {
      label: 'financial-services · lending & credit underwriting',
      industryKey: 'financial-services',
      brief:
        'Speed up loan underwriting and credit decisioning turnaround and ' +
        'improve credit-risk assessment across our lending book.',
      expected: 'lending_credit_underwriting',
    },
  ];

  it.each(cases)('classifies $label', ({ industryKey, brief, expected }) => {
    const result = classifyFunctionKey(industryKey, brief);
    expect(result).not.toBeNull();
    expect(result!.functionKey).toBe(expected);
    expect(result!.confidence).toBeGreaterThanOrEqual(
      FUNCTION_CLASSIFY_CONFIDENCE_FLOOR,
    );
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });

  it('returns a key that resolves to a real pack in the same industry', () => {
    for (const { industryKey, brief } of cases) {
      const result = classifyFunctionKey(industryKey, brief);
      expect(result).not.toBeNull();
      const pack = resolveFunctionPack(industryKey, result!.functionKey);
      expect(pack).not.toBeNull();
      expect(pack!.industryKey).toBe(industryKey);
    }
  });

  it('returns null for an ambiguous brief — honest "no confident match"', () => {
    expect(
      classifyFunctionKey('retail', 'We should do something better with our stuff'),
    ).toBeNull();
  });

  it('returns null for an empty / whitespace brief — never fabricates a key', () => {
    expect(classifyFunctionKey('retail', '')).toBeNull();
    expect(classifyFunctionKey('healthcare-provider', '   ')).toBeNull();
    expect(classifyFunctionKey('financial-services', null)).toBeNull();
    expect(classifyFunctionKey('retail', undefined)).toBeNull();
  });

  it('is deterministic — the same brief yields the same result', () => {
    const brief = cases[0].brief;
    const first = classifyFunctionKey('retail', brief);
    const second = classifyFunctionKey('retail', brief);
    expect(second).toEqual(first);
  });
});

describe('resolveMoveFunctionIdentity', () => {
  it('round-trips a stored Move to its (industryKey, functionKey)', () => {
    const identity = resolveMoveFunctionIdentity({
      industryCode: 'RETAIL',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'pricing_promotions' },
    });
    expect(identity).toEqual({
      industryKey: 'retail',
      functionKey: 'pricing_promotions',
    });
  });

  it('classify → persist → resolve → resolveFunctionPack is a full round-trip', () => {
    const industryCode = 'HEALTHCARE_IDN';
    const industryKey = industryKeyForCode(industryCode)!;
    const classified = classifyFunctionKey(
      industryKey,
      'Cut our initial denial rate and days in A/R by automating prior ' +
        'authorisation and claim scrubbing across the revenue cycle.',
    );
    expect(classified).not.toBeNull();

    // The value origination persists into engagements.charter.
    const charter = { [CHARTER_FUNCTION_PACK_KEY]: classified!.functionKey };

    const identity = resolveMoveFunctionIdentity({ industryCode, charter });
    expect(identity).not.toBeNull();
    expect(identity!.industryKey).toBe('healthcare-provider');

    const pack = resolveFunctionPack(identity!.industryKey, identity!.functionKey);
    expect(pack).not.toBeNull();
    expect(pack!.functionKey).toBe('revenue_cycle');
  });

  it('returns null when the industry code does not resolve', () => {
    expect(
      resolveMoveFunctionIdentity({
        industryCode: 'BANKING',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: 'pricing_promotions' },
      }),
    ).toBeNull();
  });

  it('returns null when the charter carries no function key', () => {
    expect(
      resolveMoveFunctionIdentity({ industryCode: 'RETAIL', charter: {} }),
    ).toBeNull();
    expect(
      resolveMoveFunctionIdentity({ industryCode: 'RETAIL', charter: null }),
    ).toBeNull();
    expect(
      resolveMoveFunctionIdentity({
        industryCode: 'RETAIL',
        charter: 'not-an-object',
      }),
    ).toBeNull();
    expect(
      resolveMoveFunctionIdentity({
        industryCode: 'RETAIL',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: '   ' },
      }),
    ).toBeNull();
  });
});

describe('resolveMoveFunctionIdentity — function_pack_key column promotion', () => {
  it('resolves from the first-class function_pack_key column', () => {
    // The post-migration shape: the column carries the key, charter is absent.
    const identity = resolveMoveFunctionIdentity({
      industryCode: 'RETAIL',
      functionPackKey: 'pricing_promotions',
      charter: null,
    });
    expect(identity).toEqual({
      industryKey: 'retail',
      functionKey: 'pricing_promotions',
    });
  });

  it('falls back to charter.functionPackKey when the column is null/absent', () => {
    // The deploy-window / missed-backfill shape: column null, charter carries it.
    const fromNullColumn = resolveMoveFunctionIdentity({
      industryCode: 'RETAIL',
      functionPackKey: null,
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'pricing_promotions' },
    });
    expect(fromNullColumn).toEqual({
      industryKey: 'retail',
      functionKey: 'pricing_promotions',
    });

    // A caller that omits the column entirely (e.g. a pre-column row read)
    // still resolves via the charter fallback.
    const fromAbsentColumn = resolveMoveFunctionIdentity({
      industryCode: 'RETAIL',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'pricing_promotions' },
    });
    expect(fromAbsentColumn).toEqual({
      industryKey: 'retail',
      functionKey: 'pricing_promotions',
    });
  });

  it('prefers the column over a divergent charter value', () => {
    // Defensive: the two are kept coherent by the dual-write, but if they ever
    // diverge the column is the source of truth.
    const identity = resolveMoveFunctionIdentity({
      industryCode: 'RETAIL',
      functionPackKey: 'pricing_promotions',
      charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
    });
    expect(identity!.functionKey).toBe('pricing_promotions');
  });

  it('returns null when neither the column nor the charter carries a key', () => {
    expect(
      resolveMoveFunctionIdentity({
        industryCode: 'RETAIL',
        functionPackKey: null,
        charter: {},
      }),
    ).toBeNull();
    // A blank column value is treated as absent — the charter fallback applies.
    expect(
      resolveMoveFunctionIdentity({
        industryCode: 'RETAIL',
        functionPackKey: '   ',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: 'pricing_promotions' },
      })!.functionKey,
    ).toBe('pricing_promotions');
  });
});

describe('resolveFunctionPackKey — column-first key resolution', () => {
  it('returns the column value when present', () => {
    expect(
      resolveFunctionPackKey({ functionPackKey: 'customer_care', charter: null }),
    ).toBe('customer_care');
  });

  it('falls back to charter.functionPackKey', () => {
    expect(
      resolveFunctionPackKey({
        functionPackKey: null,
        charter: { [CHARTER_FUNCTION_PACK_KEY]: 'customer_care' },
      }),
    ).toBe('customer_care');
  });

  it('returns null when neither source carries a key', () => {
    expect(resolveFunctionPackKey({ functionPackKey: null, charter: {} })).toBeNull();
    expect(resolveFunctionPackKey({})).toBeNull();
  });
});

describe('classifier coverage sanity', () => {
  it('every catalogued industry has packs the classifier can score against', () => {
    const industries: FunctionPackIndustryKey[] = [
      'retail',
      'healthcare-provider',
      'financial-services',
    ];
    for (const industryKey of industries) {
      const coverage = listFunctionPackCoverage().filter(
        (e) => e.industryKey === industryKey,
      );
      expect(coverage.length).toBeGreaterThan(0);
    }
  });
});
