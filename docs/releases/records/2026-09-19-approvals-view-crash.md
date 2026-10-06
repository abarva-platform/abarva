# 2026-09-19-approvals-view-crash - A Regression I Shipped, Found By Signed-In Proof

## Release ID

`2026-09-19-approvals-view-crash`

## Status

`candidate`

## Plain-English Summary

On a real signed-in event, selecting **Approvals** replaced the entire event
workspace with the global unhandled-error surface. No approval, stage change,
message or upload was attempted — the view switch alone failed.

**This is a regression introduced by `#7844`**, the change that put the
decision trail on that view. Two independent faults, both mine:

1. The trail's timestamp is typed `string` and was assigned straight from
   `occurred_at` with no coercion. That column is a timestamptz and a driver is
   free to return a `Date`. A `Date` rendered as a React child throws
   `Objects are not valid as a React child`, which takes the whole page to the
   error boundary rather than just the panel.
2. A result claiming `ok: true` without an `entries` array threw
   `Cannot read properties of undefined (reading 'length')`.

## Layer Impact

`global-control-lane`. One read path and one view. No schema change, no write
path, no tenant data touched.

## Client Applicability

- All clients: the Approvals view of a Source New event no longer crashes the
  workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Why the original tests missed it

They used ISO **string** fixtures, so they proved the component against a world
the database does not have to produce. The type was a claim, not a guarantee,
and the fixture agreed with the claim instead of with the driver.

This is the fixture-shaped failure this repo has been removing all week,
introduced by the change that was removing it elsewhere.

## A second miss, in the fix's own tests

The first draft of the two new cases rendered the workspace and asserted
`not.toThrow()` — but never clicked Approvals, so the panel never mounted and
**both passed vacuously**. They only reproduced the crash once they opened the
view. A test that does not reach the code under test passes for the same reason
a missing test does.

## Changes Included

- `src/lib/source/activity-log.ts`: `isoTimestamp()` coerces string, `Date` and
  epoch-number to an ISO string, so the reader's `string` type is enforced
  rather than asserted.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: the timestamp
  is stringified at the render site, so a non-string cannot reach a React
  child even if a future reader stops coercing.
- Tests at both layers.

**Scope narrowed during rebase.** The second fault — a success result without
an `entries` array — was fixed independently on `main` by another lane while
this branch was open (`Array.isArray(activity.entries)`). That guard is theirs
and is no longer part of this change; the duplicate was dropped rather than
re-litigated. The **timestamp fault was still live on `main` at rebase time**:
`at: row.occurred_at` was uncoerced and `{entry.at}` was rendered raw. That is
what this PR fixes.

## QA / Validation

- Both cases **failed before the fix** with the exact production errors —
  `Objects are not valid as a React child (found: [object Date])` and
  `Cannot read properties of undefined (reading 'length')`. Status: **pass**.
- Three mutations after the rebase, establishing which layer each test proves:

| Mutation | Result |
|---|---|
| Reader stops coercing the timestamp | reader test fails (1 of 39) |
| Render-site guard removed, coercion intact | view test fails (1 of 39) |
| Both removed — the shipped defect, end to end | both fail (2 of 39) |

  Neither layer is redundant: each is the only thing its own test proves.
  Status: **pass**.
- Combined: **39 of 39 pass** across both suites after rebasing onto `main`
  (the count rose from 36 because another lane added cases to the same
  workspace suite). Status: **pass**.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` after deleting
  `tsconfig.tsbuildinfo`: **exit 0**. Status: **pass**.
- ESLint over all four changed files: **exit 0**. Status: **pass**.
- `release-check`: see Audit Evidence, captured as an exit status.
- Both suites are named in `.github/workflows/ai-surface-control-catalog.yml`
  as of `#7925`, and their execution was verified in a job log — so this fix is
  enforced, unlike the change that introduced the bug.
- Signed-in acceptance: **owed**. See Known Gaps.

## Rollout Plan

Squash-merge after required checks pass. Rides the next ACA main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None.
- Approved image digest: Not applicable at authoring time.
- ACA runtime invariant: to be proven on the deploy carrying this SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: **Yes** — the reported defect is a signed-in
  observation and only a signed-in click can close it.

## Rollback Plan

Revert through a new PR. Reverting restores the crash, so prefer a forward fix.

## Audit Evidence

PR link, the before/after failure messages, and the job log showing both suites
execute.

## Known Gaps

- **Not signed-in proven.** The exact reported click has not been repeated
  against a deployed revision. Until it is, this is a fix for a reproduced
  mechanism, not a confirmed resolution of the reported symptom.
- The driver's actual return type for `occurred_at` was **not observed** — no
  database was reached. The fix makes string, `Date` and number all safe, so it
  holds either way, but the precise production value is unverified.
- Other columns on that row type carry the same `string` claim with the same
  absence of enforcement. Only the one that reaches a React child was fixed.
- The timestamp still renders as a raw ISO string; formatting it for a reader
  remains a presentation decision for whoever owns this surface's copy.
