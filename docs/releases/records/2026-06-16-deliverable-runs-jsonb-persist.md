# 2026-06-16 Deliverable Runs JSONB Persist Fix — successful runs save

## Release ID

`2026-06-16-deliverable-runs-jsonb-persist`

## Status

`candidate`

## Plain-English Summary

Fixes the last bug blocking a board-grade deliverable from being saved. When the generation worker finished all six passes and tried to record a **successful** run, the write failed with `invalid input syntax for type json`. The `deliverable_runs.blockers` and `deliverable_runs.warnings` columns are JSONB; the write client binds parameters raw, so a non-empty JavaScript array reaches Postgres as an array literal (`{a,b}`) which JSONB rejects. Empty arrays slipped through (they bind as `{}`, valid empty JSON), which is why only **successful** runs — the ones that carry non-empty advisory `warnings` — failed, while blocked/failed runs (empty arrays) saved fine. The fix pre-serializes those two arrays to JSON strings before the update, so JSONB always accepts them; the read path already parses them back to arrays.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Runtime application code — one write helper (`completeDeliverableRun` in `src/lib/deliverables/orchestrator/runs-repository.ts`) used by the durable generation worker. No schema change (columns are already JSONB), no data-plane topology change, no API contract change.

## Client Applicability

- **All clients:** Yes — every tenant generating board-grade deliverables; without this, no successful run could ever persist its artifact reference.
- **Specific clients:** None singled out.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `src/lib/deliverables/orchestrator/runs-repository.ts` — modified: `completeDeliverableRun` now writes `blockers`/`warnings` as `JSON.stringify(...)` so the JSONB bind accepts non-empty arrays.
- `src/lib/deliverables/orchestrator/__tests__/runs-repository.test.ts` — added a regression test asserting both columns serialize to JSON strings.

## QA / Validation

- `npx jest …/runs-repository.test.ts` → **10 passed / 10 total** (incl. new regression test).
- `npx jest …/persistence.test.ts …/model-caller.test.ts` → pass.
- `npx tsc --noEmit` → no errors in the changed file (only pre-existing unrelated missing-optional-dep errors).
- **Live evidence (before fix):** SkyHarbor Move `7416481a`, run `725559a6` reached `progressPct:100 / "Formatting the final document"` (the final render_package pass — proving the streaming fix carried all six passes) then failed at persistence with `deliverable_runs update failed: invalid input syntax for type json`.
- **Post-deploy verification (to attach):** re-run the P1 Program Charter; expect `status:succeeded` with an `artifactId` and a new DOCX in the File Cabinet dated 2026-06-16.

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build`; the durable generation worker job (`job-abarva-deliv-worker`) runs that image and is the actual caller of `completeDeliverableRun`, so update the job's image to the new tag (and roll the web revision to match). No migration, no flag.

## Rollback Plan

Re-point the worker job (and web revision) to the prior image tag (`streamfix-899a824b`). No data migration to unwind; the only behavioral difference is that successful runs again fail to persist (the pre-fix state), leaving the durable row in a recoverable non-terminal/failed state.

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc output above
- ACA: new worker job image tag + web revision (to attach after deploy)
- Live: File Cabinet DOCX for Move `7416481a` dated 2026-06-16 and the worker log line `done · processed=1` with the run reaching `succeeded`.

## Known Gaps

- The underlying write client (`postgresCompat.ts` `executeUpdate`/`executeInsert`) binds array params raw rather than detecting JSONB columns and serializing — a general latent footgun for any caller writing a non-empty array to a JSONB column. A broader client-level fix is out of scope here (it needs column-type awareness so it doesn't break genuine Postgres `text[]` columns) and is noted for follow-up.
