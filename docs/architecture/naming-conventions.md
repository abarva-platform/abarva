# Enterprise Data Naming Conventions

Status: official architecture baseline.

Product architecture, onboarding contracts, module APIs, reports, and future prompts must use enterprise layer names. Legacy version labels are allowed only as legacyMigrationName values in compatibility adapters, historical folders, migration notes, or appendices.

## Approved Vocabulary

- Tenant Packet
- Evidence Registry
- Canonical Fact Store
- Enterprise Relationship Graph
- Derived Intelligence Store
- Active Tenant Access Layer
- Module Context APIs
- Module Memory
- Outcome Ledger
- Benchmark Intelligence
- Artifact & Decision Record Layer
- Product Capability Registry

## Current-To-Target Map

| Current / legacy | Enterprise name | Use | Guidance |
| --- | --- | --- | --- |
| Legacy version-labeled packs | Legacy Tenant Intelligence Packs | legacyMigrationName | Rich historical source and migration input; not a live target architecture name. |
| Standardized generated packs | Standardized Tenant Packs / Relationship Graph Substrate | legacyMigrationName | Reusable source packet shape and relationship input; not a direct database contract. |
| Active access-shaped layer | Active Tenant Access Layer | targetName | Runtime access contract for active/candidate tenant data. |
| derived/home | Derived Intelligence Projection | targetName | Materialized projection for Home and answerability. |
| business_records | Canonical Objects | internalCompatibilityName | Keep as physical/internal table until wrapped by Canonical Fact Store APIs. |
| record_fields | Canonical Object Attributes | internalCompatibilityName | Field-level canonical attributes. |
| source_files | Evidence Sources | internalCompatibilityName | Evidence Registry source object records. |
| tenant_pack_runs | Tenant Load Runs | internalCompatibilityName | Load run history and provenance. |
| contract_versions | Tenant Data Versions | targetName | Candidate, active, rollback data versions. |
| active_tenant_contract_versions | Active Tenant Data Versions | internalCompatibilityName | Compatibility table for active tenant data version pointer. |
| graph_nodes | Enterprise Objects | internalCompatibilityName | Graph object compatibility name. |
| graph_edges | Enterprise Relationships | internalCompatibilityName | Graph relationship compatibility name. |
| relationship_types | Relationship Type Catalog | internalCompatibilityName | Relationship type dictionary. |
| graph_quality_reports | Relationship Quality Reports | internalCompatibilityName | Relationship quality gates. |
| source-event | Sourcing Execution Memory | targetName | Source workflow and commercial decision memory. |
| moves/program | Execution Program Memory | targetName | Move execution state and decision memory. |
| tower-standardized | Outcome Measurement Projection | targetName | Tower read projection over Outcome Ledger. |
| intelligence/dossier | Governed Answer Context | targetName | Answer/dossier context exposed through module APIs. |
| context-corpus | Market & Benchmark Context | targetName | Tenant-neutral corpus and benchmark context. |
| artifact/export | Artifact & Decision Record Layer | targetName | Exports, generated artifacts, decision records, and lineage. |
| templates | Input Packet Templates / Source Mapping Templates | targetName | Onboarding and mapping helpers, not persistence schema. |
| unknown | Unclassified Data Assets | quarantine | Classify or quarantine before use in active tenant truth. |
