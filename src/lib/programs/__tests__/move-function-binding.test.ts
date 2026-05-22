// Move → Function Pack binding path — tests.
//
// Covers the two new modules that close the §5 binding contract for a real
// Move:
//   • `tenant-metric-inventory` — conservative reconciliation of a Move's
//     recorded baseline metrics against a pack's expected operating metrics.
//   • `move-function-binding`   — `bindMoveFunctionPack`, the first production
//     caller of `bindFunctionPackForArtifact`.
//
// The discipline under test is no-fabrication: a recorded metric is NOT a seed
// gap, an absent expected metric IS a precise seed gap, and a Move that cannot
// resolve a function identity yields an honest unbound result — never a throw,
// never a guessed pack.

import {
  normalizeMetricLabel,
  extractBaselineMetricNames,
  resolveTenantMetricKeys,
} from '../tenant-metric-inventory';
import { bindMoveFunctionPack } from '../move-function-binding';
import { CHARTER_FUNCTION_PACK_KEY } from '../function-identity';
import { careDeliveryCareManagementPack } from '../expert-kernel/domain/healthcare/care-delivery-care-management';
import { resolveFunctionPack } from '../expert-kernel/domain/function-pack-registry';

// The reference pack the Move resolves to in the bound-path tests.
const PACK = careDeliveryCareManagementPack;
const INDUSTRY_KEY = PACK.industryKey; // 'healthcare-provider'
const FUNCTION_KEY = String(PACK.functionKey); // 'care_delivery_care_management'

// ─────────────────────────────────────────────────────────────────────────────
// Slice 3 — tenant-metric-inventory
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeMetricLabel', () => {
  it('lower-cases, snake-cases and strips punctuation', () => {
    expect(normalizeMetricLabel('30-day all-cause readmission')).toBe(
      '30_day_all_cause_readmission',
    );
    expect(normalizeMetricLabel('Care-gap closure')).toBe('care_gap_closure');
  });

  it('strips trailing unit / qualifier noise so equivalent labels align', () => {
    // "rate" and "(PMPY)" are noise — dropped — so the human name and the
    // stable key normalise to the same canonical form.
    expect(normalizeMetricLabel('Care-gap closure rate')).toBe(
      normalizeMetricLabel('care_gap_closure'),
    );
    expect(normalizeMetricLabel('Risk-adjusted total cost of care (PMPY)')).toBe(
      'risk_adjusted_total_cost_of_care',
    );
  });

  it('returns empty string for empty / punctuation-only input', () => {
    expect(normalizeMetricLabel('')).toBe('');
    expect(normalizeMetricLabel('   ')).toBe('');
    expect(normalizeMetricLabel('---')).toBe('');
  });
});

describe('extractBaselineMetricNames', () => {
  it('pulls metric_name strings from the JSONB array', () => {
    expect(
      extractBaselineMetricNames([
        { metric_name: 'Care-gap closure rate' },
        { metric_name: '30-day all-cause readmission rate' },
      ]),
    ).toEqual(['Care-gap closure rate', '30-day all-cause readmission rate']);
  });

  it('is defensive against a non-array, missing or non-string field', () => {
    expect(extractBaselineMetricNames(null)).toEqual([]);
    expect(extractBaselineMetricNames(undefined)).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(extractBaselineMetricNames('not-an-array' as any)).toEqual([]);
    expect(
      extractBaselineMetricNames([
        { metric_name: 42 },
        { metric_name: '' },
        {},
        { metric_name: 'Care-gap closure rate' },
      ]),
    ).toEqual(['Care-gap closure rate']);
  });
});

describe('resolveTenantMetricKeys — conservative reconciliation', () => {
  it('matches a recorded metric to a pack key by human name', () => {
    // The pack carries a metric named "Care-gap closure rate" with key
    // `care_gap_closure_rate`. A tenant recording it under that name must
    // resolve to the pack key.
    const keys = resolveTenantMetricKeys(
      [{ metric_name: 'Care-gap closure rate' }],
      PACK,
    );
    expect(keys).toContain('care_gap_closure_rate');
  });

  it('matches a recorded metric to a pack key by the stable key itself', () => {
    const keys = resolveTenantMetricKeys(
      [{ metric_name: 'readmission_rate_30d' }],
      PACK,
    );
    expect(keys).toContain('readmission_rate_30d');
  });

  it('omits a metric that does not confidently match — never guesses', () => {
    // A vaguely-related but not-equal name must NOT match. Omission is correct:
    // it becomes an honest seed gap downstream.
    const keys = resolveTenantMetricKeys(
      [{ metric_name: 'Total revenue this quarter' }],
      PACK,
    );
    expect(keys).toEqual([]);
  });

  it('returns only the demonstrably-recorded subset, in pack order', () => {
    const keys = resolveTenantMetricKeys(
      [
        { metric_name: 'Care-gap closure rate' },
        { metric_name: 'Made-up unrelated metric' },
        { metric_name: 'readmission_rate_30d' },
      ],
      PACK,
    );
    expect(keys).toEqual(['readmission_rate_30d', 'care_gap_closure_rate']);
    expect(keys.length).toBeLessThan(PACK.operatingMetrics.length);
  });

  it('accepts an already-extracted metric-name list (broker-source seam)', () => {
    // The string-list form is the extension seam — a future broker source can
    // hand in names directly without changing this signature.
    const keys = resolveTenantMetricKeys(['Care-gap closure rate'], PACK);
    expect(keys).toContain('care_gap_closure_rate');
  });

  it('returns [] for an empty / absent metric source', () => {
    expect(resolveTenantMetricKeys([], PACK)).toEqual([]);
    expect(resolveTenantMetricKeys(null, PACK)).toEqual([]);
    expect(resolveTenantMetricKeys(undefined, PACK)).toEqual([]);
  });

  it('is deterministic — same input yields the same output', () => {
    const input = [{ metric_name: 'Care-gap closure rate' }];
    expect(resolveTenantMetricKeys(input, PACK)).toEqual(
      resolveTenantMetricKeys(input, PACK),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Slice 4 — bindMoveFunctionPack
// ─────────────────────────────────────────────────────────────────────────────

describe('bindMoveFunctionPack — a Move that resolves to a real pack', () => {
  // A Move whose industry code resolves to healthcare-provider and whose
  // charter carries the care-management function key.
  const boundMove = {
    industry_code: 'HEALTHCARE_IDN',
    charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
    baseline_metrics: [
      { metric_name: 'Care-gap closure rate', value: 61, unit: '%' },
    ],
  };

  it('binds the pack and inherits the deliverable outline', () => {
    const binding = bindMoveFunctionPack(boundMove, 'business_case');

    expect(binding.bound).toBe(true);
    expect(binding.functionLabel).toBe(PACK.functionLabel);
    expect(binding.fallbackNote).toBe('');

    // The inherited TOC matches the pack's business-case outline exactly —
    // structure is inherited, not improvised.
    const expectedOutline = PACK.deliverableOutlines.find(
      (o) => o.artifact === 'business_case',
    );
    expect(expectedOutline).toBeDefined();
    expect(binding.deliverableOutline.map((s) => s.heading)).toEqual(
      expectedOutline!.sections.map((s) => s.heading),
    );
  });

  it('a recorded metric is NOT a seed gap', () => {
    const binding = bindMoveFunctionPack(boundMove, 'business_case');
    // The Move records "Care-gap closure rate" → key `care_gap_closure_rate`.
    // It must be among the expected metrics, and NOT among the seed gaps.
    expect(binding.expectedMetrics.map((m) => m.key)).toContain(
      'care_gap_closure_rate',
    );
    expect(binding.seedGaps.map((g) => g.metricKey)).not.toContain(
      'care_gap_closure_rate',
    );
  });

  it('an absent expected metric IS a precise seed gap', () => {
    const binding = bindMoveFunctionPack(boundMove, 'business_case');
    // `readmission_rate_30d` is expected by the pack but the Move records no
    // such metric — it must surface as a precise, named seed gap.
    const gap = binding.seedGaps.find(
      (g) => g.metricKey === 'readmission_rate_30d',
    );
    expect(gap).toBeDefined();
    expect(gap!.metricName.length).toBeGreaterThan(0);
    expect(gap!.gapStatement.length).toBeGreaterThan(0);
  });

  it('every expected metric is either recorded or a seed gap — no metric lost', () => {
    const binding = bindMoveFunctionPack(boundMove, 'business_case');
    const recordedKeys = resolveTenantMetricKeys(
      boundMove.baseline_metrics,
      PACK,
    );
    const gapKeys = binding.seedGaps.map((g) => g.metricKey);
    for (const metric of binding.expectedMetrics) {
      const accounted =
        recordedKeys.includes(metric.key) || gapKeys.includes(metric.key);
      expect(accounted).toBe(true);
    }
  });

  it('accepts the camelCase industryCode alias', () => {
    const binding = bindMoveFunctionPack(
      {
        industryCode: 'HEALTHCARE_IDN',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
        baseline_metrics: [],
      },
      'business_case',
    );
    expect(binding.bound).toBe(true);
  });
});

describe('bindMoveFunctionPack — honest unbound results, never a throw', () => {
  it('a Move with no functionPackKey in its charter is unbound, not thrown', () => {
    const binding = bindMoveFunctionPack(
      {
        industry_code: 'HEALTHCARE_IDN',
        charter: {}, // no functionPackKey
        baseline_metrics: [],
      },
      'business_case',
    );
    expect(binding.bound).toBe(false);
    expect(binding.deliverableOutline).toEqual([]);
    expect(binding.seedGaps).toEqual([]);
    expect(binding.fallbackNote.length).toBeGreaterThan(0);
  });

  it('a Move with an unknown industry code is unbound', () => {
    const binding = bindMoveFunctionPack(
      {
        industry_code: 'AEROSPACE',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: FUNCTION_KEY },
        baseline_metrics: [],
      },
      'business_case',
    );
    expect(binding.bound).toBe(false);
    expect(binding.fallbackNote.length).toBeGreaterThan(0);
  });

  it('a missing charter / industry code does not throw', () => {
    expect(() => bindMoveFunctionPack({}, 'business_case')).not.toThrow();
    const binding = bindMoveFunctionPack({}, 'business_case');
    expect(binding.bound).toBe(false);
  });

  it('a resolved identity with no catalogued pack yields the key-naming fallback', () => {
    // An industry that resolves but a function key with no pack — the unbound
    // result must come from bindFunctionPackForArtifact and name the keys.
    const unknownFunction = 'a_function_with_no_pack';
    expect(
      resolveFunctionPack(INDUSTRY_KEY, unknownFunction),
    ).toBeNull();
    const binding = bindMoveFunctionPack(
      {
        industry_code: 'HEALTHCARE_IDN',
        charter: { [CHARTER_FUNCTION_PACK_KEY]: unknownFunction },
        baseline_metrics: [],
      },
      'business_case',
    );
    expect(binding.bound).toBe(false);
    expect(binding.fallbackNote).toContain(unknownFunction);
  });
});
