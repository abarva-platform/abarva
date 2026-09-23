# 2026-09-23-exec-claim-gate-negated-subject-veto — Claim gate: a sentence denying an item is claimed no longer claims it

## Release ID

`2026-09-23-exec-claim-gate-negated-subject-veto`

## Status

`candidate`

## Plain-English Summary

The execution register is the append-only file agents use to say which backlog item each
one is working on, so two agents do not start the same piece of work. A pre-claim gate reads
that file and answers one question: is this item already taken?

It read the cue `item <id>` as "somebody has this". But the register uses the very same words
to hand an item **back** — `that is items T-707 and T-708, both still unclaimed`,
`Items **T-713** filed and left unclaimed`. So the sentence announcing an item is AVAILABLE
was locking it for the full three-hour window, and the more conscientiously a run handed work
on to the next one, the more it took with it.

This change adds a veto: when the words immediately after an id say it is not claimed, that
mention no longer holds it. Three properties make this a repair rather than a hole:

- It works per **mention**, never per line. A line that genuinely claims an item at its head
  and quotes the negated sentence later keeps its claim.
- Its reach is **bounded and measured** — at most six words past the id, stopping at the first
  clause break. The two live forms need five words and four; a rule demanding the words be
  adjacent would have missed both.
- The negator vocabulary is **counted off the real file**, not brainstormed. A fourth candidate
  that occurs zero times was dropped after a mutation deleting it survived the suite.

The id-matching rule itself is untouched, exactly as in the two preceding changes to this gate,
so movement on the real register is attributable to this veto alone.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only execution tooling; it ships no
product behaviour and no client-visible surface.

None of the four product layers. This is repository tooling under `scripts/exec/` used by
execution agents to coordinate with each other. It imports nothing from `src/`, nothing in
`src/` imports it, and no signed-in surface can reach it.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `CLAIM_STATE_NEGATOR`, `NEGATION_REACH_TOKENS`,
  `CLAUSE_BREAK`, `governedTail`, `deniesClaim`; one guard added to `itemSubjects`.
- `scripts/exec/register-time-authority.test.mjs` — 18 new behavioural cases.
- This release record.

No workflow change: `.github/workflows/execution-queue-toolchain.yml` already runs this
contract on every pull request touching `scripts/exec/**`, so the control is CI-proven to run
rather than merely to exist.

## QA / Validation

**Red first, over the same scope.** Clean baseline on `origin/main` `f6e5eacc9`, both files
taken from that ref: **122 passed, 0 failed**. With the new cases and no fix: **4 failed** —
and only the veto assertions failed; every guard and negative control passed unrepaired, which
is what they are for. After the fix: **140 passed, 0 failed**.

**Mutation proof — 14 deliberate breaks, 14 caught.** Veto call removed (9 fail); reach 7
(1); reach 5 (2); reach 3 (7); clause-break truncation deleted (1); comma treated as a break
(2); leading-markdown strip removed (1); `continue` changed to `break` (1); `unclaimed`
dropped from the negator (6); veto made whole-line instead of positional (6); `not claimed`
dropped (2); the optional `yet` removed (1); `never claimed` dropped (1); case-insensitive
flag removed (1).

Three of those were escapes that the first draft of the suite did not catch, and each is
recorded in the suite at the point it applies, because a test that passes through the wrong
branch cannot fail for the right reason:

1. Deleting the clause break survived twice. The control asserting it had no complete negator
   on the far side of the break and inside the reach, so the reach alone accounted for its pass.
2. Dropping `no longer claimed` from the negator survived. It occurs **zero** times in the real
   register — an alternative no test on this file can constrain. It was removed from the rule
   rather than given a synthetic case.
3. Dropping the case-insensitive flag survived. The register shouts `UNCLAIMED` constantly but
   never yet within reach of a subject-position id, so that one case is synthetic and is
   labelled as synthetic in the suite rather than dressed up as a transcription.

**Movement on the real register, measured before and after.** 444 distinct ids evaluated at
three instants = 1332 probes. **3 changes, 1 of them a verdict flip:**

| probe | before | after |
|---|---|---|
| T-707 at 2026-09-22T21:10Z | `held-by-another`, holder line 1881 | `take` |
| T-713 at 2026-09-23T00:15Z | `take`, holder line 1963 | `take`, no holder |
| T-713 at 2026-09-23T01:35Z | `take`, holder line 1963 | `take`, no holder |

The first is this item's own filed real positive, reproduced by execution on the live file:
line 1881's only words about T-707 declare it unclaimed, and it refused the item to the run
that came for it. The other two are reason-only: that line also opens with a release verb, so
its verdict was already `take` for a different reason.

**Nothing genuinely held was freed.** No other id moved in either direction across 1332 probes,
and the run's own live claim on T-709 still resolves `already-yours`.

**Other gates.** `node scripts/exec/append-claim.test.mjs` 50/0.
`node scripts/exec/build-execution-queue.test.mjs` 140/0.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit **0**.
`npx eslint` on both changed files exit **0**.
`npm run audit:test-ci-coverage:check` exit **0**, census matches.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `scripts/exec/` ships in the web image or
any worker image, and no product surface imports it. The repo-owned ACA main deploy workflow
will build and deploy the merge commit as it does every merge; that deploy carries no behaviour
from this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none; no `az` command is run by this change
- Approved image digest: unchanged by this release
- ACA runtime invariant: to be re-proven after the post-merge deploy as routine, not because
  this change alters the runtime
- Worker image invariant: unchanged
- Feature/env flag update path: not applicable
- Live signed-in proof required: **no**, and structurally rather than by exemption — no route,
  component or API handler imports `scripts/exec/*`, so there is no signed-in surface that
  could exercise this code

## Rollback Plan

Revert the merge commit. There is no migration, no data write and no runtime state; the gate
returns to reading a denial as a claim, which is the defect this repairs.

## Audit Evidence

- PR: recorded on the claim line in the execution register
- CI: `Execution queue toolchain / Execution queue behavioral contract`, which runs
  `register-time-authority.test.mjs` on this diff
- Red/green and mutation numbers: in the PR body and in **QA / Validation** above
- Before/after movement table: reproducible against the live register with the two module
  versions and the three instants listed

## Known Gaps

- The veto reads English, and English has more ways to deny a claim than three. The vocabulary
  is deliberately the forms the real file actually writes, counted; a form nobody has written
  yet will not be recognised until somebody writes it.
- One case in the suite is synthetic and says so: the upper-case negator. It exists only
  because dropping the case flag was otherwise unconstrained.
- The reach is six words. A denial further from its id than that will still hold the item. The
  suite pins the bound from both sides so any future widening is a deliberate, attributable
  change rather than a drift.
