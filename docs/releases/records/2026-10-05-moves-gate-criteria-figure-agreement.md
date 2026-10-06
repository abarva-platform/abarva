# Gate-criteria figures agree with their own count

## Release ID

`2026-10-05-moves-gate-criteria-figure-agreement`

## Status

Merged pending — opened as a release candidate, squash auto-merge armed.

## Plain-English Summary

Two gate surfaces built a number the reader sees by gluing a count onto a noun
that was typed as a fixed plural:

- the gate ribbon's summary line, and
- the gate approval drawer's summary line,

both of which read `"<n> of <m> criteria met"` with `criteria` hard-coded. For a
gate with a single criterion that renders **"1 of 1 criteria met"** — a figure
that disagrees with the words next to it.

It was also an inconsistency inside the product's own vocabulary. The phase top
stepper already agrees its noun for the very same quantity, so the same gate
could be described as "1 of 1 gate criterion" at the top of a screen and
"1 of 1 criteria met" further down it.

Both lines are now built by one shared helper that agrees the noun with the
count. The plural output is byte-for-byte what it was before, so every
multi-criterion screen and every existing multi-criterion assertion is
unchanged; only the one-item wording differs.

A third helper in the same family — the short criteria chip label — rendered a
**bare** `"<n> of <m>"` with no noun anywhere, the same shape that was corrected
on the phase stepper. It has no product consumer today (only its own suite
references it), so it is corrected here for construction rather than claimed as
a user-visible fix. See Known Gaps.

## Layer Impact

Lane: `global-control-lane` — these two surfaces render with no feature-flag
conjunct at all, so there is no flag to put the change behind. This follows the
precedent of the recent phase-stepper and Originate-screen figure corrections,
which were likewise unflaggable.

Layer 4 (Products) only. No change to intake, adapters, or the canonical model.
No schema change, no migration, no new dataset, no context/corpus object, no
data read or write of any kind. The change is confined to how two already-
computed integers are rendered as a sentence.

## Client Applicability

All clients. The gate ribbon and the gate approval drawer are not flag-gated, so
the corrected wording reaches every workspace that opens a program with a
pending gate. The reachable effect today is nil (see Why this is a construction
fix), which is why this is a low-risk correction rather than a behaviour change.

## Why this is a construction fix, stated precisely

The wrong reading is **not** demonstrated on a live screen, and this record does
not claim it is.

`total === 1` is not reachable from the canonical gate catalog. Every rule in
`GATE_RULES` carries more than one check — 6, 3, 6, 5, 11, 5 by originating
phase, and 3, 2, 6, 3, 5, 4 once hard-scoped — and the live producer maps that
catalog straight through. Both builders take the criteria list off an
already-built detail view, whose fixture and demo paths assemble the array by
hand, and both refuse only an **empty** list. So a one-item list is admitted by
the type and by the guard, but no catalog path produces one today.

The defect is therefore in the construction: two independent copies of the same
template literal, each able to disagree with its own number, on a quantity the
product already words correctly elsewhere. It is fixed on that basis.

## Changes Included

- **New** `src/lib/programs/gate-criteria-figure-labels.ts` — `gateCriterionNoun`,
  `gateCriteriaMetSummary`, `gateCriteriaBadgeLabel`. The module header records
  the reachability argument above so the next reader does not have to redo it.
- `src/lib/programs/gate-ribbon-view.ts` — the summary line and the chip label
  are built by the shared helpers instead of two inline template literals; the
  stale doc comment that documented the nounless chip form is corrected.
- `src/lib/programs/gate-approval-drawer-view.ts` — the summary line is built by
  the same shared helper.
- `src/__tests__/integration/programs/gate-ribbon-view.test.ts` — 11 cases
  added. One pre-existing case asserted the **bare** chip label as a selector
  (`'2 of 5'`) and went red on the fix; it is conformed to `'2 of 5 criteria'`,
  and that red is itself evidence the rendered text really changed.

No new test file, so no CI catalog entry and no test-coverage census change. No
feature flag declared. No change to the nexus manual.

## QA / Validation

- **PASS** — `jest src/__tests__/integration/programs/` (the dir that sweeps both
  builders): 1439 tests, 1427 passed, 12 skipped, 0 failed. Baseline before the
  change was 1437/1425; the delta is the 11 added cases less the conformed one.
- **PASS** — `jest --runTestsByPath` on the two gate suites directly
  (`gate-ribbon-view.test.ts`, `programs-detail-prog21-gate-drawer.test.ts`):
  2 suites, 96 → 107 tests, all passing.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0.
- **PASS** — `eslint` on the four changed files.
- **PASS** — mutation check, 5 of 5 killed, each run against the whole
  integration dir so the size of the hole is measured and not assumed:
  1. restore the fixed plural in the summary — **1** red.
  2. agree the noun to the met count instead of the total ("1 of 5 criterion")
     — **2** red.
  3. chip label drops its noun again — **3** red.
  4. ribbon re-inlines its own template instead of calling the helper —
     **1** red.
  5. drawer re-inlines its own template — **1** red.
- **NOTE on mutations 4 and 5** — these two first **survived** with 0 reds. Every
  fixture carries a multi-criterion gate, for which an inlined template and the
  shared helper produce an identical string, so no case could tell them apart.
  That was a real hole in the guard, not a harmless no-op mutation: the mutation
  reintroduces exactly the defect being fixed. Two cases were added that build a
  one-item view by hand — the one count at which the two forms differ — and both
  mutations then died. The guard was corrected before this record claimed it
  guarded anything.
- **NOT RUN** — no browser verification of this change. The reachable wording is
  identical to today's on every live screen, so there is nothing a signed-in walk
  could observe; a walk would prove a no-op.

## Audit Evidence

- Mutation runs and their red counts are listed above, each measured against the
  1437-test integration dir rather than against the touched suite alone. Taken
  together, mutations 4 and 5 show that ~1426 existing integration tests exercise
  these two builders and none of them noticed the summary line being inlined.
- The conformed pre-existing selector (`'2 of 5'` → `'2 of 5 criteria'`) is the
  in-repo record that a rendered string changed; it is the third time in this
  workstream that a suite was found holding a figure defect in place as a
  selector.
- Reachability was established by counting the checks in every `GATE_RULES`
  entry rather than asserted; the counts are quoted in the record and in the new
  module's header.

## Rollout Plan

Squash-merge to `main` through the ordinary PR path; the repo-owned main deploy
workflow builds the image and shifts Product/Lab traffic. No flag to enrol, no
tenant to enable, no data build, no job run, no manual Azure step. The change is
live for all clients as soon as that deploy's revision takes 100% traffic.

## Rollback Plan

Revert the squash commit. The change is four files, purely presentational, with
no schema, no persisted state, no flag and no migration, so a revert restores
the previous strings exactly and cannot leave anything half-applied. The plural
output is unchanged either way, so a revert is unobservable on any live screen
today.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. No ad-hoc `az containerapp update`, no branch-built image, no manual
revision weighting, and no mutation of the shared web Container App template
was performed or is required by this change. The runtime invariant — template
image digest equal to the 100%-traffic revision digest — is the deploy
workflow's to assert, not this PR's.

## Known Gaps

- **The chip label has no product consumer.** `getGateBadgeLabel` is referenced
  only by its own suite. Its bare, nounless form is corrected so that wiring it
  up later cannot reintroduce a nounless figure, but no user sees either form
  today and this record does not count it as a defect fixed. Whether that chip
  should be rendered at all is a product question, not taken here.
- **The one-item reading is still unreachable from the catalog**, so this fix is
  insurance against a future rule set, a hand-assembled view, or a demo fixture
  with a single check — not a repair of something a client is seeing. If a
  single-criterion gate is never intended to exist, the stronger fix is to make
  the builders refuse a one-item list rather than word it, which would be a
  behaviour change and is deliberately not bundled.
- **A third bare figure of the same shape sits outside this family.** A shared
  quote drawer renders `Gates: <n> of <m> met` with no noun, is consumed, and
  was not touched here because it is not a Moves surface. It is the natural next
  instance of this sweep.
- **The two builders still duplicate their criteria arithmetic.** Only the
  rendering is shared; each still filters and counts its own rows. Unifying the
  arithmetic is a larger refactor across two view models and was not bundled
  with a wording correction.
- **Nothing here was measured at phone width.** These assertions are string
  assertions on pure functions; the agreed noun is one word longer than the
  fixed plural in the singular case, in a strip that already carries a phase
  transition label.
