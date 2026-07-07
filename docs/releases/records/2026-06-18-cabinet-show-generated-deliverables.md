# 2026-06-18-cabinet-show-generated-deliverables — File Cabinet shows generated deliverables by default

## Release ID

`2026-06-18-cabinet-show-generated-deliverables`

## Status

`candidate`

## Plain-English Summary

After a P1 Charter is generated via the durable "Approve & Build" path, the deliverable is produced and downloadable — but the **File Cabinet showed "No artifacts yet"** unless the user ticked *"Show version history."* So a freshly-built charter looked missing ("I generated it, where is it?").

Root cause: the Move artifacts API maps `generated_artifacts` rows **without a `lifecycleState`**, and the File Cabinet UI filters to `lifecycleState === "current"` — so every generated deliverable was hidden by default. (Live evidence on move `b359859f`: the artifacts API returned the charter and it downloaded with HTTP 200, but the default cabinet view showed zero.)

This change makes generated deliverables visible by default:

1. `generated_artifacts` rows now carry their `supersededBy` value, so the cabinet can distinguish current from superseded.
2. The artifacts API maps `lifecycleState: supersededBy ? "superseded" : "current"` — current deliverables show by default; superseded versions still appear only under "Show version history" (matching `move_artifacts` semantics).
3. Quality is normalized to the 0–100 the cabinet renders ("/100"): the orchestrator stores 0–1 (so it was showing "0.8/100"); now it shows e.g. "80/100".

## Layer Impact

- **`global-control-lane`** — shared Move artifacts read mapping + UI display semantics. No schema change (the `superseded_by` column already exists), no migration, no data write.

## Client Applicability

- All clients: **Yes** — shared File Cabinet behavior, no feature flag.
- Specific clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/artifacts/repository.ts` — `GeneratedArtifactRecord.supersededBy` + `rowToRecord` reads `superseded_by`.
- `src/app/api/v1/programs/[programId]/artifacts/route.ts` — generated-artifact mapping sets `lifecycleState` (current/superseded) and normalizes `qualityScore` to 0–100.
- `src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts` — added `supersededBy` to the fixture; **fixed a pre-existing mock gap** (the route gained `getActiveClientRow` but the test's `@/lib/active-client` mock only had `getActiveClientKey`, throwing "not a function").
- `src/lib/workspace-explorer/__tests__/moves-adapter-mapping.test.ts` — added `supersededBy` to the fixture.

## QA / Validation

- **PASS** — `eslint` + `tsc --noEmit` on changed files (0 errors).
- **PASS** — `jest` (artifacts route + repository + workspace-explorer mapping) → 12 tests; the previously-throwing artifacts route suite is now green.
- **NOT-RUN (pending deploy)** — confirm live on move `b359859f`: the generated charter appears in the **default** File Cabinet view (no "Show version history"), with quality rendered on a 0–100 scale.

## Rollout Plan

Merge to `main` → `aca-main-deploy` (web image; worker jobs unaffected by this change). No migration.

## Rollback Plan

Revert the PR and redeploy prior `main`. No data impact (read-mapping + display only).

## Audit Evidence

- PR URL (added on open) for `fix/cabinet-show-generated-artifacts`; CI run; live before/after of the File Cabinet default view on `b359859f`.

## Known Gaps

- The cabinet still shows "○ no blob" for generated deliverables (the storage indicator only recognizes the `move_artifacts` Azure-Blob path; generated deliverables are served via `/api/v1/artifacts/{id}` and are downloadable). Cosmetic; deferred — not changed here to avoid misrepresenting storage.
- `degraded_index_contract` (from the Azure Search drift resilience change) is still not persisted onto deliverable_run/artifact metadata.
- Fix A (rebuild First Capital's Azure Search index) remains the required data-plane follow-up.
