# 2026-09-24-t762-acceptance-cell-corpus-boundary — The acceptance cell is a corpus boundary

## Release ID

`2026-09-24-t762-acceptance-cell-corpus-boundary`

## Status

`candidate`

## Plain-English Summary

The execution board reads each backlog row and decides whether the row is blocked on a
human — for example because it states an owner decision that an unattended agent must not
guess. It recognises such a statement only when the phrase **opens** a sentence: at the
start of the text, after a full stop, after a line break, or immediately after bold markup.
That anchoring is deliberate, and it was added twice after unanchored matching turned every
passing mention of a word into a false gate.

A row is assembled from three cells — title, acceptance, and the raw row — and those three
were joined together with a **space**. A space is not any of the four positions the rules
anchor on. So the head of the acceptance cell, which is the field that states what an item
*needs*, was never a sentence start, and nothing written there could be recognised. A row
reached the rule only by accident, when its title cell happened to end in a full stop and
supplied the anchor by coincidence.

This change joins the title cell to the acceptance cell with a newline.

Measured over the live operator documents, 33 items change their blocker, and **32 of them
state their gate in the imperative — "Decide whether…" — at the head of their acceptance.**
That form has been recognised by the rules since they were written and has been unreachable
from an acceptance cell for its whole life. The 33rd is the row that prompted the item.

The concrete cost: the generated queue was offering, as free work with no input from the
owner, a row whose acceptance opens "A product decision, not a code decision, and it is
stated that way on purpose". It was the only row offered in its lane. After this change the
queue offers it to nobody.

## Layer Impact

Release lane: `internal-admin`.

- **Internal tooling only.** `scripts/exec/build-source-board.mjs` derives the execution
  board and the claimable queue from operator-owned documents.
- **No product layer is touched.** Nothing under `src/` changes; no intake, adapter,
  canonical model or product surface is involved.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — the execution board and queue read by agents and the owner
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — `bodyCorpus` joins the title cell to the
  acceptance cell with `\n` instead of a space, with the measurement recorded at the site.
- `scripts/exec/build-source-board.test.mjs` — seven cases added (22d–22h); two existing
  comments corrected where they recorded a diagnosis this item measured to be wrong.

## QA / Validation

**Clean baseline, same command and same scope on both sides.**

- `node scripts/exec/build-source-board.test.mjs` at `origin/main` `926e26620`:
  **65 passed, 0 failed**.
- With the seven cases added and the generator **unchanged**: **68 passed, 4 failed** —
  red first. The four reds are the four defect cases; the three guardrails pass by design.
- With the fix: **72 passed, 0 failed**. The delta is exactly the seven cases added and no
  existing expectation moved.

**Four mutations, four caught, each by the case written for it, and none a no-op.**

| mutation | fails | which cases |
|---|---|---|
| revert the separator to a space | 4 | the four defect cases, and only those |
| drop the `\n` anchor from the imperative `Decide` term | 2 | the imperative case and the claim-log case |
| drop the `\n` anchor from the `A <adj> decision` term | 2 | the unpunctuated-title case and the vacuity case |
| un-anchor the decision rule entirely | 6 | all three new guardrails plus three pre-existing ones |

**Live corpus, both directions, against one frozen copy of the operator documents** (copied
once and used for every run, so nothing is attributed to a document that moved mid-measurement):

- 499 ids compared; **0 present on one side only — extras zero, in both directions**.
- **33 blockers move**; all 33 to `Decision needed`. 22 fill an empty blocker, 11 replace
  an existing one.
- **32 of the 33 anchor on the imperative `Decide` at the head of their acceptance cell**;
  the 33rd anchors on the `A <adjective> decision` noun phrase. Every one of the 33 was
  checked individually by capturing the exact matched text and the 40 characters before it:
  in all 33 the character immediately before the match is the newly inserted cell boundary,
  so the acceptance cell accounts for the whole movement.
- **All 33 verdicts are correct.** Each states an owner decision in its own acceptance, in a
  form the rules already recognise everywhere a sentence happens to start.
- Queue: claimable rows **4 → 3**; lane C **1 → 0**; lane D 3 → 3 unchanged.
- Blocked-on-owner **264 → 285**, and it reconciles set-wise rather than by total:
  `Decision needed` +31, `Signed-in acceptance owed` −9, `Blocked (see source)` −1 = **+21**.
  The 33 moved minus the 2 at rung `Closed`, which the queue excludes from that bucket by
  `isFinished`, is the +31.
- Board generator exit 1 → 1, unchanged and for an unrelated reason: eight ids filed since
  `C-509` are not yet on the structure map.

**The eleven replacements, which is the half that can hide work.** A `Decision needed` that
displaces a real `Signed-in acceptance owed` moves an item between two never-claim buckets,
and a wrong one there is silent. So the source of each displaced label was measured, not
assumed, by recording whether `deriveBlocker` derived it from the item's own body or from
the claim log:

- **10 of 11 were derived from the CLAIM LOG, not from the item's own body.** Nine read
  `Signed-in acceptance owed` off register lines that mostly say the opposite in words
  ("no signed-in proof owed", "not applicable and not owed"), and one read the `Unclaimed`
  fallback. Item T-700's rule is that an item declaring a gate in its own body must never be
  labelled from a neighbouring item's release paperwork; with the body gate unreachable,
  the claim line won by default. All ten now read their own gate. Case 22h holds this shut.
- The 11th, `T-721`, displaced a body-derived `Blocked (see source)` whose matched sentence
  is "Blocked on I/O per file, not deadlocked" — a description of I/O, not a gate on anyone.
  Its acceptance opens "Decide whether an appended correction should retire the violation it
  names", which is a genuine owner decision. The new label is the better one.
- **No replacement displaced a correctly-derived owner gate.**

**Scope held to what is measurable.** Joining the `raw` cell the same way moves exactly the
same 33 ids and no others — for a table row `raw` is the whole row joined by `" | "` and its
head is the id, never a gate, and a prose definition already reaches the repair through the
empty acceptance cell. A change nothing can distinguish is a change no case can hold, so it
was reverted and only the acceptance boundary ships.

**Other checks**

- All 12 `scripts/exec` suites: **961 passed, 0 failed, 4 skipped**; the other 11 unchanged.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  judged by exit code, with `tsconfig.tsbuildinfo` removed first; zero diagnostics emitted.
- `npx eslint` on both changed files — **exit 0**.

## Rollout Plan

Merge to `main`. These are developer-facing scripts that nothing under `src/` imports, so
there is no runtime rollout: no image, no revision, no flag, no migration. The change takes
effect the next time an operator or agent regenerates the board.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no `az` command, no workflow file, no container template
- Approved image digest: not applicable; no runtime image is built or pinned by this change
- ACA runtime invariant: unaffected — no byte under `src/` and no Dockerfile input changes
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no, and none is claimed.** Nothing under `src/` is
  touched, so no product surface can render differently; a signed-in lane here would be a
  proof with no subject.

## Rollback Plan

Revert the single commit. The change is one separator in one expression plus its test
cases; there is no state, no migration and no artifact to unwind. Regenerating the board
after a revert restores the previous blockers exactly, which the before/after measurement
above already demonstrates in both directions.

## Audit Evidence

- The PR, its diff, and its CI run
- `scripts/exec/build-source-board.test.mjs` cases 22d–22h, which fail when the separator is
  reverted
- The mutation table above, reproducible by applying each mutation and rerunning the suite
- The before/after board summaries over a frozen copy of the operator documents

## Known Gaps

- **The `Signed-in acceptance owed` rule still has no veto.** Nine of the ten claim-derived
  labels this change displaces were negated statements — "no signed-in proof owed" read as
  owed. Those nine now read their own gate instead, but the rule that misread them is
  untouched and will misread the next one. It is the only blocker rule with no veto clause,
  where the `blocked` rule beside it acquired one for exactly this reason. Out of scope here
  and reported as a residual.
- **`sentenceAround` does not treat the new cell boundary as a sentence start.** The quote
  the board renders for one of these gates therefore begins in the tail of the title cell
  and reads oddly, even though the match itself is correctly placed. Cosmetic, affects the
  rendered quote only and never the label; reported rather than folded in, so the blocker
  movement stays attributable to one change.
- **The `blocked` rule still admits an attributive "Blocked on I/O".** Surfaced by `T-721`
  above. It is the T-703 family and is not touched here.
- Eight ids filed since `C-509` are not on the structure map, so the board still exits 1 and
  the queue cannot offer them. Pre-existing, unrelated, and unchanged by this release.
