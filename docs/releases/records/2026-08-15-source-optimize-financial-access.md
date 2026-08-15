# 2026-08-15-source-optimize-financial-access — Source Optimize Financial Access Gate

## Release ID

`2026-08-15-source-optimize-financial-access`

## Status

`candidate`

## Plain-English Summary

The Optimize Contract route now checks Source financial visibility before loading contract optimization data. Users without financial visibility see a clear restricted-access state, and the server does not load or serialize exact contract values, opportunity amounts, evidence packs, or calculation rows into the browser session.

## Layer Impact

- Release lane: `global-control-lane`
- Products: Source Optimize Contract now fails closed for users who do not have financial visibility for the active client.
- Canonical model: No schema or data model change.
- Source adapters: No adapter change.
- Client intake: No intake or template change.

## Client Applicability

- All clients: Applies to the shared Source Optimize Contract route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/optimize/page.tsx`
- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/app/(maestro)/source/optimize/__tests__/page.financial-access.test.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/app/'(maestro)'/source/optimize/__tests__/page.financial-access.test.tsx src/lib/auth/__tests__/source-access-policy.test.ts --runInBand` — passed, 44 tests.

## Rollout Plan

Merge to main through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required before calling the route live-proven.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for an authorized Source user on the Optimize Contract route.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Focused Jest output proving unauthorized route sessions do not call contract/evidence/opportunity loaders.
- ACA deploy workflow run and digest invariant.
- Signed-in browser proof after deployment for the authorized Source Optimize route.

## Known Gaps

This change does not build a redacted non-financial Optimize experience. It intentionally blocks the workflow until financial visibility is available.
