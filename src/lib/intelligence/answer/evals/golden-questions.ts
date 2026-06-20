// Golden questions — W5.2 eval fixtures.
//
// One representative CXO question per Consilium expert. Used by the golden eval
// (golden-eval.ts) to score the DETERMINISTIC layer that runs without the model
// or the live env: does the router summon the right expert, and does the
// grounding block carry that expert's authored content? The model-answer
// quality scoring (does the prose actually use the benchmarks, hedge correctly,
// etc.) rides on the W5.1 runner + live env and is layered on top later.

export interface GoldenQuestion {
  id: string;
  query: string;
  /** Tenant industry when the question is industry-specific (helps routing). */
  industry?: string;
  /** The expert id the router must summon as the lead. */
  expectedExpertId: string;
  /** Optional content terms the grounding block must surface (case-insensitive). */
  mustInclude?: string[];
}

export const GOLDEN_QUESTIONS: GoldenQuestion[] = [
  // ── Healthcare vertical ────────────────────────────────────────────────────
  { id: "hc-revcycle", query: "how exposed are we on claim denials and net collections", industry: "healthcare_provider", expectedExpertId: "xp.healthcare-provider.revenue-cycle", mustInclude: ["denial"] },
  { id: "hc-clinical", query: "reduce clinician documentation burden and burnout with ambient", industry: "healthcare_provider", expectedExpertId: "xp.healthcare-provider.clinical-process-transformation" },
  { id: "hc-vbc", query: "value-based care attribution readmissions and total cost of care for our ACO", industry: "healthcare_provider", expectedExpertId: "xp.healthcare-provider.care-management-vbc" },
  { id: "hc-access", query: "cut patient no-shows and improve third next available scheduling", industry: "healthcare_provider", expectedExpertId: "xp.healthcare-provider.patient-access" },
  { id: "hc-pharmacy", query: "340B savings and specialty drug spend pharmacy margin", industry: "healthcare_provider", expectedExpertId: "xp.healthcare-provider.pharmacy-operations" },

  // ── Airline vertical ───────────────────────────────────────────────────────
  { id: "air-ops", query: "improve on-time performance and IROPS recovery and revenue management", industry: "airline", expectedExpertId: "xp.airline.operations-revenue-management" },
  { id: "air-network", query: "route network profitability fleet assignment and schedule design", industry: "airline", expectedExpertId: "xp.airline.network-schedule-planning" },
  { id: "air-loyalty", query: "co-brand card economics points liability and ancillary revenue", industry: "airline", expectedExpertId: "xp.airline.loyalty-customer" },
  { id: "air-ground", query: "aircraft turn time baggage mishandling and ramp operations", industry: "airline", expectedExpertId: "xp.airline.ground-airport-operations" },

  // ── Retail vertical ────────────────────────────────────────────────────────
  { id: "rt-merch", query: "markdown optimization gross margin and assortment pricing", industry: "retail", expectedExpertId: "xp.retail.merchandising-pricing" },
  { id: "rt-store", query: "store labor scheduling shrink and associate productivity", industry: "retail", expectedExpertId: "xp.retail.store-operations" },
  { id: "rt-omni", query: "BOPIS ship from store inventory accuracy and last mile fulfillment", industry: "retail", expectedExpertId: "xp.retail.omnichannel-fulfillment" },

  // ── Other industries ───────────────────────────────────────────────────────
  { id: "fs-fraud", query: "AML transaction monitoring false positives and SAR conversion", industry: "financial_services_banking", expectedExpertId: "xp.financial-services-banking.fraud-financial-crime" },
  { id: "en-grid", query: "grid reliability SAIDI predictive maintenance and outage restoration", industry: "energy", expectedExpertId: "xp.energy.grid-asset-operations" },

  // ── Cross-cutting domains ──────────────────────────────────────────────────
  { id: "x-backoffice", query: "automate back office shared services finance and HR with offshore", expectedExpertId: "xp.x.back-office-shared-services" },
  { id: "x-fow", query: "how is GenAI changing how each persona gets work done", expectedExpertId: "xp.x.future-of-work" },
  { id: "x-ccx", query: "contact center call deflection containment and CSAT trade-offs", expectedExpertId: "xp.x.contact-center-cx" },
  { id: "x-treasury", query: "treasury cash forecasting payments fraud and Kyriba TMS", expectedExpertId: "xp.x.treasury-transformation" },
  { id: "x-legal", query: "AI contract review redline and outside counsel spend CLM", expectedExpertId: "xp.x.legal-contract-ai" },
  { id: "x-aigov", query: "govern our AI models drift monitoring and EU AI Act readiness", expectedExpertId: "xp.x.ai-governance" },
  { id: "x-scm", query: "demand forecast accuracy OTIF and reduce excess inventory", expectedExpertId: "xp.x.supply-chain-transformation" },
  { id: "x-cyber", query: "SOC alert fatigue MTTR and AI triage for security operations", expectedExpertId: "xp.x.cybersecurity" },
  { id: "x-engprod", query: "DORA deployment frequency and developer productivity with code assistants", expectedExpertId: "xp.x.engineering-productivity" },
  { id: "x-data", query: "data quality lakehouse governance and analytics platform for AI", expectedExpertId: "xp.x.data-analytics-platform" },
  { id: "x-sales", query: "sales forecast accuracy pipeline coverage and CRM hygiene", expectedExpertId: "xp.x.sales-revenue-operations" },
  { id: "x-valueoffice", query: "stand up an enterprise AI value office with attested value and reuse", expectedExpertId: "xp.x.value-office-ai-enablement" },
  { id: "x-cpg", query: "consumer products trade promotion ROI and DTC margin", expectedExpertId: "xp.x.consumer-products-operations" },
  { id: "x-foodservice", query: "contract foodservice food cost waste and labor at our sites", expectedExpertId: "xp.x.foodservice-hospitality-operations" },
  { id: "x-marketing", query: "marketing ROI campaign attribution and media spend efficiency", expectedExpertId: "xp.x.marketing-brand" },
  { id: "x-finance", query: "FP&A forecast accuracy days to close and finance value attestation", expectedExpertId: "xp.x.finance-fpa-controllership" },
  { id: "x-corpdev", query: "acquisition diligence synergy realization and post-merger integration", expectedExpertId: "xp.x.corporate-development-ma" },
  { id: "x-hr", query: "reduce voluntary attrition time to fill and succession coverage", expectedExpertId: "xp.x.human-capital-hr" },
  { id: "x-procurement", query: "strategic sourcing spend under management and savings leakage", expectedExpertId: "xp.x.procurement-strategic-sourcing" },
  { id: "x-risk", query: "internal audit findings SOX controls and ESG third party risk", expectedExpertId: "xp.x.enterprise-risk-compliance-audit" },
  { id: "x-itops", query: "ITSM incident MTTR change success rate and cloud cost", expectedExpertId: "xp.x.it-operations-itsm" },
];
