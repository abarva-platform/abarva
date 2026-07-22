# 2026-07-22-tower-mart-source-registry — Populate cio_tower.source_registry in the mart write

## Release ID

`2026-07-22-tower-mart-source-registry`

## Status

`candidate`

## Plain-English Summary

With the `ai_control` substrate repaired, the governed Tower mart write got further: it recorded the run in `ai_control_refresh_runs`, opened the mart transaction, and then failed inserting into `cio_tower.facts` with `violates foreign key constraint "facts_source_key_fkey"`. Cause: `cio_tower.facts.source_key REFERENCES cio_tower.source_registry(source_key)`, and the V3 facts carry the source CSV filename as `source_key`, but the write module never populated `source_registry` (the prior single-tenant pipeline did). The transaction rolled back — the mart was again untouched (fail-safe held).

This PR fixes the write module to populate `cio_tower.source_registry` for the tenant before inserting facts, derived from the distinct non-null `source_key` values the facts carry (V3 CSV filenames; `tower_*` telemetry facts have a null `source_key` and need no registry row). `source_file` mirrors the key, `source_system` comes from the fact attributes, `trust_tier` is `synthetic_demo`. The delete/insert order is FK-correct: facts are deleted before `source_registry`, and `source_registry` is inserted before facts.

## Layer Impact

- `internal-admin` lane: `src/scripts/tower/project-tower-mart-write.ts` — operator write module. Adds `source_registry` population; no runtime request-path change.

## Client Applicability

- All clients: the write module is tenant-generic.
- Feature flag: none.

## Changes Included

- `src/scripts/tower/project-tower-mart-write.ts` — `buildSourceRegistryRows()` + upsert `cio_tower.source_registry` before facts; add `source_registry` to the tenant delete set (after facts, FK-correct order).

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in the write module.
- Pass: `jest src/lib/cio-tower/mart-projection/__tests__/` — 49/49 (library unchanged).
- Diagnosed against the real governed ACA job: prior run failed on `facts_source_key_fkey` AFTER the ai_control_refresh_runs insert succeeded and the mart transaction began — proving the substrate repair worked and isolating this FK as the next (and final expected) gap. Mart verified untouched (transaction rolled back).
- Not run here: the live write with this fix — that is the next governed ACA job step after deploy.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds the image. Then, as the governed operator step, re-run `project:tower-mart:meridian:write-job` via the ACA job — expected to complete, populating `source_registry` + `facts` + all `mart_*`, tracked in `ai_control_refresh_runs`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: after the write completes and DB volumetrics are captured.

## Rollback Plan

Revert the PR. The write is idempotent (full per-tenant refresh); reverting restores the prior write behavior. No schema change.

## Audit Evidence

- Job logs: `insert or update on table "facts" violates foreign key constraint "facts_source_key_fkey"`, after `ai_control_refresh_runs` insert succeeded.
- PR URL: pending.

## Known Gaps

- The unified Tower mart write is still not live-proven — the completing run is the next governed step, gated on this deploy.
- Real `tower_*` telemetry remains un-ingested (usage/adoption stays gap-only).
