// Expert Kernel — Mobilize & Handoff phase tests.
//
// Covers the Mobilize playbook, the three Mobilize modules (adoption approach,
// measurement → Tower handoff, go-decision pack), the Apex-grounded output,
// and 2 golden / 2 adversarial cases. Every module is pure and deterministic;
// these tests assert behaviour, not snapshots.

import { buildBaselineModel } from '../baseline-model';
import { buildAssumptionLedger } from '../assumption-ledger';
import { buildEffortEstimate } from '../effort-estimator';
import { buildValueForecast } from '../value-forecast';
import { compileBusinessCase } from '../business-case-compiler';
import {
  MOBILIZE_PLAYBOOK,
  mobilizeQuestion,
  mobilizeKillTrigger,
} from '../phase-playbooks/mobilize';
import {
  buildAdoptionApproach,
  type ChangeDimensionAssessment,
} from '../adoption-approach';
import { buildMeasurementHandoff } from '../measurement-handoff';
import {
  buildGoDecisionPack,
  renderGoDecisionPackText,
} from '../go-decision-pack';
import {
  buildApexContactCenterCase,
  buildApexMobilizeCase,
} from '../apex-contact-center-case';
import { rangeOf } from '../types';
import type { RoleRateCard } from '@/lib/source/should-cost/should-cost-model';

const RATE_CARD: RoleRateCard[] = [
  { role: 'solution_architect', onshoreAnnualRate: 240_000, offshoreAnnualRate: 130_000 },
  { role: 'engineer', onshoreAnnualRate: 150_000, offshoreAnnualRate: 70_000 },
  { role: 'analyst', onshoreAnnualRate: 120_000, offshoreAnnualRate: 60_000 },
  { role: 'project_manager', onshoreAnnualRate: 170_000, offshoreAnnualRate: 90_000 },
];

// A complete, healthy seven-dimension change assessment.
function healthyDimensions(): ChangeDimensionAssessment[] {
  const base = {
    magnitude: 'moderate' as const,
    recommendation: 'A sound approach.',
    ownerRole: 'Change Lead',
    confidence: 'medium' as const,
  };
  return [
    { ...base, dimension: 'impacted_roles' },
    { ...base, dimension: 'process_variance' },
    { ...base, dimension: 'training_load' },
    { ...base, dimension: 'incentive_change' },
    { ...base, dimension: 'manager_adoption' },
    { ...base, dimension: 'communications' },
    { ...base, dimension: 'hypercare' },
  ];
}

// A small but healthy business case for go-pack tests.
function healthyBusinessCase() {
  const baseline = buildBaselineModel({
    moveName: 'M',
    tenantKey: 't',
    metrics: [
      {
        key: 'aht',
        label: 'AHT',
        value: 7,
        unit: 'minutes',
        source: 's',
        sourceQuality: 'measured',
        asOf: '2026-01-01',
        confidence: 'high',
      },
    ],
  });
  const assumptions = buildAssumptionLedger([
    {
      key: 'a1',
      statement: 'Adoption holds.',
      owner: 'Owner',
      confidence: 'medium',
      source: 'telemetry',
      sensitivityImpact: 'high',
    },
  ]);
  const effort = buildEffortEstimate({
    moveName: 'M',
    rateCard: RATE_CARD,
    offshoreRatio: 0.3,
    workstreams: [
      {
        id: 'ai_build',
        durationMonths: 6,
        agentSplit: 0.3,
        roleMix: [{ role: 'engineer', headcount: 1 }],
      },
      {
        id: 'change_adoption',
        durationMonths: 6,
        agentSplit: 0.05,
        roleMix: [{ role: 'project_manager', headcount: 1 }],
      },
      {
        id: 'run',
        durationMonths: 12,
        agentSplit: 0.3,
        roleMix: [{ role: 'analyst', headcount: 1 }],
      },
    ],
  });
  const value = buildValueForecast({
    moveName: 'M',
    grossAnnualValue: rangeOf(8_000_000, 14_000_000),
    horizonYears: 3,
    adoptionCurve: [0.4, 0.8, 1],
    haircutScores: {
      adoptionRisk: 0.7,
      dataReadiness: 0.7,
      processDependency: 0.7,
      integrationComplexity: 0.7,
      controlBurden: 0.7,
      sponsorStrength: 0.8,
    },
  });
  return compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    towerHandoff: [
      {
        metricKey: 'aht',
        metricLabel: 'AHT',
        baselineValue: 7,
        targetValue: 6,
        unit: 'minutes',
        readinessNote: 'measurable',
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Mobilize playbook
// ---------------------------------------------------------------------------

describe('mobilize playbook', () => {
  it('is the mobilize phase and carries questions, evidence, traps, triggers', () => {
    expect(MOBILIZE_PLAYBOOK.phase).toBe('mobilize');
    expect(MOBILIZE_PLAYBOOK.questions.length).toBeGreaterThan(0);
    expect(MOBILIZE_PLAYBOOK.requiredEvidence.length).toBeGreaterThan(0);
    expect(MOBILIZE_PLAYBOOK.traps.length).toBeGreaterThan(0);
    expect(MOBILIZE_PLAYBOOK.killTriggers.length).toBeGreaterThan(0);
  });

  it('names "no operating-model owner" as a kill trigger with a fix-condition', () => {
    const t = mobilizeKillTrigger('no_operating_model_owner');
    expect(t).not.toBeNull();
    expect(t?.condition.toLowerCase()).toContain('operating');
    expect(t?.fixCondition.trim().length).toBeGreaterThan(0);
  });

  it('every question is answered by at least one required-evidence key', () => {
    const evidenceKeys = new Set(
      MOBILIZE_PLAYBOOK.requiredEvidence.map((e) => e.key),
    );
    for (const q of MOBILIZE_PLAYBOOK.questions) {
      expect(q.answeredBy.length).toBeGreaterThan(0);
      for (const k of q.answeredBy) {
        expect(evidenceKeys.has(k)).toBe(true);
      }
    }
  });

  it('every kill trigger carries a fix-condition (willingness to say no)', () => {
    for (const t of MOBILIZE_PLAYBOOK.killTriggers) {
      expect(t.fixCondition.trim().length).toBeGreaterThan(0);
    }
  });

  it('mobilizeQuestion looks up by key and returns null for unknown', () => {
    expect(mobilizeQuestion('operating_model_owner')).not.toBeNull();
    expect(mobilizeQuestion('nope')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// adoption-approach
// ---------------------------------------------------------------------------

describe('adoption-approach', () => {
  it('builds a complete approach and computes overall change load', () => {
    const a = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: 'Ops Owner',
      hypercareWeeks: 4,
      impactedRoles: [
        { role: 'Agent', headcount: 100, changeMagnitude: 'high', whatChanges: 'x' },
      ],
      dimensions: healthyDimensions(),
    });
    expect(a.overallChangeLoad).toBe('moderate');
    expect(a.totalImpactedHeadcount).toBe(100);
    expect(a.ownerGap).toBe(false);
    expect(a.adoptionConfidence).toBeGreaterThan(0);
  });

  it('throws when a change dimension is missing', () => {
    const dims = healthyDimensions().slice(0, 6);
    expect(() =>
      buildAdoptionApproach({
        moveName: 'M',
        operatingModelOwner: 'Owner',
        hypercareWeeks: 4,
        impactedRoles: [],
        dimensions: dims,
      }),
    ).toThrow(/hypercare/);
  });

  it('throws on a duplicate change dimension', () => {
    const dims = healthyDimensions();
    dims.push(dims[0]);
    expect(() =>
      buildAdoptionApproach({
        moveName: 'M',
        operatingModelOwner: 'Owner',
        hypercareWeeks: 4,
        impactedRoles: [],
        dimensions: dims,
      }),
    ).toThrow(/Duplicate/);
  });

  it('flags a blocker risk and ownerGap when no operating-model owner', () => {
    const a = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: null,
      hypercareWeeks: 4,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    expect(a.ownerGap).toBe(true);
    expect(a.risks.some((r) => r.severity === 'blocker')).toBe(true);
  });

  it('penalises adoption confidence for missing hypercare', () => {
    const withCare = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: 'Owner',
      hypercareWeeks: 6,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const without = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: 'Owner',
      hypercareWeeks: 0,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    expect(without.adoptionConfidence).toBeLessThan(
      withCare.adoptionConfidence,
    );
    expect(without.risks.some((r) => r.code === 'adoption_no_hypercare')).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// measurement-handoff
// ---------------------------------------------------------------------------

describe('measurement-handoff', () => {
  const baseline = buildBaselineModel({
    moveName: 'M',
    tenantKey: 'apex-retail',
    metrics: [
      {
        key: 'aht',
        label: 'AHT',
        value: 7,
        unit: 'minutes',
        source: 's',
        sourceQuality: 'measured',
        asOf: '2026-01-01',
        confidence: 'high',
      },
      {
        key: 'cpc',
        label: 'Cost per contact',
        value: null,
        unit: 'usd',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-01-01',
        confidence: 'low',
        seedGapReason: 'not recorded',
      },
    ],
  });

  it('wires a metric to a recorded baseline and projects a Tower row', () => {
    const h = buildMeasurementHandoff({
      moveName: 'M',
      tenantClientKey: 'apex-retail',
      baseline,
      subjectKind: 'move',
      subjectRef: 'apex:move:m',
      metrics: [
        {
          baselineMetricKey: 'aht',
          label: 'AHT',
          targetValue: 6,
          valueCategory: 'productivity',
          measurementUnit: 'percent',
          cadence: 'monthly',
          measurementOwnerRole: 'WFM Lead',
        },
      ],
    });
    expect(h.loopCloses).toBe(true);
    expect(h.wiredMetrics).toHaveLength(1);
    expect(h.towerRows[0].baselineAmount).toBe(7);
    expect(h.towerRows[0].valueRung).toBe('baseline_set');
  });

  it('carries a seed-gap metric as unwired and blocks loop closure', () => {
    const h = buildMeasurementHandoff({
      moveName: 'M',
      tenantClientKey: 'apex-retail',
      baseline,
      subjectKind: 'move',
      subjectRef: 'apex:move:m',
      metrics: [
        {
          baselineMetricKey: 'cpc',
          label: 'Cost per contact',
          targetValue: null,
          valueCategory: 'cost_avoidance',
          measurementUnit: 'usd_seed',
          cadence: 'monthly',
          measurementOwnerRole: 'CS Ops',
          baselineCapturePlan: 'baseline due 2026-05-15',
        },
      ],
    });
    expect(h.loopCloses).toBe(false);
    expect(h.unwiredMetrics).toHaveLength(1);
    expect(h.towerRows[0].valueRung).toBe('baseline_pending');
    expect(h.towerRows[0].note).toMatch(/SEED GAP/);
  });

  it('throws when a metric references an unknown baseline key', () => {
    expect(() =>
      buildMeasurementHandoff({
        moveName: 'M',
        tenantClientKey: 'apex-retail',
        baseline,
        subjectKind: 'move',
        subjectRef: 'apex:move:m',
        metrics: [
          {
            baselineMetricKey: 'ghost',
            label: 'Ghost',
            targetValue: 1,
            valueCategory: 'productivity',
            measurementUnit: 'percent',
            cadence: 'monthly',
            measurementOwnerRole: 'X',
          },
        ],
      }),
    ).toThrow(/not in the Discover baseline/);
  });

  it('throws when an unwired metric has no capture plan', () => {
    expect(() =>
      buildMeasurementHandoff({
        moveName: 'M',
        tenantClientKey: 'apex-retail',
        baseline,
        subjectKind: 'move',
        subjectRef: 'apex:move:m',
        metrics: [
          {
            baselineMetricKey: 'cpc',
            label: 'Cost per contact',
            targetValue: null,
            valueCategory: 'cost_avoidance',
            measurementUnit: 'usd_seed',
            cadence: 'monthly',
            measurementOwnerRole: 'CS Ops',
          },
        ],
      }),
    ).toThrow(/baselineCapturePlan/);
  });
});

// ---------------------------------------------------------------------------
// go-decision-pack
// ---------------------------------------------------------------------------

describe('go-decision-pack', () => {
  const baseline = buildBaselineModel({
    moveName: 'M',
    tenantKey: 't',
    metrics: [
      {
        key: 'aht',
        label: 'AHT',
        value: 7,
        unit: 'minutes',
        source: 's',
        sourceQuality: 'measured',
        asOf: '2026-01-01',
        confidence: 'high',
      },
    ],
  });

  function wiredMeasurement() {
    return buildMeasurementHandoff({
      moveName: 'M',
      tenantClientKey: 't',
      baseline,
      subjectKind: 'move',
      subjectRef: 'm',
      metrics: [
        {
          baselineMetricKey: 'aht',
          label: 'AHT',
          targetValue: 6,
          valueCategory: 'productivity',
          measurementUnit: 'percent',
          cadence: 'monthly',
          measurementOwnerRole: 'WFM Lead',
        },
      ],
    });
  }

  it('renders a no-go when the operating-model owner is missing', () => {
    const adoption = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: null,
      hypercareWeeks: 4,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const pack = buildGoDecisionPack({
      businessCase: healthyBusinessCase(),
      adoption,
      measurement: wiredMeasurement(),
    });
    expect(pack.decision).toBe('no_go');
    expect(
      pack.firedKillTriggers.some(
        (f) => f.trigger.code === 'no_operating_model_owner',
      ),
    ).toBe(true);
    expect(pack.readiness.owned).toBe(false);
  });

  it('renders a no-go when a committed metric cannot be wired to a baseline', () => {
    const baselineWithGap = buildBaselineModel({
      moveName: 'M',
      tenantKey: 't',
      metrics: [
        ...baseline.metrics,
        {
          key: 'cpc',
          label: 'Cost per contact',
          value: null,
          unit: 'usd',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-01-01',
          confidence: 'low',
          seedGapReason: 'not recorded',
        },
      ],
    });
    const measurement = buildMeasurementHandoff({
      moveName: 'M',
      tenantClientKey: 't',
      baseline: baselineWithGap,
      subjectKind: 'move',
      subjectRef: 'm',
      metrics: [
        {
          baselineMetricKey: 'cpc',
          label: 'Cost per contact',
          targetValue: null,
          valueCategory: 'cost_avoidance',
          measurementUnit: 'usd_seed',
          cadence: 'monthly',
          measurementOwnerRole: 'CS Ops',
          baselineCapturePlan: 'due 2026-05-15',
        },
      ],
    });
    const adoption = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: 'Owner',
      hypercareWeeks: 6,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const pack = buildGoDecisionPack({
      businessCase: healthyBusinessCase(),
      adoption,
      measurement,
    });
    // measurement_unwired is a Mobilize kill trigger — an uncloseable value
    // loop blocks the handoff outright, not a conditional pass.
    expect(pack.decision).toBe('no_go');
    expect(
      pack.firedKillTriggers.map((f) => f.trigger.code),
    ).toContain('measurement_unwired');
    expect(pack.conditions.length).toBeGreaterThan(0);
  });

  it('never hides critic findings in the exported sections', () => {
    const adoption = buildAdoptionApproach({
      moveName: 'M',
      operatingModelOwner: 'Owner',
      hypercareWeeks: 6,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const pack = buildGoDecisionPack({
      businessCase: healthyBusinessCase(),
      adoption,
      measurement: wiredMeasurement(),
    });
    const criticSection = pack.sections.find((s) =>
      s.heading.startsWith('Critic findings'),
    );
    expect(criticSection).toBeDefined();
    const text = renderGoDecisionPackText(pack);
    expect(text).toContain('GO-DECISION PACK');
    expect(text).toContain('Critic findings');
  });
});

// ---------------------------------------------------------------------------
// Apex-grounded Mobilize output
// ---------------------------------------------------------------------------

describe('Apex Contact Center — Mobilize case (grounded)', () => {
  it('builds the adoption approach, measurement handoff, and go-pack', () => {
    const r = buildApexMobilizeCase();
    expect(r.adoption.dimensions).toHaveLength(7);
    expect(r.adoption.operatingModelOwner).not.toBeNull();
    expect(r.measurement.metrics.length).toBeGreaterThan(0);
    expect(['go', 'conditional_go', 'no_go']).toContain(r.goPack.decision);
  });

  it('wires Apex measurement metrics to real Discover baseline values', () => {
    const r = buildApexMobilizeCase();
    const containment = r.measurement.metrics.find(
      (m) => m.baselineMetricKey === 'containment_pct',
    );
    // 28% is the audited Apex containment baseline (kpi:apex:018).
    expect(containment?.wired).toBe(true);
    expect(containment?.baselineValue).toBe(28);
    const aht = r.measurement.metrics.find(
      (m) => m.baselineMetricKey === 'aht_minutes',
    );
    expect(aht?.baselineValue).toBe(7.2);
  });

  it('honestly carries the cost-per-contact seed gap as unwired', () => {
    const r = buildApexMobilizeCase();
    const cpc = r.measurement.metrics.find(
      (m) => m.baselineMetricKey === 'cost_per_contact_usd',
    );
    expect(cpc?.wired).toBe(false);
    expect(r.measurement.loopCloses).toBe(false);
  });

  it('lands at no_go — the open monetisation blocker stops a clean handoff', () => {
    const r = buildApexMobilizeCase();
    // Apex HAS a named operating-model owner (readiness.owned = true), but the
    // Design & Plan business case carries an open critic blocker
    // (cost-per-contact is a seed gap → monetisation blocked). The Mobilize
    // playbook's business_case_blocker_open trigger fires honestly — the
    // kernel will not hand off a Move whose return is unverifiable.
    expect(r.goPack.decision).toBe('no_go');
    expect(r.goPack.readiness.owned).toBe(true);
    expect(r.goPack.readiness.measurable).toBe(false);
    expect(
      r.goPack.firedKillTriggers.map((f) => f.trigger.code),
    ).toContain('business_case_blocker_open');
    expect(
      r.goPack.firedKillTriggers.map((f) => f.trigger.code),
    ).toContain('measurement_unwired');
  });

  it('the Apex Tower handoff rows reference Apex and the Move', () => {
    const r = buildApexMobilizeCase();
    for (const row of r.measurement.towerRows) {
      expect(row.tenantClientKey).toBe('apex-retail');
      expect(row.subjectRef).toBe('apex:move:contact-center-ai-routing');
    }
  });
});

// ---------------------------------------------------------------------------
// Golden cases
// ---------------------------------------------------------------------------

describe('Mobilize — golden cases', () => {
  it('GOLDEN 1: fully ready Move → go', () => {
    const adoption = buildAdoptionApproach({
      moveName: 'Ready Move',
      operatingModelOwner: 'Named Ops Owner',
      hypercareWeeks: 8,
      impactedRoles: [
        { role: 'Agent', headcount: 200, changeMagnitude: 'moderate', whatChanges: 'x' },
      ],
      dimensions: healthyDimensions(),
    });
    const baseline = buildBaselineModel({
      moveName: 'Ready Move',
      tenantKey: 't',
      metrics: [
        {
          key: 'aht',
          label: 'AHT',
          value: 7,
          unit: 'minutes',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
      ],
    });
    const measurement = buildMeasurementHandoff({
      moveName: 'Ready Move',
      tenantClientKey: 't',
      baseline,
      subjectKind: 'move',
      subjectRef: 'ready',
      metrics: [
        {
          baselineMetricKey: 'aht',
          label: 'AHT',
          targetValue: 6,
          valueCategory: 'productivity',
          measurementUnit: 'percent',
          cadence: 'monthly',
          measurementOwnerRole: 'WFM Lead',
        },
      ],
    });
    const pack = buildGoDecisionPack({
      businessCase: healthyBusinessCase(),
      adoption,
      measurement,
    });
    expect(pack.decision).toBe('go');
    expect(pack.firedKillTriggers).toHaveLength(0);
    expect(pack.readiness).toEqual({
      owned: true,
      adoptable: true,
      measurable: true,
    });
  });

  it('GOLDEN 2: Apex Mobilize case is internally consistent', () => {
    const r = buildApexMobilizeCase();
    // The go-pack readiness must agree with its component modules.
    expect(r.goPack.readiness.owned).toBe(!r.adoption.ownerGap);
    expect(r.goPack.readiness.measurable).toBe(r.measurement.loopCloses);
    // Conditional go must carry at least one condition.
    expect(r.goPack.conditions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Adversarial cases
// ---------------------------------------------------------------------------

describe('Mobilize — adversarial cases', () => {
  it('ADVERSARIAL 1: no operating-model owner → kill trigger fires, no-go', () => {
    // A Move with an otherwise healthy business case but no named owner must
    // NOT slip through to a go. Readiness, not economics, blocks it.
    const adoption = buildAdoptionApproach({
      moveName: 'Ownerless Move',
      operatingModelOwner: null,
      hypercareWeeks: 8,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const baseline = buildBaselineModel({
      moveName: 'Ownerless Move',
      tenantKey: 't',
      metrics: [
        {
          key: 'aht',
          label: 'AHT',
          value: 7,
          unit: 'minutes',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
      ],
    });
    const measurement = buildMeasurementHandoff({
      moveName: 'Ownerless Move',
      tenantClientKey: 't',
      baseline,
      subjectKind: 'move',
      subjectRef: 'ownerless',
      metrics: [
        {
          baselineMetricKey: 'aht',
          label: 'AHT',
          targetValue: 6,
          valueCategory: 'productivity',
          measurementUnit: 'percent',
          cadence: 'monthly',
          measurementOwnerRole: 'WFM Lead',
        },
      ],
    });
    const pack = buildGoDecisionPack({
      businessCase: healthyBusinessCase(),
      adoption,
      measurement,
    });
    expect(pack.decision).toBe('no_go');
    expect(
      pack.firedKillTriggers.map((f) => f.trigger.code),
    ).toContain('no_operating_model_owner');
    // The fix-condition must be carried as a condition.
    expect(
      pack.conditions.some((c) => c.code === 'no_operating_model_owner'),
    ).toBe(true);
  });

  it('ADVERSARIAL 2: change & adoption unfunded → adoption_unfunded fires', () => {
    // A business case with NO change & adoption workstream but a value
    // forecast that assumes adoption — the kernel must not let it pass.
    const baseline = buildBaselineModel({
      moveName: 'Unfunded Move',
      tenantKey: 't',
      metrics: [
        {
          key: 'aht',
          label: 'AHT',
          value: 7,
          unit: 'minutes',
          source: 's',
          sourceQuality: 'measured',
          asOf: '2026-01-01',
          confidence: 'high',
        },
      ],
    });
    const effort = buildEffortEstimate({
      moveName: 'Unfunded Move',
      rateCard: RATE_CARD,
      offshoreRatio: 0.3,
      // No change_adoption workstream.
      workstreams: [
        {
          id: 'ai_build',
          durationMonths: 6,
          agentSplit: 0.3,
          roleMix: [{ role: 'engineer', headcount: 1 }],
        },
      ],
    });
    const value = buildValueForecast({
      moveName: 'Unfunded Move',
      grossAnnualValue: rangeOf(8_000_000, 14_000_000),
      horizonYears: 3,
      adoptionCurve: [0.4, 0.8, 1],
      haircutScores: {
        adoptionRisk: 0.7,
        dataReadiness: 0.7,
        processDependency: 0.7,
        integrationComplexity: 0.7,
        controlBurden: 0.7,
        sponsorStrength: 0.8,
      },
    });
    const businessCase = compileBusinessCase({
      baseline,
      assumptions: buildAssumptionLedger([
        {
          key: 'a1',
          statement: 'Adoption holds.',
          owner: 'Owner',
          confidence: 'medium',
          source: 'telemetry',
          sensitivityImpact: 'high',
        },
      ]),
      effort,
      value,
      towerHandoff: [
        {
          metricKey: 'aht',
          metricLabel: 'AHT',
          baselineValue: 7,
          targetValue: 6,
          unit: 'minutes',
          readinessNote: 'measurable',
        },
      ],
    });
    const adoption = buildAdoptionApproach({
      moveName: 'Unfunded Move',
      operatingModelOwner: 'Owner',
      hypercareWeeks: 6,
      impactedRoles: [],
      dimensions: healthyDimensions(),
    });
    const measurement = buildMeasurementHandoff({
      moveName: 'Unfunded Move',
      tenantClientKey: 't',
      baseline,
      subjectKind: 'move',
      subjectRef: 'unfunded',
      metrics: [
        {
          baselineMetricKey: 'aht',
          label: 'AHT',
          targetValue: 6,
          valueCategory: 'productivity',
          measurementUnit: 'percent',
          cadence: 'monthly',
          measurementOwnerRole: 'WFM Lead',
        },
      ],
    });
    const pack = buildGoDecisionPack({ businessCase, adoption, measurement });
    expect(pack.decision).toBe('no_go');
    expect(
      pack.firedKillTriggers.map((f) => f.trigger.code),
    ).toContain('adoption_unfunded');
  });
});

// A smoke check that the original case still compiles unchanged.
describe('regression — Design & Plan case unchanged', () => {
  it('buildApexContactCenterCase still passes its rubric', () => {
    const { rubric } = buildApexContactCenterCase();
    expect(rubric.passed).toBe(true);
  });
});
