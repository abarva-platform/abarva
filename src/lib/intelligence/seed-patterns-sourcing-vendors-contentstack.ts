import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const CONTENTSTACK_SOURCE_BASIS = {
  platform: {
    type: 'public-disclosure',
    label: 'Contentstack platform overview',
    url: 'https://www.contentstack.com/platform',
    asOf: SOURCE_AS_OF,
    note: 'Contentstack positions its platform as an Agentic Experience Platform that unifies content, real-time data, personalization, AI automation, and digital experience operations.',
  },
  headlessCms: {
    type: 'public-disclosure',
    label: 'Contentstack Headless Content Management',
    url: 'https://www.contentstack.com/platforms/headless-cms',
    asOf: SOURCE_AS_OF,
    note: 'Public product page describes API-first cloud-native headless CMS, content modeling, visual editing, workflows, multilingual management, teams, taxonomy, preview sharing, and branches.',
  },
  pricing: {
    type: 'public-disclosure',
    label: 'Contentstack plans comparison',
    url: 'https://www.contentstack.com/pricing',
    asOf: SOURCE_AS_OF,
    note: 'Plans page identifies Headless CMS, Real-time CDP, and Agentic Experience Platform solution families and lists capability areas without publishing buyer-specific enterprise net pricing.',
  },
  cdp: {
    type: 'public-disclosure',
    label: 'Contentstack Real-Time Data and Insights',
    url: 'https://www.contentstack.com/platforms/real-time-cdp',
    asOf: SOURCE_AS_OF,
    note: 'Public product page describes first-party data activation, real-time identity resolution, data-source connections, audience profiles, segmentation, and reporting.',
  },
  personalization: {
    type: 'public-disclosure',
    label: 'Contentstack Omnichannel Personalization',
    url: 'https://www.contentstack.com/platforms/omnichannel-personalization',
    asOf: SOURCE_AS_OF,
    note: 'Public product page describes content, data, journey orchestration, experimentation, audience insights, and personalization capabilities.',
  },
  ai: {
    type: 'public-disclosure',
    label: 'Contentstack Agents and Automations',
    url: 'https://www.contentstack.com/platforms/ai',
    asOf: SOURCE_AS_OF,
    note: 'Public product page describes Polaris, Agent Builder, Digital Concierge, Brand Kit, AI flows, automation, and content or audience-data-grounded assistants.',
  },
  launch: {
    type: 'public-disclosure',
    label: 'Contentstack Launch front-end hosting',
    url: 'https://www.contentstack.com/platforms/launch',
    asOf: SOURCE_AS_OF,
    note: 'Public product page describes integrated front-end hosting, deployment webhooks, cache revalidation, cloud functions, edge functions, and AWS, Azure, and GCP availability.',
  },
  docsDevelopers: {
    type: 'public-disclosure',
    label: 'Contentstack developer resources',
    url: 'https://www.contentstack.com/docs/developers',
    asOf: SOURCE_AS_OF,
    note: 'Developer documentation indexes APIs, SDKs, CLI, content modeling, environments, tokens, content fetching, Launch, Automate, marketplace apps, and security management.',
  },
  contentManagementApi: {
    type: 'public-disclosure',
    label: 'Contentstack Content Management API',
    url: 'https://www.contentstack.com/docs/developers/apis/content-management-api',
    asOf: SOURCE_AS_OF,
    note: 'API documentation describes regional API endpoints, authenticated management APIs, read-write content management, and guidance to use Content Delivery APIs for delivery use cases.',
  },
  contentDeliveryApi: {
    type: 'public-disclosure',
    label: 'Contentstack Content Delivery API',
    url: 'https://www.contentstack.com/docs/developers/apis/content-delivery-api',
    asOf: SOURCE_AS_OF,
    note: 'API documentation describes delivery endpoints for published content and delivery-oriented API behavior.',
  },
  graphqlDelivery: {
    type: 'public-disclosure',
    label: 'Contentstack GraphQL Content Delivery API',
    url: 'https://www.contentstack.com/docs/developers/apis/graphql-content-delivery-api',
    asOf: SOURCE_AS_OF,
    note: 'API documentation describes GraphQL delivery for published content.',
  },
  regions: {
    type: 'public-disclosure',
    label: 'Contentstack regions documentation',
    url: 'https://www.contentstack.com/docs/developers/contentstack-regions',
    asOf: SOURCE_AS_OF,
    note: 'Documentation describes supported data-center regions across AWS, Azure, and GCP and states that customers choose the data center hosting organization data while subscribing.',
  },
  sso: {
    type: 'public-disclosure',
    label: 'Contentstack single sign-on documentation',
    url: 'https://www.contentstack.com/docs/developers/single-sign-on/about-single-sign-on-sso',
    asOf: SOURCE_AS_OF,
    note: 'Documentation says Contentstack supports SAML 2.0 SSO and can integrate with identity providers that support SAML 2.0.',
  },
  scim: {
    type: 'public-disclosure',
    label: 'Contentstack SCIM API documentation',
    url: 'https://www.contentstack.com/docs/developers/apis/scim-api',
    asOf: SOURCE_AS_OF,
    note: 'Documentation describes SCIM 2.0 user provisioning, deprovisioning, group mapping, regional auth endpoints, and rate limits.',
  },
  roles: {
    type: 'public-disclosure',
    label: 'Contentstack role documentation',
    url: 'https://www.contentstack.com/docs/developers/invite-users-and-assign-roles/types-of-roles',
    asOf: SOURCE_AS_OF,
    note: 'Documentation describes system roles, custom roles, permissions, audit log, and publish queue access.',
  },
  branches: {
    type: 'public-disclosure',
    label: 'Contentstack branches documentation',
    url: 'https://www.contentstack.com/docs/developers/branches/about-branches',
    asOf: SOURCE_AS_OF,
    note: 'Documentation describes branches as independent workspaces for content model development and testing without affecting production content.',
  },
  environments: {
    type: 'public-disclosure',
    label: 'Contentstack environments documentation',
    url: 'https://www.contentstack.com/docs/developers/set-up-environments/about-environments',
    asOf: SOURCE_AS_OF,
    note: 'Documentation describes environments as publishing destinations and notes that published content must be fetched by the buyer website or application.',
  },
  trust: {
    type: 'public-disclosure',
    label: 'Contentstack trust and security page',
    url: 'https://www.contentstack.com/trust',
    asOf: SOURCE_AS_OF,
    note: 'Trust page describes security, system status, data centers, compliance, GDPR, ISO 27001, SOC 2, two-factor authentication, data encryption, and log data retention themes.',
  },
  securityAddendum: {
    type: 'public-disclosure',
    label: 'Contentstack Security Addendum',
    url: 'https://www.contentstack.com/legal/security-addendum',
    asOf: SOURCE_AS_OF,
    note: 'Security addendum describes access controls, access monitoring, incident management, 48-hour customer notification language, and DORA customer notification language.',
  },
  msa: {
    type: 'public-disclosure',
    label: 'Contentstack Master Agreement',
    url: 'https://www.contentstack.com/legal/master-subscription-agreement',
    asOf: SOURCE_AS_OF,
    note: 'Master agreement defines order forms, fees, overage charges, customer data, usage data, customer responsibilities, DPA, security addendum, services description, renewal, suspension, and data download or deletion mechanics.',
  },
  servicesDescription: {
    type: 'public-disclosure',
    label: 'Contentstack Services Description',
    url: 'https://www.contentstack.com/legal/services-description',
    asOf: SOURCE_AS_OF,
    note: 'Services description identifies service commitments, response times, service credits, fair-use policies, API limits, content limits, environments, locales, stacks, branches, add-ons, and beta-service treatment.',
  },
  subprocessors: {
    type: 'public-disclosure',
    label: 'Contentstack Sub-processors',
    url: 'https://www.contentstack.com/legal/subprocessors',
    asOf: SOURCE_AS_OF,
    note: 'Subprocessor page provides the public diligence path for supplier and hosting dependency review.',
  },
} satisfies Record<string, SourceBasisRef>;

const CONTENTSTACK_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label:
    'Buyer-specific Contentstack quote, order form, usage export, content model inventory, traffic profile, API rate history, implementation plan, agency SOW, and security approval evidence',
  note:
    'Public Contentstack sources describe products, plan families, terms, controls, rate-limit concepts, and support or service-credit mechanics. They do not establish private net price, discount band, renewal uplift, migration credit, agency cost, add-on economics, overage exposure, or tenant-specific approval.',
};

const CONTENTSTACK_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Digital experience and content estate scope',
    order: 1,
    description:
      'Baseline sites, apps, brands, locales, environments, content models, workflows, APIs, personalization, CDP, AI, Launch, marketplace, agency, and regulated-data boundaries before comparing commercial options.',
  },
  {
    id: 'MarketScan',
    label: 'Composable DXP and incumbent comparison',
    order: 2,
    description:
      'Compare Contentstack against incumbent CMS, DXP, CDP, personalization, hosting, and composable-stack alternatives using buyer workloads rather than vendor category labels.',
  },
  {
    id: 'Proof',
    label: 'Scripted content, data, and delivery proof',
    order: 3,
    description:
      'Run buyer-authored proofs for content modeling, editorial workflow, localization, preview, delivery APIs, branch promotion, personalization, CDP activation, AI governance, and deployment paths.',
  },
  {
    id: 'BAFO',
    label: 'Plan, usage, implementation, and renewal normalization',
    order: 4,
    description:
      'Normalize plans, stacks, environments, locales, entries, assets, API limits, Launch, CDP, AI, support, add-ons, implementation services, overage treatment, and renewal protections before BAFO.',
  },
  {
    id: 'Contracting',
    label: 'Trust, data, resilience, and exit lock',
    order: 5,
    description:
      'Close DPA, security addendum, subprocessor review, region choice, incident commitments, SLA/service credits, audit evidence, export, deletion, transition assistance, and agency handoff obligations.',
  },
];

export const PAT_SRC_VEN_CONTENTSTACK_001: PatternSeed = {
  id: 'PAT-SRC-VEN-CONTENTSTACK-001',
  slug: 'contentstack-headless-cms-agentic-dxp-sourcing-profile',
  title: 'Contentstack Headless CMS and Agentic DXP Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Contentstack sourcing should treat the vendor as a composable digital-experience operating layer spanning headless CMS, APIs, personalization, CDP, AI automation, front-end hosting, governance, and agency delivery, not as a simple CMS subscription.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking Contentstack for headless CMS, composable DXP, web or app content operations, multilingual publishing, personalization, real-time CDP, agentic workflows, Launch hosting, marketplace integrations, or a migration away from monolithic CMS/DXP estates.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-contentstack',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(CONTENTSTACK_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'DORA-if-regulated-financial-entity',
    'CCPA-CPRA-if-California-consumer-data',
    'PCI-DSS-if-cardholder-data-enters-digital-experience-stack',
    'HIPAA-if-PHI-or-health-content',
    'Data-residency-if-region-specific-hosting-required',
    'EU-AI-Act-review-if-AI-or-agentic-capabilities-enabled',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-CMS-001', 'PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-PRC-SAAS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  lifecycleStages: CONTENTSTACK_LIFECYCLE_STAGES,
  perStageGateCriteria: {
    Scope: [
      {
        id: 'contentstack-estate-boundary',
        stageId: 'Scope',
        gateType: 'hard',
        description: 'The buyer has separated core CMS scope from CDP, personalization, AI, Launch, implementation, marketplace, and agency scope.',
        evaluationHint:
          'Require an inventory of sites, apps, brands, locales, stacks, content types, entries, assets, environments, branches, APIs, workflows, integrations, data sources, and owners before scoring Contentstack against alternatives.',
      },
    ],
    Proof: [
      {
        id: 'contentstack-scripted-dxp-proof',
        stageId: 'Proof',
        gateType: 'hard',
        description: 'Contentstack and the implementation team demonstrate buyer-authored content operations and delivery scenarios.',
        evaluationHint:
          'The proof should include content-model change, branch workflow, localized publishing, preview, API delivery, personalization or CDP activation where in scope, Launch deployment where in scope, rollback or release evidence, and admin/audit evidence.',
      },
    ],
    BAFO: [
      {
        id: 'contentstack-commercial-normalization',
        stageId: 'BAFO',
        gateType: 'hard',
        description: 'Commercial comparison separates subscription, fair-use limits, add-ons, overages, support, hosting, CDP, AI, implementation, and renewal mechanics.',
        evaluationHint:
          'Reject headline platform pricing if stacks, branches, environments, locales, entries, assets, API requests, Launch, CDP, AI, add-ons, support, service credits, agency scope, and renewal terms are not normalized.',
      },
    ],
  },
  perStageExpectedArtifacts: {
    Scope: [
      {
        id: 'contentstack-digital-estate-inventory',
        label: 'Contentstack digital estate inventory',
        stageId: 'Scope',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Inventory brands, channels, locales, content models, assets, environments, stacks, users, roles, integrations, delivery APIs, data sources, hosting boundaries, and regulated-data classes.',
      },
    ],
    Proof: [
      {
        id: 'contentstack-scripted-proof-pack',
        label: 'Scripted CMS, API, personalization, and hosting proof pack',
        stageId: 'Proof',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Buyer-authored proof scripts for model changes, editorial workflow, localization, preview, branch promotion, delivery API behavior, personalization/CDP scenarios, AI controls, Launch deployment, and rollback.',
      },
    ],
    Contracting: [
      {
        id: 'contentstack-trust-data-exit-exhibit',
        label: 'Trust, data, resilience, and exit exhibit',
        stageId: 'Contracting',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Contract exhibit covering DPA, security addendum, subprocessor list, region selection, incident contacts, SLA/service-credit treatment, export, deletion, transition assistance, and implementation responsibility split.',
      },
    ],
  },
  vendorLandscape: [
    {
      vendorName: 'Contentstack',
      tier: 'enterprise',
      positioning:
        'Enterprise digital experience vendor spanning API-first headless CMS, content governance, visual editing, workflows, multilingual publishing, real-time data and insights, omnichannel personalization, AI agents and automations, and integrated front-end hosting.',
      strengths: [
        'Official product pages and docs provide a broad public baseline for CMS, CDP, personalization, AI automation, Launch hosting, developer APIs, regions, SSO, SCIM, roles, branches, environments, trust, and legal terms',
        'Composable architecture can help buyers decouple content from presentation while still giving content teams visual editing, preview, workflow, taxonomy, and governance capabilities',
        'Public region documentation and trust materials create a diligence path for cloud provider, region, data-center, compliance, security, support, and incident review',
      ],
      cautions: [
        'Public plan pages do not prove buyer-specific enterprise net price, renewal uplift, private discount, add-on economics, migration cost, agency cost, or implementation concession',
        'The sourcing event can sprawl from CMS into CDP, personalization, AI, hosting, marketplace apps, and agency scope unless each capability has a named owner and acceptance test',
        'Value depends on content model governance, API design, localization process, frontend architecture, data consent, identity controls, and implementation quality, not only access to the Contentstack platform',
      ],
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.platform,
        CONTENTSTACK_SOURCE_BASIS.headlessCms,
        CONTENTSTACK_SOURCE_BASIS.pricing,
        CONTENTSTACK_SOURCE_BASIS.trust,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public Contentstack plan and capability orientation only',
      model: 'subscription',
      metric:
        'Plan family, Headless CMS, Real-time CDP, Agentic Experience Platform, stacks, environments, locales, entries, assets, API usage, Launch, AI, support, add-ons, service credits, fair-use limits, and order-form metrics',
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.pricing,
        CONTENTSTACK_SOURCE_BASIS.servicesDescription,
        CONTENTSTACK_SOURCE_BASIS.msa,
      ],
      confidence: 0.67,
      notes:
        'Use public plan and legal materials to identify capability areas, order-form dependency, overage constructs, fair-use boundaries, service-level concepts, and add-on treatment. Do not infer private enterprise net pricing, discounts, renewal caps, professional-services cost, reseller margin, migration credits, or agency economics without buyer-specific evidence.',
    },
    {
      label: 'Buyer-specific Contentstack benchmark gap',
      model: 'unknown',
      sourceBasis: [CONTENTSTACK_BUYER_DATA_GAP],
      confidence: 0.15,
      notes:
        'Populate numeric benchmarks only from current quotes, signed order forms, invoices, renewal notices, usage exports, API logs, add-on schedules, Launch/CDP/AI entitlement exhibits, implementation SOWs, and approved benchmark submissions.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Capability, usage, and estate boundary',
      buyerPosition:
        'Attach an entitlement schedule separating CMS, stacks, spaces or organizations, content types, entries, assets, locales, environments, branches, roles, SSO, SCIM, APIs, delivery traffic, Launch, CDP, personalization, AI, Automate, marketplace apps, support, professional services, add-ons, overages, and renewal basis.',
      fallbackPosition:
        'If final estate metrics are incomplete, split committed baseline from optional expansion and require product-owner, architecture, finance, security, privacy, and implementation-owner signoff before scaling.',
      walkawayTriggers: [
        'Quote bundles CMS, CDP, AI, hosting, add-ons, implementation, and support without a line-item entitlement and renewal schedule',
        'Order form does not define overage rates, fair-use assumptions, add-on treatment, support scope, downgrade rights, or expansion pricing for material digital properties',
      ],
      sourceBasis: [CONTENTSTACK_SOURCE_BASIS.pricing, CONTENTSTACK_SOURCE_BASIS.servicesDescription, CONTENTSTACK_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Data, security, region, subprocessor, and incident controls',
      buyerPosition:
        'Map customer data, personal data, audience data, content assets, API logs, support access, data-center region, cloud provider, subprocessor review, SSO, SCIM, roles, audit-log needs, incident notice, and DORA-specific obligations where applicable to the purchased services.',
      fallbackPosition:
        'If privacy or security review is incomplete, restrict production activation to non-regulated content and require DPA, security addendum, region, subprocessor, access-control, incident, export, and deletion evidence before regulated data enters the platform.',
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.regions,
        CONTENTSTACK_SOURCE_BASIS.trust,
        CONTENTSTACK_SOURCE_BASIS.securityAddendum,
        CONTENTSTACK_SOURCE_BASIS.subprocessors,
      ],
    },
    {
      clauseArea: 'Implementation, API delivery, Launch, and exit dependency',
      buyerPosition:
        'Define implementation roles across Contentstack, agency, buyer developers, marketing operations, data owners, and hosting owners; attach acceptance tests for content model, APIs, preview, deployment, cache revalidation, rollback, export, deletion, and transition assistance.',
      fallbackPosition:
        'If implementation ownership is not locked, make the first production migration a gated pilot and keep incumbent CMS, frontend hosting, and content export fallback active until acceptance evidence is approved.',
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.docsDevelopers,
        CONTENTSTACK_SOURCE_BASIS.contentManagementApi,
        CONTENTSTACK_SOURCE_BASIS.launch,
        CONTENTSTACK_SOURCE_BASIS.msa,
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Composable DXP decomposition before bundle expansion',
      whenToUse:
        'Use when the seller proposes Contentstack as a broader platform across CMS, CDP, personalization, AI, hosting, marketplace, and implementation scope.',
      buyerAsk:
        'Require separate value, entitlement, usage metric, implementation owner, acceptance test, renewal treatment, add-on pricing, and termination or downgrade path for each capability family.',
      tradeoffs: [
        'Decomposition can slow BAFO, but it prevents a CMS decision from silently becoming a CDP, AI, hosting, and agency transformation commitment.',
      ],
      evidenceBasis: [CONTENTSTACK_SOURCE_BASIS.platform, CONTENTSTACK_SOURCE_BASIS.pricing, CONTENTSTACK_BUYER_DATA_GAP],
    },
    {
      lever: 'Content operations proof before migration commitment',
      whenToUse:
        'Use before committing to a major CMS migration, multi-brand rollout, multilingual publishing transformation, or incumbent DXP replacement.',
      buyerAsk:
        'Trade term or volume commitment only after a scripted proof shows content modeling, preview, workflow, localization, API delivery, branch management, release governance, and rollback under buyer data and agency constraints.',
      evidenceBasis: [
        CONTENTSTACK_SOURCE_BASIS.headlessCms,
        CONTENTSTACK_SOURCE_BASIS.branches,
        CONTENTSTACK_SOURCE_BASIS.environments,
        CONTENTSTACK_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'API, fair-use, and overage risk normalization',
      whenToUse:
        'Use when business value depends on high-volume delivery, global brands, many locales, multiple environments, automation, or Launch-hosted experiences.',
      buyerAsk:
        'Build an API, asset, entry, environment, locale, branch, delivery, cache, and hosting forecast; cap overage exposure; define increase-request process; and require monitoring exports before renewal uplift is accepted.',
      evidenceBasis: [CONTENTSTACK_SOURCE_BASIS.servicesDescription, CONTENTSTACK_SOURCE_BASIS.contentDeliveryApi, CONTENTSTACK_BUYER_DATA_GAP],
    },
  ],
  riskFactors: [
    {
      id: 'contentstack-composable-scope-sprawl',
      label: 'Composable DXP scope sprawl',
      severity: 'high',
      detectionSignals: [
        'Sourcing record starts as a CMS renewal but includes CDP, personalization, AI agents, Launch hosting, marketplace apps, agency work, and data activation without separate business owners',
        'Executive business case assumes incumbent DXP retirement before content model, frontend, API, localization, data, and migration acceptance criteria are proven',
      ],
      mitigations: [
        'Create a capability-by-capability scope schedule',
        'Run buyer-authored proof scenarios before BAFO',
        'Separate software, data, hosting, implementation, and agency costs',
      ],
      contractualRemedies: ['Entitlement schedule', 'Implementation acceptance gate', 'Downgrade rights', 'Renewal cap', 'Exit assistance'],
      sourceBasis: [CONTENTSTACK_SOURCE_BASIS.platform, CONTENTSTACK_SOURCE_BASIS.pricing, CONTENTSTACK_BUYER_DATA_GAP],
    },
    {
      id: 'contentstack-content-model-and-api-governance-gap',
      label: 'Content model and API governance gap',
      severity: 'high',
      detectionSignals: [
        'Teams migrate content without a governed content-type model, taxonomy, locale strategy, branch promotion process, API ownership, or frontend release plan',
        'Proof focuses on editorial UI while delivery APIs, preview behavior, cache, webhooks, rollback, monitoring, and customer-facing performance are not tested',
      ],
      mitigations: [
        'Require architecture and content-operations signoff on model, API, localization, preview, and release workflow',
        'Make delivery and rollback tests part of acceptance before production migration',
      ],
      contractualRemedies: ['Acceptance test exhibit', 'Implementation SOW milestones', 'Transition assistance', 'Export and deletion language'],
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.headlessCms,
        CONTENTSTACK_SOURCE_BASIS.contentManagementApi,
        CONTENTSTACK_SOURCE_BASIS.contentDeliveryApi,
        CONTENTSTACK_SOURCE_BASIS.branches,
      ],
    },
    {
      id: 'contentstack-ai-cdp-and-consent-risk',
      label: 'AI, CDP, personalization, and consent risk',
      severity: 'medium',
      detectionSignals: [
        'AI agents, personalization, or real-time CDP are enabled before privacy, consent, identity, data-source, prompt/output, human-review, and audit requirements are approved',
        'Marketing uses audience data or personalization logic without documented data source, retention, regional, subprocessor, and opt-out controls',
      ],
      mitigations: [
        'Gate CDP, personalization, and AI activation through privacy, security, legal, marketing operations, data governance, and architecture review',
        'Separate CMS-only approval from CDP, personalization, AI, and external conversational assistant approval',
      ],
      contractualRemedies: ['DPA exhibit', 'AI governance exhibit', 'Data-source schedule', 'Subprocessor review', 'Audit and logging commitments'],
      sourceBasis: [
        CONTENTSTACK_SOURCE_BASIS.cdp,
        CONTENTSTACK_SOURCE_BASIS.personalization,
        CONTENTSTACK_SOURCE_BASIS.ai,
        CONTENTSTACK_SOURCE_BASIS.securityAddendum,
      ],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Validate multi-brand, multi-locale, campaign velocity, personalization, commerce integration, consent, customer-data boundaries, CDN/API traffic, seasonal peak behavior, agency handoff, and rollback before retiring incumbent CMS or personalization tools.',
      regulatoryRefs: ['GDPR-if-EU-consumers', 'CCPA-CPRA-if-California-consumers', 'PCI-DSS-if-cardholder-data-enters-scope'],
      affectedStages: ['Scope', 'Proof', 'BAFO', 'Contracting'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Raise outsourcing, DORA, operational resilience, incident notification, region, subprocessor, audit, access review, records retention, website availability, consent, and AI governance scrutiny when Contentstack supports regulated customer-facing journeys.',
      regulatoryRefs: ['DORA-if-EU-regulated-financial-entity', 'GLBA-if-US-financial-data', 'local-outsourcing-rules-if-material-ICT'],
      affectedStages: ['Scope', 'Proof', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm whether PHI, patient identifiers, support data, analytics events, forms, personalization data, or visitor chat content will enter the platform; require BAA posture, privacy review, access controls, export, deletion, and AI restrictions before any PHI-related workflow.',
      regulatoryRefs: ['HIPAA', 'HITECH'],
      affectedStages: ['Scope', 'Proof', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate procurement vehicle, accessibility, records retention, regional hosting, incident reporting, cloud provider, subprocessor review, audit evidence, public website availability, content archiving, and exit requirements before platform award.',
      regulatoryRefs: ['WCAG-2.2-if-public-digital-channel', 'FedRAMP-if-government-workload-requires-it'],
      affectedStages: ['Scope', 'BAFO', 'Contracting'],
    },
  ],
  body: `## Summary
Contentstack should be sourced as a composable digital-experience operating layer, not as a narrow CMS subscription. Public Contentstack materials position the platform around headless content management, real-time data and insights, omnichannel personalization, agents and automations, and integrated front-end hosting. The Headless CMS page describes API-first, cloud-native content management with structured content modeling, visual editing, workflows, multilingual management, taxonomy, teams, preview sharing, and branches. The platform overview frames Contentstack as an Agentic Experience Platform that unifies content, real-time data, and AI-driven automation. That breadth is useful, but it means procurement must separate what is being bought: CMS foundation, content operations, delivery APIs, CDP, personalization, AI, Launch hosting, marketplace apps, implementation services, and partner or agency delivery.

## When to apply
Use this profile when Contentstack is an incumbent, finalist, expansion candidate, migration platform, or benchmark vendor for headless CMS, composable DXP, web and app content operations, multilingual publishing, personalization, customer data activation, agentic marketing workflows, front-end hosting, or a replacement of monolithic CMS/DXP estates. It is especially relevant when marketing wants faster publishing, developers want API-first delivery, digital leaders want composable architecture, or executives want one vendor story for content, data, AI, and hosting. The pattern does not assume Contentstack is the right technical answer. It forces the sourcing record to prove what the buyer will run on Contentstack, what remains outside the platform, who owns implementation, and which commercial and risk obligations belong in the order form.

## Commercial normalization
Contentstack public pricing materials are useful for capability orientation, not private enterprise benchmarking. The public plans page identifies Headless CMS, Real-time CDP, and Agentic Experience Platform solution areas and lists capabilities such as personalization engine, real-time data activation, no-code agents and automations, brand-aware AI, visual building and editing, granular permissions, custom workflows, and integrated app and front-end hosting. The Master Agreement points buyers back to order forms for fees, order-form metrics, overage charges, subscription terms, renewals, and suspension. The Services Description adds sourcing-relevant mechanics: service commitments by plan family, response-time schedules, service credits, fair-use policies, API limits, content limits, environment and locale limits, stack and branch limits, add-on treatment, and beta-service treatment. Use these facts to build the workbook. Do not infer net price, discounts, renewal uplift, migration funding, implementation credits, reseller margin, agency cost, Launch economics, CDP pricing, AI usage economics, or overage exposure without current buyer-specific evidence.

## Sourcing gates
The scope gate should inventory digital properties, brands, countries, languages, locales, content types, entries, assets, environments, branches, release workflows, users, roles, SSO, SCIM, APIs, webhooks, CDN or delivery expectations, CDP data sources, consent boundaries, personalization journeys, AI use cases, Launch projects, marketplace apps, and implementation partners. The proof gate should be scripted by the buyer, not by the vendor demo team alone. Require one content model change, one editorial workflow, one localized publishing path, one preview flow, one branch or environment promotion path, one delivery API test, one rollback or release-management scenario, one identity and role review, and one export or transition test. If CDP, personalization, AI, or Launch are in scope, add data ingestion, identity resolution, segment activation, journey orchestration, prompt or output review, agent guardrails, deployment webhook, cache revalidation, and hosting incident scenarios.

## Trust, privacy, and resilience
Contentstack trust and legal materials provide useful diligence anchors. The trust page describes system status, security, data centers, compliance, GDPR, ISO 27001, SOC 2, two-factor authentication, encryption, and log data retention themes. Region documentation says organization data is hosted in customer-selected regions across AWS, Azure, and GCP options, with specific primary and backup regions documented. SSO documentation describes SAML 2.0 SSO, and SCIM documentation describes provisioning and deprovisioning through SCIM 2.0. The Security Addendum describes access controls, access monitoring, incident management, customer notification language, and DORA-specific notification language. Treat these sources as evidence pathways, not final approval. The sourcing file still needs tenant-specific region, data class, subprocessor, audit, incident contact, support, export, deletion, and regulated-use signoff.

## Pitfalls
The first failure mode is scope sprawl. A CMS purchase can become a CDP, personalization, AI, hosting, marketplace, and agency transformation before the buyer has owners or acceptance criteria for each lane. The second failure mode is content-model underinvestment. API-first CMS value depends on governed content types, taxonomy, workflows, localization, preview, release discipline, and frontend architecture. The third failure mode is commercial opacity. Fair-use limits, API rate behavior, assets, entries, locales, environments, branches, stacks, add-ons, support, service credits, Launch, AI, and CDP scope must be made explicit before BAFO. The fourth failure mode is data and consent overreach. Real-time CDP, personalization, and AI agents may touch customer data, audience profiles, prompts, generated content, website visitor interactions, and behavioral events. Keep public claims traceable, keep private economics blank, and require every recommendation to connect product capability to buyer-specific adoption evidence, content governance, privacy approval, security controls, implementation ownership, and exit readiness.`,
};
