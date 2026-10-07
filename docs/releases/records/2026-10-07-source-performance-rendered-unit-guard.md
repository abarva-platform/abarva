# Source Performance Rendered Unit Guard

## Release ID

`2026-10-07-source-performance-rendered-unit-guard`

## Status

`candidate` - not merged, deployed, or live-proven by this record.

## Plain-English Summary

The contract Performance table could return a stored text value before checking whether its percent sign contradicted the metric's named unit. The trend chart also placed different measures on one percentage axis. This release refuses the contradictory text and charts only one governed percentage metric across comparable periods.

## Layer Impact

- Release lane: `global-control-lane`.
- Layers 1-3: unchanged. No adapter, schema, canonical observation, or data load changes.
- Layer 4: Source contract Performance rendering only. Contradictory display text falls back to the existing numeric observation; if that numeric value is absent, the row says its unit needs review.

## Client Applicability

- All clients using the Source contract Performance view.
- No feature flag or client-specific data exception.

## Changes Included

- Apply the metric/unit conflict guard before returning stored actual text.
- Build a percentage trend from one named metric with distinct periods. For a metric whose name does not declare its unit, require both a percentage unit and percentage-marked actual text; exclude named time and count measures.
- Name the charted metric and use a full percentage axis; show an empty state when no comparable trend exists.

## QA / Validation

- Red-first: an existing stored-text row reproduced the erroneous percent suffix; the new assertion failed before the fix.
- Mutation: removing the chart's metric-name filter failed the two-period negative control; the restored guard passed.
- PR CI found an SLA-compliance label that contains "tickets" but is measured as a percentage. A red-first browser-shaped case now preserves its percent actual and trend, while incompatible named units remain excluded.
- Focused Performance suite: 71/71 passed; all 11 Source workspace suites: 128/128 passed.
- TypeScript typecheck: passed. Changed-file ESLint: no errors, one pre-existing warning.
- `release:check`: 11/11 local gates passed. Applicable PR CI and signed-in replay are required before acceptance.

## Rollout Plan

Merge by PR only after applicable checks are green. The repository-owned ACA main workflow is the only shared runtime release path. Verify the digest-pinned web template, healthy 100%-traffic revision, and worker images, then replay the affected Performance table and chart signed in.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- No direct Azure runtime mutation, feature flag, migration, or data build in this release.

## Rollback Plan

Revert through a PR and redeploy via the repo-owned main workflow. Existing canonical observations remain unchanged either way.

## Audit Evidence

- Focused test red/green and mutation results, PR and CI, main deploy run, digest/traffic/worker readback, and signed-in Performance replay.

## Known Gaps

- Existing contradictory canonical observations are not repaired; a package replay requires a separate exact authorization and data readback.
- This chart shows one percentage metric, not a composite of every SLA measure. Time and count observations remain visible in the table without a misleading percentage trend.
