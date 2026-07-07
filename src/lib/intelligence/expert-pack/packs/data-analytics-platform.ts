// Consilium expert — Data & Analytics Platform / Data Engineering (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the modern data stack: ingestion/ELT, lakehouse/warehouse,
// data quality & observability, governance/catalog, semantic layer, and
// BI/self-serve analytics — the data foundation every AI initiative depends on.
//
// CORE DOCTRINE — DATA IS THE BINDING CONSTRAINT, USE-CASE PULL IS THE ENGINE.
// Two honesty rules drive every recommendation:
//   (1) Data quality + governance are the binding constraint for AI. Models
//       are commoditizing; trustworthy, documented, owned, model-ready data is
//       not. An AI program that skips the data foundation fails on data, not on
//       the model. The most expensive AI failure is a confident answer over bad
//       data.
//   (2) "Build the platform" can become a cost center without use-case pull. A
//       lakehouse with no consuming product is depreciation, not value. Value is
//       realized at the point of consumption (a decision, a product feature, an
//       AI agent), never at the point of ingestion. Platform spend must be
//       pulled by named use cases, not pushed on a "modernize the stack" thesis.
// Product-aware (Snowflake/Databricks/BigQuery, dbt, Fivetran, etc.), not
// product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const dataAnalyticsPlatformExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.data-analytics-platform",
    expertName: "Data & Analytics Platform Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "data-analytics-platform",
    scopeNote:
      "Cross-cutting transformation of the enterprise data & analytics platform " +
      "and data engineering: ingestion/ELT, lakehouse/warehouse, transformation, " +
      "data quality & observability, governance/catalog/lineage, the semantic " +
      "layer, and BI/self-serve analytics — the data foundation AI depends on. " +
      "Doctrine: data quality + governance are the BINDING CONSTRAINT for every " +
      "AI initiative, and platform build without USE-CASE PULL becomes a cost " +
      "center. Value is realized at the point of consumption (a decision, a " +
      "product feature, an AI agent), never at ingestion. Excludes the AI/ML " +
      "model layer itself (MLOps, model risk), AI governance policy, and " +
      "application-specific analytics product design (separate experts) — this " +
      "expert owns the data substrate and its trustworthiness.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "data_freshness_latency",
        name: "Data freshness / pipeline latency",
        definition:
          "Elapsed time from a source event/record to its availability in the " +
          "consumption layer (warehouse/lakehouse table or semantic model) that " +
          "decisions and products read from.",
        unit: "minutes / hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 1440,
          basis:
            "Modern-data-stack ranges; near-real-time CDC pipelines in minutes, " +
            "batch warehouses daily (1440 min); latency target follows the use " +
            "case, not the platform",
          label: "planning-range",
        },
        dataSource:
          "Orchestrator run logs (e.g. Airflow/Dagster) and ingestion-tool " +
          "sync timestamps versus source event time",
        whyItMatters:
          "Freshness is the SLA the business actually feels. Over-engineering " +
          "everything to real-time burns cost; under-serving a real-time use " +
          "case kills adoption. Latency must be set per consuming use case.",
      },
      {
        key: "pipeline_reliability_sla",
        name: "Pipeline reliability / SLA attainment",
        definition:
          "Share of production data pipelines that complete successfully and " +
          "land within their freshness SLA over the period (the data equivalent " +
          "of uptime).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.9,
          basis:
            "Data-platform operations benchmarks; mature platforms run " +
            "95-99%+ on critical pipelines, ad-hoc estates well below",
          label: "planning-range",
        },
        dataSource:
          "Orchestrator success/failure history and data-observability SLA " +
          "monitors",
        whyItMatters:
          "Silent pipeline failures are how trust dies — a stale or broken table " +
          "that still looks live poisons every downstream decision and AI answer. " +
          "Reliability is the precondition for self-serve and for AI grounding.",
      },
      {
        key: "data_quality_score",
        name: "Data quality score",
        definition:
          "Composite pass rate of automated data-quality tests across the " +
          "dimensions completeness, validity, uniqueness, freshness, and " +
          "consistency on governed datasets.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Data-quality program ranges; governed critical-data domains " +
            "target 98%+, ungoverned long-tail far lower",
          label: "planning-range",
        },
        dataSource:
          "Data-quality/observability tooling (e.g. dbt tests, Great " +
          "Expectations, Monte Carlo) test results over the test suite",
        whyItMatters:
          "The binding constraint, made measurable. AI amplifies bad data into " +
          "confident wrong answers; a high, monitored quality score on critical " +
          "data is the precondition for trustworthy analytics and AI grounding.",
      },
      {
        key: "pct_data_documented",
        name: "% data documented / cataloged",
        definition:
          "Share of governed/critical datasets that carry a catalog entry with " +
          "description, ownership, classification, and lineage in the data " +
          "catalog.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Data-governance maturity ranges; few enterprises exceed 90% on the " +
            "long tail, mature programs reach high coverage on critical domains",
          label: "planning-range",
        },
        dataSource:
          "Data catalog coverage report (cataloged assets over total governed " +
          "assets)",
        whyItMatters:
          "Undocumented data is unusable data — analysts cannot trust it and AI " +
          "cannot be grounded on it. Documentation coverage on critical domains " +
          "is the gateway to both self-serve and AI readiness.",
      },
      {
        key: "time_to_onboard_source",
        name: "Time to onboard a new data source",
        definition:
          "Elapsed time from a request for a new data source to that source " +
          "being ingested, modeled, quality-tested, and available for " +
          "consumption.",
        unit: "days / weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 30,
          basis:
            "ELT/data-engineering ranges; connector-supported sources in days, " +
            "bespoke or governed-sensitive sources in weeks",
          label: "planning-range",
        },
        dataSource:
          "Data-engineering intake/ticketing system from request to production " +
          "availability",
        whyItMatters:
          "The agility unit of the platform. Slow onboarding pushes teams to " +
          "build shadow pipelines (sprawl), and it is the most common bottleneck " +
          "between a funded use case and the data it needs.",
      },
      {
        key: "query_compute_cost",
        name: "Query / compute cost (cost per workload)",
        definition:
          "Cloud data-platform compute and storage spend, attributable to " +
          "workloads/teams, normalized per query, per pipeline run, or per " +
          "consuming team.",
        unit: "USD / workload",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 5,
          basis:
            "FinOps-for-data ranges; highly variable by warehouse sizing, " +
            "query efficiency, and materialization strategy — a planning " +
            "anchor, not a target",
          label: "planning-range",
        },
        dataSource:
          "Cloud data-platform billing/usage telemetry attributed by " +
          "workload/warehouse/team",
        whyItMatters:
          "Consumption-priced platforms turn inefficiency into a runaway bill. " +
          "Unattributed compute cost is where 'build the platform' quietly " +
          "becomes a cost center; cost-per-workload makes the use-case pull test " +
          "real.",
      },
      {
        key: "self_serve_adoption_pct",
        name: "Self-serve analytics adoption",
        definition:
          "Share of target business users actively consuming governed data " +
          "(certified dashboards, semantic-layer queries, or notebooks) on a " +
          "recurring basis.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "BI adoption benchmarks; broad self-serve rarely exceeds 40-60% of " +
            "the addressable population even in mature shops",
          label: "planning-range",
        },
        dataSource:
          "BI/semantic-layer usage telemetry (monthly active users over the " +
          "addressable population)",
        whyItMatters:
          "Adoption is the only proof the platform created value rather than " +
          "cost. Low self-serve adoption means decisions still route through a " +
          "central analytics bottleneck — the platform was built but not pulled.",
      },
      {
        key: "data_incident_rate",
        name: "Data incident rate",
        definition:
          "Count of data incidents (broken/stale/wrong-data events that reach a " +
          "consumer) per period, normalized per N pipelines or per N datasets.",
        unit: "incidents / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 20,
          basis:
            "Data-observability ranges per 100 pipelines/month; mature " +
            "observability shops detect-and-resolve before consumers notice",
          label: "planning-range",
        },
        dataSource:
          "Data-observability/incident-management system (detected + " +
          "user-reported data incidents)",
        whyItMatters:
          "Each consumer-facing incident erodes the trust that took months to " +
          "build. The trend (and time-to-detect) is the truest read on whether " +
          "the data foundation is dependable enough to ground AI.",
      },
      {
        key: "pct_critical_data_with_owners",
        name: "% critical data with assigned owners",
        definition:
          "Share of critical data elements/domains that have a named, " +
          "accountable data owner (and steward) recorded in the governance " +
          "registry.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Data-governance maturity ranges; mature programs assign owners to " +
            "nearly all critical data, immature ones leave it ambiguous",
          label: "planning-range",
        },
        dataSource:
          "Data-governance registry / catalog ownership assignments on the " +
          "critical-data inventory",
        whyItMatters:
          "Ownership is where quality and governance become real accountability " +
          "rather than a policy PDF. Unowned critical data is the root cause of " +
          "most quality decay and is a hard blocker for trustworthy AI.",
      },
      {
        key: "model_ready_data_coverage",
        name: "Model-ready data coverage",
        definition:
          "Share of the data needed by funded AI/ML use cases that is " +
          "available, documented, quality-assured, access-governed, and " +
          "feature/embedding-ready (the AI-readiness measure of the substrate).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "AI-readiness assessment ranges; most enterprises find a large gap " +
            "between data that exists and data that is AI-consumable",
          label: "planning-range",
        },
        dataSource:
          "AI/ML use-case data-requirements mapped against catalog readiness " +
          "(quality, documentation, access, feature/embedding availability)",
        whyItMatters:
          "The direct measure of the binding constraint. It reframes 'are we " +
          "ready for AI' from a model question into a data question — and " +
          "exposes the gap between data the enterprise has and data AI can use.",
      },
      {
        key: "semantic_metric_consistency",
        name: "Certified metric / definition consistency",
        definition:
          "Share of board/operating metrics that resolve to a single certified " +
          "definition in the semantic layer rather than multiple conflicting " +
          "report-level definitions.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Semantic-layer / metrics-governance ranges; few enterprises reach " +
            "full certification, mature ones govern the core metric set",
          label: "planning-range",
        },
        dataSource:
          "Semantic-layer / metrics-store registry of certified definitions " +
          "versus the universe of reported metrics",
        whyItMatters:
          "'Whose number is right?' is the boardroom symptom of an ungoverned " +
          "semantic layer. A single certified definition per metric is what lets " +
          "executives — and AI agents — trust an answer without re-deriving it.",
      },
    ],

    painThemes: [
      {
        key: "garbage_in_confident_out",
        name: "Garbage in, confident answer out",
        description:
          "Bad, undocumented, or stale data flows into dashboards and AI " +
          "systems that present results with full confidence and no provenance, " +
          "so wrong numbers drive decisions and AI answers are authoritatively " +
          "incorrect — the most expensive failure mode in the stack.",
        detectionSignal:
          "Low data-quality score on critical domains, conflicting numbers " +
          "across reports, AI/BI outputs with no lineage or freshness " +
          "indicator, recurring 'the data looks wrong' escalations.",
        diagnosticQuestion:
          "When a dashboard or AI answer shows a number, can a consumer trace " +
          "it to a quality-tested, owned, documented source — or is it trusted " +
          "on faith?",
      },
      {
        key: "platform_without_pull",
        name: "Platform build with no use-case pull",
        description:
          "A lakehouse/warehouse is modernized on a 'build it and they will " +
          "come' thesis with no named consuming use cases, so it accrues " +
          "ingestion and storage cost while value (decisions, products, AI) " +
          "never materializes — the platform becomes a depreciating cost center.",
        detectionSignal:
          "Rising platform spend with flat self-serve adoption, many ingested " +
          "sources with few consumers, roadmap framed as 'modernize the stack' " +
          "rather than tied to funded business outcomes.",
        diagnosticQuestion:
          "For each major data investment, which named, funded use case pulls " +
          "it — and what decision or product consumes the output today?",
      },
      {
        key: "data_silos_and_sprawl",
        name: "Data silos and pipeline sprawl",
        description:
          "Every team builds its own pipelines, copies, and 'shadow' " +
          "warehouses because central onboarding is slow, producing duplicated " +
          "data, inconsistent definitions, and an un-governable estate where no " +
          "one trusts anyone else's table.",
        detectionSignal:
          "Multiple copies of the same dataset, divergent metric definitions by " +
          "team, undocumented point-to-point pipelines, long source-onboarding " +
          "time driving teams to self-serve their own ingestion.",
        diagnosticQuestion:
          "How many independent copies of your key entities (customer, product, " +
          "transaction) exist, and do teams build shadow pipelines because " +
          "central onboarding is too slow?",
      },
      {
        key: "ungoverned_estate",
        name: "Ungoverned, undocumented estate",
        description:
          "Critical data has no owner, no catalog entry, no classification, and " +
          "no lineage, so analysts cannot find or trust data, compliance cannot " +
          "demonstrate control, and AI cannot be grounded on it — governance " +
          "exists as policy but not as operating reality.",
        detectionSignal:
          "Low documentation and ownership coverage, no enterprise lineage, " +
          "PII/sensitive data of unknown location, audit findings on data " +
          "controls, long 'where is the data' discovery time.",
        diagnosticQuestion:
          "What share of your critical data has a named owner, a catalog entry, " +
          "and end-to-end lineage — and could you prove where your sensitive " +
          "data lives?",
      },
      {
        key: "metric_definition_drift",
        name: "Conflicting metric definitions (semantic drift)",
        description:
          "The same KPI is computed differently in different reports because " +
          "logic lives in dashboards and SQL rather than a governed semantic " +
          "layer, so executives argue about whose number is right and AI agents " +
          "have no single source of truth to ground on.",
        detectionSignal:
          "Multiple definitions of revenue/active-user/churn across teams, " +
          "metric logic duplicated in BI tools, reconciliation meetings to " +
          "agree on numbers, low certified-metric consistency.",
        diagnosticQuestion:
          "Does each board metric resolve to ONE certified definition in a " +
          "semantic layer, or is the same metric re-implemented in every report?",
      },
      {
        key: "runaway_cloud_cost",
        name: "Runaway, unattributed cloud data cost",
        description:
          "Consumption-priced compute and storage grow faster than value " +
          "because queries are inefficient, materializations are wasteful, and " +
          "spend is not attributed to teams or use cases — so finance sees a " +
          "rising bill no one can explain or defend per outcome.",
        detectionSignal:
          "Compute cost growing faster than usage/value, no cost attribution by " +
          "team/workload, oversized warehouses left running, full-table scans on " +
          "every query, no FinOps practice for data.",
        diagnosticQuestion:
          "Can you attribute platform compute cost to teams and use cases, and " +
          "does the spend trend track delivered value or just usage?",
      },
      {
        key: "ai_data_readiness_gap",
        name: "AI data-readiness gap",
        description:
          "AI ambitions outrun the data foundation: the data an AI use case " +
          "needs exists somewhere but is not documented, quality-assured, " +
          "access-governed, or feature/embedding-ready — so AI pilots stall on " +
          "data wrangling and proofs-of-concept never reach production.",
        detectionSignal:
          "AI pilots spending most effort on data prep, low model-ready " +
          "coverage, no governed access path for AI to consume data, " +
          "POCs that work on a sample but cannot productionize on real data.",
        diagnosticQuestion:
          "For your top AI use cases, what share of the required data is " +
          "documented, quality-assured, access-governed, and feature/embedding-" +
          "ready today?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_data_quality_observability",
        name: "AI-assisted data quality & observability",
        valueMechanism:
          "ML-based anomaly detection learns normal data behavior (volume, " +
          "schema, freshness, distribution) and flags incidents before " +
          "consumers see them, while AI proposes and maintains quality tests — " +
          "raising the quality score and catching incidents early so trust in " +
          "the substrate holds.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Pipeline run history and table metadata for baselining",
          "Historical data profiles (volume, schema, distribution) over time",
          "Lineage to scope blast radius of an incident",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Alert fatigue if thresholds are untuned — incidents must be triaged, not just fired",
          "Auto-remediation (e.g. pausing a pipeline) needs a human-reviewed runbook",
        ],
        metricsMoved: [
          "data_quality_score",
          "data_incident_rate",
          "pipeline_reliability_sla",
        ],
      },
      {
        key: "ai_catalog_metadata_enrichment",
        name: "AI catalog & metadata enrichment",
        valueMechanism:
          "LLMs auto-generate dataset/column descriptions, suggest " +
          "classifications and PII tags, infer lineage, and recommend owners — " +
          "collapsing the manual documentation backlog so catalog coverage and " +
          "ownership reach the levels self-serve and AI grounding require.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Schema, sample data, and query logs to infer meaning and usage",
          "Existing catalog entries and glossary for consistency",
          "Classification policy to map sensitivity tags against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-suggested classifications/PII tags must be human-confirmed before they govern access",
          "Generated descriptions can be plausibly wrong — steward review required on critical data",
        ],
        metricsMoved: [
          "pct_data_documented",
          "pct_critical_data_with_owners",
          "model_ready_data_coverage",
        ],
      },
      {
        key: "text_to_sql_self_serve",
        name: "Conversational analytics (text-to-SQL on the semantic layer)",
        valueMechanism:
          "Business users ask questions in natural language and an LLM " +
          "generates governed queries AGAINST THE CERTIFIED SEMANTIC LAYER " +
          "(not raw tables), so answers use the one true metric definition — " +
          "broadening self-serve adoption beyond SQL-literate analysts without " +
          "fragmenting definitions.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A governed semantic layer with certified metric definitions",
          "Catalog metadata and synonyms for grounding the language model",
          "Row/column access policy so answers respect entitlements",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Text-to-SQL over raw tables (not the semantic layer) re-introduces definition drift — bind to the semantic layer",
          "Answers must carry the definition and lineage so users can verify, not just trust",
        ],
        metricsMoved: [
          "self_serve_adoption_pct",
          "semantic_metric_consistency",
        ],
      },
      {
        key: "ai_pipeline_engineering_copilot",
        name: "Data-engineering copilot (pipeline & transformation authoring)",
        valueMechanism:
          "An AI copilot drafts ingestion connectors, transformation/dbt models, " +
          "tests, and documentation from a spec, and assists incident triage — " +
          "compressing time-to-onboard a source and raising test coverage so the " +
          "engineering team scales without proportional headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Existing pipeline/transformation code and repo history",
          "Source and target schemas for the new pipeline",
          "Test and documentation conventions to follow",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated transformation logic must pass tests and code review before production",
          "Copilot must not embed credentials/secrets or bypass access controls in generated code",
        ],
        metricsMoved: [
          "time_to_onboard_source",
          "data_quality_score",
          "pipeline_reliability_sla",
        ],
      },
      {
        key: "ai_query_cost_optimization",
        name: "AI-driven query & cost optimization (FinOps for data)",
        valueMechanism:
          "ML analyzes query patterns and warehouse usage to recommend " +
          "materializations, warehouse sizing, partitioning, and idle-shutdown " +
          "and to attribute spend to workloads — bending the compute-cost curve " +
          "so platform spend tracks value rather than running away.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Query history and execution/cost telemetry by workload",
          "Warehouse sizing and scheduling configuration",
          "Workload-to-team/use-case attribution mapping",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-resizing/auto-suspend must respect SLA-critical workloads",
          "Optimization recommendations must be validated for correctness, not just cost",
        ],
        metricsMoved: [
          "query_compute_cost",
          "pipeline_reliability_sla",
        ],
      },
      {
        key: "feature_embedding_pipelines",
        name: "Feature & embedding pipelines (AI-ready data products)",
        valueMechanism:
          "Govern reusable feature pipelines and embedding/vector indexes as " +
          "first-class, documented, quality-tested data products, so AI/ML use " +
          "cases consume model-ready data instead of re-wrangling it — closing " +
          "the AI data-readiness gap and making the substrate the moat.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Cleaned, governed source data with quality and lineage",
          "Feature/embedding definitions tied to AI use-case requirements",
          "Access policy for AI consumers (governed retrieval path)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Training/serving skew if feature pipelines diverge from production data",
          "Embeddings can leak sensitive content — access and classification must carry through",
        ],
        metricsMoved: [
          "model_ready_data_coverage",
          "data_quality_score",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "lakehouse_medallion",
        name: "Lakehouse with medallion architecture",
        description:
          "A unified storage-and-compute platform organizing data in layered " +
          "zones — bronze (raw), silver (cleaned/conformed), gold (curated, " +
          "consumption-ready) — so quality and structure increase toward the " +
          "consumption layer and one platform serves BI, ad-hoc, and AI/ML.",
        boundary:
          "Owns storage, transformation, and the curated consumption layer; " +
          "does not own the source systems that feed it or the downstream " +
          "applications/AI models that consume gold.",
        humanAccountabilityPoint: "Head of Data Platform / Data Engineering",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "elt_orchestration_backbone",
        name: "ELT + orchestration backbone",
        description:
          "Connector-based ingestion (load raw, then transform in-warehouse) " +
          "with code-managed, tested transformations and a central orchestrator " +
          "scheduling and monitoring pipelines — the agility-and-reliability " +
          "spine that makes source onboarding fast and pipelines observable.",
        boundary:
          "Owns ingestion, transformation, and scheduling/monitoring; does not " +
          "own data quality policy or the semantic/metric definitions that sit " +
          "above the transformed tables.",
        humanAccountabilityPoint: "Data Engineering Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "governance_catalog_lineage",
        name: "Active governance: catalog, lineage & ownership",
        description:
          "A catalog as the single front door to data — descriptions, " +
          "classification, ownership, certified status, and end-to-end lineage " +
          "— wired into pipelines and access so governance is an operating " +
          "reality (find/trust/control data) rather than a policy document.",
        boundary:
          "Owns metadata, classification, lineage, and ownership accountability; " +
          "does not own the data content itself or the consumption tools — it " +
          "makes them trustworthy and discoverable.",
        humanAccountabilityPoint: "Chief Data Officer / Data Governance Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "semantic_layer_metrics_store",
        name: "Semantic layer / governed metrics store",
        description:
          "A central layer where business metrics and entities are defined ONCE " +
          "as certified, version-controlled definitions that every BI tool, " +
          "notebook, and AI agent queries against — so a metric means the same " +
          "thing everywhere and there is a single source of truth for both " +
          "humans and AI.",
        boundary:
          "Owns metric/entity definitions and certification; does not own the " +
          "underlying tables (the platform does) or the visualizations (the BI " +
          "tools do) — it is the contract between them.",
        humanAccountabilityPoint: "Analytics Lead / Metrics Governance Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "data_mesh_domain_products",
        name: "Domain-oriented data products (data-mesh-style)",
        description:
          "Decentralizing ownership so domain teams build and own governed " +
          "'data products' (documented, quality-SLA'd, discoverable) on a " +
          "shared self-serve platform with federated governance — scaling " +
          "ownership and onboarding where a central team becomes the bottleneck.",
        boundary:
          "Owns the operating model for distributed data ownership and the " +
          "self-serve platform standards; does not eliminate central governance " +
          "— it federates it. Fits large, mature estates, not every enterprise.",
        humanAccountabilityPoint: "Chief Data Officer (federated to domain data-product owners)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Data-platform value is realized at the POINT OF CONSUMPTION — a faster " +
        "or better decision, a data-driven product feature, or a trustworthy AI " +
        "answer — never at the point of ingestion. The platform itself is pure " +
        "cost until a named use case pulls value through it, so the value model " +
        "is built use-case-up, not platform-down. Two value engines run: (1) " +
        "efficiency — automation and self-serve reduce the analytics/engineering " +
        "labor and cloud cost per insight, and (2) enablement — a trustworthy, " +
        "documented, model-ready substrate UNLOCKS analytics and AI value that " +
        "could not be realized on a broken foundation. The second is larger but " +
        "softer: it is attributed to the use cases it enables, not to the " +
        "platform line item, which is why honest sizing credits the platform as " +
        "a multiplier on use-case value rather than a standalone ROI. The " +
        "binding constraint runs the other way: data quality and governance gate " +
        "how much of the theoretical value is realizable at all — a model-ready " +
        "coverage of 30% caps AI value at a fraction of the ambition regardless " +
        "of model spend.",
      dominantHaircutFactors: [
        {
          factor: "No use-case pull (platform-as-cost-center)",
          rationale:
            "Value attributed to platform build that has no named consuming " +
            "use case is largely illusory — the most common over-statement. " +
            "Forward value must be discounted to the value actually pulled " +
            "through by funded decisions, products, or AI.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between projected platform ROI and value realized " +
              "when consuming use cases are weak or unnamed",
            label: "planning-range",
          },
        },
        {
          factor: "Data quality & governance readiness (the binding constraint)",
          rationale:
            "Low quality, documentation, ownership, and model-ready coverage " +
            "cap how much analytics/AI value is realizable at all; value built " +
            "on a known-broken foundation must be discounted to the realizable " +
            "share, not the theoretical maximum.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Gap between theoretical use-case value and value realizable on " +
              "the current quality/governance/model-ready baseline",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption of self-serve & certified definitions",
          rationale:
            "Efficiency and enablement value require business users to actually " +
            "consume governed data via self-serve and trust certified metrics; " +
            "low adoption and persistent shadow analytics leave most of the " +
            "benefit unrealized.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "BI/self-serve adoption shortfall and continued reliance on " +
              "central analytics or shadow reports",
            label: "planning-range",
          },
        },
        {
          factor: "Cloud cost leakage (unattributed compute)",
          rationale:
            "Consumption-priced compute that is inefficient and unattributed " +
            "eats into net value; without FinOps discipline the gross benefit " +
            "is partly consumed by the bill it generates.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Share of gross efficiency benefit offset by runaway/un-optimized " +
              "platform compute cost",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Analytics/engineering labor efficiency (self-serve + copilot)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Reported reduction in analyst/engineer effort per insight from " +
              "self-serve, automation, and engineering copilots",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in analytics + data-engineering labor per " +
            "delivered insight/pipeline",
        },
        {
          lever: "Platform compute-cost optimization (FinOps for data)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Reported compute/storage cost reduction from materialization, " +
              "warehouse sizing, query optimization, and attribution",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in query_compute_cost at equal or higher " +
            "workload",
        },
        {
          lever: "Time-to-onboard / time-to-insight compression",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in source-onboarding and time-to-insight from " +
              "ELT, orchestration, catalog, and copilots",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_onboard_source and request-to-answer " +
            "cycle time",
        },
        {
          lever: "AI/analytics value enabled by a trustworthy substrate (multiplier)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Attributed to enabled use cases: share of AI/analytics value " +
              "that becomes realizable once data is model-ready and governed",
            label: "planning-range",
          },
          measuredAs:
            "Increment in realizable downstream use-case value attributable to " +
            "model_ready_data_coverage and data quality — credited to the use " +
            "case, not the platform line",
        },
      ],
      timeToValueBand:
        "First consuming use case on a curated gold/semantic slice: 1-3 " +
        "quarters (use-case-up, not boil-the-ocean). Data-quality/observability " +
        "and catalog coverage on critical domains: 2-4 quarters. Full platform " +
        "modernization + governance + semantic layer + AI-ready data products: " +
        "18-36 months, sequenced by use-case pull rather than by layer.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Cloud data platform (lakehouse / warehouse)",
          role:
            "The central storage-and-compute platform for analytical and AI " +
            "workloads — the consumption substrate everything reads from.",
          examples: [
            "Snowflake",
            "Databricks Lakehouse",
            "Google BigQuery",
            "Microsoft Fabric / Azure Synapse",
            "Amazon Redshift",
          ],
        },
        {
          name: "Ingestion / ELT tooling",
          role:
            "Connector-based extraction and loading of source data into the " +
            "platform, including change-data-capture for low-latency pipelines.",
          examples: [
            "Fivetran",
            "Airbyte",
            "Debezium / CDC",
            "Azure Data Factory",
          ],
        },
        {
          name: "Transformation & orchestration",
          role:
            "Code-managed, tested in-platform transformation and the scheduler " +
            "that runs, monitors, and sequences pipelines.",
          examples: ["dbt", "Apache Airflow", "Dagster", "Apache Spark"],
        },
        {
          name: "Governance, catalog & observability",
          role:
            "Metadata, classification, lineage, ownership, data-quality testing, " +
            "and incident detection — the trust layer over the platform.",
          examples: [
            "Collibra",
            "Alation",
            "Unity Catalog",
            "Monte Carlo",
            "Great Expectations",
          ],
        },
        {
          name: "Semantic layer & BI / self-serve analytics",
          role:
            "Certified metric/entity definitions and the visualization/query " +
            "surfaces business users and AI agents consume governed data through.",
          examples: [
            "dbt Semantic Layer / MetricFlow",
            "Cube",
            "Power BI",
            "Tableau",
            "Looker",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Data Officer (CDO)",
          accountability:
            "Enterprise data strategy, governance, quality, and the data " +
            "foundation's readiness to support analytics and AI; owns whether " +
            "the binding constraint is being lifted.",
        },
        {
          title: "Head of Data Platform / Data Engineering",
          accountability:
            "The reliability, freshness, cost, and scalability of the platform " +
            "and its pipelines — the operating SLA of the substrate.",
        },
        {
          title: "Data Governance / Data Quality Lead",
          accountability:
            "Catalog coverage, lineage, classification, ownership assignment, " +
            "and the data-quality program on critical data.",
        },
        {
          title: "Analytics Lead / Head of BI",
          accountability:
            "Certified metrics, the semantic layer, self-serve adoption, and " +
            "the trustworthiness of numbers reaching decision-makers.",
        },
        {
          title: "Data Product Owner (domain)",
          accountability:
            "A specific governed data product — its quality SLA, documentation, " +
            "discoverability, and the consumers it serves (in a mesh model).",
        },
      ],
      regulatoryFrames: [
        {
          name: "Data privacy & residency (GDPR / CCPA / regional localization)",
          relevance:
            "Personal data in the platform triggers classification, access " +
            "control, retention, subject-rights, and cross-border-transfer " +
            "obligations — governance and lineage are how compliance is proven.",
        },
        {
          name: "Sector data regulation (e.g. HIPAA, GLBA, PCI-DSS)",
          relevance:
            "Healthcare, financial, and cardholder data carry specific " +
            "handling, encryption, and access requirements that shape platform " +
            "architecture, classification, and who/what may consume the data.",
        },
        {
          name: "AI / data-act regimes (e.g. EU AI Act data-governance duties)",
          relevance:
            "Emerging AI regulation imposes data-quality, documentation, and " +
            "lineage obligations on data used to build/operate AI — making the " +
            "data foundation a compliance object, not just an engineering one.",
        },
        {
          name: "Financial-reporting & audit controls (e.g. SOX over data)",
          relevance:
            "Data feeding financial and regulated reporting must have controls, " +
            "lineage, and change management auditors can rely on — pipelines " +
            "become controlled systems.",
        },
      ],
      canonicalTerms: [
        {
          term: "Lakehouse",
          definition:
            "An architecture unifying data-lake storage with warehouse-style " +
            "management and performance, serving BI, ad-hoc, and AI/ML from one " +
            "governed platform.",
        },
        {
          term: "Medallion architecture (bronze/silver/gold)",
          definition:
            "Layered data zones of increasing quality and structure — raw " +
            "(bronze), cleaned/conformed (silver), curated consumption-ready " +
            "(gold).",
        },
        {
          term: "ELT vs ETL",
          definition:
            "Extract-Load-Transform loads raw data into the platform and " +
            "transforms it in-place (the modern default), versus ETL which " +
            "transforms before loading.",
        },
        {
          term: "Semantic layer / metrics store",
          definition:
            "A governed layer defining business metrics and entities once as " +
            "certified definitions every consumer (BI, notebook, AI) queries " +
            "against — the single source of truth for 'what a metric means'.",
        },
        {
          term: "Data observability",
          definition:
            "Monitoring the health of data and pipelines (freshness, volume, " +
            "schema, distribution, lineage) to detect and resolve incidents " +
            "before consumers are affected.",
        },
        {
          term: "Model-ready data",
          definition:
            "Data that is available, documented, quality-assured, access-" +
            "governed, and feature/embedding-ready for an AI/ML use case — the " +
            "AI-readiness measure of the substrate.",
        },
        {
          term: "Data product / data mesh",
          definition:
            "A domain-owned, documented, quality-SLA'd, discoverable data " +
            "asset; data mesh is the operating model that decentralizes such " +
            "products onto a shared self-serve platform with federated " +
            "governance.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Data quality and incident posture",
        authoritativeSource:
          "Data-quality/observability tooling test results and incident logs " +
          "over the governed dataset suite",
        whatGoodEvidenceLooksLike:
          "Quality test pass rates by dimension on named critical domains, with " +
          "incident counts, time-to-detect, and consumer-facing-incident split.",
        weakEvidenceToReject:
          "A vendor 'our customers reach 99% quality' claim with no link to the " +
          "tenant's own datasets or test suite.",
      },
      {
        claim: "Use-case pull / value realization",
        authoritativeSource:
          "Use-case-to-platform mapping: the funded decisions, products, or AI " +
          "use cases consuming each major data investment, plus consumption " +
          "telemetry",
        whatGoodEvidenceLooksLike:
          "Each major investment traced to a named, funded consuming use case " +
          "with measured consumption (queries, dashboard usage, AI calls) and " +
          "a decision/outcome it serves.",
        weakEvidenceToReject:
          "A 'modernize the stack will unlock value' assertion with no named " +
          "consuming use case or consumption evidence.",
      },
      {
        claim: "Platform cost and efficiency",
        authoritativeSource:
          "Cloud data-platform billing/usage telemetry attributed by workload, " +
          "warehouse, and team",
        whatGoodEvidenceLooksLike:
          "Compute and storage cost broken out by team/use case with " +
          "cost-per-workload trend, set against delivered value or usage.",
        weakEvidenceToReject:
          "A single total platform bill with no attribution by team, workload, " +
          "or use case.",
      },
      {
        claim: "Governance, documentation & ownership coverage",
        authoritativeSource:
          "Data catalog coverage and governance-registry reports on the " +
          "critical-data inventory",
        whatGoodEvidenceLooksLike:
          "Documentation, ownership, classification, and lineage coverage as a " +
          "share of CRITICAL data (not the whole estate), with the critical " +
          "inventory defined.",
        weakEvidenceToReject:
          "A blanket 'data is governed' or a whole-estate percentage that hides " +
          "low coverage on the critical domains that matter.",
      },
      {
        claim: "AI / model-ready data readiness",
        authoritativeSource:
          "AI/ML use-case data requirements mapped against catalog readiness " +
          "(quality, documentation, access, feature/embedding availability)",
        whatGoodEvidenceLooksLike:
          "Per top AI use case: the required data inventory with each element's " +
          "quality, documentation, access-governance, and feature/embedding " +
          "status — yielding an honest model-ready coverage figure.",
        weakEvidenceToReject:
          "A general 'we are AI-ready because we have a data lake' with no " +
          "use-case-level data-readiness mapping.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "For each major data investment, which named, funded use case pulls it — and what decision, product, or AI agent consumes the output today?",
      "When a dashboard or AI answer shows a number, can a consumer trace it to a quality-tested, owned, documented source — or is it trusted on faith?",
      "What share of your CRITICAL data has a named owner, a catalog entry, end-to-end lineage, and a known classification?",
      "For your top AI use cases, what share of the required data is documented, quality-assured, access-governed, and feature/embedding-ready today (model-ready coverage)?",
      "Does each board metric resolve to ONE certified definition in a semantic layer, or is the same metric re-implemented across reports and teams?",
      "Can you attribute platform compute cost to teams and use cases, and does the spend trend track delivered value or just usage?",
      "How long does it take to onboard a new data source to production-ready, and do teams build shadow pipelines because central onboarding is too slow?",
    ],
    maturitySignals: [
      "Every major data investment traces to a named, funded consuming use case — platform spend is pulled, not pushed.",
      "Data quality and observability are measured and managed on critical domains, with incidents detected before consumers see them.",
      "Critical data has assigned owners, catalog coverage, classification, and end-to-end lineage as an operating reality, not a policy PDF.",
      "Board metrics resolve to certified semantic-layer definitions, and AI consumes data through a governed, access-controlled path.",
    ],
    redFlags: [
      "Platform spend is rising while self-serve adoption is flat and no consuming use case is named — the platform is becoming a cost center.",
      "Dashboards and AI answers are trusted on faith — no lineage, no freshness, no quality signal behind the number.",
      "Critical data has no owner, no catalog entry, and unknown PII/sensitive-data location — governance is policy, not reality.",
      "AI pilots spend most of their effort on data wrangling and cannot productionize because the required data is not model-ready.",
      "The same KPI is computed differently across reports and the boardroom argues about whose number is right.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Cloud data platform (Snowflake, Databricks, BigQuery, Fabric)",
        category: "Lakehouse / warehouse — core consumption substrate",
        switchingCost:
          "Very high — data gravity, accumulated transformations, proprietary features, and consumer integrations make replatforming a multi-year program rarely undertaken.",
        renewalDynamics:
          "Consumption (credit/compute) or committed-capacity pricing; the lever is right-sizing commitments and optimizing workloads, not switching vendors.",
      },
      {
        vendorName: "Ingestion / ELT (Fivetran, Airbyte)",
        category: "Connector-based ingestion / CDC",
        switchingCost:
          "Moderate — connectors are re-configurable, but volume-based pricing and connector breadth create stickiness; open-source options reduce lock-in.",
        renewalDynamics:
          "Usage/row-volume pricing that can scale unexpectedly; negotiate volume tiers and watch active-row definitions at renewal.",
      },
      {
        vendorName: "Transformation & orchestration (dbt, Airflow/Dagster)",
        category: "In-platform transformation + scheduling",
        switchingCost:
          "Moderate-to-high — transformation logic and orchestration DAGs accrete; dbt models are portable but the practice and tests embed deeply.",
        renewalDynamics:
          "Seat/feature-tier pricing for managed offerings; open-source cores cap pricing power but enterprise features (governance, CI) drive upsell.",
      },
      {
        vendorName: "Governance / catalog / observability (Collibra, Alation, Monte Carlo)",
        category: "Catalog, lineage, classification, data observability",
        switchingCost:
          "Moderate-to-high — curated metadata, lineage, and trained anomaly models accumulate tenant-specific value that resets on switch.",
        renewalDynamics:
          "Per-asset or per-user subscription; demonstrate coverage/incident-reduction value at renewal and watch for platform-native catalogs displacing standalone tools.",
      },
      {
        vendorName: "Semantic layer / BI (Power BI, Tableau, Looker, dbt Semantic Layer)",
        category: "Certified metrics + self-serve consumption",
        switchingCost:
          "High — dashboards, embedded metric logic, and user training are deeply embedded; migrating BI estates is notoriously disruptive.",
        renewalDynamics:
          "Per-user/per-viewer subscription, often bundled with the cloud suite; consolidation toward the platform vendor's bundle is a recurring pressure.",
      },
    ],
    switchingCosts:
      "The cloud data platform is effectively non-switchable in isolation (data gravity + integrations), and the BI estate is nearly as sticky — so the negotiable frontier is in the connective tiers (ingestion, transformation, governance, observability) and in re-pricing consumption commitments. The strategic risk is platform-vendor bundling absorbing the surrounding tools and eroding best-of-breed leverage.",
    negotiationLevers: [
      "Right-size consumption/capacity commitments to forecast workload and optimize before committing — avoid paying for un-optimized compute",
      "Outcome/coverage terms for governance and observability tools tied to measured documentation coverage and incident reduction",
      "Bundle versus best-of-breed leverage — discipline platform-native tool pricing against standalone catalog/observability/semantic vendors",
      "Watch usage-based (row/credit) pricing definitions and negotiate volume tiers and caps as data volume scales",
      "Pilot-to-scale gating per use case with parity/value proof before enterprise platform or BI commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      quality_observability_claim: [
        "data-quality test pass rates by dimension on named critical datasets",
        "incident counts with time-to-detect and consumer-facing split",
      ],
      use_case_pull_claim: [
        "named, funded consuming use case per investment",
        "consumption telemetry (queries, dashboard usage, AI calls)",
        "the decision or product the output serves",
      ],
      cost_efficiency_claim: [
        "platform billing attributed by workload/team",
        "cost-per-workload trend against value or usage",
      ],
      governance_coverage_claim: [
        "catalog/ownership/lineage coverage as a share of CRITICAL data",
        "the critical-data inventory definition",
      ],
      ai_readiness_claim: [
        "use-case-level data-requirements mapping",
        "per-element quality/documentation/access/feature-readiness status",
      ],
      value_projection: [
        "use-case-up sizing (value pulled, not platform-pushed)",
        "benchmark planning-range",
        "explicit haircut factors including no-use-case-pull and quality/governance readiness",
        "attribution of enablement value to use cases, not the platform line",
      ],
    },
    citationStandard:
      "Quantitative data-platform claims cite the tooling/billing/catalog source " +
      "and the period, scoped to CRITICAL data (not the whole estate) where " +
      "coverage is involved. Value projections are sized USE-CASE-UP — the named " +
      "funded use case that pulls the value, a labelled planning range, the " +
      "haircut factors applied (especially no-use-case-pull and quality/" +
      "governance readiness), and enablement value attributed to the enabled use " +
      "case rather than the platform line item — never a standalone 'the platform " +
      "delivers X ROI' number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Value is being sized on platform build with no named consuming use case — flag the no-use-case-pull risk and reframe value as use-case-pulled, not platform-pushed.",
      "AI value is projected without a model-ready data-readiness baseline — frame the data foundation as the binding constraint that caps realizable value.",
      "Quality/governance coverage is quoted across the whole estate — distinguish whole-estate from CRITICAL-data coverage explicitly.",
      "Vendor benchmark/ROI figures are cited — mark as provider claims pending validation against the tenant's own telemetry.",
    ],
    inferenceLanguage: [
      "Across enterprise data estates at this scale, model-ready coverage typically sits at...",
      "Without your use-case-level data-readiness mapping, the industry pattern is that the data foundation — not the model — is the binding constraint...",
      "Peer platforms commonly realize compute-cost optimization of... once FinOps-for-data discipline is in place...",
      "Treating this as a planning range pulled by named use cases rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI for this tenant's platform build absent a named consuming use case",
      "This tenant's actual data-quality score, model-ready coverage, or documentation coverage",
      "A claim that the enterprise is 'AI-ready' without a use-case-level data-readiness mapping",
      "A standalone platform value figure not attributed to the use cases that consume it",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "platform cost breakdown / where does data spend go by workload or team",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack attributed compute + storage cost by team/workload/use case to test whether spend is pulled by value or accruing as a cost center.",
    },
    {
      questionPattern:
        "data-platform value story / use-case-pulled value net of haircuts",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross use-case value to net realizable, subtracting the no-use-case-pull, quality/governance-readiness, adoption, and cost-leakage haircuts.",
    },
    {
      questionPattern:
        "data quality / freshness / incident trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend data-quality score, freshness/SLA attainment, or incident rate against planning ranges to show whether the foundation is getting more trustworthy.",
    },
    {
      questionPattern:
        "AI / model-ready data readiness by use case (the binding constraint)",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of top AI use cases against data-readiness dimensions (quality, documentation, access, feature/embedding) to expose where the binding constraint bites.",
    },
    {
      questionPattern: "data & analytics platform KPI scorecard",
      exhibitKind: "table",
      note: "Freshness/latency, pipeline reliability/SLA, data-quality score, % documented, time-to-onboard, query cost, self-serve adoption, incident rate, % critical data with owners, model-ready coverage vs planning ranges.",
    },
    {
      questionPattern:
        "use-case-to-platform traceability / what pulls each investment",
      exhibitKind: "table",
      note: "Per major investment: the named funded consuming use case, consumption evidence, the decision/product served, and value attribution status.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Platform investment is pulled by named, funded use cases — value is realized at consumption, not assumed at ingestion",
      "Data quality, governance, ownership, and model-ready coverage are treated as the binding constraint and lifted on critical domains first",
      "A semantic layer gives humans and AI one certified definition per metric, so trust is built once and reused everywhere",
      "FinOps-for-data discipline attributes and optimizes compute so the platform does not become an unexplained, runaway bill",
    ],
    failureDrivers: [
      "'Build the platform and they will come' — modernization with no consuming use case becomes a depreciating cost center",
      "AI ambitions outrun the data foundation, so pilots stall on data wrangling and never productionize (the binding constraint ignored)",
      "Governance stays a policy PDF — critical data has no owners, catalog, or lineage, so no one trusts the data and AI cannot be grounded",
      "Conflicting metric definitions and shadow pipelines fragment trust faster than the platform builds it",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption follows trust, and trust follows reliability. A first " +
      "consuming use case on a curated gold/semantic slice proves value to one " +
      "team; certified metrics and dependable freshness then pull adjacent " +
      "teams onto self-serve. AI consumption follows only once the data is " +
      "model-ready and governed. The slow, decisive unlock is enterprise trust: " +
      "until consumers stop maintaining shadow reports, the platform is built " +
      "but not pulled. Technical adopters (analysts, engineers) move first; " +
      "broad business self-serve and AI-agent consumption are the lagging, " +
      "value-defining waves.",
    roiClarity: "medium",
    roiClarityBasis:
      "Efficiency and cost levers (labor per insight, compute optimization, " +
      "onboarding time) are directly measurable in tooling and billing, so that " +
      "slice of ROI is firm. The larger enablement value — analytics and AI " +
      "unlocked by a trustworthy substrate — is real but soft: it is correctly " +
      "attributed to the use cases it enables, not to the platform line item, " +
      "and is gated by the quality/governance binding constraint. That is why " +
      "the evidence and hedge rules force use-case-up sizing, attribute " +
      "enablement value to use cases, and discount hard for no-use-case-pull " +
      "and data-readiness gaps.",
  },

  regulatoryFrame: {
    name: "Data privacy/residency & emerging AI data-governance duties",
    relevance:
      "The dominant regulatory frame for the data platform: personal and " +
      "sensitive data in the lakehouse trigger classification, access control, " +
      "retention, residency, and cross-border-transfer obligations, and emerging " +
      "AI regimes (e.g. EU AI Act) impose data-quality, documentation, and " +
      "lineage duties on data used to build and operate AI — making governance, " +
      "catalog, and lineage compliance objects, not just engineering hygiene. " +
      "Sector regulation (HIPAA/GLBA/PCI) and financial-reporting controls " +
      "(SOX over data) layer on for regulated data (see vocabulary." +
      "regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
