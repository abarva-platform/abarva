# U-584 — Every capture question a phase declares is proven to reach a step

## Release ID

`2026-10-08-capture-step-plan-integrity`

## Status

`candidate`

## Plain-English Summary

A Move cannot advance through a phase unless the person working it is actually asked that phase's
questions. Which questions a phase asks is declared in one file; which step of the capture flow each
question is rendered on is declared in a second, hand-maintained file that keys its editorial copy by
the first file's section keys. At P3 the first file declares a different question set per confirmed
solution route, and the second declares route-shaped groupings to match.

The reconciler between the two already exists and already reports how it got there: a basis
(`default`, `variant`, or `repaired`), plus the keys it dropped and the keys it had to append. Its own
doc comment says the basis is exported "so the condition is observable". Measured: the function that
produces it has no caller outside its own module, and the one function the capture flow does call
returns the groups and discards all three signals. So nothing observed the condition, and nothing
anywhere asserted that the two declarations still agree.

That join has stalled the product end to end before. When the workspace's capture cards carried
ad-hoc ids with no overlap with the contract's section keys, every Save persisted zero fields, the
phase never evaluated complete, the approve control never enabled, and no Move could pass its gate.
The step plan is the same join one layer up: a question no step holds is a question nobody is asked,
while the capture evaluator reads the same contract and goes on requiring its answer.

This change adds no behaviour. It states the four properties the capture flow depends on and audits
them against the real declarations:

1. the grouping has exactly the number of steps the flow's step bar is shaped for;
2. every declared question is held by exactly one step — none lost, none asked twice;
3. no step holds a key the contract does not declare, and no step is left holding nothing; and
4. the grouping anticipated the contract, so no question was placed by repair without editorial copy.

**Measured on the shipped declarations: zero defects.** Every phase the route parser serves resolves
at three steps with nothing dropped and nothing appended — P0–P5 on the `default` basis, and P3's two
route-shaped groupings on the `variant` basis across every confirmed-route configuration the route
constants permit. The property is true today, has broken before, and had no guard. This adds the
guard.

## Layer Impact

- `global-control-lane`. Layer 4 (products) only, and within it only a new leaf module plus its test
  suite. No existing module's behaviour changes. No change to layers 1–3 — no intake, adapter, or
  canonical model change — and nothing is written, migrated, or re-derived.

## Client Applicability

- All clients: yes — the audited declarations are tenant-agnostic, and the audit itself runs in CI,
  not at request time.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Nothing is gated, because nothing executes in the product.

## Changes Included

- New `src/lib/programs/capture-step-plan-integrity.ts` — states the four invariants and audits one
  resolved plan or every plan the product can render. The phase list and the route configurations are
  both derived, never listed here: the phases come from the route parser that decides which phase
  pages the product serves, and the route configurations from the exported route and change-impact
  constants, so a new phase or a new route value is audited without editing this file.
- New `src/lib/programs/__tests__/capture-step-plan-integrity.test.ts` — asserts the shipped
  declarations are clean, asserts what the sweep actually visited so a clean result cannot be a
  vacuous one, and proves each invariant is checked against a constructed violation.
- A regenerated test-CI coverage census.

No existing source file is modified. No migrations, workflows, images, flags, or environment
variables changed.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__`: 160 suites, 2057 tests.
- **PASS** — `npx jest --runTestsByPath` on the new suite: 16 tests. Invoked by path rather than by
  pattern, because a path containing a bracketed segment is read as a regular-expression character
  class and can report a confident green while running a different set.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0 (not
  134, so not an out-of-memory exit read as success).
- **PASS** — `npx eslint` over both new files, exit 0.
- **PASS** — registered-suite proof via census delta, measured after merging `main`: `testFiles`
  2829 → 2830, `coveredTestFiles` 2664 → 2665, and `uncoveredTestFiles` unchanged at 165. Flat
  uncovered is the proof the suite sits in a directory a required check sweeps, so it is not dark.
  The base figures rose from the first measurement (2828/2664/164) because two sibling changes merged
  while this one was open; the census was regenerated over `main`'s version rather than
  conflict-resolved, so it asserts the true total rather than re-asserting a stale one.
- **PASS** — mutation testing: 9 mutations, 9 killed. Killed: loosening the step-count comparison so
  a short grouping passes; inverting the unheld-question predicate; raising the held-twice threshold;
  inverting the undeclared-key predicate; making the empty-step comparison unreachable; keying the
  repaired-basis check on the wrong basis; making the sweep's dedupe skip every configuration so it
  audits nothing; collapsing the phase probe to a single phase; and truncating one axis of the route
  cross-product. The harness asserts each anchor matches exactly once before applying, prints the
  baseline test count for every run (16 in all nine, so no run silently executed zero tests), and the
  module was diffed byte-for-byte against its backup after the run.
- **NOT RUN** — live signed-in walk. Nothing in this change executes in the product at request time;
  there is no runtime behaviour for a walk to observe.
- **NOT RUN** — a negative run against a deliberately drifted contract committed to the repository.
  The drift cases are covered by injected inputs at the audit boundary instead, which is why the
  suite proves each invariant is checked rather than only that today's declarations pass.

## Rollout Plan

Merge to `main`. No rollout of its own: the module has no product caller and the suite runs in CI on
the next run after merge. No migration to apply, no flag to set, no environment variable to change,
and no image to rebuild for the behaviour to take effect.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only authority that may
  shift shared web traffic. This change performs and requires no deploy action.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image is updated here.
- ACA runtime invariant: unchanged, and not claimed.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no, and none is claimed. This record claims `merged` only, and the
  change has no live-provable surface.

## Rollback Plan

Revert the squash commit. The change is confined to two new files and a regenerated census; it adds
no product caller, writes nothing, migrates nothing, and reads no new table, so a revert needs no
data repair and changes no runtime behaviour. Reverting removes the guard and restores the prior
state, in which the two declarations could drift unobserved.

## Audit Evidence

- The pull request and its CI run, including the `Behavior coverage floor`, `Typecheck +
  reasoning-layer tests`, `ESLint`, and `Release record and impact note` checks.
- `src/lib/programs/capture-step-plan-integrity.ts` — the module header records which two
  declarations have to agree, which reconciler signals had no reader, and the mechanism by which a
  drift between them stops a phase from completing.
- The census delta above is the proof the suite is CI-wired rather than orphaned: a covered count
  that rises while the uncovered count stays flat.

## Known Gaps

- This is a guard, not a repair. It finds no current defect, and it is honest about that: the value
  is that a future edit to either declaration now fails a check instead of silently changing which
  questions a route's user is asked.
- One latent loss in the reconciler is pinned as a detected case but deliberately not changed. With
  no grouping to repair there is no last step to append to, so every declared question is reported as
  appended and held by nothing — a zero-step flow asking none of the phase's questions. This is
  unreachable through the product today, because the route parser rejects a phase outside the served
  range before a page renders, so changing the reconciler would be a behaviour change to an
  unreachable branch. The audit detects it; nothing relies on it.
- The audit is not read by any product surface. It joins the other diagnostic signals that flow and
  render nowhere; a CI check is the right consumer for this one, but the broader pattern remains.
- The audit covers which step holds a question. It does not check that the step's editorial copy
  (title and intro) still describes the questions grouped under it, which can drift without any key
  changing.
