# 2026-06-20-source-reasoning-1-1-classify-at-intake — Source Reasoning Spine: Classify-at-Intake (Slice 1.1)

## Release ID

`2026-06-20-source-reasoning-1-1-classify-at-intake`

## Status

`candidate`

## Plain-English Summary

When a new Source event is created, the deterministic category classifier
(`classifySourcingEvent`) now runs on the event name and description and
stores its output — the precise `categoryId` such as `"ams"`, `"erp_si"`,
`"ai_engineering_partner"` — in a new `source_events.classified_category`
column. This pre-computed result is then passed through `SourceGenerationContext`
and read by the reasoning spine's recommendation stage as the preferred
archetype source, before falling back to the live in-generate re-classification
and then the coarse `event_type` label.

The net effect: the reasoning envelope's `archetype` field is stable from the
first generate call onward, and the UI can surface the precise category on
event lists/detail views before any generation has occurred. Existing events
retain `NULL` in `classified_category` and continue using the live-classifier
fallback — no data migration required.

## Layer Impact

**Lane:** `client-data-lane` (schema change + pure-function intake-time classification)

- **`supabase/migrations/20260620000001_source_events_classified_category.sql`**:
  `ALTER TABLE source_events ADD COLUMN IF NOT EXISTS classified_category TEXT`.
  Additive only; no existing data is changed.
- **`src/lib/source/queries.ts`**: `createSourcingEvent` calls `classifySourcingEvent`
  after the upsert and UPDATEs the row with `classified_category`. Non-fatal on failure.
  Row mapper adds `classifiedCategory` to `SourcingEventSummary`.
- **`src/lib/source/types.ts`**: `SourcingEventSummary` gains optional `classifiedCategory`.
- **`src/lib/source/agent-generation/types.ts`**: `SourceGenerationContext.event` gains
  optional `classifiedCategory`.
- **`src/lib/source/agent-generation/context-binder.ts`**: passes `classifiedCategory`
  from the summary to the context.
- **`src/lib/source/reasoning/recommendation-stage.ts`**: `classifiedCategory` preferred
  before the live classifier `categoryId` before the legacy `archetype` label.
- **`src/lib/source/reasoning/analysis-stage.ts`**: `classifiedCategory` preferred before
  `archetype` for the analysis plan metadata.

## Client Applicability

- All clients: `classifiedCategory` is set for any newly created event; existing events
  retain NULL and fall back silently.
- Feature flag: none required. The classifier is deterministic and non-LLM. The
  `source_reasoning_spine` flag controls whether the reasoning envelope is built and
  surfaced; Slice 1.1 is upstream of that and always runs at creation time.

## Changes Included

- `supabase/migrations/20260620000001_source_events_classified_category.sql`: ADD COLUMN
- `src/lib/source/queries.ts`: import classifier, classify at creation, map to summary
- `src/lib/source/types.ts`: `SourcingEventSummary.classifiedCategory`
- `src/lib/source/agent-generation/types.ts`: `SourceGenerationContext.event.classifiedCategory`
- `src/lib/source/agent-generation/context-binder.ts`: pass-through
- `src/lib/source/reasoning/recommendation-stage.ts`: prefer `classifiedCategory`
- `src/lib/source/reasoning/analysis-stage.ts`: prefer `classifiedCategory`
- `src/lib/source/reasoning/__tests__/capture.test.ts`: 2 new Slice 1.1 tests
- `docs/releases/records/2026-06-20-source-reasoning-1-1-classify-at-intake.md`: this record

## QA / Validation

Status: **pass (unit) / pending (DB apply)**

- Jest capture suite: **10/10 PASS** — includes 2 new Slice 1.1 tests verifying:
  1. `envelope.archetype` uses `classifiedCategory` when set
  2. Falls back to live classifier when `classifiedCategory` is null
- `tsc --noEmit`: **PASS** (zero `error TS` diagnostics)
- DB apply: requires running migration against ACA private Postgres via VNet job
  (`job-abarva-db-migrate-lab-eastus`). Not yet applied — pending.

## Rollout Plan

1. Merge PR to `main`.
2. ACA auto-deploys web revision.
3. Run migration via VNet job:
   ```
   az acr manifest list-metadata --registry acrabarvalab001 --name abarva/web \
     --orderby time_desc --top 1
   az containerapp job update --name job-abarva-db-migrate-lab-eastus \
     --resource-group rg-abarva-controlplane-lab-eastus \
     --image acrabarvalab001.azurecr.io/abarva/web@sha256:<new-digest>
   az containerapp job start --name job-abarva-db-migrate-lab-eastus \
     --resource-group rg-abarva-controlplane-lab-eastus
   ```
4. Create a new Source event → verify `classified_category` is non-NULL in DB.
5. Generate with Sentinel → verify `envelope.archetype` matches `classified_category`.

## Rollback Plan

`ALTER TABLE source_events DROP COLUMN classified_category;` and revert web image.
The classify-at-create call is non-fatal and has no effect on existing event records.
The fallback chain in `recommendation-stage.ts` and `analysis-stage.ts` degrades to the
live-classifier result, which is what all events used before this slice.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: `job-abarva-db-migrate-lab-eastus` (migration apply)
- Approved image digest: set at merge time by ACR build
- ACA runtime invariant: single active revision post-deploy
- Worker image invariant: migrate job pinned to immutable SHA256 digest before running
- Feature/env flag update path: no new flag; `classified_category` populates for all
  new events on all tenants once migration is applied
- Live signed-in proof required: yes — create event, verify `classified_category` non-NULL

## Known Gaps

- Migration not yet applied to ACA private Postgres (requires VNet job run after merge).
- Live signed-in proof pending (requires deployed image + applied migration).
- Existing events retain `classified_category = NULL`; no backfill script provided
  (deferred to a separate backfill wave if needed).
- `SourcingEventDetail` does not yet expose `classifiedCategory` through the detail
  query path (only the summary path was updated). Detail view will still show NULL
  until a separate PR extends the detail mapper.

## Audit Evidence

- Branch: `codex/source-reasoning-1-1`
- Jest 10/10: capture suite including 2 new Slice 1.1 tests
- tsc: zero errors
- Migration SQL: additive only (`ADD COLUMN IF NOT EXISTS`), no destructive operations
