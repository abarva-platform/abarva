# 2026-10-05-moves-capture-phase-answered-count — Moves: the capture phase strip counts the phase it is describing (flag-gated)

## Release ID

`2026-10-05-moves-capture-phase-answered-count`

## Status

`candidate`

## Plain-English Summary

The redesigned phase capture shows a strip of all six phases, each with an
"N of M answered" count. The host component only ever holds live capture values
for **one** phase — the one on screen — because the section list it counts is
derived from the viewed phase. That single live count was being attributed to
the row for the phase the Move itself sits on, which is a different phase
whenever someone opens any phase other than the current one.

The visible consequence is a count taken from one phase's question set rendered
against another phase's total. Where the viewed phase has more questions than
the Move's current phase, the result is an arithmetically impossible figure: a
phase with seven questions reporting eleven answers. It is wrong in the quieter
direction too — a phase with no answers can read as partly complete, or a
partly-filled phase can read as empty — so the strip could not be trusted as a
progress signal on any screen except the Move's own current phase.

This increment moves that attribution into one small pure module and gives the
live count to the phase being viewed. Phases the Move has already advanced past
read as complete; phases it has not reached read as zero; the phase on screen
reads its measured count, which deliberately wins over "already passed" so that
reopening an earlier phase shows what it holds now rather than a completeness a
later edit may have removed.

No capture field, key, save, gate or evidence behaviour changes. This is a
correctness fix inside an already-flagged surface and introduces **no new
flag**: the strip renders only behind `moves_capture_v2` (and, for P0,
`moves_capture_p0_v1`). Those flags' `includeTenants` lists are non-empty — one
synthetic demo tenant is enrolled for signed-in review — so the wrong figure is
reachable today for that tenant and the fix is reachable there too. Every other
tenant has the flags off and renders the legacy canvas, which is untouched.

## Layer Impact

Lane: `experimental` — a flag-gated, non-default capability. The corrected
strip renders only where `moves_capture_v2` is enabled; everywhere else the
legacy contract-steps canvas renders exactly as before.

Layer 4 (Products · Moves) only. This is presentation arithmetic over state the
component already holds. No change to layer 1 client intake, layer 2 source
adapters or layer 3 canonical model: no new canonical field, table, key, query,
migration, write path or API surface. Nothing is persisted, and no number this
touches is a governed fact — the counts are question-completion tallies owned by
the capture contract, not spend, value, ROI or risk metrics.

## Client Applicability

Specific clients, selected by feature flag: this reaches only tenants with
`moves_capture_v2` enabled. That list is non-empty — one synthetic demo tenant
is enrolled for signed-in review — so the change is received by that tenant and
by no one else. For it, the phase strip stops reporting another phase's count.
All other clients keep the legacy canvas, which never rendered this strip. No
real client engagement is affected, and no tenant data is read, written or
migrated.

## Changes Included

- `src/lib/programs/capture-phase-progress.ts` (new) — the whole decision as two
  pure functions: the per-row count and the map over the strip. Three ordered
  rules, each documented with why it is in that position. Extracted rather than
  fixed inline because the host component has no suite of its own and the strip
  is only reachable behind the capture flags.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the strip is
  built through `capturePhaseProgress`, which is handed the viewed phase, the
  Move's current phase and the live count explicitly, so the two phases can no
  longer be confused by position. Net effect on the file is one import and one
  rewritten block; every other row field is passed through unchanged.
- `src/components/strategic-moves/__tests__/capture-phase-progress.test.ts`
  (new) — 6 cases: the exact defect (a viewed phase's count must not land on the
  current phase's row), an exhaustive sweep asserting no row ever reports more
  answers than its own total across all 36 viewed/current combinations, the
  passed-phase and unreached-phase rules, the ordering rule, and that non-count
  row fields survive the map.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite registered
  by exact path in the required check, alongside the sibling slice's path rather
  than in place of it.
- The two phase-strip figures are now fixed by one expression each and compose
  cleanly: the row's `total` is derived by the sibling route-aware total helper
  that landed first, and its `answered` by this slice's attribution. That
  ordering matters — the sweep case asserting no row exceeds its own total is
  only meaningful once the total itself is the phase's own.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `jest` (`capture-phase-progress`) — **PASS**: 6/6.
- Whole `src/components/strategic-moves/__tests__` directory — **PASS**: 32
  suites / 370 tests, re-run after the rebase so the figure describes the base
  this ships on rather than an earlier one. Run in full rather than as the
  related subset because the change edits a shared host: the siblings' suites
  that render through the same component are the actual evidence that nothing
  else moved.
- Mutation check on the new guards — **PASS** (both mutations killed):
  restoring the original attribution failed 2 cases; keeping the correct
  attribution but letting "already passed" win over "on screen" failed 1. Run
  before claiming the cases guard anything. Note the clamp in the module is a
  floor/ceiling of last resort and is deliberately not what makes the first
  mutation die — a clamp alone would turn the impossible figure into a
  believable but still-wrong one.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit code 0, whole project.
- `eslint` on all changed files — **PASS**: 0 errors. The 3 unused-var warnings
  reported in `MovesPhaseStandaloneClient.tsx` are pre-existing in untouched
  regions — verified byte-identical against the same file at the merge base.
- Suite registration proved by the census delta — **PASS**: `coveredTestFiles`
  2525 → 2526 and `testFiles` 2689 → 2690, with `uncoveredTestFiles` unchanged
  at 164. Regenerated after the rebase, not before: the rebase had silently
  dropped the earlier census update from the net delta because the figure it
  carried happened to equal the new base's committed figure, which leaves no
  textual diff and so no registration proof. The script's own
  `census drift: committed census matches this run` line is printed on a
  successful write too and does not report the delta.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**: all
  gates.
- Signed-in visual walk of the defect — **PASS**, performed against the live
  deployed revision before this fix was written. On `app.abarva.ai`, signed in,
  for the enrolled synthetic demo tenant: the P0 Originate screen of a Move
  sitting at P1 Charter rendered the strip as `P0 · 11 of 11 answered` beside
  `P1 Charter · 11 of 7 answered`. The same Move's P1 screen rendered
  `P1 Charter · 0 of 7 answered`, which is the correct figure and is what
  identifies the borrowed count rather than a bad P1 total. The walk was
  read-only; no capture field, basis, gate or approval was exercised, and
  nothing was written.
- Signed-in visual walk of the **fix** — **NOT RUN**: this increment performs no
  deploy, so the corrected strip is not yet on any runtime. It is owed against
  the first deployed ACA revision that carries this commit, and nothing here is
  claimed live-proven.
- Phone-width layout — **NOT RUN**: jsdom does not lay out. This change alters
  the digits inside an existing row and adds no element, so it introduces no new
  layout risk, but the strip remains unmeasured at phone width like the rest of
  the capture flow.

## Rollout Plan

Merge to `main` via squash PR. Nothing changes at runtime on merge itself; the
change reaches a runtime only with the next ACA web image built and deployed by
the repo-owned main deploy workflow. On reaching a runtime it takes effect
immediately for tenants already enrolled on `moves_capture_v2` — there is no
separate enablement step, because this corrects a surface those tenants already
see rather than adding one.

## Rollback Plan

Revert the squash commit. The module is new and has exactly one caller, so the
revert restores the previous arithmetic exactly and touches nothing else.
Alternatively, removing a tenant from `moves_capture_v2` returns it to the
legacy canvas, which never rendered this strip.

## Deployment Authority

None exercised. This increment runs no `az` command, shifts no traffic, changes
no Container App template, image, revision weight, env var, flag registry entry
or secret, and performs no deploy. Shared Product/Lab web traffic is moved only
by the repo-owned ACA main deploy workflow. The signed-in walk recorded above
was read-only against the existing live revision and changed no runtime state.

## Known Gaps

- **The corrected strip is unwalked.** The defect was walked live; the fix has
  not been, because it is not deployed. Owed against the first deployed revision
  carrying it.
- **The host's own call site is still untested.** The decision is now pinned by
  a suite, but the wiring that feeds it — that the viewed phase, the Move's
  current phase and the live count arrive in the right arguments — is asserted
  only by `tsc` and by the sibling suites that render the component. The three
  arguments are now named at the call site, which makes a future transposition
  visible to a reader, but not to a test.
- **Only the strip was audited for this class of mistake.** The same component
  holds other per-phase figures derived from the viewed phase's state. This
  increment did not sweep them for the same viewed-versus-current confusion; a
  deliberate audit of that whole class is a separate piece of work.
- **The clamp can still mask a future caller's error.** It bounds the rendered
  figure to the row's own total, so a later regression in attribution would
  produce a wrong-but-plausible count rather than an obviously impossible one.
  The exhaustive sweep case exists to catch that in CI instead, but only for
  callers that go through this module.

## Audit Evidence

- New pure module and its suite, listed under Changes Included.
- Suite registered by exact path in the required check workflow; registration
  proved by the census delta quoted under QA.
- Mutation-check results quoted under QA, with the specific mutation and the
  number of cases each killed.
- Signed-in walk evidence quoted under QA as the literal strings rendered by the
  live surface for both screens of the same Move.
