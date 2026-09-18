# Context dimension segment mapping

## Release ID

`2026-09-18-context-dimension-segments`

## Status

`candidate`

## Plain-English Summary

Universal intake dimensions now reach their declared context segment instead of silently defaulting to the program inventory. The mapping is exhaustive at compile time, so adding a dimension requires an explicit segment choice.

## Layer Impact

Global-control-lane adapter logic affects Layer 2 context ingestion and future tenant-scoped Layer 3 context records. This release does not rewrite existing records or change a read model.

## Client Applicability

- All clients: future universal-dimension context uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Restore the universal dimension-to-segment mappings from the previously reviewed catalog.
- Reuse the single typed mapping function when preparing upload chunks.
- Test all universal mappings and a prepared application upload.

## QA / Validation

- New focused behavior test failed before the fix and both focused tests passed afterward.
- Mutation of one declared segment made the focused test fail; restoring it passed.
- Entire pre-existing connector suite: 6 failing on baseline and 6 failing after this change, due to unavailable fixture files and a stale error-message assertion; no new failures.
- Scoped ESLint, TypeScript, and `git diff --check` passed.
- Live ingestion proof is not yet performed.

## Rollout Plan

Squash-merge after required checks pass. Use the repo-owned ACA main deploy workflow; no migration or data-build job is needed. Existing persisted context rows remain unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Pending deploy readback.
- ACA runtime invariant: Pending template and 100%-traffic revision digest readback.
- Worker image invariant: Pending deploy readback.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a controlled future upload, without changing unrelated tenant records.

## Rollback Plan

Restore the previous approved ACA digest through the repo-owned rollback path if ingestion regresses. Any rows written under this new mapping must be reviewed before a data-plane correction; code rollback alone will not rewrite them.

## Audit Evidence

PR, CI, ACA workflow, and controlled upload readback references will be added at their respective gates.

## Known Gaps

The six baseline connector-suite failures remain outside this scoped mapping fix. Existing rows previously assigned to the fallback segment are not corrected by this release.
