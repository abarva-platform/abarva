# 2026-09-24-c509-structure-map-invisible-ids — Structure map places the ids the queue could not offer

## Release ID

`2026-09-24-c509-structure-map-invisible-ids`

## Status

`candidate`

## Plain-English Summary

The execution board and the claimable queue are generated from one hand-maintained
structure map that says which backlog item belongs to which lifecycle stage or
track. Seventeen filed items had no entry in it. An item with no entry is dropped
before any bucket of the generated queue is built, so it appears in neither the
claimable list nor the blocked list — it is not visible as work at all, and the
board generator had been exiting non-zero on that gate for long enough that the
number had grown to seventeen. Four of the seventeen were open defects, and they
sat in the three lanes the queue was reporting as having nothing to offer.

This change adds the seventeen placements, and the eighteenth for the item
recording the work. It changes no generator, no test and no product code: the
mechanism that detects and reports the gap was already correct and is what found
these. Only the data it reads was incomplete.

## Layer Impact

- Release lane: `internal-admin`. This is operator execution tooling. No product
  surface, API route, schema, tenant data or model prompt is touched.
- Layer 1–4 of the information architecture: unaffected. Nothing in this change
  reads, writes or projects tenant data.

## Client Applicability

- All clients: No change. No runtime code is modified.
- Specific clients: None.
- Internal only: Yes — the generated board and queue are internal execution
  artifacts and are not committed.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/exec/source-stage-map.json` — eighteen placements added and nothing
  else changed. Each follows the precedent of an already-mapped sibling:
  - Stage 9 `items`: `C-501` `C-502` `C-503` `C-504` `C-505`. All five are the
    same shared response shaper on the same governed answer surface as `C-500`,
    which stage 9 already lists.
  - Cross-cutting capability *aVa event context through the governed context
    bundle*: `C-506`. It wires the fence `C-008` declared, and `C-008` is the
    only item that capability lists, so this is the capability that describes it
    rather than a new one.
  - `outsideLifecycle.items`: `D-044` `D-511`. Both are data-plane work that
    advances no Source lifecycle stage, which is what that track is for.
  - `platformTrack.items`: `C-507` `T-476` `T-749` `U-400` `U-401` `U-402`
    `U-403` `U-404` `U-503`, plus `C-509` for this change. Their `U-5xx` and
    `T-74x` siblings are already on that track.

No id was added to a stage capability. Capability credit is the weakest declared
item, so attaching a filing to a capability that does not describe it would move
the reported vision figure for the wrong reason. Five stage items already sit in
no capability, so an item placed in `items` alone is an existing shape.

## QA / Validation

Re-verified before the change, by execution on `origin/main` `fc509fbd8` rather
than read off the previous item's report: the board generator over the live
operator documents exits **1** at the unmapped gate and names all seventeen ids.

The measured effect, both directions:

| measure | before | after |
|---|---|---|
| board generator exit code | 1 | 0 |
| ids placed by no map entry | 17 | 0 |
| ids placed but built into no item | 0 | 0 |
| claimable queue rows | 3 | 11 |
| claimable rows in lanes U, C and T | 0 | 7 |
| rows named as blocked rather than absent | 247 | 255 |

Every one of the seventeen is accounted for against the population, not sampled:
eight are now claimable (`C-504` `C-505` `C-506` `D-044` `T-476` `U-400` `U-401`
`U-404`), five are now named in the blocked bucket instead of being absent
(`D-511` decision needed, `T-749` blocked at source, `U-402` `U-403` `U-503`
signed-in proof owed) and four are already at a proof rung (`C-501` merged,
`C-502` `C-503` `C-507` deployed).

**Each of the four map sections used was proven load-bearing by breaking it.**
One placement was removed from each section in turn; in all four cases the board
returned to exit 1, named that id in its unmapped list, and the queue lost that
id's claimable row. Four mutations, four caught: `C-504` from stage 9 items,
`C-506` from the cross-cutting capability, `D-044` from `outsideLifecycle`,
`U-400` from `platformTrack`.

Before using the two sections this change is the first to place a fresh id into,
a synthetic id was placed in `outsideLifecycle` only and another in a
cross-cutting capability only: both were built into items and both reached the
generated queue, and neither landed in `placedButUnbuilt`. The defect class where
a citation counts as placement but builds no item does not apply to them.

Toolchain suites, same command and same scope on both sides of the change, with
the original map restored to measure the baseline rather than assumed:
`build-source-board` 60 passed / 0 failed, `build-execution-queue` 184 / 0 with 2
skipped, `toolchain-manifest` 17 / 0 — **identical before and after**, which is
correct: those suites deliberately assert fixtures rather than the live operator
documents, so a change to the live corpus must not move them. The remaining
eight suites in the directory pass: `queue-provenance` 30, `append-claim` 61,
`id-collision` 70, `fossil-claims` 89 with 2 skipped, `register-time-authority`
311, `register-citation-check` 22, `worktree-retention` 27, `cli-entry` 34, all
with 0 failures.

The file is edited surgically rather than re-serialized. The map is not currently
formatter-clean, so writing it back through a formatter would have produced a
whole-file diff around a thirteen-line change.

## Rollout Plan

Merge to `main`. No runtime rollout: the diff contains no byte under `src/`, no
migration, no workflow and no dependency change, so the deployed image's
behaviour is unchanged. The generated board, summary and queue are not committed
and are produced by whoever runs the generators next.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, untouched.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: unchanged; this change alters no image input.
- ACA runtime invariant: to be recorded from the deploy run keyed to the merge
  commit, as the standing rule requires, even though the diff cannot alter
  runtime behaviour.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **No, and none is claimed.** No product file
  changed, so a signed-in lane would be a proof with no subject.

## Rollback Plan

Revert the commit. The generators re-read the map on every run, so the previous
placement set is in effect the next time either is run. Reverting restores the
failing unmapped gate, which is the state this change repairs, so a revert should
be paired with a decision about the seventeen ids rather than taken alone.

## Audit Evidence

- The pull request and its check runs.
- The board generator's own `not placed on the map` line, which prints the count
  every run and exits non-zero above zero.
- The queue's *Why that number* census, which names the dropped ids on the face
  of the file and now names none.

## Known Gaps

- **A negated declaration that no signed-in proof is owed is read as owed.**
  Found while accounting for the seventeen and deliberately not fixed here,
  because the claim for this item scoped it to placements. The blocker rule at
  `scripts/exec/build-source-board.mjs:994` matches `signed-in` followed within
  eighty characters by `owed`, and has **no veto clause** — so the sentence *"No
  signed-in acceptance is owed and none is claimed"* is read as a signed-in gate.
  It is the only rule in that list without a veto; the `blocked` rule immediately
  below it has one for exactly this reason, which is the evidence that this is a
  miss rather than a choice. `C-507` is at the terminal `Deployed` rung and is
  filed under *Blocked on Anand — never claim these* because of it. It costs
  nothing on a finished item; on an open one the same phrasing would hide real
  work in the bucket agents are told never to take. Worth its own item, with a
  corpus sweep for the phrasing and a case in both directions.
- **The `T-500`–`T-599` id band is exhausted, 0 of 100 free.** Raised by `C-508`
  with a recommendation; it is a range decision and is untouched here.
- Two backlog ids are in item position and are parsed into no item at all, so
  mapping cannot reach them. They are reported separately by the generator and
  are not part of this population.
