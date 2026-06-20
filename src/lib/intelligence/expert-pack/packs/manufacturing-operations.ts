// Consilium expert — Manufacturing: Operations & Smart Factory (cross-cutting).
//
// W3 industry-wave ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// A cross-cutting, cross-industry expert spanning the plant-floor operating
// system of a goods-producing enterprise — covering BOTH discrete (automotive,
// industrial, electronics, A&D) and process (chemicals, food & beverage, pulp,
// metals) manufacturing. Scope: production throughput & OEE, quality
// (scrap/rework/yield), predictive maintenance & reliability, plant scheduling
// & sequencing, Industry 4.0 / IIoT instrumentation, EHS safety, energy &
// sustainability, and supply continuity on the floor. Product-aware across
// MES / SCADA / historian / CMMS / QMS / ERP, not product-locked.
//
// CORE DOCTRINE — three honest bounding truths are baked into the content:
// (1) THE ECONOMICS ARE OEE + QUALITY. The dominant, defensible value lever on
//     a plant floor is availability/performance/quality loss (OEE) and the cost
//     of poor quality (scrap, rework, warranty) — not headcount reduction.
//     Sizing value on labor compression instead of OEE/quality is the most
//     common way these programs are mis-scoped and over-promised.
// (2) OT/IT DATA INTEGRATION GATES AI. Machine data lives in PLCs, SCADA,
//     historians, and MES in fragmented, mis-time-aligned, uneven-quality form.
//     Until that substrate is connected and contextualized, model accuracy
//     collapses regardless of algorithm — this is the single largest haircut.
// (3) SAFETY IS A HARD CONSTRAINT, NOT A TRADE-OFF. Floor automation touches
//     machinery, energy, and people; EHS, machine-safety standards, and human
//     control authority cap how autonomously AI can act. Value that requires
//     crossing that line is not realizable and must not be promised.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const manufacturingOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.manufacturing-operations",
    expertName: "Manufacturing Operations & Smart Factory Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "manufacturing-operations",
    scopeNote:
      "Cross-cutting, cross-industry plant-floor operating system for goods " +
      "producers across BOTH discrete (automotive, industrial, electronics, " +
      "A&D) and process (chemicals, food & beverage, metals, pulp) " +
      "manufacturing: production throughput & OEE, quality (scrap/rework/first-" +
      "pass yield), predictive maintenance & asset reliability, plant " +
      "scheduling & sequencing, Industry 4.0 / IIoT instrumentation, EHS " +
      "safety, energy & sustainability per unit, and on-floor supply " +
      "continuity. Anchored to MES / SCADA / historian / CMMS / QMS / ERP, " +
      "product-aware not product-locked. CORE DOCTRINE: the economics are OEE " +
      "and cost of poor quality (not headcount); OT/IT data integration is the " +
      "binding constraint on AI; and safety is a hard constraint, not a " +
      "trade-off. Excludes enterprise demand planning & logistics (supply-chain " +
      "expert), strategic category sourcing (procurement expert), and product " +
      "R&D/design — this expert owns make-to-quality throughput on the floor.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "oee",
        name: "OEE (Overall Equipment Effectiveness)",
        definition:
          "Availability x Performance x Quality for a line/asset — the share of " +
          "fully productive time relative to all planned production time. The " +
          "single most important composite measure of plant-floor productivity.",
        unit: "% (0-100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 45,
          high: 85,
          basis:
            "Discrete/process plants commonly run 45-65%; 85% is the classic " +
            "'world-class' target and is rarely sustained line-wide",
          label: "planning-range",
        },
        dataSource:
          "MES / production-monitoring system: runtime, downtime, cycle counts, " +
          "and quality dispositions per line",
        whyItMatters:
          "OEE decomposes every productivity loss into availability, performance, " +
          "and quality — it is where the dominant economics of the floor live and " +
          "the primary metric most AI bets are funded to move.",
      },
      {
        key: "first_pass_yield",
        name: "First-pass yield (FPY)",
        definition:
          "Share of units that pass all quality checks the first time with no " +
          "rework or scrap. For multi-step lines, the rolled throughput yield " +
          "(product of step yields) is the honest measure.",
        unit: "% units",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 99,
          basis:
            "Highly process- and complexity-dependent; multi-step rolled yield " +
            "drops fast as step count rises",
          label: "planning-range",
        },
        dataSource: "QMS / MES quality dispositions and inspection results per step",
        whyItMatters:
          "FPY is the cleanest read on quality loss; every point of lost yield is " +
          "scrap, rework, or escape cost, and it directly feeds the Quality term of OEE.",
      },
      {
        key: "scrap_rework_rate",
        name: "Scrap & rework rate",
        definition:
          "Share of produced units (or material mass, for process plants) scrapped " +
          "or sent to rework, expressed against total production. Often split into " +
          "scrap (unrecoverable) and rework (recoverable at added cost).",
        unit: "% of production",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 8,
          basis:
            "Wide by industry — precision discrete low single digits; some process " +
            "and high-mix lines materially higher",
          label: "planning-range",
        },
        dataSource: "MES/QMS scrap and rework transactions; ERP cost of poor quality",
        whyItMatters:
          "Scrap and rework are the most direct cash drain of poor quality and, with " +
          "OEE, dominate the floor's controllable economics far more than direct labor.",
      },
      {
        key: "unplanned_downtime",
        name: "Unplanned downtime",
        definition:
          "Share of planned production time lost to unscheduled stops — equipment " +
          "failures, jams, and faults — excluding planned changeovers and maintenance.",
        unit: "% of planned time",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 20,
          basis:
            "Asset- and maintenance-maturity dependent; reactive plants sit high, " +
            "well-instrumented predictive plants low",
          label: "planning-range",
        },
        dataSource: "MES/SCADA downtime events with reason codes; CMMS work orders",
        whyItMatters:
          "Unplanned downtime is the largest availability loss in OEE and the primary " +
          "target of predictive-maintenance programs.",
      },
      {
        key: "mtbf",
        name: "MTBF (Mean Time Between Failures)",
        definition:
          "Average operating time between unplanned failures for a critical asset " +
          "or asset class — a core reliability measure (paired with MTTR).",
        unit: "hours",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 200,
          high: 2000,
          basis:
            "Strongly asset-class and duty-cycle dependent; internal reliability " +
            "benchmarking is the only honest comparator",
          label: "planning-range",
        },
        dataSource: "CMMS failure history vs runtime (historian/SCADA operating hours)",
        whyItMatters:
          "Reliability (rising MTBF) is what converts reactive firefighting into " +
          "planned work — the leading indicator predictive maintenance is meant to move.",
      },
      {
        key: "otif",
        name: "On-time-in-full (OTIF) from plant",
        definition:
          "Share of production/shipment commitments the plant delivers both on the " +
          "promised date and in the full quantity — the floor's service-level read.",
        unit: "% of orders/lines",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 98,
          basis:
            "Make-to-order vs make-to-stock and changeover complexity drive wide spread",
          label: "planning-range",
        },
        dataSource: "MES/ERP production order completion vs promised date and quantity",
        whyItMatters:
          "OTIF is how the floor's schedule adherence and quality show up to customers; " +
          "it survives forecast noise better than throughput counts alone.",
      },
      {
        key: "schedule_adherence",
        name: "Production schedule adherence",
        definition:
          "Share of scheduled production (by sequence and quantity) actually executed " +
          "as planned within the period — measures how stable the plant's plan is.",
        unit: "% of schedule",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "High-mix/short-run plants sit lower; stable long-run lines higher",
          label: "planning-range",
        },
        dataSource: "MES execution vs APS/MES production schedule",
        whyItMatters:
          "Low adherence signals firefighting and churn that erode OEE and OTIF; it is " +
          "the metric AI scheduling/sequencing is funded to lift.",
      },
      {
        key: "energy_per_unit",
        name: "Energy intensity per unit",
        definition:
          "Energy consumed per unit of output (or per tonne, for process plants), " +
          "covering electricity, gas, steam, and compressed air.",
        unit: "kWh-equiv / unit",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Process-specific; no cross-industry numeric band is meaningful — track " +
            "against the plant's own baseline and best demonstrated run",
          label: "planning-range",
        },
        dataSource: "Energy/utility metering and submetering tied to MES production counts",
        whyItMatters:
          "Energy is a large and rising operating cost and a Scope-1/2 emissions driver; " +
          "per-unit intensity normalizes it against volume so improvement is real, not mix.",
      },
      {
        key: "safety_incident_rate",
        name: "Safety incident rate (TRIR)",
        definition:
          "Recordable workplace injuries/illnesses per 200,000 hours worked (OSHA " +
          "Total Recordable Incident Rate) — the headline EHS performance measure.",
        unit: "incidents per 200k hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 4,
          basis:
            "Industry- and process-hazard dependent; OSHA/BLS sector reference ranges",
          label: "planning-range",
        },
        dataSource: "EHS incident management system; OSHA recordables and hours worked",
        whyItMatters:
          "Safety is a hard constraint and a board-level obligation; it bounds how far " +
          "floor automation can be pushed and is never a metric to trade for throughput.",
      },
      {
        key: "inventory_turns",
        name: "Inventory turns (plant)",
        definition:
          "Cost of goods sold divided by average inventory held at the plant (raw, " +
          "WIP, finished) — how efficiently the floor converts material to shipped product.",
        unit: "turns / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 6,
          high: 30,
          basis:
            "Process (continuous) plants and lean discrete operations turn high; " +
            "high-mix/long-cycle lower",
          label: "planning-range",
        },
        dataSource: "ERP inventory valuation vs COGS at the plant/WIP level",
        whyItMatters:
          "WIP and buffer inventory hide scheduling and reliability problems; turns is " +
          "the working-capital read on how clean the flow really is.",
      },
      {
        key: "cost_per_unit",
        name: "Conversion cost per unit",
        definition:
          "Total controllable conversion cost (labor, energy, maintenance, scrap, " +
          "rework, consumables) per good unit produced — the floor's unit economics.",
        unit: "$ / good unit",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Product-specific; meaningful only against the plant's own baseline and " +
            "standard cost, not a cross-industry band",
          label: "planning-range",
        },
        dataSource: "ERP standard/actual cost build-up tied to MES good-unit counts",
        whyItMatters:
          "Conversion cost per good unit is where OEE, quality, energy, and reliability " +
          "all land in cash terms — the bottom-line summary of floor performance.",
      },
      {
        key: "changeover_time",
        name: "Changeover / setup time",
        definition:
          "Average time a line is down for product/format changeover (SMED-tracked), " +
          "from last good unit of run A to first good unit of run B.",
        unit: "minutes / changeover",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 120,
          basis:
            "SMED maturity and product complexity dependent; high-mix plants carry the " +
            "biggest changeover loss",
          label: "planning-range",
        },
        dataSource: "MES changeover events; SMED study data",
        whyItMatters:
          "Changeover is a major availability and performance loss in high-mix plants; " +
          "shrinking it is what lets AI sequencing turn schedule flexibility into OEE.",
      },
    ],

    painThemes: [
      {
        key: "ot_it_data_fragmentation",
        name: "OT/IT data fragmentation (the binding constraint)",
        description:
          "Machine data sits in PLCs, SCADA, historians, and MES in siloed, " +
          "mis-time-aligned, uneven-quality form, often without asset/material " +
          "context; the integration and contextualization effort — not the model — " +
          "gates almost every AI use case on the floor.",
        detectionSignal:
          "No unified plant data model; engineers hand-export tags and merge in " +
          "spreadsheets; historian tags poorly named/mapped to assets; OEE numbers " +
          "differ between MES and manual logs.",
        diagnosticQuestion:
          "Can you join a machine's sensor stream, downtime reason codes, quality " +
          "results, and the material/order it ran without manual reconciliation?",
      },
      {
        key: "hidden_oee_loss",
        name: "Hidden and mis-attributed OEE loss",
        description:
          "Availability, performance, and quality losses are under-instrumented or " +
          "mis-coded, so micro-stops, speed loss, and quality holds hide inside a " +
          "headline OEE that nobody fully trusts or can decompose.",
        detectionSignal:
          "OEE reported as one number with no availability/performance/quality split; " +
          "large 'unexplained' downtime bucket; manual stop-reason coding; speed loss invisible.",
        diagnosticQuestion:
          "Can you decompose OEE into the six big losses by line and shift, and how " +
          "much of your downtime is coded 'unknown'?",
      },
      {
        key: "cost_of_poor_quality",
        name: "Cost of poor quality (scrap, rework, escapes, warranty)",
        description:
          "Scrap, rework, and quality escapes are detected late — after value has " +
          "been added or product has shipped — making cost of poor quality a dominant, " +
          "under-measured drain that dwarfs direct-labor savings.",
        detectionSignal:
          "Quality caught at final inspection rather than in-process; rising warranty/" +
          "return costs; rework hours buried in standard cost; no defect-to-root-cause loop.",
        diagnosticQuestion:
          "What is your full cost of poor quality (scrap + rework + escapes + warranty), " +
          "and at which step are defects actually detected versus created?",
      },
      {
        key: "reactive_maintenance",
        name: "Reactive / run-to-failure maintenance",
        description:
          "Critical assets are maintained reactively or on fixed time intervals " +
          "because condition telemetry is thin, so failures surface as unplanned " +
          "downtime and emergency repair rather than planned, lower-cost work.",
        detectionSignal:
          "High unplanned-to-planned maintenance ratio; low MTBF on key assets; firefighting " +
          "culture; spare-parts stockouts; little vibration/thermal/current monitoring.",
        diagnosticQuestion:
          "What share of maintenance is unplanned versus planned, and which critical " +
          "assets carry condition monitoring today?",
      },
      {
        key: "scheduling_churn",
        name: "Plant scheduling churn & changeover loss",
        description:
          "Schedules are built in spreadsheets or thin tools and constantly broken by " +
          "material shortages, breakdowns, and rush orders, inflating changeovers and " +
          "destroying schedule adherence and OEE.",
        detectionSignal:
          "Frequent reschedules; expediting/hot lists; low schedule adherence; sequencing " +
          "ignores changeover families; planners firefighting rather than optimizing.",
        diagnosticQuestion:
          "How is the line sequence decided today, how often does it change intra-day, " +
          "and does it account for changeover families and constraints?",
      },
      {
        key: "tribal_knowledge_workforce",
        name: "Tribal knowledge & workforce attrition",
        description:
          "Setup, troubleshooting, and process know-how live with a few senior " +
          "operators and technicians; retirement and turnover erode the expertise " +
          "that holds quality and uptime together, with little captured digitally.",
        detectionSignal:
          "Performance swings by who is on shift; long ramp time for new hires; undocumented " +
          "'golden run' settings; retirement cliff in skilled trades; no work-instruction capture.",
        diagnosticQuestion:
          "When your most experienced operator on a line retires, what knowledge leaves " +
          "with them, and where is it captured?",
      },
      {
        key: "safety_energy_blind_spots",
        name: "Safety and energy blind spots",
        description:
          "EHS near-misses and energy waste are tracked late and in aggregate, so " +
          "leading risk signals and per-unit energy excursions are invisible until an " +
          "incident or a utility bill forces attention.",
        detectionSignal:
          "Safety managed by lagging TRIR only; few near-miss/leading indicators; energy billed " +
          "at the meter with no per-line submetering; no link between production state and energy.",
        diagnosticQuestion:
          "Do you have leading safety indicators and per-line energy submetering tied to " +
          "production state, or only lagging incident and total-bill numbers?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "oee_loss_intelligence",
        name: "OEE loss intelligence & micro-stop analytics",
        valueMechanism:
          "Continuously decompose OEE into the six big losses from MES/SCADA event " +
          "and cycle data, auto-classify stop reasons, and surface micro-stops and " +
          "speed loss that manual logging misses — directing improvement effort at the " +
          "true bottleneck loss instead of the visible one.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "MES/SCADA runtime, downtime, and cycle counts",
          "Downtime reason-code taxonomy",
          "Quality dispositions per line/step",
          "Asset/line master and shift calendar",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-classified stop reasons need operator validation or they corrupt the loss analysis",
          "Garbage-in risk: untrustworthy MES timestamps produce confident-but-wrong OEE splits",
        ],
        metricsMoved: [
          "oee",
          "unplanned_downtime",
          "schedule_adherence",
        ],
      },
      {
        key: "predictive_maintenance",
        name: "Predictive maintenance & asset reliability",
        valueMechanism:
          "Fuse vibration, thermal, current, and process telemetry with failure " +
          "history to predict impending asset failure and trigger planned " +
          "intervention before breakdown — converting unplanned downtime and " +
          "emergency repair into scheduled, lower-cost work and lifting reliability.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Condition telemetry (vibration/thermal/current) from sensors/historian",
          "CMMS failure and work-order history",
          "Asset register and duty cycle / runtime",
          "Process context (load, speed, product running)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Maintenance actions touch energized/moving equipment — technicians own the work and lockout/tagout",
          "False positives erode trust and waste planned downtime; false negatives miss the failure they were bought to catch",
        ],
        metricsMoved: [
          "mtbf",
          "unplanned_downtime",
          "oee",
          "cost_per_unit",
        ],
      },
      {
        key: "vision_quality_inspection",
        name: "AI vision & in-process quality inspection",
        valueMechanism:
          "Use machine vision and sensor analytics to detect defects in-process " +
          "rather than at final inspection, catching scrap and rework earlier and " +
          "feeding root-cause signals back to the process — lifting first-pass yield " +
          "and cutting cost of poor quality and escapes.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Labeled defect imagery / inspection data",
          "In-line cameras / sensors with adequate lighting and fixturing",
          "Process parameters at point of inspection",
          "QMS disposition and root-cause history",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Model false-negatives let defects escape — set thresholds conservatively and keep human audit on borderline calls",
          "Drift as products/lighting/materials change requires monitored retraining",
        ],
        metricsMoved: [
          "first_pass_yield",
          "scrap_rework_rate",
          "oee",
        ],
      },
      {
        key: "ai_production_scheduling",
        name: "AI production scheduling & sequencing",
        valueMechanism:
          "Optimize line sequence and schedule against changeover families, " +
          "constraints, material availability, and due dates — reducing changeover " +
          "loss and reschedule churn so schedule adherence, OTIF, and OEE rise " +
          "without adding capacity.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Production orders, due dates, and priorities (ERP/APS)",
          "Changeover/setup matrix and constraints",
          "Real-time line status and material availability",
          "Capacity, calendars, and labor/skill constraints",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Planners must retain authority — optimization recommends, humans commit, given safety and union rules",
          "Optimizing throughput can strand changeover or maintenance windows if constraints are mis-modeled",
        ],
        metricsMoved: [
          "schedule_adherence",
          "changeover_time",
          "otif",
          "inventory_turns",
        ],
      },
      {
        key: "process_parameter_optimization",
        name: "Process parameter optimization (golden run)",
        valueMechanism:
          "Learn the relationship between process settings and quality/energy/yield " +
          "outcomes from historian data and recommend setpoints that hold the " +
          "'golden run' — stabilizing yield and energy across shifts and operators " +
          "regardless of who is running the line.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Historian process-parameter time series",
          "Quality/yield outcomes tied to runs",
          "Energy/utility submetering by line",
          "Recipe/specification limits and SPC data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Setpoint recommendations must stay inside validated/regulated process limits — process engineer owns the envelope",
          "Correlation-not-causation risk: recommendations need engineering validation before standardization",
        ],
        metricsMoved: [
          "first_pass_yield",
          "energy_per_unit",
          "scrap_rework_rate",
        ],
      },
      {
        key: "ehs_safety_intelligence",
        name: "EHS leading-indicator & safety intelligence",
        valueMechanism:
          "Surface leading safety signals — near-misses, unsafe conditions, PPE/" +
          "zone violations from vision, and energy/process excursions — so EHS acts " +
          "before incidents occur, treating safety as the hard constraint it is " +
          "rather than a lagging TRIR scorecard.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "EHS incident and near-miss records",
          "Vision/sensor signals for zone/PPE/condition (where lawful and consented)",
          "Equipment safety-interlock and alarm data",
          "Energy/process excursion telemetry",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Safety decisions and stoppage authority remain with EHS/operations — AI flags, humans decide",
          "Worker surveillance and privacy constraints bound what monitoring is acceptable and lawful",
        ],
        metricsMoved: [
          "safety_incident_rate",
          "energy_per_unit",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_plant_data_foundation",
        name: "Unified OT/IT plant data foundation (Unified Namespace)",
        description:
          "A governed integration layer (often a Unified Namespace / industrial " +
          "data hub) that connects PLC/SCADA/historian/MES, contextualizes tags to " +
          "assets, materials, and orders, and time-aligns them into a trustworthy, " +
          "queryable plant model — the prerequisite every other use case depends on.",
        boundary:
          "Owns data connectivity, contextualization, and quality; does NOT own " +
          "real-time machine control (stays read-aligned with PLC/SCADA and respects " +
          "the OT security boundary).",
        humanAccountabilityPoint:
          "Plant Digital/MES Lead (with OT-cybersecurity and controls-engineering sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "predictive_reliability_program",
        name: "Condition-based predictive reliability program",
        description:
          "Condition monitoring plus failure prediction feeding a planned, risk-" +
          "based maintenance schedule in the CMMS, so the most critical and most " +
          "failure-prone assets get intervention before breakdown rather than after.",
        boundary:
          "Owns failure prediction and maintenance prioritization; does not execute " +
          "maintenance autonomously or override OEM/safety maintenance standards.",
        humanAccountabilityPoint: "Plant Maintenance & Reliability Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "closed_loop_quality",
        name: "Closed-loop in-process quality system",
        description:
          "In-process vision/sensor inspection wired to SPC and a defect-to-root-" +
          "cause loop in the QMS, catching defects early and feeding correction back " +
          "to the process so yield and cost of poor quality improve continuously.",
        boundary:
          "Owns defect detection and root-cause routing; does not auto-disposition " +
          "regulated product or bypass mandated quality holds and human sign-off.",
        humanAccountabilityPoint: "Plant Quality Manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ai_scheduling_layer",
        name: "Constraint-aware AI scheduling & sequencing layer",
        description:
          "An optimization layer over APS/MES that sequences runs against changeover " +
          "families, constraints, materials, and due dates and re-optimizes as the " +
          "floor changes — lifting adherence and OTIF while protecting changeover and " +
          "maintenance windows.",
        boundary:
          "Owns schedule recommendation and re-optimization; planners retain authority " +
          "to commit, and it does not override safety, labor, or maintenance constraints.",
        humanAccountabilityPoint: "Plant Production Planning Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Plant-floor value is unlocked in a strict order and sized on the right " +
        "lever. The OT/IT plant data foundation must exist before OEE analytics, " +
        "predictive maintenance, vision quality, or scheduling optimization can " +
        "deliver — modeled value without it is largely unrealizable. Once data is " +
        "trustworthy, the durable, defensible economics are OEE recovery " +
        "(availability + performance + quality loss) and reduced cost of poor " +
        "quality (scrap, rework, escapes, warranty), with working-capital release " +
        "(inventory turns) and energy intensity as second-order wins. Labor " +
        "reduction is NOT the headline — sizing value on headcount is the most " +
        "common over-promise. And safety is never a value lever to trade against: " +
        "it caps how far automation can go.",
      dominantHaircutFactors: [
        {
          factor: "OT/IT data readiness & contextualization",
          rationale:
            "Machine data is fragmented, mis-time-aligned, and thinly contextualized; " +
            "until the plant data foundation is real, model accuracy collapses and " +
            "modeled value is largely unrealizable — the single largest haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.55,
            basis:
              "Repeated experience where plant data quality and connectivity capped " +
              "delivered value",
            label: "planning-range",
          },
        },
        {
          factor: "Safety & regulatory limits on floor automation",
          rationale:
            "EHS obligations, machine-safety standards, and validated/regulated " +
            "process limits (e.g. food safety, pharma GMP) cap how autonomously AI can " +
            "act, bounding a share of theoretical automation value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Automation scope limited by safety standards and human-control requirements",
            label: "planning-range",
          },
        },
        {
          factor: "Operator & maintenance adoption",
          rationale:
            "Operators, technicians, and planners must trust and act on " +
            "recommendations; tribal knowledge, training gaps, and skilled-trades " +
            "attrition slow adoption and leave value on the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "Floor change-management and skilled-workforce experience",
            label: "planning-range",
          },
        },
        {
          factor: "Forecast/quality-gain erosion under product & demand mix shift",
          rationale:
            "Yield and scheduling gains earned on stable runs erode under new-product " +
            "introductions, high mix, and demand volatility, so benefits must be " +
            "re-baselined rather than assumed steady-state.",
          typicalHaircut: {
            low: 0.05,
            high: 0.2,
            basis: "Observed erosion of yield/throughput gains under mix and volatility",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "OEE recovery from loss intelligence + reliability + scheduling",
          range: {
            low: 0.03,
            high: 0.15,
            basis:
              "Reported OEE point gains where the data foundation was adequate; expressed " +
              "as absolute OEE percentage points, not relative",
            label: "planning-range",
          },
          measuredAs: "Absolute OEE percentage-point improvement on targeted lines",
        },
        {
          lever: "Cost-of-poor-quality reduction from in-process quality",
          range: {
            low: 0.1,
            high: 0.35,
            basis: "Scrap/rework/escape reductions where in-process detection replaced end-of-line",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in total cost of poor quality (scrap + rework + escapes)",
        },
        {
          lever: "Unplanned-downtime reduction from predictive maintenance",
          range: {
            low: 0.1,
            high: 0.3,
            basis: "Reported unplanned-downtime reductions on assets with adequate condition data",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in unplanned downtime on monitored critical assets",
        },
      ],
      timeToValueBand:
        "OT/IT plant data foundation: 2-4 quarters (the gating investment). OEE loss " +
        "intelligence: 1-2 quarters once data flows. Predictive maintenance and vision " +
        "quality: 2-4 quarters once telemetry/labeled data exist. AI scheduling and " +
        "process-parameter optimization: 3-5 quarters and most sensitive to data maturity " +
        "and adoption.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "MES / MOM (Manufacturing Execution / Operations Management)",
          role:
            "System of record for production execution: order dispatch, runtime/" +
            "downtime, OEE, genealogy, and quality dispositions on the floor.",
          examples: ["Siemens Opcenter", "Rockwell Plex/FactoryTalk", "AVEVA MES", "Tulip"],
        },
        {
          name: "SCADA / PLC / historian",
          role:
            "Real-time machine control signals and time-series telemetry for process " +
            "and condition data (the OT layer).",
          examples: ["AVEVA/OSIsoft PI historian", "Ignition", "Rockwell/Siemens PLC+SCADA"],
        },
        {
          name: "CMMS / EAM (maintenance & asset management)",
          role: "Asset register, maintenance work orders, failure history, and spares.",
          examples: ["IBM Maximo", "SAP PM/EAM", "Fiix", "UpKeep"],
        },
        {
          name: "QMS (Quality Management System)",
          role: "Quality plans, inspections, SPC, nonconformance, CAPA, and dispositions.",
          examples: ["MasterControl", "ETQ", "Sparta/Honeywell", "InfinityQS (SPC)"],
        },
        {
          name: "ERP / APS (planning & cost)",
          role:
            "Production orders, BOM/routing, standard/actual cost, inventory, and the " +
            "advanced planning & scheduling engine.",
          examples: ["SAP S/4HANA", "Oracle", "Kinaxis/Blue Yonder (APS)"],
        },
      ],
      roles: [
        {
          title: "Plant Manager / VP Operations",
          accountability: "End-to-end plant safety, quality, throughput, and conversion cost.",
        },
        {
          title: "Plant Quality Manager",
          accountability: "First-pass yield, cost of poor quality, SPC, and regulatory quality compliance.",
        },
        {
          title: "Maintenance & Reliability Manager",
          accountability: "Asset reliability (MTBF/MTTR), maintenance strategy, and unplanned downtime.",
        },
        {
          title: "Production Planning / Scheduling Manager",
          accountability: "Schedule adherence, sequencing, changeover loss, and OTIF from the plant.",
        },
        {
          title: "EHS Manager",
          accountability: "Safety performance, regulatory EHS compliance, and stop-work authority.",
        },
        {
          title: "Plant Digital / MES / OT Lead",
          accountability: "Plant data foundation, MES/historian integration, and OT cybersecurity boundary.",
        },
      ],
      regulatoryFrames: [
        {
          name: "OSHA / machine-safety standards (e.g. ISO 12100, IEC 61508/62061)",
          relevance:
            "Workplace and machine-functional safety bound how autonomously floor " +
            "equipment and AI-driven actions can operate; safety is a hard constraint.",
        },
        {
          name: "ISA-95 / ISA-99 (IEC 62443)",
          relevance:
            "Define the MES-to-control integration hierarchy and the OT cybersecurity " +
            "zones/conduits that govern how IT systems may touch the plant floor.",
        },
        {
          name: "Quality & product-safety regimes (ISO 9001, IATF 16949, FDA cGMP, FSMA/HACCP)",
          relevance:
            "Industry-specific quality and product-safety rules constrain process " +
            "changes, validation, traceability, and what may be auto-dispositioned.",
        },
        {
          name: "Environmental & energy reporting (EPA, ISO 50001/14001, GHG Scope 1/2)",
          relevance:
            "Energy and emissions obligations make per-unit energy intensity a tracked, " +
            "reportable outcome, not just a cost line.",
        },
      ],
      canonicalTerms: [
        {
          term: "OEE (six big losses)",
          definition:
            "Availability x Performance x Quality; the six big losses are breakdowns, " +
            "setup/changeover, micro-stops, speed loss, startup defects, and production defects.",
        },
        {
          term: "First-pass yield / rolled throughput yield",
          definition:
            "Share of units passing all checks first time; rolled throughput yield is the " +
            "product of step yields across a multi-step process.",
        },
        {
          term: "Cost of poor quality (COPQ)",
          definition:
            "The total cost of scrap, rework, escapes, inspection, and warranty arising from defects.",
        },
        {
          term: "SMED (Single-Minute Exchange of Die)",
          definition:
            "A method for reducing changeover/setup time by converting internal to external setup steps.",
        },
        {
          term: "Unified Namespace (UNS)",
          definition:
            "A single, contextualized, event-driven source of plant data that decouples OT " +
            "sources from IT consumers — a common plant data-foundation pattern.",
        },
        {
          term: "MTBF / MTTR",
          definition:
            "Mean Time Between Failures and Mean Time To Repair — the core reliability and " +
            "maintainability pair for asset performance.",
        },
        {
          term: "SPC (Statistical Process Control)",
          definition:
            "Control-chart-based monitoring of process variation to detect special-cause " +
            "shifts before they become defects.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "OEE and its loss decomposition",
        authoritativeSource: "MES/production-monitoring runtime, downtime, cycle, and quality data",
        whatGoodEvidenceLooksLike:
          "OEE split into availability/performance/quality by line and shift, with stop reasons " +
          "coded and the 'unknown' bucket quantified.",
        weakEvidenceToReject:
          "A single headline OEE percentage with no availability/performance/quality split or stop-reason basis.",
      },
      {
        claim: "Cost of poor quality (scrap, rework, escapes)",
        authoritativeSource: "QMS/MES quality dispositions joined to ERP cost of poor quality",
        whatGoodEvidenceLooksLike:
          "COPQ built up from scrap + rework hours + escape/warranty cost, attributed to defect type and step.",
        weakEvidenceToReject:
          "An anecdotal scrap percentage with no cost build-up, defect attribution, or rework included.",
      },
      {
        claim: "Asset reliability and unplanned downtime",
        authoritativeSource: "CMMS failure/work-order history vs historian/SCADA runtime",
        whatGoodEvidenceLooksLike:
          "MTBF/MTTR and unplanned-to-planned ratio by critical asset, with failure modes and condition data.",
        weakEvidenceToReject:
          "A claim that an asset 'fails a lot' with no runtime denominator, failure history, or downtime coding.",
      },
      {
        claim: "Energy intensity per unit",
        authoritativeSource: "Utility/submetering data tied to MES good-unit counts",
        whatGoodEvidenceLooksLike:
          "Per-line submetered energy normalized by good units over a defined period, separating mix from real change.",
        weakEvidenceToReject:
          "A total plant utility bill divided by total output presented as a per-line efficiency gain.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your OEE by line and shift, and can you decompose it into availability, performance, and quality losses?",
      "Can you join a machine's sensor stream, downtime reasons, quality results, and the order/material it ran without manual reconciliation?",
      "What is your full cost of poor quality (scrap + rework + escapes + warranty), and at which step are defects detected versus created?",
      "What share of maintenance is unplanned versus planned, and which critical assets carry condition monitoring today?",
      "How is the line sequence decided, how often does it change intra-day, and does it account for changeover families and constraints?",
      "When your most experienced operator retires, what setup and troubleshooting knowledge leaves with them, and where is it captured?",
      "Do you have leading safety indicators and per-line energy submetering tied to production state, or only lagging TRIR and total bills?",
    ],
    maturitySignals: [
      "A governed plant data foundation contextualizes PLC/SCADA/historian/MES to assets, materials, and orders without hand-merging.",
      "OEE is trusted and decomposed into the six big losses by line and shift, with a small 'unknown' downtime bucket.",
      "Critical assets carry condition monitoring and maintenance is mostly planned, not reactive.",
      "Quality is caught in-process with a defect-to-root-cause loop, not only at final inspection.",
      "Scheduling respects changeover families and constraints, and schedule adherence is high and stable.",
    ],
    redFlags: [
      "OEE is reported as a single number with no availability/performance/quality split — the headline figure is not trustworthy.",
      "Machine, downtime, quality, and order data cannot be joined without manual reconciliation — no usable plant data foundation.",
      "Quality is caught only at final inspection and cost of poor quality is unmeasured — defects are found after value is added.",
      "Critical assets are run-to-failure or time-based with little condition telemetry, so failures appear as unplanned downtime.",
      "AI is proposed to take autonomous control actions or auto-disposition regulated product without human authority and safety bounds.",
      "Value is sized on headcount reduction rather than OEE and cost of poor quality — the program is mis-scoped.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "MES / MOM platform vendors",
        category: "Manufacturing execution / operations management",
        switchingCost:
          "Extreme — MES is embedded in execution, genealogy, and shop-floor integration; replacement is a multi-year, multi-site program.",
        renewalDynamics:
          "Long enterprise terms tied to digital-manufacturing programs; rarely re-sourced standalone.",
      },
      {
        vendorName: "SCADA / historian / industrial-data-hub vendors",
        category: "OT telemetry / plant data foundation",
        switchingCost:
          "High — historian tags and integrations underpin every analytics use case; migration is itself a major project.",
        renewalDynamics:
          "Foundational and sticky; negotiate on data egress rights, open standards (MQTT/OPC-UA), and seat/tag scaling.",
      },
      {
        vendorName: "Predictive-maintenance & asset-analytics vendors",
        category: "Reliability / condition monitoring analytics",
        switchingCost:
          "Moderate — integrate via historian/CMMS feeds; replaceable with data-mapping effort, watch model lock-in.",
        renewalDynamics:
          "Fast-moving market; favor outcome-based terms, explainability, and data/exit rights.",
      },
      {
        vendorName: "Machine-vision & in-process quality vendors",
        category: "Vision / quality inspection",
        switchingCost:
          "Moderate — hardware (cameras/lighting/fixturing) plus trained models create some lock-in; swappable with re-labeling effort.",
        renewalDynamics:
          "Mix of hardware and software/licensing; negotiate model ownership, retraining support, and hardware-independence.",
      },
    ],
    switchingCosts:
      "The execution core (MES) and the OT historian/data foundation are effectively " +
      "non-switchable in isolation; the negotiable value frontier is the analytics, " +
      "vision, and reliability layer around them, where switching cost is moderate — " +
      "so contract for data portability and open standards at the foundation to keep " +
      "that frontier competitive.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured OEE points or cost-of-poor-quality reduction",
      "Open standards (OPC-UA / MQTT / ISA-95) and data egress rights to avoid OT lock-in",
      "Model ownership, retraining support, and explainability as contractual requirements (quality/safety exposure)",
      "Pilot-to-scale gating with parity proof on the plant's own lines and data before multi-site rollout",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      oee_metric: [
        "MES runtime/downtime/cycle data",
        "availability/performance/quality split",
        "stop-reason coding with quantified 'unknown'",
      ],
      quality_cost_claim: [
        "QMS/MES dispositions",
        "ERP cost of poor quality build-up",
        "defect attribution by type and step",
      ],
      reliability_claim: [
        "CMMS failure/work-order history",
        "historian/SCADA runtime denominator",
        "MTBF/MTTR by critical asset",
      ],
      energy_claim: [
        "per-line submetering",
        "MES good-unit normalization",
        "defined period and mix isolation",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. OT/IT data readiness and safety limits)",
      ],
    },
    citationStandard:
      "Quantitative plant claims cite the MES/historian/CMMS/QMS/ERP source and the " +
      "period, state the line/asset granularity, and (for OEE) the availability/" +
      "performance/quality decomposition. Value projections cite a baseline plus a " +
      "labelled planning range and the haircut factors applied — never a single " +
      "asserted ROI or steady-state lift.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's OT/IT plant data foundation is immature — frame OEE/predictive/vision value as conditional on data readiness, not an achievable number.",
      "OEE is quoted without an availability/performance/quality split — present as not-yet-trustworthy and ask for decomposition.",
      "Benchmarks are cited without the tenant's own baseline line/asset data — present as planning ranges.",
      "Vendor-reported OEE-point or downtime-reduction outcomes are cited — mark as vendor claims pending validation on the tenant's lines.",
      "Quality/yield gains are projected without accounting for product mix and demand volatility — flag erosion risk.",
    ],
    inferenceLanguage: [
      "Across discrete and process plants, OEE typically runs...",
      "Without your machine and quality data, the industry pattern suggests...",
      "Plants at this maintenance maturity commonly see unplanned downtime around...",
      "Where the plant data foundation is solid, programs of this type have delivered OEE gains of...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this tenant",
      "This tenant's actual OEE, first-pass yield, or scrap rate",
      "A claim that a specific line or asset is the bottleneck without the tenant's data",
      "A claim that AI can safely take autonomous floor-control action without the tenant's safety review",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "OEE loss breakdown / where is productive time lost",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from planned time through availability, performance, and quality losses to OEE.",
    },
    {
      questionPattern: "cost of poor quality by cause / scrap and rework contributors",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack cost of poor quality by defect type/step to show where quality leaks the most cash.",
    },
    {
      questionPattern: "value or cost impact of a plant program / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current conversion cost/OEE to projected, with OT/IT data-readiness and safety haircuts shown.",
    },
    {
      questionPattern: "asset reliability ranking / which assets to monitor or maintain first",
      exhibitKind: "table",
      note: "Risk-ranked assets: failure probability, downtime consequence, MTBF, condition-monitoring status, recommended action.",
    },
    {
      questionPattern: "plant operations KPI scorecard",
      exhibitKind: "table",
      note: "OEE, first-pass yield, scrap/rework, unplanned downtime, MTBF, schedule adherence, energy per unit, TRIR vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The OT/IT plant data foundation is funded and treated as the first deliverable, not an afterthought",
      "Value is scoped on OEE recovery and cost of poor quality, with operations and quality owning the targets",
      "Automation scope is designed inside EHS and machine-safety bounds so the floor trusts and adopts it",
      "Operators, technicians, and planners are engaged early and tribal knowledge is captured, so recommendations are acted on",
    ],
    failureDrivers: [
      "Analytics or vision bought before the data foundation exists — models are confident but unusable",
      "Underestimating OT/IT integration effort and data-quality/contextualization remediation",
      "Sizing value on headcount reduction instead of OEE and quality — the program over-promises and disappoints",
      "Proposing autonomy that crosses safety or regulated-process bounds, which stalls in review and erodes trust",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "OEE loss intelligence and predictive maintenance adopt first because the value " +
      "is tangible and the workflow change is contained; in-process vision quality and " +
      "AI scheduling follow once data and labeled evidence mature; process-parameter " +
      "optimization and any near-autonomous control are last, gated by safety, " +
      "validation, and operator trust.",
    roiClarity: "medium",
    roiClarityBasis:
      "OEE points, scrap/rework cost, and unplanned-downtime hours are directly " +
      "measurable, but attribution is muddied by product mix, demand volatility, and " +
      "the heavy dependence of delivered value on OT/IT data readiness — making ROI " +
      "firm where data and instrumentation are good and speculative where they are not.",
  },

  regulatoryFrame: {
    name: "EHS / machine-safety & OT-integration standards (with industry quality regimes)",
    relevance:
      "The dominant regulatory frame for the plant floor: OSHA and machine-functional-" +
      "safety standards make safety a hard constraint that bounds how autonomously AI " +
      "and equipment can act, while ISA-95/ISA-99 (IEC 62443) govern how IT may touch " +
      "OT. Industry quality and product-safety regimes (ISO 9001/IATF 16949, FDA cGMP, " +
      "FSMA/HACCP) and energy/environmental reporting (ISO 50001, GHG Scope 1/2) also " +
      "apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
