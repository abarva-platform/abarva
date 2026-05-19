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
import { buildEffortEstimate } from './effort-estimator';
import { buildValueForecast } from './value-forecast';
import {
  compileBusinessCase,
  type BusinessCaseSkeleton,
} from './business-case-compiler';
import { evaluateRubric, type RubricResult } from './qa-rubric';
import { rangeOf } from './types';
import type { RoleRateCard } from '@/lib/source/should-cost/should-cost-model';

const TENANT = 'apex-retail';
const MOVE = 'Contact Center AI Routing';

// Fully-loaded annual rate card — benchmark figures, treated as an assumption.
const RATE_CARD: RoleRateCard[] = [
  { role: 'engagement_lead', onshoreAnnualRate: 280_000, offshoreAnnualRate: 150_000 },
  { role: 'solution_architect', onshoreAnnualRate: 240_000, offshoreAnnualRate: 130_000 },
  { role: 'senior_engineer', onshoreAnnualRate: 200_000, offshoreAnnualRate: 95_000 },
  { role: 'engineer', onshoreAnnualRate: 150_000, offshoreAnnualRate: 70_000 },
  { role: 'analyst', onshoreAnnualRate: 120_000, offshoreAnnualRate: 60_000 },
  { role: 'project_manager', onshoreAnnualRate: 170_000, offshoreAnnualRate: 90_000 },
];

export interface ApexCaseResult {
  skeleton: BusinessCaseSkeleton;
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
