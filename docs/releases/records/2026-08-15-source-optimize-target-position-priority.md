# 2026-08-15-source-optimize-target-position-priority — Optimize Target Position Priority

## Release ID

`2026-08-15-source-optimize-target-position-priority`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract workflow now selects a true negotiation target position before selecting other approval-required opportunity rows. This prevents the strategy approval action from opening on a diagnostic or internal-scope row that cannot create the governed vendor-outreach approval request.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract selection behavior is tightened for the existing opportunity read model.
- Canonical model: No schema or persisted-data change. Existing opportunity states and workflow rows are consumed as-is.

## Client Applicability

- All clients: Yes, for tenants using the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source Optimize availability only.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- Pass: Focused unit regression covers the live failure shape where an `approval_required` scope row appears before a `target_position` negotiation row.
- Pass: Focused lint for the changed source and test files.
- Pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npm run release:check && git diff --check`
- Pending: ACA deploy proof and signed-in browser proof are required before release.

## Rollout Plan

Merge to `main`, then activate through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be recorded by the ACA deploy evidence.
- ACA runtime invariant: Required before live-proof claim.
- Worker image invariant: Required before live-proof claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on the Optimize Contract route.

## Rollback Plan

Revert the PR and redeploy through the same ACA workflow. No data migration rollback is required.

## Audit Evidence

- PR URL: To be added.
- Local test output: To be added.
- ACA deploy evidence: To be added after merge.
- Signed-in browser proof: To be added after deploy.

## Known Gaps

This does not create or approve any workflow state by itself. It only chooses the correct default opportunity before the existing governed action runs.
