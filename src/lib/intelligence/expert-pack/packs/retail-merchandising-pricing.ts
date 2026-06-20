// Consilium expert — Retail Merchandising & Pricing (industry-function).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An industry-function
// expert for the retail merchant organization: assortment planning, pricing &
// markdown optimization, promotions, inventory/allocation, demand forecasting at
// SKU/store, and personalization. Product-aware (merchandising/planning suites,
// price-optimization engines, demand-planning), not product-locked.
//
// CORE HONESTY — THIN MARGINS, GATED VALUE. Retail net margins are thin (often
// low single digits), so pricing/markdown errors are expensive in both
// directions: leave money on the table on full price, or destroy margin with
// over-deep markdowns. The whole prize of pricing science is REAL but it is
// GATED by two hard preconditions that this expert refuses to wave away:
//   (1) Data granularity — clean SKU/store-level demand, elasticity, inventory,
//       and competitor-price signal. Without it, "optimization" is a guess with
//       a dashboard.
//   (2) Execution discipline — a recommended price/markdown/allocation only
//       creates value if it actually reaches the shelf and the label, and stays
//       there. The recommend-to-realize gap is where most of the modeled value
//       evaporates.
// Every value claim here is hedged against these gates.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const retailMerchandisingExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.retail.merchandising-pricing",
    expertName: "Retail Merchandising & Pricing Expert",
    kind: "industry-function",
    industry: "retail",
    functionKey: "merchandising-pricing",
    scopeNote:
      "The retail merchant organization: assortment planning (range, depth, " +
      "localization), pricing & markdown optimization (regular price, " +
      "promotional price, clearance/markdown cadence), promotions design and " +
      "measurement, inventory and allocation/replenishment, demand forecasting " +
      "at SKU/store granularity, and personalization/offers. Spans the " +
      "buy-plan-price-promote-allocate loop. Excludes supply-chain logistics " +
      "execution, store operations/labor, and corporate FP&A (separate experts); " +
      "this expert owns the merchandising P&L levers — sales, margin, and " +
      "inventory productivity.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "gross_margin_pct",
        name: "Gross margin %",
        definition:
          "Gross profit (net sales less cost of goods sold, net of markdowns " +
          "and shrink) as a percentage of net sales.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 45,
          basis:
            "Sector-dependent merchant gross-margin ranges; grocery runs far " +
            "lower (20-30%), apparel/specialty higher (45%+), operator experience",
          label: "planning-range",
        },
        dataSource:
          "Merchandising/finance system: net sales, COGS, markdowns and shrink " +
          "by department/category",
        whyItMatters:
          "The headline merchant P&L lever. Because retail net margin is thin, a " +
          "1-2pt swing in gross margin is the difference between a category that " +
          "earns its space and one that destroys it — pricing and markdown " +
          "discipline live or die here.",
      },
      {
        key: "markdown_rate",
        name: "Markdown rate",
        definition:
          "Total markdown dollars (permanent + promotional + clearance) as a " +
          "percentage of gross sales at original/regular price.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Apparel/seasonal run high (30%+), basics/replenishment low; " +
            "category and seasonality dependent",
          label: "planning-range",
        },
        dataSource:
          "Pricing/POS system: markdown transactions by type against original " +
          "retail",
        whyItMatters:
          "The most controllable margin leak. Over-deep or too-early markdowns " +
          "give away margin that disciplined timing and depth would keep; this is " +
          "the single biggest lever markdown-optimization targets.",
      },
      {
        key: "sell_through_rate",
        name: "Sell-through rate",
        definition:
          "Units sold as a percentage of units received (or available) over a " +
          "defined period or season.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 80,
          basis:
            "Season-end sell-through targets vary by category; too low = excess " +
            "inventory, too high = lost sales from under-buy",
          label: "planning-range",
        },
        dataSource: "POS units sold against receipts/on-hand by SKU/store",
        whyItMatters:
          "The balance signal for buy depth and pricing. Low sell-through means " +
          "markdown exposure ahead; very high sell-through means demand was left " +
          "unmet — both are buy/price errors that show up here first.",
      },
      {
        key: "full_price_sell_through",
        name: "Full-price sell-through %",
        definition:
          "Share of units sold at full/regular price before any markdown, as a " +
          "percentage of total units sold.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 75,
          basis:
            "Category-dependent; fashion/seasonal lower, basics higher; the " +
            "complement of clearance dependence",
          label: "planning-range",
        },
        dataSource: "POS: units sold at full price vs marked-down price by SKU",
        whyItMatters:
          "The cleanest measure of demand-led assortment and pricing health. " +
          "High full-price sell-through means the buy and price matched real " +
          "demand; falling full-price rate is the early warning that markdowns " +
          "are doing the selling.",
      },
      {
        key: "gmroi",
        name: "Gross margin return on inventory investment (GMROI)",
        definition:
          "Gross margin dollars generated per dollar of average inventory " +
          "investment at cost (gross margin $ / average inventory at cost).",
        unit: "ratio",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 4,
          basis:
            "Merchant productivity benchmarks; >3 generally healthy, varies by " +
            "category turn and margin profile",
          label: "planning-range",
        },
        dataSource:
          "Gross margin dollars over average inventory at cost from the " +
          "merchandising/inventory ledger",
        whyItMatters:
          "The capital-efficiency unit that ties margin to inventory. It exposes " +
          "the trap of high margin on slow-moving stock; the merchant metric the " +
          "CFO trusts because it blends profit and working capital.",
      },
      {
        key: "inventory_turns",
        name: "Inventory turns",
        definition:
          "Cost of goods sold divided by average inventory at cost over a " +
          "trailing twelve-month period.",
        unit: "turns / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 8,
          basis:
            "Grocery/fast-moving turn far higher, specialty/seasonal lower; " +
            "highly category-dependent",
          label: "planning-range",
        },
        dataSource: "COGS over average inventory at cost from the inventory ledger",
        whyItMatters:
          "The velocity side of inventory productivity. Slow turns trap working " +
          "capital and force markdowns; allocation and forecasting improvements " +
          "show up as turns before they show up as margin.",
      },
      {
        key: "price_realization_pct",
        name: "Price realization %",
        definition:
          "Actual realized average selling price as a percentage of the " +
          "intended/list regular price across transactions.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Gap to 100% reflects promo/markdown leakage and unmanaged " +
            "discounting; category and channel dependent",
          label: "planning-range",
        },
        dataSource:
          "POS realized price vs list/regular price, aggregated by SKU/channel",
        whyItMatters:
          "Measures how much of intended price actually survives to the " +
          "transaction. Low realization signals unmanaged discounting and " +
          "promo leakage — the gap between the price you set and the price you get.",
      },
      {
        key: "promo_roi",
        name: "Promotion ROI / incremental lift",
        definition:
          "Incremental gross margin generated by a promotion (net of " +
          "cannibalization, pull-forward, and the cost of the discount) relative " +
          "to the promotional investment.",
        unit: "ratio",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1,
          high: 2.5,
          basis:
            "Incremental-margin-per-promo-dollar ranges; a large share of promos " +
            "are margin-dilutive once cannibalization is netted out",
          label: "planning-range",
        },
        dataSource:
          "Promo measurement: incremental units/margin vs a modeled baseline, " +
          "net of cannibalization",
        whyItMatters:
          "The honest test of promotional spend. Many promotions sell volume " +
          "that would have sold anyway (cannibalization/pull-forward) and " +
          "destroy margin; ROI net of baseline separates real lift from " +
          "self-funded discounting.",
      },
      {
        key: "forecast_accuracy",
        name: "Demand forecast accuracy",
        definition:
          "One minus the weighted absolute percentage error (WAPE/MAPE) of the " +
          "SKU/store demand forecast against actual sales over the horizon.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "Accuracy collapses at SKU/store granularity and for new/seasonal " +
            "items; aggregate accuracy is much higher than item-store level",
          label: "planning-range",
        },
        dataSource:
          "Forecast vs actual sales at the SKU/store grain in the " +
          "demand-planning system",
        whyItMatters:
          "The upstream driver of buy depth, allocation, and markdown exposure. " +
          "Forecast error at the SKU/store grain is where assortment and pricing " +
          "decisions go wrong before anyone sees the margin impact — and it is " +
          "honestly hard at that granularity.",
      },
      {
        key: "in_stock_rate",
        name: "In-stock / availability rate",
        definition:
          "Share of SKU/store combinations that are in stock and shoppable " +
          "during their selling window.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 92,
          high: 98,
          basis:
            "On-shelf availability targets; below ~95% lost-sales leakage grows " +
            "sharply, varies by category velocity",
          label: "planning-range",
        },
        dataSource:
          "Inventory position vs planogram/assortment by SKU/store; on-shelf " +
          "availability signal",
        whyItMatters:
          "Out-of-stocks are silent lost sales and substitution/switching risk. " +
          "Availability is the execution check on allocation and replenishment — " +
          "a perfect price on an empty shelf realizes nothing.",
      },
      {
        key: "basket_size",
        name: "Average basket size / units per transaction",
        definition:
          "Average revenue (or units) per transaction across the period and " +
          "channel.",
        unit: "USD / transaction",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Highly format-dependent (convenience vs big-box vs specialty); " +
            "tracked as a trend and against format peers, not an absolute",
          label: "planning-range",
        },
        dataSource:
          "POS transaction-level revenue/units per basket by channel/format",
        whyItMatters:
          "The cross-sell/personalization lever and a measure of assortment " +
          "coherence. Personalized offers and affinity-driven assortment lift " +
          "basket without discounting — the margin-friendly path to comp growth.",
      },
      {
        key: "shrink_rate",
        name: "Inventory shrink rate",
        definition:
          "Inventory loss (theft, damage, administrative/recording error) as a " +
          "percentage of net sales.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 3,
          basis:
            "Retail shrink ranges; concentrated categories run higher, " +
            "varies by format and theft exposure",
          label: "planning-range",
        },
        dataSource:
          "Physical inventory counts vs book inventory; shrink accruals in the " +
          "merchandising ledger",
        whyItMatters:
          "Direct margin loss and a corrupter of inventory data — shrink that is " +
          "not recorded poisons the SKU/store on-hand that forecasting and " +
          "allocation depend on, so it gates pricing-science accuracy too.",
      },
    ],

    painThemes: [
      {
        key: "blunt_chainwide_pricing",
        name: "Blunt chain-wide / cost-plus pricing",
        description:
          "Prices and markdowns are set chain-wide on cost-plus or competitor- " +
          "follow rules with no elasticity or local-demand signal, so the " +
          "retailer leaves full-price margin on the table on inelastic items and " +
          "over-discounts elastic ones.",
        detectionSignal:
          "Uniform markdown cadence across stores/regions, no price-elasticity " +
          "model in use, price changes driven by competitor matching or " +
          "calendar rather than demand.",
        diagnosticQuestion:
          "Do you price and mark down by elasticity and local demand at the " +
          "SKU/store level, or apply chain-wide cost-plus / competitor-follow rules?",
      },
      {
        key: "late_deep_markdowns",
        name: "Late, deep, reactive markdowns",
        description:
          "Markdowns are triggered late by aging inventory and taken deep to " +
          "clear, rather than optimized for the timing/depth that maximizes " +
          "season-total margin — destroying margin that earlier shallower cuts " +
          "would have preserved.",
        detectionSignal:
          "High end-of-season clearance depth, markdown rate above plan, falling " +
          "full-price sell-through, inventory aging past target before any action.",
        diagnosticQuestion:
          "Are markdowns optimized for season-total margin (timing and depth), " +
          "or taken late and deep once inventory is already aged?",
      },
      {
        key: "margin_dilutive_promotions",
        name: "Margin-dilutive, un-measured promotions",
        description:
          "Promotions are planned on a calendar and judged on sales lift " +
          "without netting out cannibalization and pull-forward, so a large " +
          "share are self-funded discounts that move volume that would have sold " +
          "anyway at full price.",
        detectionSignal:
          "Promo performance reported as gross lift not incremental margin, no " +
          "control/baseline measurement, repeat promotions on the same items, " +
          "price realization eroding.",
        diagnosticQuestion:
          "Do you measure promotion ROI as incremental margin net of " +
          "cannibalization against a baseline, or as gross sales lift?",
      },
      {
        key: "broken_assortment_localization",
        name: "Broken assortment localization",
        description:
          "Assortments are planned centrally and pushed uniformly, ignoring " +
          "store-cluster demand differences, so high-demand stores stock out " +
          "while low-demand stores hold inventory that ends up marked down.",
        detectionSignal:
          "Same range/depth across dissimilar stores, simultaneous stockouts " +
          "and clearance on the same SKU in different stores, no store " +
          "clustering in the plan.",
        diagnosticQuestion:
          "Is assortment range and depth localized to store-cluster demand, or " +
          "pushed uniformly from a central plan?",
      },
      {
        key: "sku_store_forecast_blindspot",
        name: "SKU/store forecast blind spot (new & seasonal items)",
        description:
          "Demand forecasting works at aggregate level but collapses at the " +
          "SKU/store grain and for new/seasonal items with no history, so buy " +
          "depth and allocation for exactly the highest-risk items are guesses.",
        detectionSignal:
          "Forecast accuracy acceptable in aggregate but poor at item-store " +
          "level, new-item buys sized on judgment alone, large seasonal " +
          "markdown exposure.",
        diagnosticQuestion:
          "What is your forecast accuracy at the SKU/store grain, and how do you " +
          "forecast new and seasonal items with no sales history?",
      },
      {
        key: "recommend_to_realize_gap",
        name: "Recommend-to-realize execution gap",
        description:
          "Optimization engines produce good price/markdown/allocation " +
          "recommendations, but weak execution discipline (manual overrides, " +
          "label/tag lag, store non-compliance) means a large share never reach " +
          "the shelf — so modeled value never lands.",
        detectionSignal:
          "Large gap between recommended and executed prices, high override " +
          "rate, lag between price decision and shelf label, store-level " +
          "compliance not measured.",
        diagnosticQuestion:
          "What share of optimization recommendations actually reach the shelf " +
          "and the label, and do you measure recommend-to-realize compliance?",
      },
      {
        key: "dirty_inventory_signal",
        name: "Dirty inventory & demand signal",
        description:
          "On-hand inventory, shrink, and true demand (vs censored/stockout- " +
          "suppressed sales) are inaccurate, so every downstream model — " +
          "forecast, allocation, price — is fed corrupted inputs and produces " +
          "confidently wrong recommendations.",
        detectionSignal:
          "Frequent negative on-hands, large cycle-count adjustments, sales used " +
          "as demand without stockout correction, unrecorded shrink.",
        diagnosticQuestion:
          "How accurate is your SKU/store on-hand and is demand corrected for " +
          "stockouts, or do models train on censored sales as if it were demand?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "price_markdown_optimization",
        name: "Price & markdown optimization",
        valueMechanism:
          "Model SKU/store price elasticity and inventory position to recommend " +
          "regular prices and markdown timing/depth that maximize season-total " +
          "margin — keeping full-price margin on inelastic items and clearing " +
          "aged stock at the optimal cadence rather than late and deep.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "SKU/store sales and price history with elasticity-estimable variation",
          "Inventory position and season/clearance calendars",
          "Competitor price signal where price-matching matters",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Elasticity is noisy at SKU/store grain — bound recommendations and " +
            "guard against price-war spirals from competitor-follow loops",
          "Merchant must retain override for brand/competitive/legal price floors",
        ],
        metricsMoved: [
          "gross_margin_pct",
          "markdown_rate",
          "price_realization_pct",
          "full_price_sell_through",
        ],
      },
      {
        key: "demand_forecasting_ml",
        name: "ML demand forecasting at SKU/store",
        valueMechanism:
          "Forecast demand at the SKU/store/week grain — including new and " +
          "seasonal items via attribute-based and hierarchical models, and " +
          "demand corrected for stockout censoring — so buy depth, allocation, " +
          "and replenishment are sized to real local demand.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "SKU/store sales history corrected for stockout censoring",
          "Product attributes for cold-start/new-item forecasting",
          "Calendar, promo, weather, and seasonality drivers",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Accuracy degrades sharply at fine grain and for new items — surface " +
            "forecast uncertainty, do not present a point estimate as fact",
          "Censored-demand correction must be validated or models learn from " +
            "suppressed sales",
        ],
        metricsMoved: [
          "forecast_accuracy",
          "sell_through_rate",
          "in_stock_rate",
          "inventory_turns",
        ],
      },
      {
        key: "assortment_space_optimization",
        name: "Assortment & space optimization with localization",
        valueMechanism:
          "Cluster stores by demand and recommend localized range, depth, and " +
          "space allocation — adding productive SKUs where demand exists, " +
          "rationalizing the unproductive tail, and matching planogram space to " +
          "expected unit velocity.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Store-level sales, demographics, and clustering features",
          "SKU attributes and item productivity (GMROI, turns)",
          "Planogram/space and shelf-capacity constraints",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Vendor/category-management relationships and brand-block rules " +
            "constrain pure-math assortment — keep merchant judgment in the loop",
          "Tail rationalization can break baskets/affinities — test before cut",
        ],
        metricsMoved: [
          "gmroi",
          "sell_through_rate",
          "basket_size",
        ],
      },
      {
        key: "promo_optimization",
        name: "Promotion optimization & incrementality measurement",
        valueMechanism:
          "Plan and measure promotions on modeled incremental margin net of " +
          "cannibalization and pull-forward — recommending which items, depths, " +
          "and mechanics actually drive profitable lift and cutting the " +
          "self-funded discounts that destroy margin.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Promo history with baseline/control sales for incrementality",
          "Cross-item affinity and cannibalization signal",
          "Margin and funding (vendor allowance) data by promo",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Incrementality requires a credible baseline — without control groups " +
            "or matched markets, lift is an estimate, flag it as such",
          "Vendor-funded promo terms may override pure margin optimization",
        ],
        metricsMoved: [
          "promo_roi",
          "gross_margin_pct",
          "price_realization_pct",
        ],
      },
      {
        key: "personalized_offers",
        name: "Personalization & targeted offers",
        valueMechanism:
          "Use customer purchase history and affinities to target offers, " +
          "recommendations, and content to the individual — lifting basket and " +
          "loyalty with margin-aware, targeted discounts instead of " +
          "broad-brush markdowns that give margin to everyone.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Identified/loyalty customer transaction history",
          "Product affinity and recommendation features",
          "Consent and channel/contactability data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Personalized pricing/offers carry fairness, discrimination, and " +
            "privacy/consent risk — govern segments and disclosures",
          "Margin-aware targeting must avoid training customers to wait for offers",
        ],
        metricsMoved: [
          "basket_size",
          "gross_margin_pct",
          "full_price_sell_through",
        ],
      },
      {
        key: "allocation_replenishment_ai",
        name: "AI allocation & replenishment",
        valueMechanism:
          "Drive initial allocation and ongoing replenishment from SKU/store " +
          "demand forecasts and live inventory position — putting units where " +
          "demand is, lifting on-shelf availability, and reducing the " +
          "simultaneous stockout-and-clearance imbalance.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "SKU/store demand forecast and current inventory position",
          "Lead times, case packs, and presentation minimums",
          "Store cluster and capacity constraints",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Garbage-in from dirty on-hand cascades into bad allocation — gate on " +
            "inventory-accuracy thresholds",
          "Case-pack and presentation minimums constrain the math — encode them",
        ],
        metricsMoved: [
          "in_stock_rate",
          "inventory_turns",
          "sell_through_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "price_optimization_engine",
        name: "Price & markdown optimization engine",
        description:
          "An elasticity-driven engine that recommends regular prices and " +
          "markdown timing/depth at SKU/store, bounded by merchant guardrails " +
          "(floors, brand, competitor rules), feeding the price-execution " +
          "pipeline to the shelf and label.",
        boundary:
          "Owns price/markdown recommendation and the recommend-to-realize " +
          "tracking; does not own brand/competitive pricing strategy or legal " +
          "price floors, which set its guardrails.",
        humanAccountabilityPoint: "VP Pricing / Pricing Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "demand_planning_foundation",
        name: "SKU/store demand-planning foundation",
        description:
          "A demand-planning platform that produces stockout-corrected, " +
          "attribute-aware forecasts at the SKU/store grain with explicit " +
          "uncertainty — the shared signal that buy, allocation, replenishment, " +
          "and pricing all depend on.",
        boundary:
          "Owns the demand signal and its accuracy; does not make the buy or " +
          "allocation decision — it feeds them. Depends on inventory-accuracy " +
          "and clean demand inputs upstream.",
        humanAccountabilityPoint: "VP Planning / Demand Planning Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "assortment_planning_workbench",
        name: "Localized assortment-planning workbench",
        description:
          "A merchant workbench that clusters stores, recommends localized " +
          "range/depth and space, and rationalizes the unproductive tail — with " +
          "merchant judgment and vendor/category constraints in the loop.",
        boundary:
          "Owns assortment range/depth/space recommendation; does not own " +
          "vendor negotiation or category strategy, which constrain it.",
        humanAccountabilityPoint: "Divisional Merchandise Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "price_execution_pipeline",
        name: "Price/promo execution & compliance pipeline",
        description:
          "The pipeline that turns approved price/markdown/promo decisions into " +
          "shelf labels, e-commerce prices, and POS rules, and measures " +
          "recommend-to-realize compliance — closing the gap where modeled value " +
          "otherwise evaporates.",
        boundary:
          "Owns decision-to-shelf execution and compliance measurement; does " +
          "not set the prices — it realizes the ones the engine and merchant " +
          "approve.",
        humanAccountabilityPoint: "Pricing Operations / Store Execution Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Merchandising value compounds around the buy-plan-price-promote- " +
        "allocate loop, but it is GATED at two points that this expert refuses " +
        "to assume away. The forecast/demand signal at SKU/store grain feeds " +
        "buy depth and allocation; pricing and markdown optimization protect " +
        "full-price margin and clear aged stock at the right cadence; promotion " +
        "and personalization drive profitable lift instead of self-funded " +
        "discounting. Two preconditions gate the whole prize: data granularity " +
        "(clean SKU/store demand, inventory, elasticity, competitor signal) and " +
        "execution discipline (the recommend-to-realize gap from engine to " +
        "shelf/label). Because retail net margins are thin, the value is real " +
        "and the errors are costly in both directions — under-priced full-price " +
        "margin given away, and over-deep markdowns destroying it. Forward value " +
        "must therefore be discounted for data readiness, the realization gap, " +
        "and competitor/market response, never quoted as a clean modeled number.",
      dominantHaircutFactors: [
        {
          factor: "Recommend-to-realize execution gap",
          rationale:
            "A large share of modeled price/markdown/allocation value never " +
            "reaches the shelf — manual overrides, label lag, store " +
            "non-compliance — so forward value must be discounted by the " +
            "realization gap, not the engine's headline number.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed gap between modeled and realized pricing/markdown value " +
              "where execution compliance was not measured or enforced",
            label: "planning-range",
          },
        },
        {
          factor: "Data granularity & inventory accuracy",
          rationale:
            "Optimization is only as good as clean SKU/store demand, on-hand, " +
            "elasticity, and competitor signal; dirty inventory and censored " +
            "demand cap realizable accuracy and value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Implementation experience where poor inventory accuracy and " +
              "thin demand signal throttled forecast and price-optimization value",
            label: "planning-range",
          },
        },
        {
          factor: "Competitor & market response",
          rationale:
            "Competitors react to price moves and demand shifts (weather, " +
            "trends, economy), so modeled elasticity-based gains erode as the " +
            "market responds and must be discounted for it.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Observed erosion of price-optimization gains as competitors " +
              "react and demand conditions shift",
            label: "planning-range",
          },
        },
        {
          factor: "Cannibalization & pull-forward in promo value",
          rationale:
            "Promotional and personalization 'lift' includes sales that would " +
            "have happened anyway; gross lift must be netted to incremental " +
            "margin or value is overstated.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Share of gross promo lift that is cannibalization/pull-forward " +
              "rather than true incremental margin",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Markdown reduction (margin recovery)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative markdown-rate reduction from markdown " +
              "optimization, after realization haircut",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in markdown_rate",
        },
        {
          lever: "Gross-margin uplift from price optimization",
          range: {
            low: 0.005,
            high: 0.03,
            basis:
              "Margin-rate points gained from elasticity-based regular-price " +
              "optimization on inelastic items, net of competitor response",
            label: "planning-range",
          },
          measuredAs:
            "Absolute increase in gross_margin_pct (margin points)",
        },
        {
          lever: "Inventory reduction from forecast/allocation",
          range: {
            low: 0.05,
            high: 0.15,
            basis:
              "Relative average-inventory reduction from improved SKU/store " +
              "forecasting and allocation at equal or better availability",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in average inventory at cost (turns uplift)",
        },
        {
          lever: "Promo margin recovery (cut dilutive promos)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Share of promotional spend redeployable once incrementality " +
              "measurement removes margin-dilutive promotions",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in margin-dilutive promotional spend",
        },
      ],
      timeToValueBand:
        "Markdown optimization: 1-2 seasons (2-3 quarters) once price history " +
        "is usable. Demand forecasting/allocation: 2-4 quarters including data " +
        "remediation. Regular-price optimization: 2-3 quarters with elasticity " +
        "calibration. Assortment localization and personalization: 3-6 quarters, " +
        "gated on store clustering and customer data. Realization always lags " +
        "the model — execution compliance is the longest pole.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Merchandising / merchandise financial planning",
          role:
            "System of record for the merchandise plan, open-to-buy, " +
            "assortment, and item/price master across the merchant org.",
          examples: [
            "Oracle Retail Merchandising (RMS) & Planning",
            "SAP Retail / CAR",
            "Blue Yonder Merchandise Planning",
            "o9 / Anaplan merchandise planning",
          ],
        },
        {
          name: "Price & markdown optimization",
          role:
            "Computes elasticity-based regular, promotional, and markdown " +
            "prices and the markdown cadence.",
          examples: [
            "Revionics",
            "Blue Yonder Pricing & Markdown",
            "Oracle Retail Offer Optimization",
            "dunnhumby / Eversight",
          ],
        },
        {
          name: "Demand planning / forecasting",
          role:
            "Produces SKU/store demand forecasts and replenishment signals.",
          examples: [
            "Blue Yonder Demand",
            "o9",
            "RELEX",
            "SAS / ToolsGroup",
          ],
        },
        {
          name: "POS / order management",
          role:
            "Captures transactions, realized prices, units, and baskets across " +
            "channels — the demand and price-realization truth source.",
          examples: [
            "NCR / Toshiba POS",
            "Aptos",
            "Manhattan / commerce platforms",
          ],
        },
        {
          name: "Customer data / personalization",
          role:
            "Loyalty, identity, and affinity data for targeted offers and " +
            "personalized recommendations.",
          examples: [
            "dunnhumby",
            "CDP (Segment / Adobe / Salesforce)",
            "personalization engines",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Merchandising Officer / GMM",
          accountability:
            "End-to-end merchandise sales, margin, and inventory productivity " +
            "across the category portfolio.",
        },
        {
          title: "Divisional Merchandise Manager / Buyer",
          accountability:
            "Assortment, buy depth, vendor relationships, and category margin " +
            "for a division.",
        },
        {
          title: "VP Pricing / Pricing Director",
          accountability:
            "Regular price, promotional price, and markdown strategy and the " +
            "realized price outcome.",
        },
        {
          title: "VP Planning / Demand Planning Director",
          accountability:
            "Merchandise financial plan, demand forecast accuracy, and " +
            "allocation/replenishment.",
        },
        {
          title: "Inventory / Allocation Manager",
          accountability:
            "Store allocation, replenishment, on-shelf availability, and " +
            "inventory accuracy.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Pricing & advertising law (FTC / unfair pricing, reference-price rules)",
          relevance:
            "Markdown and 'was/now' reference pricing, comparative claims, and " +
            "advertised-price accuracy are regulated — pricing automation must " +
            "respect reference-price and deceptive-pricing rules.",
        },
        {
          name: "Price discrimination & fairness (personalized pricing scrutiny)",
          relevance:
            "Personalized prices/offers attract fairness and discrimination " +
            "scrutiny; segment design and disclosures must avoid protected-class " +
            "or unfair-pricing exposure.",
        },
        {
          name: "Consumer data privacy (GDPR / CCPA / loyalty consent)",
          relevance:
            "Personalization and targeted offers use identified customer data, " +
            "triggering consent, opt-out, and data-use obligations.",
        },
        {
          name: "Unit-pricing & price-accuracy regulations",
          relevance:
            "Shelf-label accuracy, unit-pricing display, and scanner-price " +
            "integrity are regulated at point of sale — the execution layer must " +
            "keep shelf and POS price in sync.",
        },
      ],
      canonicalTerms: [
        {
          term: "GMROI",
          definition:
            "Gross Margin Return on Inventory Investment — gross margin dollars " +
            "per dollar of average inventory at cost; the merchant productivity unit.",
        },
        {
          term: "Sell-through",
          definition:
            "Units sold as a share of units received/available over a period or " +
            "season; the buy-depth-vs-demand balance signal.",
        },
        {
          term: "Markdown cadence",
          definition:
            "The timing and depth schedule of price reductions across a season " +
            "to maximize total margin while clearing inventory.",
        },
        {
          term: "Open-to-buy (OTB)",
          definition:
            "The budgeted inventory dollars a merchant may still commit for a " +
            "period given the plan and on-hand/on-order.",
        },
        {
          term: "Price elasticity",
          definition:
            "The responsiveness of unit demand to a change in price; the core " +
            "input to price and markdown optimization.",
        },
        {
          term: "Cannibalization / halo",
          definition:
            "Sales a promotion or item steals from (cannibalization) or lifts " +
            "for (halo) other items — netted out to measure true incrementality.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Markdown rate and margin leakage",
        authoritativeSource:
          "Pricing/POS markdown transactions by type against original retail, " +
          "by category and season",
        whatGoodEvidenceLooksLike:
          "Markdown dollars split permanent/promo/clearance against original " +
          "retail, with full-price sell-through and end-of-season clearance " +
          "depth by category.",
        weakEvidenceToReject:
          "A single chain-wide markdown percentage with no category, type, or " +
          "season breakdown.",
      },
      {
        claim: "Demand forecast accuracy at SKU/store",
        authoritativeSource:
          "Forecast vs actual at the SKU/store/week grain in the demand-planning " +
          "system",
        whatGoodEvidenceLooksLike:
          "WAPE/MAPE at the item-store grain (not just aggregate), separated for " +
          "new/seasonal items and corrected for stockout censoring.",
        weakEvidenceToReject:
          "An aggregate/total-company forecast-accuracy figure presented as if " +
          "it held at the SKU/store level.",
      },
      {
        claim: "Promotion ROI / incrementality",
        authoritativeSource:
          "Promo measurement: incremental units/margin vs a modeled baseline or " +
          "control, net of cannibalization",
        whatGoodEvidenceLooksLike:
          "Incremental margin per promo dollar against a credible baseline/control " +
          "with cannibalization and pull-forward netted out.",
        weakEvidenceToReject:
          "Gross sales lift during the promo window with no baseline, presented " +
          "as promotion ROI.",
      },
      {
        claim: "Price realization / recommend-to-realize",
        authoritativeSource:
          "POS realized price vs intended/approved price, plus execution-" +
          "compliance logs from the price-execution pipeline",
        whatGoodEvidenceLooksLike:
          "Realized vs recommended price by SKU/store with the share of " +
          "recommendations that reached the shelf/label and the override rate.",
        weakEvidenceToReject:
          "An engine's modeled-value claim with no measurement of what actually " +
          "reached the shelf.",
      },
      {
        claim: "Inventory productivity (GMROI / turns)",
        authoritativeSource:
          "Gross margin dollars and average inventory at cost from the " +
          "merchandising/inventory ledger, with inventory-accuracy basis",
        whatGoodEvidenceLooksLike:
          "GMROI and turns by category against average inventory at cost, with " +
          "evidence that on-hand is reconciled to physical counts.",
        weakEvidenceToReject:
          "A turns or GMROI figure computed on book inventory known to be " +
          "inaccurate (frequent negative on-hands, large adjustments).",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you price and mark down by elasticity and local demand at the SKU/store level, or apply chain-wide cost-plus / competitor-follow rules?",
      "What is your forecast accuracy at the SKU/store grain (not aggregate), and how do you forecast new and seasonal items with no history?",
      "What share of optimization recommendations actually reaches the shelf and label, and do you measure recommend-to-realize compliance?",
      "Do you measure promotion ROI as incremental margin net of cannibalization against a baseline, or as gross sales lift?",
      "How accurate is your SKU/store on-hand, and is demand corrected for stockouts before it feeds forecasting?",
      "Is assortment range and depth localized to store-cluster demand, or pushed uniformly from a central plan?",
      "What are your markdown rate, full-price sell-through, GMROI, and gross margin versus plan and category peers?",
    ],
    maturitySignals: [
      "Pricing and markdown are elasticity- and demand-driven at SKU/store, not chain-wide cost-plus.",
      "Forecast accuracy is measured at the item-store grain with stockout-corrected demand and a new-item method.",
      "Recommend-to-realize compliance is measured, so modeled price/markdown value actually reaches the shelf.",
      "Promotions are judged on incremental margin net of cannibalization, and dilutive promos are cut.",
    ],
    redFlags: [
      "Pricing and markdowns are chain-wide cost-plus or pure competitor-follow with no elasticity signal.",
      "Forecast accuracy is only known in aggregate while SKU/store buy and allocation depend on it.",
      "Promotion performance is reported as gross lift with no baseline, so margin-dilutive promos persist.",
      "Inventory on-hand is known to be inaccurate (negative on-hands, large adjustments) yet feeds every model unchecked.",
      "A large, unmeasured gap exists between recommended prices and what reaches the shelf and label.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Merchandising / planning suites (Oracle Retail, SAP, Blue Yonder)",
        category: "Core merchandising / merchandise financial planning",
        switchingCost:
          "Extreme — the merchandising core holds the item/price master, OTB, and assortment and is fused to enterprise process; replacement is a multi-year platform decision.",
        renewalDynamics:
          "Bundled enterprise agreements with module-based pricing; planning and AI modules increasingly upsold at renewal.",
      },
      {
        vendorName: "Price / markdown optimization vendors (Revionics, Blue Yonder, Eversight)",
        category: "Price & markdown optimization",
        switchingCost:
          "Moderate-to-high — integrates via sales/price/inventory feeds and is workflow-embedded, but the real lock-in is the trained elasticity models and rule configuration.",
        renewalDynamics:
          "Subscription or value-tier pricing; favor outcome terms tied to measured margin/markdown lift and demand model portability.",
      },
      {
        vendorName: "Demand planning / replenishment vendors (RELEX, o9, Blue Yonder, ToolsGroup)",
        category: "Demand forecasting / allocation / replenishment",
        switchingCost:
          "High — embedded in the planning and replenishment workflow with tenant-trained forecast models; re-integration and re-training make switching disruptive.",
        renewalDynamics:
          "Subscription/volume pricing; leverage realized forecast-accuracy and inventory-reduction proof at renewal.",
      },
      {
        vendorName: "Customer data / personalization (dunnhumby, CDPs, personalization engines)",
        category: "Personalization / targeted offers / spend analytics",
        switchingCost:
          "Moderate — customer data is portable in principle but affinity models and audience configurations accrete stickiness.",
        renewalDynamics:
          "Per-customer or usage pricing; AI personalization upsold as premium tiers; watch data-ownership terms.",
      },
    ],
    switchingCosts:
      "The merchandising/planning core is effectively non-switchable in isolation, so the negotiable value frontier is the best-of-breed optimization and forecasting layer around it — where switching cost is moderate-to-high and the real lock-in is tenant-trained models and rule configuration. Protect model and data portability to keep that frontier negotiable.",
    negotiationLevers: [
      "Outcome pricing tied to measured markdown reduction, margin uplift, or forecast-accuracy improvement — net of realization gap",
      "Demand-model and elasticity-model portability and data-ownership rights to prevent lock-in",
      "Audit and explainability access for pricing/forecast recommendations (regulatory and merchant trust)",
      "Bundle merchandising-native AI against best-of-breed at renewal to discipline pricing",
      "Pilot-to-scale gating with realization-proven (shelf-level) parity per category before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      margin_metric: [
        "net sales, COGS, markdowns and shrink from the merchandising/finance ledger",
        "category/season breakdown",
        "trailing-period aggregation",
      ],
      forecast_claim: [
        "forecast vs actual at the SKU/store grain (not aggregate)",
        "stockout-censoring correction basis",
        "new/seasonal-item handling",
      ],
      pricing_claim: [
        "elasticity basis or price/sales history",
        "realized vs recommended price",
        "recommend-to-realize compliance",
      ],
      promo_claim: [
        "incremental margin vs a modeled baseline/control",
        "cannibalization and pull-forward netted out",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (realization gap, data readiness, competitor response)",
      ],
    },
    citationStandard:
      "Quantitative merchandising claims cite the merchandising/POS/planning " +
      "source and the period, and pricing/forecast claims cite the SKU/store " +
      "grain and the realized-vs-recommended basis — never an aggregate figure " +
      "presented as item-store truth. Value projections cite a baseline, a " +
      "labelled planning range, and the haircut factors applied (recommend-to- " +
      "realize gap, data readiness, competitor response, cannibalization) — " +
      "never a single asserted ROI or savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no SKU/store-grain forecast-accuracy or elasticity data — frame pricing/forecast value as an industry planning range, not their measured number.",
      "Recommend-to-realize compliance is unmeasured — present modeled value with an explicit realization-gap haircut, not the engine's headline.",
      "Promo lift is quoted without a baseline/control — flag that gross lift is not incremental margin until cannibalization is netted out.",
      "Inventory on-hand accuracy is unknown — caveat that forecast/allocation value is gated by dirty-signal risk.",
      "Vendor-reported optimization outcomes are cited — mark as vendor claims pending shelf-level validation.",
    ],
    inferenceLanguage: [
      "Across retailers at this margin profile, markdown rate typically runs...",
      "Without your SKU/store-grain data, the industry pattern suggests price optimization recovers roughly... before the realization gap...",
      "Peer retailers commonly see forecast accuracy collapse at the item-store grain to around...",
      "Treating this as a planning range rather than your measured figure...",
      "Gross promo lift at this depth usually nets to materially less incremental margin once cannibalization is removed...",
    ],
    flagWithoutEvidence: [
      "A specific dollar margin or ROI for this tenant",
      "This tenant's actual markdown rate, forecast accuracy, or price elasticity",
      "A modeled optimization value claimed as realized without recommend-to-realize compliance",
      "A promotion ROI quoted as incremental without a baseline/control",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "margin / markdown breakdown — where is margin leaking by category",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack markdown and margin-leak dollars by category/type (permanent/promo/clearance) to show where the controllable leakage concentrates.",
    },
    {
      questionPattern:
        "margin recovery story — markdown/price optimization value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current margin to markdown-reduction and price-optimization uplift to net realized value, showing the realization-gap and competitor-response haircuts.",
    },
    {
      questionPattern:
        "forecast accuracy or sell-through trend over time / season",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend forecast accuracy or full-price sell-through against its planning range to show whether the demand signal and assortment are improving.",
    },
    {
      questionPattern: "merchandising KPI scorecard",
      exhibitKind: "table",
      note: "Gross margin %, markdown rate, full-price sell-through, GMROI, turns, forecast accuracy, in-stock rate vs planning ranges and category peers.",
    },
    {
      questionPattern:
        "promotion performance — incremental margin net of cannibalization",
      exhibitKind: "table",
      note: "Per promo: gross lift, baseline, cannibalization, incremental margin, promo ROI — separating real lift from self-funded discounting.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Clean SKU/store demand and inventory signal exists or is being remediated before optimization is scaled",
      "Recommend-to-realize execution is measured and enforced, so modeled price/markdown value reaches the shelf",
      "Merchants trust and adopt recommendations with the right guardrails (floors, brand, competitor rules) rather than override-by-default",
      "Promotions and personalization are judged on incremental margin net of cannibalization, not gross lift",
    ],
    failureDrivers: [
      "Optimization scaled on dirty inventory and censored demand — confidently wrong recommendations on thin margins",
      "Large unmeasured recommend-to-realize gap, so modeled value never reaches the shelf and the case discredits the program",
      "Merchant override-by-default culture starves the engine of adoption and feedback",
      "Promo and personalization 'wins' reported as gross lift, masking margin dilution until the P&L disagrees",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Markdown optimization adopts first because clearing aged inventory is " +
      "low-controversy and the margin recovery is visible. Demand forecasting " +
      "and allocation follow once inventory data is trusted. Regular-price " +
      "optimization is more contested — merchants guard pricing judgment, so it " +
      "needs guardrails and proof. Assortment localization and personalization " +
      "are last, gated on store clustering and customer data. Adoption hinges on " +
      "merchant trust and on closing the realization gap, not on model quality alone.",
    roiClarity: "medium",
    roiClarityBasis:
      "Retail merchandising ROI is only moderately firm because the prize is " +
      "real and measurable in margin/markdown/turns, but two factors blur it: " +
      "the recommend-to-realize gap (modeled value that never reaches the shelf) " +
      "and attribution against a moving baseline (competitor response, weather, " +
      "trends, cannibalization). On thin net margins the errors are costly in " +
      "both directions, so ROI must be quoted with explicit realization and " +
      "competitor-response haircuts, not as a clean modeled number.",
  },

  regulatoryFrame: {
    name: "Pricing/advertising law & consumer data privacy",
    relevance:
      "The dominant regulatory frame for merchandising & pricing: markdown/" +
      "reference ('was/now') pricing, comparative and advertised-price claims, " +
      "and scanner/shelf price accuracy are regulated, while personalized " +
      "pricing and targeted offers raise fairness/discrimination scrutiny and " +
      "consumer-data-privacy (GDPR/CCPA, loyalty consent) obligations. Pricing " +
      "automation and personalization must respect reference-price, " +
      "deceptive-pricing, unit-pricing, and data-consent rules (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
