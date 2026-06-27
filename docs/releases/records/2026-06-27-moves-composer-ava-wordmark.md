# 2026-06-27-moves-composer-ava-wordmark — Moves Composer aVa Wordmark

## Release ID

`2026-06-27-moves-composer-ava-wordmark`

## Status

`candidate`

## Plain-English Summary

Adds the smaller aVa wordmark to the bottom composer on the Strategic Moves origination page. This completes the approved placement rule: circular aVa avatar at the top/header, aVa wordmark in the lower chat composer.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves UI presentation only. No data, model, routing, auth, or tenant-scoped behavior changes.

## Client Applicability

- All clients: Yes, for the Strategic Moves origination page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`

## QA / Validation

- Passed: Focused Jest for Strategic Moves origination rendering.
- Passed: Focused ESLint for touched TSX files.
- Pending: `npm run release:check` after this release record is added.
- Pending: Signed-in live browser proof after ACA deploy.

## Rollout Plan

Merge to main and deploy through the Azure Container Apps `ACA main deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: None.
- Approved image digest: Captured by deploy workflow after merge.
- ACA runtime invariant: Verified by deploy workflow.
- Worker image invariant: No worker behavior impact; deploy workflow keeps image invariant.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the UI commit or roll ACA traffic back to the previous healthy revision. No migration rollback is required.

## Audit Evidence

- PR and CI checks after branch publication.
- ACA deploy run after merge.
- Signed-in screenshot proof after deploy.

## Known Gaps

No functional gaps are known. This is a visual completion patch for the already-approved logo placement rule.
