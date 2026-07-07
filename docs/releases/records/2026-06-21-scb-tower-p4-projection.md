# 2026-06-21-scb-tower-p4-projection — Durable AI Control Tower lens projection (ai_control_tower_lens_mv)

## Release ID

`2026-06-21-scb-tower-p4-projection`

## Status

`candidate`

## Plain-English Summary

Builds the durable Tower projection specced in §4f of `docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md` but never built: a materialized view `ai_control_tower_lens_mv` that projects the AI Control Tower lens FROM the context layer (`enterprise_context_records` + active facts, filtered to Tower record-types / the `governance_ai_evidence` dimension family), so Tower can read a committed projection instead of relying on the separate `ai_control_*` substrate (which First Capital never loaded — the root cause of Tower's "demo fallback"). Adds the MV migration + a typed read-model that shapes MV rows into the canonical lens types. **Not yet wired into the Tower read-model and NOT run against the DB — additive and inert until the migration is applied in the VNet and the read-model is wired as a `context_projection` precedence step (the follow-on).**

## Layer Impact

- **client-data-lane:** a new additive migration (a materialized view + indexes; guarded/idempotent with a DOWN block) and a new read-model module + test. No existing table/read-model changed; nothing consumes the read-model yet.

## Client Applicability

- All clients: No runtime change yet — the MV isn't applied and nothing reads it.
- Specific clients: Targets the First Capital Tower "demo fallback" root cause once wired.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260621120000_ai_control_tower_lens_mv.sql` — `CREATE MATERIALIZED VIEW ai_control_tower_lens_mv` (one row per tenant/record, facts rolled up via `jsonb_object_agg`) + a UNIQUE index for `REFRESH … CONCURRENTLY` + tenant/type/client indexes; guarded, idempotent, with rollback.
- `src/lib/tower/control-tower-lens-projection.ts` — pure `shapeControlTowerLensProjection(rows)` (routes rows into the 8 canonical lens arrays, reusing `src/lib/ai-control-tower/read-model.ts` shapes) + async `getControlTowerLensProjection({tenantKey, clientId, db?})` (returns null when empty/absent so callers fall through).
- `src/lib/tower/__tests__/control-tower-lens-projection.test.ts` — 14 tests on the pure shaping + mocked fetch.

## QA / Validation

Validation: Pass (static) — NOT live-proven. `tsc --noEmit` clean; the read-model test passes 14/14 (pure shaping + mocked DB). The migration SQL was sanity-checked by eye (valid Postgres; distinct non-colliding dollar-quote tags; correct `jsonb_object_agg`; CONCURRENTLY-capable unique index; follows repo migration conventions). The MV itself is NOT exercised — it only exists once the migration runs inside the private VNet (localhost cannot reach the private Postgres). Built to NOT depend on the P3 typed-value columns (which don't exist in this worktree yet); reads scalars from the `fact_value` JSONB bag, so it's correct against the current base schema.

## Rollout Plan

Merge to `main`. THEN apply the migration inside the VNet (ACA db-migrate job recipe), `REFRESH MATERIALIZED VIEW CONCURRENTLY ai_control_tower_lens_mv`, and (follow-on) wire `getControlTowerLensProjection` into `getAiControlTowerReadModel` as the `context_projection` precedence step before the synthetic fallback.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy` ships the code; the MIGRATION must be run via the private-VNet `job-abarva-db-migrate-*` job (NOT auto-applied).
- Shared runtime mutators: the migration creates a materialized view (additive).
- Approved image digest: db-migrate image built from this commit for the VNet job.
- ACA runtime invariant: no app behavior change until the read-model is wired.
- Worker image invariant: n/a.
- Feature/env flag update path: n/a.
- Live signed-in proof required: Yes — after the VNet migration + wiring, prove First Capital Tower reads the projection (not the demo fallback).

## Rollback Plan

Revert the PR (removes the migration + read-model). If already applied: `DROP MATERIALIZED VIEW IF EXISTS ai_control_tower_lens_mv` (the migration's DOWN block). No base-table change.

## Known Gaps

- NOT run live; read-model NOT wired into the Tower surface yet (both are the follow-on).
- Richer columns unlock once the P3 typed-value migration lands.
- The §4 column-contract drift test is a follow-on.

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-tower-p4-projection` → `main`.
- CI: `npm run release:check`, tsc clean, read-model test 14/14; migration eye-reviewed; explicitly NOT live-proven.
