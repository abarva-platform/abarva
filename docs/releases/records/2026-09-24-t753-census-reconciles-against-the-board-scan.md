# 2026-09-24-t753-census-reconciles-against-the-board-scan — Reconcile the queue's funnel census against the board's own scan instead of deriving it from a sum that counts placements

## Release ID

`2026-09-24-t753-census-reconciles-against-the-board-scan`

## Status

`candidate`

## Plain-English Summary

The claimable queue opens with a census whose entire job is to say honestly how
many items exist and what each rule removed. That opening number was wrong, and
it was wrong in the one table that exists to stop a reader believing a wrong
number.

The census derived its population as *board items + unplaceable + unparsed*. The
board-item list is built from every stage's items plus every track's items, so
an item placed in two lists appears twice. Both placements are legitimate —
uniqueness is enforced inside each list and deliberately not across them,
because one item can serve two stages — so the list is a count of **placements**
and the census was reading it as a count of **ids**.

Measured on the live documents at the tip this change branched from: 470
placements over 468 distinct ids, two of them placed twice. The census therefore
printed 487 against the board's own independently scanned 485.

It had read correctly until the day before, and only by coincidence: two
duplicates and two items the board could not build cancelled each other exactly.
When the missing items were repaired, the coincidence ended and the error became
visible — which is the argument for reconciling against an independent number
rather than trusting arithmetic that happens to agree.

This change makes the census **reconcile** rather than derive. It opens at the
population the board scanned independently, it diffs the two id sets in both
directions rather than comparing totals, and where they disagree it prints the
difference on the file's own face and names the ids on each side. The
row-versus-id choice is now stated rather than implied: the census counts
distinct ids, the filter below it counts placements, and one explicit add-back
row that names the duplicated ids is where the two meet.

The board-item list itself is **not** deduped. Every other bucket in the queue —
claimable, blocked, in-flight, released — is built from that list, and changing
what it means to repair a number in one table would change what the queue offers
agents.

## Layer Impact

**Release lane: `internal-admin`.** This is operator tooling. Nothing under
`src/` imports `scripts/exec/*`, so no product surface, route, prompt, agent
context, tenant record, migration, flag or permission is in scope.

- Layers 1–4 (client intake, source adapters, canonical model, products) are
  untouched. No loader, adapter, projection, schema, RLS policy, read model or
  rendered screen is changed.

## Client Applicability

- All clients: no functional change. No client-visible surface is touched.
- Specific clients: none.
- Internal only: yes — the claimable queue an agent reads to pick work.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-execution-queue.mjs`
  - `placementCounts`, `distinctPlaced`, `duplicatedIds` and `extraPlacements`:
    placement counted separately from identity, with the duplicated ids named
    rather than only counted.
  - `scanned`: the board's own `itemPositionIds`, read as the number the census
    is reconciled *against*. A missing field renders as "cannot be reconciled",
    never as an agreement — the field is written by the other generator, and
    printing a reconciled census without it would assert agreement with a number
    nobody supplied.
  - `reconcileCensus()`: diffs the accounted-for id set against the scanned set
    **in both directions** and names both sides. Two sets of the same size are
    not the same set, and a comparison of totals alone would call that
    agreement.
  - The census opens at the scanned population; the drop rows close onto the
    distinct placed ids; one signed add-back row hands over to the placement
    count that the filter below uses. The add-back row renders on every run,
    including at zero.
  - `all` is unchanged and undeduped, deliberately.
- `scripts/exec/build-execution-queue.test.mjs` — eight new assertions across
  five cases, described under QA.
- `scripts/exec/source-stage-map.json` — places `T-752` and `T-753`, which were
  in the backlog and on no entry of the map, so the queue dropped them before
  its table and could offer them to nobody.
- This record.

## QA / Validation

### Red first, over the same scope

`node scripts/exec/build-execution-queue.test.mjs`, the full suite, before and
after the generator change:

- **Before: 175 passed, 0 failed, 2 skipped.**
- **With the new cases added and the generator unfixed: 176 passed, 7 failed.**
- **After: 184 passed, 0 failed, 2 skipped.**

The one new case that passes on unfixed code is the fixture precondition, and it
is listed as such below rather than counted as evidence of the defect.

### The negative control, which is the whole of the argument

**Every case that matters runs over a corpus that contains a double placement.**
A fixture in which the derived sum and the independent scan agree is precisely
the corpus that hid this defect until the day before it was filed, and a case
written only against one proves nothing about the number it checks. The first
case therefore asserts that the fixture really does place one id in two lists
and that the two numbers genuinely differ by one, before any case asserts what
the census should print.

### The cases

| Case | Before | What it holds shut |
|---|---|---|
| the fixture really does place one id in two lists | green | the precondition — a corpus where the two agree proves nothing |
| the census opens at the scanned ids, not at a sum that counts a twice-placed id twice | **red** | the defect |
| and the drop rows close onto the distinct placed ids | **red** | a repaired headline over rows that still count placements |
| the row-versus-id choice is stated on the file's own face, with the twice-placed id named | **red** | a silent jump between the two counts |
| and the census says it reconciled, because after the correction it does | **red** | a reconciliation that reports nothing |
| placed once, the same id leaves no duplicate and the add-back row renders at zero | **red** | a row that appears only in the failing case |
| a scan that omits a placed id produces the disagreement block and names the id | **red** | a reconciliation that can only ever agree |
| a scan of the same size but a different set is a disagreement, and both sides are named | **red** | a comparison of totals alone |
| a summary carrying no `itemPositionIds` says it cannot be reconciled, and claims no agreement | **red** | a missing field read as an agreement |

### Mutation — six mutations, six caught

| # | Mutation | Direction | Result |
|---|---|---|---|
| M1 | the opening reverts to the placement sum — the defect itself | — | 1 case fails |
| M2 | `extraPlacements` forced to 0: an id that stops being double-counted | must move the number | 2 cases fail |
| M3 | `distinctPlaced` counts placements: an id newly counted twice | must be caught | 4 cases fail |
| M4 | the reconciliation always reports reconciled | — | 2 cases fail |
| M5 | the reconciliation compares counts only, never the id sets | — | 1 case fails |
| M6 | the forbidden repair: dedupe the board-item list instead of reconciling | — | 2 cases fail |

M2 and M3 are the two directions the item required. M5 is caught by exactly the
case written for it and by no other, which is what shows that case is not
redundant with the one above it. M6 is included because the item names that
repair as the one not to make, and a rule with nothing that runs is the shape
this directory keeps paying for.

### Live corpus, both before and after the map entries

Run against the operator documents at the tip this branched from:

- Census opening **487 → 485**, against an independently scanned **485**.
- The chain now closes: 485 → (2 unparsed) 483 → (15 unplaceable) 468 distinct
  placed → (+2) 470 placements → the filter.
- Reconciled id for id in both directions: zero accounted-for ids absent from
  the scan, zero scanned ids absent from the three buckets.
- The two duplicated ids are named on the file's face rather than only counted.
- With `T-752` and `T-753` placed, the same run reads 485 → 483 → 470 → (+2)
  472; unplaceable falls 15 → 13; the reconciliation still closes in both
  directions.
- Claimable rows are unchanged at 3 by this change's arithmetic; the map entries
  add the two newly placed ids to the board, one of which is held by a live
  claim.

### Gates

- `node scripts/exec/build-execution-queue.test.mjs` — 184 passed, 0 failed, 2
  skipped.
- The rest of the toolchain suite, unchanged and green: `build-source-board`
  60/0, `append-claim` 61/0, `queue-provenance` 30/0, `register-time-authority`
  311/0, `id-collision` 70/0, `cli-entry` 34/0, `toolchain-manifest` 17/0,
  `fossil-claims` 89/0 (2 skipped), `register-citation-check` 22/0,
  `worktree-retention` 27/0.
- `npx eslint` on both changed script files — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**. The exit code is the judgement, not a grep over the output: a bare
  `npx tsc --noEmit` exits 134 on this machine with no diagnostics at all.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime component:
nothing under `src/` imports these modules, so no container image, revision,
flag or environment variable depends on this change. Operators pick it up the
next time they regenerate the queue.

## Deployment Authority

No shared Product/Lab web traffic is affected and no Azure command is run as part
of this change. The repo-owned ACA main deploy workflow remains the only path
that may shift shared traffic; this change does not ask it to do anything.

## Known Gaps

- **The two ids the backlog writes in a shape the board's reader cannot parse
  are still unparsed.** They are named on the face of the queue and counted in
  the census, so they are reported rather than hidden, but they reach no bucket
  and mapping them changes nothing — the reader has to learn their shape first.
  That is a separate item and is not folded in here.
- Thirteen ids remain off the structure map after this change places two. Each
  is named on the queue's face. Mapping is a pull request by design, so a newly
  filed item is unmapped for as long as it takes one to merge.
- The `T-500`–`T-599` filing band is exhausted, which the queue reports on every
  run. That needs a range decision and is not touched here.
- No signed-in acceptance applies. Nothing here renders to a tenant, so none is
  claimed and none is owed.

## Rollback Plan

Revert the commit. The generator is a pure reader of operator documents and holds
no state: a revert restores the previous census on the next run. No migration, no
data write, no flag and no deployed artifact is involved.

## Audit Evidence

- `scripts/exec/build-execution-queue.mjs` — the placement-versus-identity
  block and `reconcileCensus`, each carrying the measurement that motivated it.
- `scripts/exec/build-execution-queue.test.mjs` — the nine cases above.
- Before/after census numbers and the both-directions id diff, recorded under
  QA.
