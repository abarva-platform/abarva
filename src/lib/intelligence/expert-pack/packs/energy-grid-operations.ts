// Consilium expert — Energy & Utilities: Grid & Asset Operations.
//
// Wave-3 industry-function ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// Mirrors the W3.1 healthcare-revenue-cycle exemplar depth bar.
//
// Domain: electric utility grid reliability and asset operations — grid
// reliability, predictive asset maintenance, outage management, load/demand
// forecasting, DER/renewables integration, field workforce, and wildfire/storm
// risk. The honest bounding truths of this domain are baked into the content:
// (1) NERC reliability standards and public-safety obligations cap how far
// automation can be pushed without human accountability, and (2) OT/IT data
// integration — getting SCADA/ADMS/GIS/historian data clean, time-aligned, and
// trustworthy — is the binding constraint on almost every AI use case here.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const energyGridOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.energy.grid-asset-operations",
    expertName: "Energy Grid & Asset Operations Expert",
    kind: "industry-function",
    industry: "energy",
    functionKey: "grid-asset-operations",
    scopeNote:
      "Electric utility transmission & distribution operations: grid " +
      "reliability (SAIDI/SAIFI/CAIDI), predictive asset maintenance and " +
      "health, outage management and restoration, load/demand forecasting, " +
      "DER/renewables integration and hosting capacity, field workforce " +
      "dispatch, and wildfire/storm risk. Anchored to ADMS/OMS/SCADA/GIS and " +
      "asset historians. Excludes wholesale energy trading, generation plant " +
      "operations, retail billing/CIS, and gas pipeline integrity (separate " +
      "experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "saidi",
        name: "SAIDI (System Average Interruption Duration Index)",
        definition:
          "Total customer-minutes of sustained interruption divided by total " +
          "customers served, over a period — average outage duration a " +
          "customer experiences.",
        unit: "minutes/customer/year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 90,
          high: 240,
          basis:
            "IEEE 1366 reporting; wide spread by territory, vegetation, and " +
            "whether Major Event Days are excluded",
          label: "planning-range",
        },
        dataSource: "OMS outage records normalized to IEEE 1366 (with/without MED)",
        whyItMatters:
          "The headline reliability metric regulators and boards watch; ties " +
          "directly to performance-based-rate incentives/penalties and customer trust.",
      },
      {
        key: "saifi",
        name: "SAIFI (System Average Interruption Frequency Index)",
        definition:
          "Total number of sustained customer interruptions divided by total " +
          "customers served — how often the average customer loses power.",
        unit: "interruptions/customer/year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.9,
          high: 1.8,
          basis: "IEEE 1366 peer reporting; varies by overhead vs underground mix",
          label: "planning-range",
        },
        dataSource: "OMS interruption counts joined to customer counts per feeder",
        whyItMatters:
          "Frequency complements duration — a grid can have short but frequent " +
          "outages; SAIFI isolates how often protection/asset failures trip the system.",
      },
      {
        key: "caidi",
        name: "CAIDI (Customer Average Interruption Duration Index)",
        definition:
          "SAIDI divided by SAIFI — the average restoration time per " +
          "interruption (how long an outage lasts once it happens).",
        unit: "minutes/interruption",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 90,
          high: 180,
          basis: "Derived from IEEE 1366 SAIDI/SAIFI; crew response and switching dependent",
          label: "planning-range",
        },
        dataSource: "Computed from OMS-derived SAIDI and SAIFI",
        whyItMatters:
          "Isolates restoration efficiency from outage frequency — the metric " +
          "most directly moved by faster fault location, switching, and crew dispatch.",
      },
      {
        key: "asset_failure_rate",
        name: "Asset failure rate",
        definition:
          "In-service failures per unit population per year for a critical " +
          "asset class (e.g. power transformers, breakers, underground cable).",
        unit: "failures/100 units/year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 3,
          basis:
            "Asset-class dependent; transformers low, aged cable high — operator/CIGRE ranges",
          label: "planning-range",
        },
        dataSource: "Asset historian + EAM (e.g. Maximo/SAP PM) failure events vs installed population",
        whyItMatters:
          "The leading driver of unplanned outages and emergency replacement " +
          "capex; the metric predictive maintenance programs are funded to bend.",
      },
      {
        key: "predictive_maintenance_coverage",
        name: "Predictive-maintenance coverage",
        definition:
          "Share of critical-asset population under condition-based or " +
          "predictive maintenance (sensors/analytics) rather than run-to-fail " +
          "or fixed-interval time-based maintenance.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 50,
          basis: "Utility maturity surveys; most utilities still largely time-based",
          label: "planning-range",
        },
        dataSource: "EAM maintenance-strategy flags by asset vs total critical population",
        whyItMatters:
          "Coverage gates how much of the asset base AI can actually protect; " +
          "low coverage means most failures are still discovered after they happen.",
      },
      {
        key: "load_forecast_accuracy",
        name: "Load / demand forecast accuracy (MAPE)",
        definition:
          "Mean absolute percentage error of day-ahead system or feeder load " +
          "forecasts versus realized load.",
        unit: "% MAPE",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.5,
          high: 5,
          basis:
            "System-level day-ahead typically low; feeder/DER-heavy forecasts much harder",
          label: "planning-range",
        },
        dataSource: "Forecast vs metered/AMI realized load (system and feeder level)",
        whyItMatters:
          "Drives switching, capacity planning, and DER dispatch; error widens " +
          "sharply at the feeder level as behind-the-meter solar and EVs grow.",
      },
      {
        key: "outage_restoration_time",
        name: "Mean outage restoration time (excl. MED)",
        definition:
          "Average elapsed time from outage detection to restoration for " +
          "non-major events, including fault location, dispatch, and switching.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 60,
          high: 150,
          basis: "Operator experience excluding Major Event Days; terrain/crew dependent",
          label: "planning-range",
        },
        dataSource: "OMS event timestamps (detect → assign → arrive → restore)",
        whyItMatters:
          "The operational lever behind CAIDI; fault-location analytics and FLISR " +
          "automation compress the detect-to-restore chain.",
      },
      {
        key: "der_hosting_capacity",
        name: "DER hosting capacity utilization",
        definition:
          "Interconnected distributed energy resources as a share of the " +
          "feeder/circuit hosting capacity before thermal or voltage limits bind.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Headroom planning band — below wastes capacity, near 100% risks voltage/thermal violations",
          label: "planning-range",
        },
        dataSource: "Hosting-capacity analysis (power-flow models) vs interconnected DER nameplate",
        whyItMatters:
          "Renewables integration is constrained by circuit headroom; managing " +
          "this band avoids both stranded capacity and reliability violations.",
      },
      {
        key: "field_crew_utilization",
        name: "Field crew utilization",
        definition:
          "Productive wrench-time hours as a share of paid field-crew hours " +
          "(excludes travel, standby, and administrative time).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 45,
          high: 65,
          basis: "Field-service benchmarks; travel and switching depress utilization",
          label: "planning-range",
        },
        dataSource: "Mobile workforce management / dispatch timestamps vs timesheets",
        whyItMatters:
          "Field labor is a dominant O&M cost; better dispatch, routing, and " +
          "first-time-fix lift utilization without adding headcount.",
      },
      {
        key: "assets_monitored",
        name: "Critical assets monitored",
        definition:
          "Share of critical assets emitting usable condition telemetry " +
          "(online monitoring, IED/sensor data) into the historian/analytics layer.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 60,
          basis: "Sensorization maturity varies widely; substations ahead of distribution",
          label: "planning-range",
        },
        dataSource: "Historian/SCADA tag inventory mapped to critical-asset register",
        whyItMatters:
          "No telemetry, no prediction — instrumentation coverage is the upstream " +
          "constraint on every condition-based AI use case.",
      },
      {
        key: "capex_efficiency",
        name: "Reliability capex efficiency",
        definition:
          "Reliability improvement (e.g. SAIDI-minutes avoided) delivered per " +
          "dollar of grid-hardening/replacement capital deployed.",
        unit: "SAIDI-min avoided / $M",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis: "Highly program- and territory-specific; internal portfolio benchmarking",
          label: "planning-range",
        },
        dataSource: "Capital portfolio actuals vs measured reliability deltas by project",
        whyItMatters:
          "Regulators scrutinize whether hardening dollars actually buy " +
          "reliability; risk-based targeting is how AI raises this ratio.",
      },
      {
        key: "wildfire_risk_index",
        name: "Wildfire ignition risk index (high-risk circuit-miles)",
        definition:
          "Composite risk score (or share of circuit-miles in high fire-threat " +
          "districts) weighting vegetation, asset condition, weather, and terrain.",
        unit: "risk score (0-100)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis: "Territory-specific; only material in fire-prone service areas (e.g. WUI)",
          label: "planning-range",
        },
        dataSource:
          "Ignition-risk models over GIS asset/vegetation layers + weather feeds",
        whyItMatters:
          "Catastrophic-tail safety and liability exposure; drives PSPS " +
          "decisions, undergrounding priorities, and inspection targeting.",
      },
    ],

    painThemes: [
      {
        key: "ot_it_data_fragmentation",
        name: "OT/IT data fragmentation (the binding constraint)",
        description:
          "SCADA, ADMS, OMS, GIS, historian, and EAM systems hold the data AI " +
          "needs, but it is siloed, mis-time-aligned, and of uneven quality; " +
          "the integration effort — not the algorithm — gates most use cases.",
        detectionSignal:
          "No unified asset/grid data model; analysts hand-merge exports; GIS " +
          "connectivity disagrees with as-built; historian tags poorly mapped to assets.",
        diagnosticQuestion:
          "Can you join an asset's nameplate, GIS location, condition telemetry, " +
          "and outage history without manual reconciliation across systems?",
      },
      {
        key: "reactive_asset_maintenance",
        name: "Reactive / time-based asset maintenance",
        description:
          "Most critical assets are maintained on fixed intervals or run to " +
          "failure because condition telemetry is thin, so failures are found " +
          "after they cause outages and emergency replacement costs.",
        detectionSignal:
          "Low predictive-maintenance coverage and assets-monitored share; high " +
          "emergency vs planned replacement ratio; failures clustering in aged classes.",
        diagnosticQuestion:
          "What share of your critical assets are on condition-based maintenance, " +
          "and what is your emergency-to-planned replacement ratio?",
      },
      {
        key: "slow_fault_location_restoration",
        name: "Slow fault location & restoration",
        description:
          "Without FLISR/fault-location analytics, crews are dispatched to " +
          "patrol lines to find faults, inflating restoration time, CAIDI, and " +
          "customer-minutes lost.",
        detectionSignal:
          "Long detect-to-restore intervals in OMS; high patrol/drive time; manual " +
          "switching; few automated reclosers/sectionalizers.",
        diagnosticQuestion:
          "How is a fault located today, and what share of restoration time is " +
          "spent finding the fault versus repairing it?",
      },
      {
        key: "feeder_forecast_breakdown",
        name: "Feeder-level forecast breakdown under DER",
        description:
          "Behind-the-meter solar, storage, and EV charging make feeder load " +
          "volatile and bidirectional; system-level forecasts stay decent while " +
          "feeder forecasts degrade, undermining switching and DER dispatch.",
        detectionSignal:
          "Rising feeder-level MAPE; reverse power flow events; voltage excursions; " +
          "DER interconnection queue growth outpacing model updates.",
        diagnosticQuestion:
          "How accurate are your feeder-level (not just system) forecasts, and do " +
          "they account for behind-the-meter DER and EV load?",
      },
      {
        key: "der_interconnection_bottleneck",
        name: "DER interconnection & hosting-capacity bottleneck",
        description:
          "Manual, study-by-study interconnection reviews and stale hosting-" +
          "capacity maps slow renewable connection and risk thermal/voltage " +
          "violations as DER penetration climbs.",
        detectionSignal:
          "Long interconnection study backlogs; hosting-capacity maps refreshed " +
          "infrequently; ad hoc curtailment; voltage/thermal violations on DER-heavy circuits.",
        diagnosticQuestion:
          "How long does an interconnection study take, and how current is your " +
          "hosting-capacity analysis per circuit?",
      },
      {
        key: "field_workforce_inefficiency",
        name: "Field workforce dispatch inefficiency",
        description:
          "Crews lose productive hours to travel, return trips for wrong " +
          "parts/skills, and manual dispatch; an aging workforce concentrates " +
          "scarce expertise and raises first-time-fix failure costs.",
        detectionSignal:
          "Low crew utilization and first-time-fix rate; high truck rolls per job; " +
          "tribal-knowledge dependence; retirement cliff in senior field roles.",
        diagnosticQuestion:
          "What is your first-time-fix rate and crew utilization, and how exposed " +
          "are you to retirement of senior field expertise?",
      },
      {
        key: "wildfire_storm_tail_risk",
        name: "Wildfire / storm catastrophic-tail risk",
        description:
          "In fire- and storm-prone territories, low-probability/high-" +
          "consequence events (ignitions, major storms) dominate risk and " +
          "liability, forcing blunt instruments (broad PSPS) absent fine-grained risk targeting.",
        detectionSignal:
          "Large high-fire-threat circuit-mileage; broad rather than surgical PSPS " +
          "scope; reactive vegetation management; limited weather/asset risk fusion.",
        diagnosticQuestion:
          "How do you target inspections, vegetation work, and PSPS scope — by " +
          "fine-grained ignition risk, or by coarse geographic rules?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "predictive_asset_health",
        name: "Predictive asset health & failure prediction",
        valueMechanism:
          "Fuse condition telemetry, inspection data, age, and failure history " +
          "to score asset failure probability and prioritize replacement/repair " +
          "before in-service failure — converting unplanned outages and emergency " +
          "capex into planned, lower-cost interventions.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Asset register + nameplate from EAM (Maximo/SAP PM)",
          "Condition telemetry / online monitoring from historian",
          "Inspection and historical failure records",
          "GIS location and environmental exposure",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Replacement decisions carry capital and safety weight — engineer reviews scores",
          "Garbage-in risk: poor asset-data quality produces confident-but-wrong risk scores",
        ],
        metricsMoved: [
          "asset_failure_rate",
          "predictive_maintenance_coverage",
          "capex_efficiency",
          "saifi",
        ],
      },
      {
        key: "fault_location_flisr",
        name: "AI fault location & FLISR-assisted restoration",
        valueMechanism:
          "Use SCADA/AMI signals and grid topology to pinpoint fault location " +
          "and recommend (or, where automated, execute) isolation and service " +
          "restoration switching — compressing the detect-to-restore chain.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Real-time SCADA / IED fault signals",
          "ADMS connectivity model and switch states",
          "AMI last-gasp / restoration signals",
          "OMS event and crew status",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Switching affects worker and public safety — automated actions stay within NERC/utility protection rules",
          "Topology model errors can mislead isolation; operator retains override",
        ],
        metricsMoved: [
          "outage_restoration_time",
          "caidi",
          "saidi",
        ],
      },
      {
        key: "der_load_forecasting",
        name: "DER-aware load & net-load forecasting",
        valueMechanism:
          "Probabilistic feeder-level forecasting that decomposes native load, " +
          "behind-the-meter solar, storage, and EV charging — improving " +
          "switching, capacity planning, and DER dispatch decisions.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "AMI interval data at feeder/transformer granularity",
          "Weather and irradiance feeds",
          "DER interconnection registry (nameplate, location)",
          "Historical realized load and reverse-flow events",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Forecast misses can drive bad switching — surface uncertainty bands, not point values",
          "Privacy constraints on AMI data shape what features are usable",
        ],
        metricsMoved: [
          "load_forecast_accuracy",
          "der_hosting_capacity",
        ],
      },
      {
        key: "wildfire_vegetation_risk",
        name: "Wildfire ignition & vegetation risk targeting",
        valueMechanism:
          "Score circuit-segments for ignition risk by fusing asset condition, " +
          "vegetation encroachment (LiDAR/satellite), weather, and terrain — " +
          "targeting inspections, vegetation work, hardening, and surgical PSPS " +
          "instead of blunt geographic rules.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "GIS asset and vegetation layers",
          "Satellite/LiDAR/aerial imagery",
          "Fire-weather and fuel-moisture feeds",
          "Asset condition and historical ignition events",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "PSPS de-energization decisions are high-consequence public-safety calls — human authority required",
          "Model false-negatives carry catastrophic liability — bias toward caution and validate",
        ],
        metricsMoved: [
          "wildfire_risk_index",
          "saidi",
          "capex_efficiency",
        ],
      },
      {
        key: "field_workforce_optimization",
        name: "Field workforce dispatch & first-time-fix optimization",
        valueMechanism:
          "Optimize crew scheduling, routing, and parts/skills matching, and " +
          "surface job-specific guidance to crews — raising utilization and " +
          "first-time-fix while preserving safety and switching procedures.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Mobile workforce management dispatch and timesheet data",
          "Work order and parts/inventory data from EAM",
          "Crew skills/certifications and location",
          "GIS routing and asset access constraints",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Dispatch must respect safety, union work rules, and switching authority",
          "Over-optimizing utilization can erode safety margins and morale",
        ],
        metricsMoved: [
          "field_crew_utilization",
          "outage_restoration_time",
        ],
      },
      {
        key: "outage_prediction_storm",
        name: "Storm outage prediction & response staging",
        valueMechanism:
          "Predict outage volume and geography ahead of storms from weather, " +
          "asset, and vegetation data — pre-staging crews, mutual aid, and " +
          "materials to shorten restoration and reduce customer-minutes lost.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical storm outage records (OMS)",
          "Forecast weather and storm-track feeds",
          "Asset and vegetation exposure (GIS)",
          "Crew and mutual-aid availability",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Staging decisions commit costly resources — operators weigh model against judgment",
          "Major Event Days are excluded from reliability indices, so value is in response cost and customer experience",
        ],
        metricsMoved: [
          "outage_restoration_time",
          "saidi",
          "field_crew_utilization",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "ot_it_data_foundation",
        name: "Unified OT/IT grid & asset data foundation",
        description:
          "A governed integration layer that time-aligns SCADA/ADMS/OMS, the " +
          "asset historian, GIS connectivity, and EAM into a trustworthy, " +
          "queryable asset-and-grid data model — the prerequisite every other " +
          "use case depends on.",
        boundary:
          "Owns data integration, quality, and the common asset/grid model; does " +
          "not own real-time control (stays read-aligned with SCADA/ADMS).",
        humanAccountabilityPoint: "VP Grid Data & Analytics (with OT/cyber sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "asset_health_program",
        name: "Risk-based asset health & investment program",
        description:
          "Asset failure-risk scoring feeding a risk-based replacement and " +
          "maintenance plan, so capital targets the assets most likely to fail " +
          "and most consequential to reliability and safety.",
        boundary:
          "Owns asset risk scoring and prioritization; does not make final " +
          "capital approvals or override engineering standards.",
        humanAccountabilityPoint: "Director of Asset Management",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "adms_outage_intelligence",
        name: "ADMS-integrated outage & restoration intelligence",
        description:
          "Fault-location and FLISR-assisted restoration layered on the ADMS " +
          "connectivity model and OMS, recommending isolation/restoration " +
          "switching within protection rules to compress restoration time.",
        boundary:
          "Owns fault analytics and restoration recommendations; switching " +
          "execution stays under operator/automation authority per protection scheme.",
        humanAccountabilityPoint: "Distribution Operations / Control Center Manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "der_grid_edge_platform",
        name: "DER integration & grid-edge management platform",
        description:
          "Hosting-capacity analysis, DER-aware forecasting, and interconnection " +
          "workflow that let the utility connect renewables faster while keeping " +
          "feeders within thermal and voltage limits.",
        boundary:
          "Owns hosting-capacity, forecasting, and interconnection screening; does " +
          "not own market settlement or wholesale dispatch.",
        humanAccountabilityPoint: "Director of Grid Modernization / DER Integration",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Grid-operations value is unlocked in a strict order: the OT/IT data " +
        "foundation must exist before predictive asset health, fault analytics, " +
        "or DER forecasting can deliver. Once data is trustworthy, value " +
        "compounds — predictive maintenance avoids unplanned outages and " +
        "emergency capex (SAIFI, asset failure rate, capex efficiency); fault " +
        "analytics and field optimization compress restoration (CAIDI, SAIDI); " +
        "DER and wildfire targeting protect against the volatile and " +
        "catastrophic tails. The durable wins are reliability and risk-adjusted " +
        "capital efficiency, not raw labor reduction.",
      dominantHaircutFactors: [
        {
          factor: "OT/IT data readiness & quality",
          rationale:
            "Asset, GIS, and telemetry data are frequently incomplete or " +
            "mis-aligned; until the data foundation is real, modeled value is " +
            "largely unrealizable — this is the single largest haircut.",
          typicalHaircut: {
            low: 0.25,
            high: 0.5,
            basis: "Repeated experience where grid/asset data quality capped delivered value",
            label: "planning-range",
          },
        },
        {
          factor: "Regulatory & safety constraints on automation",
          rationale:
            "NERC reliability standards and public-safety obligations cap how " +
            "autonomously switching, de-energization, and asset decisions can be " +
            "made, so a share of theoretical automation value is bounded by human-control requirements.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Automation scope limited by protection rules and operator authority",
            label: "planning-range",
          },
        },
        {
          factor: "Field & operations adoption",
          rationale:
            "Crews, dispatchers, and control-room operators must trust and act " +
            "on recommendations; union work rules, training, and tribal-knowledge " +
            "dependence slow adoption and leave value on the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "Field/control-room change-management experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Unplanned outage reduction from predictive asset health",
          range: {
            low: 0.1,
            high: 0.3,
            basis: "Reported asset-failure-driven outage reductions where data was adequate",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in asset-failure-driven SAIFI contribution",
        },
        {
          lever: "Restoration-time compression from fault analytics / FLISR",
          range: {
            low: 0.15,
            high: 0.4,
            basis: "Detect-to-restore reductions from fault location + automated switching",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in mean outage restoration time (CAIDI)",
        },
        {
          lever: "Emergency-to-planned capex shift",
          range: {
            low: 0.05,
            high: 0.2,
            basis: "Replacement-cost savings from converting emergency to planned work",
            label: "planning-range",
          },
          measuredAs: "Reduction in emergency replacement cost as a share of asset capex",
        },
      ],
      timeToValueBand:
        "OT/IT data foundation: 3-6 quarters (the gating investment). Field " +
        "workforce optimization: 2-3 quarters. Predictive asset health and fault " +
        "analytics: 3-5 quarters once data is trustworthy. Wildfire/DER programs " +
        "are multi-year and territory-dependent.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ADMS / DMS (Advanced Distribution Management System)",
          role:
            "Real-time distribution operations: connectivity model, switching, " +
            "FLISR, and the operational source of truth for grid state.",
          examples: ["GE/GridOS ADMS", "Schneider EcoStruxure ADMS", "Oracle/OSI"],
        },
        {
          name: "OMS (Outage Management System)",
          role: "System of record for outage events, restoration, and reliability indices.",
          examples: ["Oracle NMS/OMS", "GE PowerOn", "Schneider ADMS-OMS"],
        },
        {
          name: "SCADA & historian",
          role:
            "Telemetry acquisition and time-series storage for grid and asset " +
            "condition signals (IEDs, sensors).",
          examples: ["OSIsoft/AVEVA PI historian", "SCADA RTUs/IEDs"],
        },
        {
          name: "GIS (Geographic Information System)",
          role: "Asset location, network connectivity, and as-built network model.",
          examples: ["Esri ArcGIS Utility Network", "Schneider ArcFM"],
        },
        {
          name: "EAM / asset management & mobile workforce",
          role:
            "Asset register, work orders, maintenance strategy, and field crew dispatch.",
          examples: ["IBM Maximo", "SAP PM/EAM", "Mobile workforce management (e.g. ClickSoftware/IFS)"],
        },
      ],
      roles: [
        {
          title: "VP Grid Operations / Chief Operating Officer (Utility)",
          accountability: "End-to-end reliability, safety, and operating cost of the grid.",
        },
        {
          title: "Director of Asset Management",
          accountability: "Asset health, maintenance strategy, and risk-based capital prioritization.",
        },
        {
          title: "Distribution Operations / Control Center Manager",
          accountability: "Real-time grid state, switching, and outage restoration.",
        },
        {
          title: "Director of Grid Modernization / DER Integration",
          accountability: "DER interconnection, hosting capacity, and grid-edge readiness.",
        },
        {
          title: "Vegetation Management / Wildfire Mitigation Lead",
          accountability: "Ignition risk, vegetation work, inspections, and PSPS execution.",
        },
      ],
      regulatoryFrames: [
        {
          name: "NERC Reliability Standards (incl. CIP)",
          relevance:
            "Mandatory bulk-electric-system reliability and critical-infrastructure " +
            "protection standards that bound automation, data handling, and operations.",
        },
        {
          name: "FERC / state public utility commission oversight",
          relevance:
            "Rate cases, performance-based regulation, and reliability reporting set " +
            "the incentives (and penalties) that justify grid investments.",
        },
        {
          name: "IEEE 1366 reliability indices standard",
          relevance:
            "Defines SAIDI/SAIFI/CAIDI and Major Event Day classification used for benchmarking and reporting.",
        },
        {
          name: "State wildfire mitigation & safety regulation",
          relevance:
            "In fire-prone territories, mandates wildfire mitigation plans, inspections, and PSPS protocols.",
        },
      ],
      canonicalTerms: [
        {
          term: "SAIDI / SAIFI / CAIDI",
          definition:
            "IEEE 1366 reliability indices: outage duration per customer, frequency per customer, and duration per interruption.",
        },
        {
          term: "FLISR",
          definition:
            "Fault Location, Isolation, and Service Restoration — automated/assisted switching to restore unfaulted sections quickly.",
        },
        {
          term: "DER",
          definition:
            "Distributed Energy Resources — behind- or in-front-of-meter solar, storage, EVs, and controllable load on the distribution grid.",
        },
        {
          term: "Hosting capacity",
          definition:
            "The amount of DER a circuit can accommodate before thermal, voltage, or protection limits are violated.",
        },
        {
          term: "PSPS",
          definition:
            "Public Safety Power Shutoff — proactive de-energization of high-risk circuits to prevent wildfire ignition.",
        },
        {
          term: "Major Event Day (MED)",
          definition:
            "An IEEE 1366 day exceeding a statistical threshold, typically excluded when reporting baseline reliability indices.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Reliability indices (SAIDI/SAIFI/CAIDI)",
        authoritativeSource: "OMS outage records normalized to IEEE 1366",
        whatGoodEvidenceLooksLike:
          "Indices computed per IEEE 1366 with explicit MED treatment, by feeder and over a trailing period.",
        weakEvidenceToReject:
          "A single headline SAIDI number with no statement of whether Major Event Days are included.",
      },
      {
        claim: "Asset failure rate and condition",
        authoritativeSource: "Asset historian + EAM failure events vs installed population",
        whatGoodEvidenceLooksLike:
          "Failures per population by asset class and age, joined to condition telemetry and inspection records.",
        weakEvidenceToReject:
          "Anecdotal 'transformers are failing more' with no population denominator or class breakdown.",
      },
      {
        claim: "Load / demand forecast accuracy",
        authoritativeSource: "Forecast vs metered/AMI realized load at the stated granularity",
        whatGoodEvidenceLooksLike:
          "MAPE reported separately at system and feeder level over a defined horizon, noting DER/EV treatment.",
        weakEvidenceToReject:
          "A system-level accuracy figure presented as if it applied to volatile DER-heavy feeders.",
      },
      {
        claim: "DER hosting capacity / interconnection headroom",
        authoritativeSource: "Hosting-capacity power-flow analysis vs interconnected DER nameplate",
        whatGoodEvidenceLooksLike:
          "Per-circuit hosting capacity from a dated power-flow study compared to current interconnected DER.",
        weakEvidenceToReject:
          "A territory-wide percentage with no per-circuit study or analysis date.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What are your SAIDI/SAIFI/CAIDI with and without Major Event Days, and at what granularity (system vs feeder)?",
      "Can you join an asset's nameplate, GIS location, condition telemetry, and outage history without manual reconciliation?",
      "What share of critical assets are on condition-based (not time-based) maintenance, and what is your emergency-to-planned replacement ratio?",
      "How is a fault located today, and what share of restoration time is finding the fault versus repairing it?",
      "How accurate are your feeder-level forecasts, and do they account for behind-the-meter solar, storage, and EV load?",
      "How current is your per-circuit hosting-capacity analysis, and how long does a DER interconnection study take?",
      "In fire/storm-prone areas, how do you target inspections, vegetation work, and PSPS scope — by fine-grained risk or coarse geography?",
    ],
    maturitySignals: [
      "A governed OT/IT data model time-aligns SCADA/ADMS/OMS/GIS/historian/EAM without hand-merging.",
      "Capital is targeted by asset failure risk, not just age or fixed cycles.",
      "Fault location and FLISR compress restoration rather than crews patrolling lines to find faults.",
      "Hosting-capacity maps and feeder forecasts are refreshed routinely and account for DER.",
      "Wildfire/storm response is targeted by fused risk models, not blanket geographic rules.",
    ],
    redFlags: [
      "Reliability indices are reported without stating Major Event Day treatment — the headline number is not comparable.",
      "Asset, GIS, and telemetry data cannot be joined without manual reconciliation — no usable data foundation.",
      "Critical assets are run-to-fail or time-based with little condition telemetry, so failures are found after outages.",
      "Feeder forecasts and hosting-capacity maps are stale while DER penetration is rising fast.",
      "AI is proposed for autonomous switching or de-energization without explicit operator authority and protection-rule boundaries.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "ADMS / OMS platform vendors",
        category: "Real-time distribution operations / outage management",
        switchingCost:
          "Extreme — the connectivity model, switching, and protection integration are deeply embedded; replacement is a multi-year program.",
        renewalDynamics:
          "Long enterprise terms tied to grid-modernization programs; rarely re-sourced standalone.",
      },
      {
        vendorName: "Esri / GIS network model vendors",
        category: "Geospatial asset & network model",
        switchingCost:
          "High — the network model and integrations to ADMS/OMS/EAM are foundational; migration (e.g. to Utility Network) is itself a major project.",
        renewalDynamics:
          "Platform standard for most utilities; negotiate on extension modules and migration services.",
      },
      {
        vendorName: "Asset analytics & predictive-maintenance vendors",
        category: "Asset health / failure prediction",
        switchingCost:
          "Moderate — integrate via historian/EAM feeds; replaceable with data-mapping effort, watch model lock-in.",
        renewalDynamics:
          "Fast-moving market; favor outcome-based terms, explainability, and data/exit rights.",
      },
      {
        vendorName: "DER management / grid-edge & forecasting vendors",
        category: "DER integration / hosting capacity / forecasting",
        switchingCost:
          "Moderate — workflow-embedded but swappable; emerging category with evolving standards.",
        renewalDynamics:
          "Immature pricing; pilot-to-scale gating and interoperability commitments protect the buyer.",
      },
    ],
    switchingCosts:
      "The operational core (ADMS/OMS) and the GIS network model are effectively " +
      "non-switchable in isolation; the negotiable value frontier is the analytics " +
      "and grid-edge layer around them, where switching cost is moderate.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured reliability or asset-risk reduction",
      "Open data access and integration standards to avoid OT lock-in",
      "Explainability and audit access as contractual requirements (safety/regulatory exposure)",
      "Pilot-to-scale gating with parity proof on the utility's own data before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      reliability_metric: [
        "OMS outage records",
        "IEEE 1366 normalization",
        "explicit MED treatment",
      ],
      asset_risk_claim: [
        "asset historian / condition telemetry",
        "EAM failure events",
        "installed population denominator",
      ],
      forecast_accuracy: [
        "forecast vs realized AMI/metered load",
        "stated granularity (system vs feeder)",
      ],
      der_capacity_claim: [
        "hosting-capacity power-flow study",
        "interconnected DER nameplate",
        "study date",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. data readiness)",
      ],
    },
    citationStandard:
      "Quantitative grid claims cite the OMS/historian/EAM/GIS source and the " +
      "period, and state IEEE 1366 MED treatment and granularity. Value " +
      "projections cite a baseline plus a labelled planning range and the " +
      "haircut factors applied — never a single asserted ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's OT/IT data foundation is immature — frame predictive/forecast value as conditional on data readiness, not as an achievable number.",
      "Reliability indices are quoted without MED treatment — present as not-yet-comparable and ask for normalization.",
      "Benchmarks are cited without the tenant's own baseline — present as planning ranges.",
      "Vendor-reported asset/forecast outcomes are cited — mark as vendor claims pending validation on the tenant's data.",
    ],
    inferenceLanguage: [
      "Across distribution utilities, SAIDI/SAIFI typically run...",
      "Without your asset and OT data, the industry pattern suggests...",
      "Peer utilities at this DER penetration commonly see...",
      "Where the data foundation is solid, programs of this type have delivered...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this tenant",
      "This tenant's actual reliability indices or asset failure rates",
      "A claim that a specific feeder or asset class is failing for this tenant",
      "A specific wildfire ignition or PSPS recommendation without the tenant's risk data",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "reliability index trend / SAIDI or SAIFI over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend SAIDI/SAIFI over periods, ideally with MED-included vs excluded series.",
    },
    {
      questionPattern: "asset failure or outage cause breakdown / contributors to lost customer-minutes",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack customer-minutes lost (or failures) by cause/asset class to show where reliability leaks.",
    },
    {
      questionPattern: "reliability or cost impact of a grid program / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current reliability/cost to projected, with data-readiness and other haircuts shown.",
    },
    {
      questionPattern: "asset risk ranking / which assets to replace first",
      exhibitKind: "table",
      note: "Risk-ranked assets: failure probability, consequence, condition, recommended action.",
    },
    {
      questionPattern: "grid operations KPI scorecard",
      exhibitKind: "table",
      note: "SAIDI, SAIFI, CAIDI, asset failure rate, predictive-maintenance coverage, forecast MAPE vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The OT/IT data foundation is funded and treated as the first deliverable, not an afterthought",
      "Capital and maintenance are re-targeted by asset risk, with engineering owning the decisions",
      "Automation scope is designed within NERC/protection rules so operators trust and adopt it",
      "Field and control-room staff are engaged early so recommendations are acted on, not ignored",
    ],
    failureDrivers: [
      "Analytics bought before the data foundation exists — models are confident but unusable",
      "Underestimating OT/IT integration effort and data-quality remediation",
      "Proposing autonomy that exceeds regulatory/safety bounds, which stalls in review and erodes trust",
      "Treating it as a labor-reduction play rather than a reliability and capital-efficiency play",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Field workforce optimization and storm-response staging adopt first because the " +
      "value is tangible and the workflow change is contained; predictive asset health " +
      "and fault analytics follow once the data foundation is trustworthy; autonomous " +
      "switching and wildfire de-energization are last, gated by safety, regulation, and operator trust.",
    roiClarity: "medium",
    roiClarityBasis:
      "Reliability outcomes (SAIDI/SAIFI/CAIDI) and avoided emergency capex are " +
      "measurable, but attribution is muddied by weather variability and the heavy " +
      "dependence of delivered value on OT/IT data readiness — which makes ROI firm " +
      "where data is good and speculative where it is not.",
  },

  regulatoryFrame: {
    name: "NERC Reliability Standards & state PUC oversight",
    relevance:
      "The dominant regulatory frame for grid operations: NERC reliability and " +
      "CIP standards bound how autonomously the grid can be operated and how data " +
      "is handled, while FERC/state-commission performance regulation sets the " +
      "reliability targets and incentives that justify investment. IEEE 1366 and " +
      "state wildfire-mitigation rules also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
