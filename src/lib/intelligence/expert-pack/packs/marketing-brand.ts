// Consilium expert — Marketing & Brand (front office, cross-cutting).
//
// W3 (wave 3) draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// A cross-cutting, front-office expert spanning the whole marketing engine:
// brand & demand generation, campaign management, content/creative production,
// marketing mix & media spend, MarTech/CDP & personalization, marketing
// sourcing & agency management, and measurement / attribution. Cross-industry —
// the same MarTech/CDP + media + agency spine recurs in B2C retail, B2B SaaS,
// financial services, healthcare, and consumer goods.
//
// Honesty posture: this is a domain where the prize is real but measurement is
// genuinely hard. The pack is deliberately blunt about three truths. (1)
// Attribution is hard — the century-old "half my advertising is wasted; I just
// don't know which half" problem persists; last-click and many multi-touch
// models over-credit the channels closest to the click and under-credit brand,
// so claimed marketing ROI is routinely optimistic. (2) Brand value is a
// long-horizon asset — awareness, consideration, and pricing power compound over
// years and resist short-term attribution, so cutting brand spend flatters
// near-term ROI while quietly eroding the future demand base. (3) GenAI content
// at scale is a double-edged sword — it crushes production cost and cycle time
// but multiplies brand-safety, on-brand-consistency, IP, and disclosure risk,
// and volume without governance damages the very brand it is meant to grow.
// Covers a marketing-services / sourcing function too (agency roster, creative
// production, media buying, and MarTech procurement). Excludes the downstream
// sales / revenue-operations motion after the MQL handoff and the product /
// pricing strategy itself — those route to other experts.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const marketingBrandExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.marketing-brand",
    expertName: "Marketing & Brand Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "marketing-brand",
    scopeNote:
      "AI across the marketing engine: brand & demand generation, campaign " +
      "management, content / creative production, marketing mix & media spend, " +
      "MarTech / CDP & personalization, marketing sourcing & agency management, " +
      "and measurement / attribution. Covers the trade-offs across marketing " +
      "ROI, customer acquisition cost, marketing-sourced pipeline, brand " +
      "awareness/consideration, content cost and cycle time, media efficiency, " +
      "conversion, and attribution coverage — and is candid that attribution is " +
      "genuinely hard ('half my advertising is wasted'), that brand value is a " +
      "long-horizon asset that resists short-term attribution, and that GenAI " +
      "content at scale multiplies brand-safety risk. Includes the marketing- " +
      "services / sourcing function (agency roster, creative production, media " +
      "buying, MarTech procurement). Cross-industry (B2C retail, B2B SaaS, " +
      "financial services, healthcare, consumer goods). Excludes the downstream " +
      "sales / revenue-operations motion after MQL handoff and product / pricing " +
      "strategy itself — those route to other experts.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "marketing_roi",
        name: "Marketing ROI / ROAS",
        definition:
          "Return on marketing investment — incremental gross profit (or " +
          "revenue, for ROAS) attributable to marketing divided by the marketing " +
          "spend that produced it, measured on a consistent attribution basis " +
          "over a defined window.",
        unit: "x",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "ROAS/marketing-ROI ranges vary enormously by channel, margin, and " +
            "attribution model; lower-funnel performance channels report high " +
            "multiples that incrementality testing routinely deflates, while " +
            "brand spend looks weak on short-window attribution",
          label: "planning-range",
        },
        dataSource:
          "Marketing spend from the media/agency ledger and finance, joined to " +
          "attributed revenue/profit from the CDP, web analytics, and CRM under " +
          "a stated attribution model",
        whyItMatters:
          "The headline efficiency verdict on the whole marketing engine — and " +
          "the most contested number in the domain. It is only as honest as the " +
          "attribution behind it: last-click flatters lower-funnel channels and " +
          "buries brand's contribution, so a high reported ROI can mask a misallocated mix.",
      },
      {
        key: "customer_acquisition_cost",
        name: "Customer acquisition cost (CAC)",
        definition:
          "Fully-loaded sales & marketing cost to acquire one new customer — " +
          "the marketing (and where relevant sales) spend in a period divided by " +
          "the new customers acquired in that period.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 100,
          high: 1500,
          basis:
            "CAC ranges span orders of magnitude by deal size and motion: " +
            "low-ticket B2C consumer acquisition sits at the bottom, " +
            "considered-purchase and B2B at the top; the band is illustrative, " +
            "not a universal target",
          label: "planning-range",
        },
        dataSource:
          "Fully-loaded marketing (and attributed sales) spend from finance " +
          "divided by net new customers from the CRM / billing ledger",
        whyItMatters:
          "The unit economics gate on whether growth is profitable — CAC against " +
          "lifetime value decides whether to scale or pull back. It is only " +
          "comparable when 'fully-loaded' is defined consistently and when brand " +
          "spend that lowers future CAC is not mis-charged against today's cohort.",
      },
      {
        key: "marketing_sourced_pipeline",
        name: "Marketing-sourced pipeline %",
        definition:
          "Share of qualified pipeline (or revenue) where marketing is credited " +
          "as the originating source, measured on a consistent sourcing " +
          "definition across the funnel.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 55,
          basis:
            "B2B marketing-sourced pipeline shares vary by go-to-market model " +
            "and how 'sourced' vs 'influenced' is defined; sales-led motions " +
            "report lower, marketing-led report higher",
          label: "planning-range",
        },
        dataSource:
          "CRM opportunity records with first-touch / sourcing attribution, " +
          "joined to marketing-automation lead origin",
        whyItMatters:
          "Marketing's accountability line to revenue — the metric that earns " +
          "or loses budget. But it is highly definition-sensitive: shifting " +
          "between sourced and influenced, or re-defining the qualification bar, " +
          "moves the number without any real change in performance.",
      },
      {
        key: "brand_awareness_consideration",
        name: "Brand awareness / consideration",
        definition:
          "Survey-based measures of the share of the target audience who " +
          "recognize the brand (awareness) and who would actively consider it " +
          "for purchase (consideration), tracked over time on a consistent panel.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "Brand-tracking awareness/consideration levels are entirely " +
            "category- and maturity-dependent; the band reflects the common " +
            "spread between challenger and category-leader positions",
          label: "planning-range",
        },
        dataSource:
          "Brand-tracking studies / market-research panels and search/share-of- " +
          "voice proxies, tracked on a consistent methodology over time",
        whyItMatters:
          "The leading indicator of the long-horizon demand asset — awareness " +
          "and consideration build the future pipeline and pricing power that " +
          "short-window ROI cannot see. Cutting the spend behind them flatters " +
          "near-term efficiency while eroding the base, which is why it must be " +
          "tracked alongside performance metrics, not instead of them.",
      },
      {
        key: "content_cost_per_asset",
        name: "Content production cost per asset",
        definition:
          "Fully-loaded cost to produce one finished marketing asset (creative, " +
          "copy, video, landing page, localized variant) including agency / " +
          "production / internal labor, by asset type and complexity.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 100,
          high: 25000,
          basis:
            "Per-asset cost spans from a templated social variant to a hero " +
            "video production; the wide band reflects asset type, and GenAI " +
            "compresses the lower- and mid-complexity end most",
          label: "planning-range",
        },
        dataSource:
          "Agency / production invoices and internal time allocation by asset " +
          "and project from the marketing-operations and finance systems",
        whyItMatters:
          "The cost lever GenAI moves most directly — production and " +
          "localization cost can fall sharply. But cost per asset is a false " +
          "economy if it is achieved by flooding channels with off-brand or " +
          "unsafe content, so it must be read against brand consistency and " +
          "performance, not maximized in isolation.",
      },
      {
        key: "campaign_cycle_time",
        name: "Campaign cycle time (concept to live)",
        definition:
          "Median elapsed time from campaign brief / concept approval to the " +
          "campaign going live in market, across the creative, production, and " +
          "trafficking workflow.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 60,
          basis:
            "Concept-to-live cycle ranges by campaign scale and approval " +
            "complexity; always-on digital iterates in days, integrated brand " +
            "campaigns run weeks; the band reflects the common mid-range",
          label: "planning-range",
        },
        dataSource:
          "Marketing work-management / project system timestamps from brief " +
          "approval to live launch, by campaign type",
        whyItMatters:
          "The speed-to-market lever — faster cycles mean more tests, more " +
          "in-market learning, and quicker response to demand signals. GenAI " +
          "creative and automated trafficking compress it, but speed gains are " +
          "real only if brand-safety review keeps pace rather than being skipped.",
      },
      {
        key: "media_efficiency",
        name: "Media efficiency (working media ratio / eCPM-adjusted)",
        definition:
          "Share of media budget reaching the intended audience as working " +
          "media (net of agency fees, ad-tech tax, fraud, and non-viewable / " +
          "non-human impressions), and the cost efficiency of that delivered " +
          "audience.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 70,
          basis:
            "Working-media ratios are eroded by the programmatic supply-chain " +
            "'ad-tech tax', fees, fraud, and viewability; studies repeatedly " +
            "show a large fraction of spend never reaches a real, viewable human",
          label: "planning-range",
        },
        dataSource:
          "Media plans and ad-server / DSP delivery logs with viewability, " +
          "invalid-traffic, and fee/take-rate breakdowns, reconciled to spend",
        whyItMatters:
          "The leakage gauge on paid media — a large share of spend can vanish " +
          "into fees, fraud, and non-viewable inventory before it ever reaches a " +
          "person. Improving working-media ratio frees budget without cutting " +
          "reach, and it is a primary sourcing/negotiation lever with agencies and ad-tech.",
      },
      {
        key: "conversion_rate",
        name: "Conversion rate",
        definition:
          "Share of audience that takes the intended action (lead, sign-up, " +
          "purchase) out of those exposed or engaged, measured at a consistent " +
          "funnel stage and definition.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 10,
          basis:
            "Conversion ranges vary sharply by channel, intent, and funnel " +
            "stage; high-intent search/retargeting converts far above cold " +
            "prospecting, so the band is indicative of a mid-funnel digital rate",
          label: "planning-range",
        },
        dataSource:
          "Web/app analytics and the CDP joined to campaign exposure and CRM " +
          "outcomes, on a consistent conversion-event definition",
        whyItMatters:
          "Where personalization, creative quality, and landing-experience " +
          "optimization earn their keep — small lifts compound across volume. " +
          "It is only comparable when the conversion event and funnel stage are " +
          "defined consistently; redefining the event is a common vanity trap.",
      },
      {
        key: "marketing_spend_pct_revenue",
        name: "Marketing spend % of revenue",
        definition:
          "Total marketing investment (media, agency, content, MarTech, and " +
          "marketing labor) as a percentage of company revenue for the period.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 15,
          basis:
            "Marketing-budget-as-%-of-revenue surveys; high-growth and " +
            "consumer/B2B-SaaS categories sit at the top, mature/low-margin " +
            "categories at the bottom — the right level is strategy-dependent, " +
            "not a universal target",
          label: "planning-range",
        },
        dataSource:
          "Total marketing cost (media + agency + content + MarTech + labor) " +
          "from finance divided by company revenue",
        whyItMatters:
          "The investment-intensity dial the CFO and board anchor on — too low " +
          "starves the demand base, too high strains margins. The number alone " +
          "says nothing about effectiveness; it is meaningful only paired with " +
          "ROI and the brand/performance split of where the spend goes.",
      },
      {
        key: "attribution_coverage",
        name: "Attribution coverage %",
        definition:
          "Share of conversions / revenue that can be tied to a measured " +
          "marketing touch with reasonable confidence, versus the unattributable " +
          "or 'direct/unknown' remainder — the honesty gauge on the whole " +
          "measurement system.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Attribution coverage is structurally capped by walled gardens, " +
            "cookie/identifier deprecation, offline conversions, and dark social; " +
            "a large unattributable remainder is normal, not a defect to hide",
          label: "planning-range",
        },
        dataSource:
          "CDP / analytics attribution model output showing attributed vs " +
          "direct/unknown, reconciled against total conversions and incrementality tests",
        whyItMatters:
          "The candor metric of the domain — it states explicitly how much of " +
          "performance is genuinely measured versus inferred. Low coverage means " +
          "marketing-ROI and sourced-pipeline numbers rest on a small measured " +
          "slice extrapolated across a large unknown, which is exactly where over- " +
          "claiming hides; it should be reported, not buried.",
      },
      {
        key: "agency_production_cost_ratio",
        name: "Agency / production cost ratio (non-working media %)",
        definition:
          "Share of total marketing spend consumed by agency fees, production, " +
          "and MarTech overhead rather than reaching the audience as working " +
          "media — the inverse view of how much budget is spent on making and " +
          "managing versus delivering.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 45,
          basis:
            "Non-working-spend ratios from agency-management and procurement " +
            "benchmarks; fee structures, production model, and in-housing degree " +
            "drive the spread",
          label: "planning-range",
        },
        dataSource:
          "Agency fee schedules, production invoices, and MarTech licenses from " +
          "the marketing-procurement ledger, netted against total spend",
        whyItMatters:
          "The sourcing lever the procurement and marketing-services function " +
          "pulls — every point shifted from non-working to working media (or " +
          "saved outright) funds growth without new budget. GenAI in-housing of " +
          "production and renegotiated agency fees both move it, but cutting fees " +
          "that buy strategic quality can cost more than it saves.",
      },
    ],

    painThemes: [
      {
        key: "attribution_fog",
        name: "Attribution fog (the 'half my advertising is wasted' problem)",
        description:
          "The century-old problem persists: it is genuinely hard to know which " +
          "marketing actually drove a sale. Last-click and many multi-touch " +
          "models over-credit channels nearest the click and under-credit brand " +
          "and upper funnel, so the reported marketing-ROI and sourced-pipeline " +
          "numbers are confidently misallocated — budget flows to whatever the " +
          "model can see, not to what works.",
        detectionSignal:
          "Heavy reliance on last-click; large 'direct/unknown' remainder " +
          "unreported; channel ROIs that sum to more conversions than actually " +
          "happened; no incrementality / holdout testing; budget shifts driven " +
          "by attribution dashboards never validated against geo or lift tests.",
        diagnosticQuestion:
          "What attribution model do you run, what share of conversions lands in " +
          "'direct/unknown', and when did you last validate a channel's reported " +
          "ROI with an incrementality or holdout test?",
      },
      {
        key: "brand_short_termism",
        name: "Brand short-termism (eating the long-horizon asset)",
        description:
          "Because brand value compounds over years and resists short-window " +
          "attribution, brand spend always looks weak on the ROI dashboard — so " +
          "it is the first cut under pressure. Performance budget grows, brand " +
          "budget shrinks, near-term ROI flatters, and the awareness/" +
          "consideration base that feeds future cheap demand quietly erodes, " +
          "raising CAC down the line.",
        detectionSignal:
          "Steadily falling brand/performance spend ratio; awareness and " +
          "consideration drifting down while short-term ROAS looks healthy; " +
          "rising CAC and falling organic/branded-search share over time; no " +
          "long-horizon brand-equity measurement in the budget conversation.",
        diagnosticQuestion:
          "What is your brand-versus-performance spend split, and are awareness, " +
          "consideration, and branded-search share holding as you shift budget " +
          "toward lower-funnel performance?",
      },
      {
        key: "genai_brand_safety_at_scale",
        name: "GenAI content scale outrunning brand safety",
        description:
          "GenAI lets teams produce content at volumes no review process was " +
          "built for, so off-brand tone, factual errors, hallucinated claims, IP " +
          "and likeness issues, missing disclosures, and unsafe placements slip " +
          "through — and a single viral misfire can damage the brand more than " +
          "the cost saved across thousands of assets is worth.",
        detectionSignal:
          "Content volume rising far faster than review capacity; no brand-safety " +
          "or on-brand QA gate on GenAI output; inconsistent voice across " +
          "channels; absent provenance/disclosure on AI-generated assets; " +
          "near-miss incidents handled ad hoc with no governance.",
        diagnosticQuestion:
          "As GenAI content volume scales, what brand-safety and on-brand review " +
          "gate every asset passes through, and who is accountable when an " +
          "AI-generated asset goes out wrong?",
      },
      {
        key: "martech_sprawl_data_silos",
        name: "MarTech sprawl & data silos",
        description:
          "Stacks accumulate dozens of overlapping tools — CDP, DMP, email, ad " +
          "platforms, analytics, personalization — with brittle integrations and " +
          "fragmented customer data, so no single system has a complete, current " +
          "view to personalize or attribute against, and much of the licensed " +
          "capability sits unused.",
        detectionSignal:
          "Large number of MarTech licenses with low utilization; duplicate / " +
          "conflicting customer profiles across tools; identity resolution gaps; " +
          "personalization that can't act on the full profile; spend on tools no " +
          "one can map to an outcome.",
        diagnosticQuestion:
          "How many MarTech tools do you license, what share are actively used, " +
          "and does any single system hold a complete, current customer profile " +
          "the rest can act on?",
      },
      {
        key: "media_waste_adtech_tax",
        name: "Media waste & the ad-tech tax",
        description:
          "A large share of programmatic media budget leaks into agency and " +
          "ad-tech fees, made-for-advertising sites, fraud, and non-viewable " +
          "impressions before it ever reaches a real person — so reported reach " +
          "and efficiency overstate what was actually delivered, and the working- " +
          "media ratio is far below the gross spend.",
        detectionSignal:
          "Opaque programmatic supply paths; no log-level / supply-path " +
          "transparency; low verified viewability and high invalid-traffic rates; " +
          "agency fee and take-rate structure not fully disclosed; spend on long- " +
          "tail inventory with no quality controls.",
        diagnosticQuestion:
          "What is your verified working-media ratio after fees, fraud, and " +
          "viewability, and do you have log-level supply-path transparency on " +
          "programmatic spend?",
      },
      {
        key: "agency_misalignment",
        name: "Agency & production cost misalignment",
        description:
          "Agency relationships built on commission or opaque fee structures " +
          "reward spend and hours rather than outcomes, scope creeps, production " +
          "costs balloon, and the marketing-services function lacks the cost " +
          "visibility to challenge it — so a growing slice of budget goes to " +
          "making and managing rather than to working media that drives demand.",
        detectionSignal:
          "Rising non-working / agency cost ratio; commission-linked or " +
          "undisclosed fee models; scope and production costs growing faster than " +
          "output; no benchmarking of fees or production rates; in-housing " +
          "opportunities never assessed.",
        diagnosticQuestion:
          "What share of your marketing spend is non-working (agency, production, " +
          "MarTech overhead), how are agency fees structured, and when did you " +
          "last benchmark them or test in-housing?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "genai_creative_production",
        name: "GenAI creative & content production at scale",
        valueMechanism:
          "GenAI drafts copy, generates and adapts creative, and produces " +
          "channel and localized variants from a brief — collapsing production " +
          "cost and concept-to-live cycle time and enabling far more " +
          "personalized variants than human production could economically make, " +
          "provided a brand-safety and on-brand review gate keeps the volume safe.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Brand guidelines, tone-of-voice, and approved-claims library for grounding",
          "Existing creative / asset corpus and performance data to learn what works",
          "A brand-safety / disclosure policy and human review workflow",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Every asset is brand-facing — off-brand tone, hallucinated claims, or missing disclosures are direct brand and compliance risk; a human approves before publish",
          "IP, likeness, and training-data provenance must be cleared so generated assets don't create rights exposure",
          "Scale without a review gate is the failure mode — production cost falls but brand-safety risk rises, so volume must be matched by governance capacity",
        ],
        metricsMoved: [
          "content_cost_per_asset",
          "campaign_cycle_time",
          "conversion_rate",
          "agency_production_cost_ratio",
        ],
      },
      {
        key: "personalization_engine",
        name: "AI personalization & next-best-content / offer",
        valueMechanism:
          "A model reads CDP profile, behavior, and context to choose the next- " +
          "best content, offer, and channel for each customer in real time — " +
          "lifting conversion and engagement by making the experience relevant " +
          "rather than one-size-fits-all, and feeding the cheaper-demand flywheel.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Unified, consented customer profiles in a CDP with identity resolution",
          "Real-time behavioral and context signals",
          "A content / offer library tagged for eligibility and suitability",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Personalization on personal data must respect consent, purpose limitation, and privacy law; loss of consent or identifiers caps coverage",
          "Optimizing only for short-term conversion can train the system toward discounting and away from brand and margin — guardrail the objective",
          "Discriminatory or creepy personalization (sensitive inferences, over-targeting) is a brand and conduct risk — constrain the signals used",
        ],
        metricsMoved: [
          "conversion_rate",
          "marketing_roi",
          "customer_acquisition_cost",
        ],
      },
      {
        key: "media_mix_optimization",
        name: "AI media-mix modeling & budget optimization",
        valueMechanism:
          "Marketing-mix modeling and incrementality-aware optimization estimate " +
          "the true incremental contribution of each channel — including brand " +
          "and offline — and reallocate budget toward what actually drives " +
          "demand, correcting the last-click bias that misallocates spend and " +
          "lifting blended marketing ROI.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clean spend-by-channel time series and outcome (sales/conversion) data",
          "Geo / holdout / incrementality test results to calibrate the model",
          "Sufficient history and variation in spend to identify channel effects",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "MMM is correlational and assumption-heavy — it must be validated against incrementality tests, not trusted as ground truth",
          "Garbage-in spend/outcome data produces confident but wrong allocations — data quality gates the bet",
          "Models that can't see brand's long-horizon effect will still under-credit it — keep brand measurement in the loop",
        ],
        metricsMoved: [
          "marketing_roi",
          "media_efficiency",
          "attribution_coverage",
        ],
      },
      {
        key: "predictive_audience_lead_scoring",
        name: "Predictive audience targeting & lead scoring",
        valueMechanism:
          "A model scores prospects and look-alike audiences by propensity to " +
          "convert or expand and focuses spend and outreach on the highest-value " +
          "segments — improving conversion and marketing-sourced pipeline while " +
          "lowering acquisition cost by not paying to reach unlikely buyers.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical conversion outcomes for training labels",
          "First-party CDP signals and consented audience data",
          "Consistent lead / qualification definitions for the target",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Models trained on biased historical targeting reinforce who was reached, not who converts — audit for feedback loops and exclusion of viable segments",
          "Audience inference on personal/sensitive attributes carries privacy and discrimination risk — constrain features and respect lawful basis",
          "Scores are only as good as the conversion-outcome data; loose lead definitions corrupt the label",
        ],
        metricsMoved: [
          "conversion_rate",
          "marketing_sourced_pipeline",
          "customer_acquisition_cost",
        ],
      },
      {
        key: "campaign_automation_orchestration",
        name: "AI campaign orchestration & journey automation",
        valueMechanism:
          "AI plans, sequences, and optimizes multi-channel journeys — timing, " +
          "channel, and message — and automates trafficking and in-flight " +
          "adjustment, so campaigns get to market faster, test more, and adapt " +
          "to live signals, compressing cycle time and lifting conversion.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Connected channel / delivery systems (email, ad, web, app)",
          "Customer-journey and engagement data in the CDP",
          "Campaign performance feedback for in-flight optimization",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Automated send / frequency decisions can over-contact and fatigue audiences — guardrail frequency and suppression",
          "In-flight optimization toward a narrow metric can degrade brand experience — keep brand/experience guardrails on the objective",
          "Automated cross-channel sends must honor consent and channel-specific compliance (CAN-SPAM, e-privacy)",
        ],
        metricsMoved: [
          "campaign_cycle_time",
          "conversion_rate",
          "marketing_roi",
        ],
      },
      {
        key: "brand_safety_monitoring",
        name: "AI brand-safety & content-governance monitoring",
        valueMechanism:
          "AI screens generated and placed content for on-brand consistency, " +
          "policy and claim compliance, disclosure, and unsafe adjacency at the " +
          "scale GenAI production demands — catching off-brand and unsafe assets " +
          "before they publish, so content volume can scale without the brand- " +
          "damage tail that ungoverned scale produces.",
        adoptionProfile: "early",
        dataDependencies: [
          "Brand guidelines, claims library, and disclosure rules encoded as policy",
          "Content / placement inventory and an inbound review queue",
          "Incident and override history to tune the screening",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Screening is a safety net, not a guarantee — high-risk assets still need human sign-off; over-trusting the screen recreates the risk",
          "False positives that block too much will be routed around by teams under deadline — calibrate to keep the gate usable",
          "The screen is only as good as the encoded brand/policy rules; stale rules let new risks through",
        ],
        metricsMoved: [
          "content_cost_per_asset",
          "campaign_cycle_time",
          "brand_awareness_consideration",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_customer_data_spine",
        name: "Unified customer data spine (CDP foundation)",
        description:
          "A governed CDP that resolves identity and unifies consented first- " +
          "party data into a complete, current customer profile the whole stack " +
          "can act on — the prerequisite foundation under personalization, " +
          "audience modeling, and attribution, because every one of those bets " +
          "is capped by profile completeness and identity resolution.",
        boundary:
          "Owns identity resolution, consent state, and the unified profile; " +
          "does not own the channel engagement tools or the models that consume " +
          "the profile.",
        humanAccountabilityPoint: "Head of Marketing Technology / Marketing Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "brand_safety_governance_gate",
        name: "Brand-safety governance gate for content at scale",
        description:
          "A governed review-and-screening layer — encoded brand guidelines, " +
          "claims library, disclosure rules, automated screening, and human sign- " +
          "off for high-risk assets — that every GenAI-produced asset passes " +
          "through before publish, so production volume can scale without " +
          "outrunning brand safety.",
        boundary:
          "Owns the on-brand / safety / disclosure review and approval gate; does " +
          "not own creative generation itself or the channels that publish.",
        humanAccountabilityPoint: "Chief Brand Officer / VP Brand & Content Governance",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "genai_content_studio_overlay",
        name: "GenAI content-studio overlay on the existing stack",
        description:
          "A GenAI production and adaptation layer overlaid on the existing DAM, " +
          "creative, and work-management tools — generating, localizing, and " +
          "variant-testing assets from a brief — so content cost and cycle time " +
          "fall without replacing the creative stack, landing value while feeding " +
          "the brand-safety gate.",
        boundary:
          "Owns assisted generation, adaptation, and variant production; does not " +
          "own the brand-safety approval gate or the system-of-record DAM.",
        humanAccountabilityPoint: "VP Marketing / Head of Creative Operations",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "incrementality_measurement_layer",
        name: "Incrementality-anchored measurement & MMM layer",
        description:
          "A measurement layer that runs marketing-mix modeling and " +
          "geo/holdout incrementality tests alongside the digital attribution " +
          "dashboard, with an explicit reconciliation between them — so budget " +
          "decisions rest on validated incremental contribution (including brand " +
          "and offline) rather than last-click, and attribution coverage is " +
          "reported honestly.",
        boundary:
          "Owns mix modeling, incrementality testing, and the attribution " +
          "reconciliation; does not own media buying or the channel platforms " +
          "themselves.",
        humanAccountabilityPoint: "Head of Marketing Analytics / Marketing Effectiveness",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from levers in rising data-dependency and risk order. " +
        "(1) Content & production efficiency — GenAI creative, localization, and " +
        "agency/production in-housing cut cost per asset and cycle time; the " +
        "fastest, most measurable win, gated only by the brand-safety capacity to " +
        "govern the volume. (2) Conversion & efficiency — personalization, " +
        "predictive targeting, and campaign orchestration lift conversion and " +
        "lower CAC, real but gated by CDP data quality and consent. (3) " +
        "Allocation & effectiveness — media-mix modeling and incrementality " +
        "testing reallocate spend toward what truly drives demand, the highest- " +
        "leverage prize but the one most exposed to the attribution problem and " +
        "most dependent on clean data and validation. The brand-equity lever is " +
        "deliberately NOT discounted away: it is long-horizon and hard to " +
        "attribute, but protecting awareness/consideration is what keeps future " +
        "CAC low, so the durable program measures it explicitly rather than " +
        "cutting it because the dashboard can't see it. Two structural haircuts " +
        "dominate everything: attribution uncertainty (claimed ROI is " +
        "systematically optimistic) and the brand-safety tail risk on GenAI scale.",
      dominantHaircutFactors: [
        {
          factor: "Attribution uncertainty (claimed ROI is optimistic)",
          rationale:
            "Marketing-ROI, sourced-pipeline, and channel-ROI figures over- " +
            "credit lower-funnel touches and under-credit brand and offline, so " +
            "the realizable value is materially below the dashboard number until " +
            "incrementality validates it; the larger the unattributable " +
            "remainder, the larger the haircut.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between last-click/MTA-claimed contribution and " +
              "incrementality-/holdout-validated lift across channels",
            label: "planning-range",
          },
        },
        {
          factor: "Brand-safety & quality tail risk on GenAI scale",
          rationale:
            "Production-cost savings from scaling GenAI content are real but " +
            "carry a tail of off-brand, unsafe, or non-compliant output; the " +
            "expected value must be discounted for governance overhead and the " +
            "low-probability, high-impact brand-damage event ungoverned scale invites.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Governance overhead plus the expected cost of brand-safety " +
              "incidents observed where content scaled ahead of review capacity",
            label: "planning-range",
          },
        },
        {
          factor: "CDP data quality & consent cap",
          rationale:
            "Personalization, targeting, and attribution are capped by profile " +
            "completeness, identity resolution, and consented data; identifier " +
            "deprecation and consent loss shrink addressable coverage, so value " +
            "is discounted for the share of customers the data can't reach.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Gap between modeled personalization/targeting value and realized " +
              "value where profile/identity/consent coverage was incomplete",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Content production-cost reduction (GenAI creative + in-housing)",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported per-asset cost and cycle-time reductions from GenAI " +
              "production and localization, weighted to lower/mid-complexity assets",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in content_cost_per_asset",
        },
        {
          lever: "Conversion uplift (personalization + predictive targeting)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative conversion lift from personalization and " +
              "audience-targeting programs, net of attribution haircuts",
            label: "planning-range",
          },
          measuredAs: "Relative lift in conversion_rate",
        },
        {
          lever: "Media-efficiency / working-media recovery (MMM + supply-path)",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reported working-media recovery from supply-path optimization, " +
              "fee renegotiation, and incrementality-driven reallocation",
            label: "planning-range",
          },
          measuredAs: "Relative improvement in media_efficiency / marketing_roi",
        },
      ],
      timeToValueBand:
        "GenAI content production and campaign orchestration: 1-2 quarters " +
        "(overlay, no platform swap), once the brand-safety gate exists. " +
        "Personalization and predictive targeting: 2-3 quarters, gated by CDP " +
        "readiness and consent coverage. Media-mix modeling / incrementality: " +
        "2-4 quarters to gather enough spend variation and test results to " +
        "trust the model. Brand-equity effects from protecting awareness/" +
        "consideration compound over multiple years and resist quarterly attribution.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Customer Data Platform (CDP)",
          role:
            "The unified, identity-resolved, consented first-party customer " +
            "profile that personalization, audience modeling, and attribution " +
            "read and write — the data spine every marketing AI bet depends on.",
          examples: [
            "Adobe Real-Time CDP",
            "Salesforce Data Cloud",
            "Segment (Twilio)",
            "Tealium",
          ],
        },
        {
          name: "Marketing automation / campaign management",
          role:
            "Multi-channel campaign execution, journey orchestration, email/ " +
            "SMS/push, and lead nurturing — where campaigns are built and run.",
          examples: [
            "Adobe Marketo Engage",
            "Salesforce Marketing Cloud",
            "HubSpot Marketing Hub",
            "Braze",
          ],
        },
        {
          name: "Digital asset management & creative / content stack",
          role:
            "Storage, versioning, and rights management for creative assets, " +
            "plus the creative production and (increasingly GenAI) content tools.",
          examples: [
            "Adobe Experience Manager Assets",
            "Bynder",
            "Adobe Creative Cloud / Firefly",
            "Canva",
          ],
        },
        {
          name: "Ad-tech: DSP / ad server / measurement",
          role:
            "Programmatic media buying, ad serving, audience activation, and " +
            "delivery/viewability/verification — where paid media and its " +
            "working-media ratio are managed.",
          examples: [
            "The Trade Desk",
            "Google Marketing Platform (DV360 / Campaign Manager)",
            "Amazon Ads",
            "Integral Ad Science / DoubleVerify (verification)",
          ],
        },
        {
          name: "Analytics, attribution & marketing-mix modeling",
          role:
            "Web/app analytics, multi-touch attribution, marketing-mix modeling, " +
            "and incrementality testing — where effectiveness is measured.",
          examples: [
            "Google Analytics 4",
            "Adobe Analytics",
            "Marketing-mix-modeling tools / data-science platforms",
            "Brand-tracking research panels",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Marketing Officer (CMO)",
          accountability:
            "Total marketing investment and return, the brand, demand " +
            "generation, and the go-to-market engine's contribution to growth.",
        },
        {
          title: "VP Demand Generation / Performance Marketing",
          accountability:
            "Pipeline and acquisition from paid and owned channels — CAC, " +
            "conversion, and marketing-sourced pipeline.",
        },
        {
          title: "Chief Brand Officer / VP Brand",
          accountability:
            "Brand equity, awareness/consideration, creative and content " +
            "quality, and brand-safety governance.",
        },
        {
          title: "Head of Marketing Technology / Marketing Operations",
          accountability:
            "The MarTech stack, the CDP and customer data, campaign operations, " +
            "and measurement infrastructure.",
        },
        {
          title: "Head of Marketing Analytics / Effectiveness",
          accountability:
            "Attribution, marketing-mix modeling, incrementality testing, and " +
            "the honesty of marketing's reported ROI.",
        },
        {
          title: "Marketing Procurement / Agency-Management Lead",
          accountability:
            "Agency roster and fees, production cost, MarTech licensing, and the " +
            "working-vs-non-working spend ratio.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Data privacy & consent (GDPR / CCPA, ePrivacy)",
          relevance:
            "Personalization, audience modeling, and tracking depend on " +
            "personal data and consent; lawful basis, purpose limitation, and " +
            "data-subject rights bound what data can be used and cap addressable coverage.",
        },
        {
          name: "Advertising / consumer-protection rules (FTC Act, UDAAP, ASA-style)",
          relevance:
            "Claims, comparative and influencer advertising, and disclosures " +
            "must be truthful and non-deceptive — AI-generated claims and " +
            "endorsements carry direct conduct and brand-safety risk.",
        },
        {
          name: "AI disclosure, IP & likeness rules",
          relevance:
            "Generated content raises copyright/training-data provenance, " +
            "likeness/right-of-publicity, and emerging AI-disclosure obligations " +
            "that the brand-safety gate must enforce.",
        },
        {
          name: "Email / messaging compliance (CAN-SPAM, CASL, ePrivacy)",
          relevance:
            "Automated and AI-orchestrated outbound must honor consent, " +
            "unsubscribe, and lawful-basis rules across email, SMS, and push.",
        },
      ],
      canonicalTerms: [
        {
          term: "Attribution",
          definition:
            "Assigning credit for a conversion across the marketing touches " +
            "that influenced it — last-click, multi-touch, or incrementality- " +
            "based; the harder it is, the more reported ROI should be hedged.",
        },
        {
          term: "Marketing-mix modeling (MMM)",
          definition:
            "A top-down statistical model estimating each channel's incremental " +
            "contribution (including brand and offline) from spend and outcome " +
            "time series — correlational, so validated against incrementality tests.",
        },
        {
          term: "Working vs non-working media",
          definition:
            "Working media reaches the audience; non-working is agency fees, " +
            "production, ad-tech tax, and overhead — the split the sourcing " +
            "function manages.",
        },
        {
          term: "Brand vs performance spend",
          definition:
            "The split between long-horizon brand-building investment and " +
            "short-window response/performance spend — the balance that decides " +
            "future versus immediate demand.",
        },
        {
          term: "Customer Data Platform (CDP)",
          definition:
            "The system that resolves identity and unifies consented first-party " +
            "data into a single customer profile the rest of the stack acts on.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Marketing ROI / channel effectiveness",
        authoritativeSource:
          "Marketing-mix modeling and geo/holdout incrementality tests " +
          "reconciled to the digital attribution dashboard and finance spend",
        whatGoodEvidenceLooksLike:
          "An incrementality- or holdout-validated estimate of channel lift, " +
          "with the attribution model stated, the unattributable remainder " +
          "disclosed, and brand/offline contribution included.",
        weakEvidenceToReject:
          "A last-click channel ROI or a vendor 'ROAS of Nx' with no " +
          "incrementality validation, no disclosed remainder, and channel ROIs " +
          "that sum to more than total conversions.",
      },
      {
        claim: "Brand equity / awareness / consideration",
        authoritativeSource:
          "Brand-tracking studies on a consistent panel and methodology over " +
          "time, supported by branded-search and share-of-voice proxies",
        whatGoodEvidenceLooksLike:
          "A consistent-methodology trend in awareness/consideration over " +
          "multiple waves, read alongside the brand/performance spend split and " +
          "CAC trend so the long-horizon effect is visible.",
        weakEvidenceToReject:
          "A one-off survey or a social-sentiment snapshot presented as brand " +
          "equity, or the assumption that flat short-term ROI means brand is unaffected.",
      },
      {
        claim: "Content production cost / cycle-time savings",
        authoritativeSource:
          "Agency/production invoices and work-management timestamps before and " +
          "after, by asset type and complexity",
        whatGoodEvidenceLooksLike:
          "A measured before/after on cost per asset and concept-to-live cycle " +
          "by asset type, with brand-safety review capacity and on-brand quality " +
          "held or improved.",
        weakEvidenceToReject:
          "A blanket 'GenAI cut content cost by X%' with no asset-type baseline " +
          "and no evidence the brand-safety gate kept pace with the volume.",
      },
      {
        claim: "Media efficiency / working-media ratio",
        authoritativeSource:
          "Log-level / supply-path data with viewability, invalid-traffic, and " +
          "fee/take-rate breakdowns reconciled to media spend",
        whatGoodEvidenceLooksLike:
          "A verified working-media ratio after fees, fraud, and viewability, " +
          "with supply-path transparency, before/after a sourcing or supply-path " +
          "intervention.",
        weakEvidenceToReject:
          "Gross delivered impressions or a vendor 'efficiency' claim with no " +
          "viewability, invalid-traffic, or fee disclosure.",
      },
      {
        claim: "Conversion / personalization uplift",
        authoritativeSource:
          "A/B or holdout tests in the CDP/analytics with consistent conversion- " +
          "event and audience definitions",
        whatGoodEvidenceLooksLike:
          "A controlled A/B or holdout comparison on a stable conversion-event " +
          "definition, with consent/coverage context and attribution haircuts applied.",
        weakEvidenceToReject:
          "An aggregate conversion-rate rise with no control, after the " +
          "conversion event or audience definition quietly changed.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What attribution model do you run, what share of conversions lands in 'direct/unknown', and when did you last validate a channel's reported ROI with an incrementality or holdout test?",
      "What is your brand-versus-performance spend split, and are awareness, consideration, and branded-search share holding as you shift budget toward lower-funnel performance?",
      "As GenAI content volume scales, what brand-safety and on-brand review gate does every asset pass through, and who is accountable when an AI-generated asset goes out wrong?",
      "How many MarTech tools do you license, what share are actively used, and does any single system hold a complete, current, consented customer profile the rest can act on?",
      "What is your verified working-media ratio after fees, fraud, and viewability, and do you have log-level supply-path transparency on programmatic spend?",
      "What share of your marketing spend is non-working (agency, production, MarTech overhead), how are agency fees structured, and when did you last benchmark them or test in-housing?",
      "How do you measure marketing-sourced pipeline and CAC, and are the sourcing and 'fully-loaded' definitions consistent enough that the numbers compare period to period?",
    ],
    maturitySignals: [
      "Marketing ROI is validated with incrementality / holdout tests, the unattributable remainder is reported openly, and budget moves rest on validated lift not last-click.",
      "Brand equity (awareness/consideration) is tracked on a consistent methodology and is part of the budget conversation alongside performance ROI, not cut because the dashboard can't see it.",
      "GenAI content passes a governed brand-safety / on-brand / disclosure gate before publish, and review capacity scales with production volume.",
      "A CDP holds a unified, consented, identity-resolved profile the stack acts on, and MarTech utilization is measured and rationalized.",
      "The marketing-services function measures working-vs-non-working spend, benchmarks agency fees, and has supply-path transparency on programmatic media.",
    ],
    redFlags: [
      "Budget is allocated on last-click attribution with a large, unreported 'direct/unknown' remainder and no incrementality testing.",
      "Brand spend is being cut to flatter short-term ROI while awareness/consideration and branded-search share are drifting down and CAC is rising.",
      "GenAI content volume is scaling with no brand-safety or on-brand review gate and no accountable owner when an asset goes out wrong.",
      "Dozens of MarTech tools are licensed with low utilization and fragmented, duplicate customer profiles that no single system can act on.",
      "A large share of programmatic spend leaks into fees, fraud, and non-viewable inventory with no log-level supply-path transparency.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Marketing cloud / CDP (Adobe, Salesforce, Twilio Segment, Tealium)",
        category: "Customer data platform / marketing automation suite",
        switchingCost:
          "High — the CDP and marketing-automation suite hold the customer data, " +
          "consent state, and campaign logic with deep integration; replacement " +
          "is a multi-quarter program and rarely undertaken lightly.",
        renewalDynamics:
          "Enterprise agreements, often consumption- or profile-volume-priced; " +
          "incumbents bundle their own GenAI and analytics at renewal to extend " +
          "the platform and raise switching cost further.",
      },
      {
        vendorName: "Creative agencies & production (holding-company and independent)",
        category: "Agency roster / creative & content production",
        switchingCost:
          "Moderate — agency relationships, institutional brand knowledge, and " +
          "in-flight work raise the real cost of moving, but the roster is " +
          "contestable; GenAI in-housing of production is shifting leverage to the brand.",
        renewalDynamics:
          "Retainer, project, or commission-linked fees; scope creep is the " +
          "silent cost — favor outcome- or output-based terms and benchmark fees " +
          "and production rates regularly.",
      },
      {
        vendorName: "Ad-tech / programmatic (DSPs, ad servers, verification)",
        category: "Media buying / activation / verification",
        switchingCost:
          "Moderate — DSP and ad-server setups are swappable with effort, but " +
          "the lock-in is in audience data, integrations, and the opacity of the " +
          "supply chain; portability of audience and log-level data matters on exit.",
        renewalDynamics:
          "Take-rate / fee on media spend plus platform fees; the 'ad-tech tax' " +
          "and supply-path opacity are the negotiation surface — press for log- " +
          "level transparency and fee disclosure.",
      },
      {
        vendorName: "GenAI content & creative tooling (Adobe Firefly, Canva, point GenAI vendors)",
        category: "GenAI content production / adaptation",
        switchingCost:
          "Low-to-moderate — fast-moving, overlapping category that is swappable, " +
          "but brand-asset training, prompt/template libraries, and rights/ " +
          "indemnification terms create soft lock-in.",
        renewalDynamics:
          "Per-seat or usage pricing; favor short commitments, content-IP and " +
          "indemnification terms, and brand-safety controls over feature breadth.",
      },
    ],
    switchingCosts:
      "The marketing-cloud / CDP system of record is the high-lock-in layer the " +
      "whole stack anchors to; the value-frontier and services layers (GenAI " +
      "tooling, ad-tech, agencies) sit in lower-to-moderate switching-cost layers " +
      "where fee transparency, outcome-based terms, and exit rights are " +
      "negotiable. The real lock-in is accumulated DATA (customer profiles, " +
      "consent, audience graphs, brand-asset training) and the opacity of the " +
      "programmatic supply chain, so exit rights over your own data and supply- " +
      "path transparency matter more than the software contract. Beware suite " +
      "GenAI/analytics bundling that quietly re-locks the stack at renewal.",
    negotiationLevers: [
      "Log-level supply-path transparency and full fee/take-rate disclosure on programmatic media to shrink the ad-tech tax",
      "Outcome- or output-based agency terms (replacing commission/opaque retainers) with regular fee and production-rate benchmarking",
      "In-housing assessment of GenAI-able production to shift leverage and lower the non-working spend ratio",
      "Customer-data, audience, and consent portability + brand-asset / model exit rights to avoid data lock-in",
      "Content-IP, training-data provenance, and indemnification terms on GenAI tooling, with brand-safety controls weighted over feature breadth",
      "Unbundle suite GenAI / analytics add-ons from the core renewal to keep best-of-breed and pricing leverage",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      roi_claim: [
        "stated attribution model",
        "incrementality / holdout validation",
        "disclosed unattributable remainder + brand/offline contribution",
      ],
      brand_equity_claim: [
        "consistent-methodology brand tracking over multiple waves",
        "branded-search / share-of-voice proxy",
        "read alongside brand/performance spend split and CAC trend",
      ],
      content_cost_claim: [
        "agency/production invoice baseline by asset type",
        "before/after cost and cycle time",
        "brand-safety review capacity and on-brand quality held",
      ],
      media_efficiency_claim: [
        "log-level / supply-path data",
        "viewability + invalid-traffic + fee/take-rate breakdown",
        "reconciliation to media spend",
      ],
      conversion_claim: [
        "consistent conversion-event and audience definition",
        "A/B or holdout control",
        "consent/coverage context + attribution haircut",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (attribution, brand-safety, data/consent)",
      ],
    },
    citationStandard:
      "Quantitative marketing claims cite the analytics / CDP / media / agency / " +
      "finance source and the period, state the attribution model, and disclose " +
      "the unattributable remainder. ROI and channel-effectiveness claims are " +
      "stated against incrementality or holdout validation, not last-click alone, " +
      "and brand claims rest on consistent-methodology tracking over multiple " +
      "waves. Value projections cite a baseline plus a labelled planning range " +
      "and the haircut factors applied (attribution uncertainty, brand-safety " +
      "tail risk, CDP data/consent coverage) — never a single asserted ROI " +
      "number, and never a vendor 'up to X% / Nx ROAS' figure without a baseline " +
      "and incrementality control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Marketing ROI / channel effectiveness is cited from last-click or multi-touch attribution without incrementality validation — frame it as systematically optimistic and the true number as below the dashboard until lift-tested.",
      "Brand-spend or brand-equity is in scope — hedge that brand value is long-horizon and resists short-window attribution, so a weak short-term ROI does not mean brand spend is unproductive.",
      "GenAI content scaling is being considered — hedge toward the industry pattern that volume without a brand-safety gate carries tail brand-damage risk that can exceed the cost saved.",
      "Vendor-reported ROAS / efficiency / cost-saving outcomes are cited — mark as vendor claims pending a baseline and a controlled / incrementality pilot.",
      "Benchmarks (ROI, CAC, spend %, working-media) are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across marketing orgs at this scale, last-click attribution typically overstates lower-funnel ROI and understates brand by...",
      "As an industry pattern (not your measured figure), a meaningful share of programmatic spend is lost to fees, fraud, and non-viewability before reaching a person...",
      "Without your brand-tracking trend, the industry pattern is that cutting brand spend flatters near-term ROI while raising future CAC...",
      "Peer programs commonly see content cost compress by... once GenAI production lands, contingent on a brand-safety gate keeping pace.",
    ],
    flagWithoutEvidence: [
      "A specific incrementality-validated marketing ROI or channel lift for this tenant",
      "This tenant's actual attribution coverage, working-media ratio, or brand-equity trend",
      "A claim that GenAI content will scale safely for this tenant without a brand-safety gate",
      "A specific cost-saving or ROAS figure asserted from a vendor without a baseline and control",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where does AI fit across the marketing engine / lever prioritization by value and risk",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of marketing stages (content → personalization → media allocation → brand) x AI lever shaded by net value and attribution/brand-safety/data risk.",
    },
    {
      questionPattern: "value of a marketing-AI program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled lift to realizable value with attribution-uncertainty, brand-safety, and CDP-data/consent haircuts.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (attribution uncertainty, brand-safety tail risk, data/consent coverage) on realizable value.",
    },
    {
      questionPattern: "marketing spend allocation / working vs non-working and brand vs performance split",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack total marketing spend into working media, agency/production, MarTech, and the brand-vs-performance split to expose where budget actually goes.",
    },
    {
      questionPattern: "marketing KPI scorecard",
      exhibitKind: "table",
      note: "Marketing ROI/ROAS, CAC, marketing-sourced pipeline, awareness/consideration, content cost per asset, campaign cycle time, media efficiency, conversion, spend % of revenue, attribution coverage, agency cost ratio vs planning ranges.",
    },
    {
      questionPattern: "marketing ROI vs incrementality / are reported channel returns real",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Side-by-side bars of last-click/MTA-claimed ROI vs incrementality-validated lift by channel to expose attribution over-claiming.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Measurement anchored in incrementality / holdout testing, not last-click, with the unattributable remainder reported honestly so budget moves on validated lift",
      "Brand equity tracked on a consistent methodology and protected in the budget conversation, so short-term ROI optimization doesn't quietly eat the long-horizon demand base",
      "A governed brand-safety / on-brand / disclosure gate that scales review capacity with GenAI content volume before scaling the volume",
      "Content and production efficiency sequenced first as the fastest, most measurable win, funding the harder allocation and personalization bets",
      "A unified, consented CDP profile and rationalized MarTech stack so personalization and attribution have clean data to act on",
    ],
    failureDrivers: [
      "Allocating budget on last-click attribution that over-credits lower-funnel channels and buries brand — confidently misallocating spend",
      "Cutting brand spend to flatter near-term ROI, eroding awareness/consideration and raising future CAC the dashboard never connects back",
      "Scaling GenAI content faster than the brand-safety gate, letting off-brand or unsafe assets through and inviting a brand-damage event worth more than the cost saved",
      "MarTech sprawl and siloed customer data leaving personalization and attribution starved of a complete profile",
      "Crediting overlapping marketing gains entirely to one AI bet without incrementality control, then missing the target the inflated case promised",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption is fastest where the win is concrete and low-risk: GenAI content " +
      "production and campaign orchestration adopt quickly because cost and cycle " +
      "time move in a quarter — but only safely once a brand-safety gate exists. " +
      "Personalization and predictive targeting follow as CDP and consent data " +
      "mature. The hardest shift is measurement: moving the organization off " +
      "last-click onto incrementality-validated allocation requires the CFO and " +
      "CMO to accept that the comfortable dashboard number was optimistic, so it " +
      "spreads only as leaders trust the harder, honest measure over the flattering one.",
    roiClarity: "medium",
    roiClarityBasis:
      "Content cost and cycle-time savings are directly measurable in invoices " +
      "and timestamps and are cleanly attributable. But the headline prize — " +
      "marketing ROI and the right spend allocation — sits squarely on the " +
      "attribution problem: last-click and multi-touch systematically over-credit " +
      "what's near the click and under-credit brand, and brand value is long- " +
      "horizon and resists short-window measurement, so ROI is firm only where " +
      "incrementality testing validates it. Without that discipline the case is " +
      "routinely overstated, which holds clarity at medium despite real value.",
  },

  regulatoryFrame: {
    name: "Data privacy & consent + advertising / AI-content conduct rules",
    relevance:
      "The dominant regulatory frame for AI in marketing: personalization, " +
      "audience modeling, and tracking depend on personal data and consent " +
      "(GDPR/CCPA, ePrivacy), which bound what data can be used and cap " +
      "addressable coverage; advertising and consumer-protection rules (FTC/ " +
      "UDAAP, ASA-style) require truthful, non-deceptive claims and disclosures; " +
      "and GenAI content raises IP / training-data provenance, likeness, and " +
      "emerging AI-disclosure obligations the brand-safety gate must enforce. " +
      "Automated outbound is also bound by email/messaging consent regimes " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (morgan)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
