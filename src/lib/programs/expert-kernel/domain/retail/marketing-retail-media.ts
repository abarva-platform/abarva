// Domain Function Pack — Retail · Marketing & retail media.
//
// Function key: `marketing_retail_media`.
//
// Marketing & retail media is the function that owns two connected economic
// engines. The first is the retailer's own marketing — how it spends media to
// acquire and retain customers and how efficiently that spend returns. The
// second is the retail media network: the retailer's first-party shopper data
// and on-site, in-store, and off-site inventory sold as advertising to the
// brands it carries — a high-margin revenue stream that has become a material
// part of large-retailer profit.
//
// It sits upstream of digital commerce: marketing buys and shapes the traffic
// that the storefront then has to convert. The two functions share the same
// customer data and have to be reasoned about together — but they are
// distinct: marketing & retail media owns demand creation, audience, media
// efficiency, and the retail-media P&L; digital commerce owns conversion of
// the traffic once it arrives. This pack covers the first.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const marketingRetailMediaPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'marketing_retail_media',
  functionLabel: 'Marketing & retail media',
  summary:
    'Marketing & retail media is the function that runs two connected ' +
    'engines: the retailer’s own marketing — the media spend that acquires ' +
    'and retains customers and the efficiency with which it returns — and ' +
    'the retail media network, the retailer’s first-party shopper data and ' +
    'advertising inventory sold to the brands it carries as a high-margin ' +
    'revenue stream. Its economics are media efficiency (ROAS and customer ' +
    'acquisition cost), proven incrementality, and retail-media net revenue ' +
    'and take rate. It sits upstream of digital commerce — it creates and ' +
    'shapes the demand the storefront then converts — and it is judged on ' +
    'incremental revenue and profit earned per marketing dollar and on the ' +
    'retail-media P&L, not on impressions delivered or campaigns shipped.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'marketing_roas',
      name: 'Marketing return on ad spend (ROAS)',
      definition:
        'Attributed revenue generated for every dollar of marketing media ' +
        'spend over the period — attributed revenue divided by media spend, ' +
        'for the retailer’s own marketing.',
      unit: 'attributed revenue $ per $ of media spend',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 2,
        high: 8,
        basis:
          'ROAS varies sharply by channel and objective — lower-funnel ' +
          'and brand-search spend reports high, upper-funnel and ' +
          'prospecting spend reports lower; reported ROAS also overstates ' +
          'true incrementality. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The marketing analytics / attribution platform joined to media ' +
        'spend from the ad platforms and revenue from the order-management ' +
        'system.',
      whyItMatters:
        'It is the headline efficiency of marketing spend — but it must be ' +
        'read alongside incrementality, because reported ROAS rewards ' +
        'claiming credit for demand that would have converted anyway.',
    },
    {
      key: 'retail_media_network_revenue',
      name: 'Retail media network revenue',
      definition:
        'Net advertising revenue the retailer earns from selling its ' +
        'on-site, in-store, and off-site media inventory and audiences to ' +
        'brands, over the period.',
      unit: 'net revenue $ per period',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 1,
        high: 8,
        basis:
          'Retail media revenue is most usefully tracked as a percentage ' +
          'of the retailer’s gross merchandise value — mature networks ' +
          'reach the upper end. A planning range; absolute scale depends ' +
          'on retailer size.',
        label: 'planning-range',
      },
      dataSource:
        'The retail media network ad-server and billing system, reconciled ' +
        'against the enterprise financial system.',
      whyItMatters:
        'Retail media revenue is near-pure-margin and has become a ' +
        'material share of large-retailer operating profit — it funds the ' +
        'price and margin pressure of the core retail business.',
    },
    {
      key: 'customer_acquisition_cost',
      name: 'Customer acquisition cost (CAC)',
      definition:
        'The total acquisition marketing spend in a period divided by the ' +
        'count of newly acquired customers attributed to it — the cost to ' +
        'bring in one new customer.',
      unit: 'media spend $ per new customer',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 120,
        basis:
          'CAC is structural by category and channel mix and by AOV and ' +
          'repeat economics; it must be read against customer lifetime ' +
          'value, not in isolation. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The marketing analytics platform joined to acquisition spend and ' +
        'new-customer counts from the customer-data and order systems.',
      whyItMatters:
        'CAC against lifetime value is the unit economics of growth — a ' +
        'CAC that exceeds the contribution lifetime value of the customer ' +
        'is acquisition that destroys value, however good the ROAS looks.',
    },
    {
      key: 'campaign_incrementality',
      name: 'Campaign incrementality',
      definition:
        'The share of campaign-attributed revenue that is genuinely ' +
        'incremental — would not have occurred without the campaign — ' +
        'measured against a holdout or geo-experiment control.',
      unit: '% of attributed revenue that is incremental',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 70,
        basis:
          'Incrementality varies enormously by channel and audience — ' +
          'prospecting and untargeted reach run higher, retargeting and ' +
          'brand-search of existing intent run far lower. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Controlled holdout, geo-lift, or ghost-ad experiments run in the ' +
        'marketing measurement platform.',
      whyItMatters:
        'Incrementality is the truth test of marketing — it separates ' +
        'demand the campaign created from demand it merely took credit for, ' +
        'and it is the single biggest correction to a naive ROAS.',
    },
    {
      key: 'attribution_coverage',
      name: 'Attribution coverage',
      definition:
        'The share of marketing-influenced conversions for which the ' +
        'touchpoint path can be observed and attributed, rather than lost ' +
        'to walled gardens, cookie loss, or unmeasured channels.',
      unit: '% of conversions with an observable path',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 85,
        basis:
          'Attribution coverage has fallen with cookie deprecation, ' +
          'walled-garden opacity, and cross-device journeys; the lost ' +
          'share is a measurement blind spot. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The attribution / marketing-measurement platform, comparing ' +
        'observed touchpoint paths against total attributed conversions.',
      whyItMatters:
        'A model can only optimise spend it can see — low attribution ' +
        'coverage means a growing share of the budget is allocated blind, ' +
        'and it is why marketing-mix modelling is needed alongside ' +
        'touch-level attribution.',
    },
    {
      key: 'share_of_voice',
      name: 'Share of voice',
      definition:
        'The retailer’s share of total category advertising presence — ' +
        'paid impressions, search-result presence, or spend — relative to ' +
        'the competitive set it tracks.',
      unit: '% of category advertising presence',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 10,
        high: 35,
        basis:
          'Share of voice is most useful read against share of market — a ' +
          'deliberate setting, not a maximisation target. A planning range; ' +
          'the competitive set defines the denominator.',
        label: 'planning-range',
      },
      dataSource:
        'Competitive media-monitoring and search-presence tools joined to ' +
        'the retailer’s own spend data.',
      whyItMatters:
        'Share of voice against share of market signals whether the ' +
        'retailer is over- or under-investing relative to competitors — ' +
        'sustained share-of-voice deficit erodes share of market over time.',
    },
    {
      key: 'content_production_velocity',
      name: 'Content and creative production velocity',
      definition:
        'The volume of marketing creative and content assets — variants, ' +
        'formats, and localisations — produced and approved per period ' +
        'against the demand the channels and campaigns require.',
      unit: 'approved assets per period vs. required',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 60,
        high: 100,
        basis:
          'Expressed as the share of channel and campaign creative demand ' +
          'met on time; channels increasingly need more variants than ' +
          'manual production supplies. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The creative / content workflow and digital-asset-management ' +
        'system, tracking briefed against approved assets.',
      whyItMatters:
        'Modern channels — personalised, multi-format, multi-market — ' +
        'demand far more creative than manual production yields; a ' +
        'creative-supply shortfall caps how well media spend can be ' +
        'targeted and tested.',
    },
    {
      key: 'audience_match_rate',
      name: 'Audience match rate',
      definition:
        'The share of a built first-party audience that can be ' +
        'successfully matched and activated on a destination ad platform ' +
        '— matched records divided by audience size.',
      unit: '% of audience records matched',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 80,
        basis:
          'Match rates depend on identifier quality, the destination ' +
          'platform, and consent scope; they have tightened with privacy ' +
          'change. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer data platform and the destination ad platforms’ ' +
        'audience-upload and match reporting.',
      whyItMatters:
        'An audience that cannot be matched cannot be reached — match ' +
        'rate bounds the real addressable scale of every first-party ' +
        'targeting and retail-media activation.',
    },
    {
      key: 'retail_media_take_rate',
      name: 'Retail media take rate',
      definition:
        'The retailer’s net retail-media revenue expressed as a percentage ' +
        'of the brand advertising spend transacted through the network — ' +
        'the share the retailer retains.',
      unit: '% of brand spend transacted',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 10,
        high: 30,
        basis:
          'Take rate spans self-serve and managed-service models and ' +
          'differs by inventory type; too high deters brand investment, ' +
          'too low forgoes margin. A planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The retail media ad-server and billing system, net revenue ' +
        'against gross transacted brand spend.',
      whyItMatters:
        'Take rate is the core monetisation lever of the retail media ' +
        'network — it sets how much of brand spend converts to retailer ' +
        'margin and signals the network’s competitive pricing posture.',
    },
    {
      key: 'brand_funded_marketing_pct',
      name: 'Brand-funded marketing share',
      definition:
        'The share of total retailer marketing and media activity that is ' +
        'funded by brand or vendor co-operative dollars rather than the ' +
        'retailer’s own marketing budget.',
      unit: '% of total marketing activity funded by brands',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 15,
        high: 50,
        basis:
          'Brand-funded share depends on category mix and co-op program ' +
          'maturity; it offsets retailer marketing cost but can skew ' +
          'activity toward brand rather than retailer goals. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The marketing finance and trade / co-op management systems, ' +
        'classifying activity by funding source.',
      whyItMatters:
        'Brand-funded marketing directly offsets the retailer’s own ' +
        'marketing cost — a higher share lowers the net cost of demand ' +
        'creation, but it must stay aligned with the retailer’s own ' +
        'customer and category strategy.',
    },
    {
      key: 'customer_lifetime_value',
      name: 'Customer lifetime value (CLV)',
      definition:
        'The projected contribution profit a customer generates over the ' +
        'expected relationship — the figure customer acquisition cost must ' +
        'be judged against.',
      unit: 'contribution profit $ per customer',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 600,
        basis:
          'CLV is structural by category, AOV, and repeat economics and ' +
          'spans a wide band; it is meaningful only as a ratio against CAC. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-data platform and finance systems, cohorted order ' +
        'and margin history projected forward.',
      whyItMatters:
        'CLV is the ceiling on rational acquisition spend — the ' +
        'CLV-to-CAC ratio is the unit economics that decide whether ' +
        'growth marketing creates or destroys value.',
    },
    {
      key: 'marketing_attributed_revenue_share',
      name: 'Marketing-attributed revenue share',
      definition:
        'The share of total retailer revenue attributed to ' +
        'marketing-influenced demand across all channels over the period.',
      unit: '% of total net revenue',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 20,
        high: 55,
        basis:
          'Attributed share depends heavily on the attribution model and ' +
          'on organic and brand strength; a high share can reflect ' +
          'over-crediting rather than real influence. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The attribution and marketing-mix-modelling platforms reconciled ' +
        'against total revenue in the financial system.',
      whyItMatters:
        'It sizes how much of the retailer’s revenue marketing genuinely ' +
        'influences — and, read against incrementality, exposes how much ' +
        'of that attributed share is real versus claimed.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'attribution_distortion',
      name: 'Attribution distortion and last-click bias',
      description:
        'Spend is allocated on a last-click or platform-reported ' +
        'attribution that over-credits lower-funnel and retargeting ' +
        'channels and starves upper-funnel demand creation. Each ad ' +
        'platform claims the same conversion, and the sum of reported ' +
        'ROAS exceeds reality.',
      detectionSignal:
        'Summed platform-reported revenue exceeds actual revenue; budget ' +
        'concentrates in retargeting and brand search with no holdout ' +
        'validation.',
      diagnosticQuestion:
        'What attribution model allocates the budget, and has its credit ' +
        'split ever been validated against a holdout or geo-experiment?',
    },
    {
      key: 'incrementality_blindness',
      name: 'Incrementality blindness',
      description:
        'Marketing is optimised on attributed ROAS with no measurement of ' +
        'what is genuinely incremental. The team scales the campaigns that ' +
        'best harvest existing intent and mistakes the harvest for ' +
        'demand creation.',
      detectionSignal:
        'No regular holdout, geo-lift, or ghost-ad testing; high reported ' +
        'ROAS coexists with flat or declining total new-customer ' +
        'acquisition.',
      diagnosticQuestion:
        'How is the incremental — not attributed — effect of marketing ' +
        'spend measured, and on what cadence?',
    },
    {
      key: 'siloed_channel_optimization',
      name: 'Siloed channel optimisation',
      description:
        'Each channel is planned and optimised in its own platform against ' +
        'its own metric. There is no cross-channel view of the customer ' +
        'journey or of diminishing returns, so the budget is split by ' +
        'channel-team inertia rather than by marginal return.',
      detectionSignal:
        'Channel budgets move little period to period and track last ' +
        'year’s split; no marketing-mix or media-mix model informs ' +
        'allocation.',
      diagnosticQuestion:
        'How is the media budget allocated across channels — by marginal ' +
        'incremental return, or by channel-team ownership and last year’s ' +
        'split?',
    },
    {
      key: 'creative_production_bottleneck',
      name: 'Creative production bottleneck',
      description:
        'Channels need far more creative variants — by format, audience, ' +
        'and market — than manual production supplies. Campaigns run on ' +
        'stale or too-few assets, testing is throttled by creative supply, ' +
        'and personalised media cannot be fed.',
      detectionSignal:
        'Creative demand outruns approved-asset velocity; campaigns reuse ' +
        'assets past fatigue and creative testing is rare.',
      diagnosticQuestion:
        'Is creative supply keeping pace with channel and personalisation ' +
        'demand, or is it the constraint on targeting and testing?',
    },
    {
      key: 'retail_media_yield_immaturity',
      name: 'Retail media yield immaturity',
      description:
        'The retail media network sells inventory at fixed rates or ' +
        'first-come fill, leaving yield on the table — high-demand search ' +
        'and placement inventory is underpriced, and there is no auction ' +
        'or pacing logic balancing fill against price.',
      detectionSignal:
        'Inventory sells out early or goes unsold; pricing is flat-rate ' +
        'with no demand-based variation and take rate sits below peer ' +
        'networks.',
      diagnosticQuestion:
        'How is retail-media inventory priced and allocated — by auction ' +
        'and demand-based yield logic, or by fixed rate and first-come ' +
        'fill?',
    },
    {
      key: 'first_party_data_underuse',
      name: 'First-party data underuse',
      description:
        'The retailer’s richest asset — first-party purchase and shopper ' +
        'data — is underused. Audiences are coarse, slow to build, poorly ' +
        'matched to destinations, or unavailable to the retail media ' +
        'network, so both own-marketing targeting and the network’s ' +
        'product underperform.',
      detectionSignal:
        'Audiences are broad demographic segments rather than behavioural; ' +
        'match rates are low and audience build is a manual, slow request ' +
        'process.',
      diagnosticQuestion:
        'How fully is first-party purchase data turned into precise, ' +
        'high-match audiences for both own marketing and the retail media ' +
        'network?',
    },
    {
      key: 'brand_funding_misalignment',
      name: 'Brand-funding misalignment',
      description:
        'Brand co-op and retail-media dollars pull marketing activity ' +
        'toward what brands will fund rather than what the retailer’s ' +
        'customer and category strategy needs. Funded activity is taken ' +
        'because it is funded, not because it is right.',
      detectionSignal:
        'Marketing activity skews to categories and brands with the ' +
        'largest co-op budgets; brand-funded campaigns are not assessed ' +
        'against the retailer’s own customer goals.',
      diagnosticQuestion:
        'Is brand-funded and retail-media activity governed against the ' +
        'retailer’s own customer and category strategy, or driven by where ' +
        'the funding happens to be?',
    },
    {
      key: 'privacy_signal_loss',
      name: 'Privacy-driven signal loss',
      description:
        'Cookie deprecation, mobile identifier restrictions, and consent ' +
        'requirements have eroded the tracking signal marketing was built ' +
        'on. Targeting, measurement, and audience match all degrade, and ' +
        'the team has not rebuilt on durable first-party and modelled ' +
        'signal.',
      detectionSignal:
        'Attribution coverage and audience match rates trend down; ' +
        'measurement gaps widen and the team still depends on third-party ' +
        'cookies and device identifiers.',
      diagnosticQuestion:
        'How is the function adapting to signal loss — rebuilding on ' +
        'consented first-party data, modelled conversions, and ' +
        'marketing-mix modelling — or still dependent on deprecating ' +
        'identifiers?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'media_mix_budget_optimization',
      name: 'Media-mix and budget optimisation',
      valueMechanism:
        'A model — marketing-mix modelling joined with experiment ' +
        'calibration — estimates the incremental return and the ' +
        'diminishing-returns curve of each channel and reallocates the ' +
        'budget toward marginal incremental return rather than reported ' +
        'last-click ROAS. Value comes from the same total spend producing ' +
        'more incremental revenue, and from cutting spend on channels that ' +
        'only harvest existing demand.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Channel-level media spend and delivery history',
        'Total revenue and conversion outcomes over time',
        'Holdout and geo-experiment results for model calibration',
        'External factors — seasonality, pricing, competitive activity',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A marketing-effectiveness or finance lead owns the budget ' +
          'decision — the model recommends the allocation, it does not ' +
          'commit the spend.',
        'Marketing-mix models must be calibrated against real experiments ' +
          '— an uncalibrated model can confidently misallocate the budget.',
        'The model must not strip all upper-funnel investment to chase ' +
          'short-run efficiency and starve future demand.',
      ],
      metricsMoved: [
        'marketing_roas',
        'campaign_incrementality',
        'customer_acquisition_cost',
        'marketing_attributed_revenue_share',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'campaign_creative_generation',
      name: 'Campaign creative and content generation',
      valueMechanism:
        'A generative model produces marketing creative and content at ' +
        'scale — copy, imagery, and video variants by format, audience, ' +
        'and market — from briefs, brand guidelines, and product data. ' +
        'Value comes from breaking the creative-supply bottleneck: enough ' +
        'on-brand variants to feed personalised channels and to test ' +
        'creative properly, produced far faster and cheaper than manual ' +
        'production.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Brand guidelines, tone, and visual-identity rules',
        'Product data, imagery, and approved creative examples',
        'Campaign briefs and channel format specifications',
        'Creative-performance history for what works by audience',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'A brand or creative lead reviews and approves generated assets ' +
          'before they run — generated creative is a draft, never an ' +
          'auto-published asset.',
        'Generated claims, pricing, and brand and rights usage must be ' +
          'verified — a fabricated or non-compliant claim is a legal and ' +
          'brand risk.',
        'Output must be checked for brand consistency and for off-brand ' +
          'or biased imagery before release.',
      ],
      metricsMoved: [
        'content_production_velocity',
        'marketing_roas',
        'share_of_voice',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'retail_media_yield_optimization',
      name: 'Retail media yield optimisation',
      valueMechanism:
        'A model prices and allocates the retail media network’s inventory ' +
        '— sponsored search, on-site placement, in-store and off-site — ' +
        'through auction and demand-based yield logic, pacing fill against ' +
        'price and relevance. Value comes from lifting retail-media revenue ' +
        'and take rate by pricing high-demand inventory to its worth, while ' +
        'protecting the shopper experience and ad relevance.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inventory supply, demand, and historical fill data',
        'Brand bid, budget, and campaign-objective data',
        'On-site shopper behaviour and conversion outcomes',
        'Ad relevance and shopper-experience quality signals',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A retail-media commercial lead owns floor prices, the ' +
          'experience-quality guardrails, and the ad-load limits — the ' +
          'model optimises yield within them.',
        'Yield optimisation must not degrade shopper experience or ad ' +
          'relevance to maximise short-run revenue.',
        'Auction logic must be auditable and fair to advertisers — ' +
          'opacity erodes brand trust in the network.',
      ],
      metricsMoved: [
        'retail_media_network_revenue',
        'retail_media_take_rate',
        'brand_funded_marketing_pct',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'audience_activation_targeting',
      name: 'Audience activation and targeting',
      valueMechanism:
        'A model builds precise behavioural audiences from first-party ' +
        'purchase and shopper data — predicted intent, lifecycle stage, ' +
        'category affinity, churn risk — and activates them across the ' +
        'retailer’s own channels and the retail media network. Value comes ' +
        'from sharper targeting that lifts ROAS and match rates for own ' +
        'marketing and gives the retail-media network a differentiated, ' +
        'higher-value audience product.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'First-party purchase, browsing, and loyalty data',
        'Consent and permitted-use records',
        'Identity resolution across channels and devices',
        'Destination-platform audience-match capability',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A customer-data or marketing lead owns audience definitions and ' +
          'the permitted-use rules — the model proposes audiences within a ' +
          'governed consent framework.',
        'Consent and privacy regulation gate every audience build and ' +
          'activation — permitted use is enforced, not assumed.',
        'Audiences must be checked for exclusionary or discriminatory ' +
          'targeting, especially in sensitive categories.',
      ],
      metricsMoved: [
        'audience_match_rate',
        'marketing_roas',
        'customer_acquisition_cost',
        'retail_media_network_revenue',
      ],
      relatedArchetypePlaybook: 'personalization',
    },
    {
      key: 'incrementality_measurement',
      name: 'Incrementality measurement and experimentation',
      valueMechanism:
        'A model designs, runs, and reads incrementality experiments — ' +
        'geo-lift, holdout, and ghost-ad tests — at scale and continuously, ' +
        'and feeds the measured incremental effect back to calibrate ' +
        'attribution and the media-mix model. Value comes from replacing ' +
        'claimed ROAS with proven incremental return as the basis for ' +
        'every budget decision.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Geo-level or user-level spend and outcome data',
        'A clean control and exposed group design',
        'Sufficient conversion volume for statistical power',
        'Outcome data joined across channels and to revenue',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A marketing-science lead owns experiment design and reads results ' +
          'against a stated significance bar — the model proposes and ' +
          'measures, it does not declare a result.',
        'Experiments must be powered correctly — an underpowered test ' +
          'produces a confident but wrong incrementality read.',
        'Results must be checked for contamination, seasonality, and ' +
          'novelty effects before they recalibrate the budget.',
      ],
      metricsMoved: [
        'campaign_incrementality',
        'marketing_roas',
        'attribution_coverage',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'multi_touch_attribution_modeling',
      name: 'Multi-touch and privacy-durable attribution modelling',
      valueMechanism:
        'A model assembles a privacy-durable view of the customer journey ' +
        '— modelled conversions where signal is lost, blended with ' +
        'marketing-mix modelling and experiment calibration — and ' +
        'attributes credit across touchpoints. Value comes from restoring ' +
        'attribution coverage and credit accuracy as cookies and device ' +
        'identifiers disappear, so spend is allocated on a true picture ' +
        'rather than a shrinking observed one.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Observable touchpoint and conversion-path data',
        'Consented first-party identity and behavioural data',
        'Aggregated and modelled conversion signals from walled gardens',
        'Experiment results to calibrate and validate the model',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'A marketing-analytics lead owns the attribution methodology and ' +
          'its assumptions — the model attributes credit, a human governs ' +
          'how it is used to allocate budget.',
        'Modelled conversions must be validated against experiments — an ' +
          'unvalidated attribution model is confident misallocation.',
        'The model must operate within consent and privacy rules and ' +
          'avoid re-identifying individuals from aggregated signal.',
      ],
      metricsMoved: [
        'attribution_coverage',
        'marketing_roas',
        'marketing_attributed_revenue_share',
        'campaign_incrementality',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'incrementality_calibrated_measurement',
      name: 'Incrementality-calibrated measurement layer',
      description:
        'A pattern that runs marketing-mix modelling and multi-touch ' +
        'attribution together and continuously calibrates both against a ' +
        'standing programme of geo-lift and holdout experiments — so every ' +
        'budget decision rests on a measured incremental effect rather than ' +
        'a claimed last-click number.',
      boundary:
        'It measures and attributes incremental effect; it does not commit ' +
        'media spend itself. It is the truth layer the budget-optimisation ' +
        'pattern consumes.',
      humanAccountabilityPoint:
        'The head of marketing science / effectiveness accountable for the ' +
        'measurement methodology and its calibration.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'first_party_audience_platform',
      name: 'First-party audience and identity platform',
      description:
        'A pattern that turns first-party purchase, browsing, and loyalty ' +
        'data into a governed audience platform — identity resolved, ' +
        'consent enforced, behavioural audiences built once and activated ' +
        'consistently across the retailer’s own channels and the retail ' +
        'media network.',
      boundary:
        'It builds and serves audiences under consent; it does not buy ' +
        'media or set campaign strategy. It is a governed audience service ' +
        'both own marketing and the network consume.',
      humanAccountabilityPoint:
        'The customer-data-platform owner accountable for audience ' +
        'governance, identity resolution, and permitted-use enforcement.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'personalization',
    },
    {
      key: 'retail_media_yield_engine',
      name: 'Retail media yield and auction engine',
      description:
        'A pattern that runs the retail media network’s inventory through ' +
        'an auction and yield engine — demand-based pricing, pacing, and ' +
        'relevance ranking across sponsored search, on-site, in-store, and ' +
        'off-site placements — within commercial floors and ' +
        'experience-quality guardrails.',
      boundary:
        'It prices, paces, and ranks ads; it does not set the ' +
        'experience-quality guardrails, the ad-load limits, or the ' +
        'commercial floors — those are governed inputs. It optimises yield ' +
        'inside them.',
      humanAccountabilityPoint:
        'The retail media network commercial lead accountable for yield, ' +
        'pricing policy, and the shopper-experience guardrails.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'creative_production_pipeline',
      name: 'AI-assisted creative production pipeline',
      description:
        'A pattern that runs creative as a managed pipeline — brief, ' +
        'AI-generated variants against brand rules and product data, ' +
        'human brand review, channel-format adaptation, release, and a ' +
        'performance feedback loop — so creative supply keeps pace with ' +
        'personalised, multi-format channel demand.',
      boundary:
        'It produces and adapts creative; it does not approve brand or ' +
        'compliance sign-off autonomously and does not buy the media. ' +
        'Every asset passes human brand review before release.',
      humanAccountabilityPoint:
        'The creative director / brand lead accountable for brand ' +
        'consistency and creative-claim compliance.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'unified_marketing_planning_loop',
      name: 'Unified marketing planning and allocation loop',
      description:
        'A pattern that puts cross-channel budget planning, the media-mix ' +
        'model, the incrementality programme, and in-flight pacing on one ' +
        'loop — so the budget is allocated by marginal incremental return, ' +
        're-checked against measured results, and reallocated continuously ' +
        'rather than set once a year by channel-team split.',
      boundary:
        'It plans, recommends, and monitors the allocation; a marketing ' +
        'and finance owner approves the budget and the in-flight shifts. ' +
        'It does not commit spend autonomously.',
      humanAccountabilityPoint:
        'The VP of marketing accountable for the marketing budget and its ' +
        'cross-channel allocation.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Marketing & retail-media value is realised in three connected ways ' +
      'and a forecast must keep them distinct. First, media efficiency: ' +
      'reallocating the same budget toward proven incremental return — and ' +
      'cutting harvest spend — lifts incremental revenue per dollar without ' +
      'spending more, and AI creative cuts the cost of producing the media. ' +
      'Second, retail-media revenue: yield optimisation and a stronger ' +
      'audience product lift the near-pure-margin revenue the network ' +
      'earns, which flows almost entirely to operating profit. Third, ' +
      'avoided cost: a higher brand-funded share offsets the retailer’s own ' +
      'marketing budget. The dominant constraint is measurement honesty — ' +
      'much of the apparent value of marketing is attribution credit for ' +
      'demand that would have converted anyway, so a forecast that is not ' +
      'grounded in incrementality testing will overstate the recurring ' +
      'gain. The retail-media revenue and the efficiency gain are recurring ' +
      'once realised; both must be read against the retailer’s data and ' +
      'measurement maturity, not a model-perfect one.',
    dominantHaircutFactors: [
      {
        factor: 'Incrementality and measurement honesty',
        rationale:
          'Reported ROAS systematically overstates the true incremental ' +
          'effect of marketing. A value forecast built on attributed ' +
          'rather than measured-incremental revenue claims efficiency ' +
          'gains that are really credit reallocation, not new demand.',
        typicalHaircut: {
          low: 0.25,
          high: 0.55,
          basis:
            'The gap between attributed and genuinely incremental ' +
            'marketing value; a planning range widening with the share of ' +
            'harvest and retargeting spend in the mix.',
          label: 'planning-range',
        },
      },
      {
        factor: 'First-party data and identity readiness',
        rationale:
          'Audience targeting, retail-media products, and durable ' +
          'attribution all depend on resolved, consented, high-match ' +
          'first-party data. Fragmented identity and low match rates cap ' +
          'how much of the modelled value can be delivered.',
        typicalHaircut: {
          low: 0.15,
          high: 0.4,
          basis:
            'Forecast erosion from fragmented identity, low audience match ' +
            'rates, and incomplete consented data; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Privacy and signal-availability change',
        rationale:
          'Cookie deprecation, identifier restrictions, and tightening ' +
          'consent continue to erode the signal marketing optimisation ' +
          'and measurement run on. Value modelled on today’s signal ' +
          'availability erodes as that signal degrades further.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from continued privacy-driven signal loss; ' +
            'a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Retail-media demand and brand-budget ceiling',
        rationale:
          'Retail-media revenue is bounded by how much brand advertising ' +
          'budget the network can attract and by competition from other ' +
          'retail media networks. Yield optimisation cannot create demand ' +
          'that the brand-budget pool and the retailer’s scale do not ' +
          'support.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'The share of a modelled retail-media revenue gain not ' +
            'reachable given the available brand-budget pool and ' +
            'competitive position; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Media-efficiency improvement',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative improvement in incremental revenue per marketing ' +
            'dollar from media-mix reallocation and incrementality-led ' +
            'budgeting; a planning range spanning early and mature ' +
            'adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in measured-incremental revenue per ' +
          'dollar of media spend.',
      },
      {
        lever: 'Retail-media revenue uplift',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative uplift in retail-media network net revenue from ' +
            'yield optimisation and a stronger audience product; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in retail-media network net revenue.',
      },
      {
        lever: 'Creative production cost and velocity',
        range: {
          low: 20,
          high: 60,
          basis:
            'Relative reduction in creative cost per asset, or equivalent ' +
            'increase in approved-asset velocity, from AI-assisted ' +
            'production; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in creative cost per approved asset, ' +
          'or in approved-asset velocity at constant cost.',
      },
      {
        lever: 'Customer-acquisition-cost reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in customer acquisition cost from sharper ' +
            'audience targeting and incrementality-led allocation; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in acquisition cost per new ' +
          'customer at constant or better customer quality.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first signal from a discrete win — a creative-' +
      'production pipeline live, a retail-media yield change; 9–15 months ' +
      'to a settled, defensible result, because the media-mix and ' +
      'incrementality gains only prove out once a full cycle of geo-lift ' +
      'and holdout experiments has run and recalibrated the budget.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Marketing measurement and attribution platform',
        role:
          'The system of record for media spend, attributed outcomes, ' +
          'marketing-mix modelling, and incrementality results.',
        examples: [
          'Google / Meta measurement suites',
          'Northbeam',
          'Measured',
          'Analytic Partners',
          'in-house marketing-mix models',
        ],
      },
      {
        name: 'Retail media network ad server and ad-tech stack',
        role:
          'Serves, prices, and bills the retailer’s sponsored search, ' +
          'on-site, in-store, and off-site advertising inventory.',
        examples: [
          'Citrus Ad',
          'Criteo Retail Media',
          'Koddi',
          'The Trade Desk / off-site DSPs',
          'in-house retail-media platforms',
        ],
      },
      {
        name: 'Customer data platform and identity graph',
        role:
          'Holds the resolved customer profile, consent, and the ' +
          'first-party audiences activated for own marketing and the ' +
          'retail media network.',
        examples: [
          'Segment',
          'Tealium',
          'Adobe Real-Time CDP',
          'LiveRamp identity resolution',
        ],
      },
      {
        name: 'Campaign management and ad platforms',
        role:
          'The buying platforms where campaigns are planned, trafficked, ' +
          'and optimised across paid search, social, display, and video.',
        examples: [
          'Google Ads',
          'Meta Ads Manager',
          'demand-side platforms',
          'campaign-management suites',
        ],
      },
      {
        name: 'Creative workflow and digital-asset-management system',
        role:
          'Manages creative briefs, production workflow, brand assets, ' +
          'and the approved-asset library marketing runs on.',
        examples: ['Bynder', 'Adobe Workfront', 'Aprimo', 'Air'],
      },
      {
        name: 'Trade / co-op management and marketing finance system',
        role:
          'Tracks brand co-op and trade dollars, brand-funded activity, ' +
          'and the marketing budget against the financial plan.',
        examples: [
          'Trade-promotion-management systems',
          'co-op management platforms',
          'enterprise marketing-finance systems',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Marketing Officer',
        accountability:
          'Owns the marketing strategy, the marketing budget, and the ' +
          'customer-acquisition and brand outcomes.',
      },
      {
        title: 'VP / Head of retail media network',
        accountability:
          'Owns the retail media P&L — network revenue, take rate, yield, ' +
          'and the advertiser relationship.',
      },
      {
        title: 'Head of marketing science / effectiveness',
        accountability:
          'Owns measurement — attribution, marketing-mix modelling, the ' +
          'incrementality programme, and budget-allocation analytics.',
      },
      {
        title: 'Head of performance / media',
        accountability:
          'Owns cross-channel media planning, campaign execution, and ' +
          'in-flight optimisation against efficiency targets.',
      },
      {
        title: 'Creative director / brand lead',
        accountability:
          'Owns brand consistency, creative quality, and the compliance ' +
          'of creative claims.',
      },
      {
        title: 'Customer-data-platform owner',
        accountability:
          'Owns audience governance, identity resolution, and ' +
          'permitted-use and consent enforcement.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Consumer-privacy and consent regulation (GDPR, CCPA / CPRA)',
        relevance:
          'Governs the collection, audience use, and sharing of customer ' +
          'data — it bounds first-party audience building, retail-media ' +
          'targeting, and measurement, and sets the permitted-use frame.',
      },
      {
        name: 'Cookie deprecation and mobile-identifier policy',
        relevance:
          'Platform and browser changes to third-party cookies and ' +
          'device identifiers continually reshape what signal is ' +
          'available for targeting, attribution, and audience match.',
      },
      {
        name: 'Truth-in-advertising and disclosure rules (FTC and ' +
          'equivalents)',
        relevance:
          'Governs advertising claims, endorsements, sponsored-content ' +
          'disclosure, and pricing representation across the retailer’s ' +
          'marketing and the retail media network.',
      },
      {
        name: 'Retail-media transparency and measurement standards',
        relevance:
          'Emerging industry standards for retail-media measurement, ' +
          'auction transparency, and reporting shape how the network must ' +
          'price, report, and substantiate results to advertisers.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Return on ad spend (ROAS)',
        definition:
          'Attributed revenue per dollar of media spend — a reported ' +
          'efficiency measure that overstates true incremental return.',
      },
      {
        term: 'Retail media network (RMN)',
        definition:
          'A retailer’s business of selling its first-party shopper data ' +
          'and on-site, in-store, and off-site advertising inventory to ' +
          'the brands it carries.',
      },
      {
        term: 'Incrementality',
        definition:
          'The share of marketing-attributed outcome that genuinely would ' +
          'not have occurred without the marketing — measured against a ' +
          'control.',
      },
      {
        term: 'Customer acquisition cost (CAC)',
        definition:
          'Acquisition marketing spend divided by new customers acquired ' +
          '— meaningful only as a ratio against customer lifetime value.',
      },
      {
        term: 'Marketing-mix modelling (MMM)',
        definition:
          'A top-down statistical method that estimates each channel’s ' +
          'incremental contribution from aggregate spend and outcome data ' +
          '— privacy-durable and used to allocate budget.',
      },
      {
        term: 'Multi-touch attribution (MTA)',
        definition:
          'A method that assigns conversion credit across the touchpoints ' +
          'in a customer journey — increasingly modelled as observable ' +
          'signal is lost.',
      },
      {
        term: 'Audience match rate',
        definition:
          'The share of a first-party audience that can be matched and ' +
          'activated on a destination ad platform.',
      },
      {
        term: 'Take rate',
        definition:
          'The share of brand advertising spend transacted through a ' +
          'retail media network that the retailer retains as net revenue.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Marketing & Retail Media Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the marketing budget is being spent inefficiently ' +
        'and where the retail media network is leaving revenue on the ' +
        'table — in attribution, channel allocation, creative supply, ' +
        'audience use, or retail-media yield — with baseline evidence, ' +
        'before a solution is shaped.',
      sections: [
        {
          heading: 'Marketing and retail-media context',
          guidance:
            'Name the marketing scope, the channel mix, the budget, the ' +
            'retail media network model and maturity, and the operating ' +
            'model. State which measurement, ad-server, CDP, ad-platform, ' +
            'creative, and trade systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — ROAS, retail-media revenue, CAC, ' +
            'incrementality, attribution coverage, share of voice, content ' +
            'velocity, audience match rate, take rate, brand-funded share, ' +
            'CLV, attributed-revenue share. For any metric not measured, ' +
            'name it as a precise seed gap with its expected data source.',
        },
        {
          heading: 'Spend efficiency and incrementality diagnostic',
          guidance:
            'Analyse the channel budget split against marginal incremental ' +
            'return, the attribution model in use, and whether ROAS is ' +
            'validated by holdout or geo-experiment. Quantify the gap ' +
            'between attributed and genuinely incremental marketing value.',
        },
        {
          heading: 'Retail media yield diagnostic',
          guidance:
            'Assess how retail-media inventory is priced and allocated, ' +
            'how fully first-party data powers the audience product, and ' +
            'where yield and take rate sit against the network’s ' +
            'potential.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — attribution distortion, ' +
            'incrementality blindness, siloed channel optimisation, the ' +
            'creative bottleneck, retail-media yield immaturity, ' +
            'first-party data underuse, brand-funding misalignment, ' +
            'privacy-driven signal loss — and state which are present, ' +
            'with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — media efficiency, retail-media revenue, ' +
            'creative cost, CAC — explicitly haircut by incrementality ' +
            'honesty, data readiness, privacy change, and the brand-budget ' +
            'ceiling. Every figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps, asks, and recommended Move framing',
          guidance:
            'List the specific data the diagnosis still needs and who ' +
            'owns each source; then state which AI use-case archetype(s) ' +
            'the evidence points to and what the Move would and would not ' +
            'attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Marketing & Retail Media Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a marketing or ' +
        'retail-media AI Move — baseline, forecast, cost, and the honest ' +
        'downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'media efficiency, retail-media revenue, and creative-cost ' +
            'saving, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — incremental ROAS, CAC against CLV, retail-media ' +
            'revenue and take rate, content velocity. Where a baseline is ' +
            'a seed gap (no incrementality measurement exists), say so and ' +
            'state what closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — incrementality ' +
            'honesty, first-party data readiness, privacy change, the ' +
            'brand-budget ceiling — explicitly and show the haircut math. ' +
            'Keep media-efficiency, retail-media-revenue, and creative-cost ' +
            'gains separate.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the measurement, ' +
            'ad-server, CDP, ad-platform, and creative systems, and the ' +
            'operating-model change — the incrementality programme, the ' +
            'creative pipeline, and the retail-media commercial model.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under a low genuine-incrementality ' +
            'share, weaker first-party data, further signal loss, and a ' +
            'softer brand-budget pool. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example no measurement capability to validate ' +
            'incrementality, or first-party data too fragmented to build ' +
            'audiences — and the evidence that must be in hand before the ' +
            'gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the geo-lift or holdout design that ' +
            'isolates incremental value, and the measurement cadence.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Marketing & Retail Media Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'marketing or retail-media AI capability, grounded in the function ' +
        'reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — incrementality-calibrated measurement layer, ' +
            'first-party audience and identity platform, retail media ' +
            'yield and auction engine, AI-assisted creative pipeline, ' +
            'unified marketing planning loop — and state which apply and ' +
            'how they connect.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the measurement, ad-server, CDP, ad-platform, ' +
            'creative, and trade integrations, the first-party data and ' +
            'identity resolution, consent enforcement, and the experiment ' +
            'data the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and how ' +
            'marketing-science, commercial, and brand owners review and ' +
            'override recommendations. No archetype ships without a named ' +
            'owner.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how marketing-science, media-buying, creative, and ' +
            'retail-media commercial workflows change, how the ' +
            'incrementality and budget-reallocation cadence is reshaped, ' +
            'and who owns each change.',
        },
        {
          heading: 'Responsible-AI and governance controls',
          guidance:
            'State the model-calibration, audience-fairness, ' +
            'creative-compliance, and auction-transparency controls, the ' +
            'consent and permitted-use discipline, and the regulatory ' +
            'frames (privacy, truth-in-advertising, retail-media ' +
            'standards) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'marketing and retail-media stack, and the phased rollout by ' +
            'capability — measurement, audiences, creative, yield.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Marketing & Retail Media Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the marketing or retail-media AI ' +
        'capability so value reaches the marketing P&L and the ' +
        'retail-media P&L, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, the ' +
            'first incrementality experiments or a first capability live, ' +
            'team onboarding, scale across channels and the network — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, first-party data and consent readiness, ' +
            'marketing-science and commercial adoption, the creative ' +
            'pipeline, Tower measurement.',
        },
        {
          heading: 'Marketing-team and advertiser adoption approach',
          guidance:
            'Define the change runway for marketing-science, media, ' +
            'creative, and retail-media commercial teams — and, for the ' +
            'network, the advertiser-facing change — including training ' +
            'and the shift in the planning and measurement cadence, with ' +
            'adoption measured, not assumed.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, the geo-lift or ' +
            'holdout design, and the cadence for each metric.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — low genuine incrementality, ' +
            'data-readiness gaps, continued signal loss, soft ' +
            'brand-budget demand, creative-compliance errors — with the ' +
            'escalation owner and the trigger for each.',
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
      claim: 'The incremental — not attributed — return on marketing spend',
      authoritativeSource:
        'Controlled geo-lift, holdout, or ghost-ad experiments, calibrated ' +
        'against marketing-mix modelling.',
      whatGoodEvidenceLooksLike:
        'A measured incremental lift from a powered, clean control-versus-' +
        'exposed experiment, with the experiment design and significance ' +
        'stated, used to correct reported ROAS.',
      weakEvidenceToReject:
        'Platform-reported or last-click ROAS presented as the return on ' +
        'spend, or an incrementality claim with no experiment behind it.',
    },
    {
      claim: 'Retail media network revenue and take rate',
      authoritativeSource:
        'The retail media ad-server and billing system reconciled against ' +
        'the enterprise financial system.',
      whatGoodEvidenceLooksLike:
        'Net retail-media revenue and take rate by inventory type, ' +
        'reconciled to finance, with gross transacted brand spend stated ' +
        'so the take rate is real.',
      weakEvidenceToReject:
        'A gross-billings figure presented as net revenue, or a ' +
        'retail-media revenue number never reconciled to the financial ' +
        'system.',
    },
    {
      claim: 'Customer acquisition cost against customer lifetime value',
      authoritativeSource:
        'The marketing analytics and customer-data systems, joining ' +
        'acquisition spend and new-customer counts to cohorted ' +
        'contribution-margin history.',
      whatGoodEvidenceLooksLike:
        'CAC computed from acquisition-only spend and genuinely new ' +
        'customers, set against a CLV built from cohorted contribution ' +
        'profit — the ratio, not either figure alone.',
      weakEvidenceToReject:
        'A CAC that divides total marketing spend by all customers, or a ' +
        'CLV based on revenue rather than contribution profit, or either ' +
        'figure quoted without the other.',
    },
    {
      claim: 'Audience reach — that a first-party audience can be activated',
      authoritativeSource:
        'The customer data platform and the destination ad platforms’ ' +
        'audience-upload and match reporting.',
      whatGoodEvidenceLooksLike:
        'Match rates by destination platform with the audience size and ' +
        'consent scope stated, so the genuinely addressable audience is ' +
        'distinguished from the records on file.',
      weakEvidenceToReject:
        'An audience-size count presented as reach, or a match-rate claim ' +
        'with no destination platform or consent scope stated.',
    },
    {
      claim: 'The forecast value of a marketing or retail-media AI Move',
      authoritativeSource:
        'The value model — media efficiency, retail-media revenue, and ' +
        'creative cost, each haircut by its dominant factors — read ' +
        'against the retailer’s measurement and data maturity.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the efficiency gain grounded in ' +
        'incrementality testing, and every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single-point savings or revenue number, a vendor ROI claim ' +
        'taken at face value, or a forecast built on attributed ROAS with ' +
        'no incrementality haircut.',
    },
  ],
};
