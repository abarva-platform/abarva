# 2026-09-17-source-new-unfiled-artifacts - Stop Dropping Artifacts With No Phase Folder

## Release ID

`2026-09-17-source-new-unfiled-artifacts`

## Status

`candidate`

## Plain-English Summary

The Source New event page mapped each artifact to one of four phase folders and discarded every artifact that matched none of them. Any artifact recorded against a later stage — evaluation, pricing, selection and the rest — or with no stage recorded at all was removed from the page's data before the explorer rendered. The operator then saw "No files here yet" while the file cabinet held those files.

Artifacts are no longer dropped. An artifact outside the four phases is filed under "Other stages", a folder the explorer offers only when such files exist. Tenancy remains the only reason an artifact is withheld.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter or route change. The phase mapping moves out of the page into the existing `src/lib/source/new-workspace/phase-state.ts` module so it can be tested directly.

## Client Applicability

- All clients: Source New event workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts`: `sourceNewFilePhase` resolves an artifact to a phase folder or to `other`, never to nothing. NDA artifacts continue to file under supplier work whatever stage recorded them.
- `src/app/(maestro)/source/new/[eventId]/page.tsx`: the page's local mapping is replaced by that function, and the tenancy check is the only filter that removes a row.
- `src/components/source/new-workspace/SourceNewFiles.tsx`: the `other` folder, rendered only when rows exist for it.

The new folder carries no phase semantics: it does not appear in the phase rail, and files in it are not evidence for any phase's state.

## QA / Validation

- `src/lib/source/new-workspace` and `src/components/source/new-workspace`: 50 tests passed across 5 suites.
- Mutation checks: resolving unmapped artifacts to `request` instead of `other` fails the mapping test; always rendering the `other` folder fails the folder test.
- Scoped ESLint clean; full-project `tsc --noEmit` clean.
- **Correction, 18 Sep 2026:** the local typecheck quoted above did not run. `npx tsc --noEmit` on the authoring machine exits 134 — a V8 out-of-memory crash that emits no diagnostics — and its output was filtered for `error TS`, so the crash read as clean. The authoritative typecheck for this change is the CI job on its pull request, which passed. Re-running locally as `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit` exits 0. The ESLint and test results above were produced by commands that completed and are unaffected.
- Signed-in acceptance on the deployed build: pending.

## Rollout Plan

Squash-merge after required checks pass; the repo-owned ACA main deploy workflow publishes the change. No migration and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: On an event holding an artifact recorded against a stage outside the four phases, the "Other stages" folder appears and lists it; on an event with no such artifact the folder is absent; opposite-tenant artifacts remain withheld.

## Rollback Plan

Revert this UI change through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, focused test output, mutation results and CI to be added when available.

## Known Gaps

- "Other stages" is a holding folder, not a phase. When the workflow authority persists per-phase activation, artifacts recorded against later stages should be presented under those stages rather than pooled.
- No signed-in browser proof yet.
