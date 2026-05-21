// Domain Function Pack — Financial services · Retail banking & deposits.
//
// Function key: `retail_banking_deposits`.
//
// This pack covers the consumer deposit franchise — the checking and savings
// relationships, the money-market and certificate-of-deposit book, and the
// branch and digital channels that originate and service them. It is the
// liability side of a bank's balance sheet: the funding engine that gathers
// low-cost, stable deposits the lending side puts to work.
//
// The operating reality the pack encodes: a deposit franchise is not won on
// rate alone — it is won on primacy. The accounts where the customer's pay is
// direct-deposited, where the bills are paid, and where the debit card is the
// default are sticky, low-beta, and operationally profitable; the rate-shopped
// money-market dollar is none of those things. The economics turn on the cost
// of deposits, the net interest margin the funding mix supports, deposit beta
// when rates move, and the cost to serve a relationship across branch and
// digital. The AI archetypes are the recurring bets against exactly that
// reality — deposit-pricing and rate-elasticity optimisation, attrition and
// primacy prediction, next-best-action growth, intelligent account servicing
// and self-service, and onboarding and KYC automation.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const retailBankingDepositsPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'retail_banking_deposits',
  functionLabel: 'Retail banking & deposits',
  summary:
    'Retail banking and deposits is the function that gathers and keeps the ' +
    'consumer deposit franchise: opening and servicing checking, savings, ' +
    'money-market, and certificate-of-deposit accounts across the branch ' +
    'network and digital channels, pricing those deposits, and earning the ' +
    'primary-bank relationship. Its economics are the cost of deposits, the ' +
    'net interest margin the funding mix supports, deposit beta and balance ' +
    'retention when rates move, the cost to serve a relationship, and the ' +
    'fee and interchange income the operating accounts generate. A franchise ' +
    'wins not by paying the highest rate but by earning primacy — the ' +
    'accounts that hold the direct deposit, the bill pay, and the debit ' +
    'card are stable, low-beta, and profitable; the rate-shopped dollar is ' +
    'expensive and disloyal — so the function is judged on the quality and ' +
    'stickiness of the deposit base, not on headline balance growth.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'cost_of_deposits',
      name: 'Cost of deposits',
      definition:
        'The total interest expense paid on the deposit book over a period, ' +
        'annualised, as a percentage of average interest-bearing and ' +
        'non-interest-bearing deposit balances.',
      unit: '% (annualised) of average deposit balances',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.5,
        high: 3.5,
        basis:
          'Cost of deposits moves with the rate environment and the funding ' +
          'mix — a non-interest-bearing-heavy book runs far below a ' +
          'rate-shopped money-market book. A planning range; the rate cycle ' +
          'and mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The core banking deposit system and the general ledger interest-' +
        'expense accounts, reconciled to average-balance reporting.',
      whyItMatters:
        'It is the price the bank pays for its funding; every basis point ' +
        'of cost of deposits flows straight into net interest margin, so it ' +
        'is the headline economics metric of the deposit franchise.',
    },
    {
      key: 'deposit_beta',
      name: 'Deposit beta',
      definition:
        'The share of a change in the benchmark policy or market rate that ' +
        'passes through into the rate paid on deposits — how much of a rate ' +
        'move the deposit book absorbs.',
      unit: '% of benchmark-rate change passed through to deposit rates',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 65,
        basis:
          'Deposit beta varies sharply by product and customer segment — ' +
          'operating checking is low-beta, rate-shopped money-market and CDs ' +
          'are high-beta — and rises late in a tightening cycle. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Treasury and asset-liability-management analysis comparing deposit-' +
        'rate moves against benchmark-rate moves across the cycle.',
      whyItMatters:
        'Beta is what determines how much a rate cycle costs the franchise; ' +
        'a low, well-managed beta protects net interest margin when rates ' +
        'rise and is the truest read on deposit-base quality.',
    },
    {
      key: 'net_interest_margin',
      name: 'Net interest margin',
      definition:
        'Net interest income — interest earned on assets less interest paid ' +
        'on deposits and other funding — as a percentage of average ' +
        'interest-earning assets.',
      unit: '% (annualised) of average earning assets',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2.5,
        high: 4.0,
        basis:
          'Net interest margin depends on the asset yield, the funding mix, ' +
          'and the rate environment; the band spans a thin-margin to a ' +
          'strong-margin franchise. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The general ledger net-interest-income accounts reconciled against ' +
        'average earning-asset balances in financial reporting.',
      whyItMatters:
        'It is the core spread the bank earns; the deposit franchise drives ' +
        'the funding-cost side of it, so net interest margin is the ' +
        'bottom-line proof that the deposit mix is funding the bank cheaply.',
    },
    {
      key: 'non_interest_bearing_mix',
      name: 'Non-interest-bearing deposit mix',
      definition:
        'The share of total deposit balances held in accounts that pay no ' +
        'interest — primarily operating checking — the cheapest and ' +
        'stickiest funding the franchise has.',
      unit: '% of total deposit balances',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 15,
        high: 40,
        basis:
          'The non-interest-bearing share depends on the customer mix and ' +
          'the strength of the primary-bank relationship; it erodes as ' +
          'customers move idle balances to rate-paying accounts when rates ' +
          'rise. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The core banking deposit system, classifying balances by product ' +
        'and interest-bearing status.',
      whyItMatters:
        'Non-interest-bearing balances are zero-cost, low-beta funding; a ' +
        'high and stable share is the structural foundation of a low cost ' +
        'of deposits and a defensible margin.',
    },
    {
      key: 'deposit_attrition_rate',
      name: 'Deposit attrition rate',
      definition:
        'The annualised share of deposit accounts — or balances — closed or ' +
        'run off to another institution, net of within-bank transfers.',
      unit: '% (annualised) of accounts or balances lost',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 20,
        basis:
          'Attrition varies with relationship depth, service quality, and ' +
          'rate competition; single-product rate-shoppers churn far faster ' +
          'than primary-bank households. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The core banking system account-status history reconciled against ' +
        'balance run-off reporting.',
      whyItMatters:
        'Every attrited relationship must be replaced through more ' +
        'expensive acquisition; attrition is the leak the franchise spends ' +
        'most of its marketing budget to refill.',
    },
    {
      key: 'primary_relationship_rate',
      name: 'Primary-bank relationship rate',
      definition:
        'The share of consumer households for which the bank is the primary ' +
        'institution — typically defined by an active checking account with ' +
        'direct deposit and regular transactional use.',
      unit: '% of consumer households that are primary relationships',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 75,
        basis:
          'The primary-relationship share depends on product depth, ' +
          'onboarding quality, and engagement; the band spans a thin ' +
          'single-product base to a deeply primary one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Household-level analytics combining direct-deposit flags, ' +
        'transaction activity, and product holdings from the core system.',
      whyItMatters:
        'Primary relationships are the stickiest, lowest-beta, most ' +
        'profitable deposits and the anchor for cross-sell; the ' +
        'primary-relationship rate is the truest measure of franchise ' +
        'quality.',
    },
    {
      key: 'deposits_per_household',
      name: 'Deposit balances per household',
      definition:
        'The average total deposit balance — across checking, savings, ' +
        'money-market, and CDs — held by a consumer banking household.',
      unit: 'USD average deposit balance per household',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 12000,
        high: 55000,
        basis:
          'Balance per household varies widely with the customer-wealth ' +
          'mix and relationship depth; the band spans a transactional base ' +
          'to a balance-rich one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Household-level balance aggregation from the core banking deposit ' +
        'system.',
      whyItMatters:
        'It measures share of wallet on the deposit side; deepening ' +
        'balances within the existing base is far cheaper than acquiring ' +
        'new households, so it is the core organic-growth metric.',
    },
    {
      key: 'products_per_household',
      name: 'Products per household',
      definition:
        'The average number of distinct banking products — deposit, card, ' +
        'lending, and payments — held by a consumer banking household.',
      unit: 'count of products per household',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2.0,
        high: 5.0,
        basis:
          'Product density depends on cross-sell discipline and onboarding; ' +
          'the band spans a single-product base to a deeply cross-sold one. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Household-level product-holding analytics across the core deposit, ' +
        'card, and lending systems.',
      whyItMatters:
        'Each additional product raises retention and lifetime value ' +
        'sharply; product density is the leading indicator of relationship ' +
        'stickiness and the deposit base that will not chase rate.',
    },
    {
      key: 'cost_to_serve',
      name: 'Cost to serve per account',
      definition:
        'The fully loaded annual operating cost of servicing a deposit ' +
        'account — branch, contact-centre, digital, and operations cost — ' +
        'divided by the number of active accounts.',
      unit: 'USD annual servicing cost per active account',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 40,
        high: 200,
        basis:
          'Cost to serve depends on channel mix and digital adoption — a ' +
          'branch-dependent, paper-heavy account costs far more than a ' +
          'digitally self-serving one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Channel and operations cost allocations reconciled against active-' +
        'account counts in financial and management reporting.',
      whyItMatters:
        'It is the efficiency ratio of the deposit operation; servicing ' +
        'cost is what determines whether a low-balance account is ' +
        'profitable, and it is the metric digital self-service directly ' +
        'attacks.',
    },
    {
      key: 'digital_adoption_rate',
      name: 'Digital active-customer rate',
      definition:
        'The share of consumer customers who are active users of the ' +
        'bank’s digital channels — mobile app and online banking — over ' +
        'a rolling 90-day window.',
      unit: '% of consumer customers digitally active (90-day)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 85,
        basis:
          'Digital adoption depends on the customer demographic and the ' +
          'quality of the digital experience; the band spans a ' +
          'branch-anchored base to a digital-first one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Digital-channel analytics and authentication logs reconciled ' +
        'against the active-customer base.',
      whyItMatters:
        'Digital adoption is the strongest lever on cost to serve and on ' +
        'engagement; a digitally active customer self-serves cheaply, ' +
        'transacts more, and gives the bank far more behavioural signal.',
    },
    {
      key: 'account_opening_completion',
      name: 'Account-opening completion rate',
      definition:
        'The share of started consumer deposit-account applications — ' +
        'across digital and branch channels — that complete funding and ' +
        'activation rather than being abandoned mid-flow.',
      unit: '% of started applications completed and funded',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 35,
        high: 80,
        basis:
          'Completion rates depend on application friction, KYC and ' +
          'identity-verification flow, and funding options; digital ' +
          'abandonment is high where the flow is long. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The account-origination platform funnel analytics across digital ' +
        'and branch channels.',
      whyItMatters:
        'Every abandoned application is acquisition spend wasted and a ' +
        'household lost before it began; completion rate is the leading ' +
        'indicator of onboarding-funnel health.',
    },
    {
      key: 'overdraft_incidence',
      name: 'Overdraft incidence and fee dependence',
      definition:
        'The share of checking accounts incurring an overdraft or ' +
        'non-sufficient-funds event in a period, read alongside overdraft ' +
        'and NSF fee income as a share of total deposit-account fee income.',
      unit: '% of checking accounts with an overdraft event per period',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 20,
        basis:
          'Overdraft incidence depends on the customer mix and on overdraft ' +
          'policy and grace features; the band has compressed sharply as ' +
          'banks reform fee programmes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The core banking system overdraft and NSF transaction log ' +
        'reconciled against fee-income reporting.',
      whyItMatters:
        'Overdraft is a concentrated, regulator-scrutinised fee stream ' +
        'falling heavily on vulnerable customers; tracking incidence and ' +
        'fee dependence is essential to managing both the customer-fairness ' +
        'risk and the revenue exposure.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'rate_shopped_funding',
      name: 'Rate-shopped, beta-exposed funding base',
      description:
        'Deposit growth is bought with promotional money-market and CD ' +
        'rates that attract balances with no relationship behind them. The ' +
        'book looks healthy until rates move — the hot money reprices fast ' +
        'or leaves, deposit beta spikes, and the cost of deposits runs away.',
      detectionSignal:
        'Balance growth concentrates in promotional money-market and CD ' +
        'tiers with no associated checking or direct deposit; deposit beta ' +
        'on those tiers approaches one late in the cycle.',
      diagnosticQuestion:
        'How much of recent deposit growth carries a primary relationship, ' +
        'and what is the modelled beta and run-off of the rate-acquired ' +
        'balances if rates move?',
    },
    {
      key: 'flat_rate_card_pricing',
      name: 'Flat rate-card pricing blind to elasticity',
      description:
        'Deposit rates are set from a uniform rate card and competitor ' +
        'matching, with no read on which segments and balance tiers are ' +
        'rate-sensitive. The bank overpays for balances that would have ' +
        'stayed at a lower rate and underpays where retention is genuinely ' +
        'at risk.',
      detectionSignal:
        'Deposit rates move only when competitors move; there is no ' +
        'segment-level or balance-tier elasticity estimate informing ' +
        'pricing decisions.',
      diagnosticQuestion:
        'Are deposit rates set from measured rate-elasticity by segment and ' +
        'balance tier, or from a flat rate card and competitor matching?',
    },
    {
      key: 'single_product_thinness',
      name: 'Single-product relationship thinness',
      description:
        'A large share of households hold only one product — a standalone ' +
        'savings account or an unused checking account — with no direct ' +
        'deposit, no card primacy, and no lending tie. These relationships ' +
        'are shallow, disloyal, and the first to leave for a better rate.',
      detectionSignal:
        'Products per household and the primary-relationship rate are low; ' +
        'a large tail of accounts shows no direct deposit and minimal ' +
        'transactional activity.',
      diagnosticQuestion:
        'What share of households are single-product and non-primary, and ' +
        'what is being done to deepen them before they attrit?',
    },
    {
      key: 'silent_attrition',
      name: 'Silent attrition and balance erosion',
      description:
        'Relationships decay before they close — the direct deposit moves, ' +
        'balances drift down, transactional activity fades — but the bank ' +
        'has no early-warning signal and only sees the loss once the ' +
        'account is closed, far too late to intervene.',
      detectionSignal:
        'Attrition is detected only at account closure; there is no ' +
        'leading attrition or disengagement score and no proactive ' +
        'retention workflow.',
      diagnosticQuestion:
        'Does the bank detect a deteriorating relationship before it ' +
        'closes, and is there a proactive retention play, or is attrition ' +
        'only seen after the fact?',
    },
    {
      key: 'onboarding_friction',
      name: 'Onboarding and account-opening friction',
      description:
        'Opening an account is a long, document-heavy process — identity ' +
        'verification stalls, KYC questions repeat, funding is clumsy — so ' +
        'digital applications are abandoned mid-flow and branch openings ' +
        'consume heavy staff time, and the first relationship impression is ' +
        'a poor one.',
      detectionSignal:
        'Account-opening completion is low, digital abandonment is ' +
        'concentrated at the identity-verification and funding steps, and ' +
        'branch open times are long.',
      diagnosticQuestion:
        'How long does it take to open and fund an account in each ' +
        'channel, and where in the flow do applications stall or abandon?',
    },
    {
      key: 'branch_digital_disconnect',
      name: 'Branch and digital channel disconnect',
      description:
        'The branch and the digital channels run as separate operations on ' +
        'separate data. A customer who starts an application online cannot ' +
        'finish it in the branch, the contact centre cannot see the digital ' +
        'session, and the customer re-explains themselves at every handoff.',
      detectionSignal:
        'Channels hold separate customer context; cross-channel journeys ' +
        'break at handoff and customers repeat information already given.',
      diagnosticQuestion:
        'Can a customer move between branch, digital, and the contact ' +
        'centre without losing context, or does each channel start cold?',
    },
    {
      key: 'overdraft_fee_dependence',
      name: 'Overdraft and fee-income dependence',
      description:
        'A material share of deposit-account revenue depends on overdraft ' +
        'and NSF fees concentrated on a small group of financially ' +
        'stressed customers. The revenue is fragile — exposed to ' +
        'regulatory reform and competitor fee elimination — and carries ' +
        'real customer-fairness and reputational risk.',
      detectionSignal:
        'Overdraft and NSF fees are a large share of deposit fee income ' +
        'and concentrate on a small share of accounts; fee revenue is ' +
        'eroding as the market reforms.',
      diagnosticQuestion:
        'How dependent is deposit-account revenue on overdraft and NSF ' +
        'fees, how concentrated is that on stressed customers, and how ' +
        'exposed is it to fee reform?',
    },
    {
      key: 'idle_branch_capacity',
      name: 'Idle branch capacity and unmanaged channel cost',
      description:
        'Transaction volume has migrated to digital but the branch network ' +
        'and its staffing have not been re-shaped around advice and ' +
        'relationship work. Branches carry cost without a clear ' +
        'relationship-deepening role, dragging the cost to serve.',
      detectionSignal:
        'Branch transaction volumes fall while branch cost and staffing ' +
        'hold flat; cost to serve is high and not declining with digital ' +
        'adoption.',
      diagnosticQuestion:
        'As transactions move to digital, has the branch network been ' +
        're-roled toward advice and deepening, or is it carrying ' +
        'unmanaged transactional cost?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'deposit_pricing_optimization',
      name: 'Deposit-pricing and rate-elasticity optimisation',
      valueMechanism:
        'A model estimates deposit rate-elasticity by customer segment, ' +
        'product, and balance tier and recommends the rate that retains ' +
        'balances at the lowest funding cost — paying up only where ' +
        'retention is genuinely rate-sensitive and holding rate where ' +
        'balances are sticky. Value comes from pricing to measured ' +
        'elasticity rather than to a uniform rate card, lowering the cost ' +
        'of deposits and the deposit beta the franchise carries through a ' +
        'rate cycle.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Account-level balance, rate, and product history across rate cycles',
        'Customer-segment and primary-relationship classification',
        'Competitor deposit-rate intelligence by market and product',
        'Treasury funding-cost and asset-liability-management targets',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends rates; treasury and deposit-pricing ' +
          'leadership approve the rate sheet and own the funding-mix and ' +
          'liquidity trade-off.',
        'Rate elasticity drifts with the rate environment and competition ' +
          '— the model must be revalidated through the cycle, not set once.',
        'Pricing recommendations must respect fair-banking and consistency ' +
          'rules — segment-level pricing must not proxy a protected class ' +
          'or create unfair tiering.',
      ],
      metricsMoved: [
        'cost_of_deposits',
        'deposit_beta',
        'net_interest_margin',
        'deposit_attrition_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'attrition_primacy_prediction',
      name: 'Attrition and primacy prediction',
      valueMechanism:
        'A model scores each household for attrition risk and for primacy ' +
        'strength — reading direct-deposit movement, balance drift, ' +
        'transactional disengagement, and product decay — so a ' +
        'deteriorating relationship is detected while it can still be ' +
        'saved. Value comes from moving retention from a post-closure ' +
        'reaction to a proactive intervention, cutting attrition and ' +
        'protecting the low-beta primary base.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Account transaction, balance, and direct-deposit history',
        'Product-holding and relationship-depth data per household',
        'Historical attrition outcomes for model training',
        'Service-interaction and complaint history',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags at-risk relationships and likely cause; a banker ' +
          'or retention specialist owns the outreach and the retention ' +
          'offer.',
        'Retention offers must be governed against fair-banking rules so ' +
          'concessions are not steered by protected-class proxies.',
        'The model must be revalidated as customer behaviour and the rate ' +
          'environment shift — attrition drivers drift.',
      ],
      metricsMoved: [
        'deposit_attrition_rate',
        'primary_relationship_rate',
        'deposits_per_household',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'next_best_action_growth',
      name: 'Next-best-action relationship growth',
      valueMechanism:
        'A model identifies, for each household, the next product or ' +
        'engagement step most likely to deepen the relationship — a direct-' +
        'deposit switch, a savings-goal account, a card, a lending ' +
        'pre-qualification — and serves it as a prioritised action to ' +
        'bankers and digital channels. Value comes from growing balances ' +
        'and product density within the existing base, which is far ' +
        'cheaper than acquiring new households and produces stickier, ' +
        'lower-beta deposits.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Household product-holding, balance, and transaction data',
        'Customer life-stage and financial-needs signals',
        'Channel engagement and contact-preference data',
        'Product eligibility and offer-catalogue data',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model recommends the next action; a banker owns the ' +
          'conversation and the suitability judgement for any product ' +
          'recommendation.',
        'Recommendations must respect suitability, marketing-consent, and ' +
          'fair-banking rules — no product steering that disadvantages a ' +
          'protected group.',
        'Prediction quality decays without fresh engagement outcomes — the ' +
          'recommendation model must learn from acted and declined offers.',
      ],
      metricsMoved: [
        'products_per_household',
        'deposits_per_household',
        'primary_relationship_rate',
        'non_interest_bearing_mix',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
    {
      key: 'intelligent_account_servicing',
      name: 'Intelligent account servicing and self-service',
      valueMechanism:
        'A conversational agent handles routine deposit-servicing requests ' +
        '— balance and transaction questions, disputes, card controls, ' +
        'travel notices, statement requests — across the app and the ' +
        'contact centre, resolving the routine and routing only the ' +
        'complex to a banker with full context. Value comes from cutting ' +
        'the cost to serve, deflecting routine contact-centre volume, and ' +
        'lifting digital engagement and resolution speed.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Account, transaction, and product data from the core banking ' +
          'system',
        'Servicing knowledge base and policy and procedure content',
        'Interaction history across digital and contact-centre channels',
        'Authentication and identity-verification services',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent resolves routine requests; anything touching money ' +
          'movement, a dispute outcome, or a fee waiver routes to a banker ' +
          'or requires explicit confirmation.',
        'Authentication and fraud controls must gate every account action ' +
          '— a servicing agent must not be a social-engineering vector.',
        'Responses must be accurate to bank policy and disclosure rules; a ' +
          'wrong servicing answer is a compliance and trust failure.',
      ],
      metricsMoved: [
        'cost_to_serve',
        'digital_adoption_rate',
        'deposit_attrition_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'onboarding_kyc_automation',
      name: 'Digital onboarding and KYC automation',
      valueMechanism:
        'An agent streamlines account opening — verifying identity, ' +
        'extracting and validating documents, screening against KYC and ' +
        'sanctions requirements, and guiding funding — so an account opens ' +
        'in minutes with minimal manual review. Value comes from lifting ' +
        'account-opening completion, cutting the staff cost of onboarding ' +
        'and manual KYC review, and starting the relationship with a clean ' +
        'first impression.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Identity-verification and document-extraction services',
        'KYC, sanctions, and watchlist screening data',
        'The account-origination platform and funnel data',
        'Funding-source and account-validation services',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent automates straightforward openings; any KYC, sanctions, ' +
          'or identity exception routes to a compliance analyst who owns ' +
          'the decision.',
        'KYC and Customer Identification Program requirements are ' +
          'non-negotiable — automation speeds the clean cases, it never ' +
          'relaxes the screening standard.',
        'Identity-verification models must be monitored for differential ' +
          'false-reject rates across demographic groups — a fair-access ' +
          'risk.',
      ],
      metricsMoved: [
        'account_opening_completion',
        'cost_to_serve',
        'primary_relationship_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'financial_wellness_engagement',
      name: 'Personalised financial-wellness engagement',
      valueMechanism:
        'A model reads a customer’s cash-flow pattern and surfaces ' +
        'timely, personalised guidance — a low-balance alert before an ' +
        'overdraft, a savings nudge after a pay deposit, a goal-based ' +
        'savings prompt — inside the digital channel. Value comes from ' +
        'deepening engagement and balances, reducing avoidable overdrafts ' +
        'and the fee-dependence and customer-harm risk they carry, and ' +
        'strengthening primacy.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Transaction, cash-flow, and balance history per account',
        'Recurring-income and recurring-expense detection',
        'Customer goals and savings-product data',
        'Digital-channel engagement and consent data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model generates guidance and nudges; product and digital ' +
          'leadership own the content framework and the line between ' +
          'guidance and regulated financial advice.',
        'Nudges must genuinely serve the customer — using cash-flow ' +
          'insight to drive fee revenue rather than reduce overdrafts is a ' +
          'customer-fairness and reputational failure.',
        'Cash-flow inference and alerting must respect data-use consent ' +
          'and privacy expectations.',
      ],
      metricsMoved: [
        'overdraft_incidence',
        'digital_adoption_rate',
        'deposits_per_household',
        'deposit_attrition_rate',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'elasticity_based_deposit_pricing',
      name: 'Elasticity-based deposit-pricing layer',
      description:
        'A pattern that estimates deposit rate-elasticity by segment, ' +
        'product, and balance tier and produces rate recommendations ' +
        'inside the treasury rate-setting cycle — replacing uniform ' +
        'rate-card pricing and competitor matching with pricing to ' +
        'measured retention sensitivity, within funding-mix and liquidity ' +
        'guardrails.',
      boundary:
        'It estimates elasticity and recommends rates; treasury and ' +
        'deposit-pricing leadership approve the rate sheet and own the ' +
        'liquidity and funding-mix decision. It does not set rates ' +
        'autonomously.',
      humanAccountabilityPoint:
        'The head of deposit pricing / treasury accountable for the cost ' +
        'of deposits, deposit beta, and the funding mix.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'relationship_health_signal',
      name: 'Relationship-health signal layer',
      description:
        'A pattern that maintains a per-household attrition-risk and ' +
        'primacy-strength score from direct-deposit, balance, transaction, ' +
        'and product signals, and serves it as the common read that ' +
        'retention, deepening, and service workflows consume — so a ' +
        'decaying relationship is seen early and acted on rather than ' +
        'discovered at closure.',
      boundary:
        'It scores relationship health and serves the signal; bankers and ' +
        'retention teams own the outreach and the offer. It is a read ' +
        'model, not an action engine.',
      humanAccountabilityPoint:
        'The head of consumer deposits / retention accountable for ' +
        'attrition and the primary-relationship rate.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'next_best_action_engine',
      name: 'Next-best-action deepening engine',
      description:
        'A pattern that ranks, for each household, the next product or ' +
        'engagement action most likely to deepen the relationship and ' +
        'delivers it as a prioritised, suitability-checked play to bankers ' +
        'and digital channels — so growth concentrates on deepening the ' +
        'existing base rather than on undifferentiated acquisition.',
      boundary:
        'It recommends and prioritises actions within an approved ' +
        'suitability and consent framework; a banker owns the customer ' +
        'conversation and the product recommendation. It does not open ' +
        'products autonomously.',
      humanAccountabilityPoint:
        'The head of consumer banking accountable for products and ' +
        'balances per household and the deepening agenda.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'personalization',
    },
    {
      key: 'omnichannel_servicing_layer',
      name: 'Omnichannel servicing-and-resolution layer',
      description:
        'A pattern that places a conversational servicing agent over the ' +
        'core banking system with shared context across app, online ' +
        'banking, and the contact centre — resolving routine deposit ' +
        'servicing, deflecting volume, and routing complex or money-moving ' +
        'requests to a banker who inherits the full interaction history.',
      boundary:
        'It resolves routine servicing and routes the rest; a banker owns ' +
        'every money-movement, dispute, and fee decision. Authentication ' +
        'and fraud controls gate every action.',
      humanAccountabilityPoint:
        'The head of customer servicing accountable for cost to serve, ' +
        'resolution quality, and servicing risk.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'straight_through_onboarding',
      name: 'Straight-through onboarding and KYC pattern',
      description:
        'A pattern that automates account opening end-to-end for ' +
        'straightforward applicants — identity verification, document ' +
        'extraction, KYC and sanctions screening, and funding — while ' +
        'routing every screening or identity exception to a compliance ' +
        'analyst, so clean cases open in minutes without weakening the ' +
        'screening standard.',
      boundary:
        'It automates the clean path and routes exceptions; a compliance ' +
        'analyst owns every KYC, sanctions, and identity exception ' +
        'decision. It never relaxes the screening requirement.',
      humanAccountabilityPoint:
        'The BSA/AML compliance officer accountable for the integrity of ' +
        'KYC and customer-identification screening.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'workflow_automation',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Deposit-franchise value is realised in four distinct ways and a ' +
      'forecast must keep them separate. First, lower funding cost: pricing ' +
      'deposits to elasticity rather than a flat rate card lowers the cost ' +
      'of deposits and the beta carried through a rate cycle — this lands ' +
      'directly in net interest margin and is recurring, though its size ' +
      'depends on the rate environment. Second, retained and deepened ' +
      'balances: cutting attrition and deepening primacy holds and grows ' +
      'low-beta deposits that would otherwise have to be reacquired at ' +
      'higher cost — recurring, and compounding. Third, lower cost to ' +
      'serve: digital self-service and servicing automation remove manual ' +
      'and branch cost — recurring once the operating model is reshaped. ' +
      'Fourth, avoided customer harm and fee risk: reducing avoidable ' +
      'overdrafts trades fragile, regulator-exposed fee revenue for a more ' +
      'durable franchise. The dominant constraint is that deposit ' +
      'economics are governed by the rate cycle and competitor behaviour ' +
      'the bank does not control — a tightening cycle and an aggressive ' +
      'competitor can erode a modelled funding-cost gain — so a forecast ' +
      'must be read against a rate scenario, not a single point.',
    dominantHaircutFactors: [
      {
        factor: 'Rate environment and competitive deposit dynamics',
        rationale:
          'Deposit beta, attrition, and funding cost are driven by the ' +
          'rate cycle and by how aggressively competitors price for ' +
          'balances — none of which the bank controls. A tightening cycle ' +
          'or a rate war caps how much of a modelled funding-cost or ' +
          'retention gain is actually reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.5,
          basis:
            'Value erosion from the rate cycle and competitive deposit ' +
            'pricing outside the bank’s control; a planning range ' +
            'widening late in a tightening cycle.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data quality and core-system readiness',
        rationale:
          'Pricing, attrition, and next-best-action models depend on ' +
          'clean household-level balance, transaction, and direct-deposit ' +
          'data joined across the core system. Fragmented customer data ' +
          'and weak household resolution cap how much of the modelled ' +
          'value can be delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from fragmented core-system data and weak ' +
            'household resolution; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Channel and staff adoption',
        rationale:
          'The cost-to-serve and deepening gains only land if digital ' +
          'self-service is genuinely adopted and bankers act on the ' +
          'next-best-action and retention signals rather than running them ' +
          'alongside the old process. Partial adoption realises a fraction ' +
          'of the modelled saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial digital and banker adoption of ' +
            'the new workflow; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Regulatory and fair-banking ceiling',
        rationale:
          'Segment-level pricing, targeted offers, and overdraft and ' +
          'fee-linked use cases are bounded by fair-banking, UDAAP, and ' +
          'consumer-protection rules. A use case that crosses the fairness ' +
          'or disclosure line is not reachable value — the compliant ' +
          'ceiling haircuts the modelled upside.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled pricing or fee-linked gain that is ' +
            'not compliantly or fairly reachable; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Cost-of-deposits reduction',
        range: {
          low: 5,
          high: 25,
          basis:
            'Basis-point reduction in the cost of deposits from ' +
            'elasticity-based pricing rather than a flat rate card; a ' +
            'planning range, larger in a higher-rate environment.',
          label: 'planning-range',
        },
        measuredAs:
          'Basis-point change in the cost of deposits as a share of ' +
          'average deposit balances.',
      },
      {
        lever: 'Deposit-attrition reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in deposit attrition from proactive ' +
            'relationship-health intervention; a planning range spanning ' +
            'early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the annualised deposit-attrition ' +
          'rate.',
      },
      {
        lever: 'Cost-to-serve reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in cost to serve per account from digital ' +
            'self-service and servicing automation; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in fully loaded servicing cost per ' +
          'active account.',
      },
      {
        lever: 'Deepening uplift — products and balances per household',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative uplift in products and deposit balances per ' +
            'household from next-best-action deepening; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in products and deposit balances per ' +
          'household.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal (digital ' +
      'adoption, account-opening completion, servicing deflection); 9–18 ' +
      'months to a settled franchise result, because the funding-cost, ' +
      'attrition, and deepening gains only prove out once a deposit cohort ' +
      'has cycled through a meaningful stretch of the rate environment.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Core banking / deposit system',
        role:
          'The system of record for deposit accounts — balances, rates, ' +
          'transactions, interest accrual, statements, and account status ' +
          'across checking, savings, money-market, and CDs.',
        examples: [
          'FIS Horizon / IBS',
          'Fiserv DNA / Premier',
          'Jack Henry SilverLake',
          'Temenos / Thought Machine core platforms',
        ],
      },
      {
        name: 'Digital banking platform',
        role:
          'The mobile and online-banking channel — the primary self-' +
          'service surface for transactions, servicing, alerts, and ' +
          'engagement, and an increasingly important origination channel.',
        examples: [
          'Q2',
          'Alkami',
          'Backbase',
          'in-house mobile and online-banking platforms',
        ],
      },
      {
        name: 'Account-origination / onboarding platform',
        role:
          'Handles new-account applications, identity verification, KYC ' +
          'and CIP screening, and funding across digital and branch ' +
          'channels — the front door to the deposit franchise.',
        examples: [
          'MANTL',
          'Mahalo / Terafina',
          'nCino / Salesforce onboarding',
          'core-vendor account-opening modules',
        ],
      },
      {
        name: 'Deposit-pricing and treasury / ALM system',
        role:
          'Supports deposit rate-setting, funding-cost analysis, deposit-' +
          'beta and balance-behaviour modelling, and asset-liability ' +
          'management of the deposit book.',
        examples: [
          'Nomis deposit pricing',
          'Empyrean / ZM Financial ALM',
          'Curinos deposit analytics',
          'in-house treasury and ALM models',
        ],
      },
      {
        name: 'CRM and customer-data platform',
        role:
          'Holds the household and relationship view — product holdings, ' +
          'interactions, segments, and the next-best-action and retention ' +
          'context bankers and channels consume.',
        examples: [
          'Salesforce Financial Services Cloud',
          'Microsoft Dynamics',
          'core-vendor relationship-management tools',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of Consumer / Retail Banking',
        accountability:
          'Owns the consumer banking P&L — deposit growth, the funding ' +
          'mix, fee income, and the franchise-quality outcome.',
      },
      {
        title: 'Head of Deposits / Deposit-Pricing leader',
        accountability:
          'Owns deposit rate-setting, the cost of deposits, deposit beta, ' +
          'and the balance and mix of the deposit book.',
      },
      {
        title: 'Treasurer / Asset-Liability-Management leader',
        accountability:
          'Owns funding, liquidity, interest-rate-risk management, and the ' +
          'asset-liability balance the deposit book supports.',
      },
      {
        title: 'Head of Branch / Distribution network',
        accountability:
          'Owns the branch network, its staffing and role, and the ' +
          'in-person relationship and advice experience.',
      },
      {
        title: 'Head of Digital Banking',
        accountability:
          'Owns the mobile and online channels, digital adoption, digital ' +
          'origination, and the self-service experience.',
      },
      {
        title: 'BSA/AML and Deposit Compliance officer',
        accountability:
          'Owns KYC and CIP, BSA/AML monitoring, Regulation DD and ' +
          'consumer-protection compliance for deposit products.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'FDIC deposit insurance and capital / liquidity rules',
        relevance:
          'Deposit insurance, the assessment base, and liquidity rules ' +
          '(such as the liquidity coverage ratio) shape how the deposit ' +
          'base is valued, classified, and managed as funding.',
      },
      {
        name: 'Regulation DD (Truth in Savings Act)',
        relevance:
          'Governs the disclosure of deposit account terms, interest ' +
          'rates, annual percentage yield, and fees — the frame any ' +
          'deposit-pricing or product communication must satisfy.',
      },
      {
        name: 'Bank Secrecy Act / AML and the Customer Identification ' +
          'Program',
        relevance:
          'Mandate KYC, customer identification, sanctions screening, and ' +
          'suspicious-activity monitoring at account opening and through ' +
          'the relationship — the non-negotiable frame on onboarding ' +
          'automation.',
      },
      {
        name: 'CFPB supervision, UDAAP, and overdraft / fee rules',
        relevance:
          'Consumer-protection supervision and unfair-deceptive-abusive-' +
          'acts-and-practices standards govern fees, overdraft programmes, ' +
          'and account practices — the frame any fee-linked or overdraft ' +
          'use case must respect.',
      },
      {
        name: 'Fair-banking and ECOA / anti-discrimination rules',
        relevance:
          'Equal-access and anti-discrimination rules bound segment-level ' +
          'pricing, targeted offers, and identity verification — terms and ' +
          'access must not proxy a protected characteristic.',
      },
      {
        name: 'Regulation E and electronic fund-transfer rules',
        relevance:
          'Govern electronic transactions, error resolution, and dispute ' +
          'rights on consumer deposit accounts — the frame any servicing ' +
          'or dispute-handling automation must satisfy.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Deposit beta',
        definition:
          'The fraction of a change in a benchmark market rate that a bank ' +
          'passes through into the rates it pays on deposits.',
      },
      {
        term: 'Cost of deposits',
        definition:
          'Annualised interest expense on the deposit book as a percentage ' +
          'of average deposit balances — the price the bank pays for its ' +
          'funding.',
      },
      {
        term: 'Net interest margin (NIM)',
        definition:
          'Net interest income as a percentage of average interest-earning ' +
          'assets — the core spread between asset yield and funding cost.',
      },
      {
        term: 'Non-interest-bearing deposits',
        definition:
          'Deposits, primarily operating checking, that pay no interest — ' +
          'the cheapest and typically stickiest funding a bank holds.',
      },
      {
        term: 'Primary-bank relationship',
        definition:
          'A household for which the bank is the main institution — ' +
          'typically an active checking account with direct deposit and ' +
          'regular transactional use.',
      },
      {
        term: 'Core deposits',
        definition:
          'Stable, relationship-based deposits — checking and savings of ' +
          'engaged customers — as distinct from rate-sensitive, ' +
          'wholesale, or brokered funding.',
      },
      {
        term: 'Annual percentage yield (APY)',
        definition:
          'The effective annual rate of return on a deposit account ' +
          'including the effect of compounding — a Regulation DD disclosed ' +
          'figure.',
      },
      {
        term: 'Know Your Customer (KYC) / Customer Identification Program',
        definition:
          'The required process of verifying a customer’s identity and ' +
          'screening them at account opening under BSA/AML rules.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Retail Banking & Deposits Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the deposit franchise is weak — in funding cost ' +
        'and beta, in relationship depth and attrition, in onboarding, or ' +
        'in cost to serve — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Franchise and operating context',
          guidance:
            'Name the consumer banking franchise in scope — the deposit ' +
            'book size and mix, the branch and digital footprint, the ' +
            'customer-segment profile — and state which core banking, ' +
            'digital, origination, and deposit-pricing systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — cost of deposits, deposit beta, net ' +
            'interest margin, non-interest-bearing mix, attrition, ' +
            'primary-relationship rate, deposits and products per ' +
            'household, cost to serve, digital adoption, account-opening ' +
            'completion, overdraft incidence. For any metric not recorded, ' +
            'name it as a precise seed gap with its data source.',
        },
        {
          heading: 'Deposit-mix and funding-cost analysis',
          guidance:
            'Decompose the deposit book by product, balance tier, and ' +
            'relationship depth, locate where funding cost and beta ' +
            'concentrate, and separate stable core deposits from ' +
            'rate-shopped, beta-exposed balances.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — rate-shopped funding, flat ' +
            'rate-card pricing, single-product thinness, silent attrition, ' +
            'onboarding friction, branch-digital disconnect, overdraft fee ' +
            'dependence, idle branch capacity — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — lower funding cost, retained and deepened ' +
            'balances, lower cost to serve — explicitly haircut by the ' +
            'rate environment, data quality, and adoption. Every figure a ' +
            'labelled planning range.',
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
      label: 'Retail Banking & Deposits Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a retail-banking ' +
        'AI Move on this franchise — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'lower funding cost, retained and deepened balances, and lower ' +
            'cost to serve, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — cost of deposits, deposit beta, attrition, cost to ' +
            'serve. Where a baseline is a seed gap, say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — rate environment, ' +
            'data quality, channel and staff adoption, the fair-banking ' +
            'ceiling — explicitly and show the haircut math. Read the ' +
            'funding-cost forecast against a stated rate scenario.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the core banking, ' +
            'digital, origination, and deposit-pricing systems, and the ' +
            'operating-model change — banker and branch redeployment from ' +
            'the work the automation removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under an adverse rate cycle, an ' +
            'aggressive competitor, weaker data quality, and partial ' +
            'adoption. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Regulatory and fair-banking posture',
          guidance:
            'For any pricing, targeting, onboarding, or fee-linked ' +
            'component, state the fair-banking, Regulation DD, BSA/AML, and ' +
            'UDAAP controls and the consumer-protection exposure the design ' +
            'carries.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be funded ' +
            'and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged funding-cost, beta, and attrition metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Retail Banking & Deposits Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'retail-banking AI capability, grounded in the function reference ' +
        'patterns and the banking-regulatory frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — elasticity-based deposit pricing, relationship-' +
            'health signal layer, next-best-action deepening engine, ' +
            'omnichannel servicing layer, straight-through onboarding — ' +
            'and state which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the core banking, digital, origination, deposit-' +
            'pricing, and CRM integrations, the household-resolution and ' +
            'customer-data model, and the data freshness the use cases ' +
            'depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and the ' +
            'escalation path. Define the authentication and KYC controls ' +
            'and the human-approval gates.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how branch, digital, contact-centre, deposit-pricing, ' +
            'and onboarding workflows change, how staff are redeployed ' +
            'toward advice and deepening, and who owns each change.',
        },
        {
          heading: 'Regulatory and responsible-AI controls',
          guidance:
            'State the fair-banking and disparate-impact controls, the ' +
            'Regulation DD disclosure controls, the BSA/AML and CIP ' +
            'controls, and the regulatory frames (Reg DD, BSA/AML, CFPB ' +
            'UDAAP, ECOA, Reg E) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'banking stack, and the phased rollout by channel and customer ' +
            'segment.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Retail Banking & Deposits Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the retail-banking AI capability ' +
        'so value reaches the cost of deposits and the franchise, not just ' +
        'the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot segment or channel, banker and branch onboarding, scale ' +
            'across the franchise — with milestones tied to the operating ' +
            'metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, deposit-pricing-model readiness, banker and ' +
            'branch adoption, fair-banking and compliance review, digital ' +
            'rollout, Tower measurement.',
        },
        {
          heading: 'Banker and channel adoption approach',
          guidance:
            'Define the change runway for bankers, branch staff, and ' +
            'contact-centre teams — training, the shift toward advice and ' +
            'next-best-action selling, the move to digital self-service — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged funding-cost and attrition ' +
            'metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — rate-cycle shift, competitive deposit ' +
            'pricing, fair-banking exposure, KYC-automation risk, partial ' +
            'adoption — with the escalation owner and the trigger for ' +
            'each.',
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
      claim: 'The cost of deposits and the deposit beta of the book',
      authoritativeSource:
        'The core banking deposit system and general-ledger interest-' +
        'expense accounts, with deposit-rate moves compared against ' +
        'benchmark-rate moves across the rate cycle.',
      whatGoodEvidenceLooksLike:
        'Cost of deposits and a measured beta broken down by product and ' +
        'balance tier, with rate-sensitive balances separated from stable ' +
        'core deposits.',
      weakEvidenceToReject:
        'A single blended deposit-rate figure with no product or tier ' +
        'breakdown, or an assumed beta never measured against an actual ' +
        'rate move.',
    },
    {
      claim: 'Relationship quality — primacy, attrition, and depth',
      authoritativeSource:
        'Household-level analytics combining direct-deposit flags, ' +
        'transaction activity, product holdings, and account-status ' +
        'history from the core banking system.',
      whatGoodEvidenceLooksLike:
        'A household-resolved view of the primary-relationship rate, ' +
        'products per household, and attrition, with single-product and ' +
        'non-primary households identified.',
      weakEvidenceToReject:
        'An account-level count with no household resolution, or a ' +
        'balance-growth figure that cannot distinguish primary from ' +
        'rate-shopped relationships.',
    },
    {
      claim: 'Cost to serve and the channel-cost structure',
      authoritativeSource:
        'Channel and operations cost allocations reconciled against ' +
        'active-account counts in financial and management reporting.',
      whatGoodEvidenceLooksLike:
        'Fully loaded servicing cost per account with branch, contact-' +
        'centre, and digital cost attributed, and digital adoption ' +
        'measured against it.',
      weakEvidenceToReject:
        'A branch headcount with no link to account or transaction ' +
        'volume, or a cost figure that omits digital and operations cost.',
    },
    {
      claim: 'Overdraft incidence and fee-revenue dependence',
      authoritativeSource:
        'The core banking system overdraft and NSF transaction log ' +
        'reconciled against deposit-account fee-income reporting.',
      whatGoodEvidenceLooksLike:
        'Overdraft incidence and fee income with the concentration of ' +
        'fees across accounts shown, so dependence on a small group of ' +
        'stressed customers is visible.',
      weakEvidenceToReject:
        'A total fee-income figure with no incidence or concentration ' +
        'detail, which hides both the customer-harm and the revenue-' +
        'fragility risk.',
    },
    {
      claim: 'The forecast value of a retail-banking AI Move',
      authoritativeSource:
        'The value model — lower funding cost, retained and deepened ' +
        'balances, lower cost to serve, and avoided fee risk, each haircut ' +
        'by its dominant factors — read against a stated rate scenario.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the value components kept separate, ' +
        'and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the rate cycle or the fair-' +
        'banking ceiling.',
    },
  ],
};
