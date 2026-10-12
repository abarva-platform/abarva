# 2026-10-12-source-economics-calendar-month

## Release ID

`2026-10-12-source-economics-calendar-month`

## Status

Candidate. No data mutation or deployed acceptance.

## Plain-English Summary

The contract Economics chart formats reporting dates in UTC, matching the existing performance-chart convention. A January date no longer renders as December in a browser west of UTC. Values, periods, calculations and layout do not change.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1 through 3: no input, canonical row, selector, schema or RLS change.
- Layer 4: calendar month labels preserve the reporting date instead of shifting with the viewer's timezone.

## Client Applicability

- All clients: contract Economics charts with date-only or midnight-UTC observations.
- Specific clients: none separately configured.
- Internal only: rendered DOM regression tests.
- Public/demo only: no synthetic data load or financial claim.
- Feature flag: none; no authentication/RLS change.

## Changes Included

- Existing month formatter gains the same explicit UTC option as the performance chart.
- Existing billing-coverage suite renders the real chart using a Chicago-default formatter.

## QA / Validation

- The January label assertion fails against the old formatter and passes with UTC.
- Initial test targeted SVG text, but the actual axis labels are HTML spans. Correcting that selector retained the red failure, then the fix passed; the instrument failure was not counted as product proof.
- Existing ten-case Economics suite passes. Removing the UTC option reproduces the calendar failure.
- Full contract workspace sweep passes 40 suites / 403 tests. Node24 TypeScript with an8GiB heap, focused lint and all11 release gates pass.
- No new Jest file or census count is introduced.

## Rollout Plan

Review and squash merge after applicable exact-head QA/CI and current-main reconciliation. Only the repo-owned ACA main workflow builds and promotes the shared image. Verify template, healthy100%-traffic revision and both workers separately, then check signed-in chart labels. This does not repair future-dated or missing underlying observations.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: not captured for this candidate.
- ACA runtime invariant: digest-pinned template and healthy active100%-traffic revision must match.
- Worker image invariant: both required jobs verified separately.
- Feature/env flag update path: none.
- Live signed-in proof required: reporting month labels on affected contract Economics charts.

## Rollback Plan

Revert the formatter through a reviewed PR and the main workflow. No data rollback is necessary because canonical periods and values remain unchanged.

## Audit Evidence

Signed-in before-observation, rendered DOM red/green regression, exact-head test/CI results, PR, main deploy witness, runtime invariant and later signed-in label proof.

## Known Gaps

No certification of financial measurements, reporting-period eligibility, active-view coverage, invoices/payments, calculated recommendations or full contract readiness.
