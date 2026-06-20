// Consilium expert — Airline Ground & Airport Operations.
//
// W3 wave-4 industry-function ExpertPack. Domain: the AIRPORT / STATION / GROUND
// EXECUTION layer of a network airline — aircraft turn management, ramp and
// baggage handling, gate and resource allocation, ground staffing and rostering,
// station performance, de-icing, boarding, baggage mishandling, and ground
// service equipment (GSE).
//
// DISTINCT from the Airline Operations & Revenue Management expert
// (xp.airline.operations-revenue-management), which owns the network /
// day-of-ops CONTROL room (OCC, IROPS recovery, crew/fleet scheduling, MRO,
// revenue management). THIS expert owns the below-the-wing and at-the-gate
// EXECUTION that the network plan depends on: turning a tail on time at a
// station, getting bags on the right aircraft, staffing the ramp through the
// banks, and clearing de-icing in a winter event.
//
// Honesty posture baked into the content: ground operations are LABOR-INTENSIVE,
// frequently outsourced to third-party ground handlers, and constrained by
// UNION/local-labor agreements and WEATHER. They are also the tightly COUPLED
// origin of network delay — one slow turn at a hub strands the tail and cascades
// into downstream departures the OCC then has to recover. Automation here mostly
// SEQUENCES, FORECASTS, and ALERTS humans on the ramp; it does not replace the
// physical, safety-critical work of marshalling, loading, and pushing back an
// aircraft. Content is operator-aware, not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const airlineGroundAirportOpsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.airline.ground-airport-operations",
    expertName: "Airline Ground & Airport Operations Expert",
    kind: "industry-function",
    industry: "airline",
    functionKey: "ground-airport-operations",
    scopeNote:
      "The airport / station / below-the-wing EXECUTION layer of a network " +
      "airline: aircraft turn management and the turnaround critical path, ramp " +
      "and baggage handling, gate and stand allocation and ground-resource " +
      "planning, ground staffing / rostering through the banks, station " +
      "operational performance, de-icing, boarding, baggage mishandling and " +
      "reconciliation, and ground service equipment (GSE). Bounded by the " +
      "physical, labor-intensive, weather- and union-constrained nature of " +
      "ground work and by ramp safety authority — automation sequences, " +
      "forecasts, and alerts; trained ground crews and the ground/ramp " +
      "controller execute and own safety. DISTINCT from the Airline Operations " +
      "& Revenue Management expert, which owns the network control room (OCC, " +
      "IROPS recovery, crew/fleet scheduling, MRO, revenue management); this " +
      "expert owns the turn that the network plan depends on. Excludes air " +
      "traffic control, aircraft maintenance sign-off, and commercial pricing.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "aircraft_turn_time",
        name: "Aircraft turn time",
        definition:
          "Elapsed ground time from arrival (IN / on-blocks) to next departure " +
          "(OUT / off-blocks) at a station for a given gauge — the total time to " +
          "deplane, service, load, board, and push back an aircraft.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 35,
          high: 60,
          basis:
            "Narrowbody domestic turns at the gate; widebody and international " +
            "turns run far longer (90-150+ min). Range is gauge- and " +
            "station-dependent and bounded by the slowest critical-path task",
          label: "planning-range",
        },
        dataSource:
          "On-blocks/off-blocks (IN/OUT) timestamps and turnaround milestone " +
          "events from the ground/airport operations system",
        whyItMatters:
          "The turn is the unit of ground execution; it sets achievable aircraft " +
          "utilization and the schedule buffer, and a turn that overruns its " +
          "scheduled ground time is the most common origin of a delayed departure " +
          "that cascades into the network.",
      },
      {
        key: "on_time_departure",
        name: "On-time departure performance (D0 / D15)",
        definition:
          "Share of departures pushing back on schedule (D0) or within 15 minutes " +
          "(D15) — the station's headline punctuality result for the turn.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 78,
          high: 88,
          basis:
            "Station/handler on-time reporting; best-run stations exceed mid-80s " +
            "D0, weather- and connection-bank-heavy hubs lower",
          label: "planning-range",
        },
        dataSource:
          "Scheduled vs actual off-blocks (OUT) times by station and flight in the ground ops system",
        whyItMatters:
          "On-time departure is the customer- and network-felt result the turn is " +
          "run against; a station that cannot push on time exports delay to every " +
          "downstream flight on the tail's routing.",
      },
      {
        key: "baggage_mishandling_rate",
        name: "Baggage mishandling rate",
        definition:
          "Number of mishandled bags (delayed, damaged, lost, or pilfered) per " +
          "1,000 enplaned passengers.",
        unit: "per 1000 passengers",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 9,
          basis:
            "SITA Baggage IT Insights and DOT mishandled-baggage reporting; " +
            "connecting-heavy hubs and short connect times push the rate up",
          label: "planning-range",
        },
        dataSource:
          "Mishandled-bag reports and BSM/BPM tracking-event reconciliation in the baggage system",
        whyItMatters:
          "Mishandling is the most direct customer-felt failure of ground " +
          "execution and a recurring cost (couriering, compensation); it spikes on " +
          "tight connections and during IROPS, and is the prime target of " +
          "tracking and reconciliation improvement.",
      },
      {
        key: "missed_bag_connection_rate",
        name: "Missed-bag connection rate",
        definition:
          "Share of connecting bags that fail to make their onward flight due to " +
          "insufficient transfer time or a sortation/handling failure.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.5,
          high: 5,
          basis:
            "Hub-carrier transfer-bag experience; rises sharply with sub-minimum " +
            "connect times, late inbounds, and IROPS rebanking",
          label: "planning-range",
        },
        dataSource:
          "Transfer-bag itineraries vs actual sortation/load events in the baggage reconciliation system",
        whyItMatters:
          "The dominant driver of overall mishandling at a connecting hub; a bag " +
          "that misses its connection becomes a delayed delivery and a " +
          "re-flow/courier cost, and concentrates on the same tight banks as " +
          "passenger misconnects.",
      },
      {
        key: "ramp_incident_rate",
        name: "Ramp / ground-damage incident rate",
        definition:
          "Ground-damage and ramp-safety incidents (aircraft ground damage, GSE " +
          "collisions, personal injury) per 1,000 turns or departures.",
        unit: "per 1000 turns",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.2,
          high: 1.5,
          basis:
            "IATA Ground Damage Database / ISAGO-aligned station reporting; varies " +
            "with congestion, training, and GSE condition — safety is the ceiling, not a tradeable lever",
          label: "planning-range",
        },
        dataSource:
          "Safety/ground-damage incident reports and GSE telematics in the station safety system",
        whyItMatters:
          "Ramp safety is a hard ceiling on any speed program — aircraft ground " +
          "damage takes a tail out of service (an AOG the network must recover) and " +
          "injuries are a human and regulatory cost; turn-time gains that lift the " +
          "incident rate are not gains.",
      },
      {
        key: "gate_utilization",
        name: "Gate / stand utilization",
        definition:
          "Share of available gate/stand time that is occupied by a serviceable " +
          "aircraft turn, net of buffer — how hard the constrained gate inventory works.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 80,
          basis:
            "Hub gate-planning experience; too low wastes scarce gates, too high " +
            "removes the buffer that absorbs delay and forces remote/towing operations",
          label: "planning-range",
        },
        dataSource:
          "Gate occupancy vs available gate-hours from the gate-management / stand-allocation system",
        whyItMatters:
          "Gates are a scarce, often slot-constrained resource; utilization read " +
          "alone is misleading — pushing it too high removes the buffer that " +
          "absorbs an off-schedule inbound and triggers costly gate reassignments and tows.",
      },
      {
        key: "ground_staff_productivity",
        name: "Ground staff productivity",
        definition:
          "Turns (or departures) handled per paid ground-staff hour at a station, " +
          "across ramp, baggage, and gate functions.",
        unit: "turns per paid hour",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.15,
          high: 0.45,
          basis:
            "Station labor-planning experience; varies with bank structure, gauge " +
            "mix, and self-handle vs third-party-handler model — bounded by safe minimum crew sizes",
          label: "planning-range",
        },
        dataSource:
          "Turns handled vs rostered/paid ground-staff hours from the workforce-management and ops systems",
        whyItMatters:
          "Ground labor is the largest controllable station cost and the binding " +
          "constraint through the banks; productivity must rise WITHOUT cutting " +
          "below safe crew sizes or it trades cost today for damage and delay tomorrow.",
      },
      {
        key: "deicing_turnaround_time",
        name: "De-icing turnaround time",
        definition:
          "Elapsed time from de-icing request to release for taxi during a winter " +
          "event, including queue wait at the de-icing pad or gate.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8,
          high: 30,
          basis:
            "Winter-operations station experience; queue and holdover-time " +
            "management dominate, and severe events run far longer — bounded by holdover-time safety limits",
          label: "planning-range",
        },
        dataSource:
          "De-icing request vs release timestamps and pad/bay queue events in the winter-ops system",
        whyItMatters:
          "De-icing is the throughput bottleneck of a winter operation; queue and " +
          "holdover-time (HOT) management decide how many flights depart legally " +
          "before fluid expires, and a slow pad cascades the whole morning bank into delay.",
      },
      {
        key: "boarding_time",
        name: "Boarding time",
        definition:
          "Elapsed time from boarding start to doors-closed for a given gauge — " +
          "the gate-side critical-path task most exposed to passenger behavior.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 12,
          high: 30,
          basis:
            "Narrowbody single-aisle boarding; widebody and high-carry-on loads run " +
            "longer. Range is gauge-, load-, and boarding-method-dependent",
          label: "planning-range",
        },
        dataSource:
          "Boarding-start vs doors-closed milestone events in the gate/departure-control system",
        whyItMatters:
          "Boarding is frequently the longest gate-side task and the one most " +
          "likely to blow the turn's critical path; carry-on volume and boarding " +
          "method drive it, so it is a high-leverage, low-capex turn-time target.",
      },
      {
        key: "gse_availability",
        name: "Ground service equipment (GSE) availability",
        definition:
          "Share of required ground service equipment (tugs, belt loaders, GPUs, " +
          "de-icers, pushback tractors) serviceable and available when a turn needs it.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 88,
          high: 97,
          basis:
            "GSE fleet-management experience; below the low end, equipment " +
            "shortfalls become a direct cause of turn delay and unsafe workarounds",
          label: "planning-range",
        },
        dataSource:
          "GSE serviceability and assignment status from the GSE fleet-management / telematics system",
        whyItMatters:
          "A turn cannot beat the availability of its equipment; a missing belt " +
          "loader or pushback tractor delays the departure as surely as a missing " +
          "crew, and electrification is adding charge-state as a new availability constraint.",
      },
      {
        key: "station_cost_per_turn",
        name: "Station cost per turn",
        definition:
          "Fully-loaded ground-handling cost (labor, GSE, third-party handler " +
          "fees, de-icing fluid) per aircraft turn at a station.",
        unit: "USD per turn",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 200,
          high: 1500,
          basis:
            "Station ground-handling cost experience; varies enormously by gauge, " +
            "self-handle vs third-party model, geography, and de-icing season",
          label: "planning-range",
        },
        dataSource:
          "Station labor, GSE, handler-fee, and consumables cost allocated per turn in the cost/ops systems",
        whyItMatters:
          "The unit economics of ground execution and the basis of the " +
          "self-handle-vs-outsource and handler-contract decision; it must be read " +
          "with on-time and damage outcomes, because the cheapest turn that delays " +
          "or damages the aircraft is not the lowest-cost turn.",
      },
      {
        key: "turn_punctuality_to_plan",
        name: "Turnaround milestone adherence",
        definition:
          "Share of turnaround critical-path milestones (deplaning complete, " +
          "fueling complete, loading complete, boarding complete) hit on or before " +
          "their planned time within the turn.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 85,
          basis:
            "Stations running A-CDM / milestone-tracked turns; lower indicates the " +
            "turn is run reactively rather than to a sequenced plan",
          label: "planning-range",
        },
        dataSource:
          "Turnaround milestone (TOBT/TSAT and internal critical-path) events vs plan in the A-CDM / ground ops system",
        whyItMatters:
          "Leading indicator of on-time departure: a turn that misses early " +
          "milestones (deplaning, fueling) almost always pushes late, so milestone " +
          "adherence is where intervention is still possible before the departure is lost.",
      },
    ],

    painThemes: [
      {
        key: "slow_turn_cascade",
        name: "Slow-turn delay cascade into the network",
        description:
          "A single turn overruns its scheduled ground time — a late inbound, a " +
          "missing belt loader, a slow board — and because the tail flies a chain " +
          "of segments, the delay propagates downstream all day; the station-level " +
          "miss becomes a network-level cascade the OCC then has to recover.",
        detectionSignal:
          "Departure delays whose root cause is a ground/turn overrun rather than " +
          "weather or ATC; the same tail accumulating delay across its routing; " +
          "first-bank misses spreading into afternoon delays.",
        diagnosticQuestion:
          "When a turn runs long, do you know within the turn that it will push " +
          "late, and how far down the tail's routing does that delay propagate?",
      },
      {
        key: "no_critical_path_visibility",
        name: "No critical-path visibility within the turn",
        description:
          "The turnaround is run reactively task-by-task with no live view of the " +
          "critical-path milestone (deplaning, fueling, loading, boarding) that " +
          "will decide the departure, so the slow task is discovered only when the " +
          "push is already late and intervention is no longer possible.",
        detectionSignal:
          "Turns managed by radio and experience with no milestone tracking; " +
          "delays explained after the fact rather than predicted during the turn; " +
          "no TOBT/TSAT or internal milestone adherence reported.",
        diagnosticQuestion:
          "During a turn, can the ramp lead see which milestone is the binding " +
          "constraint in time to act, or is the slow task only obvious once the departure is late?",
      },
      {
        key: "baggage_reconciliation_gaps",
        name: "Baggage tracking & reconciliation gaps",
        description:
          "Bags are not tracked at every handling node (load, unload, transfer, " +
          "sortation), so transfer bags miss tight connections and mishandled bags " +
          "are discovered at the destination rather than prevented at the hub; the " +
          "carrier pays in mishandling rate and recovery cost.",
        detectionSignal:
          "Mishandling concentrated on connecting itineraries and tight banks; " +
          "no per-bag scan/reconciliation at transfer; mishandled bags found at " +
          "arrival with no event trail to the failure point.",
        diagnosticQuestion:
          "Is every bag tracked at load, unload, and transfer with reconciliation " +
          "against the flight, or do you discover mishandling only when the passenger reports it?",
      },
      {
        key: "ground_staffing_mismatch",
        name: "Ground staffing-to-bank mismatch",
        description:
          "Ramp, baggage, and gate staffing is rostered to a flat or stale plan " +
          "rather than the actual bank shape and gauge mix, so peaks are " +
          "understaffed (delay, unsafe workarounds) while troughs are overstaffed " +
          "(idle cost) — and union/contract rules constrain how fast rosters can flex.",
        detectionSignal:
          "Turn delays clustering on peak banks while productivity sags off-peak; " +
          "overtime and unsafe short-crewing on the same day; rosters built weeks " +
          "ahead with no day-of reflow to the actual operation.",
        diagnosticQuestion:
          "Is ground staffing matched to the actual bank shape and gauge mix by " +
          "the hour, and how much can the roster flex within your labor agreement when the operation changes?",
      },
      {
        key: "gate_contention",
        name: "Gate / stand contention and reassignment churn",
        description:
          "Off-schedule inbounds, overlong turns, and a too-tight gate plan create " +
          "gate contention, forcing last-minute reassignments, remote stands, and " +
          "aircraft tows — each of which adds delay, GSE moves, and passenger " +
          "walking time at exactly the wrong moment.",
        detectionSignal:
          "Frequent day-of gate reassignments and tows; aircraft holding for a " +
          "gate after landing; remote-stand bussing rising during busy banks.",
        diagnosticQuestion:
          "How often are gates reassigned or aircraft towed on the day of " +
          "operation, and does your gate plan hold a buffer for off-schedule inbounds?",
      },
      {
        key: "deicing_throughput_bottleneck",
        name: "De-icing throughput bottleneck in winter ops",
        description:
          "In a winter event, de-icing pad/bay capacity, fluid supply, and " +
          "holdover-time (HOT) management become the throughput ceiling of the " +
          "whole station; a poorly sequenced de-icing queue expires holdover times, " +
          "forces re-icing, and collapses the morning bank into cascading delay.",
        detectionSignal:
          "Long de-icing queues with flights re-icing after HOT expiry; the entire " +
          "first bank delayed in a snow event; fluid run-outs or pad gridlock; " +
          "no live de-icing sequencing against HOT.",
        diagnosticQuestion:
          "In your last significant winter event, how was the de-icing queue " +
          "sequenced against holdover times, and how many flights re-iced or " +
          "delayed because the pad was the bottleneck?",
      },
      {
        key: "third_party_handler_variability",
        name: "Third-party ground-handler performance variability",
        description:
          "At outstations the turn is performed by a third-party ground handler " +
          "whose staffing, training, and equipment the carrier does not directly " +
          "control, so turn time, damage, and mishandling vary by station and the " +
          "carrier sees the result late through SLAs rather than live operation.",
        detectionSignal:
          "On-time and damage performance varying sharply by outstation handler; " +
          "SLA breaches discovered in monthly reporting rather than in the moment; " +
          "limited live visibility into handler-performed turns.",
        diagnosticQuestion:
          "At your outstations, how much live visibility and SLA leverage do you " +
          "have over third-party handler turn performance, and where does it vary most?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "turn_critical_path_orchestration",
        name: "Turnaround critical-path orchestration & alerting",
        valueMechanism:
          "Track turnaround milestones live (deplaning, fueling, loading, " +
          "boarding), predict the departure time from the binding critical-path " +
          "task, and alert the ramp lead early enough to re-sequence or add " +
          "resource — converting reactive, after-the-fact turns into managed turns " +
          "that push on time and stop the delay cascade at its origin.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Turnaround milestone events (TOBT/TSAT, A-CDM, internal critical-path scans)",
          "Inbound aircraft position and estimated on-blocks time",
          "Gate, GSE, and ground-crew assignment for the turn",
          "Historical task-duration distributions by station and gauge",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "The ramp/ground crew and ground controller execute and own ramp safety — the system sequences and alerts, it does not direct unsafe speed",
          "A predicted on-time push must never pressure crews past safe loading or pushback procedures",
          "Milestone predictions are advisory; the station duty manager owns the turn decision",
        ],
        metricsMoved: [
          "aircraft_turn_time",
          "on_time_departure",
          "turn_punctuality_to_plan",
        ],
      },
      {
        key: "baggage_tracking_reconciliation",
        name: "Bag tracking & connection-risk reconciliation",
        valueMechanism:
          "Track every bag at each handling node and reconcile it against its " +
          "flight and connection, flagging at-risk transfer bags early enough to " +
          "expedite or re-flow them — cutting the missed-bag connection rate and " +
          "overall mishandling, and replacing destination-discovered failures with " +
          "hub-prevented ones.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Per-bag scan/track events (BSM/BPM, RFID or barcode) at load, unload, transfer",
          "Bag-to-itinerary and connection mapping",
          "Inbound arrival times and connection-time margins",
          "Sortation system status and re-flow capacity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Baggage security/reconciliation rules (positive bag matching) are regulatory — automation supports them, it never bypasses a security match",
          "Expedite decisions consume scarce ramp resource and must not be made at the expense of a safe load",
          "Passenger data in bag itineraries must respect privacy/data-protection obligations",
        ],
        metricsMoved: [
          "baggage_mishandling_rate",
          "missed_bag_connection_rate",
        ],
      },
      {
        key: "ground_workforce_optimization",
        name: "Ground workforce demand forecasting & rostering",
        valueMechanism:
          "Forecast ground-labor demand by function from the actual bank shape and " +
          "gauge mix and build rosters that match staffing to the hour within labor " +
          "agreements — lifting productivity and on-time push while removing the " +
          "peak under-staffing that drives delay and the trough over-staffing that " +
          "wastes cost.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Flight schedule, bank structure, and gauge mix by station and hour",
          "Task-time standards by function (ramp, baggage, gate) and gauge",
          "Crew availability, qualifications, and union/contract roster rules",
          "Day-of operational changes (delays, swaps) for reflow",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Rosters are governed by union/labor agreements — automation must encode the contract, not optimize past it",
          "Staffing must never fall below safe minimum crew sizes for a turn; cost optimization stops at the safety floor",
          "Final roster and day-of reassignment are owned by station/workforce management, not the model",
        ],
        metricsMoved: [
          "ground_staff_productivity",
          "station_cost_per_turn",
          "on_time_departure",
        ],
      },
      {
        key: "gate_resource_allocation",
        name: "Dynamic gate & stand allocation",
        valueMechanism:
          "Re-optimize gate and stand assignments continuously against actual " +
          "inbound times, turn lengths, and connection banks — reducing gate " +
          "contention, last-minute reassignments, and tows so aircraft go straight " +
          "to a serviceable gate and passenger connections are protected.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Live inbound positions and predicted on-blocks times",
          "Gate/stand inventory, equipment, and adjacency constraints",
          "Connection banks and passenger transfer flows",
          "Turn-length predictions per aircraft and gauge",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Gate assignment must respect aircraft-size, jet-bridge, and safety/adjacency constraints — an unsafe assignment is a hard reject",
          "The gate/ramp controller retains authority over stand assignment and ground movement",
          "Reassignments have passenger and crew impact (walking time, bussing) that the objective must weigh, not ignore",
        ],
        metricsMoved: [
          "gate_utilization",
          "aircraft_turn_time",
          "on_time_departure",
        ],
      },
      {
        key: "deicing_sequencing",
        name: "De-icing queue sequencing & holdover-time management",
        valueMechanism:
          "Sequence the de-icing queue against holdover times (HOT), pad capacity, " +
          "and departure priority during a winter event — maximizing the number of " +
          "flights that depart legally before fluid expires and preventing the " +
          "re-icing and cascade that collapse a snow-day morning bank.",
        adoptionProfile: "early",
        dataDependencies: [
          "De-icing pad/bay capacity and queue status",
          "Holdover-time tables by fluid type and weather condition",
          "Departure schedule, priority, and pushback readiness",
          "Live weather (precipitation type and rate)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Holdover times are a flight-safety limit — sequencing never pushes a flight past HOT expiry, and the captain owns the final go decision",
          "De-icing adequacy is a safety judgment by trained crews; the system sequences, it does not certify a clean aircraft",
          "Fluid-type and weather inputs must be current; stale HOT data is a safety risk, not just an efficiency miss",
        ],
        metricsMoved: [
          "deicing_turnaround_time",
          "on_time_departure",
        ],
      },
      {
        key: "ramp_safety_gse_monitoring",
        name: "Ramp safety & GSE availability monitoring",
        valueMechanism:
          "Use GSE telematics and ramp sensing to predict equipment availability " +
          "(including EV charge state), detect unsafe proximity/speed on the ramp, " +
          "and surface ground-damage risk — protecting the turn from equipment " +
          "shortfalls while holding the ramp-safety ceiling that turn-speed " +
          "programs must respect.",
        adoptionProfile: "early",
        dataDependencies: [
          "GSE telematics (location, serviceability, fuel/charge state)",
          "Ramp positioning/proximity sensing where available",
          "Ground-damage and safety incident history",
          "Turn schedule and equipment-to-turn assignment",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Ramp safety is owned by trained ground crews and the ground controller — monitoring alerts, it does not control vehicles or override stop authority",
          "Safety alerting must not create alarm fatigue that crews learn to ignore on a busy ramp",
          "GSE telematics and worker location data carry privacy and labor-relations obligations",
        ],
        metricsMoved: [
          "gse_availability",
          "ramp_incident_rate",
          "aircraft_turn_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "turn_orchestration_platform",
        name: "Turnaround orchestration & milestone-tracking platform",
        description:
          "A station decision surface that tracks turnaround milestones live, " +
          "predicts the departure from the binding critical-path task, and alerts " +
          "the ramp lead and duty manager early enough to act — replacing radio-and-" +
          "experience turns with a managed, milestone-tracked turn that pushes on time.",
        boundary:
          "Owns turn milestone tracking, prediction, and alerting; does not direct " +
          "the physical ramp work or override ramp-safety procedures — trained " +
          "ground crews execute and the station duty manager owns the turn decision.",
        humanAccountabilityPoint: "Station / Airport Duty Manager (and the ramp/turnaround lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "baggage_reconciliation_platform",
        name: "Baggage tracking & reconciliation platform",
        description:
          "An end-to-end bag-tracking and reconciliation system (BSM/BPM with RFID " +
          "or barcode scans at every node) that flags at-risk transfer bags and " +
          "reconciles every bag against its flight and connection — preventing " +
          "mishandling at the hub instead of discovering it at the destination.",
        boundary:
          "Owns bag tracking, connection-risk detection, and reconciliation; does " +
          "not perform the physical load/transfer or override the security " +
          "positive-match rule — ramp/baggage crews load and the security match is regulatory.",
        humanAccountabilityPoint: "Manager Baggage Services / Station Baggage Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ground_resource_management",
        name: "Ground resource & workforce management system",
        description:
          "A resource-management platform that forecasts ground-labor and GSE " +
          "demand from the bank shape and gauge mix and builds (and day-of reflows) " +
          "rosters and equipment assignments within labor-agreement rules — matching " +
          "ground capacity to the actual operation.",
        boundary:
          "Owns demand forecasting, rostering, and resource assignment within " +
          "contract and safety limits; does not set the labor agreement or assign " +
          "below safe crew sizes — workforce management owns the final roster.",
        humanAccountabilityPoint: "Station Operations Manager / Ground Workforce Planning lead",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "station_ops_data_foundation",
        name: "Station operations data & event foundation",
        description:
          "A unified station data layer — IN/OUT and turnaround milestone events, " +
          "bag scans, gate occupancy, GSE telematics, de-icing and weather feeds — " +
          "that grounds every turn, baggage, gate, and staffing model in one " +
          "consistent, real-time station event view.",
        boundary:
          "Owns ingestion, normalization, and serving of station operational data " +
          "and lineage; does not make ground decisions — it is the substrate the " +
          "turn, baggage, gate, and workforce systems read.",
        humanAccountabilityPoint: "VP Airport / Ground Operations Technology (with Station Ops)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value in ground and airport operations is won at the turn and " +
        "compounds through the coupled network: a turn managed to its critical " +
        "path pushes on time, which stops the delay cascade the OCC would " +
        "otherwise spend the day recovering; bags tracked and reconciled at the " +
        "hub cut the mishandling and re-flow cost; ground labor and GSE matched " +
        "to the actual bank lift productivity and on-time without cutting below " +
        "safe crew sizes. The durable wins are reliability (on-time push, low " +
        "mishandling) and unit cost per turn, not heroics on a bad-weather " +
        "morning — and every benefit is bounded by ramp safety, holdover-time, " +
        "and labor-agreement floors that cannot be optimized away. Because much " +
        "of the work is outsourced to third-party handlers and constrained by " +
        "weather and unions, realizable value is materially haircut from the " +
        "theoretical optimum.",
      dominantHaircutFactors: [
        {
          factor: "Ramp-safety & holdover-time ceiling",
          rationale:
            "Ramp safety, safe minimum crew sizes, and de-icing holdover times " +
            "are non-negotiable floors; turn-speed and cost optimization that " +
            "crosses them is not realizable value but added risk.",
          typicalHaircut: {
            low: 0.2,
            high: 0.4,
            basis:
              "Station experience where safety floors bound the achievable turn-" +
              "speed and staffing envelope",
            label: "planning-range",
          },
        },
        {
          factor: "Labor agreements & union constraints",
          rationale:
            "Rostering, crew sizing, and day-of reflow are governed by union and " +
            "local-labor agreements; productivity and cost gains that the contract " +
            "does not permit go unrealized.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Ground-handling labor-relations experience where contract terms cap roster flexibility",
            label: "planning-range",
          },
        },
        {
          factor: "Third-party handler control & outstation reach",
          rationale:
            "At outstations the turn is performed by handlers the carrier does not " +
            "directly control; live visibility and SLA leverage are limited, so " +
            "centrally-modeled gains are only partly realizable.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Outstation experience where third-party handler performance is reached only through SLAs",
            label: "planning-range",
          },
        },
        {
          factor: "Weather variability & winter operations",
          rationale:
            "Ground throughput (de-icing, ramp work) is weather-bound; modeled " +
            "improvements degrade in severe events when the physical and HOT limits dominate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Winter-operations experience where weather caps achievable ground throughput",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Turn-time reduction",
          range: {
            low: 0.03,
            high: 0.12,
            basis:
              "Reported turnaround-orchestration program reductions in average turn time, " +
              "bounded by safe critical-path task durations",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in aircraft_turn_time",
        },
        {
          lever: "Baggage mishandling reduction",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Bag-tracking/reconciliation program reductions in mishandling rate (SITA-reported ranges)",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in baggage_mishandling_rate",
        },
        {
          lever: "Ground labor productivity uplift",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Demand-matched rostering productivity gains within labor-agreement limits",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in ground_staff_productivity",
        },
        {
          lever: "On-time departure improvement",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Station on-time gains from milestone-tracked turns and dynamic gate allocation",
            label: "planning-range",
          },
          measuredAs: "Absolute percentage-point gain in on_time_departure",
        },
      ],
      timeToValueBand:
        "Baggage tracking/reconciliation and turn milestone tracking: 2-4 " +
        "quarters where scan infrastructure and event feeds partly exist. Ground " +
        "workforce optimization: 3-5 quarters including labor-agreement encoding " +
        "and day-of reflow. Dynamic gate allocation and de-icing sequencing: 3-6 " +
        "quarters including station process change and controller trust; full " +
        "value at outstations lags by the pace of third-party-handler integration.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Airport / ground operations & movement system",
          role: "System of record for IN/OUT times, turnaround milestones, gate events, and the day-of station operation.",
          examples: ["Amadeus Airport Operations (Altea / FMS)", "SITA AirportConnect / Day of Operations", "INFORM GroundStar"],
        },
        {
          name: "Departure control system (DCS)",
          role: "Manages check-in, boarding, load control, and the doors-closed departure milestone at the gate.",
          examples: ["Amadeus Altea DCS", "SITA Departure Control", "Sabre AirCentre DCS"],
        },
        {
          name: "Baggage handling & reconciliation system (BRS/BHS)",
          role: "Tracks and reconciles bags (BSM/BPM, RFID/barcode) across load, unload, transfer, and sortation.",
          examples: ["SITA BagManager / WorldTracer", "BEUMER / Vanderlande BHS controls", "Amadeus Baggage"],
        },
        {
          name: "Resource / workforce management system",
          role: "Forecasts ground-labor and GSE demand and builds rosters and equipment assignments within contract rules.",
          examples: ["INFORM GroundStar (resource/roster)", "ARMS / station workforce-management tools", "Quintiq ground resource planning"],
        },
        {
          name: "Gate / stand allocation & A-CDM platform",
          role: "Allocates gates and stands and shares turnaround target times (TOBT/TSAT) under Airport Collaborative Decision Making.",
          examples: ["A-CDM platforms (airport-operated)", "INFORM gate management", "Amadeus stand & gate management"],
        },
        {
          name: "GSE fleet-management / telematics system",
          role: "Tracks ground service equipment serviceability, location, fuel/charge state, and assignment.",
          examples: ["Undagrid / ramp GSE telematics", "OEM GSE fleet platforms", "EV charging-management for electric GSE"],
        },
      ],
      roles: [
        {
          title: "VP / Director Airport (Ground) Operations",
          accountability: "End-to-end station execution: turn time, on-time departure, baggage, and station cost.",
        },
        {
          title: "Station / Airport Duty Manager",
          accountability: "Day-of operation of a station: turn decisions, gate/resource conflicts, and recovery on the ground.",
        },
        {
          title: "Ramp / Turnaround Lead",
          accountability: "Execution and safety of the physical turn — marshalling, loading, fueling coordination, pushback.",
        },
        {
          title: "Manager Baggage Services",
          accountability: "Baggage handling, transfer performance, mishandling rate, and reconciliation.",
        },
        {
          title: "Ground Workforce Planning Manager",
          accountability: "Ground-labor forecasting, rostering, and contract-compliant staffing to the bank.",
        },
        {
          title: "GSE Fleet Manager",
          accountability: "Ground service equipment availability, maintenance, and (increasingly) electrification/charging.",
        },
      ],
      regulatoryFrames: [
        {
          name: "IATA Ground Operations Manual (IGOM) & ISAGO",
          relevance:
            "The industry-standard ground-handling procedures and station audit program that define safe turn, ramp, and loading practice.",
        },
        {
          name: "Ramp & ground safety regulation (OSHA / local occupational and aerodrome safety rules)",
          relevance:
            "Govern ramp worker safety, vehicle operation, and aerodrome ground movement — a hard ceiling on turn-speed and staffing.",
        },
        {
          name: "De-icing / anti-icing standards (SAE / holdover-time guidance, FAA/EASA winter-ops rules)",
          relevance:
            "Define holdover times and de-icing adequacy — flight-safety limits any de-icing sequencing must respect.",
        },
        {
          name: "Baggage security & reconciliation rules (ICAO Annex 17 / positive bag matching)",
          relevance:
            "Require security matching of bags to boarded passengers — a regulatory constraint baggage automation supports, never bypasses.",
        },
      ],
      canonicalTerms: [
        {
          term: "Turnaround (the turn)",
          definition:
            "The full ground process between an aircraft's arrival and its next departure: deplane, service, load, board, push back.",
        },
        {
          term: "TOBT / TSAT",
          definition:
            "Target Off-Block Time and Target Start-up Approval Time — the A-CDM milestones that coordinate a turn's planned push and start-up.",
        },
        {
          term: "GSE",
          definition:
            "Ground service equipment — tugs, belt loaders, pushback tractors, ground power units, de-icers, and the like that service a turn.",
        },
        {
          term: "Holdover time (HOT)",
          definition:
            "The time anti-icing fluid remains effective after application — a flight-safety limit that bounds de-icing sequencing.",
        },
        {
          term: "BSM / BPM",
          definition:
            "Baggage Source Message and Baggage Processed Message — the tracking events that record where a bag is in the handling process.",
        },
        {
          term: "On-blocks / off-blocks (IN / OUT)",
          definition:
            "The arrival (parked on stand) and departure (pushed off stand) timestamps that bound the turn and drive on-time metrics.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Turn time and on-time departure performance",
        authoritativeSource: "IN/OUT and turnaround-milestone timestamps in the ground/airport operations system",
        whatGoodEvidenceLooksLike:
          "Turn time and D0/D15 computed from on-blocks/off-blocks and milestone events over a trailing period, broken down by station, gauge, and delay cause code.",
        weakEvidenceToReject:
          "A single headline turn-time or on-time number with no station/gauge breakdown, period, or cause-code attribution.",
      },
      {
        claim: "Baggage mishandling and missed-bag connections",
        authoritativeSource: "Mishandled-bag reports and BSM/BPM reconciliation in the baggage handling system",
        whatGoodEvidenceLooksLike:
          "Mishandling rate per 1,000 passengers and missed-bag connection rate by station and bank, with the failure node (transfer, sortation, load) traced from scan events.",
        weakEvidenceToReject:
          "A mishandling figure with no per-bag scan trail, no connecting-vs-local split, and no failure-node attribution.",
      },
      {
        claim: "Ground staffing, productivity, and station cost",
        authoritativeSource: "Workforce-management rosters and station cost allocation joined to handled turns",
        whatGoodEvidenceLooksLike:
          "Turns-per-paid-hour and cost-per-turn by station and bank with the self-handle-vs-third-party-handler split and the safe minimum crew size shown.",
        weakEvidenceToReject:
          "A station cost-per-turn figure with no labor/GSE/handler-fee breakdown and no link to on-time and damage outcomes.",
      },
      {
        claim: "Ramp safety and ground-damage",
        authoritativeSource: "Safety/ground-damage incident reports and GSE telematics in the station safety system",
        whatGoodEvidenceLooksLike:
          "Ramp incident and aircraft ground-damage rate per 1,000 turns over a trailing period, by station and cause, joined to congestion and GSE condition.",
        weakEvidenceToReject:
          "An assertion that a turn-speed program is 'safe' with no incident-rate baseline or trend from this carrier's own station data.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When a turn runs long, do you know within the turn that it will push late, and how far down the tail's routing does that delay propagate?",
      "During a turn, can the ramp lead see which milestone is the binding constraint in time to act, or is the slow task only obvious once the departure is late?",
      "Is every bag tracked at load, unload, and transfer with reconciliation against the flight, or do you discover mishandling only when the passenger reports it?",
      "Is ground staffing matched to the actual bank shape and gauge mix by the hour, and how much can the roster flex within your labor agreement when the operation changes?",
      "How often are gates reassigned or aircraft towed on the day of operation, and does your gate plan hold a buffer for off-schedule inbounds?",
      "In your last significant winter event, how was the de-icing queue sequenced against holdover times, and how many flights re-iced or delayed because the pad was the bottleneck?",
      "At your outstations, how much live visibility and SLA leverage do you have over third-party handler turn performance, and where does it vary most?",
    ],
    maturitySignals: [
      "Turns are managed to live critical-path milestones with early delay prediction, not run by radio and experience.",
      "Every bag is tracked and reconciled at each node, with at-risk transfer bags flagged and expedited before they miss the connection.",
      "Ground labor and GSE are forecast and rostered to the actual bank shape within labor-agreement rules, with day-of reflow.",
      "Gate allocation and de-icing are sequenced dynamically against live inbounds and holdover times, holding the ramp-safety ceiling.",
    ],
    redFlags: [
      "Turns are run reactively with no milestone visibility, so delays are explained after the push rather than prevented during the turn.",
      "Mishandling is discovered at the destination because bags are not reconciled at the hub, and it concentrates on tight connecting banks.",
      "Ground staffing is rostered to a flat or stale plan, so peak banks are short-crewed (delay/unsafe workarounds) while troughs sit idle.",
      "Turn-speed or cost targets are pursued past ramp-safety, safe-crew-size, or holdover-time floors, trading risk for a number.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Airport/ground ops & resource suite (Amadeus, SITA, INFORM)",
        category: "Ground operations, gate/resource management, turnaround orchestration",
        switchingCost:
          "High — the ground ops and resource systems are fused to station workflows, gate plans, and labor rosters; replacement is a multi-year, multi-station program with deep integration and retraining.",
        renewalDynamics:
          "Multi-year enterprise/airport agreements often bundled across ops, resource, and gate modules; switching is rare and gated on station-by-station parity proof.",
      },
      {
        vendorName: "Baggage handling & reconciliation (SITA WorldTracer, BHS integrators)",
        category: "Baggage tracking, reconciliation, and handling-system controls",
        switchingCost:
          "High at the airport infrastructure layer (physical BHS) and moderate at the tracking/reconciliation software layer; WorldTracer is a near-industry-standard for tracing.",
        renewalDynamics:
          "Long-tenure infrastructure contracts at the airport; RFID/tracking software increasingly negotiated as modules with outcome-linked mishandling targets.",
      },
      {
        vendorName: "Third-party ground handlers (Swissport, Menzies, dnata, WFS)",
        category: "Outsourced ground handling at out- and many hub stations",
        switchingCost:
          "Moderate — handler contracts are re-tenderable by station, but switching disrupts local operations, staffing, and equipment; the real lock-in is local labor and trained crews.",
        renewalDynamics:
          "Competitive station-by-station tenders with SLA-linked pricing; performance penalties/credits and live-data sharing are the live negotiation frontier.",
      },
      {
        vendorName: "GSE & ramp-technology specialists (telematics, electrification, ramp-safety sensing)",
        category: "GSE telematics, EV charging, ramp proximity/safety, de-icing tech",
        switchingCost:
          "Low-to-moderate — integrate via data feeds and are swappable with mapping effort; watch electrification charging-infrastructure lock-in and data ownership.",
        renewalDynamics:
          "Emerging, fast-moving market; favor outcome-based terms, open data, and exit rights over multi-year lock-in, especially on EV-GSE infrastructure.",
      },
    ],
    switchingCosts:
      "The airport ground-ops, resource, and baggage-infrastructure systems of record are effectively non-switchable in isolation — they are fused to station workflows, gate plans, labor rosters, and physical airport infrastructure. The negotiable frontier is twofold: the third-party ground-handling contracts (re-tenderable by station, with SLA leverage) and the optimization/telematics layer (turn orchestration, bag tracking, GSE telematics) around the core, where switching cost is lower and outcome terms are achievable.",
    negotiationLevers: [
      "SLA-linked handler pricing with performance credits/penalties tied to measured turn time, on-time, and mishandling",
      "Live operational-data sharing from third-party handlers as a contractual requirement, not a reporting afterthought",
      "Outcome/value-share pricing on turn-orchestration and bag-tracking software tied to measured improvement",
      "Station-by-station pilot before network rollout, with parity, safety, and labor-relations proof gating scale",
      "Open data and exit rights on GSE telematics and EV-charging infrastructure to avoid electrification lock-in",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      turn_metric: ["IN/OUT timestamps", "turnaround milestone events", "station/gauge breakdown", "delay cause codes"],
      baggage_metric: ["BSM/BPM scan events", "reconciliation records", "connecting-vs-local split", "failure-node attribution"],
      staffing_cost_metric: ["workforce rosters", "paid-hours data", "cost allocation per turn", "self-handle-vs-handler split"],
      safety_claim: ["ground-damage/incident reports", "GSE telematics", "incident-rate baseline and trend"],
      handler_performance_claim: ["SLA reporting", "live handler operational data where available", "station-by-station breakdown"],
      value_projection: ["baseline metric", "benchmark planning-range", "explicit haircut factors"],
    },
    citationStandard:
      "Quantitative ground-execution claims cite the IN/OUT / milestone / bag-scan / " +
      "roster source and the period and breakdown (station, gauge, bank). Mishandling " +
      "claims cite the scan trail and the failure node, not the passenger report alone. " +
      "Safety claims cite an incident-rate baseline from this carrier's own station data, " +
      "never an assertion that a speed program is safe. Handler-performance claims " +
      "distinguish SLA reporting from live data. Value projections cite a baseline plus a " +
      "labelled planning range and the haircut factors applied — never a single asserted " +
      "dollar or ROI figure, and never a value that assumes optimizing past a ramp-safety, " +
      "safe-crew-size, or holdover-time floor.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no station-level milestone or bag-scan data — frame turn-time and mishandling gains as an industry pattern, not their measured number.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges normalized for gauge mix, bank structure, and self-handle-vs-handler model.",
      "Performance is at an outstation run by a third-party handler — flag that visibility and SLA leverage are limited and the modeled gain is only partly realizable.",
      "An optimization implies relaxing a ramp-safety, safe-crew-size, or holdover-time limit — flag that the safety floor caps the realizable benefit.",
    ],
    inferenceLanguage: [
      "Across network carriers at this scale, narrowbody turn times and on-time push typically run...",
      "Without your station-level scan data, the industry pattern suggests a mishandling rate of...",
      "Peer stations with comparable bank structure and gauge mix commonly see...",
      "Bounded by ramp-safety and labor-agreement limits, the realizable share of this is typically...",
    ],
    flagWithoutEvidence: [
      "A specific dollar saving or ROI for this carrier's ground operation",
      "This carrier's actual turn time, mishandling rate, or station cost per turn",
      "A claim that automation can safely beat a ramp-safety, safe-crew-size, or holdover-time limit",
      "A claim about third-party handler performance not backed by SLA reporting or live handler data",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "turn-time or delay breakdown by station, gauge, or cause",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack delay/ground-time minutes by critical-path task or cause (ramp, baggage, boarding, de-icing, GSE) and station to show where the turn leaks.",
    },
    {
      questionPattern: "on-time departure or mishandling trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend D0/D15 and baggage mishandling rate over periods to show whether ground reliability is improving or deteriorating.",
    },
    {
      questionPattern: "value / cost impact of a turn or baggage program (value bridge)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current turn-delay and mishandling cost to recoverable value with ramp-safety, labor-agreement, and handler-reach haircuts.",
    },
    {
      questionPattern: "which ground levers move the operation most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of turn-time, baggage, staffing, gate, and de-icing levers by impact range to prioritize the station program.",
    },
    {
      questionPattern: "station ground-operations KPI scorecard",
      exhibitKind: "table",
      note: "Turn time, on-time departure, baggage mishandling and missed-bag rates, ramp incident rate, gate utilization, staff productivity, de-icing turnaround, boarding time, GSE availability, milestone adherence, and cost per turn vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A real-time station data foundation (IN/OUT, milestones, bag scans, GSE telematics, weather) the models can act on within the turn",
      "Station leadership and ramp crews aligned that automation sequences and alerts while crews execute and own ramp safety, building floor-level trust",
      "Labor agreements engaged early so rostering and reflow gains are negotiated, not assumed away by the model",
      "Bag-tracking and milestone infrastructure partly in place, giving fast, measurable early wins (mishandling, on-time push) to fund the harder work",
    ],
    failureDrivers: [
      "Pursuing turn-speed or staffing-cost targets past ramp-safety, safe-crew-size, or holdover-time floors, which crews reject and regulators penalize",
      "Siloed station data so the turn-orchestration engine never sees the binding critical-path constraint in time to act",
      "Treating third-party-handler outstations as if they were self-handled, modeling gains the carrier cannot reach without SLA and data leverage",
      "Chasing gate utilization or low cost-per-turn while on-time and ground-damage deteriorate, optimizing one number against the operation",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Bag tracking/reconciliation and turn milestone tracking adopt first " +
      "because the scan/event infrastructure often partly exists and the " +
      "mishandling/on-time ROI is measurable; ground workforce optimization " +
      "follows once labor agreements are engaged and day-of reflow is trusted; " +
      "dynamic gate allocation and de-icing sequencing are harder and later — " +
      "they require controllers and crews to trust a recommendation in a " +
      "fast-moving, safety-critical ground environment; outstation value lags " +
      "all of it by the pace of third-party-handler integration and SLA reform.",
    roiClarity: "medium",
    roiClarityBasis:
      "Baggage-mishandling and turn-time ROI are relatively firm because " +
      "mishandling rate and turn duration are directly measured at the station. " +
      "On-time and recovery ROI are harder to attribute: the value is an avoided " +
      "delay cascade in a tightly coupled network, so the counterfactual " +
      "downstream cost must be modeled, and ramp-safety, labor-agreement, and " +
      "third-party-handler limits cap how much of a theoretical ground optimum is realizable.",
  },

  regulatoryFrame: {
    name: "Ground/ramp safety & handling standards (IATA IGOM/ISAGO, ramp & aerodrome safety, de-icing holdover-time, baggage security)",
    relevance:
      "The dominant frame bounding automation in ground operations: ramp and " +
      "aerodrome safety, safe minimum crew sizes, de-icing holdover times, and " +
      "baggage security matching are non-negotiable floors, and labor/union " +
      "agreements constrain staffing. AI sequences, forecasts, and alerts within " +
      "these limits; trained ground crews and the ramp/ground controller execute " +
      "and own safety, and it never optimizes past a safety or holdover floor. " +
      "(See vocabulary.regulatoryFrames for the specific standards.)",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
