# 2026-09-16 Source New Files Mobile Detail

## Release ID

`2026-09-16-source-new-files-mobile-detail`

## Status

`candidate`

## Plain-English Summary

On narrow screens, opening a file shows a focused detail view. Back restores the same folder, search, version-history setting, list scroll position, and keyboard focus. The existing detail fields and caller-authorized actions remain in use. Desktop layout and selection behavior are unchanged.

## Layer Impact

`global-control-lane`, Layer 4 product presentation only. This change does not alter canonical records, adapters, intake, or file permissions.

## Client Applicability

- All clients: Source New Files users on narrow screens.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/components/source/new-workspace/SourceNewFiles.tsx`: mobile detail navigation and component-scoped styles.
- `src/components/source/new-workspace/SourceNewFiles.test.tsx`: focused mobile return and keyboard behavior coverage.
- This release record.

## QA / Validation

- `./node_modules/.bin/jest src/components/source/new-workspace/SourceNewFiles.test.tsx --runInBand --no-coverage --silent`: 7 tests passed.
- `./node_modules/.bin/eslint src/components/source/new-workspace/SourceNewFiles.tsx src/components/source/new-workspace/SourceNewFiles.test.tsx`: passed.
- `npm run release:check`: passed.
- `git diff --check`: passed.

## Rollout Plan

Review and merge through a pull request. The repo-owned ACA main deploy workflow is the only path to shared runtime traffic. No deployment or traffic change is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after an approved merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Must be checked by the deployment owner after deployment.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Mobile file open and Back, plus desktop regression, after deployment.

## Rollback Plan

Revert the presentation change through a follow-up pull request and the repo-owned deployment workflow. No data rollback is required.

## Audit Evidence

The focused test output, lint result, and pull request diff provide candidate evidence. Deployment and signed-in proof remain pending.

## Known Gaps

No live signed-in mobile or desktop browser proof has been captured for this candidate.
