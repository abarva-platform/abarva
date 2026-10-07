# Source — a metric name overrides a stored unit that contradicts it

## Release ID

2026-10-07-performance-unit-conflict-guard

## Status

Open with auto-merge armed — not deployed and not live-proven by this record.

## Plain-English Summary

The service-performance table used to append `%` to every numeric actual. An earlier change in
`2026-10-07-source-workspace-stops-narrating-itself` made it read the row's declared `unit` column
instead. **That was not enough**, and a parallel QA lane caught it before anyone relied on it.

`scripts/source/load-contract-depth-package.ts` writes `unit: "%"` for **every** service-performance
row it creates. So the stored unit is `%` even for metrics the package itself names:

| Metric name in the loaded package | Stored unit | Rendered before |
|---|---|---|
| `critical_incident_response_minutes` | `%` | `35.0%` |
| `p1_p2_resolution_hours` | `%` | `8.0%` |
| `problem_backlog_older_30_days` | `%` | `120.0%` |

All three are loaded against the contract used in demonstrations. Reading the stored unit alone
still rendered minutes and counts as percentages — the defect survived its own fix.

The display now consults the metric's own name as well. Where the name and the stored unit
contradict each other, the row has not established its unit and **none is asserted**: the number
renders alone.

That asymmetry is deliberate. Showing `8.0` where the truth is `8 hours` **understates** the fact;
showing `8.0%` **misstates** it. On SLA evidence, misstating is the worse failure.

Where the two agree, or where only one of them speaks, the unit is used — so a genuine
`report_refresh_timeliness_pct` still reads as a percentage, and a metric naming minutes with no
stored unit reads as minutes.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only — one display helper and its call site. No schema change, no migration, no
query, no change to any stored value.

## Client Applicability

**All clients**, no gating and no feature flag. Visible wherever service-performance actuals render.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — `unitFromMetricName`,
  the conflict rule in `performanceActual`, and the metric name passed at the call site.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — three cases added.

## QA / Validation

| Check | Status |
|---|---|
| Performance suite | PASS — 69 cases |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — remove the conflict guard | PASS — failed as intended, verified by an explicit run |
| ESLint, release check | PASS |
| Signed-in acceptance | NOT RUN |

The test fixtures use the **real metric names from the loaded package**, not invented ones, so the
case under test is the one that renders on the demonstration contract.

A measurement note: the mutation harness printed no result at all — for the mutation *and* for the
baseline. That is the harness failing, not a passing mutation, and it is only distinguishable
because the baseline was silent too. Each run was repeated explicitly, and the guard's removal does
fail its case.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

**Note on the preceding deploy:** the deploy of the merge that carried the earlier, insufficient fix
**failed** (`Build and deploy Azure Container Apps revision: failure`) during a GitHub partial
system outage. The pipeline has since recovered: a later main deploy succeeded, and the web
Container App's template image, its single 100%-traffic revision and that revision's image are the
same digest-pinned reference, healthy and active. So the earlier, insufficient fix is deployed and
serving; this change is not, until it merges and its own deploy succeeds.

Deployed is not proven. No signed-in walk of the performance surface has been run for either
change, so neither is live-proven by this record.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The display returns to trusting a stored unit that the loader sets to `%` for
every row, and minutes and counts render as percentages again.

## Audit Evidence

- A mutation removing the conflict rule fails the case naming
  `critical_incident_response_minutes`, which is the exact failure mode reported by QA.
- A control asserts a genuine `_pct` metric still renders with a percent sign, so the guard is not
  stripping every unit indiscriminately.

## Known Gaps

- **The stored data is still wrong.** This stops a wrong unit being rendered; it does not correct
  the rows. The loader-side fix — so a future authorized load writes the right unit, validated in
  preflight before any database connection — is a separate change in another lane.
- **Existing rows keep their `%`** until a separately authorized rebuild. No tenant row was changed
  here.
- The metric-name parser recognises minutes, hours, days, counts and percentages. A metric naming a
  unit outside that set still renders as a bare number, which is correct but silent.
- The performance trend chart is not covered by this change; it plots values without regard to
  whether the metrics are comparable. That is reported and owned elsewhere.
- Not deployed and not live-proven.
