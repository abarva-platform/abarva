# The explanation drawer's gate figures name the set each one counts

## Release ID

`2026-10-05-explain-drawer-gate-figures`

## Status

Merged pending — opened as a release candidate, squash auto-merge armed.

## Plain-English Summary

The explanation drawer — the panel that opens behind a synthesis quote and shows
the reasoning trace — rendered **two** gate figures, both bare numbers, both
under the same word "Gates":

- a headline reading `Gates: 2 of 5 met`, and
- a section count next to the heading "Gates" reading just `23`.

Neither said what it counted, and the two counted **different sets**. The
headline's total is the criterion count for the instance's _current stage_. The
section count is every criterion the surface carried into the trace, grouped by
stage: on two of the three surfaces that is _all_ stages, and on the third it is
only the _blocked_ subset. So the same reader saw two numbers that read as one
quantity shown twice, and could not tell from the screen that `5` and `23`
describe different things — or which of them was the gate they were about to be
asked to approve.

Both figures now say what they count — but only one of them is still this
change's work, and that is a correction to what this record first claimed.

While this change waited, `buildGateSummaryLine` landed on `main` and does
strictly more for the headline than the helper written here did: it names the
noun, handles a zero total, counts only strictly-met criteria as met, and names
partial and waived so every clause reconciles to the total. Keeping both would
have left two spellings of one figure, which is the defect this change is about.
So the local headline helper is **deleted** and the host calls main's. What this
change still contributes is the list figure, which main does not address.

- headline: `2 of 5 gate criteria met · 3 unmet` — **main's**
  `buildGateSummaryLine`, consumed here.
- list: `6 criteria · 2 stages` — this change.

Naming the stage span is the part that matters: it is what stops the list's count
from reading as the headline's current-stage total.

## Layer Impact

Lane: `global-control-lane` — this drawer carries no feature-flag conjunct at
all, so there is no flag to put the change behind. Same situation as the recent
gate-ribbon, phase-stepper and Originate figure corrections, which were likewise
unflaggable.

Layer 4 (Products) only. No change to intake, adapters, or the canonical model.
No schema change, no migration, no new dataset, no context/corpus object, no
read or write of tenant data. The change is confined to how already-computed
integers are turned into a sentence.

## Client Applicability

All clients. The drawer mounts on three live surfaces through the explain pill —
the programs synthesis quote, the source synthesis quote and the tower synthesis
quote — none of them flag-gated, so the corrected figures reach every workspace
where a synthesis quote finishes streaming.

## Reachability, stated precisely

Unlike the gate-ribbon correction that preceded it, this one has a **reachable
singular**: the programs shape-only fallback context — the path taken for an
instance whose pattern id is absent from the lifecycle pattern map — hard-codes a
total of one. That path rendered `Gates: 1 of 1 met` / `Gates: 0 of 1 met`, and
now renders `1 of 1 criterion met`.

The set mismatch is reachable on every surface by construction, because the two
figures are assembled from different inputs in the API route:

- source and programs flat-map **all** stages' evaluations into the trace rows
  while the headline total counts the current stage only, so the list count is
  normally **larger** than the headline total;
- tower maps only `gatesSummary.blocked` into the rows, so the list count is
  normally **smaller**.

This is therefore a wrong reading available on a live screen, not only a defect
of construction. It was found by reading the component, not by a walk; see QA.

## Changes Included

- **New** `src/lib/reasoning/explanation-gate-figures.ts` —
  `explanationGateRowsLabel`. The module header records the two-sets argument
  above, and now also records why the headline half is no longer here, so the
  next reader does not reintroduce a second spelling of that figure.
- `src/components/_shared/ExplainQuoteDrawer.tsx` — the summary bar and the gates
  section header consume the helpers. `SectionHeader` gains an optional derived
  `countLabel` alongside its plain numeric `count`; the other four sections keep
  their plain counts, which are honest (each counts exactly the rows it lists).
- **New** `src/__tests__/integration/reasoning/explanation-gate-figures.test.tsx`
  — 12 cases. Seven pin the two pure helpers; five render the real drawer with a
  stubbed explain response, because a figure is only wrong where it is read.

The new suite lives under `src/__tests__/integration/`, which `test:integration`
sweeps by directory, so there is **no CI catalog entry** to add and **no
test-coverage census change**. No feature flag declared, so no nexus manual
regeneration.

## QA / Validation

- **PASS** — `jest src/__tests__/integration/reasoning`: 1 suite, 12 tests, 0
  failed.
- **PASS** — `jest src/__tests__/integration/programs src/__tests__/integration/reasoning`
  (the dir that sweeps the shared figure module this one reuses, plus the new
  suite): 67 suites, 1517 tests, 1497 passed, 20 skipped, 0 failed. The one
  skipped suite is skipped on `main` too and is unrelated to this change.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0 read from `$?` rather
  than from a piped tail.
- **PASS** — `eslint` on the three changed files, exit code 0.
- **PASS** — mutation check, 5 of 5 killed on the original base, each run
  against the whole new suite:
  1. the headline reverts to the bare pre-fix template — **5** red.
  2. the stage count includes groups that carry no rows — **1** red.
  3. the list's noun agrees with the stage count instead of the row count —
     **1** red.
  4. the host re-inlines the bare headline instead of calling the helper —
     **2** red.
  5. `SectionHeader` ignores the derived label and falls back to the plain count
     — **1** red.
- **Re-scoped after merging `origin/main`.** Mutations 1 and 4 were about the
  local headline helper, which is now deleted in favour of main's, so they no
  longer describe this change. Their subject is covered by main's own
  `gate-summary-line.test.ts` plus one host case kept here as a wiring proof:
  the drawer must render the shared line rather than a bare count. Mutations 2,
  3 and 5 are unaffected — they are the list figure, which is what remains. The
  suite was re-run on the merged base: **PASS**, with the companion
  `gate-summary-line.test.ts` — 2 suites, 20 tests.
- **NOT RUN** — no signed-in walk of this change. The drawer opens behind a
  synthesis quote that has to finish streaming on one of three surfaces, which
  this run did not reach; the fix is owed a walk once it deploys. Recorded as a
  gap rather than claimed.

## Audit Evidence

- The two-sets claim is read off the API route, not inferred: the source and
  programs branches build trace rows with `allStages.flatMap(s => s.gateEvaluations)`
  while the tower branch builds them from `gatesSummary.blocked`, and all three
  carry a headline total taken from the current stage's evaluation count in the
  context builders.
- Mutation 1's red count (5 of 12) is the measure of how much of the new suite
  depends on the headline's wording rather than on its numbers; mutation 4's
  2 reds are the two host cases, which is the evidence the component really
  consumes the helper and not a copy of it.
- The singular's reachability is quoted from the shape-only fallback's
  hard-coded total rather than asserted, and the record says plainly that the
  set mismatch — not the singular — is the reading a client can hit today.

## Rollout Plan

Squash-merge to `main` through the ordinary PR path; the repo-owned main deploy
workflow builds the image and shifts Product/Lab traffic. No flag to enrol, no
tenant to enable, no data build, no job run, no manual Azure step. The change is
live for all clients as soon as that deploy's revision takes 100% traffic.

## Rollback Plan

Revert the squash commit. Three files, purely presentational, with no schema, no
persisted state, no flag and no migration, so a revert restores the previous
strings exactly and cannot leave anything half-applied. The only behaviour a
revert restores is the two bare figures.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. No ad-hoc `az containerapp update`, no branch-built image, no manual
revision weighting, and no mutation of the shared web Container App template was
performed or is required by this change. The runtime invariant — template image
digest equal to the 100%-traffic revision digest — is the deploy workflow's to
assert, not this PR's.

## Known Gaps

- **No walk.** The corrected figures have not been read on a live screen. They
  are the first of this figure sweep's fixes to carry a reachable wrong reading
  rather than a construction-only one, which makes the walk worth more here than
  it was for the ribbon; it is owed once this deploys.
- **The headline and the list still disagree numerically, and that is now
  visible rather than fixed.** This change makes each figure say what it counts;
  it does not make the drawer show the current stage's criteria and the trace's
  criteria as one reconciled set. Whether the trace should list the stage the
  headline summarises — or the headline should summarise every stage listed — is
  a product question about what the drawer is for, and is deliberately not taken
  inside a figure correction.
- **The tower surface's rows are the blocked subset only**, so a reader who
  expects the list to enumerate met criteria as well will not find them. That is
  upstream of this change, in how the tower branch assembles trace rows, and is
  untouched.
- **A fourth bare figure of this family sits in a model prompt**, not a screen:
  the programs synthesis route composes `<n> of <m> gate criteria met` as an
  input sentence. It is not user-visible text and was not touched; if it is ever
  surfaced it should take the shared helper.
- **Nothing here was measured at phone width.** The assertions are string and
  text-node assertions; the corrected list label is longer than a bare integer in
  a 10px mono chip that sits opposite a section title.
