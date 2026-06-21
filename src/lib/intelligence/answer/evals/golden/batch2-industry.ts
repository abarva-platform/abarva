// Golden question batch 2 — industry-function experts.
//
// EXACTLY 5 questions per expert (55 total) across 11 industry-function experts,
// each probing 5 distinct angles: (1) headline metric, (2) AI use-case,
// (3) pain/stuck-point, (4) vendor/system-of-record/sourcing, (5) diagnostic/
// maturity/ROI. Every question is pinned to the expert's canonical industry so
// the dimensional router (industry alignment bonus) summons it top-1, and every
// `mustInclude` token is verified present in that expert's grounding block.

import type { GoldenQuestion } from "./types";

export const BATCH_2_INDUSTRY: GoldenQuestion[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Retail Merchandising & Pricing (xp.retail.merchandising-pricing)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "rt-merch-metric",
    query:
      "What gross margin and markdown rate should our merchant organization be planning toward on seasonal assortment?",
    industry: "retail",
    expectedExpertId: "xp.retail.merchandising-pricing",
    mustInclude: ["markdown"],
  },
  {
    id: "rt-merch-aiuc",
    query:
      "Where can AI price and markdown optimization plus SKU/store demand forecasting move our merchandising margin?",
    industry: "retail",
    expectedExpertId: "xp.retail.merchandising-pricing",
    mustInclude: ["markdown"],
  },
  {
    id: "rt-merch-pain",
    query:
      "Our buyers keep taking too-deep markdowns and full-price sell-through is eroding — what is going wrong in pricing discipline?",
    industry: "retail",
    expectedExpertId: "xp.retail.merchandising-pricing",
    mustInclude: ["markdown"],
  },
  {
    id: "rt-merch-vendor",
    query:
      "How should we evaluate a price-optimization engine and demand-planning system of record for the assortment and markdown loop?",
    industry: "retail",
    expectedExpertId: "xp.retail.merchandising-pricing",
    mustInclude: ["markdown"],
  },
  {
    id: "rt-merch-diag",
    query:
      "How mature is our pricing-science capability and what ROI should we expect from disciplined markdown and assortment optimization?",
    industry: "retail",
    expectedExpertId: "xp.retail.merchandising-pricing",
    mustInclude: ["markdown"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Retail Store Operations (xp.retail.store-operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "rt-store-metric",
    query:
      "What sales-per-labor-hour and associate turnover should we plan toward to control store labor cost across the fleet?",
    industry: "retail",
    expectedExpertId: "xp.retail.store-operations",
    mustInclude: ["shrink"],
  },
  {
    id: "rt-store-aiuc",
    query:
      "Where can AI demand-based labor scheduling and shelf-vision task management lift in-store execution across our stores?",
    industry: "retail",
    expectedExpertId: "xp.retail.store-operations",
    mustInclude: ["shrink"],
  },
  {
    id: "rt-store-pain",
    query:
      "Our store managers override the labor schedule and execution variance between best and worst stores is killing us — what is the stuck-point?",
    industry: "retail",
    expectedExpertId: "xp.retail.store-operations",
    mustInclude: ["shrink"],
  },
  {
    id: "rt-store-vendor",
    query:
      "How should we choose a workforce-management and store task-execution platform for associate scheduling and loss-prevention?",
    industry: "retail",
    expectedExpertId: "xp.retail.store-operations",
    mustInclude: ["shrink"],
  },
  {
    id: "rt-store-diag",
    query:
      "How mature is our store-execution operating model and what is the ROI of cutting associate turnover and shrink at the store?",
    industry: "retail",
    expectedExpertId: "xp.retail.store-operations",
    mustInclude: ["shrink"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Retail Omnichannel Fulfillment (xp.retail.omnichannel-fulfillment)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "rt-omni-metric",
    query:
      "What fulfillment cost per order and inventory accuracy should we plan toward for our BOPIS and ship-from-store promise?",
    industry: "retail",
    expectedExpertId: "xp.retail.omnichannel-fulfillment",
    mustInclude: ["bopis"],
  },
  {
    id: "rt-omni-aiuc",
    query:
      "Where can AI distributed order routing and accuracy-derated available-to-promise improve our BOPIS and last-mile economics?",
    industry: "retail",
    expectedExpertId: "xp.retail.omnichannel-fulfillment",
    mustInclude: ["bopis"],
  },
  {
    id: "rt-omni-pain",
    query:
      "Phantom inventory keeps cancelling and splitting our BOPIS orders and ship-from-store is diluting margin — what is the binding constraint?",
    industry: "retail",
    expectedExpertId: "xp.retail.omnichannel-fulfillment",
    mustInclude: ["bopis"],
  },
  {
    id: "rt-omni-vendor",
    query:
      "How should we evaluate an OMS / distributed order management system of record for cross-channel BOPIS routing and fulfillment?",
    industry: "retail",
    expectedExpertId: "xp.retail.omnichannel-fulfillment",
    mustInclude: ["bopis"],
  },
  {
    id: "rt-omni-diag",
    query:
      "How mature is our omnichannel fulfillment cost-to-serve and what ROI comes from fixing inventory accuracy behind BOPIS?",
    industry: "retail",
    expectedExpertId: "xp.retail.omnichannel-fulfillment",
    mustInclude: ["bopis"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FS Fraud & Financial Crime (xp.financial-services-banking.fraud-financial-crime)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "fs-fraud-metric",
    query:
      "What net fraud loss in basis points and alert-to-SAR conversion should our AML and financial-crime program plan toward?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.fraud-financial-crime",
    mustInclude: ["aml"],
  },
  {
    id: "fs-fraud-aiuc",
    query:
      "Where can AI alert triage and SAR-narrative drafting reduce false positives in our AML transaction-monitoring and sanctions screening?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.fraud-financial-crime",
    mustInclude: ["aml"],
  },
  {
    id: "fs-fraud-pain",
    query:
      "Our financial-crime investigators are drowning in false-positive AML alerts and SAR backlog — what is the stuck-point in transaction monitoring?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.fraud-financial-crime",
    mustInclude: ["aml"],
  },
  {
    id: "fs-fraud-vendor",
    query:
      "How should we evaluate an AML transaction-monitoring and case-management system for sanctions screening and SAR filing?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.fraud-financial-crime",
    mustInclude: ["aml"],
  },
  {
    id: "fs-fraud-diag",
    query:
      "How mature is our AML financial-crime detection model risk governance and what ROI comes from cutting false positives and fraud loss?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.fraud-financial-crime",
    mustInclude: ["aml"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Banking & Payments Operations (xp.financial-services-banking.payments-operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "fs-payments-metric",
    query:
      "What payment straight-through-processing rate and cost-to-serve per account should our core-banking operations plan toward?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.payments-operations",
    mustInclude: ["payment"],
  },
  {
    id: "fs-payments-aiuc",
    query:
      "Where can AI payment exception repair and digital onboarding automation lift our ACH, wire, and RTP core-banking operations?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.payments-operations",
    mustInclude: ["payment"],
  },
  {
    id: "fs-payments-pain",
    query:
      "Our payment exception and repair queue keeps growing and onboarding completion is poor — what is the stuck-point in payments operations?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.payments-operations",
    mustInclude: ["payment"],
  },
  {
    id: "fs-payments-vendor",
    query:
      "How should we evaluate a core-banking platform and centralized payment hub for ACH, wire, RTP, and the ISO 20022 migration?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.payments-operations",
    mustInclude: ["payment"],
  },
  {
    id: "fs-payments-diag",
    query:
      "How mature is our payments straight-through-processing and account-servicing operating model and what ROI comes from channel migration?",
    industry: "financial_services_banking",
    expectedExpertId: "xp.financial-services-banking.payments-operations",
    mustInclude: ["payment"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Wealth & Asset Management (xp.financial-services.wealth-asset-management)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "fs-wealth-metric",
    query:
      "What AUM per advisor and net-new-asset organic growth should our wealth management business plan toward against fee compression?",
    industry: "financial_services",
    expectedExpertId: "xp.financial-services.wealth-asset-management",
    mustInclude: ["advisor"],
  },
  {
    id: "fs-wealth-aiuc",
    query:
      "Where can an advisor copilot with next-best-action and automated portfolio rebalancing lift our wealth-management AUM productivity?",
    industry: "financial_services",
    expectedExpertId: "xp.financial-services.wealth-asset-management",
    mustInclude: ["advisor"],
  },
  {
    id: "fs-wealth-pain",
    query:
      "Fee realization is compressing and advisor capacity is capped by fragmented portfolio data across custodians — what is the wealth stuck-point?",
    industry: "financial_services",
    expectedExpertId: "xp.financial-services.wealth-asset-management",
    mustInclude: ["advisor"],
  },
  {
    id: "fs-wealth-vendor",
    query:
      "How should we evaluate a portfolio-management and advisor CRM / custody system of record for the wealth and asset-management value chain?",
    industry: "financial_services",
    expectedExpertId: "xp.financial-services.wealth-asset-management",
    mustInclude: ["advisor"],
  },
  {
    id: "fs-wealth-diag",
    query:
      "How mature is our advisor productivity model and what ROI comes from a unified household data spine for portfolio personalization?",
    industry: "financial_services",
    expectedExpertId: "xp.financial-services.wealth-asset-management",
    mustInclude: ["advisor"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Energy Grid & Asset Operations (xp.energy.grid-asset-operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "en-grid-metric",
    query:
      "What SAIDI and SAIFI reliability targets should our transmission and distribution grid operations plan toward this year?",
    industry: "energy",
    expectedExpertId: "xp.energy.grid-asset-operations",
    mustInclude: ["saidi"],
  },
  {
    id: "en-grid-aiuc",
    query:
      "Where can predictive asset-health failure prediction and AI fault location improve grid reliability and restoration after outages?",
    industry: "energy",
    expectedExpertId: "xp.energy.grid-asset-operations",
    mustInclude: ["saidi"],
  },
  {
    id: "en-grid-pain",
    query:
      "Our outage restoration times and SAIDI keep slipping and aging assets are failing unpredictably — what is the grid stuck-point?",
    industry: "energy",
    expectedExpertId: "xp.energy.grid-asset-operations",
    mustInclude: ["saidi"],
  },
  {
    id: "en-grid-vendor",
    query:
      "How should we evaluate an ADMS / OMS / SCADA system of record for grid reliability, outage management, and asset health?",
    industry: "energy",
    expectedExpertId: "xp.energy.grid-asset-operations",
    mustInclude: ["saidi"],
  },
  {
    id: "en-grid-diag",
    query:
      "How mature is our predictive-maintenance and DER-integration capability and what ROI comes from improving SAIDI reliability?",
    industry: "energy",
    expectedExpertId: "xp.energy.grid-asset-operations",
    mustInclude: ["saidi"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Logistics & Transportation Operations (xp.logistics.operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "log-ops-metric",
    query:
      "What on-time-in-full and freight cost per mile should our transportation and fleet operations plan toward across modes?",
    industry: "logistics_transportation",
    expectedExpertId: "xp.logistics.operations",
    mustInclude: ["freight"],
  },
  {
    id: "log-ops-aiuc",
    query:
      "Where can predictive-ETA visibility and route optimization with deadhead matching cut our freight and fleet cost-to-serve?",
    industry: "logistics_transportation",
    expectedExpertId: "xp.logistics.operations",
    mustInclude: ["freight"],
  },
  {
    id: "log-ops-pain",
    query:
      "Empty miles and deadhead are eating our freight margin and OTIF keeps missing — what is the stuck-point in our transportation network?",
    industry: "logistics_transportation",
    expectedExpertId: "xp.logistics.operations",
    mustInclude: ["freight"],
  },
  {
    id: "log-ops-vendor",
    query:
      "How should we evaluate a TMS and shipment-visibility platform for carrier procurement, freight, and warehouse operations?",
    industry: "logistics_transportation",
    expectedExpertId: "xp.logistics.operations",
    mustInclude: ["freight"],
  },
  {
    id: "log-ops-diag",
    query:
      "How mature is our freight and fleet operating model and what ROI comes from route optimization against driver and service-window constraints?",
    industry: "logistics_transportation",
    expectedExpertId: "xp.logistics.operations",
    mustInclude: ["freight"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Automotive Operations (xp.automotive.operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "auto-ops-metric",
    query:
      "What warranty cost per vehicle and recall rate should our automotive OEM operations plan toward on launch quality?",
    industry: "automotive",
    expectedExpertId: "xp.automotive.operations",
    mustInclude: ["warranty"],
  },
  {
    id: "auto-ops-aiuc",
    query:
      "Where can early field-quality warranty signal detection and a service-technician diagnostic copilot lift our automotive quality?",
    industry: "automotive",
    expectedExpertId: "xp.automotive.operations",
    mustInclude: ["warranty"],
  },
  {
    id: "auto-ops-pain",
    query:
      "Warranty and recall cost keeps surprising us late and connected-services monetization is stalling — what is the automotive stuck-point?",
    industry: "automotive",
    expectedExpertId: "xp.automotive.operations",
    mustInclude: ["warranty"],
  },
  {
    id: "auto-ops-vendor",
    query:
      "How should we evaluate a connected-vehicle data platform and warranty/quality system of record across OEM, supplier, and dealer?",
    industry: "automotive",
    expectedExpertId: "xp.automotive.operations",
    mustInclude: ["warranty"],
  },
  {
    id: "auto-ops-diag",
    query:
      "How mature is our automotive program-launch and warranty-quality capability and what ROI comes from earlier field-quality signals?",
    industry: "automotive",
    expectedExpertId: "xp.automotive.operations",
    mustInclude: ["warranty"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Hospitality & Lodging Operations (xp.hospitality.lodging-operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hosp-lodging-metric",
    query:
      "What RevPAR and ADR should our hotel and resort lodging operations plan toward across the owned and franchised portfolio?",
    industry: "hospitality",
    expectedExpertId: "xp.hospitality.lodging-operations",
    mustInclude: ["revpar"],
  },
  {
    id: "hosp-lodging-aiuc",
    query:
      "Where can AI revenue management with dynamic pricing and labor forecasting lift our hotel RevPAR and rooms-division operations?",
    industry: "hospitality",
    expectedExpertId: "xp.hospitality.lodging-operations",
    mustInclude: ["revpar"],
  },
  {
    id: "hosp-lodging-pain",
    query:
      "OTA commission is draining hotel margin and our RevPAR optimization is capped by fragmented PMS data — what is the lodging stuck-point?",
    industry: "hospitality",
    expectedExpertId: "xp.hospitality.lodging-operations",
    mustInclude: ["revpar"],
  },
  {
    id: "hosp-lodging-vendor",
    query:
      "How should we evaluate a PMS / CRS / revenue-management system of record for hotel rooms-division and channel-mix operations?",
    industry: "hospitality",
    expectedExpertId: "xp.hospitality.lodging-operations",
    mustInclude: ["revpar"],
  },
  {
    id: "hosp-lodging-diag",
    query:
      "How mature is our hotel revenue-management and distribution capability and what ROI comes from shifting channel mix to direct on RevPAR?",
    industry: "hospitality",
    expectedExpertId: "xp.hospitality.lodging-operations",
    mustInclude: ["revpar"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Higher Education Student Lifecycle (xp.higher-education.student-lifecycle-operations)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hed-student-metric",
    query:
      "What first-to-second-year retention and enrollment yield should our university student-lifecycle operations plan toward?",
    industry: "higher_education",
    expectedExpertId: "xp.higher-education.student-lifecycle-operations",
    mustInclude: ["retention"],
  },
  {
    id: "hed-student-aiuc",
    query:
      "Where can proactive advising with early-alert student-success AI lift retention and graduation across the student lifecycle?",
    industry: "higher_education",
    expectedExpertId: "xp.higher-education.student-lifecycle-operations",
    mustInclude: ["retention"],
  },
  {
    id: "hed-student-pain",
    query:
      "Advising caseloads are too high and first-year retention keeps slipping against the enrollment cliff — what is the student-success stuck-point?",
    industry: "higher_education",
    expectedExpertId: "xp.higher-education.student-lifecycle-operations",
    mustInclude: ["retention"],
  },
  {
    id: "hed-student-vendor",
    query:
      "How should we evaluate a SIS / CRM and early-alert advising platform of record for admissions, enrollment, and student success?",
    industry: "higher_education",
    expectedExpertId: "xp.higher-education.student-lifecycle-operations",
    mustInclude: ["retention"],
  },
  {
    id: "hed-student-diag",
    query:
      "How mature is our student-success and advising operating model and what ROI comes from improving retention and net tuition revenue?",
    industry: "higher_education",
    expectedExpertId: "xp.higher-education.student-lifecycle-operations",
    mustInclude: ["retention"],
  },
];
