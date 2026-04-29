import type { PatternSeed } from './seed-types';

const COUPA_SOURCE_BASIS = {
  platform: {
    type: 'public-disclosure' as const,
    label: 'Coupa AI-Native Total Spend Management platform overview',
    url: 'https://www.coupa.com/',
    asOf: '2026-04-29',
    note: 'Coupa describes its platform as total spend management across procurement, finance, supply chain, direct spend, and indirect spend.',
  },
  products: {
    type: 'public-disclosure' as const,
    label: 'Coupa products overview',
    url: 'https://www.coupa.com/products/',
    asOf: '2026-04-29',
    note: 'Product overview lists source-to-contract, procure-to-pay, AP automation, treasury and cash management, and supply chain collaboration capabilities.',
  },
  sourceToContract: {
    type: 'public-disclosure' as const,
    label: 'Coupa Source-to-Contract software',
    url: 'https://www.coupa.com/products/source-to-contract/',
    asOf: '2026-04-29',
    note: 'Coupa describes source-to-contract workflows for savings opportunities, bids, stakeholder evaluation, contracts, and supplier onboarding.',
  },
  sourcing: {
    type: 'public-disclosure' as const,
    label: 'Coupa Strategic Sourcing software',
    url: 'https://www.coupa.com/products/source-to-contract/sourcing/',
    asOf: '2026-04-29',
    note: 'Coupa describes sourcing event templates, bid collection, collaboration, advanced sourcing optimization, policy compliance, and award activation.',
  },
  apAutomation: {
    type: 'public-disclosure' as const,
    label: 'Coupa AP Automation software',
    url: 'https://www.coupa.com/products/ap-automation/',
    asOf: '2026-04-29',
    note: 'Coupa describes e-invoicing, 2-way and 3-way matching, approval workflows, real-time spend analytics, and compliance support.',
  },
  payments: {
    type: 'public-disclosure' as const,
    label: 'Coupa payment management software',
    url: 'https://www.coupa.com/products/ap-automation/payments/',
    asOf: '2026-04-29',
    note: 'Coupa describes Coupa Pay for supplier, employee, and subsidiary payments, payment status visibility, invoicing integration, and automatic reconciliation.',
  },
  supplierRisk: {
    type: 'public-disclosure' as const,
    label: 'Coupa Supplier Risk and Performance Management',
    url: 'https://www.coupa.com/products/source-to-contract/supplier-risk-performance/',
    asOf: '2026-04-29',
    note: 'Coupa describes supplier onboarding, supplier self-service, risk monitoring, assessments, performance signals, and supplier health workflows.',
  },
  supplierDocs: {
    type: 'public-disclosure' as const,
    label: 'Coupa supplier documentation',
    url: 'https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers',
    asOf: '2026-04-29',
    note: 'Supplier documentation describes the Coupa Supplier Portal, Supplier Actionable Notifications, and Coupa Sourcing Optimization for suppliers.',
  },
  trust: {
    type: 'public-disclosure' as const,
    label: 'Coupa compliance, security, and AI trust',
    url: 'https://www.coupa.com/compliance-security/',
    asOf: '2026-04-29',
    note: 'Coupa publishes security and compliance posture including SOC, ISO, PCI, privacy, data residency, and AI trust materials.',
  },
  msa: {
    type: 'public-disclosure' as const,
    label: 'Coupa Master Subscription Agreement',
    url: 'https://www.coupa.com/master-subscription-agreement',
    asOf: '2026-04-29',
    note: 'MSA defines order forms, hosted applications, customer data, aggregate data, support, security measures, data return or deletion, and subscription terms.',
  },
  ai: {
    type: 'public-disclosure' as const,
    label: 'Coupa AI platform overview',
    url: 'https://www.coupa.com/platform/ai/',
    asOf: '2026-04-29',
    note: 'Coupa describes AI across design-to-pay, sourcing, procurement, invoicing, payments, expenses, fraud, and supplier risk, based on community-generated spend insights.',
  },
  gartnerS2P: {
    type: 'public-disclosure' as const,
    label: 'Coupa 2025 Gartner Magic Quadrant for Source-to-Pay Suites announcement',
    url: 'https://www.coupa.com/newsroom/coupa-named-a-leader-in-the-2025-gartner-magic-quadrant-for-source-to-pay-suites/',
    asOf: '2026-04-29',
    note: 'Coupa announced Gartner Source-to-Pay Suites Leader recognition; use as vendor-published analyst-positioning evidence, not as independent scoring in this seed.',
  },
};

const COUPA_SOURCING_LIFECYCLE = [
  {
    id: 'Scope',
    label: 'Spend-management scope',
    order: 1,
    description:
      'Define whether Coupa is being evaluated for upstream sourcing only, procure-to-pay only, AP automation, payments, supplier risk, treasury, or a broader total-spend-management transformation.',
  },
  {
    id: 'MarketScan',
    label: 'Suite and incumbent comparison',
    order: 2,
    description:
      'Compare Coupa against ERP-native, S2P-suite, AP-specialist, supplier-risk, and payment alternatives using buyer process coverage rather than vendor slogans.',
  },
  {
    id: 'RFP',
    label: 'Design-to-pay proof scenarios',
    order: 3,
    description:
      'Run buyer-authored scenarios across sourcing events, contract handoff, purchase requisition, PO, goods or services receipt, invoice matching, supplier update, and payment reconciliation.',
  },
  {
    id: 'BAFO',
    label: 'Commercial and integration normalization',
    order: 4,
    description:
      'Normalize modules, transaction volumes, users, suppliers, integrations, AI features, support, implementation services, payment rails, renewal caps, and exit obligations before finalist scoring.',
  },
  {
    id: 'Contracting',
    label: 'Control, data, and adoption commitments',
    order: 5,
    description:
      'Convert the award into contract schedules for data ownership, aggregate-data use, security reports, service levels, implementation acceptance, supplier enablement, audit evidence, and transition support.',
  },
];

export const SOURCING_VENDOR_COUPA_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-COUPA-001',
    slug: 'coupa-spend-management-procurement-ap-sourcing-profile',
    title: 'Coupa Spend Management Procurement, AP, and Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Coupa sourcing should be evaluated as a spend-management operating layer, not as a standalone procurement screen; the decision must prove upstream sourcing, downstream buying, AP, supplier, payment, data, AI, and control fit together.',
    applicability:
      'Apply when sourcing or renewing Coupa for source-to-contract, procure-to-pay, AP automation, supplier management, supplier risk, Coupa Pay, treasury, supply chain collaboration, or a broader business-spend-management transformation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.coupa.com/',
      'https://www.coupa.com/products/',
      'https://www.coupa.com/products/source-to-contract/',
      'https://www.coupa.com/products/source-to-contract/sourcing/',
      'https://www.coupa.com/products/ap-automation/',
      'https://www.coupa.com/products/ap-automation/payments/',
      'https://www.coupa.com/products/source-to-contract/supplier-risk-performance/',
      'https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers',
      'https://www.coupa.com/compliance-security/',
      'https://www.coupa.com/master-subscription-agreement',
      'https://www.coupa.com/platform/ai/',
      'https://www.coupa.com/newsroom/coupa-named-a-leader-in-the-2025-gartner-magic-quadrant-for-source-to-pay-suites/',
    ],
    regulatoryChips: [
      'SOC-1',
      'SOC-2',
      'ISO-27001',
      'ISO-27701',
      'PCI-DSS',
      'GDPR-if-EU-personal-data',
      'tax-e-invoicing-if-in-scope',
      'SOX-ICFR-if-public-company',
    ],
    relatedPatternIds: [
      'PAT-SRC-001',
      'PAT-SRC-003',
      'PAT-SRC-007',
      'PAT-SRC-CAT-ERP-001',
      'PAT-SRC-CAT-FINOPS-001',
    ],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: COUPA_SOURCING_LIFECYCLE,
    perStageGateCriteria: {
      Scope: [
        {
          id: 'coupa-scope-boundary',
          stageId: 'Scope',
          gateType: 'hard',
          description: 'The buyer has identified which Coupa modules and adjacent processes are truly in scope.',
          evaluationHint:
            'Require a scope map for sourcing, contracts, supplier onboarding, requisitioning, purchasing, invoice matching, payments, treasury, risk, and ERP integrations before market scoring begins.',
        },
      ],
      RFP: [
        {
          id: 'coupa-design-to-pay-proof',
          stageId: 'RFP',
          gateType: 'hard',
          description: 'Coupa demonstrates a buyer-authored design-to-pay workflow with evidence artifacts.',
          evaluationHint:
            'The demo should carry one event from sourcing opportunity through award, contract or catalog activation, PO, invoice match, supplier update, and payment or reconciliation evidence.',
        },
      ],
      BAFO: [
        {
          id: 'coupa-commercial-normalization',
          stageId: 'BAFO',
          gateType: 'hard',
          description: 'Commercial scoring separates software subscription, usage, payment, supplier, implementation, and support costs.',
          evaluationHint:
            'Reject single headline pricing if order-form metrics, modules, transaction assumptions, supplier enablement, integrations, AI features, payment rails, and renewal terms are not comparable.',
        },
      ],
    },
    perStageExpectedArtifacts: {
      Scope: [
        {
          id: 'coupa-process-inventory',
          label: 'Coupa process and module inventory',
          stageId: 'Scope',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Inventory in-scope and out-of-scope Coupa processes, integrations, user populations, supplier populations, countries, currencies, tax regimes, and financial controls.',
        },
      ],
      RFP: [
        {
          id: 'coupa-scripted-scenario-pack',
          label: 'Scripted source-to-pay scenario pack',
          stageId: 'RFP',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Buyer-authored test scripts covering sourcing event setup, bid evaluation, supplier onboarding, contract/catalog activation, PO, service sheet or receipt, invoice match, exception, and payment reconciliation.',
        },
      ],
      Contracting: [
        {
          id: 'coupa-data-security-and-exit-exhibit',
          label: 'Data, security, aggregate-data, and exit exhibit',
          stageId: 'Contracting',
          requirement: 'required',
          gateType: 'hard',
          description:
            'Contract exhibit covering customer-data ownership, processing purposes, aggregate/anonymized data boundaries, security evidence, support contacts, data return or deletion, and transition assistance.',
        },
      ],
    },
    vendorLandscape: [
      {
        vendorName: 'Coupa',
        tier: 'enterprise',
        positioning:
          'AI-native total spend management suite spanning source-to-contract, procure-to-pay, AP automation, payments, supplier risk, and adjacent treasury or supply-chain collaboration use cases.',
        strengths: [
          'Public product materials show broad source-to-pay and AP coverage',
          'Supplier portal, supplier risk, payment, and AP workflows can be evaluated in one platform motion',
          'AI and community-data positioning is central to Coupa public materials',
        ],
        cautions: [
          'Do not treat vendor-published AI, savings, or analyst-recognition claims as buyer-specific ROI proof',
          'Numeric subscription, usage, payment, implementation, and discount assumptions require order-form, quote, invoice, or benchmark evidence',
          'ERP coexistence and supplier enablement work must be proven with buyer data, not generic demonstrations',
        ],
        sourceBasis: [
          COUPA_SOURCE_BASIS.platform,
          COUPA_SOURCE_BASIS.products,
          COUPA_SOURCE_BASIS.sourceToContract,
          COUPA_SOURCE_BASIS.apAutomation,
          COUPA_SOURCE_BASIS.payments,
        ],
      },
      {
        vendorName: 'ERP-native procurement and AP modules',
        tier: 'incumbent',
        positioning:
          'Incumbent comparison set where SAP, Oracle, Microsoft, or NetSuite finance/procurement modules already carry master data, controls, and accounting workflows.',
        strengths: ['System-of-record adjacency', 'Existing finance-control footprint', 'Potentially simpler master-data governance'],
        cautions: ['May not match Coupa depth in sourcing, supplier network, or spend-management workflows without buyer-specific proof'],
      },
      {
        vendorName: 'Specialist S2P, AP automation, supplier-risk, and payment vendors',
        tier: 'specialist',
        positioning:
          'Best-of-breed alternatives may compete on narrower depth for sourcing optimization, invoice automation, supplier risk, virtual cards, payments, or contract lifecycle management.',
        strengths: ['Focused feature depth', 'Possible faster deployment for narrow scope', 'Useful price and control pressure in finalist rounds'],
        cautions: ['Cross-process data continuity, supplier experience, and realized savings may depend on more integrations'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Coupa commercial model evidence gate',
        model: 'hybrid',
        metric: 'Order-form modules, subscription metrics, usage meters, services, and payment-related assumptions',
        sourceBasis: [COUPA_SOURCE_BASIS.msa],
        confidence: 0.62,
        notes:
          'The public MSA states that order forms specify fees, billing period, subscription model, usage meters, and commercial terms. This seed intentionally includes no public price range, discount range, or private benchmark; require quote, invoice, reseller, or approved benchmark evidence before numeric scoring.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Module, metric, and order-form completeness',
        buyerPosition:
          'Require an order-form schedule that names each hosted application, module, subscription metric, usage meter, billing period, support level, country scope, supplier scope, payment capability, and excluded feature.',
        fallbackPosition:
          'If commercial packaging changes during negotiation, require a side-by-side reconciliation from original RFP assumptions to final order-form terms.',
        walkawayTriggers: [
          'Vendor cannot map quoted modules to RFP process scope',
          'Payment, AI, supplier, transaction, or support assumptions are left outside the financial model',
        ],
        sourceBasis: [COUPA_SOURCE_BASIS.msa],
      },
      {
        clauseArea: 'Customer data, aggregate data, and AI boundaries',
        buyerPosition:
          'Confirm customer-data ownership, processing purposes, subprocessor controls, aggregate/anonymized data boundaries, AI-data posture, export rights, deletion, and any opt-out or restriction required by buyer policy.',
        fallbackPosition:
          'If standard aggregate-data or AI language is retained, attach a buyer-specific governance memo that states what spend, supplier, invoice, payment, and personal data may enter Coupa and who approves exceptions.',
        walkawayTriggers: [
          'No acceptable explanation of aggregate-data use or customer-data processing boundaries',
          'No DPA, privacy exhibit, or security evidence path for regulated personal or financial data',
        ],
        sourceBasis: [COUPA_SOURCE_BASIS.msa, COUPA_SOURCE_BASIS.trust, COUPA_SOURCE_BASIS.ai],
      },
      {
        clauseArea: 'Implementation acceptance and realized-value controls',
        buyerPosition:
          'Tie milestone payments and production acceptance to completed integrations, supplier enablement, approval workflows, invoice matching, exception handling, reporting, controls evidence, and user adoption criteria.',
        fallbackPosition:
          'Allow phased go-live only if each phase has named process scope, control owner, data-conversion criteria, supplier-readiness threshold, and remediation rights.',
        walkawayTriggers: [
          'Implementation plan excludes supplier enablement or ERP integration accountability',
          'Acceptance criteria are limited to technical activation rather than controlled process outcomes',
        ],
      },
      {
        clauseArea: 'Security, compliance, and AP control evidence',
        buyerPosition:
          'Preserve access to SOC, ISO, PCI, privacy, e-invoicing, tax-compliance, support, incident, and audit evidence needed by finance, procurement, security, and internal-control owners.',
        fallbackPosition:
          'Where reports are only available through a portal, require named access owners, refresh cadence, evidence-retention rights, and escalation for material findings.',
        walkawayTriggers: [
          'Security or compliance reports cannot be obtained before production use',
          'AP and payment controls cannot be mapped to buyer audit or ICFR expectations',
        ],
        sourceBasis: [COUPA_SOURCE_BASIS.trust, COUPA_SOURCE_BASIS.apAutomation, COUPA_SOURCE_BASIS.payments],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Suite consolidation versus narrow best-of-breed pressure',
        whenToUse:
          'Use when Coupa is competing against ERP-native procurement/AP, source-to-contract specialists, AP automation specialists, supplier-risk vendors, or payment platforms.',
        buyerAsk:
          'Trade broader suite scope only for proven workflow continuity, lower integration burden, supplier adoption plan, commercial protections, renewal caps, and measurable implementation acceptance.',
        vendorGive:
          'Vendor may offer phased module activation, implementation credits, supplier enablement support, premium support, or stronger renewal protections instead of unsupported ROI assertions.',
        tradeoffs: [
          'Suite consolidation can reduce process fragmentation, but it can also increase lock-in if exit, data export, and module-substitution rights are weak.',
          'A specialist may outperform a suite in one process while losing value across the source-to-pay handoffs.',
        ],
        evidenceBasis: [COUPA_SOURCE_BASIS.products, COUPA_SOURCE_BASIS.sourceToContract, COUPA_SOURCE_BASIS.apAutomation],
      },
      {
        lever: 'Supplier network and portal adoption proof',
        whenToUse:
          'Use when the value case depends on suppliers using Coupa for sourcing events, profile updates, POs, catalogs, invoices, service sheets, risk evidence, or payment details.',
        buyerAsk:
          'Require supplier segmentation, enablement schedule, communication assets, supplier support model, adoption targets, exception process, and evidence of how non-adopting suppliers will be handled.',
        vendorGive:
          'Vendor may provide supplier-enablement playbooks, portal documentation, outreach support, or risk/performance workflow templates.',
        tradeoffs: ['Supplier self-service value is only real if critical suppliers can and will operate in the process.'],
        evidenceBasis: [COUPA_SOURCE_BASIS.supplierRisk, COUPA_SOURCE_BASIS.supplierDocs],
      },
      {
        lever: 'AP and payment control as finalist differentiator',
        whenToUse:
          'Use when finance sponsors care as much about invoice automation, fraud controls, tax/e-invoicing, reconciliation, working capital, and cash visibility as procurement savings.',
        buyerAsk:
          'Make BAFO contingent on AP control mapping, 2-way and 3-way match proof, exception workflow, payment reconciliation, virtual-card or payment-rail assumptions, and audit evidence access.',
        vendorGive:
          'Vendor may offer finance-led workshops, AP automation demos, payment schedule detail, fraud-detection workflow proof, or compliance evidence sessions.',
        evidenceBasis: [COUPA_SOURCE_BASIS.apAutomation, COUPA_SOURCE_BASIS.payments, COUPA_SOURCE_BASIS.trust],
      },
    ],
    riskFactors: [
      {
        id: 'coupa-suite-scope-sprawl',
        label: 'Suite scope sprawl without operating-model proof',
        severity: 'high',
        detectionSignals: [
          'The event expands from sourcing or AP into total spend management without a process owner map',
          'Business case assumes procurement, finance, supplier, and payment benefits without adoption gates',
          'ERP, tax, approval, supplier, and payment owners are not in the RFP script review',
        ],
        mitigations: [
          'Freeze in-scope modules and workflows before RFP scoring',
          'Use end-to-end scenarios rather than module demos',
          'Tie each value claim to a named process owner and acceptance artifact',
        ],
        contractualRemedies: ['Phased activation rights', 'Implementation acceptance criteria', 'Module substitution or downsizing rights'],
        sourceBasis: [COUPA_SOURCE_BASIS.products, COUPA_SOURCE_BASIS.sourceToContract],
      },
      {
        id: 'coupa-commercial-metric-ambiguity',
        label: 'Commercial metric ambiguity',
        severity: 'high',
        detectionSignals: [
          'Quote does not separate modules, users, transactions, suppliers, payment usage, support, implementation, integrations, and AI features',
          'Order-form metrics do not map to buyer volume forecasts',
          'Renewal model, overage treatment, or added-module economics are unclear',
        ],
        mitigations: [
          'Require a commercial model trace from RFP assumptions to order form',
          'Stress-test invoice, PO, supplier, user, country, currency, payment, and AI usage growth',
        ],
        contractualRemedies: ['Renewal caps', 'Usage true-up limits', 'Downsizing and module-substitution rights', 'Price hold for phased deployments'],
        sourceBasis: [COUPA_SOURCE_BASIS.msa],
      },
      {
        id: 'coupa-supplier-adoption-gap',
        label: 'Supplier adoption gap',
        severity: 'medium',
        detectionSignals: [
          'Critical suppliers are expected to use portal, invoice, risk, service-sheet, catalog, or payment workflows without readiness segmentation',
          'Supplier exceptions are treated as operations cleanup rather than source-to-pay design',
        ],
        mitigations: [
          'Segment suppliers by spend, risk, invoice volume, country, catalog need, and payment method',
          'Require enablement metrics and exception handling in implementation governance',
        ],
        contractualRemedies: ['Supplier enablement services', 'Adoption reporting', 'Go-live acceptance tied to critical-supplier readiness'],
        sourceBasis: [COUPA_SOURCE_BASIS.supplierRisk, COUPA_SOURCE_BASIS.supplierDocs],
      },
      {
        id: 'coupa-ai-and-aggregate-data-overtrust',
        label: 'AI and aggregate-data overtrust',
        severity: 'medium',
        detectionSignals: [
          'Buyer accepts AI, community benchmark, or savings language as decision evidence without validating data boundaries and local process fit',
          'No owner has reviewed aggregate-data, anonymization, AI, and privacy language',
        ],
        mitigations: [
          'Treat AI and community insights as hypotheses to test with buyer scenarios',
          'Route data, privacy, AI, and legal review before award',
        ],
        contractualRemedies: ['AI use exhibit', 'Aggregate-data restriction or clarification', 'DPA and subprocessor review', 'Customer-data export and deletion commitments'],
        sourceBasis: [COUPA_SOURCE_BASIS.ai, COUPA_SOURCE_BASIS.msa, COUPA_SOURCE_BASIS.trust],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Raise supplier-risk, audit, payment-control, outsourcing, resilience, data-location, and DORA-adjacent review where Coupa supports regulated functions or material ICT dependencies.',
        additionalRequirements: ['Operational resilience review', 'Payment and AP control mapping', 'Supplier-risk governance', 'Exit and data-export evidence'],
        regulatoryRefs: ['DORA-if-EU-financial-entity', 'SOX-ICFR-if-public-company', 'PCI-DSS-if-card-data'],
        affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'retail_cpg',
        modifier:
          'Emphasize direct and indirect spend segmentation, supplier collaboration, category strategy, invoice tolerance, tax/e-invoicing, rebates, service sheets, and inventory or supply-chain handoffs.',
        additionalRequirements: ['Supplier adoption plan', 'Category and direct-spend scenario pack', 'ERP and inventory handoff proof'],
        affectedStages: ['Scope', 'RFP', 'BAFO'],
      },
      {
        industry: 'manufacturing',
        modifier:
          'Test direct-material sourcing, supplier collaboration, logistics constraints, quality documentation, inventory integration, service procurement, and AP matching against plant-level realities.',
        additionalRequirements: ['Direct-material award scenario', 'Plant and supplier workflow proof', 'Quality and receiving exception handling'],
        affectedStages: ['RFP', 'BAFO', 'Contracting'],
      },
      {
        industry: 'public_sector',
        modifier:
          'Raise public procurement rule, accessibility, data residency, records retention, audit, competitive-event transparency, and supplier equity requirements before sourcing-event design is accepted.',
        additionalRequirements: ['Public procurement compliance review', 'Records retention and audit plan', 'Accessibility and residency review'],
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
    ],
    body: `## Summary
Coupa should be sourced as a spend-management operating layer, not as a narrow procurement application. Coupa's public materials position the company around AI-native total spend management and list product areas that span source-to-contract, procure-to-pay, AP automation, payments, treasury and cash management, supplier risk and performance, supplier collaboration, and related supply-chain workflows. That breadth is strategically useful only if the buyer proves the handoffs. The sourcing question is not simply whether Coupa can run an RFP or process an invoice. The question is whether the buyer's sourcing opportunities, awards, contracts, catalogs, purchase orders, supplier updates, invoice matching, exception workflows, payment status, cash visibility, controls evidence, and ERP master data can operate as one governed process.

## When to apply
Use this profile for a new Coupa selection, an incumbent Coupa renewal, a source-to-pay suite consolidation, an AP automation replacement, a supplier-risk expansion, a Coupa Pay evaluation, or a procurement transformation where Coupa is being compared with ERP-native modules and specialist vendors. It is especially relevant when procurement sponsors emphasize savings capture, finance sponsors emphasize invoice automation or payment controls, and IT sponsors emphasize integration, security, data, and supplier adoption. Do not use this pattern to justify Coupa by vendor brand alone. It should force a buyer-specific proof path.

## Public capability boundary
Public Coupa pages describe source-to-contract workflows for identifying savings opportunities, requesting bids, evaluating responses, creating contracts, and onboarding suppliers. Coupa's strategic sourcing materials describe templates, bid collection, stakeholder collaboration, advanced sourcing optimization, policy compliance, award activation, and connections from sourcing into contracting and buying. Its AP automation materials describe e-invoicing, 2-way and 3-way matching, approval workflows, real-time spend analytics, and compliance support. Coupa Pay materials describe payments to suppliers, employees, and subsidiaries, payment status visibility, integration with invoicing, and automatic reconciliation. Supplier risk and supplier documentation materials describe onboarding, supplier self-service, risk monitoring, the Coupa Supplier Portal, Supplier Actionable Notifications, and supplier participation in Coupa sourcing events.

Those statements support a broad evaluation frame, but they do not prove fit for any specific buyer. The sourcing event should therefore separate public capability existence from buyer readiness. A global manufacturer, public entity, bank, retailer, or services company will each expose different constraints around supplier master data, invoice tolerances, payment rails, tax/e-invoicing, direct materials, delegated approvals, audit evidence, data residency, and ERP coexistence.

## Scope and proof design
The scope gate must name the in-scope modules and the excluded modules. A Coupa event becomes fragile when stakeholders say “source-to-pay” but mean different things: sourcing events for procurement, catalog buying for employees, AP invoice automation for finance, supplier risk for compliance, payment execution for treasury, or direct-spend collaboration for supply chain. Before market scoring, require a process inventory covering countries, currencies, entities, approval policies, ERP systems, suppliers, users, invoice types, service sheets, purchase-order channels, payment methods, tax regimes, regulated data, and audit owners.

The RFP should use scripted design-to-pay scenarios. At minimum, test a sourced category from opportunity identification to event setup, supplier bid, stakeholder evaluation, award, contract or catalog activation, requisition, PO, receipt or service sheet, invoice match, exception handling, supplier profile update, payment or reconciliation, and reporting. For AP-heavy buyers, add non-PO invoices, tax exceptions, credit memos, duplicate detection, approval delegation, and period-close evidence. For sourcing-heavy buyers, add complex award optimization, supplier alternates, risk criteria, ESG or diversity fields, and contracted-price validation. For payment-heavy buyers, add payment-status visibility, payment method controls, virtual-card or bank-rail assumptions where applicable, fraud signals, and reconciliation evidence.

## Commercial normalization
No numeric price, discount, or savings benchmark should be inferred from public pages. Coupa's public MSA states that order forms specify fees, billing period, subscription model, usage meters, and other commercial terms, which means commercial comparison belongs in the buyer quote and order-form evidence, not in a generic corpus profile. Normalize software subscription, modules, users, transaction volumes, supplier counts, payment usage, countries, support, implementation services, integrations, data migration, AI features, sandbox or environment needs, and renewal mechanics. Require a trace from the RFP scope to the final order form. If the value case depends on realized savings, early-pay discounts, fraud reduction, working-capital gains, or AP productivity, attach a measurement owner and a baseline rather than accepting vendor-published success language as buyer proof.

## Contract and control focus
Contracting should focus on module scope, subscription and usage metrics, support, service levels, implementation acceptance, data processing, customer-data ownership, aggregate/anonymized data use, AI governance, subprocessors, security evidence, privacy exhibits, export, deletion, transition assistance, and renewal controls. Coupa publishes trust and security materials referencing SOC, ISO, PCI, privacy, compliance, data residency, and AI trust posture; buyers should use those as evidence pathways while still requiring current reports, portal access, and internal review by security, privacy, audit, finance, and legal owners. For public companies, AP and payment workflows should be mapped to ICFR and audit expectations. For regulated or public-sector buyers, data location, supplier-risk, retention, accessibility, and procurement-law requirements need explicit review.

## Failure modes
The first failure mode is suite-scope sprawl: a narrow sourcing or AP decision expands into total spend management without an operating-model owner, supplier enablement plan, or ERP integration proof. The second is commercial ambiguity: a headline price hides module boundaries, usage meters, payment assumptions, supplier counts, support, AI features, implementation services, or renewal exposure. The third is supplier adoption optimism. Supplier self-service only creates value when critical suppliers can submit bids, profile updates, catalogs, service sheets, invoices, risk evidence, and payment details in the designed channel. The fourth is AI and benchmark overtrust. Coupa's AI and community-data positioning may be relevant, but sourcing teams should treat recommendations, benchmarks, and automation as hypotheses to validate against buyer data boundaries, process controls, and measurable outcomes.

The award is ready only when Coupa has proven the buyer's end-to-end process with real scenarios, the commercial model maps cleanly to usage and growth assumptions, the contract protects data and renewal leverage, and the implementation plan names the people accountable for supplier adoption, ERP integration, AP controls, payment workflows, and value realization.`,
  },
];
