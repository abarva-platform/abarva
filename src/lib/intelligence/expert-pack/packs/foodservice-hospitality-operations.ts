// Consilium expert — Foodservice & Hospitality Operations (cross-cutting domain).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// operations expert for CONTRACT/MANAGED foodservice and hospitality at scale:
// the company that runs the cafe, cafeteria, catering, and dining at hundreds of
// corporate, campus, healthcare, and hospitality SITES under a client contract.
// It owns per-unit operations, menu & culinary, food cost & waste, labor
// scheduling, client/guest satisfaction, food safety & compliance, catering, and
// vendor/supply — across a long, heterogeneous tail of sites. Product-aware
// (foodservice-management systems, inventory/recipe-costing, scheduling,
// procurement/GPO), not product-locked.
//
// CROSS-CUTTING, NOT INDUSTRY-FUNCTION: the same operating discipline applies
// whether the site sits inside a bank tower, a hospital, a university, or a
// stadium — so this expert carries a crossCuttingDomain key, not an
// industry×function key. It deliberately does NOT cover the CLIENT's core
// business, real-estate/facilities capital, or the food MANUFACTURING/CPG supply
// chain upstream of the distributor (the supply-chain-transformation expert).
//
// CORE HONESTY — FOOD COST AND LABOR ARE THE MARGIN, FOOD SAFETY IS A HARD
// CONSTRAINT, AND PER-SITE EXECUTION VARIANCE IS THE OPERATIONAL PROBLEM.
// Contract foodservice runs on razor-thin unit margins where food cost and labor
// together routinely consume 55-70% of revenue, so those two lines ARE the
// economics — everything else is rounding. Food safety is not a lever to
// optimize against; it is a non-negotiable floor where a single failure can
// close a unit, void a contract, and become a public-health event, so no value
// claim here is allowed to trade safety for cost. And the operational reality is
// that the same menu, recipe, and labor model produce wildly different results
// site to site, because each unit is run by a different chef/manager against a
// different client population, kitchen, and local supply — variance across the
// estate, not the average, is where margin leaks. Every value claim is hedged
// against (1) per-site execution variance, (2) participation/capture risk (you
// cannot save your way to margin if guests stop showing up), (3) food-inflation
// pass-through and contract pricing structure (cost-plus vs P&L vs management
// fee), and (4) the food-safety floor that caps how lean labor and process can run.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const foodserviceHospitalityOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.foodservice-hospitality-operations",
    expertName: "Foodservice & Hospitality Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "foodservice-hospitality-operations",
    scopeNote:
      "Contract/managed foodservice and hospitality operations run across a " +
      "fleet of client sites (corporate cafes/cafeterias, campus dining, " +
      "healthcare/retirement dining, hospitality and event catering): per-unit " +
      "operations, menu engineering and culinary execution, food cost and waste " +
      "control, labor scheduling and productivity, client and guest " +
      "satisfaction, food safety and regulatory compliance, catering and " +
      "events, and vendor/supply (distributor, GPO, local). The honest center " +
      "of gravity is that food cost and labor are the dominant margin levers, " +
      "food safety is a hard non-negotiable constraint, and per-site execution " +
      "variance across the estate is the operational challenge — not the " +
      "single-unit average. Excludes the client's core business, real-estate/" +
      "facilities capital projects, and the upstream food manufacturing/CPG " +
      "supply chain before the distributor (the supply-chain expert).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "food_cost_pct",
        name: "Food cost % of sales",
        definition:
          "Cost of food (and beverage) consumed as a percentage of food/" +
          "beverage revenue over the period, at the unit and rolled to the estate.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 28,
          high: 40,
          basis:
            "Segment-dependent (high-volume corporate dining lower, premium/" +
            "specialty and healthcare-therapeutic higher); in-range because too " +
            "low signals under-portioning or quality cuts that hurt participation; " +
            "operator experience",
          label: "planning-range",
        },
        dataSource:
          "Inventory/recipe-costing system: purchases and inventory movement " +
          "over POS food revenue by unit/period",
        whyItMatters:
          "One of the two lines that ARE the margin. On thin unit economics a " +
          "point of food cost moves the P&L more than almost any other lever, but " +
          "it is in-range not lower-is-better: cutting food cost by under-" +
          "portioning or trading down quality erodes the guest experience and " +
          "participation that the whole unit depends on.",
      },
      {
        key: "labor_cost_pct",
        name: "Labor cost % of sales",
        definition:
          "Total unit labor cost (wages, premium/overtime, benefits load) as a " +
          "percentage of revenue for the period.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 25,
          high: 40,
          basis:
            "Segment- and service-style-dependent (grab-and-go/retail lower, " +
            "full-service/catering and healthcare tray-line higher); in-range " +
            "because under-labor breaks service and food-safety execution",
          label: "planning-range",
        },
        dataSource:
          "Payroll/scheduling system labor cost over POS revenue by unit/period",
        whyItMatters:
          "The second of the two dominant margin lines and the one most exposed " +
          "to wage inflation and turnover. It is in-range, not lower-is-better: " +
          "cutting labor past the point where line speed, service, sanitation, " +
          "and food-safety steps hold destroys more value than it saves — and " +
          "can breach the safety floor.",
      },
      {
        key: "food_waste_pct",
        name: "Food waste %",
        definition:
          "Food discarded (pre-consumer prep/overproduction + spoilage + plate " +
          "waste where measured) as a percentage of food purchased or produced.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 10,
          basis:
            "Pre-consumer/overproduction waste commonly runs mid-single to low-" +
            "double-digit % of food purchased; varies sharply by forecasting and " +
            "production discipline; operator and sustainability-program data",
          label: "planning-range",
        },
        dataSource:
          "Waste-tracking (scale/photo) logs and inventory variance reconciled " +
          "to production records by unit",
        whyItMatters:
          "Waste is food cost you paid for and threw away — the most directly " +
          "controllable slice of the dominant cost line, and a sustainability/ESG " +
          "commitment increasingly written into contracts. Most waste is " +
          "overproduction driven by weak demand forecasting, exactly what better " +
          "production planning can move.",
      },
      {
        key: "contribution_margin_per_site",
        name: "Contribution margin per site",
        definition:
          "Unit revenue less food, labor, and other directly controllable unit " +
          "cost — the per-site operating contribution before allocated overhead.",
        unit: "USD / period",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 12,
          basis:
            "Unit contribution margin commonly runs low-single to low-double-" +
            "digit % of revenue on thin contract foodservice economics; varies by " +
            "contract type (cost-plus vs P&L), volume, and segment",
          label: "planning-range",
        },
        dataSource:
          "Unit P&L: POS revenue less food/labor/other controllable cost from " +
          "the foodservice-management system by unit/period",
        whyItMatters:
          "The bottom line each unit is run to and the number the client and the " +
          "operator both watch. Because the estate is a long tail of units, total " +
          "value lives in the DISTRIBUTION of contribution across sites — the " +
          "worst-quartile units, not the average, are where margin is recovered.",
      },
      {
        key: "participation_rate",
        name: "Participation / capture rate",
        definition:
          "Share of the eligible on-site population (employees, students, " +
          "patients, residents) who actually buy or are served on a given day or " +
          "period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 70,
          basis:
            "Highly segment- and site-dependent (captive healthcare/campus high, " +
            "open corporate cafe with nearby alternatives low); tracked as a " +
            "trend and vs comparable sites",
          label: "planning-range",
        },
        dataSource:
          "POS transactions/covers against eligible-population headcount by " +
          "unit/daypart",
        whyItMatters:
          "The demand line the whole P&L rides on, and the honest check on cost-" +
          "cutting: you cannot save your way to margin if guests stop showing up. " +
          "Falling participation is the leading signal that menu, price, or " +
          "quality moves have gone too far, or that the experience is losing to " +
          "off-site alternatives.",
      },
      {
        key: "guest_client_satisfaction",
        name: "Guest & client satisfaction",
        definition:
          "Guest-reported satisfaction (survey/NPS) for the dining experience " +
          "and, separately, the CLIENT stakeholder's satisfaction with the " +
          "contract relationship, by site.",
        unit: "score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis:
            "Satisfaction scales vary by method and segment; tracked as a trend " +
            "and against comparable sites, not as an absolute; the client score " +
            "is the retention/renewal leading indicator",
          label: "planning-range",
        },
        dataSource:
          "Guest survey/feedback platform and structured client business-review " +
          "scores by site",
        whyItMatters:
          "Two distinct customers must both be satisfied: the guest who eats and " +
          "the client who pays. Guest satisfaction drives participation and " +
          "revenue; client satisfaction drives contract retention and renewal — " +
          "the existential outcome for a contract operator.",
      },
      {
        key: "menu_mix_margin",
        name: "Menu mix margin (menu engineering)",
        definition:
          "Blended contribution margin of what actually sold, reflecting how the " +
          "sales mix tilts toward high-margin/high-popularity ('star') vs low-" +
          "margin or low-popularity items.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 72,
          basis:
            "Blended item contribution margin after food cost; lifted by menu " +
            "engineering (mix toward stars), recipe costing, and pricing; varies " +
            "by segment and service style",
          label: "planning-range",
        },
        dataSource:
          "Recipe-costing and POS item-mix data joined to plate cost by unit",
        whyItMatters:
          "Margin is made in the MIX, not just the food-cost number. Steering " +
          "guests toward high-margin, high-popularity items via menu design and " +
          "pricing lifts profit without cutting portions or quality — the margin-" +
          "friendly lever that protects participation.",
      },
      {
        key: "inventory_turns",
        name: "Inventory turns",
        definition:
          "How many times food/beverage inventory is sold and replaced over the " +
          "period (cost of goods consumed divided by average inventory at cost).",
        unit: "turns / period",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 4,
          high: 12,
          basis:
            "Perishable-heavy foodservice turns inventory frequently; too low " +
            "signals over-ordering and spoilage risk, too high can signal stockout/" +
            "menu-availability risk; operator experience",
          label: "planning-range",
        },
        dataSource:
          "Inventory-management system: COGS over average inventory value by unit",
        whyItMatters:
          "Perishability makes inventory discipline a direct lever on both waste " +
          "and working capital. Low turns mean cash tied up in food that spoils " +
          "before it sells; it is the operational tell of weak ordering and " +
          "forecasting discipline.",
      },
      {
        key: "food_safety_audit_score",
        name: "Food-safety audit / inspection score",
        definition:
          "Score from health-department inspections and internal/third-party " +
          "food-safety audits (HACCP adherence, temperature logs, sanitation, " +
          "allergen controls) by unit.",
        unit: "score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 100,
          basis:
            "Food-safety is a floor, not a range to optimize: the planning band " +
            "sits near the top because anything materially below passing is a " +
            "unit-closure and contract-loss risk, not a tunable trade-off",
          label: "planning-range",
        },
        dataSource:
          "Health-inspection results plus internal/third-party audit and " +
          "temperature/HACCP log records by unit",
        whyItMatters:
          "The hard constraint the entire operation runs under. A single " +
          "critical violation or foodborne-illness event can close a unit, void " +
          "the contract, and become a public-health and reputational crisis — so " +
          "this metric caps how lean labor and process are allowed to run.",
      },
      {
        key: "on_time_meal_service",
        name: "On-time meal service",
        definition:
          "Share of meals/covers served within the committed window (tray-line " +
          "delivery, cafe service speed, catering on-time delivery), by unit.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 92,
          high: 99,
          basis:
            "Service-window adherence; healthcare patient-meal and scheduled " +
            "catering windows are near-absolute, cafe speed-of-service is more " +
            "elastic; varies by service model",
          label: "planning-range",
        },
        dataSource:
          "POS/service-timing, tray-line tracking, and catering delivery logs by " +
          "unit/daypart",
        whyItMatters:
          "The most visible service-quality signal to guests and clients, and in " +
          "healthcare tied to patient care and satisfaction. Late or slow " +
          "service drives guest dissatisfaction, falling participation, and " +
          "client-relationship friction — and is the sharpest test of whether " +
          "labor was scheduled to actual demand.",
      },
      {
        key: "catering_revenue",
        name: "Catering / events revenue",
        definition:
          "Revenue from catering and events (internal client functions, " +
          "conferences, special events) at the unit or estate, often the highest-" +
          "margin revenue stream.",
        unit: "USD / period",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Catering as a share of total unit revenue varies widely by site " +
            "type (corporate-HQ high, healthcare low); typically higher-margin " +
            "than retail dining; operator experience",
          label: "planning-range",
        },
        dataSource:
          "Catering/event order-management system revenue by unit/event/period",
        whyItMatters:
          "Often the highest-margin and most growable revenue stream and a key " +
          "lever on client relationship and account growth. It is also the most " +
          "forecast-sensitive (over- or under-production on a single large event " +
          "swings cost and waste sharply), making it a prime AI-forecasting target.",
      },
      {
        key: "covers_per_labor_hour",
        name: "Covers per labor hour (labor productivity)",
        definition:
          "Meals/covers (or transactions) served per paid labor hour — the " +
          "headline labor-productivity unit on the foodservice floor.",
        unit: "covers / labor hour",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 8,
          high: 25,
          basis:
            "Strongly service-style-dependent (grab-and-go/retail high, full-" +
            "service/scratch-cook and tray-line lower); tracked as a trend and vs " +
            "comparable units, not as an absolute",
          label: "planning-range",
        },
        dataSource:
          "POS covers/transactions joined to scheduling/payroll paid hours by " +
          "unit/daypart",
        whyItMatters:
          "Ties the second dominant cost line to output and exposes whether " +
          "labor is matched to demand by daypart. Like food cost it must be " +
          "earned by scheduling to real demand, not by under-staffing into slow " +
          "service and skipped food-safety steps — productivity at the expense of " +
          "the safety floor is a false economy.",
      },
    ],

    painThemes: [
      {
        key: "food_cost_creep_and_inflation_passthrough",
        name: "Food-cost creep and food-inflation pass-through",
        description:
          "Food cost drifts up through recipe drift, portion creep, off-contract " +
          "buying, and unmanaged food inflation, while the contract pricing " +
          "structure (cost-plus, P&L, or management fee) determines whether the " +
          "operator or the client absorbs it — and units that do not cost recipes " +
          "or enforce purchasing discipline silently bleed margin.",
        detectionSignal:
          "Food cost % trending up against menu, high off-contract/maverick spend, " +
          "recipes not costed or not updated for price moves, food inflation not " +
          "reflected in menu pricing or client pass-through.",
        diagnosticQuestion:
          "Are recipes costed and kept current with price moves, and does your " +
          "contract structure pass food inflation through — or is the operator " +
          "absorbing it unit by unit?",
      },
      {
        key: "overproduction_and_waste",
        name: "Overproduction and food waste",
        description:
          "Production is planned on fixed pars, last year, or chef intuition " +
          "rather than forecasted demand by daypart, so units overproduce to " +
          "avoid run-outs and discard the surplus — paying for food that is " +
          "thrown away and missing an ESG/sustainability commitment in the bargain.",
        detectionSignal:
          "High pre-consumer/overproduction waste, production not tied to a " +
          "demand forecast, no waste tracking, inventory variance and spoilage at " +
          "month-end, leftovers routinely discarded.",
        diagnosticQuestion:
          "Is production planned to a demand forecast by daypart with waste " +
          "tracked, or built on fixed pars and intuition that overproduce to be safe?",
      },
      {
        key: "labor_not_matched_to_demand",
        name: "Labor not matched to demand/covers",
        description:
          "Schedules are built on fixed templates or budgeted hours rather than " +
          "forecasted covers and catering load by daypart, so units are over-" +
          "staffed in slow periods and under-staffed at peak — paying for idle " +
          "labor while service speed, on-time meals, and food-safety steps suffer " +
          "when it is busy.",
        detectionSignal:
          "Flat staffing across very different dayparts, slow service and missed " +
          "windows at peak, unplanned overtime, covers-per-labor-hour varying " +
          "widely by daypart, no demand-based scheduling.",
        diagnosticQuestion:
          "Is unit labor scheduled to forecasted covers and catering load by " +
          "daypart, or built on fixed templates and a budgeted-hours number?",
      },
      {
        key: "per_site_execution_variance",
        name: "Per-site execution variance across the estate",
        description:
          "The same menu, recipe, labor model, and standards produce very " +
          "different food cost, waste, satisfaction, and safety results unit to " +
          "unit, because each site is run by a different chef/manager against a " +
          "different population and kitchen — and there is no closed-loop " +
          "visibility or coaching to compress the worst-quartile tail.",
        detectionSignal:
          "Wide unit-to-unit spread in food cost %, waste, participation, " +
          "satisfaction, and audit score that does not track site size/segment; " +
          "the estate average looks fine while the bottom quartile is failing.",
        diagnosticQuestion:
          "How wide is the spread between your best- and worst-performing units " +
          "on food cost, waste, satisfaction, and food-safety score — and what " +
          "closes it?",
      },
      {
        key: "participation_erosion",
        name: "Participation / capture erosion",
        description:
          "Guest participation drifts down as price increases, quality or " +
          "variety cuts, repetitive menus, or nearby off-site alternatives erode " +
          "demand — and because cost-cutting and participation pull against each " +
          "other, units 'save' their way into falling covers and worse unit " +
          "economics.",
        detectionSignal:
          "Falling participation/capture against stable population, declining " +
          "covers after price or menu changes, guest-satisfaction decline, rising " +
          "off-site spend, repetitive menu cycles.",
        diagnosticQuestion:
          "Is participation/capture stable or eroding, and have recent price, " +
          "portion, or menu-variety changes moved it — i.e. is cost-cutting " +
          "costing you covers?",
      },
      {
        key: "food_safety_compliance_drift",
        name: "Food-safety and compliance drift",
        description:
          "Temperature logs, HACCP steps, allergen controls, and sanitation are " +
          "done inconsistently and recorded on paper, so compliance is verified " +
          "only at periodic inspection rather than continuously — and a lean-" +
          "labor or high-turnover unit quietly drifts toward a critical violation " +
          "or an allergen/foodborne-illness event.",
        detectionSignal:
          "Paper temperature logs and self-reported checks, audit/inspection " +
          "scores variable across units, allergen procedures inconsistent, no " +
          "real-time monitoring, near-misses not surfaced until inspection.",
        diagnosticQuestion:
          "Are food-safety steps (temperatures, HACCP, allergen, sanitation) " +
          "monitored and verified continuously, or recorded on paper and checked " +
          "only at inspection?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "demand_forecast_production_planning",
        name: "Demand forecasting & production planning",
        valueMechanism:
          "Forecast covers and menu-item demand by daypart and event from POS " +
          "history, population, calendar, and weather, and convert it into " +
          "production plans and par levels — so units produce to expected demand " +
          "instead of overproducing to be safe, cutting overproduction waste and " +
          "food cost while holding availability and on-time service.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "POS cover/item-sales history by unit/daypart and eligible-population/calendar data",
          "Recipes/production records linking menu items to ingredients and yields",
          "Waste-tracking and inventory data to close the forecast-to-actual loop",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Forecasts must respect the food-safety floor — never plan thinner prep " +
            "or holding that breaks temperature/time controls to hit a waste target",
          "A forecast that drives run-outs erodes participation — constrain on " +
            "availability/service, not waste alone, and keep the chef in the loop",
        ],
        metricsMoved: [
          "food_waste_pct",
          "food_cost_pct",
          "inventory_turns",
          "on_time_meal_service",
        ],
      },
      {
        key: "menu_engineering_dynamic_pricing",
        name: "Menu engineering & margin-aware pricing",
        valueMechanism:
          "Join recipe cost to POS item-mix to classify items by margin and " +
          "popularity, and steer menu design, placement, and pricing toward high-" +
          "margin, high-popularity 'stars' — lifting blended menu-mix margin " +
          "without under-portioning or trading down quality, the margin-friendly " +
          "path that protects participation.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Current recipe/plate costing and POS item-level sales mix by unit",
          "Price elasticity / participation signal where available",
          "Menu and pricing system to action the recommendations",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Pricing up to protect margin can erode participation — pair every " +
            "pricing move with a participation/capture watch",
          "Recommendations are only as good as recipe-cost currency — stale plate " +
            "costs produce wrong margin classifications",
        ],
        metricsMoved: [
          "menu_mix_margin",
          "food_cost_pct",
          "participation_rate",
          "contribution_margin_per_site",
        ],
      },
      {
        key: "demand_based_labor_scheduling",
        name: "Demand-based labor scheduling",
        valueMechanism:
          "Forecast covers and catering load by daypart and generate schedules " +
          "that put the right hours in the right place — staffing peak to protect " +
          "service speed, on-time meals, and food-safety steps, trimming idle " +
          "hours in slow windows, within wage-and-hour and break constraints — so " +
          "labor cost falls where it is waste and rises only where it earns " +
          "covers and protects safety.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Forecasted covers/catering load by unit/daypart and a labor-standards model",
          "Associate availability, skills (incl. food-safety certification), and labor-law constraints",
          "Actual worked hours for schedule-vs-actual feedback",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Never schedule below the coverage needed to run food-safety and " +
            "sanitation steps — encode the safety floor as a hard constraint",
          "Wage-and-hour, break, and certified-staff-on-site rules are hard " +
            "constraints, not soft penalties on the optimizer",
        ],
        metricsMoved: [
          "labor_cost_pct",
          "covers_per_labor_hour",
          "on_time_meal_service",
          "food_safety_audit_score",
        ],
      },
      {
        key: "food_safety_monitoring",
        name: "Continuous food-safety monitoring & compliance",
        valueMechanism:
          "Capture temperatures (IoT sensors/connected probes), HACCP checks, " +
          "allergen, and sanitation digitally and monitor them continuously with " +
          "alerting and analytics — surfacing drift and near-misses in real time " +
          "instead of at periodic inspection, so the hard safety floor is held " +
          "and audit scores rise even as labor runs lean.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Connected temperature/equipment sensors and digital checklist/HACCP logs by unit",
          "Inspection/audit history and allergen/recipe data",
          "Alerting and case-workflow to drive corrective action",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Monitoring augments but never replaces certified human food-safety " +
            "accountability — alerts must drive a human corrective action, logged",
          "Sensor gaps/failures must fail safe (assume unsafe) — a silent dead " +
            "sensor must not read as compliant",
        ],
        metricsMoved: [
          "food_safety_audit_score",
          "food_waste_pct",
        ],
      },
      {
        key: "inventory_procurement_optimization",
        name: "Inventory & procurement optimization",
        valueMechanism:
          "Tie ordering to forecasted production and on-hand inventory, flag off-" +
          "contract/maverick buying, and surface GPO/contract-compliant " +
          "substitutions and price-change exposure — raising inventory turns, " +
          "cutting spoilage and over-ordering, and recovering food cost lost to " +
          "purchasing leakage.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Inventory and purchasing/distributor order data with contract/GPO price files",
          "Forecasted production/par levels by unit",
          "Recipe-ingredient mapping to translate menus into purchase needs",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Substitution recommendations must respect allergen, quality, and " +
            "client-spec constraints — a cheaper sub that violates a spec is a " +
            "safety/contract risk",
          "Over-tightening orders to lift turns can cause run-outs and hurt " +
            "participation — balance against availability",
        ],
        metricsMoved: [
          "inventory_turns",
          "food_cost_pct",
          "food_waste_pct",
        ],
      },
      {
        key: "guest_experience_personalization",
        name: "Guest-experience & participation analytics",
        valueMechanism:
          "Analyze guest feedback, item mix, and participation to detect menu " +
          "fatigue, satisfaction drivers, and capture leakage, and (where mobile " +
          "ordering/loyalty exist) personalize offers — lifting participation and " +
          "guest satisfaction so the demand line that the whole P&L rides on " +
          "grows instead of eroding under cost pressure.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Guest survey/feedback, POS item-mix, and participation/capture data by unit",
          "Mobile-ordering/loyalty data where deployed",
          "Eligible-population and off-site benchmark context",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Personalization must honor dietary/allergen and privacy constraints — " +
            "never surface an offer that conflicts with a declared allergen",
          "Satisfaction analytics can over-index on vocal minorities — weight by " +
            "participation and representativeness",
        ],
        metricsMoved: [
          "participation_rate",
          "guest_client_satisfaction",
          "catering_revenue",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "foodservice_management_platform",
        name: "Foodservice-management platform (POS + inventory + recipe costing)",
        description:
          "The unit operating backbone: POS/cashless payment, inventory and " +
          "purchasing, recipe/menu costing, and unit P&L — the system of record " +
          "for what is sold, what it cost, and what each unit earns across the " +
          "estate.",
        boundary:
          "Owns transactions, inventory, recipe cost, and unit P&L reporting; " +
          "does NOT set the contract pricing structure (commercial/finance) or " +
          "run culinary execution — it records and cost-controls what the kitchen " +
          "does.",
        humanAccountabilityPoint: "VP Operations / Director of Culinary & Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "demand_production_planning_layer",
        name: "Demand-forecasting & production-planning layer",
        description:
          "A forecasting/production layer over POS, population, and calendar data " +
          "that predicts covers and item demand by daypart/event and converts it " +
          "to production plans, par levels, and order needs — the engine that " +
          "moves units from overproduce-to-be-safe to produce-to-demand.",
        boundary:
          "Owns demand forecasting and production/order planning; does not " +
          "execute the cook line or set the menu (culinary) — it informs " +
          "production and depends on recipe and inventory data to act.",
        humanAccountabilityPoint: "Director of Culinary / Executive Chef (unit-level sign-off)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "labor_scheduling_platform",
        name: "Demand-based labor-scheduling platform",
        description:
          "A scheduling/time-and-attendance platform that forecasts labor demand " +
          "from covers/catering load, generates wage-and-hour-compliant schedules " +
          "that protect the food-safety coverage floor, and closes the loop on " +
          "schedule-vs-actual across units.",
        boundary:
          "Owns labor forecasting, scheduling, and adherence; does not set the " +
          "labor budget or wage strategy (finance/HR) and does not run service — " +
          "it plans the hours the unit runs.",
        humanAccountabilityPoint: "Director of Operations / Unit General Manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "food_safety_compliance_system",
        name: "Digital food-safety & compliance system",
        description:
          "A digital HACCP/temperature-monitoring and checklist platform (with " +
          "connected sensors where deployed) that captures food-safety steps " +
          "continuously, alerts on drift, and maintains the audit trail — turning " +
          "compliance from a periodic-inspection event into a continuous, " +
          "verifiable control.",
        boundary:
          "Owns continuous monitoring, alerting, and the compliance record; does " +
          "NOT replace the certified food-safety manager's accountability — it " +
          "equips the human who owns the safety decision and corrective action.",
        humanAccountabilityPoint: "Director of Food Safety & QA / Certified Food-Safety Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "estate_performance_management",
        name: "Estate performance management & culinary coaching loop",
        description:
          "A field-leadership operating rhythm and analytics layer that surfaces " +
          "unit-to-unit variance (food cost, waste, participation, satisfaction, " +
          "safety) and drives targeted culinary/operational coaching to lift the " +
          "worst-quartile units — the human system that converts estate data into " +
          "compressed per-site variance.",
        boundary:
          "Owns the coaching/operating-rhythm loop and variance analytics; does " +
          "not replace the unit systems — it is the multi-unit management layer " +
          "that makes their signals change unit behavior across the estate.",
        humanAccountabilityPoint: "Regional VP / District / Area Manager leadership",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Foodservice value is dominated by two lines — food cost and labor — that " +
        "together consume the majority of revenue, so the prize is concentrated " +
        "there: demand-forecasting and production planning cut overproduction " +
        "waste and food cost; menu engineering lifts blended margin without " +
        "cutting portions; demand-based scheduling recovers idle labor and " +
        "redeploys it to peak; inventory/procurement optimization recovers " +
        "purchasing leakage; and continuous safety monitoring lets units run lean " +
        "without breaching the hard safety floor. But the prize is gated at four " +
        "honest points this expert refuses to assume away: (1) per-site execution " +
        "variance — the same model produces very different unit results, so " +
        "estate-wide value depends on compressing the worst-quartile tail, not on " +
        "the pilot site; (2) participation/capture risk — cost-cutting and demand " +
        "pull against each other, and a 'saving' that drives guests off-site is a " +
        "loss; (3) food-inflation pass-through and contract structure (cost-plus " +
        "vs P&L vs management fee) — who actually keeps a food-cost saving depends " +
        "on the contract; and (4) the food-safety floor, which is non-negotiable " +
        "and caps how lean labor and process can run. Forward value must " +
        "therefore be discounted for per-site variance, participation risk, and " +
        "contract pass-through, quoted with a held-safety constraint, and never " +
        "presented as the pilot-unit or estate-average number.",
      dominantHaircutFactors: [
        {
          factor: "Per-site execution variance across the estate",
          rationale:
            "Pilot or best-unit results overstate estate-wide value because the " +
            "worst-quartile units execute far worse on the same menu/labor/safety " +
            "model; rolled-up value must be discounted for the long tail until " +
            "culinary coaching compresses it.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Spread between best- and worst-quartile unit execution on food " +
              "cost, waste, and participation across a heterogeneous estate",
            label: "planning-range",
          },
        },
        {
          factor: "Participation / capture risk",
          rationale:
            "Food-cost and labor savings assume demand holds, but price, portion, " +
            "or quality moves that chase margin can erode participation — so a " +
            "modeled saving must be netted against the covers (and revenue) it " +
            "risks losing.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Erosion of modeled margin gains where cost-cutting depressed " +
              "participation/capture or pushed guests to off-site alternatives",
            label: "planning-range",
          },
        },
        {
          factor: "Food-inflation pass-through & contract structure",
          rationale:
            "Whether a food-cost saving accrues to the operator or the client " +
            "depends on the contract (cost-plus, P&L, or management fee) and on " +
            "how food inflation is passed through — so the operator-realized share " +
            "of a modeled saving varies sharply by deal.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Share of a modeled food-cost saving retained by the operator after " +
              "contract pricing structure and inflation pass-through terms",
            label: "planning-range",
          },
        },
        {
          factor: "Food-safety floor & adoption friction",
          rationale:
            "Labor and process cannot be cut below the coverage needed to run " +
            "food-safety and sanitation steps, and chef/manager adoption of " +
            "forecast- and tool-driven production is uneven — so the operationally " +
            "feasible saving is less than the theoretical optimum.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reduction in addressable labor/process savings once the food-" +
              "safety coverage floor and chef/manager adoption are applied",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Food-cost recovery",
          range: {
            low: 0.01,
            high: 0.04,
            basis:
              "Relative food-cost reduction from recipe costing, production-to-" +
              "demand, menu engineering, and purchasing discipline, after the " +
              "variance and pass-through haircuts, holding quality/participation",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in food_cost_pct at held quality/participation",
        },
        {
          lever: "Food-waste reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Relative pre-consumer/overproduction waste reduction from demand-" +
              "based production planning and waste tracking; varies with starting " +
              "maturity",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in food_waste_pct",
        },
        {
          lever: "Labor productivity / cost recovery",
          range: {
            low: 0.02,
            high: 0.07,
            basis:
              "Relative labor-cost reduction (or covers-per-labor-hour gain) from " +
              "demand-based scheduling, after the adherence/variance haircut and " +
              "holding the food-safety coverage floor",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in labor_cost_pct (or covers_per_labor_hour gain) at held safety",
        },
        {
          lever: "Participation / revenue lift",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Relative participation/capture lift from menu engineering, variety, " +
              "and guest-experience analytics, net of per-site variance",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in participation_rate (and resulting revenue/catering_revenue)",
        },
      ],
      timeToValueBand:
        "Recipe costing & menu engineering: 1-2 quarters once recipes are costed " +
        "and POS item-mix is available. Demand-based scheduling: 2-4 quarters to " +
        "demand-matched schedules with measured adherence. Demand forecasting & " +
        "production planning: 2-4 quarters to a calibrated forecast-to-production " +
        "loop with waste tracking. Continuous food-safety monitoring: 2-3 " +
        "quarters (longer where sensors must be installed). Estate-wide value " +
        "always lags the pilot unit — compressing per-site variance through the " +
        "culinary/field coaching loop is the longest pole.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Foodservice-management / POS & inventory platform",
          role:
            "System of record for transactions, inventory, purchasing, recipe/" +
            "menu costing, and unit P&L across the estate.",
          examples: [
            "Agilysys",
            "Oracle MICROS (Simphony)",
            "CrunchTime",
            "Toast (hospitality)",
          ],
        },
        {
          name: "Demand forecasting & production planning",
          role:
            "Forecasts covers/item demand and converts it to production plans, " +
            "par levels, and order needs to cut overproduction.",
          examples: [
            "CrunchTime production planning",
            "Galley",
            "demand-forecasting add-ons to FSM suites",
          ],
        },
        {
          name: "Labor scheduling & time and attendance",
          role:
            "Forecasts labor demand, builds wage-and-hour-compliant schedules, " +
            "and measures schedule adherence by unit.",
          examples: [
            "HotSchedules (Fourth)",
            "UKG (Kronos)",
            "Legion",
            "When I Work",
          ],
        },
        {
          name: "Food-safety, HACCP & temperature monitoring",
          role:
            "Captures temperatures, HACCP steps, allergen and sanitation checks " +
            "continuously and maintains the compliance audit trail.",
          examples: [
            "Zenput (Crunchtime)",
            "Jolt",
            "ComplianceMate / connected temperature sensors",
            "FreshLoc",
          ],
        },
        {
          name: "Procurement / GPO & distributor ordering",
          role:
            "Holds contract/GPO price files, distributor ordering, and purchasing " +
            "compliance — the food-cost purchasing layer.",
          examples: [
            "Foodbuy (GPO)",
            "Entegra (GPO)",
            "US Foods / Sysco e-ordering",
            "Buyers Edge / Dining Alliance",
          ],
        },
      ],
      roles: [
        {
          title: "VP / SVP Operations (Foodservice)",
          accountability:
            "End-to-end unit P&L execution, food and labor cost, client " +
            "retention, and execution consistency across the estate.",
        },
        {
          title: "Regional / District / Area Manager",
          accountability:
            "A group of units' food cost, labor, safety, satisfaction, and " +
            "client relationships — the field layer that compresses per-site variance.",
        },
        {
          title: "Unit General Manager / Food Service Director",
          accountability:
            "A single site's P&L, labor, food cost, guest and client " +
            "satisfaction, and food-safety compliance — where execution is won or lost.",
        },
        {
          title: "Executive / Unit Chef",
          accountability:
            "Menu, recipe execution, production, food cost at the plate, and " +
            "culinary quality at the unit.",
        },
        {
          title: "Director of Food Safety & QA",
          accountability:
            "Food-safety program, HACCP, allergen controls, audits, and " +
            "regulatory compliance across the estate — the hard-constraint owner.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Food-safety regulation (FDA Food Code, HACCP, local health codes)",
          relevance:
            "Temperature/time controls, HACCP plans, sanitation, and inspection " +
            "regimes are the hard floor the operation runs under — violations can " +
            "close a unit and void a contract.",
        },
        {
          name: "Allergen & menu-labeling rules (FALCPA, menu-labeling, Natasha's-law-style)",
          relevance:
            "Allergen disclosure and accurate menu/ingredient labeling are " +
            "legally required and a direct guest-safety risk — they constrain " +
            "recipe substitution and personalization.",
        },
        {
          name: "Wage & hour and predictive-scheduling labor law",
          relevance:
            "Overtime, break, minor-employment, and fair-workweek rules constrain " +
            "how labor can be forecast, scheduled, and changed — hard constraints " +
            "on the scheduling optimizer.",
        },
        {
          name: "Nutrition / therapeutic-diet & segment rules (healthcare, K-12/USDA, campus)",
          relevance:
            "Segment-specific diet, nutrition, and procurement rules (e.g. " +
            "healthcare therapeutic diets, USDA school-meal patterns) govern menu " +
            "and production in regulated dining settings.",
        },
      ],
      canonicalTerms: [
        {
          term: "Food cost % / plate cost",
          definition:
            "Cost of food consumed as a percentage of food revenue; plate cost is " +
            "the costed ingredient total of a single menu item — the unit of " +
            "recipe costing and menu engineering.",
        },
        {
          term: "Participation / capture rate",
          definition:
            "Share of the eligible on-site population that actually buys or is " +
            "served — the demand line the unit P&L rides on.",
        },
        {
          term: "Menu engineering (stars/plowhorses/puzzles/dogs)",
          definition:
            "Classifying menu items by margin and popularity and steering mix " +
            "toward high-margin/high-popularity 'stars' to lift blended margin.",
        },
        {
          term: "HACCP",
          definition:
            "Hazard Analysis and Critical Control Points — the systematic food-" +
            "safety control framework (temperatures, critical limits, monitoring, " +
            "corrective action) that governs production.",
        },
        {
          term: "Cost-plus vs P&L vs management-fee contract",
          definition:
            "The three contract structures that determine whether the operator or " +
            "the client bears food/labor cost and inflation — and who keeps a " +
            "saving.",
        },
        {
          term: "Covers / overproduction waste",
          definition:
            "A 'cover' is a guest/meal served; overproduction waste is food " +
            "prepared but not sold and discarded — the most controllable slice of " +
            "food cost.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Food and labor cost (food cost %, labor cost %, contribution)",
        authoritativeSource:
          "Foodservice-management/POS and inventory-costing system unit P&L: " +
          "food and labor cost over revenue by unit/period",
        whatGoodEvidenceLooksLike:
          "Food cost % and labor cost % by unit and daypart against recipe-costed " +
          "menu and covers, with the unit-to-unit distribution — so the two " +
          "dominant lines are separated from estate-average noise.",
        weakEvidenceToReject:
          "A single estate-wide food-cost or labor-cost % with no unit-level " +
          "spread, no recipe costing, and no covers/participation basis.",
      },
      {
        claim: "Food waste and production-to-demand",
        authoritativeSource:
          "Waste-tracking (scale/photo) logs and inventory variance reconciled to " +
          "production and forecast records by unit",
        whatGoodEvidenceLooksLike:
          "Waste by unit split into pre-consumer/overproduction vs spoilage vs " +
          "plate waste, tied to forecast-vs-actual production — the controllable " +
          "slice made visible.",
        weakEvidenceToReject:
          "An assumed waste percentage or a sustainability headline with no " +
          "measured waste tracking or production basis.",
      },
      {
        claim: "Per-site execution variance (cost, waste, participation, safety)",
        authoritativeSource:
          "Unit-level distribution of food cost %, waste, participation, " +
          "satisfaction, and audit score from FSM/safety systems across the estate",
        whatGoodEvidenceLooksLike:
          "Best-to-worst-quartile spread by unit (not just the average) on the " +
          "core metrics, normalized for site segment/size.",
        weakEvidenceToReject:
          "An estate-average metric presented as if it held at every unit, hiding " +
          "the worst-quartile tail.",
      },
      {
        claim: "Food-safety compliance and audit performance",
        authoritativeSource:
          "Health-inspection results plus internal/third-party audit and " +
          "temperature/HACCP log records by unit",
        whatGoodEvidenceLooksLike:
          "Audit/inspection scores by unit with critical-violation history and " +
          "continuous temperature/HACCP evidence — the hard floor demonstrated, " +
          "not assumed.",
        weakEvidenceToReject:
          "A claim that safety is 'fine' resting on paper logs or self-report with " +
          "no inspection record or continuous monitoring.",
      },
      {
        claim: "Participation, satisfaction, and contract pass-through",
        authoritativeSource:
          "POS covers vs eligible-population, guest/client satisfaction surveys, " +
          "and the contract pricing structure (cost-plus/P&L/management-fee)",
        whatGoodEvidenceLooksLike:
          "Participation/capture trend by unit with guest and client satisfaction " +
          "and the contract terms that determine who keeps a saving — so a margin " +
          "claim is netted against demand risk and pass-through.",
        weakEvidenceToReject:
          "A modeled food/labor saving with no participation trend and no contract " +
          "structure stated — i.e. a saving the operator may not even keep.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Are recipes costed and kept current with price moves, and does your contract structure (cost-plus, P&L, management fee) pass food inflation through — or is the operator absorbing it unit by unit?",
      "Is production planned to a demand forecast by daypart with waste tracked, or built on fixed pars and chef intuition that overproduce to be safe?",
      "Is unit labor scheduled to forecasted covers and catering load by daypart, with the food-safety coverage floor protected, or built on a budgeted-hours template?",
      "How wide is the spread between your best- and worst-performing units on food cost, waste, participation, satisfaction, and food-safety audit score?",
      "Is participation/capture stable or eroding, and have recent price, portion, or menu-variety changes moved it — i.e. is cost-cutting costing you covers?",
      "Are food-safety steps (temperatures, HACCP, allergen, sanitation) monitored and verified continuously, or recorded on paper and checked only at inspection?",
      "How is catering/event demand forecast and produced, and how much over- or under-production swings cost and waste on large events?",
    ],
    maturitySignals: [
      "Recipes are costed and kept current, and menu engineering steers mix toward high-margin/high-popularity items.",
      "Production and ordering are planned to a demand forecast by daypart with waste actively tracked and reconciled.",
      "Labor is scheduled to forecasted covers with the food-safety coverage floor protected and schedule adherence measured.",
      "Food-safety is monitored continuously (digital HACCP/temperature) with alerting, not verified only at periodic inspection.",
      "Per-site execution variance is measured and a culinary/field coaching loop is actively compressing the worst-quartile units.",
    ],
    redFlags: [
      "Recipes are not costed or not kept current, food cost is rising, and it is unclear whether the contract passes inflation through or the operator absorbs it.",
      "Production is built on fixed pars/intuition with no waste tracking, so units overproduce and discard to avoid run-outs.",
      "Labor is cut to a budget target past the point where service speed, on-time meals, and food-safety/sanitation steps hold.",
      "Per-site execution variance is wide and unmanaged while only the estate average is reported.",
      "Food-safety relies on paper logs and self-report with variable audit scores and no continuous monitoring — a critical-violation/allergen event waiting to happen.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Foodservice-management / POS suites (Agilysys, Oracle MICROS, CrunchTime, Toast)",
        category: "POS, inventory, recipe costing, unit P&L",
        switchingCost:
          "High — the FSM/POS platform holds transactions, inventory, recipe " +
          "costing, and unit P&L fused to payment hardware and unit process; " +
          "replacement is a multi-quarter program with re-training and parallel runs.",
        renewalDynamics:
          "Per-unit/per-terminal subscription plus payment hardware; demand-" +
          "forecasting and labor add-on modules increasingly upsold at renewal; " +
          "watch payment-processing tie-ins.",
      },
      {
        vendorName: "Labor scheduling & time/attendance (HotSchedules/Fourth, UKG, Legion)",
        category: "Demand-based scheduling and time & attendance",
        switchingCost:
          "Moderate-to-high — holds the labor model, time & attendance, and labor-" +
          "law rule configuration and is fused to payroll and unit workflow; " +
          "lock-in is configuration and habit more than raw data.",
        renewalDynamics:
          "Per-employee/per-unit subscription; AI/auto-scheduling modules upsold; " +
          "favor outcome terms tied to measured adherence and labor-at-held-safety.",
      },
      {
        vendorName: "Food-safety & temperature monitoring (Zenput/Crunchtime, Jolt, ComplianceMate)",
        category: "Digital HACCP, checklists, IoT temperature monitoring",
        switchingCost:
          "Moderate — runs on digital checklists and (where deployed) connected " +
          "sensors; stickiness is the compliance audit history, configured HACCP " +
          "plans, and installed sensor hardware.",
        renewalDynamics:
          "Subscription plus sensor hardware; leverage measured audit-score " +
          "improvement and critical-violation reduction at renewal.",
      },
      {
        vendorName: "Procurement / GPO & distributors (Foodbuy, Entegra, US Foods, Sysco)",
        category: "Contract/GPO pricing and distributor ordering",
        switchingCost:
          "Moderate — GPO membership and distributor contracts carry negotiated " +
          "price files and rebates; switching distributors disrupts ordering and " +
          "item mapping, and GPO exit forfeits aggregated pricing.",
        renewalDynamics:
          "Volume-based rebates and tiered GPO pricing; the lever is committed " +
          "volume and on-contract compliance; scrutinize rebate transparency and " +
          "inflation pass-through clauses.",
      },
    ],
    switchingCosts:
      "The FSM/POS core is the hardest to switch because it carries inventory, " +
      "recipe costing, and unit P&L fused to payment hardware — effectively a " +
      "multi-quarter platform decision. The negotiable frontier is the layers " +
      "around it (scheduling, food-safety monitoring, demand/production planning) " +
      "and the procurement/GPO relationship, where switching cost is moderate and " +
      "the real lock-in is configured rules, compliance history, and committed " +
      "purchasing volume. Protect recipe/cost data and food-safety-record " +
      "portability and GPO rebate transparency to keep that frontier negotiable.",
    negotiationLevers: [
      "Outcome pricing tied to measured food-cost and food-waste reduction, labor-at-held-safety, or audit-score improvement — net of the per-site-variance and participation haircuts",
      "GPO/distributor committed-volume rebates with rebate transparency and explicit food-inflation pass-through clauses",
      "Food-safety / labor-law content currency and accuracy as a contracted SLA, not a best-effort add-on",
      "Recipe-cost, unit-P&L, and food-safety-record data portability to prevent platform lock-in",
      "Pilot-to-scale gating with estate-wide (not pilot-unit) execution proof per region before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cost_metric: [
        "FSM/POS food and labor cost over revenue by unit/daypart",
        "recipe-costed plate cost and covers/participation basis",
        "the unit-level distribution, not just the estate average",
      ],
      waste_claim: [
        "measured waste tracking split by source (overproduction/spoilage/plate)",
        "production forecast-vs-actual basis, not an assumed percentage",
      ],
      food_safety_claim: [
        "health-inspection and internal/third-party audit records by unit",
        "continuous temperature/HACCP evidence, not paper self-report",
      ],
      execution_claim: [
        "unit-level distribution (best-to-worst quartile), not the estate average",
        "normalized for site segment/size",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (per-site variance, participation risk, contract pass-through, food-safety floor)",
        "contract structure (who keeps the saving)",
      ],
    },
    citationStandard:
      "Quantitative foodservice claims cite the FSM/POS/inventory/safety source " +
      "and the unit/daypart grain, and cost claims cite recipe-costed plate cost " +
      "and the covers/participation basis with quality and the food-safety floor " +
      "held — never an estate-average presented as if it held at every unit. " +
      "Food-safety claims cite inspection/audit records and continuous monitoring, " +
      "never paper self-report. Execution claims cite the best-to-worst-quartile " +
      "spread, not just the average. Value projections cite a baseline, a labelled " +
      "planning range, the haircut factors applied (per-site variance, " +
      "participation risk, contract pass-through, food-safety floor), and the " +
      "contract structure that determines who keeps the saving — never a single " +
      "asserted savings or ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no unit-level distribution — frame cost/waste value as an industry planning range with an explicit per-site-variance haircut, not their measured number.",
      "Only pilot-unit or estate-average results exist — flag that estate-wide value is gated by per-site execution variance until the worst quartile is proven.",
      "Participation/capture trend is unknown — caveat that cost-cutting may erode covers and that a modeled saving must be netted against demand risk.",
      "Contract structure (cost-plus/P&L/management-fee) and inflation pass-through are unconfirmed — flag that who keeps a food-cost saving depends on the contract.",
      "Food-safety rests on paper logs or self-report — flag that without continuous monitoring/inspection evidence the safety floor and audit claims are estimates, and never trade safety for cost.",
    ],
    inferenceLanguage: [
      "Across contract foodservice at this segment, food cost typically runs...",
      "Without your unit-level distribution, the industry pattern suggests production-to-demand cuts overproduction waste by roughly... before the per-site-variance haircut...",
      "Peer estates commonly see a wide best-to-worst-quartile spread of around...",
      "Treating this as a planning range rather than your measured figure...",
      "Depending on whether the contract is cost-plus, P&L, or management-fee, the operator-retained share of this saving is typically...",
    ],
    flagWithoutEvidence: [
      "A specific dollar food/labor saving or ROI for this tenant",
      "This tenant's actual food cost %, waste %, participation, per-site variance, or food-safety audit performance",
      "A food-safety compliance claim resting on paper self-report rather than inspection/monitoring evidence",
      "A pilot-unit result presented as an estate-wide outcome",
      "A food-cost saving claimed as operator margin without the contract structure that determines who keeps it",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "unit margin value bridge — food/labor/waste savings to realized value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current unit margin to food-cost, waste, and labor savings to net realized value, showing the per-site-variance, participation, and contract-pass-through haircuts.",
    },
    {
      questionPattern:
        "per-site execution variance — best vs worst quartile across the estate",
      exhibitKind: "chart",
      chartKind: "range-bar",
      chartBuilder: "rangeBar",
      note: "Show the best-to-worst-quartile spread by unit on food cost, waste, participation, and audit score to make the worst-quartile tail (not the average) the decision object.",
    },
    {
      questionPattern:
        "cost composition — where unit cost concentrates (food / labor / other)",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack unit cost by food, labor, waste, and other controllable lines against revenue to show the two dominant margin levers and the worst units.",
    },
    {
      questionPattern: "foodservice operations KPI scorecard",
      exhibitKind: "table",
      note: "Food cost %, labor cost %, waste %, participation, menu-mix margin, inventory turns, audit score, on-time service, covers per labor hour, catering revenue, satisfaction vs planning ranges and comparable units.",
    },
    {
      questionPattern:
        "food cost / participation / waste trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend food cost %, participation, and waste by unit/daypart against the planning ranges to show whether cost-cutting is tracking with (or against) demand.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Recipes are costed and kept current and production is planned to forecasted demand, so the two dominant lines (food and labor) are actually controlled rather than estimated",
      "A culinary/field coaching loop actively compresses per-site execution variance, so estate value follows the pilot unit",
      "Cost moves are watched against participation/capture, so the program protects the demand line instead of saving its way into falling covers",
      "The food-safety floor is protected as a hard constraint and the contract structure is understood, so savings are real, retained, and never traded against safety",
    ],
    failureDrivers: [
      "Pilot-unit results rolled out as estate-wide value while the worst-quartile units keep failing the same menu/labor model",
      "Cost-cutting (price up, portion down, variety cut) that erodes participation, so 'savings' are swamped by lost covers",
      "Labor or process cut below the food-safety coverage floor, risking a critical violation, allergen event, or foodborne-illness incident that closes a unit and voids the contract",
      "A modeled food-cost saving claimed as operator margin when the contract structure means the client, not the operator, keeps it",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Recipe costing, menu engineering, and demand-based scheduling adopt first " +
      "because the pain (margin pressure, idle/short labor) is visible and the " +
      "tools are mature. Demand forecasting/production planning and inventory/" +
      "procurement optimization follow on POS and inventory data. Continuous " +
      "food-safety monitoring and guest-experience personalization are later, " +
      "gated on sensor rollout and mobile-ordering/loyalty presence. Adoption " +
      "hinges on chef/unit-manager trust and the field coaching loop — the " +
      "forecasting and scheduling tools create value only when district " +
      "leadership runs them and compresses per-site variance, not on model " +
      "quality alone.",
    roiClarity: "medium",
    roiClarityBasis:
      "Foodservice ROI is only moderately firm because the prize is large and " +
      "measurable in food cost, waste, and labor, but four factors blur it: per-" +
      "site execution variance that makes pilot results overstate estate value; " +
      "participation/capture risk that can swamp a cost saving with lost covers; " +
      "contract structure (cost-plus vs P&L vs management fee) and food-inflation " +
      "pass-through that determine who actually keeps a saving; and the food-" +
      "safety floor and a moving baseline (food inflation, wage market, " +
      "population) that constrain and obscure attribution. Because cost-cutting " +
      "can boomerang into lost participation or a safety breach, ROI must be " +
      "quoted with explicit per-site-variance, participation, and pass-through " +
      "haircuts and a held-safety constraint, not as a clean modeled number.",
  },

  regulatoryFrame: {
    name: "Food safety, allergen/nutrition, and labor law",
    relevance:
      "The dominant regulatory frame for foodservice operations: food-safety " +
      "regulation (FDA Food Code, HACCP, local health codes) is the hard, non-" +
      "negotiable floor where a violation can close a unit and void a contract; " +
      "allergen-disclosure and menu-labeling rules are a direct guest-safety and " +
      "legal requirement that constrains recipe substitution and personalization; " +
      "segment-specific nutrition/therapeutic-diet and procurement rules " +
      "(healthcare, K-12/USDA, campus) govern regulated dining; and wage & hour " +
      "and predictive-scheduling labor law constrains how labor can be forecast, " +
      "scheduled, and changed. All of these are hard constraints on cost and " +
      "labor optimization, not preferences (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (morgan)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
