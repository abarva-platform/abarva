// Consilium expert — Customer Loyalty, Personalization & First-Party Data.
//
// Cross-cutting (retail / consumer) ExpertPack. Domain: the crown-jewel
// customer-relationship capability of a modern specialty or mass retailer —
// the loyalty program (membership growth, % of sales through the program,
// tier mix, earn/burn, redemption, breakage and the points liability),
// personalization and recommendation/decisioning (next-best-offer, search and
// merchandising personalization, A/B and holdout testing), first-party and
// zero-party data and the CDP (progressive profiling, identity resolution,
// consent and permission, data clean rooms), and CRM lifecycle (churn and
// propensity scoring, retention, win-back, AOV/frequency lift, CLV).
//
// Crown-jewel framing: for a retailer like Ulta Beauty, the loyalty program
// (Ultamate Rewards — on the order of ~44M members with the large majority of
// sales transacting through it) is the company's most valuable asset because
// it converts anonymous traffic into an identified, addressable, repeat-buying
// base. The honesty posture baked into the content: personalization ROI is
// REAL but routinely OVER-CLAIMED — uplift is incremental, not absolute, and
// attribution is genuinely hard, so claims without a holdout are attributed,
// not measured; most "AI personalization" in production is still rules and
// segments, not models; loyalty breakage is BOTH a margin lever AND a
// liability/regulatory exposure, not free money; consent and privacy are a
// HARD CONSTRAINT framed the way a CTO frames it (transparency + explicit
// permission as a precondition, not an afterthought); and a points program is
// NOT a relationship — discounting that buys nothing incremental destroys
// margin while looking like engagement.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const customerLoyaltyPersonalizationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.customer-loyalty-personalization",
    expertName: "Customer Loyalty, Personalization & First-Party Data Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "customer-loyalty-personalization",
    scopeNote:
      "The retail/consumer customer-relationship engine: the loyalty program " +
      "(membership growth, share of sales through the program, tier mix, " +
      "earn/burn, redemption, breakage and the points liability), personalization " +
      "and recommendation/decisioning (next-best-offer, segmentation, search and " +
      "merchandising personalization, A/B and holdout testing), first-party and " +
      "zero-party data and the CDP (progressive profiling, identity resolution, " +
      "consent/permission, data clean rooms), and CRM lifecycle (churn and " +
      "propensity scoring, retention, win-back, AOV/frequency lift, CLV). Honest " +
      "that personalization ROI is incremental and hard to attribute, that most " +
      "production 'AI personalization' is still rules and segments, that breakage " +
      "is both a margin lever and a liability/regulatory exposure, that consent is " +
      "a hard constraint, and that a points program is not a relationship. " +
      "Distinct from airline frequent-flyer loyalty (miles, network, elite tiers, " +
      "co-brand-dominated economics → Airline Loyalty & Customer Experience), from " +
      "brand/campaign/media work (→ Marketing & Brand), from B2B revenue " +
      "operations (→ Sales & Revenue Operations), and from service/contact-center " +
      "(→ Contact Center & CX) — this is retail/consumer loyalty + personalization " +
      "+ first-party data.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "sales_through_loyalty_pct",
        name: "Sales penetration through the loyalty program",
        definition:
          "Share of total retail sales transacted on an identified loyalty " +
          "member account (vs anonymous/guest checkout) — the single measure of " +
          "how much of the business is addressable.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Specialty/beauty and grocery loyalty disclosures; best-in-class " +
            "specialty programs (e.g. beauty) run toward the top of the range " +
            "while broad mass-merchant programs sit lower — highly category-dependent",
          label: "planning-range",
        },
        dataSource:
          "POS / e-commerce order data tagged to a loyalty account divided by total " +
          "net sales, from the order-management and loyalty systems",
        whyItMatters:
          "It is the precondition for everything else: a sale you cannot identify " +
          "to a member cannot be personalized, retained, or measured. A high " +
          "penetration is what makes the loyalty program a crown-jewel asset rather " +
          "than a discount scheme.",
      },
      {
        key: "active_member_rate",
        name: "Active member rate",
        definition:
          "Share of enrolled members with at least one qualifying purchase or " +
          "engagement in a trailing 12 months — the real, addressable base behind " +
          "the headline enrollment number.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 35,
          high: 65,
          basis:
            "Retail loyalty operator experience; large enrolled bases carry a long " +
            "dormant tail, so active share sits well below total membership",
          label: "planning-range",
        },
        dataSource:
          "Members with qualifying activity in trailing 12 months divided by total " +
          "enrolled, from the loyalty platform",
        whyItMatters:
          "Total membership is a vanity number; active members are the base that " +
          "actually generates revenue and responds to personalization. The dormant " +
          "tail both inflates enrollment optics and is the prime win-back target.",
      },
      {
        key: "member_aov_uplift",
        name: "Member vs non-member AOV uplift",
        definition:
          "Relative difference in average order value between identified members " +
          "and anonymous/guest shoppers (or member vs the pre-enrollment baseline).",
        unit: "% (relative uplift)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Retail loyalty studies and program operator experience; sensitive to " +
            "self-selection (members are already higher-value) so the raw gap " +
            "overstates the causal effect",
          label: "planning-range",
        },
        dataSource:
          "Order data segmented by member status in the analytics/CRM platform, " +
          "compared against a non-member or pre-enrollment baseline",
        whyItMatters:
          "It is the headline 'loyalty works' number — but it is the one most " +
          "distorted by selection bias, because higher-value shoppers join programs. " +
          "Read as correlation unless isolated against a matched control.",
      },
      {
        key: "repeat_purchase_rate",
        name: "Repeat / repurchase rate",
        definition:
          "Share of members who make a second (or subsequent) purchase within a " +
          "defined window — the core measure of whether the program drives return " +
          "behavior.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 60,
          basis:
            "Retail cohort-retention benchmarks; varies sharply by category " +
            "purchase frequency (consumables/beauty repeat far more than durables)",
          label: "planning-range",
        },
        dataSource:
          "Cohort repeat-purchase tracking in the analytics platform, by enrollment " +
          "and acquisition cohort",
        whyItMatters:
          "Repeat behavior is the engine of CLV and the honest test of relationship " +
          "depth; a program can grow enrollment while repeat rate stalls, which " +
          "signals the points are buying transactions, not loyalty.",
      },
      {
        key: "personalization_attributed_revenue_pct",
        name: "Personalization-attributed revenue share",
        definition:
          "Share of revenue attributed to personalized surfaces (recommendations, " +
          "targeted offers, personalized search/merch) — explicitly an attribution " +
          "number, not a measured-incremental one unless holdout-isolated.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Recommendation/personalization vendor and retailer disclosures; the " +
            "wide spread reflects attribution methodology more than true incremental " +
            "lift — a planning range to be read with suspicion",
          label: "planning-range",
        },
        dataSource:
          "Attribution/measurement in the personalization platform and web/app " +
          "analytics, ideally reconciled to holdout-measured incrementality",
        whyItMatters:
          "It is the metric most over-claimed in retail: attributed revenue counts " +
          "purchases that would have happened anyway. It matters as a directional " +
          "signal but is honest only when paired with holdout incrementality.",
      },
      {
        key: "recommendation_conversion_rate",
        name: "Recommendation conversion rate",
        definition:
          "Share of recommendation/next-best-offer impressions that result in the " +
          "intended action (add-to-cart, purchase, offer redemption).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 15,
          basis:
            "Recommendation-engine operator experience; well-targeted on-site " +
            "recommendations convert at the high end, broad email/blast at the low end",
          label: "planning-range",
        },
        dataSource:
          "Recommendation/decisioning engine event tracking joined to the order and " +
          "member record",
        whyItMatters:
          "Conversion is the concrete, honest measure of whether a recommendation " +
          "surface works; it guards against vanity click/engagement metrics and is " +
          "the direct lever on incremental basket and AOV.",
      },
      {
        key: "churn_lapse_rate",
        name: "Churn / lapse rate",
        definition:
          "Share of previously-active members who lapse (no qualifying activity) " +
          "over a defined window — the leak the retention engine must counter.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 40,
          basis:
            "Retail cohort-lapse benchmarks; non-contractual retail churn is gradual " +
            "and definition-sensitive (what counts as 'lapsed' drives the number)",
          label: "planning-range",
        },
        dataSource:
          "Cohort lapse tracking in the analytics/CRM platform against a defined " +
          "active-window threshold",
        whyItMatters:
          "Retail churn is silent — there is no cancellation event — so a defined, " +
          "consistent lapse threshold is what makes win-back targetable; small " +
          "reductions on high-value cohorts compound into large CLV gains.",
      },
      {
        key: "customer_lifetime_value",
        name: "Customer lifetime value (CLV)",
        definition:
          "Modeled net present value of the margin a member generates across " +
          "expected tenure — the right denominator for acquisition and retention " +
          "spend.",
        unit: "USD per member",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 150,
          high: 2500,
          basis:
            "Internal CLV models; spans an enormous range from infrequent leisure " +
            "buyers to high-frequency category devotees — highly mix-dependent and " +
            "assumption-sensitive (discount rate, horizon, margin)",
          label: "planning-range",
        },
        dataSource:
          "CLV model joining purchase margin, frequency, and tenure by cohort in the " +
          "analytics/CRM platform",
        whyItMatters:
          "CLV reveals that a small top decile is worth multiples of the average " +
          "member and should anchor retention spend; but it is a model output, " +
          "sensitive to discount-rate, horizon, and attribution assumptions, so it " +
          "is a planning estimate, not a fact.",
      },
      {
        key: "points_redemption_rate",
        name: "Points redemption rate",
        definition:
          "Share of points/rewards issued in a period that are redeemed within a " +
          "comparable window — the member-value side of the earn/burn promise.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 55,
          high: 85,
          basis:
            "Retail loyalty disclosures; high redemption signals an engaged but more " +
            "expensive program, low signals breakage upside but disengagement risk — " +
            "a balance, not a maximize",
          label: "planning-range",
        },
        dataSource:
          "Points redeemed vs issued from the loyalty ledger over a trailing period",
        whyItMatters:
          "Redemption is where members feel the program's value; too low erodes the " +
          "earn/burn promise and engagement (and inflates a fragile breakage estimate), " +
          "too high raises reward cost — hence in-range, not simply higher-is-better.",
      },
      {
        key: "breakage_rate",
        name: "Breakage rate",
        definition:
          "Estimated share of issued points/rewards expected never to be redeemed " +
          "(expired or abandoned) — recognized to margin because the obligation lapses.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 10,
          high: 30,
          basis:
            "Loyalty accounting disclosures and program design; depends on expiry " +
            "policy, engagement, and estimation method — a judgemental range, not a " +
            "market constant",
          label: "planning-range",
        },
        dataSource:
          "Historical redemption/expiry behavior modeled in the loyalty accounting " +
          "estimate, reviewed with the external auditor",
        whyItMatters:
          "Breakage is pure-margin and a real lever, but it is an ESTIMATE and a " +
          "liability/regulatory exposure: too-high breakage overstates margin and " +
          "risks restatement or gift-card/escheatment-style scrutiny; too-low " +
          "understates the program — it belongs in-range under audit, not maximized.",
      },
      {
        key: "consent_opt_in_rate",
        name: "Consent / marketing opt-in rate",
        definition:
          "Share of members who have granted explicit, current permission for " +
          "marketing and personalization use of their data, by channel — the legal " +
          "and ethical ceiling on the addressable base.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "First-party data program operator experience; varies with enrollment " +
            "UX, value exchange, and jurisdiction (opt-in vs opt-out regimes shift " +
            "the achievable ceiling)",
          label: "planning-range",
        },
        dataSource:
          "Consent / preference-management system, by member and channel, joined to " +
          "the member profile",
        whyItMatters:
          "Consent is a hard constraint, not a nice-to-have: personalization that " +
          "exceeds granted permission is a legal, reputational, and trust liability. " +
          "A CTO reads this as the real size of the addressable base.",
      },
      {
        key: "identity_match_rate",
        name: "Identity resolution match rate",
        definition:
          "Share of transactions and touchpoints that resolve to a single, unified " +
          "customer identity across channels (web, app, store, email, device).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "CDP / identity-resolution operator experience; in-store and " +
            "logged-out web sessions are the hardest to resolve, so cross-channel " +
            "retailers sit lower than pure e-commerce",
          label: "planning-range",
        },
        dataSource:
          "Identity-resolution / CDP match metrics across the channel touchpoint set",
        whyItMatters:
          "Personalization and CLV are only as good as the identity graph beneath " +
          "them; unresolved identity fragments a member into multiple partial " +
          "profiles, breaking next-best-offer and double-counting CLV.",
      },
      {
        key: "progressive_profile_completeness",
        name: "Progressive-profile completeness",
        definition:
          "Share of high-value profile attributes (preferences, zero-party " +
          "declared data, category affinities) captured for active members through " +
          "progressive profiling.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Zero-party/first-party data program operator experience; completeness " +
            "is gated by the value exchange offered for each disclosure",
          label: "planning-range",
        },
        dataSource:
          "Profile-attribute completeness in the CDP/CRM for active members, scored " +
          "against a target attribute set",
        whyItMatters:
          "Zero-party (declared) data is the most durable and consent-safe input to " +
          "personalization as third-party signals decay; completeness is the leading " +
          "indicator of how rich and privacy-resilient personalization can become.",
      },
      {
        key: "email_app_engagement_rate",
        name: "Email / app engagement rate",
        definition:
          "Share of members who actively engage (open/click email, open/use app, " +
          "act on notifications) in a defined window — the channel health of the " +
          "owned relationship.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 45,
          basis:
            "Retail CRM channel benchmarks; sensitive to send discipline (over-" +
            "messaging fatigues the base) and deliverability/privacy changes",
          label: "planning-range",
        },
        dataSource:
          "ESP / app analytics engagement metrics joined to the member record",
        whyItMatters:
          "Owned channels are the cheapest way to drive repeat and personalization; " +
          "engagement erodes fast under over-messaging, so it is the discipline " +
          "signal that guards against blasting the base into fatigue.",
      },
      {
        key: "nba_adoption_rate",
        name: "Next-best-action adoption rate",
        definition:
          "Share of recommended next-best-actions/offers (across channels and " +
          "associate-assisted moments) that are acted on by the intended recipient " +
          "or surfaced as intended.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Decisioning/NBA program operator experience; depends on relevance, " +
            "channel fit, and whether actions respect frequency and consent caps",
          label: "planning-range",
        },
        dataSource:
          "Decisioning engine action-and-outcome tracking joined to the member and " +
          "order record",
        whyItMatters:
          "NBA adoption is the honest measure of whether the decisioning layer is " +
          "trusted and relevant; low adoption usually means the model is " +
          "rules-thin, mis-targeted, or ignoring fatigue and consent limits.",
      },
    ],

    painThemes: [
      {
        key: "personalization_overclaim",
        name: "Over-claimed personalization ROI (attribution, not incrementality)",
        description:
          "Personalization value is reported from attributed revenue — purchases " +
          "credited to a recommendation or offer that would have happened anyway — " +
          "so the headline ROI is inflated, investment is mis-prioritized, and the " +
          "program cannot prove causal lift when challenged.",
        detectionSignal:
          "Large 'personalization-attributed revenue %' with no holdout/control; " +
          "last-touch attribution crediting recommendations on already-intended " +
          "purchases; uplift claims that collapse when an experiment is finally run.",
        diagnosticQuestion:
          "Is your personalization value measured against a randomized holdout, or " +
          "is it attributed revenue — and what was the lift the last time you " +
          "actually held out a control group?",
      },
      {
        key: "rules_dressed_as_ai",
        name: "Rules and segments dressed up as 'AI personalization'",
        description:
          "Most production personalization is still hand-built rules and static " +
          "segments labeled as AI/ML; it cannot adapt 1:1, decays as the catalog " +
          "and base change, and creates a false belief that a real decisioning " +
          "capability exists.",
        detectionSignal:
          "'AI personalization' that is actually if-then rules and RFM segments; no " +
          "model retraining or feature pipeline; recommendations that never adapt to " +
          "individual real-time behavior; vendor 'AI' badge with no model governance.",
        diagnosticQuestion:
          "Behind your 'AI personalization', is there an actual model with a feature " +
          "pipeline and retraining — or is it rules and segments, and where would a " +
          "real model add lift over what rules already capture?",
      },
      {
        key: "breakage_liability_exposure",
        name: "Breakage treated as free margin, not a liability/exposure",
        description:
          "The program leans on a high breakage estimate to flatter margin while " +
          "ignoring that unredeemed points are a deferred-revenue liability and a " +
          "regulatory exposure (escheatment/gift-card-style rules, restatement risk) " +
          "— and that aggressive expiry erodes the very trust that funds the program.",
        detectionSignal:
          "Margin sensitivity concentrated in the breakage assumption; expiry policy " +
          "tightened to lift breakage; no auditor-validated method or sensitivity; " +
          "member complaints about expired points rising.",
        diagnosticQuestion:
          "How is your breakage estimated and validated, how exposed is margin to " +
          "it, and have you weighed the liability/regulatory and trust risk of " +
          "leaning on expiry to lift it?",
      },
      {
        key: "consent_afterthought",
        name: "Consent and privacy bolted on after the fact",
        description:
          "Personalization is built first and consent/permission is reconciled " +
          "later, so data is used beyond what members granted, consent state is not " +
          "enforced at decision time, and the program carries legal, reputational, " +
          "and trust risk that surfaces in an audit or breach.",
        detectionSignal:
          "Consent state not joined to the decisioning layer; marketing sent beyond " +
          "granted permission; no per-channel preference enforcement; data-subject " +
          "rights (access/delete) handled manually and slowly; clean-room/partner " +
          "data used without a clear permission basis.",
        diagnosticQuestion:
          "Is consent state enforced at decision time across every channel, and can " +
          "you prove, for any member, exactly what data use they permitted and that " +
          "you stayed within it?",
      },
      {
        key: "discount_not_relationship",
        name: "A points program mistaken for a relationship",
        description:
          "The program buys transactions with discounts and points rather than " +
          "building a relationship, so margin leaks to shoppers who would have " +
          "bought anyway, 'engagement' is really deal-seeking, and the program is " +
          "fragile to any competitor offering a bigger discount.",
        detectionSignal:
          "Rising reward/discount cost with flat repeat rate and CLV; redemption " +
          "concentrated in deal-seekers; churn the moment a richer competitor offer " +
          "appears; no measured lift in frequency or AOV net of the discount given.",
        diagnosticQuestion:
          "Net of the discount and points cost, is the program lifting frequency, " +
          "AOV, and retention incrementally — or is it subsidizing purchases that " +
          "would have happened, with engagement that is really price-seeking?",
      },
      {
        key: "identity_fragmentation",
        name: "Fragmented identity and siloed first-party data",
        description:
          "Member, web, app, store, and email data sit in separate systems and " +
          "fail to resolve to one identity, so a single customer becomes several " +
          "partial profiles — breaking next-best-offer, double-counting CLV, and " +
          "making personalization shallow and inconsistent across channels.",
        detectionSignal:
          "Low identity match rate; inconsistent recommendations across web/app/" +
          "email/store; CLV that double-counts a customer; in-store purchases not " +
          "linked to the online profile; data engineering blocked on joining sources.",
        diagnosticQuestion:
          "What share of touchpoints resolve to a single customer identity, and " +
          "where does identity fragment — in-store, logged-out web, or across " +
          "acquired brands — undermining personalization and CLV?",
      },
      {
        key: "message_fatigue",
        name: "Over-messaging and channel fatigue",
        description:
          "The owned base is messaged at high volume with light frequency and " +
          "relevance discipline, so engagement and deliverability erode, opt-outs " +
          "rise, and the cheapest channel for repeat and personalization quietly " +
          "burns out.",
        detectionSignal:
          "High send volume with falling open/click and rising opt-outs; no " +
          "frequency cap or fatigue model; deliverability/spam complaints climbing; " +
          "promotional cadence set by calendar, not by member receptivity.",
        diagnosticQuestion:
          "Are sends governed by per-member frequency caps and a fatigue/receptivity " +
          "model, or by a promotional calendar — and is engagement eroding under the " +
          "volume?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "next_best_offer_decisioning",
        name: "Next-best-offer / next-best-action decisioning",
        valueMechanism:
          "Predict each member's propensity, value, and next-best-offer from " +
          "unified first-party purchase, behavior, and declared-preference data, " +
          "and orchestrate the right offer or action to the right member at the " +
          "right moment and channel within consent and frequency caps — lifting " +
          "conversion, repeat, and AOV, measured against holdouts rather than " +
          "attributed revenue.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Unified, identity-resolved member profile (purchase, behavior, declared preferences)",
          "Historical offer/action exposure, response, and holdout data",
          "Real-time context (session, basket, channel, recency)",
          "Consent and per-channel permission state, and frequency-cap state",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Decisions must enforce consent and per-channel permission at decision time — no use of data beyond what the member granted",
          "Frequency caps and fatigue guardrails must bound send/offer volume so the engine cannot over-message the base",
          "Offer economics (discount depth) need human-set bounds so the model cannot give away margin to already-converting shoppers; targeting must avoid unfair/discriminatory treatment",
        ],
        metricsMoved: [
          "recommendation_conversion_rate",
          "nba_adoption_rate",
          "member_aov_uplift",
          "repeat_purchase_rate",
        ],
      },
      {
        key: "recommendation_search_personalization",
        name: "Recommendation, search & merchandising personalization",
        valueMechanism:
          "Personalize on-site/in-app product recommendations, search ranking, and " +
          "merchandising to each member's affinities and real-time behavior, " +
          "surfacing relevant products that lift discovery, basket size, and " +
          "conversion — with the honest caveat that incremental lift over a strong " +
          "rules/best-seller baseline must be holdout-measured.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Catalog and product-attribute data with embeddings/affinities",
          "Member behavioral and purchase history, identity-resolved",
          "Real-time session and basket context",
          "Inventory/availability so recommendations are sellable",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recommendations must respect inventory, margin, and compliance rules (e.g. age-restricted or regulated products) set by merchandising",
          "Models can entrench popularity bias and narrow discovery; diversity/exploration guardrails are a human-set policy",
          "Behavioral personalization must stay within consent; logged-out personalization must honor privacy and cookie/permission rules",
        ],
        metricsMoved: [
          "recommendation_conversion_rate",
          "personalization_attributed_revenue_pct",
          "member_aov_uplift",
        ],
      },
      {
        key: "churn_propensity_retention",
        name: "Churn / propensity scoring & win-back",
        valueMechanism:
          "Score members for lapse risk and category/purchase propensity and " +
          "trigger retention and win-back interventions (targeted offers, " +
          "reactivation journeys, preference re-capture) before high-value members " +
          "disengage — protecting CLV by acting on the silent, non-contractual " +
          "churn that retail otherwise misses.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Member activity, recency/frequency/monetary, and tenure history",
          "Engagement, service, and complaint signals",
          "Outcomes of past retention/win-back interventions",
          "CLV and value-tier scoring to prioritize spend",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Retention/win-back discount spend is a real cost — guardrails must bound goodwill/offer spend rather than let a model spend autonomously",
          "Interventions must be consistent and fair across comparable members to avoid perceived favoritism or discriminatory treatment",
          "Win-back contact must honor opt-out/consent state — re-engaging a member who opted out is a compliance breach",
        ],
        metricsMoved: [
          "churn_lapse_rate",
          "repeat_purchase_rate",
          "customer_lifetime_value",
          "active_member_rate",
        ],
      },
      {
        key: "clv_segmentation_modeling",
        name: "CLV modeling & dynamic value-based segmentation",
        valueMechanism:
          "Model lifetime value and build dynamic, behavior-based segments so " +
          "acquisition, retention, and personalization spend is concentrated on the " +
          "highest-value and highest-potential members rather than spread evenly — " +
          "raising the return on every marketing and reward dollar.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Purchase margin, frequency, and tenure by member, identity-resolved",
          "Behavioral and declared-preference signals for forward-looking propensity",
          "Channel cost and reward-cost data to compute net value",
          "Cohort and acquisition-source data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "CLV is a model output sensitive to discount-rate, horizon, and margin assumptions — it must carry its assumptions, not be treated as fact",
          "Value-based treatment must not cross into unfair or proxy-discriminatory segmentation of protected groups",
          "Segment definitions drive spend; the segmentation policy and value thresholds stay a human decision",
        ],
        metricsMoved: [
          "customer_lifetime_value",
          "member_aov_uplift",
          "repeat_purchase_rate",
        ],
      },
      {
        key: "identity_resolution_zero_party",
        name: "Identity resolution & zero-party/progressive profiling",
        valueMechanism:
          "Resolve fragmented touchpoints into a single durable customer identity " +
          "and enrich it through progressive profiling (declared, zero-party data " +
          "exchanged for value) — building the consent-safe, privacy-resilient " +
          "first-party foundation that every other personalization and CLV model " +
          "depends on as third-party signals decay.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Cross-channel identifiers (account, email, device, loyalty ID, store)",
          "Deterministic and probabilistic match signals with confidence scoring",
          "Progressive-profiling/preference capture surfaces and the value exchange",
          "Consent and permission state attached to each identity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Probabilistic identity matching risks false merges that mix two people's data — confidence thresholds and a redress path are required",
          "Zero-party data collection must be transparent about use and tied to explicit permission — progressive profiling is not consent laundering",
          "Identity graph and enrichment must honor data-subject access/delete rights and data-minimization principles",
        ],
        metricsMoved: [
          "identity_match_rate",
          "progressive_profile_completeness",
          "consent_opt_in_rate",
        ],
      },
      {
        key: "lifecycle_journey_orchestration",
        name: "Lifecycle / CRM journey orchestration with fatigue control",
        valueMechanism:
          "Orchestrate personalized lifecycle journeys (welcome, onboarding, " +
          "replenishment, milestone, win-back) across owned channels with " +
          "AI-driven send-time, content, and frequency optimization — lifting " +
          "engagement, repeat, and AOV while a fatigue model protects the base from " +
          "over-messaging.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Member lifecycle stage, recency, and engagement history",
          "Channel preference and per-channel consent state",
          "Content/offer library and send-time response signals",
          "Frequency-cap and fatigue/receptivity state",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Journeys must enforce consent and per-channel opt-out at send time, with auditable suppression",
          "Frequency caps and fatigue models must bound cadence so optimization for short-term engagement cannot burn out the channel",
          "Automated content must be brand- and compliance-checked; a wrong price/claim in an automated send is a liability at scale",
        ],
        metricsMoved: [
          "email_app_engagement_rate",
          "repeat_purchase_rate",
          "active_member_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "first_party_cdp_foundation",
        name: "First-party data foundation & CDP (identity + consent)",
        description:
          "A unified customer-data-platform layer that ingests web, app, store, " +
          "email, and loyalty data, resolves it to a single durable identity, " +
          "enforces consent/permission at the source, and serves a consistent " +
          "member profile — the substrate every personalization, retention, and CLV " +
          "model reads, with privacy and data-minimization built in.",
        boundary:
          "Owns ingestion, identity resolution, consent enforcement, and serving of " +
          "the unified profile; does not select offers, set loyalty economics, or " +
          "move points — it is the governed data substrate the decision systems read.",
        humanAccountabilityPoint:
          "Chief Data / Customer Officer with Data Protection Officer / privacy counsel oversight",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "personalization_decisioning_engine",
        name: "Personalization & next-best-offer decisioning engine",
        description:
          "A decisioning layer that scores members for value, propensity, and " +
          "next-best-offer/action and orchestrates personalized recommendations, " +
          "offers, search, and journeys across channels — with holdout measurement, " +
          "consent enforcement, and frequency caps that turn first-party data into " +
          "measured incremental revenue rather than attributed credit.",
        boundary:
          "Owns offer/action selection, orchestration, and incrementality " +
          "measurement within consent, margin, and frequency bounds; does not set " +
          "loyalty program economics, reward structure, or merchandising/pricing " +
          "policy — those stay with loyalty strategy and merchandising.",
        humanAccountabilityPoint:
          "VP Personalization / CRM (with Legal & Privacy sign-off on data use)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "loyalty_program_platform",
        name: "Loyalty program platform & rewards accounting",
        description:
          "The loyalty system of record that runs enrollment, the points/earn-burn " +
          "ledger, tiers, and redemption, and produces the rewards-liability and " +
          "breakage estimate feeding revenue recognition — the auditable core that " +
          "turns program activity into the member ledger and the reported liability.",
        boundary:
          "Owns the member ledger, tier/earn-burn rules, redemption, and the " +
          "rewards-liability/breakage estimate under the accounting standard; does " +
          "not select offers or personalize — it runs and accounts for the program, " +
          "it does not decide marketing.",
        humanAccountabilityPoint:
          "VP Loyalty with Controller / Revenue Accounting (and external auditor) on the liability estimate",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "experimentation_measurement_platform",
        name: "Experimentation & incrementality measurement platform",
        description:
          "A testing layer (A/B, multivariate, and holdout/incrementality design) " +
          "that proves the causal lift of personalization, offers, and journeys " +
          "against randomized controls — the discipline that separates real " +
          "incremental value from attributed revenue and keeps ROI claims honest.",
        boundary:
          "Owns experiment design, holdout assignment, and incrementality readout; " +
          "does not author content or set offer policy — it measures whether the " +
          "decisioning and journeys actually moved behavior causally.",
        humanAccountabilityPoint:
          "VP Analytics / Experimentation (owner of the incrementality standard)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "data_clean_room_partnerships",
        name: "Data clean rooms & privacy-safe partner enrichment",
        description:
          "A privacy-preserving collaboration layer (data clean rooms) that lets " +
          "the retailer match and enrich first-party data with partners (brands, " +
          "media, suppliers) for measurement and targeting without exposing raw " +
          "PII — extending reach and insight within consent and contractual " +
          "permission boundaries.",
        boundary:
          "Owns privacy-safe matching, aggregation, and permitted enrichment with " +
          "partners; does not own the member relationship or override consent — it " +
          "operates strictly within granted permission and data-use agreements.",
        humanAccountabilityPoint:
          "VP Data Partnerships / Retail Media with Data Protection Officer sign-off",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "The durable value of a retail loyalty/personalization engine is an " +
        "identified, consented, repeat-buying base: when most sales transact on a " +
        "known member, the retailer can personalize, retain, and measure — turning " +
        "anonymous traffic into a compounding first-party asset. Incremental value " +
        "comes from lifting conversion and AOV on personalized surfaces, raising " +
        "repeat rate and reducing silent churn on high-CLV members, and " +
        "concentrating reward and marketing spend on value rather than spreading it. " +
        "But the prize must be sized HONESTLY: personalization uplift is incremental " +
        "and routinely over-claimed, so it must be holdout-measured, not attributed; " +
        "much production 'AI' is rules that capture the easy lift already, so the " +
        "model's marginal value is smaller than vendors imply; breakage 'margin' is " +
        "an estimate and a liability/regulatory exposure, not bankable cash; consent " +
        "caps the addressable base; and points-funded transactions that would have " +
        "happened anyway are margin leakage, not value. The realizable portion is " +
        "sized with explicit haircuts for measurement attribution, consent/identity " +
        "readiness, the rules-already-capture-it baseline, and discount/margin " +
        "leakage.",
      dominantHaircutFactors: [
        {
          factor: "Measurement attribution & holdout discipline",
          rationale:
            "Most claimed personalization/retention value is members who would have " +
            "bought anyway; without randomized holdouts the headline uplift " +
            "overstates the true causal gain — the single biggest haircut in this domain.",
          typicalHaircut: {
            low: 0.3,
            high: 0.6,
            basis:
              "Retail incrementality experience where measured holdout lift falls " +
              "well short of attributed uplift",
            label: "planning-range",
          },
        },
        {
          factor: "Rules/segment baseline already captures the easy lift",
          rationale:
            "A strong best-seller/rules/RFM baseline already captures much of the " +
            "achievable lift, so a real model's MARGINAL incremental value over that " +
            "baseline is smaller than 'AI vs nothing' comparisons imply.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Personalization program experience comparing model lift against a " +
              "tuned rules/best-seller baseline rather than against no personalization",
            label: "planning-range",
          },
        },
        {
          factor: "Consent, identity & first-party data readiness",
          rationale:
            "Value depends on identity-resolved, consented data; siloed identity, " +
            "low match rates, and consent limits cap how much of the base can " +
            "actually be personalized and measured.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Implementation experience where identity was fragmented or consent/" +
              "permission limited the addressable base",
            label: "planning-range",
          },
        },
        {
          factor: "Discount/margin leakage & breakage-estimate fragility",
          rationale:
            "Points and offers subsidize purchases that would have happened, and " +
            "breakage 'margin' is a reversible estimate and liability exposure; this " +
            "value is fragile and must be discounted, not banked.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Observed margin leakage on non-incremental discounting and reversal " +
              "of estimate-driven breakage gains",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "AOV uplift from personalization & recommendations",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Personalized recommendation/merchandising program results vs a tuned " +
              "rules/best-seller baseline, holdout-measured",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in member_aov_uplift (holdout-measured incremental)",
        },
        {
          lever: "Conversion improvement from 1:1 next-best-offer",
          range: {
            low: 0.15,
            high: 0.5,
            basis:
              "Decisioning program lift over blast/segmented offers on conversion, " +
              "measured against a holdout",
            label: "planning-range",
          },
          measuredAs: "Relative improvement in recommendation_conversion_rate vs control",
        },
        {
          lever: "Churn / lapse reduction on high-value cohorts",
          range: {
            low: 0.03,
            high: 0.1,
            basis:
              "Propensity-driven retention/win-back results on high-CLV cohorts " +
              "measured against a control",
            label: "planning-range",
          },
          measuredAs: "Percentage-point reduction in churn_lapse_rate on targeted cohorts",
        },
        {
          lever: "Repeat-rate / frequency lift from lifecycle orchestration",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Lifecycle journey and reactivation programs lifting repeat purchase, " +
              "net of discount and holdout-measured",
            label: "planning-range",
          },
          measuredAs: "Relative lift in repeat_purchase_rate attributable to the program",
        },
      ],
      timeToValueBand:
        "Recommendation/search personalization and lifecycle orchestration: 1-3 " +
        "quarters where the CDP, catalog, and channels partly exist and lift is " +
        "quickly holdout-measurable. Next-best-offer decisioning, churn/CLV models, " +
        "and value-based segmentation: 3-6 quarters including the unified, consented " +
        "member profile and the experimentation discipline. Identity resolution and " +
        "the first-party data foundation are the gating prerequisite and can run " +
        "ahead. Any change to the breakage/liability estimate moves on the audit " +
        "cycle, not a project timeline.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Loyalty program platform",
          role: "System of record for member accounts, enrollment, the points/earn-burn ledger, tiers, and redemption.",
          examples: ["Talon.One", "SessionM (Mastercard)", "Antavo", "Salesforce Loyalty Management", "in-house loyalty platforms"],
        },
        {
          name: "Customer data platform (CDP) / identity resolution",
          role: "Unifies first-party data, resolves identity across channels, and serves the consented member profile.",
          examples: ["Segment (Twilio)", "Adobe Experience Platform / RT-CDP", "Salesforce Data Cloud", "Tealium", "Amperity"],
        },
        {
          name: "Personalization / recommendation / decisioning engine",
          role: "Scores members and selects/orchestrates recommendations and next-best-offers with measurement.",
          examples: ["Dynamic Yield", "Bloomreach", "Algolia / Constructor (search)", "Adobe Target", "in-house decisioning"],
        },
        {
          name: "Email / marketing automation (ESP) & messaging",
          role: "Owned-channel lifecycle journeys, campaigns, send-time and frequency control across email/SMS/push.",
          examples: ["Braze", "Salesforce Marketing Cloud", "Klaviyo", "Iterable", "Adobe Campaign"],
        },
        {
          name: "Consent / preference management",
          role: "Captures and enforces marketing/personalization permission and data-subject preferences by channel.",
          examples: ["OneTrust", "Transcend", "native CDP/ESP preference centers"],
        },
        {
          name: "Experimentation / measurement & data clean room",
          role: "A/B and holdout experimentation, incrementality measurement, and privacy-safe partner matching.",
          examples: ["Optimizely", "Statsig", "LiveRamp / Snowflake / AWS / Google clean rooms", "in-house experimentation"],
        },
        {
          name: "Order / commerce & POS systems",
          role: "Source of purchase transactions (online and in-store) tagged to the member for identity and CLV.",
          examples: ["commerce platforms (e.g. Salesforce Commerce, Shopify, in-house)", "POS systems"],
        },
      ],
      roles: [
        {
          title: "Chief Customer / Chief Data Officer",
          accountability: "The first-party data strategy, loyalty/CRM P&L contribution, and the consented member relationship.",
        },
        {
          title: "VP Loyalty Program",
          accountability: "Program design (earn/burn, tiers, rewards), membership growth, and program economics.",
        },
        {
          title: "VP Personalization / CRM",
          accountability: "Targeted offers, recommendations, lifecycle journeys, and holdout-measured incremental lift.",
        },
        {
          title: "Head of Customer Analytics / Data Science",
          accountability: "CLV, churn/propensity models, segmentation, and the incrementality/experimentation standard.",
        },
        {
          title: "Data Protection Officer / Privacy Counsel",
          accountability: "Consent, data-subject rights, and lawful use of first-party data for personalization.",
        },
        {
          title: "Controller / Revenue Accounting",
          accountability: "Rewards-liability and breakage estimation, redemption accounting, and audit defensibility.",
        },
      ],
      regulatoryFrames: [
        {
          name: "US state privacy law (CCPA/CPRA and successor state laws)",
          relevance:
            "Governs notice, opt-out of sale/sharing, sensitive-data limits, and " +
            "data-subject rights for personalization on US consumers — the dominant " +
            "US constraint on first-party data use.",
        },
        {
          name: "GDPR (and ePrivacy) for EU/UK consumers",
          relevance:
            "Requires a lawful basis and explicit consent for marketing/profiling, " +
            "data minimization, and honoring access/erasure — bounding cross-border " +
            "personalization and clean-room use.",
        },
        {
          name: "Marketing/messaging consent rules (CAN-SPAM, TCPA, ePrivacy/cookies)",
          relevance:
            "Govern email/SMS/push permission and tracking consent — every " +
            "lifecycle and offer send must honor channel-level opt-in/opt-out.",
        },
        {
          name: "Loyalty rewards liability, gift-card/escheatment & revenue recognition (ASC 606 / IFRS 15)",
          relevance:
            "Governs how unredeemed points/rewards are valued, deferred, and broken " +
            "to revenue, and the unclaimed-property/escheatment exposure on lapsed " +
            "value — making breakage an audited estimate, not free margin.",
        },
      ],
      canonicalTerms: [
        {
          term: "First-party / zero-party data",
          definition:
            "Data the retailer collects directly from its own customers (first-party) or that members declare deliberately, e.g. preferences (zero-party) — the consent-safe, durable foundation for personalization.",
        },
        {
          term: "Customer data platform (CDP)",
          definition:
            "A system that unifies customer data from all sources, resolves identity, and serves a single consented profile to downstream marketing and personalization.",
        },
        {
          term: "Identity resolution",
          definition:
            "Matching identifiers across channels and devices to a single durable customer identity, deterministically or probabilistically with a confidence score.",
        },
        {
          term: "Next-best-offer / next-best-action (NBO/NBA)",
          definition:
            "A decisioning approach that selects the single most valuable offer or action for a member in context, within consent and frequency limits.",
        },
        {
          term: "Holdout / incrementality",
          definition:
            "A randomized control group withheld from a treatment so the causal, incremental lift can be measured — the antidote to attributed-revenue over-claiming.",
        },
        {
          term: "Breakage",
          definition:
            "The estimated share of issued points/rewards never redeemed (expired/abandoned), recognized to margin when the obligation lapses — an audited liability estimate.",
        },
        {
          term: "Data clean room",
          definition:
            "A privacy-preserving environment where two parties match and analyze data without exposing raw PII to each other, used for measurement and targeting within permission.",
        },
        {
          term: "Customer lifetime value (CLV)",
          definition:
            "The modeled net present value of margin a customer generates over their expected tenure — the denominator for acquisition and retention investment.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Loyalty program penetration and membership health",
        authoritativeSource:
          "POS/e-commerce order data tagged to loyalty accounts and the loyalty platform's active/enrolled counts",
        whatGoodEvidenceLooksLike:
          "Sales-through-program % and active-member rate computed from order data, with the active definition stated and the dormant tail shown separately from total enrollment.",
        weakEvidenceToReject:
          "A headline total-enrollment number presented as program health, or a 'X% of sales through loyalty' figure with no definition of identified vs guest sales.",
      },
      {
        claim: "Personalization / offer incremental value",
        authoritativeSource:
          "Experimentation platform results measured against a randomized holdout/control, joined to the member and order record",
        whatGoodEvidenceLooksLike:
          "Conversion, AOV, and repeat uplift measured vs a holdout with confidence intervals, by member cohort and surface, and compared against a tuned rules baseline — not against no personalization.",
        weakEvidenceToReject:
          "Attributed 'personalization-driven revenue %' or engagement lift with no control group, or vendor case-study uplift not validated on this retailer's own members.",
      },
      {
        claim: "Member value and retention (CLV, churn)",
        authoritativeSource:
          "CLV and churn/propensity models and cohort retention tracking in the analytics/CRM platform",
        whatGoodEvidenceLooksLike:
          "CLV by cohort with the model's assumptions (discount rate, horizon, margin) stated, and churn measured against a defined lapse threshold and a baseline.",
        weakEvidenceToReject:
          "A single average CLV with no cohort spread or assumptions, or a churn/retention claim with no lapse definition or baseline.",
      },
      {
        claim: "Consent, identity, and first-party data readiness",
        authoritativeSource:
          "Consent/preference-management system and CDP identity-resolution match metrics",
        whatGoodEvidenceLooksLike:
          "Consent/opt-in rate and identity match rate by channel, with the permission basis for each data use traceable per member and data-subject rights demonstrably enforceable.",
        weakEvidenceToReject:
          "An assumption that the full enrolled base is addressable for personalization, or a claim of unified identity with no match-rate evidence or consent-state enforcement.",
      },
      {
        claim: "Rewards liability and breakage",
        authoritativeSource:
          "Loyalty accounting estimate (breakage method) and the rewards-liability roll-forward, reviewed with the auditor",
        whatGoodEvidenceLooksLike:
          "The breakage rate with its estimation method, a margin sensitivity to the assumption, the trailing redemption-behavior curve, and the escheatment/unclaimed-property posture.",
        weakEvidenceToReject:
          "A breakage rate quoted as a fixed industry constant or as free margin, or a liability figure with no method, sensitivity, or auditor/escheatment context.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your sales transacts on an identified loyalty member, and what is your active-member rate versus total enrollment — i.e. how addressable is the base really?",
      "Is your personalization value measured against a randomized holdout, or is it attributed revenue — and what was the lift the last time you actually held out a control?",
      "Behind your 'AI personalization', is there a real model with a feature pipeline and retraining, or is it rules and segments — and where would a model add lift over the rules baseline?",
      "Is consent state enforced at decision time across every channel, and can you prove, for any member, exactly what data use they permitted and that you stayed within it?",
      "What share of touchpoints resolve to a single customer identity, and where does identity fragment — in-store, logged-out web, or across brands — undermining personalization and CLV?",
      "Net of the discount and points cost, is the program lifting frequency, AOV, and retention incrementally, or subsidizing purchases that would have happened anyway?",
      "How is breakage estimated and validated, how exposed is margin to it, and have you weighed the liability/regulatory and trust risk of leaning on expiry to lift it?",
    ],
    maturitySignals: [
      "Most sales transact on an identified, consented member, and the program is managed to active members and CLV rather than total enrollment.",
      "Personalization and retention value is proven against randomized holdouts and against a tuned rules baseline, so incrementality is real, not attributed.",
      "First-party data is unified into one identity-resolved profile with consent enforced at decision time, and zero-party data is captured through a clear value exchange.",
      "Breakage and the rewards liability are estimated with a documented, auditor-validated method and a margin sensitivity, with escheatment exposure understood.",
    ],
    redFlags: [
      "Personalization ROI is reported from attributed revenue with no holdout, and 'AI' turns out to be rules and static segments that never adapt.",
      "Consent and privacy are reconciled after the fact — permission state is not enforced at send/decision time and data is used beyond what members granted.",
      "Margin leans on a rising breakage assumption and tightened expiry while members complain and trust erodes — breakage treated as free money.",
      "The program grows enrollment while repeat rate and CLV stall and reward/discount cost rises — points buying transactions, not a relationship.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Loyalty platform (Talon.One, SessionM, Antavo, Salesforce Loyalty, in-house)",
        category: "Loyalty system of record (ledger, tiers, earn/burn, redemption)",
        switchingCost:
          "High — the loyalty platform holds the member ledger, tiers, and earn/burn rules fused to commercial program design; replacement is a multi-year member-data-migration program that risks disrupting active members.",
        renewalDynamics:
          "Long-tenure platform agreements; modernization is often incremental (CDP/decisioning bolted on) rather than full loyalty-core replacement.",
      },
      {
        vendorName: "CDP / identity (Segment, Adobe RT-CDP, Salesforce Data Cloud, Tealium, Amperity)",
        category: "First-party data unification and identity resolution",
        switchingCost:
          "Moderate-to-high — integrate via data feeds, but the real lock-in is the accumulated unified profile, identity graph, and downstream integrations; the data itself is more portable than the wiring.",
        renewalDynamics:
          "Competitive, fast-moving market; favor data portability, identity-graph export, and avoiding profile lock-in at renewal.",
      },
      {
        vendorName: "Personalization / recommendation / search (Dynamic Yield, Bloomreach, Algolia, Constructor, Adobe Target)",
        category: "Recommendation, search, and next-best-offer decisioning",
        switchingCost:
          "Moderate — more replaceable than the loyalty or CDP core; lock-in is the tuned models, rules, and accumulated experiment history rather than the integration surface.",
        renewalDynamics:
          "Competitive and outcome-sensitive; renewals are a strong moment to demand holdout-measured incrementality and outcome-based terms.",
      },
      {
        vendorName: "Marketing automation / ESP (Braze, Salesforce Marketing Cloud, Klaviyo, Iterable)",
        category: "Owned-channel lifecycle, campaigns, and messaging",
        switchingCost:
          "Moderate — journeys, templates, and deliverability reputation create stickiness, but the integration is lighter than the loyalty or CDP core; migration is a real but bounded project.",
        renewalDynamics:
          "Volume/seat-based pricing; consolidation with CDP/personalization suites and message-volume commitments are live negotiation levers.",
      },
      {
        vendorName: "Consent / privacy & clean room (OneTrust, Transcend, LiveRamp, cloud clean rooms)",
        category: "Consent management and privacy-safe data collaboration",
        switchingCost:
          "Moderate — consent records and policy configuration create stickiness; the compliance criticality raises the bar on any switch but the data is portable.",
        renewalDynamics:
          "Compliance-driven; favor coverage of new state/jurisdiction laws and integration with the CDP/decisioning enforcement points.",
      },
    ],
    switchingCosts:
      "The loyalty system of record is effectively non-switchable in isolation " +
      "(it holds the member ledger and is fused to program design), and the CDP/" +
      "identity layer is high-stickiness because of the accumulated profile and " +
      "identity graph. The negotiable frontier is the personalization/decisioning " +
      "and ESP layers around the core, where switching cost is moderate and " +
      "outcome/incrementality-based terms are achievable, plus the consent/clean-" +
      "room layer where portability and law coverage are the levers.",
    negotiationLevers: [
      "Outcome/incrementality-based terms on personalization vendors tied to holdout-measured conversion or AOV uplift, not attributed revenue",
      "Data and identity-graph portability and export rights on the CDP to avoid profile and identity lock-in",
      "Consolidate CDP, personalization, and ESP negotiations to reduce overlap and improve terms across the stack",
      "Message-volume and seat commitments on the ESP traded for rate; benchmark loyalty-platform fees against modern challengers at renewal",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      program_health_claim: ["sales-through-program %", "active-member definition", "dormant-tail split"],
      personalization_value_claim: ["randomized holdout / control", "incrementality vs rules baseline", "cohort breakdown"],
      member_value_claim: ["CLV model assumptions", "cohort spread", "churn lapse definition and baseline"],
      consent_identity_claim: ["consent/opt-in rate by channel", "identity match rate", "per-member permission basis"],
      breakage_liability_claim: ["breakage method", "margin sensitivity", "auditor validation", "escheatment posture"],
      value_projection: ["baseline metric", "benchmark planning-range", "explicit haircut factors"],
    },
    citationStandard:
      "Program-health claims cite identified-sales and active-member data with the " +
      "active definition, never total enrollment as health. Personalization and " +
      "retention claims cite holdout-measured incrementality compared against a " +
      "tuned rules baseline — never attributed revenue or vendor case studies. " +
      "Member-value claims cite the CLV model's assumptions and cohort spread and a " +
      "defined churn baseline. Consent/identity claims cite per-channel opt-in and " +
      "match rates with a traceable permission basis. Breakage claims cite the " +
      "estimation method, a margin sensitivity, and auditor/escheatment context, " +
      "never a fixed constant or 'free margin'. Value projections cite a baseline " +
      "plus a labelled planning range and the haircut factors applied (attribution, " +
      "rules baseline, consent/identity readiness, discount/breakage fragility) — " +
      "never a single asserted dollar or ROI figure.",
  },

  hedgeRules: {
    whenToHedge: [
      "Personalization or retention uplift is cited without a holdout — mark it as attributed value, not measured incremental value.",
      "'AI personalization' is asserted without evidence of a real model — note that the production system may be rules/segments and the model's marginal lift over the rules baseline is the honest question.",
      "Member vs non-member AOV/CLV gaps are cited — flag selection bias (members self-select as higher-value) unless isolated against a matched control.",
      "Breakage 'margin' is presented as cash or free money — frame it as an audited liability estimate with regulatory/escheatment and trust exposure.",
      "The full enrolled base is assumed addressable — hedge against consent limits and identity-match gaps that shrink the truly addressable base.",
    ],
    inferenceLanguage: [
      "Across retail loyalty programs, measured holdout lift typically falls well short of attributed lift, so absent your control results...",
      "Most production 'AI personalization' is rules and segments; without evidence of a live model, the realistic marginal lift over your rules baseline is...",
      "Member-vs-non-member gaps are inflated by self-selection; absent a matched control, the causal AOV/CLV uplift is likely lower, around...",
      "Net of attribution, the rules baseline, and consent/identity readiness, the realizable portion of this is typically...",
    ],
    flagWithoutEvidence: [
      "A specific personalization or loyalty ROI for this retailer without a holdout-measured baseline",
      "This retailer's actual breakage rate, rewards liability, or CLV figures",
      "A claim that this retailer's 'AI personalization' is model-driven (vs rules/segments) without evidence of a live model and pipeline",
      "An assertion that the full enrolled base is consent-addressable without consent-rate and identity-match evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "loyalty & personalization KPI scorecard",
      exhibitKind: "table",
      note: "Sales-through-program %, active-member rate, member AOV uplift, repeat rate, personalization-attributed revenue %, recommendation conversion, churn, CLV, redemption, breakage, consent/opt-in, identity match, profile completeness, engagement, NBA adoption vs planning ranges.",
    },
    {
      questionPattern: "value impact of a loyalty/personalization program with honest haircuts (value bridge)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from attributed to recoverable value applying attribution, rules-baseline, consent/identity, and discount/breakage haircuts.",
    },
    {
      questionPattern: "which loyalty/personalization levers move value most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of AOV uplift, conversion, churn reduction, and repeat-rate levers by impact range to prioritize investment.",
    },
    {
      questionPattern: "repeat rate, active membership, or engagement trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend repeat/repurchase rate, active-member %, or email/app engagement over periods to show whether the relationship is deepening.",
    },
    {
      questionPattern: "personalization-attributed vs holdout-measured incremental revenue",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Compare attributed personalization revenue against holdout-measured incremental revenue to expose the over-claim gap.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A high share of sales identified to consented members, so the base is genuinely addressable and measurable",
      "Holdout/incrementality discipline measured against a tuned rules baseline, so the program proves causal value rather than banking attributed revenue",
      "A unified, identity-resolved, consent-enforced first-party profile so personalization and CLV models have real, lawful signal",
      "Program managed to active members, repeat, and CLV — and to incremental margin net of discount — rather than to enrollment and attributed engagement",
    ],
    failureDrivers: [
      "Reporting attributed revenue as ROI and 'AI personalization' that is really rules/segments, so claimed value evaporates under a real holdout",
      "Treating consent and privacy as an afterthought, using data beyond granted permission and carrying legal/trust risk",
      "Leaning on breakage and tightened expiry as 'free margin' while ignoring the liability/escheatment exposure and the trust erosion",
      "Funding non-incremental transactions with points/discounts so margin leaks while enrollment grows and the relationship does not deepen",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Recommendation/search personalization and lifecycle orchestration adopt " +
      "first because the CDP, catalog, and channels often partly exist and lift is " +
      "quickly measurable; next-best-offer decisioning, churn/CLV models, and " +
      "value-based segmentation follow once the unified, consented profile and " +
      "experimentation discipline are in place; identity resolution and zero-party " +
      "profiling are the gating foundation and should run ahead. Clean-room and " +
      "partner enrichment scale last as governance and partnerships mature. " +
      "Breakage/liability changes move on the audit cycle, not a project plan.",
    roiClarity: "low",
    roiClarityBasis:
      "Personalization attribution is genuinely hard: attributed revenue routinely " +
      "over-states incremental lift, and the honest comparison is against a tuned " +
      "rules baseline, not against no personalization — so headline ROI is " +
      "frequently inflated. Retention and CLV ROI add long horizons and " +
      "discount-rate/attribution assumptions, and selection bias inflates " +
      "member-vs-non-member gaps. Only the holdout-measured incremental levers are " +
      "firm; absent that discipline, ROI clarity is low, and the value model must " +
      "be read as a planning estimate net of explicit attribution haircuts, not a " +
      "measured fact.",
  },

  regulatoryFrame: {
    name: "Consumer privacy & marketing consent (CCPA/CPRA, GDPR, CAN-SPAM/TCPA/ePrivacy)",
    relevance:
      "The dominant frame shaping this domain: first-party personalization is " +
      "lawful only within explicit, current permission and a valid legal basis, " +
      "with data minimization and enforceable data-subject rights — consent is a " +
      "hard constraint enforced at decision/send time, not an afterthought. " +
      "Loyalty rewards-liability and breakage are separately governed by revenue-" +
      "recognition (ASC 606 / IFRS 15) and gift-card/escheatment/unclaimed-property " +
      "rules, making breakage an audited estimate and exposure rather than free " +
      "margin (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (retail-loyalty)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
