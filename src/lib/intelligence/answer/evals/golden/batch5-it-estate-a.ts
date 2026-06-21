// Golden question batch 5 — cross-cutting IT-estate experts (set A).
//
// EXACTLY 5 questions for each of the 10 cross-cutting IT experts (50 total),
// covering 5 distinct angles each: (1) metric, (2) AI use-case, (3) pain /
// stuck-point, (4) vendor/system/sourcing, (5) diagnostic/maturity/ROI.
//
// Every question is verified to (a) route TOP-1 to its expectedExpertId across
// all registered experts and (b) surface each `mustInclude` token in the
// grounding block. These experts are all cross-cutting, so `industry` is omitted
// (a known tenant industry must never fence a cross-cutting routing decision).

import type { GoldenQuestion } from "./types";

export const BATCH_5_IT_ESTATE_A: GoldenQuestion[] = [
  // ── xp.x.cybersecurity ────────────────────────────────────────────────────
  {
    id: "x-cyber-metric",
    query:
      "What MTTD and MTTR benchmarks should our SOC target, and how do alert volume per analyst and false-positive rate compare across peers?",
    expectedExpertId: "xp.x.cybersecurity",
    mustInclude: ["alert"],
  },
  {
    id: "x-cyber-aiuc",
    query:
      "Where does AI alert triage and SOAR automated response help the most in our SOC, and where could auto-suppression miss a real threat?",
    expectedExpertId: "xp.x.cybersecurity",
    mustInclude: ["triage"],
  },
  {
    id: "x-cyber-pain",
    query:
      "Our security analysts are drowning in alert fatigue and we keep losing scarce SOC talent — how do we break the under-staffed, over-tooled trap?",
    expectedExpertId: "xp.x.cybersecurity",
    mustInclude: ["analyst"],
  },
  {
    id: "x-cyber-vendor",
    query:
      "How should we consolidate our SIEM, SOAR, and EDR-XDR detection-engineering stack and rationalize threat detection tooling?",
    expectedExpertId: "xp.x.cybersecurity",
    mustInclude: ["detection"],
  },
  {
    id: "x-cyber-diag",
    query:
      "Assess the maturity of our vulnerability and exposure management — what share of critical vulnerabilities are we remediating within SLA?",
    expectedExpertId: "xp.x.cybersecurity",
    mustInclude: ["vulnerabilit"],
  },

  // ── xp.x.engineering-productivity ─────────────────────────────────────────
  {
    id: "x-engprod-metric",
    query:
      "What DORA deployment frequency and lead-time-for-changes benchmarks should our engineering org hold, balancing throughput and stability?",
    expectedExpertId: "xp.x.engineering-productivity",
    mustInclude: ["dora"],
  },
  {
    id: "x-engprod-aiuc",
    query:
      "How much can an in-IDE code completion assistant and AI pull-request code review improve our DORA lead time for changes without weakening review quality?",
    expectedExpertId: "xp.x.engineering-productivity",
    mustInclude: ["review"],
  },
  {
    id: "x-engprod-pain",
    query:
      "Leadership keeps measuring lines of code and commit counts as productivity — how do we move our SDLC off these vanity metrics?",
    expectedExpertId: "xp.x.engineering-productivity",
    mustInclude: ["vanity"],
  },
  {
    id: "x-engprod-vendor",
    query:
      "Which code completion assistant and platform-engineering developer-experience tools should we standardize on to raise deployment frequency in our SDLC?",
    expectedExpertId: "xp.x.engineering-productivity",
    mustInclude: ["developer"],
  },
  {
    id: "x-engprod-diag",
    query:
      "Diagnose our software delivery maturity against the DORA frame — is our pull-request cycle time and change failure rate where it should be?",
    expectedExpertId: "xp.x.engineering-productivity",
    mustInclude: ["deployment"],
  },

  // ── xp.x.data-analytics-platform ──────────────────────────────────────────
  {
    id: "x-data-metric",
    query:
      "What pipeline reliability, data freshness, and data quality score benchmarks should our lakehouse platform hold to be trustworthy?",
    expectedExpertId: "xp.x.data-analytics-platform",
    mustInclude: ["pipeline"],
  },
  {
    id: "x-data-aiuc",
    query:
      "Where do AI data observability and a text-to-SQL conversational analytics layer on top of our certified semantic layer add the most value?",
    expectedExpertId: "xp.x.data-analytics-platform",
    mustInclude: ["semantic"],
  },
  {
    id: "x-data-pain",
    query:
      "We built the lakehouse but adoption stalled because data quality and governance are weak — how do we fix the binding constraint on every AI bet?",
    expectedExpertId: "xp.x.data-analytics-platform",
    mustInclude: ["lakehouse"],
  },
  {
    id: "x-data-vendor",
    query:
      "How should we choose between warehouse and lakehouse ELT ingestion tooling and a catalog with lineage for our data engineering estate?",
    expectedExpertId: "xp.x.data-analytics-platform",
    mustInclude: ["catalog"],
  },
  {
    id: "x-data-diag",
    query:
      "Assess the maturity of our data platform — what share of datasets are documented and cataloged, and how fast can we onboard a new source?",
    expectedExpertId: "xp.x.data-analytics-platform",
    mustInclude: ["documented"],
  },

  // ── xp.x.ai-governance ────────────────────────────────────────────────────
  {
    id: "x-aigov-metric",
    query:
      "What model inventory coverage and high-risk model validation rate should we target for our AI governance program?",
    expectedExpertId: "xp.x.ai-governance",
    mustInclude: ["inventory"],
  },
  {
    id: "x-aigov-aiuc",
    query:
      "How can automated model discovery and continuous drift detection turn our AI governance from a launch gate into a lifecycle control?",
    expectedExpertId: "xp.x.ai-governance",
    mustInclude: ["drift"],
  },
  {
    id: "x-aigov-pain",
    query:
      "Shadow AI is spreading and our model risk validation backlog keeps growing — how do we get proportionate, risk-tiered governance without a uniform brake?",
    expectedExpertId: "xp.x.ai-governance",
    mustInclude: ["validation"],
  },
  {
    id: "x-aigov-vendor",
    query:
      "What policy-as-code controls and guardrails do we need to enforce EU AI Act and NIST AI RMF model-risk readiness across our GenAI estate?",
    expectedExpertId: "xp.x.ai-governance",
    mustInclude: ["policy-as-code"],
  },
  {
    id: "x-aigov-diag",
    query:
      "Assess the maturity of our AI risk-tiering and production model monitoring coverage — are high-risk use cases under human-in-the-loop control?",
    expectedExpertId: "xp.x.ai-governance",
    mustInclude: ["monitoring"],
  },

  // ── xp.x.it-operations-itsm ───────────────────────────────────────────────
  {
    id: "x-itops-metric",
    query:
      "What incident MTTR, first-contact resolution, and change success rate benchmarks should our ITSM and service desk hold?",
    expectedExpertId: "xp.x.it-operations-itsm",
    mustInclude: ["incident"],
  },
  {
    id: "x-itops-aiuc",
    query:
      "Where does AIOps event correlation and a service-desk virtual agent deliver genuine ticket deflection without harming availability?",
    expectedExpertId: "xp.x.it-operations-itsm",
    mustInclude: ["aiops"],
  },
  {
    id: "x-itops-pain",
    query:
      "Change-related outages keep biting us and our CMDB data quality is poor — how do we stabilize RUN-IT before betting on automation?",
    expectedExpertId: "xp.x.it-operations-itsm",
    mustInclude: ["change"],
  },
  {
    id: "x-itops-vendor",
    query:
      "How should we rationalize our ITSM platform and observability tools to lift service-desk auto-resolution and deflection?",
    expectedExpertId: "xp.x.it-operations-itsm",
    mustInclude: ["deflection"],
  },
  {
    id: "x-itops-diag",
    query:
      "Diagnose the maturity of our service-management operation — is our ticket auto-resolution rate and SLA attainment where AIOps adoption requires?",
    expectedExpertId: "xp.x.it-operations-itsm",
    mustInclude: ["resolution"],
  },

  // ── xp.x.it-outsourcing-managed-services ──────────────────────────────────
  {
    id: "x-itoutsourcing-metric",
    query:
      "What SLA attainment and XLA outcome attainment benchmarks should our managed-services contracts hold, and what blended rate is market?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    mustInclude: ["sla"],
  },
  {
    id: "x-itoutsourcing-aiuc",
    query:
      "How does AI service-desk deflection shrink the offshore headcount our application management services case assumed?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    mustInclude: ["offshore"],
  },
  {
    id: "x-itoutsourcing-pain",
    query:
      "Our provider reports green SLAs but outcomes are poor — how do we deal with watermelon SLAs and the hidden exit and lock-in cost of outsourcing?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    mustInclude: ["sla"],
  },
  {
    id: "x-itoutsourcing-vendor",
    query:
      "How should we structure the MSA, SOW, and SLA design for an AMS vendor selection and nearshore delivery transition?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    mustInclude: ["nearshore"],
  },
  {
    id: "x-itoutsourcing-diag",
    query:
      "Assess our managed-services sourcing maturity — is our managed-services cost as a percent of IT budget and our offshore mix defensible?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    mustInclude: ["managed-services"],
  },

  // ── xp.x.it-spend-optimization-tbm ────────────────────────────────────────
  {
    id: "x-tbm-metric",
    query:
      "What IT-spend-as-percent-of-revenue and run-vs-change ratio benchmarks should our TBM cost model hold against peers?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    mustInclude: ["transparency"],
  },
  {
    id: "x-tbm-aiuc",
    query:
      "How can AI-assisted cost transparency map every IT GL line to the TBM taxonomy of cost pools, towers, and services for showback?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    mustInclude: ["taxonomy"],
  },
  {
    id: "x-tbm-pain",
    query:
      "We have sprawling shelfware and redundant overlapping applications inflating IT cost — where is the biggest recoverable savings pool?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    mustInclude: ["shelfware"],
  },
  {
    id: "x-tbm-vendor",
    query:
      "How do we run software and SaaS license utilization optimization to surface shelfware and reclaim entitlements before each renewal true-up?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    mustInclude: ["license"],
  },
  {
    id: "x-tbm-diag",
    query:
      "Diagnose our application rationalization maturity using a TIME disposition — how much of our IT spend has cost transparency and how high is redundancy?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    mustInclude: ["rationalization"],
  },

  // ── xp.x.ai-engineering-delivery ──────────────────────────────────────────
  {
    id: "x-aieng-metric",
    query:
      "What evaluation pass rate, hallucination rate, and p95 latency benchmarks should our production LLM application hold?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    mustInclude: ["hallucination"],
  },
  {
    id: "x-aieng-aiuc",
    query:
      "How do we build a RAG-grounded knowledge assistant with hybrid retrieval and re-ranking that cuts hallucination and stays traceable?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    mustInclude: ["rag"],
  },
  {
    id: "x-aieng-pain",
    query:
      "Our GenAI prototype demos great but stalls at the demo-to-production gap and inference cost is too high — how do we ship it reliably?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    mustInclude: ["inference"],
  },
  {
    id: "x-aieng-vendor",
    query:
      "How should we approach model selection and stand up an MLOps evaluation harness with LLM-as-judge to regression-gate every prompt change?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    mustInclude: ["evaluation"],
  },
  {
    id: "x-aieng-diag",
    query:
      "Assess our AI delivery maturity — is our agentic workflow autonomy gated by measured task success and acceptable cost per resolved task?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    mustInclude: ["agentic"],
  },

  // ── xp.x.cloud-infrastructure-modernization ───────────────────────────────
  {
    id: "x-cloud-metric",
    query:
      "What share of workloads in cloud and committed-use reservation coverage benchmarks should our landing-zone strategy target?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    mustInclude: ["landing"],
  },
  {
    id: "x-cloud-aiuc",
    query:
      "How can AI-assisted estate discovery and dependency mapping recommend a migration disposition of re-host, re-platform, or re-architect per workload?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    mustInclude: ["migration"],
  },
  {
    id: "x-cloud-pain",
    query:
      "Our lift-and-shift cloud migration failed to deliver cloud economics and spend is overrunning — how does FinOps discipline recover the savings?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    mustInclude: ["finops"],
  },
  {
    id: "x-cloud-vendor",
    query:
      "How should we generate infrastructure-as-code landing-zone modules and rightsizing commitment optimization across our multi-cloud estate?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    mustInclude: ["rightsizing"],
  },
  {
    id: "x-cloud-diag",
    query:
      "Diagnose our cloud modernization maturity — what re-architected share have we reached versus default lift-and-shift, and is cloud unit cost trending down?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    mustInclude: ["re-architect"],
  },

  // ── xp.x.erp-platform-modernization ───────────────────────────────────────
  {
    id: "x-erp-metric",
    query:
      "What implementation-cost-vs-budget overrun and on-time milestone delivery benchmarks should our ERP modernization program hold?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    mustInclude: ["customization"],
  },
  {
    id: "x-erp-aiuc",
    query:
      "How can AI data-migration cleansing and reconciliation de-risk our ERP cutover so the first finance close ties to the source of record?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    mustInclude: ["reconciliation"],
  },
  {
    id: "x-erp-pain",
    query:
      "Our ERP program keeps suffering scope creep and gold-plated customization away from clean core — how do we keep the extension ratio low?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    mustInclude: ["clean-core"],
  },
  {
    id: "x-erp-vendor",
    query:
      "How should we run ERP selection across SAP S/4HANA, Oracle, and Workday and manage the systems-integrator on a clean-core extension strategy?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    mustInclude: ["erp"],
  },
  {
    id: "x-erp-diag",
    query:
      "Assess our ERP value-realization maturity post-go-live — is process standardization high and the customization ratio against clean core under control?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    mustInclude: ["standardization"],
  },
];
