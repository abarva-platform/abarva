import type { PatternSeed } from './seed-types';

const INDUSTRY_OVERLAY_STAGES = [
  {
    id: 'Scope',
    label: 'Industry scope and regulated data boundary',
    order: 1,
    description:
      'Define the industry-specific operating context, regulated data classes, critical workflows, geography, and accountable business owner before market contact.',
  },
  {
    id: 'MarketScan',
    label: 'Industry-capable market scan',
    order: 2,
    description:
      'Separate vendors that can satisfy the industry overlay from vendors that only satisfy generic category requirements.',
  },
  {
    id: 'RFP',
    label: 'Scenario evidence and control proof',
    order: 3,
    description:
      'Require buyer-authored industry scenarios, control evidence, implementation assumptions, and data-handling proof before scoring.',
  },
  {
    id: 'BAFO',
    label: 'Commercial normalization and risk transfer',
    order: 4,
    description:
      'Normalize pricing, implementation roles, audit support, data obligations, continuity commitments, and exit rights before final award.',
  },
  {
    id: 'Contracting',
    label: 'Contracting, mobilization, and assurance plan',
    order: 5,
    description:
      'Convert the selected offer into enforceable data, control, transition, assurance, incident, and governance obligations.',
  },
];

const OFFICIAL_SOURCE_BASIS = {
  hhsBusinessAssociateContracts: {
    type: 'regulatory-document',
    label: 'HHS Business Associate Contracts guidance',
    url: 'https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions',
    asOf: '2026-04-29',
  },
  hhsCloudComputing: {
    type: 'regulatory-document',
    label: 'HHS Guidance on HIPAA and Cloud Computing',
    url: 'https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html',
    asOf: '2026-04-29',
  },
  fedThirdPartyRisk: {
    type: 'regulatory-document',
    label: 'Federal Reserve final interagency third-party risk management guidance release',
    url: 'https://www.federalreserve.gov/newsevents/pressreleases/bcreg20230606a.htm',
    asOf: '2026-04-29',
  },
  ebaDora: {
    type: 'regulatory-document',
    label: 'EBA Digital Operational Resilience Act overview',
    url: 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act',
    asOf: '2026-04-29',
  },
  pciSaq401: {
    type: 'industry-consortium',
    label: 'PCI SSC SAQs for PCI DSS v4.0.1 bulletin',
    url: 'https://www.pcisecuritystandards.org/official_statements/pci-security-standards-council-bulletin-saqs-for-pci-dss-v4-0-1-now-available/',
    asOf: '2026-04-29',
  },
  ftcVendorSecurity: {
    type: 'regulatory-document',
    label: 'FTC Vendor Security guidance',
    url: 'https://www.ftc.gov/business-guidance/small-businesses/cybersecurity/vendor-security',
    asOf: '2026-04-29',
  },
  abarvaSourceSpec: {
    type: 'abarva-observed',
    label: 'AbarVa Source build spec',
    url: 'docs/build/SOURCE_BUILD_SPEC.md',
    asOf: '2026-04-29',
  },
  founderDataGap: {
    type: 'founder-data-gap',
    label: 'Buyer-specific industry benchmark evidence required',
    asOf: '2026-04-29',
    note: 'Populate with buyer invoices, finalist proposals, regulator-specific counsel guidance, implementation evidence, or approved benchmark data before publishing numeric claims.',
  },
} as const;

export const SOURCING_INDUSTRY_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-IND-HEALTH-001',
    slug: 'healthcare-sourcing-overlay',
    title: 'Healthcare Sourcing Overlay',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'healthcare',
    thesis:
      'Healthcare sourcing decisions become defensible when PHI boundaries, clinical workflow impact, integration accountability, business-associate obligations, continuity expectations, and audit evidence are evaluated as first-order buying criteria rather than late legal review items.',
    applicability:
      'Apply when sourcing technology, services, data platforms, contact center, revenue-cycle, analytics, cloud, AI, managed services, or implementation partners for covered entities, payers, providers, life-sciences adjacencies, or any event where PHI or care-delivery workflow may be implicated.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions',
      'https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html',
    ],
    regulatoryChips: ['HIPAA-if-PHI', 'BAA-if-business-associate', 'State-privacy-review-if-applicable'],
    relatedPatternIds: ['PAT-SRC-002', 'PAT-SRC-003', 'PAT-SRC-006', 'PAT-SRC-CAT-CRM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'industry_overlay',
    vendorClass: 'direct-tech',
    lifecycleStages: INDUSTRY_OVERLAY_STAGES,
    pricingBenchmarks: [
      {
        label: 'Healthcare overlay pricing evidence gap',
        model: 'unknown',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
        confidence: 0.4,
        notes:
          'Do not publish uplift, discount, implementation multiplier, or BAA-cost assumptions without buyer-specific quote, proposal, or approved benchmark evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'PHI and business-associate boundary',
        buyerPosition:
          'Define whether the supplier creates, receives, maintains, or transmits PHI; if so, require a business associate agreement, permitted-use limits, safeguards, breach/incident reporting, subcontractor flow-down, return/destruction, and audit cooperation aligned to counsel-approved language.',
        fallbackPosition:
          'If the supplier asserts no PHI access, contract the technical, operational, and support boundaries that make that assertion true and testable.',
        walkawayTriggers: ['Vendor refuses required BAA terms when PHI is in scope', 'Support or logging model can expose PHI without contractual controls'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.hhsBusinessAssociateContracts, OFFICIAL_SOURCE_BASIS.hhsCloudComputing],
      },
      {
        clauseArea: 'Clinical workflow and downtime accountability',
        buyerPosition:
          'Tie uptime, incident response, support escalation, maintenance windows, disaster recovery, and fallback procedures to the care, claims, access, or revenue workflow the vendor supports.',
        fallbackPosition:
          'If the supplier will not accept workflow-specific remedies, require explicit service boundaries and internal mitigation ownership before award.',
      },
      {
        clauseArea: 'Data portability and transition assistance',
        buyerPosition:
          'Require usable-format export, migration support, deletion certification, downstream interface assistance, and continuity support for patient, member, provider, claims, or revenue-cycle data in scope.',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.hhsBusinessAssociateContracts],
      },
    ],
    negotiationLevers: [
      {
        lever: 'BAA and data-flow proof before finalist scoring',
        whenToUse:
          'Use during RFP and BAFO when a supplier handles PHI-adjacent workflows but has not proven the support, logging, subcontractor, analytics, and cloud data paths.',
        buyerAsk:
          'Provide a data-flow diagram, BAA position, PHI minimization design, subcontractor list, breach process, and support-access control evidence before the commercial score is final.',
        vendorGive: 'Supplier can narrow the in-scope modules, support activities, or deployment model to reduce PHI exposure.',
        tradeoffs: ['Over-narrowing PHI scope can reduce legal burden but may break clinical or operational usefulness.'],
        evidenceBasis: [OFFICIAL_SOURCE_BASIS.hhsBusinessAssociateContracts, OFFICIAL_SOURCE_BASIS.hhsCloudComputing],
      },
      {
        lever: 'Clinical or operational scenario demonstration',
        whenToUse:
          'Use when the vendor demonstration is generic and does not prove the buyer workflow, handoff, exception path, or downtime behavior.',
        buyerAsk:
          'Run buyer-authored scripts for referral, scheduling, claims, prior authorization, call-center, revenue-cycle, care-gap, or analytics scenarios with real interface assumptions documented.',
      },
      {
        lever: 'Implementation accountability split',
        whenToUse:
          'Use when a platform vendor, systems integrator, and buyer operations team all share delivery responsibility.',
        buyerAsk:
          'Attach a responsibility matrix covering interfaces, data conversion, test evidence, clinical/operations signoff, training, downtime plan, and post-go-live stabilization.',
      },
    ],
    riskFactors: [
      {
        id: 'healthcare-phi-boundary-ambiguity',
        label: 'PHI boundary ambiguity',
        severity: 'critical',
        detectionSignals: [
          'Vendor says no PHI is in scope while support, logs, analytics, implementation, or integrations can expose patient/member data.',
          'BAA discussion is deferred until after finalist selection.',
          'Subprocessors or cloud components are not mapped to the actual data path.',
        ],
        mitigations: ['Map data flows before scoring', 'Require counsel-approved BAA position', 'Document support-access and logging controls'],
        contractualRemedies: ['BAA', 'Subcontractor flow-down', 'Breach notification process', 'Return or destruction obligations'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.hhsBusinessAssociateContracts, OFFICIAL_SOURCE_BASIS.hhsCloudComputing],
      },
      {
        id: 'healthcare-workflow-disruption-risk',
        label: 'Clinical or revenue workflow disruption',
        severity: 'high',
        detectionSignals: [
          'Vendor proves software features but not handoffs, exception queues, downtime, or interface dependencies.',
          'Operations leaders cannot name the fallback process for a vendor outage.',
        ],
        mitigations: ['Require scenario demos', 'Tie SLA to workflow impact', 'Include mobilization and fallback artifacts'],
      },
      {
        id: 'healthcare-implementation-evidence-gap',
        label: 'Healthcare implementation evidence gap',
        severity: 'medium',
        detectionSignals: [
          'Implementation assumptions omit EHR, payer, claims, identity, revenue-cycle, or contact-center integrations.',
          'Vendor references generic healthcare experience without buyer-comparable evidence.',
        ],
        mitigations: ['Require comparable reference architecture', 'Gate award on interface test plan and acceptance criteria'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier:
          'Treat regulated data boundary, BAA position, clinical/revenue workflow continuity, implementation accountability, and patient/member impact as gating criteria rather than legal afterthoughts.',
        additionalRequirements: [
          'PHI data-flow map',
          'BAA applicability review',
          'Subprocessor and support-access evidence',
          'Workflow-specific downtime and escalation plan',
          'Interface and acceptance-test responsibility matrix',
        ],
        regulatoryRefs: ['HIPAA-if-PHI', 'HHS business associate guidance', 'HHS cloud computing guidance'],
        affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'cross_industry',
        modifier:
          'Use this as a reusable overlay model for any category where protected data, workflow continuity, and third-party accountability must be proven before award.',
        additionalRequirements: ['Regulated-data classification', 'Control evidence', 'Incident and transition obligations'],
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
    ],
    body: `## Summary
Healthcare sourcing is not a generic software or services event with healthcare vocabulary added at the end. The buyer must decide whether the supplier touches protected data, whether the workflow is clinical, financial, operational, or patient/member-facing, and whether failure would affect care access, revenue integrity, payer operations, or trust. The overlay therefore forces regulated data boundary, workflow continuity, integration accountability, and contract assurance into the first sourcing pass.

The public regulatory anchor is intentionally narrow. HHS guidance confirms that business associate contracts are required where a covered entity uses a business associate for functions involving protected health information, and HHS cloud guidance describes BAA expectations for cloud service providers that create, receive, maintain, or transmit ePHI on behalf of covered entities or business associates. AbarVa should not turn those facts into legal advice; the pattern should make the question visible, route it to counsel, and prevent teams from scoring a vendor as low risk before the data path is understood.

## When to apply
Use this overlay on top of a category or process pattern when the event involves providers, payers, revenue-cycle operations, clinical operations, population health, contact centers, care management, claims, analytics, AI, cloud hosting, implementation, managed services, or any buyer workflow where patient, member, provider, claims, or care-delivery data could be handled. It applies to new selections, renewals, incumbent expansions, replacement events, and consolidation events.

Do not use it to claim that every healthcare supplier is a business associate. The pattern exists because the answer depends on the buyer relationship, data path, service activity, support model, subcontractors, and deployment architecture. If the supplier truly does not touch PHI, the sourcing team should still document the boundary that keeps it out of scope.

## Overlay doctrine
The scope stage must name the regulated data classes, workflow owners, systems of record, integrations, support paths, hosting model, and legal review owner. The market-scan stage should separate suppliers with healthcare-ready control evidence from suppliers that only have generic security collateral. The RFP stage should require buyer-authored scenarios: user provisioning, support access, interface failure, downtime, data export, breach notification walkthrough, workflow exception, and implementation acceptance. The BAFO stage should normalize support tiers, implementation roles, interfaces, environments, data migration, training, acceptance criteria, incident obligations, and transition rights. The contracting stage should close BAA applicability, permitted-use boundaries, subcontractor flow-down, breach process, return or destruction, audit support, downtime plan, and exit assistance.

## Evaluation rubric
Weight workflow fit and implementation accountability around 25 percent, regulated data and security controls around 20 percent, integration and interoperability evidence around 15 percent, continuity and support model around 15 percent, commercial and renewal protections around 10 percent, vendor healthcare operating evidence around 10 percent, and exit/data-portability risk around 5 percent. Adjust the weights only after the buyer names which workflow would be harmed by a vendor failure.

## Contract and evidence notes
The strongest healthcare sourcing packet contains a data-flow map, a BAA position, a support-access model, a subprocessor list, interface assumptions, acceptance criteria, downtime procedures, escalation contacts, and export/deletion terms. Numeric premium claims, implementation multipliers, or vendor-performance benchmarks should stay blank until AbarVa has buyer invoices, finalist proposals, operational evidence, or approved benchmark data.

## Contradictions and failure modes
Vendor claim: no PHI is in scope. Detection: inspect logs, support access, analytics, training data, implementation extracts, integrations, backups, and subcontractor paths. Vendor claim: healthcare ready. Detection: require evidence for the buyer workflow, not logos or generic references. Vendor claim: integration is standard. Detection: map EHR, payer, identity, claims, revenue-cycle, contact-center, or analytics dependencies and assign implementation accountability.

The common failure is letting legal review happen after commercial preference is already formed. The second failure is treating HIPAA as a checkbox while ignoring the workflow consequences of downtime, poor interface design, weak support escalation, or unclear transition rights. The third failure is confusing healthcare sales experience with healthcare operating proof. This overlay keeps those risks visible before the sourcing event advances.` ,
  },
  {
    id: 'PAT-SRC-IND-FINSERV-001',
    slug: 'financial-services-sourcing-overlay',
    title: 'Financial Services Sourcing Overlay',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'financial_services',
    thesis:
      'Financial-services sourcing decisions become decision-grade when third-party risk, resilience, auditability, data controls, model governance, concentration exposure, and exit feasibility are designed into the event lifecycle before commercial preference is formed.',
    applicability:
      'Apply when sourcing technology, data, AI, cloud, BPO, payments, fraud, KYC, servicing, risk, compliance, analytics, core operations, or managed-services vendors for regulated or regulation-adjacent financial-services organizations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'https://www.federalreserve.gov/newsevents/pressreleases/bcreg20230606a.htm',
      'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act',
    ],
    regulatoryChips: ['Third-party-risk-management-if-regulated', 'DORA-if-EU-financial-entity', 'Model-risk-review-if-AI-or-scoring'],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-006', 'PAT-SRC-008', 'PAT-IND-FIN-001', 'PAT-IND-FIN-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'industry_overlay',
    vendorClass: 'service',
    lifecycleStages: INDUSTRY_OVERLAY_STAGES,
    pricingBenchmarks: [
      {
        label: 'Financial-services overlay pricing evidence gap',
        model: 'unknown',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
        confidence: 0.38,
        notes:
          'Control, resilience, audit, model-risk, exit, and regulatory-support costs vary by buyer risk tier and should not be estimated without proposal or benchmark evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Third-party risk lifecycle evidence',
        buyerPosition:
          'Require evidence that supports planning, due diligence, contract negotiation, ongoing monitoring, and termination or exit management for the specific outsourced or third-party relationship.',
        fallbackPosition:
          'If the vendor cannot provide full evidence before BAFO, document compensating controls and exclude the relationship from critical functions until the gap is closed.',
        walkawayTriggers: ['Critical relationship with no audit rights', 'No credible exit or termination support', 'No ongoing monitoring evidence for material controls'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.fedThirdPartyRisk],
      },
      {
        clauseArea: 'Operational resilience and ICT third-party risk',
        buyerPosition:
          'For EU financial entities or DORA-relevant ICT services, require resilience, incident, testing, subcontractor, concentration, continuity, and oversight evidence mapped to the buyer function.',
        fallbackPosition:
          'If DORA is not applicable, preserve the same evidence structure as good risk discipline where the function is critical or important.',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.ebaDora],
      },
      {
        clauseArea: 'Audit, regulator access, and exit assistance',
        buyerPosition:
          'Secure audit cooperation, regulator-facing evidence support, subcontractor transparency, data return, transition assistance, termination support, and knowledge transfer sized to the criticality of the function.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Criticality tiering before commercial scoring',
        whenToUse:
          'Use when the buyer is sourcing a vendor that may support a critical operation, customer-facing channel, regulated workflow, or material data/control process.',
        buyerAsk:
          'Classify relationship criticality, map accountable owners, require due-diligence evidence, and define ongoing monitoring before commercial scores are locked.',
        vendorGive: 'Vendor can offer enhanced audit packages, resilience artifacts, dedicated support, escrow, or exit services as priced options.',
        tradeoffs: ['Enhanced assurance may increase cost, but it prevents false savings from under-scoped risk obligations.'],
        evidenceBasis: [OFFICIAL_SOURCE_BASIS.fedThirdPartyRisk, OFFICIAL_SOURCE_BASIS.ebaDora],
      },
      {
        lever: 'Model and decisioning governance holdback',
        whenToUse:
          'Use for fraud, KYC, credit, collections, pricing, advice, AML, servicing, or AI-enabled workflows where automated or assisted decisions affect customers or risk controls.',
        buyerAsk:
          'Hold award recommendation until the vendor provides model inventory, explainability, monitoring, drift, override, data lineage, validation, and human-review evidence appropriate to buyer policy.',
        evidenceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
      },
      {
        lever: 'Exit and concentration leverage',
        whenToUse:
          'Use when the vendor would become difficult to replace because of data, integrations, workflow ownership, proprietary models, cloud dependence, or market concentration.',
        buyerAsk:
          'Trade volume, term, or preferred-vendor status only for export, transition, step-in, knowledge-transfer, pricing-cap, and termination rights.',
      },
    ],
    riskFactors: [
      {
        id: 'finserv-critical-third-party-underclassification',
        label: 'Critical third-party underclassification',
        severity: 'critical',
        detectionSignals: [
          'The event is scored as ordinary SaaS or services while the vendor supports payments, onboarding, fraud, KYC, servicing, core operations, or regulated reporting.',
          'Business owner, risk owner, compliance owner, and exit owner are not all named.',
          'Ongoing monitoring is described as a future operating task rather than a sourcing gate.',
        ],
        mitigations: ['Classify criticality at scope', 'Gate RFP on due-diligence artifacts', 'Include monitoring and exit artifacts before award'],
        contractualRemedies: ['Audit rights', 'Regulatory cooperation', 'Exit assistance', 'Subcontractor disclosure', 'Incident reporting'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.fedThirdPartyRisk],
      },
      {
        id: 'finserv-resilience-evidence-gap',
        label: 'Operational resilience evidence gap',
        severity: 'high',
        detectionSignals: [
          'Vendor provides uptime claims without recovery, incident, test, dependency, or subcontractor evidence.',
          'Critical workflow cannot name fallback, recovery point, recovery time, and customer-impact handling assumptions.',
        ],
        mitigations: ['Require resilience evidence packet', 'Run continuity scenario', 'Attach incident and recovery obligations to contract'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.ebaDora, OFFICIAL_SOURCE_BASIS.fedThirdPartyRisk],
      },
      {
        id: 'finserv-model-governance-blind-spot',
        label: 'Model governance blind spot',
        severity: 'high',
        detectionSignals: [
          'AI, scoring, fraud, KYC, or risk decisioning capabilities are evaluated on accuracy claims without buyer model-risk evidence.',
          'Vendor cannot provide monitoring, override, drift, explainability, or data lineage artifacts appropriate to the use case.',
        ],
        mitigations: ['Route to model-risk review', 'Require decisioning evidence before BAFO', 'Define human review and monitoring obligations'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Treat third-party lifecycle controls, resilience, auditability, model governance, concentration, subcontractor transparency, and exit feasibility as core sourcing evidence.',
        additionalRequirements: [
          'Relationship criticality classification',
          'Due-diligence and ongoing-monitoring artifact list',
          'Resilience and incident evidence packet',
          'Audit/regulator cooperation terms',
          'Exit and concentration-risk plan',
        ],
        regulatoryRefs: ['Interagency third-party risk management guidance where applicable', 'DORA where applicable to EU financial entities'],
        affectedStages: ['Scope', 'MarketScan', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'insurance',
        modifier:
          'Apply the same third-party and decisioning discipline to claims, underwriting, servicing, analytics, and customer-facing vendor dependencies, with insurance-specific legal review.',
        additionalRequirements: ['Claims/underwriting decisioning evidence', 'Data lineage and retention review', 'Exit plan for customer-facing operations'],
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
    ],
    body: `## Summary
Financial-services sourcing is a third-party-risk and resilience decision before it is a vendor-selection decision. A low headline price can be unacceptable if the relationship cannot satisfy due diligence, audit, ongoing monitoring, incident response, continuity, subcontractor transparency, model governance, and exit expectations. The overlay exists to keep those obligations in the sourcing event instead of transferring them to risk, compliance, operations, or legal teams after the preferred supplier is already chosen.

The public anchors are limited and sourced. The Federal Reserve, FDIC, and OCC final interagency guidance describes third-party risk management across planning, due diligence and third-party selection, contract negotiation, ongoing monitoring, and termination. The EBA describes DORA as establishing an EU oversight framework for critical ICT third-party providers and digital operational resilience requirements for financial-sector entities. AbarVa should not infer buyer-specific regulatory scope from those public facts; the event should classify applicability and route the interpretation to the buyer's risk and legal owners.

## When to apply
Use this overlay for banks, payments companies, fintechs, broker-dealers, insurers, wealth platforms, credit unions, lenders, processors, and regulated or regulation-adjacent financial-services operations. It is especially important for cloud, core platforms, fraud, KYC, AML, identity, payments, servicing, collections, credit, risk analytics, contact centers, BPO, data providers, AI decisioning, managed services, and any supplier that could disrupt a critical operation or customer obligation.

Do not use it to make a blanket claim that every vendor is critical or that every jurisdiction applies the same rulebook. The overlay should force a deterministic risk classification: what function is supported, what data is touched, what decision is influenced, what outage would harm customers or controls, what regulator-facing evidence may be needed, and how the firm exits if the supplier fails.

## Overlay doctrine
The scope stage must classify relationship criticality, named owners, data classes, customer impact, regulated workflow impact, model/decisioning use, geography, and exit feasibility. The market-scan stage should separate vendors with financial-services risk evidence from vendors with generic enterprise collateral. The RFP stage should require control evidence, resilience evidence, subcontractor and fourth-party visibility, model governance where applicable, and buyer-authored operational scenarios. The BAFO stage should normalize audit rights, regulator cooperation, support tier, incident obligations, resilience testing, implementation responsibilities, termination support, data export, and transition economics. The contracting stage should close ongoing monitoring, issue remediation, service credits, termination triggers, exit assistance, data return, and knowledge-transfer commitments.

## Evaluation rubric
Weight risk and control evidence around 25 percent, operational resilience and incident readiness around 20 percent, functional and workflow fit around 15 percent, data/model governance around 15 percent, commercial protections around 10 percent, implementation and monitoring readiness around 10 percent, and exit/concentration risk around 5 percent. For high-criticality relationships, raise resilience, audit, and exit weights before evaluating price.

## Contract and evidence notes
A complete financial-services sourcing packet should contain relationship criticality, due-diligence artifacts, control attestations, audit rights, subcontractor map, resilience plan, incident workflow, business continuity assumptions, model/decisioning evidence where relevant, ongoing-monitoring plan, remediation process, data return, and exit support. Numeric benchmark claims for assurance costs, resilience premiums, implementation multipliers, or regulatory-support uplift should stay blank until AbarVa has buyer invoices, finalist proposals, regulator-specific requirements, or approved benchmark evidence.

## Contradictions and failure modes
Vendor claim: enterprise grade controls are enough. Detection: require evidence mapped to the buyer function, criticality, regulator-facing needs, and monitoring plan. Vendor claim: uptime proves resilience. Detection: inspect incident, dependency, recovery, fallback, testing, and customer-impact handling evidence. Vendor claim: AI improves fraud, onboarding, or credit outcomes. Detection: require model inventory, data lineage, monitoring, override, drift, explainability, validation, and human-review evidence consistent with buyer policy.

The first failure is underclassifying a critical relationship so the sourcing event moves faster than the risk evidence. The second failure is negotiating price before operational resilience and exit rights are concrete. The third failure is treating model governance as documentation after award. This overlay makes risk ownership, evidence, and commercial leverage visible while the buyer still has finalist pressure.` ,
  },
  {
    id: 'PAT-SRC-IND-RETAIL-001',
    slug: 'retail-cpg-sourcing-overlay',
    title: 'Retail and CPG Sourcing Overlay',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'retail_cpg',
    thesis:
      'Retail and CPG sourcing decisions are stronger when store, digital, supply-chain, payments, merchandising, supplier, seasonal, and customer-data realities are tested directly instead of assuming a generic enterprise category pattern will survive retail operating variance.',
    applicability:
      'Apply when sourcing retail or CPG technology, services, analytics, data, payments, commerce, loyalty, forecasting, inventory, store operations, marketing, contact center, fulfillment, or supplier collaboration capabilities.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'https://www.pcisecuritystandards.org/official_statements/pci-security-standards-council-bulletin-saqs-for-pci-dss-v4-0-1-now-available/',
      'https://www.ftc.gov/business-guidance/small-businesses/cybersecurity/vendor-security',
      'https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business',
    ],
    regulatoryChips: ['PCI-DSS-if-cardholder-data', 'Consumer-privacy-review-if-personal-data', 'FTC-vendor-security-guidance'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-005', 'PAT-IND-RET-001', 'PAT-IND-RET-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'industry_overlay',
    vendorClass: 'direct-tech',
    lifecycleStages: INDUSTRY_OVERLAY_STAGES,
    pricingBenchmarks: [
      {
        label: 'Retail and CPG overlay pricing evidence gap',
        model: 'unknown',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.founderDataGap],
        confidence: 0.36,
        notes:
          'Store count, POS lanes, SKU volume, order volume, loyalty records, seasonality, deployment labor, integrations, and supplier-network assumptions require buyer or proposal evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Store, digital, and peak-season continuity',
        buyerPosition:
          'Tie uptime, support, incident response, change freeze, recovery, and escalation obligations to store hours, digital trading windows, promotions, seasonal peaks, and fulfillment cutoffs.',
        fallbackPosition:
          'If the supplier cannot accept peak-period commitments, document excluded periods, buyer fallback operations, and remediation before award.',
        walkawayTriggers: ['No peak-season support model for critical retail workflow', 'No incident escalation path during trading windows'],
      },
      {
        clauseArea: 'Payment and customer-data handling',
        buyerPosition:
          'For cardholder or customer personal data in scope, require data-flow evidence, tokenization/encryption posture, access controls, vendor security obligations, incident notification, and compliance-validation responsibilities.',
        sourceBasis: [OFFICIAL_SOURCE_BASIS.pciSaq401, OFFICIAL_SOURCE_BASIS.ftcVendorSecurity],
      },
      {
        clauseArea: 'Store rollout, supplier, and operational acceptance',
        buyerPosition:
          'Define pilot criteria, store rollout waves, field training, device/peripheral responsibilities, supplier-data assumptions, operational acceptance, rollback rights, and post-go-live stabilization.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Peak-period blackout and support leverage',
        whenToUse:
          'Use when the vendor supports POS, commerce, loyalty, inventory, fulfillment, forecasting, contact center, pricing, promotions, or replenishment during seasonal or promotional peaks.',
        buyerAsk:
          'Commit to change freezes, priority support, incident bridges, named escalation, recovery targets, and service credits tied to retail operating windows.',
        vendorGive: 'Vendor may offer premium support or controlled-release terms in exchange for volume, term, or deployment sequencing commitments.',
        tradeoffs: ['Premium support can be valuable, but only if named operating windows and escalation rights are enforceable.'],
      },
      {
        lever: 'Store pilot before chainwide economics',
        whenToUse:
          'Use when a vendor proposes chainwide rollout economics before proving store-level workflow, device, labor, training, connectivity, and exception handling.',
        buyerAsk:
          'Condition rollout, payment milestones, and reference pricing on a pilot that proves representative store formats and operating exceptions.',
      },
      {
        lever: 'Data and payments boundary normalization',
        whenToUse:
          'Use when a vendor handles consumer, loyalty, payment, order, return, or supplier data but describes security only at a generic platform level.',
        buyerAsk:
          'Provide data-flow, access-control, retention, deletion, incident, PCI-validation, and service-provider security evidence before BAFO scoring.',
        evidenceBasis: [OFFICIAL_SOURCE_BASIS.pciSaq401, OFFICIAL_SOURCE_BASIS.ftcVendorSecurity],
      },
    ],
    riskFactors: [
      {
        id: 'retail-peak-trading-fragility',
        label: 'Peak trading fragility',
        severity: 'high',
        detectionSignals: [
          'Vendor cannot describe support coverage for holiday, promotion, launch, or peak fulfillment windows.',
          'Release, maintenance, or incident processes ignore store hours and trading calendars.',
        ],
        mitigations: ['Add retail calendar scenario', 'Contract change-freeze and escalation windows', 'Run peak-volume proof before rollout'],
      },
      {
        id: 'retail-store-rollout-assumption-risk',
        label: 'Store rollout assumption risk',
        severity: 'medium',
        detectionSignals: [
          'Implementation plan treats stores as identical despite different formats, devices, connectivity, labor models, or local procedures.',
          'Vendor excludes field training, device integration, peripheral support, or rollback from commercial assumptions.',
        ],
        mitigations: ['Require representative pilot', 'Normalize rollout labor and device assumptions', 'Define acceptance and rollback gates'],
      },
      {
        id: 'retail-customer-payment-data-exposure',
        label: 'Customer and payment data exposure',
        severity: 'high',
        detectionSignals: [
          'Vendor handles loyalty, order, return, payment, or customer data without a clear data-flow and access model.',
          'PCI or customer-data responsibilities are assumed but not assigned to buyer, vendor, processor, or implementation partner.',
        ],
        mitigations: ['Map payment/customer-data flows', 'Assign compliance-validation responsibility', 'Require vendor security contract provisions and incident notice'],
        contractualRemedies: ['Security obligations', 'Incident notification', 'Audit/support evidence', 'Data retention and deletion terms'],
        sourceBasis: [OFFICIAL_SOURCE_BASIS.pciSaq401, OFFICIAL_SOURCE_BASIS.ftcVendorSecurity],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier:
          'Test store, digital, supply-chain, supplier, consumer-data, payments, promotion, and seasonal operating variance before commercial scoring is final.',
        additionalRequirements: [
          'Retail calendar and peak-window support plan',
          'Store-format pilot and rollout assumptions',
          'Customer/payment data-flow map',
          'SKU, order, loyalty, supplier, and fulfillment volume assumptions',
          'Operational acceptance and rollback criteria',
        ],
        regulatoryRefs: ['PCI DSS where cardholder data is in scope', 'FTC vendor security guidance for sensitive business or customer information'],
        affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'cross_industry',
        modifier:
          'Apply the retail operating-calendar discipline to any sector where vendor failure during peaks creates disproportionate customer, revenue, or operational impact.',
        additionalRequirements: ['Peak-window definition', 'Change-freeze plan', 'Named incident escalation'],
        affectedStages: ['Scope', 'BAFO', 'Contracting'],
      },
    ],
    body: `## Summary
Retail and CPG sourcing fails when teams evaluate a vendor as though every location, channel, SKU, order, customer record, supplier, promotion, and trading window behaves like a generic enterprise workflow. The overlay forces sourcing teams to test store realities, digital trading, payments, consumer data, supply-chain dependencies, supplier collaboration, seasonality, rollout labor, and operational acceptance before the award recommendation is formed.

The public facts used here are intentionally limited. The PCI Security Standards Council has published PCI DSS v4.0.1 SAQ materials for merchants and service providers, and FTC vendor-security guidance tells businesses to put security expectations in writing and verify vendor compliance where vendors access sensitive information. Those sources do not prove which PCI SAQ or privacy obligation applies to a buyer; they justify making payment and customer-data responsibility explicit in the event.

## When to apply
Use this overlay for retailers, grocers, restaurants, brands, distributors, marketplaces, consumer products companies, franchise operations, and store-plus-digital businesses. It fits POS, commerce, order management, loyalty, CDP, forecasting, inventory, replenishment, pricing, promotions, workforce, contact center, payments, warehouse, transportation, supplier collaboration, merchandising analytics, store devices, field services, and managed-services events.

Do not use it to publish retail benchmark claims without buyer evidence. Store count, lane count, traffic, SKU volume, loyalty scale, order volume, item attributes, supplier count, promotion cadence, seasonality, and rollout labor can move economics more than software list price. The sourcing event should collect those assumptions and prevent vendors from pricing an average enterprise deployment when the buyer needs a retail operating deployment.

## Overlay doctrine
The scope stage must name channels, store formats, geographies, trading calendar, peak periods, order and SKU volumes, payment/customer data paths, supplier dependencies, devices, integration footprint, and operational acceptance owners. The market-scan stage should separate vendors with proven retail operating evidence from generic platform vendors. The RFP stage should require scripts for store outage, promotional spike, return/refund exception, inventory mismatch, loyalty lookup, supplier feed failure, fulfillment cutoff, and field support escalation. The BAFO stage should normalize rollout labor, devices and peripherals, premium support, peak-period change freezes, incident bridges, data obligations, payment responsibilities, and post-go-live stabilization. The contracting stage should close acceptance, rollback, incident, data, security, rollout, service credit, and transition language.

## Evaluation rubric
Weight retail operating fit around 25 percent, integration and data-flow evidence around 20 percent, peak-season and continuity model around 15 percent, commercial normalization around 15 percent, security/payment/customer-data controls around 10 percent, rollout and training feasibility around 10 percent, and exit or transition risk around 5 percent. Grocery and fresh environments should raise inventory, shrink, and perishable workflow weighting. Fashion, specialty, and CPG environments may raise assortment, supplier, and promotion weighting. Digital-heavy retailers should raise traffic, order, identity, loyalty, and fulfillment weighting.

## Contract and evidence notes
A complete packet includes retail calendar assumptions, store-format matrix, device/peripheral scope, rollout wave plan, field training model, SKU/order/loyalty volumes, data-flow map, PCI or payment responsibility matrix if applicable, customer-data safeguards, supplier-data assumptions, peak support plan, incident bridge process, acceptance criteria, rollback rights, and stabilization period. Numeric claims about retail discounts, implementation multipliers, support premiums, or volume economics should remain blank until buyer invoices, finalist proposals, or approved benchmark data exist.

## Contradictions and failure modes
Vendor claim: chainwide rollout is straightforward. Detection: require representative pilots across store formats, devices, labor models, connectivity, and exception paths. Vendor claim: platform scales for retail peaks. Detection: run peak traffic, promotion, inventory, fulfillment, and incident scenarios against the buyer calendar. Vendor claim: security is enterprise grade. Detection: map loyalty, order, payment, return, supplier, and customer data responsibilities and require contract evidence.

The first failure is awarding a store-impacting vendor based on headquarters demos. The second failure is negotiating subscription price while leaving rollout labor, devices, premium support, data obligations, and peak-window coverage unpriced. The third failure is discovering after award that supplier feeds, item attributes, loyalty identity, payments, or store exception handling were assumed rather than proven. This overlay keeps retail operating variance in the scoring model while finalist leverage still exists.` ,
  },
];
