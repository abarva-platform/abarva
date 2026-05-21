// Domain Function Pack — Financial services · Fraud & financial crime.
//
// Function key: `fraud_financial_crime`.
//
// Fraud & financial crime is the function that protects the institution and
// its customers from criminal abuse of the financial system — and keeps the
// institution lawful and licensed while doing it. It owns two coupled
// missions. The first is fraud: detecting and preventing the theft of
// customer or institution funds — card and payment fraud, account-takeover
// and identity fraud, application and synthetic-identity fraud, authorised-
// push-payment and scam fraud, and check and wire fraud. The second is
// financial crime, the anti-money-laundering and counter-terrorist-financing
// programme: customer due diligence and know-your-customer (KYC), ongoing
// transaction monitoring for suspicious activity, sanctions and watch-list
// screening, suspicious-activity-report (SAR) operations, and the governance
// that satisfies the supervisor and the financial-intelligence unit. It owns
// the detection models, the rules engines, the case-management discipline
// that runs every alert and investigation to a defensible conclusion, and the
// regulatory reporting that holds. It is judged on a hard quadruple bind: real
// losses and real criminal activity must be caught early, the false-positive
// rate must stay low enough that good customers are not blocked and
// investigators are not buried, the cost of the function must stay
// proportionate to the loss and the risk it removes, and every decision —
// every account closed, every transaction blocked, every SAR filed — must be
// lawful, evidence-based, fair, and free of the disparate impact and customer
// harm that turn a control into a liability.
//
// The operating reality the pack encodes: fraud and financial crime fail in
// four coupled ways at once. The function is buried in false positives —
// legacy rules and thresholds flood investigators with alerts that are
// overwhelmingly benign, so real loss and real crime are lost in the noise
// and good customers are blocked. It is slow and after-the-fact — fraud is
// detected after the funds have left and AML alerts are worked weeks behind
// the activity, so the institution reports crime rather than stopping it. It
// is fragmented — card, payment, account, application, and AML signals each
// sit in their own system, so an account-takeover that crosses channels, or a
// money-laundering network that spans accounts, is never assembled into one
// picture. And it is heavy and brittle — the cost of investigators, screening
// operations, and SAR filing scales with alert volume rather than with risk,
// and a tuning change or a new typology takes months. The AI archetypes are
// the recurring bets against that reality: real-time transaction-fraud
// detection, account-takeover and identity-fraud detection, AML transaction-
// monitoring uplift and alert triage, entity resolution and network risk
// detection, sanctions and watch-list screening optimisation, and the
// financial-crime investigation and SAR-narrative copilot.
//
// The companion financial-services packs — payments-money-movement owns the
// payment rails the fraud rides on; lending-credit-underwriting owns
// application risk at origination; risk-management owns the enterprise risk
// taxonomy and model governance; regulatory-compliance owns the broader
// conduct rule set. Fraud & financial crime is the specialist function that
// detects, investigates, and reports criminal abuse across all of those
// surfaces and owns the BSA/AML programme and the fairness and customer-harm
// governance over every intervention.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const fraudFinancialCrimePack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'fraud_financial_crime',
  functionLabel: 'Fraud & financial crime',
  summary:
    'Fraud & financial crime is the function that protects the institution ' +
    'and its customers from criminal abuse of the financial system — and ' +
    'keeps the institution lawful and licensed while doing it. It owns two ' +
    'coupled missions: fraud — detecting and preventing the theft of funds ' +
    'through card, payment, account-takeover, identity, application, and ' +
    'scam fraud — and financial crime, the anti-money-laundering and ' +
    'counter-terrorist-financing programme of customer due diligence and ' +
    'KYC, transaction monitoring, sanctions and watch-list screening, and ' +
    'suspicious-activity-report operations. It owns the detection models, ' +
    'the rules engines, the case-management discipline, and the regulatory ' +
    'reporting that holds. The function is judged on a quadruple bind: real ' +
    'loss and real crime must be caught early, the false-positive rate must ' +
    'stay low enough that good customers are not blocked and investigators ' +
    'are not buried, the cost of the function must stay proportionate to ' +
    'the loss and risk it removes, and every account closed, transaction ' +
    'blocked, and SAR filed must be lawful, evidence-based, fair, and free ' +
    'of disparate impact. It fails when the function is buried in false ' +
    'positives, detection is slow and after-the-fact, signals are ' +
    'fragmented across siloed systems, and the cost scales with alert ' +
    'volume rather than with risk.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'fraud_loss_basis_points',
      name: 'Net fraud loss in basis points',
      definition:
        'The net fraud loss the institution bears — gross fraud loss less ' +
        'recoveries and chargebacks won — expressed in basis points of ' +
        'transaction or payment volume, the headline cost-of-fraud ' +
        'measure.',
      unit: 'basis points of transaction volume',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 15,
        basis:
          'Net fraud loss runs structurally by product, channel, and ' +
          'customer mix — card-not-present, faster payments, and ' +
          'digital-account products run higher. A planning range; the ' +
          'product and channel mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-management and finance systems, netting gross fraud ' +
        'loss against recoveries over transaction volume.',
      whyItMatters:
        'Net fraud loss in basis points is the headline measure of the ' +
        'fraud function — a direct loss to the institution and its ' +
        'customers — and every detection and prevention decision is ' +
        'ultimately judged on whether it moves this number.',
    },
    {
      key: 'fraud_detection_rate',
      name: 'Fraud detection rate (value caught)',
      definition:
        'The share of fraudulent transaction value that the function ' +
        'detects and stops or recovers, rather than letting it complete ' +
        'and crystallise as a loss — the catch rate of the detection ' +
        'estate.',
      unit: '% of fraudulent value detected and stopped or recovered',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 90,
        basis:
          'The detection rate depends on model quality, real-time ' +
          'decisioning, and channel coverage; the band spans a ' +
          'rules-only, after-the-fact estate to a real-time, ' +
          'model-driven one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-management system, comparing detected-and-stopped ' +
        'fraud against total confirmed fraud including losses that ' +
        'completed.',
      whyItMatters:
        'The detection rate tests whether the function actually catches ' +
        'fraud or merely counts it after the funds have gone — a low ' +
        'rate means the institution is absorbing loss it had the data to ' +
        'prevent.',
    },
    {
      key: 'false_positive_rate',
      name: 'Fraud false-positive rate',
      definition:
        'The ratio of legitimate transactions or customers flagged, ' +
        'declined, or alerted by the fraud system to the genuinely ' +
        'fraudulent ones — the false-positive burden on good customers ' +
        'and on investigators.',
      unit: 'false positives per confirmed fraud',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 50,
        basis:
          'The fraud false-positive ratio depends on model precision ' +
          'and threshold discipline; the band spans a precise, ' +
          'model-driven estate to a blunt rules-based one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-management and case systems, comparing flagged-and-' +
        'cleared events against confirmed fraud.',
      whyItMatters:
        'A false positive is a good customer wrongly declined or ' +
        'frozen — direct customer harm, lost revenue, and attrition — ' +
        'and a flood of them buries investigators, so this metric is the ' +
        'hard bound on how aggressively any detection model can act.',
    },
    {
      key: 'fraud_decision_latency',
      name: 'Real-time fraud decision latency',
      definition:
        'The elapsed time the fraud system takes to score a transaction ' +
        'and return an approve, decline, or step-up decision — the ' +
        'window in which fraud must be caught before the payment ' +
        'completes.',
      unit: 'milliseconds per transaction decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 300,
        basis:
          'Decision latency must fit inside the payment authorisation ' +
          'window; the band spans a real-time decisioning estate to one ' +
          'too slow for in-flight intervention. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The real-time fraud-decisioning and payment-authorisation ' +
        'systems, timestamping transaction receipt against decision ' +
        'return.',
      whyItMatters:
        'Fraud detected after a payment settles is a loss to recover, ' +
        'not a loss prevented — decision latency is what separates ' +
        'stopping fraud in flight from chasing it afterward, especially ' +
        'on faster-payment rails where funds are irrevocable in seconds.',
    },
    {
      key: 'alert_to_sar_conversion',
      name: 'AML alert-to-SAR conversion rate',
      definition:
        'The share of transaction-monitoring alerts that, after ' +
        'investigation, result in a filed suspicious-activity report — ' +
        'the read on whether monitoring alerts are productive or noise.',
      unit: '% of investigated alerts converting to a filed SAR',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 20,
        basis:
          'The conversion rate depends on monitoring-scenario quality ' +
          'and tuning; legacy rules-based monitoring runs very low, a ' +
          'well-tuned risk-based estate runs higher. A planning range, ' +
          'not a target — too high may signal under-alerting.',
        label: 'planning-range',
      },
      dataSource:
        'The transaction-monitoring and case-management systems, ' +
        'tracking alerts through investigation to SAR filing.',
      whyItMatters:
        'A very low conversion rate means the monitoring estate is ' +
        'generating overwhelmingly benign alerts — the central ' +
        'inefficiency of AML — so this metric tests whether investigator ' +
        'time is spent on real suspicion or on noise.',
    },
    {
      key: 'alert_investigation_cycle_time',
      name: 'Alert and case investigation cycle time',
      definition:
        'The elapsed time from an AML alert or fraud case being raised ' +
        'to a defensible, documented disposition — cleared, escalated, ' +
        'or filed — across the investigation queue.',
      unit: 'days from alert raised to documented disposition',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 30,
        basis:
          'Investigation cycle time depends on alert volume, evidence ' +
          'assembly, and case-management discipline; the band spans an ' +
          'efficient, supported queue to a backlogged one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The financial-crime case-management system, timestamping alert ' +
        'creation against documented disposition.',
      whyItMatters:
        'A long investigation cycle means SARs are filed late and a ' +
        'backlog builds — both a regulatory failing and a sign the ' +
        'function cannot keep pace, so cycle time is the throughput ' +
        'measure of the investigation engine.',
    },
    {
      key: 'sar_filing_timeliness',
      name: 'SAR filing timeliness and quality',
      definition:
        'The share of suspicious-activity reports filed within the ' +
        'regulatory deadline with a complete, defensible narrative ' +
        'rather than late or with a deficient narrative on review.',
      unit: '% of SARs filed on time with a defensible narrative',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 99,
        basis:
          'SAR timeliness and quality depend on investigation capacity ' +
          'and narrative discipline; the band spans a well-run filing ' +
          'process to a backlogged one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The case-management and regulatory-filing systems, against the ' +
        'statutory filing deadline and a narrative-quality review.',
      whyItMatters:
        'A late or deficient SAR is a direct BSA/AML regulatory ' +
        'failing — SAR filing timeliness and quality are what the ' +
        'supervisor and the financial-intelligence unit judge the ' +
        'programme on.',
    },
    {
      key: 'sanctions_screening_false_positive',
      name: 'Sanctions-screening false-positive rate',
      definition:
        'The share of sanctions and watch-list screening hits that, on ' +
        'review, are false matches — name coincidences and weak fuzzy ' +
        'matches — rather than true exposure to a sanctioned party.',
      unit: '% of screening hits that are false matches',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 90,
        high: 99,
        basis:
          'Sanctions screening is deliberately conservative, so the ' +
          'false-match share is structurally very high; the band spans a ' +
          'well-tuned matching estate to a blunt one. A planning range — ' +
          'never tuned at the expense of a missed true hit.',
        label: 'planning-range',
      },
      dataSource:
        'The sanctions-screening and case systems, comparing screening ' +
        'hits against confirmed true matches.',
      whyItMatters:
        'Sanctions screening generates enormous false-positive volume ' +
        'that consumes operations cost and delays payments — reducing it ' +
        'is real value, but it is the one metric that must never be ' +
        'improved by accepting a higher chance of missing a true ' +
        'sanctioned party.',
    },
    {
      key: 'account_takeover_rate',
      name: 'Account-takeover and identity-fraud rate',
      definition:
        'The rate of confirmed account-takeover and identity-fraud ' +
        'events — unauthorised access, credential and SIM-swap abuse, ' +
        'and synthetic-identity accounts — per active account or per ' +
        'thousand logins.',
      unit: 'confirmed ATO / identity-fraud events per 1,000 accounts',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.2,
        high: 5,
        basis:
          'The ATO and identity-fraud rate depends on authentication ' +
          'strength and behavioural detection; the band spans a ' +
          'well-defended digital estate to an exposed one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-management, identity, and authentication systems, ' +
        'tracking confirmed ATO and identity-fraud events.',
      whyItMatters:
        'Account takeover is the fastest-growing fraud vector and the ' +
        'one customers experience as a personal violation — this metric ' +
        'isolates identity-driven fraud so it can be defended without ' +
        'forcing friction on every honest login.',
    },
    {
      key: 'investigator_productivity',
      name: 'Investigator productivity (alerts per FTE)',
      definition:
        'The number of fraud and AML alerts and cases an investigator ' +
        'works to a defensible disposition per period — the throughput ' +
        'of the investigation workforce against the alert load.',
      unit: 'dispositioned alerts per investigator per period',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 100,
        high: 600,
        basis:
          'Investigator productivity depends on evidence-assembly ' +
          'support and case tooling; the band spans a manual, ' +
          'context-switching workflow to a well-supported one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The case-management system, tracking dispositioned alerts ' +
        'against investigator headcount.',
      whyItMatters:
        'The financial-crime function’s cost is dominated by ' +
        'investigator labour scaling with alert volume — productivity ' +
        'is the measure of whether the same workforce can absorb a ' +
        'rising alert load without the cost or the backlog rising with ' +
        'it.',
    },
    {
      key: 'financial_crime_cost_ratio',
      name: 'Financial-crime programme cost ratio',
      definition:
        'The total cost of the fraud and financial-crime programme — ' +
        'investigator and analyst labour, screening and monitoring ' +
        'technology, and KYC operations — expressed as a ratio to the ' +
        'fraud loss and the regulatory risk it is charged with reducing.',
      unit: 'programme cost per dollar of fraud loss addressed',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 0.3,
        high: 1.5,
        basis:
          'The cost ratio is structural by product mix and regulatory ' +
          'intensity — a heavily regulated, high-risk franchise carries ' +
          'a heavier programme; the band is a planning range, not a ' +
          'target, because under-investing simply moves the cost to loss ' +
          'and regulatory exposure.',
        label: 'planning-range',
      },
      dataSource:
        'The financial-crime budget and the finance system, set against ' +
        'the fraud loss and regulatory exposure the programme targets.',
      whyItMatters:
        'A financial-crime programme can become a cost centre whose ' +
        'labour and technology spend scales with alert noise rather than ' +
        'with real risk — the cost ratio is the discipline that keeps ' +
        'the programme proportionate without leaving loss or regulatory ' +
        'exposure uncovered.',
    },
    {
      key: 'kyc_onboarding_cycle_time',
      name: 'KYC / customer due-diligence cycle time',
      definition:
        'The elapsed time to complete customer due diligence at ' +
        'onboarding — identity verification, screening, and risk ' +
        'rating — to a decision the institution can defend, before the ' +
        'customer is fully active.',
      unit: 'hours from application to completed due diligence',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 72,
        basis:
          'KYC cycle time depends on verification automation and ' +
          'screening throughput; the band spans a digital, automated ' +
          'onboarding to a manual, document-heavy one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The KYC / customer-due-diligence and onboarding systems, ' +
        'timestamping application against completed due diligence.',
      whyItMatters:
        'KYC cycle time is where the financial-crime programme meets ' +
        'the customer — slow due diligence loses good customers at ' +
        'onboarding, while a rushed one lets risk in, so it is the ' +
        'measure of due diligence done both fast and defensibly.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'false_positive_flood',
      name: 'False-positive flood burying real risk',
      description:
        'Legacy rules and static thresholds flag a vast volume of ' +
        'legitimate activity, so investigators are buried in benign ' +
        'alerts, real loss and real crime are lost in the noise, and ' +
        'good customers are declined or frozen — the central ' +
        'inefficiency of both fraud and AML.',
      detectionSignal:
        'The false-positive rate and the sanctions false-match rate are ' +
        'high; the alert-to-SAR conversion rate is very low; ' +
        'investigators spend most of their time clearing noise; customer ' +
        'complaints about declines cluster.',
      diagnosticQuestion:
        'What share of fraud alerts and AML alerts are false positives, ' +
        'and how much investigator capacity and customer goodwill is ' +
        'consumed clearing them?',
    },
    {
      key: 'after_the_fact_detection',
      name: 'Slow, after-the-fact detection',
      description:
        'Fraud is detected after the funds have settled and AML alerts ' +
        'are worked weeks behind the activity, so the institution ' +
        'reports crime rather than stopping it — and on irrevocable ' +
        'faster-payment rails an after-the-fact decision is no ' +
        'protection at all.',
      detectionSignal:
        'Fraud decision latency is too slow for in-flight intervention; ' +
        'the detection rate is low; investigation cycle time is long; ' +
        'losses on faster-payment rails are rising.',
      diagnosticQuestion:
        'Is fraud caught in flight before the payment completes, and ' +
        'how far behind the activity are AML alerts actually worked?',
    },
    {
      key: 'fragmented_signal_silos',
      name: 'Fragmented fraud and crime signal across silos',
      description:
        'Card, payment, account, login, application, and AML signals ' +
        'each sit in their own system and model, so an account-takeover ' +
        'that crosses channels, or a money-laundering network spanning ' +
        'accounts and products, is never assembled into one picture and ' +
        'the connecting pattern is missed.',
      detectionSignal:
        'Fraud and AML systems do not share signal; the same customer ' +
        'or device recurs across systems with no link; cross-channel and ' +
        'network typologies are detected late or by chance.',
      diagnosticQuestion:
        'How are fraud, identity, and AML signals joined across ' +
        'channels and products, and can an investigation follow a fraud ' +
        'or laundering pattern across the whole relationship?',
    },
    {
      key: 'static_rules_typology_lag',
      name: 'Static rules lagging new typologies',
      description:
        'Detection runs on hand-coded rules and fixed thresholds that ' +
        'criminals probe and learn to evade, and adding a defence for a ' +
        'new fraud or laundering typology takes months of change ' +
        'control — so the function is always defending last year’s ' +
        'attack.',
      detectionSignal:
        'Detection is rules-dominated with little adaptive modelling; ' +
        'new typologies cause loss spikes before a rule catches up; ' +
        'tuning changes take months; criminals evade known thresholds.',
      diagnosticQuestion:
        'How quickly can the function detect and defend against a new ' +
        'fraud or laundering typology, and how much of detection adapts ' +
        'versus waiting on a manual rule change?',
    },
    {
      key: 'investigation_evidence_burden',
      name: 'Manual evidence assembly burdening investigators',
      description:
        'Investigators assemble each case by hand — pulling transaction ' +
        'history, KYC records, prior alerts, and external data from ' +
        'separate systems — so most of their time goes to evidence ' +
        'gathering rather than judgement, and cases and SARs are slow ' +
        'and inconsistent.',
      detectionSignal:
        'Investigator productivity is low; investigation cycle time is ' +
        'long; SAR filing timeliness slips; investigators context-switch ' +
        'across many systems per case.',
      diagnosticQuestion:
        'How much of an investigator’s time goes to assembling evidence ' +
        'versus exercising judgement, and how consistent is the resulting ' +
        'case and SAR quality?',
    },
    {
      key: 'fairness_and_customer_harm',
      name: 'Fairness, disparate impact, and customer harm',
      description:
        'Detection models and screening decline transactions, freeze ' +
        'accounts, and exit customers — and if those decisions fall ' +
        'unevenly across customer groups or hit innocent customers hard, ' +
        'the result is unlawful disparate impact, financial exclusion, ' +
        'and reputational and regulatory exposure.',
      detectionSignal:
        'Decline, freeze, and exit decisions are not analysed for ' +
        'disparate impact; there is no customer-recourse channel; ' +
        'complaints and de-risking-related exclusion cluster around ' +
        'particular groups.',
      diagnosticQuestion:
        'Are fraud declines, account freezes, and customer exits ' +
        'monitored for disparate impact and customer harm, and is there ' +
        'a fair, fast recourse channel for a wrongly affected customer?',
    },
    {
      key: 'aml_program_under_supervisory_pressure',
      name: 'AML programme under supervisory pressure',
      description:
        'The BSA/AML programme — monitoring coverage, KYC quality, SAR ' +
        'timeliness, model validation — falls short of supervisory ' +
        'expectations, and a pattern of weaknesses escalates toward a ' +
        'consent order, a monetary penalty, or a growth restriction.',
      detectionSignal:
        'SAR filing timeliness slips; monitoring scenarios are stale or ' +
        'unvalidated; KYC records are incomplete; supervisory findings ' +
        'and look-back exercises recur.',
      diagnosticQuestion:
        'Does the BSA/AML programme — monitoring, KYC, SAR operations, ' +
        'and model governance — meet supervisory expectations, and what ' +
        'findings are currently open?',
    },
    {
      key: 'cost_scales_with_alert_volume',
      name: 'Programme cost scaling with alert volume not risk',
      description:
        'Investigator headcount, screening operations, and KYC cost ' +
        'scale with the volume of alerts the legacy estate generates ' +
        'rather than with real risk — so a rising alert load means a ' +
        'rising cost line with no matching rise in fraud caught or ' +
        'crime stopped.',
      detectionSignal:
        'The financial-crime cost ratio is high or rising; headcount ' +
        'tracks alert volume; investigator productivity is flat; cost ' +
        'rises without a matching rise in detection or SAR yield.',
      diagnosticQuestion:
        'Does the financial-crime programme’s cost scale with alert ' +
        'volume or with real risk, and is investigator productivity ' +
        'keeping pace with the alert load?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'real_time_transaction_fraud_detection',
      name: 'Real-time transaction-fraud detection',
      valueMechanism:
        'A model scores every transaction in real time on behavioural, ' +
        'device, payment, and counterparty signal and returns an ' +
        'approve, decline, or step-up decision inside the authorisation ' +
        'window — replacing static rules with an adaptive model that ' +
        'learns each customer’s pattern. Value comes from raising the ' +
        'fraud detection rate and cutting net fraud loss while lowering ' +
        'the false-positive rate, so more fraud is stopped in flight and ' +
        'fewer good customers are declined.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Real-time transaction, payment, and authorisation data',
        'Device, session, channel, and behavioural-biometric signal',
        'Customer profile, history, and counterparty data',
        'Confirmed fraud and chargeback outcomes for model training',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Real-time decisioning acts autonomously inside the latency ' +
          'window; humans own threshold policy, monitoring, and every ' +
          'customer-facing review — and a declined customer must have a ' +
          'fast, fair recourse path.',
        'The model must be tested for disparate impact so declines do ' +
          'not fall unevenly across customer groups — fairness is a hard ' +
          'bound, not a tuning lever.',
        'The model is governed under model-risk management — validated, ' +
          'monitored for drift, and tuned against the false-positive ' +
          'customer-harm cost.',
      ],
      metricsMoved: [
        'fraud_loss_basis_points',
        'fraud_detection_rate',
        'false_positive_rate',
        'fraud_decision_latency',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'account_takeover_identity_fraud_detection',
      name: 'Account-takeover and identity-fraud detection',
      valueMechanism:
        'A model combines behavioural biometrics, device intelligence, ' +
        'login and session signal, and identity-verification data to ' +
        'detect account takeover, credential and SIM-swap abuse, and ' +
        'synthetic identities — and triggers a proportionate step-up ' +
        'only on genuinely high-risk sessions. Value comes from cutting ' +
        'the account-takeover and identity-fraud rate while keeping ' +
        'authentication friction off honest customers.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Login, session, and behavioural-biometric signal',
        'Device fingerprint and device-reputation intelligence',
        'Identity-verification and credential-change event data',
        'Confirmed account-takeover and synthetic-identity case history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model triggers a step-up or review; humans own account ' +
          'freezes and closures, and a wrongly locked-out customer must ' +
          'have a fast recovery path.',
        'Behavioural-biometric and device signal must be governed under ' +
          'data-privacy and biometric law and disclosed to customers.',
        'The model must be tested for disparate impact across customer ' +
          'groups, devices, and accessibility needs so step-up friction ' +
          'is not unfairly concentrated.',
      ],
      metricsMoved: [
        'account_takeover_rate',
        'fraud_loss_basis_points',
        'false_positive_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'aml_monitoring_uplift_alert_triage',
      name: 'AML transaction-monitoring uplift and alert triage',
      valueMechanism:
        'A model overlays the transaction-monitoring estate — scoring ' +
        'alerts by genuine suspicion, suppressing repetitive benign ' +
        'noise, and detecting risk the rules miss — and triages the ' +
        'investigation queue so investigators see the highest-suspicion ' +
        'alerts first. Value comes from raising the alert-to-SAR ' +
        'conversion rate and cutting investigation cycle time, so ' +
        'investigator effort concentrates on real financial crime.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Transaction-monitoring alerts and the underlying transaction ' +
          'data',
        'Customer due-diligence, KYC, and risk-rating data',
        'Historical alert dispositions and filed-SAR outcomes',
        'Typology definitions and the AML risk-assessment framework',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model scores and triages; an investigator owns every ' +
          'disposition and every SAR decision — suppression must never ' +
          'silently close an alert without a defensible, auditable ' +
          'rationale.',
        'The model is a BSA/AML model under SR 11-7 — it must be ' +
          'validated, explainable, and acceptable to the supervisor ' +
          'before reliance, and never reduce effective monitoring ' +
          'coverage.',
        'Tuning must be evidenced against the regulator — a change that ' +
          'lowers alert volume must be shown not to lower true-positive ' +
          'detection.',
      ],
      metricsMoved: [
        'alert_to_sar_conversion',
        'alert_investigation_cycle_time',
        'investigator_productivity',
        'financial_crime_cost_ratio',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'entity_resolution_network_risk',
      name: 'Entity resolution and network risk detection',
      valueMechanism:
        'A model resolves customers, accounts, devices, and ' +
        'counterparties into unified entities and maps the network of ' +
        'relationships between them — exposing the connected structures ' +
        'that hide money laundering, mule networks, and organised fraud ' +
        'rings. Value comes from raising the alert-to-SAR conversion ' +
        'rate and the fraud detection rate by surfacing network ' +
        'typologies a single-account view can never see.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Customer, account, device, and counterparty reference data',
        'Transaction and payment flows between parties',
        'KYC, beneficial-ownership, and relationship data',
        'Confirmed laundering-network and fraud-ring case history',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model surfaces and links networks; an investigator owns ' +
          'every case, escalation, and SAR — a network link is a lead, ' +
          'not a finding of crime.',
        'Entity resolution must be auditable and accurate — a wrong ' +
          'merge implicates an innocent customer in a network they have ' +
          'no part in.',
        'Network inference must be governed for fairness and privacy ' +
          'and never used to penalise a customer purely for proximity ' +
          'to a flagged party.',
      ],
      metricsMoved: [
        'alert_to_sar_conversion',
        'fraud_detection_rate',
        'account_takeover_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'sanctions_screening_optimisation',
      name: 'Sanctions and watch-list screening optimisation',
      valueMechanism:
        'A model improves sanctions and watch-list screening — better ' +
        'name and entity matching, contextual scoring of hits, and ' +
        'auto-clearing of clear false matches with a documented ' +
        'rationale — so screening operations focus on genuine potential ' +
        'matches. Value comes from cutting the sanctions-screening ' +
        'false-positive rate and investigation cycle time without ' +
        'lowering true-match detection.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Screening hits against current sanctions and watch lists',
        'Customer, counterparty, and payment-party reference data',
        'Historical hit dispositions and confirmed true-match outcomes',
        'List-management and regulatory sanctions-program definitions',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model scores and may auto-clear only clear false matches ' +
          'with a documented, auditable rationale; an analyst owns every ' +
          'genuine potential match and every escalation.',
        'Screening must be calibrated so a true sanctioned-party match ' +
          'is never missed — false-positive reduction is value, a missed ' +
          'true hit is a sanctions violation and a hard bound.',
        'The model and its tuning must be validated and acceptable to ' +
          'the supervisor, with full auditability of every auto-clear.',
      ],
      metricsMoved: [
        'sanctions_screening_false_positive',
        'alert_investigation_cycle_time',
        'financial_crime_cost_ratio',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'financial_crime_investigation_sar_copilot',
      name: 'Financial-crime investigation and SAR-narrative copilot',
      valueMechanism:
        'A copilot assembles each case’s evidence — joining transaction ' +
        'history, KYC and due-diligence records, prior alerts, network ' +
        'links, and external data into one timeline — drafts the ' +
        'suspicious-activity-report narrative, and guides the ' +
        'investigator through the consistent, lawful steps the policy ' +
        'requires. Value comes from raising investigator productivity ' +
        'and SAR filing timeliness and quality by letting investigators ' +
        'spend their time on judgement, not evidence gathering.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Transaction, payment, KYC, and prior-alert data for the case',
        'The financial-crime case-management system and case history',
        'Network-risk and entity-resolution output',
        'The investigation policy, SAR standards, and typology library',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The copilot assembles evidence and drafts the narrative; the ' +
          'investigator owns every disposition, escalation, and the ' +
          'decision to file — the copilot never decides a case.',
        'A drafted SAR narrative must be grounded only in the actual ' +
          'evidence — a fabricated or overstated narrative is a serious ' +
          'regulatory and legal exposure.',
        'The copilot must enforce the lawful, consistent investigation ' +
          'process — including tipping-off prohibitions and ' +
          'confidentiality — and flag, never skip, a required step.',
      ],
      metricsMoved: [
        'investigator_productivity',
        'sar_filing_timeliness',
        'alert_investigation_cycle_time',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'real_time_fraud_decisioning_pattern',
      name: 'Real-time fraud-decisioning pattern',
      description:
        'A pattern that scores every transaction inside the ' +
        'authorisation window from behavioural, device, payment, and ' +
        'counterparty signal and returns an approve, decline, or step-up ' +
        'decision — replacing static rules with an adaptive, governed ' +
        'model so fraud is stopped in flight.',
      boundary:
        'It decides autonomously inside the latency window; humans own ' +
        'threshold policy, model governance, and every customer review. ' +
        'A declined customer must have a fast, fair recourse path.',
      humanAccountabilityPoint:
        'The head of fraud, accountable for fraud loss, the ' +
        'false-positive customer-harm balance, and the decisioning ' +
        'policy.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'unified_financial_crime_intelligence_pattern',
      name: 'Unified financial-crime intelligence pattern',
      description:
        'A pattern that joins card, payment, account, login, ' +
        'application, and AML signal with resolved customer and ' +
        'counterparty entities and a network view — so a cross-channel ' +
        'takeover or a laundering network is assembled into one picture ' +
        'and fed to one prioritised investigation queue.',
      boundary:
        'It links signal and surfaces patterns; an investigator owns ' +
        'every case, escalation, and SAR. Entity links are leads, not ' +
        'findings, and resolution is auditable.',
      humanAccountabilityPoint:
        'The BSA/AML officer and the head of fraud, jointly accountable ' +
        'for the integrity of the unified detection estate.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'risk_based_alert_triage_pattern',
      name: 'Risk-based alert-triage pattern',
      description:
        'A pattern that scores fraud and AML alerts by genuine ' +
        'suspicion, suppresses repetitive benign noise with a ' +
        'documented rationale, and triages the investigation queue so ' +
        'the highest-risk alerts are worked first — concentrating scarce ' +
        'investigator effort on real risk.',
      boundary:
        'It scores and orders; an investigator owns every disposition ' +
        'and SAR decision. Suppression is auditable and never silently ' +
        'closes an alert, and monitoring coverage is never reduced.',
      humanAccountabilityPoint:
        'The head of financial-crime operations, accountable for ' +
        'investigation throughput, SAR timeliness, and monitoring ' +
        'coverage.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'governed_investigation_workbench_pattern',
      name: 'Governed investigation-workbench pattern',
      description:
        'A pattern that gives every investigator one workbench — the ' +
        'joined evidence timeline, the drafted SAR narrative, and a ' +
        'guided, lawful investigation workflow — so cases are worked ' +
        'consistently, to a defensible standard, and to a documented, ' +
        'timely disposition.',
      boundary:
        'It assembles evidence and drafts; the investigator owns every ' +
        'disposition and the decision to file. It enforces the lawful ' +
        'process — tipping-off and confidentiality included — and flags ' +
        'a skipped step.',
      humanAccountabilityPoint:
        'The financial-crime investigations manager, accountable for ' +
        'case quality, SAR timeliness, and due process.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'fairness_and_customer_protection_pattern',
      name: 'Fairness-and-customer-protection governance pattern',
      description:
        'A pattern that wraps every fraud and financial-crime model and ' +
        'screening decision in a governance layer — disparate-impact ' +
        'testing across customer groups, false-positive and customer-' +
        'harm monitoring, a fast customer-recourse channel, and model ' +
        'validation under model-risk management.',
      boundary:
        'It governs and audits the models and decisions; financial-' +
        'crime leadership, with legal, compliance, and model-risk ' +
        'oversight, owns the standards. It can suspend a model that ' +
        'fails a fairness or validation threshold.',
      humanAccountabilityPoint:
        'The financial-crime leadership, with legal, compliance, and ' +
        'model-risk oversight, accountable for the lawfulness, fairness, ' +
        'and customer-protection posture of the programme.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Fraud-and-financial-crime value is realised in three connected ' +
      'ways and a forecast must keep them distinct — and it carries a ' +
      'fourth, non-negotiable dimension that is a constraint, not a ' +
      'value lever. First, loss avoided: faster, more accurate fraud ' +
      'detection stops more fraud in flight and cuts net fraud loss in ' +
      'basis points — a recurring P&L gain that shows up directly. ' +
      'Second, operational efficiency: alert triage, entity resolution, ' +
      'screening optimisation, and the investigation copilot let the ' +
      'same investigator workforce absorb a rising alert load — raising ' +
      'investigator productivity and holding the financial-crime cost ' +
      'ratio in its band rather than letting cost scale with alert ' +
      'noise. Third, customer experience and growth protected: a lower ' +
      'false-positive rate means fewer good customers wrongly declined, ' +
      'frozen, or slowed at onboarding — protecting revenue, retention, ' +
      'and the brand. The fourth dimension — regulatory integrity, ' +
      'fairness, and customer protection — is a hard constraint on all ' +
      'three: a forecast must never trade a lower cost or a lower ' +
      'false-positive rate for weaker monitoring coverage, a missed ' +
      'sanctioned party, a late or deficient SAR, or a model with ' +
      'disparate impact, because a supervisory penalty, a sanctions ' +
      'breach, or unlawful customer harm is a loss far larger than any ' +
      'efficiency gain. The dominant constraint on value is data quality ' +
      'and model governance — every gain rests on the breadth and ' +
      'cleanliness of the signal and on a model the supervisor will ' +
      'accept — so a forecast must be read against the institution’s ' +
      'data readiness and the regulatory acceptance of any monitoring or ' +
      'screening change, not a model-perfect estate. The first three ' +
      'levers are recurring once realised; the regulatory-integrity ' +
      'constraint binds every period.',
    dominantHaircutFactors: [
      {
        factor: 'Data quality, coverage, and signal breadth',
        rationale:
          'Every fraud and crime model rests on broad, clean, joined ' +
          'signal — transaction, device, identity, KYC, and ' +
          'counterparty data. Fragmented systems, poor KYC records, and ' +
          'gaps in device or behavioural signal cap how much of the ' +
          'modelled detection and triage gain can actually be realised.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'The share of a modelled fraud-and-crime detection gain not ' +
            'realised because data quality, coverage, and signal ' +
            'breadth fall short; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Regulatory and model-governance acceptance',
        rationale:
          'A change to AML monitoring, sanctions screening, or a ' +
          'detection model only delivers value once it is validated and ' +
          'acceptable to the supervisor. A regulator can require that ' +
          'monitoring coverage is not reduced, that suppression is ' +
          'evidenced, and that models are explainable — bounding how ' +
          'much efficiency value can be realised.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled efficiency and tuning gain bounded ' +
            'by supervisory acceptance and model-governance ' +
            'expectations; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Fairness and customer-harm constraints',
        rationale:
          'Detection only converts to value through declines, freezes, ' +
          'and exits that are lawful, fair, and free of disparate ' +
          'impact. Disparate-impact limits, financial-exclusion risk, ' +
          'and the customer-harm cost of a false positive bound how ' +
          'aggressively any model can be tuned.',
        typicalHaircut: {
          low: 0.1,
          high: 0.35,
          basis:
            'The share of a modelled detection gain bounded by ' +
            'fairness, disparate-impact, and customer-harm limits on ' +
            'intervention; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Adversarial adaptation and typology volatility',
        rationale:
          'Fraud and laundering are adversarial — criminals probe and ' +
          'adapt to any defence, and new typologies emerge constantly. ' +
          'That adaptation erodes a model’s edge over time and makes a ' +
          'one-time detection gain decay unless the model is ' +
          'continuously retrained and monitored.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from adversarial adaptation and emerging ' +
            'typologies decaying a detection gain over time; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Net fraud-loss reduction',
        range: {
          low: 15,
          high: 45,
          basis:
            'Relative reduction in net fraud loss from real-time, ' +
            'model-driven detection replacing static rules; a planning ' +
            'range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in net fraud loss in basis points ' +
          'of transaction volume.',
      },
      {
        lever: 'False-positive reduction',
        range: {
          low: 20,
          high: 60,
          basis:
            'Relative reduction in the fraud and sanctions ' +
            'false-positive volume from model-driven precision and ' +
            'screening optimisation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in false positives per confirmed ' +
          'fraud and false matches per screening hit.',
      },
      {
        lever: 'Investigator-productivity improvement',
        range: {
          low: 25,
          high: 70,
          basis:
            'Relative improvement in alerts dispositioned per ' +
            'investigator from triage, entity resolution, and the ' +
            'investigation copilot; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in defensibly-dispositioned alerts ' +
          'per investigator per period.',
      },
      {
        lever: 'AML alert-quality improvement',
        range: {
          low: 20,
          high: 80,
          basis:
            'Relative improvement in the alert-to-SAR conversion rate ' +
            'from risk-based monitoring uplift and triage; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in the share of investigated alerts ' +
          'converting to a filed SAR.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot scope ' +
      '(real-time fraud scoring or alert triage live, false positives ' +
      'falling, investigators working a triaged queue); 12–24 months to ' +
      'a settled, supervisory-accepted result, because AML monitoring ' +
      'and sanctions-screening changes must be validated and accepted by ' +
      'the regulator before the institution can rely on them — and ' +
      'longer still where fragmented data must be joined before ' +
      'detection can be trusted.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Real-time fraud-management and decisioning system',
        role:
          'Scores transactions and customer events in real time and ' +
          'returns approve / decline / step-up decisions — the system of ' +
          'record for fraud detection and the fraud-loss and ' +
          'false-positive metrics.',
        examples: [
          'SAS Fraud Management',
          'Feedzai / similar real-time fraud platforms',
          'FICO Falcon fraud-detection platform',
        ],
      },
      {
        name: 'AML transaction-monitoring system',
        role:
          'Runs the monitoring scenarios and rules that generate ' +
          'suspicious-activity alerts — the source of the alert-to-SAR ' +
          'conversion and investigation-cycle-time metrics.',
        examples: [
          'NICE Actimize transaction monitoring',
          'Oracle Financial Crime and Compliance Management',
          'SAS Anti-Money Laundering',
        ],
      },
      {
        name: 'Sanctions and watch-list screening system',
        role:
          'Screens customers, counterparties, and payment parties ' +
          'against sanctions and watch lists — the source of the ' +
          'screening false-positive metric.',
        examples: [
          'NICE Actimize watch-list filtering',
          'Fircosoft / sanctions-screening engines',
          'in-house screening and list-management platforms',
        ],
      },
      {
        name: 'Financial-crime case-management system',
        role:
          'Holds every fraud and AML investigation — alerts, evidence, ' +
          'dispositions, and SAR filings — the backbone of the ' +
          'investigator-productivity and SAR-timeliness metrics.',
        examples: [
          'NICE Actimize case management',
          'Oracle FCCM case management',
          'in-house financial-crime case platforms',
        ],
      },
      {
        name: 'KYC / customer-due-diligence and identity system',
        role:
          'Holds customer identity, verification, beneficial ownership, ' +
          'and risk rating — the source of the KYC cycle-time metric and ' +
          'the due-diligence record behind every investigation.',
        examples: [
          'KYC / customer-onboarding and identity-verification ' +
            'platforms',
          'beneficial-ownership and corporate-registry data services',
          'in-house customer-due-diligence systems',
        ],
      },
      {
        name: 'Regulatory-reporting and SAR-filing system',
        role:
          'Files suspicious-activity reports and other regulatory ' +
          'submissions to the financial-intelligence unit — the source ' +
          'of the SAR-filing-timeliness metric.',
        examples: [
          'FinCEN BSA E-Filing and equivalent regulatory portals',
          'regulatory-reporting and SAR-management platforms',
          'in-house regulatory-filing systems',
        ],
      },
    ],
    roles: [
      {
        title: 'BSA/AML Officer / Head of Financial Crime',
        accountability:
          'Owns the BSA/AML programme — monitoring, KYC, sanctions, and ' +
          'SAR operations — and is the named, accountable officer to the ' +
          'supervisor for its effectiveness.',
      },
      {
        title: 'Head of Fraud',
        accountability:
          'Owns the fraud-prevention strategy, fraud loss, the ' +
          'detection estate, and the false-positive customer-harm ' +
          'balance.',
      },
      {
        title: 'Head of financial-crime operations',
        accountability:
          'Owns the investigation and screening operations — alert ' +
          'queues, investigation throughput, and SAR filing.',
      },
      {
        title: 'Fraud / financial-crime investigator',
        accountability:
          'Owns individual cases — evidence, disposition, and SAR ' +
          'narratives — to a lawful, defensible standard.',
      },
      {
        title: 'Sanctions and screening analyst',
        accountability:
          'Owns the disposition of sanctions and watch-list screening ' +
          'hits and the escalation of genuine potential matches.',
      },
      {
        title: 'Financial-crime data and model lead',
        accountability:
          'Owns the detection models and monitoring scenarios — tuning, ' +
          'performance, and validation readiness under model-risk ' +
          'management.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Bank Secrecy Act / anti-money-laundering (BSA/AML) regime',
        relevance:
          'Mandates the AML programme — customer due diligence, ' +
          'transaction monitoring, SAR filing, and a named accountable ' +
          'officer — the core legal frame over the financial-crime ' +
          'function.',
      },
      {
        name: 'OFAC and sanctions screening obligations',
        relevance:
          'Prohibit dealings with sanctioned parties and require ' +
          'screening of customers and payments — the frame behind the ' +
          'sanctions-screening metric, where a missed true match is a ' +
          'violation.',
      },
      {
        name: 'Customer Due Diligence and beneficial-ownership rules',
        relevance:
          'Require identification and verification of customers and ' +
          'their beneficial owners and ongoing due diligence — the ' +
          'frame behind the KYC cycle-time and onboarding metrics.',
      },
      {
        name: 'SR 11-7 model risk management guidance',
        relevance:
          'Governs the development, validation, and governance of fraud ' +
          'and AML models — the frame that bounds any tuning or model ' +
          'change in the detection estate.',
      },
      {
        name: 'Fair-lending, consumer-protection, and anti-discrimination ' +
          'law',
        relevance:
          'Governs the fairness of declines, freezes, and customer ' +
          'exits and prohibits disparate impact and unlawful financial ' +
          'exclusion — the frame that bounds every customer-facing ' +
          'intervention.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Suspicious activity report (SAR)',
        definition:
          'A confidential report a financial institution files to the ' +
          'financial-intelligence unit when it detects activity it ' +
          'suspects involves money laundering or other financial crime.',
      },
      {
        term: 'Know your customer (KYC) / customer due diligence (CDD)',
        definition:
          'The process of identifying and verifying a customer, ' +
          'understanding their activity, and assessing their financial-' +
          'crime risk at onboarding and on an ongoing basis.',
      },
      {
        term: 'Transaction monitoring',
        definition:
          'The ongoing screening of customer transactions against ' +
          'scenarios and models to detect patterns indicative of money ' +
          'laundering or other suspicious activity.',
      },
      {
        term: 'Account takeover (ATO)',
        definition:
          'A fraud in which a criminal gains unauthorised control of a ' +
          'legitimate customer’s account through stolen credentials, ' +
          'social engineering, or SIM-swap.',
      },
      {
        term: 'Synthetic identity',
        definition:
          'A fabricated identity built from a mix of real and false ' +
          'data, used to open accounts and obtain credit with no ' +
          'genuine person behind it.',
      },
      {
        term: 'Authorised push payment (APP) fraud',
        definition:
          'A scam in which a customer is deceived into authorising a ' +
          'payment to an account controlled by a fraudster — a loss ' +
          'category growing with faster-payment rails.',
      },
      {
        term: 'False positive',
        definition:
          'A legitimate transaction, customer, or screening hit flagged ' +
          'as suspicious — the dominant operational cost of fraud and ' +
          'AML detection and a source of customer harm.',
      },
      {
        term: 'Sanctions screening',
        definition:
          'Checking customers, counterparties, and payment parties ' +
          'against government sanctions and watch lists to prevent ' +
          'prohibited dealings.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Fraud & Financial-Crime Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the institution is losing money to fraud, where ' +
        'the financial-crime programme is buried in false positives, ' +
        'slow, or fragmented, and where it carries regulatory and ' +
        'fairness risk — with baseline evidence — before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Fraud and financial-crime operating context',
          guidance:
            'Name the products, channels, payment rails, and customer ' +
            'segments in scope, the fraud and AML operating model, the ' +
            'investigation workforce, and the regulatory regime. State ' +
            'which fraud-management, transaction-monitoring, screening, ' +
            'case-management, and KYC systems run the function.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — net fraud loss, detection rate, ' +
            'false-positive rate, decision latency, alert-to-SAR ' +
            'conversion, investigation cycle time, SAR timeliness, ' +
            'sanctions false-positive rate, account-takeover rate, ' +
            'investigator productivity, cost ratio, KYC cycle time. For ' +
            'any metric not recorded, name it as a precise seed gap with ' +
            'its expected data source.',
        },
        {
          heading: 'Fraud-detection diagnostic',
          guidance:
            'Analyse how fraud is detected across channels, whether ' +
            'decisioning is real-time or after-the-fact, the detection ' +
            'rate and false-positive rate, the account-takeover and ' +
            'identity-fraud exposure, and how quickly the function can ' +
            'defend a new fraud typology.',
        },
        {
          heading: 'AML, KYC, and sanctions diagnostic',
          guidance:
            'Analyse the transaction-monitoring estate and its ' +
            'alert-to-SAR conversion, the investigation cycle time and ' +
            'SAR filing timeliness, the sanctions-screening ' +
            'false-positive burden, the KYC cycle time and record ' +
            'quality, and any open supervisory findings.',
        },
        {
          heading: 'Cost, fragmentation, and fairness diagnostic',
          guidance:
            'Analyse whether the financial-crime cost scales with alert ' +
            'volume or with risk, how fraud and AML signals are joined ' +
            'across silos, and whether declines, freezes, and exits are ' +
            'monitored for disparate impact with a customer-recourse ' +
            'channel.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — false-positive flood, ' +
            'after-the-fact detection, fragmented signal silos, static ' +
            'rules lagging typologies, manual evidence burden, fairness ' +
            'and customer harm, AML supervisory pressure, cost scaling ' +
            'with alert volume — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — fraud-loss reduction, false-positive ' +
            'reduction, investigator productivity, AML alert quality — ' +
            'explicitly haircut by data quality, regulatory and ' +
            'model-governance acceptance, fairness constraints, and ' +
            'adversarial adaptation. Every figure a labelled planning ' +
            'range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'the alert-to-SAR conversion rate, a false-positive ' +
            'measurement — is a named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points ' +
            'to and why, and what the Move would and would not attempt ' +
            '— with the regulatory-integrity and fairness constraints ' +
            'stated up front.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Fraud & Financial-Crime Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO- and BSA/AML-officer-readable case for ' +
        'funding a fraud and financial-crime AI Move — baseline, ' +
        'forecast, cost, the honest downside, and the regulatory-' +
        'integrity constraint that bounds it.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'loss avoided, operational efficiency, and customer-' +
            'experience and growth protected, the time-to-value band, ' +
            'the explicit regulatory-integrity and fairness constraint, ' +
            'and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — net fraud loss, false-positive rate, alert-to-SAR ' +
            'conversion, investigator productivity, financial-crime cost ' +
            'ratio. Where a baseline is a seed gap (the alert-to-SAR ' +
            'conversion rate and a clean false-positive measurement are ' +
            'common ones), say so and state what closing it requires ' +
            'before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — data quality, ' +
            'regulatory and model-governance acceptance, fairness ' +
            'constraints, adversarial adaptation — explicitly and show ' +
            'the haircut math. Keep loss-avoided, efficiency, and ' +
            'customer-experience gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the fraud, monitoring, ' +
            'screening, case-management, and KYC systems, the model-' +
            'development and validation effort, and the operating-model ' +
            'change across the investigation and screening operations.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker data quality, a ' +
            'tighter supervisory stance on monitoring change, stricter ' +
            'fairness constraints, and a faster-adapting fraud threat. ' +
            'State the downside the CFO and BSA/AML officer are ' +
            'underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example data too fragmented to support ' +
            'reliable detection, or a model-governance and supervisory-' +
            'engagement path not yet in place for an AML monitoring ' +
            'change — and the evidence required before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast and the measurement cadence, including ' +
            'the SAR-timeliness, sanctions-false-positive, and ' +
            'disparate-impact constraint metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Fraud & Financial-Crime Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for ' +
        'the fraud and financial-crime AI capability, grounded in the ' +
        'function reference patterns, the investigation controls, and ' +
        'the regulatory and fairness frames.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — real-time fraud decisioning, unified financial-' +
            'crime intelligence, risk-based alert triage, governed ' +
            'investigation workbench, fairness-and-customer-protection ' +
            'governance — and state which apply and how they connect.',
        },
        {
          heading: 'Data, signal, and integration architecture',
          guidance:
            'Specify the integrations to the fraud, monitoring, ' +
            'screening, case-management, KYC, and identity systems, the ' +
            'entity resolution joining customers and counterparties, ' +
            'the real-time signal feeds, and the data quality the ' +
            'detection use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the human-on-the-loop or human-in-the-loop control posture, ' +
            'the human accountability point, and how an investigator ' +
            'owns every disposition and SAR. State that a model signal ' +
            'is never a finding of crime and define the recourse path ' +
            'for an affected customer.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the fraud, AML, screening, and KYC workflows ' +
            'change, how investigators move from evidence assembly to ' +
            'judgement, how alerts are triaged, how signal is joined ' +
            'across channels, and who owns each change.',
        },
        {
          heading: 'Regulatory, model-governance, and fairness controls',
          guidance:
            'State how every model is validated under SR 11-7, how an ' +
            'AML monitoring or sanctions-screening change is evidenced ' +
            'and accepted by the supervisor without reducing coverage, ' +
            'how disparate-impact and customer-harm monitoring works, ' +
            'and the authority to suspend a model that fails a fairness ' +
            'or validation threshold.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the fraud and financial-crime systems stack, and the ' +
            'phased rollout by channel, product, and use case, sequenced ' +
            'behind model validation and supervisory engagement.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Fraud & Financial-Crime Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the fraud and financial-crime ' +
        'AI capability so value reaches loss avoided, a more productive ' +
        'investigation function, and protected customers — lawfully, ' +
        'fairly, and within supervisory expectations — not just the ' +
        'dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, ' +
            'model development and validation, a pilot scope, scale ' +
            'across channels and products — with milestones tied to the ' +
            'operating metrics and the supervisory-engagement calendar.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, data quality and entity resolution, model ' +
            'development and validation, investigation-process ' +
            'adoption, supervisory engagement, fairness governance, ' +
            'Tower measurement.',
        },
        {
          heading: 'Investigation-team adoption approach',
          guidance:
            'Define the change runway for investigators, analysts, and ' +
            'screening operations — training, the shift from evidence ' +
            'assembly to judgement, and the new triage, workbench, and ' +
            'detection workflows — and how adoption is measured, not ' +
            'assumed.',
        },
        {
          heading: 'Regulatory, model-governance, and fairness launch ' +
            'plan',
          guidance:
            'Define how model validation, supervisory engagement for ' +
            'any monitoring or screening change, disparate-impact ' +
            'monitoring, and the customer-recourse channel are stood up ' +
            'before the capability drives any decision, and who can ' +
            'suspend a model.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the SAR-timeliness, ' +
            'sanctions-false-positive, and disparate-impact constraint ' +
            'metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — fragmented data, a model failing ' +
            'validation, a supervisory objection to a monitoring change, ' +
            'a fairness or customer-harm finding, a fast-adapting fraud ' +
            'threat — with the escalation owner and the trigger for ' +
            'each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it, including the model-validation, ' +
            'supervisory, and fairness conditions that must hold.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Net fraud loss and the detection rate behind it',
      authoritativeSource:
        'The fraud-management and finance systems, netting gross fraud ' +
        'loss against recoveries and comparing detected-and-stopped ' +
        'fraud against total confirmed fraud.',
      whatGoodEvidenceLooksLike:
        'A net fraud loss in basis points with the detection rate and ' +
        'false-positive rate quantified, broken down by channel, ' +
        'product, and fraud type.',
      weakEvidenceToReject:
        'A single fraud-loss figure with no detection or false-positive ' +
        'measurement, or a vendor catch-rate claim taken without ' +
        'tenant-confirmed-fraud evidence.',
    },
    {
      claim: 'AML monitoring effectiveness and alert quality',
      authoritativeSource:
        'The transaction-monitoring and case-management systems, ' +
        'tracking alerts through investigation to filed SARs.',
      whatGoodEvidenceLooksLike:
        'A measured alert-to-SAR conversion rate and investigation ' +
        'cycle time built from the actual alert population, with ' +
        'monitoring coverage and scenario validation evidenced.',
      weakEvidenceToReject:
        'An alert volume reported with no conversion rate, or a claim ' +
        'that monitoring is effective with no validated scenario ' +
        'coverage or SAR-yield evidence.',
    },
    {
      claim: 'Sanctions-screening accuracy and false-positive burden',
      authoritativeSource:
        'The sanctions-screening and case systems, comparing screening ' +
        'hits against confirmed true matches and documented ' +
        'dispositions.',
      whatGoodEvidenceLooksLike:
        'A measured false-match rate with evidence that matching is ' +
        'calibrated so a true sanctioned-party hit is not missed, and ' +
        'every auto-clear is auditable.',
      weakEvidenceToReject:
        'A false-positive reduction claimed with no evidence that ' +
        'true-match detection is preserved, treating screening tuning ' +
        'as a pure efficiency lever.',
    },
    {
      claim: 'Fairness and customer harm of fraud and crime decisions',
      authoritativeSource:
        'The fraud, case, and complaints systems, analysing declines, ' +
        'freezes, and customer exits for disparate impact and recording ' +
        'customer-harm and recourse outcomes.',
      whatGoodEvidenceLooksLike:
        'A disparate-impact analysis of declines, freezes, and exits ' +
        'across customer groups, with a measured false-positive ' +
        'customer-harm rate and a functioning recourse channel.',
      weakEvidenceToReject:
        'A programme that reports only fraud caught and cost saved with ' +
        'no disparate-impact, customer-harm, or recourse measurement.',
    },
    {
      claim: 'The forecast value of a fraud and financial-crime AI Move',
      authoritativeSource:
        'The value model — loss-avoided, operational-efficiency, and ' +
        'customer-experience components, each haircut by its dominant ' +
        'factors — read against the institution’s data readiness and ' +
        'the supervisory acceptance of any monitoring or screening ' +
        'change.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, loss-avoided, efficiency, and ' +
        'customer-experience gains kept distinct, the regulatory-' +
        'integrity and fairness constraint stated, and every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at ' +
        'face value, or a forecast that ignores the data-quality, ' +
        'regulatory-acceptance, and fairness haircuts or omits the ' +
        'integrity constraint.',
    },
  ],
};
