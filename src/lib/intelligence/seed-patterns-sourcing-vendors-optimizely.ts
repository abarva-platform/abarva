import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const OPTIMIZELY_SOURCE_BASIS = {
  products: {
    type: 'public-disclosure',
    label: 'Optimizely One products overview',
    url: 'https://cm.www.optimizely.com/products/',
    asOf: SOURCE_AS_OF,
    note:
      'Official products overview positioning Optimizely around content lifecycle, assets, omnichannel delivery, personalization, experimentation, analytics, integrations, Opal AI, and digital experience workflows.',
  },
  plans: {
    type: 'public-disclosure',
    label: 'Optimizely plans and pricing',
    url: 'https://www.optimizely.com/plans/',
    asOf: SOURCE_AS_OF,
    note:
      'Official plans page identifying product families such as Content Marketing Platform, Web Experimentation, Analytics, Content Management System, Personalization, and Digital Asset Management, each routed through request-pricing motions.',
  },
  webExperimentation: {
    type: 'public-disclosure',
    label: 'Optimizely Web Experimentation product overview',
    url: 'https://www.optimizely.com/products/web-experimentation',
    asOf: SOURCE_AS_OF,
    note:
      'Official product page describing A/B tests, multivariate tests, multi-armed bandits, personalization campaigns, analytics feedback loops, AI-assisted workflows, and PCI posture for web experimentation.',
  },
  featureExperimentation: {
    type: 'public-disclosure',
    label: 'Optimizely Feature Experimentation product overview',
    url: 'https://www.optimizely.com/products/feature-experimentation',
    asOf: SOURCE_AS_OF,
    note:
      'Official product page describing feature flags, experiment and flag management, SDK integration, AI-tool access through Remote MCP Server, results, audience details, and third-party analytics and CDP integration.',
  },
  cms: {
    type: 'public-disclosure',
    label: 'Optimizely Content Management System product overview',
    url: 'https://www.optimizely.com/products/content-management/',
    asOf: SOURCE_AS_OF,
    note:
      'Official CMS page describing headless content delivery, visual builder, Optimizely Graph, embedded DAM, workflow, personalization, AI content support, edge delivery, APIs, integrations, and multi-site or multi-channel management.',
  },
  dataPlatform: {
    type: 'public-disclosure',
    label: 'Optimizely Data Platform product overview',
    url: 'https://www.optimizely.com/products/data-platform/',
    asOf: SOURCE_AS_OF,
    note:
      'Official ODP page describing customer-data unification, segmentation, activation, 60-plus integrations, advanced targeting, real-time personalization, commerce use cases, and CDP audience sync.',
  },
  commerce: {
    type: 'public-disclosure',
    label: 'Optimizely Commerce product overview',
    url: 'https://www.optimizely.com/products/commerce/',
    asOf: SOURCE_AS_OF,
    note:
      'Official commerce page describing Configured Commerce, Commerce Connect with CMS, B2B and B2C commerce, AI-powered search, personalized pricing and promotions, content-led commerce, and analytics.',
  },
  compliance: {
    type: 'public-disclosure',
    label: 'Optimizely Trust Center compliance',
    url: 'https://www.optimizely.com/trust-center/compliance/',
    asOf: SOURCE_AS_OF,
    note:
      'Official compliance page listing ISO 27001:2022, ISO 27017:2015, ISO 27018:2019, SOC 2 Type 2, PCI DSS v4.0.1, and TISAX, with reports available through customer success or sales channels.',
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Optimizely Data Processing Agreement',
    url: 'https://www.optimizely.com/trust-center/data-processing-agreement/',
    asOf: SOURCE_AS_OF,
    note:
      'Official Trust Center DPA page listing the current Optimizely Data Processing Agreement Version 2026-01, published 2026-Jan-01, plus legacy versions.',
  },
  productTerms: {
    type: 'public-disclosure',
    label: 'Optimizely Software Service Product Terms',
    url: 'https://www.optimizely.com/contentassets/8258092236bc46feaa7ee6165b0802a4/optimizely-product-supplement-version-2025-08-published-2025-aug-01.pdf',
    asOf: SOURCE_AS_OF,
    note:
      'Official product terms covering hosting region, geo-fenced support, customer data use protocols, custom code ownership, data access, retention, retrieval, destruction, continuity policy linkage, and acceptable use references.',
  },
  sla: {
    type: 'public-disclosure',
    label: 'Optimizely Service Level Agreement',
    url: 'https://www.optimizely.com/contentassets/ebb8529a22404a1182a76c0e3f593396/optimizely-service-level-agreement-version-2024-05-published-2024-may-21pdf/',
    asOf: SOURCE_AS_OF,
    note:
      'Official SLA describing status-page notifications, reason-for-outage reports, availability calculation, one-minute service monitoring after launch, maintenance, service credits, claim timing, and excluded downtime.',
  },
  geofencing: {
    type: 'public-disclosure',
    label: 'Optimizely geofencing',
    url: 'https://www.optimizely.com/trust-center/privacy/geofencing/',
    asOf: SOURCE_AS_OF,
    note:
      'Official privacy page describing geofencing as a contracted service for regional support controls where PII remains in customer instances, plus links to DPA and subprocessor context.',
  },
} satisfies Record<string, SourceBasisRef>;

const OPTIMIZELY_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label:
    'Buyer-specific Optimizely quote, order form, product bundle, traffic, event, visitor, seat, environment, implementation, privacy, support, and renewal evidence needed',
  asOf: SOURCE_AS_OF,
  note:
    'Public Optimizely sources describe product scope, request-pricing posture, trust resources, DPA availability, product terms, SLA mechanics, hosting-region concepts, geofenced support, and product-family breadth. They do not establish buyer-specific net price, discount, renewal uplift, contracted usage metric, overage exposure, data residency approval, implementation effort, partner cost, AI-credit usage, or negotiated remedies.',
};

export const PAT_SRC_VEN_OPTIMIZELY_001: PatternSeed = {
  id: 'PAT-SRC-VEN-OPTIMIZELY-001',
  slug: 'optimizely-dxp-experimentation-content-commerce-sourcing-profile',
  title: 'Optimizely DXP, Experimentation, Content, and Commerce Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Optimizely sourcing should treat the platform as a digital experience operating model across content, experimentation, personalization, customer data, commerce, AI, and governance rather than a narrow A/B testing tool or CMS renewal.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking Optimizely One, Web Experimentation, Feature Experimentation, Personalization, Content Management System, Content Marketing Platform, Digital Asset Management, Optimizely Data Platform, Commerce, Analytics, Opal AI, or broader digital experience platform programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-optimizely',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(OPTIMIZELY_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'CCPA-CPRA-if-consumer-data',
    'PCI-DSS-if-commerce-or-payment-adjacent-data',
    'HIPAA-review-if-ePHI-workflow',
    'AI-governance-review',
    'data-residency-and-support-region-review',
    'cookie-consent-and-tracking-review',
  ],
  relatedPatternIds: [
    'PAT-SRC-CAT-CMS-001',
    'PAT-SRC-CAT-CDP-001',
    'PAT-SRC-CAT-CRM-001',
    'PAT-SRC-CAT-LLM-001',
    'PAT-SRC-PRC-SAAS-001',
  ],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Optimizely',
      tier: 'enterprise',
      positioning:
        'Enterprise digital experience platform vendor spanning content management, content orchestration, digital asset workflows, web and feature experimentation, personalization, customer data activation, commerce, analytics, integrations, and embedded AI through Opal.',
      strengths: [
        'Official product materials show a broad platform narrative across planning, creating, storing, delivering, personalizing, experimenting, analyzing, and integrating digital experiences',
        'Official CMS, ODP, Web Experimentation, Feature Experimentation, and Commerce pages provide a practical scope map for separating content, data, experimentation, feature flag, personalization, and commerce use cases',
        'Official Trust Center, DPA, product terms, geofencing, and SLA materials provide public anchors for privacy, compliance, hosting, support-region, continuity, data export, deletion, and service-credit diligence',
      ],
      cautions: [
        'Public request-pricing pages do not prove buyer-specific net price, contracted metric, discount, renewal cap, traffic entitlement, event volume, seat count, environment count, implementation cost, or AI-credit exposure',
        'Optimizely can be evaluated as one suite, but sourcing should not allow CMS, experimentation, CDP, personalization, commerce, DAM, analytics, and AI scope to collapse into one unmeasured bundle',
        'Customer-facing experimentation and personalization can involve cookies, visitor identifiers, profile attributes, event streams, support access, regulated data, and consent rules that must be designed before activation',
        'Product pages describe AI and optimization loops, but sourcing teams should treat productivity, conversion, and replacement claims as hypotheses until tested with buyer-authored scenarios and measurement plans',
      ],
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.products,
        OPTIMIZELY_SOURCE_BASIS.cms,
        OPTIMIZELY_SOURCE_BASIS.webExperimentation,
        OPTIMIZELY_SOURCE_BASIS.featureExperimentation,
        OPTIMIZELY_SOURCE_BASIS.dataPlatform,
        OPTIMIZELY_SOURCE_BASIS.commerce,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Official Optimizely request-pricing orientation',
      model: 'hybrid',
      metric:
        'Product family, module bundle, subscription term, usage metric, visitors or traffic, events, experiments, feature flags, profiles, seats, environments, commerce scope, analytics scope, support, services, AI usage, implementation partner, and order-form entitlements',
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.plans,
        OPTIMIZELY_SOURCE_BASIS.productTerms,
        OPTIMIZELY_BUYER_DATA_GAP,
      ],
      confidence: 0.7,
      notes:
        'Use the official plans page to identify which products route to request-pricing motions and use product terms to identify usage-metric and service-boundary questions. Do not infer list price, enterprise net price, discount band, renewal uplift, AI-credit cost, implementation budget, or overage exposure from public sources alone.',
    },
    {
      label: 'Founder data gap - Optimizely commercial and implementation evidence required',
      model: 'unknown',
      sourceBasis: [OPTIMIZELY_BUYER_DATA_GAP],
      confidence: 0.18,
      notes:
        'No vendor recommendation, savings estimate, consolidation case, experimentation ROI claim, migration plan, or renewal-risk score should be produced without buyer-approved quote, order-form, traffic, event, user, environment, implementation, legal, and performance evidence.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Product, module, and measurement-scope exhibit',
      buyerPosition:
        'Attach a scope schedule that identifies each Optimizely product, selected modules, environments, domains, sites, apps, experiments, flags, content repositories, DAM assets, profiles, events, integrations, commerce workflows, Opal AI capabilities, usage metrics, and business owners.',
      fallbackPosition:
        'If final adoption scope is uncertain, separate committed baseline from optional modules and require quote refresh, usage reporting, adoption gates, and renewal baseline protection before expansion.',
      walkawayTriggers: [
        'Final proposal cannot be reconciled to products, domains, traffic or event assumptions, usage metrics, integration dependencies, and implementation responsibilities',
        'Suite-consolidation or conversion-value case is counted before buyer-authored scenarios and measurement governance are agreed',
      ],
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.plans,
        OPTIMIZELY_SOURCE_BASIS.products,
        OPTIMIZELY_SOURCE_BASIS.productTerms,
        OPTIMIZELY_BUYER_DATA_GAP,
      ],
    },
    {
      clauseArea: 'Data processing, consent, hosting, and support-region controls',
      buyerPosition:
        'Map cookies, visitor identifiers, customer profiles, behavioral events, content records, commerce records, support access, AI inputs, data location, subprocessor review, DPA path, geofencing need, deletion, export, and retention before production activation.',
      fallbackPosition:
        'If privacy review is incomplete, restrict activation to non-regulated, non-sensitive use cases and make DPA, consent, subprocessor, support-region, retention, and deletion evidence a pre-production gate.',
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.dpa,
        OPTIMIZELY_SOURCE_BASIS.geofencing,
        OPTIMIZELY_SOURCE_BASIS.productTerms,
        OPTIMIZELY_SOURCE_BASIS.compliance,
      ],
    },
    {
      clauseArea: 'Availability, continuity, export, and critical-site reliance',
      buyerPosition:
        'Tie each production site, commerce workflow, experiment, flag, personalization journey, data platform dependency, and content publishing workflow to applicable SLA, support, status-page, RFO, continuity, export, and transition-assistance obligations.',
      fallbackPosition:
        'Where service credits are the primary standard remedy, add stronger escalation, incident communication, rollback, export, and transition controls for critical websites, storefronts, launch calendars, and revenue workflows.',
      sourceBasis: [OPTIMIZELY_SOURCE_BASIS.sla, OPTIMIZELY_SOURCE_BASIS.productTerms],
    },
    {
      clauseArea: 'AI, experimentation, and decision-governance controls',
      buyerPosition:
        'Document which Opal AI, AI content, AI tagging, AI translation, predictive recommendation, audience, feature-flag, and experiment-result workflows are in scope; define approval owners, measurement windows, human review, prohibited data, and rollback rules.',
      fallbackPosition:
        'Treat AI and optimization features as optional gated scope unless entitlement, data handling, usage economics, output review, and success metrics are written.',
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.products,
        OPTIMIZELY_SOURCE_BASIS.cms,
        OPTIMIZELY_SOURCE_BASIS.webExperimentation,
        OPTIMIZELY_SOURCE_BASIS.featureExperimentation,
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Unbundle DXP value into measurable workstreams',
      whenToUse:
        'Use when Optimizely is proposed as a unified DXP covering CMS, CMP, DAM, experimentation, personalization, ODP, commerce, analytics, integrations, and AI.',
      buyerAsk:
        'Price committed modules, optional modules, ramp schedule, usage metrics, implementation milestones, adoption targets, integration owners, renewal baseline, and exit deliverables separately before accepting platform-bundle economics.',
      vendorGive:
        'Vendor may offer suite packaging, phased adoption, services, partner support, AI access, or cross-product workflow value. Accept only when each item maps to written buyer scope and measurable outcomes.',
      tradeoffs: [
        'A suite can reduce tool fragmentation and connect content, testing, and personalization, but it can also hide unused modules, weak integration assumptions, and renewal leverage loss.',
      ],
      evidenceBasis: [OPTIMIZELY_SOURCE_BASIS.products, OPTIMIZELY_SOURCE_BASIS.plans, OPTIMIZELY_BUYER_DATA_GAP],
    },
    {
      lever: 'Make experimentation economics usage-backed',
      whenToUse:
        'Use when Web Experimentation, Feature Experimentation, Personalization, Analytics, or ODP scope depends on visitor traffic, event volume, flag count, profile count, channel coverage, or conversion-value claims.',
      buyerAsk:
        'Require a baseline of domains, apps, monthly visitors, traffic allocation, experiments, flags, events, audiences, data sources, analytics destinations, consent state, and expected decision cadence before committing term or expansion volume.',
      tradeoffs: [
        'More experimentation coverage can improve learning velocity, but poor traffic, consent, metric, or audience design can leave the buyer paying for tests that cannot support decisions.',
      ],
      evidenceBasis: [
        OPTIMIZELY_SOURCE_BASIS.webExperimentation,
        OPTIMIZELY_SOURCE_BASIS.featureExperimentation,
        OPTIMIZELY_SOURCE_BASIS.dataPlatform,
        OPTIMIZELY_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'Gate privacy and support-region commitments before personalization expansion',
      whenToUse:
        'Use when ODP, personalization, commerce, experimentation, or support workflows may involve PII, customer profiles, regulated records, or regional handling commitments.',
      buyerAsk:
        'Make DPA execution, subprocessor review, geofenced support decision, hosting-region evidence, consent architecture, prohibited-data rules, retention, deletion, and export test a signed launch gate.',
      evidenceBasis: [
        OPTIMIZELY_SOURCE_BASIS.dpa,
        OPTIMIZELY_SOURCE_BASIS.geofencing,
        OPTIMIZELY_SOURCE_BASIS.productTerms,
        OPTIMIZELY_SOURCE_BASIS.compliance,
      ],
    },
  ],
  riskFactors: [
    {
      id: 'optimizely-suite-scope-blur',
      label: 'Suite scope blur across content, experimentation, data, commerce, and AI',
      severity: 'high',
      detectionSignals: [
        'Proposal combines CMS, experimentation, personalization, ODP, DAM, CMP, commerce, analytics, and AI without module-level owners, metrics, usage assumptions, and implementation boundaries.',
        'Business case counts tool consolidation, conversion uplift, launch speed, or AI productivity before buyer-authored scenarios and adoption gates exist.',
      ],
      mitigations: ['Build a product-by-product scope exhibit', 'Separate committed baseline from optional expansion', 'Tie each value claim to acceptance evidence'],
      contractualRemedies: ['Module schedule', 'Usage-metric exhibit', 'Adoption gates', 'Expansion quote refresh', 'Renewal baseline schedule'],
      sourceBasis: [OPTIMIZELY_SOURCE_BASIS.products, OPTIMIZELY_SOURCE_BASIS.plans],
    },
    {
      id: 'optimizely-personalization-data-control-gap',
      label: 'Personalization and experimentation data-control gap',
      severity: 'high',
      detectionSignals: [
        'Visitor identifiers, behavior events, audiences, profile attributes, commerce signals, or AI inputs are activated before consent, DPA, subprocessor, hosting, support access, and retention controls are approved.',
      ],
      mitigations: ['Run privacy and consent design before production activation', 'Map data categories and support access', 'Test export and deletion paths'],
      contractualRemedies: ['DPA exhibit', 'Subprocessor notice process', 'Geofenced support addendum where needed', 'Data export and deletion assistance', 'Regulated-data activation gate'],
      sourceBasis: [
        OPTIMIZELY_SOURCE_BASIS.dpa,
        OPTIMIZELY_SOURCE_BASIS.geofencing,
        OPTIMIZELY_SOURCE_BASIS.productTerms,
      ],
    },
    {
      id: 'optimizely-critical-site-reliance-underprotected',
      label: 'Critical site and commerce reliance underprotected by standard remedies',
      severity: 'medium',
      detectionSignals: [
        'Optimizely is used for public websites, storefronts, feature flags, launch calendars, or personalization journeys while the contract relies mainly on standard service-credit mechanics.',
      ],
      mitigations: ['Map critical journeys to SLA and continuity controls', 'Subscribe to status notifications', 'Define rollback and content export runbooks'],
      contractualRemedies: ['Enhanced escalation path', 'RFO commitment', 'Transition assistance', 'Export runbook', 'Launch freeze and rollback process'],
      sourceBasis: [OPTIMIZELY_SOURCE_BASIS.sla, OPTIMIZELY_SOURCE_BASIS.productTerms],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Separate content, commerce, personalization, loyalty, experimentation, customer-data, and payment-adjacent telemetry so PCI, consent, brand, promotion, and conversion measurement controls are approved before broad activation.',
      additionalRequirements: ['PCI-adjacent data review', 'Consent and cookie review', 'Promotion and pricing governance', 'Experiment measurement plan'],
      regulatoryRefs: ['PCI-DSS where cardholder data or payment-adjacent data is in scope'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Treat public-site publishing, authenticated personalization, consent, analytics, and customer profile activation as regulated digital-channel controls when they influence customer communications, offers, or operational resilience.',
      additionalRequirements: ['DORA/ICT classification where applicable', 'Marketing compliance review', 'Customer communication approval workflow', 'Exit and continuity plan'],
      regulatoryRefs: ['DORA where applicable to EU financial entities'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm whether any workflow could process PHI or ePHI before using personalization, experimentation, support, analytics, forms, or AI features, and do not rely on generic DXP claims for healthcare approval.',
      additionalRequirements: ['PHI boundary review', 'HIPAA/legal review where applicable', 'BAA decision for approved ePHI-enabled service if applicable'],
    },
    {
      industry: 'higher_education',
      modifier:
        'Use the public compliance and HECVAT context as evidence anchors, but require institution-specific accessibility, student-data, consent, identity, and content-governance reviews before launch.',
      additionalRequirements: ['Accessibility review', 'Student-data review', 'HECVAT or equivalent security artifact review', 'Content owner approval matrix'],
    },
  ],
  body: `## Summary
Optimizely should be sourced as a digital experience operating model, not as a simple A/B testing tool, CMS renewal, or marketing add-on. Official Optimizely materials position Optimizely One around creating, storing, delivering, personalizing, experimenting, analyzing, and integrating customer-facing digital experiences. The public product pages show a broad footprint: Content Management System for headless and marketer-led publishing, Web Experimentation for A/B tests and multivariate tests, Feature Experimentation for flags and application experiments, Optimizely Data Platform for customer-data unification and segmentation, Commerce for B2B and B2C digital commerce, and Opal AI across content, experimentation, and workflow contexts. That breadth is useful, but it is also the sourcing risk. A buyer can easily accept a suite story before proving which modules, data flows, usage metrics, teams, and implementation responsibilities are actually in scope.

## When to apply
Use this pattern when Optimizely is an incumbent, finalist, renewal target, expansion candidate, or consolidation platform for digital experience work. It applies to Optimizely One, CMS, Content Marketing Platform, DAM, Web Experimentation, Feature Experimentation, Personalization, Analytics, ODP, Commerce, and AI-enabled workflows such as Opal-assisted content, recommendations, tagging, translation, and experiment management. The pattern does not assume Optimizely is the right technical answer. It ensures that the sourcing record separates content operations, product experimentation, marketing personalization, customer data, commerce workflows, AI usage, privacy controls, performance reliance, and commercial meters before the buyer signs.

## Evidence to collect
Start with a scope inventory. Name each website, domain, app, storefront, brand, locale, environment, repository, content type, asset class, experiment, feature flag, event stream, customer profile source, audience, analytics destination, integration, and owner. Then map each Optimizely module to a measurable workflow: content authoring, approval, publishing, asset reuse, headless delivery, experiment design, traffic allocation, feature rollout, targeting, profile activation, product recommendation, commerce transaction support, campaign planning, reporting, or AI-assisted content work. For each workflow, capture expected users, monthly traffic, event volume, profiles, integrations, environments, launch calendar, implementation partner, support model, success metric, and rollback path. Public sources can identify product capabilities, but buyer evidence must prove adoption, economics, risk, and fit.

## Commercial posture
Optimizely public pricing posture is request-pricing oriented. The official plans page identifies product families and routes buyers to request pricing; it does not publish enterprise net prices, discount bands, contracted usage metrics, renewal caps, overage rules, AI-credit economics, implementation costs, or partner fees. The BAFO model should split committed baseline products from optional expansion, then normalize every pricing driver the order form uses: modules, seats, visitors, traffic, events, experiments, flags, profiles, environments, domains, commerce scope, analytics scope, support, services, AI usage, partner implementation, marketplace path, ramp dates, and renewal baseline. Treat suite consolidation value as unproven until legacy tool retirement, integration effort, measurement governance, and adoption milestones are written.

## Contract and data controls
Optimizely can touch sensitive customer-facing data. Experimentation, personalization, ODP, analytics, commerce, forms, support, and AI workflows may involve cookies, visitor identifiers, profile attributes, behavioral events, customer records, campaign assets, and content metadata. Before activation, the buyer should close DPA status, subprocessor review, consent design, cookie and tracking approach, data-location expectations, geofenced support decision, support access rules, prohibited data, retention, export, deletion, and AI-input governance. Official product terms identify hosting-region concepts, geo-fenced support, customer data use protocols, data access, retrieval, destruction, and continuity references. The SLA identifies status-page notifications, RFO mechanics, availability calculation, service monitoring, maintenance, service credits, claim timing, and excluded downtime. Those public anchors should become deal-specific obligations for critical sites, storefronts, campaign launches, and feature rollouts.

## Evaluation scenarios
Run buyer-authored scenarios before award or renewal. For CMS: create, approve, localize, publish, search, reuse, and roll back content across the intended channels. For experimentation: design a test, allocate traffic, connect analytics, evaluate results, stop or promote a winner, and document the decision. For feature flags: create a flag, target an audience, roll out gradually, monitor impact, and roll back safely. For ODP and personalization: ingest data, create a compliant segment, activate it, suppress ineligible users, and audit consent. For commerce: test catalog, content, promotion, search, pricing, and order-flow dependencies. For AI: test prompts, outputs, approval, prohibited data, audit trail, and usage economics.

## Pitfalls
The first failure mode is buying a DXP bundle while leaving module ownership and usage metrics vague. The second is treating experimentation as a conversion engine without enough traffic, clean metrics, consent coverage, or decision discipline. The third is activating personalization and ODP before privacy, support-region, subprocessor, retention, and deletion controls are approved. The fourth is accepting AI productivity or suite-consolidation claims without buyer-owned tests. The fifth is relying on standard service-credit remedies for public sites or commerce workflows that need stronger escalation, rollback, export, and continuity controls. Public Optimizely sources support product-scope, request-pricing, compliance, DPA, geofencing, product-term, and SLA orientation; they do not support invented pricing, private concessions, ROI claims, or buyer-specific risk conclusions.

## Instances
No tenant instances are attached to this seed. Use it as a public-source vendor profile and enrich it only with approved buyer evidence before making an award recommendation, pricing conclusion, renewal-risk conclusion, migration plan, or platform-consolidation claim.`,
};

export const SOURCING_VENDOR_OPTIMIZELY_PATTERNS: PatternSeed[] = [PAT_SRC_VEN_OPTIMIZELY_001];
