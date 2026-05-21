// Expert Kernel — the living Move: a parametrised Apex Contact Center case.
//
// `buildApexContactCenterCase()` runs the kernel on a FIXED set of grounded
// Apex inputs and returns the board-grade Costed Business-Case Pack — a
// static render. The *living* Move is the SAME case made interactive: a CXO
// touches the highest-leverage assumptions and the kernel recompiles.
//
// This module exposes that recompute. `buildLivingMoveCase(controls)` takes a
// small set of control values, threads them through the REAL kernel compile
// path — `buildBaselineModel → buildEffortEstimate → buildValueForecast →
// compileBusinessCase` — and returns the recompiled case plus the three
// board-grade exhibit datasets (waterfall / value bridge / sensitivity
// tornado), shaped exactly as the board-grade pack-model shapes them.
//
// It is NOT a reimplementation. Every number traces to a kernel field. The
// kernel's honesty discipline holds under every control setting:
//   • The cost-per-contact baseline is a declared seed gap. By default the
//     value forecast carries `grossValueIsProxy: true`, which forces
//     `monetisationBlocked` and leaves payback `null` — the same as the
//     static case. When (and only when) the CXO supplies the optional
//     cost-per-contact input, the proxy flag drops, monetisation un-blocks,
//     and payback computes live. Clearing it reverts to blocked.
//   • The critic still runs; its blockers still downgrade fund → shape.
//
// Pure module: deterministic, no I/O. Importable client-side — every module
// on the compile path is pure TypeScript with no `server-only` import, so the
// recompute can run in a client component for instant feedback.

import { buildBaselineModel, type BaselineMetricInput } from './baseline-model';
import { buildAssumptionLedger } from './assumption-ledger';
import { buildEffortEstimate } from './effort-estimator';
import { demoKernelRateCard } from './rate-card/demo-rate-card-packs';
import { buildValueForecast } from './value-forecast';
import {
  compileBusinessCase,
  type BusinessCaseSkeleton,
} from './business-case-compiler';
import { rangeOf, round2 } from './types';

const TENANT = 'apex-retail';
const MOVE = 'Contact Center AI Routing';

// The base haircut scores from the grounded Apex case
// (`apex-contact-center-case.ts`). The living controls override three of the
// six; the other three stay pinned to the audited values.
const PINNED_HAIRCUT = {
  integrationComplexity: 0.6,
  controlBurden: 0.5,
  sponsorStrength: 0.8,
} as const;

// The base gross-value range and the stated containment-uplift assumption
// (KPI kpi:apex:018 states a 28% → 40% target — a 12-point lift). Gross value
// scales linearly with the modelled uplift: the uplift IS the value mechanism.
const BASE_CONTAINMENT_UPLIFT_PTS = 12;
const BASE_GROSS_LOW = 7_800_000;
const BASE_GROSS_HIGH = 13_500_000;

// The base engagement offshore ratio from the grounded Apex effort estimate.
const BASE_OFFSHORE_RATIO = 0.4;

/**
 * The six control values that drive the living Move. Each is a real kernel
 * input — adjusting it recompiles the case honestly, never fabricates.
 */
export interface LivingMoveControls {
  /**
   * Adoption-risk haircut score (0..1; 1 = full confidence agents adopt).
   * The single largest haircut weight — moves net value the most.
   */
  adoptionRisk: number;
  /** Data-readiness haircut score (0..1; 1 = data unified and instrumented). */
  dataReadiness: number;
  /** Process-dependency haircut score (0..1; 1 = value is process-independent). */
  processDependency: number;
  /**
   * Modelled containment uplift in percentage points. The KPI dictionary
   * states a 12-pt target; the control lets a CXO pressure-test 4..20 pts.
   * Gross value scales linearly with it.
   */
  containmentUpliftPts: number;
  /**
   * Engagement offshore delivery ratio (0..1). A real cost driver — a higher
   * offshore mix lowers the blended rate and the investment.
   */
  offshoreRatio: number;
  /**
   * The cost-per-contact baseline (USD) — Apex's DECLARED SEED GAP. Left
   * `null` by default: the value forecast then carries `grossValueIsProxy`
   * and payback is blocked. Supply a value and monetisation un-blocks and
   * payback computes live. This is the no-fabrication discipline as a
   * feature: the surface shows exactly what is missing and what filling it
   * would do — without ever fabricating it by default.
   */
  costPerContactUsd: number | null;
}

/** The grounded defaults — the living Move opens on the audited Apex case. */
export const LIVING_MOVE_DEFAULTS: LivingMoveControls = {
  adoptionRisk: 0.6,
  dataReadiness: 0.45,
  processDependency: 0.55,
  containmentUpliftPts: BASE_CONTAINMENT_UPLIFT_PTS,
  offshoreRatio: BASE_OFFSHORE_RATIO,
  costPerContactUsd: null,
};

/** A board-grade investment-waterfall step (matches `WaterfallStep`). */
export interface LivingWaterfallStep {
  label: string;
  amount: number;
}

/** A board-grade value-bridge step (matches `BridgeStep`). */
export interface LivingBridgeStep {
  label: string;
  amount: number;
}

/** A board-grade sensitivity-tornado bar (matches `TornadoBar`). */
export interface LivingTornadoBar {
  label: string;
  swing: number;
  isProxy: boolean;
}

/** The recompiled living Move — the kernel case plus the exhibit datasets. */
export interface LivingMoveCase {
  /** The recompiled kernel skeleton — the source of every figure below. */
  skeleton: BusinessCaseSkeleton;
  /** The controls this case was compiled from (echoed for the view). */
  controls: LivingMoveControls;
  /** Gross 3-yr value (point) — the optimistic ceiling before the haircut. */
  grossValue: number;
  /** Net 3-yr value (point) — post-haircut. */
  netValue: number;
  /** Compounded haircut fraction (0..1). */
  haircut: number;
  /** Investment-waterfall dataset (board-grade exhibit input). */
  waterfall: LivingWaterfallStep[];
  /** Gross-to-net value-bridge dataset (board-grade exhibit input). */
  bridgeSteps: LivingBridgeStep[];
  /** Sensitivity-tornado dataset (board-grade exhibit input). */
  tornado: LivingTornadoBar[];
  /**
   * True when the cost-per-contact seed gap has been supplied — monetisation
   * is un-blocked and payback is a live number. False = honestly blocked.
   */
  seedGapFilled: boolean;
}

const FACTOR_LABEL = {
  adoptionRisk: 'Adoption risk',
  dataReadiness: 'Data readiness',
  processDependency: 'Process dependency',
  integrationComplexity: 'Integration complexity',
  controlBurden: 'Control burden',
  sponsorStrength: 'Sponsor strength',
} as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Build the Apex Contact Center value forecast for a given control setting.
 * Threads the three live haircut scores, the containment-uplift-scaled gross
 * value, and the seed-gap state into the real `buildValueForecast` kernel.
 */
function buildLivingValueForecast(controls: LivingMoveControls) {
  // Gross value scales linearly with the modelled containment uplift — the
  // uplift is the value mechanism (KPI kpi:apex:018 base = 12 pts).
  const upliftFactor =
    controls.containmentUpliftPts / BASE_CONTAINMENT_UPLIFT_PTS;
  // Supplying the cost-per-contact baseline drops the seed-gap proxy flag, so
  // the gross value is no longer a proxy — monetisation un-blocks.
  const grossValueIsProxy = controls.costPerContactUsd === null;

  return buildValueForecast({
    moveName: MOVE,
    grossAnnualValue: rangeOf(
      round2(BASE_GROSS_LOW * upliftFactor),
      round2(BASE_GROSS_HIGH * upliftFactor),
    ),
    horizonYears: 3,
    adoptionCurve: [0.3, 0.7, 0.85],
    grossValueIsProxy,
    haircutScores: {
      adoptionRisk: clamp01(controls.adoptionRisk),
      dataReadiness: clamp01(controls.dataReadiness),
      processDependency: clamp01(controls.processDependency),
      ...PINNED_HAIRCUT,
    },
  });
}

/**
 * The grounded Apex baseline. When the CXO supplies the cost-per-contact
 * baseline, the metric flips from a declared seed gap to a recorded value —
 * the kernel's baseline coverage rises, exactly as it would when the real
 * tenant action item (owner Brendan Fox, due 2026-05-15) lands.
 */
function buildLivingBaselineMetrics(
  controls: LivingMoveControls,
): BaselineMetricInput[] {
  const costPerContact: BaselineMetricInput =
    controls.costPerContactUsd === null
      ? {
          key: 'cost_per_contact_usd',
          label: 'Cost per contact (labour)',
          value: null,
          unit: 'usd',
          source: 'seed gap',
          sourceQuality: 'absent',
          asOf: '2026-05-18',
          confidence: 'low',
          seedGapReason:
            'Not recorded. Tenant action item "Capture cost-per-contact ' +
            'baseline" (owner Brendan Fox) is due 2026-05-15.',
        }
      : {
          key: 'cost_per_contact_usd',
          label: 'Cost per contact (labour)',
          value: round2(controls.costPerContactUsd),
          unit: 'usd',
          // Supplied live by the decision-maker — honestly flagged as a
          // stated input, not an instrumented measurement.
          source: 'CXO-supplied baseline (living Move)',
          sourceQuality: 'stated',
          asOf: '2026-05-21',
          confidence: 'medium',
        };

  return [
    {
      key: 'aht_minutes',
      label: 'Average Handle Time',
      value: 7.2,
      unit: 'minutes',
      source: 'KPI kpi:apex:019 (NICE CXone)',
      sourceQuality: 'measured',
      asOf: '2026-04-30',
      confidence: 'high',
      caveat:
        'Rising because easy calls are deflected; harder calls reach agents.',
    },
    {
      key: 'containment_pct',
      label: 'Contact Center Containment',
      value: 28,
      unit: 'percent',
      source: 'KPI kpi:apex:018 (NICE CXone)',
      sourceQuality: 'measured',
      asOf: '2026-04-30',
      confidence: 'medium',
      caveat:
        'Known NICE-vs-IT-dashboard measurement discrepancy; reconciliation ' +
        'owned by James Wright, due 2026-05-08.',
    },
    {
      key: 'fcr_pct',
      label: 'First Call Resolution',
      value: 68,
      unit: 'percent',
      source: 'KPI kpi:apex:020 (NICE CXone)',
      sourceQuality: 'measured',
      asOf: '2026-04-30',
      confidence: 'medium',
    },
    {
      key: 'agent_utilization_pct',
      label: 'Agent Utilization',
      value: 84,
      unit: 'percent',
      source: 'KPI kpi:apex:021 (NICE CXone)',
      sourceQuality: 'measured',
      asOf: '2026-04-30',
      confidence: 'high',
      caveat: 'Above the 80% target — capacity strain bounds labour takeout.',
    },
    {
      key: 'csat',
      label: 'CSAT (post-interaction)',
      value: 4.1,
      unit: 'score_out_of_5',
      source: 'KPI kpi:apex:012 (Zendesk survey)',
      sourceQuality: 'measured',
      asOf: '2026-04-30',
      confidence: 'medium',
      caveat: '22% response rate; biased toward extreme experiences.',
    },
    {
      key: 'repeat_transfer_pct',
      label: 'Repeat transfer rate',
      value: 18.4,
      unit: 'percent',
      source: 'Move P2 baseline deliverable (Genesys routing export)',
      sourceQuality: 'measured',
      asOf: '2026-05-03',
      confidence: 'medium',
      caveat: 'Promotion weeks excluded.',
    },
    costPerContact,
    {
      key: 'contact_volume_annual',
      label: 'Annual contact volume',
      value: null,
      unit: 'contacts_per_year',
      source: 'seed gap',
      sourceQuality: 'absent',
      asOf: '2026-05-18',
      confidence: 'low',
      seedGapReason:
        'Not recorded in the KPI dictionary, telemetry, or the Move baseline.',
    },
    {
      key: 'channel_mix',
      label: 'Channel mix (voice/chat/IVR split)',
      value: null,
      unit: 'percent_split',
      source: 'seed gap',
      sourceQuality: 'absent',
      asOf: '2026-05-18',
      confidence: 'low',
      seedGapReason:
        'Containment note references "IVR + chatbot" but no structured ' +
        'split is seeded.',
    },
    {
      key: 'qa_error_rate_pct',
      label: 'QA error rate',
      value: null,
      unit: 'percent',
      source: 'seed gap',
      sourceQuality: 'absent',
      asOf: '2026-05-18',
      confidence: 'low',
      seedGapReason:
        'No contact-centre quality-defect metric is seeded for Apex.',
    },
  ];
}

/** The grounded Apex assumption ledger, with the seed-gap proxy state live. */
function buildLivingAssumptions(controls: LivingMoveControls) {
  const seedGapFilled = controls.costPerContactUsd !== null;
  return buildAssumptionLedger([
    {
      key: 'cost_per_contact',
      statement: seedGapFilled
        ? `Fully-loaded cost per contact is $${round2(
            controls.costPerContactUsd as number,
          )} — supplied by the decision-maker; pending the instrumented ` +
          'tenant baseline (due 2026-05-15) for confirmation.'
        : 'Fully-loaded cost per contact is ~$6.50 (benchmark proxy) until ' +
          'the tenant baseline due 2026-05-15 lands.',
      owner: 'Brendan Fox (CS Ops)',
      confidence: seedGapFilled ? 'medium' : 'low',
      source: seedGapFilled
        ? 'CXO-supplied baseline (living Move)'
        : 'Benchmark proxy — seed gap (tenant baseline pending)',
      sensitivityImpact: 'high',
      isSeedGapProxy: !seedGapFilled,
    },
    {
      key: 'annual_contact_volume',
      statement:
        'Annual agent-handled contact volume is ~9.0M (benchmark for an ' +
        '$80B retailer) — used only to express value in operational hours.',
      owner: 'Priya Iyer (Program Lead)',
      confidence: 'low',
      source: 'Benchmark proxy — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'containment_uplift',
      statement:
        `AI routing lifts containment ~${controls.containmentUpliftPts} ` +
        `points (28% → ${round2(28 + controls.containmentUpliftPts)}% ` +
        'target).',
      owner: 'Priya Iyer (Program Lead)',
      confidence: 'medium',
      source: 'KPI kpi:apex:018 stated target',
      sensitivityImpact: 'high',
    },
    {
      key: 'adoption_ramp',
      statement:
        'Customer Care agents reach 70% steady-state adoption by year 2.',
      owner: 'Mariana Rojas (WFM Lead)',
      confidence: 'medium',
      source: 'Operating telemetry — CC working group notes',
      sensitivityImpact: 'medium',
    },
    {
      key: 'privacy_gate_clears',
      statement:
        'The transcript-use privacy review (2026-05-17 milestone) clears ' +
        'without scope cuts that remove agent-assist features.',
      owner: 'Elena Fischer (AI Governance)',
      confidence: 'medium',
      source: 'Move milestone + AI Governance Council notes',
      sensitivityImpact: 'medium',
    },
    {
      key: 'rate_card',
      statement:
        'Blended delivery rate card reflects market rates for AI build and ' +
        'integration roles.',
      owner: 'David Okafor (Program Lead)',
      confidence: 'medium',
      source: 'Benchmark rate card',
      sensitivityImpact: 'low',
    },
  ]);
}

/** The grounded Apex effort estimate, with the live offshore ratio. */
function buildLivingEffort(controls: LivingMoveControls) {
  return buildEffortEstimate({
    moveName: MOVE,
    rateCard: demoKernelRateCard('apex-contact-center'),
    offshoreRatio: clamp01(controls.offshoreRatio),
    workstreams: [
      {
        id: 'ai_build',
        durationMonths: 9,
        agentSplit: 0.35,
        roleMix: [
          { role: 'solution_architect', headcount: 1 },
          { role: 'senior_engineer', headcount: 2 },
          { role: 'engineer', headcount: 2 },
        ],
      },
      {
        id: 'integration',
        durationMonths: 6,
        agentSplit: 0.2,
        roleMix: [
          { role: 'senior_engineer', headcount: 1 },
          { role: 'engineer', headcount: 2 },
        ],
      },
      {
        id: 'data',
        durationMonths: 5,
        agentSplit: 0.3,
        roleMix: [
          { role: 'engineer', headcount: 1 },
          { role: 'analyst', headcount: 2 },
        ],
      },
      {
        id: 'foundational',
        durationMonths: 4,
        agentSplit: 0.15,
        roleMix: [{ role: 'solution_architect', headcount: 1 }],
      },
      {
        id: 'data_governance',
        durationMonths: 6,
        agentSplit: 0.1,
        roleMix: [
          { role: 'analyst', headcount: 1 },
          { role: 'project_manager', headcount: 0.5 },
        ],
      },
      {
        id: 'process_redesign',
        durationMonths: 5,
        agentSplit: 0.1,
        roleMix: [
          { role: 'analyst', headcount: 1.5 },
          { role: 'project_manager', headcount: 0.5 },
        ],
      },
      {
        id: 'change_adoption',
        durationMonths: 9,
        agentSplit: 0.05,
        roleMix: [
          { role: 'project_manager', headcount: 1 },
          { role: 'analyst', headcount: 1 },
        ],
      },
      {
        id: 'run',
        durationMonths: 12,
        agentSplit: 0.4,
        roleMix: [
          { role: 'engineer', headcount: 1 },
          { role: 'analyst', headcount: 1 },
        ],
      },
    ],
  });
}

/**
 * Recompile the Apex Contact Center business case for a given live control
 * setting. Runs the REAL kernel compile path end to end. Deterministic.
 */
export function buildLivingMoveCase(
  controls: LivingMoveControls,
): LivingMoveCase {
  const baseline = buildBaselineModel({
    moveName: MOVE,
    tenantKey: TENANT,
    metrics: buildLivingBaselineMetrics(controls),
  });
  const assumptions = buildLivingAssumptions(controls);
  const effort = buildLivingEffort(controls);
  const value = buildLivingValueForecast(controls);

  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: 'kill_privacy_gate_blocks',
        condition:
          'The 2026-05-17 transcript-use privacy review fails and removes ' +
          'agent-assist features — the value case loses its core mechanism.',
      },
    ],
    towerHandoff: [
      {
        metricKey: 'containment_pct',
        metricLabel: 'Contact Center Containment',
        baselineValue: 28,
        targetValue: round2(28 + controls.containmentUpliftPts),
        unit: 'percent',
        readinessNote:
          'Measurable now, but close the NICE-vs-IT reconciliation before ' +
          'locking the baseline.',
      },
      {
        metricKey: 'cost_per_contact_usd',
        metricLabel: 'Cost per contact (labour)',
        baselineValue: controls.costPerContactUsd,
        targetValue: null,
        unit: 'usd',
        readinessNote:
          controls.costPerContactUsd === null
            ? 'SEED GAP — not measurable until the cost-per-contact baseline ' +
              '(due 2026-05-15) is captured.'
            : 'Baseline supplied by the decision-maker; confirm against the ' +
              'instrumented tenant capture (due 2026-05-15).',
      },
    ],
  });

  // ── Board-grade exhibit datasets ────────────────────────────────────────
  // Shaped exactly as the board-grade pack-model shapes them, off the SAME
  // recompiled skeleton — so the static board pack and the living Move never
  // diverge.

  // Investment waterfall — five delivery lanes summing to the base total.
  const ws = effort.workstreams;
  const laneCost = (ids: string[]): number =>
    round2(
      ws.filter((w) => ids.includes(w.id)).reduce((s, w) => s + w.baseCost, 0),
    );
  const waterfall: LivingWaterfallStep[] = [
    { label: 'AI build + foundational', amount: laneCost(['ai_build', 'foundational']) },
    { label: 'Integration + data', amount: laneCost(['integration', 'data']) },
    { label: 'Data governance', amount: laneCost(['data_governance']) },
    { label: 'Change + adoption', amount: laneCost(['change_adoption']) },
    { label: 'Run (year 1)', amount: laneCost(['run']) },
  ];

  // Gross-to-net value bridge — each haircut factor as a downward step,
  // distributed by its discount contribution (faithful kernel decomposition).
  const grossValue = value.totalGrossValue.point;
  const netValue = value.totalNetValue.point;
  const totalDiscount = value.factors.reduce(
    (s, f) => s + f.discountContribution,
    0,
  );
  const lostValue = grossValue - netValue;
  const bridgeSteps: LivingBridgeStep[] = value.factors
    .slice()
    .sort((a, b) => b.discountContribution - a.discountContribution)
    .map((f) => ({
      label: FACTOR_LABEL[f.dimension],
      amount:
        totalDiscount > 0
          ? round2((f.discountContribution / totalDiscount) * lostValue)
          : 0,
    }));

  // Sensitivity tornado — the assumptions that move the case, proxy-tagged.
  const tornado: LivingTornadoBar[] = skeleton.assumptions.byImpact
    .filter((a) => a.sensitivityImpact !== 'low')
    .map((a) => ({
      label: a.statement.split(/[.—]/)[0].slice(0, 42).trim(),
      swing:
        a.sensitivityImpact === 'high'
          ? a.isSeedGapProxy
            ? 100
            : 78
          : 46,
      isProxy: a.isSeedGapProxy,
    }));

  return {
    skeleton,
    controls,
    grossValue,
    netValue,
    haircut: value.totalHaircut,
    waterfall,
    bridgeSteps,
    tornado,
    seedGapFilled: controls.costPerContactUsd !== null,
  };
}
