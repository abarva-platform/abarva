// Domain Function Pack — Retail · Merchandising & assortment.
//
// Function key: `merchandising_assortment`.
//
// This is one half of the retail margin-and-mix spine (spec §3). Merchandising
// is the function that decides WHAT a retailer sells: the assortment by
// category, the depth and breadth of the range, the choice between national
// brands and private label, and how productively every SKU and every square
// foot of selling space earns its keep. It owns the open-to-buy — the budget
// that turns a financial plan into actual units bought — and it lives or dies
// on the tension between carrying enough choice to win the customer and not
// carrying so much that inventory bloats and the season ends in markdown.
//
// The companion pack — pricing-promotions.ts — sits alongside it: it is how
// that assortment is priced and promoted. Merchandising decides the range and
// the buy; pricing decides what each item sells for and when it goes on
// promotion. Together they are the retail reference depth — the function pair
// a merchant's gross margin actually turns on.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const merchandisingAssortmentPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'merchandising_assortment',
  functionLabel: 'Merchandising & assortment',
  summary:
    'Merchandising and assortment is the function that decides what a ' +
    'retailer carries and how hard it works: the category architecture, the ' +
    'breadth and depth of the range, the national-brand versus private-label ' +
    'mix, the open-to-buy that funds the actual purchase, and the placement ' +
    'of product against finite selling space. Its economics are gross margin ' +
    'and inventory productivity — GMROI, sell-through, and sales per SKU and ' +
    'per square foot. A merchant wins by carrying the choice the customer ' +
    'wants while keeping the buy disciplined enough that the season clears ' +
    'near full price; the function is judged on margin earned against ' +
    'inventory carried, not on how exciting the range looks on the floor.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'gross_margin_pct',
      name: 'Gross margin %',
      definition:
        'Gross profit — net sales less the cost of goods sold, after vendor ' +
        'allowances and markdowns — expressed as a percentage of net sales ' +
        'for the category or assortment.',
      unit: '% of net sales',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 25,
        high: 50,
        basis:
          'Gross margin varies sharply by retail segment — grocery and ' +
          'consumer electronics sit low, apparel and specialty sit high. ' +
          'Place the planning point on the tenant category mix.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandise financial planning (MFP) system reconciled against ' +
        'the general ledger and the markdown ledger.',
      whyItMatters:
        'It is the headline profitability of the assortment — the number a ' +
        'merchandising plan is built and judged on, and the figure every ' +
        'assortment, costing, and markdown decision ultimately moves.',
    },
    {
      key: 'gmroi',
      name: 'Gross margin return on inventory investment (GMROI)',
      definition:
        'Gross margin dollars generated for every dollar of average ' +
        'inventory at cost held over the period — gross margin $ divided by ' +
        'average inventory cost.',
      unit: 'gross margin $ per $ of average inventory cost',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 4,
        basis:
          'GMROI below ~2 signals inventory that is not earning its keep; ' +
          'fast-turning, low-margin categories and slow-turning, high-margin ' +
          'ones land differently. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The MFP system, combining gross margin from the P&L with average ' +
        'inventory at cost from the inventory ledger.',
      whyItMatters:
        'It is the truest single test of assortment productivity — it joins ' +
        'margin and turn, so it exposes a high-margin range that ties up too ' +
        'much capital and a fast range that earns too little.',
    },
    {
      key: 'sell_through_rate',
      name: 'Sell-through rate',
      definition:
        'The share of the units received for a season or buy cycle that are ' +
        'sold within the planned selling window, before terminal markdown or ' +
        'clearance.',
      unit: '% of received units sold in-window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 85,
        basis:
          'Full-price sell-through targets differ by category life — basics ' +
          'and replenishment run high, fashion and seasonal run lower and ' +
          'rely on planned markdown. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising / inventory system, comparing units received ' +
        'against units sold by selling week.',
      whyItMatters:
        'It is the clearest read on whether the buy was sized to demand — ' +
        'low sell-through is the early signal that the season will end in ' +
        'markdown and erode planned margin.',
    },
    {
      key: 'sales_per_sku',
      name: 'Assortment productivity (sales per SKU)',
      definition:
        'Net sales for a category divided by the count of active SKUs ' +
        'carried in it — how much revenue the average item in the range ' +
        'actually earns.',
      unit: 'net sales $ per active SKU per period',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5000,
        high: 50000,
        basis:
          'Sales per SKU spans an enormous range by category and store ' +
          'format; the planning value is set by comparing each SKU against ' +
          'its own category peers, not a cross-category figure.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising system, joining SKU-level sales to the active ' +
        'assortment list.',
      whyItMatters:
        'It exposes the long tail — the unproductive SKUs that add ' +
        'complexity and inventory without earning sales; rationalising the ' +
        'tail is one of the cleanest margin and working-capital levers.',
    },
    {
      key: 'markdown_rate',
      name: 'Markdown rate',
      definition:
        'Total permanent and promotional markdown dollars taken as a share ' +
        'of net sales for the category — the price reductions used to clear ' +
        'inventory below the original ticket.',
      unit: '% of net sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 30,
        basis:
          'Markdown intensity is structural by segment — fashion apparel ' +
          'runs high, hardlines and grocery run low. A planning range; the ' +
          'tenant category mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The markdown ledger in the merchandising system reconciled against ' +
        'net sales.',
      whyItMatters:
        'Markdown is the single largest controllable drain on gross margin; ' +
        'a rising markdown rate is the clearest evidence the buy was ' +
        'mis-sized or the assortment mis-judged.',
    },
    {
      key: 'in_stock_rate',
      name: 'In-stock rate',
      definition:
        'The share of active assortment SKUs available on the shelf or for ' +
        'fulfilment at the time a customer would buy them — the inverse of ' +
        'the out-of-stock rate.',
      unit: '% of active SKUs in stock',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 92,
        high: 98,
        basis:
          'In-stock for core and replenishment SKUs sits high; promotional ' +
          'and seasonal peaks pull it down. A planning range — the gap from ' +
          '100% is lost sales.',
        label: 'planning-range',
      },
      dataSource:
        'Perpetual inventory in the merchandising system, validated against ' +
        'cycle counts and POS sales.',
      whyItMatters:
        'An out-of-stock is a sale lost on a product the retailer chose to ' +
        'carry — the assortment is only as good as its availability, and ' +
        'in-stock is where a strong range silently leaks revenue.',
    },
    {
      key: 'category_attachment_rate',
      name: 'Category attachment rate',
      definition:
        'The share of baskets containing an anchor category item that also ' +
        'contain an item from a defined complementary or accessory category ' +
        '— the cross-category pull of the assortment.',
      unit: '% of anchor-category baskets with an attached item',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 15,
        high: 45,
        basis:
          'Attachment depends on how deliberately complementary categories ' +
          'are ranged and adjacencies set; it varies widely by category ' +
          'pair. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Basket-level POS and e-commerce transaction data analysed for ' +
        'category co-occurrence.',
      whyItMatters:
        'It measures whether the assortment is built as a connected set ' +
        'rather than a list of items — attachment lifts basket size and ' +
        'margin without acquiring a single new customer.',
    },
    {
      key: 'new_product_hit_rate',
      name: 'New-product hit rate',
      definition:
        'The share of newly introduced SKUs in a buy cycle that reach or ' +
        'exceed their planned sell-through and are retained or reordered, ' +
        'rather than discontinued at first markdown.',
      unit: '% of new SKUs meeting the plan',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 60,
        basis:
          'New-product introduction is inherently a portfolio of bets; even ' +
          'a strong merchandising operation expects a material miss rate. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising system, tracking newly flagged SKUs against ' +
        'their plan and lifecycle status.',
      whyItMatters:
        'It is the scorecard for the riskiest part of merchandising — ' +
        'newness; a low hit rate means the buy is over-introducing items ' +
        'the customer does not validate, and carrying the markdown for it.',
    },
    {
      key: 'space_productivity_sales_per_sqft',
      name: 'Space productivity (sales per square foot)',
      definition:
        'Net sales generated per square foot of selling space allocated to ' +
        'the category or department over the period.',
      unit: 'net sales $ per selling square foot per year',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 200,
        high: 800,
        basis:
          'Sales per square foot varies enormously by format and segment — ' +
          'small-format convenience and specialty run high, large-format ' +
          'general merchandise lower. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The space-planning / planogram system joined to category sales ' +
        'from the merchandising system.',
      whyItMatters:
        'Selling space is the most finite resource in physical retail; ' +
        'space productivity tests whether the floor allocation matches where ' +
        'demand and margin actually are.',
    },
    {
      key: 'private_label_penetration',
      name: 'Private-label penetration',
      definition:
        'The share of category net sales generated by the retailer’s own ' +
        'private-label and exclusive brands rather than by national brands.',
      unit: '% of category net sales',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 15,
        high: 40,
        basis:
          'Private-label share is a deliberate strategic setting — too low ' +
          'forgoes margin and differentiation, too high risks trip-driving ' +
          'national brands. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising system, classifying SKU sales by brand ownership.',
      whyItMatters:
        'Private label is the primary structural margin and differentiation ' +
        'lever a merchant controls; its penetration is a direct read on how ' +
        'hard the assortment is working that lever.',
    },
    {
      key: 'inventory_turn',
      name: 'Inventory turnover',
      definition:
        'The number of times the category’s average inventory is sold and ' +
        'replaced over a year — cost of goods sold divided by average ' +
        'inventory at cost.',
      unit: 'turns per year',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 3,
        high: 12,
        basis:
          'Turn is structural by category — perishable grocery turns many ' +
          'times, durable hardlines and fashion far fewer. A planning range; ' +
          'the category mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising / MFP system, comparing cost of goods sold ' +
        'against average inventory at cost.',
      whyItMatters:
        'Turn is the speed at which the assortment converts working capital ' +
        'into sales; slow turn ties up cash and ages inventory toward ' +
        'markdown, so it is the working-capital test of the buy.',
    },
    {
      key: 'assortment_breadth_depth_ratio',
      name: 'Assortment breadth-to-depth balance',
      definition:
        'A read on how the category SKU count is distributed — the count of ' +
        'distinct choices (breadth) against the average units carried per ' +
        'choice (depth) — used to test whether the range is over-spread or ' +
        'over-concentrated.',
      unit: 'distinct SKUs per subcategory vs. units per SKU (indexed)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 80,
        high: 120,
        basis:
          'Expressed as an index against the category plan; far below ' +
          'signals a thin range, far above signals a long tail. A planning ' +
          'range, calibrated to the category role.',
        label: 'planning-range',
      },
      dataSource:
        'The merchandising / assortment-planning system, analysing SKU ' +
        'counts and unit depth against the category plan.',
      whyItMatters:
        'Breadth-versus-depth is the core assortment-design trade-off; an ' +
        'imbalance is what produces either lost sales from a thin range or ' +
        'markdown from an over-broad one.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'long_tail_sku_proliferation',
      name: 'Long-tail SKU proliferation',
      description:
        'The assortment accumulates SKUs faster than it retires them. Each ' +
        'addition feels low-risk, but the cumulative tail carries inventory, ' +
        'complexity, and space cost while a small head of SKUs earns most of ' +
        'the sales — and nobody owns the discontinuation discipline.',
      detectionSignal:
        'A large share of active SKUs sit far below category-peer sales per ' +
        'SKU, and the SKU count grows period over period while category ' +
        'sales do not.',
      diagnosticQuestion:
        'What share of the active assortment earns less than a defined ' +
        'productivity floor, and who owns the discipline of discontinuing ' +
        'unproductive SKUs?',
    },
    {
      key: 'one_size_fits_all_assortment',
      name: 'One-size-fits-all assortment',
      description:
        'Every store carries close to the same range regardless of local ' +
        'demand, demographics, or climate. High-demand SKUs stock out in ' +
        'stores that want them while the same SKUs sit and mark down in ' +
        'stores that do not.',
      detectionSignal:
        'In-stock and sell-through for the same SKU diverge sharply across ' +
        'stores, and store-cluster or localised assortment versions barely ' +
        'differ from the chain range.',
      diagnosticQuestion:
        'How is the assortment localised to store-level demand, and how ' +
        'much does a given store’s range actually differ from the chain ' +
        'plan?',
    },
    {
      key: 'open_to_buy_overrun',
      name: 'Open-to-buy overrun',
      description:
        'Buys exceed the open-to-buy plan — chasing a trend, hitting a ' +
        'vendor minimum, or simple optimism — so inventory arrives ahead of ' +
        'demand, receipts outrun the selling curve, and the season is ' +
        'over-bought before it begins.',
      detectionSignal:
        'Receipts run ahead of the planned receipt flow, beginning-of-' +
        'season inventory exceeds plan, and early sell-through lags the ' +
        'curve the buy assumed.',
      diagnosticQuestion:
        'How disciplined is open-to-buy against the financial plan, and how ' +
        'often do actual receipts exceed the planned receipt flow?',
    },
    {
      key: 'markdown_driven_clearance',
      name: 'Reactive markdown-driven clearance',
      description:
        'Markdowns are taken late and in blunt, across-the-board steps once ' +
        'inventory is visibly aged, rather than early and surgically by SKU ' +
        'and store. The retailer clears the goods but surrenders far more ' +
        'margin than a timed, targeted cadence would have cost.',
      detectionSignal:
        'Markdown dollars concentrate in end-of-season blanket events; ' +
        'aged-inventory weeks-of-supply is high before the first markdown is ' +
        'taken.',
      diagnosticQuestion:
        'Is markdown taken early and by SKU and store on a planned cadence, ' +
        'or late and chain-wide once inventory has visibly aged?',
    },
    {
      key: 'planogram_drift',
      name: 'Planogram drift and space misallocation',
      description:
        'Shelf space and adjacencies no longer match where demand and ' +
        'margin sit. Planograms are updated slowly, store execution drifts ' +
        'from the plan, and declining categories hold prime space while ' +
        'growing ones are starved.',
      detectionSignal:
        'Sales per square foot varies widely across categories with no ' +
        'corresponding space reallocation; store compliance audits show the ' +
        'floor diverging from the planogram.',
      diagnosticQuestion:
        'How current are planograms against category performance, and how ' +
        'reliably does store execution match the space plan?',
    },
    {
      key: 'newness_without_validation',
      name: 'Newness without validation',
      description:
        'The buy over-introduces new SKUs on instinct, vendor pitch, or ' +
        'last year’s winner, with no structured test-and-learn. A low hit ' +
        'rate is absorbed as the cost of newness instead of being ' +
        'diagnosed and reduced.',
      detectionSignal:
        'The new-product hit rate is low and stable; new SKUs that miss ' +
        'plan are discontinued at markdown with no read fed back into the ' +
        'next buy.',
      diagnosticQuestion:
        'How are new products tested and validated before a full buy, and ' +
        'is the new-product hit rate tracked and acted on?',
    },
    {
      key: 'siloed_buying_planning',
      name: 'Siloed buying and planning',
      description:
        'Buyers, planners, allocation, and space teams work from different ' +
        'numbers and on different cycles. The buy, the financial plan, the ' +
        'allocation, and the floor plan are reconciled by spreadsheet, late, ' +
        'and partially.',
      detectionSignal:
        'The merchandise financial plan, the assortment plan, and the ' +
        'actual buy disagree materially; reconciliation is manual and ' +
        'happens after commitments are already made.',
      diagnosticQuestion:
        'Do buying, planning, allocation, and space work from one shared ' +
        'plan of record, or reconcile separate spreadsheets after the fact?',
    },
    {
      key: 'demand_signal_blindness',
      name: 'Demand-signal blindness',
      description:
        'Assortment decisions lean on last year’s sales — which already ' +
        'embed last year’s stockouts and markdowns — rather than on true ' +
        'underlying demand, search and browse signal, or competitive moves. ' +
        'The range perpetuates the prior year’s mistakes.',
      detectionSignal:
        'Buy plans are built almost entirely from prior-year sales with no ' +
        'lost-sales adjustment; SKUs that stocked out last year are ' +
        're-bought thin because the sales history understates them.',
      diagnosticQuestion:
        'Is demand estimated as true demand — corrected for stockouts and ' +
        'markdowns — or taken straight from last year’s sales?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'assortment_optimization',
      name: 'Assortment optimisation and SKU rationalisation',
      valueMechanism:
        'A model scores every SKU and candidate SKU on incremental demand, ' +
        'margin, cross-shopping pull, and substitutability, and proposes an ' +
        'assortment that keeps the choices customers genuinely want while ' +
        'retiring the redundant tail. Value comes from lifting sales per SKU ' +
        'and GMROI — same or better sales on less inventory and less ' +
        'complexity.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'SKU-level sales, margin, and inventory history',
        'Basket data for substitution and cross-shopping signal',
        'Attribute-tagged product master data',
        'Competitive and market range data where available',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes the range; a merchant owns the final assortment ' +
          'decision and can override on brand, strategic, or vendor grounds.',
        'Substitution estimates must be validated — wrongly assuming a ' +
          'cut SKU’s demand transfers is how rationalisation loses real ' +
          'sales.',
        'The model must not strip range that protects a category’s ' +
          'destination or trip-driving role purely on near-term ' +
          'productivity.',
      ],
      metricsMoved: [
        'sales_per_sku',
        'gmroi',
        'gross_margin_pct',
        'inventory_turn',
        'assortment_breadth_depth_ratio',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'demand_shaped_buying',
      name: 'Demand-shaped buying and open-to-buy intelligence',
      valueMechanism:
        'A model forecasts true demand by SKU and buy cycle — correcting ' +
        'last year’s sales for stockouts and markdowns and folding in ' +
        'search, browse, and trend signal — and sizes the buy and the ' +
        'receipt flow against the open-to-buy plan. Value comes from buying ' +
        'closer to real demand: fewer stockouts on winners, less overbuy on ' +
        'the rest, and a higher full-price sell-through.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Sales history corrected for stockout and markdown distortion',
        'Open-to-buy and merchandise financial plan data',
        'Search, browse, and wishlist demand signal',
        'Vendor lead-time and minimum-order constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends buy quantities and flow; a buyer owns the ' +
          'commitment and the vendor negotiation.',
        'The lost-sales correction must be transparent — an overstated ' +
          'correction simply re-creates overbuy in a new form.',
        'Forecasts for genuinely new or trend items carry wide uncertainty ' +
          'and should be presented as ranges, not point buys.',
      ],
      metricsMoved: [
        'sell_through_rate',
        'markdown_rate',
        'in_stock_rate',
        'inventory_turn',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'markdown_clearance_optimization',
      name: 'Markdown and clearance optimisation',
      valueMechanism:
        'A model recommends the timing and depth of markdowns by SKU and ' +
        'store cluster against a clearance deadline, balancing margin ' +
        'retained against the risk of unsold terminal inventory. Value comes ' +
        'from clearing aged inventory on a timed, surgical cadence instead ' +
        'of blunt end-of-season cuts — recovering margin the reactive ' +
        'pattern surrenders.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'SKU and store-level inventory age and weeks-of-supply',
        'Price-response and markdown-elasticity history',
        'The clearance deadline and remaining selling calendar',
        'Store-cluster demand differences',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends the markdown cadence; a merchant approves the ' +
          'price changes and owns brand and competitive considerations.',
        'Recommendations must respect minimum-margin floors and any ' +
          'price-perception or MAP constraints.',
        'Elasticity drifts across the season — the model must be ' +
          'recalibrated as clearance progresses, not set once.',
      ],
      metricsMoved: [
        'markdown_rate',
        'gross_margin_pct',
        'sell_through_rate',
        'inventory_turn',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'localized_store_cluster_assortment',
      name: 'Localised and store-cluster assortment',
      valueMechanism:
        'A model clusters stores by demand pattern, demographics, climate, ' +
        'and competitive context and tailors the assortment and depth to ' +
        'each cluster — so high-demand SKUs are ranged where they sell and ' +
        'absent where they would only mark down. Value comes from matching ' +
        'the range to local demand: more sales, fewer stockouts, less ' +
        'misplaced inventory.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Store-level sales, sell-through, and stockout history',
        'Store demographic, climate, and trade-area data',
        'Local competitive presence data',
        'Store space and fixture capacity constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes clusters and cluster ranges; merchandising and ' +
          'store operations own the final localisation decision.',
        'Localisation must not fragment the assortment so far that ' +
          'replenishment, allocation, and operational complexity become ' +
          'unmanageable.',
        'Cluster definitions must be revalidated as trade areas and ' +
          'competition shift.',
      ],
      metricsMoved: [
        'sell_through_rate',
        'in_stock_rate',
        'markdown_rate',
        'sales_per_sku',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'new_product_forecasting',
      name: 'New-product forecasting and test-and-learn',
      valueMechanism:
        'A model forecasts demand for new SKUs that have no sales history ' +
        'by reasoning from product attributes, the performance of ' +
        'attribute-similar items, and early test-store or pre-order signal, ' +
        'and structures a test-and-learn read before a full buy. Value comes ' +
        'from raising the new-product hit rate and cutting the markdown ' +
        'carried on newness that the customer never validates.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Attribute-tagged product master data',
        'Historical performance of attribute-similar SKUs',
        'Test-store, pre-order, or early-read sales signal',
        'External trend and search-interest signal',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model produces a forecast range and a test design; a merchant ' +
          'owns the buy decision and the creative and brand judgement.',
        'New-product forecasts are inherently uncertain — they must be ' +
          'shown as ranges with explicit confidence, never false-precision ' +
          'point estimates.',
        'A small or biased test panel will mislead — the test design must ' +
          'be representative of the target stores.',
      ],
      metricsMoved: [
        'new_product_hit_rate',
        'sell_through_rate',
        'markdown_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'space_planogram_intelligence',
      name: 'Space and planogram intelligence',
      valueMechanism:
        'A model recommends category space allocation, shelf placement, and ' +
        'adjacencies from demand, margin, and cross-shopping data, and ' +
        'generates store-specific planograms within fixture constraints. ' +
        'Value comes from moving finite selling space toward where demand ' +
        'and margin actually sit — lifting sales per square foot and ' +
        'attachment without adding inventory.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Category and SKU sales, margin, and space-elasticity data',
        'Store fixture, layout, and capacity data',
        'Basket data for adjacency and cross-shopping signal',
        'Planogram-compliance audit data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes space and planograms; space-planning and store ' +
          'teams own the final layout and execution.',
        'Recommendations must respect operational realities — replenishment ' +
          'labour, fixture limits, and safety and accessibility rules.',
        'Space-elasticity estimates degrade as the assortment changes and ' +
          'must be refreshed.',
      ],
      metricsMoved: [
        'space_productivity_sales_per_sqft',
        'category_attachment_rate',
        'gross_margin_pct',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_merchandise_plan_of_record',
      name: 'Unified merchandise plan of record',
      description:
        'A pattern that puts the merchandise financial plan, the assortment ' +
        'plan, the open-to-buy, and the allocation on one shared, current ' +
        'plan of record, so buying, planning, allocation, and space work ' +
        'from the same numbers rather than reconciling separate ' +
        'spreadsheets after commitments are made.',
      boundary:
        'It holds and reconciles the plan and the actuals against it; it ' +
        'does not place buys or commit vendor orders and does not replace ' +
        'merchant judgement on the range.',
      humanAccountabilityPoint:
        'The divisional merchandise manager accountable for the category ' +
        'plan and its financial targets.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'sku_productivity_scoring_layer',
      name: 'SKU productivity scoring and rationalisation layer',
      description:
        'A pattern that scores every SKU on incremental demand, margin, ' +
        'turn, and cross-shopping contribution, surfaces the unproductive ' +
        'tail with its estimated demand transfer, and feeds a structured ' +
        'add / keep / cut decision into each buy cycle.',
      boundary:
        'It scores and recommends; a merchant owns the add / keep / cut ' +
        'decision and any strategic-range exception. It does not retire a ' +
        'SKU autonomously.',
      humanAccountabilityPoint:
        'The category buyer accountable for the assortment and its ' +
        'productivity.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'demand_signal_layer',
      name: 'True-demand signal layer',
      description:
        'A pattern that assembles a corrected demand signal — sales history ' +
        'de-distorted for stockouts and markdowns, joined with search, ' +
        'browse, wishlist, and trend signal — and serves it as the common ' +
        'input every downstream buying, assortment, and allocation model ' +
        'consumes, rather than each model reading raw sales.',
      boundary:
        'It estimates and serves true demand; it does not size buys or set ' +
        'the assortment itself. It is a read model the planning layers ' +
        'consume.',
      humanAccountabilityPoint:
        'The demand-planning lead accountable for the integrity of the ' +
        'demand signal and its corrections.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'cluster_then_localize',
      name: 'Cluster-then-localise assortment pattern',
      description:
        'A pattern that groups stores into demand-similar clusters, builds ' +
        'a tailored assortment and depth per cluster within a governed ' +
        'chain framework, and bounds localisation so replenishment and ' +
        'allocation stay operable. Cluster definitions are revalidated on a ' +
        'fixed cadence against shifting trade areas.',
      boundary:
        'It proposes clusters and cluster ranges; merchandising and store ' +
        'operations approve the localisation. It does not override the ' +
        'governed chain assortment framework.',
      humanAccountabilityPoint:
        'The merchandise planning director accountable for assortment ' +
        'localisation and its operational feasibility.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'lifecycle_pricing_markdown_loop',
      name: 'Lifecycle inventory and markdown loop',
      description:
        'A pattern that tracks every SKU and store position through its ' +
        'lifecycle — receipt, full-price selling, ageing, markdown, ' +
        'clearance — and triggers timed, surgical markdown recommendations ' +
        'against a clearance deadline, closing the loop from buy through ' +
        'to terminal disposition.',
      boundary:
        'It monitors lifecycle state and recommends markdown timing and ' +
        'depth; a merchant approves every price change and owns ' +
        'minimum-margin floors. It does not change prices autonomously.',
      humanAccountabilityPoint:
        'The category merchant accountable for in-season margin and ' +
        'clearance.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Merchandising value is realised in three connected ways and a ' +
      'forecast must keep them distinct. First, recovered margin: buying ' +
      'closer to demand and rationalising the unproductive tail lifts ' +
      'sell-through and cuts markdown — margin that was leaking into ' +
      'clearance is retained. Second, freed working capital: a tighter, ' +
      'faster-turning assortment carries less average inventory for the ' +
      'same or better sales, releasing cash — a one-time balance-sheet gain ' +
      'distinct from recurring margin. Third, captured sales: better ' +
      'in-stock, localisation, and space allocation convert demand the ' +
      'retailer was losing to stockouts and mismatched ranges. The dominant ' +
      'constraint is that merchandising value depends on execution far ' +
      'downstream of the merchant — allocation, store execution, and ' +
      'replenishment must actually deliver the planned range — so a forecast ' +
      'must be read against the retailer’s operational maturity, not a ' +
      'model-perfect one. Recovered margin and captured sales are recurring ' +
      'once realised; the working-capital release is largely one-time.',
    dominantHaircutFactors: [
      {
        factor: 'Forecast accuracy and demand volatility',
        rationale:
          'Every merchandising bet rests on a demand estimate. Fashion, ' +
          'newness, and trend-driven categories are inherently volatile, ' +
          'and a forecast can only be as good as the signal — so demand ' +
          'uncertainty caps how much of the modelled margin and sell-' +
          'through gain is actually reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from demand-forecast error; a planning range ' +
            'widening with the share of fashion and newness in the mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Downstream execution — allocation and store',
        rationale:
          'A perfect assortment plan still leaks if allocation misplaces ' +
          'inventory, replenishment is slow, or store execution drifts ' +
          'from the planogram. The modelled gain assumes the planned range ' +
          'actually reaches the shelf; partial execution realises a ' +
          'fraction of it.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Forecast erosion from allocation and store-execution gaps; a ' +
            'planning range driven by operational maturity.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Product and master-data readiness',
        rationale:
          'Assortment, substitution, and space models depend on clean, ' +
          'attribute-tagged product master data and accurate perpetual ' +
          'inventory. Sparse attributes and unreliable on-hand data cap how ' +
          'much of the modelled value can be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from incomplete product attributes and ' +
            'inventory-record inaccuracy; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Vendor and supply constraints',
        rationale:
          'Lead times, minimum-order quantities, and vendor terms bound ' +
          'how closely the buy can actually track the recommended demand ' +
          'shape. A model-optimal buy that the supply base cannot deliver ' +
          'at that cadence realises less than the forecast.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled buying gain not reachable under ' +
            'real vendor lead-time and minimum-order constraints; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Markdown-rate reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in the markdown rate from demand-shaped ' +
            'buying and timed clearance; a planning range spanning early ' +
            'and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in markdown dollars as a share of ' +
          'net sales.',
      },
      {
        lever: 'Gross-margin uplift',
        range: {
          low: 1,
          high: 4,
          basis:
            'Percentage-point uplift in gross margin from less markdown, ' +
            'stronger mix, and assortment rationalisation; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in gross margin as a share of net ' +
          'sales.',
      },
      {
        lever: 'Inventory reduction at equal or better sales',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in average inventory at cost from a ' +
            'tighter, faster-turning assortment; a planning range — a ' +
            'largely one-time working-capital release.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in average inventory at cost for ' +
          'equal or better net sales.',
      },
      {
        lever: 'Sales lift from reduced stockouts and localisation',
        range: {
          low: 1,
          high: 5,
          basis:
            'Relative net-sales lift from better in-stock and ' +
            'demand-matched local assortments; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in net sales for the affected ' +
          'categories.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first operational signal in fast-cycle categories ' +
      '(in-stock, sell-through on a replenishment range); 9–18 months to a ' +
      'settled margin result, because the markdown and sell-through ' +
      'improvement only proves out once a full buy cycle or seasonal ' +
      'assortment has run from receipt through clearance.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Merchandising / assortment-planning system',
        role:
          'The system of record for the assortment — the range, the ' +
          'category plan, SKU lifecycle status, and the assortment versions ' +
          'by store or cluster.',
        examples: [
          'Oracle Retail Merchandising',
          'Blue Yonder assortment management',
          'SAP Retail / CAR',
          'o9 / RELEX assortment modules',
        ],
      },
      {
        name: 'Merchandise financial planning (MFP) system',
        role:
          'Holds the financial plan — sales, margin, inventory, and the ' +
          'open-to-buy — against which the buy and the assortment are sized ' +
          'and reconciled.',
        examples: [
          'Oracle Retail MFP',
          'Blue Yonder merchandise financial planning',
          'Anaplan retail planning',
        ],
      },
      {
        name: 'Product master / PIM',
        role:
          'The catalogue of record for product attributes, hierarchy, and ' +
          'classification — the attribute data assortment and space models ' +
          'depend on.',
        examples: [
          'Stibo Systems',
          'Salsify',
          'Akeneo',
          'in-house product information management',
        ],
      },
      {
        name: 'Space-planning / planogram system',
        role:
          'Holds the floor plans, planograms, fixture data, and the ' +
          'category space allocation that turn the assortment into a ' +
          'physical shelf set.',
        examples: [
          'JDA / Blue Yonder space planning',
          'Nielsen Spaceman',
          'Oracle Retail space optimisation',
        ],
      },
      {
        name: 'Point-of-sale and inventory system',
        role:
          'Captures transaction-level sales and basket data and maintains ' +
          'the perpetual inventory record that feeds sell-through, ' +
          'in-stock, and attachment.',
        examples: [
          'POS transaction logs',
          'enterprise inventory management systems',
          'order-management systems',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Merchandising Officer / GMM',
        accountability:
          'Owns the total merchandising strategy, the category portfolio, ' +
          'and the gross-margin and inventory-productivity outcome.',
      },
      {
        title: 'Divisional merchandise manager (DMM)',
        accountability:
          'Owns a group of categories — their assortment strategy, ' +
          'financial plan, and margin performance.',
      },
      {
        title: 'Category buyer / merchant',
        accountability:
          'Owns the assortment and the buy for a category — SKU selection, ' +
          'open-to-buy, vendor negotiation, and in-season margin.',
      },
      {
        title: 'Merchandise / demand planner',
        accountability:
          'Owns the financial plan, the demand forecast, and the ' +
          'sell-through and inventory targets the buy is sized against.',
      },
      {
        title: 'Allocation analyst',
        accountability:
          'Owns the distribution of bought inventory to stores and ' +
          'channels against the assortment and demand plan.',
      },
      {
        title: 'Space-planning manager',
        accountability:
          'Owns the floor plan, planograms, and category space allocation, ' +
          'and the link between the assortment and the shelf.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Product safety and labelling regulation',
        relevance:
          'Consumer-product safety rules and category-specific labelling ' +
          'requirements constrain which products may be ranged and how ' +
          'they must be presented.',
      },
      {
        name: 'Country-of-origin and supply-chain due-diligence rules',
        relevance:
          'Origin-labelling and forced-labour / supply-chain transparency ' +
          'rules govern sourcing and bound the assortment a retailer can ' +
          'compliantly carry.',
      },
      {
        name: 'Trademark, brand, and resale-channel rules',
        relevance:
          'Brand authorisation, selective-distribution agreements, and ' +
          'anti-counterfeiting obligations govern which brands a retailer ' +
          'may range and through which channels.',
      },
      {
        name: 'Category-specific sale restrictions',
        relevance:
          'Age-restricted, regulated, and licensed categories (alcohol, ' +
          'tobacco, pharmacy, firearms) carry sale restrictions that shape ' +
          'where and how those assortments can be carried.',
      },
    ],
    canonicalTerms: [
      {
        term: 'SKU (stock-keeping unit)',
        definition:
          'The most granular sellable unit of the assortment — a specific ' +
          'product in a specific variant — the atom of merchandising.',
      },
      {
        term: 'Open-to-buy (OTB)',
        definition:
          'The budget of inventory dollars or units a merchant is cleared ' +
          'to commit for a period, given the financial plan and inventory ' +
          'already on hand and on order.',
      },
      {
        term: 'Sell-through',
        definition:
          'The share of received units sold within a defined window — the ' +
          'core read on whether a buy was sized to demand.',
      },
      {
        term: 'GMROI',
        definition:
          'Gross margin return on inventory investment — gross margin ' +
          'dollars earned per dollar of average inventory at cost.',
      },
      {
        term: 'Markdown',
        definition:
          'A reduction from the original ticket price, permanent or ' +
          'promotional, used to drive sale or clear inventory.',
      },
      {
        term: 'Planogram',
        definition:
          'A diagram specifying the placement and facings of every product ' +
          'on a fixture — how the assortment is set on the shelf.',
      },
      {
        term: 'Category role',
        definition:
          'The strategic job a category does for the retailer — ' +
          'destination, routine, occasional, or convenience — which sets ' +
          'how it is ranged, priced, and spaced.',
      },
      {
        term: 'Private label',
        definition:
          'Products sold under the retailer’s own brand rather than a ' +
          'national brand — a primary margin and differentiation lever.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Merchandising & Assortment Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the merchandising operation is leaking margin and ' +
        'tying up inventory — in the buy, the assortment, the localisation, ' +
        'or the space plan — with baseline evidence, before a solution is ' +
        'shaped.',
      sections: [
        {
          heading: 'Category and merchandising context',
          guidance:
            'Name the categories in scope, their strategic role, the store ' +
            'fleet and formats, the channel mix, and the buying and ' +
            'planning operating model. State which merchandising, MFP, ' +
            'product-master, and space systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — gross margin, GMROI, sell-through, sales ' +
            'per SKU, markdown rate, in-stock, attachment, new-product hit ' +
            'rate, sales per square foot, private-label penetration, turn. ' +
            'For any metric not recorded, name it as a precise seed gap ' +
            'with its expected data source.',
        },
        {
          heading: 'Assortment and inventory diagnostic',
          guidance:
            'Analyse the SKU productivity distribution, the breadth-versus-' +
            'depth balance, the long tail, and aged inventory; locate where ' +
            'markdown is concentrating and how much of it is avoidable.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — long-tail proliferation, ' +
            'one-size-fits-all assortment, open-to-buy overrun, reactive ' +
            'markdown, planogram drift, newness without validation, siloed ' +
            'planning, demand-signal blindness — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — recovered margin, freed working capital, ' +
            'captured sales — explicitly haircut by forecast accuracy, ' +
            'downstream execution, and data readiness. Every figure a ' +
            'labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric is a ' +
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
      label: 'Merchandising & Assortment Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a merchandising AI ' +
        'Move on these categories — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recovered margin, working-capital release, and captured ' +
            'sales, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — markdown rate, gross margin, sell-through, GMROI, ' +
            'inventory turn. Where a baseline is a seed gap, say so and ' +
            'state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — forecast accuracy, ' +
            'downstream execution, data readiness, vendor constraints — ' +
            'explicitly and show the haircut math. Keep recurring margin ' +
            'and sales gains separate from the one-time working-capital ' +
            'release.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the merchandising, MFP, ' +
            'product-master, and space systems, and the operating-model ' +
            'change — buyer and planner workflow, allocation, and the ' +
            'discontinuation discipline.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker forecast accuracy, ' +
            'partial downstream execution, and a high-volatility category ' +
            'mix. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example product master data too sparse to model ' +
            'assortment — and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including the ' +
            'lagged seasonal sell-through and markdown metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Merchandising & Assortment Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'merchandising AI capability, grounded in the function reference ' +
        'patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — unified merchandise plan of record, SKU ' +
            'productivity scoring, true-demand signal layer, cluster-then-' +
            'localise, lifecycle inventory and markdown loop — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the merchandising, MFP, product-master, space, and ' +
            'POS integrations, the demand-signal sources, data freshness, ' +
            'and the attribute and inventory-accuracy discipline the use ' +
            'cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and how a ' +
            'merchant reviews and overrides recommendations. No archetype ' +
            'ships without a named merchant owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how buyer, planner, allocation, and space workflows ' +
            'change, how the buy and assortment cadence is reshaped, and ' +
            'who owns each change.',
        },
        {
          heading: 'Responsible-AI and governance controls',
          guidance:
            'State the model-monitoring, substitution-validation, and ' +
            'minimum-margin-floor controls, the demand-signal-integrity ' +
            'discipline, and the regulatory frames (product safety, ' +
            'sourcing, category restrictions) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'merchandising stack, and the phased rollout by category and ' +
            'store cluster.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Merchandising & Assortment Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the merchandising AI capability so ' +
        'value reaches gross margin and inventory productivity, not just ' +
        'the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot category or store cluster, buyer and planner ' +
            'onboarding, scale across the assortment — with milestones ' +
            'tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, product-master and demand-signal readiness, ' +
            'buyer and planner adoption, allocation and space alignment, ' +
            'Tower measurement.',
        },
        {
          heading: 'Buyer and planner adoption approach',
          guidance:
            'Define the change runway for buyers, planners, and space ' +
            'teams — training, the shift in the buy and assortment ' +
            'cadence, the discontinuation discipline — and how adoption is ' +
            'measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged seasonal metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — forecast error, allocation and ' +
            'store-execution drift, data-readiness gaps, vendor ' +
            'constraints — with the escalation owner and the trigger for ' +
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
      claim: 'The markdown rate and how much of it is avoidable',
      authoritativeSource:
        'The markdown ledger in the merchandising system reconciled against ' +
        'net sales, broken down into permanent, promotional, and clearance ' +
        'markdown by category.',
      whatGoodEvidenceLooksLike:
        'Markdown dollars by type and category against net sales, with ' +
        'aged-inventory-driven clearance separated from planned promotional ' +
        'markdown so the avoidable share is isolated.',
      weakEvidenceToReject:
        'A blended markdown percentage with no breakdown by type, or a ' +
        'figure that cannot separate planned promotional markdown from ' +
        'reactive clearance.',
    },
    {
      claim: 'Assortment productivity — that the range is earning its keep',
      authoritativeSource:
        'The merchandising system, joining SKU-level sales, margin, and ' +
        'inventory to the active assortment list.',
      whatGoodEvidenceLooksLike:
        'A SKU-level productivity distribution within each category, ' +
        'measured against category peers, that exposes the unproductive ' +
        'tail and its inventory and space cost.',
      weakEvidenceToReject:
        'A category-average sales-per-SKU figure with no within-category ' +
        'distribution, or a cross-category comparison that ignores ' +
        'structural category differences.',
    },
    {
      claim: 'True demand — as distinct from last year’s sales',
      authoritativeSource:
        'Sales history corrected for stockout and markdown distortion, ' +
        'joined with search, browse, and wishlist demand signal.',
      whatGoodEvidenceLooksLike:
        'A demand estimate with the lost-sales and markdown corrections ' +
        'made explicit and the correction method stated, so the buy is ' +
        'sized to demand rather than to a distorted sales history.',
      weakEvidenceToReject:
        'Raw prior-year sales presented as demand, or a forecast that ' +
        'makes no adjustment for the stockouts and markdowns embedded in ' +
        'the history.',
    },
    {
      claim: 'In-stock and the sales lost to stockouts',
      authoritativeSource:
        'Perpetual inventory in the merchandising system validated against ' +
        'cycle counts and POS sales.',
      whatGoodEvidenceLooksLike:
        'An in-stock rate for the active assortment validated against ' +
        'physical counts, with an estimate of lost sales during ' +
        'out-of-stock periods.',
      weakEvidenceToReject:
        'A perpetual-inventory in-stock figure never validated against a ' +
        'physical count, or an availability claim with no estimate of the ' +
        'sales lost to stockouts.',
    },
    {
      claim: 'The forecast value of a merchandising AI Move',
      authoritativeSource:
        'The value model — recovered margin, working-capital release, and ' +
        'captured sales, each haircut by its dominant factors — read ' +
        'against the retailer’s category mix and operational maturity.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring margin separated from the ' +
        'one-time working-capital release, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores forecast-accuracy and ' +
        'downstream-execution haircuts.',
    },
  ],
};
