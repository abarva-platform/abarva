// Consilium expert — Sales & Revenue Operations (front office, cross-cutting).
//
// W3 (wave 3) draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// A cross-cutting, front-office expert spanning the whole revenue engine:
// pipeline & forecasting, CRM hygiene, lead scoring & routing, seller
// productivity / copilots, conversation intelligence, deal desk / CPQ, and
// churn / expansion. Cross-industry — the same CRM + revenue-stack spine recurs
// in B2B SaaS, manufacturing, financial services, healthcare, and distribution.
//
// Honesty posture: this is a domain where AI demos dazzle and production
// disappoints. The pack is deliberately blunt about three truths. (1) CRM data
// quality gates EVERYTHING — every AI bet (scoring, forecasting, copilots)
// rides on the completeness and accuracy of fields reps don't reliably fill.
// (2) The "AI SDR" / autonomous-outbound category is overhyped and routinely
// underperforms human-curated outbound on reply quality, deliverability, and
// brand risk. (3) Rep ADOPTION, not model quality, is the binding constraint —
// a tool reps route around moves no metric. Excludes the marketing demand-gen
// engine upstream of MQL handoff and the post-sale services/implementation
// motion downstream of the close — those route to other experts.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const salesRevenueOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.sales-revenue-operations",
    expertName: "Sales & Revenue Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "sales-revenue-operations",
    scopeNote:
      "AI across the revenue engine: pipeline management & forecasting, CRM " +
      "hygiene, lead scoring & routing, seller productivity / copilots, " +
      "conversation intelligence, deal desk / CPQ, and churn / expansion. " +
      "Covers the trade-offs across forecast accuracy, win rate, cycle time, " +
      "selling-time, and revenue retention — and is candid that CRM data " +
      "quality gates every AI bet, that autonomous 'AI SDR' outbound is " +
      "overhyped, and that rep adoption is the binding constraint. " +
      "Cross-industry (B2B SaaS, manufacturing, financial services, healthcare, " +
      "distribution). Excludes the upstream marketing demand-generation engine " +
      "before MQL handoff and the downstream post-sale services / " +
      "implementation motion — those route to other experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "forecast_accuracy",
        name: "Forecast accuracy",
        definition:
          "How close the committed forecast lands to actual booked revenue for " +
          "a period, measured as 100% minus the absolute percentage error " +
          "between forecast and actual (so 90% means a 10% miss in either " +
          "direction).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Sales-operations and RevOps benchmark ranges; best-in-class B2B " +
            "orgs hold within ~5% of commit, while volatile or new-logo-heavy " +
            "books run wider",
          label: "planning-range",
        },
        dataSource:
          "CRM forecast snapshots (commit/best-case categories) compared to " +
          "closed-won bookings in the period, from the CRM and finance ledger",
        whyItMatters:
          "The board's trust currency — a forecast that misses either way " +
          "destroys credibility and capacity planning. AI forecasting earns its " +
          "keep only when it beats the rep roll-up consistently AND the " +
          "underlying CRM stage/amount data is clean enough to trust.",
      },
      {
        key: "win_rate",
        name: "Win rate",
        definition:
          "Share of qualified opportunities that close won out of all " +
          "opportunities that reach a resolved outcome (won + lost) in the " +
          "period, measured on a consistent qualification bar.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 30,
          basis:
            "B2B opportunity-to-close win-rate ranges vary widely by deal size, " +
            "inbound vs outbound source, and how early an opp is counted; " +
            "shorter/transactional motions run higher",
          label: "planning-range",
        },
        dataSource:
          "CRM opportunity records with consistent stage entry/exit and " +
          "won/lost disposition coding",
        whyItMatters:
          "The conversion engine of pipeline economics — small win-rate gains " +
          "compound through the funnel. But it is only comparable when the " +
          "qualification bar and 'when an opp is created' are consistent; loose " +
          "early-stage counting deflates it and hides real performance.",
      },
      {
        key: "sales_cycle_length",
        name: "Sales cycle length",
        definition:
          "Median elapsed days from opportunity creation (or qualification) to " +
          "closed-won, measured on won deals to avoid the survivorship trap of " +
          "open or stalled deals.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 120,
          basis:
            "Highly segment-dependent: transactional SMB motions close in weeks, " +
            "enterprise/regulated deals run 6-12+ months; the band reflects the " +
            "common mid-market range",
          label: "planning-range",
        },
        dataSource:
          "CRM opportunity create-date to close-date on won deals, by segment " +
          "and deal size",
        whyItMatters:
          "Drives cash velocity and capacity — a shorter cycle means each rep " +
          "carries more concurrent throughput. AI (next-best-action, automated " +
          "follow-up, deal-desk acceleration) targets cycle time, but watch that " +
          "speed gains don't come from skipping qualification.",
      },
      {
        key: "pipeline_coverage_ratio",
        name: "Pipeline coverage ratio",
        definition:
          "Ratio of open qualified pipeline value to the revenue target for the " +
          "period — e.g. 3.0x means three dollars of pipeline for every dollar " +
          "of quota to be booked.",
        unit: "x",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 3,
          high: 4,
          basis:
            "Common planning heuristic given typical win rates; the right number " +
            "is the inverse of the segment's true win rate, not a universal 3x — " +
            "padded or inflated pipeline makes coverage meaningless",
          label: "planning-range",
        },
        dataSource:
          "Open opportunity value in commit/best-case/pipeline categories from " +
          "the CRM, divided by the period quota from finance/RevOps",
        whyItMatters:
          "The early-warning gauge on whether the number is makeable — but only " +
          "as honest as the pipeline behind it. Inflated stages, zombie deals, " +
          "and stale close dates make coverage look healthy while the real " +
          "makeable number is far lower; CRM hygiene gates its meaning.",
      },
      {
        key: "quota_attainment",
        name: "Quota attainment (% of reps at/over quota)",
        definition:
          "Share of quota-carrying reps who reach or exceed their assigned " +
          "quota in the period — the distribution health of the sales force, " +
          "distinct from aggregate bookings.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 65,
          basis:
            "Reported B2B attainment distributions; healthy orgs land the " +
            "majority of reps near quota, while a small number of top performers " +
            "carrying the team is a concentration risk",
          label: "planning-range",
        },
        dataSource:
          "Bookings credited per rep vs assigned quota from the CRM and " +
          "incentive-compensation system",
        whyItMatters:
          "The honesty check on whether performance is broad or concentrated. A " +
          "high aggregate number carried by two reps is fragile; AI enablement " +
          "and copilots are judged on whether they lift the middle of the " +
          "distribution, not just the stars.",
      },
      {
        key: "lead_conversion_rate",
        name: "Lead conversion rate",
        definition:
          "Share of leads (or MQLs) that convert to a qualified opportunity " +
          "within a defined window, measured on a consistent qualification " +
          "definition across sources.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 15,
          basis:
            "MQL-to-opportunity conversion ranges vary sharply by source and " +
            "lead definition; inbound/intent-rich leads convert far higher than " +
            "cold or purchased lists",
          label: "planning-range",
        },
        dataSource:
          "Marketing-automation lead records joined to CRM opportunity " +
          "creation, with source and conversion-window tracking",
        whyItMatters:
          "Where lead scoring and routing earn or lose their keep — better " +
          "scoring should lift conversion and speed-to-lead. But it is only " +
          "comparable when lead definitions are consistent; redefining 'MQL' to " +
          "flatter the number is the central vanity trap.",
      },
      {
        key: "crm_data_completeness",
        name: "CRM data completeness",
        definition:
          "Share of records (accounts, contacts, opportunities) with the " +
          "required fields populated, accurate, and current for the fields AI " +
          "and reporting actually depend on (stage, amount, close date, next " +
          "step, contact role).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Field-completeness ranges from data-quality audits; many orgs sit " +
            "below the level AI scoring/forecasting actually needs, which is the " +
            "silent reason AI bets underperform",
          label: "planning-range",
        },
        dataSource:
          "CRM field-population and validation audits across the records and " +
          "fields that scoring, forecasting, and reporting consume",
        whyItMatters:
          "The dependency under every AI bet in this domain. Scoring, " +
          "forecasting, and copilots are capped by what reps actually log — " +
          "garbage-in is the dominant failure mode, and improving it is " +
          "frequently the highest-ROI move before any model is bought.",
      },
      {
        key: "ramp_time",
        name: "New-hire ramp time",
        definition:
          "Median time for a new sales rep to reach full productivity, " +
          "commonly defined as the point of sustained quota attainment or a set " +
          "fraction of expected bookings.",
        unit: "months",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 9,
          basis:
            "Ramp ranges by motion complexity: transactional inside-sales ramps " +
            "in a quarter, complex enterprise selling in 6-9+ months",
          label: "planning-range",
        },
        dataSource:
          "Hire date to first sustained-attainment month from the CRM and " +
          "incentive-comp system, by cohort",
        whyItMatters:
          "A direct cost and capacity lever — faster ramp means more selling " +
          "capacity sooner and less wasted comp. Copilots, conversation " +
          "intelligence, and curated playbooks target ramp by putting best-rep " +
          "behavior in front of new hires from day one.",
      },
      {
        key: "rep_selling_time",
        name: "Rep selling-time %",
        definition:
          "Share of a rep's working time spent on direct revenue-generating " +
          "activity (prospecting, calls, meetings, proposals) versus " +
          "administrative work, CRM data entry, and internal overhead.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 45,
          basis:
            "Time-allocation studies repeatedly show reps spend well under half " +
            "their time actually selling; the rest is admin, CRM entry, and " +
            "internal meetings",
          label: "planning-range",
        },
        dataSource:
          "Activity-capture / time-study data and CRM activity logs, " +
          "categorized into selling vs non-selling time",
        whyItMatters:
          "The clearest productivity headroom — automating CRM entry, " +
          "note-taking, and follow-up drafting gives selling time back. It is " +
          "also the metric that exposes whether a 'copilot' actually reduces " +
          "admin or just adds another tool reps must feed.",
      },
      {
        key: "net_revenue_retention",
        name: "Net revenue retention (NRR)",
        definition:
          "Revenue from the existing customer base at period end versus its " +
          "value at period start, including expansion and net of churn and " +
          "contraction — above 100% means the base grows without new logos.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 100,
          high: 120,
          basis:
            "B2B SaaS NRR benchmarks; best-in-class clears 120%+, healthy sits " +
            "above 100%, and below 100% means the base is leaking faster than it " +
            "expands",
          label: "planning-range",
        },
        dataSource:
          "Recurring-revenue ledger / billing system tracking expansion, " +
          "contraction, and churn by cohort",
        whyItMatters:
          "The compounding engine of durable revenue and the cheapest growth " +
          "there is. Churn-prediction and expansion-signal AI target NRR " +
          "directly, but the value is real only when the predicted signal " +
          "triggers an action a human actually takes in time.",
      },
      {
        key: "cac_payback",
        name: "CAC payback period",
        definition:
          "Months of gross-margin-adjusted recurring revenue required to recoup " +
          "the fully-loaded cost of acquiring a customer (sales + marketing " +
          "spend divided by new-customer gross-margin contribution).",
        unit: "months",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 12,
          high: 24,
          basis:
            "B2B SaaS CAC-payback benchmarks; efficient orgs recover under ~18 " +
            "months, and beyond ~24 months the unit economics strain",
          label: "planning-range",
        },
        dataSource:
          "Fully-loaded sales & marketing spend from finance divided by " +
          "new-customer gross-margin contribution from the billing ledger",
        whyItMatters:
          "The efficiency verdict on the whole revenue engine — it ties " +
          "productivity, win rate, and cycle time to cash. AI bets must be read " +
          "against payback: a copilot that lifts activity but not efficiency, or " +
          "a tool whose license cost outweighs the lift, worsens it.",
      },
    ],

    painThemes: [
      {
        key: "crm_garbage_in",
        name: "CRM garbage-in (the gate under every AI bet)",
        description:
          "Reps under-fill and mis-fill the CRM — stale close dates, default " +
          "amounts, skipped next-steps, miscoded stages — because data entry " +
          "feels like overhead with no payback to them. Every downstream AI bet " +
          "(scoring, forecasting, copilots) then trains on and reasons over data " +
          "that doesn't reflect reality, so the model's output is confidently " +
          "wrong.",
        detectionSignal:
          "Low field-completeness on stage/amount/close-date/next-step; large " +
          "share of deals with close dates in the past; bulk-edits at quarter " +
          "end; forecast roll-up that diverges sharply from the rep gut-check.",
        diagnosticQuestion:
          "What is your field-completeness on the fields AI and forecasting " +
          "actually consume, and how many open deals currently have a close date " +
          "already in the past?",
      },
      {
        key: "ai_sdr_overreach",
        name: "AI-SDR overreach (autonomous outbound underperforms)",
        description:
          "Teams buy 'autonomous AI SDR' tooling expecting it to replace human " +
          "prospecting, then find generic AI-written sequences get low reply " +
          "rates, trip spam filters, damage domain deliverability, and risk " +
          "brand-tone misfires — net-negative versus tightly human-curated " +
          "outbound. The hype outruns what the category reliably delivers today.",
        detectionSignal:
          "Falling reply/positive-reply rates as volume scales; rising " +
          "unsubscribe and spam-complaint rates; domain/sender-reputation " +
          "degradation; pipeline 'sourced' by AI outreach that converts far " +
          "worse than human-sourced.",
        diagnosticQuestion:
          "For your automated outbound, what are the positive-reply, " +
          "unsubscribe, and spam-complaint rates versus human-curated outbound, " +
          "and is sender-domain reputation holding?",
      },
      {
        key: "rep_adoption_route_around",
        name: "Rep adoption route-around (the binding constraint)",
        description:
          "Sales tools live or die on rep adoption, and reps abandon anything " +
          "that adds clicks without obvious payback — so copilots, scoring, and " +
          "guided-selling features get logged-in-once and ignored, and the " +
          "business case never lands because the behavior change never happened.",
        detectionSignal:
          "Low weekly active usage of the tool among reps; high override/ignore " +
          "rate on AI suggestions; shadow spreadsheets and side-channels for the " +
          "real pipeline; enablement that never moves to habit.",
        diagnosticQuestion:
          "What is weekly active rep usage of the tool, and when reps ignore " +
          "the AI's recommendation, do you know why — or just that they did?",
      },
      {
        key: "pipeline_inflation_sandbagging",
        name: "Pipeline inflation & sandbagging",
        description:
          "Reps inflate early-stage pipeline to look covered and sandbag late " +
          "commits to protect attainment, so coverage ratios and forecasts are " +
          "systematically biased. Zombie deals (long-stalled, never closed-lost) " +
          "pad the number, making both AI forecasting and human roll-ups " +
          "untrustworthy.",
        detectionSignal:
          "Coverage well above what win rate justifies; large cohort of deals " +
          "untouched for 30-60+ days still marked open; recurring pattern of " +
          "deals slipping a quarter then closing; commit consistently below " +
          "best-case by a wide margin.",
        diagnosticQuestion:
          "How much of your open pipeline has had no activity in 30 days, and " +
          "what is your historical slip rate from commit to actual close?",
      },
      {
        key: "forecast_theater",
        name: "Forecast theater (gut-feel dressed as rigor)",
        description:
          "The forecast process is a weekly call where managers haggle rep " +
          "judgment up or down with no defensible methodology — so accuracy is " +
          "luck, and an AI forecast bolted on top is distrusted because nobody " +
          "can reconcile it to the human number or explain when it's right.",
        detectionSignal:
          "Forecast accuracy that swings widely period to period; no documented " +
          "forecast methodology or category definitions; AI forecast presented " +
          "but routinely overridden without explanation; commit changes " +
          "untracked.",
        diagnosticQuestion:
          "What is your forecast accuracy over the last four quarters, and when " +
          "the AI forecast disagrees with the rep roll-up, how is the " +
          "disagreement resolved?",
      },
      {
        key: "tool_sprawl_handoff_gaps",
        name: "Tool sprawl & handoff gaps across the revenue stack",
        description:
          "Lead routing, scoring, CRM, conversation intelligence, CPQ, and " +
          "billing run on separate systems with brittle integrations, so " +
          "context is lost at every handoff — marketing-to-sales, SDR-to-AE, " +
          "AE-to-CS — and no single AI has a complete, current view of the " +
          "customer to reason over.",
        detectionSignal:
          "Many point tools with overlapping data; duplicate/conflicting " +
          "records across systems; leads dropped or slow-routed at handoff; " +
          "manual re-keying between CPQ/CRM/billing; no shared customer timeline.",
        diagnosticQuestion:
          "When a lead becomes an opportunity and later a customer, does the " +
          "full context travel across your tools, or is it re-keyed and lost at " +
          "each handoff?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "seller_copilot",
        name: "Seller copilot & CRM auto-capture",
        valueMechanism:
          "A copilot drafts emails and follow-ups, auto-logs activity, " +
          "summarizes accounts, and prepares call briefs — taking CRM data entry " +
          "and prep off the rep's plate so selling time rises, while the " +
          "auto-capture quietly improves the CRM completeness every other AI bet " +
          "depends on.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "CRM read/write access for activity logging and account context",
          "Email/calendar and call/meeting data for capture",
          "Account and opportunity history for briefing and summarization",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Drafts must be rep-editable before send — the rep is accountable for what goes to the customer",
          "Auto-captured fields must be reviewable so a bad capture doesn't silently corrupt the CRM",
          "Avoid surveillance framing of activity capture; position as time-back, not monitoring, or adoption collapses",
        ],
        metricsMoved: [
          "rep_selling_time",
          "crm_data_completeness",
          "sales_cycle_length",
          "ramp_time",
        ],
      },
      {
        key: "lead_scoring_routing",
        name: "Predictive lead scoring & smart routing",
        valueMechanism:
          "A model ranks leads and accounts by conversion likelihood and routes " +
          "each to the right rep fast, so sellers spend time on the leads most " +
          "likely to convert and speed-to-lead improves — lifting conversion " +
          "without adding headcount.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical lead-to-opportunity outcomes for training labels",
          "Consistent lead/MQL definitions and source tracking",
          "Firmographic / intent / engagement signals at sufficient coverage",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Scores trained on biased historical routing reinforce who got worked, not who converts — audit for feedback loops",
          "Reps must see why a lead scored high or they ignore the score; explainability drives adoption",
          "Routing rules must not quietly starve segments to protect a headline conversion metric",
        ],
        metricsMoved: [
          "lead_conversion_rate",
          "win_rate",
          "sales_cycle_length",
        ],
      },
      {
        key: "conversation_intelligence",
        name: "Conversation intelligence & coaching",
        valueMechanism:
          "AI transcribes and analyzes calls, surfaces what top performers do " +
          "differently, flags risk language and competitor mentions, and drives " +
          "targeted coaching — spreading best-rep behavior across the team and " +
          "compressing ramp so the middle of the distribution improves.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Call/meeting recordings with consent and transcription",
          "Outcome labels (won/lost) to learn what correlates with winning",
          "Coaching workflow integration so insight becomes action",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recording/consent laws apply per jurisdiction to every analyzed call",
          "Coaching framing must be developmental; punitive scoring destroys trust and the data quality",
          "Correlation is not causation — 'top reps say X' is a coaching hypothesis, not a proven driver",
        ],
        metricsMoved: [
          "win_rate",
          "ramp_time",
          "quota_attainment",
        ],
      },
      {
        key: "ai_forecasting",
        name: "AI pipeline forecasting & deal-risk scoring",
        valueMechanism:
          "A model scores each open deal's close probability from activity, " +
          "engagement, and stage-progression signals and rolls them into a " +
          "forecast that corrects for rep optimism and sandbagging — improving " +
          "forecast accuracy and flagging at-risk deals early enough to act.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clean stage history and activity signals on opportunities",
          "Sufficient closed-won/lost history for calibration",
          "Consistent forecast-category definitions to learn against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Forecast is capped by CRM hygiene — on dirty stage/amount data it is confidently wrong",
          "Managers must be able to reconcile the AI number to the rep roll-up or they override and distrust it",
          "Probability scores must be explainable per deal, not a black-box percentage nobody can defend to the board",
        ],
        metricsMoved: [
          "forecast_accuracy",
          "pipeline_coverage_ratio",
          "win_rate",
        ],
      },
      {
        key: "deal_desk_cpq",
        name: "Intelligent deal desk & guided CPQ",
        valueMechanism:
          "AI guides configuration, pricing, and discount approval — surfacing " +
          "compliant pricing, flagging margin-eroding discounts, and " +
          "auto-routing approvals — so quotes are generated faster and within " +
          "policy, compressing the late-stage cycle and protecting deal " +
          "economics.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Product catalog, price book, and discount/approval policy",
          "Historical deal/discount outcomes for pricing guidance",
          "CPQ ↔ CRM ↔ billing integration for clean quote-to-cash",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Pricing and discount decisions carry margin and contractual risk — non-standard terms require human approval",
          "Pricing guidance must respect regulatory and fair-pricing constraints where they apply",
          "Bad catalog/price-book data produces wrong quotes fast — quote accuracy gates the bet",
        ],
        metricsMoved: [
          "sales_cycle_length",
          "win_rate",
          "cac_payback",
        ],
      },
      {
        key: "churn_expansion_signals",
        name: "Churn prediction & expansion-signal detection",
        valueMechanism:
          "A model reads product-usage, engagement, and support signals to flag " +
          "accounts at churn risk and accounts ripe for expansion, prompting CS " +
          "and AEs to act in time — protecting and growing the base to lift net " +
          "revenue retention.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Product-usage / telemetry and engagement signals",
          "Renewal, contraction, and churn history for labels",
          "A workflow that turns a flagged account into an owned action",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A churn flag with no triggered human action is worthless — the value is in the play, not the prediction",
          "False positives waste CS capacity and can spook healthy accounts — calibrate and prioritize",
          "Usage signals can mislead for low-telemetry or seat-based products — validate the signal fits the model",
        ],
        metricsMoved: [
          "net_revenue_retention",
          "cac_payback",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "crm_hygiene_foundation",
        name: "CRM hygiene foundation (the gate before any AI bet)",
        description:
          "A governed data-quality layer over the CRM — required-field " +
          "standards, validation, deduplication, auto-capture, and a stewardship " +
          "cadence — so the data every AI bet rides on is complete, accurate, " +
          "and current. Treated as the prerequisite foundation, not an optional " +
          "add-on, because scoring/forecasting/copilots are capped by it.",
        boundary:
          "Owns CRM data standards, validation, and stewardship; does not own " +
          "the AI models that consume the data or the rep workflows themselves.",
        humanAccountabilityPoint: "Head of Revenue Operations (RevOps)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "unified_revenue_data_spine",
        name: "Unified revenue data spine",
        description:
          "A shared customer-and-revenue context layer that joins marketing, " +
          "CRM, conversation intelligence, CPQ, and billing into one current " +
          "timeline, so context survives every handoff and any AI bet reasons " +
          "over a complete view of the account rather than a siloed fragment.",
        boundary:
          "Owns cross-tool identity and the unified revenue timeline; does not " +
          "own the individual systems of record or their primary workflows.",
        humanAccountabilityPoint: "RevOps Platform Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "copilot_overlay",
        name: "Seller-copilot overlay on existing CRM",
        description:
          "A copilot and auto-capture layer overlaid on the existing CRM and " +
          "email/calendar stack — drafting, logging, briefing, summarizing — so " +
          "selling time and CRM completeness improve without ripping and " +
          "replacing the CRM, landing value before any platform migration.",
        boundary:
          "Owns in-workflow assistance and activity capture; does not own the " +
          "system-of-record CRM or the incentive-compensation engine.",
        humanAccountabilityPoint: "VP Sales / Sales Productivity Lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ai_forecasting_with_reconciliation",
        name: "AI forecasting with managed reconciliation",
        description:
          "An AI deal-scoring and forecast layer run alongside the manager " +
          "roll-up, with an explicit reconciliation ritual — per-deal " +
          "explainability and a documented way to resolve AI-vs-human " +
          "disagreement — so the AI forecast is trusted and adopted rather than " +
          "overridden in silence.",
        boundary:
          "Owns deal-risk scoring and forecast synthesis; does not own quota " +
          "setting, territory design, or the human forecast call itself.",
        humanAccountabilityPoint: "Head of Sales / RevOps Forecasting Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from levers in rising data-dependency and risk order. " +
        "(1) Seller productivity — copilots and auto-capture give selling time " +
        "back and quietly improve CRM hygiene; the fastest, lowest-risk win and " +
        "the one that unlocks every later bet. (2) Conversion & cycle — better " +
        "scoring, routing, conversation intelligence, and deal desk lift win " +
        "rate and compress cycle time, real but gated by data quality and rep " +
        "adoption. (3) Forecast & retention — AI forecasting and churn/expansion " +
        "signals improve predictability and protect the base, the highest-trust " +
        "prizes but the most dependent on clean data and on a human actually " +
        "acting on the signal. The autonomous 'AI SDR' lever is deliberately " +
        "discounted: it underperforms human-curated outbound today and carries " +
        "deliverability and brand risk. The durable program fixes CRM hygiene " +
        "first, sequences productivity wins to earn adoption, and only then " +
        "leans on forecasting and retention AI.",
      dominantHaircutFactors: [
        {
          factor: "CRM data quality cap",
          rationale:
            "Every AI bet is capped by the completeness and accuracy of the " +
            "CRM; on dirty stage/amount/contact data, scoring and forecasting " +
            "are confidently wrong and the realizable value collapses far below " +
            "the model's theoretical lift.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Observed gap between projected and realized AI value where CRM " +
              "completeness was below what the model needed",
            label: "planning-range",
          },
        },
        {
          factor: "Rep adoption shortfall",
          rationale:
            "Sales tools deliver value only if reps actually use them; the " +
            "binding constraint is behavior change, not model quality, so value " +
            "must be discounted for the share of reps who route around the tool.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Programs where low weekly-active rep usage left most of the " +
              "modeled value unrealized",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution & overlap optimism",
          rationale:
            "Win-rate, cycle, and retention gains are influenced by many factors " +
            "at once; crediting them all to the AI bet overstates impact, and " +
            "overlapping tools double-count the same lift.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Difference between claimed and controlled (cohort/holdout) " +
              "attribution of revenue-tool impact",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Selling-time recovery (copilot / auto-capture)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported reductions in admin/CRM-entry time from copilot and " +
              "activity-capture programs, freeing selling time",
            label: "planning-range",
          },
          measuredAs: "Relative increase in rep_selling_time",
        },
        {
          lever: "Forecast accuracy improvement (AI forecasting)",
          range: {
            low: 0.05,
            high: 0.15,
            basis:
              "Reported absolute forecast-accuracy gains over rep roll-up, " +
              "contingent on clean stage data",
            label: "planning-range",
          },
          measuredAs: "Absolute lift in forecast_accuracy",
        },
        {
          lever: "Conversion / win-rate uplift (scoring, routing, coaching)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative win-rate / conversion lift from scoring and " +
              "conversation-intelligence programs, net of attribution haircuts",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in win_rate / lead_conversion_rate",
        },
      ],
      timeToValueBand:
        "Seller copilot / auto-capture and conversation intelligence: 1-2 " +
        "quarters (overlay, no platform swap). CRM hygiene foundation: 1-3 " +
        "quarters of stewardship before downstream bets pay off. AI forecasting " +
        "and churn/expansion signals: 2-4 quarters to calibrate and earn trust, " +
        "with retention effects compounding over multiple renewal cycles.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "CRM (system of record)",
          role:
            "The system of record for accounts, contacts, opportunities, " +
            "pipeline, and forecast — the spine every revenue AI bet reads and " +
            "writes, and whose data quality gates all of them.",
          examples: [
            "Salesforce Sales Cloud",
            "Microsoft Dynamics 365 Sales",
            "HubSpot Sales Hub",
          ],
        },
        {
          name: "Sales engagement & sequencing",
          role:
            "Outbound/inbound cadence execution, email/call sequencing, and " +
            "activity capture — where prospecting and follow-up are run.",
          examples: [
            "Outreach",
            "Salesloft",
            "Apollo",
          ],
        },
        {
          name: "Conversation intelligence",
          role:
            "Call/meeting recording, transcription, and analysis for coaching, " +
            "deal-risk signals, and best-practice spread.",
          examples: [
            "Gong",
            "Chorus (ZoomInfo)",
            "Clari Copilot",
          ],
        },
        {
          name: "Revenue intelligence & forecasting",
          role:
            "Pipeline inspection, deal-risk scoring, and AI-assisted forecast " +
            "synthesis over CRM and activity data.",
          examples: [
            "Clari",
            "Gong Forecast",
            "BoostUp",
          ],
        },
        {
          name: "CPQ & deal desk",
          role:
            "Configure-price-quote, discount/approval workflow, and quote-to-" +
            "cash hand-off to billing.",
          examples: [
            "Salesforce CPQ",
            "DealHub",
            "Conga CPQ",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Revenue Officer (CRO)",
          accountability:
            "End-to-end revenue attainment across new-logo and base growth, and " +
            "the productivity of the go-to-market engine.",
        },
        {
          title: "Head of Revenue Operations (RevOps)",
          accountability:
            "The revenue tech stack, CRM data quality, forecasting process, " +
            "territory/quota design, and cross-functional handoffs.",
        },
        {
          title: "VP Sales / Sales Leader",
          accountability:
            "Quota attainment, pipeline health, rep coaching, and the forecast " +
            "call for their book.",
        },
        {
          title: "Sales Enablement Lead",
          accountability:
            "Onboarding, ramp time, playbooks, and driving adoption of tools " +
            "and best practices.",
        },
        {
          title: "Deal Desk Lead",
          accountability:
            "Pricing, discount governance, quote accuracy, and approval " +
            "throughput on non-standard deals.",
        },
        {
          title: "Customer Success Leader",
          accountability:
            "Net revenue retention — renewals, expansion, and churn prevention " +
            "across the existing base.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Email / outbound compliance (CAN-SPAM, GDPR e-privacy, CASL)",
          relevance:
            "Automated and AI-generated outbound must honor consent, " +
            "unsubscribe, and lawful-basis rules; aggressive AI outreach risks " +
            "both deliverability and legal exposure.",
        },
        {
          name: "Data privacy (GDPR / CCPA) for prospect & customer data",
          relevance:
            "Scoring, enrichment, and AI processing of personal/prospect data " +
            "must respect lawful basis, purpose limitation, and data-subject " +
            "rights.",
        },
        {
          name: "Call recording & consent laws",
          relevance:
            "Conversation-intelligence recording and transcription require " +
            "appropriate one/two-party consent and notice, varying by " +
            "jurisdiction.",
        },
        {
          name: "Fair-pricing & consumer-protection rules (where applicable)",
          relevance:
            "AI-guided pricing and discounting in regulated or consumer " +
            "contexts must avoid discriminatory or deceptive pricing outcomes.",
        },
      ],
      canonicalTerms: [
        {
          term: "Pipeline coverage",
          definition:
            "Ratio of open qualified pipeline value to the period target — " +
            "honest only when the pipeline behind it is clean of zombie and " +
            "inflated deals.",
        },
        {
          term: "MQL / SQL",
          definition:
            "Marketing-qualified vs sales-qualified lead — the funnel stages " +
            "whose definitions must stay consistent for conversion metrics to " +
            "mean anything.",
        },
        {
          term: "Forecast category",
          definition:
            "The commit / best-case / pipeline / omitted bucketing of a deal " +
            "that drives the roll-up — only useful with disciplined definitions.",
        },
        {
          term: "Net revenue retention (NRR)",
          definition:
            "Existing-base revenue end vs start including expansion and net of " +
            "churn/contraction; above 100% means the base grows on its own.",
        },
        {
          term: "Speed-to-lead",
          definition:
            "Elapsed time from lead creation to first rep touch — a primary " +
            "driver of conversion that routing AI targets directly.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Forecast accuracy / AI forecasting lift",
        authoritativeSource:
          "CRM forecast snapshots by category compared to actual closed-won " +
          "bookings over multiple periods, against the rep roll-up baseline",
        whatGoodEvidenceLooksLike:
          "A multi-period before/after or holdout comparison of forecast error, " +
          "with the AI forecast reconciled to the rep roll-up and per-deal " +
          "explainability.",
        weakEvidenceToReject:
          "A vendor 'improves forecast accuracy by X%' claim with no baseline, " +
          "period, or reconciliation to actuals.",
      },
      {
        claim: "Win-rate / conversion uplift",
        authoritativeSource:
          "CRM opportunity and lead records with consistent stage and " +
          "qualification definitions, compared across a cohort or holdout",
        whatGoodEvidenceLooksLike:
          "A controlled cohort/holdout comparison on a stable qualification bar, " +
          "with attribution haircuts applied for overlapping factors.",
        weakEvidenceToReject:
          "An aggregate win-rate rise with no holdout, after the qualification " +
          "bar or 'when an opp is created' quietly changed.",
      },
      {
        claim: "Selling-time / productivity recovery",
        authoritativeSource:
          "Activity-capture / time-study data and CRM activity logs " +
          "categorized into selling vs non-selling time before and after",
        whatGoodEvidenceLooksLike:
          "A measured before/after on selling-time share with weekly-active " +
          "adoption data showing reps actually use the tool.",
        weakEvidenceToReject:
          "A 'reps save N hours a week' figure asserted from a vendor survey " +
          "with no usage or baseline data.",
      },
      {
        claim: "CRM data quality / completeness",
        authoritativeSource:
          "CRM field-population and validation audits across the records and " +
          "fields that scoring, forecasting, and reporting consume",
        whatGoodEvidenceLooksLike:
          "A field-level completeness and accuracy audit on the AI-relevant " +
          "fields, including the share of deals with past close dates.",
        weakEvidenceToReject:
          "A blanket 'our CRM data is good' assertion with no field-level audit " +
          "of the fields the AI actually depends on.",
      },
      {
        claim: "Churn / expansion-signal value (NRR)",
        authoritativeSource:
          "Recurring-revenue ledger tracking expansion, contraction, and churn " +
          "by cohort, joined to which flagged accounts were actioned",
        whatGoodEvidenceLooksLike:
          "A cohort comparison of NRR for flagged-and-actioned versus " +
          "not-actioned accounts, showing the prediction drove a human play.",
        weakEvidenceToReject:
          "A model 'churn prediction accuracy' figure with no link to actions " +
          "taken or revenue actually saved.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your CRM field-completeness on the fields AI and forecasting actually consume (stage, amount, close date, next step, contact role), and how many open deals have a close date already in the past?",
      "What is your forecast accuracy over the last four quarters, and when the AI forecast disagrees with the rep roll-up, how is that disagreement resolved?",
      "What is weekly active rep usage of your current sales tools, and when reps ignore an AI recommendation, do you know why or just that they did?",
      "For any automated outbound, what are the positive-reply, unsubscribe, and spam-complaint rates versus human-curated outbound, and is sender-domain reputation holding?",
      "How much of your open pipeline has had no activity in 30 days, and what is your historical slip rate from commit to actual close?",
      "What share of a rep's week is actually selling versus admin and CRM entry, and which of those non-selling tasks are automatable today?",
      "When a lead becomes an opportunity and later a customer, does the full context travel across your revenue tools, or is it re-keyed and lost at each handoff?",
    ],
    maturitySignals: [
      "CRM completeness is measured at field level on the AI-relevant fields, with a stewardship owner and cadence — not assumed 'good'.",
      "Forecast accuracy is tracked over time against a documented methodology, and AI-vs-human forecast disagreement has an explicit reconciliation ritual.",
      "Tool adoption is measured as weekly-active rep usage and AI-suggestion acceptance, and low adoption triggers investigation rather than re-purchase.",
      "Conversion and win-rate metrics rest on consistent lead/qualification definitions, and lift is read against cohorts/holdouts, not raw aggregates.",
      "The revenue stack shares a unified customer timeline so context survives handoffs, and churn/expansion flags are wired to an owned human action.",
    ],
    redFlags: [
      "CRM data quality is unmeasured or known-poor, yet AI scoring/forecasting is being bought to fix the number it depends on.",
      "Autonomous 'AI SDR' outbound is scaled on volume while reply quality falls and sender-domain reputation or spam-complaint rates degrade.",
      "A sales tool was bought but weekly-active rep usage is low and the team runs the real pipeline in shadow spreadsheets.",
      "Forecast accuracy swings widely with no documented methodology, and the AI forecast is routinely overridden without explanation.",
      "Pipeline coverage looks healthy but a large cohort of deals is stalled 30-60+ days and still marked open (zombie pipeline).",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "CRM platform (Salesforce, Microsoft Dynamics, HubSpot)",
        category: "System of record / sales cloud",
        switchingCost:
          "Very high — the customer and pipeline system of record with deep " +
          "integration, customization, and reporting; replacement is a " +
          "multi-quarter program and rarely undertaken for the sales function " +
          "alone.",
        renewalDynamics:
          "Enterprise agreements with seat-based pricing; incumbents bundle " +
          "their own AI (Einstein, Copilot) at renewal to extend the platform " +
          "and raise switching cost further.",
      },
      {
        vendorName: "Revenue intelligence & forecasting (Clari, Gong, BoostUp)",
        category: "Pipeline inspection / deal-risk / AI forecasting",
        switchingCost:
          "Moderate — sits on top of the CRM and is swappable with effort, but " +
          "tuned models, historical signal, and ingrained forecast rituals raise " +
          "the real cost of moving.",
        renewalDynamics:
          "Per-seat pricing; fast-moving category with overlapping capabilities " +
          "from CRM-native AI — press on measured accuracy lift before scaling.",
      },
      {
        vendorName: "Conversation intelligence (Gong, Chorus, Clari Copilot)",
        category: "Call recording / coaching / deal signals",
        switchingCost:
          "Moderate — recordings and call corpus accumulate value over time, so " +
          "the data history (not the software) is the lock-in; check transcript/" +
          "data portability on exit.",
        renewalDynamics:
          "Per-seat pricing; consolidation pressure as revenue-intelligence " +
          "suites absorb conversation intelligence — watch for bundle re-lock.",
      },
      {
        vendorName: "Sales engagement (Outreach, Salesloft, Apollo)",
        category: "Cadence / sequencing / outbound + AI-SDR features",
        switchingCost:
          "Moderate — sequences and integrations are portable with effort; the " +
          "risk is over-committing to 'autonomous outbound' features that " +
          "underperform and damage deliverability.",
        renewalDynamics:
          "Per-seat pricing with usage add-ons for AI features; favor short " +
          "commitments on unproven autonomous-outbound capabilities.",
      },
    ],
    switchingCosts:
      "The CRM system of record is the high-lock-in layer the whole stack " +
      "anchors to; the value-frontier tools (revenue intelligence, " +
      "conversation intelligence, engagement) sit in moderate-switching-cost " +
      "layers where data portability and outcome-based terms are negotiable. " +
      "The real lock-in in those layers is accumulated DATA (call corpus, " +
      "tuned models), so exit rights over your own data matter more than the " +
      "software contract. Beware CRM-native AI bundling that quietly re-locks " +
      "the stack at renewal.",
    negotiationLevers: [
      "Outcome/accuracy proof in a controlled pilot (forecast accuracy, win-rate lift) before enterprise scale-up",
      "Weekly-active adoption thresholds tied to commercial terms — pay for usage, not shelfware",
      "Data and transcript portability + model/embedding exit rights to avoid data lock-in",
      "Unbundle add-on AI features from the core renewal to keep best-of-breed leverage",
      "Short initial commitments on unproven autonomous-outbound capabilities, expanded only on measured reply-quality and deliverability proof",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      forecast_claim: [
        "CRM forecast snapshots by category",
        "comparison to actual closed-won over multiple periods",
        "reconciliation to the rep roll-up baseline",
      ],
      conversion_claim: [
        "consistent qualification/lead definition",
        "cohort or holdout comparison",
        "attribution haircut for overlapping factors",
      ],
      productivity_claim: [
        "activity-capture / time-study baseline",
        "before/after selling-time share",
        "weekly-active adoption data",
      ],
      data_quality_claim: [
        "field-level completeness audit on AI-relevant fields",
        "accuracy/validation check",
        "share of deals with past close dates",
      ],
      retention_claim: [
        "recurring-revenue ledger by cohort",
        "flagged-and-actioned vs not-actioned comparison",
        "revenue actually saved/expanded, not prediction accuracy alone",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (data quality, adoption, attribution)",
      ],
    },
    citationStandard:
      "Quantitative revenue claims cite the CRM/activity/billing source and the " +
      "period, and conversion/win-rate claims state the qualification definition " +
      "and whether they rest on a cohort or holdout. Forecast claims are stated " +
      "against actuals over multiple periods and reconciled to the rep roll-up. " +
      "Value projections cite a baseline plus a labelled planning range and the " +
      "haircut factors applied (CRM data quality, rep adoption, attribution) — " +
      "never a single asserted ROI number, and never a vendor 'up to X%' figure " +
      "without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not measured CRM field-completeness — frame every AI-bet value as gated by data quality and likely overstated until the audit is done.",
      "Adoption/usage data is unavailable — flag that the modeled value assumes rep usage that may not materialize, since adoption is the binding constraint.",
      "Vendor-reported forecast-accuracy or win-rate outcomes are cited — mark as vendor claims pending a controlled pilot reconciled to actuals.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
      "Autonomous 'AI SDR' outbound is being considered — hedge toward the industry pattern that it underperforms human-curated outbound and carries deliverability/brand risk.",
    ],
    inferenceLanguage: [
      "Across revenue orgs at this scale, forecast accuracy typically runs...",
      "Without your CRM completeness audit, the industry pattern is that AI value is capped well below the model's theoretical lift by...",
      "As an industry pattern (not your measured figure), rep adoption tends to be the binding constraint on...",
      "Peer programs commonly see selling-time recover by... once auto-capture lands, contingent on adoption.",
    ],
    flagWithoutEvidence: [
      "A specific forecast-accuracy or win-rate lift for this tenant",
      "This tenant's actual CRM data completeness or rep adoption rate",
      "A claim that autonomous outbound will outperform this tenant's human-curated outbound",
      "A specific revenue saved/expanded figure from this tenant's churn/expansion model",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where does AI fit across the revenue engine / lever prioritization by value and data-readiness",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of revenue stages (lead → forecast → retention) x AI lever shaded by net value and data-quality/adoption risk.",
    },
    {
      questionPattern: "value of a revenue-AI program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled lift to realizable value with CRM-data-quality, adoption, and attribution haircuts.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (CRM data quality, rep adoption, attribution) on realizable value.",
    },
    {
      questionPattern: "forecast accuracy vs actuals over time / AI vs rep roll-up",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Multi-period trend of forecast vs actual for both AI and rep roll-up to expose forecast theater.",
    },
    {
      questionPattern: "revenue operations KPI scorecard",
      exhibitKind: "table",
      note: "Forecast accuracy, win rate, cycle length, coverage, attainment, conversion, CRM completeness, selling time, NRR, CAC payback vs planning ranges.",
    },
    {
      questionPattern: "pipeline funnel / stage conversion and leakage",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Stage-by-stage conversion and drop-off to locate where the funnel leaks and where scoring/coaching pays.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "CRM hygiene fixed first as the prerequisite foundation, with a named RevOps steward and a measured field-completeness target",
      "Productivity wins (copilot, auto-capture) sequenced early to earn rep adoption before higher-trust bets",
      "Adoption treated as the program's primary risk — measured as weekly-active usage, with low usage investigated not ignored",
      "AI forecasting run with explainability and a managed reconciliation to the rep roll-up so it is trusted, not overridden",
      "Value read against cohorts/holdouts with honest attribution and data-quality/adoption haircuts applied",
    ],
    failureDrivers: [
      "Buying AI scoring/forecasting to fix a number that is actually broken by dirty CRM data — garbage-in defeats the model",
      "Betting on autonomous 'AI SDR' outbound that underperforms human outreach and degrades deliverability and brand",
      "Tools reps route around — low adoption leaves the modeled value unrealized regardless of model quality",
      "Forecast theater where the AI number can't be reconciled to the human roll-up, so it is distrusted and ignored",
      "Crediting overlapping revenue gains entirely to one AI bet, then missing the target the inflated case promised",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption hinges on whether the tool obviously gives reps something back. " +
      "Copilots and auto-capture adopt fastest because they remove admin reps " +
      "hate; conversation intelligence follows once coaching feels developmental " +
      "rather than surveillance. Scoring and AI forecasting adopt only once reps " +
      "and managers trust the explanation and can reconcile it to their own " +
      "judgment — adoption spreads manager-by-manager, not by mandate. Autonomous " +
      "outbound has the weakest readiness and should expand only on proven " +
      "reply-quality, never by default.",
    roiClarity: "medium",
    roiClarityBasis:
      "Selling-time and forecast-accuracy gains are directly measurable in " +
      "activity logs and forecast-vs-actuals and cleanly attributable. Win-rate, " +
      "cycle, and retention gains are real but influenced by many factors and " +
      "easy to over-credit without cohorts/holdouts. The two structural " +
      "discounts — CRM data quality and rep adoption — are large and " +
      "tenant-specific, so ROI is firm only when both are measured; without that " +
      "discipline the case is routinely overstated, which holds clarity at medium.",
  },

  regulatoryFrame: {
    name: "Outbound communication compliance + data privacy",
    relevance:
      "The dominant regulatory frame for AI in the revenue engine: automated " +
      "and AI-generated outbound must honor consent, unsubscribe, and " +
      "lawful-basis rules (CAN-SPAM, GDPR e-privacy, CASL), and scoring/" +
      "enrichment of prospect and customer data must respect privacy law (GDPR/" +
      "CCPA). Call recording for conversation intelligence requires " +
      "jurisdiction-appropriate consent, and AI-guided pricing in regulated or " +
      "consumer contexts must avoid discriminatory or deceptive outcomes (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
