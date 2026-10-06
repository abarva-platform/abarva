# 2026-09-30-c549-source-commercial-summary-confidence-claim — the Source commercial summary confidence claim, measured and corrected

## Release ID

`2026-09-30-c549-source-commercial-summary-confidence-claim`

## Status

`candidate`

## Plain-English Summary

The AI-generated UI catalog (`docs/legal/AI_GENERATED_UI_CATALOG.md`) is the
document an auditor reads. Its row for the Source commercial summary surface
(`src/components/source/SourceCommercialSummarySurface.tsx`) answered
"Confidence / assumption disclosure present?" with "Yes", and the basis it gave
was the surface's deterministic, no-live-benchmark limitation copy. The control
catalog's coverage row for that claim had already deferred it as "limitation
copy, not a formal confidence control yet", so the two documents disagreed about
one surface and nothing measured which was right.

This change measures the claim by rendering the component. A new test renders
the real component over the real builder and finds:

1. the limitation copy the legal row cited is on the page (the "Deterministic
   seeded data · No live model calls" strip and the footer saying no live market
   benchmarks and no AI-generated savings claims), together with the risk and
   BAFO-readiness verdicts a confidence value would sit beside, so the
   measurement is not over an empty render;
2. no rendered text is a confidence, certainty, likelihood or probability
   statement beside any verdict;
3. the seeded "Top Opportunity" renders a 5–8% pricing benchmark delta against
   the market median, on the same page whose footer says no live market
   benchmarks are used, so the limitation copy is contradicted on the surface it
   describes;
4. no non-test source file imports the component, and the unreachable-components
   baseline lists it, so no reader can open the screen.

So the legal row is corrected from "Yes" to "Partial", and the wording says what
was measured. The control catalog's coverage row for the old claim is removed
with it, because the gate derives that row from the "Yes". The test holds the
legal cell to what it observes: it may say "Yes" exactly when the limitation
copy renders, nothing on the page contradicts it, and something mounts the
component.

No product file changed. Whether the surface should be mounted, and whether its
seeded benchmark sentence should be removed or sourced, is product work this
change does not take. The legal row's "Required / next control" column now
names it.

## Layer Impact

Release lane: **`global-control-lane`**. The change is to the shared legal
catalog, the control catalog and tests. It is not gated to any client or flag.

- **Products**: Source. Documents and tests only; no product file changed.
- **Canonical model / Client intake / Source adapters**: not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes. Legal catalog, control catalog and CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/__tests__/SourceCommercialSummarySurface.confidence-claim.test.tsx`:
  new, 4 cases. Nothing is stubbed.
  - A positive control: the render carries the limitation copy the legal row
    cited, and each vendor's risk and readiness verdict.
  - No confidence value, and one benchmark figure: no rendered text node is
    confidence talk, and the only benchmark percentage on the page is the
    builder's seeded top opportunity, rendered beside the no-benchmark copy.
  - Mounted by nothing: a walk of `src/` finds no non-test file importing the
    component, and the unreachable baseline lists it.
  - The legal row's confidence cell starts with `Yes` exactly when the
    limitation copy renders, no benchmark figure contradicts it, and something
    mounts the component. `startsWith('Yes')` is the predicate the control
    catalog gate uses.
- `docs/legal/AI_GENERATED_UI_CATALOG.md`: the Commercial summary surface row's
  confidence cell changes from `Yes: deterministic/no-live-benchmark
  limitation.` to a `Partial:` statement of what was measured. The next-control
  cell now says to mount the surface before claiming any disclosure on it, and
  to reconcile the seeded benchmark sentence with the no-benchmark copy.
- `docs/security/ai-surface-control-catalog.json`: the
  `generated-ui|Source|Commercial summary surface|confidence` coverage row is
  removed. It was `deferred` with an `uncatalogued` join. The gate refuses it
  once the legal cell no longer claims.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts`: the per-bucket tally
  pin `deferredWithJoin` moves from 9 to 8. The comment records why. The other
  three buckets did not move.

## QA / Validation

Status: **pass** for every check below; CI on the PR is the remaining gate.

- **Red first.** On base `828cd8a726`, the new suite failed 1 of 4 (the legal
  case: expected `false`, received `true`). After the fix it passes 4 of 4.
- **Mutations:** 5 made, 5 caught, each confirmed to change a file before the
  run:
  - M1: the legal cell restored to `Yes` (coverage row still removed). 5 cases
    fail across the new suite and `catalog-claim-binding`; the gate exits 1.
  - M2: the coverage row restored (legal cell `Partial`). 5 cases fail; the gate
    exits 1.
  - M3: a module under `src/lib` re-exports the component. Fails the
    mounted-by-nothing case only.
  - M4: the builder's top opportunity no longer states a benchmark figure.
    Fails the benchmark case only.
  - M5: the surface renders `Confidence: medium`. Fails the no-confidence case
    only.
- **The gate** (`npm run audit:ai-surface-controls`) fails on each half-edit
  (M1, M2) and exits 0 on the whole change.
- **`uncatalogued` coverage rows:** 3 at base, 2 on the branch (counted over
  the catalog file at each ref).
- **Same scope, clean worktree at base `828cd8a726` against the branch:**
  - `npx jest src/components/source/__tests__`: 28 suites / 202 tests passing
    at base, 29 / 206 on the branch; 0 failing on either side.
  - `npm run test:behaviors`: 159 suites / 1699 tests at base, 159 / 1697 on the
    branch; 0 failing on either side. The −2 is the two parameterized per-row
    cases `catalog-claim-binding` generates for the removed coverage row (M2,
    which restores the row, runs 70 cases in the two suites against 68).
- **CI placement:** the new suite sits in `src/components/source/__tests__`,
  which `.github/workflows/source-component-suites.yml` runs by directory.
- **Checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
  false` exits 0. Scoped ESLint exits 0.

## Rollout Plan

This change ships on merge through the normal main deploy. No runtime behaviour
changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none added.
- Approved image digest: whatever the merge deploy produces; no runtime change.
- ACA runtime invariant: verified after merge as for any merge.
- Worker image invariant: as above.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product surface changed, and the
  component is mounted by no route.

## Rollback Plan

Revert the squash commit. That restores the `Yes` claim together with its
coverage row, and the new suite goes with it.

## Audit Evidence

- The mutation and gate results above were measured locally on the branch.
- The CI run for the PR, including the Source component suites job log.

## Known Gaps

- The surface still shows no confidence per verdict, still renders a seeded
  benchmark figure beside copy saying there are no benchmarks, and no route
  mounts it. This change corrects the claim; it does not change the product.
- The other two `uncatalogued` coverage rows are out of scope and stay open:
  they are the decision-gated redirect shims (`C-546`).
