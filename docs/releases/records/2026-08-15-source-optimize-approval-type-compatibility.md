# 2026-08-15-source-optimize-approval-type-compatibility — Source Optimize Approval Compatibility

## Release ID

`2026-08-15-source-optimize-approval-type-compatibility`

## Status

`candidate`

## Plain-English Summary

Source Optimize now treats the legacy vendor-outreach approval type as the same governed strategy-approval concept used by the current Optimize Contract workflow. This prevents an existing approval request from being hidden from the workflow rail, while preserving the stricter current approval type for newly written rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 Canonical Enterprise Model: No schema or fact semantics changed. Existing approval rows are read through a compatibility mapping, and new strategy-approval writes keep the current canonical approval type.
- Layer 4 Products: Source Optimize reads the compatibility-mapped approval state so the 7-step rail, action panel, and value-proof status stay aligned with persisted workflow rows.

## Client Applicability

- All clients: Yes. The compatibility rule is tenant-agnostic.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/contract-optimization-workflow-actions.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts --runInBand` passed: 4 suites, 34 tests.
- Broader lint, typecheck, release-check, and live proof are required before marking released.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: To be captured from the main deploy workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source Optimize route with a selected governed contract.

## Rollback Plan

Revert the PR. The rollback restores the prior strict read/write behavior; no data rollback is required.

## Audit Evidence

- Pull request URL, merge commit, ACA deploy run, runtime digest, focused test output, and signed-in Source Optimize browser proof will be attached after rollout.

## Known Gaps

This does not create new approval rows, calculate opportunities, or claim realized value. It only keeps existing and current approval vocabulary aligned for the Source Optimize workflow.
