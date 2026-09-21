# 2026-09-21-t517-synthesis-route-header-expectations — Repoint two synthesis route suites at the contract the routes actually have

## Release ID

`2026-09-21-t517-synthesis-route-header-expectations`

## Status

`candidate`

## Plain-English Summary

Two test suites covering the Source and Moves synthesis API routes asserted a
response header that neither route has ever emitted. The header name occurred
nowhere in `src` outside those two test files, at every commit that ever touched
them, so the expectation was wrong on the day it was written rather than having
decayed. Both routes do emit surface attribution — three headers, on success
responses and on every error response — and the assertions now name those.

Because a wrong assertion can look exactly like a deleted control, that
distinction is stated explicitly here: **no control was removed and none is being
re-added.** Nothing in either route changed in this release. Only the two test
files did.

Three further expectations were behind real behavior rather than behind a name:

- One case expected a success response for a tenant that is now on the governed
  foundation path and is deliberately refused the legacy synthesis pack. The
  same suite's final case already asserts that rule for a different tenant key.
  No tenant key exists for which the case could still succeed, so instead of
  flipping it to a bare "expect a refusal" — which any refusal would satisfy —
  it now asserts the stronger property the other case cannot: the refusal
  happens *before* the pack is consulted at all. The positive contract it used
  to carry, that a tenant is never served another tenant's fixture, moved to the
  one case that still returns success, so no contract was dropped.
- Two cases expected success and received a not-found, because the on-disk
  dataset their route reads was deleted from the tree by an unrelated commit on
  2026-07-13 and the reader was not changed with it. That is a product defect,
  not a test defect, and it is filed separately rather than repaired here. The
  suite now mocks that reader — as the sibling suite already did — so it proves
  the route's contract instead of the presence of a data file, and a new case
  asserts the not-found response the route genuinely returns when no pack
  resolves.

## Layer Impact

- **Layer 4 (Products — Source, Moves):** no behavior change. Both route files
  are byte-identical to `origin/main`; the diff is two test files and this
  record.
- **Layer 3 (Canonical model):** unchanged.
- Release lane: `global-control-lane` — shared test/CI-visible behavior, no
  client-scoped data.

## Client Applicability

- All clients: no functional change. Nothing a client can reach was edited.
- Specific clients: none.
- Internal only: yes — test expectations and this record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/source/synthesis/__tests__/route.test.ts` — assertions repointed
  at the three headers the route emits; one case converted from an unreachable
  success expectation to an ordering assertion, with its positive guards moved
  to the case that still succeeds; each change carries its reason inline.
- `src/app/api/programs/synthesis/__tests__/route.test.ts` — same header
  repointing; the V6 pack reader mocked so the suite tests the route rather than
  a data file; one case added for the not-found response the route returns when
  no pack resolves.
- This record.

No route, library, workflow, migration or dataset file is in the diff.

## QA / Validation

Baseline measured over the same two-file scope on a clean `origin/main`
(`e5dc900a8`) and again on this branch:

| scope | before | after |
|---|---|---|
| the two suites | 7 failed, 1 passed, 8 total | 0 failed, 9 passed, 9 total |

The after-count is nine rather than eight because one case was added; no case was
deleted, and no matcher was loosened.

**Eight deliberate mutations, eight caught, zero escapes.** Each was applied to
the route under test, the suite was run, and the route was restored:

1. Removed the Source layer header from the shared header object — 4 failed / 4.
2. Drifted the Source contract header to a stale literal — 4 failed / 4.
3. Removed the foundation-tenant refusal entirely — 2 failed / 4.
4. **Moved the foundation-tenant refusal to run *after* the pack is built**, so
   the status code and response body are unchanged — 1 failed / 4, failing on
   the ordering assertion (`Expected number of calls: 0 / Received: 1`). This is
   the mutation that proves the repaired case is not a tautology: an
   "expect a refusal" assertion would have survived it.
5. Removed the Source tenant fence — 1 failed / 4, on the case that exists to
   prove the fence. The fence still fences.
6. Dropped the V6 headers from the Moves error helper — 2 failed / 5.
7. Removed the Moves tenant fence — 1 failed / 5.
8. Removed the detail from the Moves not-found response — 1 failed / 5.

Other checks, all from the branch worktree:

- `npx tsc --noEmit --pretty false` — **exit 0**, judged by exit code (a bare
  run exits 134 on this machine and emits no diagnostics).
- `npx eslint` over both changed files — exit 0, no output.
- The `T-472` triage-record behavior test re-run alongside both suites —
  3 suites / 11 tests, all passing. That record is a point-in-time measurement
  carrying its own `measuredOn` SHA and is deliberately **not** restamped: it
  records what was true when measured, and its own `currentAction` field names
  this item as the place the repair happens.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

The dataset absence behind two of the failures was confirmed by running the real
readers rather than by reading them: a throwaway probe called both builders for
three tenant keys and printed `datasetRootExists=false` and a null result for
every one. The probe was deleted before commit and is not part of this diff.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow will build and
deploy the resulting SHA as it does for every merge. No runtime behavior depends
on this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the merge
  SHA; this release pins nothing and changes no image reference.
- ACA runtime invariant: to be asserted from the deploy run's own
  `runtime-invariant-proof.json` after merge, as for any merge.
- Worker image invariant: unchanged; no worker job template is touched.
- Feature/env flag update path: not applicable, no flag or env var changes.
- Live signed-in proof required: **no**, and none is claimed or owed. The diff
  contains no file under `src/` outside two test directories, so no signed-in
  surface can reach it.

## Rollback Plan

Revert the squash commit. There is no migration, no data write and no runtime
state to unwind; reverting restores the two suites to their previous red.

## Audit Evidence

- The PR and its CI checks.
- The before/after counts and the eight mutation results above, each reproducible
  by applying the named mutation to the named route file and running the named
  suite with `--runTestsByPath`.
- The commit that removed the dataset directories, and its file count, quoted in
  the item filed for that defect.

## Known Gaps

- **The dataset defect is not fixed here.** The reader for the V6 demo packs
  still returns null for every tenant, in the deployed image as well as locally,
  because the image copies the dataset tree straight from the repo. Both the
  Moves and the Source synthesis routes therefore serve a not-found to the
  affected tenants in production today. This release makes that state
  *asserted* rather than *accidental*; repairing it is a separate item in its own
  lane, filed with the evidence.
- **Neither suite is run by any workflow.** Both were drawn from the unrun-suite
  census and remain unrun: wiring them by exact path means editing the CI
  workflow file, which is held by another item's claim. Their green is proven
  locally and is not yet proven by CI.
