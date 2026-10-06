# 2026-09-19-integration-directory-ci-coverage — Wire the integration directories that pass, and refuse a new dark one

## Release ID

`2026-09-19-integration-directory-ci-coverage`

## Status

`candidate`

## Plain-English Summary

One directory of integration tests was recently found to run in no CI job at all. It was
found by accident: a pull request added two suites there and a gate blocked it, because
that gate only ever fires on a suite the current pull request *changes*. Every untouched
suite sat unexecuted indefinitely.

That directory was wired. This change answers the question wiring it raised — how much of
the rest of the integration tree is in the same position — and then acts on the answer.

Measured through the repository's own coverage resolver rather than by reading workflow
files, on `2a1a87dd0`:

| | suites | reached by a workflow | reached by nothing |
|---|---|---|---|
| before | 467 | 172 | **295** |
| after | 467 | **247** | 220 |

Twenty-one leaf directories had zero coverage; twelve still do. Each of the twenty-one was
run once. Ten passed in full with no exclusions — 107 suites, 3,027 passing assertions —
and those ten are now named in a workflow that runs on every pull request. The eleven that
failed are **deliberately not wired**: adding a red directory to a green command turns the
job red on arrival and teaches everyone to ignore it. Their measured failures are recorded
as their own backlog items so they are fixed, not hidden.

A behavioral test also refuses a *new* integration directory that no workflow reaches, so
the next one is caught on the day it lands rather than on the day somebody trips over it.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane tooling for every client, with no
feature gate, because CI scope is not client-scoped.

- **Layer 4 — Products:** no product behavior, route, component, schema, projection or data
  path changes. Nothing a client sees moves.
- **Platform tooling / CI:** one new workflow and one new behavioral test. The committed
  coverage census is regenerated so its numbers match the tree.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — test execution scope and a CI ratchet
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/integration-suites.yml` (new) — runs ten integration directories,
  named literally, on `pull_request`, `merge_group` and `workflow_dispatch`.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` (new) — four cases:
  every wired directory resolves as covered through the real resolver; each is named
  literally in a workflow command; every extra path a wired pattern also selects is
  enumerated and was measured; and no unrecorded integration directory is reached by
  nothing.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

**Baseline, same scope, clean tree at `2a1a87dd0` before any edit.** Coverage measured with
`node scripts/quality/test-ci-coverage-census.mjs`, which reported `indeterminateInvocations: 0`
— so the figures are exact, not an upper bound.

Each dark directory run once (`npx jest <dir> --no-coverage --ci`), result per directory:

| green — now wired | suites | failing | | red — not wired | suites failing / total | tests failing |
|---|---|---|---|---|---|---|
| `corpus` | 2 | 0 | | `agent` | 1 / 1 | 3 |
| `data-trust` | 4 | 0 | | `agents` | 5 / 8 | 23 |
| `engagement` | 1 | 0 | | `architecture` | 1 / 25 | 1 |
| `nexus` | 4 | 0 | | `demo` | 1 / 4 | 2 |
| `observability` | 1 | 0 | | `deployment` | 1 / 4 | 1 |
| `programs` | 58 | 0 | | `design` | 4 / 7 | 30 |
| `security` | 4 | 0 | | `intelligence` | 26 / 33 | 133 |
| `sentinel` | 4 | 0 | | `knowledge` | 1 / 4 | 1 |
| `solutions` | 20 | 0 | | `ops` | 2 / 14 | 30 |
| `story-pack` | 1 | 0 | | `setup` | 2 / 2 | 2 |
| | | | | `admin` | 12 / 51 | 24 |
| | | | | `qa` | 7 / 37 | 10 |

**Failing first.** The new suite on unchanged code, before the workflow existed:
**3 failed / 1 passed of 4.** After the workflow: **4 passed of 4.**

**The exact command the workflow runs**, executed locally: `107 of 107 suites selected,
106 passed, 1 skipped; 3,027 tests passed, 20 skipped, 0 failed.`

**Mutation checks — four, each reverted immediately, each caught:**

| mutation | result |
|---|---|
| drop one directory from the jest command | 3 failed / 1 passed |
| add a trailing slash to one path (`…/nexus/`) — the form that silently stops the visibility gate seeing it | 3 failed / 1 passed |
| replace the literal jest command with a wrapper script that shells out to jest | 3 failed / 1 passed |
| add a new integration directory that no workflow reaches | 1 failed / 3 passed, naming the directory |

The third mutation is the one worth keeping: it is the draft that *looks* correct. The
repository's registration gate counts a suite as covered only when a workflow command names
a test runner **and** the suite or a containing directory, so a wrapper satisfies neither
and registers nothing while reading as a tidier command.

**Coverage delta across the whole repository**, same resolver: `coveredTestFiles` 549 → 625
(+76, of which 1 is this change's own new test file, so +75 previously-unrun suites);
`uncoveredTestFiles` 1742 → 1667; directories fully covered 63 → 73; uncovered directories
388 → 379; critical uncovered governed-risk directories 48 → 46.

**Other checks:** `scripts/quality/check-integration-ci-visibility.mjs` exit 0;
`src/__tests__/behaviors/test-ci-coverage-census.test.ts` 14/14 passed;
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit 0**;
`npx eslint` on the new test exit 0.

## Rollout Plan

Merge to `main`. The workflow takes effect on the next pull request and in the merge queue.
No image build, migration, flag, environment variable or data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this change touches no Container App, revision, traffic
  weight, worker job, secret or environment variable
- Approved image digest: not applicable; no runtime image changes
- ACA runtime invariant: unaffected; will be re-proven after the merge deploy as standing
  practice
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — CI scope and a behavioral test only; no product
  code, route, component, prompt or data-plane path changes

## Rollback Plan

Revert the pull request. The workflow stops running and the behavioral test is removed with
it; no state, schema or runtime configuration has to be undone.

## Audit Evidence

- The pull request and its CI run, including the `Integration suites` job's own first
  execution on a runner.
- `node scripts/quality/test-ci-coverage-census.mjs` before and after, and the regenerated
  `docs/architecture/test-ci-coverage-census.json`.
- The per-directory run table above, reproducible with
  `npx jest src/__tests__/integration/<dir> --no-coverage --ci`.

## Known Gaps

- **Twelve integration leaf directories are still reached by nothing**, holding 220 suites.
  Eleven are red and each needs its failures triaged; the twelfth is the integration root
  itself, 45 loose suites of which 19 now run, which cannot be wired by naming the root
  because that command would also run every red subdirectory below it.
- `intelligence` is the largest of them — 26 of 33 suites failing, 133 assertions — and is
  rank 2 on the repository's uncovered governed-risk list. It is the highest-value next one.
- These suites have never executed on a CI runner. They passed on one machine; environment
  dependent flake has had no chance to show. A suite that flakes on the first runs goes into
  a named quarantine with `flaky` as its stated reason, not a silent retry.
- The `programs` path pattern also selects eight loose root suites. All eight were run and
  passed, and the behavioral test pins the list, so a new colliding file fails until someone
  measures it.
