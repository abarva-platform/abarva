import type { LiveAnswerCase } from "../types";

// Live-answer cases — Finance & Risk cross-cutting faculty (W5.2).
//
// 11 cross-cutting experts × 5 cases = 55. Every case is industry-agnostic
// (no `industry` field) so it routes purely on the question's operator
// vocabulary. Each expert carries the canonical 5-case shape:
//   1. depth-metric    (null)            cite_benchmark + name_real_next_move
//   2. depth-stuck     (null)            surface_stuck_point + hedge_uncertainty
//   3. depth-shape     (null)            output_shape_table + name_real_next_move
//   4. adv-precision   (tempts_fake...)  cite_benchmark + hedge_uncertainty
//   5. adv-noevidence  (no_evidence)     require_evidence + name_real_next_move
//
// Queries are written with each expert's distinctive operator terms so the
// dimensional router (keyword overlap, no industry) leads with the intended
// expert top-1. Disambiguation is deliberate: treasury (cash/liquidity/TMS)
// vs FP&A (close/forecast/EPM) vs corporate tax (provision/ASC 740/Pillar Two);
// enterprise risk (SOX/internal audit/controls) vs legal (CLM/contract/redline).

export const FINANCE_RISK_CASES: LiveAnswerCase[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Treasury Transformation — xp.x.treasury-transformation
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-treasury-1-metric",
    query:
      "What cash-positioning visibility and days-cash-on-hand should a treasury function target once it centralizes liquidity through an in-house bank and cash pooling?",
    expectedExpertId: "xp.x.treasury-transformation",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Treasury depth-metric: benchmark cash-forecast accuracy / days cash on hand + a concrete next move.",
  },
  {
    id: "x-treasury-2-stuck",
    query:
      "Our treasury still runs on spreadsheets with fragmented bank-balance visibility — where do treasury transformation programs usually get stuck before a TMS rollout sticks?",
    expectedExpertId: "xp.x.treasury-transformation",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Treasury depth-stuck: name the honest stuck-point (cash-visibility / TMS change drag) and hedge.",
  },
  {
    id: "x-treasury-3-shape",
    query:
      "Break down the treasury liquidity and payments-hub metrics — cash visibility, straight-through-processing rate, payment fraud loss, bank-fee leakage — into a target-vs-current table.",
    expectedExpertId: "xp.x.treasury-transformation",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Treasury depth-shape: a payments/liquidity metric table plus a real next move.",
  },
  {
    id: "x-treasury-4-precision",
    query:
      "Exactly how many basis points of idle-cash yield and bank-fee leakage will a centralized payments hub and in-house bank recover for us this year?",
    expectedExpertId: "xp.x.treasury-transformation",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Treasury adv-precision: tempts an exact yield/fee number — must cite a planning range and hedge.",
  },
  {
    id: "x-treasury-5-noevidence",
    query:
      "How much trapped cash is sitting in our non-yielding accounts and what is our current FX hedge coverage right now?",
    expectedExpertId: "xp.x.treasury-transformation",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Treasury adv-noevidence: tenant-specific trapped-cash / hedge-coverage facts need evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Finance — FP&A & Controllership — xp.x.finance-fpa-controllership
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-finance-1-metric",
    query:
      "What days-to-close and forecast-accuracy MAPE should FP&A and controllership target with a driver-based planning model and a continuous close?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "FP&A depth-metric: benchmark days-to-close / forecast MAPE + a concrete next move.",
  },
  {
    id: "x-finance-2-stuck",
    query:
      "Our planning is spreadsheet-bound with no single source of financial truth and finance-disowned value claims — where do FP&A modernization efforts usually stall?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "FP&A depth-stuck: surface the version-fragile planning / value-attestation stuck-point and hedge.",
  },
  {
    id: "x-finance-3-shape",
    query:
      "Lay out a table of FP&A and controllership metrics — days to close, manual journal-entry rate, variance explained %, EPM adoption — with target vs current.",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "FP&A depth-shape: record-to-report metric table plus a real next move.",
  },
  {
    id: "x-finance-4-precision",
    query:
      "What exact forecast-accuracy percentage and close-cycle reduction will an EPM planning platform and autonomous reconciliation deliver for our controllership team?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "FP&A adv-precision: tempts an exact forecast-accuracy / close number — cite a range and hedge.",
  },
  {
    id: "x-finance-5-noevidence",
    query:
      "What is our current consolidated close cycle time and manual journal-entry rate in the record-to-report process today?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "FP&A adv-noevidence: tenant close-cycle / manual-journal facts need finance evidence before committing.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Corporate Tax — xp.x.corporate-tax
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-tax-1-metric",
    query:
      "What tax-provision close cycle time and transfer-pricing documentation coverage should a corporate tax function target under ASC 740 and BEPS Pillar Two?",
    expectedExpertId: "xp.x.corporate-tax",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Tax depth-metric: benchmark provision close / transfer-pricing coverage + a concrete next move.",
  },
  {
    id: "x-tax-2-stuck",
    query:
      "Our tax provision still lives in spreadsheets and we have a Pillar Two GloBE data gap — where do corporate tax transformation programs usually get stuck?",
    expectedExpertId: "xp.x.corporate-tax",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Tax depth-stuck: surface the tax-data-at-source / Pillar Two modeling stuck-point and hedge.",
  },
  {
    id: "x-tax-3-shape",
    query:
      "Break down corporate tax metrics into a table — effective tax rate, provision close cycle time, indirect-tax determination accuracy, transfer-pricing coverage — target vs current.",
    expectedExpertId: "xp.x.corporate-tax",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Tax depth-shape: an ETR / provision / indirect-tax metric table plus a real next move.",
  },
  {
    id: "x-tax-4-precision",
    query:
      "Exactly how many points will AI-accelerated ASC 740 provision automation and Pillar Two GloBE modeling cut from our effective tax rate?",
    expectedExpertId: "xp.x.corporate-tax",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Tax adv-precision: tempts an exact ETR delta — must cite a range and hedge, not promise points.",
  },
  {
    id: "x-tax-5-noevidence",
    query:
      "What is our current transfer-pricing documentation coverage and book-tax difference reconciliation exception rate this filing cycle?",
    expectedExpertId: "xp.x.corporate-tax",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Tax adv-noevidence: tenant transfer-pricing / reconciliation facts need tax evidence before committing.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Corporate Development / M&A — xp.x.corporate-development-ma
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-corpdev-1-metric",
    query:
      "What synergy realization and integration-milestone on-time delivery should a corporate development M&A team target across the post-merger integration portfolio?",
    expectedExpertId: "xp.x.corporate-development-ma",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "CorpDev depth-metric: benchmark synergy realization / PMI milestone delivery + a concrete next move.",
  },
  {
    id: "x-corpdev-2-stuck",
    query:
      "Our deal pipeline is thin and our synergies run systematically over-optimistic — where do M&A and post-merger integration programs usually leak value?",
    expectedExpertId: "xp.x.corporate-development-ma",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "CorpDev depth-stuck: surface the thesis-discipline / synergy-overstatement / PMI leakage stuck-point.",
  },
  {
    id: "x-corpdev-3-shape",
    query:
      "Break down M&A portfolio metrics into a table — deal win rate, diligence cycle time, synergy realization, deal IRR vs underwrite — target vs current.",
    expectedExpertId: "xp.x.corporate-development-ma",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "CorpDev depth-shape: a deal / diligence / synergy metric table plus a real next move.",
  },
  {
    id: "x-corpdev-4-precision",
    query:
      "Exactly what synergy capture and deal IRR will an integration management office and AI-assisted diligence deliver on our next acquisition?",
    expectedExpertId: "xp.x.corporate-development-ma",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "CorpDev adv-precision: tempts an exact synergy / IRR number — cite an underwrite range and hedge.",
  },
  {
    id: "x-corpdev-5-noevidence",
    query:
      "What is our current acquired-leadership retention and value-creation-plan attainment across the portfolio companies right now?",
    expectedExpertId: "xp.x.corporate-development-ma",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "CorpDev adv-noevidence: tenant retention / VCP-attainment facts need portfolio evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Enterprise Risk, Compliance & Internal Audit — xp.x.enterprise-risk-compliance-audit
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-risk-1-metric",
    query:
      "What control test pass rate and time-to-remediate internal-audit findings should an enterprise risk and SOX program target under a three-lines operating model?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Risk depth-metric: benchmark control-test pass rate / finding remediation time + a concrete next move.",
  },
  {
    id: "x-risk-2-stuck",
    query:
      "Our internal-audit findings lag the live state and repeat, and our controls are designed on paper but not operating — where do GRC and continuous-controls-monitoring programs get stuck?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Risk depth-stuck: surface the design-vs-operating / repeat-finding / siloed-GRC stuck-point and hedge.",
  },
  {
    id: "x-risk-3-shape",
    query:
      "Break down our internal-audit and controls metrics into a table — open audit findings, control test pass rate, KRI coverage, repeat-finding rate — target vs current.",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Risk depth-shape: an internal-audit / control-testing metric table plus a real next move.",
  },
  {
    id: "x-risk-4-precision",
    query:
      "Exactly how many audit findings and control-testing hours will continuous controls monitoring and AI workpaper drafting eliminate for our internal audit team?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Risk adv-precision: tempts an exact findings / hours number — cite a range and hedge.",
  },
  {
    id: "x-risk-5-noevidence",
    query:
      "What is our current repeat-finding rate and percentage of internal-audit findings remediated on time this year?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Risk adv-noevidence: tenant repeat-finding / remediation facts need audit evidence before committing.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Legal / Contract AI & Legal Operations — xp.x.legal-contract-ai
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-legal-1-metric",
    query:
      "What contract cycle time and outside-counsel spend ratio should a legal operations team target after standing up CLM with AI redlining and a clause playbook?",
    expectedExpertId: "xp.x.legal-contract-ai",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Legal depth-metric: benchmark contract cycle time / outside-counsel spend + a concrete next move.",
  },
  {
    id: "x-legal-2-stuck",
    query:
      "Legal is the contract bottleneck with rogue off-CLM contracts and a dark estate, plus lawyer adoption resistance — where do contract-AI and legal-ops programs stall?",
    expectedExpertId: "xp.x.legal-contract-ai",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Legal depth-stuck: surface the off-CLM dark-estate / lawyer-adoption / privilege stuck-point and hedge.",
  },
  {
    id: "x-legal-3-shape",
    query:
      "Break down legal-ops contract metrics into a table — contract cycle time, NDA turnaround, % contracts under CLM, clause playbook deviation rate — target vs current.",
    expectedExpertId: "xp.x.legal-contract-ai",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Legal depth-shape: a contract-lifecycle / redline metric table plus a real next move.",
  },
  {
    id: "x-legal-4-precision",
    query:
      "Exactly how many days will AI contract review and self-serve GenAI contract generation cut from our request-to-signature cycle, and how much outside-counsel spend will it save?",
    expectedExpertId: "xp.x.legal-contract-ai",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Legal adv-precision: tempts an exact cycle-time / spend number — cite a range and hedge.",
  },
  {
    id: "x-legal-5-noevidence",
    query:
      "What share of our contracts is currently off-CLM in the dark estate, and what is our present clause-playbook deviation rate?",
    expectedExpertId: "xp.x.legal-contract-ai",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Legal adv-noevidence: tenant off-CLM / playbook-deviation facts need contract-estate evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Human Capital & People Strategy — xp.x.human-capital-hr
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-hr-1-metric",
    query:
      "What regrettable attrition rate and internal-mobility fill rate should a human-capital function target once it builds a skills architecture and succession cadence?",
    expectedExpertId: "xp.x.human-capital-hr",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "HR depth-metric: benchmark regrettable attrition / internal-fill rate + a concrete next move.",
  },
  {
    id: "x-hr-2-stuck",
    query:
      "We are flying blind on regrettable attrition, succession exists on paper only, and managers are the unfixed gate — where do human-capital and talent programs usually stall?",
    expectedExpertId: "xp.x.human-capital-hr",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "HR depth-stuck: surface the manager-capability / paper-succession / engagement-theater stuck-point.",
  },
  {
    id: "x-hr-3-shape",
    query:
      "Break down human-capital talent metrics into a table — voluntary attrition, time to fill, quality of hire, succession coverage, compa-ratio — target vs current.",
    expectedExpertId: "xp.x.human-capital-hr",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "HR depth-shape: an attrition / hiring / succession metric table plus a real next move.",
  },
  {
    id: "x-hr-4-precision",
    query:
      "Exactly how many points of regrettable attrition will a flight-risk prediction model and a manager-coaching assistant remove from our workforce this year?",
    expectedExpertId: "xp.x.human-capital-hr",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "HR adv-precision: tempts an exact attrition delta — cite a range and hedge, not promise points.",
  },
  {
    id: "x-hr-5-noevidence",
    query:
      "What is our current regrettable attrition rate among high-potential talent and our succession coverage for critical roles right now?",
    expectedExpertId: "xp.x.human-capital-hr",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "HR adv-noevidence: tenant attrition / succession-coverage facts need people-data evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Procurement & Strategic Sourcing — xp.x.procurement-strategic-sourcing
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-procurement-1-metric",
    query:
      "What spend-under-management percentage and savings-realization rate should a procurement and strategic-sourcing function target with a classified spend cube and category management?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Procurement depth-metric: benchmark spend-under-management / savings realization + a concrete next move.",
  },
  {
    id: "x-procurement-2-stuck",
    query:
      "Our negotiated savings leak before they land in the P&L and we have maverick and tail-spend erosion on dirty spend data — where does strategic sourcing usually get stuck?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Procurement depth-stuck: surface the savings-leakage / maverick-spend / dirty-data stuck-point and hedge.",
  },
  {
    id: "x-procurement-3-shape",
    query:
      "Break down procurement sourcing metrics into a table — spend under management, addressable spend sourced, negotiated savings, maverick spend, sourcing cycle time — target vs current.",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Procurement depth-shape: a sourcing / savings-leakage metric table plus a real next move.",
  },
  {
    id: "x-procurement-4-precision",
    query:
      "Exactly what negotiated-savings percentage and savings-leakage reduction will AI spend classification and agentic sourcing events deliver across our addressable spend?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Procurement adv-precision: tempts an exact savings number — cite a range and hedge.",
  },
  {
    id: "x-procurement-5-noevidence",
    query:
      "What is our current spend under management and maverick off-contract spend percentage across categories today?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Procurement adv-noevidence: tenant spend-under-management / maverick-spend facts need spend evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Supply Chain Transformation — xp.x.supply-chain-transformation
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-scm-1-metric",
    query:
      "What on-time-in-full rate and inventory turns should a supply-chain function target with multi-echelon inventory optimization and a connected S&OP planning platform?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "SCM depth-metric: benchmark OTIF / inventory turns + a concrete next move.",
  },
  {
    id: "x-scm-2-stuck",
    query:
      "We have persistent forecast bias, a bullwhip demand-signal amplification problem, and inventory imbalance with stockouts and excess together — where does S&OP transformation stall?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "SCM depth-stuck: surface the forecast-bias / bullwhip / siloed-S&OP stuck-point and hedge.",
  },
  {
    id: "x-scm-3-shape",
    query:
      "Break down supply-chain planning metrics into a table — OTIF, inventory turns, days of inventory on hand, stockout rate, excess and obsolete inventory — target vs current.",
    expectedExpertId: "xp.x.supply-chain-transformation",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "SCM depth-shape: an inventory / OTIF / fill-rate metric table plus a real next move.",
  },
  {
    id: "x-scm-4-precision",
    query:
      "Exactly how many inventory turns and OTIF points will ML demand sensing and multi-echelon inventory optimization add for our supply chain this year?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "SCM adv-precision: tempts exact turns / OTIF numbers — cite a range and hedge.",
  },
  {
    id: "x-scm-5-noevidence",
    query:
      "What is our current OTIF rate and excess-and-obsolete inventory percentage across the network right now?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "SCM adv-noevidence: tenant OTIF / E&O-inventory facts need supply-chain evidence before committing.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Enterprise Value Office & AI Enablement — xp.x.value-office-ai-enablement
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-valueoffice-1-metric",
    query:
      "What value-attestation coverage and shared-asset reuse rate should an enterprise value office target running an idea-to-value funnel with decision gates?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "ValueOffice depth-metric: benchmark Finance-attested value coverage / asset reuse + a concrete next move.",
  },
  {
    id: "x-valueoffice-2-stuck",
    query:
      "Our value office acts like a demo factory with blanket-percentage value claims, rebuild-every-time and no bridge from claim to Finance — where do AI-enablement programs stall?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "ValueOffice depth-stuck: surface the demo-factory / no-reuse / claim-to-Finance stuck-point and hedge.",
  },
  {
    id: "x-valueoffice-3-shape",
    query:
      "Break down enterprise value-office metrics into a table — idea-to-go decision time, value realized and Finance-attested, shared-asset reuse rate, adoption rate of shipped solutions — target vs current.",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "ValueOffice depth-shape: an idea-to-value funnel / attestation metric table plus a real next move.",
  },
  {
    id: "x-valueoffice-4-precision",
    query:
      "Exactly what portfolio throughput and Finance-attested value will a value control tower and reusable enterprise context layer deliver per quarter for our AI initiatives?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "ValueOffice adv-precision: tempts exact throughput / attested-value numbers — cite a range and hedge.",
  },
  {
    id: "x-valueoffice-5-noevidence",
    query:
      "What share of our AI initiatives currently have a baselined value case and a change-and-adoption plan attached right now?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "ValueOffice adv-noevidence: tenant baselined-value / adoption-plan facts need portfolio evidence first.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Insurance Underwriting, Claims & Policy Operations — xp.x.insurance-underwriting-claims
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "x-insurance-1-metric",
    query:
      "What loss ratio and claims-leakage percentage should an insurance underwriting and claims operation target with straight-through underwriting and FNOL triage automation?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Insurance depth-metric: benchmark loss ratio / claims leakage + a concrete next move.",
  },
  {
    id: "x-insurance-2-stuck",
    query:
      "We have claims leakage on indemnity, fat-tailed fraud under-detection, and a reserving lag with adverse development — where do underwriting and claims transformation programs stall?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Insurance depth-stuck: surface the claims-leakage / fraud-under-detection / reserving-lag stuck-point.",
  },
  {
    id: "x-insurance-3-shape",
    query:
      "Break down insurance underwriting and claims metrics into a table — loss ratio, combined ratio, claims leakage, claims cycle time FNOL to settlement, quote-to-bind ratio — target vs current.",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Insurance depth-shape: a loss-ratio / claims / underwriting metric table plus a real next move.",
  },
  {
    id: "x-insurance-4-precision",
    query:
      "Exactly how many loss-ratio points and claims-leakage dollars will a fraud-and-SIU detection model and claims-triage automation recover for our book this year?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Insurance adv-precision: tempts exact loss-ratio / leakage numbers — cite a range and hedge.",
  },
  {
    id: "x-insurance-5-noevidence",
    query:
      "What is our current claims leakage on indemnity and our straight-through underwriting rate across the portfolio right now?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Insurance adv-noevidence: tenant claims-leakage / STP-underwriting facts need book evidence before committing.",
  },
];
