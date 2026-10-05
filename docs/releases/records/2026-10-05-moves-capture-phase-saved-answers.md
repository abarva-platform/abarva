# 2026-10-05-moves-capture-phase-saved-answers — Moves: an unmeasured phase row states what it has saved

## Release ID

`2026-10-05-moves-capture-phase-saved-answers`

## Status

`candidate`

## Plain-English Summary

Change type: new capability, flag-gated, no tenant enrolled.
Surface: the Moves phase capture strip (`MovesCaptureFlow`), reached through
`MovesPhaseStandaloneClient`.
Release lane: `experimental`.
Feature flag: `moves_capture_phase_rollup_v1` (tenant policy, enrolled-tenant
list EMPTY), conjoined server-side with the redesigned capture flow's own flag.

The redesigned capture flow draws a strip of all six phases above the questions.
Only one phase can be counted on any screen — the one being viewed, whose live
capture values the component holds — so the other five rows state a bare
question count and claim nothing. That correction was right: an earlier rule
inferred that a phase the Move had advanced past must be complete, and so drew a
completion tick beside a phase whose every question was blank.

The cost of it is that a person stepping through the flow sees none of the work
behind them. Closing that was recorded as needing new data — "a persisted
rollup, or six section reads". It does not. The phase route already reads **every**
capture-module row for the Move and then discards all but the viewed phase's, so
the other five phases' saved answers were already in hand.

With the flag on, a row this screen cannot measure now states how many of its
questions hold a **saved answer**, under that word and no other:

- A saved answer is a persisted, non-empty, trimmed value for the section.
- The viewed row's `answered` count is strictly stronger — it additionally
  requires structured validity, evidence readiness, and on Charter a satisfied
  basis — so the saved count is routinely the larger of the two.

Because the two measure different things they are kept on separate fields, under
separate nouns, and never on the same row: the saved count is defined only off
the viewed phase, the answered count only on it. **A saved count never earns the
completion tick.** Only a live measurement does, which is the invariant that
removed the earlier row's claim to be fully answered while blank; a rollup that
fed the tick would reintroduce the same over-claim from the other direction.

The derivation is route-aware. Design is the only phase whose question set
depends on the confirmed solution route (6, 7 or 8 sections), so a route-blind
count would be taken against the wrong question set.

## Layer Impact

Lane: `experimental` — a flag-gated capability with an empty enrolled-tenant
list, so no client surface changes until a tenant is enrolled deliberately.

Layer 4 (Products) only. No canonical model change, no new field or key, no
schema or migration, and **no new read**: the derivation consumes module rows the
route already loads. Layers 1–3 are untouched. Moves still owns no data; this is
a projection of capture state the product already held.

New pure modules and wiring:

- `src/lib/programs/capture-phase-saved-answers.ts` — the per-phase saved-answer
  count, keyed off the canonical capture module key so an unrelated module row
  cannot enter the count.
- `src/lib/programs/capture-phase-progress.ts` — an additive `savedAnswers`
  field beside the existing `answered`; the answered rule itself is byte-identical.
- `MovesCaptureFlow` — the row renders the saved figure under its own noun.
- The phase route resolves the flag and passes the rollup; absent ⇒ pre-flag
  behaviour exactly.

## Client Applicability

Specific clients, selected by feature flag. The enrolled-tenant list for
`moves_capture_phase_rollup_v1` is empty, so today this reaches no client and
every tenant on the redesigned capture flow continues to see the bare question
count on an unmeasured row.

## Changes Included

- `src/lib/programs/capture-phase-saved-answers.ts` (new) — the per-phase
  saved-answer count, keyed off the canonical capture module key, route-aware,
  with the weaker-than-answered distinction recorded at the module.
- `src/lib/programs/capture-phase-progress.ts` — an additive `savedAnswers`
  field and the `capturePhaseSavedAnswers` rule beside the existing
  `capturePhaseAnsweredCount`, which is byte-identical.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — an optional
  `savedAnswers` on the strip row; an unmeasured row with a rollup renders
  `N of M saved` and still no completion tick.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — an optional
  rollup prop, threaded into the strip's progress context.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — the
  flag resolution (conjoined with the capture flow) and the derivation over the
  capture-module rows the route already loads.
- `src/lib/features/registry.ts` — the new flag, empty enrolled-tenant list.
- `src/lib/programs/__tests__/capture-phase-saved-answers.test.ts` (new) —
  17 cases.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — 4 new
  render cases.
- `src/components/strategic-moves/__tests__/capture-phase-progress.test.ts` —
  one existing exact-shape expectation conformed to the additive field.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated for the
  new registry entry (`npm run docs:nexus-manual`), not hand-edited.
- This record.

No canonical field, table, migration or env var is touched. The new suite lives
in a directory a required check exercises wholesale, so the control catalog and
the CI coverage census are both unchanged.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command of any kind
was run during this increment.

## QA / Validation

- `src/lib/programs/__tests__/capture-phase-saved-answers.test.ts` (new,
  17 cases) — **PASS**. Covers the count off the rows in hand, every phase being
  reported, blank/whitespace/non-string values rejected, an unrelated module row
  excluded, no cross-phase credit, the route-aware Design set, the viewed-row
  guard, the clamp, a non-finite count rejected, and the invariant that a fully
  saved phase still reports `answered: null`.
- `MovesCaptureFlow.test.tsx` — 4 cases added, **PASS**: the saved figure renders
  under "saved" and never "answered"; a fully-saved unmeasured row draws no tick;
  no rollup ⇒ the bare question count; the viewed row prefers its live count.
- Whole directories after the change: `src/components/strategic-moves/__tests__`
  + `src/lib/programs/__tests__` — 143 suites / 1491 tests, **PASS**. One
  pre-existing case asserted the progress row's exact shape and was conformed to
  the additive field; its passthrough intent is unchanged.
- `tsc -p tsconfig.json --noEmit` — exit code **0**, **PASS**.
- `eslint` over all changed files — 0 errors, **PASS**. Two warnings in
  `MovesPhaseStandaloneClient.tsx` are pre-existing on the base and untouched here.
- Mutation testing — 6 operative mutations, 6 deaths: the saved figure relabelled
  "answered" (2 red), completion widened to accept a saved count (1 red), the pure
  viewed-row guard removed (3 red), the saved count leaked into `answered` (2 red),
  the trim dropped (1 red), the route dropped from the lookup (1 red). **PASS.**
  One mutation survives and is reported in Known Gaps.
- Signed-in live walk — **NOT RUN**. The flag's enrolled-tenant list is empty, so
  nothing renders for a walk to confirm; the deploy queue was also churning
  during this run. Owed at enablement. This record does not claim `live-proven`.
- Phone-width layout — **NOT RUN**: jsdom does not lay out, and the row's copy
  grows by a few characters on a strip that already carries a longer string.

## Rollout Plan

1. Merge behind the flag with an empty enrolled-tenant list; nothing changes for
   any client.
2. Enable for one synthetic demo tenant and walk the strip signed in: open a
   Move at one phase, read another phase's row, and confirm the figure says
   "saved" and carries no tick.
3. Only then consider a real tenant, and only with the noun reviewed — the
   distinction between saved and answered is the whole safety property here.

## Rollback Plan

Two levers. The flag is the fast one: with the enrolled-tenant list empty the
route passes no rollup and every row renders exactly as it does today, with no
deploy. A full revert is a clean removal — two new files, an additive field, and
one render branch; the answered rule is byte-identical to the base, so reverting
cannot disturb the existing count.

## Known Gaps

- **One mutation survives, by construction.** Dropping the `!measured` conjunct
  from the component's saved-count expression changes nothing a test can see:
  the render's ternary reads that branch only when the row is unmeasured, so the
  conjunct is redundant in the same way the file's existing `measured &&` is. It
  is kept for legibility and annotated as unpinnable rather than quietly
  removed, and the operative guard is pinned in the pure module, where removing
  it fails 3 cases.
- **A saved answer is a weaker fact than an answered question, and the strip now
  shows both kinds of figure.** Stepping from one phase to another therefore
  changes which rule that row's number follows. Each figure states its own noun,
  which is the honest form of this, but whether a surface should ever mix two
  measures is a copy and product decision on a design-locked strip — recorded,
  not resolved.
- **The host's own call site is pinned only for the route dimension.** The flag
  resolution and the rollup pass-through sit in an async server component with
  no suite, so a mis-wired call site would still pass every test here. Same gap
  the sibling basis and notes records state.
- **The count cannot see a phase whose answers live outside the capture
  contract.** A Move that recorded its work before the capture flow existed has
  no module rows under the canonical keys and will read `0 of N saved` — which
  is true of the capture questions and may read as a harsher judgement of the
  Move than is meant.
- Nothing flag-gated in this workstream has been measured at phone width.

## Audit Evidence

- Pure derivation and its 17 cases, both named above; the route-aware case
  derives its expected overlap from the capture contract rather than from a
  hard-coded size, so a future contract change cannot leave it passing while
  covering nothing.
- The mutation table above, each entry verified to have actually applied before
  its result was read — a substitution that silently fails to match reads as a
  survivor and would have reported two false ones here.
- `src/lib/programs/__tests__` is exercised wholesale by a required check, so the
  new suite needs no catalog entry and no census refresh; verified by reading the
  workflow step rather than assumed.
