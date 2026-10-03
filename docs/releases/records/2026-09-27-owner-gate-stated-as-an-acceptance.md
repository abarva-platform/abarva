# 2026-09-27-owner-gate-stated-as-an-acceptance — The board reads an owner gate written the way an acceptance writes one

## Release ID

`2026-09-27-owner-gate-stated-as-an-acceptance`

## Status

`candidate`

## Plain-English Summary

The execution board derives, for every backlog item, whether it is blocked on a
human. An item with no derived blocker and no shipping proof is what the
generated queue offers to the next agent as free work. So a gate the deriver
cannot read is not a cosmetic miss: it hands owner-only work to an unattended
agent.

Measured by running the generator over the live operator documents, the queue
offered **7 claimable rows and 3 of them named work an agent is forbidden to
do**. One row's own acceptance opens *"Owner decision, not agent work — do not
edit the required gate from a feature branch."* Two more direct a signed-in
product run, which the queue's own *Blocked on Anand* section says in as many
words an agent must not attempt. All three derived no blocker at all.

Two independent holes produced that, and each is a form the rule table had
simply never been shown:

**The decision rule requires an article before the word.** It matches "A product
decision" and "A disambiguation decision" through a bounded two-word slot after
`A`/`An`. A row that writes the role without an article — "Owner decision" — has
nothing to anchor on. The article is deliberately *not* made optional here:
making it optional would admit "The decision was taken in #8123", a descriptive
sentence the rule's own comment names as one that must stay out. What is added
instead is the categorical phrase the same sentence carries, `not agent work`.
There is no descriptive use of those three words: a row saying it is not agent
work is not describing anything, it is declaring who may act.

**The signed-in rule recognises only status phrasing.** It wants a word like
`pending`, `owed` or `not proven` near the token — which is how a *release line*
reports a proof gap. An *acceptance* states the same gate as an instruction and
carries no status word anywhere: "Run a signed-in phase build for one authorized
tenant", "Generate one deliverable …, signed in, and record". This is the same
miss that was already repaired one rule below, for the reason stated in that
rule's own comment: an acceptance is written in the imperative, so the gate in
one usually is too.

**This finding was already written down, twice, in prose.** The operator document
records it at 18:15Z and again at 19:15Z — "4 of the 6 are not agent-executable"
— with no control anywhere that acts on it. A narrated finding that repeats is
the shape this backlog exists to convert into something that runs.

**One bound was found by a failing guardrail rather than by reasoning, and it is
worth stating because it is not obvious.** The veto that keeps "a signed-in proof
is *not owed* here" from reading as a gate is applied to the sentence around the
**match index**, and that window ends at the first `.` or `;`. A match that
begins at an imperative 120 characters before the token therefore hands the veto
a window that can end *before* the token — so the first version of this change
matched that sentence unvetoed. The fix is to align the new branch's span with
the veto's own window by stopping it at a semicolon too. Widening the veto would
have been the wrong half to touch, because every branch above shares it.

## Layer Impact

**Release lane: `internal-admin`.** AbarVa-only execution tooling. No client
receives it, no product surface reads it, and nothing here runs inside a
deployed container.

- **Layer 1 — Client intake:** none.
- **Layer 2 — Source adapters:** none.
- **Layer 3 — Canonical model:** none.
- **Layer 4 — Products:** none. No route, component, prompt, read model or
  migration is touched. Nothing under `src/` imports `scripts/exec/*`.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes — the agent execution board and its generated queue.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/build-source-board.mjs` — two terms added to `BLOCKER_RULES`:
  `not agent work` on the decision rule, and an anchored, clause-bounded
  imperative branch on the signed-in rule that also admits the unhyphenated
  `signed in` spelling. No existing term is altered, removed or loosened.
- `scripts/exec/build-source-board.test.mjs` — eight cases (`C-563 (a)`–`(h)`)
  driving the real generator as a child process over fixture operator roots and
  reading the blocker it writes into `source-board-summary.json`.

No workflow file changes: `scripts/exec/build-source-board.test.mjs` is already
a step in `.github/workflows/execution-queue-toolchain.yml`, so the new cases
run in the existing required job on merge.

## QA / Validation

**Red first, then green, same eight cases, same command.**

- `node scripts/exec/build-source-board.test.mjs` on `origin/main`
  `d57a86f9b4`: **91 passed, 0 failed**.
- With the cases added and the generator untouched: **96 passed, 3 failed** —
  `(a)`, `(b)`, `(c)`. The other five are guardrails and pass on unfixed code by
  design; they are what an over-broad fix breaks.
- With both terms applied: **99 passed, 0 failed**.

**Seven mutations, seven caught**, each by the case written for it:

| # | Mutation | Case that failed |
|---|---|---|
| 1 | drop the `not agent work` term | (a) |
| 2 | drop the whole imperative branch | (b), (c) |
| 3 | drop the anchor from the imperative branch | (e) |
| 4 | widen the span to `[\s\S]` | (d), (f) |
| 5 | drop the semicolon from the span | (f) |
| 6 | read only the hyphenated `signed-in` | (c) |
| 7 | widen the phrase to `not \w+ work` | (g) |

**Measured on the live corpus, not argued.** The operator root was frozen to a
scratch copy at 2026-09-27T19:50Z (backlog sha256 `4a12db96…`) so nothing wrote
to the register and no sibling run could move the inputs underneath the
measurement. The scratch copy was first proven to reproduce the live baseline
blocker-for-blocker across all **652** ids — 0 differences — before either term
was applied.

The pair moves **4 items and no others**:

| id | rung | before | after |
|---|---|---|---|
| C-562 | 0 | `null` | `Decision needed` |
| U-525 | 0 | `null` | `Signed-in acceptance owed` |
| U-527 | 0 | `null` | `Signed-in acceptance owed` |
| U-401 | 0 | `Blocked (see source)` | `Signed-in acceptance owed` |

The fourth is a label refinement inside the never-claim bucket, and it is the
label that row's own acceptance names for itself ("this item carries them to
`signed-in acceptance`"). Both directions were checked rather than assumed:
**0 items whose rung moved**, **0 items that lost a gate**, blocked-on-Anand
**377 → 380** (+3, so nothing left that bucket), claimable **7 → 4**.

**Scoped regression, from a clean checkout of `origin/main` rather than a stash,
over `scripts/exec/*.test.mjs`: 2 failing before, 2 after.** Both are
`id-collision.test.mjs` and `register-merge-coverage.test.mjs`, one case each,
both pre-existing, both live-corpus calibration cases that read the register
rather than the board's rule table, and neither is touched by this change. A
third suite, `signed-in-proof-reconcile.test.mjs`, appeared to fail in the clean
checkout and does not: it asserts over real files under `docs/releases/records`,
which a `scripts/exec`-only archive does not contain. Run in a full checkout it
is **127 passed, 0 failed** before and after.

- Node 24 typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
  --pretty false` after deleting `tsconfig.tsbuildinfo`, judged on exit code.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. No runtime rollout: the changed files are operator scripts that
run on a developer machine and in the `execution-queue-toolchain` CI job. No
image is built from this change's content, no Container App template, revision,
env var, flag or worker job is touched, and no migration is applied.

The effect is realised the next time an agent regenerates the board and queue
from the repo-owned generators.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — nothing here reaches a runtime.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable; no runtime image content changes.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing renders to a signed-in user.
  Stating this explicitly because the change is *about* signed-in gates, and a
  reader could reasonably expect one.

## Rollback Plan

Revert the commit. The two terms are additive, no existing term is altered, and
the generated board, summary and queue are regenerated per run and never
committed — so a revert restores the previous behaviour on the next
regeneration, with nothing to undo.

## Audit Evidence

- The PR and its CI run, including the `execution-queue-toolchain` job log
  showing `99 passed, 0 failed` for `build-source-board.test.mjs`.
- The before/after blocker tables in **QA / Validation**, reproducible by any
  reader: freeze the four operator markdown files into a scratch directory, run
  `node scripts/exec/build-source-board.mjs --json --operator-root <dir>` and
  then `node scripts/exec/build-execution-queue.mjs --operator-root <dir>` with
  the generator at `origin/main` and again with this branch, and diff the
  `blocker` field per id.
- The register line at `2026-09-27T19:47:24Z` recording the claim, the item it
  passed over and why.

## Known Gaps

- **A fourth claimable row is also not agent work and is not fixed here.** One
  lane-D row's acceptance directs an operator to run a mutating data build,
  which the standing rules forbid an agent to do. That is a different class of
  restriction — a rule about what an agent may *execute*, not a gate the item
  *declares* — and reading it would need a term about data builds rather than
  about gates. Left unfiled by this change and recorded here so the next reader
  does not mistake the 4 remaining claimable rows for 4 takeable ones.
- **This closes two forms, not the form class.** The rule table has now been
  widened five times by the same discovery — a gate written in a shape the
  deriver had not been shown. A detector that is extended once per live
  instance will keep being extended; nothing here proposes the general fix,
  which is probably a declared blocker field on the row rather than prose the
  board must infer from.
- The two pre-existing `scripts/exec` failures above are unchanged and
  unaddressed; both are live-corpus calibration cases that belong to their own
  items.
