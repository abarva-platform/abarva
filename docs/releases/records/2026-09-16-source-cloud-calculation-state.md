# Source cloud calculation state

## Release ID

`2026-09-16-source-cloud-calculation-state`

## Status

`candidate`

## Plain-English Summary

Cloud package proposal amounts are not calculated values when the package has no executable sizing rule or numeric formula inputs. Keep the proposal and its evidence references available for review, but store a blocked calculation and an unsized opportunity until a reproducible method is loaded.

## Layer Impact

`client-data-lane`. The Layer 3 cloud package loader and its expected Layer 4 reconciliation change. No schema, source files, web route, or existing database rows are changed by the code release alone.

## Client Applicability

- All clients using this cloud package loader on a future governed run.
- No client data is mutated by merging or deploying this code.
- No feature flag is added.

## Changes Included

- Retain authored proposal fields in the opportunity payload, but write null canonical amount, `not_sized` amount state, and signal stage.
- Write a blocked calculation run with no numeric calculation output; evidence references remain pending numeric mapping.
- Leave valuation amount and effective date unset, and request an executable sizing rule before finance review.
- Reconcile candidate row counts separately from finance-ready amount rows.

## QA / Validation

- Focused package-plan tests pass and assert candidate rows remain while finance-ready amount rows are zero.
- Node syntax, scoped ESLint, TypeScript with an 8 GB heap, and release check are required before PR review.
- No Azure Layer 3/4 readback or signed-in proof has been performed.

## Rollout Plan

Squash-merge only after PR review. A web deploy does not refresh Layer 3 or Layer 4 data. A separately approved ACA operator job must inventory the current rows, apply the loader to its exact package scope, reconcile all affected counts and amounts, then verify the product read path. Do not run this job alongside a separate opportunity-ownership cutover without a reviewed combined plan.

## Deployment Authority

- Shared web runtime: repo-owned ACA main deploy workflow only.
- Approved digest and ACA runtime invariant: verify after any main deploy.
- Worker image invariant: verify before an operator job.
- Live signed-in proof: required after the governed data build, not claimed here.

## Rollback Plan

Preserve the pre-run proof bundle and row inventory. If an operator job has run, use a reviewed forward repair or exact-scope restoration under the same job governance; code rollback alone does not restore data. Do not reinstate authored amounts as calculated outputs merely to recover a dashboard total.

## Audit Evidence

PR diff, package-plan test output, TypeScript/ESLint/release-check results, and later ACA job proof bundle with Layer 3/4 and signed-in readback.

## Known Gaps

- No package opportunity has an independently executed sizing formula in this code path. Adding one requires numeric input mapping, a versioned arithmetic rule, reporting cutoff, and calculation verification.
- Existing Azure records retain their prior state until a separately approved data build runs.
