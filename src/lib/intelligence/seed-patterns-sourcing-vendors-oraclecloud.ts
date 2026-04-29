import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const ORACLECLOUD_SOURCE_BASIS = {
  ociOverview: {
    type: 'public-disclosure',
    label: 'Oracle Cloud Infrastructure overview',
    url: 'https://www.oracle.com/cloud/',
    asOf: SOURCE_AS_OF,
  },
  cloudRegions: {
    type: 'public-disclosure',
    label: 'Oracle public cloud regions and data centers',
    url: 'https://www.oracle.com/cloud/public-cloud-regions/',
    asOf: SOURCE_AS_OF,
  },
  universalCredits: {
    type: 'public-disclosure',
    label: 'Oracle Universal Credits',
    url: 'https://www.oracle.com/cloud/universal-credits/',
    asOf: SOURCE_AS_OF,
  },
  serviceLevelAgreements: {
    type: 'public-disclosure',
    label: 'Oracle Cloud Infrastructure Service Level Agreements documentation',
    url: 'https://docs.oracle.com/en-us/iaas/Content/General/Reference/slastatement.htm',
    asOf: SOURCE_AS_OF,
  },
  contracts: {
    type: 'public-disclosure',
    label: 'Oracle Cloud Services contracts',
    url: 'https://www.oracle.com/contracts/cloud-services/',
    asOf: SOURCE_AS_OF,
  },
  dpa: {
    type: 'public-disclosure',
    label: 'Data Processing Agreement for Oracle Cloud Services',
    url: 'https://www.oracle.com/contracts/docs/cloud-dpa-1014-2346862.pdf',
    asOf: SOURCE_AS_OF,
  },
  trustCenter: {
    type: 'public-disclosure',
    label: 'Oracle Trust Center',
    url: 'https://www.oracle.com/trust/',
    asOf: SOURCE_AS_OF,
  },
  securityArchitecture: {
    type: 'public-disclosure',
    label: 'Oracle Cloud Infrastructure security architecture',
    url: 'https://docs.oracle.com/en-us/iaas/Content/cloud-adoption-framework/security-architecture.htm',
    asOf: SOURCE_AS_OF,
  },
  billingCostManagement: {
    type: 'public-disclosure',
    label: 'Oracle Cloud Infrastructure Billing and Cost Management overview',
    url: 'https://docs.oracle.com/en-us/iaas/Content/Billing/Concepts/billingoverview.htm',
    asOf: SOURCE_AS_OF,
  },
  myOracleSupport: {
    type: 'public-disclosure',
    label: 'Contact My Oracle Support for Oracle Cloud services',
    url: 'https://docs.oracle.com/get-started/subscriptions-cloud/csgsg/contact-my-oracle-support.html',
    asOf: SOURCE_AS_OF,
  },
  byolFaq: {
    type: 'public-disclosure',
    label: 'Oracle Bring Your Own License to PaaS FAQ',
    url: 'https://www.oracle.com/uk/cloud/bring-your-own-license/faq/',
    asOf: SOURCE_AS_OF,
  },
  multicloudDatabase: {
    type: 'public-disclosure',
    label: 'Oracle Database multicloud overview',
    url: 'https://www.oracle.com/cloud/multicloud-database-aws-google-azure/',
    asOf: SOURCE_AS_OF,
  },
} satisfies Record<string, SourceBasisRef>;

const ORACLECLOUD_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Oracle Cloud quote, Universal Credits order, tenancy usage, Oracle license position, support history, architecture, migration, and legal redlines needed',
  asOf: SOURCE_AS_OF,
  note:
    'Public Oracle materials describe OCI service scope, regions, Universal Credits mechanics, SLA documentation, contract model, DPA posture, security architecture, support channel, and BYOL concepts, but they do not prove buyer-specific net price, cloud-credit burn, unused-credit risk, overage rate card, private discount, support escalation, Oracle license compliance posture, migration cost, or negotiated remedies.',
};

export const PAT_SRC_VEN_ORACLECLOUD_001: PatternSeed = {
  id: 'PAT-SRC-VEN-ORACLECLOUD-001',
  slug: 'oracle-cloud-infrastructure-sourcing-profile',
  title: 'Oracle Cloud Infrastructure Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Oracle Cloud sourcing should treat OCI as an infrastructure, database, multicloud, licensing, regional-residency, and enterprise-commercial dependency decision rather than a simple compute or storage comparison.',
  applicability:
    'Apply when sourcing, renewing, expanding, benchmarking, or migrating Oracle Cloud Infrastructure, Oracle Database cloud services, Universal Credits, Oracle Database@Azure, Oracle Database@Google Cloud, Oracle Database@AWS, Dedicated Region, Cloud@Customer, AI infrastructure, compute, storage, networking, observability, security, or Oracle license modernization programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-oraclecloud',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: [
    `${ORACLECLOUD_SOURCE_BASIS.ociOverview.label} - ${ORACLECLOUD_SOURCE_BASIS.ociOverview.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.cloudRegions.label} - ${ORACLECLOUD_SOURCE_BASIS.cloudRegions.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.universalCredits.label} - ${ORACLECLOUD_SOURCE_BASIS.universalCredits.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.serviceLevelAgreements.label} - ${ORACLECLOUD_SOURCE_BASIS.serviceLevelAgreements.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.contracts.label} - ${ORACLECLOUD_SOURCE_BASIS.contracts.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.dpa.label} - ${ORACLECLOUD_SOURCE_BASIS.dpa.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.trustCenter.label} - ${ORACLECLOUD_SOURCE_BASIS.trustCenter.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.securityArchitecture.label} - ${ORACLECLOUD_SOURCE_BASIS.securityArchitecture.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.billingCostManagement.label} - ${ORACLECLOUD_SOURCE_BASIS.billingCostManagement.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.myOracleSupport.label} - ${ORACLECLOUD_SOURCE_BASIS.myOracleSupport.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.byolFaq.label} - ${ORACLECLOUD_SOURCE_BASIS.byolFaq.url}`,
    `${ORACLECLOUD_SOURCE_BASIS.multicloudDatabase.label} - ${ORACLECLOUD_SOURCE_BASIS.multicloudDatabase.url}`,
  ],
  regulatoryChips: [
    'GDPR-if-personal-data',
    'DORA-if-regulated-financial-entity',
    'HIPAA-if-PHI',
    'PCI-DSS-if-cardholder-data',
    'FedRAMP-if-public-sector',
    'Data-residency-if-region-or-sovereign-cloud-required',
    'License-compliance-if-Oracle-BYOL-or-support-rewards-in-scope',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-LAKE-001', 'PAT-SRC-CAT-ERP-001', 'PAT-SRC-CON-004', 'PAT-SRC-CON-005'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'infrastructure',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Oracle Cloud Infrastructure',
      tier: 'enterprise',
      positioning:
        'Enterprise cloud infrastructure and platform vendor spanning compute, storage, networking, Oracle Database services, AI infrastructure, observability and management, security controls, public regions, distributed cloud, dedicated cloud, hybrid cloud, and multicloud database deployment options.',
      strengths: [
        'Official OCI overview materials describe a broad infrastructure and platform service catalog across compute, storage, networking, databases, analytics, AI, developer services, integration, observability, and security',
        'Official region materials describe public cloud, dedicated cloud, hybrid cloud, and multicloud options for workloads with locality, sovereignty, resilience, or data-residency needs',
        'Universal Credits materials provide a public orientation for annual commitment drawdown and pay-as-you-go style purchasing mechanics, while OCI billing documentation points to budget and alert controls',
        'Oracle contract, DPA, Trust Center, SLA, and support documentation provide public starting points for legal, privacy, security, resilience, and operational due diligence',
      ],
      cautions: [
        'Public service pages do not establish buyer-specific net price, private discount, committed-use risk, overage rate card, unused-credit exposure, implementation effort, or migration economics',
        'Oracle Database, BYOL, support, ULA, marketplace, and multicloud assumptions must be separated from generic infrastructure spend before making a commercial recommendation',
        'Region, realm, dedicated, sovereign, and multicloud deployment choices can affect data residency, support path, operational model, network design, interoperability, and exit plan',
        'OCI can be evaluated as a strategic Oracle-workload destination, but workload fit, migration proof, license compliance, data controls, and operational acceptance should be proven rather than inferred from public positioning',
      ],
      sourceBasis: [
        ORACLECLOUD_SOURCE_BASIS.ociOverview,
        ORACLECLOUD_SOURCE_BASIS.cloudRegions,
        ORACLECLOUD_SOURCE_BASIS.universalCredits,
        ORACLECLOUD_SOURCE_BASIS.multicloudDatabase,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Oracle Universal Credits and PAYG orientation',
      model: 'hybrid',
      metric:
        'Annual Universal Credits commitment, eligible OCI service consumption, rate-card drawdown, overage billing, region and service eligibility, PAYG alternatives, budget alerts, support path, and order-document scope',
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.universalCredits, ORACLECLOUD_SOURCE_BASIS.billingCostManagement],
      confidence: 0.74,
      notes:
        'Use public Oracle Universal Credits and OCI billing documentation to identify purchasing mechanics and cost-control questions. Do not infer buyer-specific rate cards, discounts, unused-credit exposure, overage pricing, renewal terms, support concessions, migration credits, or workload TCO without buyer-approved quote, order, tenancy, and invoice evidence.',
    },
    {
      label: 'Oracle license and BYOL evidence gap',
      model: 'unknown',
      metric:
        'Oracle Database or PaaS BYOL entitlement, license-included alternative, annual support obligation, Universal Credits drawdown, ULA or non-ULA position, audit posture, and workload-specific license compliance evidence',
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.byolFaq, ORACLECLOUD_BUYER_DATA_GAP],
      confidence: 0.22,
      notes:
        'Public BYOL materials describe concepts and constraints, but sourcing recommendations require buyer legal, asset-management, support, and licensing evidence. Treat Oracle license savings or compliance benefits as unproven until entitlement and deployment facts are reconciled.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Cloud-credit commitment, metering, and overage controls',
      buyerPosition:
        'Attach an order and governance exhibit covering committed Universal Credits, PAYG or annual commitment path, eligible services, rate card, drawdown reporting, budget alerts, overage billing, unused-credit treatment, region constraints, ramp schedule, workload owners, and renewal baseline.',
      fallbackPosition:
        'If workload timing is uncertain, stage the commitment, preserve optional expansion pricing, require monthly burn reporting, and avoid counting unused-credit consumption as savings.',
      walkawayTriggers: [
        'Commercial case depends on forecast cloud burn that cannot be tied to named workloads, regions, migration dates, and usage meters',
        'Overage, unused-credit, renewal, or rate-card mechanics are unclear in the order document',
      ],
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.universalCredits, ORACLECLOUD_SOURCE_BASIS.billingCostManagement, ORACLECLOUD_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Oracle license, database, and BYOL control',
      buyerPosition:
        'Separate OCI infrastructure pricing from Oracle Database, Exadata, Autonomous Database, Oracle Database multicloud, BYOL, license-included, support, and ULA assumptions; require entitlement evidence, deployment architecture, support status, and compliance signoff before using license value in the sourcing case.',
      fallbackPosition:
        'Where license evidence is incomplete, treat BYOL or support-related savings as a risk-adjusted upside case rather than committed BAFO value.',
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.byolFaq, ORACLECLOUD_SOURCE_BASIS.multicloudDatabase, ORACLECLOUD_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Region, security, privacy, and audit evidence',
      buyerPosition:
        'Map selected OCI regions, realms, dedicated or sovereign deployment options, tenancy design, compartments, IAM, VCNs, encryption, logging, DPA, subprocessors, compliance evidence, and customer-responsibility controls to each workload before award.',
      fallbackPosition:
        'If compliance or residency evidence requires portal or NDA access, make evidence delivery and control mapping a pre-production gate with named owner and remedy.',
      sourceBasis: [
        ORACLECLOUD_SOURCE_BASIS.cloudRegions,
        ORACLECLOUD_SOURCE_BASIS.securityArchitecture,
        ORACLECLOUD_SOURCE_BASIS.dpa,
        ORACLECLOUD_SOURCE_BASIS.trustCenter,
      ],
    },
    {
      clauseArea: 'Operational resilience, SLA, support, and exit',
      buyerPosition:
        'Define workload-specific availability design, SLA remedy path, service-credit claim process, My Oracle Support ownership, CSI management, escalation path, backup, disaster recovery, data export, transition assistance, and rollback before migration.',
      fallbackPosition:
        'If standard service credits are the only formal remedy, require stronger escalation, incident communications, continuity runbooks, and exit assistance for critical workloads.',
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.serviceLevelAgreements, ORACLECLOUD_SOURCE_BASIS.myOracleSupport, ORACLECLOUD_BUYER_DATA_GAP],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Workload-backed Universal Credits sizing',
      whenToUse:
        'Use when Oracle proposes an annual Universal Credits commitment, migration ramp, database modernization program, AI infrastructure purchase, or broad OCI expansion.',
      buyerAsk:
        'Require workload-by-workload sizing with service meters, region, tenancy, migration date, steady-state burn, burst scenario, support owner, budget alert, overage treatment, and decommission dependency before accepting commitment value.',
      vendorGive:
        'Vendor may offer annual credits, ramp constructs, migration programs, license-related positioning, support resources, architecture help, or multicloud paths; each should be tied to written scope and buyer evidence.',
      tradeoffs: [
        'A larger annual commitment can simplify procurement and improve predictability, but it can also create unused-credit or overage exposure if migrations slip or workloads consume different services than forecast.',
        'Do not exchange term length or commitment size for headline value unless drawdown, overage, renewal, exit, and workload acceptance terms are clear.',
      ],
      evidenceBasis: [ORACLECLOUD_SOURCE_BASIS.universalCredits, ORACLECLOUD_SOURCE_BASIS.billingCostManagement, ORACLECLOUD_BUYER_DATA_GAP],
    },
    {
      lever: 'Oracle workload and license proof before platform expansion',
      whenToUse:
        'Use when the sourcing thesis depends on moving Oracle Database, middleware, ERP-adjacent analytics, Exadata, VMware, AI, or regulated workloads to OCI or Oracle Database services inside another hyperscaler.',
      buyerAsk:
        'Separate technical migration proof, license entitlement proof, support proof, performance proof, data-residency proof, and commercial proof before counting cloud consolidation or license optimization value.',
      tradeoffs: [
        'OCI may be strategically attractive for Oracle workloads, but the value case is fragile if licensing, architecture, operational readiness, or application dependency evidence is incomplete.',
      ],
      evidenceBasis: [ORACLECLOUD_SOURCE_BASIS.ociOverview, ORACLECLOUD_SOURCE_BASIS.byolFaq, ORACLECLOUD_SOURCE_BASIS.multicloudDatabase],
    },
    {
      lever: 'Residency and deployment-model narrowing',
      whenToUse:
        'Use when the buyer is considering public cloud regions, sovereign options, dedicated regions, hybrid deployment, Cloud@Customer, or multicloud database services for regulated or latency-sensitive workloads.',
      buyerAsk:
        'Require region and deployment-model decision records that cover legal entity, data classes, operator access, support path, network path, interconnects, failover, audit evidence, and exit obligations.',
      evidenceBasis: [ORACLECLOUD_SOURCE_BASIS.cloudRegions, ORACLECLOUD_SOURCE_BASIS.trustCenter, ORACLECLOUD_SOURCE_BASIS.dpa],
    },
  ],
  riskFactors: [
    {
      id: 'oraclecloud-commitment-burn-mismatch',
      label: 'Universal Credits commitment and burn mismatch',
      severity: 'high',
      detectionSignals: [
        'Annual commitment is sized from aspirational migration plans rather than named workloads, target regions, service meters, and deployment dates',
        'Sourcing case counts full credit utilization without a monthly burn forecast, overage scenario, budget alert plan, or unused-credit risk owner',
      ],
      mitigations: ['Build a workload burn model', 'Stage commitments against migration gates', 'Require monthly usage and budget reporting', 'Keep PAYG comparison visible'],
      contractualRemedies: ['Usage reporting exhibit', 'Ramp and renewal baseline schedule', 'Overage notice and approval process', 'Commitment flexibility language'],
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.universalCredits, ORACLECLOUD_SOURCE_BASIS.billingCostManagement],
    },
    {
      id: 'oraclecloud-license-and-byol-assumption-risk',
      label: 'Oracle license and BYOL assumption risk',
      severity: 'high',
      detectionSignals: [
        'Savings case assumes BYOL, support rewards, ULA optimization, or license-included substitution without entitlement review',
        'Technical design mixes database, PaaS, multicloud, and infrastructure services before legal, asset-management, and support owners sign off',
      ],
      mitigations: ['Reconcile entitlements before BAFO', 'Separate license-included and BYOL scenarios', 'Require legal and software-asset-management signoff'],
      contractualRemedies: ['License responsibility exhibit', 'Deployment acceptance gate', 'Audit cooperation language', 'Support and entitlement schedule'],
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.byolFaq, ORACLECLOUD_BUYER_DATA_GAP],
    },
    {
      id: 'oraclecloud-region-and-operating-model-blur',
      label: 'Region and operating-model blur',
      severity: 'high',
      detectionSignals: [
        'Proposal references distributed, sovereign, dedicated, hybrid, or multicloud deployment without a workload-specific region, realm, network, support, and data-flow map',
        'Compliance review treats Oracle trust materials as sufficient without mapping customer-owned tenancy, IAM, compartment, network, encryption, backup, and logging controls',
      ],
      mitigations: ['Create region and deployment-model decision records', 'Map customer responsibility controls', 'Run failover and support-path exercises'],
      contractualRemedies: ['Security and privacy exhibit', 'Operational runbook', 'Data export and transition assistance', 'Pre-production evidence gate'],
      sourceBasis: [ORACLECLOUD_SOURCE_BASIS.cloudRegions, ORACLECLOUD_SOURCE_BASIS.securityArchitecture, ORACLECLOUD_SOURCE_BASIS.trustCenter],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Treat OCI as a potential critical ICT third-party dependency when it hosts regulated applications, databases, risk engines, payment-adjacent systems, AI infrastructure, observability, or disaster-recovery services.',
      additionalRequirements: ['DORA classification where applicable', 'Exit and continuity plan', 'Subcontractor and audit evidence', 'Region and resilience decision record'],
      regulatoryRefs: ['DORA where applicable to EU financial entities'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm PHI boundaries across databases, logs, backups, support artifacts, AI services, analytics, and integrations before approving OCI service scope or region choice.',
      additionalRequirements: ['PHI data-flow review', 'HIPAA/legal review where applicable', 'Access logging and deletion evidence'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Verify public-sector procurement vehicle, authorization boundary, government or sovereign region fit, support model, subcontractor disclosures, data residency, and operator access requirements before award.',
      regulatoryRefs: ['FedRAMP or local public-sector authorization where applicable'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'manufacturing',
      modifier:
        'Separate plant, edge, ERP, database, analytics, supply-chain, OT-adjacent, and disaster-recovery workloads so latency, connectivity, support, and downtime consequences are visible before cloud-credit commitment.',
      affectedStages: ['Scope', 'RFP', 'BAFO'],
    },
  ],
  body: `## Summary
Oracle Cloud Infrastructure should be sourced as an enterprise infrastructure, database, licensing, regional-residency, and multicloud decision. Public Oracle materials describe OCI as a broad cloud infrastructure and platform portfolio for compute, storage, networking, databases, analytics, AI, developer services, integration, observability, and security. Oracle also describes public cloud regions, distributed cloud options, dedicated cloud, hybrid cloud, Cloud@Customer-style deployment, and multicloud database options that can place Oracle Database services close to or inside other hyperscaler environments. That breadth makes OCI more than a commodity virtual-machine or object-storage comparison. A disciplined sourcing file should connect each workload to the exact services, region, tenancy design, data path, contract documents, license posture, support path, service-level remedy, and exit plan that will govern production use.

## When to apply
Use this pattern when Oracle Cloud is an incumbent, challenger, expansion candidate, migration target, database modernization vehicle, AI infrastructure platform, disaster-recovery environment, or multicloud database strategy. It applies to OCI compute, storage, networking, Oracle Database services, Autonomous Database, Exadata-related cloud services, Oracle Database@Azure, Oracle Database@Google Cloud, Oracle Database@AWS, observability and management, security services, Universal Credits, BYOL, dedicated region, sovereign or government region, and hybrid deployment decisions. It is especially useful when the business case blends cloud consumption with Oracle license economics, because the sourcing team must separate infrastructure unit economics from license entitlements, support obligations, ULA assumptions, database architecture, implementation services, and renewal leverage.

## Evidence to collect
Start with the workload inventory. For each workload, collect application owner, business criticality, database dependency, current hosting model, target OCI service, target region or realm, tenancy and compartment design, identity model, VCN and connectivity plan, encryption and key-management approach, backup and recovery design, logging and monitoring scope, data classes, regulated-data flags, support owner, expected migration date, and decommission dependency. For database workloads, collect edition, options, packs, processor or named-user posture where applicable, current support status, BYOL or license-included assumption, ULA status if relevant, high-availability design, performance baseline, storage profile, data transfer pattern, and rollback requirements. For multicloud database services, map the customer-facing cloud console, Oracle-operated service boundary, network path, identity and support workflow, data residency, and operational responsibility split.

## Commercial posture
Oracle Universal Credits public materials are useful for understanding the purchasing model: customers can use credits across eligible OCI services and draw them down as services are consumed, while OCI billing documentation points buyers toward budgets and alerts. Those public materials do not prove the buyer's net rate card, private discount, renewal protection, unused-credit exposure, migration credit, overage terms, or workload TCO. The BAFO workbook should split annual commitment, PAYG comparison, service meters, region, workload ramp, steady-state burn, burst case, decommission savings, support, migration services, third-party marketplace charges, and renewal baseline. If a proposed commitment depends on migrations that are not yet proven, stage the commitment or require written flexibility rather than treating forecast consumption as guaranteed value.

## License and BYOL controls
OCI sourcing often becomes an Oracle license decision. Public Oracle BYOL materials describe that customers may use certain existing entitlements for eligible cloud services and must maintain appropriate support obligations, but the public pages do not establish a specific buyer's entitlement, compliance posture, or optimal migration path. Do not count BYOL value, support-related value, ULA optimization, or license-included substitution until software asset management, legal, architecture, and finance owners reconcile the buyer's actual contracts and deployment evidence. The order file should state whether each workload is BYOL, license included, cloud-only, multicloud database, or undecided, and should identify who owns license compliance after migration.

## Security, privacy, and resilience
Oracle Trust Center, DPA, cloud-region, security-architecture, contract, and SLA materials are starting evidence. They do not replace workload-specific control mapping. Before award, map selected services to personal data, regulated data, customer content, logs, backups, support artifacts, IAM policies, compartments, VCNs, encryption, key management, operator access, subprocessors, audit evidence, and retention obligations. OCI documentation describes service-level commitments measured over a calendar month and service-credit claim mechanics, so critical workloads still need stronger operational evidence: architecture proof, failover test, backup restore test, incident escalation path, My Oracle Support ownership, CSI management, service request process, continuity runbook, and exit assistance. If the workload supports regulated finance, healthcare, public sector, or operational technology, region and support-path evidence should be a contracting gate rather than a post-signature task.

## Evaluation scenarios
Run buyer-authored proof points before commitment. For a database migration, test performance, backup, restore, patching, failover, identity, monitoring, support ticket flow, data export, and rollback. For an infrastructure migration, deploy the representative compute, network, storage, logging, and security pattern in the target region, then reconcile actual meter data against the quote. For AI infrastructure, validate availability, quota, storage, network throughput assumptions, model or framework support, data controls, and operational ownership before treating capacity as business value. For multicloud database, test the full operating path from the buyer's primary cloud through Oracle service operations, support escalation, network connectivity, data movement, and disaster recovery.

## Pitfalls
The first failure mode is sizing Universal Credits from aspiration rather than named workloads and measured service meters. The second is blending license value with cloud value before entitlement evidence is reconciled. The third is treating public region, trust, DPA, and SLA materials as sufficient without mapping customer-owned tenancy, IAM, network, backup, logging, and support controls. The fourth is assuming Oracle workload affinity proves migration value before technical proof, performance acceptance, operations readiness, and exit mechanics are complete. OCI can be a strong strategic platform for Oracle-centric workloads, database modernization, distributed cloud, and multicloud database programs, but the sourcing conclusion should be evidence-led: public Oracle sources establish scope and mechanics, while buyer-specific quotes, orders, usage, licenses, architecture tests, support history, and legal review establish the actual recommendation.

## Instances
No tenant instances are attached to this seed. Use it as a public-source Oracle Cloud vendor profile and enrich it only with approved buyer evidence before making pricing, renewal, migration, license, support, or vendor-selection recommendations.`,
};

export const SOURCING_VENDOR_ORACLECLOUD_PATTERNS: PatternSeed[] = [PAT_SRC_VEN_ORACLECLOUD_001];
