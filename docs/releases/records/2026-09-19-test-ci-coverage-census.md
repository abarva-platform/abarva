# 2026-09-19-test-ci-coverage-census — measure which Jest suites under `src/` CI actually runs

## Release ID

`2026-09-19-test-ci-coverage-census`

## Status

`candidate`

## Plain-English Summary

Six separate times in recent weeks, a directory of automated tests was discovered to run in no
continuous-integration job at all. Each one was found by accident, while someone was working on
something else; each one was wired in on its own; and each one cost a round trip. Nobody had ever
measured how large the gap was, so the next instance was always going to be found the same way.

This change measures it. A new script enumerates every Jest test file under `src/` and asks, per
file, whether a GitHub workflow reaches a command that names it. The answer is written to
`docs/architecture/test-ci-coverage-census.json` so the gap is a number with a per-directory
enumeration behind it rather than an impression.

The number, on this commit: **2,279 Jest test files under `src/`. 375 are run by a workflow, 372 of
those by a workflow that can block a merge, and 1,904 are run by no workflow at all.** Of 476
directories containing tests, 59 are fully covered, 21 partially, and **396 not at all**.

This is deliberately a measurement and not a gate. It always exits zero and it decides nothing about
what the scope policy should be — widening a Jest scope, wiring per directory, or accepting the gap
are all live options with different costs, and that call belongs to the owner. What ships here is the
input to that decision, plus the tests that make the number trustworthy.

## Layer Impact

`global-control-lane`. No product layer changes. This touches test/CI tooling only: one new script,
one generated enumeration under `docs/architecture/`, one behavioral suite, two npm entries and two
gate-registry classifications. No route, component, agent surface, prompt, schema, migration or
data-plane read path is touched, and no product behaviour changes for any client.

## Client Applicability

- All clients: no change. Nothing a signed-in user can reach is altered.
- Specific clients: none.
- Internal only: yes — engineering and CI measurement.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs` — new. Enumerates Jest test files under `src/` and
  resolves, per file, whether a workflow reaches a command naming it or a directory above it.
- `docs/architecture/test-ci-coverage-census.json` — new. The census: counts, the directories with
  zero coverage, the partially covered ones, and any Jest invocation whose paths could not be
  resolved. Carries no timestamp, so refreshing it on an unchanged tree is a no-op.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` — new. Eleven cases driving the real
  script as a subprocess against scratch repositories.
- `package.json` — `audit:test-ci-coverage` (print) and `audit:test-ci-coverage:write` (refresh).
- `docs/architecture/ci-gate-registry.json` — both classified, with the reason each is not a
  pull-request gate.

### Why the resolution takes four hops

A workflow rarely names a test path directly. It runs an npm script, which may run another npm
script, which may run a Node script that spawns Jest, which may take its path list from a JSON
baseline file. All four hops are followed, and every resolved path records which hop found it, so
any entry in the census can be audited back to the line that justifies it.

That is not gold-plating. A reading that stops at the workflow step reports `src/__tests__/behaviors`
— the one directory everybody knows is gated — as uncovered, because the only thing naming it is an
argument array inside `scripts/ci/check-behavior-coverage.mjs`. And the ratchet baselines under
`docs/ci/` are what actually put two large product directories under a CI check; a census blind to
them over-states the gap by hundreds of files.

### What it deliberately does not do

It does not guess. A Jest invocation whose paths cannot be resolved to literals is reported in
`indeterminateInvocations` rather than assumed either way, and while that list is non-empty the
uncovered count is stated as an upper bound. On this commit the list is empty.

Scanning a reachable script's whole text for a path would be worse than not scanning it at all. The
sibling checker `scripts/quality/check-integration-ci-visibility.mjs` names the integration root in
a constant and mentions the runner in a regex, so a whole-text reading credits **every** integration
suite in the repository as covered — an error in the direction that hides the gap. An earlier draft
of this script did exactly that and reported 613 covered files instead of 375. One case pins it.

## QA / Validation

**Measured before and after, same commands, judged by exit code.**

- **The suite against the shipped script: 11 passed / 11.** Against the two drafts it replaces the
  same eleven cases fail: a workflow-step-only reading fails **3**, and a whole-file-text reading
  fails **1** (the case that pins the over-credit). Those are not hypothetical variants — both drafts
  existed while this was being built, and both numbers are from running this suite against them.
- **Seven mutations of the shipped script, every one caught** (failures in brackets, file byte-restored
  and `diff`-verified after each):
  1. script-file hop removed → **3 failed**
  2. narrow invocation detection replaced by whole-file text → **1 failed**
  3. ratchet-baseline hop removed → **1 failed**
  4. every workflow treated as merge-blocking → **1 failed**
  5. an unresolvable invocation credited as coverage instead of reported → **1 failed**
  6. compact `- run:` step folding removed → **6 failed**
  7. the report written unconditionally instead of write-if-changed → **1 failed**
- **Spot-audited against known facts about this repository** rather than taken on trust:
  `src/__tests__/behaviors` fully covered; two ratcheted product directories fully covered; the
  component directory wired one day earlier fully covered; `src/__tests__/integration/source`
  uncovered, matching what a separate integration-visibility change established; one integration
  subdirectory at 1 of 37 covered, which is exactly the single file a shell gate names.
- **Scope baseline, same command either side.** `npx jest src/__tests__/behaviors`: **0 failing / 271
  passing before → 0 failing / 282 passing after** (26 suites → 27).
- `npm run coverage:behavior-gate` exit **0** — 93.44% lines against a floor of 90. The suite drives
  subprocesses and imports no product module, so it adds nothing to the coverage denominator; a
  behavioural suite that instead imports a route has been observed to drop that figure below the
  floor, and this one deliberately avoids that shape.
- `node scripts/audit/ci-gate-registry-check.mjs` exit **0** — 211 scripts, both new entries
  classified. The registry refuses an unclassified new script, so this was not optional.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit **0**, with
  `tsconfig.tsbuildinfo` removed beforehand.
- `npx eslint` on both new files: exit **0**, no output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` exit **0**, with a clean tree
  afterwards.

## Rollout Plan

Merge to `main` via squash. The repo-owned Azure Container Apps deploy workflow runs on merge as it
does for every change. There is nothing to enable: the script is run by hand or read from the
committed census, and the behavioural suite runs on every pull request under the existing behaviour
coverage job with no workflow edit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No Azure command is run by hand for this change.
- Approved image digest: whatever the main deploy workflow builds from the merge commit.
- ACA runtime invariant: to be read back after merge — Container App template image equals the
  100%-traffic revision image, digest-pinned.
- Worker image invariant: to be read back after merge — both non-manual worker jobs on the same digest.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: **no.** Nothing renders, no route or component changes, and no
  answer path is touched. There is nothing a signed-in session could observe.

## Rollback Plan

Revert the squash commit. Nothing depends on the new script, the census is read by people rather
than by code, and the two npm entries have no callers in any workflow. No migration, no data write,
no flag.

## Audit Evidence

- The pull request and its checks.
- `docs/architecture/test-ci-coverage-census.json` — the enumeration, re-derivable at any commit with
  `npm run audit:test-ci-coverage`.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts` executing in the behaviour coverage job.
- `docs/architecture/ci-gate-registry.json` — the recorded reason neither entry gates a pull request.

## Known Gaps

- **The committed census can go stale and nothing fails when it does.** It is a dated measurement,
  refreshed by `npm run audit:test-ci-coverage:write`. A check asserting the committed numbers match
  a fresh run would fail on nearly every pull request that adds a test file in an uncovered
  directory, which is most of them, so it was not added. The behavioural suite asserts the census
  file is present, parseable and shaped like a fresh run; it does not assert the numbers are current.
- **The scope policy is not decided here, on purpose.** What to do about 1,904 uncovered files needs
  an owner call, and a gate encoding an undecided policy is worse than a measurement informing one.
- **One resolution limit, recorded rather than fixed.** The imported workflow-command extractor only
  matches `run:` at the start of a line, so a one-line `- run:` step was invisible to it. This script
  folds that form away before extraction; the sibling integration-visibility checker still has the
  blind spot. One such step exists in this repository today and it runs `npm ci`, so no number moves
  — but a Jest step written that way would be missed by the sibling.
- **Directory matching is by exact path segment, not by Jest's own regex semantics.** A bare Jest
  path argument is a pattern, so `src/lib/example` would also match `src/lib/example-adjacent`. The
  census does not credit that, which means it can under-state coverage in a sibling-prefix case and
  never over-state it.
