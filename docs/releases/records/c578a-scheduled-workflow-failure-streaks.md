# 2026-10-04-scheduled-workflow-streaks — Report how long each scheduled workflow has been failing

## Release ID

`2026-10-04-scheduled-workflow-streaks`

## Status

`candidate`

## Plain-English Summary

A workflow that runs on a timer and fails every single time raises nothing. It
keeps running, keeps failing, and the only thing that notices is a person who
happens to open a run list. One control in this repository had been red for
months in exactly that way, and nothing in the repository measured the shape —
so the same silence was available to every other timed workflow.

This adds the measurement. For each workflow that runs on a schedule, a check
reads its recent scheduled runs and reports two plain facts: how many times in
a row it has failed, and when it last succeeded. If a streak is longer than a
declared ceiling and nobody has declared the condition, the check fails.

The first run of it found that **six of the thirteen scheduled workflows were
in that state at the same time** — streaks of 5, 31, 73, and three so long that
they exceed the 100-run read window, the oldest stretching back to June. None
of those six is repaired here; repairing them is separate work, and several
need credentials or access an automated run does not have. What changes is that
they are now written down, dated, owned, and given an expiry, instead of
failing quietly. The seventh one will be caught the day it starts.

## Layer Impact

- **Repository tooling / CI (no product layer).** This touches no tenant data,
  no canonical model, no product surface and no runtime. It adds a script, its
  test suite, a policy file, one step in an existing pull-request job and one
  new scheduled workflow.
- Layers 1–4 of the data operating model are untouched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository and CI health only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/ci/scheduled-workflow-streak.mjs` — the control. Parses
  `.github/workflows/*.yml` for a real `schedule:` trigger, reads one page of
  `event=schedule` runs per workflow from the Actions API, and reports streaks.
  Modes: `--check` (live), `--policy-check` (offline), `--from-file` (replay a
  recorded payload).
- `scripts/ci/scheduled-workflow-streak.test.mjs` — 50 cases, no network.
- `docs/ci/scheduled-workflow-streak-policy.json` — the declared ceiling, the
  measurement it rests on, and six dated exceptions for conditions that predate
  the control.
- `.github/workflows/scheduled-workflow-streak.yml` — the live half, daily at
  06:40 UTC, on manual dispatch, and on a pull request that touches the control
  itself. `actions: read` and nothing else.
- `.github/workflows/hygiene-gate.yml` — one step running the offline half
  inside the required `Run hygiene_gate.sh` job.
- `package.json` — `check:scheduled-workflow-streak`.
- `docs/architecture/ci-gate-registry.json` — classifies that script as a
  `pr-gate` with the reason.

## QA / Validation

**Clean baseline over the same scope.** `scripts/ci/` held no test file for
this control before this change, so **0 failing before, 0 after**; the suite is
the first executable coverage of the area. No existing suite was modified.

**Red first.** With the module absent, the suite failed at import: 0 passed,
1 failed. With the implementation in place: **50 passed, 0 failed**.

**Thirteen mutations, each killing a named case.** Every one was applied to the
implementation, the suite re-run, and the file restored byte-for-byte:

| mutation | case killed |
| --- | --- |
| count past the most recent success | `streak stops at the most recent success` (+1 more) |
| treat `cancelled` as a failure | `a cancelled run is neutral` (+2 more) |
| treat an unknown conclusion as neutral | `an unrecognised conclusion is a failure` |
| treat an in-progress run as a failure | `an in-progress run is not a failure` (+1 more) |
| `>=` instead of `>` on the ceiling | `a streak equal to the ceiling is not a breach` |
| never expire an exception | `an expired exception does not suppress` |
| match an exception by prefix | `an exception matches by exact filename` |
| mark any no-success window truncated | `a window that is not full reports an exact streak even with no success` |
| skip an unreadable `on:` block | `an unreadable trigger block is an anomaly` |
| ignore stale exceptions | `an exception is stale once the workflow succeeds after it was filed` |
| drop the expiry check in `validatePolicy` | `validatePolicy refuses an expired exception` |
| accept an exception naming no scheduled workflow | `validatePolicy refuses an exception naming a workflow that is not scheduled` |
| call any success a recovery | `an exception is not stale when the only success predates it` |

**The gate runs and can fail, proved in both directions.** `--policy-check`
exits 0 on the real policy file; `--from-file` over a fixture payload with a
9-run streak exits 1 and names the workflow; the same payload with a success
exits 0; an unrecognised flag exits 2 rather than being ignored.

**One correction recorded rather than quietly fixed.** The first draft called
an exception *stale* whenever the workflow's streak was at or below the
ceiling. Running the live check immediately reported `l10-soc2-evidence-pack`
as stale — a workflow that has never succeeded in its entire five-run history
and sat at exactly the ceiling that day. A workflow one run from breaching has
not recovered, and that predicate would have had the entry deleted and re-added
every few days. Staleness now means the workflow has succeeded *since the
exception was filed*, which required `observedAt` to become a mandatory field.
Two cases pin the corrected predicate, and the mutation that reverts it is in
the table above. It was found by running the control, not by reading it.

**The ceiling is measured, not chosen.** Over the same read window, every
failure burst that a scheduled workflow recovered from was 4 runs or shorter.
The one longer run of consecutive failures that ended in a success is 70, and
that was a multi-week outage somebody eventually repaired — the thing this
control reports, not flake it should tolerate. 5 sits strictly above every
observed transient and far below every dead condition. The basis is written
into the policy file so the next person can re-measure rather than re-guess.

**Repository gates.** `npm run check:scheduled-workflow-streak` exits 0.
`node scripts/audit/ci-gate-registry-check.mjs` passes (236 scripts) and the
order audit passes. Typecheck, ESLint and `release-check` results are recorded
on the pull request.

## Rollout Plan

Merge to `main`. No image build, no migration, no flag, no runtime change. The
offline half begins gating on the next pull request; the live half first runs
on this pull request (its `paths` filter matches) and then daily at 06:40 UTC.

## Deployment Authority

- Repo-owned deploy workflow: not invoked — nothing in this change is deployed.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected; no Container App, revision, worker job,
  image, flag, env var, scale or secret is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and this is a ceiling by design rather
  than by blockage. The change contains no route, component, API response,
  control surface, flag or tenant datum, so there is nothing a signed-in reader
  could be shown.

## Rollback Plan

Revert the pull request. Nothing persists outside the repository: no migration,
no deployed artifact, no stored state. Deleting
`.github/workflows/scheduled-workflow-streak.yml` alone stops the live half
while leaving the offline policy gate in place.

## Audit Evidence

- Pull request, with the red-first numbers, the mutation table and the gate
  results quoted from the blocking runs.
- The `Run hygiene_gate.sh` required check on the pull request, which executes
  the offline half.
- The `Scheduled workflow failure streaks` run on the pull request: its job
  summary carries the per-workflow report, and `streak-report.json` is uploaded
  as an artifact with 30-day retention.

## Known Gaps

- **Six scheduled workflows are failing and are not repaired here.** They are
  declared with an owner, a reason, a measured streak and an expiry of
  2026-11-04. Each needs its own diagnosis; one of them is blocked on an
  operator-provisioned credential and no automated run can close it.
- **A disabled workflow still reads clean.** GitHub disables schedules after 60
  days of repository inactivity, and a disabled workflow produces no runs, so
  its streak is zero. `state` and `lastRunAt` are reported for that reason, but
  nothing gates on them. Whether they should is a separate decision.
- **The monitor cannot report its own permanent failure.** It scans itself, so a
  run that fails and recovers appears in the next run's own row; one that never
  runs again reports nothing. Closing that needs a second, independent actor
  and is deliberately not attempted here.
- **The streak is a lower bound when the window is full.** Runs are read one
  page deep, so three of the six are reported as `>=100` rather than with an
  exact count. Pagination would give the exact number and buys nothing for the
  verdict, which is the same either way.
