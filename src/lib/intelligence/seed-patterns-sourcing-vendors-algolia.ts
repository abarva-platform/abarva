import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const ALGOLIA_SOURCE_BASIS = {
  aiSearch: {
    type: 'public-disclosure',
    label: 'Algolia AI Search',
    url: 'https://www.algolia.com/products/ai-search',
    asOf: SOURCE_AS_OF,
  },
  neuralSearch: {
    type: 'public-disclosure',
    label: 'Algolia NeuralSearch documentation',
    url: 'https://www.algolia.com/doc/guides/ai-relevance/neuralsearch/get-started',
    asOf: SOURCE_AS_OF,
  },
  recommendations: {
    type: 'public-disclosure',
    label: 'Algolia AI Recommendations',
    url: 'https://www.algolia.com/products/ai-recommendations',
    asOf: SOURCE_AS_OF,
  },
  recommendApi: {
    type: 'public-disclosure',
    label: 'Algolia Recommend API documentation',
    url: 'https://www.algolia.com/doc/rest-api/recommend',
    asOf: SOURCE_AS_OF,
  },
  events: {
    type: 'public-disclosure',
    label: 'Algolia click and conversion events documentation',
    url: 'https://www.algolia.com/doc/guides/sending-events/getting-started',
    asOf: SOURCE_AS_OF,
  },
  pricing: {
    type: 'public-disclosure',
    label: 'Algolia pricing',
    url: 'https://www.algolia.com/pricing',
    asOf: SOURCE_AS_OF,
  },
  securityBestPractices: {
    type: 'public-disclosure',
    label: 'Algolia security best practices',
    url: 'https://www.algolia.com/doc/guides/security/security-best-practices',
    asOf: SOURCE_AS_OF,
  },
  sharedResponsibility: {
    type: 'public-disclosure',
    label: 'Algolia shared responsibility documentation',
    url: 'https://www.algolia.com/doc/guides/security/security-best-practices/in-depth/shared-responsibility',
    asOf: SOURCE_AS_OF,
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Algolia Data Processing Addendum',
    url: 'https://www.algolia.com/policies/data-processing-addendum',
    asOf: SOURCE_AS_OF,
  },
  subprocessors: {
    type: 'public-disclosure',
    label: 'Algolia infrastructure and sub-processors',
    url: 'https://www.algolia.com/policies/infrastructure-and-sub-processors',
    asOf: SOURCE_AS_OF,
  },
  terms: {
    type: 'public-disclosure',
    label: 'Algolia Terms of Service',
    url: 'https://www.algolia.com/policies/terms',
    asOf: SOURCE_AS_OF,
  },
  productTerms: {
    type: 'public-disclosure',
    label: 'Algolia Product Specific Terms',
    url: 'https://www.algolia.com/policies/product-specific-terms',
    asOf: SOURCE_AS_OF,
  },
  sla: {
    type: 'public-disclosure',
    label: 'Algolia Service Level Agreement',
    url: 'https://www.algolia.com/policies/sla',
    asOf: SOURCE_AS_OF,
  },
} satisfies Record<string, SourceBasisRef>;

const ALGOLIA_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Algolia quote, order form, traffic baseline, records export, event instrumentation, security review, support scope, and renewal evidence',
  asOf: SOURCE_AS_OF,
  note:
    'Public Algolia materials describe product scope, public plan mechanics, API and event requirements, legal terms, AI-specific terms, SLA structure, and security responsibilities, but do not establish buyer-specific net price, private discounts, committed usage, annual contract terms, relevance lift, conversion impact, support concessions, implementation effort, or negotiated remedies.',
};

export const PAT_SRC_VEN_ALGOLIA_001: PatternSeed = {
  id: 'PAT-SRC-VEN-ALGOLIA-001',
  slug: 'algolia-ai-search-discovery-platform-sourcing-profile',
  title: 'Algolia AI Search and Discovery Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Algolia sourcing should treat the platform as a customer-facing search, discovery, recommendations, AI relevance, event-data, API-security, and uptime dependency decision rather than a narrow site-search widget or developer API renewal.',
  applicability:
    'Apply when sourcing, renewing, expanding, benchmarking, or replacing Algolia for site search, ecommerce search, marketplace discovery, content search, mobile search, autocomplete, browse, personalization, AI Search, NeuralSearch, Recommend, AI Recommendations, Generative Experiences, Ask AI, Agent Studio, search analytics, merchandising, or headless digital-experience programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(ALGOLIA_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'CCPA-if-consumer-profile-or-behavioral-data',
    'PCI-DSS-review-if-commerce-events-touch-cardholder-context',
    'DORA-if-regulated-financial-entity',
    'AI-governance-if-NeuralSearch-Generative-Experiences-or-Agent-Studio-enabled',
    'customer-facing-availability-critical-control',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-CDP-001', 'PAT-SRC-PRC-SAAS-001', 'PAT-CDP-007'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Algolia',
      tier: 'enterprise',
      positioning:
        'API-first search and discovery platform spanning keyword search, AI Search, NeuralSearch, personalization, recommendations, merchandising controls, analytics, browse, crawler, integrations, and newer generative or agentic search experiences for digital products and commerce journeys.',
      strengths: [
        'Official materials position Algolia around hybrid keyword and semantic search, relevance controls, personalization, analytics, A/B testing, merchandising, Crawler, integrations, and API-first deployment across ecommerce, SaaS, media, marketplaces, mobile, finance, and enterprise use cases',
        'Public NeuralSearch documentation describes hybrid keyword and vector search and identifies event prerequisites that should become sourcing evidence, not post-award assumptions',
        'Public pricing pages disclose plan families, request and record concepts, included free-tier dimensions, Grow and Grow Plus usage pricing, Elevate annual-contract positioning, hosting-location differences, support availability, and enterprise-scale controls',
        'Public legal, DPA, subprocessor, shared-responsibility, security, product-specific AI, and SLA materials create a useful diligence map for privacy, AI training, API-key governance, service credits, support, and exit review',
      ],
      cautions: [
        'Public plan pages do not prove buyer-specific net price, discount, annual commitment, usage buffer, renewal cap, support response, migration services, marketplace economics, or relevance-improvement value',
        'Cost exposure can move with search requests, records, replicas or pre-sorts, Recommend requests, crawls, guides, support, enterprise add-ons, hosting choices, and AI feature adoption unless each meter is normalized',
        'NeuralSearch, recommendations, personalization, analytics, AI experiences, and Agent Studio depend on event collection, user tokens, catalog quality, governance, and data rights that the buyer must prove before counting conversion or productivity gains',
        'Search, browse, and recommendation paths are customer-facing dependencies; standard service credits may not match revenue, customer-experience, or regulatory impact if the service becomes critical to checkout, support, or account-servicing journeys',
      ],
      sourceBasis: [
        ALGOLIA_SOURCE_BASIS.aiSearch,
        ALGOLIA_SOURCE_BASIS.neuralSearch,
        ALGOLIA_SOURCE_BASIS.recommendations,
        ALGOLIA_SOURCE_BASIS.pricing,
        ALGOLIA_SOURCE_BASIS.sla,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Official Algolia plan and usage-meter orientation only',
      model: 'hybrid',
      metric:
        'Plan family, search requests, records, Recommend requests, crawls, guides, AI feature access, hosting locations, application and index limits, support, professional services, and annual-contract Elevate scope disclosed in public Algolia pricing materials',
      sourceBasis: [ALGOLIA_SOURCE_BASIS.pricing, ALGOLIA_BUYER_DATA_GAP],
      confidence: 0.72,
      notes:
        'Use public Algolia pricing as a meter map and plan-scope checklist. Public pages identify Build, Grow, Grow Plus, and Elevate constructs, included free-tier amounts, published overage mechanics for some self-serve dimensions, and annual-contract positioning for Elevate, but sourcing decisions should not infer enterprise net price, volume discount, committed-spend economics, support concession, renewal uplift, or AI-search ROI without approved buyer quotes, order forms, usage exports, invoices, and test results.',
    },
    {
      label: 'Founder data gap - Algolia commercial and value evidence required',
      model: 'unknown',
      sourceBasis: [ALGOLIA_BUYER_DATA_GAP],
      confidence: 0.16,
      notes:
        'No replacement recommendation, consolidation savings case, conversion-lift claim, search-relevance ROI, or renewal-risk score should be made from public materials alone. Require buyer traffic, current search logs, catalog size, index and replica design, event coverage, quote, order form, renewal history, support evidence, and finalist benchmark evidence.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Usage-meter, index, and feature-scope exhibit',
      buyerPosition:
        'Attach a schedule that separates applications, indices, replicas or pre-sorts, records, search requests, Recommend requests, crawls, guides, NeuralSearch, personalization, analytics retention, merchandising, Crawler, Agent Studio, Generative Experiences, Ask AI, hosting locations, support tier, professional services, and every usage dimension expected to affect spend.',
      fallbackPosition:
        'If final traffic and catalog design are not known before award, split committed production scope from optional expansion and require monthly usage exports, threshold alerts, quote refresh, and written approval before enabling new AI or recommendations workloads.',
      walkawayTriggers: [
        'No auditable bridge between proposed Algolia plan, buyer traffic, catalog size, index design, event instrumentation, AI features, and billable units',
        'Commercial case depends on conversion lift, tool retirement, or merchandising gains without a buyer-authored test plan and acceptance criteria',
      ],
      sourceBasis: [ALGOLIA_SOURCE_BASIS.pricing, ALGOLIA_SOURCE_BASIS.neuralSearch, ALGOLIA_SOURCE_BASIS.events],
    },
    {
      clauseArea: 'AI, event data, and model-training governance',
      buyerPosition:
        'Document which AI Search, NeuralSearch, recommendations, Generative Experiences, Ask AI, or Agent Studio features are enabled; what catalog, query, click, conversion, user-token, prompt, output, memory, and behavioral data is processed; whether NeuralSearch training opt-out is required; and who approves event collection, user notices, high-risk-use exclusions, and human review.',
      fallbackPosition:
        'Where AI governance is not closed, restrict production scope to non-generative keyword search or controlled test indices until legal, privacy, security, data, and business owners approve the intended use and data flow.',
      sourceBasis: [
        ALGOLIA_SOURCE_BASIS.productTerms,
        ALGOLIA_SOURCE_BASIS.neuralSearch,
        ALGOLIA_SOURCE_BASIS.events,
        ALGOLIA_SOURCE_BASIS.dpa,
        ALGOLIA_SOURCE_BASIS.subprocessors,
      ],
    },
    {
      clauseArea: 'API-key security, access control, and shared responsibility',
      buyerPosition:
        'Require production use of least-privilege search or secured API keys, no admin or write-access keys in frontend or mobile clients, environment-controlled server keys, key rotation, separate development and production applications or keys, team-access review, 2FA, index-name and metadata sensitivity review, and incident-response procedures for exposed credentials.',
      fallbackPosition:
        'If application teams cannot meet the API-key control model, delay public launch or route access through a backend token service with scoped, expiring keys and monitoring.',
      sourceBasis: [ALGOLIA_SOURCE_BASIS.securityBestPractices, ALGOLIA_SOURCE_BASIS.sharedResponsibility],
    },
    {
      clauseArea: 'Availability, service credits, support, and customer-facing continuity',
      buyerPosition:
        'Map SLA plan, covered hosted search and recommend services, API-client eligibility, outage definition, service-credit cap, support tier, incident communications, fallback search behavior, cache behavior, checkout or support dependencies, status monitoring, and exit or transition obligations to each customer-facing journey that relies on Algolia.',
      fallbackPosition:
        'If standard service credits are the only remedy, require operational runbooks, escalation contacts, degraded-mode search behavior, data export, and transition assistance for revenue-critical or regulated journeys.',
      sourceBasis: [ALGOLIA_SOURCE_BASIS.sla, ALGOLIA_SOURCE_BASIS.terms, ALGOLIA_SOURCE_BASIS.recommendApi],
    },
    {
      clauseArea: 'Data processing, subprocessors, retention, and deletion',
      buyerPosition:
        'Close DPA path, controller and processor roles, categories of Subscriber Data and Subscriber Personal Data, special-category-data prohibition or approval, subprocessor notice and objection process, international-transfer mechanism, retention and deletion after termination, data subject request support, region expectations, and AI-service subprocessor scope before production activation.',
      fallbackPosition:
        'If regulated or special-category data may enter search records, queries, events, prompts, logs, or recommendations, make privacy and security approval a hard pre-production gate with documented data minimization and deletion controls.',
      sourceBasis: [ALGOLIA_SOURCE_BASIS.dpa, ALGOLIA_SOURCE_BASIS.subprocessors, ALGOLIA_SOURCE_BASIS.securityBestPractices],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Normalize traffic, records, and AI feature activation before BAFO',
      whenToUse:
        'Use when Algolia is an incumbent renewal, migration target, or finalist for ecommerce, marketplace, content, SaaS, mobile, or enterprise search and discovery.',
      buyerAsk:
        'Require a baseline workbook covering monthly search requests, search-as-you-type behavior, federated search, records, replicas, pre-sorts, Recommend requests, crawls, guides, event volume, analytics retention, support, hosting locations, and every planned AI feature, then price committed, optional, burst, and future-state scope separately.',
      vendorGive:
        'Vendor may offer annual commitment, volume discount, enterprise plan scope, support plan, professional services, AI-feature packaging, or phased rollout. Treat each give as provisional until tied to usage baseline, order-form language, acceptance gates, and renewal treatment.',
      tradeoffs: [
        'A richer Algolia deployment can improve discovery and reduce merchandising workload, but usage variance and AI feature expansion can outgrow the original business case if not metered and governed.',
      ],
      evidenceBasis: [ALGOLIA_SOURCE_BASIS.pricing, ALGOLIA_SOURCE_BASIS.aiSearch, ALGOLIA_BUYER_DATA_GAP],
    },
    {
      lever: 'Turn relevance and conversion claims into buyer-authored tests',
      whenToUse:
        'Use when the value case depends on NeuralSearch, AI Ranking, personalization, recommendations, merchandising, fewer zero-result searches, faster search, higher conversion, higher average order value, or better support deflection.',
      buyerAsk:
        'Run representative queries, no-results scenarios, typo and synonym cases, long-tail queries, category browse journeys, personalized journeys, recommendation placements, business-rule tests, latency checks, and analytics review against buyer data before award; make production rollout conditional on acceptance criteria.',
      tradeoffs: [
        'Public product claims are useful for shortlist design, but the buyer can only bank value after proving relevance, event coverage, catalog quality, operational ownership, and measurable KPI movement on its own traffic.',
      ],
      evidenceBasis: [
        ALGOLIA_SOURCE_BASIS.aiSearch,
        ALGOLIA_SOURCE_BASIS.neuralSearch,
        ALGOLIA_SOURCE_BASIS.recommendations,
        ALGOLIA_SOURCE_BASIS.events,
        ALGOLIA_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'Trade customer-facing reliance for stronger operational commitments',
      whenToUse:
        'Use when Algolia powers revenue-critical ecommerce search, account-servicing search, marketplace discovery, regulated customer journeys, or support knowledge retrieval.',
      buyerAsk:
        'Require a support and continuity package that maps SLA plan, API-client eligibility, escalation, status communication, monitoring, fallback search, cache or static-result behavior, data export, and transition assistance to the buyer journey impact.',
      evidenceBasis: [ALGOLIA_SOURCE_BASIS.sla, ALGOLIA_SOURCE_BASIS.terms, ALGOLIA_SOURCE_BASIS.recommendApi],
    },
  ],
  riskFactors: [
    {
      id: 'algolia-usage-and-ai-feature-sprawl',
      label: 'Search usage, records, recommendations, and AI-feature sprawl',
      severity: 'high',
      detectionSignals: [
        'Proposal references AI Search, NeuralSearch, Recommend, personalization, guides, crawler, or merchandising expansion without a traffic, records, event, index, and feature-scope workbook',
        'Search-as-you-type, federated search, replicas, pre-sorts, and category browse behavior are not modeled against public request and record definitions',
      ],
      mitigations: ['Build a usage baseline workbook', 'Separate committed scope from optional AI expansion', 'Require monthly usage exports and alert thresholds', 'Tie new features to approval gates'],
      contractualRemedies: ['Usage reporting exhibit', 'Expansion quote refresh', 'Renewal baseline schedule', 'Downsize and feature-substitution rights'],
      sourceBasis: [ALGOLIA_SOURCE_BASIS.pricing, ALGOLIA_SOURCE_BASIS.events, ALGOLIA_SOURCE_BASIS.neuralSearch],
    },
    {
      id: 'algolia-api-key-and-index-data-exposure',
      label: 'API-key, index, and sensitive-search-data exposure',
      severity: 'high',
      detectionSignals: [
        'Admin or write-access keys appear in frontend, mobile, repository, CI, documentation, or third-party tooling',
        'Sensitive data appears in index names, metadata, query logs, records, user tokens, or unrestricted attributes without minimization and access controls',
      ],
      mitigations: ['Use least-privilege and secured API keys', 'Rotate keys and separate environments', 'Review sensitive attributes and metadata', 'Enforce 2FA and team access hygiene'],
      contractualRemedies: ['Security-control schedule', 'Incident notification and cooperation', 'Data minimization exhibit', 'Credential rotation runbook'],
      sourceBasis: [ALGOLIA_SOURCE_BASIS.securityBestPractices, ALGOLIA_SOURCE_BASIS.sharedResponsibility, ALGOLIA_SOURCE_BASIS.dpa],
    },
    {
      id: 'algolia-ai-data-governance-gap',
      label: 'AI search, generative, and event-data governance gap',
      severity: 'medium',
      detectionSignals: [
        'NeuralSearch or recommendations are enabled before event consent, user-token design, catalog rights, model-training opt-out posture, and AI-feature responsibilities are reviewed',
        'Generative Experiences or Agent Studio are treated as ordinary search features without prompt, output, memory, human-review, and high-risk-use controls',
      ],
      mitigations: ['Run AI intended-use review', 'Document event and user-token data flows', 'Confirm NeuralSearch training opt-out posture', 'Require human review and user disclosure where applicable'],
      contractualRemedies: ['AI feature activation gate', 'Data-use exhibit', 'Subprocessor review', 'Output disclaimer and human-review requirements'],
      sourceBasis: [ALGOLIA_SOURCE_BASIS.productTerms, ALGOLIA_SOURCE_BASIS.neuralSearch, ALGOLIA_SOURCE_BASIS.events, ALGOLIA_SOURCE_BASIS.subprocessors],
    },
    {
      id: 'algolia-customer-facing-continuity-mismatch',
      label: 'Customer-facing continuity and service-credit mismatch',
      severity: 'medium',
      detectionSignals: [
        'Algolia powers checkout, account search, support deflection, or marketplace discovery but the deal file relies only on standard SLA language and future service credits',
        'API-client version eligibility, usage-limit exclusions, fallback behavior, and status communication are not assigned to an owner',
      ],
      mitigations: ['Map customer journeys to SLA and support terms', 'Build degraded-mode search runbooks', 'Monitor API-client eligibility', 'Test export and transition paths'],
      contractualRemedies: ['Enhanced support schedule', 'Incident communication commitments', 'Fallback and transition plan', 'Export assistance'],
      sourceBasis: [ALGOLIA_SOURCE_BASIS.sla, ALGOLIA_SOURCE_BASIS.terms, ALGOLIA_SOURCE_BASIS.recommendApi],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Treat Algolia as a revenue-path dependency when it supports ecommerce search, category browse, recommendations, merchandising, personalization, or product discovery; require conversion, zero-results, latency, event-coverage, inventory-filtering, promotion, and fallback-search evidence before relying on uplift claims.',
      regulatoryRefs: ['PCI DSS review if search events, logs, or integrations touch payment-adjacent context', 'consumer privacy laws where behavioral personalization or user tokens are used'],
      additionalRequirements: ['Commerce event instrumentation review', 'Promotion and merchandising acceptance test', 'Peak traffic and fallback plan'],
    },
    {
      industry: 'financial_services',
      modifier:
        'When Algolia supports authenticated account search, financial-product discovery, advisor portals, support knowledge retrieval, or regulated customer journeys, treat it as a potential ICT third-party and require operational resilience, data-minimization, access-control, AI-use, and exit evidence.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'GDPR or local privacy laws where query, click, conversion, or profile data includes personal data'],
      additionalRequirements: ['Criticality assessment', 'Regulated-data search and log review', 'Exit and degraded-mode runbook'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Avoid assuming search records, queries, events, or AI outputs are safe for PHI or patient-adjacent data; require legal, privacy, security, and clinical owner approval before Algolia indexes regulated health content or captures identifiable behavioral events.',
      regulatoryRefs: ['HIPAA review if PHI could enter records, queries, logs, events, prompts, or support workflows'],
      additionalRequirements: ['PHI boundary review', 'Data minimization and retention plan', 'Subprocessor and support-access review'],
    },
    {
      industry: 'public_sector',
      modifier:
        'For citizen services, public web search, knowledge-base search, or agency portals, confirm procurement vehicle, accessibility, data residency, subprocessors, security evidence, API-key control, support path, and incident communication before treating Algolia as production infrastructure.',
      additionalRequirements: ['Public-sector security evidence review', 'Citizen-data processing review', 'Accessibility and continuity testing'],
    },
  ],
  body: `## Summary
Algolia should be sourced as a customer-facing AI search and discovery platform, not as a small site-search widget. Public Algolia materials position the platform around API-first search, AI Search, hybrid keyword and semantic retrieval, NeuralSearch, personalization, AI Recommendations, browse, merchandising, analytics, A/B testing, Crawler, integrations, and newer generative or agentic experiences. That breadth can be valuable for ecommerce, marketplaces, SaaS, media, mobile apps, support knowledge bases, and enterprise portals, but it also means the sourcing file has to connect product claims to buyer traffic, catalog shape, event coverage, data rights, commercial meters, security controls, and customer-journey criticality.

## When to apply
Use this pattern when Algolia is an incumbent, finalist, benchmark, replacement candidate, or expansion platform for site search, product discovery, content search, autocomplete, browse, recommendations, personalization, merchandising, AI relevance, or agentic retrieval. The pattern is strongest when the sponsor wants to move from keyword search into NeuralSearch, AI Ranking, recommendations, real-time personalization, Generative Experiences, Ask AI, or Agent Studio. It does not decide that Algolia is the right technical answer. It makes the buying process decision-grade by forcing public product scope, buyer data, usage economics, implementation realities, and legal terms into one evidence record.

## Evidence to collect
Start with the search estate. Inventory applications, indices, replicas, pre-sorts, records, record size, search requests, autocomplete behavior, federated search, category browse, crawler usage, Recommend requests, guides, analytics retention, conversion events, user tokens, API clients, hosting locations, support tier, current incidents, current vendor or native search costs, and business-owner priorities. Then collect qualitative search evidence: top queries, zero-result queries, typo and synonym failures, product availability filters, ranking rules, merchandising campaigns, content freshness, personalization expectations, latency expectations, mobile behavior, and fallback behavior if hosted search is unavailable. For AI features, document which data trains or powers the feature, which users are affected, whether opt-out controls are needed, what notices or consents apply, and who reviews generated or agentic output.

## Commercial posture
Public Algolia pricing is useful as a plan and meter map, not as enterprise economics. The pricing page distinguishes plan families, search requests, records, Recommend requests, crawls, guides, hosting locations, support options, and an Elevate annual-contract path with additional AI and enterprise capabilities. Those public facts should drive a BAFO workbook that separates committed production scope from optional expansion. Do not infer net price, discount, renewal uplift, committed-use value, support concessions, or conversion uplift from public pages. Require buyer traffic exports, catalog counts, index design, quotes, order forms, invoices, and renewal history. If a proposal counts revenue lift, reduced support cost, or retired-tool savings, require a buyer-authored test plan before booking value.

## Evaluation design
A useful Algolia event is scenario-based. Ask Algolia and any alternatives to run the same representative query set, category browse paths, no-results cases, typo cases, synonym cases, ranking-rule examples, personalization scenarios, recommendation placements, and high-traffic latency tests against buyer-like data. Score not only relevance, but also explainability, merchandising control, analytics visibility, event collection burden, API-client maturity, governance, security operations, exportability, and cost traceability. NeuralSearch documentation makes event quality a sourcing fact because hybrid and AI relevance depends on behavioral signals. Recommendations similarly depend on trained models and interaction data. A low implementation quote is not enough if the buyer cannot send reliable click and conversion events, maintain catalog quality, or govern user tokens.

## Contract and data controls
Algolia processes Subscriber Data through a SaaS model and its public DPA, subprocessor list, product-specific AI terms, security guidance, shared-responsibility documentation, terms, and SLA should all be mapped to the purchased services. The buyer should close controller and processor roles, personal-data categories, special-category-data boundaries, region and retention expectations, subprocessor notice and objection rights, termination deletion, data subject request support, support access, and transfer mechanisms. Product-specific AI terms deserve separate review: NeuralSearch training, generative AI input and output, Agent Studio actions, memory-based personalization, and third-party AI subprocessors are not the same risk surface as ordinary keyword search.

## Security and operational reliance
Algolia security guidance makes API-key governance a core sourcing artifact. Public search keys, secured keys, admin keys, write keys, mobile clients, frontend code, CI secrets, referrer restrictions, team access, 2FA, and key rotation should be explicitly assigned. The search experience may be public, but admin and write capabilities are not harmless. If Algolia powers checkout search, product discovery, account servicing, customer support, or regulated portal search, the service is also an availability dependency. The SLA and terms should be mapped to the buyer journey, including API-client eligibility, service-credit limits, usage-limit exclusions, status monitoring, fallback search, cache behavior, escalation, export, and transition assistance.

## Negotiation focus
The strongest ask is a scope-normalized package: named applications and indices, committed records and requests, AI feature list, Recommend and Crawler scope, event instrumentation, analytics retention, support tier, hosting locations, professional services, usage reports, threshold alerts, renewal baseline, expansion pricing, and downside protection. If Algolia is replacing internal search or another vendor, make migration acceptance concrete: relevance parity, latency, analytics, merchandising controls, event coverage, security review, data deletion, and rollback. If Algolia is expanding into AI discovery, make opt-out, data-use, user notice, human review, and subprocessor review part of the award criteria.

## Pitfalls
The first failure mode is buying an AI search story while leaving records, requests, events, and replicas unmodeled. The second is assuming public pricing equals buyer economics. The third is enabling personalization, recommendations, generative experiences, or agentic tools before privacy, security, and AI-governance owners approve the data flow. The fourth is treating service credits as sufficient for a revenue-critical search path. Use public Algolia sources to structure diligence, then use buyer telemetry, catalog exports, quotes, order forms, legal review, proof-of-concept results, and operational runbooks for the final sourcing recommendation.`,
};
