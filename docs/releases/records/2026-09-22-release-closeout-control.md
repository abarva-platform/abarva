# 2026-09-22-release-closeout-control — Make the release closeout a step that can fail

## Release ID

`2026-09-22-release-closeout-control`

## Status

`candidate`

## Plain-English Summary

Every merge is supposed to get one line in the deployment register saying what
shipped, which workflow run carried it to the runtime, and which image digest
ended up live. Four consecutive review passes found merges with no such line,
reconciled a batch by hand each time, and were re-filed within the hour. The
most recent of those passes answered the question "whose step writes the line?"
in prose, inside a record — and four merges from the eighteen minutes *before*
that record landed went unrecorded anyway.

This change stops asking and starts checking. The existing register control
gains a `--closeout` mode that asks GitHub which pull requests merged in a
window and reports each one as recorded, missing, or still inside a grace
period. It exits non-zero when any merge is missing, so the closeout is now
something that fails rather than something that can be skipped.

It also fixes how the gap was being measured. Every prior pass counted it by
grepping the register for the merge SHA — but a claim line saying which commit
it *branched from* contains that SHA and reports no outcome at all, so the grep
scored those as present. Run head-to-head over the same register file at the
same instant, across fifteen merges, the grep method reported **fifteen
recorded and nothing missing** — a perfectly clean register — where the control
found **seven recorded and seven missing**. Eight of the grep's fifteen hits
were lines that mention the commit and report no outcome whatever.

## Layer Impact

Release lane: **`internal-admin`** — an AbarVa-only operations capability. The
control and its documentation are operator tooling; nothing here is shipped to
a client surface or gated by a flag.

Platform tooling and release governance only. No product layer is touched: not
client intake, not source adapters, not the canonical model, and no product
surface. No runtime code path changes.

## Client Applicability

- All clients: none
- Specific clients: none
- Internal only: yes — an operator control and its documentation
- Public/demo only: none
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — new exported `auditCloseout`,
  `CLOSEOUT_GRACE_SECONDS`, a `--closeout` CLI mode with `--merged` (fixture)
  and `--github` (live) authority sources and a `--grace` override, and two new
  hard verdict codes `closeout_missing` and `closeout_authority_empty`.
- `scripts/exec/register-time-authority.test.mjs` — six new behavioural cases.
- `docs/ops/deployment-register-time-authority.md` — the closeout rule, what
  does not count as closing a merge out, and the answer to the standing
  ownership question.
- This record.

## QA / Validation

**Red first.** The six new cases were written before the mode existed and run
against the unchanged control: **17 passed, 6 failed**. After the
implementation: **23 passed, 0 failed**. Same command both sides,
`node scripts/exec/register-time-authority.test.mjs`. The suite already runs in
CI at `.github/workflows/execution-queue-toolchain.yml:42`, so the new cases
execute there rather than only locally.

**Falsifiability — 7 mutations, 7 caught, 0 escapes.** Each edits the control,
runs the suite, and is reverted; the control file was confirmed byte-identical
afterwards.

| mutation | caught by |
|---|---|
| grace period always applies, so nothing is ever overdue | 3 cases |
| empty authority returns clean instead of failing | 1 |
| credit a pull request for any mention, not for an announcement | 1 |
| **credit a pull request whenever its merge SHA appears anywhere** — the exact method every prior pass measured with | 1 |
| `closeout_missing` demoted out of the hard codes | 3 |
| `closeout_authority_empty` demoted out of the hard codes | 1 |
| missing merges no longer reported at all | 3 |

**Measured on the real register, same window both sides** (`--since
2026-09-21T23:00:00Z`, `--closeout --github`):

| | merged in window | recorded | missing | pending in grace |
|---|---|---|---|---|
| before the four lines below were appended | 15 | 3 | 11 | 1 |
| after | 15 | 7 | 7 | 1 |
| *grep by merge SHA, same file, same instant as `after`* | 15 | *15* | *0* | — |

The four that moved are exactly the four this item named. The control still
exits 1, which is correct and is the point: seven merges in one two-hour window
are still unwritten, and they belong to lanes that have not closed out. Writing
a fifth batch by hand is what this item explicitly said not to do.

**The four closeout lines appended**, one per pull request, each naming its own
merge SHA, whether the run keyed to it carried it or was cancelled by
concurrency, the carrier run where it was, and the digest read from that run's
own `Verify ACA runtime invariant` step (`success` in both carriers):

| PR | own run | carrier | digest |
|---|---|---|---|
| #8191 | cancelled | run on a later main SHA | `sha256:67b12ebe…` |
| #8192 | cancelled | same carrier as #8191 | `sha256:67b12ebe…` |
| #8193 | **success — carried itself** | none needed | `sha256:67b12ebe…` |
| #8194 | cancelled | a different, later carrier | `sha256:4f8da529…` |

Ancestry was proved with `git merge-base --is-ancestor` for each, not assumed
from merge order. The fourteen pull requests already covered by the three
earlier reconciliations are named and skipped in the register lines themselves.

`tsc --noEmit` exit 0 (judged by exit code, not by grepping for diagnostics),
`eslint` exit 0, `node scripts/release-check.mjs --base origin/main --head HEAD`
exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: this adds a script mode, tests and
documentation. The repo-owned ACA deploy workflow will build and deploy the
merge commit as it does every merge, and nothing in the deployed image behaves
differently.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — this change mutates no Container App, no
  revision weight, no worker job and no environment variable
- Approved image digest: not applicable; no image is pinned or shifted here
- ACA runtime invariant: unchanged; the workflow's own `Verify ACA runtime
  invariant` step continues to own it
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Rollback Plan

Revert the commit. The control returns to its previous verdict set and the
`--closeout` mode disappears; the appended register lines are audit history and
are not removed, because the register's correction pattern is append-only. No
migration, no data and no runtime state is involved.

## Audit Evidence

- This pull request and its CI run, in particular the `Execution queue
  toolchain` job, where the six new cases execute
- The before/after `--closeout` reports quoted above, reproducible with the
  command in `docs/ops/deployment-register-time-authority.md`
- The four appended register lines, each carrying its own authority

## Known Gaps

1. **The control runs where the register lives, not in CI.** The register is an
   operator file outside the repository, so no workflow can read it and none can
   write a line into it. Both mechanisms this item proposed — the deploy
   workflow emitting the line, or a check refusing a merge whose predecessor has
   none — are impossible as written for that reason. What CI holds shut is the
   control; the audit is run by whoever holds the register. Moving the register
   into the repository is the change that would close this properly, and it is
   not attempted here.
2. **Seven merges in the measured window remain unrecorded** and are outside
   this item's named four. They are left failing the control deliberately rather
   than reconciled by hand, which is the behaviour the item asked for.
3. **Attribution is still prose parsing.** A line that announces a pull request
   in an unusual form could be missed, which fails the run rather than passing
   it. That direction is chosen on purpose and is stated in the control's own
   comment.
