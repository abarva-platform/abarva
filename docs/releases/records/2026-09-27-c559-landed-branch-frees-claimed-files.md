# 2026-09-27-c559-landed-branch-frees-claimed-files — A merged claim stops holding its files

## Release ID

`2026-09-27-c559-landed-branch-frees-claimed-files`

## Status

`candidate`

## Plain-English Summary

The execution register lets an agent reserve the files it is about to edit, so two agents cannot
edit the same file at the same time. A reservation expires after three hours, or earlier if the
agent that made it writes a release line.

Neither of those happens when the work simply finishes. An agent that opens a pull request, gets it
merged and moves on leaves its reservation standing for the rest of the three hours — and a
reservation can only be released by the agent that wrote it, so no one else can clear it. For up to
three hours after a change is merged and on `main`, every file that change touched is unavailable
to everybody, with nothing left to collide with.

This adds a third way for a reservation to end: the branch it names is gone from `origin`. That is
already the repository's own definition of finished work, written down in the generated queue and
implemented in the fossil-claim resolver. The file gate now accepts an opt-in `--landed-branch`
argument, and rather than believing it, asks `origin` whether that branch still exists. If it does,
the whole run is refused as a usage error, so the argument cannot be used to push another agent off
work that is genuinely live.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only execution tooling; no client-facing capability
ships here.

None of the four product layers. This is repository execution tooling under `scripts/exec/`: the
pre-claim control that guards the append-only claim register. No product surface, no tenant data, no
canonical model object, no adapter and no route is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — agent execution tooling only
- Public/demo only: no
- Feature flag: none. The new behaviour is opt-in per invocation; with the argument absent the gate
  behaves exactly as before, which is asserted by a test.

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - new exported `branchGoneFromOrigin(branch, { repoDir, lsRemote })`, which answers from
    `git ls-remote --heads origin` and fails closed on any error.
  - `resolveFileOverlap` accepts `landedBranches`; a contending claim line whose every named branch
    has landed produces a note carrying the evidence instead of a conflict. Default empty.
  - `--preclaim` gains the repeatable `--landed-branch` and `--repo-dir`, both added to the usage
    text, which is the contract `append-claim.mjs` probes before forwarding a flag.
  - the human-readable report prints a `[landed]` line naming the dropped hold, its line number, its
    holder and the branch, so a dropped reservation is visible rather than silently absent.
- `scripts/exec/register-time-authority.test.mjs` — seven cases, listed below.

## QA / Validation

Baseline measured in a **separate clean worktree** checked out at `origin/main` `efb5587e60`, with
this change's test file copied in and nothing else — not a stash.

- `node scripts/exec/register-time-authority.test.mjs`
  - **5 failing before, 0 after**, same scope. Before: 314 passed / 5 failed. After: 319 passed / 0
    failed.
- The three cases that pass in both directions are the no-regression controls and are meant to:
  behaviour with the argument absent, an item-gate assertion, and the partial-landing guard.

Red-first, then three deliberate mutations of the fix, each confirmed to change behaviour before the
suite was rerun:

| mutation | effect asserted | result |
|---|---|---|
| `lineBranches.every(...)` → `.some(...)` | a claim naming one landed and one live branch would be freed | 1 failed — the partial-landing case |
| `branchGoneFromOrigin` catch returns `true` instead of `false` | an unanswerable origin would read as permission | 1 failed — the fail-closed case |
| drop the `branchGoneFromOrigin` call, honour the request as given | the argument becomes an unchecked instruction | 2 failed — both verification cases |

Each mutation was reverted and the suite returned to 319 passed / 0 failed.

The new cases build a **real git remote in a temp directory** and let the gate shell out to
`git ls-remote` against it. Nothing stubs the thing under test.

Proven additionally on the **real** register and the **real** `origin`, which is the case that
prompted the item:

- positive: `--preclaim --item T-494 --files <the two files T-493 held>
  --landed-branch claude/exec-20260927T1255Z` → `verdict: take`, exit 0, four `[landed]` notes naming
  lines 3202 and 3206 and the branch. Before the change the same invocation was
  `REFUSED by the files gate` with four contentions.
- negative: the same invocation with `--landed-branch main`, a branch `origin` certainly still has →
  exit 2, the request refused and not honoured.
- through the sanctioned path: `append-claim.mjs --gate-arg --landed-branch --gate-arg <branch>
  --gate-arg --repo-dir --gate-arg . --dry-run` → `Pre-claim passed`, which also exercises the
  helper's unadvertised-flag probe against the amended usage text.

Sibling suites in the same directory, all green after the change: `append-claim` 71/0,
`fossil-claims` 91/0, `cli-entry` 34/0, `queue-provenance` 30/0, `build-execution-queue` 207/0.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit 0**, 0 lines of
output. `npx eslint` on both changed files → exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: these files are developer tooling and are not built into any
image, route or worker. Nothing to deploy and no revision to shift.

## Deployment Authority

- Repo-owned deploy workflow: not engaged; no runtime artifact changes.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no image is rebuilt by this change.
- ACA runtime invariant: unaffected; no Container App template, traffic weight or env var is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**. This change ships no runtime artifact and no product
  surface; there is no signed-in view whose rendering could differ.

## Rollback Plan

Revert the commit. The new behaviour is opt-in and off by default, so a revert cannot strand a caller
mid-flight: any invocation that omits `--landed-branch` behaves identically before and after.

## Audit Evidence

- The pull request and its checks.
- `scripts/exec/register-time-authority.test.mjs`, cases headed `C-559`, including the negative
  control and the fail-closed case.
- The before/after invocations against the real register quoted under QA.

## Overlap with PR #8556 (`T-498`), and why both are needed

`#8556` has been open since 10:30Z against the same two files and the same one-sentence defect —
a claim whose work is on `main` keeps holding its files — by a different mechanism: it widens
`announcesRelease` so a release line phrased `released — <id> MERGED` is recognised as one. That
overlap was raised in the operator pulse as a possible redundancy, correctly, because two guards for
one defect is how a redundant one survives every mutation of itself.

Measured rather than argued. On a fixture register where the holder **never wrote a release line at
all** — one claim line naming a landed branch, one follow-up line — run against `#8556`'s own head
`55a57fa786`:

- `#8556` alone: **2 contended, still REFUSED.** Its rule needs a release line to exist; there is
  none to widen.
- this change: the branch-naming line is freed and reported as `[landed]`.

They repair disjoint halves. `#8556` covers a release that was written and missed; this covers a
holder that wrote nothing and moved on. Neither subsumes the other, and the case above is the
evidence. Whichever lands first, the other rebases — both edit `resolveFileOverlap` — and the
rebase does not change this conclusion.

## Correction to the live-register evidence quoted above

The live-register positive was measured at **14:38Z** and the output is quoted verbatim under QA. It
is no longer reproducible: `T-493`'s holder appended its own release at **14:44:15Z**, six minutes
later, which frees the same files by the ordinary route. That does not weaken the measurement — the
files were genuinely frozen for the **12 minutes** between the 14:32:03Z merge and that release, and
nothing structural bounded that window; the holder happening to wake did. But the durable instrument
for this defect is the fixture suite, not the live register, and the live-register run should be read
as a dated observation rather than a repeatable check.

## Known Gaps

- **A claim line that names no branch keeps its hold**, even when a sibling line by the same agent
  names one that landed. Silence is not evidence, so this fails closed by design and is pinned by a
  case. In practice every line written through `append-claim.mjs` carries ``on branch `<name>` `` in
  its machine-generated head, so the gap is reached only by hand-written lines — but a claim whose
  progress lines omit the branch will still be held, and that is the main limit on how much of this
  defect the change actually removes.
- The argument is supplied by the caller. The gate verifies the branch is gone, which is the half
  that can be checked offline of any issue tracker, but it does not itself confirm that a pull
  request was merged rather than the branch being deleted unmerged. A branch deleted without merging
  would free the files — correctly, since abandoned work holds nothing either, but the evidence line
  says "gone from origin" and should not be read as "merged".
- Nothing resolves the landed set automatically yet. `scripts/exec/fossil-claims.mjs` already reads
  GitHub and knows which claims are fossils; wiring it to feed this argument would remove the manual
  step. Left out deliberately to keep this change to one reviewable behaviour.
