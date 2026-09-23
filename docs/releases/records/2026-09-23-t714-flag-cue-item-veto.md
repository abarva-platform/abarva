# 2026-09-23-t714-flag-cue-item-veto — The claim gate stops reading a quoted command-line flag as a claim

## Release ID

`2026-09-23-t714-flag-cue-item-veto`

## Status

`candidate`

## Plain-English Summary

Several agent lanes work this repository at the same time, and the rule that keeps
them apart is one owner per backlog item. Before a lane starts work it asks a gate
whether any other live record already holds the item it wants. The gate reads those
records out of ordinary prose, because most of them are written as prose.

The gate looked for the English phrase `item <id>`. A command-line flag is spelled
the same way — `--item <id>` — so a record that quoted the gate invocation it had
just run was recorded as *holding* the id it named. Nothing in such a sentence
asserts anything about the id at all; it is a transcript of a check.

That has a perverse shape, which is why it is worth a change of its own: the more
carefully a lane documents which checks it performed, the more ids it locks for
the full three-hour liveness window. It is not hypothetical. The same id was
refused to three consecutive runs by two different records, each of whose only
mention of it was a quoted invocation. Each run then had to read the named record
by hand to discover the refusal was spurious.

This change teaches the gate that cue. The word `item` counts as the English cue
unless a hyphen sits immediately in front of it whose own left neighbour is not a
word character — which is what a flag looks like and what an English compound such
as `line-item` does not. The legacy record form `- item 21 | agent` has a space
between the dash and the word and is untouched.

The rule is deliberately exact rather than heuristic, and it is confined to the
veto layer: the phrase matcher itself is not widened or narrowed, so the movement
below is attributable to this one rule.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only execution tooling; no client-facing
surface, no control-plane behaviour, no data plane.

- **Layer 4 (Products):** none. No product surface, route, component or tenant read
  path is touched. Nothing under `src/` imports `scripts/exec/*`.
- **Layer 3 (Canonical model):** none. No schema, migration, read model or tenant
  data is read or written.
- **Execution toolchain (outside the four-layer model):** the pre-claim ownership
  gate agent lanes run before they take work. Advisory tooling only; it does not
  gate CI, deploys or product behaviour.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: yes — agent execution tooling only.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/exec/register-time-authority.mjs` — adds `ITEM_FLAG_CUE` and applies the
  veto inside `itemSubjects`. The phrase matcher `ITEM_SUBJECT` and `splitItemId`
  are deliberately unchanged, so the measured movement is attributable to the veto
  alone.
- `scripts/exec/register-time-authority.test.mjs` — eleven new assertions: the two
  real known positives transcribed from the live register, the short flag spelling,
  five negative controls covering every genuine record form, and an end-to-end pair
  through the real CLI that moves one id and holds the other.
- This record.

## QA / Validation

Measured against a clean baseline over the same scope, on the same machine.

**The suite.** `node scripts/exec/register-time-authority.test.mjs`

- Baseline on `origin/main` (`2177158b7`): **111 passed, 0 failed**.
- With the new cases and no fix: **118 passed, 4 failed** — the four that name the
  defect. The other seven new assertions are negative controls and pass either way,
  which is what they are for.
- With the fix: **122 passed, 0 failed**.

**The positives are real, not invented.** Both are transcribed from live records
rather than composed: one mentions the id once inside a quoted invocation, the
other mentions it twice inside two, while genuinely claiming a different id. The
third assertion in that block asserts the second record still holds what it
actually claimed, so a rule that simply stopped reading that record would fail
here.

**Sibling suites, unchanged by this work and re-run to prove it:**
`append-claim.test.mjs` 50/0, `build-execution-queue.test.mjs` 140/0,
`build-source-board.test.mjs` 23/0.

**Mutation testing — seven deliberate breaks, seven caught.**

| # | Mutation | Result |
|---|---|---|
| M1 | veto removed entirely | 4 failed |
| M2 | the non-word-character requirement dropped | 1 failed |
| M3 | a space required in front of the hyphen instead of any non-word character | 4 failed |
| M4 | every match vetoed | 17 failed |
| M5 | the end anchor dropped | 1 failed |
| M6 | the veto inverted | 21 failed |
| M7 | the slice moved one character so the hyphen is never seen | 4 failed |

An eighth mutation is recorded rather than omitted, because it is the more useful
result. The first draft wrote the cue as one *or two* hyphens, to spell out both
flag spellings. Widening that to three survived the suite, and no test could have
caught it: the character class in front already admits a hyphen, so a run of any
length matches on its last character. The quantifier was redundant, not untested.
It was removed rather than pinned, and the reasoning is in the source comment.

**Movement on the real register, not on a fixture.** The item asks how many live
ids change verdict. Measured over one snapshot with the pre-change module and the
post-change module, same register, same probe identity, same instant:

| | before | after |
|---|---|---|
| live ids read in subject position | 16 | 16 |
| ids whose verdict changes | — | **1** |

The one is the id the defect was blocking: `held-by-another` before, `take` after,
previously held by a record whose two mentions of it were both quoted invocations.
No id became held that was not held before. Every other live hold is unchanged,
confirmed through the real CLI: the record this run wrote still reads as held by
this run to a stranger, and as `already-yours` to itself.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty
false` — **exit 0**, judged by exit code, not by grep.
**Lint:** `npx eslint` on both changed files — exit 0, no findings.

## Rollout Plan

Merge to `main`. No runtime rollout: these are developer-side scripts and nothing
under `src/` imports them, so no image content changes and no deploy is required
for the change to take effect for the lanes that run it.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change.
- Shared runtime mutators: none. No `az` command of any kind was run.
- Approved image digest: not applicable — no runtime image content changes.
- ACA runtime invariant: not asserted and not claimed by this record.
- Worker image invariant: not asserted and not claimed by this record.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is structural rather than a
  deferral — nothing under `src/` imports `scripts/exec/*`, so no signed-in surface
  can observe this change.

## Rollback Plan

Revert the PR. The change is one constant and one guard clause inside one exported
function in one script; reverting restores the previous reading exactly. No
migration, no state, nothing to unwind.

## Audit Evidence

- PR and its CI run, including the `Execution queue behavioral contract` job, which
  runs this suite in the hosted tree.
- The before/after and mutation figures above, each reproducible by running the
  named commands against `origin/main` and against this branch.

## Known Gaps

- **Only the `item` cue is covered, and only in its bare-flag spelling.** An
  equals-joined form would not have matched the phrase matcher in the first place,
  so it needs nothing here; but that is a property of the matcher, not a guarantee
  this veto provides.
- **This does not repair the sibling defect where a sentence that denies a state is
  read as asserting it.** That item is open and unclaimed. It is a different shape —
  a sentence that asserts the opposite, rather than one that asserts nothing — and
  it is deliberately untouched here so the movement above stays attributable.
- **The measurement is one snapshot.** The register is appended to concurrently by
  several lanes, so the figures describe the live window at the instant they were
  taken, not a stable population.
