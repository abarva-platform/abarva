// Consilium expert — Finance: FP&A & Controllership (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert covering the corporate finance PLANNING and CONTROLLERSHIP layer:
// financial planning & analysis (budgeting, forecasting, driver-based planning),
// management reporting, the close & consolidation, controllership, and — most
// importantly for an enterprise value office — VALUE ATTESTATION: Finance signing
// off on a baselined benefit number so it counts as real.
//
// CORE DOCTRINE — A BENEFIT IS NOT REAL UNTIL FINANCE OWNS THE BASELINE. This
// expert is the attestation layer of the enterprise. Strategy, transformation,
// and the value office can size a prize; only Finance, owning the single source
// of financial truth (the GL and the plan), can baseline it, certify it, and
// later confirm realized-vs-attested variance in the P&L. The two binding
// constraints are honest about themselves: (1) forecast accuracy — a plan you
// cannot trust cannot anchor a baseline; (2) a single source of financial truth
// — without one reconciled plan/actuals model, every attested number is
// arguable. Value attestation ONLY works with a finance-signed baseline and
// finance ownership; absent those, "attested" is theater.
//
// DISTINCT FROM Back-Office Shared Services (transactional AP/AR/close OPS —
// throughput and arbitrage) and from Treasury (cash/liquidity/FX). This expert
// owns the JUDGMENT layer: the plan, the forecast, management reporting, the
// controllership of the close, and the baseline+attestation that makes value
// claims bankable. Product-aware (EPM/CPM + ERP/GL), not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const financeFpaControllershipExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.finance-fpa-controllership",
    expertName: "Finance — FP&A & Controllership Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "finance-fpa-controllership",
    scopeNote:
      "Cross-cutting corporate-finance PLANNING and CONTROLLERSHIP layer: " +
      "financial planning & analysis (budgeting, forecasting, driver-based " +
      "planning, scenario analysis), management reporting, the close & " +
      "consolidation, controllership, and VALUE ATTESTATION — Finance baselining " +
      "and signing off on benefit numbers so they count in the P&L. The binding " +
      "constraints are honest: forecast accuracy and a single source of financial " +
      "truth (one reconciled plan/actuals model on the GL). Value attestation " +
      "only works with a finance-signed baseline and finance ownership. " +
      "EXCLUDES transactional shared-services operations (AP/AR/close OPS, " +
      "arbitrage — Back-Office Shared Services expert) and cash/liquidity/FX " +
      "(Treasury expert). This expert owns the judgment, plan, control, and " +
      "attestation layer, not transactional throughput.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "forecast_accuracy",
        name: "Forecast accuracy (MAPE)",
        definition:
          "One minus the mean absolute percentage error between the rolling " +
          "forecast and actuals for a key line (revenue, EBITDA, or cash), at a " +
          "stated horizon (e.g. next quarter).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 97,
          basis:
            "APQC / Hackett FP&A benchmarks; top-quartile next-quarter revenue " +
            "forecasts 95%+, median 88-92%, volatile/laggard businesses below 85%",
          label: "planning-range",
        },
        dataSource:
          "EPM/CPM forecast versions versus actuals from the GL, snapshotted by " +
          "forecast cycle and horizon",
        whyItMatters:
          "The binding constraint of the whole function. A forecast you cannot " +
          "trust cannot anchor a baseline, a target, or a value attestation — " +
          "accuracy is the precondition for every downstream finance commitment.",
      },
      {
        key: "days_to_close",
        name: "Days to close (consolidated close cycle time)",
        definition:
          "Working days from period-end to a final, signed-off consolidated " +
          "close ready for management reporting.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 10,
          basis:
            "APQC / Hackett record-to-report benchmarks; top-quartile 3-5 working " +
            "days, median 6-8, laggards 10+",
          label: "planning-range",
        },
        dataSource:
          "Close task-management / consolidation tool timestamps against the GL",
        whyItMatters:
          "Controllership's headline speed-and-quality unit. A slow close pushes " +
          "reporting and re-forecasting late, compressing decision time; it also " +
          "signals reconciliation and manual-journal drag that threatens the " +
          "single source of truth.",
      },
      {
        key: "budget_cycle_time",
        name: "Annual budget / plan cycle time",
        definition:
          "Elapsed calendar weeks from kickoff of the annual operating plan to " +
          "board-approved budget locked in the planning system.",
        unit: "weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 16,
          basis:
            "APQC planning benchmarks; lean driver-based shops 6-8 weeks, " +
            "spreadsheet-heavy bottom-up cycles 12-16+",
          label: "planning-range",
        },
        dataSource:
          "Planning calendar milestones in the EPM/CPM platform and version " +
          "history",
        whyItMatters:
          "A long budget cycle is stale before it is approved and consumes scarce " +
          "FP&A capacity in version wrangling rather than analysis. Driver-based " +
          "planning compresses it and frees analysts for insight.",
      },
      {
        key: "driver_based_plan_pct",
        name: "% of plan on driver-based models",
        definition:
          "Share of plan/forecast value (revenue and cost) built from operational " +
          "drivers (volume x rate, headcount x cost) rather than prior-year " +
          "trended line items.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Hackett / FP&A maturity ranges; advanced planning functions 70-80%+ " +
            "driver-based, traditional bottom-up shops below 40%",
          label: "planning-range",
        },
        dataSource:
          "EPM/CPM model metadata: lines built on driver logic vs trended/manual " +
          "input",
        whyItMatters:
          "Driver-based plans are explainable, re-forecastable, and scenario-able " +
          "in minutes — the structural enabler of both forecast accuracy and fast " +
          "re-planning. Trended line-item planning cannot answer 'what changed and " +
          "why'.",
      },
      {
        key: "value_attestation_coverage",
        name: "Value-attestation coverage",
        definition:
          "Share of active value-generating initiatives that carry a " +
          "finance-signed baseline and an attested benefit number (vs. a " +
          "self-reported or unbaselined claim).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Value-office / benefits-realization maturity ranges; mature value " +
            "offices attest 70-80%+ of the portfolio, immature ones rely on " +
            "self-reported claims below 30%",
          label: "planning-range",
        },
        dataSource:
          "Value/benefits register cross-referenced to finance-signed baselines " +
          "in the EPM/CPM and GL",
        whyItMatters:
          "The defining metric of the attestation layer. A benefit is not real " +
          "until Finance owns its baseline; coverage measures how much of the " +
          "claimed value is actually bankable rather than aspirational.",
      },
      {
        key: "realized_vs_attested_variance",
        name: "Realized-vs-attested value variance",
        definition:
          "Absolute percentage gap between the benefit Finance attested at " +
          "baseline and the benefit later confirmed in actuals (the P&L) for " +
          "completed initiatives.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Benefits-realization studies; disciplined value offices land within " +
            "10-15% of attested benefit, weak ones diverge 25-30%+",
          label: "planning-range",
        },
        dataSource:
          "Attested baseline in the value register versus realized impact " +
          "reconciled to the GL post-implementation",
        whyItMatters:
          "The honesty check on attestation itself. Low variance proves the " +
          "baseline and attestation process is credible; persistent high variance " +
          "means Finance is signing off on numbers that do not land — and board " +
          "trust in the next wave erodes.",
      },
      {
        key: "variance_explained_pct",
        name: "Variance explained %",
        definition:
          "Share of material plan-to-actual variance for which Finance can " +
          "attribute a specific, quantified driver in the reporting cycle (vs. " +
          "'mix/other/unexplained').",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Management-reporting maturity ranges; strong FP&A explains 90%+ of " +
            "material variance to a driver, weak shops leave large 'other' buckets",
          label: "planning-range",
        },
        dataSource:
          "Variance analysis in the management reporting pack against driver-based " +
          "plan lines",
        whyItMatters:
          "Variance you cannot explain is variance you cannot act on. Explained " +
          "variance is the difference between reporting that informs decisions and " +
          "reporting that merely reconciles — and it depends on driver-based " +
          "plans.",
      },
      {
        key: "reporting_turnaround",
        name: "Management reporting turnaround",
        definition:
          "Working days from close completion to distributed management/board " +
          "reporting pack with commentary.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 8,
          basis:
            "Hackett reporting benchmarks; top-quartile same-day to 2 days post-" +
            "close, laggards a week or more",
          label: "planning-range",
        },
        dataSource:
          "Reporting workflow timestamps from close sign-off to pack distribution",
        whyItMatters:
          "Decision value decays with age; a reporting pack delivered a week after " +
          "close informs the past. AI-assisted commentary and a single source of " +
          "truth collapse turnaround so reporting drives the forward decision.",
      },
      {
        key: "manual_journal_rate",
        name: "Manual journal-entry rate",
        definition:
          "Share of journal entries posted manually (vs. systematic/auto-posted) " +
          "during the close.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "APQC R2R benchmarks; well-controlled closes below 10% manual, " +
            "spreadsheet-driven closes 25-30%+",
          label: "planning-range",
        },
        dataSource: "GL journal posting logs tagged manual vs systematic",
        whyItMatters:
          "Manual journals are the dominant close control risk and a direct drag " +
          "on days-to-close. A high manual rate erodes the single source of truth " +
          "and is precisely where autonomous reconciliation reduces both effort " +
          "and risk.",
      },
      {
        key: "planning_cycle_fte_effort",
        name: "Planning-cycle FTE effort",
        definition:
          "Fully-loaded FTE-months of FP&A and controllership effort consumed by a " +
          "full plan/forecast cycle (data gathering, version wrangling, " +
          "consolidation, deck assembly).",
        unit: "FTE-months / cycle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 12,
          basis:
            "Workforce Economics substrate (FP&A tower rate-card x cycle effort); " +
            "automated driver-based shops light, spreadsheet-bound shops heavy",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (FP&A/controllership tower) x cycle " +
          "activity logging",
        whyItMatters:
          "The effort metric that exposes how much scarce finance talent is spent " +
          "ASSEMBLING the plan rather than analyzing it. Automation re-deploys this " +
          "capacity from data wrangling to decision support.",
      },
      {
        key: "epm_adoption",
        name: "EPM / planning-platform adoption",
        definition:
          "Share of plan/forecast/close activity transacted in the governed EPM/" +
          "CPM platform rather than in offline spreadsheets.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "EPM maturity ranges; well-adopted platforms carry 80-90% of planning " +
            "activity, shadow-spreadsheet shops below 50%",
          label: "planning-range",
        },
        dataSource:
          "EPM/CPM usage telemetry vs. evidence of offline spreadsheet planning",
        whyItMatters:
          "Shadow spreadsheets are the enemy of the single source of truth. EPM " +
          "adoption is the structural precondition for governed, reconcilable, " +
          "auditable plans — and for AI to operate on the numbers safely.",
      },
      {
        key: "fpa_cost_pct_revenue",
        name: "FP&A & controllership cost as % of revenue",
        definition:
          "Fully-loaded operating cost of the FP&A and controllership function " +
          "(planning, reporting, close, consolidation, value attestation) as a " +
          "percentage of enterprise revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.2,
          high: 1,
          basis:
            "APQC / Hackett finance-function cost ranges for the planning/control " +
            "layer (excludes transactional ops); scale- and complexity-dependent",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (FP&A/controllership towers, fully-" +
          "loaded) over enterprise revenue from the GL",
        whyItMatters:
          "The board-level efficiency denominator for the judgment layer. The goal " +
          "is not merely cheaper finance but finance that spends less on assembly " +
          "and more on the analysis and attestation that makes value bankable.",
      },
    ],

    painThemes: [
      {
        key: "spreadsheet_bound_planning",
        name: "Spreadsheet-bound, version-fragile planning",
        description:
          "Budgeting and forecasting run in sprawling linked spreadsheets with no " +
          "single governed model, so versions diverge, logic is opaque, the cycle " +
          "drags, and no one trusts which number is current.",
        detectionSignal:
          "Low EPM adoption, long budget cycle time, frequent 'which version is " +
          "right' disputes, high planning-cycle FTE effort, broken cross-sheet " +
          "links at consolidation.",
        diagnosticQuestion:
          "Is your plan built in one governed EPM model, or in linked spreadsheets " +
          "where versions diverge and no one can say which number is current?",
      },
      {
        key: "low_forecast_accuracy",
        name: "Chronically low / un-tracked forecast accuracy",
        description:
          "Forecasts miss materially and the misses are not measured or learned " +
          "from, so the plan cannot anchor targets, incentives, or value baselines " +
          "— and re-forecasting becomes guessing.",
        detectionSignal:
          "No forecast-accuracy KPI tracked, large recurring plan-to-actual " +
          "swings, late surprise misses, sandbagged or hockey-stick forecasts.",
        diagnosticQuestion:
          "Do you measure forecast accuracy by horizon and line, and is it good " +
          "enough that the plan can credibly anchor a baseline and incentives?",
      },
      {
        key: "no_single_source_of_truth",
        name: "No single source of financial truth",
        description:
          "Plan, actuals, and management reporting live in disconnected systems " +
          "and offline models that do not reconcile, so every number is arguable " +
          "and reconciliation consumes the team — the precondition failure for " +
          "attestation.",
        detectionSignal:
          "Reporting numbers that do not tie to the GL, parallel offline models, " +
          "high manual-journal rate, large unexplained variance buckets, repeated " +
          "reconciliation rework.",
        diagnosticQuestion:
          "Do plan, actuals, and the board pack all reconcile to one source on the " +
          "GL, or are there parallel models that disagree?",
      },
      {
        key: "slow_close_manual_journals",
        name: "Slow close & manual-journal control drag",
        description:
          "The close is serial and spreadsheet-driven with heavy manual " +
          "reconciliations and journals, stretching days-to-close, consuming " +
          "skilled accountants on low-judgment matching, and raising control risk.",
        detectionSignal:
          "Days-to-close above range, high manual-journal rate, late " +
          "reconciliations, audit findings on reconciliation completeness or " +
          "journal review.",
        diagnosticQuestion:
          "How many days is your close, and what share of journals and " +
          "reconciliations are still manual rather than auto-matched and reviewed?",
      },
      {
        key: "unbaselined_value_claims",
        name: "Unbaselined, finance-disowned value claims",
        description:
          "Initiatives report benefits the business self-asserts with no " +
          "finance-signed baseline, so 'savings' never reconcile to the P&L, the " +
          "same dollar is claimed by multiple programs, and the board stops " +
          "believing the value story.",
        detectionSignal:
          "Low value-attestation coverage, high realized-vs-attested variance, " +
          "benefits that never appear in actuals, the same baseline cited by " +
          "overlapping initiatives.",
        diagnosticQuestion:
          "What share of your initiative benefits carry a finance-signed baseline, " +
          "and how close does realized value land to what was attested?",
      },
      {
        key: "reporting_not_decision_grade",
        name: "Backward-looking, non-decision-grade reporting",
        description:
          "Management reporting arrives late, reconciles the past, and leaves " +
          "large 'other/unexplained' variance buckets, so it informs rather than " +
          "drives decisions — analysts spend the cycle assembling, not advising.",
        detectionSignal:
          "Long reporting turnaround, low variance-explained %, decks heavy on " +
          "tables and light on driver attribution, leadership asking questions the " +
          "pack does not answer.",
        diagnosticQuestion:
          "How many days after close does leadership get the pack, and what share " +
          "of material variance does it explain to a specific driver?",
      },
      {
        key: "fpa_capacity_trapped_in_assembly",
        name: "FP&A capacity trapped in assembly",
        description:
          "Scarce analyst time is consumed gathering data, wrangling versions, and " +
          "building decks rather than on driver analysis, scenarios, and business " +
          "partnering — the function is a reporting factory, not a decision " +
          "partner.",
        detectionSignal:
          "High planning-cycle FTE effort, low driver-based-plan %, analysts " +
          "described as 'spreadsheet jockeys', limited scenario/sensitivity work, " +
          "business partners under-served.",
        diagnosticQuestion:
          "What share of FP&A time goes to assembling numbers versus analyzing " +
          "them and partnering with the business?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_driver_based_forecasting",
        name: "AI-assisted driver-based forecasting",
        valueMechanism:
          "Machine-learning and driver-based models generate a continuous, " +
          "bottoms-up forecast from operational drivers and external signals, " +
          "flagging where the human plan diverges — lifting forecast accuracy and " +
          "letting analysts re-forecast in minutes instead of weeks.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical actuals from the GL and operational driver data",
          "Driver-based plan structure in the EPM/CPM platform",
          "External signals (macro, demand, pipeline) where relevant",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "The model proposes; Finance owns the published forecast — no auto-publish",
          "Model drift and regime change must be monitored; accuracy tracked by horizon",
        ],
        metricsMoved: [
          "forecast_accuracy",
          "budget_cycle_time",
          "driver_based_plan_pct",
        ],
      },
      {
        key: "autonomous_reconciliation_close",
        name: "Autonomous reconciliation & continuous close",
        valueMechanism:
          "Auto-match account, bank, and intercompany reconciliations and propose " +
          "adjusting journals continuously through the period, so controllers " +
          "review exceptions rather than match line by line — compressing days-to-" +
          "close and cutting the manual-journal rate without adding headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "GL, sub-ledger, and bank/intercompany feeds",
          "Historical reconciliation matches and exception dispositions",
          "Materiality and tolerance thresholds",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Auto-posted journals are an ICFR control — SOX audit trail and approval required",
          "Materiality thresholds govern what may post autonomously vs route to review",
        ],
        metricsMoved: [
          "days_to_close",
          "manual_journal_rate",
          "planning_cycle_fte_effort",
        ],
      },
      {
        key: "ai_variance_narrative",
        name: "AI variance analysis & management narrative",
        valueMechanism:
          "AI decomposes plan-to-actual variance to driver level and drafts the " +
          "management commentary from the numbers and prior packs — lifting " +
          "variance-explained %, collapsing reporting turnaround, and freeing " +
          "analysts from deck assembly for advisory work.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Driver-based plan and actuals reconciled to one source of truth",
          "Prior management packs and commentary for style/context",
          "Chart-of-accounts and driver taxonomy to attribute variance",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Drafted commentary must be reviewed — no unverified causal claims to the board",
          "Attribution must trace to reconciled numbers, not a plausible-sounding story",
        ],
        metricsMoved: [
          "variance_explained_pct",
          "reporting_turnaround",
          "planning_cycle_fte_effort",
        ],
      },
      {
        key: "finance_copilot_self_service",
        name: "Finance copilot & self-service planning analytics",
        valueMechanism:
          "A grounded copilot answers planning and reporting questions, builds " +
          "ad-hoc scenarios, and deflects routine 'what's the number / why' " +
          "requests from FP&A — driving EPM adoption and re-deploying analyst " +
          "capacity from query-answering to partnering.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Governed EPM/CPM model and reconciled actuals as the single source",
          "Metric and driver definitions / a semantic layer",
          "Role-based entitlements to scope answers",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Answers must cite the governed model — no off-source or hallucinated figures",
          "Entitlements must fence confidential plan/segment data to authorized users",
        ],
        metricsMoved: [
          "epm_adoption",
          "planning_cycle_fte_effort",
          "reporting_turnaround",
        ],
      },
      {
        key: "ai_value_baseline_attestation",
        name: "AI-supported value baselining & attestation",
        valueMechanism:
          "AI assembles the evidence for an initiative's benefit — the baseline " +
          "from the GL, the driver logic, the planning-range benchmark, and the " +
          "haircut factors — into a finance-ready attestation pack, raising " +
          "attestation coverage and tightening realized-vs-attested variance " +
          "because every baseline is built the same disciplined way.",
        adoptionProfile: "early",
        dataDependencies: [
          "GL baseline and the initiative's value/benefits register entry",
          "Driver-based plan lines the benefit will affect",
          "Benchmark planning ranges and haircut-factor library",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Finance signs the baseline — AI assembles evidence, it does not attest",
          "Every attested number must trace to the GL and a single non-double-counted baseline",
        ],
        metricsMoved: [
          "value_attestation_coverage",
          "realized_vs_attested_variance",
          "forecast_accuracy",
        ],
      },
      {
        key: "scenario_simulation",
        name: "Scenario & sensitivity simulation",
        valueMechanism:
          "Run rapid multi-scenario and sensitivity simulations on the driver-" +
          "based model — stress macro, demand, price, and cost drivers — so " +
          "leadership sees the range of outcomes and the swing drivers instead of a " +
          "single point plan, sharpening planning quality and decision speed.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Driver-based plan model with explicit assumptions",
          "Historical sensitivity of drivers to outcomes",
          "Scenario assumption sets (macro/demand/cost cases)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Scenarios are planning ranges, not forecasts — must be labelled as such",
          "Assumption provenance must be transparent so the board can challenge it",
        ],
        metricsMoved: [
          "driver_based_plan_pct",
          "forecast_accuracy",
          "budget_cycle_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "single_source_of_financial_truth",
        name: "Single source of financial truth (governed EPM + GL)",
        description:
          "One governed planning/reporting model in which plan, forecast, and " +
          "actuals all reconcile to the GL through a shared chart of accounts and " +
          "driver/metric definitions — the platform on which trustworthy " +
          "forecasting, reporting, and attestation are even possible.",
        boundary:
          "Owns the reconciled financial model and its definitions; does not own " +
          "transactional processing (AP/AR) or treasury cash management, which feed " +
          "it data.",
        humanAccountabilityPoint: "Corporate Controller",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "driver_based_planning_model",
        name: "Driver-based planning & continuous forecast",
        description:
          "Replacing trended line-item budgeting with operational driver models " +
          "(volume x rate, headcount x cost) on a rolling-forecast cadence, so the " +
          "plan is explainable, re-forecastable in minutes, and scenario-able — " +
          "the structural enabler of forecast accuracy and fast re-planning.",
        boundary:
          "Owns the plan/forecast model and assumptions; does not own the " +
          "operational drivers themselves (set by the business), which it consumes.",
        humanAccountabilityPoint: "FP&A Leader / VP FP&A",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "value_attestation_framework",
        name: "Finance value-attestation framework",
        description:
          "A governed process where every initiative benefit is baselined to the " +
          "GL, sized against a planning range with explicit haircuts, signed off by " +
          "Finance, and later reconciled realized-vs-attested in the P&L — turning " +
          "self-reported claims into bankable, auditable value.",
        boundary:
          "Owns the baseline, the attestation sign-off, and realized reconciliation; " +
          "does not own initiative delivery or the value-office origination of the " +
          "claim (the value office sizes; Finance attests).",
        humanAccountabilityPoint: "CFO / Finance Value-Attestation Owner",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "decision_grade_reporting",
        name: "Decision-grade management reporting",
        description:
          "A fast, driver-attributed management reporting layer — variance " +
          "decomposed to drivers, AI-drafted reviewed commentary, same-week " +
          "turnaround — so reporting drives the forward decision rather than " +
          "reconciling the past.",
        boundary:
          "Owns the reporting pack, variance attribution, and commentary; does not " +
          "own the underlying close (controllership) or the decisions leadership " +
          "takes from the pack.",
        humanAccountabilityPoint: "Head of Management Reporting / FP&A",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Finance value is realized on two reinforcing fronts, both gated by the " +
        "function's binding constraints. First, EFFICIENCY: automate the assembly " +
        "work — autonomous reconciliation and continuous close cut days-to-close " +
        "and the manual-journal rate; AI variance narrative and a finance copilot " +
        "collapse reporting turnaround and re-deploy planning-cycle FTE effort " +
        "from wrangling to advising. Second, and larger, DECISION QUALITY: " +
        "driver-based planning and AI-assisted forecasting lift forecast accuracy " +
        "and shrink the budget cycle, so the plan can credibly anchor targets, " +
        "incentives, and — the keystone — VALUE ATTESTATION. The attestation prize " +
        "is unique to this function: by baselining every initiative benefit to the " +
        "GL and signing it off, Finance converts self-reported claims into bankable " +
        "value and protects the enterprise from double-counted, never-landing " +
        "savings. BUT the binding constraints are honest: none of this holds " +
        "without (1) forecast accuracy good enough to trust a baseline and (2) a " +
        "single source of financial truth that reconciles plan and actuals on the " +
        "GL. Absent those, attestation is theater and the efficiency gains are " +
        "automating a model no one believes. Cost and FTE effort bind to the " +
        "Workforce Economics substrate; every attested benefit traces to a tower " +
        "and reconciles to the P&L.",
      dominantHaircutFactors: [
        {
          factor: "Forecast accuracy / data trust ceiling",
          rationale:
            "If the forecast and the underlying numbers are not trusted, baselines " +
            "and attested benefits are arguable and value claims must be discounted " +
            "until accuracy and reconciliation are demonstrated.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed discount between claimed and defensible value when " +
              "forecast accuracy is low and the model is not reconciled",
            label: "planning-range",
          },
        },
        {
          factor: "No single source of truth / fragmented systems",
          rationale:
            "Disconnected plan/actuals/reporting models and shadow spreadsheets cap " +
            "how much automation and attestation can be trusted, because numbers do " +
            "not tie out and reconciliation absorbs the gains.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Implementation experience where fragmented finance systems throttled " +
              "automation benefit and attestation credibility",
            label: "planning-range",
          },
        },
        {
          factor: "Attestation discipline / double-count risk",
          rationale:
            "Without a single baseline and finance sign-off, the same dollar is " +
            "claimed by multiple initiatives; forward value must be discounted until " +
            "every benefit is baselined once and reconciled to the GL.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Gap between gross self-reported benefits and finance-attested, GL-" +
              "reconciled benefits in benefits-realization reviews",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & change (shadow spreadsheets persist)",
          rationale:
            "Value requires analysts and the business to move into the governed EPM " +
            "model and trust AI output; persistent shadow spreadsheets and slow " +
            "adoption leave benefit on the table.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "EPM transformation change-management experience where shadow " +
              "spreadsheets and low adoption diluted realized benefit",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Close & reconciliation effort reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reduction in close effort and days-to-close from " +
              "autonomous reconciliation and continuous close programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in controllership close/reconciliation FTE effort " +
            "and days-to-close",
        },
        {
          lever: "Planning & reporting cycle effort reduction",
          range: {
            low: 0.2,
            high: 0.45,
            basis:
              "Reported reduction in plan/report assembly effort from driver-based " +
              "planning, AI variance narrative, and finance copilot",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in planning-cycle FTE effort re-deployed from " +
            "assembly to analysis",
        },
        {
          lever: "Forecast accuracy improvement",
          range: {
            low: 0.03,
            high: 0.12,
            basis:
              "Reported absolute lift in next-period forecast accuracy from driver-" +
              "based and AI-assisted forecasting",
            label: "planning-range",
          },
          measuredAs:
            "Absolute percentage-point improvement in forecast_accuracy at the " +
            "next-quarter horizon",
        },
        {
          lever: "Attested value made bankable (coverage lift)",
          range: {
            low: 0.3,
            high: 0.6,
            basis:
              "Increase in the share of portfolio benefit carrying a finance-signed " +
              "baseline once an attestation framework is in place",
            label: "planning-range",
          },
          measuredAs:
            "Absolute lift in value_attestation_coverage across the initiative " +
            "portfolio",
        },
      ],
      timeToValueBand:
        "Efficiency levers (autonomous reconciliation / continuous close, AI " +
        "variance narrative, finance copilot): 2-4 quarters once the single source " +
        "of truth exists. Driver-based planning and forecast-accuracy lift: 2-3 " +
        "planning cycles to mature. A value-attestation framework: 1-2 quarters to " +
        "stand up, but realized-vs-attested credibility takes a full initiative " +
        "cycle to prove. Full FP&A & controllership modernization: 18-30 months, " +
        "gated on the single source of truth landing first.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "EPM / CPM planning platform",
          role:
            "System of record for budgeting, forecasting, driver-based planning, " +
            "scenario analysis, and management reporting — the governed plan model.",
          examples: [
            "Anaplan",
            "Oracle EPM Cloud / Hyperion",
            "Workday Adaptive Planning",
            "OneStream",
            "SAP Analytics Cloud / BPC",
          ],
        },
        {
          name: "ERP / general ledger",
          role:
            "System of record for actuals — the GL and sub-ledgers that every plan, " +
            "report, and attested baseline must reconcile to.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion / E-Business Suite",
            "Microsoft Dynamics 365 Finance",
            "Workday Financials",
          ],
        },
        {
          name: "Consolidation & close management",
          role:
            "Drives the consolidated close: task management, account " +
            "reconciliation, intercompany matching, and consolidation entries.",
          examples: [
            "BlackLine",
            "Oracle FCCS",
            "OneStream",
            "Trintech Cadency",
          ],
        },
        {
          name: "Value / benefits-realization register",
          role:
            "Tracks initiative benefits, baselines, attestation sign-off, and " +
            "realized-vs-attested reconciliation — the attestation source.",
          examples: [
            "Value-office / benefits-realization tooling",
            "EPM value-tracking module",
            "Governed initiative register reconciled to the GL",
          ],
        },
        {
          name: "BI / analytics & semantic layer",
          role:
            "Distributes governed metrics and variance analysis with shared metric/" +
            "driver definitions for reporting and self-service.",
          examples: [
            "Power BI",
            "Tableau",
            "Looker",
            "A governed semantic layer over the EPM/GL",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Financial Officer",
          accountability:
            "The single source of financial truth, the integrity of the plan and " +
            "forecast, and ultimate ownership of value attestation — signing off " +
            "that a benefit is real.",
        },
        {
          title: "Corporate Controller",
          accountability:
            "Close quality and timeliness, consolidation, journal and " +
            "reconciliation control (ICFR/SOX), and that reported actuals are " +
            "complete and accurate.",
        },
        {
          title: "VP / Head of FP&A",
          accountability:
            "Forecast accuracy, the planning cycle, driver-based plan coverage, " +
            "management reporting quality, and business partnering.",
        },
        {
          title: "Finance Value-Attestation Owner",
          accountability:
            "The attestation framework: that every initiative benefit is baselined " +
            "to the GL, signed off, and reconciled realized-vs-attested without " +
            "double-counting.",
        },
        {
          title: "Business Finance / FP&A Business Partner",
          accountability:
            "Translating business drivers into the plan, explaining variance to " +
            "decisions, and supporting the segment's commitments and benefits.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Sarbanes-Oxley (SOX) / internal controls over financial reporting",
          relevance:
            "The close, consolidation, journal posting, and management reporting " +
            "are ICFR controls; auto-posted journals and AI in the close require " +
            "audit trails, approval evidence, and segregation of duties.",
        },
        {
          name: "GAAP / IFRS accounting & disclosure standards",
          relevance:
            "Consolidation, revenue recognition, and management reporting must " +
            "conform to the applicable accounting framework; attested baselines " +
            "must be defined consistently with reported actuals.",
        },
        {
          name: "SEC / external-reporting & MD&A obligations (public filers)",
          relevance:
            "Management reporting and forecast commentary feed external reporting " +
            "and guidance; AI-drafted narrative must be accurate and reviewable to " +
            "avoid misstatement.",
        },
        {
          name: "Audit & model-governance expectations for AI in finance",
          relevance:
            "AI used in forecasting, reconciliation, and attestation falls under " +
            "model-risk and audit scrutiny: explainability, validation, and human " +
            "accountability for published numbers are required.",
        },
      ],
      canonicalTerms: [
        {
          term: "FP&A (financial planning & analysis)",
          definition:
            "The planning, forecasting, management reporting, and analysis function " +
            "that turns financial data into forward decisions and commitments.",
        },
        {
          term: "Driver-based planning",
          definition:
            "Building the plan from operational drivers (volume x rate, headcount x " +
            "cost) rather than trending prior-year line items, so it is explainable " +
            "and re-forecastable.",
        },
        {
          term: "Single source of financial truth",
          definition:
            "One governed, reconciled model where plan, forecast, and actuals all " +
            "tie to the GL — the precondition for trustworthy reporting and " +
            "attestation.",
        },
        {
          term: "Value attestation",
          definition:
            "Finance baselining an initiative benefit to the GL, signing it off as " +
            "real, and later reconciling realized-vs-attested — converting a " +
            "self-reported claim into bankable value.",
        },
        {
          term: "Baseline",
          definition:
            "The agreed pre-initiative cost/performance level, sourced from the GL, " +
            "against which a benefit is measured; a benefit without a finance-signed " +
            "baseline is unattested.",
        },
        {
          term: "R2R (record-to-report)",
          definition:
            "The end-to-end process from transaction recording through close, " +
            "consolidation, and management reporting.",
        },
        {
          term: "Rolling forecast",
          definition:
            "A continuously updated forecast over a fixed forward horizon, replacing " +
            "a single annual budget as the primary forward view.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Forecast accuracy and the planning cycle",
        authoritativeSource:
          "EPM/CPM forecast versions versus GL actuals, snapshotted by forecast " +
          "cycle and horizon",
        whatGoodEvidenceLooksLike:
          "Forecast-vs-actual error by line and horizon over several cycles, with " +
          "the budget/forecast cycle calendar and driver-based coverage.",
        weakEvidenceToReject:
          "A vendor 'customers improve accuracy by X%' or a single good quarter " +
          "with no horizon, line, or multi-cycle basis.",
      },
      {
        claim: "Close speed, manual-journal rate, and reconciliation drag",
        authoritativeSource:
          "Consolidation/close task-management timestamps and GL journal posting " +
          "logs (manual vs systematic)",
        whatGoodEvidenceLooksLike:
          "Working days per close step with manual-vs-auto-matched reconciliation " +
          "counts and the manual-journal share.",
        weakEvidenceToReject:
          "A headline 'we close in 5 days' with no step detail or manual-effort " +
          "breakdown.",
      },
      {
        claim: "Value attestation coverage and realized-vs-attested variance",
        authoritativeSource:
          "Value/benefits register cross-referenced to finance-signed baselines " +
          "and realized impact reconciled to the GL",
        whatGoodEvidenceLooksLike:
          "Per-initiative: a GL-sourced baseline, the attested benefit with " +
          "planning range and haircuts, finance sign-off, and realized variance " +
          "after implementation.",
        weakEvidenceToReject:
          "Self-reported program savings with no finance-signed baseline and no GL " +
          "reconciliation path (unattested claim).",
      },
      {
        claim: "Reporting turnaround and variance explained",
        authoritativeSource:
          "Reporting workflow timestamps and the management pack's variance " +
          "attribution against driver-based plan lines",
        whatGoodEvidenceLooksLike:
          "Days from close sign-off to pack distribution and the share of material " +
          "variance attributed to a specific quantified driver.",
        weakEvidenceToReject:
          "A claim that reporting is 'timely and insightful' with no turnaround " +
          "measure or variance-attribution detail.",
      },
      {
        claim: "FP&A / controllership cost and FTE effort",
        authoritativeSource:
          "Workforce Economics substrate (FP&A/controllership towers, rate-card x " +
          "FTE) over enterprise revenue from the GL",
        whatGoodEvidenceLooksLike:
          "Fully-loaded function cost over revenue and FTE-months per planning " +
          "cycle, split assembly vs analysis effort.",
        weakEvidenceToReject:
          "A blanket 'finance is lean/expensive' assertion with no tower-level cost " +
          "basis or cycle-effort measure.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do plan, actuals, and the board pack all reconcile to one source on the GL, or are there parallel models that disagree?",
      "Do you measure forecast accuracy by horizon and line, and is it good enough that the plan can credibly anchor a baseline and incentives?",
      "What share of your plan is built on driver-based models versus trended line items, and how long is the budget cycle?",
      "What share of initiative benefits carry a finance-signed baseline, and how close does realized value land to what was attested?",
      "How many days is your close, what is the manual-journal rate, and how soon after close does leadership get a decision-grade pack?",
      "What share of FP&A time goes to assembling numbers versus analyzing them and partnering with the business?",
      "What share of planning/reporting activity runs in the governed EPM platform versus offline shadow spreadsheets?",
    ],
    maturitySignals: [
      "One governed EPM model where plan, forecast, and actuals reconcile to the GL — no parallel shadow spreadsheets.",
      "Forecast accuracy is tracked by horizon and line and good enough to anchor baselines, targets, and incentives.",
      "Most of the plan is driver-based and re-forecastable in minutes, with scenarios run as a routine, not a project.",
      "Every initiative benefit carries a finance-signed baseline reconciled to the GL, and realized-vs-attested variance stays inside the planning range.",
    ],
    redFlags: [
      "Plan, actuals, and reporting live in disconnected models that do not reconcile — there is no single source of financial truth.",
      "Forecast accuracy is not measured, and recurring material misses are not learned from.",
      "Initiative benefits are self-reported with no finance-signed baseline, and 'savings' never appear in the P&L.",
      "Days-to-close and manual-journal rate are high, and the management pack lands late with large unexplained variance buckets.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EPM / CPM planning platforms (Anaplan, Oracle EPM, Workday Adaptive, OneStream)",
        category: "Budgeting, forecasting, driver-based planning, consolidation",
        switchingCost:
          "High — models, driver logic, and the planning calendar are deeply built into the platform; re-modeling and re-training are the real cost.",
        renewalDynamics:
          "Per-user or workspace/module subscription; AI planning capabilities increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Close & reconciliation platforms (BlackLine, Trintech, Oracle FCCS)",
        category: "Account reconciliation, close management, consolidation",
        switchingCost:
          "Moderate-to-high — reconciliation rules, close workflows, and controls accrete; re-implementing controls is disruptive.",
        renewalDynamics:
          "Per-account or subscription pricing; autonomous-reconciliation/AI features upsold; leverage measured close-time lift at renewal.",
      },
      {
        vendorName: "ERP / GL incumbents (SAP, Oracle, Microsoft, Workday)",
        category: "General ledger / actuals system of record + native EPM add-ons",
        switchingCost:
          "Extreme — the GL is fused to enterprise data and process; rarely sourced standalone, native EPM bundled to discipline best-of-breed.",
        renewalDynamics:
          "Bundled enterprise agreements; native planning/close modules pushed against best-of-breed at renewal.",
      },
      {
        vendorName: "BI / semantic-layer & analytics (Power BI, Tableau, Looker)",
        category: "Management reporting, variance analytics, self-service",
        switchingCost:
          "Moderate — content and semantic definitions accrete; replaceable with re-build effort, watch metric-definition lock-in.",
        renewalDynamics:
          "Per-user/capacity subscription; embedded AI/copilot reporting upsold as premium.",
      },
      {
        vendorName: "Value-office / benefits-realization tooling",
        category: "Initiative benefit tracking, baselining, attestation",
        switchingCost:
          "Low-to-moderate — value registers are often lightweight or bespoke; the durable asset is the GL-reconciled baseline discipline, not the tool.",
        renewalDynamics:
          "Subscription or embedded in EPM; the negotiation is whether attestation rigor (GL reconciliation) is enforced, not the tool price.",
      },
    ],
    switchingCosts:
      "The GL and the mature EPM model are effectively non-switchable in " +
      "isolation — driver logic, controls, and the planning calendar are built " +
      "in. The negotiable frontier is in AI/automation capabilities layered on " +
      "the EPM and close platforms, in the BI/semantic layer, and in enforcing " +
      "attestation rigor (GL-reconciled baselines) regardless of which tooling " +
      "holds the value register.",
    negotiationLevers: [
      "Tie EPM/close AI-feature pricing to measured outcomes — forecast-accuracy lift, days-to-close reduction — not seat counts",
      "Audit, explainability, and model-validation rights for any AI in forecasting, reconciliation, or attestation (SOX/model-risk)",
      "Model and metric-definition portability to prevent semantic-layer and planning-model lock-in",
      "Bundle native ERP EPM against best-of-breed at renewal to discipline pricing",
      "Pilot-to-scale gating on one entity/segment with reconciliation parity proof before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      forecast_accuracy_claim: [
        "forecast-vs-actual error by line and horizon",
        "multiple forecast cycles (not a single quarter)",
        "driver-based coverage basis",
      ],
      close_efficiency_claim: [
        "close task timestamps by step",
        "manual-vs-systematic journal split",
        "reconciliation auto-match basis",
      ],
      reporting_quality_claim: [
        "close-to-distribution turnaround",
        "variance attributed to a specific driver",
      ],
      value_attestation_claim: [
        "GL-sourced baseline (single, no double-count)",
        "finance sign-off evidence",
        "planning-range benchmark and explicit haircuts",
        "realized-vs-attested reconciliation path to the P&L",
      ],
      cost_effort_claim: [
        "Workforce Economics substrate cost basis (rate-card x FTE)",
        "planning-cycle effort logging",
        "enterprise revenue denominator",
      ],
    },
    citationStandard:
      "Quantitative finance claims cite the governed source: forecast accuracy " +
      "cites EPM forecast versions vs GL actuals by line and horizon over " +
      "multiple cycles; close and journal claims cite close-tool timestamps and " +
      "GL posting logs; reporting claims cite turnaround and driver-level " +
      "variance attribution. A VALUE ATTESTATION claim must cite a SINGLE " +
      "GL-sourced baseline (no double-count), finance sign-off, a labelled " +
      "planning range with haircuts, and the path to realized-vs-attested " +
      "reconciliation in the P&L — never a self-reported benefit asserted as a " +
      "finance number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant does not track forecast accuracy or has no single source of truth — frame benchmarks as industry planning ranges, not their measured number.",
      "An initiative benefit lacks a finance-signed baseline — flag it as an unattested self-reported claim, not bankable value.",
      "A combined savings/value number may double-count the same baseline across initiatives — flag the double-count risk before summing.",
      "Vendor-reported accuracy or close-time outcomes are cited — mark as provider claims pending tenant validation.",
    ],
    inferenceLanguage: [
      "Across enterprises at this scale, next-quarter forecast accuracy typically runs...",
      "Without your tracked accuracy and a reconciled source of truth, the industry pattern suggests...",
      "Peer finance functions commonly close in... days once the close is automated...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific forecast-accuracy, days-to-close, or attestation-coverage number for this tenant",
      "A benefit treated as attested without a finance-signed, GL-reconciled baseline",
      "A combined value/savings number that may double-count the same baseline",
      "A claim that a specific initiative's realized value will match its attested benefit",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "forecast accuracy trend / how good is our forecast by horizon",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend forecast accuracy by horizon and line against the planning range across cycles.",
    },
    {
      questionPattern:
        "plan-to-actual variance bridge / what drove the variance",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "valueBridge",
      note: "Bridge plan to actual by driver, sizing each driver's contribution and the residual unexplained bucket.",
    },
    {
      questionPattern:
        "value attestation status / which benefits are finance-signed and how realized lands",
      exhibitKind: "table",
      note: "Per initiative: GL baseline, attested benefit (range + haircuts), finance sign-off, realized value, realized-vs-attested variance.",
    },
    {
      questionPattern:
        "finance KPI scorecard / FP&A and controllership health",
      exhibitKind: "table",
      note: "Forecast accuracy, days-to-close, budget cycle time, driver-based %, attestation coverage, manual-journal rate, reporting turnaround vs planning ranges.",
    },
    {
      questionPattern:
        "scenario range / what is the outcome spread and what swings it",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of swing drivers showing which assumptions move the outcome most across scenarios.",
    },
    {
      questionPattern:
        "finance cost / where effort sits across the planning and control layer",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost/effort across planning, reporting, close, and attestation to show where capacity is trapped in assembly.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A single source of financial truth (governed EPM reconciled to the GL) is established before scaling AI on the numbers",
      "Forecast accuracy is tracked and good enough to anchor baselines, targets, and value attestation",
      "Value attestation is finance-owned: every benefit baselined to the GL, signed off, and reconciled realized-vs-attested with no double-count",
      "FP&A capacity is deliberately re-deployed from assembly to analysis and business partnering as automation lands",
    ],
    failureDrivers: [
      "No single source of truth — plan/actuals/reporting do not reconcile, so automation and attestation are built on numbers no one trusts",
      "Forecast accuracy is low or untracked, so the plan cannot credibly anchor a baseline and attestation becomes theater",
      "Benefits are self-reported without finance-signed baselines, savings double-count, and realized value never lands in the P&L",
      "Shadow spreadsheets persist and analysts stay trapped in assembly, so the EPM model and AI output are never trusted or adopted",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Controllership efficiency adopts first where it is measurable — " +
      "autonomous reconciliation and continuous close, AI variance narrative — " +
      "because the gains are tangible and control posture can be governed. " +
      "Driver-based planning and AI-assisted forecasting follow over a few " +
      "planning cycles as the model matures and accuracy is proven. Value " +
      "attestation is adopted last and most deliberately: it requires the single " +
      "source of truth, forecast trust, and a CFO mandate to make finance " +
      "sign-off the gate for counting any benefit — but once in place it is the " +
      "highest-leverage and stickiest capability.",
    roiClarity: "medium",
    roiClarityBasis:
      "Efficiency ROI (close time, reporting turnaround, planning-cycle FTE " +
      "effort) is firm because it is directly measurable in the Workforce " +
      "Economics substrate and close logs. Decision-quality and attestation ROI " +
      "are softer: forecast-accuracy lift and 'value made bankable' depend on " +
      "the binding constraints — a trusted forecast and a single source of truth " +
      "— and the value is realized indirectly through better decisions and " +
      "avoided double-counting rather than a clean line in the P&L. That is " +
      "exactly why the evidence and hedge rules force a GL-reconciled baseline " +
      "and finance sign-off before any benefit is treated as attested.",
  },

  regulatoryFrame: {
    name: "SOX / ICFR and accounting-standards governance (GAAP/IFRS)",
    relevance:
      "The dominant regulatory frame for the finance judgment layer: the close, " +
      "consolidation, journal posting, and management reporting are ICFR " +
      "controls requiring audit trails, approval evidence, and segregation of " +
      "duties, and AI in the close or forecast falls under model-risk and audit " +
      "scrutiny. Plans, reported actuals, and attested baselines must be defined " +
      "consistently with GAAP/IFRS, and for public filers feed SEC external " +
      "reporting — so AI-drafted narrative and any auto-posted journal must be " +
      "accurate, explainable, and human-accountable (see vocabulary." +
      "regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
