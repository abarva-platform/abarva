# 2026-10-05-queue-partly-gated-referral — the partly-gated section referred to a table that did not hold its rows

## Release ID

`2026-10-05-queue-partly-gated-referral`

## Status

`candidate`

## Plain-English Summary

The generated execution queue has a section called *Partly gated*. It lists work items where an
owner has gated one named half and left the other half executable, and it told the reader, of every
row it printed, that the executable half "is offered in the lane tables above" — the tables an
executor is instructed to take work from.

Measured on the live documents at `2026-10-05T03:58Z`: **0 of its 6 rows appeared in any lane
table.** Four of the six had already been delivered — two of them print `DELIVERED ... NOT to be
re-taken` inside the very cell being offered — one was closed, and the single remaining row was
blocked on another item. An executor following the file's own instruction was sent at finished work.

The mechanism is why this was recorded three times without being repaired. The section selected rows
on two conditions and nothing else: the item is not finished, and it carries a partial gate. It
therefore bypassed the claimable filter entirely — and the first rule of that filter, `already has
proof (not at rung 0)`, is exactly what correctly keeps a shipped item out of the lane tables. So
for any item carrying proof the referral could never be true. That is not a wording slip. It is a
sentence with no state of the world that falsifies it, printed over the one table in the file an
agent is told to act on, which is the same shape as a CI gate that proves a control exists by
finding its name in a comment.

This change derives the referral per row instead of asserting it. The rows the claimable filter
removes are shown in their own table, each under the name of the rule that removed it, and the
counts in the prose are computed rather than claimed. Nothing is hidden and nothing is freed: the
queue's claimable total is **8 before and 8 after**, with the same lane split.

## Layer Impact

Lane: `experimental`

Platform tooling only — the operator-facing work queue generator under `scripts/exec/` and its test
suite. No layer of the data operating model is touched: no client intake, no source adapter, no
canonical model object, and no product surface. No route, component, prompt, migration, projection
or tenant row changed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — the generated execution queue is an internal operator artifact
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-execution-queue.mjs` — new `withholdingStage(item)`, which reads
  `CLAIMABLE_STAGES` itself and returns the first stage that rejects the item, or `null` when every
  stage keeps it (which is exactly membership in `claimable`, so there is no third outcome and no
  unreachable branch). The section now partitions on it, renders an offered table and a withheld
  table, and derives both count sentences.
- `scripts/exec/build-execution-queue.test.mjs` — six new cases under the existing harness.
- This record.

The reason column is deliberately the stage's own `label`, not a paraphrase. The declaration of
`CLAIMABLE_STAGES` says a report that re-derives the rules a second time can disagree with the
filter it claims to describe; a paraphrase here would be that defect in a new place.

## QA / Validation

**Baseline, same scope, same command, clean base.** `node scripts/exec/build-execution-queue.test.mjs`
exported from `origin/main` at `d4bf30f961`: **222 passed / 0 failed.**

**Red first, with the final assertions.** The assertions were rewritten mid-work (see *Known Gaps*),
so red-first was re-proved with the versions that shipped: generator reverted to its committed
state, suite unchanged, **224 passed / 4 failed** — the four defect cases red, and the two
no-regression cases green, which is what makes the fixture trustworthy rather than merely red.

**After.** **229 passed / 0 failed.** Sibling suites in the same directory, all green and unchanged:
`queue-provenance` 30/0, `append-claim` 94/0, `build-source-board` 106/0, `claimable-preconditions`
23/0, `register-time-authority` 354/0. `queue-provenance` passing matters specifically: the T-720
provenance stamp is the sha256 of this generator's own bytes, so it re-derives rather than being
pinned, and a stale copy still cannot produce it.

**Seven mutations, each verified by sha256 as a real edit before its run and restored byte-identical
after, every declared case killed by at least one:**

| # | Mutation | Cases killed |
|---|---|---|
| M1 | the partition stops partitioning — every row offered, as before the fix | (a), (c), (d) |
| M2 | the reason becomes a hand-written paraphrase instead of the stage's label | (c) |
| M3 | the offered count is taken from the whole bucket again | (d) |
| M4 | the withheld block is omitted when empty | (e) |
| M5 | `withholdingStage` consults only `CLAIMABLE_STAGES[0]` | (f) |
| M6 | withheld rows render without the reason column | (c), (f) |
| M7 | the partition is inverted | all six |

**Two mutations survived on the first pass and both found real holes in the suite rather than in the
fix.** They are recorded here rather than quietly repaired, because the survivor was the only thing
that revealed either one.

- **M3 survived.** Case (d) matched `/\*\*1 of 2 .*?offered/s`. With the `s` flag the lazy gap ran
  from the *withheld* sentence — "**1 of 2 is withheld**" — to the word "offered" in the withheld
  table's own header, so the case passed on a sentence that was not the one under test. Both count
  sentences are now asserted whole. A count assertion has to name the sentence it counts.
- **M5 survived.** Every fixture in cases (a)–(e) is withheld for the same reason, rung, so
  narrowing the lookup to the first stage was behaviourally identical on all of them. Under that
  narrowing a row removed by any *later* rule is reported as offered again — the original defect
  restored for every non-rung reason. Case (f) was added for it: a partly-gated row held by a live
  claim, which stays at rung 0 with its gate intact, and which no second agent should be sent at.

**Live effect, measured over a COPY of the operator root in a scratchpad and never in `~/Downloads`.**
All 6 rows move to the withheld table; all 6 name `already has proof (not at rung 0)`; claimable
**8 → 8**, lane split `C:1 D:6 U:1` unchanged, `455` blocked on Anand unchanged. The repair is to
what the section says about itself, so no row changes bucket — which is the result to state, since a
fix here that moved the claimable count would mean it had hidden or freed work.

`tsc` exit **0**, judged on the exit code (`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false`). `eslint` exit **0**.

**Prettier reports both edited files unformatted, and this change did not cause it.** Measured at
base: the same two files fail `prettier --check` on `origin/main` exactly as they do here. They are
not reformatted, deliberately — the generator's own comment records that its body keeps module
indentation so that a diff stays reviewable, and two suites read its output byte-for-byte.

## Rollout Plan

Merge to `main`. No runtime rollout: `scripts/exec/` is operator tooling invoked by hand, so nothing
is served and nothing is deployed by this change. The generated queue in the operator root shows the
new section the next time an operator regenerates it from merged `main`.

## Deployment Authority

Not applicable — no Azure Container App, deploy workflow, runtime image, flag, environment variable,
worker job, traffic weight or DNS record is touched.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: not applicable
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no product surface, route, component or prompt is in the
  change, so there is nothing to sign in and inspect. None is owed and none is claimed.

## Rollback Plan

Revert the single commit. There is no migration, no state and no deployed artifact, so the previous
generator is restored by the revert alone and the next regeneration reproduces the old section.

## Audit Evidence

- The PR and its CI run.
- `node scripts/exec/build-execution-queue.test.mjs` — 229 passed / 0 failed; 222 / 0 at base.
- The mutation table above; each row is reproducible by the stated edit.
- The regenerated section over a scratchpad copy, quoted in *Plain-English Summary* by its counts.

## Known Gaps

- **The item id is owed.** This is filed under standing P3 item 26 rather than a new `T-` id because
  `T-400`–`T-599` and `T-700`–`T-799` are measured spent and the `T-800`+ range is an owner range
  decision the board states is a range decision rather than a careful reading. An executor must not
  mint one. The precedent is the run earlier the same day that filed its own queue-gate work the
  same way, and the range decision remains open.
- **The withheld rows are reported, not reconciled.** Four of the six carry a claimable half that
  has already shipped and one is closed on `main`; this change stops them being offered, and it does
  not close them or file their successors. That reconciliation is the step the backlog's own residual
  section says has been missed repeatedly, and it is per-row work on six separate items rather than
  part of this one.
- **One stage cannot be reached by a partly-gated row at all**, by construction: `blocked on Anand`
  removes an item whose gate is scoped to the whole of itself, and such an item has no `partialGate`.
  No case asserts that stage's label, because no fixture can produce it without contradicting the
  gate declaration. Stated rather than covered by an unreachable test.
