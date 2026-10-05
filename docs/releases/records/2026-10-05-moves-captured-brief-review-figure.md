# 2026-10-05-moves-captured-brief-review-figure — Moves: the captured-brief review's figure says what it counts and counts what it renders

## Release ID

`2026-10-05-moves-captured-brief-review-figure`

## Status

`candidate`

## Plain-English Summary

The P0 phase screen shows a panel that plays back the answers saved when the
Move was originated. Its header carried a figure — `7 of 7` — with no noun
anywhere: not in the visible element, and not in a tooltip either. Two other
per-phase figures sit within one scroll of it on the same screen (the capture
strip's `N questions` / `N of M answered`, and the stepper's
`N of M gate criteria`), and this was the only one that did not say what it was
counting. A reader had no way to tell which of the three quantities it was.

The same header also stated its denominator as a typed-in `7`. The list of rows
the panel renders is built immediately above the figure, so the number seven
appeared three independent times — in the array, in the figure, and spelled out
in the heading ("Review your seven Originate answers"). Any row added or removed
would leave two of the three lying, with nothing to catch it.

Both halves now come from the row set itself. The figure reads
`7 of 7 answers captured`, with the noun agreed to the total so a one-row set
could never read "1 answers". The heading carries no count at all, so there is
no second copy of the number left to disagree with the first.

This is the fourth figure of this family on this screen group and the thirteenth
overall in this sweep. Each one was found by asking the same questions of a
rendered figure: what measured it, is it derived from display copy, does it
agree with the copy it is joined to, is there a second figure a reader could
confuse it with, and is the number a literal somebody typed.

## Layer Impact

Lane: `global-control-lane` — this corrects a client-visible figure on a panel
rendered with no feature-flag conjunct at all, so it is not gated behind
anything new and cannot be gated behind anything existing.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched, no new flag is declared, and no registry entry changes. The change is
confined to how one Layer 4 projection labels a count it already computed; the
saved brief is read exactly as before, and nothing is written.

## Client Applicability

All clients. The panel renders for every tenant on the P0 phase screen with no
flag conjunct, so the corrected figure reaches everyone on the next deploy. No
real client engagement exists on this surface. Tenants are resolved from code,
not from any list in this record.

## Why this is the honest direction

Adding the noun makes the figure longer in a header that is tight on a narrow
viewport, and removing the count from the heading makes the heading less
specific. Both are worth it. A bare `7 of 7` beside two other per-phase figures
is not a weaker claim than a nouned one — it is an unresolvable one, and a
reader who maps it to the wrong quantity has been misinformed by a figure that
looked precise. The heading's spelled-out count was a second assertion of the
same fact with no mechanism keeping the two in step; deleting it removes a
latent contradiction rather than information, because the figure beside it
states the number.

## Changes Included

- `src/components/strategic-moves/originate-figure-labels.ts` — two exports
  added to the module that already owns this screen group's figure wording, so
  one contract covers all four of them. `formatCapturedBriefTally` states the
  noun and agrees it to the denominator. `summariseCapturedBrief` takes the row
  array and returns `{ captured, total, tally }` — taking the rows rather than a
  caller-supplied total is what makes a literal denominator unrepresentable at
  the call site.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the
  captured-brief review consumes `summariseCapturedBrief(rows)`; the header
  renders its `tally`; the heading drops its spelled-out count. No other
  behaviour changes.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
  — 4 cases on the two new exports, including a vacuity guard that the total
  follows the row set in both directions.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 2 host cases, plus two conformed assertions in a pre-existing case that had
  been holding the defect in place as selectors (`getByText("7 of 7")` asserted
  the bare form, and the heading assertion asserted the spelled-out count).

No new test file, so `.github/workflows/ai-surface-control-catalog.yml` and
`docs/architecture/test-ci-coverage-census.json` are both untouched. No flag, so
`docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` is untouched.

## QA / Validation

- **PASS** — `jest src/components/strategic-moves/__tests__`: 35 suites, 458
  tests, 0 failures. The whole directory was run rather than the two affected
  suites, because the change edits a component that most of the directory's
  suites render through.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0.
- **PASS** — `eslint` on all four changed files: 0 errors. Three
  `no-unused-vars` warnings in the host component are pre-existing on `main` and
  are not in the changed regions.
- **PASS** — mutation testing, 5 mutations, 5 killed, measured against the whole
  directory:
  1. denominator restored to the literal `7` in the module — 1 of 458 red.
  2. noun agreed to the numerator instead of the total — 1 red.
  3. noun dropped (bare figure restored) — 5 red.
  4. host re-inlines the bare literal figure instead of consuming the helper —
     2 red. Those two are the only cases in 458 that notice; the other 456
     render this component family and did not.
  5. heading regains its spelled-out count — 2 red.
- **NOT RUN** — signed-in walk. The deploy carrying this change does not exist
  yet, and the main-deploy run for the current tip of `main` was still in
  progress when this slice was built. The walk is owed and is recorded as a gap.
- **NOT RUN** — phone-width measurement. jsdom does not lay out, and the header
  this figure sits in is the narrowest element it affects.

## Audit Evidence

- Mutation 1 is the only evidence that the denominator is no longer a literal,
  and it is killed in the pure module only. At the host the row array is
  hard-coded with seven entries, so a total other than seven is reachable from
  no path on that screen — restoring the literal there is a mutation that
  changes no observable behaviour, and that is a statement about reachability,
  not about guard strength. The module's signature is the real guard: it takes
  the rows, so a call site cannot supply a number at all.
- The singular branch of the noun is likewise unreachable from the screen for
  the same reason, so the plural-agreement half of this change is a construction
  correction, not a reading anyone has seen. It is pinned in the module.
- The two conformed assertions in the pre-existing host case are evidence the
  rendered text really changed: both asserted the defective strings and both
  went red before being updated.

## Rollout Plan

Merges to `main`; the repo-owned ACA main deploy workflow builds and deploys it
on merge. No flag change, no env change, no registry change, no data build, no
migration. Nothing to enable after deploy.

## Rollback Plan

Revert the commit. Four files, two of them test-only and one a pure module, with
no state, no persisted field and no flag, so a revert restores the previous
rendering exactly and can leave nothing behind.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command of any kind
was run while building this slice.

## Known Gaps

- **The signed-in walk of this change is owed**, together with the walks already
  owed for the open slices ahead of it. It needs the deploy that carries them.
- **The review plays back the charter-mirror subset, not the whole saved
  intake.** The panel reads seven top-level charter keys; the origination intake
  defines ten base fields and seven more behind the extended-intake flag. Two
  base answers are absent from the playback by design — the phase-0 charter
  mirror never wrote them, so there is no mirror value to show — but whether a
  review headed "the Originate answers saved here" should instead read the
  preserved scaffold is a product question. Recorded, not taken.
- **The panel's figure and the origination screen's own figure count different
  sets** and always will while the above holds: one counts rendered playback
  rows, the other counts intake fields. Each now states its noun, but the two
  nouns are the same word. Distinguishing them is a copy decision on a
  design-locked surface.
- The remaining nounless figure of this family found by the same sweep is the
  phase explorer rail's `met/total` tally
  (`src/components/strategic-moves/MovePhaseExplorer.tsx`). It has no visible
  noun and no tooltip when the rail is expanded. It was left out of this slice
  because that component has no mount site in `src/app/` and its reachability
  must be established before it can be called a user-visible defect.
