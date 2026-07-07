# 2026-06-01-atlas-gauntlet-progress-and-smoke-profile — Atlas Gauntlet Progress and Smoke Profile

## Release ID

`2026-06-01-atlas-gauntlet-progress-and-smoke-profile`

## Status

`candidate`

## Plain-English Summary

Improves the Atlas production CXO gauntlet so it can run either the full 168-turn deck or a smaller smoke profile, and writes structured progress after every tenant and question. This makes long runs visibly alive and gives operators a fast post-deploy option without losing the full daily/manual gauntlet.

## Layer Impact

- `global-control-lane`: improves Atlas production QA workflow observability and run-profile control.
- Runtime product behavior: no customer-facing UI or API behavior changes.
- Data plane: no schema, migration, seed, or client data changes.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: the gauntlet continues to test Apex Retail, Meridian Health, and SkyHarbor Air.
- Internal only: yes, this is an AbarVa operator QA improvement.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`: adds `ATLAS_GAUNTLET_PROFILE=full|smoke`, progress NDJSON output, and per-turn progress console lines.
- `.github/workflows/atlas-prod-comprehensive-surface.yml`: adds a manual `profile` input and passes it to the harness.
- `docs/releases/records/2026-06-01-atlas-gauntlet-progress-and-smoke-profile.md`: release record.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not run locally: live production smoke/full gauntlet, because it requires production Clerk auth and should run from the merged GitHub workflow.

## Rollout Plan

Merge to `main`. Operators can manually dispatch `Atlas production CXO gauntlet` with `profile=smoke` for a fast post-deploy check or `profile=full` for the complete 168-turn run.

## Rollback Plan

Revert this PR to restore the previous single full-profile workflow behavior. No database rollback is required.

## Audit Evidence

- Workflow artifact now includes `progress.ndjson` alongside `index.html` and `raw.json`.
- Post-merge manual workflow dispatch URL once run.

## Known Gaps

GitHub still uploads artifacts only at the end of the job. The structured progress lines are emitted to the live job log and preserved in `progress.ndjson` for completed, failed, or canceled runs that reach artifact upload.
