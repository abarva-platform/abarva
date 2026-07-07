// Consilium expert — Application & Digital Modernization (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every CIO and IT investment committee faces when the application
// estate has grown into a tangle of overlapping, aging, expensive systems:
// "which applications do we retire, consolidate, re-platform, re-factor, or
// leave alone — and where does the money actually come from?" It is the
// APPLICATION PORTFOLIO + legacy-modernization layer that supports an IT
// INVESTMENT module (Tower application rationalization).
//
// Honesty doctrine. This expert is built around three non-negotiable truths.
// First, the business case lives in RATIONALIZATION (retire, consolidate,
// decommission), not in rewrites — the cheapest application is the one you turn
// off, and the durable savings come from shrinking the estate, not from
// re-coding it. Second, "big bang" rewrites overwhelmingly fail: they run long,
// re-create the old system's accidental complexity, and rarely beat an
// incremental strangler-fig path. Third, technical debt is a RECURRING TAX, not
// a one-time fix — it accrues continuously, and a remediation that does not
// change the rate of new debt buys a temporary dip, not a cure. The expert
// refuses the "modernize = rewrite to the cloud" reflex and the
// "modernization ROI = developer productivity" leap, and insists on a disposition
// decision (the TIME / 6R frame) grounded in business-capability value and TCO
// before any spend lands. It is DISTINCT from cloud-infrastructure (infra) and
// engineering-productivity (dev velocity): this layer reasons about the app
// portfolio and legacy debt, not the underlying compute or the SDLC.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const applicationModernizationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.application-modernization",
    expertName: "Application & Digital Modernization Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "application-modernization",
    scopeNote:
      "Horizontal across every enterprise application estate and industry: how " +
      "to rationalize an application portfolio (TIME / 6R disposition — retire, " +
      "retain, re-host, re-platform, re-factor, re-purchase, consolidate), " +
      "remediate legacy and technical debt, re-platform and re-factor aging " +
      "systems, modernize APIs and integration, stand up digital experience " +
      "platforms, and decompose monoliths toward microservices — decided on " +
      "business-capability value and application TCO, not on a rewrite reflex. " +
      "Anchored to the honest positions that the durable business case lives in " +
      "RATIONALIZATION (retire/consolidate) more than rewrites, that 'big bang' " +
      "rewrites usually fail in favor of incremental strangler-fig paths, and " +
      "that technical debt is a recurring tax, not a one-time fix. Supports an " +
      "IT INVESTMENT module (Tower application rationalization). Excludes the " +
      "underlying cloud/compute and landing-zone work (a separate " +
      "cloud-infrastructure expert), engineering delivery velocity and the SDLC " +
      "(a separate engineering-productivity expert), the commercial sourcing of " +
      "the software/SaaS stack itself (a separate sourcing expert beyond " +
      "application disposition), and broad data-platform modernization.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "application_count",
        name: "Application count (estate size)",
        definition:
          "The number of distinct applications in the production estate, " +
          "inventoried and de-duplicated — the denominator for every " +
          "rationalization, redundancy, and TCO measure.",
        unit: "applications",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 200,
          high: 1200,
          basis:
            "Large-enterprise application portfolios commonly run into the " +
            "hundreds to low thousands; absolute count varies enormously by " +
            "revenue, history, and M&A, so the directional ask is a shrinking, " +
            "well-inventoried estate, not a fixed target",
          label: "planning-range",
        },
        dataSource:
          "Application portfolio management / CMDB inventory (e.g. ServiceNow APM, LeanIX, CMDB) reconciled to spend and SSO logs",
        whyItMatters:
          "Estate size is the master driver of cost, risk, and integration " +
          "complexity. You cannot rationalize what you have not inventoried — and " +
          "an uncounted or stale inventory is itself the first finding, because " +
          "the durable savings come from shrinking this number.",
      },
      {
        key: "eol_unsupported_pct",
        name: "% applications end-of-life / unsupported",
        definition:
          "Share of applications running on end-of-life, out-of-support, or " +
          "vendor-abandoned technology (unsupported OS, runtime, database, or " +
          "framework) — the obsolescence and security-exposure signal.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Aging enterprise estates commonly carry a meaningful tail of " +
            "out-of-support technology; the band is wide because it tracks " +
            "investment history, with the directional ask being a falling tail",
          label: "planning-range",
        },
        dataSource:
          "Technology-stack inventory in APM/CMDB cross-referenced to vendor support-lifecycle data",
        whyItMatters:
          "End-of-life technology is unpatchable risk and rising run cost — it is " +
          "the sharpest modernization trigger and the most defensible part of the " +
          "business case, because the alternative is an audit and security finding, not a choice.",
      },
      {
        key: "redundancy_overlap_pct",
        name: "Application redundancy / functional overlap",
        definition:
          "Share of applications whose business capability is materially " +
          "duplicated by another application in the estate — the consolidation " +
          "opportunity, the single largest source of rationalization savings.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Estates grown through M&A and shadow IT commonly carry substantial " +
            "functional overlap (multiple CRMs, overlapping reporting/BI, " +
            "duplicate ticketing); the directional ask is consolidation, not a fixed floor",
          label: "planning-range",
        },
        dataSource:
          "Capability-to-application mapping in APM (business-capability model joined to the inventory)",
        whyItMatters:
          "Overlap is where rationalization pays. Retiring or consolidating a " +
          "duplicate capability removes license, support, infrastructure, and " +
          "integration cost at once — a larger and more durable saving than " +
          "re-coding any single system.",
      },
      {
        key: "technical_debt_ratio",
        name: "Technical debt ratio",
        definition:
          "Estimated cost to remediate a codebase's known issues as a fraction " +
          "of the cost to rebuild it (or an equivalent normalized debt index) — " +
          "a tracked proxy for accumulated code-level debt, best read with its rate of change.",
        unit: "ratio (remediation cost / development cost)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.05,
          high: 0.3,
          basis:
            "Code-quality tooling commonly reports debt ratios in the low tens of " +
            "percent for maintained codebases; absolute values vary by language " +
            "and tool, so the honest signal is the trend, not the point value",
          label: "planning-range",
        },
        dataSource:
          "Static-analysis / code-quality platform (e.g. SonarQube, CAST) per application, trended over time",
        whyItMatters:
          "Technical debt is a recurring tax: it slows change and raises run cost " +
          "continuously. The ratio is only honest read as a RATE — a remediation " +
          "that lowers it once but does not change how fast new debt accrues buys " +
          "a temporary dip, not a cure.",
      },
      {
        key: "maintenance_pct_of_app_budget",
        name: "Maintenance (run) % of application budget",
        definition:
          "Share of the application budget consumed by keeping existing systems " +
          "running (run / 'keep-the-lights-on') versus funding new capability " +
          "(change / 'grow-and-transform') — the run-versus-change balance.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 55,
          high: 80,
          basis:
            "Enterprises commonly spend the majority of the application budget on " +
            "run rather than change; aging, debt-laden estates skew higher, so the " +
            "directional ask is a falling run share that frees change capacity",
          label: "planning-range",
        },
        dataSource:
          "IT financial management / TBM run-vs-change cost model joined to the application inventory",
        whyItMatters:
          "This is the modernization business case in one number: legacy debt and " +
          "estate sprawl trap budget in run, starving change. Rationalization and " +
          "remediation are justified when they durably shift the run/change ratio, " +
          "not by a velocity claim.",
      },
      {
        key: "apps_with_apis_pct",
        name: "% applications exposing managed APIs",
        definition:
          "Share of applications that expose their capabilities through managed, " +
          "documented, governed APIs (rather than point-to-point integration, " +
          "file drops, or direct database access) — the integration-modernization signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "API coverage varies widely by integration maturity; many estates " +
            "still lean on point-to-point and batch integration, so the directional " +
            "ask is rising managed-API coverage, not a universal mandate",
          label: "planning-range",
        },
        dataSource:
          "API gateway / management platform catalog (e.g. Apigee, MuleSoft, Kong) joined to the application inventory",
        whyItMatters:
          "Managed APIs are what make an estate composable and modernizable " +
          "incrementally (strangler-fig, decoupling, reuse). Low API coverage " +
          "means brittle point-to-point integration that makes every change " +
          "expensive and every retirement risky.",
      },
      {
        key: "integration_point_to_point_pct",
        name: "% integrations that are point-to-point",
        definition:
          "Share of system-to-system integrations implemented as direct " +
          "point-to-point links (bespoke connectors, file transfers, direct DB " +
          "reads) rather than through a managed integration layer — the brittleness signal.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Legacy estates accumulate dense point-to-point webs; the directional " +
            "ask is migration to a managed integration/API layer, with the floor " +
            "set by genuinely simple links that do not need mediation",
          label: "planning-range",
        },
        dataSource:
          "Integration inventory / dependency mapping (integration platform logs + architecture review)",
        whyItMatters:
          "Point-to-point integration is the hidden cost of legacy estates — it " +
          "makes systems impossible to retire without breaking unseen consumers " +
          "and turns every modernization into archaeology. Decoupling here unlocks rationalization.",
      },
      {
        key: "modernization_on_time_pct",
        name: "Modernization delivery on-time %",
        definition:
          "Share of modernization work packages (re-platform, re-factor, " +
          "decommission, consolidation waves) delivered within their committed " +
          "time window — the delivery-credibility signal that exposes big-bang risk.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Modernization programs, especially large rewrites, overrun routinely; " +
            "incremental strangler-fig delivery tends to land far more reliably, so " +
            "a low figure is a leading indicator of big-bang risk",
          label: "planning-range",
        },
        dataSource:
          "Program/portfolio delivery tracking (work-package committed vs actual delivery dates)",
        whyItMatters:
          "Modernization fails most often on delivery, not on idea. A low on-time " +
          "rate — especially clustered in large monolithic rewrites — is the " +
          "earliest honest warning that a big-bang approach is overrunning and " +
          "should be re-cut into incremental slices.",
      },
      {
        key: "change_failure_rate",
        name: "Change failure rate (modernized vs legacy)",
        definition:
          "Share of production changes to a given application that cause a " +
          "failure requiring remediation — tracked split by modernized versus " +
          "legacy systems to test whether modernization actually improved stability.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Change failure rates span a wide band by system age and architecture; " +
            "the modernization claim is that modernized systems should sit lower " +
            "than the legacy ones they replaced — the honesty check on the rewrite",
          label: "planning-range",
        },
        dataSource:
          "Change/incident records correlated to releases, segmented by application modernization status",
        whyItMatters:
          "The quality reality check on modernization: a re-platform or rewrite " +
          "that does not lower change failure rate versus the legacy system it " +
          "replaced has not delivered, regardless of how 'modern' the stack looks.",
      },
      {
        key: "application_tco",
        name: "Application total cost of ownership (TCO)",
        definition:
          "Fully-loaded annual cost to own and run a single application — " +
          "license/subscription, infrastructure, support, maintenance labor, and " +
          "integration — the unit economics that drive disposition decisions.",
        unit: "USD per application per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 50000,
          high: 2000000,
          basis:
            "Per-application TCO ranges across orders of magnitude from small " +
            "departmental tools to core platforms; the value is the relative " +
            "ranking against business-capability value, not an absolute target",
          label: "planning-range",
        },
        dataSource:
          "IT financial management / TBM application-cost model (license + infra + support + labor allocated per app)",
        whyItMatters:
          "TCO read against business-capability value is the disposition engine: " +
          "high-cost / low-value applications are retire-or-consolidate candidates, " +
          "and a credible TCO model is what turns a rationalization opinion into a defensible savings case.",
      },
      {
        key: "business_capability_coverage",
        name: "Business-capability coverage / health",
        definition:
          "Share of the enterprise business-capability map that is supported by " +
          "fit, healthy applications (adequate, supported, non-redundant) versus " +
          "gapped, over-served, or fragile-legacy capabilities — the value-side lens.",
        unit: "% of capabilities adequately served",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Capability coverage varies by mapping maturity; mature estates show " +
            "most capabilities served by fit applications with few gaps or " +
            "redundancies, so the directional ask is rising fit-coverage",
          label: "planning-range",
        },
        dataSource:
          "Business-capability model joined to the application inventory and TIME/6R disposition ratings",
        whyItMatters:
          "Rationalization without the capability lens cuts cost blindly. " +
          "Capability coverage keeps the decision business-anchored: you retire " +
          "and consolidate where capability is over-served and invest where it is " +
          "gapped or fragile — value first, not cost alone.",
      },
      {
        key: "decommission_rate",
        name: "Application decommission rate",
        definition:
          "Number of applications fully retired and turned off per period, net " +
          "of new applications added — the direct measure of whether the " +
          "rationalization program is actually shrinking the estate.",
        unit: "applications decommissioned per year (net of additions)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 15,
          basis:
            "Net decommissioning is the hardest part of rationalization and many " +
            "programs add faster than they retire; sustained net-positive " +
            "decommissioning is the signal of a program that lands savings",
          label: "planning-range",
        },
        dataSource:
          "Portfolio lifecycle tracking (applications moved to retired status, validated against spend stopping)",
        whyItMatters:
          "Decommissioning is where rationalization savings are REALIZED, not " +
          "promised. A program that produces TIME/6R ratings and roadmaps but does " +
          "not actually turn applications off — and stop their spend — has booked " +
          "nothing; this rate is the honesty check on the whole business case.",
      },
    ],

    painThemes: [
      {
        key: "rewrite_reflex",
        name: "Rewrite reflex (modernize = big-bang rebuild)",
        description:
          "Modernization is reflexively scoped as a large rewrite or re-platform " +
          "of the most painful system, when the durable value would come from " +
          "retiring and consolidating duplicate, low-value applications. Money and " +
          "attention go into re-coding rather than shrinking the estate.",
        detectionSignal:
          "The modernization roadmap is a list of rewrites with little or no " +
          "decommission/consolidation track; no TIME/6R disposition; savings " +
          "narrative is 'modern stack' and developer productivity, not run-cost " +
          "removed by turning systems off.",
        diagnosticQuestion:
          "Of your modernization spend, how much retires or consolidates " +
          "applications versus re-coding systems you intend to keep — and what is " +
          "your net decommission rate?",
      },
      {
        key: "big_bang_overrun",
        name: "Big-bang rewrite overrun and failure",
        description:
          "A monolithic 'replace it all at once' rewrite runs long and over " +
          "budget, re-creates the legacy system's accidental complexity, and " +
          "delivers late or not at all — while the old system must be kept alive " +
          "in parallel, so cost rises before any benefit lands.",
        detectionSignal:
          "Large multi-year single-cutover programs; low modernization on-time %; " +
          "the legacy system still running long past its planned retirement; no " +
          "strangler-fig or incremental-slice path; cutover repeatedly deferred.",
        diagnosticQuestion:
          "Are your large modernizations structured as incremental strangler-fig " +
          "slices with continuous delivery, or as a single big-bang cutover — and " +
          "how have those big-bang programs tracked to plan?",
      },
      {
        key: "recurring_debt_tax",
        name: "Technical debt treated as a one-time fix",
        description:
          "Technical debt is remediated in a one-off campaign with no change to " +
          "the rate at which new debt accrues, so the debt ratio dips and then " +
          "climbs straight back — the organization pays the recurring tax again, " +
          "having mistaken a temporary cleanup for a cure.",
        detectionSignal:
          "Debt-remediation framed as a project with an end date rather than a " +
          "standing allocation; technical debt ratio rebounding after campaigns; " +
          "no debt budget in run; no architectural guardrails preventing new debt.",
        diagnosticQuestion:
          "Is technical debt managed as a recurring tax — a standing allocation " +
          "and guardrails that hold the rate of new debt — or as one-off campaigns " +
          "whose gains erode?",
      },
      {
        key: "estate_sprawl_no_inventory",
        name: "Estate sprawl with no trustworthy inventory",
        description:
          "The true application count is unknown or stale: shadow IT, M&A " +
          "carry-ins, and undocumented integrations mean nobody can list what runs " +
          "or what depends on what — so rationalization cannot even start, and " +
          "retirements break unseen consumers.",
        detectionSignal:
          "No reconciled APM/CMDB inventory; counts that disagree across spend, " +
          "SSO, and CMDB; surprise dependencies discovered during retirement; " +
          "shadow-IT spend outside central IT.",
        diagnosticQuestion:
          "Do you have a single reconciled application inventory — count, owner, " +
          "TCO, business capability, and dependencies — that you trust enough to " +
          "make retire/consolidate decisions on?",
      },
      {
        key: "integration_lock_in",
        name: "Point-to-point integration lock-in",
        description:
          "A dense web of point-to-point integrations, file drops, and direct " +
          "database reads makes every application impossible to retire or replace " +
          "without breaking hidden consumers — so the estate calcifies and " +
          "modernization stalls on integration archaeology.",
        detectionSignal:
          "High point-to-point integration share, low managed-API coverage, " +
          "retirements blocked by 'we don't know who consumes this', integration " +
          "rework dominating every modernization estimate.",
        diagnosticQuestion:
          "How much of your integration is point-to-point versus a managed API/ " +
          "integration layer — and can you see, for any application, who consumes " +
          "it before you retire it?",
      },
      {
        key: "run_traps_change",
        name: "Run cost traps the change budget",
        description:
          "Aging, redundant, debt-laden systems consume the majority of the " +
          "application budget just to keep running, starving funding for new " +
          "capability — yet the modernization case is argued on 'modern' rather " +
          "than on freeing trapped run cost into change.",
        detectionSignal:
          "Maintenance/run share of app budget high and rising; new-capability " +
          "funding squeezed; modernization business cases that never quantify the " +
          "run-to-change shift they would unlock.",
        diagnosticQuestion:
          "What share of your application budget is trapped in run versus change, " +
          "and which rationalization moves would durably shift that ratio?",
      },
      {
        key: "value_blind_rationalization",
        name: "Cost-blind (or value-blind) rationalization",
        description:
          "Rationalization is driven by cost alone with no business-capability " +
          "lens — high-value systems get cut to hit a savings target, or " +
          "low-value high-cost systems survive because no one mapped them to " +
          "capability — so the program destroys value or misses the real targets.",
        detectionSignal:
          "TIME/6R ratings (if any) based on cost or age alone; no capability " +
          "map; no link between disposition and business value; savings targets " +
          "set top-down without a per-application value/TCO view.",
        diagnosticQuestion:
          "Is your disposition decision grounded in business-capability value AND " +
          "TCO together, or is it cost-driven — and how do you avoid cutting " +
          "high-value capability to hit a number?",
      },
      {
        key: "no_decommission_realization",
        name: "Decommissioning never actually happens",
        description:
          "The program produces disposition ratings, target architectures, and " +
          "roadmaps, but applications are never fully turned off and their spend " +
          "never stops — systems linger in 'being retired' status for years, so " +
          "the promised savings are booked but never realized.",
        detectionSignal:
          "Many applications in long-running 'planned for retirement' status; net " +
          "decommission rate near zero; spend not falling despite a rationalization " +
          "program; no owner accountable for actually stopping a system.",
        diagnosticQuestion:
          "Of the applications you have decided to retire, how many have actually " +
          "been turned off with their spend stopped — and who is accountable for " +
          "realizing the decommission, not just deciding it?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_portfolio_disposition",
        name: "AI-assisted portfolio inventory & disposition (TIME/6R)",
        valueMechanism:
          "Use AI to reconcile fragmented inventory sources (CMDB, spend, SSO, " +
          "integration logs) into a trustworthy application catalog, cluster " +
          "functionally overlapping applications, and propose draft TIME/6R " +
          "dispositions from cost, age, support status, and capability fit — " +
          "compressing the months of manual discovery that usually stall " +
          "rationalization, so the estate can actually be sized and triaged. Value " +
          "shows up as a credible inventory, surfaced redundancy, and a faster " +
          "decommission pipeline — NOT as the AI making the retire/keep call.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Reconcilable inventory sources (APM/CMDB, application spend, SSO/usage logs, integration inventory)",
          "A business-capability model to cluster applications against",
          "Per-application TCO and support-lifecycle data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI proposes draft dispositions; the retire/consolidate decision stays with an accountable owner",
          "Inventory reconciliation must surface, not hide, the confidence gaps — a wrong 'safe to retire' breaks consumers",
        ],
        metricsMoved: [
          "application_count",
          "redundancy_overlap_pct",
          "decommission_rate",
          "business_capability_coverage",
        ],
      },
      {
        key: "ai_legacy_code_comprehension",
        name: "AI legacy code comprehension & documentation",
        valueMechanism:
          "Apply LLMs to read undocumented legacy code (COBOL, old Java/.NET, " +
          "stored procedures), explain behavior, extract business rules, and " +
          "generate the documentation and dependency understanding that " +
          "modernization needs — cutting the archaeology that makes legacy " +
          "remediation slow and risky, and de-risking the strangler-fig boundary. " +
          "Value is faster, safer modernization of systems no one understands; it " +
          "does NOT mean trusting the extracted rules without validation.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Access to legacy source code and runtime/dependency context within governance",
          "Subject-matter experts to validate extracted business rules",
          "A target capability/behavior baseline to test comprehension against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Extracted business rules must be validated against real behavior before they drive a rewrite — plausible-wrong is dangerous",
          "Proprietary legacy code shared with external models implicates IP and confidentiality controls",
        ],
        metricsMoved: [
          "technical_debt_ratio",
          "modernization_on_time_pct",
          "change_failure_rate",
        ],
      },
      {
        key: "ai_assisted_refactoring",
        name: "AI-assisted re-factoring & re-platforming",
        valueMechanism:
          "Use AI to accelerate code transformation — language/framework uplift, " +
          "monolith decomposition boundaries, dependency upgrades, and migration " +
          "scaffolding — under test coverage, so re-factor and re-platform work " +
          "moves faster at a held quality bar. Value is realized as more " +
          "modernization delivered on-time with lower change failure rate, NOT as " +
          "an unattended auto-migration; AI-transformed code passes the same review and tests as any change.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Source code, build, and a test suite strong enough to validate transformed code",
          "Modernization on-time and change-failure baselines per application",
          "Defined re-factor/decomposition boundaries (often from code-comprehension)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-transformed code must pass the same review, test, and security gates as human-written code",
          "Without strong test coverage, AI transformation moves fast and breaks quietly — coverage is the precondition",
        ],
        metricsMoved: [
          "modernization_on_time_pct",
          "technical_debt_ratio",
          "change_failure_rate",
        ],
      },
      {
        key: "ai_dependency_impact_analysis",
        name: "AI dependency & retirement impact analysis",
        valueMechanism:
          "Mine integration logs, code, and runtime telemetry to build and keep " +
          "current the dependency graph — who consumes each application and " +
          "interface — so retirements and consolidations can be sequenced safely " +
          "and the hidden point-to-point web is made visible. Value is a higher, " +
          "safer decommission rate because retirements stop breaking unseen " +
          "consumers; it does NOT replace a human-validated cutover plan.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Integration/API logs, network flow data, and code references across the estate",
          "The reconciled application inventory to anchor the graph to",
          "Runtime telemetry to confirm which dependencies are actually live",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A missed live consumer turns a 'safe' retirement into an outage — the graph must flag coverage gaps honestly",
          "Stale dependency data is worse than none; the graph's value is in being continuously refreshed",
        ],
        metricsMoved: [
          "decommission_rate",
          "integration_point_to_point_pct",
          "application_count",
        ],
      },
      {
        key: "ai_api_integration_modernization",
        name: "AI-assisted API & integration modernization",
        valueMechanism:
          "Use AI to discover existing point-to-point integrations, draft API " +
          "specifications and adapters that wrap legacy capability, and propose " +
          "an integration-layer target — accelerating the decoupling that makes " +
          "the estate composable and modernizable incrementally. Value shows up as " +
          "rising managed-API coverage and falling point-to-point integration that " +
          "unblocks retirement; generated specs and adapters are reviewed and tested, not shipped blind.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Integration inventory, existing interface contracts, and traffic patterns",
          "Managed-API-coverage and point-to-point baselines",
          "API governance standards (security, versioning, contracts) to conform to",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated API specs and adapters must meet security and contract governance before exposure",
          "Wrapping legacy in APIs without a retirement plan can entrench the legacy — pair with disposition, not as an end in itself",
        ],
        metricsMoved: [
          "apps_with_apis_pct",
          "integration_point_to_point_pct",
          "modernization_on_time_pct",
        ],
      },
      {
        key: "ai_dxp_experience_layer",
        name: "AI-augmented digital experience platform (DXP) layer",
        valueMechanism:
          "Stand a composable digital experience platform — with AI for content, " +
          "search, and personalization — over modernized capabilities and APIs, so " +
          "a coherent customer/employee experience can be delivered without " +
          "rewriting every back-end system at once. Value is faster delivery of " +
          "experience and higher capability fit on a strangler-fig path; it depends " +
          "on the underlying API/integration modernization actually existing, not a veneer over a brittle estate.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Modernized, API-exposed back-end capabilities to compose over",
          "Content, customer/employee, and experience-performance data",
          "Business-capability coverage baseline for the experiences being served",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A DXP over un-modernized back ends is a veneer that masks, not fixes, legacy debt",
          "AI personalization/content needs governance for accuracy, brand, and privacy",
        ],
        metricsMoved: [
          "apps_with_apis_pct",
          "business_capability_coverage",
          "maintenance_pct_of_app_budget",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "application_rationalization_engine",
        name: "Application rationalization engine (TIME/6R disposition)",
        description:
          "A standing capability that maintains a reconciled application " +
          "inventory, joins it to a business-capability model and per-application " +
          "TCO, and produces TIME (Tolerate/Invest/Migrate/Eliminate) and 6R " +
          "(retire/retain/re-host/re-platform/re-factor/re-purchase) dispositions " +
          "ranked by value-versus-cost — the decision spine for IT investment and " +
          "the source of the rationalization business case. It privileges retire " +
          "and consolidate as the durable-savings path, with rewrites the exception.",
        boundary:
          "Owns the inventory, the disposition methodology, the value/TCO ranking, " +
          "and the rationalization roadmap; does not own the underlying " +
          "infrastructure migration, the SDLC delivery of any rewrite, or the " +
          "commercial sourcing of replacement software (separate functions).",
        humanAccountabilityPoint:
          "Head of Enterprise Architecture / IT Investment (with the application portfolio owner and Finance/TBM)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "strangler_fig_modernization",
        name: "Strangler-fig incremental modernization",
        description:
          "An incremental modernization pattern that wraps a legacy system behind " +
          "an interface/façade and migrates capability slice by slice into modern " +
          "services, retiring the legacy piece by piece — so value lands " +
          "continuously and the system is never rewritten in one big-bang cutover. " +
          "It is the explicit antidote to big-bang rewrite failure: each slice is " +
          "independently delivered, tested, and reversible.",
        boundary:
          "Owns the migration approach, the façade/seam, and the slice sequencing " +
          "for a given system; does not own the disposition decision (whether to " +
          "modernize at all) or the platform the slices land on (separate patterns).",
        humanAccountabilityPoint:
          "Application/domain architect accountable for the system's modernization roadmap",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "api_integration_layer",
        name: "Managed API & integration layer (decoupling)",
        description:
          "An API-management and integration platform that replaces point-to-point " +
          "links with governed, documented, observable APIs and an integration " +
          "layer — making the estate composable, dependencies visible, and " +
          "retirements safe. It is the precondition for incremental modernization " +
          "and for safely turning systems off, exposing who consumes what before anything is changed.",
        boundary:
          "Owns the API gateway, integration platform, contracts, and integration " +
          "governance; does not own the applications behind the APIs or their " +
          "disposition (it enables those decisions, it does not make them).",
        humanAccountabilityPoint:
          "Head of Integration / API platform owner (with enterprise architecture)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "technical_debt_governance",
        name: "Technical-debt governance (recurring-tax model)",
        description:
          "A standing operating model that treats technical debt as a recurring " +
          "tax: a continuous debt budget/allocation, architectural guardrails and " +
          "fitness functions that hold the rate of NEW debt, debt visibility in " +
          "every application's health, and prioritized paydown tied to business " +
          "risk — so debt is managed continuously rather than through erodible one-off campaigns.",
        boundary:
          "Owns the debt-management policy, allocation, and guardrails across the " +
          "estate; does not own any single remediation's delivery or the " +
          "disposition decision for a debt-laden application (which may be retire, not remediate).",
        humanAccountabilityPoint:
          "Head of Enterprise Architecture / engineering leadership accountable for estate health",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "decommission_realization_factory",
        name: "Decommission realization factory",
        description:
          "An operational capability that takes 'decided to retire' applications " +
          "all the way to off — data archival/migration, consumer cutover using " +
          "the dependency graph, contract/license termination, and verified spend " +
          "stop — so the rationalization savings are actually realized rather than " +
          "stranded in years of 'being retired' status. It closes the loop between disposition decision and booked savings.",
        boundary:
          "Owns the end-to-end retirement execution and the verified spend-stop; " +
          "does not own the decision to retire (that comes from the rationalization " +
          "engine) or the replacement capability (separate delivery).",
        humanAccountabilityPoint:
          "Application portfolio owner / decommissioning lead accountable for verified retirement and spend stop",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Application-modernization value is realized as REMOVED cost and FREED " +
        "change capacity — not as a 'modern stack'. The honest chain: a " +
        "trustworthy inventory plus capability and TCO mapping surfaces redundant, " +
        "end-of-life, and high-cost/low-value applications; TIME/6R disposition " +
        "ranks them; the durable savings come from RETIRING and CONSOLIDATING " +
        "(license, support, infrastructure, and integration cost removed at once), " +
        "which shifts budget from run to change. Re-platform and re-factor add " +
        "value only where capability is worth keeping and the modernized system " +
        "actually lowers run cost and change failure rate — and only via " +
        "incremental strangler-fig paths, because big-bang rewrites usually " +
        "overrun and re-create the old complexity. Every step is haircut: realized " +
        "savings depend on actually decommissioning (the hardest step), " +
        "integration lock-in slows retirement, rewrite overrun erodes the case, " +
        "and technical debt is a recurring tax that returns unless the rate of new " +
        "debt is held. The business case must book savings only as systems turned " +
        "OFF with spend verified stopped — never as a velocity claim, a 'modern' " +
        "label, or a disposition rating that no one has executed.",
      dominantHaircutFactors: [
        {
          factor: "Decommission realization gap (decided ≠ turned off)",
          rationale:
            "The largest savings come from retiring applications, and that is the " +
            "step that most often does not happen — systems linger in " +
            "'being retired' status for years and their spend never stops, so " +
            "much of the booked saving is never realized.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Decided-to-retire to actually-off-and-spend-stopped drop-off across rationalization programs",
            label: "planning-range",
          },
        },
        {
          factor: "Integration lock-in / dependency drag",
          rationale:
            "Dense point-to-point integration makes retirement and consolidation " +
            "slow and risky; unknown consumers block cutover, stretching timelines " +
            "and eroding the savings the case assumed.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Schedule and scope drag on retirements blocked by hidden point-to-point dependencies",
            label: "planning-range",
          },
        },
        {
          factor: "Rewrite / big-bang overrun give-back",
          rationale:
            "Where modernization is scoped as a large rewrite, overrun and " +
            "parallel-running the legacy system add cost before any benefit lands, " +
            "and re-created accidental complexity gives back part of the promised gain.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Cost/benefit give-back on large monolithic rewrites versus their original business case",
            label: "planning-range",
          },
        },
        {
          factor: "Recurring technical-debt tax",
          rationale:
            "A remediation that lowers the debt ratio once but does not change the " +
            "rate of new debt sees the gain erode as debt re-accrues — the saving " +
            "is temporary unless governance holds the rate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Erosion of one-off debt-remediation gains where the rate of new debt is unchanged",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Run-cost reduction from rationalization (retire + consolidate)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Application run-cost reduction realized by retiring and consolidating redundant/EOL applications, net of decommission give-back",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in application run cost (license + infra + support) with verified decommissioning",
        },
        {
          lever: "Run-to-change budget shift",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Share of application budget shifted from run to change as estate sprawl and debt are reduced",
            label: "planning-range",
          },
          measuredAs:
            "Reduction in maintenance_pct_of_app_budget reinvested into new capability",
        },
        {
          lever: "Modernization delivery reliability uplift (incremental vs big-bang)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Improvement in modernization on-time delivery from strangler-fig incremental paths versus big-bang rewrites",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in modernization_on_time_pct at held-or-improved change failure rate",
        },
      ],
      timeToValueBand:
        "Inventory reconciliation and TIME/6R disposition: 1-2 quarters to a " +
        "trustworthy estate view and a ranked rationalization backlog. First " +
        "retirements and consolidations of clearly redundant/EOL applications: " +
        "2-4 quarters to realized run-cost reduction (gated by decommissioning " +
        "execution and integration lock-in). Re-platform/re-factor of retained " +
        "systems and API/integration decoupling: 3-6+ quarters per strangler-fig " +
        "wave. Net run-to-change budget shift and a held technical-debt rate: " +
        "multi-year, as the program sustains decommissioning faster than additions.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Application portfolio management (APM) / CMDB",
          role: "Source of truth for the application inventory, ownership, lifecycle status, and technology stack.",
          examples: ["ServiceNow APM/CMDB", "LeanIX", "Mega HOPEX", "Bizzdesign", "Ardoq"],
        },
        {
          name: "IT financial management / TBM platform",
          role: "Where per-application TCO and run-vs-change cost are modeled — the cost side of disposition.",
          examples: ["Apptio", "ServiceNow ITFM", "Cloudability / Tower TBM model"],
        },
        {
          name: "API management & integration platform",
          role: "Catalog of managed APIs and integrations — the source for API coverage and decoupling state.",
          examples: ["MuleSoft", "Apigee", "Kong", "Boomi", "Azure API Management"],
        },
        {
          name: "Code-quality & static-analysis platform",
          role: "Technical-debt, code-health, and complexity signals per application, trended over time.",
          examples: ["SonarQube", "CAST Highlight", "CodeScene"],
        },
        {
          name: "Business-capability model / enterprise architecture repository",
          role: "The capability map applications are scored against — the value side of disposition.",
          examples: ["Enterprise-architecture capability model in LeanIX/Mega/Ardoq", "BIZBOK-based capability map"],
        },
      ],
      roles: [
        {
          title: "CIO / Head of IT Investment",
          accountability:
            "The application-investment portfolio: where modernization and rationalization money goes and the run-to-change balance.",
        },
        {
          title: "Head of Enterprise Architecture",
          accountability:
            "The disposition methodology, capability mapping, target architecture, and technical-debt governance across the estate.",
        },
        {
          title: "Application portfolio owner",
          accountability:
            "The reconciled inventory, per-application lifecycle and TCO, and realized decommissioning (turned off, spend stopped).",
        },
        {
          title: "Application / domain architect",
          accountability:
            "The modernization approach for a system — strangler-fig sequencing, seams, and re-platform/re-factor design.",
        },
        {
          title: "Head of Integration / API platform owner",
          accountability:
            "The managed API/integration layer, decoupling, and dependency visibility that make retirement safe.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Software IP, licensing & open-source compliance",
          relevance:
            "Re-platforming, re-purchasing, and AI-assisted transformation raise license-transfer, OSS-license, and provenance questions that constrain disposition.",
        },
        {
          name: "Data privacy & residency on retirement (GDPR/CCPA, records retention)",
          relevance:
            "Decommissioning requires lawful data archival, migration, or destruction and may trigger retention obligations before a system can be turned off.",
        },
        {
          name: "Security & vulnerability obligations for end-of-life technology",
          relevance:
            "Unsupported, unpatchable applications create audit and security-compliance exposure that often forces the modernization decision.",
        },
        {
          name: "Industry-specific system-of-record and audit-trail rules",
          relevance:
            "Regulated records and audit-trail requirements constrain whether and how a legacy system of record can be retired or replaced.",
        },
      ],
      canonicalTerms: [
        {
          term: "TIME framework",
          definition:
            "Application disposition model — Tolerate, Invest, Migrate, Eliminate — scoring each application on business value against technical fit/cost to set its direction.",
        },
        {
          term: "6R / Rs of modernization",
          definition:
            "Disposition options for a system — retire, retain, re-host (lift-and-shift), re-platform, re-factor/re-architect, re-purchase (replace with SaaS) — chosen per application, not estate-wide.",
        },
        {
          term: "Strangler-fig pattern",
          definition:
            "Incremental modernization that wraps a legacy system and migrates capability slice by slice, retiring the legacy piece by piece, instead of a big-bang rewrite.",
        },
        {
          term: "Technical debt",
          definition:
            "The accumulated cost of past shortcuts and aging technology that slows change and raises run cost — a recurring tax that re-accrues unless its rate is governed, not a one-time fix.",
        },
        {
          term: "Application rationalization",
          definition:
            "Reducing the application estate by retiring, consolidating, and re-purchasing redundant/low-value/EOL applications — the durable source of modernization savings.",
        },
        {
          term: "Run vs change (keep-the-lights-on vs grow-and-transform)",
          definition:
            "The split of the application budget between keeping existing systems running and funding new capability; legacy sprawl traps budget in run.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Application estate size and redundancy",
        authoritativeSource:
          "Reconciled APM/CMDB inventory cross-checked against application spend, SSO/usage logs, and a business-capability map",
        whatGoodEvidenceLooksLike:
          "A de-duplicated inventory with owner, TCO, capability, lifecycle status, and dependencies per application, with overlap identified against the capability model.",
        weakEvidenceToReject:
          "An application count from a single stale source, a spreadsheet that disagrees with spend, or a redundancy claim with no capability mapping behind it.",
      },
      {
        claim: "Rationalization savings (run cost removed)",
        authoritativeSource:
          "Per-application TCO model (license + infra + support + labor) with verified decommissioning and spend-stop records",
        whatGoodEvidenceLooksLike:
          "Savings tied to specific applications turned OFF with their spend verified stopped, net of decommission give-back and integration drag.",
        weakEvidenceToReject:
          "A savings figure from disposition ratings or roadmaps alone, with no decommissioning executed and no spend actually falling.",
      },
      {
        claim: "Modernization delivery reliability and quality",
        authoritativeSource:
          "Work-package committed-vs-actual delivery dates and change/incident records segmented by modernization status",
        whatGoodEvidenceLooksLike:
          "On-time delivery and change failure rate measured per modernization wave, with modernized systems shown lower than the legacy they replaced.",
        weakEvidenceToReject:
          "A 'modernized' claim with no on-time or change-failure measurement, or a big-bang program reporting progress with no delivered slices.",
      },
      {
        claim: "Technical debt and integration state",
        authoritativeSource:
          "Static-analysis debt trend per application plus the integration/dependency inventory (point-to-point vs managed-API share)",
        whatGoodEvidenceLooksLike:
          "Technical debt ratio trended (rate of change, not a snapshot) and a dependency graph showing managed-API coverage and point-to-point share with consumers identified.",
        weakEvidenceToReject:
          "A single debt-ratio snapshot presented as fixed, or an integration-modernization claim with no dependency visibility into who consumes each system.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you have a single reconciled application inventory — count, owner, TCO, business capability, and dependencies — that you trust enough to make retire/consolidate decisions on?",
      "Of your modernization spend, how much retires or consolidates applications versus re-coding systems you intend to keep, and what is your net decommission rate?",
      "Is your disposition decision grounded in business-capability value AND TCO together (TIME/6R), or is it cost- or age-driven?",
      "Are your large modernizations structured as incremental strangler-fig slices, or as big-bang cutovers — and how have the big-bang programs tracked to plan?",
      "Is technical debt managed as a recurring tax (standing allocation + guardrails that hold the rate of new debt), or as one-off campaigns whose gains erode?",
      "How much of your integration is point-to-point versus a managed API/integration layer, and can you see who consumes an application before you retire it?",
      "What share of your application budget is trapped in run versus change, and which rationalization moves would durably shift that ratio?",
      "Of the applications you have decided to retire, how many have actually been turned off with spend verified stopped — and who is accountable for realizing it?",
    ],
    maturitySignals: [
      "A single reconciled application inventory exists, joined to capability and TCO, and is trusted for investment decisions.",
      "Disposition uses TIME/6R grounded in business-capability value AND cost, privileging retire/consolidate over rewrites.",
      "Large modernizations run as incremental strangler-fig slices with continuous, reversible delivery — not big-bang cutovers.",
      "Technical debt is governed as a recurring tax: standing allocation, guardrails/fitness functions, and debt visible in app health.",
      "Decommissioning is actually realized — applications reach 'off' with spend verified stopped, and net decommission rate is positive.",
    ],
    redFlags: [
      "The modernization roadmap is a list of rewrites with little or no decommission/consolidation track — and no TIME/6R disposition.",
      "Large single-cutover rewrites with low on-time delivery, the legacy system still running past its planned retirement.",
      "Technical debt remediated as one-off campaigns with the debt ratio rebounding and no budget or guardrails holding the rate.",
      "No trustworthy inventory: counts disagree across spend, SSO, and CMDB, and retirements keep breaking unseen consumers.",
      "Applications stuck in 'being retired' for years, net decommission rate near zero, and spend not falling despite a rationalization program.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Application portfolio management / EA tools (LeanIX, ServiceNow APM, Mega, Ardoq)",
        category: "Inventory, capability mapping, and TIME/6R disposition tooling",
        switchingCost:
          "Moderate-to-high — once the inventory, capability model, and disposition history live in the tool, the curated estate model is the asset and migration is a re-modeling effort, not a flip.",
        renewalDynamics:
          "Per-application or per-seat subscription; the negotiation is scoping to the estate actually managed and proving the tool drives realized decommissioning, not shelfware modeling.",
      },
      {
        vendorName: "IT financial management / TBM (Apptio, ServiceNow ITFM)",
        category: "Per-application TCO and run-vs-change cost modeling",
        switchingCost:
          "High — fused to the cost taxonomy, allocations, and financial data feeds; re-platforming the TBM model is a multi-quarter program, and the cost model underpins every disposition case.",
        renewalDynamics:
          "Enterprise platform agreement; value is in the maintained cost model — negotiate against the rationalization savings it actually surfaces and realizes.",
      },
      {
        vendorName: "API management & integration platforms (MuleSoft, Apigee, Boomi, Kong)",
        category: "Managed API and integration layer for decoupling",
        switchingCost:
          "High — integrations, contracts, and policies fuse to the platform; the decoupling estate built on it is sticky, so portability of contracts and specs matters at selection.",
        renewalDynamics:
          "Often capacity/throughput or core-based licensing that can balloon with integration volume; negotiate consumption transparency and avoid lock-in around proprietary connectors.",
      },
      {
        vendorName: "SI / modernization service partners and re-purchase SaaS vendors",
        category: "Re-platform/re-factor delivery services and replace-with-SaaS (re-purchase) targets",
        switchingCost:
          "Variable — SI engagement switching is moderate, but re-purchasing into a SaaS suite is high lock-in; the replacement system becomes the new system of record with its own exit cost.",
        renewalDynamics:
          "Fixed-bid or T&M for delivery; for re-purchase SaaS, watch multi-year ramp pricing and ensure the disposition case nets the new SaaS TCO against the retired legacy, not gross savings alone.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is twofold: the curated estate model itself (inventory + capability map + TCO in the APM/TBM tools) and the integration layer the applications are wired through. Re-purchasing legacy into a SaaS suite trades old lock-in for new — the disposition case must net the replacement's TCO and exit cost against the retired system, never book gross savings. The negotiating room is in scoping tools to the estate actually managed, contract/spec portability on the integration layer, and gating re-purchase commitments on a real capability-fit and net-TCO case.",
    negotiationLevers: [
      "Scope APM/TBM and integration licensing to the estate actually managed and to realized decommissioning, not gross app count (kills shelfware modeling spend)",
      "Net the replacement (re-purchase SaaS) TCO and exit cost against the retired legacy — negotiate on net, not gross, rationalization savings",
      "Contract and spec portability on the API/integration layer to avoid connector lock-in that re-creates point-to-point rigidity",
      "Gate SI modernization engagements with incremental strangler-fig milestones and on-time/change-failure graduation metrics before scaling",
      "Tie tool and service value to verified spend-stop on decommissioned applications, not to disposition ratings produced",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      estate_claim: [
        "reconciled APM/CMDB inventory",
        "cross-check against spend and SSO/usage",
        "capability mapping for redundancy claims",
      ],
      rationalization_savings_claim: [
        "per-application TCO model",
        "verified decommissioning and spend-stop records",
        "net of decommission give-back and integration drag",
      ],
      modernization_delivery_claim: [
        "work-package committed-vs-actual dates",
        "change failure rate segmented by modernization status",
        "delivered slices for incremental programs (not progress narrative)",
      ],
      technical_debt_claim: [
        "static-analysis debt trend (rate of change, not snapshot)",
        "evidence the rate of new debt is governed",
      ],
      value_projection: [
        "baseline metric (run cost, run/change ratio, decommission rate)",
        "benchmark planning-range",
        "explicit haircut factors (decommission realization, integration lock-in, rewrite overrun, recurring debt)",
      ],
    },
    citationStandard:
      "Estate and savings claims cite the reconciled inventory and TCO source, " +
      "the period, and the application scope, and must reconcile to spend. " +
      "Rationalization savings are booked only against applications verified " +
      "turned OFF with spend stopped — never against disposition ratings or " +
      "roadmaps alone. Modernization claims cite committed-vs-actual delivery and " +
      "the paired change failure rate (modernized vs legacy). Technical-debt " +
      "claims cite a TREND, not a snapshot. Value projections cite a baseline " +
      "plus a labelled planning range and the haircut factors applied " +
      "(decommission realization, integration lock-in, rewrite overrun, recurring " +
      "debt) — never a single asserted ROI, never a 'modern stack' or developer- " +
      "velocity claim presented as the modernization business case.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no reconciled inventory — frame estate size, redundancy, and savings as an industry planning range, not their measured number.",
      "A savings figure is requested from disposition ratings alone — model the opportunity but flag that nothing is realized until applications are turned off and spend stops.",
      "A modernization is scoped as a big-bang rewrite — hedge the business case against overrun and re-created complexity, and surface the strangler-fig alternative.",
      "A technical-debt remediation is presented as a one-time fix — hedge any durable-savings claim until the rate of new debt is shown to be governed.",
      "Vendor-reported modernization ROI or savings are cited — mark as vendor claims pending tenant validation against realized decommissioning and TCO.",
    ],
    inferenceLanguage: [
      "Across large-enterprise application estates, redundancy and end-of-life tails typically run...",
      "Without your reconciled inventory and TCO, the industry pattern suggests rationalization run-cost savings of... net of the decommission-realization gap",
      "Peer estates at this scale commonly trap... of the application budget in run before rationalization",
      "This is a modeled rationalization opportunity, not realized savings — savings book only when applications are turned off and spend stops, which your data hasn't yet shown.",
    ],
    flagWithoutEvidence: [
      "A specific dollar saving for this tenant's modernization or rationalization program",
      "This tenant's actual application count, redundancy, run/change ratio, or per-application TCO",
      "A claim that a decided-to-retire application here has actually been turned off with spend stopped",
      "A specific ROI or payback for this tenant's re-platform/re-factor program",
      "A claim that technical debt here has been durably reduced (rate of new debt held), versus dipped once",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "application portfolio disposition map (TIME/6R: value vs cost)",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Applications plotted on business-capability value against TCO, colored by TIME/6R disposition, so retire/consolidate candidates and invest-worthy systems are visible at once.",
    },
    {
      questionPattern: "rationalization savings bridge (gross opportunity to realized, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross rationalization opportunity to realized run-cost saving, showing each haircut (decommission realization, integration lock-in, rewrite overrun, recurring debt).",
    },
    {
      questionPattern: "which haircut bites hardest / savings sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of decommission realization, integration lock-in, rewrite overrun, and recurring debt on realized rationalization savings.",
    },
    {
      questionPattern: "application cost stack / where the run cost lives",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Per-application or per-capability run cost stacked by license, infrastructure, support, and integration, ranked to surface the high-cost/low-value retirement targets.",
    },
    {
      questionPattern: "application modernization scorecard",
      exhibitKind: "table",
      note: "Application count, % EOL/unsupported, redundancy %, technical debt ratio (trend), maintenance % of budget, % apps with APIs, on-time %, change failure rate, decommission rate, capability coverage vs planning ranges.",
    },
    {
      questionPattern: "estate dependency / integration map (who consumes what)",
      exhibitKind: "graph",
      note: "Dependency graph of applications and integrations showing managed-API vs point-to-point links and consumers, so retirements can be sequenced safely.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A reconciled, trusted inventory joined to business-capability value and per-application TCO before any disposition is set",
      "Disposition privileges retire and consolidate (durable savings) over rewrites, decided on value AND cost, not age alone",
      "Large modernizations run as incremental strangler-fig slices with continuous, reversible delivery — never big-bang cutovers",
      "Decommissioning is actually realized — a factory that takes systems to off with spend verified stopped, not just rated",
      "Technical debt is governed as a recurring tax (standing allocation + guardrails) and integration is decoupled to a managed API layer",
    ],
    failureDrivers: [
      "The rewrite reflex — modernization scoped as big-bang rebuilds while redundant/EOL applications are never retired",
      "Big-bang cutovers that overrun, re-create the old complexity, and force years of parallel-running the legacy system",
      "Disposition ratings and roadmaps with no realized decommissioning — savings booked but never landed",
      "Point-to-point integration lock-in and no trustworthy inventory, so retirements break unseen consumers and stall",
      "Technical debt treated as a one-off campaign, so the debt ratio dips and rebounds and the recurring tax returns",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Inventory reconciliation and TIME/6R disposition adopt first and fastest " +
      "where APM/TBM tooling and a capability model exist — the estate can be " +
      "sized and triaged within a quarter or two. Retiring and consolidating " +
      "clearly redundant/EOL applications follows, gated less by analysis than by " +
      "the organizational will and integration visibility to actually turn systems " +
      "off. Re-platform/re-factor and API/integration decoupling adopt per " +
      "strangler-fig wave as seams and test coverage mature. The decisive factor " +
      "is decommissioning discipline and executive backing to remove systems and " +
      "absorb the consolidation disruption — without it, the program produces " +
      "ratings and roadmaps that never become realized savings.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is better than in diffuse digital-transformation programs " +
      "because rationalization savings are CONCRETE and verifiable — a retired " +
      "application's license, infrastructure, and support spend is a real number " +
      "that stops. But it is only MEDIUM, not high: the savings are realized only " +
      "if decommissioning actually completes (the hardest, most-skipped step), " +
      "integration lock-in and rewrite overrun erode the case, the re-purchase " +
      "replacement carries its own TCO that must be netted, and modernization " +
      "benefits beyond cost (agility, risk reduction) are harder to attribute. The " +
      "discipline that earns clarity is booking savings only against systems " +
      "verified turned OFF with spend stopped, netting replacement TCO, and " +
      "refusing to count a 'modern stack' or developer velocity as the case.",
  },

  regulatoryFrame: {
    name: "Application modernization governance: IP/licensing, data-on-retirement, EOL security, and audit-trail constraints",
    relevance:
      "The dominant cross-cutting frame for application modernization and " +
      "rationalization: re-platforming, re-purchasing, and AI-assisted " +
      "transformation raise software-IP, license-transfer, and open-source " +
      "provenance questions; decommissioning requires lawful data archival, " +
      "migration, or destruction and may trigger records-retention obligations " +
      "before a system can be turned off; end-of-life unsupported technology " +
      "creates security and audit exposure that often forces the modernization " +
      "decision; and regulated systems of record carry audit-trail constraints " +
      "that limit whether and how legacy can be retired or replaced (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
