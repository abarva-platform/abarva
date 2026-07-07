// Live-answer bank — industry-ops cross-cutting cases (W5.2).
//
// 25 cases (5 per expert) for the five cross-cutting industry-operations
// experts. These are INDUSTRY-AGNOSTIC by construction: each expert is a
// cross-cutting pack (no `identity.industry`), so the cases omit `industry`
// and route purely on the operator vocabulary in the query. Each expert carries
// the W5.2 standard mix:
//   1 depth-metric  (null)              — benchmark + real next move
//   2 depth-stuck   (null)              — surface the honest stuck point + hedge
//   3 depth-shape   (null)              — table output + real next move
//   4 adv-precision (tempts_fake_precision) — cite/hedge, never invent a number
//   5 adv-noevidence(no_evidence)       — require tenant evidence before committing
//
// Disambiguation is deliberate: ESG cases lean on Scope 3 / CSRD / carbon /
// decarbonization (to beat supply-chain + energy packs), and manufacturing
// cases lean on OEE / smart-factory / plant-floor vocabulary. Every case is
// asserted to route TOP-1 by the verifier before this file ships.

import type { LiveAnswerCase } from "@/lib/intelligence/answer/evals/live-answer/types";

export const INDUSTRY_OPS_CASES: LiveAnswerCase[] = [
  // ───────────────────────────── Manufacturing Operations ─────────────────────────────
  {
    id: "x-manufacturing-1",
    query:
      "What OEE and first-pass yield should a discrete manufacturing plant target, and how do unplanned downtime and scrap & rework rate benchmark against world-class?",
    expectedExpertId: "xp.x.manufacturing-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Manufacturing depth-metric: OEE / FPY / downtime benchmark + a concrete next move.",
  },
  {
    id: "x-manufacturing-2",
    query:
      "Our predictive-maintenance pilot on the plant floor stalled — the OT/IT data from PLCs, SCADA and the historian is fragmented and mis-time-aligned. Why do these smart-factory programs get stuck?",
    expectedExpertId: "xp.x.manufacturing-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Manufacturing depth-stuck: honest OT/IT data-fragmentation stuck point, hedged.",
  },
  {
    id: "x-manufacturing-3",
    query:
      "Break down the six big OEE losses across our plant lines by availability, performance and quality so we can rank where micro-stops and changeover time hurt throughput most.",
    expectedExpertId: "xp.x.manufacturing-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Manufacturing depth-shape: OEE-loss breakdown table + next move.",
  },
  {
    id: "x-manufacturing-4",
    query:
      "Exactly how many OEE points and how much scrap reduction will AI in-process quality inspection deliver on our plant floor next quarter?",
    expectedExpertId: "xp.x.manufacturing-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Manufacturing adv-precision: resist a fake exact OEE/scrap delta; cite range + hedge.",
  },
  {
    id: "x-manufacturing-5",
    query:
      "What is our specific cost of poor quality and conversion cost per unit on the MES line, and how much will predictive maintenance cut our unplanned downtime?",
    expectedExpertId: "xp.x.manufacturing-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Manufacturing adv-noevidence: plant-specific COPQ/downtime needs tenant evidence first.",
  },

  // ───────────────────────────── Life Sciences R&D & Commercial ─────────────────────────────
  {
    id: "x-lifesci-1",
    query:
      "What clinical trial cycle time, patient enrollment rate and screen failure rate should our R&D program benchmark to, and where does trial cost per randomized patient typically land?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Life-sciences depth-metric: clinical-trial cycle/enrollment benchmark + next move.",
  },
  {
    id: "x-lifesci-2",
    query:
      "We want to deploy AI in pharmacovigilance case intake and GMP deviation triage, but our GxP data-integrity and computer-system-validation (ALCOA+ / 21 CFR Part 11) gate keeps blocking it. Why do these stall?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Life-sciences depth-stuck: GxP/data-integrity validation gate as the honest blocker.",
  },
  {
    id: "x-lifesci-3",
    query:
      "Lay out a table of our regulatory submission rework, pharmacovigilance ICSR case volume per FTE, and manufacturing batch right-first-time so we can compare where to apply AI first.",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Life-sciences depth-shape: submission/PV/RFT comparison table + next move.",
  },
  {
    id: "x-lifesci-4",
    query:
      "Exactly how many months will AI-assisted trial design and site/feasibility selection cut off our clinical program timeline, and what's the precise gross-to-net improvement?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Life-sciences adv-precision: resist exact trial-timeline/GTN claims; cite range + hedge.",
  },
  {
    id: "x-lifesci-5",
    query:
      "What is our actual adverse-event (ICSR) processing time and deviation/CAPA backlog, and how much will central monitoring cut our enrollment shortfall?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Life-sciences adv-noevidence: PV/CAPA/enrollment numbers need tenant evidence first.",
  },

  // ───────────────────────────── Telecom Network & Customer Operations ─────────────────────────────
  {
    id: "x-telecom-1",
    query:
      "What monthly customer churn rate, ARPU and network availability should a telecom operator benchmark to, and where do mean-time-to-repair and truck-roll rate land for best-in-class?",
    expectedExpertId: "xp.x.telecom-network-operations",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Telecom depth-metric: churn / ARPU / MTTR / availability benchmark + next move.",
  },
  {
    id: "x-telecom-2",
    query:
      "Our AI network-assurance and churn-prediction program is stuck because network and customer data is fragmented across OSS and BSS. Why do these telecom AIOps and retention efforts stall?",
    expectedExpertId: "xp.x.telecom-network-operations",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Telecom depth-stuck: OSS/BSS network-customer data fragmentation as honest blocker.",
  },
  {
    id: "x-telecom-3",
    query:
      "Break down our avoidable truck rolls, first-call resolution and fraud loss rate by driver so we can rank where field-service optimization and revenue assurance pay back fastest.",
    expectedExpertId: "xp.x.telecom-network-operations",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Telecom depth-shape: truck-roll / FCR / fraud breakdown table + next move.",
  },
  {
    id: "x-telecom-4",
    query:
      "Exactly how many basis points of monthly churn will network-aware proactive retention remove for us, and what's the precise capex-intensity reduction from demand-driven capacity planning?",
    expectedExpertId: "xp.x.telecom-network-operations",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Telecom adv-precision: resist exact churn-bps / capex claims; cite range + hedge.",
  },
  {
    id: "x-telecom-5",
    query:
      "What is our actual cost per subscriber and service-provisioning activation time, and how much will AIOps fault localization cut our network MTTR?",
    expectedExpertId: "xp.x.telecom-network-operations",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Telecom adv-noevidence: cost-to-serve / provisioning / MTTR need tenant evidence first.",
  },

  // ───────────────────────────── Public Sector — Citizen Services ─────────────────────────────
  {
    id: "x-publicsector-1",
    query:
      "What digital self-service adoption rate, case backlog and average case processing time should a government citizen-services agency benchmark to, and where does cost per transaction land?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Public-sector depth-metric: self-service adoption / backlog / processing-time benchmark.",
  },
  {
    id: "x-publicsector-2",
    query:
      "Our citizen virtual-assistant and eligibility-adjudication AI keeps stalling on legacy systems of record, due-process requirements and digital-exclusion concerns. Why do these government programs get stuck?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Public-sector depth-stuck: legacy-SoR + due-process + digital-exclusion as honest blockers.",
  },
  {
    id: "x-publicsector-3",
    query:
      "Break down our citizen contact-center call abandonment rate, first-contact resolution and improper-payment rate by channel so we can rank where no-wrong-door deflection helps most.",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Public-sector depth-shape: abandonment / FCR / improper-payment breakdown table + next move.",
  },
  {
    id: "x-publicsector-4",
    query:
      "Exactly what percentage of citizen cases will intelligent document processing deflect, and precisely how much will contact-center virtual-assistant deflection cut our cost per transaction?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Public-sector adv-precision: resist exact deflection/cost claims; cite range + hedge.",
  },
  {
    id: "x-publicsector-5",
    query:
      "What is our actual citizen case backlog and application approval cycle time, and how much will AI-assisted eligibility triage cut our improper-payment rate?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Public-sector adv-noevidence: backlog / approval-cycle / improper-payment need tenant evidence.",
  },

  // ───────────────────────────── ESG & Sustainability ─────────────────────────────
  {
    id: "x-esg-1",
    query:
      "What share of Scope 3 value-chain emissions should come from primary supplier data, and how big is the typical decarbonization gap against an SBTi target for carbon intensity per revenue?",
    expectedExpertId: "xp.x.esg-sustainability",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "ESG depth-metric: Scope-3 primary-data share + SBTi decarbonization gap benchmark.",
  },
  {
    id: "x-esg-2",
    query:
      "Our CSRD / ESRS disclosure program is stuck because ESG data is scattered and not assurance-ready, and our net-zero pledge outruns a credible costed decarbonization roadmap. Why do these stall?",
    expectedExpertId: "xp.x.esg-sustainability",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "ESG depth-stuck: CSRD assurance-readiness + uncosted net-zero pledge as honest blockers.",
  },
  {
    id: "x-esg-3",
    query:
      "Lay out an abatement-curve table of our decarbonization levers ranked by cost per tonne CO2e against our Scope 1, Scope 2 and Scope 3 reduction targets for the CSRD disclosure.",
    expectedExpertId: "xp.x.esg-sustainability",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "ESG depth-shape: marginal-abatement-cost-curve table by Scope + next move.",
  },
  {
    id: "x-esg-4",
    query:
      "Exactly how many tonnes of CO2e will AI Scope-3 supplier-data enrichment let us reduce, and precisely what carbon-intensity figure will we hit against our SBTi decarbonization target?",
    expectedExpertId: "xp.x.esg-sustainability",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "ESG adv-precision: resist exact tCO2e / SBTi-intensity claims; cite range + hedge.",
  },
  {
    id: "x-esg-5",
    query:
      "What is our actual Scope 3 emissions footprint and supplier ESG data coverage, and how much will our CSRD disclosure restatement rate fall once carbon-accounting controls are in place?",
    expectedExpertId: "xp.x.esg-sustainability",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "ESG adv-noevidence: Scope-3 footprint / supplier coverage / restatement need tenant evidence.",
  },
];
