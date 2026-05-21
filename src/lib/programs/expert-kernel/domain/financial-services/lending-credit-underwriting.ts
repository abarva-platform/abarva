// Domain Function Pack — Financial services · Lending, credit & underwriting.
//
// Function key: `lending_credit_underwriting`.
//
// This pack covers the consumer lending engine — the origination, credit
// decisioning, underwriting, and servicing of consumer, mortgage, and auto
// loans. It is the asset side of a bank's balance sheet that the deposit
// franchise funds: the function that converts a funding base into
// interest-earning, credit-risked assets.
//
// The operating reality the pack encodes: a loan book is a portfolio of bets
// on repayment, and the function is judged not on how many loans it books but
// on whether it priced and selected risk correctly. Value leaks at every step
// — an application abandoned in a slow funnel, a decision that approves a loan
// that will default or declines one that would have paid, an underwriting
// exception worked too slowly to win the customer, a delinquency caught too
// late to cure. The AI archetypes are the recurring bets against exactly that
// reality — AI credit decisioning and risk scoring, automated underwriting and
// document intelligence, fraud and identity verification at origination,
// pricing and offer optimisation, and early-warning delinquency prediction.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const lendingCreditUnderwritingPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'lending_credit_underwriting',
  functionLabel: 'Lending, credit & underwriting',
  summary:
    'Lending, credit and underwriting is the function that originates, ' +
    'decisions, underwrites, prices, and services consumer credit — ' +
    'unsecured personal loans and cards, mortgages, and auto finance. It ' +
    'spans the application funnel, the credit decision and risk score, the ' +
    'underwriting of income, collateral, and capacity to repay, the pricing ' +
    'of the loan to its risk, and the servicing of the book to maturity. ' +
    'Its economics are the risk-adjusted yield of the portfolio — the ' +
    'interest and fees earned, less the credit losses taken and the cost to ' +
    'originate and service — and the speed and experience of the funnel ' +
    'that wins the borrower. A lender wins not by booking the most loans ' +
    'but by selecting and pricing risk correctly: approving the borrowers ' +
    'who will repay, declining the ones who will not, pricing each to its ' +
    'true risk, and detecting trouble early — so the function is judged on ' +
    'risk-adjusted return and loss performance, not on origination volume.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'approval_rate',
      name: 'Credit-approval rate',
      definition:
        'The share of submitted, complete loan applications that receive ' +
        'a credit approval — by automated decision or underwriter — rather ' +
        'than being declined.',
      unit: '% of complete applications approved',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 35,
        high: 80,
        basis:
          'Approval rate varies sharply by product, channel, and credit-' +
          'box appetite; too low forfeits good borrowers, too high admits ' +
          'loss. A planning range; the risk appetite sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination system (LOS) decision log, classified by ' +
        'product and channel.',
      whyItMatters:
        'It is the headline read on the credit box; the approval rate ' +
        'must be judged against loss performance, because a rate that ' +
        'looks healthy can be approving loans that will default.',
    },
    {
      key: 'net_charge_off_rate',
      name: 'Net charge-off rate',
      definition:
        'Loans charged off as uncollectible over a period, net of ' +
        'recoveries, annualised as a percentage of average loan balances ' +
        'outstanding.',
      unit: '% (annualised) of average loan balances',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.3,
        high: 6.0,
        basis:
          'Charge-off rates vary enormously by product — secured mortgage ' +
          'sits low, unsecured consumer and near-prime card sit high — and ' +
          'rise through a credit downturn. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system and general-ledger charge-off and ' +
        'recovery accounts, reconciled to average-balance reporting.',
      whyItMatters:
        'It is the realised cost of the credit risk the function took on; ' +
        'charge-offs are the largest swing factor in lending profitability ' +
        'and the proof of whether risk selection was sound.',
    },
    {
      key: 'delinquency_rate',
      name: 'Delinquency rate (30+ days past due)',
      definition:
        'The share of loan balances 30 or more days past due — the ' +
        'leading indicator of credit deterioration ahead of charge-off.',
      unit: '% of loan balances 30+ days past due',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 8.0,
        basis:
          'Delinquency varies by product and the credit cycle; it leads ' +
          'charge-offs by one to several quarters. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system delinquency-bucket reporting against ' +
        'outstanding balances.',
      whyItMatters:
        'Delinquency is the early-warning read on the book — it moves ' +
        'before charge-offs, so it is the metric that tells the function ' +
        'whether credit quality is turning while there is still time to ' +
        'act.',
    },
    {
      key: 'risk_adjusted_yield',
      name: 'Risk-adjusted yield',
      definition:
        'The interest and fee yield on the loan portfolio less the ' +
        'annualised credit-loss rate — the spread the book earns after ' +
        'paying for the risk it carries.',
      unit: '% (annualised) of average loan balances',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2.0,
        high: 9.0,
        basis:
          'Risk-adjusted yield varies by product and risk tier; a ' +
          'higher-rate book carries higher losses, so the net spread is ' +
          'the honest comparison. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system and general ledger, combining yield ' +
        'and fee income with charge-off data.',
      whyItMatters:
        'It is the truest measure of lending performance — it strips out ' +
        'the illusion that a high-rate book is profitable by netting the ' +
        'losses that high rate carries against it.',
    },
    {
      key: 'auto_decision_rate',
      name: 'Automated-decision (straight-through) rate',
      definition:
        'The share of applications decisioned automatically by the credit ' +
        'engine — approved or declined without a manual underwriting ' +
        'touch — rather than referred to an underwriter.',
      unit: '% of applications decisioned straight-through',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 90,
        basis:
          'Straight-through rates depend on data availability and the ' +
          'credit policy; thin-file, complex, and high-value loans ' +
          'rightly refer. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination system decision log, classified by decision ' +
        'path.',
      whyItMatters:
        'It is the core efficiency lever of the funnel — every referral ' +
        'is underwriter cost and time; a higher straight-through rate ' +
        'cuts cost to originate and speeds the decision the borrower ' +
        'waits on.',
    },
    {
      key: 'time_to_decision',
      name: 'Time to credit decision',
      definition:
        'The elapsed time from a complete application being submitted to ' +
        'a credit decision being communicated to the applicant.',
      unit: 'hours from complete application to decision',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.1,
        high: 72,
        basis:
          'Time to decision spans near-instant straight-through unsecured ' +
          'decisions to multi-day underwritten mortgage decisions. A ' +
          'planning range; product complexity sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination system, time-stamped from complete ' +
        'application to decision communication.',
      whyItMatters:
        'Decision speed is a primary driver of pull-through and ' +
        'competitiveness — a borrower waiting on a slow decision is a ' +
        'borrower a faster lender can take.',
    },
    {
      key: 'pull_through_rate',
      name: 'Application pull-through rate',
      definition:
        'The share of submitted applications that complete the funnel to ' +
        'a funded, booked loan — capturing abandonment, decline, and ' +
        'approved-not-taken fallout.',
      unit: '% of submitted applications funded',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 25,
        high: 70,
        basis:
          'Pull-through depends on funnel friction, decision speed, ' +
          'pricing competitiveness, and the credit box; the band spans a ' +
          'leaky funnel to a tight one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination system funnel analytics from application ' +
        'to funding.',
      whyItMatters:
        'It is the read on funnel health — every approved-not-taken or ' +
        'abandoned application is acquisition spend wasted and a borrower ' +
        'lost, often to a faster or better-priced competitor.',
    },
    {
      key: 'cost_to_originate',
      name: 'Cost to originate',
      definition:
        'The fully loaded cost of originating a loan — application ' +
        'processing, underwriting, verification, fraud checks, and ' +
        'closing — per funded loan.',
      unit: 'USD fully loaded cost per funded loan',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 150,
        high: 9000,
        basis:
          'Cost to originate spans a low-touch automated unsecured loan ' +
          'to a heavily underwritten and processed mortgage. A planning ' +
          'range; product complexity sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'Origination-operations cost allocations reconciled against ' +
        'funded-loan counts in management reporting.',
      whyItMatters:
        'It is the efficiency ratio of origination; manual underwriting, ' +
        'document chasing, and rework drive cost to originate up, so it ' +
        'is the metric decisioning and document automation directly ' +
        'attack.',
    },
    {
      key: 'underwriting_override_rate',
      name: 'Underwriting override and exception rate',
      definition:
        'The share of decisions in which an underwriter overrides the ' +
        'model recommendation or grants a policy exception — read as a ' +
        'signal of policy fit and decision discipline.',
      unit: '% of decisions overridden or granted an exception',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Some override is healthy — it catches what the model misses — ' +
          'but a high rate signals a credit policy or model out of step ' +
          'with reality. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-origination system decision log comparing the model ' +
        'recommendation against the final underwriter decision.',
      whyItMatters:
        'Override rate is the read on whether the credit policy and the ' +
        'model are trusted and well-calibrated; a runaway override rate ' +
        'erodes both consistency and the fair-lending defensibility of ' +
        'decisions.',
    },
    {
      key: 'first_payment_default_rate',
      name: 'First-payment-default rate',
      definition:
        'The share of newly originated loans that miss the first ' +
        'scheduled payment or default within the first few payments — a ' +
        'sharp signal of an origination, fraud, or underwriting failure.',
      unit: '% of originations defaulting within the first payments',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.2,
        high: 3.0,
        basis:
          'First-payment default varies by product and credit tier; an ' +
          'elevated rate points to fraud or a decisioning error rather ' +
          'than ordinary credit risk. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system early-performance reporting on ' +
        'recently originated vintages.',
      whyItMatters:
        'A loan that defaults almost immediately was almost never a real ' +
        'credit decision — it is usually fraud or a verification failure, ' +
        'so first-payment default is the cleanest read on origination ' +
        'integrity.',
    },
    {
      key: 'origination_fraud_loss_rate',
      name: 'Origination fraud-loss rate',
      definition:
        'Losses attributable to application fraud — identity fraud, ' +
        'synthetic identity, income or asset misrepresentation — as a ' +
        'share of origination volume.',
      unit: 'bps of origination volume lost to application fraud',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 40,
        basis:
          'Origination fraud loss varies by product, channel, and ' +
          'verification rigor; synthetic-identity fraud has driven the ' +
          'upper end higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The fraud-management system and loss reporting, classified by ' +
        'fraud type at origination.',
      whyItMatters:
        'Application fraud is a fast-growing, concentrated loss source ' +
        'that bypasses credit underwriting entirely; tracking it ' +
        'separately keeps it from being mis-read as ordinary credit loss.',
    },
    {
      key: 'portfolio_yield',
      name: 'Portfolio gross yield',
      definition:
        'The gross interest and fee income earned on the loan portfolio, ' +
        'annualised, as a percentage of average loan balances ' +
        'outstanding — before credit losses.',
      unit: '% (annualised) of average loan balances',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 4.0,
        high: 18.0,
        basis:
          'Portfolio gross yield varies sharply by product and risk tier; ' +
          'it must always be read net of the losses a higher yield ' +
          'carries. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loan-servicing system and general-ledger interest- and ' +
        'fee-income accounts against average loan balances.',
      whyItMatters:
        'Gross yield is the revenue side of the lending spread; pricing ' +
        'optimisation moves it directly, but it is only value when the ' +
        'risk-adjusted yield rises with it.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'thin_credit_signal',
      name: 'Thin and stale credit signal',
      description:
        'Credit decisions rest narrowly on a bureau score and a ' +
        'debt-to-income ratio, with no use of cash-flow, transaction, or ' +
        'alternative data. Thin-file and credit-invisible borrowers are ' +
        'declined wholesale, and decisions miss real repayment capacity ' +
        'the bureau cannot see.',
      detectionSignal:
        'The decision model uses few features beyond the bureau score; ' +
        'thin-file decline rates are high and no cash-flow or alternative ' +
        'data feeds the decision.',
      diagnosticQuestion:
        'What data drives the credit decision beyond the bureau score, ' +
        'and how are thin-file and credit-invisible applicants assessed?',
    },
    {
      key: 'manual_underwriting_drag',
      name: 'Manual underwriting drag',
      description:
        'Too many applications refer to a human underwriter for routine ' +
        'judgement, and underwriters spend their time re-keying data, ' +
        'chasing documents, and re-deriving ratios rather than on the ' +
        'genuinely complex cases — so the funnel is slow and cost to ' +
        'originate is high.',
      detectionSignal:
        'The straight-through rate is low, underwriter queues are long, ' +
        'and underwriter time is dominated by data assembly rather than ' +
        'credit judgement.',
      diagnosticQuestion:
        'What share of applications could be decisioned straight-through, ' +
        'and how much underwriter time goes to data assembly versus ' +
        'genuine credit judgement?',
    },
    {
      key: 'mispriced_risk',
      name: 'Mispriced risk',
      description:
        'Loans are priced from coarse rate tiers that do not track the ' +
        'true risk of the borrower. The lender wins adverse selection — ' +
        'underpricing the riskier borrowers in a tier and overpricing the ' +
        'safer ones, who take their business to a sharper-priced ' +
        'competitor.',
      detectionSignal:
        'Pricing tiers are broad; loss rates vary widely within a price ' +
        'tier; the better-credit borrowers in each tier show elevated ' +
        'approved-not-taken fallout.',
      diagnosticQuestion:
        'How finely does loan pricing track measured risk, and is loss ' +
        'performance consistent within each price tier or scattered ' +
        'across it?',
    },
    {
      key: 'late_delinquency_detection',
      name: 'Late delinquency detection',
      description:
        'Borrower distress is detected only when a payment is already ' +
        'missed, by which point the cure window has narrowed and the ' +
        'cheapest, most effective interventions are no longer available — ' +
        'so delinquency rolls forward to charge-off.',
      detectionSignal:
        'Collections engages only after a missed payment; there is no ' +
        'pre-delinquency early-warning score and roll-rates from ' +
        'delinquency to charge-off are high.',
      diagnosticQuestion:
        'Does the lender detect emerging borrower distress before a ' +
        'payment is missed, or only react once the loan is already ' +
        'delinquent?',
    },
    {
      key: 'origination_fraud_exposure',
      name: 'Origination and identity-fraud exposure',
      description:
        'Application fraud — stolen and synthetic identities, ' +
        'manipulated income and asset documents — slips through ' +
        'origination because identity and document verification is weak ' +
        'or inconsistent, surfacing later as first-payment default ' +
        'mis-read as credit loss.',
      detectionSignal:
        'First-payment default is elevated, origination fraud loss is ' +
        'material, and identity and document verification is manual or ' +
        'inconsistent across channels.',
      diagnosticQuestion:
        'How robust is identity and document verification at ' +
        'origination, and how much of what is booked as credit loss is ' +
        'actually undetected application fraud?',
    },
    {
      key: 'fair_lending_opacity',
      name: 'Fair-lending opacity in decisioning',
      description:
        'The credit decision rests on a model whose drivers cannot be ' +
        'cleanly explained, adverse-action reasons are generic, and the ' +
        'model has not been tested for disparate impact — so the lender ' +
        'cannot prove its decisions are fair or defend them to a ' +
        'regulator.',
      detectionSignal:
        'Adverse-action notices cite generic reasons; there is no ' +
        'documented disparate-impact testing or model-explainability ' +
        'evidence for the decision model.',
      diagnosticQuestion:
        'Can every credit decision be explained to the reason-code level ' +
        'and shown free of disparate impact, or is the model a ' +
        'fair-lending exposure?',
    },
    {
      key: 'fragmented_funnel',
      name: 'Fragmented origination funnel',
      description:
        'Application intake, credit decisioning, verification, fraud ' +
        'checks, and closing run on disconnected systems with manual ' +
        'handoffs. Data is re-keyed at each step, applications stall ' +
        'between systems, and no one owns the end-to-end funnel.',
      detectionSignal:
        'Origination steps run on separate tools with manual handoffs; ' +
        'time to decision is dominated by between-step waiting and ' +
        'pull-through leaks at the handoffs.',
      diagnosticQuestion:
        'Is the origination funnel an integrated flow with one owner, or ' +
        'a chain of disconnected systems with manual handoffs and ' +
        're-keying?',
    },
    {
      key: 'static_credit_policy',
      name: 'Static credit policy blind to vintage performance',
      description:
        'The credit policy and the decision model are set and left ' +
        'alone, not tuned against how recent origination vintages are ' +
        'actually performing. The credit box drifts out of step with the ' +
        'economy and with observed loss, and the lag is only seen in ' +
        'charge-offs quarters later.',
      detectionSignal:
        'Credit policy changes are infrequent and not tied to vintage ' +
        'loss-curve monitoring; model performance is not tracked against ' +
        'recent originations.',
      diagnosticQuestion:
        'How quickly is the credit policy tuned against the loss ' +
        'performance of recent vintages, or does it lag the cycle until ' +
        'charge-offs reveal the drift?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_credit_decisioning',
      name: 'AI credit decisioning and risk scoring',
      valueMechanism:
        'A model scores applicant credit risk using bureau, cash-flow, ' +
        'transaction, and alternative data — ranking risk more accurately ' +
        'than a bureau score alone — so more genuinely creditworthy ' +
        'borrowers, including thin-file ones, are approved and more ' +
        'future defaulters are declined. Value comes from a sharper ' +
        'risk-rank order that lifts approvals without lifting losses, ' +
        'improving the risk-adjusted yield of the book.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Credit-bureau and credit-history data',
        'Cash-flow, transaction, and where consented alternative data',
        'Historical loan-performance and charge-off outcomes by vintage',
        'Application and verified income and obligation data',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model scores and recommends; credit policy and an ' +
          'underwriter own the decision, and every model and policy change ' +
          'goes through model-risk-management governance.',
        'The model must be explainable to the reason-code level and ' +
          'tested for disparate impact — fair-lending and ECOA adverse-' +
          'action requirements are non-negotiable.',
        'Performance must be monitored against vintage loss curves and ' +
          'revalidated as the economy and applicant mix shift.',
      ],
      metricsMoved: [
        'approval_rate',
        'net_charge_off_rate',
        'risk_adjusted_yield',
        'underwriting_override_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'automated_underwriting_document',
      name: 'Automated underwriting and document intelligence',
      valueMechanism:
        'An agent extracts and validates the data underwriting needs — ' +
        'income from paystubs and tax forms, assets from statements, ' +
        'collateral from appraisals — verifies it against policy, and ' +
        'decisions the straightforward cases end-to-end while assembling ' +
        'a clean file for underwriters on the complex ones. Value comes ' +
        'from lifting the straight-through rate, cutting cost to ' +
        'originate, and collapsing time to decision.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Application documents — paystubs, tax forms, bank and asset ' +
          'statements, appraisals',
        'Income, asset, and employment verification services',
        'Credit policy and underwriting-guideline rules',
        'The loan-origination system and document repository',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent extracts, validates, and decisions within a measured ' +
          'confidence band; complex, high-value, and exception cases route ' +
          'to an underwriter who owns the decision.',
        'Extracted data must be verified against authoritative sources — ' +
          'an unverified income figure is a credit and fraud exposure.',
        'Extraction-model accuracy and confidence thresholds must be ' +
          'monitored, with a sample of automated decisions audited.',
      ],
      metricsMoved: [
        'auto_decision_rate',
        'time_to_decision',
        'cost_to_originate',
        'underwriting_override_rate',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
    {
      key: 'origination_fraud_identity',
      name: 'Origination fraud and identity verification',
      valueMechanism:
        'A model verifies applicant identity and screens applications ' +
        'for fraud signals — stolen and synthetic identities, ' +
        'manipulated documents, suspicious application patterns — at the ' +
        'point of origination, so fraudulent applications are stopped ' +
        'before funding. Value comes from cutting origination fraud loss ' +
        'and the first-payment defaults that fraud drives, without ' +
        'adding friction for genuine borrowers.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Identity-verification and device- and behavioural-signal data',
        'Document-authenticity and tamper-detection signals',
        'Consortium and historical application-fraud data',
        'Synthetic-identity and watchlist screening data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags fraud risk; a fraud analyst reviews and owns the ' +
          'decline-for-fraud decision — a fraud flag is not an automatic ' +
          'credit decline.',
        'Fraud models must be monitored for differential false-positive ' +
          'rates across demographic groups — a fair-access risk.',
        'A fraud decline must be kept distinct from a credit decline so ' +
          'adverse-action reasoning and reporting stay accurate.',
      ],
      metricsMoved: [
        'origination_fraud_loss_rate',
        'first_payment_default_rate',
        'net_charge_off_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'risk_based_pricing_optimization',
      name: 'Risk-based pricing and offer optimisation',
      valueMechanism:
        'A model prices each approved loan to its measured risk and the ' +
        'borrower’s rate-elasticity — pricing finely rather than in ' +
        'coarse tiers — and shapes the offer (rate, term, amount) to win ' +
        'the borrower at an adequate margin. Value comes from ending the ' +
        'adverse selection of broad tiers: capturing safer borrowers who ' +
        'would otherwise be overpriced and pricing riskier ones to their ' +
        'true cost, lifting risk-adjusted yield and pull-through.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Applicant risk score and expected-loss estimate',
        'Rate-elasticity and offer-acceptance history by segment',
        'Competitor pricing intelligence by product',
        'Funding-cost and target-margin data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends price and offer; pricing and credit ' +
          'leadership approve the pricing framework and own the margin ' +
          'and risk-appetite trade-off.',
        'Risk-based pricing must be tested for disparate impact and ' +
          'comply with fair-lending and pricing-fairness rules — risk ' +
          'proxies must not stand in for protected characteristics.',
        'Elasticity and acceptance behaviour drift with rates and ' +
          'competition; the pricing model must be revalidated.',
      ],
      metricsMoved: [
        'risk_adjusted_yield',
        'portfolio_yield',
        'pull_through_rate',
        'approval_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'early_warning_delinquency',
      name: 'Early-warning delinquency prediction',
      valueMechanism:
        'A model scores the performing book for emerging distress — ' +
        'reading cash-flow deterioration, balance and payment-behaviour ' +
        'change, and bureau signals — so a borrower heading toward ' +
        'delinquency is identified before a payment is missed and offered ' +
        'a cure while the cheapest interventions still work. Value comes ' +
        'from cutting roll-rates from delinquency to charge-off and ' +
        'lowering the net charge-off rate.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Loan-payment, balance, and account-behaviour history',
        'Cash-flow and transaction signals where the borrower banks ' +
          'with the lender',
        'Refreshed bureau and credit-trend data',
        'Historical delinquency and cure outcomes',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags emerging distress and likely cause; a servicing ' +
          'or collections specialist owns the borrower outreach and the ' +
          'cure or hardship arrangement.',
        'Outreach must comply with collections, FDCPA-aligned conduct, ' +
          'and fair-treatment rules — early contact must help the ' +
          'borrower, not pressure them.',
        'The model must be revalidated as the credit cycle turns — ' +
          'distress patterns shift with the economy.',
      ],
      metricsMoved: [
        'delinquency_rate',
        'net_charge_off_rate',
        'risk_adjusted_yield',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'application_funnel_assistant',
      name: 'Intelligent application-funnel assistant',
      valueMechanism:
        'A conversational agent guides applicants through the origination ' +
        'funnel — explaining requirements, prompting for missing ' +
        'documents, answering status questions, and surfacing the ' +
        'right product — so fewer applications stall or abandon and the ' +
        'funnel runs as one flow rather than a chain of handoffs. Value ' +
        'comes from lifting pull-through and cutting the abandonment that ' +
        'wastes acquisition spend.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Application status and outstanding-requirement data from the ' +
          'loan-origination system',
        'Product-eligibility and requirement content',
        'Funnel and abandonment analytics',
        'Applicant interaction and contact-preference data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent guides and informs; it does not make or communicate ' +
          'the credit decision — a loan officer or the decision engine ' +
          'owns that.',
        'Guidance must be accurate to credit policy and disclosure ' +
          'rules, and must not stray into steering or misrepresenting ' +
          'terms.',
        'Any product recommendation must respect suitability and fair-' +
          'lending rules — no funnel nudging that disadvantages a ' +
          'protected group.',
      ],
      metricsMoved: [
        'pull_through_rate',
        'time_to_decision',
        'cost_to_originate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'governed_decisioning_layer',
      name: 'Governed credit-decisioning layer',
      description:
        'A pattern that places an explainable risk-scoring model inside ' +
        'the credit policy and the loan-origination system — scoring ' +
        'applicants on bureau, cash-flow, and alternative data, ' +
        'recommending a decision, and producing reason-code-level ' +
        'explanation — all under model-risk-management governance and ' +
        'documented disparate-impact testing.',
      boundary:
        'It scores and recommends within the approved credit policy; ' +
        'credit policy and an underwriter own the decision, and model-' +
        'risk governance owns model approval. It does not change the ' +
        'credit box autonomously.',
      humanAccountabilityPoint:
        'The Chief Credit Officer accountable for credit policy, the ' +
        'decision model, and loss performance.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'confidence_tiered_underwriting',
      name: 'Confidence-tiered automated-underwriting pattern',
      description:
        'A pattern that routes applications by model confidence and ' +
        'complexity — straight-through automated underwriting for ' +
        'clear-cut cases, underwriter-assisted underwriting with a ' +
        'machine-assembled clean file for the complex ones — with ' +
        'measured confidence thresholds and an audited sample of the ' +
        'automated tier.',
      boundary:
        'It decisions within a measured confidence band and assists ' +
        'outside it; an underwriter owns complex, high-value, and ' +
        'exception decisions and the audit of the automated tier.',
      humanAccountabilityPoint:
        'The head of underwriting accountable for the straight-through ' +
        'rate, decision quality, and the audit posture.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'document_intelligence',
    },
    {
      key: 'origination_fraud_gate',
      name: 'Origination fraud-and-identity gate',
      description:
        'A pattern that screens every application for identity and ' +
        'application fraud at intake — identity verification, document ' +
        'authenticity, synthetic-identity and consortium signals — ' +
        'clearing the genuine applicants with low friction and routing ' +
        'flagged ones to a fraud analyst, keeping fraud declines distinct ' +
        'from credit declines.',
      boundary:
        'It screens and flags fraud risk; a fraud analyst owns the ' +
        'decline-for-fraud decision. It does not make the credit decision ' +
        'and does not conflate a fraud flag with a credit decline.',
      humanAccountabilityPoint:
        'The head of fraud risk accountable for origination fraud loss ' +
        'and the integrity of identity verification.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'risk_based_pricing_engine',
      name: 'Risk-based pricing-and-offer engine',
      description:
        'A pattern that prices each approved loan to its expected loss ' +
        'and the borrower’s rate-elasticity and shapes the offer to win ' +
        'the borrower at an adequate margin — replacing coarse rate tiers ' +
        'with fine, risk-tracked pricing inside a fair-lending-tested ' +
        'framework.',
      boundary:
        'It recommends price and offer within an approved, fair-lending-' +
        'tested pricing framework; pricing and credit leadership own the ' +
        'framework and the margin and risk-appetite trade-off.',
      humanAccountabilityPoint:
        'The head of consumer-lending pricing accountable for risk-' +
        'adjusted yield and pricing fairness.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'portfolio_early_warning_layer',
      name: 'Portfolio early-warning-and-cure layer',
      description:
        'A pattern that continuously scores the performing book for ' +
        'emerging distress and serves a pre-delinquency early-warning ' +
        'signal to servicing and collections, so borrowers heading toward ' +
        'trouble are reached with a cure or hardship arrangement before a ' +
        'payment is missed and before the cure window narrows.',
      boundary:
        'It scores distress and serves the signal; servicing and ' +
        'collections specialists own the borrower outreach and the cure ' +
        'or hardship arrangement, within fair-treatment rules. It is a ' +
        'read model, not an action engine.',
      humanAccountabilityPoint:
        'The head of loan servicing / portfolio management accountable ' +
        'for delinquency, roll-rates, and charge-offs.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Lending value is realised in four distinct ways and a forecast ' +
      'must keep them separate. First, sharper risk selection: a better ' +
      'risk-rank order approves more genuine payers and declines more ' +
      'future defaulters, lifting approvals and lowering charge-offs at ' +
      'once — this lands in the risk-adjusted yield and is recurring, ' +
      'though it only proves out as vintages season. Second, lower cost ' +
      'to originate: automated underwriting and document intelligence ' +
      'remove manual touches and rework — recurring once the funnel is ' +
      'reshaped. Third, captured volume: a faster, lower-friction funnel ' +
      'and finer pricing lift pull-through and win borrowers a slow or ' +
      'blunt competitor would lose — recurring, but bounded by demand. ' +
      'Fourth, avoided loss: stopping origination fraud and catching ' +
      'delinquency early cuts losses that would otherwise be taken. The ' +
      'dominant constraint is that lending value is governed by the ' +
      'credit cycle the lender does not control — a downturn lifts losses ' +
      'across the whole book and can swamp a modelled selection gain — so ' +
      'a forecast must be read against a credit-cycle scenario, and the ' +
      'lag before charge-offs reveal whether the gain was real must be ' +
      'stated honestly.',
    dominantHaircutFactors: [
      {
        factor: 'Credit cycle and macroeconomic environment',
        rationale:
          'Charge-offs, delinquency, and demand are driven by ' +
          'unemployment, rates, and the credit cycle — none of which the ' +
          'lender controls. A downturn lifts losses across the book and ' +
          'caps how much of a modelled risk-selection or yield gain is ' +
          'actually reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'Value erosion from a turning credit cycle and ' +
            'macroeconomic stress outside the lender’s control; a ' +
            'planning range widening into a downturn.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and bureau / alternative-data coverage',
        rationale:
          'Decisioning, pricing, and early-warning models are only as ' +
          'good as the bureau, cash-flow, and verified-income data behind ' +
          'them. Thin alternative-data coverage and weak verification cap ' +
          'how much of the modelled selection and loss-avoidance gain can ' +
          'be delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from incomplete data coverage and weak ' +
            'verification; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Model-risk governance and validation lag',
        rationale:
          'A new decision or pricing model only delivers value once it ' +
          'has cleared model-risk-management governance and been ' +
          'validated, and its gain is only confirmed as vintages season. ' +
          'Governance lag and validation uncertainty haircut the modelled ' +
          'and as-yet-unconfirmed upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from model-risk governance lag and ' +
            'unconfirmed vintage performance; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Fair-lending and regulatory ceiling',
        rationale:
          'Credit decisioning and risk-based pricing are bounded by ' +
          'fair-lending, ECOA, and disparate-impact rules and by ' +
          'adverse-action and explainability requirements. A model gain ' +
          'that cannot be made explainable and free of disparate impact ' +
          'is not reachable value — the compliant ceiling haircuts the ' +
          'modelled upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled decisioning or pricing gain that ' +
            'is not fairly or compliantly reachable; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Net-charge-off-rate reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in the net charge-off rate from sharper ' +
            'risk selection, fraud prevention, and early delinquency ' +
            'detection; a planning range spanning early and mature ' +
            'adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the annualised net charge-off ' +
          'rate.',
      },
      {
        lever: 'Cost-to-originate reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in cost to originate from automated ' +
            'underwriting and document intelligence; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fully loaded cost per funded ' +
          'loan.',
      },
      {
        lever: 'Pull-through uplift',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative uplift in application pull-through from a faster, ' +
            'lower-friction funnel and finer pricing; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in the application pull-through ' +
          'rate.',
      },
      {
        lever: 'Risk-adjusted-yield uplift',
        range: {
          low: 10,
          high: 50,
          basis:
            'Basis-point uplift in risk-adjusted yield from sharper risk ' +
            'selection and risk-based pricing; a planning range, read ' +
            'against the credit cycle.',
          label: 'planning-range',
        },
        measuredAs:
          'Basis-point change in risk-adjusted yield as a share of ' +
          'average loan balances.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal (straight-' +
      'through rate, time to decision, pull-through, fraud catch); 12–24 ' +
      'months to a settled credit result, because the risk-selection and ' +
      'loss gains only prove out once originated vintages have seasoned ' +
      'through enough of their loss curve.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Loan-origination system (LOS)',
        role:
          'The system of record for the origination funnel — application ' +
          'intake, the decision log, underwriting workflow, conditions, ' +
          'and closing across consumer, mortgage, and auto products.',
        examples: [
          'nCino',
          'ICE Mortgage Technology (Encompass)',
          'Blend',
          'core-vendor and in-house origination platforms',
        ],
      },
      {
        name: 'Credit-decision engine / decision platform',
        role:
          'Executes the credit policy and risk models — scoring ' +
          'applicants, applying decision rules, and returning an approve, ' +
          'decline, or refer decision with reason codes.',
        examples: [
          'FICO decision platforms',
          'Provenir',
          'Zest AI / GDS Link',
          'in-house credit-decision engines',
        ],
      },
      {
        name: 'Credit bureau and data services',
        role:
          'Supplies credit-history, score, income- and asset-' +
          'verification, and alternative-data inputs the credit decision ' +
          'and pricing depend on.',
        examples: [
          'Equifax',
          'Experian',
          'TransUnion',
          'income- and cash-flow-verification data providers',
        ],
      },
      {
        name: 'Loan-servicing system',
        role:
          'The system of record for the booked loan — payments, ' +
          'balances, delinquency buckets, charge-offs, and recoveries ' +
          'through the life of the loan.',
        examples: [
          'FIS and Fiserv loan servicing',
          'Black Knight (MSP) mortgage servicing',
          'Sagent',
          'core-vendor servicing platforms',
        ],
      },
      {
        name: 'Fraud-management and identity-verification platform',
        role:
          'Screens applications for identity and application fraud — ' +
          'identity verification, device and behavioural signals, ' +
          'document authenticity, and synthetic-identity detection.',
        examples: [
          'LexisNexis Risk Solutions',
          'Socure',
          'SentiLink',
          'consortium fraud-data and identity-verification services',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Credit Officer',
        accountability:
          'Owns the credit policy, the credit box, the decision model, ' +
          'and the loss performance of the loan portfolio.',
      },
      {
        title: 'Head of Consumer / Mortgage / Auto Lending',
        accountability:
          'Owns the lending P&L for the product line — origination ' +
          'volume, yield, and the risk-adjusted return of the book.',
      },
      {
        title: 'Head of Underwriting',
        accountability:
          'Owns the underwriting operation — the straight-through rate, ' +
          'decision quality, turnaround time, and exception governance.',
      },
      {
        title: 'Head of Credit Risk / Portfolio Management',
        accountability:
          'Owns portfolio monitoring, delinquency and loss management, ' +
          'vintage performance, and the loan-loss reserve.',
      },
      {
        title: 'Model Risk Management lead',
        accountability:
          'Owns the independent validation and governance of credit, ' +
          'pricing, and fraud models under SR 11-7-aligned model-risk ' +
          'standards.',
      },
      {
        title: 'Fair-Lending and Lending Compliance officer',
        accountability:
          'Owns fair-lending testing, ECOA and adverse-action ' +
          'compliance, and the regulatory defensibility of credit ' +
          'decisions.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Equal Credit Opportunity Act (ECOA) / Regulation B',
        relevance:
          'Prohibits discrimination in credit decisions and mandates ' +
          'specific adverse-action notice and reason requirements — the ' +
          'frame any credit-decisioning or pricing model must satisfy.',
      },
      {
        name: 'Fair-lending supervision and disparate-impact doctrine',
        relevance:
          'Regulatory fair-lending examination tests credit decisions ' +
          'and pricing for disparate treatment and disparate impact — the ' +
          'ceiling on any risk model that cannot be shown fair.',
      },
      {
        name: 'Fair Credit Reporting Act (FCRA)',
        relevance:
          'Governs the use of credit-bureau and consumer-report data in ' +
          'credit decisions, including permissible purpose and adverse-' +
          'action and accuracy obligations.',
      },
      {
        name: 'SR 11-7 model-risk-management guidance',
        relevance:
          'Sets the supervisory expectation for the development, ' +
          'independent validation, and ongoing governance of credit, ' +
          'pricing, and fraud models — the frame model deployment runs ' +
          'under.',
      },
      {
        name: 'TILA / Regulation Z and mortgage-lending rules',
        relevance:
          'Truth-in-Lending disclosure, the ability-to-repay and ' +
          'qualified-mortgage rules, and TRID govern loan terms, ' +
          'disclosure, and underwriting standards for consumer and ' +
          'mortgage credit.',
      },
      {
        name: 'CFPB supervision, UDAAP, and FDCPA-aligned servicing ' +
          'conduct',
        relevance:
          'Consumer-protection supervision, unfair-deceptive-abusive ' +
          'standards, and fair debt-collection conduct rules govern ' +
          'origination, servicing, and any early-warning or collections ' +
          'outreach.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Net charge-off rate',
        definition:
          'Loans charged off as uncollectible net of recoveries, ' +
          'annualised as a percentage of average loan balances — the ' +
          'realised cost of credit risk.',
      },
      {
        term: 'Delinquency / days past due',
        definition:
          'The state of a loan whose scheduled payment is overdue, ' +
          'bucketed by how many days past due — the leading indicator of ' +
          'credit deterioration.',
      },
      {
        term: 'Risk-adjusted yield',
        definition:
          'The interest and fee yield on a loan portfolio less its ' +
          'credit-loss rate — the spread earned after paying for risk.',
      },
      {
        term: 'Straight-through processing',
        definition:
          'An application decisioned end-to-end by the credit engine ' +
          'without a manual underwriting touch.',
      },
      {
        term: 'Adverse-action notice',
        definition:
          'The ECOA-required notice to a declined applicant stating the ' +
          'principal reasons for the credit denial.',
      },
      {
        term: 'Loan vintage',
        definition:
          'The cohort of loans originated in a given period, tracked ' +
          'together so loss performance can be compared across origination ' +
          'periods.',
      },
      {
        term: 'First-payment default',
        definition:
          'A newly originated loan that defaults on its first or earliest ' +
          'payments — typically a fraud or origination failure rather ' +
          'than ordinary credit risk.',
      },
      {
        term: 'Synthetic identity fraud',
        definition:
          'Application fraud using a fabricated identity assembled from ' +
          'real and invented data elements to obtain credit.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Lending, Credit & Underwriting Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the lending engine is leaking value — in risk ' +
        'selection and loss, in funnel speed and cost, in fraud, or in ' +
        'late delinquency detection — with baseline evidence, before a ' +
        'solution is shaped.',
      sections: [
        {
          heading: 'Lending operation and portfolio context',
          guidance:
            'Name the lending operation in scope — the products ' +
            '(consumer, mortgage, auto), the portfolio size and risk-tier ' +
            'mix, the origination channels — and state which loan-' +
            'origination, decision-engine, bureau, servicing, and fraud ' +
            'systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — approval rate, net charge-off rate, ' +
            'delinquency, risk-adjusted yield, straight-through rate, ' +
            'time to decision, pull-through, cost to originate, override ' +
            'rate, first-payment default, origination fraud loss, ' +
            'portfolio yield. For any metric not recorded, name it as a ' +
            'precise seed gap with its data source.',
        },
        {
          heading: 'Credit-performance and vintage analysis',
          guidance:
            'Analyse loss performance by vintage and risk tier, separate ' +
            'credit loss from application-fraud loss and first-payment ' +
            'default, and locate where in the funnel and the credit box ' +
            'risk is being mis-selected or mispriced.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — thin credit signal, manual ' +
            'underwriting drag, mispriced risk, late delinquency ' +
            'detection, origination fraud exposure, fair-lending opacity, ' +
            'fragmented funnel, static credit policy — and state which ' +
            'are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — sharper risk selection, lower cost to ' +
            'originate, captured volume, avoided loss — explicitly ' +
            'haircut by the credit cycle, data quality, and the fair-' +
            'lending ceiling. Every figure a labelled planning range.',
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
      label: 'Lending, Credit & Underwriting Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a lending AI Move ' +
        'on this portfolio — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'sharper risk selection, lower cost to originate, captured ' +
            'volume, and avoided loss, the time-to-value band, and the go ' +
            '/ hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — charge-off rate, risk-adjusted yield, straight-' +
            'through rate, cost to originate. Where a baseline is a seed ' +
            'gap, say so and state what closing it requires before ' +
            'funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — the credit cycle, ' +
            'data quality, model-risk governance lag, the fair-lending ' +
            'ceiling — explicitly and show the haircut math. Read the ' +
            'loss forecast against a stated credit-cycle scenario.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the loan-origination, ' +
            'decision-engine, bureau, servicing, and fraud systems, the ' +
            'model-risk validation effort, and the operating-model change ' +
            '— underwriter redeployment from the work the automation ' +
            'removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a credit downturn, weaker data ' +
            'coverage, slower model-risk approval, and partial adoption. ' +
            'State the downside the CFO is underwriting, including the ' +
            'lag before charge-offs confirm the gain.',
        },
        {
          heading: 'Fair-lending and model-risk posture',
          guidance:
            'State the fair-lending and disparate-impact testing, the ' +
            'model explainability and adverse-action controls, and the ' +
            'model-risk-management governance the decision or pricing ' +
            'model runs under (ECOA, FCRA, SR 11-7).',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example a model that fails disparate-impact ' +
            'testing — and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged vintage charge-off and delinquency metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Lending, Credit & Underwriting Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'lending AI capability, grounded in the function reference ' +
        'patterns and the fair-lending and model-risk frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — governed credit-decisioning layer, confidence-' +
            'tiered automated underwriting, origination fraud gate, ' +
            'risk-based pricing engine, portfolio early-warning layer — ' +
            'and state which apply and how they connect across the ' +
            'lifecycle.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the loan-origination, decision-engine, bureau, ' +
            'servicing, and fraud integrations, the bureau and ' +
            'alternative-data feeds, the document and verification flows, ' +
            'and the data freshness the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. Define the confidence thresholds for ' +
            'automated underwriting and the audit sample.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how application intake, underwriting, fraud review, ' +
            'pricing, and servicing workflows change, how underwriters ' +
            'are redeployed to complex judgement, and who owns each ' +
            'change.',
        },
        {
          heading: 'Fair-lending, model-risk and responsible-AI controls',
          guidance:
            'State the disparate-impact testing, the model ' +
            'explainability and adverse-action controls, the model-risk-' +
            'management validation and monitoring discipline, and the ' +
            'regulatory frames (ECOA, FCRA, SR 11-7, Reg Z, UDAAP) that ' +
            'bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'lending stack, and the phased rollout by product and risk ' +
            'tier.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Lending, Credit & Underwriting Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the lending AI capability so ' +
        'value reaches the risk-adjusted yield and loss performance, not ' +
        'just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, ' +
            'model-risk validation, a pilot product or channel, ' +
            'underwriter onboarding, scale across the portfolio — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, model-risk validation, underwriter adoption, ' +
            'fair-lending review, fraud-operations adoption, Tower ' +
            'measurement.',
        },
        {
          heading: 'Underwriter and staff adoption approach',
          guidance:
            'Define the change runway for underwriters, loan officers, ' +
            'fraud analysts, and servicing staff — training, the shift ' +
            'toward complex-case judgement and exception work, the new ' +
            'decision workflow — and how adoption is measured, not ' +
            'assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged vintage charge-off and ' +
            'delinquency metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — credit-cycle shift, model drift, ' +
            'fair-lending exposure, fraud-pattern shift, model-risk ' +
            'approval delay, partial adoption — with the escalation owner ' +
            'and the trigger for each.',
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
      claim: 'Credit-loss performance — the realised cost of risk taken',
      authoritativeSource:
        'The loan-servicing system and general-ledger charge-off and ' +
        'recovery accounts, with loss tracked by origination vintage and ' +
        'risk tier.',
      whatGoodEvidenceLooksLike:
        'Net charge-off and delinquency rates broken down by vintage and ' +
        'risk tier, with application-fraud loss and first-payment default ' +
        'separated from ordinary credit loss.',
      weakEvidenceToReject:
        'A blended portfolio charge-off rate with no vintage or tier ' +
        'breakdown, or a loss figure that cannot separate fraud loss from ' +
        'credit loss.',
    },
    {
      claim: 'Risk-adjusted yield — whether the book is genuinely profitable',
      authoritativeSource:
        'The loan-servicing system and general ledger, combining ' +
        'interest and fee yield with the annualised charge-off rate by ' +
        'product and tier.',
      whatGoodEvidenceLooksLike:
        'Portfolio yield netted against the credit-loss rate for the ' +
        'same cohort, so a high-rate, high-loss book is not mistaken for ' +
        'a profitable one.',
      weakEvidenceToReject:
        'A gross portfolio yield presented as profitability with no ' +
        'charge-off netting, which flatters a high-risk book.',
    },
    {
      claim: 'Decision-model quality and fair-lending defensibility',
      authoritativeSource:
        'Model-risk-management validation evidence and documented ' +
        'disparate-impact testing of the credit-decision and pricing ' +
        'models.',
      whatGoodEvidenceLooksLike:
        'An independent validation showing rank-ordering performance, ' +
        'reason-code-level explainability, and disparate-impact test ' +
        'results across protected groups.',
      weakEvidenceToReject:
        'A vendor accuracy claim with no independent validation, or a ' +
        'decision model with no documented disparate-impact testing or ' +
        'explainability evidence.',
    },
    {
      claim: 'Funnel performance — straight-through, speed, and pull-through',
      authoritativeSource:
        'The loan-origination system funnel and decision-log analytics ' +
        'from application through to funded loan.',
      whatGoodEvidenceLooksLike:
        'Straight-through rate, time to decision, and pull-through ' +
        'measured across the funnel, with abandonment and approved-not-' +
        'taken fallout located by step.',
      weakEvidenceToReject:
        'A headline application count with no funnel decomposition, or a ' +
        'turnaround figure that omits the between-step waiting time.',
    },
    {
      claim: 'The forecast value of a lending AI Move',
      authoritativeSource:
        'The value model — sharper risk selection, lower cost to ' +
        'originate, captured volume, and avoided loss, each haircut by ' +
        'its dominant factors — read against a stated credit-cycle ' +
        'scenario.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the value components kept separate, ' +
        'the vintage-seasoning lag stated, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the credit cycle or the ' +
        'fair-lending ceiling.',
    },
  ],
};
