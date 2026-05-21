// Domain Function Pack — Financial services · Commercial & corporate banking.
//
// Function key: `commercial_corporate_banking`.
//
// This pack covers the commercial and corporate banking function: the
// relationship-led business that lends to and serves middle-market and
// large corporate clients. It spans commercial lending and credit (origination,
// underwriting, the credit decision, portfolio monitoring, covenant tracking,
// and renewal or remediation), treasury and cash-management services (operating
// accounts, payments, liquidity, working-capital and trade finance), and the
// relationship banking that ties the two together — the relationship manager
// who owns the client, the share of wallet, and the cross-sell.
//
// The operating reality the pack encodes: a commercial bank earns its return
// from two engines that must work together. Credit earns net interest income
// on the loan book but bears credit risk and consumes regulatory capital;
// treasury management earns fee income and low-cost operating deposits at a
// fraction of the capital intensity. The relationship is the asset that holds
// both — a credit-only client is capital-heavy and unprofitable on a
// risk-adjusted basis, while a full relationship with operating accounts,
// payments, and treasury services earns a multiple of the return. The function
// leaks return when origination is slow, when underwriting is manual and
// inconsistent, when portfolio deterioration is caught late, when treasury
// onboarding takes months, and when the relationship banker has no real view
// of client profitability or whitespace. The AI archetypes are the recurring
// bets against exactly that reality.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const commercialCorporateBankingPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'commercial_corporate_banking',
  functionLabel: 'Commercial & corporate banking',
  summary:
    'Commercial and corporate banking is the relationship-led function ' +
    'that lends to and serves middle-market and large corporate clients: ' +
    'originating and underwriting commercial credit, monitoring the loan ' +
    'portfolio and its covenants, delivering treasury and cash-management ' +
    'services — operating accounts, payments, liquidity, and ' +
    'working-capital finance — and managing the client relationship that ' +
    'ties credit and treasury together. Its economics are net interest ' +
    'income earned on the loan book against the credit risk and regulatory ' +
    'capital it consumes, fee income and low-cost operating deposits from ' +
    'treasury-management services, and the risk-adjusted return on the ' +
    'whole relationship. A bank wins by originating and underwriting ' +
    'credit fast and consistently, by catching portfolio deterioration ' +
    'early, by onboarding treasury services quickly, and by deepening ' +
    'each relationship so it earns capital-light fee and deposit income ' +
    'rather than capital-heavy credit alone — the function is judged on ' +
    'risk-adjusted relationship return, not on loan growth alone.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'credit_decision_cycle_time',
      name: 'Credit-decision cycle time',
      definition:
        'The elapsed time from a complete commercial-loan application to a ' +
        'credit decision — approval, decline, or counter-offer — including ' +
        'underwriting and credit-committee review.',
      unit: 'business days from complete application to decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Credit-decision cycle time varies with deal size and ' +
          'complexity — small business credits decide fast, large ' +
          'syndicated facilities slowly. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The commercial loan-origination system, time-stamped from a ' +
        'complete application to the recorded credit decision.',
      whyItMatters:
        'Slow credit decisions lose deals to faster competitors and ' +
        'frustrate relationship clients; cycle time is the leading read ' +
        'on origination competitiveness and on underwriting drag.',
    },
    {
      key: 'loan_origination_cost',
      name: 'Cost to originate a commercial loan',
      definition:
        'The fully loaded cost — relationship, credit, underwriting, ' +
        'documentation, and closing effort — of originating and booking a ' +
        'commercial loan.',
      unit: 'USD cost per loan originated',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2500,
        high: 25000,
        basis:
          'Origination cost scales with deal complexity and the manual ' +
          'underwriting and documentation load; structured deals sit far ' +
          'higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Commercial-banking cost accounting reconciled against loan-' +
        'origination-system booked-loan volume.',
      whyItMatters:
        'Origination cost is the efficiency ratio of the lending engine; ' +
        'manual underwriting, documentation rework, and exception handling ' +
        'are what drive it up — the cost automation directly attacks.',
    },
    {
      key: 'underwriting_rework_rate',
      name: 'Underwriting rework rate',
      definition:
        'The share of credit applications that cycle back from credit ' +
        'review or committee for missing analysis, inconsistent spreading, ' +
        'or incomplete documentation before a decision can be made.',
      unit: '% of applications requiring rework before decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 40,
        basis:
          'Rework rates depend on credit-package quality, spreading ' +
          'consistency, and policy clarity; a disciplined operation sits ' +
          'lower. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination and credit-workflow system, tracking ' +
        'applications returned for rework before a decision.',
      whyItMatters:
        'Every rework loop is delay, cost, and a touch that consumes ' +
        'underwriter capacity; the rework rate is the leading indicator ' +
        'of how much avoidable drag the credit process carries.',
    },
    {
      key: 'portfolio_at_risk',
      name: 'Portfolio at risk — criticised and classified loans',
      definition:
        'The share of the commercial loan portfolio risk-rated as ' +
        'criticised or classified — special mention, substandard, or worse ' +
        '— relative to total commercial loans outstanding.',
      unit: '% of commercial loan balances criticised or classified',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 8,
        basis:
          'Criticised-and-classified rates move with the credit cycle, ' +
          'industry concentration, and underwriting discipline; the band ' +
          'spans a benign book to a stressed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The credit risk-rating system reconciled against the commercial ' +
        'loan portfolio ledger.',
      whyItMatters:
        'Criticised and classified balances are the early read on credit ' +
        'losses to come and drive both loan-loss provisioning and ' +
        'regulatory scrutiny — the headline portfolio-health metric.',
    },
    {
      key: 'covenant_breach_detection_lag',
      name: 'Covenant-breach detection lag',
      definition:
        'The elapsed time between a borrower actually breaching a loan ' +
        'covenant and the bank detecting and recording the breach.',
      unit: 'days from breach to bank detection',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 90,
        basis:
          'Detection lag depends on financial-reporting cadence and ' +
          'whether covenant testing is automated or manual; quarterly ' +
          'manual testing sits at the high end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The covenant-tracking and portfolio-monitoring system, comparing ' +
        'breach event dates against detection dates.',
      whyItMatters:
        'A covenant breach is an early warning of borrower distress; the ' +
        'longer it goes undetected, the less room the bank has to act ' +
        'before the credit deteriorates further.',
    },
    {
      key: 'treasury_onboarding_time',
      name: 'Treasury-management onboarding time',
      definition:
        'The elapsed time from a client agreeing to a treasury or ' +
        'cash-management service to that service being live and ' +
        'transacting — accounts opened, payments enabled, integrations ' +
        'complete.',
      unit: 'business days from sale to service live',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 10,
        high: 75,
        basis:
          'Treasury onboarding time depends on product complexity, ' +
          'integration effort, and documentation; multi-entity ' +
          'liquidity structures sit at the high end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The treasury-services implementation and onboarding workflow ' +
        'system, time-stamped from sale to go-live.',
      whyItMatters:
        'Slow treasury onboarding delays fee income and operating-deposit ' +
        'capture, frustrates the client at the most fragile point of the ' +
        'relationship, and is a common reason a sold service is never ' +
        'activated.',
    },
    {
      key: 'treasury_fee_income_per_client',
      name: 'Treasury-management fee income per client',
      definition:
        'The annual treasury and cash-management fee income earned per ' +
        'commercial relationship — payments, account, liquidity, and ' +
        'trade-finance fees.',
      unit: 'USD annual treasury fee income per relationship',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5000,
        high: 150000,
        basis:
          'Treasury fee income per client varies enormously by client ' +
          'size and service depth — a small operating account to a full ' +
          'multi-product treasury relationship. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The treasury-services billing system reconciled against the ' +
        'commercial relationship master.',
      whyItMatters:
        'Treasury fee income is capital-light, recurring, and sticky; it ' +
        'is the engine that turns a capital-heavy credit relationship ' +
        'into a profitable one, so per-client fee depth is a core return ' +
        'metric.',
    },
    {
      key: 'operating_deposit_ratio',
      name: 'Operating-deposit ratio',
      definition:
        'The share of a relationship’s deposit balances that are stable, ' +
        'low-cost operating deposits tied to treasury services rather ' +
        'than rate-sensitive, flighty balances.',
      unit: '% of relationship deposits that are operating deposits',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 80,
        basis:
          'The operating-deposit share depends on how embedded treasury ' +
          'services are in the client’s cash cycle; a deep treasury ' +
          'relationship holds stickier balances. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The deposit and treasury-services systems, classifying balances ' +
        'by operating versus rate-sensitive type.',
      whyItMatters:
        'Operating deposits are a cheap, stable funding source that ' +
        'directly improves the bank’s net interest margin and liquidity ' +
        'profile; a high ratio signals a genuinely embedded relationship.',
    },
    {
      key: 'credit_facility_utilization',
      name: 'Commercial credit-facility utilisation',
      definition:
        'The share of committed commercial credit lines and revolving ' +
        'facilities that borrowers actually draw, against the total ' +
        'committed amount.',
      unit: '% of committed credit lines drawn',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 35,
        high: 70,
        basis:
          'Facility utilisation moves with the economic cycle and client ' +
          'working-capital needs; a deliberate band balances client ' +
          'service against undrawn-commitment capital cost. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The commercial loan system, comparing drawn balances against ' +
        'committed facility amounts.',
      whyItMatters:
        'Undrawn commitments still consume capital and liquidity ' +
        'capacity; utilisation is the read on whether committed credit is ' +
        'productively deployed or sized well beyond what the client uses.',
    },
    {
      key: 'relationship_revenue_yield',
      name: 'Risk-adjusted relationship revenue yield',
      definition:
        'Total relationship revenue — net interest income plus treasury ' +
        'and other fees — net of expected credit loss, expressed as a ' +
        'return on the regulatory capital the relationship consumes.',
      unit: '% risk-adjusted return on relationship capital',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 8,
        high: 22,
        basis:
          'Risk-adjusted relationship return varies sharply with the ' +
          'credit-to-treasury mix — credit-only relationships sit low, ' +
          'full treasury relationships high. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Relationship-profitability reporting combining loan, treasury, ' +
        'and capital-attribution data.',
      whyItMatters:
        'It is the truest measure of relationship value — it strips out ' +
        'capital intensity and shows whether a relationship genuinely ' +
        'earns its balance sheet or is loan growth that destroys value.',
    },
    {
      key: 'cross_sell_ratio',
      name: 'Cross-sell ratio — products per relationship',
      definition:
        'The average number of distinct bank products and services held ' +
        'per commercial relationship — credit, deposits, payments, ' +
        'treasury, trade finance, and adjacent services.',
      unit: 'products per commercial relationship',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 7,
        basis:
          'Products per relationship depend on client size and how ' +
          'systematically whitespace is worked; a single-product credit ' +
          'client sits at the floor. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The relationship master and product systems, counting active ' +
        'products per commercial relationship.',
      whyItMatters:
        'Cross-sell depth is the read on relationship stickiness and ' +
        'capital-light revenue; a multi-product relationship is harder to ' +
        'lose and earns a far higher risk-adjusted return.',
    },
    {
      key: 'rm_portfolio_size',
      name: 'Relationship-manager portfolio size',
      definition:
        'The number of commercial relationships, weighted by complexity, ' +
        'a relationship manager carries — the read on RM capacity and the ' +
        'attention each client receives.',
      unit: 'complexity-weighted relationships per RM',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 20,
        high: 80,
        basis:
          'RM portfolio size sits in a deliberate band — too small ' +
          'underuses costly RM capacity, too large means clients go ' +
          'unattended and whitespace is missed. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The relationship-management system, counting complexity-weighted ' +
        'relationships per relationship manager.',
      whyItMatters:
        'RM capacity is expensive and finite; portfolio size is the read ' +
        'on whether RMs can actually serve and grow their book or are ' +
        'stretched so thin that relationships drift.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'slow_manual_underwriting',
      name: 'Slow, manual, inconsistent underwriting',
      description:
        'Credit underwriting is a manual, document-heavy process — ' +
        'spreading financials by hand, assembling the credit package, ' +
        'cycling through review. Decisions are slow, cost is high, and ' +
        'risk-rating is inconsistent from underwriter to underwriter.',
      detectionSignal:
        'Credit-decision cycle time is long, origination cost is high, ' +
        'and the underwriting rework rate shows packages cycling back ' +
        'before a decision.',
      diagnosticQuestion:
        'How long does a commercial credit decision take, how much does ' +
        'it cost, and how consistent is risk-rating across underwriters?',
    },
    {
      key: 'late_portfolio_deterioration',
      name: 'Late detection of portfolio deterioration',
      description:
        'Credit deterioration is caught late — at the next annual review ' +
        'or quarterly covenant test — rather than from early-warning ' +
        'signals. By the time the bank acts, the credit has already ' +
        'migrated and the room to remediate has narrowed.',
      detectionSignal:
        'Covenant-breach detection lag is long, criticised-and-classified ' +
        'migration is detected at review rather than between reviews, and ' +
        'monitoring is calendar-driven not signal-driven.',
      diagnosticQuestion:
        'How early does the bank detect borrower distress — from ' +
        'continuous signals or only at the next scheduled review?',
    },
    {
      key: 'covenant_tracking_gap',
      name: 'Covenant-tracking gap',
      description:
        'Loan covenants are tracked in spreadsheets and credit-file ' +
        'notes, tested manually against borrower financials that arrive ' +
        'late and in inconsistent formats. Breaches are missed or found ' +
        'long after the fact.',
      detectionSignal:
        'Covenants are not held in a structured system, testing is ' +
        'manual and quarterly, and breach-detection lag is long and ' +
        'variable.',
      diagnosticQuestion:
        'Are loan covenants tracked and tested systematically, or held ' +
        'in spreadsheets and tested manually when financials arrive?',
    },
    {
      key: 'treasury_onboarding_friction',
      name: 'Treasury-onboarding friction',
      description:
        'A sold treasury or cash-management service takes weeks or months ' +
        'to go live — account opening, integration, documentation, and ' +
        'implementation are slow and manual. Fee income is delayed and ' +
        'some sold services are never activated.',
      detectionSignal:
        'Treasury-onboarding time is long, a backlog of sold-but-not-live ' +
        'services sits open, and clients escalate implementation delays.',
      diagnosticQuestion:
        'How long does it take a sold treasury service to go live, and ' +
        'how many sold services are never activated?',
    },
    {
      key: 'shallow_relationships',
      name: 'Shallow, credit-only relationships',
      description:
        'Relationships are won on a loan and never deepened. The client ' +
        'borrows but banks its operating accounts, payments, and treasury ' +
        'elsewhere — so the bank carries the capital-heavy credit risk ' +
        'without the capital-light fee and deposit income that makes the ' +
        'relationship pay.',
      detectionSignal:
        'The cross-sell ratio is low, the operating-deposit ratio is ' +
        'thin, and risk-adjusted relationship yield is weak on otherwise ' +
        'large credits.',
      diagnosticQuestion:
        'How many relationships are credit-only, and what share of each ' +
        'client’s treasury and operating business does the bank actually ' +
        'hold?',
    },
    {
      key: 'no_whitespace_visibility',
      name: 'No whitespace or relationship-profitability visibility',
      description:
        'The relationship manager has no real, current view of client ' +
        'profitability, product whitespace, or risk-adjusted return. ' +
        'Cross-sell is opportunistic, capital-destroying relationships go ' +
        'unspotted, and pricing is not informed by the whole-relationship ' +
        'economics.',
      detectionSignal:
        'Relationship profitability is not reported at the RM desktop, ' +
        'whitespace is not surfaced systematically, and pricing decisions ' +
        'cite the single product not the relationship.',
      diagnosticQuestion:
        'Does the relationship manager see real-time client ' +
        'profitability and product whitespace, or is cross-sell ' +
        'opportunistic and uninformed?',
    },
    {
      key: 'fragmented_client_data',
      name: 'Fragmented client and credit data',
      description:
        'Credit, deposit, treasury, payments, and KYC data sit in ' +
        'separate systems with no single client view. Underwriting ' +
        're-collects what the bank already holds, monitoring is partial, ' +
        'and the RM cannot see the whole client.',
      detectionSignal:
        'There is no single commercial-client view, the same client data ' +
        'is re-keyed across systems, and a relationship’s full footprint ' +
        'cannot be assembled without manual effort.',
      diagnosticQuestion:
        'Is there a single, current view of the whole commercial client ' +
        'across credit, deposits, treasury, and payments, or is it ' +
        'fragmented across systems?',
    },
    {
      key: 'undrawn_capital_drag',
      name: 'Undrawn-commitment and capital drag',
      description:
        'Committed credit lines are sized well beyond what clients draw. ' +
        'Undrawn commitments still consume capital and liquidity, and ' +
        'facilities are renewed at the same size out of habit rather than ' +
        'on observed utilisation.',
      detectionSignal:
        'Facility utilisation runs persistently low, undrawn commitments ' +
        'are a large share of the book, and renewals do not re-size to ' +
        'observed draw behaviour.',
      diagnosticQuestion:
        'How much committed credit sits undrawn, and are facilities ' +
        'sized and renewed against observed utilisation or out of habit?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_credit_underwriting',
      name: 'AI-assisted credit underwriting and spreading',
      valueMechanism:
        'A model extracts and spreads borrower financial statements, ' +
        'assembles the credit package, drafts the credit narrative, and ' +
        'proposes a risk rating against credit policy — so underwriters ' +
        'review and decide rather than assemble. Value comes from faster, ' +
        'cheaper, and more consistent underwriting — cutting cycle time, ' +
        'origination cost, and the rework that comes from inconsistent ' +
        'packages.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Borrower financial statements, tax returns, and supporting docs',
        'Credit policy, risk-rating models, and underwriting standards',
        'Historical credit decisions and their outcomes',
        'Industry, collateral, and market reference data',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model spreads, drafts, and proposes a rating; a credit ' +
          'officer owns the credit decision and the final risk rating.',
        'Extracted financials and the proposed rating must be traceable ' +
          'to the source documents — the model does not infer numbers the ' +
          'documents do not support.',
        'Fair-lending and credit-policy compliance must be tested — the ' +
          'model must not encode a bias or drift from sanctioned policy, ' +
          'and decisions must be explainable to a regulator.',
      ],
      metricsMoved: [
        'credit_decision_cycle_time',
        'loan_origination_cost',
        'underwriting_rework_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'portfolio_early_warning',
      name: 'Portfolio early-warning and credit-monitoring intelligence',
      valueMechanism:
        'A model continuously scores the commercial portfolio for ' +
        'early signs of borrower distress — deposit-balance trends, ' +
        'transaction behaviour, financial-ratio drift, industry stress — ' +
        'and flags credits likely to migrate before the next scheduled ' +
        'review. Value comes from catching deterioration early, when ' +
        'remediation is still possible and the loss can still be ' +
        'contained.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Borrower financials and risk-rating history',
        'Client deposit-balance and transaction-behaviour data',
        'Industry, macroeconomic, and market-stress signals',
        'Historical credit-migration and default outcomes',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model flags credits at risk and the drivers; a credit ' +
          'officer owns the risk-rating change and any remediation ' +
          'action.',
        'An early-warning flag must be explainable to the signals behind ' +
          'it so a credit officer can act on it and trust it.',
        'The model must be revalidated through the credit cycle — ' +
          'distress signals that worked in a benign period may not hold ' +
          'in a downturn.',
      ],
      metricsMoved: [
        'portfolio_at_risk',
        'covenant_breach_detection_lag',
        'relationship_revenue_yield',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'covenant_monitoring_automation',
      name: 'Automated covenant tracking and testing',
      valueMechanism:
        'An agent extracts covenant terms from loan agreements into a ' +
        'structured tracker, ingests borrower financials as they arrive, ' +
        'tests covenants automatically, and flags breaches and approaching ' +
        'breaches the moment they occur. Value comes from collapsing ' +
        'covenant-breach detection lag and removing the manual, ' +
        'spreadsheet-based testing that misses breaches.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Loan agreements with their covenant terms and definitions',
        'Borrower financial statements and compliance certificates',
        'Covenant calculation logic and testing schedules',
        'The portfolio-monitoring and credit-file systems',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent extracts covenants, tests them, and flags breaches; a ' +
          'credit officer confirms a breach and owns the waiver or ' +
          'remediation decision.',
        'Covenant extraction must be reviewed against the loan ' +
          'agreement — a mis-extracted term produces a wrong test and a ' +
          'missed or false breach.',
        'A flagged breach has contractual and regulatory consequence; the ' +
          'detection and its evidence must be auditable.',
      ],
      metricsMoved: [
        'covenant_breach_detection_lag',
        'portfolio_at_risk',
        'underwriting_rework_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'treasury_onboarding_automation',
      name: 'Treasury-onboarding and implementation automation',
      valueMechanism:
        'An agent orchestrates treasury-service onboarding — account ' +
        'opening, documentation, KYC refresh, entitlement setup, and ' +
        'integration steps — tracking each task, chasing the missing ' +
        'inputs, and surfacing only the exceptions. Value comes from ' +
        'collapsing onboarding time so fee income and operating deposits ' +
        'start sooner and fewer sold services stall unactivated.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The sold treasury-service package and its implementation steps',
        'Existing client KYC, account, and entitlement data',
        'Documentation requirements and onboarding workflow rules',
        'Integration and file-format specifications for the client',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent orchestrates and chases the onboarding workflow; an ' +
          'implementation specialist owns exceptions and the client ' +
          'relationship through go-live.',
        'KYC and account-opening steps carry hard regulatory requirements ' +
          '— the agent must not shortcut a control to hit a speed target.',
        'Entitlement and payment-capability setup must be verified before ' +
          'go-live — a wrong entitlement is a fraud and operational-loss ' +
          'exposure.',
      ],
      metricsMoved: [
        'treasury_onboarding_time',
        'treasury_fee_income_per_client',
        'operating_deposit_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'relationship_whitespace_intelligence',
      name: 'Relationship whitespace and next-best-action intelligence',
      valueMechanism:
        'A model assembles a whole-relationship view — credit, deposits, ' +
        'treasury, payments, and risk-adjusted profitability — and ' +
        'surfaces product whitespace and next-best actions to the ' +
        'relationship manager, prioritised by relationship value. Value ' +
        'comes from systematic, profitability-aware cross-sell that ' +
        'deepens relationships into capital-light fee and deposit income.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'A unified commercial-client view across all products',
        'Relationship-level profitability and capital-attribution data',
        'Product-holding and peer-benchmark data for whitespace',
        'Client industry and lifecycle context',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces whitespace and next-best actions; the ' +
          'relationship manager owns the client conversation and the ' +
          'judgement of fit.',
        'Recommendations must be genuinely client-appropriate — a ' +
          'profitability-driven cross-sell that does not suit the client ' +
          'erodes trust and the relationship.',
        'Profitability and capital figures must be sound — a flawed ' +
          'relationship-yield number misdirects pricing and prioritisation.',
      ],
      metricsMoved: [
        'cross_sell_ratio',
        'relationship_revenue_yield',
        'treasury_fee_income_per_client',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'rm_relationship_copilot',
      name: 'Relationship-manager copilot and portfolio assistant',
      valueMechanism:
        'An assistant prepares relationship reviews, drafts call notes ' +
        'and credit memos, answers questions across the client’s full ' +
        'footprint, and flags portfolio actions due — covenant tests, ' +
        'renewals, reviews — so the relationship manager spends time with ' +
        'clients rather than assembling information. Value comes from ' +
        'freeing RM capacity, letting each RM serve and grow a larger, ' +
        'better-attended book.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The unified commercial-client and portfolio data',
        'Credit files, call notes, and relationship history',
        'Portfolio task and review calendars',
        'Bank product, policy, and pricing knowledge',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot drafts and assembles; the relationship manager owns ' +
          'every client-facing communication and credit document.',
        'Drafted credit memos and call notes must be reviewed — they feed ' +
          'credit decisions and the official record, and a fabricated ' +
          'detail is a serious risk.',
        'The assistant must respect client-data confidentiality and ' +
          'information-barrier rules across the relationship footprint.',
      ],
      metricsMoved: [
        'rm_portfolio_size',
        'cross_sell_ratio',
        'credit_decision_cycle_time',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'augmented_underwriting_layer',
      name: 'Augmented credit-underwriting layer',
      description:
        'A pattern that extracts and spreads borrower financials, ' +
        'assembles the credit package, drafts the credit narrative, and ' +
        'proposes a policy-aligned risk rating into the loan-origination ' +
        'workflow — so underwriters review and decide on a complete, ' +
        'consistent package rather than assembling it by hand.',
      boundary:
        'It spreads, drafts, and proposes a rating; a credit officer owns ' +
        'the credit decision and the final risk rating. It does not ' +
        'approve credit or commit the bank.',
      humanAccountabilityPoint:
        'The chief credit officer accountable for credit quality, ' +
        'risk-rating integrity, and underwriting policy.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'document_intelligence',
    },
    {
      key: 'continuous_portfolio_monitoring_layer',
      name: 'Continuous portfolio-monitoring and early-warning layer',
      description:
        'A pattern that continuously scores the commercial portfolio for ' +
        'borrower-distress signals, tests covenants as financials arrive, ' +
        'and flags credits likely to migrate — moving credit monitoring ' +
        'from a calendar-driven review cycle to a continuous, ' +
        'signal-driven discipline.',
      boundary:
        'It monitors, tests, and flags; a credit officer owns the ' +
        'risk-rating change, the waiver, and the remediation decision. It ' +
        'does not re-rate or act on a credit autonomously.',
      humanAccountabilityPoint:
        'The commercial-credit portfolio manager accountable for ' +
        'portfolio quality and early intervention.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'orchestrated_treasury_onboarding_layer',
      name: 'Orchestrated treasury-onboarding layer',
      description:
        'A pattern that orchestrates treasury-service implementation — ' +
        'account opening, KYC, documentation, entitlements, and ' +
        'integration — tracking every task, chasing missing inputs, and ' +
        'surfacing only exceptions, so a sold service goes live in days ' +
        'rather than months.',
      boundary:
        'It orchestrates and chases the workflow; an implementation ' +
        'specialist owns exceptions, control sign-offs, and the client ' +
        'relationship through go-live. It does not bypass a KYC or ' +
        'entitlement control.',
      humanAccountabilityPoint:
        'The head of treasury-services implementation accountable for ' +
        'onboarding speed and control integrity.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'unified_relationship_intelligence_layer',
      name: 'Unified relationship-intelligence layer',
      description:
        'A pattern that assembles a single whole-relationship view across ' +
        'credit, deposits, treasury, and payments with risk-adjusted ' +
        'profitability, and serves whitespace and next-best actions to ' +
        'the relationship manager — so cross-sell and pricing are ' +
        'systematic and profitability-aware rather than opportunistic.',
      boundary:
        'It assembles the view and surfaces recommendations; the ' +
        'relationship manager owns the client conversation and the ' +
        'judgement of fit. It does not contact clients or commit ' +
        'pricing.',
      humanAccountabilityPoint:
        'The head of commercial relationship management accountable for ' +
        'relationship return and cross-sell.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'rm_productivity_copilot_pattern',
      name: 'Relationship-manager productivity-copilot pattern',
      description:
        'A pattern that prepares relationship reviews, drafts call notes ' +
        'and credit memos, answers questions across the client footprint, ' +
        'and flags due portfolio actions — freeing relationship-manager ' +
        'capacity from information assembly so RMs spend time with ' +
        'clients.',
      boundary:
        'It drafts, assembles, and reminds; the relationship manager owns ' +
        'every client communication and credit document. It does not ' +
        'send communications or finalise credit records autonomously.',
      humanAccountabilityPoint:
        'The commercial-banking team lead accountable for RM productivity ' +
        'and the quality of the client record.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Commercial-banking value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, origination efficiency: ' +
      'faster, cheaper, more consistent underwriting cuts cost to ' +
      'originate and cycle time, and a faster decision wins deals — a ' +
      'recurring cost gain plus a revenue effect. Second, credit-loss ' +
      'avoidance: catching portfolio deterioration and covenant breaches ' +
      'early lets the bank remediate before a credit migrates, reducing ' +
      'provisions and charge-offs — a recurring gain, but cyclical, ' +
      'because its size depends on the credit environment. Third, ' +
      'relationship deepening: faster treasury onboarding and systematic ' +
      'whitespace work convert capital-heavy credit-only relationships ' +
      'into capital-light fee and operating-deposit income, lifting ' +
      'risk-adjusted relationship return — the largest and most durable ' +
      'lever, because fee and deposit income earns a high return on a ' +
      'fraction of the capital. The dominant constraint is that ' +
      'commercial banking is relationship-paced and credit-cycle-driven: ' +
      'value lands at the speed clients move and the credit-loss lever ' +
      'depends on the cycle, so a forecast must be read against the ' +
      'client base and the credit environment, not annualised off a ' +
      'benign year.',
    dominantHaircutFactors: [
      {
        factor: 'Credit cycle and credit-environment dependence',
        rationale:
          'The credit-loss-avoidance lever depends on the credit cycle. ' +
          'In a benign environment there is little deterioration to ' +
          'catch; in a downturn the early-warning value is large but so ' +
          'is the loss it cannot prevent. The cycle caps how much of the ' +
          'modelled credit gain is reachable in any given year.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'Value erosion from credit-cycle dependence of the ' +
            'loss-avoidance lever; a planning range read against the ' +
            'credit environment.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data fragmentation and source-system readiness',
        rationale:
          'Underwriting, monitoring, and relationship intelligence all ' +
          'depend on credit, deposit, treasury, and KYC data being ' +
          'complete, consistent, and assembled into a single client ' +
          'view. Fragmentation and poor data quality cap how much of the ' +
          'modelled value can be delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from fragmented client data and poor ' +
            'source-system readiness; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Relationship-manager adoption and client pace',
        rationale:
          'The relationship-deepening and origination gains land only if ' +
          'relationship managers act on the intelligence and clients ' +
          'move at the pace assumed. RM capacity, behaviour change, and ' +
          'the client’s own decision speed cap the realised gain.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial RM adoption and ' +
            'relationship-paced realisation; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Credit-policy and fair-lending governance',
        rationale:
          'Credit underwriting operates under credit policy, ' +
          'fair-lending, and model-risk rules. Validation, ' +
          'explainability, and the requirement that a credit officer own ' +
          'the decision bound how autonomously a model may run and ' +
          'haircut the modelled efficiency gain.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled underwriting gain not reachable ' +
            'within credit-policy and fair-lending governance; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Origination cost and cycle-time reduction',
        range: {
          low: 20,
          high: 50,
          basis:
            'Relative reduction in cost to originate and credit-decision ' +
            'cycle time from augmented underwriting and spreading; a ' +
            'planning range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in cost to originate and in ' +
          'credit-decision cycle time.',
      },
      {
        lever: 'Credit-loss reduction from early warning',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in commercial credit losses from earlier ' +
            'detection and remediation of deteriorating credits; a ' +
            'planning range, strongly cycle-dependent.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in commercial net charge-offs and ' +
          'provisions.',
      },
      {
        lever: 'Treasury-onboarding and fee-income acceleration',
        range: {
          low: 30,
          high: 60,
          basis:
            'Relative reduction in treasury-onboarding time and the ' +
            'resulting acceleration of fee income and operating ' +
            'deposits; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in treasury-onboarding time and ' +
          'earlier capture of fee and deposit income.',
      },
      {
        lever: 'Relationship-return uplift from deepening',
        range: {
          low: 1,
          high: 5,
          basis:
            'Percentage-point uplift in risk-adjusted relationship ' +
            'return from systematic cross-sell into capital-light fee ' +
            'and deposit income; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in risk-adjusted return on ' +
          'relationship capital.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal (credit-' +
      'decision cycle time, treasury-onboarding time, covenant-detection ' +
      'lag); 12–24 months to a settled result, because the credit-loss ' +
      'and relationship-deepening gains realise at the pace of the ' +
      'credit cycle and the relationship, not on a single benign year.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Commercial loan-origination system (LOS)',
        role:
          'The system of record for the credit pipeline — applications, ' +
          'financial spreading, the credit package, underwriting ' +
          'workflow, and the credit decision.',
        examples: [
          'nCino',
          'Moody’s / FIS commercial lending',
          'Abrigo',
          'in-house origination platforms',
        ],
      },
      {
        name: 'Commercial loan-servicing and core-banking system',
        role:
          'Holds booked loans, balances, drawdowns, and payments — the ' +
          'system of record for the commercial loan portfolio.',
        examples: [
          'FIS',
          'Fiserv',
          'Jack Henry',
          'in-house core-banking platforms',
        ],
      },
      {
        name: 'Treasury-management / cash-management platform',
        role:
          'Delivers operating accounts, payments, liquidity, and ' +
          'working-capital services to commercial clients and is the ' +
          'system of record for treasury-service usage and billing.',
        examples: [
          'bank treasury-management portals',
          'payment and liquidity platforms',
          'integrated cash-management suites',
        ],
      },
      {
        name: 'Credit-risk-rating and portfolio-monitoring system',
        role:
          'Holds risk ratings, the credit-monitoring schedule, covenant ' +
          'tracking, and the criticised-and-classified portfolio view.',
        examples: [
          'Moody’s CreditLens',
          'risk-rating engines',
          'portfolio-monitoring and covenant-tracking tools',
        ],
      },
      {
        name: 'CRM and relationship-management system',
        role:
          'Holds the commercial relationship master, call notes, the ' +
          'pipeline, and product holdings — the relationship manager’s ' +
          'view of the client.',
        examples: [
          'Salesforce Financial Services Cloud',
          'bank commercial CRM platforms',
          'relationship-profitability tools',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of commercial / corporate banking',
        accountability:
          'Owns the commercial-banking P&L — loan growth, fee income, ' +
          'deposits, and risk-adjusted relationship return.',
      },
      {
        title: 'Commercial relationship manager',
        accountability:
          'Owns the client relationship, share of wallet, cross-sell, ' +
          'and the growth and retention of the portfolio.',
      },
      {
        title: 'Credit officer / underwriter',
        accountability:
          'Owns credit analysis, the risk rating, the credit decision, ' +
          'and compliance with credit policy.',
      },
      {
        title: 'Commercial-credit portfolio manager',
        accountability:
          'Owns portfolio monitoring, covenant compliance, early-warning ' +
          'review, and credit remediation.',
      },
      {
        title: 'Treasury-management sales officer',
        accountability:
          'Owns the sale and structuring of treasury and cash-management ' +
          'services and the treasury fee-income target.',
      },
      {
        title: 'Treasury-services implementation specialist',
        accountability:
          'Owns treasury-service onboarding, implementation, and the ' +
          'client experience through go-live.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Basel credit-risk capital rules and regulatory capital',
        relevance:
          'Set how commercial credit exposure translates into ' +
          'risk-weighted assets and required capital — the frame that ' +
          'makes credit capital-heavy and treasury income capital-light, ' +
          'and that drives the relationship-return economics.',
      },
      {
        name: 'CECL / IFRS 9 expected-credit-loss provisioning',
        relevance:
          'Require forward-looking expected-credit-loss provisioning on ' +
          'the loan book — making early detection of deterioration a ' +
          'direct provisioning and earnings issue.',
      },
      {
        name: 'Fair-lending and credit-decisioning rules',
        relevance:
          'Govern that credit decisions are made on permissible, ' +
          'non-discriminatory factors and are explainable — the frame any ' +
          'AI underwriting use case must satisfy.',
      },
      {
        name: 'KYC / AML and beneficial-ownership requirements',
        relevance:
          'Require customer due diligence and beneficial-ownership ' +
          'verification at onboarding — hard controls any account-opening ' +
          'or treasury-onboarding use case must respect.',
      },
      {
        name: 'Payments and operational-risk regulation',
        relevance:
          'Govern payment services, entitlements, and operational-risk ' +
          'controls in cash management — the frame for treasury ' +
          'onboarding and the integrity of payment-capability setup.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Spreading',
        definition:
          'The process of standardising a borrower’s financial ' +
          'statements into a common format for credit analysis and ' +
          'ratio comparison.',
      },
      {
        term: 'Loan covenant',
        definition:
          'A condition in a loan agreement the borrower must meet — a ' +
          'financial ratio, a reporting obligation, or a restriction — ' +
          'whose breach gives the bank contractual rights.',
      },
      {
        term: 'Criticised and classified loans',
        definition:
          'Loans risk-rated below acceptable — special mention ' +
          '(criticised) or substandard, doubtful, or loss (classified) — ' +
          'the regulatory portfolio-quality categories.',
      },
      {
        term: 'Treasury / cash management',
        definition:
          'The suite of services that helps a corporate client manage ' +
          'its cash — operating accounts, payments, collections, ' +
          'liquidity, and working-capital finance.',
      },
      {
        term: 'Operating deposits',
        definition:
          'Stable, low-cost deposit balances tied to a client’s ' +
          'operating and treasury activity, distinct from rate-sensitive ' +
          'flighty balances.',
      },
      {
        term: 'Share of wallet',
        definition:
          'The share of a client’s total banking business — credit, ' +
          'deposits, treasury, and fees — that the bank holds.',
      },
      {
        term: 'Risk-adjusted return on capital',
        definition:
          'Relationship revenue net of expected credit loss expressed ' +
          'as a return on the regulatory capital the relationship ' +
          'consumes.',
      },
      {
        term: 'Committed facility',
        definition:
          'A credit line the bank is contractually obliged to make ' +
          'available; the undrawn portion still consumes capital and ' +
          'liquidity capacity.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Commercial & Corporate Banking Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the commercial-banking function is leaking return ' +
        '— in origination and underwriting, in portfolio monitoring, in ' +
        'treasury onboarding, or in shallow relationships — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Franchise and operating context',
          guidance:
            'Name the commercial segment in scope — middle-market or ' +
            'large corporate, industry mix, loan-book size and the ' +
            'credit-to-treasury revenue split — and the operating model. ' +
            'State which loan-origination, servicing, treasury-management, ' +
            'risk-rating, and CRM systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — credit-decision cycle time, origination ' +
            'cost, underwriting rework, portfolio at risk, covenant-' +
            'detection lag, treasury-onboarding time, treasury fee income ' +
            'per client, operating-deposit ratio, facility utilisation, ' +
            'relationship yield, cross-sell ratio, RM portfolio size. For ' +
            'any metric not recorded, name it as a precise seed gap with ' +
            'its data source.',
        },
        {
          heading: 'Credit, portfolio, and relationship analysis',
          guidance:
            'Break down where return is leaking — separate origination ' +
            'drag from portfolio deterioration, quantify the share of ' +
            'credit-only relationships and the treasury whitespace, and ' +
            'locate which segments and RMs carry the weakest ' +
            'risk-adjusted return.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — slow manual underwriting, ' +
            'late portfolio deterioration, covenant-tracking gap, ' +
            'treasury-onboarding friction, shallow relationships, no ' +
            'whitespace visibility, fragmented client data, undrawn-' +
            'capital drag — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — origination efficiency, credit-loss ' +
            'avoidance, treasury acceleration, relationship deepening — ' +
            'explicitly haircut by the credit cycle, data fragmentation, ' +
            'and RM adoption. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric is a ' +
            'named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Commercial & Corporate Banking Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a ' +
        'commercial-banking AI Move on this franchise — baseline, ' +
        'forecast, cost, and the honest, cycle-aware downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'origination efficiency, credit-loss avoidance, treasury ' +
            'acceleration, and relationship-return uplift, the ' +
            'time-to-value band, and the go / hold recommendation in one ' +
            'read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — origination cost, cycle time, portfolio at risk, ' +
            'treasury-onboarding time, relationship yield. Where a ' +
            'baseline is a seed gap, say so and state what closing it ' +
            'requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — the credit cycle, ' +
            'data fragmentation, RM adoption and client pace, ' +
            'credit-policy governance — explicitly and show the haircut ' +
            'math. Keep cyclical credit-loss value separate from the ' +
            'durable relationship-deepening lever.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the loan-origination, ' +
            'servicing, treasury-management, risk-rating, and CRM ' +
            'systems, and the operating-model change — underwriting and ' +
            'RM workflow change and capacity redeployment.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a benign credit environment ' +
            'where there is little loss to avoid, weaker data quality, ' +
            'and slow RM adoption. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Credit-policy and conduct posture',
          guidance:
            'For any underwriting component, state the credit-policy, ' +
            'fair-lending, and model-risk controls; for any onboarding ' +
            'component, the KYC and AML controls — and name the ' +
            'regulatory frames (Basel capital, CECL/IFRS 9, fair lending, ' +
            'KYC/AML) that bound the design.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged credit-loss and relationship-return metrics that ' +
            'realise over the credit cycle.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Commercial & Corporate Banking Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'commercial-banking AI capability, grounded in the function ' +
        'reference patterns and the credit-policy and conduct frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — augmented underwriting layer, continuous ' +
            'portfolio-monitoring layer, orchestrated treasury-onboarding ' +
            'layer, unified relationship-intelligence layer, RM ' +
            'productivity copilot — and state which apply and how they ' +
            'connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the loan-origination, servicing, treasury-' +
            'management, risk-rating, and CRM integrations, the unified ' +
            'commercial-client view, the financial-statement and ' +
            'covenant-document ingestion, and the data freshness the use ' +
            'cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. State where a credit officer owns the ' +
            'decision and where a KYC control must not be bypassed.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how underwriting, portfolio-monitoring, treasury-' +
            'implementation, and relationship-management workflows change, ' +
            'how capacity is redeployed, and who owns each change.',
        },
        {
          heading: 'Credit-policy and responsible-AI controls',
          guidance:
            'State the credit-policy, fair-lending, and model-risk ' +
            'controls for underwriting, the KYC and AML controls for ' +
            'onboarding, the explainability discipline, and the ' +
            'regulatory frames (Basel capital, CECL/IFRS 9, fair lending, ' +
            'KYC/AML, payments regulation) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'commercial-banking stack, and the phased rollout by segment ' +
            'and use case.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Commercial & Corporate Banking Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the commercial-banking AI ' +
        'capability so value reaches risk-adjusted relationship return, ' +
        'not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot segment or use case, underwriter and RM onboarding, ' +
            'scale across the franchise — with milestones tied to the ' +
            'operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, client-data unification, credit-policy and ' +
            'model validation, underwriter and RM adoption, KYC and ' +
            'conduct sign-off, Tower measurement.',
        },
        {
          heading: 'Underwriter and RM adoption approach',
          guidance:
            'Define the change runway for underwriters, portfolio ' +
            'managers, treasury-implementation, and relationship-' +
            'management staff — training, workflow change, and the ' +
            'redeployment of the capacity the automation frees — and how ' +
            'adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged credit-loss and ' +
            'relationship-return metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — credit-cycle shift, data-' +
            'fragmentation fragility, credit-policy and fair-lending ' +
            'exposure, slow RM adoption — with the escalation owner and ' +
            'the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Origination cost and credit-decision cycle time',
      authoritativeSource:
        'The commercial loan-origination system reconciled against ' +
        'commercial-banking cost accounting.',
      whatGoodEvidenceLooksLike:
        'Cost to originate and cycle time measured per booked loan, ' +
        'segmented by deal size and complexity, with the manual-touch ' +
        'and rework load identified.',
      weakEvidenceToReject:
        'A blended cycle time with no segmentation, or an origination ' +
        'cost figure that omits relationship and underwriting effort.',
    },
    {
      claim: 'Portfolio quality and the trend in deterioration',
      authoritativeSource:
        'The credit risk-rating and portfolio-monitoring system ' +
        'reconciled against the commercial loan ledger.',
      whatGoodEvidenceLooksLike:
        'Criticised-and-classified balances with migration trend and ' +
        'covenant-breach history, broken down by industry and ' +
        'risk-rating band.',
      weakEvidenceToReject:
        'A point-in-time classified figure with no migration trend, or a ' +
        'portfolio view that cannot show covenant-breach history.',
    },
    {
      claim: 'Treasury fee income and the depth of the relationship',
      authoritativeSource:
        'The treasury-services billing system reconciled against the ' +
        'commercial relationship master.',
      whatGoodEvidenceLooksLike:
        'Treasury fee income and operating-deposit balances per ' +
        'relationship, with product holdings and onboarding-pipeline ' +
        'status.',
      weakEvidenceToReject:
        'Aggregate treasury revenue with no per-relationship view, or a ' +
        'product count that cannot distinguish active from dormant ' +
        'services.',
    },
    {
      claim: 'Risk-adjusted relationship return',
      authoritativeSource:
        'Relationship-profitability reporting combining loan, treasury, ' +
        'and capital-attribution data.',
      whatGoodEvidenceLooksLike:
        'Relationship revenue net of expected credit loss expressed as a ' +
        'return on attributed regulatory capital, with the credit and ' +
        'treasury components separated.',
      weakEvidenceToReject:
        'A gross-revenue or loan-balance figure presented as ' +
        'relationship value, with no capital attribution or credit-loss ' +
        'adjustment.',
    },
    {
      claim: 'The forecast value of a commercial-banking AI Move',
      authoritativeSource:
        'The value model — origination efficiency, credit-loss ' +
        'avoidance, treasury acceleration, and relationship deepening, ' +
        'each haircut by its dominant factors — read against the credit ' +
        'cycle.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, cyclical credit-loss value kept ' +
        'separate from the durable relationship lever, and every figure ' +
        'a labelled planning range.',
      weakEvidenceToReject:
        'A single-point number annualised off a benign credit year, a ' +
        'vendor ROI claim taken at face value, or a forecast that ' +
        'ignores the credit-cycle haircut.',
    },
  ],
};
