// Consilium expert — Corporate Development, M&A & Portfolio Management
// (cross-cutting corporate function).
//
// W3 wave2 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting expert for the inorganic-growth agenda: deal sourcing &
// screening, due diligence, valuation, deal execution, post-merger
// integration (PMI), and ongoing portfolio management & value creation across
// owned businesses. Scoped to BOTH the classic acquirer pattern and the
// decentralized holding-company pattern, where the center supports acquired
// businesses with capital and capabilities WITHOUT taking operating control.
//
// CORE DOCTRINE — THESIS DISCIPLINE, THEN DILIGENCE TRUTH, THEN INTEGRATION.
// M&A value is won or lost in three places, in order: (1) a disciplined,
// falsifiable investment thesis and a walk-away price — most value destruction
// is overpaying for a thesis that was never tested; (2) diligence whose
// constraint is DATA QUALITY, not analyst hours — a target's data room is
// curated by the seller, and the real risks (customer concentration, churn,
// quality of earnings, hidden liabilities) hide in the gaps; (3) integration,
// where the synergies are actually realized or quietly lost. Be honest on three
// counts that the field systematically gets wrong: synergy estimates are
// over-optimistic and MUST carry real haircuts (revenue synergies especially);
// most deals underperform their underwrite; and in a decentralized holding
// model, "control" levers (forced integration, central mandates) often DESTROY
// the value that made the business worth buying — support is the lever, not
// control.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const corporateDevelopmentMaExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.corporate-development-ma",
    expertName: "Corporate Development, M&A & Portfolio Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "corporate-development-ma",
    scopeNote:
      "Cross-cutting corporate-development function spanning the full inorganic " +
      "lifecycle: deal sourcing & screening, due diligence, valuation, deal " +
      "execution, post-merger integration (PMI), and ongoing portfolio " +
      "management & value creation across owned businesses. Covers both the " +
      "classic acquirer (control + integrate) and the decentralized holding " +
      "company that supports acquired businesses with capital and capabilities " +
      "WITHOUT taking operating control. Doctrine is THESIS-DISCIPLINE then " +
      "DILIGENCE-TRUTH then INTEGRATION, and the expert is honest that most M&A " +
      "value is won or lost in integration and thesis discipline, that diligence " +
      "data quality is the binding constraint, and that synergy estimates are " +
      "systematically over-optimistic and must be haircut. Excludes the " +
      "corporate FP&A planning layer, treasury/capital-structure execution, and " +
      "the operating P&L of the businesses themselves (separate experts) — this " +
      "expert owns the buy/build/partner/divest decision, the deal, and the " +
      "value-creation plan, not day-to-day operations.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "pipeline_coverage_ratio",
        name: "Deal pipeline coverage",
        definition:
          "Total qualified deal-value (or count) in the active pipeline divided " +
          "by the annual deployment / acquisition target — how many times over " +
          "the year's mandate is covered by live, screened opportunities.",
        unit: "x",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 3,
          high: 10,
          basis:
            "Corp-dev / private-equity origination practice; because hit rates " +
            "from screen to close are low single-digit percent, several multiples " +
            "of coverage are needed, but excessive coverage signals weak " +
            "qualification rather than a healthy funnel",
          label: "planning-range",
        },
        dataSource:
          "Deal/CRM pipeline system (e.g. DealCloud / Affinity) — qualified " +
          "opportunities by stage against the board-approved deployment target",
        whyItMatters:
          "Inorganic growth is a funnel with brutal attrition; without enough " +
          "qualified coverage, the team either misses its mandate or relents on " +
          "thesis discipline and overpays for whatever is available. In-range " +
          "because too little coverage starves the mandate and too much signals " +
          "indiscriminate sourcing.",
      },
      {
        key: "deal_win_rate",
        name: "Deal win rate",
        definition:
          "Share of deals the firm actively pursues to a submitted offer / LOI " +
          "that it ultimately wins and closes (or, for a programmatic acquirer, " +
          "closed deals over LOIs submitted).",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Corp-dev practitioner ranges; a very low win rate wastes diligence " +
            "spend and signals mispriced bids, while a very high win rate often " +
            "means systematically overpaying (winner's curse) rather than " +
            "superior sourcing",
          label: "planning-range",
        },
        dataSource:
          "Deal pipeline system — closed deals over LOIs/offers submitted, with " +
          "loss reasons (price, terms, fit) captured",
        whyItMatters:
          "Win rate is a discipline gauge, not a maximize target. Winning most " +
          "auctions usually means paying the most; losing almost everything means " +
          "wasted diligence cost or a thesis no seller accepts. The right band " +
          "reflects priced-to-walk discipline.",
      },
      {
        key: "diligence_cycle_time_days",
        name: "Diligence cycle time",
        definition:
          "Elapsed days from signed LOI / diligence kickoff to a go/no-go " +
          "recommendation, across the workstreams (financial/QoE, commercial, " +
          "legal, tax, tech, HR, integration planning).",
        unit: "days",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 30,
          high: 120,
          basis:
            "Practitioner ranges scaled to deal size/complexity; too fast risks " +
            "missing concentration/quality-of-earnings issues, too slow risks " +
            "losing the deal or signaling indecision — speed must not trade away " +
            "diligence truth",
          label: "planning-range",
        },
        dataSource:
          "Diligence workstream tracker / virtual data room (VDR) activity logs " +
          "and the deal timeline",
        whyItMatters:
          "Diligence is where hidden risk is found or missed. Faster is only " +
          "better if data quality holds; the binding constraint is the " +
          "completeness and reliability of the seller-curated data room, not " +
          "analyst hours — so this is an in-range, not a minimize, metric.",
      },
      {
        key: "synergy_realization_pct",
        name: "Synergy realization",
        definition:
          "Realized, independently-validated synergies (cost and revenue) as a " +
          "share of the synergies underwritten in the deal model, tracked over " +
          "the integration period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "PMI practitioner ranges; cost synergies realize at the high end and " +
            "earlier, revenue synergies systematically under-deliver and later, " +
            "so blended realization against the FULL underwrite routinely lands " +
            "well below 100%",
          label: "planning-range",
        },
        dataSource:
          "Integration management office (IMO) synergy tracker reconciled to the " +
          "deal model baseline and to actuals in the ledger",
        whyItMatters:
          "The metric where deals actually pay off or quietly fail. The honest " +
          "expectation is realization below 100% of the underwrite — revenue " +
          "synergies especially — which is precisely why synergy estimates must " +
          "be haircut at underwrite, not assumed in full.",
      },
      {
        key: "integration_milestone_on_time_pct",
        name: "Integration milestone on-time delivery",
        definition:
          "Share of integration plan milestones (Day-1 readiness, TSA exits, " +
          "system cutovers, org/legal-entity consolidation, synergy initiatives) " +
          "delivered on or ahead of plan.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "PMI practitioner ranges; well-run integration management offices " +
            "hold most milestones, but slippage on systems and TSA exits is " +
            "common and compounds into synergy delay",
          label: "planning-range",
        },
        dataSource:
          "Integration management office (IMO) milestone tracker against the " +
          "Day-1 / 100-day / full-integration plan",
        whyItMatters:
          "Integration execution is the proximate cause of synergy capture or " +
          "loss. Milestone slippage delays synergies (eroding their present " +
          "value), prolongs costly TSAs, and is the early-warning signal that the " +
          "deal is drifting from its underwrite.",
      },
      {
        key: "deal_irr_vs_underwrite_pp",
        name: "Deal IRR / MOIC vs underwrite",
        definition:
          "Realized (or marked) deal return — IRR and money-on-invested-capital " +
          "(MOIC) — versus the return underwritten at approval, expressed as the " +
          "percentage-point (IRR) or multiple gap to plan.",
        unit: "pp / x gap",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: -10,
          high: 5,
          basis:
            "Deal-outcome studies skew negative-to-flat versus underwrite; a " +
            "realistic planning band centers slightly below plan, because most " +
            "deals underperform their model and over-delivery is the exception",
          label: "planning-range",
        },
        dataSource:
          "Post-close deal performance review / value-creation tracker against " +
          "the approved deal model (IRR and MOIC), independently validated",
        whyItMatters:
          "The single honest scorecard for whether M&A creates value. Centering " +
          "the planning band slightly below the underwrite encodes the field " +
          "reality that most deals miss plan — it forces underwriting discipline " +
          "and post-mortem learning rather than assuming the model.",
      },
      {
        key: "time_to_close_days",
        name: "Time to close",
        definition:
          "Elapsed days from signing (definitive agreement) to deal close, " +
          "gated by regulatory clearance, financing, and conditions precedent.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 270,
          basis:
            "Practitioner ranges; simple private deals close in weeks, while " +
            "deals requiring antitrust/foreign-investment clearance or carve-out " +
            "separation routinely run many months",
          label: "planning-range",
        },
        dataSource:
          "Deal timeline / legal close checklist — sign-to-close interval with " +
          "the gating conditions (regulatory, financing, CPs) tracked",
        whyItMatters:
          "Sign-to-close exposes the deal to value leakage, business " +
          "deterioration, and break risk. Extended timelines (regulatory or " +
          "carve-out separation) raise cost and risk and delay the start of the " +
          "integration clock on which synergies depend.",
      },
      {
        key: "portfolio_ebitda_growth_pct",
        name: "Portfolio EBITDA growth",
        definition:
          "Year-over-year organic EBITDA growth across the owned portfolio of " +
          "businesses, net of acquisitions and divestitures (like-for-like).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 15,
          basis:
            "Portfolio value-creation ranges; the band spans steady-state " +
            "compounders to active value-creation programs, and varies sharply by " +
            "sector and portfolio maturity",
          label: "planning-range",
        },
        dataSource:
          "Portfolio management reporting — like-for-like EBITDA by business " +
          "unit / portfolio company against prior period",
        whyItMatters:
          "Portfolio value creation, not just deal-making, is where a holding " +
          "company or programmatic acquirer earns its center. Sustained organic " +
          "EBITDA growth proves the value-creation plan is working rather than " +
          "returns coming only from leverage or multiple expansion.",
      },
      {
        key: "vcp_attainment_pct",
        name: "Value-creation-plan attainment",
        definition:
          "Share of the value-creation-plan (VCP) initiatives — across pricing, " +
          "commercial, cost, capital, and digital/AI levers — delivering their " +
          "targeted EBITDA / cash impact on schedule across the portfolio.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Value-creation practitioner ranges; disciplined VCP governance " +
            "lands the majority of initiatives, but a meaningful share stalls on " +
            "adoption, data, or management bandwidth",
          label: "planning-range",
        },
        dataSource:
          "Value-creation-plan governance tracker per portfolio company, " +
          "reconciled to realized EBITDA / cash impact",
        whyItMatters:
          "The forward-looking complement to portfolio EBITDA growth: it shows " +
          "whether the levers the center promised are actually being pulled and " +
          "are paying off, and where management support (not control) is needed " +
          "to unstick stalled initiatives.",
      },
      {
        key: "acquired_leadership_retention_pct",
        name: "Acquired-leadership retention",
        definition:
          "Share of key acquired leaders and identified critical talent retained " +
          "through a defined post-close window (commonly 12-24 months), against " +
          "the retention plan.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "PMI talent-retention ranges; founder/management-dependent " +
            "acquisitions sit at the high end of importance and the risky end of " +
            "outcomes, especially under heavy-handed integration",
          label: "planning-range",
        },
        dataSource:
          "HR / integration tracker — retention of named key leaders and " +
          "critical talent against the retention and earn-out plan",
        whyItMatters:
          "In most deals — and almost all in a decentralized holding model — the " +
          "people ARE the asset. Losing acquired leadership (often because " +
          "control was imposed where support was needed) destroys the thesis " +
          "faster than any synergy shortfall.",
      },
      {
        key: "thesis_tracked_to_outcome_pct",
        name: "Theses tracked to outcome",
        definition:
          "Share of closed deals whose original investment thesis and synergy " +
          "underwrite is formally tracked through to a post-close outcome review " +
          "(thesis confirmed / partially met / failed), versus deals never " +
          "looked back on.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "Corp-dev maturity ranges; disciplined acquirers review every thesis " +
            "to outcome to learn, while many organizations close deals and never " +
            "revisit whether the thesis held",
          label: "planning-range",
        },
        dataSource:
          "Deal post-mortem / lookback register linking each closed deal's thesis " +
          "and underwrite to a tracked outcome review",
        whyItMatters:
          "The discipline metric that compounds every other one. Organizations " +
          "that do not track theses to outcome repeat the same over-optimistic " +
          "synergy and thesis errors; tracking is how an acquirer actually gets " +
          "better at M&A over time.",
      },
      {
        key: "tsa_exit_on_time_pct",
        name: "TSA exit on-time (carve-outs)",
        definition:
          "Share of transition-service-agreement (TSA) services exited on or " +
          "ahead of the agreed schedule after a carve-out acquisition, versus " +
          "TSAs extended or running over.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Carve-out / separation practitioner ranges; well-run separations " +
            "exit most TSAs on plan, but standalone-capability gaps frequently " +
            "force costly extensions",
          label: "planning-range",
        },
        dataSource:
          "Separation management office TSA tracker — services exited on schedule " +
          "over total TSA services, with extension cost captured",
        whyItMatters:
          "For carve-outs, TSAs are an expensive umbilical to the seller and a " +
          "standing operational risk. On-time exit proves the acquired business " +
          "reached standalone capability; overrun TSAs bleed cost and signal an " +
          "under-resourced integration.",
      },
    ],

    painThemes: [
      {
        key: "thin_proprietary_pipeline",
        name: "Thin or non-proprietary deal pipeline",
        description:
          "The pipeline is shallow, reactive, and banker-driven rather than " +
          "thesis-driven and proprietary — so the team either misses its " +
          "deployment mandate or, worse, relents on price discipline to win " +
          "whatever auctioned assets are on offer.",
        detectionSignal:
          "Low pipeline coverage, deals arriving mostly via intermediaries/" +
          "auctions, no clear sector theses guiding sourcing, win rate driven by " +
          "highest bids rather than thesis fit.",
        diagnosticQuestion:
          "How many times over is your deployment target covered by qualified, " +
          "thesis-aligned opportunities, and what share of your pipeline is " +
          "proprietary versus banker-brought auctions?",
      },
      {
        key: "weak_thesis_overpayment",
        name: "Weak thesis discipline & overpayment",
        description:
          "Deals are justified by a narrative rather than a falsifiable thesis " +
          "with a pre-committed walk-away price, so the team talks itself into " +
          "auctions, anchors on the model it wants, and overpays — the single " +
          "largest source of M&A value destruction.",
        detectionSignal:
          "No documented walk-away price, synergy assumptions stretched to " +
          "justify the bid, deal champions emotionally committed, high win rate " +
          "in competitive processes, theses not revisited after close.",
        diagnosticQuestion:
          "For your last several deals, what was the pre-committed walk-away " +
          "price, and how often did the underwritten synergies grow to justify a " +
          "higher bid rather than the other way around?",
      },
      {
        key: "diligence_data_quality_gap",
        name: "Diligence constrained by data quality",
        description:
          "The binding constraint on diligence is the completeness and " +
          "reliability of a SELLER-CURATED data room, not analyst hours — the " +
          "real risks (customer concentration, churn, quality of earnings, " +
          "off-balance-sheet liabilities) hide in the gaps and in what the data " +
          "room omits.",
        detectionSignal:
          "Key data 'not available' or aggregated to hide concentration, QoE " +
          "adjustments large or contested, churn/cohort data missing, diligence " +
          "findings that surprise post-close, reliance on management " +
          "representations over source data.",
        diagnosticQuestion:
          "On your recent deals, where did the data room come up short, and which " +
          "post-close surprises trace back to data you could not actually verify " +
          "during diligence?",
      },
      {
        key: "synergy_overoptimism",
        name: "Systematically over-optimistic synergies",
        description:
          "Synergy estimates — revenue synergies above all — are systematically " +
          "over-optimistic, booked at full value into the underwrite and the " +
          "price, then under-delivered in integration; the gap is predictable " +
          "yet rarely haircut up front.",
        detectionSignal:
          "Synergies underwritten at full value with no haircut or phasing, " +
          "revenue synergies as large as cost synergies, no independent " +
          "validation, realization tracked loosely or not at all against the " +
          "original underwrite.",
        diagnosticQuestion:
          "What haircut and phasing do you apply to underwritten cost versus " +
          "revenue synergies, and what is your historical realization against the " +
          "FULL underwrite, not the revised target?",
      },
      {
        key: "integration_value_leakage",
        name: "Integration execution & value leakage",
        description:
          "Value is lost between close and full integration: a slow or " +
          "under-resourced integration management office, milestone slippage, " +
          "TSA overruns, culture clash, and distraction of the base business — " +
          "the place where most deals quietly fail to earn their price.",
        detectionSignal:
          "No empowered IMO, Day-1 readiness scrambled, milestones slipping, " +
          "TSAs extending, base-business performance dipping post-close, synergy " +
          "tracking disconnected from the deal model.",
        diagnosticQuestion:
          "Who runs your integration management office with what authority, and " +
          "how are integration milestones and synergy realization tracked back to " +
          "the original deal underwrite?",
      },
      {
        key: "talent_flight_post_close",
        name: "Acquired-talent flight & culture clash",
        description:
          "Key acquired leaders and critical talent — often the actual asset, " +
          "especially in founder-led or capability acquisitions — leave after " +
          "close because retention and culture were treated as afterthoughts or " +
          "because heavy-handed integration crushed what made the business " +
          "valuable.",
        detectionSignal:
          "No retention plan for named key people, earn-outs misaligned with " +
          "retention, rapid imposition of acquirer processes/systems, founder " +
          "disengagement, attrition spiking in the acquired business.",
        diagnosticQuestion:
          "Who are the named individuals whose departure would impair the thesis, " +
          "what is the retention and integration-pace plan for them, and how is " +
          "it tracked?",
      },
      {
        key: "control_vs_support_overreach",
        name: "Control overreach in a decentralized model",
        description:
          "In a decentralized holding model, the center imposes control — forced " +
          "integration, central mandates, replaced management, standardized " +
          "systems — where the value depended on autonomy, destroying the very " +
          "thing that made the business worth buying; the right lever is " +
          "capital-and-capability SUPPORT, not control.",
        detectionSignal:
          "Central mandates overriding local management, integration imposed " +
          "regardless of fit, acquired leaders losing decision rights, " +
          "value-creation framed as compliance rather than enablement, retention " +
          "and performance declining after central intervention.",
        diagnosticQuestion:
          "In your owned businesses, where is the center taking control versus " +
          "offering support, and can you point to value created by support that " +
          "would have been destroyed by imposing control?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_deal_sourcing_screening",
        name: "AI deal sourcing & screening",
        valueMechanism:
          "Continuously scan markets, filings, news, and proprietary signals " +
          "against codified investment theses to surface and pre-screen targets, " +
          "and to keep relationship/ownership data current — widening proprietary " +
          "coverage and focusing scarce origination time on thesis-fit " +
          "opportunities rather than reacting to banker flow. Honest caveat: this " +
          "improves coverage and qualification, it does not replace relationship " +
          "origination or thesis judgment, and signal quality varies by sector " +
          "data availability.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Codified investment theses / screening criteria by sector",
          "Market, filings, news, patent, and ownership/relationship data feeds",
          "Historical deal pipeline and outcome data for relevance tuning",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Screening output is a prioritized lead list — origination and thesis fit remain human judgment",
          "Signal quality and false positives vary by sector data availability and must be sampled",
          "Relationship-driven proprietary sourcing is not replaceable by scanning",
        ],
        metricsMoved: [
          "pipeline_coverage_ratio",
          "deal_win_rate",
        ],
      },
      {
        key: "ai_diligence_acceleration",
        name: "AI-assisted due diligence",
        valueMechanism:
          "Use LLMs and analytics on the data room to extract contract terms " +
          "(change-of-control, assignment, MFN), surface concentration and churn " +
          "patterns, reconcile quality-of-earnings adjustments, and flag gaps " +
          "and anomalies — compressing diligence cycle time while raising the " +
          "FLOOR on what gets reviewed. Honest caveat: AI cannot manufacture data " +
          "the seller withheld; the binding constraint is data-room quality, so " +
          "the gain is depth and speed on available data, not certainty about the " +
          "gaps where real risk hides.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Virtual data room contents (contracts, financials, customer/cohort data)",
          "Quality-of-earnings baseline and accounting policies",
          "A diligence question/issue taxonomy to structure extraction",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Extracted terms and findings must be human-validated before they inform price or terms",
          "AI cannot reveal data the seller omitted — gaps remain the analyst's responsibility to chase",
          "Hallucinated contract terms or misread financials carry real deal-price consequences",
        ],
        metricsMoved: [
          "diligence_cycle_time_days",
          "deal_irr_vs_underwrite_pp",
        ],
      },
      {
        key: "ai_synergy_validation",
        name: "Synergy estimation & haircut validation",
        valueMechanism:
          "Bring an outside-view, evidence-based discipline to synergy " +
          "estimates: benchmark proposed cost and revenue synergies against " +
          "comparable deals' realized outcomes, apply category-specific haircuts " +
          "and phasing, and stress-test the underwrite — explicitly countering " +
          "the systematic over-optimism (especially in revenue synergies) that " +
          "drives overpayment. The value is honest underwriting, not bigger " +
          "synergy numbers.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Proposed synergy build-up (cost and revenue) by initiative",
          "Comparable-deal realized-synergy and realization-rate reference data",
          "The deal model and target/acquirer financial baselines",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Synergy underwrite and walk-away price are deal-committee decisions, not model outputs",
          "Reference benchmarks must be honest about revenue-synergy under-delivery, not flattering",
          "Over-trusting any synergy number — model-derived or not — reintroduces the overpayment risk",
        ],
        metricsMoved: [
          "synergy_realization_pct",
          "deal_irr_vs_underwrite_pp",
        ],
      },
      {
        key: "ai_integration_pmi_orchestration",
        name: "Integration (PMI) tracking & orchestration",
        valueMechanism:
          "Instrument the integration management office: track Day-1/100-day " +
          "milestones, TSA exits, and synergy initiatives against the deal " +
          "model, predict at-risk milestones early, and reconcile realized " +
          "synergies to the underwrite — turning integration from a slideware " +
          "plan into a governed, early-warning execution engine where most deal " +
          "value is actually captured or lost.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Integration plan, milestones, TSA schedule, and synergy initiative baselines",
          "Operational and financial actuals from the integrating businesses",
          "The original deal model / underwrite to reconcile against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Integration decisions and resource trade-offs remain the IMO lead's accountability",
          "Synergy reconciliation must tie to validated actuals, not self-reported initiative status",
          "Early-warning flags inform intervention; they do not auto-execute integration changes",
        ],
        metricsMoved: [
          "integration_milestone_on_time_pct",
          "synergy_realization_pct",
          "tsa_exit_on_time_pct",
        ],
      },
      {
        key: "ai_portfolio_value_creation",
        name: "Portfolio value-creation analytics",
        valueMechanism:
          "Give the center a continuous, cross-portfolio view of value-creation " +
          "levers — pricing, commercial, cost, working capital, and digital/AI " +
          "opportunities — benchmarking businesses against each other and " +
          "peers, prioritizing VCP initiatives, and tracking attainment. In a " +
          "decentralized model this is SUPPORT (insight and benchmarking offered " +
          "to local management), explicitly NOT a control or compliance lever.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Standardized portfolio financial and operational KPIs by business",
          "Value-creation-plan initiative tracking per business",
          "Peer/benchmark reference data for the relevant sectors",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "In a decentralized model the analytics is support for local management, not a central mandate",
          "Cross-portfolio benchmarks must respect business-model differences, not force false comparability",
          "Pushing initiatives as control rather than support risks the autonomy that created the value",
        ],
        metricsMoved: [
          "portfolio_ebitda_growth_pct",
          "vcp_attainment_pct",
        ],
      },
      {
        key: "ai_valuation_scenario_modeling",
        name: "Valuation & scenario modeling",
        valueMechanism:
          "Stand up faster, more rigorous valuation and scenario analysis — " +
          "comparable-company and precedent-transaction screens, DCF sensitivity " +
          "and Monte-Carlo ranges, and bid/walk-away tradeoffs — so the deal " +
          "team reasons in ranges and pre-commits a walk-away price rather than " +
          "anchoring on a single number it wants to believe. The value is " +
          "discipline and speed, not a 'right' price the model invents.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Comparable-company and precedent-transaction reference data",
          "Target and acquirer financial baselines and the deal structure",
          "Risk/sensitivity assumptions and the financing/return hurdle",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Valuation outputs are decision inputs; the bid and walk-away price are committee decisions",
          "Scenario ranges must be presented honestly, not collapsed to a single comforting point estimate",
          "Garbage comparables or stretched assumptions produce confident but wrong valuations",
        ],
        metricsMoved: [
          "deal_win_rate",
          "deal_irr_vs_underwrite_pp",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "thesis_driven_origination_engine",
        name: "Thesis-driven origination & pipeline engine",
        description:
          "A codified set of sector investment theses driving proactive, " +
          "proprietary sourcing through a deal/CRM pipeline system, augmented by " +
          "AI scanning and relationship intelligence — so coverage is built " +
          "around where the firm has an edge and a thesis, not around whatever " +
          "bankers bring to auction.",
        boundary:
          "Owns sourcing, screening, and pipeline qualification up to LOI; does " +
          "not own the relationship-origination judgment or the deal-committee " +
          "decision — it focuses and prioritizes human origination, it does not " +
          "replace it.",
        humanAccountabilityPoint: "Head of Corporate Development / Origination",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "disciplined_diligence_underwriting",
        name: "Disciplined diligence & underwriting platform",
        description:
          "A structured diligence and underwriting platform — workstream " +
          "tracker, AI-assisted data-room review, quality-of-earnings rigor, and " +
          "a synergy build-up with explicit haircuts, phasing, and a " +
          "pre-committed walk-away price — that institutionalizes thesis " +
          "discipline and treats data-room quality as the binding constraint to " +
          "be actively probed.",
        boundary:
          "Owns the diligence process, the underwrite, and the walk-away " +
          "recommendation; does not own the final bid decision (the deal " +
          "committee does) or manufacture data the seller withheld — it makes the " +
          "underwrite honest and the gaps explicit.",
        humanAccountabilityPoint: "Deal Lead / Investment Committee",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "integration_management_office",
        name: "Integration management office (IMO) with synergy tracking",
        description:
          "An empowered IMO that owns the Day-1/100-day/full-integration plan, " +
          "milestone delivery, TSA exits, and synergy realization tracked " +
          "back to the deal model — with AI early-warning on at-risk milestones " +
          "and synergy reconciliation to validated actuals, recognizing that " +
          "this is where most deal value is captured or lost.",
        boundary:
          "Owns integration planning, milestone delivery, and synergy " +
          "reconciliation; does not own the operating P&L of the integrating " +
          "businesses (their management does) or the original underwrite — it " +
          "executes and tracks against the deal that was approved.",
        humanAccountabilityPoint: "Integration Management Office (IMO) Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "portfolio_value_creation_office",
        name: "Portfolio value-creation office (support, not control)",
        description:
          "A center-led value-creation capability that offers owned businesses " +
          "capital, capabilities, benchmarking, and prioritized VCP support — " +
          "and, in a decentralized holding model, deliberately operates as an " +
          "enablement function rather than a control tower, preserving the " +
          "autonomy and leadership that made each business worth owning while " +
          "still tracking portfolio EBITDA growth and VCP attainment.",
        boundary:
          "Owns cross-portfolio benchmarking, VCP prioritization support, and " +
          "capability provision; does not own (in the decentralized model) the " +
          "operating decisions of the businesses — it supports local management " +
          "with capital and capabilities, it does not take control.",
        humanAccountabilityPoint: "Head of Portfolio / Value Creation (with business CEOs)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "M&A value compounds — or evaporates — in a strict order: THESIS " +
        "DISCIPLINE, then DILIGENCE TRUTH, then INTEGRATION. The largest, most " +
        "controllable source of value is NOT a clever deal; it is not " +
        "OVERPAYING — a disciplined, falsifiable thesis with a pre-committed " +
        "walk-away price prevents the auction-driven overpayment that destroys " +
        "more value than any execution misstep. Second, diligence value is " +
        "bounded by data quality: the gain from faster, AI-assisted diligence is " +
        "depth and speed on AVAILABLE data, never certainty about the gaps where " +
        "real risk (customer concentration, churn, quality of earnings, hidden " +
        "liabilities) hides in a seller-curated room — so diligence value must be " +
        "framed as risk reduction, not risk elimination. Third, integration is " +
        "where synergies are actually realized; cost synergies land at the high " +
        "end and early, revenue synergies systematically under-deliver and late, " +
        "so synergy value MUST be haircut and phased at underwrite, not assumed " +
        "in full. Portfolio value creation rides on the same data — and in a " +
        "decentralized holding model the dominant honesty discipline is that " +
        "CONTROL levers often destroy the value SUPPORT would have created: the " +
        "people and autonomy are frequently the asset, and forcing integration or " +
        "central mandates can erase the thesis. The blunt field truth that " +
        "governs every number here: most deals underperform their underwrite, so " +
        "value is sized as a planning range centered honestly below the model, " +
        "with explicit haircuts, not as the deal champion's case.",
      dominantHaircutFactors: [
        {
          factor: "Revenue-synergy over-optimism",
          rationale:
            "Revenue synergies (cross-sell, pricing, share gains) are the most " +
            "systematically over-estimated and slowest to realize — they depend " +
            "on customer behavior and execution outside the firm's control — so " +
            "they must carry the deepest haircut, far more than cost synergies.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "PMI outcome studies showing revenue synergies routinely realize " +
              "at a fraction of underwrite, much lower than cost synergies",
            label: "planning-range",
          },
        },
        {
          factor: "Cost-synergy slippage & dis-synergy",
          rationale:
            "Cost synergies are more reliable than revenue synergies but still " +
            "slip on timing, one-time-to-achieve costs, and dis-synergies " +
            "(stranded costs, lost scale) that the gross estimate ignores, so " +
            "even the 'safe' synergies need a haircut and phasing.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Observed gap between gross cost-synergy estimates and net realized " +
              "savings after cost-to-achieve, timing slippage, and dis-synergy",
            label: "planning-range",
          },
        },
        {
          factor: "Diligence data-quality gaps (hidden risk)",
          rationale:
            "A seller-curated data room hides concentration, churn, " +
            "quality-of-earnings, and contingent-liability risk in its gaps; " +
            "value premised on the rosy data must be discounted for what could " +
            "not be verified, because hidden risk surfaces post-close.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Range reflecting how often post-close surprises trace to data " +
              "that diligence could not verify in a seller-curated room",
            label: "planning-range",
          },
        },
        {
          factor: "Integration execution & milestone slippage",
          rationale:
            "Synergies have a present value tied to WHEN they land; integration " +
            "milestone slippage, TSA overruns, and base-business distraction " +
            "delay and erode realization, so forward synergy value must be " +
            "discounted for execution risk and phasing, not booked at Day 1.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed integration slippage delaying synergy realization and " +
              "eroding its present value relative to the underwrite timeline",
            label: "planning-range",
          },
        },
        {
          factor: "Talent flight & control-overreach in the decentralized model",
          rationale:
            "When the people and autonomy are the asset, acquired-leadership " +
            "departure — often triggered by heavy-handed integration or central " +
            "control where support was needed — destroys thesis value; the " +
            "realizable prize is discounted for retention and culture risk.",
          typicalHaircut: {
            low: 0.1,
            high: 0.5,
            basis:
              "Wide range reflecting how decisively acquired-talent flight and " +
              "control-overreach can impair a people-dependent thesis",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Overpayment avoidance (walk-away discipline)",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Value preserved by a pre-committed walk-away price versus " +
              "auction-driven bids — the largest controllable M&A value lever",
            label: "planning-range",
          },
          measuredAs:
            "Purchase-price discipline relative to the value-destroying bid " +
            "(improves deal_irr_vs_underwrite and is reflected in deal_win_rate)",
        },
        {
          lever: "Cost-synergy realization (net of cost-to-achieve)",
          range: {
            low: 0.6,
            high: 0.9,
            basis:
              "Net cost-synergy realization against underwrite after " +
              "cost-to-achieve, timing, and dis-synergy — the more reliable " +
              "synergy class",
            label: "planning-range",
          },
          measuredAs:
            "Realized net cost synergies over underwritten cost synergies " +
            "(component of synergy_realization_pct)",
        },
        {
          lever: "Revenue-synergy realization",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Revenue-synergy realization against underwrite — systematically " +
              "lower and later than cost synergies",
            label: "planning-range",
          },
          measuredAs:
            "Realized revenue synergies over underwritten revenue synergies " +
            "(component of synergy_realization_pct)",
        },
        {
          lever: "Portfolio value-creation-plan uplift (EBITDA)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "EBITDA uplift attributable to value-creation-plan levers over the " +
              "hold period across the portfolio, where support is the operating " +
              "model",
            label: "planning-range",
          },
          measuredAs:
            "Relative EBITDA uplift from VCP initiatives (tracks " +
            "portfolio_ebitda_growth_pct and vcp_attainment_pct)",
        },
      ],
      timeToValueBand:
        "Thesis discipline and walk-away rigor: immediate on the next deal — " +
        "the fastest, cheapest value lever. AI sourcing/screening coverage: 1-2 " +
        "quarters to stand up, compounding as theses are codified. Diligence " +
        "acceleration: realized per-deal once tooling and taxonomy exist. " +
        "Synergy capture through integration: phased over 12-36 months post-close " +
        "(cost synergies earlier, revenue synergies later and partial). Portfolio " +
        "value-creation-plan uplift: a multi-year hold-period program. The honest " +
        "frame: deal-level value is realized over the integration and hold " +
        "horizon, not at signing, and most deals take longer and deliver less " +
        "than the underwrite assumed.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Deal pipeline / relationship system (CRM)",
          role:
            "System of record for sourcing, the deal pipeline by stage, " +
            "relationships, and win/loss outcomes — the origination and " +
            "qualification backbone.",
          examples: ["DealCloud", "Affinity", "Salesforce (corp-dev configured)", "Intapp DealCloud"],
        },
        {
          name: "Virtual data room (VDR)",
          role:
            "The controlled repository of the target's diligence materials " +
            "(contracts, financials, customer data) — the seller-curated source " +
            "diligence works from and probes for gaps.",
          examples: ["Datasite", "Intralinks", "Ansarada", "Firmex"],
        },
        {
          name: "Deal / valuation model",
          role:
            "The underwrite of record — valuation, financing, synergy build-up, " +
            "haircuts, and return (IRR/MOIC) — against which the deal is approved " +
            "and later measured.",
          examples: ["Excel-based deal models", "Mosaic / Cube (modeling)", "Quantrix", "FP&A / EPM platforms"],
        },
        {
          name: "Integration management office (IMO) tracker",
          role:
            "System of record for the integration plan, milestones, TSA " +
            "schedule, and synergy realization tracked back to the deal model.",
          examples: ["Smartsheet / MS Project (IMO)", "Midaxo", "DealRoom", "Asana / Monday (PMI boards)"],
        },
        {
          name: "Portfolio management & value-creation reporting",
          role:
            "Cross-portfolio financial/operational KPI reporting and " +
            "value-creation-plan tracking by business — the center's view of " +
            "owned-business performance.",
          examples: ["Power BI / Tableau portfolio dashboards", "Cobalt LP / portfolio platforms", "Workiva", "EPM / consolidation systems"],
        },
      ],
      roles: [
        {
          title: "Head of Corporate Development / M&A",
          accountability:
            "The end-to-end inorganic agenda — sourcing strategy, deal " +
            "execution, the deal committee process, and the discipline that " +
            "prevents overpayment.",
        },
        {
          title: "Chief Financial Officer / Chief Investment Officer",
          accountability:
            "Capital allocation, the deal committee and walk-away discipline, " +
            "the return underwrite, and the board-level view of the inorganic " +
            "and portfolio agenda.",
        },
        {
          title: "Deal Lead / Diligence Lead",
          accountability:
            "Running diligence and the underwrite for a specific deal — synergy " +
            "build-up with haircuts, the walk-away recommendation, and surfacing " +
            "the data-room gaps.",
        },
        {
          title: "Integration Management Office (IMO) Lead",
          accountability:
            "Day-1 readiness, the integration plan and milestones, TSA exits, " +
            "and synergy realization tracked to the deal model.",
        },
        {
          title: "Head of Portfolio / Value Creation",
          accountability:
            "Cross-portfolio value-creation plans, benchmarking, and " +
            "capital/capability support to owned businesses — as support, not " +
            "control, in a decentralized model.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Antitrust / merger control (HSR, EU, and global regimes)",
          relevance:
            "Deals above thresholds require pre-merger notification and " +
            "clearance; antitrust risk gates time-to-close, deal structure, and " +
            "occasionally remedies/divestitures — a primary execution risk.",
        },
        {
          name: "Foreign-investment review (CFIUS and equivalents)",
          relevance:
            "Cross-border deals touching sensitive sectors face national-" +
            "security review that can delay, condition, or block a transaction; " +
            "it must be assessed in diligence and the timeline.",
        },
        {
          name: "Securities disclosure & insider-trading controls",
          relevance:
            "Material non-public deal information triggers disclosure " +
            "obligations and strict insider-trading and information-barrier " +
            "controls throughout sourcing, diligence, and execution.",
        },
        {
          name: "Purchase accounting & disclosure (ASC 805 / IFRS 3)",
          relevance:
            "Business-combination accounting governs purchase-price allocation, " +
            "goodwill, and contingent consideration; the deal model and " +
            "post-close reporting must align to it and to subsequent goodwill-" +
            "impairment testing.",
        },
      ],
      canonicalTerms: [
        {
          term: "Investment thesis",
          definition:
            "The falsifiable rationale for a deal — why this asset, at this " +
            "price, creates value — against which diligence is run and outcomes " +
            "are later tracked.",
        },
        {
          term: "Quality of earnings (QoE)",
          definition:
            "A diligence analysis that normalizes reported earnings (removing " +
            "one-offs, adjusting accounting choices) to find the sustainable " +
            "earnings base the price should be set against.",
        },
        {
          term: "Synergy (cost vs revenue)",
          definition:
            "The incremental value from combining businesses — cost synergies " +
            "(savings) are more reliable and earlier; revenue synergies " +
            "(cross-sell, pricing) are systematically over-estimated and later.",
        },
        {
          term: "Walk-away price",
          definition:
            "The pre-committed maximum price above which the deal destroys " +
            "value and the team walks — the core discipline that prevents " +
            "auction-driven overpayment.",
        },
        {
          term: "PMI (post-merger integration)",
          definition:
            "The post-close program — Day-1, 100-day, and full integration — " +
            "that captures synergies and stabilizes the combined business; where " +
            "most deal value is realized or lost.",
        },
        {
          term: "TSA (transition services agreement)",
          definition:
            "A temporary agreement under which a seller provides services to a " +
            "carved-out business until it reaches standalone capability; a cost " +
            "and risk to exit on schedule.",
        },
        {
          term: "Value-creation plan (VCP)",
          definition:
            "The portfolio-level plan of pricing, commercial, cost, capital, " +
            "and digital/AI levers used to grow EBITDA and cash in an owned " +
            "business over the hold period.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Investment thesis and price discipline",
        authoritativeSource:
          "The deal model / underwrite of record and the deal-committee " +
          "decision memo, including the documented walk-away price",
        whatGoodEvidenceLooksLike:
          "A falsifiable thesis with explicit value drivers, a pre-committed " +
          "walk-away price, synergies built up with haircuts and phasing, and a " +
          "return (IRR/MOIC) underwrite the committee approved.",
        weakEvidenceToReject:
          "A narrative rationale with no walk-away price, synergies grown to " +
          "justify the bid, and a single 'right' valuation number with no range " +
          "or sensitivity.",
      },
      {
        claim: "Diligence findings and data-quality",
        authoritativeSource:
          "The diligence workstream reports (financial/QoE, commercial, legal, " +
          "tax, tech, HR) and the virtual data room with its noted gaps",
        whatGoodEvidenceLooksLike:
          "Source-data-backed findings on customer concentration, churn/cohort " +
          "behavior, quality of earnings, and contingent liabilities, with the " +
          "data-room gaps and unverifiable items explicitly listed.",
        weakEvidenceToReject:
          "Findings resting on management representations, aggregated data that " +
          "masks concentration, or a clean diligence summary with no statement " +
          "of what could not be verified.",
      },
      {
        claim: "Synergy realization vs underwrite",
        authoritativeSource:
          "The integration management office (IMO) synergy tracker reconciled to " +
          "the deal-model baseline and to validated ledger actuals",
        whatGoodEvidenceLooksLike:
          "Realized cost and revenue synergies separately, measured against the " +
          "ORIGINAL underwrite (not a revised target), tied to validated " +
          "actuals, with cost-to-achieve and timing shown.",
        weakEvidenceToReject:
          "Blended synergy realization against a quietly revised-down target, " +
          "self-reported initiative status with no ledger reconciliation, or " +
          "revenue synergies asserted at full value.",
      },
      {
        claim: "Deal outcome vs underwrite (IRR/MOIC)",
        authoritativeSource:
          "The post-close deal performance review / thesis-lookback register " +
          "against the approved deal model",
        whatGoodEvidenceLooksLike:
          "Realized or marked IRR and MOIC versus the underwritten return, with " +
          "the thesis explicitly judged confirmed/partial/failed and the drivers " +
          "of the gap attributed.",
        weakEvidenceToReject:
          "A deal declared a success with no comparison to its own underwrite, " +
          "or a thesis never revisited after close.",
      },
      {
        claim: "Portfolio value creation and VCP attainment",
        authoritativeSource:
          "Portfolio management reporting and the value-creation-plan governance " +
          "tracker per business, reconciled to realized EBITDA/cash",
        whatGoodEvidenceLooksLike:
          "Like-for-like EBITDA growth net of M&A, VCP initiative attainment by " +
          "lever, and — in a decentralized model — evidence the gains came via " +
          "support rather than imposed control.",
        weakEvidenceToReject:
          "Portfolio 'growth' that is really acquisition or leverage, or VCP " +
          "attainment self-reported with no reconciliation to EBITDA/cash.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How many times over is your deployment target covered by qualified, thesis-aligned opportunities, and what share of your pipeline is proprietary versus banker-brought auctions?",
      "For your last several deals, what was the pre-committed walk-away price, and how often did the underwritten synergies grow to justify a higher bid rather than the other way around?",
      "On recent deals, where did the seller-curated data room come up short, and which post-close surprises trace back to data you could not actually verify during diligence?",
      "What haircut and phasing do you apply to underwritten cost versus revenue synergies, and what is your historical realization against the FULL underwrite, not a revised-down target?",
      "Who runs your integration management office with what authority, and how are integration milestones and synergy realization tracked back to the original deal underwrite?",
      "Who are the named individuals whose departure would impair the thesis, and what is the retention and integration-pace plan for them?",
      "In your owned businesses, where is the center taking control versus offering capital-and-capability support — and can you point to value support created that control would have destroyed?",
      "What share of your closed deals have their original thesis and underwrite formally tracked through to a post-close outcome review?",
    ],
    maturitySignals: [
      "Sourcing is driven by codified sector theses and a proprietary pipeline, with coverage measured against the deployment mandate rather than reacting to banker flow.",
      "Every deal carries a documented, pre-committed walk-away price, and synergies are underwritten with explicit haircuts and phasing — cost and revenue separated.",
      "Diligence explicitly treats data-room quality as the constraint, listing what could not be verified, and post-close surprises are rare.",
      "An empowered IMO tracks integration milestones, TSA exits, and synergy realization back to the original deal model and validated actuals.",
      "Every closed deal's thesis is tracked to outcome in a lookback register, and the learning visibly improves subsequent underwriting.",
      "In the decentralized model, the center operates as a value-creation SUPPORT function — capital, capabilities, benchmarking — preserving acquired autonomy and leadership.",
    ],
    redFlags: [
      "Deals are justified by narrative with no pre-committed walk-away price, and synergies grow to justify the bid — the classic overpayment pattern.",
      "Synergies — especially revenue synergies — are underwritten at full value with no haircut or phasing, and realization is tracked loosely against a revised-down target, if at all.",
      "Diligence relies on management representations and aggregated data that masks concentration/churn, and post-close surprises recur — data-quality gaps are not actively probed.",
      "Integration runs without an empowered IMO; milestones slip, TSAs extend, and synergy tracking is disconnected from the original deal model.",
      "Acquired key leaders leave after close because retention and culture were afterthoughts, or because central control was imposed where support was needed.",
      "Closed theses are never revisited, so the same over-optimistic synergy and overpayment errors repeat deal after deal.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "DealCloud (Intapp) / Affinity",
        category: "Deal pipeline & relationship intelligence (CRM)",
        switchingCost:
          "High — pipeline history, relationship graphs, and proprietary deal data accrete and become the origination memory of the firm; migrating loses institutional context.",
        renewalDynamics:
          "Per-seat subscription; relationship-data network effects and integrations are the stickiness, and relationship-intelligence upsell is the growth hook.",
      },
      {
        vendorName: "Datasite / Intralinks / Ansarada",
        category: "Virtual data room (VDR) & deal lifecycle",
        switchingCost:
          "Low-to-moderate per deal — VDRs are largely deal-scoped, so switching at the next deal is feasible; lock-in comes from analytics/AI features and enterprise agreements.",
        renewalDynamics:
          "Per-deal or enterprise-volume pricing; AI diligence/redaction features and predictable deal volume drive enterprise commitments and discounting leverage.",
      },
      {
        vendorName: "Midaxo / DealRoom / Smartsheet (IMO)",
        category: "Diligence workflow & integration management (PMI)",
        switchingCost:
          "Moderate — playbooks, templates, and in-flight integration plans embed; switching mid-program is disruptive, between deals less so.",
        renewalDynamics:
          "Subscription pricing; playbook libraries and IMO standardization create stickiness, and frequency of deal activity sets the value case at renewal.",
      },
      {
        vendorName: "Quality-of-earnings & diligence advisors (Big Four, specialist firms)",
        category: "Financial/QoE, tax, and commercial diligence services",
        switchingCost:
          "Low per engagement — advisors are contracted per deal — but relationship continuity and sector knowledge create soft preference.",
        renewalDynamics:
          "Per-deal fees scaled to deal size/complexity; panel arrangements and volume discipline fees, and competition among firms is the primary lever.",
      },
      {
        vendorName: "Valuation / market-data & comparables providers",
        category: "Comparable-company, precedent-transaction, and market data",
        switchingCost:
          "Moderate — analysts standardize on a data source and its identifiers; migration means re-tooling models and re-training, but alternatives exist.",
        renewalDynamics:
          "Seat/data-subscription pricing; bundled enterprise terms and analyst familiarity create stickiness, with competing providers as the lever.",
      },
    ],
    switchingCosts:
      "The durable lock-in in corp-dev tooling is the accumulated PROPRIETARY DATA and institutional memory — the pipeline history and relationship graph in the deal CRM, and the playbooks/templates in the diligence and IMO tools — far more than the applications themselves. VDRs and advisory engagements are largely deal-scoped and therefore contestable at each new deal, so the negotiable frontier is: protect data-export and relationship-data portability on the CRM; keep VDR and advisory work competitively bid per deal; and standardize playbooks in a portable form rather than vendor-locked.",
    negotiationLevers: [
      "Tie deal-CRM commitments to data-export and relationship-data portability rights so origination memory is not hostage to the vendor",
      "Competitively bid VDRs and diligence advisors per deal (they are largely deal-scoped) rather than defaulting to an incumbent",
      "Bundle predictable annual deal volume into enterprise VDR/IMO pricing to earn volume discounts while preserving per-deal flexibility",
      "Panel and discipline QoE/diligence advisory fees through multi-firm competition and scope-capped engagements",
      "Keep integration playbooks and templates in a portable, vendor-neutral form so the IMO tool can be changed between programs",
      "Use AI-diligence and AI-sourcing feature claims as negotiation hooks but gate pricing on validated, sampled accuracy rather than vendor assertions",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      thesis_price_claim: [
        "documented investment thesis with value drivers",
        "pre-committed walk-away price",
        "return underwrite (IRR/MOIC) approved by the deal committee",
      ],
      diligence_finding_claim: [
        "source-data-backed workstream finding (not management representation)",
        "explicit list of data-room gaps / unverifiable items",
        "quality-of-earnings normalization basis",
      ],
      synergy_claim: [
        "cost and revenue synergies separated, each with haircut and phasing",
        "realization measured against the ORIGINAL underwrite, not a revised target",
        "reconciliation to validated ledger actuals (cost-to-achieve shown)",
      ],
      deal_outcome_claim: [
        "realized/marked IRR and MOIC versus the approved underwrite",
        "thesis judged confirmed/partial/failed with gap attribution",
        "post-close lookback register reference",
      ],
      portfolio_value_claim: [
        "like-for-like EBITDA growth net of M&A and leverage",
        "VCP initiative attainment reconciled to realized EBITDA/cash",
        "evidence of support-versus-control in the decentralized model",
      ],
      value_projection: [
        "benchmark planning-range",
        "explicit haircut factors (revenue-synergy, cost-synergy slippage, data-quality, integration, talent/control)",
        "honest centering below the underwrite, not the deal champion's case",
      ],
    },
    citationStandard:
      "Quantitative M&A claims cite the system-of-record artifact and the deal: " +
      "the deal model / committee memo for thesis and price, the diligence " +
      "workstream reports and VDR for findings, the IMO synergy tracker for " +
      "realization, and the post-close lookback for outcome. Synergy claims MUST " +
      "separate cost from revenue synergies, cite haircut and phasing, and " +
      "measure realization against the ORIGINAL underwrite rather than a revised-" +
      "down target. Diligence claims cite source data and explicitly name the " +
      "data-room gaps and unverifiable items. Value projections cite a labelled " +
      "planning range, the haircut factors applied (revenue-synergy over-" +
      "optimism, cost-synergy slippage, data-quality gaps, integration slippage, " +
      "talent/control risk), and are centered honestly below the underwrite — " +
      "never the deal champion's full-value case asserted as fact.",
  },

  hedgeRules: {
    whenToHedge: [
      "Synergies are quoted at full value without separating cost from revenue or applying a haircut — reframe with category-specific haircuts and phasing, flagging revenue-synergy over-optimism.",
      "Deal value or returns are stated at the underwrite — note that most deals underperform plan and center the expectation honestly below the model.",
      "Diligence is presented as having de-risked the deal — flag that a seller-curated data room caps certainty and name the unverifiable gaps as residual risk.",
      "A decentralized-model recommendation leans on control levers (forced integration, central mandates) — flag that control often destroys the value support would create when the people/autonomy are the asset.",
      "Vendor or advisor outcome claims (AI sourcing/diligence accuracy, advisor synergy estimates) are cited — mark as provider claims pending sampled validation and tenant track record.",
    ],
    inferenceLanguage: [
      "Across acquirers at this scale, revenue synergies typically realize at a fraction of underwrite while cost synergies realize higher and earlier...",
      "Without your historical realization against the original underwrite, the industry pattern suggests blending synergy realization well below 100%...",
      "Most deals underperform their underwrite, so as a planning range rather than your measured outcome...",
      "Treating diligence as risk reduction rather than risk elimination, given a seller-curated data room...",
      "In a decentralized holding model the industry lesson is that support, not control, preserves the value — without your data this is the pattern, not your result...",
    ],
    flagWithoutEvidence: [
      "A specific synergy or deal-return figure for this tenant without separation, haircut, and reconciliation to the original underwrite",
      "A claim that diligence eliminated (rather than reduced) deal risk without naming the data-room gaps",
      "This tenant's actual realization, win rate, IRR-vs-underwrite, or VCP attainment without the system-of-record source",
      "A revenue-synergy estimate asserted at or near full value as if it were a measured outcome",
      "A control-driven integration recommendation in a decentralized model presented as value-creating without retention/autonomy evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "synergy underwrite to realization / where do synergies leak from full value to realized",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross underwritten synergies through revenue-synergy, cost-synergy, integration-slippage, and data-quality haircuts to honestly realized synergy value.",
    },
    {
      questionPattern:
        "deal scorecard / where do we stand vs planning ranges across the M&A lifecycle",
      exhibitKind: "table",
      note: "Pipeline coverage, win rate, diligence cycle time, synergy realization, integration milestone on-time, IRR/MOIC vs underwrite, time-to-close, portfolio EBITDA growth, VCP attainment, retention, theses tracked vs planning ranges.",
    },
    {
      questionPattern:
        "valuation sensitivity / what range of price still clears the return hurdle and where is walk-away",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of deal-return sensitivity to the key assumptions (revenue synergy, cost synergy, multiple, integration cost) to locate the walk-away price.",
    },
    {
      questionPattern:
        "integration plan sequence / Day-1, 100-day, TSA exits and synergy waves over time",
      exhibitKind: "chart",
      chartKind: "swimlane",
      note: "Sequence integration workstreams, TSA exits, and synergy initiatives by period, making milestone dependencies and the synergy-realization clock visible.",
    },
    {
      questionPattern:
        "portfolio value-creation levers / EBITDA bridge across the value-creation plan",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall of portfolio EBITDA from baseline through pricing, commercial, cost, and digital/AI VCP levers to the target, with attainment and support-not-control framing.",
    },
    {
      questionPattern:
        "thesis lookback / which closed theses were confirmed, partial, or failed and what drove the gap",
      exhibitKind: "table",
      note: "Per closed deal: original thesis, underwritten IRR/MOIC, realized outcome, thesis verdict (confirmed/partial/failed), and the attributed drivers of the gap.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Hard thesis discipline with a pre-committed walk-away price — the single largest controllable value lever, because not overpaying beats clever execution",
      "Treating diligence data-room quality as the binding constraint and actively probing the gaps, so hidden concentration/churn/QoE risk surfaces before close, not after",
      "Underwriting synergies with honest, category-specific haircuts and phasing — deep on revenue synergies — and an empowered IMO that tracks realization to the original model",
      "In the decentralized model, operating as capital-and-capability SUPPORT rather than control, preserving the acquired leadership and autonomy that make businesses worth owning",
    ],
    failureDrivers: [
      "Overpaying — talking into an auction with no walk-away price and synergies stretched to justify the bid — the dominant source of M&A value destruction",
      "Booking synergies (revenue synergies especially) at full value with no haircut, then under-delivering and tracking against a quietly revised-down target",
      "Under-resourcing integration — no empowered IMO, slipping milestones, TSA overruns, base-business distraction — so synergies are delayed and lost",
      "Imposing control where support was needed, triggering acquired-leadership flight and erasing the people-dependent thesis — and never tracking theses to outcome to learn",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Discipline practices — walk-away pricing, synergy haircuts, thesis " +
      "lookbacks — adopt fastest because they are process changes the deal " +
      "committee can mandate immediately, though they meet cultural resistance " +
      "from deal champions invested in their cases. AI sourcing/screening and " +
      "AI-assisted diligence adopt next as efficiency aids that augment scarce " +
      "analyst capacity. Integration and portfolio value-creation analytics " +
      "adopt more slowly because they require cross-business data standardization " +
      "and, in a decentralized model, the trust of local management — which is " +
      "earned through support, not imposed. The decisive barrier throughout is " +
      "cultural: institutional honesty about over-optimism and a willingness to " +
      "walk away.",
    roiClarity: "medium",
    roiClarityBasis:
      "M&A ROI clarity is split. Process-discipline value — overpayment " +
      "avoidance, cost-synergy realization, integration milestone delivery — is " +
      "measurable against the deal model and the ledger, so its clarity is " +
      "reasonably high. But the headline prize is genuinely soft: revenue " +
      "synergies are systematically over-estimated and hard to attribute, deal " +
      "outcomes are confounded by market and execution factors, and most deals " +
      "underperform their underwrite, so any single ROI number flatters. " +
      "Attribution in a decentralized portfolio (support versus the business's " +
      "own efforts) is harder still. Net clarity is medium, which is exactly why " +
      "the evidence and hedge rules force synergy separation, haircuts, " +
      "realization-against-original-underwrite, and honest centering below plan " +
      "rather than asserted returns.",
  },

  regulatoryFrame: {
    name: "Merger control, foreign-investment review, securities & purchase accounting",
    relevance:
      "Corporate development operates inside a dense external-control frame: " +
      "deals above thresholds require antitrust/merger-control clearance (HSR, " +
      "EU, and global regimes) that gates time-to-close and structure; cross-" +
      "border deals in sensitive sectors face foreign-investment review (CFIUS " +
      "and equivalents); material non-public deal information triggers securities-" +
      "disclosure and insider-trading/information-barrier controls throughout the " +
      "process; and business-combination accounting (ASC 805 / IFRS 3) governs " +
      "purchase-price allocation, goodwill, and contingent consideration plus " +
      "subsequent impairment testing. AI in sourcing, diligence, valuation, and " +
      "integration is decision support inside these controls, not a substitute " +
      "for legal clearance, committee approval, or accounting judgment (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
