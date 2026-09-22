# 2026-09-22-register-run-identity-and-worktree-control — Run identity and one-worktree-per-session, as a control that runs

## Release ID

`2026-09-22-register-run-identity-and-worktree-control`

## Status

`candidate`

## Release Lane

`internal-admin`

## Plain-English Summary

Two automation sessions working in the same local checkout can destroy each other's
work: a checkout's index, branch pointer and working tree are shared, so one session
creating a branch discards another's uncommitted edits, and one session's commit can
be pushed inside another's pull request. Both of those happened on 18 September.

The remedy — each session gets its own working copy — has been written in the
operator protocol as a sentence ever since. A sentence cannot fail. This change turns
it into a check that runs over the execution register and exits non-zero when two
different runs claim the same working copy.

Making that check possible required repairing the thing underneath it. The register's
parser identified a line by its agent name, and the character class it used excluded
`#`, the separator that distinguishes one run of a scheduled task from another. On the
real register that produced 81 distinct agent tokens with **none** carrying a run id:
all 18 runs of one scheduled task collapsed into a single identity. A rule about two
sessions cannot be enforced by a parser that cannot see two sessions. The ownership
resolver that consumes those identities was already correct and already tested — but
only ever on values handed to it directly in a test, never on values the real pipeline
produces, so the defect sat underneath a green suite.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only operator tooling; no client
receives it and no product surface reads it.

- **Layer 1 — Client intake:** none.
- **Layer 2 — Source adapters:** none.
- **Layer 3 — Canonical model:** none.
- **Layer 4 — Products:** none. No product surface, route, component or tenant read
  path is touched.
- **Operator tooling only:** `scripts/exec/register-time-authority.mjs` and its
  behavioural suite. Nothing under `src/` imports `scripts/exec/*`.

## Client Applicability

- All clients: none
- Specific clients: none
- Internal only: yes — operator execution tooling
- Public/demo only: none
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - the agent token may carry a run id (`base-agent#run-id`); `#` added to the
    character class in both the primary and the legacy bulleted parse path
  - new `auditWorktreeOwnership` — two run identities claiming one working copy
    inside the window is a violation
  - `worktree_shared` added to `HARD_CODES`, so it fails a run rather than advising
- `scripts/exec/register-time-authority.test.mjs` — ten new behavioural cases
- this release record

Operator documents outside the repository were also updated to complete the item's
acceptance; they are not part of this pull request.

## QA / Validation

Measured on both sides over the same scope, same command, clean base
`3fd4c01b7bcf26e46bef980dc3eed7a76e7f7c0b`.

**Red first, then green.** Of ten new cases, **six failed before the fix and zero
after**: `27 passed / 0 failed` on the clean base → `30 passed / 6 failed` with the
cases added and no implementation → `37 passed / 0 failed` after. The other three
suites in the directory are unchanged: `build-execution-queue.test.mjs` 133/0 and
`build-source-board.test.mjs` 5/0, both sides.

**Measured on the real register, before and after** (707 stamped lines):

| | before | after |
|---|---|---|
| distinct agent identities | 81 | 99 |
| identities carrying a run id | **0** | **18** |
| working copies claimed by two identities | — | **0** |

The zero is the expected result and was independently confirmed: 113 distinct working
copies appear in the register and none is claimed by two identities. The control is
silent on today's register because today's register is clean, which is why the
mutation evidence below carries the proof that it can fail at all.

**A real false positive, found by running it on real data rather than on fixtures.**
The first implementation had no requirement that a path be *claimed* rather than
merely *mentioned*, and it fired — on a line that quoted another run's path while
narrating a diagnosis. The register is discursive and lanes cite each other's paths
constantly. That line's shape is now case 10, it was red when added, and mutation M5
below is the guard against regressing it.

**Eight deliberate mutations, eight caught, each reverted byte-identically
(`git diff` clean after every one).** Every new case is named by at least one
mutation, so none of them — including the four negative controls — passes vacuously.

| mutation | result |
|---|---|
| M1 `#` removed from the agent character class | 6 failed |
| M2 owner keyed on the base name, not the whole identity | 3 failed |
| M3 window filter removed | 1 failed |
| M4 two-owner guard removed | 2 failed |
| M5 claimed-vs-mentioned cue removed | 1 failed |
| M6 `worktree_shared` demoted to advisory | 1 failed |
| M7 unstamped continuations attributed to the last agent seen | 7 failed |
| M7 against the *first* version of the continuation case | **survived** |

M7's two rows are the honest part. The continuation case as first written passed
whether the guard was present or not, because no stamped line in its fixture named
the path, so there was no owner for a mis-attribution to collide with. It asserted
nothing. The fixture now gives the path a stamped owner first, which makes a
carry-forward attribution manufacture a second owner — and the case then catches M7.
A negative control that cannot fail is the exact defect this toolchain exists to
prevent, and it appeared here, in a change written to prevent it.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit 0**,
judged by exit code with `tsconfig.tsbuildinfo` removed first; no TypeScript file
changed, so the scope is empty and it was run anyway. `npx eslint` on both changed
files exit 0. `node scripts/release-check.mjs --base origin/main --head HEAD` passes.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` imports `scripts/exec/*`,
the files are in no container image and no Container App reads them. The suite already
runs in CI as `Execution queue behavioral contract`, so the new cases are executed on
every pull request from merge onward.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime change
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and the reason is structural rather than a
  judgement: this code is not reachable from any product surface

## Rollback Plan

Revert the pull request. No migration, no data change, no runtime state. The only
effect of a revert is that the register check stops running and the rule returns to
being prose.

## Audit Evidence

- the pull request and its `Execution queue behavioral contract` check
- the before/after identity counts above, reproducible with
  `node scripts/exec/register-time-authority.mjs --file <register> --since <ISO> --json`
- the mutation table, reproducible by applying each listed change and running the suite

## Known Gaps

- The control reads the register, which is a *report* of where each run worked. It
  cannot observe the filesystem, so a run that shares a checkout and does not say so
  is not caught. Closing that needs a different sensor and is not claimed here.
- `resolveClaimOwnership` now receives real run identities, but nothing yet calls it
  during a claim: the ownership decision is still made by an agent reading the file.
  Wiring it into a pre-claim check is open work, filed as T-706.
- Legacy register lines carry no run id and resolve as `legacy_other`. That is correct
  — they cannot be proven to belong to any run — but it means the control's reach over
  history is limited to the 18 identities that use the suffixed form.
