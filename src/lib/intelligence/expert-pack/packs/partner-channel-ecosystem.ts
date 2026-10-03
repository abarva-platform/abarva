// Consilium expert — Partner, Channel & Ecosystem Management (cross-cutting).
//
// W3 backlog-wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-
// cutting, cross-industry expert spanning the INDIRECT / ecosystem go-to-market
// layer of the enterprise: channel sales (resellers, distributors, VARs),
// partner programs & tiers, deal registration, MDF / co-op funding, partner
// onboarding & enablement, alliances & co-sell (hyperscaler marketplaces),
// partner performance management, and channel conflict. Product-aware across
// PRM, CRM, and marketplace systems, not product-locked.
//
// SCOPE FENCE — this is the INDIRECT / ecosystem revenue layer. It is DISTINCT
// from Sales & Revenue Operations (DIRECT sales ops — the company's own quota-
// carrying reps, forecast, comp), from Customer Success & Account Management
// (post-sale retention/expansion of the company's OWN customers), and from
// Procurement & Strategic Sourcing (the BUY side — sourcing suppliers). This
// expert owns selling THROUGH and WITH third parties — the partner relationship,
// the program economics, and the co-sell motion — not the direct rep, not post-
// sale CS, and not the procurement buy.
//
// CORE DOCTRINE — PARTNER-SOURCED ATTRIBUTION IS MOSTLY ESTIMATED, NOT PROVEN,
// AND MDF ROI IS CHRONICALLY UNMEASURED. Channel is high-leverage revenue but
// low-visibility: you do not own the end-customer data, so partner-sourced vs
// partner-influenced pipeline and revenue attribution is murky and largely
// self-reported by the partner. Two truths gate the value: (1) partner-INFLUENCED
// revenue is an estimate (overlapping touch, double-counted with direct), not a
// clean booked-through-partner number — so it must be hedged, not asserted; and
// (2) MDF / co-op spend and partner enablement investment have chronically
// unmeasured ROI — funds claimed without proof-of-performance, enablement that
// decays without continuous reinvestment. Marketplace / co-sell is the fastest-
// growing motion but its margin (the hyperscaler take) and customer-ownership
// terms are contested. So value is sized on partner-SOURCED (booked-through)
// revenue with influenced revenue hedged, and program spend (MDF/enablement) is
// held to proof-of-performance — never on a headline influenced-revenue number.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const partnerChannelEcosystemExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.partner-channel-ecosystem",
    expertName: "Partner, Channel & Ecosystem Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "partner-channel-ecosystem",
    scopeNote:
      "Cross-cutting, cross-industry expert for the INDIRECT / ecosystem go-to-" +
      "market layer: channel sales (resellers, distributors, VARs), partner " +
      "programs & tiers, deal registration, MDF / co-op funding, partner " +
      "onboarding & enablement, alliances & co-sell (hyperscaler marketplaces), " +
      "partner performance, and channel conflict. Owns selling THROUGH and WITH " +
      "third parties — the partner relationship, the program economics, and the " +
      "co-sell motion. Product-aware across PRM, CRM, and marketplace systems, " +
      "not product-locked. CORE DOCTRINE: partner-sourced/influenced attribution " +
      "is mostly ESTIMATED not proven (you do not own the end-customer data), and " +
      "MDF/co-op and enablement ROI are chronically unmeasured — so value is " +
      "sized on partner-SOURCED (booked-through) revenue with influenced revenue " +
      "hedged, and program spend held to proof-of-performance, never a headline " +
      "influenced number. DISTINCT FROM Sales & Revenue Operations (DIRECT sales " +
      "ops), Customer Success & Account Management (post-sale retention of own " +
      "customers), and Procurement & Strategic Sourcing (the buy side) — those " +
      "are separate experts; this one owns the indirect/ecosystem revenue layer.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "partner_sourced_revenue_pct",
        name: "Partner-sourced revenue %",
        definition:
          "Share of total revenue booked through a partner who originated and " +
          "registered the deal (partner-led, transacted-through), as distinct " +
          "from partner-influenced — the clean, attributable channel number.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 60,
          basis:
            "Channel-mix ranges across B2B technology and enterprise software; " +
            "channel-first / two-tier distribution businesses run 50-75%+ partner-" +
            "sourced, direct-led businesses with an emerging channel sit at 15-30%",
          label: "planning-range",
        },
        dataSource:
          "CRM opportunities flagged partner-sourced via deal-registration + the " +
          "PRM, reconciled to booked revenue",
        whyItMatters:
          "The honest, defensible channel-contribution number — booked through a " +
          "registered partner, not an estimate. It is the denominator every " +
          "channel ROI and program-cost claim should be read against, and the one " +
          "channel figure a CFO can trust.",
      },
      {
        key: "partner_influenced_revenue_pct",
        name: "Partner-influenced revenue %",
        definition:
          "Share of revenue a partner touched, influenced, or co-sold but did " +
          "NOT transact through (the deal may have closed direct). Overlaps with " +
          "direct and with sourced, so it is an ESTIMATE, not a clean booking.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 75,
          basis:
            "Self-reported influence ranges; commonly cited as a large multiple " +
            "of sourced revenue, but double-counting with direct and partner self-" +
            "attribution make it the softest channel figure",
          label: "planning-range",
        },
        dataSource:
          "CRM influence tagging + partner self-reported co-sell claims, " +
          "reconciled (imperfectly) against direct attribution",
        whyItMatters:
          "The number channel leaders quote upward — and the most over-stated, " +
          "because it is estimated and double-counts direct. It must always be " +
          "hedged and read beside the sourced figure; a CFO discounts influenced " +
          "revenue heavily and rightly.",
      },
      {
        key: "partner_sourced_pipeline_coverage",
        name: "Partner-sourced pipeline coverage",
        definition:
          "Open partner-sourced (registered) pipeline as a multiple of the " +
          "partner-sourced bookings target for the period — the channel's own " +
          "pipeline-to-target coverage ratio.",
        unit: "x (pipeline : target)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2.5,
          high: 4,
          basis:
            "Pipeline-coverage planning ranges applied to the channel segment; " +
            "lower-velocity channel deals often need 3-4x given partner-reported " +
            "pipeline quality and slippage",
          label: "planning-range",
        },
        dataSource:
          "PRM / CRM registered-deal pipeline against the channel bookings " +
          "target for the period",
        whyItMatters:
          "Whether the channel can hit its number, sized on registered (not just " +
          "claimed) pipeline. Partner-reported pipeline is lower-fidelity than " +
          "direct, so coverage must run higher and be read with a slippage view.",
      },
      {
        key: "deal_reg_approval_rate",
        name: "Deal-registration approval rate",
        definition:
          "Share of submitted deal-registration requests approved (granting the " +
          "partner protection / margin on that opportunity) versus rejected for " +
          "conflict, duplication, or insufficient detail.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "Deal-registration program ranges; very high approval signals rubber-" +
            "stamping (and conflict risk), very low signals friction that pushes " +
            "partners away — a healthy program sits in a band",
          label: "planning-range",
        },
        dataSource:
          "PRM deal-registration workflow: submitted, approved, rejected, and " +
          "reason codes",
        whyItMatters:
          "The trust hinge of the channel. Too low frustrates partners and they " +
          "stop registering (killing pipeline visibility); too high rubber-stamps " +
          "conflicts. The rate and its reason-code mix reveal program health.",
      },
      {
        key: "deal_reg_cycle_time",
        name: "Deal-registration cycle time",
        definition:
          "Average elapsed time from a partner submitting a deal-registration " +
          "request to an approve/reject decision — the responsiveness of the " +
          "channel's core protection mechanism.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 24,
          high: 72,
          basis:
            "Partner-experience benchmarks; best-in-class auto-approve clean " +
            "registrations in hours, laggards take days and partners disengage " +
            "or sell a competitor while they wait",
          label: "planning-range",
        },
        dataSource:
          "PRM deal-registration workflow timestamps from submission to decision",
        whyItMatters:
          "Slow deal-reg decisions are a top partner complaint and a direct cause " +
          "of channel conflict and lost deals — a partner with no answer sells " +
          "what they can register fast. Speed is a primary partner-satisfaction " +
          "lever and a prime automation target.",
      },
      {
        key: "mdf_utilization_rate",
        name: "MDF / co-op utilization rate",
        definition:
          "Share of allocated market-development / co-op funds that partners " +
          "actually claim and spend (with approved proof-of-performance) in the " +
          "period — committed funds turned into executed activity.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "MDF-program ranges; well-run programs see 70-85% utilization with " +
            "proof-of-performance, under-managed programs leave large unclaimed " +
            "balances or pay without evidence",
          label: "planning-range",
        },
        dataSource:
          "PRM / MDF-management module: allocated, claimed, approved-with-proof, " +
          "and expired funds by partner and activity",
        whyItMatters:
          "Low utilization is wasted budget and a dis-engaged partner; very high " +
          "utilization without proof-of-performance is unmanaged spend. It is the " +
          "throughput half of the MDF-ROI question and a classic governance gap.",
      },
      {
        key: "mdf_roi",
        name: "MDF / co-op ROI (pipeline or revenue per fund dollar)",
        definition:
          "Partner-sourced pipeline or revenue generated per dollar of MDF / " +
          "co-op spent, attributed to funded activities — the value-for-money of " +
          "channel-marketing investment.",
        unit: "x (pipeline$ : MDF$)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 10,
          basis:
            "Reported MDF-ROI ranges where attribution is tracked; widely " +
            "unmeasured in practice, so the range is a planning anchor, not a " +
            "measured norm — most programs cannot evidence it at all",
          label: "planning-range",
        },
        dataSource:
          "Funded-activity outcomes (registered pipeline / sourced revenue) " +
          "attributed in PRM/CRM back to the MDF claim",
        whyItMatters:
          "The chronically UNMEASURED number — MDF is spent on faith more often " +
          "than on evidence. Where attribution exists it justifies (or kills) " +
          "channel-marketing spend; the binding honesty rule is to treat it as " +
          "an estimate and demand proof-of-performance, not assert a return.",
      },
      {
        key: "partner_onboarding_time_to_first_deal",
        name: "Partner onboarding time-to-first-deal",
        definition:
          "Average elapsed time from a partner being recruited / activated to " +
          "their first registered or closed deal — the speed at which a new " +
          "partner becomes productive.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 60,
          high: 180,
          basis:
            "Partner-activation ranges; well-enabled programs with clear " +
            "onboarding and quick certification reach first deal in 2-3 months, " +
            "poorly enabled programs leave partners dormant for 6+ months",
          label: "planning-range",
        },
        dataSource:
          "PRM onboarding milestones matched to first registered/closed deal in " +
          "the CRM",
        whyItMatters:
          "The leading indicator of recruitment ROI — most recruited partners " +
          "never transact, and the longer to first deal, the higher the dormancy " +
          "rate. Compressing it is the difference between a recruited logo and a " +
          "producing partner.",
      },
      {
        key: "active_partner_ratio",
        name: "Active-partner ratio",
        definition:
          "Share of recruited / enrolled partners that produced a registered or " +
          "closed deal in a trailing period — the producing core versus the " +
          "dormant long tail of the partner roster.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "Partner-productivity ranges; channel revenue is heavily concentrated " +
            "(a Pareto tail), so even strong programs see only 20-40% of enrolled " +
            "partners actively transacting in a period",
          label: "planning-range",
        },
        dataSource:
          "PRM partner roster matched to deal activity (registered/closed) over " +
          "the trailing period",
        whyItMatters:
          "Exposes the dormant-roster problem — a big partner count is vanity if " +
          "most never transact. The ratio and its concentration tell you whether " +
          "to recruit more, re-activate the tail, or invest in the producing core.",
      },
      {
        key: "partner_satisfaction_psat",
        name: "Partner satisfaction (PSAT)",
        definition:
          "Survey-based satisfaction / advocacy score from partners on the " +
          "program — deal-reg, MDF, enablement, support, and ease of doing " +
          "business — the partner-side equivalent of NPS/CSAT.",
        unit: "score (0-100 or NPS)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Partner-survey planning ranges (NPS-style); ease-of-doing-business " +
            "and deal-reg responsiveness dominate the score, and partners run " +
            "multiple vendors so advocacy is hard-won",
          label: "planning-range",
        },
        dataSource:
          "Partner satisfaction / advocacy survey, segmented by tier and motion",
        whyItMatters:
          "Partners are not captive — they carry competing lines and steer deals " +
          "to whoever is easiest. PSAT is the leading indicator of mindshare and " +
          "of whether partners will register and co-sell with you or a rival.",
      },
      {
        key: "cosell_marketplace_revenue_growth",
        name: "Co-sell / marketplace revenue growth",
        definition:
          "Period-over-period growth in revenue transacted through co-sell " +
          "motions and hyperscaler / cloud marketplaces — the fastest-growing " +
          "channel motion.",
        unit: "% YoY growth",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 100,
          basis:
            "Marketplace / co-sell growth ranges; this motion is growing far " +
            "faster than traditional resale off a smaller base, but margin (the " +
            "marketplace take) and customer-ownership terms are contested",
          label: "planning-range",
        },
        dataSource:
          "Marketplace transaction reports (AWS / Azure / GCP) and co-sell " +
          "outcomes in the CRM/PRM",
        whyItMatters:
          "The growth engine of modern channel — but its economics are contested: " +
          "the hyperscaler take-rate compresses margin and marketplace terms can " +
          "obscure end-customer ownership. Growth must be read with the margin " +
          "and ownership caveats, not celebrated as clean revenue.",
      },
      {
        key: "channel_conflict_rate",
        name: "Channel-conflict / deal-reg-dispute rate",
        definition:
          "Rate of channel-conflict incidents — direct-vs-partner or partner-vs-" +
          "partner disputes over deal ownership, deal-reg overlaps, and pricing " +
          "collisions — per registered/active deals in the period.",
        unit: "% of registered deals",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 10,
          basis:
            "Channel-conflict incidence planning ranges; healthy programs with " +
            "clear rules-of-engagement keep disputes low-single-digit, weak " +
            "governance sees double-digit collisions that erode partner trust",
          label: "planning-range",
        },
        dataSource:
          "PRM / CRM dispute and conflict-escalation log against registered/" +
          "active deal volume",
        whyItMatters:
          "Channel conflict and deal-reg disputes are the fastest way to lose " +
          "partner trust and disengage the channel. The rate and its direction " +
          "(direct-vs-partner vs partner-vs-partner) reveal whether rules-of-" +
          "engagement are working.",
      },
      {
        key: "partner_certification_coverage",
        name: "Partner certification / enablement coverage",
        definition:
          "Share of active partners (or partner sellers/engineers) holding the " +
          "current required certifications / enablement for the products they " +
          "sell — a decaying asset that needs continuous reinvestment.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Partner-enablement coverage ranges; certifications lapse as products " +
            "and staff churn, so even mature programs must continuously re-enable " +
            "to hold 70-80% currency",
          label: "planning-range",
        },
        dataSource:
          "Partner LMS / certification system matched to the active-partner and " +
          "partner-seller roster in the PRM",
        whyItMatters:
          "Enablement decays without continuous investment — certified partners " +
          "sell more, sell accurately, and create less support load, but currency " +
          "erodes with product and staffing churn. Coverage is the proxy for " +
          "whether the channel can actually sell what it carries.",
      },
      {
        key: "revenue_per_active_partner",
        name: "Revenue per active partner",
        definition:
          "Partner-sourced revenue divided by the count of active (transacting) " +
          "partners in the period — the productivity of the producing core, " +
          "exposing concentration.",
        unit: "USD per active partner",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 100000,
          high: 1000000,
          basis:
            "Wide planning range by segment and ACV; transactional-volume " +
            "channels sit low and concentrated strategic-partner models sit high " +
            "— read directionally within a segment, not as an absolute",
          label: "planning-range",
        },
        dataSource:
          "Partner-sourced revenue from the CRM over the active-partner count " +
          "from the PRM, by tier",
        whyItMatters:
          "Cuts through roster vanity to producer productivity and concentration " +
          "— if a handful of partners drive most revenue, the program is " +
          "dependency-risked and the tail is a cost, not an asset.",
      },
      {
        key: "partner_retention_rate",
        name: "Partner retention rate (producing-partner churn)",
        definition:
          "Share of previously-producing partners that remain active (or do not " +
          "go dormant / leave the program) period-over-period — the complement " +
          "is producing-partner churn.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis:
            "Producing-partner retention ranges; strong, well-supported programs " +
            "retain 85-90% of producers, neglected channels see producers go " +
            "dormant or defect to easier-to-work-with vendors",
          label: "planning-range",
        },
        dataSource:
          "PRM producing-partner cohorts tracked period-over-period for continued " +
          "activity, dormancy, or program exit",
        whyItMatters:
          "Losing a producing partner forfeits their installed base and pipeline " +
          "and is far costlier than recruiting a new logo. Retention is the " +
          "compounding lever — and the honest test of whether the program is " +
          "easy and rewarding to do business with.",
      },
    ],

    painThemes: [
      {
        key: "attribution_murk",
        name: "Attribution murk — influenced revenue is estimated, not proven",
        description:
          "Because the company does not own the end-customer data, partner-" +
          "sourced vs partner-influenced revenue is murky: influence is self-" +
          "reported by partners, double-counts with direct, and is quoted upward " +
          "as a large multiple of sourced — so the channel's headline contribution " +
          "number cannot be trusted by finance.",
        detectionSignal:
          "Influenced-revenue claims far exceeding sourced, no clean sourced-vs-" +
          "influenced split, partner self-attribution accepted without reconciliation " +
          "to direct, finance discounting channel numbers heavily.",
        diagnosticQuestion:
          "Can you separate partner-SOURCED (booked-through, registered) revenue " +
          "from partner-INFLUENCED, and is influenced reconciled against direct " +
          "attribution — or is it self-reported by partners and quoted as the " +
          "headline number?",
      },
      {
        key: "unmeasured_mdf_roi",
        name: "Unmeasured MDF / co-op ROI",
        description:
          "Market-development and co-op funds are allocated and claimed largely " +
          "on faith: proof-of-performance is weak or absent, funded activity is " +
          "not attributed back to sourced pipeline, and balances are either left " +
          "unclaimed or paid without evidence — so the return on channel-marketing " +
          "spend is chronically unknown.",
        detectionSignal:
          "MDF claims approved without proof-of-performance, no attribution from " +
          "funded activity to registered pipeline, large unclaimed balances or " +
          "year-end spend-it-or-lose-it dumps, no MDF-ROI figure at all.",
        diagnosticQuestion:
          "For your MDF / co-op spend, do you require proof-of-performance and " +
          "attribute funded activity back to partner-sourced pipeline, or is the " +
          "ROI effectively unmeasured?",
      },
      {
        key: "enablement_decay",
        name: "Enablement decay & dormant roster",
        description:
          "Partner enablement is a decaying asset: certifications lapse as " +
          "products and partner staff churn, onboarding is slow, and most " +
          "recruited partners never transact — leaving a large dormant tail and " +
          "a channel that cannot accurately sell what it carries without " +
          "continuous reinvestment.",
        detectionSignal:
          "Low active-partner ratio, long onboarding time-to-first-deal, lapsed " +
          "certification coverage, a big recruited roster with revenue " +
          "concentrated in a handful of partners, recurring 'partner didn't know " +
          "the product' support escalations.",
        diagnosticQuestion:
          "What share of your recruited partners actually transact, how long to " +
          "their first deal, and is certification/enablement coverage current — " +
          "or has it decayed into a dormant roster?",
      },
      {
        key: "channel_conflict",
        name: "Channel conflict & deal-registration disputes",
        description:
          "Direct-vs-partner and partner-vs-partner collisions over deal " +
          "ownership, overlapping registrations, and pricing erode trust: " +
          "unclear rules-of-engagement, slow or inconsistent deal-reg decisions, " +
          "and a direct team that competes with the channel push partners to " +
          "disengage or sell a competitor.",
        detectionSignal:
          "High dispute / conflict-escalation rate, deal-reg overlaps and " +
          "rejections for conflict, partners complaining direct 'took' their " +
          "deals, inconsistent rules-of-engagement enforcement, registration " +
          "decisions varying by who decides.",
        diagnosticQuestion:
          "What is your channel-conflict / deal-reg-dispute rate, and do you have " +
          "enforced rules-of-engagement governing direct-vs-partner and partner-" +
          "vs-partner deal ownership?",
      },
      {
        key: "marketplace_margin_ownership",
        name: "Marketplace / co-sell margin & ownership contest",
        description:
          "The fastest-growing motion carries contested economics: the " +
          "hyperscaler marketplace take-rate compresses margin, co-sell credit " +
          "is fought over between the company, the partner, and the cloud, and " +
          "marketplace transaction terms can obscure who owns the end-customer " +
          "relationship and renewal — so growth is real but not clean.",
        detectionSignal:
          "Rapid marketplace growth reported without margin (take-rate) net-down, " +
          "disputes over co-sell attribution credit, unclear end-customer " +
          "ownership / renewal rights on marketplace deals, finance surprised by " +
          "the marketplace fee line.",
        diagnosticQuestion:
          "For marketplace and co-sell revenue, do you track it NET of the " +
          "marketplace take-rate and have clear terms on co-sell credit and end-" +
          "customer / renewal ownership, or is growth reported gross and " +
          "ownership contested?",
      },
      {
        key: "partner_data_blindspot",
        name: "Partner-data & end-customer blind spot",
        description:
          "The company does not own the end-customer relationship or data in the " +
          "indirect motion, so partner-reported pipeline is lower-fidelity, end-" +
          "customer install base and health are invisible, and the company cannot " +
          "independently validate partner forecasts, renewals, or even who the " +
          "ultimate customer is.",
        detectionSignal:
          "Reliance on partner-reported pipeline and forecasts with no " +
          "independent validation, no visibility into end-customer install base " +
          "or renewals on channel deals, surprise churn discovered only after " +
          "the fact, no shared data exchange with key partners.",
        diagnosticQuestion:
          "How much visibility do you have into the end-customer behind your " +
          "partner deals — install base, health, renewal — or are you flying on " +
          "partner-reported data you cannot independently validate?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_deal_reg_triage",
        name: "AI deal-registration triage & conflict detection",
        valueMechanism:
          "AI auto-screens incoming deal-registration requests for completeness, " +
          "duplicates, and direct/partner conflict against existing registered " +
          "and direct pipeline, auto-approving clean low-risk registrations and " +
          "routing collisions to a human with the conflict surfaced — compressing " +
          "deal-reg cycle time and reducing channel-conflict disputes.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "PRM deal-registration submissions and historical decisions/reason codes",
          "CRM direct and partner pipeline to detect overlaps and conflict",
          "Rules-of-engagement and approval thresholds to encode auto-approve logic",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-approve only clean, low-value, no-conflict registrations; route conflicts to human",
          "A wrong auto-approval grants margin protection and is hard to claw back — tune precision",
          "Conflict detection depends on direct-pipeline data quality; flag low-confidence overlaps",
        ],
        metricsMoved: [
          "deal_reg_cycle_time",
          "deal_reg_approval_rate",
          "channel_conflict_rate",
        ],
      },
      {
        key: "ai_partner_attribution",
        name: "AI partner-attribution & sourced-vs-influenced reconciliation",
        valueMechanism:
          "AI reconciles partner self-reported influence and co-sell claims " +
          "against direct pipeline and registration data to separate clean " +
          "partner-SOURCED revenue from estimated influenced, de-duplicating " +
          "double-counted touches and quantifying the confidence of each " +
          "attribution — turning a murky headline into an honest sourced number " +
          "with a hedged influenced estimate.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Deal-registration and partner-sourced flags in PRM/CRM",
          "Partner self-reported influence / co-sell claims",
          "Direct pipeline and opportunity touch history to reconcile against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Influenced attribution remains an estimate — output a confidence, never assert it as booked",
          "Do not let the model launder self-reported influence into a hard number",
          "End-customer data is partner-owned and sparse; flag where reconciliation is unverifiable",
        ],
        metricsMoved: [
          "partner_sourced_revenue_pct",
          "partner_influenced_revenue_pct",
        ],
      },
      {
        key: "ai_mdf_optimization",
        name: "AI MDF / co-op proof-of-performance & ROI attribution",
        valueMechanism:
          "AI validates MDF claims against proof-of-performance evidence, flags " +
          "low-evidence or anomalous claims, and attributes funded activity back " +
          "to registered pipeline and sourced revenue — converting MDF from " +
          "spend-on-faith into a measured program, lifting utilization on high-ROI " +
          "activity and starving unproven spend.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "MDF allocations, claims, and proof-of-performance artifacts in the PRM",
          "Funded-activity outcomes (leads, registered pipeline, sourced revenue)",
          "Partner and activity history to baseline expected ROI",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Fund-claim approval/denial requires human sign-off — AI flags, it does not pay",
          "ROI attribution is estimated; present as a planning figure, not a proven return",
          "Anomaly flags must avoid penalizing legitimate brand/long-cycle activity unfairly",
        ],
        metricsMoved: [
          "mdf_roi",
          "mdf_utilization_rate",
          "partner_sourced_pipeline_coverage",
        ],
      },
      {
        key: "ai_partner_enablement",
        name: "AI partner enablement, onboarding & co-pilot",
        valueMechanism:
          "AI personalizes partner onboarding paths, surfaces just-in-time " +
          "product and competitive content to partner sellers, drafts deal-" +
          "specific proposals, and recommends certification refreshes as " +
          "currency lapses — compressing time-to-first-deal and holding " +
          "enablement coverage current against decay.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Partner LMS / certification and onboarding-milestone data",
          "Product, pricing, and competitive enablement content corpus",
          "Partner-seller activity and deal context to personalize and recommend",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Generated proposals/content must stay within approved pricing and claims — human review",
          "Personalization must not expose one partner's data to another (multi-partner fence)",
          "Certification recommendations assist; they do not waive a required human-graded credential",
        ],
        metricsMoved: [
          "partner_onboarding_time_to_first_deal",
          "partner_certification_coverage",
          "active_partner_ratio",
        ],
      },
      {
        key: "ai_partner_health_scoring",
        name: "AI partner health-scoring & churn / re-activation targeting",
        valueMechanism:
          "AI scores partner health and propensity to go dormant from engagement, " +
          "registration, certification-currency, and PSAT signals, and targets " +
          "the producing core for retention and the dormant tail for re-activation " +
          "or graceful exit — protecting producing-partner revenue and turning a " +
          "vanity roster into a managed portfolio.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Partner engagement, registration, and certification-currency signals",
          "Partner-sourced revenue and activity history by partner",
          "PSAT / survey and support-interaction signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Health scores guide channel-manager action, not automated program termination",
          "Concentration risk: do not let scoring over-invest only in the existing top tail",
          "Self-reported and partner-owned data limit signal quality; flag low-confidence scores",
        ],
        metricsMoved: [
          "partner_retention_rate",
          "active_partner_ratio",
          "revenue_per_active_partner",
        ],
      },
      {
        key: "ai_cosell_marketplace_matching",
        name: "AI co-sell matching & marketplace-listing optimization",
        valueMechanism:
          "AI matches the company's pipeline to the right co-sell partners and " +
          "hyperscaler programs, surfaces marketplace listing and private-offer " +
          "opportunities, and models the net economics after the marketplace " +
          "take-rate — accelerating the fastest-growing motion while keeping the " +
          "margin and ownership trade-offs explicit.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Pipeline and account data to match against partner capabilities/territories",
          "Marketplace (AWS/Azure/GCP) program, listing, and transaction data",
          "Partner capability, certification, and co-sell history",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Co-sell and private-offer terms (margin, take-rate, ownership) require human deal review",
          "Marketplace economics must be modeled NET of take-rate, not gross",
          "Matching must respect partner exclusivity and conflict rules-of-engagement",
        ],
        metricsMoved: [
          "cosell_marketplace_revenue_growth",
          "partner_sourced_revenue_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "prm_partner_data_foundation",
        name: "PRM & partner-data foundation",
        description:
          "A governed PRM as the system of record for the partner lifecycle — " +
          "recruitment, onboarding, tiering, deal registration, MDF, and " +
          "enablement — integrated with the CRM so partner-sourced and influenced " +
          "deals carry clean attribution flags and the partner roster, activity, " +
          "and program data live in one place.",
        boundary:
          "Owns partner master, program mechanics, and channel attribution flags; " +
          "does not own the end-customer relationship/data (partner-owned) or the " +
          "direct-sales forecast (Sales & Revenue Operations).",
        humanAccountabilityPoint: "Channel Operations / Partner Program Manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "tiered_partner_program",
        name: "Tiered partner-program & rules-of-engagement model",
        description:
          "A structured program with partner tiers (registered / silver / gold / " +
          "elite), tier-linked benefits and requirements (margin, MDF, support, " +
          "certification), and explicit rules-of-engagement governing deal " +
          "registration and direct-vs-partner / partner-vs-partner ownership — " +
          "the operating model that earns mindshare and contains channel conflict.",
        boundary:
          "Owns program tiers, benefits, requirements, and conflict rules-of-" +
          "engagement; does not own list pricing or the direct comp plan (it sets " +
          "the channel margin and protection on top of them).",
        humanAccountabilityPoint: "VP Channel / Partner Programs Leader",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "closed_loop_mdf_governance",
        name: "Closed-loop MDF / co-op governance model",
        description:
          "A discipline that allocates MDF against a plan, requires proof-of-" +
          "performance to claim, and attributes funded activity back to registered " +
          "pipeline and sourced revenue — so channel-marketing spend is measured " +
          "and steered to high-ROI activity rather than paid on faith or dumped " +
          "at year-end.",
        boundary:
          "Owns MDF allocation, claim approval, and ROI attribution method; does " +
          "not own the partner's marketing execution itself (it funds and measures " +
          "it).",
        humanAccountabilityPoint: "Channel Marketing / MDF Program Manager",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "cosell_alliance_motion",
        name: "Co-sell & marketplace alliance motion",
        description:
          "A structured alliance operating model for co-selling with hyperscalers " +
          "and transacting through cloud marketplaces — joint pipeline, co-sell " +
          "credit and attribution rules, marketplace listings and private offers, " +
          "and explicit terms on margin (take-rate) and end-customer / renewal " +
          "ownership — to scale the fastest-growing motion with eyes open.",
        boundary:
          "Owns the alliance and co-sell motion, marketplace listings, and the " +
          "net-of-take-rate economics; does not own the hyperscaler's program " +
          "terms (it negotiates within them) or the direct relationship with that " +
          "alliance partner's field.",
        humanAccountabilityPoint: "Alliances / Co-Sell & Marketplace Leader",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Channel value is realized on linked levers, but the binding truths gate " +
        "every one of them. The defensible prize is set by partner-SOURCED " +
        "(booked-through, registered) revenue — the clean number — not partner-" +
        "INFLUENCED revenue, which is self-reported, double-counts direct, and is " +
        "the most over-stated figure in the function. On that base, value comes " +
        "from (1) CHANNEL LEVERAGE & REACH — partners selling into segments and " +
        "geographies the direct team cannot economically cover; (2) PARTNER " +
        "PRODUCTIVITY — compressing onboarding time-to-first-deal, lifting the " +
        "active-partner ratio, and retaining producers so the program scales " +
        "without proportional direct headcount; (3) PROGRAM EFFICIENCY — MDF / " +
        "co-op and enablement spend earning measured ROI rather than being spent " +
        "on faith; and (4) CO-SELL / MARKETPLACE growth, the fastest motion. But " +
        "the headline INFLUENCED-revenue number leaks credibility on the way to " +
        "the CFO: it is estimated, not proven. So durable value is sized on " +
        "partner-SOURCED revenue with influenced hedged as a planning estimate, " +
        "MDF/enablement held to proof-of-performance, and marketplace revenue " +
        "taken NET of the hyperscaler take-rate — never on a gross influenced " +
        "headline.",
      dominantHaircutFactors: [
        {
          factor: "Attribution over-statement (influenced vs sourced)",
          rationale:
            "The dominant haircut: influenced-revenue claims are self-reported, " +
            "double-count direct, and are quoted as a large multiple of sourced. " +
            "A value case built on influenced must be discounted hard to the " +
            "clean partner-sourced base before any leverage is claimed.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Observed gap between self-reported influenced revenue and clean " +
              "partner-sourced/booked revenue once direct double-counting is removed",
            label: "planning-range",
          },
        },
        {
          factor: "Partner productivity & dormant-roster reality",
          rationale:
            "Most recruited partners never transact and revenue concentrates in " +
            "a small producing core, so value sized on roster size or recruited " +
            "logos over-states reach. The realizable prize is gated by the active-" +
            "partner ratio, onboarding speed, and producer retention.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reduction in expected channel revenue once dormant-partner reality " +
              "and producer concentration replace recruited-roster assumptions",
            label: "planning-range",
          },
        },
        {
          factor: "Program-spend leakage (unmeasured MDF & enablement decay)",
          rationale:
            "MDF / co-op spent without proof-of-performance and enablement that " +
            "decays without reinvestment erode the return on channel investment. " +
            "Value must be net of the program spend that cannot be evidenced to " +
            "drive sourced pipeline.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Share of MDF/enablement investment that cannot be attributed to " +
              "sourced pipeline or lands on dormant/lapsed partners",
            label: "planning-range",
          },
        },
        {
          factor: "Marketplace take-rate & ownership terms",
          rationale:
            "Co-sell and marketplace growth is real but its margin is compressed " +
            "by the hyperscaler take-rate and its end-customer / renewal ownership " +
            "is contested. Gross marketplace revenue over-states net value; it " +
            "must be discounted to the net-of-take economics.",
          typicalHaircut: {
            low: 0.05,
            high: 0.2,
            basis:
              "Hyperscaler marketplace take-rate ranges and co-sell credit " +
              "dilution applied to gross marketplace revenue",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Partner-sourced revenue mix lift (channel reach)",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Incremental partner-sourced revenue mix achievable as a channel " +
              "program matures from emerging to channel-led; higher where the " +
              "direct team cannot economically cover the segment/geo",
            label: "planning-range",
          },
          measuredAs:
            "Increase in partner-sourced (booked-through) revenue as a share of " +
            "total revenue, on the clean sourced base (not influenced)",
        },
        {
          lever: "MDF / co-op ROI on attributed activity",
          range: {
            low: 3,
            high: 10,
            basis:
              "Reported MDF-ROI where attribution exists; treated as a planning " +
              "anchor because the figure is chronically unmeasured in practice",
            label: "planning-range",
          },
          measuredAs:
            "Partner-sourced pipeline or revenue per MDF dollar on proof-of-" +
            "performance-validated, attributed activity",
        },
        {
          lever: "Partner-productivity gain (active ratio & time-to-first-deal)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Improvement in active-partner ratio and compression of onboarding " +
              "time-to-first-deal from enablement and health-scoring investment",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in producing partners and reduction in time-to-first-" +
            "deal across the recruited roster",
        },
      ],
      timeToValueBand:
        "Deal-reg automation and partner-attribution clean-up: 1-2 quarters to " +
        "stand up on existing PRM/CRM data. Enablement and onboarding " +
        "compression and MDF proof-of-performance governance: 2-4 quarters to " +
        "show in active-partner ratio and time-to-first-deal. Partner-sourced " +
        "revenue mix lift and producer retention compound over 12-24 months as " +
        "the producing core grows. Co-sell / marketplace motion scales over " +
        "12-36 months and depends on alliance maturity and marketplace terms.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Partner Relationship Management (PRM)",
          role:
            "System of record for the partner lifecycle — recruitment, " +
            "onboarding, tiering, deal registration, MDF, and the partner portal " +
            "— and the source of partner-attribution flags.",
          examples: ["Salesforce PRM", "Impartner", "ZINFI", "Channeltivity"],
        },
        {
          name: "CRM (channel/partner-aware)",
          role:
            "Holds opportunities and revenue with partner-sourced / influenced " +
            "flags and co-sell tagging; the join between channel attribution and " +
            "booked revenue.",
          examples: ["Salesforce Sales Cloud", "Microsoft Dynamics 365 Sales", "HubSpot"],
        },
        {
          name: "Cloud / hyperscaler marketplaces & co-sell programs",
          role:
            "Transaction and co-sell system of record for the marketplace motion " +
            "— listings, private offers, co-sell registrations, and net-of-take-" +
            "rate transaction reporting.",
          examples: [
            "AWS Marketplace / ACE",
            "Microsoft Azure Marketplace / commercial marketplace",
            "Google Cloud Marketplace",
          ],
        },
        {
          name: "Partner LMS / enablement & certification system",
          role:
            "Partner training, certification, and content enablement — the source " +
            "of certification-currency and onboarding-milestone data.",
          examples: ["Partner LMS (e.g. Docebo, Mindtickle)", "Vendor partner-university platforms"],
        },
        {
          name: "MDF / co-op management & through-channel marketing (TCMA)",
          role:
            "Allocation, claim, proof-of-performance, and attribution of market-" +
            "development funds and through-channel marketing campaigns.",
          examples: ["Impartner TCMA", "ZINFI TCMA", "PRM-native MDF modules"],
        },
      ],
      roles: [
        {
          title: "VP Channel / Chief Partner Officer",
          accountability:
            "Partner-sourced revenue, program design and economics, channel-" +
            "conflict governance, and the credibility of channel numbers with the " +
            "CRO/CFO.",
        },
        {
          title: "Channel Account Manager (CAM) / Partner Account Manager",
          accountability:
            "The producing partners in a territory — their pipeline, enablement, " +
            "co-sell, and retention — and resolving deal-reg conflict in-field.",
        },
        {
          title: "Channel Operations / Partner Program Manager",
          accountability:
            "PRM and program mechanics, deal-registration workflow and rules-of-" +
            "engagement, tier administration, and partner-attribution data quality.",
        },
        {
          title: "Channel Marketing / MDF Program Manager",
          accountability:
            "MDF / co-op allocation and governance, proof-of-performance, through-" +
            "channel marketing, and MDF-ROI attribution.",
        },
        {
          title: "Alliances / Co-Sell & Marketplace Leader",
          accountability:
            "Hyperscaler alliances, the co-sell motion, marketplace listings and " +
            "private offers, and the net-of-take-rate economics and ownership terms.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Channel / antitrust & resale-pricing constraints (RPM, MAP)",
          relevance:
            "Resale pricing, minimum-advertised-price (MAP) policy, exclusivity, " +
            "and territory restrictions in partner agreements are constrained by " +
            "competition / antitrust law (resale price maintenance) — program and " +
            "AI pricing/matching logic must respect these limits.",
        },
        {
          name: "Anti-bribery & corruption on partners (FCPA, UK Bribery Act)",
          relevance:
            "Partners and resellers acting on the company's behalf create FCPA / " +
            "anti-bribery exposure; partner due diligence, MDF, and incentive " +
            "payments must screen for corruption and sanctioned-party risk.",
        },
        {
          name: "Data-sharing, privacy & end-customer data ownership",
          relevance:
            "Sharing leads, pipeline, and end-customer data across the company, " +
            "partners, and marketplaces is governed by privacy law and contract; " +
            "AI attribution/matching must respect end-customer data ownership and " +
            "the multi-partner data fence.",
        },
        {
          name: "Marketplace & co-sell program terms",
          relevance:
            "Hyperscaler marketplace and co-sell programs impose take-rates, " +
            "listing, and co-sell rules that shape channel economics and end-" +
            "customer / renewal ownership; they are contractual constraints the " +
            "motion operates within.",
        },
      ],
      canonicalTerms: [
        {
          term: "Partner-sourced vs partner-influenced revenue",
          definition:
            "Sourced = booked through a partner who originated and registered " +
            "the deal (clean, attributable). Influenced = a partner touched/co-" +
            "sold but did not transact (estimated, overlaps direct). The honest " +
            "channel number is sourced.",
        },
        {
          term: "Deal registration",
          definition:
            "The mechanism by which a partner registers an opportunity to claim " +
            "protection / margin on it; the core trust and conflict-management " +
            "instrument of a channel program.",
        },
        {
          term: "MDF / co-op funds",
          definition:
            "Market-development funds (allocated to drive demand) and co-op funds " +
            "(reimbursing partner marketing) — channel-marketing investment that " +
            "should be claimed against proof-of-performance.",
        },
        {
          term: "Channel conflict & rules-of-engagement",
          definition:
            "Conflict over deal ownership between direct and partner, or between " +
            "partners; rules-of-engagement are the published rules that govern " +
            "who owns and is protected on a deal.",
        },
        {
          term: "Co-sell & marketplace take-rate",
          definition:
            "Co-sell = selling jointly with an alliance partner (often a " +
            "hyperscaler) for shared credit; the marketplace take-rate is the " +
            "percentage the marketplace retains, which compresses net margin.",
        },
        {
          term: "Two-tier distribution",
          definition:
            "An indirect model where the vendor sells to distributors who sell " +
            "to resellers/VARs who sell to the end customer — adding reach but " +
            "further distancing the vendor from end-customer data.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Partner-sourced vs partner-influenced revenue",
        authoritativeSource:
          "CRM opportunities with deal-registration / partner-sourced flags " +
          "reconciled to booked revenue, with influenced tagged separately",
        whatGoodEvidenceLooksLike:
          "Partner-SOURCED (booked-through, registered) revenue reported as the " +
          "clean number, with influenced shown separately as an estimate, de-" +
          "duplicated against direct, and its confidence flagged.",
        weakEvidenceToReject:
          "A headline 'partners drive ~X% of revenue' built on self-reported " +
          "influenced revenue, double-counting direct, with no sourced-vs-" +
          "influenced split.",
      },
      {
        claim: "MDF / co-op utilization and ROI",
        authoritativeSource:
          "PRM / MDF module: allocated, claimed, proof-of-performance-approved " +
          "funds attributed to registered pipeline and sourced revenue",
        whatGoodEvidenceLooksLike:
          "MDF utilization with proof-of-performance on claims AND funded activity " +
          "attributed to registered pipeline / sourced revenue, with ROI shown as " +
          "a planning estimate, not an asserted return.",
        weakEvidenceToReject:
          "MDF spend or 'utilization' reported with no proof-of-performance and " +
          "no attribution to pipeline — or an MDF-ROI number asserted as proven.",
      },
      {
        claim: "Partner productivity, activation, and retention",
        authoritativeSource:
          "PRM partner roster matched to CRM deal activity — onboarding " +
          "milestones, first-deal dates, active/dormant status, and producer " +
          "retention cohorts",
        whatGoodEvidenceLooksLike:
          "Active-partner ratio, onboarding time-to-first-deal, certification " +
          "coverage, and producer retention by tier, with the producing-core " +
          "concentration shown — not a raw recruited-partner count.",
        weakEvidenceToReject:
          "A recruited-partner count or 'we have N partners' presented as channel " +
          "strength, with no active ratio, productivity, or retention behind it.",
      },
      {
        claim: "Co-sell / marketplace revenue and channel conflict",
        authoritativeSource:
          "Marketplace transaction reports (net of take-rate) and the PRM/CRM " +
          "deal-reg dispute and conflict-escalation log",
        whatGoodEvidenceLooksLike:
          "Marketplace / co-sell revenue reported NET of take-rate with ownership " +
          "terms noted, and channel-conflict rate quantified against registered " +
          "deals with the direct-vs-partner vs partner-vs-partner split.",
        weakEvidenceToReject:
          "Gross marketplace growth with no take-rate net-down or ownership " +
          "terms, or a 'channel conflict is low' assertion with no dispute-rate " +
          "evidence.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Can you separate partner-SOURCED (booked-through, registered) revenue from partner-INFLUENCED, and is influenced reconciled against direct, or self-reported by partners and quoted as the headline number?",
      "For your MDF / co-op spend, do you require proof-of-performance and attribute funded activity back to partner-sourced pipeline, or is the ROI effectively unmeasured?",
      "What share of recruited partners actually transact (active-partner ratio), how long to their first deal, and is certification/enablement coverage current — or has it decayed into a dormant roster?",
      "What is your deal-registration approval rate and cycle time, and do you have enforced rules-of-engagement governing direct-vs-partner and partner-vs-partner deal ownership?",
      "For marketplace and co-sell revenue, do you track it NET of the marketplace take-rate, with clear terms on co-sell credit and end-customer / renewal ownership?",
      "How much visibility do you have into the end-customer behind partner deals — install base, health, renewal — or are you flying on partner-reported data you cannot independently validate?",
      "What is your partner-sourced pipeline coverage against the channel target, and how reliable is partner-reported pipeline versus direct?",
    ],
    maturitySignals: [
      "Partner-sourced (registered, booked-through) revenue is tracked cleanly and reported separately from influenced, which is hedged as an estimate, not asserted.",
      "MDF / co-op requires proof-of-performance and funded activity is attributed back to registered pipeline, so channel-marketing ROI is measured, not assumed.",
      "The partner roster is managed as a portfolio — active-partner ratio, time-to-first-deal, certification currency, and producer retention are tracked and acted on.",
      "Deal registration is fast and rules-of-engagement are enforced, so channel-conflict and dispute rates are low and partners trust the program.",
      "Marketplace / co-sell revenue is reported net of take-rate with clear ownership terms, and the motion is scaled with eyes open to its contested economics.",
    ],
    redFlags: [
      "Channel contribution is quoted as a headline partner-INFLUENCED number — self-reported, double-counting direct — with no clean partner-sourced split, so finance discounts it.",
      "MDF / co-op is allocated and claimed without proof-of-performance and with no attribution to sourced pipeline — the ROI is unknown and spend is on faith.",
      "A large recruited roster masks a low active-partner ratio, slow onboarding, and lapsed certifications — the channel is dormant and cannot accurately sell what it carries.",
      "Channel conflict and deal-reg disputes are high and rules-of-engagement are unenforced, so partners disengage or steer deals to a competitor.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "PRM platforms (Salesforce PRM, Impartner, ZINFI, Channeltivity)",
        category: "Partner relationship management, portal, deal-reg, tiering, MDF",
        switchingCost:
          "High — the partner portal, onboarding flows, deal-reg workflow, MDF history, and CRM integration accrete; re-enabling partners and migrating program data is the real cost.",
        renewalDynamics:
          "Subscription by partner / user count and modules; AI deal-reg, TCMA, and analytics increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Through-channel marketing automation / MDF (Impartner TCMA, ZINFI)",
        category: "Through-channel marketing, MDF / co-op management and attribution",
        switchingCost:
          "Moderate — campaign templates, partner marketing assets, and MDF history accrete, but it is replaceable; switching cost rises with the depth of TCMA automation built.",
        renewalDynamics:
          "Subscription by partner/campaign volume; proof-of-performance and attribution depth are the negotiation levers.",
      },
      {
        vendorName: "Partner LMS / enablement (Docebo, Mindtickle, vendor partner-universities)",
        category: "Partner training, certification, content enablement",
        switchingCost:
          "Moderate — certification records, learning paths, and content accrete; migrating credentials and re-authoring paths is the friction.",
        renewalDynamics:
          "Subscription by learner / partner-seat count; certification breadth and AI personalization upsold.",
      },
      {
        vendorName: "Hyperscaler marketplaces & co-sell programs (AWS, Azure, GCP)",
        category: "Marketplace transaction, co-sell, private offers",
        switchingCost:
          "High — listings, private-offer history, co-sell relationships, and the buyer's procurement preference for marketplace accrete; the take-rate and terms are largely non-negotiable platform terms.",
        renewalDynamics:
          "Take-rate (marketplace fee) on transacted revenue, with program-tier incentives; the lever is co-sell credit, listing placement, and committed-spend draw-down eligibility, not the fee itself.",
      },
      {
        vendorName: "Channel data / ecosystem-intelligence (e.g. partner-ecosystem platforms)",
        category: "Ecosystem mapping, account overlap, co-sell intelligence",
        switchingCost:
          "Low-moderate — account-mapping and overlap data are re-establishable; value depends on the partner network connected.",
        renewalDynamics:
          "Subscription by user / connected-partner count; the lever is the breadth of the connected ecosystem and overlap insight delivered.",
      },
    ],
    switchingCosts:
      "The PRM core is the sticky layer — the partner portal, deal-reg workflow, " +
      "tier and MDF configuration, partner-attribution flags, and CRM integration " +
      "are the lock-in, and a re-platform forces re-enabling the entire partner " +
      "base (a multi-quarter program that partners feel). The TCMA, LMS, and " +
      "ecosystem-intelligence layers are more replaceable, with the curated data " +
      "(MDF history, certifications, account maps) the true switching cost. The " +
      "hyperscaler marketplace take-rate and program terms are largely non-" +
      "negotiable platform terms, not a vendor negotiation — the leverage there " +
      "is in co-sell credit, listing placement, and program-tier eligibility, not " +
      "the fee. The negotiable frontier is in the AI/analytics add-ons around the " +
      "PRM core and the best-of-breed TCMA and enablement layers.",
    negotiationLevers: [
      "Outcome / value pricing on AI deal-reg, attribution, and TCMA add-ons tied to measured partner-sourced revenue, MDF-ROI, or deal-reg cycle-time rather than partner seats",
      "Phase-gated pilot-to-scale with partner-attribution and MDF proof-of-performance proof before enterprise-wide partner rollout",
      "Data-export and attribution-flag portability rights to prevent partner-roster and MDF-history lock-in at re-platform",
      "Bundle PRM-native TCMA/LMS against best-of-breed at renewal to discipline pricing",
      "On marketplaces, negotiate co-sell credit, listing placement, and committed-spend draw-down eligibility — not the (largely fixed) take-rate — and model economics net of fee",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      attribution_claim: [
        "partner-SOURCED (registered, booked-through) revenue from CRM/PRM",
        "partner-influenced shown separately as an estimate, de-duplicated vs direct",
        "confidence flag on influenced attribution (self-reported)",
      ],
      program_spend_claim: [
        "MDF allocated / claimed / proof-of-performance-approved",
        "funded activity attributed to registered pipeline / sourced revenue",
        "MDF-ROI presented as a planning estimate, not asserted",
      ],
      partner_productivity_claim: [
        "active-partner ratio and producing-core concentration",
        "onboarding time-to-first-deal and certification coverage",
        "producer retention / churn by tier (not raw recruited count)",
      ],
      marketplace_cosell_claim: [
        "marketplace / co-sell revenue NET of take-rate",
        "co-sell credit and end-customer / renewal ownership terms",
        "growth read with the margin and ownership caveats",
      ],
      value_projection: [
        "partner-SOURCED revenue as the sized base (not influenced)",
        "explicit haircut factors (attribution over-statement, dormant roster, program-spend leakage, marketplace take-rate)",
        "MDF-ROI and influenced figures as labelled planning ranges",
        "marketplace revenue net of take-rate",
      ],
    },
    citationStandard:
      "Quantitative channel claims cite the system of record (PRM, CRM, " +
      "marketplace report, LMS, MDF module) and the partner tier and period. " +
      "Revenue-contribution claims carry the partner-SOURCED (registered, booked-" +
      "through) figure as the clean number and report influenced SEPARATELY as a " +
      "hedged estimate with a confidence flag — never an influenced number " +
      "presented as booked. MDF claims carry proof-of-performance and attribution " +
      "to registered pipeline, and MDF-ROI is a planning estimate, never an " +
      "asserted return. Marketplace / co-sell revenue is reported NET of the " +
      "take-rate with ownership terms noted. Value projections size on the " +
      "sourced base, name the haircut factors, and give labelled planning ranges " +
      "for influenced and MDF-ROI — never a single asserted channel number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant quotes partner-INFLUENCED revenue with no clean sourced split — frame channel contribution as the sourced figure and influenced as a hedged estimate, not the headline.",
      "MDF / co-op ROI is cited with no proof-of-performance or attribution — present it as a planning estimate and surface that it is chronically unmeasured.",
      "Channel reach or roster size is cited — discount to the active-partner ratio and producing-core concentration before claiming reach.",
      "Marketplace / co-sell growth is cited gross — net it down by the take-rate and note the contested end-customer / renewal ownership.",
    ],
    inferenceLanguage: [
      "Across indirect / channel-led go-to-market at this scale, partner-sourced revenue mix typically runs..., with influenced quoted much higher but heavily discounted by finance...",
      "Without your registered-deal and proof-of-performance data, the industry pattern suggests MDF-ROI of roughly..., but treat it as an estimate, not a measured return...",
      "Peer programs commonly see only... of recruited partners actively transacting, with revenue concentrated in a producing core...",
      "Treating this as a planning range on partner-SOURCED (booked-through) revenue rather than your self-reported influenced figure...",
    ],
    flagWithoutEvidence: [
      "A specific partner-influenced revenue or MDF-ROI number for this tenant",
      "This tenant's actual partner-sourced %, active-partner ratio, deal-reg metrics, or channel-conflict rate",
      "An influenced-revenue figure presented as booked/sourced without a registration basis",
      "A marketplace / co-sell revenue figure presented gross without the take-rate net-down",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "channel contribution / where does partner-sourced vs influenced revenue sit",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Stack revenue by direct, partner-sourced (registered), and partner-influenced (hedged estimate) so the clean channel number is separated from the self-reported one.",
    },
    {
      questionPattern:
        "channel value story / from influenced headline to defensible sourced value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      note: "Bridge from gross influenced revenue down to defensible partner-sourced value, showing the attribution, dormant-roster, program-spend, and marketplace-take haircuts explicitly.",
    },
    {
      questionPattern:
        "value sensitivity to attribution, partner productivity, MDF ROI, and take-rate",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of channel value sensitivity to the dominant haircut factors (attribution over-statement, dormant roster, program-spend leakage, marketplace take-rate).",
    },
    {
      questionPattern: "channel / partner KPI scorecard",
      exhibitKind: "table",
      note: "Partner-sourced %, influenced %, sourced-pipeline coverage, deal-reg approval rate + cycle time, MDF utilization + ROI, onboarding time-to-first-deal, active-partner ratio, PSAT, co-sell/marketplace growth, conflict rate, certification coverage, revenue per active partner, retention versus planning ranges.",
    },
    {
      questionPattern: "partner-portfolio prioritization / where to invest, re-activate, or exit",
      exhibitKind: "table",
      note: "Per partner/tier: partner-sourced revenue, active/dormant status, certification currency, onboarding stage, MDF utilization/ROI, health score, and recommended action (invest / enable / re-activate / exit).",
    },
    {
      questionPattern: "marketplace / co-sell growth net of take-rate",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend co-sell / marketplace revenue gross and NET of take-rate against the growth planning range, annotating ownership-term and margin caveats.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Partner-sourced (registered, booked-through) revenue is tracked cleanly and reported separately from a hedged influenced estimate, so channel numbers earn finance's trust",
      "MDF / co-op is held to proof-of-performance and funded activity is attributed to registered pipeline, so channel-marketing spend is measured and steered, not spent on faith",
      "The partner roster is managed as a portfolio — onboarding speed, active-partner ratio, certification currency, and producer retention are tracked and acted on, not vanity logo counts",
      "Deal registration is fast and rules-of-engagement are enforced, keeping channel conflict low and partner mindshare high",
    ],
    failureDrivers: [
      "Quoting partner-INFLUENCED revenue as the headline channel number — self-reported, double-counting direct — so finance discounts it and the channel loses credibility",
      "Spending MDF / co-op on faith with no proof-of-performance or attribution, leaving the return unknown and unmanaged",
      "Recruiting partners faster than enabling them, producing a dormant roster that cannot accurately sell and concentrates all revenue in a few producers",
      "Letting channel conflict and slow, inconsistent deal-reg disengage partners who then steer deals to easier-to-work-with competitors",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Deal-reg automation and partner-attribution clean-up adopt first because " +
      "they are low-risk and improve partner experience quickly. Enablement and " +
      "onboarding tooling and MDF proof-of-performance governance follow as the " +
      "program matures. The hard part is the behavior and trust work — enforcing " +
      "rules-of-engagement, holding MDF to evidence, and managing the producing " +
      "core vs the dormant tail — which depends on field channel managers and " +
      "lags. Co-sell / marketplace and AI attribution/matching are emerging and " +
      "scale last, gated by alliance maturity, marketplace terms, and the quality " +
      "of partner-owned data.",
    roiClarity: "low",
    roiClarityBasis:
      "Channel ROI clarity is structurally LOW because the company does not own " +
      "the end-customer data: partner-sourced revenue is measurable, but partner-" +
      "influenced is self-reported and double-counts direct, MDF / co-op ROI is " +
      "chronically unmeasured, and marketplace economics are obscured by the " +
      "take-rate and contested ownership. This is why the value model leans on " +
      "partner-SOURCED (booked-through) revenue and the evidence/hedge rules " +
      "force influenced and MDF-ROI to be hedged planning estimates with proof-" +
      "of-performance, and marketplace revenue to be reported net of take-rate — " +
      "rather than a single asserted channel-contribution number.",
  },

  regulatoryFrame: {
    name: "Channel antitrust/resale-pricing, anti-bribery on partners & data-sharing/ownership",
    relevance:
      "The dominant regulatory frame for the channel: resale-pricing, MAP, " +
      "exclusivity, and territory restrictions in partner agreements are " +
      "constrained by competition/antitrust law (resale price maintenance); " +
      "partners and resellers acting on the company's behalf create anti-bribery " +
      "exposure (FCPA, UK Bribery Act) requiring partner due diligence and " +
      "sanctioned-party screening on MDF and incentives; and sharing leads, " +
      "pipeline, and end-customer data across the company, partners, and " +
      "marketplaces is governed by privacy law, contract, and end-customer data " +
      "ownership. AI deal-reg, attribution, and matching must respect these " +
      "constraints and the multi-partner data fence (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
