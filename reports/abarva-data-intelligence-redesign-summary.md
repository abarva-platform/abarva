# AbarVa Data & Intelligence Redesign Summary

Generated: 2026-07-11T19:06:21.999Z

## Top 10 Current-State Findings

1. Repo-local files inventoried: 2725.
2. File-based rows inventoried: 100,537.
3. SQL table definitions inventoried: 377.
4. Home and Intelligence are closest to common-layer grounding.
5. Moves, Source, and Tower have rich workflows but are not universally read/write bound to the Active Tenant Access Layer.
6. V6 graph substrate should explain dependencies and lineage, not calculate spend, value, ROI, or risk.
7. Derived Home exists locally, but is not yet a universal runtime substrate.
8. Offline repo audit proves files, scripts, schema references, and local reports; it does not prove current live DB row counts.
9. Historical packs are data-rich migration sources, not obsolete junk.
10. The Active Tenant Access Layer should become the runtime access spine with one promoted active tenant data version per tenant.

## Top 10 Naming Changes

| Current | Target | Disposition |
| --- | --- | --- |
| v1/v2 | Legacy Load Substrate | wrap |
| v4 | Legacy Tenant Intelligence Pack | wrap |
| v6 | Standardized Tenant Pack | wrap |
| v7 | Active Tenant Access Layer | keep |
| derived/home | Home Intelligence Projection | rename |
| business_records | Canonical Objects | wrap |
| record_fields | Canonical Object Fields | wrap |
| source_files | Evidence Sources | wrap |
| tenant_pack_runs | Tenant Contract Runs | wrap |
| graph_nodes / graph_edges | Enterprise Relationship Graph | keep |

## Top 10 Target Architecture Changes

1. Evidence Registry: Tracks source objects, provenance, authority, sensitivity, confidence, freshness, and retrieval proof.
2. Canonical Fact Store: Stores normalized tenant objects/facts/fields with versions and source links.
3. Enterprise Relationship Graph: Stores typed tenant-scoped object relationships and graph quality.
4. Derived Intelligence Store: Stores deterministic profiles, gaps, assumptions, blocked claims, recommendations, readiness, and answerability.
5. Module Memory: Stores module-created decisions, artifacts, events, assumptions, and proposed memory before promotion.
6. Outcome Ledger: Stores projected, committed, tracked, measured, realized, and attested value.
7. Product Capability Registry: Stores safe product capability claims, required evidence, unsupported patterns, and module contracts.
8. Access and Dossier Layer: Serves active/candidate version packets to modules through governed context APIs.
9. Benchmark Intelligence: Stores privacy-safe tenant-neutral benchmarks and market/corpus signals.

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

PR 1. Naming/glossary + architecture contract: No runtime behavior change.
PR 2. Stranded-intelligence report: Identify source rows/files not visible through the Active Tenant Access Layer.
PR 3. Module context API contracts: Define interfaces for Home, Intelligence, Moves, Source, Tower.
PR 4. Outcome Ledger schema/design: Define value commitment, measurement, realized value, leakage, attestation.
PR 5. Module Memory schema/design: Define write-back and promotion model.
PR 6. SkyHarbor Active Tenant Access upgrade snapshot: Map SkyHarbor historical/standardized/Source/Moves/Tower data into a candidate tenant data version.
PR 7. Derived intelligence + readiness for SkyHarbor: Generate Home projection, gaps, graph rollups, readiness.
PR 8. Proof harness: Prove file -> load -> fact -> graph -> derived -> module -> answer/artifact -> write-back.

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

## Proof Standard

file present -> validated -> loaded -> indexed -> retrievable -> cited -> browser-visible -> module-consumed -> write-back created -> candidate refreshed -> active version promoted

## Evidence Paths

- reports/abarva-end-to-end-data-flow-latest.html
- reports/abarva-end-to-end-data-flow-latest.json
- reports/abarva-end-to-end-data-flow-summary.md
- reports/abarva-client-data-layer-operating-model-20260711.md
- scripts/v7/sql/intelligence-v7-moat-foundation.sql
- supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql
- supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql
- docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md
- scripts/v7/load-tenant-v7-azure.mjs
- scripts/v7/build-home-derived-layer.mjs
- scripts/source/load-skyharbor-contract-optimization.ts
- scripts/skyharbor/*
- datasets/skyharbor-air-synthetic-v6/V6_GENERATED_MANIFEST.json
- datasets/meridian-health-v6-v7-current-state-v1/derived/home
