// Consilium expert — Supply Chain Transformation (cross-cutting).
//
// W3 wave2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting,
// cross-industry expert spanning the end-to-end supply chain optimized with AI
// + automation: demand planning/forecasting, inventory optimization, sales &
// operations planning (S&OP), logistics/transportation, supplier risk &
// resilience, and procurement-adjacent fulfillment. Spans the middle/back
// office of any goods-moving enterprise (retail, CPG, industrial, healthcare
// products, pharma) — product-aware (ERP/APS/WMS/TMS), not product-locked.
//
// CORE DOCTRINE — DATA QUALITY IS THE BINDING CONSTRAINT. Every supply-chain AI
// bet runs on master data, demand history, lead times, and inventory positions.
// When that substrate is dirty, fragmented, or latency-bound, model accuracy
// collapses regardless of algorithm sophistication. And the headline prize —
// forecast accuracy — is the most fragile: accuracy gains earned in stable
// periods ERODE in volatile demand (promotions, disruptions, new-product
// introductions, demand shocks), so value must be sized as a planning range and
// re-baselined against volatility, never asserted as a steady-state lift. The
// durable, defensible value sits in working-capital release (inventory turns /
// days of inventory) and service-level protection (OTIF / fill rate), which
// survive forecast error far better than a single MAPE number does.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const supplyChainTransformationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.supply-chain-transformation",
    expertName: "Supply Chain Transformation Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "supply-chain-transformation",
    scopeNote:
      "Cross-cutting, cross-industry transformation of the end-to-end supply " +
      "chain optimized with AI + automation: demand planning & forecasting, " +
      "inventory optimization, sales & operations planning (S&OP / IBP), " +
      "logistics & transportation, supplier risk & resilience, and " +
      "procurement-adjacent fulfillment (OTIF, perfect order). Spans the " +
      "middle/back office of any goods-moving enterprise (retail, CPG, " +
      "industrial, distribution, healthcare products) — product-aware across " +
      "ERP / APS planning suites / WMS / TMS, not product-locked. CORE " +
      "DOCTRINE: data quality is the binding constraint and forecast-accuracy " +
      "gains erode in volatile demand, so durable value is sized on " +
      "working-capital release and service-level protection, not on a single " +
      "MAPE lift. Excludes manufacturing-floor / OT process control, retail " +
      "merchandising strategy, and strategic category sourcing (separate " +
      "experts) — this expert owns plan-to-deliver throughput and resilience.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "forecast_accuracy_mape",
        name: "Forecast accuracy (MAPE)",
        definition:
          "Mean absolute percentage error of the demand forecast versus actual " +
          "shipments/sales at the planning grain (item x location x period); " +
          "lower MAPE = more accurate. Often reported alongside forecast bias.",
        unit: "% error (MAPE)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Gartner / IBF demand-planning benchmarks; stable high-volume SKUs " +
            "reach 15-25% MAPE, long-tail / promotional / new-product items run " +
            "40-50%+ and accuracy erodes sharply in volatile demand",
          label: "planning-range",
        },
        dataSource:
          "APS / demand-planning system: forecast snapshots versus actual " +
          "shipment history from the ERP, at the planning grain",
        whyItMatters:
          "The headline planning-quality unit and the number every ML " +
          "forecasting business case is judged on — but the most fragile: it is " +
          "grain- and volatility-dependent, degrades in disruption, and must be " +
          "read with bias, not in isolation.",
      },
      {
        key: "forecast_bias",
        name: "Forecast bias",
        definition:
          "Systematic over- or under-forecasting — the signed average of " +
          "forecast-minus-actual, ideally near zero. Distinct from MAPE, which " +
          "measures magnitude regardless of direction.",
        unit: "% (signed)",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: -5,
          high: 5,
          basis:
            "IBF / demand-planning practice; a healthy plan holds bias within " +
            "roughly +/-5%, persistent bias outside this signals gaming or a " +
            "broken sensing loop",
          label: "planning-range",
        },
        dataSource:
          "APS / demand-planning system: signed forecast-error tracking over a " +
          "trailing window by item x location",
        whyItMatters:
          "Bias is the silent driver of the bullwhip and of structural over- or " +
          "under-stocking: a low-MAPE forecast that is persistently biased still " +
          "builds excess or starves service. It exposes sandbagging and plan " +
          "gaming that accuracy alone hides.",
      },
      {
        key: "inventory_turns",
        name: "Inventory turns",
        definition:
          "Cost of goods sold divided by average inventory value over the " +
          "period — how many times inventory cycles per year. Higher turns = " +
          "less working capital tied up per dollar of sales.",
        unit: "turns / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 4,
          high: 12,
          basis:
            "APQC / industry inventory benchmarks; varies sharply by sector — " +
            "grocery/distribution run high, industrial/spares run low",
          label: "planning-range",
        },
        dataSource:
          "ERP / finance: COGS over average inventory at cost from the GL and " +
          "inventory sub-ledger",
        whyItMatters:
          "The headline working-capital efficiency unit — the durable prize that " +
          "survives forecast error better than MAPE. Optimizing turns frees cash " +
          "without sacrificing service when inventory is positioned, not just cut.",
      },
      {
        key: "days_of_inventory",
        name: "Days of inventory on hand (DIO)",
        definition:
          "Average inventory expressed as the number of days of forward demand " +
          "it covers (365 / inventory turns, or average inventory / daily COGS).",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "APQC / industry working-capital benchmarks; lean replenishment " +
            "models run 30-45 days, long-lead / safety-heavy categories 75-90+",
          label: "planning-range",
        },
        dataSource:
          "ERP / finance: average inventory value over daily COGS from the GL " +
          "and inventory sub-ledger",
        whyItMatters:
          "The cash-language counterpart to turns the CFO reads directly — every " +
          "day of inventory is cash on the floor. Inventory optimization targets " +
          "the right DIO per node/segment, not a blanket reduction.",
      },
      {
        key: "stockout_rate",
        name: "Stockout rate",
        definition:
          "Share of item x location x period combinations (or demand instances) " +
          "where on-hand inventory was insufficient to meet demand — a lost-sale " +
          "/ service-failure signal.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 8,
          basis:
            "Retail/CPG availability benchmarks; world-class on-shelf " +
            "availability holds stockouts ~1-3%, undermanaged assortments 5-8%+",
          label: "planning-range",
        },
        dataSource:
          "ERP / WMS inventory positions versus demand, and POS/on-shelf " +
          "availability data where retail",
        whyItMatters:
          "The service-failure side of the inventory imbalance — stockouts and " +
          "excess coexist when inventory is mispositioned, not under-bought. It " +
          "directly drives lost sales and customer defection.",
      },
      {
        key: "excess_obsolete_pct",
        name: "Excess & obsolete (E&O) inventory %",
        definition:
          "Share of inventory value classified as excess (beyond a forward-" +
          "coverage threshold) or obsolete (no forward demand) — write-down and " +
          "carrying-cost risk.",
        unit: "% of inventory value",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 15,
          basis:
            "Industry inventory-health benchmarks; healthy estates hold E&O " +
            "~2-5%, poor forecasting / lifecycle management drives 10-15%+",
          label: "planning-range",
        },
        dataSource:
          "ERP inventory aging and demand-coverage analysis against item " +
          "lifecycle status",
        whyItMatters:
          "The excess side of the inventory imbalance and a direct margin leak. " +
          "High E&O alongside stockouts is the signature of mispositioning and " +
          "forecast bias — the imbalance to attack, not the total to cut.",
      },
      {
        key: "perfect_order_rate",
        name: "Perfect order rate",
        definition:
          "Share of orders delivered complete, on time, damage-free, and with " +
          "correct documentation — the multiplicative all-or-nothing service " +
          "quality measure.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "APQC / SCOR perfect-order benchmarks; world-class 95%+, median " +
            "85-90%, weak fulfillment below 80% once all components multiply",
          label: "planning-range",
        },
        dataSource:
          "Order-to-delivery records across ERP/WMS/TMS: completeness, " +
          "timeliness, damage, and documentation flags joined per order",
        whyItMatters:
          "The composite customer-experience unit of the supply chain — because " +
          "it multiplies its components, small failures in each compound. It is " +
          "the SCOR reliability headline boards recognize.",
      },
      {
        key: "otif_rate",
        name: "On-time in-full (OTIF) %",
        definition:
          "Share of order lines (or orders) delivered both on the committed " +
          "date and in the full quantity ordered — the core supplier/fulfillment " +
          "reliability measure, increasingly with retailer penalties attached.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 98,
          basis:
            "Retail/CPG OTIF benchmarks; major retailers demand 95-98% with " +
            "chargebacks below threshold, broad supplier base often sits 85-92%",
          label: "planning-range",
        },
        dataSource:
          "Order-to-delivery data from ERP/TMS matched to committed dates and " +
          "ordered quantities; retailer scorecards where applicable",
        whyItMatters:
          "The headline fulfillment-reliability KPI and, with OTIF chargebacks, " +
          "a hard P&L line. It is the service-level prize that AI planning " +
          "protects even when forecast accuracy slips.",
      },
      {
        key: "cash_to_cash_cycle",
        name: "Cash-to-cash cycle time",
        definition:
          "Days inventory outstanding plus days sales outstanding minus days " +
          "payable outstanding — the working-capital span from cash paid for " +
          "inputs to cash collected from customers.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Hackett / working-capital benchmarks; sector-dependent, with " +
            "best-in-class supply chains compressing the inventory component hard",
          label: "planning-range",
        },
        dataSource:
          "ERP / finance: DIO, DSO, and DPO components from the GL and " +
          "sub-ledgers",
        whyItMatters:
          "The board-level working-capital denominator that ties supply-chain " +
          "performance to the balance sheet. The inventory (DIO) component is the " +
          "lever supply-chain transformation directly bends.",
      },
      {
        key: "logistics_cost_pct_revenue",
        name: "Logistics cost as % of revenue",
        definition:
          "Total transportation, warehousing, and freight cost (inbound and " +
          "outbound, including expedite/premium freight) as a percentage of " +
          "enterprise revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 12,
          basis:
            "CSCMP State-of-Logistics / industry ranges; lane- and sector-" +
            "dependent, with expedite/premium freight the swing factor",
          label: "planning-range",
        },
        dataSource:
          "TMS / freight-audit-and-pay data and the GL: total logistics spend " +
          "over enterprise revenue",
        whyItMatters:
          "The headline logistics-efficiency unit and a large, partly " +
          "discretionary cost pool. Premium/expedite freight inside it is the " +
          "tell-tale of poor planning — the cost AI route/load optimization and " +
          "better forecasting attack first.",
      },
      {
        key: "supplier_on_time_rate",
        name: "Supplier on-time delivery rate",
        definition:
          "Share of inbound purchase-order lines received on or before the " +
          "committed/promised date — the upstream reliability that bounds " +
          "downstream OTIF and safety-stock need.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 97,
          basis:
            "Supplier-performance benchmarks; reliable strategic suppliers 95%+, " +
            "long-tail and constrained-capacity suppliers well below",
          label: "planning-range",
        },
        dataSource:
          "ERP procurement: PO promised dates versus goods-receipt timestamps " +
          "by supplier and material",
        whyItMatters:
          "Upstream reliability is the root cause of downstream service failure " +
          "and of inflated safety stock. Supplier-risk monitoring and lead-time " +
          "sensing target the variability this metric exposes.",
      },
      {
        key: "fill_rate",
        name: "Order fill rate",
        definition:
          "Share of demand (units or order lines) satisfied from available " +
          "stock without backorder at the time of order — the availability " +
          "measure that pairs with stockout rate.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Service-level benchmarks; target fill rate is segment-dependent " +
            "(A-items 98-99%, long-tail lower by design)",
          label: "planning-range",
        },
        dataSource:
          "ERP order management: lines/units shipped-complete versus ordered " +
          "from on-hand inventory",
        whyItMatters:
          "The positive-availability service unit inventory optimization tunes " +
          "per segment. Differentiated fill-rate targets (not a blanket 99%) are " +
          "how working capital is released without hurting the customer.",
      },
    ],

    painThemes: [
      {
        key: "forecast_bias_and_gaming",
        name: "Persistent forecast bias & plan gaming",
        description:
          "Forecasts carry a systematic directional error — sales sandbags to " +
          "make targets easy, planners pad to protect service — so the plan is " +
          "structurally wrong in one direction even when MAPE looks acceptable, " +
          "driving either chronic excess or chronic stockouts.",
        detectionSignal:
          "Signed bias persistently outside +/-5%, manual overrides that move " +
          "the forecast one way, demand plan that consistently misses budget in " +
          "the same direction, safety stock quietly absorbing the error.",
        diagnosticQuestion:
          "What is your forecast bias (not just MAPE) by item segment, and how " +
          "much of the demand plan is manual override versus statistical/ML base?",
      },
      {
        key: "bullwhip_amplification",
        name: "Bullwhip / demand-signal amplification",
        description:
          "Small swings in end demand amplify into large swings in orders and " +
          "inventory upstream because each tier reacts to orders rather than to " +
          "true demand, batches buys, and hoards safety stock — whipsawing " +
          "production, freight, and working capital.",
        detectionSignal:
          "Order variability rising at each upstream tier, lumpy buying, " +
          "expedite spikes followed by excess, suppliers complaining of erratic " +
          "schedules, no shared end-demand signal across tiers.",
        diagnosticQuestion:
          "Do upstream tiers plan to true downstream demand (POS/consumption) or " +
          "to the orders they receive, and how lumpy is your buying pattern?",
      },
      {
        key: "inventory_imbalance",
        name: "Inventory imbalance — stockouts AND excess together",
        description:
          "The estate simultaneously carries too much of the wrong items and " +
          "too little of the right ones: high E&O and high stockouts coexist " +
          "because inventory is mispositioned across nodes and segments, not " +
          "uniformly over- or under-bought.",
        detectionSignal:
          "High excess/obsolete % and elevated stockout rate at the same time, " +
          "frequent stock transfers between locations, write-downs alongside lost " +
          "sales, one blanket safety-stock policy across very different items.",
        diagnosticQuestion:
          "Are you seeing stockouts and excess at the same time — and is safety " +
          "stock set per item/node by service segment, or by a single blanket rule?",
      },
      {
        key: "siloed_sop",
        name: "Siloed, spreadsheet-bound S&OP",
        description:
          "Demand, supply, and finance plan in disconnected spreadsheets on " +
          "different cadences, so the S&OP cycle reconciles stale numbers in long " +
          "meetings, decisions lag the market, and there is no single agreed plan " +
          "of record to execute against.",
        detectionSignal:
          "Monthly-only S&OP, plans assembled in spreadsheets, demand/supply/" +
          "finance numbers that do not tie, scenario analysis impossible in the " +
          "meeting, decisions deferred for lack of an agreed plan.",
        diagnosticQuestion:
          "Is your S&OP/IBP run on one connected planning system with an agreed " +
          "plan of record, or reconciled in spreadsheets across functions?",
      },
      {
        key: "supplier_risk_blindspot",
        name: "Supplier-risk & multi-tier resilience blind spot",
        description:
          "Visibility stops at tier-1, so sub-tier dependencies, single-source " +
          "concentrations, and supplier financial/geopolitical risk are unknown " +
          "until a disruption hits — leaving the chain reacting to failures " +
          "instead of pre-positioning against them.",
        detectionSignal:
          "No mapped tier-2/tier-3 dependencies, single-source criticality " +
          "unquantified, supplier risk reviewed annually not monitored, recent " +
          "disruptions that surprised the team, expedite scrambles after the fact.",
        diagnosticQuestion:
          "Do you have monitored visibility beyond tier-1 — sub-tier " +
          "dependencies, single-source concentrations, and supplier financial/" +
          "geopolitical risk — or do disruptions surprise you?",
      },
      {
        key: "expedite_freight_overspend",
        name: "Expedite & premium-freight overspend",
        description:
          "Planning gaps and reactive firefighting are paid down in premium and " +
          "expedited freight — air over ocean, LTL over consolidated TL, " +
          "off-network carriers at spot rates — so a large, partly avoidable cost " +
          "pool accumulates as the symptom of upstream planning failure.",
        detectionSignal:
          "Premium/expedite freight a rising share of logistics cost, frequent " +
          "off-network carrier use at spot, poor load consolidation, freight " +
          "spikes correlating with stockouts and forecast misses.",
        diagnosticQuestion:
          "What share of your freight is premium/expedite versus planned, and " +
          "how much of it traces back to forecast misses and late supplier " +
          "deliveries rather than genuine emergencies?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ml_demand_forecasting",
        name: "ML demand forecasting & demand sensing",
        valueMechanism:
          "Replace univariate statistical forecasts with ML models that learn " +
          "from causal drivers (price, promotion, weather, events, POS/" +
          "consumption signals) and sense short-term shifts — improving accuracy " +
          "and cutting bias on forecastable items, which lets safety stock and " +
          "expedite freight come down. HONEST BOUND: the lift is largest on " +
          "stable, high-volume demand and erodes on promotions, new products, " +
          "and disruption, so it is sized as a planning range, not a fixed gain.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Clean, deep shipment/sales history at the planning grain",
          "Causal drivers (price, promo calendar, weather, events) aligned to history",
          "Downstream POS / consumption signal for sensing where available",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Accuracy degrades in volatile demand — guard against over-trusting a single MAPE",
          "Garbage-in master data and demand history silently cap achievable accuracy",
          "Planner overrides must be tracked so the model can learn, not be quietly gamed",
        ],
        metricsMoved: [
          "forecast_accuracy_mape",
          "forecast_bias",
          "stockout_rate",
        ],
      },
      {
        key: "inventory_optimization",
        name: "Multi-echelon inventory optimization (MEIO)",
        valueMechanism:
          "Set safety stock and reorder policies per item x node x service " +
          "segment across the network simultaneously — accounting for lead-time " +
          "and demand variability and pooling effects — so inventory is " +
          "positioned where it protects service for the least cash, attacking " +
          "stockouts and excess together rather than cutting a blanket level.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Accurate on-hand and in-transit inventory positions by node",
          "Lead times and lead-time variability by supplier/lane",
          "Demand variability and differentiated service-level targets by segment",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Policies are only as good as lead-time and inventory-position data quality",
          "Blanket service targets defeat the model — segment-level targets required",
          "Recommendations should phase in, not whipsaw buying on first run",
        ],
        metricsMoved: [
          "inventory_turns",
          "days_of_inventory",
          "excess_obsolete_pct",
          "fill_rate",
        ],
      },
      {
        key: "supplier_risk_monitoring",
        name: "AI supplier-risk & resilience monitoring",
        valueMechanism:
          "Continuously ingest financial, geopolitical, weather, news, and " +
          "performance signals to score supplier and multi-tier risk, map " +
          "single-source concentrations, and alert early — shifting the chain " +
          "from reacting to disruptions to pre-positioning buffers and " +
          "qualifying alternates, which protects on-time delivery and OTIF.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Supplier master with tier mapping and material/site dependencies",
          "External risk feeds (financial, geopolitical, weather, news)",
          "Internal supplier performance history (on-time, quality)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Risk scores are signals for human review, not automatic supplier deselection",
          "Sub-tier data is sparse and self-reported — flag confidence explicitly",
          "False-positive alerts erode trust; tune to materiality and criticality",
        ],
        metricsMoved: [
          "supplier_on_time_rate",
          "otif_rate",
          "stockout_rate",
        ],
      },
      {
        key: "logistics_route_optimization",
        name: "Logistics & transportation optimization",
        valueMechanism:
          "Optimize load building, carrier/mode selection, routing, and " +
          "consolidation against cost, service, and capacity constraints — and " +
          "reduce reactive premium/expedite freight — lowering logistics cost as " +
          "a share of revenue while holding or improving on-time delivery.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Order, shipment, and lane data with rates and transit times from the TMS",
          "Carrier capacity, contracts, and accessorial rules",
          "Network/node geography and service commitments",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Cost-optimal plans can quietly degrade service if constraints are mis-set",
          "Spot-vs-contract and capacity assumptions must reflect live market conditions",
          "Sustainability/emissions constraints increasingly part of the objective",
        ],
        metricsMoved: [
          "logistics_cost_pct_revenue",
          "perfect_order_rate",
          "otif_rate",
        ],
      },
      {
        key: "agentic_sop_scenario_planning",
        name: "Agentic S&OP scenario & exception planning",
        valueMechanism:
          "Run S&OP/IBP on a connected planning system where AI assembles one " +
          "reconciled plan of record, generates and compares supply/demand/" +
          "financial scenarios on demand, and agentically surfaces and proposes " +
          "resolutions for exceptions between cycles — compressing the planning " +
          "loop, killing spreadsheet reconciliation, and letting decisions track " +
          "the market instead of the monthly meeting.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A single connected demand/supply/finance plan of record",
          "Constraint, capacity, and cost data to evaluate scenarios",
          "Exception thresholds and decision policies to act within",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Plan-changing decisions and trade-offs require human approval, not auto-commit",
          "Scenario outputs inherit the data-quality limits of the underlying plan",
          "Agentic exception actions must be auditable and bounded by policy",
        ],
        metricsMoved: [
          "forecast_bias",
          "days_of_inventory",
          "perfect_order_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_planning_platform",
        name: "Unified planning platform (concurrent / connected planning)",
        description:
          "A single APS/IBP planning platform on which demand, supply, " +
          "inventory, and S&OP plan concurrently against one data model and one " +
          "plan of record — replacing disconnected spreadsheets and serial " +
          "hand-offs so scenarios and re-planning are fast and consistent.",
        boundary:
          "Owns the integrated plan of record and planning workflow; does not " +
          "own transactional execution (the ERP/WMS/TMS run the orders, " +
          "warehouses, and shipments it plans).",
        humanAccountabilityPoint: "VP Supply Chain / Head of Integrated Planning",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "control_tower_visibility",
        name: "Supply-chain control tower (end-to-end visibility)",
        description:
          "A real-time visibility and exception-management layer that ingests " +
          "inventory, order, in-transit, and supplier signals across the network " +
          "and tiers, detects deviations, and orchestrates response — the sensing " +
          "and resilience backbone for supplier-risk and disruption management.",
        boundary:
          "Owns cross-network visibility, alerting, and orchestration of " +
          "response; does not own the source systems of record or the planning " +
          "optimization (it consumes and coordinates them).",
        humanAccountabilityPoint: "Supply Chain Control Tower Lead / S&OP Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "data_quality_foundation",
        name: "Master-data & demand-history quality foundation",
        description:
          "A governed foundation that cleans and maintains item/supplier/" +
          "location master data, harmonizes lead times, and curates demand " +
          "history — the binding-constraint platform every supply-chain AI bet " +
          "depends on, without which forecast accuracy and inventory policy " +
          "collapse regardless of algorithm.",
        boundary:
          "Owns data quality, harmonization, and stewardship for planning " +
          "inputs; does not own the analytical models or the planning decisions " +
          "(it makes them trustworthy).",
        humanAccountabilityPoint: "Supply Chain Data / Master-Data Governance Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "segmented_inventory_policy",
        name: "Segmented service-level & inventory-policy model",
        description:
          "A policy framework that segments items by demand, margin, and " +
          "criticality and sets differentiated service-level and safety-stock " +
          "targets per segment x node — so MEIO optimizes against the right " +
          "targets and working capital is released where the customer does not " +
          "feel it.",
        boundary:
          "Owns the segmentation logic and service-target policy; does not own " +
          "the day-to-day buy execution or the optimization engine (it sets the " +
          "objectives they run against).",
        humanAccountabilityPoint: "Inventory Planning Manager / VP Supply Chain",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Supply-chain value is realized on three linked levers, and the order " +
        "of durability matters. (1) WORKING-CAPITAL RELEASE — better forecasts " +
        "and multi-echelon inventory optimization let the firm hold less " +
        "inventory for the same or better service (higher turns, lower days of " +
        "inventory, lower E&O), freeing cash off the balance sheet. (2) " +
        "SERVICE-LEVEL PROTECTION — positioning inventory and sensing demand and " +
        "supplier risk hold or lift OTIF, fill rate, and perfect-order rate, " +
        "protecting revenue and avoiding OTIF chargebacks. (3) LOGISTICS COST " +
        "reduction — route/load/mode optimization and fewer expedite scrambles " +
        "lower logistics cost as a share of revenue. THE HONEST CONSTRAINT: all " +
        "three run on master data, demand history, lead times, and live " +
        "inventory positions — DATA QUALITY GATES EVERYTHING, and dirty or " +
        "fragmented data caps realizable value regardless of algorithm. And the " +
        "most-quoted lever, forecast-accuracy lift, is the most fragile: it is " +
        "largest in stable demand and ERODES in volatility (promotions, new " +
        "products, shocks), so it must be sized as a planning range and " +
        "re-baselined, never asserted as a steady-state gain. The durable, " +
        "defensible value sits in working-capital release and service-level " +
        "protection, which survive forecast error far better than a single MAPE " +
        "number.",
      dominantHaircutFactors: [
        {
          factor: "Data quality & master-data readiness (the binding constraint)",
          rationale:
            "Forecasting, MEIO, and supplier-risk models all depend on clean " +
            "item/supplier/location master data, deep demand history, and " +
            "accurate lead times and inventory positions. Fragmented ERPs, dirty " +
            "masters, and latency-bound positions cap realizable accuracy and " +
            "policy quality no matter how good the algorithm — this is the single " +
            "largest and most common haircut.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between model potential and realized benefit where " +
              "master data, demand history, or lead-time data were unfit",
            label: "planning-range",
          },
        },
        {
          factor: "Demand volatility & forecast-accuracy erosion",
          rationale:
            "Accuracy gains earned in stable periods erode in volatile demand — " +
            "promotions, new-product introductions, disruptions, and demand " +
            "shocks. Value sized on stable-period accuracy over-states the " +
            "steady-state benefit; the more volatile the category, the deeper the " +
            "haircut and the more value must shift to inventory positioning.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Erosion of forecast-accuracy lift between stable and volatile " +
              "demand regimes across promotional / NPI / disruption-exposed items",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption, planner trust & process change",
          rationale:
            "Value requires planners to trust and act on model output, retire " +
            "spreadsheet workarounds, and stop quietly overriding the plan. Low " +
            "trust, gaming, and un-changed S&OP process leave benefit on the " +
            "table even when the model is good.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Planning-transformation change-management experience where " +
              "planner adoption and process redesign lagged the technology",
            label: "planning-range",
          },
        },
        {
          factor: "Network & execution constraints",
          rationale:
            "Optimal plans collide with real capacity, supplier reliability, " +
            "lead-time rigidity, and minimum-order/lot constraints; the " +
            "executable plan captures less than the unconstrained optimum, " +
            "especially upstream where supplier on-time delivery is weak.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Gap between unconstrained optimization output and the " +
              "executable plan under real capacity and supplier constraints",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Inventory / working-capital reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported inventory reductions from MEIO + improved forecasting " +
              "at held-or-better service levels; segment- and data-quality-" +
              "dependent",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in average inventory value / days of inventory " +
            "at constant or improved service level",
        },
        {
          lever: "Service-level (OTIF / fill-rate) improvement",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Percentage-point OTIF / fill-rate improvement from demand sensing " +
              "and inventory positioning, expressed as a fraction; larger from a " +
              "low base, asymptotic near best-in-class",
            label: "planning-range",
          },
          measuredAs:
            "Percentage-point lift in OTIF / fill rate (as a fraction) toward " +
            "the segment service target",
        },
        {
          lever: "Logistics cost reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported logistics-cost reduction from transportation " +
              "optimization and reduced premium/expedite freight",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in logistics cost as a share of revenue, with " +
            "the expedite-freight component isolated",
        },
      ],
      timeToValueBand:
        "Demand-forecasting accuracy/bias improvement: 2-3 quarters once data " +
        "is fit (longer if master-data remediation is needed first). Inventory " +
        "optimization working-capital release: 2-4 quarters as policies phase " +
        "in. Logistics optimization savings: 1-3 quarters. Full connected-" +
        "planning / control-tower transformation across the network: 18-36 " +
        "months, gated by the data-quality foundation.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ERP (supply-chain core)",
          role:
            "System of record for inventory positions, purchase and sales " +
            "orders, goods receipts, and the cost/financial view of the supply " +
            "chain.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion SCM",
            "Microsoft Dynamics 365 Supply Chain",
            "Infor",
          ],
        },
        {
          name: "APS / advanced planning & IBP suite",
          role:
            "Demand planning/forecasting, supply planning, multi-echelon " +
            "inventory optimization, and S&OP/IBP — the analytical plan of record.",
          examples: ["Kinaxis", "o9 Solutions", "Blue Yonder", "SAP IBP"],
        },
        {
          name: "WMS (warehouse management)",
          role:
            "System of record for warehouse inventory, receiving, putaway, " +
            "picking, and outbound fulfillment execution.",
          examples: [
            "Manhattan Associates",
            "Blue Yonder WMS",
            "SAP EWM",
            "Oracle WMS",
          ],
        },
        {
          name: "TMS (transportation management)",
          role:
            "Carrier/mode selection, load building, routing, freight execution, " +
            "and freight audit-and-pay for logistics.",
          examples: [
            "Oracle Transportation Management",
            "Blue Yonder TMS",
            "MercuryGate",
            "project44 (visibility)",
          ],
        },
        {
          name: "Supplier / supply-chain visibility & risk platform",
          role:
            "Multi-tier supplier mapping, performance, and external-risk " +
            "monitoring feeding resilience and supplier-risk management.",
          examples: ["Interos", "Everstream Analytics", "Resilinc", "FourKites"],
        },
      ],
      roles: [
        {
          title: "Chief Supply Chain Officer (CSCO)",
          accountability:
            "End-to-end supply-chain cost, service, working capital, and " +
            "resilience — the executive owner of the transformation outcome.",
        },
        {
          title: "VP Supply Chain / Head of Integrated Planning",
          accountability:
            "The integrated plan of record, S&OP/IBP cadence, and the balance " +
            "of inventory, service, and cost across the network.",
        },
        {
          title: "Demand Planning Lead",
          accountability:
            "Forecast accuracy and bias, the demand plan, and the consensus " +
            "demand signal feeding supply and inventory planning.",
        },
        {
          title: "Inventory Planning Manager",
          accountability:
            "Safety-stock and reorder policy, service-level targets by segment, " +
            "and the working-capital-versus-service trade-off.",
        },
        {
          title: "Procurement / Supplier Management Lead",
          accountability:
            "Supplier on-time delivery, supplier risk and resilience, and " +
            "inbound reliability that bounds downstream service.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Trade compliance & customs (HTS, country-of-origin, duties)",
          relevance:
            "Cross-border supply chains must classify goods, document " +
            "country-of-origin, and clear customs; AI sourcing/logistics " +
            "decisions inherit tariff, duty, and trade-restriction obligations.",
        },
        {
          name: "Product safety, traceability & recall (e.g. FSMA, UDI, serialization)",
          relevance:
            "Food, pharma, and medical-device supply chains require lot/serial " +
            "traceability and recall capability; inventory and logistics systems " +
            "must preserve chain-of-custody and expiry/lot integrity.",
        },
        {
          name: "Supplier compliance & ESG / forced-labor due diligence (e.g. UFLPA, CSDDD)",
          relevance:
            "Multi-tier sourcing must screen suppliers for sanctions, " +
            "forced-labor, and ESG obligations; supplier-risk monitoring inherits " +
            "supply-chain due-diligence duties.",
        },
        {
          name: "Hazmat & dangerous-goods transport regulation",
          relevance:
            "Logistics optimization for regulated goods is constrained by " +
            "hazmat handling, routing, and documentation rules that bound carrier " +
            "and mode choices.",
        },
      ],
      canonicalTerms: [
        {
          term: "OTIF (on-time in-full)",
          definition:
            "Delivery both on the committed date and in full quantity — the " +
            "core fulfillment-reliability measure, often with retailer " +
            "chargebacks attached.",
        },
        {
          term: "MAPE (mean absolute percentage error)",
          definition:
            "The standard forecast-accuracy error metric at the planning grain; " +
            "grain- and volatility-dependent and read alongside bias.",
        },
        {
          term: "S&OP / IBP",
          definition:
            "Sales & operations planning / integrated business planning — the " +
            "cadence that reconciles demand, supply, and finance into one plan of " +
            "record.",
        },
        {
          term: "Bullwhip effect",
          definition:
            "Amplification of demand variability up the supply chain as each " +
            "tier reacts to orders rather than true end demand.",
        },
        {
          term: "Safety stock",
          definition:
            "Buffer inventory held to protect a target service level against " +
            "demand and lead-time variability; the lever MEIO sets per item/node.",
        },
        {
          term: "MEIO (multi-echelon inventory optimization)",
          definition:
            "Optimizing inventory policy across all network echelons " +
            "simultaneously, accounting for pooling and lead-time variability, " +
            "rather than node by node.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Forecast accuracy and bias",
        authoritativeSource:
          "APS / demand-planning system: forecast snapshots versus actual " +
          "shipments at the planning grain, with signed-error (bias) tracking",
        whatGoodEvidenceLooksLike:
          "MAPE AND signed bias by item segment over a trailing window at a " +
          "stated grain, with the share of statistical/ML base versus manual " +
          "override, and stable-vs-volatile periods distinguished.",
        weakEvidenceToReject:
          "A single blended company-wide 'forecast accuracy of X%' with no grain, " +
          "no bias, no segment split — or a vendor's stable-period accuracy " +
          "quoted as a steady-state result.",
      },
      {
        claim: "Inventory health (turns, days, excess/obsolete, imbalance)",
        authoritativeSource:
          "ERP/finance inventory sub-ledger and aging: COGS, average inventory " +
          "at cost, and demand-coverage by item/node",
        whatGoodEvidenceLooksLike:
          "Turns and days of inventory by segment/node WITH excess/obsolete % " +
          "and stockout rate shown together, so imbalance (excess and stockouts " +
          "coexisting) is visible rather than a single net level.",
        weakEvidenceToReject:
          "A single aggregate inventory turns or 'inventory is high/low' " +
          "assertion with no segment/node detail and no excess-vs-stockout split.",
      },
      {
        claim: "Service level (OTIF, fill rate, perfect order)",
        authoritativeSource:
          "Order-to-delivery records across ERP/WMS/TMS matched to committed " +
          "dates and quantities; retailer OTIF scorecards where applicable",
        whatGoodEvidenceLooksLike:
          "OTIF and fill rate by customer/segment with the failure-reason " +
          "breakdown (late vs short) and any chargeback exposure quantified.",
        weakEvidenceToReject:
          "A headline 'service is ~95%' with no measurement basis, no segment " +
          "view, and no on-time-versus-in-full decomposition.",
      },
      {
        claim: "Logistics cost and expedite/premium freight",
        authoritativeSource:
          "TMS / freight-audit-and-pay data and the GL: total logistics spend " +
          "over revenue with premium/expedite isolated",
        whatGoodEvidenceLooksLike:
          "Logistics cost as a share of revenue with the premium/expedite " +
          "component separated and correlated to forecast misses and late " +
          "supplier deliveries.",
        weakEvidenceToReject:
          "A blanket logistics-cost percentage with no breakout of " +
          "premium/expedite freight or its planning-failure drivers.",
      },
      {
        claim: "Supplier reliability and multi-tier risk",
        authoritativeSource:
          "ERP procurement (PO promised vs goods-receipt dates) plus mapped " +
          "tier-2/tier-3 dependencies and external risk feeds",
        whatGoodEvidenceLooksLike:
          "Supplier on-time rate by supplier/material with single-source " +
          "concentrations and sub-tier dependencies mapped and risk-scored, " +
          "confidence flagged where data is self-reported.",
        weakEvidenceToReject:
          "An overall 'suppliers are reliable' claim, or a tier-1-only view that " +
          "treats sub-tier risk as unknown-but-fine.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your forecast accuracy (MAPE) AND bias by item segment and at what grain — and how much of the demand plan is statistical/ML base versus manual override?",
      "Are you seeing stockouts and excess at the same time, and is safety stock set per item/node by service segment or by a single blanket rule?",
      "How fit is the underlying data — item/supplier/location master data, demand history depth, lead-time accuracy, and live inventory positions — since that gates every model?",
      "Is your S&OP/IBP run on one connected planning system with an agreed plan of record, or reconciled monthly in spreadsheets across demand, supply, and finance?",
      "Do you have monitored visibility beyond tier-1 — sub-tier dependencies, single-source concentrations, supplier financial/geopolitical risk — or do disruptions surprise you?",
      "What share of your freight is premium/expedite, and how much of it traces to forecast misses and late supplier deliveries rather than genuine emergencies?",
      "What are your inventory turns, days of inventory, OTIF, and fill rate by segment versus planning ranges — and how do they hold up in volatile/promotional periods?",
    ],
    maturitySignals: [
      "Forecast accuracy AND bias are measured by segment at a defined grain, distinguishing stable from volatile demand, with override tracking.",
      "Inventory policy is segmented per item/node with differentiated service targets, so stockouts and excess are attacked together rather than a blanket level cut.",
      "A master-data and demand-history quality foundation is governed and maintained as the acknowledged binding constraint before model investment.",
      "S&OP/IBP runs on one connected platform with an agreed plan of record and on-demand scenarios, not spreadsheet reconciliation.",
      "Supplier risk is monitored continuously beyond tier-1, and resilience buffers are pre-positioned rather than scrambled reactively.",
    ],
    redFlags: [
      "Forecast accuracy is quoted as a single blended company number with no bias, no grain, and no stable-vs-volatile distinction — accuracy is being over-trusted.",
      "Master data, demand history, and lead times are dirty or fragmented, yet model investment is sized as if data quality were not the binding constraint.",
      "Stockouts and excess/obsolete are both high, but the response is a blanket inventory cut rather than repositioning by segment/node.",
      "Visibility stops at tier-1 and supplier risk is reviewed annually, so disruptions are met with expedite scrambles rather than pre-positioned resilience.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "APS / planning suites (Kinaxis, o9, Blue Yonder, SAP IBP)",
        category: "Demand/supply planning, MEIO, and S&OP/IBP",
        switchingCost:
          "High — the planning suite holds the configured data model, planning logic, and trained models; replacement is a multi-quarter re-implementation, not a swap.",
        renewalDynamics:
          "Subscription by user/scope/volume; AI/sensing and agentic-planning capabilities increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Supply-chain visibility & control-tower platforms (project44, FourKites)",
        category: "Real-time visibility, in-transit tracking, exception orchestration",
        switchingCost:
          "Moderate — value depends on carrier/network integrations that take time to re-establish, but data is portable; lock-in is the integration estate.",
        renewalDynamics:
          "Subscription by shipment/lane volume; network breadth and carrier coverage are the negotiation levers.",
      },
      {
        vendorName: "Supplier-risk & resilience platforms (Interos, Everstream, Resilinc)",
        category: "Multi-tier supplier mapping, risk scoring, disruption alerting",
        switchingCost:
          "Moderate — supplier maps and risk history accrete, but feeds are external and re-mappable; switching cost rises with depth of sub-tier mapping built.",
        renewalDynamics:
          "Subscription by supplier/site count; depth of tier-2/3 coverage and feed breadth drive price and stickiness.",
      },
      {
        vendorName: "Logistics / transportation (TMS — Oracle OTM, Blue Yonder, MercuryGate)",
        category: "Transportation management, optimization, freight audit-and-pay",
        switchingCost:
          "High — carrier contracts, rate structures, and routing logic are embedded; re-onboarding carriers and rebuilding optimization config is the real cost.",
        renewalDynamics:
          "Subscription or per-shipment; leverage realized freight savings and service performance at renewal.",
      },
    ],
    switchingCosts:
      "The ERP and APS/planning cores are effectively non-switchable in " +
      "isolation — the configured data model, planning logic, and trained " +
      "models are the lock-in, and a re-platform is a multi-quarter program. " +
      "Visibility, supplier-risk, and TMS layers are more replaceable, with the " +
      "integration estate (carrier/network connections, supplier maps) the true " +
      "switching cost. The negotiable frontier is in the AI/sensing add-ons " +
      "around the cores and in the visibility/risk/logistics layers.",
    negotiationLevers: [
      "Outcome/value pricing on AI planning add-ons tied to measured forecast-accuracy, bias, or inventory-reduction lift rather than seats",
      "Phase-gated pilot-to-scale with data-readiness and parity proof per planning domain before enterprise commitment",
      "Model-portability, explainability, and data-export rights to prevent planning-model and supplier-map lock-in",
      "Bundle ERP-native planning against best-of-breed APS at renewal to discipline pricing",
      "Re-price visibility/risk platforms on realized coverage (lanes, suppliers, sub-tiers mapped) rather than promised scope",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      forecast_claim: [
        "MAPE AND signed bias at a stated planning grain",
        "segment split and statistical/ML-vs-override share",
        "stable-versus-volatile period distinction",
      ],
      inventory_claim: [
        "turns / days of inventory by segment or node",
        "excess/obsolete % and stockout rate shown together (imbalance)",
        "service-level target the level is set against",
      ],
      service_level_claim: [
        "OTIF / fill rate by customer or segment",
        "on-time-versus-in-full (or late-versus-short) decomposition",
        "measurement basis and any chargeback exposure",
      ],
      logistics_claim: [
        "logistics cost as a share of revenue from TMS/GL",
        "premium/expedite freight component isolated",
        "linkage to forecast misses / late supplier deliveries",
      ],
      supplier_risk_claim: [
        "supplier on-time rate by supplier/material",
        "tier-2/tier-3 mapping and single-source concentration",
        "data confidence flag where self-reported",
      ],
      value_projection: [
        "the data-quality / readiness state as the gating assumption",
        "benchmark planning-range with volatility sensitivity",
        "explicit haircut factors (data quality, volatility, adoption)",
      ],
    },
    citationStandard:
      "Quantitative supply-chain claims cite the system of record (ERP/APS/WMS/" +
      "TMS), the planning grain or segment, and the period. Forecast claims " +
      "carry BOTH accuracy (MAPE) and bias and distinguish stable from volatile " +
      "demand. Inventory claims show excess and stockouts together so imbalance " +
      "is visible. Value projections state the data-quality readiness as the " +
      "gating assumption, give a labelled planning range with volatility " +
      "sensitivity, and name the haircut factors applied — never a single " +
      "asserted accuracy lift or savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant data quality, demand-history depth, or lead-time accuracy is unknown or weak — frame forecast/inventory gains as a planning range explicitly gated on data readiness.",
      "A forecast-accuracy lift is quoted from a stable period — flag that it erodes in volatile demand (promotions, NPI, disruption) and re-baseline.",
      "Inventory is described as simply 'too high' or 'too low' without the excess-versus-stockout split — surface the imbalance before recommending a blanket move.",
      "Vendor-reported accuracy, savings, or service outcomes are cited — mark as provider claims pending validation on the tenant's own data.",
    ],
    inferenceLanguage: [
      "Across supply chains at this scale, forecast MAPE at this grain typically runs... but it erodes in volatile demand...",
      "Without your data-quality and demand-history detail, the industry pattern suggests inventory reduction of roughly... contingent on fit data...",
      "Peer organizations commonly hold OTIF / fill rate in the range of... once inventory is positioned by segment...",
      "Treating this as a planning range gated on data readiness rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific forecast-accuracy lift or inventory-reduction number for this tenant",
      "This tenant's actual MAPE, bias, OTIF, fill rate, or inventory turns",
      "A steady-state accuracy gain quoted without distinguishing stable from volatile demand",
      "A claim that data quality is sufficient for a given model without inspecting master data, demand history, and lead times",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "inventory imbalance / where do excess and stockouts coexist by segment or node",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of excess/obsolete % against stockout rate by segment x node to expose mispositioning, not a single net level.",
    },
    {
      questionPattern:
        "working-capital / inventory-reduction value story at held service level",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current inventory to forecast-improvement and MEIO contributions to target, with data-quality and volatility haircuts shown.",
    },
    {
      questionPattern:
        "forecast accuracy and bias trend / does the lift hold in volatile periods",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend MAPE and signed bias against the planning range, annotating promotional/disruption periods to show erosion honestly.",
    },
    {
      questionPattern:
        "logistics cost stack / where premium and expedite freight concentrate",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack logistics cost by mode/lane with premium/expedite isolated to show the avoidable, planning-driven component.",
    },
    {
      questionPattern: "value sensitivity to data quality and demand volatility",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (data quality, volatility, adoption, execution constraints).",
    },
    {
      questionPattern: "supply-chain KPI scorecard",
      exhibitKind: "table",
      note: "Forecast MAPE/bias, inventory turns, days of inventory, stockout, E&O, OTIF, fill rate, perfect order, logistics cost %, supplier on-time versus planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A master-data and demand-history quality foundation is fixed first — the binding constraint is treated as a prerequisite, not an afterthought",
      "Value is anchored on durable working-capital release and service-level protection rather than a fragile forecast-accuracy lift",
      "Inventory is repositioned by segment/node (attacking excess and stockouts together) rather than cut with a blanket target",
      "S&OP/IBP runs on one connected plan of record and planners trust and act on model output instead of overriding it",
    ],
    failureDrivers: [
      "Building forecasting/optimization on dirty, fragmented data — accuracy and policy quality collapse regardless of algorithm",
      "Sizing the case on stable-period forecast accuracy that then erodes in volatile demand, leaving committed value unrealized",
      "Responding to coexisting excess and stockouts with a blanket inventory cut, deepening service failures",
      "Planner distrust and plan gaming (sandbagging, silent overrides) that leave model value on the table",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Logistics and inventory optimization adopt first because the value is " +
      "measurable and the cash release is tangible. ML demand forecasting " +
      "follows but stalls if data quality is unfit or planners do not trust the " +
      "model. Supplier-risk monitoring and agentic S&OP scenario planning are " +
      "emerging and adopt last, once a connected planning platform and visibility " +
      "backbone exist. Scale is unlocked by the data-quality foundation, not by " +
      "algorithm sophistication.",
    roiClarity: "medium",
    roiClarityBasis:
      "Working-capital release and logistics savings are reasonably firm and " +
      "measurable in the ERP/finance and TMS records. Forecast-accuracy-driven " +
      "value is the soft spot: it is grain- and volatility-dependent, erodes in " +
      "disruption, and is hard to attribute cleanly against a moving demand " +
      "baseline — which is why the value model leans on durable inventory and " +
      "service levers and the evidence/hedge rules force a data-readiness " +
      "gate and a volatility-sensitive planning range rather than a single lift.",
  },

  regulatoryFrame: {
    name: "Trade/customs, product safety & supplier ESG due diligence",
    relevance:
      "The dominant regulatory frame for supply-chain transformation: " +
      "cross-border flows carry customs/trade-compliance and tariff obligations; " +
      "food/pharma/device chains require lot/serial traceability and recall " +
      "capability; and multi-tier sourcing carries sanctions, forced-labor, and " +
      "ESG due-diligence duties that supplier-risk monitoring inherits. " +
      "AI-driven sourcing and logistics decisions must respect these constraints " +
      "(see vocabulary.regulatoryFrames for hazmat transport and the specific " +
      "frames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 wave2)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
