# 2026-09-19-programs-unit-suite-enumeration — Run the Programs unit suites as a directory, and hold them there

## Release ID

`2026-09-19-programs-unit-suite-enumeration`

## Status

`candidate`

## Plain-English Summary

`src/lib/programs/__tests__` holds 85 test files. Six of them ran in CI. The other 79 ran
nowhere, and had run nowhere for as long as the directory has existed.

The six were not chosen; they accumulated. Each one was named in a workflow, one file at a time,
on the day it happened to become somebody's task. That is a wiring shape that can only ever cover
the past: a suite written tomorrow starts life unexecuted, and nothing says so.

The cost was measurable and is now measured. One of the 79 had been failing since 2026-08-06. It
pinned a tenant's display label as a text literal; a change four days after the suite was last
touched renamed that label on purpose, and from that moment the suite could not pass. Nothing went
red, because nothing ran it. That is 44 days in which a repository-wide "the tests pass" was true
and meaningless for this directory.

This change does three things:

1. **Wires the directory, not the files.** One workflow step names
   `src/lib/programs/__tests__`, the way the sibling `src/lib/agent/tools/__tests__` was already
   wired. Suites nobody has written yet are covered by it.
2. **Repairs the suite that was red**, by deriving its expectations from the exported tenant
   vocabulary instead of typing labels into the test. A deliberate rename now moves the test with
   the code; a real cross-tenant leak still fails it. Both directions were proved by mutation.
3. **Holds the wiring in place.** A new behavioural case asks the coverage census's own four-hop
   resolver whether every suite in the directory is reached, rather than searching a workflow file
   for a string — a wrapper script satisfies a string search and proves nothing. Removing the step
   fails the case.

No product code changed.

## Layer Impact

Release lane: `global-control-lane`. Shared repository tooling. No client-scoped data, no
internal-admin capability, no public surface, no feature flag.

- **Layer 4 (Products)** — test coverage over the Programs library: phase gates, deliverable
  lifecycle, approvals, evidence ingestion, pattern authority. No runtime behaviour changes and no
  product module is modified. The one repaired file is a test.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — developer-facing CI coverage.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — new step `Exercise the Programs unit
  suites` running the directory; job `timeout-minutes` raised from 5 to 12, because the five most
  recent runs of this job took 135s, 138s, 147s, 218s and 281s against a 300s ceiling and one more
  step would have tipped the slowest ones into a timeout unrelated to what they guard.
- `src/lib/programs/__tests__/clientname-tenant-resolution.test.ts` — expectations derived from the
  exported `CLIENT_KEY_TO_DB_NAME` and `DEMO_SAFE_CLIENT_NAMES` rather than four hand-typed rows.
  Covers every canonical tenant and every alias the lookup accepts (6 tenants, 24 aliases) in place
  of 4 pairs, and adds the key-only resolution path, which is where the leak this suite exists for
  actually lives.
- `src/__tests__/behaviors/programs-unit-directory-ci-coverage.test.ts` (new) — five cases holding
  the wiring: resolver determinacy, full directory coverage, literal naming so the CI-visibility
  gate can see the path too, the pattern's collision set, and a two-way ratchet on the number of
  directories under `src/lib/programs` that still run nowhere.

## QA / Validation

Baseline and result measured on the same scope, on exact `origin/main` `fbe56c123`:

| Measurement | Before | After |
|---|---|---|
| `npx jest src/lib/programs/__tests__` | 1 failed / 84 passed of 85 suites; 1 failed / 770 passed of 771 tests | 0 failed / 85 passed; 0 failed / 771 passed |
| Suites in that directory a workflow reaches (census resolver) | 6 of 85 | 85 of 85 |
| New behavioural guard | 2 of 5 cases failing | 5 of 5 passing |
| `npm run test:behaviors` | 39 suites / 406 tests | 40 suites / 411 tests, 0 failing |

**Nine mutations. The eight that must fail, failed; the one that must pass, passed.**

Guard (`programs-unit-directory-ci-coverage.test.ts`):

1. Workflow step deleted → 2 cases fail.
2. Step keeps the directory but writes it with a trailing slash — jest still runs the suites, the
   visibility gate can no longer see the path → 2 cases fail. This is the runner/gate divergence
   that has produced false "no CI owner" reports elsewhere in this repository.
3. A new unwired test directory added under `src/lib/programs` → ratchet fails at 39.
4. One of the currently dark directories wired without lowering the number → ratchet fails at 37.
   The ratchet is exact in both directions on purpose: a count that may only be raised drifts.

Repaired suite (`clientname-tenant-resolution.test.ts`), mutating `src/lib/client-config.ts`:

5. A tenant's key branch returns another tenant's label → 1 case fails (the key-only path).
6. The name-normalisation table sends one tenant's alias to another tenant's label → 3 cases fail.
7. The demo-safe equality branch returns another tenant's label → 3 cases fail.
8. **Positive control** — a tenant's demo-safe label deliberately renamed → all 6 cases still pass.
   This is the exact change that made the old suite unsatisfiable for 44 days; the derived form
   tracks it. A suite that cannot tell a rename from a regression reports neither.
9. A tenant's alias list emptied → the non-vacuity case fails, so the loops cannot pass over an
   empty vocabulary.

A first mutation attempt survived and the survival was the finding: a recognised tenant name is
normalised to its demo-safe form and matched before any key branch is consulted, so the per-key
branches are reachable only when no name is supplied. The suite asserted only the name path. The
key-only case was added for that reason rather than the mutation being replaced with an easier one.

Other checks: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit 0,
judged by exit code rather than by grepping output — a bare `npx tsc` exits 134 on this machine
with no diagnostics, which reads as clean. `npx eslint` exit 0 over both changed test files (the workflow file is YAML and outside eslint's scope).
`node scripts/release-check.mjs --base origin/main --head HEAD` exit 0.

## Rollout Plan

Merge to `main`. CI-only change; the repo-owned ACA main deploy workflow runs on merge as usual.
No migration, no data build, no flag, no runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: n/a — no runtime image contract changes.
- ACA runtime invariant: verified after merge as a matter of routine, not because this change can
  affect it.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. No route, component, prompt, schema, API or data-plane
  path is touched; the only non-test file is a workflow.

## Rollback Plan

Revert the PR. The workflow step and the guard case disappear together, which returns the
directory to six-of-85 coverage; no data or runtime state is involved.

## Audit Evidence

- PR and its check run for this branch.
- The workflow step log line `Exercise the Programs unit suites`, which prints the suite and test
  counts from a real runner — the numbers above are local until that log exists.
- `node scripts/quality/test-ci-coverage-census.mjs --json`, which reports the directory's covered
  count before and after.

## Known Gaps

- **The 85 suites have never executed on a CI runner.** They passed on one machine. Environment
  dependence and flake have had no opportunity to show, which is the same gap backlog items T-021
  and T-038 name for other newly-wired directories. The first runs of this step should be read.
- **38 directories under `src/lib/programs` holding 168 test files still run nowhere**, including
  `phase-templates/__tests__` (10 files), which the census ranks `critical` on governed risk. Out of
  scope here: this item's subject was one directory, and each of those needs its own measurement
  before it is wired. The ratchet stops the number growing in the meantime.
- **The committed census (`docs/architecture/test-ci-coverage-census.json`) is not regenerated
  here.** It already lagged a fresh run before this change; folding an 800-line data refresh into a
  small diff is the review failure this work exists to repair. That is backlog item T-012's open
  decision.
- The six previously-named suites now run twice in this job. Naming them individually is what maps
  a catalog control to the step that exercises it, so the duplicate is deliberate.
