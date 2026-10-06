# 2026-09-17-contract360-document-proof-counts - Absent Detail Is Not An Empty Lane

## Release ID

`2026-09-17-contract360-document-proof-counts`

## Status

`candidate`

## Plain-English Summary

Two defects on the Contract 360 evidence surface, both in read-path component code.

**A loaded contract could render every lane as zero.** `contractCoverageWithDetailLanes` treats the contract-detail payload as authoritative for the selected contract, which is correct when a payload exists. It read each lane as `detail?.lane.length ?? 0` and spread the result over the portfolio coverage row unconditionally, so when no detail payload had been fetched the `?? 0` fallbacks overwrote real loaded counts with zeroes. That is the same stale-zero failure the function was written to prevent, arriving from the other direction. Lane counts now come from the detail payload only when there is one; scope rows and opportunities, which arrive outside that payload, stand on their own presence.

**A count of proof rows was labelled as a count of documents.** The evidence-families row read "Contract document proof" above a number drawn from `document_page_text_rows` — page spans and extracted proof text — and sat on the same tab as a file inventory listing a different number of rows. Both numbers were correct; the labels made them read as a contradiction. The row is now named for what it counts and says so.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. No schema, migration, adapter, projection or route change.

## Client Applicability

- All clients: Contract 360 evidence surface users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`: detail-derived lane counts apply only when a detail payload exists; scope and opportunity counts apply on their own presence.
- `src/app/(maestro)/source/preview/workspace/Contract360Surfaces.tsx`: the evidence-families row is named "Contract document proof rows" and states that it counts proof rows, not files.

Deliberately not changed: the existing behavior that a present detail payload's counts win, including genuine zeroes, which current tests lock.

## QA / Validation

- Contract 360 workspace suites: 97 tests passed across 9 suites.
- Mutation check: restoring the `?? 0` fallbacks fails the new no-detail test.
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
- Live signed-in proof required: On a contract with loaded lanes, open Contract 360 before contract detail is fetched and confirm the lane counts are not zero; confirm the evidence-families row names proof rows and no longer reads as a document count beside the file inventory.

## Rollback Plan

Revert through a new PR and the repo-owned deploy workflow. Nothing persisted changes.

## Audit Evidence

PR link, test output and mutation result to be added when available.

## Known Gaps

- The evidence headline and the document table still count different populations by design: proof rows versus files. Making them one population needs a file-count column the evidence coverage projection does not expose today; that is a projection change, not a component change.
- A required-evidence checklist can mark a family missing while the archetype model marks the same family not required. The fix is to pass the archetype into the readiness builder and give it a not-required state; that is a view-model change and is not in this PR.
- No signed-in browser proof yet.
