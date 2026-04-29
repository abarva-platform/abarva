import type { PatternSeed, SourceBasisRef } from './seed-types';

const SOURCE_AS_OF = '2026-04-29';

const SAP_SOURCE_BASIS = {
  cloudErpPublic: {
    type: 'public-disclosure',
    label: 'SAP Cloud ERP public edition product overview',
    url: 'https://www.sap.com/products/erp/s4hana.cloud-edition.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes Cloud ERP, formerly SAP S/4HANA Cloud Public Edition, as an out-of-the-box cloud ERP with preconfigured processes, public and private deployment options, and integration through SAP BTP and Integration Suite.',
  },
  cloudErpPrivate: {
    type: 'public-disclosure',
    label: 'SAP Cloud ERP Private product overview',
    url: 'https://www.sap.com/products/erp/s4hana-private-edition.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP positions Cloud ERP Private as a tailored-to-fit cloud ERP for protecting existing ERP investment, moving at the customer pace, choosing infrastructure preferences, and adopting RISE with SAP.',
  },
  cloudErpPrivatePackage: {
    type: 'public-disclosure',
    label: 'SAP Cloud ERP Private package how to buy',
    url: 'https://www.sap.com/products/erp/s4hana-private-edition/pricing.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP directs buyers to request a quote for the Cloud ERP Private package and describes business applications, transformation tools, optimization, extensibility, clean core, and SAP Build elements.',
  },
  btp: {
    type: 'public-disclosure',
    label: 'SAP Business Technology Platform product overview',
    url: 'https://www.sap.com/products/technology-platform.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes BTP as a platform for AI, data, integration, application development, automation, extension, and business process connectivity across SAP and non-SAP applications.',
  },
  businessAi: {
    type: 'public-disclosure',
    label: 'SAP Business AI product overview',
    url: 'https://www.sap.com/products/artificial-intelligence.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes Joule assistants and agents using role, data, application, and workflow context across SAP business processes.',
  },
  aribaSourcing: {
    type: 'public-disclosure',
    label: 'SAP Ariba Sourcing product overview',
    url: 'https://www.sap.com/products/spend-management/ariba-sourcing.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes Ariba Sourcing as sourcing software with AI, automation, supplier discovery, integration, event workflows, smart scoring, and award optimization.',
  },
  hcm: {
    type: 'public-disclosure',
    label: 'SAP SuccessFactors HCM product overview',
    url: 'https://www.sap.com/products/hcm.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes SuccessFactors HCM as AI-powered cloud HCM with people data, insights, embedded AI, and workforce processes.',
  },
  trustCenter: {
    type: 'public-disclosure',
    label: 'SAP Trust Center overview',
    url: 'https://www.sap.com/about/trust-center.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP Trust Center provides public pathways for security, compliance, certifications, data privacy, cloud status, data centers, agreements, AI commitments, and customer resources.',
  },
  dataCenters: {
    type: 'public-disclosure',
    label: 'SAP Trust Center data center locations',
    url: 'https://www.sap.com/about/trust-center/data-center.html',
    asOf: SOURCE_AS_OF,
    note: 'SAP describes data center locations, customer access to availability through SAP for Me, regional selection for some services, backup and disaster recovery context, and compliance considerations.',
  },
  dpa: {
    type: 'public-disclosure',
    label: 'SAP Data Processing Agreement for Cloud Services, SAP Support and SAP Services',
    url: 'https://assets.cdn.sap.com/agreements/data-processing-agreements/sps/data-processing-agreement-for-cloud-services-sap-support-and-sap-services-english-v1-2024.pdf',
    asOf: SOURCE_AS_OF,
    note: 'SAP DPA defines personal data, subprocessors, My Trust Center, technical and organizational measures, and data-processing commitments for SAP services.',
  },
  privateEditionSdg: {
    type: 'public-disclosure',
    label: 'SAP Cloud ERP Private and RISE with SAP S/4HANA Cloud private edition service description guide',
    url: 'https://assets.cdn.sap.com/agreements/product-use-and-support-terms/service-description-guides/sap-cloud-erp-private-and-rise-with-sap-s4hana-cloud-private-edition-service-description-guide-english-v4-2025.pdf',
    asOf: SOURCE_AS_OF,
    note: 'SAP service description guide documents service scope, usage metrics, eligible cloud services, disaster recovery, GxP, 99.9% SLA eligibility flags for specific services, and customer responsibilities by service.',
  },
  aiServicesList: {
    type: 'public-disclosure',
    label: 'SAP AI Services List',
    url: 'https://www.sap.com/docs/download/agreements/product-policy/css/service-specifications/sap-ai-services-list-english-v10-2024.pdf',
    asOf: SOURCE_AS_OF,
    note: 'SAP AI Services List documents eligible AI service entitlements, Joule availability boundaries, service request requirements, and order-form dependencies for selected SAP cloud services.',
  },
} satisfies Record<string, SourceBasisRef>;

const SAP_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific SAP estate, contract, quote, license, RISE scope, module inventory, usage, SI plan, hyperscaler path, security review, data residency, and exit evidence needed',
  asOf: SOURCE_AS_OF,
  note:
    'Public SAP materials identify product scope, package posture, trust resources, cloud service documents, and request-quote paths, but do not establish buyer-specific net price, discount, migration cost, implementation effort, renewal uplift, indirect access exposure, hyperscaler responsibility split, AI entitlement, or negotiated remedies.',
};

export const PAT_SRC_VEN_SAP_001: PatternSeed = {
  id: 'PAT-SRC-VEN-SAP-001',
  slug: 'sap-cloud-erp-business-suite-procurement-platform-sourcing-profile',
  title: 'SAP Cloud ERP, Business Suite, and Procurement Platform Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'SAP sourcing should be treated as an enterprise operating-model, transformation, data, AI, integration, and commercial architecture decision rather than a narrow ERP renewal or module quote.',
  applicability:
    'Apply when sourcing, renewing, expanding, consolidating, or benchmarking SAP Cloud ERP Public, SAP Cloud ERP Private, RISE with SAP, SAP S/4HANA, SAP BTP, SAP Business AI and Joule, SAP Ariba, SAP SuccessFactors, SAP Business Network, or broader SAP Business Suite programs.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: SOURCE_AS_OF,
  instanceCount: 0,
  sourceDocuments: [
    `${SAP_SOURCE_BASIS.cloudErpPublic.label} - ${SAP_SOURCE_BASIS.cloudErpPublic.url}`,
    `${SAP_SOURCE_BASIS.cloudErpPrivate.label} - ${SAP_SOURCE_BASIS.cloudErpPrivate.url}`,
    `${SAP_SOURCE_BASIS.cloudErpPrivatePackage.label} - ${SAP_SOURCE_BASIS.cloudErpPrivatePackage.url}`,
    `${SAP_SOURCE_BASIS.btp.label} - ${SAP_SOURCE_BASIS.btp.url}`,
    `${SAP_SOURCE_BASIS.businessAi.label} - ${SAP_SOURCE_BASIS.businessAi.url}`,
    `${SAP_SOURCE_BASIS.aribaSourcing.label} - ${SAP_SOURCE_BASIS.aribaSourcing.url}`,
    `${SAP_SOURCE_BASIS.hcm.label} - ${SAP_SOURCE_BASIS.hcm.url}`,
    `${SAP_SOURCE_BASIS.trustCenter.label} - ${SAP_SOURCE_BASIS.trustCenter.url}`,
    `${SAP_SOURCE_BASIS.dataCenters.label} - ${SAP_SOURCE_BASIS.dataCenters.url}`,
    `${SAP_SOURCE_BASIS.dpa.label} - ${SAP_SOURCE_BASIS.dpa.url}`,
    `${SAP_SOURCE_BASIS.privateEditionSdg.label} - ${SAP_SOURCE_BASIS.privateEditionSdg.url}`,
    `${SAP_SOURCE_BASIS.aiServicesList.label} - ${SAP_SOURCE_BASIS.aiServicesList.url}`,
  ],
  regulatoryChips: [
    'GDPR-if-personal-data',
    'DORA-if-regulated-financial-entity',
    'SOX-ICFR-if-financial-reporting-controls',
    'GxP-if-life-sciences-processes',
    'data-residency-review',
    'AI-governance-review',
    'critical-ERP-operational-resilience',
  ],
  relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-HCM-001', 'PAT-SRC-CAT-AGENT-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'enterprise_saas',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'SAP',
      tier: 'enterprise',
      positioning:
        'Enterprise business applications vendor spanning cloud ERP, private ERP transformation, business technology platform, AI assistants and agents, spend management, HCM, analytics, data, integration, and business network workflows.',
      strengths: [
        'Official Cloud ERP materials describe public and private cloud ERP options, preconfigured processes, real-time analytics, AI and machine learning integration, and integration through SAP BTP and SAP Integration Suite',
        'Official Cloud ERP Private and RISE materials position the private path around existing ERP investment protection, customer-paced cloud migration, transformation tools, clean core, SAP Build, and infrastructure preference',
        'Official BTP materials position SAP as the platform layer for integration, application development, automation, data, analytics, and AI-supported extensions across SAP and non-SAP applications',
        'Official Ariba and SuccessFactors materials show that a SAP event may reach beyond finance ERP into procurement, supplier collaboration, workforce data, skills, payroll adjacency, and operational controls',
      ],
      cautions: [
        'Public product pages and request-quote pages do not prove buyer-specific subscription economics, discount, renewal cap, migration effort, SI cost, hyperscaler pass-through, indirect access, or AI entitlement',
        'SAP scope can sprawl across ERP, BTP, Ariba, SuccessFactors, Business Network, analytics, AI, data, extensions, services, support, and partner implementation unless modules and exclusions are written before BAFO',
        'Cloud ERP Private, RISE, public edition, and adjacent SaaS products have different standardization, extensibility, operation, region, service-description, responsibility, and upgrade implications',
        'AI and clean-core claims can create value, but they should not replace process proof, data-governance review, extensibility design, test scripts, and order-form entitlement mapping',
      ],
      sourceBasis: [
        SAP_SOURCE_BASIS.cloudErpPublic,
        SAP_SOURCE_BASIS.cloudErpPrivate,
        SAP_SOURCE_BASIS.cloudErpPrivatePackage,
        SAP_SOURCE_BASIS.btp,
        SAP_SOURCE_BASIS.aribaSourcing,
        SAP_SOURCE_BASIS.hcm,
      ],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Official SAP commercial orientation for Cloud ERP Private package',
      model: 'hybrid',
      metric:
        'Request-quote package posture; buyer economics depend on selected cloud ERP path, modules, users or use rights, usage metrics, BTP services, AI services, support, services, data center or infrastructure choice, implementation partner, transformation scope, and order-form commitments',
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPrivatePackage, SAP_SOURCE_BASIS.privateEditionSdg, SAP_SOURCE_BASIS.aiServicesList],
      confidence: 0.72,
      notes:
        'Use SAP public pages and service documents to identify commercial dimensions and entitlement questions only. Do not infer net price, migration budget, discount band, renewal uplift, hyperscaler economics, AI unit economics, indirect-access exposure, or partner implementation cost without buyer-approved quote, contract, usage, and SI evidence.',
    },
    {
      label: 'Founder data gap - SAP buyer commercial and implementation evidence required',
      model: 'unknown',
      sourceBasis: [SAP_BUYER_DATA_GAP],
      confidence: 0.18,
      notes:
        'No SAP recommendation, renewal-risk score, migration business case, clean-core savings case, or suite-consolidation claim should be produced from public evidence alone.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'SAP scope, module, use-right, and transformation exhibit',
      buyerPosition:
        'Attach a schedule identifying current SAP estate, target cloud ERP path, in-scope modules, excluded modules, named environments, BTP services, Ariba or SuccessFactors scope, AI services, integrations, custom code, data conversion, partner responsibilities, and acceptance criteria.',
      fallbackPosition:
        'If all scope cannot be finalized before award, split committed scope from optional expansion and require a change-control, quote-refresh, and governance process before activation.',
      walkawayTriggers: [
        'Final order form cannot be reconciled to business processes, integrations, environments, data stores, and implementation responsibilities',
        'Commercial case assumes RISE, clean-core, AI, BTP, or suite-consolidation outcomes that are not tied to written acceptance criteria',
      ],
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPrivatePackage, SAP_SOURCE_BASIS.privateEditionSdg, SAP_SOURCE_BASIS.btp],
    },
    {
      clauseArea: 'Data protection, subprocessors, data center, and trust evidence',
      buyerPosition:
        'Close DPA path, Trust Center evidence access, data center or region choice, subprocessor review, TOM review, audit report access, cloud status access, support access, and regulated-data approval before production migration or expanded personal-data processing.',
      fallbackPosition:
        'Where evidence requires SAP for Me or My Trust Center access, make delivery a pre-production gate with named owners, dates, and remedies.',
      sourceBasis: [SAP_SOURCE_BASIS.trustCenter, SAP_SOURCE_BASIS.dataCenters, SAP_SOURCE_BASIS.dpa],
    },
    {
      clauseArea: 'AI, Joule, and extension governance',
      buyerPosition:
        'Document which AI services and Joule capabilities are in scope, which order forms and data centers enable them, how prompts, outputs, skills, agents, logs, access, and human review are governed, and which BTP extensions remain clean-core aligned.',
      fallbackPosition:
        'Treat AI and extension features as gated optional scope unless entitlement, availability, data handling, control owner, and acceptance tests are documented.',
      sourceBasis: [SAP_SOURCE_BASIS.businessAi, SAP_SOURCE_BASIS.aiServicesList, SAP_SOURCE_BASIS.btp],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Separate ERP transformation scope from adjacent-suite expansion',
      whenToUse:
        'Use when a RISE or Cloud ERP Private negotiation bundles BTP, Ariba, SuccessFactors, Business Network, analytics, AI, services, and partner implementation into one transformation story.',
      buyerAsk:
        'Require a line-by-line map of committed ERP migration scope, optional adjacent products, services, support, data center, AI, BTP, and partner workstreams, with separate acceptance gates and renewal baselines.',
      vendorGive:
        'SAP or partners may offer package constructs, transformation tooling, phased adoption, credits, services, or suite expansion. Accept only when tied to measurable buyer scope and order-form terms.',
      tradeoffs: [
        'Bundling can simplify executive sponsorship and platform architecture, but it can also obscure module boundaries, adoption risk, implementation accountability, and renewal leverage.',
      ],
      evidenceBasis: [SAP_SOURCE_BASIS.cloudErpPrivatePackage, SAP_SOURCE_BASIS.privateEditionSdg, SAP_BUYER_DATA_GAP],
    },
    {
      lever: 'Make clean-core and BTP extension value testable',
      whenToUse:
        'Use when the value case depends on reducing custom-code debt, building side-by-side extensions, automating workflows, or integrating SAP and non-SAP systems through BTP.',
      buyerAsk:
        'Require a custom-code and integration inventory, target-state extension architecture, BTP service list, governance model, acceptance tests, and exit plan before counting modernization value.',
      evidenceBasis: [SAP_SOURCE_BASIS.btp, SAP_SOURCE_BASIS.cloudErpPrivatePackage],
    },
  ],
  riskFactors: [
    {
      id: 'sap-suite-scope-sprawl',
      label: 'Suite scope sprawl without operating-model ownership',
      severity: 'high',
      detectionSignals: [
        'A Cloud ERP or RISE negotiation expands into BTP, Ariba, SuccessFactors, Business Network, analytics, AI, support, services, and partner work without a single scope owner and acceptance map.',
      ],
      mitigations: ['Build a process-to-module inventory', 'Separate committed and optional scope', 'Name business owners and implementation owners for every workstream'],
      contractualRemedies: ['Scope exhibit', 'Acceptance criteria', 'Change-control schedule', 'Expansion quote refresh', 'Renewal baseline schedule'],
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPublic, SAP_SOURCE_BASIS.cloudErpPrivate, SAP_SOURCE_BASIS.cloudErpPrivatePackage],
    },
    {
      id: 'sap-commercial-meter-ambiguity',
      label: 'Commercial meter and entitlement ambiguity',
      severity: 'high',
      detectionSignals: [
        'The business case depends on package value, user migration, AI services, BTP consumption, infrastructure choice, support, partner work, or legacy license conversion without quote and order-form traceability.',
      ],
      mitigations: ['Normalize current estate and target entitlements', 'Reconcile public service descriptions to order forms', 'Keep usage and AI assumptions out of savings claims until evidenced'],
      contractualRemedies: ['Order-form reconciliation workbook', 'Usage reporting', 'AI entitlement schedule', 'Downsize and substitution rights', 'Renewal cap'],
      sourceBasis: [SAP_SOURCE_BASIS.cloudErpPrivatePackage, SAP_SOURCE_BASIS.privateEditionSdg, SAP_SOURCE_BASIS.aiServicesList, SAP_BUYER_DATA_GAP],
    },
    {
      id: 'sap-cloud-responsibility-and-data-location-gap',
      label: 'Cloud responsibility, data location, and trust evidence gap',
      severity: 'high',
      detectionSignals: [
        'The event assumes data residency, disaster recovery, SLA, subprocessor, security, support, or cloud-status coverage without product-specific SAP Trust Center, service-description, and order-form evidence.',
      ],
      mitigations: ['Run Trust Center evidence review', 'Confirm data center and availability access path', 'Map customer and SAP responsibilities by service'],
      contractualRemedies: ['DPA exhibit', 'Subprocessor notice process', 'Data center schedule', 'Service-description attachment', 'Exit and transition assistance'],
      sourceBasis: [SAP_SOURCE_BASIS.trustCenter, SAP_SOURCE_BASIS.dataCenters, SAP_SOURCE_BASIS.dpa, SAP_SOURCE_BASIS.privateEditionSdg],
    },
  ],
  industryVariants: [
    {
      industry: 'financial_services',
      modifier:
        'Treat SAP ERP, procurement, HCM, BTP, and AI scope as potential material ICT dependencies when they support financial reporting, payments, supplier controls, operational resilience, regulated data, or customer-impacting processes.',
      additionalRequirements: ['DORA classification review where applicable', 'SOX and ICFR control mapping', 'Exit and continuity plan', 'Data residency and subprocessor review'],
      regulatoryRefs: ['DORA-if-EU-financial-entity', 'SOX-ICFR-if-public-company', 'GDPR-if-EU-personal-data'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'manufacturing',
      modifier:
        'Test plant, supply chain, quality, warehouse, planning, procurement, EHS, and shop-floor integration realities before accepting Cloud ERP Private or public-edition fit.',
      additionalRequirements: ['Plant scenario scripts', 'MES and warehouse integration proof', 'Quality and traceability controls', 'Cutover rehearsal plan'],
      affectedStages: ['RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm PHI boundaries, GxP or validated-process needs, workforce data, supplier data, audit evidence, retention, and data-center commitments before moving regulated workflows into SAP cloud services.',
      additionalRequirements: ['Regulated data classification', 'Validation and audit evidence plan', 'Privacy and security review'],
      regulatoryRefs: ['HIPAA-if-PHI', 'GxP-if-validated-processes'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate procurement law, accessibility, records retention, sovereign cloud, data residency, public-sector security, and audit needs before treating generic SAP cloud posture as sufficient.',
      additionalRequirements: ['Public procurement compliance review', 'Accessibility review', 'Records retention plan', 'Sovereign or regional hosting review'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
  ],
  body: `## Summary
SAP should be sourced as an enterprise operating-model and transformation platform decision, not as a narrow ERP renewal. Public SAP materials describe multiple overlapping paths: SAP Cloud ERP, formerly SAP S/4HANA Cloud Public Edition, as an out-of-the-box cloud ERP with preconfigured processes; SAP Cloud ERP Private and RISE with SAP as a more tailored cloud ERP transformation path for existing ERP estates; SAP Business Technology Platform as the integration, data, application development, automation, and AI-supported extension layer; SAP Business AI and Joule as role-aware assistants and agents grounded in business process context; SAP Ariba for sourcing and procurement workflows; and SAP SuccessFactors for workforce and people data. That breadth is the sourcing opportunity and the sourcing risk. The buyer can rationalize a large part of the enterprise operating stack, but only if commercial scope, process fit, data controls, implementation accountability, and exit mechanics are explicit before award.

## When to apply
Use this profile when SAP is an incumbent, finalist, renewal target, expansion platform, migration destination, or benchmark vendor for cloud ERP, ERP modernization, RISE with SAP, SAP S/4HANA, BTP, integration, clean-core extension, Ariba sourcing or procurement, SuccessFactors HCM, Business Network, analytics, AI, or broader Business Suite programs. It is especially relevant when executives frame SAP as the obvious enterprise standard, when a legacy ECC or S/4 estate is being moved to cloud, when procurement wants Ariba connected to ERP, when HR data is part of the transformation, or when a proposal blends SAP software, SAP services, hyperscaler operation, systems integrator work, BTP consumption, and AI capabilities into one commercial story. The pattern does not decide that SAP is the right answer. It forces the sourcing file to prove what SAP will run, what it will replace, what remains outside scope, and who owns each implementation and operating risk.

## Evidence to collect
Start with an estate baseline. Inventory current SAP and non-SAP systems, modules, users, interfaces, custom code, integrations, batch jobs, reports, business roles, security roles, data stores, master data, process variants, countries, legal entities, plants, warehouses, suppliers, employees, customers, regulated data classes, audit controls, and pain points. Then map the target. Separate Cloud ERP Public, Cloud ERP Private, RISE, BTP, Ariba, SuccessFactors, Business Network, analytics, AI, and services into committed, optional, excluded, and future-state lanes. For each lane, capture the business owner, technical owner, implementation partner, acceptance test, cutover dependency, support path, region or data center expectation, data-processing path, and order-form entitlement. Public SAP pages are useful for capability orientation, but buyer proof comes from the current estate, scripted demos, architecture review, legal review, quote evidence, partner plan, and implementation rehearsal.

## Commercial posture
SAP public pages and service documents should be used to identify commercial dimensions, not to infer a price. The Cloud ERP Private package page directs buyers to request a quote, and SAP service documents show that product scope, usage metrics, cloud-service eligibility, AI service access, and order-form terms matter. A sourcing team should therefore normalize current license and maintenance baseline, subscription conversion, modules, users or use rights, Full Use Equivalent assumptions where relevant, AI services, BTP services, environments, storage, interfaces, support, services, partner implementation, data migration, testing, training, hypercare, renewal caps, expansion rates, and exit assistance. No net pricing, discount, savings, migration cost, hyperscaler pass-through, indirect access exposure, or AI consumption conclusion should be inferred from public sources alone.

## Contract and data controls
SAP can become the system of record for financial, procurement, supplier, workforce, manufacturing, customer, and operational data. Before production migration or expansion, the sourcing file should close the DPA path, customer data ownership, subprocessor review, technical and organizational measures, Trust Center evidence, audit-report access, support and cloud-status access, data center and region expectations, backup and disaster recovery posture, service-description applicability, deletion and export obligations, regulated-data approvals, and security responsibility split. Public Trust Center and data center pages identify evidence pathways, but the buyer still needs product-specific and tenant-specific confirmation. If the buyer depends on SAP for financial close, procurement controls, HR records, supply chain execution, or regulated operations, service credits alone may not be enough. Escalation, continuity, transition, evidence access, and exit obligations should be written into the deal file.

## AI, BTP, and clean core
Treat AI and clean-core claims as testable design commitments. SAP Business AI, Joule, and BTP may be strategically useful when they improve workflow, extension, integration, automation, and business-context grounding. They also create sourcing questions: which AI services are entitled, which order forms enable them, which data centers and cloud services support them, how messages or usage are measured, how prompts and outputs are logged, which humans approve decisions, which extensions are side-by-side rather than core modifications, and how non-SAP systems connect. The clean-core value case should be supported by a custom-code inventory, extension architecture, integration catalog, governance model, developer ownership, security review, and regression-test plan.

## Evaluation scenarios
Run buyer-authored scenarios before award. For finance: close a period, approve a journal, reconcile controls, and produce audit evidence. For procurement: run a sourcing event, onboard a supplier, create an award, connect contract or purchase flow, and show supplier data governance. For manufacturing or supply chain: plan demand, handle a quality exception, update inventory, and prove shop-floor or warehouse integration. For HR: update workforce data, review role security, and test payroll or downstream finance handoffs where in scope. For BTP: build or demonstrate one clean-core extension, one integration, and one workflow with monitoring and ownership. For AI: run a controlled Joule or agent scenario with data boundaries, human review, logging, and entitlement proof.

## Failure modes
The first failure mode is suite-scope sprawl: a cloud ERP event expands into Business Suite, BTP, Ariba, SuccessFactors, AI, services, and partner work without a single operating-model owner. The second is commercial ambiguity: package language hides module boundaries, use rights, AI entitlements, BTP consumption, environments, support, implementation, conversion, and renewal exposure. The third is implementation optimism: the buyer signs before custom code, integrations, data quality, testing, change management, cutover, and partner accountability are evidenced. The fourth is trust overgeneralization: a generic SAP trust posture is treated as approval for a specific service, region, data class, subprocessor, or regulated workflow. The fifth is AI and clean-core overclaim: future-state productivity is counted before entitlement, availability, governance, extension architecture, and acceptance evidence are written down.

## Instances
No tenant instances are attached to this seed. Use it as a public-source SAP vendor profile and enrich it only with approved buyer evidence before making a vendor recommendation, pricing conclusion, renewal-risk conclusion, migration plan, or suite-consolidation business case.`,
};

export const SOURCING_VENDOR_SAP_PATTERNS: PatternSeed[] = [PAT_SRC_VEN_SAP_001];
