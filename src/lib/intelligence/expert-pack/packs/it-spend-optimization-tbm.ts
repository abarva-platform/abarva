// Consilium expert — IT Spend Optimization & Technology Business Management (TBM).
//
// W3 wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 spanning the IT FINANCIAL MANAGEMENT / cost layer
// of every enterprise: IT cost transparency (the TBM taxonomy — cost pools →
// towers → services → business units), run-vs-change/grow mix, application and
// infrastructure rationalization, software license / SaaS optimization, cloud
// cost management (FinOps), demand management, benchmarking, and unit-cost
// economics. This expert DIRECTLY SUPPORTS the IT investment / cost-control
// product module (Tower) — it is the brain behind "where does IT money go, what
// can we take out, and how do we keep it out".
//
// SCOPE FENCE — this is the IT COST / SPEND layer, NOT the run-quality layer and
// NOT enterprise FP&A. It is DISTINCT from IT Operations & Service Management
// (RUN-IT reliability — incident/change/MTTR, AIOps, service desk) which owns
// HOW WELL IT runs; this expert owns HOW MUCH IT costs and how that cost maps to
// business value. It is also DISTINCT from Finance FP&A & Controllership
// (enterprise-wide planning, close, and controllership) — this is the IT-specific
// cost-transparency and optimization discipline (TBM/ITFM), the cost model and
// the savings levers, not the corporate planning cycle. Cloud FinOps is in scope
// here as the cloud SLICE of IT spend optimization (unit cost, commitment
// coverage, waste), whereas the ITSM expert treats cloud only as an operational
// reliability surface.
//
// CORE DOCTRINE — COST TRANSPARENCY IS THE BINDING PREREQUISITE; SHELFWARE AND
// REDUNDANCY ARE THE BIGGEST RECOVERABLE POOL; SAVINGS LEAK WITHOUT DEMAND
// GOVERNANCE. Three honest truths gate every IT-spend claim. (1) You cannot
// optimize what you cannot see: a defensible, business-mapped cost model (the
// TBM taxonomy) is the prerequisite — without it, "savings" are anecdotes and
// every benchmark is uncomparable. (2) The largest, fastest, lowest-risk
// recoverable pool is almost always SHELFWARE (unused / under-utilized software
// and SaaS licenses) and REDUNDANT applications — duplicative, overlapping, and
// end-of-life apps that survive because no one owns the decommission. (3)
// Negotiated and engineered savings LEAK back: cloud waste regrows, license
// counts creep, and the run base re-inflates UNLESS demand management and
// governance hold the line — so durable savings require demand-driven spend and
// a governed run-rate, not a one-time cut. Value is therefore sized on a
// transparent cost base, weighted to the shelfware/redundancy pool, and haircut
// for the re-inflation that occurs without demand governance — never on a
// headline "X% IT cost-out" with no cost model behind it.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const itSpendOptimizationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.it-spend-optimization-tbm",
    expertName:
      "IT Spend Optimization & Technology Business Management Expert (TBM / ITFM / FinOps)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "it-spend-optimization-tbm",
    scopeNote:
      "Cross-cutting, cross-industry expert for the IT FINANCIAL MANAGEMENT / " +
      "cost layer of the enterprise: IT cost transparency (the TBM taxonomy — " +
      "cost pools, towers, services, business-unit mapping), run-vs-change/grow " +
      "mix, application and infrastructure rationalization, software license and " +
      "SaaS optimization, cloud cost management (FinOps), demand management, IT " +
      "financial management, benchmarking, and unit-cost economics. Directly " +
      "supports the IT investment / cost-control product module (Tower). CORE " +
      "DOCTRINE: cost transparency (a defensible, business-mapped cost model) is " +
      "the binding prerequisite; shelfware and redundant/overlapping applications " +
      "are the biggest recoverable pool; and engineered savings re-inflate without " +
      "demand governance — so value is sized on a transparent base, weighted to " +
      "the shelfware/redundancy pool, and haircut for re-inflation. DISTINCT FROM " +
      "IT Operations & Service Management (RUN-IT reliability — incident/change/" +
      "MTTR/AIOps; that expert owns how WELL IT runs, this one owns how MUCH it " +
      "costs and how cost maps to value) and from Finance FP&A & Controllership " +
      "(enterprise planning, close, controllership; this is the IT-specific TBM/" +
      "ITFM cost discipline, not the corporate planning cycle). Cloud FinOps is " +
      "in scope as the cloud slice of IT spend optimization, not as an operational " +
      "reliability surface.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "it_spend_pct_revenue",
        name: "IT spend as % of revenue",
        definition:
          "Total IT spend (run + change/grow, capex + opex, including cloud, " +
          "labor, software, and vendor) as a percentage of enterprise revenue — " +
          "the headline IT-intensity ratio, read against industry peers.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Cross-industry IT-spend-to-revenue benchmarks (Gartner/Apptio TBM " +
            "peer ranges); banking/insurance and software run high single-digits, " +
            "asset-heavy industrials run 1-3% — interpret against industry, not " +
            "absolutely",
          label: "planning-range",
        },
        dataSource:
          "TBM/ITFM cost model: total IT cost reconciled to the GL, divided by " +
          "enterprise revenue from finance",
        whyItMatters:
          "The board-level orientation metric — but only meaningful read against " +
          "the right industry peer set and alongside the run-vs-change mix. A low " +
          "ratio can mean efficiency OR chronic under-investment; it is a starting " +
          "question, not a verdict.",
      },
      {
        key: "run_change_ratio",
        name: "Run vs change/grow spend ratio",
        definition:
          "Split of total IT spend between RUN (keep-the-lights-on: operate and " +
          "maintain the existing estate) and CHANGE/GROW (new investment, " +
          "transformation, innovation), expressed as run % of total.",
        unit: "% run of total",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 55,
          high: 75,
          basis:
            "TBM run-the-business benchmarks; many enterprises sit at 70-80% run, " +
            "leaders push toward 55-65% to free investment capacity — direction " +
            "matters more than the absolute point",
          label: "planning-range",
        },
        dataSource:
          "TBM cost model: spend classified run-vs-change/grow across towers and " +
          "the project/product portfolio",
        whyItMatters:
          "The investment-capacity metric — a run base that consumes 75-80% of " +
          "spend starves transformation. The point of cost-out is to shift the " +
          "mix toward change/grow, not just to shrink the total.",
      },
      {
        key: "cost_transparency_coverage_pct",
        name: "% IT spend with cost transparency",
        definition:
          "Share of total IT spend mapped through a defensible cost model (cost " +
          "pools → towers → IT services → business units / applications) and " +
          "reconciled to the GL — i.e. spend that is explainable, not residual.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "TBM-maturity benchmarks; mature TBM programs map 90%+ of spend with " +
            "an unallocated residual under 10%, early programs leave large " +
            "untraced pools",
          label: "planning-range",
        },
        dataSource:
          "TBM/ITFM platform allocation model: spend traced through the taxonomy " +
          "and reconciled to the GL, with the unallocated residual quantified",
        whyItMatters:
          "THE binding-prerequisite metric — every savings claim, benchmark, and " +
          "showback is only as credible as the share of spend the cost model can " +
          "actually explain. A large untraced residual means optimization is " +
          "guesswork and chargeback disputes are unwinnable.",
      },
      {
        key: "software_license_utilization",
        name: "Software / SaaS license utilization",
        definition:
          "Share of provisioned software and SaaS licenses (and entitlements) " +
          "that are actively used in a rolling window — the inverse of SHELFWARE " +
          "(paid-for-but-unused or under-utilized licenses).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 90,
          basis:
            "SaaS-management / SAM benchmarks; well-managed estates run 80-90% " +
            "active utilization, ungoverned SaaS sprawl commonly shows 25-45% " +
            "shelfware across the license base",
          label: "planning-range",
        },
        dataSource:
          "SAM / SaaS-management platform: entitlement counts vs active-usage " +
          "telemetry (SSO/login, feature usage) by application",
        whyItMatters:
          "The single fastest, lowest-risk recoverable pool — shelfware reclaim " +
          "and right-sizing licenses returns cash in the current contract year " +
          "with no architecture change. Low utilization is money already spent on " +
          "software no one uses.",
      },
      {
        key: "application_redundancy_pct",
        name: "Application redundancy %",
        definition:
          "Share of the application portfolio that is functionally redundant, " +
          "overlapping, or duplicative — multiple applications delivering the " +
          "same capability — relative to total active applications.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "APM / rationalization benchmarks; redundancy commonly runs 20-35% in " +
            "un-rationalized estates (M&A-grown especially), under 15% after a " +
            "disciplined rationalization cycle",
          label: "planning-range",
        },
        dataSource:
          "Application portfolio management (APM) inventory with capability " +
          "mapping and TIME/business-capability overlap analysis",
        whyItMatters:
          "The second-biggest recoverable pool after shelfware — redundant and " +
          "overlapping apps carry duplicate license, infrastructure, support, and " +
          "integration cost. They survive because no one owns the decommission " +
          "decision, so they are the prime rationalization target.",
      },
      {
        key: "cloud_cost_variance_to_budget",
        name: "Cloud cost variance to budget",
        definition:
          "Actual cloud spend (IaaS/PaaS/SaaS-as-cloud) versus budget/forecast " +
          "over a period, as a percentage variance — the FinOps controllability " +
          "signal for the most volatile, fastest-growing slice of IT spend.",
        unit: "% variance",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: -5,
          high: 10,
          basis:
            "FinOps forecast-accuracy benchmarks; mature FinOps holds actuals " +
            "within ±5-10% of forecast, immature cloud governance routinely " +
            "overruns 15-30% — persistent overrun signals waste, not growth",
          label: "planning-range",
        },
        dataSource:
          "Cloud cost-management / FinOps platform: tagged actuals vs " +
          "budget/forecast by team, product, and environment",
        whyItMatters:
          "Cloud is the spend pool most prone to silent sprawl — idle, over-" +
          "provisioned, and untagged resources accrete continuously. Persistent " +
          "over-budget variance is the early signal of waste regrowth that demand " +
          "governance must contain.",
      },
      {
        key: "unit_cost_trend",
        name: "IT unit cost trend (cost per unit of service)",
        definition:
          "Trend in the cost to deliver a defined unit of IT service (e.g. cost " +
          "per VM, per GB stored, per seat, per transaction) over time — the " +
          "efficiency metric that normalizes spend for volume growth.",
        unit: "% change YoY",
        directionOfGood: "lower",
        benchmarkRange: {
          low: -10,
          high: 3,
          basis:
            "TBM unit-economics benchmarks; well-run towers drive unit cost down " +
            "5-10% YoY through automation and rate improvement, flat-to-rising " +
            "unit cost signals lost efficiency even when totals look controlled",
          label: "planning-range",
        },
        dataSource:
          "TBM cost model: tower/service total cost divided by consumption units " +
          "from the CMDB/usage telemetry, trended over time",
        whyItMatters:
          "Separates real efficiency from volume effects — total spend can fall " +
          "because demand fell, or rise because demand grew, while unit cost tells " +
          "you whether IT is genuinely getting cheaper to run. It is the honest " +
          "efficiency metric the CFO trusts over absolute totals.",
      },
      {
        key: "it_spend_per_employee",
        name: "IT spend per employee",
        definition:
          "Total IT spend divided by enterprise headcount (or seats) — a " +
          "normalized intensity metric for the digital-workplace and shared-" +
          "services slice, comparable across peers of different size.",
        unit: "USD per employee per year",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 7000,
          high: 25000,
          basis:
            "Cross-industry IT-spend-per-employee benchmarks; knowledge-worker " +
            "and financial-services firms run high, asset-heavy/frontline-workforce " +
            "industries run low — interpret against workforce profile",
          label: "planning-range",
        },
        dataSource:
          "TBM cost model total IT spend divided by HR headcount; ideally split " +
          "digital-workplace spend per knowledge-worker seat",
        whyItMatters:
          "A peer-comparable intensity lens that catches digital-workplace and " +
          "end-user-computing over-spend, but must be read against workforce mix — " +
          "a frontline-heavy firm and a knowledge-worker firm are not comparable on " +
          "a flat per-head basis.",
      },
      {
        key: "apps_rationalization_candidate_pct",
        name: "% apps rationalization candidates",
        definition:
          "Share of the application portfolio flagged as rationalization " +
          "candidates — tolerate-invest-migrate-eliminate (TIME) dispositions of " +
          "eliminate or migrate, driven by redundancy, low usage, end-of-life " +
          "tech, or poor business value.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 40,
          basis:
            "APM rationalization benchmarks; a healthy first-pass review flags " +
            "20-40% of apps for migrate/eliminate, falling each cycle as the " +
            "estate is cleaned — a near-zero flag rate usually means weak analysis",
          label: "planning-range",
        },
        dataSource:
          "APM portfolio with TIME/business-capability scoring: usage, " +
          "redundancy, technical health, business value, and cost per app",
        whyItMatters:
          "Sizes the rationalization pipeline — the candidate pool is the input to " +
          "the cost-out plan. The candidates with the highest cost and lowest " +
          "value/usage are where decommission and consolidation savings " +
          "concentrate, gated by who owns the decision.",
      },
      {
        key: "vendor_spend_concentration",
        name: "IT vendor spend concentration",
        definition:
          "Share of total IT vendor/software spend with the top N vendors — the " +
          "leverage-and-risk concentration of the IT supplier base (mega-vendors, " +
          "hyperscalers, strategic SIs).",
        unit: "% spend with top vendors",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "IT-vendor-portfolio benchmarks; the top handful of strategic vendors " +
            "(hyperscaler, ERP, productivity suite, top SIs) commonly carry 60-80% " +
            "of spend — concentration creates both negotiation leverage and " +
            "lock-in risk",
          label: "planning-range",
        },
        dataSource:
          "AP / vendor-master spend rolled up by vendor and matched to active IT " +
          "contracts in the CLM/SAM systems",
        whyItMatters:
          "Concentration is double-edged — it creates negotiation leverage at " +
          "renewal but also lock-in and bundle-pricing exposure (especially " +
          "ELA/EA true-ups and audit risk). Read directionally to target the " +
          "renewals where optimization has the most leverage.",
      },
      {
        key: "demand_driven_spend_pct",
        name: "% demand-driven (governed) spend",
        definition:
          "Share of IT spend governed by an explicit demand-management process " +
          "with business showback/chargeback and consumption accountability — " +
          "rather than allocated as an untraced overhead the business cannot see " +
          "or influence.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "TBM demand-management maturity benchmarks; mature programs run " +
            "showback/chargeback on the majority of consumption-based spend, early " +
            "programs govern little and absorb demand as undifferentiated overhead",
          label: "planning-range",
        },
        dataSource:
          "TBM bill-of-IT / showback model: spend exposed to business consumers " +
          "with consumption transparency, over total IT spend",
        whyItMatters:
          "The DURABILITY metric — engineered savings re-inflate unless the " +
          "business sees and owns the consumption that drives spend. Demand-driven, " +
          "governed spend is what keeps cost out after the one-time cut; low " +
          "demand governance is why savings leak back.",
      },
      {
        key: "infrastructure_utilization_pct",
        name: "Infrastructure / capacity utilization %",
        definition:
          "Average utilization of provisioned infrastructure capacity (compute, " +
          "storage, on-prem and cloud) against what is paid for — the inverse of " +
          "over-provisioning and idle waste.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 35,
          high: 75,
          basis:
            "Infrastructure / cloud right-sizing benchmarks; well-optimized " +
            "estates run 60-75% effective utilization, un-governed estates " +
            "routinely sit at 20-40% with large idle and over-provisioned pools",
          label: "planning-range",
        },
        dataSource:
          "Cloud cost / infrastructure-monitoring telemetry vs provisioned " +
          "capacity, by environment and workload",
        whyItMatters:
          "The infrastructure waste signal — low utilization is paid-for capacity " +
          "doing nothing (idle instances, over-provisioned VMs, orphaned storage). " +
          "Right-sizing and commitment optimization here are fast, low-risk cloud/" +
          "infra savings that regrow without continuous FinOps discipline.",
      },
    ],

    painThemes: [
      {
        key: "no_cost_transparency",
        name: "No defensible cost model — IT cost is a black box",
        description:
          "IT spend lands in the GL as a few large opaque lines with no mapping " +
          "from cost pools to towers to services to the business units and " +
          "applications that consume them. Leadership cannot answer 'what does " +
          "this service cost and who uses it', so every optimization is anecdotal " +
          "and every chargeback dispute is unwinnable.",
        detectionSignal:
          "Large unallocated 'IT overhead' or 'shared services' pools, no TBM/" +
          "ITFM taxonomy, spend reported by GL cost center rather than by IT " +
          "service or application, finance and IT arguing over allocations.",
        diagnosticQuestion:
          "What share of your IT spend can you trace through a defensible cost " +
          "model to a specific IT service, application, and consuming business " +
          "unit — and how big is the unallocated residual?",
      },
      {
        key: "shelfware_and_license_waste",
        name: "Shelfware & software/SaaS license waste",
        description:
          "Provisioned licenses and SaaS seats far exceed active usage: " +
          "departed-employee seats never reclaimed, over-bought entitlements, " +
          "duplicate tools across teams, and premium tiers no one uses. SaaS " +
          "sprawl from decentralized buying compounds it, and renewals true-up " +
          "the bloated count rather than the used count.",
        detectionSignal:
          "Low license utilization, SaaS apps unknown to IT (shadow IT), " +
          "auto-renewals at the provisioned (not used) count, no SAM/SaaS-" +
          "management telemetry tying entitlements to actual logins/feature use.",
        diagnosticQuestion:
          "What is your software/SaaS license utilization, and how much spend is " +
          "shelfware — paid-for licenses and seats with no active usage you could " +
          "reclaim at the next renewal?",
      },
      {
        key: "application_redundancy",
        name: "Application redundancy & estate bloat",
        description:
          "Multiple applications deliver the same capability — accreted through " +
          "M&A, decentralized buying, and 'easier to add than to retire'. " +
          "Redundant and end-of-life apps carry duplicate license, infrastructure, " +
          "support, and integration cost, but survive because decommissioning is " +
          "someone else's risk and no one owns the sunset decision.",
        detectionSignal:
          "High application-redundancy %, many apps with overlapping capability, " +
          "long tail of low-usage and end-of-life applications, no TIME " +
          "disposition or business owner per app, decommission backlog that never " +
          "moves.",
        diagnosticQuestion:
          "How many of your applications are functionally redundant or end-of-" +
          "life, and what is blocking the decommission decisions — is it analysis, " +
          "or is it that no one owns the sunset?",
      },
      {
        key: "cloud_cost_sprawl",
        name: "Cloud cost sprawl & waste regrowth",
        description:
          "Cloud spend grows faster than the workloads behind it: idle and over-" +
          "provisioned resources, untagged spend, unused commitments, and " +
          "engineering teams optimizing for speed not cost. Savings from a " +
          "right-sizing push regrow within quarters because there is no continuous " +
          "FinOps practice or cost accountability at the team level.",
        detectionSignal:
          "Persistent cloud over-budget variance, low infrastructure utilization, " +
          "large untagged spend, low commitment (reserved/savings-plan) coverage, " +
          "no team-level showback, FinOps treated as a one-time clean-up.",
        diagnosticQuestion:
          "What is your cloud cost variance to budget and infrastructure " +
          "utilization, and do engineering teams see and own their cloud cost — or " +
          "does waste regrow after each clean-up because no one is accountable?",
      },
      {
        key: "savings_leakage_no_demand_governance",
        name: "Savings leakage — cost re-inflates without demand governance",
        description:
          "One-time cost-out lands, then the run base creeps back: license counts " +
          "regrow, cloud waste returns, new tools accrete, and demand the business " +
          "never sees expands unchecked. Without demand management, showback/" +
          "chargeback, and a governed run-rate, savings are a sawtooth that " +
          "reverts within a year or two.",
        detectionSignal:
          "Spend rebounds the year after a cost-out program, low demand-driven " +
          "spend %, no showback/chargeback, no consumption accountability, " +
          "repeated 'cost-takeout' initiatives attacking the same pools.",
        diagnosticQuestion:
          "After your last cost-out program, did the savings hold — or did spend " +
          "re-inflate because there is no demand governance, showback, or " +
          "consumption accountability holding the line?",
      },
      {
        key: "uncomparable_benchmarks",
        name: "Uncomparable benchmarks & vanity cost-out claims",
        description:
          "Cost-out is claimed as a headline percentage with no transparent cost " +
          "model, no baseline definition, and no peer-comparable taxonomy — so " +
          "the number is uncomparable to peers and unverifiable internally. " +
          "Cost-avoidance is counted as cash savings, gross is reported without " +
          "the cost-to-achieve, and the savings never reconcile to the GL.",
        detectionSignal:
          "Headline 'X% IT cost reduction' with no cost-model basis, cost-" +
          "avoidance reported as realized cash, no GL reconciliation, benchmarks " +
          "cited against a non-comparable taxonomy or peer set.",
        diagnosticQuestion:
          "When you claim IT savings, is the number reconciled to the GL against a " +
          "defined baseline in a transparent cost model — and is it realized cash " +
          "or cost-avoidance counted as if it were cash?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_cost_transparency_allocation",
        name: "AI-assisted cost transparency & spend allocation",
        valueMechanism:
          "Classify and map every IT GL line to the TBM taxonomy (cost pools → " +
          "towers → services → business units / applications), normalize vendor " +
          "and invoice data, and continuously reconcile to the GL — turning an " +
          "opaque cost base into a defensible, high-coverage cost model so " +
          "optimization is fact-based and benchmarks are peer-comparable. Lifts " +
          "cost-transparency coverage and shrinks the unallocated residual.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "IT GL / cost-center spend reconciled across capex and opex",
          "Vendor master, invoice line items, and active IT contracts",
          "A TBM/ITFM taxonomy and CMDB/APM consumption data to allocate against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Allocation rules and classification must be reviewed — bad mappings mislead every downstream decision",
          "The unallocated residual must be quantified, not hidden, to keep the model honest",
          "Showback/chargeback figures are sensitive — validate before exposing to business consumers",
        ],
        metricsMoved: [
          "cost_transparency_coverage_pct",
          "demand_driven_spend_pct",
          "run_change_ratio",
        ],
      },
      {
        key: "saas_license_optimization",
        name: "Software / SaaS license & shelfware optimization",
        valueMechanism:
          "Continuously match entitlements to active usage telemetry across the " +
          "software and SaaS estate, surface shelfware, duplicate tools, and " +
          "right-sizing/tier-downgrade opportunities, and feed reclaim and " +
          "renewal recommendations — capturing the fastest, lowest-risk recoverable " +
          "pool by lifting license utilization and cutting waste before each " +
          "renewal true-up.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "License entitlements and contracts from SAM / SaaS-management",
          "Active-usage telemetry (SSO/login, feature usage) by user and app",
          "Renewal calendar and per-seat/tier pricing to model reclaim value",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Reclaim recommendations need owner confirmation — usage gaps can be seasonal or role-based",
          "License-compliance posture must be preserved — under-licensing risk on audit, not just over-spend",
          "Shelfware identified is opportunity, not realized savings until reclaimed at renewal",
        ],
        metricsMoved: [
          "software_license_utilization",
          "vendor_spend_concentration",
          "demand_driven_spend_pct",
        ],
      },
      {
        key: "application_rationalization_intelligence",
        name: "Application rationalization intelligence (TIME)",
        valueMechanism:
          "Build a usage-, cost-, redundancy-, and technical-health-scored view " +
          "of the application portfolio, detect overlapping/duplicative capability " +
          "and end-of-life tech, and recommend tolerate-invest-migrate-eliminate " +
          "dispositions with quantified decommission savings — converting estate " +
          "bloat into a prioritized rationalization pipeline that cuts the " +
          "redundancy pool and the run base.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Application portfolio inventory with business-capability mapping",
          "Per-app cost (license, infra, support, integration) from the cost model",
          "Usage telemetry and technical-health / end-of-life signals per app",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Decommission decisions are business-risk decisions — require a named app owner's approval, not auto-sunset",
          "Capability-overlap detection must account for nuance the model cannot see (compliance, edge workflows)",
          "Migrate dispositions carry one-time cost-to-achieve that must net against the run savings",
        ],
        metricsMoved: [
          "application_redundancy_pct",
          "apps_rationalization_candidate_pct",
          "run_change_ratio",
        ],
      },
      {
        key: "finops_cloud_optimization",
        name: "FinOps cloud cost optimization & anomaly detection",
        valueMechanism:
          "Continuously analyze tagged cloud telemetry to flag idle and over-" +
          "provisioned resources, recommend right-sizing and commitment (reserved/" +
          "savings-plan) coverage, detect cost anomalies in near-real-time, and " +
          "route accountability to the owning team — containing the most volatile " +
          "spend pool by improving utilization and holding actuals to budget so " +
          "waste does not regrow.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Tagged cloud billing and utilization telemetry by team/product/env",
          "Budget/forecast and commitment (reserved/savings-plan) inventory",
          "Resource ownership and tagging taxonomy for accountability routing",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Right-sizing recommendations must respect performance and reliability headroom — cost is not the only axis",
          "Commitment purchases are forward bets — validate workload stability before locking in",
          "Untagged spend caps the analysis; flag tagging-coverage confidence explicitly",
        ],
        metricsMoved: [
          "cloud_cost_variance_to_budget",
          "infrastructure_utilization_pct",
          "unit_cost_trend",
        ],
      },
      {
        key: "demand_forecasting_governance",
        name: "Demand forecasting, showback & unit-cost governance",
        valueMechanism:
          "Model IT consumption and unit economics, expose business consumers to " +
          "the cost of what they consume via showback/chargeback, and forecast " +
          "demand so spend is provisioned to need rather than absorbed as overhead " +
          "— making savings DURABLE by giving the business consumption " +
          "accountability and driving unit cost down, so engineered cost-out does " +
          "not re-inflate.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Consumption/usage telemetry by service and business unit from CMDB/telemetry",
          "TBM cost model with unit-cost (cost-per-unit) rates by tower/service",
          "Historical demand and business-driver data to forecast against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Chargeback can drive perverse behavior (shadow IT) if rates are opaque or unfair — govern the model transparently",
          "Forecasts are planning ranges, not commitments — flag uncertainty on demand-driver assumptions",
          "Unit-cost comparisons must normalize for mix; raw unit cost can mislead across heterogeneous services",
        ],
        metricsMoved: [
          "demand_driven_spend_pct",
          "unit_cost_trend",
          "it_spend_per_employee",
        ],
      },
      {
        key: "benchmarking_optimization_advisor",
        name: "AI benchmarking & optimization opportunity advisor",
        valueMechanism:
          "Normalize the tenant cost model to a peer-comparable taxonomy, compare " +
          "tower and unit costs to industry planning ranges, and surface and rank " +
          "the optimization opportunities (run-vs-change shift, license reclaim, " +
          "rationalization, cloud waste, vendor renewal) by recoverable value and " +
          "risk — turning benchmarks into a prioritized, defensible cost-out " +
          "roadmap rather than vanity percentages.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A transparent, taxonomy-normalized tenant cost model (the prerequisite)",
          "Peer/industry benchmark ranges by tower, unit, and IT-intensity ratio",
          "Per-opportunity cost, value, and risk inputs from the underlying levers",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Benchmarks are uncomparable without a normalized taxonomy and the right peer set — flag the basis",
          "Industry ranges are planning ranges, not targets — a tenant below a range may be efficient or under-invested",
          "Ranked opportunities are a pipeline; realized savings depend on execution and demand governance",
        ],
        metricsMoved: [
          "it_spend_pct_revenue",
          "run_change_ratio",
          "apps_rationalization_candidate_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "tbm_cost_transparency_model",
        name: "TBM / ITFM cost-transparency model (the prerequisite platform)",
        description:
          "A governed, GL-reconciled cost model built on a standard TBM taxonomy " +
          "(cost pools → IT towers → IT services → business units / applications) " +
          "that explains where IT money goes and who consumes it — the binding-" +
          "prerequisite platform on which rationalization, license, cloud, demand, " +
          "and benchmarking levers all depend.",
        boundary:
          "Owns the cost model, the taxonomy, the allocation rules, and the GL " +
          "reconciliation; does not own the optimization decision or the GL " +
          "booking (it makes them fact-based and defensible).",
        humanAccountabilityPoint: "IT Financial Management (ITFM) / TBM Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "application_rationalization_program",
        name: "Application rationalization program (TIME-based)",
        description:
          "A structured, recurring program that scores the application portfolio " +
          "on cost, usage, redundancy, technical health, and business value, " +
          "assigns tolerate-invest-migrate-eliminate dispositions with a named " +
          "business owner per app, and drives a governed decommission/consolidation " +
          "pipeline — turning estate bloat into realized run-cost reduction.",
        boundary:
          "Owns portfolio scoring, disposition recommendation, and the " +
          "rationalization pipeline; does not own the application's business " +
          "decision to retire (that is the named app owner's, jointly governed).",
        humanAccountabilityPoint: "Enterprise Architecture / Application Portfolio Owner",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "finops_operating_model",
        name: "FinOps operating model (continuous cloud cost discipline)",
        description:
          "A cross-functional FinOps practice (finance, engineering, IT) running " +
          "the inform-optimize-operate loop: tagging and visibility, right-sizing " +
          "and commitment optimization, and team-level cost accountability with " +
          "anomaly detection — holding cloud actuals to budget continuously so " +
          "waste does not regrow after each clean-up.",
        boundary:
          "Owns cloud cost visibility, optimization recommendations, and the " +
          "accountability loop; does not own the engineering architecture or the " +
          "workload itself (it informs and governs their cost).",
        humanAccountabilityPoint: "FinOps Lead / Cloud Cost Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "demand_management_governance",
        name: "Demand management & showback/chargeback governance",
        description:
          "A bill-of-IT / showback (or chargeback) model that exposes business " +
          "consumers to the cost of what they consume, with a demand-intake and " +
          "consumption-accountability process — the discipline that makes " +
          "engineered savings DURABLE by holding the run-rate and preventing " +
          "demand-driven re-inflation.",
        boundary:
          "Owns the consumption transparency, the demand-intake governance, and " +
          "the showback/chargeback model; does not own the business's consumption " +
          "decision itself (it makes the cost of that decision visible and owned).",
        humanAccountabilityPoint: "ITFM / Demand Management Lead (with Business Relationship Managers)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "IT-spend value is realized on linked levers, and the binding truths gate " +
        "every one of them. The PREREQUISITE is cost transparency: without a " +
        "defensible, GL-reconciled, taxonomy-mapped cost model, savings are " +
        "anecdotes and benchmarks are uncomparable — so the first value is simply " +
        "making the base explainable. On that base, the LARGEST and FASTEST " +
        "recoverable pool is almost always SHELFWARE (unused/under-utilized " +
        "software and SaaS licenses) and REDUNDANT/overlapping applications — low " +
        "architecture risk, current-year cash, and concentrated in a handful of " +
        "decisions no one currently owns. Beyond that, CLOUD/INFRASTRUCTURE " +
        "right-sizing and commitment coverage, RUN-VS-CHANGE re-balancing (shifting " +
        "freed run cost into change/grow), and VENDOR RENEWAL optimization add " +
        "further value. But engineered savings LEAK BACK: license counts creep, " +
        "cloud waste regrows, and the run base re-inflates UNLESS demand " +
        "management, showback/chargeback, and a governed run-rate hold the line. " +
        "So durable, defensible value is sized on a TRANSPARENT cost base, weighted " +
        "to the shelfware/redundancy pool, and explicitly haircut for the " +
        "re-inflation that occurs without demand governance and for the cost-to-" +
        "achieve of rationalization — never on a headline 'X% IT cost-out' with no " +
        "cost model behind it.",
      dominantHaircutFactors: [
        {
          factor: "Savings re-inflation without demand governance",
          rationale:
            "The dominant durability haircut: one-time cost-out reverts because " +
            "license counts creep, cloud waste regrows, new tools accrete, and " +
            "demand the business never sees expands unchecked. Forward value must " +
            "be discounted by the share that will leak back absent demand " +
            "management, showback/chargeback, and a governed run-rate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Observed re-inflation of cost-out within 1-2 years where no demand " +
              "governance held the line; widens where cloud and SaaS are the " +
              "savings source",
            label: "planning-range",
          },
        },
        {
          factor: "Cost-model maturity & transparency readiness",
          rationale:
            "Every savings estimate, benchmark, and showback depends on a clean, " +
            "GL-reconciled, taxonomy-mapped cost model. A large unallocated " +
            "residual, dirty vendor/invoice data, and a non-comparable taxonomy " +
            "cap the credibility and the realizable opportunity — you cannot " +
            "optimize or defend what the cost model cannot explain.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reduction in realizable/defensible opportunity where the cost " +
              "model was immature, low-coverage, or built on a non-comparable " +
              "taxonomy",
            label: "planning-range",
          },
        },
        {
          factor: "Decommission / rationalization cost-to-achieve",
          rationale:
            "Application rationalization and migrate dispositions carry one-time " +
            "cost — migration, integration rework, data archival, contract exit, " +
            "and change effort — that nets against the run-cost savings. Gross " +
            "decommission value must be haircut to net, and the slowest-to-realize " +
            "candidates discounted for execution risk and stranded dependencies.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Cost-to-achieve and stranded-dependency drag observed on " +
              "application-decommission and consolidation programs, netting gross " +
              "run savings down to realized",
            label: "planning-range",
          },
        },
        {
          factor: "Organizational ownership & adoption of cost discipline",
          rationale:
            "Reclaim, decommission, and right-sizing decisions stall when no one " +
            "owns the sunset, business owners resist losing a tool, or engineering " +
            "teams won't accept cost accountability. Identified opportunity sits " +
            "in a backlog and never realizes without named owners and adoption of " +
            "the cost-discipline operating model.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Identified-but-unrealized optimization where decommission/reclaim " +
              "decisions lacked named owners or stalled in governance",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Software / SaaS license reclaim & right-sizing (shelfware)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported reclaim on the software/SaaS license base from shelfware " +
              "removal, tier-downgrade, and duplicate-tool consolidation in " +
              "ungoverned estates",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in annual software/SaaS license spend from " +
            "reclaiming unused entitlements and right-sizing tiers, net of " +
            "compliance floor",
        },
        {
          lever: "Application rationalization run-cost reduction (net)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Net run-cost reduction from decommissioning redundant/end-of-life " +
              "apps and consolidating overlap, after cost-to-achieve",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in application run cost (license + infra + support " +
            "+ integration) from the rationalization pipeline, net of migration " +
            "cost-to-achieve",
        },
        {
          lever: "Cloud / infrastructure waste reduction (FinOps)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported cloud/infra savings from right-sizing, idle/orphan " +
              "removal, and commitment (reserved/savings-plan) coverage in " +
              "un-optimized estates",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in cloud/infrastructure spend from utilization " +
            "improvement and commitment optimization, before regrowth",
        },
      ],
      timeToValueBand:
        "Cost-transparency model / GL-reconciled taxonomy: 1-2 quarters to stand " +
        "up to credible coverage. Shelfware/license reclaim and cloud right-sizing: " +
        "1-2 quarters to first realized cash, timed to renewals and billing cycles. " +
        "Application rationalization: 2-4 quarters to first decommissions, with " +
        "run savings lagging as migration cost-to-achieve is worked off. Demand " +
        "management / showback and a governed run-rate that makes savings durable: " +
        "compound over 12-24 months. Full TBM/ITFM operating-model maturity across " +
        "the spend base: 18-36 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "TBM / IT financial management (ITFM) platform",
          role:
            "The cost-transparency cost model — taxonomy, allocation engine, " +
            "tower/service costing, run-vs-change, showback/chargeback, and " +
            "benchmarking — the source of truth for where IT money goes.",
          examples: ["Apptio (IBM)", "ServiceNow ITFM/Cloud Cost Mgmt", "Nicus", "Tangoe"],
        },
        {
          name: "Application portfolio management (APM)",
          role:
            "Application inventory, business-capability mapping, technical-health " +
            "and lifecycle, and TIME disposition — the rationalization source of " +
            "truth.",
          examples: ["LeanIX (SAP)", "ServiceNow APM", "Ardoq", "MEGA HOPEX"],
        },
        {
          name: "Software asset management (SAM) / SaaS-management platform",
          role:
            "License entitlements, contracts, usage telemetry, compliance " +
            "position, and renewal calendar — the shelfware and license-" +
            "optimization source of truth.",
          examples: ["Flexera", "ServiceNow SAM", "Zylo", "Productiv"],
        },
        {
          name: "Cloud cost management / FinOps platform",
          role:
            "Tagged cloud billing and utilization, right-sizing and commitment " +
            "recommendations, anomaly detection, and team-level showback — the " +
            "cloud-optimization source of truth.",
          examples: ["CloudHealth (VMware)", "Apptio Cloudability", "AWS/Azure/GCP native cost tools", "Harness FinOps"],
        },
        {
          name: "ERP / GL & CMDB",
          role:
            "The GL spend actuals the cost model reconciles to, and the CMDB " +
            "consumption/configuration data that drives allocation and unit-cost " +
            "denominators.",
          examples: ["SAP S/4HANA", "Oracle Fusion", "Workday Financials", "ServiceNow CMDB"],
        },
      ],
      roles: [
        {
          title: "CIO / IT leadership",
          accountability:
            "Total IT spend, the run-vs-change mix, IT-intensity vs peers, and " +
            "the credibility of IT's cost story with the CFO and the board.",
        },
        {
          title: "IT Financial Management (ITFM) / TBM Lead",
          accountability:
            "The cost-transparency model, taxonomy and allocation, cost-model " +
            "coverage and GL reconciliation, benchmarking, and showback/chargeback.",
        },
        {
          title: "FinOps Lead / Cloud Cost Owner",
          accountability:
            "Cloud cost variance to budget, infrastructure utilization, " +
            "commitment coverage, and team-level cloud cost accountability.",
        },
        {
          title: "Enterprise Architecture / Application Portfolio Owner",
          accountability:
            "Application redundancy, TIME dispositions, the rationalization " +
            "pipeline, and the net run-cost reduction from decommissioning.",
        },
        {
          title: "Software Asset Manager (SAM)",
          accountability:
            "License utilization and compliance, shelfware reclaim, renewal " +
            "optimization, and the software/SaaS portfolio's spend.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Software license compliance & vendor audit exposure",
          relevance:
            "License optimization must preserve compliance — reclaim and right-" +
            "sizing reduce over-spend but under-licensing creates audit/true-up " +
            "exposure (ELA/EA, named-user, processor metrics); the floor is a " +
            "compliant position, not the lowest count.",
        },
        {
          name: "Capitalization & cost-accounting standards (capex/opex, cloud, SaaS)",
          relevance:
            "IT cost transparency must respect capex/opex classification, " +
            "software-capitalization, and cloud/SaaS cost-accounting rules so the " +
            "cost model reconciles to the GL and savings are reported on a defensible basis.",
        },
        {
          name: "Cloud data-residency & sovereignty (where applicable)",
          relevance:
            "Cloud cost optimization (region choice, commitment placement, " +
            "consolidation) is constrained by data-residency and sovereignty " +
            "obligations that can override the lowest-cost option.",
        },
        {
          name: "Confidentiality of vendor contract & pricing terms",
          relevance:
            "Vendor pricing, ELA terms, and renewal positions are confidential; " +
            "AI analytics and benchmarking over this data must respect access " +
            "controls and NDA constraints.",
        },
      ],
      canonicalTerms: [
        {
          term: "Technology Business Management (TBM)",
          definition:
            "A standard taxonomy and discipline for IT cost transparency that " +
            "maps spend from cost pools to IT towers to IT services to the " +
            "business units and applications that consume them.",
        },
        {
          term: "Run vs change/grow",
          definition:
            "The split of IT spend between operating/maintaining the existing " +
            "estate (run / keep-the-lights-on) and new investment and " +
            "transformation (change/grow); shifting the mix toward change is the " +
            "point of cost-out.",
        },
        {
          term: "Shelfware",
          definition:
            "Software and SaaS licenses or seats that are paid for but unused or " +
            "materially under-utilized — the fastest, lowest-risk recoverable " +
            "spend pool.",
        },
        {
          term: "Application rationalization / TIME",
          definition:
            "Assessing the application portfolio and assigning a Tolerate, " +
            "Invest, Migrate, or Eliminate disposition per app to drive " +
            "consolidation and decommissioning of redundant and end-of-life apps.",
        },
        {
          term: "FinOps",
          definition:
            "The operating discipline for continuous cloud cost management — " +
            "visibility (tagging), optimization (right-sizing, commitments), and " +
            "team-level accountability — that keeps cloud waste from regrowing.",
        },
        {
          term: "Showback / chargeback & demand management",
          definition:
            "Exposing business consumers to the cost of what they consume " +
            "(showback) or billing them for it (chargeback), with a demand-intake " +
            "process — the governance that makes engineered savings durable.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "IT cost transparency and the run-vs-change mix",
        authoritativeSource:
          "TBM/ITFM cost model: spend traced through the taxonomy and reconciled " +
          "to the GL, with the unallocated residual and run-vs-change split shown",
        whatGoodEvidenceLooksLike:
          "Total IT spend reconciled to the GL, mapped through cost pools → " +
          "towers → services → business units, with cost-transparency coverage % " +
          "and the run-vs-change ratio quantified and the residual stated.",
        weakEvidenceToReject:
          "A headline IT-spend number or 'X% is run' with no cost model, no GL " +
          "reconciliation, and a large unexplained 'IT overhead' pool.",
      },
      {
        claim: "Shelfware and software/SaaS license utilization",
        authoritativeSource:
          "SAM / SaaS-management platform: entitlements matched to active-usage " +
          "telemetry (SSO/login, feature usage) by application and user",
        whatGoodEvidenceLooksLike:
          "License utilization by application with entitlements vs active usage, " +
          "shelfware quantified and reclaimable at renewal, and the compliance " +
          "position stated so reclaim does not create under-licensing.",
        weakEvidenceToReject:
          "An 'our licenses are mostly used' assertion with no usage telemetry, " +
          "or a reclaim estimate that ignores compliance/audit exposure.",
      },
      {
        claim: "Application redundancy and rationalization candidates",
        authoritativeSource:
          "APM inventory with capability mapping, per-app cost from the cost " +
          "model, usage telemetry, and TIME dispositions with a named owner",
        whatGoodEvidenceLooksLike:
          "Redundancy % and rationalization-candidate % with per-app cost, usage, " +
          "redundancy, and technical-health scoring, net decommission savings " +
          "after cost-to-achieve, and a named owner per disposition.",
        weakEvidenceToReject:
          "An app count or a gross 'we can cut N apps' with no per-app cost, no " +
          "usage data, no cost-to-achieve, and no owner accountable for the sunset.",
      },
      {
        claim: "Cloud cost variance, waste, and savings durability",
        authoritativeSource:
          "FinOps platform: tagged cloud actuals vs budget, utilization, and " +
          "commitment coverage, trended to show whether savings hold or regrow",
        whatGoodEvidenceLooksLike:
          "Cloud variance to budget and infrastructure utilization with tagging " +
          "coverage stated, commitment coverage shown, and a trend proving savings " +
          "held (or regrew) — tied to demand-governance/showback in place.",
        weakEvidenceToReject:
          "A one-time cloud-savings figure with no tagging coverage, no trend, " +
          "and no evidence the savings held rather than re-inflating.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your IT spend can you trace through a defensible cost model to a specific IT service, application, and consuming business unit — and how big is the unallocated residual?",
      "What is your run-vs-change/grow split, and is the cost-out goal to shrink the total or to shift the mix toward change/grow investment capacity?",
      "What is your software/SaaS license utilization, and how much spend is shelfware — paid-for licenses and seats with no active usage you could reclaim at the next renewal?",
      "How many applications are functionally redundant or end-of-life, and what is blocking the decommission decisions — analysis, or is it that no one owns the sunset?",
      "What is your cloud cost variance to budget and infrastructure utilization, and do engineering teams see and own their cloud cost — or does waste regrow after each clean-up?",
      "After your last cost-out program, did the savings hold — or did spend re-inflate because there is no demand governance, showback, or consumption accountability holding the line?",
      "When you claim IT savings, are they reconciled to the GL against a defined baseline in a transparent cost model, and is it realized cash or cost-avoidance counted as cash?",
    ],
    maturitySignals: [
      "A GL-reconciled TBM/ITFM cost model maps the large majority of spend through a standard taxonomy with the unallocated residual quantified, not a black box.",
      "Shelfware is measured continuously against active-usage telemetry and reclaimed at renewal, with the compliance position preserved.",
      "The application portfolio carries TIME dispositions with a named owner per app, and a governed decommission pipeline actually moves rather than stalling in a backlog.",
      "Cloud cost is tagged, team-level showback exists, and FinOps runs continuously so utilization holds and waste does not regrow between clean-ups.",
      "Demand management and showback/chargeback hold the run-rate, so prior cost-out savings stayed out rather than re-inflating within a year or two.",
    ],
    redFlags: [
      "Savings are claimed as a headline percentage with no transparent cost model, no GL reconciliation, and cost-avoidance counted as realized cash — the number cannot be trusted.",
      "A large unallocated 'IT overhead / shared services' pool means most spend is untraceable, so optimization is guesswork and chargeback disputes are unwinnable.",
      "Shelfware and redundant/end-of-life apps are known to be large but the decommission and reclaim decisions never move because no one owns the sunset.",
      "Cost-out from a prior program re-inflated within a year because there is no demand governance, showback, or consumption accountability holding the run-rate.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "TBM / ITFM platforms (Apptio/IBM, ServiceNow ITFM, Nicus)",
        category: "IT cost transparency, allocation, run-vs-change, showback/chargeback",
        switchingCost:
          "High — the curated taxonomy, allocation rules, GL-reconciliation logic, and history accrete; rebuilding the cost model on a new platform is a multi-quarter program and the real lock-in.",
        renewalDynamics:
          "Subscription by spend-under-management / module; AI benchmarking, cloud-cost, and SaaS-management modules increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Application portfolio management (LeanIX/SAP, ServiceNow APM, Ardoq)",
        category: "Application inventory, capability mapping, TIME rationalization",
        switchingCost:
          "Moderate-to-high — the curated capability model, app metadata, and dispositions accrete; re-surveying the estate on a new tool is costly even though feeds are re-mappable.",
        renewalDynamics:
          "Subscription by application/user count; depth of capability mapping and integration breadth drive stickiness and price.",
      },
      {
        vendorName: "SAM / SaaS-management (Flexera, ServiceNow SAM, Zylo, Productiv)",
        category: "License entitlement, usage telemetry, compliance, renewal optimization",
        switchingCost:
          "Moderate — entitlement records, usage history, and contract metadata accrete, but discovery agents and SSO integrations are re-deployable; switching cost rises with depth of usage history.",
        renewalDynamics:
          "Subscription by managed-spend / app count; the value lever is realized shelfware reclaim and compliance avoidance at renewal.",
      },
      {
        vendorName: "Cloud cost / FinOps platforms (CloudHealth, Cloudability, native cloud tools)",
        category: "Cloud cost visibility, right-sizing, commitment optimization, anomaly detection",
        switchingCost:
          "Low-to-moderate — billing feeds and tags are re-ingestible and native cloud tools are free; the switching cost is the tagging taxonomy, custom showback model, and accountability process built on top.",
        renewalDynamics:
          "Often a % of managed cloud spend or subscription; native-vs-third-party bundling and realized savings are the renewal levers.",
      },
      {
        vendorName: "Strategic IT mega-vendors (hyperscalers, ERP, productivity suites, top SIs)",
        category: "The underlying IT spend being optimized — ELA/EA renewals and bundles",
        switchingCost:
          "High — these are the spend pools optimization targets; ELA/EA bundles, data gravity, and skills lock-in make re-platforming a major program, so the lever is renewal negotiation more than switching.",
        renewalDynamics:
          "Multi-year ELA/EA with true-ups and bundle pricing; concentration creates leverage but also audit and bundle-lock exposure — renewal timing and usage data are the key levers.",
      },
    ],
    switchingCosts:
      "The TBM/ITFM cost-model platform and the APM capability model are the " +
      "stickiest layers — the curated taxonomy, allocation logic, dispositions, " +
      "and history are the lock-in, and a re-platform is a multi-quarter program. " +
      "SAM, FinOps, and cloud-cost tooling are more replaceable (feeds and " +
      "integrations re-deploy), with the curated tagging/usage estate the true " +
      "switching cost. The largest dollars, though, sit in the underlying " +
      "mega-vendor ELAs/EAs being optimized: those are negotiated at renewal " +
      "rather than switched, so the optimization frontier is the renewal " +
      "negotiation and the AI/analytics add-ons around the management cores.",
    negotiationLevers: [
      "Re-price TBM/APM/SAM platform subscriptions on realized coverage and realized savings (spend mapped, shelfware reclaimed) rather than promised scope",
      "Time mega-vendor ELA/EA renewals to usage and shelfware evidence — true-down to the used (not provisioned) count and challenge bundle pricing",
      "Outcome/value pricing on AI optimization add-ons tied to measured cost-out (license reclaim, cloud waste reduction, run-cost reduction) rather than seats",
      "Bundle native cloud-cost and integrated-suite SAM/FinOps capability against best-of-breed at renewal to discipline pricing",
      "Data-export, taxonomy-ownership, and model-portability rights to prevent cost-model and capability-model lock-in on the TBM/APM cores",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cost_transparency_claim: [
        "cost model reconciled to the GL through the TBM taxonomy",
        "cost-transparency coverage % and the unallocated residual",
        "run-vs-change/grow split basis",
      ],
      savings_claim: [
        "defined baseline in the transparent cost model",
        "realized cash reconciled to the GL (not cost-avoidance counted as cash)",
        "net of cost-to-achieve and the durability/re-inflation assumption",
      ],
      license_claim: [
        "entitlements matched to active-usage telemetry",
        "shelfware quantified and reclaimable at renewal",
        "compliance position preserved (no under-licensing exposure)",
      ],
      rationalization_claim: [
        "per-app cost, usage, redundancy, and technical-health scoring",
        "net decommission savings after cost-to-achieve",
        "named business owner per TIME disposition",
      ],
      cloud_claim: [
        "tagged cloud actuals vs budget and utilization",
        "commitment coverage and tagging-coverage confidence",
        "trend showing savings held vs regrew, tied to demand governance",
      ],
      value_projection: [
        "a transparent, taxonomy-normalized cost base as the sized base (not a headline %)",
        "lever ranges weighted to shelfware/redundancy, given as labelled planning ranges",
        "explicit haircut factors (re-inflation, cost-model maturity, cost-to-achieve, adoption)",
        "GL reconciliation path and the demand-governance assumption behind durability",
      ],
    },
    citationStandard:
      "Quantitative IT-spend claims cite the system of record (TBM/ITFM cost " +
      "model, APM, SAM/SaaS-management, FinOps platform) and the period and " +
      "taxonomy basis. Savings claims state the defined baseline, distinguish " +
      "REALIZED CASH from cost-avoidance, reconcile to the GL, and net cost-to-" +
      "achieve — never a headline cost-out percentage with no cost model behind " +
      "it. Coverage and benchmark claims state cost-transparency coverage % and " +
      "the comparable taxonomy/peer set. Value projections size against a " +
      "transparent cost base, give labelled planning ranges weighted to the " +
      "shelfware/redundancy pool, name the haircut factors, state the demand-" +
      "governance durability assumption, and give the GL reconciliation path — " +
      "never a single asserted cost-out number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no transparent cost model or a large unallocated residual — gate any savings estimate on cost-transparency readiness and surface the residual before quoting a prize.",
      "A cost-out figure is cited without a GL reconciliation — frame as identified/projected pending realized-cash reconciliation, and separate cost-avoidance from cash.",
      "Savings durability is assumed without demand governance in place — apply a re-inflation planning haircut and flag that savings will leak back without showback/demand management.",
      "Benchmarks are cited against a non-comparable taxonomy or wrong peer set — flag the comparability basis before reading a tenant as high or low cost.",
    ],
    inferenceLanguage: [
      "Across enterprise IT estates at this scale, IT spend as a % of revenue and the run-vs-change mix typically run... (industry pattern, not your measured figure)...",
      "Without your license-usage telemetry, the industry pattern suggests shelfware of roughly... of the software/SaaS base, reclaimable at renewal...",
      "Peer estates commonly carry application redundancy in the range of... before a rationalization cycle...",
      "Treating this as a planning range on a transparent cost base rather than your measured cost model...",
    ],
    flagWithoutEvidence: [
      "A specific realized IT cost-out or savings number for this tenant",
      "This tenant's actual cost-transparency coverage, run-vs-change mix, license utilization, or application redundancy",
      "A cost-avoidance or identified figure presented as realized cash without a GL reconciliation",
      "A savings prize sized as a headline % with no transparent cost model behind it, or durable savings assumed without demand governance",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "where does IT money go / cost transparency by tower and business unit",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack total IT spend through the TBM taxonomy — by cost pool/tower with run-vs-change and the unallocated residual shown — so the consuming business units and the recoverable pools are visible.",
    },
    {
      questionPattern:
        "cost-out story / from gross opportunity to durable realized savings",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from the transparent cost base to gross opportunity (shelfware, redundancy, cloud waste) to net realized savings, with the cost-to-achieve, re-inflation, and adoption haircuts shown explicitly.",
    },
    {
      questionPattern:
        "value sensitivity to re-inflation, cost-model maturity, and cost-to-achieve",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of savings sensitivity to the dominant haircut factors (re-inflation without demand governance, cost-model maturity, decommission cost-to-achieve, organizational adoption).",
    },
    {
      questionPattern: "IT spend KPI scorecard vs benchmarks",
      exhibitKind: "table",
      note: "IT spend % revenue, run-vs-change ratio, cost-transparency coverage, license utilization, application redundancy, cloud variance to budget, unit-cost trend, IT spend per employee, % rationalization candidates, vendor concentration, demand-driven spend % versus planning ranges.",
    },
    {
      questionPattern: "application rationalization pipeline / what to decommission next",
      exhibitKind: "table",
      note: "Per application: annual cost (license+infra+support), usage, redundancy/overlap, technical health, business value, TIME disposition, net decommission savings after cost-to-achieve, named owner, and priority.",
    },
    {
      questionPattern: "run-vs-change shift over time / freeing investment capacity",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend run % of total spend and cost-transparency coverage against the planning range, annotating where freed run cost was redeployed into change/grow.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A defensible, GL-reconciled cost model is built FIRST, so the opportunity is sized honestly, benchmarks are comparable, and savings reconcile rather than being anecdotes",
      "The fast, low-risk shelfware and redundancy pools are attacked early to fund credibility and momentum before the harder rationalization work",
      "Application rationalization carries a named owner per TIME disposition and a governed decommission pipeline that actually moves rather than stalling in a backlog",
      "Demand management, showback/chargeback, and a governed run-rate are stood up so engineered savings stay out instead of re-inflating",
    ],
    failureDrivers: [
      "Claiming a headline cost-out percentage with no transparent cost model, no GL reconciliation, and cost-avoidance counted as realized cash — finance loses trust",
      "Leaving most spend in an unallocated 'IT overhead' pool so optimization is guesswork and every chargeback dispute is unwinnable",
      "Identifying large shelfware and redundancy but never realizing it because no one owns the reclaim and decommission decisions",
      "Cutting cost once with no demand governance, so license counts creep, cloud waste regrows, and the run base re-inflates within a year or two",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Cost transparency and benchmarking adopt first because they are low-risk " +
      "and make the opportunity tangible. Shelfware/license reclaim and cloud " +
      "right-sizing follow fast and self-fund. Application rationalization is " +
      "harder and slower — it requires business owners to accept decommission risk " +
      "and carries cost-to-achieve. Demand management and showback/chargeback are " +
      "the hardest and most cultural — they require the business to own its " +
      "consumption — and they are where durability is won or lost, so they lag and " +
      "decide whether the savings stay out.",
    roiClarity: "medium",
    roiClarityBasis:
      "IT-spend ROI is firm where it is measured against a transparent cost model " +
      "and realized as cash — license reclaim and cloud right-sizing are directly " +
      "attributable in the contract/billing — but soft where cost-avoidance is " +
      "counted as cash, where the baseline is undefined, or where savings re-" +
      "inflate without demand governance. Application-rationalization ROI is real " +
      "but lagged by cost-to-achieve and stranded dependencies. This is why the " +
      "value model insists on a transparent base, realized cash, explicit haircuts, " +
      "and a demand-governance durability assumption rather than a headline cost-" +
      "out percentage.",
  },

  regulatoryFrame: {
    name: "License compliance, capex/opex cost-accounting & vendor-contract confidentiality",
    relevance:
      "The dominant constraints on IT spend optimization: license optimization " +
      "must preserve a COMPLIANT position (reclaim and right-sizing reduce over-" +
      "spend, but under-licensing creates ELA/EA audit and true-up exposure); the " +
      "cost model must respect capex/opex, software-capitalization, and cloud/SaaS " +
      "cost-accounting rules so savings reconcile to the GL on a defensible basis; " +
      "cloud optimization is bounded by data-residency/sovereignty where " +
      "applicable; and vendor pricing/ELA terms are confidential, so AI analytics " +
      "and benchmarking over this data must respect access controls (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
