// Expert Kernel — unit tests, critic loop, qa-rubric, and golden / adversarial
// cases. Every module is pure and deterministic; these tests assert behaviour,
// not snapshots.

import { buildBaselineModel, recordedMetric } from '../baseline-model';
import { buildAssumptionLedger } from '../assumption-ledger';
import { buildEffortEstimate, type WorkstreamInput } from '../effort-estimator';
import { buildValueForecast, DEFAULT_HAIRCUT_WEIGHTS } from '../value-forecast';
import { runCritic } from '../critic';
import { compileBusinessCase } from '../business-case-compiler';
import { evaluateRubric } from '../qa-rubric';
import { buildApexContactCenterCase } from '../apex-contact-center-case';
import { rangeOf, sumRanges, addRanges } from '../types';
import type { RoleRateCard } from '@/lib/source/should-cost/should-cost-model';

const RATE_CARD: RoleRateCard[] = [
  { role: 'solution_architect', onshoreAnnualRate: 240_000, offshoreAnnualRate: 130_000 },
  { role: 'senior_engineer', onshoreAnnualRate: 200_000, offshoreAnnualRate: 95_000 },
  { role: 'engineer', onshoreAnnualRate: 150_000, offshoreAnnualRate: 70_000 },
  { role: 'analyst', onshoreAnnualRate: 120_000, offshoreAnnualRate: 60_000 },
  { role: 'project_manager', onshoreAnnualRate: 170_000, offshoreAnnualRate: 90_000 },
];

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------

describe('types — range arithmetic', () => {
  it('rangeOf derives the midpoint', () => {
    expect(rangeOf(10, 30)).toEqual({ low: 10, point: 20, high: 30 });
  });
  it('addRanges and sumRanges are component-wise', () => {
    const a = rangeOf(1, 3);
    const b = rangeOf(2, 4);
    expect(addRanges(a, b)).toEqual({ low: 3, point: 5, high: 7 });
    expect(sumRanges([a, b, rangeOf(0, 0)])).toEqual({ low: 3, point: 5, high: 7 });
  });
});

// ---------------------------------------------------------------------------
// baseline-model
// ---------------------------------------------------------------------------

describe('baseline-model', () => {
  it('separates recorded metrics from seed gaps and computes coverage', () => {
    const model = buildBaselineModel({
      moveName: 'M',
      tenantKey: 't',
      metrics: [
        {
          key: 'a',
          label: 'A',
          value: 10,
          unit: 'x',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
        {
          key: 'b',
          label: 'B',
          value: null,
          unit: 'x',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-01-01',
          confidence: 'low',
          seedGapReason: 'not recorded',
        },
      ],
    });
    expect(model.recordedMetrics).toHaveLength(1);
    expect(model.seedGaps).toHaveLength(1);
    expect(model.coverage).toBe(0.5);
    expect(model.weakestConfidence).toBe('high');
    expect(recordedMetric(model, 'a')?.value).toBe(10);
    expect(recordedMetric(model, 'b')).toBeNull();
  });

  it('rejects a missing value with no seed-gap reason (honesty rule)', () => {
    expect(() =>
      buildBaselineModel({
        moveName: 'M',
        tenantKey: 't',
        metrics: [
          {
            key: 'a',
            label: 'A',
            value: null,
            unit: 'x',
            source: 's',
            sourceQuality: 'absent',
            asOf: '2026-01-01',
            confidence: 'low',
          },
        ],
      }),
    ).toThrow(/seedGapReason/);
  });

  it('rejects a recorded value flagged as absent', () => {
    expect(() =>
      buildBaselineModel({
        moveName: 'M',
        tenantKey: 't',
        metrics: [
          {
            key: 'a',
            label: 'A',
            value: 5,
            unit: 'x',
            source: 's',
            sourceQuality: 'absent',
            asOf: '2026-01-01',
            confidence: 'low',
          },
        ],
      }),
    ).toThrow(/cannot also be a seed gap/);
  });
});

// ---------------------------------------------------------------------------
// assumption-ledger
// ---------------------------------------------------------------------------

describe('assumption-ledger', () => {
  const inputs = [
    {
      key: 'low1',
      statement: 'low impact',
      owner: 'O',
      confidence: 'high' as const,
      source: 's',
      sensitivityImpact: 'low' as const,
    },
    {
      key: 'high1',
      statement: 'high impact, low confidence',
      owner: 'O',
      confidence: 'low' as const,
      source: 's',
      sensitivityImpact: 'high' as const,
      isSeedGapProxy: true,
    },
    {
      key: 'high2',
      statement: 'high impact, high confidence',
      owner: 'O',
      confidence: 'high' as const,
      source: 's',
      sensitivityImpact: 'high' as const,
    },
    {
      key: 'med1',
      statement: 'medium impact',
      owner: 'O',
      confidence: 'medium' as const,
      source: 's',
      sensitivityImpact: 'medium' as const,
    },
  ];

  it('ranks by impact, then by lower confidence', () => {
    const ledger = buildAssumptionLedger(inputs);
    expect(ledger.byImpact.map((a) => a.key)).toEqual([
      'high1',
      'high2',
      'med1',
      'low1',
    ]);
    expect(ledger.topMovers.map((a) => a.key)).toEqual(['high1', 'high2', 'med1']);
    expect(ledger.seedGapProxies.map((a) => a.key)).toEqual(['high1']);
  });

  it('rejects duplicate keys and empty statements', () => {
    expect(() =>
      buildAssumptionLedger([inputs[0], inputs[0]]),
    ).toThrow(/Duplicate/);
    expect(() =>
      buildAssumptionLedger([{ ...inputs[0], statement: '  ' }]),
    ).toThrow(/empty statement/);
  });
});

// ---------------------------------------------------------------------------
// effort-estimator
// ---------------------------------------------------------------------------

describe('effort-estimator', () => {
  it('estimates workstreams with base/conservative/upside and human/agent split', () => {
    const effort = buildEffortEstimate({
      moveName: 'M',
      rateCard: RATE_CARD,
      offshoreRatio: 0.5,
      workstreams: [
        {
          id: 'ai_build',
          durationMonths: 12,
          agentSplit: 0.4,
          roleMix: [{ role: 'senior_engineer', headcount: 2 }],
        },
        {
          id: 'change_adoption',
          durationMonths: 12,
          agentSplit: 0,
          roleMix: [{ role: 'project_manager', headcount: 1 }],
        },
      ],
    });
    expect(effort.workstreams).toHaveLength(2);
    // Conservative is above base; upside is below base.
    const ws = effort.workstreams[0];
    expect(ws.cost.high).toBeGreaterThan(ws.baseCost);
    expect(ws.cost.low).toBeLessThan(ws.baseCost);
    expect(ws.cost.point).toBe(ws.baseCost);
    // Human + agent cost sum to base.
    expect(ws.humanCost + ws.agentCost).toBeCloseTo(ws.baseCost, 2);
    // Total point is the summed base.
    expect(effort.totalCost.point).toBeCloseTo(
      effort.workstreams.reduce((s, w) => s + w.baseCost, 0),
      2,
    );
    expect(effort.effectiveAgentSplit).toBeGreaterThan(0);
    expect(effort.effectiveAgentSplit).toBeLessThan(0.4);
  });

  it('is deterministic — same input, same output', () => {
    const input = {
      moveName: 'M',
      rateCard: RATE_CARD,
      offshoreRatio: 0.3,
      workstreams: [
        {
          id: 'integration' as const,
          durationMonths: 6,
          agentSplit: 0.2,
          roleMix: [{ role: 'engineer' as const, headcount: 3 }],
        },
      ],
    };
    expect(buildEffortEstimate(input)).toEqual(buildEffortEstimate(input));
  });

  it('rejects an agentSplit outside 0..1', () => {
    expect(() =>
      buildEffortEstimate({
        moveName: 'M',
        rateCard: RATE_CARD,
        offshoreRatio: 0.3,
        workstreams: [
          {
            id: 'run',
            durationMonths: 12,
            agentSplit: 1.5,
            roleMix: [{ role: 'engineer', headcount: 1 }],
          },
        ],
      }),
    ).toThrow(/agentSplit/);
  });
});

// ---------------------------------------------------------------------------
// value-forecast — the haircut model
// ---------------------------------------------------------------------------

describe('value-forecast — haircut model', () => {
  it('applies zero haircut only when every score is perfect', () => {
    const f = buildValueForecast({
      moveName: 'M',
      grossAnnualValue: rangeOf(100, 200),
      horizonYears: 1,
      adoptionCurve: [1],
      haircutScores: {
        adoptionRisk: 1,
        dataReadiness: 1,
        processDependency: 1,
        integrationComplexity: 1,
        controlBurden: 1,
        sponsorStrength: 1,
      },
    });
    expect(f.totalHaircut).toBe(0);
    expect(f.totalNetValue).toEqual(f.totalGrossValue);
  });

  it('NEVER returns raw optimism — net is always <= gross when scores imperfect', () => {
    const f = buildValueForecast({
      moveName: 'M',
      grossAnnualValue: rangeOf(1_000, 2_000),
      horizonYears: 2,
      adoptionCurve: [0.5, 1],
      haircutScores: {
        adoptionRisk: 0.5,
        dataReadiness: 0.4,
        processDependency: 0.6,
        integrationComplexity: 0.7,
        controlBurden: 0.5,
        sponsorStrength: 0.8,
      },
    });
    expect(f.totalHaircut).toBeGreaterThan(0);
    expect(f.totalNetValue.point).toBeLessThan(f.totalGrossValue.point);
    expect(f.retainedFraction).toBeCloseTo(1 - f.totalHaircut, 6);
  });

  it('weights sum to 1 by construction', () => {
    const sum = Object.values(DEFAULT_HAIRCUT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('rejects an adoption curve that mismatches the horizon', () => {
    expect(() =>
      buildValueForecast({
        moveName: 'M',
        grossAnnualValue: rangeOf(1, 2),
        horizonYears: 3,
        adoptionCurve: [1, 1],
        haircutScores: {
          adoptionRisk: 1,
          dataReadiness: 1,
          processDependency: 1,
          integrationComplexity: 1,
          controlBurden: 1,
          sponsorStrength: 1,
        },
      }),
    ).toThrow(/adoptionCurve length/);
  });
});

// ---------------------------------------------------------------------------
// critic loop
// ---------------------------------------------------------------------------

function buildScenario(opts: {
  haircutScore?: number;
  monetisationBlocked?: boolean;
  includeChange?: boolean;
  includeRun?: boolean;
  baselineGap?: boolean;
}) {
  const baseline = buildBaselineModel({
    moveName: 'M',
    tenantKey: 't',
    metrics: [
      {
        key: 'm1',
        label: 'M1',
        value: 10,
        unit: 'x',
        source: 's',
        sourceQuality: 'measured',
        asOf: '2026-01-01',
        confidence: 'high',
      },
      ...(opts.baselineGap
        ? [
            {
              key: 'm2',
              label: 'M2',
              value: null,
              unit: 'x',
              source: 'seed gap',
              sourceQuality: 'absent' as const,
              asOf: '2026-01-01',
              confidence: 'low' as const,
              seedGapReason: 'not recorded',
            },
          ]
        : []),
    ],
  });
  const assumptions = buildAssumptionLedger([
    {
      key: 'a1',
      statement: 'an assumption',
      owner: 'Owner One',
      confidence: 'medium',
      source: 's',
      sensitivityImpact: 'high',
      isSeedGapProxy: opts.baselineGap ?? false,
    },
  ]);
  const workstreams: WorkstreamInput[] = [
    {
      id: 'ai_build',
      durationMonths: 6,
      agentSplit: 0.3,
      roleMix: [{ role: 'engineer', headcount: 2 }],
    },
  ];
  if (opts.includeChange !== false) {
    workstreams.push({
      id: 'change_adoption',
      durationMonths: 6,
      agentSplit: 0.1,
      roleMix: [{ role: 'analyst', headcount: 1 }],
    });
  }
  if (opts.includeRun !== false) {
    workstreams.push({
      id: 'run',
      durationMonths: 12,
      agentSplit: 0.3,
      roleMix: [{ role: 'engineer', headcount: 1 }],
    });
  }
  const effort = buildEffortEstimate({
    moveName: 'M',
    rateCard: RATE_CARD,
    offshoreRatio: 0.4,
    workstreams,
  });
  const score = opts.haircutScore ?? 0.6;
  const value = buildValueForecast({
    moveName: 'M',
    grossAnnualValue: rangeOf(5_000_000, 9_000_000),
    horizonYears: 3,
    adoptionCurve: [0.4, 0.8, 1],
    grossValueIsProxy: opts.monetisationBlocked ?? false,
    haircutScores: {
      adoptionRisk: score,
      dataReadiness: score,
      processDependency: score,
      integrationComplexity: score,
      controlBurden: score,
      sponsorStrength: score,
    },
  });
  return { baseline, assumptions, effort, value };
}

describe('critic loop', () => {
  it('raises a CFO blocker when monetisation is blocked', () => {
    const report = runCritic(buildScenario({ monetisationBlocked: true }));
    expect(report.hasBlocker).toBe(true);
    expect(report.blockers.some((b) => b.code === 'cfo_monetisation_blocked')).toBe(
      true,
    );
  });

  it('raises a delivery concern when change and run effort are absent', () => {
    const report = runCritic(
      buildScenario({ includeChange: false, includeRun: false }),
    );
    expect(report.concerns.some((c) => c.code === 'delivery_no_change_effort')).toBe(
      true,
    );
    expect(report.concerns.some((c) => c.code === 'delivery_no_run_cost')).toBe(
      true,
    );
  });

  it('raises a data finding when the baseline has seed gaps', () => {
    const report = runCritic(buildScenario({ baselineGap: true }));
    expect(report.findings.some((f) => f.code === 'data_baseline_seed_gaps')).toBe(
      true,
    );
    expect(report.findings.some((f) => f.code === 'data_top_mover_is_proxy')).toBe(
      true,
    );
  });

  it('raises a light-haircut concern when the haircut is implausibly small', () => {
    const report = runCritic(buildScenario({ haircutScore: 0.97 }));
    expect(report.concerns.some((c) => c.code === 'cfo_haircut_too_light')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// qa-rubric
// ---------------------------------------------------------------------------

describe('qa-rubric', () => {
  it('passes a well-formed monetisable skeleton', () => {
    const s = compileBusinessCase({
      ...buildScenario({ haircutScore: 0.7 }),
      towerHandoff: [
        {
          metricKey: 'm1',
          metricLabel: 'M1',
          baselineValue: 10,
          targetValue: 8,
          unit: 'x',
          readinessNote: 'ok',
        },
      ],
    });
    const rubric = evaluateRubric(s);
    expect(rubric.passed).toBe(true);
    expect(rubric.failCount).toBe(0);
  });

  it('enforces the honesty rule: blocker cannot coexist with fund', () => {
    const s = compileBusinessCase({
      ...buildScenario({ monetisationBlocked: true }),
      towerHandoff: [
        {
          metricKey: 'm1',
          metricLabel: 'M1',
          baselineValue: 10,
          targetValue: 8,
          unit: 'x',
          readinessNote: 'ok',
        },
      ],
    });
    // With a blocker, the recommendation must not be 'fund'.
    expect(s.recommendation).not.toBe('fund');
    const rubric = evaluateRubric(s);
    expect(
      rubric.checks.find((c) => c.id === 'honesty_blocker_not_funded')?.passed,
    ).toBe(true);
    // Monetisation blocked → payback must be null.
    expect(s.economics.paybackMonths).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GOLDEN cases
// ---------------------------------------------------------------------------

describe('GOLDEN — healthy, well-grounded case', () => {
  it('a strong case with positive downside is recommended fund', () => {
    const s = compileBusinessCase({
      ...buildScenario({ haircutScore: 0.85 }),
      towerHandoff: [
        {
          metricKey: 'm1',
          metricLabel: 'M1',
          baselineValue: 10,
          targetValue: 8,
          unit: 'x',
          readinessNote: 'ok',
        },
      ],
    });
    expect(s.economics.netReturn.point).toBeGreaterThan(0);
    expect(s.economics.netReturn.low).toBeGreaterThanOrEqual(0);
    expect(s.recommendation).toBe('fund');
    expect(s.economics.paybackMonths).not.toBeNull();
    expect(evaluateRubric(s).passed).toBe(true);
  });
});

describe('GOLDEN — the real Apex Contact Center case', () => {
  it('builds, grounds on audited substrate, and passes the rubric', () => {
    const { skeleton, rubric } = buildApexContactCenterCase();
    expect(skeleton.tenantKey).toBe('apex-retail');
    expect(skeleton.moveName).toBe('Contact Center AI Routing');
    // Six recorded baseline metrics, four declared seed gaps.
    expect(skeleton.baseline.recordedMetrics).toHaveLength(6);
    expect(skeleton.baseline.seedGaps).toHaveLength(4);
    expect(skeleton.baseline.seedGaps.every((g) => g.seedGapReason)).toBe(true);
    // Eight workstreams.
    expect(skeleton.effort.workstreams).toHaveLength(8);
    // Monetisation is honestly blocked (cost-per-contact is a seed gap).
    expect(skeleton.economics.monetisable).toBe(false);
    expect(skeleton.economics.paybackMonths).toBeNull();
    // The critic raised the monetisation blocker.
    expect(skeleton.critic.hasBlocker).toBe(true);
    // Therefore the recommendation is NOT fund.
    expect(skeleton.recommendation).not.toBe('fund');
    // Tower handoff names the seed gap explicitly.
    expect(
      skeleton.towerHandoff.some((h) => h.metricKey === 'cost_per_contact_usd'),
    ).toBe(true);
    // The rubric passes — the skeleton is well-formed and honest.
    expect(rubric.passed).toBe(true);
  });

  it('is deterministic — repeated builds are identical', () => {
    expect(buildApexContactCenterCase()).toEqual(buildApexContactCenterCase());
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL cases
// ---------------------------------------------------------------------------

describe('ADVERSARIAL — thin-data trap', () => {
  it('a case with mostly-missing baseline is flagged, not silently passed', () => {
    const baseline = buildBaselineModel({
      moveName: 'Thin',
      tenantKey: 't',
      metrics: [
        {
          key: 'k1',
          label: 'K1',
          value: 1,
          unit: 'x',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
        {
          key: 'k2',
          label: 'K2',
          value: null,
          unit: 'x',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-01-01',
          confidence: 'low',
          seedGapReason: 'not recorded',
        },
        {
          key: 'k3',
          label: 'K3',
          value: null,
          unit: 'x',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-01-01',
          confidence: 'low',
          seedGapReason: 'not recorded',
        },
      ],
    });
    // Coverage 1/3 < 0.6 → the data challenge escalates to a BLOCKER.
    expect(baseline.coverage).toBeCloseTo(0.33, 2);
    const report = runCritic({
      baseline,
      assumptions: buildAssumptionLedger([
        {
          key: 'a',
          statement: 'a',
          owner: 'O',
          confidence: 'low',
          source: 's',
          sensitivityImpact: 'high',
        },
      ]),
      effort: buildEffortEstimate({
        moveName: 'Thin',
        rateCard: RATE_CARD,
        offshoreRatio: 0.4,
        workstreams: [
          {
            id: 'ai_build',
            durationMonths: 6,
            agentSplit: 0.3,
            roleMix: [{ role: 'engineer', headcount: 1 }],
          },
        ],
      }),
      value: buildValueForecast({
        moveName: 'Thin',
        grossAnnualValue: rangeOf(100, 200),
        horizonYears: 1,
        adoptionCurve: [1],
        haircutScores: {
          adoptionRisk: 0.5,
          dataReadiness: 0.5,
          processDependency: 0.5,
          integrationComplexity: 0.5,
          controlBurden: 0.5,
          sponsorStrength: 0.5,
        },
      }),
    });
    expect(report.hasBlocker).toBe(true);
    expect(
      report.blockers.some((b) => b.code === 'data_baseline_seed_gaps'),
    ).toBe(true);
  });
});

describe('ADVERSARIAL — optimism trap', () => {
  it('an inflated near-zero-haircut, no-change-budget case is NOT recommended fund', () => {
    const baseline = buildBaselineModel({
      moveName: 'Optimism',
      tenantKey: 't',
      metrics: [
        {
          key: 'k1',
          label: 'K1',
          value: 1,
          unit: 'x',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
      ],
    });
    // Optimism trap: every haircut score near-perfect AND no change/run budget.
    const value = buildValueForecast({
      moveName: 'Optimism',
      grossAnnualValue: rangeOf(20_000_000, 40_000_000),
      horizonYears: 3,
      adoptionCurve: [1, 1, 1], // instant full adoption — itself optimistic
      haircutScores: {
        adoptionRisk: 0.99,
        dataReadiness: 0.99,
        processDependency: 0.99,
        integrationComplexity: 0.99,
        controlBurden: 0.99,
        sponsorStrength: 0.99,
      },
    });
    const effort = buildEffortEstimate({
      moveName: 'Optimism',
      rateCard: RATE_CARD,
      offshoreRatio: 0.6,
      workstreams: [
        {
          id: 'ai_build',
          durationMonths: 3,
          agentSplit: 0.9, // implausibly high automation
          roleMix: [{ role: 'engineer', headcount: 1 }],
        },
      ],
    });
    const s = compileBusinessCase({
      baseline,
      assumptions: buildAssumptionLedger([
        {
          key: 'a',
          statement: 'a',
          owner: 'O',
          confidence: 'high',
          source: 's',
          sensitivityImpact: 'high',
        },
      ]),
      effort,
      value,
      towerHandoff: [
        {
          metricKey: 'k1',
          metricLabel: 'K1',
          baselineValue: 1,
          targetValue: 0,
          unit: 'x',
          readinessNote: 'ok',
        },
      ],
    });
    // The critic must flag the optimism: light haircut + no change/run budget.
    expect(s.critic.concerns.some((c) => c.code === 'cfo_haircut_too_light')).toBe(
      true,
    );
    expect(
      s.critic.concerns.some((c) => c.code === 'delivery_no_change_effort'),
    ).toBe(true);
    expect(
      s.critic.concerns.some((c) => c.code === 'delivery_no_run_cost'),
    ).toBe(true);
    // Three+ concerns force a "shape", never a clean "fund".
    expect(s.recommendation).toBe('shape');
    // Even so, the value forecast still took a (small) haircut — not raw optimism.
    expect(value.totalHaircut).toBeGreaterThan(0);
  });
});
