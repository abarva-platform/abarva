# u597 — The Moves gate sign-off suite runs in CI

## Release ID

`2026-10-08-moves-gate-signoff-suite-runs-in-ci`

## Status

`candidate`

## Plain-English Summary

A test suite covering gate sign-off on the Moves phase approve-and-build path
existed in the repository but was executed by nothing. No workflow and no npm
script named it, and because the directory it lives in is run as an explicit
list of file paths rather than as a directory sweep, a suite that is not named
runs nowhere at all. The generated test-coverage census recorded it exactly
that way: enumerated, `collected: false`, `run: false`, `covered: false`,
`untriaged: true`.

That directory is the highest-risk one the census ranks — the `critical` band,
on the declared-AI-surface-control and approval-or-lifecycle-write signals —
and the dark suite was the last uncovered file in it. Gate sign-off is an
approval write, so a suite that proves it and never executes is the precise gap
the governing workflow step exists to close.

This change names that suite in the step, which makes it merge-blocking, and
adds a guard that keeps the directory honest afterwards. The guard pairs the
census "no gap" assertions with a floor on the number of suites on disk. That
pairing is the point: once a directory leaves the census gap lists, an absence
assertion alone passes vacuously if the directory is later emptied or thinned,
so deleting suites would read as "fully owned" instead of as a regression.

No product code changed and no runtime behaviour changed. The effect is that a
previously unenforced approval-path control is now enforced on every pull
request.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

No product layer changes. Layer 1 (Client Intake), Layer 2 (Source Adapters),
Layer 3 (Canonical Model) and Layer 4 (Products) are all untouched: there is no
schema, adapter, intake, route, read-model or component change. The change is
confined to release gating — one workflow step's test path list, one new
behaviour guard, and the regenerated coverage census.

## Client Applicability

- All clients: not applicable — no runtime or product behaviour changes.
- Specific clients: none.
- Internal only: yes. This is repository release gating only.
- Public/demo only: no.
- Feature flag: none. The change is not flag-gated because it ships no runtime
  behaviour to gate.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — adds
  `src/components/strategic-moves/__tests__/phase-approve-and-build-gate-signoff.test.tsx`
  to the `Exercise Moves visible AI liability controls` step's
  `--runTestsByPath` list, and records why in the step's existing comment. The
  step is deliberately an explicit path list, and its comment already requires
  that new suites beside these controls be named in it deliberately; this
  follows that rule rather than converting the step to a directory sweep.
- `src/__tests__/behaviors/moves-gate-signoff-suite-ci-coverage.test.ts` — new
  guard, 5 cases: the suite is named by exact path in the step; the directory is
  absent from `partiallyCoveredDirectories`; absent from `uncoveredDirectories`;
  absent from `governedRiskRanking`; and the on-disk suite count is held at its
  floor so the three absence cases cannot pass vacuously.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath src/components/strategic-moves/__tests__/phase-approve-and-build-gate-signoff.test.tsx src/__tests__/behaviors/moves-gate-signoff-suite-ci-coverage.test.ts`
  → 2 suites passed, 10 tests passed.
- **PASS** — the newly wired suite on its own: 5 of 5 pass. It was green before
  this change as well, so naming it cannot redden the step.
- **PASS** — `npm run test:behaviors` (the whole behaviour directory the guard
  joins).
- **PASS** — mutation testing of the guard, 4 mutations:
  - removing the new path from the workflow step → 3 of 5 cases fail.
  - thinning the directory by one suite (47 → 46) → **only** the floor case
    fails; both census gap-list cases and the ranking case still pass. This is
    the decisive result: it demonstrates the vacuity hole the floor exists to
    close, and that the floor is the only assertion that catches it.
  - removing the gate sign-off suite from disk → 2 of 5 cases fail.
  - neutering the floor assertion while the directory is thinned → all 5 pass,
    confirming the floor assertion is load-bearing and not vacuous.
- **PASS** — census reconciliation performed by diffing the gap lists rather
  than by comparing totals: exactly one directory leaves
  `partiallyCoveredDirectories` (28 → 27) and none enter;
  `uncoveredDirectories` is unchanged at 43 with none entering or leaving; and
  `governedRiskRanking` goes 1 → 0 for that same directory. The fully-dark
  baseline `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`
  is deliberately untouched — this directory was never in it, and a partially
  covered directory must never be added to it.
- **PASS** — census counts move exactly as predicted: `coveredTestFiles`
  2684 → 2686 (the wired suite plus this record's new guard),
  `pullRequestCoveredTestFiles` 2683 → 2685, `uncoveredTestFiles` 165 → 164,
  `untriagedUnrunTestFiles` 113 → 112, `rankedUntriagedUnrunTestFiles` 1 → 0,
  `directoriesWithUnrunTestFiles` 71 → 70. Both censuses were regenerated with
  `audit:test-ci-coverage:write` and `audit:tenancy-fence-coverage:write`;
  the generator reports `census drift: committed census matches this run`.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- **PASS** — `npx eslint` on the new suite.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **PASS** — the edited workflow parses as YAML; the step holds 44 test paths
  with no duplicates and the new path present.
- **NOT RUN** — no signed-in walk. This change ships no runtime behaviour, so
  there is nothing on a live surface for a walk to observe.

## Rollout Plan

Merge to `main` via squash. There is no runtime rollout: no image build, no
Azure Container Apps deploy, no migration, no flag change. The workflow step
takes effect on the next pull request that runs it.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — this change does not deploy.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision change, no web or worker template change.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected — no runtime image or template is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable — no flag or environment
  variable changes.
- Live signed-in proof required: no. No client-visible surface changes.

## Rollback Plan

Revert the squash commit. The change is three files and holds no state: the
workflow step returns to its previous path list, the guard suite is removed,
and the census is regenerated by `npm run audit:test-ci-coverage:write`. No
migration, no data, and no deployed artifact is involved, so rollback is
immediate and carries no constraint.

## Audit Evidence

- The pull request for this record, and its CI run for the
  `ai-surface-control-catalog` job, where the `Exercise Moves visible AI
  liability controls` step now lists 44 paths including the gate sign-off
  suite.
- `docs/architecture/test-ci-coverage-census.json` in this change: the
  `src/components/strategic-moves/__tests__` entry is absent from
  `partiallyCoveredDirectories` and from `governedRiskRanking`, where it
  previously stood at `testFiles: 47, coveredTestFiles: 46,
  untriagedUnrunTestFiles: 1` in the `critical` band.
- `src/__tests__/behaviors/moves-gate-signoff-suite-ci-coverage.test.ts` — the
  guard, including the documented floor and the reason it is paired with the
  absence assertions.

## Known Gaps

- The guard asserts the directory is fully owned in aggregate; it deliberately
  does not assert that every suite in the directory is named in this one
  workflow step, because two of the 47 are covered through a different route and
  such an assertion would be false.
- The floor is a count, not an inventory. Deleting one suite and adding another
  keeps the count whole. The census gap lists cover the added file, so a swap is
  visible there rather than here.
- Sibling census guards in `src/__tests__/behaviors` assert gap-list absence for
  their own directories without a comparable floor, so the vacuity hole closed
  here remains open for those directories. Out of scope for this change.
- The wider Moves end-to-end path is unaffected by this change and still blocked
  outside the code lane; see the status report accompanying this run.
