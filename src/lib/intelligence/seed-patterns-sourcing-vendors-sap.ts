import type { PatternSeed } from './seed-types';

const SAP_SOURCE_BASIS = {
  sec20f2025: {
    type: 'regulatory-document' as const,
    label: 'SAP SE 2025 Form 20-F',
    url: 'https://www.sec.gov/Archives/edgar/data/1000184/000110465926020058/sap-20251231x20f.htm',
    asOf: '2026-04-29',
  },
  integratedReport2025: {
    type: 'public-disclosure' as const,
    label: 'SAP Integrated Report 2025 five-year summary',
    url: 'https://www.sap.com/integrated-reports/2025/en/datahub/financial-data/five-year-summary.html',
    asOf: '2026-04-29',
  },
  cloudErpPricing: {
    type: 'public-disclosure' as const,
    label: 'SAP Cloud ERP pricing and packages',
    url: 'https://www.sap.com/products/erp/pricing-and-packaging.html',
    asOf: '2026-04-29',
  },
  cloudErpPrivate: {
    type: 'public-disclosure' as const,
    label: 'SAP Cloud ERP Private package',
    url: 'https://www.sap.com/products/erp/rise/how-to-buy.html',
    asOf: '2026-04-29',
  },
  risePrivateSdg: {
    type: 'public-disclosure' as const,
    label: 'RISE with SAP S/4HANA Cloud, private edition service description guide',
    url: 'https://www.sap.com/docs/download/agreements/product-use-and-support-terms/service-description-guides/rise-with-sap-s4hana-cloud-private-edition-service-description-guide-english-v6-2024.pdf',
    asOf: '2026-04-29',
  },
  growPublicSud: {
    type: 'public-disclosure' as const,
    label: 'SAP S/4HANA Cloud Public Edition and GROW with SAP service use descriptions',
    url: 'https://assets.cdn.sap.com/agreements/product-use-and-support-terms/service-description-guides/sap-s4hana-cloud-public-edition-and-grow-with-sap-s4hana-cloud-service-use-descriptions-english-v07-2025.pdf',
    asOf: '2026-04-29',
  },
  aribaSourcing: {
    type: 'public-disclosure' as const,
    label: 'SAP Ariba Sourcing product page',
    url: 'https://www.sap.com/products/spend-management/ariba-sourcing.html',
    asOf: '2026-04-29',
  },
  aribaStrategicSourcingHelp: {
    type: 'public-disclosure' as const,
    label: 'SAP Help Portal: SAP Ariba Strategic Sourcing Suite',
    url: 'https://help.sap.com/docs/strategic-sourcing/sap-ariba-product-sourcing/sap-ariba-strategic-sourcing-suite',
    asOf: '2026-04-29',
  },
  btpPricing: {
    type: 'public-disclosure' as const,
    label: 'SAP Business Technology Platform pricing options',
    url: 'https://www.sap.com/products/technology-platform/pricing.html',
    asOf: '2026-04-29',
  },
  trustCenter: {
    type: 'public-disclosure' as const,
    label: 'SAP Trust Center agreements',
    url: 'https://www.sap.com/about/trust-center/agreements.html',
    asOf: '2026-04-29',
  },
  cloudSla: {
    type: 'public-disclosure' as const,
    label: 'Service Level Agreement for SAP Cloud Services',
    url: 'https://www.sap.com/docs/download/agreements/product-use-and-support-terms/cls/en/service-level-agreement-for-sap-cloud-services-english-v8-2023.pdf',
    asOf: '2026-04-29',
  },
  cloudDpa: {
    type: 'public-disclosure' as const,
    label: 'Data Processing Agreement for SAP Cloud Services',
    url: 'https://assets.cdn.sap.com/agreements/product-use-and-support-terms/cls/en/data-processing-agreement-for-sap-cloud-services-english-v4-2016.pdf',
    asOf: '2026-04-29',
  },
  aiTerms: {
    type: 'public-disclosure' as const,
    label: 'SAP AI Terms',
    url: 'https://assets.cdn.sap.com/agreements/product-policy/css/service-specifications/sap-ai-terms-english-v11-2023.pdf',
    asOf: '2026-04-29',
  },
  founderDataGap: {
    type: 'founder-data-gap' as const,
    label: 'TODO/founder-data-gap: buyer-specific SAP discount, RISE conversion, shelfware, audit, renewal uplift, and benchmark data required',
    asOf: '2026-04-29',
  },
};

export const SAP_ENTERPRISE_SOURCING_PROFILE: PatternSeed = {
  id: 'PAT-SRC-VEN-SAP-001',
  slug: 'sap-enterprise-sourcing-profile',
  title: 'SAP Enterprise Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'SAP sourcing is a portfolio, migration, and license-governance decision: buyers must normalize ERP, procurement, platform, data, AI, support, and cloud operating terms before treating SAP as a single subscription renewal.',
  applicability:
    'Apply when sourcing, renewing, expanding, or converting SAP enterprise agreements, including SAP Cloud ERP, RISE with SAP, GROW with SAP, SAP S/4HANA Cloud, SAP Ariba, SAP Business Network, SAP Business Technology Platform, SuccessFactors, SAP Business Data Cloud, or related SAP cloud services.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-29',
  instanceCount: 0,
  sourceDocuments: [
    SAP_SOURCE_BASIS.sec20f2025.url,
    SAP_SOURCE_BASIS.integratedReport2025.url,
    SAP_SOURCE_BASIS.cloudErpPricing.url,
    SAP_SOURCE_BASIS.cloudErpPrivate.url,
    SAP_SOURCE_BASIS.risePrivateSdg.url,
    SAP_SOURCE_BASIS.growPublicSud.url,
    SAP_SOURCE_BASIS.aribaSourcing.url,
    SAP_SOURCE_BASIS.aribaStrategicSourcingHelp.url,
    SAP_SOURCE_BASIS.btpPricing.url,
    SAP_SOURCE_BASIS.trustCenter.url,
    SAP_SOURCE_BASIS.cloudSla.url,
    SAP_SOURCE_BASIS.cloudDpa.url,
    SAP_SOURCE_BASIS.aiTerms.url,
  ],
  regulatoryChips: ['GDPR', 'SOX-if-financial-controls', 'DORA-if-regulated-financial-entity', 'GxP-if-validated-life-sciences', 'data-residency-review'],
  relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-S2P-001', 'PAT-SRC-CAT-HCM-001', 'PAT-SRC-CAT-FINOPS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'enterprise_saas',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'SAP Cloud ERP, RISE with SAP, and SAP S/4HANA Cloud',
      tier: 'enterprise',
      positioning:
        'Core ERP and transformation suite for buyers standardizing finance, procurement, supply chain, manufacturing, and enterprise master-data processes around SAP cloud operating models.',
      strengths: ['Deep ERP process footprint', 'Migration path for existing SAP estates', 'Business Suite, data, AI, and extensibility adjacency'],
      cautions: ['Commercial scope is highly order-form specific', 'FUE, digital access, system sizing, clean-core, migration, and SLA options must be normalized before award'],
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPricing, SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.growPublicSud],
    },
    {
      vendorName: 'SAP Ariba, SAP Business Network, and SAP spend-management applications',
      tier: 'enterprise',
      positioning:
        'Source-to-pay, supplier, network, and direct-materials sourcing portfolio strongest where sourcing, contracts, supplier lifecycle, ERP integration, and procurement data are evaluated together.',
      strengths: ['Integrated sourcing and supplier-management suite', 'Direct-materials and BOM sourcing support', 'SAP ERP and master-data adjacency'],
      cautions: ['Do not confuse sourcing-suite functionality with full buyer operating readiness; require workflow, supplier, ERP, and contract-document proof'],
      sourceBasis: [SAP_SOURCE_BASIS.aribaSourcing, SAP_SOURCE_BASIS.aribaStrategicSourcingHelp],
    },
    {
      vendorName: 'SAP Business Technology Platform and SAP Business Data Cloud adjacency',
      tier: 'enterprise',
      positioning:
        'Extension, integration, automation, analytics, data, and AI layer that can become a commercial dependency when SAP core applications need clean-core extensions or cross-system data products.',
      strengths: ['SAP-native integration and extension model', 'Consumption-oriented BTP agreement options', 'Cloud ERP and Business Suite adjacency'],
      cautions: ['Prepaid credits, overages, service plans, regional availability, and deprecation posture require governance outside the ERP subscription headline'],
      sourceBasis: [SAP_SOURCE_BASIS.btpPricing, SAP_SOURCE_BASIS.cloudErpPricing],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'SAP public commercial anchors only',
      model: 'hybrid',
      metric: 'Quote-based ERP packages, FUE/user and digital-access constructs, cloud service subscriptions, and BTP consumption credits or pay-as-you-go usage',
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPricing, SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.growPublicSud, SAP_SOURCE_BASIS.btpPricing, SAP_SOURCE_BASIS.founderDataGap],
      confidence: 0.61,
      notes:
        'Public SAP pages identify packaging, request-a-quote motions, service descriptions, FUE/user constructs, digital-access constructs, and BTP consumption models. They do not provide buyer-specific net pricing, discount ranges, conversion credits, renewal uplift, hyperscaler economics, SI cost, or shelfware benchmarks.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'RISE or cloud ERP scope control',
      buyerPosition:
        'Attach a normalized schedule for subscribed services, FUE/user definitions, digital-access constructs, systems, environments, storage, interfaces, add-ons, service levels, disaster recovery, GxP eligibility, and migration responsibilities.',
      fallbackPosition: 'If SAP will not disaggregate the bundle commercially, require an operational entitlement exhibit and change-order mechanics by service and environment.',
      vendorPosition: 'SAP will typically anchor on the order form, service description guide, cloud terms, and referenced product supplements.',
      walkawayTriggers: ['No entitlement exhibit', 'No treatment for system sizing growth', 'No renewal cap or migration accountability for material scope changes'],
      sourceBasis: [SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.cloudSla],
    },
    {
      clauseArea: 'Data protection, AI, and trust terms',
      buyerPosition:
        'Incorporate cloud DPA, technical and organizational measures, subprocessor and data-center review, AI feature terms, model/data-use boundaries, audit evidence, and deletion/export obligations for all in-scope SAP cloud services.',
      fallbackPosition: 'At minimum, require a product-by-product trust addendum and an AI-use inventory before go-live.',
      sourceBasis: [SAP_SOURCE_BASIS.trustCenter, SAP_SOURCE_BASIS.cloudDpa, SAP_SOURCE_BASIS.aiTerms],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Bundle disaggregation before BAFO',
      whenToUse: 'Use whenever RISE, Cloud ERP Private, Business Suite, Ariba, BTP, Business Data Cloud, SuccessFactors, support, and services are presented as one transformation price.',
      buyerAsk:
        'Separate subscription entitlements, transformation tools, managed services, support, credits, environments, implementation services, and optional add-ons so renewal, exit, and change-order exposure are visible.',
      vendorGive: 'SAP may preserve bundle pricing while providing an entitlement and dependency exhibit.',
      tradeoffs: ['Disaggregation can slow contracting but prevents hidden renewal and sizing exposure.'],
      evidenceBasis: [SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.founderDataGap],
    },
    {
      lever: 'Migration timing and on-prem conversion leverage',
      whenToUse: 'Use when an incumbent SAP ERP buyer is being moved from on-premises licenses or ECC/SAP Business Suite 7 posture into SAP cloud ERP or RISE pathways.',
      buyerAsk:
        'Tie conversion value, shelfware retirement, dual-run rights, implementation milestones, clean-core remediation, and renewal protection to measurable migration gates.',
      tradeoffs: ['A longer transformation term can improve continuity but increases lock-in unless exit and downsizing rights survive missed milestones.'],
      evidenceBasis: [SAP_SOURCE_BASIS.cloudErpPricing, SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.sec20f2025],
    },
    {
      lever: 'BTP and integration consumption guardrails',
      whenToUse: 'Use when SAP extensions, integrations, automation, data products, or AI services are required for the target architecture.',
      buyerAsk:
        'Set prepaid credit governance, alert thresholds, overage treatment, service-plan approval, region controls, and monthly consumption reporting before production workloads begin.',
      evidenceBasis: [SAP_SOURCE_BASIS.btpPricing],
    },
    {
      lever: 'Trust, SLA, and regulated-workload exhibit',
      whenToUse: 'Use for regulated, multinational, mission-critical, or AI-enabled SAP cloud workloads.',
      buyerAsk:
        'Map each cloud service to SLA, support, data processing, subprocessors, data centers, audit reports, AI terms, incident notification, backup, disaster recovery, and exit obligations.',
      evidenceBasis: [SAP_SOURCE_BASIS.trustCenter, SAP_SOURCE_BASIS.cloudSla, SAP_SOURCE_BASIS.cloudDpa, SAP_SOURCE_BASIS.aiTerms],
    },
  ],
  riskFactors: [
    {
      id: 'sap-bundle-opacity',
      label: 'Bundle opacity across ERP, platform, network, support, and services',
      severity: 'high',
      detectionSignals: ['Order form lacks service-level entitlement detail', 'Pricing cannot be traced to users, FUEs, digital documents, environments, credits, or add-ons', 'Renewal quote introduces renamed SKUs without bridge mapping'],
      mitigations: ['Build a normalized entitlement workbook', 'Require SKU bridge tables', 'Tie expansion only to approved service schedules'],
      contractualRemedies: ['Renewal cap by service family', 'SKU substitution protections', 'Change-order notice and approval rights'],
      sourceBasis: [SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.growPublicSud, SAP_SOURCE_BASIS.founderDataGap],
    },
    {
      id: 'sap-digital-access-and-integration-exposure',
      label: 'Digital access, indirect use, and integration exposure',
      severity: 'high',
      detectionSignals: ['Non-SAP applications create or update SAP documents', 'Bots, sensors, portals, APIs, or middleware touch SAP transactions', 'Buyer cannot map integration volume to licensed constructs'],
      mitigations: ['Inventory all human and non-human access paths', 'Model digital-document volume', 'Require pre-award licensing treatment for material integrations'],
      contractualRemedies: ['Integration-use exhibit', 'Audit cure period', 'Document-volume true-up mechanics'],
      sourceBasis: [SAP_SOURCE_BASIS.risePrivateSdg, SAP_SOURCE_BASIS.growPublicSud],
    },
    {
      id: 'sap-transformation-delivery-risk',
      label: 'Transformation delivery and clean-core readiness risk',
      severity: 'critical',
      detectionSignals: ['Custom code, master-data quality, process variants, or SI capacity are unresolved at signature', 'Business case assumes rapid cloud conversion without migration gates'],
      mitigations: ['Run fit-to-standard and custom-code assessment before BAFO', 'Gate subscription ramp to implementation milestones', 'Separate SAP software obligations from SI delivery obligations'],
      contractualRemedies: ['Ramp deferral', 'Milestone-based expansion', 'Transition assistance and exit rights for missed critical gates'],
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.cloudErpPricing, SAP_SOURCE_BASIS.founderDataGap],
    },
    {
      id: 'sap-ai-data-and-regulatory-terms',
      label: 'AI, personal data, and regulated workload ambiguity',
      severity: 'medium',
      detectionSignals: ['Joule, embedded AI, automation, or data-cloud use cases lack approved data boundaries', 'DPA, subprocessors, data centers, and AI terms are not mapped to services'],
      mitigations: ['Create an AI/data-use inventory', 'Review SAP Trust Center artifacts by service', 'Require regulated-workload signoff before production'],
      contractualRemedies: ['AI-use exhibit', 'Data-location controls', 'Deletion/export and audit evidence obligations'],
      sourceBasis: [SAP_SOURCE_BASIS.trustCenter, SAP_SOURCE_BASIS.cloudDpa, SAP_SOURCE_BASIS.aiTerms],
    },
  ],
  industryVariants: [
    {
      industry: 'manufacturing',
      modifier: 'Increase weight on direct-materials sourcing, BOM integration, plant-level process variants, MES/PLM integration, EDI, and production downtime risk.',
      additionalRequirements: ['Direct-materials sourcing proof', 'Plant/process-variant inventory', 'Cutover and downtime plan'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'financial_services',
      modifier: 'Raise outsourcing, operational resilience, exit, audit, data residency, privileged access, and DORA-style ICT third-party scrutiny.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'SOX if SAP supports financial reporting controls'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier: 'Separate PHI, GxP, clinical supply chain, data residency, and validation requirements from generic enterprise ERP and procurement requirements.',
      additionalRequirements: ['PHI boundary review', 'GxP validation assessment when applicable', 'Data-processing and subprocessor approval'],
      affectedStages: ['Scope', 'BAFO', 'Contracting'],
    },
  ],
  body: `## Summary
SAP enterprise sourcing is rarely a single-product purchase. It is usually a renewal, migration, platform, data, AI, support, integration, and operating-model decision wrapped into one commercial event. The buyer may be evaluating SAP Cloud ERP, RISE with SAP, GROW with SAP, SAP S/4HANA Cloud, SAP Ariba, SAP Business Network, SAP Business Technology Platform, SuccessFactors, SAP Business Data Cloud, or a combination of these services. SAP's public disclosures show a company pushing cloud ERP, Business Suite, data, and Business AI as strategic priorities; SAP's public product and agreement documents show quote-based ERP packages, service descriptions, cloud terms, SLA documents, data processing terms, and AI terms that must be read together before signing.

## When to apply
Use this profile when the buyer is an incumbent SAP customer approaching a renewal, an ECC or Business Suite migration decision, a RISE or Cloud ERP Private conversion, a GROW or S/4HANA Cloud evaluation, an SAP Ariba source-to-pay expansion, a BTP consumption expansion, a Business Data Cloud or AI add-on decision, or a multi-year enterprise agreement. The event should not be scoped as ordinary SaaS seat negotiation. SAP commercial exposure can sit in named users, FUEs, digital-access constructs, cloud services, systems, environments, service levels, transformation tools, BTP credits, support, hyperscaler assumptions, data services, AI features, implementation partners, and renewal mechanics.

## Public-source boundaries
SAP public pages and official documents provide credible anchors for packaging, product scope, trust obligations, service descriptions, and cloud commercial models. SAP Cloud ERP pricing and package pages identify public/private cloud ERP packaging and quote-based motions. RISE and S/4HANA service descriptions define entitlement concepts and service-specific conditions. SAP Ariba public and Help Portal pages describe sourcing, contracts, supplier lifecycle, product sourcing, BOM integration, ERP integration, and supplier-network adjacency. SAP BTP's public pricing page identifies trial, free tier, enterprise agreement, pay-as-you-go, credits, consumption management, and overage constructs. SAP Trust Center agreements, SLA, DPA, and AI terms provide the legal and operational baseline for cloud services.

Do not infer net price, private discount level, migration credit, audit settlement, shelfware value, hyperscaler pass-through economics, or renewal benchmark from those public sources. TODO/founder-data-gap: collect buyer-specific SAP estate data, incumbent order forms, support basis, unused entitlement inventory, digital-access exposure, RISE conversion economics, implementation/SI quotes, renewal uplift history, and peer benchmark evidence before recommending target pricing.

## Sourcing strategy
The sourcing team should first normalize the SAP estate: installed products, cloud subscriptions, users, FUEs, integrations, non-human access, digital-document creation, systems, environments, data centers, support, enhancement packs, custom code, business-critical interfaces, partner dependencies, and renewal dates. Then separate the event into commercial lanes: core ERP, procurement/network, HCM, BTP/integration/automation, data/analytics/AI, services/support, and implementation partner work. SAP may price these as a transformation bundle, but the buyer still needs an entitlement exhibit that shows what is included, what can grow, what expires, what is optional, what renews, and what happens if the migration is delayed.

For RISE or Cloud ERP Private, require a side-by-side comparison of the current state, target state, migration timeline, clean-core remediation, custom-code disposition, system sizing, disaster recovery, SLA option, regulated workload treatment, and exit plan. For SAP Ariba, require proof against actual sourcing and supplier workflows, not only demo events: supplier onboarding, contract document flow, ERP handoff, direct-materials BOM sourcing, award export, compliance controls, and reporting. For BTP, insist on credit governance, service-plan approvals, consumption dashboards, region controls, monthly overage reporting, and deprecation/change notice handling.

## Evaluation rubric
Weight SAP fit to current process and target operating model at 25 percent, commercial transparency at 20 percent, migration and delivery feasibility at 20 percent, integration and data governance at 15 percent, trust/regulatory posture at 10 percent, and exit/renewal protection at 10 percent. Increase migration weight for ECC-to-cloud conversions, digital-access weight for API-heavy landscapes, and trust/regulatory weight for financial services, healthcare, public sector, or GxP workloads.

## Negotiation posture
The strongest SAP negotiation posture is not a generic discount ask. It is a controlled transformation bargain: the buyer offers committed scope, referenceable roadmap, term length, or product expansion only in exchange for entitlement clarity, conversion credit transparency, ramp timing, renewal caps, audit cure mechanics, integration/digital-access treatment, BTP overage governance, AI/data-use boundaries, and transition rights. If SAP proposes a broad Business Suite, RISE, or cloud ERP package, the buyer should ask for a commercial bridge from current entitlements to future entitlements and a renewal bridge for renamed or replaced SKUs. If SAP positions public cloud, private cloud, Ariba, BTP, or Business Data Cloud as strategic prerequisites, each dependency should have a quantified owner, benefit case, operating cost, and exit consequence.

## Failure modes
The most common failure is signing a transformation bundle before the buyer understands what has been converted, retired, or newly exposed. The second is approving a cloud migration without resolving custom code, data quality, process variants, SI capacity, and business cutover risk. The third is treating BTP, data, AI, and integration services as minor add-ons even though they can become the technical and commercial control plane for the future SAP estate. The fourth is leaving indirect access, digital access, bots, portals, EDI, middleware, and non-SAP applications unmapped until an audit or renewal. The fifth is assuming public package pages imply a benchmark price; for SAP, verified buyer-specific estate and renewal data are mandatory before target pricing is defensible.`,
};

export const SOURCING_VENDOR_SAP_PATTERNS: PatternSeed[] = [SAP_ENTERPRISE_SOURCING_PROFILE];
