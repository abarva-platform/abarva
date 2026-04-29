import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const ACQUIA_SOURCE_BASIS = {
  experiencePlatform: {
    type: 'public-disclosure',
    label: 'Acquia Experience Platform overview',
    url: 'https://www.acquia.com/products/acquia-experience-platform',
    asOf: SOURCE_AS_OF,
    note: 'Official Acquia page positioning Acquia Experience Platform around Drupal starter kits, Cloud IDEs, Cloud Platform, Site Factory, and customer or employee applications built on the platform.',
  },
  cloudPlatformUseCases: {
    type: 'public-disclosure',
    label: 'Acquia Cloud Platform use cases',
    url: 'https://www.acquia.com/products/acquia-cloud-platform/use-cases',
    asOf: SOURCE_AS_OF,
    note: 'Official product page describing Acquia Cloud Platform support, deployment workflow, performance, uptime, availability, DR, CDN, API, and Drupal application support positioning.',
  },
  cloudPlatformGuide: {
    type: 'public-disclosure',
    label: 'Acquia Cloud Platform Product Guide',
    url: 'https://docs.acquia.com/acquia-cloud-platform/cloud-platform-product-guide',
    asOf: SOURCE_AS_OF,
    note: 'Official product guide describing Cloud Platform management console and API, Drupal application management services, support references, CDN treatment, traffic entitlement, capacity buffer, and overage handling.',
  },
  serviceLevelPolicy: {
    type: 'public-disclosure',
    label: 'Acquia Service Level Policy - Product Guide',
    url: 'https://docs.acquia.com/service-offerings/service-level-policy-product-guide',
    asOf: SOURCE_AS_OF,
    note: 'Official service-level policy for Cloud Platform Enterprise and Site Factory PaaS, including base 99.95% production PaaS infrastructure availability, premium 99.99% add-on conditions, service extensions, exclusions, and customer responsibility boundaries.',
  },
  productsServicesGuide: {
    type: 'public-disclosure',
    label: 'Acquia Products and Services Guide',
    url: 'https://docs.acquia.com/service-offerings/products-and-services-guide',
    asOf: SOURCE_AS_OF,
    note: 'Official guide explaining that Acquia contracts are comprised of customer order forms and the scope of services and support documented in the guide.',
  },
  productDefinitions: {
    type: 'public-disclosure',
    label: 'Acquia Product Guide definitions',
    url: 'https://docs.acquia.com/service-offerings/product-guide-definitions',
    asOf: SOURCE_AS_OF,
    note: 'Official definitions page covering contract precedence, regions, SaaS, Acquia Search, Site Factory, CDP terms, and related product-guide terminology.',
  },
  cdpFeatures: {
    type: 'public-disclosure',
    label: 'Acquia CDP features',
    url: 'https://www.acquia.com/products/acquia-cdp/features',
    asOf: SOURCE_AS_OF,
    note: 'Official feature page describing Acquia CDP capabilities including data export, Snowflake sharing, data erasure, GDPR/CCPA, HIPAA attestation, retention, regions, tenants, SSO, user management, service uptime, and 24/7/365 support language.',
  },
  cdpProductGuide: {
    type: 'public-disclosure',
    label: 'Acquia Customer Data Platform Product Guide - Legacy Packages',
    url: 'https://docs.acquia.com/customer-data-plaform/customer-data-platform-product-guide-legacy-packages',
    asOf: SOURCE_AS_OF,
    note: 'Official product guide describing CDP capabilities, identity resolution, insights, activation, machine learning, support services, legacy service-level commitment, error severity response goals, export window, and resource limits.',
  },
  privacyDocumentation: {
    type: 'public-disclosure',
    label: 'Acquia Privacy Trust Center documentation',
    url: 'https://www.acquia.com/about-us/legal/privacy-documentation',
    asOf: SOURCE_AS_OF,
    note: 'Official privacy documentation describing the Subscription and Services Agreement, Product and Services Guide, DPA, SCCs, UK IDTA, CCPA/CPRA terms, US state privacy-law coverage, security annex, product notices, and subprocessor list.',
  },
  trustCenter: {
    type: 'public-disclosure',
    label: 'Acquia Trust Center',
    url: 'https://security.acquia.com/',
    asOf: SOURCE_AS_OF,
    note: 'Official security portal for Acquia Cloud Platform and supporting products, identifying compliance resources and gated security documentation, including SOC, ISO, FedRAMP Moderate, HIPAA, PCI DSS, GDPR, and other trust-center materials.',
  },
  statusPage: {
    type: 'public-disclosure',
    label: 'Acquia Status page documentation',
    url: 'https://docs.acquia.com/service-offerings/acquia-status-page',
    asOf: SOURCE_AS_OF,
    note: 'Official documentation describing Acquia Status as the source for emergency maintenance, platform-wide service interruptions, security issues, product-specific alerts, incident updates, and notification practices.',
  },
} satisfies Record<string, SourceBasisRef>;

const ACQUIA_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label:
    'Buyer-specific Acquia quote, order form, traffic entitlement, product bundle, support tier, Drupal estate inventory, CDP data model, security evidence access, implementation SOW, renewal history, and exit plan required',
  asOf: SOURCE_AS_OF,
  note:
    'Public Acquia materials describe products, guides, service levels, privacy documentation, trust-center posture, status-page process, and some usage concepts. They do not establish buyer-specific net price, private discount, reseller economics, traffic baseline, CDP workload sizing, premium SLA purchase, implementation effort, renewal uplift, negotiated remedy, or production readiness.',
};

export const PAT_SRC_VEN_ACQUIA_001: PatternSeed = {
  id: 'PAT-SRC-VEN-ACQUIA-001',
  slug: 'acquia-drupal-dxp-sourcing-profile',
  title: 'Acquia Drupal and Digital Experience Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Acquia sourcing should treat the vendor as a Drupal platform, digital experience, customer-data, privacy, availability, traffic-entitlement, and implementation-governance decision rather than a simple hosting renewal or CMS brand preference.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking Acquia Cloud Platform, Site Factory, Drupal Cloud capabilities, Acquia Search, Cloud IDE, Code Studio, Acquia CDP, personalization or activation workflows, Drupal application support, managed PaaS, or digital experience platform modernization.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-acquia',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(ACQUIA_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'CCPA-CPRA-if-US-consumer-data',
    'HIPAA-if-PHI-or-healthcare-customer-data',
    'FedRAMP-if-public-sector-workload',
    'PCI-DSS-if-cardholder-data',
    'DORA-if-regulated-financial-entity',
    'Data-residency-if-region-or-transfer-boundary-required',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-CMS-001', 'PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-PRC-SAAS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Acquia',
      tier: 'enterprise',
      positioning:
        'Enterprise digital experience platform vendor centered on Drupal application hosting, development workflow, Site Factory portfolio management, Acquia Search, Cloud IDE, support services, customer data platform, data activation, and trust-center-backed security and privacy governance.',
      strengths: [
        'Official product guides provide a concrete contract-normalization path for Cloud Platform services, management console, deployment services, support references, traffic entitlement, CDN treatment, service-level policy, and product-specific documentation',
        'Acquia materials make Drupal platform specialization explicit, which helps buyers separate Drupal application support, PaaS infrastructure, Site Factory portfolio needs, developer workflow, and customer-owned code obligations',
        'Public CDP pages and guides give sourcing teams useful evidence for identity resolution, 360 profiles, connectors, activation, data export, retention, data erasure, regions, tenants, SSO, and support-service diligence',
        'Trust Center and Privacy Trust Center materials provide a public path to DPA, security annex, product notices, subprocessors, compliance resources, and gated security documentation requests',
      ],
      cautions: [
        'Public Acquia pages do not prove buyer-specific net price, negotiated discount, reseller margin, premium SLA purchase, implementation cost, overage exposure, renewal uplift, support concession, or transition-assistance remedy',
        'Availability commitments vary by service, purchased add-on, product guide, exclusions, customer code, CDN configuration, traffic capacity, and whether the workload is Cloud Platform, Site Factory, CDP, or another Acquia offering',
        'A Drupal or DXP purchase can combine platform, application support, CDN, search, Site Factory, CDP, personalization, services, partner implementation, and custom code, so the order form must decompose what Acquia owns versus what the buyer or integrator owns',
      ],
      sourceBasis: [
        ACQUIA_SOURCE_BASIS.experiencePlatform,
        ACQUIA_SOURCE_BASIS.cloudPlatformUseCases,
        ACQUIA_SOURCE_BASIS.cloudPlatformGuide,
        ACQUIA_SOURCE_BASIS.serviceLevelPolicy,
        ACQUIA_SOURCE_BASIS.cdpFeatures,
        ACQUIA_SOURCE_BASIS.trustCenter,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Acquia order-form and entitlement orientation only',
      model: 'hybrid',
      metric:
        'Purchased products, Cloud Platform or Site Factory scope, environments, traffic entitlement, views, capacity buffer, support tier, premium SLA add-on, CDN, search, CDP tenants, data retention, exports, connectors, implementation services, and renewal term',
      sourceBasis: [
        ACQUIA_SOURCE_BASIS.productsServicesGuide,
        ACQUIA_SOURCE_BASIS.cloudPlatformGuide,
        ACQUIA_SOURCE_BASIS.serviceLevelPolicy,
        ACQUIA_SOURCE_BASIS.cdpProductGuide,
        ACQUIA_BUYER_DATA_GAP,
      ],
      confidence: 0.7,
      notes:
        'Use public guides to identify commercial meters and contract exhibits. Do not infer Acquia net price, private discount, overage rate, premium SLA price, CDP package economics, implementation services cost, or renewal baseline without the buyer quote, order form, invoice, usage report, and approved workload forecast.',
    },
    {
      label: 'Founder data gap - Acquia commercial, traffic, and workload proof required',
      model: 'unknown',
      sourceBasis: [ACQUIA_BUYER_DATA_GAP],
      confidence: 0.2,
      notes:
        'No savings case, renewal-risk score, platform recommendation, CMS consolidation claim, CDP ROI claim, or migration business case should be published without buyer-specific traffic history, product inventory, Drupal estate map, implementation plan, data-processing evidence, current spend, renewal notice, and exit requirements.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Product scope, Drupal estate, and responsibility boundary',
      buyerPosition:
        'Attach an order-form exhibit naming each Acquia product, site, application, environment, Site Factory portfolio, Cloud IDE or Code Studio scope, Acquia Search scope, CDN dependency, CDP tenant, region, data class, support tier, implementation SOW, integrator responsibility, and customer-owned code obligation.',
      fallbackPosition:
        'If the final digital estate is incomplete, split committed renewal scope from optional DXP expansion and require architecture, security, marketing operations, engineering, and procurement signoff before adding additional Acquia modules or traffic capacity.',
      walkawayTriggers: [
        'The proposal bundles Drupal hosting, Site Factory, CDP, support, services, and partner implementation into one commercial line without product-level ownership and acceptance criteria',
      ],
      sourceBasis: [ACQUIA_SOURCE_BASIS.productsServicesGuide, ACQUIA_SOURCE_BASIS.cloudPlatformGuide, ACQUIA_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Traffic entitlement, overage, renewal, and service-level remedies',
      buyerPosition:
        'Require monthly traffic entitlement reporting, capacity-buffer treatment, overage notice, upgrade triggers, support response path, status-page notification review, SLA eligibility, premium SLA add-on confirmation if purchased, service-extension procedure, termination rights, and exclusion mapping to buyer-owned code, CDN, configuration, and third-party modules.',
      fallbackPosition:
        'Where traffic forecast is uncertain, reserve expansion pricing and renewal treatment in writing and avoid converting temporary spikes into permanent entitlement increases without buyer approval.',
      sourceBasis: [
        ACQUIA_SOURCE_BASIS.cloudPlatformGuide,
        ACQUIA_SOURCE_BASIS.serviceLevelPolicy,
        ACQUIA_SOURCE_BASIS.statusPage,
        ACQUIA_BUYER_DATA_GAP,
      ],
    },
    {
      clauseArea: 'Privacy, security, subprocessor, and regulated data evidence',
      buyerPosition:
        'Map personal data, customer data, PHI, cardholder data, behavioral data, logs, search indexes, CDP profiles, activation exports, support access, transfer mechanisms, subprocessors, product notices, deletion, retention, encryption, and report access before production or expansion.',
      fallbackPosition:
        'If Trust Center reports or product notices require entitlement, NDA, or account access, make evidence delivery a pre-award or pre-production gate with a named owner, due date, and remedy.',
      sourceBasis: [ACQUIA_SOURCE_BASIS.privacyDocumentation, ACQUIA_SOURCE_BASIS.trustCenter, ACQUIA_SOURCE_BASIS.cdpFeatures],
    },
    {
      clauseArea: 'CDP activation, export, retention, and termination path',
      buyerPosition:
        'For Acquia CDP, require a data-model exhibit covering identity resolution, source feeds, connectors, Snowflake sharing, activation channels, SSO, tenants, regions, erasure, retention, support severity, export window, and downstream campaign or personalization responsibilities.',
      fallbackPosition:
        'If CDP source feeds or activation destinations are not ready, keep CDP economics provisional and require a staged acceptance plan before counting personalization, loyalty, or campaign value.',
      sourceBasis: [ACQUIA_SOURCE_BASIS.cdpFeatures, ACQUIA_SOURCE_BASIS.cdpProductGuide, ACQUIA_BUYER_DATA_GAP],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Decompose the DXP bundle before BAFO',
      whenToUse:
        'Use when Acquia is positioned as a Drupal Cloud, Site Factory, CDP, personalization, search, support, and services bundle rather than a single renewal.',
      buyerAsk:
        'Require separate pricing, owners, acceptance criteria, data scope, SLA eligibility, support path, renewal baseline, and exit language for each product and service in the Acquia proposal.',
      vendorGive:
        'Acquia or a partner may offer platform subscription, support, professional services, implementation assistance, traffic entitlement, premium SLA add-on, or module expansion; each should be tied to order-form language and buyer evidence.',
      evidenceBasis: [ACQUIA_SOURCE_BASIS.productsServicesGuide, ACQUIA_SOURCE_BASIS.cloudPlatformGuide, ACQUIA_BUYER_DATA_GAP],
    },
    {
      lever: 'Separate PaaS availability from application responsibility',
      whenToUse:
        'Use when sponsors cite Acquia uptime or support as proof that the buyer can reduce engineering, SRE, Drupal, CDN, or integrator obligations.',
      buyerAsk:
        'Build a responsibility matrix for infrastructure, Drupal code, modules, CDN configuration, DNS, releases, emergency fixes, monitoring, support tickets, and recovery before accepting the operating model.',
      tradeoffs: [
        'Acquia-managed PaaS can reduce infrastructure burden, but customer code, configuration, traffic capacity, modules, and third-party dependencies can still affect availability and remedies.',
      ],
      evidenceBasis: [ACQUIA_SOURCE_BASIS.serviceLevelPolicy, ACQUIA_SOURCE_BASIS.statusPage],
    },
    {
      lever: 'Make CDP activation auditable',
      whenToUse:
        'Use when Acquia CDP is justified by unified customer view, segmentation, activation, personalization, Snowflake sharing, or campaign performance claims.',
      buyerAsk:
        'Require source-system list, entity model, consent and preference handling, retention, erasure, region, export, activation destination, identity-resolution acceptance tests, and value measurement owner before commercial award.',
      evidenceBasis: [ACQUIA_SOURCE_BASIS.cdpFeatures, ACQUIA_SOURCE_BASIS.cdpProductGuide, ACQUIA_SOURCE_BASIS.privacyDocumentation],
    },
  ],
  riskFactors: [
    {
      id: 'acquia-dxp-bundle-ambiguity',
      label: 'DXP bundle scope ambiguity',
      severity: 'high',
      detectionSignals: [
        'Proposal combines Cloud Platform, Site Factory, search, CDP, support, and implementation services without product-level scope, owners, and acceptance criteria',
        'Stakeholders describe the purchase as hosting while the order form includes broader DXP or customer-data capabilities',
      ],
      mitigations: ['Create product-by-product scope schedule', 'Separate committed renewal from optional expansion', 'Require integrator and buyer responsibility matrix'],
      contractualRemedies: ['Order-form exhibit', 'Implementation SOW', 'Acceptance gates', 'Downscope and substitution rights'],
      sourceBasis: [ACQUIA_SOURCE_BASIS.experiencePlatform, ACQUIA_SOURCE_BASIS.productsServicesGuide],
    },
    {
      id: 'acquia-traffic-entitlement-renewal-risk',
      label: 'Traffic entitlement, overage, and renewal uplift risk',
      severity: 'high',
      detectionSignals: [
        'Actual traffic exceeds entitlement repeatedly but renewal economics, capacity buffer, and upgrade trigger are not modeled',
        'Marketing campaign, migration, CDN, bot, or launch traffic assumptions are missing from the renewal forecast',
      ],
      mitigations: ['Collect 12-month traffic history', 'Model campaign and migration spikes', 'Require overage notices and renewal treatment', 'Separate anomalies from durable baseline'],
      contractualRemedies: ['Usage-reporting covenant', 'Overage notice', 'Reserved expansion pricing', 'Renewal baseline exhibit'],
      sourceBasis: [ACQUIA_SOURCE_BASIS.cloudPlatformGuide, ACQUIA_BUYER_DATA_GAP],
    },
    {
      id: 'acquia-regulated-customer-data-gap',
      label: 'Regulated customer data and privacy evidence gap',
      severity: 'critical',
      detectionSignals: [
        'CDP, search, support, logs, behavioral data, healthcare content, payment-adjacent data, or personalization exports are enabled before DPA, product notice, subprocessor, retention, and deletion review is complete',
        'Security reports are assumed available even though Trust Center sensitive materials may require active or pending subscription entitlement',
      ],
      mitigations: ['Run data-flow review', 'Request Trust Center evidence early', 'Map product notices and subprocessors', 'Define retention, erasure, and export controls'],
      contractualRemedies: ['DPA and security annex evidence gate', 'Subprocessor notice', 'Data export and deletion schedule', 'Regulated-data use restriction until approval'],
      sourceBasis: [ACQUIA_SOURCE_BASIS.privacyDocumentation, ACQUIA_SOURCE_BASIS.trustCenter, ACQUIA_SOURCE_BASIS.cdpFeatures],
    },
    {
      id: 'acquia-sla-responsibility-mismatch',
      label: 'SLA and responsibility mismatch',
      severity: 'medium',
      detectionSignals: [
        'Sponsor treats published Acquia availability as application-level uptime without reviewing exclusions for customer actions, code, third-party modules, traffic capacity, CDN, maintenance, or dev and staging environments',
        'Premium 99.99% language is cited without confirming purchase, conditions, Cloud Next eligibility, CDN configuration, and resource-limit compliance',
      ],
      mitigations: ['Map SLA eligibility and exclusions', 'Confirm premium add-on in the order form', 'Create incident and status-page runbook', 'Define app-code and CDN owners'],
      contractualRemedies: ['SLA exhibit', 'Service-extension process', 'Termination trigger', 'Responsibility matrix'],
      sourceBasis: [ACQUIA_SOURCE_BASIS.serviceLevelPolicy, ACQUIA_SOURCE_BASIS.statusPage],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Treat Acquia as a customer-experience and customer-data platform when CDP, personalization, segmentation, campaign activation, web properties, loyalty, or commerce-adjacent journeys are in scope.',
      additionalRequirements: ['Consent and preference review', 'CDP identity-resolution acceptance tests', 'Campaign and peak-traffic forecast'],
      regulatoryRefs: ['GDPR-if-personal-data', 'CCPA-CPRA-if-US-consumer-data'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm PHI boundaries, HIPAA posture, content workflow, CDP data categories, support access, product notices, and deletion or export controls before patient, member, or clinical journey data enters Acquia services.',
      additionalRequirements: ['PHI boundary review', 'HIPAA evidence and counsel review', 'Data retention and erasure plan'],
      regulatoryRefs: ['HIPAA-if-PHI', 'State privacy laws where applicable'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Verify FedRAMP boundary, product scope, region, CDN, support path, status communication, and accessibility evidence instead of assuming all Acquia modules inherit the same public-sector authorization posture.',
      additionalRequirements: ['FedRAMP boundary review', 'Accessibility and VPAT review', 'Region and subprocessor approval'],
      regulatoryRefs: ['FedRAMP-if-government-workload', 'TX-RAMP-if-Texas-public-sector'],
      affectedStages: ['MarketScan', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Treat Acquia as an ICT third-party and customer-data dependency when public websites, logged-in portals, campaign journeys, CDP profiles, incident response, or regulated marketing operations depend on it.',
      additionalRequirements: ['Operational resilience classification', 'Exit and substitutability plan', 'Traffic spike and incident runbook'],
      regulatoryRefs: ['DORA-if-EU-regulated-financial-entity', 'PCI-DSS-if-cardholder-data'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting', 'Renewal'],
    },
  ],
  body: `## Summary
Acquia should be sourced as a Drupal-centered digital experience platform and customer-data operating decision, not as a generic web-hosting renewal. Public Acquia materials describe a platform that can include Cloud Platform, Site Factory, Acquia Search, Cloud IDEs, deployment tooling, Drupal application support, CDN dependencies, Acquia CDP, data exports, activation, privacy documentation, and trust-center evidence. That breadth is valuable when an enterprise wants to modernize a Drupal estate, manage many digital properties, standardize developer workflow, or connect web experiences to customer data. It also creates sourcing risk if procurement accepts one blended DXP story without separating what Acquia owns, what an implementation partner owns, and what the buyer remains responsible for in code, configuration, traffic, data, and campaign operations.

## When to apply
Use this profile when Acquia is an incumbent, finalist, renewal target, expansion platform, or benchmark for Drupal Cloud, Cloud Platform Enterprise, Site Factory, Acquia Search, Cloud IDE, Code Studio, Acquia CDP, customer segmentation, activation, personalization, digital-property portfolio management, or Drupal application support. It is especially relevant when a website modernization, marketing transformation, healthcare or public-sector digital service, retail customer journey, or financial-services portal depends on Drupal and the proposed Acquia scope includes hosting, support, search, CDN, implementation services, and customer-data capabilities in the same commercial motion.

Do not use this profile to conclude that Acquia is technically superior, cheaper, more compliant, or lower-risk by default. Public sources can identify product scope, contract structure, service-level concepts, privacy documentation, trust-center process, status communications, and diligence questions. They do not prove the buyer's traffic baseline, net price, negotiated discount, premium SLA purchase, support concession, security-report access, implementation quality, code readiness, or CDP value case.

## Evidence to collect
Start with the digital estate. Inventory every Drupal application, site, domain, environment, Site Factory portfolio, search index, CDN dependency, development workflow, API, release path, traffic source, campaign calendar, integration, and owner. Then map the proposed Acquia order form to that estate. Each purchased module should have a named business owner, technical owner, data owner, support owner, acceptance test, renewal baseline, and exit requirement. Cloud Platform and Site Factory should be tied to application-level responsibility, not just infrastructure availability. Acquia's service-level policy covers production PaaS infrastructure under specific conditions and exclusions; it is not a blanket guarantee for customer code, Drupal modules, CDN configuration, traffic above purchased capacity, third-party actions, dev or staging environments, or business impact.

Collect traffic and commercial evidence early. Acquia's Cloud Platform guide describes traffic entitlement, a 30 percent capacity buffer, overage treatment, and renewal upgrade logic when entitlement is exceeded repeatedly. That makes a 12-month traffic history, campaign forecast, bot and CDN analysis, launch calendar, migration wave plan, and renewal baseline essential before BAFO. If the proposal includes a premium service-level add-on, confirm it in the order form and verify the conditions that must be met, including product version, CDN configuration, and documented resource limits. If the proposal includes CDP, collect source systems, identity-resolution logic, data model, connectors, Snowflake sharing or export needs, regions, tenants, SSO, data retention, erasure, activation channels, and downstream campaign ownership.

## Commercial posture
Treat public Acquia documentation as a meter and obligation map, not a price benchmark. The Products and Services Guide says Acquia contracts are composed of signed order forms plus documented service and support scope. The Cloud Platform guide and Service Level Policy help identify traffic entitlement, capacity, service extension, exclusions, support references, and availability constructs. CDP public materials help identify features such as identity resolution, 360 profiles, actions, connectors, data export, erasure, retention, regions, SSO, user management, and support. None of those public pages establish the buyer's net price, discount, reseller margin, package structure, premium SLA cost, implementation services price, renewal uplift, overage fee, or migration budget. The sourcing workbook should separate subscription, traffic, premium SLA, support, implementation, partner services, data migration, CDP activation, training, integrations, and exit costs.

## Contract and governance posture
The privacy and trust evidence path matters because Acquia workloads often touch public websites, logged-in experiences, customer profiles, campaign events, search behavior, support tickets, and operational logs. The Privacy Trust Center points buyers to the Subscription and Services Agreement, DPA, security annex, product notices, and subprocessor list. The Trust Center provides a security portal for Cloud Platform and supporting products and identifies compliance resources, but some sensitive materials may require active or pending subscription entitlements. Make evidence delivery a gate rather than a post-signature assumption. For regulated workloads, map the actual product, region, data class, subprocessor, support access, encryption, retention, deletion, export, and incident-notification requirements before production use.

## Contradictions and failure modes
Vendor or sponsor claim: Acquia is just a hosting renewal. Detection: compare the order form against the actual DXP bundle, CDP scope, search, CDN, support, partner services, and data-processing requirements. Vendor or sponsor claim: the published SLA solves availability risk. Detection: map service-level exclusions, customer-owned code, traffic capacity, CDN obligations, premium add-on purchase, and incident runbook. Vendor or sponsor claim: CDP value follows automatically from unified customer data. Detection: require source-system readiness, consent review, identity-resolution acceptance tests, activation destination owners, and measurable campaign outcomes.

The common failure is letting Drupal platform familiarity reduce diligence. The second failure is using public uptime or trust-center language as a substitute for order-form, security, privacy, and operational evidence. The third failure is buying DXP breadth before the buyer can operate the sites, data feeds, release process, traffic controls, and campaign workflows. This profile keeps Acquia sourcing decision-grade by forcing scope decomposition, usage proof, data governance, responsibility mapping, and renewal economics before award or renewal signature.`,
};
