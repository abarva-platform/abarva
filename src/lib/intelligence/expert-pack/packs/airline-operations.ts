// Consilium expert — Airline Operations & Revenue Management.
//
// W3 wave-3 industry-function ExpertPack. Domain: the running of a network
// airline — irregular-operations (IROPS) recovery, crew & fleet scheduling,
// maintenance (MRO / predictive), revenue management & dynamic pricing, fuel,
// on-time performance, and customer disruption handling.
//
// Honesty posture baked into the content: airline operations are SAFETY-FIRST
// and tightly regulated, so automation is bounded — a recommendation engine
// proposes, but a licensed dispatcher / captain / maintenance authority owns
// the decision. Operations are also tightly COUPLED: a single delay, a misrouted
// aircraft, or an out-of-hours crew cascades through the network within hours,
// so value and risk both propagate. Content is operator-aware, not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const airlineOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.airline.operations-revenue-management",
    expertName: "Airline Operations & Revenue Management Expert",
    kind: "industry-function",
    industry: "airline",
    functionKey: "operations-revenue-management",
    scopeNote:
      "The day-of and near-day operation of a network airline plus the " +
      "commercial yield engine on top of it: IROPS recovery and the Operations " +
      "Control Center (OCC), crew and fleet scheduling and recovery, line and " +
      "base maintenance (MRO, predictive/condition-based), revenue management " +
      "and dynamic pricing, fuel optimization, on-time / completion performance, " +
      "and proactive passenger disruption handling. Bounded by safety and " +
      "regulatory authority — automation advises; licensed humans (dispatch, " +
      "captain, maintenance sign-off) decide. Excludes aircraft/engine " +
      "manufacturing, airport authority operations, and corporate finance.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "on_time_performance",
        name: "On-time performance (A14 / D0)",
        definition:
          "Share of flights arriving within 14 minutes of schedule (A14), and " +
          "departures pushing back on schedule (D0). The headline punctuality metric.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 85,
          basis:
            "DOT Air Travel Consumer Report ranges and IATA punctuality data; " +
            "best-in-class network carriers run mid-80s, weather-driven hubs lower",
          label: "planning-range",
        },
        dataSource:
          "ACARS OUT/OFF/ON/IN (OOOI) times vs published schedule in the ops control system",
        whyItMatters:
          "The most visible operating-quality signal — drives connection " +
          "reliability, DOT reporting, customer trust, and is the metric the " +
          "operation is run against day to day.",
      },
      {
        key: "completion_factor",
        name: "Completion factor",
        definition:
          "Share of scheduled flights actually operated (not cancelled), by " +
          "count of departures.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 98,
          high: 99.5,
          basis:
            "Carrier operational reports; below ~98% signals systemic crew, " +
            "fleet, or weather fragility",
          label: "planning-range",
        },
        dataSource: "Cancelled vs scheduled departures in the ops control / scheduling system",
        whyItMatters:
          "Cancellations are the most expensive disruption — they strand crews " +
          "and aircraft out of position and trigger the largest re-accommodation " +
          "and compensation costs; small completion-factor moves are large dollars.",
      },
      {
        key: "load_factor",
        name: "Passenger load factor",
        definition:
          "Revenue passenger-miles (RPM) divided by available seat-miles (ASM) — " +
          "the share of available capacity that is sold.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 87,
          basis:
            "IATA / carrier traffic reports; mature network carriers run low-to-mid 80s, " +
            "higher is not always better if achieved by discounting yield",
          label: "planning-range",
        },
        dataSource: "RPM and ASM from the revenue-accounting and scheduling systems",
        whyItMatters:
          "The utilization side of the unit-revenue equation; load factor read " +
          "alone is misleading — it must be paired with yield (RASM) because a " +
          "full aircraft sold cheap can earn less than a fuller-priced one.",
      },
      {
        key: "rasm",
        name: "RASM (revenue per available seat-mile)",
        definition:
          "Total operating revenue divided by available seat-miles — the unit " +
          "revenue the network earns per unit of capacity flown.",
        unit: "cents per ASM",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 12,
          high: 18,
          basis:
            "US network-carrier 10-Q/10-K disclosures; varies sharply by stage " +
            "length, region, and cabin mix",
          label: "planning-range",
        },
        dataSource: "Operating revenue / ASM from revenue accounting and capacity plan",
        whyItMatters:
          "The commercial north star revenue management optimizes — the spread " +
          "of RASM over CASM is the network's operating margin per seat-mile.",
      },
      {
        key: "casm",
        name: "CASM (cost per available seat-mile)",
        definition:
          "Total operating expense divided by available seat-miles — the unit " +
          "cost of producing capacity. Often quoted ex-fuel to isolate controllables.",
        unit: "cents per ASM",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 16,
          basis:
            "Carrier disclosures; low-cost carriers sit at the low end, network " +
            "carriers higher; stage length drives much of the spread",
          label: "planning-range",
        },
        dataSource: "Operating expense / ASM from the financial and capacity systems",
        whyItMatters:
          "The cost denominator every efficiency program is judged on — and the " +
          "metric stage-length and gauge changes distort, so trend and ex-fuel " +
          "views matter more than the headline.",
      },
      {
        key: "fuel_cost_per_asm",
        name: "Fuel cost per ASM",
        definition:
          "Jet-fuel expense divided by available seat-miles — the fuel component " +
          "of unit cost, sensitive to price, burn, and tankering decisions.",
        unit: "cents per ASM",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2.5,
          high: 5,
          basis:
            "Carrier fuel disclosures across recent price cycles; swings with " +
            "crude and fleet fuel efficiency",
          label: "planning-range",
        },
        dataSource: "Fuel expense (price x uplift) / ASM from fuel management and accounting",
        whyItMatters:
          "Fuel is typically the largest or second-largest cost line; small " +
          "burn improvements (routing, weight, tankering, single-engine taxi) " +
          "compound across the whole flying program.",
      },
      {
        key: "irops_recovery_time",
        name: "IROPS recovery time",
        definition:
          "Elapsed time from the onset of an irregular-operations event (storm, " +
          "ATC ground stop, crew/aircraft shortfall) to the network returning to " +
          "the published schedule.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 12,
          high: 48,
          basis:
            "OCC operator experience; depends on event severity, hub topology, " +
            "and reserve crew/aircraft depth — wide by design",
          label: "planning-range",
        },
        dataSource:
          "Event start vs schedule-restored timestamps in the OCC / recovery system",
        whyItMatters:
          "Recovery speed governs the total cost of a disruption — every extra " +
          "hour out of schedule cascades more misconnects, crew illegalities, " +
          "and re-accommodation spend across the coupled network.",
      },
      {
        key: "crew_utilization",
        name: "Crew utilization",
        definition:
          "Productive (block / duty) hours flown as a share of paid, legally " +
          "available crew hours — net of reserve, training, and contractual limits.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 85,
          basis:
            "Carrier crew-planning experience; bounded by FAR 117 / FTL duty " +
            "and rest rules and union contract terms, so 100% is neither legal nor safe",
          label: "planning-range",
        },
        dataSource: "Block/duty hours vs available hours from the crew management system",
        whyItMatters:
          "Crew is a top-three cost and the binding constraint in most recoveries; " +
          "utilization must be raised WITHOUT eroding legality margin, or it " +
          "trades cost today for cancellations tomorrow.",
      },
      {
        key: "aircraft_turn_time",
        name: "Aircraft turn time",
        definition:
          "Elapsed ground time from arrival (IN) to next departure (OUT) for a " +
          "given station and gauge — the speed of turning an aircraft.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 35,
          high: 60,
          basis:
            "Narrowbody domestic turns; widebody and international turns are far " +
            "longer — range is gauge- and station-dependent",
          label: "planning-range",
        },
        dataSource: "OOOI ground time by station and tail in the ops control system",
        whyItMatters:
          "Turn time sets achievable aircraft utilization and schedule buffer; " +
          "tight turns lift productivity but thin the buffer that absorbs delay, " +
          "so it trades efficiency against on-time resilience.",
      },
      {
        key: "misconnect_rate",
        name: "Passenger misconnect rate",
        definition:
          "Share of connecting passengers who miss their onward flight due to a " +
          "late inbound or insufficient connection time.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.5,
          high: 4,
          basis:
            "Hub-carrier operator experience; rises sharply on IROPS days and " +
            "with aggressive minimum-connect-time banks",
          label: "planning-range",
        },
        dataSource:
          "Connecting itineraries vs actual arrival/departure times in the PSS / ops system",
        whyItMatters:
          "Misconnects are the customer-felt face of a delay and a direct " +
          "re-accommodation cost; they concentrate at hubs and are the lever " +
          "proactive disruption handling targets first.",
      },
      {
        key: "maintenance_delay_rate",
        name: "Maintenance delay / cancellation rate",
        definition:
          "Share of departures delayed or cancelled for a mechanical / maintenance " +
          "cause, by count.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 2,
          basis:
            "Carrier reliability reporting; predictive/condition-based maintenance " +
            "programs target the low end",
          label: "planning-range",
        },
        dataSource:
          "Delay/cancellation cause codes (maintenance) in the ops and MRO systems",
        whyItMatters:
          "Mechanical disruptions are largely controllable through reliability " +
          "engineering and predictive maintenance, and they strand aircraft out " +
          "of position — the prime target for condition-based maintenance value.",
      },
      {
        key: "schedule_reliability_dispatch",
        name: "Dispatch reliability",
        definition:
          "Share of revenue departures completed without a technical delay over " +
          "a defined threshold (commonly 15 minutes) attributable to the aircraft.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 98.5,
          high: 99.7,
          basis:
            "OEM/operator dispatch-reliability targets by fleet type; mature " +
            "fleets run high-99s",
          label: "planning-range",
        },
        dataSource: "Technical delay events vs revenue departures by fleet type",
        whyItMatters:
          "The fleet-health complement to maintenance delay rate; a falling " +
          "dispatch reliability on a fleet is an early warning of a systemic " +
          "reliability problem before it shows up as cancellations.",
      },
    ],

    painThemes: [
      {
        key: "disruption_cascade",
        name: "Coupled-network disruption cascade",
        description:
          "A single weather event, ATC ground stop, or mechanical at a hub " +
          "strands an aircraft and crew out of position; the shortfall propagates " +
          "to downstream flights for hours because the network is tightly coupled " +
          "and reserve depth is thin.",
        detectionSignal:
          "A localized morning delay growing into multi-station afternoon " +
          "cancellations; recovery time far exceeding the original event window; " +
          "reserve crew exhausted before the bank clears.",
        diagnosticQuestion:
          "When a hub takes a 2-hour weather hit, how long until you are back on " +
          "schedule, and how far downstream do the cancellations spread?",
      },
      {
        key: "crew_legality_wall",
        name: "Crew-legality wall in recovery",
        description:
          "During recovery the binding constraint is rarely aircraft — it is " +
          "crew running out of legal duty time (FAR 117 / flight-time-limitation " +
          "rules) with no legal reserve to swap in, forcing cancellations even " +
          "when aircraft and gates are available.",
        detectionSignal:
          "Cancellations attributed to crew illegality rather than weather; " +
          "reserve utilization at 100% mid-event; recovery plans repeatedly " +
          "broken by an illegal crew pairing.",
        diagnosticQuestion:
          "In your last major IROPS, how many cancellations were crew-legality " +
          "driven versus aircraft or weather, and how deep is your reserve crew pool?",
      },
      {
        key: "siloed_occ_decisions",
        name: "Siloed OCC recovery decisions",
        description:
          "Aircraft routing, crew tracking, maintenance, and customer " +
          "re-accommodation are optimized in separate systems and desks, so a " +
          "recovery plan that looks good for the aircraft is illegal for the crew " +
          "or strands the most passengers — no integrated, cost-aware recovery view.",
        detectionSignal:
          "Recovery decisions made on a shared whiteboard / phone bridge; plans " +
          "reversed because another desk's constraint surfaces late; no single " +
          "objective function across aircraft, crew, and passengers.",
        diagnosticQuestion:
          "Does your OCC have one integrated recovery view that weighs aircraft, " +
          "crew legality, and passenger impact together, or are those decisions " +
          "made on separate desks?",
      },
      {
        key: "reactive_maintenance",
        name: "Reactive (find-and-fix) maintenance",
        description:
          "Mechanical issues are caught at the gate or in scheduled checks rather " +
          "than predicted from sensor/ACARS data, so removals happen out of " +
          "position and unplanned, stranding aircraft and triggering cancellations.",
        detectionSignal:
          "High share of unscheduled removals; AOG (aircraft-on-ground) events " +
          "away from maintenance bases; maintenance delays clustering on specific " +
          "components or tail numbers.",
        diagnosticQuestion:
          "What share of your component removals are unplanned, and do you act on " +
          "sensor/ACARS condition data before failure or wait for the fault?",
      },
      {
        key: "yield_dilution",
        name: "Revenue-management yield dilution",
        description:
          "Fare-class controls and overbooking are set on stale demand forecasts " +
          "and competitor moves, so seats sell too cheap too early (spoiling " +
          "high-yield demand) or sit empty (spoilage) — load factor and yield " +
          "are optimized against each other instead of together.",
        detectionSignal:
          "High load factor with falling RASM; frequent close-in fare sales to " +
          "fill seats; forecast error concentrated on high-demand dates and routes.",
        diagnosticQuestion:
          "How current is the demand forecast driving your fare-class controls, " +
          "and are you optimizing load factor and yield together or trading one " +
          "for the other?",
      },
      {
        key: "fuel_burn_leakage",
        name: "Fuel-burn leakage",
        description:
          "Conservative flight-plan fuel loads, suboptimal cruise altitudes/routes, " +
          "excess tankering, and ground inefficiency (long taxi, both engines) burn " +
          "fuel that better planning and crew adherence would save — at scale, real money.",
        detectionSignal:
          "Wide gap between planned and optimal fuel; low crew adherence to " +
          "single-engine taxi and cost-index speeds; tankering done without a " +
          "current price/weight tradeoff.",
        diagnosticQuestion:
          "Do you measure planned-vs-optimal fuel burn and crew adherence to fuel " +
          "procedures, or is fuel managed mainly by conservative dispatch defaults?",
      },
      {
        key: "disruption_customer_blindspot",
        name: "Customer disruption blind spot",
        description:
          "During IROPS, re-accommodation is reactive and agent-driven at the gate, " +
          "so high-value and tight-connection passengers are not proactively " +
          "rebooked, compensation is inconsistent, and the customer-felt cost of a " +
          "delay far exceeds the operational cost.",
        detectionSignal:
          "Long re-accommodation queues at the gate during IROPS; high involuntary " +
          "downline misconnects with no proactive rebooking; inconsistent " +
          "compensation and goodwill spend.",
        diagnosticQuestion:
          "During a disruption, are connecting and high-value passengers " +
          "proactively rebooked before they misconnect, or handled reactively at the gate?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "integrated_irops_recovery",
        name: "Integrated IROPS recovery optimization",
        valueMechanism:
          "Solve aircraft routing, crew assignment, and passenger re-accommodation " +
          "together against one cost-aware objective so the OCC restores the " +
          "schedule faster and cheaper — turning sequential, siloed firefighting " +
          "into an optimized recovery plan dispatchers approve.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Live flight, tail, and crew tracking (positions, legality clocks)",
          "Crew duty/rest rules and union contract constraints",
          "Passenger itineraries, connections, and value tiers",
          "Maintenance status and aircraft availability",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Licensed dispatchers retain operational-control authority — the engine proposes, they approve",
          "Recovery plans must be guaranteed crew-legal; an illegal proposal is a safety/compliance failure, not just a bad suggestion",
          "Objective weights (cost vs passenger impact) are policy decisions that must stay with ops leadership",
        ],
        metricsMoved: [
          "irops_recovery_time",
          "completion_factor",
          "misconnect_rate",
          "on_time_performance",
        ],
      },
      {
        key: "predictive_maintenance",
        name: "Predictive / condition-based maintenance",
        valueMechanism:
          "Predict component degradation from sensor and ACARS data and schedule " +
          "intervention before failure and in position — converting unplanned, " +
          "out-of-station removals into planned maintenance that does not cancel flights.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Aircraft sensor / ACARS / QAR streams by tail and component",
          "Maintenance and removal history (MRO records)",
          "Component reliability and failure-mode models",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Airworthiness sign-off remains with licensed maintenance authority — predictions inform, they do not release an aircraft to service",
          "False positives ground serviceable aircraft (cost); false negatives are a safety risk — thresholds are safety-weighted, not cost-optimized",
          "Models must respect OEM maintenance program and regulatory task intervals",
        ],
        metricsMoved: [
          "maintenance_delay_rate",
          "schedule_reliability_dispatch",
          "completion_factor",
        ],
      },
      {
        key: "dynamic_revenue_management",
        name: "AI demand forecasting & dynamic pricing",
        valueMechanism:
          "Forecast willingness-to-pay by market, date, and segment and set " +
          "fare-class availability and overbooking dynamically — lifting unit " +
          "revenue by protecting high-yield demand and filling otherwise-spoiled " +
          "seats, optimizing load factor and yield together.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical bookings, fare classes, and no-show / spoilage data",
          "Competitor fares and market schedule data",
          "Forward demand signals (search, shopping, events)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Pricing must comply with fare-filing, consumer-protection, and anti-discrimination rules — no opaque individualized pricing",
          "Overbooking models must respect denied-boarding (DOT/EU261) obligations and bound involuntary bumps",
          "Analyst override of automated controls must be retained for thin markets and disruptions",
        ],
        metricsMoved: ["rasm", "load_factor"],
      },
      {
        key: "crew_optimization_recovery",
        name: "Crew pairing & legality-aware recovery",
        valueMechanism:
          "Build pairings and reserve plans, and re-solve crew assignments in " +
          "disruption, that respect every duty/rest and contract rule — raising " +
          "crew productivity while keeping recovery plans legal, so fewer flights " +
          "cancel for crew illegality.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Crew qualifications, currency, and base/equipment ratings",
          "FAR 117 / FTL duty-rest rules and union contract terms",
          "Live crew tracking and reserve availability",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "A proposed pairing that is not legal is a safety/compliance defect — legality is a hard constraint, never a soft objective",
          "Crew scheduling decisions are contractually governed; automation must encode the agreement, not bypass it",
          "Final crew assignment is owned by crew scheduling under operational control",
        ],
        metricsMoved: [
          "crew_utilization",
          "completion_factor",
          "irops_recovery_time",
        ],
      },
      {
        key: "fuel_optimization",
        name: "Fuel optimization & flight-plan tuning",
        valueMechanism:
          "Optimize route, altitude, cost-index speed, tankering, and discretionary " +
          "fuel against live weather and price, and measure crew adherence — cutting " +
          "fuel burn per ASM across the whole flying program without compromising " +
          "dispatch fuel safety reserves.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Flight plans, actual burn (QAR/ACARS), and weather/winds aloft",
          "Fuel prices by station and tankering economics",
          "Aircraft performance models and cost-index settings",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Minimum dispatch and contingency fuel are regulatory floors — optimization never reduces required reserves",
          "Final fuel load is the captain's and dispatcher's joint decision under operational control",
          "Tankering tradeoffs must include the burn penalty of carrying weight, not just the price spread",
        ],
        metricsMoved: ["fuel_cost_per_asm", "casm"],
      },
      {
        key: "proactive_disruption_care",
        name: "Proactive passenger disruption handling",
        valueMechanism:
          "Predict at-risk connections and proactively rebook and communicate " +
          "with affected passengers — especially high-value and tight-connection " +
          "travelers — before they misconnect, cutting re-accommodation cost and " +
          "the customer-felt cost of a delay.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Live itinerary, connection, and arrival/departure data",
          "Passenger value tier and rebooking preferences",
          "Available alternate seats across the network and partners",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Rebooking must honor fare rules, partner agreements, and DOT/EU261 passenger-rights obligations",
          "Automated communications must be accurate during fast-moving events — wrong rebooking advice erodes trust",
          "Compensation/goodwill policy stays a human-set guardrail, not an autonomous spend decision",
        ],
        metricsMoved: ["misconnect_rate", "on_time_performance"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "integrated_occ",
        name: "Integrated Operations Control Center (OCC) recovery hub",
        description:
          "A single recovery decision surface that fuses aircraft routing, crew " +
          "legality, maintenance status, and passenger impact into one cost-aware " +
          "recommendation the dispatch desk approves — replacing siloed desks and " +
          "phone bridges with an integrated, optimized recovery view.",
        boundary:
          "Owns the integrated recovery RECOMMENDATION and its execution tracking; " +
          "does not hold operational-control authority — licensed dispatch approves " +
          "and the captain commands each flight.",
        humanAccountabilityPoint: "Director of Operations Control (licensed dispatch authority)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "predictive_mro_platform",
        name: "Predictive maintenance & reliability platform",
        description:
          "A condition-based maintenance platform that ingests sensor/ACARS data, " +
          "predicts component degradation, and schedules intervention in position " +
          "and before failure — feeding the MRO planning system and reliability " +
          "engineering.",
        boundary:
          "Owns failure prediction and maintenance-opportunity scheduling; does " +
          "not release aircraft to service — airworthiness sign-off remains with " +
          "the licensed maintenance authority.",
        humanAccountabilityPoint: "VP Maintenance & Engineering / accountable airworthiness manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "rm_dynamic_pricing_engine",
        name: "Revenue management & dynamic pricing engine",
        description:
          "A demand-forecasting and inventory-control engine that sets fare-class " +
          "availability and overbooking dynamically per market and date, with " +
          "analyst override — optimizing unit revenue across the network.",
        boundary:
          "Owns automated fare-class and overbooking controls within filed fares " +
          "and policy; does not file fares or set commercial strategy — those " +
          "remain with pricing and network planning.",
        humanAccountabilityPoint: "VP Revenue Management & Pricing",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ops_data_foundation",
        name: "Operational data & event foundation",
        description:
          "A unified operational data layer — OOOI/ACARS feeds, crew and tail " +
          "tracking, maintenance and passenger data — that grounds every recovery, " +
          "maintenance, fuel, and revenue model in one consistent, real-time event view.",
        boundary:
          "Owns ingestion, normalization, and serving of operational data and " +
          "lineage; does not make operational decisions — it is the substrate the " +
          "decision systems read.",
        humanAccountabilityPoint: "VP Operations Technology / Chief Data Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value in airline operations compounds through the coupled network: " +
        "preventing or shrinking disruptions (predictive maintenance, faster " +
        "integrated recovery, legality-aware crew plans) protects completion and " +
        "on-time performance, which avoids cascading re-accommodation, crew, and " +
        "compensation cost; the commercial engine (revenue management, fuel " +
        "optimization) widens the RASM-over-CASM spread on the capacity that " +
        "actually flies. The durable wins are reliability and unit-revenue/cost, " +
        "not one-off heroics on a bad weather day — and every benefit is bounded " +
        "by safety reserves and regulatory authority that cannot be optimized away.",
      dominantHaircutFactors: [
        {
          factor: "Safety & regulatory ceiling on automation",
          rationale:
            "Operational control, airworthiness sign-off, crew legality, and " +
            "dispatch fuel reserves are non-negotiable human/regulatory authorities; " +
            "they cap how much of a theoretical optimization can be realized.",
          typicalHaircut: {
            low: 0.2,
            high: 0.4,
            basis:
              "Operator experience where safety/regulatory constraints bound the " +
              "achievable automation envelope",
            label: "planning-range",
          },
        },
        {
          factor: "Data readiness & real-time integration",
          rationale:
            "Recovery, maintenance, and fuel value depend on clean, real-time, " +
            "integrated OOOI/sensor/crew/passenger data; siloed or lagging feeds " +
            "cap what the models can act on.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Implementation experience where operational data was siloed or not real-time",
            label: "planning-range",
          },
        },
        {
          factor: "Crew/labor adoption & contract constraints",
          rationale:
            "Crew utilization and fuel-adherence value require crews and unions " +
            "to operate to the optimized plan; contractual terms and adoption " +
            "friction leave benefit unrealized.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Airline change-management and labor-relations experience",
            label: "planning-range",
          },
        },
        {
          factor: "Competitive & market response",
          rationale:
            "Revenue-management gains erode as competitors re-price and demand " +
            "shifts; forward unit-revenue uplift must be discounted for market response.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Observed erosion of pricing advantages as competitors react",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Fuel burn reduction",
          range: {
            low: 0.01,
            high: 0.05,
            basis:
              "Reported fuel-efficiency program savings (routing, cost-index, " +
              "tankering, single-engine taxi)",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in fuel_cost_per_asm",
        },
        {
          lever: "Unit-revenue (RASM) uplift from dynamic RM",
          range: {
            low: 0.005,
            high: 0.03,
            basis: "Revenue-management program uplift on optimized markets",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in rasm on RM-controlled capacity",
        },
        {
          lever: "IROPS recovery-time compression",
          range: {
            low: 0.1,
            high: 0.3,
            basis: "Integrated-recovery program reductions in time-to-schedule-restored",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in irops_recovery_time",
        },
        {
          lever: "Maintenance-delay reduction",
          range: {
            low: 0.15,
            high: 0.35,
            basis: "Predictive/condition-based maintenance reliability improvements",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in maintenance_delay_rate",
        },
      ],
      timeToValueBand:
        "Fuel optimization and revenue management: 1-3 quarters (data and engines " +
        "often partly exist). Predictive maintenance: 3-6 quarters including model " +
        "calibration and reliability proof. Integrated IROPS recovery: 4-8 quarters " +
        "including OCC process change and dispatcher trust in the recommendations.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Operations control / movement system",
          role: "System of record for flight status, OOOI times, delays, and the day-of operation the OCC runs against.",
          examples: ["Sabre Movement Manager / AirCentre", "Lufthansa Systems NetLine/Ops"],
        },
        {
          name: "Crew management system",
          role: "Holds crew pairings, qualifications, duty/rest legality, and reserve tracking.",
          examples: ["Sabre Crew Manager", "Jeppesen Crew (Boeing)", "AIMS"],
        },
        {
          name: "Maintenance & engineering (M&E) / MRO system",
          role: "Tracks aircraft configuration, maintenance tasks, removals, and airworthiness records.",
          examples: ["AMOS", "TRAX", "IFS Maintenix"],
        },
        {
          name: "Revenue management & pricing system",
          role: "Demand forecasting, fare-class inventory control, overbooking, and pricing.",
          examples: ["PROS", "Sabre AirVision / Revenue Optimizer", "Amadeus Revenue Management"],
        },
        {
          name: "Passenger service system (PSS) / reservations",
          role: "Itineraries, bookings, connections, and re-accommodation during disruption.",
          examples: ["Amadeus Altea", "Sabre PSS", "Navitaire"],
        },
        {
          name: "Flight planning & fuel optimization",
          role: "Computes routes, fuel loads, cost-index, and tankering for each flight.",
          examples: ["Lido/Flight (Lufthansa Systems)", "Sabre Flight Plan Manager", "Jeppesen FliteDeck Pro"],
        },
      ],
      roles: [
        {
          title: "VP / SVP Operations (Network Operations Control)",
          accountability: "End-to-end day-of operation: completion factor, on-time, and recovery.",
        },
        {
          title: "Director of Operations Control / Chief Dispatcher",
          accountability: "Operational control authority over dispatch release and recovery decisions.",
        },
        {
          title: "VP Maintenance & Engineering",
          accountability: "Fleet airworthiness, reliability, and maintenance delay/cancellation rate.",
        },
        {
          title: "VP Revenue Management & Pricing",
          accountability: "Unit revenue (RASM), load-factor/yield balance, and overbooking policy.",
        },
        {
          title: "VP Crew Resources / Crew Scheduling",
          accountability: "Crew legality, utilization, reserve depth, and contract compliance.",
        },
        {
          title: "Captain (Pilot in Command)",
          accountability: "Final command authority over the conduct and fuel of the flight.",
        },
      ],
      regulatoryFrames: [
        {
          name: "FAA Part 121 / operational control & dispatch",
          relevance:
            "Defines operational control and joint captain/dispatcher authority for " +
            "scheduled carriers — the authority automation must defer to.",
        },
        {
          name: "FAR Part 117 / flight-time & duty limitations (and EASA FTL)",
          relevance:
            "Hard limits on crew duty and rest — a non-negotiable constraint on any " +
            "crew schedule or recovery plan.",
        },
        {
          name: "Aircraft airworthiness & maintenance regulation (FAA Part 43/145, EASA Part-M)",
          relevance:
            "Governs maintenance tasks, intervals, and release-to-service sign-off that " +
            "predictive maintenance must respect.",
        },
        {
          name: "DOT consumer-protection rules & EU261",
          relevance:
            "Govern denied boarding, delay/cancellation compensation, and disclosure — " +
            "bounding overbooking and disruption handling.",
        },
      ],
      canonicalTerms: [
        {
          term: "OOOI",
          definition:
            "Out, Off, On, In — the four ACARS-captured gate/flight timestamps that drive on-time and turn metrics.",
        },
        {
          term: "IROPS",
          definition:
            "Irregular operations — disruptions (weather, ATC, mechanical, crew) that knock the operation off schedule.",
        },
        {
          term: "RASM / CASM",
          definition:
            "Revenue and cost per available seat-mile — the unit-revenue and unit-cost basis of airline economics.",
        },
        {
          term: "Completion factor",
          definition:
            "Share of scheduled flights actually operated (not cancelled).",
        },
        {
          term: "Cost index",
          definition:
            "The dispatch/crew speed setting that trades fuel burn against time cost for a flight.",
        },
        {
          term: "AOG",
          definition:
            "Aircraft on ground — an unserviceable aircraft out of revenue service, usually for an unplanned maintenance issue.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "On-time and completion performance",
        authoritativeSource: "OOOI (ACARS) times vs published schedule in the ops control system",
        whatGoodEvidenceLooksLike:
          "A14/D0 and completion factor computed from OOOI timestamps over a trailing period, broken down by station, fleet, and delay cause code.",
        weakEvidenceToReject:
          "A single headline on-time percentage with no cause-code breakdown, period, or definition of the on-time threshold.",
      },
      {
        claim: "IROPS recovery cost and time",
        authoritativeSource: "OCC event log: event start vs schedule-restored timestamps plus re-accommodation and crew cost",
        whatGoodEvidenceLooksLike:
          "Per-event recovery time with the downstream cancellations, misconnects, and crew/re-accommodation cost attributed to it.",
        weakEvidenceToReject:
          "An anecdotal 'the storm cost us a lot' with no event-level time or cost reconstruction.",
      },
      {
        claim: "Maintenance reliability",
        authoritativeSource: "Maintenance delay/cancellation cause codes and removal records in the ops and MRO systems",
        whatGoodEvidenceLooksLike:
          "Maintenance delay rate and unscheduled-removal rate by fleet, component, and tail over a trailing period, joined to dispatch reliability.",
        weakEvidenceToReject:
          "A vendor's predictive-maintenance savings claim with no baseline removal/delay rate from this carrier's own MRO data.",
      },
      {
        claim: "Unit revenue and load/yield balance",
        authoritativeSource: "Revenue accounting (RASM, yield) and capacity plan (ASM) joined to RM-controlled inventory",
        whatGoodEvidenceLooksLike:
          "RASM and load factor by market and date with yield separated out, so a load-factor gain is not mistaken for a revenue gain.",
        weakEvidenceToReject:
          "A load-factor figure presented as a revenue result with no yield or RASM context.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When a hub takes a multi-hour weather or ATC hit, how long until you are back on schedule, and how far downstream do cancellations cascade?",
      "In your last major IROPS, what share of cancellations were crew-legality driven versus aircraft or weather, and how deep is your reserve crew pool?",
      "Does your OCC have one integrated recovery view weighing aircraft, crew legality, and passenger impact together, or are those decisions made on separate desks?",
      "What share of your component removals are unplanned, and do you act on sensor/ACARS condition data before failure?",
      "How current is the demand forecast driving your fare-class controls, and are you optimizing load factor and yield together or trading one for the other?",
      "Do you measure planned-vs-optimal fuel burn and crew adherence to fuel procedures (cost-index, single-engine taxi, tankering)?",
      "During a disruption, are connecting and high-value passengers proactively rebooked before they misconnect, or handled reactively at the gate?",
    ],
    maturitySignals: [
      "Recovery decisions are made on one integrated, cost-aware view that is guaranteed crew-legal, not on separate desks and phone bridges.",
      "Maintenance acts on predicted component condition (sensor/ACARS) and schedules intervention in position before failure.",
      "Revenue management optimizes load factor and yield together against a current demand forecast, with analyst override for thin markets.",
      "Fuel burn is measured planned-vs-optimal with crew adherence tracked, not managed only by conservative dispatch defaults.",
    ],
    redFlags: [
      "IROPS recovery is run on a whiteboard / phone bridge with no integrated, legality-checked recovery plan.",
      "Cancellations are routinely crew-legality driven with reserve crew exhausted mid-event.",
      "Maintenance is reactive — high unscheduled removals and AOG events away from base — with sensor data unused.",
      "High load factor is reported as success while RASM/yield falls, and the two are not optimized together.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Ops/crew/recovery suite (Sabre, Lufthansa Systems, Jeppesen/Boeing, AIMS)",
        category: "Operations control, crew management, recovery optimization",
        switchingCost:
          "High — the ops and crew systems are fused to schedules, contracts, and day-of workflows; replacement is a multi-year program with deep integration and retraining.",
        renewalDynamics:
          "Multi-year enterprise agreements bundled across ops/crew modules; switching is rare and gated on parity proof and data migration.",
      },
      {
        vendorName: "Maintenance & engineering / MRO (AMOS, TRAX, IFS Maintenix)",
        category: "M&E / MRO system of record",
        switchingCost:
          "High — holds the airworthiness record and aircraft configuration; migration is a regulated, evidence-heavy program.",
        renewalDynamics:
          "Long-tenure platform contracts; predictive-maintenance add-ons increasingly negotiated as modules or partner integrations.",
      },
      {
        vendorName: "Revenue management & pricing (PROS, Sabre AirVision, Amadeus)",
        category: "Demand forecasting, inventory control, dynamic pricing",
        switchingCost:
          "Moderate-to-high — integrates with PSS and pricing but is more replaceable than the ops core; model history and analyst trust are the real lock-in.",
        renewalDynamics:
          "Often value-shared or volume-based; AI/dynamic-pricing capabilities are the live differentiator and a negotiation lever.",
      },
      {
        vendorName: "Predictive maintenance / ops AI specialists",
        category: "Condition-based maintenance, fuel and recovery analytics",
        switchingCost:
          "Moderate — integrate via data feeds and are swappable with mapping effort; watch model lock-in and audit/airworthiness-evidence access.",
        renewalDynamics:
          "Emerging, fast-moving market; favor outcome-based terms, explainability, and exit rights over multi-year lock-in.",
      },
    ],
    switchingCosts:
      "The ops, crew, and M&E systems of record are effectively non-switchable in isolation — they are fused to safety-critical workflows and regulated records. The negotiable value frontier is the optimization and AI layer (recovery, predictive maintenance, RM, fuel) around that core, where switching cost is moderate and outcome terms are achievable.",
    negotiationLevers: [
      "Outcome/value-share pricing tied to measured recovery-time, fuel, or reliability improvement",
      "Explainability and airworthiness/audit-evidence access as contractual requirements",
      "Data portability and exit rights to avoid model lock-in on AI add-ons",
      "Pilot-on-a-fleet/region before enterprise commitment, with parity and safety proof gating scale",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      punctuality_metric: ["OOOI/ACARS times", "published schedule", "delay cause codes", "trailing period"],
      reliability_metric: ["maintenance cause codes", "removal records", "fleet/tail breakdown"],
      unit_economics_metric: ["revenue accounting (RASM/yield)", "capacity plan (ASM)", "stage-length normalization"],
      recovery_claim: ["OCC event log", "recovery-time measurement", "attributed downstream cost"],
      value_projection: ["baseline metric", "benchmark planning-range", "explicit haircut factors"],
    },
    citationStandard:
      "Quantitative operational claims cite the OOOI/MRO/revenue source and the " +
      "period and breakdown (station, fleet, market). Recovery and reliability " +
      "claims cite event-level or cause-coded data, not anecdote. Value projections " +
      "cite a baseline plus a labelled planning range and the haircut factors " +
      "applied — never a single asserted dollar or ROI figure, and never a value " +
      "that assumes optimizing past a safety/regulatory floor.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no event-level OCC recovery data — frame recovery-time gains as an industry pattern, not their measured number.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges normalized for stage length and network shape.",
      "Vendor predictive-maintenance or RM uplift figures are cited — mark as vendor claims pending validation against the carrier's own data.",
      "An optimization implies relaxing a crew-legality, fuel-reserve, or airworthiness constraint — flag that the safety/regulatory floor caps the realizable benefit.",
    ],
    inferenceLanguage: [
      "Across network carriers at this scale, on-time and completion typically run...",
      "Without your event-level recovery data, the industry pattern suggests recovery time of...",
      "Peer carriers with comparable hub structure commonly see...",
      "Bounded by safety and crew-legality limits, the realizable share of this is typically...",
    ],
    flagWithoutEvidence: [
      "A specific dollar saving or ROI for this carrier",
      "This carrier's actual recovery time, fuel burn, or maintenance delay rate",
      "A claim that automation can safely exceed a crew-legality, fuel-reserve, or airworthiness limit",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "on-time / delay breakdown by cause or station",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack delay minutes by cause code (weather, ATC, crew, maintenance) and station to show where punctuality leaks.",
    },
    {
      questionPattern: "on-time or completion factor trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend A14/completion factor over periods to show whether operational reliability is improving or deteriorating.",
    },
    {
      questionPattern: "value / cost impact of a recovery or reliability program (value bridge)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current disruption cost to recoverable value with safety/regulatory and adoption haircuts.",
    },
    {
      questionPattern: "which levers move the operation most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of recovery-time, fuel, RM, and maintenance levers by impact range to prioritize the program.",
    },
    {
      questionPattern: "operations & revenue KPI scorecard",
      exhibitKind: "table",
      note: "On-time, completion factor, load factor, RASM/CASM, fuel/ASM, crew utilization, turn time, misconnect and maintenance delay rates vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "An integrated, real-time operational data foundation (OOOI, crew, tail, maintenance, passenger) the models can act on",
      "OCC, crew, and maintenance leadership aligned on one cost-aware recovery objective rather than siloed desk optima",
      "Recovery and crew automation engineered as crew-legal-by-construction so dispatchers trust and approve the recommendations",
      "Revenue management and fuel engines already partly in place, giving fast, measurable early wins to fund the harder recovery work",
    ],
    failureDrivers: [
      "Optimization plans that ignore crew legality or fuel reserves and are rejected by dispatch as unsafe or illegal",
      "Siloed ops/crew/maintenance data so the recovery engine never sees the binding constraint in time",
      "Treating safety and regulatory authority as friction to engineer around rather than a hard ceiling on automation",
      "Chasing load factor as success while yield/RASM erodes, or claiming fuel/RM savings with no baseline to measure against",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Commercial and efficiency engines (revenue management, fuel optimization) " +
      "adopt first because they are analyst-mediated and the ROI is measurable; " +
      "predictive maintenance follows once reliability is proven on a fleet; " +
      "integrated IROPS recovery is the hardest and last — it requires dispatchers " +
      "to trust a recommendation under operational-control authority during a " +
      "high-stakes, fast-moving event, so it scales only after sustained legality " +
      "and quality proof.",
    roiClarity: "medium",
    roiClarityBasis:
      "Fuel and revenue-management ROI are relatively firm because burn and unit " +
      "revenue are directly measured. Recovery and maintenance ROI are harder to " +
      "attribute: the value is an avoided cascade (cancellations, misconnects, " +
      "crew cost) in a tightly coupled network, so counterfactual disruption cost " +
      "must be modeled, and the safety/regulatory ceiling caps how much of a " +
      "theoretical optimum is realizable.",
  },

  regulatoryFrame: {
    name: "Operational control & crew/airworthiness regulation (FAA Part 121, FAR 117, Part 43/145)",
    relevance:
      "The dominant frame bounding automation in airline operations: operational " +
      "control and dispatch authority, crew duty/rest limits, and airworthiness " +
      "sign-off are non-negotiable human/regulatory authorities. AI advises and " +
      "optimizes within these floors; it never relaxes them. DOT/EU261 consumer " +
      "rules and revenue/fare-filing regulation also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
