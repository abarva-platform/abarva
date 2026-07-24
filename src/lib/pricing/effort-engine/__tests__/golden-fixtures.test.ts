/**
 * Golden calculation fixtures — one per archetype (8 total), brief §12.
 *
 * Each fixture runs a realistic set of scope-driver inputs through the FULL
 * pipeline (archetype -> activity packs -> effort rules -> role hours ->
 * rate resolution -> cost -> range policy) against the REAL, committed PR4
 * reference pack and PR1's REAL rate-band data (no client rate card exists
 * in this offline environment, so every role resolves via the
 * `rate_band_default` bucket — see `test-fixtures.ts`). Every fixture's
 * total is pinned as an exact expected value and asserted with `toBe` on
 * every test run, matching this repo's existing "pin the workbook anchor
 * exactly" convention (see `src/lib/workforce-economics/__tests__/
 * workforce-economics.test.ts` for the style this follows — nothing is
 * imported from that module).
 */
import { runEffortEngine } from "../effort-engine";
import { resolveActivityPacksForArchetype } from "../activity-packs";
import { resolveRoleRate } from "../rate-card-resolver";
import { computeRange } from "../range-policy";
import { assertLowExpectedHighInvariant, assertDeterministicRecomputation } from "../validation";
import { loadRealEffortEnginePack, loadRealRoleRateSnapshot } from "../__fixtures__/test-fixtures";
import type { EffortEngineInput } from "../effort-engine";
import type { ResolvedRate } from "../types";

const pack = loadRealEffortEnginePack();
const rateSnapshot = loadRealRoleRateSnapshot();

/** Illustrative, realistic scope-driver quantities — reused across archetypes; only the drivers an archetype's rules actually reference are consumed. */
const DRIVER_QUANTITIES: Record<string, number> = {
  integration_count: 8,
  impacted_user_count: 1500,
  rollout_wave_count: 3,
  stakeholder_group_count: 6,
  course_count: 5,
  training_session_count: 15,
  supplier_month_count: 10,
  data_domain_count: 4,
  data_source_count: 6,
  report_count: 12,
  process_count: 5,
  automation_count: 6,
  environment_count: 4,
  application_count: 3,
  module_count: 4,
  batch_job_count: 120,
  program_count: 60,
  ai_use_case_count: 3,
  model_count: 2,
  support_ticket_volume_monthly: 800,
  role_count: 10,
  test_case_count: 300,
  hypercare_week_count: 6,
};

function scopeDriversFor(archetypeCode: string): Record<string, number> {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
  const neededDriverCodes = new Set<string>();
  for (const p of resolved) {
    for (const rule of p.rules) {
      if ("driverCode" in rule.operation) neededDriverCodes.add(rule.operation.driverCode);
    }
  }
  const drivers: Record<string, number> = {};
  for (const code of neededDriverCodes) {
    if (!(code in DRIVER_QUANTITIES)) throw new Error(`golden fixture is missing a DRIVER_QUANTITIES entry for '${code}'`);
    drivers[code] = DRIVER_QUANTITIES[code];
  }
  return drivers;
}

function ratesFor(archetypeCode: string): ReadonlyMap<string, ResolvedRate> {
  const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
  const roleCodes = new Set<string>();
  for (const p of resolved) for (const rm of p.roleMix) roleCodes.add(rm.roleCode);
  const rates = new Map<string, ResolvedRate>();
  for (const roleCode of roleCodes) rates.set(roleCode, resolveRoleRate(roleCode, null, rateSnapshot));
  return rates;
}

// Uniform, illustrative range-policy inputs for every golden fixture: medium
// maturity/evidence/novelty/uncertainty (score 4 each dimension's midpoint)
// plus a real rate-card-coverage figure. No tenant rate card exists in this
// environment, so every role falls back to the global rate-band default —
// PR3's coverage-report proved this fallback covers effectively 100% of the
// 326-role taxonomy (see PR3 release record's "0 direct / 326 inherited"
// finding) — hence rateCardCoveragePct: 100 here.
const RANGE_INPUTS = {
  scopeMaturity: "medium" as const,
  evidenceQuality: "medium" as const,
  deliveryNovelty: "medium" as const,
  quantityUncertainty: "medium" as const,
  rateCardCoveragePct: 100,
};

interface GoldenCase {
  archetypeCode: string;
  expectedTotalRawHours: number;
  expectedTotalExpectedHours: number;
  expectedTotalLaborCostCents: number;
  expectedTotalManualCostCents: number;
  expectedTotalCostCents: number;
  expectedGapCount: number;
  expectedRangePolicyCode: string;
}

// Pinned by actually running the engine once (via a scratch tsx script
// exercising `runEffortEngine` against the real committed pack + PR1's real
// rate-band data, the same inputs `scopeDriversFor`/`ratesFor` below compute)
// and recording the printed output — the same discipline as the repo's
// other exact-value-pinning tests (e.g. workforce-economics.test.ts anchors
// its worked example against the source workbook). See the PR4 release
// record for the captured transcript this was generated from.
const GOLDEN_CASES: GoldenCase[] = [
  { archetypeCode: "ARCH-01", expectedTotalRawHours: 9902.04, expectedTotalExpectedHours: 9902.04, expectedTotalLaborCostCents: 103_813_127, expectedTotalManualCostCents: 1_500_000, expectedTotalCostCents: 105_313_127, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-02", expectedTotalRawHours: 8844.88, expectedTotalExpectedHours: 8844.88, expectedTotalLaborCostCents: 98_302_667, expectedTotalManualCostCents: 0, expectedTotalCostCents: 98_302_667, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-03", expectedTotalRawHours: 14098.1, expectedTotalExpectedHours: 14098.1, expectedTotalLaborCostCents: 137_706_815, expectedTotalManualCostCents: 0, expectedTotalCostCents: 137_706_815, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-04", expectedTotalRawHours: 10961.95, expectedTotalExpectedHours: 10961.95, expectedTotalLaborCostCents: 123_825_907, expectedTotalManualCostCents: 0, expectedTotalCostCents: 123_825_907, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-05", expectedTotalRawHours: 6825.8, expectedTotalExpectedHours: 6825.8, expectedTotalLaborCostCents: 86_607_492, expectedTotalManualCostCents: 0, expectedTotalCostCents: 86_607_492, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-06", expectedTotalRawHours: 8682.64, expectedTotalExpectedHours: 8682.64, expectedTotalLaborCostCents: 90_559_888, expectedTotalManualCostCents: 0, expectedTotalCostCents: 90_559_888, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-07", expectedTotalRawHours: 12871.6, expectedTotalExpectedHours: 12871.6, expectedTotalLaborCostCents: 140_994_839, expectedTotalManualCostCents: 0, expectedTotalCostCents: 140_994_839, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
  { archetypeCode: "ARCH-08", expectedTotalRawHours: 22694.4, expectedTotalExpectedHours: 22694.4, expectedTotalLaborCostCents: 251_365_272, expectedTotalManualCostCents: 0, expectedTotalCostCents: 251_365_272, expectedGapCount: 0, expectedRangePolicyCode: "RANGE-STANDARD" },
];

describe.each(GOLDEN_CASES)("golden fixture — $archetypeCode", (goldenCase: GoldenCase) => {
  function buildInput(): EffortEngineInput {
    return {
      archetypeCode: goldenCase.archetypeCode,
      tenantKey: "golden-fixture-tenant",
      scenarioKey: "traditional",
      scopeDrivers: scopeDriversFor(goldenCase.archetypeCode),
      rates: ratesFor(goldenCase.archetypeCode),
    };
  }

  it("produces EXACTLY the same line items and totals on a second run (determinism)", () => {
    const input = buildInput();
    const first = assertDeterministicRecomputation(() => runEffortEngine(pack, input));
    const second = runEffortEngine(pack, input);
    expect(second).toEqual(first);
  });

  it("matches the pinned totals", () => {
    const output = runEffortEngine(pack, buildInput());
    expect(output.totals.totalRawHours).toBe(goldenCase.expectedTotalRawHours);
    expect(output.totals.totalExpectedHours).toBe(goldenCase.expectedTotalExpectedHours);
    expect(output.totals.totalLaborCostCents).toBe(goldenCase.expectedTotalLaborCostCents);
    expect(output.totals.totalManualCostCents).toBe(goldenCase.expectedTotalManualCostCents);
    expect(output.totals.totalCostCents).toBe(goldenCase.expectedTotalCostCents);
    expect(output.totals.gapCount).toBe(goldenCase.expectedGapCount);
  });

  it("every line carries non-empty formula provenance", () => {
    const output = runEffortEngine(pack, buildInput());
    expect(output.lineItems.length).toBeGreaterThan(0);
    for (const line of output.lineItems) {
      expect(line.formulaTrace.length).toBeGreaterThan(0);
      expect(line.modelVersion).toBe(pack.modelVersion);
    }
  });

  it("low <= expected <= high holds for the range-policy-applied total", () => {
    const output = runEffortEngine(pack, buildInput());
    const range = computeRange(RANGE_INPUTS, output.totals.totalCostCents, pack.rangePolicies);
    expect(range.policyCode).toBe(goldenCase.expectedRangePolicyCode);
    expect(() => assertLowExpectedHighInvariant(range)).not.toThrow();
    expect(range.lowCents).toBeLessThanOrEqual(range.expectedCents);
    expect(range.expectedCents).toBeLessThanOrEqual(range.highCents);
  });
});
