# 2026-09-10-source-optimize-dashboard-clarity - Source Optimize Dashboard Clarity

## Release ID

`2026-09-10-source-optimize-dashboard-clarity`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now makes consumption-contract optimization easier to explain in the dashboard itself. Contract detail pages can show the month-by-month consumption ramp already loaded for the selected contract, and the Optimize tab now sequences negotiation levers into a practical playbook: what to open with, what to attach, what to validate, and what to hold back until more evidence exists.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source presentation and view-model projection only. The release does not add loaders, migrations, canonical facts, source adapters, tenant data, or data-plane writes.

## Client Applicability

- All clients: Source Contract 360 users see clearer consumption and negotiation sequencing where the underlying contract detail already has monthly spend and optimization opportunity rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Contract 360 Economics and Optimize tabs render a consumption ramp when monthly contract spend rows are present.
- The ramp scales every month against the largest committed run-rate in the observed series and marks future/open periods as partial instead of extrapolating them.
- Optimize renders a negotiation sequence under the lever table using deterministic authored rules for common lever types and fallback ordering by priority, deadline, and evidence stage.
- Held-back asks are rendered last with their evidence gate so advisory signals do not appear as primary documented asks.
- The workspace projection now carries the parsed negotiation owner role through to the dashboard.

## QA / Validation

- PASS: Targeted Source workspace Jest test, 40/40 tests.
- PASS: ESLint on touched Source files.
- PASS: TypeScript `tsc --noEmit`.
- PASS: `git diff --check`.
- PASS: Release-control check.
- Pending: CI, ACA runtime invariant, and live signed-in Source smoke after pull request merge and deploy.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, data-build job, migration, or feature-flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Economics and Optimize smoke after deployment.

## Rollback Plan

Revert the Source presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- Pull request URL, CI checks, merge SHA, ACA deploy run, runtime-invariant output, and live Source smoke notes.

## Known Gaps

This release does not add benchmark comparator data or target-term canonical fields. Discount-rate asks and compute-mode parity signals remain evidence-gated until an accepted benchmark comparable or per-SKU usage comparison is loaded.
