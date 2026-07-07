# 2026-06-12-tenant-file-vault — Setup Tenant File Vault

## Release ID

`2026-06-12-tenant-file-vault`

## Status

`candidate`

## Plain-English Summary

Adds a Setup/Admin "All files" vault at `/setup/files` that reuses the Workspace Explorer shell to show tenant-scoped Source and Moves artifacts in one place. The vault is surfacing-only: generation and upload remain owned by the existing per-module routes. File opens go through a tenant-vault wrapper that checks the user's module scope and allowed data classes before handing off to existing download routes.

## Layer Impact

- `global-control-lane`: Adds an admin surfacing route and shared Workspace Explorer back-label support.
- `client-data-lane`: Reads tenant-scoped `source_artifacts`, `move_artifacts`, and `generated_artifacts` rows; no schema changes and no data mutation.
- `internal-admin`: Makes tenant file review discoverable from Setup/Admin.

## Client Applicability

- All clients: Route is available to signed-in users with an active tenant and existing Source/Moves access policy.
- Specific clients: None.
- Internal only: Setup/Admin operator surface.
- Public/demo only: No.
- Feature flag: No new flag. Existing Source/Moves workspace flags remain unchanged; this route is additive and uses existing policy checks.

## Changes Included

- New `/setup/files` page using `AdminCanonShellV2` and `WorkspaceExplorer`.
- New tenant-vault adapter over Source registry artifacts, Moves File Cabinet artifacts, and generated artifacts.
- New tenant-vault download wrapper at `/api/setup/files/[scope]/[artifactId]/download`.
- Additive tenant-wide list helpers for Source artifacts, Move artifacts, and generated artifacts.
- Focused policy and wrapper-route tests for restricted data and program/source scoping.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/workspace-explorer/__tests__/tenant-vault-policy.test.ts 'src/app/api/setup/files/[scope]/[artifactId]/download/__tests__/route.test.ts' --runInBand`
- Pass: `npx eslint` over touched Source/Moves workspace, tenant-vault, route, and test files.
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run audit:architecture-rules`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.

## Rollout Plan

Merge to `main`, deploy the normal web image, and use the route from the Setup/Admin shell. No migration or flag flip is required.

## Rollback Plan

Revert the PR. The route and helper functions are additive and do not alter existing Source or Moves generation, approval, upload, or download contracts.

## Audit Evidence

- PR URL and CI run after opening.
- Local test and release-check output in PR conversation.
- Route-level tests proving restricted artifacts are blocked before redirecting to existing module download routes.

## Known Gaps

The vault wrapper enforces tenant scope and data-class access before preview/download. It does not yet write a dedicated audit-log row for every vault open; downstream module download routes still own the actual byte streaming.
