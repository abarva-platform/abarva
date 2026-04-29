import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const GOOGLE_CLOUD_SOURCE_BASIS = {
  products: {
    type: 'public-disclosure',
    label: 'Google Cloud products and services',
    url: 'https://cloud.google.com/products',
    asOf: SOURCE_AS_OF,
    note: 'Official product catalog showing the breadth of Google Cloud services across compute, storage, data analytics, AI, developer tools, security, networking, and industry solutions.',
  },
  locations: {
    type: 'public-disclosure',
    label: 'Google Cloud global locations',
    url: 'https://cloud.google.com/about/locations',
    asOf: SOURCE_AS_OF,
    note: 'Official locations page describing Google Cloud regions, zones, regional product availability, data-location choices, and region picker tooling.',
  },
  geography: {
    type: 'public-disclosure',
    label: 'Google Cloud geography and regions documentation',
    url: 'https://cloud.google.com/docs/geography-and-regions',
    asOf: SOURCE_AS_OF,
    note: 'Official documentation describing regions, zones, failure domains, latency, availability, durability, and workload-placement considerations.',
  },
  pricingCalculator: {
    type: 'public-disclosure',
    label: 'Google Cloud Pricing Calculator',
    url: 'https://cloud.google.com/products/calculator',
    asOf: SOURCE_AS_OF,
    note: 'Official calculator used to configure product estimates and view billing-account-specific pricing when signed in.',
  },
  committedUseDiscounts: {
    type: 'public-disclosure',
    label: 'Google Cloud committed use discounts documentation',
    url: 'https://cloud.google.com/docs/cuds',
    asOf: SOURCE_AS_OF,
    note: 'Official documentation describing spend-based and resource-based commitments, eligible resources, one-year and three-year terms, overage treatment, and commitment scope.',
  },
  terms: {
    type: 'public-disclosure',
    label: 'Google Cloud Terms of Service',
    url: 'https://cloud.google.com/terms',
    asOf: SOURCE_AS_OF,
    note: 'Official online contracting terms covering services, order forms, billing, SLAs, technical support services, accounts, customer responsibility, and reseller context.',
  },
  serviceTerms: {
    type: 'public-disclosure',
    label: 'Google Cloud Service Specific Terms',
    url: 'https://cloud.google.com/terms/service-terms',
    asOf: SOURCE_AS_OF,
    note: 'Official service-specific terms, including reseller treatment and product-specific clauses that must be matched to the purchased service scope.',
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Google Cloud Data Processing Addendum',
    url: 'https://cloud.google.com/terms/data-processing-addendum',
    asOf: SOURCE_AS_OF,
    note: 'Official data processing addendum covering customer data deletion and export, security measures, incident notification, subprocessor governance, and customer security responsibilities.',
  },
  slas: {
    type: 'public-disclosure',
    label: 'Google Cloud Service Level Agreements',
    url: 'https://cloud.google.com/terms/sla',
    asOf: SOURCE_AS_OF,
    note: 'Official index of service-level agreements for Google Cloud Platform services.',
  },
  support: {
    type: 'public-disclosure',
    label: 'Google Cloud Customer Care overview',
    url: 'https://cloud.google.com/support/docs/overview',
    asOf: SOURCE_AS_OF,
    note: 'Official support overview describing Basic, Standard, Enhanced, Premium, billing, and add-on support concepts for Google Cloud customers.',
  },
  trustCenter: {
    type: 'public-disclosure',
    label: 'Google Cloud Trust Center',
    url: 'https://cloud.google.com/trust-center',
    asOf: SOURCE_AS_OF,
    note: 'Official trust page describing security, privacy, transparency, compliance, encryption, shared fate, and control posture.',
  },
  compliance: {
    type: 'public-disclosure',
    label: 'Google Cloud compliance resource center',
    url: 'https://cloud.google.com/compliance',
    asOf: SOURCE_AS_OF,
    note: 'Official compliance resource center for certifications, documentation, third-party audits, industry resources, and regional compliance offerings.',
  },
  assuredWorkloads: {
    type: 'public-disclosure',
    label: 'Google Cloud Assured Workloads data residency documentation',
    url: 'https://cloud.google.com/assured-workloads/docs/data-residency',
    asOf: SOURCE_AS_OF,
    note: 'Official documentation describing data residency considerations for Assured Workloads and links to broader residency, transparency, and privacy controls.',
  },
} satisfies Record<string, SourceBasisRef>;

const GOOGLE_CLOUD_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Google Cloud quote, order form, billing export, usage forecast, architecture, support, and compliance evidence',
  note:
    'Public Google Cloud sources describe product scope, terms, regions, SLAs, security posture, support programs, and pricing mechanisms. They do not establish buyer-specific net price, private discount, committed-spend level, marketplace treatment, reseller margin, migration credit, workload forecast, support concession, or negotiated remedy.',
};

export const PAT_SRC_VEN_GOOGLECLOUD_001: PatternSeed = {
  id: 'PAT-SRC-VEN-GOOGLECLOUD-001',
  slug: 'google-cloud-platform-sourcing-profile',
  title: 'Google Cloud Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Google Cloud sourcing should treat the platform as a workload, data, AI, network, security, support, and FinOps operating model rather than a single infrastructure rate card or cloud-credit negotiation.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking Google Cloud for compute, containers, storage, databases, analytics, AI and machine learning, networking, security, observability, APIs, migration, disaster recovery, industry workloads, or enterprise support.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-googlecloud',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(GOOGLE_CLOUD_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'HIPAA-if-PHI-or-healthcare-workload',
    'FedRAMP-if-public-sector-or-government-workload',
    'DORA-if-regulated-financial-entity',
    'Data-residency-if-region-or-sovereignty-required',
    'PCI-DSS-if-cardholder-data',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-LAKE-001', 'PAT-SRC-CAT-LLM-001', 'PAT-SRC-CON-004'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'infrastructure',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Google Cloud',
      tier: 'enterprise',
      positioning:
        'Enterprise cloud platform vendor spanning compute, storage, networking, containers, serverless, data analytics, databases, AI and machine learning, security, operations, API management, migration, distributed cloud, and industry-specific services.',
      strengths: [
        'Official product catalog, region, geography, terms, SLA, support, trust, compliance, and data-processing materials provide a strong public baseline for sourcing normalization',
        'Commercial model can be analyzed through public product pricing pages, the pricing calculator, committed use discount documentation, billing exports, and buyer-specific forecasts',
        'Security, privacy, transparency, compliance, data residency, and support posture can be mapped from official Google Cloud trust, compliance, DPA, SLA, and Customer Care materials',
      ],
      cautions: [
        'Public product pages and calculators do not prove buyer-specific net price, negotiated credits, reseller terms, private discounts, migration funds, support concessions, or renewal protections',
        'Workload fit depends on region, zone, service availability, architecture, data path, identity model, support tier, quota, migration plan, and operating maturity',
        'Committed-use decisions can create underutilization risk if commitments are bought before actual usage, eligible resources, project scope, and billing-account ownership are governed',
      ],
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.products,
        GOOGLE_CLOUD_SOURCE_BASIS.locations,
        GOOGLE_CLOUD_SOURCE_BASIS.geography,
        GOOGLE_CLOUD_SOURCE_BASIS.trustCenter,
        GOOGLE_CLOUD_SOURCE_BASIS.compliance,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public Google Cloud pricing and estimate orientation only',
      model: 'usage-based',
      metric:
        'Product configuration, region, usage volume, storage, data transfer, support, marketplace, billing-account pricing, and service-specific meters',
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.pricingCalculator,
        GOOGLE_CLOUD_SOURCE_BASIS.products,
        GOOGLE_CLOUD_BUYER_DATA_GAP,
      ],
      confidence: 0.7,
      notes:
        'Use the pricing calculator and public product pages to identify meters and estimate scenarios. Do not infer buyer net price, private discount, credit balance, negotiated support rate, marketplace economics, or renewal baseline without quote, order-form, billing-export, invoice, and forecast evidence.',
    },
    {
      label: 'Committed use discount governance anchor',
      model: 'hybrid',
      metric:
        'Spend-based or resource-based commitment, eligible resources, billing account, region or project scope, one-year or three-year term, utilization, underutilization, overage, and renewal decision',
      sourceBasis: [GOOGLE_CLOUD_SOURCE_BASIS.committedUseDiscounts, GOOGLE_CLOUD_BUYER_DATA_GAP],
      confidence: 0.75,
      notes:
        'Google Cloud documents spend-based and resource-based committed-use models. Treat commitments as forecast-backed commercial instruments, not generic discounts, because value depends on eligible usage, commitment scope, hourly utilization, overage treatment, and the buyer operating model.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Workload, project, region, and service boundary',
      buyerPosition:
        'Attach a workload schedule that names projects, billing accounts, services, regions, zones, environments, data classifications, support tier, marketplace products, migration waves, and owners before award or renewal.',
      fallbackPosition:
        'If the final workload inventory is incomplete, separate committed baseline from optional growth and require architecture, security, finance, and data-owner signoff before scaling commitments.',
      walkawayTriggers: [
        'Proposal bundles cloud credits, migration scope, support, and committed spend without a workload-level inventory and billing-account ownership map',
      ],
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.products,
        GOOGLE_CLOUD_SOURCE_BASIS.locations,
        GOOGLE_CLOUD_SOURCE_BASIS.geography,
        GOOGLE_CLOUD_BUYER_DATA_GAP,
      ],
    },
    {
      clauseArea: 'Data processing, deletion, security controls, and subprocessors',
      buyerPosition:
        'Map customer data, personal data, regulated data, logging, support access, encryption, identity, key management, export, deletion, subprocessor, and incident-notification requirements to the exact Google Cloud services in scope.',
      fallbackPosition:
        'If privacy or security review is not complete, restrict activation to non-regulated workloads and require DPA, subprocessor, access-control, export, and deletion evidence before regulated data enters production.',
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.dpa,
        GOOGLE_CLOUD_SOURCE_BASIS.trustCenter,
        GOOGLE_CLOUD_SOURCE_BASIS.compliance,
      ],
    },
    {
      clauseArea: 'SLA, support, resilience, and exit governance',
      buyerPosition:
        'Tie each production workload to applicable service SLAs, architecture assumptions, support tier, incident escalation path, region or zone design, backup and restore design, data export path, and transition assistance.',
      fallbackPosition:
        'At minimum, require a workload resilience runbook, support-case escalation model, billing export, service dependency map, and exit or rollback test before business-critical migration.',
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.slas,
        GOOGLE_CLOUD_SOURCE_BASIS.support,
        GOOGLE_CLOUD_SOURCE_BASIS.geography,
        GOOGLE_CLOUD_SOURCE_BASIS.terms,
      ],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Forecast-backed commitment sizing',
      whenToUse:
        'Use before buying committed use discounts, cloud credits, enterprise discount constructs, or reseller commitments tied to multi-year Google Cloud consumption.',
      buyerAsk:
        'Exchange commitment for a signed forecast workbook, eligibility map, billing-account model, underutilization owner, monthly utilization reporting, downsizing path where available, and quote refresh if architecture or region scope changes.',
      tradeoffs: [
        'Commitments may improve unit economics for predictable workloads, but they can destroy value when workloads migrate late, move regions, use ineligible services, or are over-forecasted.',
      ],
      evidenceBasis: [GOOGLE_CLOUD_SOURCE_BASIS.committedUseDiscounts, GOOGLE_CLOUD_SOURCE_BASIS.pricingCalculator, GOOGLE_CLOUD_BUYER_DATA_GAP],
    },
    {
      lever: 'Regulated workload proof before platform expansion',
      whenToUse:
        'Use when Google Cloud is proposed for healthcare, financial services, public-sector, AI, analytics, identity, security, or other workloads with explicit residency, compliance, or audit obligations.',
      buyerAsk:
        'Gate expansion on region and service availability, data-flow mapping, Assured Workloads or residency decision where applicable, compliance evidence, support-data rules, security controls, incident workflow, and workload-owner acceptance.',
      tradeoffs: [
        'Compliance proof can slow commercial close, but it avoids buying broad platform capacity before the buyer knows which services, regions, controls, and legal terms actually satisfy the workload.',
      ],
      evidenceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.compliance,
        GOOGLE_CLOUD_SOURCE_BASIS.assuredWorkloads,
        GOOGLE_CLOUD_SOURCE_BASIS.dpa,
        GOOGLE_CLOUD_BUYER_DATA_GAP,
      ],
    },
    {
      lever: 'Support and operating model as price-value exchange',
      whenToUse:
        'Use when production dependency, migration urgency, executive visibility, or incident tolerance makes Customer Care, technical account coverage, architecture review, and escalation paths material to value.',
      buyerAsk:
        'Require support scope, response expectations, named escalation path if purchased, critical workload inventory, case-review cadence, cloud operations roles, and architecture acceptance criteria alongside discount or credit negotiations.',
      evidenceBasis: [GOOGLE_CLOUD_SOURCE_BASIS.support, GOOGLE_CLOUD_SOURCE_BASIS.slas, GOOGLE_CLOUD_BUYER_DATA_GAP],
    },
  ],
  riskFactors: [
    {
      id: 'googlecloud-commitment-overfit',
      label: 'Commitment overfit before workload proof',
      severity: 'high',
      detectionSignals: [
        'Business case assumes committed-use savings before workloads, regions, eligible services, billing account, and utilization forecast are approved',
        'Order form pushes multi-year consumption while migration schedule, exit dependencies, quota, and ownership are still unresolved',
      ],
      mitigations: ['Build commitment forecast workbook', 'Separate baseline from growth', 'Review utilization monthly', 'Tie expansion to migration gates'],
      contractualRemedies: ['Commitment schedule', 'Usage-reporting covenant', 'Phased purchase right', 'Quote refresh and workload substitution language'],
      sourceBasis: [GOOGLE_CLOUD_SOURCE_BASIS.committedUseDiscounts, GOOGLE_CLOUD_BUYER_DATA_GAP],
    },
    {
      id: 'googlecloud-service-region-residency-mismatch',
      label: 'Service, region, and residency mismatch',
      severity: 'high',
      detectionSignals: [
        'Architecture requires a region, data-location control, or sovereignty posture that is not confirmed for the exact services being purchased',
        'Compliance review cites broad Google Cloud posture without matching it to workload data flow, service scope, support access, and customer-managed controls',
      ],
      mitigations: ['Map services to regions', 'Confirm data residency requirements', 'Review compliance scope', 'Document customer security responsibilities'],
      contractualRemedies: ['Region and service schedule', 'Compliance evidence exhibit', 'Regulated workload activation gate', 'Exit and migration support language'],
      sourceBasis: [
        GOOGLE_CLOUD_SOURCE_BASIS.locations,
        GOOGLE_CLOUD_SOURCE_BASIS.assuredWorkloads,
        GOOGLE_CLOUD_SOURCE_BASIS.dpa,
        GOOGLE_CLOUD_SOURCE_BASIS.compliance,
      ],
    },
    {
      id: 'googlecloud-support-sla-assumption-gap',
      label: 'Support and SLA assumption gap',
      severity: 'medium',
      detectionSignals: [
        'Stakeholders assume a generic cloud SLA or named support coverage without mapping applicable service SLA, architecture design, support tier, and incident escalation path',
      ],
      mitigations: ['Map each critical service to applicable SLA', 'Select support tier deliberately', 'Run incident and restoration tabletop before migration'],
      contractualRemedies: ['Support schedule', 'Critical workload exhibit', 'Incident escalation process', 'Resilience and restoration acceptance gate'],
      sourceBasis: [GOOGLE_CLOUD_SOURCE_BASIS.slas, GOOGLE_CLOUD_SOURCE_BASIS.support, GOOGLE_CLOUD_SOURCE_BASIS.geography],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Treat Google Cloud as a potential ICT third-party dependency for regulated workloads, with workload criticality, operational resilience, exit, audit, incident, subcontractor, region, and support evidence documented before commitment.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'GDPR if personal data is processed'],
      additionalRequirements: ['Exit plan', 'Operational resilience mapping', 'Subprocessor and support-access review', 'Critical workload inventory'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm service eligibility, BAA or HIPAA path where applicable, PHI boundaries, Cloud Healthcare API scope, logging, support access, encryption, data residency, and deletion or export needs before regulated data enters Google Cloud services.',
      regulatoryRefs: ['HIPAA if PHI is processed', 'GDPR if personal data is processed'],
      additionalRequirements: ['PHI data-flow map', 'BAA/HIPAA review', 'Retention and export plan', 'Sensitive-data logging controls'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate authorization boundary, FedRAMP or government program fit, contract vehicle, region, support path, identity model, logging, incident reporting, and service-specific compliance evidence before purchase or migration.',
      regulatoryRefs: ['FedRAMP if required by agency or workload'],
      affectedStages: ['MarketScan', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'manufacturing',
      modifier:
        'Map plant, edge, IoT, analytics, SAP, AI, data residency, latency, network, backup, and supplier-access dependencies before committing to platform credits or workload migration.',
      additionalRequirements: ['Latency and network design', 'IP and supplier-access review', 'Disaster recovery proof', 'Industrial data classification'],
    },
  ],
  body: `## Summary
Google Cloud sourcing should be handled as a platform operating-model decision, not as a generic cloud rate-card exercise. Official Google Cloud materials show a broad product surface across compute, storage, containers, serverless, databases, analytics, AI and machine learning, networking, security, developer tools, observability, API management, migration, disaster recovery, and industry solutions. The same public corpus also exposes the pieces a sourcing team must normalize: regions and zones, service availability, product-specific SLAs, Customer Care options, online terms, service-specific terms, the Data Processing Addendum, trust and compliance resources, data residency documentation, the pricing calculator, and committed use discount mechanics. Those sources are useful for structure and due diligence, but they do not establish the buyer's negotiated economics. Keep public facts separate from buyer evidence such as order forms, billing exports, invoices, quotes, private marketplace terms, support schedules, migration statements of work, and architecture signoffs.

## When to apply
Use this pattern when a buyer is selecting Google Cloud as a new strategic cloud, renewing an existing enterprise agreement, buying committed use discounts, moving workloads from another cloud or data center, expanding into Vertex AI or analytics, adopting GKE or Cloud Run as a platform standard, moving regulated data onto Google Cloud, or adding Premium or Enhanced support. It is also useful when a business sponsor frames cloud sourcing as a credit negotiation. Credits may matter, but they are not enough. The sourcing record must explain which workloads are moving, which projects and billing accounts own spend, which services and regions are in scope, which data classes are processed, how identity and key controls work, what support model applies, and who owns FinOps, security, resilience, and exit.

## Category boundary
Separate the platform into commercial layers. The infrastructure layer includes Compute Engine, storage, networking, GKE, Cloud Run, databases, disaster recovery, observability, and operations services. The data and AI layer includes BigQuery, data processing, governance, Vertex AI, model-serving, and analytics services. The security and compliance layer includes IAM, key management, logging, security posture tools, DPA obligations, compliance evidence, residency controls, and support-data rules. The commercial layer includes usage meters, region choices, support, marketplace items, committed use discounts, credits, reseller terms, and order-form commitments. A credible Google Cloud comparison needs all layers, because a low unit price can be outweighed by region mismatch, unsupported service scope, underutilized commitments, migration delay, data-transfer exposure, or unfunded operating obligations.

## Commercial model
Build the pricing workbook from actual architecture, not averages. Start with workload inventory by project, service, environment, owner, region, data class, and migration wave. Add baseline usage from billing exports or invoices where available. Model product meters through official pricing pages and the pricing calculator, then separate public estimates from buyer-specific prices. For committed use discounts, document whether the buyer is considering spend-based or resource-based commitments, the eligible resources, the billing-account scope, the term, the region or service constraints, expected hourly utilization, overage behavior, and underutilization owner. Do not treat CUDs as simple discounts. They exchange flexibility for a commitment, so the sourcing decision should be backed by steady-state workloads, migration readiness, and an approval path if forecasted usage changes.

## Security, privacy, and compliance
Use official trust, compliance, DPA, SLA, and Assured Workloads materials to build the evidence checklist, then map them to the exact workload. The DPA describes customer deletion and export mechanisms, Google security measures, incident notification, subprocessor governance, and customer security responsibilities. That does not remove the buyer's obligation to classify data, configure access, administer credentials, decide encryption and key ownership, retain backups where appropriate, and control what enters support tickets and logs. For regulated workloads, require a data-flow map, service-by-service compliance scope, region and residency decision, support-access rules, audit evidence, incident workflow, and exit or deletion plan before production activation.

## Evaluation rubric
Score Google Cloud across workload fit, commercial transparency, security controls, data and AI governance, operational resilience, support maturity, FinOps readiness, migration feasibility, and exit. Workload fit covers service availability, region choice, latency, quotas, architecture, integration, and modernization path. Commercial transparency covers meter decomposition, public estimates, negotiated discounts, credits, support, marketplace, CUDs, billing exports, and renewal baseline. Security covers IAM, logging, encryption, key management, compliance evidence, subprocessors, support-data handling, and customer control duties. Operational resilience covers regional design, applicable SLAs, backup and restore, incident escalation, Customer Care tier, and service dependency mapping. FinOps readiness covers tagging, budgets, chargeback, utilization reporting, anomaly detection, and commitment governance.

## Contradictions and failure modes
Vendor claim: the enterprise discount or credit pool solves cost risk. Detection: ask for workload-level usage forecast, billing export, meter decomposition, CUD eligibility, region plan, support scope, and underutilization owner. Vendor claim: Google Cloud compliance posture satisfies the regulated workload. Detection: require service-specific compliance evidence, data-flow mapping, DPA review, support-access rules, region or residency decision, and customer-control mapping. Vendor claim: migration commitments justify a larger purchase now. Detection: require dependency inventory, wave plan, application acceptance criteria, data migration proof, operating owner, rollback plan, and monthly value checkpoint.

## Commercial outcome
The desired output is a controlled Google Cloud buying record. It should state services, projects, billing accounts, regions, data classes, workloads, owners, support tier, expected usage, committed-use scope, credit treatment, marketplace or reseller path, security controls, compliance evidence, SLAs, incident process, migration responsibilities, exit paths, and renewal protections. Any claim about private discounts, credits, migration funding, support concessions, or renewal caps should remain blank until the buyer has signed or auditable evidence.`,
};
