// Consilium expert — Treasury Transformation (cross-cutting, middle office).
//
// W3 wave2 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting expert for the modernization of corporate treasury: the move
// off spreadsheets and a fragmented bank-portal estate onto a cloud Treasury
// Management System (TMS, e.g. Kyriba / GTreasury / FIS) with AI layered on
// cash & liquidity management, cash forecasting, a payments hub with fraud
// controls, bank connectivity, FX / interest-rate risk, and working capital.
//
// CORE DOCTRINE — VISIBILITY FIRST, THEN FORECAST, THEN CONTROL. Treasury value
// compounds in a strict order: (1) get a single, near-real-time view of cash
// across every bank and entity (the TMS + bank connectivity foundation); (2)
// forecast cash well enough to act on it (the genuinely hard part — accuracy
// degrades fast past a short horizon and AR/AP timing is noisy); (3) control
// the money in motion through a payments hub with layered fraud defenses (the
// part where a single failure is catastrophic, not incremental). Be honest:
// forecast accuracy and payments fraud are where these programs actually live
// or die, and a TMS rollout is a multi-quarter change program — bank
// connectivity, format mapping (BAI2/MT940/ISO 20022), and SOX-grade controls
// are the long pole, not the software license.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const treasuryTransformationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.treasury-transformation",
    expertName: "Treasury Transformation Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "treasury-transformation",
    scopeNote:
      "Cross-cutting modernization of corporate treasury (a middle-office " +
      "function) — moving off spreadsheets and a fragmented bank-portal estate " +
      "onto a cloud Treasury Management System (TMS) with AI on cash & " +
      "liquidity management, cash forecasting, a payments hub with fraud " +
      "controls, bank connectivity, FX / interest-rate risk, and working " +
      "capital. Doctrine is VISIBILITY-then-FORECAST-then-CONTROL, and the " +
      "expert is honest that forecast accuracy and payments fraud are the hard " +
      "parts and a TMS rollout is a real change program, not a software " +
      "install. Excludes financial-institution trading/ALM desks, the FP&A " +
      "planning layer, transactional AP/AR processing, and tax (separate " +
      "experts) — this expert owns the corporate treasurer's money-visibility, " +
      "money-in-motion, and financial-risk agenda.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "cash_forecast_accuracy",
        name: "Cash forecast accuracy",
        definition:
          "One minus the mean absolute percentage error between forecasted and " +
          "actual cash position at a stated horizon (commonly the rolling " +
          "13-week / next-quarter view).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "Treasury surveys (AFP / PwC / treasury practitioner ranges); " +
            "short-horizon (1-4 week) accuracy is high, accuracy degrades fast " +
            "past ~8-13 weeks and varies sharply by AR/AP predictability",
          label: "planning-range",
        },
        dataSource:
          "TMS forecast module vs realized bank-statement actuals (BAI2/MT940/" +
          "camt feeds), back-tested over trailing periods",
        whyItMatters:
          "The single hardest and most decision-relevant treasury metric. " +
          "Accurate forecasts let treasury minimize idle cash, fund shortfalls " +
          "cheaply, and hedge confidently; a weak forecast forces a precautionary " +
          "cash buffer that is pure cost of carry.",
      },
      {
        key: "forecast_horizon_days",
        name: "Reliable forecast horizon",
        definition:
          "The furthest horizon at which the cash forecast still clears the " +
          "treasury's accuracy threshold (e.g. the day-count out to which " +
          "accuracy stays above target).",
        unit: "days",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "Practitioner ranges; daily/weekly horizons are reliable, the " +
            "13-week (~90 day) view is the stretch most treasuries target and " +
            "few hold accuracy across",
          label: "planning-range",
        },
        dataSource:
          "TMS forecast back-testing — accuracy curve by horizon vs realized " +
          "actuals",
        whyItMatters:
          "Visibility is only useful as far out as it is trustworthy. Extending " +
          "the reliable horizon is what unlocks longer-dated investment, " +
          "borrowing, and hedging decisions instead of reactive day-to-day cash " +
          "management.",
      },
      {
        key: "idle_cash_pct",
        name: "Idle / non-yielding cash",
        definition:
          "Share of total cash and equivalents sitting in non-interest-bearing " +
          "or sub-optimally-yielding accounts versus actively invested or swept " +
          "balances.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Treasury practitioner ranges; well-run pooling/sweep structures " +
            "hold idle balances low, fragmented multi-bank estates run high",
          label: "planning-range",
        },
        dataSource:
          "TMS cash-position view across accounts vs investment policy and " +
          "sweep/pooling configuration",
        whyItMatters:
          "Idle cash is foregone yield and a direct, measurable cost of poor " +
          "visibility and forecasting. Every point of idle balance mobilized " +
          "into yield or used to retire debt is hard, attributable value.",
      },
      {
        key: "cash_visibility_pct",
        name: "Cash visibility (auto-fed balances)",
        definition:
          "Share of global bank balances visible in the TMS via automated bank " +
          "feeds within the daily reporting window, versus balances that are " +
          "manual, delayed, or invisible.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 99,
          basis:
            "Treasury survey ranges; mature multi-bank connectivity reaches " +
            "high-90s, fragmented estates with manual portal logins run far lower",
          label: "planning-range",
        },
        dataSource:
          "TMS bank-feed coverage report — accounts with automated statements " +
          "(BAI2/MT940/camt) over total accounts",
        whyItMatters:
          "The foundation metric: you cannot forecast, invest, or control cash " +
          "you cannot see. Visibility gates every downstream treasury capability " +
          "and is the first thing a TMS rollout must deliver.",
      },
      {
        key: "days_cash_on_hand",
        name: "Days cash on hand",
        definition:
          "Cash and equivalents divided by average daily cash operating " +
          "outflows — how many days the firm can fund operations from cash " +
          "without new financing.",
        unit: "days",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "General corporate liquidity ranges; the right level is policy- and " +
            "industry-dependent — too low is fragile, too high is idle capital",
          label: "planning-range",
        },
        dataSource:
          "TMS cash position over modeled daily operating outflow from the " +
          "forecast",
        whyItMatters:
          "The board-level liquidity-resilience gauge. It is an in-range metric, " +
          "not a maximize/minimize one — better forecasting lets treasury hold a " +
          "thinner, safer buffer rather than over-insuring with idle cash.",
      },
      {
        key: "payment_stp_rate",
        name: "Payment straight-through-processing rate",
        definition:
          "Share of outbound payments that originate, validate, route, and " +
          "settle through the payments hub without manual intervention or " +
          "re-keying.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 98,
          basis:
            "Payments-hub maturity ranges; a centralized hub with standardized " +
            "formats reaches the high-90s, fragmented per-bank portal payments " +
            "run far lower",
          label: "planning-range",
        },
        dataSource:
          "Payments hub / TMS payment workflow logs (touched vs untouched " +
          "payment runs)",
        whyItMatters:
          "STP cuts payment operating cost and, more importantly, shrinks the " +
          "manual-handling surface where errors and fraud enter. It is both an " +
          "efficiency and a control metric.",
      },
      {
        key: "payment_fraud_loss_bps",
        name: "Payment fraud loss",
        definition:
          "Realized fraudulent / erroneous payment losses (including " +
          "business-email-compromise and authorized-push-payment fraud) as basis " +
          "points of total payment value processed.",
        unit: "bps",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 5,
          basis:
            "Practitioner ranges; well-controlled payment estates approach zero " +
            "realized loss, but tail events are severe — this is a low-frequency, " +
            "high-severity risk, not a smooth average",
          label: "planning-range",
        },
        dataSource:
          "Payments hub fraud/exception logs, confirmed-fraud loss records, and " +
          "blocked-payment counts",
        whyItMatters:
          "The metric where a single failure is catastrophic, not incremental. " +
          "Average loss looks small precisely because the risk is fat-tailed; " +
          "the goal of payments controls is to prevent the rare large event, not " +
          "shave an average.",
      },
      {
        key: "bank_fee_leakage_pct",
        name: "Bank fee leakage",
        definition:
          "Share of analyzed bank fees found to be erroneous, off-contract, or " +
          "out of line with negotiated pricing (surfaced from bank account " +
          "analysis / EDI 822 / camt.086 statements).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 10,
          basis:
            "Bank-fee-analysis practitioner ranges; unreviewed fee estates " +
            "routinely carry mid-single-digit error/overcharge rates",
          label: "planning-range",
        },
        dataSource:
          "Bank account analysis statements (EDI 822 / camt.086) parsed against " +
          "negotiated fee schedules",
        whyItMatters:
          "A quiet, recurring leak that compounds across hundreds of accounts. " +
          "AI bank-fee analysis surfaces overcharges that no human reconciles " +
          "line by line — a low-risk, fast-payback efficiency win.",
      },
      {
        key: "fx_hedge_coverage_pct",
        name: "FX hedge coverage",
        definition:
          "Share of identified, in-policy FX (or interest-rate) exposure that is " +
          "actively hedged within the treasury risk policy bands.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 50,
          high: 100,
          basis:
            "Treasury risk-policy ranges; target coverage is policy-defined per " +
            "exposure type — both under- and over-hedging are policy breaches, " +
            "not just low coverage",
          label: "planning-range",
        },
        dataSource:
          "TMS exposure-capture and hedge-accounting module vs the board-" +
          "approved FX/IR risk policy bands",
        whyItMatters:
          "Coverage measures whether identified risk is actually managed to " +
          "policy. It is in-range because the policy, not the maximum, defines " +
          "right — the prior problem is usually exposure that is never identified " +
          "at all, which coverage on identified exposure can mask.",
      },
      {
        key: "manual_bank_recon_hours",
        name: "Manual bank-reconciliation effort",
        definition:
          "Treasury and accounting hours per period spent manually matching " +
          "bank statements to the ledger and to expected cash movements.",
        unit: "hours / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 200,
          basis:
            "Practitioner ranges scaled to account count; auto-reconciliation " +
            "on standardized feeds collapses the low end, manual multi-bank " +
            "estates run high",
          label: "planning-range",
        },
        dataSource:
          "Treasury/accounting time tracking and TMS auto-match vs manual-match " +
          "logs",
        whyItMatters:
          "A direct measure of the spreadsheet/manual burden a TMS removes. " +
          "Auto-reconciliation on clean BAI2/MT940 feeds frees skilled treasury " +
          "staff from matching and surfaces anomalies faster.",
      },
      {
        key: "payments_via_hub_pct",
        name: "Payments routed through the hub",
        definition:
          "Share of total outbound payment value (and count) that flows through " +
          "the centralized payments hub versus direct bank-portal or " +
          "ERP-to-bank side channels.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Payments-centralization maturity ranges; mature programs route the " +
            "vast majority through the hub, leaving only narrow exceptions",
          label: "planning-range",
        },
        dataSource:
          "Payments hub throughput vs total payment value across the bank estate",
        whyItMatters:
          "Centralization is the precondition for consistent fraud controls, " +
          "STP, and visibility. Every payment outside the hub is an " +
          "uncontrolled side channel — the most common place fraud and errors " +
          "actually occur.",
      },
      {
        key: "bank_account_count",
        name: "Active bank account count",
        definition:
          "Number of active bank accounts across all banking partners and legal " +
          "entities — a proxy for estate complexity and rationalization headroom.",
        unit: "accounts",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 400,
          basis:
            "Bank-account-management practitioner ranges scaled to entity count; " +
            "rationalized estates run lean, acquisitive/decentralized firms " +
            "accumulate redundant accounts",
          label: "planning-range",
        },
        dataSource:
          "TMS bank account management (BAM) module / signatory and account " +
          "inventory",
        whyItMatters:
          "Account sprawl drives fee leakage, fragments visibility, and " +
          "multiplies the fraud and signatory-control surface. Rationalizing the " +
          "estate is a foundational, often-overlooked treasury lever.",
      },
    ],

    painThemes: [
      {
        key: "fragmented_bank_visibility",
        name: "Fragmented, delayed cash visibility",
        description:
          "Cash sits across many banks, portals, and entities with no single " +
          "near-real-time view — treasury logs into multiple portals and " +
          "rebuilds the position in spreadsheets each morning, so it never " +
          "trusts a current global cash number.",
        detectionSignal:
          "Multiple bank portals with manual logins, a morning spreadsheet cash " +
          "position, low auto-fed visibility, balances known only at day-old or " +
          "worse latency.",
        diagnosticQuestion:
          "How do you build your global cash position each morning, and what " +
          "share of your bank balances arrives via automated feeds into one " +
          "system?",
      },
      {
        key: "unreliable_cash_forecast",
        name: "Unreliable cash forecasting",
        description:
          "The cash forecast is a manually-maintained spreadsheet that degrades " +
          "fast past a short horizon because AR collections and AP timing are " +
          "noisy and business-unit inputs are stale — so treasury cannot act on " +
          "it and holds a large precautionary buffer instead.",
        detectionSignal:
          "Forecast accuracy unmeasured or low past a few weeks, large variance " +
          "between forecast and actual, a fat precautionary cash buffer, " +
          "BU-submitted forecast inputs that are late or guessed.",
        diagnosticQuestion:
          "What is your cash forecast accuracy by horizon, and how far out can " +
          "you forecast before you stop trusting the number enough to act on it?",
      },
      {
        key: "payments_fraud_exposure",
        name: "Payments fraud & weak controls",
        description:
          "Payments originate from many side channels (per-bank portals, " +
          "ERP-to-bank, manual files) with inconsistent approval, sanctions, and " +
          "beneficiary controls — leaving the firm exposed to business-email-" +
          "compromise, vendor-bank-detail fraud, and authorized-push-payment " +
          "loss, where a single event is catastrophic.",
        detectionSignal:
          "Payments outside a central hub, inconsistent dual-approval and " +
          "beneficiary-validation rules, prior fraud/near-miss events, no " +
          "centralized sanctions screening or out-of-pattern detection.",
        diagnosticQuestion:
          "What share of your payments flow through one hub with consistent " +
          "approval, beneficiary-validation, sanctions, and anomaly controls — " +
          "and where are the side channels?",
      },
      {
        key: "manual_spreadsheet_treasury",
        name: "Spreadsheet-bound treasury operations",
        description:
          "Core treasury work — position-keeping, reconciliation, forecasting, " +
          "intercompany, hedge tracking — runs on fragile, key-person " +
          "spreadsheets, consuming skilled staff on low-judgment matching and " +
          "creating control and continuity risk.",
        detectionSignal:
          "Heavy manual bank-recon hours, critical spreadsheets owned by one " +
          "person, no audit trail on cash/hedge changes, errors traced to manual " +
          "re-keying.",
        diagnosticQuestion:
          "How many hours per period go to manual reconciliation and position-" +
          "keeping, and how much of treasury depends on spreadsheets only one " +
          "person understands?",
      },
      {
        key: "idle_trapped_cash",
        name: "Idle and trapped cash",
        description:
          "Cash sits idle in non-yielding accounts or trapped in entities and " +
          "geographies because there is no pooling/sweep structure and no " +
          "trusted forecast to safely mobilize it — foregone yield and a " +
          "needlessly large cash buffer.",
        detectionSignal:
          "High idle-cash share, no cash pooling/sweeping, surplus in one entity " +
          "while another borrows, investment policy under-utilized.",
        diagnosticQuestion:
          "How much of your cash is idle or trapped by entity/geography, and do " +
          "you have pooling or sweeps to mobilize it against a trusted forecast?",
      },
      {
        key: "unidentified_fx_ir_exposure",
        name: "Unidentified FX / interest-rate exposure",
        description:
          "FX and interest-rate exposures are captured late, incompletely, or in " +
          "spreadsheets, so hedging is reactive and policy compliance is " +
          "unprovable — the real gap is exposure that is never identified, which " +
          "headline hedge-coverage on known exposure can hide.",
        detectionSignal:
          "Manual exposure capture, late hedge execution, hedge coverage " +
          "reported only on identified exposure, hedge-accounting effort " +
          "concentrated at period-end, surprises in FX P&L.",
        diagnosticQuestion:
          "How completely and how quickly do you capture FX/IR exposure, and is " +
          "your hedge coverage measured against total exposure or only the " +
          "exposure you already know about?",
      },
      {
        key: "tms_rollout_change_drag",
        name: "TMS rollout & change-program drag",
        description:
          "A TMS implementation stalls because the long pole is not the software " +
          "but bank connectivity, format mapping (BAI2/MT940/ISO 20022), SOX-" +
          "grade control redesign, and treasury process change across entities — " +
          "underestimating this turns a platform win into a multi-year slog.",
        detectionSignal:
          "Connectivity/format mapping repeatedly slipping, scope treated as a " +
          "software install, banks slow to enable feeds, controls bolted on " +
          "late, low user adoption against the old spreadsheets.",
        diagnosticQuestion:
          "Is your TMS plan scoped as a change program — bank connectivity, " +
          "format mapping, control redesign, and adoption — or as a software " +
          "install, and who owns bank enablement?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ml_cash_forecasting",
        name: "ML cash forecasting",
        valueMechanism:
          "Train models on historical bank-statement flows, AR/AP timing, and " +
          "seasonality to forecast cash by horizon more accurately than a " +
          "manual spreadsheet — extending the reliable horizon and shrinking the " +
          "precautionary buffer so idle cash can be mobilized. Honest caveat: " +
          "accuracy still degrades with horizon and depends heavily on AR/AP " +
          "data quality; the model improves the curve, it does not flatten it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical bank-statement cash flows (BAI2/MT940/camt) over multiple cycles",
          "AR aging / AP scheduling and payment-term data from the ERP",
          "Business-unit / category drivers and seasonality features",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Forecasts are decision support — treasury must review before funding/investing actions",
          "Model accuracy must be back-tested by horizon and reported honestly, not assumed",
          "Garbage AR/AP timing data caps achievable accuracy regardless of model",
        ],
        metricsMoved: [
          "cash_forecast_accuracy",
          "forecast_horizon_days",
          "idle_cash_pct",
          "days_cash_on_hand",
        ],
      },
      {
        key: "payments_fraud_detection",
        name: "Payments fraud detection",
        valueMechanism:
          "Score every outbound payment in the hub against learned patterns — " +
          "beneficiary history, amount/timing anomalies, account-detail changes, " +
          "and business-email-compromise signals — to block or hold suspicious " +
          "payments before settlement. Honest caveat: this is a low-frequency, " +
          "high-severity risk, so the model is judged on catching the rare " +
          "catastrophic event with a tolerable false-positive load, not on a " +
          "smooth average loss number.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Centralized payment flow through the hub (payments_via_hub coverage)",
          "Beneficiary master, prior payment history, and bank-detail change events",
          "Sanctions/watchlist data and known fraud-pattern signals",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "A held/blocked payment must route to a human approver — never auto-release on a model score",
          "False positives delay legitimate payments; thresholds need treasury sign-off",
          "Side-channel payments outside the hub bypass the control entirely",
        ],
        metricsMoved: [
          "payment_fraud_loss_bps",
          "payment_stp_rate",
          "payments_via_hub_pct",
        ],
      },
      {
        key: "bank_statement_anomaly_detection",
        name: "Bank-statement anomaly & reconciliation detection",
        valueMechanism:
          "Auto-match incoming bank-statement lines (BAI2/MT940/camt) to " +
          "expected ledger and cash movements and flag the residual anomalies — " +
          "unexpected debits, duplicate entries, missing receipts — so treasury " +
          "reviews exceptions instead of matching line by line, cutting manual " +
          "reconciliation effort and surfacing problems faster.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Standardized bank-statement feeds (BAI2/MT940/camt)",
          "Expected cash movements and ledger entries to match against",
          "Historical match/exception dispositions for learning",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-matched items still need periodic sample review for control assurance",
          "Anomaly thresholds must avoid both alert fatigue and missed exceptions",
        ],
        metricsMoved: [
          "manual_bank_recon_hours",
          "cash_visibility_pct",
        ],
      },
      {
        key: "fx_exposure_analytics",
        name: "FX / interest-rate exposure analytics",
        valueMechanism:
          "Aggregate and classify exposures from ERP, sales, and forecast data " +
          "into a complete, near-real-time exposure picture and recommend " +
          "in-policy hedge actions — closing the real gap (exposure never " +
          "identified) and making hedge coverage measurable against total, not " +
          "just known, exposure.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Multi-currency balances, receivables/payables, and forecasted exposure",
          "The board-approved FX/IR risk policy and hedge limits",
          "Market rate data and existing hedge positions from the TMS",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Hedge execution is a financial commitment — recommendations require treasurer approval within policy",
          "Hedge-accounting designation has audit consequences and must be human-validated",
          "Exposure data gaps mean the analytics is only as complete as its feeds",
        ],
        metricsMoved: [
          "fx_hedge_coverage_pct",
        ],
      },
      {
        key: "bank_fee_analysis",
        name: "AI bank-fee analysis",
        valueMechanism:
          "Parse bank account analysis statements (EDI 822 / camt.086) across " +
          "the whole account estate, classify charges, and flag erroneous, " +
          "off-contract, or out-of-line fees against negotiated schedules — " +
          "recovering overcharges no human reconciles line by line and arming " +
          "bank-relationship negotiation. A low-risk, fast-payback win.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Bank account analysis statements (EDI 822 / camt.086) across all accounts",
          "Negotiated fee schedules / pricing agreements per bank",
          "Account and service inventory from the BAM module",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Flagged overcharges are a recovery/negotiation pipeline, not booked savings until recovered",
          "Fee taxonomy mapping errors mislead the analysis — sample-validate",
        ],
        metricsMoved: [
          "bank_fee_leakage_pct",
          "bank_account_count",
        ],
      },
      {
        key: "liquidity_optimization",
        name: "Liquidity & cash-positioning optimization",
        valueMechanism:
          "Combine the trusted forecast with pooling/sweep structures and " +
          "investment policy to recommend daily cash positioning — sweep idle " +
          "balances to yield, fund shortfalls from the cheapest source, and " +
          "mobilize trapped cash within entity/regulatory limits — converting " +
          "idle balances into yield or debt paydown.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Trusted forecast and near-real-time cash position from the TMS",
          "Investment policy, pooling/sweep structures, and intercompany limits",
          "Yield/borrowing rate options across counterparties",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Positioning actions move real money — within-policy automation only, with treasury oversight",
          "Intercompany and cross-border moves carry tax/regulatory constraints that bound the optimization",
        ],
        metricsMoved: [
          "idle_cash_pct",
          "days_cash_on_hand",
          "cash_forecast_accuracy",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "cloud_tms_foundation",
        name: "Cloud TMS + bank-connectivity foundation",
        description:
          "A cloud Treasury Management System as the single system of record " +
          "for cash, payments, and risk, fed by automated multi-bank " +
          "connectivity (host-to-host, SWIFT, APIs) with standardized statement " +
          "formats (BAI2/MT940/camt) — the visibility platform every other " +
          "treasury capability scales on.",
        boundary:
          "Owns cash visibility, position-keeping, and the connectivity/format " +
          "layer; does not own the ERP's transactional AP/AR processing or the " +
          "bank's own systems — it consumes their feeds and orchestrates money " +
          "movement on top.",
        humanAccountabilityPoint: "Treasurer / Treasury Systems Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "centralized_payments_hub",
        name: "Centralized payments hub with layered fraud controls",
        description:
          "A single payments hub through which all outbound payments flow with " +
          "consistent dual-approval, beneficiary validation, sanctions " +
          "screening, format transformation (ISO 20022), and AI anomaly/fraud " +
          "detection — replacing per-bank portals and side channels so controls " +
          "are uniform and the fraud surface is minimized.",
        boundary:
          "Owns payment origination, control, and routing to banks; does not " +
          "own the underlying obligation/invoice (that is AP's) or the bank's " +
          "clearing — it is the controlled gateway between them.",
        humanAccountabilityPoint: "Head of Treasury Operations / Payments",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "rolling_forecast_engine",
        name: "Rolling cash-forecast engine (driver-based + ML)",
        description:
          "A rolling (e.g. 13-week and longer) cash-forecast engine that blends " +
          "driver-based BU inputs, AR/AP timing, and ML on historical flows, " +
          "back-tested by horizon and reported with honest accuracy bands — the " +
          "decision layer that turns visibility into action while being candid " +
          "about where accuracy decays.",
        boundary:
          "Owns the cash forecast and its accuracy reporting; does not own the " +
          "FP&A P&L plan or the underlying AR/AP operations that drive timing — " +
          "it consumes their data and forecasts the cash consequence.",
        humanAccountabilityPoint: "Director of Treasury / Cash Management",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "treasury_risk_management_layer",
        name: "FX / interest-rate risk management layer",
        description:
          "An exposure-capture, hedging, and hedge-accounting layer that " +
          "aggregates FX/IR exposure across the enterprise, recommends in-policy " +
          "hedges, executes through dealing platforms, and maintains hedge-" +
          "accounting documentation — making risk management complete, policy-" +
          "compliant, and auditable rather than reactive and manual.",
        boundary:
          "Owns exposure aggregation, hedge execution support, and hedge " +
          "accounting; does not set the risk policy (the board/CFO do) or run a " +
          "trading desk — it manages corporate exposure to the approved policy.",
        humanAccountabilityPoint: "Treasurer / Head of Financial Risk",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Treasury value compounds in a strict sequence: VISIBILITY, then " +
        "FORECAST, then CONTROL. First, a cloud TMS plus automated multi-bank " +
        "connectivity gives a single near-real-time cash position — the " +
        "precondition for everything else and the fastest, surest win " +
        "(idle-cash mobilization and bank-fee recovery follow directly). " +
        "Second, a rolling forecast (driver-based plus ML) extends the reliable " +
        "horizon and shrinks the precautionary buffer — the highest-value but " +
        "GENUINELY HARD lever, because accuracy degrades with horizon and is " +
        "capped by AR/AP data quality; value here must be sized as a planning " +
        "range with honest back-tested accuracy, never a promised number. " +
        "Third, a centralized payments hub with layered fraud controls protects " +
        "money in motion — value framed primarily as catastrophic-loss " +
        "avoidance (a fat-tailed risk) plus STP efficiency, not as a smooth " +
        "average saving. FX/IR risk management and working-capital optimization " +
        "ride on the same trusted data. The dominant honesty discipline: a TMS " +
        "rollout is a multi-quarter change program whose long pole is bank " +
        "connectivity, format mapping, and SOX-grade control redesign — under-" +
        "scoping that turns the prize into a slog.",
      dominantHaircutFactors: [
        {
          factor: "Forecast accuracy ceiling (AR/AP data quality)",
          rationale:
            "Idle-cash and buffer-reduction value depends on a trusted forecast, " +
            "but accuracy degrades with horizon and is capped by noisy AR " +
            "collections and AP timing — the model improves the curve, it does " +
            "not flatten it, so forecast-driven value must be discounted to the " +
            "back-tested accuracy actually achieved.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between theoretical buffer reduction and what holds once " +
              "forecast accuracy is back-tested by horizon on real AR/AP data",
            label: "planning-range",
          },
        },
        {
          factor: "TMS rollout & bank-connectivity drag",
          rationale:
            "The long pole is bank enablement, format mapping (BAI2/MT940/ISO " +
            "20022), and control redesign across entities — not the license. " +
            "Slippage here pushes value realization out and adds one-time cost, " +
            "so forward value must be discounted for change-program risk.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed schedule/scope slippage on TMS implementations where " +
              "connectivity and control work was under-estimated",
            label: "planning-range",
          },
        },
        {
          factor: "Payments-fraud tail-risk uncertainty",
          rationale:
            "Fraud-loss-avoidance value is fat-tailed and low-frequency, so a " +
            "central point estimate is misleading; the value is real but its " +
            "size is uncertain and must be framed as catastrophic-event " +
            "avoidance, not a smooth annual saving.",
          typicalHaircut: {
            low: 0.1,
            high: 0.5,
            basis:
              "Wide range reflecting the inherent uncertainty of pricing a " +
              "low-frequency, high-severity loss distribution",
            label: "planning-range",
          },
        },
        {
          factor: "Trapped-cash & regulatory mobility constraints",
          rationale:
            "Idle/trapped cash cannot always be mobilized — entity, tax, and " +
            "cross-border/regulatory constraints fence pooling and sweeps, so " +
            "the realizable idle-cash prize is below the gross idle balance.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Share of idle/trapped balances fenced from mobilization by " +
              "entity, tax, and cross-border regulatory limits",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & spreadsheet displacement",
          rationale:
            "Value requires treasury to abandon trusted spreadsheets and work " +
            "in the TMS; slow adoption and shadow-spreadsheet persistence leave " +
            "benefit unrealized and controls bypassed.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "TMS change-management experience where shadow spreadsheets " +
              "persisted and adoption lagged",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Idle-cash mobilization / yield capture",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reported reduction in idle/non-yielding balances once visibility " +
              "and pooling/sweeps are in place against a trusted forecast",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in idle_cash_pct (yield captured or debt retired " +
            "on mobilized balances)",
        },
        {
          lever: "Bank-fee recovery / leakage reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported recovery from systematic bank-fee analysis across the " +
              "account estate vs prior unreviewed fees",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in analyzed bank fees (bank_fee_leakage_pct " +
            "recovered)",
        },
        {
          lever: "Treasury operating-effort reduction (recon/position-keeping)",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in manual reconciliation and position-keeping " +
              "effort after TMS auto-feeds and auto-match replace spreadsheets",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in manual_bank_recon_hours and equivalent " +
            "position-keeping effort",
        },
        {
          lever: "Forecast-enabled buffer reduction (cost of carry)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reduction in the precautionary cash buffer enabled by a more " +
              "accurate forecast — sized to back-tested accuracy, a planning " +
              "range not a promise",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in the precautionary buffer / cost of carry " +
            "(tracks days_cash_on_hand toward the in-range target)",
        },
      ],
      timeToValueBand:
        "Visibility (TMS + bank connectivity for the major banks): 2-4 quarters, " +
        "with bank enablement the pacing item. Bank-fee analysis and idle-cash " +
        "mobilization: fast follow within 1-2 quarters of visibility. Rolling/ML " +
        "forecasting: 3-6 quarters and iterative as accuracy is back-tested. " +
        "Payments-hub centralization with fraud controls: 3-6 quarters per " +
        "bank/region wave. Full treasury transformation across all banks, " +
        "entities, and risk: 18-36 months as a sequenced change program.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Treasury Management System (TMS)",
          role:
            "System of record for cash position, liquidity, payments, bank " +
            "account management, FX/IR risk, and forecasting — the platform the " +
            "whole transformation centers on.",
          examples: ["Kyriba", "GTreasury", "FIS (Quantum / Integrity)", "ION Treasury"],
        },
        {
          name: "ERP / general ledger",
          role:
            "Source of AR/AP, intercompany, and accounting data that feeds cash " +
            "forecasting, reconciliation, and exposure capture; the obligation " +
            "and ledger system the TMS reconciles against.",
          examples: ["SAP S/4HANA", "Oracle Fusion / E-Business Suite", "Microsoft Dynamics 365 Finance", "Workday Financials"],
        },
        {
          name: "Bank portals & connectivity channels",
          role:
            "The banks' own balance/statement and payment channels (web " +
            "portals, host-to-host, SWIFT, APIs) consumed by the TMS to achieve " +
            "automated visibility and payment delivery.",
          examples: ["SWIFT (gpi / Alliance)", "Host-to-host (SFTP) feeds", "Bank APIs / open banking", "Individual bank web portals"],
        },
        {
          name: "Payments hub / connectivity middleware",
          role:
            "Centralizes, standardizes, and controls outbound payments and bank " +
            "connectivity, transforming formats (ISO 20022) and applying fraud/" +
            "sanctions controls before delivery to banks.",
          examples: ["Kyriba Payments", "Bottomline", "FIS payments hub", "Bank-agnostic SWIFT service bureaus"],
        },
        {
          name: "FX dealing & market-data platforms",
          role:
            "Execution venues and rate/market-data sources for FX and interest-" +
            "rate hedging that feed exposure analytics and hedge execution in " +
            "the TMS.",
          examples: ["360T", "FXall", "Bloomberg", "Refinitiv"],
        },
      ],
      roles: [
        {
          title: "Corporate Treasurer",
          accountability:
            "Enterprise liquidity, cash visibility, financial-risk policy " +
            "execution, banking relationships, and the treasury transformation " +
            "mandate end to end.",
        },
        {
          title: "Chief Financial Officer",
          accountability:
            "Sponsors the program, sets risk appetite and liquidity policy, and " +
            "owns the board-level view of cash, debt, and financial risk.",
        },
        {
          title: "Head of Treasury Operations",
          accountability:
            "Day-to-day cash positioning, payments processing and controls, " +
            "bank account management, and reconciliation quality.",
        },
        {
          title: "Director of Cash Management / Forecasting",
          accountability:
            "The cash forecast and its accuracy, working-capital and idle-cash " +
            "mobilization, and pooling/sweep structures.",
        },
        {
          title: "Head of Financial Risk / FX",
          accountability:
            "Exposure identification and aggregation, hedge execution within " +
            "policy, and hedge-accounting compliance.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Sarbanes-Oxley (SOX) / internal controls over financial reporting",
          relevance:
            "Cash, payments, and hedge processes are ICFR controls — payment " +
            "approval, segregation of duties, and auto-posted entries require " +
            "audit trails and approval evidence in the TMS and payments hub.",
        },
        {
          name: "Payment regulations & sanctions screening (OFAC / AML)",
          relevance:
            "Outbound payments must be screened against sanctions/watchlists and " +
            "comply with payment-scheme and anti-money-laundering rules; the " +
            "payments hub inherits these obligations.",
        },
        {
          name: "Bank KYC / account management & signatory controls",
          relevance:
            "Opening, closing, and maintaining bank accounts and signatories " +
            "requires KYC documentation and controlled mandates — bank account " +
            "management (BAM) is a governed, auditable process.",
        },
        {
          name: "Hedge-accounting standards (IFRS 9 / ASC 815)",
          relevance:
            "Hedge designation, effectiveness testing, and documentation govern " +
            "how FX/IR hedges hit the P&L — exposure analytics and hedge " +
            "execution must preserve hedge-accounting evidence.",
        },
      ],
      canonicalTerms: [
        {
          term: "TMS (Treasury Management System)",
          definition:
            "The cloud platform that is system of record for cash, liquidity, " +
            "payments, bank account management, and FX/IR risk.",
        },
        {
          term: "STP (straight-through processing)",
          definition:
            "A payment that originates, validates, routes, and settles end to " +
            "end without manual intervention — an efficiency and a control measure.",
        },
        {
          term: "Cash positioning",
          definition:
            "The daily process of determining current and projected cash by " +
            "account/currency and deciding how to invest, fund, or move it.",
        },
        {
          term: "Netting",
          definition:
            "Offsetting intercompany payables and receivables (often via an " +
            "in-house bank or netting center) to reduce the volume and cost of " +
            "actual cross-entity cash movement.",
        },
        {
          term: "BAI2 / MT940",
          definition:
            "Standard bank-statement file formats (US BAI2; SWIFT MT940, now " +
            "migrating to ISO 20022 camt) that carry balance and transaction " +
            "data into the TMS for visibility and reconciliation.",
        },
        {
          term: "In-house bank / cash pooling",
          definition:
            "A structure where a central treasury entity acts as an internal " +
            "bank, pooling/sweeping group cash to minimize idle and trapped " +
            "balances and external borrowing.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Cash forecast accuracy and reliable horizon",
        authoritativeSource:
          "TMS forecast module back-tested against realized bank-statement " +
          "actuals (BAI2/MT940/camt) over trailing periods",
        whatGoodEvidenceLooksLike:
          "An accuracy-by-horizon curve (e.g. 1-week through 13-week) computed " +
          "as forecast-vs-actual error over multiple cycles, with the AR/AP data " +
          "quality that drives it stated.",
        weakEvidenceToReject:
          "A single asserted 'our forecast is 90% accurate' with no horizon " +
          "breakdown, no back-test, and no statement of what data it relied on.",
      },
      {
        claim: "Cash visibility and idle/trapped cash",
        authoritativeSource:
          "TMS bank-feed coverage report and cash-position view across all " +
          "accounts, entities, and currencies",
        whatGoodEvidenceLooksLike:
          "Auto-fed balances over total accounts plus an idle/non-yielding " +
          "balance breakdown by entity and currency, with pooling/sweep " +
          "structure and mobility constraints noted.",
        weakEvidenceToReject:
          "A blanket 'we have full visibility' or a single global cash number " +
          "with no account-coverage or latency detail.",
      },
      {
        claim: "Payments fraud exposure and control coverage",
        authoritativeSource:
          "Payments hub throughput, control configuration, and fraud/exception " +
          "logs (blocked, held, and confirmed-fraud events)",
        whatGoodEvidenceLooksLike:
          "Share of payment value through the hub vs side channels, the control " +
          "set applied (dual-approval, beneficiary validation, sanctions, " +
          "anomaly detection), and the realized/near-miss loss history.",
        weakEvidenceToReject:
          "A vendor or self-asserted 'fraud-proof payments' claim with no hub-" +
          "coverage data and no view of side channels or loss history.",
      },
      {
        claim: "Bank-fee leakage and recovery",
        authoritativeSource:
          "Bank account analysis statements (EDI 822 / camt.086) parsed against " +
          "negotiated fee schedules across the account estate",
        whatGoodEvidenceLooksLike:
          "Analyzed fees vs contracted pricing with flagged overcharges/errors " +
          "by bank and service, and a recovery/negotiation pipeline status.",
        weakEvidenceToReject:
          "A headline 'we negotiated good bank fees' with no statement-level " +
          "analysis or error/overcharge breakdown.",
      },
      {
        claim: "FX / interest-rate exposure and hedge coverage",
        authoritativeSource:
          "TMS exposure-capture and hedge module against the board-approved " +
          "risk policy bands",
        whatGoodEvidenceLooksLike:
          "Total identified exposure by currency/tenor, hedge coverage measured " +
          "against TOTAL exposure (with the unidentified-exposure gap " +
          "acknowledged), and policy-band compliance.",
        weakEvidenceToReject:
          "Hedge coverage reported only on already-known exposure with no view " +
          "of exposure that is never captured.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How do you build your global cash position each morning, and what share of bank balances arrives via automated feeds into one system?",
      "What is your cash forecast accuracy by horizon, and how far out can you trust it enough to act on (mobilize cash, hedge, borrow)?",
      "What share of your payments flows through a single hub with consistent dual-approval, beneficiary-validation, sanctions, and anomaly controls — and where are the side channels?",
      "How much of your cash is idle or trapped by entity/geography, and do you have pooling/sweeps to mobilize it against a trusted forecast?",
      "How completely and how quickly do you capture FX/IR exposure, and is hedge coverage measured against total exposure or only the exposure you already know about?",
      "Is your TMS plan scoped as a change program — bank connectivity, format mapping (BAI2/MT940/ISO 20022), control redesign, adoption — or as a software install, and who owns bank enablement?",
      "How many hours per period go to manual reconciliation and position-keeping, and how much of treasury depends on spreadsheets only one person understands?",
    ],
    maturitySignals: [
      "A single TMS holds a near-real-time global cash position fed by automated multi-bank connectivity, not a morning spreadsheet.",
      "Cash forecast accuracy is measured and back-tested by horizon and used to size the precautionary buffer, not just produced and filed.",
      "Nearly all payments flow through one hub with uniform controls; side channels are narrow, named exceptions.",
      "FX/IR exposure is captured completely and quickly, with hedge coverage measured against total exposure and policy-band compliance proven.",
      "Bank account management, fees, and signatories are governed and reviewed systematically rather than account by account by hand.",
    ],
    redFlags: [
      "The global cash position is rebuilt manually in spreadsheets each morning from multiple bank portals — visibility is delayed and untrusted.",
      "Cash forecast accuracy is unmeasured or assumed, and a large precautionary buffer compensates for a forecast no one acts on.",
      "Payments originate from multiple side channels with inconsistent approval and beneficiary controls — the fraud surface is wide and prior near-misses exist.",
      "A TMS rollout is scoped as a software install, with bank connectivity, format mapping, and SOX control redesign under-estimated and slipping.",
      "Critical treasury spreadsheets are owned by one person with no audit trail — key-person and control-continuity risk.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Kyriba",
        category: "Cloud TMS + payments hub + bank connectivity (SaaS leader)",
        switchingCost:
          "High — bank connectivity mappings, payment workflows, control configuration, and trained users accrete; re-enabling banks and re-mapping formats is the real cost.",
        renewalDynamics:
          "Module/subscription pricing (cash, payments, risk, connectivity often priced separately); connectivity and payment modules are the upsell and the stickiness.",
      },
      {
        vendorName: "GTreasury",
        category: "Cloud TMS (cash, payments, risk) — mid/large enterprise",
        switchingCost:
          "High — same connectivity and workflow lock-in as any TMS once banks are enabled and processes are embedded.",
        renewalDynamics:
          "Subscription/module pricing; competitive against Kyriba and FIS, so renewal leverage exists if connectivity portability is preserved.",
      },
      {
        vendorName: "FIS (Quantum / Integrity) & ION Treasury",
        category: "Enterprise TMS / treasury platform suites",
        switchingCost:
          "High — deep, often on-prem-legacy installs with extensive customization; migration is a multi-year decision rarely taken lightly.",
        renewalDynamics:
          "Enterprise/maintenance agreements; cloud migration and modernization are the negotiation hooks at renewal.",
      },
      {
        vendorName: "Payments-hub & connectivity specialists (Bottomline, SWIFT bureaus)",
        category: "Bank-agnostic payments hub, format transformation, fraud controls",
        switchingCost:
          "Moderate-to-high — bank connections and format mappings transfer with effort, but fraud-control tuning and bank enablement re-work add friction.",
        renewalDynamics:
          "Per-transaction or subscription pricing; leverage bank-agnostic positioning to discipline the TMS vendor's own payments module pricing.",
      },
      {
        vendorName: "FX execution & exposure platforms (360T, FXall, Bloomberg)",
        category: "FX dealing venues + market data feeding hedge analytics",
        switchingCost:
          "Moderate — multi-dealer platforms are relatively portable, but integration to the TMS and dealer relationships add stickiness.",
        renewalDynamics:
          "Transaction/spread and data-subscription pricing; multi-dealer competition is the primary lever.",
      },
    ],
    switchingCosts:
      "Once a TMS is live, the lock-in is the bank-connectivity estate (host-to-host and SWIFT mappings, format transformations, payment workflows, and control configuration) and trained users — not the application itself. The negotiable frontier is therefore connectivity portability and the choice between a TMS-native payments module and a bank-agnostic payments hub, plus disciplining FX execution through multi-dealer competition.",
    negotiationLevers: [
      "Price connectivity and bank-enablement explicitly — it is the real cost and the real lock-in; demand a defined enablement timeline and ownership",
      "Keep the payments hub bank-agnostic (or contestable) to discipline the TMS vendor's payments-module pricing",
      "Module-unbundle (cash vs payments vs risk vs connectivity) so you pay for what you adopt, with scale-up gating per module",
      "Insist on standards-based formats (ISO 20022 / camt) and data-export rights to preserve portability and avoid format lock-in",
      "Tie fees and go-live milestones to proven visibility/STP/connectivity outcomes per bank wave, not a big-bang license commitment",
      "Use multi-dealer FX platforms to contest execution spreads independent of the TMS choice",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      visibility_claim: [
        "TMS bank-feed coverage report (auto-fed accounts over total)",
        "reporting latency / window",
        "account and entity inventory",
      ],
      forecast_accuracy_claim: [
        "forecast-vs-actual back-test by horizon",
        "AR/AP data-quality basis",
        "multiple-cycle aggregation",
      ],
      payments_control_claim: [
        "share of payment value through the hub vs side channels",
        "control set applied (approval/beneficiary/sanctions/anomaly)",
        "realized and near-miss fraud/loss history",
      ],
      liquidity_value_claim: [
        "idle/trapped balance breakdown by entity/currency",
        "pooling/sweep and mobility-constraint detail",
        "yield/borrowing-rate basis",
      ],
      risk_coverage_claim: [
        "total identified exposure by currency/tenor",
        "hedge coverage measured against TOTAL exposure with the unidentified gap acknowledged",
        "policy-band reference",
      ],
      value_projection: [
        "benchmark planning-range",
        "explicit haircut factors (forecast ceiling, rollout drag, fraud tail, mobility, adoption)",
        "back-tested accuracy or recovery basis, not an asserted number",
      ],
    },
    citationStandard:
      "Quantitative treasury claims cite the TMS system-of-record view (bank " +
      "feeds, cash position, payment logs, exposure module) and the period. " +
      "Forecast-accuracy claims MUST cite a back-test by horizon, not a single " +
      "asserted percentage. Payments-fraud claims cite hub coverage, the control " +
      "set, and loss history, and are framed as tail-risk avoidance rather than " +
      "a smooth average. Value projections cite a labelled planning range, the " +
      "haircut factors applied (forecast ceiling, rollout drag, fraud-tail " +
      "uncertainty, cash-mobility constraints, adoption), and the back-tested or " +
      "recovery basis — never a single asserted savings or accuracy number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Forecast accuracy is quoted without a horizon breakdown or back-test — frame it as an industry planning range and flag that accuracy degrades with horizon.",
      "Idle-cash or buffer-reduction value is sized without the tenant's back-tested forecast accuracy — present it as conditional on accuracy actually achieved.",
      "Payments-fraud value is being averaged — reframe as low-frequency, high-severity catastrophic-loss avoidance, not a smooth annual saving.",
      "A TMS rollout is being scoped as a software install — flag bank connectivity, format mapping, and control redesign as the real long pole and timeline risk.",
      "Vendor-reported outcomes (accuracy, STP, fraud prevention) are cited — mark as provider claims pending tenant back-test/validation.",
    ],
    inferenceLanguage: [
      "Across corporate treasuries at this scale, cash forecast accuracy typically runs... and degrades past roughly the 8-13 week horizon...",
      "Without your back-tested accuracy curve, the industry pattern suggests idle-cash mobilization of roughly... once visibility and pooling are in place...",
      "Treating payments-fraud value as catastrophic-loss avoidance rather than your measured average...",
      "Peer TMS programs commonly take... per bank wave for connectivity and control redesign, the usual long pole...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific cash forecast accuracy for this tenant without a back-test by horizon",
      "A specific dollar idle-cash, fee-recovery, or fraud-avoidance value for this tenant",
      "This tenant's actual cash visibility, STP, hub-coverage, or hedge-coverage rate",
      "A promised payments-fraud loss reduction stated as a smooth average rather than tail-risk avoidance",
      "A TMS go-live timeline that ignores bank-connectivity and control-redesign effort",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "cash forecast accuracy by horizon / how far out can we trust the forecast",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Plot back-tested forecast accuracy against horizon (1-week to 13-week+) versus the accuracy threshold to show where the reliable horizon ends.",
    },
    {
      questionPattern:
        "treasury value story / visibility then forecast then control on one bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current state through idle-cash mobilization, fee recovery, effort reduction, and buffer reduction to net value, with the forecast-ceiling, rollout-drag, and fraud-tail haircuts shown.",
    },
    {
      questionPattern:
        "where does cash sit / idle and trapped cash by entity and currency",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Idle/non-yielding and trapped balances by entity/currency against mobility constraints to show realizable mobilization headroom.",
    },
    {
      questionPattern:
        "treasury KPI scorecard / where do we stand vs planning ranges",
      exhibitKind: "table",
      note: "Cash visibility, forecast accuracy and horizon, idle cash, days cash on hand, STP, fraud loss bps, fee leakage, hedge coverage, payments via hub vs planning ranges.",
    },
    {
      questionPattern:
        "payments-fraud control coverage / where are the gaps and side channels",
      exhibitKind: "table",
      note: "Per channel/bank: share of payment value through the hub, control set applied (dual-approval/beneficiary/sanctions/anomaly), and side-channel exposure — framed as tail-risk surface.",
    },
    {
      questionPattern:
        "TMS rollout sequence / bank-connectivity and control-redesign waves over time",
      exhibitKind: "chart",
      chartKind: "swimlane",
      note: "Sequence bank-connectivity, format-mapping, payments-hub, and risk waves by quarter, making the change-program long pole (not the license) visible.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Sequencing visibility first (TMS + bank connectivity) before chasing forecasting or control value, so each layer rests on a trusted foundation",
      "Scoping the program as a change program — owning bank enablement, format mapping, and SOX control redesign — rather than a software install",
      "Measuring and back-testing forecast accuracy by horizon honestly, and sizing idle-cash/buffer value to what accuracy actually supports",
      "Centralizing payments through one hub with layered fraud controls before any payment automation, so the fraud surface shrinks rather than grows",
    ],
    failureDrivers: [
      "Treating the TMS as a software install — under-scoping bank connectivity, format mapping, and control redesign so the rollout stalls for years",
      "Promising forecast-driven value on an unproven accuracy claim, then missing it because accuracy degrades with horizon and AR/AP data is noisy",
      "Leaving payment side channels open or automating payments before controls are centralized — inviting the rare catastrophic fraud event",
      "Shadow spreadsheets persisting because adoption lagged, leaving visibility, controls, and value unrealized despite a live TMS",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Visibility capabilities adopt first and most readily because the morning-" +
      "spreadsheet pain is acute and the win is immediate. Bank-fee analysis and " +
      "auto-reconciliation follow as obvious, low-risk efficiency wins. " +
      "Payments-hub centralization adopts more slowly because it touches every " +
      "bank relationship and control. ML forecasting and liquidity optimization " +
      "are the slowest and most iterative — trust must be earned through proven " +
      "back-tested accuracy before treasury acts on the numbers. The decisive " +
      "adoption barrier throughout is displacing trusted spreadsheets.",
    roiClarity: "medium",
    roiClarityBasis:
      "Treasury ROI is split. The visibility-driven wins — idle-cash " +
      "mobilization, bank-fee recovery, reconciliation effort — are firmly " +
      "measurable in the TMS and bank data, so their ROI clarity is high. The " +
      "two biggest prizes are genuinely soft: forecast-driven buffer reduction " +
      "is capped and uncertain because accuracy degrades with horizon and " +
      "depends on AR/AP data quality, and payments-fraud value is fat-tailed " +
      "catastrophic-loss avoidance that resists a clean point estimate. Net " +
      "clarity is medium, which is why the evidence and hedge rules force back-" +
      "tested accuracy and tail-risk framing rather than asserted numbers.",
  },

  regulatoryFrame: {
    name: "SOX controls, payment/sanctions compliance & hedge accounting",
    relevance:
      "Treasury transformation sits inside a dense control frame: cash, payment, " +
      "and hedge processes are SOX ICFR controls requiring audit trails, " +
      "segregation of duties, and approval evidence; outbound payments inherit " +
      "sanctions/AML screening and payment-scheme obligations; bank account and " +
      "signatory changes are KYC-governed; and FX/IR hedges must preserve hedge-" +
      "accounting (IFRS 9 / ASC 815) documentation. AI in forecasting, fraud " +
      "detection, and exposure analytics is decision support inside these " +
      "controls, not a replacement for them (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 wave2)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
