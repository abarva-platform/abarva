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
];

export const SOURCING_CATEGORY_PATTERN_COUNT = SOURCING_CATEGORY_PATTERNS.length;
export const SOURCING_CATEGORY_PATTERN_IDS = SOURCING_CATEGORY_PATTERNS.map((pattern) => pattern.id);
