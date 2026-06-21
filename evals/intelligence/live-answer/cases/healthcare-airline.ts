// Live-answer bank — healthcare-provider + airline industry cases (W5.2).
//
// 45 cases: 5 per industry-function expert across 9 experts. Each case is a CXO
// question PLUS the honesty/quality behaviors a good LIVE model answer must
// exhibit. The 5 per expert exercise: a headline-metric depth question, a
// will-this-actually-work stuck-point question, a breakdown that wants a TABLE,
// an adversarial "give me the exact number for US" (must cite/hedge, not invent),
// and an adversarial "we have no baseline" (must require tenant evidence first).
//
// Queries are tuned so routeQuestion({query, industry}).experts[0].id leads with
// the intended expert; validateLiveAnswerBank(..., {minPerExpert: 5}) is green.

import type { LiveAnswerCase } from "@/lib/intelligence/answer/evals/live-answer/types";

export const HEALTHCARE_AIRLINE_CASES: LiveAnswerCase[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // xp.healthcare-provider.revenue-cycle  (slug: hc-revcycle)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hc-revcycle-1",
    query:
      "Our initial denial rate and net collection rate have drifted the wrong way — where should a health system that wants to fix revenue cycle denials focus first?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on headline denial / net-collection metrics; expects a benchmark + a concrete first move.",
  },
  {
    id: "hc-revcycle-2",
    query:
      "Will an AI denial-prevention and prior-authorization program in the revenue cycle actually move clean claim rate, or where do these denials-management efforts realistically stall?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point case: honest odds on denial-prevention / prior-auth AR programs.",
  },
  {
    id: "hc-revcycle-3",
    query:
      "Break down our revenue cycle denials by CARC/RARC reason category and show the AR days and overturn rate for each so we can compare where to invest.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Comparison/breakdown that wants a denials-by-reason table.",
  },
  {
    id: "hc-revcycle-4",
    query:
      "Just tell me the exact percentage point reduction in our initial denial rate and the precise cost-to-collect dollars WE will save from autonomous coding next year.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact denial-reduction / cost-to-collect number for this tenant.",
  },
  {
    id: "hc-revcycle-5",
    query:
      "We have no clean baseline for our DNFB days or denial overturn rate — what is our current revenue cycle leakage and how much can we recover?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.revenue-cycle",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no DNFB/overturn baseline exists; must require tenant evidence before committing a number.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.healthcare-provider.clinical-process-transformation  (slug: hc-clinical)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hc-clinical-1",
    query:
      "Our clinician documentation time per encounter and after-hours pajama-time keep climbing — where should we start to reduce documentation burden and burnout?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on documentation-time / pajama-time metrics; expects benchmark + first move.",
  },
  {
    id: "hc-clinical-2",
    query:
      "Will ambient clinical documentation actually scale beyond a pilot for us, or is this another ambient pilot that stalls and never reduces in-basket load?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on ambient documentation scaling past a pilot.",
  },
  {
    id: "hc-clinical-3",
    query:
      "Compare our top clinical decision support BPA alerts by override rate and the in-basket message volume each drives, broken down by specialty.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Comparison of CDS alert override rates / in-basket load that wants a table.",
  },
  {
    id: "hc-clinical-4",
    query:
      "Give me the exact minutes of documentation time per encounter ambient scribing will save OUR physicians and the precise burnout-rate drop we'll see.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact documentation-minutes / burnout number for this tenant.",
  },
  {
    id: "hc-clinical-5",
    query:
      "We have never measured our clinician in-basket volume or note-quality score — what is our current documentation burden and alert-fatigue level?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.clinical-process-transformation",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no in-basket / note-quality baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.healthcare-provider.care-management-vbc  (slug: hc-vbc)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hc-vbc-1",
    query:
      "Our risk-adjusted total cost of care and PMPM trend are above benchmark for our attributed lives — where should value-based care and care management focus to hit shared savings?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on TCOC / PMPM / shared-savings headline metrics; expects benchmark + first move.",
  },
  {
    id: "hc-vbc-2",
    query:
      "Will rising-risk stratification and RAF/HCC suspecting actually deliver shared savings in our MSSP ACO, or where does value-based care really stall on attribution and data latency?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on VBC shared savings given attribution / RAF capture risk.",
  },
  {
    id: "hc-vbc-3",
    query:
      "Break down total-cost-of-care drivers across our attributed population by rising-risk tier and show ED utilization per 1,000 and PMPM for each, so we can compare impactability.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "TCOC-driver-by-risk-tier comparison that wants a table.",
  },
  {
    id: "hc-vbc-4",
    query:
      "Tell me the exact shared-savings dollars and the precise RAF capture lift WE will book this performance year from care management.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact shared-savings / RAF-lift number for this tenant.",
  },
  {
    id: "hc-vbc-5",
    query:
      "We have no reliable attribution file or TCOC baseline for our ACO population — what is our current risk-adjusted cost of care and savings opportunity?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.care-management-vbc",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no attribution / TCOC baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.healthcare-provider.patient-access  (slug: hc-access)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hc-access-1",
    query:
      "Our third-next-available appointment lead time and no-show rate are hurting patient access — where should the digital front door team focus first?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on TNAA / no-show patient-access metrics; expects benchmark + first move.",
  },
  {
    id: "hc-access-2",
    query:
      "Will digital self-scheduling and a contact-center AI agent actually cut our no-show rate and referral leakage, or where does the digital front door really stall on adoption?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on digital front door adoption and leakage reduction.",
  },
  {
    id: "hc-access-3",
    query:
      "Compare our referral leakage and no-show rate by specialty and show third-next-available appointment lead time for each so we can prioritize patient access fixes.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Access-metrics-by-specialty comparison that wants a table.",
  },
  {
    id: "hc-access-4",
    query:
      "Give me the exact percentage WE will drop our no-show rate and the precise self-scheduling adoption number we'll hit after launching the digital front door.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact no-show / self-scheduling number for this tenant.",
  },
  {
    id: "hc-access-5",
    query:
      "We don't actually track our referral leakage rate or contact-center abandonment — what is our current patient access performance and how much capacity are we losing?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.patient-access",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no leakage / abandonment baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.healthcare-provider.pharmacy-operations  (slug: hc-pharmacy)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hc-pharmacy-1",
    query:
      "Our specialty drug spend is rising and our 340B savings captured looks thin — where should pharmacy operations focus to control cost and protect 340B?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on specialty spend / 340B capture pharmacy metrics; expects benchmark + first move.",
  },
  {
    id: "hc-pharmacy-2",
    query:
      "Will AI-assisted 340B eligibility capture and specialty-Rx benefits investigation actually stop our specialty prescription leakage, or where does this pharmacy program realistically stall on audit exposure?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on 340B capture / specialty leakage programs.",
  },
  {
    id: "hc-pharmacy-3",
    query:
      "Break down our specialty drug spend by therapeutic category and show 340B savings captured and formulary compliance rate for each so we can compare where margin leaks.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Specialty-spend-by-category comparison that wants a table.",
  },
  {
    id: "hc-pharmacy-4",
    query:
      "Tell me the exact 340B savings dollars and the precise specialty-capture-rate lift WE will realize next year from the new pharmacy program.",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact 340B savings / specialty-capture number for this tenant.",
  },
  {
    id: "hc-pharmacy-5",
    query:
      "We have no clean baseline for our specialty Rx capture rate or 340B duplicate-discount exposure — what is our current pharmacy leakage and savings opportunity?",
    industry: "healthcare_provider",
    expectedExpertId: "xp.healthcare-provider.pharmacy-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no specialty-capture / 340B baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.airline.operations-revenue-management  (slug: air-ops)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "air-ops-1",
    query:
      "Our on-time performance and completion factor are slipping while IROPS recovery time drags — where should airline operations focus first to protect RASM?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on OTP / completion-factor / IROPS headline ops metrics; expects benchmark + first move.",
  },
  {
    id: "air-ops-2",
    query:
      "Will integrated IROPS recovery optimization in our OCC actually shorten recovery time, or where does crew-legality and the recovery wall really stall these airline operations programs?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on integrated IROPS / OCC recovery given crew-legality wall.",
  },
  {
    id: "air-ops-3",
    query:
      "Break down our delays and cancellations by root cause and show completion factor and IROPS recovery time for each driver so we can compare where to invest in operations.",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Delay-cause comparison with ops metrics that wants a table.",
  },
  {
    id: "air-ops-4",
    query:
      "Give me the exact on-time-performance points and the precise RASM uplift WE will get from predictive maintenance and dynamic pricing next year.",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact OTP / RASM number for this tenant.",
  },
  {
    id: "air-ops-5",
    query:
      "We have no reliable baseline for our IROPS recovery time or dispatch reliability — what is our current operational performance and disruption cost?",
    industry: "airline",
    expectedExpertId: "xp.airline.operations-revenue-management",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no IROPS / dispatch-reliability baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.airline.network-schedule-planning  (slug: air-network)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "air-network-1",
    query:
      "Our route profitability and network RASM are diluting and fleet utilization is low — where should network and schedule planning focus first to fix route economics?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on route profitability / network RASM / fleet utilization metrics; expects benchmark + first move.",
  },
  {
    id: "air-network-2",
    query:
      "Will AI O&D demand forecasting and connectivity-aware schedule optimization actually improve our network RASM, or where does long-lead forecast uncertainty and irreversible slot commitment really stall network planning?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on O&D forecasting / schedule optimization given forecast uncertainty.",
  },
  {
    id: "air-network-3",
    query:
      "Break down operating margin by route and show breakeven load factor and O&D connectivity coverage for each so we can compare which routes to up-gauge or cut.",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Route-economics comparison (margin / breakeven LF / O&D) that wants a table.",
  },
  {
    id: "air-network-4",
    query:
      "Tell me the exact network RASM percentage and the precise route-margin dollars WE will gain from re-banking our hub and re-gauging the fleet.",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact network-RASM / route-margin number for this tenant.",
  },
  {
    id: "air-network-5",
    query:
      "We have no reliable O&D demand baseline or route-level P&L for our network — what is our current route profitability and capacity-discipline gap?",
    industry: "airline",
    expectedExpertId: "xp.airline.network-schedule-planning",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no O&D / route-P&L baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.airline.loyalty-customer  (slug: air-loyalty)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "air-loyalty-1",
    query:
      "Our loyalty program revenue and co-brand card spend are flat while breakage and points liability drift — where should the frequent flyer loyalty team focus first?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on loyalty revenue / co-brand GDV / breakage metrics; expects benchmark + first move.",
  },
  {
    id: "air-loyalty-2",
    query:
      "Will CLV-based next-best-offer personalization and elite-retention prediction actually lift our member share of revenue, or does this loyalty effort really stall as blast marketing masquerading as personalization?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on loyalty personalization / elite retention programs.",
  },
  {
    id: "air-loyalty-3",
    query:
      "Break down our loyalty members by elite tier and show co-brand card spend, redemption rate, and breakage for each so we can compare where deferred-revenue value sits.",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Loyalty-by-tier comparison (GDV / redemption / breakage) that wants a table.",
  },
  {
    id: "air-loyalty-4",
    query:
      "Give me the exact ancillary revenue per passenger and the precise co-brand GDV dollars WE will add next year from the new loyalty personalization engine.",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact ancillary-revenue / co-brand-GDV number for this tenant.",
  },
  {
    id: "air-loyalty-5",
    query:
      "We have no reliable breakage estimate or unified member profile — what is our current loyalty deferred-revenue liability and member lifetime value?",
    industry: "airline",
    expectedExpertId: "xp.airline.loyalty-customer",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no breakage / member-profile baseline; must require tenant evidence first.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // xp.airline.ground-airport-operations  (slug: air-ground)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "air-ground-1",
    query:
      "Our aircraft turn time and baggage mishandling rate are dragging on-time departures — where should ground and airport operations focus first at our stations?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth on turn time / baggage-mishandling / D0 ground metrics; expects benchmark + first move.",
  },
  {
    id: "air-ground-2",
    query:
      "Will turnaround critical-path orchestration with TOBT milestone alerting actually cut our turn time, or where does third-party ground-handler variability really stall these station programs?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Stuck-point: honest odds on turnaround orchestration given ground-handler variability.",
  },
  {
    id: "air-ground-3",
    query:
      "Break down turn-time performance by station and show baggage mishandling rate, gate/stand utilization, and ramp ground-damage incidents for each so we can compare station performance.",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Turn-time-by-station comparison (bag / gate / ramp) that wants a table.",
  },
  {
    id: "air-ground-4",
    query:
      "Tell me the exact minutes WE will cut off aircraft turn time and the precise baggage-mishandling-rate drop from the new ground orchestration platform.",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tempts a fabricated exact turn-time / baggage-mishandling number for this tenant.",
  },
  {
    id: "air-ground-5",
    query:
      "We have no reliable baseline for our turnaround milestone adherence or GSE availability — what is our current ground operations performance across stations?",
    industry: "airline",
    expectedExpertId: "xp.airline.ground-airport-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Asserts no milestone-adherence / GSE baseline; must require tenant evidence first.",
  },
];
