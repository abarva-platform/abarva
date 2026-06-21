// Golden-eval batch 1 — healthcare-provider + airline industry experts.
//
// Comprehensive coverage for 9 industry experts (5 questions each = 45), each
// hitting 5 distinct angles: headline operating metric, an AI use-case, a
// CXO pain/stuck-point, a vendor/system-of-record/sourcing angle, and a
// diagnostic/maturity/ROI angle. Every question is verified to (a) route
// TOP-1 to its expectedExpertId across all registered experts and (b) surface
// each mustInclude token in the summoned grounding block.

import type { GoldenQuestion } from "./types";

export const BATCH_1_HEALTHCARE_AIRLINE: GoldenQuestion[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Healthcare Revenue Cycle — xp.healthcare-provider.revenue-cycle
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hc-revcycle-metric",
    query:
      "Our net collection rate and AR days are drifting and the initial denial rate keeps climbing — what should our revenue cycle leadership focus on first?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    mustInclude: ["denial"],
  },
  {
    id: "hc-revcycle-aiuc",
    query:
      "Where can AI denial prediction and prevention score claims pre-submission to lift our clean claim rate and cut rework in the revenue cycle?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    mustInclude: ["denial"],
  },
  {
    id: "hc-revcycle-pain",
    query:
      "Our DNFB backlog and coding/CDI bottleneck are killing cash flow and underpayments are slipping through — how do other providers attack mid-cycle revenue cycle leakage?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    mustInclude: ["dnfb"],
  },
  {
    id: "hc-revcycle-vendor",
    query:
      "We run Epic Resolute PB/HB for billing and claims — how should we sequence an AI-assisted prior authorization investment on top of our denials workflow?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    mustInclude: ["prior"],
  },
  {
    id: "hc-revcycle-diag",
    query:
      "How mature is our back-end revenue cycle on denials, underpayments and patient AR, and what is the ROI case for autonomous coding to clear DNFB?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    mustInclude: ["coding"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Clinical Process Transformation — xp.healthcare-provider.clinical-process-transformation
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hc-clinical-metric",
    query:
      "Our clinician documentation time per encounter and after-hours pajama-time charting are driving burnout — what clinical workflow levers move these?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    mustInclude: ["pajama"],
  },
  {
    id: "hc-clinical-aiuc",
    query:
      "How do ambient clinical documentation scribes draft the clinical note during the patient encounter so clinicians stop typing in real time?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    mustInclude: ["ambient"],
  },
  {
    id: "hc-clinical-pain",
    query:
      "Our physicians are drowning in In Basket patient-message triage and alert fatigue from decision support — how do we fix this clinical workflow burden?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    mustInclude: ["in-basket"],
  },
  {
    id: "hc-clinical-vendor",
    query:
      "We're choosing an ambient scribe — DAX vs Abridge vs Suki — to draft notes from the encounter; how should that decision support our clinical documentation strategy?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    mustInclude: ["ambient"],
  },
  {
    id: "hc-clinical-diag",
    query:
      "What is the ROI and maturity case for ambient documentation versus evidence-based clinical decision support given our note quality and clinician burnout?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    mustInclude: ["burnout"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Care Management / VBC — xp.healthcare-provider.care-management-vbc
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hc-vbc-metric",
    query:
      "Under our value-based care contracts our 30-day readmission rate and ED utilization per 1,000 attributed lives are too high — where do we intervene?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    mustInclude: ["readmission"],
  },
  {
    id: "hc-vbc-aiuc",
    query:
      "How does rising-risk stratification and impactability scoring target our care-management capacity at attributed members who will actually change trajectory?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    mustInclude: ["stratification"],
  },
  {
    id: "hc-vbc-pain",
    query:
      "We keep missing transitions of care and our RAF/HCC capture accuracy is leaving risk-adjustment revenue on the table — how do other VBC providers close this?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    mustInclude: ["raf"],
  },
  {
    id: "hc-vbc-vendor",
    query:
      "Under our value-based care shared-savings contracts, how should ADT admit/discharge/transfer feeds wire into our population-health platform to orchestrate transitions of care for attributed lives and prevent readmissions?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    mustInclude: ["adt"],
  },
  {
    id: "hc-vbc-diag",
    query:
      "What is the ROI and maturity case for HCC suspecting and coding-gap detection to improve risk-adjustment accuracy across our attributed population?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    mustInclude: ["hcc"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Patient Access — xp.healthcare-provider.patient-access
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hc-access-metric",
    query:
      "Our third-next-available appointment and new-patient lead time are too long and the no-show rate is high — how do we fix patient access at the digital front door?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    mustInclude: ["no-show"],
  },
  {
    id: "hc-access-aiuc",
    query:
      "How does no-show prediction with targeted outreach recover scheduling capacity and close care gaps instead of burning the booked slot?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    mustInclude: ["no-show"],
  },
  {
    id: "hc-access-pain",
    query:
      "Referral leakage out of our network and a clogged scheduling template are starving access — how do peer providers attack referral leakage and slot utilization?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    mustInclude: ["leakage"],
  },
  {
    id: "hc-access-vendor",
    query:
      "We want online self-scheduling and a conversational contact-center AI agent on our patient portal — how does that lift digital self-scheduling adoption and cut abandonment?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    mustInclude: ["self-scheduling"],
  },
  {
    id: "hc-access-diag",
    query:
      "What is the maturity and ROI case for AI scheduling and template optimization to shorten third-next-available without adding provider hours?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    mustInclude: ["template"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pharmacy Operations — xp.healthcare-provider.pharmacy-operations
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hc-pharmacy-metric",
    query:
      "Our drug spend as a percent of operating expense is rising and 340B savings captured versus WAC look light — how do we run pharmacy operations tighter?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    mustInclude: ["340b"],
  },
  {
    id: "hc-pharmacy-aiuc",
    query:
      "How can AI continuously evaluate each dispense against 340B eligibility rules to flag missed captures and duplicate-discount risk in our pharmacy?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    mustInclude: ["340b"],
  },
  {
    id: "hc-pharmacy-pain",
    query:
      "Specialty scripts keep leaking out before our internal pharmacy captures them, hurting specialty Rx capture rate — how do other health systems stop specialty leakage?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    mustInclude: ["specialty"],
  },
  {
    id: "hc-pharmacy-vendor",
    query:
      "We run Epic Willow for inpatient and outpatient pharmacy — how do we orchestrate specialty capture and benefits investigation on top of it to lift formulary compliance?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    mustInclude: ["formulary"],
  },
  {
    id: "hc-pharmacy-diag",
    query:
      "What is the ROI and maturity case for AI-assisted 340B eligibility and capture optimization to grow compliant savings while shrinking audit exposure?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    mustInclude: ["340b"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Airline Operations & Revenue Management — xp.airline.operations-revenue-management
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "air-ops-metric",
    query:
      "Our on-time performance and completion factor are slipping while passenger load factor and RASM lag — what should the operations control center prioritize?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    mustInclude: ["completion"],
  },
  {
    id: "air-ops-aiuc",
    query:
      "How does integrated IROPS recovery optimization solve aircraft routing, crew, and passenger re-accommodation together so the OCC restores the schedule faster?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    mustInclude: ["irops"],
  },
  {
    id: "air-ops-pain",
    query:
      "Day-of IROPS firefighting in our operations control center is sequential and siloed and disruptions cascade — how do peer carriers fix OCC recovery?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    mustInclude: ["irops"],
  },
  {
    id: "air-ops-vendor",
    query:
      "We want predictive condition-based maintenance from ACARS and sensor data feeding our MRO line-maintenance system — how do we cut unplanned out-of-station removals?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    mustInclude: ["maintenance"],
  },
  {
    id: "air-ops-diag",
    query:
      "What is the ROI and maturity case for AI demand forecasting and dynamic pricing to lift RASM by protecting high-yield demand and optimizing load factor?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    mustInclude: ["load factor"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Network & Schedule Planning — xp.airline.network-schedule-planning
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "air-network-metric",
    query:
      "Our route profitability and network RASM are weak and fleet utilization in block hours per aircraft is low — how should forward network planning respond?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    mustInclude: ["connectivity"],
  },
  {
    id: "air-network-aiuc",
    query:
      "How does AI origin-destination demand forecasting produce a demand band with scenarios months ahead so we size route, frequency, and gauge bets honestly?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    mustInclude: ["gauge"],
  },
  {
    id: "air-network-pain",
    query:
      "We keep launching routes into demand that was never there because our schedule is set by history and hub banking convenience — how do planners fix this?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    mustInclude: ["banking"],
  },
  {
    id: "air-network-vendor",
    query:
      "How should connectivity-aware network and schedule optimization weigh full network contribution including connecting O&D revenue rather than standalone route P&L?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    mustInclude: ["connectivity"],
  },
  {
    id: "air-network-diag",
    query:
      "What is the ROI and maturity case for AI fleet assignment and gauge optimization to fly the right-size aircraft per leg without ordering new aircraft?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    mustInclude: ["gauge"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Loyalty & Customer — xp.airline.loyalty-customer
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "air-loyalty-metric",
    query:
      "Our co-brand card spend and loyalty program revenue are soft and our miles liability and breakage assumptions look risky — where should the frequent-flyer program focus?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    mustInclude: ["co-brand"],
  },
  {
    id: "air-loyalty-aiuc",
    query:
      "How does CLV-based offer personalization predict next-best-offer from joined flight, ancillary, and card-spend data to target loyalty members 1:1?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    mustInclude: ["ancillary"],
  },
  {
    id: "air-loyalty-pain",
    query:
      "We are losing our highest-value elites and cardholders and offer fatigue is hurting our frequent-flyer program — how do other carriers retain elite loyalty members?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    mustInclude: ["elite"],
  },
  {
    id: "air-loyalty-vendor",
    query:
      "How do the co-brand credit-card partnership economics and points deferred-revenue accounting shape where our loyalty program should invest first?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    mustInclude: ["co-brand"],
  },
  {
    id: "air-loyalty-diag",
    query:
      "What is the ROI and maturity case for AI ancillary merchandising and dynamic upsell of bags, seats, and upgrades to lift ancillary revenue per passenger?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    mustInclude: ["ancillary"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Ground & Airport Operations — xp.airline.ground-airport-operations
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "air-ground-metric",
    query:
      "Our aircraft turn time and on-time departure performance are slipping and the baggage mishandling rate is high — how do we run below-the-wing ground operations tighter?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    mustInclude: ["turn time"],
  },
  {
    id: "air-ground-aiuc",
    query:
      "How does turnaround critical-path orchestration track ramp milestones live and alert the ramp lead early enough to push the departure on time?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    mustInclude: ["turnaround"],
  },
  {
    id: "air-ground-pain",
    query:
      "Mishandled transfer bags missing their connection at our hub keep blowing up the ground operation — how do other carriers attack the missed-bag connection rate?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    mustInclude: ["baggage"],
  },
  {
    id: "air-ground-vendor",
    query:
      "How should bag-tracking and connection-risk reconciliation across handling nodes wire into our ramp systems to cut overall baggage mishandling?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    mustInclude: ["baggage"],
  },
  {
    id: "air-ground-diag",
    query:
      "What is the ROI and maturity case for ground workforce demand forecasting and rostering to match ramp staffing to the bank shape and lift on-time push?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    mustInclude: ["rostering"],
  },
];
