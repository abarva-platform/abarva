import type { PatternSeed, SourceBasisRef } from './seed-types';

const ADYEN_PUBLIC_SOURCES: SourceBasisRef[] = [
  {
    type: 'public-disclosure',
    label: 'Adyen online payments overview',
    url: 'https://www.adyen.com/online-payments',
    asOf: '2026-04-29',
    note:
      'Adyen describes online payment acceptance, web and in-app payments, recurring payments, local payment methods, optimization add-ons, risk management, and integration options including Drop-in, Components, and API-only.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen for Platforms overview',
    url: 'https://www.adyen.com/platform-payments',
    asOf: '2026-04-29',
    note:
      'Adyen describes embedded payments for platforms and marketplaces, user onboarding, transaction tracking, reconciliation, risk controls, compliance support, and adjacent embedded financial services.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen pricing page',
    url: 'https://www.adyen.com/pricing',
    asOf: '2026-04-29',
    note:
      'Adyen states that each transaction has a fixed processing fee plus a payment-method fee, that other products are priced separately, and that public fees are indicative with custom pricing available through sales.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen for Platforms online payments documentation',
    url: 'https://docs.adyen.com/platforms/online-payments/',
    asOf: '2026-04-29',
    note:
      'Adyen docs describe platform online payment processing, split transactions, balance accounts, liable balance accounts, API credentials, webhooks, capabilities, and split configuration options.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen transaction fees documentation',
    url: 'https://docs.adyen.com/platforms/in-person-payments/transaction-fees/',
    asOf: '2026-04-29',
    note:
      'Adyen docs describe payment-related fee categories such as interchange, scheme fees, Adyen markup, Adyen commission, acquiring fees, Adyen fees, and payment fees for platforms.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen security resources documentation',
    url: 'https://docs.adyen.com/development-resources/security',
    asOf: '2026-04-29',
    note:
      'Adyen docs list integration security, identity and access management, API security, sensitive data protection, TLS, PGP encryption, incident handling, and PCI DSS resources.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen integration security documentation',
    url: 'https://docs.adyen.com/development-resources/security/integration-security',
    asOf: '2026-04-29',
    note:
      'Adyen states that checkout and payment page security remains a merchant responsibility because Adyen has limited ability to prevent attacks in merchant-controlled environments.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen terms and conditions',
    url: 'https://www.adyen.com/legal/adyen-terms-and-conditions',
    asOf: '2026-04-29',
    note:
      'Adyen terms define services, payment interface, transaction fees, interchange plus, pass-through fees, merchant potential liability reserve, support, uptime commitment, data privacy, suspension, and termination concepts.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen privacy statement',
    url: 'https://www.adyen.com/privacy-policy',
    asOf: '2026-04-29',
    note:
      'Adyen privacy statement describes controller processing, regulated financial-technology activities, categories of personal data, disclosures, transfers, rights, and update practices.',
  },
  {
    type: 'public-disclosure',
    label: 'Adyen platform status',
    url: 'https://status.adyen.com/',
    asOf: '2026-04-29',
    note: 'Adyen publishes a public platform status page for operational status review and incident due diligence.',
  },
];

const ADYEN_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Adyen quote, merchant agreement, traffic, payment-method mix, disputes, reserves, payout, support, and integration evidence',
  note:
    'Public Adyen materials establish product scope, public pricing mechanisms, selected terms, documentation, security guidance, privacy disclosures, and status visibility. They do not establish enterprise net price, private discounts, reserve levels, custom payout timing, negotiated SLA remedies, fraud uplift, authorization improvement, or buyer-specific payment economics.',
};

const ADYEN_SOURCING_LIFECYCLE = [
  {
    id: 'Scope',
    label: 'Payment-flow and liability scope',
    order: 1,
    description:
      'Define online, in-person, platform, marketplace, recurring, payout, risk, reconciliation, and embedded-finance scope before treating Adyen as a simple gateway replacement.',
  },
  {
    id: 'MarketScan',
    label: 'Processor, acquirer, PSP, and platform comparison',
    order: 2,
    description:
      'Compare Adyen against incumbent acquirers, gateways, orchestration layers, platform-payment providers, fraud tools, and regional payment specialists using buyer payment flows and liabilities.',
  },
  {
    id: 'RFP',
    label: 'Authorization, split, risk, and reconciliation proof',
    order: 3,
    description:
      'Run buyer-authored scenarios for payment method selection, authorization, capture, refund, dispute, split transaction, payout, webhook, reporting, and settlement reconciliation.',
  },
  {
    id: 'BAFO',
    label: 'Payment economics and operating-risk normalization',
    order: 4,
    description:
      'Normalize public fees, payment-method mix, interchange plus or blend model, pass-through charges, refunds, chargebacks, disputes, reserves, terminals, add-ons, support, implementation, and renewal rules.',
  },
  {
    id: 'Contracting',
    label: 'Merchant agreement, data, SLA, reserve, and exit controls',
    order: 5,
    description:
      'Convert award into schedules for services, payment methods, supported countries, payout timing, reserve mechanics, risk obligations, data processing, uptime, incident handling, transition, and status monitoring.',
  },
];

export const PAT_SRC_VEN_ADYEN_001: PatternSeed = {
  id: 'PAT-SRC-VEN-ADYEN-001',
  slug: 'adyen-enterprise-payments-sourcing-profile',
  title: 'Adyen Enterprise Payments Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Adyen sourcing should treat enterprise payments as a regulated money-movement, data, risk, reconciliation, and customer-experience operating layer, not merely a payment gateway price comparison.',
  applicability:
    'Apply when sourcing, renewing, expanding, or benchmarking Adyen for online payments, in-person payments, recurring payments, unified commerce, Adyen for Platforms, marketplace payments, split transactions, risk management, payout, reconciliation, or embedded financial services adjacency.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.81,
  createdFrom: 'human_authored',
  createdBy: 'codex',
  createdAt: '2026-04-29',
  instanceCount: 0,
  sourceDocuments: ADYEN_PUBLIC_SOURCES.map((source) => `${source.label} - ${source.url}`),
  regulatoryChips: [
    'PCI-DSS',
    'PSD2-SCA-if-EEA-payments',
    'GDPR-if-personal-data',
    'AML-KYC-if-platform-or-financial-products',
    'scheme-rules',
    'payment-method-rules',
    'DORA-if-EU-financial-entity',
    'SOX-ICFR-if-public-company-payment-controls',
  ],
  relatedPatternIds: [
    'PAT-SRC-001',
    'PAT-SRC-003',
    'PAT-SRC-007',
    'PAT-SRC-010',
    'PAT-SRC-CAT-AP-001',
    'PAT-SRC-CAT-TMS-001',
    'PAT-SRC-CAT-FINOPS-001',
    'PAT-SRC-CAT-REV-001',
  ],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'enterprise_saas',
  vendorClass: 'direct-tech',
  lifecycleStages: ADYEN_SOURCING_LIFECYCLE,
  perStageGateCriteria: {
    Scope: [
      {
        id: 'adyen-payment-flow-boundary',
        stageId: 'Scope',
        gateType: 'hard',
        description: 'The buyer has mapped the payment flows, legal entities, channels, countries, currencies, payment methods, users, and money-movement responsibilities in scope.',
        evaluationHint:
          'Require a flow map for authorization, capture, refund, chargeback, split, payout, reconciliation, risk review, and customer support before pricing or vendor scoring begins.',
      },
    ],
    RFP: [
      {
        id: 'adyen-end-to-end-proof',
        stageId: 'RFP',
        gateType: 'hard',
        description: 'Adyen demonstrates buyer-authored payment scenarios using the integration, reporting, webhook, risk, and reconciliation artifacts the buyer will operate.',
        evaluationHint:
          'The proof should include successful and failed payments, 3DS/SCA where relevant, refund, dispute, split transaction, payout, webhook retry, reconciliation report, and operational support evidence.',
      },
    ],
    BAFO: [
      {
        id: 'adyen-economics-normalization',
        stageId: 'BAFO',
        gateType: 'hard',
        description: 'Commercial scoring separates public payment-method fees from buyer-specific volume, mix, pass-through, reserve, support, implementation, and add-on assumptions.',
        evaluationHint:
          'Do not score a single headline rate. Require a model by region, payment method, channel, transaction type, refunds, disputes, chargebacks, payouts, terminals if applicable, risk products, and support level.',
      },
    ],
    Contracting: [
      {
        id: 'adyen-risk-data-sla-exit-schedule',
        stageId: 'Contracting',
        gateType: 'hard',
        description: 'The merchant agreement and schedules cover service scope, data, uptime, reserves, scheme-rule obligations, support, status monitoring, suspension rights, and exit.',
        evaluationHint:
          'Legal, finance, security, privacy, payments, support, and treasury owners must approve the final service schedule, payment-method list, reserve language, data terms, and transition plan.',
      },
    ],
  },
  perStageExpectedArtifacts: {
    Scope: [
      {
        id: 'adyen-payment-flow-inventory',
        label: 'Adyen payment-flow and liability inventory',
        stageId: 'Scope',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Inventory channels, merchant accounts, legal entities, countries, payment methods, transaction volumes, currencies, checkout patterns, platform users, risk controls, payout needs, refunds, disputes, chargebacks, and reconciliation owners.',
      },
    ],
    RFP: [
      {
        id: 'adyen-scripted-payment-proof-pack',
        label: 'Scripted Adyen payment proof pack',
        stageId: 'RFP',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Buyer-authored scenarios for checkout, authorization, capture, cancellation, refund, dispute, split funds, fee booking, payout, webhook handling, report extraction, and support escalation.',
      },
    ],
    BAFO: [
      {
        id: 'adyen-commercial-normalization-workbook',
        label: 'Adyen commercial normalization workbook',
        stageId: 'BAFO',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Workbook that maps quote terms to public fee mechanisms, payment-method mix, pass-through fees, Adyen markup or commission, refunds, chargebacks, reserves, payout timing, risk add-ons, platform products, terminals, implementation, and support.',
      },
    ],
    Contracting: [
      {
        id: 'adyen-merchant-agreement-control-exhibit',
        label: 'Merchant agreement, data, SLA, reserve, and exit exhibit',
        stageId: 'Contracting',
        requirement: 'required',
        gateType: 'hard',
        description:
          'Contract exhibit covering services, countries, payment methods, data roles, privacy, security evidence, uptime and support expectations, reserve and suspension language, scheme-rule compliance, reports, status monitoring, transition, and data export.',
      },
    ],
  },
  vendorLandscape: [
    {
      vendorName: 'Adyen',
      tier: 'enterprise',
      positioning:
        'Enterprise payment technology provider spanning online payments, in-person payments, platforms and marketplaces, payment methods, acquiring, risk management, settlement, reporting, reconciliation, and embedded financial-services adjacency.',
      strengths: [
        'Public materials describe one integration for many payment methods and an online payments stack with Drop-in, Components, and API-only integration options',
        'Platform documentation describes split transactions, balance accounts, webhooks, transaction fees, and reconciliation paths for platforms and marketplaces',
        'Public terms and documentation expose useful diligence anchors for transaction fees, uptime commitment, data privacy, security resources, and merchant obligations',
      ],
      cautions: [
        'Public pricing pages are indicative and do not prove enterprise net price, private discounts, reserve levels, support concessions, custom payout timing, or negotiated remedies',
        'Merchant-controlled checkout, integration security, reporting, and reconciliation responsibilities must be proven with buyer evidence',
        'Acquirer, issuer, scheme, payment-method, fraud, chargeback, reserve, and regulatory dependencies can materially affect operating outcomes outside a simple gateway comparison',
      ],
      sourceBasis: ADYEN_PUBLIC_SOURCES,
    },
    {
      vendorName: 'Incumbent acquirers, gateways, processors, and orchestration layers',
      tier: 'incumbent',
      positioning:
        'Existing payment estate may include local acquirers, gateways, orchestration platforms, fraud tools, POS providers, and treasury or reconciliation workflows that already carry traffic and controls.',
      strengths: ['Existing merchant IDs and operational familiarity', 'Known dispute and reconciliation process', 'Potentially proven local payment or acquiring coverage'],
      cautions: ['Fragmentation may obscure authorization rates, fees, payout timing, fraud controls, reporting, and customer support ownership.'],
    },
    {
      vendorName: 'Specialist regional payment, fraud, payout, and marketplace providers',
      tier: 'specialist',
      positioning:
        'Best-of-breed alternatives can apply pressure where a buyer needs a specific local payment method, payout corridor, fraud capability, orchestration feature, or marketplace onboarding model.',
      strengths: ['Focused regional or functional depth', 'Useful price and resilience comparison', 'Can reduce dependency on one payment provider for critical flows'],
      cautions: ['May increase integration, reporting, reconciliation, and support complexity.'],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Adyen public payment-method pricing anchors only',
      model: 'usage-based',
      metric: 'Fixed processing fee plus payment-method fee, with pass-through, interchange plus, blend, refunds, chargebacks, platforms, terminals, risk products, and other products handled by quote or service scope',
      sourceBasis: [ADYEN_PUBLIC_SOURCES[2], ADYEN_PUBLIC_SOURCES[4], ADYEN_PUBLIC_SOURCES[7]],
      confidence: 0.7,
      notes:
        'Use the public pricing page only to identify pricing mechanisms and selected payment-method anchors. Do not infer enterprise net price, blended effective rate, discount, minimum invoice, reserve requirement, support pricing, payout economics, or platform monetization without buyer quote, invoice, agreement, report, or approved benchmark evidence.',
    },
    {
      label: 'Buyer-specific Adyen economics data gap',
      model: 'hybrid',
      metric: 'Payment method mix, region, channel, volume, average ticket, authorization rate, refunds, disputes, chargebacks, scheme fees, pass-through fees, reserves, payout timing, platform split fees, risk add-ons, terminals, integration, support, and negotiated terms',
      sourceBasis: [ADYEN_BUYER_DATA_GAP],
      confidence: 0.12,
      notes:
        'Populate only from buyer invoices, Adyen or reseller quotes, final merchant agreement, settlement and accounting reports, acquiring statements, chargeback reports, terminal schedules, support exhibits, and approved benchmark submissions.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Service scope, payment methods, and flow of funds',
      buyerPosition:
        'Attach a schedule naming merchant accounts, legal entities, countries, currencies, payment methods, channels, platform flows, split rules, payout timing, reporting, reconciliation, refunds, disputes, chargebacks, reserves, support level, and excluded products.',
      fallbackPosition:
        'If scope is phased, require a hard go-live gate for each phase with approved payment-method list, funds-flow map, report owner, support path, and rollback plan.',
      walkawayTriggers: [
        'Vendor cannot map quoted services to buyer payment flows and legal entities',
        'Funds-flow, split, payout, reserve, refund, or chargeback responsibilities are unresolved before award',
      ],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[1], ADYEN_PUBLIC_SOURCES[3], ADYEN_PUBLIC_SOURCES[7], ADYEN_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Pricing, pass-through fees, reserves, and invoice auditability',
      buyerPosition:
        'Define processing fees, payment-method fees, pass-through fees, interchange plus or blend model, refunds, chargebacks, scheme fees, Adyen markup or commission, minimums, invoicing, reserve mechanics, reporting, audit rights, and change notice.',
      fallbackPosition:
        'Where pass-through or scheme fees vary, require detailed reporting, notice of material fee changes where available, and a pricing workbook that reconciles invoice line items to transaction data.',
      walkawayTriggers: [
        'Commercial model cannot be reconciled to payment-method mix and transaction reports',
        'Reserve or suspension mechanics are unacceptable for buyer liquidity and customer obligations',
      ],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[2], ADYEN_PUBLIC_SOURCES[4], ADYEN_PUBLIC_SOURCES[7], ADYEN_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Security, privacy, integration, and customer responsibility',
      buyerPosition:
        'Map PCI DSS, checkout security, IAM, API credentials, webhook handling, TLS, sensitive data, incident handling, privacy roles, subprocessors or disclosures where applicable, data retention, and merchant-owned controls to the purchased Adyen services.',
      fallbackPosition:
        'If standard terms remain unchanged, attach a buyer security and privacy responsibility matrix that names control owners and evidence sources before production traffic is migrated.',
      walkawayTriggers: [
        'Cardholder data path or checkout-page security responsibility is unclear',
        'No acceptable privacy, security, incident, or audit evidence path for regulated payment or personal data',
      ],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[5], ADYEN_PUBLIC_SOURCES[6], ADYEN_PUBLIC_SOURCES[8]],
    },
    {
      clauseArea: 'Availability, support, status, and exit',
      buyerPosition:
        'Define support channels, emergency escalation, uptime expectations, status-page monitoring, incident communication, maintenance notice, payment-method outage handling, data export, transition assistance, and termination effects.',
      fallbackPosition:
        'If remedies are limited, require operational runbooks, status-page subscriptions, incident review cadence, dual-provider fallback analysis for critical flows, and exit tests before full migration.',
      walkawayTriggers: [
        'Critical payment flows lack monitoring, fallback, incident escalation, or transition plan',
        'SLA language excludes dependencies that are material to the buyer and no operational mitigation exists',
      ],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[7], ADYEN_PUBLIC_SOURCES[9]],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Payment-method mix and authorization proof before rate trade',
      whenToUse:
        'Use when Adyen is compared against a lower headline gateway, acquirer, or orchestration quote and stakeholders may ignore approval rate, local method, fraud, dispute, or reconciliation effects.',
      buyerAsk:
        'Trade volume commitments or broader scope only for payment-method-level pricing, authorization and decline reporting, implementation support, clear fee pass-through, chargeback handling, and renewal protections tied to buyer traffic assumptions.',
      vendorGive:
        'Vendor may provide payment-method workshops, reporting walkthroughs, integration guidance, commercial sensitivity cases, or support commitments instead of unsupported conversion claims.',
      tradeoffs: [
        'A cheaper headline fee can be worse if authorization, fraud, chargeback, reconciliation, or payout performance deteriorates.',
        'A broader Adyen scope can simplify operations, but it increases platform dependency unless exit and fallback are explicit.',
      ],
      evidenceBasis: [ADYEN_PUBLIC_SOURCES[0], ADYEN_PUBLIC_SOURCES[2], ADYEN_BUYER_DATA_GAP],
    },
    {
      lever: 'Platform split, payout, and compliance proof',
      whenToUse:
        'Use when a marketplace, SaaS platform, franchise model, or embedded-finance program depends on onboarding users, splitting funds, deducting fees, paying out balances, or managing seller risk.',
      buyerAsk:
        'Require scripted split-transaction, fee-booking, payout, KYC, risk, webhook, report, and support proof before BAFO, plus a clear responsibility matrix for user complaints, fraud, unauthorized payments, and regulatory reporting where applicable.',
      vendorGive:
        'Vendor may provide platform implementation sessions, sandbox proof, report examples, compliance guidance, and commercial detail by platform product.',
      evidenceBasis: [ADYEN_PUBLIC_SOURCES[1], ADYEN_PUBLIC_SOURCES[3], ADYEN_PUBLIC_SOURCES[4]],
    },
    {
      lever: 'Status, resilience, and fallback as critical-flow protection',
      whenToUse:
        'Use when the buyer has high-volume checkout, regulated financial services, marketplace payouts, peak-season retail, subscriptions, or customer-support exposure from payment outages.',
      buyerAsk:
        'Require incident escalation paths, status-page operating procedure, payment-method outage playbooks, fallback routing analysis, maintenance notice handling, and post-incident review rights for critical flows.',
      tradeoffs: ['Operational resilience demands engineering and support work before launch, but it protects revenue and customer trust better than relying on SLA text alone.'],
      evidenceBasis: [ADYEN_PUBLIC_SOURCES[7], ADYEN_PUBLIC_SOURCES[9]],
    },
  ],
  riskFactors: [
    {
      id: 'adyen-headline-rate-overfit',
      label: 'Headline rate overfit',
      severity: 'high',
      detectionSignals: [
        'Commercial model uses one blended rate without payment-method, region, channel, pass-through, refund, chargeback, reserve, payout, and support assumptions',
        'Public pricing anchors are treated as enterprise benchmarks without buyer quote or invoice evidence',
      ],
      mitigations: [
        'Build a transaction-level pricing workbook',
        'Model scenarios by payment method, geography, channel, average order value, refund rate, dispute rate, and growth',
        'Reconcile proposed fees to Adyen report and invoice concepts before award',
      ],
      contractualRemedies: ['Fee schedule', 'Reporting rights', 'Change-notice language', 'Renewal and volume-commit protection'],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[2], ADYEN_PUBLIC_SOURCES[4], ADYEN_BUYER_DATA_GAP],
    },
    {
      id: 'adyen-funds-flow-and-reserve-risk',
      label: 'Funds-flow and reserve risk',
      severity: 'high',
      detectionSignals: [
        'Buyer cannot explain who holds funds, when payouts occur, which account absorbs fees, or how reserves may affect liquidity',
        'Marketplace or platform model has unresolved split, fee, KYC, complaint, fraud, or user-support obligations',
      ],
      mitigations: [
        'Map balance accounts, liable balance account, split rules, settlement reports, payout cadence, reserves, refunds, and chargebacks',
        'Route treasury, accounting, legal, risk, and customer-support review before final award',
      ],
      contractualRemedies: ['Reserve schedule', 'Payout schedule', 'Split and reporting exhibit', 'Suspension and termination review language'],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[3], ADYEN_PUBLIC_SOURCES[7]],
    },
    {
      id: 'adyen-merchant-controlled-security-gap',
      label: 'Merchant-controlled security gap',
      severity: 'high',
      detectionSignals: [
        'Checkout, API credentials, webhook endpoints, user permissions, or scripts are treated as vendor-controlled without buyer control evidence',
        'PCI, SCA, data minimization, fraud, and incident responsibilities are not mapped to the integration pattern',
      ],
      mitigations: [
        'Use Adyen security documentation as a control checklist, then assign buyer owners for checkout, IAM, API security, webhooks, logging, and incident handling',
        'Require pre-production security review and runbook acceptance',
      ],
      contractualRemedies: ['Security responsibility matrix', 'Incident notification and cooperation terms', 'Credential and access-control procedures'],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[5], ADYEN_PUBLIC_SOURCES[6], ADYEN_PUBLIC_SOURCES[8]],
    },
    {
      id: 'adyen-one-platform-dependency',
      label: 'One-platform dependency for critical payments',
      severity: 'medium',
      detectionSignals: [
        'Buyer consolidates gateway, acquiring, risk, platform splits, and reporting without fallback, exit, or migration evidence',
        'Peak-season, subscription, payout, or regulated flows depend on Adyen but incident operations are not rehearsed',
      ],
      mitigations: ['Define fallback strategy', 'Subscribe to status updates', 'Run incident tabletop', 'Validate export and transition obligations'],
      contractualRemedies: ['Exit assistance', 'Data export', 'Status and incident communication procedures', 'Transition support'],
      sourceBasis: [ADYEN_PUBLIC_SOURCES[7], ADYEN_PUBLIC_SOURCES[9]],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Stress unified commerce, peak traffic, local payment methods, fraud tools, refund flows, chargebacks, POS adjacency, loyalty handoffs, and incident response during launches or seasonal events.',
      additionalRequirements: ['Peak-season traffic model', 'Refund and chargeback operating plan', 'Checkout fallback and support runbook'],
      regulatoryRefs: ['PCI-DSS', 'consumer-refund-rules-by-market'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Raise operational resilience, outsourcing, data, audit, incident, payment-service, fraud, reserve, and regulatory-reporting review when Adyen supports regulated products, payments, or platform money movement.',
      additionalRequirements: ['Operational resilience review', 'Audit and incident evidence path', 'Exit and concentration-risk analysis'],
      regulatoryRefs: ['DORA-if-EU-financial-entity', 'PSD2-SCA-if-EEA-payments', 'AML-KYC-if-platform-financial-products'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate procurement channel, accessibility, data handling, cardholder-data scope, records retention, refund controls, status transparency, and public accountability before migration.',
      additionalRequirements: ['Public procurement compliance review', 'Records and audit plan', 'Accessibility and payment-method equity review'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'cross_industry',
      modifier:
        'For platform or marketplace models, prioritize user onboarding, KYC, split funds, fee booking, seller risk, payout timing, complaint routing, and reconciliation ownership over generic checkout features.',
      additionalRequirements: ['Platform user and funds-flow matrix', 'Split-transaction proof', 'Complaint and fraud responsibility map'],
      regulatoryRefs: ['AML-KYC-if-applicable', 'privacy-law-by-region', 'scheme-rules'],
      affectedStages: ['Scope', 'RFP', 'BAFO', 'Contracting'],
    },
  ],
  body: `## Summary
Adyen should be sourced as an enterprise payment operating layer, not as a narrow gateway line item. Public Adyen materials describe online payment acceptance, web and in-app checkout, recurring payments, local payment methods, risk management, optimization add-ons, platform and marketplace payments, split transactions, transaction-fee handling, reporting, reconciliation, privacy, security resources, and a public platform status page. Those materials support a real sourcing profile, but they do not prove that Adyen is the right economic, operational, or risk fit for a specific buyer. The sourcing event must connect Adyen's public capabilities to the buyer's actual countries, currencies, payment methods, merchant entities, checkout patterns, refund and dispute rates, payout needs, data controls, fraud posture, support model, and reconciliation obligations.

## When to apply
Use this profile for a new Adyen selection, an incumbent Adyen renewal, a migration from legacy gateways or acquirers, a marketplace or SaaS-platform embedded-payments initiative, a unified-commerce program, a recurring-billing or subscription payment redesign, or a payment-cost and authorization-rate benchmark. It is especially useful when stakeholders are tempted to compare vendors using only a headline processing rate. In enterprise payment sourcing, the commercial result depends on payment-method mix, geography, channel, authorization behavior, interchange or pass-through treatment, scheme fees, refunds, disputes, chargebacks, fraud controls, reserve mechanics, payout timing, reporting, integration work, support, and renewal terms.

## Public capability boundary
Adyen's online payments page describes website, in-app, and recurring payment use cases, local payment methods, risk management, revenue optimization, and integration choices such as Drop-in, Components, and API-only. Adyen for Platforms materials describe embedded payments for platforms and marketplaces, user onboarding, transaction tracking, reconciliation, risk controls, compliance support, and adjacent products such as accounts, issuing, and capital. Adyen docs for platform online payments explain split transactions, balance accounts, liable balance accounts, API credentials, webhooks, required capabilities, and split configuration. Transaction-fee documentation describes fee concepts such as interchange, scheme fees, Adyen markup, Adyen commission, acquiring fees, Adyen fees, and payment fees. These are useful anchors for RFP design and commercial normalization, not proof of buyer-specific ROI.

The buyer should separate product existence from operating fit. A retailer with peak checkout windows, a marketplace with seller payouts, a subscription business with recurring credential storage, and a financial-services platform with regulated money movement all need different evidence. The event should identify which payment methods, countries, currencies, legal entities, customer journeys, card-present or card-not-present flows, platform users, refund policies, dispute workflows, fraud rules, and accounting reports are in scope. It should also identify what is out of scope, such as terminal replacement, fraud tooling, issuing, capital, bank accounts, orchestration, or treasury workflows if those are not being purchased.

## Commercial normalization
Adyen's pricing page states that each transaction has a fixed processing fee plus a payment-method fee and that other products are priced separately. It also states that public fees are indicative and that buyers should contact Adyen to discuss pricing options. That is enough to create a pricing mechanism checklist, but not enough to populate enterprise benchmark rates. Do not invent discounts, effective rates, minimum invoices, reserve percentages, payout concessions, support charges, chargeback economics, authorization uplift, fraud savings, or conversion improvements. Require buyer quote, final merchant agreement, invoices, settlement reports, accounting reports, dispute reports, traffic baselines, and approved benchmark submissions before numeric scoring.

The commercial workbook should model payment-method mix, regions, channels, average order value, transaction count, refunds, failed transactions, chargebacks, disputes, currency conversion, settlement timing, platform splits, fee booking, terminals if applicable, risk products, reporting, support, implementation, and growth. It should compare incumbent economics using the same units. If Adyen is proposed as a consolidation play, separate savings from gateway retirement, acquirer consolidation, fraud tooling, orchestration simplification, support effort, and reconciliation improvement so that each value claim has an accountable owner and baseline.

## Contract and control focus
The contract review should cover services, payment methods, countries, legal entities, merchant accounts, payment interface, customer area access, support, emergency support, uptime commitment, maintenance, scheme-rule obligations, payment-method dependencies, pass-through fees, reserves, refunds, chargebacks, fines, suspension rights, termination effects, reporting, status monitoring, privacy, data roles, security controls, and incident handling. Adyen's terms include a quarterly-average Payment Interface uptime commitment measured by ability to receive transaction messages, with exclusions for dependencies such as merchant acts or omissions, issuers, acquirers, scheme owners, general internet failures, individual payment-method failures, and force majeure. Buyers should translate that language into operational monitoring and fallback design rather than assuming every checkout failure is covered by an SLA.

Security and privacy review should be evidence-based. Adyen publishes security resources covering integration security, IAM, API security, sensitive data protection, TLS, PGP encryption, incident handling, and PCI DSS resources. Adyen's integration-security guidance is explicit that merchant checkout and payment page security are merchant responsibilities because Adyen has limited ability to prevent attacks in environments it does not control. The buyer therefore needs a responsibility matrix for checkout scripts, API credentials, webhook validation, logging, user permissions, PCI scope, SCA/3DS, fraud settings, support access, and incident escalation. Privacy review should map controller or processor roles, personal-data categories, cross-border transfers, disclosures, retention, and data-subject rights to the services actually purchased.

## Proof design
The RFP proof should run buyer-authored scenarios rather than generic demos. Minimum scenarios include payment-method discovery, successful authorization, refused payment, SCA or 3DS where relevant, capture, cancellation, refund, partial refund, chargeback or dispute workflow, webhook retry, report extraction, settlement reconciliation, and support escalation. Platform buyers should add onboarding, KYC status, split transaction, fee deduction, liable balance account handling, payout, seller-risk signal, user complaint, and failed payout scenarios. Retail or high-volume buyers should add peak traffic, promotion-day fallback, bot or fraud pressure, local payment method failure, and customer support handoff.

## Failure modes
The first failure mode is headline-rate overfit: a buyer accepts a low or familiar rate without modeling transaction-level economics, pass-through fees, refunds, chargebacks, reserves, and reporting costs. The second is funds-flow ambiguity: no one can explain who holds funds, who absorbs fees, when payouts happen, how reserves work, or how disputes affect liquidity. The third is merchant-controlled security weakness: checkout, scripts, webhooks, API credentials, or user permissions are assumed to be vendor-managed when the buyer actually owns critical controls. The fourth is one-platform dependency: gateway, acquiring, risk, split payments, payouts, and reporting consolidate without fallback, exit, or incident rehearsal.

Adyen can be a strong enterprise payments candidate when the buyer proves the payment flows, economics, controls, and operating model with evidence. The award is ready only when the final scope maps to public and contractual service evidence, the price model reconciles to transaction data, security and privacy responsibilities are assigned, finance can reconcile settlement and fees, support has incident runbooks, and legal accepts the reserve, suspension, data, SLA, and exit terms for the buyer's actual risk profile.`,
};
