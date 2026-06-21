// Golden question batch 8 (industry) — newly-staged NEW-INDUSTRY experts.
//
// EXACTLY 5 questions for each of the 4 staged industry-function experts (20
// total), covering 5 distinct angles each: (1) headline operating metric,
// (2) AI use-case, (3) pain / stuck-point, (4) vendor/system-of-record/sourcing,
// (5) diagnostic/maturity/ROI.
//
// Every question is verified to (a) route TOP-1 to its expectedExpertId across
// all 75 registered experts and (b) surface each `mustInclude` token in the
// grounding block. These are all industry experts, so `industry` is SET on every
// question to its canonical industry token — the hint fences the routing decision
// to the matching vertical (chemicals must beat discrete manufacturing-operations;
// aerospace_defense must beat procurement/manufacturing; agriculture must beat
// supply-chain/logistics/consumer-products; real_estate REIT owner/investor must
// beat the corporate-occupier real-estate-workplace expert).

import type { GoldenQuestion } from "./types";

export const BATCH_8_STAGED_INDUSTRY: GoldenQuestion[] = [
  // ── xp.chemicals.process-operations (chemicals) ────────────────────────────
  {
    id: "chem-metric",
    query:
      "What overall asset effectiveness (process OEE), on-stream factor, and feedstock yield benchmarks should our continuous chemical process units hold across the reactor and separation train?",
    industry: "chemicals",
    expectedExpertId: "xp.chemicals.process-operations",
    mustInclude: ["oae"],
  },
  {
    id: "chem-aiuc",
    query:
      "How can advanced process control and APC optimization push our reactors closer to the optimal operating window to lift feedstock yield and selectivity in our continuous chemical process plant?",
    industry: "chemicals",
    expectedExpertId: "xp.chemicals.process-operations",
    mustInclude: ["feedstock"],
  },
  {
    id: "chem-pain",
    query:
      "Unplanned trips and mechanical-integrity failures keep cutting on-stream time on our continuous process units — how do we reduce unplanned downtime and protect reliability across the reactor train?",
    industry: "chemicals",
    expectedExpertId: "xp.chemicals.process-operations",
    mustInclude: ["downtime"],
  },
  {
    id: "chem-vendor",
    query:
      "How should we stand up a reconciled process-data foundation across our DCS, historian, and LIMS so APC and predictive integrity have a trustworthy substrate in our continuous chemical process plant?",
    industry: "chemicals",
    expectedExpertId: "xp.chemicals.process-operations",
    mustInclude: ["feedstock"],
  },
  {
    id: "chem-diag",
    query:
      "Diagnose the maturity of our chemical process operations — is our feedstock yield, on-stream reliability, and energy intensity defensible, and where is the ROI from APC and predictive integrity?",
    industry: "chemicals",
    expectedExpertId: "xp.chemicals.process-operations",
    mustInclude: ["yield"],
  },

  // ── xp.aerospace-defense.program-supply-operations (aerospace_defense) ──────
  {
    id: "aero-metric",
    query:
      "What program EVM benchmarks — cost performance index CPI and schedule performance index SPI — should our defense programs hold, and how do we read estimate-at-completion honestly?",
    industry: "aerospace_defense",
    expectedExpertId: "xp.aerospace-defense.program-supply-operations",
    mustInclude: ["schedule"],
  },
  {
    id: "aero-aiuc",
    query:
      "How can AI give us EVM early-warning and supply-chain risk intelligence across our sole-source defense program suppliers before cost and schedule overruns surface?",
    industry: "aerospace_defense",
    expectedExpertId: "xp.aerospace-defense.program-supply-operations",
    mustInclude: ["sole-source"],
  },
  {
    id: "aero-pain",
    query:
      "Our defense program cost and schedule keep overrunning while sole-source suppliers slip long-lead deliveries — how do we get ahead of EVM signals that lag and supplier risk we cannot see?",
    industry: "aerospace_defense",
    expectedExpertId: "xp.aerospace-defense.program-supply-operations",
    mustInclude: ["sole-source"],
  },
  {
    id: "aero-vendor",
    query:
      "How should we manage our sole-source defense supply base and MRO sustainment depots under ITAR and CMMC export-control constraints while protecting program schedule?",
    industry: "aerospace_defense",
    expectedExpertId: "xp.aerospace-defense.program-supply-operations",
    mustInclude: ["mro"],
  },
  {
    id: "aero-diag",
    query:
      "Diagnose the maturity of our aerospace and defense program management and sustainment — is our EVM CPI-SPI honest, our sole-source supply risk managed, and where is the readiness and MRO ROI?",
    industry: "aerospace_defense",
    expectedExpertId: "xp.aerospace-defense.program-supply-operations",
    mustInclude: ["program"],
  },

  // ── xp.agriculture.agribusiness-operations (agriculture) ───────────────────
  {
    id: "agri-metric",
    query:
      "What yield per acre, cost of production per bushel, and basis capture benchmarks should our crop production and grain origination operation hold this season?",
    industry: "agriculture",
    expectedExpertId: "xp.agriculture.agribusiness-operations",
    mustInclude: ["acre"],
  },
  {
    id: "agri-aiuc",
    query:
      "How can precision-ag and agronomy prediction lift yield per acre with variable-rate input prescriptions while we manage commodity basis and hedge risk on our grain?",
    industry: "agriculture",
    expectedExpertId: "xp.agriculture.agribusiness-operations",
    mustInclude: ["agronomy"],
  },
  {
    id: "agri-pain",
    query:
      "Grain shrink and spoilage plus a weak basis are eating our thin margins, and our precision-ag yield data is fragmented across OEMs — how do we close the cost of production per acre gap?",
    industry: "agriculture",
    expectedExpertId: "xp.agriculture.agribusiness-operations",
    mustInclude: ["grain"],
  },
  {
    id: "agri-vendor",
    query:
      "How should we choose farm-management, agronomy, and grain merchandising systems to run precision-ag prescriptions and basis-risk management across our origination footprint?",
    industry: "agriculture",
    expectedExpertId: "xp.agriculture.agribusiness-operations",
    mustInclude: ["basis"],
  },
  {
    id: "agri-diag",
    query:
      "Diagnose the maturity of our agribusiness operation — is our yield per acre, cost of production, and basis capture defensible, and where is the real precision-ag and agronomy ROI?",
    industry: "agriculture",
    expectedExpertId: "xp.agriculture.agribusiness-operations",
    mustInclude: ["yield"],
  },

  // ── xp.real-estate.asset-portfolio-operations (real_estate) ────────────────
  {
    id: "reit-metric",
    query:
      "What net operating income NOI growth, occupancy, leasing velocity, and same-store NOI margin benchmarks should our REIT property portfolio hold against the market cap rate?",
    industry: "real_estate",
    expectedExpertId: "xp.real-estate.asset-portfolio-operations",
    mustInclude: ["noi"],
  },
  {
    id: "reit-aiuc",
    query:
      "How can AI-assisted underwriting and cap-rate sensitivity plus lease abstraction and rent-roll intelligence sharpen NOI optimization across our REIT investment portfolio?",
    industry: "real_estate",
    expectedExpertId: "xp.real-estate.asset-portfolio-operations",
    mustInclude: ["rent roll"],
  },
  {
    id: "reit-pain",
    query:
      "A cap-rate shift is swamping our NOI gains while leasing velocity stalls and office occupancy decays post-hybrid — how do we protect portfolio value and same-store NOI as the landlord?",
    industry: "real_estate",
    expectedExpertId: "xp.real-estate.asset-portfolio-operations",
    mustInclude: ["occupancy"],
  },
  {
    id: "reit-vendor",
    query:
      "How should we choose property-management, lease, and investment systems to run NOI optimization, leasing, and rent-roll intelligence across our REIT owner-operator portfolio?",
    industry: "real_estate",
    expectedExpertId: "xp.real-estate.asset-portfolio-operations",
    mustInclude: ["leasing"],
  },
  {
    id: "reit-diag",
    query:
      "Diagnose the maturity of our REIT asset and portfolio operations — is our NOI growth, occupancy, and leasing velocity defensible against the cap rate, and where is the value-creation ROI?",
    industry: "real_estate",
    expectedExpertId: "xp.real-estate.asset-portfolio-operations",
    mustInclude: ["cap rate"],
  },
];
