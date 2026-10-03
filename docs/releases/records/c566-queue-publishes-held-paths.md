# 2026-09-27-c566-queue-publishes-held-paths — Publish the repo paths a live claim holds, from the claim gate's own reader

## Release ID

`2026-09-27-c566-queue-publishes-held-paths`

## Status

`candidate`

## Plain-English Summary

Agents pick their next piece of work from a generated queue, and they claim it through a gate that
refuses on two separate conditions: the item is already claimed, or a **file** the change needs is
already held by another live run.

The queue only ever knew about the first condition. It decided what to offer from item-level
claims alone and said nothing about held files, so a row could pass every test the queue applies
and still be refused at the moment of claiming. The refusal itself is cheap and names its holder;
what it costs is its timing, because it arrives *after* the agent has chosen the row and
re-verified it on `main`, which is the expensive half of picking work.

This change publishes the half that is knowable. The queue now carries a `Paths held by a live
claim` section listing every repo path a live claim holds, with its holder, the instant it was
claimed, and the instant the hold expires — so a reader can intersect that table with its own
intended file list before it spends anything.

Two properties are deliberate:

- **It is not a filter.** The generator cannot know which files an item needs; nothing in the
  backlog declares that, and guessing it would be an inference dressed as a rule. Rows stay in
  their lane tables exactly as before. Where a held path is one of the few files an entire class
  of item must edit — today, CI workflow files — the queue adds a *caution* beside the claimable
  count saying those rows are unworkable this hour, not unclaimable.
- **There is one reader, not two.** The holds come from the same function the gate refuses from,
  factored out rather than reimplemented. A table advertising a hold the gate does not enforce
  would send agents away from work that is theirs to take, which is worse than silence.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only execution/CI tooling. No client-facing surface, no
route, no prompt, and no data-plane object is touched, so neither `global-control-lane` nor
`client-data-lane` applies. The behaviour is on by default rather than flagged, so it is not
`experimental`.

- **Execution tooling only.** `scripts/exec/register-time-authority.mjs` gains one exported
  function and its existing overlap resolver is rewired to consume it;
  `scripts/exec/build-execution-queue.mjs` renders one new section and one caution sentence.
- No layer of the data operating model is touched: nothing here reads tenant data, a canonical
  object, or a governed context bundle.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: yes — this is agent execution tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/register-time-authority.mjs` — new exported `heldPaths(lines, { nowMs,
  windowHours, identity })`, factored out of `resolveFileOverlap`. It carries the liveness window,
  the release rule, the abstention rule, the ownership rule and `claimedPaths` that the overlap
  gate already applied; `resolveFileOverlap` now consumes it instead of repeating them. `identity`
  is optional, and omitting it — the case for a reader with no run of its own — reports every live
  hold rather than dropping the caller's own.
- `scripts/exec/build-execution-queue.mjs` — renders `## Paths held by a live claim` (present
  even when nothing is held, and distinctly worded when no register was read at all), plus a
  declared shared-wiring caution beside the claimable count.
- `scripts/exec/build-execution-queue.test.mjs` — four new behavioural cases (below).

## QA / Validation

All commands run from an isolated worktree at `origin/main` (`5fc94c5a47`).

**Baseline over the same scope, measured against the unmodified suite from `HEAD`:**

| suite | before | after |
|---|---|---|
| `scripts/exec/build-execution-queue.test.mjs` | 207 passed, 0 failed | 211 passed, 0 failed |
| `scripts/exec/register-time-authority.test.mjs` | 322 passed, 0 failed | 322 passed, 0 failed |
| `scripts/exec/append-claim.test.mjs` | 79 passed, 0 failed | 79 passed, 0 failed |
| `scripts/exec/build-source-board.test.mjs` | 99 passed, 0 failed | 99 passed, 0 failed |
| `scripts/exec/queue-provenance.test.mjs` | 30 passed, 0 failed | 30 passed, 0 failed |
| `scripts/exec/fossil-claims.test.mjs` | 91 passed, 0 failed | 91 passed, 0 failed |
| `scripts/exec/cli-entry.test.mjs` | 34 passed, 0 failed | 34 passed, 0 failed |
| `scripts/exec/toolchain-manifest.test.mjs` | 17 passed, 0 failed | 17 passed, 0 failed |

The four new cases were written first and all four failed before the fix (`207 passed, 4 failed`).

**The four cases, and what each one holds shut:**

- **(a)** A register that holds a path — the queue names the path, the holder, and the expiry.
- **(b)** A register that holds nothing — the section is *present and empty*, so "no holds" and
  "not measured" cannot render alike.
- **(c)** The queue's answer is the gate's answer. Three lines the gate reads as holding nothing
  — a release, an abstention, and a path a line attributes to somebody else — contribute no path,
  while the same line's own `files:` entry still does. A local `files:` scrape passes (a) and
  fails this, which is why all three are asserted rather than only the first.
- **(d)** The caution is a caution: with CI wiring held, a claimable row is still offered in its
  lane table.

**Mutation testing — five mutations, each turning exactly one named case red:**

| # | mutation | result |
|---|---|---|
| 1 | `heldPaths` stops honouring the release and abstention rules | (c) FAIL — 210 passed, 1 failed |
| 2 | the empty section is omitted instead of rendered | (b) FAIL — 210 passed, 1 failed |
| 3 | the table drops its holder and expiry columns | (a) FAIL — 210 passed, 1 failed |
| 4 | the caution is not emitted | (d) FAIL — 210 passed, 1 failed |
| 5 | the caution becomes a filter (lane T removed from the lane tables) | (d) FAIL — 193 passed, 18 failed |

Restoring each mutation returned the suite to `211 passed, 0 failed`.

**Other checks:**

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, 0
  `error TS` lines. (Judged on exit status: a bare `npx tsc --noEmit` exits 134 on the operator
  host, a V8 out-of-memory crash that emits no diagnostics.)
- `npx eslint` over the three changed source files — exit 0, no findings.
- Live-corpus smoke, run against a **copy** of the operator root so no queue file was stamped by
  an unmerged generator: the section rendered 6 held paths across 2 live holders, each with its
  holder, claim stamp and expiry. The caution correctly did not fire, because no path under
  `.github/workflows/` was held at that moment.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is built into a container image,
served by a route, or read at request time. The generator takes effect on the next queue
regeneration by whoever runs it.

## Deployment Authority

Not applicable. This change touches no Azure Container App, deploy workflow, runtime image,
feature flag, environment variable, worker job, traffic weight, DNS record, or environment
promotion.

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image changes.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: no — there is no product surface in this change.

## Rollback Plan

Revert the PR. The generator returns to its previous output on the next regeneration; there is no
migration, no persisted state, and no consumer that has to be rolled back with it. Nothing reads
the new section programmatically, so removing it cannot break a downstream tool.

## Audit Evidence

- The pull request for this change, its diff, and the `Execution queue toolchain` CI run on it —
  that workflow runs `build-execution-queue.test.mjs`, `register-time-authority.test.mjs` and
  `append-claim.test.mjs`, and it is triggered by `scripts/exec/**`, so every suite quoted above
  runs on this PR rather than only locally.
- The four new cases in `scripts/exec/build-execution-queue.test.mjs`, each named `C-566 (a)`
  through `(d)`. Case (c) is the one to read: it is the negative control that separates this
  implementation from a local `files:` scrape.
- The backlog entry for item `C-566` in the operator backlog, which records the measurement this
  change was filed on, and the append-only claim register line claiming it.
- To reproduce the live-corpus smoke without stamping the operator's queue file, copy the operator
  documents to a scratch directory and run both generators against it with `--operator-root`.

## Known Gaps

- The shared-wiring declaration has exactly one entry today, `.github/workflows/`. It is a
  declaration and not a derivation, so a future class of item with its own must-touch file needs
  a line added. Its only effect is the caution sentence — it never removes a row, changes a count,
  or decides claimability — so a missing entry costs a caution, never a wrong offer.
- The queue still cannot say which files a given item needs, because no item declares them. The
  intersection is left to the agent, which is the point: publishing what is knowable rather than
  inferring what is not.
- `heldPaths` inherits one stated limit from the rule it factors out: an agent holding two items
  at once and releasing one is read as releasing both, because the register's release grammar says
  "all files free". That behaviour is unchanged by this PR and is recorded here, not repaired.
