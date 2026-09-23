# 2026-09-23-t722-disclaimer-negation-veto — A disclaimer is not a claim

## Release ID

`2026-09-23-t722-disclaimer-negation-veto`

## Status

`candidate`

## Plain-English Summary

The execution register is an append-only log in which agents record which backlog item
they are working on, so that two agents never take the same item at once. A repo-owned
control reads that log and answers whether an item is free. It decides by looking for the
words `item <id>` in a line and treating that as a claim.

The control could already tell that `item X is not claimed` means the opposite of a claim —
but only when the negation sits *after* the id. It read six words forward from the id and
nothing at all backwards. So a line that says `I touch none of item 26's files` — a
sentence whose entire purpose is to declare non-overlap — was recorded as taking item 26.

That is not hypothetical. It refused item 26's genuine owner permission to write its own
release line, because another run had gone out of its way to declare that it was *not*
touching those files. A run is penalised precisely for documenting its own safety check,
and the item's real owner is locked out of its own record — which recreates the
merged-with-no-register-line gap that four earlier items each closed, this time arriving
through a control rather than through forgetfulness.

This change teaches the control to read a negation that sits in front of the id, and adds
the two hand-back phrases the register actually writes after one (`not taken`, `not mine`)
to the vocabulary it already had. Both halves are proven separately, because neither one
fixes the other's cases.

## Layer Impact

Release lane: `internal-admin`.

- **Platform tooling / execution control plane.** `scripts/exec/register-time-authority.mjs`
  only. No product layer is touched: not client intake, not the source adapters, not the
  canonical model, and no product surface. The control reads an operator-owned file and
  writes nothing.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes** — agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - New `ITEM_DISCLAIMER` / `DISCLAIMER_REACH_TOKENS` / `governedHead` / `disclaimsItem`:
    a negation that governs an id from the **left**, bounded in words and stopped by a
    clause break, mirroring the existing `governedTail`.
  - `CLAIM_STATE_NEGATOR` gains `not taken` and `not mine`, the two hand-back phrases the
    register writes after an id that the verb `claim` did not cover.
  - `ITEM_SUBJECT` is untouched, so every verdict that moves is attributable to the new
    veto alone.
- `scripts/exec/register-time-authority.test.mjs` — 27 new behavioural cases.

## QA / Validation

Measured over the same scope on both sides; no number here is absolute.

| measurement | before | after |
|---|---|---|
| `scripts/exec/register-time-authority.test.mjs` on clean `origin/main` `6cf5b87b5` | 186 passed, 0 failed | — |
| the same suite with the 27 new cases and **no** fix | 196 passed, **14 failed** | — |
| the same suite with the fix | — | **213 passed, 0 failed** |
| `scripts/exec/append-claim.test.mjs` | 50 passed, 0 failed | 50 passed, 0 failed |
| `scripts/exec/build-execution-queue.test.mjs` | 140 passed, 0 failed | 140 passed, 0 failed |
| `scripts/exec/build-source-board.test.mjs` | 23 passed, 0 failed | 23 passed, 0 failed |
| `scripts/exec/worktree-retention.test.mjs` | 22 passed, 0 failed | 22 passed, 0 failed |

**Red first, then the fix, then the fix broken on purpose.** 14 of the new cases failed
before any product edit. **14 of 14 mutations were killed** — deleting the veto call (10
fail), neutering `disclaimsItem` (10), scanning the head left-to-right (10), widening the
reach to 4 (1), narrowing it to 2 (3), dropping `not` (8) or `none` (2) from the
vocabulary, adding `no` (1), removing the clause-break stop (3), making the break skip
rather than stop (3), dropping the backtick reduction (1), reverting both tail additions
(5), and dropping either one alone (1 and 4).

**Two mutations survived a first draft and the code was changed rather than the test.**
An explicit "break ends the token" guard and an empty-string early return were both
*unreachable*, not untested — the surrounding code already produced the same result — so
both were removed, exactly as an earlier item removed a redundant quantifier for the same
reason. A branch no test can constrain is the shape this backlog exists to prevent.

**Two fixtures could not fail and were replaced.** The first clause-break pair was written
with the negator `no`, which the vocabulary deliberately excludes, so neither case could
reach the branch it was named for and both survived every mutation of it.

**The bound is measured, not chosen.** Over the real register the left veto frees 1
occurrence at reach 1, 9 at reach 2, 10 at reach 3 and 14 at reach 4. Reach 4 is where it
first frees an id a line *genuinely* claims — the register disambiguates in the voice
`the "no behavioral test" item, NOT the closed shared-shaper item 41) · also item 25 ·
CLAIMED`, and four words reaches past that negation onto an id the same sentence takes. A
false pass is the worse direction, so the bound stops at 3 and the suite pins it from both
sides.

**The vocabulary is counted, not brainstormed.** `not` governs 7 occurrences and `none` 3.
Adding `no` frees an eleventh and it is the wrong one: `run by no npm script and no
workflow (item 26's fifth instance)` negates the workflow, not the item. `never`,
`neither` and `nor` move nothing at all. On the tail side, `not taken` governs 7
occurrences and `not mine` 1; `not yet taken` occurs 0 times and was dropped after a
mutation deleting it survived.

**Movement on the real operator register, in both directions.** 15 occurrences change
hands, **all of them from held to free, and 0 from free to held**. Every one was read
individually and every one is a genuine hand-back or disclaimer. The gate's verdict on the
live reproduction moves from `held-by-another` to `take`.

Gates: `npx eslint` on both changed files exit 0. `NODE_OPTIONS=--max-old-space-size=6144
npx tsc --noEmit --pretty false` exit **0**, judged by exit code rather than by grepping
its output.

## Rollout Plan

Merge to `main` via squash. The change is a Node script used by agents from a checkout; it
has no runtime surface, no image, no migration and no flag. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does for every merge, and the
runtime invariant will be proven for that run, but no product behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`
- Shared runtime mutators: **none** — this change makes no Azure call
- Approved image digest: whatever the repo-owned workflow produces for the merge commit
- ACA runtime invariant: proven for the merge run as usual; unchanged by this diff
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no** — no product surface is touched

## Rollback Plan

Revert the single commit. No migration, no data, no flag, no image pin to unwind. The
control returns to its previous verdicts immediately for any agent that pulls the revert.

## Audit Evidence

- The PR and its checks.
- The red/green/mutation numbers in the QA table above, each reproducible with
  `node scripts/exec/register-time-authority.test.mjs`.
- The before/after verdicts of
  `node scripts/exec/register-time-authority.mjs --preclaim --item <id> --file <register>`
  on the operator register, which is not in this repository.

## Known Gaps

- **The live reproduction is only partly discharged, and this says so rather than
  implying otherwise.** After this change the disclaiming line no longer holds item 26, but
  a *different* line still does, through a different shape: a narration of somebody else's
  merge written without a third-party subject (`Item 26 MERGED mid-flight — PR #… squashed
  to …`). That is the narration rule's territory, not this one's, and widening two rules in
  one change would make neither movement attributable. Filed separately as **T-724**.
- **The same blind spot exists in the PATH dimension and is not fixed here.** A sibling
  run measured, while this item was in flight, that the file half of the gate reads a
  sentence disclaiming another run's paths as a hold on them — so a release line that
  names its own files cannot free them, which lands the false refusal on the sanctioned
  release path itself. `claimedPaths` and its attributive rules are a separate function
  with their own measurement, and widening two dimensions in one change would make neither
  movement attributable. Filed separately as **T-725**, with that run's evidence.
- The register's own `governedTail` carries the same unreachable empty-string guard that
  was removed from `governedHead` here. It was left alone deliberately: touching it would
  move verdicts this item did not measure.
- No signed-in acceptance is claimed, and none is owed — this change has no product
  surface.
