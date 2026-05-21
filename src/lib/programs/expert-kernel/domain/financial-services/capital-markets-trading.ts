// Domain Function Pack — Financial services · Capital markets & trading.
//
// Function key: `capital_markets_trading`.
//
// This pack covers the sell-side capital-markets and trading function: the
// sales & trading desks that make markets and intermediate risk across rates,
// credit, FX, equities, and their derivatives. It spans the front office
// (price-making, quoting, client execution, position and inventory
// management), the trade lifecycle that follows every fill (capture,
// enrichment, allocation, confirmation, clearing, and settlement), and the
// market-risk discipline that governs how much risk the desk may carry and at
// what cost of capital.
//
// The operating reality the pack encodes: a trading desk earns its return by
// capturing bid-offer spread and intermediation P&L while bearing inventory,
// market, and counterparty risk — and it loses that return to three distinct
// leaks. It loses it on the desk, through poor pricing, slow quoting, missed
// hedges, and risk that drifts past limits. It loses it in the back, through
// trade breaks, failed settlements, and reconciliation rework that consume
// margin and create operational risk. And it loses it to the regulator and to
// capital, through best-execution shortfalls, surveillance gaps, and balance
// sheet that is consumed inefficiently. The AI archetypes are the recurring
// bets against exactly that reality.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const capitalMarketsTradingPack: FunctionPack = {
  industryKey: 'financial-services',
  functionKey: 'capital_markets_trading',
  functionLabel: 'Capital markets & trading',
  summary:
    'Capital markets and trading is the sell-side function that makes ' +
    'markets and intermediates risk for clients across rates, credit, FX, ' +
    'equities, and derivatives: quoting prices, executing client flow, ' +
    'managing the inventory and risk the desk takes on, and processing ' +
    'every fill through the trade lifecycle to clearing and settlement. Its ' +
    'economics are spread capture and intermediation P&L earned against the ' +
    'market, inventory, and counterparty risk the desk bears, the cost of ' +
    'the balance sheet and regulatory capital that risk consumes, and the ' +
    'operational cost of trade breaks and failed settlements. A desk wins ' +
    'by pricing and hedging fast and accurately, by carrying risk that ' +
    'stays inside limits and earns its capital charge, and by running a ' +
    'trade lifecycle that does not leak P&L to breaks and fails — the ' +
    'function is judged on risk-adjusted return on the capital it consumes, ' +
    'not on gross trading revenue alone.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'bid_offer_spread_capture',
      name: 'Bid-offer spread capture',
      definition:
        'The share of the quoted bid-offer spread the desk actually ' +
        'realises on client trades, after price improvement given, ' +
        'skew, and the cost of hedging the resulting position.',
      unit: '% of quoted bid-offer spread realised',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 35,
        high: 75,
        basis:
          'Realised spread capture varies with asset class, electronic ' +
          'versus voice channel, and client tiering; liquid electronic ' +
          'markets sit lower, structured voice trades higher. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The trading book and execution-management system, comparing ' +
        'quoted prices against fill prices and hedge cost.',
      whyItMatters:
        'Spread capture is the core revenue mechanic of a market-making ' +
        'desk; it isolates the margin the desk keeps from intermediation ' +
        'from the P&L swings of directional market moves.',
    },
    {
      key: 'quote_to_trade_ratio',
      name: 'Quote-to-trade ratio',
      definition:
        'The number of quotes or price requests the desk responds to for ' +
        'every quote that converts into an executed trade — the efficiency ' +
        'of the price-making effort.',
      unit: 'quotes per executed trade',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 4,
        high: 30,
        basis:
          'Quote-to-trade ratios vary sharply by asset class and venue — ' +
          'electronic RFQ markets run high, relationship voice business ' +
          'far lower. A planning range, set by the channel and product ' +
          'mix.',
        label: 'planning-range',
      },
      dataSource:
        'Request-for-quote and order-management system logs reconciled ' +
        'against executed-trade records.',
      whyItMatters:
        'A high or rising ratio signals the desk is quoting uncompetitively ' +
        'or being adversely selected — pricing effort and risk exposure ' +
        'spent on flow that never converts.',
    },
    {
      key: 'fill_rate',
      name: 'Client fill rate',
      definition:
        'The share of client orders or quote requests the desk fills at or ' +
        'inside the quoted price rather than rejecting, last-looking away, ' +
        'or filling at a worse level.',
      unit: '% of client orders filled at quoted price',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 98,
        basis:
          'Fill rates depend on pricing competitiveness, last-look policy, ' +
          'and risk appetite; a tight, well-priced book fills higher. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The execution-management system, comparing quoted prices against ' +
        'order outcomes and rejection reasons.',
      whyItMatters:
        'Fill rate is the client-facing read on whether the desk is a ' +
        'reliable liquidity provider; a low rate erodes client flow, the ' +
        'lifeblood of a market-making franchise.',
    },
    {
      key: 'trade_break_rate',
      name: 'Trade-break rate',
      definition:
        'The share of executed trades that do not match between the desk, ' +
        'the counterparty, and the trade-capture system on first ' +
        'reconciliation and require manual investigation to resolve.',
      unit: '% of trades breaking on first reconciliation',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 8,
        basis:
          'Trade-break rates depend on capture automation, product ' +
          'complexity, and the share of voice trades; structured and ' +
          'voice flow breaks more. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Trade-capture and reconciliation systems, comparing the desk ' +
        'record against counterparty and clearing-house confirmations.',
      whyItMatters:
        'Every break is rework, settlement-fail risk, and a window where ' +
        'true P&L and risk are unknown; the break rate is the leading ' +
        'indicator of operational cost and operational risk in the ' +
        'lifecycle.',
    },
    {
      key: 'settlement_fail_rate',
      name: 'Settlement-fail rate',
      definition:
        'The share of trades that do not settle on the contractual ' +
        'settlement date because securities or cash are not delivered as ' +
        'agreed.',
      unit: '% of trades failing to settle on date',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Settlement-fail rates vary by market, asset class, and the ' +
          'shortened settlement cycle; less liquid securities fail more. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The settlement and custody systems reconciled against ' +
        'central-securities-depository and clearing confirmations.',
      whyItMatters:
        'Settlement fails carry penalty charges, funding cost, and ' +
        'counterparty risk, and under settlement-discipline regimes they ' +
        'are directly fined — a fail is leaked P&L and a regulatory flag.',
    },
    {
      key: 'straight_through_processing_rate',
      name: 'Straight-through-processing rate',
      definition:
        'The share of executed trades that flow from capture through ' +
        'enrichment, allocation, confirmation, and settlement instruction ' +
        'with no manual intervention.',
      unit: '% of trades processed without manual touch',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 98,
        basis:
          'Straight-through-processing rates depend on product ' +
          'standardisation and capture quality; vanilla electronic flow ' +
          'runs high, structured and voice flow lower. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The trade-processing and middle-office workflow systems, tracking ' +
        'manual-intervention touchpoints per trade.',
      whyItMatters:
        'Straight-through processing is the efficiency ratio of the trade ' +
        'lifecycle; every manual touch is cost, delay, and an opportunity ' +
        'for a break or a fail.',
    },
    {
      key: 'value_at_risk_utilization',
      name: 'Value-at-risk limit utilisation',
      definition:
        'The desk’s measured value-at-risk as a share of its assigned ' +
        'value-at-risk limit — how much of its sanctioned market-risk ' +
        'budget the desk is consuming.',
      unit: '% of assigned VaR limit consumed',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 40,
        high: 85,
        basis:
          'Healthy VaR utilisation sits in a deliberate band — too low ' +
          'wastes risk-taking capacity, too high leaves no buffer for ' +
          'client flow or a market move. A planning range, set by risk ' +
          'appetite.',
        label: 'planning-range',
      },
      dataSource:
        'The market-risk system, comparing daily computed VaR against the ' +
        'desk’s approved limit.',
      whyItMatters:
        'VaR utilisation is the read on whether the desk is using its ' +
        'risk budget productively; persistent breaches signal risk drift, ' +
        'persistent under-use signals capital allocated but not earning.',
    },
    {
      key: 'limit_breach_frequency',
      name: 'Risk-limit breach frequency',
      definition:
        'The number of times per period the desk’s positions breach an ' +
        'approved market-risk, concentration, or sensitivity limit and ' +
        'require escalation and remediation.',
      unit: 'limit breaches per month',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0,
        high: 6,
        basis:
          'Breach frequency depends on limit calibration, market ' +
          'volatility, and desk discipline; a well-run desk on calm ' +
          'markets sits near the floor. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The market-risk and limit-monitoring system breach log with ' +
        'escalation records.',
      whyItMatters:
        'Breach frequency is the read on risk discipline; clustered or ' +
        'rising breaches signal limits that are mis-calibrated or a desk ' +
        'taking risk beyond its sanctioned mandate.',
    },
    {
      key: 'rwa_efficiency',
      name: 'Risk-weighted-asset efficiency',
      definition:
        'Trading revenue earned per unit of risk-weighted assets the desk ' +
        'consumes — how productively the desk uses the regulatory capital ' +
        'allocated to it.',
      unit: 'revenue per unit of RWA (annualised %)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 4,
        high: 14,
        basis:
          'RWA efficiency varies with product mix, capital model, and ' +
          'balance-sheet velocity; capital-light flow desks run higher ' +
          'than balance-sheet-heavy structured desks. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Desk P&L reconciled against the risk-weighted-asset and ' +
        'capital-attribution reporting from finance and risk.',
      whyItMatters:
        'Capital is the scarcest resource on a trading floor; RWA ' +
        'efficiency is how the franchise judges whether a desk earns its ' +
        'balance-sheet allocation or should hand the capital elsewhere.',
    },
    {
      key: 'execution_slippage',
      name: 'Execution slippage versus benchmark',
      definition:
        'The difference between the price achieved on client and hedging ' +
        'orders and the arrival or benchmark price, capturing market ' +
        'impact and timing cost.',
      unit: 'basis points versus arrival / benchmark price',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 25,
        basis:
          'Slippage varies enormously with order size, liquidity, and ' +
          'urgency; small liquid orders sit near the floor, large illiquid ' +
          'orders far higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Transaction-cost-analysis reporting comparing fill prices against ' +
        'arrival-price and benchmark references.',
      whyItMatters:
        'Slippage is the measurable cost of execution quality; it is the ' +
        'core evidence in any best-execution review and a direct drag on ' +
        'both client outcomes and desk hedging P&L.',
    },
    {
      key: 'hedge_effectiveness',
      name: 'Hedge effectiveness',
      definition:
        'The share of the desk’s targeted risk exposure that is actually ' +
        'neutralised by its hedges, measured as the reduction in residual ' +
        'risk against the unhedged position.',
      unit: '% of targeted risk neutralised by hedges',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 97,
        basis:
          'Hedge effectiveness depends on basis risk, hedge instrument ' +
          'availability, and how promptly hedges are placed; liquid ' +
          'one-for-one hedges sit higher. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The market-risk system, comparing residual risk after hedging ' +
        'against the gross unhedged exposure.',
      whyItMatters:
        'Incomplete or slow hedging leaves the desk carrying directional ' +
        'risk it did not intend; hedge effectiveness shows whether ' +
        'intermediation P&L is being kept clean of unwanted market bets.',
    },
    {
      key: 'surveillance_alert_precision',
      name: 'Trade-surveillance alert precision',
      definition:
        'The share of trade-surveillance alerts that, on review, are ' +
        'genuine items of concern rather than false positives closed with ' +
        'no action.',
      unit: '% of alerts that are true positives',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 25,
        basis:
          'Surveillance alert precision is structurally low — rule-based ' +
          'systems generate heavy false-positive volume; the band spans a ' +
          'noisy legacy system to a well-tuned one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The trade-surveillance system alert log reconciled against ' +
        'investigator disposition outcomes.',
      whyItMatters:
        'Low precision drowns surveillance analysts in noise, raising the ' +
        'cost of compliance and the risk that a genuine market-abuse ' +
        'signal is missed in the false-positive flood.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'stale_slow_pricing',
      name: 'Stale or slow price-making',
      description:
        'The desk quotes off prices that lag the live market or are ' +
        'produced too slowly to compete electronically. It is adversely ' +
        'selected — picked off when its quote is wrong — and loses ' +
        'profitable flow when its quote is uncompetitive but right.',
      detectionSignal:
        'The quote-to-trade ratio is high and rising, spread capture is ' +
        'thin, and fill rates fall against faster electronic competitors.',
      diagnosticQuestion:
        'How fast and how market-aware is the desk’s price-making, and ' +
        'where is it being adversely selected or losing flow to faster ' +
        'competitors?',
    },
    {
      key: 'trade_break_drag',
      name: 'Trade-break and reconciliation drag',
      description:
        'A material share of trades break between the desk, the ' +
        'counterparty, and the trade-capture system. Middle-office staff ' +
        'spend their day investigating breaks instead of controlling risk, ' +
        'and the desk’s true position is uncertain until breaks clear.',
      detectionSignal:
        'The trade-break rate is high, break ageing grows, and ' +
        'straight-through-processing rates are low — middle-office ' +
        'headcount scales with trade volume.',
      diagnosticQuestion:
        'What share of trades break on first reconciliation, how long do ' +
        'breaks take to resolve, and what does the break investigation ' +
        'cost the operation?',
    },
    {
      key: 'settlement_fail_leakage',
      name: 'Settlement-fail leakage',
      description:
        'Trades fail to settle on date because securities or cash are not ' +
        'delivered, triggering penalty charges, funding cost, and ' +
        'counterparty exposure — and under settlement-discipline regimes, ' +
        'direct regulatory fines on every fail.',
      detectionSignal:
        'The settlement-fail rate sits above peer ranges, fail penalties ' +
        'appear in desk costs, and the same counterparties and securities ' +
        'fail repeatedly.',
      diagnosticQuestion:
        'What is the settlement-fail rate, what does it cost in penalties ' +
        'and funding, and which counterparties or instruments drive the ' +
        'fails?',
    },
    {
      key: 'risk_limit_drift',
      name: 'Risk-limit drift and late detection',
      description:
        'Position risk drifts past sanctioned limits and the breach is ' +
        'detected only in an end-of-day risk run, hours after the ' +
        'exposure was taken — too late to act before the market has ' +
        'moved against an over-sized position.',
      detectionSignal:
        'Limit breaches are detected end-of-day rather than intraday, ' +
        'breach frequency is high, and remediation happens after the loss ' +
        'rather than before it.',
      diagnosticQuestion:
        'How quickly are risk-limit breaches detected — intraday or only ' +
        'in an overnight batch — and how often is action taken too late?',
    },
    {
      key: 'inefficient_capital_use',
      name: 'Inefficient balance-sheet and capital use',
      description:
        'The desk consumes regulatory capital and balance sheet without a ' +
        'clear view of the capital cost of each position or client. ' +
        'Capital-heavy, low-return trades crowd out capital-light ' +
        'franchise flow, and RWA efficiency erodes.',
      detectionSignal:
        'RWA efficiency is low or falling, capital is not attributed to ' +
        'the trade or client level, and pricing does not reflect the ' +
        'capital a position consumes.',
      diagnosticQuestion:
        'Does the desk see the capital and balance-sheet cost of each ' +
        'position and client, and does pricing reflect it?',
    },
    {
      key: 'best_execution_gap',
      name: 'Best-execution and execution-quality gap',
      description:
        'The desk cannot demonstrate, trade by trade, that it executed ' +
        'client orders on the best available terms. Execution slippage is ' +
        'high or unmeasured, and the best-execution evidence file is ' +
        'assembled reactively when a regulator or client asks.',
      detectionSignal:
        'Execution slippage is high or not systematically measured, ' +
        'transaction-cost analysis is partial, and best-execution ' +
        'reporting is manual and after-the-fact.',
      diagnosticQuestion:
        'Can the desk prove best execution trade by trade with ' +
        'transaction-cost evidence, or is the best-execution file ' +
        'assembled reactively?',
    },
    {
      key: 'surveillance_false_positive_flood',
      name: 'Surveillance false-positive flood',
      description:
        'Rule-based trade surveillance generates a flood of low-precision ' +
        'alerts. Analysts spend their time clearing false positives, the ' +
        'cost of the surveillance operation scales with volume, and a ' +
        'genuine market-abuse signal can be lost in the noise.',
      detectionSignal:
        'Surveillance alert precision is very low, the alert backlog ' +
        'grows, and surveillance headcount scales directly with trade ' +
        'volume.',
      diagnosticQuestion:
        'What share of surveillance alerts are true positives, and how ' +
        'much analyst effort is spent clearing noise rather than ' +
        'investigating genuine concern?',
    },
    {
      key: 'fragmented_desk_data',
      name: 'Fragmented desk and risk data',
      description:
        'Pricing, position, risk, capital, and client data sit in ' +
        'separate desk systems on different timing. No one sees a ' +
        'consolidated, real-time view of risk and P&L, so decisions are ' +
        'made on partial or stale pictures.',
      detectionSignal:
        'Risk and P&L are reconciled across systems manually, intraday ' +
        'views lag the market, and the same position shows different ' +
        'numbers in different tools.',
      diagnosticQuestion:
        'Is there a single, timely view of position, risk, P&L, and ' +
        'capital across the desk, or is it stitched together manually ' +
        'from fragmented systems?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_assisted_pricing_quoting',
      name: 'AI-assisted pricing and quoting',
      valueMechanism:
        'A model produces fast, market-aware indicative prices and skews ' +
        'by reading live market data, the desk’s inventory and risk, and ' +
        'client context, so traders quote competitively and quickly ' +
        'without being adversely selected. Value comes from tighter, ' +
        'faster quotes that win profitable flow and from skew that reflects ' +
        'real inventory risk — lifting spread capture and fill rates.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Live and historical market data — prices, depth, volatility',
        'The desk’s current inventory, position, and risk state',
        'Client tiering, flow history, and request context',
        'Hedge-instrument prices and the cost of hedging the position',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes indicative prices and skews; a trader owns the ' +
          'final quote and any large or non-standard ticket.',
        'Pricing models must respect risk limits, inventory caps, and ' +
          'price-sanity guardrails so a model error cannot publish an ' +
          'off-market quote.',
        'Market regime shifts — volatility spikes, liquidity gaps — must ' +
          'be detected and the model widened or stood down, not left to ' +
          'quote into a dislocated market.',
      ],
      metricsMoved: [
        'bid_offer_spread_capture',
        'quote_to_trade_ratio',
        'fill_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'intelligent_trade_break_resolution',
      name: 'Intelligent trade-break detection and resolution',
      valueMechanism:
        'An agent reconciles trade records across the desk, the ' +
        'counterparty, and the trade-capture system, classifies each break ' +
        'by likely cause, and proposes or auto-applies the matching ' +
        'correction for the routine ones. Value comes from resolving ' +
        'breaks faster and earlier in the lifecycle — cutting middle-office ' +
        'rework, lifting straight-through processing, and reducing the ' +
        'breaks that age into settlement fails.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Trade-capture, counterparty, and clearing-house trade records',
        'Historical break cases with their root causes and resolutions',
        'Reference and static data — instruments, counterparties, accounts',
        'Reconciliation match and tolerance rules',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent classifies breaks and drafts corrections; a ' +
          'middle-office analyst approves any economic correction to a ' +
          'trade record.',
        'Auto-resolution is confined to non-economic, high-confidence ' +
          'breaks — a static-data mismatch — never a difference in price, ' +
          'quantity, or counterparty.',
        'Every automated correction is logged with an audit trail so the ' +
          'desk’s books-and-records integrity is preserved.',
      ],
      metricsMoved: [
        'trade_break_rate',
        'straight_through_processing_rate',
        'settlement_fail_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'settlement_fail_prediction',
      name: 'Predictive settlement-fail prevention',
      valueMechanism:
        'A model scores trades after execution for the risk of failing to ' +
        'settle — by counterparty, instrument liquidity, and inventory ' +
        'position — so the operations team pre-positions securities, ' +
        'arranges borrows, or chases instructions before the settlement ' +
        'date. Value comes from moving fail handling from after-the-fact ' +
        'penalty payment to pre-settlement prevention.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Historical settlement outcomes with fail reasons by counterparty',
        'Open-trade settlement pipeline and instruction status',
        'Securities-inventory and stock-lending availability data',
        'Counterparty settlement-performance history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model flags fail risk and recommends pre-positioning; ' +
          'operations staff own the borrow, the funding, and the ' +
          'counterparty contact.',
        'A predicted fail must be explainable to a cause the operations ' +
          'team can act on — a missing instruction, an inventory short.',
        'The model must be revalidated as settlement-cycle rules and ' +
          'market practice change so it does not score against stale ' +
          'assumptions.',
      ],
      metricsMoved: [
        'settlement_fail_rate',
        'straight_through_processing_rate',
        'trade_break_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'realtime_risk_limit_monitoring',
      name: 'Real-time risk and limit monitoring',
      valueMechanism:
        'An agent computes intraday risk and limit utilisation ' +
        'continuously across the desk’s positions, detects drift toward a ' +
        'limit before it is breached, and alerts the trader and risk ' +
        'manager with the drivers. Value comes from catching risk drift ' +
        'while it can still be acted on — cutting limit breaches and the ' +
        'losses that come from an over-sized position discovered too late.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Real-time position and trade feeds across the desk’s books',
        'Market data and risk-factor sensitivities for revaluation',
        'The desk’s approved risk, concentration, and sensitivity limits',
        'Historical breach patterns and their drivers',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent monitors and alerts; the trader and risk manager own ' +
          'the decision to reduce, hedge, or escalate a position.',
        'Intraday risk numbers must be reconciled against the official ' +
          'end-of-day risk run so the desk does not act on a divergent ' +
          'intraday model.',
        'Alert thresholds must be calibrated to avoid an alert flood that ' +
          'desensitises the desk to genuine limit-drift warnings.',
      ],
      metricsMoved: [
        'limit_breach_frequency',
        'value_at_risk_utilization',
        'hedge_effectiveness',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'best_execution_analytics',
      name: 'Best-execution and transaction-cost analytics',
      valueMechanism:
        'A model runs transaction-cost analysis across every client and ' +
        'hedging order — measuring slippage against arrival and benchmark ' +
        'prices, attributing cost to venue, timing, and size, and ' +
        'assembling the best-execution evidence file. Value comes from ' +
        'measurable improvement in execution quality and from a defensible, ' +
        'always-current best-execution record.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Order and execution records with timestamps and venue data',
        'Market data for arrival-price and benchmark reconstruction',
        'Venue and liquidity-source performance history',
        'The best-execution policy and its measurement criteria',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model measures and attributes execution cost; the desk and ' +
          'compliance own the best-execution policy and any exception ' +
          'judgement.',
        'Benchmark and arrival-price reconstruction must be methodologically ' +
          'sound — a flawed benchmark produces a misleading slippage ' +
          'number that misdirects both the desk and the regulator.',
        'The evidence file must be complete and tamper-evident so it ' +
          'withstands regulatory and client scrutiny.',
      ],
      metricsMoved: [
        'execution_slippage',
        'fill_rate',
        'bid_offer_spread_capture',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'ai_trade_surveillance',
      name: 'AI-augmented trade surveillance',
      valueMechanism:
        'A model scores trading activity and trader communications for ' +
        'genuine market-abuse risk — spoofing, front-running, insider ' +
        'patterns — ranking alerts by likelihood and suppressing the ' +
        'rule-based false positives. Value comes from lifting alert ' +
        'precision so analysts investigate real concern, cutting the cost ' +
        'of surveillance and reducing the risk that genuine abuse is ' +
        'missed.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Trade, order, and quote activity across the desk',
        'Trader electronic communications and voice transcripts',
        'Historical investigated cases with their dispositions',
        'Market data to contextualise the activity around an alert',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The model ranks and contextualises alerts; a surveillance ' +
          'analyst investigates and a compliance officer owns any ' +
          'finding or regulatory filing.',
        'Suppressed alerts must be sampled and audited — the model must ' +
          'never silently close a genuine market-abuse signal, and ' +
          'regulators expect every rule-based alert to remain accountable.',
        'Communications surveillance carries privacy and employee-monitoring ' +
          'obligations that govern what data the model may use and how.',
      ],
      metricsMoved: [
        'surveillance_alert_precision',
        'limit_breach_frequency',
      ],
      relatedArchetypePlaybook: 'document_intelligence',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'inventory_aware_pricing_layer',
      name: 'Inventory-aware pricing-and-quoting layer',
      description:
        'A pattern that produces indicative prices and skews from live ' +
        'market data, the desk’s inventory and risk state, and client ' +
        'context, and serves them into the quoting workflow within ' +
        'price-sanity and risk-limit guardrails — so the desk quotes fast ' +
        'and competitively without being adversely selected.',
      boundary:
        'It produces indicative prices and skews within guardrails; a ' +
        'trader owns every published quote and every large or ' +
        'non-standard ticket. It does not execute or commit risk ' +
        'autonomously.',
      humanAccountabilityPoint:
        'The desk head accountable for pricing, spread capture, and the ' +
        'risk the desk takes on.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'automated_trade_lifecycle_layer',
      name: 'Automated trade-lifecycle and break-resolution layer',
      description:
        'A pattern that reconciles trades across the desk, counterparties, ' +
        'and clearing systems, classifies breaks by cause, auto-resolves ' +
        'the routine non-economic ones, and routes economic breaks to a ' +
        'middle-office analyst — lifting straight-through processing and ' +
        'cutting the breaks that age into settlement fails.',
      boundary:
        'It reconciles, classifies, and auto-resolves non-economic ' +
        'breaks; a middle-office analyst approves every economic ' +
        'correction. It does not amend trade economics autonomously.',
      humanAccountabilityPoint:
        'The middle-office operations manager accountable for trade-break ' +
        'resolution and books-and-records integrity.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'realtime_risk_control_layer',
      name: 'Real-time risk-and-limit control layer',
      description:
        'A pattern that computes intraday risk and limit utilisation ' +
        'continuously across the desk’s books, detects drift toward a ' +
        'limit before a breach, and alerts the trader and risk manager ' +
        'with the drivers — moving limit control from an overnight batch ' +
        'to an intraday discipline.',
      boundary:
        'It monitors, computes, and alerts; the trader and the risk ' +
        'manager own the decision to reduce, hedge, or escalate. It does ' +
        'not cut positions or place hedges autonomously.',
      humanAccountabilityPoint:
        'The desk risk manager accountable for limit compliance and the ' +
        'desk’s risk profile.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'execution_quality_evidence_layer',
      name: 'Execution-quality and best-execution evidence layer',
      description:
        'A pattern that runs transaction-cost analysis across every ' +
        'client and hedging order, attributes execution cost to venue, ' +
        'timing, and size, and maintains an always-current, tamper-evident ' +
        'best-execution evidence file — so execution quality is measured ' +
        'and best execution is demonstrable on demand.',
      boundary:
        'It measures, attributes, and evidences execution quality; the ' +
        'desk and compliance own the best-execution policy and any ' +
        'exception judgement. It does not route orders autonomously.',
      humanAccountabilityPoint:
        'The head of execution accountable for best execution and ' +
        'execution-quality outcomes.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'risk_ranked_surveillance_layer',
      name: 'Risk-ranked trade-surveillance layer',
      description:
        'A pattern that scores trading activity and communications for ' +
        'genuine market-abuse risk, ranks alerts by likelihood, suppresses ' +
        'rule-based false positives with a sampled audit, and presents ' +
        'analysts with contextualised, prioritised cases — concentrating ' +
        'surveillance effort on real concern.',
      boundary:
        'It scores, ranks, and contextualises alerts; a surveillance ' +
        'analyst investigates and a compliance officer owns every finding ' +
        'and regulatory filing. It does not close a genuine alert ' +
        'autonomously.',
      humanAccountabilityPoint:
        'The head of compliance surveillance accountable for market-abuse ' +
        'detection and regulatory reporting.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'document_intelligence',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Capital-markets value is realised in three distinct ways and a ' +
      'forecast must keep them separate. First, revenue uplift on the ' +
      'desk: faster, better-skewed pricing wins profitable flow and lifts ' +
      'spread capture and fill rates — a recurring revenue gain, but the ' +
      'most fragile, because it depends on market regime and competitor ' +
      'behaviour the desk does not control. Second, operational-cost and ' +
      'loss reduction in the lifecycle: fewer trade breaks, fewer ' +
      'settlement fails, and higher straight-through processing remove ' +
      'middle-office rework, fail penalties, and funding cost — a recurring ' +
      'gain that is far more controllable. Third, capital and risk ' +
      'efficiency: tighter intraday risk control and clearer capital ' +
      'attribution let the desk earn more return per unit of RWA and avoid ' +
      'the losses of a late-detected limit breach — value that shows up in ' +
      'risk-adjusted return, not gross revenue. The dominant constraint is ' +
      'that trading P&L is volatile and regime-dependent: a model that ' +
      'helps in a calm market can be stood down in a dislocated one, so a ' +
      'forecast must be read against market conditions and never ' +
      'annualised off a benign period.',
    dominantHaircutFactors: [
      {
        factor: 'Market regime and revenue volatility',
        rationale:
          'Pricing and spread-capture gains depend on market liquidity, ' +
          'volatility, and competitor behaviour the desk does not ' +
          'control. A model that wins flow in a calm market is widened or ' +
          'stood down in a dislocated one, so the revenue-uplift forecast ' +
          'is heavily haircut by regime uncertainty.',
        typicalHaircut: {
          low: 0.25,
          high: 0.55,
          basis:
            'Value erosion from market-regime dependence and trading-' +
            'revenue volatility; a planning range that widens with ' +
            'expected volatility.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data latency, quality, and reference-data integrity',
        rationale:
          'Pricing, break resolution, and intraday risk all depend on ' +
          'timely, clean market, position, and reference data. Latency, ' +
          'gaps, and stale static data cap how much of the modelled gain ' +
          'is reachable and can make a model unsafe to run.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from data latency, quality, and reference-' +
            'data gaps; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Trader and middle-office adoption',
        rationale:
          'The operational and capital gains only land if traders quote ' +
          'off the model and middle-office staff are redeployed from the ' +
          'work the automation removes. A desk that runs the tool ' +
          'alongside the old process realises a fraction of the saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from partial trader and middle-office ' +
            'adoption and incomplete redeployment; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Regulatory and model-governance constraints',
        rationale:
          'Trading models operate under best-execution, market-abuse, ' +
          'and model-risk-management rules. Validation, explainability, ' +
          'and sampled-audit requirements bound how autonomously a model ' +
          'may run and haircut the modelled efficiency gain.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled gain not reachable within model-risk ' +
            'and market-conduct governance; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Spread-capture and fill-rate uplift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative uplift in realised spread capture from faster, ' +
            'better-skewed pricing; a planning range spanning early and ' +
            'mature adoption, read against market regime.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in realised bid-offer spread capture.',
      },
      {
        lever: 'Trade-break and processing-cost reduction',
        range: {
          low: 20,
          high: 50,
          basis:
            'Relative reduction in trade-break volume and middle-office ' +
            'processing cost from automated reconciliation and break ' +
            'resolution; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in trade-break volume and the ' +
          'associated processing cost.',
      },
      {
        lever: 'Settlement-fail and penalty reduction',
        range: {
          low: 15,
          high: 45,
          basis:
            'Relative reduction in settlement fails and the associated ' +
            'penalty and funding cost from predictive fail prevention; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in settlement-fail rate and fail ' +
          'penalty cost.',
      },
      {
        lever: 'RWA-efficiency improvement',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative improvement in revenue per unit of risk-weighted ' +
            'assets from clearer capital attribution and tighter risk ' +
            'control; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in trading revenue per unit of ' +
          'risk-weighted assets.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measurable operational signal (trade-break ' +
      'rate, straight-through processing, intraday-risk coverage); 9–18 ' +
      'months to a settled result, because spread-capture and ' +
      'RWA-efficiency gains must be observed across a full range of ' +
      'market conditions before they can be trusted, not annualised off a ' +
      'single benign quarter.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Order- and execution-management system (OMS/EMS)',
        role:
          'The front-office system of record for orders, quotes, and ' +
          'executions — where client flow is received, priced, routed, ' +
          'and filled across venues.',
        examples: [
          'Charles River',
          'Bloomberg AIM / TOMS',
          'FlexTrade',
          'in-house execution platforms',
        ],
      },
      {
        name: 'Trading book / risk-and-P&L system',
        role:
          'Holds the desk’s positions, computes risk and P&L, and is the ' +
          'system of record for inventory and the desk’s mark-to-market.',
        examples: [
          'Murex',
          'Calypso',
          'FIS Front Arena',
          'in-house trading-book systems',
        ],
      },
      {
        name: 'Trade-capture and middle-office processing system',
        role:
          'Captures executed trades, enriches and allocates them, manages ' +
          'confirmations, and drives the trade through the lifecycle to ' +
          'settlement.',
        examples: [
          'Murex middle-office',
          'Calypso processing',
          'trade-confirmation platforms',
        ],
      },
      {
        name: 'Market-risk and limit-monitoring system',
        role:
          'Computes value-at-risk and risk sensitivities, monitors limit ' +
          'utilisation, and logs and escalates limit breaches.',
        examples: [
          'in-house VaR and risk engines',
          'vendor market-risk platforms',
          'limit-monitoring and risk-aggregation tools',
        ],
      },
      {
        name: 'Settlement, clearing, and trade-surveillance systems',
        role:
          'Generate settlement instructions and reconcile against ' +
          'central-securities-depository and clearing-house records, and ' +
          'monitor trading activity for market-abuse risk.',
        examples: [
          'settlement and custody platforms',
          'central-clearing-counterparty connections',
          'trade-surveillance systems (e.g. NICE Actimize, SteelEye)',
        ],
      },
    ],
    roles: [
      {
        title: 'Head of sales & trading / desk head',
        accountability:
          'Owns the desk’s revenue, risk appetite, and the franchise — ' +
          'pricing, client flow, and the risk the desk takes on.',
      },
      {
        title: 'Market-maker / trader',
        accountability:
          'Owns price-making, quoting, position and inventory management, ' +
          'and hedging within assigned risk limits.',
      },
      {
        title: 'Desk market-risk manager',
        accountability:
          'Owns limit setting and monitoring, value-at-risk, and the ' +
          'desk’s compliance with its risk mandate.',
      },
      {
        title: 'Middle-office / trade-support manager',
        accountability:
          'Owns trade capture, break resolution, confirmations, and the ' +
          'straight-through processing of the trade lifecycle.',
      },
      {
        title: 'Settlement and operations manager',
        accountability:
          'Owns settlement instruction, fail management, clearing, and ' +
          'reconciliation against depositories and clearing houses.',
      },
      {
        title: 'Compliance surveillance officer',
        accountability:
          'Owns trade and communications surveillance, market-abuse ' +
          'detection, and regulatory reporting of conduct concerns.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'MiFID II / best-execution and transaction-reporting rules',
        relevance:
          'Require the desk to take all sufficient steps to obtain the ' +
          'best result for clients, evidence execution quality, and ' +
          'report transactions — the frame any pricing or execution use ' +
          'case must satisfy.',
      },
      {
        name: 'The Volcker Rule and proprietary-trading restrictions',
        relevance:
          'Restrict proprietary trading and require desks to evidence ' +
          'that activity is permitted market-making or hedging — shaping ' +
          'how inventory and risk-taking are governed and documented.',
      },
      {
        name: 'Basel market-risk capital rules (FRTB)',
        relevance:
          'Set how trading-book risk is translated into regulatory ' +
          'capital and risk-weighted assets — the frame that makes ' +
          'capital efficiency and RWA the binding constraint on the desk.',
      },
      {
        name: 'Market-abuse and trade-surveillance regulation',
        relevance:
          'Prohibit market manipulation, spoofing, and insider dealing ' +
          'and require effective surveillance — the frame governing any ' +
          'surveillance use case and the desk’s conduct controls.',
      },
      {
        name: 'Settlement-discipline regimes (e.g. CSDR) and clearing ' +
          'mandates',
        relevance:
          'Impose penalties for settlement fails and mandate central ' +
          'clearing for eligible products — making fail prevention and ' +
          'clean lifecycle processing a direct regulatory and cost issue.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Bid-offer spread',
        definition:
          'The difference between the price at which the desk will buy ' +
          'and the price at which it will sell — the core margin a ' +
          'market-maker earns for providing liquidity.',
      },
      {
        term: 'Market-making',
        definition:
          'Continuously quoting two-way prices and standing ready to ' +
          'trade, intermediating client flow by taking the other side ' +
          'into the desk’s inventory.',
      },
      {
        term: 'Trade break',
        definition:
          'A mismatch between the desk’s record of a trade and the ' +
          'counterparty or system record that must be investigated and ' +
          'resolved before the trade can settle.',
      },
      {
        term: 'Settlement fail',
        definition:
          'A trade that does not settle on the contractual settlement ' +
          'date because securities or cash are not delivered as agreed.',
      },
      {
        term: 'Value-at-risk (VaR)',
        definition:
          'A statistical estimate of the loss a portfolio could suffer ' +
          'over a horizon at a given confidence level — the headline ' +
          'market-risk measure and limit basis.',
      },
      {
        term: 'Risk-weighted assets (RWA)',
        definition:
          'A regulatory measure of a position’s risk used to size the ' +
          'capital the desk must hold against it — the scarce resource a ' +
          'desk’s return is judged on.',
      },
      {
        term: 'Straight-through processing (STP)',
        definition:
          'The processing of a trade from capture through settlement ' +
          'with no manual intervention.',
      },
      {
        term: 'Best execution',
        definition:
          'The obligation to take all sufficient steps to obtain the ' +
          'best available result for a client order across price, cost, ' +
          'speed, and likelihood of execution.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Capital Markets & Trading Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the trading desk is leaking return — on the desk ' +
        'through pricing and risk, in the lifecycle through breaks and ' +
        'fails, or to capital and the regulator — with baseline evidence, ' +
        'before a solution is shaped.',
      sections: [
        {
          heading: 'Desk and market context',
          guidance:
            'Name the desks and asset classes in scope, the product mix, ' +
            'the electronic-versus-voice channel split, the client ' +
            'franchise, and the balance sheet and capital the desk is ' +
            'allocated. State which OMS/EMS, trading-book, trade-capture, ' +
            'and market-risk systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — spread capture, quote-to-trade ratio, ' +
            'fill rate, trade-break rate, settlement-fail rate, ' +
            'straight-through processing, VaR utilisation, limit-breach ' +
            'frequency, RWA efficiency, execution slippage, hedge ' +
            'effectiveness, surveillance precision. For any metric not ' +
            'recorded, name it as a precise seed gap with its data source.',
        },
        {
          heading: 'P&L, break, and fail analysis',
          guidance:
            'Break down where return is leaking — separate spread capture ' +
            'from directional P&L, quantify trade-break and settlement-' +
            'fail cost and penalties, and locate which desks, products, ' +
            'and counterparties drive the operational loss.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — stale pricing, trade-break ' +
            'drag, settlement-fail leakage, risk-limit drift, inefficient ' +
            'capital use, best-execution gap, surveillance false-positive ' +
            'flood, fragmented desk data — and state which are present, ' +
            'with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — desk revenue uplift, lifecycle cost and ' +
            'loss reduction, capital efficiency — explicitly haircut by ' +
            'market regime, data quality, and adoption. Every figure a ' +
            'labelled planning range, read against market conditions.',
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
      label: 'Capital Markets & Trading Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a capital-markets ' +
        'AI Move on this desk — baseline, forecast, cost, and the honest, ' +
        'regime-aware downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'desk revenue uplift, lifecycle cost and loss reduction, and ' +
            'capital efficiency, the time-to-value band, and the go / ' +
            'hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — spread capture, trade-break rate, settlement-fail ' +
            'rate, RWA efficiency. Where a baseline is a seed gap, say so ' +
            'and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — market regime, ' +
            'data latency and quality, trader and middle-office adoption, ' +
            'model governance — explicitly and show the haircut math. ' +
            'Keep regime-dependent revenue uplift separate from the more ' +
            'controllable cost and loss reduction.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the OMS/EMS, ' +
            'trading-book, trade-capture, and market-risk systems, the ' +
            'market-data feeds, and the operating-model change — ' +
            'middle-office redeployment from the work the automation ' +
            'removes.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a stressed market regime, ' +
            'weaker data quality, and partial adoption. State the downside ' +
            'the CFO is underwriting and never annualise the upside off a ' +
            'single benign quarter.',
        },
        {
          heading: 'Model-risk and conduct posture',
          guidance:
            'State the model-risk-management, validation, and ' +
            'explainability controls, the best-execution and market-abuse ' +
            'conduct posture, and the regulatory frames (MiFID II, ' +
            'Volcker, FRTB, market-abuse and settlement-discipline rules) ' +
            'that bound the design.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence — including ' +
            'tracking spread capture and RWA efficiency across multiple ' +
            'market regimes before the result is called settled.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Capital Markets & Trading Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'capital-markets AI capability, grounded in the function reference ' +
        'patterns and the model-risk and conduct frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — inventory-aware pricing layer, automated ' +
            'trade-lifecycle layer, real-time risk-control layer, ' +
            'execution-quality evidence layer, risk-ranked surveillance ' +
            'layer — and state which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the OMS/EMS, trading-book, trade-capture, ' +
            'market-risk, settlement, and surveillance integrations, the ' +
            'market-data and reference-data feeds, the latency the use ' +
            'cases demand, and how intraday numbers reconcile to the ' +
            'official end-of-day run.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, the ' +
            'price-sanity and risk-limit guardrails, and the escalation ' +
            'path. No archetype ships without a named desk owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how trading, middle-office, settlement, risk, and ' +
            'surveillance workflows change, how middle-office staff are ' +
            'redeployed, and who owns each change.',
        },
        {
          heading: 'Model-risk and responsible-AI controls',
          guidance:
            'State the model-validation, monitoring, and explainability ' +
            'controls, the price-sanity and limit guardrails, the ' +
            'best-execution and market-abuse conduct controls, and the ' +
            'regulatory frames (MiFID II, Volcker, FRTB, market-abuse and ' +
            'settlement-discipline rules) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'trading stack, and the phased rollout by desk and use case.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Capital Markets & Trading Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the capital-markets AI capability ' +
        'so value reaches risk-adjusted return, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot desk or product, trader and middle-office onboarding, ' +
            'scale across desks — with milestones tied to the operating ' +
            'metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, market- and reference-data readiness, ' +
            'model validation, trader and middle-office adoption, ' +
            'conduct and surveillance sign-off, Tower measurement.',
        },
        {
          heading: 'Trader and middle-office adoption approach',
          guidance:
            'Define the change runway for traders, middle-office, ' +
            'settlement, and surveillance staff — training, workflow ' +
            'change, the redeployment of capacity the automation frees — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including tracking regime-dependent metrics ' +
            'across multiple market conditions.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — market-regime shifts, data-latency ' +
            'fragility, model drift, conduct exposure, partial adoption — ' +
            'with the escalation owner and the trigger for each.',
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
      claim: 'Spread capture — the margin the desk actually keeps',
      authoritativeSource:
        'The trading book and execution-management system, comparing ' +
        'quoted prices against fill prices net of hedge cost.',
      whatGoodEvidenceLooksLike:
        'Realised spread capture decomposed from directional P&L, ' +
        'measured per asset class and channel, with the hedge cost ' +
        'explicitly netted.',
      weakEvidenceToReject:
        'Gross trading revenue presented as spread capture, or a figure ' +
        'that cannot separate intermediation margin from a directional ' +
        'market bet.',
    },
    {
      claim: 'Trade-break and settlement-fail cost',
      authoritativeSource:
        'Trade-capture, reconciliation, and settlement systems with the ' +
        'break log and the fail-penalty and funding-cost ledger.',
      whatGoodEvidenceLooksLike:
        'Break and fail counts and rates with the penalty, funding, and ' +
        'staffing cost attributed, broken down by product and ' +
        'counterparty.',
      weakEvidenceToReject:
        'A break or fail count with no cost attached, or a cost figure ' +
        'that omits penalties and funding and so understates the leak.',
    },
    {
      claim: 'Risk and limit-utilisation position',
      authoritativeSource:
        'The market-risk system, with computed VaR and limit utilisation ' +
        'reconciled to the official end-of-day risk run.',
      whatGoodEvidenceLooksLike:
        'VaR and limit utilisation by desk with breach history, intraday ' +
        'numbers reconciled against the official end-of-day run.',
      weakEvidenceToReject:
        'An intraday risk number that does not reconcile to the official ' +
        'risk run, or a limit position with no breach history behind it.',
    },
    {
      claim: 'Execution quality and best execution',
      authoritativeSource:
        'Transaction-cost-analysis reporting against reconstructed ' +
        'arrival-price and benchmark references, with the best-execution ' +
        'evidence file.',
      whatGoodEvidenceLooksLike:
        'Slippage measured against a methodologically sound benchmark, ' +
        'attributed to venue, timing, and size, with a complete and ' +
        'tamper-evident best-execution record.',
      weakEvidenceToReject:
        'A best-execution claim with no transaction-cost evidence, or ' +
        'slippage measured against a flawed or self-serving benchmark.',
    },
    {
      claim: 'The forecast value of a capital-markets AI Move',
      authoritativeSource:
        'The value model — desk revenue uplift, lifecycle cost and loss ' +
        'reduction, and capital efficiency, each haircut by its dominant ' +
        'factors — read against market regime.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, regime-dependent revenue kept ' +
        'separate from controllable cost reduction, and every figure a ' +
        'labelled planning range.',
      weakEvidenceToReject:
        'A single-point revenue number annualised off a benign quarter, ' +
        'a vendor ROI claim taken at face value, or a forecast that ' +
        'ignores the market-regime haircut.',
    },
  ],
};
