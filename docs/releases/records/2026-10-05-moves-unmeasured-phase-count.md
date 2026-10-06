# 2026-10-05-moves-unmeasured-phase-count — Moves: the capture phase strip stops claiming a phase it never measured

## Release ID

`2026-10-05-moves-unmeasured-phase-count`

## Status

`candidate`

## Plain-English Summary

Change type: defect fix, client-visible, inside an already-enrolled capability.
Surface: the Moves phase capture strip (`MovesCaptureFlow`), reached through
`MovesPhaseStandaloneClient`.

The redesigned capture flow draws a six-phase strip, each row reading
`N of M answered`, with a completion tick when `N === M`. The host holds live
capture values for exactly one phase — the one on screen. For every other row
the previous rule inferred a count: _a phase the Move has advanced past must be
complete_, so the row was filled with its own total and ticked.

That inference is unsound. A Move can advance for reasons that never touch the
structured capture questions — it was originated before the capture flow
existed, or its gate was approved from evidence held elsewhere — and the
questions are then still blank. The strip reported those phases fully answered
anyway.

A row is now either **measured** (it is the phase on screen) or **unmeasured**.
`capturePhaseAnsweredCount` returns `null` for an unmeasured row, and the strip
renders the question count alone (`11 questions`) with no tick and no
`answered` claim. The measured row is unchanged, including its clamp.

## Layer Impact

Lane: `global-control-lane` — this corrects a client-visible figure on a
capability already enrolled for one synthetic demo tenant, so it is not
feature-gated behind anything new.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched, and no new flag is declared. The change is confined to how one Layer 4
projection describes capture state it does not hold; the capture state itself is
read and written exactly as before. No product gains or loses ownership of data.

## Client Applicability

Specific clients, selected by feature flag. The strip renders only behind the
existing capture-flow flag, whose tenant list is non-empty — one synthetic demo
tenant. No real client engagement exists on this surface. Tenants are resolved
from code, not from any list in this record.

## Why this is the honest direction

The corrected reading is _less_ informative than the one it replaces: a phase
that genuinely is complete, but is not on screen, now shows a question count
instead of a tick. That is deliberate. There is no data source on this screen
from which completeness could be measured, and this product treats a claim of
coverage that was never measured as the more serious error of the two. It is
the same rule the charter-basis work applies to an assumption: it may be
recorded, it may not be rendered as covered.

## Changes Included

- `src/lib/programs/capture-phase-progress.ts` — `capturePhaseAnsweredCount`
  returns `number | null`; the `passed ⇒ complete` inference is removed and the
  reason it was unsound is recorded at the function.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — the strip's
  `answered` prop widens to `number | null`; an unmeasured row renders its
  question count and no completion tick.
- `src/components/strategic-moves/__tests__/capture-phase-progress.test.ts` —
  7 cases, including the live walk's one-row-two-screens diagnosis.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` —
  2 new cases for the unmeasured render and its vacuity guard.
- This record.

No flag is declared or changed. No canonical field, table, migration, env var
or registry entry is touched, so neither generated artifact
(`NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md`, `test-ci-coverage-census.json`)
changes: both suites were already registered in the control catalog.

## QA / Validation

- **PASS** — `capture-phase-progress.test.ts`, 7 cases. Includes the live
  walk's own diagnosis as a case: one row asked from three different screens
  returns the same answer, and only that phase's own screen states a count.
- **PASS** — `MovesCaptureFlow.test.tsx`, 9 cases (2 new). An unmeasured row
  renders `11 questions`, contains no `answered` text, and exposes no
  `complete` label; a vacuity-guard case confirms a measured complete row keeps
  both count and tick.
- **PASS** — whole directory `src/components/strategic-moves/__tests__`,
  32 suites / 384 tests, 17s. Run in full rather than as a subset because the
  changed prop type is consumed by a component other suites render.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0, no output. The
  `answered` prop widened to `number | null`, so every consumer was typechecked.
- **PASS** — `eslint` on all four changed files, no findings.
- **Mutation testing — 2 killed, 1 diagnosed as a false survivor.**
  - Restoring the `passed ⇒ complete` inference fails 5 of 384.
  - Rendering `N of M answered` unconditionally fails 1 of 384.
  - Dropping the `measured &&` conjunct from the completion tick fails **0**.
    Diagnosed, not left as a gap: `null === p.total` is already false for every
    total, so the conjunct is redundant by type and no case can distinguish its
    removal. The equality is what earns the tick. The code comment now says so
    rather than claiming a guard the suite does not have.
- **NOT RUN** — phone-width layout. jsdom does not lay out, and the strip's
  row text changes length; unmeasured rows are shorter than the string they
  replace, so the change does not widen the strip.
- **NOT RUN** — signed-in walk of this fix. It needs the deploy that carries
  it; the walk that _found_ the defect is recorded below.

## Audit Evidence

Found by a read-only signed-in walk of `app.abarva.ai` against the ACA
revision carrying the two prior strip fixes, with the runtime invariant
verified (Container App template image digest identical to the 100%-traffic
revision's, revision Healthy/Running).

The two-screen pair is the evidence. On one Move's P0 screen the Originate row
read `0 of 11 answered`, and every one of that phase's eleven questions was
visibly blank. On the same Move's P1 screen the same Originate row read
`11 of 11 answered` with a completion tick. The row changed value with the
observer, which is what identifies a figure that was inferred rather than
measured; the blank questions are what identify which of the two readings was
false. Both readings were stable across an 18-second settle, so neither is a
hydration race.

No suite caught this. The two earlier fixes to this same strip did not either:
they corrected which row received the measured count and how each row's total
is derived, and both left the inference for unmeasured rows in place.

## Rollout Plan

Merges to `main`; the repo-owned ACA main deploy workflow builds and deploys it
on merge. No flag change, no env change, no registry change, no data build, no
migration. Nothing to enable after deploy.

## Rollback Plan

Revert the commit. The change is four files, three of them test or pure-module,
and it adds no state, no persisted field and no flag, so a revert restores the
previous rendering exactly and cannot leave data behind.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. The Azure reads performed
during the walk were read-only (`containerapp show`, `revision show`).

## Known Gaps

- **An unmeasured row cannot become measured on this screen.** Making the strip
  state a true count for all six phases needs a per-phase answered summary the
  host does not fetch — a persisted rollup, or six section reads. That is a
  data slice, deliberately not bundled with this correction.
- **The completion tick is now reachable for one row only** — the phase on
  screen. A person stepping through the flow therefore never sees a filled-in
  journey of ticks behind them. Honest, but a weaker sense of progress than the
  design canvas implies; whether the strip should carry a measured rollup is a
  product decision, recorded here rather than resolved.
- The redundant `measured &&` conjunct is kept for legibility and is pinned by
  no test, by construction (see QA).
- `getInitialFinderSectionKey` remains route-blind. Still benign: all three P3
  variants share their first section.
