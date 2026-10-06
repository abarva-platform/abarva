# 2026-10-05-moves-originate-figures-say-what-they-count — Moves: every figure on the Originate screen says what it counts

## Release ID

`2026-10-05-moves-originate-figures-say-what-they-count`

## Status

`candidate`

## Plain-English Summary

Change type: defect fix, client-visible, on a surface that is not feature-gated.
Surface: the P0 Originate screen (`StrategicMoveOriginateClient`) — its phase
rail, its promote bar and its discard dialog.

Three figures on this one screen each broke a different rule about what a
figure may claim.

1. **The phase rail invented five of its six figures.** The rail draws a
   six-phase column, each row reading a bare `N of M` with no noun. Only the
   P0 row was measured — it counts captured P0 brief answers against the active
   scaffold size. The P1–P5 rows were **hard-coded literals** in the component:
   `0 of 5`, `0 of 5`, `0 of 4`, `0 of 4`, `0 of 4`. Those numbers match no
   capture contract and no gate contract; the real P1 capture section count is
   7, and P3's is route-dependent. Five invented figures sat in the same column,
   in the same format, as one real one, and nothing on screen distinguished
   them.
2. **The promote bar's noun was a fixed plural.** `N of M answers captured`
   reads "1 of 1 answers captured" whenever the active scaffold holds a single
   required answer.
3. **The discard dialog's two sides counted different sets.** Its numerator
   counted *every* field in the brief record (17 keys), while its denominator
   counted only the *required* ones (10 with the extended-intake prop off). Two
   numerators over one denominator, measuring different sets — a figure that is
   not bounded by its own total by construction.

The fix applies the rule this workstream has been applying to inferred figures:
a row nothing measured claims nothing, and a figure states the noun it counts
with that noun agreed to the quantity. The P1–P5 rows now read `Not started`
and carry no number at all; the P0 row reads `3 of 10 answers`; the promote bar
agrees its noun to the denominator; and the discard dialog carries one figure,
both sides of it over the required scaffold.

There is no honest total to fall back to for P1–P5, unlike the earlier
unmeasured-row fix where the row's own question total was real. Here the
number itself was invented, so nothing is rendered in its place.

## Layer Impact

Lane: `global-control-lane` — this corrects client-visible figures on a surface
that is rendered unconditionally, with no feature flag to gate it behind.

Layer 4 (Products) only. No canonical object, field, table, key or migration is
touched. No new feature flag is declared, and no existing flag's resolution
changes. The P0 brief is read and written exactly as before; only the labels
describing it change. No product gains or loses ownership of data.

## Client Applicability

All clients. The Originate screen's rail, promote bar and discard dialog are
not feature-gated, so every tenant reaching P0 origination sees the corrected
figures. No real client engagement exists on this surface. Tenants are resolved
from code, not from any list in this record.

## Why this is the honest direction

The corrected rail is less informative than the one it replaces: a reader used
to see a figure beside every phase and now sees one beside P0 only. That
figure was fabricated. The P0 Originate screen holds the P0 brief and no
capture state, gate state or evidence for any later phase, so there is nothing
it could truthfully say about P1–P5 — and a believable wrong number is worse
than a stated absence. Clamping or re-deriving the later rows was not an option
either: there is no source on this screen to derive them from.

The discard dialog loses its parenthetical second figure. Both numbers were
rendered over the same denominator while counting different sets, so the
parenthetical could only ever agree with the leading figure by coincidence.
One figure over one set is the claim the screen can actually support.

## Changes Included

- **New** `src/components/strategic-moves/originate-figure-labels.ts` — the
  pure decision: `agreeNoun`, `buildOriginateRailRows` (emits `measured: null`
  for every phase after P0 so no invented total can reach the screen),
  `formatOriginateRailTally`, `formatAnswersCaptured`,
  `formatOriginateDiscardProgress`.
- **Changed** `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
  — the hard-coded `PhaseTallyRow[]` literal is replaced by one call to
  `buildOriginateRailRows`; the rail's row type becomes `OriginateRailRow`; the
  three render sites call the three formatters. The now-unused
  `PhaseTallyRow` import is dropped.
- **Changed**
  `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`
  — 8 new cases (6 pure, 2 at the host call site). One pre-existing case is
  conformed: it asserted `getByText("0 of 10")`, the bare figure the fix
  replaces, so it used the defect as a selector.

No new test file, so no CI catalog entry and no test-coverage census change.

## QA / Validation

- **PASS** — `npx jest src/components/strategic-moves/__tests__` (the whole
  directory, which is the preservation evidence for a host change): **33 suites
  / 412 tests**, 17s. Run after the final edit.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit`, exit code 0.
- **PASS** — `npx eslint` on both changed product files and the suite: clean.
- **PASS** — mutation check, 5 mutations / 5 deaths against the Originate suite
  (20 cases): restore the invented later-phase totals (3 red); drop noun
  agreement (4 red); rail tally drops its noun (4 red); discard sentence counts
  a different set on each side (1 red); host bypasses the module and renders the
  raw figure (3 red).
- **PASS** — hole sizing: the host mutation run against the **whole directory**
  failed **3 of 412**, every failure a new case. So 409 tests exercised this
  component and none noticed the rail's figures.
- **NOT RUN** — signed-in walk of this change. It needs the deploy that carries
  it; the walk is owed and is recorded as a gap, not claimed.
- **NOT RUN** — phone-width measurement. jsdom does not lay out, and the rail
  is the narrowest column on this screen.

## Audit Evidence

- The invented literals are visible in the pre-change component as
  `{ phase: 1, label: "P1 Charter", met: 0, total: 5, state: "upcoming" }` and
  four siblings; the post-change source contains no such number.
- The conformed pre-existing assertion is itself evidence the rendered text
  changed: a selector written against the bare `0 of 10` goes red on the fix.
- The vacuity guard on the P0 row asserts the two scaffold sizes differ (10 with
  the extended-intake prop off, 17 with it on), so a figure pinned to one of
  them cannot be a constant.
- Mutation output is reproducible by the five patches named in QA; each was
  applied to a copy, run, and reverted.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys the merge commit; no manual Azure step is part of this rollout. The
change is label-only on a surface with no flag, so it takes effect for every
tenant on the deploy that carries it.

## Rollback Plan

Revert the squash commit. The change adds one module and rewires three render
sites within one component; reverting restores the previous labels exactly,
including the invented rail totals. No data is written, migrated or backfilled,
so a revert needs no data step.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This record authorizes no ad-hoc Azure command, no revision weight
change and no web Container App template mutation. No Azure command was run
for this slice.

## Known Gaps

- **The signed-in walk of this change is owed** — it needs the deploy that
  carries it. The rail is the surface with user-visible consequence: five
  figures a reader used to see are gone.
- **The promote bar's host call site is unpinned.** The bar renders on the
  approve-build step only, which this suite does not reach without a multi-step
  interaction; its noun agreement is pinned in the pure module, its one-line
  host call is not. The same is true of the discard dialog, which needs a
  non-empty brief before it opens.
- **Whether the discard dialog's old numerator could exceed its denominator in
  practice was not established.** With the extended-intake prop off, the only
  write paths found write base scaffold fields only, so the extra seven keys may
  never be populated on that path. The mismatch is a construction defect either
  way — the two sides counted different sets — and is recorded as fixed on that
  basis, not on a demonstrated wrong reading.
- **Nothing on this screen has been measured at phone width.** The rail is the
  narrowest column, and `Not started` is a longer string than `0 of 5`.
- The rail says `Not started` for every later phase, including phases a Move
  could in principle have real state for if this screen ever read it. Whether
  the Originate screen should fetch later-phase capture state to fill those rows
  honestly is a product decision, not taken here.
