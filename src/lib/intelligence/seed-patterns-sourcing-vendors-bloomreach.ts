import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const BLOOMREACH_SOURCE_BASIS = {
  discoveryOverview: {
    type: 'public-disclosure',
    label: 'Bloomreach Discovery documentation overview',
    url: 'https://documentation.bloomreach.com/discovery/docs/bloomreach-discovery',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach describes Discovery as a SaaS product discovery platform for digital search experiences, with search and merchandising, recommendations and pathways, SEO, insights, and analytics.',
  },
  searchIntelligence: {
    type: 'public-disclosure',
    label: 'Bloomreach ecommerce search intelligence product page',
    url: 'https://www.bloomreach.com/en/products/ecommerce-search/search-intelligence',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach positions search intelligence around AI-powered search, behavioral and one-to-one personalization, merchandising control, conversational shopping, AI Studio, smart categories, and recommendations.',
  },
  discoveryIntegration: {
    type: 'public-disclosure',
    label: 'Bloomreach Discovery integration guide',
    url: 'https://documentation.bloomreach.com/discovery/docs/getting-started',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach documents Discovery implementation phases covering technical plan, product instance provisioning, catalog connection, search configuration, APIs, event tracking, tuning, testing, and launch.',
  },
  discoveryApiGuardrails: {
    type: 'public-disclosure',
    label: 'Bloomreach Discovery API guardrails for system reliability',
    url: 'https://documentation.bloomreach.com/discovery/reference/api-rate-limits',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach documents Discovery circuit breakers, customer-specific Search and Category API limits, cache behavior, 429 handling in rare cases, notification, support coordination, and promotional-event planning.',
  },
  catalogApiRateLimits: {
    type: 'public-disclosure',
    label: 'Bloomreach Catalog management API rate limits',
    url: 'https://documentation.bloomreach.com/discovery/reference/catalog-data-management-api-rate-limits',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach documents catalog API rate limits, 429 and Retry-After behavior, endpoint-specific limits, full-feed upload guidance, patch limits, support escalation, and account-basis limit considerations.',
  },
  engagementOverview: {
    type: 'public-disclosure',
    label: 'Bloomreach Engagement documentation overview',
    url: 'https://documentation.bloomreach.com/engagement/',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach Engagement documentation describes tooling for data and assets, analytics, segmentation, campaigns, experiments, personalization, developer guides, APIs, consent, PII management, and security/privacy resources.',
  },
  engagementTechnicalOverview: {
    type: 'public-disclosure',
    label: 'Bloomreach Engagement technical overview',
    url: 'https://documentation.bloomreach.com/engagement/docs/technical-overview',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach describes Engagement as a customer data and experience platform with channel automation, lifecycle intelligence, predictive analytics, recommendations, SaaS hosting on Google Cloud Platform, account and project structure, and customer-level data models.',
  },
  pricing: {
    type: 'public-disclosure',
    label: 'Bloomreach request pricing page',
    url: 'https://www.bloomreach.com/en/pricing',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach public pricing page routes buyers through request-pricing and sales/support contact posture, describes annual billing, usage overage treatment, module add-on paths, and implementation/support resources without publishing universal list prices.',
  },
  security: {
    type: 'public-disclosure',
    label: 'Security at Bloomreach',
    url: 'https://www.bloomreach.com/en/security-at-bloomreach',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach states that it uses security-at-design, encryption at rest and in transit, authorized-role access, privacy-by-design, a DPO, certifications including SOC 2 Type II and ISO accreditations, third-party pentests, and Trust Portal access for reports.',
  },
  engagementSecurity: {
    type: 'public-disclosure',
    label: 'Bloomreach Engagement security documentation',
    url: 'https://documentation.bloomreach.com/engagement/docs/security-commitment',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach Engagement security documentation covers security culture, secure development practices, SOC 2 report access under NDA, security operations, DPO role, and client data protection controls.',
  },
  engagementSecurityArchitecture: {
    type: 'public-disclosure',
    label: 'Bloomreach Engagement security architecture',
    url: 'https://documentation.bloomreach.com/engagement/docs/security-architecture',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach Engagement architecture documentation describes GCP hosting, encryption at rest and in transit, multi-tenant and other instance types, and high-availability/resilience concepts.',
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Bloomreach Data Processing Agreement',
    url: 'https://www.bloomreach.com/en/legal/DPA',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach DPA covers authorized subprocessors, security measures, confidentiality, incident notification, updates to security measures, customer responsibilities, audit questionnaire responses, international transfers, and SCC posture.',
  },
  subprocessors: {
    type: 'public-disclosure',
    label: 'Bloomreach subprocessors list',
    url: 'https://www.bloomreach.com/en/legal/subprocessors',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach publishes a legal subprocessor list referenced by the DPA for customer review and objection workflows.',
  },
  status: {
    type: 'public-disclosure',
    label: 'Bloomreach status page',
    url: 'https://status.bloomreach.com/',
    asOf: SOURCE_AS_OF,
    note: 'Bloomreach maintains a public status page for service health review; buyers should still map any status-page component evidence to contracted products and SLAs.',
  },
} satisfies Record<string, SourceBasisRef>;

const BLOOMREACH_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Bloomreach contract, quote, usage, catalog, event, privacy, SLA, integration, and performance evidence required',
  asOf: SOURCE_AS_OF,
  note:
    'Public Bloomreach sources identify product scope, implementation phases, security posture, DPA terms, support orientation, public pricing posture, API guardrails, and status resources, but do not establish buyer-specific net price, discount, usage allowance, overage price, negotiated SLA, implementation effort, managed services scope, catalog quality, traffic profile, data residency acceptance, or performance lift.',
};

export const PAT_SRC_VEN_BLOOMREACH_001: PatternSeed = {
  id: 'PAT-SRC-VEN-BLOOMREACH-001',
  slug: 'bloomreach-commerce-search-personalization-sourcing-profile',
  title: 'Bloomreach Commerce Search and Personalization Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'retail-cpg',
  thesis:
    'Bloomreach sourcing should treat commerce search, merchandising, recommendations, marketing automation, customer data, privacy, catalog quality, traffic reliability, and measurable conversion impact as one operating model rather than a standalone search widget purchase.',
  applicability:
    'Apply when sourcing, renewing, expanding, replacing, or benchmarking Bloomreach Discovery, Bloomreach Engagement, ecommerce search intelligence, merchandising, recommendations, customer data and experience workflows, personalization, AI-assisted commerce, catalog APIs, marketing automation, or retail digital-experience optimization programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-bloomreach',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(BLOOMREACH_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'CCPA-CPRA-if-California-consumer-data',
    'TCPA-and-CTIA-if-marketing-messaging',
    'PCI-DSS-adjacent-if-commerce-checkout-data-flows',
    'data-residency-review',
    'AI-governance-review',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-AGENT-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Bloomreach',
      tier: 'enterprise',
      positioning:
        'Commerce experience vendor spanning product discovery, ecommerce search, merchandising, recommendations, SEO, insights, analytics, marketing automation, customer data and experience platform workflows, personalization, AI-assisted commerce, APIs, and implementation/support resources.',
      strengths: [
        'Official Discovery documentation provides a concrete product baseline for AI-driven search, merchandising, recommendations, pathways, SEO, insights, analytics, integration phases, APIs, event tracking, tuning, testing, and launch readiness',
        'Official search intelligence materials show a commerce-specific personalization and merchandising control posture across behavioral signals, segment and one-to-one personalization, AI Studio, smart categories, product grids, conversational shopping, and recommendations',
        'Official Engagement documentation broadens the sourcing scope into customer data, identity, events, segmentation, analytics, campaigns, experiments, consent, PII management, APIs, and activation across digital touchpoints',
        'Official security, DPA, subprocessor, status, and API reliability materials give sourcing teams public evidence for privacy, security, audit, incident, reliability, support, and rate-limit diligence',
      ],
      cautions: [
        'Public product pages and request-pricing materials do not prove buyer-specific net price, included usage, overage rate, negotiated module bundle, implementation cost, managed services scope, SLA remedy, renewal cap, or performance guarantee',
        'Search and personalization outcomes depend on catalog quality, event instrumentation, historical behavioral data, merchandising governance, experiment design, ecommerce platform integration, and business acceptance criteria',
        'Engagement and Discovery may involve different data flows, customer identifiers, consent states, integrations, hosting assumptions, support workflows, and operational owners that must be reconciled before award',
        'AI and personalization claims should be tested against measurable buyer outcomes, privacy constraints, explainability needs, manual override rights, and fallback behavior during traffic spikes or catalog incidents',
      ],
      sourceBasis: [
        BLOOMREACH_SOURCE_BASIS.discoveryOverview,
        BLOOMREACH_SOURCE_BASIS.searchIntelligence,
        BLOOMREACH_SOURCE_BASIS.engagementOverview,
        BLOOMREACH_SOURCE_BASIS.engagementTechnicalOverview,
        BLOOMREACH_SOURCE_BASIS.security,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public Bloomreach pricing orientation only',
      model: 'subscription',
      metric:
        'Request-pricing posture; final economics depend on products/modules, contracted usage, overage terms, annual or longer commitment, support/services, implementation scope, catalog and traffic profile, channels, data volume, integrations, and negotiated order-form terms',
      sourceBasis: [BLOOMREACH_SOURCE_BASIS.pricing, BLOOMREACH_BUYER_DATA_GAP],
      confidence: 0.64,
      notes:
        'Bloomreach publicly describes request-pricing, annual billing, excess-usage handling, module add-on paths, support, documentation, onboarding, and implementation resources. Do not infer list price, discount, overage price, renewal uplift, services cost, SLA credit, or performance economics without buyer quote, order form, invoice, usage, and statement-of-work evidence.',
    },
    {
      label: 'Founder data gap - Bloomreach buyer commercial and performance evidence required',
      model: 'unknown',
      sourceBasis: [BLOOMREACH_BUYER_DATA_GAP],
      confidence: 0.18,
      notes:
        'No recommendation, ROI claim, renewal benchmark, module consolidation thesis, or search-performance uplift should be generated from public materials alone. Require buyer baseline metrics, A/B test plan, traffic profile, conversion economics, catalog quality evidence, and signed commercial terms.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Product, module, usage, and implementation scope exhibit',
      buyerPosition:
        'Attach a schedule naming purchased Bloomreach products and modules, contracted usage, overage treatment, commerce sites, brands, regions, channels, catalogs, environments, APIs, events, integrations, implementation milestones, launch criteria, support model, and owners.',
      fallbackPosition:
        'If final scope cannot be locked before signature, split committed launch scope from optional modules and require quote refresh, security review, data-flow approval, and acceptance testing before activation.',
      walkawayTriggers: [
        'Proposal cannot reconcile products, modules, usage allowances, overages, implementation duties, support path, data flows, and acceptance criteria to the order form',
        'Business case assumes personalization lift, AI impact, or merchandising productivity without buyer-owned baseline metrics and experiment design',
      ],
      sourceBasis: [
        BLOOMREACH_SOURCE_BASIS.discoveryOverview,
        BLOOMREACH_SOURCE_BASIS.discoveryIntegration,
        BLOOMREACH_SOURCE_BASIS.pricing,
        BLOOMREACH_BUYER_DATA_GAP,
      ],
    },
    {
      clauseArea: 'Catalog, event, API, and reliability governance',
      buyerPosition:
        'Document catalog feed cadence, full-feed and patch behavior, Search and Category API usage expectations, circuit-breaker planning, traffic-spike procedures, cache/fallback behavior, 429 handling, load-test approval, monitoring, support escalation, and status-page review.',
      fallbackPosition:
        'Where peak traffic or catalog update volume is uncertain, require a pre-launch reliability test, event instrumentation review, escalation runbook, and promotional-event notification process before production launch.',
      sourceBasis: [
        BLOOMREACH_SOURCE_BASIS.discoveryApiGuardrails,
        BLOOMREACH_SOURCE_BASIS.catalogApiRateLimits,
        BLOOMREACH_SOURCE_BASIS.status,
      ],
    },
    {
      clauseArea: 'Data protection, privacy, subprocessors, and audit evidence',
      buyerPosition:
        'Close DPA, subprocessor review, customer responsibility mapping, consent and PII governance, security questionnaire, audit report access, incident notification expectations, support-data handling, encryption posture, and international-transfer review before regulated customer data enters Bloomreach.',
      fallbackPosition:
        'If security evidence requires portal access or NDA, make evidence delivery and privacy signoff a pre-production gate with named owners, dates, and suspension rights for regulated processing.',
      sourceBasis: [
        BLOOMREACH_SOURCE_BASIS.security,
        BLOOMREACH_SOURCE_BASIS.engagementSecurity,
        BLOOMREACH_SOURCE_BASIS.engagementSecurityArchitecture,
        BLOOMREACH_SOURCE_BASIS.dpa,
        BLOOMREACH_SOURCE_BASIS.subprocessors,
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Tie commercial expansion to measurable commerce outcomes',
      whenToUse:
        'Use when Bloomreach Discovery, Engagement, AI Studio, recommendations, or personalization modules are proposed as a conversion or revenue lift program rather than a narrow tool replacement.',
      buyerAsk:
        'Require baseline search conversion, revenue per visitor, null-search, add-to-cart, recommendations, campaign, catalog-quality, and merchandising productivity metrics, then tie expansion gates to agreed experiments and launch acceptance criteria.',
      vendorGive:
        'Bloomreach may offer implementation support, documentation, education, business consulting, strategic experts, phased module adoption, and configuration-oriented launch resources. Accept these as value only when scope, owners, timelines, and acceptance evidence are written.',
      tradeoffs: [
        'Outcome gating can slow signature, but it avoids buying broad personalization scope before the buyer proves catalog, event, consent, merchandising, and measurement readiness.',
      ],
      evidenceBasis: [
        BLOOMREACH_SOURCE_BASIS.searchIntelligence,
        BLOOMREACH_SOURCE_BASIS.discoveryIntegration,
        BLOOMREACH_SOURCE_BASIS.pricing,
        BLOOMREACH_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'Separate Discovery search reliability from Engagement data activation',
      whenToUse:
        'Use when the sourcing event bundles site search, merchandising, recommendations, customer data, analytics, segmentation, campaign orchestration, and personalization into one commerce transformation.',
      buyerAsk:
        'Create separate acceptance gates for catalog/API reliability, search relevance, merchandising controls, event capture, customer profile identity, consent, PII governance, campaign activation, and analytics exports.',
      tradeoffs: [
        'Bundling can improve cross-channel personalization, but it can also obscure which product owns which data, which team operates it, and which module must meet each launch criterion.',
      ],
      evidenceBasis: [
        BLOOMREACH_SOURCE_BASIS.discoveryOverview,
        BLOOMREACH_SOURCE_BASIS.engagementTechnicalOverview,
        BLOOMREACH_SOURCE_BASIS.dpa,
      ],
    },
    {
      lever: 'Make API limits and peak-event planning part of the deal',
      whenToUse:
        'Use for high-traffic ecommerce, seasonal retail, promotional events, large catalogs, frequent catalog updates, or migration from an incumbent search platform.',
      buyerAsk:
        'Require documented usage allowances, catalog feed limits, Search and Category API threshold expectations, load-test coordination, promotion notification process, support escalation, and monitoring evidence before launch.',
      evidenceBasis: [BLOOMREACH_SOURCE_BASIS.discoveryApiGuardrails, BLOOMREACH_SOURCE_BASIS.catalogApiRateLimits],
    },
  ],
  riskFactors: [
    {
      id: 'bloomreach-personalization-lift-assumption-gap',
      label: 'Personalization lift assumed before measurement readiness',
      severity: 'high',
      detectionSignals: [
        'Business case cites AI, personalization, conversion, revenue per visitor, or merchandising productivity improvement without baseline metrics, A/B test design, and owner-approved success criteria',
        'Scope expands from search into Engagement, recommendations, campaigns, or customer data before event quality, consent, identity, and analytics ownership are validated',
      ],
      mitigations: ['Build baseline metric pack', 'Define experiment plan', 'Gate module expansion on data quality', 'Document merchandising and analytics owners'],
      contractualRemedies: ['Launch acceptance exhibit', 'Measurement plan', 'Phased module activation', 'Services milestone holdback where commercially available'],
      sourceBasis: [BLOOMREACH_SOURCE_BASIS.searchIntelligence, BLOOMREACH_SOURCE_BASIS.engagementTechnicalOverview, BLOOMREACH_BUYER_DATA_GAP],
    },
    {
      id: 'bloomreach-catalog-api-reliability-mismatch',
      label: 'Catalog and API reliability mismatch',
      severity: 'high',
      detectionSignals: [
        'Catalog update frequency, full-feed behavior, patch volume, API traffic, or promotional spike plan conflicts with documented guardrails or rate-limit guidance',
        'Sourcing record lacks 429 handling, retry strategy, support escalation, status-page review, or load-test approval for peak events',
      ],
      mitigations: ['Map catalog feed process', 'Validate API usage forecast', 'Coordinate load tests', 'Create promotion runbook', 'Implement retry and monitoring controls'],
      contractualRemedies: ['Reliability exhibit', 'Support escalation schedule', 'Traffic-event notification process', 'Launch-readiness gate'],
      sourceBasis: [BLOOMREACH_SOURCE_BASIS.discoveryApiGuardrails, BLOOMREACH_SOURCE_BASIS.catalogApiRateLimits, BLOOMREACH_SOURCE_BASIS.status],
    },
    {
      id: 'bloomreach-privacy-subprocessor-review-gap',
      label: 'Privacy and subprocessor review gap',
      severity: 'medium',
      detectionSignals: [
        'Customer profiles, events, campaigns, consent states, or behavioral personalization are approved without DPA, subprocessor, international-transfer, customer responsibility, and PII governance review',
      ],
      mitigations: ['Complete DPA review', 'Review subprocessors', 'Map PII and consent flows', 'Restrict production activation until security evidence is accepted'],
      contractualRemedies: ['DPA and subprocessor exhibit', 'Security-evidence gate', 'Incident-notification workflow', 'Regulated-data activation restriction'],
      sourceBasis: [BLOOMREACH_SOURCE_BASIS.dpa, BLOOMREACH_SOURCE_BASIS.subprocessors, BLOOMREACH_SOURCE_BASIS.security],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Treat Bloomreach as a commerce conversion, merchandising, catalog, customer-data, and campaign-activation platform. Require catalog readiness, traffic forecasts, promotional calendars, consent rules, ecommerce-platform integration, A/B testing, and revenue measurement before module expansion.',
      regulatoryRefs: ['GDPR if EU personal data is processed', 'CCPA/CPRA if California consumer data is processed', 'TCPA/CTIA if messaging channels are used'],
      additionalRequirements: ['Catalog-quality scorecard', 'Search and recommendations baseline', 'Promotion traffic plan', 'Consent and PII data-flow map'],
      affectedStages: ['Plan', 'RFI', 'RFP', 'BAFO', 'Contracting', 'Implement'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Use extra caution if Bloomreach powers authenticated digital journeys, campaign personalization, or customer-data activation. Map criticality, operational resilience, third-party risk, subprocessors, support access, audit evidence, exit, and incident reporting before production use.',
      regulatoryRefs: ['DORA if applicable to EU regulated financial entities', 'GDPR if personal data is processed'],
      additionalRequirements: ['Operational resilience review', 'Exit plan', 'Subprocessor review', 'Security questionnaire and audit evidence'],
    },
  ],
  body: `## Summary
Bloomreach sourcing should be handled as a commerce experience operating-model decision, not just as a site-search replacement. Public Bloomreach materials describe Discovery as a SaaS product discovery platform for intelligent ecommerce search, merchandising, recommendations, pathways, SEO, insights, and analytics. Bloomreach also positions its search intelligence product around AI-powered search, behavioral and one-to-one personalization, AI Studio controls, smart categories, product-grid merchandising, conversational shopping, visual search, and recommendations. Engagement broadens the footprint into customer data, analytics, segmentation, campaigns, experiments, consent, PII management, APIs, and activation across digital touchpoints. For sourcing, this means the event touches product data, customer data, marketing operations, ecommerce engineering, privacy, merchandising, experimentation, support, and commercial terms.

## When to apply
Use this pattern when a buyer is selecting or renewing Bloomreach Discovery, Bloomreach Engagement, commerce search, merchandising, recommendations, SEO, customer data and experience workflows, marketing automation, or AI-assisted personalization. It is especially useful when an executive sponsor frames the decision as a revenue lift or conversion project. That framing may be valid, but it must be proven with buyer evidence. The sourcing record should identify the sites, brands, regions, languages, catalogs, environments, channels, products, modules, integrations, events, customer identifiers, consent states, support expectations, usage assumptions, launch gates, and owners that make the value claim testable.

## Product and data boundary
Separate Bloomreach into connected but distinct layers. The Discovery layer covers search and category experiences, merchandising rules, product grids, recommendations, pathways, SEO, insights, analytics, catalog feeds, APIs, event tracking, relevance tuning, testing, and launch readiness. The Engagement layer covers customer profiles, events, identity resolution, segmentations, analytics, campaigns, experiments, predictions, recommendations, PII management, consent management, APIs, SDKs, imports, exports, and data activation. The AI and personalization layer depends on both of those foundations, plus business rules and measured outcomes. A buyer should not approve an AI-personalization business case unless catalog data, behavioral events, customer identity, consent, merchandising governance, experiment methodology, and measurement ownership are ready.

## Commercial model
Bloomreach's public pricing page routes buyers through request-pricing and contact paths rather than universal list prices. It publicly describes annual billing, excess-usage handling, module add-on paths, documentation, onboarding, implementation support, and multiple support resources. Those facts are enough to structure diligence, but not enough to benchmark a buyer's deal. Build the commercial model from signed or auditable evidence: quote, order form, invoices, current usage, contracted usage, overage treatment, module list, support package, implementation statement of work, managed services scope, renewal language, and termination/transition terms. Do not infer discount, negotiated rates, implementation cost, usage allowances, overage price, renewal uplift, or performance guarantee from public sources.

## Implementation and reliability
Discovery implementation should be treated as a launch program. Bloomreach documentation describes phases for technical planning and provisioning, catalog connection and configuration, website experience build, API deployment, event tracking, tuning, testing, and launch. The sourcing team should convert those phases into acceptance criteria. Catalog feed cadence, full-feed behavior, patch frequency, product attributes, inventory signals, event quality, API traffic, and promotional spikes are commercial and operational risks, not just engineering details. Public Discovery API documentation describes circuit breakers and customer-specific Search and Category API limits; catalog API documentation describes rate limits, 429 responses, Retry-After handling, and support escalation. Require a reliability runbook before launch, especially for seasonal retail, high traffic, large catalogs, or promotional events.

## Security, privacy, and compliance
Bloomreach publishes security and privacy materials covering security-at-design, encryption at rest and in transit, authorized-role access, privacy-by-design, a DPO, certifications, SOC 2 Type II, ISO accreditations, third-party penetration tests, and Trust Portal access for reports. Bloomreach's DPA covers subprocessors, security measures, confidentiality, incident notification, updates to security measures, customer responsibilities, audit questionnaire responses, international transfers, and SCC posture. These materials create a due-diligence map, not an automatic approval. Before production use, map customer data, events, PII, consent states, support access, exports, retention, subprocessors, international transfers, audit evidence, and incident workflow to the exact products and channels in scope.

## Evaluation rubric
Score Bloomreach across commerce fit, data readiness, measurable value, reliability, privacy, security, integration feasibility, operating model, and commercial transparency. Commerce fit covers search relevance, merchandising control, recommendations, SEO needs, category behavior, product-grid governance, and ecommerce platform fit. Data readiness covers catalog completeness, product attributes, inventory and price freshness, customer identifiers, event taxonomy, consent capture, and import/export needs. Measurable value covers baseline conversion, revenue per visitor, null-search, add-to-cart, campaign conversion, recommendation contribution, search exit rate, and agreed A/B test design. Reliability covers API limits, catalog update process, peak traffic, status review, support escalation, and fallback behavior. Commercial transparency covers module scope, usage, overage treatment, support, services, renewal protections, and expansion gates.

## Contradictions and failure modes
Vendor claim: AI personalization will lift revenue quickly. Detection: ask for buyer baseline metrics, experiment plan, catalog quality evidence, event instrumentation, consent map, merchandising owner, and statistical acceptance criteria. Vendor claim: modules can be added without disruption. Detection: require module-specific data flows, support owners, integration work, privacy review, training, usage impact, and order-form terms. Vendor claim: the platform is enterprise ready for peak retail traffic. Detection: map expected traffic and catalog operations to API guardrails, rate limits, support escalation, load-test approval, retry behavior, cache behavior, status-page monitoring, and launch runbook.

## Commercial outcome
The desired output is a controlled Bloomreach buying record. It should list products, modules, sites, brands, regions, catalogs, channels, customer data sources, environments, APIs, SDKs, usage assumptions, overage terms, implementation milestones, support model, security evidence, DPA and subprocessor review, acceptance tests, measurement plan, launch gates, renewal protections, and exit expectations. Any claim about private pricing, discounts, support concessions, services credits, SLA remedies, implementation timing, ROI, conversion lift, or renewal caps should stay blank until the buyer supplies auditable evidence.`,
};
