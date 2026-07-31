# Phase 2B-3C-2C PostgreSQL Identity, RLS and Migration Readiness

Tenant: `airline-demo-new` (Airline Demo New)

This package is plan-only. It does not apply a migration and does not load source data.

## Required readiness controls

- Azure Lab database guard: `abarva_airline_demo_new_knowledge_lab`.
- Entra authentication and Entra administrator bootstrap must be enabled before SQL execution.
- Managed identities map to database roles: `airline_demo_new_ingest`, `airline_demo_new_reviewer`, `airline_demo_new_publisher`, `airline_demo_new_reader`, `airline_demo_new_evaluator`, `airline_demo_new_admin`.
- Ingest can create candidates but cannot publish.
- Reviewer can review and route, but cannot publish baselines.
- Publisher can publish domain/baseline/read models but cannot read hidden evaluator truth.
- Reader can read accepted/published consumption surfaces but cannot read working candidates.
- Evaluator can read hidden truth and published reconstruction outputs, but cannot mutate Knowledge.
- Strategic insight defaults to planning grade; accepted insight requires explicit review/publication.
- Empty database replay, idempotent second replay, and rollback rehearsal are mandatory before Azure migration apply.

## Still blocked

- No Azure PostgreSQL DDL has been applied.
- No source landing, parsing, normalization, publication, or runtime read-model switch is authorized by this package.
- Execution must be through the governed ACA migration job only.
