# 2026-10-05-moves-capture-step-mount-discriminator — The capture flow's mount set is derived from its contract, not read off a screen

## Release ID

`2026-10-05-moves-capture-step-mount-discriminator`

## Status

`candidate`

## Plain-English Summary

The Moves phase-capture screen asks its questions in three steps. For several
weeks, the automated read-only check that proved this screen had not changed
shape worked by counting the question slots on all three steps and comparing the
total against the previous reading.

That check can no longer be run, and the reason is a product improvement, not a
defect: *Continue* is now correctly disabled until the questions on the current
step have been answered and saved, and the step bar only navigates back to steps
already visited. A read-only check saves nothing, so it can only ever see step 1.
The old total was therefore about to be reported as missing — which reads like a
regression when nothing regressed.

This change replaces that measurement instead of retiring it. The number of
questions each step mounts is now **derived from the capture contract** — the
canonical list of questions for the phase — and the rendered first step is pinned
against that derivation in the test suite. One reachable step is now enough to
falsify a structural change to the screen, and the two steps nobody can reach
read-only are evidenced by the contract rather than by an observation that can no
longer be made.

No behaviour changes. Nothing renders differently. This is a measurement moving
from a manual observation into the test suite.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients,
not feature-gated. Shared in the sense that the module is shared; nothing a
client can observe changes.

- `4 PRODUCTS` (Moves): one new exported helper in the phase step-group module
  (`phaseStepQuestionCounts`) and new test cases. No component, route, API,
  prompt, or rendered output changed — the capture screen renders byte-for-byte
  what it rendered before this change.
- `3 CANONICAL MODEL`: unaffected. The helper **reads** the phase capture
  contract and asserts nothing new about it; no object, ID, or value changes.
- Layers 1 and 2: untouched.

## Client Applicability

- All clients: no change in behaviour.
- Specific clients: none.
- Internal only: yes, in effect — the change is a test-suite and derivation
  change only.
- Public/demo only: no.
- Feature flag: none added. The derivation describes the `moves_capture_v2`
  render path but is not gated by it and does not read the flag registry.

## Changes Included

- `src/lib/programs/moves-phase-step-groups.ts` — new export
  `phaseStepQuestionCounts(phase, sections?)`. Counts, per step, the step's
  section keys that the supplied capture contract actually declares. This is the
  same rule the component applies when it renders a step (its key list mapped
  through the sections it was given, misses dropped), so the derivation and the
  screen cannot disagree by construction. Defaults to the live contract for the
  phase.
- `src/lib/programs/__tests__/moves-phase-step-groups.test.ts` — three cases for
  the derivation: one count per step and the counts partition the phase's
  canonical questions; only contract-declared keys are counted; an unmodelled
  phase derives nothing.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — two
  cases rendering the flow against the **live** capture contract (the rest of
  this suite uses a hand-written fixture): step 1's rendered `.mcf-question`
  count equals the derivation's first entry, and the questions mounted are that
  step's own, in the contract's order, and not all of the phase's.

## QA / Validation

Measured in a dedicated worktree at `62b65eeef7` (`origin/main` at the time of
the run), which already contains `#9019` (`b7c1f7cbe2`).

- **Clean baseline, same scope.** The two suites at pristine `origin/main`:
  `2 suites passed, 23 tests passed, 0 failing`.
- **Failing test first.** With the new cases added and no implementation:
  `4 failed, 24 passed, 28 total` — so **0 failing before, 4 failing after**,
  over the same two suites. (The fifth new case, the question-order pin, passes
  without the new export, as a non-regression pin should.)
- **After the implementation:** `28 passed, 28 total`, 0 failing.
- **The fix broken deliberately, four ways:**
  1. Derivation returns `group.sectionKeys.length` (unfiltered) → `1 failed`,
     and it is the "counts only the keys the supplied contract declares" case.
     Nothing else in the repository catches this.
  2. The step panel renders every section of the phase instead of the step's →
     `3 failed`, including both new component cases.
  3. The step panel drops its last question → `4 failed`, including both new
     component cases.
  4. **Limit probe, recorded because it is a real boundary:** moving a question
     from step 1 to step 2 in the grouping → **neither new case fails.** Both
     sides of the derived assertion move together, by design; that drift is
     caught by the pre-existing fixture-based case in the same suite and by the
     step-group invariants (every key exactly once, at most four per step, first
     step leads with the phase's first canonical input). The two guards are
     complementary: the derivation falsifies rendering drift, the fixture
     falsifies grouping drift. Stated so no later reader mistakes the derived
     assertion for a guard against regrouping.
- **Whole affected directories**, not just the two suites — the changed module is
  shared: `npx jest src/components/strategic-moves src/lib/programs` →
  `318 suites passed, 4326 tests passed`.
- **Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
  --pretty false` → **exit 0**, 0 `error TS`. Exit code judged, not grepped.
- **Lint:** `npx eslint` over the three changed files → exit 0, no findings.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and
deploys as it does for any merge. There is no runtime behaviour to roll out: the
only non-test change is an exported function with no caller in application code,
so the served bundle's behaviour is unchanged.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No deploy is run by hand for this change.
- Shared runtime mutators: none. This change runs no `az` command and mutates no
  Container App, revision, traffic weight, env var, secret, scale rule, or
  worker job.
- Approved image digest: whatever the main deploy workflow builds from the squash
  commit. This record asserts no digest of its own.
- ACA runtime invariant: to be proven by the deploy workflow's own
  runtime-invariant step for the revision it creates; this record does not claim
  `live-proven`.
- Worker image invariant: unaffected — no worker job image changes.
- Feature/env flag update path: not applicable, no flag added or changed.
- Live signed-in proof required: **no**, and this is the point of the change.
  The behaviour this derivation describes is unchanged, and the step-1 reading a
  signed-in walk can still take is now pinned in CI. The walk-side note that
  tells the next wave the old total is superseded is listed under Known Gaps.

## Rollback Plan

Revert the squash commit. No migration, no data, no flag, no runtime state is
involved, so a revert is complete on its own. Reverting restores the state in
which the capture flow's mount set is asserted only against a hand-written
fixture and no contract-derived expectation exists.

## Audit Evidence

- The pull request opened from branch `exec/run-20261005T1354Z`, and its required
  checks.
- The before/after and four mutation numbers above, each reproducible with
  `npx jest --runTestsByPath src/lib/programs/__tests__/moves-phase-step-groups.test.ts src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`.
- `docs/releases/records/u563-sixteenth-wave-signed-in-acceptance.md` and
  `docs/releases/records/u561-fourteenth-wave-signed-in-acceptance.md`, which
  record the superseded total and are the reason this record exists.

## Known Gaps

- **The walk-side note is owed and is not in this change.** The acceptance matrix
  that the signed-in wave family reads still presents the three-step total as a
  live discriminator, so the next wave can still hunt for a figure it cannot
  take. That file was held by another executor's live claim for the whole of this
  run, and taking a file under a live claim is the failure this register exists
  against — so it was deliberately left alone rather than edited. What is owed
  there is one sentence under *How to read a row*: the total is superseded, step 1
  is read as before, and the per-step expectation now lives in
  `phaseStepQuestionCounts`.
- `phaseStepQuestionCounts` has **no caller in application code** — only the
  suites. That is intentional (the component already derives its own mount set
  from the same grouping, and routing it through the helper would make the
  assertion circular), but it does mean a reachability audit will correctly
  report the export as test-only.
- The derivation covers the six modelled phases' default contracts. P3's contract
  varies by confirmed solution route; `phaseStepQuestionCounts` reads the default
  P3 sections, so a route-specific P3 mount set is not derived here and is not
  claimed to be.
