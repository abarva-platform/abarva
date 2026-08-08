# 2026-08-08-source-workspace-declutter-performance — Source Workspace Declutter And Performance Read

## Release ID

`2026-08-08-source-workspace-declutter-performance`

## Status

`candidate`

## Plain-English Summary

This release removes visible implementation clutter from the Source workspace and tightens the Contract 360 Performance tab. The top workspace strip no longer exposes provider names, tenant keys, projection counts, or table names as primary page copy. The Performance tab now leads with a concise sourcing read and compact facts rather than diagnostic labels.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Source workspace presentation only. No intake template, adapter, canonical model, loader, migration, or tenant data changes are included.

## Client Applicability

- All clients: yes, for tenants using the Source workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace routing only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`

## QA / Validation

- `npx eslint src/app/\(maestro\)/source/preview/workspace --max-warnings=0` passed.
- `npm test -- --runTestsByPath src/app/\(maestro\)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` is required locally because the default local Node heap can OOM on this workspace.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated web image. No database migration or operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: produced by the repo-owned deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: Source workspace top strip and Contract 360 Performance tab

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow.

## Audit Evidence

Inspect the PR diff, local validation output, deploy workflow run, and signed-in Source workspace screenshots after deployment.

## Known Gaps

This does not change the underlying evidence depth or contract performance facts. It only removes unwanted labels and makes the current Performance read cleaner.
