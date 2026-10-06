# Source New — one guard for the supplier panels

## Release ID

2026-10-05-source-new-supplier-panel-consolidation

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The supplier panel and the NDA readiness panel were rendered at four separate places in the Source
New workspace, each wrapped in its own `phase === "suppliers"` check. All four passed identical
props. Four copies of a guard is four chances for one of them to drift.

They now share one component that holds the guard. Each branch calls it once.

While doing this I checked whether the existing suite would notice if the guard were removed. It
would not: deleting it entirely left all 118 tests green, so nothing asserted that supplier data
stays out of the other phases. Consolidation makes that worse, because a single edit now affects all
four sites at once. A suite was added for exactly that, and the same deletion now fails three cases.

## Layer Impact

Release lane: **global-control-lane**.

Presentation only. No schema change, no migration, no new read, no change to authority, approval or
tenant rules. Rendering is byte-identical: the extracted component reproduces the same two panels
with the same props, and the `not_open` branch continues to render neither.

## Client Applicability

All clients, through the shared control lane. No visible change — this is the same output from one
call site instead of four.

## Changes Included

- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — extracted `SupplierPhasePanels`;
  four duplicated pairs replaced by four single calls.
- `src/components/source/new-workspace/SupplierPhasePanels.test.tsx` — new suite.
- `.github/workflows/ai-surface-control-catalog.yml` — runs the new suite.
- `docs/architecture/test-ci-coverage-census.json` — refreshed by the repo-owned generator.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 4 cases |
| Affected suites | PASS — 5 suites, 122 tests (was 4 suites, 118) |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — exit 0 |
| Prop equality across all call sites | PASS — 4 sites, 1 distinct prop set; verified before extracting |
| Mutation — panels never render | PASS — 7 existing tests failed, then restored |
| Mutation — phase guard removed | **Survived before this change** (118 green). After the new suite, 3 cases fail |
| `audit:lib-orphans` | PASS — exit 0, no new orphan |
| `audit:test-ci-coverage` | PASS — census refreshed, shape matches |
| Signed-in acceptance | NOT RUN |

A prediction in the design spec was wrong and is corrected here: it offered falling line count as the
proof for this slice. The file grew by 15 lines, because the extracted component with its types and
comment costs more than four duplications saved. The reduction is in guards — four to one — not in
size, and that is what the suite now holds.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The change is a pure extraction with no data or schema consequence.

## Audit Evidence

- The four call sites and their single prop set were compared programmatically before extraction.
- `SupplierPhasePanels` holds the guard; the component is exported solely so the guard can be tested
  directly rather than through the full workspace.
- Census moves by one test file; no other directory changed state.

## Known Gaps

- The suite asserts the supplier phase renders and three other phases do not. It does not cover the
  `not_open` branch, which renders neither panel by construction and is unchanged.
- Not deployed and not live-proven by this record. No signed-in readback was performed.
