// Consilium expert — R&D & Innovation Portfolio Management
// (cross-cutting corporate function).
//
// W3 backlog-wave draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting expert for the organic-innovation agenda: the innovation
// portfolio across horizons (H1 core/incremental, H2 adjacent/emerging, H3
// transformational/new-to-the-world), the stage-gate / discovery funnel, R&D
// spend allocation and productivity, the idea-to-launch pipeline, technology
// scouting and open innovation, IP/patent strategy, venture/incubation, and the
// R&D-to-commercial handoff. Scoped to BOTH corporate-innovation (new
// businesses, ventures, horizon bets) and product-R&D (engineering new and
// improved products) across industries.
//
// CORE DOCTRINE — PORTFOLIO OF OPTIONS, NOT A FORECAST; LEARNING, NOT
// BUREAUCRACY. Innovation returns are long-dated, probabilistic, and hard to
// attribute — so the honest frame is a PORTFOLIO OF OPTIONS valued in ranges,
// not a single ROI forecast. Be blunt about what the field systematically gets
// wrong: most "innovation portfolios" are ~90% horizon-1 incrementalism
// mislabeled as transformation; stage-gates, used as bureaucracy rather than
// structured learning, kill speed without improving hit-rate; R&D productivity
// (return on R&D) is notoriously hard to attribute and usually goes unmeasured;
// horizon-2/3 bets die not from being wrong but from being STARVED of funding
// and air cover and from being measured on horizon-1 metrics (NPV, payback,
// hurdle rates) they cannot meet; and "open innovation" / technology scouting
// rarely converts without an internal ABSORPTION mechanism to land what is
// found. The expert sizes innovation value as a portfolio of options — expected
// value across a distribution of outcomes — and refuses to present a
// probabilistic, long-dated bet as if it were a deterministic forecast.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const rdInnovationPortfolioExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.rd-innovation-portfolio",
    expertName: "R&D & Innovation Portfolio Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "rd-innovation-portfolio",
    scopeNote:
      "Cross-cutting R&D and innovation-portfolio function spanning the full " +
      "organic-innovation lifecycle: the innovation portfolio across horizons " +
      "(H1 core/incremental, H2 adjacent, H3 transformational), the stage-gate / " +
      "discovery funnel, R&D spend allocation and productivity (return on R&D), " +
      "the idea-to-launch pipeline, technology scouting and open innovation, " +
      "IP/patent strategy, venture/incubation, and the R&D-to-commercial " +
      "handoff. Covers both corporate-innovation (new businesses, ventures, " +
      "horizon bets) and product-R&D (engineering new/improved products) across " +
      "industries. Doctrine is PORTFOLIO-OF-OPTIONS (not a forecast) and " +
      "LEARNING (not bureaucracy): the expert is honest that most portfolios are " +
      "~90% horizon-1 incrementalism mislabeled as transformation, that " +
      "stage-gates used as bureaucracy kill speed without improving hit-rate, " +
      "that R&D productivity is hard to attribute and usually unmeasured, that " +
      "horizon-2/3 bets die from being starved and measured on horizon-1 " +
      "metrics, and that scouting/open-innovation rarely converts without an " +
      "absorption mechanism. Explicitly DISTINCT from digital-product-management " +
      "(software product delivery / agile execution), life-sciences-rd-commercial " +
      "(pharma-specific clinical R&D), and corporate-development-m&a (inorganic " +
      "deals) — this expert owns the buy-vs-build innovation thesis, the " +
      "cross-horizon portfolio, and the funnel from idea to launch, not the " +
      "engineering sprint backlog, the clinical trial, or the acquisition.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "rd_intensity_pct",
        name: "R&D intensity (spend as % of revenue)",
        definition:
          "Total R&D / innovation spend (people, programs, external) as a share " +
          "of revenue over the period — the headline measure of how much the " +
          "enterprise invests in creating future products and businesses.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 2,
          high: 15,
          basis:
            "R&D-intensity ranges vary enormously by sector — consumer/industrial " +
            "firms cluster low single digits, technology and deep-tech far higher; " +
            "in-range because both under-investment (starving the future) and " +
            "uncontrolled spend (with no productivity discipline) destroy value",
          label: "planning-range",
        },
        dataSource:
          "Finance / R&D cost ledger reconciled to the income statement — total " +
          "R&D and innovation spend over revenue, with capitalized-vs-expensed " +
          "treatment noted",
        whyItMatters:
          "The level of investment in the future, and the denominator every " +
          "productivity question divides into. It is an in-range, sector-relative " +
          "gauge: the number alone says nothing about whether the money buys " +
          "horizon-1 incrementalism or genuine new growth — which is why it must " +
          "always be read alongside horizon balance and return-on-R&D.",
      },
      {
        key: "innovation_revenue_pct",
        name: "Return on R&D / innovation revenue (% revenue from products <3 yrs old)",
        definition:
          "Share of current-period revenue generated by products and services " +
          "launched within the last three years — the most-used proxy for whether " +
          "R&D spend is actually converting into commercial outcomes (often called " +
          "the vitality index when measured this way).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Innovation-revenue / vitality ranges across diversified product " +
            "firms; the band is wide and sector-dependent, and the metric is a " +
            "PROXY for return on R&D, not a clean attribution of cause to spend",
          label: "planning-range",
        },
        dataSource:
          "Product P&L / revenue system tagged by product launch date, " +
          "reconciled to the R&D cost base for the same products",
        whyItMatters:
          "The closest available read on whether R&D pays off, and the honest " +
          "answer to 'what did we get for the spend.' Treat it as a proxy: it does " +
          "not isolate R&D's contribution from sales, pricing, or market tailwinds, " +
          "and it rewards a steady refresh cadence (often horizon-1) more than rare " +
          "horizon-3 breakthroughs — so read it with horizon balance.",
      },
      {
        key: "horizon_balance_h2h3_pct",
        name: "Portfolio horizon balance (H2+H3 % of investment)",
        definition:
          "Share of innovation investment (funding and people, not just project " +
          "count) allocated to horizon-2 (adjacent/emerging) and horizon-3 " +
          "(transformational/new-to-the-world) bets, versus horizon-1 (core/" +
          "incremental) — the structural balance of the portfolio.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 40,
          basis:
            "Three-horizon allocation guidance (commonly framed as roughly 70/20/" +
            "10 of investment to H1/H2/H3); in-range because too little H2+H3 means " +
            "the portfolio is incrementalism mislabeled as transformation, while " +
            "too much starves the core that funds it",
          label: "planning-range",
        },
        dataSource:
          "Innovation / portfolio management system with every initiative tagged " +
          "to a horizon, measured by FUNDED investment and FTE, not headline count",
        whyItMatters:
          "The single most diagnostic number in the portfolio and the place the " +
          "field most often lies to itself: most 'innovation portfolios' are ~90% " +
          "horizon-1 incrementalism rebranded as transformation. Measuring balance " +
          "by funded investment (not project count, where pet H3 ideas get listed " +
          "but never funded) exposes whether the future is actually being paid for.",
      },
      {
        key: "stage_gate_conversion_pct",
        name: "Stage-gate conversion / throughput rate",
        definition:
          "Share of ideas/concepts that survive each stage-gate to the next stage " +
          "(and end-to-end, idea-to-launch), and the overall funnel throughput — " +
          "how the discovery funnel narrows from many ideas to few launches.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "End-to-end idea-to-launch survival is low single-to-double-digit " +
            "percent in healthy funnels; in-range because too high a survival rate " +
            "signals gates that rubber-stamp rather than select, and too low signals " +
            "a funnel that wastes effort or kills too late",
          label: "planning-range",
        },
        dataSource:
          "Stage-gate / idea-management system — counts and conversion by gate, " +
          "with kill reasons and stage durations captured",
        whyItMatters:
          "Conversion shape reveals whether the gate process selects or merely " +
          "processes. The honest caution: a stage-gate improves outcomes only when " +
          "it is a structured LEARNING and selection mechanism; used as bureaucracy " +
          "it lowers throughput and speed without improving the hit-rate of what " +
          "actually launches — so read conversion alongside cycle time and hit rate.",
      },
      {
        key: "idea_to_launch_cycle_days",
        name: "Idea-to-launch cycle time",
        definition:
          "Median elapsed time from a qualified idea/concept entering the funnel " +
          "to commercial launch, across the surviving pipeline — the speed of the " +
          "innovation engine.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 120,
          high: 540,
          basis:
            "Cycle-time ranges vary widely by product complexity and horizon; " +
            "incremental H1 products move fast, transformational H3 bets take far " +
            "longer — the band brackets typical product-innovation cycles, not " +
            "deep-tech or pharma timelines",
          label: "planning-range",
        },
        dataSource:
          "Stage-gate / pipeline system timestamps from concept entry to launch, " +
          "segmented by horizon and product type",
        whyItMatters:
          "Speed compounds: faster cycles mean more shots on goal and earlier " +
          "market learning. The dominant honest caveat is that bureaucratic " +
          "stage-gates inflate cycle time without improving selection — the goal is " +
          "faster learning per dollar, not gate-checking for its own sake — and H3 " +
          "bets must not be held to H1 cycle expectations.",
      },
      {
        key: "risk_adjusted_pipeline_value",
        name: "Risk-adjusted pipeline value (expected NPV)",
        definition:
          "The probability-weighted, risk-adjusted value of the active innovation " +
          "pipeline — each program's commercial value multiplied by its probability " +
          "of technical and commercial success, summed across the portfolio (eNPV / " +
          "expected commercial value).",
        unit: "currency",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 10,
          basis:
            "Expressed as a multiple of annual R&D spend; healthy pipelines carry " +
            "several years of risk-adjusted value relative to the spend that feeds " +
            "them, though the estimate is soft and probability-dependent",
          label: "planning-range",
        },
        dataSource:
          "Portfolio management system — per-program commercial value × " +
          "probability of technical and commercial success, with the probability " +
          "assumptions made explicit and ranged",
        whyItMatters:
          "The portfolio-of-options view in one number: it forces every bet to " +
          "carry an explicit probability and value RANGE rather than a single " +
          "forecast. It is honest only when the probabilities are themselves " +
          "honest — over-optimistic success odds (a chronic failing) inflate it — " +
          "so it must be read as a ranged expected value, not a committed forecast.",
      },
      {
        key: "rd_on_time_on_budget_pct",
        name: "R&D project on-time / on-budget delivery",
        definition:
          "Share of active R&D / development programs delivering their stage or " +
          "launch milestones on or ahead of schedule and within budget, against " +
          "the approved plan.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Development-execution ranges; disciplined R&D organizations hold most " +
            "milestones, but novelty and horizon raise variance — H3 programs " +
            "legitimately miss more, so this is most meaningful within a horizon",
          label: "planning-range",
        },
        dataSource:
          "R&D program / project management system — milestone and budget " +
          "actuals against plan, segmented by horizon",
        whyItMatters:
          "Execution reliability for the development engine — but a metric to " +
          "handle with care, because demanding H1-grade on-time/on-budget from " +
          "exploratory H2/H3 work punishes the learning that those bets exist to " +
          "produce. It is an honest signal for committed development, a misleading " +
          "one for discovery.",
      },
      {
        key: "innovation_hit_rate_pct",
        name: "Innovation hit rate (commercial success of launches)",
        definition:
          "Share of launched products/initiatives that meet or exceed their " +
          "commercial success criteria (revenue, margin, adoption) within a defined " +
          "post-launch window — not whether they shipped, but whether they won.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 60,
          basis:
            "Commercial-success ranges for launched products; a large fraction of " +
            "launches under-deliver even after surviving the funnel, so a realistic " +
            "band sits well below certainty and reflects the probabilistic nature " +
            "of innovation",
          label: "planning-range",
        },
        dataSource:
          "Product P&L / post-launch review against the original commercial case, " +
          "tracked to a defined window per launch",
        whyItMatters:
          "The honest outcome metric — many things launch, fewer win. It anchors " +
          "the portfolio-of-options frame: because hit rate is materially below " +
          "100%, innovation value MUST be expected-value across a distribution, not " +
          "a forecast of any single launch succeeding.",
      },
      {
        key: "time_to_kill_days",
        name: "Time-to-kill (fail-fast discipline)",
        definition:
          "Median elapsed time (or spend) from clear disconfirming evidence to a " +
          "program actually being stopped — how fast the organization kills bets " +
          "that the evidence says will not work.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 180,
          basis:
            "Fail-fast practice ranges; healthy discovery cultures kill on " +
            "evidence within weeks-to-a-quarter, while bureaucratic or sunk-cost " +
            "cultures let dying programs linger for years, starving the live ones",
          label: "planning-range",
        },
        dataSource:
          "Stage-gate / portfolio system — interval from disconfirming-evidence " +
          "milestone to kill decision, with the spend incurred in between",
        whyItMatters:
          "Killing fast is as valuable as launching fast: lingering zombies " +
          "consume the funding and talent that horizon-2/3 bets need. Slow " +
          "time-to-kill is the clearest symptom that stage-gates have become " +
          "sunk-cost-protecting bureaucracy rather than evidence-driven learning.",
      },
      {
        key: "patent_ip_yield",
        name: "Patent / IP yield",
        definition:
          "Output and quality of the IP engine: patents filed/granted per unit of " +
          "R&D spend or per relevant researcher, weighted by the share of the " +
          "portfolio that is strategically aligned and actually used (forward " +
          "citations, products covered, licensing) rather than defensive volume.",
        unit: "index",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.3,
          high: 0.8,
          basis:
            "Expressed as the strategically-aligned/used share of the IP portfolio; " +
            "raw patent COUNT is a vanity metric, so the meaningful band is the " +
            "fraction of IP that is high-quality and tied to products or licensing, " +
            "which is typically well below the full count",
          label: "planning-range",
        },
        dataSource:
          "IP / patent management system reconciled to R&D programs and product " +
          "coverage — filings, grants, citations, products covered, licensing " +
          "income",
        whyItMatters:
          "IP is strategy made durable — but only the strategically-aligned, used " +
          "fraction matters. The honest read rejects raw patent count as a vanity " +
          "metric and asks what share of IP actually protects products, blocks " +
          "competitors, or earns licensing; most patent portfolios carry " +
          "substantial dead weight.",
      },
      {
        key: "vitality_index_pct",
        name: "New-product vitality index (% revenue from new products)",
        definition:
          "Revenue from products introduced within a defined recent window (often " +
          "the last 3-5 years) as a share of total revenue — the sustained-renewal " +
          "view of the portfolio, complementary to the 3-year innovation-revenue " +
          "proxy.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 45,
          basis:
            "New-product vitality ranges across diversified product firms over a " +
            "3-5 year window; sector-dependent and, like innovation revenue, a " +
            "renewal proxy rather than a clean attribution to R&D cause",
          label: "planning-range",
        },
        dataSource:
          "Product revenue system tagged by introduction date over the chosen " +
          "vitality window, reconciled to the product portfolio",
        whyItMatters:
          "Measures sustained portfolio renewal — is the business continually " +
          "refreshing what it sells, or living off legacy products. Like " +
          "innovation revenue it is a proxy (it rewards cadence over breakthrough " +
          "and does not isolate R&D's causal share), so it is read together with " +
          "horizon balance to distinguish real renewal from incremental churn.",
      },
      {
        key: "scouting_adoption_conversion_pct",
        name: "Scouting / open-innovation adoption conversion",
        definition:
          "Share of externally-sourced opportunities (startups, university IP, " +
          "partnerships, scouting leads) that are actually absorbed into a funded " +
          "program, product, or partnership — the conversion of open innovation " +
          "into outcomes, not just engagements.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Open-innovation conversion is low: most scouting and partnership " +
            "engagement never lands internally; the band reflects realistic " +
            "absorption rates, where even the high end depends on a deliberate " +
            "internal absorption mechanism",
          label: "planning-range",
        },
        dataSource:
          "Scouting / open-innovation pipeline system — externally-sourced leads " +
          "tracked through to funded absorption (program, product, or partnership)",
        whyItMatters:
          "The metric that exposes the central open-innovation failure: scouting " +
          "and partnerships generate activity but rarely convert without an " +
          "internal ABSORPTION mechanism (a sponsor, budget, integration team, and " +
          "a home for the technology). Low conversion means the scouting engine is " +
          "theatre; it is the diagnostic for whether open innovation is real.",
      },
    ],

    painThemes: [
      {
        key: "incrementalism_mislabeled",
        name: "Horizon-1 incrementalism mislabeled as transformation",
        description:
          "The 'innovation portfolio' is overwhelmingly core/incremental " +
          "(horizon-1) work — line extensions, refreshes, cost-downs — rebranded " +
          "with transformation language, while genuine horizon-2/3 bets are thin, " +
          "underfunded, or exist only on slides; the portfolio looks bold and " +
          "behaves timid.",
        detectionSignal:
          "Funded H2+H3 investment far below the project COUNT of H2/H3 ideas, " +
          "'transformation' programs that are really feature work, no funded " +
          "new-to-the-world bets, horizon mix measured by count not money.",
        diagnosticQuestion:
          "Measured by FUNDED investment and people — not project count — what " +
          "share of your portfolio is genuinely horizon-2 and horizon-3, and which " +
          "of those bets has real budget and air cover rather than a slide?",
      },
      {
        key: "stage_gate_bureaucracy",
        name: "Stage-gate as bureaucracy, not learning",
        description:
          "The stage-gate process has hardened into a compliance ritual — heavy " +
          "documentation, infrequent gate meetings, committee sign-offs — that " +
          "slows everything and gate-keeps for process conformance rather than " +
          "selecting on evidence; it lowers speed without improving hit-rate.",
        detectionSignal:
          "Long gaps between gates, gate decks measured in dozens of slides, gates " +
          "rarely killing anything, cycle time dominated by waiting-for-gate, teams " +
          "optimizing for gate approval rather than market learning.",
        diagnosticQuestion:
          "Do your gates actually kill projects on evidence, or mostly approve " +
          "them onward — and how much of your idea-to-launch cycle time is real " +
          "learning versus waiting for and preparing gate reviews?",
      },
      {
        key: "rd_productivity_unmeasured",
        name: "R&D productivity (return on R&D) unmeasured / unattributable",
        description:
          "The organization cannot credibly say what it gets for its R&D spend: " +
          "return on R&D is hard to attribute (long lags, confounded by sales and " +
          "market), so it goes unmeasured, and spend decisions are made on " +
          "history, politics, and intensity benchmarks rather than productivity.",
        detectionSignal:
          "No innovation-revenue or vitality tracking tied to the R&D base, spend " +
          "allocated by last-year-plus-X, no portfolio eNPV, productivity claims " +
          "that cannot be traced to any artifact, attribution avoided rather than " +
          "ranged.",
        diagnosticQuestion:
          "How do you measure return on R&D today, and where you cannot attribute " +
          "cleanly, do you state the proxy and its limits honestly — or simply not " +
          "measure productivity at all?",
      },
      {
        key: "h2h3_starvation",
        name: "Horizon-2/3 bets starved and mis-measured",
        description:
          "Transformational bets die not because they were wrong but because they " +
          "were STARVED — funded last, cut first under pressure — and because they " +
          "are judged on horizon-1 metrics (NPV, payback, hurdle rates, on-time/" +
          "on-budget) that early, uncertain, long-dated options cannot meet.",
        detectionSignal:
          "H2/H3 bets cut first in budget squeezes, transformational programs " +
          "asked for the same business case as line extensions, no protected " +
          "funding or distinct governance for long-horizon bets, no option-style " +
          "metrics for early-stage work.",
        diagnosticQuestion:
          "Are your horizon-2/3 bets protected from being raided when the core is " +
          "under pressure, and are they measured as options on learning — or held " +
          "to the same NPV/payback hurdles as incremental products?",
      },
      {
        key: "open_innovation_no_absorption",
        name: "Open innovation / scouting with no absorption mechanism",
        description:
          "Technology scouting, accelerators, university partnerships, and " +
          "corporate-venture engagements generate activity and headlines but " +
          "rarely convert, because there is no internal mechanism — sponsor, " +
          "budget, integration team, a home for the technology — to ABSORB what " +
          "is found; the funnel ends in a pilot graveyard.",
        detectionSignal:
          "Many scouting engagements and pilots, almost none converted to funded " +
          "programs or products, no named internal owner for absorbed technology, " +
          "innovation outposts disconnected from the business units that would use " +
          "the output.",
        diagnosticQuestion:
          "When scouting or a partnership finds something valuable, who internally " +
          "owns absorbing it — with budget and a home in a business unit — and what " +
          "is your actual conversion from external engagement to funded outcome?",
      },
      {
        key: "rd_to_commercial_handoff_gap",
        name: "R&D-to-commercial handoff gap (the valley of death)",
        description:
          "Promising R&D output stalls in the gap between development and " +
          "commercialization — the 'valley of death' — because there is no clean " +
          "handoff: commercial, supply, and go-to-market are engaged too late, " +
          "ownership is ambiguous, and the scale-up funding and capability are not " +
          "lined up.",
        detectionSignal:
          "Technically-successful programs that never scale, commercial teams " +
          "first seeing products near launch, no defined transfer of ownership from " +
          "R&D to a P&L owner, scale-up funding treated as a surprise rather than " +
          "planned.",
        diagnosticQuestion:
          "At what point do commercial, supply-chain, and go-to-market join an " +
          "R&D program, and who takes P&L ownership at the handoff — or do " +
          "technically-good programs keep dying in the gap to market?",
      },
      {
        key: "ip_vanity_not_strategy",
        name: "IP as vanity volume, not strategy",
        description:
          "The patent portfolio is managed for volume and prestige rather than " +
          "strategic protection — filings counted as an output, large maintenance " +
          "spend on patents that cover nothing sold and block no competitor, while " +
          "the genuinely strategic white-space and freedom-to-operate questions go " +
          "under-resourced.",
        detectionSignal:
          "Patent count cited as an innovation KPI, high maintenance spend with " +
          "low product coverage or licensing, no freedom-to-operate or " +
          "white-space mapping tied to the roadmap, IP and R&D strategy " +
          "disconnected.",
        diagnosticQuestion:
          "What share of your patent portfolio actually protects products you " +
          "sell, blocks competitors, or earns licensing — and how much spend is " +
          "maintaining IP that does none of those?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_technology_scouting_horizon_scanning",
        name: "AI technology scouting & horizon scanning",
        valueMechanism:
          "Continuously scan patents, scientific literature, startup and funding " +
          "data, standards bodies, and weak signals against codified innovation " +
          "theses to surface emerging technologies, white space, and threats — " +
          "widening the aperture of horizon scanning and focusing scarce scouting " +
          "attention on thesis-relevant opportunities. Honest caveat: this " +
          "improves DISCOVERY and coverage, not absorption — without an internal " +
          "mechanism to fund and land what is found, better scanning just produces " +
          "a longer pilot graveyard.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Patent, scientific-literature, and standards data feeds",
          "Startup, venture-funding, and partnership signal data",
          "Codified innovation theses / white-space maps to scan against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Scanning output is a prioritized lead list — thesis fit and absorption remain human decisions",
          "Signal quality and false positives vary by field data availability and must be sampled",
          "Better discovery does not fix the absorption gap — conversion still depends on internal ownership",
        ],
        metricsMoved: [
          "scouting_adoption_conversion_pct",
          "horizon_balance_h2h3_pct",
        ],
      },
      {
        key: "ai_idea_triage_concept_screening",
        name: "AI idea triage & concept screening",
        valueMechanism:
          "Use AI to cluster, de-duplicate, enrich, and pre-score the flood of " +
          "ideas and concepts entering the funnel against strategic fit, market " +
          "signal, and feasibility — raising the FLOOR on triage quality and " +
          "freeing gate reviewers to spend judgment on the genuinely ambiguous " +
          "cases. Honest caveat: screening assists selection, it does not replace " +
          "the portfolio judgment about horizon balance — and a model trained on " +
          "past launches will be biased toward horizon-1 incrementalism unless " +
          "deliberately counter-weighted.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Idea/concept submissions with structured and unstructured descriptions",
          "Strategic-fit criteria and market/feasibility signal data",
          "Historical idea-to-outcome data for relevance tuning (bias-aware)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Pre-scores are inputs to gate judgment, not auto-kill or auto-advance decisions",
          "Models trained on past launches skew toward H1 — counter-weight to avoid starving H2/H3",
          "Idea-screening must not become a bureaucratic gate that slows the funnel it was meant to speed",
        ],
        metricsMoved: [
          "stage_gate_conversion_pct",
          "idea_to_launch_cycle_days",
        ],
      },
      {
        key: "ai_portfolio_decision_support",
        name: "AI portfolio decision-support & option valuation",
        valueMechanism:
          "Stand up faster, more rigorous portfolio analysis: risk-adjusted " +
          "expected-value modeling across horizons, scenario and option valuation " +
          "for long-dated bets, and what-if reallocation so leaders reason in " +
          "RANGES and explicit probabilities rather than a single forecast or " +
          "last-year-plus-X budgeting. The value is portfolio discipline and " +
          "honest option framing — it makes the probabilistic, long-dated nature " +
          "of innovation explicit rather than papering over it with a deterministic " +
          "ROI number.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Per-program commercial value and probability-of-success assumptions",
          "Horizon tags, funding, and FTE allocation across the portfolio",
          "Scenario / market assumptions and the cost of capital",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Portfolio reallocation and kill/fund decisions are committee decisions, not model outputs",
          "Option valuations must be presented as ranges with explicit probabilities, never a single point",
          "Over-optimistic success probabilities inflate eNPV — assumptions must be stress-tested, not flattering",
        ],
        metricsMoved: [
          "risk_adjusted_pipeline_value",
          "horizon_balance_h2h3_pct",
          "rd_intensity_pct",
        ],
      },
      {
        key: "ai_rd_research_acceleration",
        name: "AI R&D research & experiment acceleration",
        valueMechanism:
          "Apply AI to the research work itself — literature synthesis, " +
          "experiment design and simulation, generative design exploration, and " +
          "data analysis — to compress development cycles and expand the space of " +
          "options explored per dollar, raising R&D throughput and shortening " +
          "idea-to-launch. Honest caveat: acceleration helps most where the " +
          "science is data-rich and well-posed; it does not de-risk the " +
          "commercial bet, and faster experimentation only pays off if the " +
          "organization also kills fast on the disconfirming results it produces.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Experimental / research data and simulation models for the domain",
          "Scientific literature and prior internal research corpus",
          "Design-space parameters and constraints for generative exploration",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-generated designs/hypotheses require expert validation before resourcing",
          "Acceleration is uneven across domains — data-poor science gains little",
          "Faster experiments only help if fail-fast discipline acts on the results",
        ],
        metricsMoved: [
          "idea_to_launch_cycle_days",
          "rd_on_time_on_budget_pct",
        ],
      },
      {
        key: "ai_ip_patent_intelligence",
        name: "AI IP & patent intelligence",
        valueMechanism:
          "Use AI on patent and publication data for prior-art and " +
          "freedom-to-operate search, white-space mapping, competitor-IP " +
          "monitoring, and portfolio pruning — shifting IP from vanity volume " +
          "toward strategically-aligned protection and surfacing where to file, " +
          "where not to, and what to let lapse. Honest caveat: AI search is a " +
          "screening aid that still requires patent-attorney judgment for legal " +
          "conclusions, and it improves IP STRATEGY quality, not raw filing count " +
          "(which should not be the goal).",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Patent and scientific-publication corpora with citation data",
          "The internal IP portfolio mapped to products and programs",
          "The product/technology roadmap to assess strategic alignment",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Freedom-to-operate and patentability conclusions require patent-counsel judgment, not AI alone",
          "The goal is strategic-yield, not patent count — do not optimize the vanity metric",
          "Prior-art search misses carry real legal and freedom-to-operate consequences",
        ],
        metricsMoved: [
          "patent_ip_yield",
          "innovation_revenue_pct",
        ],
      },
      {
        key: "ai_launch_demand_forecasting",
        name: "AI new-product launch & demand forecasting",
        valueMechanism:
          "Apply AI to the R&D-to-commercial handoff: model launch demand, " +
          "test-market and concept signals, pricing sensitivity, and adoption " +
          "curves so commercial readiness and scale-up are planned with evidence " +
          "rather than discovered at launch — improving hit rate and narrowing the " +
          "valley of death. Honest caveat: new-product forecasting is intrinsically " +
          "uncertain (sparse history, especially for genuinely new offerings), so " +
          "outputs are ranged scenarios that inform readiness, not precise " +
          "predictions of any single launch's success.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Concept-test, pre-launch signal, and analog-product demand data",
          "Pricing, channel, and adoption-curve assumptions",
          "Post-launch actuals from comparable prior launches for calibration",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "New-product forecasts are ranged and sparse-data — present scenarios, not point predictions",
          "Launch and pricing decisions remain commercial-owner accountability",
          "Over-confident forecasts on novel products mislead scale-up investment",
        ],
        metricsMoved: [
          "innovation_hit_rate_pct",
          "vitality_index_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "three_horizon_portfolio_governance",
        name: "Three-horizon portfolio governance with protected funding",
        description:
          "A portfolio governance model that tags every initiative to a horizon, " +
          "measures balance by FUNDED investment and people (not project count), " +
          "and gives horizon-2/3 bets PROTECTED funding and distinct, option-style " +
          "governance and metrics — so transformational bets are not starved when " +
          "the core is under pressure or judged on horizon-1 NPV/payback hurdles " +
          "they cannot meet.",
        boundary:
          "Owns horizon tagging, the funded-balance view, protected-funding rules, " +
          "and horizon-appropriate metrics and stage-gates; does not own the " +
          "individual program's execution or the operating P&L — it sets and " +
          "protects the allocation and the rules of the game, it does not run the " +
          "projects.",
        humanAccountabilityPoint: "Chief Innovation / R&D Officer (with the investment committee)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "lean_learning_stage_gate",
        name: "Lean, learning-oriented stage-gate / discovery funnel",
        description:
          "A stage-gate redesigned as a structured LEARNING and selection " +
          "mechanism rather than a bureaucracy: evidence-based, lightweight gates " +
          "with explicit kill criteria, fast time-to-kill, horizon-differentiated " +
          "rigor, and AI-assisted idea triage — selecting hard while keeping the " +
          "funnel fast, so conversion improves without inflating cycle time.",
        boundary:
          "Owns the funnel design, gate criteria, kill discipline, and triage; " +
          "does not own the strategic horizon allocation (that is portfolio " +
          "governance) or the development work inside a stage — it decides what " +
          "advances and what is killed, and how fast.",
        humanAccountabilityPoint: "Head of Innovation / Portfolio (gate owners)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "open_innovation_absorption_engine",
        name: "Open-innovation scouting with an absorption engine",
        description:
          "A scouting / open-innovation capability deliberately paired with an " +
          "internal ABSORPTION mechanism — named business-unit sponsors, ring-" +
          "fenced absorption budget, integration teams, and a home for landed " +
          "technology — plus AI horizon scanning, so external discovery actually " +
          "converts into funded programs and products rather than ending in a " +
          "pilot graveyard.",
        boundary:
          "Owns external sourcing, scouting, and the absorption hand-in to a " +
          "business-unit owner; does not own the receiving unit's P&L or the " +
          "downstream development — it finds, qualifies, and lands external " +
          "innovation into an internal owner, it does not commercialize it alone.",
        humanAccountabilityPoint: "Head of Open Innovation / Ventures (with BU sponsors)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "rd_to_commercial_transfer",
        name: "R&D-to-commercial transfer & launch-readiness mechanism",
        description:
          "A defined handoff that engages commercial, supply-chain, and " +
          "go-to-market EARLY, transfers clear P&L ownership at the gate, and " +
          "lines up scale-up funding and capability — bridging the valley of death " +
          "with launch-readiness reviews and AI-assisted demand forecasting so " +
          "technically-successful programs actually reach and win in the market.",
        boundary:
          "Owns the transfer process, launch-readiness criteria, and the ownership " +
          "handoff from R&D to a P&L owner; does not own ongoing commercial " +
          "operations or the development work upstream — it ensures clean, funded, " +
          "early-engaged commercialization, it does not run the product after launch.",
        humanAccountabilityPoint: "R&D program lead and receiving P&L owner (jointly)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Innovation value is LONG-DATED, PROBABILISTIC, and HARD TO ATTRIBUTE — " +
        "so the honest frame is a PORTFOLIO OF OPTIONS valued in ranges, never a " +
        "single ROI forecast. Value is created — or quietly lost — in a few " +
        "places. First and most diagnostic: HORIZON BALANCE. Most portfolios are " +
        "~90% horizon-1 incrementalism mislabeled as transformation; the value " +
        "lever is funding genuine horizon-2/3 bets and PROTECTING them from being " +
        "starved or judged on horizon-1 hurdle rates — because the rare " +
        "transformational win, not the steady refresh, is where outsized value " +
        "comes from, and it only exists if it is paid for. Second: FUNNEL " +
        "DISCIPLINE. A stage-gate creates value only as a structured learning " +
        "mechanism; as bureaucracy it lowers speed without improving hit-rate, so " +
        "the value is in selecting hard and killing FAST, freeing funding for the " +
        "live bets. Third: ABSORPTION. Scouting and open innovation convert to " +
        "value only through an internal absorption mechanism; without it, better " +
        "scanning just lengthens the pilot graveyard. Fourth: the R&D-to-" +
        "commercial HANDOFF, where technically-good programs die in the valley of " +
        "death unless commercial ownership and scale-up funding are lined up " +
        "early. Return on R&D itself is a PROXY — innovation revenue and vitality " +
        "are read as renewal indicators, not clean attributions, because lags, " +
        "confounding, and probabilistic outcomes make causal attribution genuinely " +
        "hard. The blunt field truth governing every number: success odds are " +
        "systematically over-stated and value is long-dated, so the portfolio is " +
        "sized as a ranged EXPECTED value across a distribution of outcomes, with " +
        "explicit success probabilities and haircuts — not the innovation " +
        "champion's single optimistic case asserted as a forecast.",
      dominantHaircutFactors: [
        {
          factor: "Success-probability over-optimism",
          rationale:
            "Innovation programs systematically over-state their probability of " +
            "technical and especially commercial success; because hit rate is " +
            "materially below 100%, raw eNPV built on champion-supplied odds is " +
            "inflated and must be haircut toward honest, evidence-based " +
            "probabilities.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Gap between champion-estimated and realized commercial-success " +
              "rates across innovation pipelines, deepest for novel/H3 bets",
            label: "planning-range",
          },
        },
        {
          factor: "Long-dated, probabilistic timing (option, not forecast)",
          rationale:
            "Innovation returns arrive years out and across a distribution; " +
            "treating a long-dated, uncertain payoff as a near-term deterministic " +
            "cash flow overstates present value, so value must be discounted for " +
            "time and ranged as an option rather than booked as a forecast.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Present-value erosion from long, uncertain time-to-value and the " +
              "spread of the outcome distribution for H2/H3 bets",
            label: "planning-range",
          },
        },
        {
          factor: "R&D-to-commercial valley of death",
          rationale:
            "Technically-successful programs frequently fail to scale because the " +
            "handoff to commercial, supply, and go-to-market is late, ownership is " +
            "ambiguous, and scale-up funding is unplanned; underwritten value must " +
            "be discounted for the share that stalls at the handoff.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Observed share of technically-validated programs that fail to " +
              "commercialize for handoff, ownership, or scale-up-funding reasons",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution / return-on-R&D uncertainty",
          rationale:
            "Innovation revenue and vitality are PROXIES confounded by sales, " +
            "pricing, and market tailwinds; value claimed as 'return on R&D' must " +
            "be discounted for the portion not actually attributable to the R&D " +
            "spend, because clean causal attribution is rarely available.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Range reflecting how much of innovation-revenue/vitality is " +
              "confounded by non-R&D factors and cannot be cleanly attributed",
            label: "planning-range",
          },
        },
        {
          factor: "Open-innovation absorption failure",
          rationale:
            "Most externally-sourced opportunities never convert because no " +
            "internal absorption mechanism exists to fund and land them; value " +
            "premised on scouting or partnership output must be discounted heavily " +
            "for the low realized conversion to funded outcomes.",
          typicalHaircut: {
            low: 0.4,
            high: 0.8,
            basis:
              "Low open-innovation conversion rates — most scouting and " +
              "partnership engagement never lands internally without an absorption " +
              "mechanism",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Horizon rebalancing toward funded H2/H3",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Incremental future-growth value from shifting funded investment " +
              "toward protected horizon-2/3 bets, relative to an all-H1 portfolio — " +
              "high-variance because it depends on the rare transformational win",
            label: "planning-range",
          },
          measuredAs:
            "Future growth value attributable to funded H2/H3 bets (tracks " +
            "horizon_balance_h2h3_pct and risk_adjusted_pipeline_value)",
        },
        {
          lever: "Funnel speed & fail-fast (cycle time / time-to-kill)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Value from faster idea-to-launch cycles and faster kills — more " +
              "shots on goal and funding freed from zombies — net of the " +
              "bureaucracy a heavy stage-gate adds",
            label: "planning-range",
          },
          measuredAs:
            "Throughput and reallocated-funding gain (tracks " +
            "idea_to_launch_cycle_days and time_to_kill_days)",
        },
        {
          lever: "R&D-to-commercial handoff (valley-of-death recovery)",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Value recovered by commercializing technically-successful programs " +
              "that would otherwise stall at the handoff, via early commercial " +
              "engagement and lined-up scale-up funding",
            label: "planning-range",
          },
          measuredAs:
            "Share of validated programs reaching profitable launch (tracks " +
            "innovation_hit_rate_pct and vitality_index_pct)",
        },
        {
          lever: "Open-innovation absorption conversion",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Incremental value from converting external scouting/partnership " +
              "opportunities into funded outcomes via a deliberate absorption " +
              "mechanism, relative to scouting with no absorption",
            label: "planning-range",
          },
          measuredAs:
            "External opportunities absorbed into funded programs (tracks " +
            "scouting_adoption_conversion_pct)",
        },
      ],
      timeToValueBand:
        "Funnel-discipline and fail-fast changes (kill criteria, lighter gates, " +
        "horizon-appropriate metrics): 1-2 quarters to stand up, with freed " +
        "funding visible quickly. AI idea triage, scouting, and IP intelligence: " +
        "1-3 quarters to deploy, compounding as theses are codified. Horizon " +
        "rebalancing toward funded H2/H3: a multi-quarter governance and budget " +
        "shift, with returns long-dated — H2 bets pay over a few years, H3 bets " +
        "over many, and across a distribution of outcomes. R&D research " +
        "acceleration: realized per-program where the science is data-rich. The " +
        "honest frame: innovation value is long-dated and probabilistic — the " +
        "discipline levers pay within a year, but the portfolio's growth payoff " +
        "is a multi-year option, not a near-term forecast.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Innovation / portfolio management (PPM) system",
          role:
            "System of record for the innovation portfolio — initiatives tagged " +
            "to horizon, funding and FTE allocation, the stage-gate pipeline, and " +
            "risk-adjusted portfolio value.",
          examples: ["Planview", "Sopheon Accolade", "Aha!", "Wellspring", "Brightidea (portfolio)"],
        },
        {
          name: "Idea management / discovery funnel system",
          role:
            "Captures and triages the front-end flow of ideas and concepts " +
            "through the discovery funnel — submissions, scoring, gate conversion, " +
            "and kill reasons.",
          examples: ["Brightidea", "HYPE Innovation", "IdeaScale", "Qmarkets", "Miro/Mural (front-end)"],
        },
        {
          name: "Technology scouting / open-innovation platform",
          role:
            "Tracks externally-sourced opportunities — startups, university IP, " +
            "partnerships, scouting leads — through to absorption into funded " +
            "programs or products.",
          examples: ["Wellspring Scout", "ITONICS", "Yet2", "Sopheon (scouting)", "venture-CRM tools"],
        },
        {
          name: "IP / patent management system",
          role:
            "System of record for the IP portfolio — filings, grants, citations, " +
            "product coverage, freedom-to-operate, maintenance, and licensing.",
          examples: ["Anaqua", "Clarivate (Derwent / IPfolio)", "Questel", "PatSnap", "Dennemeyer"],
        },
        {
          name: "R&D program / project management & PLM",
          role:
            "Tracks R&D program execution, milestones, budget, and the " +
            "product-development lifecycle from concept through launch.",
          examples: ["Planview (PPM)", "Jira/Azure DevOps (R&D)", "Siemens Teamcenter (PLM)", "PTC Windchill", "Smartsheet"],
        },
      ],
      roles: [
        {
          title: "Chief Innovation Officer / Chief R&D / Technology Officer",
          accountability:
            "The end-to-end innovation agenda — the cross-horizon portfolio, R&D " +
            "investment level and allocation, and the discipline that funds the " +
            "future without starving horizon-2/3 bets.",
        },
        {
          title: "Head of Innovation / Portfolio Management",
          accountability:
            "Portfolio governance — horizon balance by funded investment, the " +
            "stage-gate / discovery funnel, kill discipline, and risk-adjusted " +
            "portfolio value.",
        },
        {
          title: "Head of Open Innovation / Corporate Ventures",
          accountability:
            "Technology scouting, partnerships, accelerators, and ventures — and " +
            "the absorption mechanism that converts external discovery into funded " +
            "internal outcomes.",
        },
        {
          title: "Head of IP / Chief IP Counsel",
          accountability:
            "IP strategy — filings tied to the roadmap, freedom-to-operate, " +
            "white-space and competitor-IP intelligence, portfolio pruning, and " +
            "licensing — for strategic yield, not vanity volume.",
        },
        {
          title: "R&D Program Lead / Receiving P&L Owner",
          accountability:
            "Delivering a program through the funnel and the R&D-to-commercial " +
            "handoff — joint ownership of launch readiness and the transfer to a " +
            "P&L owner across the valley of death.",
        },
      ],
      regulatoryFrames: [
        {
          name: "IP / patent law & freedom-to-operate",
          relevance:
            "Patentability, prior art, and freedom-to-operate govern what can be " +
            "protected and what can be commercialized without infringing; legal " +
            "conclusions require patent counsel, and IP strategy must align to " +
            "filing and litigation regimes across jurisdictions.",
        },
        {
          name: "R&D tax credit / incentive substantiation",
          relevance:
            "R&D tax credits and innovation incentives require qualifying-activity " +
            "documentation and substantiation (e.g. project, time, and cost " +
            "records); the R&D cost ledger and program tracking must support audit " +
            "of claimed credits.",
        },
        {
          name: "Export controls on emerging / dual-use technology",
          relevance:
            "Scouting, partnerships, and R&D in sensitive or dual-use fields can " +
            "trigger export-control and technology-transfer restrictions, gating " +
            "what can be shared with which partners and across which borders.",
        },
        {
          name: "Grant / collaboration IP & compliance terms",
          relevance:
            "Government grants, university partnerships, and consortium R&D carry " +
            "IP-ownership, march-in, publication, and compliance terms that " +
            "constrain how jointly-developed innovation can be owned and " +
            "commercialized.",
        },
      ],
      canonicalTerms: [
        {
          term: "Three horizons (H1/H2/H3)",
          definition:
            "A portfolio frame: H1 = core/incremental improvements to today's " +
            "business; H2 = adjacent/emerging opportunities; H3 = transformational, " +
            "new-to-the-world bets — each needing different funding, metrics, and " +
            "governance.",
        },
        {
          term: "Stage-gate / discovery funnel",
          definition:
            "A staged process with decision gates that narrows many ideas to few " +
            "launches; valuable as a structured learning-and-selection mechanism, " +
            "destructive as a compliance bureaucracy.",
        },
        {
          term: "Return on R&D / innovation revenue",
          definition:
            "The (hard-to-attribute) payoff from R&D, most often proxied by the " +
            "share of revenue from recently-launched products (e.g. <3 years) — a " +
            "renewal indicator, not a clean causal attribution.",
        },
        {
          term: "Vitality index",
          definition:
            "Revenue from new products introduced within a recent window (often " +
            "3-5 years) as a share of total revenue — the sustained-renewal view " +
            "of the portfolio.",
        },
        {
          term: "Risk-adjusted pipeline value (eNPV / ECV)",
          definition:
            "The probability-weighted value of the innovation pipeline — each " +
            "program's value times its success probability — summed as a ranged " +
            "expected value, the portfolio-of-options view.",
        },
        {
          term: "Fail-fast / time-to-kill",
          definition:
            "The discipline of stopping programs quickly once evidence " +
            "disconfirms them, freeing funding and talent for live bets; the " +
            "antidote to sunk-cost zombie projects.",
        },
        {
          term: "Open innovation & absorption mechanism",
          definition:
            "Sourcing innovation externally (scouting, partnerships, ventures) " +
            "and the internal mechanism — sponsor, budget, integration team, a " +
            "home for the technology — required to actually absorb and convert it.",
        },
        {
          term: "Valley of death (R&D-to-commercial)",
          definition:
            "The gap where technically-successful R&D fails to commercialize " +
            "because commercial ownership, scale-up funding, and go-to-market were " +
            "not lined up at the handoff.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Portfolio horizon balance and allocation",
        authoritativeSource:
          "The innovation / portfolio management system, with every initiative " +
          "tagged to a horizon and measured by funded investment and FTE",
        whatGoodEvidenceLooksLike:
          "Horizon balance measured by FUNDED investment and people (not project " +
          "count), named horizon-2/3 bets with real protected budgets, and " +
          "allocation reconciled to the R&D cost base.",
        weakEvidenceToReject:
          "Horizon mix counted by number of ideas, 'transformation' programs that " +
          "are really line extensions, or H3 bets listed on slides with no funding " +
          "behind them.",
      },
      {
        claim: "Funnel conversion, cycle time, and kill discipline",
        authoritativeSource:
          "The stage-gate / idea-management system — conversion by gate, stage " +
          "durations, and kill reasons with time-to-kill",
        whatGoodEvidenceLooksLike:
          "End-to-end conversion with stage durations, explicit kill criteria and " +
          "fast time-to-kill, and evidence the gates actually stop programs on " +
          "disconfirming evidence rather than rubber-stamping them onward.",
        weakEvidenceToReject:
          "Gates that approve nearly everything, no recorded kills, cycle time " +
          "dominated by waiting for gates, or conversion presented with no kill " +
          "reasons or stage timing.",
      },
      {
        claim: "Return on R&D / innovation revenue (as a proxy)",
        authoritativeSource:
          "Product P&L tagged by launch date reconciled to the R&D cost base for " +
          "those products",
        whatGoodEvidenceLooksLike:
          "Innovation revenue and vitality measured against the R&D spend that " +
          "produced those products, presented as a PROXY with its confounders " +
          "(sales, pricing, market) named rather than asserted as clean " +
          "attribution.",
        weakEvidenceToReject:
          "A clean 'return on R&D' number asserted as causal with no statement of " +
          "lags or confounders, or innovation revenue not tied to any R&D cost " +
          "base.",
      },
      {
        claim: "Risk-adjusted pipeline value and success probabilities",
        authoritativeSource:
          "The portfolio management system — per-program value × probability of " +
          "success, with the probability assumptions explicit",
        whatGoodEvidenceLooksLike:
          "Expected value presented as a RANGE with explicit, evidence-based " +
          "success probabilities and scenario spread, and probabilities calibrated " +
          "against the organization's historical hit rate.",
        weakEvidenceToReject:
          "A single eNPV point built on champion-supplied, over-optimistic success " +
          "odds, or a pipeline value asserted as a forecast with no probability or " +
          "range disclosed.",
      },
      {
        claim: "Open-innovation / scouting conversion and absorption",
        authoritativeSource:
          "The scouting / open-innovation pipeline system tracking external leads " +
          "through to funded absorption",
        whatGoodEvidenceLooksLike:
          "External engagements tracked to funded outcomes with a named internal " +
          "absorption owner and budget, and an honest conversion rate from " +
          "engagement to landed program or product.",
        weakEvidenceToReject:
          "Scouting activity and pilot counts presented as success, with no " +
          "tracking to funded absorption and no named internal owner for what was " +
          "found.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Measured by FUNDED investment and people — not project count — what share of your portfolio is genuinely horizon-2 and horizon-3, and which of those bets has real protected budget rather than a slide?",
      "Do your stage-gates actually kill projects on evidence, or mostly approve them onward — and how much of your idea-to-launch cycle time is real learning versus waiting for and preparing gate reviews?",
      "How do you measure return on R&D today, and where you cannot attribute cleanly, do you state the proxy and its limits honestly — or simply not measure productivity at all?",
      "Are your horizon-2/3 bets protected from being raided when the core is under pressure, and are they measured as options on learning rather than held to the same NPV/payback hurdles as incremental products?",
      "When scouting or a partnership finds something valuable, who internally owns absorbing it — with budget and a home in a business unit — and what is your actual conversion from external engagement to funded outcome?",
      "At what point do commercial, supply-chain, and go-to-market join an R&D program, and who takes P&L ownership at the handoff — or do technically-good programs keep dying in the gap to market?",
      "What share of your patent portfolio actually protects products you sell, blocks competitors, or earns licensing — and how much spend maintains IP that does none of those?",
      "How fast do you kill a bet once the evidence says it will not work, and where do dying programs linger and starve the live ones?",
    ],
    maturitySignals: [
      "Horizon balance is governed and measured by funded investment and people, with horizon-2/3 bets carrying protected budgets and option-style metrics distinct from horizon-1 NPV/payback.",
      "The stage-gate runs as a lean learning-and-selection mechanism — explicit kill criteria, fast time-to-kill, horizon-differentiated rigor — rather than a documentation bureaucracy.",
      "Return on R&D is tracked through innovation-revenue and vitality proxies reconciled to the R&D cost base, with confounders named honestly rather than attribution asserted or avoided.",
      "Scouting and open innovation are paired with a real absorption mechanism — named sponsors, budget, integration teams — and conversion from external engagement to funded outcome is tracked.",
      "Risk-adjusted pipeline value is maintained with explicit, calibrated success probabilities and presented as a ranged expected value, not a single forecast.",
      "The R&D-to-commercial handoff is defined — commercial and supply engaged early, P&L ownership transferred at the gate, scale-up funding planned — so technically-good programs reach the market.",
    ],
    redFlags: [
      "The 'innovation portfolio' is overwhelmingly horizon-1 incrementalism rebranded as transformation, with horizon mix counted by project number and H3 bets unfunded on slides.",
      "Stage-gates approve nearly everything and rarely kill on evidence; cycle time is dominated by waiting for gates, and the process selects for conformance, not market learning.",
      "Return on R&D is either unmeasured or asserted as a clean causal number with no acknowledgement of lags, confounders, or the proxy nature of innovation-revenue/vitality.",
      "Horizon-2/3 bets are cut first under budget pressure and judged on horizon-1 NPV/payback hurdles, and dying programs linger for years (slow time-to-kill) starving the live ones.",
      "Scouting, accelerators, and partnerships generate activity and headlines but almost never convert, with no internal absorption owner — the funnel ends in a pilot graveyard.",
      "Patent count is cited as an innovation KPI while maintenance spend sits on IP that covers nothing sold and blocks no competitor, disconnected from the roadmap.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Planview / Sopheon Accolade / Aha!",
        category: "Innovation & portfolio management (PPM)",
        switchingCost:
          "High — the portfolio history, horizon tagging, stage-gate configuration, and roadmap data accrete and become the planning memory of the innovation function; migration loses institutional configuration and history.",
        renewalDynamics:
          "Per-seat / module subscription; stickiness comes from embedded process configuration and integrations, and the upsell hook is added modules (roadmapping, capacity, scenario analysis).",
      },
      {
        vendorName: "Brightidea / HYPE / IdeaScale / Qmarkets",
        category: "Idea management & front-end discovery funnel",
        switchingCost:
          "Moderate — campaign history and community engagement embed, but the front-end funnel is more contestable than the core portfolio system; switching between cycles is feasible.",
        renewalDynamics:
          "Subscription priced by users/engagement; value case rests on demonstrable funnel conversion, so renewal leverage depends on proving ideas actually convert, not just submission volume.",
      },
      {
        vendorName: "Anaqua / Clarivate / Questel / PatSnap",
        category: "IP & patent management and intelligence",
        switchingCost:
          "High — the IP docket, deadlines, family data, and integrations with counsel are mission-critical and risky to migrate; identifiers and workflows are deeply embedded.",
        renewalDynamics:
          "Seat/data-subscription plus services; deadline-criticality and counsel integration drive stickiness, with AI patent-analytics features as the growth upsell and the negotiation hook.",
      },
      {
        vendorName: "Wellspring / ITONICS / Yet2",
        category: "Technology scouting & open-innovation platforms",
        switchingCost:
          "Low-to-moderate — scouting pipelines and partner networks have some lock-in, but the data is more portable and the platforms are contestable relative to core PPM/IP systems.",
        renewalDynamics:
          "Subscription tied to scouting volume and network access; renewal leverage hinges on demonstrated absorption conversion, since activity-without-conversion is the common failure the buyer should price against.",
      },
      {
        vendorName: "Siemens Teamcenter / PTC Windchill (PLM)",
        category: "Product lifecycle management & R&D execution",
        switchingCost:
          "Very high — PLM holds the product definition, BOMs, and engineering process of record, deeply integrated with engineering and manufacturing; migration is a multi-year program.",
        renewalDynamics:
          "Enterprise licensing with heavy implementation; the depth of integration makes it among the stickiest systems in the estate, with limited renewal leverage beyond enterprise-agreement timing.",
      },
    ],
    switchingCosts:
      "The durable lock-in across the innovation toolchain is the accumulated " +
      "PROPRIETARY DATA and embedded process: the portfolio history and " +
      "horizon/stage-gate configuration in the PPM system, the IP docket and " +
      "deadline-critical family data in the IP system, and the product " +
      "definition in PLM — all far stickier than the front-end idea-management " +
      "and scouting tools, which are more contestable. The negotiable frontier " +
      "is therefore: protect data-export and configuration portability on the " +
      "PPM and IP systems; keep idea-management and scouting platforms " +
      "competitively contestable and priced on demonstrated conversion (not " +
      "submission or engagement volume); and treat PLM as a long-cycle, " +
      "strategically-locked decision rather than a routine renewal.",
    negotiationLevers: [
      "Tie PPM and IP-system commitments to data-export and configuration-portability rights so portfolio history and the IP docket are not hostage to the vendor",
      "Price idea-management and scouting platforms on demonstrated CONVERSION (ideas funded, leads absorbed) rather than submission or engagement volume",
      "Gate AI patent-analytics and AI-scouting feature pricing on validated, sampled accuracy rather than vendor accuracy claims",
      "Bundle predictable seat and module growth into enterprise PPM terms to earn volume discounts while preserving the right to drop unused modules",
      "Keep scouting and open-innovation platforms competitively contestable, using the low conversion of activity-without-absorption as a pricing-pressure argument",
      "Sequence PLM decisions to enterprise-agreement and platform-roadmap inflection points, since mid-cycle switching is prohibitively expensive",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      horizon_balance_claim: [
        "horizon mix measured by FUNDED investment and FTE, not project count",
        "named horizon-2/3 bets with protected budgets identified",
        "allocation reconciled to the R&D cost base",
      ],
      funnel_discipline_claim: [
        "conversion by gate with stage durations and time-to-kill",
        "explicit kill criteria and recorded kills (not rubber-stamps)",
        "cycle time decomposed into learning versus gate-waiting",
      ],
      return_on_rd_claim: [
        "innovation-revenue / vitality tagged by launch date and reconciled to the R&D cost base",
        "explicit statement of proxy status, lags, and confounders",
        "no clean causal attribution asserted without it",
      ],
      pipeline_value_claim: [
        "per-program value × explicit, calibrated success probability",
        "presented as a ranged expected value with scenario spread",
        "probabilities checked against historical hit rate",
      ],
      open_innovation_claim: [
        "external leads tracked through to funded absorption",
        "a named internal absorption owner and budget",
        "honest engagement-to-funded conversion rate",
      ],
      value_projection: [
        "benchmark planning-range",
        "explicit haircut factors (success-probability over-optimism, long-dated timing, valley-of-death, attribution, absorption failure)",
        "ranged expected value, not the champion's single optimistic forecast",
      ],
    },
    citationStandard:
      "Quantitative innovation claims cite the system-of-record artifact: the " +
      "PPM / portfolio system for horizon balance and pipeline value, the " +
      "stage-gate / idea system for conversion and time-to-kill, the product " +
      "P&L tagged by launch date for return-on-R&D, the scouting system for " +
      "open-innovation conversion, and the IP system for patent yield. Horizon " +
      "claims MUST be measured by funded investment and people, not project " +
      "count. Return-on-R&D claims MUST be stated as a PROXY with lags and " +
      "confounders named, never asserted as clean attribution. Pipeline-value " +
      "and success-probability claims MUST be ranged with explicit probabilities " +
      "calibrated to historical hit rate, never a single forecast on " +
      "champion-supplied odds. Value projections cite a labelled planning range " +
      "and the haircut factors applied (success-probability over-optimism, " +
      "long-dated timing, valley-of-death, attribution uncertainty, absorption " +
      "failure), and are presented as a ranged expected value across a " +
      "distribution of outcomes — never the innovation champion's optimistic " +
      "case asserted as a forecast.",
  },

  hedgeRules: {
    whenToHedge: [
      "Innovation value or pipeline ROI is stated as a single forecast — reframe as a portfolio of options: a ranged expected value with explicit success probabilities and a distribution of outcomes.",
      "Return on R&D is asserted as a clean causal number — flag that innovation-revenue/vitality is a proxy confounded by sales, pricing, and market, with long attribution lags.",
      "The portfolio is described as transformational — test horizon balance by FUNDED investment, and flag if it is really horizon-1 incrementalism rebranded.",
      "A stage-gate is presented as improving outcomes — note that gates create value only as learning/selection, and as bureaucracy they cut speed without improving hit-rate.",
      "Scouting or open-innovation activity is cited as success — flag that activity rarely converts without an internal absorption mechanism, and ask for funded-absorption conversion.",
      "Success probabilities or synergy-style innovation upside are champion-supplied — mark as likely over-optimistic pending calibration against historical hit rate.",
    ],
    inferenceLanguage: [
      "Across innovation portfolios at this scale, most investment is horizon-1 incrementalism even when labelled transformation — without your funded-horizon mix this is the pattern, not your result...",
      "Treating this as a portfolio of options rather than a forecast, the expected value across outcomes — with honest success probabilities — is...",
      "Return on R&D is hard to attribute, so as a proxy rather than a measured causal return, innovation revenue suggests...",
      "Without your historical hit rate, the industry pattern is that champion-estimated success probabilities run optimistic, so as a ranged planning estimate...",
      "Open innovation typically converts at low single-to-double-digit rates without an absorption mechanism — as the pattern, not your data...",
    ],
    flagWithoutEvidence: [
      "A specific return-on-R&D or pipeline-ROI figure for this tenant asserted as a clean forecast without ranges, probabilities, or the proxy/confounder caveat",
      "A claim that the portfolio is transformational without horizon balance measured by funded investment and people",
      "This tenant's actual innovation revenue, hit rate, conversion, or time-to-kill without the system-of-record source",
      "A success probability or innovation upside asserted at the champion's value without calibration to historical hit rate",
      "Scouting / open-innovation 'success' claimed from activity without tracking to funded absorption and a named internal owner",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "portfolio horizon balance / where is investment really going across H1/H2/H3",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Stacked bar of FUNDED investment and FTE across horizons (H1/H2/H3) versus the count of ideas, exposing incrementalism mislabeled as transformation.",
    },
    {
      questionPattern:
        "discovery funnel / how do ideas convert and where do they die from concept to launch",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Funnel waterfall from ideas through each stage-gate to launches, with kill reasons and conversion rates, and time-to-kill annotated.",
    },
    {
      questionPattern:
        "innovation scorecard / where do we stand vs planning ranges across the R&D engine",
      exhibitKind: "table",
      note: "R&D intensity, innovation revenue, horizon balance, gate conversion, cycle time, pipeline value, on-time/on-budget, hit rate, time-to-kill, patent yield, vitality, scouting conversion vs planning ranges.",
    },
    {
      questionPattern:
        "pipeline value sensitivity / what assumptions most move risk-adjusted portfolio value",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of risk-adjusted pipeline value sensitivity to success probabilities, time-to-value, and commercial value, making the option ranges explicit rather than a point eNPV.",
    },
    {
      questionPattern:
        "innovation-value bridge / from champion case to honest ranged expected value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      note: "Bridge from the champion's optimistic case through success-probability, long-dated-timing, valley-of-death, attribution, and absorption haircuts to a ranged expected value.",
    },
    {
      questionPattern:
        "innovation roadmap / horizon bets and launch waves sequenced over time",
      exhibitKind: "chart",
      chartKind: "swimlane",
      note: "Sequence horizon-1/2/3 bets, gate milestones, and launch waves by period, making the long-dated payoff of H2/H3 options and the R&D-to-commercial handoff visible.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "low",
    successDrivers: [
      "Governing horizon balance by FUNDED investment and protecting horizon-2/3 bets with distinct, option-style metrics — so transformational bets are paid for and not starved or judged on H1 hurdles",
      "Running the stage-gate as a lean learning-and-selection mechanism with explicit kill criteria and fast time-to-kill, selecting hard while keeping the funnel fast",
      "Pairing scouting and open innovation with a real internal absorption mechanism (named sponsor, budget, integration team, a home for the technology) so external discovery converts",
      "Defining the R&D-to-commercial handoff — early commercial engagement, P&L ownership transfer, lined-up scale-up funding — so technically-good programs cross the valley of death, and measuring return-on-R&D honestly as a ranged proxy",
    ],
    failureDrivers: [
      "Running a portfolio that is ~90% horizon-1 incrementalism rebranded as transformation, with H3 bets unfunded on slides and horizon mix counted by project number",
      "Letting the stage-gate harden into bureaucracy that cuts speed without improving hit-rate, and tolerating slow time-to-kill so zombie programs starve the live ones",
      "Starving and mis-measuring horizon-2/3 bets — cutting them first and holding them to NPV/payback hurdles early options cannot meet",
      "Scouting and partnering for activity with no absorption mechanism, managing IP for vanity volume, and asserting return-on-R&D as a clean forecast rather than an honest ranged proxy",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Funnel-discipline practices — explicit kill criteria, lighter gates, " +
      "horizon-appropriate metrics, fail-fast — adopt fastest because they are " +
      "process changes leadership can mandate, though they meet cultural " +
      "resistance from sponsors invested in pet projects. AI idea triage, " +
      "scouting, and IP intelligence adopt next as efficiency aids. The hard, " +
      "slow adoption is the structural one: genuinely funding and PROTECTING " +
      "horizon-2/3 bets, building an absorption mechanism, and accepting honest " +
      "ranged ROI in place of comforting forecasts — these require executive " +
      "conviction, patient capital, and a culture willing to kill fast and " +
      "tolerate long-dated, probabilistic payoffs. The decisive barrier " +
      "throughout is cultural and budgetary, not technical: the willingness to " +
      "pay for the future and judge it honestly.",
    roiClarity: "low",
    roiClarityBasis:
      "Innovation ROI clarity is genuinely low and the expert says so plainly. " +
      "Returns are long-dated and probabilistic, attribution is confounded by " +
      "sales, pricing, and market factors, and the headline proxies (innovation " +
      "revenue, vitality) reward cadence and are not clean causal measures of " +
      "return on R&D. Funnel-discipline value — freed funding from faster kills, " +
      "throughput from lighter gates — is more measurable in the near term, but " +
      "the portfolio's growth payoff rests on rare horizon-2/3 wins across a " +
      "distribution of outcomes that no single ROI number captures honestly. " +
      "This is exactly why the value model, evidence rules, and hedge rules " +
      "force a portfolio-of-options frame: ranged expected value, explicit " +
      "success probabilities calibrated to historical hit rate, honest haircuts, " +
      "and proxies stated as proxies — rather than a deterministic forecast that " +
      "would overstate certainty the domain does not have.",
  },

  regulatoryFrame: {
    name: "IP/patent law, R&D tax incentives, export controls & grant/collaboration IP terms",
    relevance:
      "R&D and innovation operate inside a meaningful external-control frame: " +
      "IP/patent law and freedom-to-operate govern what can be protected and " +
      "commercialized (legal conclusions require patent counsel); R&D tax " +
      "credits and innovation incentives require qualifying-activity " +
      "substantiation from the R&D cost ledger and program records; export " +
      "controls on emerging and dual-use technology gate what can be shared with " +
      "which partners and across which borders in scouting and partnerships; and " +
      "grant, university, and consortium collaborations carry IP-ownership, " +
      "march-in, publication, and compliance terms that constrain how " +
      "jointly-developed innovation can be owned and commercialized. AI in " +
      "scouting, triage, portfolio decision-support, research acceleration, IP " +
      "intelligence, and launch forecasting is decision support inside these " +
      "controls — not a substitute for patent-counsel judgment, tax " +
      "substantiation, export-control clearance, or collaboration-agreement " +
      "compliance (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
