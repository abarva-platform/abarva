// Domain Function Pack — Retail · Customer loyalty & personalization.
//
// Function key: `customer_loyalty_personalization`.
//
// Customer loyalty and personalization is the function that owns the
// relationship between the retailer and the individual customer over time. It
// runs the loyalty program — the membership, the earn-and-burn reward
// mechanics, the tiers and benefits — and the personalization engine that
// turns the customer-data platform into a relevant offer, a relevant message,
// and a relevant journey. Where merchandising decides what the retailer sells
// and store operations decides how a single visit converts, this function
// decides who the customer is, why they come back, and how much they are
// worth over their lifetime with the retailer. Its economics are repeat
// purchase, retention, and lifetime value: a retailer that wins here spends
// less on acquisition because it keeps and grows the customers it already
// has, and earns more per customer because it knows them well enough to be
// relevant.
//
// The operating reality the pack encodes: most retail loyalty programs are
// large but shallow — high enrolment, low engagement, generous rewards that
// subsidise customers who would have bought anyway, and a customer-data
// platform whose data is rich but rarely turned into a personalized action.
// The function fails when it cannot tell a genuinely incremental, retained,
// high-value customer from a discount-driven one — so it discounts margin it
// did not need to discount, lets valuable customers churn unnoticed, and runs
// the same blanket campaign to a segment of one. The AI archetypes are the
// recurring bets against that reality: next-best-offer and recommendation,
// churn prediction and retention, customer-lifetime-value modelling,
// personalized journeys and messaging, loyalty-program and reward
// optimisation, and segmentation and audience building.
//
// The companion retail packs decide the assortment, the price, the
// replenishment, and the store visit; this pack decides whether the customer
// behind the basket comes back, and is worth more, next time. Its sister
// function store-operations owns the in-store visit; this function owns the
// customer across every visit and channel.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const customerLoyaltyPersonalizationPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'customer_loyalty_personalization',
  functionLabel: 'Customer loyalty & personalization',
  summary:
    'Customer loyalty and personalization is the function that owns the ' +
    'relationship between the retailer and the individual customer over ' +
    'time — the loyalty program and its reward mechanics, and the ' +
    'personalization engine that turns the customer-data platform into a ' +
    'relevant offer, message, and journey. Where merchandising decides what ' +
    'is sold and store operations decides how a visit converts, this ' +
    'function decides who the customer is, why they come back, and how much ' +
    'they are worth over their lifetime. Its economics are repeat purchase, ' +
    'retention, and lifetime value: a retailer that wins here spends less on ' +
    'acquisition and earns more per customer. It fails when it cannot tell a ' +
    'genuinely incremental, retained, high-value customer from a discount-' +
    'driven one — so it discounts margin it need not have, lets valuable ' +
    'customers churn unnoticed, and runs blanket campaigns to a segment of ' +
    'one. The function is judged on the value of the customer base it ' +
    'builds, not on the size of the membership file.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'active_loyalty_membership',
      name: 'Active loyalty membership rate',
      definition:
        'The share of enrolled loyalty members who have transacted or ' +
        'engaged within a defined recent window — the active base, ' +
        'distinct from the total enrolled file which includes dormant ' +
        'accounts.',
      unit: '% of enrolled members active in the window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 65,
        basis:
          'Active share depends on how engaging the program is and how ' +
          'recently members enrolled; the band spans a dormant-heavy file ' +
          'to a vibrant program. A planning range — the active window ' +
          'definition sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The loyalty-platform membership records joined to transaction ' +
        'and engagement activity in the customer-data platform (CDP).',
      whyItMatters:
        'It is the honest size of the program — enrolment counts flatter, ' +
        'but only active members generate value, so the active rate is the ' +
        'first read on whether the loyalty file is an asset or a vanity ' +
        'number.',
    },
    {
      key: 'loyalty_sales_penetration',
      name: 'Loyalty sales penetration',
      definition:
        'The share of total net sales that is identified to a known ' +
        'loyalty member — sales the retailer can attribute to an ' +
        'individual customer rather than to an anonymous transaction.',
      unit: '% of net sales identified to a member',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 80,
        basis:
          'Loyalty penetration varies by segment — grocery and pharmacy ' +
          'run high, occasional and big-ticket retail run lower; the band ' +
          'spans a low-identification operation to a high one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The POS and e-commerce systems, computing identified-member ' +
        'sales as a share of total net sales.',
      whyItMatters:
        'Personalization, churn modelling, and lifetime-value work all ' +
        'depend on knowing who bought — penetration is the coverage of ' +
        'the data foundation, and a low figure caps every downstream use ' +
        'case.',
    },
    {
      key: 'repeat_purchase_rate',
      name: 'Repeat-purchase rate',
      definition:
        'The share of customers who make a second or subsequent purchase ' +
        'within a defined period after their first — the read on whether ' +
        'acquired customers come back at all.',
      unit: '% of customers making a repeat purchase',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 50,
        basis:
          'Repeat rate depends on category purchase frequency and the ' +
          'strength of the relationship; the band spans a one-and-done ' +
          'pattern to a habitual one. A planning range; category frequency ' +
          'sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The CDP, tracking purchase sequences per identified customer ' +
        'over the defined window.',
      whyItMatters:
        'It is the foundational test of loyalty — a customer who never ' +
        'returns has no lifetime value to grow, so the repeat rate is the ' +
        'gate every retention and personalization investment must move ' +
        'first.',
    },
    {
      key: 'customer_lifetime_value',
      name: 'Customer lifetime value (CLV)',
      definition:
        'The projected total net margin a customer will generate over the ' +
        'expected duration of their relationship with the retailer, ' +
        'discounted to a present value.',
      unit: 'projected net margin $ per customer',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 100,
        high: 2000,
        basis:
          'CLV spans an enormous range by segment, category, and basket ' +
          'size; the planning value is set within the retailer’s own ' +
          'customer base and segments, not against a cross-retail figure. ' +
          'A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CDP / analytics environment, modelling purchase history, ' +
        'margin, and projected retention per customer.',
      whyItMatters:
        'CLV is the metric that converts loyalty from a cost centre into ' +
        'an investment case — it tells the retailer how much a customer ' +
        'is worth keeping and growing, and so what a retention or ' +
        'acquisition action can rationally cost.',
    },
    {
      key: 'customer_churn_rate',
      name: 'Customer churn rate',
      definition:
        'The share of previously active customers who lapse — make no ' +
        'identified purchase across a defined inactivity window — over ' +
        'the period.',
      unit: '% of active customers lapsing per period',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 15,
        high: 40,
        basis:
          'Churn depends on category frequency, competition, and ' +
          'relationship strength; the band spans a sticky base to a ' +
          'leaky one. A planning range; the lapse-window definition sets ' +
          'the point.',
        label: 'planning-range',
      },
      dataSource:
        'The CDP, identifying customers whose purchase recency has passed ' +
        'the defined lapse threshold.',
      whyItMatters:
        'Churn is the leak in the customer base — every lapsed customer ' +
        'must be replaced by a more expensive acquired one, so the churn ' +
        'rate is the cost the retention function exists to reduce.',
    },
    {
      key: 'reward_redemption_rate',
      name: 'Reward redemption rate',
      definition:
        'The share of earned loyalty rewards, points, or certificates ' +
        'that members actually redeem before they expire — a read on ' +
        'whether the program’s currency is valued and used.',
      unit: '% of earned rewards redeemed',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 90,
        basis:
          'Redemption depends on reward relevance, ease, and expiry ' +
          'rules; the band spans a program whose currency is ignored to ' +
          'one whose rewards drive a return trip. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loyalty platform, comparing redeemed rewards against rewards ' +
        'earned and issued.',
      whyItMatters:
        'A redeemed reward is a return trip and a re-engaged customer; an ' +
        'unredeemed one is an unfunded liability and a sign the program ' +
        'is not valued — redemption is the read on whether the reward ' +
        'mechanic is doing its job.',
    },
    {
      key: 'personalization_attributed_revenue',
      name: 'Personalization-attributed revenue share',
      definition:
        'The share of net sales attributable, through a defined ' +
        'measurement design, to personalized offers, recommendations, ' +
        'and messaging rather than to non-personalized merchandising and ' +
        'marketing.',
      unit: '% of net sales attributed to personalization',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'Attributed share depends on personalization maturity and the ' +
          'rigour of the measurement design; the band spans an early ' +
          'program to a mature one. A planning range — attribution method ' +
          'sets the point.',
        label: 'planning-range',
      },
      dataSource:
        'The personalization and campaign platforms, measured through ' +
        'controlled holdout and incrementality testing.',
      whyItMatters:
        'It is the proof that personalization is creating value rather ' +
        'than relabelling sales that would have happened — measured ' +
        'against a holdout, it is the function’s honest scorecard.',
    },
    {
      key: 'member_basket_premium',
      name: 'Member vs non-member basket premium',
      definition:
        'The difference in average basket size — spend per transaction — ' +
        'between identified loyalty members and non-members, expressed as ' +
        'the member premium.',
      unit: '% premium in member basket size over non-member',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 10,
        high: 40,
        basis:
          'The member premium reflects both genuine engagement and ' +
          'self-selection of heavier shoppers into the program; the band ' +
          'spans a weak relationship to a strong one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The POS and CDP, comparing average basket size for identified ' +
        'members against non-member transactions.',
      whyItMatters:
        'It is the read on whether membership changes behaviour — a ' +
        'meaningful premium signals the program builds bigger baskets, ' +
        'though it must be checked against self-selection before the lift ' +
        'is claimed as incremental.',
    },
    {
      key: 'segment_coverage_rate',
      name: 'Segment coverage rate',
      definition:
        'The share of the active customer base assigned to a defined, ' +
        'actionable behavioural or value segment — rather than sitting ' +
        'unsegmented or in an undifferentiated default group.',
      unit: '% of active customers in an actionable segment',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 50,
        high: 95,
        basis:
          'Coverage depends on data completeness and the segmentation ' +
          'model; the band spans a thinly segmented base to a fully ' +
          'covered one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The CDP / segmentation engine, computing the share of the active ' +
        'base mapped to a defined segment.',
      whyItMatters:
        'A customer who is not in an actionable segment cannot be ' +
        'personalized to — coverage is the reach of the targeting ' +
        'foundation, and an uncovered base is one that gets the blanket ' +
        'campaign by default.',
    },
    {
      key: 'customer_nps',
      name: 'Customer Net Promoter Score',
      definition:
        'The Net Promoter Score from the customer-relationship survey — ' +
        'the share of promoters less the share of detractors across the ' +
        'identified customer base.',
      unit: 'NPS points (−100 to +100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 25,
        high: 65,
        basis:
          'Customer NPS varies by segment and survey method; the band ' +
          'spans a weak relationship to a strong one on a typical retail ' +
          'NPS scale. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-experience survey platform, scored across the ' +
        'identified customer base and segmented by value tier and ' +
        'lifecycle stage.',
      whyItMatters:
        'It is the relationship’s leading indicator — a falling NPS, ' +
        'especially among high-value customers, predicts the churn and ' +
        'lifetime-value erosion that surface later in the transaction ' +
        'data.',
    },
    {
      key: 'enrollment_to_active_conversion',
      name: 'Enrolment-to-active conversion rate',
      definition:
        'The share of newly enrolled loyalty members who reach a defined ' +
        'active-engagement threshold — a qualifying repeat purchase or ' +
        'first reward earn — within their first defined window.',
      unit: '% of new enrolees becoming active in the window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 25,
        high: 60,
        basis:
          'Conversion depends on the onboarding journey and the early ' +
          'value a member sees; the band spans a sign-up-and-forget ' +
          'program to a well-onboarded one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loyalty platform and CDP, tracking new enrolees against the ' +
        'active-engagement threshold over their first window.',
      whyItMatters:
        'Enrolment is cheap and easy; turning a sign-up into an engaged ' +
        'member is the hard part — this metric exposes whether the ' +
        'program loses new members in the first weeks before any ' +
        'relationship forms.',
    },
    {
      key: 'reward_cost_to_sales_ratio',
      name: 'Reward cost-to-incremental-sales ratio',
      definition:
        'The cost of loyalty rewards, points liability, and member ' +
        'discounts measured against the incremental sales the program ' +
        'can credibly attribute to them — the program’s margin ' +
        'efficiency.',
      unit: 'reward cost $ per $ of attributed incremental sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 0.1,
        high: 0.4,
        basis:
          'The ratio depends on how well rewards are targeted at genuinely ' +
          'incremental behaviour rather than subsidising existing ' +
          'purchases; the band spans an efficient program to a ' +
          'margin-leaking one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loyalty platform for reward and points-liability cost, ' +
        'measured against incrementality-tested attributed sales.',
      whyItMatters:
        'It is the program’s honest cost discipline — a high ratio means ' +
        'rewards are subsidising customers who would have bought anyway, ' +
        'and it is the metric that keeps loyalty from becoming an ' +
        'untracked margin drain.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'enrolled_but_dormant',
      name: 'Enrolled but dormant membership',
      description:
        'The loyalty file is large and growing, but a big share of ' +
        'members enrolled once and never engaged. The program reports ' +
        'membership in the millions while only a fraction transact, and ' +
        'the headline number flatters a base that is mostly dormant.',
      detectionSignal:
        'The active-membership rate is low against total enrolment; ' +
        'enrolment-to-active conversion is poor; a large cohort has not ' +
        'transacted since sign-up.',
      diagnosticQuestion:
        'What share of the enrolled file is genuinely active, and how ' +
        'many members never engage after the sign-up transaction?',
    },
    {
      key: 'discount_subsidy_leakage',
      name: 'Reward and discount subsidy leakage',
      description:
        'Rewards, points, and member discounts are issued broadly and ' +
        'flatly, so a large share of the spend subsidises customers who ' +
        'would have bought at full price anyway. The program costs ' +
        'margin without changing behaviour, and nobody measures the ' +
        'incremental share.',
      detectionSignal:
        'The reward cost-to-incremental-sales ratio is high or ' +
        'unmeasured; rewards are not differentiated by customer value or ' +
        'incrementality; holdout testing is absent.',
      diagnosticQuestion:
        'How much of the reward and discount spend is genuinely ' +
        'incremental, and is incrementality measured against a holdout ' +
        'or simply assumed?',
    },
    {
      key: 'silent_churn',
      name: 'Silent, unnoticed churn',
      description:
        'Valuable customers lapse gradually — a slowing cadence, a ' +
        'shrinking basket — and the retailer notices only long after ' +
        'they are effectively gone. There is no early lapse signal and ' +
        'no proactive intervention, so churn is discovered, not ' +
        'prevented.',
      detectionSignal:
        'Churn is measured only as a lagging count; there is no early ' +
        'lapse-risk score; win-back campaigns fire only after a long ' +
        'inactivity window.',
      diagnosticQuestion:
        'How early is a customer’s lapse risk detected, and is there a ' +
        'proactive intervention before they are effectively lost?',
    },
    {
      key: 'segment_of_one_blindness',
      name: 'Blanket campaigns to a segment of one',
      description:
        'Despite a rich customer-data platform, marketing runs the same ' +
        'campaign and the same offer to broad lists. The data exists but ' +
        'is not turned into a personalized action, so relevance is low, ' +
        'opt-outs rise, and the personalization potential sits unused.',
      detectionSignal:
        'Segment coverage is low; campaigns are list-based rather than ' +
        'triggered and personalized; personalization-attributed revenue ' +
        'is small or untracked.',
      diagnosticQuestion:
        'How much of customer contact is genuinely personalized to the ' +
        'individual, and how much is a blanket campaign to a broad list?',
    },
    {
      key: 'fragmented_customer_identity',
      name: 'Fragmented customer identity across channels',
      description:
        'The same customer appears as separate records across store, ' +
        'e-commerce, app, and service systems with no resolved identity. ' +
        'The retailer cannot see a single customer’s full cross-channel ' +
        'behaviour, so every model and every offer is built on a partial ' +
        'view.',
      detectionSignal:
        'Identity resolution is incomplete; the same customer has ' +
        'multiple unlinked profiles; cross-channel purchase history ' +
        'cannot be assembled per customer.',
      diagnosticQuestion:
        'Is there a single resolved identity per customer across all ' +
        'channels, or do store, online, and app behave as separate ' +
        'customer views?',
    },
    {
      key: 'no_lifetime_value_lens',
      name: 'No lifetime-value lens on the customer base',
      description:
        'The function manages campaigns and rewards on short-term ' +
        'response and last-click revenue, with no model of what a ' +
        'customer is worth over their lifetime. Acquisition and retention ' +
        'spend cannot be rationally sized because the value being ' +
        'protected is unknown.',
      detectionSignal:
        'Customer lifetime value is not modelled or not used; campaign ' +
        'decisions optimise short-term response; high- and low-value ' +
        'customers are treated alike.',
      diagnosticQuestion:
        'Is customer lifetime value modelled and used to size retention ' +
        'and acquisition spend, or are decisions made on short-term ' +
        'response alone?',
    },
    {
      key: 'stale_segmentation',
      name: 'Stale, static segmentation',
      description:
        'Customers are slotted into segments defined once and rarely ' +
        'refreshed — demographic buckets or a years-old RFM cut — that no ' +
        'longer reflect current behaviour. Customers move between real ' +
        'segments while their label stays fixed, and targeting drifts ' +
        'out of date.',
      detectionSignal:
        'Segments are recomputed infrequently; segment definitions are ' +
        'demographic rather than behavioural; customers rarely move ' +
        'segment despite changing behaviour.',
      diagnosticQuestion:
        'How current and behaviour-based is the segmentation, and how ' +
        'often does it refresh against what customers are actually ' +
        'doing now?',
    },
    {
      key: 'channel_message_fatigue',
      name: 'Channel overload and message fatigue',
      description:
        'Customers receive uncoordinated, overlapping messages across ' +
        'email, app, SMS, and direct mail because campaigns are run ' +
        'channel by channel with no contact governance. Frequency rises, ' +
        'relevance falls, and engaged customers opt out.',
      detectionSignal:
        'Email and push opt-out and unsubscribe rates are rising; ' +
        'contact frequency is uncapped across channels; engagement ' +
        'declines with no offsetting relevance gain.',
      diagnosticQuestion:
        'Is customer contact governed for frequency and coordinated ' +
        'across channels, or run campaign by campaign with no shared ' +
        'contact budget?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'next_best_offer_recommendation',
      name: 'Next-best-offer and recommendation',
      valueMechanism:
        'A model scores, for each customer, the offer or product ' +
        'recommendation most likely to be both relevant and incremental — ' +
        'drawing on purchase history, browse signal, and segment ' +
        'affinity — and serves it through the channel the customer ' +
        'engages on. Value comes from lifting basket size, attachment, ' +
        'and repeat purchase by being relevant, while targeting reward ' +
        'spend at behaviour that genuinely changes rather than at ' +
        'subsidising existing purchases.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Customer purchase and transaction history',
        'Browse, search, and engagement signal',
        'Product catalogue, attributes, and affinity data',
        'Offer and reward inventory with cost and margin terms',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends the offer; marketing owns the offer ' +
          'strategy, the margin guardrails, and the brand-appropriateness ' +
          'of what is served.',
        'Recommendations must be incremental, not a discount on a ' +
          'certain purchase — an offer to a customer about to buy anyway ' +
          'is leaked margin.',
        'Personalization must respect consent, sensitive-category, and ' +
          'fairness rules — it cannot infer or act on protected or ' +
          'sensitive attributes.',
      ],
      metricsMoved: [
        'repeat_purchase_rate',
        'member_basket_premium',
        'personalization_attributed_revenue',
        'reward_cost_to_sales_ratio',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'churn_prediction_retention',
      name: 'Churn prediction and retention',
      valueMechanism:
        'A model scores each active customer for the risk of lapsing — ' +
        'from a slowing purchase cadence, a shrinking basket, declining ' +
        'engagement, and service signals — and surfaces the at-risk, ' +
        'high-value customers early enough for a proactive, proportionate ' +
        'retention action. Value comes from preventing the churn of ' +
        'valuable customers before it happens, avoiding the higher cost ' +
        'of re-acquiring them and protecting the lifetime value at stake.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Purchase recency, frequency, and monetary history per customer',
        'Engagement signal across channels',
        'Service-interaction and complaint history',
        'Customer-lifetime-value estimates to prioritise the action',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model surfaces the risk; marketing and CRM own the retention ' +
          'offer and its cost — the score prompts an action, it does not ' +
          'authorise unlimited spend.',
        'Retention spend must be proportionate to the customer’s value — ' +
          'a blanket save-offer to every at-risk customer simply leaks ' +
          'margin in a new form.',
        'The model must be checked for bias so it does not systematically ' +
          'under-serve or over-target any customer group.',
      ],
      metricsMoved: [
        'customer_churn_rate',
        'repeat_purchase_rate',
        'customer_lifetime_value',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'clv_modeling',
      name: 'Customer-lifetime-value modelling',
      valueMechanism:
        'A model projects each customer’s lifetime value — expected ' +
        'future purchases, margin, and retention discounted to a present ' +
        'value — and serves it as the shared lens every loyalty and ' +
        'marketing decision consumes: how much a retention action can ' +
        'cost, which customers to prioritise, and where acquisition ' +
        'spend pays back. Value comes from shifting the function from ' +
        'short-term-response optimisation to managing the customer base ' +
        'as a portfolio of assets with known worth.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Full customer purchase, margin, and tenure history',
        'Retention and churn-rate history by segment',
        'Acquisition cost and channel data',
        'A resolved single customer identity across channels',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model produces a value projection; marketing and finance ' +
          'leaders own the spend decisions built on it — CLV informs the ' +
          'budget, it does not set it.',
        'A CLV projection carries real uncertainty and must be presented ' +
          'as a range with confidence, never a false-precision point ' +
          'figure.',
        'CLV must not become a basis for treating low-value customers ' +
          'unfairly or excluding them from service the brand promises ' +
          'all customers.',
      ],
      metricsMoved: [
        'customer_lifetime_value',
        'customer_churn_rate',
        'reward_cost_to_sales_ratio',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'personalized_journeys_messaging',
      name: 'Personalized journeys and messaging',
      valueMechanism:
        'An orchestration engine assembles a personalized, ' +
        'event-triggered journey for each customer — onboarding a new ' +
        'member, reactivating a lapsing one, following a purchase — ' +
        'choosing the message, channel, and timing per customer within a ' +
        'governed contact budget. Value comes from replacing blanket ' +
        'campaigns with relevant, well-paced contact: higher engagement ' +
        'and conversion, and lower fatigue and opt-out.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'A resolved customer profile with segment and lifecycle stage',
        'Behavioural and lifecycle trigger events',
        'Channel engagement and preference data',
        'Content and offer inventory mapped to journeys',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The engine orchestrates the journey; CRM owns the journey ' +
          'design, the contact-frequency governance, and the brand voice.',
        'Contact governance is a hard constraint — the engine must ' +
          'respect a shared cross-channel frequency cap and never ' +
          'over-message a customer to hit a campaign target.',
        'Triggered messaging must honour consent and channel preference ' +
          'and degrade gracefully when profile data is thin, not guess.',
      ],
      metricsMoved: [
        'enrollment_to_active_conversion',
        'active_loyalty_membership',
        'customer_nps',
        'repeat_purchase_rate',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'loyalty_reward_optimization',
      name: 'Loyalty-program and reward optimisation',
      valueMechanism:
        'A model analyses how reward mechanics, tiers, and earn-and-burn ' +
        'rules drive — or fail to drive — incremental behaviour, and ' +
        'recommends the reward structure and the targeted offers that ' +
        'change behaviour at the lowest margin cost. Value comes from ' +
        'cutting the subsidy leaked to customers who would have bought ' +
        'anyway and redirecting that spend to rewards that genuinely ' +
        'lift retention and basket size.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Reward earn, redemption, and points-liability data',
        'Incrementality-test and holdout results',
        'Customer value and segment data',
        'Program cost and margin terms',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model recommends reward structures and targeting; loyalty ' +
          'leadership owns the program design and the member-fairness ' +
          'and brand implications.',
        'Reward changes must be tested for incrementality against a ' +
          'holdout before scaling — a modelled saving that is not ' +
          'incrementality-proven is not a saving.',
        'Optimisation must not erode the program’s perceived fairness or ' +
          'value to existing members — a margin gain that breaks member ' +
          'trust is a loss.',
      ],
      metricsMoved: [
        'reward_redemption_rate',
        'reward_cost_to_sales_ratio',
        'repeat_purchase_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'segmentation_audience_building',
      name: 'Segmentation and audience building',
      valueMechanism:
        'A model clusters the customer base into behavioural and ' +
        'value-based segments from purchase, engagement, and lifecycle ' +
        'data, keeps the segments current as behaviour shifts, and lets ' +
        'marketers assemble precise, governed audiences for any campaign ' +
        'or journey. Value comes from raising segment coverage and ' +
        'targeting precision — so contact is relevant and measurable ' +
        'rather than a blanket list.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Customer purchase, engagement, and lifecycle data',
        'A resolved single customer identity',
        'Product and category affinity data',
        'Channel and consent data for audience activation',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes and maintains segments; marketing owns the ' +
          'segment strategy and how each audience is used.',
        'Segments and audiences must not be built on protected or ' +
          'sensitive attributes, and must respect consent and ' +
          'data-use scope for every activation channel.',
        'A segment is only useful if it is actionable and current — ' +
          'segment definitions must be refreshed, not frozen once.',
      ],
      metricsMoved: [
        'segment_coverage_rate',
        'personalization_attributed_revenue',
        'repeat_purchase_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'unified_customer_identity_layer',
      name: 'Unified customer-identity layer',
      description:
        'A pattern that resolves the same customer’s store, e-commerce, ' +
        'app, and service records into a single governed identity and ' +
        'profile in the customer-data platform — so every model, segment, ' +
        'and offer is built on one complete cross-channel view rather ' +
        'than a fragment.',
      boundary:
        'It resolves identity and assembles the profile; it does not ' +
        'decide offers or campaigns. It is the data foundation the ' +
        'personalization layers consume, governed for consent and ' +
        'data-use scope.',
      humanAccountabilityPoint:
        'The customer-data / CRM platform owner accountable for identity ' +
        'integrity and data governance.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'lifetime_value_decision_lens',
      name: 'Lifetime-value decision lens',
      description:
        'A pattern that computes and serves a customer-lifetime-value ' +
        'projection as the shared lens for every loyalty and marketing ' +
        'decision — how much a retention action can cost, which ' +
        'customers to prioritise, where acquisition pays back — replacing ' +
        'short-term-response optimisation with portfolio thinking.',
      boundary:
        'It projects value and informs the decision; marketing and ' +
        'finance own the spend. CLV is presented as a range and never ' +
        'used to treat customers unfairly.',
      humanAccountabilityPoint:
        'The VP of customer / CRM accountable for the value of the ' +
        'customer base and the marketing investment.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'churn_early_warning_pattern',
      name: 'Churn early-warning pattern',
      description:
        'A pattern that scores active customers continuously for lapse ' +
        'risk, weights the risk by lifetime value, and feeds a ' +
        'prioritised, proportionate retention queue — so a valuable ' +
        'customer’s slowing cadence triggers a proactive action well ' +
        'before they are effectively gone.',
      boundary:
        'It scores risk and prioritises the action; marketing and CRM ' +
        'own the retention offer and its cost, kept proportionate to ' +
        'customer value. It does not authorise unbounded save-spend.',
      humanAccountabilityPoint:
        'The retention / CRM lead accountable for customer churn and the ' +
        'retention budget.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'governed_personalization_orchestration',
      name: 'Governed personalization-orchestration pattern',
      description:
        'A pattern that orchestrates personalized, event-triggered ' +
        'journeys across every channel from one engine — choosing ' +
        'message, channel, and timing per customer inside a shared ' +
        'contact-frequency budget and a consent and brand-governance ' +
        'frame — replacing uncoordinated channel-by-channel campaigns.',
      boundary:
        'It orchestrates contact within governance; CRM owns the journey ' +
        'design and the contact budget. The shared frequency cap and ' +
        'consent rules are hard constraints the engine cannot override.',
      humanAccountabilityPoint:
        'The head of CRM / lifecycle marketing accountable for customer ' +
        'contact, relevance, and the contact budget.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'incrementality_tested_reward_loop',
      name: 'Incrementality-tested reward loop',
      description:
        'A pattern that designs every reward mechanic and targeted offer ' +
        'with a built-in holdout, measures the genuinely incremental ' +
        'lift before scaling, and feeds the result back into the program ' +
        'and offer design — closing the loop so reward spend is ' +
        'continuously redirected toward behaviour that actually changes.',
      boundary:
        'It tests, measures, and recommends; loyalty leadership owns the ' +
        'program design and the member-fairness implications. A reward ' +
        'change scales only on incrementality-proven evidence.',
      humanAccountabilityPoint:
        'The loyalty-program director accountable for program economics ' +
        'and member trust.',
      controlPosture: 'human-in-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Customer-loyalty-and-personalization value is realised in three ' +
      'connected ways and a forecast must keep them distinct. First, ' +
      'retained revenue: predicting and preventing the churn of valuable ' +
      'customers keeps revenue the retailer would otherwise have lost and ' +
      'had to re-acquire at a higher cost — a recurring gain that ' +
      'compounds as the base stabilises. Second, grown revenue per ' +
      'customer: relevant next-best-offer, personalized journeys, and ' +
      'sharper segmentation lift repeat purchase and basket size among ' +
      'customers the retailer already has — recurring revenue at little ' +
      'added acquisition cost. Third, recovered margin: targeting reward ' +
      'and discount spend at genuinely incremental behaviour, proven ' +
      'against a holdout, cuts the subsidy leaked to customers who would ' +
      'have bought anyway. The dominant constraint is that all three rest ' +
      'on a measurement honesty most programs lack — without a controlled ' +
      'holdout it is impossible to separate genuine incremental value ' +
      'from sales that would have happened, so a forecast must be read ' +
      'against the retailer’s data and measurement maturity, not a ' +
      'last-click attribution. All three levers are recurring once ' +
      'realised, but they prove out only as slowly as a customer ' +
      'purchase cycle and a clean incrementality test allow.',
    dominantHaircutFactors: [
      {
        factor: 'Customer-data and identity readiness',
        rationale:
          'Every personalization, churn, and CLV model rests on a ' +
          'resolved single customer identity and complete cross-channel ' +
          'history. Where identity is fragmented, loyalty penetration is ' +
          'low, and CDP data is thin, the models see only a fragment — ' +
          'and that caps how much of the modelled value is reachable.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled loyalty-and-personalization gain ' +
            'not reachable because of fragmented identity and incomplete ' +
            'customer data; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Attribution and incrementality rigour',
        rationale:
          'The value depends on separating genuine incremental lift from ' +
          'sales that would have happened anyway. Without controlled ' +
          'holdouts, a program credits itself with non-incremental ' +
          'revenue — so weak measurement discipline both overstates the ' +
          'forecast and erodes the real gain.',
        typicalHaircut: {
          low: 0.2,
          high: 0.4,
          basis:
            'Value erosion and overstatement risk from weak ' +
            'incrementality measurement; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Channel reach and consent',
        rationale:
          'Personalized offers and journeys only create value if they ' +
          'reach the customer on a consented channel. Limited consented ' +
          'reach, deliverability decay, and rising opt-out bound how much ' +
          'of the modelled engagement gain can actually be delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from limited consented channel reach and ' +
            'declining deliverability; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Competitive and category-frequency limits',
        rationale:
          'Loyalty and repeat purchase are bounded by how often the ' +
          'category is bought and by competitors courting the same ' +
          'customer. A retailer cannot lift repeat purchase past the ' +
          'natural category cadence, so the modelled retention gain has ' +
          'a structural ceiling.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled retention gain bounded by category ' +
            'purchase frequency and competitive pressure; a planning ' +
            'range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Customer-churn-rate reduction',
        range: {
          low: 5,
          high: 20,
          basis:
            'Relative reduction in the customer churn rate from early ' +
            'lapse prediction and proactive retention; a planning range ' +
            'spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in the customer churn rate.',
      },
      {
        lever: 'Repeat-purchase and revenue-per-customer uplift',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative uplift in revenue per active customer from ' +
            'personalization, recommendation, and sharper segmentation; ' +
            'a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in net revenue per active customer.',
      },
      {
        lever: 'Reward and discount-margin recovery',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in non-incremental reward and discount ' +
            'spend from incrementality-tested targeting; a planning ' +
            'range — recovered margin, not a headline reward cut.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in reward and discount cost not ' +
          'attributable to incremental sales.',
      },
      {
        lever: 'Personalization-attributed revenue share gain',
        range: {
          low: 2,
          high: 10,
          basis:
            'Percentage-point increase in the share of net sales ' +
            'attributable, against a holdout, to personalization; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in holdout-measured personalization-' +
          'attributed sales as a share of net sales.',
      },
    ],
    timeToValueBand:
      '3–6 months to a first measured signal on a pilot segment ' +
      '(engagement, conversion on a personalized journey, a clean ' +
      'holdout read); 12–24 months to a settled result on churn and ' +
      'lifetime value, because retention and CLV gains compound only as ' +
      'fast as a full customer purchase-and-lapse cycle runs and an ' +
      'incrementality test can confirm them.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Customer-data platform (CDP)',
        role:
          'The system of record for the unified customer — resolved ' +
          'identity, the cross-channel profile, segments, and the ' +
          'behavioural history every model and audience is built on.',
        examples: [
          'Adobe Real-Time CDP',
          'Salesforce Data Cloud',
          'Segment (Twilio)',
          'Treasure Data CDP',
        ],
      },
      {
        name: 'Loyalty-program platform',
        role:
          'Runs the loyalty program — membership, tiers, the earn-and-' +
          'burn reward mechanics, points liability, and redemption. The ' +
          'source of every membership and reward metric.',
        examples: [
          'SAP Emarsys loyalty',
          'Talon.One',
          'Antavo loyalty management',
          'in-house loyalty engines',
        ],
      },
      {
        name: 'Marketing-automation and campaign-orchestration system',
        role:
          'Designs, triggers, and orchestrates campaigns and lifecycle ' +
          'journeys across channels — the layer that turns a segment and ' +
          'an offer into a sent message.',
        examples: [
          'Salesforce Marketing Cloud',
          'Braze',
          'Adobe Journey Optimizer',
          'Iterable',
        ],
      },
      {
        name: 'Personalization and recommendation engine',
        role:
          'Scores and serves personalized offers, product ' +
          'recommendations, and content per customer across web, app, ' +
          'and messaging surfaces.',
        examples: [
          'Dynamic Yield',
          'Bloomreach',
          'Algolia recommend',
          'in-house recommendation models',
        ],
      },
      {
        name: 'POS, e-commerce, and analytics environment',
        role:
          'Capture the transactions — store and digital — and the ' +
          'analytics environment where churn, CLV, and incrementality ' +
          'models are built and measured.',
        examples: [
          'POS and order-management systems',
          'e-commerce platforms',
          'cloud data-warehouse and analytics environments',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Marketing Officer / Chief Customer Officer',
        accountability:
          'Owns the total customer strategy, the loyalty and ' +
          'personalization investment, and the value of the customer ' +
          'base.',
      },
      {
        title: 'VP of Loyalty / loyalty-program director',
        accountability:
          'Owns the loyalty program — its design, the reward economics, ' +
          'membership growth and engagement, and member trust.',
      },
      {
        title: 'Head of CRM / lifecycle marketing',
        accountability:
          'Owns the customer lifecycle — onboarding, retention, ' +
          'win-back — the journeys, and the contact governance across ' +
          'channels.',
      },
      {
        title: 'Director of personalization',
        accountability:
          'Owns the personalization and recommendation strategy, the ' +
          'next-best-offer logic, and personalization-attributed ' +
          'revenue.',
      },
      {
        title: 'Customer-analytics / data-science lead',
        accountability:
          'Owns the churn, lifetime-value, and segmentation models and ' +
          'the incrementality-measurement discipline.',
      },
      {
        title: 'Customer-data-platform / martech owner',
        accountability:
          'Owns identity resolution, the CDP, and the data governance ' +
          'and consent management the function runs on.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Consumer-privacy and data-protection law',
        relevance:
          'GDPR, CCPA / CPRA and equivalent regimes govern how customer ' +
          'data is collected, used, shared, and retained — the frame ' +
          'every profile, model, and activation operates inside.',
      },
      {
        name: 'Consent, marketing-communication, and anti-spam rules',
        relevance:
          'CAN-SPAM, TCPA, and email and SMS consent rules govern who ' +
          'may be messaged, on which channel, and how opt-out must be ' +
          'honoured — a hard constraint on personalized contact.',
      },
      {
        name: 'Loyalty-program terms and consumer-protection rules',
        relevance:
          'Points expiry, reward terms, and program-change notice are ' +
          'governed by consumer-protection and unclaimed-property rules — ' +
          'the frame around reward mechanics and points liability.',
      },
      {
        name: 'Anti-discrimination and fair-treatment rules',
        relevance:
          'Personalization, pricing offers, and segmentation must not ' +
          'use protected attributes or produce discriminatory treatment ' +
          '— the fairness frame on every targeting model.',
      },
      {
        name: 'Automated-decision and AI-governance expectations',
        relevance:
          'Emerging automated-decision-making and AI-transparency rules ' +
          'shape how churn and value scores may be used and how their ' +
          'use is disclosed and governed.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Customer lifetime value (CLV)',
        definition:
          'The projected total net margin a customer generates over the ' +
          'expected life of their relationship with the retailer, ' +
          'discounted to a present value.',
      },
      {
        term: 'Churn',
        definition:
          'The lapse of a previously active customer — no identified ' +
          'purchase across a defined inactivity window.',
      },
      {
        term: 'RFM',
        definition:
          'Recency, frequency, and monetary value — the classic ' +
          'behavioural basis for scoring and segmenting customers.',
      },
      {
        term: 'Next-best-offer (NBO)',
        definition:
          'The offer or recommendation a model identifies as most ' +
          'relevant and incremental for an individual customer at a ' +
          'point in time.',
      },
      {
        term: 'Customer-data platform (CDP)',
        definition:
          'The system that resolves customer identity and assembles a ' +
          'unified, governed customer profile from every channel.',
      },
      {
        term: 'Incrementality',
        definition:
          'The lift genuinely caused by an offer or campaign — measured ' +
          'against a holdout — as distinct from sales that would have ' +
          'happened anyway.',
      },
      {
        term: 'Earn-and-burn',
        definition:
          'The core loyalty mechanic — members earn points or rewards on ' +
          'spend and burn (redeem) them for value on a later trip.',
      },
      {
        term: 'Holdout group',
        definition:
          'A randomly withheld set of customers excluded from a ' +
          'treatment so its incremental effect can be measured against ' +
          'them.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Customer-Loyalty-and-Personalization Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the loyalty and personalization function is ' +
        'leaking margin and losing customers — dormant membership, ' +
        'subsidy leakage, silent churn, blanket campaigns — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Customer and program context',
          guidance:
            'Name the customer base and the loyalty program in scope — ' +
            'membership size, the reward mechanics and tiers, the ' +
            'channels, and the marketing operating model. State which ' +
            'CDP, loyalty, marketing-automation, and personalization ' +
            'systems are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — active membership, loyalty penetration, ' +
            'repeat purchase, CLV, churn, redemption, personalization-' +
            'attributed revenue, member basket premium, segment coverage, ' +
            'customer NPS, enrolment-to-active conversion, reward cost-to-' +
            'sales ratio. For any metric not recorded, name it as a ' +
            'precise seed gap with its expected data source.',
        },
        {
          heading: 'Customer-data and identity diagnostic',
          guidance:
            'Assess identity resolution, loyalty penetration, and CDP ' +
            'data completeness — whether a single resolved customer view ' +
            'exists across channels — and how that foundation limits the ' +
            'downstream use cases.',
        },
        {
          heading: 'Loyalty economics and churn diagnostic',
          guidance:
            'Analyse where reward and discount spend is going and how ' +
            'much is incremental, where valuable customers are lapsing ' +
            'unnoticed, and how lifetime value is — or is not — used to ' +
            'size retention spend.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — enrolled-but-dormant ' +
            'membership, reward-subsidy leakage, silent churn, blanket ' +
            'campaigns, fragmented identity, no lifetime-value lens, ' +
            'stale segmentation, channel fatigue — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — retained revenue, grown revenue per ' +
            'customer, recovered reward margin — explicitly haircut by ' +
            'data and identity readiness, incrementality rigour, channel ' +
            'reach, and category-frequency limits. Every figure a ' +
            'labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'incrementality-tested attribution, a resolved identity — is ' +
            'a named ask, not a vague unknown.',
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
      label: 'Customer-Loyalty-and-Personalization Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a loyalty and ' +
        'personalization AI Move on this customer base — baseline, ' +
        'forecast, cost, and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring retained revenue, grown revenue per customer, and ' +
            'recovered reward margin, the time-to-value band, and the ' +
            'go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — churn rate, repeat purchase, CLV, reward cost-to-' +
            'sales ratio, personalization-attributed revenue. Where a ' +
            'baseline is a seed gap (incrementality-tested attribution is ' +
            'a common one), say so and state what closing it requires ' +
            'before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — data and identity ' +
            'readiness, incrementality rigour, channel reach, category-' +
            'frequency limits — explicitly and show the haircut math. Be ' +
            'honest that without a holdout the value cannot be proven.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the CDP, loyalty, ' +
            'marketing-automation, and personalization systems, and the ' +
            'operating-model change — the CRM, loyalty, and analytics ' +
            'workflow.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under fragmented customer data, ' +
            'weak incrementality measurement, and limited consented ' +
            'reach. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example customer identity too fragmented to ' +
            'model, or no capability to run a controlled holdout — and ' +
            'the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, the holdout and incrementality design, ' +
            'and the measurement cadence, including the lagged churn and ' +
            'CLV metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Customer-Loyalty-and-Personalization Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'loyalty and personalization AI capability, grounded in the ' +
        'function reference patterns, the privacy frame, and the ' +
        'incrementality discipline.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — unified customer-identity layer, lifetime-value ' +
            'decision lens, churn early-warning, governed personalization ' +
            'orchestration, incrementality-tested reward loop — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Data, identity, and integration architecture',
          guidance:
            'Specify the CDP, loyalty, marketing-automation, ' +
            'personalization, POS, and e-commerce integrations, the ' +
            'identity-resolution approach, data freshness, and the ' +
            'consent and data-governance discipline the use cases depend ' +
            'on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'incrementality-test design. Define the contact-frequency cap ' +
            'and consent rules as hard constraints and the proportionate-' +
            'spend rule for retention.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the CRM, loyalty, personalization, and analytics ' +
            'workflows change, how campaigns shift from list-based to ' +
            'triggered and personalized, and who owns each change.',
        },
        {
          heading: 'Responsible-AI, privacy, and fairness controls',
          guidance:
            'State the privacy and consent governance, the prohibition ' +
            'on protected and sensitive attributes in targeting, the ' +
            'bias checks on churn and value models, the fair-treatment ' +
            'controls, and the regulatory frames (privacy law, consent ' +
            'and anti-spam rules, loyalty-program terms, automated-' +
            'decision expectations) that bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'martech and customer-data stack, and the phased rollout by ' +
            'use case and customer segment.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Customer-Loyalty-and-Personalization Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the loyalty and personalization ' +
        'AI capability so value reaches retention, revenue per customer, ' +
        'and reward margin, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — identity and data validation, a ' +
            'pilot customer segment with a holdout, CRM and loyalty-team ' +
            'onboarding, scale across segments and use cases — with ' +
            'milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, identity and consent readiness, CRM and ' +
            'loyalty-team adoption, the incrementality-measurement ' +
            'design, Tower measurement.',
        },
        {
          heading: 'CRM and loyalty-team adoption approach',
          guidance:
            'Define the change runway for the CRM, loyalty, and ' +
            'analytics teams — training, the shift to triggered ' +
            'personalized journeys, the incrementality-test discipline — ' +
            'and how adoption is measured, not assumed.',
        },
        {
          heading: 'Measurement and incrementality plan',
          guidance:
            'Define the holdout design, the attribution method, and how ' +
            'genuine incremental value is separated from non-incremental ' +
            'sales — the discipline that keeps the value claim honest.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, the holdout design, ' +
            'and the cadence for each metric, including the lagged churn ' +
            'and CLV metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — fragmented customer data, weak ' +
            'incrementality measurement, limited consented reach, ' +
            'channel fatigue, privacy and fairness exposure — with the ' +
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
      claim: 'The active size and engagement of the loyalty program',
      authoritativeSource:
        'The loyalty-platform membership records joined to transaction ' +
        'and engagement activity in the CDP.',
      whatGoodEvidenceLooksLike:
        'An active-membership rate computed against a defined recent ' +
        'window, with the dormant cohort separated from the active base ' +
        'and enrolment-to-active conversion tracked.',
      weakEvidenceToReject:
        'A headline total-enrolment figure presented as program size, ' +
        'with no active-window definition and no separation of the ' +
        'dormant file.',
    },
    {
      claim: 'Churn and the value of the customers at risk',
      authoritativeSource:
        'The CDP, identifying customers whose purchase recency has ' +
        'passed the defined lapse threshold, weighted by modelled ' +
        'lifetime value.',
      whatGoodEvidenceLooksLike:
        'A churn rate computed on a consistent lapse-window basis, with ' +
        'the at-risk base weighted by lifetime value so the revenue at ' +
        'stake — not just the customer count — is visible.',
      weakEvidenceToReject:
        'A lagging churn count with no lapse-window definition, or an ' +
        'at-risk figure with no view of the lifetime value being lost.',
    },
    {
      claim: 'That personalization and rewards create incremental value',
      authoritativeSource:
        'Controlled holdout and incrementality tests run through the ' +
        'personalization and campaign platforms.',
      whatGoodEvidenceLooksLike:
        'A measured incremental lift against a randomly withheld holdout ' +
        'group, with the attribution method stated, so the value claimed ' +
        'is the value genuinely caused.',
      weakEvidenceToReject:
        'A last-click or last-touch attribution figure presented as ' +
        'incremental value, or a reward-driven sales number with no ' +
        'holdout behind it.',
    },
    {
      claim: 'Reward economics — the cost against incremental sales',
      authoritativeSource:
        'The loyalty platform for reward and points-liability cost, ' +
        'measured against incrementality-tested attributed sales.',
      whatGoodEvidenceLooksLike:
        'A reward cost-to-incremental-sales ratio with the points ' +
        'liability accounted, the subsidy to non-incremental purchases ' +
        'isolated, and the avoidable share quantified.',
      weakEvidenceToReject:
        'A gross reward-spend figure with no link to incremental sales, ' +
        'or a program-cost number that ignores unredeemed points ' +
        'liability.',
    },
    {
      claim: 'The forecast value of a loyalty-and-personalization AI Move',
      authoritativeSource:
        'The value model — retained-revenue, grown-revenue-per-customer, ' +
        'and recovered-reward-margin components, each haircut by its ' +
        'dominant factors — read against the retailer’s data and ' +
        'measurement maturity.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the gains kept distinct, validated ' +
        'against a holdout, and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point revenue number, a vendor ROI claim taken at face ' +
        'value, or a forecast built on last-click attribution with no ' +
        'incrementality or data-readiness haircut.',
    },
  ],
};
