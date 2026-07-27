# SQL Azure Hardening Report

The copied Phase 2B-3B SQL is a physical-model baseline, not an Azure-ready migration.

Required before migration apply:

1. Keep the local spike guard in `001_physical_model_spike.sql`; generate a lab migration that requires `current_database() = 'abarva_hc_demo_new_knowledge_lab'`.
2. Add role/bootstrap DDL for `hc_demo_new_ingest`, `hc_demo_new_reviewer`, `hc_demo_new_publisher`, `hc_demo_new_reader`, `hc_demo_new_evaluator`, and `hc_demo_new_admin`.
3. Add schema usage, table privileges, sequence privileges, function execution rights, default privileges, and explicit deny boundaries.
4. Extend RLS or role/schema boundaries across every governed tenant-keyed table, not only the three local-conformance examples.
5. Change `consumption.strategic_insight.authority_state` default away from `accepted`; use `candidate` or `planning_grade` until explicit review/publication.
6. The reviewer identity maps only to review transitions. It must not publish baselines.
7. The evaluator identity is the only identity allowed to read restricted evaluator assets. Runtime read identity must not see hidden truth.
8. Migration execution must be a governed ACA job with manifest hash, target database guard, idempotency key, and rollback evidence.

No migration was run in Phase 2B-3C-1.
