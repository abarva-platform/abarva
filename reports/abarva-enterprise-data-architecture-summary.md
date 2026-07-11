# AbarVa Enterprise Data Architecture Summary

Generated: 2026-07-11T19:26:44.169Z

## Top 10 Current-State Findings

1. Repo-local files inventoried: 2727.
2. File-based rows inventoried: 100,538.
3. SQL table definitions inventoried: 377.
4. Rich tenant data exists across SkyHarbor, First Capital, Apex, Meridian, Lakeshore, Northstar, and others.
5. The problem is inconsistent normalization, fragmented historical layers, module-local data, weak universal write-back, and inconsistent consumption.
6. Home and Intelligence are closest to common-layer grounding.
7. Moves, Source, and Tower have rich local workflows but are not universally read/write bound to the Active Tenant Access Layer.
8. The relationship graph substrate should explain relationships, not calculate spend/value/ROI.
9. Derived Intelligence Projection exists locally but is not a universal runtime substrate.
10. Offline repo audit cannot prove live DB row counts; keep repo/file/schema evidence separate from live DB/read-model evidence.

## Top 10 Naming Changes

| Current / legacy | Enterprise name | Use |
| --- | --- | --- |
| Legacy version-labeled packs | Legacy Tenant Intelligence Packs | legacyMigrationName |
| Standardized generated packs | Standardized Tenant Packs / Relationship Graph Substrate | legacyMigrationName |
| Active access-shaped layer | Active Tenant Access Layer | targetName |
| derived/home | Derived Intelligence Projection | targetName |
| business_records | Canonical Objects | internalCompatibilityName |
| record_fields | Canonical Object Attributes | internalCompatibilityName |
| source_files | Evidence Sources | internalCompatibilityName |
| tenant_pack_runs | Tenant Load Runs | internalCompatibilityName |
| contract_versions | Tenant Data Versions | targetName |
| active_tenant_contract_versions | Active Tenant Data Versions | internalCompatibilityName |

## Target Architecture In One Page

1. Client evidence inputs
2. Tenant Packet
3. Evidence Registry
4. Canonical Fact Store
5. Enterprise Relationship Graph
6. Derived Intelligence Store
7. Active Tenant Access Layer
8. Module Context APIs
9. Home / Intelligence / Moves / Source / Tower / Export
10. Module Memory + Outcome Ledger
11. Validated Write-Back
12. Candidate Tenant Data Version
13. Active Tenant Data Version

## New Tenant Onboarding Model

Tenant Packet -> manifest -> source adapters/parsers -> Canonical Ingestion Contract -> mapping and normalization -> validation/reconciliation -> target data-layer writer -> candidate tenant data version -> Derived Intelligence -> analytics -> module readiness -> proof -> active version promotion.

Required load states:
- packet_received
- manifest_validated
- sources_parsed
- mapping_complete
- evidence_registered
- canonical_facts_loaded
- relationships_resolved
- retrieval_indexed
- derived_intelligence_built
- analytics_computed
- home_ready
- intelligence_ready
- moves_ready
- source_ready
- tower_ready
- candidate_version_created
- proof_passed
- active_version_promoted

## First 10 Analytics Models

1. Enterprise Knowledge Coverage Score: Shows how much of the enterprise is known and source-backed.
2. Topic Answerability Score: Determines whether a topic can be safely answered.
3. AI Investment Readiness Score: Ranks AI bets by evidence, dependencies, value, and control readiness.
4. Move Readiness Score: Assesses whether a Move phase/gate can advance.
5. Sourcing Opportunity Score: Identifies addressable sourcing/commercial opportunity.
6. Vendor Leverage Score: Quantifies commercial leverage for negotiation.
7. Promised vs Measured vs Realized Value Model: Separates projected, committed, measured, and attested value.
8. Value Confidence Score: Rates confidence in a value claim.
9. Strategy-to-Execution Traceability Score: Traces strategy to Moves, Source events, and Tower outcomes.
10. Evidence Freshness and Staleness Risk Score: Flags stale or superseded facts before answer use.

## First 8 Implementation PRs

PR 1. Naming convention reset + architecture contract: No runtime behavior change; glossary, mapping, and legacy-name rule.
PR 2. Tenant Packet contract: Manifest, source classes, real/synthetic/sensitive status, intended domains/modules, load states.
PR 3. Canonical Ingestion Contract + Source Adapter Interface: Neutral ingestion object and pluggable adapter interface.
PR 4. Mapping Registry: Source-to-canonical mappings, tenant overlays, coverage, unmapped-field reporting.
PR 5. Target Data-Layer Writer contract: Canonical ingestion writes to evidence, facts, graph, derived intelligence, memory, and outcomes.
PR 6. Module Context API contracts: getHomeContext, getIntelligenceContext, getMoveContext, getSourceContext, getTowerContext, validation and promotion APIs.
PR 7. Outcome Ledger schema/design: Value commitment, measured value, realized value, leakage, attestation, owner accountability.
PR 8. Module Memory schema/design: Decisions, assumptions, gate approvals, Source awards, artifacts, accepted insights, promotion status.

## Key Risks

- Big-bang rewrite would destabilize working modules.
- Historical packs could be wrongly discarded even though they are rich migration sources.
- Module-local data could continue drifting from common tenant truth.
- Value claims could be over-promoted without Outcome Ledger measurement/attestation.
- Benchmark signals could leak private tenant facts if opt-in and cohort controls are weak.
- Synthetic data could be accidentally laundered into real-client claims.
- Offline file proof could be mistaken for live DB/read-model proof.
- Active Tenant Access Layer adoption could remain Home/Intelligence-only unless Moves/Source/Tower write-back is enforced.

## Open Decisions

- Approve Active Tenant Access Layer as the runtime access principle.
- Approve product/business layer names versus internal schema names.
- Choose first new-client pilot input bundle and minimum required files.
- Approve SkyHarbor as first existing-tenant upgrade proof.
- Decide whether Outcome Ledger is new schema family or wraps existing value_states/outcome_ledger first.
- Decide benchmark opt-in/cohort threshold policy.
- Define who can certify realized value.
- Decide when module context APIs become mandatory for new module work.
- Approve Tenant Packet as the only new-client input contract language.
- Approve canonical ingestion as the stable contract between source adapters and target persistence.
- Approve source/data-layer decoupling as non-negotiable for private client scale.
