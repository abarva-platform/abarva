import type { PatternSeed, SourceBasisRef } from './seed-types';

const AS_OF = '2026-04-29';

const SQUARE_PAYMENTS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Payments overview',
  url: 'https://squareup.com/us/en/payments',
  asOf: AS_OF,
  note: 'Square public payments page describing in-person and online payment acceptance, secure processing, fee orientation, transfers, dispute management, fraud prevention, encryption, PCI support, and payment-method coverage.',
};

const SQUARE_POS_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Point of Sale pricing and plans',
  url: 'https://squareup.com/us/en/point-of-sale/software/pricing?country_redirection=true',
  asOf: AS_OF,
  note: 'Public Square POS pricing page for plan comparison, payment-method pricing context, product packaging, and listed features; use as public orientation only, not buyer-specific net pricing.',
};

const SQUARE_ONLINE_PLANS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Online Store pricing and plans',
  url: 'https://squareup.com/us/en/online-store/plans',
  asOf: AS_OF,
  note: 'Public Square Online plans page describing online store tiers, payment acceptance, checkout, order fulfillment, item/catalog, fraud-control, and online selling capabilities.',
};

const SQUARE_RETAIL: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square for Retail overview',
  url: 'https://squareup.com/us/en/point-of-sale/retail',
  asOf: AS_OF,
  note: 'Public retail POS page describing inventory, checkout, reporting, online store, hardware, loyalty, marketing, invoices, staff, and banking-adjacent capabilities.',
};

const SQUARE_RESTAURANTS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square for Full-Service Restaurants overview',
  url: 'https://squareup.com/us/en/restaurants/full-service',
  asOf: AS_OF,
  note: 'Public restaurant POS page describing hospitality hardware, ordering, payments, kitchen display, online ordering, and sales-led custom pricing context for larger processors.',
};

const SQUARE_DEVELOPER_PAYMENTS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Developer payments overview',
  url: 'https://developer.squareup.com/docs/payments-overview',
  asOf: AS_OF,
  note: 'Square Developer docs describing online and in-person payment APIs and SDKs, payment management APIs, payments plus commerce/customer/staff API combinations, country support, payment minimums, and SCA guidance links.',
};

const SQUARE_CARD_PAYMENTS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Card Payments API guide',
  url: 'https://developer.squareup.com/docs/payments-api/take-payments/card-payments',
  asOf: AS_OF,
  note: 'Square Developer guide stating applications should use Square Web Payments SDK or In-App Payments SDK tokens rather than direct card data in CreatePayment calls, and noting Square-managed PCI compliance, fraud detection, and disputes as part of card processing.',
};

const SQUARE_API_PRICING: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Payments Pricing with Square APIs and SDKs',
  url: 'https://developer.squareup.com/docs/payments-pricing',
  asOf: AS_OF,
  note: 'Square Developer pricing documentation for payments-related API and SDK calls; use only as public rate and method context, not as a substitute for contract, location, card-mix, or custom-pricing evidence.',
};

const SQUARE_SECURITY: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square secure payments and credentials',
  url: 'https://squareup.com/us/en/payments/secure',
  asOf: AS_OF,
  note: 'Public Square security page describing ISO 27001 certification, PCI Data Security Standard Level 1, secure hardware/software, encryption, server monitoring, cryptographic protocols, security governance, and vulnerability reporting.',
};

const SQUARE_PRIVACY: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Privacy Notice for Sellers and Website Visitors',
  url: 'https://squareup.com/us/en/legal/general/privacy',
  asOf: AS_OF,
  note: 'Public privacy notice for Square sellers and website visitors, including collection, use, disclosure, retention, security, country disclosures, changes, and contact details.',
};

const SQUARE_DPA: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Data Processing Terms',
  url: 'https://squareup.com/us/en/legal/general/data-processing-terms',
  asOf: AS_OF,
  note: 'Public data processing terms addressing Square processing of customer personal data, data protection legislation, processor role, subprocessors, and processing subject matter for relevant jurisdictions.',
};

const SQUARE_GENERAL_TERMS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square General Terms of Service',
  url: 'https://squareup.com/us/en/legal/general/ua',
  asOf: AS_OF,
  note: 'Public legal terms governing Square services, including security, privacy, termination effect, warranties, limitation of liability, assignment, third-party services, and related provisions.',
};

const SQUARE_PAYMENT_TERMS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square Payment Terms',
  url: 'https://squareup.com/us/en/legal/general/payment',
  asOf: AS_OF,
  note: 'Public payment terms covering processing errors, underwriting and identity verification, access to proceeds, payout schedule, reserve and hold mechanics, account balances, set-off rights, chargebacks, taxes, and customer service.',
};

const SQUARE_STATUS: SourceBasisRef = {
  type: 'public-disclosure',
  label: 'Square public status page',
  url: 'https://square2.statuspage.io/',
  asOf: AS_OF,
  note: 'Public Square status page for service status, maintenance, incidents, and historical uptime display; use as operational transparency evidence, not as a negotiated SLA commitment.',
};

const SQUARE_BUYER_DATA_GAP: SourceBasisRef = {
  type: 'founder-data-gap',
  label: 'Buyer-specific Square quote, processing history, reserve, chargeback, support, implementation, and contract evidence',
  note:
    'Public Square pages establish product scope, published pricing mechanisms, security posture, legal terms, and operating concepts. They do not prove buyer-specific effective processing cost, card mix, private custom rate, hardware discount, reserve treatment, payout hold history, dispute exposure, negotiated support, implementation services, or contractual concession.',
};

export const PAT_SRC_VEN_SQUARE_001: PatternSeed = {
  id: 'PAT-SRC-VEN-SQUARE-001',
  slug: 'square-merchant-payments-commerce-sourcing-profile',
  title: 'Block Square Merchant Payments and Commerce Sourcing Profile',
  domain: 'sourcing',
  tier: 'validated',
  vertical: 'cross-industry',
  thesis:
    'Square sourcing should be evaluated as a merchant payments, point-of-sale, online commerce, developer API, risk, payout, and operating-control decision rather than as a simple card-processing rate comparison.',
  applicability:
    'Apply when sourcing, renewing, expanding, benchmarking, or replacing Square for in-person payments, online payments, Square POS, Square Online, retail POS, restaurant POS, appointments, invoices, checkout links, developer payment integrations, hardware, fraud, disputes, payouts, or merchant commerce workflows.',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'codex-ven-square',
  createdAt: AS_OF,
  instanceCount: 0,
  sourceDocuments: [
    'https://squareup.com/us/en/payments',
    'https://squareup.com/us/en/point-of-sale/software/pricing?country_redirection=true',
    'https://squareup.com/us/en/online-store/plans',
    'https://squareup.com/us/en/point-of-sale/retail',
    'https://squareup.com/us/en/restaurants/full-service',
    'https://developer.squareup.com/docs/payments-overview',
    'https://developer.squareup.com/docs/payments-api/take-payments/card-payments',
    'https://developer.squareup.com/docs/payments-pricing',
    'https://squareup.com/us/en/payments/secure',
    'https://squareup.com/us/en/legal/general/privacy',
    'https://squareup.com/us/en/legal/general/data-processing-terms',
    'https://squareup.com/us/en/legal/general/ua',
    'https://squareup.com/us/en/legal/general/payment',
    'https://square2.statuspage.io/',
  ],
  regulatoryChips: [
    'PCI-DSS',
    'ISO-27001',
    'GDPR-if-EU-UK-personal-data',
    'CCPA-CPRA-if-California-personal-data',
    'PSD2-SCA-if-UK-EEA-online-payments',
    'Tax-reporting-if-payment-thresholds-met',
    'Chargeback-network-rules',
    'HIPAA-if-PHI-enters-payment-or-support-workflows',
  ],
  relatedPatternIds: ['PAT-SRC-003', 'PAT-SRC-CAT-FINOPS-001', 'PAT-SRC-PRC-SAAS-001'],
  derivedFromPatternIds: [],
  taggedContradictionIds: [],
  category: 'customer_facing',
  vendorClass: 'direct-tech',
  vendorLandscape: [
    {
      vendorName: 'Square merchant payments and commerce platform',
      tier: 'enterprise',
      positioning:
        'Block-owned Square product family spanning merchant payment acceptance, POS software, online checkout and store capabilities, vertical POS for retail and restaurants, invoicing, hardware, developer APIs and SDKs, fraud and dispute workflows, payout operations, and adjacent customer, staff, banking, loyalty, and marketing tools.',
      strengths: [
        'Public product documentation covers in-person, online, invoice, checkout-link, hardware, POS, Square Online, retail, restaurant, developer API, and payment management workflows',
        'Public security materials identify PCI DSS Level 1, ISO 27001, encryption, secure hardware/software, server monitoring, and vulnerability-reporting posture',
        'Developer docs show tokenized payment collection patterns and APIs that connect payments with orders, invoices, subscriptions, customers, catalog, staff, payouts, refunds, and disputes',
      ],
      cautions: [
        'Public pricing pages and developer pricing docs do not prove buyer-specific effective rate, card mix, custom pricing, hardware discount, or total cost after add-ons',
        'Payment terms include underwriting, reserve, access-to-proceeds, payout, chargeback, tax, and set-off concepts that can be material for merchants with elevated risk or cash-flow sensitivity',
        'Sourcing must distinguish Square as merchant processor, POS operating system, online store, developer platform, hardware supplier, and optional banking-adjacent workflow rather than evaluating only one headline fee',
      ],
      sourceBasis: [SQUARE_PAYMENTS, SQUARE_RETAIL, SQUARE_RESTAURANTS, SQUARE_DEVELOPER_PAYMENTS, SQUARE_SECURITY, SQUARE_PAYMENT_TERMS],
    },
  ],
  pricingBenchmarks: [
    {
      label: 'Public Square POS, online, and API payment pricing anchors',
      model: 'hybrid',
      metric: 'Payment method, channel, POS or online plan, API or SDK path, card-present versus card-not-present treatment, hardware, add-ons, chargebacks, payouts, and support scope',
      currency: 'USD',
      sourceBasis: [SQUARE_POS_PRICING, SQUARE_ONLINE_PLANS, SQUARE_API_PRICING, SQUARE_PAYMENTS],
      confidence: 0.74,
      notes:
        'Use public Square pricing pages only to identify published plan structures, listed processing-rate mechanisms, and payment-method differences. Do not infer buyer-specific effective rate, card-mix impact, custom pricing eligibility, seasonal volume sensitivity, hardware concessions, or renewal economics without seller statements, processing history, order forms, quotes, and invoices.',
    },
    {
      label: 'Buyer-specific Square total-cost and cash-flow evidence gap',
      model: 'hybrid',
      metric: 'Effective processing rate, card mix, transaction size, dispute rate, refund volume, payout timing, reserve or hold history, hardware fleet, software plans, add-ons, implementation labor, integrations, and support burden',
      sourceBasis: [SQUARE_BUYER_DATA_GAP, SQUARE_PAYMENT_TERMS],
      confidence: 0.16,
      notes:
        'Founder data gap: populate from merchant statements, Square Dashboard exports, payout and reserve history, chargeback logs, order forms, quotes, hardware invoices, support records, implementation plans, and accounting reconciliation data before benchmarking Square against processors or POS alternatives.',
    },
  ],
  standardClauses: [
    {
      clauseArea: 'Scope, products, and payment channels',
      buyerPosition:
        'Attach a schedule that separates in-person payments, online payments, invoices, checkout links, Square Online, POS verticals, hardware, APIs, subscriptions, loyalty, marketing, staff, banking-adjacent products, and third-party integrations, with owner, location, and payment-method assumptions for each.',
      fallbackPosition:
        'If scope is still changing, require a pre-launch scope baseline and change-control process before adding new locations, channels, hardware, or paid product tiers.',
      sourceBasis: [SQUARE_PAYMENTS, SQUARE_ONLINE_PLANS, SQUARE_RETAIL, SQUARE_RESTAURANTS, SQUARE_DEVELOPER_PAYMENTS],
    },
    {
      clauseArea: 'Pricing, payouts, reserves, and disputes',
      buyerPosition:
        'Normalize public processing pricing against actual buyer card mix, transaction size, payment channel, refund behavior, disputes, chargebacks, payout timing, reserve risk, add-ons, hardware, and support before declaring savings or switching cost.',
      walkawayTriggers: [
        'The business case excludes payout timing, reserve or hold mechanics, chargeback liability, or dispute operating effort',
        'The proposal relies on public list pricing without buyer processing history, seasonal volume, refund rates, and hardware or software add-on costs',
        'Merchant cash-flow owners cannot accept reserve, hold, set-off, or payout uncertainty under the applicable payment terms',
      ],
      sourceBasis: [SQUARE_POS_PRICING, SQUARE_API_PRICING, SQUARE_PAYMENT_TERMS, SQUARE_BUYER_DATA_GAP],
    },
    {
      clauseArea: 'Security, privacy, and regulated data boundary',
      buyerPosition:
        'Map payment data, customer data, receipts, buyer profiles, invoices, online-store data, staff access, support artifacts, API tokens, webhooks, and third-party apps to Square privacy, DPA, security, PCI, SCA, and incident-response expectations.',
      fallbackPosition:
        'At minimum, require PCI and privacy signoff for the exact products, API paths, locations, support roles, and data flows before production cutover.',
      sourceBasis: [SQUARE_SECURITY, SQUARE_CARD_PAYMENTS, SQUARE_PRIVACY, SQUARE_DPA, SQUARE_GENERAL_TERMS],
    },
    {
      clauseArea: 'Availability, incident visibility, and operational fallback',
      buyerPosition:
        'Document service-status monitoring, store-level offline procedures, incident communications, manual fallback, reconciliation, device replacement, access recovery, and exit/export paths for every location and online channel.',
      fallbackPosition:
        'If no negotiated SLA exists, treat public status-page visibility as an operational signal only and require buyer-owned runbooks for payment outage, POS outage, network outage, and delayed payout scenarios.',
      sourceBasis: [SQUARE_STATUS, SQUARE_PAYMENTS, SQUARE_GENERAL_TERMS, SQUARE_BUYER_DATA_GAP],
    },
  ],
  negotiationLevers: [
    {
      lever: 'Processing-history-backed rate and plan normalization',
      whenToUse:
        'Use when Square is compared with merchant acquirers, payment facilitators, POS bundles, restaurant platforms, retail POS vendors, or eCommerce payment providers.',
      buyerAsk:
        'Require a workbook that models actual card mix, in-person versus online split, average ticket, keyed-in transactions, refunds, chargebacks, payout timing, locations, devices, software tiers, online-store tiers, invoices, APIs, and add-ons against each finalist.',
      tradeoffs: [
        'Square may simplify setup and operations for some merchants, but an all-in platform comparison can mask processing, hardware, software, dispute, payout, and integration costs unless each unit is separated.',
      ],
      evidenceBasis: [SQUARE_POS_PRICING, SQUARE_ONLINE_PLANS, SQUARE_API_PRICING, SQUARE_BUYER_DATA_GAP],
    },
    {
      lever: 'Commerce workflow proof before platform expansion',
      whenToUse:
        'Use before expanding from basic card acceptance into Square Online, retail inventory, restaurant workflows, appointments, loyalty, marketing, staff, banking-adjacent features, or custom developer integrations.',
      buyerAsk:
        'Trade expansion only for scripted proof covering item catalog, taxes, discounts, inventory, online order, refund, dispute, payout reconciliation, API tokenization, webhook handling, role permissions, and outage fallback.',
      tradeoffs: [
        'Proof work adds sourcing effort, but it prevents a low-friction signup from becoming an ungoverned commerce operating system with unclear data, support, and exit ownership.',
      ],
      evidenceBasis: [SQUARE_RETAIL, SQUARE_RESTAURANTS, SQUARE_DEVELOPER_PAYMENTS, SQUARE_CARD_PAYMENTS],
    },
  ],
  riskFactors: [
    {
      id: 'square-effective-cost-blind-spot',
      label: 'Effective cost and cash-flow blind spot',
      severity: 'high',
      detectionSignals: [
        'Benchmark compares only headline processing rates or plan prices without card mix, transaction size, refunds, disputes, payouts, reserves, hardware, and add-ons',
        'Finance has not reconciled Square Dashboard exports, bank deposits, chargebacks, refund timing, software fees, and hardware invoices',
      ],
      mitigations: ['Build actual processing baseline', 'Model seasonal and channel sensitivity', 'Separate processor, POS, online, hardware, and add-on costs'],
      contractualRemedies: ['Pricing schedule', 'Payout and reserve review process', 'Chargeback operating exhibit', 'Renewal and add-on controls'],
      sourceBasis: [SQUARE_POS_PRICING, SQUARE_API_PRICING, SQUARE_PAYMENT_TERMS, SQUARE_BUYER_DATA_GAP],
    },
    {
      id: 'square-platform-scope-creep',
      label: 'Commerce platform scope creep',
      severity: 'high',
      detectionSignals: [
        'Initial payment acceptance decision expands into POS, online store, inventory, loyalty, marketing, staff, invoices, and developer integrations without separate owners',
        'Stores or channels are added before permissions, catalog governance, tax setup, reconciliation, support, and exit ownership are defined',
      ],
      mitigations: ['Create product-by-product scope schedule', 'Assign business and technical owners', 'Gate expansion on workflow proof and support model'],
      contractualRemedies: ['Change control', 'Implementation acceptance criteria', 'Data export and transition assistance', 'Support escalation path'],
      sourceBasis: [SQUARE_PAYMENTS, SQUARE_ONLINE_PLANS, SQUARE_RETAIL, SQUARE_RESTAURANTS],
    },
    {
      id: 'square-data-and-compliance-boundary-gap',
      label: 'Data and compliance boundary gap',
      severity: 'medium',
      detectionSignals: [
        'Security review treats PCI and security pages as approval without mapping customer data, receipt data, buyer profiles, support access, API tokens, webhooks, and third-party apps',
        'Online or API workflows collect regulated data in forms, receipts, notes, orders, metadata, support tickets, or integrations without privacy review',
      ],
      mitigations: ['Map data flows', 'Confirm PCI scope', 'Review privacy notice and DPA', 'Limit regulated data in commerce metadata and support artifacts'],
      contractualRemedies: ['Security exhibit', 'DPA review', 'Access-control requirements', 'Incident notification and data export language'],
      sourceBasis: [SQUARE_SECURITY, SQUARE_PRIVACY, SQUARE_DPA, SQUARE_CARD_PAYMENTS],
    },
  ],
  industryVariants: [
    {
      industry: 'retail_cpg',
      modifier:
        'Raise scrutiny on inventory synchronization, online-to-store pickup, local delivery, promotions, seasonality, refund flows, gift cards, loyalty, payment devices, tax setup, and omnichannel reconciliation.',
      affectedStages: ['Scope', 'RFP', 'BAFO'],
    },
    {
      industry: 'healthcare',
      modifier:
        'Confirm whether PHI could enter appointment notes, invoices, receipts, item names, customer profiles, support tickets, APIs, webhooks, or online forms before approving Square for healthcare-adjacent workflows.',
      additionalRequirements: ['PHI boundary decision', 'HIPAA/BAA legal review if PHI is in scope', 'Minimum necessary data-entry controls'],
      affectedStages: ['Scope', 'RFP', 'Contracting'],
    },
    {
      industry: 'financial_services',
      modifier:
        'Treat Square as an outsourced payment and commerce dependency where customer data, operational resilience, exit planning, subcontractor review, audit evidence, incident handling, and cash-flow controls must be documented.',
      regulatoryRefs: ['DORA where applicable to EU financial entities', 'PCI DSS where cardholder data environment is relevant'],
      affectedStages: ['BAFO', 'Contracting'],
    },
    {
      industry: 'public_sector',
      modifier:
        'Validate procurement eligibility, tax and fee treatment, payment-method rules, records retention, privacy obligations, accessibility of online commerce flows, incident response, and public-records export needs.',
      affectedStages: ['Scope', 'BAFO', 'Contracting'],
    },
  ],
  body: `## Summary
Square should be sourced as a merchant commerce operating layer, not only as a payment-processing line item. Public Square materials describe a broad product family for accepting payments in person, online, through invoices, through checkout links, through POS products, through Square Online, through vertical retail and restaurant workflows, and through developer APIs and SDKs. The value proposition is operational convenience: a merchant can combine payment acceptance, hardware, catalog, order, checkout, inventory, staff, loyalty, marketing, reporting, disputes, refunds, payouts, and customer workflows under one provider. The sourcing risk is the same breadth. Once Square is embedded into checkout lanes, online ordering, invoices, receipts, devices, APIs, reconciliation, staff permissions, and customer profiles, the decision is no longer a simple rate comparison.

## Where Square fits
Use this pattern when Square is an incumbent, challenger, or expansion candidate for merchant services, POS modernization, retail operations, restaurant payments, online ordering, appointments, invoices, mobile payment acceptance, or custom commerce integrations. Square's public payments page says the platform supports in-person and online payment acceptance, security features, fraud prevention, disputes, end-to-end encryption, PCI support, and multiple payment methods. Square's developer documentation shows that payment processing can be connected with Orders, Refunds, Disputes, Cards, Payouts, Bank Accounts, Invoices, Subscriptions, Customers, Catalog, and Staff APIs. Public Square Online, Retail, and Restaurants materials show that payment acceptance often travels with store, inventory, menu, ordering, checkout, fulfillment, reporting, and hardware decisions.

That makes Square strongest for buyers that want a tightly connected commerce workflow and can accept Square's processor and operating model. It is riskier when the buyer wants independent acquiring, complex enterprise routing, specialized restaurant or retail processes, custom data residency controls, or a negotiated enterprise support and SLA structure that is not documented in the public materials. The sourcing file should therefore separate Square as processor, POS, online store, hardware vendor, developer platform, and operational support dependency.

## Evidence to collect
Start with actual processing data. Public pages can show plan structures, payment methods, public rate mechanisms, security posture, developer patterns, legal terms, and payment terms. They cannot prove the buyer's effective cost. The buyer needs at least twelve months of transactions if available, split by in-person, online, keyed-in, invoice, card-on-file, wallet, ACH, Afterpay or other tender, refund, dispute, location, and average ticket. Finance should reconcile Square Dashboard reports to bank deposits, fees, chargebacks, refunds, payout timing, software subscriptions, hardware invoices, and any third-party apps.

Next collect operational scope. Inventory locations, registers, terminals, readers, kiosks, online stores, catalog owners, menu owners, tax rules, discounts, gift cards, loyalty, marketing, staff permissions, invoices, subscriptions, developer apps, webhook endpoints, API tokens, support roles, and accounting integrations. For a retail buyer, require inventory, purchase-order, barcode, online pickup, local delivery, returns, exchanges, and omnichannel stock proof. For restaurants, require ordering, menu, modifiers, kitchen display, table or counter workflow, tips, service charges, offline procedure, and refund proof. For developers, require tokenized card collection, idempotency, webhooks, refund handling, dispute workflows, payout reconciliation, SCA requirements where applicable, and strict avoidance of direct card data submission.

## Security, privacy, and legal posture
Public security evidence is useful but not sufficient. Square publishes security materials describing PCI DSS Level 1, ISO 27001, encryption, secure hardware and software, server monitoring, cryptographic protocols, and vulnerability reporting. Square developer card-payment guidance says applications should use Web Payments SDK or In-App Payments SDK tokens instead of sending card details directly to CreatePayment, and states Square manages PCI compliance, fraud detection, and disputes as part of processing. Those are strong public anchors for a sourcing baseline.

The buyer still has to map real data flows. Square may touch seller account data, customer data, receipt data, buyer profiles, invoices, online-store data, item and order metadata, staff data, support artifacts, third-party app data, webhooks, and API tokens. Review the Privacy Notice, Data Processing Terms, General Terms, Payment Terms, and service-specific terms against the exact products being purchased. If healthcare, public sector, regulated financial services, or children's data could appear in orders, notes, metadata, invoices, receipts, support interactions, or online forms, do not assume payment security alone resolves the privacy or regulatory question.

## Commercial posture
Do not benchmark Square from a headline rate. Public POS, online, and developer pricing pages should be used as pricing-mechanism evidence only. The real comparison must include payment channel, card mix, average ticket, refunds, disputes, chargebacks, payout timing, reserve risk, hardware fleet, software plan tiers, online-store tiers, loyalty, marketing, staff, payroll or banking-adjacent features, implementation work, third-party apps, and accounting reconciliation. Square's public Payment Terms include concepts around underwriting, identity verification, access to proceeds, payout schedule, reserves, account balances, set-off rights, chargebacks, taxes, and customer service. Those provisions matter for merchant cash flow and should be reviewed by finance, legal, and store operations before award.

A good BAFO asks Square or the reseller to provide a product-by-product scope schedule, published-rate and custom-rate assumptions, hardware schedule, support model, implementation plan, data export plan, and incident fallback model. If the buyer is switching away from Square, require extraction of catalog, customer, order, payment, invoice, staff, loyalty, gift card, and reconciliation data where available, plus a cutover plan for terminals, readers, online checkout, redirects, DNS, API keys, webhooks, accounting imports, and store training.

## Contradictions and failure modes
Vendor claim: Square is simple and all-in-one. Detection: prove that the exact store, online, invoice, API, staff, inventory, tax, refund, dispute, and reconciliation workflows fit the buyer's operations. Vendor claim: pricing is transparent. Detection: calculate actual effective cost from buyer statements and deposits, including disputes, refunds, add-ons, hardware, software, and payout effects. Vendor claim: security is handled. Detection: map PCI scope, customer data, third-party apps, API tokens, webhooks, staff permissions, support access, privacy obligations, and regulated-data exclusions.

The main failure mode is treating Square as a quick payments decision while it becomes the system of record for commerce operations. The second failure is ignoring cash-flow risk from reserves, payout delays, chargebacks, refunds, or account review. The third failure is adding Square Online, retail, restaurant, loyalty, marketing, staff, or developer capabilities without assigning owners and exit paths. Square can be a credible merchant commerce platform, but the sourcing file should prove exactly which locations, channels, data, devices, workflows, and financial flows will depend on it.`,
};
