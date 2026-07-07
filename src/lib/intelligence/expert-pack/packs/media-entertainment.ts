// Consilium expert — Media & Entertainment: Content & Audience (cross-cutting).
//
// W3 draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting media & entertainment expert spanning the content-and-audience
// value chain: content production & supply chain, streaming/distribution,
// audience & subscriber growth/churn, advertising & monetization, rights &
// royalties, and personalization/recommendation. Cross-industry within M&E —
// the same content-cost + subscriber-economics + ad-vs-sub spine recurs across
// streaming/SVOD, broadcast & cable, studios, music, gaming-adjacent media,
// and digital publishing.
//
// Honesty posture: this is a domain where the two structural truths are blunt
// and uncomfortable. (1) Content cost and subscriber churn DOMINATE the P&L —
// no amount of AI personalization fixes a content slate that doesn't land or a
// churn rate that leaks faster than acquisition fills. (2) Content ROI is hard
// to predict because hits are FAT-TAILED: a small number of titles drive the
// majority of engagement and renewal, and pre-release "AI green-light" models
// routinely overstate their power to call winners. The ad-vs-subscription
// trade-off is central and genuinely two-sided: ad-supported tiers raise reach
// and ARPU floors but cap experience and price ceilings. Excludes the
// physical-distribution / theatrical-exhibition logistics motion and the
// corporate-IT/back-office estate — those route to other experts.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const mediaEntertainmentExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.media-entertainment",
    expertName: "Media & Entertainment — Content & Audience Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "media-entertainment",
    scopeNote:
      "AI across the media content-and-audience value chain: content " +
      "production & supply chain, streaming/distribution, audience & " +
      "subscriber growth/churn, advertising & monetization, rights & " +
      "royalties, and personalization/recommendation. Covers the trade-offs " +
      "across subscriber churn, ARPU, content cost per engaged hour, " +
      "engagement/watch-time, content ROI, and the ad-vs-subscription " +
      "balance — and is candid that content cost and subscriber churn " +
      "dominate the P&L, that content ROI is hard to predict because hits " +
      "are fat-tailed, and that ad and subscription monetization are a real " +
      "two-sided trade-off, not a free lunch. Cross-industry within M&E " +
      "(streaming/SVOD, broadcast & cable, studios, music, digital " +
      "publishing). Excludes physical-distribution / theatrical-exhibition " +
      "logistics and the corporate-IT / back-office estate — those route to " +
      "other experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "subscriber_churn",
        name: "Subscriber churn (monthly)",
        definition:
          "Share of paying subscribers who cancel in a period as a fraction " +
          "of the starting base — measured gross (all cancels) and ideally " +
          "split into voluntary (active cancel) versus involuntary " +
          "(payment-failure) churn, since they have different remedies.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 6,
          basis:
            "Monthly SVOD churn ranges; mature, content-deep services hold the " +
            "low end, while newer or promotion-heavy services and ad-tier-only " +
            "cohorts churn at the top — annual plans and bundles run lower",
          label: "planning-range",
        },
        dataSource:
          "Subscription-management / billing system cancellation and renewal " +
          "events, by cohort, plan, and voluntary-vs-involuntary reason",
        whyItMatters:
          "Together with content cost, the dominant driver of streaming " +
          "economics — small monthly churn compounds brutally over a year, and " +
          "acquisition that just refills a leaking base burns marketing for no " +
          "net growth. Every retention and personalization AI bet is judged on " +
          "whether it moves this, and involuntary churn is often the cheapest " +
          "win nobody is working.",
      },
      {
        key: "arpu",
        name: "Average revenue per user (ARPU)",
        definition:
          "Total subscription plus advertising revenue in a period divided by " +
          "the average number of subscribers (or active users), blended across " +
          "plans and tiers — the per-user monetization yield.",
        unit: "USD/month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 15,
          basis:
            "Blended SVOD/AVOD ARPU ranges; premium ad-free tiers and bundled " +
            "households sit high, ad-supported and emerging-market tiers low — " +
            "ad revenue can lift blended ARPU above the sub price on engaged users",
          label: "planning-range",
        },
        dataSource:
          "Subscription billing revenue plus ad-server / SSP revenue divided " +
          "by average paid/active users, by tier and market",
        whyItMatters:
          "The monetization side of the equation churn sits opposite — growth " +
          "that trades ARPU for volume (deep discounts, low-price ad tiers) can " +
          "look like wins while eroding unit economics. The ad-vs-subscription " +
          "trade-off lives here: ad tiers can raise blended ARPU on engaged " +
          "users but cap the price ceiling and add experience cost.",
      },
      {
        key: "content_cost_per_engaged_hour",
        name: "Content cost per engaged hour",
        definition:
          "Amortized content spend attributed to a title (or slate) divided " +
          "by the engaged viewing hours it generates over a measurement " +
          "window — the unit cost of the engagement the content actually buys.",
        unit: "USD/hour",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.05,
          high: 0.5,
          basis:
            "Wide spread by content type: deep catalog and licensed library " +
            "amortize cheap per engaged hour, while marquee originals and " +
            "live sports rights run far higher — the band reflects the common " +
            "blended catalog range, not tentpoles",
          label: "planning-range",
        },
        dataSource:
          "Content-amortization ledger (title-level cost capitalization and " +
          "amortization) joined to engagement/streaming telemetry by title",
        whyItMatters:
          "The clearest lens on whether content spend earns its keep — content " +
          "is the largest cost line, so this is the efficiency verdict on the " +
          "slate. It exposes the fat tail: a few titles deliver engaged hours " +
          "at very low unit cost while a long tail of expensive misses drags " +
          "the blended number, which is exactly where green-light discipline " +
          "and catalog AI must focus.",
      },
      {
        key: "engagement_watch_time",
        name: "Engagement / watch time per subscriber",
        definition:
          "Average engaged viewing (or listening/reading) time per active " +
          "subscriber per period — typically streamed hours per month — " +
          "counting genuine engaged consumption, not background or auto-play.",
        unit: "hours/month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Monthly engaged-hours-per-subscriber ranges for video streaming; " +
            "habit-forming, content-deep services sit high, niche or single-" +
            "show services low — other media (audio, reading) have their own " +
            "scales",
          label: "planning-range",
        },
        dataSource:
          "Streaming/playback telemetry and session analytics, engaged-time " +
          "qualified (not raw stream-start), by subscriber and title",
        whyItMatters:
          "The leading indicator of retention — engaged subscribers churn far " +
          "less, so watch time is the early-warning gauge churn confirms later. " +
          "Personalization and recommendation AI target it directly, but it " +
          "must be engaged time, not vanity stream-starts, or the model " +
          "optimizes for the wrong behavior.",
      },
      {
        key: "content_roi",
        name: "Content ROI (title / slate)",
        definition:
          "Value a title or slate returns — measured as attributed " +
          "incremental retention, acquisition, and engaged hours converted to " +
          "revenue — relative to its fully-loaded amortized cost, expressed as " +
          "a return multiple on content investment.",
        unit: "x",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.5,
          high: 3,
          basis:
            "Title-level content-ROI distributions are extremely skewed and " +
            "fat-tailed: most titles cluster around or below breakeven while a " +
            "small number of hits return many multiples — the band is the " +
            "common middle, not the tails",
          label: "planning-range",
        },
        dataSource:
          "Content-amortization cost joined to attributed value (incremental " +
          "retention/acquisition modeling plus engaged-hour monetization) at " +
          "title or slate level",
        whyItMatters:
          "The honesty check on the entire content bet — and the hardest metric " +
          "to pin down, because attribution to retention and acquisition is " +
          "loose and hits are fat-tailed. Pre-release AI 'green-light' scores " +
          "must be read against this with humility: the distribution is " +
          "dominated by a few unpredictable winners, so portfolio discipline " +
          "beats any claim of picking hits in advance.",
      },
      {
        key: "ad_fill_rate",
        name: "Ad fill rate",
        definition:
          "Share of available advertising impressions (avails) that are " +
          "actually filled with paid ads, versus going unsold or to house/" +
          "make-good inventory — the sell-through of ad inventory.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "CTV/streaming ad fill-rate ranges; premium, high-demand inventory " +
            "and strong direct-sold books fill near the top, while thin demand, " +
            "frequency caps, and targeting constraints leave avails unsold at " +
            "the low end",
          label: "planning-range",
        },
        dataSource:
          "Ad server / SSP delivery logs (avails, filled impressions, unsold " +
          "and house inventory) by inventory type and demand source",
        whyItMatters:
          "The yield side of the ad-supported model — unsold avails are " +
          "monetization left on the table, but cramming fill at the cost of ad " +
          "load and relevance degrades the experience and feeds churn. It is " +
          "the metric where the ad-vs-subscription trade-off becomes concrete: " +
          "more ad load lifts fill-driven revenue but pressures retention.",
      },
      {
        key: "customer_acquisition_cost",
        name: "Customer acquisition cost (CAC)",
        definition:
          "Fully-loaded marketing and promotional spend to acquire a new " +
          "paying subscriber in a period, divided by net new paid subscribers " +
          "acquired — the cost to add a unit of the base.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 25,
          high: 150,
          basis:
            "Streaming subscriber-acquisition-cost ranges; organic/content-" +
            "driven and bundled acquisition sit low, while paid-media-heavy and " +
            "competitive-market acquisition runs high — promo-driven adds carry " +
            "hidden churn cost the headline CAC misses",
          label: "planning-range",
        },
        dataSource:
          "Marketing and promotion spend from finance divided by net new paid " +
          "subscribers from the subscription system, by channel and campaign",
        whyItMatters:
          "The acquisition-efficiency verdict that only makes sense paired with " +
          "churn — CAC recovered over a short subscriber lifetime is a treadmill. " +
          "AI targeting and creative can lower CAC, but a low headline CAC that " +
          "buys high-churn promotional subscribers is a false economy; CAC and " +
          "churn must always be read together.",
      },
      {
        key: "completion_rate",
        name: "Completion rate",
        definition:
          "Share of started titles (or episodes/seasons) that viewers finish, " +
          "measured against a defined completion threshold — a proxy for " +
          "whether content satisfies the demand the recommendation created.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 75,
          basis:
            "Title/episode completion ranges; bingeable serialized content and " +
            "strong recommendations complete high, while mismatched recommends " +
            "and weak content abandon early — film vs episodic differ",
          label: "planning-range",
        },
        dataSource:
          "Playback telemetry: title/episode starts versus completions against " +
          "a defined completion threshold, by title and recommendation surface",
        whyItMatters:
          "The quality signal that distinguishes a good recommendation from a " +
          "clickbait one — high starts with low completion means the system is " +
          "luring viewers into content that disappoints, which erodes trust and " +
          "engagement. It keeps personalization honest: optimize for completed, " +
          "satisfying engagement, not just play-starts.",
      },
      {
        key: "catalog_utilization",
        name: "Catalog utilization",
        definition:
          "Share of the licensed/owned content catalog that drives meaningful " +
          "engagement in a period (e.g. titles surpassing an engagement " +
          "threshold) versus dead inventory that is paid for but barely watched.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Catalogs are long-tailed: a minority of titles drive most " +
            "engagement, so a large share of inventory sees little use — the " +
            "band reflects the common active-share range, varying with catalog " +
            "size and curation",
          label: "planning-range",
        },
        dataSource:
          "Engagement telemetry by title joined to the content catalog and " +
          "licensing/amortization ledger to flag low-utilization inventory",
        whyItMatters:
          "The waste lens on content spend — paying to license or carry titles " +
          "almost nobody watches is direct margin erosion, and the renewal of " +
          "low-utilization licenses is an avoidable cost. Recommendation and " +
          "merchandising AI can lift utilization by surfacing the deep catalog, " +
          "but it also exposes which content simply should not be renewed.",
      },
      {
        key: "subscriber_growth",
        name: "Net subscriber growth",
        definition:
          "Net change in paying subscribers in a period — gross additions " +
          "minus churned subscribers — as an absolute count or a rate on the " +
          "starting base, the true growth of the paying base.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 10,
          basis:
            "Period net-growth-rate ranges vary sharply by lifecycle stage: " +
            "launch/expansion services grow fast, while mature services in " +
            "saturated markets fight to stay net-positive against churn — the " +
            "band reflects a common steady-state range",
          label: "planning-range",
        },
        dataSource:
          "Subscription system gross-add and churn events netted by cohort, " +
          "plan, and market over the period",
        whyItMatters:
          "The bottom line of the acquisition-vs-retention engine — net growth " +
          "is gross adds minus churn, so it makes the leaky-bucket truth " +
          "unavoidable: pouring CAC into the top while churn drains the bottom " +
          "produces expensive treadmill growth. It is the metric that forces " +
          "retention and acquisition to be judged as one system.",
      },
      {
        key: "royalty_leakage",
        name: "Royalty leakage / accuracy",
        definition:
          "Share of rights-holder royalty and residual obligations that are " +
          "mis-paid — over-paid, under-paid, late, or unreconciled — against " +
          "the correct amount owed under the underlying rights and contract " +
          "terms, expressed as an error rate on royalty value processed.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 8,
          basis:
            "Royalty-accuracy/leakage ranges from rights-and-royalty audits; " +
            "manual or fragmented rights data drives the high end, while " +
            "governed, automated royalty systems hold low — complex multi-party " +
            "and territory deals leak more",
          label: "planning-range",
        },
        dataSource:
          "Royalty / residuals accounting system reconciled to the rights " +
          "catalog, contract terms, and consumption/usage data, with audit " +
          "exceptions",
        whyItMatters:
          "The quiet margin-and-trust line — leakage both erodes profit and " +
          "breaks the trust of creators and rights holders, and under-payment " +
          "carries audit and legal exposure. Rights data is notoriously messy, " +
          "so this is where document-extraction and reconciliation AI pays off, " +
          "but only with human accountability because mis-paying creators is a " +
          "reputational and contractual risk.",
      },
    ],

    painThemes: [
      {
        key: "content_cost_dominance",
        name: "Content cost dominance (the line that dwarfs everything)",
        description:
          "Content is the largest and stickiest cost line — multi-year output " +
          "deals, sports rights, and original commissions lock in spend years " +
          "ahead of knowing what audiences will want — so the P&L is dominated " +
          "by content commitments that no operational AI efficiency can offset. " +
          "Teams over-index on shaving operating cost while the content slate, " +
          "the real driver, is decided on instinct and relationships.",
        detectionSignal:
          "Content amortization as the dominant share of cost; rising content " +
          "cost per engaged hour; a small set of titles carrying most " +
          "engagement while a long tail underperforms; renewal of expensive " +
          "rights without a utilization or ROI read.",
        diagnosticQuestion:
          "What is your content cost per engaged hour by title type, and how " +
          "concentrated is engagement — what share of your content drives the " +
          "majority of watch time and renewal?",
      },
      {
        key: "churn_leaky_bucket",
        name: "Churn leaky-bucket (acquisition refilling, not growing)",
        description:
          "Subscriber churn drains the base faster than teams admit, so " +
          "marketing spends to acquire subscribers who mostly replace churned " +
          "ones — expensive treadmill growth. Voluntary churn (content fatigue, " +
          "price) and involuntary churn (payment failure) get lumped together, " +
          "and the cheapest fix — dunning and involuntary-churn recovery — is " +
          "often unworked.",
        detectionSignal:
          "Net subscriber growth far below gross adds; high CAC paired with " +
          "short subscriber lifetime; voluntary and involuntary churn not split; " +
          "post-content-launch churn spikes when a tentpole ends; promo cohorts " +
          "churning hard at first full-price bill.",
        diagnosticQuestion:
          "What is your monthly churn split into voluntary versus involuntary, " +
          "and how much of your gross subscriber addition is net new versus " +
          "replacing churned subscribers?",
      },
      {
        key: "fat_tailed_content_roi",
        name: "Fat-tailed content ROI (hits can't be reliably predicted)",
        description:
          "Content returns are extremely skewed — a few hits drive most of the " +
          "value and most titles cluster near breakeven — so any model, AI or " +
          "human, that claims to call winners pre-release is overstating its " +
          "power. Treating green-light AI scores as deterministic, or " +
          "back-fitting a 'we predicted it' narrative onto a hit, leads to " +
          "false confidence and slate concentration risk.",
        detectionSignal:
          "A green-light or content-scoring model presented as a hit-picker; " +
          "post-hoc attribution that credits a model for an unpredictable hit; " +
          "slate decisions justified by point scores with no portfolio framing " +
          "or honest hit-rate distribution.",
        diagnosticQuestion:
          "When you use a model to inform green-light or acquisition decisions, " +
          "how is its real predictive lift measured against the fat-tailed " +
          "outcome distribution — and is it framed as portfolio guidance or as " +
          "a hit-picker?",
      },
      {
        key: "ad_vs_sub_tradeoff",
        name: "Ad-vs-subscription trade-off mismanaged",
        description:
          "Ad-supported tiers raise reach, lower price barriers, and add a " +
          "second revenue stream, but more ad load and aggressive targeting " +
          "degrade the experience and pressure retention — and the two models " +
          "are managed by different teams optimizing opposing metrics (fill/" +
          "yield vs CSAT/churn), so the trade-off is made implicitly and badly.",
        detectionSignal:
          "Ad load creeping up to chase fill rate while churn rises on ad " +
          "tiers; subscription and ad teams optimizing in isolation; no shared " +
          "view of blended ARPU vs experience cost; ad-tier subscribers churning " +
          "or up-tiering in ways nobody reconciles to ad strategy.",
        diagnosticQuestion:
          "How do you balance ad fill/yield against ad-tier churn and " +
          "experience, and who owns the blended ARPU-versus-retention trade-off " +
          "across your ad and subscription teams?",
      },
      {
        key: "rights_royalty_complexity",
        name: "Rights & royalty complexity (messy data, leaking margin)",
        description:
          "Rights are encoded in thousands of contracts with windows, " +
          "territories, exclusivity, and multi-party splits, often as " +
          "unstructured documents — so the rights catalog is incomplete and " +
          "royalty calculations leak. The same messiness blocks confident " +
          "content-availability and personalization decisions because nobody " +
          "fully knows what can be shown where, to whom, and at what cost.",
        detectionSignal:
          "Rights data spread across documents and spreadsheets; royalty " +
          "disputes and audit findings; uncertainty about availability by " +
          "territory/window; manual reconciliation between usage, contracts, " +
          "and payments; creator/rights-holder trust issues over payment accuracy.",
        diagnosticQuestion:
          "How structured and complete is your rights catalog, what is your " +
          "royalty leakage/accuracy rate, and how much of rights and royalty " +
          "reconciliation is still manual document work?",
      },
      {
        key: "personalization_engagement_bait",
        name: "Personalization optimizing the wrong signal",
        description:
          "Recommendation systems tuned to clicks and play-starts can lure " +
          "viewers into content they abandon, inflate vanity engagement, and " +
          "over-expose a narrow set of titles — starving the deep catalog the " +
          "business pays to carry and degrading the satisfaction that actually " +
          "retains. Optimizing watch-time alone can also push addictive " +
          "patterns that invite scrutiny.",
        detectionSignal:
          "High play-starts with low completion rate; recommendation surfaces " +
          "concentrated on a few titles while catalog utilization is low; " +
          "engagement up but retention flat or down; no completion or " +
          "satisfaction signal in the recommendation objective.",
        diagnosticQuestion:
          "Does your recommendation system optimize for completed, satisfying " +
          "engagement and catalog breadth, or for raw play-starts — and what is " +
          "your completion rate versus catalog utilization?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "personalization_recommendation",
        name: "Personalization & recommendation",
        valueMechanism:
          "A recommendation model matches each viewer to content they will " +
          "genuinely engage with and complete, surfaces the deep catalog rather " +
          "than a narrow few, and lifts engaged watch time per subscriber — " +
          "which is the leading indicator that lowers churn and raises catalog " +
          "utilization on content already paid for.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Viewing/engagement telemetry with completion signals, not just play-starts",
          "Content metadata and catalog with rights/availability constraints",
          "Subscriber profile and context for personalization, privacy-scoped",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Optimize for completed, satisfying engagement and catalog breadth — clicks/play-starts alone reward clickbait recommendations",
          "Watch-time-only objectives can push addictive patterns that invite regulatory and reputational scrutiny",
          "Recommendations must respect rights/availability by territory and window or they surface content that can't be served",
        ],
        metricsMoved: [
          "engagement_watch_time",
          "completion_rate",
          "catalog_utilization",
          "subscriber_churn",
        ],
      },
      {
        key: "churn_prediction_retention",
        name: "Churn prediction & retention orchestration",
        valueMechanism:
          "A model reads engagement decay, billing/payment signals, and " +
          "content-fit to flag subscribers at churn risk and triggers the right " +
          "save — re-engagement content, plan/price intervention, or dunning " +
          "for involuntary churn — so the base leaks less and acquisition spend " +
          "produces net growth rather than refilling.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Engagement and content-consumption history with recency/decay signals",
          "Billing and payment-failure events split into voluntary vs involuntary",
          "A retention workflow that turns a risk flag into an actual intervention",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A churn flag with no triggered save is worthless — the value is in the intervention, not the prediction",
          "Involuntary (payment-failure) churn is often the cheapest, most controllable win and must be handled distinctly from voluntary",
          "Aggressive save offers can train subscribers to threaten cancellation — calibrate and protect ARPU",
        ],
        metricsMoved: [
          "subscriber_churn",
          "subscriber_growth",
          "customer_acquisition_cost",
        ],
      },
      {
        key: "content_demand_greenlight",
        name: "Content demand forecasting & green-light support",
        valueMechanism:
          "A model estimates the audience demand, engagement, and retention " +
          "value of a prospective title or acquisition from genre, talent, " +
          "comparables, and catalog gaps — informing green-light, acquisition, " +
          "and licensing decisions as portfolio guidance that improves content " +
          "cost per engaged hour and slate balance.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Historical title-level engagement, retention attribution, and cost",
          "Content metadata, comparables, and catalog-gap analysis",
          "Market/competitive availability and rights/licensing cost data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Hits are fat-tailed — present as portfolio guidance and honest demand ranges, never as a deterministic hit-picker",
          "Models trained on past slates encode prior bias and can starve novel or diverse content — audit for it",
          "Green-light accountability stays human; the model informs, the commissioning leader decides and owns the bet",
        ],
        metricsMoved: [
          "content_roi",
          "content_cost_per_engaged_hour",
          "catalog_utilization",
        ],
      },
      {
        key: "ad_yield_optimization",
        name: "Ad yield & inventory optimization",
        valueMechanism:
          "AI forecasts avails, optimizes targeting and dynamic ad insertion, " +
          "and balances ad load against experience to fill more inventory at " +
          "better yield — raising fill rate and ad-driven ARPU while holding ad " +
          "load below the level that drives ad-tier churn.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Ad-server/SSP avails, delivery, and yield data by inventory type",
          "Audience segments and engagement context for targeting, privacy-scoped",
          "Ad-tier churn and experience signals to bound ad load",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Chasing fill rate with rising ad load degrades experience and feeds ad-tier churn — optimize blended ARPU net of retention cost",
          "Ad targeting on viewing data must respect privacy law and consent, especially for sensitive segments and minors",
          "Frequency and relevance caps must be enforced or yield gains come at experience and brand cost",
        ],
        metricsMoved: [
          "ad_fill_rate",
          "arpu",
          "subscriber_churn",
        ],
      },
      {
        key: "rights_royalty_automation",
        name: "Rights & royalty extraction and reconciliation",
        valueMechanism:
          "AI extracts rights terms (windows, territories, splits, " +
          "exclusivity) from contract documents into a structured catalog and " +
          "reconciles usage to contract terms to calculate royalties correctly " +
          "— reducing royalty leakage, surfacing availability with confidence, " +
          "and rebuilding rights-holder trust through accurate, timely payment.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Contract document corpus with extractable rights and royalty terms",
          "Consumption/usage data joined to titles and territories",
          "A governed rights catalog and royalty accounting system to write into",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Mis-paying creators is a contractual, legal, and reputational risk — extracted terms and royalty calculations require human review before payment",
          "Document extraction must preserve source-clause citations so every term is auditable back to the contract",
          "Ambiguous or conflicting rights terms must go to human adjudication, not be silently resolved by the model",
        ],
        metricsMoved: [
          "royalty_leakage",
          "catalog_utilization",
        ],
      },
      {
        key: "content_supply_chain_assist",
        name: "Content production & supply-chain assist",
        valueMechanism:
          "GenAI accelerates content operations — metadata tagging, " +
          "localization/dubbing/subtitling, promo and trailer assembly, and QC " +
          "— compressing the time and cost to get content market-ready and " +
          "discoverable, which improves catalog utilization and speed-to-screen " +
          "without touching the creative green-light.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Content assets, scripts, and existing metadata for tagging/localization",
          "Localization style guides, glossaries, and QC standards",
          "Distribution/CMS pipeline to publish enriched assets",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Localization and dubbing carry talent, likeness, and union/guild constraints — human review and rights clearance are required",
          "Auto-generated metadata and promos must be QC'd before publish; errors degrade discovery and brand",
          "Synthetic/generative content raises IP, consent, and disclosure questions that need a governance position",
        ],
        metricsMoved: [
          "catalog_utilization",
          "content_cost_per_engaged_hour",
          "engagement_watch_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_audience_data_spine",
        name: "Unified audience & engagement data spine",
        description:
          "A shared subscriber-and-engagement context layer joining " +
          "subscription/billing, playback telemetry, and ad data into one " +
          "current view — so personalization, churn, and ad-yield AI all reason " +
          "over the same complete picture of each viewer rather than siloed " +
          "fragments, and engaged-time and completion signals are defined once.",
        boundary:
          "Owns cross-system audience identity, the engagement event model, and " +
          "definitions of engaged-time/completion; does not own the content " +
          "catalog, the recommendation models, or the ad-serving stack.",
        humanAccountabilityPoint: "Head of Data / Audience Platform Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "governed_rights_catalog",
        name: "Governed rights & royalty catalog",
        description:
          "A structured, governed rights catalog — extracted from contracts " +
          "and reconciled to usage — that is the single source of truth for " +
          "availability (territory, window, exclusivity) and royalty " +
          "obligations, so content can be served and creators paid with " +
          "confidence, and personalization respects availability constraints.",
        boundary:
          "Owns the rights catalog, availability truth, and royalty " +
          "reconciliation; does not own the content distribution surfaces or " +
          "the commercial negotiation of the underlying deals.",
        humanAccountabilityPoint: "Head of Rights / Content Finance",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "personalization_overlay",
        name: "Personalization & recommendation overlay",
        description:
          "A recommendation and merchandising layer over the existing content " +
          "platform that optimizes for completed, satisfying engagement and " +
          "catalog breadth — lifting engaged watch time and catalog " +
          "utilization without replacing the streaming platform, with " +
          "availability and completion built into the objective.",
        boundary:
          "Owns ranking, merchandising, and the engagement objective; does not " +
          "own the streaming/CDN platform, the content catalog, or rights " +
          "availability (which it consumes from the rights catalog).",
        humanAccountabilityPoint: "VP Product / Personalization Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "retention_and_yield_command",
        name: "Retention & monetization command layer",
        description:
          "A coordinated layer that runs churn prediction, retention saves, " +
          "and ad-vs-subscription yield decisions against one shared view of " +
          "blended ARPU and retention — so the ad and subscription teams stop " +
          "optimizing opposing metrics in isolation and the ad-load-vs-churn " +
          "trade-off is made explicitly and owned.",
        boundary:
          "Owns churn-save orchestration and the blended-ARPU-vs-retention " +
          "trade-off policy; does not own pricing strategy, the ad sales " +
          "relationship, or the content slate.",
        humanAccountabilityPoint: "Head of Subscriber / Revenue Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from levers in rising risk and falling predictability " +
        "order, against the blunt truth that content cost and churn dominate. " +
        "(1) Engagement & retention — personalization that lifts engaged " +
        "watch time and catalog utilization, plus churn prediction wired to " +
        "real saves (especially the cheap involuntary-churn recovery); the " +
        "most reliable, data-rich win because it operates on owned content and " +
        "measurable behavior. (2) Monetization balance — ad-yield optimization " +
        "that fills inventory better while holding ad load below the churn " +
        "threshold, lifting blended ARPU only when retention is protected. " +
        "(3) Content cost discipline — rights/royalty reconciliation cuts " +
        "leakage and exposes dead catalog, and supply-chain assist compresses " +
        "make-ready cost. The content green-light lever is deliberately " +
        "discounted: hits are fat-tailed, so AI informs portfolio discipline " +
        "rather than picking winners, and its value is real but bounded and " +
        "slow to prove. The durable program fixes the audience data spine and " +
        "rights catalog first, banks engagement/retention wins, balances " +
        "monetization with retention as one decision, and treats content " +
        "scoring as humble portfolio guidance.",
      dominantHaircutFactors: [
        {
          factor: "Content-cost gravity (AI can't offset slate economics)",
          rationale:
            "Content cost dominates the P&L and is locked in years ahead; no " +
            "amount of operational AI efficiency offsets a slate that doesn't " +
            "land, so projected value must be discounted for the share that is " +
            "captive to content economics the AI bet does not control.",
          typicalHaircut: {
            low: 0.3,
            high: 0.6,
            basis:
              "Gap between modeled operational/engagement value and bottom-line " +
              "impact once content-cost gravity and slate outcomes dominate the P&L",
            label: "planning-range",
          },
        },
        {
          factor: "Content-ROI unpredictability (fat-tailed hits)",
          rationale:
            "Because returns are dominated by a few unpredictable hits, " +
            "green-light and acquisition models have bounded real predictive " +
            "lift; value attributed to 'picking winners' must be heavily " +
            "discounted toward portfolio-level, not title-level, confidence.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Difference between claimed pre-release predictive power and " +
              "realized hit-rate against a fat-tailed outcome distribution",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution & churn-acquisition optimism",
          rationale:
            "Engagement, retention, and ARPU gains are influenced by content, " +
            "price, and market at once; crediting them to one AI bet, or " +
            "counting promo-driven acquisition as durable growth, overstates " +
            "realized value.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Gap between claimed and cohort/holdout-controlled attribution of " +
              "personalization, retention, and ad-yield impact",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Engagement / watch-time uplift (personalization)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative gains in engaged watch time and catalog " +
              "utilization from recommendation programs, net of attribution",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in engagement_watch_time / catalog_utilization",
        },
        {
          lever: "Churn reduction (retention orchestration + dunning)",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reported relative monthly-churn reduction from churn-save and " +
              "involuntary-churn-recovery programs, contingent on action wiring",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in subscriber_churn",
        },
        {
          lever: "Ad yield / blended ARPU uplift (ad optimization)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported fill-rate and ad-driven ARPU gains net of the ad-tier " +
              "retention cost of added ad load",
            label: "planning-range",
          },
          measuredAs: "Relative lift in ad_fill_rate / blended arpu",
        },
      ],
      timeToValueBand:
        "Personalization and ad-yield overlays and involuntary-churn (dunning) " +
        "recovery: 1-2 quarters on existing data. Churn prediction wired to " +
        "saves: 2-3 quarters to calibrate and prove net-growth impact. Rights/" +
        "royalty extraction and the data spine: 2-4 quarters of curation and " +
        "governance. Content demand/green-light value: multiple slate cycles " +
        "(years) to validate against fat-tailed outcomes — the slowest to prove.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Streaming / OTT platform & CDN",
          role:
            "Content playback, delivery, and the engagement telemetry the " +
            "whole audience-and-personalization stack reads — the operational " +
            "core of distribution.",
          examples: [
            "AWS Media Services / Elemental",
            "Brightcove",
            "JW Player",
            "Akamai (delivery)",
          ],
        },
        {
          name: "Subscription management & billing",
          role:
            "System of record for subscribers, plans, billing, payment events, " +
            "and churn — the source for ARPU, churn, and growth.",
          examples: [
            "Zuora",
            "Recurly",
            "Stripe Billing",
            "Cleeng",
          ],
        },
        {
          name: "Content / media asset management & metadata",
          role:
            "Catalog, content metadata, scheduling, and the make-ready " +
            "pipeline that feeds discovery and distribution.",
          examples: [
            "Dalet",
            "Avid MediaCentral",
            "Vimeo / Movie Labs-aligned MAM systems",
          ],
        },
        {
          name: "Rights & royalty management",
          role:
            "Rights catalog (windows, territories, exclusivity) and royalty/" +
            "residuals accounting — the truth for availability and creator pay.",
          examples: [
            "FilmTrack",
            "Rightsline",
            "SAP IS-Media / royalty systems",
          ],
        },
        {
          name: "Ad server / SSP & monetization",
          role:
            "Ad inventory, dynamic ad insertion, yield, and fill — the " +
            "monetization engine for ad-supported tiers.",
          examples: [
            "Google Ad Manager",
            "Magnite",
            "FreeWheel",
            "SpringServe",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Content Officer / Head of Content",
          accountability:
            "The content slate, green-light and acquisition decisions, and " +
            "content cost versus engagement and renewal value.",
        },
        {
          title: "Chief Revenue / Monetization Officer",
          accountability:
            "Subscription and advertising revenue, ARPU, pricing/packaging, " +
            "and the ad-vs-subscription monetization balance.",
        },
        {
          title: "Head of Subscriber / Growth",
          accountability:
            "Subscriber acquisition, retention/churn, CAC, and net growth of " +
            "the paying base.",
        },
        {
          title: "VP Product / Personalization",
          accountability:
            "Discovery, recommendation, and the engagement experience that " +
            "drives watch time and completion.",
        },
        {
          title: "Head of Rights & Royalties / Content Finance",
          accountability:
            "Rights catalog accuracy, availability truth, and royalty payment " +
            "accuracy to creators and rights holders.",
        },
        {
          title: "Head of Ad Sales / Yield",
          accountability:
            "Ad inventory yield, fill rate, and the ad-load-versus-experience " +
            "trade-off on ad-supported tiers.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Data privacy & consent (GDPR / CCPA) for viewing data",
          relevance:
            "Personalization, churn modeling, and ad targeting process " +
            "behavioral viewing data; lawful basis, consent, purpose " +
            "limitation, and data-subject rights govern every audience AI bet.",
        },
        {
          name: "Children's privacy & content protection (COPPA / age-appropriate design)",
          relevance:
            "Profiles and content for minors carry stricter consent, " +
            "targeting, and design-code constraints; ad targeting and " +
            "recommendation to children are heavily restricted.",
        },
        {
          name: "Copyright, licensing & rights compliance",
          relevance:
            "Content availability, windowing, and royalty/residual obligations " +
            "are governed by copyright and contract; AI that surfaces or pays " +
            "on content must honor the underlying rights.",
        },
        {
          name: "AI content, IP & disclosure (generative content, likeness/voice rights)",
          relevance:
            "Generative localization, dubbing, and synthetic content raise IP, " +
            "performer-likeness/voice consent, guild/union, and emerging " +
            "AI-disclosure obligations.",
        },
      ],
      canonicalTerms: [
        {
          term: "Churn",
          definition:
            "Share of subscribers cancelling in a period; honest only when " +
            "split into voluntary (active cancel) and involuntary (payment-" +
            "failure), which have different remedies.",
        },
        {
          term: "ARPU",
          definition:
            "Average revenue per user — blended subscription plus advertising " +
            "revenue per subscriber; the per-user monetization yield.",
        },
        {
          term: "Content amortization",
          definition:
            "How a capitalized title's cost is spread over its useful life — " +
            "the basis for content cost per engaged hour and content ROI.",
        },
        {
          term: "Fat-tailed hits",
          definition:
            "The skewed content-outcome distribution where a few titles drive " +
            "most value, making pre-release winner-picking inherently unreliable.",
        },
        {
          term: "Avails / fill rate",
          definition:
            "Available ad impressions and the share of them filled with paid " +
            "ads — the sell-through and yield of ad-supported inventory.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Churn / retention impact",
        authoritativeSource:
          "Subscription-system cancellation and renewal events by cohort, " +
          "split into voluntary and involuntary, joined to retention-save actions",
        whatGoodEvidenceLooksLike:
          "A cohort or holdout comparison of churn for intervened versus " +
          "control subscribers, with voluntary and involuntary churn reported " +
          "separately and the save action shown to have fired.",
        weakEvidenceToReject:
          "A blended churn-rate improvement with no cohort/holdout, no " +
          "voluntary/involuntary split, and no link to a retention action.",
      },
      {
        claim: "Engagement / watch-time and completion impact",
        authoritativeSource:
          "Playback telemetry with engaged-time and completion qualification, " +
          "compared across a personalization treatment and control cohort",
        whatGoodEvidenceLooksLike:
          "An A/B or holdout comparison of engaged watch time and completion " +
          "rate (not raw play-starts), with catalog utilization tracked to " +
          "confirm breadth, not just concentration.",
        weakEvidenceToReject:
          "A rise in play-starts or clicks asserted as engagement, with no " +
          "completion measure, control, or catalog-breadth check.",
      },
      {
        claim: "Content ROI / green-light predictive lift",
        authoritativeSource:
          "Title-level content-amortization cost joined to attributed " +
          "retention/acquisition value and engaged hours across a slate",
        whatGoodEvidenceLooksLike:
          "A backtested predictive-lift measure against the realized fat-tailed " +
          "outcome distribution, framed as portfolio guidance with an honest " +
          "hit-rate, and value attributed via cohort/holdout not post-hoc story.",
        weakEvidenceToReject:
          "A 'the model predicted this hit' anecdote, or a point green-light " +
          "score presented as a deterministic winner-picker with no distribution.",
      },
      {
        claim: "Ad yield / blended ARPU impact",
        authoritativeSource:
          "Ad-server/SSP fill and yield data joined to ad-tier churn and " +
          "blended-ARPU trends over the period",
        whatGoodEvidenceLooksLike:
          "A fill-rate and ad-ARPU improvement shown net of ad-tier retention " +
          "cost — blended ARPU up while ad-tier churn holds — across a " +
          "controlled comparison.",
        weakEvidenceToReject:
          "A fill-rate or ad-revenue rise reported in isolation, with no read " +
          "on ad load, ad-tier churn, or blended ARPU.",
      },
      {
        claim: "Royalty leakage / rights accuracy",
        authoritativeSource:
          "Royalty/residuals accounting reconciled to the rights catalog, " +
          "contract terms, and usage data, with audit exceptions",
        whatGoodEvidenceLooksLike:
          "A before/after leakage/accuracy rate from a royalty audit with " +
          "extracted contract terms carrying source-clause citations and human " +
          "sign-off before payment.",
        weakEvidenceToReject:
          "A claimed leakage reduction with no audit baseline, no clause-level " +
          "citation, or extraction committed to payment without human review.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your content cost per engaged hour by title type, and how concentrated is engagement — what share of your content drives the majority of watch time and renewal?",
      "What is your monthly churn split into voluntary versus involuntary, and how much of your gross subscriber addition is net new versus replacing churned subscribers?",
      "When a model informs green-light or acquisition decisions, how is its real predictive lift measured against the fat-tailed outcome distribution, and is it framed as portfolio guidance or as a hit-picker?",
      "How do you balance ad fill/yield against ad-tier churn and experience, and who owns the blended ARPU-versus-retention trade-off across your ad and subscription teams?",
      "How structured and complete is your rights catalog, what is your royalty leakage/accuracy rate, and how much of rights and royalty reconciliation is still manual document work?",
      "Does your recommendation system optimize for completed, satisfying engagement and catalog breadth, or for raw play-starts — and what is your completion rate versus catalog utilization?",
      "Across subscription, playback, and ad systems, does a single shared view of each viewer's engagement and value exist, or is it fragmented across siloed platforms?",
    ],
    maturitySignals: [
      "Churn is reported split into voluntary and involuntary, net growth is read against gross adds, and involuntary-churn (dunning) recovery is actively worked.",
      "Content is evaluated on cost per engaged hour and title-level ROI, with green-light models framed as portfolio guidance against an honest fat-tailed hit-rate.",
      "The ad-vs-subscription trade-off is owned with a shared blended-ARPU-versus-retention view, not optimized by isolated ad and subscription teams.",
      "Recommendations optimize for completion and catalog breadth, and engagement is measured as engaged time, not raw play-starts.",
      "A governed rights catalog exists with measured royalty accuracy, and a unified audience data spine defines engaged-time/completion once across systems.",
    ],
    redFlags: [
      "Content cost dominates the P&L while green-light decisions are made on instinct with no cost-per-engaged-hour or ROI read, and a few titles silently carry engagement.",
      "Net subscriber growth is far below gross adds, churn is not split voluntary/involuntary, and cheap involuntary-churn recovery is unworked.",
      "A green-light or content-scoring model is presented as a hit-picker, with post-hoc 'we predicted it' attribution and no fat-tailed distribution framing.",
      "Ad load is creeping up to chase fill rate while ad-tier churn rises and no one owns the blended ARPU-versus-retention trade-off.",
      "Rights data lives in documents and spreadsheets, royalty disputes/audit findings recur, and reconciliation is manual — leaking margin and creator trust.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Streaming / OTT platform & CDN (AWS Media, Brightcove, JW Player, Akamai)",
        category: "Content delivery / playback platform",
        switchingCost:
          "High — encoding pipelines, player integrations, CDN contracts, and " +
          "the engagement telemetry schema make replacement a multi-quarter " +
          "program; consumption-based delivery lowers lock-in versus deeply " +
          "integrated platform suites.",
        renewalDynamics:
          "Volume/commit-based delivery and platform contracts; bundling of " +
          "personalization and ad-insertion add-ons at renewal to extend the " +
          "platform — press on portability of telemetry.",
      },
      {
        vendorName: "Subscription & billing (Zuora, Recurly, Stripe Billing, Cleeng)",
        category: "Subscription management / billing system of record",
        switchingCost:
          "Very high — the subscriber and billing system of record with deep " +
          "payment, tax, and entitlement integration; rarely replaced for the " +
          "media function alone.",
        renewalDynamics:
          "Revenue-share or tiered pricing; dunning/retention add-ons bundled " +
          "to defend the account — negotiate on involuntary-churn recovery " +
          "performance.",
      },
      {
        vendorName: "Rights & royalty management (FilmTrack, Rightsline)",
        category: "Rights catalog / royalty & residuals accounting",
        switchingCost:
          "High — the rights catalog and royalty history accumulate value and " +
          "encode the availability and payment truth; migrating contract and " +
          "royalty data is slow and risky.",
        renewalDynamics:
          "Per-title/volume or platform pricing; AI extraction add-ons " +
          "emerging — press on extraction accuracy and source-clause " +
          "citation before relying on it for payment.",
      },
      {
        vendorName: "Ad server / SSP (Google Ad Manager, Magnite, FreeWheel, SpringServe)",
        category: "Ad inventory / yield / dynamic ad insertion",
        switchingCost:
          "Moderate — inventory and demand integrations are portable with " +
          "effort, but accumulated demand relationships, yield tuning, and DAI " +
          "integration raise the real cost of moving.",
        renewalDynamics:
          "Revenue-share/take-rate pricing; consolidation across SSPs and " +
          "CTV — favor take-rate transparency and demand-portability terms.",
      },
    ],
    switchingCosts:
      "The subscription/billing system of record and the streaming/CDN " +
      "platform are the high-lock-in layers the audience stack anchors to, and " +
      "the rights catalog is high-lock-in because the data (availability and " +
      "royalty history) is the real moat, not the software. The value-frontier " +
      "layers — personalization, churn/retention, ad yield — sit in " +
      "moderate-switching-cost positions where outcome terms and data " +
      "portability are negotiable. The durable lock-in is accumulated DATA " +
      "(engagement telemetry, rights/royalty history, tuned models), so exit " +
      "rights over your own data matter more than the software contract; beware " +
      "platform-native AI bundling that quietly re-locks the stack at renewal.",
    negotiationLevers: [
      "Outcome proof in a controlled pilot (churn reduction net of save cost, engaged-watch-time lift, ad-ARPU net of ad-tier churn) before enterprise scale-up",
      "Engagement-telemetry and subscriber-data portability + model/embedding exit rights to avoid data lock-in",
      "Rights-extraction accuracy and source-clause citation thresholds tied to terms before relying on extraction for royalty payment",
      "Take-rate and demand transparency on ad/SSP deals, with demand portability to keep yield leverage",
      "Unbundle platform-native AI add-ons (personalization, ad insertion, dunning) from the core renewal to keep best-of-breed leverage",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      churn_claim: [
        "subscription cancellation/renewal events by cohort",
        "voluntary vs involuntary split",
        "cohort or holdout comparison linked to a save action",
      ],
      engagement_claim: [
        "engaged-time and completion-qualified telemetry",
        "A/B or holdout treatment vs control",
        "catalog-utilization breadth check (not just concentration)",
      ],
      content_roi_claim: [
        "title-level amortized cost",
        "attributed retention/acquisition value via cohort/holdout",
        "backtested predictive lift against the fat-tailed distribution, framed as portfolio guidance",
      ],
      ad_yield_claim: [
        "ad-server/SSP fill and yield by inventory",
        "ad-load and ad-tier churn read",
        "blended-ARPU impact net of retention cost",
      ],
      royalty_claim: [
        "royalty reconciled to rights catalog, contract terms, and usage",
        "audit leakage/accuracy baseline",
        "source-clause citation and human sign-off before payment",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (content-cost gravity, content-ROI unpredictability, attribution)",
      ],
    },
    citationStandard:
      "Quantitative media claims cite the subscription/telemetry/ad-server/" +
      "royalty source and the period, churn is always stated split into " +
      "voluntary and involuntary, and engagement is engaged-time and " +
      "completion-qualified, not raw play-starts. Content-ROI and green-light " +
      "claims are stated against the fat-tailed outcome distribution as " +
      "portfolio guidance with an honest hit-rate, never as a deterministic " +
      "winner-pick. Royalty claims carry source-clause citations and human " +
      "sign-off. Value projections cite a baseline plus a labelled planning " +
      "range and the haircut factors applied (content-cost gravity, content-ROI " +
      "unpredictability, attribution) — never a single asserted ROI number, and " +
      "never a vendor 'up to X%' figure without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not split churn into voluntary vs involuntary — frame retention value as overstated until the split and the cheap involuntary-churn recovery are sized.",
      "A green-light or content-scoring model is being relied on — hedge hard toward the industry pattern that hits are fat-tailed and pre-release winner-picking has bounded real lift.",
      "Engagement is cited as play-starts/clicks without completion — flag that this may be vanity engagement, not the satisfying engagement that retains.",
      "Ad-yield gains are cited without an ad-tier churn read — present blended-ARPU value as gated by the ad-load-versus-retention trade-off.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across streaming services at this scale, monthly churn typically runs...",
      "As an industry pattern (not your measured figure), content returns are fat-tailed, so pre-release scoring informs portfolio discipline more than it picks winners...",
      "Without your voluntary/involuntary churn split, the industry pattern is that involuntary churn is a sizeable, cheaply recoverable share of...",
      "Peer programs commonly see engaged watch time lift by... once personalization optimizes for completion, contingent on data quality.",
    ],
    flagWithoutEvidence: [
      "A specific churn-reduction or net-growth figure for this tenant",
      "A claim that a model will reliably pick this tenant's content hits in advance",
      "This tenant's actual content cost per engaged hour or title-level ROI",
      "A specific ad-ARPU or blended-ARPU uplift for this tenant net of ad-tier churn",
      "This tenant's actual royalty leakage rate or rights-catalog completeness",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where does AI fit across the content-and-audience value chain / lever prioritization by value and predictability",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of value-chain stages (content → distribution → audience → monetization → rights) x AI lever shaded by net value and predictability/data risk.",
    },
    {
      questionPattern: "value of a media-AI program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled lift to realizable value with content-cost-gravity, content-ROI-unpredictability, and attribution haircuts.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (content-cost gravity, fat-tailed content ROI, attribution) on realizable value.",
    },
    {
      questionPattern: "content cost vs engagement / where the slate concentrates and where it wastes",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Title/genre cost per engaged hour and content ROI to expose the fat tail and low-utilization catalog.",
    },
    {
      questionPattern: "media KPI scorecard",
      exhibitKind: "table",
      note: "Subscriber churn, ARPU, content cost per engaged hour, watch time, content ROI, ad fill rate, CAC, completion, catalog utilization, subscriber growth, royalty leakage vs planning ranges.",
    },
    {
      questionPattern: "subscriber growth vs churn over time / leaky-bucket exposure",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Dual-trend gross adds and churn to expose net growth and the treadmill, with voluntary/involuntary split.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Engagement and retention banked first on owned content and measurable behavior — personalization for completion plus churn-saves and cheap involuntary-churn recovery",
      "Churn read split into voluntary and involuntary and against gross adds, so the leaky-bucket truth and net growth stay honest",
      "Content green-light AI framed as humble portfolio guidance against a fat-tailed hit-rate, never a deterministic winner-picker",
      "The ad-vs-subscription trade-off owned with a shared blended-ARPU-versus-retention view, not optimized by isolated teams",
      "A unified audience data spine and governed rights catalog as the foundation, with value read against cohorts/holdouts and honest haircuts",
    ],
    failureDrivers: [
      "Treating operational AI efficiency as able to offset content-cost gravity — the slate, not the tooling, decides the P&L",
      "Selling a content-scoring model as a hit-picker, then concentrating the slate on its scores and being beaten by the fat tail",
      "Optimizing recommendations and engagement on play-starts/clicks, luring viewers into content they abandon while the deep catalog starves",
      "Chasing ad fill with rising ad load while ad-tier churn erases the yield, because no one owns the blended-ARPU-versus-retention trade-off",
      "Letting churn leak (especially unworked involuntary churn) while CAC refills the base — expensive treadmill growth that never compounds",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption is fastest where AI operates on owned data and visible " +
      "behavior: personalization, ad-yield, and dunning-based involuntary-churn " +
      "recovery land within a quarter or two and prove out in engagement and " +
      "churn telemetry. Churn-save orchestration follows once the save actions " +
      "are wired and trusted. Content green-light AI has the weakest readiness " +
      "and the most cultural resistance — commissioning is a relationship-and-" +
      "instinct craft, and the fat-tailed reality means trust must be earned " +
      "over slate cycles as portfolio guidance, never imposed as a hit-picker. " +
      "Rights/royalty automation adopts only with human approval gating because " +
      "mis-paying creators is intolerable.",
    roiClarity: "medium",
    roiClarityBasis:
      "Engagement, churn, and ad-yield value are directly measurable in " +
      "telemetry, billing, and ad-server data and reasonably attributable with " +
      "cohorts/holdouts, which holds clarity up. But the two structural " +
      "discounts are large and hard to pin: content cost dominates and is " +
      "captive to the slate, and content ROI is fat-tailed so green-light value " +
      "is genuinely uncertain. Attribution across content, price, and market is " +
      "loose, and promo-driven acquisition can masquerade as durable growth. " +
      "ROI is firm for the engagement/retention/yield levers and soft for the " +
      "content-bet lever, which nets to medium overall.",
  },

  regulatoryFrame: {
    name: "Audience-data privacy + content rights & AI-content disclosure",
    relevance:
      "The dominant regulatory frame for AI across content and audience: " +
      "personalization, churn modeling, and ad targeting process behavioral " +
      "viewing data under privacy and consent law (GDPR/CCPA), with stricter " +
      "rules for minors (COPPA / age-appropriate design). Content availability " +
      "and royalty obligations are governed by copyright and licensing, and " +
      "generative localization/dubbing and synthetic content raise IP, " +
      "performer-likeness/voice consent, guild/union, and emerging AI-disclosure " +
      "obligations (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
