# 2026-08-15-runtime-layer-refresh-live-schema-backfill — Runtime graph substrate hardening

## Release ID

`2026-08-15-runtime-layer-refresh-live-schema-backfill`

## Status

`candidate`

## Plain-English Summary

Hardens the runtime layer refresh migration for live database drift where the graph substrate migration is recorded but the physical graph tables are absent. The migration remains additive and idempotent: it creates the missing graph dictionary, graph nodes, graph edges, and graph quality tables only when absent, then applies the runtime refresh tables.

## Layer Impact

- `runtime-layer-refresh` lane: Makes the approved Layer 3 graph/canonical migration self-contained for the live database shape.
- Layer 1: No change.
- Layer 2: No change.
- Layer 3: Additive schema hardening only; no tenant data rows are written by this PR.
- Layer 4: No change.

## Client Applicability

- All clients: No default runtime behavior change.
- Specific clients: None by default; migration apply remains an operator action.
- Internal only: ACA operator migration path and runtime data-plane substrate.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260815162000_intelligence_v6_runtime_layer_refresh.sql`: adds missing graph substrate table creation, indexes, RLS policies, grants, comments, and base relationship dictionary rows ahead of the runtime refresh table setup.

## QA / Validation

- Pass: live ACA operator apply failure captured `relation "intelligence_v6.relationship_types" does not exist` before the migration was recorded applied.
- Pending: fresh migration replay in CI.
- Pending: narrow ACA operator migration dry/apply after merge and repo-owned deploy.

## Rollout Plan

Merge to main, allow the repo-owned ACA deploy workflow, then rerun the narrow `runtime-layer-refresh:migrate:dry` and `runtime-layer-refresh:migrate:apply` scripts through the digest-pinned ACA operator job.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Migration apply: Approved only for `20260815162000_intelligence_v6_runtime_layer_refresh.sql` through the narrow package script.
- Tenant data mutation: Not included in this PR.
- Live truth claims: Not approved by this record.

## Rollback Plan

If unmerged, revert the migration hardening. After successful migration apply, rollback requires an explicit database rollback plan and operator approval because physical schema objects may exist.

## Audit Evidence

- `/tmp/nexus-runtime-layer-refresh-narrow-migrate-apply-5fc0f274/04-logs.txt`
- `/tmp/nexus-runtime-layer-refresh-narrow-migrate-apply-5fc0f274/06-migration-seal.json`
- `/tmp/nexus-runtime-layer-refresh-narrow-migrate-apply-5fc0f274/99c-idle-verification.json`

## Known Gaps

- This does not apply the migration.
- This does not retry the runtime layer refresh job.
