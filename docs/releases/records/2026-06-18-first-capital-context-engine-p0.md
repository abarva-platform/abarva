# 2026-06-18-first-capital-context-engine-p0 - Dimension Family Schema

## Release ID

`2026-06-18-first-capital-context-engine-p0`

## Status

`candidate`

## Plain-English Summary

This release adds the schema hooks that let the context layer, Intelligence, and AI Control Tower ask the same data plane by dimension family, domain segment, business function, load order, and graph relationship. It is the first phase of the First Capital Financial V2 context engine build and does not load client data by itself.

## Layer Impact

`client-data-lane`: Adds metadata columns, indexes, and a read-only graph view to the Azure/Postgres enterprise context substrate. The change is additive and tenant-scoped through existing table keys.

## Client Applicability

- All clients: Receive the additive schema capability once migrations are applied.
- Specific clients: First Capital Financial uses this immediately in the V2 context engine load path.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Migration `supabase/migrations/20260618000000_dimension_family_columns.sql`.
- Adds `dimension_family` and `load_order` metadata on `enterprise_context_records`.
- Ensures `domain_segment` and `business_function` columns exist on `enterprise_context_records`.
- Adds `dimension_family` and `domain_segment` metadata on `enterprise_context_facts`.
- Adds tenant/family indexes for active record and fact queries.
- Adds `ai_control_graph_view` as a read-only alias over `enterprise_context_relationships`.

## QA / Validation

- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: local temporary Postgres 18 execution. The migration ran against an empty database and skipped through replay guards, then ran against minimal `enterprise_context_records`, `enterprise_context_facts`, and `enterprise_context_relationships` tables and created 4 record columns, 2 fact columns, 2 indexes, and `public.ai_control_graph_view`.
- Blocked: `npm run db:migrate:dry` reaches the repo migration runner after `npm ci`, but this worktree has no `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or `DATABASE_URL`; no Azure database migration was attempted from this local branch.
- Not run: TypeScript/build validation is not required for this SQL-only Phase 0 change.

## Rollout Plan

Merge to main after local validation and CI. Apply the migration through the standard Azure/Postgres migration path before running the First Capital V2 ACA seed job. No user-facing UI changes become active from this migration alone.

## Rollback Plan

This is additive. If rollback is required before loaders depend on the fields, drop `public.ai_control_graph_view`, drop indexes `idx_ecr_tenant_family` and `idx_ecf_tenant_family`, and leave the additive columns in place unless a DBA-approved rollback window is available. If a hard rollback is required, remove the new columns only after confirming no context engine load uses them.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Migration dry-run output: Local temporary Postgres execution passed; Azure/Postgres runner blocked locally by missing migration connection string.
- ACA migration apply receipt: Pending.
- First Capital V2 load receipt: Out of scope for Phase 0.

## Known Gaps

Phase 0 only creates schema affordances. It does not stage files, parse templates, commit records/facts/edges, refresh embeddings, or prove live retrieval. Those states are covered by Phases 1-4 of the First Capital context engine build.
