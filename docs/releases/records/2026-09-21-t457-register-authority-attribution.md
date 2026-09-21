# 2026-09-21-t457-register-authority-attribution — Register time authority: attribution and severity

## Release ID

`2026-09-21-t457-register-authority-attribution`

## Status

`candidate`

## Plain-English Summary

A follow-up to `2026-09-21-t457-register-time-authority`, repairing a defect
that release's own checker produced against that release's own register line.

The checker decides whether a line *announces a pull request as merged* by
reading prose. Its first rule was "any non-negated merge word anywhere on the
line". Register lines are long: one line can report opening PR #A while
narrating the merge of PR #B, or — as the T-457 claim line did — use the word
`mergedAt` to describe the rule rather than to report an event. All of those
were read as merge announcements.

Two changes. First, attribution is decided by the merge token *nearest* the
reference rather than by any token on the line, which is what actually
distinguishes "PR #8158 … NOT MERGED YET" from a real announcement 600
characters later. Second, and more important: the three verdicts that depend on
that attribution are now **advisory** — reported and counted, but they do not
fail a run unless `--strict` is passed. The two verdicts decided from the line
alone still fail. A heuristic presented as a hard gate is how a control stops
being believed, and then stops being read.

## Layer Impact

Release lane: `internal-admin`. AbarVa-only execution/operations capability.
None of the four data layers is touched: no intake, no source adapter, no
canonical model, no product surface, no tenant data, schema, or migration.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `announcesMergeOf(text, index)`
  attributes by nearest token; `HARD_CODES` and `--strict` split severity; the
  exit status now reads the failing set rather than every violation.
- `scripts/exec/register-time-authority.test.mjs` — three added cases (11, 12,
  13); the two cases asserting a heuristic verdict fails now pass `--strict`,
  which is the behaviour they were always describing.
- `docs/ops/deployment-register-time-authority.md` — severity column and a
  section saying plainly why two severities exist.

## QA / Validation

**The defect, measured on the real register.** Before: the T-457 claim line for
PR #8158 was reported `announced_before_event` — the control accusing its own
item's line of announcing a merge ten minutes before it happened, when the line
says `NOT MERGED YET` thirty characters after the reference. After: that line
produces **no drift pair and no violation**.

**Attribution accuracy, measured rather than asserted.** Over the whole
register, 76 pull request references sit on lines carrying a non-negated merge
token. The nearest-token rule is right on **72**; the four it still
over-triggers on are narrative mentions where the reference and the real
announcement are 252 to 639 characters apart. That residual is exactly why the
three attribution-dependent verdicts are advisory rather than failing.

**Suite.** 14 collected / 14 passed → **17 collected, 17 passed.** Clean
baseline over the same scope, the `Execution queue toolchain` job:
`build-execution-queue.test.mjs` **37 passed, 0 failed** before and after.

**Real-register audit, same window and options as the record this follows**
(`--since 2026-09-21T12:00:00Z --github`, audit clock `2026-09-21T17:31:20Z`):
27 announcements resolved, 18 outside ±300s, **11 violations — 1 failing, 10
advisory**. Every one of the 10 is a line genuinely far from its event with no
instant quoted; the one false positive this change targeted is gone.

**Mutations, both caught:**

| mutation | result |
|---|---|
| `announcesMergeOf` returns `announcesMerge(text)` — attribution back to any-token | 16 passed, **1 failed** |
| `HARD_CODES` contains every code — severity split disarmed | 16 passed, **1 failed** |
| restored | **17 passed, 0 failed** |

`npx eslint` exit **0**. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc
--noEmit --pretty false` exit **0**, judged by exit code.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in `src/` imports either file.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable; no runtime behaviour changes
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: **no** — no file here is reachable from any
  route, component, server action or worker.

## Rollback Plan

Revert the merge commit. The prior release remains functional; reverting only
restores the any-token attribution and the single severity.

## Audit Evidence

- The `Execution queue toolchain` run on this pull request, whose
  `Run the register time-authority contract` step prints all seventeen cases by
  name.
- Reproduce the attribution measurement on any register:
  `node scripts/exec/register-time-authority.mjs --file <register> --since <ISO> --github`.

## Known Gaps

- **Attribution remains a heuristic** and is documented as one. Four narrative
  references on the current register still over-trigger. They are advisory, and
  the honest fix for the remainder is shorter register lines, not a longer
  regex.
- The "after" measurement for the rule itself is still owed, unchanged from the
  record this follows: a process rule can only be measured on lines written
  after adoption.
