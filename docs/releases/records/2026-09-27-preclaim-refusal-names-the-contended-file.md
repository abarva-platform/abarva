# 2026-09-27-preclaim-refusal-names-the-contended-file — A file-overlap refusal names the path and the holder

## Release ID

`2026-09-27-preclaim-refusal-names-the-contended-file`

## Status

`candidate`

## Plain-English Summary

The execution backlog's claim helper refuses to record a claim when a file it
names is already held by another agent's live claim. The refusal worked. Its
explanation did not: it printed the *item* half's verdict — the word `take` —
and an item-half reason, and said nothing at all about which file was held or
who held it.

Item `T-707` asked for both halves in one sentence: "refuse when any path
appears in another live claim's `files:` list, **naming the path and the
holder**." The refusing shipped; the naming did not, because the caller read a
report key (`contended`) that the gate does not emit. The gate emits
`fileOverlap.conflicts`, and it had the path, the holding line's number, its
stamp and its agent all computed and ready. Every one of them was discarded.

Two things went wrong as a result, and the second is the expensive one. An
agent could not tell *which* of the files it asked for was held, so the only
way to find out was to re-run the helper once per file. And `verdict: take`
printed on the second line of a `REFUSED` banner reads as permission, which
invites the conclusion that the control is malfunctioning rather than that a
colleague is holding a file.

This change makes the refusal say what it knows: the count of contended paths
out of those requested, then one line per path naming the holder's identity,
the register line number and its stamp, then what to do about it. The item-half
verdict is now labelled as the item half's, so it cannot be read as the result.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only execution tooling. No
client receives it, no product surface reads it, and it never runs inside a
deployed container.

- **Layer 4 — Products:** none. No product surface, route, component, prompt or
  read model is touched, and no runtime artifact ships.
- **Platform tooling (`internal-admin`):** `scripts/exec/append-claim.mjs`, the
  only sanctioned way to append a claim to the execution register. The behaviour
  change is confined to the text a refusal prints; the verdict, the exit status
  and what is or is not written to the register are unchanged.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs` — `describe()` now reads
  `report.fileOverlap.conflicts`, prints one line per contended path naming
  holder / line / stamp, and labels the item verdict `item verdict:` when the
  refusal came from the file half.

  It reads **only** that key. The first draft of this change also kept the old
  `report.contended` read "for compatibility"; checking the gate's history
  rather than assuming showed **no commit of `register-time-authority.mjs` has
  ever emitted a top-level `contended` key** — the file-overlap half emitted
  `fileOverlap.conflicts` from its first commit, `5e8a42e284`. So the original
  read was wrong the day it was written, and keeping it would have shipped an
  unreachable branch under a comment implying some gate produces that shape.
  What actually guards a future key rename is the case driving the real gate,
  which fails if the shape moves.
- `scripts/exec/append-claim.test.mjs` — six new assertions against the **real**
  gate, and one vacuous negative control replaced.

## QA / Validation

**Clean baseline measured in a separate worktree, not a stash.** At
`origin/main` `0dbdc508a9a933f569dcd91d0895328e90346e13`, in a second checkout
at `.claude/worktrees/exec-base-20260927T154241Z`:

| scope | before | after |
|---|---|---|
| `node scripts/exec/append-claim.test.mjs` | **71 passed, 0 failed** | **79 passed, 0 failed** |

The baseline being green is the finding, not a footnote: 71 assertions passed
over a describer that discarded the entire file-overlap report. Red-first on
this branch, before the fix, the same suite ran **74 passed, 3 failed** and the
three were the new naming assertions.

**The gate under test is the real one, deliberately.** The defect is a
disagreement between the shape the gate emits and the shape the caller reads, so
a stub emitting `contended` would pass against the unfixed describer and the
case would prove nothing.

**Proven on the live register, in the case that caused the filing.** The same
invocation that earlier printed 183 bytes over 3 lines and named nothing now
reports both held paths, the holding identity, the line number and the stamp in
a single run.

**Six mutations, six caught. Each byte change was asserted before its run**, so
a no-op mutation cannot be mistaken for a caught one:

| # | mutation | result |
|---|---|---|
| M1 | read `overlap.contended` — the original defect, restored | 3 failures |
| M2 | drop the path from the named line | 2 failures |
| M3 | drop the holder identity, line and stamp | 1 failure |
| M4 | print the conflict block unconditionally | 1 failure |
| M5 | relabel the item verdict as the overall verdict | 1 failure |
| M6 | report every requested path as contended | 3 failures |

**M4 and M5 each caught a weakness in this change's own tests, before review.**
M4 survived the first negative control, because that control asked for a claim
whose files were free — and a *successful* claim never calls the describer at
all, so the control could not reach the code it guarded. It was replaced with an
item-half refusal, which reaches the describer with an empty conflict set. M5
survived until the verdict label got an assertion of its own; an unasserted
label is decoration, so it was pinned rather than shipped.

The replaced control also could not forbid the words "held by": the item half's
own reason legitimately reads "line 5 is held by …", so the assertion pins the
file-overlap markers instead of a phrase that correct output contains.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — see
  the PR for the exit code, judged as the exit code and not by grepping for
  `error TS`.
- `npx eslint scripts/exec/append-claim.mjs scripts/exec/append-claim.test.mjs`
- `node scripts/release-check.mjs --base origin/main --head HEAD`
- The suite is wired into CI at `.github/workflows/execution-queue-toolchain.yml`,
  so the new assertions run on every pull request rather than only here.

## Rollout Plan

Merge to `main`. No Azure Container Apps image build is required by this change
and no runtime rollout is involved: the changed file is a developer/agent CLI
that never executes in a deployed container.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` runs on
  merge as it does for every commit. This change contributes nothing to it.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release.
- ACA runtime invariant: read after merge only to show that this change did not
  move the shared runtime. There is no artifact here that could be live.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — stated rather than left blank. This
  ships no product surface, so there is nothing a signed-in session could show
  that the suite and the live-register run above do not.

## Known Gaps

**A second defect was found in the same gate and is deliberately NOT fixed
here.** The file-overlap parser harvests paths from a claim line's **prose
message**, not only from its `files:` list. A claim whose message *cites* a path
as evidence therefore places a live hold on that path. This is not theoretical:
it is how the run that filed this change discovered the reporting defect, and it
had blocked four separate lane-T items behind two files that the holding claim
never declared.

It is left open for one reason and it is not scope: the parser lives in
`scripts/exec/register-time-authority.mjs`, which another run holds under a live
claim, legitimately and by its own declared file list. Fixing it here would be
the exact collision this register exists to prevent. It is recorded in the
execution pulse for whoever holds that file next.

**Consequence worth naming, because this record is itself an instance of it:**
the claim line that took this item names two script paths in its prose, so the
gate now holds those paths against the next run to ask for them. The defect
above reproduces on the very line describing it.

**Not fixed and not in scope:** the printed output is addressed to a human or an
agent reading a refused run, not parsed by anything, so nothing asserts its
layout beyond the fields this change pins. A caller wanting the overlap
programmatically should read the gate's `--json` report, which already carried
everything this text was missing.

**No live signed-in proof, and none is owed** — there is no product surface in
this change for a signed-in session to render.

## Rollback Plan

Revert the single commit. No migration, no data change, no flag, and no
dependency: the previous behaviour is the previous text of one function. Nothing
downstream reads the printed output programmatically — it is addressed to the
agent reading a refused run.

## Audit Evidence

- The pull request, its diff and its CI run.
- `node scripts/exec/append-claim.test.mjs` in the `execution-queue-toolchain`
  job: 79 assertions, the six mutation results recorded in the PR body.
- The clean-baseline worktree measurement quoted above, with the base SHA.
- The live-register invocation quoted in the PR, before and after.
