# 2026-09-22-t700-body-declared-blocker-precedence — A backlog item's own body outranks a claim-log line when the two disagree

## Release ID

`2026-09-22-t700-body-declared-blocker-precedence`

## Status

`candidate`

## Plain-English Summary

The internal execution board reads two kinds of evidence about each backlog item: the item's
own row, and the append-only run log that agents write while they work. It derives a single
"what is this blocked on" label from them.

Those two can disagree, and until now the label was decided by the order of the detection
rules rather than by which evidence it came from. The rule for "someone still owes a
signed-in check" is first in the list, so whenever a run-log line happened to carry that
phrase, it took the label away from a gate the item itself declares in its own row.

The effect is that an item can be pushed into the wrong bucket by a *neighbouring* item's
paperwork. Measured on the live register before this change, 22 items were in that state.
One of them is an open item whose row asks a question in bold, and which was filed under
"someone owes a signed-in check" purely because an unrelated release note named it. An owner
scanning for questions to answer could not see it.

After this change, a gate the item's own body declares wins, regardless of where its rule
sits in the list. A rule that matches only the run log is still used when the item's own row
declares nothing, which is the common case and is unchanged.

One rule is deliberately excluded: the fallback that simply means "unclaimed". That asserts
the *absence* of a gate rather than one, and promoting it would move an item out of the
never-claim bucket — the one direction this generator must never take. A live row whose body
reads "the largest unclaimed critical row in the census" is prose about a census, not a
status, and it is pinned by a test.

## Layer Impact

Release lane: `internal-admin`.

None of the four product layers. This is internal operator tooling under `scripts/exec/`.
Nothing under `src/` imports it, it is in no container image, and no Container App reads it.
It does not touch tenant data, the canonical model, any product surface, or any adapter.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — the agent execution board and claimable queue
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/build-source-board.mjs` — `BLOCKER_RULES` entries that represent a real owner
  gate are tagged `ownerGate`; the fallback is not. `deriveBlocker` now short-circuits on a
  rule that matches the item's body and holds a claim-only match as a fallback, instead of
  returning the first rule that matches the combined corpus.
- `scripts/exec/build-execution-queue.test.mjs` — five behavioral cases (section 24), each
  built with body and claim line in genuine disagreement.
- No migration, no route, no workflow, no dependency change.

## QA / Validation

`node scripts/exec/build-execution-queue.test.mjs`, same suite on both sides:

| | result |
|---|---|
| before the fix, new cases present | **119 passed, 3 failed** |
| after the fix | **122 passed, 0 failed** |

The three that fail first are the defect cases. Two of the five new cases pass on unfixed
code by design — they are the guardrails an over-broad fix breaks.

Four deliberate mutations, each confirmed to have actually modified the file before the
suite was run (a substitution that silently matches nothing reports a clean mutation and is
worth nothing):

| deliberate break | result |
|---|---|
| drop the `ownerGate` guard — promote any body match | **1 failed** |
| `Blocked` stops being an owner gate, so only the decision rule gains precedence | **1 failed** |
| stop reading the claim log at all — the obvious wrong fix | **4 failed** |
| revert to first-match-wins | **3 failed** |

**Blast radius, both generators run over byte-identical frozen copies of the same four
operator documents, with the same structure map, input checksums re-verified unchanged after
both runs:**

| | count |
|---|---|
| unchanged blocker | **389** |
| blocker changed | **22** |
| ids lost | **0** |
| ids newly present | **0** |
| derived rung changed | **0** |

All 22 move in one direction, from a claim-derived label to one the item's own row declares:
15 to `Decision needed`, 7 to `Blocked (see source)`.

**The number the acceptance asks to pin:** claimable **0 before, 0 after**; total blocked on
the owner **147 before, 147 after**. Nothing entered or left the never-claim bucket; only its
internal composition changed (`Signed-in acceptance owed` 79 → 72, `Blocked (see source)`
21 → 23, `Decision needed` 42 → 47).

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit **0** with an
empty diagnostic file, judged by exit code and not by grepping, after removing
`tsconfig.tsbuildinfo`. `npx eslint` on both changed files exit **0**.

## Rollout Plan

Merge to `main`. No runtime rollout: these scripts are operator tooling and run on an
operator's machine and in the repository's own CI job, never in the deployed product.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this PR
- Shared runtime mutators: none — this PR changes no Container App, image, flag, env var,
  scale setting, secret or traffic weight
- Approved image digest: not applicable; no runtime image is built from or changed by this PR
- ACA runtime invariant: unaffected. The merge rides the repo-owned workflow like any other
  commit and the invariant is verified after merge as a matter of course, not because this
  change requires it
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and the reason is structural rather than a judgment
  call — nothing under `src/` imports `scripts/exec/*`, it is in no image, and no Container
  App reads it, so a signed-in check would prove nothing about this change

## Known Gaps

- **The `Blocked (see source)` rule is still a bare word match, and body precedence now gives
  it more reach.** Seven items move to that label because the word appears in their own row.
  Each of the seven was read before this shipped and each is a real use — one opens
  `BLOCKED ON OWNER DECISION` in bold, another states that queue generation is blocked by an
  unplaced id — so the label is an improvement on all seven today. But the rule has no veto
  clause, unlike the decision rule beside it, so a future row saying "this is not blocked"
  would now be labelled from its body rather than from the log. This PR does not widen or
  narrow any pattern, deliberately; tightening that rule is separate work and is filed.
- **The rung is derived from a corpus that mixes the same two kinds of evidence, and that
  half is untouched.** `deriveRung` reads attributable status text together with claim-log
  statuses. Measured while validating this change, `T-598` — an item whose own row declares
  an open question — reads rung `Signed-in proven`. This PR corrects the *blocker* axis for
  that item and leaves the *rung* axis reading as before. Filed as a separate item rather
  than fixed here, because changing rung derivation moves items between released,
  in-flight and claimable buckets, which is exactly what this change was required to pin.
- **The precedence is evidence-based, not correctness-based.** If an item's own row states a
  gate that has since been satisfied, the row now wins over a run-log line that records the
  satisfaction. That is the intended direction — a stale row is visible and editable, a
  stale log line is append-only and permanent — but it is a trade, not a free win.

## Rollback Plan

Revert the single commit. There is no migration, no data write and no runtime state, so the
revert is complete on merge. The board is regenerated on every run from the operator
documents, so the previous labels return the next time it is generated.

## Audit Evidence

- The PR and its CI run, including the job that executes
  `scripts/exec/build-execution-queue.test.mjs` and prints each new case by name
- The before/after suite counts and the four mutation results recorded above
- The blast-radius table, reproducible by running both generators against frozen copies of
  the operator documents with the same structure map
