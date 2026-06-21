// Golden-question batch 4 — cross-cutting finance, risk & enterprise-function experts.
//
// 55 realistic CXO questions: exactly 5 per cross-cutting expert (11 experts),
// each probing a distinct angle — (1) metric, (2) AI use-case, (3) pain /
// stuck-point, (4) vendor / system / sourcing, (5) diagnostic / maturity / ROI.
// All experts here are cross-cutting (no `identity.industry`), so no `industry`
// is set on any question. Each query is sharpened so the named expert wins
// TOP-1 across the full Consilium faculty, and every `mustInclude` token is
// verified present (case-insensitive) in the grounding block.

import type { GoldenQuestion } from "./types";

export const BATCH_4_FINANCE_RISK: GoldenQuestion[] = [
  // ───────────────────────── Treasury Transformation ─────────────────────────
  {
    id: "x-treasury-metric",
    query:
      "Our cash forecast accuracy degrades fast past a short horizon and we have idle, trapped cash sitting in too many bank accounts — how do treasury teams improve cash forecasting and liquidity?",
    expectedExpertId: "xp.x.treasury-transformation",
    mustInclude: ["cash", "liquidity"],
  },
  {
    id: "x-treasury-aiuc",
    query:
      "Where can AI help corporate treasury — ML cash forecasting, payments fraud detection on the payments hub, and bank-statement anomaly reconciliation?",
    expectedExpertId: "xp.x.treasury-transformation",
    mustInclude: ["payments", "forecasting"],
  },
  {
    id: "x-treasury-pain",
    query:
      "Treasury is spreadsheet-bound across a fragmented bank-portal estate with no single view of cash across our entities — what is the path off spreadsheets?",
    expectedExpertId: "xp.x.treasury-transformation",
    mustInclude: ["treasury", "spreadsheets"],
  },
  {
    id: "x-treasury-vendor",
    query:
      "We are evaluating a cloud Treasury Management System (TMS) for bank connectivity and a payments hub with fraud controls — how should we approach the TMS rollout?",
    expectedExpertId: "xp.x.treasury-transformation",
    mustInclude: ["tms", "connectivity"],
  },
  {
    id: "x-treasury-diag",
    query:
      "How mature is our corporate treasury on the visibility-then-forecast-then-control doctrine, and where is the ROI in cash visibility and working capital?",
    expectedExpertId: "xp.x.treasury-transformation",
    mustInclude: ["visibility", "working"],
  },

  // ─────────────────────── Finance FP&A / Controllership ──────────────────────
  {
    id: "x-finance-metric",
    query:
      "Our forecast accuracy (MAPE) is low and our days-to-close on the consolidated close cycle is too long — how do FP&A and controllership teams improve forecast accuracy and the close?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    mustInclude: ["forecast", "close"],
  },
  {
    id: "x-finance-aiuc",
    query:
      "Where does AI help corporate finance planning — AI-assisted driver-based forecasting, autonomous reconciliation toward a continuous close, and AI variance analysis with a management narrative?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    mustInclude: ["driver", "reconciliation"],
  },
  {
    id: "x-finance-pain",
    query:
      "Our financial planning is spreadsheet-bound and version-fragile with no single source of financial truth on the GL — how do we baseline a finance-signed plan?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    mustInclude: ["planning", "controllership"],
  },
  {
    id: "x-finance-vendor",
    query:
      "We are choosing an EPM / CPM planning platform and a consolidation & close management tool to replace our budgeting and forecasting spreadsheets — how should FP&A evaluate it?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    mustInclude: ["budgeting", "consolidation"],
  },
  {
    id: "x-finance-diag",
    query:
      "How do we get Finance to attest to benefit numbers so value counts in the P&L — what does value attestation and a finance-signed baseline require?",
    expectedExpertId: "xp.x.finance-fpa-controllership",
    mustInclude: ["attestation", "baseline"],
  },

  // ──────────────────────────────── Corporate Tax ────────────────────────────
  {
    id: "x-tax-metric",
    query:
      "Our effective tax rate (ETR) and cash tax rate are volatile and the tax-provision close cycle drags — how does the corporate tax function tighten the provision close?",
    expectedExpertId: "xp.x.corporate-tax",
    mustInclude: ["provision", "indirect"],
  },
  {
    id: "x-tax-aiuc",
    query:
      "Where can AI help corporate tax — AI-assisted tax data sourcing and an AI-accelerated tax provision under ASC 740 and IAS 12, plus indirect-tax determination triage?",
    expectedExpertId: "xp.x.corporate-tax",
    mustInclude: ["provision", "determination"],
  },
  {
    id: "x-tax-pain",
    query:
      "Our income-tax provision still lives in spreadsheets despite the tax engine, and transfer-pricing documentation is chronically under-resourced — how do we fix tax data sourcing from the ERP?",
    expectedExpertId: "xp.x.corporate-tax",
    mustInclude: ["transfer", "pricing"],
  },
  {
    id: "x-tax-vendor",
    query:
      "We are selecting an indirect-tax determination engine and tax provision software (Vertex, Avalara, ONESOURCE, Corptax) for VAT/GST and sales/use determination — how should we approach it?",
    expectedExpertId: "xp.x.corporate-tax",
    mustInclude: ["indirect", "determination"],
  },
  {
    id: "x-tax-diag",
    query:
      "How ready are we for OECD BEPS Pillar Two GloBE data assembly and e-invoicing real-time reporting mandates, and where is the ROI in tax compliance modernization?",
    expectedExpertId: "xp.x.corporate-tax",
    mustInclude: ["pillar", "invoicing"],
  },

  // ───────────────────────── Corporate Development / M&A ──────────────────────
  {
    id: "x-corpdev-metric",
    query:
      "Our deal pipeline coverage is thin, synergy realization keeps missing the underwrite, and integration milestones slip — how does corporate development tighten deal and synergy discipline?",
    expectedExpertId: "xp.x.corporate-development-ma",
    mustInclude: ["synergy", "diligence"],
  },
  {
    id: "x-corpdev-aiuc",
    query:
      "Where can AI help the M&A lifecycle — AI deal sourcing and screening, AI-assisted due diligence, and synergy estimation with haircut validation?",
    expectedExpertId: "xp.x.corporate-development-ma",
    mustInclude: ["sourcing", "diligence"],
  },
  {
    id: "x-corpdev-pain",
    query:
      "Most of our M&A value leaks in post-merger integration and our synergy estimates are systematically over-optimistic — how do we enforce thesis discipline and haircut synergies?",
    expectedExpertId: "xp.x.corporate-development-ma",
    mustInclude: ["integration", "synergy"],
  },
  {
    id: "x-corpdev-vendor",
    query:
      "We are standing up a virtual data room (VDR) for diligence and an integration management office tracker for PMI on our next acquisition — how should corporate development run it?",
    expectedExpertId: "xp.x.corporate-development-ma",
    mustInclude: ["diligence", "integration"],
  },
  {
    id: "x-corpdev-diag",
    query:
      "As a decentralized holding company supporting acquired businesses, how do we assess portfolio value creation and deal IRR versus the underwrite — where is the ROI in M&A?",
    expectedExpertId: "xp.x.corporate-development-ma",
    mustInclude: ["portfolio", "synergy"],
  },

  // ─────────────────── Enterprise Risk / Compliance / Audit ───────────────────
  {
    id: "x-risk-metric",
    query:
      "Our open internal-audit findings keep aging, control test pass rates are weak, and key-risk-indicator coverage is patchy — how does the GRC function tighten controls and findings remediation?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    mustInclude: ["audit", "controls"],
  },
  {
    id: "x-risk-aiuc",
    query:
      "Where can AI help second-line and internal audit assurance — continuous controls monitoring with automated testing, AI-assisted audit analytics and workpaper drafting, and regulatory-change tracking?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    mustInclude: ["controls", "audit"],
  },
  {
    id: "x-risk-pain",
    query:
      "Our SOX controls are designed on paper but not operating, internal audit findings lag the live state and repeat, and GRC is siloed with no single risk view — how do we fix it?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    mustInclude: ["controls", "audit"],
  },
  {
    id: "x-risk-vendor",
    query:
      "We are evaluating an integrated GRC platform and an internal-audit management platform for our risk register, policy attestation, and SOX control testing — how should we approach it?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    mustInclude: ["compliance", "audit"],
  },
  {
    id: "x-risk-diag",
    query:
      "How mature is our three-lines assurance model and risk-proportionate effort on key risks and key controls, and is our ESG data assurance ready for disclosure?",
    expectedExpertId: "xp.x.enterprise-risk-compliance-audit",
    mustInclude: ["assurance", "controls"],
  },

  // ───────────────────────────── Legal / Contract AI ──────────────────────────
  {
    id: "x-legal-metric",
    query:
      "Our contract cycle time from request to signature is too slow, NDA turnaround lags, and outside-counsel spend keeps climbing — how does the legal function speed up contracting?",
    expectedExpertId: "xp.x.legal-contract-ai",
    mustInclude: ["contract", "counsel"],
  },
  {
    id: "x-legal-aiuc",
    query:
      "Where can GenAI help corporate legal — AI contract review and redlining, clause extraction and obligation management, and self-serve contract generation?",
    expectedExpertId: "xp.x.legal-contract-ai",
    mustInclude: ["contract", "redlining"],
  },
  {
    id: "x-legal-pain",
    query:
      "Legal is the contract bottleneck, we have a dark estate of off-CLM rogue contracts, and lawyer adoption resistance is blocking us — how do we get value from contract AI?",
    expectedExpertId: "xp.x.legal-contract-ai",
    mustInclude: ["contract", "clm"],
  },
  {
    id: "x-legal-vendor",
    query:
      "We are selecting a contract lifecycle management (CLM) platform and AI contract review tooling for drafting, redlining, and legal intake triage — how should legal evaluate it?",
    expectedExpertId: "xp.x.legal-contract-ai",
    mustInclude: ["clm", "redlining"],
  },
  {
    id: "x-legal-diag",
    query:
      "With attorney-client privilege and GenAI hallucination risk, how do we keep a human-in-the-loop posture on contract review and measure capacity reclaimed and risk reduction as the ROI?",
    expectedExpertId: "xp.x.legal-contract-ai",
    mustInclude: ["contract", "redlining"],
  },

  // ──────────────────────────── Human Capital / HR ────────────────────────────
  {
    id: "x-hr-metric",
    query:
      "Our voluntary and regrettable attrition rates are climbing, time to fill is slow, and internal mobility is low — how does the human-capital function improve retention and quality of hire?",
    expectedExpertId: "xp.x.human-capital-hr",
    mustInclude: ["attrition", "talent"],
  },
  {
    id: "x-hr-aiuc",
    query:
      "Where can AI help strategic human capital — attrition and flight-risk prediction, an internal talent marketplace with skills matching, and a manager coaching and people-leadership assistant?",
    expectedExpertId: "xp.x.human-capital-hr",
    mustInclude: ["attrition", "talent"],
  },
  {
    id: "x-hr-pain",
    query:
      "We are flying blind on regrettable attrition, manager capability is the unfixed gate, and our succession plans exist on paper only — how do we fix the people function?",
    expectedExpertId: "xp.x.human-capital-hr",
    mustInclude: ["attrition", "succession"],
  },
  {
    id: "x-hr-vendor",
    query:
      "We are evaluating a core HRIS/HCM, an applicant tracking system, and a talent marketplace for talent acquisition, total rewards, and workforce planning — how should HR approach it?",
    expectedExpertId: "xp.x.human-capital-hr",
    mustInclude: ["talent", "rewards"],
  },
  {
    id: "x-hr-diag",
    query:
      "How do we attribute people-program ROI when engagement and retention are lagging indicators, and how mature is our skills architecture and succession readiness?",
    expectedExpertId: "xp.x.human-capital-hr",
    mustInclude: ["talent", "succession"],
  },

  // ─────────────────────── Procurement / Strategic Sourcing ───────────────────
  {
    id: "x-procurement-metric",
    query:
      "Our spend under management is low, negotiated savings keep leaking before they hit the P&L, and maverick off-contract spend is high — how does strategic sourcing fix savings realization?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    mustInclude: ["sourcing", "spend"],
  },
  {
    id: "x-procurement-aiuc",
    query:
      "Where can AI help strategic sourcing and category management — AI spend classification and opportunity analytics, agentic sourcing events, and tail-spend automation?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    mustInclude: ["sourcing", "spend"],
  },
  {
    id: "x-procurement-pain",
    query:
      "Savings leakage means negotiated value never lands, our spend data is dirty and unclassified, and tail spend keeps eroding value — how do we fix category and sourcing discipline?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    mustInclude: ["sourcing", "savings"],
  },
  {
    id: "x-procurement-vendor",
    query:
      "We are selecting a source-to-contract (S2C) strategic-sourcing platform and a spend-analytics tool for category management and supplier relationship management — how should procurement evaluate it?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    mustInclude: ["sourcing", "category"],
  },
  {
    id: "x-procurement-diag",
    query:
      "How do we size value on addressable spend and realized savings rather than a headline negotiated number, and how mature is our savings-realization leakage tracking?",
    expectedExpertId: "xp.x.procurement-strategic-sourcing",
    mustInclude: ["sourcing", "savings"],
  },

  // ─────────────────────── Supply Chain Transformation ────────────────────────
  {
    id: "x-scm-metric",
    query:
      "Our demand forecast accuracy (MAPE) is poor with persistent forecast bias, inventory turns are low, and OTIF perfect-order rates suffer — how does supply chain improve planning?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    mustInclude: ["inventory", "forecasting"],
  },
  {
    id: "x-scm-aiuc",
    query:
      "Where can AI help the end-to-end supply chain — ML demand forecasting and demand sensing, multi-echelon inventory optimization, and agentic S&OP scenario and exception planning?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    mustInclude: ["demand", "inventory"],
  },
  {
    id: "x-scm-pain",
    query:
      "We have persistent forecast bias and plan gaming, bullwhip demand-signal amplification, and inventory imbalance with stockouts and excess at the same time — how do we fix S&OP?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    mustInclude: ["forecast", "inventory"],
  },
  {
    id: "x-scm-vendor",
    query:
      "We are evaluating an APS advanced-planning and IBP suite alongside our ERP and a supply-chain visibility and supplier-risk platform — how should supply chain approach demand planning?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    mustInclude: ["planning", "inventory"],
  },
  {
    id: "x-scm-diag",
    query:
      "Given data quality is the binding constraint and forecast-accuracy gains erode in volatile demand, how do we size durable value on working-capital release and service-level protection?",
    expectedExpertId: "xp.x.supply-chain-transformation",
    mustInclude: ["forecast", "inventory"],
  },

  // ─────────────────────── Value Office / AI Enablement ───────────────────────
  {
    id: "x-valueoffice-metric",
    query:
      "Our idea-to-go/no-go decision time is slow, few initiatives have a baselined value case, and shared-asset reuse is low — how does an enterprise value office improve portfolio throughput?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    mustInclude: ["value", "reuse"],
  },
  {
    id: "x-valueoffice-aiuc",
    query:
      "Where do AI use-cases help an AI-enablement office — an idea intake and triage copilot, a business-process mapping and reengineering assistant, and a reusable enterprise context layer?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    mustInclude: ["reusable", "context"],
  },
  {
    id: "x-valueoffice-pain",
    query:
      "Our value office has become a demo factory making blanket-percentage value claims, we rebuild everything with no reuse, and governance is bolted on at the end — how do we fix the operating model?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    mustInclude: ["value", "reuse"],
  },
  {
    id: "x-valueoffice-vendor",
    query:
      "We are standing up a value control tower with a portfolio management system, a process-intelligence mapping tool, and an AI governance model registry — how should the AI-enablement office wire it?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    mustInclude: ["enablement", "context"],
  },
  {
    id: "x-valueoffice-diag",
    query:
      "How do we move from a value claim to Finance attestation per initiative, build adoption pull rather than mandate, and measure responsible-AI compliance and the ROI of reuse?",
    expectedExpertId: "xp.x.value-office-ai-enablement",
    mustInclude: ["attestation", "reuse"],
  },

  // ─────────────────────── Insurance Underwriting / Claims ────────────────────
  {
    id: "x-insurance-metric",
    query:
      "Our loss ratio and combined ratio are deteriorating, claims leakage on indemnity is high, and claims cycle time from FNOL to settlement is slow — how does the insurance function tighten claims and underwriting economics?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    mustInclude: ["claims", "underwriting"],
  },
  {
    id: "x-insurance-aiuc",
    query:
      "Where can AI help the insurance value chain — claims leakage and subrogation detection, FNOL intake and claims triage automation, and underwriting submission triage and assist?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    mustInclude: ["claims", "underwriting"],
  },
  {
    id: "x-insurance-pain",
    query:
      "We have claims leakage on indemnity, fat-tailed fraud under-detection in our SIU, and legacy policy-admin with fragmented data — how do we fix claims and underwriting throughput?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    mustInclude: ["claims", "underwriting"],
  },
  {
    id: "x-insurance-vendor",
    query:
      "We are evaluating a policy administration system, a claims management system, and an underwriting workbench with a rating engine and an SIU fraud-detection platform — how should we approach it?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    mustInclude: ["claims", "underwriting"],
  },
  {
    id: "x-insurance-diag",
    query:
      "Given loss-ratio discipline and actuarial rate-filing rigor that bounds AI in pricing, how mature is our underwriting risk selection and where is the ROI in claims leakage reduction?",
    expectedExpertId: "xp.x.insurance-underwriting-claims",
    mustInclude: ["claims", "underwriting"],
  },
];
