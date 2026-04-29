import type { PatternSeed } from './seed-types';

const CATEGORY_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Scope and operating model',
    order: 1,
    description: 'Define the category boundary, business owner, system-of-record decision, integration footprint, and decision criteria before market contact.',
  },
  {
    id: 'MarketScan',
    label: 'Market scan and RFI',
    order: 2,
    description: 'Map credible vendors to the buyer context, separating suite fit, specialist fit, and implementation dependencies.',
  },
  {
    id: 'RFP',
    label: 'Scripted RFP and proof',
    order: 3,
    description: 'Require buyer-authored scenarios, evidence artifacts, and comparable pricing assumptions instead of generic demonstrations.',
  },
  {
    id: 'BAFO',
    label: 'Commercial normalization and BAFO',
    order: 4,
    description: 'Normalize licenses, modules, usage limits, services, support, renewal terms, exit terms, and risk transfer before final award.',
  },
  {
    id: 'Contracting',
    label: 'Contracting and mobilization',
    order: 5,
    description: 'Convert the selected solution into controlled contract terms, implementation gates, acceptance criteria, and transition commitments.',
  },
];

export const SOURCING_CATEGORY_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-CAT-CRM-001',
    slug: 'enterprise-crm-platform-sourcing-playbook',
    title: 'Enterprise CRM Platform Sourcing Playbook',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise CRM sourcing fails when the event treats CRM as a sales-seat subscription instead of a customer operating layer with data, integration, AI, renewal, and exit risk.',
    applicability:
      'Apply when sourcing or renewing enterprise CRM platforms for sales force automation, account and opportunity governance, forecasting, sales AI, CRM workflow, and cross-cloud customer data integration.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/en/documents/6747034',
      'https://www.salesforce.com/sales/pricing/',
      'https://www.microsoft.com/en-us/dynamics-365/products/sales/pricing',
      'https://www.sap.com/products/crm/sales-cloud.html',
      'https://www.zoho.com/crm/zohocrm-pricing.html',
      'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/',
      'https://www.microsoft.com/en-us/dynamics-365/business-applications/legal',
    ],
    regulatoryChips: ['GDPR', 'HIPAA-if-PHI', 'DORA-if-regulated-financial-entity'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Salesforce Sales Cloud',
        tier: 'enterprise',
        positioning: 'Enterprise CRM incumbent with broad ecosystem depth and public list-pricing anchors.',
        strengths: ['Large CRM ecosystem', 'Suite breadth', 'Public Sales Cloud packaging'],
        cautions: ['Module sprawl', 'Renewal leverage risk', 'AI and data add-on normalization required'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Salesforce Sales Pricing', url: 'https://www.salesforce.com/sales/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Dynamics 365 Sales',
        tier: 'enterprise',
        positioning: 'Enterprise CRM candidate strongest where Microsoft 365, Azure, Power Platform, or LinkedIn alignment matters.',
        strengths: ['Microsoft platform adjacency', 'Public pricing tiers', 'Copilot packaging visibility'],
        cautions: ['Integration fit still must be proven against buyer data and workflow scenarios'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Dynamics 365 Sales Pricing', url: 'https://www.microsoft.com/en-us/dynamics-365/products/sales/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'SAP Sales Cloud',
        tier: 'enterprise',
        positioning: 'Enterprise CRM candidate strongest where SAP ERP, field sales, guided selling, or retail execution alignment matters.',
        strengths: ['SAP estate alignment', 'Sales process and field execution positioning'],
        cautions: ['Numeric pricing should stay blank unless a quote or verified benchmark exists'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP Sales Cloud', url: 'https://www.sap.com/products/crm/sales-cloud.html', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public CRM list-price anchors only',
        model: 'subscription',
        metric: 'Named user by edition or package',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Salesforce Sales Pricing', url: 'https://www.salesforce.com/sales/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Dynamics 365 Sales Pricing', url: 'https://www.microsoft.com/en-us/dynamics-365/products/sales/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Zoho CRM Pricing', url: 'https://www.zoho.com/crm/zohocrm-pricing.html', asOf: '2026-04-29' },
        ],
        confidence: 0.72,
        notes: 'Use only as list-price orientation. Negotiated discount ranges, implementation multipliers, AI usage charges, storage, API, and renewal economics require buyer or quote evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Renewal and SKU control',
        buyerPosition: 'Cap renewal uplift, preserve downgrade and SKU-substitution rights, and define how new AI or consumption SKUs can be added.',
        walkawayTriggers: ['Uncapped renewal uplift', 'No clear treatment for replaced or renamed SKUs'],
      },
      {
        clauseArea: 'Customer data and AI use',
        buyerPosition: 'Define customer-data use boundaries, model-training opt-outs, subprocessors, data export, deletion, and transition assistance.',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Salesforce Trust and Compliance Documentation', url: 'https://www.salesforce.com/company/legal/trust-and-compliance-documentation/', asOf: '2026-04-29' },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Finalist pressure across suite vendors',
        whenToUse: 'Use at BAFO when Salesforce, Microsoft, SAP, Oracle, HubSpot, or Zoho alternatives remain credible.',
        buyerAsk: 'Trade term length or suite expansion only for price lock, renewal cap, data/AI protections, and exit assistance.',
        tradeoffs: ['A longer term can improve price but increases lock-in unless downsizing and transition rights are explicit.'],
      },
      {
        lever: 'Seat-role normalization',
        whenToUse: 'Use when vendor pricing mixes sellers, managers, admins, light users, add-ons, and AI usage into one headline number.',
        buyerAsk: 'Provide a normalized schedule for named users, restricted users, sandboxes, storage, API limits, AI credits, support, and optional modules.',
      },
    ],
    riskFactors: [
      {
        id: 'crm-data-model-lock-in',
        label: 'Customer data model lock-in',
        severity: 'high',
        detectionSignals: ['Account hierarchy, duplicate rules, territory model, or ERP handoff cannot be demonstrated with buyer scenarios.'],
        mitigations: ['Run scripted data scenarios before award', 'Require export and transition assistance terms'],
        contractualRemedies: ['Usable-format data export', 'Transition support', 'Deletion certification'],
      },
      {
        id: 'crm-ai-usage-ambiguity',
        label: 'AI usage and customer-data ambiguity',
        severity: 'medium',
        detectionSignals: ['Vendor cannot identify included AI features, usage limits, data training posture, or opt-out controls.'],
        mitigations: ['Require AI feature inventory and data-use exhibit before BAFO'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Raise privacy and BAA review if PHI can enter CRM records or integrations.',
        additionalRequirements: ['PHI boundary design', 'BAA availability review', 'Minimum-necessary data model'],
      },
      {
        industry: 'financial_services',
        modifier: 'Raise outsourcing, audit, resilience, data-location, and exit scrutiny for regulated entities.',
        regulatoryRefs: ['DORA where applicable to EU financial entities'],
      },
      {
        industry: 'manufacturing',
        modifier: 'Test dealer, distributor, CPQ, ERP order handoff, and installed-base hierarchy before award.',
        affectedStages: ['RFP', 'BAFO'],
      },
    ],
    body: `## Summary
Enterprise CRM is not a commodity sales-seat purchase. It becomes the operational layer for account hierarchy, opportunity governance, forecasting, activity history, pipeline inspection, seller workflow, and often service, marketing, quoting, analytics, and AI assistance. The sourcing event should therefore test whether the platform can carry the buyer's actual customer operating model, not whether a vendor demonstration can move an opportunity through clean stages.

Public market references support a broad competitive frame. Gartner's public Sales Force Automation material identifies a multi-vendor market, and public vendor pages show distinct packaging and contract postures across Salesforce, Microsoft Dynamics 365 Sales, SAP Sales Cloud, Oracle CX, HubSpot, Zoho, and specialist challengers. Use those sources as orientation, not as endorsement. AbarVa should not publish a best-vendor claim without a buyer-specific scorecard and evidence trail.

## When to apply
Use this pattern when CRM will become or remain the system of record for account, contact, opportunity, forecast, seller activity, territory, channel, or sales-AI workflow. It applies to new CRM selection, incumbent renewal, Salesforce-to-Dynamics or Dynamics-to-Salesforce replacement, post-merger consolidation, regional template rollout, and sales-platform rationalization. Do not use it as the primary pattern for sales engagement, call recording, CDP, contact-center case management, marketing automation, or BI unless the decision changes the CRM record model or commercial agreement.

## Category boundary
In scope: sales force automation, lead/account/contact/opportunity objects, activity capture, pipeline inspection, forecasting, territory management, quoting adjacency, CRM workflow, mobile sales, role-based dashboards, API and event integration, marketplace ecosystem, sandbox and deployment controls, security attestations, data export, AI seller assistance, and subscription terms for users, storage, API, support, and add-ons. Out of scope: standalone marketing automation, CDP identity resolution, customer support-only case management, revenue intelligence point tools, data enrichment, e-signature, and implementation services unless bundled into the platform award.

## Lifecycle and gates
The scope gate must name the customer system of record, required objects, integration map, regions, regulated data classes, reporting hierarchy, and executive decision owner. The market-scan gate should separate enterprise suites from mid-market tools and specialists. The RFP gate should require buyer-authored scripts: account merge, territory change, forecast override, approval workflow, quote handoff, data-quality exception, permission change, and downstream ERP sync. The BAFO gate should normalize seat types, storage, API limits, sandboxes, AI credits, support tier, premium security, CPQ or revenue modules, implementation partner assumptions, renewal caps, and exit rights. The contract gate should close data processing, subprocessor, data-location, audit, AI/customer-data, SLA, export, deletion, transition, and renewal language before award.

## Evaluation rubric
Weight functional and process fit around 25 percent, integration and data model around 20 percent, security/privacy/compliance around 15 percent, total cost and commercial protections around 15 percent, implementation and adoption risk around 10 percent, ecosystem and roadmap around 10 percent, and exit risk around 5 percent. Adjust the weights by industry. Healthcare raises privacy. Financial services raises resilience and audit. Manufacturing raises dealer, distributor, CPQ, and ERP fit. Retail and CPG raise field sales, store, promotion, and mobile execution.

## Pricing and contract notes
Use public pricing pages only as list-price anchors. Public pages can identify packaging and list structures for vendors such as Salesforce, Microsoft, and Zoho, but they do not prove enterprise net price, discount range, renewal uplift norm, AI consumption cost, storage growth, API overage, or implementation economics. Keep numeric benchmark fields blank unless AbarVa has buyer invoices, finalist proposals, reseller quotes, or approved benchmark data.

Contracting should focus on renewal uplift caps, SKU substitution and downsizing rights, data export, deletion certification, transition assistance, AI/model-training opt-out or restriction, subprocessor notice, data-location commitments, security attestation access, SLA/service credits, and implementation acceptance criteria. If PHI, regulated financial data, public-sector residency, or EU outsourcing rules are in scope, require legal review rather than relying on generic SaaS terms.

## Contradictions and failure modes
Vendor claim: native AI will improve seller productivity. Detection: require included features, usage limits, customer-data posture, opt-out controls, and buyer-measured adoption metrics. Vendor claim: implementation is straightforward. Detection: require account hierarchy migration, duplicate-management rules, ERP/CPQ integration plan, sandbox deployment process, and acceptance tests. Vendor claim: suite consolidation lowers cost. Detection: compare full TCO including unused seats, add-ons, support tier, storage/API growth, implementation services, and renewal-year pricing.

The common failure is choosing from an executive demo and discovering after award that the customer data model, territory rules, reporting hierarchy, or ERP handoff cannot support the real operating model. The second failure is negotiating subscription price while ignoring AI credits, storage, API limits, premium support, implementation partner cost, renewal escalators, and exit assistance. The third failure is accepting ecosystem breadth as accountability. If CPQ, data enrichment, e-signature, call recording, support, and marketing all sit in adjacent modules, the contract and implementation plan must define who owns each failure mode.`,
  },
  {
    id: 'PAT-SRC-CAT-ERP-001',
    slug: 'cloud-erp-financial-systems-sourcing',
    title: 'Cloud ERP and Financial Systems Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Cloud ERP sourcing is a finance-control decision before it is a software-selection decision; ledger design, ICFR evidence, integration debt, implementation accountability, and renewal economics must be evaluated together.',
    applicability:
      'Apply when sourcing a cloud ERP or financial management platform for general ledger, AP, AR, close, consolidation, procure-to-pay, order-to-cash, revenue, projects, expenses, or multi-entity financial operations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/cloud-erp-for-service-centric-enterprises',
      'https://www.oracle.com/erp/financials/',
      'https://www.microsoft.com/en-us/dynamics-365/products/finance',
      'https://www.workday.com/en-us/products/financial-management/overview.html',
      'https://learning.sap.com/products/financial-management/s4hana-cloud-public-finance',
      'https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201',
      'https://www.sec.gov/files/rules/final/33-8238_0.htm',
    ],
    regulatoryChips: ['SOX-if-public-company', 'ICFR', 'SOC-1', 'SOC-2', 'GDPR-if-EU-data'],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-010', 'PAT-SRC-CAT-CRM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'SAP Cloud ERP and SAP S/4HANA Cloud',
        tier: 'enterprise',
        positioning: 'Enterprise ERP candidate for broad finance and operating-model depth, especially in SAP-centered estates.',
        strengths: ['ERP depth', 'Finance process coverage', 'Large ecosystem'],
        cautions: ['Implementation and change complexity must be proven before award'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP S/4HANA Cloud finance learning material', url: 'https://learning.sap.com/products/financial-management/s4hana-cloud-public-finance', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Oracle Fusion Cloud ERP',
        tier: 'enterprise',
        positioning: 'Enterprise ERP candidate for financials, procurement, projects, risk, and reporting in Oracle-aligned estates.',
        strengths: ['Finance suite breadth', 'Oracle cloud ecosystem'],
        cautions: ['Numeric commercial benchmarks require quote or buyer evidence'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Oracle Fusion Cloud Financials', url: 'https://www.oracle.com/erp/financials/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Workday Financial Management',
        tier: 'enterprise',
        positioning: 'Finance platform candidate for service-centric organizations where finance and people data converge.',
        strengths: ['Finance and HCM adjacency', 'Service-centric operating fit'],
        cautions: ['Industry and localization fit must be validated against buyer entities and countries'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday Financial Management', url: 'https://www.workday.com/en-us/products/financial-management/overview.html', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Cloud ERP commercial model map',
        model: 'hybrid',
        metric: 'Modules, user roles, entities, environments, support, and services',
        sourceBasis: [
          { type: 'founder-data-gap', label: 'Numeric ERP subscription and implementation benchmarks require AbarVa-observed proposals or approved benchmark data' },
        ],
        confidence: 0.58,
        notes: 'Public sources support model structure, not reliable median pricing. Leave numeric ranges blank until buyer evidence exists.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Audit and control evidence',
        buyerPosition: 'Require SOC 1/SOC 2 access where relevant, audit-support obligations, control evidence retention, and close-period support commitments.',
        sourceBasis: [
          { type: 'regulatory-document', label: 'PCAOB AS 2201', url: 'https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201', asOf: '2026-04-29' },
        ],
      },
      {
        clauseArea: 'Implementation acceptance',
        buyerPosition: 'Tie milestones to accepted configurations, reconciled migrated balances, tested integrations, control evidence, and open-defect thresholds.',
      },
      {
        clauseArea: 'Exit and data rights',
        buyerPosition: 'Require usable-format data export, migration assistance, deletion certification, and transition support for financial records.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Entity and module phasing',
        whenToUse: 'Use when the vendor seeks enterprise-wide commitment before rollout risk is bounded.',
        buyerAsk: 'Link module/entity ramp to rollout milestones, implementation readiness, and renewal protection.',
      },
      {
        lever: 'Implementation accountability',
        whenToUse: 'Use when the software vendor and SI both influence success but neither owns end-to-end delivery risk.',
        buyerAsk: 'Document vendor, SI, and buyer obligations with acceptance criteria and remediation paths.',
      },
    ],
    riskFactors: [
      {
        id: 'erp-control-evidence-gap',
        label: 'Control evidence gap',
        severity: 'critical',
        detectionSignals: ['Vendor cannot demonstrate audit trails, role evidence, approval workflow history, or close-period control support.'],
        mitigations: ['Include finance controls and auditor review in RFP scripts', 'Require SOC and control documentation before contracting'],
        contractualRemedies: ['Audit assistance', 'Control evidence access', 'Close-period support commitments'],
      },
      {
        id: 'erp-data-reconciliation-failure',
        label: 'Data migration reconciliation failure',
        severity: 'high',
        detectionSignals: ['Opening balances, subledger details, legal entity mappings, or historical reporting needs are not reconciled before go-live.'],
        mitigations: ['Require migrated-balance reconciliation and parallel close readiness gates'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Raise control, audit, model-risk, regulatory reporting, resilience, and access-review requirements.',
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
      {
        industry: 'retail_cpg',
        modifier: 'Stress order-to-cash, inventory adjacency, tax, promotions, store feeds, and high-volume transaction handling.',
      },
      {
        industry: 'public_sector',
        modifier: 'Add fund accounting, procurement transparency, statutory reporting, residency, accessibility, and public-records review.',
      },
    ],
    body: `## Summary
Cloud ERP and financial systems sit on the transaction spine of the enterprise. The sourcing event should not be framed as a feature bake-off between finance applications. It should test whether the vendor, implementation partner, data model, contract, and control evidence can support the buyer's actual financial reporting environment. A weak ERP award can impair close, reporting, procurement, revenue recognition, access controls, audit evidence, and downstream analytics.

Public market definitions support a broad cloud-ERP frame covering financial management, order-to-cash, source-to-pay, related operations, SaaS delivery, mandatory updates, and vendor-managed infrastructure. That matters because cloud ERP behaves differently from ordinary SaaS. Mandatory updates, implementation partner dependency, data migration, audit evidence, and long renewal cycles can create operating risk long after signature.

## When to apply
Apply when the platform will become the system of record for general ledger, AP, AR, fixed assets, expenses, procurement, revenue, projects, close, consolidation, or multi-entity reporting. It is especially important for public companies, companies preparing for audit or IPO readiness, regulated entities, multi-country groups, acquisitive businesses, and finance organizations with material spreadsheet controls.

Do not use this as the primary pattern for a tax engine, EPM tool, AP automation platform, close specialist, procurement network, payroll system, or pure on-premise migration program. Those may co-apply, but they do not define this category unless the ERP or financial system of record changes.

## Category boundary
In scope: cloud ERP finance suites, cloud financial management platforms, core accounting systems, procure-to-pay and order-to-cash modules, entity and consolidation structures, audit trails, role-based access, approval workflows, reporting, integrations, sandboxes, implementation services, and support needed to make the platform operational. Out of scope: standalone BI, payroll-only systems, tax-only engines, EPM-only platforms, and pure migration factories unless they alter the finance control environment.

## Vendor landscape
Enterprise evaluations usually start with SAP, Oracle, Microsoft Dynamics 365 Finance, Workday Financial Management, and Infor. SAP and Oracle are natural candidates where complex ERP depth, broad operating models, and large ecosystems matter. Microsoft is strongest where Dynamics, Azure, Power Platform, and Microsoft 365 integration matter. Workday is strongest in service-centric organizations where finance and people data converge. Infor is relevant in industry-heavy estates. Mid-market evaluations often include NetSuite, Dynamics 365 Business Central, Sage Intacct, Acumatica, and Certinia; these should be tested for entity complexity, country coverage, audit evidence, and integration maturity rather than treated as interchangeable.

Specialists such as BlackLine, OneStream, Workiva, FloQast, and Tipalti can improve close, consolidation, reporting, controls, and payment workflows. In this pattern they are usually extensions, not replacements, unless the event explicitly changes a system-of-record function.

## Lifecycle and gates
The intake gate should document legal entities, countries, currencies, chart of accounts, material accounts, close calendar, SOX or ICFR exposure, audit needs, integrations, reporting obligations, and retained manual controls. The market-scan gate should map vendors against record-to-report, procure-to-pay, order-to-cash, projects, expenses, tax, close, consolidation, and reporting. The scripted RFP gate should run buyer-authored transactions with realistic controls: new entity setup, journal approval, vendor onboarding, invoice exception, revenue event, intercompany transaction, reporting change, access review, and close defect.

The BAFO gate should normalize modules, users, entities, sandboxes, storage, integrations, premium support, implementation partner fees, data migration, training, testing, and renewal terms. The contract gate should lock data export, audit evidence, SOC report access where relevant, DPA, subprocessor terms, SLA, exit assistance, renewal caps, license audit limits, implementation milestones, and acceptance criteria. Go-live readiness should require migrated-balance reconciliation, control test evidence, open-defect thresholds, close-period support, rollback planning, and hypercare staffing.

## Evaluation rubric
Weight functional fit around 25 percent, controls/security/audit evidence around 20 percent, data and integration architecture around 15 percent, implementation feasibility and partner quality around 15 percent, TCO and commercial protections around 15 percent, and roadmap/ecosystem around 10 percent. Adjust for industry. Financial services raises audit, resilience, access control, and regulatory reporting. Healthcare raises privacy, grant accounting, and cost-center complexity. Retail and CPG raise high-volume transaction, tax, promotion, and store integration. Manufacturing raises costing, plant integration, supply chain, and product-centric ERP depth.

## Pricing and contract notes
Do not publish invented ERP price ranges. Public sources can support pricing structures and product scope, but not reliable enterprise medians. Populate numeric benchmark fields only from buyer history, reseller quotes, negotiated proposals, or approved AbarVa evidence. Normalize subscription, module, role, entity, country, transaction, usage, sandbox, storage, integration, support, and implementation-service costs before comparing vendors.

Contract terms should protect finance operations: data ownership, usable export, deletion certification, audit evidence, SOC 1/SOC 2 access where relevant, ICFR support, close-period support, regulatory/localization updates, DPA/subprocessors, AI training-data restrictions where applicable, renewal caps, license audit limits, exit assistance, implementation SOW acceptance, defect remediation, and key-person staffing controls.

## Contradictions and failure modes
Vendor claim: single source of truth. Detection: critical finance data still depends on spreadsheets, data lake reconciliation, or specialist close tools. Vendor claim: standard process. Detection: localization, revenue recognition, approval, or reporting needs require material customization. Vendor claim: AI-assisted close. Detection: no buyer-specific evidence that outputs satisfy audit, control, and reviewer evidence requirements. Vendor claim: implementation is mostly configuration. Detection: chart-of-accounts redesign, data cleansing, integration remediation, and control redesign dominate the plan.

The common failure is not buying the wrong feature. It is buying a finance platform without proving the control model, data model, integration architecture, and implementation plan. Other failures include under-scoped SI effort, weak migration reconciliation, no auditor involvement until late design, hidden add-on modules, unbounded renewal economics, and treating mandatory cloud updates as operationally neutral.`,
  },
  {
    id: 'PAT-SRC-CAT-HCM-001',
    slug: 'human-capital-management-platform-sourcing',
    title: 'Human Capital Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'HCM sourcing decisions should be treated as workforce system-of-record decisions, not HR software purchases; payroll, worker data, talent, compliance, integration, and AI governance must be proven before award.',
    applicability:
      'Apply when selecting, replacing, consolidating, or renewing a cloud HCM suite covering core HR, payroll, workforce management, talent, benefits, analytics, employee experience, or HR AI workflows.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/cloud-hcm-suites-for-1000-employees',
      'https://www.workday.com/en-us/products/human-capital-management/overview.html',
      'https://www.oracle.com/human-capital-management/',
      'https://www.sap.com/products/hcm.html',
      'https://www.ukg.com/products/ukg-pro',
      'https://www.dayforce.com/',
      'https://www.dol.gov/general/topic/workhours/hoursrecordkeeping',
      'https://www.uniformguidelines.com/uniform-guidelines-qa.html',
      'https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act-first-regulation-on-artificial-intelligence',
    ],
    regulatoryChips: ['DOL-FLSA-recordkeeping', 'EEOC-selection-guidelines', 'EU-AI-Act-if-employment-AI', 'GDPR-if-EU-worker-data'],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-010', 'PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Workday Human Capital Management',
        tier: 'enterprise',
        positioning: 'Enterprise HCM suite candidate for integrated worker data, talent, planning, payroll adjacency, and people analytics.',
        strengths: ['Integrated HCM positioning', 'Workforce planning adjacency'],
        cautions: ['Payroll and localization fit must be proven by country and workforce type'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday HCM', url: 'https://www.workday.com/en-us/products/human-capital-management/overview.html', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Oracle Fusion Cloud HCM',
        tier: 'enterprise',
        positioning: 'Enterprise HCM candidate for HR, payroll, talent, workforce management, and Oracle cloud alignment.',
        strengths: ['Suite breadth', 'Oracle cloud adjacency'],
        cautions: ['Implementation, payroll scope, and AI governance need buyer-specific proof'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Oracle Human Capital Management', url: 'https://www.oracle.com/human-capital-management/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'UKG Pro and Dayforce',
        tier: 'enterprise',
        positioning: 'Enterprise HCM and workforce-management candidates where time, attendance, scheduling, payroll, and hourly workforce complexity carry heavy weight.',
        strengths: ['Workforce management emphasis', 'Payroll and time adjacency'],
        cautions: ['Global country coverage and suite breadth should be validated against buyer scope'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'UKG Pro', url: 'https://www.ukg.com/products/ukg-pro', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Dayforce', url: 'https://www.dayforce.com/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'HCM subscription and hybrid model structure',
        model: 'hybrid',
        metric: 'Employees, modules, countries, payroll populations, support, and services',
        sourceBasis: [
          { type: 'founder-data-gap', label: 'Numeric HCM price, discount, implementation, and renewal benchmarks require buyer invoices, proposals, or licensed benchmark data' },
        ],
        confidence: 0.55,
        notes: 'Hold all median pricing, implementation ratios, and renewal uplift norms until source-backed evidence exists.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Payroll remediation',
        buyerPosition: 'Define payroll error remediation, escalation, audit trail, service credits, and vendor/SI responsibilities for wage-impacting defects.',
      },
      {
        clauseArea: 'Worker data and AI governance',
        buyerPosition: 'Define employee data processing, residency, retention, AI feature use, human oversight, audit logs, and customer-data restrictions.',
        sourceBasis: [
          { type: 'regulatory-document', label: 'EU AI Act public explainer', url: 'https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act-first-regulation-on-artificial-intelligence', asOf: '2026-04-29' },
        ],
      },
      {
        clauseArea: 'Implementation acceptance',
        buyerPosition: 'Tie acceptance to data migration proof, integration tests, configured security roles, parallel payroll cycles, and country rollout readiness.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Country-by-country payroll sequencing',
        whenToUse: 'Use when payroll scope spans multiple countries, pay groups, unions, or hourly populations.',
        buyerAsk: 'Phase commitments and fees against proven country localization, parallel payroll success, and rollout readiness.',
      },
      {
        lever: 'Reference calls by workforce type',
        whenToUse: 'Use when the vendor claims broad HCM fit but buyer risk is concentrated in hourly, regulated, union, healthcare, retail, or public-sector workforces.',
        buyerAsk: 'Require references matching workforce type, country scope, payroll complexity, and implementation partner.',
      },
    ],
    riskFactors: [
      {
        id: 'hcm-payroll-error-risk',
        label: 'Payroll error risk',
        severity: 'critical',
        detectionSignals: ['Retro pay, leave, time, union, benefit, or tax scenarios are not proven in configured demos and parallel payroll plans.'],
        mitigations: ['Require country/pay-group scripts and parallel payroll exit criteria'],
        contractualRemedies: ['Payroll remediation obligations', 'Escalation path', 'Service credits for critical defects'],
      },
      {
        id: 'hcm-ai-employment-law-exposure',
        label: 'Employment AI exposure',
        severity: 'high',
        detectionSignals: ['AI features affect hiring, promotion, performance, scheduling, or worker management without explainability, oversight, and audit evidence.'],
        mitigations: ['Require AI feature inventory, intended-use review, legal review, and opt-out controls'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Raise shift, credential, union, leave, compliance, and workforce-management proof requirements.',
        affectedStages: ['Scope', 'RFP', 'Contracting'],
      },
      {
        industry: 'retail_cpg',
        modifier: 'Stress hourly scheduling, time-clock integrations, seasonal workforce, payroll accuracy, and manager self-service.',
      },
      {
        industry: 'public_sector',
        modifier: 'Add accessibility, public-records, residency, union, civil-service, and transparent procurement requirements.',
      },
    ],
    body: `## Summary
Human capital management platforms sit at the center of employee data, payroll, talent, time, benefits, workforce planning, workforce management, analytics, and employee experience. Treating this as an HR application purchase understates the risk. The durable sourcing decision must prove that the selected platform can support the buyer's workforce system of record, payroll model, employee data obligations, manager workflows, integrations, and AI governance posture.

The public market includes suites and platforms such as Workday Human Capital Management, Oracle Fusion Cloud HCM, SAP SuccessFactors HCM, UKG Pro, Dayforce, ADP Workforce Now or Lyric, and selected mid-market or regional systems. Public category pages and Gartner Peer Insights describe a broad cloud HCM market, but those materials do not replace buyer-specific proof. HCM fit depends heavily on workforce type, country scope, payroll operating model, implementation partner, and data quality.

## When to apply
Use this pattern when the sourcing decision changes the authoritative workforce record, payroll operating model, manager workflow, employee self-service layer, talent process, or HR analytics foundation. It is strongest for 1,000-plus employee environments, multi-country workforces, hourly or union populations, healthcare, retail, manufacturing, public sector, and enterprises with fragmented HRIS, payroll, time, and benefits systems.

Do not use this as the primary pattern for a standalone ATS, learning tool, engagement survey, VMS, benefits point solution, or payroll bureau unless the sourcing event explicitly evaluates those modules as part of the HCM system-of-record decision.

## Category boundary
In scope: core HR, employee master data, position management, organizational hierarchy, payroll, time and attendance, scheduling, benefits administration, talent, learning, performance, compensation, HR service delivery, workforce analytics, employee experience, security roles, integrations, mobile workflows, AI features, data processing, implementation services, and support. Out of scope: narrow point tools unless they alter the worker record or payroll/talent operating model.

## Vendor landscape
Workday, Oracle, SAP, UKG, Dayforce, and ADP are recurring enterprise candidates, but they are not interchangeable. Workday emphasizes integrated HCM and planning. Oracle emphasizes Fusion Cloud HCM breadth and Oracle estate alignment. SAP SuccessFactors ties HCM to SAP enterprise environments. UKG and Dayforce are especially relevant where workforce management, time, attendance, scheduling, and payroll complexity carry heavy weight. ADP remains material where payroll operations, tax administration, and managed payroll services matter. Mid-market tools such as Rippling, Paylocity, HiBob, and BambooHR may be credible for narrower scopes, but country coverage, enterprise controls, and payroll complexity need explicit testing.

## Lifecycle and gates
The scope gate should map worker populations, legal entities, countries, pay groups, unions, hourly/salaried mix, contingent-worker boundaries, benefit vendors, time-clock dependencies, finance/ERP integrations, identity integrations, reporting needs, works council needs, and employee-data retention obligations. The market-scan gate should separate enterprise suite fit, workforce-management strength, payroll country coverage, mid-market simplicity, and regional/local payroll overlay needs.

The RFP gate should use buyer-authored scripts: employee hire, transfer, termination, manager change, retroactive pay, leave event, time adjustment, union or shift rule, benefit life event, payroll exception, security-role change, report generation, data export, and downstream ERP sync. If AI features are included for recruiting, performance, skills, scheduling, or worker management, require documentation of intended use, human oversight, explainability, customer-data use, audit logs, opt-outs, and legal/regulatory mapping.

The BAFO gate should normalize employee counts, module scope, country payroll scope, implementation partner assumptions, integrations, support tiers, environments, data migration, testing, change management, training, renewal caps, and exit assistance. The contract gate should close the DPA, subprocessors, data residency, payroll remediation, service credits, implementation milestones, API/export rights, AI use restrictions, auditability, transition assistance, and renewal-uplift caps.

## Evaluation rubric
Weight functional fit around 25 to 30 percent, payroll and workforce-management fit around 15 to 25 percent where in scope, integration and data migration around 15 to 20 percent, implementation viability around 15 percent, security/privacy/compliance around 10 to 15 percent, commercial model around 10 to 15 percent, and exit risk around 5 to 10 percent. Adjust the weights by workforce. Healthcare, retail, manufacturing, utilities, and public sector often need heavier weighting for time, scheduling, payroll, labor rules, credentials, and compliance than for generic talent features.

## Pricing and contract notes
Hold all numeric pricing medians, discount ranges, implementation cost ratios, renewal uplift norms, and payroll outsourcing comparisons until buyer invoices, finalist proposals, or approved benchmarks exist. Public vendor pages can support scope and packaging, not reliable enterprise net price.

Contracting should be stricter than ordinary SaaS because payroll and worker records affect wages, taxes, statutory records, employee trust, and regulated employment decisions. U.S. buyers should map wage/hour recordkeeping needs to Department of Labor guidance. Selection processes should account for EEOC Uniform Guidelines where hiring or promotion tools may create adverse impact. EU deployments involving AI for employment or worker management require separate AI Act review by intended use and jurisdiction.

## Contradictions and failure modes
Vendor claim: the suite is unified. Detection: require an end-to-end workflow crossing core HR, payroll, time, security roles, reporting, and downstream finance without manual rekeying. Vendor claim: implementation is standard. Detection: require country/pay-group rollout plan, integration count, data-cleaning assumptions, parallel payroll cycles, and named partner staffing. Vendor claim: AI is governed. Detection: require intended-use documentation, oversight, explainability, model/data controls, logs, and customer opt-outs.

The highest-risk failure mode is treating payroll as just another module. The second is letting HR own the event without payroll, IT, finance, legal, security, works council, and frontline operations. The third is accepting generic AI assurances for hiring, performance, scheduling, or worker-management features without regulatory and bias-control review.`,
  },
  {
    id: 'PAT-SRC-CAT-ITSM-001',
    slug: 'it-service-management-platform-sourcing',
    title: 'IT Service Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'ITSM sourcing should be treated as an operating-model and workflow-platform decision, not a help-desk tool buy; process depth, CMDB maturity, AI support, integration, security, and implementation burden must be proven together.',
    applicability:
      'Apply when sourcing, replacing, consolidating, or renegotiating ITSM, ESM, service desk, IT help desk, incident/problem/change, CMDB, asset, or AI service-agent platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.servicenow.com/products/itsm/pricing.html',
      'https://www.atlassian.com/collections/service/pricing',
      'https://www.freshworks.com/freshservice/pricing/',
      'https://www.helixops.ai/products/bmc-helix-itsm.html',
      'https://www.ivanti.com/products/ivanti-neurons-itsm',
      'https://www.manageengine.com/products/service-desk/pricing.html',
      'https://www.iso.org/publication/PUB100441.html',
      'https://www.servicenow.com/company/trust.html',
      'https://www.atlassian.com/trust',
    ],
    regulatoryChips: ['ISO-IEC-20000', 'SOC-2-if-available', 'GDPR-if-EU-employee-data'],
    relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-HCM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'ServiceNow IT Service Management',
        tier: 'enterprise',
        positioning: 'Enterprise workflow platform candidate for ITSM, service catalog, incident, problem, change, CMDB, virtual agent, analytics, and AI-enabled operations.',
        strengths: ['Enterprise workflow breadth', 'Service management ecosystem', 'Public product packaging visibility'],
        cautions: ['Custom quote and add-on normalization required before commercial comparison'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow ITSM Pricing', url: 'https://www.servicenow.com/products/itsm/pricing.html', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Atlassian Jira Service Management',
        tier: 'enterprise',
        positioning: 'Service management candidate strongest where Jira, Confluence, DevOps, incident, and collaboration workflows are strategic.',
        strengths: ['Developer and collaboration adjacency', 'Public service collection pricing page', 'Knowledge and incident workflow ecosystem'],
        cautions: ['Enterprise security, assets, AI, and premium support entitlements must be package-verified'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Atlassian Service Collection Pricing', url: 'https://www.atlassian.com/collections/service/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Freshservice, BMC Helix ITSM, Ivanti Neurons for ITSM, and ManageEngine ServiceDesk Plus',
        tier: 'mid-market',
        positioning: 'Alternative suites for mid-market, enterprise, or IT operations contexts where ticketing, asset, change, service catalog, or AI-service features must be tested against scale and governance needs.',
        strengths: ['Visible public product scope', 'Multiple deployment and package options'],
        cautions: ['CMDB maturity, security posture, AI entitlements, and implementation partner fit vary by package and buyer scale'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'ITSM public pricing and quote anchors',
        model: 'subscription',
        metric: 'Agent, technician, requester, asset, AI, support, or enterprise quote structure',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Atlassian Service Collection Pricing', url: 'https://www.atlassian.com/collections/service/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Freshservice Pricing', url: 'https://www.freshworks.com/freshservice/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ManageEngine ServiceDesk Plus Pricing', url: 'https://www.manageengine.com/products/service-desk/pricing.html', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise net pricing, discount bands, implementation services, and AI usage pricing require buyer quote evidence' },
        ],
        confidence: 0.62,
        notes: 'Use current vendor pricing pages as dated evidence only. Do not embed durable numeric pricing without event-time verification.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Service and support continuity',
        buyerPosition: 'Define uptime, support response, major incident escalation, data backup, disaster recovery, export, and transition assistance obligations.',
      },
      {
        clauseArea: 'Security and AI data handling',
        buyerPosition: 'Require security attestations, DPA, subprocessor transparency, identity controls, audit logs, AI usage boundaries, and customer-data handling terms.',
      },
      {
        clauseArea: 'Implementation acceptance',
        buyerPosition: 'Tie acceptance to configured service catalog, incident/problem/change workflows, CMDB/asset scope, integrations, SLA reporting, and migration proof.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Agent and requester normalization',
        whenToUse: 'Use when vendors price agents, technicians, requesters, assets, AI, support, and environments differently.',
        buyerAsk: 'Provide a normalized commercial sheet for named agents, light agents, requesters, assets, AI usage, premium support, environments, and implementation services.',
      },
      {
        lever: 'CMDB scope boundary',
        whenToUse: 'Use when the business case assumes CMDB or asset-management maturity but ownership and data quality are unclear.',
        buyerAsk: 'Separate base ITSM scope from CMDB discovery, relationship modeling, data cleansing, and ongoing ownership obligations.',
      },
    ],
    riskFactors: [
      {
        id: 'itsm-cmdb-overreach',
        label: 'CMDB overreach',
        severity: 'high',
        detectionSignals: ['Vendor demo assumes clean configuration data, but buyer lacks owners, reconciliation rules, or discovery scope.'],
        mitigations: ['Define CMDB scope and ownership before BAFO', 'Use phased implementation gates for assets and relationships'],
      },
      {
        id: 'itsm-ai-deflection-overclaim',
        label: 'AI deflection overclaim',
        severity: 'medium',
        detectionSignals: ['Vendor promises ticket reduction without buyer baselines, entitlement detail, data controls, or human escalation rules.'],
        mitigations: ['Require usage limits, training/data posture, escalation design, and measured pilot criteria'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Raise audit, resilience, access-control, incident-evidence, and data-location requirements for regulated operations.',
      },
      {
        industry: 'healthcare',
        modifier: 'Stress clinical operations impact, PHI boundaries, device/asset dependencies, and critical incident escalation.',
      },
      {
        industry: 'public_sector',
        modifier: 'Add accessibility, procurement transparency, residency, records retention, and security attestation review.',
      },
    ],
    body: `## Summary
IT service management platforms manage the intake, workflow, resolution, governance, and reporting of IT services. The sourcing question is not which ticketing tool is cheapest. It is whether the platform can support the buyer's service operating model across incidents, service requests, problems, changes, assets, configuration data, knowledge, automation, AI assistance, and cross-functional service delivery.

Public ISO material frames IT service management as a management system for services in changing environments and references integration with methods and frameworks such as Agile, Lean, DevOps, ITIL, COBIT, and ISO 27001. That makes ITSM sourcing especially sensitive to process fit and governance maturity. A buyer can select a well-known platform and still fail if service catalog ownership, CMDB scope, change controls, SLA data, and implementation responsibilities are unclear.

## When to apply
Use this pattern when sourcing, replacing, consolidating, or renegotiating ITSM, ESM, service desk, IT help desk, incident, problem, change, service catalog, asset, CMDB, IT operations workflow, or AI service-agent platforms. Do not use it as the primary pattern for endpoint management, observability-only platforms, MSP PSA tooling, IT outsourcing, or customer-support CRM unless ITSM process ownership is the core sourcing decision.

## Category boundary
In scope: incident management, service request management, problem management, change enablement, knowledge management, service catalog, asset management, CMDB, self-service portal, virtual agent or AI agent, SLA reporting, workflow automation, analytics, integrations, identity, security, implementation, migration, and support. Out of scope: endpoint-only management, monitoring-only tools, PSA tools for managed service providers, customer support case management, and outsourced service desk labor unless the platform contract bundles them.

## Vendor landscape
Enterprise workflow evaluations often include ServiceNow IT Service Management. Collaboration and DevOps-adjacent evaluations often include Atlassian Jira Service Management. Mid-market and enterprise alternatives can include Freshservice, BMC Helix ITSM, Ivanti Neurons for ITSM, and ManageEngine ServiceDesk Plus. Public vendor pages show different packaging around incident, request, change, problem, knowledge, assets, service catalog, CMDB, AI, analytics, and support. Treat those pages as scope evidence, not as proof that the quoted package includes every capability.

## Lifecycle and gates
The scope gate should collect ticket volume by type and priority, current agent count, requester population, service catalog inventory, SLA targets and actuals, asset and CMDB scope, integrations, identity requirements, data residency needs, and migration timeline. The market-scan gate should separate enterprise workflow breadth, DevOps integration, mid-market simplicity, and IT operations depth.

The RFP gate should require demos for incident-to-problem flow, major incident process, service catalog creation, change risk workflow, CMDB relationship model, asset lifecycle, SLA breach reporting, AI self-service, Teams or Slack intake, monitoring integration, identity integration, audit logs, sandbox/release management, and export/exit capability. The BAFO gate should normalize agents, technicians, requesters, assets, AI conversations or resolutions, premium security, support tier, environments, marketplace apps, integrations, implementation services, and migration effort. The contract gate should close security, DPA, subprocessors, data residency, support response, incident notification, backup, DR, audit, AI data handling, export, and transition terms.

## Evaluation rubric
Weight process depth around 25 percent, CMDB and asset maturity around 15 percent, AI/self-service and knowledge around 15 percent, integration ecosystem around 15 percent, security/trust/compliance around 10 percent, implementation complexity around 10 percent, reporting/SLA controls around 5 percent, and commercial model around 5 percent. Increase security and audit weight for regulated environments. Increase integration and incident weight for DevOps-heavy or high-availability operations.

## Pricing and contract notes
Pricing must be normalized by agents, technicians, requesters, assets, nodes, AI conversations, premium security add-ons, sandboxes, non-production environments, implementation services, marketplace apps, integrations, support tier, and overages. Some vendors publish public pricing tiers; others require custom quotes. Do not embed durable numeric pricing in the corpus. Capture public pages as dated evidence and mark enterprise net pricing, discount bands, implementation partner cost, AI usage pricing, and renewal uplifts as founder-data-gap until verified.

Contracting should protect operational continuity. Require service availability commitments, support response definitions, major incident escalation, data export, transition assistance, backup and disaster recovery, security attestations, identity controls, audit logs, data processing terms, AI data-handling restrictions, subprocessor transparency, and implementation acceptance criteria.

## Contradictions and failure modes
Vendor claim: AI will deflect tickets. Detection: require current ticket baselines, in-scope topics, usage entitlements, escalation paths, human review, training/data posture, and measured pilot criteria. Vendor claim: CMDB is included. Detection: require asset discovery scope, relationship model, data owners, reconciliation rules, and ongoing maintenance process. Vendor claim: ITIL or ISO alignment is enough. Detection: require buyer-specific process mapping, workflow evidence, and administrator operating model.

The common failure is buying a service desk tool and discovering that the hard work was service operating-model design. The second failure is underestimating migration: workflows, request types, queues, automations, SLAs, knowledge articles, asset records, CMDB relationships, integrations, identity groups, reports, and historical tickets. The third failure is accepting low headline license price while excluding AI, assets, security, premium support, environments, or implementation effort from the comparison.`,
  },
  {
    id: 'PAT-SRC-CAT-EPM-001',
    slug: 'enterprise-performance-management-fpa-platform-sourcing',
    title: 'Enterprise Performance Management and FP&A Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'EPM and FP&A platform sourcing is finance operating-model transformation, not a software comparison; model complexity, integration burden, Excel dependency, consolidation scope, ownership capacity, and commercial terms must be evaluated together.',
    applicability:
      'Apply when sourcing or replacing planning, budgeting, forecasting, scenario modeling, consolidation, close, reporting, xP&A, or enterprise performance management software.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/financial-planning-software',
      'https://www.workday.com/en-us/products/adaptive-planning/pricing.html',
      'https://www.oracle.com/performance-management',
      'https://www.anaplan.com/solutions/enterprise-management-platform-epm',
      'https://www.onestream.com/platform/',
      'https://www.sap.com/products/data-cloud/cloud-analytics/pricing.html',
      'https://www.board.com/pricing',
      'https://planful.com/official-planful-company-information/',
      'https://www.prophix.com/platform-overview-2-3/',
    ],
    regulatoryChips: ['SOX-if-public-company', 'SOC-1-if-control-relevant', 'SOC-2-if-cloud-service', 'GDPR-if-EU-data'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-003', 'PAT-SRC-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Anaplan',
        tier: 'enterprise',
        positioning: 'Connected planning platform candidate for finance, sales, supply chain, workforce, and scenario modeling use cases.',
        strengths: ['Connected planning orientation', 'Scenario and model-building positioning'],
        cautions: ['Finance ownership capacity and model administration burden must be tested'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Anaplan EPM', url: 'https://www.anaplan.com/solutions/enterprise-management-platform-epm', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Workday Adaptive Planning',
        tier: 'enterprise',
        positioning: 'Planning platform candidate for budgeting, forecasting, what-if scenarios, and Workday ecosystem alignment.',
        strengths: ['Planning workflow positioning', 'Public pricing page confirms quote-based pricing posture'],
        cautions: ['Numeric pricing and implementation economics require quote evidence'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday Adaptive Planning Pricing', url: 'https://www.workday.com/en-us/products/adaptive-planning/pricing.html', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Oracle Fusion Cloud EPM, OneStream, SAP Analytics Cloud Planning, Pigment, Planful, Board, Vena, and Prophix',
        tier: 'enterprise',
        positioning: 'Suite, unified-finance, connected-planning, Excel-native, and mid-market alternatives that should be segmented by use case rather than ranked generically.',
        cautions: ['Vendor AI, consolidation, close, and pricing claims require event-time proof and contract exhibits'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'EPM/FP&A quote-based commercial model',
        model: 'hybrid',
        metric: 'User roles, modules, models, entities, integrations, capacity, environments, support, AI, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday Adaptive Planning Pricing', url: 'https://www.workday.com/en-us/products/adaptive-planning/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Board Pricing', url: 'https://www.board.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Numeric pricing, discount, implementation, and renewal benchmarks require current quote or buyer contract evidence' },
        ],
        confidence: 0.57,
        notes: 'Most enterprise EPM pricing is quote-based or capacity/package-specific. Do not use third-party ranges without approval.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Financial model and data ownership',
        buyerPosition: 'Require export rights for models, metadata, dimensions, hierarchies, scenarios, reports, audit logs, and source-data mappings.',
      },
      {
        clauseArea: 'Security and audit controls',
        buyerPosition: 'Require SSO, RBAC, audit trails, DPA, subprocessors, data residency, SOC evidence where relevant, and AI data-use terms.',
      },
      {
        clauseArea: 'Implementation acceptance',
        buyerPosition: 'Tie acceptance to configured planning models, reconciled actuals, integrations, workflow approvals, report packages, and administrator enablement.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Use-case phasing',
        whenToUse: 'Use when vendor scope bundles corporate FP&A, workforce, revenue, supply chain, close, and consolidation before data readiness is proven.',
        buyerAsk: 'Phase modules and fees by validated use case, integration readiness, and model-owner capacity.',
      },
      {
        lever: 'Implementation partner accountability',
        whenToUse: 'Use when platform success depends on model build, data integration, and finance process redesign.',
        buyerAsk: 'Name SI responsibilities, acceptance criteria, defects, admin training, and remediation rights in the SOW.',
      },
    ],
    riskFactors: [
      {
        id: 'epm-model-admin-gap',
        label: 'Finance model administration gap',
        severity: 'high',
        detectionSignals: ['Vendor assumes finance-owned model agility, but buyer lacks platform admins, data owners, or governance cadence.'],
        mitigations: ['Require operating model and admin enablement plan before award'],
      },
      {
        id: 'epm-integration-underestimate',
        label: 'Integration and actuals reconciliation underestimate',
        severity: 'high',
        detectionSignals: ['ERP, GL, HRIS, CRM, warehouse, or consolidation feeds are not mapped to model dimensions and refresh cadence.'],
        mitigations: ['Require source-system inventory, sample loads, reconciliation gates, and data-owner signoff'],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier: 'Stress store, channel, promo, SKU, labor, and demand-driver planning requirements.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Raise product, plant, supply, cost, capacity, and scenario-model complexity.',
      },
      {
        industry: 'financial_services',
        modifier: 'Raise auditability, access control, regulatory reporting, model risk, and close/consolidation evidence.',
      },
    ],
    body: `## Summary
Enterprise performance management and FP&A platforms sit between finance process, enterprise data, and executive decision-making. The buyer is not simply selecting budget software. It is deciding how finance will collect assumptions, govern versions, model business drivers, integrate operational data, publish reporting, support scenario analysis, and accelerate decision cycles. Treating this as a feature checklist hides the operating-model work that determines whether the platform succeeds.

Public category pages define financial planning software around planning, budgeting, forecasting, role-based security, cloud delivery, reporting, analysis, and user-driven models. That framing is useful because it forces the sourcing event to ask what finance will own after implementation. A flexible planning platform can create speed, but only if data ownership, model governance, integration cadence, and administrator capacity are real.

## When to apply
Use this pattern when sourcing or replacing planning, budgeting, forecasting, scenario modeling, consolidation, close, reporting, xP&A, or enterprise performance management software. Do not use it for pure ERP selection, BI-only reporting, spreadsheet cleanup without platform intent, or narrow departmental planning with no enterprise workflow, security, integration, or governance requirements.

## Category boundary
In scope: corporate budgeting, rolling forecast, driver-based planning, scenario modeling, workforce planning, revenue planning, opex and capex planning, management reporting, close and consolidation where included, workflow approvals, versioning, data integration, security, audit trails, AI-assisted forecasting or planning, implementation services, and support. Out of scope: ERP system of record, BI visualization alone, tax, treasury, and standalone data warehouse work unless they are part of the planning or consolidation operating model.

## Vendor landscape
Representative vendors include Anaplan, Workday Adaptive Planning, Oracle Fusion Cloud EPM, OneStream, SAP Analytics Cloud Planning, Pigment, Planful, Board, Vena, and Prophix. These vendors should not be treated as interchangeable. Some emphasize connected planning across functions. Some emphasize finance-owned planning. Some emphasize close and consolidation. Some emphasize Excel-native adoption. Some emphasize suite alignment with ERP or HCM. The sourcing team should state whether the priority is corporate FP&A modernization, connected planning, close/consolidation control, cross-functional xP&A, or adoption speed.

## Lifecycle and gates
The scope gate should document planning use cases, current model inventory, chart of accounts, entity hierarchy, cost centers, planning cycles, actuals sources, HR/workforce sources, revenue drivers, approval workflows, report packages, user roles, security requirements, and whether close or consolidation is in scope. If consolidation is included, require currency, intercompany, ownership, eliminations, journal, close-calendar, and audit requirements. If xP&A is included, require operational-driver definitions and accountable data owners outside finance.

The RFP gate should separate software subscription, implementation, integrations, training, sandbox, support, premium support, AI add-ons, storage or capacity, and partner services. The demo gate should require scripted model-build and reporting scenarios using the buyer's actual planning logic, not generic dashboards. The BAFO gate should normalize pricing, implementation assumptions, service levels, support terms, renewal caps, data export, exit rights, and AI/data-use terms. The award gate should name the internal platform owner and implementation partner accountability model.

## Evaluation rubric
Weight functional fit around 25 percent, modeling and scalability around 15 percent, integration and data management around 15 percent, usability and finance ownership around 15 percent, security/audit/controls around 10 percent, implementation partner ecosystem around 10 percent, and commercial model and contract flexibility around 10 percent. Increase security and audit weight for public-company or regulated reporting. Increase integration weight for global operating models or complex ERP, HRIS, CRM, and warehouse dependencies.

## Pricing and contract notes
Most enterprise FP&A and EPM vendors do not publish simple numeric pricing. Public sources often show quote-based pricing, request-pricing workflows, or purchasing paths rather than reliable per-user enterprise rates. Numeric pricing fields should remain blank and marked founder-data-gap unless the buyer supplies quotes, current official price lists, or contract evidence. Commercial comparison should normalize user roles, modules, entities, environments, implementation services, integrations, storage or capacity, AI features, support tiers, and renewal escalation.

Contracting should protect model and data portability. Require export rights for models, dimensions, hierarchies, metadata, scenarios, reports, audit logs, and source-data mappings. Require SSO, RBAC, audit trails, DPA, subprocessors, data residency, SOC evidence where relevant, AI data-use language, implementation acceptance, defect remediation, training, administrator enablement, and transition assistance.

## Contradictions and failure modes
Vendor claim: finance will own the model. Detection: require evidence that finance users can maintain dimensions, drivers, reports, workflows, and scenarios without constant SI dependency. Vendor claim: AI forecasting improves accuracy. Detection: require buyer-specific baselines, explainability, permissions inheritance, data lineage, and forecast-quality measurement. Vendor claim: connected planning is ready. Detection: require operational data owners, source-system mappings, refresh cadence, and reconciliation controls.

The common failure is buying a powerful modeling platform without the finance ownership capacity to operate it. The second failure is underestimating integration and actuals reconciliation. The third failure is treating Excel coexistence as either inherently good or inherently bad instead of testing the buyer's operating model. The fourth failure is letting close/consolidation, planning, and BI requirements blur until the selected platform is asked to be everything without clear ownership.`,
  },
  {
    id: 'PAT-SRC-CAT-CMS-001',
    slug: 'cms-headless-content-platform-sourcing',
    title: 'CMS and Headless Content Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'CMS sourcing should be treated as a content operating-model decision, not just a publishing-platform selection; authoring, structured content, governance, accessibility, security, migration, and integration ownership determine the durable fit.',
    applicability:
      'Apply when sourcing a legacy CMS, WCM, DXP, headless CMS, hybrid-headless CMS, composable content platform, website publishing platform, or multi-channel content system.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.forrester.com/report/the-forrester-wave-tm-content-management-systems-q1-2025/RES182086',
      'https://www.gartner.com/reviews/market/web-content-management',
      'https://www.contentful.com/pricing/',
      'https://www.contentful.com/composable-content/',
      'https://www.sanity.io/pricing?product=service',
      'https://www.storyblok.com/pricing/',
      'https://strapi.io/pricing-cms',
      'https://hygraph.com/pricing',
      'https://www.w3.org/WAI/standards-guidelines/atag/',
    ],
    regulatoryChips: ['WCAG-context', 'ATAG', 'GDPR-if-personal-data', 'SOC-2-if-available'],
    relatedPatternIds: ['PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-MA-001', 'PAT-SRC-CAT-CSP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'customer_facing',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Contentful, Sanity, Storyblok, Strapi, Hygraph, and Contentstack',
        tier: 'specialist',
        positioning: 'Headless, hybrid-headless, and composable CMS candidates for structured content, API delivery, developer extensibility, and omnichannel reuse.',
        strengths: ['Structured content orientation', 'API delivery', 'Composable architecture options'],
        cautions: ['Editor usability, preview, governance, accessibility, and integration ownership must be proven'],
      },
      {
        vendorName: 'Adobe Experience Manager, Optimizely, Acquia, Sitecore, and Kentico/Kontent.ai',
        tier: 'enterprise',
        positioning: 'Enterprise CMS, WCM, or DXP candidates where page management, personalization, DAM, workflow, analytics, or ecosystem support matter.',
        cautions: ['Suite breadth can obscure implementation, migration, and total-cost ownership'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'CMS public pricing and enterprise quote model',
        model: 'hybrid',
        metric: 'Seats, spaces/projects/datasets, locales, environments, API calls, bandwidth, assets, workflows, SSO, audit logs, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Contentful Pricing', url: 'https://www.contentful.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Sanity Pricing', url: 'https://www.sanity.io/pricing?product=service', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Storyblok Pricing', url: 'https://www.storyblok.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise price, discount, overage, migration, and support benchmarks require current quote or contract evidence' },
        ],
        confidence: 0.60,
        notes: 'Public tiers change and enterprise pricing is often custom. Verify current pricing at event time.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Content portability and exit',
        buyerPosition: 'Require export of content, schemas, references, assets, metadata, locales, workflows, and audit history in usable formats.',
      },
      {
        clauseArea: 'Security and access governance',
        buyerPosition: 'Require SSO/SAML, SCIM where needed, role granularity, audit logs, DPA, subprocessors, data residency, backup/restore, and API token controls.',
      },
      {
        clauseArea: 'Accessibility governance',
        buyerPosition: 'Require evidence of authoring support for accessibility checks, alt text, headings, labels, preview, and governance workflows without claiming legal compliance absent buyer review.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Usage-unit normalization',
        whenToUse: 'Use when vendors price seats, API calls, bandwidth, assets, locales, environments, workflows, SSO, or support differently.',
        buyerAsk: 'Provide a normalized usage schedule with overage terms, alerts, caps, and enterprise support assumptions.',
      },
      {
        lever: 'Migration proof before award',
        whenToUse: 'Use when legacy content, SEO, localization, assets, or page templates are material to launch risk.',
        buyerAsk: 'Require sample export/import, content model mapping, redirect strategy, rollback plan, and implementation partner acceptance criteria.',
      },
    ],
    riskFactors: [
      {
        id: 'cms-editor-experience-gap',
        label: 'Editor experience gap',
        severity: 'high',
        detectionSignals: ['Architecture demo is strong, but marketers cannot author, preview, approve, localize, or publish without developer help.'],
        mitigations: ['Run hands-on marketer demo and authoring sandbox before award'],
      },
      {
        id: 'cms-content-model-lock-in',
        label: 'Content model lock-in',
        severity: 'medium',
        detectionSignals: ['Content types, references, locales, and schema migrations are hard to export or evolve.'],
        mitigations: ['Require portability proof, schema migration plan, and exit clauses'],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier: 'Stress commerce integration, product content, promotions, localization, campaigns, and high-volume asset workflows.',
      },
      {
        industry: 'healthcare',
        modifier: 'Raise review workflows, accessibility, medical/legal/regulatory approval, privacy, and claim-governance controls.',
      },
      {
        industry: 'financial_services',
        modifier: 'Add regulated-content approval, audit trail, record retention, accessibility, data residency, and security review.',
      },
    ],
    body: `## Summary
CMS selection is no longer only about editing web pages. Modern buyers often need structured content that can be reused across websites, apps, commerce experiences, support portals, documentation, personalization engines, and AI-assisted workflows. The sourcing team should separate a website publishing problem from a governed content-platform problem before engaging vendors.

Public analyst and peer-review pages confirm CMS and web content management as active vendor-selection categories, while vendor materials show a spectrum from enterprise DXP suites to headless, hybrid-headless, composable, and self-hosted platforms. Use those sources for category orientation only. The winning platform depends on marketer authoring, developer extensibility, content modeling, governance, accessibility, security, migration, and integration ownership.

## When to apply
Use this pattern when replacing or consolidating a CMS, WCM, DXP, website publishing platform, headless CMS, hybrid-headless CMS, or composable content platform. It applies to multi-brand, multi-locale, multi-channel, ecommerce, mobile, portal, documentation, and public-site content decisions. Do not use it as the primary pattern for DAM, CDP, marketing automation, product information management, or ecommerce platform selection unless the CMS is the system of record for content operations.

## Category boundary
In scope: content modeling, structured content, page authoring, visual editing, preview, workflow approvals, localization, versioning, publishing, API delivery, webhooks, roles and permissions, SSO, audit logs, asset handling, CDN and bandwidth limits, environments, migration tooling, accessibility support, security, implementation partner scope, and support. Out of scope: pure front-end framework selection, DAM-only storage, personalization engine only, analytics only, or commerce engine selection unless CMS governance is central.

## Vendor landscape
Native headless and composable evaluations may include Contentful, Sanity, Storyblok, Strapi, Hygraph, Contentstack, and similar vendors. Enterprise CMS and DXP evaluations may include Adobe Experience Manager, Optimizely, Acquia, Sitecore, Kentico/Kontent.ai, and related suites. Open-source or self-hosted products can fit buyers that value control and extensibility, but they shift hosting, upgrades, security, backup, and support obligations onto the buyer. The market scan should segment platforms by authoring model, API model, hosting model, governance depth, and operational burden rather than treating headless or composable as inherently better.

## Lifecycle and gates
The scope gate should document content types, brands, locales, sites, channels, author populations, approval workflows, accessibility needs, personalization needs, SEO needs, integrations, asset flows, migration inventory, front-end ownership, and launch timeline. The RFP gate should require vendors to prove content modeling, authoring, preview, governance, localization, workflow, API delivery, security, and migration against buyer-owned scenarios.

A strong demo includes both a marketer path and a developer path: create a content type, author localized content, preview it in context, route it through approval, publish it through an API, roll it back, inspect permissions, manage an asset, and export or migrate content. The BAFO gate should normalize users, spaces, projects, datasets, environments, locales, API calls, bandwidth, assets, workflows, SSO, audit logs, support SLAs, overages, migration services, and implementation partner scope. The contract gate should close portability, data processing, security, accessibility support, uptime, support, backup, export, and transition language.

## Evaluation rubric
Weight content modeling and governance around 20 percent, editor experience around 20 percent, developer/API model around 15 percent, localization and workflow around 10 percent, migration and implementation around 15 percent, security/access/audit around 10 percent, accessibility support around 5 percent, and commercial model around 5 percent. Increase accessibility and approval weight for healthcare, financial services, public sector, education, and regulated content. Increase performance, localization, and asset workflow weight for retail, CPG, commerce, media, and global brand estates.

## Pricing and contract notes
Public vendor pricing varies in transparency. Some vendors list self-service tiers and usage limits; enterprise pricing is often custom. Numeric fields should stay blank or marked founder-data-gap until verified from current official pricing pages, quote responses, or signed contracts. The pricing worksheet should normalize seats, API requests, CDN bandwidth, asset storage and traffic, locales, environments, spaces, projects, datasets, webhooks, workflows, SSO, audit logs, support SLAs, professional services, migration, and overages.

Contracting should protect portability and governance. Require export of content, schemas, references, assets, metadata, locales, workflow state, and audit history in usable formats. Require DPA, subprocessors, data residency, SSO/SAML, SCIM if needed, role granularity, audit logs, backup/restore, incident notification, least-privilege API token controls, uptime, support, transition assistance, and documented overage terms.

## Contradictions and failure modes
Vendor claim: composable architecture creates flexibility. Detection: require ownership for integrations, preview, governance, release management, and total cost. Vendor claim: headless improves reuse. Detection: require content model proof, locale handling, reference management, schema migration, and marketer usability. Vendor claim: AI accelerates content. Detection: require permissions, brand controls, data-use terms, auditability, and review workflow.

The common failure is selecting for developer architecture while editor adoption collapses. The second failure is under-scoping migration: legacy content inventory, SEO redirects, localization mapping, component libraries, analytics tags, personalization rules, assets, user roles, and front-end build ownership. The third failure is assuming accessibility or regulatory compliance without authoring-tool evidence and buyer legal review. The fourth failure is comparing license tiers while ignoring API calls, bandwidth, storage, environments, SSO, audit logs, support, and migration cost.`,
  },
  {
    id: 'PAT-SRC-CAT-COMM-001',
    slug: 'collaboration-productivity-suite-sourcing',
    title: 'Collaboration and Productivity Suite Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Collaboration and productivity suite sourcing is an enterprise operating-platform decision, not a per-seat license comparison; identity, records, AI, accessibility, migration, and commercial leverage determine durable fit.',
    applicability:
      'Apply when sourcing or renewing enterprise email, calendar, document collaboration, chat, meetings, cloud file storage, productivity apps, AI productivity add-ons, or suite consolidation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-plans-and-pricing',
      'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise',
      'https://learn.microsoft.com/en-us/compliance/assurance/assurance-microsoft-365-compliance-program',
      'https://www.microsoft.com/en-us/accessibility/conformance-reports/',
      'https://workspace.google.com/pricing',
      'https://workspace.google.com/security/',
      'https://support.google.com/accessibility/answer/2821355?hl=en',
      'https://cloud.google.com/security/compliance/iso-27001?hl=en',
      'https://www.zoho.com/workplace/pricing.html',
      'https://www.zoho.com/workplace/security.html',
      'https://www.zoho.com/compliance.html',
      'https://www.cisa.gov/resources-tools/services/secure-cloud-business-applications-scuba-project',
    ],
    regulatoryChips: ['SOC-2-if-available', 'ISO-27001-if-scoped', 'GDPR-if-EU-data', 'accessibility-ACR-review'],
    relatedPatternIds: ['PAT-SRC-CAT-COMM-002', 'PAT-SRC-CAT-COMM-003', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Microsoft 365',
        tier: 'enterprise',
        positioning: 'Enterprise productivity suite strongest where Office compatibility, Windows, Entra, Intune, Purview, Defender, Teams, and E5 security/compliance depth matter.',
        cautions: ['No-Teams variants, Copilot licensing, E5 security, support, storage, and renewal economics must be normalized before award'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 Enterprise Plans and Pricing', url: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-plans-and-pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Google Workspace',
        tier: 'enterprise',
        positioning: 'Cloud-native productivity suite strongest where Gmail, Drive, Meet, Chat, Docs, browser-first collaboration, and simpler administration are central.',
        cautions: ['Promotional list pricing, Enterprise sales-contact posture, Gemini access, storage, Voice, and migration cost require event-time verification'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Google Workspace Pricing', url: 'https://workspace.google.com/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Zoho Workplace',
        tier: 'mid-market',
        positioning: 'Alternative productivity suite candidate for cost-sensitive or privacy-positioned environments where Mail, WorkDrive, Cliq, Calendar, and workplace tools can satisfy required workflows.',
        cautions: ['Enterprise feature parity, support depth, ecosystem integrations, and component-level compliance scope require tighter diligence'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zoho Workplace Pricing', url: 'https://www.zoho.com/workplace/pricing.html', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Public suite pricing anchors and AI add-on model',
        model: 'subscription',
        metric: 'User per month by suite tier, with add-ons for AI, security, voice, storage, support, or compliance',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 Enterprise Plans and Pricing', url: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/microsoft-365-plans-and-pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft 365 Copilot Pricing', url: 'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Workspace Pricing', url: 'https://workspace.google.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise net price, discount, renewal concession, reseller pricing, and ELA/EA terms require contract or quote evidence' },
        ],
        confidence: 0.62,
        notes: 'Use public pages as dated list-price orientation only. Do not infer negotiated enterprise pricing or discount depth.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Renewal and license flexibility',
        buyerPosition: 'Require true-up/down mechanics, license segmentation, renewal caps, add-on treatment, and SKU substitution rights before suite award.',
      },
      {
        clauseArea: 'Security, records, and data handling',
        buyerPosition: 'Require current trust documentation, DPA, data residency, retention/eDiscovery support, audit logs, accessibility conformance reports, and AI data-use terms.',
      },
      {
        clauseArea: 'Migration acceptance',
        buyerPosition: 'Tie migration acceptance to mail routing, calendars, file fidelity, shared drives, permissions, retention labels, mobile controls, macros/add-ins, automations, and user adoption evidence.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Persona-based license segmentation',
        whenToUse: 'Use when knowledge workers, frontline users, contractors, executives, and admins need different suite capabilities.',
        buyerAsk: 'Normalize license mix by user population and require change rights as adoption and AI rollout mature.',
      },
      {
        lever: 'AI add-on separation',
        whenToUse: 'Use when vendor bundles AI into renewal momentum before data hygiene and adoption readiness are proven.',
        buyerAsk: 'Stage AI seats by role, readiness, sensitive-content controls, usage analytics, and measured adoption outcomes.',
      },
    ],
    riskFactors: [
      {
        id: 'comm-suite-migration-disruption',
        label: 'Suite migration disruption',
        severity: 'high',
        detectionSignals: ['Migration plan underweights mail routing, document fidelity, retention, mobile, external sharing, macros, add-ins, and user behavior.'],
        mitigations: ['Run pilot migrations and adoption tests before award', 'Separate technical cutover from behavior change planning'],
      },
      {
        id: 'comm-suite-ai-overbuy',
        label: 'AI productivity overbuy',
        severity: 'medium',
        detectionSignals: ['Paid AI seats are proposed before permissions hygiene, use-case owners, or adoption metrics exist.'],
        mitigations: ['Require role-level AI deployment plan and opt-in pilot gates'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Raise records retention, eDiscovery, DLP, audit, supervision, customer-data, data residency, and AI-permission controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, BAA availability, mobile controls, external sharing, and records retention by exact service component.',
      },
      {
        industry: 'public_sector',
        modifier: 'Require accessibility conformance reports, procurement transparency, residency, records, security attestations, and government-cloud eligibility review.',
      },
    ],
    body: `## Summary
Collaboration suites are now the work system of record for many enterprises. Email, meetings, files, documents, chat, identity-adjacent controls, retention, and AI assistance increasingly converge in the same sourcing decision. The durable decision is therefore not the lowest public seat price. It is whether the suite can support the buyer's operating model, security and records posture, document workflows, migration constraints, accessibility expectations, and commercial leverage.

Microsoft 365, Google Workspace, Zoho Workplace, and adjacent tools solve overlapping but different problems. Microsoft tends to be strongest where Office desktop compatibility, Windows, Entra, Intune, Purview, Defender, Teams, and E5 security/compliance depth matter. Google tends to be strongest where browser-first collaboration, Gmail, Drive, Meet, Chat, Docs, simpler cloud administration, and cloud-native adoption are central. Zoho can be relevant for cost-sensitive or privacy-positioned alternatives, but enterprise buyers need tighter diligence on feature parity, support depth, ecosystem fit, and component-level compliance scope.

## When to apply
Use this pattern when a sourcing event includes enterprise email, calendar, document collaboration, chat, meetings, cloud file storage, productivity apps, AI productivity add-ons, or suite consolidation. It fits Microsoft 365 renewals, Google Workspace migrations, Zoho or alternative evaluations, dual-suite rationalization, frontline and knowledge-worker segmentation, and security/compliance-driven collaboration modernization. Do not use it as the primary pattern for standalone UCaaS, standalone file sharing, email security gateways, project management, or narrow chat tools unless they are part of a broader suite strategy.

## Category boundary
In scope: email, calendar, documents, spreadsheets, presentations, file storage, sharing, chat, meetings, search, mobile controls, identity integration, retention, eDiscovery, DLP, audit, admin policy, accessibility conformance, AI productivity add-ons, migration services, user adoption, and enterprise support. Out of scope: standalone video conferencing, enterprise messaging, storage, UCaaS, or project tools unless the buying decision is suite-level.

## Lifecycle and gates
The scope gate should document user population by role, current license mix, mail/calendar dependencies, document storage and sharing baseline, identity and endpoint controls, compliance and records requirements, accessibility requirements, migration cutover constraints, AI add-on assumptions, and external collaboration posture. The RFP release gate should require a comparable feature matrix, pricing template that separates base suite, add-ons, AI, voice, storage, security, support, and migration, plus current trust and accessibility evidence. The evaluation gate should mark net pricing as founder-data-gap unless verified, score migration risk, and score the admin/security operating model. The award gate should approve final license mix, renewal escalators, data exit terms, adoption measurement, and AI rollout governance.

## Evaluation rubric
Weight security and compliance around 20 percent, user productivity fit around 20 percent, interoperability and migration risk around 15 percent, administration/identity/endpoint fit around 15 percent, commercial model around 15 percent, accessibility/support/trust evidence around 10 percent, and AI roadmap around 5 percent. Increase compliance weight for financial services, healthcare, education, public sector, and regulated communication environments. Increase migration weight for organizations with heavy desktop macros, legacy shared drives, external collaboration, or complex retention labels.

## Pricing and contract notes
Public pricing pages are list-price orientation only. They can show available tiers, AI add-on posture, and self-service limits, but they do not prove enterprise net price, discount depth, renewal concessions, reseller terms, migration cost, or true-up rights. Any enterprise net price, discount percentage, renewal concession, ELA/EA term, or reseller-specific pricing should remain founder-data-gap unless supported by an official quote, order form, contract, reseller bid, or billing export.

Contracting should lock renewal caps, license flexibility, add-on pricing, AI data-use terms, data export and deletion, retention/eDiscovery obligations, DPA, subprocessors, data residency, support SLAs, accessibility evidence, migration acceptance, and transition assistance. For regulated buyers, legal and security review must scope controls to the exact service and tenant configuration. Do not claim a suite makes a buyer compliant.

## Contradictions and failure modes
Vendor claim: the suite is cheaper. Detection: compare base licenses, add-ons, support, storage, voice, AI, security, migration, training, and renewal year economics. Vendor claim: AI is included. Detection: require qualifying license, data permissions, sensitive content controls, usage analytics, and adoption plan. Vendor claim: migration is straightforward. Detection: run pilots for mail routing, calendars, file fidelity, shared drives, permissions, retention, mobile controls, macros, add-ins, and automations.

The common failure is treating a suite renewal as procurement arithmetic while the real decision is operating-platform lock-in. The second failure is overbuying AI before data permissions and role-level use cases are ready. The third failure is underestimating user behavior change, especially when moving between desktop-first and browser-first collaboration models.`,
  },
  {
    id: 'PAT-SRC-CAT-COMM-002',
    slug: 'video-conferencing-platform-sourcing',
    title: 'Video Conferencing Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Video conferencing platforms have matured from meeting utilities into collaboration infrastructure; ecosystem fit, security, accessibility, AI workflows, rooms, compliance, and procurement leverage now drive the sourcing decision.',
    applicability:
      'Apply when sourcing meeting platforms, video conferencing, room systems, webinar/event tooling, AI meeting assistants, calling bundles, or compliance-ready synchronous collaboration platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://zoom.us/pricing/',
      'https://www.zoom.com/en/trust/',
      'https://www.zoom.com/en/trust/legal-compliance/',
      'https://www.microsoft.com/en-us/microsoft-teams/compare-microsoft-teams-business-options',
      'https://learn.microsoft.com/en-us/microsoftteams/security-compliance-overview',
      'https://www.microsoft.com/en-us/microsoft-teams/accessibility-closed-captions-transcriptions',
      'https://workspace.google.com/pricing',
      'https://workspace.google.com/intl/en/products/meet/',
      'https://support.google.com/accessibility/answer/7313544?hl=en',
      'https://support.google.com/a/answer/7582940?hl=en',
      'https://pricing.webex.com/us/en/hybrid-work/meetings/all-features/',
      'https://www.cisco.com/c/en/us/products/collateral/conferencing/webex-meeting-center/white-paper-c11-737588.html',
    ],
    regulatoryChips: ['accessibility-review', 'SOC-2-if-available', 'FedRAMP-if-government-SKU', 'HIPAA-if-healthcare-workflow'],
    relatedPatternIds: ['PAT-SRC-CAT-COMM-001', 'PAT-SRC-CAT-COMM-003', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Zoom Workplace',
        tier: 'enterprise',
        positioning: 'Meeting-first collaboration platform candidate where external familiarity, webinars, events, rooms, AI meeting workflows, and cross-organization neutrality matter.',
        cautions: ['Enterprise pricing, AI entitlements, storage, compliance SKU, and room-device scope require quote verification'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zoom Workplace Pricing', url: 'https://zoom.us/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Teams and Google Meet',
        tier: 'enterprise',
        positioning: 'Suite-bundled meeting platforms strongest where Microsoft 365 or Google Workspace already define identity, calendar, documents, chat, compliance, and admin policy.',
        cautions: ['Included-plan assumptions must be validated by tier, tenant settings, meeting limits, recordings, captions, storage, and compliance features'],
      },
      {
        vendorName: 'Cisco Webex',
        tier: 'enterprise',
        positioning: 'Enterprise collaboration candidate where Cisco calling, room devices, hybrid work hardware, public-sector/security posture, or communications depth matters.',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Webex Meetings Plans and Pricing', url: 'https://pricing.webex.com/us/en/hybrid-work/meetings/all-features/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Video conferencing public plan and enterprise quote model',
        model: 'hybrid',
        metric: 'Users, hosts, suite bundles, rooms, calling, webinars, events, AI, storage, support, and compliance add-ons',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zoom Pricing', url: 'https://zoom.us/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Teams Business Options', url: 'https://www.microsoft.com/en-us/microsoft-teams/compare-microsoft-teams-business-options', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Workspace Pricing', url: 'https://workspace.google.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise net pricing, education/public-sector terms, renewal concessions, and room add-ons require quote evidence' },
        ],
        confidence: 0.61,
        notes: 'List prices and plan limits are volatile. Snapshot current page, region, and plan at event time.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Security and compliance controls',
        buyerPosition: 'Require encryption posture, admin controls, identity/SSO, retention/eDiscovery, audit artifacts, data residency, government/healthcare SKU review, and incident notification terms.',
      },
      {
        clauseArea: 'AI meeting features',
        buyerPosition: 'Define transcript, summary, recording, retention, model/data-use, opt-in, user consent, and admin-control boundaries for meeting AI features.',
      },
      {
        clauseArea: 'Rooms and hardware',
        buyerPosition: 'Define room licenses, device lifecycle, interoperability, support ownership, firmware/update model, installation acceptance, and exit support.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Suite-bundle displacement pressure',
        whenToUse: 'Use when Zoom or Webex competes against bundled Teams or Meet access already present in a productivity suite.',
        buyerAsk: 'Trade standalone premium only for measurable workflow, external-user, room, webinar, security, or adoption advantages.',
      },
      {
        lever: 'Add-on decomposition',
        whenToUse: 'Use when the headline price excludes webinars, events, calling, rooms, AI, compliance, storage, support, or toll audio.',
        buyerAsk: 'Require line-item add-on schedule and renewal protections for each module.',
      },
    ],
    riskFactors: [
      {
        id: 'video-suite-shelfware',
        label: 'Meeting platform shelfware',
        severity: 'medium',
        detectionSignals: ['Organization pays for multiple video platforms without usage segmentation by meeting type or user persona.'],
        mitigations: ['Analyze active usage, room footprint, external meeting needs, and suite entitlements before renewal'],
      },
      {
        id: 'video-ai-compliance-gap',
        label: 'Meeting AI compliance gap',
        severity: 'high',
        detectionSignals: ['Transcripts, summaries, recordings, or AI assistants are enabled without retention, consent, access, or data-use controls.'],
        mitigations: ['Require AI governance exhibit before enabling enterprise-wide meeting AI'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, BAA availability, recording/transcript controls, access policy, and patient-facing use cases by exact SKU.',
      },
      {
        industry: 'higher_education',
        modifier: 'Stress accessibility, captions, LMS integration, classroom rooms, student privacy, and large meeting/event needs.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review government cloud, FedRAMP posture where required, accessibility, records retention, procurement, and data residency.',
      },
    ],
    body: `## Summary
Video conferencing platforms have matured from meeting utilities into bundled collaboration infrastructure. The core product is synchronous audio and video, but enterprise buying decisions now include identity, admin policy, recordings, transcripts, AI summaries, security review, compliance artifacts, accessibility, rooms, webinars, calling, chat, and ecosystem lock-in. The right sourcing question is not only which platform has the best video quality. It is which collaboration operating model the buyer wants to reinforce.

Zoom is often meeting-first, with broader Workplace packaging and strong external-call familiarity. Microsoft Teams is tied to Microsoft 365, Entra, Outlook, SharePoint, Purview, and Office workflows. Google Meet is bundled into Google Workspace and benefits from Gmail, Calendar, Docs, Drive, browser-first access, and Workspace admin policy. Cisco Webex is a collaboration suite with depth around enterprise communications, calling, room systems, and security-oriented positioning.

## When to apply
Use this pattern when evaluating synchronous collaboration, video conferencing, meeting-room systems, webinar/event tooling, AI meeting assistants, calling bundles, or compliance-ready communications platforms. It fits hybrid-work infrastructure, B2B collaboration, education, healthcare, regulated enterprise meetings, customer success, sales meetings, learning, and board/executive collaboration. Do not use it as the primary pattern for asynchronous messaging, productivity suites, contact center, or telephony-only sourcing unless video meetings are central.

## Category boundary
In scope: meetings, host/user licensing, participant limits, external guests, webinars, events, rooms, devices, recordings, transcripts, captions, translations, AI summaries, chat adjacency, calendar integration, identity/SSO, admin controls, retention, eDiscovery, audit artifacts, support, storage, compliance SKU, and accessibility. Out of scope: general productivity suites, enterprise messaging, project management, LMS, and UCaaS unless the meeting platform is bundled into those decisions.

## Lifecycle and gates
The scope gate should define active paid seats, meeting hosts, participant patterns, external collaboration, webinar/event needs, room footprint, calling needs, recording/transcript policy, accessibility requirements, retention/eDiscovery needs, compliance scope, and existing suite entitlements. The RFP gate should require comparable pricing for users/hosts, rooms, calling, webinars, events, AI, storage, compliance, support, and implementation. The demo gate should test calendar scheduling, external guest access, room join, captions, transcript, recording, admin policy, retention setting, security controls, and AI summary governance. The BAFO gate should normalize suite-bundled economics against standalone platform value.

## Evaluation rubric
Weight ecosystem fit around 25 percent, security/compliance/admin controls around 20 percent, meeting and room experience around 15 percent, accessibility around 10 percent, AI and recording governance around 10 percent, integration and interoperability around 10 percent, and commercial model around 10 percent. Increase accessibility weight for education, public sector, healthcare, and global workforces. Increase room/hardware weight where hybrid office investment is material. Increase compliance weight where recordings, transcripts, legal hold, supervision, or public-sector requirements apply.

## Pricing and contract notes
Public pricing should be treated as directional only. Microsoft, Google, Webex, and Zoom publish plan pages or business options, but enterprise net pricing, discounts, education/public-sector terms, negotiated add-ons, and renewal concessions require direct evidence. Normalize base licenses, suite entitlements, webinar/event modules, rooms, devices, calling, toll audio, AI, storage, premium support, security/compliance add-ons, and implementation services. Avoid comparing a standalone meeting platform to a suite-bundled meeting tool without assigning value to actual usage and requirements.

Contracting should define security controls, identity/SSO, encryption posture, admin policy, retention, eDiscovery, audit artifacts, DPA, data residency, subprocessor terms, incident notification, accessibility evidence, room support, device lifecycle, AI meeting-data use, recording/transcript controls, consent configuration, export, deletion, and transition assistance.

## Contradictions and failure modes
Vendor claim: bundled meetings are free. Detection: compare actual user experience, external collaboration, rooms, webinars, compliance controls, support, and adoption against the suite cost already paid. Vendor claim: AI meeting summaries improve productivity. Detection: require usage, consent, retention, access, data-use, and measurable adoption evidence. Vendor claim: compliance is covered. Detection: verify exact SKU, tenant configuration, trust artifact, and buyer jurisdiction.

The common failure is standardizing on a platform because it is already bundled, while ignoring external-meeting friction, room quality, accessibility, and webinar needs. The second failure is paying for multiple meeting platforms without active-usage segmentation. The third failure is enabling recordings, transcripts, and AI summaries without retention, consent, and access-control design.`,
  },
  {
    id: 'PAT-SRC-CAT-COMM-003',
    slug: 'enterprise-messaging-platform-sourcing',
    title: 'Enterprise Messaging and Team Chat Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise messaging sourcing is a governance and workflow-platform decision; retention, eDiscovery, external collaboration, AI/agent controls, integrations, search, security, and suite lock-in matter more than chat UX alone.',
    applicability:
      'Apply when sourcing Slack, Microsoft Teams chat, Google Chat, Mattermost, or similar enterprise messaging platforms for persistent team communication, external collaboration, workflow automation, compliance, and AI/agent orchestration.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://slack.com/enterprise',
      'https://slack.com/intl/en-us/pricing',
      'https://support.microsoft.com/en-us/office/information-protection-in-microsoft-teams-d71ce838-d8a6-4841-bc08-3d4e93ac22a5',
      'https://learn.microsoft.com/en-us/microsoft-365/compliance/teams-workflow-in-advanced-ediscovery',
      'https://learn.microsoft.com/en-us/microsoft-365/compliance/retention-policies-teams?view=o365-worldwide',
      'https://workspace.google.com/products/chat/',
      'https://workspace.google.com/pricing',
      'https://mattermost.com/pricing/',
      'https://docs.mattermost.com/product-overview/certifications-and-compliance.html',
      'https://docs.mattermost.com/product-overview/editions-and-offerings.html',
    ],
    regulatoryChips: ['retention-eDiscovery-review', 'DLP-if-available', 'SOC-2-if-available', 'government-cloud-if-required'],
    relatedPatternIds: ['PAT-SRC-CAT-COMM-001', 'PAT-SRC-CAT-COMM-002', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Slack',
        tier: 'enterprise',
        positioning: 'Enterprise messaging platform candidate where app ecosystem, external collaboration, workflow automation, search, channels, and AI/agent orchestration matter.',
        cautions: ['Enterprise pricing, retention, DLP, legal hold, data residency, GovSlack, and AI terms require exact plan and contract review'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Slack Enterprise', url: 'https://slack.com/enterprise', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Slack Pricing', url: 'https://slack.com/intl/en-us/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Teams chat and Google Chat',
        tier: 'enterprise',
        positioning: 'Suite-bundled messaging candidates strongest where Microsoft 365 or Google Workspace already define identity, docs, meetings, retention, and admin policy.',
        cautions: ['Retention, eDiscovery, channel history, external collaboration, and search behavior must be validated by tenant and plan'],
      },
      {
        vendorName: 'Mattermost',
        tier: 'specialist',
        positioning: 'Secure and self-hostable messaging candidate for mission-critical, data-sovereign, air-gapped, developer, and regulated collaboration contexts.',
        cautions: ['Self-hosting reduces some vendor lock-in but adds infrastructure, upgrade, support, scale, compliance, and admin burden'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Mattermost Pricing', url: 'https://mattermost.com/pricing/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Enterprise messaging plan and quote model',
        model: 'subscription',
        metric: 'Users, guests, workspaces, retention, eDiscovery, DLP, AI, support, app/integration usage, data residency, and deployment model',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Slack Pricing', url: 'https://slack.com/intl/en-us/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Workspace Pricing', url: 'https://workspace.google.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Mattermost Pricing', url: 'https://mattermost.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise Grid/custom pricing, Microsoft suite allocation, discounts, retention/eDiscovery add-ons, and renewal concessions require quote or contract evidence' },
        ],
        confidence: 0.58,
        notes: 'Do not use third-party enterprise pricing benchmarks without approval. Public plan pages do not establish net price or discount depth.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Records, retention, and eDiscovery',
        buyerPosition: 'Require retention, legal hold, export, audit, eDiscovery, DLP, and external-collaboration terms scoped to channels, DMs, guests, files, edits, deletes, and AI outputs.',
      },
      {
        clauseArea: 'AI and agent governance',
        buyerPosition: 'Define AI/agent permissions, app approvals, data use, logs, prompt/output retention, connector scope, human review, and opt-out controls.',
      },
      {
        clauseArea: 'Exit and portability',
        buyerPosition: 'Require usable export of channels, DMs where lawful, files, metadata, user/group mappings, workflow definitions, app integrations, and retention/audit history.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Suite displacement and coexistence',
        whenToUse: 'Use when Slack or Mattermost must justify standalone spend against Teams or Google Chat already bundled into productivity suites.',
        buyerAsk: 'Require usage, workflow, integration, external-collaboration, compliance, and adoption evidence that exceeds bundled alternatives.',
      },
      {
        lever: 'Compliance feature entitlement',
        whenToUse: 'Use when retention, legal hold, eDiscovery, DLP, data residency, or government environment is required.',
        buyerAsk: 'Pin exact plan/SKU, feature entitlement, support process, export format, and renewal price protections.',
      },
    ],
    riskFactors: [
      {
        id: 'messaging-records-gap',
        label: 'Messaging records and eDiscovery gap',
        severity: 'high',
        detectionSignals: ['Retention or export assumptions do not cover edits, deletes, private channels, DMs, guests, files, or AI-generated content.'],
        mitigations: ['Require records matrix and legal/security signoff before award'],
      },
      {
        id: 'messaging-integration-sprawl',
        label: 'App and integration sprawl',
        severity: 'medium',
        detectionSignals: ['Marketplace apps, bots, webhooks, and AI agents are enabled without approval, logging, or least-privilege controls.'],
        mitigations: ['Require app governance, admin approvals, DLP review, and periodic access recertification'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Raise supervision, retention, legal hold, eDiscovery, DLP, external communications, audit, and AI-output governance.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review government-cloud options, records obligations, accessibility, data residency, procurement, and audit export requirements.',
      },
      {
        industry: 'energy_utilities',
        modifier: 'Stress incident coordination, air-gapped or sovereign deployment needs, operational resilience, and mission-critical support.',
      },
    ],
    body: `## Summary
Enterprise messaging platforms are no longer informal chat tools. They are persistent communication systems, workflow automation surfaces, app ecosystems, external-collaboration channels, AI/agent front doors, and records repositories. The sourcing decision should therefore test governance and workflow fit as much as user experience. Search, retention, legal hold, eDiscovery, DLP, integrations, external guests, app approvals, data residency, AI outputs, and exit rights can matter more than message formatting.

Representative choices include Slack, Microsoft Teams chat, Google Chat, Mattermost, and specialized secure collaboration tools. Slack often competes on channel-centric work, external collaboration, app ecosystem, workflow automation, search, and Salesforce-adjacent AI positioning. Teams and Google Chat often arrive as part of Microsoft 365 or Google Workspace, which changes the commercial baseline. Mattermost is relevant where self-hosting, data sovereignty, mission-critical workflows, developer collaboration, or air-gapped/private deployment requirements are material.

## When to apply
Use this pattern when sourcing persistent team chat, enterprise messaging, external-collaboration channels, team spaces, workflow/chat automation, AI agents in messaging, secure collaboration, or messaging retention/eDiscovery. Do not use it as the primary pattern for video conferencing, productivity suite renewal, contact center, social intranet, or project management unless messaging is the core workflow layer.

## Category boundary
In scope: channels, DMs, group messaging, guest access, external sharing, files, search, app marketplace, bots, workflows, webhooks, AI/agent features, retention, legal hold, eDiscovery, DLP, audit logs, data residency, identity/SSO, mobile controls, compliance export, government/sovereign options, support, uptime, migration, and exit. Out of scope: meetings, email, document authoring, project management, and general productivity unless messaging governance is central.

## Lifecycle and gates
The scope gate should map active users, guest/external collaboration, regulated communications, channel taxonomy, message volumes, file sharing, app integrations, incident workflows, AI/agent use cases, retention requirements, legal hold needs, eDiscovery workflows, DLP policy, data residency, and existing suite entitlements. The RFP gate should require pricing normalization for users, guests, workspaces, compliance exports, DLP, AI, data residency, premium support, and deployment model. The demo gate should test channel governance, guest access, app approval, retention, eDiscovery/export, search, mobile controls, incident workflow, and AI/agent permission boundaries. The BAFO gate should compare standalone platform value against suite-bundled alternatives.

## Evaluation rubric
Weight governance and compliance around 25 percent, workflow and integration fit around 20 percent, suite/economics and coexistence around 15 percent, search and knowledge retrieval around 10 percent, external collaboration around 10 percent, security/admin controls around 10 percent, AI/agent governance around 5 percent, and exit/portability around 5 percent. Increase records, eDiscovery, legal hold, and DLP weight for regulated industries. Increase deployment-control weight for defense, public sector, energy, critical infrastructure, and mission-critical operations.

## Pricing and contract notes
Public plan pages can show packaging direction, but enterprise messaging pricing often depends on user count, workspace topology, enterprise grid or tenant model, guests, compliance features, DLP, data residency, AI features, app/integration needs, support, deployment model, and renewal leverage. Enterprise net pricing, discount ranges, Microsoft suite allocation, Slack Enterprise or GovSlack economics, Mattermost cloud/self-hosted TCO, and renewal concessions should stay founder-data-gap without quote or contract evidence.

Contracting should define records retention, legal hold, eDiscovery, audit logs, DLP, app approvals, external collaboration, data residency, subprocessors, DPA, incident notification, AI/agent terms, prompt/output retention, connector scope, support, export, deletion, and transition assistance. For self-hosted or sovereign deployments, include infrastructure ownership, upgrade cadence, security patching, backup, high availability, monitoring, and support response obligations.

## Contradictions and failure modes
Vendor claim: chat is included in the suite. Detection: compare actual workflows, channel governance, external collaboration, app ecosystem, search, compliance exports, and user adoption against bundled access. Vendor claim: the platform is compliant. Detection: verify exact plan, tenant settings, export coverage, records scope, legal hold, data residency, and buyer jurisdiction. Vendor claim: AI agents will improve work. Detection: require app approval, permission inheritance, logs, data-use terms, human review, and measured adoption.

The common failure is letting chat proliferate as a shadow records system without legal, compliance, and security ownership. The second failure is paying for standalone messaging while bundled alternatives cover most use cases. The third failure is choosing a self-hosted or sovereign messaging option without resourcing infrastructure, upgrades, monitoring, and support. The fourth failure is allowing app, bot, webhook, and AI-agent sprawl without least-privilege controls.`,
  },
  {
    id: 'PAT-SRC-CAT-CDP-001',
    slug: 'customer-data-platform-sourcing',
    title: 'Customer Data Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'CDP sourcing should score architecture fit, identity and profile quality, activation coverage, governance posture, and pricing-unit transparency rather than accepting broad single-customer-view claims.',
    applicability:
      'Apply when sourcing customer data platforms for first-party data ingestion, identity resolution, audience activation, consent-aware governance, and integrations into marketing, analytics, warehouse, CRM, or advertising platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.cdpinstitute.org/learning-center/what-is-a-cdp/',
      'https://www.twilio.com/en-us/pricing/customer-data',
      'https://www.twilio.com/en-us/trust-center',
      'https://docs.mparticle.com/guides/idsync/identify-users/',
      'https://docs.mparticle.com/integrations/',
      'https://docs.tealium.com/server-side/getting-started/intro-cdh/',
      'https://www.treasuredata.com/product/pricing/',
      'https://www.treasuredata.com/security/',
      'https://www.rudderstack.com/pricing/',
      'https://hightouch.com/pricing/',
      'https://hightouch.com/docs/security/overview',
    ],
    regulatoryChips: ['GDPR-if-EU-data', 'CCPA-if-California-consumer-data', 'HIPAA-if-PHI', 'SOC-2-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-MA-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Twilio Segment',
        tier: 'enterprise',
        positioning: 'Packaged CDP candidate with public packaging around Connections, Unify, Engage, identity resolution, profile APIs, and warehouse activation.',
        cautions: ['Enterprise CDP plan pricing is quote-led and volume-dependent; net pricing, services, and overage terms require buyer evidence.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Twilio Segment Customer Data Platform Pricing', url: 'https://www.twilio.com/en-us/pricing/customer-data', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Hightouch and RudderStack',
        tier: 'specialist',
        positioning: 'Composable and warehouse-native candidates where the buyer wants activation, reverse ETL, event pipelines, and profile workflows near the warehouse.',
        cautions: ['Free or starter public tiers do not establish enterprise net price, governed activation cost, or implementation effort.'],
      },
      {
        vendorName: 'mParticle, Tealium, and Treasure Data',
        tier: 'enterprise',
        positioning: 'Enterprise CDP candidates with public documentation around identity, integrations, customer-data hub capabilities, and security/trust posture.',
        cautions: ['Identity method, activation depth, consent handling, and compliance scope must be tested by buyer scenario.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'CDP public pricing and quote model',
        model: 'hybrid',
        metric: 'Events, profiles, destinations, activation volume, warehouse syncs, services, support, and add-ons',
        sourceBasis: [
          { type: 'public-disclosure', label: 'RudderStack Pricing', url: 'https://www.rudderstack.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Hightouch Pricing', url: 'https://hightouch.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Treasure Data Pricing', url: 'https://www.treasuredata.com/product/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Enterprise CDP net price, discounts, services, implementation effort, usage commits, and renewal concessions require quote or contract evidence' },
        ],
        confidence: 0.6,
        notes: 'Use public pricing pages only to identify pricing units and quote posture. Do not infer negotiated enterprise economics.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Customer data processing and activation controls',
        buyerPosition: 'Define processor role, data-use limits, deletion, DSR support, consent/opt-out handling, destinations, subprocessors, retention, and audit evidence.',
      },
      {
        clauseArea: 'Usage and overage transparency',
        buyerPosition: 'Pin the priced unit, included volume, overage calculation, volume reforecast process, renewal true-up, and implementation/service assumptions.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Packaged versus composable architecture pressure',
        whenToUse: 'Use when packaged CDP vendors compete against warehouse-native activation or reverse-ETL options.',
        buyerAsk: 'Require equivalent workload scenarios for identity, activation, governance, cost, destination coverage, and data-residency posture.',
      },
      {
        lever: 'Volume-unit normalization',
        whenToUse: 'Use before BAFO when vendors price on different combinations of events, profiles, destinations, rows, syncs, and support.',
        buyerAsk: 'Submit a normalized model for current and forecast event/profile/activation volume with explicit overage treatment.',
      },
    ],
    riskFactors: [
      {
        id: 'cdp-identity-claim-gap',
        label: 'Identity resolution claim gap',
        severity: 'high',
        detectionSignals: ['Vendor describes a unified profile without proving deterministic identifiers, merge rules, survivorship, debugging, and consent handling.'],
        mitigations: ['Run buyer-authored identity scenarios before award', 'Require profile lineage and match-rule evidence'],
      },
      {
        id: 'cdp-usage-overage-exposure',
        label: 'Usage and overage exposure',
        severity: 'medium',
        detectionSignals: ['Pricing units are unclear or tied to events/profiles/destinations that the buyer cannot forecast.'],
        mitigations: ['Demand a volume model and overage cap before BAFO'],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier: 'Stress loyalty identity, offline-to-online matching, consent, suppression, and advertising activation controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, BAA availability, consent, minimum-necessary design, and downstream destination restrictions.',
      },
      {
        industry: 'financial_services',
        modifier: 'Raise data residency, retention, consent, model governance, auditability, and third-party-risk evidence.',
      },
    ],
    body: `## Summary
A customer data platform is packaged or composable infrastructure for creating a persistent customer profile that can be used by other systems. The CDP Institute definition is useful because it anchors the category in packaged software, unified customer profiles, and downstream accessibility. For sourcing, the first question is not which vendor says single customer view most convincingly. It is whether the buyer wants a packaged CDP to own profiles and activation, or a warehouse-native/composable architecture where the customer warehouse remains the primary store of truth.

## When to apply
Use this pattern for B2C, marketplace, subscription, retail, media, SaaS, and multi-channel organizations that need first-party data ingestion, identity resolution, audience activation, consent-aware governance, and integrations into marketing, analytics, warehouse, CRM, or advertising platforms. Do not over-apply it to simple CRM, warehouse-only analytics, or a single-channel lifecycle tool unless cross-channel identity and activation are explicit requirements.

## Category boundary
In scope: event collection, SDKs, server-side ingestion, warehouse and SaaS sources, identity resolution, profile APIs, profile exploration, audience building, activation destinations, reverse ETL, journey triggers, consent handling, suppression, DSR support, security/trust artifacts, data residency, audit logs, implementation services, and usage-based pricing controls. Out of scope: generic marketing automation, email-only lifecycle tools, pure BI warehouses, tag managers without profile unification, and CRM record governance unless they are part of the identity and activation architecture.

## Lifecycle and gates
The scope gate should define customer identifiers, regulated data classes, current source systems, desired activation destinations, consent and opt-out obligations, geography, event/profile volume assumptions, warehouse role, and marketing ownership. The market-scan gate should separate packaged CDPs from composable CDPs, event pipelines, reverse-ETL platforms, and campaign tools. The RFP gate should require buyer-authored identity scenarios: anonymous-to-known merge, duplicate profile resolution, suppression, deletion request, consent change, destination sync, bad-event quarantine, and profile debugging. The BAFO gate should normalize events, profiles, rows, destinations, syncs, support, implementation, warehouse storage/compute, and overage terms.

## Evaluation rubric
Weight architecture fit around 20 percent, identity/profile quality around 20 percent, activation and integration coverage around 20 percent, governance/privacy/security around 20 percent, commercial transparency around 10 percent, and migration/operating burden around 10 percent. Raise governance weight for healthcare, financial services, public sector, or children/youth data. Raise activation weight for retail, CPG, media, and marketplaces with loyalty, advertising, and lifecycle-marketing dependencies.

## Pricing and contract notes
Public pricing varies sharply. RudderStack publishes free and starter-level anchors plus custom growth and enterprise paths. Segment, Hightouch, Treasure Data, mParticle, and Tealium commonly require sales engagement or custom enterprise structure for the full CDP decision. Public pages can identify pricing units and packaging posture, but they do not prove net enterprise price, discount depth, implementation effort, renewal uplift, or overage risk. Keep negotiated pricing, services, discounts, committed volumes, and renewal concessions as founder-data-gap unless AbarVa has a proposal, invoice, signed order form, or approved benchmark.

Contracting should define processor/data-use boundaries, subprocessors, deletion, DSR support, consent propagation, data retention, destination governance, security attestation access, audit logs, incident notification, data residency, export, transition assistance, and usage caps. A CDP touches sensitive customer data and can create downstream harm if bad segments, consent gaps, or identity merges are activated at scale.

## Contradictions and failure modes
Vendor claim: we create a single customer view. Detection: require match rules, profile lineage, survivorship, consent behavior, and debugging on buyer data. Vendor claim: activation is real time. Detection: test latency, destination limits, batch windows, API failures, retries, and suppression behavior. Vendor claim: pricing is scalable. Detection: model events, profiles, rows, destinations, syncs, warehouse cost, services, and support. The most common failure is buying an impressive activation layer before the buyer knows its identity, consent, and data-quality operating model. The second is comparing public starter plans while ignoring enterprise volume, overages, services, and renewal leverage.`,
  },
  {
    id: 'PAT-SRC-CAT-CDW-001',
    slug: 'cloud-data-warehouse-sourcing',
    title: 'Cloud Data Warehouse Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Cloud data warehouse sourcing should compare workload economics, governance posture, ecosystem fit, and operational control separately; public list pricing identifies cost drivers, but actual TCO depends on workload shape and contract evidence.',
    applicability:
      'Apply when evaluating Snowflake, BigQuery, Amazon Redshift, Databricks SQL, or adjacent warehouse and lakehouse SQL platforms for analytics, BI, ELT, governed sharing, AI/ML feature stores, or migration from legacy warehouse infrastructure.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf',
      'https://www.snowflake.com/en/pricing-options/calculator/',
      'https://docs.snowflake.com/en/user-guide/trust-center/overview',
      'https://cloud.google.com/bigquery/pricing',
      'https://docs.cloud.google.com/bigquery/docs/best-practices-costs',
      'https://docs.cloud.google.com/bigquery/docs/data-governance',
      'https://aws.amazon.com/redshift/pricing/',
      'https://docs.aws.amazon.com/redshift/latest/mgmt/working-with-db-encryption.html',
      'https://docs.aws.amazon.com/redshift/latest/mgmt/security-compliance.html',
      'https://www.databricks.com/product/pricing',
      'https://docs.databricks.com/aws/en/compute/sql-warehouse/warehouse-types',
      'https://www.databricks.com/trust/compliance',
    ],
    regulatoryChips: ['SOC-2-review', 'ISO-27001-if-required', 'HIPAA-if-PHI', 'FedRAMP-if-public-sector'],
    relatedPatternIds: ['PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-LAKE-001', 'PAT-SRC-CAT-BI-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Snowflake',
        tier: 'enterprise',
        positioning: 'Multi-cloud data platform candidate where workload isolation, SQL analytics, governed sharing, and credit-based consumption need explicit modeling.',
        cautions: ['Credits, storage, serverless features, region, cloud, and edition must be modeled from buyer workloads.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Snowflake Service Consumption Table', url: 'https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Google BigQuery',
        tier: 'enterprise',
        positioning: 'Google Cloud warehouse candidate strongest where BigQuery, GCP IAM, Knowledge Catalog, and bytes-scanned or slot-capacity models align with workload shape.',
        cautions: ['On-demand versus capacity economics depend on scan volume, reservations, commitments, partitioning, clustering, and query design.'],
      },
      {
        vendorName: 'Amazon Redshift and Databricks SQL',
        tier: 'enterprise',
        positioning: 'AWS-native and lakehouse SQL candidates where cloud gravity, S3/lakehouse strategy, serverless/provisioned preference, and ML/AI adjacency matter.',
        cautions: ['RPU-hour, DBU, storage, transfer, Spectrum, and warehouse-type assumptions must be normalized.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Warehouse public metering units only',
        model: 'usage-based',
        metric: 'Credits, bytes scanned, slot-hours, RPU-hours, DBUs, storage, transfer, snapshots, and serverless features',
        sourceBasis: [
          { type: 'public-disclosure', label: 'BigQuery Pricing', url: 'https://cloud.google.com/bigquery/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Amazon Redshift Pricing', url: 'https://aws.amazon.com/redshift/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Databricks Pricing', url: 'https://www.databricks.com/product/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Committed-use discounts, migration credits, private offers, enterprise agreements, and renewal economics require buyer evidence' },
        ],
        confidence: 0.66,
        notes: 'Do not assert cheapest or lowest TCO without replaying buyer workloads and contract terms.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Usage transparency and cost controls',
        buyerPosition: 'Require line-item metering, budget alerts, workload tags, query controls, forecast support, credit/commit drawdown reporting, and overage protections.',
      },
      {
        clauseArea: 'Security, governance, and audit evidence',
        buyerPosition: 'Pin IAM/SSO, encryption, CMK/KMS, private networking, row/column controls, masking, catalog, audit logs, and compliance artifact access by edition or SKU.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Workload replay before BAFO',
        whenToUse: 'Use whenever vendors present benchmark claims or simple price-unit comparisons.',
        buyerAsk: 'Run representative BI, ELT, ad hoc, concurrency, storage-growth, and governance scenarios with vendor-visible cost output.',
      },
      {
        lever: 'Cloud-commit and marketplace leverage',
        whenToUse: 'Use when cloud commitments, marketplace private offers, or committed-use discounts can change the sourcing economics.',
        buyerAsk: 'Separate technical score from procurement funding source and preserve exit/portability terms.',
      },
    ],
    riskFactors: [
      {
        id: 'warehouse-tco-model-gap',
        label: 'Warehouse TCO model gap',
        severity: 'high',
        detectionSignals: ['Vendor or buyer compares headline rates without workload traces, concurrency, storage growth, egress, support, or commitments.'],
        mitigations: ['Require workload replay and normalized three-year cost model before award'],
      },
      {
        id: 'warehouse-governance-edition-gap',
        label: 'Governance edition gap',
        severity: 'medium',
        detectionSignals: ['Required controls exist only in higher editions, add-ons, or separately configured cloud-native services.'],
        mitigations: ['Map every required control to exact SKU, edition, configuration, and evidence artifact'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress audit logs, access controls, data lineage, retention, encryption, resilience, exit, and third-party-risk evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, BAA posture, encryption, data minimization, audit access, and role-level controls.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Model high-volume loyalty, clickstream, pricing, inventory, personalization, and BI concurrency workloads separately.',
      },
    ],
    body: `## Summary
Cloud data warehouse sourcing begins when analytics teams need elastic query performance, lower infrastructure management burden, governed access to sensitive data, or a migration path away from fixed-capacity legacy warehouses. The category now spans classic warehouses and lakehouse SQL engines. Snowflake, BigQuery, Amazon Redshift, and Databricks SQL can all support enterprise analytics, but their economics, governance model, and operating posture differ enough that public list-price comparisons can mislead.

## When to apply
Use this pattern when evaluating a warehouse or SQL analytics platform for BI, ELT, governed sharing, AI/ML feature stores, data-product publishing, or legacy warehouse migration. It also applies when the buyer is deciding whether Snowflake, BigQuery, Redshift, Databricks SQL, or a lakehouse path should become the strategic analytics control plane.

## Category boundary
In scope: SQL warehouses, serverless or provisioned compute, storage, data scanned, slots, credits, RPU-hours, DBUs, concurrency, workload isolation, catalog/governance, row/column controls, masking, audit logs, private networking, encryption, BI connectors, data sharing, support, migration, and cost controls. Out of scope: pure object storage, transactional databases, standalone BI tools, standalone ETL, and ML platforms unless their workloads materially drive warehouse economics.

## Lifecycle and gates
The scope gate must collect workload traces: scheduled ELT hours, analyst concurrency, dashboard refresh cadence, ad hoc scan volume, ingestion frequency, storage growth, cold/hot split, region topology, BI tools, data-sharing needs, and regulated data classes. The RFP gate should require each vendor to price the same workload model and identify every cost driver. The proof gate should replay representative queries, load jobs, dashboard concurrency, governance policies, and cost controls. The BAFO gate should normalize public list rates against committed-use discounts, marketplace funding, migration credits, support, egress, storage growth, and renewal terms.

## Evaluation rubric
Weight workload economics around 25 percent, governance/security around 20 percent, ecosystem and cloud fit around 20 percent, performance and concurrency around 15 percent, operating model around 10 percent, and exit/interoperability around 10 percent. Increase governance weight where regulated data, customer data, PHI, financial data, or public-sector requirements are in scope. Increase cloud-fit weight when an existing AWS, GCP, Azure, Snowflake, or Databricks commitment changes procurement leverage.

## Pricing and contract notes
Do not summarize this category with a single price-per-TB claim. Snowflake uses credits for compute and serverless features plus storage and data-transfer considerations. BigQuery separates compute and storage and supports on-demand bytes-scanned or capacity-based slot models. Redshift includes provisioned clusters, Redshift Serverless RPU-hours, RA3 managed storage, Spectrum bytes scanned, snapshots, backup storage, and transfer considerations. Databricks SQL can involve serverless, pro, or classic warehouse choices and DBU/cloud-resource exposure depending on configuration. Negotiated discounts, private offers, migration credits, committed-use terms, cloud marketplace credits, and renewal economics are founder-data-gap until evidenced by buyer documents.

Contracting should require usable cost and usage reporting, workload tags, budget controls, support response terms, data export, security/trust artifacts, encryption and key-management commitments, private networking, audit access, incident notification, subprocessors, data residency, and transition assistance. If controls require a specific edition, SKU, cloud service, or configuration, the order form and acceptance plan must say so.

## Contradictions and failure modes
Vendor claim: we are the lowest-cost warehouse. Detection: replay buyer workloads and compare total spend across compute, storage, scan, transfer, support, commitments, and migration. Vendor claim: serverless is simpler and cheaper. Detection: compare variable workloads, steady-state workloads, network/control needs, and budget predictability. Vendor claim: governance is built in. Detection: map each required control to an exact feature, SKU, and configuration.

The common failure is choosing a platform from benchmark slides without modeling the buyer's workload shape. The second is forgetting that cloud commitments and marketplace private offers can change procurement economics without changing technical fit. The third is assuming governance exists because the platform has a catalog, while row-level controls, masking, lineage, and audit evidence still need configuration and proof.`,
  },
  {
    id: 'PAT-SRC-CAT-LAKE-001',
    slug: 'lakehouse-data-lake-platform-sourcing',
    title: 'Lakehouse and Data Lake Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Lakehouse and data-lake platform sourcing is a governance-and-workload fit decision, not a storage-only buy; buyers must compare table format, catalog control, compute economics, security posture, interoperability, and ecosystem lock-in together.',
    applicability:
      'Apply when sourcing lakehouse modernization, enterprise analytics foundations, data warehouse offload, Iceberg or Delta adoption, governed self-service analytics, ML/AI data access, cross-cloud sharing, or fragmented data lake consolidation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.databricks.com/product/pricing',
      'https://docs.databricks.com/aws/en/lakehouse',
      'https://docs.databricks.com/aws/en/lakehouse-architecture/security-compliance-and-privacy/best-practices',
      'https://docs.snowflake.com/en/user-guide/tables-iceberg-open-catalog',
      'https://docs.snowflake.com/en/user-guide/opencatalog/overview',
      'https://www.snowflake.com/en/pricing-options/',
      'https://docs.snowflake.com/en/user-guide/security-access-control-overview',
      'https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview',
      'https://learn.microsoft.com/en-us/fabric/onelake/onelake-capacity-consumption',
      'https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/',
      'https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html',
      'https://aws.amazon.com/lake-formation/pricing/',
      'https://aws.amazon.com/glue/pricing/',
      'https://aws.amazon.com/athena/pricing/',
      'https://aws.amazon.com/s3/pricing/',
    ],
    regulatoryChips: ['SOC-2-review', 'ISO-27001-if-required', 'HIPAA-if-PHI', 'FedRAMP-if-public-sector'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-CDP-001', 'PAT-SRC-CAT-ETL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Databricks Lakehouse',
        tier: 'enterprise',
        positioning: 'Lakehouse candidate strongest where data engineering, Spark, SQL, ML/AI, notebooks, Delta, and Unity Catalog need one platform posture.',
        cautions: ['DBU, serverless/pro/classic compute, cloud resources, governance setup, and committed-use terms require workload proof.'],
      },
      {
        vendorName: 'Snowflake Iceberg and Open Catalog',
        tier: 'enterprise',
        positioning: 'Candidate for Snowflake-standardized buyers that want Iceberg/Open Catalog interoperability without abandoning Snowflake governance and SQL ergonomics.',
        cautions: ['Validate read/write semantics, catalog ownership, engine interoperability, region/feature availability, and credit/storage economics.'],
      },
      {
        vendorName: 'Microsoft Fabric OneLake and AWS-native lake stack',
        tier: 'enterprise',
        positioning: 'Fabric fits Microsoft/Power BI/Entra capacity buyers; AWS-native fits modular S3/Glue/Lake Formation/Athena buyers that accept more architecture ownership.',
        cautions: ['Capacity, storage, transaction, Athena/Glue/S3 service charges, and operations burden must be modeled together.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Lakehouse and lake public metering units only',
        model: 'hybrid',
        metric: 'DBUs, Snowflake credits, capacity units, OneLake storage, S3, Glue, Athena scanned data, support, and migration services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Databricks Pricing', url: 'https://www.databricks.com/product/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Fabric Pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'AWS Lake Formation Pricing', url: 'https://aws.amazon.com/lake-formation/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Committed-use discounts, private rate cards, procurement concessions, support tiers, renewal leverage, and cloud-commit offsets require buyer evidence' },
        ],
        confidence: 0.62,
        notes: 'Public pricing identifies metering units, not workload-specific TCO superiority.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Catalog and table-format control',
        buyerPosition: 'Define canonical catalog, table format, read/write rights, cross-engine access, metadata export, and portability obligations.',
      },
      {
        clauseArea: 'Governance, security, and proof obligations',
        buyerPosition: 'Require proof of row/column/tag policy enforcement, audit logs, encryption, private networking, compliance artifacts, and workload-cost visibility.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Open-format and catalog optionality',
        whenToUse: 'Use when vendors claim openness through Delta, Iceberg, Open Catalog, OneLake, Glue, or multi-engine support.',
        buyerAsk: 'Demonstrate read/write interoperability, metadata ownership, policy behavior, exit export, and engine substitution before BAFO.',
      },
      {
        lever: 'Representative workload proof',
        whenToUse: 'Use when a vendor demo does not prove actual BI, ETL, ML, streaming, governance, and sharing economics.',
        buyerAsk: 'Replay buyer scenarios and require cost output, failure recovery notes, policy evidence, and operational burden assessment.',
      },
    ],
    riskFactors: [
      {
        id: 'lakehouse-control-plane-lock-in',
        label: 'Catalog and control-plane lock-in',
        severity: 'high',
        detectionSignals: ['The platform claims open storage while metadata, policies, lineage, or write paths remain tightly bound to one vendor control plane.'],
        mitigations: ['Validate metadata export, policy portability, cross-engine read/write, and exit workflows'],
      },
      {
        id: 'lakehouse-service-sprawl-cost',
        label: 'Distributed service cost sprawl',
        severity: 'medium',
        detectionSignals: ['Storage, compute, catalog, scan, orchestration, governance, support, and networking charges are modeled separately or incompletely.'],
        mitigations: ['Build a full workload bill of materials and run a cost replay before award'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress lineage, entitlement reviews, audit logs, policy inheritance, resilience, exit, and model-risk data controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, encryption, BAA posture, data minimization, de-identification workflows, and auditability.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review sovereign/government cloud posture, FedRAMP where required, accessibility, records obligations, residency, and procurement constraints.',
      },
    ],
    body: `## Summary
A modern lakehouse or data lake platform is not just object storage. It combines storage, table formats, query and processing engines, catalog metadata, access control, lineage, governance, and cost controls. Databricks frames the lakehouse around data lake plus warehouse benefits. Snowflake's Iceberg and Open Catalog direction centers on Apache Iceberg tables and a managed catalog approach. Microsoft Fabric uses OneLake as a tenant-wide logical data lake across Fabric workloads. AWS composes the pattern from S3, Glue Data Catalog, Lake Formation, Athena, EMR, Redshift, and related services. The sourcing question is which control plane should own metadata, policy, and workload orchestration.

## When to apply
Use this pattern for enterprise analytics foundations, lakehouse modernization, data warehouse offload, Iceberg or Delta adoption, governed self-service analytics, ML/AI data access, cross-cloud data sharing, and consolidation of fragmented lakes and warehouses. Do not use it for simple object-storage procurement unless table format, catalog, governance, or compute choices are part of the decision.

## Category boundary
In scope: object storage, Delta/Iceberg/table-format strategy, catalog control plane, SQL and Spark engines, serverless or provisioned compute, notebooks, BI, ETL/ELT, streaming, ML/AI data access, governance policies, lineage, data quality, audit logs, encryption, private networking, interoperability, migration, support, and cost controls. Out of scope: standalone BI tools, standalone ETL, transactional databases, and raw backup/archive storage unless they shape the lakehouse control plane.

## Lifecycle and gates
The scope gate should declare table-format posture, canonical catalog, storage residency, identity provider, regulated data classes, existing cloud commitments, workloads, BI tools, pipeline estate, ML/AI needs, sharing needs, and operations model. The RFP gate should require vendors to show who can read, who can write, who controls metadata, how policies propagate, what happens when compute engines change, and how costs appear. The proof gate should include one BI query set, one ETL/ELT pipeline, one governance policy scenario, one access audit, one schema evolution or table maintenance case, and one multi-engine interoperability test. The BAFO gate should normalize DBUs, credits, capacity units, storage, scans, transactions, support, migration, networking, and committed-use terms.

## Evaluation rubric
Weight governance and catalog fit around 25 percent, workload performance and economics around 25 percent, table-format and interoperability strategy around 15 percent, ecosystem/cloud fit around 15 percent, security/compliance around 10 percent, and operations/exit risk around 10 percent. Increase interoperability weight where the buyer wants Iceberg, Delta, external engines, or cross-cloud portability. Increase governance weight where regulated or customer-sensitive data will be broadly democratized.

## Pricing and contract notes
Public pricing models differ materially. Databricks publishes pay-as-you-go and committed-use approaches for data and AI workloads. Snowflake uses credits and optimized storage, with on-demand and capacity purchasing. Fabric pricing is capacity-based, with OneLake storage and capacity consumption considerations. AWS pricing is distributed across Lake Formation, S3, Glue, Athena, and other services. Lake Formation permissions may not carry a separate charge, but the surrounding storage, catalog, query, ETL, transfer, and support costs still matter. Any committed-use discount, private rate card, cloud-commit offset, support tier, migration credit, or renewal concession remains founder-data-gap unless directly evidenced.

Contracting should define catalog ownership, metadata export, table-format commitments, cross-engine access, security controls, policy portability, audit evidence, incident notification, data residency, encryption and key-management posture, support responsibilities, cost-reporting transparency, and transition assistance. For modular AWS-native approaches, assign accountability across services. For integrated vendors, confirm what remains portable if the buyer later changes engines.

## Contradictions and failure modes
Vendor claim: the platform is open. Detection: test read/write semantics, catalog metadata ownership, policy behavior, table maintenance, and exit export. Vendor claim: the lakehouse lowers cost. Detection: replay BI, ETL, ML, streaming, storage, scan, governance, and support workloads. Vendor claim: governance is unified. Detection: validate row, column, tag, lineage, audit, and cross-engine enforcement with buyer scenarios.

The common failure is treating object storage openness as full platform portability. The second failure is comparing compute rates while ignoring catalog, governance, networking, storage, scans, transactions, and operations burden. The third failure is adopting a lakehouse before deciding whether the enterprise wants Delta, Iceberg, a hybrid strategy, or vendor-managed abstraction as its long-term data contract.`,
  },
  {
    id: 'PAT-SRC-CAT-MDM-001',
    slug: 'master-data-management-sourcing',
    title: 'Master Data Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'MDM sourcing should evaluate the operating model needed to standardize, match, merge, govern, steward, secure, and distribute shared enterprise entities, not just golden-record tooling.',
    applicability:
      'Apply when sourcing enterprise MDM, supplier/customer/product 360, SAP-centered master data governance, or MDM-adjacent governance and catalog programs where duplicate records, source conflicts, compliance-sensitive data, or ERP/CRM/commerce consolidation are material.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/en/data-analytics/topics/master-data-management',
      'https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/key-concepts-and-terms-at-a-glance/key-concepts/master-data',
      'https://www.reltio.com/trust/compliance/',
      'https://www.informatica.com/products/cloud-integration/master-data-management-cloud.html',
      'https://www.informatica.com/products/cloud-integration/pricing.html',
      'https://www.informatica.com/trust-center/certifications-assessments-standards.html',
      'https://semarchy.com/platform/master-data-management/',
      'https://semarchy.com/platform/deployment-options/',
      'https://www.semarchy.com/doc/semarchy-xdm/xdm/latest/Admin/overview.html',
      'https://help.sap.com/doc/bebc74f167e342ce90fe56630a339e35/6.17.latest/en-US/d5/eb955163146572e10000000a423f68/content.htm',
      'https://www.sap.com/products/data-cloud/master-data-governance/pricing.html',
      'https://www.sap.com/about/trust-center/certification-compliance.html',
      'https://learn.microsoft.com/en-us/purview/data-governance-master-data-management-profisee',
      'https://www.microsoft.com/en-us/security/business/risk-management/microsoft-purview-data-governance',
      'https://azure.microsoft.com/en-us/pricing/details/purview/',
    ],
    regulatoryChips: ['GDPR-if-EU-person-data', 'HIPAA-if-PHI', 'SOC-2-review', 'SOX-if-financial-master-data'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-FAB-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Informatica MDM and Reltio',
        tier: 'enterprise',
        positioning: 'Enterprise and multidomain MDM candidates where customer, product, supplier, finance, reference, and relationship data must be matched, governed, and distributed.',
        cautions: ['AI match claims, pricing units, implementation services, and stewardship adoption require proof on buyer data.'],
      },
      {
        vendorName: 'Semarchy xDM and SAP Master Data Governance',
        tier: 'enterprise',
        positioning: 'Candidates for configurable multidomain MDM and SAP-centered governance, change-request, approval, activation, and distribution workflows.',
        cautions: ['SAP fit is strongest where SAP process ownership is central; non-SAP domains and integrations still need proof.'],
      },
      {
        vendorName: 'Microsoft Purview with MDM partner architecture',
        tier: 'specialist',
        positioning: 'Governance/catalog/lineage layer relevant to MDM architecture, but not a like-for-like dedicated MDM platform by itself.',
        cautions: ['Treat Purview as MDM-adjacent unless paired with dedicated MDM or buyer-built master-data services.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'MDM public pricing posture and consumption-unit anchors',
        model: 'hybrid',
        metric: 'Domains, records, processing units, governed assets, deployment model, services, support, and implementation scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Informatica Pricing', url: 'https://www.informatica.com/products/cloud-integration/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'SAP Master Data Governance Pricing', url: 'https://www.sap.com/products/data-cloud/master-data-governance/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Purview Pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/purview/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated rates, discounts, implementation services, migration costs, connector costs, renewal terms, and private marketplace offers require buyer evidence' },
        ],
        confidence: 0.6,
        notes: 'Public sources identify pricing constructs, not full enterprise MDM TCO or implementation economics.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Master data stewardship and auditability',
        buyerPosition: 'Define stewardship workflows, approvals, audit trails, survivorship overrides, data-owner accountability, and downstream distribution obligations.',
      },
      {
        clauseArea: 'Match/merge proof and data portability',
        buyerPosition: 'Require match-rule transparency, lineage to source systems, exportable mastered records, transition support, and deletion or correction workflows.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Proof dataset calibration',
        whenToUse: 'Use when vendors claim high match quality or rapid implementation.',
        buyerAsk: 'Run buyer-supplied duplicate, conflicting, and hierarchy scenarios before BAFO and score false positives, false negatives, steward workload, and lineage clarity.',
      },
      {
        lever: 'Domain-scope phasing',
        whenToUse: 'Use when vendors price or scope broad multidomain programs before ownership is mature.',
        buyerAsk: 'Phase contract commitments by domain acceptance, stewardship adoption, and downstream distribution success.',
      },
    ],
    riskFactors: [
      {
        id: 'mdm-operating-model-gap',
        label: 'MDM operating-model gap',
        severity: 'high',
        detectionSignals: ['The buyer cannot name data owners, survivorship rules, exception workflow, or source-of-truth decisions.'],
        mitigations: ['Require stewardship model and proof dataset before award'],
      },
      {
        id: 'mdm-match-quality-overclaim',
        label: 'Match-quality overclaim',
        severity: 'medium',
        detectionSignals: ['Vendor describes AI or fuzzy matching without buyer-data false-positive/false-negative evidence.'],
        mitigations: ['Test matching on known duplicate and conflicting records with human steward review'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress legal entity, customer, counterparty, reference data, audit, lineage, SOX where applicable, and model-risk data controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review patient/member/provider/entity identity, PHI boundaries, BAA posture, correction workflows, and minimum-necessary distribution.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Stress product, supplier, location, loyalty/customer, hierarchy, item setup, and commerce/PIM/ERP distribution workflows.',
      },
    ],
    body: `## Summary
Master data management is a technology-enabled business discipline, not merely a database or golden-record tool. The buyer is trying to make shared entities such as customer, supplier, product, location, asset, finance, material, and reference data uniform, accurate, stewarded, governed, semantically consistent, accountable, and distributable. That means the sourcing event should evaluate operating model and tooling together.

## When to apply
Use this pattern when sourcing enterprise MDM, customer 360, supplier 360, product 360, SAP-centered master data governance, reference data management, or MDM-adjacent governance programs. It is especially relevant when duplicate records, conflicting source systems, ERP/CRM/commerce consolidation, compliance-sensitive data, AI readiness, or data-quality initiatives depend on shared entity definitions.

## Category boundary
In scope: entity domains, source-system ingestion, standardization, match and merge, survivorship, manual stewardship, hierarchy management, approval workflow, exception queues, audit trails, data quality, governance/catalog integration, downstream distribution, APIs, security, compliance evidence, deployment model, implementation services, and migration. Out of scope: pure data catalog, pure ETL, CRM record management, PIM-only workflow, or data quality tooling unless mastered entities and stewardship workflows are central.

## Lifecycle and gates
The scope gate should define domains, data owners, source systems, critical downstream consumers, regulated fields, current duplicate/conflict rates, and the first source-of-truth decisions. The RFP gate should require buyer-authored scenarios: duplicate supplier onboarding, conflicting tax IDs, customer householding, product hierarchy changes, material master approval, manual override, source correction, downstream sync, and audit review. The proof gate should use a buyer-supplied dataset and score false positives, false negatives, steward effort, merge explainability, survivorship, lineage, and distribution behavior. The BAFO gate should normalize domains, record volumes, connectors, governance integrations, services, support, migration, and renewal terms.

## Evaluation rubric
Weight domain fit and data-model flexibility around 20 percent, match/merge and survivorship around 20 percent, stewardship workflow around 15 percent, governance/security/compliance around 15 percent, integration and distribution around 15 percent, implementation/adoption risk around 10 percent, and commercial transparency around 5 percent. Increase SAP process weight where SAP MDG and ERP change-request workflows are central. Increase catalog/governance weight where Microsoft Purview, Collibra, Informatica, or enterprise policy layers must own glossary, lineage, and access context.

## Pricing and contract notes
Commercial model is often opaque unless verified. Informatica publicly describes Informatica Processing Units and consumption-based concepts. SAP publishes an MDG pricing page, but enterprise scope can still depend on licensing context and implementation design. Microsoft publishes Purview pricing concepts for governed assets and processing units, which are MDM-adjacent rather than a dedicated MDM platform quote. Reltio, Semarchy, and enterprise MDM deals often require sales engagement, private offer, or quote context. Negotiated rates, discounts, implementation services, migration cost, connector cost, renewal terms, and marketplace terms remain founder-data-gap without buyer evidence.

Contracting should define stewardship workflow, auditability, role access, security artifacts, data export, deletion/correction workflows, connector responsibility, downstream distribution SLAs, implementation acceptance, transition assistance, and remediation if match quality or workflow adoption does not meet agreed proof criteria.

## Contradictions and failure modes
Vendor claim: AI matching creates the golden record. Detection: test on buyer data and measure false positives, false negatives, override process, and explainability. Vendor claim: implementation is fast. Detection: require data-owner decisions, source-system mapping, stewardship workflow, and downstream distribution proof. Vendor claim: governance is integrated. Detection: confirm glossary, lineage, policy, audit, and quality workflows in the buyer's environment.

The common failure is buying an MDM tool before the organization agrees on ownership, survivorship, source-of-truth rules, and exception handling. The second is piloting on clean demo data rather than messy source records. The third is underpricing implementation and stewardship change management relative to subscription cost.`,
  },
  {
    id: 'PAT-SRC-CAT-FAB-001',
    slug: 'data-fabric-governance-layer-sourcing',
    title: 'Data Fabric Governance Layer Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Data catalog and governance platforms should be sourced as a metadata, policy, lineage, quality, access, and AI-readiness control layer across distributed data estates, not as a generic catalog checkbox.',
    applicability:
      'Apply when sourcing products that make distributed enterprise data findable, governable, policy-aware, and analytics or AI-ready across cloud, on-prem, SaaS, BI, lakehouse, warehouse, and operational environments.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://learn.microsoft.com/en-us/azure/purview/overview',
      'https://learn.microsoft.com/en-us/purview/data-governance-plan',
      'https://learn.microsoft.com/en-us/purview/data-governance-billing',
      'https://azure.microsoft.com/en-us/pricing/details/purview/',
      'https://www.collibra.com/collibra-data-intelligence-cloud',
      'https://www.collibra.com/company/trust-center',
      'https://productresources.collibra.com/docs/release-notes/Content/Catalog/to_catalog.htm',
      'https://www.collibra.com/resources/collibra-units-cus',
      'https://www.informatica.com/products/data-governance/cloud-data-governance-and-catalog.html',
      'https://www.informatica.com/products/cloud-integration/pricing.html',
      'https://www.informatica.com/trust-center.html',
      'https://www.ibm.com/products/knowledge-catalog',
      'https://www.ibm.com/products/cloud-pak-for-data',
      'https://www.ibm.com/products/cloud/pricing',
      'https://www.alation.com/product-overview/',
      'https://www.alation.com/product/data-governance/',
      'https://www.alation.com/pricing/',
      'https://www.alation.com/alation-trust-center/',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'HIPAA-if-PHI', 'SOC-2-review', 'FedRAMP-if-public-sector'],
    relatedPatternIds: ['PAT-SRC-CAT-MDM-001', 'PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-LAKE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Microsoft Purview and Collibra',
        tier: 'enterprise',
        positioning: 'Governance/catalog candidates for metadata harvesting, business glossary, data products, domains, lineage, access workflows, and policy-aware discovery.',
        cautions: ['Lineage depth, policy enforcement, data samples, AI features, and pricing meters must be validated by use case.'],
      },
      {
        vendorName: 'Informatica IDMC and IBM Knowledge Catalog / Cloud Pak for Data',
        tier: 'enterprise',
        positioning: 'Data governance fabric candidates where metadata, catalog, quality, policy, lifecycle governance, and hybrid estate coverage matter.',
        cautions: ['Service mix, consumption units, deployment model, and trust packet access require quote and vendor packet review.'],
      },
      {
        vendorName: 'Alation',
        tier: 'specialist',
        positioning: 'Data catalog and governance candidate with active metadata, search/discovery, lineage, trust, quality integrations, and stewardship workflows.',
        cautions: ['Public pricing is quote-led; AI and productivity claims require buyer proof.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Data fabric governance public pricing posture',
        model: 'hybrid',
        metric: 'Governed assets, processing units, platform units, users, connectors, lineage jobs, quality scans, services, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Purview Data Governance Billing', url: 'https://learn.microsoft.com/en-us/purview/data-governance-billing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Informatica Pricing', url: 'https://www.informatica.com/products/cloud-integration/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Alation Pricing', url: 'https://www.alation.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated enterprise pricing, implementation services, renewal terms, private marketplace credits, and true TCO require buyer evidence' },
        ],
        confidence: 0.61,
        notes: 'Public sources identify billing constructs and quote posture; they do not prove enterprise TCO or productivity value.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Metadata, samples, and policy data handling',
        buyerPosition: 'Define what metadata, profiles, samples, lineage, glossaries, policies, AI prompts, and usage telemetry the vendor stores or processes.',
      },
      {
        clauseArea: 'Governance workflow and access enforcement',
        buyerPosition: 'Require clarity on advisory workflow versus actual enforcement, connected-system dependencies, audit logs, policy inheritance, and request approvals.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Connector and lineage proof',
        whenToUse: 'Use when vendors claim broad data fabric coverage.',
        buyerAsk: "Demonstrate scans, lineage, glossary mapping, quality signal, and policy workflow across the buyer's highest-risk warehouse, lakehouse, BI, SaaS, and on-prem systems.",
      },
      {
        lever: 'AI-readiness evidence',
        whenToUse: 'Use when vendors pitch AI governance, natural-language search, semantic graph, or agent readiness.',
        buyerAsk: 'Map AI claims to concrete model inventories, data-product workflows, policy inheritance, lineage, evaluation evidence, and data-use controls.',
      },
    ],
    riskFactors: [
      {
        id: 'fabric-metadata-without-governance',
        label: 'Metadata inventory without operational governance',
        severity: 'high',
        detectionSignals: ['The catalog scans assets but cannot drive ownership, policy, access, quality, lineage, or stewardship workflows.'],
        mitigations: ['Require domain, data product, access, lineage, and quality scenarios before award'],
      },
      {
        id: 'fabric-ai-readiness-overclaim',
        label: 'AI-readiness overclaim',
        severity: 'medium',
        detectionSignals: ['Vendor markets AI readiness without concrete model inventory, data-use controls, policy inheritance, lineage, or evaluation workflows.'],
        mitigations: ['Score AI claims only when linked to proof artifacts and governance workflows'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress lineage, access policy, critical data elements, risk reporting, audit evidence, model/data governance, and third-party-risk artifacts.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI classification, access requests, lineage, data minimization, DSR support, auditability, and BAA-adjacent workflows.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review FedRAMP where required, records obligations, data residency, accessibility, procurement constraints, and public transparency requirements.',
      },
    ],
    body: `## Summary
Data fabric sourcing should begin with the control-plane problem: can the buyer understand, govern, and safely reuse distributed data without centralizing every dataset? The category includes metadata capture, search, discovery, business glossary, lineage, classification, quality signals, governance workflows, access requests, data products, policy context, and AI-readiness claims. A catalog entry alone is not enough.

## When to apply
Use this pattern when sourcing data catalog, data governance, data fabric, active metadata, access workflow, lineage, quality, or AI-governance platforms across cloud, on-prem, SaaS, BI, warehouse, lakehouse, and operational systems. It is strongest for regulated enterprises, multi-cloud estates, federated stewardship, fragmented catalogs, lineage gaps, and AI programs that require governed context.

## Category boundary
In scope: technical metadata, business metadata, operational metadata, glossary, critical data elements, data products, catalog scans, lineage, quality, classification, policy workflows, access requests, marketplace/discovery, stewardship ownership, audit logs, trust artifacts, AI governance, semantic context, and connector coverage. Out of scope: pure MDM, pure ETL, pure warehouse, pure BI, and pure security posture tools unless their metadata and governance workflows are central to the sourcing event.

## Lifecycle and gates
The scope gate should define systems to scan, data domains, governance owners, regulated fields, lineage depth, access workflow, AI use cases, deployment model, and whether enforcement is advisory or integrated into connected platforms. The RFP gate should require demonstrations across the buyer's highest-risk warehouse, lakehouse, BI, SaaS, and on-prem systems. The proof gate should test scan freshness, lineage depth, glossary workflow, data-product publication, policy request, quality signal, access approval, sensitive-data classification, and an AI-readiness workflow. The BAFO gate should normalize governed assets, processing units, users, connectors, lineage jobs, quality scans, services, support, and renewal terms.

## Evaluation rubric
Weight metadata and connector coverage around 20 percent, lineage and quality depth around 15 percent, business governance workflow around 20 percent, access and policy model around 15 percent, security/trust/compliance around 10 percent, AI-readiness evidence around 10 percent, and pricing/TCO transparency around 10 percent. Increase lineage and audit weight for financial services, healthcare, public sector, insurance, energy, and other regulated contexts.

## Pricing and contract notes
Public pricing visibility is mixed. Microsoft publishes Purview data-governance billing concepts such as governed assets and processing units. Informatica publicly describes Informatica Processing Units and usage dashboards. Alation's public pricing flow is quote-led. Collibra and IBM public materials describe platform value and enterprise packaging, but customer-specific cost often requires vendor engagement. Do not infer negotiated enterprise pricing, implementation services, renewal terms, private marketplace credits, or true TCO without buyer evidence.

Contracting should define metadata and sample-data handling, profiling, lineage storage, AI data use, access logs, audit evidence, incident notification, subprocessors, data residency, security reports, role access, export, deletion, and transition assistance. If access policy is advisory rather than enforced, the contract and solution design should say so explicitly.

## Contradictions and failure modes
Vendor claim: we provide a data fabric. Detection: test connected-system coverage, lineage depth, policy workflow, data quality, and stewardship behavior. Vendor claim: AI-ready data. Detection: map AI claims to model inventory, data-product workflow, policy inheritance, lineage, usage logs, and evaluation evidence. Vendor claim: governance is unified. Detection: verify what is automated, manually curated, merely advisory, or actually enforced.

The common failure is buying a searchable catalog that does not change ownership, access, quality, or policy behavior. The second is overvaluing AI discovery before metadata, lineage, and data-quality signals are trustworthy. The third is underestimating implementation work: connectors, glossary terms, domains, owners, access policies, and stewardship workflows require real operating commitment.`,
  },
  {
    id: 'PAT-SRC-CAT-ETL-001',
    slug: 'etl-elt-data-integration-platform-sourcing',
    title: 'ETL/ELT and Data Integration Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'ETL/ELT sourcing should be evaluated as a tradeoff among pricing exposure, deployment and control model, connector depth, transformation and orchestration fit, security posture, and cloud or semantic-layer lock-in.',
    applicability:
      'Apply when sourcing managed ELT, ETL, reverse ETL, transformation, orchestration, and cloud-native data integration platforms such as Fivetran, Matillion, Informatica, Airbyte, dbt Cloud, AWS Glue, and Azure Data Factory.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.fivetran.com/pricing',
      'https://fivetran.com/docs/core-concepts/usage-based-pricing',
      'https://fivetran.com/docs/security',
      'https://www.matillion.com/pricing',
      'https://www.matillion.com/trust-center',
      'https://www.informatica.com/products/cloud-integration/pricing.html',
      'https://www.informatica.com/trust-center.html',
      'https://airbyte.com/pricing',
      'https://support.airbyte.com/hc/en-us/articles/15947202218907-Securing-Airbyte-Cloud',
      'https://www.getdbt.com/pricing',
      'https://www.getdbt.com/security',
      'https://aws.amazon.com/glue/pricing/',
      'https://docs.aws.amazon.com/glue/latest/dg/security.html',
      'https://azure.microsoft.com/en-us/pricing/details/data-factory/',
      'https://learn.microsoft.com/en-us/security/benchmark/azure/baselines/data-factory-security-baseline',
    ],
    regulatoryChips: ['SOC-2-review', 'ISO-27001-if-required', 'HIPAA-if-PHI', 'GDPR-if-person-data'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-LAKE-001', 'PAT-SRC-CAT-FAB-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Fivetran and Airbyte',
        tier: 'specialist',
        positioning: 'Managed and open-source-oriented ELT candidates strongest when data movement, connector reliability, CDC, and source/destination coverage are central.',
        cautions: ['Connector count does not prove production-grade fit; pricing meters and self-hosting operations require workload proof.'],
      },
      {
        vendorName: 'Matillion, Informatica, and dbt Cloud',
        tier: 'enterprise',
        positioning: 'Transformation and enterprise integration candidates spanning visual ETL/ELT, broad data management, and SQL-centric transformation workflows.',
        cautions: ['Separate extraction, transformation, orchestration, quality, catalog, support, and implementation responsibilities before comparing cost.'],
      },
      {
        vendorName: 'AWS Glue and Azure Data Factory',
        tier: 'enterprise',
        positioning: 'Hyperscaler-native integration services strongest where IAM, networking, procurement, storage, and compute already sit inside AWS or Azure.',
        cautions: ['Cloud-native entry price can hide engineering time, compute, orchestration, network, monitoring, and warehouse costs.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Data integration public pricing meters only',
        model: 'hybrid',
        metric: 'Monthly active rows, credits, IPUs, DPU-hours, vCore-hours, seats, data workers, activities, runs, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Fivetran Pricing', url: 'https://www.fivetran.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Airbyte Pricing', url: 'https://airbyte.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'AWS Glue Pricing', url: 'https://aws.amazon.com/glue/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure Data Factory Pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/data-factory/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated enterprise quotes, discounts, committed spend, renewal terms, support uplifts, and implementation costs require buyer evidence' },
        ],
        confidence: 0.67,
        notes: 'Do not rank cheapest without workload traces and cloud/warehouse cost modeling.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Connector reliability and change handling',
        buyerPosition: 'Define connector support, API-change response, schema drift, backfill, resync, CDC, historical load, incident process, and connector deprecation notice.',
      },
      {
        clauseArea: 'Security and data movement controls',
        buyerPosition: 'Pin SSO, RBAC, SCIM, audit logs, private networking, secrets handling, encryption, compliance reports, region/residency, and support-access boundaries.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'High-risk connector proof',
        whenToUse: 'Use before BAFO when vendors claim broad connector coverage.',
        buyerAsk: 'Test three high-risk sources for API limits, schema drift, backfill, CDC, error handling, and lineage into the target warehouse or lakehouse.',
      },
      {
        lever: 'Pricing-meter normalization',
        whenToUse: 'Use when vendors price by MAR, credits, IPUs, DPUs, vCores, seats, workers, or custom quotes.',
        buyerAsk: 'Map each meter to observed current and forecast workload, including cloud compute, warehouse impact, support, and internal operations.',
      },
    ],
    riskFactors: [
      {
        id: 'etl-connector-demo-gap',
        label: 'Connector demo gap',
        severity: 'high',
        detectionSignals: ['Vendor lists a connector but cannot prove required tables, sync modes, schema drift, historical load, or CDC behavior.'],
        mitigations: ['Run proof workload against high-risk production-like sources before award'],
      },
      {
        id: 'etl-meter-surprise',
        label: 'Pricing meter surprise',
        severity: 'medium',
        detectionSignals: ['Rows, credits, DPUs, vCores, seats, or workers scale in a way the buyer cannot forecast.'],
        mitigations: ['Require workload trace model, caps, alerts, and forecast review before BAFO'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress private networking, audit logs, change control, lineage, data residency, secrets handling, and regulated source-system access.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI boundaries, BAA posture, encryption, minimum necessary movement, audit logs, and downstream destination restrictions.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Model high-volume commerce, loyalty, inventory, supplier, and advertising feeds with backfill and schema-drift scenarios.',
      },
    ],
    body: `## Summary
ETL and ELT sourcing should start with workload shape. A buyer moving many SaaS application tables into Snowflake or BigQuery has a different risk profile from a buyer transforming large semi-structured files in S3, modernizing SSIS, governing enterprise data quality, or standardizing SQL transformation. The first qualification question is whether the job is managed extraction and loading, visual ETL, cloud-native batch processing, SQL transformation, reverse ETL, or broad enterprise data management.

## When to apply
Use this pattern for managed ELT, ETL, reverse ETL, transformation, orchestration, connector modernization, and cloud-native data integration decisions. It fits Fivetran, Airbyte, Matillion, Informatica, dbt Cloud, AWS Glue, Azure Data Factory, and similar comparisons. Do not use it as the main pattern for warehouse, lakehouse, BI, MDM, or catalog selection unless integration workloads drive the decision.

## Category boundary
In scope: connectors, CDC, source APIs, destinations, schema drift, historical backfill, resync, orchestration, transformations, dbt/SQL workflow, visual ETL, Spark/serverless jobs, private networking, secrets, audit logs, SSO/RBAC/SCIM, compliance reports, cloud compute, warehouse impact, support, and implementation services. Out of scope: pure BI, pure catalog, pure MDM, application integration/iPaaS, and event streaming unless they are part of the same data movement decision.

## Lifecycle and gates
The scope gate should classify required sources, destinations, sync modes, data volumes, change frequency, latency targets, regulated fields, transformation ownership, cloud affinity, and operational support model. The RFP gate should map each vendor's public pricing meter to the buyer's observed usage. The proof gate should test three high-risk sources, including API limits, schema drift, historical backfill, CDC or incremental load, error handling, private networking, and lineage into the target platform. The BAFO gate should normalize row, credit, IPU, DPU, vCore, worker, activity/run, seat, support, cloud compute, warehouse, and internal engineering costs.

## Evaluation rubric
Weight connector fit around 25 percent, pricing predictability around 20 percent, deployment/control model around 15 percent, transformation/orchestration fit around 15 percent, security/compliance around 15 percent, and lock-in/exit risk around 10 percent. Increase security weight for regulated data. Increase operations weight when self-managed OSS or cloud-native services shift responsibility to the buyer. Increase transformation fit where dbt, SQL models, Spark, legacy ETL, or visual orchestration are the core job.

## Pricing and contract notes
Public pricing meters differ. Fivetran publicly describes usage-based pricing around monthly active rows and transformation model runs. Airbyte publishes open-source, cloud, volume, and capacity-oriented paths. Matillion uses credit-based pricing and editions. Informatica describes consumption pricing through Informatica Processing Units. dbt Cloud publishes free, starter, and enterprise paths. AWS Glue uses DPU-hour and related meters. Azure Data Factory pricing varies across orchestration, data movement, data flow execution, operations, and region. Negotiated enterprise quotes, discounts, support SLAs, committed spend, renewal terms, marketplace terms, professional services, and implementation costs are founder-data-gap unless supplied by buyer evidence.

Contracting should define connector support, API-change response, schema-drift handling, service credits, support access, incident response, audit logs, private networking, secrets handling, encryption, region/residency, export, deletion, and transition assistance. For open-source or cloud-native approaches, explicitly price internal engineering and operational burden.

## Contradictions and failure modes
Vendor claim: we have the connector. Detection: test required objects, sync modes, schema drift, historical load, CDC, API limits, and resync behavior. Vendor claim: we are cheapest. Detection: model rows, credits, DPUs, vCores, workers, seats, runs, cloud compute, warehouse impact, support, and engineering time. Vendor claim: compliance is covered. Detection: verify exact report scope, product scope, region, private networking, logging, secrets, and support access.

The common failure is ranking vendors by connector count rather than production-grade connector behavior. The second is ignoring how pricing meters scale with workload. The third is forgetting that managed SaaS may reduce connector maintenance while open-source or cloud-native tools can shift cost into people, infrastructure, and monitoring.`,
  },
  {
    id: 'PAT-SRC-CAT-REV-001',
    slug: 'revenue-intelligence-platform-sourcing',
    title: 'Revenue Intelligence Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Revenue intelligence sourcing should test whether forecast, activity, call, email, meeting, CRM, and pipeline signals change the revenue operating cadence, not whether a vendor can produce impressive executive dashboards.',
    applicability:
      'Apply when sourcing revenue intelligence, RevOps, forecasting, pipeline inspection, deal-risk scoring, activity capture, conversation intelligence, or revenue orchestration platforms around Salesforce, HubSpot, Dynamics, or adjacent CRM estates.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/revenue-intelligence',
      'https://www.gartner.com/en/documents/5579027',
      'https://www.forrester.com/report/the-forrester-wave-tm-revenue-orchestration-platforms-for-b2b-q3-2024/RES181226',
      'https://www.salesforce.com/sales/revenue-intelligence/',
      'https://www.gong.io/revenue-intelligence',
      'https://help.gong.io/docs/explainer-about-deal-likelihood-scores',
      'https://support.outreach.io/support/solutions/articles/159000425531',
      'https://www.clari.com/pricing/',
      'https://www.sec.gov/Archives/edgar/data/1794515/000179451525000075/zoominfo10k2024printvf.pdf',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'CCPA-if-California-personal-information', 'recording-consent-review', 'SOC-2-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-BI-001', 'PAT-SRC-CAT-COMM-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'customer_facing',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Clari',
        tier: 'enterprise',
        positioning: 'Revenue platform candidate associated with forecasting, pipeline inspection, mutual action, revenue cadence, and RevOps operating workflows.',
        cautions: ['Public pricing posture is quote-led; value claims require buyer adoption and forecast-process proof.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Clari Pricing', url: 'https://www.clari.com/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Gong',
        tier: 'enterprise',
        positioning: 'Revenue intelligence and conversation intelligence candidate using calls, emails, CRM activity, deal signals, and coaching workflows.',
        cautions: ['Call and email capture creates privacy, consent, security, retention, and adoption scrutiny.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Gong Revenue Intelligence', url: 'https://www.gong.io/revenue-intelligence', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Salesforce Revenue Intelligence and Outreach',
        tier: 'enterprise',
        positioning: 'CRM-native and sales-execution candidates when the buyer wants pipeline, forecast, and seller workflow closer to the core sales stack.',
        cautions: ['Native adjacency does not prove forecasting discipline, seller adoption, or objective deal-risk scoring.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Revenue intelligence quote-led commercial posture',
        model: 'subscription',
        metric: 'Seller, manager, RevOps, forecasting, conversation, AI, integration, support, and services scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Clari Pricing', url: 'https://www.clari.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Salesforce Revenue Intelligence', url: 'https://www.salesforce.com/sales/revenue-intelligence/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated seat tiers, bundled modules, implementation services, renewal terms, and forecast-value evidence require buyer quotes or AbarVa benchmarks' },
        ],
        confidence: 0.56,
        notes: 'Use public pages to identify packaging posture only. Do not infer per-seat price, discount, ROI, or payback without proposal evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Communication capture and privacy controls',
        buyerPosition: 'Define email, calendar, meeting, call, transcript, recording, buyer-contact, retention, deletion, consent, subprocessor, and support-access controls.',
      },
      {
        clauseArea: 'CRM integration and data-use boundary',
        buyerPosition: 'Require exact CRM objects, fields, writeback behavior, model-training posture, AI-output logging, and admin/audit evidence before award.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Forecast cadence proof',
        whenToUse: 'Use when vendors claim better forecast accuracy or revenue predictability.',
        buyerAsk: 'Run scripted forecast-call, slipped-deal, manager-inspection, and commit-change workflows using buyer CRM fields and anonymized activity data.',
      },
      {
        lever: 'Seat and module segmentation',
        whenToUse: 'Use when proposals blend reps, managers, executives, RevOps, conversation intelligence, forecasting, and AI modules.',
        buyerAsk: 'Separate required users, read-only users, admin users, call-capture users, forecasting users, AI features, integrations, and services in the price schedule.',
      },
    ],
    riskFactors: [
      {
        id: 'revintel-crm-hygiene-dependency',
        label: 'CRM hygiene dependency',
        severity: 'high',
        detectionSignals: ['The model relies on opportunity stages, close dates, owners, amounts, activities, or fields the buyer does not maintain consistently.'],
        mitigations: ['Require pre-award data-quality assessment and post-award operating cadence owners'],
      },
      {
        id: 'revintel-surveillance-backlash',
        label: 'Seller surveillance backlash',
        severity: 'medium',
        detectionSignals: ['Reps perceive activity capture, call analysis, or coaching scores as punitive rather than operationally useful.'],
        mitigations: ['Define change-management, consent, manager enablement, and acceptable-use rules before rollout'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Review regulated communications capture, supervision, retention, data residency, and model-output auditability.',
      },
      {
        industry: 'healthcare',
        modifier: 'Avoid PHI capture in calls, emails, CRM notes, transcripts, or AI summaries unless privacy counsel approves the boundary.',
      },
      {
        industry: 'telecommunications',
        modifier: 'Test enterprise account hierarchies, channel partner motion, renewal/expansion workflows, and long-cycle forecasting cadence.',
      },
    ],
    body: `## Summary
Revenue intelligence sourcing sits between CRM, sales management, sales engagement, conversation intelligence, forecasting, and BI. The category promises to make pipeline, commit calls, deal risk, seller activity, buyer engagement, and revenue cadence more inspectable than standard CRM reporting. That promise is credible only when the buyer can prove the platform changes management behavior, not merely when it produces attractive dashboards.

## When to apply
Use this pattern when a B2B sales organization has complex pipeline, board-level forecast pressure, subjective manager calls, weak CRM hygiene, fragmented call and email signals, high seller headcount, account-based motions, or recurring slipped deals. It applies to Clari, Gong, Salesforce Revenue Intelligence, Outreach forecasting, revenue orchestration platforms, and adjacent RevOps tools. Do not use it as the primary pattern for core CRM, generic BI, CPQ, billing, marketing attribution, or customer success unless forecast, pipeline, or revenue execution is the core buying job.

## Category boundary
In scope: pipeline inspection, forecast categories, commit and best-case movement, deal health, activity capture, call/email/calendar signals, conversation intelligence, next-step guidance, manager coaching, RevOps analytics, CRM writeback, account health, executive forecasting, AI scoring, and revenue-cadence workflows. Out of scope: pure sales engagement sequences, contact data, CRM replacement, finance revenue recognition, quote-to-cash, marketing attribution, and generic dashboards that do not affect seller or manager behavior.

## Lifecycle and gates
The scope gate should identify the forecast owner, CRM source of truth, sales stages, required fields, data-quality gaps, capture sources, privacy boundaries, buyer-consent expectations, and manager operating cadence. The RFP gate should require vendors to map how their signals are generated, how recommendations are explained, which CRM objects are read or written, and how activity capture works. The proof gate should run scripted workflows: slipped enterprise deal, stale opportunity, forecast downgrade, missing economic buyer, manager inspection, renewal expansion, and executive forecast rollup. The BAFO gate should normalize seller seats, manager seats, RevOps/admin seats, read-only executive users, conversation modules, forecasting modules, AI features, integrations, support, implementation, training, and renewal protections.

## Evaluation rubric
Weight CRM and activity-data fit around 20 percent, forecast and pipeline workflow around 25 percent, manager and seller adoption around 20 percent, privacy/security/compliance around 15 percent, commercial clarity around 10 percent, and AI explainability/exit risk around 10 percent. Raise privacy weight when email, calendar, meeting recordings, or transcripts are captured. Raise adoption weight when the sales culture already resists CRM hygiene or manager inspection.

## Pricing and contract notes
Public pages and analyst summaries support category framing but not enterprise net economics. Clari's public pricing page is tailored/quote-led. Salesforce and Gong public materials describe revenue intelligence capabilities. Outreach public support content describes forecasting and pipeline management concepts. None of those sources prove a buyer's negotiated price, discount, implementation cost, payback, forecast-accuracy lift, or adoption rate. Those fields remain founder-data-gap unless AbarVa has buyer proposals, invoices, usage exports, or approved benchmarks.

Contracting should focus on communication capture, consent, retention, deletion, data export, CRM writeback, support access, model-training restrictions, subprocessors, audit logs, incident response, and renewal protections. If calls or emails may include regulated data, legal review is mandatory before the vendor can be treated as low-risk.

## Contradictions and failure modes
Vendor claim: AI predicts revenue. Detection: require explainability, input-field inventory, historical backtest method, exception workflow, and buyer-specific validation. Vendor claim: reps will adopt it. Detection: test manager cadence, rep workflow, mobile/email integration, coaching usage, and CRM writeback. Vendor claim: it fixes forecast accuracy. Detection: separate tool capability from operating discipline, pipeline definitions, data hygiene, and leadership behavior.

The common failure is buying an overlay on dirty CRM data and then blaming the tool when forecasts remain subjective. The second is treating surveillance-like activity capture as a neutral productivity feature. The third is measuring success by dashboards published instead of decisions changed: earlier deal intervention, cleaner forecast calls, fewer stale opportunities, and clearer commit accountability.`,
  },
  {
    id: 'PAT-SRC-CAT-BI-001',
    slug: 'governed-business-intelligence-platform-sourcing',
    title: 'Governed Business Intelligence Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'BI sourcing should shift the competition from dashboard aesthetics to governed metrics, adoption economics, semantic control, embedded analytics rights, and downstream compute exposure.',
    applicability:
      'Apply when sourcing business intelligence, analytics, dashboarding, semantic-layer, embedded analytics, or self-service analytics platforms such as Power BI, Tableau, Looker, Sigma, and ThoughtSpot.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/analytics-business-intelligence-platforms',
      'https://www.microsoft.com/en/power-platform/products/power-bi/pricing',
      'https://www.tableau.com/pricing',
      'https://docs.cloud.google.com/looker/docs/looker-core-overview',
      'https://www.thoughtspot.com/pricing',
      'https://help.sigmacomputing.com/docs/about-sigma',
      'https://www.sigmacomputing.com/product/t-architecture',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'HIPAA-if-PHI', 'SOX-if-financial-reporting', 'SOC-2-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-FAB-001', 'PAT-SRC-CAT-ETL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'data_analytics',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Microsoft Power BI and Fabric',
        tier: 'enterprise',
        positioning: 'BI and analytics candidate strongest where Microsoft 365, Azure, Fabric, Entra, and enterprise licensing alignment matter.',
        cautions: ['Per-user and capacity economics, Fabric interactions, and viewer licensing must be modeled together.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Power BI Pricing', url: 'https://www.microsoft.com/en/power-platform/products/power-bi/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Tableau',
        tier: 'enterprise',
        positioning: 'Visual analytics candidate with Cloud, Server, role-based licenses, enterprise editions, and Tableau Next/agentic analytics positioning.',
        cautions: ['Creator, Explorer, Viewer, Server, Tableau+, Data Cloud, and agentic analytics packaging must be normalized.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Tableau Pricing', url: 'https://www.tableau.com/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Looker, Sigma, and ThoughtSpot',
        tier: 'specialist',
        positioning: 'Governed semantic, warehouse-native, embedded, and search/AI analytics candidates where self-service and data-platform alignment drive the event.',
        cautions: ['Warehouse compute, semantic ownership, embedded rights, and custom enterprise pricing can dominate the headline license comparison.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'BI public pricing posture and packaging only',
        model: 'hybrid',
        metric: 'Role seats, capacity, embedded analytics, semantic layer, AI features, support, training, non-production instances, and data-platform compute',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Power BI Pricing', url: 'https://www.microsoft.com/en/power-platform/products/power-bi/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Tableau Pricing', url: 'https://www.tableau.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ThoughtSpot Pricing', url: 'https://www.thoughtspot.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated enterprise price, embedded external-user economics, warehouse compute, implementation cost, and renewal uplift require buyer evidence' },
        ],
        confidence: 0.64,
        notes: 'Public pages identify licensing constructs, not buyer-specific TCO or value.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Embedded analytics and external users',
        buyerPosition: 'Define internal versus external users, white-label rights, SSO, tenant isolation, API limits, caching, export, and customer-facing SLA boundaries.',
      },
      {
        clauseArea: 'Governed metrics and data access',
        buyerPosition: 'Require semantic definitions, lineage, row-level security, audit logs, data export, workspace ownership, and content portability commitments.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Usage telemetry normalization',
        whenToUse: 'Use during renewal or consolidation when seat sprawl, dormant dashboards, or duplicated workspaces are visible.',
        buyerAsk: 'Provide usage by viewer, creator, admin, workspace, dashboard, query, embedded app, and business owner before BAFO.',
      },
      {
        lever: 'Semantic-layer proof',
        whenToUse: 'Use when vendors claim trusted self-service or AI analytics.',
        buyerAsk: 'Prove how governed definitions, permissions, row-level rules, lineage, and correction workflows survive natural-language and self-service use.',
      },
    ],
    riskFactors: [
      {
        id: 'bi-dashboard-sprawl',
        label: 'Dashboard sprawl without metric governance',
        severity: 'high',
        detectionSignals: ['Teams publish duplicate dashboards for the same metric and cannot identify authoritative business definitions.'],
        mitigations: ['Require governed metric owner, certified content workflow, and semantic-layer proof before award'],
      },
      {
        id: 'bi-compute-cost-blindspot',
        label: 'Downstream compute cost blind spot',
        severity: 'medium',
        detectionSignals: ['Tool evaluation ignores warehouse, Fabric, embedded, refresh, cache, or query costs triggered by BI usage.'],
        mitigations: ['Model dashboard/query workloads against data-platform cost drivers before BAFO'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress certified metrics, audit trails, entitlement reviews, SOX-adjacent reporting controls, and regulated-data access.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI visibility, minimum necessary access, row-level rules, de-identification, audit logs, and BAA posture.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Model high-volume store, SKU, promotion, loyalty, inventory, and supplier analytics with freshness and external sharing constraints.',
      },
    ],
    body: `## Summary
Business intelligence sourcing should not be a beauty contest among dashboards. A BI platform becomes the decision layer for finance, sales, operations, product, supply chain, customer, and executive reporting. The hard problem is not whether a chart can be made; it is whether business teams can trust the metric, understand the lineage, access the right slice, avoid duplicate definitions, and act quickly without overwhelming analysts or exploding compute cost.

## When to apply
Use this pattern when sourcing or renewing BI, analytics, dashboarding, governed self-service, semantic-layer, embedded analytics, or AI analytics platforms. It fits Power BI, Tableau, Looker, Sigma, ThoughtSpot, and adjacent tools. Apply it for dashboard consolidation, data-platform migration, Microsoft/Google/Salesforce/Snowflake/Databricks ecosystem standardization, embedded customer analytics, finance reporting control, or AI/natural-language analytics decisions. Do not use it for pure warehouse, ETL, MDM, data catalog, spreadsheet automation, or reporting services unless the platform decision is BI-led.

## Category boundary
In scope: dashboards, reports, semantic models, certified metrics, governed self-service, row-level security, sharing, scheduling, data refresh, embedded analytics, APIs, admin controls, audit logs, natural-language analytics, AI summaries, usage telemetry, training, support, and content migration. Out of scope: raw data storage, pipeline orchestration, master data, full data governance, and custom analytics services unless included in the BI award.

## Lifecycle and gates
The scope gate should identify business personas, viewer/creator/admin mix, authoritative metrics, embedded use cases, regulated fields, data sources, refresh latency, current dashboard inventory, and data-platform dependencies. The RFP gate should require vendors to map licensing and capacity constructs to those personas and workloads. The proof gate should test one governed executive metric, one ad hoc self-service question, one row-level-security scenario, one stale-dashboard cleanup scenario, one embedded analytics scenario if relevant, and one AI/natural-language question with correction workflow. The BAFO gate should normalize role seats, capacity, embedded/external users, non-production instances, premium support, training, migration, API limits, AI features, warehouse or Fabric compute, and renewal protections.

## Evaluation rubric
Weight governed metric model around 25 percent, business-user adoption around 20 percent, data-platform fit around 15 percent, security and auditability around 15 percent, commercial predictability around 15 percent, and embedded/AI/exit risk around 10 percent. Increase audit and metric-control weight for finance, insurance, healthcare, and regulated reporting. Increase embedded economics weight when analytics are customer-facing.

## Pricing and contract notes
Public pricing visibility varies by vendor and deployment model. Microsoft publishes Power BI and Fabric pricing constructs. Tableau publishes role and edition constructs for Cloud, Server, and Tableau Next, with some bundles requiring sales contact. Google Looker public documentation supports edition, hosting, API, semantic, and embedding concepts, but enterprise pricing often requires engagement. ThoughtSpot publishes plan constructs. Sigma public materials emphasize live warehouse analytics and inherited governance, while enterprise commercial terms require vendor engagement. None of these pages prove buyer-specific discounts, renewal uplift, migration effort, embedded user economics, or data-platform compute cost.

Contracting should define user categories, embedded rights, external-user restrictions, audit logs, row-level security, SSO/SCIM, tenant isolation, data export, content portability, service levels, support response, training, AI data use, and renewal protections. For warehouse-native tools, require cost observability and query controls so business adoption does not create unbounded downstream spend.

## Contradictions and failure modes
Vendor claim: self-service analytics reduces analyst burden. Detection: test semantic definitions, permissioning, certified content, correction workflow, and actual user personas. Vendor claim: AI answers business questions. Detection: test governed metrics, row-level access, hallucination controls, source traceability, and escalation to analysts. Vendor claim: the license is inexpensive. Detection: model role mix, capacity, embedded users, support, migration, data-platform compute, and unused-seat cleanup.

The common failure is replacing dashboard sprawl with a new dashboard factory. The second is buying AI analytics before the business agrees on metric definitions. The third is comparing per-seat list prices while ignoring capacity, embedded rights, query cost, support, training, and content migration.`,
  },
  {
    id: 'PAT-SRC-CAT-LLM-001',
    slug: 'enterprise-llm-model-access-sourcing',
    title: 'Enterprise LLM and Generative AI Model Access Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise LLM sourcing should create a governed model-access portfolio with cost controls, data boundaries, routing options, and deprecation resilience rather than selecting a single model from a benchmark.',
    applicability:
      'Apply when sourcing hosted LLM APIs, model gateways, hyperscaler model access, provisioned throughput, batch inference, prompt caching, tool-use add-ons, data residency, retention controls, or enterprise generative AI platform access.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://openai.com/api/pricing/',
      'https://openai.com/business-data/',
      'https://platform.claude.com/docs/en/about-claude/pricing',
      'https://platform.claude.com/docs/en/build-with-claude/api-and-data-retention',
      'https://azure.microsoft.com/en-us/pricing/details/azure-openai/',
      'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/deployment-types',
      'https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy',
      'https://aws.amazon.com/bedrock/pricing/',
      'https://aws.amazon.com/bedrock/security-privacy-responsible-ai/',
      'https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing',
      'https://services.google.com/fh/files/misc/ociso-ai-trust-paper-v2.pdf',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'HIPAA-if-PHI', 'BAA-if-required', 'DORA-if-regulated-financial-entity', 'EU-AI-Act-review'],
    relatedPatternIds: ['PAT-SRC-CAT-FAB-001', 'PAT-SRC-CAT-ETL-001', 'PAT-SRC-CAT-BI-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'ai_ml',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'OpenAI API and enterprise offerings',
        tier: 'enterprise',
        positioning: 'Direct model API and enterprise model-access candidate with published API pricing, processing modes, tool charges, data-residency, and reserved-capacity offerings.',
        cautions: ['Pricing and model availability are volatile; contract review must verify retention, regional processing, rate limits, and enterprise terms at award time.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'OpenAI API Pricing', url: 'https://openai.com/api/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Anthropic Claude API',
        tier: 'enterprise',
        positioning: 'Direct model API candidate with public model pricing, prompt caching, batch, data-retention, and third-party platform guidance.',
        cautions: ['Do not assume the same commercial, residency, or feature posture across direct API, AWS, Google, or Microsoft channels.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Anthropic Claude API Pricing', url: 'https://platform.claude.com/docs/en/about-claude/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Azure OpenAI, AWS Bedrock, and Google Vertex/Gemini',
        tier: 'enterprise',
        positioning: 'Hyperscaler model-access channels where cloud commitments, IAM, networking, region controls, marketplace billing, and multi-model access may matter as much as model choice.',
        cautions: ['Same-family models can have different availability, price, quota, deployment type, latency, and data-processing posture by channel and region.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'LLM official pricing constructs only',
        model: 'usage-based',
        metric: 'Input tokens, output tokens, cached tokens, batch/flex jobs, tool calls, provisioned throughput, region/data zone premium, and enterprise reserved capacity',
        sourceBasis: [
          { type: 'public-disclosure', label: 'OpenAI API Pricing', url: 'https://openai.com/api/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Anthropic Claude API Pricing', url: 'https://platform.claude.com/docs/en/about-claude/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'AWS Bedrock Pricing', url: 'https://aws.amazon.com/bedrock/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Gemini Enterprise Agent Platform Pricing', url: 'https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated discounts, committed cloud spend treatment, quota guarantees, private SLAs, and legal acceptance require buyer evidence' },
        ],
        confidence: 0.58,
        notes: 'Do not persist exact volatile token prices in this category pattern. Use official pages at sourcing time and snapshot the date in the event record.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Prompt, completion, tool, and training-data controls',
        buyerPosition: 'Define retention, logging, abuse monitoring, model-training opt-out/default, fine-tuning data handling, deletion, support access, and use of prompts or outputs.',
      },
      {
        clauseArea: 'Model change and continuity',
        buyerPosition: 'Require model/version notice, deprecation windows, fallback routing rights, quota transparency, rate-limit escalation, and migration assistance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Workload-shape cost model',
        whenToUse: 'Use before BAFO when token spend, long context, agent loops, tool calls, or output-heavy workloads can change economics.',
        buyerAsk: 'Model representative prompts, outputs, cache hit assumptions, batch eligibility, tool calls, region settings, and retry behavior against each provider channel.',
      },
      {
        lever: 'Direct versus hyperscaler channel comparison',
        whenToUse: 'Use when teams can buy direct or through Azure, AWS, Google, marketplace, or committed cloud spend.',
        buyerAsk: 'Compare model availability, terms, data processing, region, quota, IAM/networking, billing, discounts, support, and fallback design by channel.',
      },
    ],
    riskFactors: [
      {
        id: 'llm-variable-spend-loop',
        label: 'Variable token and tool-call spend loop',
        severity: 'high',
        detectionSignals: ['Agentic workflows, retries, long context, web search, code execution, or multimodal inputs are not capped or observed.'],
        mitigations: ['Require budgets, per-use-case quotas, telemetry, kill switches, prompt caching assumptions, and workload tests before production expansion'],
      },
      {
        id: 'llm-data-boundary-confusion',
        label: 'Data boundary confusion',
        severity: 'critical',
        detectionSignals: ['Team treats data residency, retention, training use, logging, abuse monitoring, and support access as the same control.'],
        mitigations: ['Require legal/security review of each deployment type and feature class before award'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress outsourcing review, audit logs, model risk governance, data location, critical service resilience, and exit/fallback rights.',
        regulatoryRefs: ['DORA where applicable to EU financial entities'],
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI, BAA availability, retention, logging, minimum necessary data, human review, and clinical/non-clinical use boundaries.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review government cloud eligibility, residency, procurement channel, accessibility, records, audit, and sensitive-data restrictions.',
      },
    ],
    body: `## Summary
Enterprise LLM sourcing is not a single-vendor benchmark exercise. It is a governed access decision covering direct APIs, hyperscaler model gateways, model versions, token meters, caching, batch processing, provisioned throughput, tool calls, data retention, regional processing, security controls, and fallback design. The right sourcing question is: which model-access portfolio lets the buyer deploy approved use cases safely, predictably, and reversibly?

## When to apply
Use this pattern when pilots are moving into production, token spend is becoming material, teams need approved data handling, product groups want model APIs, engineering wants multi-model routing, legal asks about retention or training use, or latency/quota limits require reserved capacity. It applies to OpenAI, Anthropic, Azure OpenAI and Microsoft Foundry, AWS Bedrock, Google Vertex AI and Gemini Enterprise Agent Platform, and similar hosted model-access channels. Do not use it for generic chatbot seats, internal GPU procurement, fully self-hosted open-source models, or standalone model-training services.

## Category boundary
In scope: model APIs, model gateways, direct vendor contracts, marketplace/hyperscaler access, pay-as-you-go tokens, batch/flex processing, prompt caching, long context, embeddings, tool charges, web/search/code tools, provisioned throughput, reserved capacity, region/data-zone settings, logging, retention, training-data controls, encryption, key management, audit, rate limits, quotas, model deprecation, and fallback routing. Out of scope: business app copilot subscriptions, consumer plans, custom GPU clusters, and speculative provider economics.

## Lifecycle and gates
The scope gate should inventory use cases, data classes, prompt/output sensitivity, required models, latency, volume, regions, fallback needs, budget owners, and prohibited uses. The RFP gate should require official pricing-page snapshots, data-processing summaries, security attestations, retention defaults, model/version availability, quota posture, and deployment-type options. The proof gate should run representative workloads: short prompt, long context, output-heavy task, batchable task, retrieval/tool workflow, sensitive-data redaction test, cache scenario, and failure/fallback path. The BAFO gate should normalize token inputs and outputs, cache reads/writes, batch discounts, tool calls, provisioned throughput, regional premiums, support, enterprise terms, cloud-commit treatment, and legal acceptance.

## Evaluation rubric
Weight data protection and legal posture around 25 percent, workload cost predictability around 20 percent, model quality on buyer tasks around 20 percent, reliability/quota/latency around 15 percent, integration and operational control around 10 percent, and exit/fallback resilience around 10 percent. Increase legal weight for healthcare, financial services, public sector, minors' data, regulated communications, or sensitive employee/customer data.

## Pricing and contract notes
Official pricing pages are required at sourcing time because model names, token rates, caching rules, batch discounts, tool charges, regional constructs, and provisioned-capacity options change. OpenAI publishes API pricing, batch, tool, and enterprise offering references. Anthropic publishes Claude model pricing, cache, batch, and third-party platform references. Azure OpenAI pricing and Microsoft Foundry documentation describe pay-as-you-go, provisioned deployment, batch, global/data-zone/regional options, and deployment-type differences. AWS Bedrock publishes model-provider pricing and provisioned options. Google publishes Gemini/Vertex-style pricing and provisioned throughput concepts. The corpus should preserve the constructs and require a dated event snapshot, not hard-code volatile prices as durable benchmarks.

Contracting should define prompt and completion retention, logging, abuse monitoring, training-use defaults, fine-tuning data, deletion, support access, encryption, key management, subprocessors, data location, model/version change notice, quota escalation, deprecation notice, fallback rights, and incident response. Preview features, agents, tools, and connectors may have different terms; they require explicit review.

## Contradictions and failure modes
Vendor claim: the same model is available through multiple channels. Detection: compare price, region, quota, latency, feature support, retention, logging, and terms by channel. Vendor claim: data is protected. Detection: separate residency, processing location, retention, training use, abuse monitoring, support access, and fine-tuning data. Vendor claim: the workload is inexpensive. Detection: model prompts, outputs, retries, agent loops, tool calls, cache misses, batch eligibility, and observability.

The common failure is approving AI experimentation without cost, data, and fallback controls, then discovering that production usage behaves differently. The second is treating public benchmarks as procurement proof. The third is buying one provider path and losing leverage when model deprecation, quota, regional requirements, or application quality shifts.`,
  },
  {
    id: 'PAT-SRC-CAT-AGENT-001',
    slug: 'enterprise-ai-agent-platform-sourcing',
    title: 'Enterprise AI Agent Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI agent platform sourcing should test identity, tool authorization, memory, observability, evaluation, runtime isolation, and rollback controls before accepting a vendor claim that agents are production-ready.',
    applicability:
      'Apply when sourcing enterprise AI agent builders, agent runtimes, orchestration frameworks, low-code agent studios, tool gateways, MCP infrastructure, workflow agents, browser/code tools, or agent governance platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.77,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://aws.amazon.com/bedrock/agentcore/pricing/',
      'https://aws.amazon.com/blogs/machine-learning/amazon-bedrock-agentcore-is-now-generally-available/',
      'https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio',
      'https://cloud.google.com/products/gemini-enterprise-agent-platform',
      'https://www.salesforce.com/agentforce/pricing/',
      'https://js.langchain.com/docs/langgraph',
      'https://docs.crewai.com/',
      'https://ai-sdk.dev/docs',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'SOC-2-review', 'HIPAA-if-PHI', 'EU-AI-Act-review', 'DORA-if-regulated-financial-entity'],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-VEC-001', 'PAT-SRC-CAT-MLOPS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'ai_ml',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'AWS Bedrock AgentCore',
        tier: 'enterprise',
        positioning: 'Agent runtime and governance platform with modular runtime, browser, code interpreter, gateway, policy, identity, memory, observability, evaluation, and registry constructs.',
        cautions: ['Consumption can span runtime, memory, gateway, policy, browser/code tools, telemetry, model calls, storage, and network transfer.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Amazon Bedrock AgentCore Pricing', url: 'https://aws.amazon.com/bedrock/agentcore/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Copilot Studio and Google Gemini Enterprise Agent Platform',
        tier: 'enterprise',
        positioning: 'Enterprise agent-builder candidates where tenant identity, business-app connectors, governance, low-code authoring, and cloud ecosystem alignment matter.',
        cautions: ['Buyer must separate included app entitlements from agent runtime, message, connector, model, and governance costs.'],
      },
      {
        vendorName: 'Salesforce Agentforce, LangGraph, CrewAI, and Vercel AI SDK',
        tier: 'specialist',
        positioning: 'Application, CRM, framework, and developer-platform approaches for building workflow agents and agentic applications.',
        cautions: ['Framework flexibility does not replace production controls for identity, tool scope, observability, evaluation, and rollback.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Agent platform public pricing constructs only',
        model: 'hybrid',
        metric: 'Messages, agent actions, runtime CPU/memory, gateway/tool calls, memory records, evaluation tokens, observability telemetry, model calls, connectors, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Amazon Bedrock AgentCore Pricing', url: 'https://aws.amazon.com/bedrock/agentcore/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Salesforce Agentforce Pricing', url: 'https://www.salesforce.com/agentforce/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated enterprise packaging, included entitlements, connector costs, model spend, and agent volume forecasts require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Do not compare platforms from headline agent pricing alone; agent costs are workload-shape dependent.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Agent authority and tool boundary',
        buyerPosition: 'Define identities, delegated authorization, tool scopes, approval gates, policy checks, credential handling, audit logs, and emergency disablement.',
      },
      {
        clauseArea: 'Runtime observability and rollback',
        buyerPosition: 'Require traces, prompt/tool logs, evaluation evidence, sampled review, incident export, version rollback, and kill-switch rights before production expansion.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Dangerous-action proof',
        whenToUse: 'Use before BAFO when agents can write records, send messages, execute code, browse websites, or call business systems.',
        buyerAsk: 'Demonstrate identity, policy, approval, audit, rollback, and kill-switch behavior on buyer-defined risky actions.',
      },
      {
        lever: 'Agent cost decomposition',
        whenToUse: 'Use when proposals blend model spend, runtime, tool calls, memory, observability, connectors, and user seats.',
        buyerAsk: 'Break out every meter and model representative task volumes before commercial award.',
      },
    ],
    riskFactors: [
      {
        id: 'agent-authority-sprawl',
        label: 'Agent authority sprawl',
        severity: 'critical',
        detectionSignals: ['Agent can act across systems without clear delegated identity, least privilege, approvals, or audit trails.'],
        mitigations: ['Require tool allowlists, policy checks, human approval for high-risk actions, and emergency disablement'],
      },
      {
        id: 'agent-eval-theater',
        label: 'Evaluation theater',
        severity: 'high',
        detectionSignals: ['Vendor shows demo success but cannot produce regression tests, sampled review, trace exports, or failure taxonomy.'],
        mitigations: ['Require buyer workload eval set, replay harness, and production monitoring plan'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress delegated authority, audit trails, model risk governance, outsourcing review, and high-risk action approvals.',
      },
      {
        industry: 'healthcare',
        modifier: 'Require PHI boundary design, BAA posture, human review, and explicit prohibition of unsafe clinical automation unless approved.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review procurement, records retention, identity federation, accessibility, residency, and citizen-facing action controls.',
      },
    ],
    body: `## Summary
Enterprise AI agent platform sourcing is where model access becomes operational authority. A chatbot answers; an agent can plan, call tools, retrieve records, write back to systems, browse, execute code, remember context, and trigger workflows. The sourcing event must therefore evaluate the control plane around the agent, not only the quality of a demo conversation.

## When to apply
Use this pattern when a buyer is sourcing an agent builder, agent runtime, low-code agent studio, MCP/tool gateway, workflow-agent platform, browser/code tool, memory service, evaluation harness, or agent governance layer. It fits AWS Bedrock AgentCore, Microsoft Copilot Studio, Google Gemini Enterprise Agent Platform, Salesforce Agentforce, LangGraph/LangChain, CrewAI, Vercel AI SDK/Workflow-style developer platforms, and similar approaches. Do not use it for generic chatbot subscriptions, pure LLM API access, BI copilots, or RPA unless autonomous tool use and governed action are central.

## Category boundary
In scope: agent identity, delegated authorization, tool registry, connectors, MCP servers, runtime isolation, code execution, browser automation, memory, retrieval, planning, workflow orchestration, human approvals, policy checks, traces, evals, telemetry, versioning, rollback, cost controls, and incident response. Out of scope: model pricing alone, simple chat UI, knowledge-base search, and application copilots that cannot call external tools.

## Lifecycle and gates
The scope gate should classify agent personas, allowed systems, allowed actions, prohibited actions, approval thresholds, data classes, retention, runtime model, expected volumes, and owner of production monitoring. The RFP gate should require identity architecture, tool authorization, audit model, memory design, runtime isolation, observability, evaluation, and commercial meter disclosures. The proof gate should test one read-only workflow, one writeback workflow, one blocked high-risk action, one tool failure, one hallucinated tool request, one rollback, one human approval, and one cost-budget alert. The BAFO gate should normalize messages, model calls, runtime CPU/memory, tool calls, gateway calls, memory records, evaluation tokens, browser/code usage, connectors, telemetry storage, support, and services.

## Evaluation rubric
Weight authority and identity controls around 25 percent, observability and evaluation around 20 percent, workload fit around 20 percent, security/privacy/compliance around 15 percent, commercial predictability around 10 percent, and portability/exit around 10 percent. Increase authority weight when agents can transact, communicate externally, update customer records, write code, access regulated data, or act on behalf of employees.

## Pricing and contract notes
Public pricing pages show that agent platforms can have many meters. AWS AgentCore describes modular consumption across runtime, browser, code interpreter, gateway, policy, identity, memory, observability, and evaluations. Salesforce publishes Agentforce pricing constructs. Microsoft and Google public pages frame agent building and governance capabilities, while buyer-specific costs depend on licensing, connectors, model calls, cloud commitments, and usage. Do not compare vendors from a single headline unit. Model representative task traces and include model spend, runtime, memory, telemetry, connector, gateway, and support costs.

Contracting should define tool authority, credential handling, delegated identity, data retention, model-training posture, trace/log access, approval requirements, incident notification, kill switch, rollback, evaluation evidence, and support responsibilities. For risky actions, the contract should reference explicit allowed and prohibited action classes.

## Contradictions and failure modes
Vendor claim: agents are production-ready. Detection: test identity, policy, tool failure, trace export, human approval, rollback, and cost caps. Vendor claim: no-code agents are safe for business users. Detection: require environment separation, publishing controls, tool allowlists, and audit. Vendor claim: framework portability prevents lock-in. Detection: inspect memory, tool schema, evaluation data, connector mappings, and production telemetry export.

The common failure is letting a successful demo become production authority without identity and policy design. The second is ignoring that agent loops multiply model, tool, runtime, memory, and telemetry costs. The third is treating evaluation as a launch checklist instead of a continuous operating control.`,
  },
  {
    id: 'PAT-SRC-CAT-VEC-001',
    slug: 'vector-database-retrieval-infrastructure-sourcing',
    title: 'Vector Database and Retrieval Infrastructure Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Vector database sourcing should compare retrieval quality, metadata filtering, hybrid search, ingestion operations, data governance, and workload cost rather than assuming every RAG workload needs a dedicated vector database.',
    applicability:
      'Apply when sourcing vector databases, vector search, embedding stores, semantic retrieval, RAG infrastructure, hybrid search, or retrieval layers across Pinecone, Weaviate, Qdrant, Zilliz/Milvus, Elastic/OpenSearch, MongoDB Atlas, pgvector, and cloud data platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.pinecone.io/pricing/',
      'https://weaviate.io/pricing',
      'https://qdrant.tech/pricing/',
      'https://zilliz.com/pricing',
      'https://www.mongodb.com/products/platform/atlas-vector-search',
      'https://www.elastic.co/what-is/vector-search',
      'https://opensearch.org/docs/latest/vector-search/',
      'https://github.com/pgvector/pgvector',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'HIPAA-if-PHI', 'SOC-2-review', 'data-residency-review'],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-FAB-001', 'PAT-SRC-CAT-CDW-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'ai_ml',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Pinecone, Weaviate, Qdrant, and Zilliz/Milvus',
        tier: 'specialist',
        positioning: 'Dedicated vector database candidates for managed semantic search, hybrid retrieval, metadata filtering, scale, and AI application retrieval workloads.',
        cautions: ['Performance and cost claims require buyer workload tests; public pricing constructs do not prove TCO.'],
      },
      {
        vendorName: 'Elastic, OpenSearch, MongoDB Atlas Vector Search, and pgvector',
        tier: 'enterprise',
        positioning: 'Existing-search, document-database, open-source, and Postgres-adjacent options where consolidation, governance, or operational familiarity may beat a separate vector service.',
        cautions: ['Existing-platform fit does not prove retrieval quality, latency, recall, filtering, or operational simplicity.'],
      },
      {
        vendorName: 'Warehouse and lakehouse-native vector search',
        tier: 'enterprise',
        positioning: 'Data-platform-native option when embeddings live close to governed enterprise data and query cost is already managed in the analytics estate.',
        cautions: ['Semantic retrieval requirements can expose limits in freshness, latency, filtering, or application serving patterns.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Vector retrieval public pricing constructs only',
        model: 'hybrid',
        metric: 'Vectors, dimensions, storage, pods/nodes/compute units, read/write units, replicas, hybrid search, backups, regions, support, and data transfer',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Pinecone Pricing', url: 'https://www.pinecone.io/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Weaviate Pricing', url: 'https://weaviate.io/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Qdrant Pricing', url: 'https://qdrant.tech/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Zilliz Pricing', url: 'https://zilliz.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer workload dimensions, recall targets, latency SLOs, write volume, embedding refresh, and negotiated enterprise terms require evidence' },
        ],
        confidence: 0.62,
        notes: 'Benchmark only with buyer corpus, filters, embedding model, query mix, and latency targets.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Data governance and retrieval exportability',
        buyerPosition: 'Define embedding ownership, metadata export, source-document linkage, deletion propagation, region, encryption, access logs, and migration assistance.',
      },
      {
        clauseArea: 'Operational SLO and workload controls',
        buyerPosition: 'Require ingestion/backfill controls, index rebuild behavior, backup/restore, read/write throttles, cost alerts, and incident response.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Buyer-corpus retrieval bakeoff',
        whenToUse: 'Use when vendors rely on generic benchmarks or demo corpora.',
        buyerAsk: 'Run the same embeddings, documents, metadata filters, hybrid queries, and evaluation labels across finalist platforms.',
      },
      {
        lever: 'Existing-platform challenger',
        whenToUse: 'Use when a dedicated vector database is proposed without proof that existing Postgres, search, document, warehouse, or cloud tools are insufficient.',
        buyerAsk: 'Compare dedicated service value against existing-platform retrieval quality, governance, operations, and TCO.',
      },
    ],
    riskFactors: [
      {
        id: 'vector-benchmark-mismatch',
        label: 'Benchmark mismatch',
        severity: 'high',
        detectionSignals: ['Vendor cites generic latency or recall benchmarks not tied to buyer corpus, dimensions, filters, query mix, or freshness.'],
        mitigations: ['Require buyer-corpus evaluation and traceable retrieval labels'],
      },
      {
        id: 'vector-delete-gap',
        label: 'Deletion and source-of-truth gap',
        severity: 'high',
        detectionSignals: ['Source document deletion or permission change does not reliably propagate to chunks, embeddings, metadata, and caches.'],
        mitigations: ['Test deletion, re-embedding, permission changes, and audit logs before award'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Stress PHI boundaries, deletion propagation, access control, audit logs, BAA posture, and minimum necessary retrieval.',
      },
      {
        industry: 'financial_services',
        modifier: 'Stress entitlement-aware retrieval, regulated records, model risk evidence, auditability, and data residency.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review residency, records retention, accessibility, procurement constraints, and sensitive-data indexing rules.',
      },
    ],
    body: `## Summary
Vector database sourcing is really retrieval infrastructure sourcing. The buyer is not buying vectors; the buyer is buying the ability for an application or agent to retrieve the right governed context at the right time, under the right permissions, with predictable cost and observable quality. A dedicated vector database may be the right answer, but existing search, document, Postgres, warehouse, or cloud-native vector search can also be credible challengers.

## When to apply
Use this pattern for RAG systems, semantic search, embedding stores, retrieval APIs, hybrid keyword/vector search, agent memory retrieval, document Q&A, product search, support knowledge retrieval, and internal knowledge assistants. It applies to Pinecone, Weaviate, Qdrant, Zilliz/Milvus, Elastic, OpenSearch, MongoDB Atlas Vector Search, pgvector, and data-platform-native vector search. Do not use it for model access, data catalog, MDM, or BI unless semantic retrieval is the sourcing decision.

## Category boundary
In scope: embeddings, vector dimensions, distance metrics, metadata filters, hybrid search, reranking hooks, namespaces/collections, ingestion pipelines, chunking, backfills, update/delete propagation, access control, tenancy, region/residency, backup, replication, latency, recall, query volume, write volume, observability, and export. Out of scope: embedding model selection alone, full document management, generic search consulting, and LLM application UI.

## Lifecycle and gates
The scope gate should classify corpus size, document types, embedding model, dimensions, update frequency, deletion requirements, permission model, latency targets, recall targets, regions, and application workload. The RFP gate should require pricing meters, security posture, deployment options, filtering capability, hybrid search behavior, backup/restore, and migration/export model. The proof gate should use buyer documents, buyer metadata, representative queries, expected retrieval labels, permission changes, deletion tests, and backfill scenarios. The BAFO gate should normalize storage, compute units, read/write units, replicas, backups, support, data transfer, embedding refresh, observability, and internal operations cost.

## Evaluation rubric
Weight retrieval quality around 25 percent, metadata/permission filtering around 20 percent, operational reliability around 15 percent, cost predictability around 15 percent, security/governance around 15 percent, and portability/exit around 10 percent. Increase permission weight when retrieval is user-specific. Increase freshness and deletion weight when source documents change frequently or regulated records are involved.

## Pricing and contract notes
Public pricing pages for Pinecone, Weaviate, Qdrant, and Zilliz identify constructs such as managed tiers, capacity, compute, storage, and enterprise packaging, but those pages do not prove buyer-specific TCO. Existing-platform options such as MongoDB Atlas Vector Search, Elastic/OpenSearch vector search, and pgvector shift cost into current database, search, cloud, or engineering estates. Cost comparison must use the buyer's vectors, dimensions, filters, write frequency, query mix, regions, replicas, and SLOs.

Contracting should define embedding and metadata ownership, export format, source-document linkage, deletion propagation, permission updates, data residency, encryption, support access, incident response, backup/restore, index rebuild, migration assistance, and service credits. If the vector store contains personal data or sensitive content, deletion and entitlement tests are not optional.

## Contradictions and failure modes
Vendor claim: fastest vector search. Detection: test buyer corpus, filters, dimensions, query mix, and freshness. Vendor claim: simple RAG deployment. Detection: inspect chunking, ingestion, permissions, deletion, evaluation labels, and observability. Vendor claim: cheaper than alternatives. Detection: model reads, writes, storage, replicas, backups, data transfer, embedding refresh, and engineering operations.

The common failure is selecting a vector database from a benchmark that does not resemble the buyer's corpus. The second is forgetting that permissions and deletion are retrieval features, not only security features. The third is adding a new managed service when an existing governed platform could satisfy the workload with less operational fragmentation.`,
  },
  {
    id: 'PAT-SRC-CAT-MLOPS-001',
    slug: 'mlops-model-lifecycle-platform-sourcing',
    title: 'MLOps and Model Lifecycle Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'MLOps sourcing should govern the model lifecycle from experiment to registry, deployment, monitoring, feature lineage, evaluation, and rollback rather than treating notebooks, pipelines, and dashboards as separate tool buys.',
    applicability:
      'Apply when sourcing MLOps, model registry, experiment tracking, feature stores, model serving, monitoring, evaluation, ML platform, or AI governance tools across Databricks, AWS SageMaker, Google Vertex AI, Azure Machine Learning, Weights & Biases, Arize, Fiddler, WhyLabs, Tecton, Feast, and related platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.databricks.com/product/machine-learning',
      'https://www.databricks.com/product/machine-learning/pricing',
      'https://aws.amazon.com/sagemaker/pricing/',
      'https://cloud.google.com/vertex-ai',
      'https://cloud.google.com/vertex-ai/pricing',
      'https://azure.microsoft.com/en-us/products/machine-learning/',
      'https://azure.microsoft.com/en-us/pricing/details/machine-learning/',
      'https://wandb.ai/site/pricing',
      'https://arize.com/pricing/',
      'https://www.fiddler.ai/pricing',
      'https://www.tecton.ai/pricing/',
      'https://github.com/feast-dev/feast',
    ],
    regulatoryChips: ['SOC-2-review', 'GDPR-if-person-data', 'HIPAA-if-PHI', 'model-risk-management', 'EU-AI-Act-review'],
    relatedPatternIds: ['PAT-SRC-CAT-LLM-001', 'PAT-SRC-CAT-FAB-001', 'PAT-SRC-CAT-ETL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'ai_ml',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Databricks, AWS SageMaker, Google Vertex AI, and Azure Machine Learning',
        tier: 'enterprise',
        positioning: 'Cloud and data-platform-native ML lifecycle candidates for experimentation, pipelines, model registry, serving, feature/data integration, and governance.',
        cautions: ['Cloud compute, storage, serving, monitoring, notebooks, pipelines, and marketplace commitments must be modeled together.'],
      },
      {
        vendorName: 'Weights & Biases, Arize, Fiddler, WhyLabs, Tecton, and Feast',
        tier: 'specialist',
        positioning: 'Specialist candidates for experiment tracking, model monitoring, observability, explainability, feature stores, and lifecycle governance.',
        cautions: ['Specialist depth must be weighed against integration cost, data movement, and platform fragmentation.'],
      },
      {
        vendorName: 'Open-source lifecycle stack',
        tier: 'emerging',
        positioning: 'OSS and self-managed stack around MLflow, Feast, notebooks, CI/CD, model servers, and monitoring libraries when control and portability matter.',
        cautions: ['License cost savings can shift into engineering operations, security, upgrades, and support.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'MLOps public pricing constructs only',
        model: 'hybrid',
        metric: 'Compute, storage, notebooks, training jobs, endpoints, registry, monitoring, feature store, users, tracked experiments, inference, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'AWS SageMaker Pricing', url: 'https://aws.amazon.com/sagemaker/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure Machine Learning Pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/machine-learning/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Weights & Biases Pricing', url: 'https://wandb.ai/site/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer workload mix, cloud commitments, production inference volume, monitoring retention, and negotiated enterprise support require evidence' },
        ],
        confidence: 0.60,
        notes: 'MLOps TCO is workload and operating-model dependent; public pricing identifies meters only.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Model artifact, feature, and experiment portability',
        buyerPosition: 'Require export of model artifacts, registry metadata, experiment history, evaluation results, feature definitions, lineage, and monitoring data.',
      },
      {
        clauseArea: 'Production monitoring and rollback',
        buyerPosition: 'Define drift, quality, bias, performance, incident, audit, approval, rollback, and retention responsibilities before production use.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Lifecycle coverage proof',
        whenToUse: 'Use when a vendor claims end-to-end ML platform capability.',
        buyerAsk: 'Demonstrate one model from experiment through registry, approval, deployment, monitoring, drift alert, rollback, and audit export.',
      },
      {
        lever: 'Platform versus specialist decomposition',
        whenToUse: 'Use when cloud-native suites and specialist tools compete.',
        buyerAsk: 'Separate must-have lifecycle controls from nice-to-have specialist depth, integration burden, and operating ownership.',
      },
    ],
    riskFactors: [
      {
        id: 'mlops-notebook-to-prod-gap',
        label: 'Notebook-to-production gap',
        severity: 'high',
        detectionSignals: ['Experiment tracking works, but registry, approvals, serving, monitoring, and rollback are manual or unclear.'],
        mitigations: ['Run lifecycle proof with audit and rollback artifacts before award'],
      },
      {
        id: 'mlops-monitoring-blindspot',
        label: 'Monitoring blind spot',
        severity: 'high',
        detectionSignals: ['Production model behavior lacks drift, data-quality, latency, bias, cost, or business-outcome monitoring.'],
        mitigations: ['Require production telemetry design, thresholds, ownership, and incident workflow'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Raise model risk management, independent validation, audit trail, lineage, approval, monitoring, and retirement controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review clinical/non-clinical use boundary, PHI, validation evidence, monitoring, human review, and regulatory device implications.',
      },
      {
        industry: 'insurance',
        modifier: 'Stress explainability, bias monitoring, feature lineage, adverse-action evidence, and regulatory exam support.',
      },
    ],
    body: `## Summary
MLOps platform sourcing should connect experimentation to production accountability. Data scientists need notebooks and experiments; engineering needs pipelines and deployment; risk and compliance need lineage, approvals, monitoring, and audit evidence; product owners need reliable model behavior. A sourcing event that optimizes only one of those personas usually creates a handoff gap.

## When to apply
Use this pattern when sourcing MLOps, model registry, experiment tracking, feature store, model serving, monitoring, evaluation, ML platform, or model governance tooling. It applies to Databricks Mosaic AI and MLflow, AWS SageMaker, Google Vertex AI, Azure Machine Learning, Weights & Biases, Arize, Fiddler, WhyLabs, Tecton, Feast, and related platforms. Do not use it for pure LLM API access, BI dashboards, generic data pipelines, or data science staffing unless model lifecycle controls drive the decision.

## Category boundary
In scope: notebooks, experiments, lineage, datasets, feature stores, model registry, approvals, CI/CD, pipelines, training jobs, batch scoring, online serving, monitoring, drift, bias, quality, explainability, evaluation, audit logs, rollback, retirement, access control, and cost controls. Out of scope: raw data warehouse, generic ETL, model procurement, labeling services, and standalone dashboards unless they connect to the model lifecycle.

## Lifecycle and gates
The scope gate should identify model types, production criticality, regulated data, validation requirements, feature ownership, deployment targets, monitoring obligations, and current toolchain. The RFP gate should require vendors to map lifecycle coverage and price meters. The proof gate should run one representative model through experiment, registry, approval, deployment, monitoring, drift or quality alert, rollback, and audit export. The BAFO gate should normalize users, compute, storage, training jobs, endpoints, registry, feature store, monitoring retention, evaluation, support, marketplace terms, professional services, and internal operations.

## Evaluation rubric
Weight lifecycle completeness around 25 percent, production monitoring around 20 percent, data/feature lineage around 15 percent, integration with current cloud/data stack around 15 percent, governance and auditability around 15 percent, and commercial predictability around 10 percent. Increase governance weight for financial services, healthcare, insurance, public sector, and any model affecting eligibility, pricing, credit, clinical, employment, or safety outcomes.

## Pricing and contract notes
Public pricing pages for AWS SageMaker, Azure Machine Learning, Databricks, Weights & Biases, Arize, Fiddler, and related tools identify different commercial constructs: compute, endpoints, users, tracked experiments, monitoring, storage, support, or enterprise packages. Google Vertex AI and cloud-native platforms often tie MLOps cost to multiple services. TCO must include cloud compute, storage, endpoints, monitoring retention, data movement, CI/CD, internal operations, and support. Do not infer negotiated discounts, cloud-commit treatment, or workload cost without buyer traces.

Contracting should define model artifact ownership, registry metadata export, feature definitions, experiment history, evaluation data, monitoring telemetry, retention, incident response, approval workflow, rollback, deletion, security reports, and transition assistance. If models are regulated, require audit artifacts and independent validation support.

## Contradictions and failure modes
Vendor claim: end-to-end ML platform. Detection: prove the path from experiment to registry, deployment, monitoring, rollback, and audit. Vendor claim: open standards prevent lock-in. Detection: export model artifacts, lineage, experiment metadata, feature definitions, and monitoring history. Vendor claim: monitoring is included. Detection: verify drift, bias, quality, latency, cost, business outcome, alert routing, and owner response.

The common failure is buying experiment tracking and still lacking production accountability. The second is selecting a cloud-native suite because it is convenient while specialist monitoring or feature needs remain unresolved. The third is ignoring model retirement and rollback until a production model behaves badly.`,
  },
  {
    id: 'PAT-SRC-CAT-CODE-001',
    slug: 'enterprise-code-platform-ai-devops-sourcing',
    title: 'Enterprise Code Platform Sourcing for SCM, DevOps, and AI Coding Assistants',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise code-platform sourcing should evaluate source control, CI/CD, code security, developer workflow, and AI coding assistant governance as one operating model instead of comparing repository seats in isolation.',
    applicability:
      'Apply when sourcing GitHub Enterprise, GitHub Copilot, GitHub Advanced Security, GitLab Premium or Ultimate, GitLab Duo, Bitbucket Cloud or hybrid, Azure DevOps, JetBrains AI, Cursor Teams or Enterprise, and adjacent developer-platform tooling.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://github.com/pricing',
      'https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing',
      'https://docs.github.com/en/copilot/concepts/content-exclusion-for-github-copilot',
      'https://about.gitlab.com/pricing/',
      'https://docs.gitlab.com/administration/gitlab_duo_self_hosted/',
      'https://www.atlassian.com/software/bitbucket/pricing',
      'https://www.atlassian.com/migration/bitbucket-hybrid-license',
      'https://azure.microsoft.com/en-us/pricing/details/devops/',
      'https://www.jetbrains.com/help/ai-assistant/licensing-and-subscriptions.html',
      'https://cursor.com/pricing',
      'https://cursor.com/security',
    ],
    regulatoryChips: ['SOC-2-review', 'IP-protection', 'open-source-license-review', 'GDPR-if-person-data', 'AI-governance-review'],
    relatedPatternIds: ['PAT-SRC-CAT-AGENT-001', 'PAT-SRC-CAT-MLOPS-001', 'PAT-SRC-CAT-LLM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'ai_ml',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'GitHub Enterprise, GitLab, Bitbucket, and Azure DevOps',
        tier: 'enterprise',
        positioning: 'Suite and platform candidates spanning source control, code review, CI/CD, package or artifact workflows, security scanning, compliance controls, and enterprise administration.',
        cautions: ['SCM seats, CI minutes, security add-ons, AI credits, storage, support, and migration services must be decomposed before comparing proposals.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'GitHub Pricing', url: 'https://github.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'GitLab Pricing', url: 'https://about.gitlab.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure DevOps Services Pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/devops/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'GitHub Copilot, GitLab Duo, Atlassian Rovo Dev, JetBrains AI, and Cursor',
        tier: 'specialist',
        positioning: 'AI-assisted developer workflow candidates for IDE chat, code completion, agentic development, code review, and repository-aware assistance.',
        cautions: ['AI data handling, content exclusion, pooled credits, model/provider terms, auditability, and usage caps vary by vendor and plan.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Developer platform public pricing constructs only',
        model: 'hybrid',
        metric: 'Developer seats, enterprise seats, AI credits, CI/CD minutes, hosted runners, self-hosted capacity, artifacts, storage, code security, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'GitHub Copilot models and pricing', url: 'https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Bitbucket Pricing', url: 'https://www.atlassian.com/software/bitbucket/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Cursor Pricing', url: 'https://cursor.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Negotiated enterprise discounts, developer populations, AI adoption rates, CI usage, security add-ons, and migration cost require buyer evidence' },
        ],
        confidence: 0.58,
        notes: 'Use public pricing pages only to identify meters; do not hard-code volatile list prices or infer negotiated savings.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'AI coding assistant data handling',
        buyerPosition: 'Define training use, retention, logging, model-provider subprocessors, content exclusion limits, repository scope, admin controls, and evidence available for audit.',
      },
      {
        clauseArea: 'SCM and CI/CD exit rights',
        buyerPosition: 'Require repository, issue, pipeline, artifact, package, audit-log, and security-finding export assistance with no penalty for reasonable transition.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Toolchain consolidation model',
        whenToUse: 'Use when vendor bundles SCM, CI/CD, security scanning, planning, packages, and AI assistance into one proposal.',
        buyerAsk: 'Separate incumbent spend displaced, net-new modules, migration effort, usage meters, and controls required before award.',
      },
      {
        lever: 'AI governance proof',
        whenToUse: 'Use before broad AI coding assistant rollout.',
        buyerAsk: 'Demonstrate admin policy, content exclusion, privacy mode, usage reporting, credit controls, secure prompt behavior, and generated-code review workflow.',
      },
    ],
    riskFactors: [
      {
        id: 'code-ai-data-boundary-gap',
        label: 'AI coding data boundary gap',
        severity: 'critical',
        detectionSignals: ['Team treats no-training language, content exclusion, retention, IDE telemetry, and model-provider controls as one uniform protection.'],
        mitigations: ['Require vendor-specific data flow, admin controls, content-exclusion limits, and legal review before rollout'],
      },
      {
        id: 'dev-platform-meter-sprawl',
        label: 'Developer platform meter sprawl',
        severity: 'high',
        detectionSignals: ['Proposal blends seats, AI credits, security add-ons, CI minutes, storage, and migration into one headline price.'],
        mitigations: ['Normalize every meter against buyer repositories, developers, build volume, and security scope'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress audit logs, SDLC controls, segregated duties, AI data restrictions, secure code review, and regulator-visible change evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI avoidance, BAA posture for any protected data path, generated-code review, and secure SDLC evidence.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review residency, public-sector cloud eligibility, procurement channel, accessibility, records, and repository export.',
      },
    ],
    body: `## Summary
Enterprise code-platform sourcing now spans source control, code review, CI/CD, package and artifact flows, code security, developer experience, and AI-assisted development. The buyer is not only choosing where repositories live; the buyer is deciding which platform governs how software is created, reviewed, secured, shipped, audited, and increasingly assisted by models. That makes this category a control-plane decision for engineering, security, legal, finance, and procurement.

## When to apply
Use this pattern for sourcing or renewal events involving GitHub Enterprise, GitHub Copilot, GitHub Advanced Security, GitLab Premium or Ultimate, GitLab Duo, Bitbucket Cloud or hybrid licensing, Azure DevOps Services, JetBrains AI, Cursor Teams or Enterprise, and similar developer-platform or AI coding assistant products. It also applies when M&A, cloud migration, DevSecOps consolidation, or AI assistant rollout forces a standard platform choice. Do not use it for generic software outsourcing, ITSM, observability, cloud infrastructure, or developer staffing unless repository and delivery tooling are the procurement anchor.

## Category boundary
In scope: repository hosting, branch protection, code review, CI/CD, hosted and self-hosted runners, artifacts, package registries, test plans, code scanning, dependency scanning, secret scanning, AI coding assistants, IDE integrations, agentic code tools, enterprise admin, SSO, SCIM, audit logs, data residency, content exclusion, privacy mode, support, and migration. Out of scope: standalone observability, cloud hosting, endpoint security, broad ALM consulting, and unsupported productivity claims.

## Lifecycle and gates
The scope gate should inventory repositories, developer and contributor populations, build volume, current CI/CD runners, security scanning coverage, regulated codebases, open-source policy, AI use, and integration with Jira, issue trackers, IDEs, cloud, and identity. The RFP gate should require public pricing meter disclosure, enterprise controls, data handling, security attestations, AI usage controls, migration support, and export rights. The proof gate should test repository migration, protected branch rules, code scanning, secret scanning, CI workload, package flow, SSO/SCIM, audit export, AI assistant privacy controls, and generated-code review. The BAFO gate should normalize seats, AI credits, CI minutes, storage, security add-ons, marketplace or cloud-commit treatment, support, migration, and internal operating cost.

## Evaluation rubric
Weight developer workflow fit around 20 percent, security and governance around 25 percent, AI data handling around 15 percent, CI/CD and integration depth around 15 percent, commercial predictability around 15 percent, and portability around 10 percent. Increase governance weight for regulated software, customer-facing code, privileged infrastructure code, and distributed contractor access.

## Pricing and contract notes
Public pages from GitHub, GitLab, Atlassian, Microsoft, JetBrains, and Cursor identify pricing constructs such as developer seats, enterprise tiers, AI credits, CI/CD minutes, security features, audit controls, SSO, SCIM, storage, and support. Those pages should be treated as meter maps, not durable benchmarks. Do not infer discount levels, productivity gains, or total cost without buyer-specific repository counts, build traces, security scope, AI adoption, and negotiated terms.

Contracting should define code and prompt data handling, model-training posture, retention, content exclusion limits, usage reporting, pooled credit or overage controls, repository export, pipeline and artifact export, support SLAs, incident response, vulnerability disclosure, and transition assistance. Any AI coding assistant rollout should include secure SDLC obligations: human review, tests, SAST, dependency scanning, license review, and secret controls.

## Contradictions and failure modes
Vendor claim: the suite reduces tool sprawl. Detection: map displaced tools, retained exceptions, migration burden, and net-new AI or security meters. Vendor claim: AI coding is safe for proprietary code. Detection: inspect plan-specific training, retention, content exclusion, model-provider, admin, and audit controls. Vendor claim: productivity improves. Detection: require buyer baseline metrics and avoid vendor marketing generalization.

The common failure is buying a developer platform from a seat quote while ignoring CI consumption, security add-ons, AI credits, and migration. The second is letting individual AI assistant adoption precede security review. The third is treating SCM portability as simple until pipeline, artifact, package, audit, and security history are needed.`,
  },
  {
    id: 'PAT-SRC-CAT-IAM-001',
    slug: 'workforce-iam-identity-platform-sourcing',
    title: 'Workforce IAM Sourcing for SSO, MFA, Lifecycle, and Conditional Access',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Workforce IAM sourcing should select the durable identity control plane for authentication assurance, app assignment, lifecycle automation, and access evidence rather than treating SSO, MFA, and provisioning as separate point tools.',
    applicability:
      'Apply when sourcing or rationalizing workforce identity platforms across Okta, Microsoft Entra, Cisco Duo, Google Cloud Identity, Ping Identity, CyberArk Identity, and adjacent governance integrations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.okta.com/products/single-sign-on-workforce-identity/',
      'https://www.okta.com/pricing/add-ons/',
      'https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing',
      'https://duo.com/editions-and-pricing',
      'https://cloud.google.com/identity/pricing',
      'https://docs.cloud.google.com/identity/docs/editions',
      'https://www.pingidentity.com/en/solution/workforce-identity.html',
      'https://www.thomabravo.com/press-releases/thoma-bravo-completes-acquisition-of-forgerock-combines-forgerock-into-ping-identity',
      'https://www.cyberark.com/press/cyberark-acquires-identity-as-a-service-leader-idaptive/',
      'https://documentation.sailpoint.com/saas/help/access/govern_sso.html',
      'https://pages.nist.gov/800-63-4/sp800-63b.html',
    ],
    regulatoryChips: ['SOC-2-review', 'NIST-800-63-review', 'GDPR-if-person-data', 'HIPAA-if-PHI', 'SOX-if-financial-controls'],
    relatedPatternIds: ['PAT-SRC-CAT-IGA-001', 'PAT-SRC-CAT-COMM-001', 'PAT-SRC-CAT-CODE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Okta, Microsoft Entra, Cisco Duo, Google Cloud Identity, and Ping Identity',
        tier: 'enterprise',
        positioning: 'Primary workforce IAM platform candidates for SSO, MFA, conditional access, lifecycle, app integrations, logs, and enterprise administration.',
        cautions: ['Feature packaging differs across SSO, MFA, lifecycle, governance, privileged access, private access, identity threat protection, and support.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Okta Pricing Add-Ons', url: 'https://www.okta.com/pricing/add-ons/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Entra Plans and Pricing', url: 'https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Cisco Duo Editions and Pricing', url: 'https://duo.com/editions-and-pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'CyberArk Identity and SailPoint governance adjacency',
        tier: 'specialist',
        positioning: 'Adjacent options when workforce IAM overlaps privileged access, identity security, lifecycle governance, and access governance over IdP-managed applications.',
        cautions: ['Keep IAM, IGA, PAM, ZTNA, and ITDR boundaries explicit; they are related controls, not interchangeable categories.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Workforce IAM public pricing constructs only',
        model: 'subscription',
        metric: 'Users, admins, app integrations, MFA methods, lifecycle workflows, conditional access, identity protection, governance modules, private access, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Entra Plans and Pricing', url: 'https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Cloud Identity Pricing', url: 'https://cloud.google.com/identity/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Tenant mix, worker populations, app inventory, existing Microsoft or Google entitlements, and negotiated enterprise terms require buyer evidence' },
        ],
        confidence: 0.60,
        notes: 'Published editions identify packaging levers; enterprise total cost depends on identity populations, apps, modules, and incumbent bundle rights.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Authentication assurance and recovery',
        buyerPosition: 'Define MFA method requirements, phishing-resistant path, break-glass accounts, recovery workflow, helpdesk verification, admin access, and emergency support.',
      },
      {
        clauseArea: 'Identity data and evidence export',
        buyerPosition: 'Require logs, admin actions, assignment history, provisioning events, policy changes, and audit evidence exports in usable formats.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Bundled entitlement challenger',
        whenToUse: 'Use when Microsoft 365, Google Workspace, Cisco security, or other incumbent platforms already include identity capabilities.',
        buyerAsk: 'Compare included capabilities against neutral IdP requirements, app coverage, assurance level, lifecycle automation, logs, and migration cost.',
      },
      {
        lever: 'Critical-app SCIM proof',
        whenToUse: 'Use when proposals assume automated provisioning and deprovisioning.',
        buyerAsk: 'Prove provisioning, deprovisioning, attribute mapping, exception handling, and audit evidence for the buyer critical-app list.',
      },
    ],
    riskFactors: [
      {
        id: 'iam-mfa-assurance-gap',
        label: 'MFA assurance gap',
        severity: 'critical',
        detectionSignals: ['Buyer treats push, TOTP, SMS, passkeys, and hardware-backed phishing-resistant authentication as equivalent.'],
        mitigations: ['Require assurance-level mapping, high-risk user policy, recovery controls, and NIST-aligned authentication review'],
      },
      {
        id: 'iam-app-inventory-gap',
        label: 'App inventory and provisioning gap',
        severity: 'high',
        detectionSignals: ['SSO rollout ignores legacy, private, admin, contractor, and long-tail SaaS applications.'],
        mitigations: ['Require app inventory, connector proof, manual exception workflow, and deprovisioning evidence'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress privileged access, SoD, audit exports, phishing-resistant authentication for high-risk users, and regulator-ready evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review workforce access to PHI systems, shared workstation realities, break-glass workflows, and audit log retention.',
      },
      {
        industry: 'higher_education',
        modifier: 'Plan for students, faculty, staff, guests, alumni, affiliates, research environments, and uneven app modernization.',
      },
    ],
    body: `## Summary
Workforce IAM sourcing is the decision about who becomes the control plane for employee, contractor, partner, administrator, and guest access. SSO and MFA are only the visible surface. The sourcing event must also test lifecycle provisioning, app assignment, conditional access, recovery, delegated administration, logging, evidence, and integration with HR, directories, ITSM, security monitoring, and governance tools.

## When to apply
Use this pattern when sourcing Okta, Microsoft Entra, Cisco Duo, Google Cloud Identity, Ping Identity, CyberArk Identity, or workforce IAM capabilities embedded in broader security and productivity platforms. Apply it during first-time SSO/MFA rollout, legacy AD FS replacement, Microsoft or Google bundle review, M&A identity consolidation, audit remediation, remote-work access redesign, or identity-threat program expansion. Do not use it for pure customer identity, pure PAM, cloud workload IAM, CIAM, endpoint management alone, or IGA-only access certification events.

## Category boundary
In scope: SSO, MFA, phishing-resistant authentication, passkeys, conditional or risk-based access, directory integration, SCIM provisioning, lifecycle workflows, app connectors, access gateway or private-app access, delegated administration, admin roles, policy management, recovery, audit logs, SIEM export, support, and migration. Adjacent but distinct: IGA, PAM, ZTNA, ITDR, device management, and GRC. The RFP should name the control boundary instead of letting vendors collapse every identity label into one suite story.

## Lifecycle and gates
The scope gate should inventory workers, contractors, partners, admins, guests, directories, HR sources, apps, privileged systems, private apps, regulated systems, current MFA methods, exception groups, and recovery workflows. The RFP gate should require authentication assurance, SSO coverage, SCIM coverage, lifecycle automation, logs, support, residency, app connector proof, and public pricing meter disclosure. The proof gate should test high-risk admin login, contractor onboarding, leaver deprovisioning, critical-app SCIM, helpdesk recovery, break-glass, conditional access, and log export. The BAFO gate should normalize users, app connectors, feature tiers, lifecycle modules, governance modules, private access, support, services, and existing bundle entitlements.

## Evaluation rubric
Weight authentication assurance around 25 percent, app and lifecycle coverage around 25 percent, operational reliability around 15 percent, audit and logging around 15 percent, commercial fit around 10 percent, and portability around 10 percent. Increase assurance weight for administrators, developers, finance, HR, executives, regulated data, and remote contractor access.

## Pricing and contract notes
Public materials from Okta, Microsoft Entra, Duo, Google Cloud Identity, Ping, CyberArk, and SailPoint show that IAM packaging can span SSO, MFA, adaptive policies, lifecycle, governance, privileged access, private access, threat protection, app connectors, and support. Those materials support meter identification only. Do not invent enterprise pricing or assume bundled Microsoft or Google entitlements satisfy every buyer requirement. The buyer must model workforce populations, application inventory, module needs, implementation services, and incumbent licensing rights.

Contracting should define authentication methods, phishing-resistant roadmap, admin controls, break-glass, recovery, log retention, SIEM export, provisioning evidence, support SLAs, security attestations, incident response, deletion, and transition assistance. If the product is used for regulated access, evidence exports and reviewable policy history should be explicit contract requirements.

## Contradictions and failure modes
Vendor claim: MFA is solved. Detection: inspect method assurance, reset workflow, admin groups, contractor paths, exceptions, and break-glass. Vendor claim: lifecycle is automated. Detection: test critical-app SCIM, attribute mapping, leaver deprovisioning, and manual fallback. Vendor claim: bundled identity is free. Detection: compare required controls, app coverage, services, support, and migration effort.

The common failure is selecting an identity platform from a headline per-user price while leaving long-tail apps, recovery workflows, and deprovisioning manual. The second is confusing MFA adoption with phishing-resistant authentication. The third is discovering during audit that logs, assignment history, and evidence exports were never specified.`,
  },
  {
    id: 'PAT-SRC-CAT-IGA-001',
    slug: 'identity-governance-access-reviews-entitlement-control-sourcing',
    title: 'Identity Governance Sourcing for Access Reviews, Lifecycle Governance, and Entitlement Control',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'IGA sourcing should prove that the buyer can govern who has access to what, whether they should still have it, and what evidence shows the control worked across applications, entitlements, and identity populations.',
    applicability:
      'Apply when sourcing SailPoint, Saviynt, Microsoft Entra ID Governance, Okta Identity Governance, One Identity Manager, Oracle Access Governance, SAP Cloud Identity Access Governance, CyberArk Identity Governance, or adjacent IGA capabilities.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/identity-governance-administration',
      'https://documentation.sailpoint.com/saas/help/certs/index.html',
      'https://documentation.sailpoint.com/saas/user-help/requests/index.html',
      'https://saviynt.com/platform',
      'https://learn.microsoft.com/en-us/entra/id-governance/deploy-access-reviews',
      'https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-overview',
      'https://help.okta.com/oie/en-us/content/topics/identity-governance/access-certification/iga-access-cert.htm',
      'https://help.okta.com/en-us/Content/Topics/identity-governance/iga.htm',
      'https://support.oneidentity.com/technical-documents/identity-manager/9.1/attestation-administration-guide/attestation-and-recertification',
      'https://docs.oracle.com/en-us/iaas/Content/access-governance/access-reviews-overview.htm',
      'https://www.sap.com/products/financial-management/cloud-iam.html',
      'https://www.cyberark.com/solutions/identity-governance/',
      'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf',
    ],
    regulatoryChips: ['SOC-2-review', 'SOX-if-financial-controls', 'NIST-800-53-AC-2', 'GDPR-if-person-data', 'HIPAA-if-PHI'],
    relatedPatternIds: ['PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CODE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'SailPoint, Saviynt, One Identity, Oracle, SAP, and CyberArk',
        tier: 'enterprise',
        positioning: 'IGA candidates for access certifications, request workflows, entitlement cataloging, lifecycle governance, role or policy management, risk scoring, and audit evidence.',
        cautions: ['Connector coverage, entitlement data quality, remediation paths, app ownership, and implementation services often determine practical value.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'SailPoint Certifications Overview', url: 'https://documentation.sailpoint.com/saas/help/certs/index.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Saviynt Identity Cloud', url: 'https://saviynt.com/platform', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Oracle Access Reviews', url: 'https://docs.oracle.com/en-us/iaas/Content/access-governance/access-reviews-overview.htm', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Entra ID Governance and Okta Identity Governance',
        tier: 'enterprise',
        positioning: 'Identity-platform-native governance candidates for access reviews, entitlement management, lifecycle workflows, and governance around apps already managed through the IdP.',
        cautions: ['Do not assume IdP-native governance replaces best-of-breed IGA until connector, entitlement, remediation, SoD, and evidence requirements are proven.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'IGA public pricing constructs only',
        model: 'hybrid',
        metric: 'Governed identities, connected applications, certifications, access requests, lifecycle workflows, entitlement catalog, SoD, analytics, add-ons, implementation services, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Entra Plans and Pricing', url: 'https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Identity populations, app connector scope, module packaging, implementation partner cost, and negotiated enterprise pricing require buyer evidence' },
        ],
        confidence: 0.52,
        notes: 'Most IGA TCO depends on data cleanup, connectors, services, modules, and governed identity scope; do not infer pricing from feature names.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Access review evidence',
        buyerPosition: 'Require reviewer assignments, decisions, comments, exceptions, campaign history, remediation actions, timestamps, and exports suitable for audit evidence.',
      },
      {
        clauseArea: 'Connector and remediation responsibility',
        buyerPosition: 'Define which applications are direct connectors, ticketed/manual fulfillment, flat-file integrations, or excluded, with remediation ownership and service levels.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Entitlement data-quality proof',
        whenToUse: 'Use before selecting a vendor whose demo assumes clean entitlement descriptions, owners, and sensitivity labels.',
        buyerAsk: 'Run a sample of buyer applications through entitlement import, owner mapping, review context, remediation, and evidence export.',
      },
      {
        lever: 'IdP-native versus best-of-breed challenger',
        whenToUse: 'Use when Entra or Okta governance modules compete with SailPoint, Saviynt, One Identity, Oracle, SAP, or CyberArk.',
        buyerAsk: 'Compare connector depth, entitlement modeling, SoD, app owner workflow, remediation, evidence, services, and implementation timeline.',
      },
    ],
    riskFactors: [
      {
        id: 'iga-rubber-stamp-review',
        label: 'Rubber-stamp access review',
        severity: 'high',
        detectionSignals: ['Campaigns are broad, reviewers lack business context, and decisions default to approve-all behavior.'],
        mitigations: ['Require entitlement descriptions, sensitivity, ownership, reviewer guidance, sampling, escalation, and remediation evidence'],
      },
      {
        id: 'iga-connector-remediation-gap',
        label: 'Connector and remediation gap',
        severity: 'critical',
        detectionSignals: ['Critical apps lack connectors or remediation paths, leaving revoked access as a ticket with no proof of completion.'],
        mitigations: ['Classify each app by integration type and test review-to-revoke evidence before award'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress privileged roles, SoD, financial applications, review frequency, auditor evidence, and regulator-visible remediation history.',
        regulatoryRefs: ['NIST SP 800-53 AC-2 as a public account-management control reference'],
      },
      {
        industry: 'healthcare',
        modifier: 'Review access to PHI systems, workforce changes, shared operational roles, emergency access, and audit evidence retention.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Plan for plant-floor apps, contractors, shared operational accounts, ERP roles, legacy systems, and manual remediation exceptions.',
      },
    ],
    body: `## Summary
Identity Governance and Administration sourcing answers a deceptively simple question: who has access to what, should they still have it, and can the organization prove the control worked? The buying decision is not just access-review software. It is a governed model for identities, entitlements, owners, requests, approvals, certifications, remediation, and audit evidence across SaaS, ERP, directories, privileged roles, cloud platforms, legacy apps, and sometimes non-human identities.

## When to apply
Use this pattern when sourcing SailPoint, Saviynt, Microsoft Entra ID Governance, Okta Identity Governance, One Identity Manager, Oracle Access Governance, SAP Cloud Identity Access Governance, CyberArk Identity Governance, or similar IGA capabilities. Apply it when audit findings, access-review fatigue, M&A, ERP modernization, SaaS sprawl, contractor expansion, privileged-role concerns, or least-privilege programs expose weak entitlement governance. Do not use it for pure SSO/MFA, pure PAM vaulting, pure CIEM, HRIS, GRC evidence management, or custom ticket workflows that lack entitlement inventory and remediation.

## Category boundary
In scope: access reviews, certifications, attestations, access requests, approval workflows, lifecycle governance, entitlement cataloging, owners, sensitivity labels, SoD checks, role or policy management, risk scoring, remediation, revocation, audit reports, evidence exports, HR source integration, IdP integration, ITSM fulfillment, and connector onboarding. Out of scope: customer identity, device management, general workflow automation, and governance claims unsupported by app-level entitlement data.

## Lifecycle and gates
The scope gate should identify governed identity populations, HR sources, directories, critical applications, entitlement owners, app owners, reviewer model, audit obligations, and current remediation paths. The RFP gate should require access-review workflow, request workflow, entitlement catalog, connector list, ticketed-app process, SoD capabilities, evidence exports, reporting, security posture, and implementation approach. The proof gate should import sample entitlements from buyer apps, run a campaign, assign reviewers, record decisions, revoke access, handle exceptions, and export evidence. The BAFO gate should normalize governed identities, applications, modules, connectors, implementation partner work, data cleanup, support, and internal owner effort.

## Evaluation rubric
Weight entitlement data quality around 20 percent, review and remediation workflow around 25 percent, connector and app coverage around 20 percent, evidence and auditability around 15 percent, lifecycle governance around 10 percent, and commercial/implementation predictability around 10 percent. Increase evidence weight when SOX, healthcare, financial controls, privileged access, ERP roles, or regulator examination are in scope.

## Pricing and contract notes
Public materials from Gartner category pages, SailPoint, Saviynt, Microsoft, Okta, One Identity, Oracle, SAP, CyberArk, and NIST support the functional scope: lifecycle, entitlement management, policy or role management, access certification, access requests, audit, and account-management controls. They do not provide buyer-specific pricing or implementation effort. IGA TCO is shaped by governed identity count, app connector scope, data cleanup, role design, entitlement ownership, module packaging, implementation partner work, and remediation operations.

Contracting should define connector commitments, evidence exports, logs, retention, reviewer history, remediation proof, SoD configuration, data ownership, transition assistance, implementation milestones, acceptance tests, and responsibilities for ticketed or manual apps. If audit deadlines are near, acceptance criteria should be tied to proof of usable evidence, not only software availability.

## Contradictions and failure modes
Vendor claim: access reviews are automated. Detection: test entitlement context, reviewer assignment, decision capture, remediation, exceptions, and evidence export. Vendor claim: IdP-native governance is enough. Detection: compare critical-app connector depth, entitlement modeling, SoD, and remediation needs. Vendor claim: AI recommendations reduce review burden. Detection: require explainability, override logs, reviewer accountability, and audit acceptance.

The common failure is buying campaign workflow while leaving entitlement data unnamed, ownerless, and unexplained. The second is launching broad reviews that reviewers rubber-stamp because context is poor. The third is discovering too late that revoked access requires manual tickets with no reliable proof of completion.`,
  },

  {
    id: 'PAT-SRC-CAT-PAM-001',
    slug: 'privileged-access-management-sourcing',
    title: 'Privileged Access Management Sourcing for Vaulting, JIT Elevation, Session Control, and Non-Human Identity Risk',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'PAM sourcing should reduce standing privilege and prove accountable, time-bound, auditable access across humans, admins, service accounts, cloud roles, secrets, and privileged sessions.',
    applicability:
      'Apply when sourcing CyberArk, BeyondTrust, Delinea, Microsoft Entra PIM, Okta Privileged Access, Saviynt PAM adjacency, AWS temporary elevated access, Google Cloud Privileged Access Manager, HashiCorp Vault or adjacent secrets and access tooling.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.cyberark.com/privileged-access-management/',
      'https://www.cyberark.com/solutions/just-in-time/',
      'https://www.cyberark.com/products/cloud-security/',
      'https://www.beyondtrust.com/products/password-safe',
      'https://delinea.com/products/secret-server',
      'https://delinea.com/products/secret-server/features/privileged-session-management',
      'https://learn.microsoft.com/en-us/azure/active-directory/active-directory-privileged-identity-management-configure',
      'https://help.okta.com/oie/en-us/content/topics/privileged-access/pam-overview.htm',
      'https://saviynt.com/products/privileged-access-management-software-solutions',
      'https://docs.aws.amazon.com/singlesignon/latest/userguide/temporary-elevated-access.html',
      'https://cloud.google.com/iam/docs/pam-overview',
      'https://www.hashicorp.com/products/vault/secrets-management',
      'https://www.cisa.gov/secure-our-world/require-multifactor-authentication',
      'https://csrc.nist.gov/Pubs/sp/800/53/r5/upd1/Final',
    ],
    regulatoryChips: ['SOC-2-review', 'NIST-800-53-review', 'PCI-if-cardholder-environment', 'SOX-if-financial-controls', 'HIPAA-if-PHI'],
    relatedPatternIds: ['PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-IGA-001', 'PAT-SRC-CAT-CODE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'CyberArk, BeyondTrust, and Delinea',
        tier: 'enterprise',
        positioning: 'Core PAM candidates for vaulting, credential discovery, password rotation, privileged session management, remote access, audit, and hybrid infrastructure coverage.',
        cautions: ['Validate cloud admin, SaaS admin, developer, non-human identity, and secrets-management coverage instead of assuming vaulting equals complete PAM maturity.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'CyberArk Privileged Access Management', url: 'https://www.cyberark.com/privileged-access-management/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'BeyondTrust Password Safe', url: 'https://www.beyondtrust.com/products/password-safe', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Delinea Secret Server', url: 'https://delinea.com/products/secret-server', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Entra PIM, Okta Privileged Access, Saviynt, AWS, Google Cloud, and HashiCorp',
        tier: 'specialist',
        positioning: 'Adjacent and workload-specific privileged access options for identity-platform activation, cloud JIT elevation, access requests, secrets, service accounts, and non-human identity patterns.',
        cautions: ['Do not treat cloud PIM, IGA/PAM adjacency, and secrets management as full substitutes for enterprise PAM without target-system and session-control proof.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'PAM public pricing constructs only',
        model: 'hybrid',
        metric: 'Privileged users, managed accounts, secrets, target systems, sessions, session recording retention, modules, deployment model, integrations, support, and services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Entra plans and PIM packaging context', url: 'https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'PAM user counts, managed account inventory, secrets volume, session retention, target systems, and negotiated terms require buyer evidence' },
        ],
        confidence: 0.50,
        notes: 'Public pages support capability and packaging constructs, not buyer-specific PAM TCO or discount assumptions.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Privileged access evidence and accountability',
        buyerPosition: 'Require named-user attribution, approvals, justification, session logs, recording retention, command/activity evidence, emergency access runbooks, and exportable audit trails.',
      },
      {
        clauseArea: 'Secrets and non-human identity control',
        buyerPosition: 'Define discovery, ownership, rotation, expiration, API token/key handling, workload identity coverage, and migration from unmanaged secrets stores.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Standing privilege reduction proof',
        whenToUse: 'Use when the vendor claims zero standing privilege or JIT access coverage.',
        buyerAsk: 'Demonstrate one cloud admin, one database admin, one server admin, one break-glass, and one non-human identity path from request to expiration and evidence export.',
      },
      {
        lever: 'Target-system inventory normalization',
        whenToUse: 'Use before BAFO when proposals count privileged users but not accounts, secrets, sessions, systems, or retention.',
        buyerAsk: 'Normalize commercial model against target systems, privileged accounts, secrets, session volumes, recording retention, and implementation services.',
      },
    ],
    riskFactors: [
      {
        id: 'pam-standing-admin-sprawl',
        label: 'Standing privileged access sprawl',
        severity: 'critical',
        detectionSignals: ['Permanent global admin, domain admin, root, owner, service-account, or shared admin access exists without time-bound activation.'],
        mitigations: ['Require discovery, vaulting or brokered access, JIT activation, approvals, rotation, MFA, monitoring, and offboarding evidence'],
      },
      {
        id: 'pam-session-accountability-gap',
        label: 'Privileged session accountability gap',
        severity: 'high',
        detectionSignals: ['Privileged sessions are not tied to named users, approvals, recordings, commands, or reliable audit export.'],
        mitigations: ['Test session brokering, recording, termination, audit export, and SIEM/ITSM integration for critical systems'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress privileged financial systems, SoD, regulator-visible evidence, session review, break-glass controls, and privileged cloud roles.',
        regulatoryRefs: ['NIST SP 800-53 AC and AU control families as public control references'],
      },
      {
        industry: 'healthcare',
        modifier: 'Review privileged access to PHI systems, emergency workflows, vendor support sessions, audit retention, and account recovery controls.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review FedRAMP/public-sector eligibility, air-gapped or self-hosted needs, records retention, admin accountability, and contractor access.',
      },
    ],
    body: `## Summary
Privileged Access Management sourcing is the access-control decision for the most dangerous identities in the environment. A credible PAM event must cover human administrators, shared accounts, service accounts, break-glass users, cloud roles, local admins, secrets, API keys, privileged sessions, and third-party support paths. The goal is not to buy a vault; it is to reduce standing privilege and prove who had elevated access, why, what they did, and when the privilege ended.

## When to apply
Use this pattern when sourcing CyberArk, BeyondTrust, Delinea, Microsoft Entra PIM, Okta Privileged Access, Saviynt PAM adjacency, AWS IAM Identity Center temporary elevated access, Google Cloud Privileged Access Manager, HashiCorp Vault/Boundary-style access, or adjacent secrets and privileged-access tooling. Apply it after audit findings, credential compromise, cloud migration, secrets sprawl, ransomware concern, cyber-insurance review, M&A, or developer-platform modernization. Do not use it for ordinary SSO/MFA, consumer password management, SIEM, security awareness, or ITSM workflows unless privileged access is the sourcing anchor.

## Category boundary
In scope: credential discovery, vaulting, rotation, checkout, session brokering, session recording, JIT elevation, approval workflows, emergency access, local admin control, cloud admin activation, SaaS admin access, service accounts, secrets, SSH keys, certificates, API tokens, vendor access, audit evidence, SIEM integration, ITSM integration, and migration from legacy vaults. Adjacent but distinct: IAM, IGA, CIEM, endpoint privilege management, and secrets management. Each may be in scope, but only after the buyer names the control boundary.

## Lifecycle and gates
The scope gate should inventory privileged users, admin groups, shared accounts, service accounts, cloud roles, secrets stores, target systems, privileged sessions, break-glass accounts, vendor access, and current audit gaps. The RFP gate should require target-system support, deployment model, session controls, JIT model, secrets handling, evidence exports, retention, support, and implementation approach. The proof gate should test one server admin, one database admin, one cloud admin, one break-glass, one vendor session, and one non-human identity path. The BAFO gate should normalize privileged users, managed accounts, secrets, target systems, sessions, recording retention, integrations, modules, support, and services.

## Evaluation rubric
Weight standing-privilege reduction around 25 percent, target-system coverage around 20 percent, session accountability around 20 percent, secrets and non-human identity coverage around 15 percent, audit/evidence around 10 percent, and commercial predictability around 10 percent. Increase session and evidence weight when regulated systems, production infrastructure, third-party support, or financial controls are in scope.

## Pricing and contract notes
Public vendor materials from CyberArk, BeyondTrust, Delinea, Microsoft, Okta, Saviynt, AWS, Google Cloud, HashiCorp, CISA, and NIST support the category constructs: vaulting, JIT activation, session control, secrets, cloud access, MFA, least privilege, and audit evidence. They do not prove buyer-specific pricing or outcome savings. PAM TCO depends on privileged populations, managed accounts, secrets, target systems, recording retention, deployment model, implementation services, integrations, and operating ownership.

Contracting should define discovery obligations, supported targets, named-user attribution, approval records, session recording retention, emergency access, rotation cadence, secrets ownership, audit export, SIEM/ITSM integration, incident support, transition assistance, and acceptance tests. If non-human identities are in scope, token, key, certificate, and workload identity lifecycle controls should be explicit.

## Contradictions and failure modes
Vendor claim: zero standing privilege. Detection: test whether global admins, service accounts, break-glass users, cloud roles, and vendor sessions actually expire. Vendor claim: full PAM coverage. Detection: compare servers, databases, network devices, SaaS consoles, cloud accounts, Kubernetes, and secrets stores. Vendor claim: audit-ready. Detection: export approvals, recordings, commands, rotations, and revocations.

The common failure is buying vaulting while leaving cloud, DevOps, SaaS, and non-human privilege outside scope. The second is recording sessions without named accountability or usable evidence export. The third is treating break-glass accounts as exceptions that never get monitored, rotated, or tested.`,
  },
  {
    id: 'PAT-SRC-CAT-SASE-001',
    slug: 'sase-sse-zero-trust-network-access-sourcing',
    title: 'SASE and SSE Sourcing for ZTNA, SWG, CASB, DLP, and Secure Connectivity',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'SASE and SSE sourcing should prove access, inspection, data protection, network performance, identity integration, and branch or remote-user migration rather than accepting platform-convergence claims at face value.',
    applicability:
      'Apply when sourcing Zscaler, Netskope, Palo Alto Prisma Access, Cloudflare One, Cisco Secure Access or Umbrella, Fortinet, Cato Networks, and adjacent ZTNA, SWG, CASB, DLP, FWaaS, SD-WAN, and secure browser services.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.zscaler.com/pricing-and-plans',
      'https://www.zscaler.com/products/zero-trust-exchange',
      'https://www.netskope.com/netskope-one',
      'https://www.netskope.com/products/security-service-edge',
      'https://www.paloaltonetworks.com/prisma/access',
      'https://www.cloudflare.com/plans/zero-trust-services/',
      'https://www.cloudflare.com/sase/',
      'https://www.cisco.com/site/us/en/products/security/secure-access/index.html',
      'https://www.fortinet.com/products/sase',
      'https://www.catonetworks.com/sase/',
    ],
    regulatoryChips: ['SOC-2-review', 'GDPR-if-person-data', 'HIPAA-if-PHI', 'data-residency-review', 'DORA-if-regulated-financial-entity'],
    relatedPatternIds: ['PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-SIEM-001', 'PAT-SRC-CAT-PAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Zscaler, Netskope, Palo Alto Prisma Access, and Cloudflare One',
        tier: 'enterprise',
        positioning: 'Cloud-delivered SASE/SSE candidates spanning private access, secure web gateway, CASB, DLP, firewall-as-a-service, browser isolation, AI controls, and global connectivity.',
        cautions: ['Validate which capabilities are included, add-on, preview, region-limited, or dependent on endpoint agents, tunnels, SD-WAN, identity, or log pipelines.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zscaler Pricing and Plans', url: 'https://www.zscaler.com/pricing-and-plans', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Netskope One', url: 'https://www.netskope.com/netskope-one', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Cloudflare Zero Trust and SASE Plans', url: 'https://www.cloudflare.com/plans/zero-trust-services/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Cisco, Fortinet, Cato Networks, and network/security incumbents',
        tier: 'enterprise',
        positioning: 'SASE candidates where SD-WAN, firewall, branch networking, secure access, and existing security estate integration are commercial and operational decision drivers.',
        cautions: ['Separate SSE-only modernization from full SASE branch/network transformation and managed-service operating models.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'SASE/SSE public pricing constructs only',
        model: 'hybrid',
        metric: 'Users, branches, bandwidth, modules, private apps, locations, data security, browser isolation, SD-WAN, logs, support, and migration services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zscaler Pricing and Plans', url: 'https://www.zscaler.com/pricing-and-plans', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Cloudflare Zero Trust Services Plans', url: 'https://www.cloudflare.com/plans/zero-trust-services/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Remote user counts, branch sites, bandwidth, private apps, DLP scope, log retention, and negotiated enterprise terms require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Do not compare SASE vendors from named modules alone; pricing and scope depend on users, traffic, apps, branches, and data controls.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Access and inspection acceptance tests',
        buyerPosition: 'Require proof for private-app access, internet egress, SaaS controls, TLS inspection, DLP policy, device posture, identity integration, logging, and bypass handling.',
      },
      {
        clauseArea: 'Performance and data-location commitments',
        buyerPosition: 'Define regions, PoPs, latency expectations, decryption scope, tunnel availability, incident support, log export, and data-processing boundaries.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'SSE versus full SASE decomposition',
        whenToUse: 'Use when vendors bundle ZTNA/SWG/CASB/DLP with SD-WAN, FWaaS, branch networking, or managed services.',
        buyerAsk: 'Separate remote-user security, private access, branch connectivity, data protection, and network transformation into priced modules and milestones.',
      },
      {
        lever: 'Critical-app and branch pilot',
        whenToUse: 'Use before replacing VPN, proxy, secure web gateway, or branch firewall controls.',
        buyerAsk: 'Pilot top private apps, top SaaS apps, high-latency locations, contractors, unmanaged devices, and break-glass paths with measured logs and user experience.',
      },
    ],
    riskFactors: [
      {
        id: 'sase-platform-convergence-gap',
        label: 'Platform convergence gap',
        severity: 'high',
        detectionSignals: ['Proposal labels capabilities as unified SASE while policy, logs, agents, tunnels, DLP, and branch controls remain fragmented.'],
        mitigations: ['Require architecture proof, single-policy evidence, log export, identity/device integration, and module-by-module acceptance tests'],
      },
      {
        id: 'sase-user-experience-blindspot',
        label: 'User experience and bypass blindspot',
        severity: 'high',
        detectionSignals: ['Pilot ignores high-latency regions, contractors, mobile users, private apps, certificate pinning, and bypass procedures.'],
        mitigations: ['Run geographically representative pilot with app performance, failure, bypass, and helpdesk evidence'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress data loss controls, private-app access, inspection logs, outsourcing review, operational resilience, and exit plans.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI traffic, BAA posture, unmanaged devices, clinical app latency, emergency access, and log retention.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Plan carefully around plant networks, OT segmentation, low-latency needs, contractors, remote support, and branch migration sequencing.',
      },
    ],
    body: `## Summary
SASE and SSE sourcing is a convergence decision, but convergence must be proven. The buyer is usually replacing or rationalizing VPN, secure web gateway, cloud access security broker, data loss prevention, firewall-as-a-service, browser isolation, remote access, and sometimes SD-WAN or branch security. A strong sourcing event separates what must work for users, apps, data, branches, and security operations from the vendor story that all of those controls live on one platform.

## When to apply
Use this pattern when sourcing Zscaler, Netskope, Palo Alto Prisma Access, Cloudflare One, Cisco Secure Access or Umbrella, Fortinet, Cato Networks, or adjacent SASE, SSE, ZTNA, SWG, CASB, DLP, FWaaS, SD-WAN, or secure browser capabilities. Apply it during VPN replacement, proxy renewal, remote-work modernization, branch transformation, SaaS data-control expansion, AI-use governance, or network/security consolidation. Do not use it for IAM, EDR, SIEM, endpoint management, or network hardware refresh unless secure access and cloud-delivered inspection are the sourcing anchor.

## Category boundary
In scope: zero trust network access, private-app access, secure web gateway, CASB, DLP, TLS inspection, remote browser isolation, AI app controls, firewall-as-a-service, DNS security, device posture, endpoint agent, tunnels, PoPs, branch connectors, SD-WAN adjacency, identity integration, log export, policy management, data residency, support, and migration. Out of scope: generic firewalls, pure identity, pure endpoint, and broad network outsourcing unless they are bundled into SASE scope.

## Lifecycle and gates
The scope gate should inventory users, contractors, devices, locations, branches, private apps, SaaS apps, internet egress, VPN use, proxies, DLP policies, identity providers, certificates, logs, and regional constraints. The RFP gate should require capability packaging, architecture, endpoint requirements, PoP/region model, inspection behavior, log export, data processing, support, and migration approach. The proof gate should test private apps, SaaS controls, internet browsing, TLS inspection, DLP, identity/device posture, contractor access, mobile access, high-latency geographies, bypass, and failure modes. The BAFO gate should normalize users, branches, bandwidth, modules, private apps, log retention, support, services, and incumbent displacement.

## Evaluation rubric
Weight security policy coverage around 25 percent, user/app performance around 20 percent, identity/device/log integration around 15 percent, data protection around 15 percent, migration and operations around 15 percent, and commercial predictability around 10 percent. Increase performance weight for globally distributed workforces, branch-heavy environments, clinical/plant operations, and latency-sensitive apps.

## Pricing and contract notes
Public materials from Zscaler, Netskope, Palo Alto, Cloudflare, Cisco, Fortinet, and Cato identify SASE and SSE constructs such as ZTNA, SWG, CASB, DLP, FWaaS, SD-WAN, browser isolation, AI controls, logs, branches, and support. Zscaler and Cloudflare public pages expose packaging constructs, while many enterprise SASE proposals remain quote-led. Do not infer private discounts or total cost from module names. Model users, apps, locations, traffic, branches, inspection scope, log retention, migration services, and existing network/security contracts.

Contracting should define included modules, add-ons, data-processing regions, logging, export, support SLAs, incident handling, decryption responsibilities, bypass controls, migration milestones, professional services, and exit assistance. If SASE replaces VPN or branch controls, acceptance criteria should include measured user experience and rollback plans.

## Contradictions and failure modes
Vendor claim: unified SASE platform. Detection: inspect policy planes, logs, agent behavior, tunnels, DLP, branch controls, and admin consoles. Vendor claim: VPN replacement is straightforward. Detection: test legacy apps, contractors, unmanaged devices, protocols, latency, and emergency access. Vendor claim: data protection is included. Detection: verify inline SaaS controls, DLP dictionaries, OCR/file handling, AI apps, exceptions, and evidence export.

The common failure is choosing a SASE vendor from platform breadth while ignoring migration complexity. The second is testing only headquarters users and missing regional latency, contractor, mobile, branch, or certificate-pinned app problems. The third is treating SSE modernization and full SASE branch transformation as the same project.`,
  },
  {
    id: 'PAT-SRC-CAT-SIEM-001',
    slug: 'siem-security-analytics-log-management-sourcing',
    title: 'SIEM, Security Analytics, and Log Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'SIEM sourcing should normalize telemetry, analytics, retention, detection content, SOC workflow, and cost drivers before accepting claims about security visibility or AI-powered operations.',
    applicability:
      'Apply when sourcing Splunk Enterprise Security, Microsoft Sentinel, Google Security Operations, IBM QRadar, Elastic Security, Sumo Logic Cloud SIEM, Datadog Cloud SIEM, Exabeam, LogRhythm, SOAR, MDR, or security data lake adjacency.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://csrc.nist.gov/glossary/term/Security_Information_and_Event_Management',
      'https://www.nist.gov/publications/guide-computer-security-log-management',
      'https://www.gartner.com/it-glossary/security-information-and-event-management-siem',
      'https://www.splunk.com/en_us/products/enterprise-security.html',
      'https://www.splunk.com/en_us/products/pricing.html',
      'https://www.microsoft.com/en-us/security/business/siem-and-xdr/microsoft-sentinel',
      'https://www.microsoft.com/en-us/security/pricing/microsoft-sentinel/',
      'https://learn.microsoft.com/en-us/azure/sentinel/automation/automation',
      'https://cloud.google.com/security/products/security-information-event-management',
      'https://www.ibm.com/products/qradar-siem/pricing',
      'https://www.elastic.co/security/siem',
      'https://www.sumologic.com/solutions/cloud-siem',
      'https://www.datadoghq.com/product/cloud-siem/',
      'https://www.exabeam.com/capabilities/siem/',
    ],
    regulatoryChips: ['SOC-2-review', 'NIST-800-92-review', 'PCI-if-cardholder-environment', 'HIPAA-if-PHI', 'DORA-if-regulated-financial-entity'],
    relatedPatternIds: ['PAT-SRC-CAT-SASE-001', 'PAT-SRC-CAT-PAM-001', 'PAT-SRC-CAT-OBS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Splunk, Microsoft Sentinel, Google Security Operations, IBM QRadar, Elastic, Sumo Logic, Datadog, and Exabeam',
        tier: 'enterprise',
        positioning: 'Security analytics and SIEM candidates for log collection, normalization, correlation, detection, hunting, case workflow, SOAR, UEBA, compliance reporting, and security data lake adjacency.',
        cautions: ['Pricing and value depend on telemetry volume, hot/cold retention, search workload, detection content, analyst workflow, and managed-service operating model.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Splunk pricing options', url: 'https://www.splunk.com/en_us/products/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Sentinel pricing', url: 'https://www.microsoft.com/en-us/security/pricing/microsoft-sentinel/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'IBM QRadar SIEM pricing', url: 'https://www.ibm.com/products/qradar-siem/pricing', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'MDR, MSSP, SOAR, XDR, and observability-log adjacency',
        tier: 'specialist',
        positioning: 'Adjacent delivery models where tooling is bundled with 24/7 monitoring, response automation, detection engineering, or broader observability and incident workflows.',
        cautions: ['Managed service packaging can hide SIEM license, telemetry, retention, response, and staffing assumptions.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'SIEM public pricing constructs only',
        model: 'hybrid',
        metric: 'GB/day, EPS/FPM, analyzed events, workload compute, storage, hot/cold retention, entities, connectors, SOAR runs, support, and managed services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Splunk workload and ingest pricing options', url: 'https://www.splunk.com/en_us/products/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Sentinel pricing', url: 'https://www.microsoft.com/en-us/security/pricing/microsoft-sentinel/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer telemetry inventory, retention, detection workload, cloud terms, SOC staffing, and negotiated enterprise pricing require evidence' },
        ],
        confidence: 0.64,
        notes: 'Normalize logs collected, indexed, analyzed, searched, and retained; do not compare SIEMs from headline ingest alone.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Telemetry and retention model',
        buyerPosition: 'Define source inventory, parsing, indexing, analytics tier, data lake/archive tier, hot retention, cold retention, search rights, export, and deletion obligations.',
      },
      {
        clauseArea: 'Detection content and workflow portability',
        buyerPosition: 'Require rule export, parser documentation, case history, playbook export, ATT&CK mapping, migration assistance, and acceptance tests for high-value detections.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Telemetry tiering model',
        whenToUse: 'Use when vendors price by ingest, analyzed logs, workload, storage, or security data lake tiers.',
        buyerAsk: 'Classify high-value analytics logs, lower-value archive logs, compliance retention, and search/hunt workloads before BAFO.',
      },
      {
        lever: 'Detection migration proof',
        whenToUse: 'Use when replacing an incumbent SIEM or moving to MDR/SOC service.',
        buyerAsk: 'Convert representative parsers, correlation rules, dashboards, cases, and playbooks before award.',
      },
    ],
    riskFactors: [
      {
        id: 'siem-send-everything-cost-loop',
        label: 'Send-everything SIEM cost loop',
        severity: 'high',
        detectionSignals: ['Buyer cannot distinguish logs collected, indexed, analyzed, retained hot, retained cold, or searched frequently.'],
        mitigations: ['Require source inventory, telemetry tiering, retention policy, filtering, and monthly cost reporting'],
      },
      {
        id: 'siem-detection-migration-gap',
        label: 'Detection migration gap',
        severity: 'critical',
        detectionSignals: ['Existing detections, parsers, dashboards, cases, and playbooks are undocumented or vendor-specific.'],
        mitigations: ['Run migration proof for critical detections and require export/transition assistance'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress log retention, privileged activity, fraud/security correlation, regulator-ready evidence, outsourcing review, and operational resilience.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI-adjacent logs, audit retention, user access monitoring, incident evidence, and minimum necessary log handling.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review data residency, procurement vehicle, sensitive-log handling, records retention, and managed-service eligibility.',
      },
    ],
    body: `## Summary
SIEM sourcing is a security-operations operating model decision. The buyer is choosing how telemetry becomes detection, investigation, response, compliance evidence, and executive confidence. That requires more than comparing log-ingest prices. A credible event normalizes source inventory, parsing, analytics tiers, retention, detection engineering, case workflow, SOAR, MDR adjacency, staffing, and the ability to migrate or export detections later.

## When to apply
Use this pattern when sourcing Splunk Enterprise Security, Microsoft Sentinel, Google Security Operations, IBM QRadar, Elastic Security, Sumo Logic Cloud SIEM, Datadog Cloud SIEM, Exabeam, LogRhythm, SOAR, MDR, MSSP, or security data lake architectures. Apply it during renewal, ingest overage, legacy SIEM migration, cloud SIEM modernization, SOC transformation, cyber-insurance pressure, audit remediation, major incident response improvement, or MDR evaluation. Do not use it for endpoint-only EDR/XDR, pure observability logging, ITSM, vulnerability management, or threat-intelligence feeds unless SIEM workflow is the sourcing anchor.

## Category boundary
In scope: security log ingestion, event normalization, parsers, correlation, detections, UEBA/entity analytics, threat hunting, dashboards, case management, SOAR, enrichment, threat intelligence, compliance reporting, hot retention, archive retention, data lake tiering, connectors, APIs, federated search, managed detection, and migration services. Out of scope: generic APM/log observability, endpoint protection, incident-response retainers, and SOC labor unless directly bundled into the SIEM or MDR workflow.

## Lifecycle and gates
The scope gate should inventory log sources, daily ingest, EPS/FPM, cloud accounts, identity sources, EDR, firewalls, SaaS, OT/IoT, custom apps, compliance retention, high-value detections, and SOC staffing model. The RFP gate should require pricing meters, parsing coverage, detection content, retention tiers, export rights, SOAR capabilities, data residency, support, and managed-service options. The proof gate should ingest representative logs, parse critical sources, trigger high-value detections, open cases, run enrichment, search retained data, export evidence, and model monthly cost. The BAFO gate should normalize ingestion, analyzed logs, workload compute, storage, retention, entities, connectors, playbooks, support, migration, and managed services.

## Evaluation rubric
Weight telemetry coverage and parsing around 20 percent, detection quality around 20 percent, cost predictability around 20 percent, SOC workflow around 15 percent, retention and compliance around 15 percent, and portability around 10 percent. Increase retention and evidence weight for regulated industries and increase workflow weight when 24/7 MDR or co-managed SOC is in scope.

## Pricing and contract notes
Public materials from Splunk, Microsoft Sentinel, Google Security Operations, IBM QRadar, Elastic, Sumo Logic, Datadog, and Exabeam show materially different meters: ingest, workload compute, analyzed events, EPS/FPM, entities, credits, storage, retention, and packages. Microsoft also calls out analytics and data lake tiers; Splunk publishes both workload and ingest pricing constructs; IBM lists usage and enterprise constructs. These sources identify meter families, not buyer-specific TCO. The buyer must model logs collected, logs indexed, logs analyzed, logs retained hot, logs archived, search workload, and SOC process.

Contracting should define source onboarding, parser ownership, detection content, rule export, playbook export, case history, retention, data residency, API access, support, professional services, transition assistance, and managed-service responsibilities. If an MDR provider is included, separate tool licensing, data ownership, response authority, escalation paths, and exit rights.

## Contradictions and failure modes
Vendor claim: AI SOC reduces analyst burden. Detection: inspect workflow, evidence, permissions, auditability, and analyst validation. Vendor claim: pricing is predictable. Detection: model daily ingest, search workload, retention, cloud services, SOAR runs, and growth. Vendor claim: migration is straightforward. Detection: convert actual parsers, rules, dashboards, cases, and playbooks.

The common failure is sending every log to the highest-cost tier without source value or retention policy. The second is losing detection coverage during migration because rules and parsers were not inventoried. The third is buying managed detection while leaving response authority, evidence ownership, and SIEM data portability ambiguous.`,
  },
];

export const SOURCING_CATEGORY_PATTERN_COUNT = SOURCING_CATEGORY_PATTERNS.length;
export const SOURCING_CATEGORY_PATTERN_IDS = SOURCING_CATEGORY_PATTERNS.map((pattern) => pattern.id);
