// Consilium expert — Procurement & Strategic Sourcing (cross-cutting).
//
// W3 wave2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting,
// cross-industry expert spanning the STRATEGIC SOURCING / category-management
// layer of the enterprise: category management, strategic sourcing
// (source-to-contract), supplier relationship & risk management, contract
// management, spend analytics, savings realization, and tail-spend management.
// Product-aware (S2C/S2P suites, spend-analytics, CLM, SRM), not product-locked.
//
// SCOPE FENCE — this is the STRATEGIC layer, NOT the transactional one. It is
// DISTINCT from Back-Office Shared Services (transactional procure-to-pay / AP
// invoice processing) and from Supply Chain (demand/supply planning, inventory,
// logistics). This expert owns WHAT to buy and FROM WHOM under WHAT TERMS — the
// category strategy, the sourcing event, the negotiated contract, the supplier
// relationship — not the requisition-to-pay transaction or the inventory plan.
//
// CORE DOCTRINE — ADDRESSABLE SPEND % AND SAVINGS LEAKAGE ARE THE BINDING
// TRUTHS. The headline number a CPO is judged on — negotiated savings — is the
// most over-stated figure in the function. Two truths gate it: (1) only the
// ADDRESSABLE / influenceable share of spend can be sourced at all (non-
// addressable spend — taxes, intercompany, regulated pass-through, sole-source
// — is off the table), and (2) negotiated savings LEAK on the way to the P&L:
// the gap between savings signed at the table and savings realized in the GL is
// the binding truth, and MAVERICK / TAIL SPEND is what erodes it — buyers
// transacting off-contract simply do not capture the price they negotiated.
// So value must be sized on addressable spend and on REALIZED (not negotiated)
// savings, with the leakage haircut made explicit — never on a headline
// negotiated-savings number.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const procurementSourcingExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.procurement-strategic-sourcing",
    expertName: "Procurement & Strategic Sourcing Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "procurement-strategic-sourcing",
    scopeNote:
      "Cross-cutting, cross-industry expert for the STRATEGIC SOURCING / " +
      "category layer of enterprise procurement: category management, strategic " +
      "sourcing (source-to-contract), supplier relationship & risk management, " +
      "contract management, spend analytics, savings realization, and tail-spend " +
      "management. Owns WHAT to buy, FROM WHOM, and under WHAT TERMS — category " +
      "strategy, the sourcing event, the negotiated contract, and the supplier " +
      "relationship. Product-aware across S2C/S2P suites, spend-analytics, CLM, " +
      "and SRM tooling, not product-locked. CORE DOCTRINE: addressable-spend % " +
      "and savings LEAKAGE (negotiated-vs-realized) are the binding truths and " +
      "maverick/tail spend erodes value, so value is sized on addressable spend " +
      "and REALIZED savings, never a headline negotiated number. DISTINCT FROM " +
      "Back-Office Shared Services (transactional procure-to-pay / AP invoice " +
      "processing) and Supply Chain (demand/supply planning, inventory, " +
      "logistics) — those are separate experts; this one owns the strategic " +
      "source-to-contract layer, not the transaction or the inventory plan.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "spend_under_management_pct",
        name: "Spend under management (SUM) %",
        definition:
          "Share of total enterprise third-party spend actively managed by " +
          "procurement — sourced, contracted, and category-strategized — rather " +
          "than spent outside procurement's influence.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Hackett / CIPS procurement-maturity benchmarks; world-class CPO " +
            "organizations manage 85-90%+ of spend, under-resourced functions " +
            "well below 70%",
          label: "planning-range",
        },
        dataSource:
          "Spend-analytics platform: classified spend cube tagged managed-vs-" +
          "unmanaged against the AP/ERP spend base",
        whyItMatters:
          "The headline coverage metric — procurement can only create value on " +
          "spend it touches. Low SUM means large pools of spend are sourced ad " +
          "hoc with no leverage, and it is the denominator every savings claim " +
          "must be read against.",
      },
      {
        key: "addressable_spend_sourced_pct",
        name: "% addressable spend sourced",
        definition:
          "Share of the ADDRESSABLE (influenceable) spend base that has been " +
          "through a competitive sourcing event or strategic negotiation in a " +
          "rolling window — excluding non-addressable spend (taxes, " +
          "intercompany, regulated pass-through, true sole-source).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Hackett sourcing-coverage ranges on the addressable base; mature " +
            "functions cycle 70-85% of addressable spend through sourcing, " +
            "laggards leave half un-sourced",
          label: "planning-range",
        },
        dataSource:
          "Sourcing (S2C) platform event coverage matched to the addressable " +
          "spend cube in the spend-analytics platform",
        whyItMatters:
          "The honest ceiling on the savings prize — only addressable spend can " +
          "be sourced, so this defines the realistic opportunity. Confusing total " +
          "spend with addressable spend is the most common way savings cases are " +
          "over-stated.",
      },
      {
        key: "negotiated_savings_pct",
        name: "Negotiated (identified) savings %",
        definition:
          "Savings agreed at the table from sourcing events and negotiations as " +
          "a percentage of the sourced spend — the price reduction or cost " +
          "avoidance BEFORE leakage, i.e. the number signed, not yet realized.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 4,
          high: 15,
          basis:
            "Sourcing-event benchmarks across categories; first-time sourcing of " +
            "an unmanaged category yields more, mature re-sourced categories " +
            "yield low-single-digit incremental",
          label: "planning-range",
        },
        dataSource:
          "Sourcing (S2C) platform event outcomes versus the pre-event baseline " +
          "price/spend",
        whyItMatters:
          "The figure the function is judged on at the table — but the most " +
          "over-stated, because negotiated is not realized. It must always be " +
          "read together with the realization/leakage rate to know what actually " +
          "lands in the P&L.",
      },
      {
        key: "savings_realization_rate",
        name: "Savings realization rate (leakage)",
        definition:
          "Share of NEGOTIATED savings that is actually realized in the GL — " +
          "(realized savings / negotiated savings). The complement is the " +
          "LEAKAGE rate: the negotiated savings that never reach the P&L.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Procurement value-realization benchmarks; disciplined functions " +
            "realize 80-90% of negotiated savings, weak compliance/tracking " +
            "leaks 30-50% before it reaches the GL",
          label: "planning-range",
        },
        dataSource:
          "Savings-tracker reconciled to GL/AP actuals: realized price/volume " +
          "versus the negotiated baseline, by category",
        whyItMatters:
          "THE binding truth of the function — negotiated savings only matter if " +
          "they land. Leakage from maverick spend, off-contract buying, price " +
          "creep, and volume shortfall is where most savings evaporate; this is " +
          "the number the CFO trusts over the headline negotiated figure.",
      },
      {
        key: "maverick_spend_pct",
        name: "Maverick (off-contract) spend %",
        definition:
          "Share of addressable spend transacted off-contract / off-catalog / " +
          "with non-preferred suppliers, outside the negotiated terms procurement " +
          "put in place.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Hackett / spend-compliance ranges; world-class functions hold " +
            "maverick spend below 10%, undermanaged categories run 25-30%+",
          label: "planning-range",
        },
        dataSource:
          "Spend analytics: PO/invoice spend matched to active contracts and " +
          "preferred suppliers in the S2P/contract systems",
        whyItMatters:
          "The direct driver of savings leakage — every dollar bought off-" +
          "contract forfeits the negotiated price and inflates supplier risk and " +
          "tail. Maverick spend is the single biggest reason realization lags " +
          "negotiated savings.",
      },
      {
        key: "contract_compliance_rate",
        name: "Contract compliance rate (on-contract spend)",
        definition:
          "Share of addressable spend transacted on a negotiated contract / " +
          "preferred supplier at the contracted price and terms — the positive " +
          "counterpart to maverick spend.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Hackett spend-compliance ranges; world-class 85-90%+, undermanaged " +
            "categories well below 70%",
          label: "planning-range",
        },
        dataSource:
          "Spend analytics: PO/invoice spend matched to active contracts and " +
          "contracted price/terms in the contract-management system",
        whyItMatters:
          "Where negotiated savings either stick or evaporate. High compliance " +
          "converts negotiated savings into realized savings; low compliance is " +
          "the leakage symptom that AI spend classification surfaces.",
      },
      {
        key: "supplier_risk_coverage_pct",
        name: "Supplier risk coverage %",
        definition:
          "Share of critical / high-spend suppliers with an active, current " +
          "risk assessment (financial, cyber, geopolitical, compliance/ESG, " +
          "single-source) on file and monitored.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Supplier-risk-management maturity ranges; mature SRM programs " +
            "monitor 80-90% of critical suppliers continuously, reactive " +
            "functions cover under half and only annually",
          label: "planning-range",
        },
        dataSource:
          "SRM / supplier-risk platform: assessed-and-monitored critical " +
          "suppliers over the critical-supplier population",
        whyItMatters:
          "Unmonitored critical suppliers are the source of disruption and " +
          "compliance exposure that surprises the enterprise. Coverage measures " +
          "whether supplier risk is managed proactively or discovered after a " +
          "failure.",
      },
      {
        key: "sourcing_cycle_time",
        name: "Sourcing cycle time (source-to-contract)",
        definition:
          "Average elapsed days from sourcing-event kickoff (or category " +
          "strategy approval) to a signed contract — the speed of the strategic " +
          "source-to-contract process.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 120,
          basis:
            "Source-to-contract cycle-time benchmarks; templated / lower-" +
            "complexity events close in 30-45 days, complex strategic sourcing " +
            "and negotiation run 90-120+",
          label: "planning-range",
        },
        dataSource:
          "Sourcing (S2C) and contract-lifecycle (CLM) platform timestamps from " +
          "event kickoff to executed contract",
        whyItMatters:
          "Slow sourcing pushes the business off-process into maverick spend and " +
          "delays savings capture. Cycle time is the throughput unit of the " +
          "function and a direct driver of how much addressable spend can be " +
          "cycled through sourcing.",
      },
      {
        key: "tail_spend_pct",
        name: "Tail spend %",
        definition:
          "Share of total spend in the long tail — typically the bottom ~20% of " +
          "spend spread across ~80% of suppliers — that is fragmented, low-" +
          "value-per-transaction, and largely un-sourced.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 25,
          basis:
            "Spend-distribution benchmarks; the tail commonly represents 15-20% " +
            "of spend across the majority of suppliers, higher in fragmented or " +
            "decentralized estates",
          label: "planning-range",
        },
        dataSource:
          "Spend analytics: spend concentration (Pareto) by supplier and " +
          "category from the classified spend cube",
        whyItMatters:
          "The tail is where leakage, maverick spend, and supplier-risk and " +
          "onboarding cost concentrate, while yielding little per transaction. " +
          "It is the prime target for catalog/marketplace consolidation and " +
          "agentic tail-spend management.",
      },
      {
        key: "supplier_consolidation_ratio",
        name: "Supplier consolidation ratio (spend concentration)",
        definition:
          "Concentration of spend across suppliers — e.g. the share of spend " +
          "with the top suppliers, or the inverse of the active-supplier count " +
          "per category. Higher concentration = fewer suppliers carrying more " +
          "spend.",
        unit: "% spend with top suppliers",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Category-rationalization benchmarks; consolidated categories place " +
            "80-90% of spend with a managed core of preferred suppliers, " +
            "fragmented categories spread it thin across a long tail",
          label: "planning-range",
        },
        dataSource:
          "Spend analytics: supplier-count and spend-concentration analysis by " +
          "category from the classified spend cube",
        whyItMatters:
          "Consolidating spend onto fewer preferred suppliers increases " +
          "leverage, lowers risk and onboarding cost, and is a primary savings " +
          "lever. Read directionally and per category — strategic single-" +
          "sourcing trades leverage against resilience.",
      },
      {
        key: "payment_term_days",
        name: "Payment terms achieved (DPO contribution)",
        definition:
          "Average negotiated supplier payment terms (days) achieved across " +
          "contracted spend — the working-capital lever procurement negotiates " +
          "into contracts, feeding days-payable-outstanding.",
        unit: "days",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 75,
          basis:
            "Working-capital / DPO benchmarks; functions that negotiate terms " +
            "into contracts and run early-pay-discount programs reach 60-75 " +
            "days, weak negotiators sit at 30-45",
          label: "planning-range",
        },
        dataSource:
          "Contract terms in the CLM matched to actual AP payment behavior, by " +
          "supplier/category",
        whyItMatters:
          "Payment-term extension is a direct working-capital release procurement " +
          "controls at the table — but it must be balanced against early-pay " +
          "discounts and supplier health, and tracked as realized (not just " +
          "contracted) to avoid the same leakage problem as savings.",
      },
      {
        key: "procurement_roi",
        name: "Procurement ROI (savings per cost of function)",
        definition:
          "Realized savings (and other quantified value) delivered per dollar of " +
          "fully-loaded procurement operating cost — the function's own value-" +
          "for-money ratio.",
        unit: "x (savings : function cost)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 4,
          high: 10,
          basis:
            "CPO value-for-money benchmarks; well-run functions return " +
            "5-10x their cost in realized savings, sub-scale or low-coverage " +
            "functions below 4x",
          label: "planning-range",
        },
        dataSource:
          "Realized savings from the savings-tracker (GL-reconciled) over fully-" +
          "loaded procurement function cost from the Workforce Economics " +
          "substrate / GL",
        whyItMatters:
          "The board-level justification for the function — and the honest one, " +
          "because it uses REALIZED (not negotiated) savings in the numerator. It " +
          "ties coverage, savings, and leakage discipline into a single ratio the " +
          "CFO can defend.",
      },
    ],

    painThemes: [
      {
        key: "savings_leakage",
        name: "Savings leakage — negotiated value never lands in the P&L",
        description:
          "Savings signed at the table evaporate before reaching the GL: " +
          "buyers transact off-contract, prices creep after the deal, volumes " +
          "fall short of the assumption, and there is no closed-loop tracking " +
          "reconciling negotiated to realized — so the CFO never sees the savings " +
          "procurement claims.",
        detectionSignal:
          "Large gap between negotiated and realized savings, no GL-reconciled " +
          "savings tracker, finance disputes procurement's numbers, savings " +
          "'banked' that never appear in budgets.",
        diagnosticQuestion:
          "What is your savings realization rate — what share of NEGOTIATED " +
          "savings actually lands in the GL — and is it reconciled to finance, " +
          "or is only the negotiated figure tracked?",
      },
      {
        key: "maverick_and_tail_spend",
        name: "Maverick & tail-spend erosion",
        description:
          "A large fragmented tail and off-contract buying erode negotiated " +
          "value: the business buys off-catalog from non-preferred suppliers " +
          "because sourcing is slow or catalogs are clumsy, leaking price, " +
          "inflating supplier count, and starving sourcing of spend visibility.",
        detectionSignal:
          "High maverick-spend and tail-spend %, long tail of one-off suppliers, " +
          "heavy free-text PO and P-card usage, negotiated prices not realized in " +
          "the categories with the worst compliance.",
        diagnosticQuestion:
          "What is your maverick-spend and tail-spend percentage, and how much " +
          "addressable spend is leaking to off-contract, off-catalog, or non-" +
          "preferred-supplier buying?",
      },
      {
        key: "addressable_spend_overstatement",
        name: "Addressable-spend over-statement",
        description:
          "Savings opportunity is sized against TOTAL spend rather than the " +
          "addressable / influenceable base, so the prize is over-stated — non-" +
          "addressable spend (taxes, intercompany, regulated pass-through, true " +
          "sole-source) is counted as sourceable when it is not, and targets " +
          "are unachievable from the start.",
        detectionSignal:
          "Savings targets set as a flat % of total spend, no documented " +
          "addressable-vs-non-addressable split, repeated target misses blamed " +
          "on 'sole-source' and 'pass-through' after the fact.",
        diagnosticQuestion:
          "Have you split your spend into addressable versus non-addressable, " +
          "and is your savings target sized on the addressable base or on total " +
          "spend?",
      },
      {
        key: "dirty_spend_data",
        name: "Dirty, unclassified spend data",
        description:
          "Spend is fragmented across ERPs, P-cards, and free-text POs with no " +
          "clean category taxonomy or supplier normalization, so the function " +
          "cannot see what it buys, from whom, or where the leverage is — making " +
          "category strategy and savings tracking guesswork.",
        detectionSignal:
          "No single classified spend cube, large 'unclassified/other' " +
          "category, duplicate/variant supplier records, manual spreadsheet " +
          "spend cubes refreshed quarterly at best.",
        diagnosticQuestion:
          "Do you have a single classified spend cube with a clean category " +
          "taxonomy and normalized suppliers, or is spend visibility assembled " +
          "manually in spreadsheets?",
      },
      {
        key: "supplier_risk_blindspot",
        name: "Supplier-risk & resilience blind spot",
        description:
          "Critical suppliers are assessed reactively or annually, single-source " +
          "concentrations and sub-tier dependencies are unmapped, and financial/" +
          "cyber/geopolitical/ESG risk surfaces only after a disruption — leaving " +
          "the enterprise exposed where it has the most spend and least optionality.",
        detectionSignal:
          "Low supplier-risk coverage, annual-only assessments, single-source " +
          "criticality unquantified, recent supplier failures that surprised the " +
          "team, no continuous monitoring on the critical base.",
        diagnosticQuestion:
          "What share of your critical suppliers have a current, monitored risk " +
          "assessment, and have you mapped single-source concentrations and sub-" +
          "tier dependencies?",
      },
      {
        key: "contract_value_erosion",
        name: "Contract value erosion & off-system contracts",
        description:
          "Contracts live in shared drives and inboxes rather than a CLM, so " +
          "auto-renewals fire unmanaged, negotiated price/rebate/term clauses " +
          "are never enforced, and obligations and expiries are missed — letting " +
          "value erode quietly after the ink dries.",
        detectionSignal:
          "No central contract repository, surprise auto-renewals, rebates/" +
          "volume-tiers uncaptured, expired contracts still transacting, no " +
          "obligation or milestone tracking.",
        diagnosticQuestion:
          "Are your contracts in a managed CLM with renewal, obligation, and " +
          "rebate/price tracking, or scattered across drives and inboxes where " +
          "value erodes unmanaged?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "spend_classification_analytics",
        name: "AI spend classification & opportunity analytics",
        valueMechanism:
          "Classify and normalize every spend transaction to a clean category " +
          "taxonomy and supplier master, then surface off-contract, duplicate, " +
          "price-variance, and consolidation opportunities — turning fragmented, " +
          "dirty spend into a visible addressable base and a prioritized sourcing " +
          "pipeline, which lifts spend-under-management and contract compliance.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "PO, invoice, and P-card transaction history across ERPs",
          "Supplier master and active contract coverage",
          "A category taxonomy to classify against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Classification errors mislead category strategy — sample-validate accuracy",
          "Surfaced savings are pipeline/opportunity, not realized savings until landed",
          "Addressable-vs-non-addressable tagging must be reviewed, not auto-assumed",
        ],
        metricsMoved: [
          "spend_under_management_pct",
          "addressable_spend_sourced_pct",
          "contract_compliance_rate",
        ],
      },
      {
        key: "agentic_sourcing",
        name: "Agentic & autonomous sourcing events",
        valueMechanism:
          "AI agents draft RFx, recommend supplier shortlists from spend and " +
          "performance history, model award scenarios, and run guided / " +
          "autonomous sourcing for lower-complexity categories — compressing " +
          "source-to-contract cycle time so more addressable spend is cycled " +
          "through competitive sourcing and savings are captured faster.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical sourcing events, awards, and category baselines",
          "Supplier master, performance, and qualification data",
          "Category strategy, specifications, and award/approval policy",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Award decisions above thresholds require human approval, not auto-award",
          "Agent must not shortlist sanctioned or non-compliant suppliers",
          "Autonomy is appropriate for low-complexity categories, not strategic ones",
        ],
        metricsMoved: [
          "sourcing_cycle_time",
          "addressable_spend_sourced_pct",
          "negotiated_savings_pct",
        ],
      },
      {
        key: "tail_spend_automation",
        name: "Tail-spend automation & guided buying",
        valueMechanism:
          "Channel the fragmented tail into managed catalogs, marketplaces, and " +
          "a guided-buying flow with agentic intake — consolidating one-off " +
          "suppliers, pulling off-contract buying onto preferred terms, and " +
          "shrinking the un-sourced tail without a human sourcing every small " +
          "transaction — directly reducing maverick and tail spend.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Tail-spend transaction history and supplier fragmentation analysis",
          "Catalog, marketplace, and preferred-supplier/contract data",
          "Buying policy and approval thresholds for guided intake",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Consolidation must preserve resilience — avoid over-concentrating critical tail",
          "Guided-buying defaults must steer to compliant, contracted suppliers",
          "Marketplace pricing must be monitored against negotiated contract prices",
        ],
        metricsMoved: [
          "tail_spend_pct",
          "maverick_spend_pct",
          "supplier_consolidation_ratio",
        ],
      },
      {
        key: "savings_leakage_tracking",
        name: "AI savings-realization & leakage tracking",
        valueMechanism:
          "Continuously reconcile negotiated savings against GL/AP actuals at " +
          "transaction level, detecting price creep, off-contract buying, and " +
          "volume shortfall as they happen and routing leakage alerts to the " +
          "category owner — closing the loop so negotiated savings actually land " +
          "and contract compliance is enforced rather than assumed.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Negotiated baselines and savings commitments by category/contract",
          "GL/AP actual price and volume transaction data",
          "Active contract prices and terms to reconcile against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Leakage attribution must distinguish maverick spend from legitimate scope change",
          "Realized-savings sign-off remains a finance control, not an automatic posting",
          "Alerts must be tuned to materiality so category owners are not flooded",
        ],
        metricsMoved: [
          "savings_realization_rate",
          "contract_compliance_rate",
          "maverick_spend_pct",
        ],
      },
      {
        key: "supplier_risk_monitoring",
        name: "AI supplier-risk & resilience monitoring",
        valueMechanism:
          "Continuously ingest financial, cyber, geopolitical, news, and ESG/" +
          "compliance signals to score supplier and single-source risk across " +
          "the critical base and alert early — shifting SRM from annual reactive " +
          "assessment to proactive monitoring, lifting risk coverage and " +
          "protecting the enterprise where spend and dependency are highest.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Supplier master with criticality, spend, and single-source flags",
          "External risk feeds (financial, cyber, geopolitical, ESG, news)",
          "Internal supplier performance and compliance history",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Risk scores are signals for human review, not automatic disqualification",
          "Sub-tier and ESG data are sparse/self-reported — flag confidence explicitly",
          "False-positive alerts erode trust; tune to criticality and materiality",
        ],
        metricsMoved: [
          "supplier_risk_coverage_pct",
          "supplier_consolidation_ratio",
        ],
      },
      {
        key: "contract_intelligence_clm",
        name: "Contract intelligence & AI-assisted CLM",
        valueMechanism:
          "Extract clauses, obligations, prices, rebates, and renewal dates from " +
          "the contract estate, flag risky or non-standard terms, and surface " +
          "expiries and missed rebates — so negotiated value is enforced after " +
          "signature, auto-renewals are managed, and contracted payment terms " +
          "and savings are actually captured rather than eroding.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "The contract corpus (executed agreements, amendments) for extraction",
          "Clause library / playbook and standard terms to compare against",
          "Spend and AP data to match contracted price/terms to actuals",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Low-confidence clause extractions must route to human/legal review",
          "AI redlining assists negotiation but does not bind without human approval",
          "Contracts carry confidential terms — handle within access controls",
        ],
        metricsMoved: [
          "contract_compliance_rate",
          "payment_term_days",
          "savings_realization_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "spend_cube_foundation",
        name: "Classified spend-cube & addressable-spend foundation",
        description:
          "A governed, continuously refreshed spend cube — every transaction " +
          "classified to a clean category taxonomy with normalized suppliers and " +
          "an explicit addressable-vs-non-addressable split — the binding-truth " +
          "platform on which category strategy, sourcing pipeline, and savings " +
          "tracking all depend.",
        boundary:
          "Owns spend visibility, classification, and the addressable-spend " +
          "definition; does not own the sourcing decision or the savings sign-off " +
          "(it makes them fact-based).",
        humanAccountabilityPoint: "Procurement Analytics / Spend Intelligence Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "category_management_operating_model",
        name: "Category-management operating model",
        description:
          "A structured operating model where category managers own a category " +
          "strategy (market analysis, demand levers, supplier strategy, sourcing " +
          "plan) across a multi-year cycle — the platform that turns spend " +
          "visibility into a prioritized, leverage-aware sourcing pipeline rather " +
          "than reactive event-by-event buying.",
        boundary:
          "Owns category strategy and the sourcing pipeline; does not own the " +
          "transactional requisition-to-pay execution or inventory planning " +
          "(those are separate functions it sets terms for).",
        humanAccountabilityPoint: "Chief Procurement Officer / Category Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "closed_loop_savings_realization",
        name: "Closed-loop savings-realization model",
        description:
          "A discipline that tracks every savings commitment from negotiated to " +
          "realized, reconciled to the GL with finance, attributing leakage to " +
          "maverick spend, price creep, or volume shortfall — so committed " +
          "savings land in budgets and the negotiated-vs-realized gap is managed, " +
          "not assumed away.",
        boundary:
          "Owns savings sizing, tracking, and the realization reconciliation " +
          "method; does not own the GL booking itself (that is finance's, jointly " +
          "signed off).",
        humanAccountabilityPoint: "Procurement Value-Realization Lead (with Finance)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "supplier_relationship_risk_management",
        name: "Supplier relationship & risk management (SRM) program",
        description:
          "A tiered SRM program that segments suppliers by spend, criticality, " +
          "and risk; runs structured performance and innovation reviews with " +
          "strategic suppliers; and monitors financial/cyber/geopolitical/ESG " +
          "risk continuously across the critical base — capturing relationship " +
          "value and protecting against disruption.",
        boundary:
          "Owns supplier segmentation, performance governance, and risk " +
          "monitoring; does not own the day-to-day operational supplier " +
          "transactions or the supply-chain inventory/logistics plan.",
        humanAccountabilityPoint: "Supplier Relationship / Supplier-Risk Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Procurement value is realized on linked levers, and the binding truths " +
        "gate every one of them. The opportunity ceiling is set by ADDRESSABLE " +
        "spend — only the influenceable share (excluding taxes, intercompany, " +
        "regulated pass-through, and true sole-source) can be sourced, so sizing " +
        "against total spend over-states the prize from the start. On that base, " +
        "(1) STRATEGIC SOURCING & NEGOTIATION reduce price and total cost on " +
        "newly-sourced or re-sourced categories; (2) DEMAND & SPECIFICATION " +
        "MANAGEMENT and SUPPLIER CONSOLIDATION cut what is bought and increase " +
        "leverage; (3) CONTRACT & WORKING-CAPITAL terms (payment terms, rebates) " +
        "release cash. But the headline NEGOTIATED-savings number is the most " +
        "over-stated figure in the function: it LEAKS on the way to the P&L. " +
        "The savings realization rate — realized over negotiated — is the binding " +
        "truth, and MAVERICK / TAIL SPEND is the dominant leak: spend bought " +
        "off-contract simply does not capture the negotiated price. So durable, " +
        "defensible value is sized on the ADDRESSABLE base and on REALIZED (not " +
        "negotiated) savings, with the leakage haircut made explicit and " +
        "reconciled to the GL — never on a headline negotiated number.",
      dominantHaircutFactors: [
        {
          factor: "Savings leakage (negotiated-to-realized gap)",
          rationale:
            "The dominant and most common haircut: negotiated savings leak " +
            "before reaching the GL through maverick / off-contract buying, post-" +
            "deal price creep, and volume shortfall against the assumption. " +
            "Forward value sized on negotiated savings must be discounted to the " +
            "realization rate the tenant's compliance and tracking discipline can " +
            "actually deliver.",
          typicalHaircut: {
            low: 0.1,
            high: 0.5,
            basis:
              "Observed gap between negotiated and GL-realized savings; widens " +
              "sharply where contract compliance is weak and tracking is open-loop",
            label: "planning-range",
          },
        },
        {
          factor: "Non-addressable spend (opportunity-base over-statement)",
          rationale:
            "Sizing against total rather than addressable spend over-states the " +
            "prize: taxes, intercompany, regulated pass-through, and true sole-" +
            "source spend cannot be sourced. Value must be haircut to the " +
            "genuinely influenceable base before any savings rate is applied.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Share of total spend that is non-addressable / non-influenceable " +
              "in typical enterprise spend cubes",
            label: "planning-range",
          },
        },
        {
          factor: "Spend-data quality & classification readiness",
          rationale:
            "Strategic sourcing, opportunity sizing, and savings tracking all " +
            "depend on a clean, classified spend cube with normalized suppliers. " +
            "Fragmented ERPs, large unclassified pools, and duplicate suppliers " +
            "cap the realizable opportunity and the credibility of any number — " +
            "you cannot source or track what you cannot see.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reduction in realizable / trackable opportunity where spend data " +
              "was dirty, fragmented, or largely unclassified",
            label: "planning-range",
          },
        },
        {
          factor: "Stakeholder adoption, compliance & change",
          rationale:
            "Value requires the business to buy on-contract, accept demand/spec " +
            "challenge, and route the tail through guided buying. Low compliance, " +
            "stakeholder resistance to category control, and un-changed buying " +
            "behavior leave negotiated value on the table even when the deal was " +
            "good.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Procurement-transformation change-management experience where " +
              "business adoption and on-contract compliance lagged the sourcing",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Negotiated savings on newly-sourced addressable spend",
          range: {
            low: 0.04,
            high: 0.15,
            basis:
              "Sourcing-event savings on the addressable base; first-time " +
              "sourcing of unmanaged categories yields more, mature re-sourced " +
              "categories low-single-digit incremental",
            label: "planning-range",
          },
          measuredAs:
            "Relative price/cost reduction negotiated against the pre-event " +
            "baseline on sourced addressable spend (before leakage)",
        },
        {
          lever: "Realization rate applied to negotiated savings",
          range: {
            low: 0.5,
            high: 0.9,
            basis:
              "Negotiated-to-GL realization rates; disciplined closed-loop " +
              "tracking with high compliance realizes 80-90%, weak compliance " +
              "leaks to 50-60%",
            label: "planning-range",
          },
          measuredAs:
            "Fraction of negotiated savings actually realized in the GL after " +
            "leakage (the multiplier on the negotiated lever)",
        },
        {
          lever: "Working-capital release from payment-term extension",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported DPO improvement from negotiating extended terms and " +
              "early-pay-discount programs into contracts, net of supplier-health " +
              "limits",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in days-payable-outstanding contribution from " +
            "contracted payment terms across addressable spend",
        },
      ],
      timeToValueBand:
        "Spend visibility / classified cube: 1-2 quarters to stand up. First " +
        "wave of strategic sourcing on high-opportunity addressable categories: " +
        "2-4 quarters to signed contracts, with realized savings lagging another " +
        "1-2 quarters as compliance ramps. Closed-loop savings realization and " +
        "tail-spend / SRM programs compound over 12-24 months. Full category-" +
        "management operating-model maturity across the spend base: 18-36 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Source-to-contract (S2C) / strategic-sourcing platform",
          role:
            "RFx, e-sourcing events, bid analysis, award optimization, and the " +
            "strategic sourcing pipeline — the system of record for sourcing " +
            "events and negotiated outcomes.",
          examples: ["SAP Ariba", "Coupa", "GEP SMART", "Jaggaer"],
        },
        {
          name: "Spend-analytics platform",
          role:
            "Classified spend cube, category taxonomy, supplier normalization, " +
            "and opportunity analytics — the addressable-spend and savings-" +
            "pipeline source of truth.",
          examples: ["SAP Spend Control Tower", "Coupa Spend Analytics", "Sievo", "GEP"],
        },
        {
          name: "Contract-lifecycle management (CLM)",
          role:
            "Contract authoring, clause libraries, negotiation/redlining, the " +
            "contract repository, and obligation/renewal/rebate tracking.",
          examples: ["Icertis", "DocuSign CLM", "SirionLabs", "Coupa CLM"],
        },
        {
          name: "Supplier relationship & risk management (SRM)",
          role:
            "Supplier master, qualification, segmentation, performance " +
            "scorecards, and continuous financial/cyber/geopolitical/ESG risk " +
            "monitoring across the critical base.",
          examples: ["Interos", "riskmethods (Sphera)", "EcoVadis", "Resilinc"],
        },
        {
          name: "ERP / AP spend base",
          role:
            "System of record for PO and invoice transactions and the GL spend " +
            "actuals that the spend cube classifies and that savings are " +
            "reconciled against.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion",
            "Microsoft Dynamics 365 Finance",
            "Workday Financials",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Procurement Officer (CPO)",
          accountability:
            "Spend under management, realized savings, procurement ROI, supplier " +
            "risk, and the credibility of the function's value with the CFO.",
        },
        {
          title: "Category Director / Category Manager",
          accountability:
            "Category strategy, the sourcing pipeline and savings target for the " +
            "category, supplier strategy, and on-contract compliance within it.",
        },
        {
          title: "Strategic Sourcing Lead",
          accountability:
            "Sourcing-event execution, negotiation outcomes, sourcing cycle " +
            "time, and the negotiated-savings result on sourced spend.",
        },
        {
          title: "Procurement Value-Realization Lead (with Finance)",
          accountability:
            "Closed-loop savings tracking, the negotiated-to-realized " +
            "reconciliation to the GL, and leakage attribution and remediation.",
        },
        {
          title: "Supplier Relationship & Risk Manager",
          accountability:
            "Supplier segmentation and performance governance, supplier-risk " +
            "coverage, and continuous monitoring of the critical-supplier base.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Anti-bribery, corruption & sanctions (FCPA, UK Bribery Act, OFAC)",
          relevance:
            "Supplier selection, awards, and payments must screen against " +
            "sanctions and corruption risk; sourcing and agentic award decisions " +
            "inherit FCPA/sanctions-screening obligations.",
        },
        {
          name: "Supplier ESG & forced-labor due diligence (e.g. UFLPA, CSDDD, modern-slavery acts)",
          relevance:
            "Strategic sourcing and SRM must conduct supply-chain due diligence " +
            "for forced labor, environmental, and human-rights obligations across " +
            "the supplier base and increasingly sub-tiers.",
        },
        {
          name: "Public-sector / regulated procurement rules (where applicable)",
          relevance:
            "Regulated and public-sector buyers face prescribed competitive-" +
            "bidding, transparency, and conflict-of-interest rules that constrain " +
            "sourcing process and award discretion.",
        },
        {
          name: "Data privacy & confidentiality of contract/supplier data",
          relevance:
            "Contract terms, supplier financials, and pricing are confidential; " +
            "AI extraction and analytics on this corpus must respect access " +
            "controls and privacy obligations.",
        },
      ],
      canonicalTerms: [
        {
          term: "Spend under management (SUM)",
          definition:
            "The share of third-party spend procurement actively sources, " +
            "contracts, and category-strategizes rather than leaving to ad-hoc " +
            "buying.",
        },
        {
          term: "Addressable (influenceable) spend",
          definition:
            "The share of spend that can actually be sourced or influenced — " +
            "total spend minus taxes, intercompany, regulated pass-through, and " +
            "true sole-source; the honest opportunity base.",
        },
        {
          term: "Savings leakage / realization rate",
          definition:
            "Realization rate = realized savings / negotiated savings; leakage " +
            "is its complement — the negotiated savings that never reach the GL, " +
            "driven mainly by maverick spend and price creep.",
        },
        {
          term: "Maverick spend",
          definition:
            "Purchasing made off-contract, off-catalog, or with non-preferred " +
            "suppliers, outside negotiated terms — the dominant cause of savings " +
            "leakage.",
        },
        {
          term: "Tail spend",
          definition:
            "The fragmented long tail of low-value, high-supplier-count spend " +
            "(often the bottom ~20% of spend across ~80% of suppliers) that is " +
            "largely un-sourced.",
        },
        {
          term: "Source-to-contract (S2C) vs procure-to-pay (P2P)",
          definition:
            "S2C is the strategic layer — category strategy, sourcing event, " +
            "negotiation, contract; P2P is the downstream transactional layer — " +
            "requisition, PO, invoice, pay. This expert owns S2C.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Spend under management and addressable spend",
        authoritativeSource:
          "Spend-analytics platform classified spend cube tagged managed-vs-" +
          "unmanaged and addressable-vs-non-addressable against the ERP/AP base",
        whatGoodEvidenceLooksLike:
          "Total spend reconciled to the GL, split into managed vs unmanaged AND " +
          "addressable vs non-addressable by category, with the unclassified " +
          "residual quantified.",
        weakEvidenceToReject:
          "A headline 'we manage ~80% of spend' with no classified cube, no " +
          "addressable split, and a large unclassified/other pool unaccounted for.",
      },
      {
        claim: "Negotiated savings and realization / leakage",
        authoritativeSource:
          "Sourcing (S2C) event outcomes for negotiated savings, reconciled to " +
          "GL/AP actuals in a closed-loop savings tracker for realized savings",
        whatGoodEvidenceLooksLike:
          "Negotiated savings by category WITH the realized figure reconciled to " +
          "the GL and the realization/leakage rate shown, leakage attributed to " +
          "maverick spend, price creep, or volume shortfall.",
        weakEvidenceToReject:
          "A negotiated/identified savings number reported as if it were " +
          "realized, with no GL reconciliation and no realization rate.",
      },
      {
        claim: "Maverick / tail spend and contract compliance",
        authoritativeSource:
          "Spend analytics: PO/invoice spend matched to active contracts and " +
          "preferred suppliers, with supplier-concentration (Pareto) analysis",
        whatGoodEvidenceLooksLike:
          "On-contract vs off-contract spend by category, the maverick and tail " +
          "share quantified, and the supplier tail and free-text PO share shown.",
        weakEvidenceToReject:
          "A single overall 'compliance is good' assertion with no category-" +
          "level on-vs-off-contract or tail breakdown.",
      },
      {
        claim: "Supplier risk coverage and concentration",
        authoritativeSource:
          "SRM / supplier-risk platform: assessed-and-monitored critical " +
          "suppliers over the critical-supplier population, with single-source " +
          "mapping",
        whatGoodEvidenceLooksLike:
          "Critical-supplier risk coverage with current assessments, single-" +
          "source concentrations mapped, and confidence flagged where ESG/sub-" +
          "tier data is self-reported.",
        weakEvidenceToReject:
          "An 'our suppliers are reliable' claim, or an annual-only assessment " +
          "presented as continuous monitoring with no coverage figure.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your spend under management, and have you split spend into addressable versus non-addressable so the savings opportunity is sized on the influenceable base, not total spend?",
      "What is your savings realization rate — what share of NEGOTIATED savings actually lands in the GL — and is it reconciled to finance, or is only the negotiated figure tracked?",
      "What is your maverick-spend and tail-spend percentage, and how much addressable spend is leaking to off-contract, off-catalog, or non-preferred-supplier buying?",
      "Do you have a single classified spend cube with a clean category taxonomy and normalized suppliers, or is spend visibility assembled manually in spreadsheets?",
      "What share of your critical suppliers have a current, monitored risk assessment, and have you mapped single-source concentrations and sub-tier dependencies?",
      "Are your contracts in a managed CLM with renewal, obligation, and rebate/price tracking, or scattered across drives where negotiated value erodes unmanaged?",
      "What is your sourcing cycle time and % of addressable spend cycled through competitive sourcing in the last cycle, versus planning ranges?",
    ],
    maturitySignals: [
      "A classified spend cube with an explicit addressable-vs-non-addressable split exists and is refreshed continuously, not assembled in spreadsheets.",
      "Savings are tracked closed-loop from negotiated to GL-realized with finance, and the leakage rate is managed and attributed, not assumed.",
      "Category managers own multi-year category strategies and a prioritized sourcing pipeline, rather than running reactive event-by-event buying.",
      "Maverick and tail spend are measured and actively channeled through guided buying / catalogs, and on-contract compliance is enforced.",
      "Supplier risk is monitored continuously across the critical base with single-source concentrations mapped, not reviewed only annually.",
    ],
    redFlags: [
      "Negotiated / identified savings are reported as if realized, with no GL reconciliation and no realization rate — the savings number cannot be trusted.",
      "Savings opportunity is sized as a flat % of TOTAL spend with no addressable-vs-non-addressable split, so targets are unachievable from the start.",
      "Maverick and tail spend are high and unmeasured while negotiated prices fail to land in the worst-compliance categories — value is leaking unmanaged.",
      "Spend data is dirty, fragmented, and largely unclassified, yet category strategy and savings claims are built on it as if visibility were solid.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Integrated S2P / source-to-pay suites (SAP Ariba, Coupa, GEP, Jaggaer)",
        category: "Source-to-contract, sourcing events, contracts, and spend control",
        switchingCost:
          "High — embedded in buying workflow, catalogs, contracts, and supplier enablement; re-enabling suppliers and rebuilding sourcing/category config is the real cost.",
        renewalDynamics:
          "Spend-under-management or subscription pricing; AI sourcing/agentic and analytics capabilities increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Best-of-breed spend-analytics platforms (Sievo, SAP Spend Control Tower)",
        category: "Spend classification, addressable-spend analytics, opportunity ID",
        switchingCost:
          "Moderate — integrates via spend feeds and is replaceable with re-classification effort, but the curated taxonomy and supplier normalization accrete stickiness.",
        renewalDynamics:
          "Subscription by spend volume / category scope; classification accuracy and managed-taxonomy depth are the negotiation levers.",
      },
      {
        vendorName: "Contract-lifecycle management (Icertis, SirionLabs, DocuSign CLM)",
        category: "Contract authoring, repository, obligation and renewal tracking",
        switchingCost:
          "High — the contract repository, clause libraries, and integrations accrete; migrating an executed-contract estate and re-extracting metadata is costly.",
        renewalDynamics:
          "Subscription by contract/user volume; AI clause-intelligence and obligation-management upsold as premium tiers.",
      },
      {
        vendorName: "Supplier-risk & ESG platforms (Interos, riskmethods/Sphera, EcoVadis)",
        category: "Supplier risk scoring, multi-tier mapping, ESG due diligence",
        switchingCost:
          "Moderate — supplier maps, assessments, and risk history accrete, but external feeds are re-mappable; switching cost rises with depth of sub-tier and ESG coverage built.",
        renewalDynamics:
          "Subscription by supplier/site count; depth of monitoring, sub-tier coverage, and feed breadth drive price and stickiness.",
      },
      {
        vendorName: "Tail-spend / marketplace & guided-buying providers",
        category: "Tail-spend management, marketplaces, catalog and guided intake",
        switchingCost:
          "Moderate — catalogs and supplier onboarding accrete, but the model is replaceable; value depends on the breadth of marketplace/catalog coverage stood up.",
        renewalDynamics:
          "Often transaction or managed-spend fees; the lever is realized tail consolidation and maverick-spend reduction at renewal.",
      },
    ],
    switchingCosts:
      "The integrated S2P/CLM cores are effectively non-switchable in isolation " +
      "— supplier enablement, the contract estate, configured category and " +
      "sourcing logic, and curated spend taxonomies are the lock-in, and a " +
      "re-platform is a multi-quarter program. The spend-analytics, supplier-" +
      "risk, and tail-spend layers are more replaceable, with the integration " +
      "and curated-data estate (taxonomy, supplier maps, contract metadata) the " +
      "true switching cost. The negotiable frontier is in the AI/analytics " +
      "add-ons around the cores and in the best-of-breed risk and tail layers.",
    negotiationLevers: [
      "Outcome / value pricing on AI sourcing and analytics add-ons tied to measured savings realization, addressable-coverage, or maverick-spend reduction rather than seats",
      "Phase-gated pilot-to-scale with spend-data-readiness and savings-realization proof per category before enterprise commitment",
      "Model-portability, data-export, and taxonomy-ownership rights to prevent spend-cube and contract-metadata lock-in",
      "Bundle integrated-suite native sourcing/analytics against best-of-breed at renewal to discipline pricing",
      "Re-price spend-analytics and supplier-risk platforms on realized coverage (categories classified, critical suppliers monitored) rather than promised scope",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      coverage_claim: [
        "classified spend cube reconciled to the GL/AP base",
        "addressable-vs-non-addressable split",
        "spend-under-management basis and unclassified residual",
      ],
      savings_claim: [
        "negotiated savings versus the pre-event baseline",
        "realized savings reconciled to the GL (realization rate)",
        "leakage attribution (maverick spend / price creep / volume shortfall)",
      ],
      compliance_claim: [
        "PO/invoice spend matched to active contracts and preferred suppliers",
        "category-level on-vs-off-contract breakdown",
        "maverick and tail share quantified",
      ],
      supplier_risk_claim: [
        "critical-supplier risk coverage and assessment currency",
        "single-source concentration and sub-tier mapping",
        "data confidence flag where ESG/sub-tier is self-reported",
      ],
      value_projection: [
        "addressable spend as the sized opportunity base (not total spend)",
        "negotiated savings range AND the realization rate applied",
        "explicit haircut factors (leakage, non-addressable, data quality, adoption)",
        "GL reconciliation path for realized savings",
      ],
    },
    citationStandard:
      "Quantitative procurement claims cite the system of record (spend-" +
      "analytics cube, S2C event, CLM, SRM) and the category and period. Savings " +
      "claims carry BOTH the negotiated figure and the GL-reconciled realized " +
      "figure with the realization/leakage rate — never a negotiated number " +
      "presented as realized. Coverage and opportunity claims size against the " +
      "ADDRESSABLE base, not total spend. Value projections state the addressable " +
      "base, give a labelled planning range for negotiated savings AND the " +
      "realization rate applied, name the haircut factors, and give the GL " +
      "reconciliation path — never a single asserted savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant tracks only negotiated savings with no GL reconciliation — frame the savings that will land as negotiated × an industry realization-rate planning range, not the negotiated figure.",
      "Opportunity is being sized against total rather than addressable spend — surface the addressable split before quoting any savings prize.",
      "Spend data is unclassified, fragmented, or dirty — gate the opportunity estimate on spend-cube readiness explicitly.",
      "Vendor- or sourcing-event-reported savings are cited — mark as negotiated/identified pending GL realization on the tenant's own actuals.",
    ],
    inferenceLanguage: [
      "Across enterprise procurement functions at this scale, spend under management and addressable-spend coverage typically run...",
      "Without your realized-savings tracking, the industry pattern suggests negotiated savings of roughly... realizing at... after leakage...",
      "Peer functions commonly hold maverick spend in the range of... once guided buying and contract compliance are enforced...",
      "Treating this as a planning range on the addressable base rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific realized-savings or procurement-ROI number for this tenant",
      "This tenant's actual spend-under-management, addressable %, realization rate, or maverick-spend %",
      "A negotiated-savings figure presented as realized without a GL reconciliation",
      "A savings opportunity sized on total spend without an addressable-vs-non-addressable split",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "spend visibility / where does addressable spend sit by category and supplier",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack classified spend by category with addressable vs non-addressable and managed vs unmanaged split to show where the real sourcing opportunity concentrates.",
    },
    {
      questionPattern:
        "savings story / negotiated to realized after leakage",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from addressable-spend opportunity to negotiated savings to realized savings, with the non-addressable, leakage, and compliance haircuts shown explicitly.",
    },
    {
      questionPattern:
        "savings realization vs leakage trend / does negotiated value land",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend negotiated vs realized savings and the realization rate against the planning range, annotating low-compliance categories where leakage concentrates.",
    },
    {
      questionPattern:
        "value sensitivity to leakage, addressable base, and data quality",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (savings leakage, non-addressable spend, spend-data quality, adoption/compliance).",
    },
    {
      questionPattern: "procurement KPI scorecard",
      exhibitKind: "table",
      note: "Spend under management, % addressable sourced, negotiated savings %, realization/leakage rate, maverick %, contract compliance, supplier-risk coverage, sourcing cycle time, tail spend %, payment terms versus planning ranges.",
    },
    {
      questionPattern: "category prioritization / where to source next",
      exhibitKind: "table",
      note: "Per category: addressable spend, current compliance, maverick/tail share, sourcing recency, estimated negotiated savings range, realization risk, and priority.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A classified spend cube with an explicit addressable-spend split is built first, so the opportunity is sized honestly and category strategy is fact-based",
      "Savings are tracked closed-loop from negotiated to GL-realized with finance, so leakage is managed and the function's numbers are trusted",
      "Maverick and tail spend are actively channeled through guided buying and on-contract compliance is enforced, converting negotiated savings into realized savings",
      "Category management owns multi-year strategies and a prioritized pipeline rather than reactive event-by-event sourcing",
    ],
    failureDrivers: [
      "Reporting negotiated savings as if realized, so committed savings never reconcile to the GL and finance loses trust in the function",
      "Sizing the case on total rather than addressable spend, setting unachievable targets that miss from the start",
      "Letting maverick and tail spend leak negotiated value unmanaged because sourcing is slow and catalogs/guided buying are clumsy",
      "Building category strategy and savings claims on dirty, unclassified spend data — you cannot source or track what you cannot see",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Spend visibility and analytics adopt first because they are low-risk and " +
      "make the opportunity tangible. Strategic sourcing and contract-" +
      "intelligence follow on the prioritized categories. Closed-loop savings " +
      "realization and tail-spend / guided-buying adoption are the hard part — " +
      "they require business behavior change and finance partnership, so they " +
      "lag and are where most value is won or lost. Supplier-risk monitoring " +
      "and agentic sourcing are emerging and scale last, once the spend-data and " +
      "category-management foundations exist.",
    roiClarity: "medium",
    roiClarityBasis:
      "Procurement ROI is firm at the negotiation table but soft at the P&L: " +
      "negotiated savings are directly measurable in sourcing events, but the " +
      "REALIZED figure depends on contract compliance and leakage and is hard to " +
      "attribute cleanly against a moving spend baseline and scope changes. " +
      "Working-capital (payment-term) value is reasonably firm. This is why the " +
      "value model leans on addressable spend and realized (not negotiated) " +
      "savings and the evidence/hedge rules force a GL-reconciliation path and a " +
      "realization-rate planning range rather than a single negotiated number.",
  },

  regulatoryFrame: {
    name: "Anti-bribery/sanctions, supplier ESG due diligence & procurement integrity",
    relevance:
      "The dominant regulatory frame for strategic sourcing: supplier " +
      "selection, awards, and payments must screen against sanctions and " +
      "corruption (FCPA, UK Bribery Act, OFAC); strategic sourcing and SRM carry " +
      "forced-labor and ESG supply-chain due-diligence duties (UFLPA, CSDDD, " +
      "modern-slavery acts); and regulated/public-sector buyers face prescribed " +
      "competitive-bidding and transparency rules. AI-driven sourcing, award, " +
      "and supplier-risk decisions must respect these constraints and keep " +
      "contract/supplier data confidential (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
