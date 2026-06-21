// Consilium expert — Chemicals & Process Manufacturing: Process Operations.
//
// W3 industry-function ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// Mirrors the depth bar of the energy-grid-operations and manufacturing-operations
// exemplars, but scoped to CONTINUOUS / BATCH PROCESS manufacturing — bulk &
// specialty chemicals, petrochemicals, polymers, industrial gases — NOT discrete
// assembly. The unit of production is a stream of material through reactors,
// columns, and heat-exchange trains, not a part through a line.
//
// CORE DOCTRINE — four honest bounding truths are baked into the content:
// (1) FEEDSTOCK + ENERGY ARE THE MARGIN, AND PRICE IS NOT YOURS. Variable cost
//     (hydrocarbon/feedstock + energy) dominates the cost stack and commodity
//     margin is cyclical and set by the market. You do not control price — you
//     control YIELD (conversion/selectivity), RELIABILITY (on-stream time), and
//     ENERGY INTENSITY. Sizing AI value on "margin uplift" instead of yield,
//     reliability, and energy is the most common over-promise here.
// (2) UNPLANNED DOWNTIME + ASSET INTEGRITY IS THE EXISTENTIAL OPERATIONAL RISK.
//     A continuous plant earns only when it runs; an unplanned trip costs days of
//     production plus restart, and a loss-of-containment event is a process-safety
//     and environmental catastrophe. On-stream factor and mechanical integrity are
//     the dominant defensible levers — and process safety is NON-NEGOTIABLE, never
//     a throughput trade-off.
// (3) APC + RELIABILITY ARE THE REAL VALUE LEVERS, BUT GATED BY DATA + THE OT/IT
//     DIVIDE. Advanced process control, soft sensors, and predictive integrity
//     live or die on historian/DCS data quality, sensor health, and lab-to-online
//     reconciliation. Until that substrate is trustworthy, model accuracy collapses
//     regardless of algorithm — the single largest haircut.
// (4) AI IS BOUNDED BY THE SAFETY-INSTRUMENTED SYSTEM AND HUMAN ACCOUNTABILITY.
//     The SIS / interlocks / relief systems are independent protection layers that
//     AI must never override or sit inside. Optimization advises and the board/
//     panel operator commits; autonomy that crosses the SIS boundary is not
//     realizable and must not be promised. Decarbonizing Scope-1 process emissions
//     is capital-heavy and slow — honest, not a quick AI win.

import type {
  ExpertPack,
  ExpertPackIdentity,
} from "@/lib/intelligence/expert-pack/expert-pack";

export const chemicalsProcessOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.chemicals.process-operations",
    expertName: "Chemicals Process Operations Expert",
    kind: "industry-function",
    industry: "chemicals",
    functionKey: "process-operations",
    scopeNote:
      "Continuous and batch PROCESS manufacturing operations for bulk, " +
      "specialty, and petrochemicals (refining-adjacent, polymers, industrial " +
      "gases): on-stream reliability and asset integrity, reactor/column yield " +
      "and selectivity, advanced process control (APC) and process " +
      "optimization, energy and feedstock intensity, process-safety management " +
      "(PSM) and loss-of-containment risk, hazmat supply chain and logistics, " +
      "specialty-vs-commodity margin mix, and Scope-1 process-emissions " +
      "decarbonization. Anchored to DCS / historian / APC / LIMS / MES / EAM / " +
      "ERP. CORE DOCTRINE: feedstock + energy are the margin and price is set by " +
      "the market (control yield, reliability, energy — not price); unplanned " +
      "downtime and asset integrity are the existential risk and process safety " +
      "is non-negotiable; APC and reliability are the real levers but gated by " +
      "historian/sensor data quality and the OT/IT divide; and AI is bounded by " +
      "the safety-instrumented system and human accountability. DISTINCT from " +
      "manufacturing-operations (discrete/assembly). Excludes commercial " +
      "trading/hedging, R&D molecule discovery, and corporate procurement " +
      "category strategy (separate experts).",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "oae",
        name: "Overall Asset Effectiveness (OAE / process OEE)",
        definition:
          "Availability x rate (performance) x quality/on-spec for a process " +
          "unit — the share of fully effective production relative to all " +
          "calendar/planned capacity. The process-industry analogue of OEE.",
        unit: "% (0-100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 92,
          basis:
            "Continuous units commonly run higher availability than discrete " +
            "lines; 90%+ is strong, sustained best-in-class, while rate and " +
            "on-spec losses pull many units well below",
          label: "planning-range",
        },
        dataSource:
          "Historian/DCS production rates and on-spec dispositions vs nameplate " +
          "and planned calendar; MES production accounting",
        whyItMatters:
          "OAE decomposes every loss (downtime, rate, off-spec) into one " +
          "comparable measure and is the primary metric most reliability and APC " +
          "bets are funded to move on a process unit.",
      },
      {
        key: "on_stream_factor",
        name: "On-stream factor (availability / uptime)",
        definition:
          "Share of calendar time a continuous unit is actually running and " +
          "producing, net of planned turnarounds and unplanned trips — the " +
          "headline reliability measure for process plants.",
        unit: "% of calendar time",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 88,
          high: 98,
          basis:
            "Mature continuous units target mid-to-high 90s between turnarounds; " +
            "trip-prone or integrity-challenged units sit materially lower",
          label: "planning-range",
        },
        dataSource:
          "Historian run/trip events with cause coding; production accounting " +
          "and turnaround schedule",
        whyItMatters:
          "A continuous plant earns only when it runs; on-stream factor is the " +
          "single largest driver of unit economics and the existential operational lever.",
      },
      {
        key: "unplanned_downtime",
        name: "Unplanned downtime / lost-production rate",
        definition:
          "Share of available production time lost to unscheduled trips, " +
          "equipment failures, and slowdowns — excluding planned turnarounds and " +
          "scheduled maintenance.",
        unit: "% of available time",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 10,
          basis:
            "Reliability-maturity and asset-integrity dependent; reactive plants " +
            "high, well-instrumented predictive plants low",
          label: "planning-range",
        },
        dataSource: "Historian/DCS trip events with cause codes; EAM/CMMS work orders",
        whyItMatters:
          "Unplanned trips are the largest controllable availability loss and the " +
          "primary target of predictive integrity and reliability programs; a single " +
          "trip can cost days of lost margin plus restart.",
      },
      {
        key: "first_pass_yield",
        name: "First-pass / prime-product yield (on-spec rate)",
        definition:
          "Share of production made on-spec the first time, with no reprocessing, " +
          "blending-down, or downgrade to a lower-value grade. For batch plants, " +
          "the prime-batch rate.",
        unit: "% of production",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99.5,
          basis:
            "Process- and grade-complexity dependent; tight-spec specialty and " +
            "transition-heavy plants run lower prime rates",
          label: "planning-range",
        },
        dataSource: "LIMS quality results and MES grade/disposition accounting",
        whyItMatters:
          "Every point of off-spec is reprocessing energy, downgrade margin loss, or " +
          "waste; on-spec rate feeds the quality term of OAE and the specialty margin mix.",
      },
      {
        key: "feedstock_yield",
        name: "Feedstock conversion / selectivity yield",
        definition:
          "Mass (or molar) yield of target product per unit of feedstock " +
          "consumed — conversion x selectivity through the reaction and " +
          "separation train. The core chemistry-economics measure.",
        unit: "% mass yield",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Chemistry- and route-specific; no cross-process numeric band is " +
            "meaningful — track against the unit's own design yield and best " +
            "demonstrated run",
          label: "planning-range",
        },
        dataSource:
          "Material balance from historian flows + LIMS composition, reconciled " +
          "against feed and product accounting",
        whyItMatters:
          "Feedstock is the dominant variable cost; a fractional yield/selectivity " +
          "gain compounds across the whole feed stream and is the largest controllable " +
          "margin lever after reliability.",
      },
      {
        key: "energy_intensity",
        name: "Energy intensity per ton",
        definition:
          "Energy consumed per tonne of product — fuel gas, steam, electricity, " +
          "and refrigeration — normalized to output and product mix.",
        unit: "GJ / tonne",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Process-specific; no cross-process numeric band is meaningful — " +
            "track against the unit's own baseline, design, and best demonstrated run",
          label: "planning-range",
        },
        dataSource:
          "Utility/fuel metering and steam balance tied to MES production tons",
        whyItMatters:
          "Energy is the second-largest variable cost and the dominant Scope-1 " +
          "emissions driver; per-ton intensity normalizes it against volume and mix " +
          "so improvement is real, not just a rate effect.",
      },
      {
        key: "throughput_vs_nameplate",
        name: "Throughput vs nameplate (capacity utilization)",
        definition:
          "Actual sustained production rate as a share of design nameplate " +
          "capacity, net of constraints — the rate/performance read for the unit.",
        unit: "% of nameplate",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 105,
          basis:
            "Well-debottlenecked units can exceed nameplate; demand- or " +
            "constraint-limited units run below; >100% reflects creep capacity",
          label: "planning-range",
        },
        dataSource: "Historian sustained rates vs design nameplate; production accounting",
        whyItMatters:
          "Closing the gap to nameplate (or beating it via APC debottlenecking) " +
          "spreads fixed cost over more tons and is a primary APC value lever when " +
          "the market can absorb volume.",
      },
      {
        key: "psm_incident_rate",
        name: "Process-safety incident rate (Tier 1 / Tier 2)",
        definition:
          "Count/rate of Tier 1 and Tier 2 process-safety events (loss of " +
          "primary containment above defined thresholds) per API 754 / CCPS, " +
          "normalized to hours or volume.",
        unit: "events per 200k hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0.5,
          basis:
            "Best operators drive Tier 1 toward zero; API 754 / industry PSM " +
            "reference rates — any non-trivial Tier 1 rate is a board-level concern",
          label: "planning-range",
        },
        dataSource: "PSM/incident management system; API 754 Tier 1/Tier 2 classification",
        whyItMatters:
          "Process safety is a hard constraint and an existential, non-negotiable " +
          "obligation; it bounds how far automation can be pushed and is never traded " +
          "for throughput.",
      },
      {
        key: "mtbf",
        name: "MTBF (Mean Time Between Failures) — critical rotating/fixed equipment",
        definition:
          "Average operating time between unplanned failures for critical assets " +
          "(compressors, pumps, fired heaters, exchangers) — a core mechanical-" +
          "integrity reliability measure, paired with MTTR.",
        unit: "hours",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2000,
          high: 17500,
          basis:
            "Strongly asset-class and service-severity dependent (a spared pump " +
            "vs a single fired heater differ by orders); internal reliability " +
            "benchmarking is the only honest comparator",
          label: "planning-range",
        },
        dataSource: "EAM/CMMS failure history vs historian operating hours",
        whyItMatters:
          "Rising MTBF on bad actors converts reactive firefighting and trips into " +
          "planned work — the leading indicator predictive integrity is meant to move.",
      },
      {
        key: "inventory_days",
        name: "Inventory days (feedstock / WIP / hazmat finished)",
        definition:
          "Days of inventory held across feedstock, in-process intermediates, and " +
          "finished product — including hazmat stock constrained by storage and " +
          "transport rules.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 75,
          basis:
            "Feedstock logistics (pipeline/marine/rail), grade complexity, and " +
            "hazmat storage limits drive a wide spread",
          label: "planning-range",
        },
        dataSource: "ERP inventory valuation and movements; tank/terminal accounting",
        whyItMatters:
          "Hazmat and intermediate inventory ties up working capital and storage " +
          "that is hard-capped by permits and safety distance; days is the cleanest " +
          "working-capital and supply-resilience read.",
      },
      {
        key: "specialty_margin_mix",
        name: "Specialty-vs-commodity margin mix",
        definition:
          "Share of gross margin earned from differentiated specialty products " +
          "versus price-taking commodity grades — the portfolio's exposure to " +
          "the commodity cycle.",
        unit: "% of gross margin from specialty",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Company-strategy specific; meaningful only against the firm's own " +
            "portfolio and target mix, not a cross-industry band",
          label: "planning-range",
        },
        dataSource: "ERP product-line P&L and margin accounting by grade",
        whyItMatters:
          "Specialty margin is less cyclical and more defensible than commodity; the " +
          "mix determines how exposed earnings are to feedstock/price swings the plant " +
          "does not control.",
      },
      {
        key: "scope1_emissions_intensity",
        name: "Scope-1 process-emissions intensity",
        definition:
          "Direct (Scope 1) greenhouse-gas emissions per tonne of product — " +
          "combustion plus process-reaction emissions — normalized to output.",
        unit: "tCO2e / tonne product",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Process- and feedstock-specific; meaningful only against the unit's " +
            "own baseline and decarbonization pathway, not a cross-process band",
          label: "planning-range",
        },
        dataSource:
          "Emissions accounting from fuel/feed metering and process stoichiometry; " +
          "regulatory GHG reporting",
        whyItMatters:
          "Scope-1 process emissions are the hard, capital-heavy part of " +
          "decarbonization (electrification, CCUS, low-carbon feed); per-ton intensity " +
          "is the honest progress measure and an emerging regulatory/cost exposure.",
      },
    ],

    painThemes: [
      {
        key: "historian_data_quality",
        name: "Historian / DCS data quality & the OT/IT divide (the binding constraint)",
        description:
          "Process data lives in the historian and DCS in fragmented, " +
          "mis-time-aligned, sensor-drifted form, with lab (LIMS) results " +
          "disconnected from online tags; the OT/IT security boundary and poor " +
          "tag-to-asset context gate almost every APC and predictive use case.",
        detectionSignal:
          "Engineers hand-export historian tags to spreadsheets; soft sensors not " +
          "reconciled to lab; analyzer/sensor drift uncorrected; material balance " +
          "doesn't close; OT network walled off from analytics.",
        diagnosticQuestion:
          "Can you join a unit's historian tags, lab results, material balance, and " +
          "the feedstock/grade it ran — reconciled and time-aligned — without manual work?",
      },
      {
        key: "unplanned_trips_integrity",
        name: "Unplanned trips & mechanical-integrity-driven downtime",
        description:
          "Critical equipment (compressors, fired heaters, exchangers, rotating " +
          "machinery) trips or degrades from corrosion, fouling, and fatigue, " +
          "surfacing as lost-production trips and emergency repair rather than " +
          "planned, condition-based intervention.",
        detectionSignal:
          "High unplanned-trip frequency; repeat 'bad actors'; reactive maintenance " +
          "ratio high; fouling/corrosion found late; thin vibration/thermography/" +
          "corrosion monitoring on critical service.",
        diagnosticQuestion:
          "What are your top trip causes and bad-actor assets, and which critical " +
          "equipment carries condition and integrity monitoring today?",
      },
      {
        key: "yield_selectivity_loss",
        name: "Yield / selectivity loss & operating-window drift",
        description:
          "Reactors and separation trains drift from optimal conversion/" +
          "selectivity as catalysts age, feeds vary, and operators run " +
          "conservatively shift-to-shift — leaving feedstock yield (the dominant " +
          "cost) on the table without anyone seeing it.",
        detectionSignal:
          "Yield varies by shift/crew; conservative setpoints far inside the " +
          "operating window; catalyst performance not tracked; no online yield/" +
          "selectivity model; giveaway on product spec.",
        diagnosticQuestion:
          "How close to the optimal operating window do you run conversion and " +
          "selectivity, and how much does yield vary by crew and feed?",
      },
      {
        key: "energy_intensity_waste",
        name: "Energy intensity & heat-integration waste",
        description:
          "Fired heaters, steam systems, and heat-exchange networks run below " +
          "optimal efficiency from fouling, poor heat integration, and " +
          "excess-air/utility imbalance — inflating energy cost and Scope-1 " +
          "emissions without a clear per-unit signal.",
        detectionSignal:
          "No per-unit energy submetering tied to production; fired-heater " +
          "efficiency untracked; exchanger fouling uncorrected; steam header " +
          "imbalance; energy managed at the site bill, not the unit.",
        diagnosticQuestion:
          "Do you track energy intensity per ton by unit with heat-integration and " +
          "fired-heater efficiency, or only the site energy bill?",
      },
      {
        key: "psm_safety_blind_spots",
        name: "Process-safety & loss-of-containment blind spots",
        description:
          "Leading process-safety signals — alarm floods, safe-operating-limit " +
          "excursions, overdue inspections, impaired safety-critical devices — are " +
          "tracked late and in aggregate, so risk accumulates until an excursion or " +
          "a Tier 1 containment event forces attention.",
        detectionSignal:
          "Alarm management poor (chronic floods/standing alarms); PSM managed by " +
          "lagging incident count; overdue mechanical-integrity inspections; " +
          "safety-critical-device bypasses not tracked; near-miss reporting thin.",
        diagnosticQuestion:
          "Do you have leading process-safety indicators — alarm performance, SOL " +
          "excursions, overdue inspections, impaired safeguards — or only lagging " +
          "Tier 1/Tier 2 counts?",
      },
      {
        key: "hazmat_supply_logistics",
        name: "Hazmat supply chain & feedstock/logistics exposure",
        description:
          "Feedstock supply (pipeline/marine/rail), hazmat storage, and outbound " +
          "logistics are constrained by permits, safety distance, and transport " +
          "rules, so a single supply or logistics disruption ripples into rate " +
          "cuts and forced slowdowns the plant cannot buffer away.",
        detectionSignal:
          "Single-source feedstock with thin alternatives; tank/storage hard-capped; " +
          "demurrage and rail/marine delays; hazmat transport constraints; reactive " +
          "rate cuts when supply slips.",
        diagnosticQuestion:
          "Where is your feedstock and hazmat-logistics single point of failure, and " +
          "how quickly does a supply disruption force a rate cut?",
      },
      {
        key: "commodity_margin_exposure",
        name: "Commodity-margin cyclicality & price-taker exposure",
        description:
          "Earnings swing with feedstock and product prices the plant does not " +
          "set, so a commodity-heavy mix leaves the unit exposed to the cycle " +
          "while the only controllable levers are yield, reliability, energy, and " +
          "shifting mix toward specialty.",
        detectionSignal:
          "Margin tracks spread indices not internal performance; little specialty " +
          "differentiation; value framed as 'price uplift' rather than yield/" +
          "reliability/energy; weak grade-level margin visibility.",
        diagnosticQuestion:
          "What share of margin is commodity price-taking versus specialty, and which " +
          "controllable levers (yield, reliability, energy) actually move your unit cost?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "apc_yield_optimization",
        name: "Advanced process control (APC) & yield/selectivity optimization",
        valueMechanism:
          "Layer model-predictive control and online yield/selectivity models " +
          "over the DCS to push reactors and separation trains closer to the " +
          "optimal operating window across all crews — lifting feedstock yield " +
          "and throughput while holding product on-spec, regardless of who is on shift.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historian process time series (flows, temps, pressures, compositions)",
          "Reconciled material balance and LIMS yield/composition results",
          "Operating-window / catalyst constraints and spec limits",
          "DCS regulatory-control layer that APC can write setpoints to",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "APC writes setpoints to the DCS but must stay strictly inside the safe operating envelope; the SIS/interlocks are independent and never overridden",
          "Soft-sensor/model drift as catalyst ages or feed shifts requires monitored re-tuning, or the optimizer pushes confident-but-wrong setpoints",
        ],
        metricsMoved: [
          "feedstock_yield",
          "throughput_vs_nameplate",
          "first_pass_yield",
          "oae",
        ],
      },
      {
        key: "predictive_integrity_reliability",
        name: "Predictive asset integrity & reliability",
        valueMechanism:
          "Fuse vibration, thermography, corrosion/erosion, and process telemetry " +
          "with failure and inspection history to predict impending failure and " +
          "fouling on critical equipment — converting unplanned trips and " +
          "emergency repair into planned, condition-based work and lifting on-stream factor.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Condition telemetry (vibration/thermal/corrosion) and analyzer health",
          "EAM/CMMS failure, inspection, and work-order history",
          "Asset register, service severity, and operating hours from historian",
          "Process context (load, fouling drivers, feed quality)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Maintenance touches energized/pressurized/hazardous equipment — technicians own the work, permits, and lockout/tagout",
          "False positives waste turnaround windows; false negatives miss the trip the program was bought to prevent",
        ],
        metricsMoved: [
          "mtbf",
          "on_stream_factor",
          "unplanned_downtime",
          "oae",
        ],
      },
      {
        key: "energy_heat_optimization",
        name: "Energy & heat-integration optimization",
        valueMechanism:
          "Model fired-heater efficiency, steam balance, and heat-exchanger " +
          "fouling against production state and recommend operating moves and " +
          "cleaning timing — cutting energy intensity per ton and the associated " +
          "Scope-1 emissions without sacrificing rate or spec.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Per-unit energy/fuel/steam submetering tied to production tons",
          "Fired-heater and exchanger performance telemetry",
          "Heat-integration network model and utility prices",
          "Emissions factors for fuel and process streams",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Energy moves (e.g. excess-air, firing) interact with safety and emissions limits — engineer owns the envelope",
          "Recommendations need engineering validation; correlation in historian data is not causation in the heat network",
        ],
        metricsMoved: [
          "energy_intensity",
          "scope1_emissions_intensity",
          "oae",
        ],
      },
      {
        key: "psm_safety_intelligence",
        name: "Process-safety & alarm-management intelligence",
        valueMechanism:
          "Surface leading process-safety signals — alarm floods/standing alarms, " +
          "safe-operating-limit excursions, overdue inspections, impaired " +
          "safety-critical devices — so operations and PSM act before an excursion " +
          "becomes a loss-of-containment event, treating safety as the hard constraint it is.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "DCS alarm and event logs (rates, floods, standing alarms)",
          "Safe-operating-limit definitions and excursion telemetry",
          "Mechanical-integrity inspection schedules and overdue status",
          "Safety-critical-device bypass/impairment register",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Process-safety decisions and shutdown authority remain with operations/PSM — AI flags, the board operator and PSM decide",
          "The safety-instrumented system is an independent protection layer; AI advises around it and never sits inside or overrides it",
        ],
        metricsMoved: [
          "psm_incident_rate",
          "unplanned_downtime",
        ],
      },
      {
        key: "production_scheduling_supply",
        name: "Production scheduling, grade-transition & hazmat supply optimization",
        valueMechanism:
          "Optimize the campaign/grade-transition sequence and feedstock-to-" +
          "logistics plan against transition losses, hazmat storage limits, and " +
          "demand — cutting off-spec transition material and inventory days while " +
          "protecting on-spec rate and supply continuity.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Production orders, grade slate, and demand/price signals (ERP)",
          "Grade-transition matrix and transition-loss model",
          "Feedstock supply, tank/storage, and hazmat-logistics constraints",
          "Real-time unit status and inventory positions",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Schedulers retain authority — optimization recommends, humans commit, given hazmat, permit, and safety constraints",
          "Optimizing throughput can strand turnaround or inspection windows if integrity constraints are mis-modeled",
        ],
        metricsMoved: [
          "inventory_days",
          "first_pass_yield",
          "specialty_margin_mix",
          "throughput_vs_nameplate",
        ],
      },
      {
        key: "decarbonization_planning",
        name: "Scope-1 decarbonization pathway analytics",
        valueMechanism:
          "Build a unit-level emissions baseline and marginal-abatement model " +
          "(efficiency, electrification, low-carbon feed, CCUS) so capital is " +
          "directed at the lowest-cost real reductions — honest about the " +
          "capital-heavy, multi-year nature of process decarbonization.",
        adoptionProfile: "early",
        dataDependencies: [
          "Unit-level Scope-1 emissions accounting tied to production",
          "Energy and feed consumption with emissions factors",
          "Abatement-option capital/operating cost and carbon-price assumptions",
          "Regulatory/reporting requirements and decarbonization targets",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "These are capital-allocation analytics, not control — engineering and finance own the investment decision",
          "Modeled abatement is sensitive to carbon-price and feed assumptions; present as scenarios with explicit haircuts, not a single number",
        ],
        metricsMoved: [
          "scope1_emissions_intensity",
          "energy_intensity",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "process_data_foundation",
        name: "Reconciled process-data foundation (historian + LIMS + data reconciliation)",
        description:
          "A governed layer that connects DCS/historian/LIMS/MES, corrects sensor " +
          "drift, reconciles material/energy balances, and contextualizes tags to " +
          "units, assets, and grades into a trustworthy, queryable plant model — " +
          "the prerequisite every APC, integrity, and energy use case depends on.",
        boundary:
          "Owns data connectivity, reconciliation, and quality; does NOT own " +
          "real-time control (stays read-aligned with the DCS and respects the OT " +
          "security boundary and the SIS).",
        humanAccountabilityPoint:
          "Plant Process/Data Engineering Lead (with OT-cybersecurity and process-control sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "apc_optimization_layer",
        name: "APC & closed-loop optimization layer",
        description:
          "Model-predictive control plus online yield/energy optimization writing " +
          "setpoints to the DCS regulatory layer, holding the unit near its optimal " +
          "operating window across crews — strictly inside the safe envelope and " +
          "below the SIS.",
        boundary:
          "Owns optimization and setpoint recommendation/writeback within the safe " +
          "envelope; never overrides the safety-instrumented system, interlocks, or " +
          "relief; the panel operator retains trip and override authority.",
        humanAccountabilityPoint: "Process Control / Operations Lead (board operator retains authority)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "predictive_reliability_program",
        name: "Condition-based predictive integrity & reliability program",
        description:
          "Condition and corrosion/fouling monitoring plus failure prediction " +
          "feeding a risk-based maintenance and inspection plan in the EAM, so the " +
          "most critical and failure-prone assets get intervention before a trip " +
          "or containment loss.",
        boundary:
          "Owns failure/fouling prediction and maintenance prioritization; does " +
          "not execute maintenance autonomously or override OEM, RBI, or " +
          "mechanical-integrity standards.",
        humanAccountabilityPoint: "Plant Reliability & Mechanical-Integrity Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "psm_alarm_intelligence",
        name: "Process-safety & alarm-management intelligence layer",
        description:
          "Alarm-performance analytics plus leading-indicator monitoring (SOL " +
          "excursions, overdue inspections, impaired safeguards) wired to the PSM " +
          "system, surfacing risk before it becomes a loss-of-containment event.",
        boundary:
          "Owns detection and leading-indicator surfacing; does not take shutdown " +
          "action, override the SIS, or replace operator/PSM decision authority.",
        humanAccountabilityPoint: "Process-Safety (PSM) Manager",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Process-plant value is unlocked in a strict order and sized on the " +
        "right lever. The reconciled process-data foundation (historian + LIMS + " +
        "data reconciliation) must exist before APC, predictive integrity, or " +
        "energy optimization can deliver — modeled value without it is largely " +
        "unrealizable. Once data is trustworthy, the durable, defensible " +
        "economics are FEEDSTOCK YIELD/SELECTIVITY (the dominant variable cost), " +
        "ON-STREAM RELIABILITY (a continuous plant earns only when it runs), and " +
        "ENERGY INTENSITY — NOT commodity margin, which is set by the market the " +
        "plant does not control. Specialty mix shift and working-capital release " +
        "are second-order. Process safety is never a value lever to trade against: " +
        "it caps how far automation can go, and the SIS is an independent " +
        "protection layer AI advises around but never overrides. Decarbonizing " +
        "Scope-1 is capital-heavy and slow — real, but not a quick AI win.",
      dominantHaircutFactors: [
        {
          factor: "Historian/LIMS data quality, sensor health & data reconciliation",
          rationale:
            "Process data is drifted, mis-time-aligned, and disconnected from lab; " +
            "until the reconciled data foundation is real, APC and predictive model " +
            "accuracy collapses and modeled value is largely unrealizable — the " +
            "single largest haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.55,
            basis:
              "Repeated experience where historian/sensor/lab data quality and " +
              "reconciliation capped delivered APC and reliability value",
            label: "planning-range",
          },
        },
        {
          factor: "Process-safety & SIS boundary on automation",
          rationale:
            "PSM obligations, the independent safety-instrumented system, and " +
            "validated operating limits cap how autonomously AI can act; value that " +
            "requires crossing the SIS boundary is not realizable.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Automation scope limited by process-safety standards and the SIS as " +
              "an independent protection layer",
            label: "planning-range",
          },
        },
        {
          factor: "Commodity-cycle / market-price exposure",
          rationale:
            "Margin swings with feedstock and product prices the plant does not " +
            "set, so yield/reliability/energy gains can be masked in cash terms by " +
            "the cycle — value must be expressed in physical units, not assumed margin.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Observed where commodity-price swings obscured or eroded the cash " +
              "value of physical efficiency gains",
            label: "planning-range",
          },
        },
        {
          factor: "Operator & engineering adoption",
          rationale:
            "Board operators and process engineers must trust and act on APC and " +
            "predictive recommendations; conservative operating culture and tribal " +
            "knowledge slow adoption and leave yield and reliability value on the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "Control-room change-management and process-engineering experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Feedstock-yield / selectivity gain from APC and optimization",
          range: {
            low: 0.005,
            high: 0.03,
            basis:
              "Reported yield/selectivity gains where the data foundation was " +
              "adequate; expressed as absolute mass-yield fraction, which compounds " +
              "across the full feed stream",
            label: "planning-range",
          },
          measuredAs: "Absolute mass-yield (conversion x selectivity) improvement on the feed stream",
        },
        {
          lever: "On-stream-factor / unplanned-downtime improvement from predictive integrity",
          range: {
            low: 0.1,
            high: 0.3,
            basis: "Reported unplanned-downtime reductions on assets with adequate condition/integrity data",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in unplanned downtime on monitored critical assets",
        },
        {
          lever: "Energy-intensity reduction from energy & heat-integration optimization",
          range: {
            low: 0.02,
            high: 0.1,
            basis: "Reported per-ton energy-intensity reductions where unit submetering and heater/exchanger telemetry existed",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in energy intensity per ton on targeted units",
        },
      ],
      timeToValueBand:
        "Reconciled process-data foundation: 2-4 quarters (the gating investment). " +
        "APC & yield optimization: 2-4 quarters on a unit once data is trustworthy " +
        "(mainstream, fastest payback). Predictive integrity & reliability: 2-4 " +
        "quarters once condition/integrity data exists. Energy & heat optimization: " +
        "2-4 quarters with unit submetering. Scope-1 decarbonization: multi-year and " +
        "capital-heavy — analytics in 1-2 quarters, physical abatement far longer.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "DCS / SIS (distributed control & safety-instrumented system)",
          role:
            "Real-time regulatory control of the process (DCS) and the independent " +
            "safety-instrumented system / interlocks / relief that protect against " +
            "loss of containment (SIS) — the OT control layer.",
          examples: ["Honeywell Experion/TDC", "Emerson DeltaV", "Yokogawa CENTUM", "Triconex/HIMA (SIS)"],
        },
        {
          name: "Process historian / data infrastructure",
          role:
            "Time-series telemetry of every tag (flows, temps, pressures, " +
            "compositions) — the substrate for APC, integrity, and energy analytics.",
          examples: ["AVEVA/OSIsoft PI", "Honeywell PHD", "Aspen InfoPlus.21", "Yokogawa Exaquantum"],
        },
        {
          name: "APC / process optimization",
          role:
            "Model-predictive control and online optimization that write setpoints " +
            "to the DCS within the safe operating envelope.",
          examples: ["AspenTech DMC3/APC", "Honeywell Profit Suite", "Yokogawa/Shell platforms", "AVEVA APC"],
        },
        {
          name: "LIMS / quality (laboratory information management)",
          role:
            "Lab analytical results for composition, spec, and yield reconciliation — " +
            "the offline truth that grounds online soft sensors.",
          examples: ["LabWare", "Thermo SampleManager", "STARLIMS", "Siemens/Opcenter Lab"],
        },
        {
          name: "EAM / CMMS & MES + ERP (maintenance, execution, cost)",
          role:
            "Asset register, maintenance/inspection work orders, failure history " +
            "(EAM); production accounting and genealogy (MES); orders, feedstock " +
            "cost, inventory, and product-line P&L (ERP).",
          examples: ["IBM Maximo", "SAP PM/EAM & S/4HANA", "Aspen MES/Production Accounting"],
        },
      ],
      roles: [
        {
          title: "Plant Manager / Operations Director",
          accountability: "End-to-end plant process safety, reliability, yield, energy, and conversion cost.",
        },
        {
          title: "Process-Safety (PSM) Manager",
          accountability: "Process-safety management, loss-of-containment risk, PSM elements, and Tier 1/2 performance.",
        },
        {
          title: "Reliability & Mechanical-Integrity Manager",
          accountability: "Asset integrity (MTBF/RBI), inspection, bad-actor elimination, and on-stream factor.",
        },
        {
          title: "Process Control / APC Engineer",
          accountability: "DCS regulatory control, APC/optimization performance, and the safe operating envelope.",
        },
        {
          title: "Process / Yield Engineer",
          accountability: "Reactor/separation yield and selectivity, operating-window optimization, and material balance.",
        },
        {
          title: "Energy / Sustainability Manager",
          accountability: "Energy intensity per ton, heat integration, and Scope-1 emissions and decarbonization pathway.",
        },
        {
          title: "Board / Panel Operator",
          accountability: "Real-time operation within safe limits; retains trip, override, and shutdown authority.",
        },
      ],
      regulatoryFrames: [
        {
          name: "OSHA PSM (29 CFR 1910.119) & EPA RMP (40 CFR 68)",
          relevance:
            "Govern process-safety management and risk management for highly " +
            "hazardous chemicals; process safety is a hard, non-negotiable constraint " +
            "that bounds how autonomously AI and equipment may act.",
        },
        {
          name: "EPA Clean Air Act / GHG reporting & air permits (Title V)",
          relevance:
            "Air-emissions permits and GHG reporting make per-ton energy and Scope-1 " +
            "emissions tracked, reportable, capital-affecting outcomes — not just cost lines.",
        },
        {
          name: "REACH / TSCA (chemical substance regulation)",
          relevance:
            "Substance registration, restriction, and product-stewardship rules " +
            "constrain what may be produced and how product/process changes are validated.",
        },
        {
          name: "Hazmat transport & storage (DOT 49 CFR / PHMSA, IMDG)",
          relevance:
            "Hazardous-material transport, storage, and safety-distance rules cap " +
            "inventory and logistics flexibility and shape supply-chain resilience.",
        },
        {
          name: "Functional safety & OT integration (IEC 61511/61508, ISA-95/ISA-99 IEC 62443)",
          relevance:
            "Define the safety-instrumented-system integrity (SIL) the SIS must meet " +
            "and the OT cybersecurity zones governing how IT/AI systems may touch the plant.",
        },
      ],
      canonicalTerms: [
        {
          term: "On-stream factor",
          definition:
            "Share of calendar time a continuous unit is actually running and producing, " +
            "net of planned turnarounds and unplanned trips — the headline reliability measure.",
        },
        {
          term: "Yield / conversion / selectivity",
          definition:
            "Conversion is the fraction of feed reacted; selectivity is the fraction of " +
            "reacted feed going to the target product; yield (conversion x selectivity) is " +
            "the mass of target product per unit feed.",
        },
        {
          term: "APC / model-predictive control (MPC)",
          definition:
            "Advanced process control that uses a process model to drive multiple " +
            "setpoints toward an optimum within constraints, writing to the DCS below the SIS.",
        },
        {
          term: "Safety-Instrumented System (SIS) / independent protection layer",
          definition:
            "An independent system of sensors, logic solvers, and final elements that brings " +
            "the process to a safe state on demand — a protection layer AI advises around but never overrides.",
        },
        {
          term: "PSM Tier 1 / Tier 2 (API 754)",
          definition:
            "Process-safety event tiers based on loss of primary containment severity; the " +
            "leading process-industry measure of process-safety performance.",
        },
        {
          term: "Turnaround (TAR)",
          definition:
            "A planned, scheduled shutdown of a unit for major maintenance, inspection, and " +
            "catalyst change — the largest planned availability event in a process plant's cycle.",
        },
        {
          term: "Risk-Based Inspection (RBI) / mechanical integrity",
          definition:
            "Inspection and maintenance prioritized by probability and consequence of failure, " +
            "the core of asset-integrity management for fixed and pressure equipment.",
        },
        {
          term: "Data reconciliation / material balance closure",
          definition:
            "Statistical correction of measured flows/compositions so mass and energy balances " +
            "close — the basis for trustworthy online yield and energy metrics.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Feedstock yield / conversion / selectivity",
        authoritativeSource: "Reconciled material balance from historian flows + LIMS composition",
        whatGoodEvidenceLooksLike:
          "Mass yield with a closed material balance, conversion and selectivity split, tied " +
          "to feed and product accounting over a defined period and feed slate.",
        weakEvidenceToReject:
          "A single yield number with no material-balance closure, feed basis, or LIMS reconciliation.",
      },
      {
        claim: "On-stream factor and unplanned downtime",
        authoritativeSource: "Historian/DCS run/trip events with cause coding vs EAM/CMMS history",
        whatGoodEvidenceLooksLike:
          "On-stream factor and unplanned-downtime split by trip cause and bad-actor asset, " +
          "with the calendar/available-time denominator stated.",
        weakEvidenceToReject:
          "A claim the unit 'runs reliably' or 'trips a lot' with no run-time denominator, cause coding, or trip history.",
      },
      {
        claim: "Energy intensity and Scope-1 emissions per ton",
        authoritativeSource: "Per-unit energy/fuel/steam submetering and emissions accounting tied to MES tons",
        whatGoodEvidenceLooksLike:
          "Per-unit energy and Scope-1 intensity normalized by production tons over a defined " +
          "period, separating product-mix effects from real efficiency change.",
        weakEvidenceToReject:
          "A total-site energy bill or aggregate emissions divided by total output presented as a per-unit efficiency gain.",
      },
      {
        claim: "Process-safety performance and leading risk",
        authoritativeSource: "PSM/incident system (API 754 Tier 1/2) plus alarm and inspection records",
        whatGoodEvidenceLooksLike:
          "Tier 1/Tier 2 events classified to API 754 with leading indicators — alarm " +
          "performance, SOL excursions, overdue inspections, impaired safeguards.",
        weakEvidenceToReject:
          "A statement that the plant is 'safe' with only a lagging incident count and no leading-indicator basis.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Can you join a unit's historian tags, lab (LIMS) results, and reconciled material balance to the feedstock/grade it ran, time-aligned, without manual work?",
      "What is your on-stream factor and your top trip causes and bad-actor assets, and which critical equipment carries condition/integrity monitoring?",
      "How close to the optimal operating window do you run conversion and selectivity, and how much does yield vary by crew and feed?",
      "Do you track energy intensity per ton by unit (with fired-heater and exchanger efficiency), or only the site energy bill?",
      "Do you have leading process-safety indicators — alarm performance, safe-operating-limit excursions, overdue inspections, impaired safeguards — or only lagging Tier 1/Tier 2 counts?",
      "Where is your feedstock and hazmat-logistics single point of failure, and how quickly does a supply disruption force a rate cut?",
      "What share of margin is commodity price-taking versus specialty, and which controllable levers (yield, reliability, energy) actually move your unit cost?",
      "What is your Scope-1 process-emissions intensity per ton and your decarbonization pathway — and is it sized as capital-heavy and multi-year?",
    ],
    maturitySignals: [
      "A reconciled process-data foundation contextualizes DCS/historian/LIMS to units, assets, and grades with closed material balances and corrected sensor drift.",
      "APC runs closed-loop on the major units, holding yield/selectivity near the optimal window across crews, strictly inside the safe envelope and below the SIS.",
      "Critical assets carry condition and integrity (RBI) monitoring and maintenance is mostly planned/condition-based, not reactive.",
      "Process safety is managed by leading indicators (alarm performance, SOL excursions, overdue inspections) — not only lagging Tier 1/2 counts.",
      "Energy intensity per ton is tracked by unit with heat-integration and fired-heater efficiency, and a credible Scope-1 decarbonization pathway exists.",
    ],
    redFlags: [
      "Historian, lab, and material-balance data cannot be joined or reconciled without manual work — no trustworthy process-data foundation, so APC/predictive value is unrealizable.",
      "On-stream factor is low and trips are frequent with thin cause coding and little condition/integrity monitoring — reliability is reactive and the existential lever is unmanaged.",
      "Process safety is managed only by lagging Tier 1/2 counts with chronic alarm floods and overdue inspections — leading risk is accumulating unseen.",
      "AI is proposed to take autonomous control action, override or sit inside the safety-instrumented system, or auto-disposition product — crossing the hard process-safety boundary.",
      "Value is sized on commodity 'margin uplift' or price the plant does not control, rather than on physical yield, reliability, and energy intensity — the program is mis-scoped.",
      "Decarbonization is promised as a quick AI win rather than the capital-heavy, multi-year Scope-1 program it actually is.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "DCS / SIS platform vendors",
        category: "Process control & safety-instrumented systems",
        switchingCost:
          "Extreme — the DCS and SIS are embedded in every control loop and safety interlock; replacement is a multi-year, turnaround-gated capital program.",
        renewalDynamics:
          "Long lifecycle (decades) with embedded service and migration paths; rarely re-sourced standalone — negotiated at major upgrade/turnaround windows.",
      },
      {
        vendorName: "Historian / process-data-infrastructure vendors",
        category: "OT telemetry / process-data foundation",
        switchingCost:
          "High — historian tags and integrations underpin every analytics use case; migration is itself a major project.",
        renewalDynamics:
          "Foundational and sticky; negotiate on data egress rights, open standards (OPC-UA), and tag/asset scaling.",
      },
      {
        vendorName: "APC / process-optimization vendors",
        category: "Advanced process control & optimization",
        switchingCost:
          "High — APC controllers are tuned to the specific units and embedded in operations; re-implementing on a new platform is a substantial engineering effort.",
        renewalDynamics:
          "Often bundled with the DCS vendor or specialist; favor benefit-guarantee/outcome terms and model ownership.",
      },
      {
        vendorName: "Predictive-integrity & reliability-analytics vendors",
        category: "Asset integrity / condition monitoring analytics",
        switchingCost:
          "Moderate — integrate via historian/EAM feeds; replaceable with data-mapping effort, watch model lock-in.",
        renewalDynamics:
          "Fast-moving market; favor outcome-based terms, explainability, and data/exit rights.",
      },
    ],
    switchingCosts:
      "The control core (DCS) and the safety-instrumented system are effectively " +
      "non-switchable in isolation and decades-lived; the historian is highly sticky. " +
      "The negotiable value frontier is the APC, integrity, and energy-analytics layer " +
      "around them — so contract for data portability and open standards (OPC-UA, " +
      "ISA-95) at the foundation to keep that frontier competitive and avoid OT lock-in.",
    negotiationLevers: [
      "Benefit-guarantee / outcome-based pricing tied to measured yield, on-stream-factor, or energy-intensity gains on the plant's own units",
      "Open standards (OPC-UA / ISA-95) and data egress rights to avoid historian and OT lock-in",
      "Model ownership, re-tuning support, and explainability as contractual requirements (process-safety and yield exposure)",
      "Turnaround-aligned implementation gating with parity proof on the plant's own units and data before multi-site rollout",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      yield_metric: [
        "reconciled material balance (closed)",
        "LIMS composition and conversion/selectivity split",
        "feed slate and defined period",
      ],
      reliability_claim: [
        "historian run/trip events with cause coding",
        "EAM/CMMS failure and inspection history",
        "calendar/available-time denominator and bad-actor attribution",
      ],
      energy_emissions_claim: [
        "per-unit energy/fuel/steam submetering",
        "MES production-ton normalization",
        "defined period and product-mix isolation",
      ],
      process_safety_claim: [
        "API 754 Tier 1/Tier 2 classification",
        "leading indicators (alarm performance, SOL excursions, overdue inspections)",
        "impaired-safeguard and bypass register",
      ],
      value_projection: [
        "baseline physical metric (yield, on-stream factor, energy per ton)",
        "benchmark planning-range expressed in physical units",
        "explicit haircut factors (esp. data quality, SIS/safety bound, commodity-cycle exposure)",
      ],
    },
    citationStandard:
      "Quantitative process claims cite the historian/LIMS/EAM/MES source and the " +
      "period, state the unit/asset granularity, and (for yield) the material-balance " +
      "closure and conversion/selectivity split. Value projections are expressed in " +
      "PHYSICAL units (mass yield, on-stream-factor points, energy per ton), cite a " +
      "baseline plus a labelled planning range and the haircut factors applied — never " +
      "an asserted commodity-margin uplift or a single steady-state ROI, since price is " +
      "set by the market.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's historian/LIMS data foundation is immature or material balances don't close — frame APC/yield/predictive value as conditional on data readiness, not an achievable number.",
      "Yield or selectivity is quoted without a closed material balance and LIMS reconciliation — present as not-yet-trustworthy and ask for reconciliation.",
      "Value is framed as a commodity-margin or price uplift — redirect to physical levers (yield, reliability, energy) because price is set by the market, not the plant.",
      "Benchmarks are cited without the tenant's own unit baseline — present as planning ranges in physical units.",
      "Vendor-reported yield, on-stream-factor, or downtime-reduction outcomes are cited — mark as vendor claims pending validation on the tenant's units.",
      "Any automation is described near the safety-instrumented-system boundary — flag that the SIS is independent and never overridden, and that human authority is required.",
    ],
    inferenceLanguage: [
      "Across continuous process units, on-stream factor typically runs...",
      "Without your historian and lab data, the industry pattern suggests...",
      "Plants at this reliability maturity commonly see unplanned downtime around...",
      "Where the process-data foundation is solid, APC programs have delivered yield gains of...",
      "Price is set by the market, so the controllable levers here are yield, reliability, and energy — not margin itself.",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings, margin uplift, or ROI for this tenant",
      "This tenant's actual feedstock yield, on-stream factor, energy intensity, or Tier 1 rate",
      "A claim that a specific unit or asset is the constraint/bad actor without the tenant's data",
      "A claim that AI can safely take autonomous control action or sit inside/override the safety-instrumented system without the tenant's process-safety review",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where is production / on-stream time lost (loss breakdown)",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from nameplate/calendar capacity through downtime, rate, and off-spec losses to effective production (OAE).",
    },
    {
      questionPattern: "conversion-cost stack / feedstock + energy share of unit cost",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack unit conversion cost by feedstock, energy, maintenance, off-spec, and fixed to show feedstock/energy dominance.",
    },
    {
      questionPattern: "value or cost impact of a process program / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current yield/on-stream/energy baseline to projected, in physical units, with data-readiness, SIS/safety, and commodity-cycle haircuts shown.",
    },
    {
      questionPattern: "asset integrity / reliability ranking — which assets to monitor or inspect first",
      exhibitKind: "table",
      note: "Risk-ranked bad-actor assets: failure/fouling probability, trip consequence, MTBF, RBI/condition-monitoring status, recommended action.",
    },
    {
      questionPattern: "process operations KPI scorecard",
      exhibitKind: "table",
      note: "OAE, on-stream factor, first-pass/prime yield, feedstock yield, energy intensity, throughput vs nameplate, MTBF, Tier 1/2 rate, specialty margin mix, Scope-1 intensity vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The reconciled historian/LIMS process-data foundation is funded and treated as the first deliverable, not an afterthought",
      "Value is scoped on physical levers — feedstock yield, on-stream reliability, and energy intensity — not commodity margin the plant does not control",
      "APC and automation are designed strictly inside the safe operating envelope and below the safety-instrumented system, so operations trust and adopt them",
      "Board operators, process and reliability engineers are engaged early and conservative tribal operating practice is addressed, so recommendations are acted on",
    ],
    failureDrivers: [
      "APC, predictive, or energy analytics bought before the reconciled data foundation exists — models are confident but unusable",
      "Underestimating historian/sensor/lab data-quality and material-balance remediation effort",
      "Sizing value on commodity-margin uplift or price the plant does not control instead of physical yield/reliability/energy — the program over-promises",
      "Proposing autonomy that crosses the process-safety / SIS boundary, which stalls in review and erodes trust, or promising decarbonization as a quick AI win",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "APC and yield optimization adopt first because the value is tangible, the " +
      "lever is the dominant cost, and the workflow change is contained inside the " +
      "control room; predictive integrity/reliability and energy optimization follow " +
      "once condition and submetering data mature; process-safety intelligence is " +
      "adopted carefully (advisory only, never inside the SIS); near-autonomous " +
      "control and Scope-1 physical decarbonization are last, gated by safety, " +
      "validation, capital, and operator trust.",
    roiClarity: "medium",
    roiClarityBasis:
      "Yield/selectivity points, on-stream-factor hours, and energy intensity per ton " +
      "are directly measurable in physical units, but their CASH value is muddied by " +
      "the commodity cycle (price the plant does not set) and the heavy dependence of " +
      "delivered value on historian/lab data readiness — making ROI firm in physical " +
      "terms and where data is good, but speculative in margin terms and where " +
      "instrumentation is poor.",
  },

  regulatoryFrame: {
    name: "Process-Safety Management & functional-safety standards (with environmental, chemical, and hazmat regimes)",
    relevance:
      "The dominant regulatory frame for the process plant: OSHA PSM (29 CFR " +
      "1910.119) and EPA RMP make process safety a hard, non-negotiable constraint, " +
      "and IEC 61511/61508 functional-safety standards define the safety-instrumented " +
      "system as an independent protection layer that AI must never override or sit " +
      "inside. Air-emissions/GHG reporting (Clean Air Act, Title V), chemical-substance " +
      "regulation (REACH/TSCA), and hazmat transport/storage rules (DOT/PHMSA, IMDG) " +
      "also apply, and ISA-95/ISA-99 (IEC 62443) govern how IT/AI may touch the OT plant " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
