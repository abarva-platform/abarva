# 2026-09-22-wire-thirteen-unrun-governed-suites — Thirteen healthy test suites that no CI job ran now run in a required one

## Release ID

`2026-09-22-wire-thirteen-unrun-governed-suites`

## Status

`candidate`

## Plain-English Summary

A previous change surveyed twenty automated test suites that were written, are healthy, and
that no part of our build pipeline ever ran. Fifteen of them were marked "wire these into
CI". This release wires thirteen of the fifteen into a job that must pass before any change
can merge. Between them they are 260 individual checks over how the Source workspace
renders money, evidence, navigation and deep links, and over how agent-side artifact,
mission and editorial-isolation behaviour keeps one client's content out of another's view.
All 260 were run before being wired and all 260 pass, so no known failure is being imported.

**Two of the fifteen are deliberately NOT wired, and that is the substantive finding of this
release.** In both cases an earlier record had already looked at the file and left it out on
purpose, and the survey that marked them "wire into CI" reached that verdict from "the suite
is green and the directory carries governed risk" without reading the earlier reason.

- One is a route-identity suite that an earlier record holds back until it does three things:
  passes, derives its expectations from the chosen canonical tenant authority, and proves
  that one client is refused another client's data. Only the first is true today. It was
  rewritten to actually render the pages rather than match their source text, and it passes,
  but it derives from neither of the two competing canonical key lists, and its strongest
  isolation case proves that an *unresolved* client fails closed — not that a *different*
  client is refused.
- The other is the suite for a legacy compatibility database client. The record that wired
  its siblings left it out because an architecture rule rejects new dependencies on that
  client. That reason is still live and was measured rather than assumed: adding the step
  and running the architecture audit returns a violation against the workflow file itself.
  The rule scans workflow lines, so the step cannot be added even in order to quarantine it.

Neither exclusion is silent. Both are named, with their reason, in a check that fails if
anyone wires them without first discharging that reason. Both are filed as item T-599.

No product behaviour changes. No client sees anything different. This is a change to what
our own build pipeline is able to catch.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only build and release-control capability. It
ships no product behaviour.

- **Layer 4 — Products:** none. No route, component, read model, prompt or dataset is
  modified. The suites now running exercise product code, but the product code itself is
  untouched.
- **Layer 3 — Canonical model:** none.
- **Layers 1–2 — Intake and adapters:** none.
- **Build and release control (not a data layer):** the required `AI surface control catalog`
  job gains two steps; one generated census artifact is refreshed; one behavioral suite is
  added.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — CI configuration, one generated artifact, one behavioral suite, one
  release record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/ai-surface-control-catalog.yml` — two new steps naming thirteen suites
  by exact path, plus the comment recording why two of the fifteen are held out. The paths
  under the `(maestro)` route group are quoted, because bash reads an unquoted `(…)` as a
  subshell, and use `--runTestsByPath`, because jest reads a bare path argument as a regex in
  which the same parentheses are a capture group. Both traps have cost this repository a step
  that passed locally and found no tests in CI.
- `src/__tests__/behaviors/t557-unrun-suite-wiring.test.ts` — new, 59 cases. Reads the
  verdict list out of `docs/architecture/t556-stale-suite-triage.json` at run time rather
  than keeping a second copy, and answers every question through the census's own four-hop
  resolver rather than by searching workflow files for a string.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- `scripts/exec/source-stage-map.json` — one id added, for the follow-up item this change
  files. The structure map carries no status; it exists so the execution board can place an
  id at all, and an id filed without being mapped is invisible to the queue that offers work.

Chosen home: a step in the existing required catalog job rather than a dedicated workflow,
per the measured guidance in `docs/ci/README-suite-wiring.md`. These are small, that job
already owns this kind of wiring, and the job is a required status check — so the named line
in the log and the line that can block a merge are the same run, which is the rule T-595 set.

## QA / Validation

Baseline and after, same scope, same command, measured not quoted from elsewhere:

- Before, with all three changed files at `origin/main` `9afed2c6f`:
  `npx jest src/__tests__/behaviors --no-coverage --ci` → **105 suites passed, 880 tests
  passed, 0 failing.**
- After: **106 suites passed, 939 tests passed, 0 failing.** One suite and 59 cases added;
  nothing else moved.

Premise re-verified before any code was written, with the repository's own resolver and not
with a grep over `.github/workflows` — that method has filed three backlog items false:

- `node scripts/quality/test-ci-coverage-census.mjs --explain` on `9afed2c6f` → **521 test
  files no workflow runs, across 209 directories**, and all fifteen candidate paths appear in
  that list.

The suites were executed before they were wired:

- All fifteen at `9afed2c6f`: **15 suites, 280 tests, 280 passed, 2.3s.**
- The thirteen actually wired, run through the exact commands the workflow issues, quoting
  and all: **10 suites / 109 tests** and **3 suites / 151 tests**, both green, 1.7s together.
  Running the real command is the check that catches a step that finds no tests.

Red first, before the workflow was touched:

- `npx jest --runTestsByPath src/__tests__/behaviors/t557-unrun-suite-wiring.test.ts` →
  **45 failed, 20 passed of 65** in the first shape of the suite, where all fifteen were
  expected to be wired. After the two withholdings were established the suite is 59 cases and
  green.

Coverage delta, reconciled exactly rather than approximately:

- Files leaving the unrun set: **13, and 0 joining.** The thirteen are precisely the wired
  list, checked by diffing the two `--explain` outputs rather than by subtracting counts.
- Census total: **521 → 508.** No directory changed coverage state, so the committed shape
  check is clean.

Mutation-proved. Each mutation was applied to the real workflow, the suite re-run, and the
mutation reverted:

| mutation | cases failing of 59 |
|---|---|
| drop one of the thirteen named paths | 1 of 59 → 3 |
| replace the exact paths with a directory sweep of the same directory | 23 |
| wire one of the two withheld files past its quarantine | 1 |
| make the hosting workflow stop gating a pull request | 13 |

The second row is the one the acceptance turns on: a directory sweep runs all thirteen and
would satisfy a weaker check, while also wiring the three suites the survey marked
`rewrite_as_behavior` — byte-matching over source files, which item T-558 owns rewriting.
The suite refuses it.

Other gates:

- `npm run audit:architecture-rules` → **0 violations.** It returned 1 at an intermediate
  state, which is how the second withholding was established rather than assumed.
- `npm run audit:named-suite-requiredness` → exit 0, "18 directories swept by a required job".
- `npm run coverage:behavior-gate` → lines **90.92**, statements 90.92, functions 62.9,
  branches 69.22, against thresholds 90 / 90 / 60 / 50.
- The six sibling CI-ownership and ratchet suites — unit, integration, programs, named-suite
  requiredness, source-readiness, governance/tenant-library — **7 suites, 102 tests, all
  pass. No ratchet was moved and none was silenced.** Two of them went red at an intermediate
  state; both went green again when the two files their own records quarantine were withheld,
  which is the signal that the withholding is the correct reading and not a convenience.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**,
  judged by exit code, with no diagnostics. A bare `npx tsc --noEmit` exits 134 on this
  machine and reports a false clean when piped to `grep`.
- `npx eslint` on the new suite → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

One claim in an early draft of the new suite's own comment was measured and found FALSE, and
the comment now records the measurement instead. The draft said the census is spawned in a
child process because importing it would drag a 1,380-line build script's branches into the
required floor's denominator. Measured both ways: in process the floor reads lines **91.64**
and branches **70.53**; spawned it reads **90.92** and **69.22**. The import *helps*, because
a census call walks the whole tree and exercises most of what it loads. The spawn is kept for
the reason that survives measurement — the floor is a product-coverage number and a build
script moves it for reasons unrelated to the product — and the false reason is written down
so the next person to copy the shape does not copy the wrong justification.

## Rollout Plan

Merge to `main`. This is CI configuration, one generated artifact and one test suite; it
takes effect on the next pull request that runs the catalog workflow. Nothing needs to reach
a runtime for it to be in force.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as usual.
- Shared runtime mutators: none. No `az` command, image, env var, flag, scale or secret is
  touched.
- Approved image digest: not applicable — no runtime image content changes. The merge
  triggers the ordinary main deploy; its digest invariant is proven in the pulse entry rather
  than claimed here.
- ACA runtime invariant: unchanged by this release; verified after merge as routine.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No product surface, route, prompt, read model or
  client-visible string is touched, so there is nothing a signed-in session could observe
  that a required check does not already prove.

## Rollback Plan

Revert the squash commit. The two workflow steps disappear, the census artifact returns to
its previous content, and the new suite goes with them. Nothing was migrated, seeded or
deployed, so no state needs unwinding. A partial rollback is also safe: removing either step
leaves the other in place, at the cost of the new suite failing on the paths it no longer
finds — which is the check doing its job, not a second defect.

## Known Gaps

- **Two of the fifteen are not wired, and the item is therefore not fully closed.** Both are
  named with their reason in the new suite's `WITHHELD` constant and filed as T-599. Neither
  is a judgement this release was willing to make: one needs two thirds of a stated condition
  discharged, and the other is refused outright by a required architecture rule.
- **The survey that produced the fifteen did not consult the earlier records.** Two of twenty
  drawn files already had a written reason for being unrun, and the draw's verdict vocabulary
  has no value that means "already quarantined elsewhere". The same draw method has three
  more batches to run, so the same collision can recur; T-599 records the method gap as well
  as the two files.
- **One file in the wired directory is still unrun and this release does not touch it.**
  `contractDetailRetry.test.tsx` sits beside the ten wired workspace suites and was not in the
  draw of twenty, so it has no verdict and no measurement. It is not covered by the exact-path
  step, which is the honest consequence of naming paths rather than sweeping.
- **The new suite pins the count 15 / 13 / 2 / 3.** A future batch that re-verdicts any of
  those twenty files fails it until the constant moves with the record. That is intended —
  it is the ratchet — but it is a second place the numbers live.

## Audit Evidence

- PR URL and CI run: recorded in the pulse entry for backlog item T-557.
- The pre-change census line — 521 unrun files across 209 directories — and the post-change
  line at 508, both from `scripts/quality/test-ci-coverage-census.mjs --explain`, plus the
  diff of the two `--explain --json` path lists showing exactly thirteen departures and zero
  arrivals. Counts alone would not distinguish thirteen wired from thirteen deleted.
- The red-first run of the new suite at 45 failed of 65, and the green run at 59 of 59.
- The mutation table above, each row reproducible by the described edit to the real workflow.
- The intermediate architecture-audit failure that established the second withholding:
  `audit:architecture-rules` reporting one `NO_SUPABASE_RUNTIME` violation against the
  workflow file when the step was present, and zero once it was removed.
- `src/__tests__/behaviors/t557-unrun-suite-wiring.test.ts`, whose `WITHHELD` constant is the
  durable statement of which two files are not wired and why.
- `docs/architecture/t556-stale-suite-triage.json` for the verdicts this release acts on, and
  `docs/releases/records/2026-09-21-source-readiness-route-suite-ownership.md` and
  `docs/releases/records/2026-09-20-wire-governance-tenant-green-suites.md` for the two
  earlier reasons it declines to override.
