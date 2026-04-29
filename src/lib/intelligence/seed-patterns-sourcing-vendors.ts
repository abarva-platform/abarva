import type { PatternSeed } from './seed-types';

export const SOURCING_VENDOR_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-VEN-MICROSOFT-001',
    slug: 'microsoft-enterprise-sourcing-profile',
    title: 'Microsoft Enterprise Sourcing Profile',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Microsoft sourcing must be treated as a portfolio, licensing, and consumption-governance decision because Microsoft 365, Azure, Dynamics 365, security, Copilot, and channel agreements can shift cost and lock-in across product boundaries.',
    applicability:
      'Apply when sourcing, renewing, expanding, rationalizing, or benchmarking Microsoft enterprise agreements, Microsoft 365, Azure, Dynamics 365, Microsoft Security, Copilot, Power Platform, Windows Enterprise, or mixed Microsoft cloud and software estates.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://www.microsoft.com/investor/reports/ar25/index.html',
      'https://www.microsoft.com/en-us/licensing/licensing-programs/enterprise',
      'https://www.microsoft.com/licensing/terms/welcome/welcomepage',
      'https://www.microsoft.com/en-us/Licensing/how-to-buy/microsoft-customer-agreement',
      'https://www.microsoft.com/en-us/microsoft-365/enterprise/e3',
      'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise',
      'https://www.microsoft.com/en/dynamics-365/pricing-overview',
      'https://azure.microsoft.com/en-us/pricing/offers/reservations',
    ],
    regulatoryChips: ['GDPR-if-personal-data', 'DORA-if-regulated-financial-entity', 'Data-residency-review', 'AI-governance-review'],
    relatedPatternIds: ['PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-ERP-001', 'PAT-SRC-CAT-CRM-001', 'PAT-SRC-CAT-IAM-001', 'PAT-SRC-CAT-FINOPS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'enterprise_saas',
    vendorClass: 'direct-tech',
    vendorLandscape: [
      {
        vendorName: 'Microsoft enterprise portfolio',
        tier: 'enterprise',
        positioning:
          'Strategic incumbent spanning productivity, collaboration, Windows, identity, security, Azure, Dynamics 365, Power Platform, GitHub, LinkedIn, and Copilot motions.',
        strengths: [
          'Broad commercial cloud and software portfolio',
          'Enterprise Agreement, Microsoft Customer Agreement, direct, CSP, and partner-assisted buying paths',
          'Native adjacency across productivity, identity, endpoint, security, data, and cloud consumption',
        ],
        cautions: [
          'Commercial leverage can move across suites, add-ons, Azure commitments, reservation posture, and renewal timing',
          'Public pricing is list-price orientation and does not prove buyer net price or ELA economics',
          'SKU, tenant, region, AI, storage, and consumption boundaries must be normalized before award or renewal',
        ],
        sourceBasis: [
          { type: 'regulatory-document', label: 'Microsoft 2025 Annual Report commercial portfolio and financial review', url: 'https://www.microsoft.com/investor/reports/ar25/index.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Enterprise Agreement program page', url: 'https://www.microsoft.com/en-us/licensing/licensing-programs/enterprise', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Customer Agreement page', url: 'https://www.microsoft.com/en-us/Licensing/how-to-buy/microsoft-customer-agreement', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft 365 and Microsoft 365 Copilot',
        tier: 'enterprise',
        positioning:
          'Enterprise productivity, collaboration, identity, endpoint, compliance, analytics, and AI assistant stack with public plan pages and qualifying-license dependencies for Copilot.',
        strengths: ['Suite adjacency', 'Security and compliance packaging', 'Copilot integration into Microsoft 365 work surfaces'],
        cautions: ['Teams/no-Teams packaging, qualifying-license rules, AI agent usage, storage, audit, and premium compliance must be separated in the price model'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 E3 enterprise pricing page', url: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/e3', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft 365 Copilot enterprise pricing page', url: 'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer-specific Copilot adoption, included feature entitlement, AI agent usage, discount, and renewal benchmark data require order-form or billing evidence' },
        ],
      },
      {
        vendorName: 'Microsoft Azure',
        tier: 'enterprise',
        positioning:
          'Consumption cloud platform where sourcing outcomes depend on workload forecast quality, reservation or savings-plan governance, hybrid benefit assumptions, marketplace spend, support, and FinOps controls.',
        strengths: ['Large cloud and AI infrastructure footprint', 'Reservation and savings commitment options', 'Integrated identity, security, data, and developer ecosystem'],
        cautions: ['Commitment discounts can be overwhelmed by workload growth, idle resources, currency, support, egress, marketplace, or AI consumption if usage governance is weak'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Azure Reservations pricing page', url: 'https://azure.microsoft.com/en-us/pricing/offers/reservations', asOf: '2026-04-29' },
          { type: 'regulatory-document', label: 'Microsoft 2025 Annual Report cloud and Azure revenue discussion', url: 'https://www.microsoft.com/investor/reports/ar25/index.html', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer-specific Azure consumption, committed-spend yield, reseller margin, EA/SCE concession, and overage exposure require billing exports and agreement evidence' },
        ],
      },
      {
        vendorName: 'Dynamics 365 and Power Platform adjacency',
        tier: 'enterprise',
        positioning:
          'Business applications and low-code platform adjacent to Microsoft identity, productivity, analytics, and Azure estates.',
        strengths: ['CRM, ERP, customer service, finance, supply chain, and low-code adjacency', 'Public Dynamics pricing navigation and licensing resources'],
        cautions: ['App attach, environment, storage, Dataverse, connector, AI, and implementation-partner assumptions must be modeled separately from Microsoft 365 or Azure commitments'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Dynamics 365 pricing overview', url: 'https://www.microsoft.com/en/dynamics-365/pricing-overview', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer-specific Dynamics attach pricing, implementation scope, partner services, and renewal concessions require quotes or contract data' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Microsoft 365 public list-price anchors only',
        model: 'subscription',
        metric: 'Named user by suite, with Teams/no-Teams and add-on distinctions',
        currency: 'USD',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 E3 enterprise plan page', url: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/e3', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft 365 Copilot enterprise pricing page', url: 'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise', asOf: '2026-04-29' },
        ],
        confidence: 0.72,
        notes:
          'Use official public plan pages to identify packaging and current list-price orientation only. Do not infer enterprise net price, discount, renewal uplift, reseller margin, or ELA economics from public pricing.',
      },
      {
        label: 'Azure commitment and reservation orientation only',
        model: 'usage-based',
        metric: 'Consumption, reservations, savings plans, and workload-specific commitments',
        sourceBasis: [
          { type: 'public-disclosure', label: 'Azure Reservations pricing page', url: 'https://azure.microsoft.com/en-us/pricing/offers/reservations', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Actual utilization, amortized savings, committed-spend burn-down, and overage risk require buyer Azure billing exports' },
        ],
        confidence: 0.68,
        notes:
          'Microsoft publishes reservation and savings examples, but actual savings vary by workload, region, term, currency, utilization, hybrid benefit, and billing arrangement.',
      },
    ],
    negotiationLevers: [
      {
        lever: 'Portfolio normalization before renewal close',
        whenToUse:
          'Use when Microsoft, an LSP, or a CSP presents Microsoft 365, Azure, Dynamics, Security, Power Platform, Copilot, or support changes in separate commercial threads.',
        buyerAsk:
          'Require one normalized workbook covering current entitlements, active users, inactive users, workload owners, suite step-ups, add-ons, Azure commitments, reservations, support, partner margin, renewal dates, and all proposed concessions.',
        vendorGive:
          'Vendor can preserve strategic-suite expansion while making price protection, migration support, or add-on credits conditional on transparent adoption and consumption gates.',
        tradeoffs: ['Portfolio leverage can improve economics but can also reduce optionality if the buyer accepts minimum commitments without downsizing, substitution, and exit rights.'],
        evidenceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Enterprise Agreement program page', url: 'https://www.microsoft.com/en-us/licensing/licensing-programs/enterprise', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Product Terms', url: 'https://www.microsoft.com/licensing/terms/welcome/welcomepage', asOf: '2026-04-29' },
        ],
      },
      {
        lever: 'Azure commitment rightsizing and utilization proof',
        whenToUse:
          'Use before committing to Azure growth, renewing SCE/EA cloud commitments, or accepting reservation/savings-plan assumptions.',
        buyerAsk:
          'Tie any committed spend to a workload migration plan, accountable owners, monthly utilization reporting, reservation exchange/cancellation treatment, hybrid benefit assumptions, and overage governance.',
        vendorGive:
          'Vendor can offer price protection, migration credits, architecture support, or workload-specific commitments without guaranteeing buyer utilization.',
        tradeoffs: ['Lower unit pricing may be offset by stranded commitment if workloads slip, downsize, move to another cloud, or consume different services than forecast.'],
        evidenceBasis: [
          { type: 'public-disclosure', label: 'Azure Reservations pricing page', url: 'https://azure.microsoft.com/en-us/pricing/offers/reservations', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer-specific Azure utilization and commitment yield require billing export evidence' },
        ],
      },
      {
        lever: 'Copilot phased adoption gate',
        whenToUse:
          'Use when Copilot is proposed as an enterprise-wide add-on before the buyer has measured readiness, permissions hygiene, training, and adoption.',
        buyerAsk:
          'Convert Copilot expansion into staged cohorts with success metrics, license reallocation rights, AI/data governance controls, agent usage visibility, and no automatic uplift for unadopted seats.',
        vendorGive:
          'Vendor can support pilot enablement, adoption planning, or temporary ramp structures while preserving the strategic Copilot expansion path.',
        tradeoffs: ['Phasing can slow enterprise standardization, but it reduces shelfware and governance risk while the buyer validates value.'],
        evidenceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 Copilot enterprise pricing page', url: 'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Buyer-specific Copilot usage, outcome measurement, and ELA benchmark data require tenant analytics and contract evidence' },
        ],
      },
    ],
    riskFactors: [
      {
        id: 'microsoft-portfolio-shelfware',
        label: 'Portfolio shelfware and add-on sprawl',
        severity: 'high',
        detectionSignals: [
          'Proposed suite step-up is justified by feature breadth rather than active-user need',
          'Inactive, duplicate, frontline, contractor, shared-mailbox, and service-account populations are not separated',
          'Security, compliance, Power Platform, Teams, Phone, Copilot, or Dynamics add-ons are bundled without owner-level adoption evidence',
        ],
        mitigations: ['Run entitlement-to-usage reconciliation', 'Separate baseline suite, optional add-ons, and future expansion', 'Require adoption gates and reallocation rights'],
        contractualRemedies: ['Downsize rights', 'SKU substitution rights', 'Ramp schedules', 'Renewal price protection', 'Usage reporting commitments'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 E3 enterprise plan page', url: 'https://www.microsoft.com/en-us/microsoft-365/enterprise/e3', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'microsoft-azure-commitment-underutilization',
        label: 'Azure commitment underutilization or unmanaged overage',
        severity: 'high',
        detectionSignals: [
          'Commitment is negotiated before workload migration dates and owners are approved',
          'Reservation or savings plan assumptions are not reconciled to actual region, instance, term, or workload behavior',
          'Marketplace, support, AI consumption, egress, storage, or dev/test usage is missing from the baseline',
        ],
        mitigations: ['Require FinOps baseline', 'Review amortized commitment utilization monthly', 'Tie growth concessions to workload proof'],
        contractualRemedies: ['Commitment ramp', 'Service-specific carveouts', 'Reservation governance exhibit', 'Transition and cancellation treatment review'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Azure Reservations pricing page', url: 'https://azure.microsoft.com/en-us/pricing/offers/reservations', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'microsoft-licensing-term-drift',
        label: 'Licensing term and use-right drift',
        severity: 'medium',
        detectionSignals: [
          'Order forms, Product Terms, Online Services terms, service descriptions, and channel documents are not reviewed together',
          'Buyer assumes historic rights carry forward after moving from EA to MCA, CSP, or subscription licensing',
          'Product renames or packaging changes are accepted without entitlement mapping',
        ],
        mitigations: ['Capture dated Product Terms references', 'Map legacy entitlements to renewal SKUs', 'Require legal/licensing review before signature'],
        contractualRemedies: ['Entitlement exhibit', 'Order-of-precedence language', 'Transition assistance', 'Non-regression or substitute-SKU review process'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft Product Terms', url: 'https://www.microsoft.com/licensing/terms/welcome/welcomepage', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Microsoft Customer Agreement page', url: 'https://www.microsoft.com/en-us/Licensing/how-to-buy/microsoft-customer-agreement', asOf: '2026-04-29' },
        ],
      },
      {
        id: 'microsoft-ai-data-governance-gap',
        label: 'AI, tenant data, and agent governance gap',
        severity: 'medium',
        detectionSignals: [
          'Copilot purchase precedes sensitivity-label, permissions, retention, and audit readiness review',
          'Agent usage is treated as included without Azure or Copilot Studio capacity assumptions',
          'Business-value case lacks cohort-level measurement and change-management owner',
        ],
        mitigations: ['Stage Copilot cohorts', 'Validate data-permission hygiene', 'Document AI feature boundaries and usage meters', 'Define value metrics before expansion'],
        contractualRemedies: ['Pilot-to-expand gate', 'Usage reporting', 'Data protection exhibit', 'AI governance addendum where required'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Microsoft 365 Copilot enterprise pricing page', url: 'https://www.microsoft.com/en-us/microsoft-365-copilot/pricing/enterprise', asOf: '2026-04-29' },
        ],
      },
    ],
    body: `## Summary
Microsoft is not a single-category supplier for most enterprise buyers. It is a portfolio vendor spanning productivity, collaboration, Windows, identity, endpoint management, security, compliance, Azure, data and AI services, Dynamics 365, Power Platform, GitHub, LinkedIn, and Copilot. Microsoft describes its commercial business as including Microsoft 365 Commercial, Azure and other cloud services, Dynamics products and cloud services, the commercial portion of LinkedIn, and enterprise and partner services. The practical sourcing implication is that a Microsoft renewal is rarely just a price negotiation on one SKU. It is a cross-portfolio decision about user roles, cloud consumption, AI adoption, security architecture, channel path, product terms, renewal timing, and switching cost.

## Public-source posture
Official public sources support several safe claims. Microsoft publishes annual reporting that shows the breadth of its commercial portfolio and the scale of Microsoft Cloud, Microsoft 365 Commercial, Dynamics 365, and Azure growth. Microsoft publishes Enterprise Agreement guidance describing a program for organizations that want to license cloud services and software under one agreement for a minimum three-year period. Microsoft also publishes the Microsoft Customer Agreement as a non-expiring purchasing agreement available directly and through partners, Product Terms for use rights, public Microsoft 365 plan pages, Microsoft 365 Copilot enterprise pricing pages, Dynamics 365 pricing navigation, and Azure reservation guidance. These sources are valid orientation evidence. They are not proof of a buyer's net price, discount depth, reseller margin, ELA benchmark, renewal concession, migration credit, or true-up outcome.

## Sourcing boundary
Use this profile when Microsoft is the incumbent, finalist, or strategic expansion vendor for enterprise SaaS and cloud scope. In scope: Microsoft 365 E3/E5, Office 365, Teams packaging, Exchange, SharePoint, OneDrive, Entra, Intune, Defender, Purview, Power BI, Power Platform, Dynamics 365, Azure, GitHub, Windows Enterprise, Copilot, support, partner services, cloud commitments, reservations, savings plans, and channel-commercial structure. Out of scope: generic laptop purchasing, non-Microsoft implementation partner selection, and independent security or CRM events unless the Microsoft commercial decision changes the award path.

## Commercial model
The evaluation must separate five layers. First, the user-subscription layer: named workers, frontline workers, contractors, service accounts, shared mailboxes, disabled accounts, privileged admins, and excluded populations. Second, the add-on layer: security, compliance, Teams Phone, Power Platform, storage, audit, Power BI, Copilot, and Dynamics attach. Third, the Azure consumption layer: committed spend, reservations, savings plans, hybrid benefit assumptions, support, marketplace, egress, storage, AI services, and overage. Fourth, the agreement layer: EA, MCA, CSP, LSP, direct seller, renewal anniversary, true-up, term length, currency, taxes, and order-of-precedence. Fifth, the operating layer: tenant readiness, permissions hygiene, migration schedule, workload owners, FinOps controls, adoption measurement, and decommission plan.

## Negotiation posture
The strongest buyer posture is a single Microsoft baseline workbook before any strategic concession discussion. The workbook should reconcile current entitlements, active usage, inactive usage, planned hires and exits, region/country population, product-by-product owner, add-on adoption, Azure actuals, reservation utilization, marketplace purchases, support costs, and renewal dates. It should then model the vendor proposal as separate deltas: baseline renewal, suite step-up, add-on expansion, Azure commitment, Copilot rollout, Dynamics/Power Platform expansion, support, partner services, and credits. This avoids the classic failure where a discount on one layer masks unused spend or new commitment on another layer.

## Risk controls
Do not accept list-price pages as benchmark evidence for enterprise net pricing. Public Microsoft pricing can identify packaging and current list-price orientation, but buyer-specific economics require order forms, quotes, invoices, reseller bids, billing exports, and approved benchmark data. Do not assume EA, MCA, or CSP terms are interchangeable. Product Terms, order forms, service descriptions, and channel terms must be reviewed as a dated evidence set. Do not buy Copilot enterprise-wide until permissions, sensitivity labels, retention, audit, training, and value measurement are ready. Do not increase Azure commitment until workload owners, migration dates, reservation strategy, and monthly FinOps reporting are approved.

## TODO / founder-data-gap
AbarVa still needs buyer-specific Microsoft discount and ELA benchmark data before it can publish numeric guidance beyond official public list-price orientation. Required evidence includes current Microsoft order forms, EA/MCA/CSP documents, LSP or reseller quotes, Microsoft 365 license exports, Azure consumption and amortized reservation reports, renewal proposal history, Copilot adoption telemetry, true-up invoices, concession logs, and any approved third-party benchmark dataset. Until that evidence exists, keep discount ranges, renewal uplift norms, committed-spend yield, ELA competitiveness, and private reseller economics marked founder-data-gap.`,
  },
];
