# 2026-09-10-source-portfolio-discount-comparator - Source Portfolio Discount Comparator

## Release ID

`2026-09-10-source-portfolio-discount-comparator`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 can now explain the evidence behind a discount repricing lever without pretending an external market benchmark is loaded. When a selected cloud-consumption contract has discount evidence, the Optimize tab shows the loaded discount signal, any same-tenant cloud commitment peer range, and the explicit caveat that this is buyer-portfolio evidence rather than market percentile proof.

## Layer Impact

Layer 3 CANONICAL MODEL, read-only: adds a typed reader for existing cloud commitment coverage rows. No schema, loader, migration, or data mutation is included.

Layer 4 PRODUCTS, lane `global-control-lane`: Source Contract 360 renders the comparator and includes the same fact in the aVa surface context so the dashboard and assistant use the same evidence boundary.

## Client Applicability

- All clients: Source users with loaded cloud commitment coverage rows can see portfolio-relative discount context on eligible contract Optimize tabs.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Adds a read adapter for `source.cloud_commitment_coverage_observation`.
- Carries same-tenant cloud commitment coverage rows through the lazy Contract 360 detail JSON.
- Adds a deterministic portfolio-relative discount comparator helper.
- Renders the comparator on Contract 360 Optimize when discount repricing evidence or a loaded discount signal exists.
- Adds the comparator fact to the Source workspace aVa surface context.

## QA / Validation

- PASS: Focused Source workspace and read-adapter Jest tests, 57/57.
- PASS: ESLint on touched files.
- PASS: TypeScript `tsc --noEmit`.
- PASS: `git diff --check`.
- PASS: Release-control check.
- Pending: CI checks after PR.
- Pending: ACA deploy and runtime invariant after merge.
- Pending: Live signed-in Source Databricks Optimize smoke.
- Pending: Live signed-in aVa Databricks lever-rationale smoke.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, data-build job, migration, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Optimize and aVa smoke after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required because the release only reads existing rows and changes presentation/context.

## Audit Evidence

- Pull request, CI checks, deploy run, runtime-invariant output, and live Source/aVa smoke notes to be attached after merge and deploy.

## Known Gaps

This release does not load external market benchmark data, same-vendor price benchmarks, target-term fields, or per-SKU serverless versus classic comparison evidence. The comparator is portfolio-relative and must not be described as external market proof.
