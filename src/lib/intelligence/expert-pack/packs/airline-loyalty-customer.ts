// Consilium expert — Airline Loyalty & Customer Experience.
//
// W3 wave-4 industry-function ExpertPack. Domain: the loyalty program and the
// customer experience around it — the frequent-flyer program (FFP), the
// co-brand credit-card partnership(s), points/miles liability and breakage,
// personalization and targeted offers, ancillary revenue, customer lifetime
// value, disruption care / service recovery, and Net Promoter / satisfaction.
//
// Honesty posture baked into the content: for many large carriers the LOYALTY
// program is the most profitable unit and is frequently worth more than the
// airline that flies the planes — but that value is DOMINATED by the co-brand
// card economics (the bank buys miles in bulk), not by passenger redemptions.
// Loyalty accounting is genuinely complex: points are a DEFERRED-REVENUE
// liability under IFRS 15 / ASC 606, and the reported economics swing on the
// BREAKAGE estimate (miles that expire unredeemed) and the standalone selling
// price of a mile — both judgemental. The pack is blunt that program "value"
// claims are accounting estimates, that co-brand renewal cycles dominate the
// P&L, and that personalization value erodes without disciplined measurement.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const airlineLoyaltyCustomerExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.airline.loyalty-customer",
    expertName: "Airline Loyalty & Customer Experience Expert",
    kind: "industry-function",
    industry: "airline",
    functionKey: "loyalty-customer",
    scopeNote:
      "The frequent-flyer program and the customer experience around it: FFP " +
      "design (earn/burn, elite tiers, partners), the co-brand credit-card " +
      "partnership that dominates program economics, points/miles liability and " +
      "breakage under deferred-revenue accounting, personalization and targeted " +
      "offers, ancillary revenue (bags, seats, upgrades, subscriptions), customer " +
      "lifetime value, disruption care / service recovery, and NPS / satisfaction. " +
      "Honest that loyalty accounting (breakage, standalone selling price, " +
      "deferred revenue) is complex and that co-brand card economics, not " +
      "passenger redemptions, drive the program's profit. Excludes flight " +
      "operations / IROPS recovery mechanics (the operational restoration of the " +
      "schedule), revenue management / fare pricing, and crew/maintenance — those " +
      "route to the Airline Operations & Revenue Management expert.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "loyalty_program_revenue",
        name: "Loyalty program revenue",
        definition:
          "Total revenue recognized by the loyalty unit — miles sold to partners " +
          "(chiefly the co-brand bank) plus the breakage and travel-redemption " +
          "revenue recognized as miles are used or expire.",
        unit: "USD millions per year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1000,
          high: 7000,
          basis:
            "Large US/global network-carrier loyalty-segment disclosures and " +
            "co-brand financing prospectuses; varies sharply with fleet size, " +
            "card portfolio, and how the carrier reports the segment",
          label: "planning-range",
        },
        dataSource:
          "Loyalty-segment reporting in the financial system, joined to the mile-sale " +
          "contract with the co-brand bank and the deferred-revenue roll-forward",
        whyItMatters:
          "For many large carriers the loyalty unit is the most profitable segment " +
          "and a standalone-valuable business; it is the headline that frames every " +
          "other loyalty metric — but it must be read as an accounting result, not " +
          "cash, because much of it is deferred-revenue recognition.",
      },
      {
        key: "cobrand_card_spend",
        name: "Co-brand card spend (GDV)",
        definition:
          "Gross dollar volume charged on the airline's co-branded credit cards — " +
          "the spend base from which the bank buys miles and the carrier earns " +
          "its share.",
        unit: "USD billions per year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 200,
          basis:
            "Disclosed co-brand portfolio spend for major US carriers; a function " +
            "of cardholder count, affluence, and category share of wallet",
          label: "planning-range",
        },
        dataSource:
          "Co-brand partner reporting (issuing bank / network) reconciled to the " +
          "mile-purchase and revenue-share schedule",
        whyItMatters:
          "The single biggest driver of loyalty profit: the bank buys miles in " +
          "proportion to cardholder spend, so card GDV — not passenger flying — is " +
          "the economic engine of the modern FFP and the number renewal terms hinge on.",
      },
      {
        key: "points_liability",
        name: "Points / miles liability (deferred revenue)",
        definition:
          "The balance-sheet liability for miles issued but not yet redeemed or " +
          "expired — the deferred revenue the carrier owes its members in future " +
          "travel or value, net of estimated breakage.",
        unit: "USD billions",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Air-traffic-liability / loyalty deferred-revenue disclosures for large " +
            "carriers; scales with miles outstanding and the standalone selling price",
          label: "planning-range",
        },
        dataSource:
          "Deferred-revenue / air-traffic-liability roll-forward in the financial " +
          "system, driven by miles outstanding times standalone selling price",
        whyItMatters:
          "It is one of the largest liabilities on an airline's balance sheet and " +
          "the number most sensitive to estimation judgement; how it is measured " +
          "(SSP, breakage) directly changes reported earnings, so it is in-range, " +
          "not simply 'lower is better'.",
      },
      {
        key: "breakage_rate",
        name: "Breakage rate",
        definition:
          "Estimated share of issued miles expected never to be redeemed (expired " +
          "or abandoned) — recognized as revenue because the obligation lapses.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 8,
          high: 22,
          basis:
            "Loyalty accounting disclosures and program design; depends on expiry " +
            "policy, member engagement, and the estimation method — a judgemental " +
            "range, not a market constant",
          label: "planning-range",
        },
        dataSource:
          "Historical redemption/expiry behavior modeled in the loyalty accounting " +
          "estimate, reviewed with the external auditor",
        whyItMatters:
          "Breakage is pure-margin revenue and a key earnings lever, but it is an " +
          "ESTIMATE: too-high breakage overstates earnings and risks restatement, " +
          "too-low understates the program — it is the most scrutinized loyalty " +
          "judgement and belongs in-range under audit, not maximized.",
      },
      {
        key: "ancillary_revenue_per_pax",
        name: "Ancillary revenue per passenger",
        definition:
          "Non-ticket revenue (bags, seat selection, paid upgrades, priority, " +
          "lounge, subscriptions, partner commissions) divided by enplaned passengers.",
        unit: "USD per passenger",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 75,
          basis:
            "IdeaWorks/CarTrawler ancillary reports and carrier disclosures; " +
            "ultra-low-cost carriers run far higher, network carriers lower",
          label: "planning-range",
        },
        dataSource:
          "Ancillary revenue lines in revenue accounting divided by enplanements " +
          "from the passenger service system",
        whyItMatters:
          "Ancillary is high-margin revenue the loyalty/CX engine can grow through " +
          "targeted offers and personalization; it is increasingly the difference " +
          "between a profitable and an unprofitable passenger.",
      },
      {
        key: "member_share_of_revenue",
        name: "Member share of passenger revenue",
        definition:
          "Share of total passenger revenue generated by enrolled loyalty members " +
          "(vs unidentified / non-member travelers).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 80,
          basis:
            "Carrier loyalty disclosures and IATA loyalty studies; mature programs " +
            "identify a large majority of revenue to known members",
          label: "planning-range",
        },
        dataSource:
          "Bookings tagged to a loyalty account in the PSS/CRM divided by total " +
          "passenger revenue",
        whyItMatters:
          "Higher member share means more of the revenue base is identified and " +
          "addressable for personalization, retention, and offers — the precondition " +
          "for every targeted-CX bet to work at all.",
      },
      {
        key: "customer_lifetime_value",
        name: "Customer lifetime value (CLV)",
        definition:
          "Modeled net present value of the margin a member generates across flights, " +
          "ancillary, and co-brand card spend over their expected tenure.",
        unit: "USD per member",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 500,
          high: 5000,
          basis:
            "Internal CLV models; spans an enormous range from infrequent leisure " +
            "members to high-spend cardholding elites — a planning range, highly mix-dependent",
          label: "planning-range",
        },
        dataSource:
          "CLV model joining flight margin, ancillary, and co-brand spend share by " +
          "member cohort in the analytics/CRM platform",
        whyItMatters:
          "CLV is the right denominator for loyalty investment — it reveals that the " +
          "co-brand-cardholding elite is worth multiples of the average member and " +
          "should anchor retention spend; but it is a model output, sensitive to " +
          "discount rate and attribution assumptions.",
      },
      {
        key: "redemption_rate",
        name: "Redemption rate",
        definition:
          "Share of miles issued in a period that are redeemed (for travel or " +
          "non-air rewards) within a comparable window — the complement of breakage " +
          "plus outstanding balance growth.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 70,
          high: 92,
          basis:
            "Loyalty program disclosures; high redemption signals an engaged but " +
            "more expensive program, low signals breakage upside but disengagement risk",
          label: "planning-range",
        },
        dataSource:
          "Miles redeemed vs issued from the loyalty system ledger over a trailing period",
        whyItMatters:
          "Redemption is the member-value side of the program; too low erodes the " +
          "earn-burn promise and engagement (and inflates a fragile breakage estimate), " +
          "too high raises the cost of rewards — it is a balance, hence in-range.",
      },
      {
        key: "nps",
        name: "Net Promoter Score (NPS)",
        definition:
          "Percent promoters minus percent detractors from the relationship/ " +
          "transactional survey — the headline customer-advocacy measure.",
        unit: "score (-100 to 100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "Airline NPS benchmarks; varies widely by carrier positioning and is " +
            "highly sensitive to recent disruption experience",
          label: "planning-range",
        },
        dataSource:
          "Relationship and post-trip transactional surveys in the CX/feedback platform, " +
          "linked to the member record",
        whyItMatters:
          "NPS is the advocacy signal that correlates with retention and member " +
          "share of wallet; it moves most on disruption handling, so it is the " +
          "metric service-recovery investment is judged against — read with caution " +
          "as a relative trend, not an absolute truth.",
      },
      {
        key: "active_member_pct",
        name: "Active member percentage",
        definition:
          "Share of enrolled members with at least one qualifying activity (flight, " +
          "earn, or burn) in a trailing 12 months.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 55,
          basis:
            "Loyalty program operator experience; large enrolled bases carry long " +
            "dormant tails, so active share is well below total membership",
          label: "planning-range",
        },
        dataSource:
          "Members with qualifying activity in the trailing 12 months divided by " +
          "total enrolled, from the loyalty system",
        whyItMatters:
          "Total membership is a vanity number; active members are the real, " +
          "addressable base, and the dormant tail both inflates liability optics " +
          "and is the prime target for reactivation campaigns.",
      },
      {
        key: "offer_conversion_rate",
        name: "Offer conversion rate",
        definition:
          "Share of targeted personalized offers (bonus-mile promos, ancillary " +
          "upsells, partner deals) that result in the intended action.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 12,
          basis:
            "Personalization program operator experience; well-targeted, relevant " +
            "offers convert at the high end, blast campaigns at the low end",
          label: "planning-range",
        },
        dataSource:
          "Offer-engine / campaign platform conversion tracking joined to the member " +
          "and transaction record",
        whyItMatters:
          "Conversion is the honest measure of whether personalization works; it " +
          "guards against vanity 'engagement' metrics and is the direct lever on " +
          "incremental ancillary and member share of wallet.",
      },
      {
        key: "elite_retention_rate",
        name: "Elite-tier retention rate",
        definition:
          "Share of elite-status members who requalify (or are retained via soft " +
          "landing) for an elite tier year over year.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis:
            "Program operator experience; elites are the highest-value members so " +
            "retention here disproportionately drives revenue and advocacy",
          label: "planning-range",
        },
        dataSource:
          "Year-over-year requalification tracking by tier in the loyalty system",
        whyItMatters:
          "Elites are a small share of members but a large share of revenue and " +
          "co-brand spend; losing an elite costs far more than the headline implies, " +
          "so retention here is the highest-leverage loyalty outcome.",
      },
    ],

    painThemes: [
      {
        key: "cobrand_overdependence",
        name: "Over-dependence on a single co-brand partner",
        description:
          "Program profit is concentrated in one co-brand card agreement, so the " +
          "carrier's loyalty P&L is hostage to a periodic renewal negotiation with " +
          "the issuing bank — and the bank knows the carrier cannot easily walk.",
        detectionSignal:
          "A large majority of loyalty profit traced to one card agreement; a " +
          "looming multi-year renewal with no credible alternative issuer; mile-sale " +
          "pricing set years ago and out of step with current card spend.",
        diagnosticQuestion:
          "What share of your loyalty profit comes from the co-brand card, when does " +
          "that agreement renew, and what leverage or alternative do you have going in?",
      },
      {
        key: "breakage_estimate_risk",
        name: "Fragile breakage / deferred-revenue estimate",
        description:
          "Reported loyalty earnings depend on a breakage rate and a standalone " +
          "selling price for a mile that are judgemental estimates; a methodology " +
          "change, member-behavior shift, or expiry-policy change can swing earnings " +
          "and invite audit scrutiny or restatement.",
        detectionSignal:
          "Earnings sensitivity concentrated in the breakage assumption; redemption " +
          "behavior drifting away from the modeled curve; auditor questions on the " +
          "SSP or breakage method; expiry-policy changes not reflected in the estimate.",
        diagnosticQuestion:
          "How is your breakage rate and standalone selling price estimated, how " +
          "sensitive are earnings to it, and when was the methodology last validated " +
          "with your auditor?",
      },
      {
        key: "devaluation_trust_erosion",
        name: "Devaluation-driven trust erosion",
        description:
          "Raising award prices or quietly cutting earn rates props up the liability " +
          "and margin short-term but erodes the perceived value of miles, suppressing " +
          "card spend and engagement — the very thing that funds the program.",
        detectionSignal:
          "Repeated award-chart increases or earn cuts; member sentiment and NPS " +
          "falling after devaluations; card spend or new-card acquisition softening " +
          "in the same window.",
        diagnosticQuestion:
          "How do you weigh the near-term liability/margin benefit of a devaluation " +
          "against its measured impact on card spend, engagement, and member trust?",
      },
      {
        key: "personalization_blast",
        name: "Blast marketing masquerading as personalization",
        description:
          "Offers go out broadly with light targeting, so conversion is low, members " +
          "are fatigued, and the program cannot prove personalization value — while " +
          "the rich member data that would enable real 1:1 offers sits unused or siloed.",
        detectionSignal:
          "Low offer conversion with high send volume; member opt-outs / fatigue " +
          "rising; no holdout/control measurement; member, flight, and card data in " +
          "separate systems that never join.",
        diagnosticQuestion:
          "Are your offers measured against a holdout, and is member, flight, and " +
          "card-spend data joined well enough to target 1:1 — or is 'personalization' " +
          "really segmented blast email?",
      },
      {
        key: "disruption_care_failure",
        name: "Service-recovery failure on disruption",
        description:
          "When flights are disrupted, high-value members are not proactively cared " +
          "for or compensated consistently, so the customer-felt cost of a delay " +
          "destroys advocacy and lifetime value far beyond the operational cost — " +
          "loyalty's most damaging, least-measured leak.",
        detectionSignal:
          "NPS collapse concentrated on disrupted itineraries; inconsistent goodwill/" +
          "compensation; elites not recognized or prioritized during IROPS; complaints " +
          "and churn spiking after disruption events.",
        diagnosticQuestion:
          "During a disruption, are your elite and high-CLV members proactively " +
          "recognized, rebooked, and compensated consistently — and do you measure " +
          "the NPS and retention impact of how recovery was handled?",
      },
      {
        key: "ancillary_left_on_table",
        name: "Ancillary revenue left on the table",
        description:
          "Bags, seats, upgrades, and subscriptions are merchandised generically " +
          "rather than offered to the right member at the right moment and price, so " +
          "high-margin ancillary revenue and member relevance are both lost.",
        detectionSignal:
          "Flat ancillary per passenger despite rising traffic; one-size offers in " +
          "the booking and trip flow; no use of member value tier or context to time " +
          "or price upsells; upgrade inventory spoiling unsold.",
        diagnosticQuestion:
          "Are ancillary offers (bags, seats, upgrades, subscriptions) tailored to " +
          "member value and trip context, or merchandised the same way to everyone " +
          "regardless of willingness to pay?",
      },
      {
        key: "vanity_membership",
        name: "Vanity membership and dormant tail",
        description:
          "The program touts a huge enrolled base while a large share is dormant; " +
          "leadership manages to the headline membership number rather than active, " +
          "addressable, revenue-generating members, masking real engagement health.",
        detectionSignal:
          "Total-membership growth celebrated while active percentage is flat or " +
          "falling; campaigns sized to total enrolled; no reactivation program for " +
          "the dormant tail; liability optics distorted by inactive accounts.",
        diagnosticQuestion:
          "Do you manage the program to active, revenue-generating members or to " +
          "total enrollment, and what is your reactivation strategy for the dormant tail?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "clv_offer_personalization",
        name: "CLV-based offer personalization",
        valueMechanism:
          "Predict each member's value, propensity, and next-best-offer from joined " +
          "flight, ancillary, and card-spend data, and target bonus-mile, ancillary, " +
          "and partner offers 1:1 at the right moment and price — lifting offer " +
          "conversion and ancillary while reducing fatigue, measured against holdouts.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Unified member profile joining flight, ancillary, and co-brand spend",
          "Historical offer exposure, response, and holdout data",
          "Trip context (upcoming itinerary, disruption status, channel)",
          "Consent / marketing-permission state by member and channel",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Offers must respect marketing consent and privacy law (GDPR/CCPA) — no use of data beyond permitted purpose",
          "Co-brand card offers are jointly governed with the issuing bank and bound by card-marketing and lending regulation",
          "Personalization must avoid unfair or discriminatory targeting; pricing of offers must stay within disclosed program terms",
        ],
        metricsMoved: [
          "offer_conversion_rate",
          "ancillary_revenue_per_pax",
          "customer_lifetime_value",
          "member_share_of_revenue",
        ],
      },
      {
        key: "churn_retention_prediction",
        name: "Churn & elite-retention prediction",
        valueMechanism:
          "Score members — especially elites and high-CLV cardholders — for churn " +
          "and lapse risk and trigger retention interventions (soft-landing, targeted " +
          "bonuses, proactive outreach) before they disengage, protecting the highest-" +
          "value relationships and their card spend.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Member activity, tier history, and requalification trajectory",
          "Engagement, complaint, and disruption-experience signals",
          "Co-brand spend trend by member",
          "Outcomes of past retention interventions",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Retention spend (bonus miles, soft landings) is a real cost — guardrails must bound goodwill spend, not let a model spend autonomously",
          "Interventions must be consistent and fair across comparable members to avoid perceived favoritism",
          "Predictions inform outreach; the relationship and any status grant stay a human decision",
        ],
        metricsMoved: [
          "elite_retention_rate",
          "active_member_pct",
          "customer_lifetime_value",
        ],
      },
      {
        key: "ancillary_dynamic_merchandising",
        name: "AI ancillary merchandising & dynamic upsell",
        valueMechanism:
          "Predict willingness to pay for bags, seats, upgrades, and subscriptions " +
          "by member and trip context and present the right ancillary at the right " +
          "price and moment in the booking and trip flow — lifting high-margin " +
          "ancillary revenue per passenger without degrading the experience.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Ancillary purchase history and price-response data",
          "Member value tier and trip context (route, cabin, party, timing)",
          "Available ancillary inventory (seats, upgrade space)",
          "Channel and session context for the offer surface",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Differential pricing must comply with consumer-protection and disclosure rules — no opaque or deceptive ancillary pricing",
          "Offers must respect fare rules, fee disclosure (DOT) obligations, and accessibility requirements",
          "Pricing and merchandising policy bounds stay human-set; the model optimizes within them",
        ],
        metricsMoved: [
          "ancillary_revenue_per_pax",
          "offer_conversion_rate",
        ],
      },
      {
        key: "proactive_service_recovery",
        name: "Proactive service recovery & disruption care",
        valueMechanism:
          "Detect disrupted high-value members in real time and trigger proactive " +
          "recognition, rebooking, and consistent compensation — protecting the " +
          "advocacy and lifetime value that a mishandled disruption otherwise " +
          "destroys, and stabilizing NPS where it moves most.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Live itinerary and disruption status linked to the member record",
          "Member value tier / CLV and disruption history",
          "Compensation and goodwill policy and entitlement rules",
          "Available rebooking and alternative-care options",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Compensation must honor DOT/EU261 passenger-rights obligations and the carrier's published policy as a floor",
          "Goodwill/compensation spend needs human-set guardrails — not autonomous, unbounded disbursement",
          "Automated communications during fast-moving disruptions must be accurate; wrong care advice compounds the trust damage",
        ],
        metricsMoved: [
          "nps",
          "elite_retention_rate",
          "customer_lifetime_value",
        ],
      },
      {
        key: "loyalty_assistant",
        name: "Conversational loyalty & service assistant",
        valueMechanism:
          "A grounded assistant answers members' loyalty and service questions " +
          "(balance, earn/burn, award availability, status, policy) and handles " +
          "routine servicing in self-service — lifting engagement and active " +
          "membership while cutting cost-to-serve and freeing agents for high-value care.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Member account, balance, and tier data",
          "Award-availability and program-rules knowledge base",
          "Service / case history and entitlement rules",
          "Authentication and consent state",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Account access requires strong authentication — loyalty accounts hold value and PII and are a fraud target",
          "The assistant must be grounded in current program rules; a wrong earn/award answer is a financial and trust liability",
          "Escalation to a human is required for disputes, compensation, and anything touching account value or status",
        ],
        metricsMoved: [
          "active_member_pct",
          "nps",
          "member_share_of_revenue",
        ],
      },
      {
        key: "loyalty_fraud_detection",
        name: "Loyalty fraud & account-takeover detection",
        valueMechanism:
          "Detect account-takeover, points theft, and redemption fraud from behavioral " +
          "and transaction signals and intervene before miles are drained — protecting " +
          "member trust and the liability, since stolen miles are both a loss and a " +
          "reputational and engagement hit.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Login, device, and session behavioral signals",
          "Earn/redeem transaction patterns and velocity",
          "Known-fraud labels and chargeback / dispute history",
          "Linked co-brand and partner transaction signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "False positives lock legitimate members out of their value — friction must be calibrated against fraud loss",
          "Fraud decisions touching account value must be reviewable and reversible with a clear member-redress path",
          "Models must handle PII and authentication data under privacy and security obligations",
        ],
        metricsMoved: [
          "active_member_pct",
          "nps",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_member_profile",
        name: "Unified member profile & loyalty data foundation",
        description:
          "A single member-360 layer that joins flight history, ancillary purchases, " +
          "co-brand card spend share, service interactions, and consent into one " +
          "consistent profile — the substrate every personalization, retention, and " +
          "care model reads, with privacy and consent enforced at the source.",
        boundary:
          "Owns ingestion, identity resolution, consent enforcement, and serving of " +
          "the member profile; does not make offers, set status, or move points — it " +
          "is the data substrate the decision systems read.",
        humanAccountabilityPoint:
          "VP Loyalty / Chief Customer Officer with Data Protection Officer oversight",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "offer_decision_engine",
        name: "Next-best-offer decision & personalization engine",
        description:
          "A decisioning layer that scores members for value, propensity, and " +
          "next-best-offer and orchestrates personalized bonus-mile, ancillary, and " +
          "partner offers across channels with holdout measurement and consent " +
          "enforcement — turning member data into measured incremental revenue.",
        boundary:
          "Owns offer selection, orchestration, and measurement within marketing " +
          "consent and program/policy bounds; does not set program economics, award " +
          "charts, or card terms — those remain with loyalty strategy and the bank partner.",
        humanAccountabilityPoint:
          "VP Loyalty Marketing / Personalization (with Legal & Privacy sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "loyalty_accounting_engine",
        name: "Loyalty accounting & deferred-revenue engine",
        description:
          "The system of record that values miles outstanding at standalone selling " +
          "price, estimates breakage, and produces the deferred-revenue roll-forward " +
          "and recognition — the auditable core that turns program activity into " +
          "reported loyalty revenue and liability.",
        boundary:
          "Owns mile valuation, breakage estimation, and revenue recognition under " +
          "the accounting standard; does not set commercial program design or marketing " +
          "— it measures and recognizes, it does not run the program.",
        humanAccountabilityPoint:
          "VP / Controller — Loyalty Accounting (with external auditor)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "service_recovery_orchestrator",
        name: "Disruption care & service-recovery orchestrator",
        description:
          "A recovery layer that links disruption status to the member record, " +
          "recognizes high-value members, and orchestrates proactive rebooking, " +
          "communication, and consistent compensation within policy — converting " +
          "disruption from an advocacy-destroying event into a recoverable moment.",
        boundary:
          "Owns proactive member care orchestration and consistent compensation " +
          "within published policy and passenger-rights floors; does not run the " +
          "operational schedule recovery (IROPS) and does not set compensation policy " +
          "— it executes care, it does not decide the operation or the policy.",
        humanAccountabilityPoint:
          "VP Customer Experience / Service Recovery (compensation policy owner)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Loyalty value is dominated by the co-brand card: the issuing bank buys " +
        "miles in bulk against cardholder spend, so the durable profit engine is " +
        "card GDV and the renewal terms, not passenger redemptions. The CX and " +
        "personalization layer creates incremental value on top — higher offer " +
        "conversion and ancillary, better retention of high-CLV elites, and " +
        "protected advocacy through disruption care — but it must be measured " +
        "against holdouts because the easy gains are illusory and devaluation can " +
        "borrow earnings from the future. Crucially, reported loyalty 'value' is " +
        "an accounting result built on a breakage and standalone-selling-price " +
        "estimate; cash and reported revenue diverge, and pushing the estimate to " +
        "flatter earnings is a real restatement and trust risk. The honest prize " +
        "is engaged, identified, high-CLV members whose card spend and ancillary " +
        "grow — sized with explicit haircuts for measurement attribution, consent " +
        "limits, and the partner's share of the economics.",
      dominantHaircutFactors: [
        {
          factor: "Co-brand partner economics & renewal leverage",
          rationale:
            "The bank captures a large share of program economics and the renewal " +
            "negotiation caps what the carrier keeps; CX gains in card spend are " +
            "split with the partner, so the carrier realizes only its share.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Co-brand revenue-share structures where a meaningful share of " +
              "card-driven value accrues to the issuing bank",
            label: "planning-range",
          },
        },
        {
          factor: "Measurement attribution & holdout discipline",
          rationale:
            "Much claimed personalization/retention value is members who would have " +
            "acted anyway; without holdouts and incrementality testing, headline " +
            "uplift overstates the true causal gain.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Marketing-incrementality experience where measured uplift falls well " +
              "short of attributed uplift",
            label: "planning-range",
          },
        },
        {
          factor: "Consent, privacy & data-join readiness",
          rationale:
            "Personalization value depends on joined member/flight/card data within " +
            "marketing consent; siloed data and consent limits cap how much of the " +
            "addressable base can actually be targeted.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Implementation experience where member data was siloed or consent-limited",
            label: "planning-range",
          },
        },
        {
          factor: "Accounting estimate & devaluation risk",
          rationale:
            "Earnings 'gains' from breakage/SSP changes or devaluations are estimate-" +
            "driven and reversible, and devaluation suppresses future card spend; this " +
            "value is fragile and must be discounted, not banked.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Observed reversal of estimate-driven gains and engagement loss following devaluations",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Ancillary revenue per passenger uplift",
          range: {
            low: 0.03,
            high: 0.12,
            basis:
              "Personalized ancillary merchandising program results vs generic offering",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in ancillary_revenue_per_pax (holdout-measured)",
        },
        {
          lever: "Offer conversion improvement from 1:1 targeting",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Personalization program lift over blast/segmented campaigns on conversion",
            label: "planning-range",
          },
          measuredAs: "Relative improvement in offer_conversion_rate vs control",
        },
        {
          lever: "Elite / high-CLV retention improvement",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Churn-prediction-driven retention program results on high-value cohorts",
            label: "planning-range",
          },
          measuredAs: "Percentage-point gain in elite_retention_rate on targeted cohorts",
        },
        {
          lever: "Co-brand card spend share-of-wallet growth",
          range: {
            low: 0.01,
            high: 0.05,
            basis:
              "Engagement and personalization programs lifting card spend (carrier share, net of partner split)",
            label: "planning-range",
          },
          measuredAs: "Relative growth in cobrand_card_spend attributable to the program",
        },
      ],
      timeToValueBand:
        "Ancillary merchandising and the loyalty assistant: 1-3 quarters (data and " +
        "channels often partly exist). CLV-based personalization and churn/retention: " +
        "3-6 quarters including the unified member profile and holdout measurement " +
        "discipline. Co-brand value capture is gated to the renewal cycle and can be " +
        "multi-year. Accounting-estimate changes are governed by the audit cycle, not a project timeline.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Loyalty / FFP platform",
          role: "System of record for member accounts, miles balances, tiers, earn/burn ledger, and award redemption.",
          examples: ["Comarch Loyalty", "Switchfly / Sabre loyalty modules", "in-house FFP platforms"],
        },
        {
          name: "Loyalty accounting / deferred-revenue engine",
          role: "Values miles outstanding (SSP), estimates breakage, and produces the deferred-revenue roll-forward and recognition.",
          examples: ["loyalty accounting modules", "in-house deferred-revenue engines integrated to the GL"],
        },
        {
          name: "Co-brand partner / card platform",
          role: "Holds cardholder spend (GDV), the mile-purchase and revenue-share schedule, and joint card-marketing.",
          examples: ["issuing-bank card platforms (e.g. Chase, Amex, Citi, Barclays)", "card network reporting"],
        },
        {
          name: "CRM / customer data platform (CDP)",
          role: "Unifies the member profile, consent, segmentation, and campaign orchestration across channels.",
          examples: ["Salesforce", "Adobe Experience Platform", "in-house CDP / member-360"],
        },
        {
          name: "Personalization / offer-decision engine",
          role: "Scores members and selects/orchestrates next-best-offers with measurement.",
          examples: ["decisioning platforms", "in-house next-best-offer engines"],
        },
        {
          name: "Passenger service system (PSS) & ancillary / merchandising",
          role: "Bookings, itineraries, fare/ancillary merchandising, and member tagging at point of sale.",
          examples: ["Amadeus Altea", "Sabre PSS", "Navitaire", "airline merchandising/NDC offer engines"],
        },
        {
          name: "CX feedback / survey platform",
          role: "Captures NPS and transactional survey data linked to the member and trip record.",
          examples: ["Qualtrics", "Medallia", "in-house VoC tooling"],
        },
      ],
      roles: [
        {
          title: "Chief Customer Officer / EVP Loyalty",
          accountability: "End-to-end loyalty P&L, member value, and customer experience strategy.",
        },
        {
          title: "VP Loyalty Program / FFP",
          accountability: "Program design (earn/burn, tiers, partners), member value, and program economics.",
        },
        {
          title: "VP Co-brand & Partnerships",
          accountability: "The co-brand card relationship, mile-sale pricing, and the renewal negotiation.",
        },
        {
          title: "Controller — Loyalty Accounting",
          accountability: "Breakage and SSP estimation, deferred-revenue recognition, and audit defensibility.",
        },
        {
          title: "VP Customer Experience / Service Recovery",
          accountability: "NPS, disruption care, compensation policy, and service-recovery outcomes.",
        },
        {
          title: "VP Personalization / Loyalty Marketing",
          accountability: "Targeted offers, ancillary merchandising, conversion, and holdout-measured incrementality.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Revenue recognition (IFRS 15 / ASC 606) — loyalty deferred revenue",
          relevance:
            "Governs how miles are valued (standalone selling price), how breakage is " +
            "estimated, and when loyalty revenue is recognized — the core of loyalty accounting honesty.",
        },
        {
          name: "Data privacy & marketing consent (GDPR / CCPA)",
          relevance:
            "Bounds how member data is joined and used for personalization and how " +
            "consent and opt-out are honored across channels.",
        },
        {
          name: "Card-marketing & consumer-credit regulation (e.g. TILA/CARD Act, partner-governed)",
          relevance:
            "Co-brand card offers and joint marketing are bound by lending and card " +
            "regulation and the bank partner's compliance — the carrier cannot market the card freely.",
        },
        {
          name: "DOT consumer-protection rules & EU261",
          relevance:
            "Govern fee disclosure (ancillary), denied boarding, and delay/cancellation " +
            "compensation — the floor for disruption care and ancillary pricing transparency.",
        },
      ],
      canonicalTerms: [
        {
          term: "Breakage",
          definition:
            "The estimated share of issued miles never redeemed (expired/abandoned), recognized as revenue when the obligation lapses.",
        },
        {
          term: "Standalone selling price (SSP)",
          definition:
            "The estimated standalone value of one mile, used to allocate and defer revenue when miles are issued under ASC 606 / IFRS 15.",
        },
        {
          term: "Co-brand / GDV",
          definition:
            "The co-branded credit card partnership; GDV is the gross dollar volume of cardholder spend the bank buys miles against.",
        },
        {
          term: "Earn and burn",
          definition:
            "How members accumulate (earn) and redeem (burn) miles — the two halves of the program's value promise.",
        },
        {
          term: "Air traffic / loyalty deferred-revenue liability",
          definition:
            "The balance-sheet obligation for miles issued but not yet redeemed or expired, net of estimated breakage.",
        },
        {
          term: "Elite tier / status",
          definition:
            "The recognition tiers (e.g. silver/gold/platinum) that reward and retain a carrier's highest-value flyers.",
        },
        {
          term: "Devaluation",
          definition:
            "An increase in award prices or cut to earn rates that reduces the value of a mile — a margin lever with engagement risk.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Loyalty program revenue and profitability",
        authoritativeSource:
          "Loyalty-segment financial reporting joined to the mile-sale contract and deferred-revenue roll-forward",
        whatGoodEvidenceLooksLike:
          "Loyalty revenue split into mile-sale (co-brand), breakage, and travel-redemption components, with the co-brand share explicit and reconciled to the deferred-revenue movement.",
        weakEvidenceToReject:
          "A single headline 'loyalty is worth $X' figure with no split between cash mile-sales, deferred recognition, and breakage, or a third-party valuation presented as reported profit.",
      },
      {
        claim: "Breakage rate and deferred-revenue liability",
        authoritativeSource:
          "Loyalty accounting estimate (breakage method, SSP) and the deferred-revenue/air-traffic-liability roll-forward, reviewed with the auditor",
        whatGoodEvidenceLooksLike:
          "The breakage rate and SSP with their estimation method, an earnings-sensitivity to the assumption, and the trailing redemption-behavior curve that supports it.",
        weakEvidenceToReject:
          "A breakage rate quoted as a fixed industry constant, or a liability figure with no method, sensitivity, or auditor context behind the estimate.",
      },
      {
        claim: "Personalization / offer incrementality",
        authoritativeSource:
          "Offer-engine results measured against a randomized holdout/control, joined to the member and transaction record",
        whatGoodEvidenceLooksLike:
          "Conversion and ancillary uplift measured vs a holdout with confidence intervals, broken down by member cohort and offer type.",
        weakEvidenceToReject:
          "Headline 'engagement' or attributed-conversion lift with no control group, or vendor case-study uplift not validated on this carrier's own members.",
      },
      {
        claim: "Member value and retention (CLV, elite retention)",
        authoritativeSource:
          "CLV model and year-over-year requalification tracking by cohort in the analytics/loyalty system",
        whatGoodEvidenceLooksLike:
          "CLV by member cohort with the model's assumptions (discount rate, attribution of card spend) stated, and elite retention measured year over year against a baseline.",
        weakEvidenceToReject:
          "A single average CLV presented without cohort spread or model assumptions, or a retention claim with no baseline or definition of requalification.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your loyalty profit comes from the co-brand card versus passenger redemptions, when does the agreement renew, and what leverage do you have going in?",
      "How are your breakage rate and standalone selling price estimated, how sensitive are reported earnings to them, and when was the method last validated with your auditor?",
      "Is member, flight, and co-brand-spend data joined into one profile, and are your offers measured against a holdout — or is 'personalization' really segmented blast email?",
      "How do you weigh the near-term margin benefit of a devaluation against its measured impact on card spend, engagement, and member trust?",
      "During a disruption, are your elite and high-CLV members proactively recognized, rebooked, and compensated consistently — and do you measure the NPS and retention impact?",
      "Do you manage the program to active, revenue-generating members and CLV, or to total enrollment — and what is your reactivation strategy for the dormant tail?",
      "Are ancillary offers (bags, seats, upgrades, subscriptions) tailored to member value and trip context, or merchandised the same way to everyone?",
    ],
    maturitySignals: [
      "Member, flight, ancillary, and card-spend data are joined into one consented profile that every personalization and care model reads.",
      "Personalization and retention value is measured against randomized holdouts, not attributed conversion, so incrementality is real.",
      "Breakage and SSP are estimated with a documented, auditor-validated method and an explicit earnings-sensitivity, not a fixed assumption.",
      "Elite and high-CLV members are proactively recognized and consistently cared for during disruption, with NPS and retention tracked by event.",
    ],
    redFlags: [
      "Loyalty 'value' is reported as one headline figure with no split between cash co-brand mile-sales, deferred recognition, and breakage.",
      "Earnings lean on a rising breakage assumption or repeated devaluations while card spend and engagement quietly soften.",
      "Offers go out at high volume with low conversion and no holdout, and member, flight, and card data sit in separate systems.",
      "High-value members are mishandled during disruption — inconsistent compensation, no proactive care — and NPS collapses on disrupted itineraries.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Loyalty / FFP platform (Comarch, Switchfly, Sabre, in-house)",
        category: "Loyalty system of record (accounts, ledger, redemption)",
        switchingCost:
          "High — the FFP platform holds the member ledger, tiers, and earn/burn rules fused to commercial program design and partner integrations; replacement is a multi-year, member-data-migration program.",
        renewalDynamics:
          "Long-tenure platform agreements; modernization is often incremental (CDP/decisioning bolted on) rather than full FFP replacement.",
      },
      {
        vendorName: "Co-brand issuing bank (Chase, Amex, Citi, Barclays, etc.)",
        category: "Co-brand card partnership (the dominant economic relationship)",
        switchingCost:
          "Very high and strategic — the card agreement IS the program's profit engine; switching issuers is a rare, high-stakes, multi-year move that risks disrupting cardholders and revenue.",
        renewalDynamics:
          "Periodic multi-year renewals are the single most important loyalty commercial event; mile-sale pricing, revenue share, and marketing economics are all re-set — and the bank's alternatives are limited too, which is the carrier's real leverage.",
      },
      {
        vendorName: "CDP / personalization & decisioning (Salesforce, Adobe, in-house)",
        category: "Member data unification and next-best-offer decisioning",
        switchingCost:
          "Moderate — integrate via data feeds and are more replaceable than the FFP core; the real lock-in is the unified profile and accumulated models/segments.",
        renewalDynamics:
          "Competitive, fast-moving market; favor measurable incrementality, data portability, and avoiding model/segment lock-in.",
      },
      {
        vendorName: "CX feedback / VoC (Qualtrics, Medallia)",
        category: "NPS / survey and voice-of-customer measurement",
        switchingCost:
          "Moderate — survey programs and historical trend data create stickiness, but the integration surface is lighter than the FFP or card platform.",
        renewalDynamics:
          "Subscription/seat-based; consolidation with broader CX/CDP suites is a live negotiation lever.",
      },
    ],
    switchingCosts:
      "The economic core — the co-brand card agreement — is strategically near-unswitchable on any short horizon, and the FFP system of record is effectively non-switchable in isolation. The negotiable frontier is (1) the co-brand RENEWAL, where mile-sale pricing and revenue share are re-set and the carrier's leverage is that the bank's alternatives are also limited, and (2) the personalization/CDP/decisioning layer around the core, where switching cost is moderate and outcome terms are achievable.",
    negotiationLevers: [
      "Co-brand renewal: re-price mile-sales to current card GDV and benchmark revenue-share against competing issuers' bids",
      "Outcome/incrementality-based terms on personalization vendors tied to holdout-measured conversion or ancillary uplift",
      "Data portability and exit rights on CDP/decisioning to avoid profile and model lock-in",
      "Bundle CX/VoC, CDP, and decisioning negotiations to consolidate spend and improve terms",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      program_economics_claim: ["loyalty-segment reporting", "co-brand vs redemption split", "deferred-revenue roll-forward"],
      accounting_estimate_claim: ["breakage method", "standalone selling price", "earnings sensitivity", "auditor validation"],
      personalization_value_claim: ["randomized holdout / control", "incrementality measurement", "cohort breakdown"],
      member_value_claim: ["CLV model assumptions", "cohort spread", "year-over-year retention baseline"],
      value_projection: ["baseline metric", "benchmark planning-range", "explicit haircut factors"],
    },
    citationStandard:
      "Program-value claims cite the loyalty-segment reporting and split co-brand " +
      "mile-sale, breakage, and redemption revenue — never a single headline 'worth $X' " +
      "figure. Accounting claims cite the breakage/SSP method, an earnings sensitivity, " +
      "and auditor context, never a fixed industry constant. Personalization and " +
      "retention claims cite holdout-measured incrementality, not attributed conversion " +
      "or vendor case studies. Value projections cite a baseline plus a labelled " +
      "planning range and the haircut factors applied (partner split, attribution, " +
      "consent, estimate risk) — never a single asserted dollar or ROI figure.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no co-brand vs redemption split — frame loyalty 'value' as an accounting result with components, not a single headline figure.",
      "Breakage or SSP is cited without the tenant's own method and sensitivity — present as a judgemental estimate, not a market constant.",
      "Personalization/retention uplift is cited without a holdout — mark as attributed, not measured incremental, value.",
      "A projection assumes devaluation or a breakage increase improves earnings — flag that this borrows from future card spend/engagement and is reversible.",
    ],
    inferenceLanguage: [
      "Across large network carriers, the co-brand card typically drives the majority of loyalty profit, so...",
      "Without your holdout-measured results, the industry pattern for offer conversion uplift suggests...",
      "Breakage is a judgemental estimate; absent your method, peer programs commonly fall in the range of...",
      "Net of the partner's share and measurement attribution, the realizable portion of this is typically...",
    ],
    flagWithoutEvidence: [
      "A specific loyalty-program valuation or profit figure for this carrier",
      "This carrier's actual breakage rate, standalone selling price, or deferred-revenue liability",
      "A specific personalization or retention ROI for this carrier without a holdout-measured baseline",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "loyalty revenue / profit composition (co-brand vs breakage vs redemption)",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Stack loyalty revenue by component (co-brand mile-sale, breakage, travel redemption) to show what actually drives program profit.",
    },
    {
      questionPattern: "value impact of a loyalty/CX program with haircuts (value bridge)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current to recoverable value with partner-split, attribution, consent, and estimate-risk haircuts.",
    },
    {
      questionPattern: "which loyalty/CX levers move value most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of ancillary, conversion, retention, and co-brand levers by impact range to prioritize investment.",
    },
    {
      questionPattern: "NPS, active membership, or ancillary trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend NPS, active-member %, or ancillary per passenger over periods to show whether the CX engine is improving.",
    },
    {
      questionPattern: "loyalty & customer-experience KPI scorecard",
      exhibitKind: "table",
      note: "Loyalty revenue, co-brand GDV, points liability, breakage, ancillary/pax, member share, CLV, redemption, NPS, active %, offer conversion, elite retention vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A unified, consented member profile joining flight, ancillary, and co-brand spend so personalization and care models have real signal",
      "Holdout / incrementality discipline so the program proves causal value rather than banking attributed conversion",
      "Disciplined, auditor-validated breakage/SSP estimation that is not used to flatter earnings or invite restatement",
      "Co-brand renewal handled as a strategic event with benchmarked pricing and a credible understanding of mutual leverage",
    ],
    failureDrivers: [
      "Treating loyalty 'value' as one cash-like headline number while ignoring the deferred-revenue and breakage estimate beneath it",
      "Borrowing earnings via devaluation or a rising breakage assumption while card spend and engagement quietly erode",
      "Blast marketing dressed up as personalization, measured by vanity engagement with no holdout, on siloed data",
      "Mishandling high-value members through disruption so advocacy and lifetime value are destroyed faster than offers can build them",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Ancillary merchandising and a grounded loyalty assistant adopt first because " +
      "the data and channels often partly exist and the value is quickly measurable; " +
      "CLV-based personalization and churn/retention follow once the unified member " +
      "profile and holdout measurement are in place; service-recovery orchestration " +
      "scales as it earns trust during real disruptions. The co-brand value lever is " +
      "the largest but is gated to the multi-year renewal cycle, and any change to the " +
      "accounting estimate moves on the audit cycle, not a project plan.",
    roiClarity: "medium",
    roiClarityBasis:
      "Ancillary and conversion ROI are relatively firm when measured against holdouts " +
      "because the incremental revenue is directly observed. Retention and CLV ROI are " +
      "harder to attribute (long horizons, co-brand-spend attribution, discount-rate " +
      "assumptions). The biggest number — co-brand economics — is real but split with " +
      "the bank and set at renewal, and reported loyalty 'profit' is partly an accounting " +
      "estimate (breakage, SSP), so headline program value must be read as an estimate, not cash.",
  },

  regulatoryFrame: {
    name: "Loyalty revenue recognition & deferred revenue (IFRS 15 / ASC 606)",
    relevance:
      "The dominant frame shaping loyalty economics: miles are a performance " +
      "obligation deferred at standalone selling price and recognized as redeemed " +
      "or broken, so reported loyalty revenue and the points liability hinge on the " +
      "breakage and SSP estimates and are audit-governed — not free management " +
      "levers. Data privacy/consent (GDPR/CCPA), card-marketing and consumer-credit " +
      "regulation on the co-brand, and DOT/EU261 consumer-protection rules also apply " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
