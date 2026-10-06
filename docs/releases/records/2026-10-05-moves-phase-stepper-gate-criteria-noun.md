# 2026-10-05-moves-phase-stepper-gate-criteria-noun — Moves: the phase stepper states what its figure counts

## Release ID

`2026-10-05-moves-phase-stepper-gate-criteria-noun`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace shows two six-phase strips within about 200 pixels of
each other. The top stepper counts **gate criteria**. The capture strip below it
counts **capture questions**, and says so on every row — "11 questions", "0 of 7
answered". The top stepper said nothing at all: it rendered a bare "3 of 3",
with no noun in the visible label and none in the tooltip either.

Nothing on the screen told a reader which measure was which. On a live signed-in
walk this produced a screen where the stepper showed a green tick and "3 of 3"
for Originate while the capture strip, directly beneath it, reported the same
phase as "11 questions" with no claim of completeness. Both figures were correct
under their own definition and the pair read as a contradiction.

This change gives the stepper's figure its noun: "3 of 3 gate criteria". The
numbers, the links, the tick, the reachability rules and the styling are all
unchanged — only the words beside the figure are new.

The noun agrees with the count: a phase whose hard-scoped rule set is a single
criterion reads "1 of 1 gate criterion", not "1 of 1 gate criteria". A count
joined to a hard-coded plural noun is a defect this workstream has already hit
on another surface, and it is not reintroduced here.

## Layer Impact

Lane: `global-control-lane` — this corrects copy on a surface that renders for
every tenant that can open a Move phase workspace. It is not feature-gated,
because the surface it corrects is not feature-gated.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched, and no new flag is declared. The counts themselves are read from the
existing `getMovePhaseTallies` projection exactly as before; only the string
rendered beside them changes. No product gains or loses ownership of data.

## Client Applicability

All clients. The top phase stepper is not behind a feature flag, so every tenant
that can open a Move phase workspace sees this wording. No real client
engagement exists on this surface. Tenants are resolved from code, not from any
list in this record.

## Changes Included

- `src/lib/programs/phase-stepper-state-label.ts` (new) —
  `phaseStepperStateLabel(tally, state)` returns the label rendered under a
  phase name, stating what the figure counts; `gateCriteriaNoun(total)` agrees
  the noun with the count. The no-tally fallback to a state word is preserved
  and is documented as defensive: it is unreachable from the product today,
  because `getMovePhaseTallies` emits a row for every phase the stepper walks.
  It is therefore **not** claimed as a defect fixed by this change.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` —
  `MovePhaseTopStepper` calls the module instead of building a bare
  `${met} of ${total}` inline. One import, one call site. The same label feeds
  both the visible element and the `title` tooltip, as before.
- `src/components/strategic-moves/__tests__/phase-stepper-state-label.test.ts`
  (new) — 7 cases over the pure module.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 2 host cases pinning that every stepper step's figure carries the noun in
  both the visible label and the tooltip, and that a single-criterion phase
  reads the singular. One pre-existing case selected a step by its old bare
  title and was conformed to the new wording; it asserts link behaviour, not
  copy.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite registered
  by exact path.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__` — **PASS**, 34 suites /
  409 tests.
- `npx tsc -p tsconfig.json --noEmit` — **PASS** (exit 0).
- `npx eslint` on the four changed source files — **PASS**, 0 errors. Three
  pre-existing unused-variable warnings in the host component are untouched by
  this change.
- Mutation checks against the whole suite directory, 2 of 2 killed:
  - dropping the noun (`${met} of ${total}`) — **8 of 409 red**.
  - returning a fixed plural from `gateCriteriaNoun` — **3 of 409 red**.
    The size of the hole is the complement: before this slice, 401 tests rendered
    this component and the only assertion touching the stepper's figure pinned the
    bare form as correct.
- Live signed-in read-only walk on the deployed revision carrying the previous
  capture-strip fix — **PASS** as the source of this defect. The stepper read
  "Originate / 3 of 3" with a tick while the capture strip read "P0 Originate /
  11 questions" on the same screen.
- Signed-in walk of **this** change — **NOT RUN**. It requires the deploy that
  carries this commit.

## Rollout Plan

Merge to `main` with squash auto-merge. The repo-owned ACA main deploy workflow
builds and ships it on merge. No flag to enroll, no data build, no migration,
no job run. The change is live for every tenant as soon as that deploy takes
100% traffic.

## Rollback Plan

Revert the single commit. The module is new and has exactly one call site, so
the revert restores the previous inline expression with no other effect. No
data is written by this path and nothing persisted depends on the label, so a
rollback needs no backfill or repair.

## Deployment Authority

Only the repo-owned ACA main deploy workflow shifts shared Product/Lab web
traffic. No ad-hoc `az containerapp` command, no branch workflow and no local
build was used or is required for this change. The runtime image stays
digest-pinned by that workflow.

## Known Gaps

- The signed-in walk of this change is owed once a deploy carries it.
- The stepper credits a phase the Move has advanced past with `met === total`,
  inferred rather than measured — `getMovePhaseTallies` argues the Move could
  not have advanced otherwise. That inference is sounder than the one removed
  from the capture strip, because gate criteria genuinely do gate advancement,
  but it is still an inference and it is the reason the tick appears beside a
  phase whose capture answers are all blank. Naming the measure is this
  change's whole scope; whether the stepper should additionally distinguish a
  measured pass from an inferred one is a separate question and is not taken
  here.
- The no-tally fallback branch is unreachable from the product and is retained
  only for a caller that passes a short `phaseTallies` list.
- Nothing on this surface has been measured at phone width; jsdom does not lay
  out, and the two strips sit closest together on a narrow viewport.

## Audit Evidence

- Suite run, type check, lint run and both mutation runs recorded above, each
  with its own count.
- Census registration proof: `coveredTestFiles` 2528 → 2529 with
  `uncoveredTestFiles` unchanged at 164, measured by regenerating on the base
  with the new suite moved aside and again with it in place.
- `npm run release:check -- --base origin/main --head HEAD` run locally before
  push.
