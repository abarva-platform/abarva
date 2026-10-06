# 2026-10-05-moves-originate-step-position-figures — Moves: the Originate step position counts the step list it is a position in

## Release ID

`2026-10-05-moves-originate-step-position-figures`

## Status

`candidate`

## Plain-English Summary

The P0 Originate screen carried three more figures that the previous sweep of
this screen did not reach. The most consequential is the step position in the
detail pane.

The screen's navigation renders one row per scaffold field **plus** a final
submit step. The position figure read `Step N of M`, where `N` is a position in
that navigation list but `M` was the field count alone — two different sets, one
figure. Two consequences followed by construction:

- The submit step was forced to the field count, so it rendered the **same
  position as the last field**. On the default scaffold both read "Step 10 of
  10"; two distinct navigation rows reported one position.
- The flow's real last position — the submit step, 11th of 11 — was unreachable.
  A reader on the submit step could not tell from the figure that anything
  followed the tenth field, because the figure said the tenth field was the end.

The navigation foot read `N of M complete`: a figure with no noun at all, sitting
beside the clause "finish required steps". The figure measures captured answers;
"required steps" names the navigation list, which is one larger. So the only noun
a reader could attach to the figure named a set the figure does not count.

The progress pill holds its noun ("answers captured") in a different element from
its figure, as a fixed plural, so the two cannot agree by construction.

Fixed by extending the screen's existing pure figure module: the step position
now counts the navigation list on both sides, the navigation foot states the noun
it measures, and the pill's noun is derived from its own total.

## Layer Impact

Lane: `global-control-lane` — this corrects client-visible figures on a surface
that renders unconditionally, with no feature flag to gate it behind.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched. No new feature flag is declared and no existing flag's resolution
changes. The P0 brief is read and written exactly as before; only the labels
describing it change. No product gains or loses ownership of data.

## Client Applicability

All clients. The Originate detail pane, navigation foot and progress pill are
not feature-gated, so every tenant reaching P0 origination sees the corrected
figures. No real client engagement exists on this surface. Tenants are resolved
from code, not from any list in this record.

## Why this is the honest direction

The step total gets larger, not smaller: 11 where it used to say 10, 18 where it
used to say 17. That is not inflation. The submit step is a real row in the
navigation's last stage group, a reader can click it, and it is where the intake
is submitted. A total that excludes it describes a list the reader is not looking
at — and the proof is that the figure then had to reuse the last field's number
for a step that is not the last field.

Counting the same set on both sides is the only form in which the figure is
bounded by its own total by construction, rather than by a coincidence between
two independent lists.

## Changes Included

- `src/components/strategic-moves/originate-figure-labels.ts` — three new pure
  functions (`originateStepCount`, `formatOriginateStepPosition`,
  `formatOriginateNavFootProgress`, `formatAnswersCapturedNoun`) extending the
  module this screen's figures already go through. The header comment records
  defects 4, 5 and 6 alongside the three the module was created for.
- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx` — the three
  render sites now call the module. The `activeStepNumber` local, which encoded
  the set mismatch by forcing the submit step to `requiredFieldCount`, is
  replaced by the formatted position.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
  — 7 new cases in the already-registered suite. Two pre-existing assertions
  used the nounless navigation-foot figure as a selector and are conformed; that
  conformance is itself evidence the rendered text changed.

No new suite file, so no CI catalog entry and no coverage-census change. No flag,
so no `docs:nexus-manual` regeneration.

## QA / Validation

- **PASS** — `npx jest src/components/strategic-moves/__tests__` (the whole
  directory, which is the preservation evidence for a host change): **35 suites
  / 441 tests**, 17s. Run after the final edit.
- **PASS** — `npx jest` on the Originate suite alone: 27 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
--noEmit`, exit code 0.
- **PASS** — `npx eslint` on both changed product files and the suite: clean,
  exit code 0.
- **PASS** — mutation check, **7 of 8** mutations killed: step count drops the
  submit step (3 red); submit position falls back to the field count (3 red);
  navigation foot noun becomes a fixed plural (1 red); navigation foot drops its
  noun and reverts to the old clause (4 red); pill noun becomes a fixed plural
  (1 red); host reverts the step render to the old inline expression (1 red);
  host reverts the navigation foot to the old literal (2 red).
- **FAIL (diagnosed, not a guard hole)** — the eighth mutation reverts the
  **pill's** noun at the host to the literal `answers captured` and survives.
  It is unreachable rather than unguarded: the active scaffold is either 10
  fields or 17, so no reachable size distinguishes singular from plural at that
  call site. The module function itself is guarded by its own case. The pill
  half is therefore recorded below as a construction correction with no
  demonstrated wrong reading, and is not claimed as user-visible.
- **PASS** — hole sizing: the host step-render mutation run against the **whole
  directory** failed **1 of 441**, and it was a new case. So 440 tests exercised
  this component and none noticed that two navigation steps reported one
  position.
- **NOT RUN** — signed-in walk of this change. It needs the deploy that carries
  it; the walk is owed and is recorded as a gap, not claimed. The prior sweep of
  this screen is itself still unwalked because the P0 Originate rail was not
  reachable from either candidate Move (see Known Gaps).
- **NOT RUN** — phone-width measurement. jsdom does not lay out.

## Audit Evidence

- The set mismatch is visible in the pre-change component as
  `const activeStepNumber = isApproveStep ? requiredFieldCount : (activeP0Def?.step ?? 1)`
  — the submit branch assigning the denominator to the numerator is the defect
  in one line.
- The navigation's step list including the submit step is visible in the stage
  groups as `{ label: "Submit", stepIds: ["approve-build"] }`, and in
  `type P0StepId = ScaffoldFieldId | "approve-build"`.
- Reachability was counted, not asserted: the scaffold is 10 fields with the
  extended-intake prop off and 17 with it on (steps 1–10 and 11–17), so the
  step totals the figure can render are exactly 11 and 18, and the fixed-plural
  branch of the pill's noun is reachable from neither.
- The two conformed pre-existing assertions (`/4 of 10 complete/`,
  `/1 of 10 complete/`) go red on the fix, which is what says the rendered text
  changed rather than only the source.
- The host test asserts both the new position and the absence of the old one
  ("Step 11 of 11" present, "Step 10 of 10" absent), and a vacuity guard pins
  the extended scaffold to 18 so neither total can be a constant.
- Mutation output is reproducible by the eight patches named in QA; each was
  applied to a copy, run, and reverted.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys the merge commit; no manual Azure step is part of this rollout. The
change is label-only on a surface with no flag, so it takes effect for every
tenant on the deploy that carries it.

## Rollback Plan

Revert the squash commit. The change adds four functions to one existing module
and rewires three render sites within one component; reverting restores the
previous labels exactly, including the repeated step position. No data is
written, migrated or backfilled, so a revert needs no data step.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command was run for
this slice.

## Known Gaps

- **The signed-in walk of this change is owed** — it needs the deploy that
  carries it. The step position is the half with user-visible consequence: the
  submit step reads one past the last field where it used to repeat it.
- **The P0 Originate rail has not been reachable in a walk.** The previous sweep
  of this screen could not be proven live because both candidate Moves scraped
  from the portfolio landing redirected past P0 to the phase-1 route, so this
  component never rendered. Finding a route, or a Move actually seated at P0,
  gates the walk of both slices.
- **The pill's noun is a construction correction only.** No reachable scaffold
  size distinguishes its singular from its plural, so no reader can be shown a
  wrong figure there today. It is corrected because a noun held in a separate
  element from its figure cannot agree with it if the scaffold size ever
  changes; it is not claimed as a fixed user-visible defect.
- The navigation foot still renders a second, unfigured sentence when the brief
  is complete ("Answers complete · ..."), which is correct but means the two
  branches of that one element do not share a shape.
- Other fixed-plural figures the screen-wide grep found remain untouched on
  non-Originate surfaces, named in the previous record's gaps.
- Nothing on this screen has been measured at phone width.
