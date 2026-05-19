// Expert Kernel — First Capital Financial "Fraud Detection Enhancement"
// business-case skeleton.
//
// The THIRD real tenant the kernel is proven on. Modelled exactly on
// `apex-contact-center-case.ts`: a grounded ANCHOR whose every recorded input
// resolves to First Capital's audited substrate — the KPI dictionary at
// `src/scripts/setup-data/firstcapital-data/05_kpi_dictionary/kpi_dictionary.csv`
// and the program inventory at `.../06_program_inventory/active_programs.json`.
// Seed gaps are declared honestly, never fabricated.
//
// `buildFirstCapitalFraudDetectionCase()` runs the whole kernel — baseline →
// effort → value (haircut) → compiler (critic + qa) — and returns the grounded
// skeleton. It is the integration point the Expert Review Console reads.
//
// Pure module: deterministic, no I/O.

import { buildBaselineModel } from './baseline-model';
import { buildAssumptionLedger } from './assumption-ledger';
import { buildEffortEstimate, DEFAULT_PLANNING_RATE_CARD } from './effort-estimator';
import { buildValueForecast } from './value-forecast';
import {
  compileBusinessCase,
  compileFullBusinessCase,
  type BusinessCaseSkeleton,
  type FullBusinessCase,
} from './business-case-compiler';
import { buildRoadmap, type Roadmap } from './roadmap';
import { buildRaciMatrix, type RaciMatrix } from './raci';
import { evaluateRubric, type RubricResult } from './qa-rubric';
import { rangeOf } from './types';

const TENANT = 'first-capital';
const MOVE = 'Fraud Detection Enhancement';

/**
 * Stable tenant key and Move ref for the First Capital case — used by the
 * Expert Review Console registry to scope persisted `expert_reviews` rows.
 * `FC-FRAUD-2026` is the program ref from the First Capital program inventory.
 */
export const FIRSTCAPITAL_FRAUD_TENANT_KEY = TENANT;
export const FIRSTCAPITAL_FRAUD_MOVE_REF = 'first-capital:move:FC-FRAUD-2026';

// The kernel's default planning rate card — the researched 3-D SI benchmark
// projected onto the should-cost roles, clearly labelled a market planning
// range and "not a quote". A client-specific First Capital rate card would
// override this; until one exists the researched benchmark is the honest
// default.
const RATE_CARD = DEFAULT_PLANNING_RATE_CARD;

export interface FirstCapitalCaseResult {
  skeleton: BusinessCaseSkeleton;
  rubric: RubricResult;
}

export interface FirstCapitalFullCaseResult {
  fullCase: FullBusinessCase;
  roadmap: Roadmap;
  raci: RaciMatrix;
  rubric: RubricResult;
}

/**
 * Build, critique, and QA the First Capital "Fraud Detection Enhancement"
 * business-case skeleton from the kernel. Deterministic.
 */
export function buildFirstCapitalFraudDetectionCase(): FirstCapitalCaseResult {
  // --- 1. Baseline — audited First Capital substrate ----------------------
  // Recorded KPIs resolve to the First Capital KPI dictionary (fc-kpi-*),
  // each carrying the CSV's own source citation. The three absent items are
  // declared seed gaps — operational cost bases the dictionary does not seed.
  const baseline = buildBaselineModel({
    moveName: MOVE,
    tenantKey: TENANT,
    metrics: [
      {
        key: 'card_fraud_losses_usd',
        label: 'Card fraud annualized losses',
        value: 2_100_000,
        unit: 'usd_per_year',
        source: 'KPI fc-kpi-012 (Fraud Detection Enhancement program baseline)',
        sourceQuality: 'measured',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat:
          'Peer median is $1.2M/yr — the program commits to closing to that ' +
          'figure. Current run-rate is $1.8M (fc-kpi-022, Q1 actuals).',
      },
      {
        key: 'card_fraud_peer_median_usd',
        label: 'Card fraud losses — peer median',
        value: 1_200_000,
        unit: 'usd_per_year',
        source: 'KPI fc-kpi-012 peer benchmark (Fraud Detection Enhancement baseline)',
        sourceQuality: 'benchmark',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat: 'The committed target for the program — $2.1M → $1.2M.',
      },
      {
        key: 'annual_fraud_losses_usd',
        label: 'Annual fraud losses (all channels)',
        value: 7_000_000,
        unit: 'usd_per_year',
        source: 'KPI fc-kpi-011 (Fraud loss benchmark 2025)',
        sourceQuality: 'measured',
        asOf: '2025-12-31',
        confidence: 'high',
        caveat:
          'Peer median is $3.2M/yr. Card fraud ($2.1M) is one component; the ' +
          'remainder spans real-time payment, ACH, and account-takeover fraud.',
      },
      {
        key: 'aml_false_positive_pct',
        label: 'AML false-positive rate',
        value: 94,
        unit: 'percent',
        source: 'KPI fc-kpi-013 (OCC MRA-2 findings)',
        sourceQuality: 'measured',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat:
          'Peer median 45%. A NICE Actimize upgrade gate — adjacent to this ' +
          'Move but a separate program (FC-AML-2026).',
      },
      {
        key: 'automated_disposition_pct',
        label: 'AML automated disposition rate',
        value: 34,
        unit: 'percent',
        source: 'KPI fc-kpi-014 (OCC MRA-2 findings)',
        sourceQuality: 'measured',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat:
          'Peer median 72%. Low automated disposition means manual review load ' +
          'is high — the operational-cost lever for the fraud case.',
      },
      {
        key: 'sar_past_deadline_pct',
        label: 'SAR filings past deadline',
        value: 8,
        unit: 'percent',
        source: 'KPI fc-kpi-015 (OCC MRA-2 findings)',
        sourceQuality: 'measured',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat:
          'Peer median 0%. A regulatory-remediation metric — past-deadline SARs ' +
          'are direct OCC exposure.',
      },
      {
        key: 'program_investment_usd',
        label: 'Program investment (committed)',
        value: 1_800_000,
        unit: 'usd',
        source: 'Program inventory FC-FRAUD-2026 (active_programs.json)',
        sourceQuality: 'measured',
        asOf: '2026-05-10',
        confidence: 'high',
        caveat:
          'The program is in P4 Value Tracking, status on-track. This is the ' +
          'committed investment, not a kernel should-cost estimate.',
      },
      {
        key: 'current_run_rate_usd',
        label: 'Fraud detection current run-rate',
        value: 1_800_000,
        unit: 'usd_per_year',
        source: 'KPI fc-kpi-022 (Fraud Detection Enhancement Q1 2026)',
        sourceQuality: 'measured',
        asOf: '2026-03-31',
        confidence: 'high',
        caveat:
          'Card fraud annualized at $1.8M on Q1 actuals — partway from the $2.1M ' +
          'baseline toward the $1.2M target. Evidence the initiative is on track.',
      },
      // --- Declared seed gaps — honest "not recorded" ---------------------
      {
        key: 'fraud_analyst_fte_cost_usd',
        label: 'Fraud-analyst FTE cost basis',
        value: null,
        unit: 'usd_per_fte_per_year',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not recorded in the KPI dictionary or the program inventory. The ' +
          'manual-review reduction lever depends on a fully-loaded fraud-analyst ' +
          'FTE cost to convert disposition-automation gains into dollars.',
      },
      {
        key: 'alert_volume_annual',
        label: 'Fraud alert volume / cost-per-alert',
        value: null,
        unit: 'alerts_per_year',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not recorded. Annual alert volume and a per-alert handling cost are ' +
          'needed to size the operational efficiency of a detection-model uplift. ' +
          'Neither is in the seeded substrate.',
      },
      {
        key: 'false_positive_operational_cost_usd',
        label: 'False-positive operational cost',
        value: null,
        unit: 'usd_per_year',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not recorded. The 94% AML false-positive rate (fc-kpi-013) is ' +
          'measured, but the dollar cost of investigating those false positives ' +
          'is not seeded. Modeled, not measured.',
      },
    ],
  });

  // --- 2. Assumptions — first-class, owned --------------------------------
  const assumptions = buildAssumptionLedger([
    {
      key: 'fraud_analyst_fte_cost',
      statement:
        'Fully-loaded fraud-analyst FTE cost is a modeled proxy (~$135k/yr) ' +
        'until First Capital Finance attests a figure.',
      owner: 'Michael Torres (CFO)',
      confidence: 'low',
      source: 'Modeled proxy — seed gap (Finance attestation pending)',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'alert_volume',
      statement:
        'Annual fraud alert volume is a modeled proxy (~120k alerts/yr for a ' +
        "bank of First Capital's scale) — used only to express review load.",
      owner: 'David Chen (Risk Technology)',
      confidence: 'low',
      source: 'Modeled proxy — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'false_positive_cost',
      statement:
        'Each false-positive investigation costs a modeled ~$18 of analyst ' +
        'time — no per-alert handling cost is seeded.',
      owner: 'James Park (CRO)',
      confidence: 'low',
      source: 'Modeled proxy — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'fraud_loss_takeout',
      statement:
        'The detection-model enhancement closes card fraud losses from $2.1M ' +
        'toward the $1.2M peer median — a $0.9M/yr loss-avoidance ceiling.',
      owner: 'James Park (CRO)',
      confidence: 'medium',
      source: 'KPI fc-kpi-012 committed target',
      sensitivityImpact: 'high',
    },
    {
      key: 'realtime_payment_expansion',
      statement:
        'Expanding fraud detection from card to real-time payment fraud after ' +
        'FedNow go-live roughly doubles the addressable fraud-loss surface.',
      owner: 'Patricia Huang (CIO)',
      confidence: 'medium',
      source: 'Program inventory FC-FRAUD-2026 next-gate',
      sensitivityImpact: 'medium',
    },
    {
      key: 'rate_card',
      statement:
        'Blended delivery rate card reflects market rates for the ML and ' +
        'risk-technology roles in the estimate.',
      owner: 'Patricia Huang (CIO)',
      confidence: 'medium',
      source: 'Benchmark rate card',
      sensitivityImpact: 'low',
    },
  ]);

  // --- 3. Effort — model build + integration + run, role-mix via should-cost
  const effort = buildEffortEstimate({
    moveName: MOVE,
    rateCard: RATE_CARD,
    offshoreRatio: 0.35,
    workstreams: [
      {
        id: 'foundational',
        durationMonths: 3,
        agentSplit: 0.15,
        roleMix: [{ role: 'solution_architect', headcount: 1 }],
      },
      {
        id: 'ai_build',
        durationMonths: 8,
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
        id: 'data_governance',
        durationMonths: 7,
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
        durationMonths: 8,
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

  // --- 4. Value forecast — gross value + mandatory haircut -----------------
  // Card fraud loss-avoidance has a HARD ceiling: $2.1M → $1.2M is $0.9M/yr.
  // Beyond that, the larger fraud surface ($7M total losses) and the manual-
  // review-cost lever both rest on seed gaps (FTE cost, alert volume), so
  // grossValueIsProxy = true forces monetisationBlocked. The range below is an
  // illustrative ceiling, NOT a claimed return.
  const value = buildValueForecast({
    moveName: MOVE,
    grossAnnualValue: rangeOf(900_000, 3_400_000),
    horizonYears: 3,
    adoptionCurve: [0.5, 0.85, 1.0],
    grossValueIsProxy: true,
    haircutScores: {
      // P4 Value Tracking, on-track — the program is already live and adopted.
      adoptionRisk: 0.8,
      // SQL Server warehouse at 84% utilization; data platform under strain.
      dataReadiness: 0.5,
      // Manual-review takeout depends on a disposition process redesign.
      processDependency: 0.55,
      // 22-year-old core; real-time payment fraud needs FedNow rails first.
      integrationComplexity: 0.45,
      // OCC MRA exposure (MRA-2 findings) — heavy regulatory control burden.
      controlBurden: 0.45,
      // CRO is executive sponsor with a named program manager — strong.
      sponsorStrength: 0.8,
    },
  });

  // --- 5. Compile -> skeleton (runs the critic) ----------------------------
  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: 'kill_fraud_loss_floor',
        condition:
          'Card fraud losses stall above the $1.8M Q1 run-rate — the detection ' +
          'model has stopped converging on the $1.2M peer-median target.',
      },
      {
        code: 'kill_realtime_expansion_blocked',
        condition:
          'FedNow go-live slips far enough that the real-time payment fraud ' +
          'expansion — the larger value pool — cannot be reached in horizon.',
      },
    ],
    towerHandoff: [
      {
        metricKey: 'card_fraud_losses_usd',
        metricLabel: 'Card fraud annualized losses',
        baselineValue: 2_100_000,
        targetValue: 1_200_000,
        unit: 'usd_per_year',
        readinessNote:
          'Measurable now from the fraud-loss ledger; the current run-rate is ' +
          '$1.8M (fc-kpi-022). The committed loss-avoidance target.',
      },
      {
        metricKey: 'automated_disposition_pct',
        metricLabel: 'AML automated disposition rate',
        baselineValue: 34,
        targetValue: 60,
        unit: 'percent',
        readinessNote:
          'Measurable from the case-management system. Carry the caveat that ' +
          'this metric is shared with the adjacent FC-AML-2026 program.',
      },
      {
        metricKey: 'sar_past_deadline_pct',
        metricLabel: 'SAR filings past deadline',
        baselineValue: 8,
        targetValue: 0,
        unit: 'percent',
        readinessNote: 'Measurable from the BSA/AML filing log; no gap.',
      },
      {
        metricKey: 'fraud_analyst_fte_cost_usd',
        metricLabel: 'Fraud-analyst FTE cost basis',
        baselineValue: null,
        targetValue: null,
        unit: 'usd_per_fte_per_year',
        readinessNote:
          'SEED GAP — manual-review-cost takeout cannot be verified in dollars ' +
          'until First Capital Finance attests a fully-loaded fraud-analyst FTE ' +
          'cost. Tower cannot confirm that value component before then.',
      },
    ],
  });

  return { skeleton, rubric: evaluateRubric(skeleton) };
}

// ===========================================================================
// Design & Plan phase — the full costed business case for First Capital.
// ===========================================================================

/**
 * Build the FULL Design & Plan business case for First Capital "Fraud
 * Detection Enhancement" — skeleton → roadmap → RACI → full costed case.
 * Deterministic.
 */
export function buildFirstCapitalFraudDetectionFullCase(): FirstCapitalFullCaseResult {
  const { skeleton } = buildFirstCapitalFraudDetectionCase();

  const steadyState =
    skeleton.effort.workstreams.length > 0
      ? skeleton.valueRange.point / 3
      : skeleton.valueRange.point;

  const roadmap = buildRoadmap({
    moveName: MOVE,
    effort: skeleton.effort,
    steadyStateAnnualValue: steadyState,
    phases: [
      {
        id: 'p0_foundation',
        label: 'Phase 0 — Data & model platform foundation',
        order: 0,
        durationMonths: 3,
        workstreamIds: ['foundational', 'data'],
        dependsOn: [],
        isFoundational: true,
        valueMilestone: {
          statement:
            'Fraud feature store and a model gateway stood up — no value yet; ' +
            'this is the precondition for the detection-model build.',
          metricKey: null,
          valueShare: 0,
        },
      },
      {
        id: 'p1_model',
        label: 'Phase 1 — Detection-model build on card fraud',
        order: 1,
        durationMonths: 8,
        workstreamIds: ['ai_build', 'integration', 'data_governance'],
        dependsOn: ['p0_foundation'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Enhanced detection model live on card fraud — losses converging ' +
            'on the $1.2M peer median from the $1.8M run-rate.',
          metricKey: 'card_fraud_losses_usd',
          valueShare: 0.45,
        },
      },
      {
        id: 'p2_disposition',
        label: 'Phase 2 — Disposition automation + process redesign',
        order: 2,
        durationMonths: 5,
        workstreamIds: ['process_redesign'],
        dependsOn: ['p1_model'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Automated disposition rate climbing toward the 60% target; manual ' +
            'review load down.',
          metricKey: 'automated_disposition_pct',
          valueShare: 0.3,
        },
      },
      {
        id: 'p3_adopt_run',
        label: 'Phase 3 — Adoption + run',
        order: 3,
        durationMonths: 12,
        workstreamIds: ['change_adoption', 'run'],
        dependsOn: ['p2_disposition'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Steady-state operation; SAR-past-deadline cleared to zero and the ' +
            'detection model in sustained run.',
          metricKey: 'sar_past_deadline_pct',
          valueShare: 0.25,
        },
      },
    ],
  });

  const raci = buildRaciMatrix({
    moveName: MOVE,
    parties: [
      { id: 'sponsor_cro', name: 'James Park (CRO, Executive Sponsor)', kind: 'human' },
      { id: 'sponsor_cio', name: 'Patricia Huang (CIO)', kind: 'human' },
      { id: 'cfo', name: 'Michael Torres (CFO)', kind: 'human' },
      { id: 'program_mgr', name: 'David Chen (Risk Technology, Program Manager)', kind: 'human' },
      { id: 'bsa_officer', name: 'BSA Officer', kind: 'human' },
      { id: 'solution_arch', name: 'Solution Architect', kind: 'human' },
      { id: 'agent_designer', name: 'Solution-Design Agent', kind: 'agent' },
      { id: 'agent_builder', name: 'Build Agent', kind: 'agent' },
    ],
    decisions: [
      {
        key: 'd_fund_move',
        decision: 'Approve funding for the Move',
        kind: 'governance',
        assignments: [
          { partyId: 'sponsor_cro', role: 'accountable' },
          { partyId: 'program_mgr', role: 'responsible' },
          { partyId: 'cfo', role: 'consulted' },
          { partyId: 'sponsor_cio', role: 'consulted' },
        ],
      },
      {
        key: 'd_architecture',
        decision: 'Select the detection-model architecture',
        kind: 'design',
        assignments: [
          { partyId: 'solution_arch', role: 'accountable' },
          { partyId: 'agent_designer', role: 'responsible' },
          { partyId: 'program_mgr', role: 'consulted' },
        ],
        agentAutonomy: 'recommend',
      },
      {
        key: 'd_model_risk_gate',
        decision: 'Clear model-risk governance + OCC MRA control review',
        kind: 'governance',
        assignments: [
          { partyId: 'sponsor_cro', role: 'accountable' },
          { partyId: 'bsa_officer', role: 'responsible' },
          { partyId: 'sponsor_cio', role: 'consulted' },
        ],
      },
      {
        key: 'd_build_execution',
        decision: 'Execute the detection-model build',
        kind: 'delivery',
        assignments: [
          { partyId: 'program_mgr', role: 'accountable' },
          { partyId: 'agent_builder', role: 'responsible' },
          { partyId: 'solution_arch', role: 'consulted' },
        ],
        agentAutonomy: 'act_with_approval',
      },
      {
        key: 'd_realtime_expansion',
        decision: 'Approve expansion from card to real-time payment fraud',
        kind: 'governance',
        assignments: [
          { partyId: 'sponsor_cro', role: 'accountable' },
          { partyId: 'sponsor_cio', role: 'responsible' },
          { partyId: 'program_mgr', role: 'consulted' },
        ],
      },
      {
        key: 'd_disposition_plan',
        decision: 'Own the disposition-automation and analyst change plan',
        kind: 'delivery',
        assignments: [
          { partyId: 'program_mgr', role: 'accountable' },
          { partyId: 'bsa_officer', role: 'responsible' },
          { partyId: 'sponsor_cro', role: 'informed' },
        ],
      },
    ],
  });

  const fullCase = compileFullBusinessCase({ skeleton, roadmap, raci });
  return { fullCase, roadmap, raci, rubric: evaluateRubric(skeleton) };
}
