# 2026-10-02-home-investment-proof-readout - Home Investment Proof

## Release ID

`2026-10-02-home-investment-proof-readout`

## Status

`candidate`

## Plain-English Summary

The Home value chapter now separates declared program investment from evidence of realized benefits. It groups budgets and forecasts only through declared priority IDs, shows forecast pressure, and says when benefit claims are modelled or unsupported. Spend records without a verifiable completed period are excluded from current-period spend calculations. The same readout appears in walkthrough exports.

## Layer Impact

- `global-control-lane`: Home read-model aggregation, chapter rendering, and export presentation change. Canonical rows and source data are not modified.
- Canonical model remains the source of truth; this release adds no inferred identity or relationships.

## Client Applicability

- All clients: shared Home code receives the change, but the new readout appears only when a qualifying source-linked enterprise context is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: the current qualifying record is synthetic reference material and remains labelled as such.
- Feature flag: no new flag.

## Changes Included

- Source-linked program budget, forecast, value-claim, and priority aggregation.
- Completed-period admission for spend rollups; undated or future-period records are excluded.
- Value chapter and HTML/PDF export readouts with explicit evidence limits and record drill-through.
- Focused read-model, rendering, and export tests.

## QA / Validation

- Focused Home read-model, panel, and export suites: 13 tests passed.
- TypeScript typecheck and targeted ESLint: passed.
- Home ratchet: 830/858 tests, the same 12 baselined suites, no movement.
- Release check: 11 of 11 gates passed.
- PR CI and signed-in browser proof: pending.

## Rollout Plan

Squash-merge the validated PR to protected main. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA. Verify runtime image invariants and the signed-in Home value chapter and export after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: determined by the main deploy workflow.
- ACA runtime invariant: verify the template and 100% traffic revision match the approved digest.
- Worker image invariant: verify required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, including the value chapter and export.

## Rollback Plan

Use the approved main deploy workflow to deploy a revert commit. No data rollback or schema reversal is needed.

## Audit Evidence

PR, CI, ACA deploy run, runtime invariant output, and signed-in browser/export proof will be linked in the release report.

## Known Gaps

- Benefit realization is not client-attested in the qualifying synthetic reference record; the chapter does not claim that it is.
- Future or undated spend records fail the completed-period admission check; the source date remains synthetic and is not a client attestation of currency.
- This release does not create a time series, reconcile finance line items to program budgets, or infer dependency joins.
