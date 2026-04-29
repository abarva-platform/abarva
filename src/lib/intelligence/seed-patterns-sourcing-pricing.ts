import type { PatternSeed, SourceBasisRef } from './seed-types';

const AWS_SAAS_CONTRACTS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'AWS Marketplace SaaS contract pricing documentation',
  url: 'https://docs.aws.amazon.com/marketplace/latest/userguide/saas-contracts.html',
  asOf: '2026-04-29',
  note: 'Documents contract entitlements, pricing dimensions, pay-as-you-go additional usage, upgrades, renewal settings, and contract-end metering behavior.',
};

const STRIPE_USAGE_BASED_BILLING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Stripe usage-based billing documentation',
  url: 'https://docs.stripe.com/billing/subscriptions/usage-based',
  asOf: '2026-04-29',
  note: 'Documents SaaS usage-based billing, recording usage, billing credits, and usage threshold monitoring.',
};

const STRIPE_PRICING_PLANS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Stripe advanced usage-based pricing plans documentation',
  url: 'https://docs.stripe.com/billing/subscriptions/usage-based/pricing-plans',
  asOf: '2026-04-29',
  note: 'Documents complex pricing plans that combine rate cards, license fees, recurring credit grants, flat fees, overages, and metered items.',
};

const MICROSOFT_PRODUCT_TERMS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Microsoft Product Terms - Program Agreement Supplemental Terms',
  url: 'https://www.microsoft.com/licensing/terms/en-US/product/ProgramAgreementSupplementalTerms/all',
  asOf: '2026-04-29',
  note: 'Documents online services auto-renewal, opt-out timing, coterminosity, prorated first-term charges, and price-level governance in public licensing terms.',
};

export const SOURCING_PRICING_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-SRC-PRC-SAAS-001',
    slug: 'saas-pricing-architecture-normalization-for-enterprise-sourcing',
    title: 'SaaS Pricing Architecture Normalization for Enterprise Sourcing',
    domain: 'sourcing',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise SaaS decisions become defensible when pricing is normalized as an architecture of entitlements, billable metrics, bundles, overages, renewal mechanics, and AI usage lines rather than as a single vendor headline number.',
    applicability:
      'Apply to enterprise SaaS selection, incumbent renewal, consolidation, marketplace private offer review, AI-enabled SaaS expansion, or BAFO comparison when vendors use different seat, usage, bundle, credit, support, and renewal structures.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex-prc-1',
    createdAt: '2026-04-29',
    instanceCount: 0,
    sourceDocuments: [
      'https://docs.aws.amazon.com/marketplace/latest/userguide/saas-contracts.html',
      'https://docs.stripe.com/billing/subscriptions/usage-based',
      'https://docs.stripe.com/billing/subscriptions/usage-based/pricing-plans',
      'https://www.microsoft.com/licensing/terms/en-US/product/ProgramAgreementSupplementalTerms/all',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-SRC-001', 'PAT-SRC-002', 'PAT-SRC-003'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: 'pricing_intelligence',
    vendorClass: 'direct-tech',
    pricingBenchmarks: [
      {
        label: 'Contract entitlement plus additional usage architecture',
        model: 'hybrid',
        metric: 'Committed entitlement dimensions with separately governed additional usage',
        sourceBasis: [AWS_SAAS_CONTRACTS],
        confidence: 0.82,
        notes:
          'Qualitative benchmark only. Normalize whether each vendor separates entitlement, duration, pricing dimension, additional usage, renewal settings, and contract-end metering obligations. Do not infer market discount levels from this source.',
      },
      {
        label: 'Usage-based billing control architecture',
        model: 'usage-based',
        metric: 'Metered item, usage record, threshold alert, credit, and rate-card governance',
        sourceBasis: [STRIPE_USAGE_BASED_BILLING, STRIPE_PRICING_PLANS],
        confidence: 0.8,
        notes:
          'Qualitative benchmark only. Normalize billing design components such as rate cards, recurring fees, credits, packaged units, overages, and alerts before comparing vendor economics.',
      },
      {
        label: 'Renewal and term governance architecture',
        model: 'subscription',
        metric: 'Auto-renewal, opt-out, coterminosity, prorated term, and price-level treatment',
        sourceBasis: [MICROSOFT_PRODUCT_TERMS],
        confidence: 0.74,
        notes:
          'Qualitative benchmark only. Use public licensing terms to frame renewal controls and term-alignment questions; actual uplift caps, renewal pricing, and discount protections require buyer-specific contract evidence.',
      },
    ],
    standardClauses: [
      {
        clauseArea: 'Pricing metric and entitlement schedule',
        buyerPosition:
          'Attach a controlled schedule that names every billable metric, entitlement, edition, bundle, optional module, support tier, integration limit, API limit, storage limit, sandbox, tenant, region, and usage dimension before BAFO scoring.',
        fallbackPosition:
          'If the vendor will not expose full commercial architecture, require a binding order-form exhibit that lists included and excluded charge lines and states which dimensions can create incremental charges.',
        walkawayTriggers: [
          'Vendor refuses to identify the billable metric for a material product capability.',
          'Order form contains bundled charges that cannot be decomposed into entitlement, usage, support, services, and AI lines.',
        ],
        sourceBasis: [AWS_SAAS_CONTRACTS, STRIPE_PRICING_PLANS],
      },
      {
        clauseArea: 'Overage, true-up, and usage verification',
        buyerPosition:
          'Define how additional usage is measured, when it is rated, which source of usage truth controls disputes, whether alerts are required before chargeable thresholds, and how final usage is handled at contract end or cancellation.',
        fallbackPosition:
          'Allow usage-based expansion only when the buyer can audit usage events, receive threshold alerts, and reconcile invoice lines to a named meter or entitlement dimension.',
        walkawayTriggers: [
          'Additional usage can be billed without a documented metric, threshold notice, or invoice-level usage trace.',
          'The vendor cannot explain end-of-term or cancellation metering obligations for chargeable usage.',
        ],
        sourceBasis: [AWS_SAAS_CONTRACTS, STRIPE_USAGE_BASED_BILLING],
      },
      {
        clauseArea: 'Renewal uplift and auto-renewal governance',
        buyerPosition:
          'Require renewal notice, opt-out timing, term alignment, renewal price basis, SKU substitution rights, downgrade rights, and treatment of renamed or replaced products to be explicit before award.',
        fallbackPosition:
          'If the supplier requires auto-renewal, the buyer should preserve timely opt-out rights, renewal-setting visibility, and a documented renewal quote process tied to the normalized metric schedule.',
        walkawayTriggers: [
          'Renewal pricing can change without notice, metric continuity, or an auditable basis.',
          'The buyer cannot reduce, substitute, or re-baseline quantities at renewal despite material usage changes.',
        ],
        sourceBasis: [AWS_SAAS_CONTRACTS, MICROSOFT_PRODUCT_TERMS],
      },
      {
        clauseArea: 'AI usage-line isolation',
        buyerPosition:
          'Separate AI assistants, model calls, credits, tokens, premium automations, generated content, and AI data-retention terms from base SaaS seats so evaluation can test adoption value and runaway usage risk independently.',
        fallbackPosition:
          'If AI is bundled into an edition, require an exhibit identifying included AI functions, metering basis, chargeable overflow events, alerting, data-use posture, and controls for disabling or limiting consumption.',
        walkawayTriggers: [
          'AI usage is embedded in the platform price but can later become a separately metered charge without buyer approval.',
          'The vendor cannot separate AI usage economics from base subscription, support, implementation, or data-processing terms.',
        ],
        sourceBasis: [STRIPE_PRICING_PLANS],
      },
    ],
    negotiationLevers: [
      {
        lever: 'Metric normalization workbook before price comparison',
        whenToUse:
          'Use before finalist scoring whenever vendors price on different named-user, active-user, consumption, event, storage, transaction, workflow, credit, or bundle structures.',
        buyerAsk:
          'Require every finalist to complete the same pricing architecture workbook with entitlement definitions, included limits, chargeable overages, renewal treatment, and AI usage lines separated from base subscription.',
        tradeoffs: [
          'This can slow BAFO, but it prevents a low headline subscription from hiding expensive overages, mandatory add-ons, or renewal exposure.',
        ],
        evidenceBasis: [AWS_SAAS_CONTRACTS, STRIPE_PRICING_PLANS],
      },
      {
        lever: 'Bundle decomposition in exchange for award certainty',
        whenToUse:
          'Use when an incumbent or strategic suite vendor offers a broad bundle, private offer, or enterprise agreement but the buyer cannot tell which economics attach to which product line.',
        buyerAsk:
          'Offer volume, term, or award timing only after the vendor provides a line-item decomposition of core subscription, optional modules, support, implementation services, data storage, API access, marketplace fees, and AI consumption.',
        tradeoffs: [
          'Decomposition may reduce vendor packaging flexibility, but it gives the buyer a renewal baseline and a clean exit or downgrade map.',
        ],
        evidenceBasis: [MICROSOFT_PRODUCT_TERMS],
      },
      {
        lever: 'Overage guardrail for pilot-to-scale transition',
        whenToUse:
          'Use when the commercial case assumes adoption growth, AI feature expansion, or increased transaction volume after launch.',
        buyerAsk:
          'Require threshold alerts, temporary caps, usage dashboards, dispute windows, and a conversion path from exploratory usage to committed entitlement before chargeable scale-up.',
        tradeoffs: [
          'Usage caps protect budget but can limit adoption if operational owners are not prepared to approve legitimate expansion quickly.',
        ],
        evidenceBasis: [STRIPE_USAGE_BASED_BILLING, STRIPE_PRICING_PLANS],
      },
    ],
    riskFactors: [
      {
        id: 'saas-pricing-metric-mismatch',
        label: 'Pricing metric mismatch across finalists',
        severity: 'high',
        detectionSignals: [
          'One vendor prices named users while another prices active users, events, transactions, credits, or data volume.',
          'The scorecard compares total subscription lines without normalizing included limits and chargeable usage.',
          'The buyer cannot map each invoice line to a business owner, system owner, or usage source.',
        ],
        mitigations: [
          'Create a metric normalization workbook before BAFO scoring.',
          'Require vendors to define the system of record for each billable metric.',
          'Separate adoption scenarios from committed entitlements and discretionary overages.',
        ],
        contractualRemedies: ['Metric schedule exhibit', 'Usage audit rights', 'Invoice traceability requirement'],
        sourceBasis: [AWS_SAAS_CONTRACTS, STRIPE_USAGE_BASED_BILLING],
      },
      {
        id: 'saas-bundle-cross-subsidy',
        label: 'Bundle cross-subsidy and renewal lock-in',
        severity: 'high',
        detectionSignals: [
          'Vendor offers a suite bundle but will not price core platform, optional modules, support, AI, or storage separately.',
          'Discounted bundle economics disappear if a low-value module is removed at renewal.',
          'Product names, editions, or SKU boundaries can change without preserving buyer substitution rights.',
        ],
        mitigations: [
          'Require bundle decomposition and SKU continuity before final award.',
          'Negotiate downgrade, substitution, and replaced-product treatment at renewal.',
          'Keep AI and premium usage modules isolated from base seat economics.',
        ],
        contractualRemedies: ['Bundle decomposition exhibit', 'SKU substitution language', 'Renewal baseline schedule'],
        sourceBasis: [MICROSOFT_PRODUCT_TERMS, STRIPE_PRICING_PLANS],
      },
      {
        id: 'saas-ai-usage-runaway',
        label: 'Uncontrolled AI or usage-based charge expansion',
        severity: 'medium',
        detectionSignals: [
          'AI credits, model usage, automation runs, or generated-content limits are embedded in marketing language rather than the commercial schedule.',
          'No alerting or approval path exists before usage exceeds included entitlements.',
          'Pilot adoption assumptions are used to justify enterprise pricing without a scale-up control model.',
        ],
        mitigations: [
          'Isolate AI and usage lines from base subscription pricing.',
          'Require threshold alerts, dashboards, and approval checkpoints for chargeable usage growth.',
          'Define usage dispute evidence and charge freeze rights before production rollout.',
        ],
        contractualRemedies: ['AI usage exhibit', 'Threshold alert covenant', 'Charge-dispute process'],
        sourceBasis: [STRIPE_USAGE_BASED_BILLING, STRIPE_PRICING_PLANS],
      },
    ],
    industryVariants: [
      {
        industry: 'financial_services',
        modifier:
          'Elevate auditability, exit, resilience, data-location, and outsourcing-review requirements when SaaS pricing lines map to regulated processes or critical third-party services.',
        additionalRequirements: [
          'Invoice-to-usage audit trail',
          'Exit-cost scenario for each module and usage line',
          'Named owner for approving AI or usage-based expansion',
        ],
      },
      {
        industry: 'healthcare',
        modifier:
          'Separate PHI-touching modules, AI features, storage, integrations, and support access so privacy review and business associate obligations are not hidden inside a generic SaaS bundle.',
        additionalRequirements: ['PHI boundary by charge line', 'AI data-use review', 'Support access and audit logging schedule'],
      },
      {
        industry: 'retail_cpg',
        modifier:
          'Model seasonality, transaction spikes, loyalty events, store rollout waves, and marketing campaign bursts before accepting usage-based or AI-assisted SaaS economics.',
        affectedStages: ['RFP', 'BAFO', 'Contracting'],
      },
    ],
    body: `## Summary
Enterprise SaaS pricing should be evaluated as a commercial architecture, not as a single subscription amount. The buyer needs to know what is being entitled, how each entitlement is measured, which usage dimensions can create incremental charges, what is bundled, what renews automatically, what can be reduced or substituted, and which new AI capabilities are base functionality versus separately metered consumption. Public SaaS billing and marketplace documentation supports this architecture view: AWS Marketplace contract guidance distinguishes entitlements, pricing dimensions, additional usage, upgrades, automatic renewals, and contract-end metering, while Stripe documents usage-based billing, rate cards, license fees, credits, flat fees, overages, meters, packaged units, and threshold monitoring. Microsoft public licensing terms show why renewal and term mechanics also belong inside the normalization exercise rather than after legal review.

## When to apply
Use this pattern when an enterprise is selecting, renewing, consolidating, or expanding SaaS and the vendors do not price on the same basis. It is especially important when one vendor uses named seats, another uses active users, another uses transaction volume, and another embeds AI credits or workflow runs inside a bundle. It also applies to marketplace private offers, incumbent renewals, enterprise license agreements, and BAFO events where a low headline offer may hide chargeable modules, premium support, storage, API, data, AI, or overage exposure. Do not use it to publish market discount benchmarks unless the buyer has quote evidence or a public source for the exact figure.

## Normalization doctrine
Start with the metric, not the price. Define every billable unit in buyer language: user, role, tenant, workspace, transaction, API call, document, data volume, workflow run, automation, credit, model call, output, storage, support tier, or premium feature. Then map each unit to the vendor's legal and billing language. For each line, capture whether it is committed, optional, included up to a limit, pay-as-you-go, true-up only, renewal-only, or non-chargeable. This prevents the event from comparing a complete enterprise bundle against a stripped subscription plus later add-ons.

Next, decompose bundles. A SaaS suite offer may combine core platform, data layer, AI assistant, security add-on, premium analytics, sandbox, support, implementation, and marketplace or reseller terms. The buyer should require a decomposition even if the final order form remains bundled, because decomposition becomes the renewal baseline, downgrade map, and exit-cost model. If the vendor will not expose line economics, the buyer should at least force a binding exhibit that names included products, excluded products, usage limits, and chargeable expansion triggers.

Overage and true-up logic must be scored before award. The sourcing team should identify the usage source of truth, aggregation window, alert threshold, approval path, invoice trace, dispute evidence, and end-of-term metering rule. This is not only a finance control. It affects architecture, adoption, data operations, and business ownership because the person creating usage is often not the person approving spend.

Renewal governance is a separate workstream. Normalize auto-renewal settings, opt-out windows, coterminosity, prorated first-term charges, quantity reduction rights, SKU renaming, product replacement, downgrade rights, and renewal quote timing. A strong first-year price is weak evidence if the renewal basis is undefined.

Finally, isolate AI usage lines. AI features should not be hidden inside a base SaaS comparison when they carry distinct usage metrics, data-use posture, disablement controls, credits, rate cards, or chargeable overflow. The decision record should show the base subscription case, the AI adoption case, and the usage-expansion case separately.

## Failure modes
The pattern fails when teams normalize only seat counts, accept vendor-defined bundles without a buyer-owned metric map, compare public list prices to negotiated private offers, or treat AI consumption as a feature note rather than a commercial line. It also fails when legal negotiates renewal language after the commercial scorecard is already locked, because the selection committee then approves economics it cannot actually govern.

## Required artifacts
The sourcing event should produce a pricing architecture workbook, bundle decomposition exhibit, usage and overage control schedule, renewal governance schedule, AI usage-line exhibit, and final BAFO comparison that separates subscription, usage, services, support, marketplace, and renewal assumptions. Numeric ranges should remain blank unless a public source, vendor quote, or buyer-controlled benchmark directly supports them.`,
  },
];
