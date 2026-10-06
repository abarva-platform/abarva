# 2026-09-19-source-new-approval-trail-shape - Source New Approval Trail Shape Guard

## Release ID

`2026-09-19-source-new-approval-trail-shape`

## Status

`candidate`

## Plain-English Summary

The Source New approvals view now treats a malformed successful decision-trail payload as unavailable instead of crashing or presenting an empty approval history. Opening the view remains read-only and does not approve, advance, or write anything.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: Hardens Source New approval-history rendering only.
- Data plane: No schema, tenant data, approval record, artifact, or lifecycle state changes.

## Client Applicability

- All clients: Applies to the shared Source New event workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/new-workspace/SourceNewWorkspace.tsx`
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`

## QA / Validation

- PASS - `npx jest src/components/source/new-workspace/SourceNewWorkspace.test.tsx --runInBand`
- PASS - `npx eslint src/components/source/new-workspace/SourceNewWorkspace.tsx src/components/source/new-workspace/SourceNewWorkspace.test.tsx`
- PASS - `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck`
- PASS - `git diff --check`
- PASS - `npm run release:check`

## Rollout Plan

Merge the pull request to main. The repository-owned Azure Container Apps deployment workflow may carry the product-rendering fix in the next approved web image. No data migration, tenant load, manual approval write, feature flag, or operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Required only when the commit is deployed to the shared runtime.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after deploy for the affected Source New approvals path before claiming live-proven.

## Rollback Plan

Revert the pull request. This restores the prior Source New approvals rendering behavior. No database rollback or tenant-data cleanup is required.

## Audit Evidence

- Local validation commands listed above.
- Pull request and CI results once opened.

## Known Gaps

No deployed or signed-in production proof is claimed by this release record.
