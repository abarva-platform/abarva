# 2026-09-19-intelligence-quarantine-batch-one — Retire nine quarantined Intelligence suites and the modules they were the last reference to

## Release ID

`2026-09-19-intelligence-quarantine-batch-one`

## Status

`candidate`

## Plain-English Summary

A directory of Intelligence tests was switched on in CI earlier today with twenty-five of its
suites excluded by name, because they read source files that a deliberate sunset deleted in
July. The exclusion list is worked down in batches; this is the first batch, and it is the nine
suites that were all excluded for the same single missing file.

The list's stated reason for excluding them was true but incomplete, and the difference changes
what should be done with them. Each of the nine is three to five groups of assertions, and only
the last group is the stale part that reads the deleted file. Fifty-eight of their two hundred
and fifty-seven assertions fail; the other one hundred and ninety-nine pass and are real,
deterministic coverage of eight helper modules that do still exist. Deleting one group per file
would have turned all nine green and cleared nine entries in an afternoon.

That was not done, because those eight helper modules have no caller. Checked by name across
every file in the repository, nothing outside these nine test files imports any of them: their
only consumer was the component the sunset removed, and the sunset left the helpers behind.
Switching the suites back on would have bought a hundred and ninety-nine green assertions about
code that no screen and no route can reach — coverage on paper, which is the overstatement the
exclusion list exists to refuse. So the nine suites are deleted with the reason recorded, and the
eight modules go with them.

The change also repairs a gap in the control that guards the list. The list has a size ceiling,
and until now the ceiling only failed when the list grew past it. Clearing nine entries and
leaving the ceiling where it was would have handed the next nine exclusions a silent pass, with
the size only re-measured by whoever eventually exceeded the old high-water mark. The ceiling is
now a ratchet: the check fails when the list is shorter than the ceiling as well as longer, so
the number has to move in the same change that clears the entries.

No product code that any surface reaches was changed.

## Layer Impact

- `global-control-lane`: dead-code removal and test/CI tooling. Eight unreferenced modules under
  `src/lib/intelligence/` are deleted along with the nine test files that were their only
  reference; the exclusion list drops nine entries and gains a two-sided ceiling control. No
  route, component, prompt, schema, migration, or data-plane path changes, and no module that any
  product surface imports is touched.

## Client Applicability

- All clients: No behaviour change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deleted nine test files under `src/__tests__/integration/intelligence/`:
  `int4-contradiction-monitor.test.ts`, `int5-programme-risk-summary.test.ts`,
  `int6-gate-readiness.test.ts`, `int7-engagement-scorecard.test.ts`,
  `int8-milestone-tracker.test.ts`, `intel4-lens-tabs.test.ts`,
  `intelligence-int1-apex-pattern-plan.test.ts`,
  `intelligence-int3-evidence-gap-queue.test.ts`,
  `intelligence-programs-actions-modes.test.ts`.
- Deleted the eight modules they were the last reference to:
  `src/lib/intelligence/pattern-contradiction-monitor-view.ts`,
  `programme-risk-summary-view.ts`, `gate-readiness-view.ts`, `engagement-scorecard-view.ts`,
  `milestone-tracker-view.ts`, `intelligence-lens-tabs-view.ts`,
  `apex-retail-pattern-plan-view.ts`, `sentinel-evidence-gap-queue-view.ts`.
- `scripts/quality/intelligence-integration-quarantine.json` — nine entries removed; the
  cluster description corrected to the remaining thirteen; a `clearedBatches` note recording why
  this batch was deleted rather than repaired, so the next batch is not cleared the faster way by
  default.
- `scripts/quality/check-intelligence-integration-quarantine.mjs` — the ceiling becomes a
  two-sided ratchet and moves from 25 to 16.

## QA / Validation

Measured by execution on exact `origin/main` `1d4c9a4c1555aff3c4938d157165f9a93ebbc4cb`, in an
isolated worktree.

- **The nine suites, before:** 9 suites, **58 failed / 199 passed / 257 total**. Every one of the
  58 is `ENOENT` or a false `existsSync` on
  `src/components/intelligence/IntelligenceLensTabs.tsx`. After: the files are gone, so the same
  scope is 0 of 0.
- **Reachability of the eight modules, before deletion:** each module name searched across every
  file in the repository outside `node_modules` and `.git`. Outside the nine deleted suites the
  only hits are three historical documents and one generated census entry — no import, from
  product code or otherwise. `src/app/(maestro)/intelligence/page.tsx` and
  `src/components/intelligence-advisory/` import `canonical-landscape-sections`,
  `intelligence-view-model-client-key`, `enterprise-context-spine` and `ask/*`; none of the
  eight.
- **Why they were orphaned:** `0c6a86c51` (2026-07-07, "sunset all legacy surface versions")
  deleted `src/components/intelligence/`, one day after `874ea46db` landed the replacement
  surface. The eight modules were last touched on 2026-05-30, before the sunset. This completes
  a sunset that had already been decided and recorded; it does not make a new one.
- **Quarantine checker:** clean before at 25 excluded of 33 suites. Clean after at **16 excluded
  of 24 suites; 8 run on every PR; 29 retired paths watched for return.**
- **Wired Intelligence CI command:** 10 suites / 149 tests passing before and after — unchanged,
  as it must be, since the deleted suites were already excluded from it. The delivery of this PR
  is the list going from 25 to 16 and eight dead modules leaving the tree, not a test count.
- **No regression in the suites that name a deleted module in data files.** Nine suites read
  `docs/build/build-slices.json` or the QA journey manifests that mention these paths as text.
  Same scope, both trees: **4 failed / 11 failing assertions / 185 passed / 196 total on pristine
  `origin/main`, and exactly the same after.** Those four are pre-existing reds in unwired
  directories, not caused here.
- `tsc --noEmit` with a 6144 MB heap, **judged by exit code: 0**.
- `npm run test:behaviors`: 37 suites / 372 tests, exit 0.

**Mutations, each confirmed failing:**

1. Delete the nine suites while their entries remain in the list → the existing stale-entry
   control exits 1, naming all nine.
2. Remove the nine entries and leave `CEILING` at 25 → the **new** ratchet exits 1: "the
   quarantine holds 16 suites but CEILING is still 25, so 9 slot(s) of headroom were just
   created by clearing entries." This is the control this PR adds, failing before it was
   satisfied.

## Rollout Plan

Merge to main through the repo-owned PR flow. No runtime rollout: nothing any route imports
changes, so the web image behaves identically.

## Deployment Authority

- Repo-owned deploy workflow: Normal app rollout only; no runtime behaviour changes.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — no product behaviour, route, component, prompt, schema or
  data-plane path changes.

## Rollback Plan

Revert the PR. The nine suites and eight modules return, the nine entries return to the exclusion
list, and the ceiling reverts with the checker. No migration, data or runtime rollback.

## Audit Evidence

- PR and its CI run, including the Integration suites job log showing the quarantine checker step
  reporting 16 excluded of 24 and the wired command executing on a real runner.
- The before/after and mutation figures above, each produced by running the command rather than
  by reading a file.

## Known Gaps

- Sixteen suites remain excluded and still run nowhere. Thirteen are the same retired-component
  class; three additionally read sunset route trees. They are worked down in later batches.
- Two of the remaining sixteen hold **opposite** contracts for one route
  (`src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx` — one asserts it exists, the
  other asserts it does not, and the second passes). Which is right is a product question about
  the retired tenant-scoped route tree, so neither was touched here.
- `src/lib/qa/intelligence-deterministic-journey.ts` still records deterministic coverage of
  components and routes that the July sunset deleted, and names them as evidence in string
  literals that no check resolves. Unchanged by this PR and filed separately: a manifest whose
  evidence paths are never verified can outlive the thing it claims to cover.
- Nothing in the repository detects an unreferenced module under `src/lib`.
  `docs/architecture/unreachable-components.json` is generated from the app route graph and
  covers `src/components` only, which is why eight orphaned modules sat in the tree for ten weeks
  with only their own tests pointing at them.
