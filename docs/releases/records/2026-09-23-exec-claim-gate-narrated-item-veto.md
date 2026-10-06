# 2026-09-23-exec-claim-gate-narrated-item-veto — An id a line only narrates is not an id it holds

## Release ID

`2026-09-23-exec-claim-gate-narrated-item-veto`

## Status

`candidate`

## Plain-English Summary

Automated runs coordinate through a shared, append-only work register. A run writes a line saying
it has taken a numbered work item; a gate reads the register before the next claim is written and
answers whether that item is free. The gate decides which item a line has taken by reading the
cue `item <id>`.

Lines do not only claim items, though — they also talk about them. A run surveying the board
writes that another run merged an item, or that a piece of work is already filed as an item
somewhere else. Those sentences name an id precisely because it belongs to somebody else, and the
gate read every one of them as a claim. The consequence is a run being refused work that nobody
holds, on the authority of a line whose own sentence says the id is not its own.

This adds a veto for the two shapes the register actually writes: a third-party subject in front
of the verb ("another run merged item X"), and a copular cross-reference ("that is item X", "the
placement is already item X"). Both are read per occurrence, so a line that claims one item and
narrates another keeps the one it claimed.

The option of keying on the verb alone was rejected by measurement rather than by preference: the
past-tense announcement verb appears five times in the register and four of those are a run
announcing its **own** merge. A verb rule would have freed four genuine records while their
authors were still proving a deploy — a false pass, which is the worse direction.

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

- `scripts/exec/register-time-authority.mjs` — a new veto in the veto layer, consulted by
  `itemSubjects` alongside the existing flag-cue and negated-subject rules. Two cues: an adjacent
  copula (`is`/`are`, optionally `already`) immediately introducing the id, and a third-party
  subject (`sibling`, `another`, `other`, `else`) followed by at most two words and then a verb
  (`merged`, `claimed`, `holds`/`held`, `closed`) immediately introducing the id. Backticked spans
  in the text in front are reduced to one word so the two-word bound counts words rather than the
  length of whoever's run id sits in the middle. **`ITEM_SUBJECT` itself is untouched**, as in the
  three vetoes before it, so movement on the real register is attributable to this rule alone. No
  other export, CLI flag, exit code or audit rule changed.
- `scripts/exec/register-time-authority.test.mjs` — thirty-two new behavioural cases: six real
  positives quoted from the register with their line numbers, a guard beside each one proving the
  same line still holds what it claimed, the control that rejected the verb-vocabulary option, six
  negative controls over every genuine claim form the register writes, both bounds pinned from
  both sides, and two end-to-end cases driving the real CLI over a fixture register.

## QA / Validation

Measured over the same scope (this one suite), against a clean baseline taken from `origin/main`
`064ee1b2b316a861ca595555baa2bc078dda0064`:

| | result |
|---|---|
| Baseline on `origin/main`, before any change | **150 passed, 0 failed** |
| New cases added, fix not yet written (red first) | **167 passed, 12 failed** |
| After the fix, with the bound and anchor cases added during mutation | **182 passed, 0 failed** |

The twelve failures are new cases and nothing else; no pre-existing case changed state. The other
new cases are guards and controls that already passed before the fix — they are here so the fix
cannot be over-applied, and every one of them fails under at least one mutation below.

**Mutation proof — the guard can fail.** Eighteen mutations were applied to the shipped code, the
suite re-run against each, and the code restored from a pre-mutation copy and re-verified at 182
passed, 0 failed. Seventeen were caught. The failure counts:

| mutation | result |
|---|---|
| copular branch removed | 176 / **6 failed** |
| third-party branch removed | 175 / **7 failed** |
| copula loses its optional `already` | 180 / **2 failed** |
| copula un-anchored (a reach instead of adjacency) | 180 / **2 failed** |
| copula loses `are` / loses `is` | 181 / **1** · 177 / **5** |
| verb set loses `merged` / `claimed` / `holds` / `closed` | 178 / **4** · 181 / **1** · 181 / **1** · 181 / **1** |
| subject set loses `sibling` / `another` | 179 / **3** · 178 / **4** |
| backtick reduction removed | 179 / **3 failed** |
| two-word bound narrowed to one / widened to three | 178 / **4** · 181 / **1** |
| verb end-anchor removed | 181 / **1 failed** |
| veto never applied | 169 / **13 failed** |

Three mutations survived a first draft and were fixed rather than dropped, which is why the shape
of the rule changed mid-flight. The first draft bounded the third-party reach in **characters**
(`[^.]{0,40}`), and three separate mutations survived it: removing the backtick reduction,
narrowing the bound to 20, and widening it to 80. All three survived for one reason — a bound
measured in characters is not a property of the grammar, so no fixture can constrain it. Replacing
it with the two-word token bound the path-attribution rule already uses made the reduction
load-bearing and both bound directions falsifiable. A fourth survivor, removing the anchor that
requires the verb to be the one immediately introducing the id, was an unreached branch and is now
pinned by a case where a line mentions a sibling's merge and then takes an item of its own.

**Measured on the real register, not only on fixtures.** Both versions were run over the live
operator register with a neutral probe identity, replaying every stamp the register carries:

| scope | evaluations | changes |
|---|---|---|
| ids read in subject position anywhere in the register | 246 | — |
| replay at all 744 register stamps, 3-hour window at each | 183,024 (item, moment) pairs | **44** |
| register lines that stop holding an id | 872 | **3** |
| register lines that start holding an id they did not hold | 872 | **0** |

The three lines are exactly the real positives, and each keeps the id it actually claimed. The 44
changed pairs are four distinct transitions across two ids, and neither id had a live claim:

- One id was claimed, merged and then handed back **by its own author** within twenty-six minutes.
  A different run narrated that merge nineteen minutes later. Under the old gate that narration
  became the holder, so for two minutes the refusal pointed at the wrong run, and after the real
  author's hand-back the narration went on locking the item for the rest of the window. After the
  change the refusal points at the genuine claim while it is live, and the author's own hand-back
  frees it. Two pairs correct the attribution; one frees a stale refusal.
- The other id was claimed, merged and released by its author in the morning, then named in
  narration twice by a different run nine hours later. Twenty-four pairs move from a refusal to
  "take"; seventeen more correct the holder on a verdict that was already "take".

No pair moves in the other direction, and no genuine claim is freed.

**The earlier vetoes still hold.** The negated-subject positives, the flag-cue positives, the
per-occurrence guard that keeps a head claim on a line quoting a negation, the hand-back
author-scoping protections and the whole file-overlap half are unchanged and green within the 182.

Also run: the three sibling suites under `scripts/exec/` (`append-claim` 50 passed,
`build-execution-queue` 140 passed, `build-source-board` 23 passed); `npx eslint` over both changed
files, exit 0; `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` judged by
exit code, exit 0; `node scripts/release-check.mjs --base origin/main --head HEAD`.

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

Revert the single commit. The behaviour change is confined to one veto consulted by one function
in one script; a revert restores the prior resolution exactly. No migration, no data change, no
runtime effect.

## Audit Evidence

- The pull request for this record, its CI checks, and the `execution-queue-toolchain` job running
  `node scripts/exec/register-time-authority.test.mjs`.
- The three suite measurements and all eighteen mutation results above, reproducible from the
  commit.
- The before/after register replay above, reproducible by running both versions of `itemSubjects`
  and `resolveItemClaim` over any register file.

## Known Gaps

- **One surviving mutation, reported rather than hidden.** Loosening the separator between the
  third-party subject and the words after it, from "one or more spaces" to "a word boundary and
  any spaces", changes no test result. The two spellings differ only where a subject word abuts
  punctuation — a hyphenated compound, or a comma immediately after it — and the register writes
  neither. The stricter spelling is kept because it matches the path-attribution rule word for
  word and because the narrower veto is the safer direction, but no fixture on this register can
  distinguish the two, and an invented one would be pinning a behaviour rather than proving it.
- **The copular voice is now unavailable for a genuine claim.** A run that wrote its own claim as
  "the work I am taking is item X" would read as narration and would not hold it. No line in the
  register has ever been written that way, and the sanctioned claim writer composes
  `item <id> claimed`, so the remaining path to it is an operator writing it by hand in a voice
  the protocol does not use. Recorded as a limit rather than left implicit.
- **The vocabulary is small on purpose.** Only one of the four third-party verbs has a real
  positive on this register today; the other three are pinned by cases that are labelled synthetic
  in the suite. An explicit-agent form after the id (`item X held by <agent>`) is deliberately not
  handled, because for items the register writes that form after the id rather than in front of
  it, and an alternative no fixture can reach is one a mutation deletes and survives.
- **Both real positives had aged out of the live window** before this was taken, so they are
  asserted against the clock-free subject reader with the text and line numbers they carry, and
  proven end to end through the CLI on equivalent fixtures. At the moment of the measurement, zero
  lines in the live window held a narrated id.
