// Consilium expert — Back-Office Shared Services Transformation (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the enterprise back office: finance/accounting operations,
// HR operations, procurement (source-to-pay), and supply-chain operations.
// This is the enterprise cost-savings flagship.
//
// CORE DOCTRINE — DUAL ARBITRAGE. Back-office value is realized on TWO distinct
// levers that must be sized separately and never double-counted:
//   (1) Technology / AI automation — deflect, automate, and straight-through the
//       transaction so the work disappears (touchless invoice processing,
//       intelligent document processing, agentic procurement, HR case
//       deflection, autonomous reconciliation).
//   (2) Labor / offshore arbitrage — move the residual, judgment-light work to
//       lower-cost geographies and pooled Global Business Services (GBS)
//       delivery, capturing the wage differential on what cannot (yet) be
//       automated.
// Cost modeling binds to the firm's Workforce Economics substrate (towers /
// roles / rate-cards, "estimate twice" — traditional vs AI-native) as the
// dataSource for unit costs and FTE counts. Product-aware (ERP/HRIS/S2P), not
// product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const backOfficeSharedServicesExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.back-office-shared-services",
    expertName: "Back-Office Shared Services Transformation Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "back-office-shared-services",
    scopeNote:
      "Cross-cutting transformation of enterprise back-office shared services: " +
      "finance & accounting operations (P2P, O2C, R2R), HR operations " +
      "(hire-to-retire, payroll, case management), procurement / source-to-pay, " +
      "and supply-chain operations. Optimized through the DUAL ARBITRAGE of (1) " +
      "GenAI + automation (deflect/straight-through the transaction) and (2) " +
      "labor/offshore arbitrage (move residual work to lower-cost geographies / " +
      "Global Business Services). Cost models bind to the Workforce Economics " +
      "substrate (towers/roles/rate-cards, estimate-twice). Excludes the " +
      "strategic/FP&A judgment layer, treasury, and tax advisory (separate " +
      "experts) — this expert owns transactional and operational throughput.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "cost_per_invoice",
        name: "Cost per invoice processed",
        definition:
          "Fully-loaded accounts-payable operating cost (labor, technology, " +
          "overhead) divided by the number of supplier invoices processed in " +
          "the period.",
        unit: "USD / invoice",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 12,
          basis:
            "APQC / Hackett P2P benchmarks; top-quartile touchless shops near " +
            "$2-4, manual paper-heavy shops $10-12+",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (AP tower rate-card x FTE) over invoice " +
          "volume from the ERP/AP system",
        whyItMatters:
          "The canonical P2P efficiency unit and the headline number every " +
          "automation business case is judged on. The spread from manual to " +
          "touchless is 3-5x — the single largest deflectable cost in AP.",
      },
      {
        key: "invoice_straight_through_rate",
        name: "Invoice straight-through (touchless) rate",
        definition:
          "Share of supplier invoices that post and pay without any human " +
          "touch — matched, validated, and approved automatically end to end.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Hackett / SSON ranges; laggards <30%, world-class AP 75-90% with " +
            "IDP + auto-match",
          label: "planning-range",
        },
        dataSource:
          "AP workflow logs from the ERP / invoice-automation platform (touched " +
          "vs untouched postings)",
        whyItMatters:
          "The direct AI/automation lever — every point of straight-through is " +
          "transaction work that disappears rather than being arbitraged. It " +
          "drives cost_per_invoice and frees the residual for offshore.",
      },
      {
        key: "days_to_close",
        name: "Days to close (financial close cycle time)",
        definition:
          "Working days from period-end to a final, signed-off consolidated " +
          "close (record-to-report).",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 10,
          basis:
            "APQC R2R benchmarks; top-quartile 3-5 working days, median 6-8, " +
            "laggards 10+",
          label: "planning-range",
        },
        dataSource:
          "Close task management / R2R close calendar timestamps against the GL",
        whyItMatters:
          "The headline R2R quality-and-speed metric. A slow close signals " +
          "reconciliation and manual-journal drag; autonomous reconciliation and " +
          "a continuous close compress it without adding headcount.",
      },
      {
        key: "cost_per_hire",
        name: "Cost per hire",
        definition:
          "Total internal and external recruiting cost (sourcing, recruiter " +
          "labor, agency fees, technology) divided by hires completed in the " +
          "period.",
        unit: "USD / hire",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2000,
          high: 6000,
          basis:
            "SHRM / talent-acquisition benchmarks; varies sharply by role " +
            "seniority and agency reliance",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (TA tower rate-card x FTE) plus agency " +
          "spend over hire count from the ATS/HRIS",
        whyItMatters:
          "The flagship HR-operations efficiency unit. Copilot-assisted " +
          "screening and outreach plus offshore sourcing pods compress it; high " +
          "agency reliance is the usual culprit when it runs hot.",
      },
      {
        key: "time_to_fill",
        name: "Time to fill",
        definition:
          "Average elapsed calendar days from requisition open to accepted " +
          "offer.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "SHRM talent-acquisition benchmarks; tech/specialist roles run " +
            "longer, high-volume roles shorter",
          label: "planning-range",
        },
        dataSource: "Requisition lifecycle timestamps from the ATS/HRIS",
        whyItMatters:
          "The speed counterpart to cost_per_hire and a direct driver of " +
          "business productivity. Screening and scheduling automation cut the " +
          "elapsed time that recruiter labor cannot.",
      },
      {
        key: "procurement_cycle_time",
        name: "Procurement cycle time (requisition-to-PO)",
        definition:
          "Average elapsed days from approved purchase requisition to a " +
          "dispatched purchase order.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 10,
          basis:
            "Hackett / source-to-pay benchmarks; catalog/guided-buying flows " +
            "near 1-2 days, off-catalog and sourcing events much longer",
          label: "planning-range",
        },
        dataSource: "S2P platform requisition-to-PO timestamps",
        whyItMatters:
          "The procurement throughput unit. Long cycle time pushes buyers " +
          "off-process (maverick spend); guided buying and agentic sourcing " +
          "compress it while keeping spend on contract.",
      },
      {
        key: "contract_compliance_rate",
        name: "Contract compliance rate (on-contract spend)",
        definition:
          "Share of addressable spend transacted on a negotiated contract / " +
          "preferred supplier rather than off-contract (maverick) buying.",
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
          "Spend analytics: PO/invoice spend matched to active contracts in the " +
          "S2P platform",
        whyItMatters:
          "Maverick spend leaks negotiated savings and inflates supplier risk. " +
          "Compliance is where sourcing savings either stick or evaporate; AI " +
          "spend classification surfaces the leakage.",
      },
      {
        key: "shared_services_cost_pct_revenue",
        name: "Shared-services cost as % of revenue",
        definition:
          "Total fully-loaded back-office shared-services operating cost " +
          "(finance, HR ops, procurement, supply-chain ops) as a percentage of " +
          "enterprise revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 2.5,
          basis:
            "APQC / Hackett general-and-administrative cost ranges across " +
            "back-office functions; industry- and scale-dependent",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (all back-office towers, fully-loaded) " +
          "over enterprise revenue from the GL",
        whyItMatters:
          "The board-level efficiency denominator for the whole GBS estate — " +
          "the number the CFO uses to size the prize and judge whether dual " +
          "arbitrage is bending the cost curve.",
      },
      {
        key: "span_of_control",
        name: "Span of control",
        definition:
          "Average number of direct reports per people-manager across the " +
          "shared-services organization.",
        unit: "reports / manager",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 6,
          high: 12,
          basis:
            "Organizational-design benchmarks; transactional ops support " +
            "higher spans, judgment-heavy work lower",
          label: "planning-range",
        },
        dataSource:
          "HRIS org hierarchy / Workforce Economics substrate org structure",
        whyItMatters:
          "A structural cost lever independent of arbitrage: narrow spans mean " +
          "management-layer bloat. Pooling into GBS and automating supervisory " +
          "checks widens spans and removes layers.",
      },
      {
        key: "offshore_mix_pct",
        name: "Offshore / nearshore delivery mix",
        definition:
          "Share of shared-services FTEs (or delivered hours) located in " +
          "lower-cost offshore/nearshore geographies versus onshore.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "SSON / GBS maturity ranges; mature global models run 50-70% " +
            "offshore for transactional towers, lower where data residency binds",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (FTE by tower x delivery location and " +
          "rate-card geography)",
        whyItMatters:
          "The direct measure of the labor-arbitrage lever. Headroom to offshore " +
          "the residual is half the dual-arbitrage prize; it must be sized " +
          "against data-residency and control constraints, not just wage gaps.",
      },
      {
        key: "automation_deflection_rate",
        name: "Case / transaction deflection rate",
        definition:
          "Share of HR/finance service requests and transactions resolved by " +
          "self-service, knowledge, or bots without a human agent touching them.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Shared-services / service-management benchmarks; copilot-enabled " +
            "tier-0 deflection reaches 50-60% in mature shops",
          label: "planning-range",
        },
        dataSource:
          "Case management / service-desk platform (self-service vs " +
          "agent-handled resolution)",
        whyItMatters:
          "The AI lever for case-driven towers (HR helpdesk, AP helpdesk). Every " +
          "deflected case is residual work that never reaches an arbitraged " +
          "agent, compounding with offshore on the work that remains.",
      },
      {
        key: "fte_per_billion_revenue",
        name: "Back-office FTE per $1B revenue",
        definition:
          "Total shared-services FTEs (finance ops, HR ops, procurement, " +
          "supply-chain ops) normalized per billion dollars of enterprise " +
          "revenue.",
        unit: "FTE / $1B revenue",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 40,
          high: 120,
          basis:
            "APQC staffing-productivity ranges normalized to scale; " +
            "industry- and complexity-dependent",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (FTE by tower) over enterprise revenue",
        whyItMatters:
          "The headcount-productivity unit that makes the dual arbitrage " +
          "tangible: automation lowers required FTEs, arbitrage lowers their " +
          "average cost. Tracks whether transformation is real or relabeled.",
      },
    ],

    painThemes: [
      {
        key: "fragmented_process_estate",
        name: "Fragmented, un-pooled process estate",
        description:
          "The same back-office process runs differently in every business " +
          "unit and geography, on inconsistent ERP/HRIS instances, so neither " +
          "automation nor arbitrage scales — there is no standard work to " +
          "automate or to move offshore.",
        detectionSignal:
          "Multiple ERP/HRIS instances, no global process owner, wide " +
          "variation in cost-per-transaction across BUs, low offshore mix.",
        diagnosticQuestion:
          "Is there a single global process owner and standard process " +
          "definition per tower, or does each business unit run its own variant?",
      },
      {
        key: "high_touch_transactions",
        name: "High-touch transaction processing",
        description:
          "Invoices, journals, requisitions, and HR cases require manual " +
          "matching, keying, and chasing because documents are unstructured and " +
          "matching rules are weak — keeping cost-per-transaction high and " +
          "straight-through rates low.",
        detectionSignal:
          "Low invoice straight-through / deflection rate, large exception " +
          "queues, overtime spikes at period-end, heavy paper/email intake.",
        diagnosticQuestion:
          "What is your straight-through rate by tower, and what share of " +
          "transactions hit a manual exception queue?",
      },
      {
        key: "shallow_offshore_lift_and_shift",
        name: "Shallow lift-and-shift offshoring",
        description:
          "Work was offshored as-is without first standardizing or automating, " +
          "so broken processes were merely relocated — capturing the wage gap " +
          "once but leaving the automation prize and quality issues unaddressed.",
        detectionSignal:
          "Offshore captured years ago with flat productivity since, rising " +
          "error/rework rates, no automation roadmap layered on the offshore base.",
        diagnosticQuestion:
          "Did you standardize and automate before offshoring, or lift-and-shift " +
          "the existing process — and has productivity improved since?",
      },
      {
        key: "maverick_spend_leakage",
        name: "Maverick / off-contract spend leakage",
        description:
          "Buyers transact off-contract because guided buying is clumsy and " +
          "cycle time is slow, so negotiated savings leak, supplier risk grows, " +
          "and spend visibility for sourcing erodes.",
        detectionSignal:
          "Contract compliance below target, long tail of one-off suppliers, " +
          "high P-card and free-text PO usage, sourcing savings not landing in " +
          "the P&L.",
        diagnosticQuestion:
          "What is your on-contract spend rate, and how much addressable spend " +
          "is transacting off-catalog or with non-preferred suppliers?",
      },
      {
        key: "manual_close_reconciliation",
        name: "Manual close & reconciliation drag",
        description:
          "Account reconciliations, intercompany matching, and manual journals " +
          "are spreadsheet-driven and serial, stretching the close, consuming " +
          "skilled accountants on low-judgment matching, and raising control " +
          "risk.",
        detectionSignal:
          "Days-to-close above target, large month-end journal counts, " +
          "high-volume manual reconciliations, audit findings on reconciliation " +
          "completeness.",
        diagnosticQuestion:
          "How many days is your close, and what share of reconciliations and " +
          "journals are still manual rather than auto-matched?",
      },
      {
        key: "weak_value_attribution",
        name: "Weak savings attribution & double-counting risk",
        description:
          "Automation savings and labor-arbitrage savings are reported on the " +
          "same headcount, so the same FTE is counted twice and committed " +
          "savings never reconcile to the P&L — eroding board confidence in the " +
          "next wave.",
        detectionSignal:
          "Business cases that sum automation FTE-out and offshore FTE-out on " +
          "overlapping roles; committed savings not traceable to the GL; no " +
          "single source of truth for FTE baseline.",
        diagnosticQuestion:
          "Are your automation and offshore savings sized on the same baseline " +
          "with no double-count, and do committed savings reconcile to the GL?",
      },
      {
        key: "talent_drain_in_judgment_roles",
        name: "Judgment-role talent drain after automation",
        description:
          "Automating and offshoring the entry-level transactional rungs " +
          "removes the traditional training ground, hollowing the pipeline for " +
          "judgment-heavy retained roles (controllers, category managers, HRBPs) " +
          "and creating key-person risk.",
        detectionSignal:
          "Rising tenure and age in retained roles, thin succession bench, " +
          "difficulty backfilling controller/category-manager seats, knowledge " +
          "concentrated in a few people.",
        diagnosticQuestion:
          "As you automate and offshore the transactional base, where do your " +
          "future controllers and category managers come from?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "touchless_invoice_automation",
        name: "Touchless invoice / AP automation",
        valueMechanism:
          "Capture, code, and three-way-match supplier invoices automatically " +
          "with IDP and learned matching rules so the majority post and pay " +
          "without a human touch — collapsing cost-per-invoice and freeing the " +
          "residual exceptions for a smaller, arbitraged team.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Supplier invoice images/EDI and PO/receipt data from the ERP",
          "Historical matched-invoice outcomes for rule learning",
          "Vendor master and tolerance/approval policy",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-pay tolerances must be governed to prevent duplicate/fraud payment",
          "Segregation-of-duties and approval audit trail are SOX-relevant",
        ],
        metricsMoved: [
          "cost_per_invoice",
          "invoice_straight_through_rate",
          "fte_per_billion_revenue",
        ],
      },
      {
        key: "intelligent_document_processing",
        name: "Intelligent document processing (cross-tower IDP)",
        valueMechanism:
          "Extract structured data from unstructured back-office documents — " +
          "invoices, remittances, contracts, onboarding forms, supplier docs — " +
          "so downstream processing is straight-through rather than re-keyed, " +
          "deflecting manual intake across finance, HR, and procurement.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Document corpora per tower (invoices, forms, contracts)",
          "Labeled extractions for model tuning",
          "Downstream system field schemas to map into",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Low-confidence extractions must route to human review, not auto-commit",
          "Documents may carry PII — handling must respect privacy/residency rules",
        ],
        metricsMoved: [
          "invoice_straight_through_rate",
          "automation_deflection_rate",
          "cost_per_invoice",
        ],
      },
      {
        key: "agentic_procurement",
        name: "Agentic procurement & guided buying",
        valueMechanism:
          "AI agents handle requisition intake, supplier/catalog selection, " +
          "tail-spend sourcing, and PO creation through a conversational guided- " +
          "buying flow — compressing requisition-to-PO time and keeping spend on " +
          "contract instead of leaking to maverick buying.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Catalog, contract, and preferred-supplier data from the S2P platform",
          "Historical spend and category taxonomy",
          "Approval workflow and budget/policy rules",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Spend commitments above thresholds require human approval",
          "Agent must not steer spend to non-compliant or sanctioned suppliers",
        ],
        metricsMoved: [
          "procurement_cycle_time",
          "contract_compliance_rate",
          "shared_services_cost_pct_revenue",
        ],
      },
      {
        key: "hr_copilot_case_deflection",
        name: "HR copilot & case deflection",
        valueMechanism:
          "A grounded HR copilot answers employee policy/benefits/payroll " +
          "questions and drafts case resolutions from the knowledge base, " +
          "deflecting tier-0/tier-1 cases from agents and accelerating recruiter " +
          "screening and scheduling — lowering cost-per-hire and case cost.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "HR policy/benefits knowledge base and prior resolved cases",
          "ATS/HRIS data for screening and scheduling",
          "Entitlement/role data to scope answers to the employee",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Must not surface another employee's PII or make eligibility decisions",
          "Sensitive cases (ER, accommodations) must escalate to humans",
        ],
        metricsMoved: [
          "automation_deflection_rate",
          "cost_per_hire",
          "time_to_fill",
        ],
      },
      {
        key: "autonomous_reconciliation",
        name: "Autonomous reconciliation & continuous close",
        valueMechanism:
          "Auto-match account, bank, and intercompany reconciliations and " +
          "propose adjusting journals continuously through the period, so " +
          "accountants review exceptions instead of matching line by line — " +
          "compressing days-to-close without adding headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "GL, sub-ledger, and bank/intercompany feeds",
          "Historical reconciliation matches and exception dispositions",
          "Materiality and tolerance thresholds",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Auto-posted journals are a financial-statement control — SOX audit trail required",
          "Materiality thresholds govern what may post autonomously vs route to review",
        ],
        metricsMoved: [
          "days_to_close",
          "shared_services_cost_pct_revenue",
          "fte_per_billion_revenue",
        ],
      },
      {
        key: "spend_classification_analytics",
        name: "AI spend classification & savings analytics",
        valueMechanism:
          "Classify and enrich every spend transaction to a clean category " +
          "taxonomy and surface off-contract, duplicate, and consolidation " +
          "opportunities — turning fragmented spend into a sourcing pipeline and " +
          "lifting contract compliance.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "PO, invoice, and P-card transaction history",
          "Supplier master and contract coverage",
          "A category taxonomy to classify against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Classification errors mislead sourcing strategy — sample-validate accuracy",
          "Savings opportunities are pipeline, not booked savings, until realized",
        ],
        metricsMoved: [
          "contract_compliance_rate",
          "shared_services_cost_pct_revenue",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "global_business_services",
        name: "Global Business Services (GBS) operating model",
        description:
          "A single multi-functional shared-services organization with global " +
          "process owners, standardized processes, and a tiered delivery " +
          "footprint (onshore retained / nearshore / offshore) — the platform " +
          "on which both automation and arbitrage scale.",
        boundary:
          "Owns transactional and operational delivery and the process " +
          "standard; does not own the strategic/judgment layer (FP&A decisions, " +
          "category strategy) that stays with the business.",
        humanAccountabilityPoint: "GBS / Shared Services Leader",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "dual_arbitrage_savings_model",
        name: "Dual-arbitrage savings model (estimate-twice)",
        description:
          "A single FTE baseline costed twice — traditional vs AI-native — that " +
          "sequences automation deflection FIRST and offshore arbitrage on the " +
          "residual, so the two levers stack on one baseline with no " +
          "double-count and every committed dollar traces to a tower.",
        boundary:
          "Owns savings sizing, sequencing, and attribution against the " +
          "Workforce Economics substrate; does not execute delivery or own the " +
          "P&L booking (that is finance's).",
        humanAccountabilityPoint: "Transformation / Value-Realization Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "touchless_p2p_pipeline",
        name: "Touchless procure-to-pay pipeline",
        description:
          "An end-to-end P2P flow — guided buying, agentic sourcing for tail " +
          "spend, IDP capture, auto-match, and tolerance-based auto-pay — with " +
          "exceptions routed to a small arbitraged team rather than every " +
          "transaction touched.",
        boundary:
          "Owns requisition-to-pay processing and exception handling; does not " +
          "own strategic sourcing/contract negotiation, which feeds it the " +
          "contracts to buy against.",
        humanAccountabilityPoint: "P2P Process Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "hr_service_delivery_tiering",
        name: "Tiered HR service delivery with copilot tier-0",
        description:
          "An HR service model where a copilot resolves tier-0 self-service, an " +
          "offshore pool handles tier-1 cases, and onshore HRBPs/specialists " +
          "retain judgment-heavy work (ER, accommodations) — deflect first, " +
          "arbitrage the residual, retain the judgment.",
        boundary:
          "Owns HR case and transaction delivery; does not own employee-" +
          "relations decisions or workforce strategy, which stay with HRBPs and " +
          "leadership.",
        humanAccountabilityPoint: "HR Operations / People Services Leader",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Back-office value is realized through DUAL ARBITRAGE, sized on one FTE " +
        "baseline and never double-counted. First, technology/AI automation " +
        "DEFLECTS the transaction — touchless invoicing, IDP, agentic " +
        "procurement, case deflection, autonomous reconciliation make the work " +
        "disappear (estimate-once at AI-native unit cost). Second, labor/offshore " +
        "arbitrage moves the RESIDUAL judgment-light work to lower-cost " +
        "geographies and pooled GBS delivery, capturing the wage differential on " +
        "what cannot yet be automated. The sequencing matters: automate-then- " +
        "arbitrage realizes more than arbitrage-then-automate, because you never " +
        "offshore work you could have eliminated. The durable curve-bender is " +
        "process standardization on a GBS platform — without it, neither lever " +
        "scales. Cost models bind to the Workforce Economics substrate " +
        "(towers/roles/rate-cards, estimate-twice traditional-vs-AI-native) so " +
        "every saved dollar traces to a tower and reconciles to the P&L.",
      dominantHaircutFactors: [
        {
          factor: "Double-count between automation and arbitrage",
          rationale:
            "The most common over-statement: counting both the automation " +
            "FTE-out and the offshore FTE-out on the same roles. Forward value " +
            "must be discounted unless the two levers are sized on one baseline " +
            "with explicit residual.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed gap between gross stacked savings and reconciled net " +
              "savings when levers overlap on the same FTEs",
            label: "planning-range",
          },
        },
        {
          factor: "Process fragmentation & data readiness",
          rationale:
            "Automation and offshore both require standardized process and " +
            "clean master data; fragmented ERP/HRIS instances and dirty vendor/" +
            "employee data cap realizable straight-through and arbitrage depth.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Implementation experience where un-standardized processes and " +
              "poor master data throttled automation and offshore scale-up",
            label: "planning-range",
          },
        },
        {
          factor: "Data-residency, regulatory & retained-control constraints",
          rationale:
            "Data privacy/residency, SOX control requirements, and roles that " +
            "must stay onshore for regulatory or risk reasons reduce the " +
            "offshore-able and auto-postable share below the theoretical maximum.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Share of work fenced from offshore/autonomy by residency, SOX, " +
              "or control posture in regulated enterprises",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption, attrition & change cost",
          rationale:
            "Value requires staff to change workflow, transition knowledge to " +
            "offshore pools, and absorb automation output; transition attrition " +
            "and slow adoption leave benefit on the table and add one-time cost.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "GBS transition and automation change-management experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Automation deflection (run-rate cost reduction)",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported run-rate cost reduction in transactional towers from " +
              "touchless/IDP/deflection programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in tower operating cost from automation alone " +
            "(before arbitrage)",
        },
        {
          lever: "Labor arbitrage on residual (unit-cost reduction)",
          range: {
            low: 0.3,
            high: 0.6,
            basis:
              "Onshore-to-offshore fully-loaded rate-card differential for " +
              "transactional roles in the Workforce Economics substrate",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in fully-loaded cost of the residual FTEs moved " +
            "offshore/nearshore",
        },
        {
          lever: "Combined dual-arbitrage cost-curve bend",
          range: {
            low: 0.25,
            high: 0.5,
            basis:
              "Net reconciled reduction in shared-services cost when both levers " +
              "are stacked on one baseline (after double-count haircut)",
            label: "planning-range",
          },
          measuredAs:
            "Net relative reduction in shared_services_cost_pct_revenue across " +
            "the back-office estate",
        },
      ],
      timeToValueBand:
        "Automation deflection (invoice/IDP/case): 2-4 quarters per tower. " +
        "Labor arbitrage on the residual: 2-3 quarters per transition wave once " +
        "process is standardized. Full GBS dual-arbitrage program across all " +
        "back-office towers: 18-36 months, sequenced tower by tower.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ERP / finance system of record",
          role:
            "System of record for the general ledger, accounts payable/" +
            "receivable, and the financial close (R2R, P2P, O2C cores).",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion / E-Business Suite",
            "Microsoft Dynamics 365 Finance",
            "Workday Financials",
          ],
        },
        {
          name: "Source-to-pay / procurement platform",
          role:
            "Catalog, sourcing, contracts, requisition-to-PO, and supplier " +
            "management for procurement and spend control.",
          examples: ["SAP Ariba", "Coupa", "Oracle Procurement", "GEP SMART"],
        },
        {
          name: "HRIS / human capital management",
          role:
            "System of record for employee, position, payroll, and " +
            "hire-to-retire data driving HR operations.",
          examples: [
            "Workday HCM",
            "SAP SuccessFactors",
            "Oracle HCM Cloud",
            "ADP",
          ],
        },
        {
          name: "Case management / service delivery",
          role:
            "Routes, tracks, and resolves HR and finance shared-services cases " +
            "and self-service requests; the deflection surface.",
          examples: [
            "ServiceNow HR Service Delivery",
            "Workday Help",
            "ServiceNow Source-to-Pay Operations",
          ],
        },
        {
          name: "Supply-chain operations / planning",
          role:
            "Order management, planning, and logistics execution for " +
            "supply-chain operational throughput.",
          examples: [
            "SAP Integrated Business Planning",
            "Oracle SCM Cloud",
            "Blue Yonder",
          ],
        },
      ],
      roles: [
        {
          title: "GBS / Shared Services Leader",
          accountability:
            "End-to-end shared-services cost, service levels, and the dual-" +
            "arbitrage savings commitment across all back-office towers.",
        },
        {
          title: "Controller / Finance Operations Leader",
          accountability:
            "Close quality and timeliness, P2P/O2C/R2R control, and the " +
            "integrity of auto-posted financial transactions (SOX).",
        },
        {
          title: "Chief Human Resources Officer / HR Operations Leader",
          accountability:
            "HR service delivery cost and quality, cost-per-hire/time-to-fill, " +
            "and the retained-vs-arbitraged HR delivery model.",
        },
        {
          title: "Chief Procurement Officer",
          accountability:
            "Spend under management, contract compliance, procurement cycle " +
            "time, and realized sourcing savings.",
        },
        {
          title: "Global Process Owner (per tower)",
          accountability:
            "The single standardized process definition and performance for a " +
            "tower (e.g. P2P, R2R, hire-to-retire) — the unit automation and " +
            "arbitrage scale on.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Sarbanes-Oxley (SOX) / internal controls over financial reporting",
          relevance:
            "Auto-posted journals, auto-pay, and segregation of duties in " +
            "automated finance processes are ICFR controls requiring audit " +
            "trails and approval evidence.",
        },
        {
          name: "Data privacy & residency (GDPR / regional data-localization)",
          relevance:
            "Offshoring HR and finance work and using AI on employee/supplier " +
            "PII triggers cross-border transfer and data-residency obligations " +
            "that fence what can move offshore or to a model.",
        },
        {
          name: "Labor & employment law across delivery geographies",
          relevance:
            "Transition, redundancy, works-council consultation, and local " +
            "employment rules govern how and how fast labor arbitrage can be " +
            "executed.",
        },
        {
          name: "Anti-bribery, sanctions & supplier compliance",
          relevance:
            "Agentic and automated procurement must not transact with " +
            "sanctioned or non-compliant suppliers; spend automation inherits " +
            "FCPA/sanctions screening obligations.",
        },
      ],
      canonicalTerms: [
        {
          term: "GBS (Global Business Services)",
          definition:
            "A consolidated, multi-functional shared-services organization with " +
            "global process owners and a tiered onshore/offshore delivery model.",
        },
        {
          term: "STP (straight-through processing)",
          definition:
            "A transaction that completes end to end without human touch — the " +
            "direct measure of the automation/deflection lever.",
        },
        {
          term: "Maverick spend",
          definition:
            "Purchasing made off-contract or off-catalog, outside negotiated " +
            "terms, leaking sourcing savings and reducing spend visibility.",
        },
        {
          term: "FTE arbitrage",
          definition:
            "Capturing the fully-loaded wage differential by relocating an FTE's " +
            "work to a lower-cost geography (offshore/nearshore).",
        },
        {
          term: "Estimate-twice (traditional vs AI-native)",
          definition:
            "Costing one process/FTE baseline two ways — the traditional " +
            "labor-led cost and the AI-native cost — to size the automation prize " +
            "before layering arbitrage on the residual.",
        },
        {
          term: "P2P / O2C / R2R",
          definition:
            "Procure-to-pay, order-to-cash, and record-to-report — the three " +
            "end-to-end finance-operations megaprocesses.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Cost per invoice and straight-through rate",
        authoritativeSource:
          "Workforce Economics substrate (AP tower rate-card x FTE) over invoice " +
          "volume and AP workflow logs from the ERP/automation platform",
        whatGoodEvidenceLooksLike:
          "Fully-loaded AP cost over invoice count for a trailing period, with " +
          "touched-vs-untouched posting split from workflow logs.",
        weakEvidenceToReject:
          "A vendor-quoted 'best-in-class $2 per invoice' with no link to the " +
          "tenant's own cost base or volume.",
      },
      {
        claim: "Dual-arbitrage savings size and split",
        authoritativeSource:
          "Workforce Economics substrate estimate-twice model (one FTE baseline " +
          "costed traditional vs AI-native) reconciled to the GL",
        whatGoodEvidenceLooksLike:
          "A single baseline showing automation FTE-out, residual FTEs, and " +
          "offshore mix on the residual — with committed savings traced to towers " +
          "and reconciled to the P&L.",
        weakEvidenceToReject:
          "Automation and offshore savings summed separately on overlapping " +
          "roles with no shared baseline (double-count).",
      },
      {
        claim: "Offshore / nearshore delivery mix and arbitrage headroom",
        authoritativeSource:
          "Workforce Economics substrate (FTE by tower x delivery location and " +
          "rate-card geography)",
        whatGoodEvidenceLooksLike:
          "Current FTE by tower and location with fully-loaded rate-card " +
          "differential, net of roles fenced by residency/SOX/control posture.",
        weakEvidenceToReject:
          "A blanket 'we can offshore 70%' with no tower-level breakdown or " +
          "residency/control constraints applied.",
      },
      {
        claim: "Contract compliance / maverick spend",
        authoritativeSource:
          "Spend analytics: PO/invoice spend matched to active contracts in the " +
          "S2P platform",
        whatGoodEvidenceLooksLike:
          "Addressable spend split on-contract vs off-contract by category, with " +
          "the supplier tail and free-text PO share quantified.",
        weakEvidenceToReject:
          "A single overall 'compliance is good' assertion with no category-level " +
          "spend breakdown.",
      },
      {
        claim: "Days to close and reconciliation drag",
        authoritativeSource:
          "Close task-management calendar timestamps against the GL plus " +
          "reconciliation/auto-match logs",
        whatGoodEvidenceLooksLike:
          "Working days per close step with manual-vs-auto-matched reconciliation " +
          "and manual-journal counts.",
        weakEvidenceToReject:
          "A headline 'we close in 5 days' with no step detail or manual-effort " +
          "breakdown.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Is there a single global process owner and standard process per tower, or does each business unit run its own variant on different ERP/HRIS instances?",
      "What is your straight-through / deflection rate by tower, and what share of transactions hit a manual exception queue?",
      "What is your current offshore/nearshore mix by tower, and how much arbitrage headroom remains after data-residency and control constraints?",
      "Are your automation savings and offshore savings sized on the SAME FTE baseline with no double-count, and do committed savings reconcile to the GL?",
      "What is your cost-per-invoice, days-to-close, cost-per-hire, and procurement cycle time versus planning ranges?",
      "What is your on-contract spend rate, and how much addressable spend is leaking to maverick/off-catalog buying?",
      "Did you standardize and automate before offshoring, or lift-and-shift the existing process — and has productivity improved since?",
    ],
    maturitySignals: [
      "A GBS model with global process owners and one standard process per tower exists, not BU-by-BU variants.",
      "Automation is sequenced before arbitrage on one baseline, so savings stack without double-counting.",
      "Straight-through/deflection rates are measured per tower and managed, not just throughput volume.",
      "Offshore mix is sized tower by tower against explicit residency/SOX/control fences, and committed savings reconcile to the P&L.",
    ],
    redFlags: [
      "Automation FTE-out and offshore FTE-out are summed on the same roles — the savings double-count.",
      "Work was lift-and-shift offshored without standardizing or automating first, and productivity has been flat since.",
      "No single FTE baseline / source of truth exists, so committed savings cannot be traced to towers or reconciled to the GL.",
      "Contract compliance is unknown or untracked while maverick spend and the supplier tail keep growing.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "ERP-native automation (SAP / Oracle / Workday)",
        category: "Core finance/HR/procurement platform + native automation",
        switchingCost:
          "Extreme — the ERP/HRIS core is fused to enterprise data and process; replacement is a multi-year platform decision rarely sourced standalone.",
        renewalDynamics:
          "Bundled enterprise agreements with module/seat-based pricing; automation increasingly upsold as native add-ons at renewal.",
      },
      {
        vendorName: "Best-of-breed AP / IDP automation vendors",
        category: "Invoice automation / intelligent document processing",
        switchingCost:
          "Moderate — integrates via document and ERP feeds; replaceable with data-mapping effort, but watch model/training lock-in.",
        renewalDynamics:
          "Often per-transaction or volume-tiered pricing; favor outcome terms and audit/explainability access as volumes scale.",
      },
      {
        vendorName: "Procurement / spend-management suites (Coupa, Ariba, GEP)",
        category: "Source-to-pay / guided buying / spend analytics",
        switchingCost:
          "High — embedded in buying workflow, catalogs, and supplier enablement; re-enabling suppliers is the real cost.",
        renewalDynamics:
          "Spend-under-management or subscription pricing; leverage realized compliance/savings at renewal.",
      },
      {
        vendorName: "BPO / GBS managed-service providers",
        category: "Offshore transactional delivery (finance, HR, procurement ops)",
        switchingCost:
          "High — knowledge and trained pools sit with the provider; re-transition risk and ramp time make switching disruptive.",
        renewalDynamics:
          "FTE-based or increasingly outcome/transaction-based pricing; the lever is shifting from pure FTE to gain-share as automation absorbs volume.",
      },
      {
        vendorName: "Service-management / case-deflection platforms (ServiceNow)",
        category: "HR/finance service delivery + AI case deflection",
        switchingCost:
          "Moderate-to-high — workflows, knowledge, and integrations accrete; deflection models trained on tenant data add stickiness.",
        renewalDynamics:
          "Per-employee or per-agent subscription; AI/deflection capabilities upsold as premium tiers.",
      },
    ],
    switchingCosts:
      "The ERP/HRIS/S2P cores are effectively non-switchable in isolation, and BPO providers hold trained-pool knowledge — so the negotiable value frontier is in best-of-breed automation around the cores and in re-pricing BPO from pure FTE toward outcome/gain-share as automation deflects volume.",
    negotiationLevers: [
      "Re-price BPO contracts from FTE-based to outcome/transaction/gain-share as automation reduces volume — avoid paying for deflected work",
      "Outcome pricing for automation vendors tied to measured straight-through / deflection lift",
      "Audit, explainability, and model-portability rights to prevent automation lock-in",
      "Bundle ERP-native automation against best-of-breed at renewal to discipline pricing",
      "Pilot-to-scale gating with parity proof per tower before enterprise commitment or transition wave",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      efficiency_metric: [
        "Workforce Economics substrate cost basis (rate-card x FTE)",
        "transaction volume from the system of record",
        "trailing-period aggregation",
      ],
      automation_claim: [
        "touched-vs-untouched workflow logs",
        "straight-through / deflection rate basis",
      ],
      arbitrage_claim: [
        "FTE by tower x delivery location",
        "fully-loaded onshore-vs-offshore rate-card differential",
        "residency/control fence applied",
      ],
      spend_compliance_claim: [
        "PO/invoice spend matched to active contracts",
        "category-level breakdown",
      ],
      value_projection: [
        "single shared FTE baseline (no double-count)",
        "benchmark planning-range",
        "explicit haircut factors",
        "GL reconciliation path",
      ],
    },
    citationStandard:
      "Quantitative back-office claims cite the Workforce Economics substrate " +
      "cost basis (rate-card x FTE) and the system-of-record volume plus the " +
      "period. Savings projections cite a SINGLE shared baseline costed twice " +
      "(traditional vs AI-native), the automation and arbitrage split with no " +
      "double-count, a labelled planning range, the haircut factors applied, and " +
      "the path to GL reconciliation — never a single asserted savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no single FTE baseline or substrate cost basis — frame savings as an industry planning range, not their measured number.",
      "Automation and arbitrage are being summed on overlapping roles — flag double-count risk before sizing combined savings.",
      "Offshore headroom is quoted without residency/SOX/control fences applied — present the gross-vs-fenced gap explicitly.",
      "Vendor or BPO-reported outcomes are cited — mark as provider claims pending validation.",
    ],
    inferenceLanguage: [
      "Across enterprise back offices at this scale, cost-per-invoice typically runs...",
      "Without your tower-level baseline, the industry pattern suggests automation deflects roughly... before arbitrage...",
      "Peer GBS organizations commonly reach an offshore mix of... once process is standardized...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this tenant",
      "This tenant's actual straight-through, deflection, or offshore-mix rate",
      "A combined automation-plus-arbitrage savings number sized on overlapping roles",
      "A claim that a specific tower can be offshored by X% without residency/control review",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "back-office cost breakdown / where does shared-services cost sit by tower",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost by tower (AP, R2R, HR ops, procurement) to show where the deflectable and arbitrageable cost concentrates.",
    },
    {
      questionPattern:
        "dual-arbitrage savings story / automation then offshore on one baseline",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current cost to automation deflection to residual arbitrage to net cost, with the double-count and constraint haircuts shown.",
    },
    {
      questionPattern: "efficiency trend / cost-per-invoice or days-to-close over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend the tower efficiency unit against its planning range to show curve-bending.",
    },
    {
      questionPattern:
        "offshore mix vs headroom by tower / arbitrage opportunity",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Current offshore mix vs fenced headroom per tower, after residency/SOX/control constraints.",
    },
    {
      questionPattern: "back-office KPI scorecard",
      exhibitKind: "table",
      note: "Cost-per-invoice, straight-through rate, days-to-close, cost-per-hire, procurement cycle time, contract compliance, offshore mix vs planning ranges.",
    },
    {
      questionPattern: "savings attribution / committed savings traced to towers and GL",
      exhibitKind: "table",
      note: "Per tower: baseline FTE/cost, automation FTE-out, residual, offshore mix, net savings, GL reconciliation status.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "high",
    successDrivers: [
      "A GBS platform with global process owners and standardized processes exists before scaling automation or arbitrage",
      "Automation is sequenced before arbitrage on a single FTE baseline, so the levers stack without double-counting",
      "Committed savings are sized in the Workforce Economics substrate and reconcile to the GL, keeping the program honest",
      "Offshore depth is sized tower by tower against explicit residency/SOX/control fences rather than a blanket target",
    ],
    failureDrivers: [
      "Automation and offshore savings double-counted on the same roles, so committed savings never land in the P&L",
      "Lift-and-shift offshoring of un-standardized, un-automated processes — relocating the problem instead of fixing it",
      "No single FTE baseline or source of truth, so savings cannot be attributed or reconciled and credibility erodes",
      "Hollowing the judgment-role pipeline by automating/offshoring the entry rungs with no plan for future controllers and category managers",
    ],
    adoptionReadiness: "high",
    adoptionCurve:
      "Transactional towers adopt first and fastest because the work is " +
      "measurable and savings are tangible — AP and procurement deflection, then " +
      "HR case deflection, then autonomous reconciliation and continuous close " +
      "once control posture is trusted. Arbitrage follows automation tower by " +
      "tower as standardized processes become safe to transition. Retained " +
      "judgment roles are the slowest and deliberately last.",
    roiClarity: "high",
    roiClarityBasis:
      "Back-office ROI is unusually firm because both levers are directly " +
      "measurable in the Workforce Economics substrate and the GL — cost-per-" +
      "transaction, straight-through rate, FTE counts, and rate-card " +
      "differentials are observable. The main clarity risk is not measurement " +
      "but discipline: double-counting automation and arbitrage, or sizing " +
      "offshore without residency/control fences, inflates the case — which is " +
      "why the evidence and hedge rules force one baseline and GL reconciliation.",
  },

  regulatoryFrame: {
    name: "SOX internal controls & data privacy / residency",
    relevance:
      "The dominant regulatory frame for back-office transformation: auto-posted " +
      "journals, auto-pay, and segregation of duties are SOX ICFR controls " +
      "requiring audit trails, while offshoring and AI on employee/supplier PII " +
      "trigger data-residency and cross-border-transfer obligations that fence " +
      "how much work can move offshore or to a model. Labor/employment law and " +
      "anti-bribery/sanctions screening also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 draft)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
