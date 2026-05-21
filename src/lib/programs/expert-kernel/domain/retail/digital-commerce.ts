// Domain Function Pack — Retail · Digital commerce.
//
// Function key: `digital_commerce`.
//
// Digital commerce is the function that owns the retailer's online storefront
// as a revenue engine: the site and app experience, the path from landing to
// add-to-cart to a completed order, on-site search and product discovery, the
// quality and conversion power of the product detail page, and the page-speed
// and Core Web Vitals that decide whether a session ever becomes a sale. It is
// judged on conversion — the share of visits that turn into orders — and on
// average order value, because together those two numbers, multiplied by
// traffic, are digital revenue.
//
// It sits downstream of marketing & retail media (which buys the traffic) and
// upstream of supply chain & fulfillment (which delivers the order). This pack
// is the conversion layer in between: it does not own how the visitor arrived
// or how the parcel ships — it owns whether the visit converts and how large
// the basket is when it does.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const digitalCommercePack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'digital_commerce',
  functionLabel: 'Digital commerce',
  summary:
    'Digital commerce is the function that runs the retailer’s online store ' +
    'as a revenue engine: the site and app experience, on-site search and ' +
    'product discovery, the product detail page, the checkout, and the ' +
    'page-speed and Core Web Vitals that gate whether a session converts at ' +
    'all. Its economics are conversion rate and average order value — ' +
    'multiplied by traffic, they are digital revenue — set against the cost ' +
    'of returns and the friction of a checkout that leaks baskets. It sits ' +
    'between marketing, which buys the traffic, and fulfillment, which ships ' +
    'the order; it owns the part in the middle — turning an arriving visit ' +
    'into a completed, profitable order, and is judged on conversion earned ' +
    'against the traffic it was handed, not on how polished the site looks.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'ecommerce_conversion_rate',
      name: 'E-commerce conversion rate',
      definition:
        'The share of site or app sessions that result in a completed, paid ' +
        'order within the session window — orders divided by sessions, for ' +
        'the digital channel.',
      unit: '% of sessions',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 1.5,
        high: 4,
        basis:
          'Session-level conversion varies sharply by segment and device — ' +
          'considered-purchase and high-AOV categories sit low, repeat-buy ' +
          'consumables sit high. A planning range; the category and traffic ' +
          'mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The web and app analytics platform reconciled against completed ' +
        'orders in the order-management system.',
      whyItMatters:
        'It is the headline efficiency of the storefront — the multiplier ' +
        'that turns bought traffic into revenue; a point of conversion is ' +
        'worth more than the equivalent spend on incremental traffic.',
    },
    {
      key: 'average_order_value',
      name: 'Average order value (AOV)',
      definition:
        'Net merchandise revenue for the digital channel divided by the ' +
        'count of completed orders over the period — the average basket size ' +
        'at the point of a paid order.',
      unit: 'net revenue $ per order',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 150,
        basis:
          'AOV is structural by category — consumables and fast fashion run ' +
          'low, furniture and electronics run high. A planning range; the ' +
          'tenant assortment sets the point, not a cross-segment figure.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management system, net of cancellations and pre-shipment ' +
        'returns.',
      whyItMatters:
        'AOV is the second lever of digital revenue alongside conversion — ' +
        'lifting basket size through recommendation, attachment, and ' +
        'merchandising adds revenue without buying a single new visit.',
    },
    {
      key: 'cart_abandonment_rate',
      name: 'Cart-abandonment rate',
      definition:
        'The share of sessions that add at least one item to the cart but ' +
        'do not complete a paid order — abandoned carts divided by carts ' +
        'created.',
      unit: '% of carts created',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 65,
        high: 80,
        basis:
          'A large majority of created carts are abandoned across retail; ' +
          'much of it is browsing intent rather than checkout friction. A ' +
          'planning range — the gap worth recovering is the friction share.',
        label: 'planning-range',
      },
      dataSource:
        'The web and app analytics platform, tracking cart-creation events ' +
        'against completed-order events.',
      whyItMatters:
        'The abandoned cart is the clearest pool of recoverable demand — a ' +
        'visitor who signalled intent and did not finish; isolating the ' +
        'friction-driven share of it is a direct conversion lever.',
    },
    {
      key: 'site_search_success_rate',
      name: 'Site-search success rate',
      definition:
        'The share of on-site search queries that lead to a product-detail ' +
        'view or an add-to-cart, rather than a zero-result or abandoned ' +
        'search.',
      unit: '% of search sessions',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 70,
        basis:
          'Search-success depends on catalogue attribution, synonym ' +
          'coverage, and query intent; long-tail and natural-language ' +
          'queries fail more often. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The on-site search engine query logs joined to downstream ' +
        'product-view and add-to-cart events in the analytics platform.',
      whyItMatters:
        'Searchers convert at a multiple of browsers — they have stated ' +
        'intent; a failed search is high-intent demand the site discarded, ' +
        'and search success is where that demand is won or lost.',
    },
    {
      key: 'page_load_core_web_vitals',
      name: 'Page-load performance / Core Web Vitals',
      definition:
        'The share of page views that meet the “good” thresholds for the ' +
        'Core Web Vitals — largest contentful paint, interaction-to-next-' +
        'paint, and cumulative layout shift — across the digital storefront.',
      unit: '% of page views meeting all three thresholds',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 85,
        basis:
          'Field-measured Core Web Vitals pass rates vary with image weight, ' +
          'third-party tags, and device mix; mobile lags desktop. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Real-user-monitoring field data in the web-performance / analytics ' +
        'platform, not synthetic lab scores alone.',
      whyItMatters:
        'Page speed is a direct conversion input — every additional second ' +
        'of load measurably depresses conversion, and it also feeds organic ' +
        'search ranking; it is the cheapest conversion lever to ignore.',
    },
    {
      key: 'mobile_conversion_rate',
      name: 'Mobile conversion rate',
      definition:
        'The e-commerce conversion rate for sessions on mobile web and the ' +
        'mobile app specifically — completed orders divided by mobile ' +
        'sessions.',
      unit: '% of mobile sessions',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 1,
        high: 3,
        basis:
          'Mobile carries the majority of retail traffic but converts below ' +
          'desktop — the mobile conversion gap is structural and a primary ' +
          'optimisation target. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The web and app analytics platform segmented by device class, ' +
        'reconciled to the order-management system.',
      whyItMatters:
        'Mobile is where most of the traffic is and where most of the ' +
        'conversion is lost; closing the mobile-to-desktop conversion gap is ' +
        'the largest single conversion opportunity on most storefronts.',
    },
    {
      key: 'checkout_completion_rate',
      name: 'Checkout-completion rate',
      definition:
        'The share of sessions that enter the checkout flow and complete a ' +
        'paid order — checkout completions divided by checkout starts.',
      unit: '% of checkout starts',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 70,
        basis:
          'Checkout completion is gated by friction — forced account ' +
          'creation, payment options, shipping-cost surprise, form length. ' +
          'A planning range; lower than cart conversion because intent here ' +
          'is already high.',
        label: 'planning-range',
      },
      dataSource:
        'The analytics platform funnel instrumentation across the checkout ' +
        'steps, reconciled to completed orders.',
      whyItMatters:
        'A checkout drop is the most expensive abandonment — the visitor ' +
        'has chosen the product and committed to buy; friction in the last ' +
        'steps loses revenue that was effectively already earned.',
    },
    {
      key: 'pdp_engagement_rate',
      name: 'Product-detail-page engagement rate',
      definition:
        'The share of product-detail-page views that produce a meaningful ' +
        'engagement — an add-to-cart, a media interaction, or a review or ' +
        'specification expansion — rather than an immediate bounce.',
      unit: '% of product-detail-page views',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 50,
        basis:
          'Product-detail-page engagement depends on content quality — ' +
          'imagery, copy, reviews, availability clarity; thin or ' +
          'placeholder content depresses it. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The analytics platform event instrumentation on the product-detail ' +
        'page joined to the content-management and catalogue systems.',
      whyItMatters:
        'The product-detail page is where the buying decision is actually ' +
        'made; weak content there wastes the marketing spend that delivered ' +
        'the visitor and is a precise, fixable conversion leak.',
    },
    {
      key: 'online_return_rate',
      name: 'Online return rate',
      definition:
        'The share of shipped digital-channel order units returned by the ' +
        'customer within the return window — returned units divided by ' +
        'shipped units.',
      unit: '% of shipped units',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 30,
        basis:
          'Online return rates are structurally high and category-driven — ' +
          'apparel and footwear run far above hardlines and consumables. A ' +
          'planning range; the assortment mix sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management and returns systems, joined to shipped-order ' +
        'data, classified by return reason.',
      whyItMatters:
        'Returns convert a recorded sale into a net loss after reverse ' +
        'logistics and refurbishment; a return rate driven by content or ' +
        'sizing errors is a digital-commerce problem, not a fulfillment one.',
    },
    {
      key: 'digital_revenue_mix',
      name: 'Digital revenue mix',
      definition:
        'The share of total retail net revenue generated through digital ' +
        'channels — site, app, and marketplace — rather than physical ' +
        'stores.',
      unit: '% of total net revenue',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 15,
        high: 45,
        basis:
          'Digital penetration is a deliberate strategic setting and ' +
          'varies enormously by segment and operating model. A planning ' +
          'range, not a target — the right point depends on the retailer’s ' +
          'channel strategy.',
        label: 'planning-range',
      },
      dataSource:
        'The enterprise financial system, channel-tagged revenue ' +
        'reconciled against the order-management system.',
      whyItMatters:
        'It sizes how much of the retailer’s economics depend on the ' +
        'digital function — and therefore how much enterprise value a ' +
        'conversion or AOV improvement actually moves.',
    },
    {
      key: 'add_to_cart_rate',
      name: 'Add-to-cart rate',
      definition:
        'The share of sessions in which the visitor adds at least one item ' +
        'to the cart — add-to-cart sessions divided by total sessions.',
      unit: '% of sessions',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 6,
        high: 14,
        basis:
          'Add-to-cart rate sits between traffic quality and discovery ' +
          'effectiveness; it varies with category consideration and ' +
          'merchandising. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The analytics platform funnel instrumentation, add-to-cart events ' +
        'against sessions.',
      whyItMatters:
        'It isolates the discovery-and-consideration half of the funnel ' +
        'from the checkout half — separating a “cannot find or be convinced” ' +
        'problem from a “cannot complete” problem so the leak is diagnosed ' +
        'precisely.',
    },
    {
      key: 'repeat_purchase_rate',
      name: 'Digital repeat-purchase rate',
      definition:
        'The share of digital-channel customers in a cohort who place a ' +
        'second or subsequent order within a defined window — a read on ' +
        'whether the storefront earns a returning customer.',
      unit: '% of customers in the cohort',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 45,
        basis:
          'Repeat rate is category-driven — consumables and replenishment ' +
          'run high, considered one-off purchases run low. A planning range; ' +
          'measured on a fixed-window cohort.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-data and order-management systems, cohorted by first ' +
        'order date.',
      whyItMatters:
        'A repeat customer costs nothing to acquire and converts at a ' +
        'multiple of a new visitor; repeat rate is where digital revenue ' +
        'compounds rather than being re-bought every period.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'search_discovery_failure',
      name: 'On-site search and discovery failure',
      description:
        'High-intent searchers hit zero-result pages, irrelevant results, ' +
        'or rankings that bury the items they want. The catalogue is poorly ' +
        'attributed, synonyms are unmanaged, and natural-language queries ' +
        'are not understood — so the visitors most likely to buy are the ' +
        'ones the site fails.',
      detectionSignal:
        'A material share of search queries return zero results or no ' +
        'click-through; search-success rate sits low and searcher ' +
        'conversion barely exceeds browser conversion.',
      diagnosticQuestion:
        'What share of on-site searches end in a zero-result or abandoned ' +
        'search, and how is catalogue attribution and synonym coverage ' +
        'maintained?',
    },
    {
      key: 'checkout_friction',
      name: 'Checkout friction and basket leakage',
      description:
        'The checkout loses committed buyers to avoidable friction — forced ' +
        'account creation, a long multi-step form, late shipping-cost ' +
        'surprise, missing payment options, or errors with no recovery ' +
        'path. The most expensive abandonment happens after the customer ' +
        'has already decided to buy.',
      detectionSignal:
        'Checkout-completion rate drops sharply at an identifiable step; ' +
        'guest-checkout is unavailable or shipping cost first appears late ' +
        'in the flow.',
      diagnosticQuestion:
        'Where in the checkout funnel do committed buyers drop, and which ' +
        'of those drops are avoidable friction rather than genuine intent ' +
        'loss?',
    },
    {
      key: 'thin_pdp_content',
      name: 'Thin or inconsistent product-detail content',
      description:
        'Product detail pages carry placeholder copy, sparse or low-quality ' +
        'imagery, missing specifications, and no reviews — so the page ' +
        'where the buying decision is made cannot make the case. New SKUs ' +
        'launch with incomplete content and stay that way.',
      detectionSignal:
        'Product-detail-page engagement and conversion vary widely with ' +
        'content completeness; a large share of the catalogue is below a ' +
        'defined content-completeness standard.',
      diagnosticQuestion:
        'What share of the live catalogue meets the product-content ' +
        'completeness standard, and how is content produced and kept ' +
        'current as SKUs change?',
    },
    {
      key: 'mobile_experience_gap',
      name: 'Mobile experience and conversion gap',
      description:
        'The majority of traffic is on mobile but the experience is a ' +
        'shrunk desktop design — slow, tap-target-cramped, with a checkout ' +
        'never built for a thumb. Mobile converts far below desktop and the ' +
        'gap is treated as inevitable rather than diagnosed.',
      detectionSignal:
        'Mobile conversion sits well below desktop on the same traffic; ' +
        'mobile Core Web Vitals fail at a higher rate than desktop.',
      diagnosticQuestion:
        'How large is the mobile-to-desktop conversion gap, and is the ' +
        'mobile experience and checkout designed mobile-first or inherited ' +
        'from desktop?',
    },
    {
      key: 'page_speed_degradation',
      name: 'Page-speed and Core Web Vitals degradation',
      description:
        'Pages load slowly and shift under the visitor — heavy unoptimised ' +
        'imagery, an accumulation of third-party tags and scripts, and ' +
        'render-blocking resources. Speed degrades silently as tags are ' +
        'added, and conversion erodes with it.',
      detectionSignal:
        'Core Web Vitals field pass rates trend down; conversion and bounce ' +
        'correlate with measured load time across page templates.',
      diagnosticQuestion:
        'What is the field-measured Core Web Vitals pass rate by template, ' +
        'and what governs the third-party tags and scripts loaded on the ' +
        'storefront?',
    },
    {
      key: 'generic_undifferentiated_experience',
      name: 'Generic, undifferentiated on-site experience',
      description:
        'Every visitor sees the same homepage, the same category sort, the ' +
        'same recommendations, regardless of intent, history, or context. ' +
        'The storefront cannot adapt merchandising to the visitor, so it ' +
        'underserves both the new browser and the returning high-value ' +
        'customer.',
      detectionSignal:
        'Recommendation and merchandising slots show no personalisation ' +
        'lift in test; category and landing pages are static across ' +
        'audiences.',
      diagnosticQuestion:
        'How does the on-site experience — recommendations, sort, ' +
        'merchandising — adapt to visitor intent and history, and is the ' +
        'lift from doing so measured?',
    },
    {
      key: 'returns_driven_by_experience',
      name: 'Returns driven by the digital experience',
      description:
        'A large share of returns trace back to the storefront, not the ' +
        'product — wrong-size purchases from missing fit guidance, ' +
        '“not as described” returns from inaccurate imagery or copy. The ' +
        'return is recorded as a logistics cost and its digital root cause ' +
        'is never diagnosed.',
      detectionSignal:
        'Return reasons concentrate in fit and “not as described” codes; ' +
        'return rate varies sharply with product-content quality.',
      diagnosticQuestion:
        'What share of online returns trace to fit or description error ' +
        'rather than genuine product fault, and is return reason fed back ' +
        'to the content and sizing teams?',
    },
    {
      key: 'analytics_attribution_blindness',
      name: 'Funnel-analytics and attribution blindness',
      description:
        'The conversion funnel is not instrumented end to end — drop-off ' +
        'cannot be located to a step, device, or template. Optimisation is ' +
        'opinion-led rather than evidence-led, and A/B tests are run rarely ' +
        'or read without significance discipline.',
      detectionSignal:
        'Funnel drop-off cannot be attributed to a specific step or ' +
        'segment; experiment cadence is low and results are read without a ' +
        'stated significance bar.',
      diagnosticQuestion:
        'Is the conversion funnel instrumented step by step and segmentable ' +
        'by device, and is optimisation driven by controlled experiments ' +
        'with a stated significance discipline?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'semantic_search_discovery',
      name: 'Semantic search and product discovery',
      valueMechanism:
        'A model interprets the intent behind a query — natural language, ' +
        'misspellings, attribute combinations, and visual or conversational ' +
        'input — and ranks results by predicted relevance and conversion ' +
        'rather than keyword match. Value comes from converting failed and ' +
        'low-relevance searches into product views and add-to-carts: ' +
        'high-intent demand the keyword engine was discarding.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Attribute-tagged product catalogue and content',
        'On-site search query logs and click-through behaviour',
        'Conversion outcomes joined to query and result data',
        'Synonym, taxonomy, and query-intent training data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Merchandising owns ranking-rule overrides and pinned results — the ' +
          'model proposes relevance, a merchant can override on strategic ' +
          'or margin grounds.',
        'Relevance and zero-result rates must be monitored — a model that ' +
          'silently degrades on new catalogue is a hidden conversion leak.',
        'Ranking must not over-optimise for short-term conversion at the ' +
          'expense of catalogue discovery and long-tail visibility.',
      ],
      metricsMoved: [
        'site_search_success_rate',
        'ecommerce_conversion_rate',
        'add_to_cart_rate',
        'pdp_engagement_rate',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
    {
      key: 'product_recommendations',
      name: 'Product recommendations and on-site personalisation',
      valueMechanism:
        'A model predicts which products a visitor is most likely to buy ' +
        'next — from session behaviour, purchase history, and product ' +
        'affinity — and serves them into recommendation, cross-sell, and ' +
        'upsell slots. Value comes from lifting both conversion and average ' +
        'order value: surfacing the right next product earns add-to-carts ' +
        'and basket attachment the static merchandised slot does not.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Session clickstream and browsing behaviour',
        'Customer purchase and order history',
        'Product affinity and co-purchase data',
        'Real-time inventory availability to avoid recommending stockouts',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Merchandising owns business-rule guardrails — margin floors, ' +
          'brand exclusions, strategic-product boosts — layered over the ' +
          'model’s ranking.',
        'Recommendations must respect availability — recommending an ' +
          'out-of-stock item wastes the slot and frustrates the visitor.',
        'The lift must be measured against a holdout, not assumed; a ' +
          'recommender can cannibalise rather than add basket value.',
      ],
      metricsMoved: [
        'average_order_value',
        'ecommerce_conversion_rate',
        'add_to_cart_rate',
        'repeat_purchase_rate',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
    {
      key: 'conversion_rate_optimization',
      name: 'AI-driven conversion-rate optimisation and experimentation',
      valueMechanism:
        'A model analyses funnel telemetry to locate where conversion leaks ' +
        'by step, device, and segment, proposes experiment hypotheses, and ' +
        'accelerates the test-and-learn loop — including multi-armed-bandit ' +
        'allocation of traffic to winning variants. Value comes from ' +
        'compounding many evidence-validated conversion gains the manual, ' +
        'opinion-led optimisation cadence never reaches.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'End-to-end funnel-instrumented analytics data',
        'Experiment history and outcome data',
        'Session segmentation by device, source, and behaviour',
        'A controlled-experiment platform with significance discipline',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A product or experimentation lead owns which hypotheses ship and ' +
          'reads results against a stated significance bar — the model ' +
          'proposes, it does not declare winners.',
        'Bandit allocation must guard against optimising a local metric ' +
          '(clicks) at the expense of the real outcome (orders, margin).',
        'Experiment results must be checked for novelty effects and ' +
          'segment heterogeneity before a variant is rolled out fully.',
      ],
      metricsMoved: [
        'ecommerce_conversion_rate',
        'checkout_completion_rate',
        'mobile_conversion_rate',
        'cart_abandonment_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'dynamic_onsite_merchandising',
      name: 'Dynamic on-site merchandising',
      valueMechanism:
        'A model sequences category-page sort, landing-page modules, and ' +
        'merchandising slots in response to visitor intent, real-time ' +
        'inventory, margin, and trend signal — so the storefront ' +
        'merchandises itself rather than running a static, manually curated ' +
        'layout. Value comes from putting the products most likely to ' +
        'convert and most worth selling in front of each visitor.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Real-time browsing and intent signal',
        'Product margin, inventory, and sell-through data',
        'Category-page interaction and conversion telemetry',
        'Merchandising business rules and strategic-product flags',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'Merchandising owns the guardrails — strategic boosts, brand and ' +
          'category rules, newness placement — that bound the model’s sort.',
        'Dynamic sort must not strip discoverability from the long tail or ' +
          'destabilise the experience for returning visitors.',
        'Inventory-aware sort must use fresh availability data — promoting ' +
          'a near-stockout item degrades both conversion and trust.',
      ],
      metricsMoved: [
        'ecommerce_conversion_rate',
        'pdp_engagement_rate',
        'add_to_cart_rate',
        'average_order_value',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
    {
      key: 'product_content_generation',
      name: 'AI product-content generation for product detail pages',
      valueMechanism:
        'A generative model drafts product titles, descriptions, ' +
        'specification tables, and structured attributes from supplier ' +
        'data, imagery, and category templates — at catalogue scale and in ' +
        'a consistent voice. Value comes from closing the thin-content gap ' +
        'that depresses product-detail engagement, conversion, and organic ' +
        'search visibility, and from launching new SKUs complete on day one.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Supplier and manufacturer product data and imagery',
        'Category content templates and the brand voice guide',
        'Existing high-performing product-content examples',
        'Catalogue attribute schema and taxonomy',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'A content or merchandising editor reviews and approves drafted ' +
          'content before publish — generated copy is a draft, never an ' +
          'auto-published claim.',
        'Generated claims about safety, compliance, materials, or ' +
          'performance must be verified against source data — fabricated ' +
          'product claims are a legal and trust risk.',
        'Output must be checked for accuracy against the actual SKU — a ' +
          'plausible but wrong specification drives returns.',
      ],
      metricsMoved: [
        'pdp_engagement_rate',
        'ecommerce_conversion_rate',
        'online_return_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'checkout_fraud_detection',
      name: 'Checkout fraud detection and friction balancing',
      valueMechanism:
        'A model scores each transaction for fraud risk in real time and ' +
        'routes it — clear, challenge with step-up verification, or block — ' +
        'balancing fraud loss against the false-decline of legitimate ' +
        'orders. Value comes from cutting chargeback and fraud loss while ' +
        'recovering the revenue and lifetime value lost when good customers ' +
        'are wrongly declined or over-challenged at checkout.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Transaction, device, and behavioural signals at checkout',
        'Historical fraud, chargeback, and confirmed-good order labels',
        'Payment-authorisation and address-verification data',
        'Customer account and order-history data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A fraud-operations lead owns the risk thresholds and the ' +
          'false-decline tolerance — the model scores, the policy decides.',
        'False-decline rate must be monitored as closely as fraud loss — ' +
          'over-blocking quietly destroys legitimate revenue and lifetime ' +
          'value.',
        'The model must be checked for disparate false-decline impact ' +
          'across customer segments and geographies.',
      ],
      metricsMoved: [
        'checkout_completion_rate',
        'ecommerce_conversion_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'intent_aware_discovery_layer',
      name: 'Intent-aware discovery and search layer',
      description:
        'A pattern that places a semantic-relevance engine between the ' +
        'visitor and the catalogue — interpreting query intent, ranking by ' +
        'predicted relevance and conversion, and serving search, browse, ' +
        'and recommendation from one consistent relevance model rather than ' +
        'separate keyword and rule systems.',
      boundary:
        'It ranks and recommends; it does not own the catalogue content ' +
        'itself and does not override merchandising business rules — those ' +
        'are layered on top. It is a relevance service the storefront ' +
        'consumes.',
      humanAccountabilityPoint:
        'The head of digital merchandising accountable for on-site ' +
        'discovery, relevance quality, and the ranking guardrails.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'personalization',
    },
    {
      key: 'unified_customer_session_profile',
      name: 'Unified customer and session profile',
      description:
        'A pattern that assembles a single, real-time view of the visitor ' +
        '— identity, session behaviour, purchase history, and consented ' +
        'attributes — and serves it as the common input every ' +
        'personalisation, recommendation, and merchandising model reads, ' +
        'rather than each surface inferring the visitor independently.',
      boundary:
        'It assembles and serves the profile under consent; it does not ' +
        'make merchandising decisions itself and does not write to the ' +
        'order or payment systems. It is a read model.',
      humanAccountabilityPoint:
        'The customer-data-platform owner accountable for profile ' +
        'integrity, identity resolution, and consent enforcement.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'experimentation_platform',
      name: 'Governed experimentation and optimisation platform',
      description:
        'A pattern that runs all storefront changes through a controlled ' +
        'experiment platform — hypothesis, variant, traffic allocation, ' +
        'significance test, and rollout — so conversion optimisation is ' +
        'evidence-led, with a model proposing hypotheses and bandit ' +
        'allocation accelerating winners within a governed framework.',
      boundary:
        'It tests and measures; it does not decide strategy or ship a ' +
        'change autonomously — a product owner approves rollout against a ' +
        'stated significance bar.',
      humanAccountabilityPoint:
        'The director of digital product accountable for the experiment ' +
        'roadmap and the rollout decisions.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'content_supply_chain',
      name: 'Product-content supply chain',
      description:
        'A pattern that runs product content as a managed pipeline — ' +
        'supplier data ingested, AI-drafted to a category template and ' +
        'brand voice, human-reviewed, enriched with imagery and reviews, ' +
        'published, and kept current — so the catalogue meets a defined ' +
        'content-completeness standard and new SKUs launch complete.',
      boundary:
        'It produces and governs content; it does not set the assortment ' +
        'or the price, and every generated draft passes human review before ' +
        'publish. It is a content pipeline, not an autonomous publisher.',
      humanAccountabilityPoint:
        'The product-content operations lead accountable for catalogue ' +
        'content completeness and accuracy.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'instrumented_conversion_funnel',
      name: 'Instrumented end-to-end conversion funnel',
      description:
        'A pattern that instruments every step of the path from landing to ' +
        'paid order — segmentable by device, source, and behaviour — and ' +
        'serves it as a single funnel model, so drop-off is attributable to ' +
        'a precise step and segment and every optimisation has a measured ' +
        'baseline.',
      boundary:
        'It measures and attributes; it does not change the experience ' +
        'itself. It is the read layer the optimisation and experimentation ' +
        'patterns depend on.',
      humanAccountabilityPoint:
        'The digital-analytics lead accountable for funnel-instrumentation ' +
        'integrity and the metric definitions.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Digital-commerce value is realised in three connected ways and a ' +
      'forecast must keep them distinct. First, conversion uplift: turning ' +
      'a larger share of the same bought traffic into orders — every point ' +
      'of conversion is revenue that costs nothing in incremental media. ' +
      'Second, basket uplift: recommendation, attachment, and merchandising ' +
      'lift average order value on the orders that do convert. Third, ' +
      'avoided cost: better content and sizing guidance reduce returns, and ' +
      'fraud-decisioning cuts chargeback loss and false-decline revenue ' +
      'leakage. The dominant constraint is that conversion and AOV gains ' +
      'are multiplied by traffic and AOV the function does not itself ' +
      'control — a conversion lift on thin or low-intent traffic realises ' +
      'far less than the model implies — so a forecast must be read against ' +
      'the retailer’s actual traffic quality and digital revenue mix. ' +
      'Conversion and basket uplift are recurring once realised; the ' +
      'return-rate and fraud savings are recurring too but bounded by the ' +
      'share of the problem that is genuinely experience-driven.',
    dominantHaircutFactors: [
      {
        factor: 'Traffic quality and intent mix',
        rationale:
          'A conversion model can only work with the demand it is handed. ' +
          'Low-intent, poorly targeted, or bot-inflated traffic caps how ' +
          'much of the modelled conversion uplift is reachable — the ' +
          'storefront cannot convert a visitor who never had buying ' +
          'intent.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'Value erosion from low-intent and poorly targeted traffic; a ' +
            'planning range widening as paid and untargeted traffic grows ' +
            'as a share of the mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data and instrumentation readiness',
        rationale:
          'Personalisation, recommendation, and optimisation depend on ' +
          'clean clickstream, a resolved customer profile, an attributed ' +
          'catalogue, and an end-to-end-instrumented funnel. Sparse ' +
          'attributes and broken instrumentation cap how much of the ' +
          'modelled value can be delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Forecast erosion from catalogue-attribute gaps, broken funnel ' +
            'instrumentation, and weak identity resolution; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Site performance and platform constraints',
        rationale:
          'Conversion gains assume the storefront is fast and stable. A ' +
          'slow page, a rigid commerce platform, or an inability to deploy ' +
          'experiences quickly bounds how much of the modelled uplift can ' +
          'actually ship and hold.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from page-speed and platform-agility ' +
            'constraints; a planning range driven by platform maturity.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Experimentation and adoption discipline',
        rationale:
          'Modelled conversion gains realise only if the organisation can ' +
          'run controlled experiments, read them with significance ' +
          'discipline, and ship winners at a steady cadence. A low ' +
          'experiment velocity strands a large share of the opportunity.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The share of a modelled conversion gain not realised under a ' +
            'low experiment velocity and weak rollout discipline; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Conversion-rate uplift',
        range: {
          low: 5,
          high: 25,
          basis:
            'Relative uplift in e-commerce conversion from semantic ' +
            'discovery, personalisation, checkout optimisation, and ' +
            'experimentation; a planning range spanning early and mature ' +
            'adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in the e-commerce conversion rate for ' +
          'the affected traffic.',
      },
      {
        lever: 'Average-order-value uplift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative uplift in average order value from recommendations, ' +
            'cross-sell, and dynamic merchandising; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in average order value for the ' +
          'affected orders.',
      },
      {
        lever: 'Online return-rate reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in the online return rate from better ' +
            'product content and fit guidance; a planning range bounded by ' +
            'the experience-driven share of returns.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the online return rate for the ' +
          'affected categories.',
      },
      {
        lever: 'Fraud and false-decline loss reduction',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative reduction in combined fraud-chargeback and ' +
            'false-decline revenue loss from improved checkout ' +
            'decisioning; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in combined chargeback loss and ' +
          'false-decline lost revenue.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable conversion signal from a ' +
      'discrete optimisation (search relevance, a checkout fix); 9–15 ' +
      'months to a settled revenue result, because the conversion, AOV, ' +
      'and return-rate gains only compound once a steady experimentation ' +
      'cadence has run across enough traffic and a full content refresh ' +
      'has worked through the catalogue.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'E-commerce / digital experience platform',
        role:
          'The system of record for the storefront — the site and app ' +
          'experience, category and product pages, the cart, and the ' +
          'checkout flow.',
        examples: [
          'Salesforce Commerce Cloud',
          'Adobe Commerce',
          'Shopify Plus',
          'commercetools',
          'SAP Commerce Cloud',
        ],
      },
      {
        name: 'On-site search and discovery engine',
        role:
          'Powers query interpretation, results ranking, browse ' +
          'navigation, and on-site recommendations.',
        examples: [
          'Algolia',
          'Bloomreach Discovery',
          'Constructor',
          'Coveo',
          'Lucidworks',
        ],
      },
      {
        name: 'Product information management (PIM) and content / DAM',
        role:
          'The catalogue of record for product attributes and the managed ' +
          'store of product imagery, video, and copy that the product ' +
          'detail page is built from.',
        examples: ['Salsify', 'Akeneo', 'inriver', 'Cloudinary', 'Bynder'],
      },
      {
        name: 'Web and app analytics and experimentation platform',
        role:
          'Captures the clickstream and funnel telemetry and runs the ' +
          'controlled experiments that conversion optimisation depends on.',
        examples: [
          'Google Analytics 4 / BigQuery',
          'Adobe Analytics',
          'Amplitude',
          'Optimizely',
          'real-user-monitoring tools',
        ],
      },
      {
        name: 'Customer data platform (CDP) and order-management system',
        role:
          'Holds the resolved customer profile and consent, and the ' +
          'order-management system is the system of record for the order, ' +
          'its status, and returns.',
        examples: [
          'Segment',
          'Tealium',
          'Adobe Real-Time CDP',
          'order-management systems',
        ],
      },
      {
        name: 'Payment and fraud-decisioning platform',
        role:
          'Processes payment authorisation at checkout and scores ' +
          'transactions for fraud risk and false-decline balance.',
        examples: ['Stripe', 'Adyen', 'Signifyd', 'Riskified', 'Forter'],
      },
    ],
    roles: [
      {
        title: 'Chief Digital Officer / VP E-commerce',
        accountability:
          'Owns the digital-channel P&L — digital revenue, conversion, and ' +
          'the overall storefront strategy.',
      },
      {
        title: 'Director of digital product / e-commerce product manager',
        accountability:
          'Owns the storefront experience roadmap, the experimentation ' +
          'programme, and the conversion-funnel performance.',
      },
      {
        title: 'Head of digital merchandising / on-site merchandiser',
        accountability:
          'Owns on-site discovery, search relevance, category-page ' +
          'merchandising, and the ranking and recommendation guardrails.',
      },
      {
        title: 'Product-content operations lead',
        accountability:
          'Owns catalogue content completeness, accuracy, and the ' +
          'product-content production pipeline.',
      },
      {
        title: 'Digital analytics / conversion-optimisation lead',
        accountability:
          'Owns funnel instrumentation, metric definitions, and the ' +
          'controlled-experiment discipline.',
      },
      {
        title: 'Fraud and payments operations lead',
        accountability:
          'Owns checkout fraud thresholds, the false-decline tolerance, ' +
          'and chargeback performance.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Consumer-privacy and consent regulation (GDPR, CCPA / CPRA)',
        relevance:
          'Governs the collection and use of behavioural and customer ' +
          'data for personalisation and recommendation — consent and ' +
          'data-minimisation rules bound what the profile may hold and use.',
      },
      {
        name: 'Payment Card Industry Data Security Standard (PCI DSS)',
        relevance:
          'Governs how payment-card data is handled in the checkout and ' +
          'payment flow — it constrains the checkout architecture and the ' +
          'fraud-decisioning design.',
      },
      {
        name: 'Web accessibility regulation (ADA / WCAG, EU Accessibility ' +
          'Act)',
        relevance:
          'The storefront must meet accessibility standards — accessibility ' +
          'is both a legal obligation and a conversion factor for a ' +
          'material share of visitors.',
      },
      {
        name: 'E-commerce consumer-protection and advertising rules',
        relevance:
          'Distance-selling, pricing-display, and return-rights rules, and ' +
          'truth-in-advertising standards, govern product claims, displayed ' +
          'pricing, and the checkout disclosures.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Conversion rate',
        definition:
          'The share of sessions that result in a completed paid order — ' +
          'the headline efficiency measure of the storefront.',
      },
      {
        term: 'Average order value (AOV)',
        definition:
          'Net merchandise revenue divided by completed orders — the ' +
          'average basket size at the point of purchase.',
      },
      {
        term: 'Product detail page (PDP)',
        definition:
          'The page for a single product — imagery, copy, specifications, ' +
          'price, availability, and reviews — where the buying decision is ' +
          'made.',
      },
      {
        term: 'Core Web Vitals',
        definition:
          'A set of field-measured page-experience signals — load, ' +
          'interactivity, and visual stability — that influence both ' +
          'conversion and organic search ranking.',
      },
      {
        term: 'Cart abandonment',
        definition:
          'A session that adds an item to the cart but does not complete ' +
          'a paid order.',
      },
      {
        term: 'Checkout funnel',
        definition:
          'The ordered sequence of steps from entering checkout to a paid ' +
          'order — the part of the funnel where committed buyers are won ' +
          'or lost.',
      },
      {
        term: 'Zero-result search',
        definition:
          'An on-site search query that returns no products — a direct ' +
          'discard of high-intent demand.',
      },
      {
        term: 'False decline',
        definition:
          'A legitimate order wrongly blocked or over-challenged by fraud ' +
          'decisioning — lost revenue and lifetime value disguised as ' +
          'fraud prevention.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Digital Commerce Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the digital storefront is leaking conversion and ' +
        'basket value — in discovery, the product detail page, the ' +
        'checkout, page speed, or the mobile experience — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Digital channel and storefront context',
          guidance:
            'Name the digital channels in scope — site, app, marketplace — ' +
            'the platform stack, the device and traffic mix, the digital ' +
            'revenue share, and the e-commerce operating model. State which ' +
            'commerce, search, PIM/DAM, analytics, and payment systems are ' +
            'in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — conversion rate, AOV, cart-abandonment, ' +
            'search-success, Core Web Vitals, mobile conversion, ' +
            'checkout-completion, product-detail engagement, online return ' +
            'rate, digital revenue mix, add-to-cart and repeat rate. For ' +
            'any metric not instrumented, name it as a precise seed gap ' +
            'with its expected data source.',
        },
        {
          heading: 'Conversion-funnel diagnostic',
          guidance:
            'Walk the funnel step by step — landing, discovery, ' +
            'product-detail, add-to-cart, checkout — segmented by device ' +
            'and source; locate where conversion drops, quantify the leak ' +
            'at each step, and separate friction loss from genuine intent ' +
            'loss.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — search and discovery failure, ' +
            'checkout friction, thin product-detail content, the mobile ' +
            'gap, page-speed degradation, a generic experience, ' +
            'experience-driven returns, analytics blindness — and state ' +
            'which are present, with the detection signal and supporting ' +
            'evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — conversion uplift, basket uplift, avoided ' +
            'return and fraud cost — explicitly haircut by traffic quality, ' +
            'data readiness, site performance, and experimentation ' +
            'discipline. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing or ' +
            'un-instrumented metric is a named ask, not a vague unknown.',
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
      label: 'Digital Commerce Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a digital-commerce ' +
        'AI Move — baseline, forecast, cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'conversion uplift, basket uplift, and avoided return and ' +
            'fraud cost, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — conversion rate, AOV, checkout-completion, ' +
            'search-success, return rate. Where a baseline is a seed gap ' +
            '(an un-instrumented funnel step), say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — traffic quality, ' +
            'data and instrumentation readiness, site performance, ' +
            'experimentation discipline — explicitly and show the haircut ' +
            'math. Keep conversion and AOV uplift separate from the ' +
            'return-rate and fraud savings.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the commerce, search, ' +
            'PIM/DAM, analytics, and payment systems, the experimentation ' +
            'platform, and the operating-model change — merchandising, ' +
            'content production, and the experiment cadence.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under lower-intent traffic, weaker ' +
            'instrumentation, a slower platform, and a low experiment ' +
            'velocity. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example a funnel too poorly instrumented to ' +
            'measure a baseline, or a platform that cannot deploy ' +
            'experiences — and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the holdout or experiment design that ' +
            'isolates the lift, and the measurement cadence.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Digital Commerce Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'digital-commerce AI capability, grounded in the function reference ' +
        'patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — intent-aware discovery layer, unified customer and ' +
            'session profile, governed experimentation platform, ' +
            'product-content supply chain, instrumented conversion funnel — ' +
            'and state which apply and how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the commerce, search, PIM/DAM, analytics, CDP, and ' +
            'payment integrations, the clickstream and catalogue data, the ' +
            'identity resolution, and the instrumentation and ' +
            'attribute-quality discipline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, the ' +
            'control posture, the human accountability point, and how ' +
            'merchandising and product owners review and override ' +
            'recommendations. No archetype ships without a named owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how digital-merchandising, product, content, and ' +
            'analytics workflows change, how the experiment cadence is ' +
            'reshaped, and who owns each change.',
        },
        {
          heading: 'Responsible-AI and governance controls',
          guidance:
            'State the model-monitoring, relevance-quality, ' +
            'false-decline-monitoring, and content-accuracy controls, the ' +
            'consent and privacy discipline, and the regulatory frames ' +
            '(privacy, PCI DSS, accessibility, consumer protection) that ' +
            'bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'commerce stack, and the phased rollout by surface — search, ' +
            'recommendations, checkout, content.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Digital Commerce Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the digital-commerce AI ' +
        'capability so value reaches digital revenue, not just the ' +
        'dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and instrumentation ' +
            'validation, a first surface live behind an experiment, ' +
            'merchandising and content onboarding, scale across the ' +
            'storefront — with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, instrumentation and catalogue readiness, ' +
            'merchandising and content adoption, the experimentation ' +
            'programme, Tower measurement.',
        },
        {
          heading: 'Merchandising and content adoption approach',
          guidance:
            'Define the change runway for merchandising, product, and ' +
            'content teams — training, the shift to model-assisted ' +
            'discovery and merchandising, the content-pipeline workflow — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, the holdout or ' +
            'experiment design, and the cadence for each metric.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — traffic-quality shortfall, ' +
            'instrumentation gaps, platform-agility limits, low experiment ' +
            'velocity, content-accuracy errors — with the escalation owner ' +
            'and the trigger for each.',
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
      claim: 'The conversion rate and where the funnel actually leaks',
      authoritativeSource:
        'The web and app analytics platform with end-to-end funnel ' +
        'instrumentation, reconciled against completed orders in the ' +
        'order-management system.',
      whatGoodEvidenceLooksLike:
        'A step-by-step funnel with conversion and drop-off at each step, ' +
        'segmentable by device and traffic source, with orders reconciled ' +
        'to the order-management system so the rate is real.',
      weakEvidenceToReject:
        'A blended site-wide conversion figure with no step-level funnel, ' +
        'or an analytics number never reconciled against actual paid ' +
        'orders.',
    },
    {
      claim: 'On-site search effectiveness and the demand it discards',
      authoritativeSource:
        'The on-site search engine query logs joined to downstream ' +
        'product-view, add-to-cart, and conversion events.',
      whatGoodEvidenceLooksLike:
        'Search-success and zero-result rates by query type, with searcher ' +
        'conversion compared against browser conversion so the value of ' +
        'failed searches is quantified.',
      weakEvidenceToReject:
        'A count of searches with no outcome data, or a search-success ' +
        'claim that cannot identify zero-result and abandoned queries.',
    },
    {
      claim: 'Site performance — that page speed is not depressing conversion',
      authoritativeSource:
        'Real-user-monitoring field data for the Core Web Vitals across ' +
        'page templates, not synthetic lab scores alone.',
      whatGoodEvidenceLooksLike:
        'Field-measured Core Web Vitals pass rates by template and device, ' +
        'with conversion and bounce correlated against measured load time.',
      weakEvidenceToReject:
        'A single synthetic lab score for the homepage presented as the ' +
        'site’s performance, or a speed claim with no field data and no ' +
        'device breakdown.',
    },
    {
      claim: 'Online returns and how much of them the experience caused',
      authoritativeSource:
        'The order-management and returns systems joined to shipped-order ' +
        'data, classified by return reason code.',
      whatGoodEvidenceLooksLike:
        'Return rate by category with return reasons broken out, isolating ' +
        'the fit and “not as described” share that traces to product ' +
        'content rather than genuine product fault.',
      weakEvidenceToReject:
        'A blended return percentage with no reason breakdown, or a figure ' +
        'that cannot separate experience-driven returns from product ' +
        'defects.',
    },
    {
      claim: 'The forecast value of a digital-commerce AI Move',
      authoritativeSource:
        'The value model — conversion uplift, basket uplift, and avoided ' +
        'return and fraud cost, each haircut by its dominant factors — read ' +
        'against the retailer’s traffic quality and digital revenue mix.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut factor ' +
        'applied explicitly, the uplift isolated by a holdout or controlled ' +
        'experiment, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point revenue-lift number, a vendor uplift claim taken ' +
        'at face value, or a forecast that ignores traffic-quality and ' +
        'instrumentation haircuts or has no holdout to isolate the lift.',
    },
  ],
};
