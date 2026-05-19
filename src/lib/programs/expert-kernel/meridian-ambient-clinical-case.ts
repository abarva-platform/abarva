// Expert Kernel — Meridian Ambient Clinical Value Chain Activation business-case
// skeleton.
//
// The SECOND real tenant the kernel is proven on. It is modelled exactly on
// `apex-contact-center-case.ts`: a grounded ANCHOR whose every recorded input
// resolves to Meridian's audited substrate — here the program evidence base at
// `src/content/deliverables/meridian/ambient-clinical-value-chain-activation/
// _evidence-base.json`. Seed gaps are declared honestly, never fabricated.
//
// IMPORTANT: nothing here is sourced from `meridian-data/05_kpi_dictionary/` —
// that procedurally-generated KPI dictionary carries nonsensical values and is
// not a trustworthy baseline. The deliverable evidence base is the only source.
//
// `buildMeridianAmbientClinicalCase()` runs the whole kernel — baseline →
// effort → value (haircut) → compiler (critic + qa) — and returns the grounded
// skeleton. It is the integration point the Expert Review Console reads.
//
// Pure module: deterministic, no I/O.

import { buildBaselineModel } from './baseline-model';
import { buildAssumptionLedger } from './assumption-ledger';
import { buildEffortEstimate, DEFAULT_PLANNING_RATE_CARD } from './effort-estimator';
import { buildValueForecast, type ValueForecast } from './value-forecast';
import {
  compileBusinessCase,
  compileFullBusinessCase,
  type BusinessCaseSkeleton,
  type FullBusinessCase,
} from './business-case-compiler';
import { buildRoadmap, type Roadmap } from './roadmap';
import { buildRaciMatrix, type RaciMatrix } from './raci';
import { evaluateRubric, type RubricResult } from './qa-rubric';
import { buildAdoptionApproach, type AdoptionApproach } from './adoption-approach';
import {
  buildMeasurementHandoff,
  type MeasurementHandoff,
} from './measurement-handoff';
import { buildGoDecisionPack, type GoDecisionPack } from './go-decision-pack';
import { rangeOf } from './types';

const TENANT = 'meridian-health';
const MOVE = 'Ambient Clinical Value Chain Activation';

/**
 * Stable tenant key and Move ref for the Meridian case — used by the Expert
 * Review Console registry to scope persisted `expert_reviews` rows. Exported so
 * the route and the data-plane seam reference one canonical pair, never a
 * re-typed string literal.
 */
export const MERIDIAN_AMBIENT_TENANT_KEY = TENANT;
export const MERIDIAN_AMBIENT_MOVE_REF = 'meridian:move:ambient-clinical-value-chain-activation';

// The kernel's default planning rate card — the researched 3-D SI benchmark
// projected onto the should-cost roles, clearly labelled a market planning
// range and "not a quote". A client-specific Meridian rate card would override
// this; until one exists the researched benchmark is the honest default.
const RATE_CARD = DEFAULT_PLANNING_RATE_CARD;

export interface MeridianCaseResult {
  skeleton: BusinessCaseSkeleton;
  rubric: RubricResult;
}

export interface MeridianFullCaseResult {
  fullCase: FullBusinessCase;
  roadmap: Roadmap;
  raci: RaciMatrix;
  rubric: RubricResult;
}

/**
 * Build the Meridian Ambient Clinical value forecast — gross value plus the
 * mandatory six-factor haircut. Steady-state value-at-stake is $8–14M/yr
 * (E9/E49), but it rests on three modeled conversion coefficients that are
 * declared seed gaps, so `grossValueIsProxy` forces `monetisationBlocked`; the
 * range is an illustrative ceiling, NOT a claimed return. Exported so the
 * financial-model export renders the haircut detail off one source.
 */
export function buildMeridianAmbientValueForecast(): ValueForecast {
  return buildValueForecast({
    moveName: MOVE,
    grossAnnualValue: rangeOf(8_000_000, 14_000_000),
    horizonYears: 3,
    adoptionCurve: [0.25, 0.7, 0.9],
    grossValueIsProxy: true,
    haircutScores: {
      // Three parallel ambient vendors + clinician-transition exposure (E52/E55).
      adoptionRisk: 0.5,
      // Reporting closes on T+21, telemetry fragmented across 3 vendors (E26).
      dataReadiness: 0.4,
      // Value rests on the CDI / template-governance redesign landing (E22).
      processDependency: 0.5,
      // Three separate Epic connectors, no integration-surface tests (E26).
      integrationComplexity: 0.45,
      // HIPAA BAA re-audit, 42 CFR Part 2, Info Blocking review pending (E58).
      controlBurden: 0.5,
      // CIO + CMO + VP Revenue Cycle + CMIO all named sponsors — strong (E16).
      sponsorStrength: 0.8,
    },
  });
}

/**
 * Build, critique, and QA the Meridian Ambient Clinical Value Chain Activation
 * business-case skeleton from the kernel. Deterministic.
 */
export function buildMeridianAmbientClinicalCase(): MeridianCaseResult {
  // --- 1. Baseline — audited Meridian substrate ---------------------------
  // Recorded KPIs resolve to the program evidence base (E-citations below).
  // The three absent items are declared seed gaps: they are MODELED conversion
  // coefficients, not measured baselines.
  const baseline = buildBaselineModel({
    moveName: MOVE,
    tenantKey: TENANT,
    metrics: [
      {
        key: 'pajama_time_minutes',
        label: 'Primary-care pajama time (after-hours Epic)',
        value: 129,
        unit: 'minutes_per_day',
        source: 'Evidence base E17 (D06 Documentation-Time Baseline · specialty decomposition)',
        sourceQuality: 'measured',
        asOf: '2026-04-23',
        confidence: 'high',
        caveat:
          '2 hr 09 min/day median for primary care; cohort median is 1 hr 51 min ' +
          '(E28). Per-site variance across the 220 ambulatory sites is 1.42–2.38 hr/day.',
      },
      {
        key: 'mbi_hss_emotional_exhaustion_pct',
        label: 'MBI-HSS emotional-exhaustion burnout (elevated band)',
        value: 54,
        unit: 'percent',
        source: 'Evidence base E2 (D06 · MBI-HSS burnout survey wave, n=1,240)',
        sourceQuality: 'measured',
        asOf: '2026-01-12',
        confidence: 'high',
        caveat:
          'Correlation with documentation time r=0.41 (p<0.01). Cohort median is ' +
          '48% (E29). A quarterly trailing indicator, not a real-time metric.',
      },
      {
        key: 'hcc_capture_pct',
        label: 'HCC capture rate on the MA panel',
        value: 58,
        unit: 'percent',
        source: 'Evidence base E28 (D10 Benchmark Comparison · cohort scorecard)',
        sourceQuality: 'measured',
        asOf: '2026-02-26',
        confidence: 'medium',
        caveat:
          'Cohort median 62%, top-quartile 71% — Meridian sits in the 4th quartile ' +
          'on ambient-value-chain integration maturity.',
      },
      {
        key: 'note_sign_to_close_hours',
        label: 'Note turnaround (sign-to-close)',
        value: 11.4,
        unit: 'hours',
        source: 'Evidence base E8 (D03 Success Metric Tree · supporting metric)',
        sourceQuality: 'measured',
        asOf: '2026-04-23',
        confidence: 'medium',
        caveat:
          'Documentation-cycle supporting metric. Cohort comparison on the narrower ' +
          'sign-to-close window (E28) shows Meridian above cohort median.',
      },
      {
        key: 'cdi_query_resolution_hours',
        label: 'CDI query resolution cycle time',
        value: 38,
        unit: 'hours',
        source: 'Evidence base E8 (D03 Success Metric Tree · CDI cycle-time metric)',
        sourceQuality: 'measured',
        asOf: '2026-04-23',
        confidence: 'medium',
        caveat:
          'CDI runs 42 specialists (E15); the bottleneck is queue starvation, not ' +
          'resolver throughput.',
      },
      {
        key: 'cdi_query_volume_weekly',
        label: 'CDI HCC-relevant query volume',
        value: 40,
        unit: 'queries_per_week',
        source: 'Evidence base E25 (D08/D10 · CDI-queue routing volume benchmark)',
        sourceQuality: 'measured',
        asOf: '2026-04-23',
        confidence: 'medium',
        caveat:
          'Pattern-evidence benchmark expects 180–220 HCC-relevant queries/week at ' +
          "Meridian's scale and MA mix. The ~140-query delta IS the empirical " +
          'measure of the ambient-to-CDI integration gap.',
      },
      {
        key: 'quality_measure_capture_pct',
        label: 'Quality-measure documentation capture (HEDIS + Stars)',
        value: 34,
        unit: 'percent',
        source: 'Evidence base E47 (D15 Intervention Portfolio · lever outcome envelope)',
        sourceQuality: 'measured',
        asOf: '2026-03-18',
        confidence: 'medium',
        caveat: 'Lever 2 target is 55–65% capture from this 34% baseline.',
      },
      {
        key: 'clinician_retention_pct',
        label: 'Clinician retention (annual)',
        value: 88,
        unit: 'percent',
        source: 'Evidence base E9 (D16 Business Case · cognitive-load recovery component)',
        sourceQuality: 'stated',
        asOf: '2026-04-23',
        confidence: 'medium',
        caveat:
          'Retention is the channel through which cognitive-load recovery converts ' +
          'to value; the dollar conversion itself is a declared seed gap below.',
      },
      {
        key: 'ambulatory_visits_weekly',
        label: 'Ambulatory visits per clinician',
        value: 84,
        unit: 'visits_per_clinician_per_week',
        source: 'Evidence base E19 (D04 Intake · chief ambulatory officer field shadow)',
        sourceQuality: 'stated',
        asOf: '2026-04-23',
        confidence: 'medium',
        caveat:
          'Recovered capacity is estimated at 6–9 incremental visits/clinician/week ' +
          'if ambient works in ambulatory primary care.',
      },
      // --- Declared seed gaps — honest "modeled, not measured" -------------
      {
        key: 'cost_per_clinician_hour_usd',
        label: 'Cost-per-clinician-hour conversion coefficient',
        value: null,
        unit: 'usd_per_hour',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not measured. The value-at-stake model (E9) converts recovered pajama ' +
          'time into dollars, but the fully-loaded cost-per-clinician-hour basis ' +
          'is a modeled assumption — Meridian Finance has not attested a figure. ' +
          'Needed to monetise cognitive-load recovery.',
      },
      {
        key: 'raf_to_revenue_coefficient_usd',
        label: 'RAF-to-revenue conversion coefficient',
        value: null,
        unit: 'usd_per_raf_point',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not measured. HCC recapture is sized at $3.2–5.1M/yr (E5/E9), but the ' +
          'RAF-point-to-revenue coefficient on the MA book is a Revenue-Cycle ' +
          'estimate, not an attested baseline. Needed to monetise HCC capture lift.',
      },
      {
        key: 'locum_avoidance_basis_usd',
        label: 'Locum-avoidance dollar basis',
        value: null,
        unit: 'usd_per_year',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-19',
        confidence: 'low',
        seedGapReason:
          'Not measured. The cognitive-load recovery component (E9) names locum ' +
          'avoidance as a value lever, but no locum-spend baseline or avoidance ' +
          'rate is seeded. Modeled, not measured.',
      },
    ],
  });

  // --- 2. Assumptions — first-class, owned --------------------------------
  const assumptions = buildAssumptionLedger([
    {
      key: 'cost_per_clinician_hour',
      statement:
        'Fully-loaded cost per clinician hour is a modeled proxy (~$190/hr for ' +
        'attending physicians) until Meridian Finance attests a figure.',
      owner: 'Priya Raman (VP Revenue Cycle)',
      confidence: 'low',
      source: 'Modeled proxy — seed gap (Finance attestation pending)',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'raf_to_revenue',
      statement:
        'Each RAF point recaptured on the MA panel is worth a modeled ~$430/yr ' +
        'per member; the HCC recapture range $3.2–5.1M/yr rests on this.',
      owner: 'Priya Raman (VP Revenue Cycle)',
      confidence: 'low',
      source: 'Revenue-Cycle estimate — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'locum_avoidance',
      statement:
        'Cognitive-load recovery avoids a modeled ~$1.2M/yr of locum spend via ' +
        'reduced burnout-driven attrition — no locum-spend baseline is seeded.',
      owner: 'Dr. Larsson (CMO)',
      confidence: 'low',
      source: 'Modeled proxy — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'cdi_queue_uplift',
      statement:
        'Ambient-to-CDI integration lifts HCC-relevant query volume from ~40/wk ' +
        'toward the 140–180/wk pattern envelope (E25/E47).',
      owner: 'Dr. Morales (CMIO)',
      confidence: 'medium',
      source: 'Evidence base E47 — D15 lever outcome envelope',
      sensitivityImpact: 'high',
    },
    {
      key: 'portfolio_compounding',
      statement:
        'Parallel-track execution of the three levers produces +25–35% faster ' +
        'outcome realisation than sequential; the low scenario assumes zero.',
      owner: 'Sarah Chen (CIO)',
      confidence: 'medium',
      source: 'Evidence base E32 — pattern-library lever-interaction model',
      sensitivityImpact: 'medium',
    },
    {
      key: 'vendor_council_commissioning',
      statement:
        'All three ambient vendor councils commission their HCC/DRG feedback ' +
        'loops on the G3 timeline (Abridge priority, DAX trailing 30 days).',
      owner: 'Dr. Morales (CMIO)',
      confidence: 'medium',
      source: 'Evidence base E59 — D18 Risk Register R11',
      sensitivityImpact: 'medium',
    },
    {
      key: 'rate_card',
      statement:
        'Blended delivery rate card reflects market rates for the integration-' +
        'engineering and clinical-informatics roles in the estimate.',
      owner: 'Sarah Chen (CIO)',
      confidence: 'medium',
      source: 'Benchmark rate card',
      sensitivityImpact: 'low',
    },
  ]);

  // --- 3. Effort — three levers + foundation + run, role-mix via should-cost
  const effort = buildEffortEstimate({
    moveName: MOVE,
    rateCard: RATE_CARD,
    offshoreRatio: 0.3,
    workstreams: [
      {
        id: 'foundational',
        durationMonths: 4,
        agentSplit: 0.15,
        roleMix: [{ role: 'solution_architect', headcount: 1 }],
      },
      {
        id: 'ai_build',
        durationMonths: 9,
        agentSplit: 0.25,
        roleMix: [
          { role: 'solution_architect', headcount: 1 },
          { role: 'senior_engineer', headcount: 2 },
          { role: 'engineer', headcount: 2 },
        ],
      },
      {
        id: 'integration',
        durationMonths: 8,
        agentSplit: 0.2,
        roleMix: [
          { role: 'senior_engineer', headcount: 1 },
          { role: 'engineer', headcount: 2 },
          { role: 'analyst', headcount: 1 },
        ],
      },
      {
        id: 'process_redesign',
        durationMonths: 6,
        agentSplit: 0.15,
        roleMix: [
          { role: 'analyst', headcount: 2 },
          { role: 'project_manager', headcount: 0.5 },
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
        id: 'data',
        durationMonths: 6,
        agentSplit: 0.1,
        roleMix: [
          { role: 'analyst', headcount: 1.5 },
          { role: 'project_manager', headcount: 0.5 },
        ],
      },
      {
        id: 'change_adoption',
        durationMonths: 12,
        agentSplit: 0.05,
        roleMix: [
          { role: 'project_manager', headcount: 1 },
          { role: 'analyst', headcount: 1 },
        ],
      },
      {
        id: 'run',
        durationMonths: 12,
        agentSplit: 0.35,
        roleMix: [
          { role: 'engineer', headcount: 1 },
          { role: 'analyst', headcount: 1 },
        ],
      },
    ],
  });

  // --- 4. Value forecast — gross value + mandatory haircut -----------------
  const value = buildMeridianAmbientValueForecast();

  // --- 5. Compile -> skeleton (runs the critic) ----------------------------
  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: 'kill_cdi_queue_undershoot',
        condition:
          'CDI-queue routing stays below 55/week at the G2 gate — the ambient-' +
          'to-CDI integration, the program\'s core mechanism, has failed (E45).',
      },
      {
        code: 'kill_vendor_council_blocked',
        condition:
          'HCC feedback-loop commissioning is blocked on more than one vendor ' +
          'council — the documentation-quality value component cannot land (E45).',
      },
    ],
    towerHandoff: [
      {
        metricKey: 'pajama_time_minutes',
        metricLabel: 'Primary-care pajama time',
        baselineValue: 129,
        targetValue: 100,
        unit: 'minutes_per_day',
        readinessNote:
          'Measurable now from the Epic Signal 18-month trace; no gap. Target is ' +
          'a 25–35 min/day reduction (E47).',
      },
      {
        metricKey: 'cdi_query_volume_weekly',
        metricLabel: 'CDI HCC-relevant query volume',
        baselineValue: 40,
        targetValue: 160,
        unit: 'queries_per_week',
        readinessNote:
          'Measurable from the CDI queue; the leading indicator of integration ' +
          'health. Target 140–180/wk (E47).',
      },
      {
        metricKey: 'hcc_capture_pct',
        metricLabel: 'HCC capture on the MA panel',
        baselineValue: 58,
        targetValue: 63,
        unit: 'percent',
        readinessNote:
          'Measurable, but carry the cohort-position caveat. Financial value ' +
          'is NOT verifiable until the RAF-to-revenue coefficient is attested.',
      },
      {
        metricKey: 'cost_per_clinician_hour_usd',
        metricLabel: 'Cost-per-clinician-hour conversion coefficient',
        baselineValue: null,
        targetValue: null,
        unit: 'usd_per_hour',
        readinessNote:
          'SEED GAP — the cognitive-load recovery value cannot be verified in ' +
          'dollars until Meridian Finance attests a fully-loaded clinician-hour ' +
          'cost. Tower cannot confirm financial value before then.',
      },
    ],
  });

  return { skeleton, rubric: evaluateRubric(skeleton) };
}

// ===========================================================================
// Design & Plan phase — the full costed business case for Meridian.
// ===========================================================================

/**
 * Build the FULL Design & Plan business case for Meridian Ambient Clinical
 * Value Chain Activation — skeleton → roadmap → RACI → full costed case.
 * Deterministic.
 */
export function buildMeridianAmbientClinicalFullCase(): MeridianFullCaseResult {
  const { skeleton } = buildMeridianAmbientClinicalCase();

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
        label: 'Phase 0 — Unified ambient telemetry foundation',
        order: 0,
        durationMonths: 4,
        workstreamIds: ['foundational', 'data_governance'],
        dependsOn: [],
        isFoundational: true,
        valueMilestone: {
          statement:
            'A unified Meridian-side ambient telemetry surface stood up across ' +
            'the three vendors — no clinical value yet; this is the precondition.',
          metricKey: null,
          valueShare: 0,
        },
      },
      {
        id: 'p1_cdi',
        label: 'Phase 1 — CDI integration + HCC feedback loop',
        order: 1,
        durationMonths: 9,
        workstreamIds: ['ai_build', 'integration'],
        dependsOn: ['p0_foundation'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Ambient notes route documentation gaps to the CDI queue; HCC ' +
            'feedback loop live on Abridge — CDI volume climbing toward 110/wk.',
          metricKey: 'cdi_query_volume_weekly',
          valueShare: 0.35,
        },
      },
      {
        id: 'p2_governance',
        label: 'Phase 2 — Template governance + consolidation pilot',
        order: 2,
        durationMonths: 6,
        workstreamIds: ['process_redesign', 'data'],
        dependsOn: ['p1_cdi'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Specialty template governance landed; the 18-site consolidation ' +
            'pilot runs as a structured counterfactual — pajama time falling.',
          metricKey: 'pajama_time_minutes',
          valueShare: 0.35,
        },
      },
      {
        id: 'p3_adopt_run',
        label: 'Phase 3 — Adoption + run',
        order: 3,
        durationMonths: 12,
        workstreamIds: ['change_adoption', 'run'],
        dependsOn: ['p2_governance'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Steady-state adoption reached across primary care; HCC capture ' +
            'lift sustained and the value chain in continuous operation.',
          metricKey: 'hcc_capture_pct',
          valueShare: 0.3,
        },
      },
    ],
  });

  const raci = buildRaciMatrix({
    moveName: MOVE,
    parties: [
      { id: 'sponsor_cio', name: 'Sarah Chen (CIO, Executive Sponsor)', kind: 'human' },
      { id: 'sponsor_cmo', name: 'Dr. Larsson (CMO, Clinical Sponsor)', kind: 'human' },
      { id: 'vp_revcycle', name: 'Priya Raman (VP Revenue Cycle)', kind: 'human' },
      { id: 'cmio', name: 'Dr. Morales (CMIO)', kind: 'human' },
      { id: 'cdi_director', name: 'CDI Director', kind: 'human' },
      { id: 'privacy_office', name: 'Privacy & Compliance Office', kind: 'human' },
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
          { partyId: 'sponsor_cio', role: 'accountable' },
          { partyId: 'cmio', role: 'responsible' },
          { partyId: 'sponsor_cmo', role: 'consulted' },
          { partyId: 'vp_revcycle', role: 'consulted' },
        ],
      },
      {
        key: 'd_architecture',
        decision: 'Select the ambient-to-CDI integration architecture',
        kind: 'design',
        assignments: [
          { partyId: 'solution_arch', role: 'accountable' },
          { partyId: 'agent_designer', role: 'responsible' },
          { partyId: 'cmio', role: 'consulted' },
        ],
        agentAutonomy: 'recommend',
      },
      {
        key: 'd_regulatory_gate',
        decision: 'Clear the HIPAA BAA / 42 CFR Part 2 / Info Blocking review',
        kind: 'governance',
        assignments: [
          { partyId: 'privacy_office', role: 'accountable' },
          { partyId: 'cmio', role: 'responsible' },
          { partyId: 'sponsor_cio', role: 'consulted' },
        ],
      },
      {
        key: 'd_build_execution',
        decision: 'Execute the CDI integration + HCC feedback-loop build',
        kind: 'delivery',
        assignments: [
          { partyId: 'cmio', role: 'accountable' },
          { partyId: 'agent_builder', role: 'responsible' },
          { partyId: 'solution_arch', role: 'consulted' },
        ],
        agentAutonomy: 'act_with_approval',
      },
      {
        key: 'd_pilot_go_live',
        decision: 'Approve the 18-site ambient consolidation pilot go-live',
        kind: 'governance',
        assignments: [
          { partyId: 'sponsor_cmo', role: 'accountable' },
          { partyId: 'cmio', role: 'responsible' },
          { partyId: 'cdi_director', role: 'consulted' },
        ],
      },
      {
        key: 'd_rationalisation',
        decision: 'Own the Phase 5 vendor-rationalisation ratification',
        kind: 'governance',
        assignments: [
          { partyId: 'cmio', role: 'accountable' },
          { partyId: 'sponsor_cio', role: 'responsible' },
          { partyId: 'sponsor_cmo', role: 'informed' },
        ],
      },
    ],
  });

  const fullCase = compileFullBusinessCase({ skeleton, roadmap, raci });
  return { fullCase, roadmap, raci, rubric: evaluateRubric(skeleton) };
}

// ===========================================================================
// Mobilize & Handoff — the final phase, grounded on the same Meridian
// substrate. The three RAF/clinician-hour/locum coefficients are Discover
// seed gaps, so the cognitive-load and HCC value metrics carry an UNWIRED
// measurement and the go-decision lands honestly at no_go.
// ===========================================================================

export interface MeridianMobilizeResult {
  /** The Design & Plan business case the Mobilize phase builds on. */
  case: MeridianCaseResult;
  adoption: AdoptionApproach;
  measurement: MeasurementHandoff;
  goPack: GoDecisionPack;
}

/**
 * Build the Mobilize & Handoff deliverables for the real Meridian Ambient
 * Clinical Value Chain Activation Move: the adoption & change approach, the
 * value-measurement → Tower handoff, and the go-decision pack. Grounded on the
 * same audited Meridian substrate as `buildMeridianAmbientClinicalCase`.
 * Deterministic.
 */
export function buildMeridianMobilizeCase(): MeridianMobilizeResult {
  const caseResult = buildMeridianAmbientClinicalCase();
  const { skeleton } = caseResult;

  const adoption = buildAdoptionApproach({
    moveName: MOVE,
    operatingModelOwner: 'Dr. Morales (CMIO, Clinical Informatics)',
    hypercareWeeks: 8,
    impactedRoles: [
      {
        role: 'Primary-care clinician',
        headcount: null,
        changeMagnitude: 'high',
        whatChanges:
          'Clinicians move from manual after-hours documentation to ambient-' +
          'captured notes reviewed and signed in-visit.',
        headcountIsProxy: true,
      },
      {
        role: 'CDI specialist',
        headcount: 42,
        changeMagnitude: 'high',
        whatChanges:
          'CDI specialists work an ambient-routed HCC query queue rather than ' +
          'a starved, manually-built one.',
      },
      {
        role: 'Clinic operations manager',
        headcount: null,
        changeMagnitude: 'moderate',
        whatChanges:
          'Managers coach to the new documentation pattern and the recovered-' +
          'capacity visit targets.',
        headcountIsProxy: true,
      },
    ],
    dimensions: [
      {
        dimension: 'impacted_roles',
        magnitude: 'high',
        recommendation:
          'Three roles change; the clinician role changes most. Stage the ' +
          'rollout by specialty, leading with primary care where pajama time ' +
          'is highest.',
        ownerRole: 'CMIO',
        confidence: 'medium',
        restsOnSeedGap: true,
      },
      {
        dimension: 'process_variance',
        magnitude: 'high',
        recommendation:
          'Specialty template governance varies documentation materially; ' +
          'the process-redesign workstream must land before the change ' +
          'rollout (it is budgeted in the Design & Plan estimate).',
        ownerRole: 'Program Lead',
        confidence: 'medium',
      },
      {
        dimension: 'training_load',
        magnitude: 'moderate',
        recommendation:
          'Role-based training: ambient-tooling curriculum for clinicians, ' +
          'a queue-triage curriculum for CDI specialists.',
        ownerRole: 'Enablement Lead',
        confidence: 'medium',
        restsOnSeedGap: true,
      },
      {
        dimension: 'incentive_change',
        magnitude: 'moderate',
        recommendation:
          'Re-point clinician scorecards away from raw note volume toward ' +
          'documentation quality and recovered capacity.',
        ownerRole: 'CMO',
        confidence: 'medium',
      },
      {
        dimension: 'manager_adoption',
        magnitude: 'high',
        recommendation:
          'Manager reinforcement is the highest-risk layer. A dedicated ' +
          'clinic-manager enablement track with explicit reinforcement in ' +
          'the hypercare window.',
        ownerRole: 'CMIO',
        confidence: 'medium',
      },
      {
        dimension: 'communications',
        magnitude: 'moderate',
        recommendation:
          'Address the clinician narrative directly — ambient documentation ' +
          'recovers cognitive load and after-hours time; it is not a ' +
          'surveillance layer.',
        ownerRole: 'Program Lead',
        confidence: 'medium',
      },
      {
        dimension: 'hypercare',
        magnitude: 'moderate',
        recommendation:
          'An 8-week hypercare window with elevated informatics support and ' +
          'a weekly documentation-quality review; exit when pajama time and ' +
          'CDI volume hold for two consecutive weeks.',
        ownerRole: 'CMIO',
        confidence: 'medium',
      },
    ],
  });

  const measurement = buildMeasurementHandoff({
    moveName: MOVE,
    tenantClientKey: TENANT,
    baseline: skeleton.baseline,
    subjectKind: 'move',
    subjectRef: MERIDIAN_AMBIENT_MOVE_REF,
    metrics: [
      {
        baselineMetricKey: 'pajama_time_minutes',
        label: 'Primary-care pajama time',
        targetValue: 100,
        valueCategory: 'productivity',
        measurementUnit: 'percent',
        cadence: 'monthly',
        measurementOwnerRole: 'CMIO',
      },
      {
        baselineMetricKey: 'cdi_query_volume_weekly',
        label: 'CDI HCC-relevant query volume',
        targetValue: 160,
        valueCategory: 'productivity',
        measurementUnit: 'percent',
        cadence: 'weekly',
        measurementOwnerRole: 'CDI Director',
      },
      {
        baselineMetricKey: 'hcc_capture_pct',
        label: 'HCC capture on the MA panel',
        targetValue: 63,
        valueCategory: 'revenue_lift',
        measurementUnit: 'percent',
        cadence: 'quarterly',
        measurementOwnerRole: 'VP Revenue Cycle',
      },
      {
        baselineMetricKey: 'cost_per_clinician_hour_usd',
        label: 'Cost-per-clinician-hour conversion coefficient',
        targetValue: null,
        valueCategory: 'cost_avoidance',
        measurementUnit: 'usd_seed',
        cadence: 'quarterly',
        measurementOwnerRole: 'VP Revenue Cycle',
        baselineCapturePlan:
          'Meridian Finance attestation of a fully-loaded clinician-hour ' +
          'cost — pending; no dated commitment seeded.',
      },
    ],
  });

  const goPack = buildGoDecisionPack({
    businessCase: skeleton,
    adoption,
    measurement,
  });

  return { case: caseResult, adoption, measurement, goPack };
}
