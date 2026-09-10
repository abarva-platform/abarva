# 2026-09-10-source-optimize-dashboard-clarity - Source Optimize Dashboard Clarity

## Release ID

`2026-09-10-source-optimize-dashboard-clarity`

## Status

`released; live-proven`

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
- PASS: CI checks for the merged Source Optimize dashboard clarity change.
- PASS: ACA deploy carried the change into active main SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- PASS: Runtime invariant on active digest `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160`.
- PASS: Live signed-in Source Databricks Optimize smoke showed the contract command surface, removed the duplicate top action toolbar and old instructional labels, rendered `MER-TECH-DBX-001`, six levers, `4 sized · 2 signal-stage`, sized opportunity `$1.5M`, the lever table, and the negotiation sequence with no `$1.8M` or `6 sized` leakage.
- PASS: Live signed-in aVa smoke for `MER-TECH-DBX-001` returned the proof marker, contract ID, vendor, sized-vs-signal distinction, sequence, and evidence gates without signal-stage dollar leakage.
- PASS: Live signed-in Source AWS Optimize smoke showed `MER-CLOUD-AWS-001`, Amazon Web Services, annual value, avoidable and negotiable opportunity figures, and no Databricks bleed.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, data-build job, migration, or feature-flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:9b1a94625361acd6e350a8871426e2c9a79d93dcee21b2d0c1131bde3ed5c160` on active SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`.
- ACA runtime invariant: PASS on active revision `ca-abarva-web-lab-eastus--mb9a0225d`.
- Worker image invariant: PASS for required worker jobs on the same digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Economics and Optimize smoke after deployment.

## Rollback Plan

Revert the Source presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- Pull request, CI checks, active main SHA `b9a0225d96cbe4f127445f5ee225fea5b3fecb0d`, ACA deploy run `34442823605`, runtime-invariant output, Source Databricks/AWS smoke notes, and aVa Databricks smoke notes.

## Known Gaps

This release does not add benchmark comparator data or target-term canonical fields. Discount-rate asks and compute-mode parity signals remain evidence-gated until an accepted benchmark comparable or per-SKU usage comparison is loaded.
