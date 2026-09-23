# 2026-09-23-exec-claim-gate-uppercase-negator-positive — A fact the suite asserted in a comment becomes a check

## Release ID

`2026-09-23-exec-claim-gate-uppercase-negator-positive`

## Status

`candidate`

## Plain-English Summary

Automated runs coordinate through a shared, append-only work register. A gate reads that register
before a new claim is written and answers whether a numbered work item is free. One of its rules
frees an item whose line says the item is *not* taken — the register writes "unclaimed", "not
claimed", "never claimed" — and that rule is deliberately case-insensitive, because the register
also shouts those words in capitals.

The case-insensitive flag shipped with a single invented example line and a comment beside it
saying that no real register line exercised it. That comment was correct when written. It was also
unfalsifiable: nothing ran it, so nothing would notice when it stopped being true, and the whole
backlog this work belongs to exists because a control was once proved to exist by finding its name
in a file.

This re-measures the claim against the live register and replaces the comment with checks. The
answer is still no — the register has written 67 upper-case negator occurrences and not one of
them sits where the rule can read it — but the finding is now carried by five assertions over two
transcribed register lines rather than by a sentence. The invented line is deleted. The flag's
example is now real register text with exactly one word inserted, and the inserted word is named
in the check's own title.

No rule was widened. No reach, vocabulary, or pattern changed. The one behavioural file in this
change gains a documentation paragraph and nothing else.

## Layer Impact

Release lane: `internal-admin`.

None of the four product layers. Internal execution tooling only: one Node script under
`scripts/exec/` and its behavioural suite. No product surface, no canonical model object, no
adapter, no intake tab, no database read or write, no model prompt, no runtime import.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent/operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.test.mjs` — the invented case `item T-814 remains
  UNCLAIMED` is removed and five checks replace it, built on two verbatim register transcriptions.
  Two assert that the shouted form the register actually writes frees the ids it names; one is a
  differential that deletes the shout and shows no verdict moves, which is what distinguishes
  "free because the rule read the shout" from "free because the rule never looked"; and two carry
  the flag itself, on the same real line with the subject cue `items` inserted.
- `scripts/exec/register-time-authority.mjs` — a documentation paragraph recording the
  measurement, its date, and the structural reason for the zero. **No executable line changed.**

## QA / Validation

### The measurement, and how it was made falsifiable first

`itemSubjects` was run over every non-empty line of the register twice: once from the shipped
control, once from a byte-identical copy whose only difference is the dropped `i` flag on the
negator. Any id present in the second output and absent from the first is a line the flag frees.
The register was frozen to a local copy before measuring, and its last stamped line at that moment
was `2026-09-23T03:45:37Z`; the counts below are that snapshot, not a running total.

| | upper-case-bearing | lower-case |
|---|---|---|
| governed by a subject-position id | **0** | 8 |
| governed by a bare id mention | 14 | 18 |
| no id within reach | 53 | 130 |
| total occurrences | 67 | 156 |

Lines where the `i` flag changes a verdict: **0** of 1563, over 1263 subject-position occurrences.
The eight lower-case positives are register lines 152, 153, 171, 439, 1881, 1887, 1961 and 1963.

The zero was not believed until the detector had found a known positive. Three lines were appended
to a copy of the register — an upper-case denial, the same denial in lower case, and a genuine
claim — and the detector reported exactly the first and neither of the others. Truth for that
control came from outside the thing under test: the lines were written for it and their answers
were known before it ran.

### Why the count is zero, which is the part worth keeping

The 14 in-reach shouts all govern a **bare** id mention (`T-703, T-705 and T-706 remain
UNCLAIMED`), and the subject rule keys on the literal word `item`/`items`, which a terse hand-back
tag does not write. So these ids are free for want of a subject cue; the negator never runs on
them, and its case therefore cannot be what freed them. Stated as a mechanism and not as a
significance claim: 8 of 156 lower-case occurrences are subject-governed, so under that base rate
0 of 67 is what a fair coin lands about three times in a hundred. The absence is measured; the
explanation is not established by this sample alone.

### Baseline, same scope

`node scripts/exec/register-time-authority.test.mjs`

- on `origin/main` `5566a8df0d3cbc16c996ce9583ff355a176fe3a3`: **182 passed, 0 failed**
- with this change: **186 passed, 0 failed** (one check removed, five added)

### Mutations — each new check shown able to fail, and which one catches what

| # | mutation | result |
|---|---|---|
| M1 | drop the `i` flag on the negator | **caught, by exactly one check** — the new `CASE` case on real text. Nothing else in 186 notices |
| M2 | subject rule no longer requires the word `item` | caught, 5 checks, two of them new (`REAL` line 1205, `THE REASON`) |
| M3 | remove the claim-state veto entirely | caught, 8 checks, one of them new |
| M4 | widen the negator vocabulary with `remain`, the move this item forbids | **caught, by exactly one check** — the new "shout removed DOES hold it" |
| M5 | clause-break truncation never fires | caught by a pre-existing check; no new check needed |
| M6 | bare ids become subjects **and** the reach shrinks 6→3 | caught, 12 checks, four of them new |

Two of the five new checks are the sole catcher of a mutation, and they guard the two things this
item is about: the flag, and the temptation to widen the rule instead of reporting the zero.

### Stated rather than left for a reader to find

`REAL — register line 1792 …` is the sole catcher of nothing. It fails under M6 and so is not an
unfailable check, but under M2 it survives because the veto frees the same ids by a second route.
It is kept as the transcription the flag's example is derived from and as the subject of the
differential, not as an independent guard, and it is described that way rather than counted as
one.

### Other checks

- `npx eslint scripts/exec/register-time-authority.mjs scripts/exec/register-time-authority.test.mjs` — exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — judged on the exit code
- `node scripts/exec/register-time-authority.mjs --file <fixture> --since <ISO>` audit path unchanged
- sibling exec suites: `append-claim.test.mjs`, `build-execution-queue.test.mjs`, `build-source-board.test.mjs`

## Rollout Plan

Merge to `main`. No runtime rollout: this is a developer/agent script, nothing imports it at
runtime, and it ships into the existing `execution-queue-toolchain` CI job that already runs this
suite.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on merge as usual; this
  change contributes no application code to the image.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: re-proven for the merge commit as standard practice; this change cannot
  alter it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no user-visible surface and no runtime path. Nothing
  under `src/` imports `scripts/exec/`, so no signed-in surface can observe this change. Stated as
  structural rather than as a deferral.

## Rollback Plan

Revert the single commit. No executable line of the control changed, so a revert restores the
suite's prior contents and nothing else. No migration, no data change, no runtime effect.

## Audit Evidence

- The pull request for this record, its CI checks, and the `execution-queue-toolchain` job running
  `node scripts/exec/register-time-authority.test.mjs`.
- The measurement table, the known-positive control, and all six mutation results above, each
  reproducible from this commit by diffing `itemSubjects` against a copy of the control with the
  flag dropped.
- The two transcribed register lines are quoted verbatim in the suite with their line numbers, so
  a reader can check the transcription against the register itself.

## Known Gaps

- **The measurement is a snapshot of an append-only file and will drift.** It is anchored to the
  register's `2026-09-23T03:45:37Z` line and stated as such. Nothing re-runs it: the suite cannot
  read the operator register in CI, by the same rule that keeps a control from taking its truth
  from its own subject. The next run that wants the number must measure again, and the method is
  written down above so that it can.
- **The flag's example is one word away from real, not real.** That word is `items`, it is named
  in the check title, and the paragraph above says why the register does not write it. This is the
  honest state of the evidence, not a gap that could be closed by choosing a different fixture.
- **The mechanism behind the zero is plausible, not established.** See the base-rate note above.
