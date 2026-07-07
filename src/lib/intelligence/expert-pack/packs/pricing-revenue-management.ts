// Consilium expert — Pricing & Revenue Management (cross-cutting commercial).
//
// W3 (wave 3) draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// A cross-cutting commercial-discipline expert spanning the whole pricing
// lifecycle: list/pocket price architecture, discount & rebate governance,
// price-pack architecture, promotion ROI, deal desk & quote-to-cash margin
// leakage, value-based & dynamic pricing, price elasticity, the margin
// waterfall, and contract/renewal price management. Cross-industry — the same
// pocket-price waterfall recurs in B2B manufacturing & distribution, consumer
// products, software/subscription, and services.
//
// Honesty posture: this pack is deliberately blunt about four truths. (1) MOST
// MARGIN IS LOST IN THE POCKET, NOT THE LIST. The big leak is the uncontrolled
// drift from list to pocket price — off-invoice discounts, rebates, freight,
// payment terms, and unmanaged exceptions — not the headline list price, so
// chasing list increases while ignoring the waterfall misses the money. (2)
// DYNAMIC PRICING ROI IS REAL BUT CAPPED. Algorithmic/dynamic pricing genuinely
// moves margin, but governance, channel conflict, brand/fairness risk, and
// regulatory exposure cap how far it can go in most B2B and brand-sensitive
// contexts. (3) ELASTICITY MODELS NEED DATA MOST FIRMS LACK. Credible
// elasticity and willingness-to-pay models need clean transaction history and
// competitor price data that most firms do not actually have, so naive models
// overfit promotions and confound mix with true elasticity. (4) PRICE INCREASES
// STICK ON CONVICTION, NOT THE MODEL. Whether an increase realizes depends on
// sales-force conviction and the value story they can defend — not the
// optimizer's recommended number. DISTINCT from retail-merchandising-pricing
// (retail-specific markdown/assortment) and sales-revenue-operations
// (pipeline/forecasting) — this is the PRICING DISCIPLINE across industries.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const pricingRevenueManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.pricing-revenue-management",
    expertName: "Pricing & Revenue Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "pricing-revenue-management",
    scopeNote:
      "The pricing discipline across industries: list-to-pocket price " +
      "architecture, discount & rebate governance, price-pack architecture, " +
      "promotion ROI, deal desk & quote-to-cash margin leakage, value-based & " +
      "dynamic pricing, price elasticity / willingness-to-pay, the margin " +
      "waterfall, and contract/renewal price management. Covers the trade-offs " +
      "across price realization, win rate, volume, and margin — and is candid " +
      "that most margin is lost in the pocket-price waterfall (uncontrolled " +
      "discounts/rebates) not list price, that dynamic-pricing ROI is real but " +
      "capped by governance / channel-conflict / brand & regulatory risk, that " +
      "elasticity models need clean transaction + competitor data most firms " +
      "lack, and that price increases stick on sales-force conviction not the " +
      "model. Cross-industry (B2B manufacturing & distribution, consumer " +
      "products, software/subscription, services). DISTINCT from " +
      "retail-merchandising-pricing (retail markdown/assortment) and " +
      "sales-revenue-operations (pipeline/forecasting) — those route to other " +
      "experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "pocket_margin_pct",
        name: "Pocket margin %",
        definition:
          "Gross margin measured on the POCKET price — net of all on- and " +
          "off-invoice leakage (discounts, rebates, freight, payment terms, " +
          "co-op, returns) — as a share of pocket revenue. The true margin the " +
          "business actually keeps, not the invoice-margin illusion.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 45,
          basis:
            "Pocket-margin ranges vary widely by industry and channel; the band " +
            "spans thin distribution/commodity through differentiated B2B and " +
            "software — what matters is the gap between invoice and pocket margin",
          label: "planning-range",
        },
        dataSource:
          "Transaction-level price waterfall from the ERP/billing ledger with " +
          "all off-invoice elements (rebates, co-op, freight, terms) allocated " +
          "to the deal",
        whyItMatters:
          "The honest margin number. Most pricing programs report invoice margin " +
          "and miss the off-invoice leakage that is the real story — pocket " +
          "margin is where the money actually is, and the gap to invoice margin " +
          "is the size of the prize.",
      },
      {
        key: "price_realization",
        name: "Price realization (pocket vs list)",
        definition:
          "Pocket price as a percentage of list price across the book — how " +
          "much of the published price the business actually captures after the " +
          "full waterfall of discounts, rebates, and leakage.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Realization spans deeply discounted commodity/distribution at the " +
            "low end through disciplined, differentiated books at the high end; " +
            "a wide list-to-pocket gap is the leakage signal",
          label: "planning-range",
        },
        dataSource:
          "List price book joined to transaction-level pocket price from the " +
          "ERP/CPQ, by product, segment, and channel",
        whyItMatters:
          "The single clearest read on waterfall discipline. Low realization " +
          "with high list increases means the increases are being given back in " +
          "the pocket — the central illusion this discipline exists to expose.",
      },
      {
        key: "discount_leakage_pct",
        name: "Discount leakage %",
        definition:
          "Share of revenue lost to discounts and concessions beyond the " +
          "approved, value-justified level — the off-policy, over-delegated, and " +
          "habitual discounting that erodes pocket margin without winning " +
          "incremental volume.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 12,
          basis:
            "Estimated unjustified-discount leakage as a share of revenue; the " +
            "band reflects the gap between policy discount and realized discount " +
            "in books with loose governance",
          label: "planning-range",
        },
        dataSource:
          "Realized-vs-policy discount comparison by deal, rep, and segment from " +
          "the CPQ/ERP, isolating concessions above the approved band",
        whyItMatters:
          "A 1-point recovery of leakage usually beats a 1-point list increase " +
          "because it flows straight to pocket margin with no volume risk. This " +
          "is where the doctrine 'fix the pocket, not the list' is measured.",
      },
      {
        key: "win_rate_vs_price",
        name: "Win rate vs price (price-volume sensitivity)",
        definition:
          "Win rate on quoted deals analyzed against the offered price level — " +
          "the empirical price-response curve that shows where additional " +
          "discount stops buying incremental win probability.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Quote-to-win ranges by segment and competitiveness; the value is in " +
            "the SHAPE of win-rate vs price, not the level — the flat region is " +
            "where discount is wasted",
          label: "planning-range",
        },
        dataSource:
          "Won/lost quotes from the CPQ/CRM with offered price and price-to-" +
          "reference index, segmented by deal type",
        whyItMatters:
          "Distinguishes discount that wins deals from discount that is simply " +
          "given away. Where the win-rate curve is flat, extra discount buys no " +
          "incremental volume and is pure leakage — the heart of price-volume " +
          "trade-off discipline.",
      },
      {
        key: "deal_desk_cycle_time",
        name: "Deal desk cycle time",
        definition:
          "Median elapsed time from a non-standard pricing/discount request " +
          "entering the deal desk to an approved, quotable decision — the " +
          "throughput of pricing governance on exception deals.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 48,
          basis:
            "Deal-desk turnaround ranges from same-day on tiered auto-approval " +
            "to multi-day on complex bespoke deals; the tension is speed vs " +
            "margin control",
          label: "planning-range",
        },
        dataSource:
          "Deal-desk / approval workflow timestamps from the CPQ or quoting " +
          "system, by deal complexity tier",
        whyItMatters:
          "The friction tax of pricing governance. Too slow and reps route " +
          "around the desk or lose deals; too loose and margin leaks. The goal " +
          "is fast on standard and rigorous only on the exceptions that matter.",
      },
      {
        key: "price_increase_realization",
        name: "Price-increase realization %",
        definition:
          "Share of an announced list price increase that actually shows up in " +
          "realized pocket price after sales-force concessions, opt-outs, and " +
          "negotiated give-backs — announced increase minus what was given back.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 85,
          basis:
            "Realization of announced increases varies sharply with sales-force " +
            "conviction and the value story; weak conviction lets most of the " +
            "increase leak back in the pocket",
          label: "planning-range",
        },
        dataSource:
          "Pre- vs post-increase pocket price by account from the ERP/billing " +
          "ledger, net of concessions granted around the increase",
        whyItMatters:
          "The acid test that price increases stick on conviction, not the " +
          "model. A perfectly optimized increase that the sales force won't " +
          "defend realizes nothing — this metric exposes the gap between the " +
          "announced number and the captured number.",
      },
      {
        key: "promotion_roi",
        name: "Promotion ROI / incremental lift",
        definition:
          "Incremental margin generated by a promotion relative to its cost, " +
          "measured against a true baseline that strips out the volume that " +
          "would have sold anyway (pull-forward, cannibalization, and pantry/" +
          "channel loading).",
        unit: "x",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.5,
          high: 2.0,
          basis:
            "Trade-promotion ROI distributions; a large share of promotions run " +
            "below break-even (sub-1.0x) once forward-buy and cannibalization " +
            "are netted out — the headline lift overstates the truth",
          label: "planning-range",
        },
        dataSource:
          "Promoted-vs-baseline volume and margin from the transaction ledger " +
          "and trade-promotion-management system, with a defensible baseline",
        whyItMatters:
          "Promotions are routinely justified on gross lift while the net is " +
          "value-destroying. Honest promotion ROI against a real baseline is " +
          "where much hidden margin leakage hides — and where AI baselining pays.",
      },
      {
        key: "margin_per_unit",
        name: "Margin per unit (mix-adjusted)",
        definition:
          "Average pocket margin earned per unit/transaction, tracked " +
          "mix-adjusted so that shifts driven by product/channel mix are not " +
          "confused with genuine pricing gains or losses.",
        unit: "currency",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 0,
          basis:
            "Absolute per-unit margin is business-specific; the planning value is " +
            "the trend and the mix-adjusted decomposition (price vs mix vs cost), " +
            "not a cross-industry level",
          label: "planning-range",
        },
        dataSource:
          "Pocket margin divided by units from the ERP, decomposed into price, " +
          "mix, and cost effects",
        whyItMatters:
          "Keeps the conversation on margin earned, not revenue booked. " +
          "Mix-adjustment matters because a 'pricing win' is often just a mix " +
          "shift — separating the two prevents crediting pricing for what mix did.",
      },
      {
        key: "override_exception_rate",
        name: "Override / exception rate",
        definition:
          "Share of deals priced outside standard policy — manual overrides, " +
          "special pricing agreements, and out-of-band discounts — relative to " +
          "all priced deals. A measure of how exceptional 'exceptions' really are.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Exception rates climb where delegation is loose and the price book " +
            "no longer reflects reality; a high rate means policy is theatre and " +
            "the real price is set deal-by-deal",
          label: "planning-range",
        },
        dataSource:
          "CPQ/ERP flags for off-policy, override, and special-pricing-agreement " +
          "deals as a share of total transactions",
        whyItMatters:
          "When most deals are exceptions, governance has collapsed and the " +
          "price book is fiction. Exception rate is the early-warning gauge on " +
          "whether pricing policy actually governs or is routinely bypassed.",
      },
      {
        key: "contract_price_compliance",
        name: "Contract / price-list compliance %",
        definition:
          "Share of invoiced transactions priced in line with the governing " +
          "contract, tier, or agreed price list — net of unauthorized " +
          "off-contract pricing, mis-tiered accounts, and uncaptured escalators.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 98,
          basis:
            "Contract-compliance ranges; gaps come from manual quoting, stale " +
            "price lists, missed CPI/escalator clauses, and accounts buying " +
            "below their entitled tier",
          label: "planning-range",
        },
        dataSource:
          "Invoiced price vs governing contract/price-list price from the ERP " +
          "and contract repository, by account and product",
        whyItMatters:
          "Off-contract pricing and missed escalators are silent leakage that " +
          "compounds at every renewal. Compliance is where contract/renewal " +
          "pricing discipline is measured — uncaptured escalators alone fund " +
          "many margin programs.",
      },
      {
        key: "price_dispersion",
        name: "Price dispersion (variation for like deals)",
        definition:
          "The spread of pocket prices charged to similar customers for similar " +
          "products under similar conditions — unexplained variation that is not " +
          "justified by volume, segment, or value, usually measured as a " +
          "coefficient of variation or interquartile band.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Dispersion for like-for-like deals; wide unexplained spread signals " +
            "inconsistent, rep-by-rep pricing and is one of the most reliable " +
            "leakage tells in B2B books",
          label: "planning-range",
        },
        dataSource:
          "Transaction-level pocket price clustered on comparable customer/" +
          "product/volume cohorts from the ERP/CPQ, measuring within-cohort " +
          "spread",
        whyItMatters:
          "Unexplained dispersion is leakage made visible — the same buyer in " +
          "two regions paying very different prices for no value reason. " +
          "Tightening the low tail toward the achievable benchmark is among the " +
          "fastest, lowest-risk margin recoveries.",
      },
      {
        key: "revenue_uplift_from_pricing",
        name: "Revenue / margin uplift from pricing actions",
        definition:
          "Incremental margin attributable to deliberate pricing actions (list " +
          "moves, discount tightening, price-pack changes, dynamic adjustments) " +
          "measured against a counterfactual baseline and net of volume effects.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1,
          high: 5,
          basis:
            "Reported operating-margin lift from disciplined pricing programs as " +
            "a share of revenue; pricing is high-leverage because gains flow " +
            "almost entirely to the bottom line, but attribution must be " +
            "controlled",
          label: "planning-range",
        },
        dataSource:
          "Pre/post or cohort/holdout comparison of pocket margin tied to " +
          "specific pricing actions from the ERP, net of volume and mix",
        whyItMatters:
          "The bottom-line verdict on the pricing program. Because pricing gains " +
          "drop almost entirely to operating margin, even a few points of " +
          "revenue uplift dwarf most cost programs — but only when attribution " +
          "is controlled, not asserted.",
      },
    ],

    painThemes: [
      {
        key: "pocket_waterfall_leakage",
        name: "Pocket-price waterfall leakage (the real leak)",
        description:
          "The big margin loss is the uncontrolled drift from list to pocket " +
          "price — off-invoice rebates, co-op, freight, payment terms, returns, " +
          "and habitual discounts — not the headline list price. Leadership " +
          "manages list and invoice margin while the money leaks below the " +
          "invoice line where nobody is looking, so list increases get given " +
          "back in the pocket and never reach the bottom line.",
        detectionSignal:
          "A wide and widening gap between invoice margin and pocket margin; " +
          "off-invoice elements (rebates, terms, freight) not allocated to deals; " +
          "list increases that don't show up in realized price; reporting that " +
          "stops at invoice margin.",
        diagnosticQuestion:
          "Do you measure pocket margin with every off-invoice element " +
          "allocated to the deal, and how big is the gap between your invoice " +
          "margin and your true pocket margin?",
      },
      {
        key: "uncontrolled_discount_delegation",
        name: "Uncontrolled discount delegation & exception creep",
        description:
          "Discount authority is over-delegated and exceptions become the norm, " +
          "so the real price is set deal-by-deal by reps under deal pressure " +
          "rather than by policy. Habitual discounting at the same level " +
          "regardless of value means the discount no longer buys volume — it is " +
          "simply expected — and the price book becomes fiction.",
        detectionSignal:
          "High override/exception rate; realized discounts clustered at the " +
          "delegation ceiling; wide price dispersion for like deals; the same " +
          "customers always getting the same discount independent of deal merit.",
        diagnosticQuestion:
          "What share of your deals are priced off-policy or via override, and " +
          "how much of your discounting is value-justified versus habitual?",
      },
      {
        key: "promotion_value_destruction",
        name: "Promotion value destruction (gross lift, net loss)",
        description:
          "Promotions are justified on gross uplift while the net is margin- " +
          "destroying once forward-buy, cannibalization, and channel/pantry " +
          "loading are netted out against a true baseline. Trade spend and " +
          "promo calendars persist on habit and customer demand rather than " +
          "measured incremental return, so a large share of promotions run " +
          "below break-even.",
        detectionSignal:
          "Promotion ROI reported on gross lift with no defensible baseline; " +
          "repeating promotions whose incremental margin is never measured; " +
          "volume spikes followed by troughs (forward-buy); trade spend growing " +
          "faster than incremental margin.",
        diagnosticQuestion:
          "How do you set the baseline a promotion is measured against, and " +
          "what share of your promotions are net margin-positive once forward- " +
          "buy and cannibalization are stripped out?",
      },
      {
        key: "elasticity_data_poverty",
        name: "Elasticity / willingness-to-pay data poverty",
        description:
          "Credible elasticity and value-based pricing need clean transaction " +
          "history and competitor price data that most firms lack, so models " +
          "overfit promotional periods, confound mix and seasonality with true " +
          "elasticity, and produce confident-but-wrong willingness-to-pay " +
          "estimates. Teams then either distrust the model or, worse, act on a " +
          "spurious one.",
        detectionSignal:
          "No clean competitor price feed; elasticity estimated only from " +
          "promotional variation; price changes too rare/correlated to identify " +
          "elasticity; willingness-to-pay asserted with no conjoint, A/B, or " +
          "transaction evidence.",
        diagnosticQuestion:
          "What clean transaction and competitor price history do you actually " +
          "have to estimate elasticity, and are your elasticity numbers derived " +
          "from real list changes or just promotional swings?",
      },
      {
        key: "price_increase_no_conviction",
        name: "Price increases that don't stick (no conviction)",
        description:
          "Whether an announced increase realizes depends on sales-force " +
          "conviction and a defensible value story, not on the optimizer's " +
          "number. Without a value narrative reps believe and tools to defend " +
          "it, the increase is negotiated back in the pocket account-by-account, " +
          "and realization collapses far below the announced figure.",
        detectionSignal:
          "Large gap between announced and realized increase; concessions " +
          "spiking right after an increase; reps lacking a value story or " +
          "escalation backstop; opt-out and grandfathering granted freely.",
        diagnosticQuestion:
          "Of your last announced price increase, what percentage actually " +
          "showed up in realized pocket price, and were reps equipped with a " +
          "value story and a backstop to hold the line?",
      },
      {
        key: "dynamic_pricing_governance_gap",
        name: "Dynamic-pricing governance, channel & brand risk",
        description:
          "Algorithmic and dynamic pricing genuinely move margin, but " +
          "governance, channel conflict, brand/fairness perception, and " +
          "regulatory exposure cap how far it can go. Unfenced algorithms create " +
          "channel-conflict (different prices undercutting partners), " +
          "fairness/optics backlash, and antitrust/price-discrimination risk " +
          "that can dwarf the optimization gain.",
        detectionSignal:
          "Dynamic prices set without guardrails on min/max, channel " +
          "consistency, or fairness; no audit trail for algorithmic price " +
          "decisions; channel partners discovering price inconsistency; no legal " +
          "review of personalized/dynamic pricing.",
        diagnosticQuestion:
          "Where you use dynamic or algorithmic pricing, what guardrails bound " +
          "it (price floors/ceilings, channel consistency, fairness, " +
          "auditability), and has legal reviewed the price-discrimination " +
          "exposure?",
      },
      {
        key: "quote_to_cash_fragmentation",
        name: "Quote-to-cash fragmentation & margin leakage",
        description:
          "Price book, CPQ, contract, ERP, and rebate systems are fragmented " +
          "with brittle integrations, so the price agreed is not the price " +
          "invoiced — stale price lists, missed escalators, mis-tiered accounts, " +
          "and rebates accrued but never reconciled leak margin silently across " +
          "the quote-to-cash flow.",
        detectionSignal:
          "Invoiced price diverging from contracted price; missed CPI/escalator " +
          "clauses; rebate accruals that don't reconcile to actuals; manual " +
          "re-keying between CPQ, contract, and ERP; no single source of price " +
          "truth.",
        diagnosticQuestion:
          "Is the price your CPQ quotes the price your ERP actually invoices, " +
          "and how do you catch missed escalators and unreconciled rebates " +
          "before they compound at renewal?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "waterfall_leakage_analytics",
        name: "Margin-waterfall & leakage analytics",
        valueMechanism:
          "AI reconstructs the full price waterfall from transaction data — " +
          "allocating every off-invoice element to the deal — and surfaces the " +
          "biggest pockets of leakage, dispersion, and off-policy discounting, " +
          "so leaders attack the pocket-price loss that invoice-margin reporting " +
          "hides. The fastest, lowest-risk value because it recovers margin " +
          "already being given away with no volume risk.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Transaction-level price detail with off-invoice elements (rebates, freight, terms, co-op)",
          "List/price-book and policy discount bands to compare against",
          "Customer/product/segment dimensions for cohorting and dispersion analysis",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Leakage is only as honest as off-invoice allocation — un-allocated rebates/terms understate the true loss",
          "Findings are diagnostic, not automatic price changes; the recovery action is a human commercial decision",
          "Dispersion flags must control for legitimate value/volume differences or they recommend tightening justified discounts",
        ],
        metricsMoved: [
          "pocket_margin_pct",
          "price_realization",
          "discount_leakage_pct",
          "price_dispersion",
        ],
      },
      {
        key: "deal_desk_guidance",
        name: "Deal-desk price guidance & guardrails",
        valueMechanism:
          "AI gives reps and the deal desk a recommended price band and a " +
          "floor for each deal — informed by win-rate-vs-price history and " +
          "comparable deals — and auto-routes only true exceptions for approval, " +
          "so standard deals price fast within policy and discount is spent only " +
          "where it buys incremental win probability.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Won/lost quotes with offered price and price-to-reference index",
          "Comparable-deal history clustered by segment, product, and volume",
          "Discount policy bands and approval thresholds to enforce guardrails",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Price floors and discount approvals carry margin and contractual risk — exceptions require human approval",
          "Guidance trained on past deals can entrench historical under-pricing; audit against value, not just precedent",
          "Reps must see why a price band was recommended or they route around the desk — explainability drives adoption",
        ],
        metricsMoved: [
          "discount_leakage_pct",
          "win_rate_vs_price",
          "deal_desk_cycle_time",
          "override_exception_rate",
        ],
      },
      {
        key: "elasticity_optimization",
        name: "Price elasticity & optimization modeling",
        valueMechanism:
          "AI estimates price elasticity and willingness-to-pay by segment and " +
          "product from clean transaction and competitor data, recommending " +
          "list and segment-level price moves that lift margin where demand is " +
          "inelastic and protect volume where it is not — turning pricing from " +
          "cost-plus guesswork into evidence-based optimization where the data " +
          "supports it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clean multi-period transaction history with genuine (non-promotional) price variation",
          "Competitor price data to separate own-price from cross-price effects",
          "Segment/mix dimensions to avoid confounding mix with true elasticity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Elasticity from promotional swings alone is unreliable — the model is capped by data the firm usually lacks",
          "Confident willingness-to-pay estimates on thin data are worse than none; validate with A/B or conjoint before acting",
          "Optimized list moves still must be defendable by the sales force or they don't realize — the model is not the decision",
        ],
        metricsMoved: [
          "revenue_uplift_from_pricing",
          "margin_per_unit",
          "win_rate_vs_price",
        ],
      },
      {
        key: "promotion_roi_baselining",
        name: "Promotion ROI baselining & trade-spend optimization",
        valueMechanism:
          "AI builds a defensible counterfactual baseline for each promotion " +
          "(stripping out forward-buy, cannibalization, and would-have-sold " +
          "volume) so true incremental margin is visible, then recommends " +
          "killing value-destroying promotions and reallocating trade spend to " +
          "the ones that actually pay — converting habitual promo calendars " +
          "into measured investment.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Promoted-vs-baseline volume and margin at SKU/account/period grain",
          "Promotion calendar and trade-spend records to attribute cost",
          "Enough non-promoted periods to estimate a credible baseline",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Promotion ROI is only as good as the baseline — a weak counterfactual reproduces the gross-lift illusion",
          "Killing a customer-demanded promotion has relationship/listing risk beyond the math — a commercial call",
          "Cannibalization and forward-buy estimates carry uncertainty; present ranges, not false-precision point ROI",
        ],
        metricsMoved: [
          "promotion_roi",
          "pocket_margin_pct",
          "revenue_uplift_from_pricing",
        ],
      },
      {
        key: "dynamic_pricing_governed",
        name: "Governed dynamic / algorithmic pricing",
        valueMechanism:
          "AI adjusts prices within tightly bounded guardrails in response to " +
          "demand, inventory, and competitive signals — capturing real margin " +
          "where dynamic response is appropriate — while floors, ceilings, " +
          "channel-consistency rules, fairness checks, and a full audit trail " +
          "keep it inside brand, channel, and regulatory limits.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Real-time demand, inventory, and competitive price signals",
          "Guardrail configuration (floors, ceilings, channel/fairness rules)",
          "An audit log of every algorithmic price decision for review and defense",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Channel conflict and fairness/optics backlash can dwarf the optimization gain — guardrails are non-negotiable",
          "Personalized/dynamic pricing carries price-discrimination and antitrust exposure that legal must review",
          "Every algorithmic price decision needs an audit trail; an unexplainable price is indefensible to regulators and partners",
        ],
        metricsMoved: [
          "revenue_uplift_from_pricing",
          "margin_per_unit",
          "price_realization",
        ],
      },
      {
        key: "contract_renewal_intelligence",
        name: "Contract & renewal price intelligence",
        valueMechanism:
          "AI watches the installed base for missed CPI/escalator clauses, " +
          "mis-tiered accounts, expiring discounts, and below-entitlement " +
          "pricing, and recommends the renewal price move with a value story — " +
          "so contract compliance rises and the escalators and re-pricing " +
          "opportunities that silently leak at every renewal are actually " +
          "captured.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Contract repository with pricing terms, escalators, and tier entitlements",
          "Invoiced price by account to detect off-contract and below-tier pricing",
          "Renewal calendar and account value data to prioritize and time moves",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Renewal price moves carry retention/relationship risk — the recommendation needs a human commercial decision",
          "Applying an escalator the customer disputes can trigger churn; pair the move with a defensible value story",
          "Tier/compliance flags must respect negotiated exceptions or they re-price legitimately discounted accounts",
        ],
        metricsMoved: [
          "contract_price_compliance",
          "price_increase_realization",
          "pocket_margin_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "price_truth_data_spine",
        name: "Price-truth data spine (the foundation under every bet)",
        description:
          "A governed transaction-level price-and-cost spine that reconstructs " +
          "the full waterfall — list, on-invoice, off-invoice (rebates, freight, " +
          "terms, co-op), and pocket — as a single source of price truth, so " +
          "every downstream pricing bet reasons over real pocket margin rather " +
          "than the invoice-margin illusion. Treated as the prerequisite " +
          "foundation because leakage analytics, elasticity, and optimization " +
          "are all capped by it.",
        boundary:
          "Owns the waterfall data model, off-invoice allocation, and price/ " +
          "cost reconciliation; does not own the pricing decisions, the CPQ " +
          "workflow, or the optimization models that consume the spine.",
        humanAccountabilityPoint: "Head of Pricing / Revenue Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "discount_governance_framework",
        name: "Discount & rebate governance framework",
        description:
          "A policy-and-control layer over discounting — value-tiered discount " +
          "bands, delegation-of-authority thresholds, a deal desk for genuine " +
          "exceptions, and rebate/co-op governance — so discount is spent " +
          "deliberately where it buys volume rather than habitually given away. " +
          "Pairs policy with measurement so leakage and dispersion are visible " +
          "and accountable.",
        boundary:
          "Owns discount policy, approval thresholds, and rebate governance; " +
          "does not own list-price strategy or the individual commercial deal " +
          "decisions reps make within the bands.",
        humanAccountabilityPoint: "Head of Pricing + Sales Leadership (joint)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "deal_desk_cpq_overlay",
        name: "AI deal-desk & CPQ guidance overlay",
        description:
          "A price-guidance and exception-routing layer overlaid on the " +
          "existing CPQ/quoting stack — recommending price bands and floors from " +
          "win-rate history and auto-routing only true exceptions — so standard " +
          "deals price fast within policy and the desk's effort concentrates on " +
          "the deals that actually move margin, without replacing the CPQ.",
        boundary:
          "Owns in-quote price guidance and exception routing; does not own the " +
          "system-of-record CPQ, the price book, or final pricing authority on " +
          "exception deals.",
        humanAccountabilityPoint: "Deal Desk Lead",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "governed_optimization_engine",
        name: "Governed price-optimization & dynamic-pricing engine",
        description:
          "An elasticity/optimization engine — run within explicit guardrails " +
          "(floors, ceilings, channel-consistency, fairness, auditability) and " +
          "validated against A/B or conjoint evidence — that recommends list and " +
          "segment price moves and, where appropriate, governed dynamic " +
          "adjustments, with a value story attached so the sales force can " +
          "actually defend and realize the moves.",
        boundary:
          "Owns elasticity modeling, optimization recommendations, and dynamic- " +
          "pricing guardrails; does not own the final price decision, the " +
          "sales-force value story, or the legal review of pricing exposure.",
        humanAccountabilityPoint: "Head of Pricing / Revenue Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from levers in rising data-dependency and risk order. " +
        "(1) Pocket-waterfall leakage recovery — reconstruct the waterfall and " +
        "recover off-policy discounting and unexplained dispersion; the fastest, " +
        "lowest-risk win because it flows straight to pocket margin with no " +
        "volume risk, and the doctrine 'fix the pocket, not the list' lives " +
        "here. (2) Deal-desk discipline & contract compliance — guidance, " +
        "guardrails, and escalator/tier capture tighten the give-away and the " +
        "renewal leak, real but gated by sales-force adoption and clean " +
        "quote-to-cash data. (3) Elasticity-based optimization, promotion " +
        "rebaselining, and governed dynamic pricing — the highest-upside prizes " +
        "but the most dependent on clean transaction + competitor data the firm " +
        "usually lacks, and on guardrails for channel/brand/regulatory risk. " +
        "Across all of it, realization is gated by sales-force conviction: an " +
        "optimized number nobody will defend realizes nothing. The durable " +
        "program builds the price-truth spine first, recovers leakage to fund " +
        "and prove itself, then earns the right to optimization and dynamic " +
        "pricing.",
      dominantHaircutFactors: [
        {
          factor: "Sales-force conviction shortfall",
          rationale:
            "Price increases and optimized moves realize only if the sales " +
            "force believes and can defend the value story; without conviction " +
            "the increase is negotiated back in the pocket, so realizable value " +
            "is discounted by the share reps give back.",
          typicalHaircut: {
            low: 0.2,
            high: 0.55,
            basis:
              "Observed gap between announced/optimized price moves and realized " +
              "pocket price where sales-force conviction and value tooling were " +
              "weak",
            label: "planning-range",
          },
        },
        {
          factor: "Transaction & competitor data poverty",
          rationale:
            "Elasticity, willingness-to-pay, and promotion baselining are " +
            "capped by the cleanliness of transaction history and the presence " +
            "of competitor price data; on thin or promotion-only data the " +
            "optimization value collapses toward the leakage-recovery floor.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between modeled and realized optimization value where " +
              "elasticity rested on promotional swings or no competitor feed",
            label: "planning-range",
          },
        },
        {
          factor: "Governance & channel/brand risk cap",
          rationale:
            "Dynamic and personalized pricing upside is bounded by channel " +
            "conflict, fairness/brand optics, and regulatory exposure; the " +
            "guardrails that keep it safe also cap the realizable gain, and " +
            "ignoring them risks losses that dwarf the optimization.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Reduction between unconstrained optimization upside and what is " +
              "realizable inside channel/brand/regulatory guardrails",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Pocket-margin recovery (leakage & dispersion)",
          range: {
            low: 0.01,
            high: 0.04,
            basis:
              "Reported operating-margin recovery as a share of revenue from " +
              "waterfall-leakage and dispersion programs, flowing almost entirely " +
              "to the bottom line",
            label: "planning-range",
          },
          measuredAs:
            "Absolute lift in pocket_margin_pct / reduction in discount_leakage_pct",
        },
        {
          lever: "Price-increase realization improvement",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reported improvement in the share of an announced increase that " +
              "reaches realized pocket price once a value story and deal-desk " +
              "backstop are in place",
            label: "planning-range",
          },
          measuredAs: "Absolute lift in price_increase_realization",
        },
        {
          lever: "Promotion trade-spend reallocation",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported share of trade spend recoverable by killing sub-break- " +
              "even promotions and reallocating once true incremental ROI is " +
              "measured against a defensible baseline",
            label: "planning-range",
          },
          measuredAs: "Relative improvement in blended promotion_roi",
        },
      ],
      timeToValueBand:
        "Waterfall-leakage analytics and deal-desk guidance: 1-2 quarters " +
        "(overlay on existing transaction and CPQ data, no platform swap). " +
        "Price-truth data spine: 1-3 quarters to reconcile and govern before " +
        "downstream bets are trustworthy. Elasticity/optimization, promotion " +
        "rebaselining, and governed dynamic pricing: 2-4 quarters to assemble " +
        "clean data, validate, and earn sales-force trust, with realization " +
        "compounding over subsequent price cycles and renewals.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Price optimization & management (PO&M)",
          role:
            "The dedicated pricing engine — elasticity/optimization, price-list " +
            "management, deal-price guidance, and waterfall analytics over " +
            "transaction data.",
          examples: [
            "PROS",
            "Vendavo",
            "Zilliant",
          ],
        },
        {
          name: "CPQ & quoting (deal desk)",
          role:
            "Configure-price-quote and discount/approval workflow where deal " +
            "pricing, guidance, and exception routing happen at the point of " +
            "sale.",
          examples: [
            "Salesforce CPQ / Revenue Cloud",
            "Conga CPQ",
            "DealHub",
          ],
        },
        {
          name: "ERP / billing (price of record)",
          role:
            "The system that actually invoices — the source of transaction-level " +
            "price, cost, and the price the customer is truly charged.",
          examples: [
            "SAP S/4HANA",
            "Oracle ERP Cloud",
            "Microsoft Dynamics 365 Finance",
          ],
        },
        {
          name: "Trade promotion / rebate management (TPM/TPO)",
          role:
            "Promotion planning, trade-spend accrual, and rebate/co-op " +
            "management — the off-invoice machinery whose leakage must be " +
            "allocated to the waterfall.",
          examples: [
            "SAP Trade Management",
            "Vistex",
            "Enable (rebate management)",
          ],
        },
        {
          name: "Contract lifecycle management (CLM)",
          role:
            "The repository of pricing terms, escalators, and tier entitlements " +
            "that governs renewal pricing and contract compliance.",
          examples: [
            "Icertis",
            "DocuSign CLM",
            "SAP Ariba / Conga CLM",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Commercial Officer (CCO)",
          accountability:
            "End-to-end commercial outcomes — price, volume, and margin across " +
            "the go-to-market engine, and the trade-off discipline between them.",
        },
        {
          title: "Head of Pricing / Revenue Management",
          accountability:
            "Pricing strategy, the price book, the margin waterfall, elasticity " +
            "and optimization, and the realization of price actions.",
        },
        {
          title: "Deal Desk Lead",
          accountability:
            "Discount governance, quote accuracy, exception throughput, and " +
            "margin control on non-standard deals.",
        },
        {
          title: "Trade / Promotion Manager",
          accountability:
            "Promotion planning, trade-spend allocation, and the incremental " +
            "ROI of the promotion calendar.",
        },
        {
          title: "VP Sales / Sales Leadership",
          accountability:
            "Carrying the value story into the field — the conviction that " +
            "determines whether price moves actually realize.",
        },
        {
          title: "Finance / Commercial FP&A",
          accountability:
            "Margin reporting, pocket-margin truth, price-action attribution, " +
            "and the link from pricing decisions to operating margin.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Price discrimination law (e.g. Robinson-Patman Act)",
          relevance:
            "Differential pricing of like goods to competing buyers can be " +
            "unlawful price discrimination in some jurisdictions; segment, " +
            "dynamic, and personalized pricing must be defensible on " +
            "cost/competition grounds.",
        },
        {
          name: "Antitrust & price-fixing / algorithmic-collusion rules",
          relevance:
            "Shared pricing algorithms or signaling, and algorithms that " +
            "converge to supra-competitive prices, raise antitrust exposure; " +
            "dynamic-pricing logic must avoid collusive outcomes.",
        },
        {
          name: "Minimum Advertised Price (MAP) & resale-price rules",
          relevance:
            "MAP policies and resale-price-maintenance limits constrain how " +
            "list, channel, and dynamic prices may be set and advertised across " +
            "partners.",
        },
        {
          name: "Consumer-protection & pricing-fairness rules",
          relevance:
            "Personalized and dynamic pricing in consumer contexts must avoid " +
            "deceptive, discriminatory, or unfair-pricing outcomes and meet " +
            "price-transparency requirements where they apply.",
        },
      ],
      canonicalTerms: [
        {
          term: "Pocket price / pocket margin",
          definition:
            "The price (and margin) actually kept after the full waterfall of " +
            "on- and off-invoice leakage — the true number, distinct from list " +
            "and invoice price.",
        },
        {
          term: "Price waterfall",
          definition:
            "The step-by-step erosion from list price to pocket price through " +
            "each discount, rebate, freight, term, and concession — the map of " +
            "where margin leaks.",
        },
        {
          term: "Price realization",
          definition:
            "Pocket price as a share of list — how much of the published price " +
            "the business captures after the waterfall.",
        },
        {
          term: "Price-pack architecture (PPA)",
          definition:
            "The deliberate design of pack/size/tier/feature offers at distinct " +
            "price points to capture willingness-to-pay across segments without " +
            "head-to-head discounting.",
        },
        {
          term: "Price elasticity of demand",
          definition:
            "The percentage change in volume for a percentage change in price — " +
            "the core input to optimization, credible only on clean " +
            "non-promotional price variation.",
        },
        {
          term: "Trade promotion ROI",
          definition:
            "Incremental margin per dollar of promotion cost measured against a " +
            "true baseline net of forward-buy and cannibalization — not gross " +
            "lift.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Pocket-margin leakage / recovery opportunity",
        authoritativeSource:
          "Transaction-level price waterfall from the ERP with every " +
          "off-invoice element (rebates, freight, terms, co-op) allocated to the " +
          "deal, compared to list and policy",
        whatGoodEvidenceLooksLike:
          "A full waterfall reconstruction showing the invoice-to-pocket gap, " +
          "leakage decomposed by driver, and dispersion measured on like-for- " +
          "like cohorts.",
        weakEvidenceToReject:
          "An invoice-margin number with off-invoice rebates/terms un-allocated, " +
          "or a 'we recovered X%' claim with no waterfall and no baseline.",
      },
      {
        claim: "Price elasticity / optimization value",
        authoritativeSource:
          "Clean multi-period transaction history with genuine list-price " +
          "variation plus competitor price data, controlled for mix and " +
          "seasonality",
        whatGoodEvidenceLooksLike:
          "Elasticity estimated from real (non-promotional) price changes, " +
          "validated against an A/B test or conjoint study, with mix and " +
          "competitor effects separated.",
        weakEvidenceToReject:
          "Elasticity inferred only from promotional swings, willingness-to-pay " +
          "asserted with no test, or a model that confounds mix with true " +
          "elasticity.",
      },
      {
        claim: "Promotion ROI / incremental lift",
        authoritativeSource:
          "Promoted-vs-baseline volume and margin at SKU/account grain with a " +
          "defensible counterfactual baseline and trade-spend cost attribution",
        whatGoodEvidenceLooksLike:
          "Incremental margin against a credible baseline that nets out forward- " +
          "buy and cannibalization, presented as a range with the baseline " +
          "method stated.",
        weakEvidenceToReject:
          "Gross-lift ROI with no baseline, or a repeating promotion whose " +
          "incremental (not gross) margin has never been measured.",
      },
      {
        claim: "Price-increase realization",
        authoritativeSource:
          "Pre- vs post-increase pocket price by account from the ERP/billing " +
          "ledger, net of concessions granted around the increase",
        whatGoodEvidenceLooksLike:
          "A before/after of realized pocket price showing how much of the " +
          "announced increase actually stuck, with concessions and opt-outs " +
          "accounted for.",
        weakEvidenceToReject:
          "An announced-increase figure presented as realized, with no measure " +
          "of give-back, opt-out, or grandfathering.",
      },
      {
        claim: "Contract / price-list compliance and renewal capture",
        authoritativeSource:
          "Invoiced price vs governing contract/price-list price from the ERP " +
          "and CLM repository, including escalator/tier entitlements",
        whatGoodEvidenceLooksLike:
          "An account-level compliance audit identifying off-contract pricing, " +
          "mis-tiered accounts, and missed escalators, tied to the captured " +
          "revenue when corrected.",
        weakEvidenceToReject:
          "A blanket 'our contracts are compliant' assertion with no invoiced- " +
          "vs-contracted comparison and no escalator check.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you measure pocket margin with every off-invoice element (rebates, freight, terms, co-op) allocated to the deal, and how big is the gap between your invoice margin and your true pocket margin?",
      "What share of your deals are priced off-policy or via override, how much of your discounting is value-justified versus habitual, and how wide is price dispersion for like-for-like deals?",
      "Of your last announced price increase, what percentage actually showed up in realized pocket price, and were reps equipped with a value story and a backstop to hold the line?",
      "What clean transaction and competitor price history do you actually have to estimate elasticity, and are your elasticity numbers derived from real list changes or just promotional swings?",
      "How do you set the baseline a promotion is measured against, and what share of your promotions are net margin-positive once forward-buy and cannibalization are stripped out?",
      "Where you use dynamic or algorithmic pricing, what guardrails bound it (floors/ceilings, channel consistency, fairness, auditability) and has legal reviewed the price-discrimination exposure?",
      "Is the price your CPQ quotes the price your ERP actually invoices, and how do you catch missed escalators, mis-tiered accounts, and unreconciled rebates before they compound at renewal?",
    ],
    maturitySignals: [
      "Pocket margin is computed with full off-invoice allocation and is the reported margin number — not invoice margin — with a named pricing owner.",
      "Discount authority is value-tiered with measured leakage and dispersion, and exception/override rate is tracked and investigated rather than normalized.",
      "Price increases ship with a value story and deal-desk backstop, and realization (announced vs captured) is measured account-by-account.",
      "Elasticity rests on clean non-promotional price variation and competitor data, validated by A/B or conjoint, and the model is treated as input not decision.",
      "Promotions are judged on incremental ROI against a defensible baseline, and dynamic pricing runs inside floor/ceiling/channel/fairness guardrails with an audit trail.",
    ],
    redFlags: [
      "Margin is reported and managed at the invoice line while off-invoice rebates, freight, and terms are never allocated — the pocket leak is invisible.",
      "Most deals are priced via override or special-pricing-agreement, so the price book is fiction and the real price is set rep-by-rep under deal pressure.",
      "Announced price increases are presented as realized with no measure of give-back, while concessions spike right after every increase.",
      "Elasticity or willingness-to-pay numbers are acted on despite resting only on promotional swings, with no competitor data and no validation test.",
      "Dynamic or personalized pricing runs without floors/ceilings, channel-consistency rules, or legal review of price-discrimination and collusion exposure.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Price optimization & management (PROS, Vendavo, Zilliant)",
        category: "Pricing engine / elasticity / waterfall analytics",
        switchingCost:
          "High — the optimization models, price-book configuration, and " +
          "waterfall data plumbing accumulate tuning and integration that make " +
          "replacement a multi-quarter program once embedded in the deal flow.",
        renewalDynamics:
          "Enterprise/seat or volume-based pricing; outcomes (measured margin " +
          "lift) are the leverage — press on realized pocket-margin proof in a " +
          "controlled scope before enterprise scale-up.",
      },
      {
        vendorName: "CPQ / deal desk (Salesforce CPQ, Conga, DealHub)",
        category: "Quote-to-cash pricing & approval workflow",
        switchingCost:
          "High — CPQ sits in the critical quoting path with deep CRM/ERP " +
          "integration, product/price-rule configuration, and approval " +
          "workflows; replacement disrupts the revenue motion itself.",
        renewalDynamics:
          "Per-seat pricing, often bundled with the CRM platform; incumbents " +
          "add native pricing AI at renewal to extend lock-in — unbundle to keep " +
          "best-of-breed pricing leverage.",
      },
      {
        vendorName: "Trade promotion / rebate management (Vistex, Enable, SAP TPM)",
        category: "Trade spend / rebate / co-op governance",
        switchingCost:
          "Moderate-to-high — accrual logic, rebate program configuration, and " +
          "settlement history are sticky, and mid-program migration risks " +
          "reconciliation breaks.",
        renewalDynamics:
          "Volume/spend-tiered pricing; ROI is the lever — demand baseline-based " +
          "incremental-ROI reporting, not gross-lift dashboards, as a condition.",
      },
      {
        vendorName: "Contract lifecycle management (Icertis, DocuSign CLM, Conga)",
        category: "Contract / escalator / tier-entitlement repository",
        switchingCost:
          "Moderate — clause libraries, templates, and the executed-contract " +
          "corpus accumulate value; the data history (not the software) is the " +
          "real lock-in, so check export rights.",
        renewalDynamics:
          "Per-seat/volume pricing; the lever is escalator/compliance capture " +
          "value — tie expansion to measured renewal-leakage recovery.",
      },
    ],
    switchingCosts:
      "The pricing engine and CPQ are the high-lock-in layers the whole " +
      "quote-to-cash flow anchors to — replacement disrupts the live revenue " +
      "motion, so they are rarely swapped for the pricing function alone. The " +
      "real lock-in across the stack is accumulated DATA and CONFIGURATION " +
      "(tuned elasticity models, price rules, rebate accrual logic, executed " +
      "contracts), so exit rights over your own transaction, model, and " +
      "contract data matter more than the software contract. Beware CRM/ERP- " +
      "native pricing AI bundling that quietly re-locks the stack at renewal.",
    negotiationLevers: [
      "Measured pocket-margin / realization lift proven in a controlled scope before enterprise scale-up — outcome proof, not vendor claims",
      "Baseline-based incremental promotion-ROI reporting (not gross-lift dashboards) as a contractual condition on TPM tools",
      "Transaction, model/elasticity, and contract data export rights to avoid data and configuration lock-in",
      "Unbundle native pricing AI from the CRM/ERP renewal to keep best-of-breed pricing leverage",
      "Renewal/escalator-capture value tied to commercial terms so the tool pays from the leakage it recovers",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      leakage_claim: [
        "transaction-level waterfall with off-invoice allocation",
        "invoice-vs-pocket margin gap",
        "dispersion on like-for-like cohorts and policy-vs-realized discount",
      ],
      elasticity_claim: [
        "clean non-promotional price variation",
        "competitor price data and mix controls",
        "A/B or conjoint validation, not promotion-only inference",
      ],
      promotion_claim: [
        "defensible counterfactual baseline",
        "incremental (not gross) margin net of forward-buy and cannibalization",
        "trade-spend cost attribution",
      ],
      price_increase_claim: [
        "pre/post realized pocket price by account",
        "concessions, opt-outs, and grandfathering accounted for",
        "announced-vs-realized realization, not the announced figure alone",
      ],
      compliance_claim: [
        "invoiced vs governing contract/price-list price",
        "escalator and tier-entitlement check",
        "captured revenue when corrected",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (sales-force conviction, data poverty, governance/channel risk)",
      ],
    },
    citationStandard:
      "Quantitative pricing claims cite the ERP/CPQ/TPM/contract source and the " +
      "period, and margin claims state whether they are invoice or pocket margin " +
      "with off-invoice elements allocated. Elasticity claims state whether they " +
      "rest on real list changes or promotional swings and whether they were " +
      "validated. Promotion ROI is stated incremental against a named baseline, " +
      "never gross lift. Price-increase claims are stated as realized pocket " +
      "price net of give-back, never the announced figure. Value projections " +
      "cite a baseline plus a labelled planning range and the haircut factors " +
      "applied (sales-force conviction, data poverty, governance/channel risk) — " +
      "never a single asserted ROI, and never a vendor 'up to X% margin' figure " +
      "without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not reconstructed the pocket-price waterfall with off-invoice allocation — frame leakage and pocket-margin claims as gated by that allocation and likely understated until it is done.",
      "Elasticity / willingness-to-pay is being relied on without clean non-promotional price variation or competitor data — flag that the model is capped by data the firm likely lacks and may be confidently wrong.",
      "A price increase is being planned — hedge that realization depends on sales-force conviction and the value story, not the optimized number, and is usually well below the announced figure.",
      "Dynamic or personalized pricing is being considered — hedge toward the industry pattern that governance, channel conflict, brand/fairness, and regulatory exposure cap the upside and can dwarf the gain.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across commercial books at this scale, most margin is lost in the pocket waterfall rather than the list — without your allocation the leak is typically...",
      "As an industry pattern (not your measured figure), price-increase realization tends to depend on sales-force conviction and lands well below the announced increase...",
      "Without clean non-promotional and competitor data, the industry pattern is that elasticity models overfit promotions and overstate confidence in...",
      "Peer programs commonly find a share of promotions run below break-even once forward-buy and cannibalization are netted out, though your true figure needs a baseline...",
    ],
    flagWithoutEvidence: [
      "A specific pocket-margin leakage or recovery figure for this tenant",
      "This tenant's actual price elasticity or willingness-to-pay by segment",
      "A claim that an announced price increase will fully (or by a specific %) realize for this tenant",
      "A specific incremental promotion ROI for this tenant absent a defensible baseline",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where is margin leaking / list-to-pocket price waterfall",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "waterfall",
      note: "List → on-invoice → off-invoice (rebates, freight, terms, co-op) → pocket, each step sized to expose where margin actually leaks.",
    },
    {
      questionPattern: "value of a pricing program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled margin opportunity to realizable value with sales-force-conviction, data-poverty, and governance/channel-risk haircuts.",
    },
    {
      questionPattern: "what drives pricing value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (sales-force conviction, transaction/competitor data poverty, governance & channel/brand risk) on realizable margin.",
    },
    {
      questionPattern: "win rate vs price / where discount stops buying volume",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Empirical win-rate-vs-price curve by segment, marking the flat region where extra discount buys no incremental win and is pure leakage.",
    },
    {
      questionPattern: "pricing & revenue-management KPI scorecard",
      exhibitKind: "table",
      note: "Pocket margin, price realization, discount leakage, win-rate-vs-price, deal-desk cycle, price-increase realization, promotion ROI, margin/unit, override rate, contract compliance, dispersion, uplift vs planning ranges.",
    },
    {
      questionPattern: "price dispersion / unexplained variation for like deals",
      exhibitKind: "chart",
      chartKind: "range-bar",
      note: "Range-bar of pocket price across like-for-like cohorts, surfacing the unexplained low tail that is the fastest leakage recovery.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Pocket-price truth established first — full waterfall with off-invoice allocation — so the program attacks the real leak, not the list illusion",
      "Leakage and dispersion recovery sequenced early to fund and prove the program with low-risk, bottom-line margin before any optimization bet",
      "Price moves shipped with a sales-force value story and a deal-desk backstop, so realization rides on conviction the field actually has",
      "Elasticity and dynamic pricing pursued only where clean transaction + competitor data exists, validated by A/B or conjoint, inside explicit guardrails",
      "Value read against baselines/holdouts with honest haircuts for conviction, data poverty, and governance/channel risk",
    ],
    failureDrivers: [
      "Chasing list-price increases while ignoring the pocket waterfall, so the increase is given back below the invoice line and never reaches margin",
      "Acting on elasticity or willingness-to-pay models built on promotional swings and no competitor data — confidently wrong optimization",
      "Announcing price increases with no value story or backstop, so realization collapses as reps negotiate them away account-by-account",
      "Running dynamic/personalized pricing without guardrails or legal review, triggering channel conflict, brand backlash, or regulatory exposure that dwarfs the gain",
      "Justifying promotions on gross lift, so trade spend grows while net margin erodes against an unmeasured baseline",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption hinges on whether the sales force believes the price. Waterfall- " +
      "leakage analytics and deal-desk guidance adopt fastest because they give " +
      "reps a defensible floor and recover obvious give-aways without changing " +
      "the list. Contract/renewal compliance follows as finance sees the captured " +
      "escalators. Elasticity-based optimization and price increases adopt only " +
      "once reps trust the value story and can defend the number to customers — " +
      "realization spreads conviction-by-conviction, not by mandate. Governed " +
      "dynamic pricing has the weakest readiness and should expand only inside " +
      "proven guardrails and legal review, never by default.",
    roiClarity: "medium",
    roiClarityBasis:
      "Pocket-margin and leakage recovery are directly measurable in the " +
      "transaction ledger and flow almost entirely to operating margin, so that " +
      "lever's ROI is firm. Elasticity-driven uplift, promotion ROI, and " +
      "dynamic-pricing gains are real but influenced by mix, seasonality, " +
      "competitor moves, and demand, and are easy to over-credit without " +
      "baselines/holdouts. The structural discounts — sales-force conviction and " +
      "transaction/competitor data poverty — are large and tenant-specific, so " +
      "ROI is firm only when both leakage is measured on a true waterfall and " +
      "optimization is validated; without that discipline the case is routinely " +
      "overstated, which holds clarity at medium.",
  },

  regulatoryFrame: {
    name: "Price discrimination, antitrust & pricing-fairness law",
    relevance:
      "The dominant regulatory frame for pricing discipline: differential, " +
      "segment, dynamic, and personalized pricing must stay defensible under " +
      "price-discrimination law (e.g. Robinson-Patman), avoid antitrust and " +
      "algorithmic-collusion exposure, respect Minimum Advertised Price and " +
      "resale-price-maintenance limits across channels, and meet consumer- " +
      "protection and pricing-fairness/transparency rules in consumer contexts. " +
      "Dynamic and algorithmic pricing in particular require guardrails and " +
      "legal review of discrimination and collusion exposure (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (parallel-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
