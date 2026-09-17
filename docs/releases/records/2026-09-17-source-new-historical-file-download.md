# 2026-09-17-source-new-historical-file-download - Preserve Selected File Version

## Release ID

`2026-09-17-source-new-historical-file-download`

## Status

`candidate`

## Plain-English Summary

When a user selects an older file version in the Source New explorer, Download now requests that selected version. Current files continue to use the normal authoritative download path.

## Layer Impact

`global-control-lane`, Layer 4 product UI only. The existing authenticated download route, artifact records, and storage are unchanged.

## Client Applicability

- All clients: Source New event workspace users with access to file history.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

The Source New Files download action adds the existing `includeHistory=1` query parameter only for non-current selections. Focused tests cover historical and current URLs.

## QA / Validation

Focused Source New workspace tests: 11 passed. Existing authenticated download-route tests: 12 passed. Scoped ESLint, TypeScript (`tsc --noEmit --incremental false`), and `npm run release:check`: passed. Signed-in historical-version download and opposite-tenant denial remain pending.

## Rollout Plan

Squash-merge after review and checks; the repo-owned ACA main deploy workflow publishes the change. No migration or data build is needed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Download a selected historical version and compare its version/hash with the selected row; verify current-version behavior and tenant denial.

## Rollback Plan

Revert this UI change through a new PR and the repo-owned deploy workflow. The existing download route and stored versions are unaffected.

## Audit Evidence

PR, focused test output, CI, ACA digest/invariant proof, and signed-in historical-version download proof to be added when available.

## Known Gaps

No signed-in browser proof yet. File-history export eligibility remains enforced by the existing route.
