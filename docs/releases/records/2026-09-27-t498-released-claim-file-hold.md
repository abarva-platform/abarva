# 2026-09-27-t498-released-claim-file-hold — a released claim stops holding its files, and a refusal names what it refused

## Release ID

`2026-09-27-t498-released-claim-file-hold`

## Status

`candidate`

## Plain-English Summary

Two defects in the execution-board toolchain, both in the path an agent runs before it starts work.

**One.** The pre-claim gate asks whether anyone else is already editing the files you are about to
touch. It correctly ignores a claim that has been handed back — but only when the handback is written
in one of two narrow spellings. The rule matched `RELEASED` in capitals, or lowercase `released`
immediately followed by the word `item`. The sanctioned claim helper produces lines such as
`released — <id> MERGED. PR #...`, which is neither, so a finished and deployed item went on holding
its files against every other agent for three hours. The perverse part: the more precisely an agent
listed what it had touched, the longer it blocked everybody else.

The verb is now matched in either case and no longer needs a word after it. What did not change is
the part doing the work — the rule still only reads the announcement at the *head* of the message,
so an ordinary claim that merely promises "one public-safe release record" still holds its files.
Three negative controls in the suite are exactly those lines.

**Two.** When that gate refused, the helper printed nothing about why. It rendered the gate's report
itself and read a field name the gate has never emitted, so a refusal caused by a *file* conflict
printed the *item* check's verdict — the word `take`, next to the word `REFUSED`, with no path, no
line number and no agent. The cause could only be found by running the gate by hand and reading its
JSON. The missing field name was the symptom; the defect was two renderings of one report, only one
of which anyone ever looked at. There is now one renderer, exported from the gate and used by the
gate's own output and by the helper, so the two cannot drift apart again.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling. No product layer. This is internal execution tooling only — the scripts that derive the execution
board and gate a claim on the append-only claim register. Nothing here reads tenant data, reaches the
canonical model, or is imported by any product surface, route, loader or adapter.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — agent execution tooling under `scripts/exec/`
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - `announcesRelease` matches the verb case-insensitively and drops the `\s+items?` requirement.
    The old lowercase branch is **deleted**, not left beside the new one: the widened rule subsumes
    it entirely, and a second pattern no input can reach is a guard that survives every mutation of
    itself.
  - New exported `describePreclaim(payload)` — the single rendering of a `--preclaim` report. The
    CLI's text branch now calls it instead of formatting inline.
  - The `--preclaim` JSON payload carries `itemRefuses` explicitly. The combined `refuses` was
    spread over the item half's own flag, so no reader working from the JSON could tell which half
    objected — and every caller that is not this file is such a reader.
- `scripts/exec/append-claim.mjs` — its private formatter is replaced by `describePreclaim`.
- `scripts/exec/register-time-authority.test.mjs` — 9 cases.
- `scripts/exec/append-claim.test.mjs` — 6 cases.

## QA / Validation

**Re-verified on `origin/main` `4a4d3984d4` before any edit, and the backlog item's diagnosis is
wrong in the detail.** The item says the file half does not reuse the register's release detection.
It does, and has since T-707: `resolveFileOverlap` skips `announcesRelease` and `announcesAbstention`
at the head of its loop, and T-712 taught `messageField` to read past the helper's generated
`item <id> claimed on branch \`x\` —` prefix. Both halves worked. The grammar they agree on was the
gap. The backlog row has been corrected in place with this proof.

**Known positive, reproduced on the real register before the fix** — not a fixture built to match
the change. Replayed with `--now` pinned to `2026-09-27T08:57:00Z`, the instant another run hit it:
the gate refused, citing **2 conflicting lines**, both of them the same already-merged item.

**Red-first, both suites, same scope both sides:**

Measured by putting the new cases against the **unfixed subjects taken from `origin/main`
`4a4d3984d4`**, so both sides run the same suite over the same scope:

| suite | clean baseline | new cases, unfixed subject | after the fix | cases added |
|---|---|---|---|---|
| `register-time-authority.test.mjs` | 311 / 0 | **315 passed / 5 failed** | **320 / 0** | 9 |
| `append-claim.test.mjs` | 71 / 0 | **73 passed / 4 failed** | **77 / 0** | 6 |

Of the 9 cases added to the gate's suite, **8 are red-first and 1 is not**: the case asserting the
gate's own refusal text names the contended path passes on `origin/main` too, because that text was
already correct there. It is a regression guard for the renderer extraction, and mutation 3 below is
what proves it load-bearing rather than decorative.

**Calibrated in both directions over the whole real register (1,987 lines) before the change was
written.** Widening the verb changes the verdict of **exactly one line** — the known positive —
taking release lines from 297 to 298. No line that holds work is freed.

**Four deliberate mutations, each asserted non-no-op before its suite ran, each caught:**

1. Revert the grammar to case-sensitive → the verb reads `false` on the known positive; **5 cases
   fail**, exactly the red-first five.
2. Widen it further, to the noun `release` → a claim opening `release-check passes locally` reads as
   a release; **1 case fails**, its own negative control. This is what says the widening stopped
   where it was meant to.
3. Blind the renderer's conflict loop back to the field the gate never emits → the `CONTENDED` lines
   vanish from real output; **4 cases fail**.
4. Force `itemRefuses` true → the refusal blames "the item and files gate"; **both suites fail**.

**Mutation 3 found a coverage gap and it is closed here.** On the first pass, blinding the renderer
left the gate's own 319-case suite entirely green — only the helper's suite went red. The gate
printed that detail and nothing asserted it. A case now asserts the gate's own refusal text names
the contended path and the line, stamp and agent holding it, and mutation 3 re-run fails it.

**Everything else in the toolchain, all 15 suites:** 12 green. Two were **already failing identically
on `origin/main` `4a4d3984d4`, measured in a separate clean worktree and not a stash** —
`id-collision` 69/1 and `register-merge-coverage` 49/1, both before and after this change. Neither is
caused here and neither is quoted as this change's number. Both are live-corpus calibration
assertions that go red when the corpus they measure improves; they are filed separately rather than
touched.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged by
  exit code, with `tsconfig.tsbuildinfo` removed first.
- `npx eslint` over all four changed files — clean.

## Rollout Plan

Merge to `main`. No runtime rollout: these are developer scripts, run by agents and by the
`execution-queue-toolchain` workflow. They are in no image, no route and no bundle, so nothing is
deployed and no revision changes.

## Deployment Authority

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no image is built from this change
- ACA runtime invariant: to be asserted after merge only to show the merge did not move the shared
  runtime, not as evidence that anything here is live
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no runtime artifact and no product surface

## Rollback Plan

Revert the squash. No migration, no data, no state: the two functions are pure and the register is
read, never written, by anything changed here. A revert restores the previous grammar, which is a
gate that over-holds — safe in the direction that matters, since it refuses too much rather than too
little.

## Audit Evidence

- PR for this record, and the `execution-queue-toolchain` workflow run on it — all 15 suites.
- The claim line for `T-498` in the append-only register, which carries the same figures.
- The pinned replay command in **QA / Validation** reproduces the before state on the real register
  at any time, because the register is append-only and the cited lines do not move.

## Known Gaps

**One conflicting line remains on the replayed known positive, and after this change it is a correct
refusal rather than a defect.** The second of the two lines is a post-release amendment: its message
begins `CORRECTION to my release line above`, but its machine-generated head says
`item <id> claimed`, because the writer offers only `claim`, `release` and `abstain` and an
amendment is none of the three. So the register reads it as a claim, and the deliberate and tested
rule that *an agent's own earlier release does not free a claim it wrote afterwards* — which exists
so a genuine re-take still holds — keeps it holding.

Freeing it would need the reader to recognise amendment prose, which is a second reader over
register vocabulary and a decision about that vocabulary, not a bug fix. **Two such lines exist in
the whole 1,987-line register and both are explicit corrections to a release.** Recommendation, for
whoever holds the decision: give the writer a fourth action for an amendment that inherits the
announcement of the line it amends, rather than teaching the reader to guess. Filed as a decision,
not guessed at here.

The second fix reduces the cost of the residual either way: the refusal now names the path, the line,
the stamp and the holder, so the case above is a glance instead of a diagnosis.
