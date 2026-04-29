import type { PatternSeed } from './seed-types';

const SALESFORCE_SOURCE_BASIS = {
  salesPricing: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Sales Cloud pricing page',
    url: 'https://www.salesforce.com/sales/pricing/',
    asOf: '2026-04-29',
  },
  agentforcePricing: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Agentforce pricing page',
    url: 'https://www.salesforce.com/agentforce/pricing/',
    asOf: '2026-04-29',
  },
  dataPricing: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Data 360 pricing page',
    url: 'https://www.salesforce.com/data/pricing/',
    asOf: '2026-04-29',
  },
  customerAgreements: {
    type: 'public-disclosure' as const,
    label: 'Salesforce customer agreements landing page',
    url: 'https://www.salesforce.com/company/legal/customer-agreements/',
    asOf: '2026-04-29',
  },
  msa: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Main Services Agreement, September 15, 2025',
    url: 'https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/legal/salesforce_MSA.pdf',
    asOf: '2026-04-29',
  },
  trust: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Trust and Compliance Documentation',
    url: 'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/',
    asOf: '2026-04-29',
  },
  subprocessors: {
    type: 'public-disclosure' as const,
    label: 'Salesforce Infrastructure and Sub-processors documentation',
    url: 'https://www.salesforce.com/content/dam/web/en_us/www/documents/legal/misc/salesforce-infrastructure-and-subprocessors.pdf',
    asOf: '2026-04-29',
  },
  fy2026Form10K: {
    type: 'regulatory-document' as const,
    label: 'Salesforce FY2026 Form 10-K filed with the SEC',
    url: 'https://www.sec.gov/Archives/edgar/data/1108524/000110852426000060/crm-20260131.htm',
    asOf: '2026-04-29',
  },
  founderGap: {
    type: 'founder-data-gap' as const,
    label:
      'TODO/founder-data-gap: Buyer-specific discount, ELA, renewal-uplift, shelfware, implementation-services, and consumption benchmark data require approved AbarVa evidence.',
  },
};

export const SOURCING_VENDOR_SALESFORCE_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-SALESFORCE-001',
    slug: 'salesforce-enterprise-sourcing-profile',
    title: 'Salesforce Enterprise Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Salesforce sourcing succeeds when the buyer treats the platform as a multi-cloud customer operating layer with seat, usage, data, AI, integration, renewal, and exit economics, not as a single CRM subscription line.',
    applicability:
      'Apply to new Salesforce selections, Sales Cloud or Service Cloud renewals, Agentforce/Data 360 expansions, CRM consolidation, platform rationalization, and enterprise agreement negotiations where Salesforce is an incumbent or finalist.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.salesforce.com/sales/pricing/',
      'https://www.salesforce.com/agentforce/pricing/',
      'https://www.salesforce.com/data/pricing/',
      'https://www.salesforce.com/company/legal/customer-agreements/',
      'https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/legal/salesforce_MSA.pdf',
      'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/',
      'https://www.salesforce.com/content/dam/web/en_us/www/documents/legal/misc/salesforce-infrastructure-and-subprocessors.pdf',
      'https://www.sec.gov/Archives/edgar/data/1108524/000110852426000060/crm-20260131.htm',
    ],
    regulatoryChips: ['GDPR-if-personal-data', 'HIPAA-if-PHI', 'DORA-if-regulated-financial-entity', 'AI-governance-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-AGENT-001', 'PAT-SRC-RENEWAL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    vendorLandscape: [
      {
        vendorName: 'Salesforce core CRM clouds',
        tier: 'incumbent',
        positioning:
          'Enterprise CRM and customer platform incumbent spanning sales, service, marketing, commerce, industry clouds, platform workflow, analytics, AI, and ecosystem extensions.',
        strengths: [
          'Broad customer operating model coverage across front-office workflows',
          'Large partner, marketplace, administrator, and implementation ecosystem',
          'Public edition packaging and list-price anchors for Sales Cloud',
        ],
        cautions: [
          'Named-user editions are only one cost layer; add-ons, support, storage, sandboxes, APIs, Data 360, Agentforce, and implementation services must be normalized.',
          'Enterprise net pricing, discount depth, ELA economics, and renewal concessions are not proven by public list pages.',
        ],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.salesPricing, SALESFORCE_SOURCE_BASIS.customerAgreements, SALESFORCE_SOURCE_BASIS.fy2026Form10K],
      },
      {
        vendorName: 'Salesforce Agentforce and Data 360',
        tier: 'enterprise',
        positioning:
          'AI and data expansion layer that can shift a CRM event into consumption, credit-wallet, profile, unstructured-data, and agent-governance economics.',
        strengths: [
          'Official pricing pages disclose consumption-oriented buying constructs for Agentforce and Data 360',
          'Platform adjacency to Salesforce records, workflows, analytics, and industry clouds',
        ],
        cautions: [
          'Usage examples and published rate cards do not guarantee buyer-specific consumption, contract rates, or total cost.',
          'AI adoption should not be awarded without measurable use cases, data-use controls, safety review, and spend monitoring.',
        ],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.agentforcePricing, SALESFORCE_SOURCE_BASIS.dataPricing, SALESFORCE_SOURCE_BASIS.trust],
      },
      {
        vendorName: 'Salesforce ecosystem and non-SFDC applications',
        tier: 'specialist',
        positioning:
          'Implementation partners, AppExchange applications, integrations, and adjacent clouds can be essential to the business outcome but should be treated as separate scope, risk, and accountability layers.',
        strengths: ['Large implementation and ISV ecosystem', 'Multiple expansion paths for workflow, analytics, integration, and industry requirements'],
        cautions: [
          'The Salesforce MSA distinguishes Salesforce services from non-SFDC applications and services; sourcing should not assume one vendor owns every adjacent failure mode.',
          'Partner services, app subscriptions, integration maintenance, and data movement can become material TCO drivers.',
        ],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.fy2026Form10K, SALESFORCE_SOURCE_BASIS.founderGap],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public Salesforce list-price orientation only',
        model: 'hybrid',
        metric: 'Named users, editions, add-ons, AI credits, Data 360 profiles or credits, support tier, storage, API usage, environments, partner services',
        sourceBasis: [
          SALESFORCE_SOURCE_BASIS.salesPricing,
          SALESFORCE_SOURCE_BASIS.agentforcePricing,
          SALESFORCE_SOURCE_BASIS.dataPricing,
          SALESFORCE_SOURCE_BASIS.founderGap,
        ],
        confidence: 0.7,
        notes:
          'Public pages disclose list-price and consumption constructs, including Sales Cloud editions and Agentforce/Data 360 credit models. Do not infer enterprise net price, discounts, ELA terms, or renewal concessions without buyer quote, order-form, invoice, or approved benchmark evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Order-form SKU and usage-limit control',
        buyerPosition:
          'Require each order form to separate products, quantities, environments, add-ons, credit pools, support tier, renewal term, usage limits, excess-usage mechanics, and any bundled or promotional components.',
        fallbackPosition:
          'If Salesforce will not rework the commercial schedule, attach a buyer-authored normalization schedule and make it controlling for internal award, renewal, and true-up decisions.',
        vendorPosition:
          'Salesforce may rely on standard order-form structure, documentation, and usage-limit provisions that require additional quantities or invoices when contractual limits are exceeded.',
        walkawayTriggers: [
          'The award recommendation cannot reconcile purchased SKUs to actual user roles, credit consumption, storage, API, or support requirements.',
          'Excess-usage or true-up mechanics are undefined for Agentforce, Data 360, integrations, or storage-heavy use cases.',
        ],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.founderGap],
      },
      {
        clauseArea: 'Customer data, subprocessors, export, and deletion',
        buyerPosition:
          'Close data-processing, subprocessor, data-location, export, deletion, audit, and security-documentation review before award, with heightened review for regulated data and cross-border processing.',
        fallbackPosition:
          'If final data-location or subprocessor review is not complete, block production regulated-data migration until privacy, security, and legal owners approve the residual risk.',
        vendorPosition:
          'Salesforce points buyers to the MSA, DPA, Trust and Compliance documentation, SPARC/NLI materials, and Infrastructure and Sub-processors documentation.',
        walkawayTriggers: [
          'The buyer cannot identify which Salesforce services, infrastructure model, or subprocessors apply to the ordered services.',
          'The buyer lacks an export and transition plan for material customer data before renewal signature.',
        ],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.customerAgreements, SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.trust, SALESFORCE_SOURCE_BASIS.subprocessors],
      },
    ],
    negotiationLevers: [
      {
        lever: 'License and cloud normalization before commercial close',
        whenToUse:
          'Use before BAFO or renewal close when Salesforce pricing spans Sales Cloud or Service Cloud users, platform users, industries, Agentforce, Data 360, Slack, Tableau, MuleSoft, support, sandboxes, storage, APIs, and partner services.',
        buyerAsk:
          'Demand a normalized schedule by user role, product cloud, edition, add-on, entitlement, credit pool, usage metric, renewal baseline, and owner, with removed shelfware priced separately from expansion scope.',
        vendorGive:
          'Salesforce can protect account expansion while giving the buyer cleaner packaging, ramp alignment, co-terming, and clearer consumption governance.',
        tradeoffs: ['Aggressive suite consolidation may improve headline economics but increases dependency unless downsizing, export, and transition rights stay explicit.'],
        evidenceBasis: [SALESFORCE_SOURCE_BASIS.salesPricing, SALESFORCE_SOURCE_BASIS.agentforcePricing, SALESFORCE_SOURCE_BASIS.dataPricing],
      },
      {
        lever: 'AI and Data 360 consumption guardrails',
        whenToUse:
          'Use when Agentforce, Data 360, unstructured data, digital wallet, conversations, or flex credits are included in the proposal or renewal expansion.',
        buyerAsk:
          'Tie any AI or data-credit commitment to named use cases, pilot acceptance criteria, consumption reporting, alert thresholds, rollover or swap rights where available, and governance over customer-data use.',
        vendorGive:
          'Salesforce can retain the expansion path while lowering buyer risk through visibility, phasing, and success-plan commitments.',
        tradeoffs: [
          'Consumption flexibility can accelerate experimentation, but without caps and telemetry it can hide run-rate risk.',
          'Flat per-user AI add-ons can simplify budgeting, but they still require adoption proof and included-feature clarity.',
        ],
        evidenceBasis: [SALESFORCE_SOURCE_BASIS.agentforcePricing, SALESFORCE_SOURCE_BASIS.dataPricing, SALESFORCE_SOURCE_BASIS.trust],
      },
      {
        lever: 'Incumbent renewal pressure with executable alternatives',
        whenToUse:
          'Use when Salesforce is the incumbent system of record and displacement risk is real enough to influence price, terms, or scope but not yet the buyer-preferred outcome.',
        buyerAsk:
          'Separate renewal of essential production scope from optional expansion, require renewal-uplift controls, preserve downgrade rights, and keep credible migration scenarios alive until contract terms close.',
        vendorGive:
          'Salesforce may trade commercial concessions for a longer term, broader platform adoption, executive sponsorship, or committed migration to newer packages.',
        tradeoffs: ['Migration leverage is only credible if the buyer has data export, integration inventory, process impact, and stakeholder adoption evidence.'],
        evidenceBasis: [SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.fy2026Form10K, SALESFORCE_SOURCE_BASIS.founderGap],
      },
    ],
    riskFactors: [
      {
        id: 'salesforce-public-list-price-overreach',
        label: 'Public list price mistaken for enterprise economics',
        severity: 'high',
        detectionSignals: [
          'Business case uses public edition prices without mapping actual add-ons, support, consumption, partner services, taxes, storage, API, or renewal terms.',
          'Discount, ELA, or price-hold assumptions appear in the model without quote, invoice, order-form, or approved benchmark evidence.',
        ],
        mitigations: [
          'Keep public prices as list-price orientation only.',
          'Add TODO/founder-data-gap markers for discount, ELA, and renewal benchmarks until buyer evidence is loaded.',
          'Normalize TCO across base subscription, add-ons, usage, implementation, support, integration, and exit.',
        ],
        contractualRemedies: ['Price-lock exhibit', 'Renewal cap', 'Downsize rights', 'SKU substitution protections', 'Order-form normalization schedule'],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.salesPricing, SALESFORCE_SOURCE_BASIS.agentforcePricing, SALESFORCE_SOURCE_BASIS.dataPricing, SALESFORCE_SOURCE_BASIS.founderGap],
      },
      {
        id: 'salesforce-consumption-credit-drift',
        label: 'Agentforce and Data 360 consumption drift',
        severity: 'high',
        detectionSignals: [
          'Proposal includes flex credits, conversations, profiles, or Data 360 actions without use-case-level volume assumptions.',
          'No owner monitors digital wallet, alerts, threshold behavior, non-rollover assumptions, or term-end true-up exposure.',
        ],
        mitigations: [
          'Pilot the top use cases with measured actions, credits, profiles, queries, and data movement before committing.',
          'Require consumption reporting and alert thresholds in governance.',
          'Separate experimental AI budget from production baseline commitments.',
        ],
        contractualRemedies: ['Consumption reporting covenant', 'Ramp schedule', 'Cap or alert threshold', 'Use-case acceptance gate'],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.agentforcePricing, SALESFORCE_SOURCE_BASIS.dataPricing],
      },
      {
        id: 'salesforce-data-subprocessor-and-exit-gap',
        label: 'Data, subprocessor, and exit gap',
        severity: 'high',
        detectionSignals: [
          'Regulated or sensitive data enters Salesforce before the applicable SPARC, NLI, DPA, infrastructure, and subprocessor review is complete.',
          'Renewal or expansion is approved without a tested data export, retention, deletion, and transition path.',
        ],
        mitigations: [
          'Map ordered services to the current Trust and Compliance documents.',
          'Run privacy, security, and legal review for regulated data classes before production migration.',
          'Test export and transition procedures before renewal leverage expires.',
        ],
        contractualRemedies: ['DPA review', 'Subprocessor notice process', 'Export assistance', 'Deletion certification', 'Transition support'],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.customerAgreements, SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.trust, SALESFORCE_SOURCE_BASIS.subprocessors],
      },
      {
        id: 'salesforce-ecosystem-accountability-fragmentation',
        label: 'Ecosystem accountability fragmentation',
        severity: 'medium',
        detectionSignals: [
          'The scorecard assumes Salesforce, an SI, and AppExchange vendors will collectively deliver the outcome without assigning failure ownership.',
          'Implementation services, custom integrations, data migration, non-SFDC applications, and support handoffs are outside the core order form.',
        ],
        mitigations: [
          'Create a RACI for Salesforce, SI, ISV, buyer IT, business owner, data owner, and security owner.',
          'Tie go-live acceptance to integration, data migration, security, user adoption, and workflow evidence.',
          'Separate software subscription commitments from implementation milestone risk.',
        ],
        contractualRemedies: ['Implementation acceptance criteria', 'Partner responsibility matrix', 'Escalation path', 'Service credit and remediation plan'],
        sourceBasis: [SALESFORCE_SOURCE_BASIS.msa, SALESFORCE_SOURCE_BASIS.fy2026Form10K],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier:
          'Raise PHI boundary, BAA, minimum-necessary data, access logging, subprocessor, and AI-use review before any Health Cloud, Service Cloud, or Data 360 production migration.',
        additionalRequirements: ['BAA availability review', 'PHI data-flow map', 'AI/customer-data governance review'],
      },
      {
        industry: 'financial_services',
        modifier:
          'Raise resilience, audit, exit, outsourcing, data-location, AI governance, and regulatory-change review for regulated financial entities.',
        regulatoryRefs: ['DORA where applicable to EU financial entities', 'GLBA where applicable'],
      },
      {
        industry: 'manufacturing',
        modifier:
          'Stress dealer, distributor, installed-base, CPQ, order handoff, warranty, field service, and ERP integration proof before expanding the Salesforce footprint.',
        affectedStages: ['RFP', 'BAFO'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Add procurement transparency, accessibility, records retention, data residency, security authorization, and sovereign-cloud review before award.',
        additionalRequirements: ['Accessibility evidence', 'Records/export requirements', 'Security authorization mapping'],
      },
    ],
    body: `## Summary
Salesforce should be sourced as an enterprise customer operating platform, not as a simple CRM seat renewal. The current public evidence supports a broad Salesforce platform frame: the FY2026 Form 10-K describes Salesforce as a global CRM technology company built around the Agentforce 360 Platform, customer data, integrated AI, and multiple enterprise cloud offerings. Public pricing pages also show that the commercial model is no longer only named CRM users. Sales Cloud editions provide list-price orientation, while Agentforce and Data 360 introduce consumption credits, conversations, profile-based pricing, add-ons, and digital-wallet monitoring. A sourcing event that compares only per-user CRM subscription lines will miss the economics that matter most in a modern Salesforce estate.

## Sourcing posture
Use this profile when Salesforce is the incumbent, a finalist, or a proposed expansion platform. The buyer should split the event into four linked decisions: core CRM scope, platform and ecosystem scope, AI/data consumption scope, and renewal/exit control. Core CRM scope covers Sales Cloud, Service Cloud, industry clouds, platform workflow, users, permissions, objects, reporting, support, storage, sandboxes, APIs, and integration. Platform scope covers AppExchange applications, MuleSoft, Tableau, Slack, custom development, data migration, and SI delivery. AI/data scope covers Agentforce, Data 360, flex credits, conversations, profiles, unstructured data, prompts, agents, telemetry, governance, and customer-data restrictions. Renewal/exit control covers term, price protection, SKU substitution, downgrade rights, data export, deletion, transition support, and non-SFDC dependency management.

## Evidence boundaries
Public Salesforce pages are useful but narrow. They verify published package names, list-price constructs, consumption models, trust-document locations, agreement families, and SEC-disclosed business context. They do not verify a buyer's actual net price, discount percentage, ELA treatment, renewal uplift, shelfware, support concession, partner-services multiple, migration cost, or AI consumption profile. Those items remain TODO/founder-data-gap until AbarVa has an approved buyer quote, order form, invoice, billing export, finalist proposal, or licensed benchmark. Do not convert public list prices into negotiated benchmarks. Do not invent discount bands. Do not assume that a bundled quote is cheaper unless every included SKU, usage limit, credit entitlement, and renewal baseline is visible.

## Commercial normalization
The Salesforce comparison worksheet should separate named users by role and cloud, edition, add-on, support plan, sandbox and environment needs, storage, API and integration limits, Data 360 profiles or credits, Agentforce credits or conversations, unstructured-data processing, Slack/Tableau/MuleSoft adjacency, AppExchange subscriptions, SI services, training, admin capacity, and exit work. Every line should identify whether it is essential production scope, optional expansion, a migration dependency, or an adoption bet. This matters because the MSA and order-form model tie purchased services, users, usage limits, and documentation together. If contractual usage limits are exceeded, the buyer may need additional quantities or payment for excess usage. The sourcing model therefore needs threshold owners before signature, not after the first overage or true-up conversation.

## Negotiation plays
First, force license-role normalization before commercial close. Salesforce's breadth can be valuable, but breadth also creates room for shelfware and bundled ambiguity. Ask for each cloud, add-on, and usage metric to be priced and renewable independently, then decide which items earn term commitment. Second, treat Agentforce and Data 360 as governed consumption programs. A pilot should define actions, credits, profiles, data movement, business outcome, owner, monitoring cadence, alert thresholds, and acceptance criteria. Third, preserve incumbent leverage. If Salesforce is the system of record, replacement may be difficult, but not impossible. Renewal pressure is credible only when the buyer has export evidence, integration inventory, stakeholder process maps, alternative architecture, and a transition timeline. Fourth, separate Salesforce accountability from partner accountability. Non-SFDC applications, SI services, custom integrations, and data migration should have their own RACI, milestones, warranties, acceptance gates, and escalation paths.

## Risk posture
The highest risk is commercial opacity: public list prices are visible, but enterprise economics are quote-driven and shaped by scope, term, bundle, timing, product mix, support, and consumption. The second risk is consumption drift in AI and data services, where useful experimentation can become ungoverned run rate. The third risk is data and subprocessor mismatch, especially when regulated or sensitive data enters services before the correct Trust and Compliance documentation, DPA posture, infrastructure model, and subprocessor evidence are reviewed. The fourth risk is implementation fragmentation: Salesforce, an SI, AppExchange vendors, buyer IT, security, data owners, and business sponsors can each own part of the outcome while no one owns the whole failure mode.

## Award gate
Before award or renewal, require a final Salesforce control pack: normalized SKU and usage schedule, public-price-to-net-price bridge with no unsupported discount claims, TODO/founder-data-gap list for missing ELA or benchmark data, AI/Data 360 use-case plan, security and privacy evidence, subprocessor review, implementation RACI, renewal protections, export and deletion plan, and executive acceptance of residual risk. The profile is award-ready only when the buyer can explain what is being bought, why each expansion item is needed, how consumption will be governed, how data will be protected, and how the organization can renew, reduce, or exit without discovering the controls after leverage is gone.`,
  },
];
