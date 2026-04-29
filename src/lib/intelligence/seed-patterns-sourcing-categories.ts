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
];

export const SOURCING_CATEGORY_PATTERN_COUNT = SOURCING_CATEGORY_PATTERNS.length;
export const SOURCING_CATEGORY_PATTERN_IDS = SOURCING_CATEGORY_PATTERNS.map((pattern) => pattern.id);
