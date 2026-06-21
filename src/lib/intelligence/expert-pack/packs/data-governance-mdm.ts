// Consilium expert — Data Governance & Master Data Management (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the GOVERNANCE and MASTERING of enterprise data: data
// ownership/stewardship, data quality, master & reference data (customer,
// product, vendor MDM), the data catalog, lineage & metadata, data contracts,
// data domains / mesh operating model, policy & access governance, and the
// data-product operating model.
//
// DISTINCT from the data-analytics-platform expert. That expert owns the
// PLATFORM and analytics build (ingestion, lakehouse, pipelines, BI). THIS
// expert owns governance + MDM + quality + stewardship — the accountability,
// match/merge, and operating model that make data trustworthy regardless of
// which platform it sits on.
//
// CORE DOCTRINE — GOVERNANCE IS AN OPERATING MODEL, NOT A COMMITTEE; MDM ROI IS
// REAL BUT DIES IN THE STEWARDSHIP WORKFLOW. Five honesty rules drive every
// recommendation:
//   (1) Governance fails when it is a committee, a policy PDF, and a council
//       cadence rather than an operating model with named owners, embedded
//       stewardship, and decisions that change how data is produced. A charter
//       and a steering committee are not governance; ownership and a working
//       stewardship workflow are.
//   (2) MDM ROI is real — a trustworthy golden customer/product/vendor record
//       compounds across every downstream system — but the value dies in the
//       match/merge + survivorship + stewardship workflow. The algorithm is the
//       easy 20%; the data steward queue, survivorship rules, and source-system
//       remediation are the 80% where programs stall.
//   (3) "We bought a data catalog" is not "we are governed." A populated catalog
//       with owners, certified status, enforced classification, and stewardship
//       that consumers actually use is governance; a shelfware catalog is a line
//       item.
//   (4) AI/LLM demand has made data quality + lineage suddenly board-visible —
//       a confident wrong answer over ungoverned data is now an executive risk —
//       but the fix is unglamorous stewardship and ownership, not another tool.
//   (5) Data-mesh is over-adopted as an org excuse: "go domain-oriented" is used
//       to abolish central accountability rather than to federate it. Mesh
//       without federated governance and platform standards is just sanctioned
//       silos. Tool-aware (Informatica, Collibra, Reltio, Ataccama, Purview),
//       not tool-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const dataGovernanceMdmExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.data-governance-mdm",
    expertName: "Data Governance & Master Data Management Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "data-governance-mdm",
    scopeNote:
      "Cross-cutting governance and mastering of enterprise data: data " +
      "ownership and stewardship, data quality, master & reference data " +
      "(customer, product, vendor MDM — match/merge, survivorship, golden " +
      "records), data catalog, lineage & metadata, data contracts, data " +
      "domains / mesh operating model, policy & access governance, and the " +
      "data-product operating model. Doctrine: governance fails when it is a " +
      "COMMITTEE not an OPERATING MODEL; MDM ROI is real but dies in the " +
      "match/merge + survivorship + STEWARDSHIP WORKFLOW; a bought catalog is " +
      "not a governed estate; AI demand made quality + lineage board-visible " +
      "but the fix is unglamorous stewardship, not tooling; data-mesh is over-" +
      "adopted as an excuse to abolish accountability rather than federate it. " +
      "DISTINCT from the data-analytics-platform expert (which owns the " +
      "platform/pipeline/BI build) — this expert owns the trustworthiness, " +
      "accountability, and master data, independent of platform. Excludes the " +
      "AI/ML model layer, MLOps/model risk, and AI governance policy itself " +
      "(separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "dq_score_critical_data_element",
        name: "Data quality score by critical data element",
        definition:
          "Composite pass rate of automated data-quality rules (completeness, " +
          "validity, accuracy, uniqueness, consistency, timeliness) measured " +
          "per critical data element (CDE) rather than averaged across the " +
          "whole estate.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Data-quality program ranges; governed CDEs target high-90s, " +
            "ungoverned long-tail far lower — a whole-estate average hides the " +
            "gap so the planning range is stated per-CDE",
          label: "planning-range",
        },
        dataSource:
          "Data-quality / profiling tooling (e.g. Informatica DQ, Ataccama, " +
          "Collibra DQ, dbt tests) rule results joined to the CDE inventory",
        whyItMatters:
          "The CDE-level score is the measurable form of the binding " +
          "constraint. A blended estate average looks healthy while the " +
          "handful of elements that drive revenue, risk, and AI answers are " +
          "quietly broken — quality must be measured where it is consumed.",
      },
      {
        key: "pct_cde_with_owner",
        name: "% critical data elements with assigned owner",
        definition:
          "Share of critical data elements that have a named, accountable " +
          "business data owner (and a steward) recorded in the governance " +
          "registry — the accountability coverage of the program.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Data-governance maturity ranges; mature programs assign owners to " +
            "nearly all CDEs, committee-only programs leave ownership ambiguous",
          label: "planning-range",
        },
        dataSource:
          "Data-governance registry / catalog ownership assignments mapped " +
          "against the critical-data-element inventory",
        whyItMatters:
          "Ownership is where governance stops being a committee and becomes " +
          "accountability. Unowned critical data is the single best predictor " +
          "of quality decay and the hardest blocker to trustworthy AI — a " +
          "policy without an owner changes nothing.",
      },
      {
        key: "golden_record_match_rate",
        name: "Golden-record match rate (MDM)",
        definition:
          "Share of source records for a mastered domain (customer, product, " +
          "vendor) that are correctly resolved and linked to the right golden " +
          "record — true matches found, net of false merges.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 98,
          basis:
            "MDM match/merge program ranges; tuned deterministic + " +
            "probabilistic matching on a stewarded domain reaches high-90s, " +
            "untuned out-of-the-box matching far lower",
          label: "planning-range",
        },
        dataSource:
          "MDM hub match/merge engine results (e.g. Reltio, Informatica MDM, " +
          "Stibo, Ataccama) with steward adjudication outcomes",
        whyItMatters:
          "The match rate is the heart of MDM value — and where programs die. " +
          "Too low and the golden record is a fiction; pushed too aggressively " +
          "and false merges corrupt distinct entities. It is a tuned, " +
          "steward-governed number, never an algorithm default.",
      },
      {
        key: "master_data_duplicate_rate",
        name: "Duplicate rate in master data",
        definition:
          "Share of records in a mastered domain that are unresolved " +
          "duplicates of an existing entity (the same customer/product/vendor " +
          "represented more than once) after mastering.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "MDM data-quality ranges; ungoverned master files commonly carry " +
            "10-30% duplication pre-program, mature stewarded domains drive to " +
            "low single digits",
          label: "planning-range",
        },
        dataSource:
          "MDM hub duplicate/cluster analysis and post-merge survivorship " +
          "reporting against the mastered domain",
        whyItMatters:
          "Duplicates are where bad master data becomes visible money — split " +
          "customer spend, double-counted vendors, mailings to the same person " +
          "twice, broken entitlement. The duplicate rate is the most " +
          "boardroom-legible symptom of an unmastered domain.",
      },
      {
        key: "catalog_coverage_pct",
        name: "Data-catalog coverage %",
        definition:
          "Share of governed/critical datasets that carry a complete catalog " +
          "entry — description, owner, classification, certification status — " +
          "and that consumers actually use (not merely a harvested stub).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Catalog-adoption ranges; harvested technical metadata reaches high " +
            "coverage cheaply, but curated, owned, used entries on critical " +
            "domains rarely exceed 90%",
          label: "planning-range",
        },
        dataSource:
          "Data catalog coverage + adoption report (curated, owned, certified " +
          "entries over governed assets; plus catalog active-user telemetry)",
        whyItMatters:
          "Coverage distinguishes a governed estate from a bought catalog. A " +
          "high harvested-stub count with no owners, certification, or usage is " +
          "shelfware; curated, used coverage on critical domains is the gateway " +
          "to self-serve and trustworthy AI grounding.",
      },
      {
        key: "lineage_completeness_pct",
        name: "Lineage completeness",
        definition:
          "Share of critical data elements with end-to-end lineage captured " +
          "from source system through transformations to consumption " +
          "(reports, models, AI), at column level where it matters.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 85,
          basis:
            "Lineage-program ranges; automated platform lineage is high in " +
            "modern stacks but cross-system, end-to-end, column-level lineage " +
            "on critical elements is far harder and rarely complete",
          label: "planning-range",
        },
        dataSource:
          "Catalog/lineage tooling (automated harvest + curated manual links) " +
          "scoped to the critical-data-element inventory",
        whyItMatters:
          "Lineage is what lets a consumer trace a number — and an AI answer — " +
          "to a trusted, owned source, and what lets compliance prove control " +
          "(BCBS 239 traceability). AI demand made incomplete lineage a " +
          "board-visible risk: you cannot defend an answer you cannot trace.",
      },
      {
        key: "time_to_resolve_dq_incident",
        name: "Time to resolve a data-quality incident",
        definition:
          "Elapsed time from detection of a data-quality incident on a " +
          "governed dataset to confirmed resolution at the source (not just a " +
          "downstream patch), measured as median and tail.",
        unit: "hours / days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 120,
          basis:
            "Stewardship-operations ranges; mature programs with embedded " +
            "stewards and source remediation resolve in hours-to-days, " +
            "committee-routed programs take weeks",
          label: "planning-range",
        },
        dataSource:
          "Data-quality / stewardship issue-management system (detection " +
          "timestamp to source-confirmed resolution)",
        whyItMatters:
          "Resolution speed is the truest read on whether stewardship is an " +
          "operating reality or a meeting. Slow, downstream-patch-only " +
          "resolution means the same defect recurs — the workflow, not the " +
          "rule, is where the program lives or dies.",
      },
      {
        key: "policy_compliance_rate",
        name: "Policy compliance rate",
        definition:
          "Share of governed data assets in demonstrated compliance with " +
          "applicable governance policies — classification applied, access " +
          "controls aligned to sensitivity, retention enforced, certification " +
          "current.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 98,
          basis:
            "Governance-control ranges; control coverage on regulated/critical " +
            "data should approach the high-90s, broad-estate enforcement lags",
          label: "planning-range",
        },
        dataSource:
          "Governance control monitoring + access-governance tooling, joined " +
          "to classification and retention policy state",
        whyItMatters:
          "Compliance rate is governance made auditable — the evidence that " +
          "policy is enforced, not merely written. It converts GDPR/SOX/BCBS " +
          "239 obligations from a binder into a measured control, and is what " +
          "an auditor or regulator actually tests.",
      },
      {
        key: "pct_data_products_with_contracts",
        name: "% data products with data contracts",
        definition:
          "Share of published data products (or mastered domains / shared " +
          "datasets) governed by an explicit data contract specifying schema, " +
          "semantics, quality SLAs, ownership, and change policy.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 70,
          basis:
            "Data-contract / data-mesh adoption ranges; an emerging practice — " +
            "most enterprises are early, mature mesh programs contract the " +
            "majority of shared products",
          label: "planning-range",
        },
        dataSource:
          "Data-product registry / catalog records of published contracts " +
          "against the inventory of shared data products",
        whyItMatters:
          "Data contracts are how federated (mesh) governance stays governed — " +
          "they make a producer accountable for a consumer's stability. Without " +
          "them, 'domain ownership' degenerates into sanctioned silos with " +
          "breaking changes and no recourse.",
      },
      {
        key: "stewardship_sla_attainment",
        name: "Stewardship SLA attainment",
        definition:
          "Share of stewardship work items (match/merge adjudications, " +
          "data-quality issues, access/classification requests, exception " +
          "reviews) resolved within their target SLA over the period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 98,
          basis:
            "Stewardship-operations ranges; a resourced, workflow-driven " +
            "stewardship function holds high-90s, an under-staffed queue backs " +
            "up and SLA attainment collapses",
          label: "planning-range",
        },
        dataSource:
          "Stewardship workflow / queue tooling (MDM steward console, " +
          "governance workflow) SLA reporting by work-item type",
        whyItMatters:
          "The stewardship queue is where MDM and governance value is actually " +
          "realized or lost. A growing backlog and falling SLA attainment is " +
          "the earliest, surest sign a program is dying in the workflow — the " +
          "80% the tooling demo never shows.",
      },
      {
        key: "cost_of_poor_data_quality",
        name: "Cost of poor data quality (COPDQ)",
        definition:
          "Estimated annual cost attributable to poor data quality — rework, " +
          "failed transactions, mis-shipments, compliance penalties, manual " +
          "reconciliation, lost revenue, and bad decisions — as a share of " +
          "revenue or in currency.",
        unit: "% of revenue / USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Published data-quality-cost ranges (commonly cited as 15-25% of " +
            "revenue at the high end); highly estimate-dependent so stated as a " +
            "planning anchor, not an asserted fact",
          label: "planning-range",
        },
        dataSource:
          "Cost-of-poor-quality model: rework hours, reconciliation effort, " +
          "incident/penalty logs, and revenue leakage traced to data defects",
        whyItMatters:
          "COPDQ is the number that funds a governance program — it reframes " +
          "stewardship from a cost to an avoided loss. It is an estimate, so it " +
          "must be built bottom-up from named loss events, never asserted from " +
          "an industry headline figure.",
      },
      {
        key: "time_to_onboard_data_source",
        name: "Time to onboard a new data source (to governed)",
        definition:
          "Elapsed time from a new data source request to that source being " +
          "classified, owned, quality-profiled, cataloged, and (where master " +
          "data) integrated into the mastering process — governed, not merely " +
          "ingested.",
        unit: "days / weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 45,
          basis:
            "Governance-onboarding ranges; templated, owned domains onboard in " +
            "days, sensitive or master-data sources requiring stewardship and " +
            "matching take weeks",
          label: "planning-range",
        },
        dataSource:
          "Governance / data-onboarding intake workflow from request to " +
          "governed-and-cataloged availability",
        whyItMatters:
          "The governance agility unit. Slow governed-onboarding pushes teams " +
          "to bring sources in ungoverned (shadow data), which is the root of " +
          "duplication, classification gaps, and the very silos a mesh is later " +
          "blamed for — speed of governance is what keeps governance from being " +
          "bypassed.",
      },
    ],

    painThemes: [
      {
        key: "governance_as_committee",
        name: "Governance as a committee, not an operating model",
        description:
          "Governance exists as a charter, a steering committee, and a council " +
          "cadence, but no critical data element has a named owner with " +
          "authority, no stewardship workflow runs day to day, and no decision " +
          "changes how data is produced — so policy accumulates while data " +
          "quality does not improve.",
        detectionSignal:
          "A governance charter and council exist but ownership coverage is " +
          "low, stewardship is unstaffed or ad hoc, policies have no enforced " +
          "control, and quality scores are flat despite the program's age.",
        diagnosticQuestion:
          "Beyond the committee and the charter, who personally owns each " +
          "critical data element, and what stewardship work runs every day to " +
          "fix it at the source?",
      },
      {
        key: "mdm_dies_in_stewardship",
        name: "MDM dies in the match/merge + survivorship + stewardship workflow",
        description:
          "An MDM program buys a hub and tunes a matching algorithm, then " +
          "stalls because survivorship rules are contested, the steward " +
          "adjudication queue is unstaffed and backs up, and source systems are " +
          "never remediated — so the golden record is never trusted and the " +
          "ROI never lands. The algorithm was 20%; the workflow was 80%.",
        detectionSignal:
          "A purchased MDM hub with a growing steward queue, low/falling " +
          "stewardship SLA attainment, contested survivorship rules, and source " +
          "systems still creating the duplicates the hub is meant to resolve.",
        diagnosticQuestion:
          "Who staffs the steward queue, how big is the backlog, and are the " +
          "source systems being remediated — or is the hub silently " +
          "re-merging the same duplicates every load?",
      },
      {
        key: "catalog_bought_not_governed",
        name: "Catalog bought, estate not governed (shelfware)",
        description:
          "A data catalog is purchased and auto-harvests technical metadata, " +
          "producing an impressive asset count — but entries lack owners, " +
          "certification, business glossary terms, and enforced classification, " +
          "and consumers do not use it, so 'we have a catalog' is mistaken for " +
          "'we are governed.'",
        detectionSignal:
          "High harvested asset count but low curated/owned/certified coverage, " +
          "near-zero catalog active users, glossary unmapped to assets, and " +
          "classification harvested but not enforced on access.",
        diagnosticQuestion:
          "Of the assets in your catalog, what share have an owner, a " +
          "certified status, and a business definition — and how many people " +
          "actually use the catalog to find and trust data each month?",
      },
      {
        key: "golden_record_fiction",
        name: "Golden-record fiction (low match / false-merge corruption)",
        description:
          "The mastered domain is either under-matched (the same entity scatters " +
          "across duplicate golden records) or over-matched (distinct entities " +
          "are falsely merged, corrupting entitlement and reporting) because " +
          "matching is untuned and survivorship is not steward-governed — so " +
          "the 'single version of truth' is itself wrong.",
        detectionSignal:
          "High duplicate rate alongside complaints of falsely merged records, " +
          "split customer spend or vendor counts, and downstream systems " +
          "distrusting and overriding the hub's golden record.",
        diagnosticQuestion:
          "What is your golden-record match rate and duplicate rate by domain, " +
          "and how are false merges detected and unwound — or does the business " +
          "quietly route around the master record?",
      },
      {
        key: "ai_exposed_quality_lineage_gap",
        name: "AI-exposed data-quality & lineage gap",
        description:
          "Generative AI and analytics now surface — confidently — answers " +
          "built on ungoverned, untraceable data, so a long-tolerated quality " +
          "and lineage gap becomes a board-visible risk overnight. The reflex " +
          "is to buy another tool; the actual fix is unglamorous ownership, " +
          "stewardship, and source remediation.",
        detectionSignal:
          "AI pilots producing plausible-but-wrong answers, no lineage or " +
          "certification behind AI-consumed data, executive anxiety about 'can " +
          "we trust the AI's numbers,' and a tooling-purchase reflex rather " +
          "than a stewardship response.",
        diagnosticQuestion:
          "For the data your AI consumes, is it owned, quality-assured, " +
          "classified, and traceable to source — and is the response to gaps " +
          "stewardship and remediation, or just another platform purchase?",
      },
      {
        key: "mesh_as_org_excuse",
        name: "Data-mesh as an excuse to abolish accountability",
        description:
          "'Go domain-oriented / data mesh' is adopted to decentralize — but " +
          "without federated governance, platform standards, data contracts, or " +
          "central CDE ownership, so it abolishes accountability rather than " +
          "federating it. The result is sanctioned silos with divergent " +
          "definitions and breaking changes, blamed later on 'too much " +
          "central control.'",
        detectionSignal:
          "A mesh/decentralization mandate with no federated governance body, " +
          "no data contracts, no shared platform standards, diverging metric/" +
          "entity definitions by domain, and no central owner for cross-domain " +
          "critical data.",
        diagnosticQuestion:
          "Under your domain/mesh model, what federated governance, contracts, " +
          "and platform standards hold it together — or has 'decentralize' " +
          "quietly become 'no one is accountable across domains'?",
      },
      {
        key: "reference_data_drift",
        name: "Reference data & classification drift",
        description:
          "Shared reference data (code sets, hierarchies, country/currency, " +
          "product categories) and sensitivity classifications are maintained " +
          "inconsistently across systems, so the same code means different " +
          "things in different places, classification is stale, and access " +
          "controls drift out of alignment with actual sensitivity.",
        detectionSignal:
          "Conflicting code sets and hierarchies across systems, stale or " +
          "missing classification on sensitive data, access not matching " +
          "classification, and reconciliation work to align reference values.",
        diagnosticQuestion:
          "Is your reference data (codes, hierarchies, classifications) " +
          "mastered and distributed from one governed source, or maintained " +
          "independently — and does access still match the real sensitivity?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_entity_resolution_matching",
        name: "AI-assisted entity resolution & match/merge",
        valueMechanism:
          "ML and LLM-based matching learn from steward adjudication history to " +
          "resolve entities that deterministic rules miss (fuzzy names, " +
          "addresses, multilingual variants) and to score merge candidates — " +
          "raising the golden-record match rate and cutting duplicates while " +
          "shrinking the steward adjudication queue.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Source records for the mastered domain with sufficient attributes to match on",
          "Historical steward match/no-match adjudications as training signal",
          "Survivorship rules and trusted-source hierarchy for merge decisions",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "False merges corrupt distinct entities and entitlement — high-confidence auto-merge needs steward-reviewed thresholds, low-confidence stays in the queue",
          "Matching models can encode bias against name/address patterns — monitor for systematic mis-resolution of populations",
        ],
        metricsMoved: [
          "golden_record_match_rate",
          "master_data_duplicate_rate",
          "stewardship_sla_attainment",
        ],
      },
      {
        key: "ai_catalog_metadata_enrichment",
        name: "AI catalog & metadata enrichment (descriptions, glossary, classification)",
        valueMechanism:
          "LLMs auto-draft dataset/column descriptions, map business glossary " +
          "terms to physical assets, suggest sensitivity classifications and " +
          "PII tags, and recommend owners — collapsing the manual curation " +
          "backlog so catalog coverage moves from harvested stubs to curated, " +
          "owned, certified entries consumers actually trust.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Harvested technical metadata, schemas, and sample data",
          "Existing curated entries and the business glossary for consistency",
          "Classification policy and sensitivity taxonomy to map against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-suggested classifications/PII tags must be steward-confirmed before they drive access decisions",
          "Generated descriptions can be confidently wrong — owner/steward review required on critical data elements",
        ],
        metricsMoved: [
          "catalog_coverage_pct",
          "pct_cde_with_owner",
          "policy_compliance_rate",
        ],
      },
      {
        key: "ai_data_quality_rule_synthesis",
        name: "AI data-quality rule synthesis & anomaly detection",
        valueMechanism:
          "AI profiles data to propose and maintain quality rules, and learns " +
          "normal behavior to flag anomalies (drift, volume, distribution) " +
          "before consumers see them — raising the CDE quality score and " +
          "shortening time-to-resolve by catching defects at source rather than " +
          "in a downstream report.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical data profiles by critical data element over time",
          "Existing quality rules and prior incident history",
          "Lineage to scope the blast radius and find the source of a defect",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Untuned anomaly alerts create fatigue — incidents must be triaged and routed, not just fired",
          "Auto-generated rules must be steward-approved before they gate data or block pipelines",
        ],
        metricsMoved: [
          "dq_score_critical_data_element",
          "time_to_resolve_dq_incident",
          "cost_of_poor_data_quality",
        ],
      },
      {
        key: "ai_lineage_inference_impact",
        name: "AI lineage inference & impact analysis",
        valueMechanism:
          "AI parses code, queries, and pipeline logic to infer cross-system, " +
          "column-level lineage that automated harvesters miss, and answers " +
          "impact-analysis questions ('what breaks if this changes') — raising " +
          "lineage completeness so consumers and auditors can trace any number " +
          "to its source.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Pipeline/transformation code, SQL, and BI report definitions to parse",
          "Existing harvested lineage and catalog asset registry",
          "Critical-data-element inventory to prioritize lineage capture",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Inferred lineage can be wrong or incomplete — must be marked as inferred (not asserted) and curated before it backs a compliance claim",
          "Lineage used for regulatory traceability (BCBS 239) must be validated, not auto-trusted",
        ],
        metricsMoved: [
          "lineage_completeness_pct",
          "policy_compliance_rate",
        ],
      },
      {
        key: "conversational_data_governance",
        name: "Conversational governance & stewardship assistant",
        valueMechanism:
          "An LLM assistant lets users find data, see owners/lineage/quality, " +
          "request access, and triages stewardship work (drafting issue " +
          "summaries, routing, suggesting resolutions) over the catalog and " +
          "governance metadata — broadening catalog adoption and lifting " +
          "stewardship throughput so the queue does not back up.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "A populated catalog with owners, lineage, certification, and quality state",
          "Governance policy and access-request workflow to ground actions",
          "Stewardship queue and historical resolutions for triage suggestions",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Access grants and policy actions must remain human-approved — the assistant proposes, the steward/owner decides",
          "Answers must carry owner, certification, and lineage so users verify rather than blindly trust",
        ],
        metricsMoved: [
          "catalog_coverage_pct",
          "stewardship_sla_attainment",
          "time_to_resolve_dq_incident",
        ],
      },
      {
        key: "ai_policy_classification_access",
        name: "AI sensitivity classification & access-policy governance",
        valueMechanism:
          "AI scans data to detect and classify sensitive/PII/regulated " +
          "elements at scale and to flag access that is misaligned with " +
          "sensitivity or policy — raising policy compliance and keeping " +
          "classification current so access governance does not drift out of " +
          "alignment with real sensitivity.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Sample data and schemas across the estate to scan for sensitive patterns",
          "Classification taxonomy and access policy to evaluate against",
          "Current access entitlements and classification state for drift detection",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Misclassification can over- or under-restrict access — classification changes that alter access must be human-approved",
          "Scanning sensitive data for classification must itself respect access controls and residency",
        ],
        metricsMoved: [
          "policy_compliance_rate",
          "pct_cde_with_owner",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "federated_operating_model",
        name: "Federated governance operating model (owners + stewards + council)",
        description:
          "Governance run as an operating model: a light central function sets " +
          "policy, standards, and the CDE framework; business data owners are " +
          "accountable per domain; embedded data stewards run the daily " +
          "workflow (quality issues, adjudications, classification); a council " +
          "arbitrates cross-domain decisions — so accountability is named and " +
          "work actually happens, not just meets.",
        boundary:
          "Owns policy, standards, ownership accountability, and the " +
          "stewardship workflow; does not own the data platform/pipelines or " +
          "the source systems — it makes whoever owns them accountable for the " +
          "data's trustworthiness.",
        humanAccountabilityPoint:
          "Chief Data Officer (policy & standards); business data owners " +
          "accountable per domain; data stewards run the workflow",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "mdm_hub_stewardship_workflow",
        name: "MDM hub with stewardship workflow & source remediation",
        description:
          "A master-data hub (registry, consolidation, coexistence, or " +
          "centralized style) that ingests source records, matches and merges " +
          "to golden records under governed survivorship rules, routes " +
          "uncertain cases to a staffed steward queue, and FEEDS CORRECTIONS " +
          "BACK to source systems — treating the stewardship workflow and " +
          "source remediation as the program, not an afterthought.",
        boundary:
          "Owns the golden record, match/merge, survivorship, and the steward " +
          "adjudication workflow for the mastered domains; does not own the " +
          "transactional source systems — but holds them accountable to " +
          "consume the golden record and remediate at source.",
        humanAccountabilityPoint:
          "MDM Lead / domain data owner (survivorship rules & golden-record sign-off); data stewards (adjudication queue)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "active_catalog_lineage_classification",
        name: "Active catalog: owned, certified, classified, with lineage",
        description:
          "A catalog used as the single front door to data — every critical " +
          "asset carrying an owner, business glossary terms, certified status, " +
          "enforced classification, quality state, and end-to-end lineage — " +
          "wired into access and stewardship so it is an operating reality " +
          "consumers use, not a harvested metadata shelf.",
        boundary:
          "Owns metadata, glossary, certification, classification, lineage, " +
          "and discoverability; does not own the data content or the platform " +
          "— it makes them trustworthy, traceable, and findable.",
        humanAccountabilityPoint:
          "Data Governance Lead (catalog standards & certification); data owners certify their assets",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "data_contracts_products",
        name: "Data contracts over governed data products",
        description:
          "Shared/mastered datasets are published as data products under " +
          "explicit data contracts — schema, semantics, quality SLA, ownership, " +
          "and change/deprecation policy — so producers are accountable to " +
          "consumers, breaking changes are governed, and a federated (mesh) " +
          "model stays governed rather than fragmenting into silos.",
        boundary:
          "Owns the contract standard, the product registry, and " +
          "producer-consumer accountability; does not own the underlying " +
          "platform or the domain teams' build — it is the enforceable " +
          "interface between them.",
        humanAccountabilityPoint:
          "Domain data-product owner (the contract); Data Governance Lead (the contract standard & federated enforcement)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "reference_data_management",
        name: "Reference & code-set data management",
        description:
          "Shared reference data — code sets, hierarchies, country/currency, " +
          "product categories, org structures — and sensitivity " +
          "classifications are mastered once in a governed reference-data store " +
          "and distributed to consuming systems, so a code means one thing " +
          "everywhere and classification stays consistent and current.",
        boundary:
          "Owns the authoritative reference values, hierarchies, and " +
          "classification taxonomy and their distribution; does not own the " +
          "transactional master entities (the MDM hub does) — it is the shared " +
          "vocabulary they all use.",
        humanAccountabilityPoint:
          "Reference-data steward / data owner for each reference domain",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Governance and MDM value is realized DOWNSTREAM and BY AVOIDED LOSS, " +
        "never at the point of policy. The program itself is pure cost until a " +
        "trustworthy golden record, a quality-assured critical data element, or " +
        "a governed lineage path changes a downstream outcome — fewer failed " +
        "transactions and mis-shipments, recovered duplicate-driven revenue " +
        "leakage, faster closes and reporting, lower compliance penalty risk, " +
        "and AI/analytics value that simply could not be realized on " +
        "ungoverned data. Two value engines run: (1) loss avoidance — the cost " +
        "of poor data quality (rework, reconciliation, penalties, leakage) is " +
        "reduced, which is the engine that funds the program and the most " +
        "measurable slice; and (2) enablement — a trustworthy, owned, " +
        "traceable substrate UNLOCKS downstream analytics, AI, and operational " +
        "value, which is larger but softer and must be attributed to the use " +
        "cases it enables, not to the governance line item. The binding " +
        "constraint is the STEWARDSHIP WORKFLOW: match/merge tuning, " +
        "survivorship governance, a staffed steward queue, and source " +
        "remediation gate how much value is realized at all — a perfectly " +
        "specified policy with an unstaffed queue realizes almost none of the " +
        "theoretical prize.",
      dominantHaircutFactors: [
        {
          factor: "Stewardship workflow not staffed / source not remediated",
          rationale:
            "The single largest over-statement in governance and MDM business " +
            "cases. Value modeled on a tuned algorithm collapses if the steward " +
            "queue is unstaffed, survivorship is contested, and source systems " +
            "keep recreating the defects — the program dies in the workflow, " +
            "so projected value must be discounted to what the actual " +
            "stewardship capacity can sustain.",
          typicalHaircut: {
            low: 0.25,
            high: 0.6,
            basis:
              "Observed gap between MDM/governance projected value and value " +
              "realized when stewardship is under-resourced and source systems " +
              "are not remediated",
            label: "planning-range",
          },
        },
        {
          factor: "Governance as committee, not operating model (no owners)",
          rationale:
            "Where critical data has no named owner and governance is a " +
            "council cadence rather than embedded accountability, policy does " +
            "not change how data is produced, so quality does not improve and " +
            "modeled value does not materialize — discount to the value " +
            "achievable given actual ownership coverage.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between policy-based value projections and realized value " +
              "in committee-only programs lacking named owners and embedded " +
              "stewardship",
            label: "planning-range",
          },
        },
        {
          factor: "Cost-of-poor-quality estimate softness",
          rationale:
            "COPDQ and avoided-loss value are estimates built from rework, " +
            "reconciliation, leakage, and penalty assumptions — easily " +
            "over-stated from headline industry figures, so the benefit must " +
            "be discounted unless built bottom-up from named, measured loss " +
            "events.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Range by which top-down COPDQ figures overstate the value a " +
              "bottom-up, event-anchored model substantiates",
            label: "planning-range",
          },
        },
        {
          factor: "Consumer adoption of golden record / catalog",
          rationale:
            "Value requires downstream systems and people to actually consume " +
            "the golden record and the certified catalog instead of routing " +
            "around them; persistent shadow data and overridden master records " +
            "leave the benefit unrealized.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Shortfall where consuming systems and users continue to bypass " +
              "the master record and the catalog despite the program",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Cost-of-poor-quality reduction (rework, reconciliation, leakage, penalties)",
          range: {
            low: 0.15,
            high: 0.5,
            basis:
              "Reported reduction in data-quality-driven loss once critical " +
              "data is owned, quality-assured, and remediated at source",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in cost_of_poor_data_quality from a bottom-up, " +
            "event-anchored baseline",
        },
        {
          lever: "Duplicate-driven revenue/cost leakage recovery (MDM)",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reported recovery of duplicate-driven leakage (split spend, " +
              "double-counted vendors, redundant outreach) from mastering",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in master_data_duplicate_rate translated to " +
            "recovered spend/cost in the affected domain",
        },
        {
          lever: "Stewardship & reconciliation labor efficiency",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reduction in manual reconciliation and stewardship " +
              "effort per work item from workflow automation and AI assistance",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in stewardship + reconciliation effort at " +
            "equal or higher stewardship_sla_attainment",
        },
        {
          lever: "AI/analytics value enabled by a trustworthy substrate (multiplier)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Attributed to enabled use cases: share of downstream AI/" +
              "analytics value that becomes realizable once data is owned, " +
              "quality-assured, classified, and traceable",
            label: "planning-range",
          },
          measuredAs:
            "Increment in realizable downstream use-case value attributable to " +
            "dq_score_critical_data_element and lineage_completeness_pct — " +
            "credited to the use case, not the governance line",
        },
      ],
      timeToValueBand:
        "First governed critical-data domain (owners + quality rules + catalog " +
        "+ steward workflow) and first mastered domain slice: 2-4 quarters " +
        "(domain-by-domain, not boil-the-ocean). Measurable cost-of-poor-" +
        "quality and duplicate-leakage reduction on that domain: 3-6 quarters. " +
        "Enterprise operating model, multi-domain MDM, full catalog/lineage " +
        "coverage, and data contracts: 18-36 months, sequenced by the highest " +
        "loss / highest AI-dependency domains first.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "MDM hub / entity-mastering platform",
          role:
            "Masters customer/product/vendor entities — match/merge, " +
            "survivorship, golden-record management, and the steward console " +
            "for adjudication.",
          examples: [
            "Informatica MDM",
            "Reltio",
            "Stibo Systems",
            "Ataccama",
            "SAP Master Data Governance",
          ],
        },
        {
          name: "Data catalog & metadata management",
          role:
            "The front door to data — descriptions, glossary, ownership, " +
            "certification, classification, lineage, and discoverability over " +
            "the governed estate.",
          examples: [
            "Collibra",
            "Alation",
            "Microsoft Purview",
            "Atlan",
            "data.world",
          ],
        },
        {
          name: "Data-quality & profiling tooling",
          role:
            "Profiles data, runs quality rules by critical data element, and " +
            "detects/monitors quality incidents for stewardship.",
          examples: [
            "Informatica Data Quality",
            "Ataccama ONE",
            "Collibra DQ (OwlDQ)",
            "Great Expectations",
            "dbt tests",
          ],
        },
        {
          name: "Reference-data & classification management",
          role:
            "Masters and distributes shared reference data (code sets, " +
            "hierarchies) and maintains the sensitivity classification taxonomy.",
          examples: [
            "Informatica Reference 360",
            "Semarchy",
            "TopBraid / EDM reference data",
            "Microsoft Purview classification",
          ],
        },
        {
          name: "Governance workflow & access-governance",
          role:
            "Runs the stewardship workflow (issues, adjudications, exceptions) " +
            "and governs access/entitlements aligned to classification and " +
            "policy.",
          examples: [
            "Collibra Workflow",
            "Immuta",
            "Privacera",
            "ServiceNow data-governance workflows",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Data Officer (CDO)",
          accountability:
            "Enterprise data strategy, the governance operating model, policy " +
            "and standards, and whether governance is a working operating model " +
            "rather than a committee.",
        },
        {
          title: "Business Data Owner (domain)",
          accountability:
            "Accountable for the critical data elements in a domain — their " +
            "definitions, quality, classification, survivorship rules, and " +
            "golden-record sign-off; the named owner that makes governance real.",
        },
        {
          title: "Data Steward",
          accountability:
            "Runs the daily workflow — match/merge adjudication, data-quality " +
            "issue resolution, classification, exception review — and drives " +
            "source remediation; the role where MDM/governance value is " +
            "realized or lost.",
        },
        {
          title: "MDM / Master-Data Lead",
          accountability:
            "The mastering program — match/merge tuning, survivorship rules, " +
            "the steward queue, source-system remediation, and golden-record " +
            "trustworthiness across the mastered domains.",
        },
        {
          title: "Data Governance Lead",
          accountability:
            "Catalog standards and certification, the glossary, policy and " +
            "classification frameworks, the CDE inventory, and federated " +
            "enforcement (including data-contract standards).",
        },
      ],
      regulatoryFrames: [
        {
          name: "BCBS 239 (risk data aggregation & reporting)",
          relevance:
            "Mandates accuracy, completeness, timeliness, and end-to-end " +
            "lineage/traceability of risk data for banks — making ownership, " +
            "data quality, and lineage on critical risk data elements an " +
            "examinable regulatory obligation, not optional hygiene.",
        },
        {
          name: "GDPR / CCPA & data residency",
          relevance:
            "Personal data triggers classification, access control, retention, " +
            "subject-rights (access/erasure), and cross-border-transfer/" +
            "residency duties — which depend on a mastered customer record, " +
            "accurate classification, and lineage to be provable.",
        },
        {
          name: "SOX data controls (financial-reporting integrity)",
          relevance:
            "Data feeding financial reporting must carry controls, lineage, " +
            "ownership, and change management auditors rely on — governance and " +
            "lineage over financial critical data elements become audited " +
            "controls, not just engineering practice.",
        },
        {
          name: "Sector & AI data-governance regimes (HIPAA/GLBA/PCI; EU AI Act data duties)",
          relevance:
            "Regulated data carries specific handling, classification, and " +
            "access requirements, and emerging AI regimes impose data-quality, " +
            "documentation, and lineage duties on data used in AI — extending " +
            "governance obligations to the data behind AI systems.",
        },
      ],
      canonicalTerms: [
        {
          term: "Critical Data Element (CDE)",
          definition:
            "A data element material to a key business process, decision, " +
            "regulatory report, or AI use case — the prioritized scope where " +
            "ownership, quality, and lineage effort is concentrated rather than " +
            "spread across the whole estate.",
        },
        {
          term: "Golden record / single version of truth",
          definition:
            "The mastered, de-duplicated, survivorship-resolved record for an " +
            "entity (customer/product/vendor) that consuming systems treat as " +
            "authoritative.",
        },
        {
          term: "Match / merge & survivorship",
          definition:
            "Match identifies records referring to the same entity; merge " +
            "consolidates them; survivorship rules decide which attribute " +
            "values win in the golden record — the core, steward-governed MDM " +
            "workflow.",
        },
        {
          term: "Data steward vs data owner",
          definition:
            "The owner is the accountable business authority for a data " +
            "domain's definitions, quality, and rules; the steward executes the " +
            "day-to-day workflow (adjudication, issue resolution, " +
            "classification) under that authority.",
        },
        {
          term: "Data contract",
          definition:
            "An explicit, enforceable agreement between a data producer and " +
            "consumers specifying schema, semantics, quality SLA, ownership, " +
            "and change/deprecation policy for a data product.",
        },
        {
          term: "Data domain / data mesh",
          definition:
            "A domain is a bounded area of data ownership; data mesh is the " +
            "operating model that decentralizes data-product ownership to " +
            "domains on a shared self-serve platform with FEDERATED governance " +
            "— federation, not abolition, of central accountability.",
        },
        {
          term: "Reference data",
          definition:
            "Shared, slowly-changing classification and code-set data (country, " +
            "currency, product category, org hierarchy) mastered once and " +
            "distributed so a code means the same thing in every system.",
        },
        {
          term: "Cost of poor data quality (COPDQ)",
          definition:
            "The estimated annual cost attributable to poor data quality — " +
            "rework, failed transactions, reconciliation, penalties, leakage, " +
            "and bad decisions — used to size and fund a governance program.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Data quality and stewardship posture",
        authoritativeSource:
          "Data-quality tooling rule results by critical data element and the " +
          "stewardship issue-management/queue system",
        whatGoodEvidenceLooksLike:
          "Quality pass rates by dimension on named CDEs, plus steward queue " +
          "size, SLA attainment, time-to-resolve, and evidence of source " +
          "remediation (not just downstream patches).",
        weakEvidenceToReject:
          "A blended whole-estate quality average, or a 'we have a stewardship " +
          "program' assertion with no queue, SLA, or resolution data.",
      },
      {
        claim: "MDM golden-record quality (match / duplicate / survivorship)",
        authoritativeSource:
          "MDM hub match/merge results, duplicate/cluster analysis, and steward " +
          "adjudication outcomes for the mastered domain",
        whatGoodEvidenceLooksLike:
          "Match rate and duplicate rate by domain, false-merge detection " +
          "evidence, governed survivorship rules, and proof consuming systems " +
          "use the golden record.",
        weakEvidenceToReject:
          "A vendor 'our matching reaches 98%' default with no tenant tuning, " +
          "no false-merge handling, and no evidence downstream systems trust " +
          "the master record.",
      },
      {
        claim: "Governance operating model & ownership coverage",
        authoritativeSource:
          "Governance registry / catalog ownership assignments against the CDE " +
          "inventory, plus stewardship-workflow operating evidence",
        whatGoodEvidenceLooksLike:
          "Named owners and stewards per critical domain, the CDE inventory " +
          "defined, an active stewardship workflow, and policies with enforced " +
          "controls — accountability that operates, not just convenes.",
        weakEvidenceToReject:
          "A governance charter, council slide, or policy library with no named " +
          "CDE owners, no staffed stewardship, and no enforced control.",
      },
      {
        claim: "Catalog coverage, lineage & policy compliance",
        authoritativeSource:
          "Catalog coverage/adoption reports, lineage tooling scoped to CDEs, " +
          "and governance control-monitoring on classification/access/retention",
        whatGoodEvidenceLooksLike:
          "Curated, owned, certified coverage as a share of CRITICAL data with " +
          "active catalog usage, end-to-end lineage on CDEs, and measured " +
          "policy compliance with enforced controls.",
        weakEvidenceToReject:
          "A harvested-asset count presented as coverage, a 'data is governed' " +
          "blanket claim, or classification that is harvested but not enforced " +
          "on access.",
      },
      {
        claim: "Value / cost-of-poor-quality and avoided loss",
        authoritativeSource:
          "A bottom-up COPDQ model anchored to named loss events (rework, " +
          "reconciliation, penalties, leakage) and duplicate-driven leakage " +
          "analysis",
        whatGoodEvidenceLooksLike:
          "Loss value built from measured, event-level data-defect costs and " +
          "duplicate-driven leakage, with explicit haircuts for stewardship " +
          "capacity and consumer adoption.",
        weakEvidenceToReject:
          "A headline 'poor data quality costs X% of revenue' figure applied " +
          "top-down with no tenant-specific loss events or stewardship-capacity " +
          "discount.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Beyond the committee and the charter, who personally owns each critical data element, and what stewardship work runs every day to fix it at the source?",
      "For your mastered domains (customer/product/vendor), what are the golden-record match rate and duplicate rate, how is the steward queue staffed, and are source systems being remediated?",
      "Of the assets in your catalog, what share have an owner, certified status, and a business definition — and how many people actually use the catalog each month?",
      "For the critical data your AI and reporting consume, is it owned, quality-assured, classified, and traceable end-to-end to source?",
      "Under your domain/mesh model, what federated governance, data contracts, and platform standards hold it together — or has 'decentralize' become 'no one is accountable across domains'?",
      "What is your cost of poor data quality, and is it built bottom-up from named loss events (rework, reconciliation, penalties, leakage) or asserted from an industry headline?",
      "Is your reference data (codes, hierarchies, classifications) mastered and distributed from one governed source, and does access still match real sensitivity?",
    ],
    maturitySignals: [
      "Critical data elements have named business owners and embedded stewards, and a stewardship workflow runs daily with measured SLA attainment — governance operates, not just convenes.",
      "Mastered domains have tuned, steward-governed match/merge with low duplicates, governed survivorship, and source-system remediation feeding corrections back upstream.",
      "The catalog is owned, certified, classified, lineage-complete on CDEs, and actively used — a front door, not a shelf — and policy compliance is measured with enforced controls.",
      "Where decentralized, the model is federated: data contracts, shared platform standards, and central CDE accountability hold the domains together.",
    ],
    redFlags: [
      "A governance charter and council exist but critical data has no named owners, stewardship is unstaffed, and quality scores are flat — governance is a committee, not an operating model.",
      "An MDM hub is bought and the algorithm tuned, but the steward queue is backing up, survivorship is contested, and source systems still create the duplicates — MDM is dying in the workflow.",
      "A catalog shows a high harvested-asset count with near-zero active users, no owners, and no certification — a tool was bought, the estate is not governed.",
      "AI pilots produce confident wrong answers over untraceable data and the reflex is to buy another tool rather than fix ownership, stewardship, and source remediation.",
      "'Go data mesh / decentralize' was mandated with no federated governance, no data contracts, and no central CDE ownership — sanctioned silos with divergent definitions.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "MDM platforms (Informatica MDM, Reltio, Stibo, SAP MDG, Ataccama)",
        category: "Master-data mastering — match/merge, survivorship, golden records",
        switchingCost:
          "Very high — tuned matching, survivorship rules, accumulated steward adjudications, source integrations, and golden-record consumers make replatforming a multi-year program rarely undertaken.",
        renewalDynamics:
          "Subscription by record volume, domains, or users; the lever is right-sizing domains/volume and proving stewardship-driven value, not switching — note volume-based pricing can scale with record growth.",
      },
      {
        vendorName: "Data catalogs (Collibra, Alation, Microsoft Purview, Atlan)",
        category: "Catalog, glossary, lineage, classification, certification",
        switchingCost:
          "Moderate-to-high — curated metadata, glossary mappings, certifications, and trained lineage accumulate tenant-specific value that resets on switch; platform-native catalogs (Purview, Unity) pressure standalone tools.",
        renewalDynamics:
          "Per-user or per-asset subscription; demonstrate curated coverage and active adoption at renewal — beware paying for harvested-stub volume rather than governed usage, and watch platform-native displacement.",
      },
      {
        vendorName: "Data-quality tooling (Informatica DQ, Ataccama, Collibra DQ, Great Expectations)",
        category: "Profiling, quality rules, monitoring by critical data element",
        switchingCost:
          "Moderate — rules and profiles are partly portable, but accumulated rule libraries, thresholds, and incident history embed; open-source options (Great Expectations) reduce lock-in.",
        renewalDynamics:
          "Per-source/volume or seat pricing; tie renewal to measured quality improvement on CDEs, and consider consolidation with the catalog vendor's native DQ.",
      },
      {
        vendorName: "Access-governance & policy (Immuta, Privacera, BigID, native platform controls)",
        category: "Classification-driven access governance, privacy, policy enforcement",
        switchingCost:
          "Moderate-to-high — policies, classifications, and enforcement integrations embed across consuming platforms; platform-native enforcement (warehouse/lakehouse) can displace standalone tools.",
        renewalDynamics:
          "Per-user/data-source or volume pricing; pressure-test against platform-native policy capabilities and tie value to measured policy-compliance improvement.",
      },
      {
        vendorName: "Reference-data management (Informatica Reference 360, Semarchy, TopBraid)",
        category: "Code sets, hierarchies, classification taxonomy mastering & distribution",
        switchingCost:
          "Moderate — reference models and distribution integrations embed in consuming systems; often bundled with the MDM platform, which reduces standalone leverage.",
        renewalDynamics:
          "Often bundled into the MDM subscription; negotiate as part of the broader master-data commitment rather than standalone.",
      },
    ],
    switchingCosts:
      "The MDM hub is effectively non-switchable in isolation once survivorship, tuned matching, steward history, and golden-record consumers accrete — so the negotiable frontier is in the catalog, data-quality, access-governance, and reference tiers, and in re-pricing record-volume and per-user commitments. The strategic risk is platform-native governance (warehouse/lakehouse catalogs and policy engines) absorbing standalone catalog, DQ, and access tools and eroding best-of-breed leverage.",
    negotiationLevers: [
      "Right-size MDM record volume and active domains to forecast scope — avoid paying for record/domain growth that is not yet stewarded",
      "Tie catalog and data-quality renewals to measured CURATED coverage and active adoption (not harvested-asset counts) and to CDE quality improvement",
      "Bundle versus best-of-breed leverage — discipline standalone catalog/DQ/access pricing against platform-native (Purview, Unity Catalog, warehouse policy) capabilities",
      "Watch record-volume and per-user pricing definitions and negotiate volume tiers, caps, and a clear active-record definition as data scales",
      "Pilot-to-scale gating per domain with golden-record quality and stewardship-SLA proof before enterprise MDM/governance commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      data_quality_stewardship_claim: [
        "quality pass rates by dimension on named critical data elements",
        "steward queue size, SLA attainment, and time-to-resolve",
        "evidence of source-system remediation, not only downstream patches",
      ],
      mdm_golden_record_claim: [
        "match rate and duplicate rate by mastered domain",
        "false-merge detection and governed survivorship rules",
        "proof consuming systems actually use the golden record",
      ],
      governance_operating_model_claim: [
        "named owners and stewards per critical domain against the CDE inventory",
        "an active stewardship workflow (not a council cadence)",
        "policies with enforced controls, not a policy library",
      ],
      catalog_lineage_compliance_claim: [
        "curated/owned/certified coverage as a share of CRITICAL data with adoption telemetry",
        "end-to-end lineage on critical data elements",
        "measured policy-compliance rate with enforced controls",
      ],
      value_projection: [
        "bottom-up cost-of-poor-quality anchored to named loss events",
        "benchmark planning-range",
        "explicit haircut factors including stewardship-capacity and committee-not-operating-model",
        "enablement value attributed to enabled use cases, not the governance line",
      ],
    },
    citationStandard:
      "Quantitative governance/MDM claims cite the tooling/registry/hub source " +
      "and the period, scoped to CRITICAL data elements (not the whole estate) " +
      "where coverage or quality is involved, and distinguish curated/used " +
      "coverage from harvested stubs. MDM claims cite tuned, steward-governed " +
      "match/duplicate figures, never algorithm defaults. Value is sized " +
      "BOTTOM-UP from named loss events with a labelled planning range, the " +
      "haircuts applied (especially stewardship-capacity and " +
      "committee-not-operating-model), and enablement value attributed to the " +
      "enabled use case — never a standalone 'governance delivers X ROI' or a " +
      "top-down 'poor quality costs X% of revenue' headline.",
  },

  hedgeRules: {
    whenToHedge: [
      "Value is sized on a tuned matching algorithm or a written policy with no evidence the stewardship workflow is staffed and source systems remediated — flag the workflow as the binding constraint and discount accordingly.",
      "Cost-of-poor-quality is quoted from an industry headline (e.g. 'X% of revenue') — distinguish a top-down anchor from a bottom-up, event-anchored tenant estimate.",
      "Catalog or quality coverage is quoted across the whole estate or as harvested assets — distinguish whole-estate from CRITICAL-data and harvested from curated/used coverage.",
      "MDM match rates or duplicate figures are vendor defaults — mark as out-of-the-box claims pending tuning and steward governance against the tenant's own domains.",
    ],
    inferenceLanguage: [
      "Across enterprise data estates at this scale, ownership coverage on critical data elements typically sits at...",
      "Without your steward-queue and SLA data, the industry pattern is that MDM and governance value is realized or lost in the stewardship workflow, not the algorithm...",
      "Peer programs commonly find duplicate rates in unmastered customer/vendor domains in the range of... before mastering...",
      "Treating cost-of-poor-quality as a planning range pending a bottom-up, event-anchored model rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or cost-of-poor-quality for this tenant absent a bottom-up, event-anchored loss model",
      "This tenant's actual golden-record match rate, duplicate rate, CDE quality score, or ownership/catalog coverage",
      "A claim that the enterprise is 'governed' or 'has a single version of truth' without named owners, a staffed stewardship workflow, and consumer adoption of the golden record",
      "A claim that a mesh/decentralized model is governed without evidence of federated governance, data contracts, and central CDE accountability",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "governance/MDM value story / avoided-loss value net of haircuts",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross cost-of-poor-quality + duplicate-leakage opportunity to net realizable, subtracting the stewardship-capacity, committee-not-operating-model, COPDQ-softness, and consumer-adoption haircuts.",
    },
    {
      questionPattern:
        "data quality by critical data element / quality vs planning ranges",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar the data-quality score per critical data element (or per dimension) against planning ranges to expose where the binding constraint bites — not a blended estate average.",
    },
    {
      questionPattern:
        "MDM domain health / match rate, duplicate rate, stewardship SLA by domain",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap mastered domains (customer/product/vendor) against match rate, duplicate rate, stewardship SLA, and source-remediation status to show where golden-record trust holds or breaks.",
    },
    {
      questionPattern:
        "governance & MDM KPI scorecard",
      exhibitKind: "table",
      note: "DQ score by CDE, % CDE with owner, golden-record match rate, duplicate rate, catalog coverage, lineage completeness, time-to-resolve, policy compliance, % data products with contracts, stewardship SLA, COPDQ, time-to-onboard vs planning ranges.",
    },
    {
      questionPattern:
        "stewardship queue / backlog & SLA attainment over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend steward queue size, SLA attainment, and time-to-resolve to reveal whether the program is operating or dying in the workflow — the earliest signal of MDM/governance failure.",
    },
    {
      questionPattern:
        "ownership & accountability map / who owns each critical data element",
      exhibitKind: "table",
      note: "Per critical data element: the named business owner, steward, domain, classification, quality state, and lineage status — the test of operating model versus committee.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Governance runs as an operating model — named CDE owners, embedded stewards, and a daily workflow that changes how data is produced, not a committee and a charter",
      "MDM treats the stewardship workflow as the program: a staffed steward queue, governed survivorship, tuned matching, and source-system remediation, not just a purchased hub",
      "The catalog is owned, certified, classified, lineage-complete on CDEs, and actually used — and value is sized bottom-up from named loss events",
      "Where decentralized, the model is federated: data contracts, platform standards, and central CDE accountability keep a mesh governed rather than fragmented",
    ],
    failureDrivers: [
      "Governance is a committee, a charter, and a council cadence with no named owners or staffed stewardship — policy accumulates, quality does not improve",
      "MDM dies in the workflow: the algorithm is tuned but the steward queue backs up, survivorship is contested, and source systems keep recreating duplicates",
      "A catalog is bought and harvested but unowned, uncertified, and unused — 'we have a catalog' is mistaken for 'we are governed'",
      "Data-mesh is adopted as an org excuse to abolish central accountability rather than federate it — sanctioned silos with divergent definitions and breaking changes",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Adoption follows trust, and trust follows stewardship that visibly " +
      "works. A first governed critical domain — owners, quality rules, a " +
      "used catalog entry, a working steward workflow, and a trustworthy " +
      "golden record — proves value to the systems and teams that consume it; " +
      "they stop routing around the master record, which pulls adjacent " +
      "domains in. AI demand is the accelerant: it makes quality and lineage " +
      "board-visible and creates pull for governance that committees never " +
      "generated. The slow, decisive unlock is consumer adoption of the golden " +
      "record and the catalog — until downstream systems and people stop " +
      "maintaining shadow data and overriding the master, the program is built " +
      "but not pulled. Stewards and data owners move first; broad business and " +
      "AI-agent consumption are the lagging, value-defining waves.",
    roiClarity: "medium",
    roiClarityBasis:
      "The loss-avoidance slice — reduced rework, reconciliation, penalties, " +
      "and duplicate-driven leakage — is directly measurable once a bottom-up, " +
      "event-anchored cost-of-poor-quality baseline exists, so that ROI is " +
      "firm. The larger enablement value — analytics, AI, and operational " +
      "value unlocked by a trustworthy, owned, traceable substrate — is real " +
      "but soft: it is correctly attributed to the use cases it enables, not " +
      "to the governance line, and is gated by the stewardship-workflow " +
      "binding constraint. That is why the evidence and hedge rules force " +
      "bottom-up COPDQ sizing, attribute enablement value to use cases, and " +
      "discount hard for under-resourced stewardship and committee-only " +
      "governance.",
  },

  regulatoryFrame: {
    name: "Data governance, traceability & privacy obligations (BCBS 239 / GDPR / SOX over data)",
    relevance:
      "The dominant regulatory frame for governance and MDM: BCBS 239 mandates " +
      "accuracy, completeness, timeliness, and end-to-end lineage on critical " +
      "risk data; GDPR/CCPA and residency rules impose classification, access, " +
      "retention, and subject-rights duties that depend on a mastered customer " +
      "record and provable lineage; SOX makes data feeding financial reporting " +
      "an audited control requiring ownership, lineage, and change management. " +
      "Sector regimes (HIPAA/GLBA/PCI) and emerging AI data-governance duties " +
      "(e.g. EU AI Act) extend quality, documentation, and lineage obligations " +
      "to regulated and AI-consumed data (see vocabulary.regulatoryFrames) — " +
      "making ownership, quality, classification, and lineage compliance " +
      "objects, not optional hygiene.",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
