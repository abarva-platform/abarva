// Consilium expert — IT Outsourcing & Managed Services (cross-cutting).
//
// W3 wave2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting,
// cross-industry expert spanning the SOURCING OF IT SERVICES: application
// management services (AMS), infrastructure & cloud managed services, offshore/
// nearshore delivery, MSA/SOW/SLA design, vendor selection & RFP, transition,
// run-time governance, and EXIT / repatriation. Directly supports the IT
// SOURCING product module (AMS / renewal sourcing events): it owns the buying
// and contracting of a managed-service relationship and the governance of it
// over its life — through to the way out.
//
// SCOPE FENCE — this is IT SERVICES SOURCING, not general procurement and not
// run-IT. It is DISTINCT from Procurement & Strategic Sourcing (general category
// management and the source-to-contract layer across ALL spend categories — this
// expert is the deep specialist for the IT-services category specifically: the
// service-level / coverage model, the offshore delivery model, transition, and
// exit). It is DISTINCT from IT Operations / ITSM (running the IT estate day to
// day — incident/problem/change, service desk, observability), which is what is
// being OUTSOURCED here, run by the provider. This expert owns WHICH services to
// outsource, TO WHOM, under WHAT SLAs/XLAs and commercial model, HOW to
// transition in, HOW to govern, and HOW to get out — not the category strategy
// for the whole enterprise and not the ticket-by-ticket operation.
//
// CORE DOCTRINE — SERVICE-LEVEL/GOVERNANCE MATURITY AND SWITCHING/EXIT COST ARE
// THE BINDING TRUTHS. Three honest truths gate every managed-services case.
// (1) SLA attainment is necessary but not sufficient: providers can be GREEN on
// every SLA while business outcomes degrade ("watermelon" SLAs — green outside,
// red inside) — so XLA / outcome attainment and the maturity of the retained
// governance function, not raw SLA %, is what actually protects value.
// (2) OFFSHORE LABOR ARBITRAGE CARRIES A QUALITY / COORDINATION TAX: the blended
// rate looks like the saving, but knowledge ramp, attrition, rework, time-zone
// coordination, and a thicker retained-management layer eat a material share of
// the headline arbitrage — the saving is the arbitrage NET of the coordination
// tax, never the gross rate delta. (3) EXIT / LOCK-IN IS THE HIDDEN COST: the
// real switching cost is the transition-out — knowledge that lives in the
// provider's heads, undocumented run-books, tooling and IP entanglement, and the
// data/asset extraction — and a contract signed without exit rights, a priced
// exit/reverse-transition clause, and retained knowledge is a contract that
// cannot be left. So value is sized on XLA/outcome attainment and arbitrage NET
// of the coordination tax, with the exit/lock-in cost made explicit — never on
// a green SLA dashboard or a gross blended-rate saving.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const itOutsourcingManagedServicesExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.it-outsourcing-managed-services",
    expertName: "IT Outsourcing & Managed Services Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "it-outsourcing-managed-services",
    scopeNote:
      "Cross-cutting, cross-industry expert for the SOURCING OF IT SERVICES: " +
      "application management services (AMS), infrastructure & cloud managed " +
      "services, offshore/nearshore delivery, MSA/SOW/SLA design, vendor " +
      "selection & RFP, transition, run-time governance, and EXIT / " +
      "repatriation. Owns WHICH IT services to outsource, TO WHOM, under WHAT " +
      "SLAs/XLAs and commercial model, HOW to transition in, HOW to govern the " +
      "relationship, and HOW to get out. Directly supports the IT SOURCING " +
      "product module (AMS / renewal sourcing events). CORE DOCTRINE: service-" +
      "level/governance maturity and switching/exit cost are the binding truths " +
      "— SLA-green is not outcome-green (watermelon SLAs), offshore labor " +
      "arbitrage carries a quality/coordination tax, and exit/lock-in is the " +
      "hidden cost, so value is sized on XLA/outcome attainment and arbitrage " +
      "NET of the coordination tax with the exit cost made explicit. DISTINCT " +
      "FROM Procurement & Strategic Sourcing (general category management / " +
      "source-to-contract across all spend — this is the deep IT-services-" +
      "category specialist) and from IT Operations / ITSM (running the estate " +
      "day to day, which is what is being outsourced here) — those are separate " +
      "experts; this one owns the IT-services sourcing relationship across its " +
      "life, through to exit.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "managed_services_cost_pct_it_budget",
        name: "Managed-services cost % of IT budget",
        definition:
          "Spend on outsourced/managed IT services (AMS, infrastructure & cloud " +
          "managed services, service desk, SI run) as a share of total IT " +
          "budget — the size of the outsourced footprint.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 25,
          high: 60,
          basis:
            "Enterprise IT-outsourcing share-of-budget ranges; the right level is " +
            "strategy-dependent (insourced-core vs outsourced-run), so this is a " +
            "context band, not a target — neither very low nor very high is " +
            "inherently good",
          label: "planning-range",
        },
        dataSource:
          "IT financial-management / ITFM system and the GL: managed-service " +
          "contract spend over total IT opex+capex",
        whyItMatters:
          "Frames the dependency on third parties and the size of the value and " +
          "risk at stake. Read directionally with strategy — a high share is " +
          "fine if governance and exit optionality are mature, and dangerous if " +
          "they are not.",
      },
      {
        key: "sla_attainment_pct",
        name: "SLA attainment %",
        definition:
          "Share of contracted service-level targets (availability, resolution " +
          "time, response time) met in the period, across the managed-service " +
          "towers.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.5,
          basis:
            "Managed-services SLA-attainment ranges; mature providers run 98-" +
            "99.5% against contracted SLAs, but attainment near 100% with poor " +
            "business outcomes is the watermelon-SLA signal, not success",
          label: "planning-range",
        },
        dataSource:
          "Provider ITSM/monitoring tooling and the governance scorecard, " +
          "ideally validated against the retained-organization's own telemetry",
        whyItMatters:
          "The contracted floor — necessary but NOT sufficient. High SLA " +
          "attainment with degrading business outcomes is the watermelon-SLA " +
          "trap, so it must always be read together with XLA / outcome " +
          "attainment, not in isolation.",
      },
      {
        key: "xla_attainment_pct",
        name: "XLA / outcome attainment %",
        definition:
          "Share of experience-level / business-outcome targets met — end-user " +
          "experience, business-process health, satisfaction — the outcomes the " +
          "service exists to protect, beyond the technical SLA.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis:
            "Emerging XLA / experience-level benchmarks; outcome attainment " +
            "typically runs well below raw SLA attainment, exposing the gap the " +
            "watermelon-SLA hides",
          label: "planning-range",
        },
        dataSource:
          "Experience-level monitoring (DEX tooling), business-process KPIs, and " +
          "end-user satisfaction surveys reconciled to the governance scorecard",
        whyItMatters:
          "THE binding outcome truth — the metric that catches a provider GREEN " +
          "on SLAs while the business degrades. XLA attainment, not SLA %, is " +
          "what a mature governance function protects value against.",
      },
      {
        key: "offshore_nearshore_mix_pct",
        name: "Offshore / nearshore mix %",
        definition:
          "Share of delivery FTEs (or effort) staffed from offshore/nearshore " +
          "locations versus onshore — the labor-arbitrage posture of the " +
          "engagement.",
        unit: "% offshore+nearshore of delivery FTEs",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "AMS / managed-services delivery-mix ranges; mature global-delivery " +
            "engagements run 70-85% offshore/nearshore, but higher mix raises the " +
            "coordination tax and knowledge-continuity risk — so it is a band, " +
            "not a maximize",
          label: "planning-range",
        },
        dataSource:
          "Provider staffing / resource-management reports and the rate-card by " +
          "location tier in the SOW",
        whyItMatters:
          "The lever behind the headline saving — and the source of the " +
          "coordination tax. A higher offshore mix lowers blended rate but " +
          "raises time-zone coordination, knowledge-ramp, and retained-" +
          "management load, so the net saving is far smaller than the gross rate " +
          "delta implies.",
      },
      {
        key: "blended_rate_vs_market",
        name: "Blended rate vs market index",
        definition:
          "The engagement's effective blended day/hour rate versus a current " +
          "market benchmark for the same skill/location mix — expressed as a " +
          "percentage above or below the market index.",
        unit: "% vs market index",
        directionOfGood: "lower",
        benchmarkRange: {
          low: -10,
          high: 10,
          basis:
            "Rate-benchmark ranges from market rate-card indices; competitive " +
            "engagements sit within roughly ±10% of the market index for the " +
            "skill/location mix, and rates drift above market between " +
            "benchmarking cycles",
          label: "planning-range",
        },
        dataSource:
          "Contracted rate card by role/location matched to an external rate-" +
          "benchmark index for the same mix and period",
        whyItMatters:
          "Whether the commercial deal is still market-competitive — rates that " +
          "looked good at signing drift above market as the engagement ages. The " +
          "primary renewal/benchmarking lever, but it must be read net of the " +
          "coordination tax, not as the headline saving.",
      },
      {
        key: "incident_throughput_per_fte",
        name: "Ticket / incident throughput per delivery FTE",
        definition:
          "Volume of tickets/incidents (or service units) resolved per delivery " +
          "FTE per period — the productivity of the delivery model, normalized " +
          "for complexity where possible.",
        unit: "tickets per FTE per month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 250,
          basis:
            "AMS / service-desk productivity ranges; varies widely by complexity " +
            "and automation maturity, so it is a directional band read against " +
            "the engagement's own trend and shift-left/automation progress",
          label: "planning-range",
        },
        dataSource:
          "Provider ITSM ticketing system, normalized by ticket type/complexity " +
          "and validated against the retained-organization's volumes",
        whyItMatters:
          "The throughput unit of the delivery model and the place automation " +
          "and shift-left should show up. Read with quality (rework, reopen) — " +
          "throughput bought by closing tickets prematurely is value destruction, " +
          "not productivity.",
      },
      {
        key: "transition_on_time_pct",
        name: "Transition on-time %",
        definition:
          "Share of transition (transition-in / knowledge-transfer / steady-" +
          "state cutover) milestones completed on or before plan during the " +
          "transition phase of a new engagement.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "Transition-program delivery ranges; well-governed transitions hit " +
            "85-95% of milestones on time, troubled ones slip below 70% and bleed " +
            "into steady state with unresolved knowledge gaps",
          label: "planning-range",
        },
        dataSource:
          "Transition program plan and governance reporting: milestone " +
          "completion against the baselined transition schedule",
        whyItMatters:
          "Transition is where value is made or lost — slipped knowledge " +
          "transfer and incomplete run-book capture surface as steady-state " +
          "instability and a permanent knowledge gap. On-time transition is a " +
          "leading indicator of whether the engagement will ever hit its case.",
      },
      {
        key: "knowledge_retention_at_transition_pct",
        name: "Knowledge retention at transition %",
        definition:
          "Share of critical application/system knowledge captured in durable, " +
          "provider-independent artifacts (run-books, architecture docs, " +
          "knowledge base) by the end of transition — versus knowledge that " +
          "lives only in incumbent or provider heads.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Knowledge-transfer completeness ranges; disciplined transitions " +
            "codify 80-90% of critical knowledge into durable artifacts, weak " +
            "ones leave the majority in people's heads — the root of future " +
            "lock-in",
          label: "planning-range",
        },
        dataSource:
          "Transition knowledge-transfer tracker and a knowledge-base / run-book " +
          "completeness audit against the application/system inventory",
        whyItMatters:
          "The direct driver of EXIT/lock-in risk — knowledge that lives only in " +
          "the provider's heads is the real switching cost. Low retention at " +
          "transition is how an enterprise becomes captive to a provider it can " +
          "never leave cleanly.",
      },
      {
        key: "vendor_concentration_pct",
        name: "Vendor concentration %",
        definition:
          "Share of managed-services spend (or of critical services) " +
          "concentrated with the single largest provider — the single-provider " +
          "dependency of the IT-services estate.",
        unit: "% of managed-services spend with top provider",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "IT-outsourcing concentration ranges; a managed multi-sourcing posture " +
            "keeps the top provider below ~50%, while single-prime estates run " +
            "65-70%+ and carry concentrated lock-in and resilience risk",
          label: "planning-range",
        },
        dataSource:
          "Managed-services contract and spend register: spend and critical-" +
          "service coverage by provider",
        whyItMatters:
          "Concentration is leverage AND lock-in — a single large prime can be " +
          "efficient but erodes negotiating power and resilience and raises exit " +
          "cost. It must be read with exit optionality, not maximized for " +
          "simplicity.",
      },
      {
        key: "change_request_leakage_pct",
        name: "Change-request / scope-leakage %",
        definition:
          "Share of delivered work billed as out-of-scope change requests / " +
          "T&M on top of the fixed-fee or per-unit baseline — the degree to " +
          "which the deal leaks into uncapped extras.",
        unit: "% of baseline value billed as CR/out-of-scope",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "AMS scope-management ranges; tightly-scoped engagements hold change/" +
            "out-of-scope billing in single digits to low-teens, loosely-defined " +
            "scope leaks 20-25%+ and erodes the business case",
          label: "planning-range",
        },
        dataSource:
          "Provider billing detail split fixed-fee/per-unit versus change-" +
          "request/T&M, reconciled to the SOW scope baseline",
        whyItMatters:
          "Where the negotiated price quietly erodes — a low headline rate with " +
          "high change-request leakage costs more than a higher rate with a tight " +
          "scope. Leakage is the AMS analogue of maverick spend and a direct " +
          "haircut to the realized saving.",
      },
      {
        key: "cost_to_serve_per_app",
        name: "Cost-to-serve per application",
        definition:
          "Fully-loaded annual managed-service cost to support one application " +
          "(or normalized application-complexity unit) — the unit economics of " +
          "the AMS estate.",
        unit: "USD per application per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 25000,
          high: 250000,
          basis:
            "AMS cost-to-serve ranges vary enormously by application complexity, " +
            "criticality, and change rate, so this is a wide directional band read " +
            "per application tier against the engagement's own trend",
          label: "planning-range",
        },
        dataSource:
          "Managed-service cost allocated to applications from the SOW/billing, " +
          "over the supported-application inventory with complexity tiers",
        whyItMatters:
          "The unit economics that expose where the AMS estate is expensive " +
          "relative to application value — the lever for rationalization, " +
          "re-tiering, and application-retirement decisions that shrink the " +
          "sourced footprint rather than just re-rating it.",
      },
      {
        key: "retained_org_ratio_pct",
        name: "Retained-organization ratio %",
        definition:
          "Size of the client-side retained governance / service-integration " +
          "organization as a share of the outsourced delivery headcount it " +
          "governs — the cost of running the relationship.",
        unit: "% retained FTE of governed delivery FTE",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 15,
          basis:
            "Retained-organization sizing ranges; well-run governance runs " +
            "roughly 8-12% of governed delivery headcount — too thin and " +
            "governance fails (watermelon SLAs go unchallenged), too thick and " +
            "the arbitrage saving is eaten",
          label: "planning-range",
        },
        dataSource:
          "Retained-organization org chart and cost versus provider delivery " +
          "headcount from staffing reports",
        whyItMatters:
          "The hidden cost of outsourcing AND the thing that makes it work. Too " +
          "thin a retained org cannot challenge watermelon SLAs or manage the " +
          "provider; too thick erodes the arbitrage saving — it is a band, and " +
          "under-investment here is the most common silent failure.",
      },
    ],

    painThemes: [
      {
        key: "watermelon_slas",
        name: "Watermelon SLAs — green outside, red inside",
        description:
          "The provider reports green against every contracted SLA while " +
          "business outcomes and end-user experience degrade: SLAs measure " +
          "technical surrogates (ticket close, availability of components) not " +
          "the outcome, and the retained org lacks the telemetry or maturity to " +
          "challenge the green dashboard.",
        detectionSignal:
          "Consistently high SLA attainment alongside rising business " +
          "complaints, escalations, and shadow workarounds; no XLA/experience " +
          "measures; SLAs defined on provider-controlled metrics with no " +
          "independent validation.",
        diagnosticQuestion:
          "Do you measure XLA / business-outcome attainment independently of the " +
          "provider's SLA dashboard, and is your retained org equipped to " +
          "challenge green SLAs when the business is degrading?",
      },
      {
        key: "arbitrage_coordination_tax",
        name: "Arbitrage eaten by the coordination tax",
        description:
          "The headline offshore saving is over-stated because the gross blended-" +
          "rate delta ignores the coordination tax: knowledge ramp, attrition " +
          "and re-ramp, rework from quality gaps, time-zone hand-off latency, and " +
          "a thicker retained-management layer — which together consume a large " +
          "share of the apparent arbitrage.",
        detectionSignal:
          "Business case built on gross blended-rate delta with no coordination-" +
          "tax adjustment; high offshore mix with high rework/reopen rates, long " +
          "knowledge ramp, and a growing retained org; saving never reconciles in " +
          "the GL.",
        diagnosticQuestion:
          "Is your offshore saving sized as the gross rate delta, or net of the " +
          "coordination tax — rework, attrition re-ramp, time-zone latency, and " +
          "the retained-management load it forces?",
      },
      {
        key: "exit_lock_in",
        name: "Exit / lock-in — the contract you cannot leave",
        description:
          "The real switching cost is the transition-out: critical knowledge " +
          "lives in the provider's heads, run-books are thin, tooling and IP are " +
          "entangled with the provider, and the contract has no priced exit / " +
          "reverse-transition clause — so the enterprise is captive at renewal " +
          "and pays the lock-in premium.",
        detectionSignal:
          "No priced exit/reverse-transition clause, low knowledge-retention at " +
          "transition, provider-owned tooling and run-books, no current exit plan " +
          "or second-source, renewal negotiated from a position of no walk-away.",
        diagnosticQuestion:
          "If you had to exit this provider in 12 months, do you have priced " +
          "exit rights, durable provider-independent knowledge, and a credible " +
          "second-source — or are you captive at renewal?",
      },
      {
        key: "transition_value_destruction",
        name: "Transition value destruction",
        description:
          "A rushed or under-governed transition leaves knowledge transfer " +
          "incomplete and run-books thin, so steady state opens with instability, " +
          "elevated incidents, and a permanent knowledge gap — the engagement " +
          "never reaches the productivity the business case assumed.",
        detectionSignal:
          "Transition milestones slipping, knowledge-transfer marked complete " +
          "without artifact audit, incident spike at cutover persisting into " +
          "steady state, key incumbents departed before knowledge was codified.",
        diagnosticQuestion:
          "Was knowledge transfer validated against durable run-book artifacts at " +
          "cutover, or signed off on attendance — and did steady state open " +
          "stable or with a persistent incident spike?",
      },
      {
        key: "scope_leakage_change_request",
        name: "Scope leakage & change-request creep",
        description:
          "Loosely-defined scope and an unclear baseline let the provider re-" +
          "bill routine work as out-of-scope change requests and T&M, so the " +
          "effective price climbs well above the headline rate and the business " +
          "case erodes invisibly after signing.",
        detectionSignal:
          "High change-request / out-of-scope billing %, frequent disputes over " +
          "what the SOW covers, no clean per-unit or fixed baseline, run-rate " +
          "drifting up without volume growth.",
        diagnosticQuestion:
          "What share of delivered work is billed as out-of-scope change requests " +
          "or T&M on top of the baseline, and is your SOW scope tight enough to " +
          "prevent re-billing routine work as extras?",
      },
      {
        key: "governance_under_investment",
        name: "Retained-governance under-investment",
        description:
          "The client cuts the retained organization too thin to capture the " +
          "saving, leaving no one with the capacity or telemetry to govern the " +
          "provider, validate SLAs, manage the relationship, or run service " +
          "integration across multiple providers — so problems compound " +
          "unchallenged.",
        detectionSignal:
          "Retained-org ratio well below the band, no independent telemetry, " +
          "service-integration gaps between providers, governance reduced to " +
          "accepting the provider's monthly deck, escalations handled reactively.",
        diagnosticQuestion:
          "Is your retained organization sized and equipped to govern the " +
          "provider independently — challenge SLAs, integrate multi-provider " +
          "services, and manage the relationship — or was it cut to book the " +
          "saving?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_service_desk_resolution",
        name: "AI service-desk deflection & assisted resolution",
        valueMechanism:
          "Virtual agents, retrieval over run-books and knowledge bases, and " +
          "copilot-assisted L1/L2 resolution deflect routine tickets and speed " +
          "the rest — raising throughput per FTE and shifting work left, so the " +
          "delivery model serves more volume per unit of labor and the offshore " +
          "headcount the case assumed shrinks.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical ticket / incident corpus with categories and resolutions",
          "Run-books, knowledge base, and resolution playbooks",
          "Live ITSM ticketing and entitlement/identity data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-resolution must not close tickets prematurely — guard reopen/rework rate",
          "Deflection that frustrates users degrades XLA even as SLA throughput rises",
          "Knowledge-base answers must be governed for currency and accuracy",
        ],
        metricsMoved: [
          "incident_throughput_per_fte",
          "xla_attainment_pct",
          "cost_to_serve_per_app",
        ],
      },
      {
        key: "ai_aiops_incident",
        name: "AIOps — anomaly detection & incident automation",
        valueMechanism:
          "Correlate events across monitoring tools, detect anomalies before " +
          "they breach, suppress noise, and auto-remediate known patterns — " +
          "cutting incident volume and mean-time-to-resolve so the provider hits " +
          "SLAs and protects business outcomes (XLA) with less manual effort, " +
          "lifting throughput and lowering cost-to-serve.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Telemetry, logs, and events across the monitored estate",
          "CMDB / service topology to correlate against",
          "Incident history and known-error / remediation playbooks",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-remediation in production needs guardrails and rollback, not blind action",
          "Noise suppression must not hide real degradation that hits business outcomes",
          "Models trained on provider data can entrench provider tooling lock-in",
        ],
        metricsMoved: [
          "sla_attainment_pct",
          "xla_attainment_pct",
          "incident_throughput_per_fte",
        ],
      },
      {
        key: "ai_ams_code_remediation",
        name: "AI application-management code & defect remediation",
        valueMechanism:
          "Copilots and code-aware agents triage application defects, localize " +
          "root cause, draft fixes and tests, and accelerate small enhancements " +
          "across the AMS portfolio — compressing the effort per change so the " +
          "same delivery team serves more applications, lowering cost-to-serve " +
          "and shrinking the offshore effort the case assumed.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Source code, repositories, and change history for the AMS portfolio",
          "Defect/incident backlog linked to the affected applications",
          "Application architecture docs and test suites",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "AI-drafted fixes require human review and approval before production deploy",
          "Quality must be guarded — accelerated change that raises rework destroys value",
          "Code and IP access must respect client ownership and confidentiality",
        ],
        metricsMoved: [
          "cost_to_serve_per_app",
          "incident_throughput_per_fte",
          "change_request_leakage_pct",
        ],
      },
      {
        key: "ai_knowledge_transition",
        name: "AI knowledge capture & transition acceleration",
        valueMechanism:
          "Mine tickets, code, configs, and SME interviews to auto-generate run-" +
          "books, architecture docs, and a structured knowledge base during " +
          "transition — codifying knowledge that would otherwise live in people's " +
          "heads, so transition completes faster AND knowledge becomes durable " +
          "and provider-independent, directly cutting future exit/lock-in risk.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Incident/ticket history, code, and configuration of the in-scope estate",
          "SME interview transcripts and existing fragmentary documentation",
          "Application/system inventory to scope completeness against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated knowledge must be SME-validated for accuracy before relied on",
          "Knowledge artifacts must be client-owned and provider-independent by design",
          "Completeness must be audited against the inventory, not assumed from volume",
        ],
        metricsMoved: [
          "knowledge_retention_at_transition_pct",
          "transition_on_time_pct",
        ],
      },
      {
        key: "ai_governance_sla_assurance",
        name: "AI governance, SLA/XLA assurance & spend intelligence",
        valueMechanism:
          "Give the retained org independent telemetry: reconcile provider SLA " +
          "claims against the client's own monitoring, surface watermelon-SLA " +
          "divergence between SLA and XLA, detect change-request/scope leakage in " +
          "billing, and benchmark rates — so a leaner retained team governs the " +
          "provider with evidence rather than accepting the monthly deck.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Independent client-side monitoring/telemetry and experience data",
          "Provider SLA/XLA reporting and the contract's service-level definitions",
          "Provider billing detail and the SOW scope baseline",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Assurance findings inform governance decisions, not automatic penalty posting",
          "Independent telemetry is essential — assurance over provider-only data is circular",
          "Leakage flags must distinguish legitimate scope change from re-billing",
        ],
        metricsMoved: [
          "sla_attainment_pct",
          "xla_attainment_pct",
          "change_request_leakage_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "retained_org_smo",
        name: "Retained organization & service-integration (SIAM) operating model",
        description:
          "A right-sized client-side retained organization that owns vendor " +
          "governance, service integration across multiple providers (SIAM), " +
          "independent SLA/XLA assurance, demand and architecture control, and " +
          "the commercial relationship — the platform that makes outsourcing " +
          "governable rather than a black box.",
        boundary:
          "Owns governance, integration, and assurance of the providers; does " +
          "NOT own the day-to-day delivery itself (that is the provider's) and " +
          "does not set enterprise-wide category strategy (that is procurement's).",
        humanAccountabilityPoint: "Head of Vendor Management / Service Integration (retained org)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "global_delivery_model",
        name: "Global delivery model (onshore/nearshore/offshore mix)",
        description:
          "A deliberately designed delivery-location and pyramid model — the " +
          "onshore/nearshore/offshore split, seniority pyramid, and follow-the-" +
          "sun hand-offs — engineered for the work's coordination intensity, so " +
          "labor arbitrage is captured NET of the coordination tax rather than " +
          "assumed from the gross rate delta.",
        boundary:
          "Owns the delivery-mix and pyramid design and the coordination model; " +
          "does not own the individual resourcing decisions (the provider's) or " +
          "the retained-org sizing (the SIAM pattern's).",
        humanAccountabilityPoint: "Engagement / Delivery Director (with retained-org sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "outcome_based_commercial_model",
        name: "Outcome / XLA-based commercial & SLA model",
        description:
          "A commercial construct that ties price and incentives to business " +
          "outcomes and experience levels (XLAs) — not only technical SLAs — " +
          "with a tight scope baseline, earn-back/penalty mechanics, and " +
          "gain-share on automation, so the provider is paid for outcomes and " +
          "watermelon SLAs and scope leakage are designed out at the table.",
        boundary:
          "Owns the SLA/XLA design, pricing construct, and incentive mechanics; " +
          "does not own the delivery execution or the spend-classification / " +
          "category strategy that procurement runs.",
        humanAccountabilityPoint: "Sourcing / Commercial Lead (with the retained org)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "exit_reverse_transition_plan",
        name: "Exit & reverse-transition plan (lock-in mitigation)",
        description:
          "A standing, priced exit capability built at contracting: durable " +
          "client-owned knowledge artifacts, client-owned or portable tooling, a " +
          "priced reverse-transition / exit-assistance clause, data and IP " +
          "extraction rights, and a credible second-source — so the enterprise " +
          "can leave or re-tender from a position of strength and the lock-in " +
          "premium is neutralized.",
        boundary:
          "Owns exit rights, knowledge durability, and second-source optionality; " +
          "does not own the running delivery — it is the insurance that makes the " +
          "running relationship negotiable and leavable.",
        humanAccountabilityPoint: "Head of Vendor Management / Sourcing (retained org)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Managed-services value is realized on linked levers, and the binding " +
        "truths gate every one. (1) LABOR ARBITRAGE — moving delivery to a " +
        "lower-cost offshore/nearshore mix — is the headline lever, but it must " +
        "be sized NET of the COORDINATION TAX: knowledge ramp, attrition re-ramp, " +
        "rework, time-zone latency, and a thicker retained-management layer eat a " +
        "material share of the gross rate delta, so the durable saving is the " +
        "arbitrage minus the tax, never the gross delta. (2) AUTOMATION & " +
        "AI-LED DELIVERY (service-desk deflection, AIOps, AMS code remediation) " +
        "compresses effort per unit and shrinks the headcount the case assumed — " +
        "the lever that increasingly dominates raw arbitrage. (3) SCOPE & " +
        "COMMERCIAL DISCIPLINE — a tight SOW baseline and outcome/XLA-based " +
        "pricing — converts the negotiated rate into a realized price by " +
        "stopping change-request leakage. But two truths haircut all of it: " +
        "SLA-green is not outcome-green (value is protected by XLA/outcome " +
        "attainment and retained-governance maturity, not a green dashboard), and " +
        "EXIT/LOCK-IN is the hidden cost (a relationship with no priced exit, no " +
        "durable knowledge, and no second-source pays a lock-in premium at every " +
        "renewal). So defensible value is sized on arbitrage NET of the " +
        "coordination tax and on automation, protected by XLA attainment and a " +
        "real retained org, with the exit/transition cost made explicit — never " +
        "on a gross blended-rate saving or a green SLA report.",
      dominantHaircutFactors: [
        {
          factor: "Offshore coordination tax (arbitrage erosion)",
          rationale:
            "The dominant haircut on the headline arbitrage: the gross blended-" +
            "rate delta is eroded by knowledge ramp, attrition and re-ramp, " +
            "rework from quality gaps, time-zone hand-off latency, and the " +
            "thicker retained-management layer a high offshore mix forces. Value " +
            "sized on the gross delta must be discounted to the net the delivery " +
            "model can actually sustain.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between gross blended-rate arbitrage and net realized " +
              "saving on offshore-heavy engagements once rework, re-ramp, and " +
              "retained-management load are counted",
            label: "planning-range",
          },
        },
        {
          factor: "Scope leakage & change-request creep",
          rationale:
            "Negotiated price leaks after signing when loosely-defined scope " +
            "lets routine work be re-billed as out-of-scope change requests and " +
            "T&M. The headline rate must be discounted by the change-request " +
            "leakage the scope discipline actually prevents.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Share of baseline value that leaks to out-of-scope CR/T&M billing " +
              "where the SOW scope baseline is loose",
            label: "planning-range",
          },
        },
        {
          factor: "Transition cost & ramp drag",
          rationale:
            "Value lags the case while transition runs and steady state ramps: " +
            "transition cost, dual-running, productivity dip at cutover, and the " +
            "time to reach assumed throughput all push realized value out and " +
            "down, especially where knowledge transfer is incomplete.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reduction in first-period realized value from transition cost, " +
              "dual-running, and the ramp to steady-state productivity",
            label: "planning-range",
          },
        },
        {
          factor: "Governance under-investment & outcome shortfall",
          rationale:
            "A retained org cut too thin to govern the provider lets watermelon " +
            "SLAs go unchallenged, scope leak, and outcomes degrade — so the " +
            "value the case assumed never materializes even when the headline " +
            "deal was good. The saving must be discounted by the governance " +
            "maturity that protects it.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Value erosion where the retained governance function was under-" +
              "invested and outcome/XLA attainment lagged contracted SLAs",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Gross labor arbitrage from offshore/nearshore mix",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gross blended-rate reduction from shifting delivery to an offshore/" +
              "nearshore mix versus an onshore baseline, before the coordination " +
              "tax is netted out",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in blended delivery rate from the location mix, " +
            "BEFORE the coordination-tax haircut (gross, not realized)",
        },
        {
          lever: "Automation / AI-led effort reduction",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Effort/headcount reduction from service-desk deflection, AIOps, " +
              "and AMS automation as the AI archetypes mature on the engagement",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in delivery effort/headcount per unit of service " +
            "from automation, net of quality/rework guardrails",
        },
        {
          lever: "Realization rate applied to gross arbitrage",
          range: {
            low: 0.5,
            high: 0.8,
            basis:
              "Share of gross arbitrage that survives the coordination tax on " +
              "well-governed engagements; offshore-heavy, weakly-governed ones " +
              "realize less",
            label: "planning-range",
          },
          measuredAs:
            "Fraction of the gross blended-rate arbitrage actually realized after " +
            "the coordination tax (the multiplier on the gross arbitrage lever)",
        },
      ],
      timeToValueBand:
        "Sourcing & contracting (RFP to signed MSA/SOW): 1-2 quarters. " +
        "Transition / knowledge transfer to steady state: 1-3 quarters depending " +
        "on estate complexity, with realized arbitrage lagging through ramp. " +
        "Automation / AI-led effort reduction compounds over 2-4 quarters once " +
        "knowledge and tooling are in place. Full run-rate value, governance " +
        "maturity, and a credible exit capability: 12-24 months — and exit " +
        "optionality must be built at contracting, not retrofitted at renewal.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ITSM / service-management platform",
          role:
            "Ticketing, incident/problem/change, the CMDB, and the SLA/XLA " +
            "scorecard — the operational system of record the provider runs " +
            "delivery on and the governance scorecard reads.",
          examples: ["ServiceNow", "BMC Helix", "Atlassian Jira Service Management", "Ivanti"],
        },
        {
          name: "Vendor / contract & SLA management",
          role:
            "The MSA/SOW repository, SLA/XLA definitions, obligations, renewal " +
            "and exit clauses, and the governance/performance register for the " +
            "managed-services relationships.",
          examples: ["SAP Ariba / Fieldglass", "Icertis", "Coupa CLM", "ServiceNow Vendor Management"],
        },
        {
          name: "IT financial management (ITFM) / spend",
          role:
            "Managed-services cost allocation, cost-to-serve, rate-card and " +
            "benchmark tracking, and change-request/leakage visibility against " +
            "the IT budget and GL.",
          examples: ["Apptio", "ServiceNow ITFM", "Flexera", "internal ITFM models"],
        },
        {
          name: "Monitoring / observability & experience (DEX)",
          role:
            "Independent client-side telemetry, AIOps event correlation, and " +
            "digital-experience monitoring — the basis for independent SLA/XLA " +
            "assurance against the provider's own reporting.",
          examples: ["Datadog", "Dynatrace", "Splunk", "Nexthink (DEX)"],
        },
        {
          name: "Resource / staffing & rate-card management",
          role:
            "Delivery-staffing, location-mix and pyramid reporting, and the " +
            "contracted rate card by role/location that drives blended rate and " +
            "offshore-mix metrics.",
          examples: ["SAP Fieldglass", "Beeline", "provider resource-management systems"],
        },
      ],
      roles: [
        {
          title: "CIO / Head of IT Sourcing",
          accountability:
            "The outsourcing strategy and footprint, the value case, vendor " +
            "concentration and resilience, and accountability for outcomes and " +
            "exit optionality to the business.",
        },
        {
          title: "Head of Vendor Management / Service Integration (SIAM)",
          accountability:
            "The retained governance organization, multi-provider service " +
            "integration, the commercial relationship, and the exit/second-source " +
            "posture.",
        },
        {
          title: "Service Delivery Manager (retained side)",
          accountability:
            "Day-to-day governance of the provider, SLA/XLA assurance, " +
            "escalations, change-request control, and the operational health of " +
            "the towers.",
        },
        {
          title: "Engagement / Delivery Director (provider side)",
          accountability:
            "Provider-side delivery, the global delivery model and staffing, SLA " +
            "performance, transition execution, and the commercial outcome for " +
            "the provider.",
        },
        {
          title: "Transition / Knowledge-Transfer Lead",
          accountability:
            "Transition program delivery, knowledge-transfer completeness and " +
            "durability, run-book capture, and steady-state cutover readiness.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Outsourcing & third-party risk regulation (e.g. EBA/financial-services outsourcing, DORA, OCC third-party risk)",
          relevance:
            "Regulated industries face prescribed third-party / outsourcing " +
            "governance, concentration-risk, sub-contracting transparency, and " +
            "documented exit-plan obligations that constrain how IT services are " +
            "sourced and governed.",
        },
        {
          name: "Data protection, residency & cross-border transfer (GDPR, data-localization rules)",
          relevance:
            "Offshore/nearshore delivery moves data and access across borders; " +
            "the delivery-location model, access controls, and data-handling must " +
            "satisfy privacy, residency, and cross-border-transfer obligations.",
        },
        {
          name: "Security & control attestations (SOC 2, ISO 27001, client security standards)",
          relevance:
            "Providers operating the IT estate must hold and evidence security/" +
            "control attestations, and the retained org must assure them — a " +
            "standing requirement in MSAs and at renewal.",
        },
        {
          name: "Worker-classification, co-employment & labor regulation (offshore/onshore)",
          relevance:
            "Managed-service (deliverable/outcome) versus staff-augmentation " +
            "constructs carry co-employment and worker-classification risk that " +
            "shapes how the engagement and SOW must be structured.",
        },
      ],
      canonicalTerms: [
        {
          term: "AMS (Application Management Services)",
          definition:
            "Outsourced run/maintain and small-enhancement support of an " +
            "application portfolio under SLAs — distinct from one-off project/SI " +
            "delivery and from infrastructure managed services.",
        },
        {
          term: "SLA vs XLA",
          definition:
            "SLA = contracted technical service levels (availability, resolution " +
            "time); XLA = experience/outcome levels measuring whether the service " +
            "actually serves the business. SLA-green can mask XLA-red (watermelon " +
            "SLAs).",
        },
        {
          term: "Coordination tax (arbitrage erosion)",
          definition:
            "The share of gross offshore labor arbitrage consumed by knowledge " +
            "ramp, attrition re-ramp, rework, time-zone latency, and a thicker " +
            "retained-management layer — the gap between gross and net saving.",
        },
        {
          term: "Transition & reverse transition (exit)",
          definition:
            "Transition = standing up the provider and transferring knowledge " +
            "into steady state; reverse transition = exiting the provider, moving " +
            "knowledge/assets back or to a successor. Priced exit/reverse-" +
            "transition rights are the lock-in mitigation.",
        },
        {
          term: "Retained organization & SIAM",
          definition:
            "The client-side function kept in-house to govern providers and " +
            "integrate services across them (Service Integration and Management) " +
            "— the platform that makes outsourcing governable.",
        },
        {
          term: "MSA / SOW",
          definition:
            "Master Services Agreement (the overarching legal/commercial frame) " +
            "and Statement of Work (the scoped, priced service definition with " +
            "SLAs) — the contract spine of a managed-services relationship.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Service-level and business-outcome attainment",
        authoritativeSource:
          "Provider ITSM/monitoring SLA reporting reconciled against the " +
          "retained org's INDEPENDENT telemetry and XLA/experience measures",
        whatGoodEvidenceLooksLike:
          "SLA attainment by tower AND XLA/outcome attainment from independent " +
          "telemetry, with the SLA-vs-XLA divergence shown and business-impact " +
          "context — proving outcomes, not just green technical SLAs.",
        weakEvidenceToReject:
          "A provider-reported 'all SLAs green' dashboard with no independent " +
          "validation and no XLA/business-outcome measure — the watermelon-SLA " +
          "trap.",
      },
      {
        claim: "Offshore arbitrage and the net saving",
        authoritativeSource:
          "Contracted rate card by role/location and delivery mix, netted " +
          "against rework, attrition re-ramp, time-zone, and retained-management " +
          "cost, reconciled to actual run-rate in the GL",
        whatGoodEvidenceLooksLike:
          "Gross blended-rate arbitrage AND the realized net saving after the " +
          "coordination tax, with the realization rate shown and reconciled to " +
          "actual GL run-rate — not the gross delta alone.",
        weakEvidenceToReject:
          "A headline 'we save X% by going offshore' built on the gross blended-" +
          "rate delta with no coordination-tax adjustment and no GL reconciliation.",
      },
      {
        claim: "Transition completeness and knowledge durability",
        authoritativeSource:
          "Transition milestone reporting and a knowledge-base / run-book " +
          "completeness audit against the application/system inventory",
        whatGoodEvidenceLooksLike:
          "Transition milestones on/off plan AND a knowledge-retention figure " +
          "audited against durable, client-owned run-book artifacts by " +
          "application — proving knowledge is codified, not in heads.",
        weakEvidenceToReject:
          "Knowledge transfer marked 'complete' on attendance/sign-off with no " +
          "artifact audit, and a steady-state incident spike presented as normal.",
      },
      {
        claim: "Exit / lock-in posture and switching cost",
        authoritativeSource:
          "The MSA/SOW exit and reverse-transition clauses, the current exit " +
          "plan, second-source options, and the knowledge-/tooling-ownership map",
        whatGoodEvidenceLooksLike:
          "A priced exit/reverse-transition clause, durable client-owned " +
          "knowledge and tooling, a current exit plan, and a credible second-" +
          "source — a quantified, defensible switching cost.",
        weakEvidenceToReject:
          "An assertion that 'we could switch if needed' with no priced exit " +
          "rights, no exit plan, provider-owned knowledge/tooling, and no second-" +
          "source.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you measure XLA / business-outcome attainment independently of the provider's SLA dashboard, and is your retained org equipped to challenge green SLAs when the business is degrading?",
      "Is your offshore saving sized as the gross blended-rate delta, or net of the coordination tax — rework, attrition re-ramp, time-zone latency, and the retained-management load it forces — and does it reconcile in the GL?",
      "If you had to exit this provider in 12 months, do you have priced exit/reverse-transition rights, durable provider-independent knowledge, and a credible second-source — or are you captive at renewal?",
      "What share of delivered work is billed as out-of-scope change requests or T&M on top of the baseline, and is your SOW scope tight enough to prevent re-billing routine work as extras?",
      "Is your retained organization sized and equipped to govern the provider independently and integrate services across multiple providers (SIAM), or was it cut to book the saving?",
      "How concentrated is your managed-services spend with a single provider, and what is your blended rate versus a current market benchmark for the same skill/location mix?",
      "How complete and durable was knowledge transfer at transition — audited against client-owned run-book artifacts — and did steady state open stable or with a persistent incident spike?",
    ],
    maturitySignals: [
      "Outcomes are governed on XLA / experience-level attainment from independent telemetry, not just the provider's green SLA dashboard.",
      "The offshore saving is tracked net of the coordination tax and reconciled to actual GL run-rate, not asserted from the gross rate delta.",
      "A priced exit / reverse-transition capability exists — durable client-owned knowledge, portable tooling, exit rights, and a credible second-source built at contracting.",
      "A right-sized retained organization runs vendor governance and multi-provider service integration (SIAM) with independent assurance, not reactive deck-acceptance.",
      "Scope is tightly baselined with low change-request leakage, and the commercial model ties incentives to outcomes/XLAs and automation gain-share, not just technical SLAs.",
    ],
    redFlags: [
      "The provider reports SLAs all green while business outcomes and end-user experience degrade, and the retained org has no independent telemetry or XLA measure to challenge it (watermelon SLAs).",
      "The outsourcing saving is sized on the gross blended-rate delta with no coordination-tax adjustment, and never reconciles to the GL run-rate — the arbitrage is over-stated.",
      "There is no priced exit/reverse-transition clause, knowledge lives in the provider's heads, tooling is provider-owned, and there is no second-source — the enterprise is captive at renewal.",
      "The retained governance organization was cut too thin to govern the provider, so SLAs go unchallenged, scope leaks to change requests, and service integration across providers fails.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Global IT services & SI primes (TCS, Infosys, Wipro, Accenture, Cognizant, HCLTech, Capgemini)",
        category: "AMS, infrastructure/cloud managed services, end-to-end SI run",
        switchingCost:
          "Very high — knowledge lives in the provider's delivery teams, run-books and tooling entangle with their platforms, and a single prime concentrates dependency; exit is a full reverse-transition program, not a re-tender.",
        renewalDynamics:
          "Multi-year MSA/SOW with renewal/extension; rates drift above market between benchmarking cycles, and incumbents leverage knowledge lock-in and an 'AI productivity' narrative to defend price.",
      },
      {
        vendorName: "Hyperscaler-aligned & cloud managed-service providers (MSPs)",
        category: "Cloud infrastructure managed services, FinOps, platform run",
        switchingCost:
          "High where the MSP's tooling, landing-zone, and automation are entangled with the estate; moderate where the underlying cloud and IaC are client-owned and portable.",
        renewalDynamics:
          "Consumption-plus-managed-fee; the lever is client-owned IaC/tooling and a portable landing zone versus MSP-proprietary automation that deepens lock-in.",
      },
      {
        vendorName: "Nearshore / regional delivery specialists",
        category: "Nearshore AMS and engineering delivery (time-zone-aligned)",
        switchingCost:
          "Moderate — smaller scope and lower concentration make switching more feasible, but knowledge durability and run-book ownership still drive the real cost.",
        renewalDynamics:
          "T&M or capacity-based; time-zone overlap and lower coordination tax are the differentiator, with rate competition keeping renewal pressure higher.",
      },
      {
        vendorName: "Niche / boutique AMS and platform-specialist providers",
        category: "Application- or platform-specific managed services (e.g. ERP, specific SaaS estates)",
        switchingCost:
          "Moderate to high depending on platform depth — deep platform expertise and embedded knowledge raise switching cost, but narrow scope limits concentration.",
        renewalDynamics:
          "Specialist premium pricing; the lever is the scarcity of the platform skill against the breadth a prime can offer at renewal.",
      },
      {
        vendorName: "Service-integration (SIAM) & advisory / benchmarking firms",
        category: "Service integration, governance tooling, rate/SLA benchmarking",
        switchingCost:
          "Low to moderate — advisory and benchmarking are re-tenderable, though an embedded SIAM operator accretes process knowledge over time.",
        renewalDynamics:
          "Advisory fees or managed SIAM; independence from the delivery primes is the value and the negotiation lever.",
      },
    ],
    switchingCosts:
      "The true switching cost in IT-services sourcing is the TRANSITION-OUT, " +
      "not the contract — knowledge that lives in the provider's delivery teams, " +
      "thin or provider-owned run-books, tooling and automation entangled with " +
      "the provider's platforms, and the data/asset/IP extraction. A single-prime " +
      "estate compounds this with concentration. This is why exit is a multi-" +
      "quarter reverse-transition program and why a contract signed without " +
      "priced exit rights, durable client-owned knowledge, and a credible second-" +
      "source is effectively non-leavable. The negotiable frontier is built at " +
      "CONTRACTING — exit/reverse-transition clauses, knowledge and tooling " +
      "ownership, and second-source optionality — not discovered at renewal.",
    negotiationLevers: [
      "Priced exit / reverse-transition and exit-assistance clauses, plus client-owned knowledge, run-books, and tooling, negotiated at contracting to neutralize the lock-in premium",
      "Outcome / XLA-based pricing and gain-share on automation tied to measured business outcomes and effort reduction, not seats or gross headcount",
      "Independent benchmarking rights and a market-rate reset mechanism so blended rates cannot drift above market between cycles",
      "Tight SOW scope baseline with capped change-request / T&M leakage and clear in-scope definitions to stop re-billing routine work as extras",
      "Multi-sourcing / second-source posture and concentration caps to preserve walk-away leverage and resilience against a single prime",
      "AI-productivity pass-through: require the provider's automation gains to lower the client's price (effort reduction), not just expand the provider's margin",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      service_level_claim: [
        "SLA attainment by tower from provider reporting",
        "XLA / business-outcome attainment from INDEPENDENT telemetry",
        "the SLA-vs-XLA divergence (watermelon check)",
      ],
      saving_claim: [
        "gross blended-rate arbitrage by location mix",
        "net saving after the coordination tax (realization rate)",
        "reconciliation to actual GL run-rate, not the gross delta",
      ],
      transition_claim: [
        "transition milestone completion against the baselined plan",
        "knowledge-retention audited against durable client-owned artifacts",
        "steady-state stability (incident trend through cutover)",
      ],
      exit_lockin_claim: [
        "priced exit / reverse-transition clause in the MSA/SOW",
        "knowledge and tooling ownership map (client- vs provider-owned)",
        "current exit plan and credible second-source",
      ],
      value_projection: [
        "gross arbitrage AND the realization rate net of the coordination tax",
        "automation/AI effort-reduction range with quality guardrails",
        "explicit haircut factors (coordination tax, scope leakage, transition, governance)",
        "transition cost and the exit/lock-in cost stated, not omitted",
      ],
    },
    citationStandard:
      "Quantitative IT-services claims cite the system of record (ITSM SLA " +
      "scorecard, ITFM/billing, contract/SOW, monitoring telemetry) and the " +
      "tower/application and period. Service-level claims carry BOTH SLA " +
      "attainment AND independently-measured XLA/outcome attainment — never a " +
      "provider-only green dashboard. Saving claims carry BOTH the gross blended-" +
      "rate arbitrage AND the net saving after the coordination tax with the " +
      "realization rate, reconciled to GL run-rate — never a gross rate delta " +
      "presented as the saving. Value projections state the gross arbitrage and " +
      "the net realization rate, the automation range, the named haircut factors, " +
      "AND the transition and exit/lock-in cost — never a single asserted saving " +
      "or a case that omits the cost of getting out.",
  },

  hedgeRules: {
    whenToHedge: [
      "Only provider SLA reporting is available with no independent telemetry or XLA measure — frame outcome attainment as unverified and flag the watermelon-SLA risk rather than accepting green SLAs.",
      "A saving is quoted from the gross blended-rate delta — restate it net of an industry coordination-tax planning range and gate it on GL reconciliation.",
      "Transition completeness is asserted from sign-off with no artifact audit — treat knowledge retention and steady-state stability as unproven.",
      "Exit posture is unstated or asserted informally — surface the absence of priced exit rights, durable knowledge, and a second-source as an explicit lock-in risk before quoting value.",
    ],
    inferenceLanguage: [
      "Across managed-services engagements of this scale and offshore mix, blended rates and SLA attainment typically run...",
      "Without your independent XLA telemetry, the industry pattern is that green SLAs can mask outcome degradation, so treat the saving as gated on outcome assurance...",
      "Peer engagements commonly realize only a fraction of the gross offshore arbitrage after the coordination tax — roughly... as a planning range, not your measured figure...",
      "Treating this as a planning range on net (not gross) saving, and noting the exit/lock-in cost is typically the unstated part of the case...",
    ],
    flagWithoutEvidence: [
      "A specific net-saving, cost-to-serve, or blended-rate figure for this tenant's engagement",
      "This tenant's actual SLA/XLA attainment, offshore mix, change-request leakage, or knowledge-retention figures",
      "A gross blended-rate arbitrage presented as the realized saving without the coordination-tax haircut or GL reconciliation",
      "A claim that the tenant could exit or switch providers without priced exit rights, durable knowledge, and a credible second-source",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "where does managed-services cost sit / cost-to-serve by tower and application",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack managed-services cost by tower (AMS, infra/cloud, service desk) and application tier, separating run vs change-request/T&M to show where cost-to-serve and leakage concentrate.",
    },
    {
      questionPattern:
        "savings story / gross offshore arbitrage to realized net saving",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from onshore baseline to gross offshore arbitrage to realized net saving, showing the coordination-tax, scope-leakage, transition, and governance haircuts explicitly, plus automation upside.",
    },
    {
      questionPattern:
        "SLA vs XLA / does the green dashboard match business outcomes",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend SLA attainment alongside independently-measured XLA/outcome attainment to expose watermelon-SLA divergence where SLAs stay green and outcomes degrade.",
    },
    {
      questionPattern:
        "value sensitivity to coordination tax, scope leakage, transition, and governance",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of net-value sensitivity to the dominant haircut factors (coordination tax, scope leakage, transition cost, governance under-investment).",
    },
    {
      questionPattern: "managed-services KPI scorecard",
      exhibitKind: "table",
      note: "Managed-services cost % of IT budget, SLA and XLA attainment, offshore mix, blended rate vs market, throughput per FTE, transition on-time %, knowledge retention, vendor concentration, change-request leakage, cost-to-serve per app, retained-org ratio versus planning ranges.",
    },
    {
      questionPattern: "renewal / re-source decision and exit readiness",
      exhibitKind: "table",
      note: "Per provider/tower: blended rate vs market, SLA/XLA, concentration, change-request leakage, knowledge-retention, priced exit rights, second-source availability, and recommended renew/re-tender/repatriate disposition.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A right-sized retained organization governs the provider on XLA/outcome attainment with independent telemetry, so watermelon SLAs are caught and value is protected",
      "The offshore saving is engineered and tracked net of the coordination tax and reconciled to the GL, so the case is honest and the delivery model is designed for the work's coordination intensity",
      "A priced exit / reverse-transition capability and durable client-owned knowledge are built at contracting, so the enterprise negotiates renewals from strength rather than captivity",
      "Scope is tightly baselined and the commercial model ties incentives to outcomes and automation gain-share, converting the negotiated rate into a realized price",
    ],
    failureDrivers: [
      "Accepting the provider's green SLA dashboard as proof of value while outcomes degrade, with no independent XLA telemetry to challenge it",
      "Sizing the case on the gross blended-rate arbitrage with no coordination-tax adjustment, so the saving never reconciles in the GL and the business case collapses",
      "Signing without priced exit rights, durable knowledge, or a second-source, leaving the enterprise captive and paying a lock-in premium at every renewal",
      "Cutting the retained organization too thin to govern the provider, integrate multi-provider services, or stop scope leakage — the most common silent failure",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Cost-driven outsourcing of run-IT is mainstream and adopts readily — the " +
      "saving is tangible and the model familiar. XLA/outcome governance and " +
      "independent assurance are emerging and adopt unevenly, because they " +
      "require the retained org to invest where the saving tempts it to cut. " +
      "AI-led delivery (service-desk deflection, AIOps, AMS automation) is " +
      "scaling and increasingly dominates raw arbitrage. Exit/lock-in discipline " +
      "is the least-adopted and hardest part — it must be built at contracting " +
      "against the grain of incumbent lock-in, and it is where most enterprises " +
      "are weakest and where renewals are won or lost.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI is firm at the rate card but soft at the P&L: the gross arbitrage and " +
      "blended rates are directly measurable, but the REALIZED saving depends on " +
      "the coordination tax, scope leakage, transition ramp, and governance " +
      "maturity and is hard to attribute cleanly against a moving baseline. " +
      "Outcome value (XLA) is harder still to quantify, and the exit/lock-in " +
      "cost is real but usually unpriced until exit. This is why the value model " +
      "leans on net (not gross) arbitrage and on XLA attainment, and the " +
      "evidence/hedge rules force a GL-reconciliation path, an independent XLA " +
      "measure, and an explicit exit-cost line rather than a single headline " +
      "saving.",
  },

  regulatoryFrame: {
    name: "Third-party / outsourcing risk, data-residency & control-attestation regime",
    relevance:
      "The dominant regulatory frame for IT-services sourcing: regulated " +
      "industries face prescribed third-party/outsourcing governance, " +
      "concentration-risk, sub-contracting transparency, and documented exit-" +
      "plan obligations (e.g. financial-services outsourcing rules, DORA, OCC " +
      "third-party risk); offshore/nearshore delivery triggers data-protection, " +
      "residency, and cross-border-transfer duties (GDPR, localization); " +
      "providers running the estate must hold and evidence security/control " +
      "attestations (SOC 2, ISO 27001); and managed-service vs staff-" +
      "augmentation constructs carry co-employment/worker-classification risk. " +
      "Sourcing, transition, and exit design must satisfy these (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
