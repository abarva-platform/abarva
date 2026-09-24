# 2026-09-24-t752-stage-capability-ids-reach-no-item — Make a stage capability's item citation place an item, and report placed-but-unbuilt ids

## Release ID

`2026-09-24-t752-stage-capability-ids-reach-no-item`

## Status

`candidate`

## Plain-English Summary

The execution board generator walked its structure map twice and the two walks
disagreed.

One walk decided which ids counted as *placed*, and it counted an id a stage
capability cites: the code says so in as many words — "an id cited only by a
capability is placed, not orphaned" — so such an id was deliberately kept out of
the `unmapped` report. The other walk decided which ids became *items*, and it
read a stage's own `items` list and nothing else.

An id cited only by a stage capability therefore landed between the two: mapped
enough to be excluded from the report that names missing ids, unbuilt enough to
have no row, no title, no acceptance, no rung and no blocker. It could never be
classified as claimable, and it could never be classified as blocked, because
both classifications are computed from a board row it did not have.

Measured on the live map and backlog at the time of this change: of the 63 ids
cited by a stage capability, exactly two are cited nowhere else, and both are
substantive filings with full acceptances — one in the control lane, one in the
UI lane. The same run's queue offered three data-plane rows and reported the
other three lanes as having nothing to take.

Cross-cutting capabilities never had the defect, because the cross-cutting track
is built *from* the capability lists. This change makes a stage behave the same
way, dedupes the two lists by id so an item a stage lists and its capability
also cites is filed once rather than twice, and derives the placement set from
the same references the builders consume — a second walk cannot drift from the
first if there is no second walk.

It also adds the residual that would have caught this: ids the map places and
the backlog defines that were built into no item. Written on every run including
at zero, because a missing line and a line reading "none" must not look the same
to someone skimming the output.

**This was observed before and written down as prose.** A note in the backlog
dated three days before this change records that one of the two ids "survives
only as a capability reference" and is "not one of" the board's item rows. It
survived because an observation in a document has nothing that runs.

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
- Internal only: yes — the execution board and claimable queue an agent reads to
  pick work.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-source-board.mjs`
  - New `stageItemRefs(stage)`: the references a stage places, being its own
    `items` plus the `items` of every capability it declares, deduped by
    resolved id. Dedup is not optional — most live capability citations name an
    id the stage already lists, and a plain concatenation would file one piece
    of work as two rows. `assertUniqueMappedRefs` already enforces uniqueness
    *inside* each list and deliberately not across them, for this reason.
  - Stage items are built from `stageItemRefs(stage)` rather than from
    `stage.items` alone.
  - The placement set (`mappedNums`, which `unmapped` is computed against) is
    derived from the same reference lists the builders consume, replacing an
    independently written second walk of the map.
  - New `placedButUnbuilt`: ids the map places and the backlog defines that
    reached no item. Emitted on stdout and in `source-board-summary.json` on
    every run, at zero included. The exclusion is load-bearing and is asserted:
    a map may place an id the backlog has not defined yet, and `buildItem`
    returning null for it is documented behaviour, not a fault.
- `scripts/exec/build-source-board.test.mjs` — nine new assertions across five
  cases, described under QA.
- This record.

## QA / Validation

### Red first, over the same scope

`node scripts/exec/build-source-board.test.mjs`, the full suite, before and
after the generator change:

- **Before: 55 passed, 5 failed.**
- **After: 60 passed, 0 failed.**

The five that failed are the new ones that assert desired behaviour. Four of the
nine new assertions pass on unfixed code by design — they are the guardrails an
over-broad fix would break, and they are listed as such below rather than
counted as evidence of the defect.

### The cases

| Case | Before | What it holds shut |
|---|---|---|
| an id cited only by a stage capability is built into an item | **red** | the defect |
| and it carries the acceptance its own filing states | **red** | that the row is a real item, not an empty shell |
| and it is not reported as unmapped, because the map does place it | green | a "fix" that routes the id to the missing-ids report instead of building it |
| an id its stage lists AND its capability cites is filed once, not twice | green | the naive concatenation |
| a placed id the backlog does not define builds nothing and does not fail the run | green | the exclusion |
| and it is not reported as placed-but-unbuilt, which is about DEFINED items | **red** | the exclusion, on the new residual |
| `placedButUnbuilt` is written on every run, including when it is empty | **red** | a field that appears only in the failing case |
| and stdout says so in words | **red** | the same, for a reader who does not parse JSON |
| a cross-cutting capability citation still builds an item | green | the negative control — this path always worked |

### The suite's own blind spot, which is the reason this needed a new case

The suite already carried an assertion reading *"every id discovered in item
position is either on the board or named in the residual"*. It passed before
this change, and it was passing while that statement was false on the real
corpus, because no fixture in the suite had ever constructed an id whose only
placement is a stage capability. A detector proven only on the cases a test
hands it has not been proven on a known positive.

### Mutation — five mutations, five caught

| # | Mutation | Result |
|---|---|---|
| M1 | stage items read `stage.items` alone again | 2 cases fail |
| M2 | `stageItemRefs` concatenates without dedup | 1 case fails |
| M3 | the stdout line renders only when the count is non-zero | 1 case fails |
| M4 | the placement set drops the capability contribution | suite aborts — see below |
| M5 | `placedButUnbuilt` drops the "and the backlog defines it" filter | 3 cases fail |

**M4 is caught, but not by a case of this change, and that is reported rather
than counted as a clean catch.** With the placement set narrowed, the fixture id
becomes unmapped, and the generator's pre-existing unmapped gate exits non-zero;
a suite helper throws on a non-zero fixture build and the run aborts before any
case is evaluated. A redundant guard absorbed the signal. The mutation cannot
pass, which is what a mutation check is for, but the failure names the wrong
control.

### Live corpus: both directions

The generator was run against a copy of the operator documents before and after,
and every pre-existing item was diffed on **both** the rung and the derived
blocker. The blocker is the field that decides whether the queue files an item
under *Blocked on Anand* — the bucket an agent may not claim from — so a rung
diff alone would not see the direction that hides work.

- Board items: **465 → 467.** The two additions are the two ids the defect
  described; nothing else appeared and nothing vanished.
- **Rung movements: 0. Blocker movements: 0.** Every pre-existing item resolves
  exactly as before.
- Stage rungs unchanged.
- Ids in item position, mapped, absent from the residual and on no board:
  **2 → 0.**
- `placed but built into no item: 0` on the live corpus after the change.

### Gates

- `node scripts/exec/build-source-board.test.mjs` — 60 passed, 0 failed.
- The rest of the toolchain suite, unchanged and green:
  `build-execution-queue` 175/0 (2 skipped), `append-claim` 61/0,
  `queue-provenance` 30/0, `register-time-authority` 311/0, `id-collision` 70/0,
  `cli-entry` 34/0, `toolchain-manifest` 17/0, `fossil-claims` 89/0 (2 skipped),
  `register-citation-check` 22/0, `worktree-retention` 27/0.
- `npx eslint` on both changed files — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with
  `tsconfig.tsbuildinfo` removed first — **exit 0**, 0 `error TS`. The exit code
  is the judgement, not a grep over the output.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime component:
nothing under `src/` imports these modules, so no container image, revision,
flag or environment variable depends on this change. Operators pick it up the
next time they regenerate the board.

## Deployment Authority

No shared Product/Lab web traffic is affected and no Azure command is run as part
of this change. The repo-owned ACA main deploy workflow remains the only path
that may shift shared traffic; this change does not ask it to do anything.

## Known Gaps

- **The queue's census total now disagrees with its own independent scan, and
  this change is what made the disagreement visible.** The census opens with a
  population derived as *board items + unplaceable + unparsed*. Two ids are
  counted twice in the board-item list because they sit on both a stage and a
  track. Before this change the derived total was correct only because those two
  duplicates cancelled the two missing items exactly; with the two items now
  built, the derived total exceeds the independently scanned population by two.
  The defect is pre-existing, the duplication count is unchanged at two, and it
  lives in the other generator, which is outside this change's claimed scope. It
  is filed as its own item with the measurement rather than folded in here.
- The two ids this makes visible land in the register's expired-work-in-flight
  bucket, not in the claimable table, because each names a branch. This change
  does not add claimable rows; it makes two items classifiable at all.
- Two ids remain in the unparsed residual — a heading shape the reader does not
  accept, and one id this change does not touch. They are reported, not hidden.
- No signed-in acceptance applies. Nothing here renders to a tenant.

## Rollback Plan

Revert the commit. The generators are pure readers of operator documents and hold
no state: a revert restores the previous board and queue on the next run. No
migration, no data write, no flag and no deployed artifact is involved.

## Audit Evidence

- `scripts/exec/build-source-board.mjs` — `stageItemRefs`, the single placement
  walk, and `placedButUnbuilt`, each carrying the measurement that motivated it.
- `scripts/exec/build-source-board.test.mjs` — the five cases above.
- Before/after counts and the live-corpus rung and blocker diff, recorded under
  QA.
