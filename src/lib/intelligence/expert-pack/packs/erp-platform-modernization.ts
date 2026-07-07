// Consilium expert — ERP & Enterprise Platform Modernization (cross-cutting).
//
// W3 wave2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting,
// cross-industry expert spanning the ERP and core-platform MODERNIZATION layer
// of the enterprise: ERP strategy & selection (SAP S/4HANA, Oracle, Workday,
// Microsoft Dynamics), implementation and systems-integrator (SI) management,
// clean-core / extension strategy, data migration, process standardization, and
// post-go-live value realization. Supports an IT SOURCING module (ERP-SI
// sourcing events). Product-aware across the major suites and SI/GSI ecosystem,
// not product-locked.
//
// CORE DOCTRINE — ERP PROGRAMS ARE HIGH-COST, HIGH-FAILURE, AND VALUE LANDS
// POST-GO-LIVE. Three truths are made plain everywhere: (1) ERP modernizations
// are among the most expensive and most-likely-to-disappoint programs an
// enterprise runs — overrun, scope creep, and customization are the norm, not
// the exception; (2) SI MANAGEMENT DISCIPLINE determines the outcome — the
// negotiated contract, the change-order regime, and the joint accountability
// model decide whether the program lands, because the SI's incentives and the
// client's discipline, not the software, drive the result; and (3) BUSINESS
// VALUE LANDS POST-GO-LIVE, NOT AT GO-LIVE — go-live is a cost event and a risk
// peak; the benefit case (process standardization, clean data, adoption,
// retired legacy) is realized in the quarters AFTER, and only if a hypercare-
// to-value discipline is run. The dominant value killer is CUSTOMIZATION away
// from clean core: every extension that breaks standard process inflates cost,
// delays go-live, and taxes every future upgrade. So value is sized on
// standardized, clean-core, adopted, post-go-live process — never on a go-live
// milestone or a vendor business case.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const erpPlatformModernizationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.erp-platform-modernization",
    expertName: "ERP & Enterprise Platform Modernization Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "erp-platform-modernization",
    scopeNote:
      "Cross-cutting, cross-industry expert for the ERP and core-platform " +
      "MODERNIZATION layer of the enterprise: ERP strategy & selection (SAP " +
      "S/4HANA, Oracle, Workday, Microsoft Dynamics), implementation and " +
      "systems-integrator (SI) management, clean-core / extension strategy, data " +
      "migration, process standardization, and post-go-live value realization. " +
      "Supports an IT SOURCING module (ERP-SI sourcing events). Product- and " +
      "SI-aware across the major suites and GSI ecosystem, not product-locked. " +
      "CORE DOCTRINE: ERP programs are high-cost and high-failure (scope creep + " +
      "customization + change), SI management discipline determines the outcome, " +
      "and business value lands POST-GO-LIVE not at go-live; customization away " +
      "from clean core is the dominant value killer. So value is sized on " +
      "standardized, clean-core, adopted, post-go-live process — never on a " +
      "go-live milestone or a vendor business case. DISTINCT FROM Procurement & " +
      "Strategic Sourcing (the category/sourcing function, though this expert " +
      "supports ERP-SI sourcing events), from the Enterprise Value Office (which " +
      "orchestrates the value case across all initiatives), and from function-" +
      "specific operating depth (finance close, HR, supply chain) — those are " +
      "separate experts; this one owns the ERP modernization program itself.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "implementation_cost_vs_budget",
        name: "Implementation cost vs budget (overrun)",
        definition:
          "Total realized program cost (software, SI, internal effort, " +
          "infrastructure, change) as a ratio to the originally approved budget — " +
          "the headline overrun figure for an ERP modernization.",
        unit: "x (actual : budget)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.0,
          high: 1.45,
          basis:
            "ERP program cost-overrun ranges across major-suite implementations; " +
            "well-governed clean-core programs land near budget, " +
            "scope-creep / heavily-customized programs commonly run 25-45%+ over",
          label: "planning-range",
        },
        dataSource:
          "Program financials in the PMO / value control tower reconciled to the " +
          "approved business case and the SI statement(s) of work and change orders",
        whyItMatters:
          "The single most-watched ERP number and the one most likely to embarrass " +
          "the sponsor. Overrun is driven mostly by scope creep and customization, " +
          "so it is the binding readout of program discipline — and the denominator " +
          "every benefit claim must be read against.",
      },
      {
        key: "on_time_milestone_pct",
        name: "On-time milestone delivery %",
        definition:
          "Share of program milestones (design sign-off, build, test cycles, " +
          "cutover gates) delivered on or before the baselined plan date in a " +
          "rolling window.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 90,
          basis:
            "ERP delivery-predictability ranges; disciplined programs hold 80-90% " +
            "on-time, troubled programs slip the majority of milestones and " +
            "re-baseline repeatedly",
          label: "planning-range",
        },
        dataSource:
          "Program plan in the PMO tooling — actual vs baselined milestone dates, " +
          "excluding re-baselined dates that hide slippage",
        whyItMatters:
          "Schedule slip is the leading indicator of cost overrun and of a go-live " +
          "being forced before readiness. Measured against the ORIGINAL baseline " +
          "(not a re-baselined plan) it is the honest early-warning gauge.",
      },
      {
        key: "customization_extension_ratio",
        name: "Customization / extension ratio (vs clean core)",
        definition:
          "Share of delivered functionality implemented as custom code or " +
          "extensions outside standard configuration — the inverse of clean-core " +
          "fit, measured as custom/extension objects (or effort) over total.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Clean-core adherence ranges; modern clean-core programs keep " +
            "extensions below 10-15% via side-by-side extensibility, legacy " +
            "lift-and-customize programs exceed 30-40%",
          label: "planning-range",
        },
        dataSource:
          "Build inventory / extensibility register: custom and extension objects " +
          "and effort vs standard configuration in the ERP platform's dev tooling",
        whyItMatters:
          "The dominant value killer. Every extension away from clean core inflates " +
          "build cost, delays go-live, raises defect risk, and taxes every future " +
          "upgrade — so this ratio predicts total cost of ownership more than any " +
          "license figure.",
      },
      {
        key: "data_migration_accuracy",
        name: "Data migration accuracy / reconciliation %",
        definition:
          "Share of migrated master and transactional data that reconciles to the " +
          "source of record after load — record counts, balances, and field-level " +
          "validation passing against the legacy baseline.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.9,
          basis:
            "Data-migration reconciliation ranges; financial and regulated data " +
            "must reconcile to ~99.9%, while disciplined master-data programs " +
            "target 98-99%+ with documented exceptions",
          label: "planning-range",
        },
        dataSource:
          "Migration reconciliation reports: post-load record counts, control " +
          "totals, and field validation matched to the legacy system of record",
        whyItMatters:
          "Bad data at cutover is the classic source of post-go-live chaos — broken " +
          "reporting, mis-stated balances, and a finance close that will not tie. " +
          "Reconciliation discipline is a cutover gate, not a nice-to-have.",
      },
      {
        key: "process_standardization_pct",
        name: "Process standardization %",
        definition:
          "Share of in-scope business processes implemented to a standardized, " +
          "harmonized design (single global/regional template) rather than " +
          "preserving legacy local variants.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Process-harmonization ranges; programs that hold a global template " +
            "standardize 80-90% of processes, while 'preserve everything' programs " +
            "standardize half or less and carry the variants as customization",
          label: "planning-range",
        },
        dataSource:
          "Process design repository: standardized-template processes vs retained " +
          "local variants, by process area, against the target operating model",
        whyItMatters:
          "Standardization is where most ERP benefit actually comes from — it " +
          "enables clean core, simpler data, lower run cost, and analytics. Low " +
          "standardization means the program paved old cow-paths and bought little " +
          "more than a newer license.",
      },
      {
        key: "benefit_realization_pct",
        name: "Business-case benefit realization %",
        definition:
          "Share of the originally projected, baselined business-case benefit that " +
          "is realized and attested post-go-live — net of haircuts, against a " +
          "measured pre-program baseline.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 75,
          basis:
            "ERP benefit-realization ranges; programs with a baselined case and a " +
            "post-go-live value discipline realize a majority of benefit, " +
            "go-live-and-disband programs realize a fraction and never attest it",
          label: "planning-range",
        },
        dataSource:
          "Value control tower joined to Finance attestation against the " +
          "pre-program business-case baseline, tracked over the post-go-live window",
        whyItMatters:
          "The honest scorecard of whether the program was worth it — and the most " +
          "neglected, because teams disband at go-live. Benefit lands post-go-live " +
          "or not at all; this is the number that proves it did.",
      },
      {
        key: "user_adoption_post_go_live",
        name: "User adoption post-go-live %",
        definition:
          "Share of intended users in the target population actively and correctly " +
          "using the new system and standardized processes (not reverting to " +
          "spreadsheets, shadow systems, or workarounds) after go-live.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Post-go-live adoption ranges; programs with strong change management " +
            "and standardized processes reach 80-90% correct usage, weak-change " +
            "programs see heavy reversion and shadow-system persistence",
          label: "planning-range",
        },
        dataSource:
          "System usage telemetry and process-conformance / process-mining data " +
          "joined to the intended-user population from the business case",
        whyItMatters:
          "Standardized process realizes value only if people actually work it. " +
          "Reversion to legacy workarounds silently erases benefit, corrupts data, " +
          "and is the most common reason a 'successful go-live' delivers no value.",
      },
      {
        key: "go_live_defect_rate",
        name: "Defect / incident rate at go-live (hypercare)",
        definition:
          "Volume of severity-1/2 defects and production incidents in the hypercare " +
          "window after cutover, normalized to scope/users — the stability of the " +
          "platform immediately post-go-live.",
        unit: "Sev-1/2 defects per cutover (or per 100 users)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Post-cutover hypercare defect ranges; well-tested clean-core go-lives " +
            "stabilize with a low single-digit-to-low-double-digit Sev-1/2 count, " +
            "under-tested / heavily-customized cutovers see far higher and longer tails",
          label: "planning-range",
        },
        dataSource:
          "Hypercare incident / defect tracker by severity, normalized to cutover " +
          "scope, with mean-time-to-resolve and open-aging",
        whyItMatters:
          "Go-live is the program's risk peak. A high defect rate stalls the " +
          "business, destroys user confidence (driving the reversion that kills " +
          "adoption), and extends costly hypercare — it is the readout of test and " +
          "data discipline at cutover.",
      },
      {
        key: "si_change_order_leakage",
        name: "SI change-order leakage",
        definition:
          "Cumulative value of SI change orders as a share of the original SI " +
          "contract value — the cost added beyond the signed statement of work " +
          "through scope changes the SI bills for.",
        unit: "% of original SI contract value",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 35,
          basis:
            "SI change-order ranges; tightly-scoped fixed-price-with-discipline " +
            "engagements hold change orders below 10-15%, loosely-scoped " +
            "time-and-materials engagements leak 25-35%+ via change orders",
          label: "planning-range",
        },
        dataSource:
          "SI contract and change-order register in the PMO / vendor-management " +
          "system reconciled to the original statement of work",
        whyItMatters:
          "The clearest readout of SI management discipline and the main mechanism " +
          "by which ERP programs blow their budget. Change-order leakage reflects " +
          "weak scope control and an SI incentive to bill change — managing it is " +
          "the single highest-leverage cost control in the program.",
      },
      {
        key: "time_to_value",
        name: "Time-to-value (go-live to attested benefit)",
        definition:
          "Elapsed time from production go-live to the first Finance-attested " +
          "increment of business-case benefit — how long after cutover value " +
          "actually starts landing.",
        unit: "months",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 18,
          basis:
            "Post-go-live time-to-value ranges; programs that run a hypercare-to-" +
            "value discipline begin attesting benefit within 1-2 quarters, " +
            "programs that disband at go-live take a year-plus or never attest",
          label: "planning-range",
        },
        dataSource:
          "Value control tower — go-live date to first Finance-attested benefit " +
          "increment against the baselined business case",
        whyItMatters:
          "Makes the post-go-live truth measurable: value lands AFTER cutover, and " +
          "only with discipline. A long or open-ended time-to-value is the signature " +
          "of a program that treated go-live as the finish line.",
      },
      {
        key: "total_cost_of_ownership",
        name: "Total cost of ownership (run + upgrade)",
        definition:
          "Fully-loaded ongoing cost to run, support, and upgrade the ERP estate " +
          "post-go-live (license/subscription, run/AMS, infrastructure, and " +
          "upgrade/regression effort) per year, trended over the platform life.",
        unit: "$ per year (indexed, trend)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.7,
          high: 1.3,
          basis:
            "Run-cost ranges relative to the pre-modernization baseline; clean-core " +
            "standardized estates lower run/upgrade cost, while heavily-customized " +
            "estates raise it through regression-heavy, brittle upgrades",
          label: "planning-range",
        },
        dataSource:
          "IT financials / FinOps for the ERP estate: license/subscription, AMS/run, " +
          "infrastructure, and upgrade/regression effort, trended post-go-live",
        whyItMatters:
          "The cost that outlives the program. Customization away from clean core " +
          "shows up here as expensive, fragile upgrades for years — TCO, not the " +
          "implementation bill, is where the clean-core decision is ultimately paid " +
          "for or recovered.",
      },
      {
        key: "test_automation_coverage",
        name: "Test automation / regression coverage %",
        definition:
          "Share of critical business processes and configuration covered by " +
          "automated regression tests — the safety net for cutover quality and for " +
          "continuous (clean-core) upgrades afterward.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "ERP test-automation coverage ranges; programs ready for continuous " +
            "innovation automate 70-90% of critical-path regression, manual-test " +
            "programs cover far less and re-test slowly each upgrade",
          label: "planning-range",
        },
        dataSource:
          "Test-management tooling: automated vs manual coverage of critical " +
          "business processes and configuration, with pass rates",
        whyItMatters:
          "Low automation coverage drives both go-live defect risk and the cost of " +
          "every future upgrade. In a clean-core, continuous-innovation model, " +
          "regression automation is what makes frequent vendor upgrades safe instead " +
          "of a per-upgrade project.",
      },
    ],

    painThemes: [
      {
        key: "scope_creep_and_customization",
        name: "Scope creep & customization away from clean core",
        description:
          "Under business pressure to 'preserve how we work today', the program " +
          "accretes custom code and extensions far beyond standard configuration — " +
          "each one inflating build cost, delaying go-live, raising defect risk, " +
          "and quietly mortgaging every future upgrade. The single dominant ERP " +
          "value killer.",
        detectionSignal:
          "High and rising customization/extension ratio, an open requirements " +
          "backlog re-opening after design freeze, RICEFW/extension lists growing " +
          "through build, and 'standard does not fit our process' asserted without " +
          "challenge.",
        diagnosticQuestion:
          "What is your customization/extension ratio against clean core, and is " +
          "every extension challenged against a standardized-process alternative — " +
          "or is the program preserving legacy variants as custom code?",
      },
      {
        key: "si_management_failure",
        name: "Weak SI management & change-order leakage",
        description:
          "The systems integrator runs the program with the client as a passive " +
          "buyer: scope is loosely defined, time-and-materials incentives reward " +
          "billable change, and change orders leak the budget away — because SI " +
          "incentives and client discipline, not the software, decide the outcome.",
        detectionSignal:
          "High SI change-order leakage, no joint accountability or shared-risk " +
          "commercial model, client team unable to challenge SI estimates, key " +
          "design and architecture decisions effectively outsourced to the SI.",
        diagnosticQuestion:
          "What is your SI change-order leakage against the original SOW, and is " +
          "the commercial model and governance structured so the SI shares risk and " +
          "scope is controlled — or is the client a passive buyer of billable change?",
      },
      {
        key: "value_treated_as_go_live",
        name: "Go-live treated as the finish line (no post-go-live value)",
        description:
          "The program is funded, staffed, and celebrated to cutover, then the team " +
          "disbands — but business value lands POST-go-live: standardized process, " +
          "clean data, adoption, and retired legacy only pay off in the quarters " +
          "after, and only if a hypercare-to-value discipline is run.",
        detectionSignal:
          "No baselined benefit tracking past go-live, team disbanded at cutover, " +
          "legacy systems not decommissioned, no named owner for benefit realization, " +
          "open-ended or unmeasured time-to-value.",
        diagnosticQuestion:
          "Who owns benefit realization AFTER go-live, is the business case " +
          "baselined and tracked to Finance attestation post-cutover, and is there a " +
          "hypercare-to-value plan — or does the program end at go-live?",
      },
      {
        key: "data_migration_and_cutover_risk",
        name: "Dirty data & cutover risk",
        description:
          "Legacy master and transactional data is duplicated, incomplete, and " +
          "un-reconciled, and cutover is under-rehearsed — so the system goes live " +
          "on bad data, balances do not tie, reporting breaks, and the finance close " +
          "fails in the first period, eroding confidence and adoption.",
        detectionSignal:
          "Low data-migration reconciliation %, no mock cutovers / dress rehearsals, " +
          "data cleansing deferred to the end, no field-level validation against the " +
          "source of record, large exception backlogs at cutover.",
        diagnosticQuestion:
          "What is your data-migration reconciliation accuracy, how many full mock " +
          "cutovers have you rehearsed, and is data cleansing happening early or " +
          "deferred to a risky big-bang at the end?",
      },
      {
        key: "weak_change_and_adoption",
        name: "Weak change management & post-go-live adoption",
        description:
          "Change management is under-funded relative to the technical build, so " +
          "users are not ready, revert to spreadsheets and shadow systems, and work " +
          "around the standardized process — silently erasing benefit, corrupting " +
          "data, and turning a 'successful go-live' into no realized value.",
        detectionSignal:
          "Low post-go-live adoption / process conformance, persistent shadow " +
          "systems and spreadsheets, change budget a small fraction of build, no " +
          "named business owner for adoption, training treated as a one-off at launch.",
        diagnosticQuestion:
          "What is your post-go-live adoption and process-conformance rate, who in " +
          "the business owns adoption, and is change management funded and run as a " +
          "deliverable — or is it an afterthought to the technical build?",
      },
      {
        key: "vendor_business_case_inflation",
        name: "Vendor / SI business-case inflation",
        description:
          "The business case rests on a vendor or SI benefit model — blanket " +
          "percentages, best-case adoption, and benefits sized on total rather than " +
          "addressable process — with no measured pre-program baseline, so the " +
          "promised number is one Finance will never attest and the CFO already " +
          "distrusts.",
        detectionSignal:
          "Benefit case built from a vendor slide, headline percentages with no " +
          "per-process baseline, no Finance-defined baseline or counterfactual, " +
          "benefit unreconciled to a cost line in the P&L.",
        diagnosticQuestion:
          "Is the business case built on a measured pre-program baseline that " +
          "Finance defined and will attest, or on a vendor/SI benefit model with " +
          "blanket percentages and best-case assumptions?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "data_migration_cleansing_ai",
        name: "AI data-migration cleansing & reconciliation",
        valueMechanism:
          "Use AI to profile legacy data, detect duplicates and quality defects, " +
          "propose cleansing and mapping rules, and reconcile post-load record " +
          "counts/balances against the source of record — lifting migration " +
          "accuracy and de-risking cutover so the system does not go live on dirty " +
          "data and the first finance close ties.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Legacy master and transactional data with the source-of-record baseline",
          "Target data model and field-level validation/reconciliation rules",
          "Data-quality and exception thresholds for human review",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "AI-proposed cleansing/mapping rules must be validated before they touch financial data",
          "Reconciliation sign-off at cutover remains a human control gate, not an automatic pass",
          "Field-level exceptions on regulated/financial data require explicit human disposition",
        ],
        metricsMoved: [
          "data_migration_accuracy",
          "go_live_defect_rate",
          "time_to_value",
        ],
      },
      {
        key: "clean_core_fit_gap_advisor",
        name: "Clean-core fit-gap & extension advisor",
        valueMechanism:
          "Analyze requirements and legacy customizations against standard process " +
          "and side-by-side extensibility options, recommending where to adopt " +
          "standard vs extend and flagging gold-plated customizations — directly " +
          "challenging scope creep so the customization/extension ratio stays low " +
          "and process standardization stays high.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Requirements backlog and legacy customization / RICEFW inventory",
          "Standard process model and extensibility catalog for the target suite",
          "Target operating model and standardization principles to test fit against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Fit-gap recommendations are advisory — design authority and clean-core trade-offs are a human decision",
          "Do not let an AI 'standard fits' recommendation override genuine regulatory/contractual requirements",
          "Extension proposals must still pass the clean-core governance board, not auto-approve",
        ],
        metricsMoved: [
          "customization_extension_ratio",
          "process_standardization_pct",
          "total_cost_of_ownership",
        ],
      },
      {
        key: "test_automation_generation",
        name: "AI test generation & regression automation",
        valueMechanism:
          "Generate and maintain automated test cases from process designs and " +
          "configuration, prioritize regression coverage on critical paths, and " +
          "triage failures — raising test-automation coverage so cutover is stable " +
          "and continuous clean-core upgrades become safe rather than a per-upgrade " +
          "project.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Process designs, configuration, and critical-path business scenarios",
          "Existing test cases and historical defect/regression data",
          "Test-management and environment data for execution",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Generated tests need human review for business-meaningful assertions, not just coverage",
          "Automation must not create false confidence — critical financial controls need explicit human test design",
          "Test data must respect privacy/masking in non-production environments",
        ],
        metricsMoved: [
          "test_automation_coverage",
          "go_live_defect_rate",
          "on_time_milestone_pct",
        ],
      },
      {
        key: "implementation_copilot",
        name: "Implementation copilot (config, code, docs)",
        valueMechanism:
          "Assist configuration, extension code, and documentation — drafting " +
          "config, generating clean-core-compliant extension code, and producing " +
          "functional/technical specs and runbooks — compressing build effort and " +
          "improving on-time delivery without expanding scope, provided clean-core " +
          "guardrails are enforced.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Target-suite configuration model, extensibility framework, and coding standards",
          "Approved design specifications and the clean-core guardrails",
          "Existing config/code repository and documentation templates",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated extension code must pass clean-core review — copilot speed must not become a customization on-ramp",
          "Human developers own correctness, security review, and upgrade-safety of generated code",
          "Generated documentation must be validated against the as-built configuration",
        ],
        metricsMoved: [
          "on_time_milestone_pct",
          "customization_extension_ratio",
          "implementation_cost_vs_budget",
        ],
      },
      {
        key: "benefit_realization_tracking",
        name: "AI benefit-realization & process-conformance tracking",
        valueMechanism:
          "Combine process-mining and usage telemetry with the baselined business " +
          "case to track post-go-live process conformance, adoption, and realized " +
          "benefit against the pre-program baseline, surfacing reversion and " +
          "leakage early — closing the go-live-is-the-finish-line gap so value " +
          "actually lands and Finance can attest it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Pre-program baseline and the baselined business case by process area",
          "Post-go-live process-mining, usage telemetry, and GL/operational actuals",
          "Finance attestation criteria and the intended-user population",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Finance, not the model, attests realized benefit against the baseline",
          "Conformance/adoption signals are monitoring-sensitive — respect consent/notice",
          "Attribution to the program must isolate concurrent changes before any benefit is claimed",
        ],
        metricsMoved: [
          "benefit_realization_pct",
          "user_adoption_post_go_live",
          "time_to_value",
        ],
      },
      {
        key: "sourcing_negotiation_intelligence",
        name: "ERP-SI sourcing & change-order intelligence",
        valueMechanism:
          "Support the ERP-SI sourcing event and the live engagement — benchmark " +
          "SI rates and scope, structure shared-risk commercial models, and analyze " +
          "change-order patterns against the SOW to flag leakage early — " +
          "strengthening SI management discipline so scope is controlled and " +
          "change-order leakage and cost overrun are contained.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "SI proposals, rate cards, SOWs, and historical change-order data",
          "Program scope, deliverables, and the shared-risk commercial model",
          "Benchmark rate and engagement-structure references for the SI/GSI market",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Award and contract decisions above thresholds require human approval, not auto-award",
          "Benchmark inferences are planning ranges, not the tenant's negotiated price",
          "Change-order disposition is a governance decision; the model flags, humans approve",
        ],
        metricsMoved: [
          "si_change_order_leakage",
          "implementation_cost_vs_budget",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "erp_strategy_and_selection",
        name: "ERP strategy & fit-driven selection",
        description:
          "A structured method to set the target operating model and " +
          "standardization principles FIRST, then select the suite and deployment " +
          "model (greenfield / brownfield / hybrid; cloud vs on-prem) and the SI " +
          "against fit-to-standard-process and clean-core extensibility — not " +
          "against a feature checklist or a vendor demo. The decision that frames " +
          "every later cost.",
        boundary:
          "Owns the target operating model, standardization principles, and the " +
          "suite/SI selection decision; does not own the function-specific process " +
          "design depth (finance, HR, supply chain) or the procurement category " +
          "mechanics of the sourcing event it informs.",
        humanAccountabilityPoint:
          "Program Sponsor / CIO with the Enterprise Architect and CFO (selection decision owner)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "clean_core_extension_governance",
        name: "Clean-core & extension governance model",
        description:
          "A governance board and design authority that defaults every requirement " +
          "to standard process, challenges each proposed extension against a " +
          "standardized alternative, and admits extensions only via side-by-side " +
          "(upgrade-safe) extensibility with an owner and a justification — the " +
          "structural control that holds the customization ratio down and protects " +
          "future upgradeability.",
        boundary:
          "Owns the clean-core principle, the extension-approval gate, and the " +
          "extensibility standard; does not own the individual functional design " +
          "decisions (it governs how they are made) or the run-time platform " +
          "operations.",
        humanAccountabilityPoint:
          "Enterprise Architect / Design Authority chair (clean-core gate owner)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "si_management_operating_model",
        name: "SI management & joint-accountability operating model",
        description:
          "A program operating model where the client retains design authority and " +
          "architecture ownership, the SI engagement is tightly scoped with a " +
          "shared-risk commercial model and a disciplined change-control regime, " +
          "and joint governance with clear accountability runs the program — because " +
          "SI incentives and client discipline, not the software, decide the outcome.",
        boundary:
          "Owns the SI commercial model, scope/change-control discipline, and joint " +
          "governance; does not own the SI's internal delivery method or the " +
          "procurement function's wider category strategy (it sets the engagement " +
          "terms the sourcing event executes).",
        humanAccountabilityPoint:
          "Program Director / PMO lead with Vendor Management (SI accountability owner)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "data_migration_and_cutover_discipline",
        name: "Data-migration & cutover-readiness discipline",
        description:
          "An early-and-iterative data program — profile, cleanse, map, and " +
          "reconcile master and transactional data to the source of record — plus " +
          "rehearsed mock cutovers and explicit go/no-go readiness gates, so the " +
          "system goes live on reconciled data and a tested cutover rather than a " +
          "risky big-bang on dirty data.",
        boundary:
          "Owns data-quality, migration reconciliation, and the cutover readiness " +
          "gate; does not own the ongoing master-data governance run model or the " +
          "source-system retirement decision (it enables both).",
        humanAccountabilityPoint:
          "Data Migration Lead with the Finance / data-owner sign-off at cutover",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "hypercare_to_value_realization",
        name: "Hypercare-to-value realization model",
        description:
          "A standing post-go-live discipline that runs structured hypercare to " +
          "stabilize, then keeps a benefit-realization owner and a baselined value " +
          "tracker live for several quarters — driving adoption and process " +
          "conformance, retiring legacy systems, and attesting realized benefit to " +
          "Finance, on the honest premise that value lands post-go-live or not at all.",
        boundary:
          "Owns hypercare, post-go-live adoption, legacy retirement, and benefit " +
          "attestation; does not own the Finance attestation decision itself " +
          "(Finance signs) or the ongoing functional operation of the business.",
        humanAccountabilityPoint:
          "Benefit-Realization Owner (business) with the Finance/FP&A controller who attests",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "ERP modernization value is real but it is gated by hard truths, and it " +
        "lands AFTER go-live, not at it. Go-live is a cost event and the program's " +
        "risk peak; the benefit case — process standardization, clean and " +
        "reconciled data, simplified clean-core operations, voluntary user " +
        "adoption, and retired legacy systems — is realized in the quarters after " +
        "cutover, and only if a hypercare-to-value discipline keeps a benefit owner " +
        "and a baselined tracker live. Three constraints bind every number: (1) " +
        "ERP programs are HIGH-COST and HIGH-FAILURE — overrun and scope creep are " +
        "the norm, so the prize must be sized net of a realistic overrun and a " +
        "realistic realization rate; (2) SI MANAGEMENT DISCIPLINE decides the " +
        "outcome — change-order leakage and loose scope, not the software, are what " +
        "blow the budget; and (3) CUSTOMIZATION away from clean core is the " +
        "dominant value killer — each extension inflates cost, delays go-live, and " +
        "taxes every future upgrade in TCO for years. So durable, defensible value " +
        "is sized on STANDARDIZED, clean-core, ADOPTED, post-go-live process, " +
        "baselined per process area and Finance-attested — never on a go-live " +
        "milestone, a customization-preserved legacy design, or a vendor/SI " +
        "business case.",
      dominantHaircutFactors: [
        {
          factor: "Customization away from clean core",
          rationale:
            "The dominant ERP value killer: extensions away from standard process " +
            "inflate build cost, delay go-live, raise defect risk, and tax every " +
            "future upgrade in TCO. Benefit sized on a clean-core design must be " +
            "discounted toward the customization ratio the tenant's governance " +
            "actually holds.",
          typicalHaircut: {
            low: 0.15,
            high: 0.5,
            basis:
              "Erosion of standardization/clean-core benefit and inflation of cost " +
              "as the customization/extension ratio rises above clean-core ranges",
            label: "planning-range",
          },
        },
        {
          factor: "Cost overrun & SI change-order leakage",
          rationale:
            "ERP programs routinely overrun, driven by scope creep and SI " +
            "change-order leakage under loose scope and T&M incentives. Net value " +
            "must absorb a realistic overrun against the approved budget, not assume " +
            "on-budget delivery.",
          typicalHaircut: {
            low: 0.1,
            high: 0.45,
            basis:
              "Observed cost overrun and SI change-order leakage against the " +
              "approved budget and original SOW where scope control was weak",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption shortfall & process reversion (post-go-live)",
          rationale:
            "Because adoption is voluntary and post-go-live, users revert to " +
            "spreadsheets and shadow systems and work around standardized process, " +
            "silently erasing benefit. Projected benefit must be discounted to the " +
            "adoption and conformance the change program can actually deliver.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Gap between intended and actual post-go-live adoption / process " +
              "conformance for programs with weak change management",
            label: "planning-range",
          },
        },
        {
          factor: "Baseline / attestation discount (vendor-case inflation)",
          rationale:
            "Without a measured pre-program baseline Finance defined, vendor/SI " +
            "benefit cases over-state the prize and Finance discounts or rejects " +
            "the benefit. The projected-to-attested gap on ERP business cases is " +
            "large and routine and must be applied before any value is claimed.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Projected-to-attested gap on ERP business cases where baselines and " +
              "counterfactuals were weak or vendor-supplied",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Run/TCO reduction from clean-core standardization",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reduction in ongoing run/AMS and upgrade cost where a standardized, " +
              "clean-core estate replaces a heavily-customized legacy one",
            label: "planning-range",
          },
          measuredAs:
            "Relative decline in total_cost_of_ownership for the ERP estate post-" +
            "go-live versus the pre-modernization baseline",
        },
        {
          lever: "Process-efficiency benefit from standardization & adoption",
          range: {
            low: 0.05,
            high: 0.3,
            basis:
              "Process-cost / throughput improvement on standardized, adopted " +
              "processes against the measured pre-program baseline, net of reversion",
            label: "planning-range",
          },
          measuredAs:
            "Relative process-cost reduction on standardized processes weighted by " +
            "post-go-live adoption / conformance against the baseline",
        },
        {
          lever: "Realization rate applied to the projected business case",
          range: {
            low: 0.3,
            high: 0.75,
            basis:
              "Share of projected ERP business-case benefit actually realized and " +
              "Finance-attested where a baseline and post-go-live value discipline exist",
            label: "planning-range",
          },
          measuredAs:
            "Fraction of projected business-case benefit attested post-go-live (the " +
            "multiplier on the projected case)",
        },
      ],
      timeToValueBand:
        "Strategy, selection, and SI engagement: 1-2 quarters. Implementation to " +
        "go-live: typically 4-8 quarters depending on scope, deployment model, and " +
        "standardization ambition (multi-year for multi-ERP global rollouts). Then " +
        "the honest part: go-live is a cost/risk peak, not value — hypercare " +
        "stabilizes over 1-2 quarters, and business-case benefit lands across the " +
        "following 2-6+ quarters as adoption ramps, legacy is retired, and Finance " +
        "attests. Full clean-core, continuous-innovation TCO benefit compounds over " +
        "18-36 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ERP suite (system of record for core processes)",
          role:
            "The core financials/HR/supply-chain platform being modernized — the " +
            "system of record the program stands up and the configuration/extension " +
            "estate lives in.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion Cloud ERP",
            "Workday",
            "Microsoft Dynamics 365",
          ],
        },
        {
          name: "Program / PMO & delivery tooling",
          role:
            "Plan, milestones, RAID/issues, and the SI statement-of-work and " +
            "change-order register — the system of record for cost, schedule, and " +
            "scope discipline.",
          examples: ["SAP Activate / Cloud ALM", "Azure DevOps", "Jira", "Planview / ServiceNow SPM"],
        },
        {
          name: "Data migration & quality platform",
          role:
            "Profiling, cleansing, mapping, load, and reconciliation of master and " +
            "transactional data against the legacy source of record.",
          examples: ["SAP Migration Cockpit / BODS", "Syniti", "Informatica", "Oracle data tooling"],
        },
        {
          name: "Test management & automation",
          role:
            "Test design, automated regression coverage of critical processes, and " +
            "defect tracking through build, cutover, and continuous upgrades.",
          examples: ["Tricentis Tosca", "Worksoft", "SAP Cloud ALM test", "OpenText UFT"],
        },
        {
          name: "Process intelligence / mining",
          role:
            "Current-state process baselining before design and post-go-live " +
            "process-conformance and benefit tracking after cutover.",
          examples: ["Celonis", "SAP Signavio", "UiPath Process Mining", "Microsoft Process Insights"],
        },
        {
          name: "Finance / FP&A & value control tower",
          role:
            "Holds the pre-program baseline and the P&L the benefit must reconcile " +
            "to, and where post-go-live benefit realization is attested.",
          examples: ["FP&A / EPM tooling", "Anaplan", "the ERP's own financials", "value control tower"],
        },
      ],
      roles: [
        {
          title: "Program Sponsor / CIO",
          accountability:
            "The end-to-end outcome — strategy, suite/SI selection, budget, and the " +
            "program's credibility on cost, schedule, and realized benefit.",
        },
        {
          title: "Program Director / PMO Lead",
          accountability:
            "Delivery to plan and budget, SI management and change-order discipline, " +
            "cutover readiness gates, and joint program governance.",
        },
        {
          title: "Enterprise Architect / Design Authority",
          accountability:
            "Clean-core principle, the extension-approval gate, process " +
            "standardization, and upgrade-safe architecture decisions.",
        },
        {
          title: "Data Migration Lead",
          accountability:
            "Data profiling, cleansing, migration reconciliation accuracy, and the " +
            "cutover data readiness gate with the data owners.",
        },
        {
          title: "Organizational Change / Adoption Lead",
          accountability:
            "Change management, training, and post-go-live adoption and process " +
            "conformance in the business population.",
        },
        {
          title: "Benefit-Realization Owner (with Finance)",
          accountability:
            "Post-go-live benefit tracking against the baseline, legacy retirement, " +
            "and Finance attestation of realized value.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Financial controls & SOX (system of record integrity)",
          relevance:
            "An ERP IS the financial system of record — migrated balances, " +
            "segregation-of-duties, audit trails, and benefit attested into the P&L " +
            "must withstand financial-control and SOX scrutiny.",
        },
        {
          name: "Data privacy & residency (GDPR / CCPA and equivalents)",
          relevance:
            "Master data (HR, customer, supplier) migrated and processed in the ERP " +
            "and in non-production test environments must respect privacy, masking, " +
            "and residency obligations.",
        },
        {
          name: "Industry / sector regulation (where the enterprise operates)",
          relevance:
            "Sector rules (financial-services capital/reporting, healthcare, " +
            "public-sector procurement) constrain configuration, data handling, and " +
            "validation evidence the program must produce.",
        },
        {
          name: "Software licensing & indirect/digital access compliance",
          relevance:
            "ERP license models (named-user, digital/indirect access, " +
            "subscription/RISE) carry compliance and audit exposure that shapes the " +
            "deployment and integration architecture and the sourcing terms.",
        },
      ],
      canonicalTerms: [
        {
          term: "Clean core",
          definition:
            "The principle of keeping the ERP close to standard process and using " +
            "upgrade-safe, side-by-side extensibility rather than core modification " +
            "— the basis for low TCO and continuous upgrades.",
        },
        {
          term: "Customization / extension ratio (RICEFW)",
          definition:
            "The share of functionality built as custom code/extensions outside " +
            "standard configuration (reports, interfaces, conversions, " +
            "enhancements, forms, workflows) — the inverse of clean-core fit.",
        },
        {
          term: "Greenfield / brownfield / hybrid",
          definition:
            "Deployment approaches: greenfield = new standardized implementation; " +
            "brownfield = technical conversion of the existing system; hybrid / " +
            "selective = a mix, migrating selected data and processes anew.",
        },
        {
          term: "Cutover & hypercare",
          definition:
            "Cutover is the rehearsed transition from legacy to the new system at " +
            "go-live; hypercare is the intensive stabilization window immediately " +
            "after, before benefit realization begins.",
        },
        {
          term: "Systems integrator (SI / GSI)",
          definition:
            "The implementation partner that delivers the program; the SI's " +
            "commercial model, scope discipline, and change-order regime are a " +
            "primary determinant of cost and outcome.",
        },
        {
          term: "Post-go-live value realization",
          definition:
            "The discipline of driving adoption, process conformance, legacy " +
            "retirement, and Finance-attested benefit AFTER go-live — where ERP " +
            "value actually lands.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Implementation cost, schedule, and SI change-order leakage",
        authoritativeSource:
          "Program financials and the SI contract / change-order register in the " +
          "PMO reconciled to the approved business case and original SOW",
        whatGoodEvidenceLooksLike:
          "Actual cost and milestone delivery against the ORIGINAL baseline (not a " +
          "re-baselined plan), with cumulative SI change orders as a share of the " +
          "original contract value and their scope causes.",
        weakEvidenceToReject:
          "An 'on track' status against a re-baselined plan, or a cost figure with " +
          "no reconciliation to the approved budget and no change-order accounting.",
      },
      {
        claim: "Customization ratio and process standardization",
        authoritativeSource:
          "Build/extensibility register and the process-design repository against " +
          "the target operating model and clean-core extensibility catalog",
        whatGoodEvidenceLooksLike:
          "Custom/extension objects and effort as a share of total with each " +
          "extension justified, and standardized-template vs retained-variant " +
          "processes by area against the target operating model.",
        weakEvidenceToReject:
          "A claim that the build is 'mostly standard' with no extension inventory " +
          "or standardization breakdown, or standardization asserted with legacy " +
          "variants preserved as custom code.",
      },
      {
        claim: "Data migration accuracy and cutover readiness",
        authoritativeSource:
          "Migration reconciliation reports and mock-cutover / dress-rehearsal " +
          "results matched to the legacy source of record",
        whatGoodEvidenceLooksLike:
          "Field-level and control-total reconciliation to the source of record " +
          "with quantified exceptions, plus evidence of rehearsed mock cutovers and " +
          "explicit go/no-go readiness gate sign-off.",
        weakEvidenceToReject:
          "A 'data is ready' assertion with no reconciliation percentage, no mock " +
          "cutover, and cleansing deferred to a big-bang at the end.",
      },
      {
        claim: "Post-go-live benefit realization and adoption",
        authoritativeSource:
          "Value control tower with Finance attestation against the pre-program " +
          "baseline, joined to usage telemetry / process-mining conformance",
        whatGoodEvidenceLooksLike:
          "Realized benefit attested by Finance against a measured pre-program " +
          "baseline, with post-go-live adoption and process-conformance rates and " +
          "legacy systems actually retired.",
        weakEvidenceToReject:
          "A 'successful go-live' presented as benefit, a vendor/SI projected " +
          "number reported as realized, or adoption claimed from provisioning rather " +
          "than measured active/correct usage.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your implementation cost against the approved budget and on-time milestone delivery against the ORIGINAL baseline — and how much of any overrun traces to scope creep, customization, or SI change orders?",
      "What is your customization/extension ratio against clean core, and is every extension challenged against a standardized-process alternative before it is admitted?",
      "What is your data-migration reconciliation accuracy to the source of record, and how many full mock cutovers have you rehearsed before go-live?",
      "Who owns benefit realization AFTER go-live, is the business case baselined per process area and tracked to Finance attestation post-cutover, and is there a hypercare-to-value plan?",
      "What is your SI change-order leakage against the original SOW, and is the commercial model and governance structured so the SI shares risk and scope is controlled?",
      "What is your post-go-live adoption and process-conformance rate, and is change management funded and run as a deliverable rather than an afterthought to the build?",
      "Is the business case built on a measured pre-program baseline that Finance defined and will attest, or on a vendor/SI benefit model with blanket percentages?",
    ],
    maturitySignals: [
      "The target operating model and standardization principles were set BEFORE suite/SI selection, and selection was fit-to-standard-process, not a feature checklist or vendor demo.",
      "A clean-core governance board defaults to standard and admits extensions only via upgrade-safe extensibility with an owner — the customization ratio is held low and measured.",
      "The SI engagement is tightly scoped with a shared-risk commercial model and disciplined change control, and the client retains design authority rather than outsourcing it.",
      "Data is profiled, cleansed, and reconciled early and iteratively, with rehearsed mock cutovers and an explicit go/no-go readiness gate — not a big-bang on dirty data.",
      "A benefit-realization owner and a baselined value tracker stay live for several quarters post-go-live, driving adoption, retiring legacy, and attesting benefit to Finance.",
    ],
    redFlags: [
      "Customization away from clean core is high and rising, with extensions admitted without challenge — the dominant value killer is unmanaged and TCO is being mortgaged.",
      "The client is a passive buyer: scope is loose, the SI runs on T&M with change-order leakage, and key design/architecture decisions are effectively outsourced to the SI.",
      "Go-live is treated as the finish line — the team disbands at cutover, legacy is not retired, no one owns post-go-live benefit, and time-to-value is open-ended.",
      "The business case rests on a vendor/SI benefit model with blanket percentages and no measured pre-program baseline Finance will attest, so the promised number is fiction.",
      "Data is migrated un-reconciled and cutover is under-rehearsed, so the first finance close fails and reporting breaks — eroding confidence and driving reversion.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "ERP suite vendors (SAP S/4HANA / RISE, Oracle Fusion, Workday, Microsoft Dynamics 365)",
        category: "Core ERP platform license/subscription and roadmap",
        switchingCost:
          "Very high — the ERP is the financial/operational system of record; data, configuration, extensions, integrations, and the whole process estate concentrate here, so a re-platform is a multi-year program, not a renewal choice.",
        renewalDynamics:
          "Subscription/RISE bundles, named-user and digital/indirect-access licensing, and roadmap-driven upgrade pressure; indirect-access and digital-access exposure are the recurring audit and negotiation flashpoints.",
      },
      {
        vendorName: "Global systems integrators / SIs (Accenture, Deloitte, the GSI ecosystem and specialists)",
        category: "Implementation, integration, and program delivery",
        switchingCost:
          "High mid-program — design knowledge, build artifacts, and momentum embed in the SI; switching SIs mid-implementation is disruptive, which is precisely why scope, change-control, and joint accountability must be locked at contract.",
        renewalDynamics:
          "Time-and-materials, fixed-price, or shared-risk/outcome models; change orders are the dominant cost-leakage and renewal-pressure mechanism, so the commercial model and change-control regime are the negotiation.",
      },
      {
        vendorName: "Implementation accelerators & extensibility platforms (BTP, OCI, Power Platform, low-code/extension tooling)",
        category: "Side-by-side extensibility, integration, and accelerators",
        switchingCost:
          "Moderate-to-high — extensions and integrations built on the platform accrete and tie to the suite; the lock-in is the extension estate, which is also where clean-core discipline is won or lost.",
        renewalDynamics:
          "Consumption or platform subscription often bundled with the suite; the lever is right-sizing consumption and avoiding extension sprawl that raises both cost and upgrade risk.",
      },
      {
        vendorName: "Data-migration, test-automation & process-mining tooling (Syniti, Tricentis, Celonis, etc.)",
        category: "Migration, quality, regression automation, and process intelligence",
        switchingCost:
          "Moderate — point tools integrate via connectors and are replaceable, but the migrated data models, automated test suites, and mined processes are the accreting assets that raise switching cost over time.",
        renewalDynamics:
          "Subscription or consumption by scope/volume; value depends on realized coverage (reconciled data, automated regression, conformance), which is the basis to negotiate scope and outcome terms.",
      },
      {
        vendorName: "Application-managed-services (AMS) / run partners",
        category: "Post-go-live run, support, and continuous-upgrade services",
        switchingCost:
          "Moderate — run knowledge and ticket history accrete, but AMS is re-sourceable; the real cost driver is the customization estate the partner must maintain and regression-test each upgrade.",
        renewalDynamics:
          "Per-ticket / FTE / outcome-based run contracts; clean-core estates lower run cost and de-risk re-sourcing, while heavily-customized estates entrench the incumbent and inflate renewal price.",
      },
    ],
    switchingCosts:
      "The ERP suite itself is effectively non-switchable once live — it is the " +
      "financial and operational system of record, and the data, configuration, " +
      "extension estate, integrations, and trained workforce concentrate there, " +
      "so re-platforming is a fresh multi-year program. The SI is high-cost to " +
      "switch mid-program (design knowledge and momentum embed), which is why " +
      "scope and accountability must be locked at contract, not renegotiated under " +
      "pressure. The negotiable frontier is the SI commercial model and change-" +
      "control regime, the extensibility/accelerator and AMS layers, and the " +
      "migration/test/process tooling — and the cleanest long-run lever is clean-" +
      "core discipline, which keeps the run/AMS and upgrade market contestable.",
    negotiationLevers: [
      "Shared-risk / outcome-tied SI commercial model with milestone and benefit-realization holdbacks, instead of open time-and-materials that rewards billable change",
      "Tight, signed scope with a disciplined change-control regime and a change-order ceiling, so change-order leakage is contained against the original SOW",
      "Client retains design authority and clean-core governance — contract the SI to a standardization/clean-core target, not a customization-as-billable model",
      "Address digital/indirect-access and named-user licensing exposure explicitly in the suite deal to avoid a post-go-live audit surprise",
      "Phase-gated selection-to-scale with fit-to-standard-process and data-readiness proof before full commitment, and AMS/run terms that reward clean-core (lower run cost)",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cost_schedule_claim: [
        "actual cost reconciled to the approved budget",
        "on-time milestone delivery against the ORIGINAL baseline (not re-baselined)",
        "SI change-order leakage against the original SOW with scope causes",
      ],
      customization_claim: [
        "custom/extension object and effort inventory vs total (clean-core ratio)",
        "process standardization by area vs retained legacy variants",
        "justification and owner for each admitted extension",
      ],
      data_cutover_claim: [
        "migration reconciliation to the source of record (counts, control totals, field validation)",
        "mock-cutover / dress-rehearsal evidence",
        "go/no-go cutover readiness gate sign-off",
      ],
      benefit_claim: [
        "measured pre-program baseline Finance defined",
        "realized benefit Finance-attested post-go-live against that baseline",
        "post-go-live adoption / process-conformance and legacy-retirement evidence",
      ],
      value_projection: [
        "the business case sized on a per-process-area baseline (not a vendor/SI percentage)",
        "labelled planning-range benchmark AND the realization rate applied",
        "explicit haircut factors (customization, overrun/change-order, adoption, baseline/attestation)",
        "the post-go-live Finance attestation path",
      ],
    },
    citationStandard:
      "Quantitative ERP claims cite the system of record (program financials, " +
      "build/extensibility register, migration reconciliation, value control tower) " +
      "and the period. Cost and schedule claims cite the ORIGINAL approved baseline " +
      "and quantify SI change-order leakage — never an 'on track' status against a " +
      "re-baselined plan. Benefit claims carry BOTH the projected figure and the " +
      "Finance-attested realized figure against a measured pre-program baseline — " +
      "never a vendor/SI projected number presented as realized, and never a " +
      "go-live milestone presented as value. Value projections size on a per-" +
      "process-area baseline, give a labelled planning range for the benefit AND " +
      "the realization rate, name the haircut factors (customization, overrun, " +
      "adoption, attestation), and give the post-go-live attestation path.",
  },

  hedgeRules: {
    whenToHedge: [
      "No measured pre-program baseline exists — frame benefit as an industry planning range net of a realization rate, never a tenant-specific dollar figure.",
      "Benefit is sized from a vendor/SI business case — present it as projected pending a Finance-defined baseline and attestation, and flag the typical projected-to-attested gap.",
      "Cost/schedule is reported against a re-baselined plan — surface the original baseline and the slippage/overrun it hides before quoting status.",
      "Value is claimed at or before go-live — flag that ERP value lands post-go-live and depends on adoption, clean data, and a hypercare-to-value discipline.",
      "Customization is high or unmeasured — gate the TCO and benefit estimate on the clean-core / customization ratio explicitly.",
    ],
    inferenceLanguage: [
      "Across enterprise ERP modernizations at this scale, cost overrun and SI change-order leakage typically run...",
      "Without your post-go-live realization tracking, the industry pattern suggests business-case benefit realizing at roughly... after adoption and customization haircuts...",
      "Peer programs with disciplined clean-core governance commonly hold the customization/extension ratio in the range of...",
      "Treating this as a planning range on a per-process-area baseline rather than your measured figure, and pending Finance attestation post-go-live...",
    ],
    flagWithoutEvidence: [
      "A specific realized benefit, implementation cost, or TCO number for this tenant",
      "This tenant's actual customization ratio, data-migration accuracy, adoption rate, or SI change-order leakage",
      "A vendor/SI projected business-case number presented as realized or Finance-attested benefit",
      "A go-live milestone presented as delivered business value",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "benefit story / projected business case to post-go-live attested value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from the projected business case through each haircut (customization, cost overrun / change-order, adoption shortfall, baseline/attestation) to Finance-attested post-go-live benefit.",
    },
    {
      questionPattern:
        "cost breakdown / where the implementation spend and overrun sit",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack program cost by component (software, SI base, SI change orders, internal effort, infrastructure, change) against the approved budget to expose overrun and change-order leakage.",
    },
    {
      questionPattern:
        "value sensitivity to customization, overrun, adoption, and baseline",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (customization away from clean core, cost overrun / change-order leakage, adoption shortfall, baseline/attestation).",
    },
    {
      questionPattern:
        "program timeline / phases, cutover, hypercare, and value ramp",
      exhibitKind: "chart",
      chartKind: "swimlane",
      chartBuilder: "swimlane",
      note: "Swimlane of strategy, build, cutover, hypercare, and the post-go-live value-realization ramp, making plain that value lands after go-live, not at it.",
    },
    {
      questionPattern: "ERP program KPI scorecard",
      exhibitKind: "table",
      note: "Cost vs budget, on-time milestone %, customization ratio, data-migration accuracy, process standardization %, benefit realization %, post-go-live adoption, go-live defect rate, SI change-order leakage, time-to-value, TCO, test-automation coverage vs planning ranges.",
    },
    {
      questionPattern: "SI / sourcing evaluation / commercial-model comparison",
      exhibitKind: "table",
      note: "Per SI option: scope fit, commercial model (T&M / fixed / shared-risk), rate benchmark, change-control regime, clean-core commitment, references, and change-order-leakage risk.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "low",
    successDrivers: [
      "Target operating model and standardization principles are set first and the suite/SI are selected for fit-to-standard-process, not a feature checklist or vendor demo",
      "Clean-core governance holds the customization ratio down — extensions are challenged and admitted only via upgrade-safe extensibility",
      "SI management is disciplined: tight scope, a shared-risk commercial model, controlled change orders, and the client retaining design authority",
      "Data is cleansed and reconciled early with rehearsed mock cutovers, and change management is funded and run as a deliverable so adoption lands",
      "A benefit-realization owner and baselined value tracker stay live post-go-live to drive adoption, retire legacy, and attest benefit to Finance",
    ],
    failureDrivers: [
      "Scope creep and customization away from clean core inflate cost, delay go-live, and mortgage every future upgrade — the dominant value killer left unmanaged",
      "Passive SI management: loose scope, T&M change-order leakage, and design/architecture effectively outsourced to the SI, blowing the budget",
      "Treating go-live as the finish line — team disbands, legacy is not retired, no one owns post-go-live benefit, and value never lands",
      "Going live on dirty, un-reconciled data with an under-rehearsed cutover, so the first finance close fails and confidence collapses",
      "A vendor/SI business case with blanket percentages and no measured baseline that Finance will never attest, plus under-funded change management and reversion",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption is the hard, post-go-live leg and it is where most value is won or " +
      "lost. At cutover, usage is mandated but fragile — defects and unfamiliarity " +
      "drive reversion to spreadsheets and shadow systems. Power users and the " +
      "functions with the strongest change support adopt first; broad correct usage " +
      "of standardized process ramps over the following quarters ONLY if hypercare " +
      "stabilizes the platform, training is sustained, and a named business owner " +
      "drives conformance. Legacy retirement is the forcing function that finally " +
      "kills the workarounds. Programs that disband at go-live see adoption stall " +
      "and benefit silently evaporate.",
    roiClarity: "low",
    roiClarityBasis:
      "ERP ROI clarity is honestly LOW, and that is the defensible position. The " +
      "COST side is large and reasonably measurable, but it routinely overruns; the " +
      "BENEFIT side is diffuse, lands post-go-live, and is hard to attribute — " +
      "process-standardization and run-cost gains are entangled with concurrent " +
      "change, adoption is voluntary and erodes the number, and most programs never " +
      "baseline per process area or run Finance attestation, so the realized figure " +
      "is unknown. Vendor/SI business cases over-state the prize. This is why the " +
      "value model leans on a per-process-area baseline, a realization rate, and " +
      "explicit customization/overrun/adoption haircuts, and the evidence/hedge " +
      "rules force a post-go-live Finance-attestation path rather than a go-live " +
      "milestone or a vendor percentage.",
  },

  regulatoryFrame: {
    name: "Financial-control integrity (SOX), data privacy/residency & licensing compliance",
    relevance:
      "The dominant regulatory frame for ERP modernization: the ERP is the " +
      "financial system of record, so migrated balances, segregation-of-duties, " +
      "audit trails, and any benefit attested into the P&L must withstand " +
      "financial-control and SOX scrutiny; master data migrated and processed " +
      "(including in non-production test environments) must respect privacy, " +
      "masking, and residency (GDPR/CCPA and equivalents); sector regulation " +
      "constrains configuration and validation evidence; and ERP licensing " +
      "(named-user, digital/indirect access, RISE/subscription) carries audit and " +
      "compliance exposure that shapes both architecture and sourcing terms (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
