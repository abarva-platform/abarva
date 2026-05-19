// Expert Kernel — Design & Plan phase tests.
//
// Covers the roadmap module, the full business-case compiler, the human+agent
// RACI, the rate-card abstraction, and 2 golden + 2 adversarial cases. Every
// module is pure and deterministic; these tests assert behaviour, not
// snapshots.

import {
  buildEffortEstimate,
  resolveRateCard,
  DEFAULT_PLANNING_RATE_CARD,
  BUSINESS_CHANGE_WORKSTREAMS,
  type EffortEstimatorInput,
  type WorkstreamInput,
} from '../effort-estimator';
import { buildRoadmap, type RoadmapPhaseInput } from '../roadmap';
import { buildRaciMatrix, type RaciMatrixInput } from '../raci';
import {
  compileBusinessCase,
  compileFullBusinessCase,
} from '../business-case-compiler';
import { buildBaselineModel } from '../baseline-model';
import { buildAssumptionLedger } from '../assumption-ledger';
import { buildValueForecast } from '../value-forecast';
import { DESIGN_PLAN_PLAYBOOK, killTrigger } from '../phase-playbooks/design-plan';
import { MOBILIZE_PLAYBOOK } from '../phase-playbooks/mobilize';
import type { PhaseTrap, KillTrigger } from '../phase-playbooks/shared-types';
import { buildApexContactCenterFullCase } from '../apex-contact-center-case';
import { rangeOf } from '../types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ALL_WORKSTREAMS: WorkstreamInput[] = [
  { id: 'ai_build', durationMonths: 9, agentSplit: 0.35, roleMix: [{ role: 'senior_engineer', headcount: 2 }] },
  { id: 'integration', durationMonths: 6, agentSplit: 0.2, roleMix: [{ role: 'engineer', headcount: 2 }] },
  { id: 'data', durationMonths: 5, agentSplit: 0.3, roleMix: [{ role: 'analyst', headcount: 2 }] },
  { id: 'foundational', durationMonths: 4, agentSplit: 0.15, roleMix: [{ role: 'solution_architect', headcount: 1 }] },
  { id: 'data_governance', durationMonths: 6, agentSplit: 0.1, roleMix: [{ role: 'analyst', headcount: 1 }] },
  { id: 'process_redesign', durationMonths: 5, agentSplit: 0.1, roleMix: [{ role: 'analyst', headcount: 1.5 }] },
  { id: 'change_adoption', durationMonths: 9, agentSplit: 0.05, roleMix: [{ role: 'project_manager', headcount: 1 }] },
  { id: 'run', durationMonths: 12, agentSplit: 0.4, roleMix: [{ role: 'engineer', headcount: 1 }] },
];

function effort(workstreams = ALL_WORKSTREAMS) {
  const input: EffortEstimatorInput = {
    moveName: 'Test Move',
    rateCard: DEFAULT_PLANNING_RATE_CARD,
    offshoreRatio: 0.4,
    workstreams,
  };
  return buildEffortEstimate(input);
}

function fourPhases(): RoadmapPhaseInput[] {
  return [
    {
      id: 'p0', label: 'Phase 0', order: 0, durationMonths: 5,
      workstreamIds: ['foundational', 'data'], dependsOn: [], isFoundational: true,
      valueMilestone: { statement: 'Foundation', metricKey: null, valueShare: 0 },
    },
    {
      id: 'p1', label: 'Phase 1', order: 1, durationMonths: 7,
      workstreamIds: ['ai_build', 'integration', 'data_governance'], dependsOn: ['p0'], isFoundational: false,
      valueMilestone: { statement: 'Pilot value', metricKey: 'm', valueShare: 0.3 },
    },
    {
      id: 'p2', label: 'Phase 2', order: 2, durationMonths: 6,
      workstreamIds: ['process_redesign'], dependsOn: ['p1'], isFoundational: false,
      valueMilestone: { statement: 'Scale value', metricKey: 'm', valueShare: 0.4 },
    },
    {
      id: 'p3', label: 'Phase 3', order: 3, durationMonths: 12,
      workstreamIds: ['change_adoption', 'run'], dependsOn: ['p2'], isFoundational: false,
      valueMilestone: { statement: 'Run value', metricKey: 'm', valueShare: 0.3 },
    },
  ];
}

// ---------------------------------------------------------------------------
// Rate-card abstraction
// ---------------------------------------------------------------------------

describe('effort-estimator — rate-card abstraction', () => {
  it('resolveRateCard treats a bare array as planning-default', () => {
    const resolved = resolveRateCard(DEFAULT_PLANNING_RATE_CARD.rates);
    expect(resolved.provenance).toBe('planning_default');
    expect(resolved.rates.length).toBeGreaterThan(0);
  });

  it('resolveRateCard preserves a labelled KernelRateCard', () => {
    const card = {
      provenance: 'client_specific' as const,
      label: 'Apex rate card',
      rates: DEFAULT_PLANNING_RATE_CARD.rates,
    };
    expect(resolveRateCard(card)).toBe(card);
  });

  it('the estimate carries the resolved rate card and its provenance', () => {
    const e = effort();
    // The kernel default is the researched 3-D SI benchmark, projected onto
    // the should-cost roles — a planning benchmark, still NOT a quote.
    expect(e.rateCard.provenance).toBe('researched_benchmark');
    expect(e.rateCard.label).toContain('NOT a quote');
    expect(e.rateCard.label.toLowerCase()).toContain('benchmark');
    // Every derived role band is a positive fully-loaded annual rate.
    for (const r of e.rateCard.rates) {
      expect(r.onshoreAnnualRate).toBeGreaterThan(0);
      expect(r.offshoreAnnualRate).toBeGreaterThan(0);
      // Offshore delivery is cheaper than onshore in every cell.
      expect(r.offshoreAnnualRate).toBeLessThan(r.onshoreAnnualRate);
    }
  });
});

// ---------------------------------------------------------------------------
// Shared phase-playbook types
// ---------------------------------------------------------------------------

describe('phase playbooks — shared PhaseTrap / KillTrigger', () => {
  it('Design & Plan and Mobilize traps share one structural shape', () => {
    // A trap from each phase is assignable to the shared `PhaseTrap` — the
    // compiler proves the unification; this asserts the runtime shape too.
    const dpTrap: PhaseTrap = DESIGN_PLAN_PLAYBOOK.traps[0];
    const mobTrap: PhaseTrap = MOBILIZE_PLAYBOOK.traps[0];
    for (const t of [dpTrap, mobTrap]) {
      expect(typeof t.key).toBe('string');
      expect(typeof t.trap).toBe('string');
      expect(typeof t.guard).toBe('string');
    }
  });

  it('Design & Plan and Mobilize kill triggers share one structural shape', () => {
    const dpKill: KillTrigger = DESIGN_PLAN_PLAYBOOK.killTriggers[0];
    const mobKill: KillTrigger = MOBILIZE_PLAYBOOK.killTriggers[0];
    for (const k of [dpKill, mobKill]) {
      expect(typeof k.code).toBe('string');
      expect(typeof k.condition).toBe('string');
      expect(typeof k.fixCondition).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// Build-vs-change split
// ---------------------------------------------------------------------------

describe('effort-estimator — AI-build vs business-change split', () => {
  it('classifies the three change workstreams and computes the fraction', () => {
    const e = effort();
    expect(BUSINESS_CHANGE_WORKSTREAMS.has('process_redesign')).toBe(true);
    expect(BUSINESS_CHANGE_WORKSTREAMS.has('ai_build')).toBe(false);
    expect(e.buildVsChange.aiBuildCost + e.buildVsChange.businessChangeCost)
      .toBeCloseTo(e.totalCost.point, 0);
    expect(e.buildVsChange.businessChangeFraction).toBeGreaterThan(0);
  });

  it('flags an under-budgeted change split', () => {
    const e = effort([
      { id: 'ai_build', durationMonths: 9, agentSplit: 0.3, roleMix: [{ role: 'senior_engineer', headcount: 10 }] },
      { id: 'change_adoption', durationMonths: 2, agentSplit: 0, roleMix: [{ role: 'analyst', headcount: 0.2 }] },
    ]);
    expect(e.buildVsChange.businessChangeFraction).toBeLessThan(0.2);
    expect(e.buildVsChange.note).toContain('under-budgeting');
  });
});

// ---------------------------------------------------------------------------
// Roadmap
// ---------------------------------------------------------------------------

describe('roadmap — buildRoadmap', () => {
  it('costs phases, sums to the effort total, identifies foundational + first-value', () => {
    const e = effort();
    const r = buildRoadmap({
      moveName: 'Test Move', effort: e, steadyStateAnnualValue: 1_000_000, phases: fourPhases(),
    });
    expect(r.phases).toHaveLength(4);
    expect(r.totalCost.point).toBeCloseTo(e.totalCost.point, 0);
    expect(r.foundationalPhaseIds).toEqual(['p0']);
    expect(r.firstValuePhaseId).toBe('p1');
    expect(r.totalAiBuildCost + r.totalBusinessChangeCost)
      .toBeCloseTo(r.totalCost.point, 0);
  });

  it('flags a roadmap with no value milestone as a blocker', () => {
    const e = effort();
    const phases = fourPhases().map((p) => ({
      ...p, valueMilestone: { ...p.valueMilestone, valueShare: 0 },
    }));
    const r = buildRoadmap({
      moveName: 'X', effort: e, steadyStateAnnualValue: 1_000_000, phases,
    });
    expect(r.flags.some((f) => f.code === 'roadmap_no_value_milestone' && f.severity === 'blocker')).toBe(true);
  });

  it('throws when a workstream is claimed by two phases', () => {
    const e = effort();
    const phases = fourPhases();
    phases[1].workstreamIds.push('foundational');
    expect(() => buildRoadmap({
      moveName: 'X', effort: e, steadyStateAnnualValue: 1_000, phases,
    })).toThrow(/claimed by more than one phase/);
  });

  it('throws when value shares sum above 1', () => {
    const e = effort();
    const phases = fourPhases();
    phases[1].valueMilestone.valueShare = 0.9;
    expect(() => buildRoadmap({
      moveName: 'X', effort: e, steadyStateAnnualValue: 1_000, phases,
    })).toThrow(/cannot.*exceed 1/);
  });

  it('flags a foundational phase sequenced after its dependent', () => {
    const e = effort();
    const phases = fourPhases();
    // p1 depends on p0, but make p0 a later order than p1.
    phases[0].order = 5;
    const r = buildRoadmap({
      moveName: 'X', effort: e, steadyStateAnnualValue: 1_000_000, phases,
    });
    expect(r.flags.some((f) => f.code === 'roadmap_foundational_after_dependent')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// RACI
// ---------------------------------------------------------------------------

const VALID_RACI: RaciMatrixInput = {
  moveName: 'Test Move',
  parties: [
    { id: 'cio', name: 'CIO', kind: 'human' },
    { id: 'lead', name: 'Lead', kind: 'human' },
    { id: 'agent', name: 'Build Agent', kind: 'agent' },
  ],
  decisions: [
    {
      key: 'd_fund', decision: 'Fund', kind: 'governance',
      assignments: [
        { partyId: 'cio', role: 'accountable' },
        { partyId: 'lead', role: 'responsible' },
      ],
    },
    {
      key: 'd_build', decision: 'Build', kind: 'delivery',
      assignments: [
        { partyId: 'lead', role: 'accountable' },
        { partyId: 'agent', role: 'responsible' },
      ],
      agentAutonomy: 'act_with_approval',
    },
  ],
};

describe('raci — buildRaciMatrix', () => {
  it('a well-formed matrix is valid with no violations', () => {
    const m = buildRaciMatrix(VALID_RACI);
    expect(m.valid).toBe(true);
    expect(m.violations).toHaveLength(0);
    expect(m.agentResponsibleDecisions.map((d) => d.key)).toEqual(['d_build']);
  });

  it('flags an agent accountable for a governance decision', () => {
    const m = buildRaciMatrix({
      ...VALID_RACI,
      decisions: [{
        key: 'd_fund', decision: 'Fund', kind: 'governance',
        assignments: [
          { partyId: 'agent', role: 'accountable' },
          { partyId: 'lead', role: 'responsible' },
        ],
      }],
    });
    expect(m.valid).toBe(false);
    expect(m.violations.some((v) => v.code === 'raci_agent_accountable_governance')).toBe(true);
  });

  it('flags a decision with no accountable and one with two', () => {
    const m = buildRaciMatrix({
      ...VALID_RACI,
      decisions: [
        { key: 'd1', decision: 'No A', kind: 'delivery',
          assignments: [{ partyId: 'lead', role: 'responsible' }] },
        { key: 'd2', decision: 'Two A', kind: 'delivery',
          assignments: [
            { partyId: 'cio', role: 'accountable' },
            { partyId: 'lead', role: 'accountable' },
          ] },
      ],
    });
    expect(m.violations.some((v) => v.code === 'raci_no_accountable')).toBe(true);
    expect(m.violations.some((v) => v.code === 'raci_multiple_accountable')).toBe(true);
  });

  it('flags an agent-responsible decision with undeclared autonomy', () => {
    const m = buildRaciMatrix({
      ...VALID_RACI,
      decisions: [{
        key: 'd_build', decision: 'Build', kind: 'delivery',
        assignments: [
          { partyId: 'lead', role: 'accountable' },
          { partyId: 'agent', role: 'responsible' },
        ],
      }],
    });
    expect(m.violations.some((v) => v.code === 'raci_agent_autonomy_undeclared')).toBe(true);
  });

  it('throws on an unknown party', () => {
    expect(() => buildRaciMatrix({
      ...VALID_RACI,
      decisions: [{
        key: 'd', decision: 'X', kind: 'delivery',
        assignments: [{ partyId: 'ghost', role: 'accountable' }],
      }],
    })).toThrow(/unknown party/);
  });
});

// ---------------------------------------------------------------------------
// Design & Plan playbook
// ---------------------------------------------------------------------------

describe('phase-playbook — design-plan', () => {
  it('exposes a question tree, evidence, traps and kill triggers', () => {
    expect(DESIGN_PLAN_PLAYBOOK.phase).toBe('design_plan');
    expect(DESIGN_PLAN_PLAYBOOK.questionTree.length).toBeGreaterThanOrEqual(5);
    expect(DESIGN_PLAN_PLAYBOOK.killTriggers.length).toBeGreaterThanOrEqual(3);
    expect(DESIGN_PLAN_PLAYBOOK.killTriggers.every((k) => k.fixCondition.length > 0)).toBe(true);
  });

  it('killTrigger looks up by code', () => {
    expect(killTrigger('kill_dp_foundational_unfunded')).not.toBeNull();
    expect(killTrigger('nope')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Full business case — helper to build a skeleton + roadmap + raci
// ---------------------------------------------------------------------------

function buildSkeleton(opts: { monetisable: boolean; thinValue?: boolean }) {
  const baseline = buildBaselineModel({
    moveName: 'Test Move', tenantKey: 'test',
    metrics: [
      { key: 'm1', label: 'Metric 1', value: 10, unit: 'pct', source: 's',
        sourceQuality: 'measured', asOf: '2026-01-01', confidence: 'high' },
    ],
  });
  const assumptions = buildAssumptionLedger([
    { key: 'a1', statement: 'A1', owner: 'O', confidence: 'medium',
      source: 'src', sensitivityImpact: 'high' },
    { key: 'a2', statement: 'A2', owner: 'O', confidence: 'medium',
      source: 'src', sensitivityImpact: 'medium' },
  ]);
  const e = effort();
  const gross = opts.thinValue
    ? rangeOf(400_000, 900_000)
    : rangeOf(20_000_000, 35_000_000);
  const value = buildValueForecast({
    moveName: 'Test Move', grossAnnualValue: gross, horizonYears: 3,
    adoptionCurve: [0.3, 0.7, 0.85],
    grossValueIsProxy: !opts.monetisable,
    haircutScores: {
      adoptionRisk: 0.7, dataReadiness: 0.7, processDependency: 0.7,
      integrationComplexity: 0.7, controlBurden: 0.7, sponsorStrength: 0.8,
    },
  });
  return compileBusinessCase({
    baseline, assumptions, effort: e, value,
    towerHandoff: [{
      metricKey: 'm1', metricLabel: 'Metric 1', baselineValue: 10,
      targetValue: 20, unit: 'pct', readinessNote: 'ok',
    }],
  });
}

// ---------------------------------------------------------------------------
// GOLDEN case 1 — a healthy Move funds.
// ---------------------------------------------------------------------------

describe('GOLDEN 1 — full business case, healthy Move funds', () => {
  it('compiles a fundable full case with positive payback', () => {
    const skeleton = buildSkeleton({ monetisable: true });
    const e = effort();
    const roadmap = buildRoadmap({
      moveName: 'Test Move', effort: e,
      steadyStateAnnualValue: skeleton.valueRange.point / 3, phases: fourPhases(),
    });
    const raci = buildRaciMatrix(VALID_RACI);
    const full = compileFullBusinessCase({ skeleton, roadmap, raci });

    expect(['fund', 'shape']).toContain(full.recommendation);
    expect(full.sensitivity.base.netReturn).toBeGreaterThan(0);
    expect(full.investment.low).toBeLessThanOrEqual(full.investment.point);
    expect(full.investment.point).toBeLessThanOrEqual(full.investment.high);
    expect(full.phaseProfile).toHaveLength(4);
    expect(full.phaseProfile[3].cumulativeInvestment)
      .toBeCloseTo(full.investment.point, 0);
    expect(full.sensitivity.topThreeMovers.length).toBeGreaterThan(0);
    expect(full.sensitivity.whatBreaksTheCase.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GOLDEN case 2 — Apex full case is grounded and rubric-clean.
// ---------------------------------------------------------------------------

describe('GOLDEN 2 — Apex Contact Center full Design & Plan case', () => {
  const { fullCase, roadmap, raci, rubric } = buildApexContactCenterFullCase();

  it('produces a 4-phase costed roadmap with a foundational phase 0', () => {
    expect(roadmap.phases).toHaveLength(4);
    expect(roadmap.foundationalPhaseIds).toContain('p0_foundation');
    expect(roadmap.firstValuePhaseId).toBe('p1_pilot');
  });

  it('the RACI is valid — no agent accountable for governance', () => {
    expect(raci.valid).toBe(true);
    expect(raci.agentResponsibleDecisions.length).toBeGreaterThan(0);
  });

  it('recommends shape (monetisation blocked by the cost-per-contact seed gap)', () => {
    // Apex has a seed-gap proxy on cost-per-contact — the case must not
    // claim a hard payback and must not recommend fund.
    expect(fullCase.recommendation).not.toBe('fund');
    expect(fullCase.skeleton.economics.monetisable).toBe(false);
    expect(fullCase.paybackMonths).toBeNull();
  });

  it('surfaces the build-vs-change split and all flags honestly', () => {
    expect(fullCase.buildVsChange.businessChangeFraction).toBeGreaterThan(0);
    expect(fullCase.flags.length).toBeGreaterThan(0);
    expect(rubric.passed).toBe(true);
  });

  it('is deterministic — two runs are identical', () => {
    const again = buildApexContactCenterFullCase();
    expect(again.fullCase.recommendation).toBe(fullCase.recommendation);
    expect(again.fullCase.investment).toEqual(fullCase.investment);
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL case 1 — thin value: conservative case underwater → not fund.
// ---------------------------------------------------------------------------

describe('ADVERSARIAL 1 — thin value, conservative case underwater', () => {
  it('does not recommend fund when the downside is negative', () => {
    const skeleton = buildSkeleton({ monetisable: true, thinValue: true });
    const e = effort();
    const roadmap = buildRoadmap({
      moveName: 'Test Move', effort: e,
      steadyStateAnnualValue: skeleton.valueRange.point / 3, phases: fourPhases(),
    });
    const raci = buildRaciMatrix(VALID_RACI);
    const full = compileFullBusinessCase({ skeleton, roadmap, raci });

    expect(full.recommendation).not.toBe('fund');
    // Either base is negative (kill) or conservative is negative (shape).
    expect(
      full.sensitivity.base.netReturn <= 0 ||
        full.sensitivity.conservative.netReturn < 0,
    ).toBe(true);
    expect(full.sensitivity.downsideRead.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL case 2 — broken roadmap + RACI cannot be funded.
// ---------------------------------------------------------------------------

describe('ADVERSARIAL 2 — structural blocker downgrades the recommendation', () => {
  it('a roadmap blocker forces shape even when economics are positive', () => {
    const skeleton = buildSkeleton({ monetisable: true });
    const e = effort();
    // A roadmap where no phase produces value — a blocker.
    const noValuePhases = fourPhases().map((p) => ({
      ...p, valueMilestone: { ...p.valueMilestone, valueShare: 0 },
    }));
    const roadmap = buildRoadmap({
      moveName: 'Test Move', effort: e, steadyStateAnnualValue: 1_000_000,
      phases: noValuePhases,
    });
    const raci = buildRaciMatrix(VALID_RACI);
    const full = compileFullBusinessCase({ skeleton, roadmap, raci });

    expect(full.recommendation).toBe('shape');
    expect(full.flags.some((f) => f.includes('roadmap/blocker'))).toBe(true);
  });

  it('a RACI violation forces shape and is surfaced in flags', () => {
    const skeleton = buildSkeleton({ monetisable: true });
    const e = effort();
    const roadmap = buildRoadmap({
      moveName: 'Test Move', effort: e,
      steadyStateAnnualValue: skeleton.valueRange.point / 3, phases: fourPhases(),
    });
    // RACI with an agent accountable for a governance decision.
    const badRaci = buildRaciMatrix({
      moveName: 'Test Move',
      parties: [
        { id: 'agent', name: 'Agent', kind: 'agent' },
        { id: 'lead', name: 'Lead', kind: 'human' },
      ],
      decisions: [{
        key: 'd_fund', decision: 'Fund', kind: 'governance',
        assignments: [
          { partyId: 'agent', role: 'accountable' },
          { partyId: 'lead', role: 'responsible' },
        ],
      }],
    });
    const full = compileFullBusinessCase({ skeleton, roadmap, raci: badRaci });
    expect(full.recommendation).toBe('shape');
    expect(full.flags.some((f) => f.startsWith('[raci]'))).toBe(true);
  });
});
