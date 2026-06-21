// Golden question batch 7 — cross-cutting industry-operations experts.
//
// Five cross-cutting Consilium experts (manufacturing operations, life-sciences
// R&D/commercial, telecom network operations, public-sector citizen services,
// ESG/sustainability), five questions each across five distinct angles:
// (1) metric, (2) AI use-case, (3) pain-theme / stuck-point,
// (4) vendor / system / sourcing, (5) diagnostic / maturity / ROI.
//
// Each question must route TOP-1 to its expected cross-cutting expert and the
// `mustInclude` token(s) must appear (case-insensitive) in the grounding block
// built by `summonExpertsForQuery`. No `industry` is set — these are
// cross-cutting experts that must win on keywords alone across all 67 packs.

import type { GoldenQuestion } from "./types";

export const BATCH_7_INDUSTRY_OPS: GoldenQuestion[] = [
  // ─── Manufacturing Operations & Smart Factory ──────────────────────────────
  {
    id: "x-manufacturing-metric",
    query:
      "Our plant OEE and first-pass yield are stuck and unplanned downtime keeps eating availability on the production line — where do peer smart factory operators land on OEE?",
    expectedExpertId: "xp.x.manufacturing-operations",
    mustInclude: ["oee"],
  },
  {
    id: "x-manufacturing-aiuc",
    query:
      "Where does AI predictive maintenance and asset reliability pay off on a manufacturing plant floor versus AI vision quality inspection of scrap and rework?",
    expectedExpertId: "xp.x.manufacturing-operations",
    mustInclude: ["maintenance"],
  },
  {
    id: "x-manufacturing-pain",
    query:
      "OT/IT data fragmentation across our MES, SCADA and historian is blocking smart factory analytics and hiding OEE loss on the plant floor — how do manufacturers break that?",
    expectedExpertId: "xp.x.manufacturing-operations",
    mustInclude: ["plant"],
  },
  {
    id: "x-manufacturing-vendor",
    query:
      "We run a mix of MES, SCADA, historian, CMMS and QMS systems on the manufacturing plant floor — how should a smart factory operator sequence OEE and predictive maintenance use cases across that estate?",
    expectedExpertId: "xp.x.manufacturing-operations",
    mustInclude: ["yield"],
  },
  {
    id: "x-manufacturing-diag",
    query:
      "How do we assess smart factory maturity and the ROI of an Industry 4.0 program when the value lever is OEE, scrap and quality on the production line rather than plant headcount?",
    expectedExpertId: "xp.x.manufacturing-operations",
    mustInclude: ["scrap"],
  },

  // ─── Life Sciences R&D & Commercial ────────────────────────────────────────
  {
    id: "x-lifesci-metric",
    query:
      "In our pharma R&D portfolio clinical trial cycle time and patient enrollment rate are slipping and screen-failure rate is high — what are planning-range benchmarks for trial timelines?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    mustInclude: ["trial"],
  },
  {
    id: "x-lifesci-aiuc",
    query:
      "Where does AI-assisted clinical trial design, risk-based central monitoring and pharmacovigilance case triage create value across pharma R&D and regulatory operations?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    mustInclude: ["clinical"],
  },
  {
    id: "x-lifesci-pain",
    query:
      "GxP data integrity and protocol amendment churn keep stalling AI adoption in our clinical development and pharmacovigilance operations — how do biotech R&D leaders get past it?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    mustInclude: ["pharmacovigilance"],
  },
  {
    id: "x-lifesci-vendor",
    query:
      "Our clinical trial and regulatory stack runs on Veeva Vault, EDC/CTMS and LIMS — how should a pharma R&D organization wire AI for submission authoring across those GxP systems?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    mustInclude: ["regulatory"],
  },
  {
    id: "x-lifesci-diag",
    query:
      "How do we assess R&D and commercial maturity and the ROI of AI across drug development when the prize is clinical trial cycle time, enrollment and regulatory submission quality?",
    expectedExpertId: "xp.x.life-sciences-rd-commercial",
    mustInclude: ["enrollment"],
  },

  // ─── Telecom Network & Customer Operations ─────────────────────────────────
  {
    id: "x-telecom-metric",
    query:
      "As a communications service provider our customer churn rate and ARPU are deteriorating while network availability and MTTR slip — what are peer network operations benchmarks?",
    expectedExpertId: "xp.x.telecom-network-operations",
    mustInclude: ["churn"],
  },
  {
    id: "x-telecom-aiuc",
    query:
      "Where does network-aware AI churn prediction and AI network assurance with fault localization beat care-only retention for a telecom network operator?",
    expectedExpertId: "xp.x.telecom-network-operations",
    mustInclude: ["network"],
  },
  {
    id: "x-telecom-pain",
    query:
      "Avoidable truck rolls and capex misallocation from capacity-led network overbuild are crushing margin at our telecom network operations — how do carriers fix that?",
    expectedExpertId: "xp.x.telecom-network-operations",
    mustInclude: ["truck-roll"],
  },
  {
    id: "x-telecom-vendor",
    query:
      "Across BSS/OSS for our 5G and fiber network, how should a communications service provider sequence AI capacity and capex planning against field-service and provisioning fallout?",
    expectedExpertId: "xp.x.telecom-network-operations",
    mustInclude: ["capex"],
  },
  {
    id: "x-telecom-diag",
    query:
      "How do we assess telecom network operations maturity and the ROI of AIOps when churn economics, ARPU and network availability are one connected system?",
    expectedExpertId: "xp.x.telecom-network-operations",
    mustInclude: ["arpu"],
  },

  // ─── Public Sector — Citizen Services & Government Operations ───────────────
  {
    id: "x-publicsector-metric",
    query:
      "Our government agency's citizen self-service adoption is low while case backlog and average case processing time keep climbing — what do peer public-sector benchmarks look like?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    mustInclude: ["citizen"],
  },
  {
    id: "x-publicsector-aiuc",
    query:
      "Where does a citizen virtual assistant for contact-center deflection plus intelligent document processing and eligibility triage create value in government citizen services?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    mustInclude: ["self-service"],
  },
  {
    id: "x-publicsector-pain",
    query:
      "Legacy systems of record and a structural case backlog are gating modernization of our agency's benefits eligibility and adjudication for citizen services — how do governments unstick that?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    mustInclude: ["backlog"],
  },
  {
    id: "x-publicsector-vendor",
    query:
      "Given public procurement and acquisition drag, how should a government agency source AI for permitting, licensing and citizen case management across legacy systems of record?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    mustInclude: ["case"],
  },
  {
    id: "x-publicsector-diag",
    query:
      "How do we assess citizen-services maturity and the ROI of AI in a government agency when the triple bottom line is service, cost and equity rather than profit, and case backlog is the constraint?",
    expectedExpertId: "xp.x.public-sector-citizen-services",
    mustInclude: ["adjudication"],
  },

  // ─── ESG & Sustainability ──────────────────────────────────────────────────
  {
    id: "x-esg-metric",
    query:
      "Our Scope 1, Scope 2 and Scope 3 emissions reporting in tCO2e and carbon intensity per revenue are hard to trust — what are credible planning ranges for decarbonization and emissions disclosure?",
    expectedExpertId: "xp.x.esg-sustainability",
    mustInclude: ["emissions"],
  },
  {
    id: "x-esg-aiuc",
    query:
      "Where does AI Scope-3 estimation with supplier-data enrichment and a decarbonization abatement-curve optimizer create value for our enterprise carbon and ESG program?",
    expectedExpertId: "xp.x.esg-sustainability",
    mustInclude: ["scope"],
  },
  {
    id: "x-esg-pain",
    query:
      "Our Scope 3 footprint is built on estimates and ESG data is scattered and not assurance-ready ahead of CSRD — how do sustainability leaders close that decarbonization and emissions gap?",
    expectedExpertId: "xp.x.esg-sustainability",
    mustInclude: ["csrd"],
  },
  {
    id: "x-esg-vendor",
    query:
      "For CSRD/ESRS and GHG Protocol carbon accounting and ESG disclosure, how should we source AI for Scope-3 emissions estimation and assurance-ready data lineage across the value chain?",
    expectedExpertId: "xp.x.esg-sustainability",
    mustInclude: ["carbon"],
  },
  {
    id: "x-esg-diag",
    query:
      "How do we assess ESG and decarbonization maturity and the ROI of a net-zero / SBTi roadmap when Scope 3 emissions and CSRD assurance-readiness are the binding constraints?",
    expectedExpertId: "xp.x.esg-sustainability",
    mustInclude: ["decarbonization"],
  },
];
