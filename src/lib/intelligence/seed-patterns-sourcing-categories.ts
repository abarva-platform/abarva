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

  {
    id: 'PAT-SRC-CAT-EDR-001',
    slug: 'edr-xdr-endpoint-security-sourcing',
    title: 'EDR, XDR, and Endpoint Security Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Endpoint security sourcing should evaluate telemetry, investigation, response authority, fleet coverage, data export, and MDR adjacency instead of treating EDR as a simple antivirus replacement.',
    applicability:
      'Apply when sourcing CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne Singularity, Palo Alto Cortex XDR, Trend Vision One, Sophos XDR, VMware Carbon Black, Tanium adjacency, and MDR/MXDR endpoint programs.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.crowdstrike.com/tech-hub/endpoint-security/falcon-insight-xdr-walkthrough/',
      'https://www.crowdstrike.com/en-us/resources/data-sheets/falcon-data-replicator/',
      'https://www.crowdstrike.com/en-us/pricing/falcon-pro/',
      'https://www.microsoft.com/en-us/security/business/security-101/what-is-edr-endpoint-detection-response',
      'https://learn.microsoft.com/en-us/defender-endpoint/api/management-apis',
      'https://learn.microsoft.com/en-us/defender-xdr/streaming-api',
      'https://learn.microsoft.com/en-us/defender-endpoint/defender-endpoint-plan-1',
      'https://learn.microsoft.com/en-us/defender-xdr/managed-detection-and-response-xdr',
      'https://www.sentinelone.com/platform/',
      'https://www.sentinelone.com/platform-packages/',
      'https://www.sentinelone.com/platform/singularity-complete/',
      'https://www.paloaltonetworks.com/cortex/cortex-xdr',
      'https://www.trendmicro.com/content/dam/trendmicro/global/en/core/docs/datasheets/ds-xdr-for-endpoints.pdf',
      'https://developer.carbonblack.com/reference/carbon-black-cloud/cb-defense/',
      'https://developer.tanium.com/guides/core-platform/integration_methods',
    ],
    regulatoryChips: ['SOC-2-review', 'endpoint-privacy-review', 'GDPR-if-person-data', 'HIPAA-if-PHI', 'PCI-if-cardholder-environment'],
    relatedPatternIds: ['PAT-SRC-CAT-SIEM-001', 'PAT-SRC-CAT-PAM-001', 'PAT-SRC-CAT-CSP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'CrowdStrike, Microsoft Defender for Endpoint, SentinelOne, and Palo Alto Cortex XDR',
        tier: 'enterprise',
        positioning: 'Primary endpoint/XDR candidates for agent-based prevention, detection, investigation, hunting, response actions, cross-domain correlation, and MDR adjacency.',
        cautions: ['Validate endpoint, server, cloud workload, telemetry retention, export, and MDR packaging separately instead of comparing headline endpoint seats.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'CrowdStrike Falcon Insight XDR walkthrough', url: 'https://www.crowdstrike.com/tech-hub/endpoint-security/falcon-insight-xdr-walkthrough/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Defender for Endpoint API overview', url: 'https://learn.microsoft.com/en-us/defender-endpoint/api/management-apis', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'SentinelOne platform packages', url: 'https://www.sentinelone.com/platform-packages/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Trend Vision One, Sophos, VMware Carbon Black, Tanium, MDR/MXDR providers',
        tier: 'specialist',
        positioning: 'Endpoint security, XDR, endpoint management/security-operations, and managed-response options where fleet operations, response workflows, data export, or service capacity drive selection.',
        cautions: ['Treat Tanium as endpoint-management/security-operations adjacency unless the buyer validates direct EDR equivalence for its use case.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Endpoint security public pricing constructs only',
        model: 'hybrid',
        metric: 'Endpoint, user, server, workload, module bundle, retention, data export, MDR/MXDR, support, and partner service scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'CrowdStrike public bundle pricing page', url: 'https://www.crowdstrike.com/en-us/pricing/falcon-pro/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'SentinelOne platform packages', url: 'https://www.sentinelone.com/platform-packages/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Endpoint population, server/workload scope, retention needs, MDR authority, SIEM export, and negotiated enterprise terms require buyer evidence' },
        ],
        confidence: 0.57,
        notes: 'Public pages reveal packaging and some list-price constructs, but enterprise endpoint total cost depends on fleet, modules, retention, services, and telemetry economics.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Telemetry ownership and export',
        buyerPosition: 'Require searchable retention, raw/normalized export options, API limits, SIEM/data-lake delivery, deletion handling, data residency, and transition assistance.',
      },
      {
        clauseArea: 'Response authority and MDR scope',
        buyerPosition: 'Define which response actions are automated, recommended, or human-approved, and separate vendor MDR duties from buyer SOC duties.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Fleet coverage proof',
        whenToUse: 'Use when the buyer has mixed Windows, macOS, Linux, server, VDI, cloud workload, contractor, or unmanaged endpoint populations.',
        buyerAsk: 'Prove deployment, telemetry, performance, response, and uninstall/rollback behavior across representative endpoint classes.',
      },
      {
        lever: 'Telemetry-to-SIEM model',
        whenToUse: 'Use when endpoint telemetry will feed SIEM, data lake, MDR, or incident response workflows.',
        buyerAsk: 'Price and prove export method, retention, schema, latency, API limits, and downstream ingestion cost before award.',
      },
    ],
    riskFactors: [
      {
        id: 'edr-coverage-gap',
        label: 'Endpoint coverage gap',
        severity: 'critical',
        detectionSignals: ['Mac, Linux, server, VDI, contractor, mobile, unmanaged, disconnected, or ephemeral cloud workloads are not covered by the same agent and policy model.'],
        mitigations: ['Require fleet inventory, deployment proof, exception handling, and compensating controls before rollout'],
      },
      {
        id: 'edr-telemetry-economics-gap',
        label: 'Endpoint telemetry economics gap',
        severity: 'high',
        detectionSignals: ['Buyer assumes telemetry is free, raw, unlimited, real-time, retained indefinitely, and cheap to ingest into SIEM.'],
        mitigations: ['Separate endpoint license, telemetry export, retention, SIEM ingestion, and data-lake cost models'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress response authorization, privileged endpoint activity, retention, forensic export, regulator-ready evidence, and endpoint coverage for contractors and developers.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review clinical endpoint performance, PHI-adjacent telemetry, shared workstations, emergency workflows, medical-device adjacency, and support windows.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Separate corporate endpoint EDR from plant-floor OT/IoT constraints, disconnected endpoints, maintenance windows, and fragile legacy systems.',
      },
    ],
    body: `## Summary
EDR and XDR sourcing is not just an antivirus replacement. The buyer is choosing how endpoint activity becomes prevention, detection, investigation, response, forensic evidence, and cross-domain security context. That means the event must examine fleet coverage, telemetry quality, response authority, retention, data export, analyst workflow, MDR scope, and operating burden alongside agent price.

## When to apply
Use this pattern when sourcing CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne Singularity, Palo Alto Cortex XDR, Trend Vision One, Sophos XDR, VMware Carbon Black, Tanium-adjacent endpoint operations, MDR/MXDR services, or endpoint telemetry pipelines. Apply it during legacy AV renewal, ransomware concern, cyber-insurance review, Microsoft 365/E5 rationalization, breach findings, SOC modernization, endpoint fleet growth, M&A, SIEM retention pressure, or 24/7 monitoring gaps. Do not use it for consumer antivirus, pure MDM/UEM, pure SIEM, backup, DLP-only, or CNAPP-only buying unless endpoint agent/control is central.

## Category boundary
In scope: endpoint prevention, EDR, XDR, threat hunting, endpoint telemetry, response actions, isolation/quarantine, investigation, forensics, server/workload agents, retention, API/export, SIEM integration, SOAR integration, MDR, vulnerability/exposure adjacency, identity/cloud/email/network telemetry correlation, and deployment operations. Adjacent but distinct: SIEM, CNAPP, IAM, NDR, ITDR, endpoint management, backup, and incident-response retainers.

## Lifecycle and gates
The scope gate should inventory users, endpoints, servers, operating systems, VDI, contractors, BYOD, cloud workloads, disconnected endpoints, current agents, exclusions, compliance constraints, telemetry destinations, and SOC staffing. The RFP gate should require platform coverage, response actions, telemetry retention, export, privacy, support, MDR scope, API limits, and pricing meters. The proof gate should deploy to representative devices, test performance, agent conflicts, detection workflow, response actions, export to SIEM, retention search, role-based access, and rollback. The BAFO gate should normalize endpoints, users, servers, workloads, modules, retention, telemetry export, MDR, support, services, and downstream SIEM cost.

## Evaluation rubric
Weight endpoint coverage around 25 percent, detection/investigation workflow around 20 percent, response authority around 15 percent, telemetry export and retention around 15 percent, deployment/operations around 15 percent, and commercial predictability around 10 percent. Increase operations weight for healthcare, manufacturing, VDI-heavy fleets, and high-Mac/Linux/server environments.

## Pricing and contract notes
Public sources from CrowdStrike, Microsoft, SentinelOne, Palo Alto, Trend, Sophos, Carbon Black, Tanium, and MITRE identify packaging constructs such as endpoint bundles, MDR adjacency, telemetry export, API access, XDR correlation, and ATT&CK-informed evaluation. Public pricing may exist for some bundles, but enterprise terms, server/workload licensing, retention, telemetry export, and MDR authority remain buyer-specific. Do not infer breach reduction, ROI, or discounting from vendor pages.

Contracting should define covered endpoint classes, telemetry ownership, search retention, raw and normalized export, API limits, data residency, privacy controls, response actions, MDR authorization, incident escalation, support SLAs, agent rollback, transition assistance, and evidence availability.

## Contradictions and failure modes
Vendor claim: XDR replaces separate tools. Detection: test SIEM, SOAR, identity, cloud, NDR, vulnerability, and MDR workflow boundaries. Vendor claim: endpoint visibility is complete. Detection: inspect macOS, Linux, servers, VDI, contractors, disconnected endpoints, and cloud workloads. Vendor claim: telemetry export is included. Detection: verify schema, latency, retention, API limits, and downstream cost.

The common failure is selecting the endpoint agent while ignoring SOC workflow and telemetry economics. The second is discovering that servers, Linux, VDI, contractors, or cloud workloads license differently. The third is assuming MDR is included or authorized to act when the contract only provides recommendations.`,
  },
  {
    id: 'PAT-SRC-CAT-CSP-001',
    slug: 'cloud-security-posture-cnapp-sourcing',
    title: 'Cloud Security Posture, CNAPP, CSPM, CWPP, and CIEM Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'CNAPP sourcing should connect posture, workload, identity, code, runtime, and remediation evidence so buyers can prioritize exploitable cloud risk rather than buying another noisy findings dashboard.',
    applicability:
      'Apply when sourcing Wiz, Palo Alto Prisma Cloud or Cortex Cloud, Microsoft Defender for Cloud, CrowdStrike Falcon Cloud Security, Lacework FortiCNAPP, Orca, Check Point CloudGuard, AWS Security Hub or Inspector, Google Security Command Center, CSPM, CWPP, CIEM, and CNAPP platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://abc.xyz/investor/news/news-details/2026/Google-Completes-Acquisition-of-Wiz-2026-ta7OaU2uA0/default.aspx',
      'https://cloud.google.com/blog/products/identity-security/google-announces-agreement-acquire-wiz',
      'https://cloud.google.com/wiz',
      'https://www.paloaltonetworks.com/resources/guides/cloud-native-application-protection-platform-design-guide',
      'https://docs-cortex.paloaltonetworks.com/r/Cortex-CLOUD/Cortex-Cloud-Runtime-Security-Documentation/What-is-Cortex-Cloud-Runtime-Security',
      'https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction?s=09',
      'https://learn.microsoft.com/en-ie/azure/defender-for-cloud/permissions-management',
      'https://www.crowdstrike.com/en-us/platform/cloud-security/cnapp/',
      'https://investor.fortinet.com/news-releases/news-release-details/fortinet-completes-acquisition-lacework',
      'https://orca.security/resources/blog/cwpp-cspm-ciem-cnapp/',
      'https://aws.amazon.com/security-hub/pricing',
      'https://aws.amazon.com/inspector/pricing/',
      'https://cloud.google.com/security/products/security-command-center',
    ],
    regulatoryChips: ['SOC-2-review', 'CIS-benchmark-review', 'NIST-review', 'PCI-if-cardholder-environment', 'HIPAA-if-PHI'],
    relatedPatternIds: ['PAT-SRC-CAT-EDR-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-SIEM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'security_identity',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Wiz, Palo Alto Prisma/Cortex Cloud, Microsoft Defender for Cloud, CrowdStrike Falcon Cloud Security, Lacework FortiCNAPP, Orca, and Check Point CloudGuard',
        tier: 'enterprise',
        positioning: 'CNAPP and cloud posture candidates spanning CSPM, CWPP, CIEM, code/IaC, Kubernetes, serverless, vulnerability, compliance, DSPM adjacency, and cloud detection.',
        cautions: ['Validate runtime depth, agentless limits, remediation workflow, cloud neutrality, and native-cloud overlap before consolidation claims are accepted.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Defender for Cloud overview', url: 'https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction?s=09', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'CrowdStrike Falcon Cloud Security CNAPP', url: 'https://www.crowdstrike.com/en-us/platform/cloud-security/cnapp/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google completes Wiz acquisition', url: 'https://abc.xyz/investor/news/news-details/2026/Google-Completes-Acquisition-of-Wiz-2026-ta7OaU2uA0/default.aspx', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'AWS Security Hub, Amazon Inspector, Google Security Command Center, and native-cloud services',
        tier: 'enterprise',
        positioning: 'Native cloud posture, vulnerability, and security-command-center options for buyers concentrated in one cloud or comparing native baselines against third-party CNAPP.',
        cautions: ['Native tools may be strong baselines but can fragment ownership and normalization in multicloud estates.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'CNAPP/CSPM public pricing constructs only',
        model: 'hybrid',
        metric: 'Cloud accounts, billable resources, workloads, containers, serverless resources, images, identities, modules, runtime agents, support, and marketplace terms',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Defender for Cloud pricing', url: 'https://azure.microsoft.com/en-us/pricing/details/defender-for-cloud/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'AWS Security Hub pricing', url: 'https://aws.amazon.com/security-hub/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Amazon Inspector pricing', url: 'https://aws.amazon.com/inspector/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Cloud inventory, runtime needs, resource counts, containers, identities, image scans, modules, and negotiated terms require buyer evidence' },
        ],
        confidence: 0.59,
        notes: 'Pricing differs by cloud resource, workload, module, package, and marketplace channel; do not infer third-party CNAPP pricing without a quote.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Cloud risk data and remediation ownership',
        buyerPosition: 'Require asset inventory export, finding export, risk graph/evidence export, ownership mapping, ticket workflow, remediation evidence, and transition assistance.',
      },
      {
        clauseArea: 'Runtime and agentless boundary',
        buyerPosition: 'Define which risks are discovered agentlessly, which require agents, which need cloud-native services, and which actions the platform can actually enforce.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Native-cloud challenger',
        whenToUse: 'Use when the estate is concentrated in AWS, Azure, or Google Cloud or existing native services are already enabled.',
        buyerAsk: 'Compare third-party CNAPP value against native posture, vulnerability, identity, compliance, and workflow coverage with the same cloud inventory.',
      },
      {
        lever: 'Exploitable-path proof',
        whenToUse: 'Use when a vendor claims risk prioritization or attack-path superiority.',
        buyerAsk: 'Demonstrate public exposure, sensitive data, vulnerability, identity path, workload context, owner routing, and remediation evidence on buyer assets.',
      },
    ],
    riskFactors: [
      {
        id: 'csp-noisy-findings-loop',
        label: 'Noisy cloud findings loop',
        severity: 'high',
        detectionSignals: ['Cloud findings are duplicated, context-poor, unactionable, or not routed to accountable owners.'],
        mitigations: ['Require owner mapping, risk prioritization, ticket workflow, suppression policy, and remediation evidence'],
      },
      {
        id: 'csp-agentless-runtime-confusion',
        label: 'Agentless and runtime confusion',
        severity: 'high',
        detectionSignals: ['Buyer assumes agentless posture scanning provides complete runtime workload protection.'],
        mitigations: ['Separate CSPM, CWPP, CDR, CIEM, vulnerability, code, and runtime controls in the proof event'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress multicloud exposure paths, privileged cloud identities, compliance evidence, outsourcing review, and operational resilience.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI-adjacent workloads, sensitive-data exposure, access paths, BAA posture, audit evidence, and remediation ownership.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review government cloud eligibility, sensitive workload boundaries, FedRAMP/public procurement, and evidence export requirements.',
      },
    ],
    body: `## Summary
Cloud Security Posture and CNAPP sourcing is the buyer's attempt to make cloud risk visible, prioritized, and remediable. The category spans posture, workload, identity, code, runtime, Kubernetes, containers, serverless, vulnerability, compliance, and cloud detection. The event should answer whether the tool helps the buyer identify exploitable cloud risk and route it to owners, not whether it can produce the longest list of findings.

## When to apply
Use this pattern when sourcing Wiz, Palo Alto Prisma Cloud or Cortex Cloud, Microsoft Defender for Cloud, CrowdStrike Falcon Cloud Security, Lacework FortiCNAPP, Orca, Check Point CloudGuard, AWS Security Hub, Amazon Inspector, Google Security Command Center, or adjacent CSPM, CWPP, CIEM, CDR, and CNAPP capabilities. Apply it during rapid cloud expansion, multicloud normalization, Kubernetes/serverless growth, cloud IAM least-privilege programs, audit pressure, cloud breach findings, or tool consolidation. Do not use it for endpoint-only EDR, pure SIEM/SOAR, generic GRC, or cloud consulting unless cloud posture and workload risk are central.

## Category boundary
In scope: asset inventory, posture checks, misconfiguration, vulnerability scanning, container/image scanning, Kubernetes posture, serverless posture, cloud workload protection, cloud identity entitlement management, attack paths, secrets, data exposure, IaC/code-to-cloud context, compliance frameworks, runtime detection, remediation workflow, ticketing, SIEM/XDR export, and evidence. Adjacent but distinct: EDR, SIEM, IAM, PAM, data security posture, and DevSecOps tools.

## Lifecycle and gates
The scope gate should inventory cloud accounts, subscriptions, projects, Kubernetes clusters, containers, serverless resources, VMs, storage, databases, identities, CI/CD paths, compliance frameworks, and current native tools. The RFP gate should require deployment model, cloud coverage, agentless versus agent coverage, runtime depth, identity analysis, vulnerability sources, evidence exports, pricing meters, and workflow integrations. The proof gate should test representative cloud accounts, a public exposure, sensitive-data path, vulnerable workload, overprivileged identity, Kubernetes finding, code-to-cloud link, ticket routing, and remediation evidence. The BAFO gate should normalize billable resources, modules, cloud marketplaces, runtime agents, image scans, identity counts, support, services, and native-tool displacement.

## Evaluation rubric
Weight risk prioritization around 25 percent, cloud/workload coverage around 20 percent, identity and exposure context around 15 percent, remediation workflow around 15 percent, native-cloud integration around 10 percent, compliance/evidence around 10 percent, and commercial predictability around 5 percent. Increase evidence weight for regulated workloads and increase workflow weight when developers own remediation.

## Pricing and contract notes
Public sources from Microsoft, AWS, Amazon Inspector, Google, Wiz/Google, Palo Alto, CrowdStrike, Fortinet/Lacework, Orca, and Check Point show that CNAPP pricing can depend on resource counts, workload classes, cloud accounts, image scans, serverless resources, identities, modules, runtime agents, and marketplace terms. Public acquisition or roadmap statements should not be converted into assumptions about future packaging. Google completed its Wiz acquisition in 2026 and publicly described a cloud-environment commitment, but buyers should validate contract terms directly.

Contracting should define asset and finding export, retention, evidence, remediation workflow, API access, data residency, cloud permissions, agent behavior, transition assistance, support, implementation milestones, and acceptance tests. If the buyer is replacing native tools, require an explicit native-versus-third-party control map.

## Contradictions and failure modes
Vendor claim: CNAPP consolidates cloud security. Detection: map CSPM, CWPP, CIEM, code, runtime, DSPM, compliance, and detection scope by cloud and workload. Vendor claim: agentless coverage is complete. Detection: test runtime, process, memory, network, Kubernetes, and response requirements. Vendor claim: risks are prioritized. Detection: inspect whether exposure, identity, vulnerability, data sensitivity, and business context converge on buyer assets.

The common failure is buying a better findings list without owner routing or remediation evidence. The second is assuming a single cloud-native tool is enough for multicloud governance. The third is accepting agentless posture visibility as runtime workload protection.`,
  },
  {
    id: 'PAT-SRC-CAT-FINOPS-001',
    slug: 'finops-cloud-cost-management-sourcing',
    title: 'FinOps and Cloud Cost Management Platform Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'FinOps tooling should be sourced around accountable cost allocation, forecasting, optimization workflow, commitment governance, and business unit economics rather than generic savings promises.',
    applicability:
      'Apply when sourcing IBM Cloudability, Tanzu CloudHealth, Flexera One Cloud Cost Optimization, CloudZero, Finout, Harness Cloud Cost Management, ProsperOps, Spot/Flexera, AWS Cost Explorer, Azure Cost Management, Google Cloud FinOps Hub, and adjacent cloud cost automation.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.finops.org/framework/',
      'https://www.finops.org/framework/capabilities/manage-shared-cloud-cost/',
      'https://www.finops.org/framework/capabilities/workload-optimization/',
      'https://www.finops.org/framework/capabilities/rate-optimization/',
      'https://focus.finops.org/what-is-focus/',
      'https://www.apptio.com/products/cloudability/',
      'https://www.vmware.com/docs/solution-overview-vmware-tanzu-cloudhealth-simplify-cloud-financial-management',
      'https://www.flexera.com/products/flexera-one/cloud-cost-optimization',
      'https://www.flexera.com/about-us/press-center/flexera-completes-acquisition-of-netapps-spot-finops-portfolio',
      'https://www.flexera.com/about-us/press-center/flexera-expands-its-finops-solution-with-agentic-and-ai-enabled-cost-optimization',
      'https://www.cloudzero.com/',
      'https://www.finout.io/finops',
      'https://www.harness.io/products/cloud-cost-management',
      'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html',
      'https://docs.cloud.google.com/billing/docs/how-to/finops-hub',
    ],
    regulatoryChips: ['financial-governance', 'cloud-commitment-review', 'data-residency-if-billing-data-sensitive', 'SOX-if-chargeback-controls'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-CSP-001', 'PAT-SRC-CAT-OBS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'infrastructure',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'IBM Cloudability, Tanzu CloudHealth, Flexera One, CloudZero, Finout, Harness CCM, ProsperOps, and Spot/Flexera',
        tier: 'enterprise',
        positioning: 'FinOps and cloud cost management candidates for allocation, showback, forecasting, anomaly detection, optimization, Kubernetes cost, commitment automation, and unit economics.',
        cautions: ['Tooling does not replace tagging discipline, ownership, procurement governance, architectural change, or engineering action.'],
        sourceBasis: [
          { type: 'industry-consortium', label: 'FinOps Framework', url: 'https://www.finops.org/framework/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'IBM Cloudability', url: 'https://www.apptio.com/products/cloudability/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Flexera One Cloud Cost Optimization', url: 'https://www.flexera.com/products/flexera-one/cloud-cost-optimization', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'AWS Cost Explorer, AWS Compute Optimizer, Azure Cost Management, and Google Cloud FinOps Hub',
        tier: 'enterprise',
        positioning: 'Native cloud baselines for cost visibility, forecasting, recommendations, commitment insights, and optimization opportunities within each provider ecosystem.',
        cautions: ['Native tools may be sufficient for simpler/single-cloud needs but can be harder to normalize across multicloud, Kubernetes, SaaS/data-cloud, and unit-economic views.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'FinOps public pricing constructs only',
        model: 'hybrid',
        metric: 'Cloud spend under management, accounts, providers, Kubernetes clusters, data sources, users, automation modules, commitment portfolio, support, and implementation services',
        sourceBasis: [
          { type: 'industry-consortium', label: 'FOCUS cost and usage data specification', url: 'https://focus.finops.org/what-is-focus/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Cloud spend, tagging maturity, commitment inventory, Kubernetes usage, data-cloud scope, automation appetite, and negotiated terms require buyer evidence' },
        ],
        confidence: 0.50,
        notes: 'Do not repeat vendor savings claims as buyer outcomes; normalize tool cost against governance maturity and actionable optimization volume.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Cost data ownership and portability',
        buyerPosition: 'Require export of normalized cost data, allocation rules, business mappings, budgets, forecasts, recommendations, anomaly history, and commitment portfolio evidence.',
      },
      {
        clauseArea: 'Automation and commitment guardrails',
        buyerPosition: 'Define approval thresholds, rollback, forecast inputs, overcommitment controls, spot/interruptible workload eligibility, and responsibility for automated actions.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Native-tool baseline challenger',
        whenToUse: 'Use when a buyer has single-cloud or basic visibility needs.',
        buyerAsk: 'Prove incremental value beyond AWS, Azure, or Google native cost tools for allocation, ownership, workflow, Kubernetes, commitment management, and unit economics.',
      },
      {
        lever: 'Optimization-to-action proof',
        whenToUse: 'Use when a tool demonstrates savings recommendations but not operational follow-through.',
        buyerAsk: 'Route buyer-specific recommendations to owners, estimate risk, create tickets, record disposition, and show governance evidence.',
      },
    ],
    riskFactors: [
      {
        id: 'finops-dashboard-without-ownership',
        label: 'Dashboard without ownership',
        severity: 'high',
        detectionSignals: ['Tool shows spend and savings recommendations, but teams do not trust allocation or own remediation.'],
        mitigations: ['Require business mappings, showback workflow, owner routing, recommendation disposition, and governance cadence'],
      },
      {
        id: 'finops-overcommitment-risk',
        label: 'Commitment overreach',
        severity: 'high',
        detectionSignals: ['Automation buys commitments or shifts workloads without workload stability, forecast, or rollback governance.'],
        mitigations: ['Set approval thresholds, utilization bands, scenario forecasts, and owner accountability for commitments'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress chargeback controls, budget evidence, commitment governance, cloud risk alignment, and auditability of allocation rules.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Plan for seasonal traffic, promotional spikes, unit economics by brand/channel, and cautious commitment strategy.',
      },
      {
        industry: 'public_sector',
        modifier: 'Review budget authority, procurement rules, chargeback limits, cloud marketplace constraints, and transparent allocation evidence.',
      },
    ],
    body: `## Summary
FinOps sourcing is the discipline of making variable technology spend understandable, accountable, forecastable, and actionable. The tool decision should not be framed as buying savings. It should be framed as creating trusted cost data, ownership, optimization workflow, commitment governance, and unit economics that engineering, finance, product, procurement, and executives can actually use.

## When to apply
Use this pattern when sourcing IBM Cloudability, Tanzu CloudHealth, Flexera One Cloud Cost Optimization, CloudZero, Finout, Harness Cloud Cost Management, ProsperOps, Spot/Flexera, AWS Cost Explorer, AWS Compute Optimizer, Azure Cost Management, Google Cloud FinOps Hub, or adjacent cloud cost automation. Apply it during cloud bill growth, budget misses, multi-cloud expansion, Kubernetes spend growth, AI/data-cloud spend volatility, weak tagging, showback/chargeback programs, commitment complexity, or CFO scrutiny. Do not use it for generic ITFM/TBM, observability-only APM, procurement-only services, or cloud migration consulting unless cloud-cost accountability is the sourcing anchor.

## Category boundary
In scope: cost ingestion, normalized billing data, FOCUS-style data, allocation, tags/labels/accounts, shared-cost rules, budgets, forecasts, anomaly detection, showback, chargeback, rightsizing, idle cleanup, scheduling, storage tiering, Kubernetes cost, unit economics, commitment management, Savings Plans/RIs/CUDs, spot/interruptible guidance, ticket workflow, automation, and governance cadence. Adjacent but distinct: ITAM, ITFM, observability, procurement, cloud architecture, SaaS management, and data-cloud cost management.

## Lifecycle and gates
The scope gate should inventory providers, accounts, tags, cost centers, products, Kubernetes clusters, data-cloud platforms, commitment inventory, budget process, existing native tools, owner model, and optimization backlog. The RFP gate should require allocation rules, data freshness, supported providers, FOCUS support, anomaly workflow, commitment analytics, Kubernetes coverage, automation controls, export, and support. The proof gate should ingest buyer cost data, map ownership, allocate shared spend, detect anomalies, produce forecasts, generate recommendations, route tickets, and export evidence. The BAFO gate should normalize spend under management, users, providers, data sources, automation modules, commitment portfolio, implementation, and internal process effort.

## Evaluation rubric
Weight allocation trust around 25 percent, actionable optimization workflow around 20 percent, forecasting and anomaly management around 15 percent, commitment/rate optimization around 15 percent, unit economics around 10 percent, integrations/export around 10 percent, and commercial predictability around 5 percent. Increase commitment weight when cloud contracts are material and increase unit economics weight for product-led or consumption-heavy businesses.

## Pricing and contract notes
Public sources from the FinOps Foundation, FOCUS, IBM Cloudability, VMware/Tanzu CloudHealth, Flexera, CloudZero, Finout, Harness, AWS, Azure, and Google show the functional map: allocation, optimization, rate management, FOCUS data, native tools, and workflow. They do not prove guaranteed savings. Flexera completed the Spot FinOps portfolio acquisition in 2025 and acquired ProsperOps/Chaos Genius in 2026, so current vendor ownership should be validated during sourcing. Tool cost must be compared against tagging maturity, spend scale, commitment risk, Kubernetes complexity, and the buyer's ability to act.

Contracting should define data export, allocation-rule ownership, recommendation history, automation approvals, commitment guardrails, anomaly routing, implementation support, success criteria, and transition assistance. If automation is enabled, require explicit approval thresholds, rollback, and responsibility for overcommitment or workload disruption.

## Contradictions and failure modes
Vendor claim: guaranteed savings. Detection: require buyer baseline, owner workflow, engineering action, and attribution method. Vendor claim: native tools are insufficient. Detection: compare against AWS, Azure, or Google native capability for the buyer's actual complexity. Vendor claim: automation is safe. Detection: test forecast stability, approval, rollback, and workload eligibility.

The common failure is buying dashboards without cost ownership. The second is trusting savings recommendations that teams cannot safely implement. The third is overcommitting to discounts while workloads, architecture, or demand are changing.`,
  },
  {
    id: 'PAT-SRC-CAT-OBS-001',
    slug: 'observability-apm-log-management-sourcing',
    title: 'Observability, APM, Logs, Metrics, and Tracing Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Observability sourcing should normalize telemetry value, retention, cardinality, workflow, and incident accountability instead of comparing dashboards or accepting unlimited-ingest assumptions.',
    applicability:
      'Apply when sourcing Datadog, New Relic, Dynatrace, Splunk Observability Cloud, Grafana Cloud, Elastic Observability, Honeycomb, Sumo Logic, OpenTelemetry programs, or native cloud observability services.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.datadoghq.com/pricing/',
      'https://docs.datadoghq.com/logs/log_configuration/indexes/',
      'https://newrelic.com/pricing',
      'https://docs.newrelic.com/docs/accounts/accounts-billing/new-relic-one-pricing-users/pricing-billing/',
      'https://www.dynatrace.com/pricing/',
      'https://docs.dynatrace.com/docs/ingest-from/opentelemetry/opentelemetry-licensing',
      'https://grafana.com/pricing/',
      'https://grafana.com/docs/grafana-cloud/cost-management-and-billing/manage-invoices/understand-your-invoice/application-observability-invoice/',
      'https://www.elastic.co/pricing/serverless-observability/',
      'https://cloud.google.com/products/observability/pricing',
      'https://opentelemetry.io/docs/what-is-opentelemetry/',
    ],
    regulatoryChips: ['SOC-2-review', 'production-logging-privacy-review', 'GDPR-if-person-data', 'HIPAA-if-PHI', 'PCI-if-cardholder-environment'],
    relatedPatternIds: ['PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-EDR-001', 'PAT-SRC-CAT-CSP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'infrastructure',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Datadog, New Relic, Dynatrace, Splunk Observability Cloud, Grafana Cloud, Elastic Observability, Honeycomb, and Sumo Logic',
        tier: 'enterprise',
        positioning: 'Observability candidates for infrastructure monitoring, APM, logs, metrics, traces, profiling, synthetics, RUM, event correlation, incident workflow, and telemetry governance.',
        cautions: ['Normalize telemetry meters, retention, cardinality, sampling, user access, and incident workflow before comparing platform breadth.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Datadog pricing page', url: 'https://www.datadoghq.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'New Relic pricing page', url: 'https://newrelic.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Dynatrace pricing page', url: 'https://www.dynatrace.com/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'OpenTelemetry and native cloud observability services',
        tier: 'specialist',
        positioning: 'Instrumentation and provider-native baselines that can reduce lock-in risk or establish telemetry standards before a commercial platform decision.',
        cautions: ['OpenTelemetry standardizes collection and signals, but buyers still need backend storage, query, retention, alerting, governance, and operating ownership.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Observability public pricing constructs only',
        model: 'usage-based',
        metric: 'Hosts, containers, pods, data ingest, indexed logs, retained events, traces/spans, metrics/cardinality, synthetics, RUM sessions, users, support, and annual commit',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Datadog pricing page', url: 'https://www.datadoghq.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'New Relic pricing page', url: 'https://newrelic.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Grafana Cloud pricing page', url: 'https://grafana.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Telemetry volume, retention, cardinality, service count, deployment topology, user access, and negotiated commit require buyer evidence' },
        ],
        confidence: 0.62,
        notes: 'Public pages expose meters and some rates, but enterprise cost depends on instrumentation choices, sampling, retention, support, commit, and data-routing controls.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Telemetry ownership and portability',
        buyerPosition: 'Require export for logs, metrics, traces, dashboards, monitors, notebooks, incident data, retention history, and configuration where technically available.',
      },
      {
        clauseArea: 'Cost governance and ingestion controls',
        buyerPosition: 'Define ingestion limits, overage notification, sampling controls, high-cardinality guardrails, retention tiers, archive access, and approval for new billable telemetry sources.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Telemetry bill-of-materials',
        whenToUse: 'Use before BAFO or renewal when hosts, containers, traces, logs, metrics, RUM, synthetics, and users are mixed across teams.',
        buyerAsk: 'Build a current and forecast telemetry BOM with retention, sampling, indexing, cardinality, and ownership by service/team.',
      },
      {
        lever: 'OpenTelemetry portability proof',
        whenToUse: 'Use when the buyer wants vendor optionality or has multi-backend observability architecture.',
        buyerAsk: 'Demonstrate instrumentation reuse, collector routing, schema handling, and migration/export limits without breaking alert and incident workflows.',
      },
    ],
    riskFactors: [
      {
        id: 'observability-telemetry-cost-runaway',
        label: 'Telemetry cost runaway',
        severity: 'high',
        detectionSignals: ['Default log ingestion, high-cardinality metrics, unsampled traces, RUM sessions, synthetics, or container churn are not forecast before rollout.'],
        mitigations: ['Require ingestion controls, sampling policy, retention tiers, budget alerts, and telemetry owner review'],
      },
      {
        id: 'observability-dashboard-without-action',
        label: 'Dashboard without incident accountability',
        severity: 'medium',
        detectionSignals: ['Platform demos focus on dashboards but not alert quality, ownership routing, runbooks, on-call handoff, or post-incident evidence.'],
        mitigations: ['Run a proof around real incidents, SLOs, owners, escalation, and postmortem evidence'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress auditability, sensitive log masking, retention policy, incident evidence, segregation of duties, and production access controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review PHI-adjacent logs, clinical uptime, emergency workflows, support escalation, and telemetry minimization.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Plan for seasonal traffic, checkout observability, RUM sampling, synthetic checks, and telemetry cost spikes during promotions.',
      },
    ],
    body: `## Summary
Observability sourcing is a telemetry economics and operating-model decision, not a dashboard beauty contest. The buyer is choosing how logs, metrics, traces, events, profiles, synthetics, RUM, alerts, SLOs, and incident workflows become reliable production knowledge. The hard part is not collecting everything. The hard part is collecting the right evidence, retaining it at the right tier, routing it to accountable owners, and keeping the bill predictable as systems scale.

## When to apply
Use this pattern when sourcing Datadog, New Relic, Dynatrace, Splunk Observability Cloud, Grafana Cloud, Elastic Observability, Honeycomb, Sumo Logic, OpenTelemetry collector programs, or AWS/Azure/Google native observability services. Apply it during APM renewal, log-cost escalation, SRE program buildout, incident-review gaps, cloud migration, Kubernetes/container growth, OpenTelemetry standardization, digital-experience monitoring, RUM or synthetic monitoring expansion, or vendor consolidation. Do not use it for pure SIEM, pure FinOps, pure ITSM incident management, or endpoint/security monitoring unless production telemetry is the sourcing anchor.

## Category boundary
In scope: infrastructure monitoring, APM, distributed tracing, logs, metrics, events, profiles, synthetics, RUM, service maps, dashboards, alerting, SLOs, incident workflow, telemetry pipelines, OpenTelemetry, retention, archive, ingest controls, cardinality, sampling, data export, access controls, and on-call collaboration. Adjacent but distinct: SIEM, CNAPP, EDR, ITSM, FinOps, feature flags, test observability, and data observability.

## Lifecycle and gates
The scope gate should inventory monitored hosts, containers, pods, services, log sources, trace volume, metric cardinality, RUM sessions, synthetics, retention needs, incident processes, SLOs, current alert noise, cloud-native tools, and engineering ownership. The RFP gate should require supported telemetry types, OpenTelemetry support, ingestion controls, retention tiers, archive/export, alert routing, role-based access, privacy controls, API limits, and pricing meters. The proof gate should instrument representative services, replay a real incident, test query latency, validate sampling, export data, tune alerts, and measure billable telemetry. The BAFO gate should normalize hosts, containers, data ingest, indexed logs, spans, metric series, RUM, synthetics, users, support, commit, and professional services.

## Evaluation rubric
Weight incident usefulness around 25 percent, telemetry governance around 20 percent, cost predictability around 20 percent, instrumentation and OpenTelemetry fit around 15 percent, workflow integrations around 10 percent, and platform breadth around 10 percent. Increase governance weight when log volume is high, regulated data may enter telemetry, or Kubernetes/autoscaling drives unpredictable cardinality.

## Pricing and contract notes
Public pricing and documentation from Datadog, New Relic, Dynatrace, Grafana, Elastic, Google Cloud, and OpenTelemetry show that observability cost can be driven by hosts, pods, telemetry ingest, logs, indexed events, traces, metrics, sessions, synthetics, users, support, and annual commits. These pages should not be converted into a buyer quote without buyer telemetry data. The safest sourcing model is a telemetry bill-of-materials with current usage, forecast growth, retention policy, sampling policy, and owner routing.

Contracting should define telemetry ownership, export, retention, archive, deletion, privacy controls, data residency, overage notification, high-cardinality guardrails, support response, implementation responsibilities, and transition assistance. If the vendor offers AI/assistant incident features, keep claims tied to documented function and proof results, not promised MTTR outcomes.

## Contradictions and failure modes
Vendor claim: collect everything. Detection: model ingestion, retention, indexing, cardinality, and archive cost before rollout. Vendor claim: OpenTelemetry means portability. Detection: test dashboard, alert, query, schema, and incident workflow migration, not only instrumentation. Vendor claim: platform consolidation lowers cost. Detection: compare the normalized telemetry BOM against native and point-tool alternatives.

The common failure is default-on telemetry that creates a surprising bill before teams agree on value. The second is dashboards without reliable on-call ownership. The third is choosing a backend before deciding what telemetry should be sampled, indexed, retained hot, archived, or dropped.`,
  },
  {
    id: 'PAT-SRC-CAT-ITAM-001',
    slug: 'it-asset-management-cmdb-discovery-sourcing',
    title: 'IT Asset Management, Discovery, Inventory, and CMDB Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'ITAM sourcing should prove trusted asset identity, lifecycle ownership, discovery coverage, normalization, and workflow integration before buyers treat an inventory tool as a CMDB or risk system of record.',
    applicability:
      'Apply when sourcing ServiceNow Hardware Asset Management, ServiceNow CMDB/Discovery adjacency, Flexera One IT Asset Management or IT Visibility, Lansweeper, Device42, Ivanti, BMC Helix Discovery/CMDB, Tanium adjacency, or asset discovery/inventory programs.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.servicenow.com/products/hardware-asset-management.html',
      'https://blogs.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/resource-center/data-sheet/ds-hardware-asset-management.pdf',
      'https://www.flexera.com/solutions/it-inventory/it-asset-discovery',
      'https://docs.flexera.com/flexera/EN/ITAssets/Discovery_And_Inventory_Parent_Landing.htm',
      'https://www.flexera.com/solutions/it-inventory',
      'https://www.lansweeper.com/plans-pricing/',
      'https://docs.lansweeper.com/classic/docs/lansweeper-discovery',
      'https://www.device42.com/features/it-asset-management/',
      'https://docs.device42.com/getstarted/getting-started-with-auto-discovery/',
    ],
    regulatoryChips: ['SOC-2-review', 'asset-disposal-review', 'data-residency-if-inventory-sensitive', 'SOX-if-asset-controls', 'HIPAA-if-clinical-assets'],
    relatedPatternIds: ['PAT-SRC-CAT-SAM-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-EDR-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'ServiceNow, Flexera, Lansweeper, Device42, Ivanti, BMC Helix, and Tanium-adjacent inventory',
        tier: 'enterprise',
        positioning: 'ITAM and discovery candidates for hardware lifecycle, asset inventory, CMDB enrichment, normalized technology data, device/application discovery, ownership, and workflow integration.',
        cautions: ['Separate asset management, configuration management, discovery, service mapping, software licensing, and endpoint operations instead of treating all inventory as the same record.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow Hardware Asset Management', url: 'https://www.servicenow.com/products/hardware-asset-management.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Flexera IT asset discovery', url: 'https://www.flexera.com/solutions/it-inventory/it-asset-discovery', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Lansweeper plans and pricing', url: 'https://www.lansweeper.com/plans-pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'CMDB, ITSM, endpoint management, and security-tool adjacencies',
        tier: 'specialist',
        positioning: 'Adjacent systems that provide asset evidence, CI records, owner workflows, endpoint posture, vulnerability context, or lifecycle automation.',
        cautions: ['A CMDB implementation requires governance and data quality controls; a scanner alone does not create trusted configuration management.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'ITAM/discovery public pricing constructs only',
        model: 'hybrid',
        metric: 'Assets, devices, users, installations, discovery methods, connectors, CMDB/ITSM modules, support, implementation, and data normalization scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Lansweeper plans and pricing', url: 'https://www.lansweeper.com/plans-pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Asset counts, discovery coverage, CMDB scope, connector count, normalization needs, support tier, and implementation effort require buyer evidence' },
        ],
        confidence: 0.54,
        notes: 'Public plans expose asset-count constructs for some tools, but enterprise ITAM economics depend on estate scale, modules, connectors, implementation, governance, and data cleanup.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Asset data ownership and export',
        buyerPosition: 'Require export for asset records, discovery evidence, ownership mappings, normalized models, lifecycle history, reconciliation rules, and CMDB links.',
      },
      {
        clauseArea: 'Discovery boundary and data quality',
        buyerPosition: 'Define in-scope networks, cloud accounts, endpoints, OT/IoT exclusions, credentials, agent/agentless methods, refresh cadence, duplicate handling, and data-quality SLAs.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Golden asset record proof',
        whenToUse: 'Use when multiple systems claim to be the source of truth for devices, users, owners, and lifecycle status.',
        buyerAsk: 'Reconcile sampled assets across procurement, endpoint, identity, CMDB, network, cloud, and finance data sources with exception workflow.',
      },
      {
        lever: 'Discovery coverage proof',
        whenToUse: 'Use before committing to scanner or CMDB scope.',
        buyerAsk: 'Show coverage for remote endpoints, servers, cloud, network, SaaS, contractors, offline assets, and sensitive networks without violating security constraints.',
      },
    ],
    riskFactors: [
      {
        id: 'itam-false-source-of-truth',
        label: 'False source of truth',
        severity: 'high',
        detectionSignals: ['Tool demo shows a rich inventory but does not reconcile duplicates, ownership, lifecycle status, financial records, and CI relationships.'],
        mitigations: ['Require reconciliation tests, source precedence, data steward ownership, and exception queues'],
      },
      {
        id: 'itam-discovery-blind-spots',
        label: 'Discovery blind spots',
        severity: 'high',
        detectionSignals: ['Remote, cloud, mobile, OT, contractor, unmanaged, or segmented assets are not discovered or refreshed reliably.'],
        mitigations: ['Map discovery methods by asset class and require coverage reporting plus compensating controls'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Separate clinical devices, shared workstations, biomedical ownership, PHI-adjacent inventories, and disposal evidence from standard corporate endpoints.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Treat OT, plant-floor systems, scanners, kiosks, and disconnected assets as separate discovery and lifecycle populations.',
      },
      {
        industry: 'financial_services',
        modifier: 'Stress audit evidence, SOX-adjacent asset controls, end-of-life tracking, privileged asset ownership, and disposal chain of custody.',
      },
    ],
    body: `## Summary
ITAM sourcing is about trusted asset identity and lifecycle control. A buyer is not merely buying a scanner. The event must determine which assets exist, who owns them, where they are, how they are discovered, how records are normalized, how lifecycle events are governed, and how the asset view supports security, finance, procurement, service management, and audit evidence.

## When to apply
Use this pattern when sourcing ServiceNow Hardware Asset Management, ServiceNow CMDB/Discovery adjacency, Flexera One IT Asset Management, Flexera IT Visibility, Lansweeper, Device42, Ivanti, BMC Helix Discovery/CMDB, Tanium-adjacent inventory, or enterprise asset discovery programs. Apply it during CMDB cleanup, audit findings, hardware refresh, cyber-insurance review, M&A integration, unmanaged-device risk, software audit preparation, service-management modernization, cloud/endpoint visibility gaps, or asset disposal concerns. Do not use it for pure SAM, pure SaaS management, pure endpoint security, or pure vulnerability management unless hardware/software asset identity is the sourcing anchor.

## Category boundary
In scope: hardware asset lifecycle, inventory, procurement-to-disposal workflow, discovery, agent/agentless collection, CMDB enrichment, CI relationships, ownership, location, warranty/support data, model normalization, duplicate reconciliation, asset retirement, disposal evidence, integrations, and data export. Adjacent but distinct: SAM, SaaS management, CMDB/service mapping, endpoint management, vulnerability management, IAM, procurement suites, and GRC control evidence.

## Lifecycle and gates
The scope gate should inventory asset classes, source systems, CMDB quality, endpoint tools, network segments, cloud accounts, mobile/remote populations, OT/IoT boundaries, procurement feeds, disposal workflow, and data stewards. The RFP gate should require discovery methods, connector coverage, normalization, refresh cadence, duplicate handling, asset/CI linkage, workflow automation, role-based access, export, and implementation assumptions. The proof gate should reconcile sampled assets across procurement, endpoint, identity, network, cloud, CMDB, and finance systems. The BAFO gate should normalize assets, modules, connectors, implementation, data cleanup, managed services, support, and governance effort.

## Evaluation rubric
Weight discovery coverage around 25 percent, reconciliation and normalization around 20 percent, lifecycle workflow around 20 percent, CMDB/ITSM integration around 15 percent, reporting/export around 10 percent, and commercial predictability around 10 percent. Increase reconciliation weight when the buyer has many overlapping tools or a low-trust CMDB.

## Pricing and contract notes
Public sources from ServiceNow, Flexera, Lansweeper, and Device42 show common constructs: hardware lifecycle management, CMDB visibility, discovery/inventory, normalized technology data, asset counts, connectors, and workflow. Public price pages may show asset-count starting points for some vendors, but enterprise price depends on asset population, module scope, connectors, implementation, support, and data remediation. Do not treat an asset-count plan as a full CMDB or ITAM program cost.

Contracting should define asset-data ownership, export, discovery credentials, refresh cadence, duplicate remediation, source precedence, support, implementation deliverables, data cleanup responsibilities, disposal evidence, and transition assistance. If the tool will support security or audit processes, require evidence of data freshness and exception workflow.

## Contradictions and failure modes
Vendor claim: single source of truth. Detection: reconcile sampled assets against procurement, endpoint, identity, network, cloud, and finance data. Vendor claim: agentless discovery is complete. Detection: test remote, offline, segmented, cloud, mobile, OT, and contractor populations. Vendor claim: CMDB value comes out of the box. Detection: inspect ownership, class model, CI relationships, source precedence, and steward process.

The common failure is building a beautiful inventory nobody trusts. The second is confusing discovered devices with governed assets. The third is buying a CMDB or discovery tool without assigning data stewards and exception queues.`,
  },
  {
    id: 'PAT-SRC-CAT-SAM-001',
    slug: 'software-asset-management-license-optimization-sourcing',
    title: 'Software Asset Management, License Optimization, and SaaS Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'SAM sourcing should reconcile entitlement, deployment, usage, contract, renewal, SaaS, and audit evidence before buyers rely on savings claims or compliance posture.',
    applicability:
      'Apply when sourcing Flexera/Snow, ServiceNow Software Asset Management, USU, Zylo, Productiv, Torii, BetterCloud, SaaS management platforms, license optimization programs, or complex publisher compliance support.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.flexera.com/blog/it-asset-management/flexera-completes-acquisition-of-snow-software/',
      'https://www.flexera.com/solutions/software-usage-costs/software-asset-management',
      'https://docs.flexera.com/snow-license-manager-ui/concepts-terminology-and-features/software-asset-management',
      'https://www.servicenow.com/PRODUCTS/software-asset-management.html',
      'https://www.servicenow.com/standard/resource-center/data-sheet/ds-sam-publisher-packs.html',
      'https://www.servicenow.com/docs/r/yokohama/it-asset-management/software-asset-management/sam-publisher-packs.html',
      'https://www.usu.com/en/it-asset-management/software-asset-management',
      'https://www.usu.com/en-us/solutions/usu-software-asset-management/saas-optimization/',
      'https://zylo.com/pricing/',
      'https://productiv.com/saas-management-tools/',
    ],
    regulatoryChips: ['vendor-audit-readiness', 'SOX-if-software-controls', 'data-processing-review', 'GDPR-if-user-usage-data', 'FedRAMP-if-public-sector-SaaS'],
    relatedPatternIds: ['PAT-SRC-CAT-ITAM-001', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Flexera/Snow, ServiceNow SAM, USU, Zylo, Productiv, Torii, BetterCloud, and SaaS management tools',
        tier: 'enterprise',
        positioning: 'SAM and SaaS management candidates for discovery, entitlement reconciliation, license optimization, publisher packs, renewal workflow, SaaS visibility, usage analytics, and compliance evidence.',
        cautions: ['Do not accept savings or compliance posture without entitlement quality, discovery coverage, usage evidence, contract terms, and publisher-specific license logic.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Flexera completes Snow Software acquisition', url: 'https://www.flexera.com/blog/it-asset-management/flexera-completes-acquisition-of-snow-software/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow SAM publisher packs', url: 'https://www.servicenow.com/standard/resource-center/data-sheet/ds-sam-publisher-packs.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Zylo pricing page', url: 'https://zylo.com/pricing/', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Publisher-specific license specialists and managed SAM services',
        tier: 'specialist',
        positioning: 'Useful for complex Microsoft, Oracle, SAP, IBM, Adobe, VMware, SaaS, BYOL, or audit-defense programs where tool output requires expert interpretation.',
        cautions: ['Separate tool license, implementation, managed service, publisher expertise, and audit-defense scope.'],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'SAM/SaaS management public pricing constructs only',
        model: 'hybrid',
        metric: 'Managed software publishers, devices/users, SaaS applications, integrations, entitlement records, usage connectors, publisher packs, managed services, and implementation scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Zylo pricing page', url: 'https://zylo.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Entitlements, publisher scope, SaaS app count, renewal calendar, audit exposure, connector count, and managed-service needs require buyer evidence' },
        ],
        confidence: 0.52,
        notes: 'Public pages often require custom quote for enterprise SAM/SaaS management; avoid cost-savings claims unless tied to buyer data and agreed methodology.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Entitlement and usage evidence ownership',
        buyerPosition: 'Require export of entitlements, deployment, usage, allocation, optimization recommendations, renewal history, publisher calculations, and audit evidence.',
      },
      {
        clauseArea: 'Publisher logic and audit support',
        buyerPosition: 'Define supported publishers, license metrics, content/library updates, audit-defense boundaries, calculation assumptions, and responsibility for contract interpretation.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Entitlement-quality proof',
        whenToUse: 'Use before accepting savings, compliance, or audit-readiness claims.',
        buyerAsk: 'Load representative contracts, entitlements, deployments, usage data, and renewals, then reconcile exceptions with documented assumptions.',
      },
      {
        lever: 'Renewal calendar leverage',
        whenToUse: 'Use when material SaaS or publisher renewals are inside the next 12 months.',
        buyerAsk: 'Prioritize integrations and optimization evidence for the renewal calendar, not generic application inventory.',
      },
    ],
    riskFactors: [
      {
        id: 'sam-savings-without-entitlements',
        label: 'Savings claim without entitlement evidence',
        severity: 'high',
        detectionSignals: ['Vendor estimates reclaim or compliance value before contracts, usage, allocation, and publisher metrics are loaded.'],
        mitigations: ['Require buyer data proof, documented assumptions, and finance/procurement signoff on savings methodology'],
      },
      {
        id: 'sam-audit-false-confidence',
        label: 'Audit false confidence',
        severity: 'critical',
        detectionSignals: ['Tool claims compliance, but publisher-specific terms, virtualization, indirect access, BYOL, or cloud migration rights are unresolved.'],
        mitigations: ['Validate complex publishers with specialist review and retain underlying calculation evidence'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress audit defense, entitlement evidence, renewal controls, user-access governance, SaaS risk, and SOX-adjacent software spend controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review clinical software ownership, PHI-adjacent usage data, shared-device licensing, and high-risk vendor renewal dependencies.',
      },
      {
        industry: 'public_sector',
        modifier: 'Consider procurement rules, named agreements, license transfer limits, audit evidence, and public-sector cloud/SaaS terms.',
      },
    ],
    body: `## Summary
SAM sourcing is not a generic software inventory exercise. It is the discipline of reconciling what the buyer owns, what is deployed, what is used, what contracts allow, what renewals are coming, and what audit exposure exists. The tool decision must connect entitlements, discovery, usage, SaaS integrations, publisher logic, contract records, renewal workflow, and finance/procurement action.

## When to apply
Use this pattern when sourcing Flexera/Snow, ServiceNow Software Asset Management, USU, Zylo, Productiv, Torii, BetterCloud, SaaS management platforms, license optimization tooling, publisher-pack programs, or managed SAM services. Apply it during software audit pressure, renewal savings programs, SaaS sprawl, Microsoft/Oracle/SAP/IBM/Adobe/VMware complexity, M&A, cloud migration/BYOL review, shadow IT discovery, access cleanup, or procurement centralization. Do not use it for pure hardware ITAM, pure FinOps, pure IAM, or procurement-only contract lifecycle management unless software entitlement and usage reconciliation is central.

## Category boundary
In scope: software discovery, normalized software recognition, entitlements, purchase records, contract terms, license metrics, usage evidence, SaaS application discovery, user/license utilization, renewal calendar, reclaim/reharvest workflow, publisher packs, compliance reports, audit evidence, BYOL/cloud rights, allocation, and export. Adjacent but distinct: hardware ITAM, CMDB, IAM, SaaS security posture, FinOps, CLM, procurement suites, and vendor management.

## Lifecycle and gates
The scope gate should inventory publishers, SaaS apps, contracts, entitlement quality, discovery sources, usage connectors, renewal calendar, audit history, cloud/BYOL exposure, and owner model. The RFP gate should require supported publishers, normalization, entitlement ingestion, usage collection, SaaS integrations, publisher packs, compliance calculations, renewal workflow, reclaim automation, export, and managed-service boundaries. The proof gate should load representative entitlements, deployments, usage, contracts, and renewals for high-value publishers. The BAFO gate should normalize managed publishers, users/devices, SaaS apps, connectors, implementation, managed services, content updates, and audit support.

## Evaluation rubric
Weight entitlement reconciliation around 25 percent, publisher-specific license logic around 20 percent, usage and SaaS integration around 20 percent, renewal/reclaim workflow around 15 percent, audit evidence and export around 10 percent, and commercial predictability around 10 percent. Increase publisher-logic weight for Oracle, SAP, IBM, Microsoft, Adobe, VMware, and hybrid-cloud/BYOL portfolios.

## Pricing and contract notes
Public sources from Flexera, Snow documentation, ServiceNow SAM, USU, Zylo, and Productiv show the functional map: software inventory, entitlement management, publisher packs, usage analysis, SaaS visibility, renewal workflow, and optimization suggestions. Flexera completed its Snow Software acquisition before this pattern's as-of date, so Snow-related sourcing should validate current Flexera/Snow packaging and support path. Enterprise pricing is commonly quote-based and depends on publishers, users/devices, SaaS applications, connectors, managed services, implementation, and content/library needs.

Contracting should define data export, entitlement ownership, publisher pack scope, calculation assumptions, content update cadence, managed-service duties, audit-defense boundaries, usage connector responsibilities, privacy treatment for user-level data, and transition assistance. Do not accept generic savings percentages; require buyer-specific entitlement and usage proof.

## Contradictions and failure modes
Vendor claim: savings are immediate. Detection: load buyer contracts, usage, allocation, and renewal dates, then require finance-approved methodology. Vendor claim: compliance position is known. Detection: validate publisher terms, virtualization, indirect access, BYOL/cloud rights, and exceptions. Vendor claim: SaaS management equals SAM. Detection: separate SaaS usage optimization from complex on-prem and hybrid license compliance.

The common failure is buying a SAM tool when the buyer's entitlement data is incomplete. The second is optimizing easy SaaS licenses while ignoring audit-heavy publishers. The third is treating tool output as legal interpretation without preserving assumptions and specialist review for complex terms.`,
  },
  {
    id: 'PAT-SRC-CAT-ESM-001',
    slug: 'enterprise-service-management-itsm-workflow-sourcing',
    title: 'Enterprise Service Management and ITSM-Adjacent Workflow Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise service management sourcing should prove governed intake, routing, ownership, SLAs, knowledge, asset context, and workflow governance before buyers treat a ticketing tool as an enterprise operating layer.',
    applicability:
      'Apply when sourcing ServiceNow ITSM/ESM, Jira Service Management, Freshservice, BMC Helix ITSM, Ivanti Neurons for ITSM, Zendesk Employee Service, Microsoft Power Platform adjacency, or shared-service workflow programs.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.servicenow.com/products/itsm/pricing.html',
      'https://blogs.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/resource-center/solution-brief/sb-itsm.pdf',
      'https://www.atlassian.com/software/jira/templates/advanced-it-service-management',
      'https://www.atlassian.com/collections/service/pricing',
      'https://www.freshworks.com/freshservice/pricing/',
      'https://www.freshworks.com/freshservice/features/',
      'https://www.freshworks.com/freshservice/business-teams/',
      'https://www.helixops.ai/products/bmc-helix-itsm.html',
      'https://www.ivanti.com/solutions/enterprise-service-management',
      'https://www.ivanti.com/products/ivanti-neurons-itsm',
      'https://www.zendesk.com/employee-service/',
      'https://support.zendesk.com/hc/en-us/articles/8836478757914-About-the-Zendesk-Employee-Service-Suite',
      'https://www.microsoft.com/en-us/power-platform/products/power-automate/',
    ],
    regulatoryChips: ['SOC-2-review', 'change-control-review', 'access-request-review', 'SOX-if-approval-controls', 'data-residency-if-employee-data'],
    relatedPatternIds: ['PAT-SRC-CAT-ITAM-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-BPM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'ServiceNow, Atlassian Jira Service Management, Freshservice, BMC Helix, Ivanti Neurons, Zendesk Employee Service, and Microsoft Power Platform adjacency',
        tier: 'enterprise',
        positioning: 'Service-management and shared-service workflow candidates for intake, request, incident, problem, change, knowledge, assets/CMDB, employee service, automation, and reporting.',
        cautions: ['Validate ITSM depth, requester/agent licensing, AI add-ons, asset object limits, CMDB maturity, and implementation burden before accepting platform-consolidation claims.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ServiceNow ITSM pricing/packages', url: 'https://www.servicenow.com/products/itsm/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Atlassian Service Collection pricing', url: 'https://www.atlassian.com/collections/service/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Freshservice pricing', url: 'https://www.freshworks.com/freshservice/pricing/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'ESM/ITSM public pricing constructs only',
        model: 'hybrid',
        metric: 'Agents, requesters/customers, service teams, modules, AI assistants, assets/objects, automation/actions, sandboxes, support, implementation, and integration scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Atlassian Service Collection pricing', url: 'https://www.atlassian.com/collections/service/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Freshservice pricing', url: 'https://www.freshworks.com/freshservice/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Agent counts, requester populations, module scope, workflow count, CMDB/data cleanup, AI use, and implementation services require buyer evidence' },
        ],
        confidence: 0.58,
        notes: 'Some vendors publish plan constructs, while enterprise ESM total cost depends on modules, agents, requesters, add-ons, data migration, CMDB maturity, and workflow redesign.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Workflow and service-data portability',
        buyerPosition: 'Require export of tickets, service catalog definitions, workflows, SLAs, knowledge, approval history, CMDB/asset links, automations, and reporting data where technically available.',
      },
      {
        clauseArea: 'AI and automation controls',
        buyerPosition: 'Define human approval, audit logs, entitlement limits, data-use controls, rollback, and responsibility for AI-assisted routing, summaries, and workflow actions.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Agent/requester license map',
        whenToUse: 'Use when business teams, IT, HR, facilities, finance, legal, and security may all use the platform differently.',
        buyerAsk: 'Map creators, fulfillers, approvers, requesters, admins, and occasional users to license requirements before BAFO.',
      },
      {
        lever: 'CMDB and workflow migration proof',
        whenToUse: 'Use when replacing an incumbent service platform or expanding to enterprise service management.',
        buyerAsk: 'Prove migration of sample tickets, catalogs, SLAs, knowledge, automations, assets, and integrations with exception handling.',
      },
    ],
    riskFactors: [
      {
        id: 'esm-platform-sprawl',
        label: 'Service platform sprawl',
        severity: 'high',
        detectionSignals: ['ITSM scope expands into HR, legal, finance, ITAM, CMDB, DEX, ITOM, AIOps, and DevOps without license or governance mapping.'],
        mitigations: ['Require phased scope, ownership, license map, integration inventory, and module-by-module value gates'],
      },
      {
        id: 'esm-ai-overclaim',
        label: 'AI service-management overclaim',
        severity: 'medium',
        detectionSignals: ['Vendor demo emphasizes AI agents, deflection, or autonomous resolution without buyer data, workflow controls, or audit evidence.'],
        mitigations: ['Treat AI as assisted workflow until proof validates human review, logs, safety controls, and measurable outcomes'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress change-control evidence, segregation of duties, access-request audit trail, data retention, and platform administration controls.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review clinical support workflows, employee data, PHI-adjacent ticket handling, uptime escalation, and emergency change routing.',
      },
      {
        industry: 'public_sector',
        modifier: 'Validate procurement constraints, accessibility, data residency, audit reporting, requester access, and service catalog governance.',
      },
    ],
    body: `## Summary
Enterprise service management sourcing is the move from ad hoc support to governed service operations. The buyer is deciding how requests, incidents, approvals, knowledge, assets, SLAs, escalations, and employee-service workflows become accountable work. A ticketing demo is not enough. The event must test ownership, workflow governance, licensing, data migration, CMDB quality, automation, and the boundary between ITSM depth and broader shared-service convenience.

## When to apply
Use this pattern when sourcing ServiceNow ITSM/ESM, Atlassian Jira Service Management, Freshservice, BMC Helix ITSM, Ivanti Neurons for ITSM, Zendesk Employee Service, Microsoft Power Platform adjacency, or multi-department service workflow programs. Apply it during service-desk replacement, SLA misses, employee-experience programs, shared-services expansion, CMDB cleanup, ITAM integration, access-request governance, change-control findings, or AI service-desk experimentation. Do not use it for pure customer support, pure project management, pure observability, pure RPA, or HRIS-only workflows unless service-management ownership is central.

## Category boundary
In scope: incident, request, problem, change/release, knowledge, service catalog, employee portal, SLA, queue, approval, escalation, virtual agent, workflow automation, asset/CMDB linkage, business-team service workflows, reporting, and integrations. Adjacent but distinct: ITAM, BPM, HR service delivery, customer support, AIOps, DEX, IAM, GRC, RPA, and low-code app platforms.

## Lifecycle and gates
The scope gate should inventory service teams, agents, requesters, workflows, service catalogs, current ticket data, SLAs, knowledge, assets, CMDB quality, integrations, business-team expansion, and AI/automation appetite. The RFP gate should require plan/module mapping, agent/requester licensing, workflow configurability, migration support, service catalog, knowledge, assets/CMDB, access controls, reporting, APIs, and support. The proof gate should run buyer scripts for request, incident, change, approval, escalation, knowledge, asset lookup, reporting, and handoff to another department. The BAFO gate should normalize agents, requesters, modules, AI, automation, asset objects, environments, support, implementation, and migration.

## Evaluation rubric
Weight workflow fit around 25 percent, service-management depth around 20 percent, implementation and migration risk around 20 percent, licensing predictability around 15 percent, platform integration around 10 percent, and AI/automation governance around 10 percent. Increase implementation weight when the buyer has a stale CMDB, many custom workflows, or enterprise-wide shared-service ambitions.

## Pricing and contract notes
Public sources from ServiceNow, Atlassian, Freshservice, BMC, Ivanti, Zendesk, and Microsoft show common constructs: plans, agents, requesters, service teams, AI assistants, automation, assets, CMDB, employee service, and platform workflow. Public plan pages do not equal enterprise net price. Total cost depends on agents, modules, business-team expansion, AI usage, data migration, CMDB cleanup, integrations, support, training, and implementation partners.

Contracting should define service-data export, workflow ownership, configuration portability, migration responsibilities, uptime/support, AI data use, audit logs, admin access, sandbox/environments, and transition assistance. If the vendor positions AI agents or virtual service, require proof controls rather than accepting deflection or productivity claims.

## Contradictions and failure modes
Vendor claim: one platform for every department. Detection: map each department's workflows, data, license needs, approvals, and integrations. Vendor claim: AI resolves service demand. Detection: test actual ticket categories, knowledge quality, human approval, audit trail, and exception routing. Vendor claim: migration is straightforward. Detection: migrate sample tickets, catalogs, workflows, SLAs, knowledge, and assets.

The common failure is buying an enterprise platform while only budgeting for a service desk. The second is expanding to HR, finance, legal, and facilities without ownership and license clarity. The third is assuming a better ticket queue fixes broken workflow and CMDB data.`,
  },
  {
    id: 'PAT-SRC-CAT-BPM-001',
    slug: 'business-process-management-workflow-orchestration-sourcing',
    title: 'Business Process Management and Workflow Orchestration Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'BPM and workflow orchestration sourcing should prove executable process control, exception handling, integration, governance, and run-history evidence rather than accepting low-code speed or automation ROI claims.',
    applicability:
      'Apply when sourcing Appian, Pega, ServiceNow App Engine/Workflow, Camunda, Nintex, Kissflow, Microsoft Power Automate, Salesforce Flow/MuleSoft adjacency, or enterprise workflow orchestration platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://appian.com/products/platform/overview',
      'https://appian.com/products/pricing',
      'https://www.pega.com/products/platform/workflow-automation',
      'https://www.pega.com/products/platform/case-management',
      'https://www.servicenow.com/products/now-platform-app-engine.html',
      'https://www.servicenow.com/platform/workflow-automation.html',
      'https://camunda.com/platform/',
      'https://camunda.com/pricing/',
      'https://www.nintex.com/',
      'https://kissflow.com/platform/',
      'https://www.microsoft.com/en-us/power-platform/products/power-automate/',
      'https://www.microsoft.com/en/power-platform/products/power-automate/pricing',
      'https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/faqs',
    ],
    regulatoryChips: ['SOC-2-review', 'workflow-audit-trail', 'segregation-of-duties-review', 'data-residency-if-sensitive-process-data', 'SOX-if-finance-approvals'],
    relatedPatternIds: ['PAT-SRC-CAT-ESM-001', 'PAT-SRC-CAT-RPA-001', 'PAT-SRC-CAT-PROCURE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Appian, Pega, ServiceNow App Engine, Camunda, Nintex, Kissflow, Microsoft Power Automate, and Salesforce Flow/MuleSoft adjacency',
        tier: 'enterprise',
        positioning: 'Workflow and process orchestration candidates spanning BPM, case management, low-code apps, process mining/intelligence, RPA adjacency, approvals, forms, and cross-system automation.',
        cautions: ['Normalize executable model, integration depth, license meters, citizen-development guardrails, and exportability before comparing demo speed.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Appian platform overview', url: 'https://appian.com/products/platform/overview', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Pega workflow automation', url: 'https://www.pega.com/products/platform/workflow-automation', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Power Automate pricing', url: 'https://www.microsoft.com/en/power-platform/products/power-automate/pricing', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'BPM/workflow public pricing constructs only',
        model: 'hybrid',
        metric: 'Users, apps, workflows, processes, bots, connectors, actions/requests, documents/pages, process mining storage, environments, support, and implementation services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Appian pricing', url: 'https://appian.com/products/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Camunda pricing', url: 'https://camunda.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Power Automate pricing', url: 'https://www.microsoft.com/en/power-platform/products/power-automate/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Process volume, user roles, bot needs, connectors, document volume, environments, and implementation effort require buyer evidence' },
        ],
        confidence: 0.58,
        notes: 'Public pricing exposes some meters, but workflow TCO depends on process complexity, integration, governance, bot capacity, support, and implementation work.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Process asset ownership and export',
        buyerPosition: 'Require export or documented portability for process definitions, forms, decision tables, run history, logs, attachments, integration configuration, and operational data.',
      },
      {
        clauseArea: 'Automation governance',
        buyerPosition: 'Define approval controls, segregation of duties, versioning, test/promotion, rollback, citizen-development governance, and monitoring responsibilities.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Executable-script proof',
        whenToUse: 'Use when vendors demo generic workflow speed instead of buyer exception paths.',
        buyerAsk: 'Run buyer-authored scripts with approvals, rework, escalation, integrations, exception handling, audit trail, and reporting.',
      },
      {
        lever: 'License-meter decomposition',
        whenToUse: 'Use before BAFO where users, bots, actions, connectors, documents, and environments may all trigger cost.',
        buyerAsk: 'Map each target workflow to user roles, automation volume, premium connectors, bot sessions, storage, AI use, and support tiers.',
      },
    ],
    riskFactors: [
      {
        id: 'bpm-no-code-without-governance',
        label: 'No-code without governance',
        severity: 'high',
        detectionSignals: ['Business users can create workflows, but ownership, testing, access, reuse, monitoring, and retirement are unclear.'],
        mitigations: ['Require center-of-excellence model, SDLC, environment strategy, role controls, and lifecycle governance'],
      },
      {
        id: 'bpm-fragile-ui-automation',
        label: 'Fragile automation dependency',
        severity: 'medium',
        detectionSignals: ['Workflow depends on UI automation for systems that have or need APIs, causing brittle production operations.'],
        mitigations: ['Prefer API/integration patterns, document exceptions, and require monitoring plus rollback for UI automation'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress audit trail, model governance, segregation of duties, approval evidence, and operational resilience for regulated workflows.',
      },
      {
        industry: 'insurance',
        modifier: 'Evaluate case management, exception handling, document intake, claims workflow, and integration with policy/admin systems.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Review plant-floor constraints, supplier workflows, quality exceptions, offline handoffs, and ERP/MES integration boundaries.',
      },
    ],
    body: `## Summary
BPM and workflow orchestration sourcing is about controlled execution of work across people, systems, data, bots, approvals, and exceptions. The buyer is not simply buying low-code speed. The event must prove that the platform can model, execute, monitor, change, and audit business processes without creating uncontrolled app sprawl or fragile automation debt.

## When to apply
Use this pattern when sourcing Appian, Pega, ServiceNow App Engine/Workflow, Camunda, Nintex, Kissflow, Microsoft Power Automate, Salesforce Flow/MuleSoft adjacency, or enterprise workflow orchestration platforms. Apply it during shared-services redesign, approval bottlenecks, spreadsheet/email replacement, process mining findings, compliance remediation, M&A process harmonization, low-code governance programs, or RPA consolidation. Do not use it for pure iPaaS, pure RPA, ITSM-only ticketing, CRM-native workflow-only, document management-only, or consulting-only process redesign unless cross-process orchestration is the sourcing anchor.

## Category boundary
In scope: BPM, case management, workflow automation, forms, approvals, decisions, process orchestration, process intelligence/mining, RPA adjacency, IDP adjacency, exception handling, human-in-the-loop controls, run history, monitoring, integrations, citizen development, ALM, and audit evidence. Adjacent but distinct: ITSM, iPaaS, RPA, ERP, CRM, CLM, document management, data integration, and custom application development.

## Lifecycle and gates
The scope gate should inventory target processes, volumes, roles, exception paths, systems, integrations, documents, approvals, audit needs, current automations, business owners, and governance maturity. The RFP gate should require executable modeling, integration methods, versioning, test/promotion, rollback, audit logs, role controls, process monitoring, export, and license meters. The proof gate should run buyer-authored scripts with real exception paths, rework loops, escalations, delegation, approvals, attachments, and reporting. The BAFO gate should normalize users, apps, processes, workflows, bots, connectors, actions, storage, environments, AI features, support, and services.

## Evaluation rubric
Weight process execution fit around 25 percent, integration and data handling around 20 percent, governance/ALM around 20 percent, exception handling around 15 percent, commercial predictability around 10 percent, and AI/process-intelligence fit around 10 percent. Increase governance weight where citizen development or regulated approvals are central.

## Pricing and contract notes
Public sources from Appian, Pega, ServiceNow, Camunda, Nintex, Kissflow, Microsoft, and Salesforce/MuleSoft show a market organized around users, apps, workflows, processes, bots, connectors, automation capacity, process intelligence, and platform services. Public pricing pages should not be converted into buyer TCO without process volume and role mapping. Microsoft Power Automate, for example, exposes user, process, hosted process, and process-mining constructs, but buyer cost still depends on connectors, capacity, flow design, bot concurrency, and tenant entitlements.

Contracting should define process asset ownership, export, run-history retention, integration ownership, admin rights, environment strategy, support, data use, AI controls, and transition assistance. For regulated workflows, require explicit audit trail, version history, approval evidence, and rollback controls.

## Contradictions and failure modes
Vendor claim: no-code means no IT. Detection: inspect integration, security, ALM, testing, monitoring, and retirement responsibilities. Vendor claim: fast automation creates ROI. Detection: require buyer baseline, process volume, error rate, adoption, and operating cost evidence. Vendor claim: native connectors eliminate integration work. Detection: test authentication, error handling, data mapping, rate limits, and lifecycle support.

The common failure is automating a broken process faster. The second is building workflows that cannot be governed, exported, or safely changed. The third is discovering late that premium connectors, bots, actions, environments, or AI capacity drive the economics.`,
  },
  {
    id: 'PAT-SRC-CAT-LEGAL-001',
    slug: 'legal-operations-matter-ebilling-clm-sourcing',
    title: 'Legal Operations, Matter Management, E-Billing, Spend, and CLM Adjacency Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Legal operations sourcing should separate matter management, e-billing, legal spend, vendor management, and CLM adjacency so buyers can govern legal work without overclaiming AI, savings, or legal outcomes.',
    applicability:
      'Apply when sourcing Onit/SimpleLegal, Brightflag, Thomson Reuters Legal Tracker, Mitratech TeamConnect, Ironclad, Icertis, DocuSign CLM, Agiloft, Workday/Evisort, or legal operations platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://cloc.org/cloc-core-12/',
      'https://legal.thomsonreuters.com/en/insights/articles/what-is-enterprise-legal-management',
      'https://legal.thomsonreuters.com/blog/what-is-ledes-format-and-what-are-its-benefits-for-legal-e-billing/',
      'https://www.onit.com/solutions/enterprise-legal-management/',
      'https://www.onit.com/products/elm/simplelegal/',
      'https://brightflag.com/',
      'https://legal.thomsonreuters.com/en/products/legal-tracker/features',
      'https://mitratech.com/products/teamconnect/',
      'https://support.ironcladapp.com/hc/en-us/articles/12615001356567-Ironclad-Products-Overview',
      'https://www.icertis.com/contract-management/',
      'https://www.docusign.com/products/clm',
      'https://www.agiloft.com/solutions/clm-legal-professionals/',
      'https://www.workday.com/en-us/products/contract-management/contract-intelligence.html',
    ],
    regulatoryChips: ['legal-privilege-review', 'confidentiality-review', 'data-residency-review', 'SOC-2-review', 'billing-guideline-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CLM-001', 'PAT-SRC-CAT-BPM-001', 'PAT-SRC-CAT-PROCURE-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Onit/SimpleLegal, Brightflag, Thomson Reuters Legal Tracker, Mitratech TeamConnect, Ironclad, Icertis, DocuSign CLM, Agiloft, and Workday/Evisort',
        tier: 'enterprise',
        positioning: 'Legal operations and CLM-adjacent candidates for matter intake, e-billing, legal spend, vendor management, reporting, contract workflow, repository, AI extraction, and contract intelligence.',
        cautions: ['Separate ELM/e-billing from CLM/e-signature/legal research, and do not treat software output as legal advice or guaranteed compliance.'],
        sourceBasis: [
          { type: 'industry-consortium', label: 'CLOC Core 12', url: 'https://cloc.org/cloc-core-12/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Thomson Reuters enterprise legal management explainer', url: 'https://legal.thomsonreuters.com/en/insights/articles/what-is-enterprise-legal-management', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Onit SimpleLegal', url: 'https://www.onit.com/products/elm/simplelegal/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Legal operations public pricing constructs only',
        model: 'hybrid',
        metric: 'Legal users, matters, invoices, spend volume, outside counsel vendors, CLM users, contract volume, AI features, integrations, migration, managed review, and support',
        sourceBasis: [
          { type: 'founder-data-gap', label: 'Legal matter count, invoice volume, outside counsel roster, AP/ERP integrations, contract repository quality, and legal department operating model require buyer evidence' },
        ],
        confidence: 0.45,
        notes: 'Enterprise legal operations pricing is typically quote-driven; do not infer costs or savings from vendor pages without buyer-specific volume and scope.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Legal data confidentiality and export',
        buyerPosition: 'Require export of matters, invoices, budgets, accruals, vendors, billing rules, contracts, metadata, documents, audit logs, and reporting data subject to privilege and confidentiality controls.',
      },
      {
        clauseArea: 'AI and legal review boundaries',
        buyerPosition: 'Define human review, source citation, audit trail, data-use restrictions, confidentiality, model governance, and explicit prohibition on unsupervised legal advice.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'ELM versus CLM scope split',
        whenToUse: 'Use when the buyer blends matter/e-billing and contract lifecycle needs in one evaluation.',
        buyerAsk: 'Score matter management, e-billing, spend, vendor management, CLM workflow, repository, and contract intelligence as separate capability lanes.',
      },
      {
        lever: 'Outside counsel adoption proof',
        whenToUse: 'Use when e-billing or matter collaboration depends on law firm behavior.',
        buyerAsk: 'Test invoice formats, billing guidelines, timekeeper management, vendor onboarding, dispute workflow, and AP integration with representative firms.',
      },
    ],
    riskFactors: [
      {
        id: 'legal-category-conflation',
        label: 'Legal category conflation',
        severity: 'high',
        detectionSignals: ['Buyer compares CLM, e-billing, ELM, legal research, e-signature, and AI review as if they solve the same job.'],
        mitigations: ['Separate capability scorecards and require workflow proof for each legal operating job'],
      },
      {
        id: 'legal-ai-overreach',
        label: 'Legal AI overreach',
        severity: 'critical',
        detectionSignals: ['Vendor or buyer treats AI extraction, invoice review, or clause analysis as legal advice or guaranteed compliance.'],
        mitigations: ['Require human review, citations, audit trail, confidentiality terms, and legal-owner acceptance criteria'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress privilege, regulatory matters, outside counsel controls, matter confidentiality, spend approvals, and audit evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review HIPAA-adjacent matters, litigation/regulatory workflows, privileged data handling, and vendor confidentiality.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Plan for high-volume commercial contracts, employment matters, IP/brand issues, outside counsel spend, and franchise/supplier legal workflows.',
      },
    ],
    body: `## Summary
Legal operations sourcing should create operating control for legal work without pretending software makes legal judgments. The buyer is choosing how matters, invoices, budgets, accruals, outside counsel, billing guidelines, vendors, reports, contracts, repositories, and legal workflows become visible and governed. Matter management, e-billing, enterprise legal management, CLM, contract intelligence, e-signature, and legal research are adjacent but not interchangeable.

## When to apply
Use this pattern when sourcing Onit/SimpleLegal, Brightflag, Thomson Reuters Legal Tracker, Mitratech TeamConnect, Ironclad, Icertis, DocuSign CLM, Agiloft, Workday/Evisort, or legal operations platforms. Apply it during first legal-ops hire, outside counsel spend pressure, invoice-review bottlenecks, matter spreadsheet fatigue, CLM renewal, ERP/AP integration, contract repository cleanup, M&A integration, multi-currency billing, or legal reporting demands. Do not use it for law-firm practice management, standalone e-signature, standalone legal research, e-discovery, IP docketing, or ALSP services unless corporate legal operations is the sourcing anchor.

## Category boundary
In scope: matter intake, matter management, e-billing, LEDES/UTBMS workflows, billing guidelines, invoice review, outside counsel management, budgets, accruals, legal spend analytics, vendor management, AP/ERP integration, reporting, contract workflow, CLM adjacency, contract repository, AI extraction, clause search, and legal ops dashboards. Adjacent but distinct: CLM-only, e-signature-only, legal research, e-discovery, privacy/GRC, procurement CLM, and document management.

## Lifecycle and gates
The scope gate should inventory matters, invoices, law firms, billing guidelines, rate cards, legal vendors, AP/ERP systems, accrual process, contract repositories, templates, clause metadata, privilege/confidentiality constraints, and reporting needs. The RFP gate should require module boundaries, e-billing formats, matter taxonomy, invoice rules, vendor portal, analytics, CLM workflow, integrations, migration, security, data residency, and AI controls. The proof gate should run sample matters, invoices, billing-rule exceptions, accruals, reports, contract intake, repository search, and AP handoff. The BAFO gate should normalize users, matters, invoice volume, spend volume, vendors, contracts, AI features, integrations, migration, support, and managed services.

## Evaluation rubric
Weight matter/e-billing fit around 25 percent, legal spend and vendor management around 20 percent, CLM adjacency around 15 percent, integration/migration risk around 15 percent, confidentiality/security around 15 percent, and commercial predictability around 10 percent. Increase confidentiality weight for privileged, regulated, cross-border, or litigation-heavy environments.

## Pricing and contract notes
Public sources from CLOC, Thomson Reuters, Onit/SimpleLegal, Brightflag, Legal Tracker, Mitratech, Ironclad, Icertis, DocuSign, Agiloft, and Workday/Evisort show the legal-ops map: matter management, e-billing, legal spend, vendor management, CLM, contract intelligence, and reporting. They do not justify invented savings, outside counsel reductions, or legal outcome claims. Enterprise pricing is quote-driven and depends on matters, invoices, spend volume, vendors, users, contracts, integrations, migration, support, and managed bill review.

Contracting should define legal-data export, confidentiality, privilege handling, data residency, AP/ERP integration, outside counsel onboarding, invoice format support, billing-rule ownership, AI data use, human review, audit trail, and transition assistance.

## Contradictions and failure modes
Vendor claim: AI reviews legal work. Detection: require human review, source evidence, audit trail, confidentiality controls, and legal-owner approval. Vendor claim: ELM and CLM are one category. Detection: score matter/e-billing and contract lifecycle workflows separately. Vendor claim: spend savings are available. Detection: require buyer baseline, billing guidelines, vendor adoption, rate cards, and finance-approved methodology.

The common failure is buying CLM when the immediate pain is invoice and matter control, or buying e-billing when the immediate pain is contract workflow. The second is underestimating outside counsel and AP adoption. The third is treating AI output as legal advice rather than review support.`,
  },
  {
    id: 'PAT-SRC-CAT-PROCURE-001',
    slug: 'source-to-pay-procurement-suite-sourcing',
    title: 'Source-to-Pay Procurement Suite and Orchestration Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Source-to-pay sourcing should separate procurement scope, supplier governance, network economics, workflow control, and ERP/AP/CLM integration before buyers accept suite breadth or autonomous sourcing claims.',
    applicability:
      'Apply when sourcing SAP Ariba, Oracle Procurement, Workday Spend Management, Coupa, Ivalua, GEP SMART, JAGGAER, Basware, Zip, Fairmarkit, Arkestro, Globality, or procurement orchestration platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.sap.com/products/spend-management/procure-to-pay/pricing.html',
      'https://www.sap.com/sea/about/trust-center/agreements.html',
      'https://support.ariba.com/item/download?item_id=207582&locale=en',
      'https://www.oracle.com/erp/procurement/',
      'https://www.oracle.com/us/corporate/pricing/fusion-pricelist-2949061.pdf',
      'https://www.oracle.com/contracts/cloud-services/',
      'https://www.workday.com/en-us/topics/erp/procurement.html',
      'https://www.workday.com/en-us/products/spend-management/strategic-sourcing-supplier-management.html',
      'https://www.ivalua.com/solutions/process/source-to-pay-platform/',
      'https://www.gep.com/software/gep-smart',
      'https://www.jaggaer.com/press-release/19-2-release-simplifies-advanced-source-to-pay-solutions',
      'https://www.basware.com/en/solutions/procure-to-pay/',
      'https://ziphq.com/platform-overview',
      'https://www.fairmarkit.com/',
      'https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final',
      'https://www.iso.org/standard/63026.html',
      'https://www.occ.treas.gov/news-issuances/news-releases/2023/nr-ia-2023-53.html',
    ],
    regulatoryChips: ['third-party-risk-review', 'supplier-data-privacy-review', 'SOX-procurement-controls', 'sanctions-screening-if-global', 'AI-human-approval-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CLM-001', 'PAT-SRC-CAT-AP-001', 'PAT-SRC-CAT-LEGAL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'SAP Ariba, Oracle Procurement, Workday Spend Management, Coupa, Ivalua, GEP SMART, JAGGAER, Basware, Zip, Fairmarkit, Arkestro, and Globality',
        tier: 'enterprise',
        positioning: 'Source-to-pay, procure-to-pay, supplier management, intake/orchestration, supplier network, and autonomous sourcing candidates spanning requisitions, sourcing, contracts, purchasing, invoices, payments, and supplier lifecycle controls.',
        cautions: ['Normalize source-to-pay versus procure-to-pay scope, supplier network fees, ERP system-of-record boundaries, implementation services, and AI autonomy before comparing suite breadth.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP Ariba Buying and Invoicing pricing', url: 'https://www.sap.com/products/spend-management/procure-to-pay/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Oracle Procurement product page', url: 'https://www.oracle.com/erp/procurement/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Workday procurement overview', url: 'https://www.workday.com/en-us/topics/erp/procurement.html', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Source-to-pay public pricing constructs only',
        model: 'hybrid',
        metric: 'Users, employees, spend processed, hosted records, order lines, documents, suppliers, invoices, purchase orders, modules, tenants, supplier network fees, AI/orchestration features, implementation, integrations, support, and transaction meters',
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP Ariba Buying and Invoicing spend-based usage metric and price upon request', url: 'https://www.sap.com/products/spend-management/procure-to-pay/pricing.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Oracle Fusion Cloud Services price list', url: 'https://www.oracle.com/us/corporate/pricing/fusion-pricelist-2949061.pdf', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Actual spend under management, supplier count, document volumes, modules, ERP footprint, implementation scope, and supplier network fee exposure require buyer evidence' },
        ],
        confidence: 0.58,
        notes: 'Enterprise procurement pricing is often sales-led. Public sources support license-meter normalization, not invented net pricing, savings, or implementation benchmarks.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Supplier network and fee transparency',
        buyerPosition: 'Require disclosure of supplier-paid fees, document charges, payment fees, account thresholds, network support obligations, and supplier enablement responsibilities before award.',
      },
      {
        clauseArea: 'Autonomous sourcing controls',
        buyerPosition: 'Require human approval, audit logs, explainability, supplier-fairness controls, and data-use restrictions before AI tools contact suppliers or recommend awards.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Scope decomposition',
        whenToUse: 'Use when vendors package sourcing, supplier management, purchasing, invoicing, payments, intake, and AI as one suite story.',
        buyerAsk: 'Price and score full S2P, source-to-contract, supplier management, P2P, intake orchestration, AP automation, and autonomous sourcing as separate lanes.',
      },
      {
        lever: 'Supplier network economics',
        whenToUse: 'Use before BAFO where supplier portals, transaction documents, payment rails, or network accounts shift cost to suppliers.',
        buyerAsk: 'Cap or disclose supplier charges, document fees, payment fees, onboarding obligations, support model, and opt-out paths.',
      },
    ],
    riskFactors: [
      {
        id: 'procure-suite-overbuy',
        label: 'Suite breadth exceeds process maturity',
        severity: 'high',
        detectionSignals: ['Buyer wants full suite while supplier master data, category taxonomy, buying channels, contract metadata, and AP controls are weak.'],
        mitigations: ['Sequence modules by adoption risk and require implementation acceptance criteria for each workflow'],
      },
      {
        id: 'procure-ai-governance-gap',
        label: 'Autonomous sourcing governance gap',
        severity: 'critical',
        detectionSignals: ['Vendor describes autonomous supplier communication, negotiation, or award recommendations without buyer approval gates or audit evidence.'],
        mitigations: ['Require human-in-loop controls, logs, prompt/data lineage, supplier fairness review, and explicit award governance'],
      },
    ],
    industryVariants: [
      {
        industry: 'public_sector',
        modifier: 'Stress competition rules, contract vehicles, auditability, accessibility, transparency, and category management constraints.',
      },
      {
        industry: 'financial_services',
        modifier: 'Apply third-party risk lifecycle controls from planning through termination and preserve audit evidence for critical suppliers.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Review direct-material workflows, BOM linkage, EDI, supplier capacity, quality documentation, commodity exposure, and engineering-change controls.',
      },
    ],
    body: `## Summary
Source-to-pay procurement sourcing is not a generic software-suite bakeoff. The buyer is choosing how spend demand enters the company, how suppliers are qualified, how sourcing events run, how contracts hand off, how purchases become POs, how invoices match, how payments and supplier networks behave, and how evidence survives audit. The event must separate source-to-pay, procure-to-pay, AP automation, CLM, supplier risk, intake orchestration, and autonomous sourcing so scope does not hide economics or governance.

## When to apply
Use this pattern when sourcing SAP Ariba, Oracle Procurement, Workday Spend Management, Coupa, Ivalua, GEP SMART, JAGGAER, Basware, Zip, Fairmarkit, Arkestro, Globality, or procurement orchestration platforms. Apply it during procurement transformation, maverick-spend reduction, supplier-risk remediation, ERP modernization, source-to-pay consolidation, intake workflow launch, supplier network migration, AP/PO matching issues, or AI sourcing experiments. Do not use it for pure AP automation, expense cards, generic CLM, treasury, supply chain planning, logistics, VMS, or ERP finance unless supplier/source-to-pay governance is central.

## Category boundary
In scope: spend analysis, intake, requisitions, sourcing, RFx, auctions, supplier onboarding, supplier master data, supplier risk/performance, contract handoff, catalogs, punchout, purchasing, receiving, invoicing, payments, supplier portals, supplier networks, orchestration, and AI sourcing controls. Adjacent but distinct: CLM, AP automation, T&E, treasury, ERP finance, supply planning, direct-material PLM, logistics, and contingent labor.

## Lifecycle and gates
The scope gate should inventory spend categories, supplier counts, entity/ERP footprint, PO and invoice volume, contract repositories, supplier onboarding requirements, AP controls, buying channels, taxonomy, risk requirements, and AI appetite. The RFP gate should require module-by-module pricing, user/employee/spend/document metrics, supplier network terms, integration scope, APIs, cXML/EDI, implementation approach, data migration, security, audit, and AI controls. The proof gate should run buyer scripts for supplier onboarding, sourcing event, requisition, approval, PO, receipt, invoice match, contract lookup, exception, and report export. The BAFO gate should normalize subscription, usage, supplier fees, transaction/document charges, implementation, integrations, support, environments, and renewal uplift.

## Evaluation rubric
Weight process fit around 25 percent, ERP/AP/CLM integration around 20 percent, supplier governance and risk around 20 percent, commercial predictability around 15 percent, implementation/data readiness around 15 percent, and AI/orchestration governance around 5 percent. Increase governance weight when autonomous sourcing or regulated supplier risk is material.

## Pricing and contract notes
Public sources show heterogeneous meters. SAP Ariba Buying and Invoicing publicly describes a spend-based usage metric, yearly entitlement, price upon request, and multi-year contract constructs. Oracle publishes cloud price-list metrics such as hosted named users, employees, records, and order lines across Fusion services. Supplier network materials can introduce document, transaction, account, or threshold-dependent supplier charges. These sources support meter normalization, not invented net pricing or savings.

Contracting should define modules, usage meters, supplier network charges, data processing, audit rights, service levels, ERP connectors, supplier enablement, implementation acceptance, data export, termination assistance, and AI controls. For autonomous sourcing, require human approval before supplier communications, negotiation moves, or award recommendations.

## Contradictions and failure modes
Vendor claim: one suite solves procurement. Detection: split S2P, P2P, AP, CLM, intake, supplier risk, and AI into separate proofs. Vendor claim: supplier network value is obvious. Detection: quantify supplier fees, adoption burden, support, opt-outs, and document/payment charges. Vendor claim: AI sources autonomously. Detection: inspect approval gates, logs, data lineage, supplier fairness, and award governance.

The common failure is buying suite breadth before fixing supplier master data, taxonomy, buying channels, and contract metadata. The second is shifting cost or friction to suppliers through network terms. The third is letting AI sourcing demos outrun procurement judgment and auditability.`,
  },
  {
    id: 'PAT-SRC-CAT-CLM-001',
    slug: 'contract-lifecycle-management-sourcing',
    title: 'Contract Lifecycle Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'CLM sourcing should prove lifecycle workflow, repository quality, metadata, integrations, AI controls, and adoption across legal, procurement, sales, and finance before buyers accept contract-intelligence claims.',
    applicability:
      'Apply when sourcing Ironclad, Conga, Sirion, LinkSquares, DocuSign CLM, Icertis, Agiloft, Workday/Evisort, Coupa CLM, GEP, JAGGAER, Malbek, Ivalua, or contract lifecycle management platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.gartner.com/reviews/market/contract-life-cycle-management',
      'https://www.forrester.com/report/the-forrester-wave-tm-contract-lifecycle-management-platforms-q1-2025/RES181997',
      'https://www.docusign.com/products/clm',
      'https://www.docusign.com/trust/security/clm',
      'https://www.docusign.com/legal/terms-and-conditions/schedule-docusignclm/attachment-data-protection',
      'https://www.docusign.com/products/platform/ai/ai-trust',
      'https://www.agiloft.com/pricing/',
      'https://www.agiloft.com/terms-policies/data-processing-addendum/',
      'https://www.agiloft.com/terms-policies/service-level-addendum/',
      'https://www.agiloft.com/terms-policies/supplemental-services-terms/',
      'https://linksquares.com/pricing/',
      'https://linksquares.com/products/contract-lifecycle-management-software/',
      'https://ironcladapp.com/product/ironclad-ai',
    ],
    regulatoryChips: ['DPA-review', 'AI-output-review', 'legal-privilege-review', 'SOC-2-review', 'cross-border-transfer-review'],
    relatedPatternIds: ['PAT-SRC-CAT-LEGAL-001', 'PAT-SRC-CAT-PROCURE-001', 'PAT-SRC-CAT-AP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Ironclad, Conga, Sirion, LinkSquares, DocuSign CLM, Icertis, Agiloft, Workday/Evisort, Coupa, GEP, JAGGAER, Malbek, and Ivalua',
        tier: 'enterprise',
        positioning: 'Contract lifecycle and contract intelligence candidates spanning intake, authoring, clause libraries, negotiation, approvals, e-signature, repository, obligation management, renewals, reporting, and AI extraction.',
        cautions: ['Separate repository, workflow, legal review, procurement/sales integration, AI extraction, and e-signature requirements before accepting CLM category labels.'],
        sourceBasis: [
          { type: 'analyst-report', label: 'Forrester CLM Platforms Wave Q1 2025 summary page', url: 'https://www.forrester.com/report/the-forrester-wave-tm-contract-lifecycle-management-platforms-q1-2025/RES181997', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'DocuSign CLM product page', url: 'https://www.docusign.com/products/clm', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'LinkSquares pricing drivers', url: 'https://linksquares.com/pricing/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'CLM public pricing constructs only',
        model: 'hybrid',
        metric: 'Users, contract volume, selected modules, AI/batch analysis, implementation and onboarding, custom integrations, support, environments, e-signature integrations, and migration scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'LinkSquares pricing factors', url: 'https://linksquares.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Agiloft pricing and add-on constructs', url: 'https://www.agiloft.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Contract volume, user roles, repository quality, metadata extraction scope, integration depth, and implementation SOW require buyer evidence' },
        ],
        confidence: 0.57,
        notes: 'CLM pricing is usually quote-based. Public pricing pages support cost-driver normalization, not market-wide price or ROI claims.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Contract data export and transition',
        buyerPosition: 'Require bulk export of contracts, metadata, clause library, templates, workflows, approval history, obligations, renewal data, audit logs, and integration mappings where technically available.',
      },
      {
        clauseArea: 'AI and contract intelligence boundaries',
        buyerPosition: 'Define human review, no-reliance language, customer data use, third-party model/subprocessor controls, output audit trail, and remediation for materially wrong extraction or summary behavior.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Repository migration proof',
        whenToUse: 'Use when legacy contracts are scattered across drives, e-signature systems, procurement tools, CRM, and local legal files.',
        buyerAsk: 'Make migration, metadata quality, duplicate handling, OCR/extraction confidence, and owner sign-off part of implementation acceptance.',
      },
      {
        lever: 'Role and module normalization',
        whenToUse: 'Use before BAFO where legal, sales, procurement, finance, and business requesters need different access levels.',
        buyerAsk: 'Normalize named users, requesters, approvers, business users, admins, AI features, contract volume, support, and environments across quotes.',
      },
    ],
    riskFactors: [
      {
        id: 'clm-data-readiness-gap',
        label: 'Contract repository data readiness gap',
        severity: 'high',
        detectionSignals: ['Legacy contracts lack consistent metadata, owners, amendment linkage, renewal dates, or signed-final versions.'],
        mitigations: ['Run sample migration, metadata extraction, owner validation, and exception reporting before award'],
      },
      {
        id: 'clm-ai-overreliance',
        label: 'AI contract intelligence overreliance',
        severity: 'critical',
        detectionSignals: ['Buyer or vendor treats extraction, summaries, or clause analysis as legal conclusion or counsel replacement.'],
        mitigations: ['Require human legal review, citations/source links, output disclaimers, audit trail, and legal-owner acceptance criteria'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress data protection, audit trails, third-party risk flowdowns, cross-border transfers, retention, and contract-owner evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review BAAs, PHI-adjacent contracts, vendor confidentiality, retention, audit access, and clinical/business associate workflows.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Plan for supplier agreements, rebates/allowances, private label, franchise or distributor contracts, and high-volume commercial templates.',
      },
    ],
    body: `## Summary
Contract lifecycle management sourcing is the search for operating control over contracts from request through renewal or termination. The buyer is not merely buying e-signature, a document repository, or AI clause search. The event must prove intake, authoring, clause libraries, negotiation, approvals, execution, repository quality, obligation tracking, renewal alerts, reporting, integrations, security, and AI governance across the teams that create and consume contracts.

## When to apply
Use this pattern when sourcing Ironclad, Conga, Sirion, LinkSquares, DocuSign CLM, Icertis, Agiloft, Workday/Evisort, Coupa CLM, GEP, JAGGAER, Malbek, Ivalua, or contract lifecycle management platforms. Apply it during legal operations buildout, contract repository cleanup, sales-cycle bottlenecks, supplier agreement governance, procurement transformation, renewal leakage, M&A integration, privacy/security flowdown pressure, or AI contract-intelligence pilots. Do not use it for standalone e-signature, generic document management, legal research, e-discovery, matter management, or AP automation unless lifecycle workflow and contract metadata are central.

## Category boundary
In scope: contract request, intake forms, playbooks, templates, clause libraries, document assembly, redlining, negotiation, approvals, e-signature handoff, repository, metadata, obligation management, renewals, amendments, search, reporting, integrations, AI extraction, and contract intelligence. Adjacent but distinct: ELM/e-billing, AP, procurement suites, CPQ, CRM, document management, privacy/GRC, e-discovery, and legal advice.

## Lifecycle and gates
The scope gate should inventory contract types, volumes, repositories, templates, clause playbooks, users, requesters, approvers, business owners, systems of record, e-signature tools, CRM/procurement/ERP integrations, data classifications, and AI restrictions. The RFP gate should require lifecycle modules, user roles, contract-volume assumptions, migration scope, metadata extraction, clause/library governance, AI terms, security evidence, DPA, support, and implementation SOW. The proof gate should run buyer scripts for request, template selection, negotiation, approval, execution, repository search, obligation, renewal alert, amendment, export, and reporting. The BAFO gate should normalize users, contract volume, modules, AI add-ons, environments, integrations, implementation, migration, support, and renewal uplift.

## Evaluation rubric
Weight lifecycle workflow around 25 percent, repository and metadata quality around 20 percent, integration fit around 15 percent, implementation/migration risk around 15 percent, security and AI governance around 15 percent, and commercial predictability around 10 percent. Increase migration weight when legacy contracts are scattered or metadata is inconsistent.

## Pricing and contract notes
Public sources show quote-based CLM economics driven by users, contract volume, selected modules, implementation/onboarding, custom integrations, advanced features, AI/batch analysis, support, and migration. LinkSquares publicly lists contract volume, user count, modules, implementation/onboarding, integrations, and advanced features as pricing factors. Agiloft publicly exposes pricing/add-on constructs and separate DPA, service-level, and supplemental terms. These sources support cost-driver normalization, not invented CLM prices, cycle-time reductions, or savings.

Contracting should define modules, user classes, contract volumes, environments, support, DPA, subprocessors, AI use, output limitations, service levels, implementation acceptance, migration responsibilities, data export, deletion, transition assistance, renewal notice, uplift caps, and pre-priced expansion bands.

## Contradictions and failure modes
Vendor claim: AI understands contracts. Detection: test source citations, extraction confidence, human review, output disclaimers, and legal-owner acceptance. Vendor claim: implementation is mostly configuration. Detection: inspect repository quality, metadata gaps, template governance, workflow ownership, and integration complexity. Vendor claim: CLM speeds the business. Detection: require baseline cycle time, adoption plan, bottleneck map, and business-owner accountability.

The common failure is buying CLM before cleaning contract data and ownership. The second is letting legal, sales, procurement, and finance optimize different workflows inside one tool without governance. The third is treating AI summaries or extracted obligations as legal conclusions rather than review support.`,
  },
  {
    id: 'PAT-SRC-CAT-AP-001',
    slug: 'accounts-payable-invoice-to-pay-automation-sourcing',
    title: 'Accounts Payable Automation and Invoice-to-Pay Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AP automation sourcing should prove invoice intake, matching, approvals, payment authority, ERP sync, supplier adoption, and compliance controls before buyers accept touchless-processing or cash-flow claims.',
    applicability:
      'Apply when sourcing Coupa AP Automation, SAP Concur Invoice, Basware, Medius, Stampli, BILL, Tipalti, AvidXchange, or invoice-to-pay and payment automation platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.coupa.com/products/ap-automation/',
      'https://www.concur.com/products/concur-invoice',
      'https://www.basware.com/en/solutions/ap-automation',
      'https://www.medius.com/solutions/medius-accounts-payable-automation/',
      'https://www.medius.com/pricing/',
      'https://www.stampli.com/ap-automation-platform/',
      'https://www.bill.com/product/accounts-payable/',
      'https://www.bill.com/product/pricing#accountants',
      'https://www.bill.com/legal/terms-of-service',
      'https://tipalti.com/ap-automation/',
      'https://tipalti.com/pricing/',
      'https://tipalti.com/legal/tipalti-services-agreement/',
      'https://tipalti.com/legal/customer-dpa-20220425/',
      'https://www.avidxchange.com/',
      'https://www.irs.gov/tax-professionals/taxpayer-identification-number-tin-matching',
      'https://ofac.treasury.gov/other-ofac-sanctions-lists',
      'https://peppol.org/about/',
      'https://www.consilium.europa.eu/en/press/press-releases/2024/11/05/taxation-council-agrees-on-vat-in-the-digital-age-package/pdf/',
    ],
    regulatoryChips: ['SOX-AP-controls', 'OFAC-screening-if-payments', 'TIN-validation-review', 'VAT-e-invoicing-if-global', 'bank-account-change-control'],
    relatedPatternIds: ['PAT-SRC-CAT-PROCURE-001', 'PAT-SRC-CAT-CLM-001', 'PAT-SRC-CAT-LEGAL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Coupa AP Automation, SAP Concur Invoice, Basware, Medius, Stampli, BILL, Tipalti, and AvidXchange',
        tier: 'enterprise',
        positioning: 'Invoice-to-pay and AP automation candidates for invoice capture, coding, approvals, PO/non-PO matching, supplier onboarding, tax validation, payments, ERP/accounting sync, e-invoicing, and audit trails.',
        cautions: ['Do not compare AP tools only by OCR or AI demos; normalize payment authority, ERP sync, exception workflows, supplier adoption, tax/vendor controls, and transaction fees.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'BILL pricing and AP/AR constructs', url: 'https://www.bill.com/product/pricing#accountants', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Tipalti AP automation pricing FAQ', url: 'https://tipalti.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Medius pricing/packages', url: 'https://www.medius.com/pricing/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'AP automation public pricing constructs only',
        model: 'hybrid',
        metric: 'Subscription/platform fees, users, approver-only roles, entities, invoice volume, payment volume, payment rails, FX/cross-border fees, tax filings, modules, ERP connectors, implementation, supplier enablement, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'BILL AP/AR user and transaction fee constructs', url: 'https://www.bill.com/product/pricing#accountants', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Tipalti subscription plus transaction-based pricing summary', url: 'https://tipalti.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Invoice count, PO/non-PO mix, entity/country footprint, payment methods, supplier roster, ERP/accounting integration, and exception volume require buyer evidence' },
        ],
        confidence: 0.60,
        notes: 'Public pages support pricing-meter analysis. They do not justify invented AP savings, touchless rates, close acceleration, or headcount reduction claims.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Payment authority and failed-payment handling',
        buyerPosition: 'Define approval authority, bank-account change controls, holds, reversals, rejected ACH/debits, failed funding, payment-status evidence, payor liability, and escalation rights.',
      },
      {
        clauseArea: 'AP data export and audit survival',
        buyerPosition: 'Require export of invoices, attachments, vendors, approvals, coding, matching evidence, payment status, tax data, remittances, audit logs, and retention metadata after termination.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Invoice and payment volume normalization',
        whenToUse: 'Use where vendors price by users, entities, invoices, payments, rails, FX, modules, or supplier enablement differently.',
        buyerAsk: 'Model total cost across invoice count, payment count, supplier count, entities, countries, currencies, payment methods, support, and implementation.',
      },
      {
        lever: 'Exception-path proof',
        whenToUse: 'Use when vendors claim touchless AP or AI capture accuracy.',
        buyerAsk: 'Test non-PO invoices, PO mismatch, duplicate invoice, vendor bank change, partial receipt, tax exception, failed payment, and ERP sync failure with buyer samples.',
      },
    ],
    riskFactors: [
      {
        id: 'ap-touchless-overclaim',
        label: 'Touchless AP overclaim',
        severity: 'high',
        detectionSignals: ['Vendor demo uses clean invoices while buyer has weak PO hygiene, inconsistent receiving, custom GL coding, and exception-heavy workflows.'],
        mitigations: ['Require sample invoice testing, exception reporting, buyer baseline, and acceptance thresholds before rollout'],
      },
      {
        id: 'ap-payment-control-risk',
        label: 'Payment control and fraud risk',
        severity: 'critical',
        detectionSignals: ['Workflow automates payments or bank changes without segregation of duties, callback controls, approval logs, or failed-payment procedures.'],
        mitigations: ['Require bank-change controls, maker-checker approvals, payment holds, audit logs, liability terms, and incident escalation'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress segregation of duties, vendor bank-account controls, sanctions screening, audit trails, payment authority, and third-party risk review.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Review three-way match, goods receipt dependency, EDI/e-invoicing, PO line accuracy, supplier portals, and multi-ERP posting.',
      },
      {
        industry: 'public_sector',
        modifier: 'Validate e-invoicing mandates, retention, auditability, public payment controls, accessibility, and supplier onboarding constraints.',
      },
    ],
    body: `## Summary
Accounts payable automation sourcing is the control point between supplier obligations, invoice evidence, approvals, accounting records, and cash leaving the company. The buyer is not just buying OCR or AI capture. The event must prove invoice intake, PO and non-PO matching, coding, approval routing, payment authority, supplier onboarding, tax/vendor checks, ERP sync, audit logs, exception handling, and e-invoicing readiness.

## When to apply
Use this pattern when sourcing Coupa AP Automation, SAP Concur Invoice, Basware, Medius, Stampli, BILL, Tipalti, AvidXchange, or invoice-to-pay and payment automation platforms. Apply it during AP backlog reduction, duplicate-payment concern, supplier onboarding friction, multi-entity accounting, ERP modernization, global payouts, e-invoicing readiness, audit findings, PO compliance issues, or payment-control redesign. Do not use it for full source-to-pay, procurement catalog, T&E, treasury, AR automation, generic ERP replacement, or CLM unless invoice-to-pay control is central.

## Category boundary
In scope: invoice intake, OCR/AI capture, invoice coding, PO/non-PO matching, receiving match, approval workflow, supplier onboarding, vendor master validation, tax IDs, sanctions checks, duplicate detection, payment file or payment execution, remittance, ERP/accounting sync, audit trail, e-invoicing, reporting, and exception queues. Adjacent but distinct: procurement sourcing, catalogs, spend cards, travel/expense, treasury, working capital financing, AR, CLM, and ERP finance.

## Lifecycle and gates
The scope gate should inventory invoice volume, PO/non-PO mix, entities, countries, currencies, payment methods, supplier count, ERP/accounting systems, approval rules, vendor master controls, tax requirements, e-invoicing exposure, current exceptions, and payment authority. The RFP gate should require pricing by users, entities, invoices, payments, payment rails, FX, modules, ERP connectors, supplier portal, compliance controls, implementation, support, and data export. The proof gate should run buyer invoice samples through clean match, PO mismatch, non-PO approval, duplicate invoice, bank change, tax exception, failed payment, and ERP sync. The BAFO gate should normalize subscription, transaction fees, payment fees, FX, tax filings, supplier enablement, implementation, integrations, support, and renewal uplift.

## Evaluation rubric
Weight matching and exception workflow around 25 percent, ERP/payment integration around 20 percent, payment control and fraud prevention around 20 percent, supplier adoption around 15 percent, compliance/e-invoicing around 10 percent, and commercial predictability around 10 percent. Increase control weight when the tool executes payments rather than only preparing files.

## Pricing and contract notes
Public sources show mixed AP economics. BILL publicly describes AP/AR as paid subscriptions priced per user, notes custom pricing for enterprise complexity, and discloses that certain payment types can carry transaction fees. Tipalti describes subscription plus transaction-based pricing driven by payment volume, entities, modules, payment methods, and currencies. Medius publishes package constructs and sales-led pricing. These sources support meter normalization, not invented touchless rates, cycle-time savings, or close acceleration.

Contracting should define approval authority, payment holds, reversals, failed funding, payment liability, bank-partner dependencies, DPA, subprocessors, tax/vendor validation responsibilities, ERP connector scope, implementation acceptance, audit-log retention, data export, and transition assistance. For global payments, review OFAC/sanctions, TIN/W-9/W-8, VAT/e-invoicing, FX, and local payment-rail limitations.

## Contradictions and failure modes
Vendor claim: AP becomes touchless. Detection: test messy buyer invoices, PO mismatches, missing receipts, duplicate invoices, tax exceptions, and custom GL coding. Vendor claim: payments are automated safely. Detection: inspect bank-change controls, segregation of duties, holds, reversals, failed-payment handling, and liability. Vendor claim: supplier network solves adoption. Detection: validate supplier onboarding burden, payment preference, portal friction, virtual-card economics, and support.

The common failure is automating bad invoice hygiene and weak vendor master controls. The second is discovering late that payment rails, FX, tax filings, or failed-payment fees drive economics. The third is giving the AP platform too much payment authority without the controls finance and audit need.`,
  },
  {
    id: 'PAT-SRC-CAT-TMS-001',
    slug: 'treasury-management-system-sourcing',
    title: 'Treasury Management System and Treasury Workstation Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Treasury management sourcing should prove bank connectivity, cash visibility, payment controls, risk modules, implementation ownership, and liability boundaries before buyers accept real-time liquidity or AI forecast claims.',
    applicability:
      'Apply when sourcing Kyriba, Ripple Treasury/GTreasury, FIS Integrity, ION Wallstreet Suite, SAP Treasury and Risk Management, Oracle Treasury, TIS, Coupa Treasury, Nomentia, HighRadius Treasury, Trovata, or treasury workstations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.financialprofessionals.org/glossary/treasury-management-system',
      'https://www.kyriba.com/',
      'https://www.kyriba.com/legal-pages/kyriba-corp-terms-and-conditions-for-online-cloud-services/',
      'https://www.kyriba.com/legal-pages/kyriba-global-online-hosting-service-level-agreement/',
      'https://treasury.ripple.com/gtreasury-is-now-ripple-treasury',
      'https://www.gtreasury.com/company/security-addendum',
      'https://www.fisglobal.com/products/fis-treasury-and-risk-manager-integrity-edition',
      'https://iongroup.com/products/treasury/wallstreet-suite/',
      'https://www.sap.com/central-asia-caucasus/products/financial-management/treasury-risk-management.html',
      'https://www.oracle.com/a/ocom/docs/oracle-treasury-data-sheet.pdf',
      'https://tispayments.com/resources/get-to-know-tis/',
      'https://tispayments.com/newsroom/tis-successfully-completes-soc-1-2-iso-27001-recertification-audits/',
      'https://trovata.io/pricing/',
      'https://trovata.io/tos/',
      'https://assets.ey.com/content/dam/ey-sites/ey-com/en_gl/topics/assurance/assurance-pdfs/treasury-management-systems-overview.pdf',
      'https://www.deloitte.com/content/dam/assets-zone2/uk/en/docs/services/financial-advisory/2024/deloitte-uk-treasury-tech-report-updated.pdf',
    ],
    regulatoryChips: ['SOX-treasury-controls', 'payment-approval-controls', 'sanctions-screening-if-payments', 'hedge-accounting-review', 'data-residency-review'],
    relatedPatternIds: ['PAT-SRC-CAT-AP-001', 'PAT-SRC-CAT-PROCURE-001', 'PAT-SRC-CAT-FINOPS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Kyriba, Ripple Treasury/GTreasury, FIS Integrity, ION Wallstreet Suite, SAP Treasury and Risk Management, Oracle Treasury, TIS, Coupa Treasury, Nomentia, HighRadius Treasury, and Trovata',
        tier: 'enterprise',
        positioning: 'Treasury candidates spanning cash positioning, liquidity forecasting, bank connectivity, payments, bank account administration, FX and interest-rate risk, debt/investments, hedge accounting, audit, and reporting.',
        cautions: ['Validate named-bank connectivity, payment liability, implementation ownership, security evidence, and bank/account/module economics before accepting broad liquidity claims.'],
        sourceBasis: [
          { type: 'industry-consortium', label: 'AFP treasury management system glossary', url: 'https://www.financialprofessionals.org/glossary/treasury-management-system', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Kyriba cloud terms', url: 'https://www.kyriba.com/legal-pages/kyriba-corp-terms-and-conditions-for-online-cloud-services/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Trovata pricing/packages', url: 'https://trovata.io/pricing/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'TMS public pricing constructs only',
        model: 'hybrid',
        metric: 'Modules, authorized users, entities, affiliates, bank accounts, financial institutions, transaction/payment volume, connectivity/API volume, environments, regions, support, implementation, bank onboarding, market data, and managed services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Kyriba terms reference order schedules, SOWs, transaction-volume addenda, users, SLA, DPA, and AI terms', url: 'https://www.kyriba.com/legal-pages/kyriba-corp-terms-and-conditions-for-online-cloud-services/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Trovata pricing and terms expose bank/account/transaction/user constructs', url: 'https://trovata.io/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Named banks, account count, payment volume, ERP systems, bank formats, modules, and implementation SOW require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Public material supports commercial-meter mapping, not market-wide pricing, ROI, fraud reduction, forecast accuracy, or implementation-duration claims.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Bank connectivity and implementation acceptance',
        buyerPosition: 'Define named banks, accounts, countries, formats, API/SWIFT/host-to-host/EBICS responsibilities, testing scripts, cutover criteria, and failed-connectivity remedies.',
      },
      {
        clauseArea: 'Payment controls and liability',
        buyerPosition: 'Define approval thresholds, dual control, credential custody, authorized users, payment-file release, bank cutoffs, sanctions screening ownership, unauthorized-payment responsibility, and escalation rights.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Connectivity proof by named bank',
        whenToUse: 'Use when vendors claim broad bank coverage or real-time cash visibility.',
        buyerAsk: 'Require proof for each bank, account, geography, format, frequency, API/file method, implementation owner, pass-through fee, and support path.',
      },
      {
        lever: 'Phase treasury modules',
        whenToUse: 'Use when the buyer needs cash visibility quickly but risk, hedge accounting, payments, and debt modules create complexity.',
        buyerAsk: 'Launch cash visibility and bank connectivity first, with pre-priced options for payments, risk, debt, hedge accounting, and managed services after acceptance.',
      },
    ],
    riskFactors: [
      {
        id: 'tms-connectivity-overclaim',
        label: 'Bank connectivity overclaim',
        severity: 'high',
        detectionSignals: ['Vendor cites thousands of connections but cannot prove the buyer\'s named banks, account types, file formats, and cutover dates.'],
        mitigations: ['Run named-bank connectivity diligence and tie acceptance to actual data flow, reconciliation, and exception handling'],
      },
      {
        id: 'tms-payment-control-risk',
        label: 'Treasury payment control risk',
        severity: 'critical',
        detectionSignals: ['Payment module scope expands without dual control, credential custody, approval thresholds, bank cutoff, or liability terms.'],
        mitigations: ['Require maker-checker controls, audit logs, role validation, release controls, incident escalation, and liability allocation'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Review trading, funding, derivatives, pre-settlement, regulatory reporting, model risk, and deeper segregation-of-duties evidence.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Stress multi-currency cash, FX exposure, commodity risk adjacency, debt, hedge accounting, intercompany, and ERP integration.',
      },
      {
        industry: 'public_sector',
        modifier: 'Prioritize transparency, auditability, banking controls, segregation of duties, payment approvals, and record retention.',
      },
    ],
    body: `## Summary
Treasury management system sourcing is about controlled visibility and movement of enterprise cash. The buyer is not merely buying a dashboard. The event must prove bank connectivity, cash positioning, forecasting, payment controls, bank account administration, FX and interest-rate risk, debt and investments, hedge-accounting needs, ERP integration, security, auditability, and the operational line between treasury software, bank portals, payment rails, and ERP finance.

## When to apply
Use this pattern when sourcing Kyriba, Ripple Treasury/GTreasury, FIS Integrity, ION Wallstreet Suite, SAP Treasury and Risk Management, Oracle Treasury, TIS, Coupa Treasury, Nomentia, HighRadius Treasury, Trovata, or treasury workstations. Apply it during treasury centralization, multi-bank visibility gaps, payment-control remediation, cash forecasting weakness, ERP transformation, bank account rationalization, FX/debt risk programs, SOX treasury findings, or digital-asset treasury exploration. Do not use it for AP automation alone, procurement/spend management alone, retail bank treasury services, investment advisory, or payment rails without treasury workflow ownership.

## Category boundary
In scope: cash position, liquidity forecasting, bank connectivity, bank account administration, payments, payment factories, SWIFT/API/host-to-host/EBICS files, BAI2/BTRS reporting, FX exposure, interest-rate risk, debt, investments, hedge accounting, reconciliation, audit logs, treasury reporting, and integrations. Adjacent but distinct: ERP finance, AP automation, procurement, banking portals, payment processors, investment advisory, cash management bank services, and commodity trading platforms.

## Lifecycle and gates
The scope gate should inventory banks, accounts, countries, currencies, entities, payment volumes, file formats, ERP systems, current bank portals, signatory workflows, forecast owners, risk instruments, debt/investment scope, and control requirements. The RFP gate should require module pricing, named-bank connectivity proof, authorized-user rules, transaction/payment meters, implementation SOW, security evidence, SLA, DPA, payment liability terms, and exit. The proof gate should test cash import, account balance, forecast update, payment approval, rejected file, reconciliation, ERP journal, audit log, and export. The BAFO gate should normalize modules, users, entities, banks/accounts, payment volume, connectivity, environments, support, market data, bank fees, SWIFT fees, implementation, and managed services.

## Evaluation rubric
Weight bank connectivity around 25 percent, treasury process fit around 20 percent, payment controls/security around 20 percent, implementation/integration risk around 15 percent, commercial predictability around 10 percent, and risk/hedge-accounting fit around 10 percent. Increase payment-control weight when the platform releases payments rather than only reports cash.

## Pricing and contract notes
Public sources support construct-level pricing only. Kyriba public terms reference order schedules, SOWs, transaction-volume addenda, unique users, SLA, DPA, and AI terms. Trovata publicly exposes packaging around banks, accounts, transactions, and users. Treasury events should compare modules, bank accounts, financial institutions, entities, users, transaction volume, connectivity/API volume, environments, support, implementation, bank onboarding, market data, and managed services. Do not generalize vendor packaging into market benchmarks.

Contracting should define named-bank connectivity, file-format ownership, testing, cutover, support, payment liability, credential handling, customer data ownership, data export, termination assistance, security evidence, incident notice, DR, and AI/digital-asset addenda where relevant.

## Contradictions and failure modes
Vendor claim: connects to all banks. Detection: test named banks, accounts, formats, countries, frequencies, and exception handling. Vendor claim: real-time liquidity. Detection: inspect actual feed cadence, bank limitations, stale balances, forecast ownership, and ERP timing. Vendor claim: payment automation reduces risk. Detection: inspect dual control, credential custody, sanctions ownership, release controls, bank cutoffs, and liability.

The common failure is buying a treasury dashboard before solving bank connectivity and data ownership. The second is under-scoping implementation because bank files and ERP mappings look routine in demos. The third is letting payment or AI forecasting features outrun treasury policy, audit, and board-approved controls.`,
  },
  {
    id: 'PAT-SRC-CAT-HRTECH-001',
    slug: 'hr-technology-suite-hris-sourcing',
    title: 'HR Technology Suite, HRIS, and HCM-Adjacent Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'HR technology sourcing should prove employee-data governance, role security, payroll/time/talent boundaries, implementation readiness, and AI employment-decision controls before buyers accept suite consolidation claims.',
    applicability:
      'Apply when sourcing Workday HCM, SAP SuccessFactors, Oracle Fusion Cloud HCM, Dayforce, UKG Pro, ADP Workforce Now, Paycom, Paylocity, Paycor, Rippling, HiBob, or integrated HRIS/HCM suites.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.workday.com/en-us/products/human-capital-management/overview.html',
      'https://www.workday.com/en-us/legal/end-user-subscription-terms-and-conditions/agreement.html',
      'https://www.sap.com/products/hcm/what-is-human-capital-management.html',
      'https://assets.cdn.sap.com/agreements/product-use-and-support-terms/cls/en/sap-successfactors-hcm-suite-supplement-english-v4-2024.pdf',
      'https://www.oracle.com/human-capital-management/payroll/',
      'https://www.oracle.com/legal/privacy/services-previous-privacy-policy-080522/',
      'https://www.adp.com/what-we-offer/products/adp-workforce-now.aspx',
      'https://www.dayforce.com/why-dayforce/dayforce-suite',
      'https://www.ukg.com/products/ukg-pro-workforce-management',
      'https://www.paycom.com/software/',
      'https://www.paylocity.com/products/hr/',
      'https://nucleusresearch.com/news/nucleus-research-releases-2025-enterprise-human-capital-management-technology-value-matrix/',
      'https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada',
      'https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page',
      'https://www.dol.gov/index.php/newsroom/releases/osec/osec20241016',
    ],
    regulatoryChips: ['employee-PII-DPA-review', 'payroll-compliance-review', 'AI-employment-decision-review', 'data-residency-review', 'role-security-review'],
    relatedPatternIds: ['PAT-SRC-CAT-HCM-001', 'PAT-SRC-CAT-PAYROLL-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Workday HCM, SAP SuccessFactors, Oracle Fusion Cloud HCM, Dayforce, UKG Pro, ADP Workforce Now, Paycom, Paylocity, Paycor, Rippling, and HiBob',
        tier: 'enterprise',
        positioning: 'HR system-of-record and HCM-adjacent candidates spanning core HR, payroll, benefits, time, absence, scheduling, workforce management, recruiting, onboarding, performance, learning, compensation, analytics, employee experience, and HR service delivery.',
        cautions: ['Separate HRIS, payroll, time, talent, WFM, recruiting, employee experience, and AI employment-decision scope before accepting suite consolidation economics.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday HCM overview', url: 'https://www.workday.com/en-us/products/human-capital-management/overview.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'SAP HCM overview', url: 'https://www.sap.com/products/hcm/what-is-human-capital-management.html', asOf: '2026-04-29' },
          { type: 'trade-publication', label: 'Nucleus Research 2025 Enterprise HCM value matrix announcement', url: 'https://nucleusresearch.com/news/nucleus-research-releases-2025-enterprise-human-capital-management-technology-value-matrix/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'HR technology public pricing constructs only',
        model: 'hybrid',
        metric: 'Employees, active workers, worker profiles, authorized users, access rights, modules, tenants, storage, messages, transactions, integrations, country packs, implementation, migration, security, payroll localization, support, and seasonal worker handling',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Workday public agreement references access-rights-based fees unless order form says otherwise', url: 'https://www.workday.com/en-us/legal/end-user-subscription-terms-and-conditions/agreement.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'SAP SuccessFactors supplemental terms and user metric language', url: 'https://assets.cdn.sap.com/agreements/product-use-and-support-terms/cls/en/sap-successfactors-hcm-suite-supplement-english-v4-2024.pdf', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Employee counts, seasonal workers, module rollout plan, payroll countries, integrations, and migration scope require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Enterprise HCM pricing is generally quote-based. Use public terms for meter normalization, not invented prices, savings, or consolidation benchmarks.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Employee data privacy and portability',
        buyerPosition: 'Require DPA, subprocessor notice, cross-border transfer terms, breach notice, audit evidence, and export of employee, job, org, payroll, benefits, performance, audit, attachment, and configuration data.',
      },
      {
        clauseArea: 'AI employment decision governance',
        buyerPosition: 'Require AI feature disclosure, opt-out/disable rights where feasible, bias-audit support, explainability artifacts, accommodation workflow, human review, and customer deployment controls.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Phased module ramp',
        whenToUse: 'Use when the buyer wants suite consolidation but rollout readiness varies by module or country.',
        buyerAsk: 'Align license starts to go-live by module/country and price core HR, payroll, time, talent, learning, compensation, analytics, and WFM separately.',
      },
      {
        lever: 'Shelfware and seasonal worker protection',
        whenToUse: 'Use where employee counts fluctuate or full-suite access rights exceed actual rollout.',
        buyerAsk: 'Negotiate ramp schedules, delayed starts, true-down rights, inactive-worker exclusions, seasonal-worker treatment, and expansion bands.',
      },
    ],
    riskFactors: [
      {
        id: 'hrtech-ai-employment-risk',
        label: 'AI employment-decision exposure',
        severity: 'critical',
        detectionSignals: ['Recruiting, assessment, performance, scheduling, or talent tools use AI without legal review, bias audit, accommodation path, or human oversight.'],
        mitigations: ['Require EEOC/ADA and local AEDT review, audit support, explainability, opt-out controls, and human decision accountability'],
      },
      {
        id: 'hrtech-payroll-cutover-risk',
        label: 'Payroll and HRIS cutover risk',
        severity: 'high',
        detectionSignals: ['Migration plan lacks parallel payroll, role validation, historical data reconciliation, integration cutover, or hypercare criteria.'],
        mitigations: ['Tie implementation acceptance to parallel-run success, security role testing, integration proof, migration reconciliation, and issue burn-down'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Stress scheduling, credentialing, union rules, float pools, shift differentials, overtime, and 24/7 operations.',
      },
      {
        industry: 'retail_cpg',
        modifier: 'Review high-volume hourly labor, seasonal scaling, mobile time/absence, shift swaps, multi-state wage rules, and store hierarchy.',
      },
      {
        industry: 'financial_services',
        modifier: 'Emphasize role controls, audit logs, regulated compensation, identity governance, background checks, and data residency.',
      },
    ],
    body: `## Summary
HR technology suite sourcing is a system-of-record decision for people data and workforce operations. The buyer is not simply consolidating SaaS tools. The event must prove employee-data governance, role security, payroll and time boundaries, talent workflows, implementation readiness, integration into identity/finance/IT, and controls for AI that may affect candidates or employees.

## When to apply
Use this pattern when sourcing Workday HCM, SAP SuccessFactors, Oracle Fusion Cloud HCM, Dayforce, UKG Pro, ADP Workforce Now, Paycom, Paylocity, Paycor, Rippling, HiBob, or integrated HRIS/HCM suites. Apply it during HRIS replacement, payroll/time modernization, talent-suite consolidation, employee-experience programs, global expansion, manager self-service redesign, workforce analytics programs, or AI recruiting/talent pilots. Do not use it for a narrow ATS, learning tool, benefits broker, EOR, contractor platform, or payroll-only event unless HRIS/HCM data flows and employee-system governance are central.

## Category boundary
In scope: core HR, employee profile, org/job data, payroll adjacency, benefits, time, absence, scheduling, workforce management, recruiting, onboarding, performance, learning, compensation, workforce analytics, employee experience, HR service delivery, case management, integrations, role security, mobile access, and AI features. Adjacent but distinct: payroll-only, EOR/PEO, contractor management, immigration, equity administration, expense, identity governance, and point recruiting or learning tools.

## Lifecycle and gates
The scope gate should inventory employees, worker types, locations, unions, payroll countries, time rules, benefits, existing HRIS, ATS, WFM, LMS, IAM, finance, integrations, data quality, role model, and AI employment-decision exposure. The RFP gate should require module pricing, access-right rules, employee/worker profile metrics, data ownership, DPA, subprocessors, security reports, AI controls, payroll responsibilities, implementation approach, migration, integration, support, and export. The proof gate should run hire, transfer, manager change, leave, payroll handoff, time approval, recruiting, performance, role change, reporting, export, and AI-control scripts. The BAFO gate should normalize users, employees, modules, tenants, countries, transactions, integrations, migration, support, implementation, and renewal uplift.

## Evaluation rubric
Weight data governance and security around 25 percent, HR/payroll/time process fit around 25 percent, implementation and migration around 20 percent, integration fit around 15 percent, AI/legal controls around 10 percent, and commercial predictability around 5 percent. Increase AI/legal weight for recruiting, assessment, scheduling, performance, or talent recommendations.

## Pricing and contract notes
Public sources support constructs, not benchmark prices. Workday public agreement language ties fees to access rights acquired unless the order form says otherwise. SAP SuccessFactors supplemental terms define usage metrics such as unique active user profiles. HR technology quotes commonly turn on employees, active workers, authorized users, worker profiles, modules, tenants, transactions, storage, integrations, country/payroll packs, implementation, migration, security, and support. Treat analyst and vendor positioning as source context, not proof of savings.

Contracting should define customer data ownership, DPA, subprocessors, cross-border transfers, breach notice, audit evidence, role/security controls, AI feature disclosure, bias-audit support, payroll compliance responsibilities, implementation acceptance, data export, deletion, transition, renewal controls, and shelfware protections.

## Contradictions and failure modes
Vendor claim: one HR suite reduces complexity. Detection: map modules, countries, role security, integrations, payroll/time rules, migration, and decommission plan. Vendor claim: AI improves hiring or talent decisions. Detection: require legal review, bias-audit support, accommodation path, explainability, and human decision accountability. Vendor claim: pricing follows headcount. Detection: inspect access rights, active profiles, worker types, seasonal workers, modules, country packs, and implementation costs.

The common failure is buying a suite before HR data, roles, and process ownership are clean. The second is treating payroll/time as a simple module when local rules and cutover risk are high. The third is allowing AI employment-decision features into production before legal, HR, and compliance have accepted the control model.`,
  },
  {
    id: 'PAT-SRC-CAT-PAYROLL-001',
    slug: 'payroll-global-payroll-eor-adjacent-sourcing',
    title: 'Payroll, Global Payroll, and EOR-Adjacent Payroll Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Payroll sourcing should separate employer obligations, global payroll, managed payroll, EOR adjacency, data controls, and payment/tax liability before buyers accept compliance or country-coverage claims.',
    applicability:
      'Apply when sourcing ADP, Workday payroll partners, Dayforce, CloudPay, Alight, Neeyamo, Safeguard Global, TMF Group, Ramco, Payslip, Deel, Remote, Papaya Global, Rippling, Oyster, Multiplier, G-P, Velocity Global, Atlas, or Mercans.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.adp.com/-/media/PDF/ADP-Global-Payroll-GeoFootprint.ashx?la=en',
      'https://www.workday.com/en-us/company/partners/global-payroll-partners.html',
      'https://www.dayforce.com/how-we-help/dayforce/pay-accurately-and-efficiently/global-payroll',
      'https://www.cloudpay.com/lp/payroll/',
      'https://www.deel.com/pricing/',
      'https://remote.com/pricing',
      'https://www.papayaglobal.com/pricing/',
      'https://www.rippling.com/products/global/global-payroll-and-hiring',
      'https://www.oysterhr.com/pricing',
      'https://www.usemultiplier.com/pricing',
      'https://payroll.org/vendors/buyers-guides',
      'https://cms-prod.payroll.org/docs/default-source/buyers-guides/25h-Global-Payroll-eor-dir.pdf',
      'https://www.edpb.europa.eu/sme-data-protection-guide/data-controller-data-processor_en',
      'https://www.irs.gov/businesses/small-businesses-self-employed/understanding-employment-taxes',
      'https://www.dol.gov/general/topic/wages/wagesrecordkeeping',
      'https://www.irs.gov/newsroom/worker-classification-101-employee-or-independent-contractor',
      'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/employment-practices-and-data-protection-keeping-employment-records/',
    ],
    regulatoryChips: ['payroll-tax-review', 'worker-classification-review', 'wage-hour-recordkeeping', 'GDPR-employee-data-review', 'EOR-local-law-review'],
    relatedPatternIds: ['PAT-SRC-CAT-HRTECH-001', 'PAT-SRC-CAT-HCM-001', 'PAT-SRC-CAT-WFM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'ADP, Workday global payroll partners, Dayforce, CloudPay, Alight, Neeyamo, Safeguard Global, TMF Group, Ramco, Payslip, Deel, Remote, Papaya Global, Rippling, Oyster, Multiplier, G-P, Velocity Global, Atlas, and Mercans',
        tier: 'enterprise',
        positioning: 'Domestic payroll, global payroll, managed payroll, payroll aggregator, payment, and EOR-adjacent candidates spanning gross-to-net, tax filing/remittance, payslips, statutory reporting, payroll calendars, and payroll support.',
        cautions: ['Separate global payroll from EOR/PEO/contractor management and validate country coverage, local partner use, liability allocation, and employer obligations.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Remote pricing distinguishes global payroll from EOR by legal-entity need', url: 'https://remote.com/pricing', asOf: '2026-04-29' },
          { type: 'industry-consortium', label: 'PayrollOrg buyer guides and global payroll/EOR directory', url: 'https://payroll.org/vendors/buyers-guides', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'IRS employment tax obligations', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/understanding-employment-taxes', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Payroll public pricing constructs only',
        model: 'hybrid',
        metric: 'Per employee per month, per contractor per month, per transaction, entity/country setup, implementation, managed service, payment processing, FX, off-cycle payroll, year-end, integration/API, support tier, deposits, and minimum commitments',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Remote pricing distinguishes EOR and global payroll constructs', url: 'https://remote.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Deel public pricing modules', url: 'https://www.deel.com/pricing/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Country list, active employees, payroll frequency, legal entities, local providers, EOR need, payment methods, and implementation scope require buyer evidence' },
        ],
        confidence: 0.57,
        notes: 'Vendor starting prices may be cited as vendor-published reference points, not category benchmarks or landed cost.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Country payroll scope and liability matrix',
        buyerPosition: 'Define countries, entities, worker types, payroll frequency, tax filings, statutory reports, benefits deductions, year-end obligations, approval cutoffs, and liability for penalties, interest, late filings, and local-provider errors.',
      },
      {
        clauseArea: 'Payroll data processing and exit',
        buyerPosition: 'Require controller/processor roles, subprocessors, breach notice, cross-border transfer terms, data return/deletion, historical payroll export, parallel-run support, and replacement-vendor cooperation.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Payroll versus EOR decomposition',
        whenToUse: 'Use when vendors bundle global payroll, EOR, contractor, and HR modules.',
        buyerAsk: 'Separate global payroll for buyer-owned entities from EOR countries, contractor management, PEO, benefits, HRIS, and implementation line items.',
      },
      {
        lever: 'Parallel-run acceptance',
        whenToUse: 'Use before cutover in any payroll replacement or multi-country rollout.',
        buyerAsk: 'Tie go-live and milestone payments to successful parallel payroll, statutory filing checks, GL/journal exports, support response, and exception burn-down.',
      },
    ],
    riskFactors: [
      {
        id: 'payroll-compliance-overclaim',
        label: 'Global payroll compliance overclaim',
        severity: 'critical',
        detectionSignals: ['Vendor says global payroll guarantees compliance without country scope, local-provider disclosure, liability terms, or buyer data obligations.'],
        mitigations: ['Require country-by-country scope, statutory responsibility matrix, liability allocation, compliance-change process, and buyer RACI'],
      },
      {
        id: 'payroll-cutover-data-risk',
        label: 'Payroll cutover data risk',
        severity: 'high',
        detectionSignals: ['Cutover plan lacks historical data reconciliation, parallel run, payroll calendar mapping, payment testing, or employee support process.'],
        mitigations: ['Mandate parallel run, reconciliation, payroll calendar proof, payment test, audit-log export, and hypercare exit criteria'],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier: 'Stress hourly workers, tips, shift premiums, minors, seasonal spikes, local wage rules, and high-volume support.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review shift differentials, union rules, credential pay, overtime complexity, 24/7 operations, and emergency staffing.',
      },
      {
        industry: 'financial_services',
        modifier: 'Require stronger audit, access controls, segregation of duties, data residency, regulated compensation, and reporting controls.',
      },
    ],
    body: `## Summary
Payroll sourcing is a high-liability operating decision, not just a pay engine. The buyer is deciding how wages, taxes, statutory filings, deductions, payments, payslips, calendars, worker classifications, and employee support will be controlled across countries and worker types. Global payroll, managed payroll, EOR, PEO, contractor management, HRIS, and time systems overlap, but they do not carry the same employer obligations.

## When to apply
Use this pattern when sourcing ADP, Workday payroll partners, Dayforce, CloudPay, Alight, Neeyamo, Safeguard Global, TMF Group, Ramco, Payslip, Deel, Remote, Papaya Global, Rippling, Oyster, Multiplier, G-P, Velocity Global, Atlas, or Mercans. Apply it during payroll replacement, global expansion, country consolidation, EOR-to-entity transition, HRIS integration, payroll-error remediation, statutory filing issues, employee support concerns, or multi-currency payroll payment programs. Do not use it for benefits-only, time-only, HRIS-only, contractor-only, immigration-only, or expense events unless payroll compliance and payment are central.

## Category boundary
In scope: domestic payroll, global payroll, managed payroll, payroll tax filing/remittance, gross-to-net calculation, payslips, statutory reports, payroll payments, payroll calendars, off-cycle payroll, year-end filings, payroll support, payroll journal/GL exports, local provider management, and payroll data integrations. Adjacent but distinct: EOR, PEO, contractor management, benefits administration, time/attendance, HRIS, immigration, equity, recruiting, and expense.

## Lifecycle and gates
The scope gate should inventory countries, legal entities, worker types, active employees, payroll frequencies, pay calendars, benefits deductions, statutory filings, local providers, HRIS/time systems, GL/journal requirements, bank/payment methods, support model, and EOR needs. The RFP gate should require country scope, local provider disclosure, pricing by employee/country/entity/transaction, DPA, subprocessors, tax responsibility matrix, payroll deadlines, SLA, liability terms, implementation, and exit. The proof gate should run parallel payroll, late change, off-cycle, termination, statutory filing, payslip, GL export, payment failure, support ticket, and data export. The BAFO gate should normalize platform fees, payroll service fees, statutory employer costs, benefits, payment fees, FX, local provider fees, deposits, implementation, year-end, offboarding, and support add-ons.

## Evaluation rubric
Weight compliance/liability around 25 percent, country coverage and local provider model around 20 percent, payroll accuracy and support around 20 percent, integration and data controls around 15 percent, implementation/cutover around 15 percent, and commercial predictability around 5 percent. Increase liability weight for EOR-adjacent scope or countries with complex local filings.

## Pricing and contract notes
Public sources support construct-level analysis. Remote publicly distinguishes global payroll for organizations with foreign legal entities from EOR for countries where the company lacks an entity. Deel, Remote, Papaya, Oyster, and Multiplier publish module/pricing pages, but starting prices should remain vendor-published reference points rather than benchmarks. Payroll economics depend on active employees, contractors, countries, entities, payroll runs, payments, FX, statutory filings, local providers, setup, implementation, support, and minimum commitments.

Contracting should define country scope, legal entities, worker types, payroll calendars, input deadlines, validation duties, filing/remittance ownership, data processing, breach notice, cross-border transfers, liability for penalties and payment failures, compliance-change management, audit logs, parallel-run support, historical records, and transition assistance.

## Contradictions and failure modes
Vendor claim: global payroll guarantees compliance. Detection: require country-by-country scope, local-provider disclosure, liability terms, statutory RACI, and buyer data obligations. Vendor claim: EOR eliminates employment risk. Detection: inspect local law, contract allocation, worker classification, intellectual property, benefits, termination, and tax responsibility. Vendor claim: one platform covers every country. Detection: verify native coverage, partner coverage, subprocessors, service levels, and exit paths by country.

The common failure is treating payroll as routine software when a small configuration defect can mispay employees or miss statutory filings. The second is confusing global payroll with EOR. The third is skipping parallel runs, support design, and historical data export until the cutover is already at risk.`,
  },


  {
    id: 'PAT-SRC-CAT-WFM-001',
    slug: 'workforce-management-scheduling-time-sourcing',
    title: 'Workforce Management, Scheduling, and Time Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Workforce management sourcing should prove labor-rule configuration, schedule fairness, timekeeping accuracy, payroll handoff, and local compliance before buyers accept AI forecasting or labor-optimization claims.',
    applicability:
      'Apply when sourcing UKG, Workday Workforce Management, ADP WorkForce Suite, Dayforce, Legion, Deputy, Quinyx, Workforce.com, TCP, When I Work, or comparable WFM, time, attendance, absence, scheduling, and labor forecasting platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.ukg.com/workforce-management',
      'https://www.ukg.com/products/ukg-pro-workforce-management',
      'https://www.workday.com/en-us/products/human-capital-management/payroll-workforce-management.html',
      'https://www.adp.com/wfm',
      'https://workforcesoftware.com/workforce-suite/',
      'https://www.dayforce.com/how-we-help/dayforce/agile-workforce-management/scheduling',
      'https://legion.co/products/schedule-optimization/',
      'https://www.deputy.com/features/',
      'https://workforcesoftware.com/workforce-suite/compliance/',
      'https://www.dol.gov/agencies/whd/flsa',
    ],
    regulatoryChips: ['wage-hour-review', 'fair-workweek-review', 'union-rule-review', 'payroll-integration-review', 'employee-data-privacy-review'],
    relatedPatternIds: ['PAT-SRC-CAT-HRTECH-001', 'PAT-SRC-CAT-PAYROLL-001', 'PAT-SRC-CAT-HCM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'UKG, Workday Workforce Management, ADP WorkForce Suite, Dayforce, Legion, Deputy, Quinyx, Workforce.com, TCP, and When I Work',
        tier: 'enterprise',
        positioning: 'Suite and specialist WFM candidates spanning time, attendance, absence, scheduling, labor forecasting, employee self-service, communications, and payroll handoff.',
        cautions: ['Validate labor rules, union rules, fair-workweek constraints, payroll exports, device model, mobile consent, and frontline adoption before treating AI scheduling as accepted value.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'UKG workforce management product page', url: 'https://www.ukg.com/workforce-management', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Workday workforce management software page', url: 'https://www.workday.com/en-us/products/human-capital-management/payroll-workforce-management.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ADP Workforce Management page', url: 'https://www.adp.com/wfm', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'WFM pricing constructs only',
        model: 'hybrid',
        metric: 'Per employee, per active worker, module, location, clock/device, scheduling user, integration, implementation, support, managed service, analytics, and country or rule-pack scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Deputy public feature and product packaging pages', url: 'https://www.deputy.com/features/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Employee counts, hourly populations, locations, union rules, payroll systems, clocks, forecast drivers, and implementation scope require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Do not infer category pricing from vendor marketing. Keep numeric benchmarks blank unless buyer quotes, invoices, or approved benchmark data exist.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Labor-rule configuration and payroll handoff',
        buyerPosition: 'Define pay rules, scheduling rules, break rules, overtime, premiums, union agreements, approval workflows, payroll export obligations, testing evidence, change-control process, and liability allocation for configuration errors.',
      },
      {
        clauseArea: 'Employee data, mobile, and device controls',
        buyerPosition: 'Require DPA, subprocessors, device/location capture rules, biometric or clock consent review where applicable, role-based access, audit logs, export, deletion, and transition assistance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Rule-complexity proof before BAFO',
        whenToUse: 'Use when the buyer has multi-state, multi-country, union, healthcare, retail, manufacturing, or 24/7 scheduling complexity.',
        buyerAsk: 'Require scripted configuration proof for overtime, breaks, shift swaps, premiums, union rules, absences, holidays, fatigue rules, payroll export, and retro corrections.',
      },
      {
        lever: 'Module and population decomposition',
        whenToUse: 'Use when the quote bundles core HR, time, scheduling, absence, forecasting, communications, analytics, and managed services.',
        buyerAsk: 'Separate active workers, managers, schedulers, locations, clocks, modules, integrations, implementation services, support, and managed-service fees.',
      },
    ],
    riskFactors: [
      {
        id: 'wfm-labor-rule-misconfiguration',
        label: 'Labor-rule misconfiguration',
        severity: 'critical',
        detectionSignals: ['Vendor cannot demonstrate buyer-specific overtime, break, meal, union, premium, fair-workweek, or payroll export scenarios.'],
        mitigations: ['Use scripted payroll/time scenarios, require parallel runs, lock acceptance criteria, and assign liability for configuration defects'],
      },
      {
        id: 'wfm-ai-scheduling-overclaim',
        label: 'AI scheduling overclaim',
        severity: 'high',
        detectionSignals: ['Forecasting or schedule optimization claims lack explainability, manager override, fairness review, or actual demand-driver testing.'],
        mitigations: ['Require forecast-driver transparency, override logs, fairness controls, compliance checks, and buyer-owned KPI measurement'],
      },
    ],
    industryVariants: [
      {
        industry: 'retail_cpg',
        modifier: 'Stress fair-workweek exposure, location hierarchy, store traffic, shift swaps, minors, seasonal hiring, and mobile adoption.',
      },
      {
        industry: 'healthcare',
        modifier: 'Stress credentialing, float pools, fatigue, overtime, union rules, critical staffing ratios, and 24/7 scheduling continuity.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Stress shift patterns, line staffing, safety credentials, job costing, union agreements, attendance points, and payroll premiums.',
      },
    ],
    body: `## Summary
Workforce management sourcing sits at the seam between people operations, labor cost, compliance, and payroll. The buyer is not only selecting a scheduling tool. The platform may determine how hours are captured, how shifts are assigned, how overtime and premiums are calculated, how absences are approved, how managers react to demand forecasts, and what evidence exists when payroll or wage-hour disputes occur.

## When to apply
Use this pattern when sourcing UKG, Workday Workforce Management, ADP WorkForce Suite, Dayforce, Legion, Deputy, Quinyx, Workforce.com, TCP, When I Work, or comparable time, attendance, scheduling, absence, labor forecasting, and frontline workforce platforms. Apply it during time-clock replacement, scheduling modernization, payroll integration, store or plant labor optimization, healthcare staffing improvement, union-rule configuration, multi-state compliance remediation, or HCM-suite consolidation. Do not use it as the primary pattern for HRIS, payroll, recruiting, learning, benefits, or employee communications unless time, scheduling, and payroll handoff are central to the sourcing event.

## Category boundary
In scope: time and attendance, employee scheduling, shift swaps, absence, leave handoff, labor forecasting, demand scheduling, overtime and premium rules, break and meal rules, union and local agreements, manager approvals, mobile self-service, time clocks, biometric or badge devices, payroll export, job and cost-center coding, analytics, workforce communications, and managed WFM support. Adjacent but distinct: core HR, payroll tax, benefits, EOR, contractor management, learning, performance, and standalone collaboration tools.

## Lifecycle and gates
The scope gate should inventory hourly and salaried populations, locations, countries, payroll systems, HCM systems, clocks and devices, union agreements, break rules, overtime rules, shift premiums, minors, predictive scheduling exposure, job costing, absence processes, and manager approval paths. The RFP gate should require rule configuration evidence, device model, mobile access model, DPA, subprocessors, audit logs, integrations, implementation approach, support model, and export rights. The proof gate should run buyer-authored scenarios for shift creation, swap, missed punch, retro correction, holiday premium, overtime, meal break, union premium, absence, payroll export, and manager override. The BAFO gate should normalize active workers, schedulers, managers, locations, clocks, modules, integrations, implementation, support, managed services, analytics, and renewal controls.

## Evaluation rubric
Weight labor-rule and payroll accuracy around 25 percent, scheduling and forecasting fit around 20 percent, compliance and auditability around 20 percent, frontline usability around 15 percent, integration and data governance around 10 percent, and commercial predictability around 10 percent. Increase compliance weight when fair-workweek rules, union agreements, minors, healthcare staffing, public-sector rules, or multi-country labor laws are in scope.

## Pricing and contract notes
Public sources support feature scope, not reliable category pricing. UKG, Workday, ADP, Dayforce, Legion, and Deputy describe constructs such as time tracking, scheduling, labor forecasting, compliance support, analytics, mobile access, and payroll handoff. Those descriptions do not prove net price, implementation duration, labor savings, forecast accuracy, overtime reduction, or compliance risk reduction for a specific buyer. Keep numeric benchmark fields blank unless AbarVa has buyer quotes, invoices, implementation SOWs, or approved benchmark data.

Contracting should define pay-rule configuration responsibilities, testing evidence, acceptance criteria, payroll export obligations, parallel-run support, correction handling, support response, audit logs, mobile and device data controls, biometric or geolocation review where applicable, security attestations, data export, deletion, transition assistance, renewal uplift, and module substitution rights.

## Contradictions and failure modes
Vendor claim: AI scheduling reduces labor cost. Detection: require actual demand drivers, forecast transparency, manager override, fairness review, and buyer-owned KPI measurement. Vendor claim: compliance is automated. Detection: require jurisdiction, union, rule-change, testing, and liability evidence. Vendor claim: payroll integration is standard. Detection: prove earnings codes, job costing, retro corrections, premiums, holidays, and approval cutoffs in a parallel run.

The common failure is selecting a polished scheduling experience while leaving the hardest pay and labor rules to implementation. The second is accepting AI forecasting claims without understanding what data drives the forecast or how managers can override it. The third is underestimating frontline adoption: if employees, managers, unions, and payroll teams do not trust the schedule and time record, the system will be bypassed or corrected manually.`
  },
  {
    id: 'PAT-SRC-CAT-PSA-001',
    slug: 'professional-services-automation-sourcing',
    title: 'Professional Services Automation Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'PSA sourcing should be governed as the operating system for services margin, utilization, delivery risk, billing, revenue forecasting, and CRM-to-finance handoff, not as generic project management software.',
    applicability:
      'Apply when sourcing Kantata, Certinia, NetSuite OpenAir, Workday PSA, BigTime, Accelo, ConnectWise, Autotask, Rocketlane, FinancialForce-era PSA estates, or integrated services automation platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.kantata.com/hosted-services-specifications',
      'https://www.kantata.com/ps-cloud/financial-management-software/revenue-recognition',
      'https://certinia.com/professional-services-cloud/automation/',
      'https://certinia.com/professional-services-cloud/',
      'https://help.certinia.com/main/2022.3/Subsystems/PSA/Content/topics/GettingStarted/GettingStarted.htm',
      'https://help.certinia.com/main/2023.1/Content/SRP/Overview.htm',
      'https://www.bigtime.net/pricing',
      'https://get.kantata.com/rs/677-LEJ-696/images/2025-ps-maturity-benchmark.pdf',
    ],
    regulatoryChips: ['revenue-recognition-review', 'project-accounting-review', 'DCAA-if-government-contractor', 'employee-data-privacy-review'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-AP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Kantata, Certinia, NetSuite OpenAir, Workday PSA, BigTime, Accelo, ConnectWise, Autotask, Rocketlane, and services modules in ERP/CRM suites',
        tier: 'enterprise',
        positioning: 'PSA and services automation candidates spanning opportunity-to-project conversion, resource planning, project delivery, time and expense, billing, revenue forecasts, and project accounting integration.',
        cautions: ['Separate delivery-project management from financial controls, resource governance, rate cards, billing, revenue recognition, and CRM/accounting integration.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Kantata hosted services specifications', url: 'https://www.kantata.com/hosted-services-specifications', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Certinia PSA overview', url: 'https://certinia.com/professional-services-cloud/automation/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'BigTime public pricing/package page', url: 'https://www.bigtime.net/pricing', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'PSA pricing constructs only',
        model: 'subscription',
        metric: 'Named users, light time-entry users, resource managers, project managers, billing users, modules, entities, integrations, data migration, implementation, reporting, support, and sandbox or environment scope',
        sourceBasis: [
          { type: 'public-disclosure', label: 'BigTime package and feature page', url: 'https://www.bigtime.net/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Billable headcount, delivery model, rate cards, accounting system, CRM, entities, currencies, and implementation scope require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Vendor public pages can orient modules and packaging, but net subscription cost, services cost, and ROI claims require buyer-specific evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Services financial controls',
        buyerPosition: 'Define rate-card ownership, billing rules, revenue forecast treatment, project accounting handoff, approval controls, audit logs, and acceptance criteria for opportunity-to-project and project-to-invoice scenarios.',
      },
      {
        clauseArea: 'Data migration and exit',
        buyerPosition: 'Require export of projects, assignments, time, expenses, rate cards, budgets, forecasts, invoices, resource records, and audit history in usable formats with transition assistance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Role-based license decomposition',
        whenToUse: 'Use when the vendor prices all participants as full PSA users.',
        buyerAsk: 'Separate time-entry, expense-entry, resource-manager, project-manager, finance, executive, integration, client-portal, and admin access rights.',
      },
      {
        lever: 'Billing and revenue proof',
        whenToUse: 'Use before BAFO when fixed-fee, T&M, milestone, retainer, subscription services, or multi-currency billing are material.',
        buyerAsk: 'Run scripted proof from opportunity through project, assignment, time, expense, revenue forecast, invoice, accounting export, and credit or adjustment.',
      },
    ],
    riskFactors: [
      {
        id: 'psa-finance-delivery-mismatch',
        label: 'Delivery workflow does not reconcile to finance',
        severity: 'high',
        detectionSignals: ['Demo shows tasks and resource plans but not rate cards, billing events, revenue forecasts, invoices, or accounting integration.'],
        mitigations: ['Require quote-to-project-to-invoice proof, finance signoff, and acceptance criteria tied to real billing scenarios'],
      },
      {
        id: 'psa-utilization-data-quality',
        label: 'Utilization and capacity data quality risk',
        severity: 'medium',
        detectionSignals: ['Resource skills, availability, assignments, time entry, and forecast data are incomplete or owned by different systems.'],
        mitigations: ['Define resource master, skills taxonomy, assignment governance, data stewardship, and reporting acceptance tests'],
      },
    ],
    industryVariants: [
      {
        industry: 'public_sector',
        modifier: 'Review DCAA, contract cost accounting, labor categories, timesheet controls, auditability, and invoice evidence when government contracting is in scope.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress implementation services, customer success handoff, subscription services, partner delivery, CRM integration, and revenue forecast governance.',
      },
      {
        industry: 'cross_industry',
        modifier: 'For consulting, audit, legal, engineering, and agency models, tune the proof around rate cards, utilization, project accounting, billing, and margin reporting.',
      },
    ],
    body: `## Summary
Professional Services Automation is the operating system for services delivery economics. It connects sales opportunities, project setup, resource requests, staffing, skills, utilization, time, expenses, budgets, billing, revenue forecasting, project accounting, and customer delivery evidence. A PSA sourcing event should therefore test whether the buyer can run the business of services through the platform, not whether teams can manage tasks.

## When to apply
Use this pattern when sourcing Kantata, Certinia, NetSuite OpenAir, Workday PSA, BigTime, Accelo, ConnectWise, Autotask, Rocketlane, or services automation modules in ERP and CRM suites. Apply it during consulting-operations modernization, implementation-services scaling, resource-management redesign, project-accounting cleanup, quote-to-project automation, time-and-billing replacement, post-acquisition consolidation, or services-margin improvement. Do not use it for generic project management, agile delivery, ITSM, legal matter management, or field-service events unless services financial operations and resource economics are central.

## Category boundary
In scope: opportunity-to-project conversion, project templates, work breakdown structures, resource requests, skills and availability, utilization targets, time and expense, billing rules, fixed-fee and time-and-materials support, milestone billing, project budgets, estimate-to-complete, estimate-at-completion, revenue forecast, invoicing handoff, accounting integration, CRM integration, client portals, dashboards, and reporting. Adjacent but distinct: ERP general ledger, CRM pipeline management, HRIS, payroll, expense reimbursement, agile engineering planning, ticketing, and standalone collaboration tools.

## Lifecycle and gates
The scope gate should inventory services lines, billable headcount, resource pools, rate cards, delivery methods, project types, entities, currencies, CRM, ERP/accounting, billing models, approval paths, revenue recognition needs, DCAA or public-sector requirements, and migration sources. The RFP gate should require role-based licensing, data model, API/integration model, security, DPA, reporting, implementation approach, migration scope, and exit rights. The proof gate should run opportunity-to-project, staffing, time entry, expense, fixed-fee billing, T&M billing, milestone billing, forecast update, invoice export, project adjustment, and resource-capacity scenarios. The BAFO gate should normalize licenses by role, modules, client portals, integrations, data migration, implementation, reporting, support, sandboxes, and renewal controls.

## Evaluation rubric
Weight services financial controls around 25 percent, resource management and utilization around 20 percent, billing and accounting integration around 20 percent, delivery workflow fit around 15 percent, reporting and forecast quality around 10 percent, and commercial predictability around 10 percent. Increase financial-control weight when project accounting, multi-entity billing, public-sector contracting, or revenue-recognition governance is in scope.

## Pricing and contract notes
Public vendor material supports feature and package orientation. Kantata describes PSA functionality across project management, accounting integration, time and expense, resource allocation, portfolio performance, risk, and profitability. Certinia describes Salesforce-native PSA and services financial workflows. BigTime publishes package constructs for time, expense, billing, invoicing, project portfolio, rate management, reports, integrations, and DCAA-related features. These public references do not prove buyer-specific subscription cost, implementation effort, utilization lift, margin improvement, invoice-cycle reduction, or payback.

Contracting should define license roles, rate-card ownership, project and resource data ownership, billing-rule configuration, revenue forecast treatment, accounting handoff, audit logs, implementation acceptance, migration completeness, support response, API access, export rights, transition assistance, renewal uplift, and rights to reduce or reassign users as delivery headcount changes.

## Contradictions and failure modes
Vendor claim: PSA improves utilization. Detection: require the resource master, skills taxonomy, assignment process, utilization formula, manager accountability, and data-quality plan. Vendor claim: billing is automated. Detection: prove fixed fee, T&M, milestone, retainer, expense, adjustment, credit, invoice, and accounting export flows. Vendor claim: CRM-native or ERP-native architecture removes integration risk. Detection: map objects, permissions, IDs, rate cards, billing events, and reporting ownership.

The common failure is buying project visibility but leaving finance to reconcile invoices manually. The second is treating utilization reporting as a software feature when it depends on clean assignments, time entry, skills, availability, and business rules. The third is under-scoping migration: historical projects, rates, time, expenses, budgets, resource records, and billing evidence often matter long after go-live.`
  },
  {
    id: 'PAT-SRC-CAT-CPQ-001',
    slug: 'configure-price-quote-sourcing',
    title: 'Configure, Price, Quote Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'CPQ sourcing should prove product-model governance, pricing-rule control, quote approval, contract handoff, order integration, and renewal/amendment behavior before buyers accept faster-quote or margin claims.',
    applicability:
      'Apply when sourcing Salesforce Revenue Cloud or CPQ, Oracle CPQ, Conga CPQ, PROS Smart CPQ, DealHub, SAP CPQ, Zuora CPQ, Model N, Logik.io, Subskribe, or comparable quote-to-cash platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.salesforce.com/products/cpq/overview/',
      'https://www.salesforce.com/products/sales-cloud/tools/cpq-software/',
      'https://www.oracle.com/applications/customer-experience/cpq/',
      'https://docs.oracle.com/en/cloud/saas/configure-price-quote/index.html',
      'https://docs.oracle.com/en/cloud/saas/cx-commerce/21d/ccint/introduction-integrating-oracle-cpq.html',
      'https://conga.com/solutions/cpq-software-solution',
      'https://documentation.conga.com/en/general/conga-product-glossary/configure-price-quote-cpq',
      'https://pros.com/pros-platform/pricing-smart-cpq/',
      'https://dealhub.io/pricing/',
    ],
    regulatoryChips: ['revenue-recognition-review', 'approval-control-review', 'customer-contracting-review', 'price-governance-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-REV-001', 'PAT-SRC-CAT-CLM-001', 'PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Salesforce Revenue Cloud or CPQ, Oracle CPQ, Conga CPQ, PROS Smart CPQ, DealHub, SAP CPQ, Zuora CPQ, Model N, Logik.io, and Subskribe',
        tier: 'enterprise',
        positioning: 'CPQ and quote-to-cash candidates spanning configuration, pricing, discounting, approvals, quote documents, contract handoff, ordering, subscription changes, and renewal or amendment workflows.',
        cautions: ['Validate product-catalog governance, pricing source of truth, approval controls, order integration, and amendment/renewal behavior before treating CPQ as a sales-productivity tool.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Oracle CPQ overview and documentation', url: 'https://docs.oracle.com/en/cloud/saas/configure-price-quote/index.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Conga CPQ solution and glossary', url: 'https://conga.com/solutions/cpq-software-solution', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Salesforce CPQ overview', url: 'https://www.salesforce.com/products/cpq/overview/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'CPQ pricing constructs only',
        model: 'hybrid',
        metric: 'Sales users, admins, approvers, partner/channel users, modules, quote volume, product catalog complexity, pricing engine, document generation, billing/revenue modules, integrations, implementation, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'DealHub public pricing intake page', url: 'https://dealhub.io/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'PROS Smart CPQ pricing page', url: 'https://pros.com/pros-platform/pricing-smart-cpq/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Product catalog size, pricing rules, channels, quote volume, ERP/CRM/billing systems, and implementation scope require buyer evidence' },
        ],
        confidence: 0.57,
        notes: 'Do not infer net CPQ price or implementation effort from public pages. Complex product/pricing rule depth drives cost and risk.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Pricing and approval control',
        buyerPosition: 'Define pricing source of truth, discount authority, approval workflow, audit logs, override rights, quote validity, margin controls, and responsibility for incorrect quotes or stale prices.',
      },
      {
        clauseArea: 'Quote-to-order and exit',
        buyerPosition: 'Require integration commitments for CRM, CLM, billing, ERP/order management, catalog data, quote documents, amendments, renewals, exports, transition assistance, and implementation acceptance scenarios.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Scripted product-model proof',
        whenToUse: 'Use when products include bundles, options, usage, subscriptions, ramp deals, custom pricing, channel pricing, or regulated discount approvals.',
        buyerAsk: 'Require finalist proof against buyer products, attributes, constraints, price books, discounts, approvals, quote docs, amendments, renewals, and order handoff.',
      },
      {
        lever: 'Implementation accountability',
        whenToUse: 'Use when the vendor relies on SI configuration or the buyer has legacy quoting rules embedded in spreadsheets or ERP.',
        buyerAsk: 'Tie milestone payments to catalog migration, rule validation, pricing tests, approval tests, integration tests, and sales-user acceptance.',
      },
    ],
    riskFactors: [
      {
        id: 'cpq-product-model-brittleness',
        label: 'Product-model brittleness',
        severity: 'high',
        detectionSignals: ['Configuration rules, bundles, attributes, dependencies, or price rules cannot be explained, tested, or governed by business owners.'],
        mitigations: ['Require product-model governance, rule ownership, regression tests, admin controls, and change-management evidence'],
      },
      {
        id: 'cpq-quote-to-order-breakage',
        label: 'Quote-to-order breakage',
        severity: 'critical',
        detectionSignals: ['Quote lines do not reconcile to contract, billing, revenue, ERP order, provisioning, or renewal objects.'],
        mitigations: ['Run quote-to-contract-to-order scenarios, require integration acceptance, and define issue ownership across CRM, CLM, billing, and ERP'],
      },
    ],
    industryVariants: [
      {
        industry: 'manufacturing',
        modifier: 'Stress configurable products, options, compatibility, channel quoting, ERP item master, lead time, and order handoff.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress subscription amendments, ramps, usage components, renewals, co-terms, billing/revenue integration, and product-led packaging changes.',
      },
      {
        industry: 'healthcare',
        modifier: 'Review regulated pricing, customer eligibility, contract pricing, approvals, and audit evidence if pricing is tied to healthcare contracting obligations.',
      },
    ],
    body: `## Summary
Configure, Price, Quote software is where product truth, commercial authority, sales workflow, contract language, order handoff, and revenue operations collide. CPQ should not be sourced as a faster document generator. It should be tested as the control layer that determines which products can be sold, at what price, under which approvals, with which terms, and how the accepted quote becomes a contract, order, invoice, renewal, or amendment.

## When to apply
Use this pattern when sourcing Salesforce Revenue Cloud or CPQ, Oracle CPQ, Conga CPQ, PROS Smart CPQ, DealHub, SAP CPQ, Zuora CPQ, Model N, Logik.io, Subskribe, or comparable quote-to-cash platforms. Apply it during quote-to-cash transformation, product-catalog cleanup, sales approval redesign, subscription-billing modernization, ERP/order integration, channel quoting, price-management overhaul, or CLM/CRM consolidation. Do not use it for CRM-only, CLM-only, billing-only, e-signature-only, or product-information-management events unless configuration, pricing, and quote approval are central.

## Category boundary
In scope: product catalog, bundles, options, attributes, compatibility rules, price books, customer-specific pricing, discount approvals, margin controls, guided selling, quote documents, proposal templates, contract handoff, order handoff, amendments, renewals, ramps, usage constructs, partner/channel quoting, CRM integration, CLM integration, billing integration, ERP integration, audit logs, and admin governance. Adjacent but distinct: CRM pipeline management, CLM clause governance, billing mediation, revenue recognition, product information management, ERP item master, and e-commerce.

## Lifecycle and gates
The scope gate should inventory product families, catalog owners, price books, discount rules, approval authorities, channels, quote volume, contract handoff, billing model, ERP/order systems, renewal process, amendment process, and known spreadsheet or legacy-rule dependencies. The RFP gate should require product-model approach, pricing engine, approval workflows, document generation, integration architecture, implementation method, security, data ownership, API limits, and support. The proof gate should run buyer-authored scenarios for bundle configuration, incompatible options, customer-specific price, discount approval, margin exception, quote revision, contract handoff, order export, renewal, amendment, cancellation, and data export. The BAFO gate should normalize users, administrators, approvers, partner users, modules, quote volume, environments, implementation services, integration services, testing, support, and renewal controls.

## Evaluation rubric
Weight product and pricing governance around 25 percent, integration with CRM/CLM/billing/ERP around 25 percent, approval controls and auditability around 15 percent, sales usability around 15 percent, implementation and migration around 10 percent, and commercial predictability around 10 percent. Increase integration weight when quote lines must drive fulfillment, provisioning, billing, revenue recognition, or regulated customer pricing.

## Pricing and contract notes
Public vendor sources establish CPQ scope, not buyer-specific economics. Oracle documentation describes the opportunity-to-quote-to-order process, including product selection, configuration, pricing, quoting, ordering, and approvals. Conga describes CPQ capabilities around configuration, pricing, quote generation, proposals, and CLM adjacency. Salesforce describes CPQ and Revenue Cloud as quote and revenue-management capabilities. PROS and DealHub publish pricing or pricing-intake pages, but public pages do not prove net subscription price, implementation cost, sales-cycle reduction, win-rate improvement, margin lift, or quote-error reduction for a specific buyer.

Contracting should define product and pricing data ownership, admin rights, approval controls, audit logs, implementation acceptance, integration obligations, data migration, quote document templates, API access, support response, sandbox/environments, export rights, transition assistance, renewal uplift, and responsibility for incorrect prices or failed order handoff.

## Contradictions and failure modes
Vendor claim: CPQ accelerates quoting. Detection: require actual buyer products, rules, approvals, document templates, and sales roles in the proof. Vendor claim: quote-to-cash is integrated. Detection: trace quote lines through contract, order, billing, revenue, provisioning, and renewal objects. Vendor claim: business users can administer pricing. Detection: inspect rule complexity, regression tests, permission model, release process, and rollback procedure.

The common failure is buying CPQ before the product catalog and pricing governance are ready. The second is proving a simple quote while the real business needs amendments, renewals, ramps, usage, channel pricing, or customer-specific terms. The third is under-contracting implementation accountability: CPQ value is usually created in configuration, integrations, data cleanup, and sales adoption, not in the license alone.`
  },
  {
    id: 'PAT-SRC-CAT-EHS-001',
    slug: 'ehs-management-software-sourcing',
    title: 'EHS Management Software Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'EHS sourcing must prove frontline adoption, incident and observation quality, regulatory register ownership, corrective action closure, environmental data lineage, and audit evidence before buyers accept enterprise-risk or compliance claims.',
    applicability:
      'Apply when sourcing Enablon, Intelex, Benchmark Gensuite, VelocityEHS, Sphera, Cority, EcoOnline, or comparable environmental, health, safety, sustainability, and quality platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.ehs.com/',
      'https://benchmarkgensuite.com/what-is-ehs-software/',
      'https://benchmarkgensuite.com/',
      'https://www.intelex.com/products/applications/',
      'https://www.intelex.com/ehsq-roadmap/',
      'https://sphera.com/role/ehs-software-and-solutions/',
    ],
    regulatoryChips: ['osha-recordkeeping-review', 'environmental-compliance-review', 'corrective-action-governance', 'audit-evidence-review'],
    relatedPatternIds: ['PAT-SRC-CAT-QMS-001', 'PAT-SRC-CAT-ESG-001', 'PAT-SRC-CAT-DOC-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Enablon, Intelex, Benchmark Gensuite, VelocityEHS, Sphera, Cority, EcoOnline, and specialist EHS vendors',
        tier: 'enterprise',
        positioning: 'EHS and EHSQ platforms spanning incidents, audits, inspections, corrective actions, chemicals/SDS, environmental compliance, risk, sustainability, and reporting workflows.',
        cautions: ['Do not treat a broad module catalog as proof of usable site-level workflows, regulatory data ownership, or evidence quality.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'VelocityEHS platform overview', url: 'https://www.ehs.com/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Benchmark Gensuite EHS software overview', url: 'https://benchmarkgensuite.com/what-is-ehs-software/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Intelex EHSQ applications overview', url: 'https://www.intelex.com/products/applications/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'EHS pricing construct map',
        model: 'hybrid',
        metric: 'Sites, employees, contractors, modules, regulatory content, SDS volume, inspections, integrations, mobile/offline needs, implementation services, and support model',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Benchmark Gensuite public platform material', url: 'https://benchmarkgensuite.com/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Site count, employee population, contractor population, modules, jurisdiction count, chemical/SDS volume, and integration scope require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Public pages support scope framing only. Do not infer subscription price, implementation effort, incident-rate improvement, or compliance savings without buyer evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Regulatory and evidence ownership',
        buyerPosition: 'Define regulatory content ownership, audit evidence retention, record export, corrective-action history, inspection data, environmental calculations, and responsibility for failed or stale compliance content.',
      },
      {
        clauseArea: 'Frontline access and operational continuity',
        buyerPosition: 'Require mobile/offline commitments, site role design, contractor access controls, multilingual support where needed, uptime/support terms, and transition assistance for incidents, audits, chemicals, and CAPA history.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Site-level scripted proof',
        whenToUse: 'Use when vendors demonstrate executive dashboards but not frontline incident, inspection, or corrective-action workflows.',
        buyerAsk: 'Require plant, field, warehouse, contractor, EHS manager, legal, and executive personas to execute incident, inspection, audit, CAPA, SDS, environmental, and report scenarios.',
      },
      {
        lever: 'Regulatory-content accountability',
        whenToUse: 'Use when vendor value depends on regulatory libraries, jurisdiction mapping, or environmental compliance calculations.',
        buyerAsk: 'Separate software configuration, regulatory content subscription, buyer ownership, update cadence, review workflow, and liability boundaries.',
      },
    ],
    riskFactors: [
      {
        id: 'ehs-frontline-adoption-gap',
        label: 'Frontline adoption gap',
        severity: 'high',
        detectionSignals: ['Mobile flow is too slow, too permission-heavy, or too desktop-oriented for incident, observation, inspection, or near-miss capture.'],
        mitigations: ['Run frontline usability proof with real site roles, mobile/offline constraints, language needs, and supervisor review paths'],
      },
      {
        id: 'ehs-evidence-lineage-gap',
        label: 'Compliance evidence lineage gap',
        severity: 'critical',
        detectionSignals: ['Reports cannot trace calculations, evidence attachments, corrective-action closure, signoffs, or regulatory applicability back to controlled records.'],
        mitigations: ['Require audit trail, evidence export, calculation basis, retention rules, and compliance-owner signoff before award'],
      },
    ],
    industryVariants: [
      {
        industry: 'manufacturing',
        modifier: 'Stress incidents, near misses, lockout/tagout, inspections, chemicals, training, contractor safety, CAPA, and plant-level mobile adoption.',
      },
      {
        industry: 'energy_utilities',
        modifier: 'Stress field/offline work, asset and location hierarchy, environmental permits, contractor access, emergency response, and regulatory reporting evidence.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress role-based site adoption, regulatory-content governance, environmental data lineage, and executive reporting without inventing incident-rate or emissions outcomes.',
      },
    ],
    body: `## Summary
EHS Management Software is a control system for operational risk, regulatory evidence, and frontline behavior. A sourcing event should not simply compare incident forms, dashboards, or module lists. It should prove that employees, contractors, site leaders, EHS professionals, legal, compliance, and executives can create trustworthy records and close the loop from observation to corrective action to audit evidence.

## When to apply
Use this pattern when sourcing Enablon, Intelex, Benchmark Gensuite, VelocityEHS, Sphera, Cority, EcoOnline, or comparable EHS, EHSQ, sustainability, or operational-risk platforms. Apply it during incident-management modernization, audit and inspection redesign, chemical/SDS consolidation, environmental compliance improvement, contractor safety programs, safety observation programs, CAPA cleanup, or sustainability data governance. Do not use it for facilities ticketing, HR learning, ESG reporting, or document management alone unless EHS workflows and compliance evidence are central.

## Category boundary
In scope: incident reporting, near misses, observations, inspections, audits, findings, corrective and preventive actions, training evidence, contractor safety, SDS and chemical inventory, job safety analysis, management of change, environmental permits, waste, air/water data, regulatory tasks, audit trails, mobile/offline capture, analytics, and exports. Adjacent but distinct: HRIS, LMS, ESG disclosure, enterprise risk, document control, asset maintenance, and legal matter management.

## Lifecycle and gates
The scope gate should inventory sites, jurisdictions, employee and contractor populations, regulatory obligations, modules, SDS/chemical volume, mobile/offline needs, languages, integrations, retention requirements, and current evidence gaps. The RFP gate should require workflow configuration, regulatory-content governance, mobile proof, audit logs, security, reporting, API/export access, implementation approach, and support. The proof gate should run incident, near-miss, inspection, audit finding, CAPA, SDS lookup, environmental record, regulatory task, contractor, and executive report scenarios. The BAFO gate should normalize sites, users, contractors, modules, regulatory content, implementation, integrations, mobile/offline commitments, support, and exit rights.

## Evaluation rubric
Weight frontline usability around 25 percent, compliance evidence and auditability around 25 percent, workflow breadth and configurability around 20 percent, reporting and environmental data lineage around 15 percent, implementation and migration around 10 percent, and commercial predictability around 5 percent. Increase evidence weight when environmental reporting, regulated operations, or legal discovery exposure is material.

## Pricing and contract notes
Public vendor pages from VelocityEHS, Benchmark Gensuite, Intelex, and Sphera establish the breadth of EHS, EHSQ, sustainability, compliance, and risk-management workflows. They do not prove buyer-specific price, implementation effort, incident reduction, recordability reduction, audit savings, or regulatory outcome. Contracting should define site counts, contractor access, module scope, regulatory-content responsibilities, mobile/offline behavior, audit logs, evidence retention, data exports, implementation acceptance, support response, renewal controls, and transition assistance.

## Contradictions and failure modes
Vendor claim: the platform improves safety outcomes. Detection: require adoption design, supervisor review, CAPA closure governance, and evidence quality before accepting outcome language. Vendor claim: regulatory reporting is automated. Detection: trace data source, calculation basis, approvals, attachments, audit trail, and export. The common failure is buying an executive EHS dashboard that frontline workers will not use. The second is importing legacy checklists without assigning regulatory ownership. The third is confusing data capture with compliance defensibility; the buyer still needs accountable owners, review cadence, and evidence discipline.`
  },
  {
    id: 'PAT-SRC-CAT-PPM-001',
    slug: 'project-portfolio-management-sourcing',
    title: 'Project Portfolio Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'PPM sourcing should prove demand intake, prioritization, funding, capacity, dependencies, benefits, governance cadence, and delivery-system integration before buyers accept portfolio visibility or PMO maturity claims.',
    applicability:
      'Apply when sourcing Planview, ServiceNow Strategic Portfolio Management, Broadcom Clarity, Planisware, Microsoft Project/Project Online, Smartsheet control-center patterns, or comparable portfolio platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.planview.com/products-solutions/products/ppm-pro/project-portfolio-management/',
      'https://info.planview.com/rs/456-QCH-520/images/Planview-Project-Portfolio-Management-SB-EN.pdf',
      'https://blogs.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/resource-center/data-sheet/ds-project-portfolio-management.pdf',
      'https://www.planisware.com/',
      'https://www.broadcom.com/products/software/value-stream-management/clarity',
    ],
    regulatoryChips: ['portfolio-governance-review', 'benefits-realization-review', 'financial-controls-review', 'data-lineage-review'],
    relatedPatternIds: ['PAT-SRC-CAT-EPM-001', 'PAT-SRC-CAT-PSA-001', 'PAT-SRC-CAT-ITSM-001', 'PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Planview, ServiceNow Strategic Portfolio Management, Broadcom Clarity, Planisware, Microsoft Project, and work-management-adjacent PPM offerings',
        tier: 'enterprise',
        positioning: 'Portfolio governance platforms spanning demand, prioritization, funding, capacity, roadmaps, execution tracking, dependencies, benefits, and executive reporting.',
        cautions: ['Validate integration with delivery systems and finance; PPM fails when it becomes a stale PMO reporting layer disconnected from work execution.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Planview PPM product overview', url: 'https://www.planview.com/products-solutions/products/ppm-pro/project-portfolio-management/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'ServiceNow PPM data sheet', url: 'https://blogs.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/resource-center/data-sheet/ds-project-portfolio-management.pdf', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Broadcom Clarity product page', url: 'https://www.broadcom.com/products/software/value-stream-management/clarity', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'PPM pricing construct map',
        model: 'hybrid',
        metric: 'Portfolio users, project managers, resource managers, executives, contributors, integrations, planning modules, financial modules, reporting, implementation, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Planview PPM product overview', url: 'https://www.planview.com/products-solutions/products/ppm-pro/project-portfolio-management/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Portfolio count, project count, user roles, finance integration, agile/toolchain integration, and governance model require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Public vendor material supports module and scope framing only. Do not infer license price, PMO savings, delivery acceleration, or benefits uplift without buyer evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Portfolio and financial governance',
        buyerPosition: 'Define demand intake, prioritization model, funding fields, cost and benefit ownership, approval history, dependency records, reporting lineage, and export rights.',
      },
      {
        clauseArea: 'Delivery-system integration',
        buyerPosition: 'Require integration commitments for agile tools, project schedules, finance, HR/resource data, ITSM, OKR or strategy systems, and data reconciliation acceptance tests.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Portfolio operating cadence proof',
        whenToUse: 'Use when the buyer needs steering committees, quarterly planning, capital governance, or PMO reporting discipline.',
        buyerAsk: 'Run demand intake, scoring, capacity, funding, dependency, re-prioritization, executive review, and benefits-tracking scenarios with buyer governance roles.',
      },
      {
        lever: 'Contributor license decomposition',
        whenToUse: 'Use when vendors price broad populations as full users.',
        buyerAsk: 'Separate executive viewers, project managers, resource managers, finance reviewers, contributors, requesters, integration users, and administrators.',
      },
    ],
    riskFactors: [
      {
        id: 'ppm-stale-reporting-layer',
        label: 'Stale reporting layer',
        severity: 'high',
        detectionSignals: ['Portfolio data is manually re-keyed from delivery tools, finance, spreadsheets, or executive decks.'],
        mitigations: ['Require integration proof, field ownership, update cadence, reconciliation reports, and stale-data indicators'],
      },
      {
        id: 'ppm-prioritization-without-capacity',
        label: 'Prioritization without capacity truth',
        severity: 'high',
        detectionSignals: ['Scoring model ranks work but resource capacity, funding constraints, skills, dependencies, and inflight commitments are not represented.'],
        mitigations: ['Require capacity model, constraint simulation, dependency map, financial view, and governance signoff'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress capital planning, regulatory-change portfolios, model risk, auditability, dependency governance, and executive committee evidence.',
      },
      {
        industry: 'public_sector',
        modifier: 'Stress grant/capital tracking, procurement milestones, budget cycles, transparency, public reporting, and accessibility requirements.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress integration with agile delivery, finance, HR/resource data, ITSM, and executive strategy cadences.',
      },
    ],
    body: `## Summary
Project Portfolio Management software is a governance system for deciding which work deserves capacity, funding, attention, and executive sponsorship. A PPM sourcing event should not reward polished roadmap screens alone. It should test whether the organization can move from demand intake to prioritization, funding, resource constraints, dependency management, execution status, benefits tracking, and executive decisions with trusted data.

## When to apply
Use this pattern when sourcing Planview, ServiceNow Strategic Portfolio Management, Broadcom Clarity, Planisware, Microsoft Project/Project Online, Smartsheet-based portfolio control, or comparable PPM platforms. Apply it during PMO redesign, technology portfolio governance, capital planning, transformation-office setup, product-portfolio governance, regulatory-change management, or resource-capacity cleanup. Do not use it for task management, agile-team planning, PSA, ERP capital accounting, or OKR tooling alone unless portfolio decision governance is central.

## Category boundary
In scope: demand intake, business case fields, prioritization, scoring, funding, budgets, forecasts, capacity, resource roles, dependencies, risks, milestones, roadmap views, portfolio scenarios, approvals, benefits, dashboards, executive packs, delivery-tool integration, finance integration, and exports. Adjacent but distinct: agile work management, ITSM, PSA, ERP project accounting, HR skills systems, OKR tooling, and BI dashboards.

## Lifecycle and gates
The scope gate should inventory portfolios, project volume, governance forums, funding cycles, resource pools, delivery methods, agile tools, finance systems, HR/resource sources, status-reporting pain, and benefit-realization expectations. The RFP gate should require operating model fit, data model, workflow configuration, integration approach, reporting, security, role model, migration, and support. The proof gate should run demand intake, scoring, investment approval, funding change, capacity constraint, dependency conflict, red status, executive re-prioritization, agile tool update, finance reconciliation, and benefits review scenarios. The BAFO gate should normalize licenses, modules, integrations, migration, reporting, implementation services, support, and renewal controls.

## Evaluation rubric
Weight portfolio decision quality around 25 percent, integration and data lineage around 25 percent, capacity and financial governance around 20 percent, usability by PMO and executives around 15 percent, implementation/migration around 10 percent, and commercial predictability around 5 percent. Increase integration weight when agile delivery, finance, and HR/resource systems remain systems of record.

## Pricing and contract notes
Public Planview, ServiceNow, Broadcom, and Planisware materials support scope framing around portfolio visibility, demand, work, resources, financials, and governance. They do not prove buyer-specific subscription price, implementation timeline, PMO savings, project success improvement, or benefits realization. Contracting should define license roles, integrations, data ownership, reporting lineage, migration completeness, support response, sandbox availability, export rights, renewal controls, and acceptance criteria tied to the buyer governance cadence.

## Contradictions and failure modes
Vendor claim: PPM creates portfolio visibility. Detection: prove data lineage from delivery, finance, resource, and executive decision records. Vendor claim: prioritization improves decisions. Detection: test capacity, funding, dependencies, and benefit tradeoffs, not just scores. The common failure is building a new reporting layer that project teams must manually feed. The second is scoring demand without capacity truth. The third is treating portfolio governance as software configuration when it actually requires clear ownership, meeting cadence, decision rights, and consequences when data is stale.`
  },
  {
    id: 'PAT-SRC-CAT-QMS-001',
    slug: 'quality-management-system-sourcing',
    title: 'Quality Management System Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'QMS sourcing must prove closed-loop quality, document control, training linkage, CAPA discipline, supplier quality, audit readiness, and product/process traceability before buyers accept compliance or quality-excellence claims.',
    applicability:
      'Apply when sourcing ETQ Reliance, MasterControl, Arena QMS, Veeva Quality, Greenlight Guru, Qualio, TrackWise, or comparable quality management systems.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.etq.com/etq-qms-software/',
      'https://www.mastercontrol.com/quality-management-system/',
      'https://www.mastercontrol.com/quality-management-software/',
      'https://www.arenasolutions.com/platform/qms/',
      'https://blog.etq.com/hubfs/how%20to%20select%20a%20quality%20management%20system%207%20key%20elements%20for%20successful%20implementation_322.pdf',
    ],
    regulatoryChips: ['iso-9001-review', 'capa-governance-review', 'document-control-review', 'audit-readiness-review'],
    relatedPatternIds: ['PAT-SRC-CAT-EHS-001', 'PAT-SRC-CAT-DOC-001', 'PAT-SRC-CAT-MDM-001', 'PAT-SRC-CAT-ERP-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'ETQ, MasterControl, Arena QMS, Veeva Quality, Greenlight Guru, Qualio, TrackWise, and specialist QMS vendors',
        tier: 'enterprise',
        positioning: 'QMS platforms spanning document control, training, audits, nonconformance, CAPA, change control, supplier quality, complaints, product/process traceability, and reporting.',
        cautions: ['Validate regulated workflow evidence, product/process traceability, and quality-owner adoption before accepting compliance language.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'ETQ QMS software overview', url: 'https://www.etq.com/etq-qms-software/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'MasterControl QMS overview', url: 'https://www.mastercontrol.com/quality-management-system/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Arena QMS platform page', url: 'https://www.arenasolutions.com/platform/qms/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'QMS pricing construct map',
        model: 'hybrid',
        metric: 'Named users, quality roles, supplier/partner users, modules, controlled documents, training linkage, validation services, integrations, migration, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'ETQ QMS software overview', url: 'https://www.etq.com/etq-qms-software/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Regulatory scope, document volume, supplier user population, validation needs, ERP/PLM integration, and migration scope require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Public QMS pages support scope and vendor landscape only. Do not infer net price, validation cost, audit savings, defect reduction, or release-cycle impact.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Quality record and audit evidence',
        buyerPosition: 'Define ownership, retention, audit trails, e-signature rules where applicable, export rights, validation evidence, CAPA history, supplier records, and document-control obligations.',
      },
      {
        clauseArea: 'Implementation and validation',
        buyerPosition: 'Tie milestone payment to configured workflows, migration completeness, test evidence, validation documentation where required, training linkage, and quality-owner acceptance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Closed-loop quality proof',
        whenToUse: 'Use when vendors show forms or dashboards but not cross-process traceability.',
        buyerAsk: 'Run nonconformance, CAPA, document revision, training impact, audit finding, supplier issue, complaint, and change-control scenarios end to end.',
      },
      {
        lever: 'Supplier and partner access decomposition',
        whenToUse: 'Use when supplier quality or external collaboration is material.',
        buyerAsk: 'Separate internal quality users, approvers, auditors, read-only users, supplier users, partner users, integration accounts, and admins.',
      },
    ],
    riskFactors: [
      {
        id: 'qms-capa-discipline-gap',
        label: 'CAPA discipline gap',
        severity: 'high',
        detectionSignals: ['CAPA workflow captures actions but not root cause, effectiveness checks, training/document impacts, owner accountability, or overdue escalation.'],
        mitigations: ['Require CAPA proof with root-cause fields, effectiveness checks, document/training linkage, escalation, and audit trail'],
      },
      {
        id: 'qms-document-training-disconnect',
        label: 'Document and training disconnect',
        severity: 'high',
        detectionSignals: ['Document changes do not trigger training assignment, acknowledgement evidence, role targeting, or audit-ready completion records.'],
        mitigations: ['Require document revision to training impact proof, role mapping, signoff records, and exportable audit evidence'],
      },
    ],
    industryVariants: [
      {
        industry: 'healthcare',
        modifier: 'Stress validation evidence, e-signature rules where applicable, complaint handling, supplier quality, audit trails, and regulated document control.',
      },
      {
        industry: 'manufacturing',
        modifier: 'Stress nonconformance, CAPA, supplier corrective action, production deviation, product/process traceability, and ERP/PLM integration.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress closed-loop quality, document-control discipline, training evidence, and audit readiness without inventing defect or compliance outcome claims.',
      },
    ],
    body: `## Summary
A Quality Management System is the system of record for whether quality processes are controlled, traceable, and audit-ready. QMS sourcing should not stop at configurable forms or compliance vocabulary. It should prove closed-loop quality: a problem is detected, classified, investigated, corrected, verified, linked to documents and training, and preserved as defensible evidence.

## When to apply
Use this pattern when sourcing ETQ Reliance, MasterControl, Arena QMS, Veeva Quality, Greenlight Guru, Qualio, TrackWise, or comparable QMS platforms. Apply it during quality-system modernization, ISO 9001 improvement, regulated product quality, supplier quality redesign, CAPA cleanup, document-control replacement, audit-readiness remediation, complaint handling, or manufacturing/nonconformance workflow improvement. Do not use it for generic document management, ticketing, LMS, PLM, or EHS alone unless quality records and audit evidence are central.

## Category boundary
In scope: document control, training linkage, nonconformance, deviation, CAPA, root cause, effectiveness checks, audits, findings, supplier quality, complaints, change control, risk management, quality events, approvals, e-signature where applicable, audit trails, reporting, migration, integrations, and exports. Adjacent but distinct: PLM, ERP manufacturing execution, EHS, LMS, supplier management, document repositories, and BI.

## Lifecycle and gates
The scope gate should inventory regulated processes, document types, training rules, CAPA volume, audit findings, supplier records, complaint workflows, product/process traceability, validation needs, migration sources, and integration systems. The RFP gate should require workflow configuration, audit trail, security, role model, document control, training impact, reporting, validation support, API/export rights, migration, and support. The proof gate should run document revision, training assignment, nonconformance, CAPA, root-cause analysis, effectiveness check, supplier issue, audit finding, complaint, change control, and export scenarios. The BAFO gate should normalize internal users, supplier users, modules, validation services, migration, integrations, support, environments, and renewal controls.

## Evaluation rubric
Weight closed-loop quality workflow around 25 percent, audit evidence and traceability around 25 percent, document/training integration around 15 percent, supplier and product/process quality around 15 percent, implementation/validation around 15 percent, and commercial predictability around 5 percent. Increase validation weight in regulated environments or where electronic records and approvals create audit exposure.

## Pricing and contract notes
Public ETQ, MasterControl, and Arena pages establish QMS scope around quality processes, document control, compliance, product-centric quality, and connected quality workflows. They do not prove buyer-specific price, validation cost, implementation duration, defect reduction, audit savings, or compliance outcome. Contracting should define record ownership, audit trails, validation documentation, data migration, supplier access, document/training linkage, export rights, support, environments, renewal controls, and transition assistance.

## Contradictions and failure modes
Vendor claim: the platform improves quality. Detection: require root-cause discipline, effectiveness checks, owner accountability, document/training linkage, and audit evidence. Vendor claim: compliance is built in. Detection: map buyer procedures, regulated records, approvals, retention, exports, and validation evidence. The common failure is buying workflow automation while leaving quality ownership ambiguous. The second is separating document control from training evidence. The third is migrating old CAPA and supplier records without preserving context, attachments, signatures, decisions, and closure evidence.`
  },
  {
    id: 'PAT-SRC-CAT-RPA-001',
    slug: 'robotic-process-automation-sourcing',
    title: 'Robotic Process Automation Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'RPA sourcing should prove process suitability, exception handling, credential governance, bot operations, change resilience, and human handoff before buyers accept automation-volume or productivity claims.',
    applicability:
      'Apply when sourcing UiPath, Automation Anywhere, Microsoft Power Automate, SS&C Blue Prism, or comparable automation platforms for attended, unattended, desktop, workflow, and agentic automation use cases.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.uipath.com/rpa/robotic-process-automation',
      'https://www.uipath.com/platform',
      'https://www.automationanywhere.com/robotic-process-automation',
      'https://www.automationanywhere.com/products/robotic-process-automation-system',
      'https://www.microsoft.com/en/power-platform/products/power-automate/topics/robotic-process-automation/what-is-rpa',
      'https://www.blueprism.com/guides/robotic-process-automation-rpa/',
    ],
    regulatoryChips: ['credential-governance-review', 'bot-control-review', 'audit-trail-review', 'change-management-review'],
    relatedPatternIds: ['PAT-SRC-CAT-BPM-001', 'PAT-SRC-CAT-AGENT-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-DOC-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'UiPath, Automation Anywhere, Microsoft Power Automate, SS&C Blue Prism, and automation-platform specialists',
        tier: 'enterprise',
        positioning: 'Automation platforms spanning attended bots, unattended bots, process orchestration, document automation, workflow, AI/agentic automation, monitoring, and governance.',
        cautions: ['Validate process stability, exception handling, credential vaulting, bot operations, and change resilience before treating automation as a labor-savings product.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'UiPath RPA overview', url: 'https://www.uipath.com/rpa/robotic-process-automation', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Automation Anywhere RPA overview', url: 'https://www.automationanywhere.com/robotic-process-automation', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Power Automate RPA explainer', url: 'https://www.microsoft.com/en/power-platform/products/power-automate/topics/robotic-process-automation/what-is-rpa', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'RPA pricing construct map',
        model: 'hybrid',
        metric: 'Attended users, unattended robots, orchestration, document processing, AI/agent modules, environments, monitoring, support, implementation, and managed services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'UiPath platform material', url: 'https://www.uipath.com/platform', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Bot volume, attended/unattended mix, process inventory, exception rate, credential model, and operations model require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Public vendor pages support capability framing only. Do not infer bot price, ROI, FTE savings, processing-time reduction, or automation rate without buyer evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Bot governance and operations',
        buyerPosition: 'Define bot identity, credential vaulting, access reviews, monitoring, failure handling, change control, release management, audit logs, and ownership for production incidents.',
      },
      {
        clauseArea: 'Automation acceptance and exit',
        buyerPosition: 'Require acceptance tests for process scripts, exceptions, handoffs, credentials, logs, export of bot assets, documentation, and transition assistance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Process-suitability proof',
        whenToUse: 'Use when vendors present automation demos without buyer-specific exception paths.',
        buyerAsk: 'Run stable, semi-stable, exception-heavy, credentialed, document-driven, and human-review scenarios before BAFO.',
      },
      {
        lever: 'Operations model decomposition',
        whenToUse: 'Use when the buyer lacks an internal bot operations team.',
        buyerAsk: 'Separate software subscription, implementation, bot factory, monitoring, support, runbook ownership, managed service, and change-management costs.',
      },
    ],
    riskFactors: [
      {
        id: 'rpa-brittle-ui-automation',
        label: 'Brittle UI automation',
        severity: 'high',
        detectionSignals: ['Bot depends on screen layout, unversioned UI elements, unstable selectors, or downstream system changes without monitoring.'],
        mitigations: ['Require API-first alternatives where possible, resilient selectors, regression tests, change alerts, and runbook ownership'],
      },
      {
        id: 'rpa-credential-control-gap',
        label: 'Bot credential control gap',
        severity: 'critical',
        detectionSignals: ['Bots use shared accounts, unmanaged secrets, weak access reviews, or unclear ownership for privileged actions.'],
        mitigations: ['Require bot identity model, vaulting, least privilege, access review cadence, audit logs, and privileged access controls'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress segregation of duties, evidence logs, model/rule governance, reconciliations, bot credentials, and auditability.',
      },
      {
        industry: 'healthcare',
        modifier: 'Stress PHI access, human review, error handling, audit logs, payer/provider workflow constraints, and compliance evidence.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress process suitability, exception management, operations ownership, and change resilience without inventing FTE or ROI claims.',
      },
    ],
    body: `## Summary
Robotic Process Automation is best sourced as an operating capability, not as a bot license. RPA can automate repetitive work, but the procurement question is whether the target processes are stable enough, governed enough, and monitored enough to run safely after go-live. The event should test process suitability, exception handling, human handoff, credential control, monitoring, release management, and support ownership before accepting productivity language.

## When to apply
Use this pattern when sourcing UiPath, Automation Anywhere, Microsoft Power Automate, SS&C Blue Prism, or comparable automation platforms. Apply it during shared-services automation, finance operations cleanup, HR operations automation, claims or service operations modernization, document-processing workflows, legacy-system bridging, or automation-center-of-excellence buildout. Do not use it for BPM, iPaaS, AI agents, document management, or API integration alone unless bot execution and automation operations are central.

## Category boundary
In scope: attended automation, unattended automation, orchestration, bot scheduling, exception queues, human-in-the-loop review, credential management, audit logs, bot monitoring, document automation, process mining adjacency, desktop automation, API-based automation, reusable components, environments, and release management. Adjacent but distinct: BPM workflow, iPaaS, low-code apps, AI agents, OCR-only tools, task mining, enterprise integration, and managed services.

## Lifecycle and gates
The scope gate should inventory candidate processes, system touchpoints, exception rates, credentials, data sensitivity, UI/API stability, human review, volumes, service-level needs, and current manual controls. The RFP gate should require bot identity, security, orchestration, monitoring, audit, support, implementation approach, reusable components, and export rights. The proof gate should run successful transaction, exception, rollback, credential rotation, system-change, human-review, document-input, and monitoring scenarios. The BAFO gate should normalize attended users, unattended bots, orchestration, document modules, environments, support, implementation, managed service, training, and renewal controls.

## Evaluation rubric
Weight process suitability and exception handling around 25 percent, security and credential governance around 20 percent, operations and monitoring around 20 percent, build experience and reuse around 15 percent, integration and document handling around 10 percent, and commercial predictability around 10 percent. Increase security weight when bots touch payments, HR, regulated data, or privileged systems.

## Pricing and contract notes
Public UiPath, Automation Anywhere, Microsoft, and Blue Prism materials support capability framing around RPA, attended/unattended automation, orchestration, and platform governance. They do not prove buyer-specific price, FTE savings, processing-time improvement, automation rate, or ROI. Contracting should define bot identity, credential vaulting, monitoring, support, implementation acceptance, runbooks, export rights, renewal controls, and responsibility for failures caused by system changes.

## Contradictions and failure modes
Vendor claim: RPA scales automation quickly. Detection: require process inventory, exception analysis, ownership, and bot operations proof. Vendor claim: bots reduce manual effort. Detection: separate license value from redesign, exception handling, human review, and ongoing maintenance. The common failure is automating unstable processes and then creating a fragile production estate. The second is ignoring credentials and access reviews. The third is counting built bots instead of measuring trusted, monitored, maintained automations that survive real system change.`
  },
  {
    id: 'PAT-SRC-CAT-ERP2-001',
    slug: 'core-erp-modernization-sourcing',
    title: 'Core ERP Modernization Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Core ERP sourcing must prove process fit, master-data readiness, localization, controls, reporting, integration, migration, and implementation governance before buyers accept transformation or cloud-modernization claims.',
    applicability:
      'Apply when sourcing SAP Cloud ERP/S/4HANA, Oracle Fusion Cloud ERP, Microsoft Dynamics 365 Finance/Supply Chain, Workday Financial Management, Infor, NetSuite, or comparable enterprise ERP platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.80,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.sap.com/products/erp/s4hana.cloud-edition.html',
      'https://www.oracle.com/erp/',
      'https://docs.oracle.com/en/cloud/saas/',
      'https://www.microsoft.com/en-us/dynamics-365/products/finance',
      'https://www.microsoft.com/en-us/dynamics-365/products/supply-chain-management',
    ],
    regulatoryChips: ['financial-controls-review', 'sox-control-review', 'data-migration-review', 'localization-tax-review'],
    relatedPatternIds: ['PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-EPM-001', 'PAT-SRC-CAT-MDM-001', 'PAT-SRC-CAT-ETL-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'SAP Cloud ERP/S/4HANA, Oracle Fusion Cloud ERP, Microsoft Dynamics 365, Workday Financial Management, Infor, NetSuite, and industry ERP platforms',
        tier: 'enterprise',
        positioning: 'Core ERP platforms spanning finance, procurement, order management, supply chain, projects, manufacturing, reporting, controls, and enterprise process standardization.',
        cautions: ['Validate implementation model, process fit, controls, master data, integrations, and localization before treating ERP as a software-only selection.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP Cloud ERP product page', url: 'https://www.sap.com/products/erp/s4hana.cloud-edition.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Oracle Fusion Cloud ERP product page', url: 'https://www.oracle.com/erp/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Oracle Fusion Cloud Applications documentation', url: 'https://docs.oracle.com/en/cloud/saas/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'ERP commercial construct map',
        model: 'hybrid',
        metric: 'Full users, employee/self-service users, modules, entities, countries, environments, integrations, implementation waves, data migration, reporting, support, and partner services',
        sourceBasis: [
          { type: 'public-disclosure', label: 'SAP Cloud ERP public product material', url: 'https://www.sap.com/products/erp/s4hana.cloud-edition.html', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Entities, countries, process scope, legacy footprint, customization, integrations, data quality, and SI approach require buyer evidence' },
        ],
        confidence: 0.54,
        notes: 'Public ERP pages do not prove subscription price, SI cost, migration duration, business-case value, or decommissioning savings.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Implementation and control accountability',
        buyerPosition: 'Define implementation acceptance, control design, segregation of duties, testing evidence, cutover criteria, data migration, integration ownership, and post-go-live support.',
      },
      {
        clauseArea: 'Data and exit rights',
        buyerPosition: 'Require export of master data, transactions, audit logs, configurations, reports, approval history, integrations, and transition assistance in usable formats.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Fit-to-standard proof',
        whenToUse: 'Use when cloud ERP value depends on process standardization and reduced customization.',
        buyerAsk: 'Run buyer-specific process scenarios and document where standard fit, configuration, extension, workaround, or process change is required.',
      },
      {
        lever: 'SI accountability split',
        whenToUse: 'Use when software vendor, implementation partner, and buyer responsibilities are distributed.',
        buyerAsk: 'Separate software obligations, SI deliverables, data migration, testing, controls, integrations, cutover, hypercare, and defect ownership.',
      },
    ],
    riskFactors: [
      {
        id: 'erp-master-data-readiness-gap',
        label: 'Master-data readiness gap',
        severity: 'critical',
        detectionSignals: ['Chart of accounts, suppliers, customers, items, locations, tax data, or approvals are inconsistent across legacy systems.'],
        mitigations: ['Require data profiling, ownership, cleansing plan, migration rehearsal, reconciliation, and data acceptance gates'],
      },
      {
        id: 'erp-standard-fit-illusion',
        label: 'Standard-fit illusion',
        severity: 'high',
        detectionSignals: ['Demo uses generic best practice while buyer exceptions, localizations, approvals, reporting, and controls remain unresolved.'],
        mitigations: ['Require fit-gap workbook, localization proof, control signoff, extension register, and executive process-decision log'],
      },
    ],
    industryVariants: [
      {
        industry: 'manufacturing',
        modifier: 'Stress item master, BOM/routing, planning, procurement, inventory, quality, costing, shop-floor integrations, and traceability.',
      },
      {
        industry: 'financial_services',
        modifier: 'Stress financial controls, close process, regulatory reporting, procurement controls, segregation of duties, audit evidence, and data lineage.',
      },
      {
        industry: 'cross_industry',
        modifier: 'Stress master data, integrations, reporting, controls, fit-to-standard, and implementation governance before accepting transformation claims.',
      },
    ],
    body: `## Summary
Core ERP modernization is one of the highest-consequence sourcing categories because the software selection is inseparable from process design, master data, controls, reporting, integration, migration, and implementation governance. The event should not crown the best demo. It should determine which platform and implementation model can run the buyer's operating model with acceptable fit, risk, control evidence, and change capacity.

## When to apply
Use this pattern when sourcing SAP Cloud ERP/S/4HANA, Oracle Fusion Cloud ERP, Microsoft Dynamics 365 Finance or Supply Chain, Workday Financial Management, Infor, NetSuite, or comparable ERP platforms. Apply it during finance transformation, legacy ERP replacement, post-merger consolidation, cloud ERP migration, shared-services redesign, manufacturing modernization, procurement transformation, or multi-entity controls cleanup. Do not use it for EPM, procurement point solutions, PSA, HCM, or SCM point solutions unless core financial/operational ERP scope is central.

## Category boundary
In scope: general ledger, accounts payable, accounts receivable, fixed assets, procurement, order management, inventory, projects, manufacturing or supply chain where relevant, approvals, controls, roles, reporting, master data, localizations, integrations, migration, environments, and cutover. Adjacent but distinct: EPM planning, tax engines, treasury, HCM, CRM, data warehouse, iPaaS, and analytics.

## Lifecycle and gates
The scope gate should inventory entities, countries, processes, legacy systems, customizations, integrations, reports, master data, controls, audit needs, localization, and cutover constraints. The RFP gate should require module scope, fit-to-standard method, implementation plan, partner model, security, integrations, reporting, data migration, testing, and support. The proof gate should run record-to-report, procure-to-pay, order-to-cash, project or manufacturing scenarios, approval controls, reporting, integration, and migration samples. The BAFO gate should normalize users, modules, environments, SI services, data migration, integrations, testing, training, hypercare, support, and renewal controls.

## Evaluation rubric
Weight process fit and controls around 25 percent, implementation governance around 25 percent, data migration and integration around 20 percent, reporting and analytics around 10 percent, user adoption and operating model around 10 percent, and commercial predictability around 10 percent. Increase implementation weight when legacy customization, multi-country scope, or weak data ownership is present.

## Pricing and contract notes
Public SAP, Oracle, and Microsoft materials establish cloud ERP scope and product framing. They do not prove buyer-specific subscription cost, implementation cost, migration duration, decommissioning savings, close acceleration, or transformation value. Contracting should define software scope, implementation responsibilities, data ownership, migration acceptance, integration ownership, control evidence, cutover criteria, support, environments, export rights, renewal controls, and transition assistance.

## Contradictions and failure modes
Vendor claim: cloud ERP enables standardization. Detection: require fit-gap evidence, process-decision log, localization proof, and extension register. Vendor claim: implementation approach reduces risk. Detection: inspect workplan, data readiness, integration plan, testing, cutover, and hypercare. The common failure is underestimating master data and legacy reports. The second is accepting standard-process language while approving many exceptions. The third is failing to define vendor, SI, and buyer accountability when defects appear after go-live.`
  },
  {
    id: 'PAT-SRC-CAT-DOC-001',
    slug: 'enterprise-document-content-management-sourcing',
    title: 'Enterprise Document and Content Management Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Document and content management sourcing should prove metadata discipline, permissions, records retention, workflow, search, line-of-business integration, and migration quality before buyers accept knowledge-productivity or compliance claims.',
    applicability:
      'Apply when sourcing OpenText, Box, M-Files, Microsoft SharePoint/Purview patterns, Hyland, Laserfiche, DocuWare, or comparable document, content services, and enterprise content management platforms.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://blogs.opentext.com/enterprise-content-management-ecm/',
      'https://www.opentext.com/products/viewing-transformation',
      'https://www.box.com/content-management/enterprise/',
      'https://www.m-files.com/supplemental/document-management-software/',
      'https://www.m-files.com/supplemental/ecm/',
    ],
    regulatoryChips: ['records-retention-review', 'permission-governance-review', 'information-lifecycle-review', 'ediscovery-readiness-review'],
    relatedPatternIds: ['PAT-SRC-CAT-QMS-001', 'PAT-SRC-CAT-EHS-001', 'PAT-SRC-CAT-LEGAL-001', 'PAT-SRC-CAT-IAM-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    lifecycleStages: CATEGORY_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'OpenText, Box, M-Files, Microsoft SharePoint/Purview, Hyland, Laserfiche, DocuWare, and content-services platforms',
        tier: 'enterprise',
        positioning: 'Document and content platforms spanning repositories, metadata, permissions, workflow, records retention, search, collaboration, capture, and line-of-business integration.',
        cautions: ['Validate metadata, retention, permissions, search, migration, and adoption; content platforms fail when they become another uncontrolled file share.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'OpenText ECM overview', url: 'https://blogs.opentext.com/enterprise-content-management-ecm/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Box enterprise content management page', url: 'https://www.box.com/content-management/enterprise/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'M-Files document management overview', url: 'https://www.m-files.com/supplemental/document-management-software/', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Document/content management pricing construct map',
        model: 'hybrid',
        metric: 'Named users, external users, storage, repositories, records modules, workflow, capture/OCR, e-signature adjacency, integrations, migration, governance, and support',
        sourceBasis: [
          { type: 'public-disclosure', label: 'M-Files ECM and document management material', url: 'https://www.m-files.com/supplemental/ecm/', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Repository count, content volume, retention classes, external sharing, migration quality, and integration scope require buyer evidence' },
        ],
        confidence: 0.55,
        notes: 'Public pages support scope only. Do not infer price, storage cost, search productivity, compliance savings, or migration effort without buyer evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Information governance and records',
        buyerPosition: 'Define metadata ownership, retention schedules, legal hold, audit logs, permission reviews, external sharing, export rights, and responsibility for policy misconfiguration.',
      },
      {
        clauseArea: 'Migration and content quality',
        buyerPosition: 'Require migration sampling, metadata mapping, permission reconciliation, duplicate handling, broken-link treatment, search acceptance, and transition assistance.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Metadata and retrieval proof',
        whenToUse: 'Use when vendors demonstrate AI search, knowledge discovery, or workflow without buyer content structure.',
        buyerAsk: 'Run retrieval, permission, metadata, retention, duplicate, external-sharing, workflow, and audit scenarios using buyer-like content samples.',
      },
      {
        lever: 'Migration risk decomposition',
        whenToUse: 'Use when content is spread across file shares, SharePoint sites, email archives, legacy ECM, or line-of-business repositories.',
        buyerAsk: 'Separate migration discovery, cleansing, metadata mapping, permission remediation, validation, user adoption, and archive/decommissioning work.',
      },
    ],
    riskFactors: [
      {
        id: 'doc-metadata-governance-gap',
        label: 'Metadata governance gap',
        severity: 'high',
        detectionSignals: ['Search and workflow depend on tags, classifications, or retention labels that users do not apply consistently.'],
        mitigations: ['Require metadata model, defaulting rules, lifecycle ownership, validation checks, and adoption proof'],
      },
      {
        id: 'doc-permission-sprawl',
        label: 'Permission and external-sharing sprawl',
        severity: 'critical',
        detectionSignals: ['Legacy folders, external links, inherited permissions, or unmanaged groups are migrated without review.'],
        mitigations: ['Require permission inventory, external-sharing review, access recertification, audit logs, and migration acceptance gates'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Stress records retention, legal hold, customer data, external sharing, audit trails, and supervisory review evidence.',
      },
      {
        industry: 'healthcare',
        modifier: 'Stress PHI access, retention, external collaboration, audit logs, consent-related records, and integration with clinical or administrative systems.',
      },
      {
        industry: 'public_sector',
        modifier: 'Stress public-records requests, retention schedules, accessibility, redaction, legal hold, and defensible search/export.',
      },
    ],
    body: `## Summary
Enterprise document and content management is not just a repository decision. It is an information-governance decision: how content is classified, secured, retained, found, shared, routed, audited, and eventually disposed of. A sourcing event should prove metadata discipline, permission governance, records retention, search quality, workflow behavior, line-of-business integration, and migration reliability before accepting productivity or compliance language.

## When to apply
Use this pattern when sourcing OpenText, Box, M-Files, Microsoft SharePoint/Purview patterns, Hyland, Laserfiche, DocuWare, or comparable enterprise content management and content-services platforms. Apply it during file-share cleanup, ECM replacement, records modernization, legal hold improvement, controlled-document programs, external collaboration redesign, document workflow automation, or content migration. Do not use it for QMS, CLM, DAM, LMS, or e-signature alone unless enterprise document governance is central.

## Category boundary
In scope: repositories, metadata, classification, search, permissions, external sharing, workflow, version control, records retention, legal hold, audit logs, capture/OCR adjacency, content migration, line-of-business integration, APIs, reporting, and exports. Adjacent but distinct: QMS, DAM, CLM, knowledge base, collaboration chat, e-signature, backup/archive, and BI.

## Lifecycle and gates
The scope gate should inventory repositories, content volume, records schedules, permission groups, external sharing, legal hold, migration sources, workflow needs, regulated content, and line-of-business systems. The RFP gate should require metadata model, search, security, records, workflow, migration, APIs, reporting, support, and retention controls. The proof gate should run upload, classification, permission, external share, workflow approval, search, retention, legal hold, audit, export, and migration-sample scenarios. The BAFO gate should normalize users, storage, modules, records features, capture/OCR, integrations, migration, governance, support, and renewal controls.

## Evaluation rubric
Weight information governance around 25 percent, permissions and security around 20 percent, search and retrieval around 15 percent, workflow/integration around 15 percent, migration quality around 15 percent, and commercial predictability around 10 percent. Increase governance weight when records, legal hold, regulatory evidence, or external sharing are material.

## Pricing and contract notes
Public OpenText, Box, and M-Files materials support capability framing around ECM, content services, document management, collaboration, workflow, and integration. They do not prove buyer-specific price, migration effort, storage cost, retrieval improvement, compliance savings, or adoption outcome. Contracting should define metadata ownership, records controls, legal hold, permission review, external sharing, migration acceptance, export rights, support, renewal controls, and transition assistance.

## Contradictions and failure modes
Vendor claim: users will find information faster. Detection: test buyer-like metadata, permissions, duplicates, archived content, and search behavior. Vendor claim: records retention is controlled. Detection: map retention classes, legal holds, exceptions, exports, and owner approvals. The common failure is migrating unmanaged content into a new tool without fixing ownership. The second is weak permission reconciliation. The third is treating AI search as a substitute for information architecture, retention policy, and content lifecycle governance.`
  },

];

export const SOURCING_CATEGORY_PATTERN_COUNT = SOURCING_CATEGORY_PATTERNS.length;
export const SOURCING_CATEGORY_PATTERN_IDS = SOURCING_CATEGORY_PATTERNS.map((pattern) => pattern.id);
