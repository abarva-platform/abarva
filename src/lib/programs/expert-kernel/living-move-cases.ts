// Expert Kernel — the living-Move case registry.
//
// The living Move (experience spec §6) was first proven on exactly one tenant
// (Apex Contact Center AI Routing). The kernel is anchored on three real
// cases — Apex Retail, Meridian Health System, FS Demo. This
// registry is the switchboard mapping a stable case id → the tenant's living-
// Move case entry: its six control definitions and its grounded kernel compile
// path. It mirrors `expert-review-cases.ts` exactly — same three case ids
// (`apexretail`, `meridian`, `arcturus`), same `resolve*` / `is*` shape — so
// the route's `?case=` selector resolves a living Move the same way the Expert
// Review Console resolves a review case.
//
// Each case's six controls are the GENUINELY highest-leverage inputs of THAT
// tenant's case, per its own anchor's declared seed gaps and sensitivity — not
// Apex's controls forced onto the others:
//
//   • Apex Retail — Contact Center AI Routing. Three haircut scores (adoption,
//     data readiness, process dependency), the modelled containment uplift
//     (KPI kpi:apex:018, the value mechanism), the offshore delivery mix, and
//     the cost-per-contact baseline (Apex's declared seed gap).
//   • Meridian Health System — Ambient Clinical Value Chain Activation. Three
//     haircut scores (adoption across three parallel vendors, data readiness
//     across fragmented telemetry, process dependency on the CDI/template
//     redesign), the CDI-queue routing volume (E25/E47 — the integration-
//     health value mechanism), the offshore mix, and the cost-per-clinician-
//     hour conversion coefficient (a declared modeled-coefficient seed gap).
//   • FS Demo — Fraud Detection Enhancement. Three haircut
//     scores (data readiness on a strained warehouse, process dependency on
//     the disposition redesign, control burden under the OCC MRA), the card-
//     fraud loss takeout (the hard $2.1M → $1.2M ceiling — the value
//     mechanism), the offshore mix, and the fraud-analyst FTE cost basis (a
//     declared seed gap). First Capital's honest verdict is `kill` whenever
//     the seed gap is filled at a high FTE cost or the loss takeout is small:
//     the kernel can finally see the committed investment does not pay back.
//
// Pure module: deterministic, no I/O.

import { buildBaselineModel, type BaselineMetricInput } from "./baseline-model";
import { buildAssumptionLedger } from "./assumption-ledger";
import { buildEffortEstimate } from "./effort-estimator";
import { demoKernelRateCard } from "./rate-card/demo-rate-card-packs";
import { buildValueForecast } from "./value-forecast";
import { compileBusinessCase } from "./business-case-compiler";
import { rangeOf, round2 } from "./types";
import {
  APEX_CONTACT_CENTER_MOVE_REF,
  APEX_CONTACT_CENTER_TENANT_KEY,
} from "./apex-contact-center-case";
import {
  MERIDIAN_AMBIENT_MOVE_REF,
  MERIDIAN_AMBIENT_TENANT_KEY,
} from "./meridian-ambient-clinical-case";
import {
  FIRSTCAPITAL_FRAUD_MOVE_REF,
  FIRSTCAPITAL_FRAUD_TENANT_KEY,
} from "./firstcapital-fraud-detection-case";
import {
  clamp01,
  num,
  type LivingControlDef,
  type LivingMoveCaseEntry,
  type LivingMoveCompile,
  type LivingMoveControls,
} from "./living-move";

// ===========================================================================
// Apex Retail — Contact Center AI Routing
// ===========================================================================

const APEX_MOVE = "Contact Center AI Routing";
const APEX_BASE_CONTAINMENT_UPLIFT_PTS = 12;
const APEX_BASE_GROSS_LOW = 7_800_000;
const APEX_BASE_GROSS_HIGH = 13_500_000;

/** Apex haircut scores the controls do NOT override — pinned to audited values. */
const APEX_PINNED_HAIRCUT = {
  integrationComplexity: 0.6,
  controlBurden: 0.5,
  sponsorStrength: 0.8,
} as const;

const APEX_CONTROLS: readonly LivingControlDef[] = [
  {
    id: "adoptionRisk",
    kind: "score",
    label: "Adoption confidence",
    hint: "How confident are we that Customer Care agents adopt AI routing? The single largest haircut driver.",
    defaultValue: 0.6,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "dataReadiness",
    kind: "score",
    label: "Data readiness",
    hint: "Is the intent / transcript data unified and instrumented? The CDP consolidation gap sits here.",
    defaultValue: 0.45,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "processDependency",
    kind: "score",
    label: "Process independence",
    hint: "How much of the value lands without the routing process redesign? Higher = less dependent.",
    defaultValue: 0.55,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "containmentUpliftPts",
    kind: "lever",
    label: "Containment uplift",
    hint: "Modelled lift in contact-centre containment. KPI kpi:apex:018 states a 12-point target (28% → 40%).",
    defaultValue: APEX_BASE_CONTAINMENT_UPLIFT_PTS,
    min: 4,
    max: 20,
    step: 1,
    format: "points",
  },
  {
    id: "offshoreRatio",
    kind: "score",
    label: "Offshore delivery mix",
    hint: "Share of delivery labour run offshore. A real cost driver — a higher mix lowers the blended rate.",
    defaultValue: 0.4,
    min: 0,
    max: 0.8,
    step: 0.05,
    format: "percent",
  },
  {
    id: "costPerContactUsd",
    kind: "seed-gap",
    label: "Cost per contact (labour)",
    hint: "Apex's declared seed gap — supply it to un-block payback.",
    defaultValue: null,
    min: 0,
    max: 0,
    step: 0.5,
    format: "usd",
    seedGapBenchmark: 6.5,
    seedGapMetricLabel: "Cost per contact (labour)",
    seedGapNote:
      "Apex has not recorded this — it is a declared seed gap (tenant action " +
      "item, owner Brendan Fox, due 2026-05-15). Until it is supplied the " +
      "value forecast is proxy-anchored and payback is blocked. Supply it " +
      "here to see what closing the gap would do — the surface never " +
      "fabricates it by default.",
  },
];

/** The grounded Apex baseline metrics, with the seed-gap state live. */
function apexBaseline(costPerContactUsd: number | null): BaselineMetricInput[] {
  const costPerContact: BaselineMetricInput =
    costPerContactUsd === null
      ? {
          key: "cost_per_contact_usd",
          label: "Cost per contact (labour)",
          value: null,
          unit: "usd",
          source: "seed gap",
          sourceQuality: "absent",
          asOf: "2026-05-18",
          confidence: "low",
          seedGapReason:
            'Not recorded. Tenant action item "Capture cost-per-contact ' +
            'baseline" (owner Brendan Fox) is due 2026-05-15.',
        }
      : {
          key: "cost_per_contact_usd",
          label: "Cost per contact (labour)",
          value: round2(costPerContactUsd),
          unit: "usd",
          source: "CXO-supplied baseline (living Move)",
          sourceQuality: "stated",
          asOf: "2026-05-21",
          confidence: "medium",
        };

  return [
    {
      key: "aht_minutes",
      label: "Average Handle Time",
      value: 7.2,
      unit: "minutes",
      source: "KPI kpi:apex:019 (NICE CXone)",
      sourceQuality: "measured",
      asOf: "2026-04-30",
      confidence: "high",
      caveat:
        "Rising because easy calls are deflected; harder calls reach agents.",
    },
    {
      key: "containment_pct",
      label: "Contact Center Containment",
      value: 28,
      unit: "percent",
      source: "KPI kpi:apex:018 (NICE CXone)",
      sourceQuality: "measured",
      asOf: "2026-04-30",
      confidence: "medium",
      caveat:
        "Known NICE-vs-IT-dashboard measurement discrepancy; reconciliation " +
        "owned by James Wright, due 2026-05-08.",
    },
    {
      key: "fcr_pct",
      label: "First Call Resolution",
      value: 68,
      unit: "percent",
      source: "KPI kpi:apex:020 (NICE CXone)",
      sourceQuality: "measured",
      asOf: "2026-04-30",
      confidence: "medium",
    },
    {
      key: "agent_utilization_pct",
      label: "Agent Utilization",
      value: 84,
      unit: "percent",
      source: "KPI kpi:apex:021 (NICE CXone)",
      sourceQuality: "measured",
      asOf: "2026-04-30",
      confidence: "high",
      caveat: "Above the 80% target — capacity strain bounds labour takeout.",
    },
    {
      key: "csat",
      label: "CSAT (post-interaction)",
      value: 4.1,
      unit: "score_out_of_5",
      source: "KPI kpi:apex:012 (Zendesk survey)",
      sourceQuality: "measured",
      asOf: "2026-04-30",
      confidence: "medium",
      caveat: "22% response rate; biased toward extreme experiences.",
    },
    {
      key: "repeat_transfer_pct",
      label: "Repeat transfer rate",
      value: 18.4,
      unit: "percent",
      source: "Move P2 baseline deliverable (Genesys routing export)",
      sourceQuality: "measured",
      asOf: "2026-05-03",
      confidence: "medium",
      caveat: "Promotion weeks excluded.",
    },
    costPerContact,
    {
      key: "contact_volume_annual",
      label: "Annual contact volume",
      value: null,
      unit: "contacts_per_year",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-18",
      confidence: "low",
      seedGapReason:
        "Not recorded in the KPI dictionary, telemetry, or the Move baseline.",
    },
    {
      key: "channel_mix",
      label: "Channel mix (voice/chat/IVR split)",
      value: null,
      unit: "percent_split",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-18",
      confidence: "low",
      seedGapReason:
        'Containment note references "IVR + chatbot" but no structured ' +
        "split is seeded.",
    },
    {
      key: "qa_error_rate_pct",
      label: "QA error rate",
      value: null,
      unit: "percent",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-18",
      confidence: "low",
      seedGapReason:
        "No contact-centre quality-defect metric is seeded for Apex.",
    },
  ];
}

/** Recompile the Apex Contact Center living Move. */
function compileApex(controls: LivingMoveControls): LivingMoveCompile {
  const costPerContactUsd = controls.costPerContactUsd ?? null;
  const containmentUpliftPts = num(
    controls,
    "containmentUpliftPts",
    APEX_BASE_CONTAINMENT_UPLIFT_PTS,
  );
  const upliftFactor = containmentUpliftPts / APEX_BASE_CONTAINMENT_UPLIFT_PTS;
  const grossValueIsProxy = costPerContactUsd === null;

  const baseline = buildBaselineModel({
    moveName: APEX_MOVE,
    tenantKey: APEX_CONTACT_CENTER_TENANT_KEY,
    metrics: apexBaseline(costPerContactUsd),
  });

  const value = buildValueForecast({
    moveName: APEX_MOVE,
    grossAnnualValue: rangeOf(
      round2(APEX_BASE_GROSS_LOW * upliftFactor),
      round2(APEX_BASE_GROSS_HIGH * upliftFactor),
    ),
    horizonYears: 3,
    adoptionCurve: [0.3, 0.7, 0.85],
    grossValueIsProxy,
    haircutScores: {
      adoptionRisk: clamp01(num(controls, "adoptionRisk", 0.6)),
      dataReadiness: clamp01(num(controls, "dataReadiness", 0.45)),
      processDependency: clamp01(num(controls, "processDependency", 0.55)),
      ...APEX_PINNED_HAIRCUT,
    },
  });

  const seedGapFilled = costPerContactUsd !== null;
  const assumptions = buildAssumptionLedger([
    {
      key: "cost_per_contact",
      statement: seedGapFilled
        ? `Fully-loaded cost per contact is $${round2(costPerContactUsd)} — ` +
          "supplied by the decision-maker; pending the instrumented tenant " +
          "baseline (due 2026-05-15) for confirmation."
        : "Fully-loaded cost per contact is ~$6.50 (benchmark proxy) until " +
          "the tenant baseline due 2026-05-15 lands.",
      owner: "Brendan Fox (CS Ops)",
      confidence: seedGapFilled ? "medium" : "low",
      source: seedGapFilled
        ? "CXO-supplied baseline (living Move)"
        : "Benchmark proxy — seed gap (tenant baseline pending)",
      sensitivityImpact: "high",
      isSeedGapProxy: !seedGapFilled,
    },
    {
      key: "annual_contact_volume",
      statement:
        "Annual agent-handled contact volume is ~9.0M (benchmark for an " +
        "$80B retailer) — used only to express value in operational hours.",
      owner: "Priya Iyer (Program Lead)",
      confidence: "low",
      source: "Benchmark proxy — seed gap",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    },
    {
      key: "containment_uplift",
      statement:
        `AI routing lifts containment ~${containmentUpliftPts} points ` +
        `(28% → ${round2(28 + containmentUpliftPts)}% target).`,
      owner: "Priya Iyer (Program Lead)",
      confidence: "medium",
      source: "KPI kpi:apex:018 stated target",
      sensitivityImpact: "high",
    },
    {
      key: "adoption_ramp",
      statement:
        "Customer Care agents reach 70% steady-state adoption by year 2.",
      owner: "Mariana Rojas (WFM Lead)",
      confidence: "medium",
      source: "Operating telemetry — CC working group notes",
      sensitivityImpact: "medium",
    },
    {
      key: "privacy_gate_clears",
      statement:
        "The transcript-use privacy review (2026-05-17 milestone) clears " +
        "without scope cuts that remove agent-assist features.",
      owner: "Elena Fischer (AI Governance)",
      confidence: "medium",
      source: "Move milestone + AI Governance Council notes",
      sensitivityImpact: "medium",
    },
    {
      key: "rate_card",
      statement:
        "Blended delivery rate card reflects market rates for AI build and " +
        "integration roles.",
      owner: "David Okafor (Program Lead)",
      confidence: "medium",
      source: "Benchmark rate card",
      sensitivityImpact: "low",
    },
  ]);

  const effort = buildEffortEstimate({
    moveName: APEX_MOVE,
    rateCard: demoKernelRateCard("apex-contact-center"),
    offshoreRatio: clamp01(num(controls, "offshoreRatio", 0.4)),
    workstreams: [
      {
        id: "ai_build",
        durationMonths: 9,
        agentSplit: 0.35,
        roleMix: [
          { role: "solution_architect", headcount: 1 },
          { role: "senior_engineer", headcount: 2 },
          { role: "engineer", headcount: 2 },
        ],
      },
      {
        id: "integration",
        durationMonths: 6,
        agentSplit: 0.2,
        roleMix: [
          { role: "senior_engineer", headcount: 1 },
          { role: "engineer", headcount: 2 },
        ],
      },
      {
        id: "data",
        durationMonths: 5,
        agentSplit: 0.3,
        roleMix: [
          { role: "engineer", headcount: 1 },
          { role: "analyst", headcount: 2 },
        ],
      },
      {
        id: "foundational",
        durationMonths: 4,
        agentSplit: 0.15,
        roleMix: [{ role: "solution_architect", headcount: 1 }],
      },
      {
        id: "data_governance",
        durationMonths: 6,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "process_redesign",
        durationMonths: 5,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1.5 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "change_adoption",
        durationMonths: 9,
        agentSplit: 0.05,
        roleMix: [
          { role: "project_manager", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
      {
        id: "run",
        durationMonths: 12,
        agentSplit: 0.4,
        roleMix: [
          { role: "engineer", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
    ],
  });

  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: "kill_privacy_gate_blocks",
        condition:
          "The 2026-05-17 transcript-use privacy review fails and removes " +
          "agent-assist features — the value case loses its core mechanism.",
      },
    ],
    towerHandoff: [
      {
        metricKey: "containment_pct",
        metricLabel: "Contact Center Containment",
        baselineValue: 28,
        targetValue: round2(28 + containmentUpliftPts),
        unit: "percent",
        readinessNote:
          "Measurable now, but close the NICE-vs-IT reconciliation before " +
          "locking the baseline.",
      },
      {
        metricKey: "cost_per_contact_usd",
        metricLabel: "Cost per contact (labour)",
        baselineValue: costPerContactUsd,
        targetValue: null,
        unit: "usd",
        readinessNote:
          costPerContactUsd === null
            ? "SEED GAP — not measurable until the cost-per-contact baseline " +
              "(due 2026-05-15) is captured."
            : "Baseline supplied by the decision-maker; confirm against the " +
              "instrumented tenant capture (due 2026-05-15).",
      },
    ],
  });

  return { skeleton, value };
}

// ===========================================================================
// Meridian Health System — Ambient Clinical Value Chain Activation
// ===========================================================================

const MERIDIAN_MOVE = "Ambient Clinical Value Chain Activation";
const MERIDIAN_BASE_CDI_VOLUME = 160;
const MERIDIAN_BASE_GROSS_LOW = 8_000_000;
const MERIDIAN_BASE_GROSS_HIGH = 14_000_000;

/** Meridian haircut scores the controls do NOT override — pinned to audited values. */
const MERIDIAN_PINNED_HAIRCUT = {
  integrationComplexity: 0.45,
  controlBurden: 0.5,
  sponsorStrength: 0.8,
} as const;

const MERIDIAN_CONTROLS: readonly LivingControlDef[] = [
  {
    id: "adoptionRisk",
    kind: "score",
    label: "Adoption confidence",
    hint: "Confidence that clinicians adopt ambient documentation across three parallel vendors, given clinician-transition exposure (E52/E55).",
    defaultValue: 0.5,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "dataReadiness",
    kind: "score",
    label: "Data readiness",
    hint: "Is ambient telemetry unified? Reporting closes on T+21 and telemetry is fragmented across three vendors (E26).",
    defaultValue: 0.4,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "processDependency",
    kind: "score",
    label: "Process independence",
    hint: "How much value lands without the CDI / template-governance redesign (E22)? Higher = less dependent.",
    defaultValue: 0.5,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "cdiQueryVolumeWeekly",
    kind: "lever",
    label: "CDI query volume",
    hint: "HCC-relevant CDI queries/week after integration. The leading indicator of integration health; ~40/wk baseline, 140–180/wk pattern envelope (E25/E47).",
    defaultValue: MERIDIAN_BASE_CDI_VOLUME,
    min: 60,
    max: 220,
    step: 5,
    format: "plain",
    unitSuffix: " /wk",
  },
  {
    id: "offshoreRatio",
    kind: "score",
    label: "Offshore delivery mix",
    hint: "Share of integration-engineering labour run offshore. A real cost driver — a higher mix lowers the blended rate.",
    defaultValue: 0.3,
    min: 0,
    max: 0.8,
    step: 0.05,
    format: "percent",
  },
  {
    id: "costPerClinicianHourUsd",
    kind: "seed-gap",
    label: "Cost per clinician hour",
    hint: "Meridian's declared seed gap — supply it to un-block payback.",
    defaultValue: null,
    min: 0,
    max: 0,
    step: 5,
    format: "usd",
    seedGapBenchmark: 190,
    seedGapMetricLabel: "Cost-per-clinician-hour conversion coefficient",
    seedGapNote:
      "Meridian Finance has not attested this — it is a declared seed gap. " +
      "The value-at-stake model (E9) converts recovered pajama time into " +
      "dollars, but the fully-loaded cost-per-clinician-hour basis is a " +
      "modeled assumption. Until it is supplied the value forecast is " +
      "proxy-anchored and payback is blocked. Supply it here to see what " +
      "closing the gap would do — the surface never fabricates it by default.",
  },
];

/** The grounded Meridian baseline metrics, with the seed-gap state live. */
function meridianBaseline(
  costPerClinicianHourUsd: number | null,
): BaselineMetricInput[] {
  const costPerClinicianHour: BaselineMetricInput =
    costPerClinicianHourUsd === null
      ? {
          key: "cost_per_clinician_hour_usd",
          label: "Cost-per-clinician-hour conversion coefficient",
          value: null,
          unit: "usd_per_hour",
          source: "seed gap",
          sourceQuality: "absent",
          asOf: "2026-05-19",
          confidence: "low",
          seedGapReason:
            "Not measured. The value-at-stake model (E9) converts recovered " +
            "pajama time into dollars, but the fully-loaded cost-per-" +
            "clinician-hour basis is a modeled assumption — Meridian Finance " +
            "has not attested a figure. Needed to monetise cognitive-load " +
            "recovery.",
        }
      : {
          key: "cost_per_clinician_hour_usd",
          label: "Cost-per-clinician-hour conversion coefficient",
          value: round2(costPerClinicianHourUsd),
          unit: "usd_per_hour",
          source: "CXO-supplied coefficient (living Move)",
          sourceQuality: "stated",
          asOf: "2026-05-21",
          confidence: "medium",
        };

  return [
    {
      key: "pajama_time_minutes",
      label: "Primary-care pajama time (after-hours Epic)",
      value: 129,
      unit: "minutes_per_day",
      source:
        "Evidence base E17 (D06 Documentation-Time Baseline · specialty decomposition)",
      sourceQuality: "measured",
      asOf: "2026-04-23",
      confidence: "high",
      caveat:
        "2 hr 09 min/day median for primary care; cohort median is 1 hr 51 " +
        "min (E28).",
    },
    {
      key: "mbi_hss_emotional_exhaustion_pct",
      label: "MBI-HSS emotional-exhaustion burnout (elevated band)",
      value: 54,
      unit: "percent",
      source: "Evidence base E2 (D06 · MBI-HSS burnout survey wave, n=1,240)",
      sourceQuality: "measured",
      asOf: "2026-01-12",
      confidence: "high",
      caveat:
        "Correlation with documentation time r=0.41 (p<0.01). A quarterly " +
        "trailing indicator, not a real-time metric.",
    },
    {
      key: "hcc_capture_pct",
      label: "HCC capture rate on the MA panel",
      value: 58,
      unit: "percent",
      source: "Evidence base E28 (D10 Benchmark Comparison · cohort scorecard)",
      sourceQuality: "measured",
      asOf: "2026-02-26",
      confidence: "medium",
      caveat:
        "Cohort median 62%, top-quartile 71% — Meridian sits in the 4th " +
        "quartile.",
    },
    {
      key: "note_sign_to_close_hours",
      label: "Note turnaround (sign-to-close)",
      value: 11.4,
      unit: "hours",
      source: "Evidence base E8 (D03 Success Metric Tree · supporting metric)",
      sourceQuality: "measured",
      asOf: "2026-04-23",
      confidence: "medium",
    },
    {
      key: "cdi_query_resolution_hours",
      label: "CDI query resolution cycle time",
      value: 38,
      unit: "hours",
      source:
        "Evidence base E8 (D03 Success Metric Tree · CDI cycle-time metric)",
      sourceQuality: "measured",
      asOf: "2026-04-23",
      confidence: "medium",
      caveat: "The bottleneck is queue starvation, not resolver throughput.",
    },
    {
      key: "cdi_query_volume_weekly",
      label: "CDI HCC-relevant query volume",
      value: 40,
      unit: "queries_per_week",
      source:
        "Evidence base E25 (D08/D10 · CDI-queue routing volume benchmark)",
      sourceQuality: "measured",
      asOf: "2026-04-23",
      confidence: "medium",
      caveat:
        "Pattern-evidence benchmark expects 180–220 HCC-relevant queries/" +
        "week at Meridian's scale; the ~140-query delta is the measure of " +
        "the ambient-to-CDI integration gap.",
    },
    {
      key: "quality_measure_capture_pct",
      label: "Quality-measure documentation capture (HEDIS + Stars)",
      value: 34,
      unit: "percent",
      source:
        "Evidence base E47 (D15 Intervention Portfolio · lever outcome envelope)",
      sourceQuality: "measured",
      asOf: "2026-03-18",
      confidence: "medium",
      caveat: "Lever 2 target is 55–65% capture from this 34% baseline.",
    },
    {
      key: "clinician_retention_pct",
      label: "Clinician retention (annual)",
      value: 88,
      unit: "percent",
      source:
        "Evidence base E9 (D16 Business Case · cognitive-load recovery component)",
      sourceQuality: "stated",
      asOf: "2026-04-23",
      confidence: "medium",
      caveat:
        "Retention is the channel through which cognitive-load recovery " +
        "converts to value; the dollar conversion is a declared seed gap.",
    },
    {
      key: "ambulatory_visits_weekly",
      label: "Ambulatory visits per clinician",
      value: 84,
      unit: "visits_per_clinician_per_week",
      source:
        "Evidence base E19 (D04 Intake · chief ambulatory officer field shadow)",
      sourceQuality: "stated",
      asOf: "2026-04-23",
      confidence: "medium",
      caveat:
        "Recovered capacity is estimated at 6–9 incremental visits/clinician" +
        "/week if ambient works in ambulatory primary care.",
    },
    costPerClinicianHour,
    {
      key: "raf_to_revenue_coefficient_usd",
      label: "RAF-to-revenue conversion coefficient",
      value: null,
      unit: "usd_per_raf_point",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-19",
      confidence: "low",
      seedGapReason:
        "Not measured. HCC recapture is sized at $3.2–5.1M/yr (E5/E9), but " +
        "the RAF-point-to-revenue coefficient on the MA book is a Revenue-" +
        "Cycle estimate, not an attested baseline.",
    },
    {
      key: "locum_avoidance_basis_usd",
      label: "Locum-avoidance dollar basis",
      value: null,
      unit: "usd_per_year",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-19",
      confidence: "low",
      seedGapReason:
        "Not measured. The cognitive-load recovery component (E9) names " +
        "locum avoidance as a value lever, but no locum-spend baseline or " +
        "avoidance rate is seeded.",
    },
  ];
}

/** Recompile the Meridian Ambient Clinical living Move. */
function compileMeridian(controls: LivingMoveControls): LivingMoveCompile {
  const costPerClinicianHourUsd = controls.costPerClinicianHourUsd ?? null;
  const cdiQueryVolumeWeekly = num(
    controls,
    "cdiQueryVolumeWeekly",
    MERIDIAN_BASE_CDI_VOLUME,
  );
  // Gross value scales linearly with the modelled CDI-queue routing volume —
  // CDI integration health is the value mechanism (E25/E47 envelope).
  const volumeFactor = cdiQueryVolumeWeekly / MERIDIAN_BASE_CDI_VOLUME;
  const grossValueIsProxy = costPerClinicianHourUsd === null;

  const baseline = buildBaselineModel({
    moveName: MERIDIAN_MOVE,
    tenantKey: MERIDIAN_AMBIENT_TENANT_KEY,
    metrics: meridianBaseline(costPerClinicianHourUsd),
  });

  const value = buildValueForecast({
    moveName: MERIDIAN_MOVE,
    grossAnnualValue: rangeOf(
      round2(MERIDIAN_BASE_GROSS_LOW * volumeFactor),
      round2(MERIDIAN_BASE_GROSS_HIGH * volumeFactor),
    ),
    horizonYears: 3,
    adoptionCurve: [0.25, 0.7, 0.9],
    grossValueIsProxy,
    haircutScores: {
      adoptionRisk: clamp01(num(controls, "adoptionRisk", 0.5)),
      dataReadiness: clamp01(num(controls, "dataReadiness", 0.4)),
      processDependency: clamp01(num(controls, "processDependency", 0.5)),
      ...MERIDIAN_PINNED_HAIRCUT,
    },
  });

  const seedGapFilled = costPerClinicianHourUsd !== null;
  const assumptions = buildAssumptionLedger([
    {
      key: "cost_per_clinician_hour",
      statement: seedGapFilled
        ? `Fully-loaded cost per clinician hour is $${round2(
            costPerClinicianHourUsd,
          )} — supplied by the decision-maker; pending Meridian Finance ` +
          "attestation for confirmation."
        : "Fully-loaded cost per clinician hour is a modeled proxy " +
          "(~$190/hr for attending physicians) until Meridian Finance " +
          "attests a figure.",
      owner: "Priya Raman (VP Revenue Cycle)",
      confidence: seedGapFilled ? "medium" : "low",
      source: seedGapFilled
        ? "CXO-supplied coefficient (living Move)"
        : "Modeled proxy — seed gap (Finance attestation pending)",
      sensitivityImpact: "high",
      isSeedGapProxy: !seedGapFilled,
    },
    {
      key: "raf_to_revenue",
      statement:
        "Each RAF point recaptured on the MA panel is worth a modeled " +
        "~$430/yr per member; the HCC recapture range $3.2–5.1M/yr rests " +
        "on this.",
      owner: "Priya Raman (VP Revenue Cycle)",
      confidence: "low",
      source: "Revenue-Cycle estimate — seed gap",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    },
    {
      key: "locum_avoidance",
      statement:
        "Cognitive-load recovery avoids a modeled ~$1.2M/yr of locum spend " +
        "via reduced burnout-driven attrition — no locum-spend baseline is " +
        "seeded.",
      owner: "Dr. Larsson (CMO)",
      confidence: "low",
      source: "Modeled proxy — seed gap",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    },
    {
      key: "cdi_queue_uplift",
      statement:
        `Ambient-to-CDI integration lifts HCC-relevant query volume from ` +
        `~40/wk toward ${cdiQueryVolumeWeekly}/wk (E25/E47 envelope is ` +
        "140–180/wk).",
      owner: "Dr. Morales (CMIO)",
      confidence: "medium",
      source: "Evidence base E47 — D15 lever outcome envelope",
      sensitivityImpact: "high",
    },
    {
      key: "portfolio_compounding",
      statement:
        "Parallel-track execution of the three levers produces +25–35% " +
        "faster outcome realisation than sequential; the low scenario " +
        "assumes zero.",
      owner: "Sarah Chen (CIO)",
      confidence: "medium",
      source: "Evidence base E32 — pattern-library lever-interaction model",
      sensitivityImpact: "medium",
    },
    {
      key: "rate_card",
      statement:
        "Blended delivery rate card reflects market rates for the " +
        "integration-engineering and clinical-informatics roles.",
      owner: "Sarah Chen (CIO)",
      confidence: "medium",
      source: "Benchmark rate card",
      sensitivityImpact: "low",
    },
  ]);

  const effort = buildEffortEstimate({
    moveName: MERIDIAN_MOVE,
    rateCard: demoKernelRateCard("meridian-ambient-clinical"),
    offshoreRatio: clamp01(num(controls, "offshoreRatio", 0.3)),
    workstreams: [
      {
        id: "foundational",
        durationMonths: 4,
        agentSplit: 0.15,
        roleMix: [{ role: "solution_architect", headcount: 1 }],
      },
      {
        id: "ai_build",
        durationMonths: 9,
        agentSplit: 0.25,
        roleMix: [
          { role: "solution_architect", headcount: 1 },
          { role: "senior_engineer", headcount: 2 },
          { role: "engineer", headcount: 2 },
        ],
      },
      {
        id: "integration",
        durationMonths: 8,
        agentSplit: 0.2,
        roleMix: [
          { role: "senior_engineer", headcount: 1 },
          { role: "engineer", headcount: 2 },
          { role: "analyst", headcount: 1 },
        ],
      },
      {
        id: "process_redesign",
        durationMonths: 6,
        agentSplit: 0.15,
        roleMix: [
          { role: "analyst", headcount: 2 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "data_governance",
        durationMonths: 7,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "data",
        durationMonths: 6,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1.5 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "change_adoption",
        durationMonths: 12,
        agentSplit: 0.05,
        roleMix: [
          { role: "project_manager", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
      {
        id: "run",
        durationMonths: 12,
        agentSplit: 0.35,
        roleMix: [
          { role: "engineer", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
    ],
  });

  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: "kill_cdi_queue_undershoot",
        condition:
          "CDI-queue routing stays below 55/week at the G2 gate — the " +
          "ambient-to-CDI integration, the core mechanism, has failed (E45).",
      },
      {
        code: "kill_vendor_council_blocked",
        condition:
          "HCC feedback-loop commissioning is blocked on more than one " +
          "vendor council — the documentation-quality value component " +
          "cannot land (E45).",
      },
    ],
    towerHandoff: [
      {
        metricKey: "cdi_query_volume_weekly",
        metricLabel: "CDI HCC-relevant query volume",
        baselineValue: 40,
        targetValue: cdiQueryVolumeWeekly,
        unit: "queries_per_week",
        readinessNote:
          "Measurable from the CDI queue; the leading indicator of " +
          "integration health.",
      },
      {
        metricKey: "cost_per_clinician_hour_usd",
        metricLabel: "Cost-per-clinician-hour conversion coefficient",
        baselineValue: costPerClinicianHourUsd,
        targetValue: null,
        unit: "usd_per_hour",
        readinessNote:
          costPerClinicianHourUsd === null
            ? "SEED GAP — the cognitive-load recovery value cannot be " +
              "verified in dollars until Meridian Finance attests a fully-" +
              "loaded clinician-hour cost."
            : "Coefficient supplied by the decision-maker; confirm against " +
              "the Meridian Finance attestation.",
      },
    ],
  });

  return { skeleton, value };
}

// ===========================================================================
// FS Demo — Fraud Detection Enhancement
// ===========================================================================

const FIRSTCAPITAL_MOVE = "Fraud Detection Enhancement";
// The audited card-fraud loss takeout — $2.1M baseline → $1.2M peer median is
// a $0.9M/yr hard ceiling. The low scenario sizes a smaller takeout; the high
// scenario sizes the real-time-payment expansion on top.
const FIRSTCAPITAL_BASE_TAKEOUT_USD = 900_000;
const FIRSTCAPITAL_BASE_GROSS_LOW = 900_000;
const FIRSTCAPITAL_BASE_GROSS_HIGH = 3_400_000;

/** First Capital haircut scores the controls do NOT override — pinned. */
const FIRSTCAPITAL_PINNED_HAIRCUT = {
  adoptionRisk: 0.8,
  integrationComplexity: 0.45,
  sponsorStrength: 0.8,
} as const;

const FIRSTCAPITAL_CONTROLS: readonly LivingControlDef[] = [
  {
    id: "dataReadiness",
    kind: "score",
    label: "Data readiness",
    hint: "Is the data platform ready? The SQL Server warehouse runs at 84% utilization — the platform is under strain.",
    defaultValue: 0.5,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "processDependency",
    kind: "score",
    label: "Process independence",
    hint: "How much value lands without the disposition process redesign? Manual-review takeout depends on it. Higher = less dependent.",
    defaultValue: 0.55,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "controlBurden",
    kind: "score",
    label: "Control headroom",
    hint: "Regulatory headroom under the OCC MRA (MRA-2 findings). Lower = heavier control burden bounding the case.",
    defaultValue: 0.45,
    min: 0.1,
    max: 1,
    step: 0.05,
    format: "percent",
  },
  {
    id: "fraudLossTakeoutUsd",
    kind: "lever",
    label: "Card fraud loss takeout",
    hint: "Annual card-fraud loss avoided. The audited ceiling is $0.9M/yr ($2.1M → $1.2M peer median, KPI fc-kpi-012) — the value mechanism.",
    defaultValue: FIRSTCAPITAL_BASE_TAKEOUT_USD,
    min: 300_000,
    max: 1_400_000,
    step: 50_000,
    format: "usd",
  },
  {
    id: "offshoreRatio",
    kind: "score",
    label: "Offshore delivery mix",
    hint: "Share of ML and risk-technology labour run offshore. A real cost driver — a higher mix lowers the blended rate.",
    defaultValue: 0.35,
    min: 0,
    max: 0.8,
    step: 0.05,
    format: "percent",
  },
  {
    id: "fraudAnalystFteCostUsd",
    kind: "seed-gap",
    label: "Fraud-analyst FTE cost",
    hint: "First Capital's declared seed gap — supply it to un-block payback.",
    defaultValue: null,
    min: 0,
    max: 0,
    step: 5_000,
    format: "usd",
    seedGapBenchmark: 135_000,
    seedGapMetricLabel: "Fraud-analyst FTE cost basis",
    seedGapNote:
      "First Capital Finance has not attested this — it is a declared seed " +
      "gap. The manual-review reduction lever depends on a fully-loaded " +
      "fraud-analyst FTE cost to convert disposition-automation gains into " +
      "dollars. Until it is supplied the value forecast is proxy-anchored " +
      "and payback is blocked. Supply it here to see what closing the gap " +
      "would do — un-blocking monetisation can reveal the committed " +
      "investment does not pay back, an honest `kill`. The surface never " +
      "fabricates it by default.",
  },
];

/** The grounded First Capital baseline metrics, with the seed-gap state live. */
function firstCapitalBaseline(
  fraudAnalystFteCostUsd: number | null,
): BaselineMetricInput[] {
  const fteCost: BaselineMetricInput =
    fraudAnalystFteCostUsd === null
      ? {
          key: "fraud_analyst_fte_cost_usd",
          label: "Fraud-analyst FTE cost basis",
          value: null,
          unit: "usd_per_fte_per_year",
          source: "seed gap",
          sourceQuality: "absent",
          asOf: "2026-05-19",
          confidence: "low",
          seedGapReason:
            "Not recorded in the KPI dictionary or the program inventory. " +
            "The manual-review reduction lever depends on a fully-loaded " +
            "fraud-analyst FTE cost to convert disposition-automation gains " +
            "into dollars.",
        }
      : {
          key: "fraud_analyst_fte_cost_usd",
          label: "Fraud-analyst FTE cost basis",
          value: round2(fraudAnalystFteCostUsd),
          unit: "usd_per_fte_per_year",
          source: "CXO-supplied basis (living Move)",
          sourceQuality: "stated",
          asOf: "2026-05-21",
          confidence: "medium",
        };

  return [
    {
      key: "card_fraud_losses_usd",
      label: "Card fraud annualized losses",
      value: 2_100_000,
      unit: "usd_per_year",
      source: "KPI fc-kpi-012 (Fraud Detection Enhancement program baseline)",
      sourceQuality: "measured",
      asOf: "2026-03-31",
      confidence: "high",
      caveat:
        "Peer median is $1.2M/yr — the program commits to closing to that " +
        "figure. Current run-rate is $1.8M (fc-kpi-022, Q1 actuals).",
    },
    {
      key: "card_fraud_peer_median_usd",
      label: "Card fraud losses — peer median",
      value: 1_200_000,
      unit: "usd_per_year",
      source:
        "KPI fc-kpi-012 peer benchmark (Fraud Detection Enhancement baseline)",
      sourceQuality: "benchmark",
      asOf: "2026-03-31",
      confidence: "high",
      caveat: "The committed target for the program — $2.1M → $1.2M.",
    },
    {
      key: "annual_fraud_losses_usd",
      label: "Annual fraud losses (all channels)",
      value: 7_000_000,
      unit: "usd_per_year",
      source: "KPI fc-kpi-011 (Fraud loss benchmark 2025)",
      sourceQuality: "measured",
      asOf: "2025-12-31",
      confidence: "high",
      caveat:
        "Peer median is $3.2M/yr. Card fraud ($2.1M) is one component; the " +
        "remainder spans real-time payment, ACH, and account-takeover fraud.",
    },
    {
      key: "aml_false_positive_pct",
      label: "AML false-positive rate",
      value: 94,
      unit: "percent",
      source: "KPI fc-kpi-013 (OCC MRA-2 findings)",
      sourceQuality: "measured",
      asOf: "2026-03-31",
      confidence: "high",
      caveat:
        "Peer median 45%. A NICE Actimize upgrade gate — adjacent to this " +
        "Move but a separate program (FC-AML-2026).",
    },
    {
      key: "automated_disposition_pct",
      label: "AML automated disposition rate",
      value: 34,
      unit: "percent",
      source: "KPI fc-kpi-014 (OCC MRA-2 findings)",
      sourceQuality: "measured",
      asOf: "2026-03-31",
      confidence: "high",
      caveat:
        "Peer median 72%. Low automated disposition means manual review " +
        "load is high — the operational-cost lever for the fraud case.",
    },
    {
      key: "sar_past_deadline_pct",
      label: "SAR filings past deadline",
      value: 8,
      unit: "percent",
      source: "KPI fc-kpi-015 (OCC MRA-2 findings)",
      sourceQuality: "measured",
      asOf: "2026-03-31",
      confidence: "high",
      caveat:
        "Peer median 0%. A regulatory-remediation metric — past-deadline " +
        "SARs are direct OCC exposure.",
    },
    {
      key: "program_investment_usd",
      label: "Program investment (committed)",
      value: 1_800_000,
      unit: "usd",
      source: "Program inventory FC-FRAUD-2026 (active_programs.json)",
      sourceQuality: "measured",
      asOf: "2026-05-10",
      confidence: "high",
      caveat:
        "The program is in P4 Value Tracking, status on-track. This is the " +
        "committed investment, not a kernel should-cost estimate.",
    },
    {
      key: "current_run_rate_usd",
      label: "Fraud detection current run-rate",
      value: 1_800_000,
      unit: "usd_per_year",
      source: "KPI fc-kpi-022 (Fraud Detection Enhancement Q1 2026)",
      sourceQuality: "measured",
      asOf: "2026-03-31",
      confidence: "high",
      caveat:
        "Card fraud annualized at $1.8M on Q1 actuals — partway from the " +
        "$2.1M baseline toward the $1.2M target.",
    },
    fteCost,
    {
      key: "alert_volume_annual",
      label: "Fraud alert volume / cost-per-alert",
      value: null,
      unit: "alerts_per_year",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-19",
      confidence: "low",
      seedGapReason:
        "Not recorded. Annual alert volume and a per-alert handling cost " +
        "are needed to size the operational efficiency of a detection-model " +
        "uplift. Neither is in the seeded substrate.",
    },
    {
      key: "false_positive_operational_cost_usd",
      label: "False-positive operational cost",
      value: null,
      unit: "usd_per_year",
      source: "seed gap",
      sourceQuality: "absent",
      asOf: "2026-05-19",
      confidence: "low",
      seedGapReason:
        "Not recorded. The 94% AML false-positive rate (fc-kpi-013) is " +
        "measured, but the dollar cost of investigating those false " +
        "positives is not seeded. Modeled, not measured.",
    },
  ];
}

/** Recompile the First Capital Fraud Detection living Move. */
function compileFirstCapital(controls: LivingMoveControls): LivingMoveCompile {
  const fraudAnalystFteCostUsd = controls.fraudAnalystFteCostUsd ?? null;
  const fraudLossTakeoutUsd = num(
    controls,
    "fraudLossTakeoutUsd",
    FIRSTCAPITAL_BASE_TAKEOUT_USD,
  );
  // Gross value scales linearly with the modelled card-fraud loss takeout —
  // the hard $0.9M/yr ceiling (KPI fc-kpi-012) is the value mechanism.
  const takeoutFactor = fraudLossTakeoutUsd / FIRSTCAPITAL_BASE_TAKEOUT_USD;
  const grossValueIsProxy = fraudAnalystFteCostUsd === null;

  const baseline = buildBaselineModel({
    moveName: FIRSTCAPITAL_MOVE,
    tenantKey: FIRSTCAPITAL_FRAUD_TENANT_KEY,
    metrics: firstCapitalBaseline(fraudAnalystFteCostUsd),
  });

  const value = buildValueForecast({
    moveName: FIRSTCAPITAL_MOVE,
    grossAnnualValue: rangeOf(
      round2(FIRSTCAPITAL_BASE_GROSS_LOW * takeoutFactor),
      round2(FIRSTCAPITAL_BASE_GROSS_HIGH * takeoutFactor),
    ),
    horizonYears: 3,
    adoptionCurve: [0.5, 0.85, 1.0],
    grossValueIsProxy,
    haircutScores: {
      dataReadiness: clamp01(num(controls, "dataReadiness", 0.5)),
      processDependency: clamp01(num(controls, "processDependency", 0.55)),
      controlBurden: clamp01(num(controls, "controlBurden", 0.45)),
      ...FIRSTCAPITAL_PINNED_HAIRCUT,
    },
  });

  const seedGapFilled = fraudAnalystFteCostUsd !== null;
  const assumptions = buildAssumptionLedger([
    {
      key: "fraud_analyst_fte_cost",
      statement: seedGapFilled
        ? `Fully-loaded fraud-analyst FTE cost is $${round2(
            fraudAnalystFteCostUsd,
          )}/yr — supplied by the decision-maker; pending First Capital ` +
          "Finance attestation for confirmation."
        : "Fully-loaded fraud-analyst FTE cost is a modeled proxy " +
          "(~$135k/yr) until First Capital Finance attests a figure.",
      owner: "Michael Torres (CFO)",
      confidence: seedGapFilled ? "medium" : "low",
      source: seedGapFilled
        ? "CXO-supplied basis (living Move)"
        : "Modeled proxy — seed gap (Finance attestation pending)",
      sensitivityImpact: "high",
      isSeedGapProxy: !seedGapFilled,
    },
    {
      key: "alert_volume",
      statement:
        "Annual fraud alert volume is a modeled proxy (~120k alerts/yr for " +
        "a bank of First Capital's scale) — used only to express review " +
        "load.",
      owner: "David Chen (Risk Technology)",
      confidence: "low",
      source: "Modeled proxy — seed gap",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    },
    {
      key: "false_positive_cost",
      statement:
        "Each false-positive investigation costs a modeled ~$18 of analyst " +
        "time — no per-alert handling cost is seeded.",
      owner: "James Park (CRO)",
      confidence: "low",
      source: "Modeled proxy — seed gap",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    },
    {
      key: "fraud_loss_takeout",
      statement:
        `The detection-model enhancement closes card fraud losses by ` +
        `~$${round2(fraudLossTakeoutUsd)}/yr toward the $1.2M peer median ` +
        "— the audited ceiling is a $0.9M/yr loss avoidance.",
      owner: "James Park (CRO)",
      confidence: "medium",
      source: "KPI fc-kpi-012 committed target",
      sensitivityImpact: "high",
    },
    {
      key: "realtime_payment_expansion",
      statement:
        "Expanding fraud detection from card to real-time payment fraud " +
        "after FedNow go-live roughly doubles the addressable fraud-loss " +
        "surface.",
      owner: "Patricia Huang (CIO)",
      confidence: "medium",
      source: "Program inventory FC-FRAUD-2026 next-gate",
      sensitivityImpact: "medium",
    },
    {
      key: "rate_card",
      statement:
        "Blended delivery rate card reflects market rates for the ML and " +
        "risk-technology roles in the estimate.",
      owner: "Patricia Huang (CIO)",
      confidence: "medium",
      source: "Benchmark rate card",
      sensitivityImpact: "low",
    },
  ]);

  const effort = buildEffortEstimate({
    moveName: FIRSTCAPITAL_MOVE,
    rateCard: demoKernelRateCard("firstcapital-fraud-detection"),
    offshoreRatio: clamp01(num(controls, "offshoreRatio", 0.35)),
    workstreams: [
      {
        id: "foundational",
        durationMonths: 3,
        agentSplit: 0.15,
        roleMix: [{ role: "solution_architect", headcount: 1 }],
      },
      {
        id: "ai_build",
        durationMonths: 8,
        agentSplit: 0.35,
        roleMix: [
          { role: "solution_architect", headcount: 1 },
          { role: "senior_engineer", headcount: 2 },
          { role: "engineer", headcount: 2 },
        ],
      },
      {
        id: "integration",
        durationMonths: 6,
        agentSplit: 0.2,
        roleMix: [
          { role: "senior_engineer", headcount: 1 },
          { role: "engineer", headcount: 2 },
        ],
      },
      {
        id: "data",
        durationMonths: 5,
        agentSplit: 0.3,
        roleMix: [
          { role: "engineer", headcount: 1 },
          { role: "analyst", headcount: 2 },
        ],
      },
      {
        id: "data_governance",
        durationMonths: 7,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "process_redesign",
        durationMonths: 5,
        agentSplit: 0.1,
        roleMix: [
          { role: "analyst", headcount: 1.5 },
          { role: "project_manager", headcount: 0.5 },
        ],
      },
      {
        id: "change_adoption",
        durationMonths: 8,
        agentSplit: 0.05,
        roleMix: [
          { role: "project_manager", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
      {
        id: "run",
        durationMonths: 12,
        agentSplit: 0.4,
        roleMix: [
          { role: "engineer", headcount: 1 },
          { role: "analyst", headcount: 1 },
        ],
      },
    ],
  });

  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    extraKillCriteria: [
      {
        code: "kill_fraud_loss_floor",
        condition:
          "Card fraud losses stall above the $1.8M Q1 run-rate — the " +
          "detection model has stopped converging on the $1.2M peer-median " +
          "target.",
      },
      {
        code: "kill_realtime_expansion_blocked",
        condition:
          "FedNow go-live slips far enough that the real-time payment " +
          "fraud expansion — the larger value pool — cannot be reached in " +
          "horizon.",
      },
    ],
    towerHandoff: [
      {
        metricKey: "card_fraud_losses_usd",
        metricLabel: "Card fraud annualized losses",
        baselineValue: 2_100_000,
        targetValue: round2(2_100_000 - fraudLossTakeoutUsd),
        unit: "usd_per_year",
        readinessNote:
          "Measurable now from the fraud-loss ledger; the current run-rate " +
          "is $1.8M (fc-kpi-022).",
      },
      {
        metricKey: "fraud_analyst_fte_cost_usd",
        metricLabel: "Fraud-analyst FTE cost basis",
        baselineValue: fraudAnalystFteCostUsd,
        targetValue: null,
        unit: "usd_per_fte_per_year",
        readinessNote:
          fraudAnalystFteCostUsd === null
            ? "SEED GAP — manual-review-cost takeout cannot be verified in " +
              "dollars until First Capital Finance attests a fully-loaded " +
              "fraud-analyst FTE cost."
            : "Basis supplied by the decision-maker; confirm against the " +
              "First Capital Finance attestation.",
      },
    ],
  });

  return { skeleton, value };
}

// ===========================================================================
// The registry
// ===========================================================================

/** The stable case ids — one per kernel-anchored tenant. Mirrors the Expert
 *  Review Console registry exactly. */
export type LivingMoveCaseId = "apexretail" | "meridian" | "arcturus";

/** The living-Move case registry — three anchors, keyed by case id. */
export const LIVING_MOVE_CASES: Readonly<
  Record<LivingMoveCaseId, LivingMoveCaseEntry>
> = Object.freeze({
  apexretail: {
    id: "apexretail",
    tenantLabel: "Apex Retail",
    moveLabel: APEX_MOVE,
    provenance:
      "Apex Retail · Contact Center AI Routing · costed business case · " +
      "recompiled by the Expert Kernel",
    controls: APEX_CONTROLS,
    seedGapControlId: "costPerContactUsd",
    compile: compileApex,
  },
  meridian: {
    id: "meridian",
    tenantLabel: "Meridian Health System",
    moveLabel: MERIDIAN_MOVE,
    provenance:
      "Meridian Health System · Ambient Clinical Value Chain Activation · " +
      "costed business case · recompiled by the Expert Kernel",
    controls: MERIDIAN_CONTROLS,
    seedGapControlId: "costPerClinicianHourUsd",
    compile: compileMeridian,
  },
  arcturus: {
    id: "arcturus",
    tenantLabel: "FS Demo",
    moveLabel: FIRSTCAPITAL_MOVE,
    provenance:
      "FS Demo · Fraud Detection Enhancement · costed " +
      "business case · recompiled by the Expert Kernel",
    controls: FIRSTCAPITAL_CONTROLS,
    seedGapControlId: "fraudAnalystFteCostUsd",
    compile: compileFirstCapital,
  },
});

/** The case ids, in display order — Apex first (the proven default). */
export const LIVING_MOVE_CASE_IDS: readonly LivingMoveCaseId[] = [
  "apexretail",
  "meridian",
  "arcturus",
];

/** The default case — Apex, the first proven anchor. */
export const DEFAULT_LIVING_MOVE_CASE_ID: LivingMoveCaseId = "apexretail";

/** True when `value` is a known living-Move case id. */
export function isLivingMoveCaseId(value: unknown): value is LivingMoveCaseId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(LIVING_MOVE_CASES, value)
  );
}

/**
 * Resolve a case id (e.g. from a `?case=` searchParam) to its registry entry.
 * An unknown or absent id falls back to the default Apex case — the living
 * Move never fails to render.
 */
export function resolveLivingMoveCase(
  caseId: string | null | undefined,
): LivingMoveCaseEntry {
  return isLivingMoveCaseId(caseId)
    ? LIVING_MOVE_CASES[caseId]
    : LIVING_MOVE_CASES[DEFAULT_LIVING_MOVE_CASE_ID];
}

/** Stable Move refs for the three anchors (mirrors `expert-review-cases.ts`). */
export const LIVING_MOVE_REFS: Readonly<Record<LivingMoveCaseId, string>> =
  Object.freeze({
    apexretail: APEX_CONTACT_CENTER_MOVE_REF,
    meridian: MERIDIAN_AMBIENT_MOVE_REF,
    arcturus: FIRSTCAPITAL_FRAUD_MOVE_REF,
  });
