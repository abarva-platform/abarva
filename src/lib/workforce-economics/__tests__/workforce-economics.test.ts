// Workforce Economics estimate-twice engine — contract tests.
//
// Pins the WE-2 capacity model against the workbook's worked example (the
// `Estimation Engine` / `Business Case` sheets of
// docs/workforce-economics/Workforce_Taxonomy_Master.xlsx — the "Customer Data
// Product Program"):
//
//   • 10 WBS categories summing to W = 13,000 effort hours
//   • geo mix 40% onshore / 60% offshore
//     onshore = Senior market base $180 × SI-T1 1.25            = $225.00/hr
//     offshore = $180 × SI-T2 0.85 × offshore-shore 0.45        = $68.85/hr
//     blended = 0.40×225 + 0.60×68.85                           = $131.31/hr
//   • Traditional: 18 humans            → $1,707,030  (≈ $1.71M)
//   • AI-Native:   8 humans + 12 "AbarVa Agents" (equiv-FTE 1.85, util 0.72,
//     $42,000/yr) — cheaper, faster, and a productivity multiple > 1.
//
// The traditional cost is the deterministic anchor the workbook publishes
// ($1.71M); the AI-native figures follow from the WE-2 capacity formula
// exactly. The assertions below assert that formula, not a hand-narrated point.

import {
  computeWorkforceEstimate,
  type EstimateCategory,
  type WorkforceEstimateInput,
} from '../workforce-economics';

// The workbook's worked-example WBS (effort hours by estimate category).
const WORKED_EXAMPLE_WBS: Array<{ category: EstimateCategory; effortHours: number }> = [
  { category: 'business_analysis', effortHours: 1200 },
  { category: 'architecture', effortHours: 1400 },
  { category: 'engineering', effortHours: 4500 },
  { category: 'testing', effortHours: 2200 },
  { category: 'security', effortHours: 600 },
  { category: 'training', effortHours: 500 },
  { category: 'change_management', effortHours: 500 },
  { category: 'deployment', effortHours: 700 },
  { category: 'governance', effortHours: 400 },
  { category: 'program_management', effortHours: 1000 },
];

function workedExampleInput(): WorkforceEstimateInput {
  return {
    scopeLabel: 'Customer Data Product Program',
    deliveryPodLabel: 'Data Product Pod',
    wbs: WORKED_EXAMPLE_WBS,
    geoMix: {
      onshoreFraction: 0.4,
      offshoreFraction: 0.6,
      onshoreRatePerHour: 180 * 1.25, // Senior $180 × SI-T1 1.25 = 225
      offshoreRatePerHour: 180 * 0.85 * 0.45, // × SI-T2 0.85 × offshore 0.45 = 68.85
    },
    agentPlatform: {
      label: 'AbarVa Agents',
      equivFtePerAgent: 1.85,
      utilization: 0.72,
      annualCost: 42000, // $3,500/mo × 12
    },
    team: {
      traditionalHumans: 18,
      aiNativeHumans: 8,
      aiNativeAgents: 12,
    },
    hoursPerFteMonth: 173,
  };
}

describe('computeWorkforceEstimate — estimate-twice capacity model', () => {
  const result = computeWorkforceEstimate(workedExampleInput());

  it('sums the WBS to W = 13,000 effort hours', () => {
    expect(result.totalEffortHours).toBe(13000);
  });

  it('computes the blended geo/shore rate as $131.31/hr', () => {
    expect(result.blendedRatePerHour).toBeCloseTo(131.31, 2);
  });

  it('produces the workbook traditional cost of ~$1.71M', () => {
    // W (13,000) × blended ($131.31) = $1,707,030.
    expect(result.traditional.totalCost).toBe(1_707_030);
    expect(result.traditional.humanHoursBilled).toBe(13000);
    expect(result.traditional.agentCost).toBe(0);
    expect(result.traditional.humans).toBe(18);
  });

  it('AI-native is CHEAPER than traditional by the modelled factor', () => {
    expect(result.aiNative.totalCost).toBeLessThan(result.traditional.totalCost);
    // delta.costSaving = traditional - ai_native, exactly.
    expect(result.delta.costSaving).toBe(
      result.traditional.totalCost - result.aiNative.totalCost,
    );
    // The workbook's worked example lands well over a 50% reduction.
    expect(result.delta.costReductionPct).toBeGreaterThan(0.5);
  });

  it('AI-native is NOT slower (capacity model, not effort compression)', () => {
    expect(result.aiNative.durationMonths).toBeLessThan(
      result.traditional.durationMonths,
    );
    expect(result.delta.monthsSaved).toBeGreaterThan(0);
  });

  it('agents add parallel capacity priced by subscription, not human rate', () => {
    // agentCapacity = 12 × 1.85 × 0.72 = 15.984 FTE-equiv on top of 8 humans.
    expect(result.aiNative.effectiveCapacityFte).toBeCloseTo(23.98, 2);
    // Agent cost is a subscription slice, far below the human labour cost.
    expect(result.aiNative.agentCost).toBeGreaterThan(0);
    expect(result.aiNative.agentCost).toBeLessThan(result.aiNative.humanCost);
  });

  it('reports a productivity gain multiple > 1', () => {
    expect(result.delta.productivityGain).toBeGreaterThan(1);
    // productivity = W / ai human hours; with these inputs ≈ 3.0.
    expect(result.delta.productivityGain).toBeCloseTo(3.0, 1);
  });

  it('the delta is internally consistent with the two scenarios', () => {
    expect(result.delta.headcountReduction).toBe(18 - 8);
    // monthsSaved is rounded from the RAW month difference; it must agree with
    // the displayed (already-rounded) durations to within one rounding step.
    const displayedDiff =
      result.traditional.durationMonths - result.aiNative.durationMonths;
    // One rounding step of tolerance (plus FP slack): monthsSaved rounds the
    // raw difference, while displayedDiff subtracts two already-rounded values.
    expect(Math.abs(result.delta.monthsSaved - displayedDiff)).toBeLessThan(0.11);
    expect(result.delta.monthsSaved).toBeGreaterThan(0);
  });

  it('populates an honest assumptions / confidence block', () => {
    const a = result.assumptions;
    expect(a.confidence).toBe('medium');
    expect(a.drivers.length).toBeGreaterThanOrEqual(4);
    expect(a.caveats.length).toBeGreaterThanOrEqual(3);
    // Caveats must call the figures planning estimates, not quotes.
    expect(a.caveats.join(' ').toLowerCase()).toContain('not a quote');
    // The agent-capacity planning RANGE is populated and the conservative
    // bound is below the modelled point (an honest haircut).
    expect(a.agentCapacityRange.conservative).toBeLessThan(
      a.agentCapacityRange.modelled,
    );
    expect(a.agentCapacityRange.modelled).toBeCloseTo(15.98, 2);
  });
});

describe('computeWorkforceEstimate — guards + determinism', () => {
  it('is deterministic — same input yields identical output', () => {
    const a = computeWorkforceEstimate(workedExampleInput());
    const b = computeWorkforceEstimate(workedExampleInput());
    expect(a).toEqual(b);
  });

  it('normalizes a geo mix that does not sum to 1 and records a note', () => {
    const input = workedExampleInput();
    input.geoMix.onshoreFraction = 0.5;
    input.geoMix.offshoreFraction = 0.7; // sums to 1.2
    const result = computeWorkforceEstimate(input);
    expect(result.assumptions.notes.some((n) => n.includes('normalized'))).toBe(
      true,
    );
  });

  it('throws on an empty WBS rather than fabricating a number', () => {
    const input = workedExampleInput();
    input.wbs = [];
    expect(() => computeWorkforceEstimate(input)).toThrow(RangeError);
  });

  it('throws when AI-native has neither humans nor agent capacity', () => {
    const input = workedExampleInput();
    input.team.aiNativeHumans = 0;
    input.team.aiNativeAgents = 0;
    expect(() => computeWorkforceEstimate(input)).toThrow(RangeError);
  });
});
