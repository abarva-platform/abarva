// Domain Function Pack — Retail · Demand & inventory planning.
//
// Function key: `demand_inventory_planning`.
//
// This pack covers the retail demand & inventory planning function: the
// end-to-end discipline that decides how much of each item to buy, where to
// position it, and when to replenish or mark it down — so the right product
// is available at the right store and channel at the right time, without the
// working capital and waste of over-buying. It spans demand forecasting at
// the item / store / week grain, the merchandise and open-to-buy plan,
// allocation of receipts to stores, in-season replenishment, size and pack
// optimisation, new-store and new-product forecasting where there is no
// history, and the markdown and liquidation decision that clears what the
// forecast got wrong.
//
// The operating reality the pack encodes: inventory is simultaneously a
// retailer's largest current asset and its largest source of margin leakage.
// It leaks in two opposite directions at once — lost sales when an item is
// out of stock at the moment of demand, and markdown and carrying cost when an
// item is over-bought or mis-positioned. A demand & inventory plan is judged
// not on forecast accuracy alone but on the joint outcome: availability high
// enough to capture demand, inventory low enough that turns are healthy and
// excess does not have to be liquidated at a loss. The AI archetypes are the
// recurring bets against exactly that reality — demand forecasting, automated
// replenishment, allocation and store-distribution optimisation, new-store /
// new-product forecasting, inventory-position optimisation across the network,
// and markdown / liquidation timing.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const demandInventoryPlanningPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'demand_inventory_planning',
  functionLabel: 'Demand & inventory planning',
  summary:
    'Demand & inventory planning is the function that decides how much of ' +
    'each item to buy, where to position it, and when to replenish or mark ' +
    'it down — so the right product is available at the right store and ' +
    'channel at the right time, without the working capital and waste of ' +
    'over-buying. It spans demand forecasting at the item / store / week ' +
    'grain, the merchandise and open-to-buy plan, allocation of receipts to ' +
    'stores, in-season replenishment, size and pack optimisation, new-store ' +
    'and new-product forecasting where there is no history, and the markdown ' +
    'and liquidation decision. Its economics are the joint outcome of two ' +
    'opposing failure modes: lost sales when an item is out of stock at the ' +
    'moment of demand, and markdown and carrying cost when an item is over-' +
    'bought or mis-positioned. The function is judged on that joint outcome ' +
    '— availability high enough to capture demand and inventory lean enough ' +
    'that turns are healthy — not on forecast accuracy in isolation.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'forecast_accuracy_mape',
      name: 'Demand forecast accuracy (MAPE / WMAPE)',
      definition:
        'The accuracy of the demand forecast against realised sell-through, ' +
        'expressed as the mean absolute percentage error (MAPE) or the ' +
        'volume-weighted absolute percentage error (WMAPE) at the planning ' +
        'grain — typically item / store / week. WMAPE is the operator ' +
        'preference because it weights error by units and so is not ' +
        'distorted by tiny-volume long-tail items.',
      unit: '% error (WMAPE at item/store/week)',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Forecast error varies sharply with grain, demand intermittency, ' +
          'and lifecycle — a stable replenishment basic forecasts far ' +
          'tighter than a short-lifecycle fashion item or a new product; ' +
          'the band spans those cases at the item/store/week grain. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The demand-planning / forecasting system, comparing the published ' +
        'forecast against point-of-sale sell-through at the same grain.',
      whyItMatters:
        'Forecast accuracy is the upstream lever of the whole function — ' +
        'every buy, allocation, and replenishment decision inherits the ' +
        'forecast error, and a structural bias in the forecast becomes ' +
        'either lost sales or excess inventory downstream.',
    },
    {
      key: 'inventory_turns',
      name: 'Inventory turnover',
      definition:
        'The number of times inventory is sold and replaced over a year — ' +
        'annual cost of goods sold divided by the average inventory value ' +
        'held at cost over the same period.',
      unit: 'turns per year',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Turns vary widely by category — grocery and fast-moving ' +
          'consumables turn many times faster than apparel, home, or ' +
          'hardlines; the band spans those category mixes. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning / ERP system, comparing annual ' +
        'cost of goods sold against the average inventory valuation at ' +
        'cost.',
      whyItMatters:
        'Turns are the headline working-capital efficiency measure of the ' +
        'function — low turns mean cash and shelf space tied up in product ' +
        'that is not selling, and a higher share of inventory that will ' +
        'eventually need a markdown to clear.',
    },
    {
      key: 'weeks_of_supply',
      name: 'Weeks of supply',
      definition:
        'The number of weeks the current on-hand and on-order inventory ' +
        'would last at the forecast or trailing rate of sale — on-hand plus ' +
        'on-order units divided by the weekly demand rate.',
      unit: 'weeks',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 4,
        high: 16,
        basis:
          'Target weeks of supply depends on replenishment lead time, ' +
          'category lifecycle, and demand volatility — a long-lead import ' +
          'basic carries more than a short-lead domestic replenishment ' +
          'item; the band spans those cases. A planning range, not a ' +
          'universal target.',
        label: 'planning-range',
      },
      dataSource:
        'The demand-planning / replenishment system, comparing on-hand and ' +
        'on-order positions against the forecast rate of sale.',
      whyItMatters:
        'Weeks of supply is the balance gauge of the function — too low ' +
        'risks a stockout before replenishment arrives, too high signals ' +
        'over-buy and a future markdown; it is where the two failure modes ' +
        'are read off a single number.',
    },
    {
      key: 'in_stock_availability_rate',
      name: 'In-stock / availability rate',
      definition:
        'The share of item-store-day (or item-channel-day) observations on ' +
        'which the item is available to sell — present on the shelf or ' +
        'fulfillable through the channel — at the moment a customer would ' +
        'want it.',
      unit: '% of item-store-days in stock',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 90,
        high: 98,
        basis:
          'In-stock rate varies with replenishment reliability, shelf ' +
          'execution, and the depth of long-tail assortment; the band ' +
          'spans a well-run replenishment operation to a strained one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Perpetual inventory reconciled against point-of-sale and shelf-' +
        'audit data — the inventory-management system flagged against zero ' +
        'or below-presentation on-hand.',
      whyItMatters:
        'In-stock rate is the customer-facing failure measure — every ' +
        'point of availability lost is a point of demand the assortment ' +
        'could have captured and did not, and it is the metric where ' +
        'planning meets the shopper.',
    },
    {
      key: 'excess_obsolete_inventory_pct',
      name: 'Excess & obsolete inventory %',
      definition:
        'The value of inventory identified as excess — beyond a defined ' +
        'forward-cover threshold — or obsolete (aged out, discontinued, ' +
        'unsellable at regular price), as a share of total inventory value.',
      unit: '% of inventory value excess or obsolete',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 20,
        basis:
          'Excess-and-obsolete exposure varies with category lifecycle ' +
          'and planning discipline — short-lifecycle fashion and ' +
          'technology run higher than stable basics; the band spans those ' +
          'mixes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning system, aging inventory ' +
        'against forward cover and lifecycle status, valued at cost.',
      whyItMatters:
        'Excess and obsolete inventory is the crystallised cost of a ' +
        'forecast or buy that was wrong — it is the inventory that will ' +
        'have to be marked down or written off, and its size is the ' +
        'clearest signal of over-buying.',
    },
    {
      key: 'stockout_rate',
      name: 'Stockout rate',
      definition:
        'The share of item-store (or item-channel) observations in a stock-' +
        'out state — on-hand at or below the level needed to make a sale — ' +
        'over a defined period. The mirror of the in-stock rate, read at ' +
        'the item level for replenishment diagnosis.',
      unit: '% of item-store observations out of stock',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 10,
        basis:
          'Stockout rate depends on replenishment cadence, forecast ' +
          'accuracy, and supply reliability; the band spans a disciplined ' +
          'replenishment operation to a loose one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The inventory-management system, flagging item-store positions at ' +
        'or below the sale threshold against demand events.',
      whyItMatters:
        'The stockout rate is the diagnostic counterpart to availability — ' +
        'it localises where demand is being lost to a specific item and ' +
        'store, which is where a replenishment or allocation fix is ' +
        'targeted.',
    },
    {
      key: 'inventory_carrying_cost',
      name: 'Inventory carrying cost',
      definition:
        'The annual cost of holding inventory — the cost of capital tied ' +
        'up, plus storage, insurance, shrink, and obsolescence — expressed ' +
        'as a percentage of the average inventory value held.',
      unit: '% of average inventory value per year',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 18,
        high: 30,
        basis:
          'Carrying cost varies with the cost of capital, storage ' +
          'intensity, and shrink and obsolescence exposure by category; ' +
          'the band spans those cases. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning / finance system, combining ' +
        'the cost of capital with storage, insurance, shrink, and ' +
        'obsolescence accruals against average inventory value.',
      whyItMatters:
        'Carrying cost is what makes excess inventory expensive even ' +
        'before it is marked down — it converts a balance-sheet number ' +
        'into a recurring profit-and-loss cost and so calibrates how hard ' +
        'leaner inventory pays.',
    },
    {
      key: 'allocation_accuracy',
      name: 'Allocation accuracy',
      definition:
        'How well the units allocated to each store match that store’s ' +
        'realised demand — measured as the share of allocated units that ' +
        'sell through within the planned window without being marked down ' +
        'or transferred to balance the network.',
      unit: '% of allocated units selling to plan without rebalancing',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 85,
        basis:
          'Allocation accuracy depends on the granularity of the store-' +
          'level demand signal and the discipline of size and pack ' +
          'planning; the band spans a coarse, average-driven allocation to ' +
          'a store-specific one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The allocation system reconciled against store-level point-of-' +
        'sale, comparing allocated units to sell-through and to ' +
        'subsequent transfers and markdowns.',
      whyItMatters:
        'Allocation is where a correct aggregate buy is either matched to ' +
        'real store demand or mis-positioned — a good total buy badly ' +
        'allocated still produces stockouts in some stores and markdowns ' +
        'in others, so allocation accuracy is the bridge from the buy to ' +
        'the shelf.',
    },
    {
      key: 'lost_sales_estimate',
      name: 'Lost-sales estimate',
      definition:
        'The estimated demand not captured because an item was out of ' +
        'stock or under-presented — modelled by comparing observed sales ' +
        'during stockout periods against the unconstrained demand ' +
        'expected, expressed as a share of total demand.',
      unit: '% of total demand lost to unavailability',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Lost sales scale with the stockout rate and with how much ' +
          'demand substitutes versus walks; the band spans a high-' +
          'availability operation with strong substitution to a low-' +
          'availability one. A planning range, and an estimate by nature.',
        label: 'planning-range',
      },
      dataSource:
        'A demand-sensing or lost-sales model joining stockout periods ' +
        'from the inventory system to an unconstrained-demand estimate.',
      whyItMatters:
        'Lost sales are the invisible failure mode — they never appear in ' +
        'the sales ledger, so without an explicit estimate the cost of ' +
        'poor availability is structurally understated and the function ' +
        'optimises toward lean inventory at the expense of revenue.',
    },
    {
      key: 'days_inventory_outstanding',
      name: 'Days inventory outstanding (DIO)',
      definition:
        'The average number of days inventory is held before it is sold — ' +
        'average inventory at cost divided by the daily cost of goods ' +
        'sold. The time-denominated counterpart to inventory turns.',
      unit: 'days',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 30,
        high: 150,
        basis:
          'DIO is the inverse of turns and spans the same category range ' +
          '— fast-moving consumables sit far below slow-moving hardlines ' +
          'and apparel; the band spans those mixes. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning / finance system, comparing ' +
        'average inventory at cost against the daily cost of goods sold.',
      whyItMatters:
        'DIO is the working-capital measure the CFO reads — it sits inside ' +
        'the cash-conversion cycle, so a planning improvement that lowers ' +
        'DIO releases cash directly and is the metric that links inventory ' +
        'planning to the balance sheet.',
    },
    {
      key: 'gross_margin_return_on_inventory',
      name: 'Gross margin return on inventory investment (GMROI)',
      definition:
        'The gross margin earned for each unit of inventory cost carried — ' +
        'annual gross margin divided by the average inventory value at ' +
        'cost. The metric that fuses margin and turns into a single ' +
        'productivity number.',
      unit: 'gross margin $ per $ of inventory cost',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 5,
        basis:
          'GMROI varies with the category margin structure and turn rate; ' +
          'the band spans a low-margin high-turn grocery mix to a higher-' +
          'margin slower-turn one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning system, combining gross-margin ' +
        'and average-inventory-at-cost data by item, category, and store.',
      whyItMatters:
        'GMROI is the planner’s single productivity verdict — it stops the ' +
        'function from chasing turns at the expense of margin or margin at ' +
        'the expense of turns, and it is the measure a buy and an ' +
        'assortment are ultimately judged on.',
    },
    {
      key: 'markdown_rate',
      name: 'Markdown rate',
      definition:
        'The total value of markdowns taken — permanent and promotional ' +
        'price reductions below the original retail — as a share of gross ' +
        'sales over the same period.',
      unit: '% of gross sales taken as markdown',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 35,
        basis:
          'Markdown rate varies enormously by category lifecycle — stable ' +
          'basics run low, fashion and seasonal run high by design; the ' +
          'band spans those cases and includes planned promotional ' +
          'markdown. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning / pricing system, totalling ' +
        'markdown dollars against gross sales by item and category.',
      whyItMatters:
        'Markdown is the realised cost of the inventory the plan got wrong ' +
        '— some markdown is a deliberate lifecycle tool, but unplanned ' +
        'markdown driven by over-buy is pure margin leakage, and the rate ' +
        'separates the two.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'forecast_bias_and_grain',
      name: 'Forecast bias and the wrong planning grain',
      description:
        'The demand forecast is built at too coarse a grain — chain or ' +
        'region rather than item / store — or carries a persistent ' +
        'directional bias, so a single average is pushed onto stores whose ' +
        'demand differs widely. Coarse, biased forecasts simultaneously ' +
        'over-supply some stores and starve others from the same buy.',
      detectionSignal:
        'WMAPE is high at the item/store grain even when chain-level ' +
        'accuracy looks acceptable; forecast error shows a consistent ' +
        'sign; planners routinely override the system forecast.',
      diagnosticQuestion:
        'At what grain is the demand forecast built and measured, and does ' +
        'its error show a persistent bias when read at item / store / ' +
        'week?',
    },
    {
      key: 'over_buy_and_excess',
      name: 'Over-buying and structural excess',
      description:
        'The merchandise plan and open-to-buy commit more units than ' +
        'realistic demand supports — driven by vendor minimums, volume ' +
        'discounts, optimism, or a forecast with no downside case — so ' +
        'inventory arrives ahead of demand, ages, and ends up cleared ' +
        'through unplanned markdown.',
      detectionSignal:
        'Weeks of supply runs persistently above the category target; ' +
        'excess-and-obsolete inventory percentage is rising; markdown rate ' +
        'exceeds the planned lifecycle markdown.',
      diagnosticQuestion:
        'How is the open-to-buy disciplined against a realistic demand ' +
        'plan, and what share of inventory ages past its forward-cover ' +
        'threshold each season?',
    },
    {
      key: 'stockouts_lost_sales',
      name: 'Stockouts and uncounted lost sales',
      description:
        'Items go out of stock at the store or channel at the moment of ' +
        'demand — through a forecast miss, a replenishment delay, or a ' +
        'mis-allocation — and the lost demand never appears in the sales ' +
        'ledger, so the cost of poor availability is structurally ' +
        'invisible and under-weighted in planning.',
      detectionSignal:
        'In-stock rate is below the category target; the stockout rate ' +
        'clusters on specific items and stores; no explicit lost-sales ' +
        'estimate is produced, so demand is treated as equal to sales.',
      diagnosticQuestion:
        'How is lost demand during a stockout estimated, and is that ' +
        'estimate fed back into the forecast and the buy, or is demand ' +
        'simply read off realised sales?',
    },
    {
      key: 'allocation_mismatch',
      name: 'Allocation and store-distribution mismatch',
      description:
        'A correct aggregate buy is pushed to stores on a coarse rule — an ' +
        'even spread, last-year’s share, or a single grade — that ignores ' +
        'store-level demand, size profile, and local trend, so the same ' +
        'receipt produces stockouts in high-demand stores and markdowns in ' +
        'low-demand ones.',
      detectionSignal:
        'Allocation accuracy is low; inter-store transfers to rebalance ' +
        'inventory are frequent; the same item shows stockouts and ' +
        'markdowns across different stores in the same period.',
      diagnosticQuestion:
        'On what signal are receipts allocated to stores, and how often ' +
        'does inventory have to be transferred between stores to correct ' +
        'the original allocation?',
    },
    {
      key: 'new_item_store_cold_start',
      name: 'New-product and new-store cold-start error',
      description:
        'New products and new stores have no sales history, so the ' +
        'forecast falls back on a coarse analogue or a planner guess. The ' +
        'cold-start error is large and asymmetric — an over-forecast ' +
        'floods a new store with markdown-bound stock, an under-forecast ' +
        'starts it in chronic stockout.',
      detectionSignal:
        'Forecast error on first-season items and new-store openings is ' +
        'far above the chain average; new stores swing between heavy ' +
        'markdown and persistent stockout in their first year.',
      diagnosticQuestion:
        'How are new products and new stores forecast in the absence of ' +
        'history, and how large is the error on those launches compared ' +
        'with the established assortment?',
    },
    {
      key: 'size_pack_curve_drift',
      name: 'Size and pack-curve drift',
      description:
        'Size curves and case-pack configurations are set once and not ' +
        'maintained against actual sell-through by store, so middle sizes ' +
        'stock out while end sizes pile up — the assortment is technically ' +
        'in stock in units but broken on the sizes a shopper actually ' +
        'wants.',
      detectionSignal:
        'Specific sizes stock out while others mark down within the same ' +
        'style; broken-size availability is far below unit-level in-stock; ' +
        'size curves have not been refreshed against recent sell-through.',
      diagnosticQuestion:
        'How current are the size curves and pack configurations against ' +
        'store-level sell-through, and is broken-size availability ' +
        'measured separately from unit availability?',
    },
    {
      key: 'late_markdown_timing',
      name: 'Late and untimed markdown decisions',
      description:
        'Markdowns are taken on a fixed calendar or only once excess is ' +
        'undeniable, rather than when the sell-through curve first signals ' +
        'a clearance problem — so the markdown is deeper than it needed to ' +
        'be and the inventory carries longer than it should.',
      detectionSignal:
        'Markdowns cluster at end-of-season rather than tracking sell-' +
        'through; clearance depth is greater than a timely markdown would ' +
        'have required; aged inventory sits at full price well past its ' +
        'sell-through inflection.',
      diagnosticQuestion:
        'What triggers a markdown — a fixed calendar or a sell-through ' +
        'signal — and how is the timing and depth trade-off being ' +
        'optimised against carrying cost?',
    },
    {
      key: 'planning_data_fragmentation',
      name: 'Planning-system and data fragmentation',
      description:
        'Forecasting, the merchandise financial plan, allocation, and ' +
        'replenishment run in separate systems and spreadsheets with ' +
        'inconsistent item hierarchies, lagged inventory positions, and no ' +
        'single demand signal — so the plan, the buy, and the allocation ' +
        'quietly disagree and reconciliation consumes the planner’s time.',
      detectionSignal:
        'Forecast, plan, and allocation numbers do not reconcile; ' +
        'perpetual inventory diverges from physical counts; planners spend ' +
        'most of their time stitching exports together rather than ' +
        'planning.',
      diagnosticQuestion:
        'How many systems hold a version of the demand and inventory ' +
        'plan, and how much planner time goes to reconciling them rather ' +
        'than to planning decisions?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'demand_forecasting',
      name: 'Machine-learning demand forecasting',
      valueMechanism:
        'A model forecasts demand at the item / store / week grain from ' +
        'point-of-sale history, price and promotion, calendar and weather, ' +
        'and local trend signals — replacing a coarse, average-driven, or ' +
        'manually overridden forecast. Value comes from cutting forecast ' +
        'error, which propagates downstream: a tighter forecast supports ' +
        'higher availability at lower weeks of supply, so both lost sales ' +
        'and excess inventory fall at the same time.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Point-of-sale sell-through history at the item / store grain',
        'Price, promotion, and markdown event history',
        'Calendar, seasonality, and local event / weather data',
        'A clean and stable product and location hierarchy',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model publishes the forecast; demand planners review ' +
          'exceptions and own overrides for known events the model cannot ' +
          'see — a new competitor, a confirmed large order.',
        'A forecast trained through an anomalous period — a pandemic, a ' +
          'supply shock — will carry that distortion forward and must be ' +
          'revalidated as demand patterns normalise.',
        'Forecast bias must be monitored continuously — a small persistent ' +
          'directional error compounds into systematic over- or under-buy.',
      ],
      metricsMoved: [
        'forecast_accuracy_mape',
        'in_stock_availability_rate',
        'weeks_of_supply',
        'lost_sales_estimate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'automated_replenishment',
      name: 'Automated replenishment',
      valueMechanism:
        'A model translates the demand forecast, the current inventory ' +
        'position, lead time, and service-level targets into order ' +
        'quantities and timing, and generates replenishment orders ' +
        'continuously rather than on a static reorder point. Value comes ' +
        'from holding availability at a higher in-stock rate while running ' +
        'leaner weeks of supply — raising turns and cutting the stockout ' +
        'rate together.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'The published item / store demand forecast',
        'Accurate perpetual inventory and on-order positions',
        'Supplier and distribution-centre lead times and reliability',
        'Service-level targets and case-pack / minimum-order constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes and can place replenishment orders within ' +
          'governed limits; a planner reviews exceptions and owns large or ' +
          'unusual orders.',
        'Replenishment is only as good as the perpetual-inventory accuracy ' +
          'feeding it — a phantom on-hand suppresses an order the store ' +
          'genuinely needs.',
        'Order limits and minimum / maximum bounds must be governed so a ' +
          'forecast spike cannot trigger a runaway buy.',
      ],
      metricsMoved: [
        'in_stock_availability_rate',
        'stockout_rate',
        'inventory_turns',
        'weeks_of_supply',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'allocation_distribution_optimization',
      name: 'Allocation & store-distribution optimisation',
      valueMechanism:
        'A model allocates each receipt to stores on a store-specific ' +
        'demand signal — including the size and pack curve — instead of an ' +
        'even spread or a last-year share, and proposes size-profiled, ' +
        'store-graded allocations. Value comes from matching units to ' +
        'where demand actually is, raising allocation accuracy so the same ' +
        'buy produces fewer stockouts in strong stores and fewer markdowns ' +
        'in weak ones.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Store-level demand and sell-through history including size and ' +
          'pack detail',
        'Store attributes — grade, climate, demographics, selling space',
        'Receipt quantities, case-pack constraints, and the size curve',
        'In-transit and on-hand inventory by store',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes the allocation; an allocator reviews and can ' +
          'adjust before release, owning judgement on new stores and known ' +
          'local events.',
        'A store-specific allocation needs enough store-level data to be ' +
          'reliable — thin-data stores must fall back to a graded rule, ' +
          'not an over-fitted one.',
        'Allocation must respect case-pack and minimum-presentation ' +
          'constraints so a store is not allocated an unworkable fraction ' +
          'of a pack.',
      ],
      metricsMoved: [
        'allocation_accuracy',
        'in_stock_availability_rate',
        'markdown_rate',
        'stockout_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'new_store_new_product_forecasting',
      name: 'New-store & new-product forecasting',
      valueMechanism:
        'A model forecasts demand for items and stores with no sales ' +
        'history by learning from attribute-matched analogues — comparable ' +
        'products, comparable store profiles, and early-life sell-through ' +
        'signals — and updates fast as the first weeks of real data ' +
        'arrive. Value comes from cutting the large, asymmetric cold-start ' +
        'error so a launch starts neither flooded with markdown-bound ' +
        'stock nor in chronic stockout.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Product and store attribute data rich enough to find analogues',
        'Historical launch and new-store sell-through curves',
        'Early-life point-of-sale data for fast in-life correction',
        'Planned marketing, pricing, and distribution for the launch',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model proposes the launch forecast and its analogue basis; a ' +
          'planner reviews the analogue choice and owns the launch buy ' +
          'decision.',
        'Analogue selection is the main risk — a poorly matched analogue ' +
          'transfers the wrong demand shape; the analogue rationale must ' +
          'be explicit and reviewable.',
        'The forecast must be designed to update quickly on early sell-' +
          'through so a cold-start miss is corrected within the launch ' +
          'window, not after it.',
      ],
      metricsMoved: [
        'forecast_accuracy_mape',
        'excess_obsolete_inventory_pct',
        'stockout_rate',
        'markdown_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'inventory_position_optimization',
      name: 'Network inventory-position optimisation',
      valueMechanism:
        'A model optimises where inventory sits across the network — ' +
        'distribution centres, stores, and forward positions — balancing ' +
        'multi-echelon safety stock against demand volatility, lead time, ' +
        'and the cost of holding, and proposes transfers and rebalancing. ' +
        'Value comes from holding the same service level on less total ' +
        'inventory by pooling buffer where it covers the most demand, ' +
        'lifting turns and lowering carrying cost.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inventory positions across every echelon of the network',
        'Item / location demand forecasts and demand-volatility estimates',
        'Lead times and transfer costs between echelons',
        'Service-level targets and carrying-cost parameters by category',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes safety-stock settings and transfers; a ' +
          'planning lead reviews and owns network-level rebalancing ' +
          'decisions.',
        'Multi-echelon optimisation is sensitive to demand-volatility ' +
          'estimates — under-stating volatility quietly erodes the service ' +
          'level it was meant to protect.',
        'Proposed transfers must be costed against their freight and ' +
          'handling so the optimisation does not chase a holding saving ' +
          'smaller than the move that captures it.',
      ],
      metricsMoved: [
        'inventory_turns',
        'inventory_carrying_cost',
        'in_stock_availability_rate',
        'days_inventory_outstanding',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'markdown_liquidation_timing',
      name: 'Markdown & liquidation timing optimisation',
      valueMechanism:
        'A model watches the sell-through curve against the forward-cover ' +
        'and end-of-life date for each item and recommends the timing and ' +
        'depth of markdown — and the liquidation channel for true ' +
        'clearance — to clear inventory by the deadline at the lowest ' +
        'total margin cost. Value comes from acting on the sell-through ' +
        'signal early, so the markdown is shallower and the inventory ' +
        'carries for less time than a fixed-calendar markdown would.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Item-level sell-through curves and remaining forward cover',
        'Price-elasticity and markdown-response history',
        'End-of-life / season-end dates and clearance-channel economics',
        'Carrying-cost parameters to value the time dimension',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model recommends markdown timing and depth; a merchant ' +
          'reviews and owns the price decision, weighing brand and ' +
          'competitive considerations the model does not see.',
        'Elasticity estimated from past markdowns can mislead when ' +
          'consumer behaviour or the competitive set has shifted — the ' +
          'response model must be revalidated.',
        'A markdown recommendation must respect minimum-margin and brand-' +
          'pricing rules so clearance does not breach pricing policy.',
      ],
      metricsMoved: [
        'markdown_rate',
        'excess_obsolete_inventory_pct',
        'gross_margin_return_on_inventory',
        'inventory_turns',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_demand_signal',
      name: 'Unified demand-signal layer',
      description:
        'A pattern that establishes one machine-learning demand forecast ' +
        'at the item / store / week grain as the single signal every ' +
        'downstream decision consumes — the merchandise plan, allocation, ' +
        'and replenishment all read the same forecast rather than each ' +
        'system carrying its own.',
      boundary:
        'It produces and publishes the forecast; demand planners review ' +
        'exceptions and own event-driven overrides. It does not place buys ' +
        'or set the open-to-buy — it is the signal those decisions are ' +
        'built on.',
      humanAccountabilityPoint:
        'The director of demand planning, accountable for forecast ' +
        'accuracy and the integrity of the single demand signal.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'closed_loop_replenishment',
      name: 'Closed-loop replenishment pattern',
      description:
        'A pattern that runs replenishment as a continuous closed loop — ' +
        'forecast to inventory position to order to receipt to sell-' +
        'through and back into the forecast — so availability is held at ' +
        'target with the minimum weeks of supply and the loop self-' +
        'corrects on realised demand.',
      boundary:
        'It generates and places replenishment orders within governed ' +
        'order limits; a replenishment planner owns exceptions, large ' +
        'orders, and the service-level and limit settings. It does not ' +
        'change service-level policy on its own.',
      humanAccountabilityPoint:
        'The replenishment planning manager, accountable for the in-stock ' +
        'rate and inventory turns.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'attribute_based_allocation',
      name: 'Attribute-based allocation pattern',
      description:
        'A pattern that allocates receipts to stores on store attributes ' +
        'and a store-specific, size-profiled demand signal rather than on ' +
        'an even spread or a last-year share — and uses the same attribute ' +
        'model to forecast new stores by analogue.',
      boundary:
        'It proposes the store-by-store, size-profiled allocation; an ' +
        'allocator reviews and adjusts before release and owns judgement ' +
        'for new stores and local events. It does not change the total buy ' +
        'or the size curve.',
      humanAccountabilityPoint:
        'The allocation manager, accountable for allocation accuracy and ' +
        'the balance of stockouts and markdowns across stores.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'sell_through_driven_markdown',
      name: 'Sell-through-driven markdown pattern',
      description:
        'A pattern that triggers markdown and liquidation decisions on the ' +
        'sell-through curve and remaining forward cover rather than on a ' +
        'fixed calendar — recommending the timing, depth, and clearance ' +
        'channel that clears inventory by its deadline at the lowest total ' +
        'margin cost.',
      boundary:
        'It recommends markdown timing and depth within minimum-margin and ' +
        'brand-pricing rules; a merchant owns the price decision. It does ' +
        'not change pricing policy or override a brand-pricing constraint.',
      humanAccountabilityPoint:
        'The merchant / planning director accountable for markdown rate ' +
        'and gross-margin return on inventory.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'multi_echelon_inventory_optimization',
      name: 'Multi-echelon inventory-optimisation pattern',
      description:
        'A pattern that sets safety stock and inventory position across ' +
        'every echelon of the network as one connected problem — pooling ' +
        'buffer where it covers the most demand variability — and proposes ' +
        'transfers to rebalance inventory toward demand.',
      boundary:
        'It proposes echelon safety-stock settings and rebalancing ' +
        'transfers; a planning lead reviews and owns network rebalancing ' +
        'and the service-level and carrying-cost parameters. It does not ' +
        'set service-level policy itself.',
      humanAccountabilityPoint:
        'The inventory planning director, accountable for network turns, ' +
        'carrying cost, and service level.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Demand & inventory-planning value is realised along four distinct ' +
      'levers and a forecast must keep them separate. First, captured ' +
      'demand: higher availability converts demand that would have been ' +
      'lost to a stockout into sales — a recurring revenue and gross-' +
      'margin gain, and the one that is hardest to see because lost sales ' +
      'are uncounted. Second, markdown reduction: a tighter forecast and ' +
      'better allocation mean less inventory has to be cleared below ' +
      'cost, lifting realised gross margin — a recurring margin gain. ' +
      'Third, working-capital release: leaner weeks of supply and higher ' +
      'turns release cash tied up in inventory and lower days inventory ' +
      'outstanding — largely a one-time pull-forward, distinct from the ' +
      'recurring margin gains. Fourth, carrying-cost reduction: less ' +
      'inventory on hand recurringly reduces the cost of capital, ' +
      'storage, shrink, and obsolescence. The dominant tension is that ' +
      'the captured-demand lever and the working-capital lever pull in ' +
      'opposite directions on inventory level — a credible forecast ' +
      'optimises the joint outcome and never claims both at full strength ' +
      'from the same plan.',
    dominantHaircutFactors: [
      {
        factor: 'Forecast-accuracy ceiling and demand volatility',
        rationale:
          'Every downstream gain is bounded by how much forecast error ' +
          'is irreducible — intermittent, short-lifecycle, and trend-' +
          'driven demand has a hard accuracy ceiling no model crosses. ' +
          'The modelled value assumes an accuracy lift the underlying ' +
          'demand volatility may not permit.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled planning gain not reachable because ' +
            'the demand is too volatile for the forecast to improve as ' +
            'much as assumed; a planning range widest for fashion and ' +
            'new products.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Inventory-data and perpetual-accuracy quality',
        rationale:
          'Forecasting, replenishment, and allocation all assume the ' +
          'recorded inventory position is true. Perpetual-inventory ' +
          'error, shrink, and a fragmented item hierarchy cap how much ' +
          'of the modelled value any model can deliver — a phantom on-' +
          'hand defeats a correct replenishment recommendation.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Value erosion from perpetual-inventory inaccuracy and item-' +
            'hierarchy fragmentation; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Planner adoption and override discipline',
        rationale:
          'A demand & inventory plan only delivers value if planners ' +
          'trust and act on the model output. Habitual manual overrides — ' +
          'whether from distrust or from genuine knowledge the model ' +
          'lacks — return the function to the average-driven planning the ' +
          'model was meant to replace.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from low planner adoption and undisciplined ' +
            'overrides of the model output; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Supply-side lead-time and reliability constraints',
        rationale:
          'A perfect plan still cannot raise availability beyond what the ' +
          'supply chain can deliver — long or unreliable vendor lead ' +
          'times, vendor minimums, and capacity ceilings cap the in-stock ' +
          'and turns gains a planning improvement can realise.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'Value erosion from supply-side lead-time and reliability ' +
            'constraints outside the planning function’s control; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Revenue gain from improved in-stock availability',
        range: {
          low: 1,
          high: 4,
          basis:
            'Relative sales uplift from converting demand previously lost ' +
            'to stockouts, from a meaningful in-stock-rate improvement; a ' +
            'planning range spanning category mix and starting ' +
            'availability.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent increase in net sales attributable to higher ' +
          'availability.',
      },
      {
        lever: 'Gross-margin gain from markdown reduction',
        range: {
          low: 0.5,
          high: 3,
          basis:
            'Improvement in realised gross margin as a share of sales ' +
            'from less unplanned markdown; a planning range, larger for ' +
            'short-lifecycle categories.',
          label: 'planning-range',
        },
        measuredAs:
          'Gross-margin-rate improvement in percentage points of sales.',
      },
      {
        lever: 'Inventory-value release from higher turns',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative reduction in average on-hand inventory value from ' +
            'leaner weeks of supply and higher turns at held service ' +
            'level; a planning range — largely a one-time working-capital ' +
            'release.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in average inventory value at cost.',
      },
      {
        lever: 'Carrying-cost reduction from leaner inventory',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in annual inventory carrying cost — ' +
            'capital, storage, shrink, obsolescence — from a lower ' +
            'average inventory position; a recurring planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in annual inventory carrying cost.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable signal on forecast accuracy and ' +
      'in-stock rate once the model is live on a pilot category; 12–18 ' +
      'months to a settled financial result, because a full seasonal and ' +
      'lifecycle cycle must complete before the markdown, turns, and ' +
      'working-capital effects are proven rather than projected.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Demand-planning / forecasting system',
        role:
          'Generates and stores the demand forecast at the planning grain ' +
          'and holds forecast accuracy, bias, and the override history — ' +
          'the source of the demand signal the function runs on.',
        examples: [
          'Blue Yonder Demand Planning',
          'o9 Solutions demand planning',
          'SAP Integrated Business Planning for retail demand',
        ],
      },
      {
        name: 'Merchandise financial planning (MFP) system',
        role:
          'Holds the merchandise plan, the open-to-buy, sales / inventory / ' +
          'markdown plans, and the gross-margin and turn targets — the ' +
          'financial control layer of the function.',
        examples: [
          'Oracle Retail Merchandise Financial Planning',
          'Blue Yonder Merchandise Financial Planning',
          'Anaplan-based merchandise planning models',
        ],
      },
      {
        name: 'Allocation and replenishment system',
        role:
          'Allocates receipts to stores and generates replenishment ' +
          'orders against demand and inventory positions — the execution ' +
          'layer between the buy and the shelf.',
        examples: [
          'Oracle Retail Allocation and Replenishment',
          'Blue Yonder Allocation / Fulfillment',
          'Relex allocation and replenishment',
        ],
      },
      {
        name: 'Merchandising / item and inventory system',
        role:
          'The system of record for the product hierarchy, the item ' +
          'master, perpetual inventory, and receipts — the foundational ' +
          'data every planning model joins to.',
        examples: [
          'Oracle Retail Merchandising System (RMS)',
          'SAP Retail / S/4HANA for Retail',
          'Aptos Merchandising',
        ],
      },
      {
        name: 'Point-of-sale and sales-data platform',
        role:
          'Captures item / store / day sell-through, price, and promotion ' +
          'realisation — the demand truth the forecast is trained and ' +
          'measured against.',
        examples: [
          'NCR / Toshiba point-of-sale platforms',
          'A retail sales data warehouse or lakehouse',
          'Cloud retail-analytics platforms aggregating POS',
        ],
      },
    ],
    roles: [
      {
        title: 'VP / Director of Planning & Allocation',
        accountability:
          'Owns the demand & inventory plan end to end — forecast ' +
          'accuracy, inventory turns, in-stock rate, and gross-margin ' +
          'return on inventory.',
      },
      {
        title: 'Demand planner',
        accountability:
          'Owns the demand forecast for an assigned category — accuracy, ' +
          'bias, and the event-driven overrides the model cannot see.',
      },
      {
        title: 'Merchandise / financial planner',
        accountability:
          'Owns the merchandise financial plan and the open-to-buy — the ' +
          'sales, inventory, and markdown plan against the gross-margin ' +
          'and turn targets.',
      },
      {
        title: 'Allocator',
        accountability:
          'Owns the allocation of receipts to stores — matching units, ' +
          'sizes, and packs to store-level demand.',
      },
      {
        title: 'Replenishment planner',
        accountability:
          'Owns in-season replenishment — service level, order timing, ' +
          'and the in-stock rate against weeks of supply.',
      },
      {
        title: 'Buyer / merchant',
        accountability:
          'Owns the assortment and the buy — what is bought, in what ' +
          'depth, and the markdown and pricing decisions on it.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Inventory accounting standards (lower of cost or net ' +
          'realisable value)',
        relevance:
          'Excess and obsolete inventory must be written down to net ' +
          'realisable value, so the planning function’s excess-and-' +
          'obsolete position directly drives a reported accounting charge.',
      },
      {
        name: 'Revenue-recognition and markdown-accounting standards',
        relevance:
          'Markdowns and promotional reductions are accounted against ' +
          'revenue and margin, so markdown timing and depth decisions ' +
          'have a defined financial-reporting consequence.',
      },
      {
        name: 'Vendor-agreement and trade terms (markdown money, ' +
          'chargebacks)',
        relevance:
          'Vendor funding of markdowns, return-to-vendor rights, and ' +
          'order minimums shape the true cost of an over-buy and the ' +
          'options for clearing it — they bound the planning decision.',
      },
      {
        name: 'Product safety, labelling, and date-code regulations',
        relevance:
          'Date-coded, perishable, and regulated products carry hard ' +
          'sell-by constraints, making expiry and obsolescence a ' +
          'compliance matter, not only an economic one, for affected ' +
          'categories.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Open-to-buy (OTB)',
        definition:
          'The budgeted amount a buyer may still commit to purchase for a ' +
          'period, given the sales plan, the inventory plan, and ' +
          'inventory already on hand or on order.',
      },
      {
        term: 'Weeks of supply (WOS)',
        definition:
          'The number of weeks current inventory would last at the ' +
          'forecast or trailing rate of sale — a forward-cover gauge of ' +
          'inventory balance.',
      },
      {
        term: 'Sell-through',
        definition:
          'The share of received units sold over a defined period — the ' +
          'core signal of how a buy is performing against its plan.',
      },
      {
        term: 'Size curve',
        definition:
          'The planned distribution of demand across the sizes of a ' +
          'style, used to profile buys and allocations so the right depth ' +
          'of each size reaches each store.',
      },
      {
        term: 'Safety stock',
        definition:
          'Buffer inventory held above forecast demand to absorb demand ' +
          'and supply variability and protect the target service level.',
      },
      {
        term: 'GMROI',
        definition:
          'Gross margin return on inventory investment — the gross margin ' +
          'earned per dollar of average inventory cost; the function’s ' +
          'fused margin-and-turn productivity measure.',
      },
      {
        term: 'Markdown',
        definition:
          'A reduction of an item’s retail price below its original ' +
          'ticket — permanent (clearance) or promotional — used to drive ' +
          'sell-through.',
      },
      {
        term: 'Replenishment lead time',
        definition:
          'The elapsed time from raising a replenishment order to the ' +
          'goods being available to sell — the horizon a forecast must ' +
          'cover and the driver of safety stock.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Demand & Inventory Planning Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the demand & inventory plan is leaking margin and ' +
        'sales — across forecasting, the buy, allocation, replenishment, ' +
        'and markdown — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Operation and assortment context',
          guidance:
            'Name the planning operation in scope — the category mix, ' +
            'store and channel footprint, lifecycle profile (basics vs ' +
            'fashion vs seasonal), and supply model (domestic vs import ' +
            'lead times). State which forecasting, MFP, allocation, ' +
            'replenishment, and merchandising systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — forecast accuracy (WMAPE), inventory ' +
            'turns, weeks of supply, in-stock rate, excess-and-obsolete ' +
            'percentage, stockout rate, carrying cost, allocation ' +
            'accuracy, lost-sales estimate, days inventory outstanding, ' +
            'GMROI, markdown rate. For any metric not recorded — lost ' +
            'sales is the common one — name it as a precise seed gap with ' +
            'its data source.',
        },
        {
          heading: 'Forecast quality and bias analysis',
          guidance:
            'Analyse forecast error at the item / store / week grain, ' +
            'separate it from chain-level accuracy, test for persistent ' +
            'bias, and quantify how often and why planners override the ' +
            'system forecast.',
        },
        {
          heading: 'Inventory-balance and excess analysis',
          guidance:
            'Profile weeks of supply against category targets, age the ' +
            'inventory against forward cover, size the excess-and-obsolete ' +
            'position, and separate planned lifecycle markdown from ' +
            'unplanned over-buy markdown.',
        },
        {
          heading: 'Availability and allocation analysis',
          guidance:
            'Quantify the in-stock and stockout rates by item and store, ' +
            'estimate the lost sales they imply, and analyse allocation ' +
            'accuracy and the frequency of inter-store transfers that ' +
            'correct a mis-allocation.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — forecast bias and grain, ' +
            'over-buying, stockouts and lost sales, allocation mismatch, ' +
            'new-store / new-product cold-start, size-curve drift, late ' +
            'markdown timing, planning-data fragmentation — and state ' +
            'which are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — captured-demand revenue, markdown ' +
            'reduction, inventory-value release, carrying-cost reduction ' +
            '— explicitly haircut by the forecast-accuracy ceiling, ' +
            'inventory-data quality, and planner adoption. Every figure a ' +
            'labelled planning range, and the captured-demand and ' +
            'working-capital levers shown as the trade-off they are.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — a ' +
            'lost-sales estimate, perpetual-inventory accuracy — is a ' +
            'named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Demand & Inventory Planning Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a demand & ' +
        'inventory-planning AI Move on this operation — baseline, ' +
        'forecast, cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring captured-demand revenue, recurring markdown and ' +
            'carrying-cost margin gain, and one-time inventory-value ' +
            'release, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — forecast accuracy, turns, in-stock rate, markdown ' +
            'rate, excess-and-obsolete. Where a baseline is a seed gap — ' +
            'lost sales and allocation accuracy are common ones — say so ' +
            'and state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — forecast-accuracy ' +
            'ceiling, inventory-data quality, planner adoption, supply-' +
            'side constraints — explicitly and show the haircut math. ' +
            'Keep the recurring margin gains separate from the one-time ' +
            'working-capital release and show the availability / ' +
            'inventory trade-off honestly.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the forecasting, MFP, ' +
            'allocation, replenishment, merchandising, and POS systems, ' +
            'the inventory-data and item-hierarchy remediation the models ' +
            'depend on, and the operating-model change across the ' +
            'planning teams.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a lower forecast-accuracy ' +
            'lift, dirtier perpetual inventory, slower planner adoption, ' +
            'and tighter supply lead times. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Margin and inventory governance posture',
          guidance:
            'State how the captured-demand and working-capital levers are ' +
            'governed so the function does not optimise availability into ' +
            'over-stock or turns into stockouts — and how service-level ' +
            'and minimum-margin policy bound the AI decisions.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example, perpetual inventory too inaccurate to ' +
            'model against — and the evidence that must be in hand before ' +
            'the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged markdown, turns, and working-capital metrics that ' +
            'need a full seasonal cycle.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Demand & Inventory Planning Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'demand & inventory-planning AI capability, grounded in the ' +
        'function reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — unified demand signal, closed-loop replenishment, ' +
            'attribute-based allocation, sell-through-driven markdown, ' +
            'multi-echelon inventory optimisation — and state which apply ' +
            'and how they connect from forecast to shelf.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the forecasting, MFP, allocation, replenishment, ' +
            'merchandising, and POS integrations, the perpetual-inventory ' +
            'and product-hierarchy data the models depend on, and the ' +
            'data-quality baseline — perpetual accuracy, hierarchy ' +
            'consistency — required before go-live.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. Define the order limits, service-level ' +
            'bounds, and minimum-margin rules that govern the autonomous ' +
            'decisions.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the demand-planning, financial-planning, ' +
            'allocation, and replenishment workflows change, how planner ' +
            'capacity is redeployed from manual reconciliation to ' +
            'exception and event management, and who owns each change.',
        },
        {
          heading: 'Responsible-AI and governance controls',
          guidance:
            'State the forecast-bias monitoring, the override-discipline ' +
            'policy, the service-level and minimum-margin guardrails, and ' +
            'the model-revalidation cadence for anomalous demand periods.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence — inventory-data and hierarchy ' +
            'remediation first, then the unified demand forecast, then ' +
            'replenishment and allocation, then markdown and multi-' +
            'echelon optimisation — the integration patterns, and the ' +
            'phased rollout across categories and channels.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Demand & Inventory Planning Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the demand & inventory-planning ' +
        'AI capability so value reaches margin and availability, not just ' +
        'the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — inventory-data remediation and ' +
            'integration validation, a pilot category, forecast and ' +
            'replenishment rollout, allocation and markdown extension — ' +
            'with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, inventory-data governance, demand planning, ' +
            'replenishment, allocation, markdown, and Tower measurement.',
        },
        {
          heading: 'Planner adoption and redeployment approach',
          guidance:
            'Define the change runway for demand, financial, ' +
            'replenishment, and allocation planners — training, the new ' +
            'exception-and-override workflow, and the redeployment of ' +
            'capacity freed from manual reconciliation — and how adoption ' +
            'and override discipline are measured, not assumed.',
        },
        {
          heading: 'Forecast-accuracy and trust ramp',
          guidance:
            'Define how forecast accuracy is tracked publicly through ' +
            'the pilot, how the model earns planner trust before override ' +
            'rates can fall, and the threshold at which the function ' +
            'shifts from forecast-led with heavy review to forecast-led ' +
            'with exception review.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged markdown, turns, and ' +
            'working-capital metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — perpetual-inventory data decay, an ' +
            'over-fitted forecast, low planner adoption, supply-side lead-' +
            'time shocks — with the escalation owner and the trigger for ' +
            'each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Demand forecast accuracy and bias',
      authoritativeSource:
        'The demand-planning system, comparing the published forecast ' +
        'against point-of-sale sell-through at the item / store / week ' +
        'grain.',
      whatGoodEvidenceLooksLike:
        'WMAPE measured at the planning grain over multiple periods, ' +
        'reported alongside the bias sign and the forecast-override rate, ' +
        'so accuracy is not flattered by chain-level aggregation.',
      weakEvidenceToReject:
        'A single chain-level accuracy percentage with no item / store ' +
        'breakdown, or an accuracy claim with no measure of forecast ' +
        'bias.',
    },
    {
      claim: 'In-stock availability and lost sales',
      authoritativeSource:
        'Perpetual inventory reconciled against point-of-sale and shelf-' +
        'audit data, with a lost-sales model joining stockout periods to ' +
        'an unconstrained-demand estimate.',
      whatGoodEvidenceLooksLike:
        'In-stock and stockout rates measured at the item-store-day ' +
        'grain, with an explicit, methodology-stated lost-sales estimate ' +
        'rather than demand assumed equal to realised sales.',
      weakEvidenceToReject:
        'An availability figure derived only from perpetual inventory ' +
        'with no shelf-audit reconciliation, or a claim of no lost sales ' +
        'because sales met plan.',
    },
    {
      claim: 'Excess, obsolete inventory and markdown exposure',
      authoritativeSource:
        'The merchandise financial planning system, aging inventory ' +
        'against forward cover and lifecycle status, with markdown ' +
        'dollars totalled against gross sales.',
      whatGoodEvidenceLooksLike:
        'Excess and obsolete inventory aged and valued at cost by ' +
        'category, with planned lifecycle markdown separated from ' +
        'unplanned over-buy markdown.',
      weakEvidenceToReject:
        'A blended total markdown figure with no split between planned ' +
        'and unplanned, or an excess estimate not aged against a defined ' +
        'forward-cover threshold.',
    },
    {
      claim: 'Inventory turns and working-capital position',
      authoritativeSource:
        'The merchandise financial planning / finance system, comparing ' +
        'cost of goods sold against average inventory at cost for turns ' +
        'and days inventory outstanding.',
      whatGoodEvidenceLooksLike:
        'Turns, weeks of supply, and DIO computed on average inventory ' +
        'at cost by category, with the GMROI that ties them to margin.',
      weakEvidenceToReject:
        'A turns figure computed on a single point-in-time inventory ' +
        'snapshot, or a working-capital claim with no link to the ' +
        'category margin structure.',
    },
    {
      claim: 'The forecast value of a demand & inventory-planning AI Move',
      authoritativeSource:
        'The value model — captured-demand, markdown-reduction, working-' +
        'capital, and carrying-cost components, each haircut by its ' +
        'dominant factors — read against the specific category mix and ' +
        'supply profile.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring margin gains separated from ' +
        'the one-time inventory release, the availability / inventory ' +
        'trade-off shown, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that claims both maximum availability and ' +
        'maximum turns from the same plan.',
    },
  ],
};
