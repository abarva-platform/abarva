# The Signed-In Gate's Vocabulary Matches The Register's

## Release ID

`2026-09-27-c557-signed-in-gate-vocabulary`

## Status

`candidate`

## Plain-English Summary

An operator script decides, by reading prose, whether a backlog item is waiting on a human to sign in and check something. Items it labels that way are filed where an unattended agent is told never to look; items it does not are offered as free work in a generated queue whose entire purpose is to answer "what can I take with no input from the owner".

Its vocabulary was narrower than the vocabulary the documents are actually written in, and two items slipped through in the expensive direction. Both are items whose *whole* acceptance is a signed-in session that no agent may perform, and both sat in a claimable lane. Two independent causes, each measured by running the rule rather than reading it:

- **The window between the two words was thirteen characters too short.** One row states its gate literally — a signed-in proof listed "as owed audit evidence" — with 93 characters between "signed-in" and "owed" against a bound of 80.
- **"required" and "needed" were in no pattern at all.** `Live signed-in proof required: Yes` is the plainest form a release record has, and it matched nothing. It is the second item's only form. The rule's own veto beside it already negates `owed|required|needed`, so two of that veto's three tokens were written for a vocabulary that did not exist and could never fire.

The window now also stops at the end of a line. That is what makes a wider window safe rather than merely bigger: the old one could run past a newline, pick an "owed" out of a *different* register line, and label an item from a sentence that was never about it — which is what happened at bound 200 during the sweep.

A previous run recorded the symptom in prose, could not allocate an identifier for it, and guessed the mechanism — proposing that the reader looks at the acceptance and not the body. It asked for the code to be read before anything was fixed. It reads both; the field was right and the vocabulary was wrong. This record is the correction of that guess as much as of the defect.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1-3: no change. The script reads operator markdown documents and never touches tenant data.
- Layer 4, products: none. No route, component, surface, prompt, schema or product behavior changes.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — one operator script and its behavioral suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-source-board.mjs` — the signed-in blocker rule's window, its newline boundary, and two tokens.
- `scripts/exec/build-source-board.test.mjs` — five cases.
- No migration, no data build, no product code, no workflow change.

## QA / Validation

Baseline measured over the same scope from a clean checkout of `origin/main` `fb52509568`, materialised file-by-file from that ref rather than from a stash.

**The suite that changed.** `build-source-board.test.mjs`: 91 checks, 0 failing before the cases were written. With the five cases and no fix: **2 failing** — (a) the 93-character window and (b) the `required` token. With the fix: **96 passed, 0 failed**. Cases (c), (d) and (e) pass on unfixed code deliberately; they are the regression half, and the mutations below are what make them decisive rather than decorative.

**Every case was broken on purpose, one mutation at a time, and each was caught by exactly its own case.** Each mutation was asserted to have changed the file before the suite ran, so a no-op substitution cannot read as a passing guard:

| mutation | caught by | tally |
|---|---|---|
| window 160 back to 80 | (a) | 95 passed, 1 failed |
| drop `required\|needed` from the matcher | (b) | 95 passed, 1 failed |
| drop `required\|needed` from the **veto** | (c) | 95 passed, 1 failed |
| readmit `\n` into the window | (d) | 95 passed, 1 failed |
| window 160 down to 60 | (a) and (e), plus 4 `C-552` cases whose gates it destroys | 90 passed, 6 failed |

**The bound is taken from the corpus, not from the two rows that motivated it.** Swept at 60/80/90/100/120/140/160/200/240/320 by rebuilding the whole board at each value against a frozen copy of the live documents: 80 and 90 move nothing, 100 moves one item, the band is **flat from 140 to 320** at the same five ids, and 60 *loses* a genuine gate whose live gap is 78 — so 80 was a floor and 160 sits inside the flat band where the exact value carries no behaviour. The `\n` exclusion is why 200 and above are flat instead of acquiring a cross-line false positive.

**The whole movement, per item and in both directions.** 15 items change their derived blocker; **0 lose one**; every one gains the label from a sentence that says so in plain English — twelve of the form "signed-in proof is required", three of the form "readback owed" or "not claimed". Each of the 15 was read individually rather than counted. Only **three** sit at rung 0, which is where claimability is decided: one was already gated and is merely relabelled, and two leave the claimable lanes. Those two are the entire claimability change, and they are the two the finding names.

Queue effect, rebuilt from both summaries rather than reasoned about: **4 claimable to 2**, lane U from 3 rows to 1, `Signed-in acceptance owed` from 196 to 211. The rise from 2 held to 3 is this run's own claim line and not an effect of the change.

**The veto clause this makes reachable is still vacuous on today's corpus, and that is stated rather than glossed.** Blinding `required|needed` out of the veto moves 0 live items. Nothing in the documents holds that polarity, so case (c) is the only thing that does, and the mutation table above is the proof it does.

**Toolchain scope, clean baseline, same 14 suites:** **1180 checks with 1 failing before; 1185 checks with 1 failing after** — the five added cases and nothing else. The one failure is the same one on both sides: `id-collision.test.mjs` asserts a ratio over the live register corpus and fails on unmodified `origin/main`. It is not caused by this change and is not repaired inside it.

That baseline is a second git worktree checked out at `fb52509568`, not a copy of `scripts/exec/` — the first attempt was a directory copy, and one suite reads repo paths outside that directory, produced no tally at all, and was silently absent from the total. A baseline that cannot run a suite reports a smaller number rather than an error, which is why this is stated: the first figure was 1053 because 127 checks never ran.

**Not widened here, on purpose.** The veto's negator list has no bare `no`, so "no signed-in proof is required" still reads as a gate. That belongs to the open item against this veto; widening it in the same change would make the 15-item movement above unattributable.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`, judged on its exit code.

No signed-in proof is required or claimed for this change: it alters one operator script that renders nothing, reaches no tenant data, serves no route and is in no product import closure.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is built into an image, served by a route, or read by a worker. The next operator run of the board and queue generators picks it up.

## Deployment Authority

- Repo-owned deploy workflow: not exercised; no shared runtime is touched.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no image is built from this change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no. One operator script, no rendered surface, no tenant data.

## Rollback Plan

Revert the commit. The generators are pure readers of markdown documents: reverting restores the previous derivation on the next run, and no state anywhere needs unwinding. No migration, so no rollback constraint.

## Audit Evidence

- The pull request and its CI run, including `execution-queue-toolchain.yml`, which runs this suite.
- The red-first tally in this record: 2 failing before the fix, 0 after, over 96 checks in one suite.
- The five-mutation table above, each row reproducible by the substitution it names.
- The bound sweep at ten values, reproducible by rebuilding the board against a frozen copy of the operator documents.
- The per-item list of all 15 movers, with the sentence that fires for each.

## Known Gaps

- **The veto clause this change makes reachable is still vacuous on today's corpus.** Blinding `required|needed` out of it moves 0 live items. One added case is the only thing holding that polarity, and the mutation table above is the proof it holds. If the corpus later acquires a "signed-in proof is not required" sentence, that case is what keeps it from being read as a gate.
- **The veto's negator list has no bare `no`.** "No signed-in proof is required" therefore still reads as a gate. It is not in the live documents today. Widening the veto belongs to the open item already filed against it; doing it here would make this change's 15-item movement unattributable, and a veto widening can only remove gates, which is the direction that offers owner-gated work as free.
- **The same sub-pattern exists a second time, in the rung-7 veto, and is deliberately untouched.** That copy decides whether an item reads as signed-in proven rather than whether it is gated, so widening it would *demote* items and could move an ungated one to rung 0 — the opposite risk profile, and this file's own note records that exact outcome happening once before. It needs its own measurement and its own change; this record names it rather than fixing it silently.
- **This item's identifier is not on the repo-owned structure map.** It joins 130 others in the same state and is offered from the board's unplaced track on the same terms, which is why the board still exits non-zero. Placement is a separate pull request and is owed.
- **One toolchain suite fails on unmodified `origin/main` and still fails here.** `id-collision.test.mjs` asserts a ratio over the live register corpus — the shape that goes red when the corpus changes rather than when the code does. It is reported, not repaired, and not weakened.
- **No signed-in proof is owed or claimed.** The change alters one operator script that renders nothing, reaches no tenant data, serves no route, and sits in no product import closure.
