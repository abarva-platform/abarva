// Golden-question batch 6 — cross-cutting IT-estate experts (set B).
//
// 45 questions (5 per expert) across the 9 horizontal CIO/architecture
// ExpertPacks. Each question is a realistic CIO/architect ask covering five
// distinct angles: (1) a metric, (2) an AI use-case, (3) a pain/stuck-point,
// (4) a vendor/system/sourcing question, and (5) a diagnostic/maturity/ROI
// question. Every question must route TOP-1 to its expected expert and its
// `mustInclude` token(s) must surface in the expert grounding block.
//
// HARD PASS: routeQuestion({query}).experts[0].id === expectedExpertId AND
// every mustInclude token appears in summonExpertsForQuery({query}).groundingBlock.

import type { GoldenQuestion } from "./types";

export const BATCH_6_IT_ESTATE_B: GoldenQuestion[] = [
  // ── Application & Digital Modernization ───────────────────────────────────
  {
    id: "x-appmod-metric",
    query:
      "What share of our application budget is trapped in maintenance run cost versus change, and what is our net decommission rate across the application estate?",
    expectedExpertId: "xp.x.application-modernization",
    mustInclude: ["decommission"],
  },
  {
    id: "x-appmod-aiuc",
    query:
      "How can AI legacy code comprehension and AI-assisted re-factoring accelerate strangler-fig modernization of our aging monolith applications without a big-bang rewrite?",
    expectedExpertId: "xp.x.application-modernization",
    mustInclude: ["legacy", "re-factoring"],
  },
  {
    id: "x-appmod-pain",
    query:
      "Our modernization roadmap is all big-bang rewrites and the rewrite reflex keeps re-coding systems instead of retiring redundant low-value applications — how do we shift to rationalization and consolidation?",
    expectedExpertId: "xp.x.application-modernization",
    mustInclude: ["rewrite"],
  },
  {
    id: "x-appmod-vendor",
    query:
      "For our application rationalization, how do we gate the re-purchase SaaS replacement and SI modernization partner against TIME/6R disposition that actually retires, consolidates, and decommissions redundant legacy applications?",
    expectedExpertId: "xp.x.application-modernization",
    mustInclude: ["decommission"],
  },
  {
    id: "x-appmod-diag",
    query:
      "Run a maturity diagnostic on our TIME/6R application disposition: how trustworthy is our application inventory, and what is the realized rationalization ROI from retiring and consolidating applications?",
    expectedExpertId: "xp.x.application-modernization",
    mustInclude: ["disposition"],
  },

  // ── Enterprise Architecture & Technology Strategy ─────────────────────────
  {
    id: "x-ea-metric",
    query:
      "What is our architecture standards compliance rate and technology diversity sprawl index per capability category, and how do we measure architecture debt as a trend?",
    expectedExpertId: "xp.x.enterprise-architecture",
    mustInclude: ["standards"],
  },
  {
    id: "x-ea-aiuc",
    query:
      "Can an AI architecture-review copilot triage our review intake against the standards catalog and reference architectures, and keep the technology radar current and directive?",
    expectedExpertId: "xp.x.enterprise-architecture",
    mustInclude: ["radar"],
  },
  {
    id: "x-ea-pain",
    query:
      "Our enterprise architecture function has become an ivory tower — target-state diagrams nobody decides with, standards no one follows, and architecture review is a velocity tax. How do we make EA enable decisions?",
    expectedExpertId: "xp.x.enterprise-architecture",
    mustInclude: ["architecture"],
  },
  {
    id: "x-ea-vendor",
    query:
      "We are selecting an enterprise architecture repository and technology radar tooling to govern our build-vs-buy decisions and reference-architecture reuse — what should we weigh?",
    expectedExpertId: "xp.x.enterprise-architecture",
    mustInclude: ["reference-architecture"],
  },
  {
    id: "x-ea-diag",
    query:
      "Assess the maturity of our architecture governance: what share of material technology investment decisions had architecture input at decision time, and is our as-is/target-state gap narrowing?",
    expectedExpertId: "xp.x.enterprise-architecture",
    mustInclude: ["standards"],
  },

  // ── IT Strategy & Operating Model ─────────────────────────────────────────
  {
    id: "x-itstrategy-metric",
    query:
      "What is our IT operating model's strategic-versus-run spend split, business-IT alignment score, and strategic roadmap delivery rate against the CIO agenda?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    mustInclude: ["alignment"],
  },
  {
    id: "x-itstrategy-aiuc",
    query:
      "How can AI-assisted strategy synthesis and AI value-realization tracking help us shape the IT roadmap and prove benefits realization across the portfolio?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    mustInclude: ["strategy"],
  },
  {
    id: "x-itstrategy-pain",
    query:
      "We have a digital strategy but no operating model to deliver it — our reorg moved boxes but not decision rights or incentives, and governance has become a bottleneck. How do we fix the operating model?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    mustInclude: ["operating"],
  },
  {
    id: "x-itstrategy-vendor",
    query:
      "Which strategic portfolio management and demand-management intake systems support shifting from project to product funding mix in our IT operating model, and how do we govern them?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    mustInclude: ["funding"],
  },
  {
    id: "x-itstrategy-diag",
    query:
      "Run a diagnostic on whether our IT delivers outcomes versus systems: is value being realized, where is portfolio overload and WIP, and how mature is our governance time-to-decision?",
    expectedExpertId: "xp.x.it-strategy-operating-model",
    mustInclude: ["governance"],
  },

  // ── Digital Product Management ────────────────────────────────────────────
  {
    id: "x-digprod-metric",
    query:
      "What share of our work is funded as products versus projects, our outcome-versus-output ratio, and how many initiatives have a defined target metric and feature adoption rate?",
    expectedExpertId: "xp.x.digital-product-management",
    mustInclude: ["outcome"],
  },
  {
    id: "x-digprod-aiuc",
    query:
      "How can AI-accelerated continuous discovery and AI-assisted product analytics help our empowered product teams find outcomes and instrument feature adoption?",
    expectedExpertId: "xp.x.digital-product-management",
    mustInclude: ["discovery"],
  },
  {
    id: "x-digprod-pain",
    query:
      "Our roadmap is a feature factory — output over outcome, agile theater with ceremonies but no product operating model, and product managers act as backlog administrators. How do we move to empowered product teams?",
    expectedExpertId: "xp.x.digital-product-management",
    mustInclude: ["product"],
  },
  {
    id: "x-digprod-vendor",
    query:
      "Which product analytics and experimentation A/B testing platforms, plus a roadmap and OKR system, should we adopt to instrument outcome attainment for our product teams?",
    expectedExpertId: "xp.x.digital-product-management",
    mustInclude: ["product"],
  },
  {
    id: "x-digprod-diag",
    query:
      "Assess the maturity of our product operating model: are we funding stable product teams, framing the roadmap as outcomes, and skipping continuous discovery before building?",
    expectedExpertId: "xp.x.digital-product-management",
    mustInclude: ["product"],
  },

  // ── Integration & API Management ──────────────────────────────────────────
  {
    id: "x-integration-metric",
    query:
      "What is our ratio of reusable versus point-to-point integrations, our API reuse rate, and integration delivery lead time across the estate?",
    expectedExpertId: "xp.x.integration-api-management",
    mustInclude: ["api"],
  },
  {
    id: "x-integration-aiuc",
    query:
      "Can an AI integration and API authoring copilot, plus AI-assisted API discovery and cataloging, accelerate reuse and cut our integration delivery time?",
    expectedExpertId: "xp.x.integration-api-management",
    mustInclude: ["api"],
  },
  {
    id: "x-integration-pain",
    query:
      "We have point-to-point integration sprawl — the O(n-squared) tax — an ungoverned API estate, and a batch-bound backbone that blocks real-time and agentic use cases. How do we move to API-led layered connectivity?",
    expectedExpertId: "xp.x.integration-api-management",
    mustInclude: ["integration"],
  },
  {
    id: "x-integration-vendor",
    query:
      "How should we evaluate an iPaaS integration platform and an API gateway with full-lifecycle management, plus an event-streaming backbone, for our integration modernization?",
    expectedExpertId: "xp.x.integration-api-management",
    mustInclude: ["integration"],
  },
  {
    id: "x-integration-diag",
    query:
      "Run a maturity diagnostic on our integration estate: what is the maintenance share of IT budget consumed by integration, our API availability SLA attainment, and the ROI of decoupling to reusable APIs?",
    expectedExpertId: "xp.x.integration-api-management",
    mustInclude: ["api"],
  },

  // ── Identity & Access Management ──────────────────────────────────────────
  {
    id: "x-iam-metric",
    query:
      "What is our phishing-resistant MFA coverage, the share of privileged accounts under PAM, our access recertification completion rate, and our orphaned dormant account rate?",
    expectedExpertId: "xp.x.identity-access-management",
    mustInclude: ["recertification"],
  },
  {
    id: "x-iam-aiuc",
    query:
      "Can AI-assisted access recertification, AI-driven joiner-mover-leaver provisioning, and AI role mining right-size entitlements and enforce least privilege across our identity estate?",
    expectedExpertId: "xp.x.identity-access-management",
    mustInclude: ["recertification"],
  },
  {
    id: "x-iam-pain",
    query:
      "We have over-privilege and entitlement creep, orphaned and dormant accounts from leaver-hygiene failures, and access recertification has become a rubber-stamp. How do we get to least privilege?",
    expectedExpertId: "xp.x.identity-access-management",
    mustInclude: ["privileged"],
  },
  {
    id: "x-iam-vendor",
    query:
      "How should we evaluate an Identity Governance and Administration platform, a Privileged Access Management tool, and our IdP for SSO and deprovisioning at offboarding?",
    expectedExpertId: "xp.x.identity-access-management",
    mustInclude: ["privileged"],
  },
  {
    id: "x-iam-diag",
    query:
      "Assess the maturity of our identity and access management program: how fast is time-to-revoke on offboarding, and what is the ROI of automating the joiner-mover-leaver lifecycle?",
    expectedExpertId: "xp.x.identity-access-management",
    mustInclude: ["account"],
  },

  // ── Technology Resilience & BC/DR ─────────────────────────────────────────
  {
    id: "x-resilience-metric",
    query:
      "What is our RTO and RPO attainment, the share of critical services with tested DR, and our DR test pass rate against recovery objectives?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    mustInclude: ["rto"],
  },
  {
    id: "x-resilience-aiuc",
    query:
      "Can AI-orchestrated DR runbooks and recovery validation, plus AI dependency and concentration-risk mapping, improve our failover and resilience testing?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    mustInclude: ["dr"],
  },
  {
    id: "x-resilience-pain",
    query:
      "Our DR plans are untested, we have a single-vendor concentration blind spot, and recovery theater means recovery is not resilience. How do we build real operational resilience and continuity?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    mustInclude: ["dr"],
  },
  {
    id: "x-resilience-vendor",
    query:
      "How should we evaluate a BCM and DR resilience-management platform, DR orchestration with failover automation, and immutable-storage backup tooling for business continuity?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    mustInclude: ["dr"],
  },
  {
    id: "x-resilience-diag",
    query:
      "Run a maturity diagnostic on our business continuity and disaster recovery: how well do we measure time to failover, and is recoverability drifting as the estate changes?",
    expectedExpertId: "xp.x.technology-resilience-bcdr",
    mustInclude: ["failover"],
  },

  // ── Data Governance & MDM ─────────────────────────────────────────────────
  {
    id: "x-datagov-metric",
    query:
      "What is our data quality score by critical data element, the golden-record match rate in MDM, the duplicate rate in master data, and our data-catalog coverage?",
    expectedExpertId: "xp.x.data-governance-mdm",
    mustInclude: ["golden-record"],
  },
  {
    id: "x-datagov-aiuc",
    query:
      "Can AI-assisted entity resolution for match and merge, plus AI catalog and metadata enrichment, improve our golden-record master-data stewardship and data-quality rules?",
    expectedExpertId: "xp.x.data-governance-mdm",
    mustInclude: ["match"],
  },
  {
    id: "x-datagov-pain",
    query:
      "Our data governance is a committee not an operating model, MDM dies in the match/merge survivorship and stewardship workflow, and the catalog is shelfware. How do we make master-data governance real?",
    expectedExpertId: "xp.x.data-governance-mdm",
    mustInclude: ["master"],
  },
  {
    id: "x-datagov-vendor",
    query:
      "How should we evaluate an MDM hub for entity-mastering, a data catalog with metadata management, and data-quality profiling tooling to assign critical-data-element owners and stewards?",
    expectedExpertId: "xp.x.data-governance-mdm",
    mustInclude: ["catalog"],
  },
  {
    id: "x-datagov-diag",
    query:
      "Assess the maturity of our master-data management and stewardship: what is the ROI of fixing golden-record match rates, and which critical data elements still lack an assigned data steward or owner?",
    expectedExpertId: "xp.x.data-governance-mdm",
    mustInclude: ["golden-record"],
  },

  // ── Data Privacy & Protection ─────────────────────────────────────────────
  {
    id: "x-privacy-metric",
    query:
      "What is our DSAR cycle time and SLA attainment, our consent capture and opt-out honor rate, and the share of systems mapped in our RoPA data map?",
    expectedExpertId: "xp.x.data-privacy-protection",
    mustInclude: ["dsar"],
  },
  {
    id: "x-privacy-aiuc",
    query:
      "Can automated DSAR discovery and fulfillment, plus AI PII discovery and classification, help us honor consent and opt-out across a fragmented estate under GDPR and CCPA?",
    expectedExpertId: "xp.x.data-privacy-protection",
    mustInclude: ["dsar"],
  },
  {
    id: "x-privacy-pain",
    query:
      "We are compliant on paper with no provable data map, DSAR at scale across a fragmented estate is breaking, and consent and preference enforcement leaks downstream. How do we close the privacy gap?",
    expectedExpertId: "xp.x.data-privacy-protection",
    mustInclude: ["dsar"],
  },
  {
    id: "x-privacy-vendor",
    query:
      "How should we evaluate a privacy-management DSAR and RoPA platform, a consent and preference management platform, and PII discovery tooling for our data-protection program?",
    expectedExpertId: "xp.x.data-privacy-protection",
    mustInclude: ["consent"],
  },
  {
    id: "x-privacy-diag",
    query:
      "Run a maturity diagnostic on our data privacy program: how complete is PII discovery and classification coverage, and what is the ROI of automating DSAR fulfillment and RoPA upkeep?",
    expectedExpertId: "xp.x.data-privacy-protection",
    mustInclude: ["pii"],
  },
];
