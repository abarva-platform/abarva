# 2026-07-29-knowledge-schema-runtime-migration — Knowledge Publication Schema Migration

## Release ID

`2026-07-29-knowledge-schema-runtime-migration`

## Status

`candidate`

## Plain-English Summary

Adds the already-approved Phase 3C-2E Knowledge publication and consumption SQL contract to the governed runtime migration lane. The previous contract artifact lived under `clients/shared/.../sql`, but the lab database migration workflow only applies files under `supabase/migrations`.

This release creates the runtime migration wrapper needed for the deployed Knowledge HTTP provider to find the `publication` and `consumption` schemas.

## Layer Impact

- `client-data-lane`: creates shared Knowledge publication/consumption schema objects in Azure/Postgres.
- `global-control-lane`: enables the already-deployed HTTP consumption provider to read the governed schema when a tenant baseline exists.
- Database schema: yes, additive/idempotent schema creation.
- Tenant facts: no.
- Source landing: no.
- Review decisions: no.
- Baseline publication: no.
- Product UI code: no.
- ACA image: no direct app-code change in this release.

## Client Applicability

Client applicability: all clients and synthetic tenants that later opt into the governed Knowledge publication/consumption framework receive this shared schema capability after the lab migration is applied. This does not activate a tenant, publish a baseline, or grant product access by itself.

## Changes Included

- Adds `supabase/migrations/20260729015000_knowledge_publication_consumption_phase3c2e.sql`.
- The migration is a runtime-lane wrapper around the approved Phase 3C-2E SQL contract.
- No tenant data, source files, review decisions, or baseline rows are inserted.

## QA / Validation

Pass:

- `npm run test:phase3c2e-data-layer`
- Verified the migration wrapper has no psql-only meta commands.

Pending:

- `npm run release:check`

Post-merge/apply:

- Run the governed lab database migration workflow in `apply` mode.
- Verify `publication.knowledge_baseline` exists in the lab database.
- Re-test the signed-in Knowledge HTTP canary.

## Rollout Plan

Merge by PR, then run the approved `Database migration — lab` workflow against the lab database with explicit apply confirmation.

## Deployment Authority

Database apply authority remains the governed `Database migration — lab` workflow. This PR only makes the schema available to that lane; it does not apply the migration by merging.

## Rollback Plan

This migration is additive and uses `CREATE ... IF NOT EXISTS`. Rollback is to stop tenant activation/publication and leave the unused schema in place until a separately approved cleanup migration is authored. No destructive rollback is bundled here.

## Audit Evidence

The browser canary showed the deployed HTTP provider failing with `relation "publication.knowledge_baseline" does not exist`. This release wires the existing schema contract into the real migration lane so the runtime database can satisfy that dependency.

## Known Gaps

- Applying the schema does not publish or activate any tenant baseline.
- The signed-in canary must be rerun after the migration apply.
