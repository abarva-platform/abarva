# 2026-09-23-release-author-scope — A release frees only its own author's claim

## Release ID

`2026-09-23-release-author-scope`

## Status

`candidate`

## Plain-English Summary

Automated runs coordinate through a shared, append-only work register: a run writes a line saying
it has taken an item, and writes another line later saying it has handed the item back. A gate
reads that register before a new claim is written and answers whether the item is free.

The gate has two halves, and they disagreed about one thing. The half that checks *files* keys a
hand-back by the identity that wrote it — so a hand-back releases the records of its own author
and nobody else's. The half that checks *items* looked only at the newest line naming the item and
honoured any hand-back on it, whoever wrote it. So if run A held an item and run B wrote a line
announcing that item released, the gate reported the item free and handed A's live claim to the
next run that asked for it.

This makes the item half key hand-backs by author, exactly as the file half already does. A
hand-back written by someone other than the holder is skipped rather than answered from, so the
newest line that actually asserts ownership still decides. A run's own hand-back still frees its
item immediately, which is what keeps finished work from locking for the rest of the window.

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

- `scripts/exec/register-time-authority.mjs` — `resolveItemClaim` now builds a per-author
  hand-back map over the live lines naming the item, filters out every record its own author has
  since handed back, and resolves the holder from what remains. The unconditional
  "newest line announces a release, therefore take it" branch is gone. No other export, CLI flag,
  exit code or audit rule changed. **The file half is untouched**, as the item requires.
- `scripts/exec/register-time-authority.test.mjs` — ten new behavioural cases, each driving the
  real CLI as a child process over a fixture register and reading its exit status.

## QA / Validation

Measured over the same scope (this one suite), against a clean baseline taken from `origin/main`
`035c567a1560baf5d97a5c9753c39b5fbc91392e`:

| | result |
|---|---|
| Baseline on `origin/main`, before any change | **140 passed, 0 failed** |
| New cases added, fix not yet written (red first) | **144 passed, 4 failed** |
| After the fix | **150 passed, 0 failed** |

The four failures are new cases and nothing else; no pre-existing case changed state. The other
six new cases are guards and controls that already passed before the fix — they are here so the
fix cannot be over-applied, and three of them fail under the mutations below.

**Mutation proof — the guard can fail.** Each mutation was applied to the shipped code, the suite
re-run, and the code restored from a pre-mutation copy and re-verified at 150 passed, 0 failed.

1. *Key the hand-back map on a constant instead of on the author* — the defect itself, scoped to
   the item half only. Result: **146 passed, 4 failed**: a foreign hand-back frees the item, the
   refused run is pointed at the wrong holder, the exit status goes to zero, and a sibling run's
   hand-back frees the claim.
2. *Let a hand-back free its author's records at any stamp, not only earlier ones* — Result:
   **148 passed, 2 failed**: an author that handed an item back and then took it again is reported
   as holding nothing.
3. *Do not filter at all — newest line wins, as before* — Result: **143 passed, 7 failed**,
   including the pre-existing case that a handed-back item is free again for the next run.

**Measured on the real register, not only on fixtures.** Both versions of `resolveItemClaim` were
run over the live operator register with a neutral probe identity:

| scope | evaluations | verdicts that change |
|---|---|---|
| the live 3-hour window as of `2026-09-23T02:24:48Z` | 7 items | **0** |
| replay at all 739 register stamps, 3-hour window at each | 10,154 (item, moment) pairs | **6 distinct item/verdict transitions** |

Nothing in flight at merge time changes verdict. Every one of the six historical transitions moves
from "take" to a refusal or an advisory — that is, in each the old gate would have handed a live
claim away. Four are genuine protections, where a hand-back by one identity sat newest over a
different identity's live claim. The remaining two are a *pre-existing* over-reach of the
subject-position rule that this change makes visible rather than causes: on those two lines the
held id appears in narration about another run ("Sibling run `#…` merged item `<id>` at …",
"map placement is already item `<id>`"), and the reach rule reads a narrated mention as a claim.
That is a different defect, in a different function, and is filed as follow-up rather than fixed
here.

**T-706's and T-712's positives were re-checked and all hold** — the sibling refusal, the
own-claim resume, the foreign-lane refusal, the liveness window, the strict mode, every abstention
case, and the whole file-overlap half are unchanged and green in the 150.

Also run: the three sibling suites under `scripts/exec/` (`append-claim` 50 passed,
`build-execution-queue` 140 passed, `build-source-board` 23 passed);
`npx eslint` over both changed files; `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` judged by exit code; `node scripts/release-check.mjs --base origin/main --head HEAD`.

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
- Live signed-in proof required: **no** — no user-visible surface and no runtime path.

## Rollback Plan

Revert the single commit. The behaviour change is confined to one function in one script; a revert
restores the prior resolution exactly. No migration, no data change, no runtime effect.

## Audit Evidence

- The pull request for this record, its CI checks, and the `execution-queue-toolchain` job running
  `node scripts/exec/register-time-authority.test.mjs`.
- The three suite measurements and all three mutation results above, reproducible from the commit.
- The before/after register comparison above, reproducible by running both versions of
  `resolveItemClaim` over any register file.

## Known Gaps

- **One surviving mutation, reported rather than hidden.** Deleting the explicit
  `announcesRelease` skip from the filter changes no test result, because a hand-back line always
  carries its own author's hand-back stamp and is therefore already removed by the stamp rule. The
  line is kept because it states the intent and matches the file half word for word, but it is
  redundant with the rule below it and no fixture can distinguish the two.
- **The two halves now agree on authorship, and still differ on unit.** The file half frees an
  author's whole hold ("all files free"); the item half frees only the records naming that item.
  That is the register's own grammar in both cases, but it means an author holding two items and
  handing back one keeps the other item while its files are reported free. Unchanged by this
  change, and out of its scope by the item's own instruction.
- **A narrated mention still reads as a claim.** Two of the six measured transitions are that
  defect surfacing, not this one. Filed as follow-up.
- **Author identity is the exact register string.** Two runs of one scheduled task are different
  authors, which is deliberate; an author that changes its own identity string mid-flight cannot
  hand back what it wrote under the old one.
