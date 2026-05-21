// Domain Function Pack — Financial services · Payments & money movement.
//
// Function key: `payments_money_movement`.
//
// This pack covers the payments and money-movement function: the business
// that moves value between parties and earns its keep on the spread between
// what it charges and what it costs to move a dollar safely. It spans card
// issuing and acquiring (authorisation, interchange, network economics),
// account-to-account rails (ACH, wire, real-time payments such as RTP and
// FedNow), peer-to-peer and disbursements, and the payment operations
// underneath them — exceptions, returns, chargebacks and disputes,
// reconciliation, and settlement.
//
// The operating reality the pack encodes: payments value does not leak in one
// place — it leaks at every step. A declined authorisation that should have
// been approved is a lost sale and a lost fee; interchange and network fees
// shaved or surcharged change the unit economics; a fraud loss, a chargeback,
// or a manual exception each carries cost the spread has to absorb. The AI
// archetypes are the recurring bets against exactly that reality — smarter
// authorisation decisioning, real-time fraud and scam scoring, dispute and
// chargeback automation, payment-operations exception handling, interchange
// and routing optimisation, and an agentic payment-operations copilot.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const paymentsMoneyMovementPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'payments_money_movement',
  functionLabel: 'Payments & money movement',
  summary:
    'Payments and money movement is the function that moves value between ' +
    'parties — across card rails (issuing and acquiring), account-to-' +
    'account rails (ACH, wire, real-time payments), peer-to-peer, and ' +
    'disbursements — and earns its margin on the spread between what it ' +
    'charges and what it costs to move a dollar safely and on time. Its ' +
    'economics are the interchange and fee yield captured, the fraud and ' +
    'loss bps absorbed, the cost per transaction, and the float and ' +
    'settlement timing in between. A payments business wins by approving ' +
    'the good transactions a blunt rule set would decline, declining the ' +
    'fraud a permissive one would let through, and clearing every payment ' +
    'with the fewest manual exceptions — so the function is judged on net ' +
    'economics across the whole flow, not on any single authorisation, fee, ' +
    'or loss line.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'authorization_approval_rate',
      name: 'Authorisation approval rate',
      definition:
        'The share of card authorisation attempts approved rather than ' +
        'declined — by the issuer, by the network, or by the acquiring-side ' +
        'risk controls — measured on legitimate, well-formed transactions.',
      unit: '% of authorisation attempts approved',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 84,
        high: 98,
        basis:
          'Approval rates vary with portfolio risk, channel mix (card-' +
          'present vs. card-not-present), and how blunt the decline rules ' +
          'are; the band spans an over-declining operation to a finely ' +
          'tuned one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Authorisation logs from the card-processing / authorisation ' +
        'switch reconciled against network response codes.',
      whyItMatters:
        'Every false decline is a lost sale, a lost interchange or ' +
        'merchant fee, and an eroded customer relationship; the approval ' +
        'rate is the leading read on how much good volume blunt risk rules ' +
        'are turning away.',
    },
    {
      key: 'false_decline_rate',
      name: 'False-decline rate',
      definition:
        'The share of legitimate transactions declined as suspected fraud ' +
        'or risk that, on review, were genuine — good money turned away.',
      unit: '% of legitimate transactions wrongly declined',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 8,
        basis:
          'False-decline rates depend on how aggressively the fraud and ' +
          'risk models are tuned; card-not-present and cross-border volume ' +
          'sit at the higher end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Declined-transaction analysis reconciled against subsequent ' +
        'customer disputes, re-attempts, and confirmed-good outcomes.',
      whyItMatters:
        'False declines are the hidden cost of fraud control — they cost ' +
        'far more in lost revenue and customer trust than the fraud they ' +
        'prevent, and they are invisible unless deliberately measured.',
    },
    {
      key: 'fraud_loss_bps',
      name: 'Fraud-loss rate',
      definition:
        'Gross fraud losses — unauthorised transactions, account takeover, ' +
        'scams, and first-party fraud — as basis points of total payment ' +
        'volume, net of recoveries.',
      unit: 'basis points of payment volume',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Fraud-loss bps vary sharply by product (card vs. account-to-' +
          'account), channel, and customer mix; faster rails and scams ' +
          'push the upper end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-loss ledger reconciled against payment volume and ' +
        'recovery data.',
      whyItMatters:
        'Fraud loss is a direct charge against the payments spread; it ' +
        'must be read alongside the false-decline rate, because cutting ' +
        'one by brute force inflates the other.',
    },
    {
      key: 'interchange_yield',
      name: 'Interchange / net fee yield',
      definition:
        'Net interchange or merchant-fee revenue captured per dollar of ' +
        'payment volume, after network assessments, rewards funding, and ' +
        'any fee concessions — the realised take rate.',
      unit: 'basis points of payment volume',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 220,
        basis:
          'Net yield spans a thin debit / regulated-interchange portfolio ' +
          'to a rich credit / rewards portfolio; product mix and ' +
          'regulatory regime set the point. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Network settlement and interchange-qualification reporting ' +
        'reconciled against the general ledger.',
      whyItMatters:
        'It is the top line of the payments economic engine; small shifts ' +
        'in interchange qualification, routing, and mix move the yield ' +
        'across millions of transactions.',
    },
    {
      key: 'cost_per_transaction',
      name: 'Cost per transaction',
      definition:
        'The fully-loaded operating cost of moving one payment — ' +
        'processing, network, fraud-operations, exception-handling, and ' +
        'settlement cost — averaged across the transaction base.',
      unit: 'USD per transaction',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.05,
        high: 1.5,
        basis:
          'Cost per transaction spans a highly automated card-rail ' +
          'operation to a manual, exception-heavy wire or correspondent ' +
          'flow. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Payment-operations cost accounting reconciled against ' +
        'transaction counts by rail.',
      whyItMatters:
        'It is the efficiency ratio of money movement; manual exceptions, ' +
        'returns, and disputes are what drive it up, so it is the metric ' +
        'operations automation directly attacks.',
    },
    {
      key: 'straight_through_processing_rate',
      name: 'Straight-through processing rate',
      definition:
        'The share of payments that clear and settle end-to-end without ' +
        'any manual intervention — no repair, no exception queue, no ' +
        'investigation touch.',
      unit: '% of payments processed straight through',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 88,
        high: 99.5,
        basis:
          'STP rates depend on data quality, rail (card is high, wire and ' +
          'correspondent lower), and validation maturity. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Payment-processing logs reconciled against exception and repair-' +
        'queue volumes.',
      whyItMatters:
        'Every payment that drops to a manual queue is cost, delay, and a ' +
        'settlement-timing risk; STP rate is the single best summary of ' +
        'payment-operations efficiency.',
    },
    {
      key: 'payment_return_rate',
      name: 'Payment return / reject rate',
      definition:
        'The share of account-to-account payments (ACH and similar) ' +
        'returned or rejected — for insufficient funds, a closed or wrong ' +
        'account, unauthorised debit, or a data error — rather than ' +
        'settling cleanly.',
      unit: '% of originated payments returned',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.3,
        high: 4,
        basis:
          'Return rates depend on origination quality, account-validation ' +
          'discipline, and customer mix; unauthorised-return rates carry ' +
          'their own network thresholds. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'ACH / account-to-account return reporting classified by return ' +
        'reason code.',
      whyItMatters:
        'Returns are rework, settlement risk, and — for unauthorised ' +
        'returns — a network-rule compliance exposure that can cap an ' +
        'originator’s ability to send at all.',
    },
    {
      key: 'dispute_chargeback_rate',
      name: 'Dispute / chargeback rate',
      definition:
        'The share of card transactions that become a cardholder dispute ' +
        'or chargeback — by count or by value — across fraud, ' +
        'authorisation, processing, and consumer-dispute reasons.',
      unit: 'basis points of transactions disputed',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 90,
        basis:
          'Dispute rates vary by merchant and portfolio mix; card-not-' +
          'present, travel, and digital-goods volume sit high, and network ' +
          'monitoring thresholds bound the top. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The dispute / chargeback management system classified by reason ' +
        'code and network.',
      whyItMatters:
        'Disputes are loss, operating cost, and — past network monitoring ' +
        'thresholds — fines and programme risk; the dispute rate is a ' +
        'leading indicator of both fraud and service breakdowns.',
    },
    {
      key: 'dispute_win_rate',
      name: 'Dispute win / recovery rate',
      definition:
        'The share of disputed transactions resolved in the institution’s ' +
        'or merchant’s favour through representment and evidence — the ' +
        'success rate of the dispute-defence operation.',
      unit: '% of contested disputes won',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 15,
        high: 55,
        basis:
          'Win rates depend on which disputes are contested and the ' +
          'quality and timeliness of the evidence package; the band spans ' +
          'a scattershot operation to a targeted one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The dispute-management system tracking representment outcomes ' +
        'against network response data.',
      whyItMatters:
        'A high win rate proves dispute effort is targeted at recoverable ' +
        'cases with strong evidence; a low rate signals effort spent ' +
        'contesting disputes that were never winnable.',
    },
    {
      key: 'authorization_decision_latency',
      name: 'Authorisation decision latency',
      definition:
        'The elapsed time from receiving an authorisation request to ' +
        'returning an approve / decline decision, including the fraud and ' +
        'risk scoring in the path.',
      unit: 'milliseconds per authorisation',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 40,
        high: 400,
        basis:
          'Decision latency depends on the scoring stack and network ' +
          'timeout windows; real-time rails and card networks both impose ' +
          'hard ceilings. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Authorisation-switch and fraud-scoring telemetry timestamped ' +
        'request to response.',
      whyItMatters:
        'A decision that misses the network timeout window is a forced ' +
        'decline regardless of its quality; latency is a hard constraint ' +
        'on how much intelligence can sit in the authorisation path.',
    },
    {
      key: 'settlement_timeliness',
      name: 'Settlement timeliness',
      definition:
        'The share of payments that settle to the beneficiary within the ' +
        'committed or expected window for the rail — same-day, next-day, ' +
        'or real-time as applicable.',
      unit: '% of payments settled within the committed window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 92,
        high: 99.9,
        basis:
          'Settlement timeliness depends on cut-off discipline, exception ' +
          'volume, and correspondent-bank dependencies; cross-border flows ' +
          'sit lower. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Settlement and clearing reporting reconciled against rail cut-' +
        'off times and beneficiary credit confirmations.',
      whyItMatters:
        'Late settlement is a service failure, a liquidity and float cost, ' +
        'and — for real-time rails that promise irrevocable instant ' +
        'credit — a broken core promise of the product.',
    },
    {
      key: 'first_contact_payment_resolution',
      name: 'Payment-exception first-pass resolution',
      definition:
        'The share of payment exceptions and investigations — returns, ' +
        'repairs, traces, recalls, mis-postings — resolved on the first ' +
        'pass without re-work, re-routing, or re-opening.',
      unit: '% of exceptions resolved first pass',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 88,
        basis:
          'First-pass resolution depends on case-data completeness and ' +
          'investigator tooling; complex cross-border traces sit at the ' +
          'low end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The payment-operations case-management system tracking case ' +
        'lifecycle and re-open events.',
      whyItMatters:
        'Re-worked exceptions multiply cost per transaction and delay ' +
        'settlement; first-pass resolution is the read on how well the ' +
        'operations function actually closes the cases it opens.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'blunt_authorization_rules',
      name: 'Blunt authorisation and decline rules',
      description:
        'Authorisation decisioning runs on coarse, static rules — hard ' +
        'declines on geographies, amounts, or merchant categories — that ' +
        'turn away good customers to suppress fraud. The lost interchange ' +
        'and lost sales are invisible because a declined transaction ' +
        'leaves no trace, while the prevented fraud is celebrated.',
      detectionSignal:
        'The approval rate is low for the portfolio risk, the false-' +
        'decline rate is unmeasured or high, and decline rules are static ' +
        'and rarely revisited.',
      diagnosticQuestion:
        'How is the false-decline rate measured, and what good volume are ' +
        'the current authorisation and decline rules turning away?',
    },
    {
      key: 'fraud_loss_decline_tradeoff',
      name: 'Mismanaged fraud-loss vs. false-decline trade-off',
      description:
        'Fraud and approval are governed by separate teams against ' +
        'separate targets — fraud chases a loss number, the business ' +
        'chases approvals — so the controls swing between over-declining ' +
        'and over-permitting instead of being optimised as one ' +
        'economic trade-off.',
      detectionSignal:
        'Fraud loss and false declines are reported separately with no ' +
        'shared economic view; tightening one visibly worsens the other ' +
        'with no net-economics read.',
      diagnosticQuestion:
        'Is the fraud-loss and false-decline trade-off optimised as one ' +
        'net-economic decision, or are the two managed against separate ' +
        'targets by separate teams?',
    },
    {
      key: 'scam_authorized_push_payment',
      name: 'Authorised-push-payment scam exposure',
      description:
        'On real-time and account-to-account rails, the customer ' +
        'themselves authorises the payment, so traditional unauthorised-' +
        'transaction fraud controls do not fire. Scam losses — the ' +
        'customer tricked into sending — rise as faster rails make funds ' +
        'irrevocable within seconds.',
      detectionSignal:
        'Scam and authorised-push-payment losses are a rising share of ' +
        'fraud loss; real-time rail volume grows faster than the scam-' +
        'detection capability.',
      diagnosticQuestion:
        'How is authorised-push-payment scam risk detected and warned ' +
        'against before an irrevocable real-time payment leaves the ' +
        'account?',
    },
    {
      key: 'manual_exception_drag',
      name: 'Manual payment-exception drag',
      description:
        'Returns, repairs, traces, recalls, and mis-postings drop out of ' +
        'straight-through processing into manual queues where ' +
        'investigators key, research, and re-route by hand — slow, ' +
        'expensive, and a settlement-timing risk that scales with volume.',
      detectionSignal:
        'The straight-through-processing rate is below target, exception ' +
        'queues age, and payment-operations headcount scales linearly ' +
        'with volume.',
      diagnosticQuestion:
        'What share of payments drop to a manual exception queue, and how ' +
        'much investigator effort do returns, repairs, and traces consume?',
    },
    {
      key: 'scattershot_dispute_handling',
      name: 'Scattershot dispute and chargeback handling',
      description:
        'Disputes are worked first-in-first-out with no triage by ' +
        'winnability or value. Strong cases are conceded for want of ' +
        'evidence assembled in time, weak cases are contested and lost, ' +
        'and network response deadlines are missed.',
      detectionSignal:
        'The dispute win rate is low, representment effort does not ' +
        'correlate with case strength or value, and network response ' +
        'deadlines are missed.',
      diagnosticQuestion:
        'Are disputes triaged by winnability and value before they are ' +
        'worked, and is the evidence package assembled before the network ' +
        'deadline?',
    },
    {
      key: 'interchange_routing_leakage',
      name: 'Interchange-qualification and routing leakage',
      description:
        'Transactions downgrade to worse interchange tiers for missing ' +
        'data or late settlement, and debit routing decisions are made on ' +
        'habit rather than on the least-cost network — small per-' +
        'transaction leaks that compound into a material yield loss.',
      detectionSignal:
        'A material share of volume settles at downgraded interchange ' +
        'tiers; debit routing is not optimised to least-cost network and ' +
        'net yield underperforms the portfolio mix.',
      diagnosticQuestion:
        'What share of volume downgrades to a worse interchange tier, and ' +
        'is debit routing optimised to the least-cost network per ' +
        'transaction?',
    },
    {
      key: 'reconciliation_settlement_break',
      name: 'Reconciliation and settlement breaks',
      description:
        'Position, network settlement, and ledger data disagree, so ' +
        'breaks accumulate and are cleared by hand at period close. The ' +
        'institution cannot trust its real-time payment position and ' +
        'carries liquidity buffers to cover the uncertainty.',
      detectionSignal:
        'Reconciliation breaks are material and cleared manually; the ' +
        'institution cannot state an intraday net settlement position ' +
        'with confidence.',
      diagnosticQuestion:
        'How many reconciliation breaks arise per cycle, and can the ' +
        'institution state its intraday settlement position in real time?',
    },
    {
      key: 'rail_fragmentation',
      name: 'Rail and platform fragmentation',
      description:
        'Card, ACH, wire, real-time, and peer-to-peer each run on a ' +
        'separate platform, risk model, and operations team. No one sees ' +
        'the customer’s money movement as a whole, controls are ' +
        'inconsistent across rails, and adding a new rail means rebuilding ' +
        'the stack again.',
      detectionSignal:
        'Each rail has its own platform, fraud model, and operations ' +
        'team; there is no unified payment record and controls differ ' +
        'rail to rail.',
      diagnosticQuestion:
        'Is there a unified view of money movement and consistent ' +
        'controls across card, ACH, wire, and real-time rails, or is each ' +
        'rail a silo?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'intelligent_authorization_decisioning',
      name: 'Intelligent authorisation decisioning',
      valueMechanism:
        'A model scores each authorisation request on genuine fraud and ' +
        'credit risk in real time and recommends approve / decline / step-' +
        'up, replacing blunt static rules. Value comes from approving the ' +
        'good transactions a coarse rule set declines — recovering lost ' +
        'interchange and sales — while still declining genuine fraud, ' +
        'lifting the approval rate and cutting false declines together.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Real-time authorisation request and device / channel context',
        'Historical authorisation, fraud, and chargeback outcomes',
        'Cardholder behaviour and transaction-history features',
        'Network response-code and decline-reason data',
      ],
      controlPosture: 'autonomous-with-audit',
      controlRiskNotes: [
        'The model decides within a network timeout window, so it acts ' +
          'autonomously — but every decision is logged and the model is ' +
          'monitored against approval, false-decline, and fraud outcomes.',
        'Decline reasons must be explainable and the model tested for ' +
          'disparate impact across protected classes — a decline is an ' +
          'adverse action with fair-lending and Reg-B exposure.',
        'Fraud patterns drift fast; the model must be continuously ' +
          'revalidated or it decays into the blunt rules it replaced.',
      ],
      metricsMoved: [
        'authorization_approval_rate',
        'false_decline_rate',
        'fraud_loss_bps',
        'authorization_decision_latency',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'realtime_fraud_scam_scoring',
      name: 'Real-time fraud and scam scoring',
      valueMechanism:
        'A model scores transactions across rails for unauthorised fraud, ' +
        'account takeover, and — critically on real-time rails — ' +
        'authorised-push-payment scams, and triggers a warning, a step-up, ' +
        'or a hold before an irrevocable payment leaves the account. Value ' +
        'comes from cutting fraud-loss bps without the false-decline cost ' +
        'a blunt block imposes.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Real-time transaction, device, and session signals',
        'Beneficiary and counterparty risk and history data',
        'Behavioural-biometric and account-takeover signals',
        'Confirmed fraud and scam outcome labels for training',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model scores and triggers warnings or holds; a fraud analyst ' +
          'reviews high-impact holds and owns any customer-facing scam ' +
          'intervention.',
        'A scam warning must inform without unduly blocking a legitimate ' +
          'payment the customer genuinely intends — over-warning erodes ' +
          'trust and the customer learns to dismiss it.',
        'Liability allocation for scam losses (customer vs. institution) ' +
          'is a live regulatory question; the control posture must match ' +
          'the prevailing rule, not get ahead of it.',
      ],
      metricsMoved: [
        'fraud_loss_bps',
        'false_decline_rate',
        'payment_return_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'dispute_chargeback_automation',
      name: 'Dispute and chargeback automation',
      valueMechanism:
        'An agent triages each dispute by reason, winnability, and value, ' +
        'assembles the representment evidence package from transaction, ' +
        'fulfilment, and communication records, and files within the ' +
        'network deadline. Value comes from concentrating defence effort ' +
        'on winnable, high-value cases — lifting the dispute win rate — ' +
        'and from cutting the manual cost per dispute.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Dispute and chargeback records with network reason codes',
        'Transaction, authorisation, and fulfilment / delivery evidence',
        'Historical representment outcomes by reason code',
        'Network dispute-rule and response-deadline data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent triages and drafts the evidence package; a dispute ' +
          'specialist reviews and owns representment and the cardholder ' +
          'relationship.',
        'Evidence must be drawn from the genuine record — the agent does ' +
          'not embellish or infer a delivery or authorisation that cannot ' +
          'be substantiated.',
        'Network dispute rules change by release cycle; the rule base and ' +
          'deadline logic must be kept current or filings fail on a ' +
          'technicality.',
      ],
      metricsMoved: [
        'dispute_win_rate',
        'dispute_chargeback_rate',
        'cost_per_transaction',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'payment_exception_automation',
      name: 'Payment-operations exception automation',
      valueMechanism:
        'An agent reads payment exceptions — returns, repairs, traces, ' +
        'recalls, mis-postings — interprets the failure, repairs the data ' +
        'or initiates the correct downstream action, and routes only the ' +
        'genuinely ambiguous cases to an investigator. Value comes from ' +
        'lifting straight-through processing and first-pass resolution and ' +
        'cutting the manual cost per transaction.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Exception and return data with rail-specific reason codes',
        'Payment, beneficiary, and account reference data for repair',
        'Historical exception resolutions for pattern learning',
        'Case-management and downstream-action workflow access',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent repairs and resolves routine exceptions; an ' +
          'investigator works ambiguous cases and owns any action that ' +
          'moves customer funds.',
        'A wrong repair can mis-route a payment or credit the wrong ' +
          'party — repair confidence must be measured and low-confidence ' +
          'cases must escalate.',
        'Anything touching a sanctioned party or a suspicious pattern must ' +
          'route to compliance, never be auto-resolved.',
      ],
      metricsMoved: [
        'straight_through_processing_rate',
        'first_contact_payment_resolution',
        'cost_per_transaction',
        'settlement_timeliness',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'interchange_routing_optimization',
      name: 'Interchange and payment-routing optimisation',
      valueMechanism:
        'A model ensures each transaction carries the data to qualify for ' +
        'its best interchange tier and routes account-to-account and ' +
        'debit volume to the least-cost, best-fit rail and network. Value ' +
        'comes from lifting net interchange yield and cutting cost per ' +
        'transaction through better qualification and routing rather than ' +
        'price renegotiation.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Transaction data and interchange-qualification rule sets',
        'Network and rail fee schedules and routing eligibility',
        'Historical downgrade and routing-cost data',
        'Settlement-timing and data-completeness signals',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends qualification fixes and routing; a payments ' +
          'product owner approves routing policy and owns network ' +
          'relationships.',
        'Routing must respect network rules, merchant agreements, and ' +
          'least-cost-routing regulation — a non-compliant route is a rule ' +
          'breach, not a saving.',
        'Fee schedules and qualification rules change on network release ' +
          'cycles; stale rules silently erode the modelled yield.',
      ],
      metricsMoved: [
        'interchange_yield',
        'cost_per_transaction',
        'straight_through_processing_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'payment_operations_copilot',
      name: 'Payment-operations investigator copilot',
      valueMechanism:
        'An assistant gives payment-operations investigators a copilot ' +
        'that gathers case context across rails and systems, drafts ' +
        'traces, recalls, and customer communications, and surfaces the ' +
        'network rule that applies. Value comes from cutting investigation ' +
        'handle time and lifting first-pass resolution while keeping the ' +
        'investigator the decision-maker.',
      adoptionProfile: 'early',
      dataDependencies: [
        'Cross-rail payment, exception, and case-history data',
        'Network operating rules and trace / recall procedures',
        'Customer and counterparty reference data',
        'Prior-case resolutions and communication templates',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot drafts and assembles; the investigator reviews every ' +
          'output and owns the decision and the customer communication.',
        'Drafted traces and communications must be grounded in the case ' +
          'record — the copilot does not assert a payment fact it cannot ' +
          'substantiate.',
        'Access to customer payment data through the copilot must be ' +
          'permissioned and logged to the same standard as the systems of ' +
          'record.',
      ],
      metricsMoved: [
        'first_contact_payment_resolution',
        'cost_per_transaction',
        'settlement_timeliness',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_authorization_decision_layer',
      name: 'Unified authorisation-decision layer',
      description:
        'A pattern that brings fraud risk, credit risk, and approval ' +
        'optimisation into a single real-time decision on each ' +
        'authorisation, so the fraud-loss and false-decline trade-off is ' +
        'made as one net-economic decision inside the network timeout ' +
        'window rather than by separate teams against separate targets.',
      boundary:
        'It decides approve / decline / step-up within the timeout window ' +
        'and logs every decision; a risk owner sets the economic policy ' +
        'and thresholds. It does not change network rules or set credit ' +
        'lines.',
      humanAccountabilityPoint:
        'The head of payments risk accountable for the net economics of ' +
        'the approval, fraud-loss, and false-decline trade-off.',
      controlPosture: 'autonomous-with-audit',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'cross_rail_fraud_scam_layer',
      name: 'Cross-rail fraud and scam-detection layer',
      description:
        'A pattern that scores fraud and scam risk consistently across ' +
        'card, ACH, wire, and real-time rails from a shared signal and ' +
        'model layer — so a customer’s money movement is risk-assessed as ' +
        'a whole and a warning or hold can fire before an irrevocable ' +
        'real-time payment settles.',
      boundary:
        'It scores risk and triggers warnings, step-ups, and holds; a ' +
        'fraud analyst works high-impact cases and owns scam ' +
        'intervention. It does not adjudicate customer liability.',
      humanAccountabilityPoint:
        'The financial-crime / fraud lead accountable for fraud-loss bps ' +
        'across all rails and the scam-warning policy.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'exception_automation_and_routing',
      name: 'Payment-exception automation-and-routing pattern',
      description:
        'A pattern that intercepts payment exceptions — returns, repairs, ' +
        'traces, recalls, mis-postings — interprets the failure, auto-' +
        'repairs and resolves the routine cases, and routes only ' +
        'genuinely ambiguous cases into an investigator queue, lifting ' +
        'straight-through processing across rails.',
      boundary:
        'It repairs and resolves routine exceptions and routes the rest; ' +
        'an investigator works ambiguous cases and owns any fund-moving ' +
        'action. It does not auto-resolve a sanctions or suspicious-' +
        'activity case.',
      humanAccountabilityPoint:
        'The payment-operations manager accountable for the straight-' +
        'through-processing rate and exception throughput.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'dispute_triage_and_representment',
      name: 'Dispute triage-and-representment pattern',
      description:
        'A pattern that classifies each dispute by reason, winnability, ' +
        'and value, assembles the representment evidence package from the ' +
        'transaction and fulfilment record, and tracks every case to its ' +
        'network deadline — concentrating defence effort where it ' +
        'actually recovers value.',
      boundary:
        'It triages and drafts the evidence package; a dispute specialist ' +
        'reviews and owns the representment filing and the cardholder ' +
        'relationship. It does not file a dispute response autonomously.',
      humanAccountabilityPoint:
        'The disputes-operations lead accountable for the dispute win ' +
        'rate and the chargeback monitoring position.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'real_time_reconciliation_layer',
      name: 'Real-time reconciliation-and-settlement layer',
      description:
        'A pattern that reconciles position, network settlement, and ' +
        'ledger data continuously rather than at period close, auto-' +
        'matches the routine and surfaces only genuine breaks — so the ' +
        'institution can state an intraday net settlement position it ' +
        'trusts and size its liquidity buffers to reality.',
      boundary:
        'It matches, reconciles, and surfaces breaks; a settlement ' +
        'controller investigates and clears genuine breaks and owns the ' +
        'position sign-off. It does not move funds to clear a break.',
      humanAccountabilityPoint:
        'The settlement and reconciliation controller accountable for the ' +
        'integrity of the settlement position.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Payments value is realised in four distinct ways and a forecast ' +
      'must keep them separate. First, recovered revenue: approving good ' +
      'transactions a blunt rule set declined recovers interchange and ' +
      'sales — this lands in the approval rate and the interchange yield ' +
      'and is recurring. Second, avoided loss: better fraud and scam ' +
      'scoring and stronger dispute defence cut fraud-loss bps and ' +
      'chargeback loss — recurring, but bounded by how much loss is ' +
      'genuinely addressable. Third, lower cost to operate: exception, ' +
      'dispute, and investigation automation removes manual touches and ' +
      'lowers cost per transaction — recurring. Fourth, captured yield: ' +
      'better interchange qualification and least-cost routing lift net ' +
      'yield without renegotiating a single price. The dominant ' +
      'constraint is that a payments business operates inside rules it ' +
      'does not set — network operating rules, interchange regulation, ' +
      'real-time-rail scheme rules, and Reg E and Reg Z — so a forecast ' +
      'must be read against the specific rail and regulatory regime, not ' +
      'a generic one. The fraud-loss and false-decline gains are coupled: ' +
      'they must be modelled as one net-economic trade-off, never summed ' +
      'independently.',
    dominantHaircutFactors: [
      {
        factor: 'Network rules and payments regulation',
        rationale:
          'Interchange regulation, network operating rules, real-time-' +
          'rail scheme rules, and consumer-protection regulation cap how ' +
          'far routing, qualification, and decisioning can be optimised. ' +
          'The payments business does not set these rules, so they bound ' +
          'how much of a modelled yield or approval gain is reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from network rules and payments regulation ' +
            'outside the institution’s control; a planning range driven ' +
            'by the rail and regulatory regime.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Fraud-adversary adaptation and scam-loss ceiling',
        rationale:
          'Fraud is an adaptive adversary — a scoring gain decays as ' +
          'fraud patterns shift, and authorised-push-payment scam loss is ' +
          'only partly addressable by detection because the customer ' +
          'authorised the payment. The adversary and the scam ceiling ' +
          'haircut the modelled loss-avoidance gain.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Forecast erosion from fraud-pattern drift and the limited ' +
            'addressability of authorised-push-payment scam loss; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and cross-rail integration readiness',
        rationale:
          'Decisioning, exception automation, and reconciliation only ' +
          'work to the extent transaction, beneficiary, and settlement ' +
          'data are complete and consistent across rails. Fragmented ' +
          'platforms and poor data cap how much of the modelled ' +
          'automation and yield value can be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.35,
          basis:
            'Forecast erosion from incomplete data and fragmented cross-' +
            'rail integration; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Operating-model integration and adoption',
        rationale:
          'The cost-per-transaction gain only lands if automation is ' +
          'embedded in the operations workflow and investigators are ' +
          'redeployed rather than running the tool alongside the old ' +
          'process. Partial adoption realises a fraction of the modelled ' +
          'saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial workflow integration and ' +
            'staff redeployment; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Authorisation approval-rate uplift',
        range: {
          low: 0.5,
          high: 4,
          basis:
            'Percentage-point uplift in the approval rate from ' +
            'intelligent decisioning replacing blunt rules; a planning ' +
            'range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the authorisation approval rate.',
      },
      {
        lever: 'Fraud-loss-bps reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in net fraud-loss basis points from ' +
            'better fraud and scam scoring; a planning range, coupled to ' +
            'the false-decline trade-off.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fraud-loss basis points of ' +
          'payment volume.',
      },
      {
        lever: 'Cost-per-transaction reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in cost per transaction from exception, ' +
            'dispute, and investigation automation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fully-loaded cost per ' +
          'transaction.',
      },
      {
        lever: 'Net interchange-yield uplift',
        range: {
          low: 1,
          high: 8,
          basis:
            'Basis-point uplift in net interchange / fee yield from ' +
            'better qualification and least-cost routing; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Basis-point change in net fee yield on payment volume.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable operational signal (approval ' +
      'rate, false-decline rate, straight-through-processing rate); 9–15 ' +
      'months to a settled financial result, because fraud-loss, ' +
      'dispute-win, and net-yield improvements only show fully once a ' +
      'full transaction and dispute cohort has cycled through settlement ' +
      'and chargeback run-out.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Card-processing / authorisation platform',
        role:
          'The system of record for card authorisation, clearing, and ' +
          'settlement — issuing and acquiring processing, the ' +
          'authorisation switch, and network connectivity.',
        examples: [
          'TSYS',
          'Fiserv (FirstData)',
          'FIS',
          'Marqeta / modern issuer processors',
        ],
      },
      {
        name: 'Payment hub / rails platform',
        role:
          'Originates and processes account-to-account payments — ACH, ' +
          'wire, real-time payments (RTP, FedNow), and cross-border — and ' +
          'orchestrates routing across rails.',
        examples: [
          'ACI Worldwide',
          'Volante',
          'Form3',
          'in-house payment hubs',
        ],
      },
      {
        name: 'Fraud and risk decisioning platform',
        role:
          'Scores transactions for fraud, scam, and risk in real time and ' +
          'feeds the authorisation and payment-release decision.',
        examples: [
          'Featurespace',
          'SAS fraud management',
          'Feedzai',
          'in-house real-time scoring services',
        ],
      },
      {
        name: 'Dispute / chargeback management system',
        role:
          'Manages cardholder disputes and chargebacks end-to-end — ' +
          'intake, reason coding, representment, and network response ' +
          'tracking.',
        examples: [
          'Pega dispute management',
          'Quavo',
          'network dispute portals',
          'processor dispute modules',
        ],
      },
      {
        name: 'Settlement, reconciliation, and ledger system',
        role:
          'Holds the settlement position and the payments ledger and ' +
          'reconciles network settlement, position, and general-ledger ' +
          'data — the financial record of money moved.',
        examples: [
          'Network settlement reporting',
          'reconciliation platforms',
          'the core banking / payments general ledger',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of Payments / Payments General Manager',
        accountability:
          'Owns the payments P&L — interchange and fee yield, fraud and ' +
          'loss, cost to operate — across all rails and products.',
      },
      {
        title: 'Head of payments risk',
        accountability:
          'Owns the authorisation, fraud-loss, and false-decline trade-' +
          'off and the net economics of the decisioning policy.',
      },
      {
        title: 'Payment-operations manager',
        accountability:
          'Owns clearing, settlement, exception handling, and the ' +
          'straight-through-processing rate.',
      },
      {
        title: 'Disputes-operations lead',
        accountability:
          'Owns the dispute and chargeback operation — triage, ' +
          'representment, the win rate, and network monitoring status.',
      },
      {
        title: 'Financial-crime / fraud lead',
        accountability:
          'Owns fraud and scam detection across rails and the fraud-loss ' +
          'and scam-warning posture.',
      },
      {
        title: 'Payments product owner',
        accountability:
          'Owns rail and routing strategy, network relationships, and ' +
          'interchange-qualification and routing policy.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Regulation E and the EFTA (electronic-fund-transfer rules)',
        relevance:
          'Govern consumer electronic payments — error resolution, ' +
          'unauthorised-transaction liability, and disclosure — and ' +
          'shape how disputes and fraud claims must be handled.',
      },
      {
        name: 'Card-network operating rules and PCI DSS',
        relevance:
          'Network rules set interchange, chargeback, monitoring-' +
          'threshold, and routing requirements, and PCI DSS governs card-' +
          'data handling — the rule frame card payments operate inside.',
      },
      {
        name: 'Nacha operating rules and real-time-rail scheme rules',
        relevance:
          'Govern ACH origination, return thresholds, and authorisation, ' +
          'and the RTP / FedNow scheme rules govern real-time, irrevocable ' +
          'instant payments and their finality.',
      },
      {
        name: 'The Durbin Amendment and interchange / routing regulation',
        relevance:
          'Regulates debit interchange and mandates routing choice — the ' +
          'frame any interchange-qualification or least-cost-routing ' +
          'optimisation must respect.',
      },
      {
        name: 'BSA / AML, OFAC sanctions, and Regulation Z',
        relevance:
          'Anti-money-laundering, sanctions-screening, and credit-card ' +
          'rules bound payment processing — a payment to a sanctioned ' +
          'party or a non-compliant credit decision is a violation, not ' +
          'an exception.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Interchange',
        definition:
          'The fee paid by the acquirer (merchant side) to the issuer on ' +
          'a card transaction, set by the network and a core component of ' +
          'card-payment economics.',
      },
      {
        term: 'Authorisation',
        definition:
          'The real-time approve / decline decision on whether a payment ' +
          'may proceed, made within the network timeout window before the ' +
          'transaction completes.',
      },
      {
        term: 'Chargeback',
        definition:
          'A forced reversal of a card transaction initiated through the ' +
          'network when a cardholder disputes it — distinct from a ' +
          'voluntary refund.',
      },
      {
        term: 'Representment',
        definition:
          'The process by which a merchant or acquirer contests a ' +
          'chargeback with evidence that the transaction was valid.',
      },
      {
        term: 'Authorised push payment (APP) scam',
        definition:
          'A scam in which the customer is tricked into authorising a ' +
          'payment themselves — so traditional unauthorised-transaction ' +
          'fraud controls do not fire.',
      },
      {
        term: 'Straight-through processing (STP)',
        definition:
          'A payment that clears and settles end-to-end with no manual ' +
          'intervention, repair, or exception touch.',
      },
      {
        term: 'Real-time payments (RTP / FedNow)',
        definition:
          'Account-to-account rails that settle instantly and ' +
          'irrevocably, around the clock — funds are final within ' +
          'seconds.',
      },
      {
        term: 'Least-cost routing',
        definition:
          'Routing a debit or account-to-account transaction over the ' +
          'network or rail that costs the least while meeting the ' +
          'transaction’s requirements.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Payments & Money-Movement Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the payments operation is leaking economics — in ' +
        'authorisation, fraud and loss, interchange yield, or payment ' +
        'operations — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Payments business and rail context',
          guidance:
            'Name the payments business in scope — products and rails ' +
            '(card issuing / acquiring, ACH, wire, real-time, P2P), ' +
            'volume and value, and the issuing / acquiring / originator ' +
            'role. State which card-processing, payment-hub, fraud-' +
            'decisioning, dispute, and settlement systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — approval rate, false-decline rate, fraud-' +
            'loss bps, interchange yield, cost per transaction, straight-' +
            'through processing, return rate, dispute and win rates, ' +
            'decision latency, settlement timeliness, exception first-' +
            'pass resolution. For any metric not recorded, name it as a ' +
            'precise seed gap with its data source.',
        },
        {
          heading: 'Authorisation and fraud-economics analysis',
          guidance:
            'Analyse the fraud-loss and false-decline trade-off as one ' +
            'net-economic picture, break down declines and fraud loss by ' +
            'channel and reason, and locate where good volume is turned ' +
            'away and where loss is concentrated.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — blunt authorisation rules, ' +
            'mismanaged fraud / decline trade-off, APP-scam exposure, ' +
            'manual exception drag, scattershot dispute handling, ' +
            'interchange / routing leakage, reconciliation breaks, rail ' +
            'fragmentation — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — recovered revenue, avoided loss, lower ' +
            'cost to operate, captured yield — explicitly haircut by ' +
            'network rules, fraud adaptation, data readiness, and ' +
            'adoption. Every figure a labelled planning range.',
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
      label: 'Payments & Money-Movement Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a payments AI ' +
        'Move on this business — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recovered revenue, avoided loss, lower cost to operate, and ' +
            'captured yield, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — approval rate, fraud-loss bps, cost per ' +
            'transaction, interchange yield. Where a baseline is a seed ' +
            'gap — for example no measured false-decline rate — say so ' +
            'and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — network rules and ' +
            'regulation, fraud adaptation, data readiness, adoption — ' +
            'explicitly and show the haircut math. Model the fraud-loss ' +
            'and false-decline gains as one coupled trade-off, never ' +
            'summed independently.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the card-processing, ' +
            'payment-hub, fraud-decisioning, dispute, and settlement ' +
            'systems, and the operating-model change — investigator and ' +
            'analyst redeployment from the work the automation removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under tighter network or interchange ' +
            'regulation, faster fraud adaptation, weaker data quality, and ' +
            'partial adoption. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Regulatory and compliance posture',
          guidance:
            'State the Reg E, Reg Z, network-rule, BSA / AML, and ' +
            'sanctions controls, and for any autonomous decisioning the ' +
            'fair-lending, adverse-action, and model-governance posture ' +
            'and the audit trail.',
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
            'the lagged fraud-loss, dispute-win, and net-yield metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Payments & Money-Movement Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'payments AI capability, grounded in the function reference ' +
        'patterns and the network-rule and regulatory frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — unified authorisation-decision layer, cross-rail ' +
            'fraud and scam layer, exception automation and routing, ' +
            'dispute triage and representment, real-time reconciliation ' +
            'layer — and state which apply and how they connect across ' +
            'the rails.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the card-processing, payment-hub, fraud-decisioning, ' +
            'dispute, and settlement integrations, the real-time data ' +
            'flows, the network-timeout latency budget, and the cross-' +
            'rail data the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. Define the autonomy boundary and audit ' +
            'logging for any in-path authorisation decisioning.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how authorisation-risk, fraud, dispute, and payment-' +
            'operations workflows change, how investigators and analysts ' +
            'are redeployed, and who owns each change.',
        },
        {
          heading: 'Regulatory and responsible-AI controls',
          guidance:
            'State the fair-lending and adverse-action controls for ' +
            'autonomous decisioning, the model-governance and monitoring ' +
            'discipline, the BSA / AML and sanctions controls, and the ' +
            'regulatory frames (Reg E, Reg Z, network rules, Nacha, ' +
            'Durbin) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'payments stack, and the phased rollout by rail and use case.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Payments & Money-Movement Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the payments AI capability so ' +
        'value reaches the payments P&L — yield, loss, and cost — not ' +
        'just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot rail or transaction segment, operations onboarding, ' +
            'scale across rails — with milestones tied to the operating ' +
            'metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, network-rule and fee-schedule maintenance, ' +
            'model governance, fraud and dispute operations adoption, ' +
            'investigator redeployment, Tower measurement.',
        },
        {
          heading: 'Operations adoption and redeployment approach',
          guidance:
            'Define the change runway for fraud analysts, dispute ' +
            'specialists, and payment-operations investigators — ' +
            'training, workflow change, and the redeployment of the ' +
            'capacity the automation frees — and how adoption is ' +
            'measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged fraud-loss and dispute-win ' +
            'settlement metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — network-rule and regulation change, ' +
            'fraud-model drift, false-decline escalation, integration ' +
            'fragility, partial adoption — with the escalation owner and ' +
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
      claim: 'The false-decline rate — good volume turned away by risk rules',
      authoritativeSource:
        'Declined-transaction analysis reconciled against subsequent re-' +
        'attempts, customer disputes of the decline, and confirmed-good ' +
        'outcomes.',
      whatGoodEvidenceLooksLike:
        'A measured false-decline rate built from declines validated as ' +
        'genuine, broken down by channel and decline reason, and read ' +
        'alongside the fraud loss it was meant to prevent.',
      weakEvidenceToReject:
        'An approval rate quoted with no false-decline measurement, or a ' +
        'claim that all declines were correct because fraud loss is low.',
    },
    {
      claim: 'Fraud loss — the genuinely addressable share',
      authoritativeSource:
        'The fraud-loss ledger reconciled against payment volume and ' +
        'recoveries, classified by fraud type including authorised-push-' +
        'payment scams.',
      whatGoodEvidenceLooksLike:
        'Net fraud-loss bps broken down by fraud type and rail, ' +
        'separating unauthorised fraud from authorised-push-payment scam ' +
        'loss whose addressability differs.',
      weakEvidenceToReject:
        'A blended fraud-loss figure with no fraud-type breakdown, or a ' +
        'loss number that treats scam loss as fully preventable by ' +
        'detection.',
    },
    {
      claim: 'Interchange / net fee yield and where it leaks',
      authoritativeSource:
        'Network settlement and interchange-qualification reporting ' +
        'reconciled against the general ledger.',
      whatGoodEvidenceLooksLike:
        'Net yield decomposed by interchange tier, with the share of ' +
        'volume settling at downgraded tiers and the routing cost made ' +
        'explicit.',
      weakEvidenceToReject:
        'A gross interchange figure with no qualification breakdown, or a ' +
        'yield number that cannot show where downgrades and routing cost ' +
        'leak.',
    },
    {
      claim: 'Cost per transaction and the manual-exception burden',
      authoritativeSource:
        'Payment-operations cost accounting reconciled against ' +
        'transaction counts by rail, with effort traced to exception and ' +
        'dispute volume.',
      whatGoodEvidenceLooksLike:
        'Fully-loaded cost per transaction by rail, with the manual-' +
        'exception, dispute, and investigation volume measured against ' +
        'straight-through processing.',
      weakEvidenceToReject:
        'A headcount figure with no link to transaction or exception ' +
        'volume, or a cost number that omits network and processing fees.',
    },
    {
      claim: 'The forecast value of a payments AI Move',
      authoritativeSource:
        'The value model — recovered revenue, avoided loss, lower cost to ' +
        'operate, and captured yield, each haircut by its dominant ' +
        'factors — read against the specific rail and regulatory regime.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the fraud-loss and false-decline ' +
        'gains modelled as one coupled trade-off, and every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that sums fraud-loss and false-decline ' +
        'gains independently or ignores network-rule constraints.',
    },
  ],
};
