// Expert Kernel — Apex Contact Center AI Routing business-case skeleton.
//
// This is the FIRST real case the kernel is proven on (§11). Every input here
// is grounded in Apex's audited substrate — see
// `docs/strategy/APEX-REALNESS-AUDIT-CONTACT-CENTER.md`. Recorded KPIs come
// from `src/scripts/setup-data/apex-data/`; seed gaps are declared honestly,
// never fabricated.
//
// `buildApexContactCenterCase()` runs the whole kernel — baseline → effort →
// value (haircut) → compiler (critic + qa) — and returns the grounded
// skeleton. It is the integration point the in-app view reads.
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
import { buildAdoptionApproach, type AdoptionApproach } from './adoption-approach';
import {
  buildMeasurementHandoff,
  type MeasurementHandoff,
} from './measurement-handoff';
import {
  buildGoDecisionPack,
  type GoDecisionPack,
} from './go-decision-pack';
import { rangeOf } from './types';

const TENANT = 'apex-retail';
const MOVE = 'Contact Center AI Routing';

// The kernel default planning rate card — clearly labelled "not a quote". The
// researched, client-specific rate card drops in here when that workstream
// lands; nothing else in this case has to change.
const RATE_CARD = DEFAULT_PLANNING_RATE_CARD;

export interface ApexCaseResult {
  skeleton: BusinessCaseSkeleton;
  rubric: RubricResult;
}

export interface ApexFullCaseResult {
  fullCase: FullBusinessCase;
  roadmap: Roadmap;
  raci: RaciMatrix;
  rubric: RubricResult;
}

/**
 * Build, critique, and QA the Apex Contact Center AI Routing business-case
 * skeleton from the kernel. Deterministic.
 */
export function buildApexContactCenterCase(): ApexCaseResult {
  // --- 1. Baseline — audited Apex substrate -------------------------------
  // Recorded KPIs are from src/scripts/setup-data/apex-data/05_kpi_dictionary.
  // The four absent items are declared seed gaps (see the audit doc).
  const baseline = buildBaselineModel({
    moveName: MOVE,
    tenantKey: TENANT,
    metrics: [
      {
        key: 'aht_minutes',
        label: 'Average Handle Time',
        value: 7.2,
        unit: 'minutes',
        source: 'KPI kpi:apex:019 (NICE CXone)',
        sourceQuality: 'measured',
        asOf: '2026-04-30',
        confidence: 'high',
        caveat: 'Rising because easy calls are deflected; harder calls reach agents.',
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
          'Known NICE-vs-IT-dashboard measurement discrepancy; reconciliation owned by James Wright, due 2026-05-08.',
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
      // --- Declared seed gaps — honest "not recorded" ----------------------
      {
        key: 'cost_per_contact_usd',
        label: 'Cost per contact (labour)',
        value: null,
        unit: 'usd',
        source: 'seed gap',
        sourceQuality: 'absent',
        asOf: '2026-05-18',
        confidence: 'low',
        seedGapReason:
          'Not recorded. Tenant action item "Capture cost-per-contact baseline" ' +
          '(owner Brendan Fox) is due 2026-05-15 — see operating telemetry.',
      },
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
          'Not recorded in the KPI dictionary, telemetry, or the Move baseline. ' +
          'Needed to convert AHT/containment deltas into FTE-hours and dollars.',
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
          'Containment note references "IVR + chatbot" but no structured split is seeded.',
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
    ],
  });

  // --- 2. Assumptions — first-class, owned --------------------------------
  const assumptions = buildAssumptionLedger([
    {
      key: 'cost_per_contact',
      statement:
        'Fully-loaded cost per contact is ~$6.50 (benchmark proxy) until the ' +
        'tenant baseline due 2026-05-15 lands.',
      owner: 'Brendan Fox (CS Ops)',
      confidence: 'low',
      source: 'Benchmark proxy — seed gap (tenant baseline pending)',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'annual_contact_volume',
      statement:
        'Annual agent-handled contact volume is ~9.0M (benchmark for an $80B ' +
        'retailer) — used only to express value in operational hours.',
      owner: 'Priya Iyer (Program Lead)',
      confidence: 'low',
      source: 'Benchmark proxy — seed gap',
      sensitivityImpact: 'high',
      isSeedGapProxy: true,
    },
    {
      key: 'containment_uplift',
      statement:
        'AI routing lifts containment ~12 points (28% → 40% target) — the ' +
        'KPI dictionary states this uplift target explicitly.',
      owner: 'Priya Iyer (Program Lead)',
      confidence: 'medium',
      source: 'KPI kpi:apex:018 stated target',
      sensitivityImpact: 'high',
    },
    {
      key: 'adoption_ramp',
      statement:
        'Customer Care agents reach 70% steady-state adoption by year 2; the ' +
        'WFM lead is on record preferring agent-assist over IVR replacement.',
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

  // --- 3. Effort — eight workstreams, role-mix via should-cost engine ------
  const effort = buildEffortEstimate({
    moveName: MOVE,
    rateCard: RATE_CARD,
    offshoreRatio: 0.4,
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

  // --- 4. Value forecast — gross value + mandatory haircut -----------------
  // Gross value rests on the cost-per-contact proxy (a seed gap), so
  // grossValueIsProxy = true forces monetisationBlocked. The number below is
  // an illustrative ceiling, NOT a claimed return.
  const value = buildValueForecast({
    moveName: MOVE,
    grossAnnualValue: rangeOf(7_800_000, 13_500_000),
    horizonYears: 3,
    adoptionCurve: [0.3, 0.7, 0.85],
    grossValueIsProxy: true,
    haircutScores: {
      // Agent-assist preferred by WFM lead, but adoption not yet proven.
      adoptionRisk: 0.6,
      // CDP consolidation gap — intent/transcript data not yet unified.
      dataReadiness: 0.45,
      // Value depends on the routing process redesign landing.
      processDependency: 0.55,
      // NICE CXone aging; Salesforce/AWS connectors well understood.
      integrationComplexity: 0.6,
      // Customer-facing inference + transcript privacy review pending.
      controlBurden: 0.5,
      // CIO + CDO + VP Customer Care all named sponsors — strong.
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
        targetValue: 40,
        unit: 'percent',
        readinessNote:
          'Measurable now, but close the NICE-vs-IT reconciliation (due 2026-05-08) before locking the baseline.',
      },
      {
        metricKey: 'aht_minutes',
        metricLabel: 'Average Handle Time',
        baselineValue: 7.2,
        targetValue: 6.5,
        unit: 'minutes',
        readinessNote: 'Measurable from NICE CXone; no gap.',
      },
      {
        metricKey: 'csat',
        metricLabel: 'CSAT (post-interaction)',
        baselineValue: 4.1,
        targetValue: 4.4,
        unit: 'score_out_of_5',
        readinessNote: 'Measurable from Zendesk survey; carry the response-bias caveat.',
      },
      {
        metricKey: 'cost_per_contact_usd',
        metricLabel: 'Cost per contact (labour)',
        baselineValue: null,
        targetValue: null,
        unit: 'usd',
        readinessNote:
          'SEED GAP — not measurable until the cost-per-contact baseline (due 2026-05-15) is captured. Tower cannot verify financial value before then.',
      },
    ],
  });

  return { skeleton, rubric: evaluateRubric(skeleton) };
}

// ===========================================================================
// Design & Plan phase — the full costed business case for Apex.
//
// This extends the skeleton above into the depth deliverable: a phased costed
// roadmap, a human+agent RACI, and the full three-scenario business case.
// Every input remains grounded in the audited Apex substrate; no fabrication.
// ===========================================================================

/**
 * Build the FULL Design & Plan business case for Apex Contact Center AI
 * Routing — skeleton → roadmap → RACI → full costed case. Deterministic.
 */
export function buildApexContactCenterFullCase(): ApexFullCaseResult {
  const { skeleton } = buildApexContactCenterCase();

  // --- Roadmap — 4 phases, foundational phase 0 -----------------------------
  // Steady-state annual value: the post-haircut year-3 net value, the most
  // honest "steady-state" figure the value forecast produces.
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
        label: 'Phase 0 — Data & platform foundation',
        order: 0,
        durationMonths: 5,
        workstreamIds: ['foundational', 'data'],
        dependsOn: [],
        isFoundational: true,
        valueMilestone: {
          statement:
            'Intent / transcript data unified and a model gateway stood up — ' +
            'no customer-facing value yet; this is the precondition.',
          metricKey: null,
          valueShare: 0,
        },
      },
      {
        id: 'p1_pilot',
        label: 'Phase 1 — Routing pilot on Customer Care queues',
        order: 1,
        durationMonths: 7,
        workstreamIds: ['ai_build', 'integration', 'data_governance'],
        dependsOn: ['p0_foundation'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'AI routing live on pilot queues — containment +4 pts, AHT down ' +
            '~0.3 min on piloted contacts.',
          metricKey: 'containment_pct',
          valueShare: 0.25,
        },
      },
      {
        id: 'p2_scale',
        label: 'Phase 2 — Scale-out + process redesign',
        order: 2,
        durationMonths: 6,
        workstreamIds: ['process_redesign'],
        dependsOn: ['p1_pilot'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Routing scaled across Customer Care; agent-assist workflow ' +
            'redesigned — containment toward the 40% target.',
          metricKey: 'containment_pct',
          valueShare: 0.45,
        },
      },
      {
        id: 'p3_adopt_run',
        label: 'Phase 3 — Adoption + run',
        order: 3,
        durationMonths: 12,
        workstreamIds: ['change_adoption', 'run'],
        dependsOn: ['p2_scale'],
        isFoundational: false,
        valueMilestone: {
          statement:
            'Steady-state adoption (~70%) reached; hypercare complete and ' +
            'the routing model in sustained operation.',
          metricKey: 'csat',
          valueShare: 0.3,
        },
      },
    ],
  });

  // --- RACI — human + agent decision-rights matrix --------------------------
  const raci = buildRaciMatrix({
    moveName: MOVE,
    parties: [
      { id: 'sponsor_cio', name: 'CIO (Executive Sponsor)', kind: 'human' },
      { id: 'sponsor_cdo', name: 'CDO (Data Sponsor)', kind: 'human' },
      { id: 'vp_care', name: 'VP Customer Care', kind: 'human' },
      { id: 'program_lead', name: 'Priya Iyer (Program Lead)', kind: 'human' },
      { id: 'wfm_lead', name: 'Mariana Rojas (WFM Lead)', kind: 'human' },
      { id: 'ai_gov', name: 'Elena Fischer (AI Governance)', kind: 'human' },
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
          { partyId: 'program_lead', role: 'responsible' },
          { partyId: 'sponsor_cdo', role: 'consulted' },
          { partyId: 'vp_care', role: 'consulted' },
        ],
      },
      {
        key: 'd_architecture',
        decision: 'Select the solution architecture',
        kind: 'design',
        assignments: [
          { partyId: 'solution_arch', role: 'accountable' },
          { partyId: 'agent_designer', role: 'responsible' },
          { partyId: 'program_lead', role: 'consulted' },
        ],
        agentAutonomy: 'recommend',
      },
      {
        key: 'd_privacy_gate',
        decision: 'Clear the transcript-use privacy review',
        kind: 'governance',
        assignments: [
          { partyId: 'ai_gov', role: 'accountable' },
          { partyId: 'program_lead', role: 'responsible' },
          { partyId: 'sponsor_cdo', role: 'consulted' },
        ],
      },
      {
        key: 'd_build_execution',
        decision: 'Execute the AI routing build',
        kind: 'delivery',
        assignments: [
          { partyId: 'program_lead', role: 'accountable' },
          { partyId: 'agent_builder', role: 'responsible' },
          { partyId: 'solution_arch', role: 'consulted' },
        ],
        agentAutonomy: 'act_with_approval',
      },
      {
        key: 'd_go_live',
        decision: 'Approve pilot go-live on Customer Care queues',
        kind: 'governance',
        assignments: [
          { partyId: 'vp_care', role: 'accountable' },
          { partyId: 'program_lead', role: 'responsible' },
          { partyId: 'wfm_lead', role: 'consulted' },
          { partyId: 'ai_gov', role: 'consulted' },
        ],
      },
      {
        key: 'd_adoption_plan',
        decision: 'Own the agent adoption and change plan',
        kind: 'delivery',
        assignments: [
          { partyId: 'wfm_lead', role: 'accountable' },
          { partyId: 'program_lead', role: 'responsible' },
          { partyId: 'vp_care', role: 'informed' },
        ],
      },
    ],
  });

  const fullCase = compileFullBusinessCase({ skeleton, roadmap, raci });
  return { fullCase, roadmap, raci, rubric: evaluateRubric(skeleton) };
}

// ===========================================================================
// Mobilize & Handoff — the final phase, grounded on the same Apex substrate.
// ===========================================================================

export interface ApexMobilizeResult {
  /** The Design & Plan business case the Mobilize phase builds on. */
  case: ApexCaseResult;
  adoption: AdoptionApproach;
  measurement: MeasurementHandoff;
  goPack: GoDecisionPack;
}

/**
 * Build the Mobilize & Handoff deliverables for the real Apex Contact Center
 * AI Routing Move: the adoption & change approach, the value-measurement →
 * Tower handoff (wired to the Discover baseline), and the go-decision pack.
 *
 * Grounded on the same audited Apex substrate as `buildApexContactCenterCase`.
 * No fabrication — the cost-per-contact metric is a Discover seed gap, so its
 * measurement metric is honestly carried as UNWIRED and the go-decision lands
 * at `no_go` (the open monetisation blocker fires a kill trigger), not a fake
 * `go`.
 *
 * Deterministic.
 */
export function buildApexMobilizeCase(): ApexMobilizeResult {
  const caseResult = buildApexContactCenterCase();
  const { skeleton } = caseResult;

  // --- Adoption & change approach — decision-brief depth, NOT a design -----
  const adoption = buildAdoptionApproach({
    moveName: MOVE,
    // Operating-model owner — distinct from the executive sponsor. The WFM
    // lead in Customer Care Operations is on record accepting run accountability.
    operatingModelOwner: 'Mariana Rojas (WFM Lead, Customer Care Operations)',
    hypercareWeeks: 6,
    impactedRoles: [
      {
        role: 'Customer Care agent',
        // Headcount not seeded for Apex — honest proxy, flagged.
        headcount: null,
        changeMagnitude: 'high',
        whatChanges:
          'Agents move from manual call handling to AI-routed, ' +
          'assist-augmented handling; harder calls now reach them.',
        headcountIsProxy: true,
      },
      {
        role: 'Customer Care team manager',
        headcount: null,
        changeMagnitude: 'moderate',
        whatChanges:
          'Managers coach to new routing/assist metrics and reinforce the ' +
          'changed handling pattern daily.',
        headcountIsProxy: true,
      },
      {
        role: 'Workforce-management analyst',
        headcount: null,
        changeMagnitude: 'moderate',
        whatChanges:
          'Capacity planning re-baselined around the new containment and ' +
          'AHT mix.',
        headcountIsProxy: true,
      },
    ],
    dimensions: [
      {
        dimension: 'impacted_roles',
        magnitude: 'high',
        recommendation:
          'Three roles change; the agent role changes most. Stage the ' +
          'rollout by team rather than flipping the floor at once.',
        ownerRole: 'WFM Lead',
        confidence: 'medium',
        restsOnSeedGap: true,
      },
      {
        dimension: 'process_variance',
        magnitude: 'high',
        recommendation:
          'Routing logic varies handling materially; recommend a process ' +
          'redesign workstream lands before the change rollout (it is ' +
          'budgeted in the Design & Plan estimate).',
        ownerRole: 'Program Lead',
        confidence: 'medium',
      },
      {
        dimension: 'training_load',
        magnitude: 'moderate',
        recommendation:
          'Role-based training: a heavier curriculum for agents (assist ' +
          'tooling), a lighter one for managers and WFM analysts.',
        ownerRole: 'Enablement Lead',
        confidence: 'medium',
        restsOnSeedGap: true,
      },
      {
        dimension: 'incentive_change',
        magnitude: 'moderate',
        recommendation:
          'Re-point agent performance incentives away from raw handle ' +
          'time toward resolution quality, so the new routing is not ' +
          'fought by the old scorecard.',
        ownerRole: 'Customer Care Operations',
        confidence: 'medium',
      },
      {
        dimension: 'manager_adoption',
        magnitude: 'high',
        recommendation:
          'Manager reinforcement is the highest-risk layer. Recommend a ' +
          'dedicated manager-enablement track and explicit reinforcement ' +
          'in the hypercare window.',
        ownerRole: 'WFM Lead',
        confidence: 'medium',
      },
      {
        dimension: 'communications',
        magnitude: 'moderate',
        recommendation:
          'Address the agent narrative directly — AI routing augments ' +
          'agents, it does not replace them; the WFM lead is on record ' +
          'preferring agent-assist over IVR replacement.',
        ownerRole: 'Program Lead',
        confidence: 'medium',
      },
      {
        dimension: 'hypercare',
        magnitude: 'moderate',
        recommendation:
          'A 6-week hypercare window with elevated floor support and a ' +
          'daily routing-quality review; exit when adoption and CSAT hold ' +
          'for two consecutive weeks.',
        ownerRole: 'WFM Lead',
        confidence: 'medium',
      },
    ],
  });

  // --- Value-measurement model -> Tower handoff ---------------------------
  // Each metric is wired to a real Discover baseline value. cost_per_contact
  // is a seed gap, so it is carried UNWIRED with a dated capture plan — never
  // dropped, never faked.
  const measurement = buildMeasurementHandoff({
    moveName: MOVE,
    tenantClientKey: TENANT,
    baseline: skeleton.baseline,
    subjectKind: 'move',
    subjectRef: 'apex:move:contact-center-ai-routing',
    metrics: [
      {
        baselineMetricKey: 'containment_pct',
        label: 'Contact Center Containment',
        targetValue: 40,
        valueCategory: 'productivity',
        measurementUnit: 'percent',
        cadence: 'monthly',
        measurementOwnerRole: 'WFM Lead',
      },
      {
        baselineMetricKey: 'aht_minutes',
        label: 'Average Handle Time',
        targetValue: 6.5,
        valueCategory: 'productivity',
        measurementUnit: 'percent',
        cadence: 'monthly',
        measurementOwnerRole: 'WFM Lead',
      },
      {
        baselineMetricKey: 'csat',
        label: 'CSAT (post-interaction)',
        targetValue: 4.4,
        valueCategory: 'customer_experience',
        measurementUnit: 'nps_delta',
        cadence: 'quarterly',
        measurementOwnerRole: 'Customer Care Operations',
      },
      {
        baselineMetricKey: 'cost_per_contact_usd',
        label: 'Cost per contact (labour)',
        targetValue: null,
        valueCategory: 'cost_avoidance',
        measurementUnit: 'usd_seed',
        cadence: 'monthly',
        measurementOwnerRole: 'CS Ops',
        baselineCapturePlan:
          'Tenant action item "Capture cost-per-contact baseline" ' +
          '(owner Brendan Fox) due 2026-05-15.',
      },
    ],
  });

  // --- Go-decision pack ----------------------------------------------------
  const goPack = buildGoDecisionPack({
    businessCase: skeleton,
    adoption,
    measurement,
  });

  return { case: caseResult, adoption, measurement, goPack };
}
