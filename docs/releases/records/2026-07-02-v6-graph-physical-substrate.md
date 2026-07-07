# 2026-07-02-v6-graph-physical-substrate — V6 Canonical Graph Physical Tables

## Release ID

`2026-07-02-v6-graph-physical-substrate`

## Status

`candidate`

## Plain-English Summary

This release adds the physical Azure/Postgres tables for the canonical V6 enterprise graph substrate. The tables make the V6 graph real in the data plane, but they do not automatically replace any current Home, Intelligence, Source, Moves, or Tower behavior. Modules should adopt the graph only after shadow comparison proves answer quality, tenant safety, and latency are same-or-better.

## Layer Impact

- `client-data-lane`: Adds additive `intelligence_v6` graph tables, indexes, seed relationship dictionary rows, RLS policies, grants, and comments.
- `global-control-lane`: Updates shared agent guidance so all agents understand the physical graph substrate and the staged module-adoption boundary.

## Client Applicability

- All clients: The schema is shared and tenant-scoped.
- Specific clients: None.
- Internal only: Initial use is internal/shadow materialization and quality scoring until module-specific adoption is proven.
- Public/demo only: No.
- Feature flag: No runtime feature flag in this release.

## Changes Included

- `supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql`
- `AGENTS.md`
- `docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md`
- `docs/releases/records/2026-07-02-v6-graph-physical-substrate.md`

## QA / Validation

- `pass`: SQL migration static review for additive table creation, indexes, seed dictionary rows, RLS, grants, and comments.
- `pass`: `git diff --check`
- `pass`: `npm run audit:architecture-rules`
- `pass`: Disposable local Postgres replay with `psql -v ON_ERROR_STOP=1`; verified four `intelligence_v6` graph tables and 17 relationship dictionary rows.
- `pass`: `npm run release:check`

## Rollout Plan

Merge to `main`, then apply the additive migration to Azure/Postgres through the approved database migration/operator lane. No Azure Container Apps image deploy is required unless a later PR wires module runtime reads to these tables.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this schema-only candidate.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable unless a later runtime PR consumes the graph.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Not for this schema-only candidate. Required later for any module consuming the graph.

## Rollback Plan

The migration is additive. If it must be rolled back before module adoption, drop the four new tables in reverse dependency order:

1. `intelligence_v6.graph_edges`
2. `intelligence_v6.graph_quality_reports`
3. `intelligence_v6.graph_nodes`
4. `intelligence_v6.relationship_types`

Do not run rollback after materializers or modules begin writing/reading these tables without first exporting evidence and confirming no active graph consumers depend on them.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local validation output: `git diff --check`, `npm run release:check`.
- Local disposable replay: `intelligence_v6.graph_edges`, `intelligence_v6.graph_nodes`, `intelligence_v6.graph_quality_reports`, and `intelligence_v6.relationship_types` created; `relationship_types` seed count = 17.
- Migration file: `supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql`.

## Known Gaps

- This does not materialize graph rows yet.
- This does not wire Home, Intelligence, Source, Moves, or Tower to the graph.
- This does not apply the migration to Azure/Postgres by itself.
