// Consilium expert — Integration & API Management (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the enterprise connectivity layer: application & data
// integration (iPaaS/ESB), API strategy & lifecycle management, event-driven
// architecture, B2B/EDI & partner onboarding, API products & monetization, and
// microservices connectivity. This is the INTEGRATION/API tier — the wiring
// between systems — distinct from the data-foundation expert (lakehouse/ELT/
// governance) and the application-portfolio expert (what gets modernized).
//
// CORE DOCTRINE — POINT-TO-POINT SPRAWL IS THE TAX; REUSE WITHOUT GOVERNANCE
// BECOMES ANOTHER SILO. Three honesty rules drive every recommendation:
//   (1) Point-to-point integration sprawl is the dominant, mostly-invisible
//       tax. Every bespoke connection multiplies the maintenance surface (the
//       O(n^2) interface problem), and most of an integration team's capacity
//       is consumed maintaining brittle one-off pipes, not building new value.
//       The cost is real but buried in "run" budgets and rarely measured.
//   (2) Reusable APIs are the antidote ONLY with governance. An ungoverned
//       API estate becomes "another silo" — undiscoverable, inconsistently
//       secured, duplicated, and untrusted — recreating the sprawl problem one
//       layer up. Reuse is an OUTCOME of catalog, standards, and lifecycle
//       discipline, not a side effect of buying a gateway.
//   (3) Integration is the hidden cost of every modernization and every AI
//       initiative. The system is rarely the bottleneck; getting clean,
//       governed, real-time access to the data inside it is. AI agents that
//       must ACT (not just answer) need governed, observable API and event
//       access — integration is on the critical path of agentic value.
// Product-aware (MuleSoft/Boomi/Apigee/Kong/Kafka/Confluent, etc.), not
// product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const integrationApiManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.integration-api-management",
    expertName: "Integration & API Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "integration-api-management",
    scopeNote:
      "Cross-cutting transformation of the enterprise integration & API layer: " +
      "application/data integration (iPaaS/ESB), API strategy & full-lifecycle " +
      "management (gateway, catalog, developer portal), event-driven " +
      "architecture (streaming/pub-sub), B2B/EDI & partner onboarding, API " +
      "products & monetization, and microservices connectivity — the wiring " +
      "between systems. Doctrine: point-to-point integration sprawl is the " +
      "DOMINANT, mostly-invisible tax (the O(n^2) interface problem), reusable " +
      "APIs require GOVERNANCE or they become another silo, and integration is " +
      "the HIDDEN COST of every modernization and AI initiative — the system is " +
      "rarely the bottleneck, governed access to the data inside it is. " +
      "Excludes the data foundation itself (lakehouse/ELT/data quality — " +
      "data-analytics-platform expert), the application portfolio's " +
      "build/buy/retire decisions (application-modernization expert), and " +
      "network/identity infrastructure (separate experts) — this expert owns " +
      "the connectivity substrate and its reuse, governance, and observability.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "reusable_integration_ratio",
        name: "% reusable vs point-to-point integrations",
        definition:
          "Share of production integrations delivered as governed, reusable, " +
          "cataloged assets (managed APIs, published events, shared connectors) " +
          "versus bespoke point-to-point connections built for a single " +
          "consumer.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "API-led/integration-maturity ranges; early estates are dominated " +
            "by point-to-point pipes, mature API-led programs push the reusable " +
            "share toward the top of the band but rarely eliminate one-offs",
          label: "planning-range",
        },
        dataSource:
          "Integration platform / API gateway inventory classified by " +
          "reuse type (managed reusable asset vs single-consumer point-to-point)",
        whyItMatters:
          "The single truest read on whether the estate is accruing the " +
          "point-to-point tax or building a reusable connectivity fabric. A low " +
          "ratio means every new need adds maintenance surface (O(n^2)); a high " +
          "ratio means new value composes from existing assets.",
      },
      {
        key: "api_reuse_rate",
        name: "API reuse rate",
        definition:
          "Average number of distinct consumers (apps, partners, teams) per " +
          "published API, indicating how often an API is consumed beyond its " +
          "first/originating use case.",
        unit: "consumers per API",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1.5,
          high: 6,
          basis:
            "API-program benchmarks; a reuse rate near 1 means APIs are really " +
            "point-to-point in disguise, mature programs see several consumers " +
            "per core API",
          label: "planning-range",
        },
        dataSource:
          "API gateway / developer-portal consumer-subscription registry " +
          "(distinct active consumers per API product)",
        whyItMatters:
          "Reuse is where API investment pays back — the second and third " +
          "consumer cost a fraction of the first. A reuse rate near 1 reveals an " +
          "API catalog that is point-to-point integration wearing a gateway.",
      },
      {
        key: "integration_delivery_lead_time",
        name: "Integration delivery lead time",
        definition:
          "Elapsed time from an accepted integration/API request to that " +
          "integration being live in production (design, build, test, secure, " +
          "deploy), measured at the median.",
        unit: "days / weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 60,
          basis:
            "Integration-delivery ranges; composing from existing reusable " +
            "assets/connectors lands in days, bespoke point-to-point against a " +
            "legacy/SOAP source stretches to weeks",
          label: "planning-range",
        },
        dataSource:
          "Integration intake/delivery tracking (request-to-production " +
          "timestamps in the team's backlog/ticketing system)",
        whyItMatters:
          "The agility unit of the connectivity layer and the most common " +
          "bottleneck between a funded initiative and the data it needs. Slow " +
          "delivery is what pushes teams to build shadow point-to-point pipes.",
      },
      {
        key: "api_availability_sla",
        name: "API availability / SLA attainment",
        definition:
          "Share of time production APIs and integration flows meet their " +
          "availability and latency SLA over the period (the uptime of the " +
          "connectivity fabric).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 99,
          high: 99.99,
          basis:
            "API-operations benchmarks; business-critical and partner-facing " +
            "APIs target 99.9%+ (three-to-four nines), internal/non-critical " +
            "flows run lower",
          label: "planning-range",
        },
        dataSource:
          "API gateway / integration-platform observability (uptime + " +
          "latency-SLA monitors per API and flow)",
        whyItMatters:
          "When integrations ARE the product (partner APIs, monetized APIs, " +
          "agent actions), their availability is the business's availability. A " +
          "single brittle point-to-point hop can cap an end-to-end SLA the " +
          "business depends on.",
      },
      {
        key: "integration_maintenance_pct_it_budget",
        name: "Integration maintenance % of IT budget",
        definition:
          "Share of integration/connectivity spend (and team capacity) consumed " +
          "by maintaining, fixing, and reworking existing integrations rather " +
          "than delivering new connectivity value (the 'run' vs 'build' split).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 75,
          basis:
            "Integration-team capacity studies; point-to-point-heavy estates " +
            "sink most capacity into maintenance, API-led estates with reuse " +
            "and observability shift capacity toward new build",
          label: "planning-range",
        },
        dataSource:
          "Integration team time/cost allocation (run/maintenance vs " +
          "build/new-delivery) plus integration-tooling and middleware spend",
        whyItMatters:
          "The most honest measure of the point-to-point tax — it quantifies " +
          "how much of the connectivity budget is just keeping brittle pipes " +
          "alive. A high, rising share is the financial signature of sprawl.",
      },
      {
        key: "standardized_integration_patterns",
        name: "# of standardized integration patterns",
        definition:
          "Count of governed, documented, reusable integration patterns and " +
          "templates (e.g. canonical REST sync, event publish, batch B2B, " +
          "CDC stream) that teams build to instead of improvising bespoke " +
          "designs each time.",
        unit: "patterns",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 15,
          basis:
            "Integration-CoE/platform-team ranges; a small set of well-adopted " +
            "patterns covers the majority of needs — more is not better past " +
            "the point of coverage and adoption",
          label: "planning-range",
        },
        dataSource:
          "Integration platform / CoE template & pattern library (published, " +
          "governed patterns and their adoption count)",
        whyItMatters:
          "Standardized patterns are how reuse and fast delivery actually " +
          "happen — they turn integration from artisanal one-offs into " +
          "composable, governed building blocks. Low pattern coverage is why " +
          "every integration becomes a snowflake.",
      },
      {
        key: "api_self_service_adoption",
        name: "API self-service / developer-portal adoption",
        definition:
          "Share of API consumers (internal teams and partners) who discover, " +
          "subscribe to, and onboard APIs through the self-service developer " +
          "portal rather than via manual tickets, emails, or direct broker " +
          "involvement.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "API-program adoption ranges; mature programs route most onboarding " +
            "through the portal, immature ones still gate everything through " +
            "manual integration-team intake",
          label: "planning-range",
        },
        dataSource:
          "Developer-portal telemetry (self-service discovery/subscription/" +
          "onboarding events vs manually brokered onboardings)",
        whyItMatters:
          "Self-service is the proof an API estate is a product, not a " +
          "ticket queue — it is what removes the integration team as the " +
          "bottleneck and lets the reuse flywheel turn. Low adoption means the " +
          "catalog exists but nobody can find or trust it.",
      },
      {
        key: "event_vs_batch_mix",
        name: "Event vs batch integration mix",
        definition:
          "Share of integration data flow that is event-driven / streaming " +
          "(near-real-time pub-sub, CDC) versus scheduled batch transfer, " +
          "weighted by volume or by business-critical flows.",
        unit: "% event-driven",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Event-driven-architecture adoption ranges; the right mix is " +
            "use-case-driven — not everything should be real-time — so this is " +
            "a planning anchor, not a maximize target",
          label: "planning-range",
        },
        dataSource:
          "Integration-platform/event-broker flow inventory classified by " +
          "interaction style (event/streaming vs scheduled batch)",
        whyItMatters:
          "The event mix gates which real-time and agentic use cases are even " +
          "possible — but over-eventing simple batch needs adds cost and " +
          "operational complexity. The honest target is fit-to-use-case, which " +
          "is why direction is in-range, not higher.",
      },
      {
        key: "integration_incident_rate",
        name: "Integration incident rate",
        definition:
          "Count of integration/API incidents (failed flows, broken contracts, " +
          "data-delivery failures reaching a consumer or partner) per period, " +
          "normalized per N integrations or per N API calls.",
        unit: "incidents / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Integration-operations ranges per 100 integrations/month; " +
            "observable API-led estates detect-and-contain, brittle " +
            "point-to-point estates surface incidents to consumers and partners",
          label: "planning-range",
        },
        dataSource:
          "Integration/API observability + incident-management system " +
          "(detected and partner/consumer-reported integration incidents)",
        whyItMatters:
          "Each consumer- or partner-facing integration failure erodes trust " +
          "in the fabric and, for partner/monetized APIs, has direct commercial " +
          "consequences. The trend and time-to-detect read how brittle the " +
          "estate really is beneath the surface.",
      },
      {
        key: "time_to_onboard_partner",
        name: "Time to onboard a B2B/API partner",
        definition:
          "Elapsed time from a new trading partner or API consumer agreement to " +
          "that partner exchanging data in production (connectivity, mapping, " +
          "security, certification/testing complete).",
        unit: "days / weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 90,
          basis:
            "B2B/EDI and API-partner onboarding ranges; templated, self-service " +
            "onboarding lands in days, bespoke EDI/AS2 certification with a new " +
            "trading partner stretches to many weeks",
          label: "planning-range",
        },
        dataSource:
          "B2B/partner-onboarding tracking (agreement-to-production-exchange " +
          "timestamps) and developer-portal onboarding telemetry",
        whyItMatters:
          "Partner onboarding speed is a direct revenue and ecosystem lever — " +
          "in B2B and platform businesses, slow onboarding delays revenue and " +
          "loses partners. It is the externally-visible face of integration " +
          "maturity.",
      },
      {
        key: "api_consumption_growth",
        name: "API consumption growth",
        definition:
          "Period-over-period growth in API call volume / active consumers " +
          "across the managed API estate — the demand signal for the " +
          "connectivity fabric and (for monetized APIs) the revenue driver.",
        unit: "% growth",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 100,
          basis:
            "API-program growth ranges; healthy internal API platforms compound " +
            "steadily, successful external/monetized API products can grow " +
            "much faster — highly context-dependent, a planning anchor",
          label: "planning-range",
        },
        dataSource:
          "API gateway analytics (call volume, active-consumer, and — where " +
          "monetized — billed-usage trends per API product)",
        whyItMatters:
          "Growing consumption is the proof the fabric is being pulled by real " +
          "demand rather than built on spec — and for API-as-product strategies " +
          "it is the top-line. Flat or declining consumption on a heavily-built " +
          "estate is the integration cost-center warning sign.",
      },
    ],

    painThemes: [
      {
        key: "point_to_point_sprawl",
        name: "Point-to-point integration sprawl (the O(n^2) tax)",
        description:
          "Systems are wired together with bespoke one-to-one connections built " +
          "ad hoc for each need, so the number of brittle interfaces grows " +
          "quadratically with systems and most integration capacity is consumed " +
          "maintaining pipes rather than delivering value — the dominant, " +
          "mostly-invisible tax on the estate.",
        detectionSignal:
          "Low reusable-integration ratio and API reuse rate, high " +
          "integration-maintenance share of budget, a tangle of undocumented " +
          "direct system-to-system connections, and 'we can't change X without " +
          "breaking five other things' fragility.",
        diagnosticQuestion:
          "How many of your production integrations are reusable, governed " +
          "assets versus bespoke point-to-point pipes — and what share of your " +
          "integration team's time goes to maintaining existing connections?",
      },
      {
        key: "api_catalog_as_silo",
        name: "Ungoverned API estate (reuse-tool-turned-silo)",
        description:
          "A gateway and 'API catalog' were bought, but without governance the " +
          "estate becomes another silo — APIs are undiscoverable, " +
          "inconsistently secured and versioned, duplicated across teams, and " +
          "untrusted — so reuse never materializes and integration sprawl is " +
          "recreated one layer up.",
        detectionSignal:
          "Low API reuse rate and self-service adoption despite owning a " +
          "gateway, duplicate APIs doing the same thing, inconsistent " +
          "auth/versioning standards, no developer portal anyone uses, APIs " +
          "with no owner or documentation.",
        diagnosticQuestion:
          "Can a developer or partner discover, trust, and self-serve onboard " +
          "to your APIs through a portal — or is your 'API platform' really a " +
          "set of point-to-point integrations behind a gateway?",
      },
      {
        key: "integration_as_hidden_modernization_cost",
        name: "Integration as the hidden cost of modernization & AI",
        description:
          "Modernization and AI programs are scoped around the system or the " +
          "model and discover, late, that the real cost and risk live in " +
          "untangling and rebuilding the integrations — the system is rarely " +
          "the bottleneck; governed, real-time access to the data inside it is " +
          "— so timelines and budgets blow up on connectivity rework.",
        detectionSignal:
          "Modernization/AI business cases with thin integration line items, " +
          "discovery of dozens of undocumented dependencies on the legacy " +
          "system, AI agents that can answer but cannot ACT because there is no " +
          "governed API/event to call, schedule slips attributed to 'interface " +
          "work'.",
        diagnosticQuestion:
          "For your top modernization or AI initiative, have the integrations " +
          "into and out of the affected systems been mapped and costed — or is " +
          "integration a hidden assumption in the plan?",
      },
      {
        key: "brittle_partner_b2b_onboarding",
        name: "Brittle, slow B2B/partner onboarding",
        description:
          "Each new trading partner or API consumer is onboarded as a bespoke, " +
          "manual project — custom mappings, hand-built EDI/AS2 setups, " +
          "ticket-driven access — so onboarding takes weeks, delays revenue, " +
          "and the resulting partner connections are fragile snowflakes that " +
          "break silently when a partner changes a format.",
        detectionSignal:
          "Long time-to-onboard-partner, partner integrations built one-off " +
          "with no template, no partner self-service, integration incidents " +
          "concentrated at partner boundaries, EDI maps maintained by one " +
          "irreplaceable person.",
        diagnosticQuestion:
          "How long does it take to onboard a new trading partner or API " +
          "consumer to production, and is onboarding templated and " +
          "self-service or a bespoke project every time?",
      },
      {
        key: "no_observability_silent_failure",
        name: "No end-to-end observability (silent integration failure)",
        description:
          "Integration flows and APIs are not monitored end-to-end, so failures " +
          "are silent until a downstream consumer, partner, or customer reports " +
          "wrong/missing data — there is no view of which flow broke, what it " +
          "affected, or whether SLAs are being met, and trust erodes with every " +
          "surprise.",
        detectionSignal:
          "Incidents found by consumers rather than monitors, no per-flow SLA " +
          "or latency dashboards, no distributed tracing across integration " +
          "hops, long mean-time-to-detect, 'the data stopped flowing and nobody " +
          "noticed' incidents.",
        diagnosticQuestion:
          "When an integration or API breaks, do you detect it before the " +
          "consumer does — and can you trace a transaction end-to-end across " +
          "every hop to find where it failed?",
      },
      {
        key: "batch_bound_no_realtime",
        name: "Batch-bound estate blocks real-time & agentic use cases",
        description:
          "The estate is overwhelmingly scheduled batch file transfer, so data " +
          "moves on overnight cycles and any use case needing fresh data or " +
          "event reactions — real-time personalization, fraud signals, agentic " +
          "actions — is impossible without a parallel rebuild, while the " +
          "organization assumes 'we have the integration' because a batch job " +
          "exists.",
        detectionSignal:
          "Very low event-vs-batch mix, real-time use cases stalled on data " +
          "latency, overnight-batch dependencies everywhere, no event broker or " +
          "streaming backbone, AI/automation initiatives blocked on 'the data " +
          "is a day old'.",
        diagnosticQuestion:
          "Which of your integrations are event-driven/real-time versus " +
          "overnight batch — and are any real-time or agentic use cases blocked " +
          "because the underlying data only moves on a schedule?",
      },
      {
        key: "api_product_without_strategy",
        name: "APIs built without a product or monetization strategy",
        description:
          "APIs are exposed as technical byproducts of projects with no product " +
          "owner, no consumer-experience design, no versioning/deprecation " +
          "policy, and (where relevant) no monetization or partner model — so " +
          "they neither drive reuse internally nor become a durable external " +
          "revenue/ecosystem asset, and the 'API strategy' is a slide, not an " +
          "operating model.",
        detectionSignal:
          "APIs with no named product owner, no usage analytics tied to value, " +
          "no deprecation policy (so nothing can ever be retired), external API " +
          "ambitions with no pricing/packaging or partner program, " +
          "consumption growth flat despite investment.",
        diagnosticQuestion:
          "Are your APIs managed as products — with owners, consumer-experience " +
          "design, lifecycle/versioning policy, and (where external) a " +
          "monetization or partner model — or are they technical exhaust from " +
          "projects?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_integration_mapping_copilot",
        name: "AI integration & API authoring copilot",
        valueMechanism:
          "An AI copilot drafts field mappings, transformation logic, API " +
          "specs, and connector configurations from source/target schemas and " +
          "sample payloads — and suggests reuse of existing assets — compressing " +
          "integration delivery lead time and steering teams toward standardized " +
          "patterns instead of bespoke point-to-point builds.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Source and target schemas / API contracts for the integration",
          "Existing integration/mapping code and the pattern/template library",
          "Sample payloads and the canonical data model to map against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated mappings/transformations must pass contract tests and review before production — a wrong mapping silently corrupts every downstream consumer",
          "Copilot must not embed credentials or bypass auth/governance in generated connector config",
        ],
        metricsMoved: [
          "integration_delivery_lead_time",
          "reusable_integration_ratio",
          "standardized_integration_patterns",
        ],
      },
      {
        key: "ai_api_discovery_catalog",
        name: "AI-assisted API discovery, cataloging & reuse",
        valueMechanism:
          "AI inventories the estate (scanning gateways, repos, and traffic) to " +
          "surface undocumented and duplicate APIs/integrations, auto-generates " +
          "documentation and tags, and recommends an existing API to a developer " +
          "instead of a new build — directly attacking the ungoverned-silo " +
          "problem so reuse and self-service actually rise.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Gateway/registry inventory, API specs, and code repositories to scan",
          "API traffic/consumption telemetry to identify usage and duplicates",
          "Existing catalog/portal entries and taxonomy for consistency",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-generated documentation and duplicate-detection can be wrong — owner review required before an API is certified or deprecated",
          "Recommending reuse must respect access entitlements and data classification of the underlying API",
        ],
        metricsMoved: [
          "api_reuse_rate",
          "api_self_service_adoption",
          "reusable_integration_ratio",
        ],
      },
      {
        key: "ai_integration_observability_anomaly",
        name: "AI integration observability & anomaly detection",
        valueMechanism:
          "ML learns normal flow behavior (volume, latency, error patterns, " +
          "payload shape) across integrations and APIs and flags anomalies — " +
          "broken flows, contract drift, SLA breaches — before consumers and " +
          "partners notice, with lineage to scope blast radius, lowering the " +
          "incident rate and protecting availability.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "API gateway and integration-flow telemetry (volume, latency, errors)",
          "Historical flow baselines and contract/schema definitions",
          "Dependency/lineage map to scope incident blast radius",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Alert thresholds must be tuned to avoid fatigue — anomalies must be triaged, not just fired",
          "Auto-remediation (circuit-breaking, failover, pausing a flow) needs a reviewed runbook and SLA-aware guardrails",
        ],
        metricsMoved: [
          "integration_incident_rate",
          "api_availability_sla",
        ],
      },
      {
        key: "agentic_api_action_layer",
        name: "Governed API/event layer for agentic actions",
        valueMechanism:
          "AI agents that must ACT (not just answer) call governed, observable, " +
          "least-privilege APIs and consume/publish events to take actions " +
          "across systems — so the managed API estate becomes the safe execution " +
          "surface for agentic AI, turning integration maturity directly into " +
          "AI value rather than agents screen-scraping or going around controls.",
        adoptionProfile: "early",
        dataDependencies: [
          "A governed, documented API catalog with clear contracts and scopes",
          "Fine-grained auth/entitlement and rate-limit policy per API",
          "Event streams and an audit/observability trail for agent actions",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Agent-invoked write/transactional APIs need least-privilege scopes, rate limits, and human approval gates on consequential actions",
          "Every agent action must be authenticated, authorized, logged, and reversible/auditable — an ungoverned action layer is a major risk surface",
        ],
        metricsMoved: [
          "api_consumption_growth",
          "api_reuse_rate",
          "event_vs_batch_mix",
        ],
      },
      {
        key: "ai_partner_b2b_onboarding",
        name: "AI-accelerated B2B/partner onboarding & mapping",
        valueMechanism:
          "AI infers mappings between a partner's data format and the canonical " +
          "model (including messy EDI/flat-file variants), generates the " +
          "onboarding configuration, and validates test transactions — " +
          "collapsing bespoke partner-onboarding projects into templated, " +
          "fast onboarding and cutting time-to-onboard a partner.",
        adoptionProfile: "early",
        dataDependencies: [
          "Partner sample files/messages and the canonical/target schema",
          "Historical partner mappings and EDI/B2B standard definitions",
          "Validation rules and certification/test transaction sets",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Inferred partner mappings must be validated with the partner via test transactions before go-live — a wrong B2B mapping has contractual and financial consequences",
          "Onboarding automation must enforce the same security/certification standards as manual onboarding, not bypass them for speed",
        ],
        metricsMoved: [
          "time_to_onboard_partner",
          "integration_delivery_lead_time",
        ],
      },
      {
        key: "ai_legacy_interface_modernization",
        name: "AI-assisted legacy-interface understanding & API wrapping",
        valueMechanism:
          "AI reverse-engineers undocumented legacy interfaces (SOAP, " +
          "file-based, stored-procedure, screen-scrape) and drafts modern " +
          "API/event facades over them, so the hidden integration cost of " +
          "modernization is reduced — legacy systems gain governed access " +
          "points and the estate shifts from point-to-point to reusable APIs.",
        adoptionProfile: "early",
        dataDependencies: [
          "Legacy interface artifacts (WSDLs, file specs, code, traffic captures)",
          "Target API/event contract standards and the canonical data model",
          "Dependency map of current consumers of the legacy interface",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Reverse-engineered behavior must be verified against the live system — inferred semantics can miss edge cases the legacy system handles",
          "Wrapping must not paper over data-quality or security gaps in the legacy interface; the facade inherits the source's risks",
        ],
        metricsMoved: [
          "reusable_integration_ratio",
          "integration_delivery_lead_time",
          "integration_maintenance_pct_it_budget",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "api_led_connectivity",
        name: "API-led / layered connectivity (system–process–experience)",
        description:
          "Organize integration into reusable layers — system APIs (govern " +
          "access to each source of record), process APIs (orchestrate business " +
          "logic across systems), and experience APIs (tailor to a channel/" +
          "consumer) — so new needs compose from existing reusable assets " +
          "instead of new point-to-point pipes, and reuse becomes structural.",
        boundary:
          "Owns the API layering, reuse model, and contracts between layers; " +
          "does not own the source systems themselves or the consuming " +
          "applications — it is the reusable connective tissue between them.",
        humanAccountabilityPoint: "Head of Integration / API Platform (Integration CoE lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "full_lifecycle_api_management",
        name: "Full-lifecycle API management (gateway + catalog + portal)",
        description:
          "A managed API platform providing the gateway (security, rate " +
          "limiting, routing), a catalog/registry as the single front door, and " +
          "a developer portal for self-service discovery, subscription, and " +
          "onboarding — wired to versioning, deprecation, and analytics so the " +
          "API estate is governed and discoverable rather than an ungoverned " +
          "silo.",
        boundary:
          "Owns API exposure, security, lifecycle, discoverability, and " +
          "consumption analytics; does not own the business logic behind the " +
          "APIs or the integration flows themselves — it governs and publishes " +
          "them.",
        humanAccountabilityPoint: "API Product Owner / API Platform Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "event_driven_backbone",
        name: "Event-driven backbone (streaming / pub-sub)",
        description:
          "A central event broker / streaming platform where systems publish " +
          "events and consumers subscribe, decoupling producers from consumers " +
          "and enabling near-real-time flows, event sourcing, and reactive/" +
          "agentic use cases — the real-time spine that batch file transfer " +
          "cannot provide, adopted where the use case needs it.",
        boundary:
          "Owns event transport, topics/schemas, and delivery guarantees; does " +
          "not own the producing/consuming application logic or the request/" +
          "response API tier — it is the asynchronous complement to APIs, not a " +
          "replacement, and is fit-to-use-case, not a default for everything.",
        humanAccountabilityPoint: "Event Streaming Platform Owner / Integration Architect",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ipaas_hybrid_integration_platform",
        name: "iPaaS / hybrid integration platform (with CoE)",
        description:
          "A unified integration platform (cloud iPaaS plus on-prem runtime " +
          "where needed) with pre-built connectors, a reusable template/pattern " +
          "library, and a Center of Excellence that sets standards, curates " +
          "patterns, and federates delivery — replacing scattered ESB/" +
          "point-to-point tooling and making fast, governed, reusable " +
          "integration the path of least resistance.",
        boundary:
          "Owns the integration runtime, connectors, pattern library, and " +
          "delivery standards/governance; does not own the systems it connects " +
          "or the API product strategy above it — it is the build-and-run " +
          "substrate that the CoE governs.",
        humanAccountabilityPoint: "Integration CoE Lead / Head of Integration Platform",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "b2b_partner_gateway",
        name: "B2B / partner integration gateway (EDI + partner self-service)",
        description:
          "A managed B2B gateway handling partner connectivity protocols " +
          "(EDI/AS2/SFTP/API), trading-partner management, message validation, " +
          "and templated, self-service partner onboarding — turning bespoke " +
          "per-partner projects into a repeatable, governed onboarding factory " +
          "that protects revenue-bearing partner flows.",
        boundary:
          "Owns external partner connectivity, protocol handling, partner " +
          "lifecycle, and B2B observability; does not own the internal business " +
          "processes the partner data feeds — it is the governed external edge " +
          "of the integration estate.",
        humanAccountabilityPoint: "B2B / Partner Integration Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Integration value runs on two engines, and both are easy to overstate. " +
        "The first is EFFICIENCY: replacing point-to-point sprawl with reusable, " +
        "governed assets cuts integration maintenance (the 'run' tax), " +
        "compresses delivery lead time, and lets the team build new value " +
        "instead of nursing brittle pipes — this is directly measurable in team " +
        "capacity and tooling spend. The second, larger but softer, is " +
        "ENABLEMENT: a reusable, real-time, governed connectivity fabric " +
        "UNLOCKS value that lives in OTHER initiatives — faster modernization, " +
        "real-time and agentic use cases, new partner/API-product revenue — " +
        "value that is correctly attributed to those initiatives, not to the " +
        "integration line item. Honest sizing credits the fabric as a MULTIPLIER " +
        "on downstream value, plus a standalone API-monetization line only where " +
        "an external API product genuinely exists. The dominant haircut is " +
        "governance: a reuse layer bought but not governed yields little reuse, " +
        "so projected reuse savings must be discounted to what governance and " +
        "adoption actually deliver — the most common over-statement is assuming " +
        "a gateway purchase produces reuse on its own.",
      dominantHaircutFactors: [
        {
          factor: "Reuse without governance (gateway ≠ reuse)",
          rationale:
            "Projected savings from 'reusable APIs' are illusory unless catalog, " +
            "standards, ownership, and a developer portal actually drive reuse. " +
            "Most of the gap between projected and realized integration ROI is " +
            "here — buying a platform is not adopting a reuse operating model.",
          typicalHaircut: {
            low: 0.2,
            high: 0.55,
            basis:
              "Observed gap between projected API-led reuse savings and realized " +
              "savings when governance/adoption lag the platform purchase",
            label: "planning-range",
          },
        },
        {
          factor: "Migration drag (untangling existing point-to-point sprawl)",
          rationale:
            "The existing brittle, undocumented integration estate must be " +
            "discovered and re-platformed to realize the benefit, and that " +
            "untangling is slow, risky, and routinely underestimated — most of " +
            "the value is gated behind migrating the long tail of legacy pipes.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Gap between target-state reuse value and value realizable while " +
              "the legacy point-to-point estate is still being migrated",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption of standards & self-service by delivery teams",
          rationale:
            "Efficiency depends on teams actually building to standardized " +
            "patterns and self-serving from the catalog rather than bypassing " +
            "the CoE with shadow point-to-point integrations — low adoption " +
            "leaves the maintenance tax in place.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Shortfall from teams bypassing standards/self-service and " +
              "continuing to build bespoke point-to-point integrations",
            label: "planning-range",
          },
        },
        {
          factor: "API-product/monetization optimism (external demand uncertainty)",
          rationale:
            "Monetized or partner-API revenue depends on real external demand, " +
            "packaging, and ecosystem development that frequently fall short of " +
            "the business case — external API revenue must be discounted harder " +
            "than internal efficiency, which is more controllable.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Gap between projected external/monetized API consumption-revenue " +
              "and realized demand for API products",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Integration maintenance / 'run' cost reduction (sprawl removal)",
          range: {
            low: 0.15,
            high: 0.45,
            basis:
              "Reported reduction in integration maintenance effort/cost from " +
              "replacing point-to-point pipes with reusable, observable assets",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in integration_maintenance_pct_it_budget at " +
            "equal or greater integration footprint",
        },
        {
          lever: "Integration delivery-speed improvement (reuse + copilots)",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in integration delivery lead time from " +
              "reusable assets, pattern libraries, and AI authoring copilots",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in integration_delivery_lead_time per new " +
            "integration/API delivered",
        },
        {
          lever: "Partner / API-consumer onboarding compression",
          range: {
            low: 0.3,
            high: 0.75,
            basis:
              "Reported reduction in time-to-onboard a B2B partner or API " +
              "consumer from templated, self-service onboarding",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_onboard_partner per new partner / " +
            "API consumer",
        },
        {
          lever: "Downstream value enabled by a reusable, real-time fabric (multiplier)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Attributed to enabled initiatives: share of modernization/AI/" +
              "real-time/partner-revenue value that becomes realizable once " +
              "governed, reusable, real-time connectivity exists",
            label: "planning-range",
          },
          measuredAs:
            "Increment in realizable downstream initiative value attributable " +
            "to reusable_integration_ratio and event_vs_batch_mix — credited to " +
            "the enabled initiative, not the integration line",
        },
      ],
      timeToValueBand:
        "First reusable API/event on a high-traffic flow with measurable reuse: " +
        "1-2 quarters. Standing up the API platform (gateway + catalog + portal) " +
        "with initial standards and self-service: 2-4 quarters. Migrating the " +
        "point-to-point estate to reusable, governed, real-time connectivity " +
        "with a working CoE and broad adoption: 18-36 months, sequenced by the " +
        "highest-traffic/highest-reuse flows and pulled by named initiatives " +
        "rather than re-platformed wholesale.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Integration platform (iPaaS / ESB)",
          role:
            "The runtime and tooling that builds, runs, and monitors " +
            "integration flows and connectors between systems — the build-and-" +
            "run substrate of the connectivity estate.",
          examples: [
            "MuleSoft Anypoint",
            "Boomi",
            "Microsoft Azure Integration Services / Logic Apps",
            "Workato",
            "SAP Integration Suite",
          ],
        },
        {
          name: "API gateway & full-lifecycle management",
          role:
            "Secures, routes, rate-limits, versions, and publishes APIs, with a " +
            "catalog and developer portal — the governed front door to the API " +
            "estate.",
          examples: [
            "Apigee",
            "Kong",
            "AWS API Gateway",
            "Azure API Management",
            "MuleSoft / IBM API Connect",
          ],
        },
        {
          name: "Event streaming / messaging backbone",
          role:
            "Transports events between producers and consumers for " +
            "near-real-time, decoupled, and reactive/agentic integration.",
          examples: [
            "Apache Kafka / Confluent",
            "AWS Kinesis / EventBridge",
            "Azure Event Hubs / Service Bus",
            "RabbitMQ / Solace",
          ],
        },
        {
          name: "B2B / EDI gateway",
          role:
            "Handles external trading-partner connectivity, protocols, " +
            "message standards, and partner lifecycle for partner data exchange.",
          examples: [
            "IBM Sterling B2B Integrator",
            "OpenText / Cleo",
            "SPS Commerce",
            "Boomi B2B/EDI",
          ],
        },
        {
          name: "Integration observability & developer experience",
          role:
            "Monitors flows/APIs end-to-end, traces transactions across hops, " +
            "and provides the developer-portal experience that drives self-" +
            "service and reuse.",
          examples: [
            "Gateway-native analytics (Apigee/Kong/Azure APIM)",
            "Datadog / Dynatrace (API + flow observability)",
            "OpenTelemetry distributed tracing",
            "Backstage / portal developer experience",
          ],
        },
      ],
      roles: [
        {
          title: "Head of Integration / API Platform",
          accountability:
            "The integration & API strategy, the reuse operating model, and the " +
            "reliability, cost, and reach of the connectivity fabric — owns " +
            "whether the point-to-point tax is being lifted.",
        },
        {
          title: "Integration Center of Excellence (CoE) Lead",
          accountability:
            "Standards, the pattern/template library, governance, and federated " +
            "delivery enablement — turning reuse from aspiration into the path " +
            "of least resistance.",
        },
        {
          title: "API Product Owner",
          accountability:
            "APIs as products: consumer experience, lifecycle/versioning/" +
            "deprecation, adoption, and (where external) packaging and " +
            "monetization.",
        },
        {
          title: "Integration / Solution Architect",
          accountability:
            "Pattern selection, contract and event-schema design, and the " +
            "system/process/experience layering of integrations.",
        },
        {
          title: "B2B / Partner Integration Lead",
          accountability:
            "External trading-partner connectivity, onboarding speed, EDI/B2B " +
            "standards, and the reliability of revenue-bearing partner flows.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Open Banking / PSD2 and regulated open-API mandates",
          relevance:
            "In banking and other regulated sectors, APIs are mandated and " +
            "standardized (consent, strong authentication, data-sharing), making " +
            "API management a compliance object and partner integration a " +
            "regulatory interface, not just an engineering choice.",
        },
        {
          name: "Data privacy & cross-border transfer (GDPR / CCPA / residency)",
          relevance:
            "APIs and integration flows move personal data across system and " +
            "organizational boundaries, triggering consent, minimization, " +
            "access-control, logging, and cross-border-transfer obligations that " +
            "the gateway and flows must enforce and evidence.",
        },
        {
          name: "API & application security standards (OWASP API Top 10, OAuth2/OIDC)",
          relevance:
            "Exposed APIs are a primary attack surface; authentication/" +
            "authorization standards and the OWASP API security risks shape " +
            "gateway policy, scopes, and what may be exposed to which consumers " +
            "and agents.",
        },
        {
          name: "B2B/EDI transaction standards (e.g. ANSI X12, EDIFACT, sector mandates)",
          relevance:
            "Partner data exchange follows industry message standards and, in " +
            "some sectors, regulated transaction formats — shaping mapping, " +
            "validation, certification, and partner onboarding.",
        },
      ],
      canonicalTerms: [
        {
          term: "Point-to-point integration",
          definition:
            "A bespoke one-to-one connection built between two systems for a " +
            "single need; many of them produce the O(n^2) interface-sprawl tax " +
            "that dominates integration maintenance cost.",
        },
        {
          term: "API-led / layered connectivity",
          definition:
            "Organizing integration into reusable system, process, and " +
            "experience API layers so new needs compose from existing assets " +
            "rather than spawning new point-to-point pipes.",
        },
        {
          term: "iPaaS",
          definition:
            "Integration Platform as a Service — a cloud platform with " +
            "connectors, runtime, and tooling for building and running " +
            "integrations, the modern successor to the on-prem ESB.",
        },
        {
          term: "Event-driven architecture (EDA)",
          definition:
            "An integration style where systems publish and subscribe to events " +
            "via a broker, decoupling producers from consumers and enabling " +
            "near-real-time, reactive, and agentic flows.",
        },
        {
          term: "API gateway / full-lifecycle management",
          definition:
            "The managed control point that secures, routes, rate-limits, " +
            "versions, catalogs, and publishes APIs, plus the developer portal " +
            "for self-service discovery and onboarding.",
        },
        {
          term: "B2B / EDI",
          definition:
            "Business-to-business electronic data interchange — exchanging " +
            "structured transaction documents with trading partners over " +
            "standards (X12/EDIFACT) and protocols (AS2/SFTP/API).",
        },
        {
          term: "Canonical data model",
          definition:
            "A shared, system-agnostic data model that integrations map to, so " +
            "each system maps once to the canonical form rather than bespoke " +
            "to every other system — a core reuse and anti-sprawl mechanism.",
        },
        {
          term: "API product / monetization",
          definition:
            "Treating an API as a managed product with an owner, consumer " +
            "experience, lifecycle policy, and (where external) packaging, " +
            "pricing, and a partner program — versus exposing APIs as technical " +
            "project exhaust.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Integration estate composition (reuse vs point-to-point)",
        authoritativeSource:
          "Integration platform / API gateway inventory classified by reuse " +
          "type, with consumer counts per asset",
        whatGoodEvidenceLooksLike:
          "A classified inventory showing the reusable-vs-point-to-point split " +
          "and consumers-per-API, plus the integration team's run/build capacity " +
          "allocation — evidencing the actual point-to-point tax.",
        weakEvidenceToReject:
          "A vendor 'API-led delivers 3x reuse' claim or a count of APIs with " +
          "no consumer/reuse data — an API count is not a reuse measure.",
      },
      {
        claim: "Integration cost and maintenance burden",
        authoritativeSource:
          "Integration team time/cost allocation (run/maintenance vs new build) " +
          "plus integration-tooling and middleware spend",
        whatGoodEvidenceLooksLike:
          "The split of integration capacity and spend between maintaining " +
          "existing integrations and delivering new value, trended over time — " +
          "quantifying the run tax and its direction.",
        weakEvidenceToReject:
          "A single total integration/middleware budget line with no run-vs-" +
          "build split or no attribution to the maintenance burden.",
      },
      {
        claim: "Integration reliability, availability & incidents",
        authoritativeSource:
          "API gateway / integration observability (per-flow SLA, latency, " +
          "error rates) and the integration incident log",
        whatGoodEvidenceLooksLike:
          "Availability/SLA attainment and incident counts per API and flow with " +
          "time-to-detect and a consumer/partner-facing split, scoped to " +
          "business-critical integrations.",
        weakEvidenceToReject:
          "A blanket 'our integrations are reliable' with no per-flow SLA data " +
          "or incident detection evidence (especially if incidents are found by " +
          "consumers).",
      },
      {
        claim: "API adoption, reuse & consumption value",
        authoritativeSource:
          "Developer-portal and API-gateway analytics (self-service onboarding, " +
          "consumers-per-API, call-volume and — where monetized — billed-usage " +
          "trends)",
        whatGoodEvidenceLooksLike:
          "Self-service adoption rate, reuse rate per API, and consumption-growth " +
          "trends tied to named consuming use cases (and, for external APIs, " +
          "billed usage) — demand pulled, not assumed.",
        weakEvidenceToReject:
          "An 'API strategy' or projected consumption with no portal/gateway " +
          "analytics, no named consumers, and no actual usage trend behind it.",
      },
      {
        claim: "Integration cost embedded in a modernization/AI initiative",
        authoritativeSource:
          "Dependency map of integrations into/out of the affected systems plus " +
          "the initiative's integration scope and cost line",
        whatGoodEvidenceLooksLike:
          "A mapped, costed inventory of the integrations the initiative must " +
          "rebuild or wrap, with the governed access path AI/automation will use " +
          "— making the hidden integration cost explicit.",
        weakEvidenceToReject:
          "A modernization/AI business case with a thin or absent integration " +
          "line and no dependency mapping — integration assumed away.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How many of your production integrations are reusable, governed assets versus bespoke point-to-point pipes — and what share of the integration team's time goes to maintaining existing connections rather than building new value?",
      "Can a developer or partner discover, trust, and self-service onboard to your APIs through a portal — or is your 'API platform' really point-to-point integration behind a gateway with little actual reuse?",
      "For your top modernization or AI initiative, have the integrations into and out of the affected systems been mapped and costed — or is integration a hidden assumption in the plan?",
      "Which of your integrations are event-driven/real-time versus overnight batch, and are any real-time or agentic use cases blocked because the underlying data only moves on a schedule?",
      "How long does it take to onboard a new trading partner or API consumer to production, and is onboarding templated and self-service or a bespoke project every time?",
      "When an integration or API breaks, do you detect it before the consumer or partner does — and can you trace a transaction end-to-end across every hop to find where it failed?",
      "Are your APIs managed as products — with owners, lifecycle/versioning/deprecation policy, and (where external) a monetization or partner model — or are they technical exhaust from projects?",
    ],
    maturitySignals: [
      "New integration needs compose from existing reusable, cataloged assets — the reuse rate is well above one and point-to-point builds are the exception, not the default.",
      "An Integration CoE governs a small set of well-adopted standardized patterns, and delivery teams self-serve from a developer portal rather than queuing for the integration team.",
      "Integration flows and APIs are observable end-to-end with per-flow SLAs, so incidents are detected and contained before consumers and partners notice.",
      "An event-driven backbone exists for the use cases that need real-time/agentic flows, and a governed API/event layer is the safe execution surface for AI actions.",
    ],
    redFlags: [
      "Most integrations are bespoke point-to-point pipes and the integration team spends the majority of its capacity on maintenance — the sprawl tax is high and rising.",
      "A gateway/catalog was bought but reuse and self-service adoption are low — the 'API platform' has become another undiscoverable, ungoverned silo.",
      "A modernization or AI initiative has a thin integration line and is discovering undocumented dependencies late — the hidden integration cost is about to blow up the plan.",
      "Integration failures are found by consumers and partners rather than monitors — there is no end-to-end observability and trust erodes with every silent break.",
      "The estate is overwhelmingly overnight batch, so real-time and agentic use cases are blocked even though 'the integration exists'.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Integration platform / iPaaS (MuleSoft, Boomi, Workato, SAP Integration Suite)",
        category: "iPaaS / ESB — build-and-run integration substrate",
        switchingCost:
          "High — integration flows, connectors, and the team's skills embed deeply, and re-platforming the estate is a multi-year program; the assets are portable in principle but rarely in practice.",
        renewalDynamics:
          "Often capacity/core-or-connection-based or consumption pricing; the lever is right-sizing capacity and rationalizing redundant connectors, not switching platforms — watch connection/core-count definitions at renewal.",
      },
      {
        vendorName: "API management (Apigee, Kong, Azure APIM, AWS API Gateway, IBM API Connect)",
        category: "API gateway + full-lifecycle management",
        switchingCost:
          "Moderate-to-high — gateway policies, developer-portal content, and consumer subscriptions accumulate; cloud-native gateways bundled with the platform create gravity toward the cloud vendor's stack.",
        renewalDynamics:
          "Call-volume, API-count, or seat-based pricing, frequently bundled into the cloud provider's suite; pressure to consolidate onto the platform vendor's gateway is a recurring renewal dynamic.",
      },
      {
        vendorName: "Event streaming (Confluent / Kafka, AWS, Azure, Solace)",
        category: "Event broker / streaming backbone",
        switchingCost:
          "Moderate-to-high — topic schemas, producers/consumers, and stream-processing logic accrete; open-source Kafka caps lock-in but managed-service operational dependence is real.",
        renewalDynamics:
          "Throughput/partition or consumption-based pricing that can scale with data volume; negotiate committed throughput tiers and watch the open-source-vs-managed cost crossover.",
      },
      {
        vendorName: "B2B / EDI (IBM Sterling, OpenText, Cleo, SPS Commerce)",
        category: "B2B/EDI gateway + trading-partner network",
        switchingCost:
          "Very high — trading-partner maps, certifications, and network membership are deeply embedded and partner-by-partner re-onboarding is painful; network effects make established B2B networks especially sticky.",
        renewalDynamics:
          "Per-partner/per-document or network-membership pricing; switching risks disrupting revenue-bearing partner flows, so leverage is limited — focus on rationalizing partner counts and document volumes.",
      },
      {
        vendorName: "Integration observability / developer experience (Datadog, Dynatrace, gateway-native, Backstage)",
        category: "API + flow observability and developer portal",
        switchingCost:
          "Moderate — instrumentation and dashboards are re-creatable, but accumulated traces, baselines, and portal content create stickiness; OpenTelemetry reduces lock-in for tracing.",
        renewalDynamics:
          "Host/volume or seat-based subscription; consolidate onto a primary observability platform and watch data-ingest-volume cost growth at renewal.",
      },
    ],
    switchingCosts:
      "The B2B/EDI network and the integration runtime are the stickiest tiers " +
      "(trading-partner certifications and embedded flows), and the API gateway " +
      "is increasingly absorbed into the cloud provider's bundle — so the " +
      "negotiable frontier is consumption-tier re-pricing, connector/partner " +
      "rationalization, and disciplining platform-native gateway pricing against " +
      "best-of-breed. The strategic risk is cloud-vendor bundling absorbing the " +
      "gateway, iPaaS, and event tiers and eroding best-of-breed leverage, " +
      "traded against the integration simplicity that consolidation can buy.",
    negotiationLevers: [
      "Right-size capacity/connection/core or throughput commitments to forecast volume and rationalize redundant connectors/flows before committing",
      "Discipline platform-native gateway/iPaaS/event pricing against best-of-breed alternatives — use the bundle-vs-best-of-breed tension as leverage",
      "Watch usage-based pricing definitions (calls, connections, partners, documents, throughput) and negotiate volume tiers and caps as consumption grows",
      "Tie governance/observability tooling terms to measured outcomes (reuse rate, incident reduction, self-service adoption), not seat counts",
      "Pilot-to-scale gating per platform with reuse/SLA proof before enterprise commitment, and avoid partner-network lock-in by keeping B2B mappings portable",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      reuse_composition_claim: [
        "integration inventory classified by reusable-asset vs point-to-point",
        "consumers-per-API / reuse-rate data, not a raw API count",
      ],
      cost_maintenance_claim: [
        "integration team run-vs-build capacity allocation",
        "integration-tooling/middleware spend trended over time",
      ],
      reliability_claim: [
        "per-flow/per-API SLA and availability attainment",
        "incident counts with time-to-detect and consumer/partner-facing split",
      ],
      adoption_consumption_claim: [
        "developer-portal self-service adoption telemetry",
        "consumers-per-API and consumption-growth tied to named use cases (billed usage where monetized)",
      ],
      hidden_integration_cost_claim: [
        "dependency map of integrations into/out of the affected systems",
        "the initiative's integration scope and cost line (not assumed away)",
      ],
      value_projection: [
        "use-case-up sizing (value pulled by named initiatives, plus monetization only where an external API product exists)",
        "benchmark planning-range",
        "explicit haircut factors including reuse-without-governance and migration drag",
        "attribution of enablement value to the enabled initiative, not the integration line",
      ],
    },
    citationStandard:
      "Quantitative integration/API claims cite the gateway/iPaaS/observability/" +
      "portal source and the period, and reuse claims cite consumer/reuse data " +
      "rather than a raw API count. Value projections are sized USE-CASE-UP — the " +
      "named initiative that pulls the value, a labelled planning range, the " +
      "haircut factors applied (especially reuse-without-governance and " +
      "migration drag), enablement value attributed to the enabled initiative " +
      "rather than the integration line, and external API-monetization revenue " +
      "claimed only where a real API product and demand exist — never a " +
      "standalone 'API-led delivers X ROI' number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Reuse savings are projected from a gateway/catalog purchase without a governance and adoption operating model — flag the reuse-without-governance risk and reframe reuse as an outcome of governance, not of buying a platform.",
      "A modernization or AI value case has a thin integration line — surface integration as the hidden cost and frame timelines/budgets as gated by connectivity rework until the dependencies are mapped and costed.",
      "Reuse is asserted from an API count rather than consumer/reuse data — distinguish 'we have N APIs' from 'APIs are actually reused' (reuse rate, self-service adoption).",
      "Vendor reuse/ROI benchmarks are cited — mark as provider claims pending validation against the tenant's own gateway/iPaaS/observability telemetry.",
    ],
    inferenceLanguage: [
      "Across enterprise integration estates at this scale, the point-to-point tax typically shows up as a maintenance share of...",
      "Without your classified integration inventory, the industry pattern is that most integrations are point-to-point and reuse rates sit near...",
      "Peer programs commonly realize delivery-lead-time compression of... once a reusable, governed, pattern-led fabric is in place...",
      "Treating this as a planning range pulled by named initiatives rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI for this tenant's API/integration program absent named consuming use cases and reuse data",
      "This tenant's actual reuse rate, integration-maintenance share, or API-consumption figures",
      "A claim that the API estate 'drives reuse' without consumers-per-API and self-service-adoption evidence",
      "External API-monetization revenue without a real API product, packaging, and demand signal",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "integration cost breakdown / where does integration spend and capacity go (run vs build)",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack integration capacity and spend by maintenance/run vs new-build (and by point-to-point vs reusable) to expose the point-to-point tax and whether it is rising.",
    },
    {
      questionPattern:
        "integration & API value story / use-case-pulled value net of haircuts",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross integration value to net realizable, subtracting the reuse-without-governance, migration-drag, adoption, and API-monetization-optimism haircuts.",
    },
    {
      questionPattern:
        "reuse / availability / incident / consumption trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend reusable-integration ratio, API reuse rate, availability/SLA, incident rate, or consumption growth against planning ranges to show whether the fabric is maturing or accruing tax.",
    },
    {
      questionPattern:
        "integration estate / dependency and reuse map (what connects to what)",
      exhibitKind: "graph",
      note: "Graph of systems, APIs/events, and consumers to visualize point-to-point sprawl, reuse hubs, and the integration dependencies a modernization/AI initiative must rebuild.",
    },
    {
      questionPattern: "integration & API management KPI scorecard",
      exhibitKind: "table",
      note: "Reusable ratio, API reuse rate, delivery lead time, availability/SLA, maintenance % of budget, standardized patterns, self-service adoption, event/batch mix, incident rate, partner-onboarding time, consumption growth vs planning ranges.",
    },
    {
      questionPattern:
        "API portfolio / reuse and self-service heatmap by API or domain",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of APIs/domains against reuse, self-service adoption, availability, and governance status to find ungoverned-silo APIs and reuse opportunities.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The program is governed by an Integration CoE with adopted standards and reusable patterns, so reuse is the path of least resistance rather than an aspiration",
      "Investment is pulled by named initiatives (a high-traffic flow, a modernization, an AI use case, a partner program) instead of a 'build the platform' thesis",
      "End-to-end observability and per-flow SLAs make the fabric trustworthy, so consumers stop building shadow point-to-point pipes",
      "APIs are managed as products with owners and lifecycle policy, and a governed API/event layer becomes the safe execution surface for real-time and agentic use cases",
    ],
    failureDrivers: [
      "A gateway/iPaaS is bought but not governed — the API estate becomes another undiscoverable silo and reuse never materializes (reuse-without-governance)",
      "Integration is treated as a hidden assumption in modernization/AI plans and blows up the timeline when the real connectivity rework surfaces",
      "Delivery teams bypass the CoE with shadow point-to-point integrations because central delivery is too slow, leaving the maintenance tax in place",
      "The estate stays batch-bound with no observability, so real-time/agentic use cases are blocked and failures surface to consumers and partners",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption follows reuse, and reuse follows governance plus a credible " +
      "self-service experience. A first reusable API/event on a high-traffic " +
      "flow proves the model to one team; a developer portal, standardized " +
      "patterns, and dependable SLAs then pull adjacent teams off bespoke " +
      "point-to-point builds. Partner and external/monetized API consumption " +
      "are the lagging, higher-variance waves that depend on real external " +
      "demand. The slow, decisive unlock is delivery-team behavior: until teams " +
      "stop building shadow integrations because the governed path is faster, " +
      "the platform is built but not pulled. Platform/integration engineers " +
      "adopt first; broad delivery-team self-service and agentic API consumption " +
      "are the value-defining later waves.",
    roiClarity: "medium",
    roiClarityBasis:
      "The efficiency levers — maintenance/run-cost reduction, delivery-speed " +
      "improvement, partner-onboarding compression — are directly measurable in " +
      "team capacity, tooling spend, and onboarding timestamps, so that slice of " +
      "ROI is firm. The larger enablement value — faster modernization, " +
      "real-time/agentic use cases, partner/API-product revenue unlocked by a " +
      "reusable, governed fabric — is real but soft: it is correctly attributed " +
      "to the initiatives it enables, not to the integration line, and external " +
      "API-monetization revenue carries genuine demand uncertainty. That is why " +
      "the evidence and hedge rules force use-case-up sizing, attribute " +
      "enablement value to the enabled initiative, and discount hard for " +
      "reuse-without-governance and migration drag.",
  },

  regulatoryFrame: {
    name: "API security & regulated open-API/data-sharing duties",
    relevance:
      "The dominant regulatory frame for the integration & API layer: exposed " +
      "APIs are a primary attack surface governed by authentication/" +
      "authorization standards (OAuth2/OIDC) and the OWASP API security risks, " +
      "and in regulated sectors open-API mandates (e.g. Open Banking/PSD2) " +
      "standardize consent, strong authentication, and data sharing — making API " +
      "management a compliance object, not just an engineering choice. Data " +
      "privacy and cross-border-transfer rules (GDPR/CCPA/residency) apply to " +
      "the personal data flowing through integrations and APIs, and B2B/EDI " +
      "transaction standards govern partner exchange (see vocabulary." +
      "regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
