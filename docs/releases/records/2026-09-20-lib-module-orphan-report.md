# 2026-09-20-lib-module-orphan-report — Report src/lib modules that only a test reaches

## Release ID

`2026-09-20-lib-module-orphan-report`

## Status

`candidate`

## Plain-English Summary

The repository had one audit that asked "can a user reach this file?" and it watched
`src/components` only. Nothing asked the same question of `src/lib`. That is how modules can
outlive the removal of their only consumer: their own test suites keep passing, so a green suite
reads as evidence that the code is still reached, and nothing contradicts it.

Extending the existing audit to `src/lib` unchanged would not have fixed that, and both wrong
answers were measured on this tree before anything was written:

- **Route-only reachability** reports 799 modules as dead. Most are alive — they are reached from
  an operator script or a scheduled job, which is a different entry point, not an absent one.
- **"Is it imported anywhere"** reports every real orphan as live, because each one's own test
  imports it. This is the check that would have scored all of them as fine.

So this adds a separate report that classifies each module by *which class of entry point reaches
it*, with one boundary doing the work: **a test is not an entry point.** Four states, in
descending strength — reached by product code, reached only by operator tooling, reached only by a
test, reached by nothing. The middle two are the finding, and they carry different repairs: a
test-only module cannot be deleted without deciding what to do with its suite, while an
unreferenced one can just go.

Today's population, recorded as a baseline rather than asserted as a target: of 2,927 non-test
modules under `src/lib`, 2,132 are reached by product code, 230 only by operator tooling, **432
only by a test**, and **133 by nothing at all**.

The change also repairs a real gap in the shared reachability walk that the new report exposed.
The list of non-route runtime entry points named `middleware.ts`, which this tree does not contain
because the framework renamed it to `proxy.ts`. Exactly one `src/lib` module is reachable only from
that entry point, and it is a route tenancy guard — so before this fix, an orphan report would have
named a wired access control as unreached. The walk now accepts either name.

## Layer Impact

Release lane: `internal-admin` — this ships CI tooling and a developer-facing report. It changes no
product surface, no client data and no runtime behavior, so it is not a `global-control-lane`
change despite touching a shared script.

- **Layer 4 (Products)** — no product behavior changes. No route, component, query, projection or
  answer path is touched.
- **Platform tooling** — one new audit script, one new shared classifier, one baseline artifact,
  one CI step, one npm script, one gate-registry entry.
- **Shared reachability walk** — `scripts/audit/lib/route-reachability.mjs` now counts the
  framework's current non-route runtime entry point. Three other audits consume this walk; all
  three were re-run and none moved (see QA below).

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a CI gate and a developer-facing report
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/audit/lib/module-referrers.mjs` (new) — classifies modules under a watched directory
  into product / tooling / test-only / unreferenced. Takes the repository root as a parameter so it
  can be exercised against a fixture tree rather than only against the real tree.
- `scripts/audit/lib-orphan-report.mjs` (new) — the check and its baseline comparison. Refuses to
  report anything if the walk found zero product entry points, because that is a tooling failure and
  reporting it as 2,927 findings would be the most confident wrong answer available.
- `scripts/audit/lib/route-reachability.mjs` — accepts `proxy.ts` as a non-route runtime entry
  point alongside `middleware.ts`.
- `docs/architecture/orphaned-lib-modules.json` (new) — the baseline: 432 test-only, 133
  unreferenced.
- `src/__tests__/behaviors/lib-orphan-report.test.ts` (new) — 12 cases over a fixture tree.
- `.github/workflows/architecture-boundary.yml` — one step, beside the component reachability step.
- `docs/architecture/ci-gate-registry.json` — classified `pr-gate` with its reason.
- `package.json` — `audit:lib-orphans`.

## QA / Validation

**The test fails without the fix.** `npx jest --runTestsByPath src/__tests__/behaviors/lib-orphan-report.test.ts`
before the shared-walk repair: **2 failed, 10 passed, 12 total** — both failures are the
`proxy.ts` entry-point gap, which is a defect present on `main`. After the repair: **12 passed, 12
total**. The other ten cases cover the new classifier, so they pass on first write; that is stated
rather than presented as a caught regression.

**The guard can fail — 8 of 8 mutations caught.** Each mutation was applied to the shipped code,
the suite re-run, and the mutation reverted. The harness asserts it parsed a real test count and
ran a non-zero number of tests before any verdict was trusted.

| Mutation | Result |
|---|---|
| `proxy.ts` removed from the runtime entry list | caught (2 failing) |
| a test treated as an entry point | caught (3 failing) |
| `jest.mock` not counted as a reference | caught (1 failing) |
| a scheduled job not treated as an entry point | caught (1 failing) |
| operator tooling folded into product | caught (1 failing) |
| tooling entry points not walked | caught (2 failing) |
| test files classified alongside modules | caught (1 failing) |
| the import chain not followed past one hop | caught (1 failing) |

**The gate itself was executed, in both ratchet directions, and judged on its exit status:**

| Condition | Exit |
|---|---|
| clean tree | `0` |
| a new module nothing imports | `1` — named it as `unreferenced` |
| a new module only a test imports | `1` — named it as `testOnly` |
| a baseline entry that is reachable again (stale list) | `1` — named it and printed the refresh command |
| restored | `0` |

The second direction is deliberate. Three other lists in this repository went stale without a red
build because their ratchet only turned one way; this one fails on a stale entry too, and reports a
state change (`testOnly -> unreferenced`) separately from a new entry, because the repair differs.
Both directions fired on real changes before this pull request merged.

**The added direction caught a real finding on its first day, filed as T-512 rather than quietly
baselined.** A rebase onto `main` picked up a newly merged module, `src/lib/source/artifact-scan-gate.ts`,
and the gate reported it as `testOnly`. That is correct and it is not noise: `evaluateArtifactScanGate`
is imported by exactly one file in the repository, its own behavioural suite. The scan decision it
computes is never asked for by a product path, so the control it implements does not run — which is
the same shape as the gate that was satisfied by a comment, one step further along. It is in the
baseline because a baseline that omits a real orphan cannot be checked against, and it is named here,
in the pull request, and in the backlog as T-512 so that it is handed to its owner rather than
absorbed. Repairing it belongs to whoever owns that item, not to this one.

**The stale direction also fired on a real change, in CI, within minutes of being wired.** The first
pull-request run failed with `Baseline is stale — these are reached again: src/lib/source/nda/executed-document-evidence.ts
(was testOnly)`. That is not a false positive: `main` had advanced while this branch was open, and a
merge on it gave that module a product caller for the first time. The branch was rebased and the
baseline regenerated — 432 test-only became 431. A one-way ratchet would have stayed green and left
the list quietly wrong, which is the failure mode this direction exists to prevent.

**Same-scope regression baseline**, `npm run test:behaviors`:

| | Suites | Tests | Failing |
|---|---|---|---|
| before (`origin/main` content of the code the suite reads) | 59 | 601 | 0 |
| after | 60 | 613 | 0 |

**Consumers of the shared walk, re-run after the entry-point repair:**

- `npm run audit:route-reachability` — passes. Route entry points 630 → 631; unreachable component
  count unchanged at 398, so the component baseline needed no refresh.
- `npm run audit:ai-surface-controls` — passes. 18 surfaces, 37 declared controls, behavioral
  coverage of reachable controls 29 of 29, all figures unchanged.
- `npm run audit:ci-gate-registry` — passes, 221 scripts. `npm run audit:ci-gate-registry-order` —
  sorted.
- `npm run test:nav` — 26 passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics. (Judged on exit status: a bare `tsc --noEmit` exits 134 on the executor machine, a
  crash that emits no diagnostics and reads as clean when grepped.)
- `npx eslint` over the four new and changed files — clean.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow runs on merge as usual. There
is no runtime component to this change: no route, flag, environment variable, image contract or
worker job is touched, and the new step runs only in the Architecture Boundary workflow on pull
requests and merge groups.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command is involved.
- Approved image digest: not applicable — no runtime image contract changes.
- ACA runtime invariant: to be captured after merge from the deploy run at or after the merge SHA
  (template image = 100%-traffic revision image = worker job images).
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — the change is one CI step, one audit script, one shared
  classifier, one baseline artifact and one test file. No signed-in surface renders anything from
  it, so there is no client-visible behavior a signed-in session could confirm or refute.

## Rollback Plan

Revert the commit. No migration, no data change, no image or flag change, so a revert is complete
by itself. To disable the check without reverting the report, remove the single step from
`.github/workflows/architecture-boundary.yml` and reclassify the registry entry.

## Audit Evidence

- The pull request for this record and its CI run.
- `docs/architecture/orphaned-lib-modules.json` — the baseline, with the counts and the entry-point
  counts each walk contributed.
- `node scripts/audit/lib-orphan-report.mjs --json` — the machine-readable form, including `added`,
  `removed` and `moved`.
- `src/__tests__/behaviors/lib-orphan-report.test.ts` — the fixture tree constructing all four
  states.

## Known Gaps

- **The 565 orphans are recorded, not repaired.** This release makes the population visible and
  stops it growing silently; deciding each module's fate is separate work, and the two buckets need
  different handling. A test-only module must not be cleared by repairing its suite in place —
  that manufactures coverage for code nothing calls.
- **Import resolution is textual, not parsed.** The classifier matches import forms with regular
  expressions over source text, inheriting the limits of the existing walk it builds on. A module
  reached only through a dynamically computed specifier would classify as an orphan. This is the
  same known limitation already recorded against the coverage census, and it is named here rather
  than silently extended.
- **`src/lib` only.** `src/hooks`, `src/config` and `src/data` have the same shape and are not
  watched by anything. Extending the watch list is cheap; sizing each population first is not, and
  was not done here.
- **The tooling bucket is a weaker signal than it looks.** A module reached only from an operator
  script is alive, but only as long as that script is run by someone. Nothing in this release
  checks whether the script itself is reachable from a documented operator path.
