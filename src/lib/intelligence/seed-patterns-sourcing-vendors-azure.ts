import type { PatternSeed, SourceBasisRef } from './seed-types';

const AS_OF = '2026-04-29';

const AZURE_SOURCE_BASIS = {
  solutions: {
    type: 'public-disclosure',
    label: 'Microsoft Azure cloud solutions',
    url: 'https://azure.microsoft.com/en-us/solutions/',
    asOf: AS_OF,
    note:
      'Official Azure solutions page describing Azure solution categories across AI, application development, migration and modernization, data and analytics, hybrid infrastructure, IoT, security, governance, resiliency, and networking.',
  },
  products: {
    type: 'public-disclosure',
    label: 'Microsoft Azure products',
    url: 'https://azure.microsoft.com/en-us/products/',
    asOf: AS_OF,
    note:
      'Official Azure product catalog for service-family discovery across compute, containers, databases, analytics, AI, identity, management, networking, security, storage, and developer services.',
  },
  pricing: {
    type: 'public-disclosure',
    label: 'Azure pricing overview',
    url: 'https://azure.microsoft.com/en-us/pricing/',
    asOf: AS_OF,
    note:
      'Official Azure pricing page describing pay-as-you-use orientation, pricing by product, pricing calculator, reservations, savings plans, Azure Hybrid Benefit, FinOps, Azure Advisor, and Microsoft Cost Management resources.',
  },
  pricingCalculator: {
    type: 'public-disclosure',
    label: 'Azure pricing calculator',
    url: 'https://azure.microsoft.com/en-us/pricing/calculator/',
    asOf: AS_OF,
    note:
      'Official calculator entry point for estimating Azure product and service costs before purchase or architecture change.',
  },
  reservations: {
    type: 'public-disclosure',
    label: 'Azure reservations',
    url: 'https://azure.microsoft.com/en-us/pricing/offers/reservations/',
    asOf: AS_OF,
    note:
      'Official reservations page describing committed-capacity pricing constructs and service-family reservation orientation.',
  },
  savingsPlans: {
    type: 'public-disclosure',
    label: 'Azure savings plans',
    url: 'https://azure.microsoft.com/en-us/pricing/offers/savings-plans/',
    asOf: AS_OF,
    note:
      'Official savings-plan page describing one-year and three-year commitment constructs, eligible compute and database services, hourly commitment behavior, scope options, and usage-reporting orientation.',
  },
  hybridBenefit: {
    type: 'public-disclosure',
    label: 'Azure Hybrid Benefit',
    url: 'https://azure.microsoft.com/en-us/pricing/offers/hybrid-benefit/',
    asOf: AS_OF,
    note:
      'Official Azure Hybrid Benefit page describing use of eligible Windows Server, SQL Server, and Linux subscription rights with Azure resources.',
  },
  costManagement: {
    type: 'public-disclosure',
    label: 'Microsoft Cost Management and Billing overview',
    url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/cost-management-billing-overview',
    asOf: AS_OF,
    note:
      'Microsoft Learn overview for Azure billing, cost analysis, budgets, recommendations, exports, and account-management surfaces.',
  },
  wellArchitected: {
    type: 'public-disclosure',
    label: 'Azure Well-Architected Framework',
    url: 'https://learn.microsoft.com/en-us/azure/well-architected/what-is-well-architected-framework',
    asOf: AS_OF,
    note:
      'Microsoft Learn framework describing workload quality across reliability, security, cost optimization, operational excellence, and performance efficiency.',
  },
  regions: {
    type: 'public-disclosure',
    label: 'Azure regions overview',
    url: 'https://learn.microsoft.com/en-us/azure/reliability/regions-overview',
    asOf: AS_OF,
    note:
      'Microsoft Learn page explaining Azure regions, geographies, data residency boundaries, availability-zone availability, paired and nonpaired regions, and sovereign cloud considerations.',
  },
  availabilityZones: {
    type: 'public-disclosure',
    label: 'Azure availability zones overview',
    url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
    asOf: AS_OF,
    note:
      'Microsoft Learn page describing availability zones as physically separate groups of datacenters within supported regions and explaining zonal and zone-redundant design considerations.',
  },
  productTerms: {
    type: 'public-disclosure',
    label: 'Microsoft Product Terms for Microsoft Azure under MCA',
    url: 'https://www.microsoft.com/licensing/terms/productoffering/MicrosoftAzure/MCA',
    asOf: AS_OF,
    note:
      'Official Microsoft Product Terms page for Microsoft Azure under the Microsoft Customer Agreement licensing program.',
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Microsoft Products and Services Data Protection Addendum',
    url: 'https://www.microsoft.com/licensing/docs/view/microsoft-products-and-services-data-protection-addendum-dpa',
    asOf: AS_OF,
    note:
      'Official Microsoft licensing page for the current and archived Microsoft Products and Services Data Protection Addendum downloads.',
  },
  sla: {
    type: 'public-disclosure',
    label: 'Service Level Agreements for Online Services',
    url: 'https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services?lang=1',
    asOf: AS_OF,
    note:
      'Official Microsoft licensing page for current and archived Service Level Agreements for Online Services, including Microsoft Azure online services.',
  },
  compliance: {
    type: 'public-disclosure',
    label: 'Azure and Microsoft cloud compliance offerings',
    url: 'https://learn.microsoft.com/en-us/azure/compliance/offerings/',
    asOf: AS_OF,
    note:
      'Microsoft Learn compliance page describing Azure as a hyperscale cloud platform, Azure cloud environments, customer-data region selection concepts, and access to audit documentation through the Service Trust Portal.',
  },
  trust: {
    type: 'public-disclosure',
    label: 'Azure trusted cloud',
    url: 'https://azure.microsoft.com/en-us/support/trust-center/',
    asOf: AS_OF,
    note:
      'Official Azure trust entry point for security, compliance, privacy, resiliency, and responsible AI trust resources.',
  },
} satisfies Record<string, SourceBasisRef>;

const AZURE_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label:
    'Buyer-specific Azure consumption history, enterprise agreement, Microsoft Customer Agreement, CSP records, private offers, invoices, reservation and savings-plan utilization, architecture inventory, support scope, and negotiated amendments needed',
  asOf: AS_OF,
  note:
    'Official Microsoft and Azure pages describe product scope, pricing mechanisms, commitment programs, legal terms, data protection resources, SLAs, and trust resources, but do not establish buyer-specific net price, private discount, committed-spend economics, reseller margin, support concessions, renewal protection, workload TCO, or workload risk posture.',
};

const AZURE_VENDOR_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Azure estate, tenant, and workload scope',
    order: 1,
    description:
      'Baseline tenants, subscriptions, management groups, regions, workloads, data classes, identity model, network topology, security services, marketplace purchases, support plan, billing channel, and current cloud operating model.',
  },
  {
    id: 'CommercialBaseline',
    label: 'Consumption, commitment, and licensing baseline',
    order: 2,
    description:
      'Separate pay-as-you-go usage, enterprise agreement or MCA terms, CSP channel, reservations, savings plans, Azure Hybrid Benefit, marketplace private offers, support, migration credits, and buyer-specific discount or commitment evidence.',
  },
  {
    id: 'ArchitectureProof',
    label: 'Reliability, security, data, and FinOps proof',
    order: 3,
    description:
      'Prove workload fit with region selection, availability zones, recovery design, identity, network segmentation, logging, backup, policy, data residency, cost model, guardrails, and operating ownership.',
  },
  {
    id: 'BAFO',
    label: 'Normalized BAFO and operating-model trade',
    order: 4,
    description:
      'Normalize all finalists or Microsoft channels against the same workload bill of materials, migration plan, committed-spend proposal, support obligations, governance controls, and exit or portability assumptions.',
  },
  {
    id: 'Contracting',
    label: 'Terms, DPA, SLA, support, and exit lock',
    order: 5,
    description:
      'Close Product Terms, DPA, SLA, data residency, security evidence, support, incident escalation, marketplace/private-offer terms, usage reporting, renewal protections, and transition commitments before expanding committed spend.',
  },
];

export const PAT_SRC_VEN_AZURE_001: PatternSeed = {
  id: 'PAT-SRC-VEN-AZURE-001',
  slug: 'microsoft-azure-cloud-platform-sourcing-profile',
  title: 'Microsoft Azure Cloud Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Microsoft Azure sourcing should treat the vendor as a cloud operating platform, commercial commitment, data-residency boundary, and workload architecture decision rather than a commodity infrastructure price comparison.',
  applicability:
    'Apply when sourcing, renewing, expanding, benchmarking, or governing Microsoft Azure, Azure Marketplace, Azure AI and data services, infrastructure migration, cloud modernization, hybrid cloud, committed spend, reservations, savings plans, Azure Hybrid Benefit, enterprise support, or regulated workload deployment.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: AS_OF,
  instanceCount: 0,
  sourceDocuments: Object.values(AZURE_SOURCE_BASIS).map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'GDPR-if-personal-data',
    'HIPAA-if-PHI-and-BAA-required',
    'FedRAMP-if-US-public-sector',
    'DORA-if-regulated-financial-entity',
    'Data-residency-if-region-or-geography-required',
    'Export-control-if-restricted-workloads',
    'AI-governance-if-Azure-AI-or-agentic-services-in-scope',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-LLM-001', 'PAT-SRC-PRC-CLOUD-001', 'PAT-SRC-CON-004'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'infrastructure',
  vendorClass: 'direct-tech',
  lifecycleStages: AZURE_VENDOR_LIFECYCLE_STAGES,
  vendorLandscape: [
    {
      vendorName: 'Microsoft Azure',
      tier: 'enterprise',
      positioning:
        'Hyperscale cloud platform spanning infrastructure, containers, databases, analytics, AI, application development, identity-adjacent services, management, security, networking, storage, hybrid cloud, marketplace, and migration-modernization programs.',
      strengths: [
        'Official Azure materials expose broad service-family coverage across AI, application development, cloud migration and modernization, data and analytics, hybrid infrastructure, security, governance, resiliency, networking, and storage',
        'Official pricing resources provide public mechanisms for pay-as-you-use modeling, pricing calculator estimates, reservations, savings plans, Azure Hybrid Benefit, FinOps, Advisor, and Microsoft Cost Management',
        'Official Microsoft legal and trust resources provide public anchors for Product Terms, DPA, Online Services SLAs, compliance offerings, Service Trust Portal evidence, and trusted-cloud review',
      ],
      cautions: [
        'Public Azure pages do not prove buyer-specific net price, discount, commitment burn, enterprise agreement economics, support concession, CSP margin, private-offer treatment, workload TCO, or migration cost',
        'Commercial optimization can create technical risk if reservations, savings plans, region choices, storage tiers, networking, licensing benefits, or decommissioning assumptions are not tied to architecture and operations evidence',
        'Azure service availability, data residency, compliance evidence, SLA terms, and customer responsibilities must be mapped to the exact service, region, tenant, support path, and workload design being purchased',
      ],
      sourceBasis: [
        AZURE_SOURCE_BASIS.solutions,
        AZURE_SOURCE_BASIS.products,
        AZURE_SOURCE_BASIS.pricing,
        AZURE_SOURCE_BASIS.productTerms,
        AZURE_SOURCE_BASIS.trust,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Official Azure pricing and calculator orientation only',
      model: 'usage-based',
      metric:
        'Service family, region, meter, SKU, usage volume, storage tier, network transfer, support, marketplace, reservation, savings-plan, and Azure Hybrid Benefit assumptions',
      sourceBasis: [AZURE_SOURCE_BASIS.pricing, AZURE_SOURCE_BASIS.pricingCalculator],
      confidence: 0.74,
      notes:
        'Use official pricing pages and calculators to establish public meters, estimate shape, and scenario orientation. Do not infer buyer-specific net rates, discount bands, committed-spend liability, support concessions, migration credits, or private-offer economics without buyer quotes, agreements, invoices, portal exports, and approved benchmark evidence.',
    },
    {
      label: 'Azure commitment and license-benefit mechanisms',
      model: 'hybrid',
      metric: 'Reservations, savings plans, Azure Hybrid Benefit, enterprise agreement or MCA commitment, CSP billing, marketplace private offers, utilization, expiration, exchange, and renewal rules',
      sourceBasis: [AZURE_SOURCE_BASIS.reservations, AZURE_SOURCE_BASIS.savingsPlans, AZURE_SOURCE_BASIS.hybridBenefit, AZURE_BUYER_DATA_GAP],
      confidence: 0.7,
      notes:
        'Commitment constructs can lower unit rates when workload shape is stable, but the sourcing file should prove utilization, workload durability, migration schedule, cancellation or modification limits, and license eligibility before counting savings.',
    },
    {
      label: 'Founder data gap - Azure commercial evidence required',
      model: 'unknown',
      sourceBasis: [AZURE_BUYER_DATA_GAP],
      confidence: 0.16,
      notes:
        'No recommendation should show numeric discount guidance, renewal exposure, migration ROI, or competitor benchmark deltas until buyer-approved consumption exports, contracts, quotes, invoices, support records, and workload inventories are available.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Commercial commitment, billing, and usage governance',
      buyerPosition:
        'Attach a commercial exhibit separating billing account, agreement program, CSP or direct channel, subscriptions, committed spend, reservation and savings-plan inventory, marketplace private offers, support plan, credits, renewals, expiration dates, utilization reporting, budget alerts, and governance owners.',
      fallbackPosition:
        'If the buyer cannot fully baseline usage before BAFO, limit commitments to proven workloads and require monthly cost exports, budget alerts, commitment utilization reporting, and approval gates for optional expansion.',
      walkawayTriggers: [
        'Proposal depends on committed spend, reservations, savings plans, or license benefits without a workload-level utilization model',
        'Final order form or channel quote hides support, marketplace, credit, reseller, or renewal mechanics from the buyer governance team',
      ],
      sourceBasis: [AZURE_SOURCE_BASIS.pricing, AZURE_SOURCE_BASIS.costManagement, AZURE_SOURCE_BASIS.savingsPlans, AZURE_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Data protection, compliance, region, and residency controls',
      buyerPosition:
        'Map Product Terms, DPA, compliance offerings, Service Trust Portal evidence, region and geography choices, availability-zone design, data classification, logs, backups, support access, subprocessors, deletion, and incident obligations to each workload.',
      fallbackPosition:
        'For regulated or sensitive workloads, make security, privacy, legal, risk, and architecture signoff a pre-production gate rather than relying on generic trust resources.',
      sourceBasis: [
        AZURE_SOURCE_BASIS.productTerms,
        AZURE_SOURCE_BASIS.dpa,
        AZURE_SOURCE_BASIS.compliance,
        AZURE_SOURCE_BASIS.regions,
        AZURE_SOURCE_BASIS.trust,
      ],
    },
    {
      clauseArea: 'Reliability, SLA, support, and operating responsibility',
      buyerPosition:
        'Define target availability, recovery objectives, region and zone design, backup, monitoring, incident escalation, support plan, service-credit path, customer responsibilities, architecture review, and operational runbooks for each production workload.',
      fallbackPosition:
        'If standard SLA remedies are the only contractual remedy, strengthen operational evidence with support escalation, architecture proof, recovery tests, runbooks, and executive incident-communication commitments.',
      sourceBasis: [AZURE_SOURCE_BASIS.sla, AZURE_SOURCE_BASIS.wellArchitected, AZURE_SOURCE_BASIS.availabilityZones],
    },
    {
      clauseArea: 'Exit, portability, and marketplace dependency',
      buyerPosition:
        'Document data export, backup restoration, image and container portability, database migration path, private endpoint and DNS rollback, key ownership, marketplace subscription exit, third-party private-offer obligations, and decommission responsibilities.',
      fallbackPosition:
        'If full exit testing is not practical before award, require an exit architecture, sample restore, data-export evidence, and transition-assistance plan for critical workloads.',
      sourceBasis: [AZURE_SOURCE_BASIS.products, AZURE_SOURCE_BASIS.productTerms, AZURE_BUYER_DATA_GAP],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Consumption-backed commitment sizing',
      whenToUse:
        'Use before renewing an enterprise agreement, moving to a larger MCA commitment, buying reservations or savings plans, or accepting a Microsoft or partner growth proposal.',
      buyerAsk:
        'Size commitments only against workloads with known owners, region plans, usage history, migration dates, decommission assumptions, license eligibility, and monthly utilization reporting.',
      tradeoffs: [
        'A larger commitment can improve unit economics, but it can also create shelfware-like cloud waste if migration, modernization, or workload retirement assumptions slip.',
      ],
      evidenceBasis: [AZURE_SOURCE_BASIS.pricing, AZURE_SOURCE_BASIS.costManagement, AZURE_SOURCE_BASIS.savingsPlans, AZURE_BUYER_DATA_GAP],
    },
    {
      lever: 'Architecture proof before strategic expansion',
      whenToUse:
        'Use when Azure is proposed for mission-critical migration, AI workloads, regulated data, hybrid cloud, disaster recovery, or platform consolidation.',
      buyerAsk:
        'Require buyer-authored proofs for identity, network, logging, policy, backup, recovery, region and zone selection, cost guardrails, performance, support escalation, and data residency before counting savings or approving scale.',
      tradeoffs: ['Proof work can slow contracting, but it prevents commercial commitments from outrunning operational readiness.'],
      evidenceBasis: [AZURE_SOURCE_BASIS.wellArchitected, AZURE_SOURCE_BASIS.regions, AZURE_SOURCE_BASIS.availabilityZones],
    },
    {
      lever: 'Separate Microsoft direct, CSP, marketplace, and partner value',
      whenToUse:
        'Use when Microsoft, a reseller, a CSP, a systems integrator, or a marketplace publisher bundles credits, support, private offers, implementation services, or tooling into one Azure business case.',
      buyerAsk:
        'Require line-item separation of Azure platform spend, third-party marketplace spend, partner services, support, credits, private offers, reseller margin, managed services, and renewal obligations.',
      evidenceBasis: [AZURE_SOURCE_BASIS.productTerms, AZURE_SOURCE_BASIS.pricing, AZURE_BUYER_DATA_GAP],
    },
  ],
  riskFactors: [
    {
      id: 'azure-commitment-overreach',
      label: 'Committed-spend overreach',
      severity: 'high',
      detectionSignals: [
        'Proposed enterprise commitment grows faster than proven workload migration, modernization, or utilization evidence',
        'Reservations, savings plans, or license benefits are counted as savings without owner-approved workload durability and eligibility evidence',
      ],
      mitigations: ['Build monthly consumption baseline', 'Tie commitments to named workloads', 'Require utilization reporting', 'Stage commitments behind migration gates'],
      contractualRemedies: ['Commitment schedule', 'Usage reporting covenant', 'Renewal and expiration calendar', 'Downsize or reallocation language where available'],
      sourceBasis: [AZURE_SOURCE_BASIS.pricing, AZURE_SOURCE_BASIS.savingsPlans, AZURE_SOURCE_BASIS.hybridBenefit, AZURE_BUYER_DATA_GAP],
    },
    {
      id: 'azure-architecture-commercial-mismatch',
      label: 'Architecture and commercial model mismatch',
      severity: 'high',
      detectionSignals: [
        'Price model assumes one region, SKU, storage tier, egress pattern, or resiliency posture while architecture requires a different design',
        'FinOps model does not include data transfer, backup, logging, monitoring, support, marketplace, security, or disaster-recovery costs',
      ],
      mitigations: ['Run Well-Architected review', 'Build workload bill of materials', 'Model sensitivity cases', 'Require cost guardrails before production'],
      contractualRemedies: ['Architecture exhibit', 'Pricing-meter schedule', 'Support exhibit', 'Migration acceptance gate'],
      sourceBasis: [AZURE_SOURCE_BASIS.wellArchitected, AZURE_SOURCE_BASIS.pricingCalculator, AZURE_SOURCE_BASIS.costManagement],
    },
    {
      id: 'azure-data-residency-and-compliance-gap',
      label: 'Data residency and compliance gap',
      severity: 'high',
      detectionSignals: [
        'Regulated workload scope names Azure generally but not the exact services, regions, geographies, logs, backups, support paths, or customer responsibilities',
        'Security review relies on broad trust resources without mapping DPA, compliance evidence, and SLA terms to the workload design',
      ],
      mitigations: ['Map data flows by service and region', 'Review DPA and Product Terms', 'Collect Service Trust Portal evidence', 'Validate backup and support data handling'],
      contractualRemedies: ['Security and privacy exhibit', 'Region and residency schedule', 'Incident notice path', 'Exit and deletion obligations'],
      sourceBasis: [AZURE_SOURCE_BASIS.dpa, AZURE_SOURCE_BASIS.compliance, AZURE_SOURCE_BASIS.regions, AZURE_SOURCE_BASIS.trust],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Raise operational resilience, outsourcing, audit, concentration-risk, exit, data-location, incident-reporting, and regulator-evidence scrutiny for core banking, payments, trading, insurance, and regulated analytics workloads.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'local banking outsourcing rules where applicable'],
      affectedStages: ['Scope', 'ArchitectureProof', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm PHI boundaries across compute, storage, logs, AI services, support artifacts, backups, integrations, and marketplace services; require HIPAA and BAA review where applicable.',
      regulatoryRefs: ['HIPAA-if-PHI', 'state health privacy laws where applicable'],
      affectedStages: ['Scope', 'ArchitectureProof', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate government cloud, sovereign cloud, procurement vehicle, authorization, accessibility, data residency, CJIS or defense requirements, support access, and audit-document availability before award.',
      regulatoryRefs: ['FedRAMP-if-US-federal', 'sovereign-cloud-rules-if-applicable'],
      affectedStages: ['Scope', 'BAFO', 'Contracting'],
    },
    {
      industry: 'retail_cpg',
      modifier:
        'Model seasonal demand, ecommerce performance, payment-data boundaries, edge and networking dependencies, campaign scaling, and cost spikes before buying commitments tied to peak traffic assumptions.',
      regulatoryRefs: ['PCI-DSS-if-cardholder-data'],
      affectedStages: ['Scope', 'ArchitectureProof', 'BAFO'],
    },
  ],
  body: `## Summary
Microsoft Azure should be sourced as a cloud operating platform decision, not as a commodity compute bid. The buyer is not just buying virtual machines, storage, databases, AI services, or networking. The buyer is choosing a set of regions, tenants, subscriptions, identity patterns, management groups, security controls, support paths, cost-management practices, marketplace channels, contractual terms, and workload architecture assumptions. Official Azure materials describe a broad cloud platform across AI, application development, migration and modernization, data and analytics, hybrid cloud, infrastructure, networking, security, governance, resiliency, and storage. That breadth creates leverage only when the sourcing file makes the workload, commercial, data, and operating-model boundaries explicit.

## When to apply
Use this profile for a new Azure selection, cloud-provider benchmark, enterprise agreement renewal, Microsoft Customer Agreement commitment, CSP channel review, marketplace-private-offer event, Azure migration, AI workload launch, data-platform modernization, hybrid cloud program, disaster-recovery design, or FinOps reset. It is also useful when Azure is already an incumbent and the real event is not "should we use Azure?" but "what are we committing to, under which channel, against which workloads, with which governance controls?" A buyer should apply this profile before accepting savings claims based on reservations, savings plans, Azure Hybrid Benefit, migration credits, support bundles, marketplace consolidation, or partner-managed services.

## Buyer questions before market contact
Start with estate shape. Identify tenants, subscriptions, management groups, regions, resource groups, owners, environments, workloads, data classes, production criticality, identity providers, network topology, private connectivity, public endpoints, logs, backups, keys, policies, support tickets, and marketplace subscriptions. Then identify the commercial shape: enterprise agreement, MCA, CSP, reseller, marketplace private offers, support plan, committed spend, unused commitment, reservations, savings plans, Hybrid Benefit eligibility, invoice owners, budget owners, tags, chargeback rules, and expiration dates. Finally, identify the operating shape: who can create resources, who approves regions, who responds to incidents, who reviews architecture, who owns cost anomalies, who validates compliance evidence, and who can decommission resources.

## Evidence to collect
Official Azure pricing pages and calculators can orient the buyer to product meters, estimate mechanics, pay-as-you-use models, reservations, savings plans, Azure Hybrid Benefit, Advisor, FinOps, and Microsoft Cost Management. They do not prove buyer-specific economics. The sourcing file should collect portal exports, invoices, enterprise agreement records, MCA or CSP terms, private-offer records, support entitlements, current usage by service and region, reservation utilization, savings-plan utilization, license-position evidence, migration schedules, and decommission plans. For workload fit, collect architecture diagrams, landing-zone standards, region choices, availability-zone design, backup and restore evidence, recovery objectives, security policies, key-management design, logging destinations, data-retention rules, and incident escalation paths.

## Commercial normalization
Normalize Azure at the workload bill-of-material level. A compute-only comparison can be misleading if the design also requires storage, managed databases, network egress, private links, load balancing, backup, monitoring, security, identity, key management, support, migration services, marketplace software, AI tokens or capacity, and disaster recovery. Separate pay-as-you-go estimates from committed-spend proposals. Separate reservations from savings plans. Separate Azure platform spend from third-party marketplace spend. Separate Microsoft direct terms from CSP or reseller terms. Separate license benefits from new license purchases. Do not count Hybrid Benefit savings until license eligibility and assignment are confirmed. Do not count reservation or savings-plan savings until workload durability, region, SKU, term, and utilization risk are approved by finance, architecture, and operations.

## Architecture and risk posture
Azure architecture choices are sourcing facts. Region and geography choices affect data residency, latency, service availability, and resiliency options. Availability zones can improve resilience where supported, but they also require a workload design that uses zones correctly. The Azure Well-Architected Framework is a useful sourcing lens because commercial savings should not outrun reliability, security, cost optimization, operational excellence, and performance efficiency. A low unit price is not enough if the buyer has no landing zone, no tagging discipline, no backup test, no recovery plan, no policy guardrails, no support escalation path, and no owner for cost anomalies. Conversely, a more expensive architecture can be the right decision when regulated data, critical operations, or recovery obligations require stronger controls.

## Contracting posture
Contracting should close four exhibits. The commercial exhibit should show agreement program, channel, billing account, subscriptions, committed spend, support, credits, reservations, savings plans, marketplace offers, renewal dates, utilization reporting, and approval gates. The workload exhibit should list services, regions, data classes, owners, environments, recovery objectives, monitoring, backup, security controls, and customer responsibilities. The legal and trust exhibit should map Product Terms, DPA, Online Services SLA resources, compliance evidence, Service Trust Portal evidence, incident path, deletion, and data residency commitments to the exact workload. The exit exhibit should cover data export, backup restoration, DNS and network rollback, container or image portability, database migration, key ownership, marketplace dependency, and decommission assistance.

## Failure modes
The first failure mode is committed-spend overreach: the buyer signs a larger Azure commitment because a migration or modernization plan is expected, but the workloads slip, retire, or consume different services than planned. The second is architecture-commercial mismatch: pricing assumes one region, SKU, storage tier, network pattern, or resiliency posture while the actual workload needs another. The third is governance lag: teams can create resources faster than finance, security, and operations can tag, monitor, review, and decommission them. The fourth is compliance generalization: the buyer treats Azure trust resources as approval for every workload without mapping the exact services, regions, logs, backups, support access, customer responsibilities, and DPA terms.

## Sourcing recommendation
Run Azure as a three-lane event. Lane one is commercial normalization: consumption baseline, commitment sizing, channel choice, support, marketplace, and commitment utilization. Lane two is architecture proof: landing zone, region, security, reliability, recovery, cost controls, and workload acceptance. Lane three is legal and governance closure: Product Terms, DPA, SLA, trust evidence, data residency, incident path, exit, and operating ownership. Award only the scope that clears all three lanes. If Microsoft or a partner proposes a larger strategic platform commitment, trade scale for measurable commitments: transparent usage reporting, phased spend, support escalation, architecture assistance, private-offer clarity, migration accountability, renewal-calendar controls, and exit evidence. Azure can be a strong enterprise platform, but the sourcing record should prove exactly which workloads, data, controls, costs, and obligations are being committed before the buyer signs.`,
};
