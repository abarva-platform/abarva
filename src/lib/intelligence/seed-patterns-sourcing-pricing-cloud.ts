import type { PatternSeed } from './seed-types';

const CLOUD_PRICING_LIFECYCLE_STAGES = [
  {
    id: 'Scope',
    label: 'Scope and consumption baseline',
    order: 1,
    description: 'Define account scope, workload families, regions, tags, commitments, shared services, support model, and the billing exports required for normalization.',
  },
  {
    id: 'MarketScan',
    label: 'Provider and channel scan',
    order: 2,
    description: 'Map public cloud providers, marketplace channels, reseller constructs, enterprise agreements, committed-use vehicles, and existing cloud-credit positions.',
  },
  {
    id: 'RFP',
    label: 'Normalized workload model',
    order: 3,
    description: 'Require each provider or channel partner to price the same workload baselines, growth scenarios, tagging model, network paths, storage classes, and support assumptions.',
  },
  {
    id: 'BAFO',
    label: 'Commercial normalization and BAFO',
    order: 4,
    description: 'Normalize list rates, private offers, commitments, credits, overage exposure, support, marketplace fees, currency, taxes, renewal rights, and exit costs before award.',
  },
  {
    id: 'Contracting',
    label: 'Contracting and cost governance',
    order: 5,
    description: 'Convert the chosen commercial model into billing-transparency obligations, export access, tagging enforcement, commitment governance, renewal controls, and transition rights.',
  },
];

export const SOURCING_PRICING_CLOUD_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-PRC-CLOUD-001',
    slug: 'cloud-consumption-pricing-normalization-enterprise-sourcing',
    title: 'Cloud Consumption Pricing Normalization for Enterprise Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise cloud sourcing fails when teams compare headline unit rates instead of normalizing workload shape, billing exports, commitments, network movement, storage behavior, support, marketplace treatment, and renewal exposure.',
    applicability:
      'Apply when sourcing, renewing, consolidating, or renegotiating AWS, Microsoft Azure, Google Cloud, reseller, marketplace, or multi-cloud consumption agreements where workload economics and governance evidence must be comparable.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.68,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://aws.amazon.com/pricing/',
      'https://aws.amazon.com/ec2/pricing/',
      'https://aws.amazon.com/s3/pricing/',
      'https://aws.amazon.com/savingsplans/compute-pricing/',
      'https://docs.aws.amazon.com/cur/latest/userguide/what-is-data-exports.html',
      'https://azure.microsoft.com/en-us/pricing/',
      'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/',
      'https://azure.microsoft.com/en-us/pricing/details/bandwidth/',
      'https://azure.microsoft.com/en-us/pricing/reservations/',
      'https://learn.microsoft.com/en-us/azure/cost-management-billing/automate/automation-ingest-usage-details-overview',
      'https://cloud.google.com/pricing',
      'https://cloud.google.com/compute/all-pricing',
      'https://cloud.google.com/storage/pricing',
      'https://cloud.google.com/compute/docs/instances/committed-use-discounts-overview',
      'https://cloud.google.com/billing/docs/how-to/export-data-bigquery',
    ],
    regulatoryChips: ['GDPR-if-person-data', 'HIPAA-if-PHI', 'DORA-if-regulated-financial-entity', 'data-residency-review'],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-003', 'PAT-SRC-CAT-CDW-001', 'PAT-SRC-CAT-FINOPS-001'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'pricing_intelligence',
    vendorClass: 'direct-tech',
    lifecycleStages: CLOUD_PRICING_LIFECYCLE_STAGES,
    vendorLandscape: [
      {
        vendorName: 'Amazon Web Services',
        tier: 'enterprise',
        positioning: 'Cloud provider and marketplace channel where compute, storage, data-transfer, Savings Plans, reserved constructs, support, and Cost and Usage data exports must be normalized by workload.',
        strengths: ['Broad service catalog', 'Public pricing pages', 'Native cost and usage export constructs'],
        cautions: ['Do not compare EC2, S3, data transfer, marketplace, and support economics without account-level usage, commitments, tags, and private-offer evidence.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'AWS Pricing', url: 'https://aws.amazon.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'AWS Data Exports', url: 'https://docs.aws.amazon.com/cur/latest/userguide/what-is-data-exports.html', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Microsoft Azure',
        tier: 'enterprise',
        positioning: 'Cloud provider and enterprise agreement channel where virtual machines, bandwidth, reservations, Azure savings plans, hybrid benefits, marketplace, and Cost Management cost details must be reconciled.',
        strengths: ['Enterprise agreement adjacency', 'Public service pricing pages', 'Cost Management export and cost-detail records'],
        cautions: ['Reservation, hybrid-benefit, support, currency, agreement, and negotiated-rate treatment must be explicit before claiming savings.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Azure Pricing', url: 'https://azure.microsoft.com/en-us/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure Cost Details', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/automate/automation-ingest-usage-details-overview', asOf: '2026-04-29' },
        ],
      },
      {
        vendorName: 'Google Cloud',
        tier: 'enterprise',
        positioning: 'Cloud provider where pay-as-you-go services, Compute Engine, Cloud Storage, networking, committed-use discounts, billing exports, and BigQuery-based cost analysis need workload-level proof.',
        strengths: ['Public pricing overview and price list', 'Billing export to BigQuery', 'Committed-use constructs for eligible workloads'],
        cautions: ['Sustained-use, committed-use, region, network, storage, support, and billing-account scope can change economics and must be normalized from buyer data.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'Google Cloud Pricing', url: 'https://cloud.google.com/pricing', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Cloud Billing Export to BigQuery', url: 'https://cloud.google.com/billing/docs/how-to/export-data-bigquery', asOf: '2026-04-29' },
        ],
      },
    ],
    pricingBenchmarks: [
      {
        label: 'Official cloud metering constructs only',
        model: 'usage-based',
        metric: 'Compute hours or resource usage, storage capacity and operations, data transfer, managed-service units, commitments, support, marketplace charges, and billing-export line items',
        sourceBasis: [
          { type: 'public-disclosure', label: 'AWS Pricing', url: 'https://aws.amazon.com/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure Pricing', url: 'https://azure.microsoft.com/en-us/pricing/', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Cloud Pricing', url: 'https://cloud.google.com/pricing', asOf: '2026-04-29' },
          { type: 'founder-data-gap', label: 'Private discounts, enterprise agreement concessions, cloud-credit treatment, committed-use coverage, support concessions, reseller margins, and workload-specific savings require buyer evidence' },
        ],
        confidence: 0.56,
        notes: 'Use public pricing pages to identify charge dimensions and official calculators at sourcing time. Do not persist volatile unit rates or claim provider savings without buyer billing exports and contract evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Billing export and auditability',
        buyerPosition: 'Require access to detailed cost, usage, price-sheet, commitment, credit, support, marketplace, and tag fields needed to reconcile invoices, forecast spend, and validate savings claims.',
        walkawayTriggers: ['Provider or reseller cannot supply exportable line-item detail sufficient for independent reconciliation.'],
        sourceBasis: [
          { type: 'public-disclosure', label: 'AWS Data Exports', url: 'https://docs.aws.amazon.com/cur/latest/userguide/what-is-data-exports.html', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Azure Cost Details', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/automate/automation-ingest-usage-details-overview', asOf: '2026-04-29' },
          { type: 'public-disclosure', label: 'Google Cloud Billing Export to BigQuery', url: 'https://cloud.google.com/billing/docs/how-to/export-data-bigquery', asOf: '2026-04-29' },
        ],
      },
      {
        clauseArea: 'Commitment governance and renewal protection',
        buyerPosition: 'Define who can buy commitments, how unused coverage is reported, how private offers interact with direct-provider pricing, and what happens at renewal, expiration, downsizing, divestiture, or workload migration.',
        walkawayTriggers: ['Unclear treatment of unused commitments', 'No exportable commitment utilization reporting', 'Renewal uplift or repricing rights are hidden in order terms'],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Workload-shape normalization',
        whenToUse: 'Use before RFP pricing and again before BAFO whenever vendors, resellers, or internal teams compare headline unit rates.',
        buyerAsk: 'Price the same baseline and growth cases for compute duty cycle, storage class, requests, network path, managed-service units, support, marketplace, backup, observability, and region footprint.',
        tradeoffs: ['A lower public unit rate can still lose when network movement, support, migration, operations, or commitment underutilization is included.'],
      },
      {
        lever: 'Commitment and credit separation',
        whenToUse: 'Use when committed spend, cloud credits, enterprise discounts, reseller margin, or marketplace private offers are presented as technical savings.',
        buyerAsk: 'Separate technical workload cost, funding mechanism, expiring credits, private discount, commitment coverage, and true run-rate exposure in the BAFO model.',
      },
      {
        lever: 'Billing-data proof',
        whenToUse: 'Use when the incumbent or challenger claims a savings case without supplying reconciliable evidence.',
        buyerAsk: 'Provide export schemas, sample line items, tag coverage, amortized and unblended views where applicable, and a mapping from proposal assumptions to invoice fields.',
      },
    ],
    riskFactors: [
      {
        id: 'cloud-pricing-headline-unit-rate-trap',
        label: 'Headline unit-rate trap',
        severity: 'high',
        detectionSignals: ['The business case compares only list rates, calculator screenshots, or discount percentages without billing exports, workload traces, support, marketplace, and network assumptions.'],
        mitigations: ['Require normalized workload cases and invoice-field mapping before BAFO', 'Run sensitivity cases for growth, region changes, storage behavior, and data transfer'],
        contractualRemedies: ['Savings validation exhibit', 'Billing export obligation', 'Renewal repricing review'],
      },
      {
        id: 'cloud-commitment-underutilization',
        label: 'Commitment underutilization',
        severity: 'high',
        detectionSignals: ['Commitment purchase is sized from aspirational migration plans rather than measured steady-state workloads and governance rights.'],
        mitigations: ['Stage commitments by workload maturity', 'Assign commitment owners', 'Track coverage and utilization against exported usage'],
        contractualRemedies: ['Commitment governance schedule', 'Downsize or exchange rights where available', 'Unused-coverage reporting'],
      },
      {
        id: 'cloud-egress-and-shared-service-blind-spot',
        label: 'Network and shared-service blind spot',
        severity: 'medium',
        detectionSignals: ['Data-transfer, observability, backups, security tooling, logging, support, and marketplace charges are excluded from the sourcing comparison.'],
        mitigations: ['Model network paths and shared services explicitly', 'Require chargeback tags and service-owner signoff'],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier: 'Add third-party risk, exit, audit, resilience, regional processing, key-management, and concentration-risk review before approving long commitments.',
        regulatoryRefs: ['DORA where applicable to EU financial entities'],
      },
      {
        industry: 'healthcare',
        modifier: 'Separate PHI workloads and require BAA, encryption, access, audit, backup, and data-residency evidence before using generic cloud economics.',
        additionalRequirements: ['PHI workload inventory', 'BAA posture', 'Audit-log retention plan'],
      },
      {
        industry: 'retail_cpg',
        modifier: 'Model seasonal peaks, loyalty workloads, ecommerce traffic, inventory analytics, CDN/cache behavior, and marketplace data flows separately from steady-state run rate.',
        affectedStages: ['Scope', 'RFP', 'BAFO'],
      },
    ],
    body: `## Summary
Cloud consumption pricing normalization is the discipline of turning variable cloud usage into a sourcing-grade commercial model. It is not a generic FinOps dashboard and it is not a one-time calculator exercise. The pattern is needed when AWS, Azure, Google Cloud, a reseller, a marketplace private offer, or an enterprise agreement is being compared or renewed and the buyer must prove what the commercial decision means for real workloads.

## When to apply
Use this pattern for enterprise cloud renewals, provider consolidations, migration sourcing, marketplace channel decisions, reseller competitions, commitment purchases, or multi-cloud cost resets. It is especially relevant when a stakeholder claims that one provider is cheaper, that a commitment will create savings, or that credits make a migration attractive. Those claims are not decision-grade until they can be traced to workload assumptions, billing exports, contract terms, and operational controls.

## Category boundary
In scope: compute, containers, serverless, managed databases, object storage, block storage, backup, observability, data transfer, CDN, support, marketplace purchases, reseller margin, taxes and currency treatment, cloud credits, reservations, savings plans, committed-use discounts, private offers, and billing-export fields. Out of scope: pure technical architecture selection without commercial terms, generic chargeback design without sourcing action, and application modernization value cases that do not depend on cloud pricing evidence.

## How it works
Start with a consumption baseline. The buyer should identify accounts, subscriptions, billing accounts, projects, regions, tags, workload owners, support levels, marketplace purchases, existing commitments, expiring credits, and shared services. Then normalize the workload model rather than the vendor logo. A representative model should include steady-state compute, burst compute, storage growth, storage access patterns, database and managed-service units, network paths, backup, logging, monitoring, security services, and support.

The RFP should require each provider or channel partner to price the same model and identify which assumptions are public list price, private discount, expiring credit, commitment coverage, reseller treatment, or founder-data-gap. The BAFO model should keep those layers separate. A credit is not a unit-cost reduction. A commitment is not savings unless utilization and coverage are governed. A marketplace private offer is not a technical advantage unless its commercial treatment survives renewal and exit.

## Pricing and evidence notes
Public cloud pricing pages are useful for identifying charge dimensions, service meters, calculator inputs, and commitment constructs. They should not be used to publish a single benchmark that says a provider is cheapest. The buyer needs billing exports and price sheets to reconcile actual usage, negotiated rates, credits, taxes, support, and marketplace charges. AWS Data Exports and Cost and Usage Report constructs, Azure Cost Management cost details, and Google Cloud Billing export to BigQuery are examples of evidence channels that can support reconciliation, but the sourcing event still needs access, schema, tag quality, and invoice mapping.

## Contracting and governance
Contract terms should require exportable cost and usage detail, commitment utilization reporting, tag and account governance, renewal notice, pricing-change notice, support-level clarity, marketplace treatment, credit-expiration transparency, and transition assistance. If the buyer accepts a longer commitment, the contract should identify the owner, workload coverage assumptions, review cadence, and remedies for major architecture, divestiture, region, or regulatory changes.

## Contradictions and failure modes
Vendor claim: our cloud is lower cost. Detection: compare the same workload across compute, storage, network, support, marketplace, commitments, credits, and operational burden. Vendor claim: a commitment guarantees savings. Detection: inspect utilization, coverage, workload volatility, renewal terms, and governance rights. Vendor claim: credits make migration economical. Detection: separate temporary funding from durable run-rate economics.

The common failure is collapsing public list price, private discounts, cloud credits, and workload migration assumptions into one savings number. The second failure is buying a commitment before the workloads are stable enough to consume it. The third failure is excluding data transfer, support, observability, security tooling, backups, and shared services from the comparison. This pattern keeps the sourcing decision conservative until the commercial model is traceable to official pricing constructs and buyer-specific billing evidence.`,
  },
];
