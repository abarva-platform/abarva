// Consilium expert — Logistics & Transportation: Operations (industry-function).
//
// W3 industry-wave ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// An industry expert for the operating system of a logistics & transportation
// enterprise — covering freight & fleet (OTR/intermodal/ocean/air), 3PL/4PL
// managed transportation, last-mile & parcel, warehouse / DC operations,
// network design, carrier procurement, cold chain, and reverse logistics.
// Product-aware across TMS / WMS / telematics / visibility platforms (Blue
// Yonder, Manhattan, project44, Samsara, Oracle OTM), not product-locked.
//
// CORE DOCTRINE — honest bounding truths baked into the content:
// (1) OTIF IS THE TRUTH METRIC, AND IT IS A DATA/VISIBILITY PROBLEM FIRST.
//     On-time-in-full is where service and cost meet, but it is mostly a clean-
//     EDI / clean-telematics / clean-appointment-data problem before it is an
//     optimization problem. Modeling OTIF gains on better routing while the
//     status data is dirty is the most common over-promise.
// (2) FUEL + DRIVER CAPACITY DOMINATE COST AND ARE LARGELY EXOGENOUS. The two
//     biggest cost lines — fuel per mile and driver pay/availability — are set
//     by markets, HOS regulation, and labor supply, not by software. AI helps
//     at the margin (deadhead, idle, routing) but cannot repeal the cost curve.
// (3) "CONTROL TOWER VISIBILITY" IS OVERSOLD WITHOUT CLEAN EDI/TELEMATICS, and
//     ROUTE-OPTIMIZATION ROI IS REAL BUT ERODES against driver, union, and
//     service-window constraints. Value that assumes a clean signal that does
//     not exist, or unconstrained re-routing, is not realizable and must not be
//     promised.

import type {
  ExpertPack,
  ExpertPackIdentity,
} from "@/lib/intelligence/expert-pack/expert-pack";

// "logistics_transportation" is the operator-facing industry key for this
// wave; the shared CanonicalIndustry union has not yet been widened to admit
// it (and this pack must not edit the canonical contract). We preserve the
// exact identity the expert is addressed by while staying tsc-clean by casting
// the identity literal — the runtime value is verbatim what the router expects.
const identity = {
  id: "xp.logistics.operations",
  expertName: "Logistics & Transportation Operations Expert",
  kind: "industry-function",
  industry: "logistics_transportation",
  functionKey: "logistics-operations",
  scopeNote:
    "The operating system of a logistics & transportation enterprise: freight " +
    "& fleet across modes (OTR / intermodal / ocean / air), 3PL / 4PL managed " +
    "transportation, last-mile & parcel, warehouse / distribution-center " +
    "operations, network design, carrier procurement & capacity sourcing, " +
    "cold chain, and reverse logistics. Spans the dock-to-doorstep movement " +
    "and the cost-to-serve behind it. Product-aware across TMS / WMS / " +
    "telematics / visibility platforms (Blue Yonder, Manhattan, Oracle OTM, " +
    "project44, FourKites, Samsara), not product-locked. CORE DOCTRINE: " +
    "on-time-in-full is the truth metric but it is a data/visibility problem " +
    "before it is an optimization problem; fuel and driver capacity dominate " +
    "cost and are largely exogenous; 'control-tower visibility' is oversold " +
    "without clean EDI/telematics; and route-optimization ROI is real but " +
    "erodes against driver, union, and service-window constraints — so value " +
    "is sized on deadhead/cost-per-mile and OTIF, not on assumed optimization " +
    "lift. EXCLUDES upstream demand planning / S&OP and inventory optimization " +
    "(Supply Chain Transformation expert), plant-floor manufacturing throughput " +
    "(Manufacturing Operations expert), and retail cross-channel order " +
    "orchestration (Retail Omnichannel Fulfillment expert) — this expert owns " +
    "the physical movement, the fleet/carrier economics, and the warehouse node.",
} satisfies ExpertPackIdentity;

export const logisticsTransportationOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity,

  domain: {
    operatingMetrics: [
      {
        key: "otif",
        name: "On-time-in-full (OTIF)",
        definition:
          "Share of shipments/orders delivered both on the promised date/window " +
          "and in the full quantity, with no shortages or damage. The composite " +
          "service truth metric where carrier reliability, appointment data, and " +
          "warehouse accuracy all land.",
        unit: "% of shipments/orders",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 98,
          basis:
            "Mode- and customer-program dependent; retail compliance programs and " +
            "parcel sit high, complex multi-stop and project freight lower",
          label: "planning-range",
        },
        dataSource:
          "TMS shipment status + EDI 214 milestones / telematics POD vs promised " +
          "appointment date and ordered quantity",
        whyItMatters:
          "OTIF is the truth metric of logistics service — but it is mostly a " +
          "clean-EDI/telematics/appointment-data problem before it is a routing " +
          "problem, so a low OTIF usually exposes a visibility gap first.",
      },
      {
        key: "cost_per_mile",
        name: "Cost per mile",
        definition:
          "Fully loaded operating cost (driver, fuel, equipment, maintenance, " +
          "insurance, overhead) per mile run, the core unit economic of fleet and " +
          "OTR transportation.",
        unit: "$ / mile",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.6,
          high: 3.2,
          basis:
            "US OTR all-in operating cost range; driven heavily by fuel and driver " +
            "pay, which are largely exogenous — track against the carrier's own lanes",
          label: "planning-range",
        },
        dataSource:
          "Fleet TMS / accounting cost build-up tied to telematics odometer/route miles",
        whyItMatters:
          "Cost per mile is where fuel and driver capacity — the two dominant, " +
          "largely exogenous cost lines — show up; software moves it at the margin " +
          "via deadhead and idle, not by repealing the cost curve.",
      },
      {
        key: "cost_per_shipment",
        name: "Cost per shipment",
        definition:
          "Total transportation + handling cost to move one shipment/order from " +
          "origin to destination, including linehaul, accessorials, and last-mile.",
        unit: "$ / shipment",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Mode-, weight-, and lane-specific; no cross-network numeric band is " +
            "meaningful — track against the network's own baseline and lane mix",
          label: "planning-range",
        },
        dataSource:
          "TMS freight settlement (linehaul + accessorials) joined to parcel/last-mile cost",
        whyItMatters:
          "Cost per shipment is the customer-facing cost-to-serve read; it exposes " +
          "accessorial leakage and mode-choice waste that cost-per-mile alone hides.",
      },
      {
        key: "empty_miles_pct",
        name: "Empty miles / deadhead %",
        definition:
          "Share of total fleet miles run empty (without revenue load) — deadhead " +
          "between a delivery and the next pickup, the largest controllable waste " +
          "in fleet utilization.",
        unit: "% of total miles",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 30,
          basis:
            "US OTR commonly 15-25%; private fleets and unbalanced lane networks " +
            "run higher, dense backhaul networks lower",
          label: "planning-range",
        },
        dataSource: "Telematics/ELD GPS miles vs TMS loaded-mile records by leg",
        whyItMatters:
          "Empty miles are paid-for, fuel-burning, zero-revenue miles — the most " +
          "directly addressable cost lever where AI routing/backhaul matching " +
          "delivers real, measurable ROI.",
      },
      {
        key: "freight_pct_revenue",
        name: "Freight cost as % of revenue",
        definition:
          "Total inbound + outbound transportation spend as a share of the " +
          "enterprise's net revenue — the headline read on logistics cost intensity.",
        unit: "% of revenue",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 11,
          basis:
            "Sector- and product-density dependent; bulky/low-value goods sit high, " +
            "dense/high-value low; sensitive to fuel-market swings",
          label: "planning-range",
        },
        dataSource: "ERP/TMS transportation spend vs finance net-revenue",
        whyItMatters:
          "Freight as a % of revenue is how transportation cost shows up to the " +
          "CFO; it rises and falls with fuel and capacity markets, so trend matters " +
          "more than a point-in-time number.",
      },
      {
        key: "dock_to_stock",
        name: "Dock-to-stock cycle time",
        definition:
          "Elapsed time from a receipt arriving at the DC dock to it being put " +
          "away and available to pick — the inbound responsiveness of the warehouse.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 24,
          basis:
            "Cross-dock and high-automation DCs at the low end; manual receiving " +
            "and quality-hold flows higher",
          label: "planning-range",
        },
        dataSource: "WMS receiving and put-away timestamps",
        whyItMatters:
          "Slow dock-to-stock hides inventory the network thinks it has, starving " +
          "outbound OTIF and inflating safety stock — a warehouse-side OTIF driver.",
      },
      {
        key: "perfect_order_rate",
        name: "Perfect-order rate",
        definition:
          "Share of orders delivered on time, complete, damage-free, and with " +
          "correct, clean documentation — the multiplicative quality measure of " +
          "the whole fulfillment chain.",
        unit: "% of orders",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 96,
          basis:
            "Multiplicative across on-time x complete x damage-free x doc-accurate, " +
            "so it sits below any single component; mature networks higher",
          label: "planning-range",
        },
        dataSource:
          "TMS/WMS/OMS joined: delivery status, fill, claims/damage, and document accuracy",
        whyItMatters:
          "Perfect order is the honest end-to-end quality read because it compounds " +
          "every failure mode; small per-step error rates collapse it, exposing weak links.",
      },
      {
        key: "fleet_utilization",
        name: "Fleet utilization",
        definition:
          "Share of available tractor/trailer/van capacity actually generating " +
          "revenue movement — asset productivity across the fleet.",
        unit: "% of available capacity",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Balanced dedicated networks high; seasonal/unbalanced and driver-" +
            "constrained fleets lower",
          label: "planning-range",
        },
        dataSource: "Telematics asset-activity vs fleet roster and available hours (TMS/ELD)",
        whyItMatters:
          "Utilization is the asset-economics read; idle tractors and trailers are " +
          "capital and depreciation with no revenue, and driver shortage often caps it.",
      },
      {
        key: "fuel_cost_per_mile",
        name: "Fuel cost per mile",
        definition:
          "Fuel spend per mile run, the largest variable cost line in OTR/fleet " +
          "operation and the most exogenous (set by the diesel market).",
        unit: "$ / mile",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.4,
          high: 0.9,
          basis:
            "Tracks diesel price and fleet MPG; largely exogenous — controllable " +
            "only via idle reduction, route/speed, and equipment efficiency",
          label: "planning-range",
        },
        dataSource: "Fuel-card/telematics fuel data vs telematics miles",
        whyItMatters:
          "Fuel per mile is a dominant, market-driven cost; AI moves it only at the " +
          "margin (idle, routing, deadhead), so claims of large fuel ROI deserve scrutiny.",
      },
      {
        key: "dwell_time",
        name: "Dwell time (detention)",
        definition:
          "Time a driver/asset spends waiting at a shipper or receiver facility " +
          "beyond free time — drives detention cost, lost capacity, and driver churn.",
        unit: "hours / stop",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 4,
          basis:
            "Appointment-disciplined facilities low; congested/poorly-scheduled " +
            "docks materially higher and a major HOS-clock and capacity drain",
          label: "planning-range",
        },
        dataSource: "Telematics geofence arrival/departure vs appointment times; detention billing",
        whyItMatters:
          "Dwell burns the driver's HOS clock, strands capacity, and fuels driver " +
          "attrition; it is a hidden capacity tax that appointment/visibility data exposes.",
      },
      {
        key: "claims_damage_rate",
        name: "Claims & damage rate",
        definition:
          "Share of shipments incurring a freight claim for loss or damage, " +
          "expressed against total shipments (or as claims cost per shipment).",
        unit: "% of shipments",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.2,
          high: 2,
          basis:
            "Mode- and handling-dependent; fragile/cold-chain and high-touch " +
            "last-mile higher, palletized FTL lower",
          label: "planning-range",
        },
        dataSource: "Claims management system / TMS claims joined to carrier and lane",
        whyItMatters:
          "Claims and damage erode perfect order and margin and signal handling, " +
          "carrier, or cold-chain breakdowns — a direct OTIF and cost detractor.",
      },
      {
        key: "carrier_on_time_pct",
        name: "Carrier on-time %",
        definition:
          "Share of tendered loads a carrier delivers within the agreed pickup/" +
          "delivery window — the procurement-side reliability scorecard per carrier.",
        unit: "% of loads",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 88,
          high: 98,
          basis:
            "Contract carriers on dedicated lanes high; spot-market and capacity-" +
            "constrained lanes lower and more volatile",
          label: "planning-range",
        },
        dataSource: "TMS tender acceptance + EDI 214 milestones by carrier/lane",
        whyItMatters:
          "Carrier on-time is the lever procurement controls; it feeds OTIF directly " +
          "and is the basis for routing-guide and award decisions.",
      },
      {
        key: "picks_per_hour",
        name: "Warehouse picks per hour",
        definition:
          "Average order-lines or units picked per labor hour in the DC — the core " +
          "productivity measure of warehouse outbound operations.",
        unit: "picks / labor hour",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 200,
          basis:
            "Pick method-dependent (piece vs case vs goods-to-person automation); " +
            "no single band fits — track against the DC's own method and baseline",
          label: "planning-range",
        },
        dataSource: "WMS/labor-management pick transactions vs labor hours",
        whyItMatters:
          "Picks per hour is the labor-economics read of the DC; it bounds outbound " +
          "throughput and dock-to-stock and is where warehouse AI/automation is funded to lift.",
      },
      {
        key: "returns_processing_cost",
        name: "Returns processing cost per unit",
        definition:
          "Fully loaded cost to receive, inspect, disposition, and restock or " +
          "dispose of a returned unit — the reverse-logistics unit economic.",
        unit: "$ / returned unit",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Category- and disposition-mix specific; high-touch inspection/refurb " +
            "costly, automated grade-and-restock cheap — track against own baseline",
          label: "planning-range",
        },
        dataSource: "Returns/WMS reverse-flow transactions joined to disposition cost",
        whyItMatters:
          "Reverse logistics is a fast-growing, under-measured cost and a margin " +
          "and sustainability lever; cost per returned unit makes the leakage visible.",
      },
    ],

    painThemes: [
      {
        key: "dirty_visibility_data",
        name: "Dirty EDI / telematics — the visibility binding constraint",
        description:
          "Shipment status depends on EDI 214 milestones, telematics pings, and " +
          "appointment data that arrive late, incomplete, or mis-mapped, so the " +
          "'control tower' shows stale or wrong status — visibility is a data " +
          "problem before it is an optimization problem, and it gates OTIF.",
        detectionSignal:
          "OTIF disputes resolved by phone/email; 'in transit' loads with no recent " +
          "ping; carriers that do not send EDI 214; appointment times kept in spreadsheets.",
        diagnosticQuestion:
          "For an in-transit load, can you see a current, trustworthy status and ETA " +
          "from system data alone, or does someone have to call the carrier?",
      },
      {
        key: "deadhead_empty_miles",
        name: "Deadhead & empty-mile waste",
        description:
          "Unbalanced lane networks and poor backhaul matching leave tractors " +
          "running empty between loads, burning fuel and capacity with zero revenue " +
          "— the most directly controllable cost waste in the fleet.",
        detectionSignal:
          "High empty-miles %; one-way lanes with no backhaul plan; manual load-" +
          "matching; drivers idle between assignments.",
        diagnosticQuestion:
          "What is your empty-miles percentage by lane, and how are backhauls and " +
          "continuous moves planned today?",
      },
      {
        key: "fuel_driver_exposure",
        name: "Fuel and driver-capacity exposure (largely exogenous)",
        description:
          "The two dominant cost lines — fuel per mile and driver pay/availability " +
          "— are set by diesel markets, HOS regulation, and labor supply, so they " +
          "swing the cost structure regardless of internal efficiency, and software " +
          "moves them only at the margin.",
        detectionSignal:
          "Cost-per-mile volatility tracking diesel prices; chronic driver vacancies; " +
          "rising driver pay/turnover; HOS-driven service failures.",
        diagnosticQuestion:
          "How much of your cost-per-mile swing is fuel and driver pay, and how " +
          "exposed are your service commitments to driver availability?",
      },
      {
        key: "warehouse_labor_throughput",
        name: "Warehouse labor & throughput constraint",
        description:
          "DC outbound throughput is capped by labor availability, productivity, " +
          "and slotting; seasonal peaks and turnover make picks-per-hour and dock-" +
          "to-stock volatile, starving outbound OTIF when volume spikes.",
        detectionSignal:
          "Peak-season temp-labor surges; high warehouse turnover; manual slotting; " +
          "backlogged put-away; outbound cutoffs missed under volume.",
        diagnosticQuestion:
          "What is your picks-per-hour and dock-to-stock by DC, and how do they hold " +
          "up under peak volume and labor turnover?",
      },
      {
        key: "carrier_procurement_volatility",
        name: "Carrier procurement & capacity volatility",
        description:
          "Routing guides degrade as contract carriers reject tenders in tight " +
          "markets, pushing loads to costly spot capacity; rate benchmarking and " +
          "award decisions lag the market, eroding both cost and service.",
        detectionSignal:
          "High tender-rejection / routing-guide depth; heavy spot-market reliance; " +
          "annual-only RFP cycles; no lane-level rate benchmarking.",
        diagnosticQuestion:
          "What is your primary-carrier tender acceptance and routing-guide depth, " +
          "and how often do you re-benchmark lane rates?",
      },
      {
        key: "detention_dwell",
        name: "Detention, dwell & appointment chaos",
        description:
          "Poor dock scheduling and appointment discipline create driver dwell that " +
          "burns HOS hours, triggers detention billing, strands capacity, and drives " +
          "driver attrition — a hidden capacity tax across the network.",
        detectionSignal:
          "High dwell at specific facilities; detention disputes; appointment no-" +
          "shows; driver complaints; HOS-driven late deliveries from waiting.",
        diagnosticQuestion:
          "Where is dwell concentrated by facility, and is appointment scheduling " +
          "tied to live yard/dock capacity or run on a static calendar?",
      },
      {
        key: "cold_chain_reverse_blind_spots",
        name: "Cold-chain & reverse-logistics blind spots",
        description:
          "Temperature excursions in cold chain and the cost/condition of returns " +
          "are tracked late and in aggregate, so spoilage, claims, and reverse-flow " +
          "cost surface after the fact rather than as live, preventable signals.",
        detectionSignal:
          "Cold-chain monitored by spot checks not continuous telematics; rising " +
          "spoilage/claims; returns cost buried in COGS; no disposition optimization.",
        diagnosticQuestion:
          "Do you have continuous temperature telemetry on cold-chain lanes and a " +
          "measured cost-per-returned-unit, or only periodic checks and aggregate cost?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "predictive_eta_visibility",
        name: "Predictive ETA & real-time visibility intelligence",
        valueMechanism:
          "Fuse telematics, EDI 214, weather, and traffic into trustworthy " +
          "real-time status and predictive ETAs, and proactively flag at-risk " +
          "shipments before they miss — turning a reactive 'where is my load' " +
          "phone process into early exception management that protects OTIF. Only " +
          "as good as the underlying EDI/telematics signal.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Telematics/GPS pings and ELD data",
          "EDI 214 carrier status milestones",
          "TMS order/appointment and promised-window data",
          "Weather, traffic, and facility/yard context",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Predictive ETA is only as good as the EDI/telematics signal — dirty status produces confident-but-wrong ETAs",
          "Proactive alerts must route to a human who can act on the carrier/customer; alert fatigue erodes the value",
        ],
        metricsMoved: [
          "otif",
          "carrier_on_time_pct",
          "perfect_order_rate",
        ],
      },
      {
        key: "route_optimization_deadhead",
        name: "Route optimization & deadhead / backhaul matching",
        valueMechanism:
          "Optimize routing, continuous moves, and backhaul matching against " +
          "lanes, HOS, and service windows to cut empty miles, idle, and total " +
          "miles run — the most directly measurable fuel and cost-per-mile lever. " +
          "ROI is real but erodes against driver, union, and service-window " +
          "constraints, so gains must be re-baselined, not assumed.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Order/load origins, destinations, windows, and weights",
          "Telematics miles, lane balance, and HOS/ELD constraints",
          "Driver/domicile and equipment availability",
          "Fuel and accessorial cost by lane",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Dispatchers retain authority — optimization recommends, humans commit, given driver/union and safety rules",
          "Unconstrained re-routing that ignores HOS, service windows, or driver preference is not deployable and erodes trust",
        ],
        metricsMoved: [
          "empty_miles_pct",
          "cost_per_mile",
          "fuel_cost_per_mile",
          "fleet_utilization",
        ],
      },
      {
        key: "carrier_procurement_rate_intelligence",
        name: "Carrier procurement & dynamic rate intelligence",
        valueMechanism:
          "Benchmark lane rates, predict tender acceptance, and recommend routing-" +
          "guide and award decisions from market and historical data — reducing " +
          "spot-market exposure and improving carrier on-time by routing to the " +
          "carrier most likely to accept and perform on each lane.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical tender, acceptance, and award data (TMS)",
          "Lane rate benchmarks and market indices",
          "Carrier performance/on-time history by lane",
          "Volume forecast and routing-guide structure",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Procurement/transportation managers own award and routing-guide decisions — analytics recommend",
          "Rate predictions degrade fast in volatile capacity markets; treat as decision support, not committed price",
        ],
        metricsMoved: [
          "carrier_on_time_pct",
          "cost_per_shipment",
          "freight_pct_revenue",
        ],
      },
      {
        key: "warehouse_labor_slotting",
        name: "Warehouse labor planning, slotting & throughput optimization",
        valueMechanism:
          "Forecast DC labor demand, optimize slotting and pick paths, and balance " +
          "work to lift picks-per-hour and compress dock-to-stock — protecting " +
          "outbound throughput and OTIF through peak and turnover without simply " +
          "adding heads.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "WMS pick/put-away transactions and order profile",
          "Labor-management productivity and roster data",
          "Slotting/velocity and item-master data",
          "Volume forecast and outbound cutoff schedule",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Warehouse and labor managers own staffing and slotting changes; recommendations must respect labor agreements",
          "Slotting changes have switching cost and ergonomics/safety limits — validate before standardization",
        ],
        metricsMoved: [
          "picks_per_hour",
          "dock_to_stock",
          "otif",
        ],
      },
      {
        key: "dock_appointment_dwell",
        name: "Dock/yard appointment & dwell optimization",
        valueMechanism:
          "Schedule appointments against live yard and dock capacity and predict/" +
          "smooth dwell, cutting detention, freeing driver HOS hours, and recovering " +
          "stranded capacity — attacking a hidden capacity tax that visibility data " +
          "finally makes addressable.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Telematics geofence arrival/departure events",
          "Appointment, yard, and dock-door capacity data",
          "Detention billing and free-time terms",
          "Inbound/outbound volume and labor schedule",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Appointment changes affect shippers, receivers, and carriers — coordination and override authority stay human",
          "Dwell prediction needs clean geofence/appointment data or it mis-schedules and worsens congestion",
        ],
        metricsMoved: [
          "dwell_time",
          "fleet_utilization",
          "carrier_on_time_pct",
        ],
      },
      {
        key: "cold_chain_claims_monitoring",
        name: "Cold-chain & claims/damage monitoring",
        valueMechanism:
          "Continuously monitor temperature and handling telemetry to flag " +
          "excursions before spoilage and correlate claims/damage to carriers, " +
          "lanes, and handling — cutting spoilage, claims cost, and damage that " +
          "erode perfect order and margin.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Cold-chain temperature/condition telematics",
          "Claims and damage records joined to carrier/lane",
          "Shipment handling and accessorial events",
          "Product-specific temperature and shelf-life specs",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Excursion response (hold/divert/disposition) is a quality/food-safety decision owned by humans",
          "Sensor gaps and calibration drift produce false excursions or missed ones — monitor data quality",
        ],
        metricsMoved: [
          "claims_damage_rate",
          "perfect_order_rate",
          "returns_processing_cost",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_visibility_foundation",
        name: "Unified shipment-visibility data foundation",
        description:
          "A governed integration layer that normalizes EDI 214, telematics/ELD " +
          "pings, and TMS appointment data into one trustworthy, time-aligned " +
          "shipment status model with carrier onboarding for status compliance — " +
          "the prerequisite every visibility, ETA, and control-tower use case " +
          "depends on.",
        boundary:
          "Owns status data connectivity, normalization, and quality plus carrier " +
          "EDI/telematics onboarding; does NOT itself dispatch or re-route — it " +
          "feeds the systems that do.",
        humanAccountabilityPoint:
          "Logistics Visibility / TMS Lead (with carrier-onboarding and data-quality ownership)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "route_optimization_engine",
        name: "Constraint-aware route optimization & backhaul engine",
        description:
          "An optimization layer over the TMS that plans routes, continuous moves, " +
          "and backhauls against HOS, service windows, driver domiciles, and lane " +
          "balance, and re-optimizes as the day changes — cutting empty miles and " +
          "cost per mile while respecting driver and service constraints.",
        boundary:
          "Owns route and load-matching recommendation and re-optimization; " +
          "dispatchers retain authority to commit, and it does not override HOS, " +
          "union, or customer service-window constraints.",
        humanAccountabilityPoint: "Transportation Operations / Dispatch Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "carrier_sourcing_platform",
        name: "Carrier procurement & routing-guide intelligence",
        description:
          "A procurement layer that benchmarks lane rates, predicts tender " +
          "acceptance, and recommends routing-guide structure and awards from " +
          "market and performance history — reducing spot exposure and lifting " +
          "carrier on-time by matching loads to the right carrier per lane.",
        boundary:
          "Owns rate benchmarking, acceptance prediction, and award recommendation; " +
          "does not auto-commit awards or contractual rates without human procurement sign-off.",
        humanAccountabilityPoint: "Transportation Procurement / Carrier Management Lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "warehouse_throughput_layer",
        name: "Warehouse labor & throughput optimization layer",
        description:
          "A WMS-adjacent layer that forecasts labor demand, optimizes slotting and " +
          "pick paths, and balances work to lift picks-per-hour and compress dock-to-" +
          "stock — protecting outbound OTIF through peak and turnover.",
        boundary:
          "Owns labor-demand forecasting and slotting/work-balancing recommendation; " +
          "warehouse managers own staffing and changes, respecting labor agreements and ergonomics.",
        humanAccountabilityPoint: "Distribution-Center / Warehouse Operations Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Logistics value is unlocked in order and sized on the honest levers. The " +
        "unified shipment-visibility data foundation (clean EDI 214 + telematics + " +
        "appointment data, with carriers onboarded to send status) must exist " +
        "before predictive ETA, control-tower, and OTIF programs can deliver — " +
        "modeled OTIF gains over dirty status data are largely unrealizable. Once " +
        "the signal is clean, the durable, defensible economics are deadhead/empty-" +
        "mile reduction and cost-per-mile/shipment efficiency, plus warehouse " +
        "throughput (picks-per-hour, dock-to-stock) and detention/dwell recovery. " +
        "But fuel and driver capacity dominate cost and are largely exogenous, so " +
        "AI moves them only at the margin — sizing value on fuel ROI or " +
        "unconstrained routing is the common over-promise. Route-optimization ROI " +
        "is real but erodes against driver, union, and service-window constraints, " +
        "so benefits must be re-baselined, not assumed steady-state.",
      dominantHaircutFactors: [
        {
          factor: "EDI/telematics & status data readiness",
          rationale:
            "Visibility and ETA value collapses when EDI 214 and telematics status " +
            "is late, incomplete, or from non-compliant carriers; until the status " +
            "data foundation is real, OTIF/visibility value is largely unrealizable " +
            "— the single largest haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.55,
            basis:
              "Repeated experience where carrier status compliance and telematics " +
              "data quality capped delivered visibility/OTIF value",
            label: "planning-range",
          },
        },
        {
          factor: "Driver, HOS, union & service-window constraints",
          rationale:
            "Route, backhaul, and scheduling gains earned in theory erode against " +
            "HOS rules, driver domicile/preference, union work rules, and hard " +
            "customer service windows, bounding realizable optimization value.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis: "Observed erosion of routing/backhaul gains against driver and service constraints",
            label: "planning-range",
          },
        },
        {
          factor: "Fuel & capacity-market exogeneity",
          rationale:
            "Fuel per mile and spot capacity are set by markets, not software, so a " +
            "large share of cost movement is outside the program's control and must " +
            "not be claimed as AI-delivered savings.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Cost swings attributable to diesel and capacity markets rather than the program",
            label: "planning-range",
          },
        },
        {
          factor: "Carrier & shipper-network coordination / adoption",
          rationale:
            "Visibility, appointment, and routing-guide value depends on carriers " +
            "and shipper/receiver facilities adopting status, appointment, and EDI " +
            "behaviors the enterprise does not fully control, slowing realization.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "Multi-party adoption and carrier-onboarding experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Empty-mile / deadhead reduction from route & backhaul optimization",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported empty-mile reductions where lane data and backhaul matching " +
              "were adequate; relative reduction in empty-miles %",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in empty-miles % on targeted lanes",
        },
        {
          lever: "OTIF improvement from predictive ETA + exception management",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "OTIF point gains where the visibility signal was clean; expressed as " +
              "absolute OTIF percentage points, not relative",
            label: "planning-range",
          },
          measuredAs: "Absolute OTIF percentage-point improvement on monitored shipments",
        },
        {
          lever: "Detention/dwell reduction from appointment & dwell optimization",
          range: {
            low: 0.1,
            high: 0.3,
            basis: "Reported dwell/detention reductions at facilities with appointment discipline and geofence data",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in average dwell hours / detention cost at targeted facilities",
        },
      ],
      timeToValueBand:
        "Unified visibility data foundation incl. carrier status onboarding: 2-4 " +
        "quarters (the gating investment). Predictive ETA / exception management: " +
        "1-2 quarters once status flows. Route optimization & deadhead matching: " +
        "2-3 quarters and most sensitive to driver/service constraints. Carrier " +
        "rate intelligence and warehouse throughput: 2-4 quarters; dock/dwell and " +
        "cold-chain optimization: 3-5 quarters, gated by multi-party adoption.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "TMS (Transportation Management System)",
          role:
            "System of record for transportation planning, execution, tendering, " +
            "rating, settlement, and shipment status across modes.",
          examples: ["Oracle OTM", "Blue Yonder TMS", "SAP TM", "MercuryGate", "e2open"],
        },
        {
          name: "WMS / LMS (Warehouse / Labor Management)",
          role:
            "System of record for DC receiving, put-away, slotting, picking, " +
            "packing, shipping, and warehouse labor productivity.",
          examples: ["Manhattan Associates", "Blue Yonder WMS", "Körber", "SAP EWM"],
        },
        {
          name: "Telematics / ELD / fleet",
          role:
            "Real-time GPS, engine, HOS/ELD, and fuel telemetry for fleet assets " +
            "and drivers (the OT/edge layer of transportation).",
          examples: ["Samsara", "Geotab", "Motive", "Omnitracs"],
        },
        {
          name: "Real-time visibility platform",
          role:
            "Aggregates carrier EDI 214 + telematics into multimodal shipment " +
            "status and predictive ETA across the carrier network.",
          examples: ["project44", "FourKites", "Tive"],
        },
        {
          name: "ERP / order & finance",
          role:
            "Orders, freight spend, settlement, and cost-to-serve tied to revenue " +
            "and the inbound/outbound order book.",
          examples: ["SAP S/4HANA", "Oracle", "EDI/order-management integrations"],
        },
      ],
      roles: [
        {
          title: "VP Logistics / Transportation",
          accountability: "End-to-end logistics service (OTIF), cost-to-serve, and network performance.",
        },
        {
          title: "Transportation Operations / Dispatch Manager",
          accountability: "Routing, dispatch, deadhead/empty-miles, fleet utilization, and HOS compliance.",
        },
        {
          title: "Transportation Procurement / Carrier Manager",
          accountability: "Carrier rates, routing guide, tender acceptance, and carrier on-time performance.",
        },
        {
          title: "Distribution-Center / Warehouse Operations Manager",
          accountability: "Picks-per-hour, dock-to-stock, warehouse labor, and outbound OTIF from the DC.",
        },
        {
          title: "Fleet / Safety & Compliance Manager",
          accountability: "Fleet maintenance, driver safety, HOS/FMCSA compliance, and equipment availability.",
        },
        {
          title: "Logistics Visibility / TMS Lead",
          accountability: "Shipment-visibility data foundation, TMS/EDI/telematics integration, and carrier onboarding.",
        },
      ],
      regulatoryFrames: [
        {
          name: "FMCSA Hours-of-Service (HOS) & ELD mandate",
          relevance:
            "Federal driver hours-of-service limits and electronic-logging rules " +
            "hard-bound how routes, continuous moves, and dwell can be planned — a " +
            "constraint AI optimization must respect, not optimize away.",
        },
        {
          name: "DOT / FMCSA safety & CSA",
          relevance:
            "Carrier and driver safety regulation (CSA scores, inspections, CDL " +
            "rules) governs who can move freight and bounds capacity decisions.",
        },
        {
          name: "Customs & trade (CBP, C-TPAT, Incoterms)",
          relevance:
            "Cross-border and international moves carry customs, security-program, " +
            "and Incoterms obligations that shape ocean/air/intermodal flows and documentation.",
        },
        {
          name: "Cold-chain & product safety (FDA FSMA Sanitary Transport, GDP)",
          relevance:
            "Temperature-controlled food and pharma transport carries traceability " +
            "and handling rules that constrain cold-chain routing and disposition.",
        },
      ],
      canonicalTerms: [
        {
          term: "OTIF (On-Time-In-Full)",
          definition:
            "Delivery both on the promised date/window and in full quantity, damage-" +
            "free; the composite logistics service truth metric.",
        },
        {
          term: "Deadhead / empty miles",
          definition:
            "Miles a tractor runs without a revenue load, typically repositioning " +
            "between a delivery and the next pickup.",
        },
        {
          term: "EDI 214 (Transportation Carrier Shipment Status)",
          definition:
            "The standard EDI message carriers send to report shipment status " +
            "milestones — the backbone of system-based visibility.",
        },
        {
          term: "HOS / ELD",
          definition:
            "Hours-of-Service driver-time limits enforced via Electronic Logging " +
            "Devices; a hard planning constraint on routing and dwell.",
        },
        {
          term: "Detention / dwell",
          definition:
            "Driver/asset time spent waiting at a facility beyond free time, " +
            "incurring detention charges and burning HOS hours.",
        },
        {
          term: "3PL / 4PL",
          definition:
            "Third-party logistics (executes transportation/warehousing) vs fourth-" +
            "party logistics (orchestrates and manages multiple 3PLs and the network).",
        },
        {
          term: "Dock-to-stock",
          definition:
            "Elapsed time from a receipt hitting the dock to being put away and " +
            "available to pick — the inbound responsiveness measure of a DC.",
        },
        {
          term: "Perfect order",
          definition:
            "An order delivered on time, complete, damage-free, and with correct " +
            "documentation — the multiplicative end-to-end quality measure.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "On-time-in-full (OTIF) and its component split",
        authoritativeSource: "TMS shipment status + EDI 214 milestones / telematics POD vs promised appointment and quantity",
        whatGoodEvidenceLooksLike:
          "OTIF split into on-time vs in-full (and damage/doc) by lane, carrier, and customer program, " +
          "with status sourced from system milestones rather than manual reconciliation.",
        weakEvidenceToReject:
          "A single headline OTIF percentage built from phone-confirmed statuses with no on-time/in-full split or system milestone basis.",
      },
      {
        claim: "Empty-miles / deadhead and cost per mile",
        authoritativeSource: "Telematics/ELD GPS miles vs TMS loaded-mile records, with fleet cost build-up",
        whatGoodEvidenceLooksLike:
          "Empty-miles % and cost per mile by lane and tractor, reconciling telematics odometer miles to TMS loaded legs.",
        weakEvidenceToReject:
          "A blended fleet empty-mile estimate with no lane detail, no telematics denominator, and fuel/driver cost not separated.",
      },
      {
        claim: "Carrier on-time and tender performance",
        authoritativeSource: "TMS tender/acceptance + EDI 214 milestones by carrier and lane",
        whatGoodEvidenceLooksLike:
          "Carrier on-time % and tender acceptance by lane over a defined period, tied to routing-guide depth and spot usage.",
        weakEvidenceToReject:
          "A carrier 'is reliable' assertion with no lane-level on-time, tender, or milestone data behind it.",
      },
      {
        claim: "Warehouse throughput (picks-per-hour, dock-to-stock)",
        authoritativeSource: "WMS/LMS pick and receiving transactions vs labor hours",
        whatGoodEvidenceLooksLike:
          "Picks-per-hour and dock-to-stock by DC and pick method over a defined period, normalized to labor hours and volume.",
        weakEvidenceToReject:
          "A plant-wide productivity number with no pick-method context, labor-hour denominator, or peak/off-peak separation.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your OTIF by lane, carrier, and customer program, and can you split it into on-time versus in-full from system data?",
      "For an in-transit load, can you see a trustworthy current status and ETA from system data, or does someone have to call the carrier?",
      "What is your empty-miles percentage by lane, and how are backhauls and continuous moves planned today?",
      "How much of your cost-per-mile swing is fuel and driver pay, and how exposed are your service commitments to driver availability?",
      "What is your primary-carrier tender acceptance and routing-guide depth, and how often do you re-benchmark lane rates?",
      "What are your picks-per-hour and dock-to-stock by DC, and how do they hold up under peak volume and labor turnover?",
      "Where is dwell concentrated by facility, and is appointment scheduling tied to live dock capacity or run on a static calendar?",
    ],
    maturitySignals: [
      "A unified visibility foundation normalizes EDI 214 and telematics into trusted shipment status and predictive ETA, with carriers onboarded to send status.",
      "OTIF is decomposed into on-time vs in-full by lane/carrier/customer and trusted, not phone-reconciled.",
      "Empty-miles % is measured by lane and backhaul/continuous moves are planned, not ad hoc.",
      "Carrier awards and routing guides are rate-benchmarked and acceptance-aware, with low spot reliance.",
      "Warehouse picks-per-hour and dock-to-stock are measured by DC and hold up through peak via labor planning and slotting.",
    ],
    redFlags: [
      "OTIF is a single number reconciled by phone/email — shipment status data cannot be trusted and visibility is the real gap.",
      "EDI 214 and telematics status cannot be joined into a trustworthy current status — the 'control tower' is oversold on dirty data.",
      "Value is sized on fuel savings or large cost-per-mile cuts as if AI controls fuel and driver markets — the program over-promises.",
      "Route optimization is proposed without HOS, union, driver-domicile, and service-window constraints — recommendations are not deployable.",
      "AI is proposed to auto-commit carrier awards or auto-dispatch without human authority — accountability and constraints are bypassed.",
      "Cold-chain or returns cost is tracked only in aggregate after the fact, with no continuous telemetry or measured cost-per-returned-unit.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "TMS platform vendors",
        category: "Transportation management",
        switchingCost:
          "High — TMS is embedded in tendering, rating, settlement, and carrier integrations; replacement is a multi-quarter program.",
        renewalDynamics:
          "Long enterprise terms tied to network programs; negotiate on mode/lane scaling, integration, and managed-service bundling.",
      },
      {
        vendorName: "WMS / LMS vendors",
        category: "Warehouse & labor management",
        switchingCost:
          "Extreme — WMS is embedded in DC execution, slotting, and integrations; re-platforming a network of DCs is a multi-year effort.",
        renewalDynamics:
          "Sticky enterprise agreements; re-sourced only during DC modernization or M&A consolidation.",
      },
      {
        vendorName: "Real-time visibility platform vendors",
        category: "Shipment visibility / predictive ETA",
        switchingCost:
          "Moderate — value is in the carrier-onboarding network and integrations; replaceable but re-onboarding carriers is the real cost.",
        renewalDynamics:
          "Competitive, fast-moving market; negotiate on carrier-network coverage, data egress, and outcome-based status quality.",
      },
      {
        vendorName: "Telematics / ELD fleet vendors",
        category: "Fleet telematics / compliance",
        switchingCost:
          "Moderate-high — hardware in every vehicle plus ELD-compliance dependency; swappable with hardware swap-out and re-integration.",
        renewalDynamics:
          "Hardware + subscription; negotiate on hardware amortization, data ownership, and open APIs to avoid lock-in.",
      },
    ],
    switchingCosts:
      "The execution core (TMS, WMS) and in-vehicle telematics are effectively " +
      "non-switchable in isolation; the negotiable value frontier is the " +
      "visibility, optimization, and analytics layer around them, where switching " +
      "cost is moderate — but the hidden cost there is carrier/fleet re-onboarding, " +
      "so contract for data egress, open APIs (EDI/API), and portable carrier " +
      "onboarding to keep that frontier competitive.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured empty-mile reduction, OTIF points, or dwell/detention savings",
      "Open standards and data egress (EDI, API, telematics data ownership) to avoid TMS/visibility lock-in",
      "Carrier-network coverage and portable carrier-onboarding commitments from visibility vendors",
      "Pilot-to-scale gating with parity proof on the enterprise's own lanes and DCs before network-wide rollout",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      otif_metric: [
        "TMS/EDI 214 status milestones",
        "on-time vs in-full split",
        "lane/carrier/customer granularity",
      ],
      cost_per_mile_claim: [
        "telematics/ELD miles denominator",
        "fleet cost build-up with fuel and driver separated",
        "lane/tractor granularity",
      ],
      carrier_performance_claim: [
        "TMS tender/acceptance data",
        "EDI 214 milestones by carrier/lane",
        "routing-guide depth and spot usage",
      ],
      warehouse_throughput_claim: [
        "WMS/LMS pick and receiving transactions",
        "labor-hour denominator",
        "pick-method and peak/off-peak context",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. EDI/telematics readiness, driver/service constraints, fuel exogeneity)",
      ],
    },
    citationStandard:
      "Quantitative logistics claims cite the TMS / WMS / telematics / EDI 214 / " +
      "visibility source and the period, state the lane / carrier / DC granularity, " +
      "and (for OTIF) the on-time vs in-full decomposition. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied — " +
      "never a single asserted ROI or fuel/optimization saving, given fuel and " +
      "driver costs are largely exogenous.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's EDI/telematics status data is dirty or carriers are not onboarded — frame OTIF/visibility value as conditional on data readiness, not an achievable number.",
      "OTIF is quoted without an on-time vs in-full split — present as not-yet-trustworthy and ask for decomposition.",
      "Cost-per-mile or fuel savings are projected — separate the exogenous fuel/capacity-market component from program-controllable deadhead/idle.",
      "Route-optimization gains are cited without HOS, union, driver-domicile, and service-window constraints — flag erosion risk.",
      "Vendor-reported empty-mile or OTIF outcomes are cited — mark as vendor claims pending validation on the tenant's own lanes and DCs.",
    ],
    inferenceLanguage: [
      "Across OTR/intermodal networks, empty-miles typically run...",
      "Without your shipment-status and telematics data, the industry pattern suggests...",
      "Networks at this visibility maturity commonly see OTIF around...",
      "Where the EDI/telematics signal is clean, programs of this type have delivered OTIF gains of...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this tenant",
      "This tenant's actual OTIF, empty-miles %, or cost per mile",
      "A claim that a specific lane or carrier is the problem without the tenant's data",
      "A claim that AI can deliver fuel savings the fuel market itself does not, or re-route without driver/service constraints",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "freight / transportation cost breakdown / where the spend goes",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack cost per shipment/mile by linehaul, fuel, driver, accessorials, and last-mile to show where logistics spend concentrates.",
    },
    {
      questionPattern: "value or cost impact of a logistics program / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current cost-to-serve to projected, with EDI/telematics-readiness, driver/service, and fuel-exogeneity haircuts shown.",
    },
    {
      questionPattern: "carrier scorecard / which carriers to award or route to",
      exhibitKind: "table",
      note: "Carrier on-time %, tender acceptance, claims/damage, cost per lane, and recommended routing-guide action.",
    },
    {
      questionPattern: "logistics & transportation KPI scorecard",
      exhibitKind: "table",
      note: "OTIF, cost per mile/shipment, empty-miles %, perfect order, fleet utilization, dwell, dock-to-stock, picks/hour vs planning ranges.",
    },
    {
      questionPattern: "OTIF / on-time trend and exception drivers",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend OTIF (split on-time vs in-full) over time with annotated exception drivers (carrier, lane, dwell).",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The unified visibility data foundation (clean EDI 214 + telematics + carrier onboarding) is funded as the first deliverable, not assumed",
      "Value is scoped on deadhead/cost-per-mile and OTIF with transportation and warehouse operations owning the targets",
      "Optimization is designed inside HOS, union, driver, and service-window constraints so dispatchers trust and adopt it",
      "Fuel and driver-capacity exogeneity is named explicitly so the program is not credited with market-driven cost swings",
    ],
    failureDrivers: [
      "Control-tower visibility or predictive ETA bought before the EDI/telematics signal is clean — confident but wrong status",
      "Sizing value on fuel savings or large cost-per-mile cuts as if AI controls exogenous fuel and capacity markets",
      "Unconstrained route optimization that ignores HOS, union, and service windows — recommendations that cannot be deployed",
      "Underestimating carrier/shipper multi-party onboarding effort, so visibility and appointment value never reaches scale",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Predictive ETA / exception management and route-and-deadhead optimization " +
      "adopt first because the value is tangible and the workflow change is " +
      "contained; carrier rate intelligence and warehouse throughput follow once " +
      "data and history mature; dock/dwell appointment optimization and cold-chain " +
      "monitoring come last, gated by multi-party (carrier, shipper, receiver) " +
      "coordination and clean geofence/telemetry.",
    roiClarity: "medium",
    roiClarityBasis:
      "Empty miles, dwell hours, picks-per-hour, and OTIF points are directly " +
      "measurable, but attribution is muddied because fuel and driver capacity — " +
      "the dominant cost lines — are largely exogenous, and visibility/OTIF value " +
      "depends heavily on EDI/telematics data readiness — making ROI firm where " +
      "the signal is clean and the lever is deadhead/throughput, and speculative " +
      "where it leans on fuel or dirty status data.",
  },

  regulatoryFrame: {
    name: "FMCSA HOS/ELD & DOT safety (with customs and cold-chain regimes)",
    relevance:
      "The dominant regulatory frame for transportation: FMCSA Hours-of-Service " +
      "and the ELD mandate hard-bound how routes, continuous moves, and dwell can " +
      "be planned — a constraint AI optimization must respect, not optimize away — " +
      "and DOT/FMCSA safety (CSA, CDL, inspections) governs who can move freight. " +
      "Cross-border moves add customs/trade obligations (CBP, C-TPAT, Incoterms) " +
      "and temperature-controlled freight adds FDA FSMA Sanitary Transport / GDP " +
      "rules (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (parallel-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
