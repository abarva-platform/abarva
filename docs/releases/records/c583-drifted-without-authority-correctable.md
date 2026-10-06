# 2026-10-04-c583-drifted-without-authority-correctable — an appended correction can discharge a drift finding

## Release ID

`2026-10-04-c583-drifted-without-authority-correctable`

## Status

`candidate`

## Plain-English Summary

The deployment register is append-only, and the rule for a line that got a timestamp wrong is
"never restamp it; append a correction below it". The control that audits the register already
honoured that for one of its findings and quietly refused it for another.

The finding in question fires when a line announces a merge long after the merge happened without
quoting the authoritative instant, so the line's own timestamp is the only time on offer and it is
not the event's. The control already cleared that finding when the **same** line quoted the
authoritative instant. It did not clear it when a **later** line quoted the same instant — even
though the later line supplies exactly the figure the first one omitted.

So the prescribed repair worked in one position and not in the position the rule actually tells a
writer to use. Measured on the current main before this change: the identical repair read clean on
the line (0 findings) and stayed failing one line below it (1 failing, 0 discharged). The only way
to make the control read clean was to restamp, which is the one thing the rule forbids — and a
number you can only reach by breaking the rule measures nothing about whether the rule was
followed.

This change declares that finding correctable, and defines what a correcting line must do to
discharge it: quote the authoritative merge instant **for the pull request the original line
announced**. Not any instant, not another pull request's instant, and not the flagged line's own
timestamp. That figure cannot be supplied by prose, which is what keeps this from becoming a gate a
sentence can pass.

## Layer Impact

Release lane: `internal-admin`. No product layer. This is platform tooling — one auditor of an operator-owned document under
`scripts/exec/`, plus its behavioural suite. No intake tab, source adapter, canonical object or
product surface is touched. The control reads a document; it writes nothing and it reaches no
tenant data.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — an internal release-discipline auditor
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs`
  - `CORRECTABLE_CODES` gains a `drifted_without_authority` entry whose predicate requires the
    correcting line to quote the authority's `mergedAt` for the pull request the flagged line
    announced.
  - `annotateCorrections` takes the resolved authority set as context and passes it to the
    predicate, so the discharge is decided from the same authority the audit judged against and
    the predicate reaches no network.
  - The call site forwards the authority the audit already resolved.
- `scripts/exec/register-time-authority.test.mjs` — eleven new assertions, below.
- This record.

## QA / Validation

Baseline measured over the same scope on main `815cec3b15` before any edit, by running the
committed suite verbatim: **343 passed, 0 failed**.

Red first. With the new assertions added and no implementation change: **349 passed, 3 failed** —
the three reds being the discharge itself, the exit-code move under `--strict`, and the table
declaration. After the implementation: **354 passed, 0 failed**. So **0 failing before, 0 failing
after**, and nothing pre-existing was disturbed.

Necessity proved by mutation on the mechanism. Six mutations, each killing at least one *named*
new case:

| mutation | new cases killed |
|---|---|
| accept any instant the authority holds, rather than the announced pull request's | 1 |
| discharge as soon as the authority entry resolves, without the instant being quoted | 2 |
| remove the entry from `CORRECTABLE_CODES` (the pre-change state) | 5 |
| stop threading the authority at the call site | 2 |
| treat an absent authority entry as a discharge | 1 |
| stop requiring the correction marker | 1 (the prior item's own case) |

Two corrections against this change's own first draft, recorded here rather than quietly fixed,
because an assertion no mutation can kill proves nothing:

1. The first draft carried the prior entry's "the referenced stamp is a reference, not a source"
   exclusion, and a case asserting it. Both were wrong. This finding only fires when the line's
   stamp is more than the tolerance away from the authoritative instant, so the two can never be
   the same string and the exclusion could never run — confirmed by measurement, not by reasoning:
   an authority whose instant equals the flagged stamp yields a drift of 0 seconds, is treated as
   self-quoting, and raises no finding at all. The case was therefore vacuous, which is why the
   mutation deleting the exclusion survived it. The exclusion was removed and the reason written
   into the code; the case was replaced by one that is real and killable — a correction that names
   the pull request but quotes no instant discharges nothing.
2. The guard for an absent authority entry is unreachable end to end, for the same structural
   reason: the audit only raises this finding after reading the instant out of the authority set,
   so by then the entry exists. It is asserted directly against the exported predicate instead,
   where it is reachable and where a mutation kills it, and the suite says so in those words
   rather than implying a fixture proved it.

One assertion is labelled in the suite as a regression guard rather than a necessity proof: its
fixture has no second line, so no mutation of the predicate can reach it. What it pins is that the
repair did not take the *reporting* with it — a discharged finding is still reported, and an
undischarged one still fails under `--strict`.

Effect on the live operator register, measured by running the pre-change and post-change control
over the same window and the same `--now` against the same GitHub authority: **identical** — 4
findings, 1 failing, 3 advisory, 0 discharged, at the same four line numbers, both before and
after. The capability is new; no live verdict moved, because no correcting line in the newly
accepted form has been appended yet. The single failing finding is an unrelated pre-existing one
and is present identically on both sides.

Other gates, judged by exit code:

- All 15 `scripts/exec/*.test.mjs` suites: exit 0 (1,322 assertions, 0 failed).
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: **exit 0**, no output.
- `npx eslint` on both changed files: **exit 0**.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: recorded on the pull request.

## Rollout Plan

Merge to main. No runtime rollout: nothing here is imported by the application, bundled into an
image, or reachable from a route. The repo-owned deploy workflow will build and deploy main as
usual, and that deploy carries this change only as repository content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or revision weight, no
  scale, secret, environment variable or flag is touched.
- Approved image digest: not applicable — no runtime image contract changes.
- ACA runtime invariant: unchanged by this release; the post-merge readback is recorded on the
  pull request for completeness, not because this change can alter it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and that is the ceiling for this row by design. The change
  contains one auditor script, its suite and this record. No route, component, API response,
  control surface, flag or tenant datum exists in it to sign in and inspect, so `deployed` is as far
  as this row can go.

## Rollback Plan

Revert the pull request. No migration, no data, no runtime state. Reverting restores the prior
behaviour exactly: the finding becomes non-correctable again and the audit's reported counts are
unchanged either way, since no live finding is currently discharged by the new predicate.

## Audit Evidence

- The pull request, its diff and its required checks.
- The baseline / red / green numbers above, each reproducible by `node
  scripts/exec/register-time-authority.test.mjs`.
- The six mutations, each reproducible as a one-line edit to the predicate or its call site.
- The before/after live-register comparison, reproducible with `node
  scripts/exec/register-time-authority.mjs --file <register> --since <ISO> --now <ISO> --github
  --json`.

## Known Gaps

- The new capability is unexercised on the live register: nothing there is currently discharged by
  it, because no correction in the accepted form has been appended. Stated as a gap rather than
  implied as a result.
- `drifted_without_authority` remains advisory by default and fails a run only under `--strict`.
  That is deliberate and unchanged: the finding depends on attributing a merge announcement to a
  pull request by reading prose, which is a heuristic, and this change does not alter where that
  heuristic sits. Whether it should become a hard code is a separate question and is not decided
  here.
- The discharge is not wired into any CI job. Which of these controls is a required check is owned
  by a separate open item and is deliberately not pre-empted.
