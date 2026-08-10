# 2026-08-10-source-approval-write-fail-closed — Source Approval Persistence Safety

## Release ID

`2026-08-10-source-approval-write-fail-closed`

## Status

`candidate`

## Plain-English Summary

Source stage approvals now fail closed when the append-only approval record cannot be written. A gate is not treated as approved unless the workflow state and approval evidence both persist successfully.

## Layer Impact

- `global-control-lane`: Source approval routes surface a real write failure instead of leaving users with a silent stuck state.
- Product layer: Source event approvals now require the workflow state and approval evidence row to persist before reporting success.
- Canonical data layer: Approval evidence remains required for stage-gate truth; no schema or data migration is included.

## Client Applicability

- All clients: Yes, for Source event approval flows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`
- `src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts`
- `src/app/api/v1/source/events/[eventId]/approve/route.ts`
- `src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts`

## QA / Validation

- PASS: `npm test -- --runInBand src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' src/lib/source/__tests__/approval-ledger.test.ts`
- PASS: `npx eslint src/lib/data-plane/write-adapters/sourceWriteAdapter.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts 'src/app/api/v1/source/events/[eventId]/approve/route.ts' 'src/app/api/v1/source/events/[eventId]/approve/__tests__/route.test.ts' src/lib/source/approval-ledger-model.ts`
- PASS: `npx tsc --noEmit --pretty false`
- BLOCKED UNTIL DEPLOY: Live signed-in approval-page smoke test after ACA deployment.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the deploy workflow.
- ACA runtime invariant: Required before live claim.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source approval page.

## Rollback Plan

Revert this PR and redeploy through the same ACA workflow. No data rollback is required because this change only makes failed approval-evidence writes visible.

## Audit Evidence

To be attached after merge/deploy:

- Pull request URL.
- GitHub checks/deploy run.
- Live signed-in smoke-test notes.

## Known Gaps

This does not change the underlying database schema. If the live approval evidence write is being rejected by schema, policy, or permissions, this release will expose that root cause instead of masking it.
