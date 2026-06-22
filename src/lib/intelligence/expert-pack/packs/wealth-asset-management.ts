// Consilium expert — Wealth & Asset Management (industry-function).
//
// Wave (backlog) industry-function ExpertPack v2. Domain: the wealth and asset
// management value chain — advisor productivity and next-best-action, client
// onboarding / KYC, portfolio management & rebalancing, model portfolios,
// performance & reporting, fee / billing, custody / clearing operations, fund
// operations (NAV, reconciliation), and product / distribution. Anchored to the
// economics operators actually live, not the AUM-growth story the marketing
// deck tells.
//
// Honesty doctrine, stated bluntly so the pack reasons from truth:
//   (1) FEE COMPRESSION IS STRUCTURAL. Passive substitution and fee
//       transparency push effective fee bps down every year; AUM growth (market
//       beta + net flows) routinely MASKS margin erosion. "Revenue is up" is not
//       "the franchise is healthier" — read effective fee realization and
//       cost-to-serve, not headline AUM.
//   (2) ADVISOR CAPACITY IS THE REAL GROWTH LEVER, not more product. The
//       binding constraint on organic growth is advisor time and next-best-
//       action quality, not the size of the product shelf — most firms are
//       product-rich and capacity-poor.
//   (3) DATA FRAGMENTATION IS THE BOTTLENECK. Client, position, and household
//       data are scattered across custodians, OMS/PMS, and CRM, so "the single
//       household view" and "personalization at scale" are mostly UNREALIZED
//       aspirations, not deployed capability.
//   (4) REGULATION CONSTRAINS AUTOMATION. Suitability / best-interest (Reg BI),
//       fiduciary duty, and KYC mean advice and trading decisions keep a human
//       accountable; automation accelerates the advisor, it does not replace the
//       accountable judgment.
//
// Product-aware, not product-locked: references the dominant categories of
// systems (custodians, portfolio/OMS, performance/reporting, advisor CRM, model
// marketplaces) without assuming a single vendor.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

export const wealthAssetManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.financial-services.wealth-asset-management",
    expertName: "Wealth & Asset Management Expert",
    kind: "industry-function",
    industry: "financial_services",
    functionKey: "wealth-asset-management",
    scopeNote:
      "The wealth and asset management value chain: advisor productivity and " +
      "next-best-action, client onboarding / KYC, portfolio management & " +
      "rebalancing, model portfolios, performance & reporting, fee / billing, " +
      "custody / clearing operations, fund operations (NAV, reconciliation), " +
      "and product / distribution. Covers the trade-offs across advisor " +
      "capacity, organic (net-new-asset) growth, effective fee realization, " +
      "cost-to-serve, and operational exception rates — and is candid that fee " +
      "compression is structural (AUM growth masks margin erosion), that " +
      "advisor capacity (not more product) is the growth lever, that data " +
      "fragmentation across custodians/OMS/CRM caps 'personalization at " +
      "scale', and that suitability / best-interest and KYC keep a human " +
      "accountable for advice and trading. Excludes bank-side lending / deposit " +
      "economics, insurance underwriting, and FinCrime/AML operations — those " +
      "route to other experts.",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "aum_per_advisor",
        name: "AUM per advisor",
        definition:
          "Total client assets under management or advisement divided by the " +
          "number of producing advisor FTEs — the headline productivity proxy " +
          "for the advisory force.",
        unit: "USD millions/advisor",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 250,
          basis:
            "RIA/wirehouse advisor books vary sharply by segment and tenure; " +
            "mass-affluent books run lower, high-net-worth and team-based " +
            "practices run far higher, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Custody/PMS AUM aggregated by advisor of record, over producing " +
          "advisor headcount from HR/comp",
        whyItMatters:
          "The headline scale-of-book metric — but it is a vanity number when " +
          "read alone, because a large book on compressing fees and a heavy " +
          "service tail can be less profitable than a smaller, well-priced one. " +
          "Read it against effective fee bps and cost-to-serve, not in isolation.",
      },
      {
        key: "net_new_assets",
        name: "Net new assets / organic growth rate",
        definition:
          "Net flows (client contributions and new-household assets minus " +
          "withdrawals and lost households) as a percentage of beginning-of-" +
          "period AUM — growth stripped of market movement.",
        unit: "% of beginning AUM",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Organic growth ranges for established wealth franchises; many " +
            "mature books grow low single digits ex-market, strong gatherers " +
            "clear high single digits, industry reporting + operator experience",
          label: "planning-range",
        },
        dataSource:
          "Custody flow records: gross inflows, outflows, and household " +
          "additions/losses, net of market appreciation",
        whyItMatters:
          "The only honest growth signal — it separates genuine franchise " +
          "health from market beta. Headline AUM growth in a bull market hides a " +
          "book that is leaking households; organic growth exposes whether the " +
          "advisory engine actually wins and keeps clients.",
      },
      {
        key: "effective_fee_bps",
        name: "Effective fee realization (bps)",
        definition:
          "Total advisory/management revenue divided by average AUM, expressed " +
          "in basis points — the price the franchise actually realizes after " +
          "discounts, breakpoints, and mix shift.",
        unit: "bps",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 40,
          high: 100,
          basis:
            "Blended advisory fee realization compresses yearly under passive " +
            "substitution and fee transparency; HNW/discretionary runs higher, " +
            "model/passive-heavy books lower, industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Billing system revenue over average AUM, decomposed by fee schedule, " +
          "discounts, and product mix",
        whyItMatters:
          "The structural pressure point of the whole industry. Direction-of-" +
          "good is in-range, not higher: fees too high invite passive " +
          "substitution and outflows, but the secular drift is DOWN, so a " +
          "franchise that watches AUM and ignores fee realization is watching " +
          "margin erode while revenue looks fine.",
      },
      {
        key: "client_onboarding_cycle_time",
        name: "Client onboarding cycle time",
        definition:
          "Median elapsed time from signed engagement to a fully funded, " +
          "KYC-complete, investable account (or household).",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 21,
          basis:
            "Digital mass-affluent onboarding runs days; HNW/multi-account/ " +
            "trust onboarding with KYC, beneficial ownership, and ACATS " +
            "transfers runs weeks, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Onboarding workflow timestamps: engagement to funded/KYC-complete, " +
          "including custody account-open and ACATS transfer-in",
        whyItMatters:
          "The first impression and the first leak. Long, paperwork-heavy " +
          "onboarding causes abandonment of just-won clients and ties up advisor " +
          "and ops time that should be spent gathering assets — it is friction " +
          "tax on the exact moment organic growth is realized.",
      },
      {
        key: "households_per_advisor",
        name: "Advisor capacity (households per advisor)",
        definition:
          "Number of active client households (or relationships) served per " +
          "producing advisor — the load-side view of advisor capacity.",
        unit: "households/advisor",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 75,
          high: 250,
          basis:
            "Service-model dependent: HNW/UHNW practices carry far fewer, " +
            "deeper households; mass-affluent and planning-led books carry many " +
            "more, operator experience",
          label: "planning-range",
        },
        dataSource:
          "CRM active-household counts by advisor of record, reconciled to " +
          "billing relationships",
        whyItMatters:
          "The capacity constraint that IS the growth lever. Too few households " +
          "wastes advisor economics; too many starves service and drives " +
          "attrition. Next-best-action and copilots win by lifting the " +
          "households an advisor can serve well — capacity, not product shelf.",
      },
      {
        key: "client_retention_rate",
        name: "Client retention rate",
        definition:
          "Share of client households (or client assets) retained year over " +
          "year, net of voluntary departures — the inverse of attrition.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 97,
          basis:
            "Established advisory relationships are sticky; healthy books retain " +
            "the low-to-mid 90s of households, with generational transfer the key " +
            "leak point, industry reporting + operator experience",
          label: "planning-range",
        },
        dataSource:
          "CRM/custody household status year over year, with departure reasons " +
          "coded (death/transfer, competitor, dissatisfaction)",
        whyItMatters:
          "Retention is the cheapest growth there is and the silent killer of " +
          "organic growth when it slips — especially at generational wealth " +
          "transfer, where heirs commonly leave the inherited advisor. A book " +
          "can gather assets and still shrink if the back door is open.",
      },
      {
        key: "nav_recon_exception_rate",
        name: "NAV / reconciliation exception rate",
        definition:
          "Share of positions, cash, or transactions that fail automated " +
          "reconciliation (custodian-to-book, fund NAV strike) and require " +
          "manual investigation per cycle.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 5,
          basis:
            "Reconciliation break rates depend on instrument complexity and " +
            "feed quality; vanilla equity/cash low, alternatives/multi-custodian " +
            "higher, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Reconciliation engine break logs: items matched vs broken per cycle, " +
          "by break type and custodian",
        whyItMatters:
          "The operational risk and cost tax of the back office. Breaks delay " +
          "NAV strikes, corrupt client reporting and billing, and consume ops " +
          "headcount; a rising exception rate is the earliest signal that data " +
          "fragmentation is overwhelming the operating model.",
      },
      {
        key: "time_to_rebalance",
        name: "Time to rebalance (drift-to-trade)",
        definition:
          "Median elapsed time from a portfolio breaching its drift/policy " +
          "tolerance to executed rebalancing trades across the affected book.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Model-driven discretionary books rebalance in days; advisor-by-" +
            "advisor discretionary or approval-gated books lag, operator " +
            "experience",
          label: "planning-range",
        },
        dataSource:
          "OMS/PMS drift-breach timestamps to trade-execution timestamps, by " +
          "model and account type",
        whyItMatters:
          "Slow rebalancing is unmanaged risk and tax/return leakage left on the " +
          "table, and it scales badly: an advisor hand-trading hundreds of " +
          "accounts cannot rebalance promptly. Model portfolios and automated " +
          "rebalancing exist precisely to collapse this — it is a capacity proxy.",
      },
      {
        key: "model_portfolio_adoption",
        name: "Model-portfolio adoption %",
        definition:
          "Share of discretionary client assets (or accounts) managed in " +
          "centralized model portfolios versus bespoke, advisor-by-advisor " +
          "construction.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Model adoption rises with scale and a centralized investment " +
            "office; firms span wide, from advisor-autonomy cultures to fully " +
            "modeled platforms, industry reporting + operator experience",
          label: "planning-range",
        },
        dataSource:
          "PMS/OMS assets and accounts tagged to centralized models vs bespoke " +
          "construction",
        whyItMatters:
          "The single biggest lever on operational scale, rebalancing speed, " +
          "and consistency of advice — modeled assets rebalance in bulk and free " +
          "advisor time for relationships. But adoption is a CHANGE-MANAGEMENT " +
          "fight: advisors resist ceding portfolio control, so the constraint is " +
          "cultural, not technical.",
      },
      {
        key: "cost_to_serve_per_household",
        name: "Cost-to-serve per household",
        definition:
          "Fully-loaded servicing cost (advisor time, operations, technology, " +
          "compliance) allocated per active client household.",
        unit: "USD/household/year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 500,
          high: 5000,
          basis:
            "Wide by segment: mass-affluent/digital households cost hundreds, " +
            "HNW/UHNW with bespoke service and reporting cost thousands, operator " +
            "experience",
          label: "planning-range",
        },
        dataSource:
          "Activity-based costing: advisor time, ops, tech, and compliance " +
          "allocated to households, from finance",
        whyItMatters:
          "The margin truth fee compression makes unavoidable. As effective fee " +
          "bps fall, the only way to defend margin is to cut cost-to-serve " +
          "(automation, models, self-service) without gutting the relationship — " +
          "this is the metric that turns 'AUM is up' into 'are we actually " +
          "profitable per client'.",
      },
      {
        key: "client_satisfaction_nps",
        name: "Client satisfaction / NPS",
        definition:
          "Net Promoter Score or equivalent client-satisfaction index across " +
          "the served household base.",
        unit: "NPS",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Wealth NPS tends to run higher than retail finance given the " +
            "personal relationship; advice-led practices clear the upper band, " +
            "transactional ones the lower, industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Client survey program (relationship and transactional NPS), tied to " +
          "household and advisor",
        whyItMatters:
          "The leading indicator of retention and referral — the two cheapest " +
          "sources of organic growth. Falling satisfaction predicts attrition and " +
          "lost wallet share before it shows in flows, and it is the human check " +
          "that automation-driven cost cuts haven't hollowed out the relationship.",
      },
      {
        key: "fee_based_revenue_share",
        name: "% revenue fee-based vs transactional",
        definition:
          "Share of revenue earned as recurring advisory/management fees on AUM " +
          "versus episodic transactional/commission revenue.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "The industry has shifted hard toward recurring fee-based revenue; " +
            "modern advisory franchises run majority-to-overwhelmingly fee-based, " +
            "industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Revenue ledger split by recurring advisory fee vs transactional/" +
          "commission, by household and product",
        whyItMatters:
          "The quality-of-revenue gauge. Recurring fee-based revenue is more " +
          "predictable and better aligned with the client's best interest under " +
          "Reg BI, but it also exposes the franchise fully to fee compression — " +
          "so a high fee-based share makes effective-fee-bps discipline " +
          "existential, not optional.",
      },
    ],

    painThemes: [
      {
        key: "aum_masks_margin_erosion",
        name: "AUM growth masks fee/margin erosion",
        description:
          "Rising markets and net flows push headline AUM up while effective " +
          "fee bps quietly compress under passive substitution, breakpoint " +
          "creep, and discounting — so revenue looks healthy even as margin per " +
          "dollar of AUM erodes and cost-to-serve climbs. Management celebrates " +
          "the AUM line and misses the franchise getting structurally less " +
          "profitable.",
        detectionSignal:
          "AUM up but effective fee bps trending down year over year; revenue " +
          "growth lagging AUM growth; cost-to-serve per household flat or rising; " +
          "margin per AUM dollar shrinking despite scale.",
        diagnosticQuestion:
          "Over the last three years, how has your effective fee realization in " +
          "bps and cost-to-serve per household moved versus headline AUM — is " +
          "margin per AUM dollar actually up, or just revenue?",
      },
      {
        key: "advisor_capacity_ceiling",
        name: "Advisor capacity ceiling (the real growth constraint)",
        description:
          "Organic growth is bottlenecked by advisor time, not product. " +
          "Advisors spend their days on admin, prep, compliance documentation, " +
          "and reactive service instead of proactive next-best-action and asset " +
          "gathering — so households-per-advisor and net new assets stall " +
          "regardless of how rich the product shelf gets.",
        detectionSignal:
          "Flat or declining net new assets despite product launches; advisors " +
          "at or above healthy household load with rising service complaints; " +
          "low share of advisor time on proactive client contact; next-best-" +
          "action backlog.",
        diagnosticQuestion:
          "What share of an advisor's week is proactive client engagement and " +
          "asset gathering versus admin, prep, and compliance — and is " +
          "households-per-advisor a ceiling you've hit?",
      },
      {
        key: "data_fragmentation_no_household_view",
        name: "Data fragmentation — no single household view",
        description:
          "Client, position, and household data are scattered across multiple " +
          "custodians, the OMS/PMS, the CRM, planning tools, and billing, so no " +
          "system holds a complete, current household picture. Every advisor " +
          "interaction, report, and 'personalized' recommendation is reassembled " +
          "manually, and 'personalization at scale' stays an aspiration.",
        detectionSignal:
          "Advisors manually compiling household views from multiple portals; " +
          "duplicate/conflicting client records; reporting and billing breaks " +
          "from feed mismatches; multi-custodian households with no unified roll-" +
          "up; personalization initiatives stalled on data.",
        diagnosticQuestion:
          "When an advisor needs a complete current view of a household across " +
          "all accounts and custodians, is it a single system call or a manual " +
          "reassembly across portals — and what blocks the single view?",
      },
      {
        key: "personalization_unrealized",
        name: "Personalization-at-scale unrealized",
        description:
          "Firms promise tailored advice, tax-aware portfolios, and timely " +
          "next-best-action across the whole book, but the data fragmentation " +
          "and advisor-capacity ceiling mean it is delivered to a handful of top " +
          "households and templated for the rest — the 'mass personalization' " +
          "story is mostly marketing, not deployed capability.",
        detectionSignal:
          "Next-best-action limited to top-tier households; generic model " +
          "assignment with no household-level tax/preference tailoring; " +
          "personalization roadmap repeatedly slipping on data-integration " +
          "dependencies.",
        diagnosticQuestion:
          "Of the personalization you market (tax-aware, household-specific " +
          "next-best-action), what share of households actually receive it today " +
          "versus a generic template — and what caps the coverage?",
      },
      {
        key: "rebalancing_drift_at_scale",
        name: "Rebalancing & drift management doesn't scale by hand",
        description:
          "Advisors managing bespoke, account-by-account portfolios cannot " +
          "rebalance promptly or consistently across hundreds of accounts, so " +
          "portfolios drift past policy tolerances, tax-loss harvesting is " +
          "missed, and advice is inconsistent within the same book — unmanaged " +
          "risk and leaked return that only model portfolios fix.",
        detectionSignal:
          "Long time-to-rebalance; portfolios sitting outside drift tolerance; " +
          "inconsistent holdings for similar clients; low model-portfolio " +
          "adoption with advisors hand-trading; missed tax-loss-harvest windows.",
        diagnosticQuestion:
          "What is your time-to-rebalance once a portfolio breaches tolerance, " +
          "and what share of discretionary assets is in centralized models " +
          "versus hand-managed account by account?",
      },
      {
        key: "onboarding_kyc_friction",
        name: "Onboarding / KYC friction loses just-won clients",
        description:
          "Account opening, KYC/CDD, beneficial ownership, and ACATS asset " +
          "transfers are paperwork-heavy, re-keyed across systems, and slow — so " +
          "newly-won clients abandon mid-onboarding, advisor and ops time is " +
          "consumed at the exact moment assets should be gathered, and the first " +
          "impression of the relationship is friction.",
        detectionSignal:
          "Long onboarding cycle time; abandonment between signed engagement and " +
          "funded account; KYC re-keyed across onboarding/custody/CRM; ACATS " +
          "transfer delays; ops backlog on new accounts.",
        diagnosticQuestion:
          "What is your median time from signed engagement to a funded, KYC-" +
          "complete account, and where in that flow do just-won clients stall or " +
          "abandon?",
      },
      {
        key: "suitability_best_interest_constraint",
        name: "Suitability / best-interest constrains automation",
        description:
          "Reg BI best-interest, fiduciary duty, and suitability mean every " +
          "recommendation and trade must be documented as in the client's best " +
          "interest with an accountable human — so 'autonomous advice' is " +
          "legally and reputationally fraught, and automation must accelerate " +
          "the advisor and the documentation, not replace the accountable " +
          "judgment.",
        detectionSignal:
          "Automation pilots stalled on compliance sign-off; recommendation " +
          "rationale not captured for best-interest documentation; AI advice " +
          "tools with no human-accountability or audit trail; supervision/" +
          "surveillance gaps flagged in exams.",
        diagnosticQuestion:
          "For an AI-surfaced recommendation, is the best-interest rationale " +
          "captured and a named human accountable for it — or does the lack of " +
          "documented suitability block the automation from going live?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "advisor_copilot_nba",
        name: "Advisor copilot & next-best-action",
        valueMechanism:
          "A copilot assembles the household context, drafts client " +
          "communications, prepares meeting briefs, surfaces next-best-action " +
          "(rebalance, tax-loss harvest, held-away assets, life events), and " +
          "auto-captures CRM notes — giving advisors back capacity so they serve " +
          "more households well and convert proactive engagement into net new " +
          "assets and retention. Capacity, not product, is the growth lever this " +
          "directly attacks.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Unified household view across custodians, OMS/PMS, and CRM",
          "Client profile, goals, and prior-interaction history",
          "Next-best-action signal feeds (drift, tax lots, life events, held-away)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Every surfaced recommendation requires advisor review and a best-interest rationale before it reaches the client (Reg BI)",
          "Drafted client communications are advisor-accountable and must be reviewable before send",
          "Next-best-action ranking trained on past advisor behavior can reinforce who got attention, not who needs it — audit for bias",
        ],
        metricsMoved: [
          "households_per_advisor",
          "net_new_assets",
          "client_retention_rate",
          "client_satisfaction_nps",
        ],
      },
      {
        key: "intelligent_onboarding_kyc",
        name: "Intelligent onboarding & KYC automation",
        valueMechanism:
          "AI extracts and verifies identity and account documents, pre-fills " +
          "forms across systems, runs KYC/CDD and beneficial-ownership checks, " +
          "and orchestrates ACATS transfers — collapsing onboarding cycle time " +
          "and abandonment so just-won assets actually fund, while freeing " +
          "advisor and ops time at the moment of asset gathering.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Identity / document data and verification feeds",
          "KYC/CDD watchlist and beneficial-ownership reference data",
          "Custody account-open and ACATS transfer interfaces",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "KYC/CDD and beneficial-ownership determinations require compliance accountability — AI assists, it does not clear",
          "Extracted account data must be human-verified before it funds an account or drives billing",
          "Onboarding automation must preserve full KYC rigor, never trade compliance for speed",
        ],
        metricsMoved: [
          "client_onboarding_cycle_time",
          "net_new_assets",
          "cost_to_serve_per_household",
        ],
      },
      {
        key: "model_driven_rebalancing",
        name: "Model-driven portfolio management & automated rebalancing",
        valueMechanism:
          "Centralized model portfolios plus automated drift monitoring and " +
          "tax-aware rebalancing execute across the whole book in bulk — " +
          "collapsing time-to-rebalance, harvesting losses systematically, and " +
          "making advice consistent — which frees advisor capacity and cuts " +
          "cost-to-serve while improving after-tax outcomes.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Centralized model definitions and drift/policy tolerances",
          "Position, tax-lot, and account-restriction data per household",
          "OMS/PMS trade execution and tax-lot accounting integration",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Account-level restrictions, concentrated/low-basis positions, and tax constraints must override the model — blind rebalancing harms clients",
          "Model changes and trade rationale must be documented for suitability/best-interest review",
          "Advisor change-management resistance to ceding control is the binding constraint, not the technology",
        ],
        metricsMoved: [
          "time_to_rebalance",
          "model_portfolio_adoption",
          "cost_to_serve_per_household",
          "households_per_advisor",
        ],
      },
      {
        key: "automated_performance_reporting",
        name: "Automated performance & client reporting",
        valueMechanism:
          "AI assembles accurate, household-level performance, attribution, and " +
          "narrative reporting from reconciled position data and drafts the " +
          "client-facing commentary — cutting the reporting-cycle and advisor " +
          "prep burden, improving consistency, and lifting client satisfaction " +
          "with timelier, clearer reporting.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Reconciled position, transaction, and performance data",
          "Benchmark and attribution reference data",
          "Reporting templates and disclosure/compliance language",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Performance figures and GIPS/regulatory disclosures must be reconciled and accurate — a reporting error is a compliance and trust event",
          "Generated narrative must be grounded in the actual numbers, never fabricated commentary",
          "Client reporting must not leak data across households/tenants",
        ],
        metricsMoved: [
          "client_satisfaction_nps",
          "cost_to_serve_per_household",
          "households_per_advisor",
        ],
      },
      {
        key: "recon_exception_automation",
        name: "Reconciliation & NAV exception automation",
        valueMechanism:
          "AI auto-matches positions, cash, and transactions across custodians " +
          "and the book, classifies and root-causes breaks, and routes only true " +
          "exceptions for investigation — cutting the reconciliation exception " +
          "burden, speeding NAV strikes, and reducing the operational-risk and " +
          "cost tax of the back office.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Custodian and book-of-record position/transaction feeds",
          "Historical break dispositions and root-cause labels",
          "Reference/security master and corporate-actions data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-matched items affect NAV, billing, and client reporting — auto-clear only high-confidence, fully-evidenced matches",
          "Every auto-match needs an audit trail for fund administration and exam evidence",
          "Misclassified breaks that suppress a real difference create downstream NAV/billing errors — bias toward escalation on ambiguity",
        ],
        metricsMoved: [
          "nav_recon_exception_rate",
          "cost_to_serve_per_household",
        ],
      },
      {
        key: "retention_attrition_signals",
        name: "Retention / attrition-risk & wallet-share signals",
        valueMechanism:
          "A model reads engagement, life-event, flow, and generational-" +
          "transfer signals to flag households at attrition risk and households " +
          "with held-away or expansion opportunity, prompting advisors to act in " +
          "time — protecting retention (especially at wealth transfer) and " +
          "capturing wallet share to lift net new assets.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Engagement, contact-frequency, and flow history per household",
          "Life-event and beneficiary/generational-transfer signals",
          "Held-away asset and wallet-share data where available",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "An attrition flag with no advisor action taken is worthless — the value is the play, not the prediction",
          "Outreach prompted by sensitive signals (e.g. death/inheritance) must be handled with care and compliance review",
          "False positives waste scarce advisor capacity and can unsettle healthy relationships — calibrate and prioritize",
        ],
        metricsMoved: [
          "client_retention_rate",
          "net_new_assets",
          "client_satisfaction_nps",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_household_data_spine",
        name: "Unified household data spine (the gate under every AI bet)",
        description:
          "A consolidated household data layer that joins multiple custodians, " +
          "the OMS/PMS, CRM, planning, and billing into one current household " +
          "view — identity-resolved, reconciled, and current — so advisor " +
          "copilots, next-best-action, reporting, and personalization reason " +
          "over a complete picture instead of a fragmented one. Treated as the " +
          "prerequisite foundation, because every other bet is capped by it.",
        boundary:
          "Owns cross-system household identity, aggregation, and the unified " +
          "view; does not own the custody, OMS/PMS, or CRM systems of record or " +
          "their primary workflows.",
        humanAccountabilityPoint: "Head of Wealth Technology / Data",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "advisor_copilot_overlay",
        name: "Advisor-copilot & next-best-action overlay",
        description:
          "A copilot and next-best-action layer overlaid on the existing CRM " +
          "and household data spine — briefing, drafting, auto-capturing notes, " +
          "and surfacing the next best action per household — so advisor " +
          "capacity rises and proactive engagement scales without ripping and " +
          "replacing the CRM or custody platform.",
        boundary:
          "Owns in-workflow advisor assistance and next-best-action surfacing; " +
          "does not own the advice decision or the best-interest accountability, " +
          "which stay with the advisor.",
        humanAccountabilityPoint: "Head of Advisory / Field Leadership",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "centralized_investment_models",
        name: "Centralized investment office & model-portfolio platform",
        description:
          "A central investment office authoring model portfolios with " +
          "automated drift monitoring and tax-aware rebalancing executed across " +
          "the book, with account-level restriction and tax overrides — making " +
          "advice consistent, collapsing rebalancing time, and freeing advisor " +
          "capacity, gated by an advisor change-management program.",
        boundary:
          "Owns model construction, drift policy, and bulk rebalancing " +
          "execution; does not own the household relationship or the advisor's " +
          "client-specific suitability judgment.",
        humanAccountabilityPoint: "Chief Investment Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "straight_through_ops_recon",
        name: "Straight-through operations & reconciliation platform",
        description:
          "An operations layer that automates onboarding/KYC orchestration, " +
          "position/cash/transaction reconciliation, NAV strike support, and " +
          "exception management across custodians — cutting the exception rate " +
          "and cost-to-serve while keeping a compliance-accountable human over " +
          "KYC and break disposition.",
        boundary:
          "Owns operational throughput, reconciliation, and exception routing; " +
          "does not own the KYC clearance decision or fund-NAV sign-off, which " +
          "remain with compliance / fund administration.",
        humanAccountabilityPoint: "Head of Wealth / Fund Operations",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value in wealth & asset management is won on the COST and CAPACITY " +
        "side, not the price side — because fee compression is structural and " +
        "cannot be out-priced. The durable prize is (1) advisor capacity: " +
        "copilots and next-best-action let each advisor serve more households " +
        "well, lifting net new assets and retention — the growth lever, since " +
        "product shelf is not the constraint. Then (2) operating efficiency: " +
        "model portfolios, automated rebalancing, straight-through onboarding, " +
        "and reconciliation automation cut cost-to-serve and exception rates so " +
        "margin holds even as effective fee bps fall. (3) Retention and wallet " +
        "share protect and grow the base, the cheapest growth, especially at " +
        "generational transfer. Every lever is gated by the unified household " +
        "data spine, so value is heavily discounted where data is fragmented; " +
        "it is also discounted for advisor adoption (advisors route around tools " +
        "and resist ceding portfolio control) and for the regulatory ceiling " +
        "(suitability/best-interest keeps a human accountable, so automation " +
        "accelerates rather than replaces). 'AUM is up' is never the value " +
        "case — margin per AUM dollar and organic growth are.",
      dominantHaircutFactors: [
        {
          factor: "Data fragmentation across custodians / OMS / CRM",
          rationale:
            "Advisor copilots, next-best-action, personalization, reporting, " +
            "and reconciliation are only as good as the unified household view; " +
            "where data is scattered across custodians and systems, realizable " +
            "value collapses far below the modeled lift.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Observed gap between projected and realized value where the " +
              "single household view was not in place, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Advisor adoption & change-management resistance",
          rationale:
            "Capacity and model-portfolio value only land if advisors adopt the " +
            "tools and cede portfolio control; resistance, route-arounds, and " +
            "autonomy culture leave much of the modeled value unrealized.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Programs where low advisor adoption / model resistance stranded " +
              "the modeled capacity and efficiency value, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Fee-compression headwind on the value base",
          rationale:
            "Efficiency and capacity gains accrue against a revenue base whose " +
            "effective fee bps are structurally falling, so part of the modeled " +
            "value is consumed defending margin rather than expanding it.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Secular fee-realization compression offsetting part of efficiency " +
              "gains, industry reporting + operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Regulatory / suitability ceiling on automation",
          rationale:
            "Suitability/best-interest and KYC keep a human accountable for " +
            "advice and clearance, so automation accelerates the advisor and " +
            "documentation rather than removing headcount — capping the " +
            "labor-saving portion of the value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis:
              "Compliance review and human-accountability requirements limiting " +
              "full automation, operator experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Advisor capacity released (copilot / next-best-action)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported advisor-time recovered from admin, prep, and note-" +
              "taking via copilots and auto-capture, contingent on adoption",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in households_per_advisor capacity at held " +
            "service quality",
        },
        {
          lever: "Cost-to-serve reduction (models, STP, recon automation)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported cost-to-serve reductions from model portfolios, " +
              "straight-through onboarding, and reconciliation automation",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in cost_to_serve_per_household",
        },
        {
          lever: "Organic growth uplift (capacity + retention + wallet share)",
          range: {
            low: 0.5,
            high: 2,
            basis:
              "Reported net-new-asset uplift in percentage points from freed " +
              "advisor capacity, better retention, and wallet-share capture, " +
              "net of attribution",
            label: "planning-range",
          },
          measuredAs:
            "Absolute uplift in net_new_assets (percentage points of AUM)",
        },
      ],
      timeToValueBand:
        "Advisor copilot / next-best-action and reporting automation: 2-3 " +
        "quarters (overlay on the data spine), gated by data integration and " +
        "advisor adoption. Model-portfolio adoption and rebalancing: 2-4 " +
        "quarters, gated by advisor change management. Onboarding/KYC and " +
        "reconciliation automation: 2-4 quarters given system integration. The " +
        "unified household data spine itself is the long pole at 3-6+ quarters, " +
        "and it gates the realizable value of everything above it.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Custodian / clearing platform",
          role:
            "System of record for client assets, positions, cash, trades, and " +
            "transfers — the asset truth the whole book reconciles to.",
          examples: [
            "Schwab Advisor Services",
            "Fidelity Institutional",
            "Pershing (BNY)",
          ],
        },
        {
          name: "Portfolio management / OMS (PMS/OMS)",
          role:
            "Portfolio accounting, model management, drift monitoring, " +
            "rebalancing, and order/trade execution across the book.",
          examples: [
            "BlackRock Aladdin",
            "Charles River (IMS)",
            "Orion / Tamarac",
          ],
        },
        {
          name: "Performance & client reporting / aggregation",
          role:
            "Multi-custodian aggregation, performance/attribution calculation, " +
            "and client-facing reporting and household roll-up.",
          examples: [
            "Addepar",
            "Black Diamond (SS&C)",
            "Orion reporting",
          ],
        },
        {
          name: "Advisor CRM",
          role:
            "System of record for households, relationships, interactions, " +
            "pipeline, and service workflows.",
          examples: [
            "Salesforce Financial Services Cloud",
            "Redtail (Orion)",
            "Microsoft Dynamics 365",
          ],
        },
        {
          name: "Model marketplace / managed-account platform",
          role:
            "Model-portfolio construction, third-party SMA/model access, and " +
            "managed-account program administration.",
          examples: [
            "Envestnet",
            "SMArtX",
            "GeoWealth",
          ],
        },
        {
          name: "Billing / fee management",
          role:
            "Advisory fee calculation, breakpoints/discounts, and revenue " +
            "ledger — the source of effective-fee-realization truth.",
          examples: [
            "Orion billing",
            "Envestnet billing",
            "Custodian fee modules",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Wealth / Wealth Management Head",
          accountability:
            "End-to-end advisory franchise: organic growth, advisor " +
            "productivity, margin, and client experience.",
        },
        {
          title: "Chief Investment Officer (CIO)",
          accountability:
            "Model portfolios, investment policy, drift/rebalancing discipline, " +
            "and consistency of advice across the book.",
        },
        {
          title: "Head of Wealth / Fund Operations",
          accountability:
            "Onboarding, custody/clearing ops, reconciliation, NAV, and the " +
            "exception/cost-to-serve operating model.",
        },
        {
          title: "Chief Compliance Officer",
          accountability:
            "Suitability / best-interest (Reg BI), fiduciary duty, KYC, " +
            "supervision, and advice/trade documentation.",
        },
        {
          title: "Head of Advisor Productivity / Field Leadership",
          accountability:
            "Advisor capacity, tool adoption, next-best-action, and the " +
            "service model that drives retention and net new assets.",
        },
        {
          title: "Head of Product & Distribution",
          accountability:
            "Product shelf, managed-account/model programs, fee schedules, and " +
            "the economics of the product mix.",
        },
      ],
      regulatoryFrames: [
        {
          name: "SEC Regulation Best Interest (Reg BI) / fiduciary duty",
          relevance:
            "Recommendations and trades must be documented as in the client's " +
            "best interest with an accountable human — the central constraint on " +
            "automating advice.",
        },
        {
          name: "FINRA rules (suitability, supervision, communications)",
          relevance:
            "Governs suitability, supervision of advisor activity, and review " +
            "of client communications — shaping how AI-drafted content and " +
            "recommendations can be deployed.",
        },
        {
          name: "KYC / CDD & AML onboarding obligations",
          relevance:
            "Identity verification, customer due diligence, and beneficial " +
            "ownership gate account opening and constrain straight-through " +
            "onboarding automation.",
        },
        {
          name: "GIPS (Global Investment Performance Standards)",
          relevance:
            "Standardizes how investment performance is calculated and " +
            "presented — performance/reporting automation must conform.",
        },
        {
          name: "MiFID II (EU/UK applicability)",
          relevance:
            "Suitability, cost/fee transparency, and product-governance rules " +
            "for in-scope EU/UK business — reinforcing fee transparency and " +
            "best-interest discipline.",
        },
      ],
      canonicalTerms: [
        {
          term: "AUM / AUA",
          definition:
            "Assets Under Management / Assets Under Advisement — the asset base " +
            "on which advisory fees are charged and the headline (often vanity) " +
            "scale metric.",
        },
        {
          term: "Effective fee realization (bps)",
          definition:
            "Revenue divided by average AUM in basis points — the price " +
            "actually realized after discounts and mix, the locus of fee " +
            "compression.",
        },
        {
          term: "Net new assets (NNA) / organic growth",
          definition:
            "Net client flows ex-market — the only honest measure of franchise " +
            "growth, distinct from market-driven AUM change.",
        },
        {
          term: "Model portfolio",
          definition:
            "A centrally-constructed target allocation applied across many " +
            "accounts, enabling bulk rebalancing and consistent advice.",
        },
        {
          term: "Drift / rebalancing tolerance",
          definition:
            "The allowed deviation from a portfolio's target allocation before " +
            "policy requires rebalancing — the trigger for trade generation.",
        },
        {
          term: "ACATS",
          definition:
            "Automated Customer Account Transfer Service — the mechanism for " +
            "transferring client assets in/out, a key onboarding bottleneck.",
        },
        {
          term: "Next-best-action (NBA)",
          definition:
            "The prioritized recommendation an advisor should take for a " +
            "household (rebalance, harvest, outreach, expansion) — the capacity " +
            "and growth lever.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Fee compression / margin erosion behind AUM growth",
        authoritativeSource:
          "Billing-system revenue over average AUM (effective fee bps) and " +
          "activity-based cost-to-serve, trended over multiple years",
        whatGoodEvidenceLooksLike:
          "Effective fee bps and cost-to-serve per household trended alongside " +
          "AUM over several years, showing margin per AUM dollar, decomposed by " +
          "product mix and discounting.",
        weakEvidenceToReject:
          "A headline AUM growth figure presented as franchise health with no " +
          "effective-fee-bps or margin trend behind it.",
      },
      {
        claim: "Organic growth / net new assets",
        authoritativeSource:
          "Custody flow records (inflows, outflows, household additions/losses) " +
          "net of market appreciation",
        whatGoodEvidenceLooksLike:
          "Net new assets as a percentage of beginning AUM over multiple " +
          "periods, with market movement stripped out and household additions vs " +
          "losses shown.",
        weakEvidenceToReject:
          "An AUM-growth percentage that conflates market beta with genuine net " +
          "flows, or 'flows are strong' with no period or denominator.",
      },
      {
        claim: "Advisor capacity / productivity",
        authoritativeSource:
          "CRM households-per-advisor and AUM-per-advisor reconciled to billing, " +
          "with advisor time allocation where measured",
        whatGoodEvidenceLooksLike:
          "Households- and AUM-per-advisor by segment, plus a measured split of " +
          "advisor time between proactive engagement and admin, with adoption " +
          "data for any productivity tool.",
        weakEvidenceToReject:
          "A vendor 'advisors save N hours' claim with no time-study baseline or " +
          "tool-adoption data.",
      },
      {
        claim: "Operational exception / cost-to-serve",
        authoritativeSource:
          "Reconciliation engine break logs and activity-based cost-to-serve " +
          "from finance/operations",
        whatGoodEvidenceLooksLike:
          "Exception rate by break type and custodian over time, with " +
          "cost-to-serve per household decomposed into advisor, ops, tech, and " +
          "compliance.",
        weakEvidenceToReject:
          "An asserted efficiency or break-rate improvement with no break-log " +
          "baseline or costing methodology.",
      },
      {
        claim: "Model-portfolio adoption / rebalancing performance",
        authoritativeSource:
          "PMS/OMS assets tagged to centralized models and drift-breach-to-trade " +
          "timestamps",
        whatGoodEvidenceLooksLike:
          "Share of discretionary assets in models and median time-to-rebalance " +
          "by model/account type, trended over the adoption program.",
        weakEvidenceToReject:
          "A claimed rebalancing or model-adoption figure with no PMS/OMS asset " +
          "tagging or drift-to-trade timing.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Over the last three years, how have your effective fee realization (bps) and cost-to-serve per household moved versus headline AUM — is margin per AUM dollar actually up, or just revenue?",
      "What is your net-new-asset / organic growth rate ex-market, and how does it split between household additions and losses (including at generational transfer)?",
      "What share of an advisor's week is proactive client engagement and asset gathering versus admin, prep, and compliance — and is households-per-advisor a ceiling you've hit?",
      "When an advisor needs a complete, current view of a household across all accounts and custodians, is it a single system call or a manual reassembly across portals — and what blocks the single view?",
      "What share of discretionary assets is in centralized model portfolios versus hand-managed account by account, and what is your time-to-rebalance once a portfolio breaches tolerance?",
      "What is your median time from signed engagement to a funded, KYC-complete account, and where do just-won clients stall or abandon?",
      "What is your NAV/reconciliation exception rate by break type, and how much ops capacity is consumed clearing breaks?",
      "For an AI-surfaced recommendation, is the best-interest rationale captured and a named human accountable — or does the lack of documented suitability block the automation from going live?",
    ],
    maturitySignals: [
      "The franchise is steered on effective fee bps, cost-to-serve, and organic growth — not headline AUM alone — and knows whether margin per AUM dollar is rising.",
      "A unified household view across custodians/OMS/CRM exists, so advisors and AI reason over a complete picture rather than reassembling it manually.",
      "A majority of discretionary assets are in centralized model portfolios with automated, tax-aware rebalancing inside a tight time-to-rebalance.",
      "Advisor capacity is measured (households/advisor, time allocation) and treated as the growth lever, with copilot/next-best-action adoption tracked, not assumed.",
      "Every AI-surfaced recommendation carries a captured best-interest rationale and a named accountable human, so automation accelerates compliant advice rather than bypassing it.",
    ],
    redFlags: [
      "AUM growth is celebrated while effective fee bps quietly compress and cost-to-serve per household rises — margin per AUM dollar is eroding unnoticed.",
      "Advisors reassemble household views manually across multiple custodian portals, and 'personalization at scale' is delivered only to top-tier households.",
      "Discretionary assets are largely hand-managed with long time-to-rebalance, portfolios sitting outside drift tolerance, and missed tax-loss-harvest windows.",
      "Onboarding is paperwork-heavy and slow, with just-won clients abandoning mid-flow and KYC re-keyed across systems.",
      "An AI advice/automation pilot is stalled because best-interest rationale isn't captured or no human is accountable for the recommendation.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Custodian / clearing (Schwab, Fidelity, Pershing)",
        category: "Custody / clearing system of record",
        switchingCost:
          "Very high — re-custody means moving every client account via ACATS, " +
          "re-papering relationships, and re-integrating feeds; a multi-quarter, " +
          "client-risking program rarely undertaken.",
        renewalDynamics:
          "Economics driven by asset-based pricing, cash-sweep spread, and " +
          "platform/technology bundling; custodians extend lock-in by bundling " +
          "their own tech stack.",
      },
      {
        vendorName: "Portfolio management / OMS (Aladdin, Charles River, Orion/Tamarac)",
        category: "Portfolio accounting / model / rebalancing / OMS",
        switchingCost:
          "High — portfolio history, model definitions, and tuned rebalancing/" +
          "billing workflows live in the platform; migration is a major data and " +
          "re-validation effort.",
        renewalDynamics:
          "Asset-based or per-account pricing; suites bundle reporting, " +
          "rebalancing, billing, and CRM to raise switching cost — unbundle to " +
          "keep leverage.",
      },
      {
        vendorName: "Reporting & aggregation (Addepar, Black Diamond, Orion)",
        category: "Multi-custodian aggregation / performance reporting",
        switchingCost:
          "Moderate-to-high — accumulated reconciled history and custodian-feed " +
          "mappings are the real lock-in, not the software; re-aggregation is " +
          "painful.",
        renewalDynamics:
          "Asset-based pricing; aggregation depth and data quality are the levers " +
          "— scrutinize feed coverage and reconciliation accuracy at renewal.",
      },
      {
        vendorName: "Advisor CRM (Salesforce FSC, Redtail, Dynamics)",
        category: "Advisor relationship / workflow system of record",
        switchingCost:
          "Moderate-to-high — household data, workflows, and integrations are " +
          "deep; portable with effort but a disruptive migration for the field.",
        renewalDynamics:
          "Per-seat pricing; incumbents bundle native AI/next-best-action at " +
          "renewal to extend the platform — press on measured advisor adoption.",
      },
      {
        vendorName: "Managed-account / model marketplace (Envestnet, SMArtX, GeoWealth)",
        category: "Model marketplace / managed-account platform",
        switchingCost:
          "Moderate — program administration and third-party model access carry " +
          "switching friction, but the layer is designed to be a marketplace.",
        renewalDynamics:
          "Asset-based platform fees plus strategist/SMA fees; the fee stack on " +
          "client assets is the negotiation focus given fee compression.",
      },
    ],
    switchingCosts:
      "The custody/clearing and portfolio/OMS cores are the high-lock-in layers " +
      "the whole stack anchors to — re-custody and OMS migration are " +
      "client-risking, multi-quarter programs. The negotiable frontier is the " +
      "AI/copilot overlay, the aggregation/reporting layer, and the " +
      "managed-account fee stack. The real lock-in across layers is accumulated " +
      "DATA (reconciled history, household graph, tuned models), so exit rights " +
      "over your own client and portfolio data matter more than the software " +
      "contract — and beware custodian/OMS bundling that re-locks the stack at " +
      "renewal.",
    negotiationLevers: [
      "Unbundle custody/OMS/reporting/CRM/billing to expose true unit cost and keep best-of-breed leverage",
      "Press the managed-account/model fee stack on client assets given structural fee compression",
      "Data, household-graph, and reconciled-history portability + model exit rights to avoid data lock-in",
      "Advisor-adoption thresholds tied to commercial terms on copilot/next-best-action features — pay for usage, not shelfware",
      "Cash-sweep economics and asset-based pricing breakpoints reviewed against scale at each renewal",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      fee_margin_claim: [
        "effective fee bps (revenue over average AUM)",
        "cost-to-serve per household (activity-based)",
        "multi-year trend separating margin from headline AUM",
      ],
      growth_claim: [
        "net new assets ex-market",
        "household additions vs losses",
        "period and beginning-AUM denominator",
      ],
      advisor_productivity_claim: [
        "households-/AUM-per-advisor reconciled to billing",
        "advisor time allocation (proactive vs admin)",
        "tool adoption data",
      ],
      operations_claim: [
        "reconciliation break logs by type",
        "onboarding cycle-time timestamps",
        "cost-to-serve decomposition",
      ],
      portfolio_claim: [
        "share of assets in centralized models",
        "drift-breach-to-trade timing",
        "tax-lot / restriction handling evidence",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (data fragmentation, adoption, fee compression, regulatory ceiling)",
      ],
    },
    citationStandard:
      "Quantitative wealth/asset claims cite the custody/PMS/billing/recon " +
      "source and the period, and growth claims ALWAYS cite net-new-assets " +
      "ex-market — never headline AUM as a proxy for franchise health. Fee and " +
      "margin claims cite effective fee bps and cost-to-serve, not revenue " +
      "alone. Value projections cite a baseline plus a labelled planning range " +
      "and the haircut factors applied (data fragmentation, advisor adoption, " +
      "fee compression, regulatory ceiling) — never a single asserted ROI " +
      "number, and never a vendor 'up to X%' figure without a baseline and " +
      "control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not shared effective fee bps and cost-to-serve — frame fee-compression and margin claims as the industry pattern, not their number, and warn that headline AUM hides margin.",
      "Only headline AUM growth is available — flag that it conflates market beta with organic growth and present net-new-assets framing as the honest measure.",
      "The unified household view is not confirmed in place — flag that copilot, next-best-action, personalization, and reporting value is capped by data fragmentation and likely overstated.",
      "Advisor adoption / model-portfolio adoption data is unavailable — flag that capacity and efficiency value assumes adoption that may not materialize, since advisor change-management is the binding constraint.",
      "Automation timelines are discussed without the tenant's suitability/best-interest and KYC controls — flag the regulatory ceiling that keeps a human accountable as the binding uncertainty.",
    ],
    inferenceLanguage: [
      "Across wealth franchises at this scale, effective fee bps have been compressing such that AUM growth typically masks...",
      "Without your net-new-asset data, the industry pattern is that headline AUM growth overstates organic growth by the market component...",
      "As an industry pattern (not your measured figure), advisor capacity — not product shelf — tends to be the binding constraint on...",
      "Subject to suitability/best-interest documentation and a unified household view, a copilot like this could lift advisor capacity by...",
    ],
    flagWithoutEvidence: [
      "A specific effective-fee-bps, margin, or cost-to-serve figure for this tenant",
      "This tenant's actual net-new-asset / organic growth rate ex-market",
      "This tenant's actual advisor capacity, model-portfolio adoption, or tool-adoption rate",
      "A claim that a specific automation is suitable/best-interest-compliant for this tenant without documented rationale and accountability",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "AUM up but margin down / fee-compression and cost-to-serve vs AUM over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Multi-period trend of AUM, effective fee bps, and cost-to-serve per household to expose margin erosion behind headline AUM growth.",
    },
    {
      questionPattern: "value of a wealth-AI program / realizable-value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled lift (capacity + cost-to-serve + organic growth) to realizable value with data-fragmentation, advisor-adoption, fee-compression, and regulatory haircuts.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (data fragmentation, advisor adoption, fee compression, regulatory ceiling) on realizable value.",
    },
    {
      questionPattern: "where AI fits across the wealth value chain / lever prioritization by value and data-readiness",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of value-chain stages (onboarding → portfolio → reporting → ops → retention) x AI lever shaded by net value and data-fragmentation/adoption risk.",
    },
    {
      questionPattern: "wealth & asset management KPI scorecard",
      exhibitKind: "table",
      note: "AUM/advisor, net new assets, effective fee bps, onboarding cycle time, households/advisor, retention, NAV exception rate, time-to-rebalance, model adoption, cost-to-serve, NPS, fee-based share vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The franchise steers on margin per AUM dollar (effective fee bps, cost-to-serve) and organic growth, not headline AUM, so the program targets the real economic problem",
      "The unified household data spine is built first as the prerequisite foundation, since every capacity and personalization bet is capped by it",
      "Advisor capacity is treated as the growth lever — copilots and next-best-action sequenced to earn adoption before higher-risk model centralization",
      "Advisor adoption and model-portfolio change management are run as the program's primary risk, with adoption measured not assumed",
      "Every AI-surfaced recommendation carries captured best-interest rationale and a named accountable human, so automation accelerates compliant advice rather than stalling on it",
    ],
    failureDrivers: [
      "Selling an AUM-growth story while fee compression and rising cost-to-serve quietly erode margin per AUM dollar",
      "Building copilots and personalization on fragmented custodian/OMS/CRM data — the value collapses because no single household view exists",
      "Underestimating advisor resistance to ceding portfolio control, so model-portfolio adoption and the efficiency it unlocks never materialize",
      "Treating advice automation as a labor-replacement play and stalling on suitability/best-interest and KYC accountability",
      "Crediting overlapping organic-growth gains entirely to one AI bet, then missing the target the inflated case promised",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption hinges on whether the tool obviously gives advisors capacity " +
      "back. Copilots, auto-capture, and reporting automation adopt fastest " +
      "because they remove admin advisors hate; next-best-action follows once " +
      "advisors trust the recommendations and the best-interest rationale is " +
      "captured for them. Model-portfolio adoption is the hard one — it requires " +
      "advisors to cede portfolio control and spreads office-by-office through " +
      "change management, not by mandate. The whole curve is gated by the " +
      "unified household data spine and by compliance comfort with the " +
      "accountability model.",
    roiClarity: "medium",
    roiClarityBasis:
      "Cost-to-serve and operational-exception gains are directly measurable in " +
      "costing and reconciliation data and cleanly attributable. Advisor-" +
      "capacity, retention, and organic-growth gains are real but influenced by " +
      "market and many factors, so they are easy to over-credit without " +
      "cohorts/holdouts. Two structural discounts — data fragmentation and " +
      "advisor adoption — are large and tenant-specific, and the fee-compression " +
      "headwind consumes part of the gain, so ROI is firm only when margin and " +
      "organic growth are measured against actuals rather than headline AUM, " +
      "which holds clarity at medium.",
  },

  regulatoryFrame: {
    name: "Reg BI / fiduciary, FINRA suitability & KYC + GIPS",
    relevance:
      "The dominant regulatory frame for wealth & asset management: SEC Reg BI " +
      "and fiduciary duty require every recommendation and trade to be " +
      "documented as in the client's best interest with an accountable human, " +
      "FINRA governs suitability, supervision, and client communications, KYC/" +
      "CDD gates onboarding, and GIPS standardizes performance presentation — " +
      "together making documented suitability, human accountability, and " +
      "accurate performance/reporting the binding constraints on automating " +
      "advice (MiFID II cost-transparency and suitability rules apply for " +
      "in-scope EU/UK business; see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
