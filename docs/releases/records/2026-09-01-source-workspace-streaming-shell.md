# 2026-09-01-source-workspace-streaming-shell — Source Workspace Streaming Shell

## Release ID

`2026-09-01-source-workspace-streaming-shell`

## Status

`candidate`

## Plain-English Summary

The Source workspace route now shows a lightweight product shell while the governed portfolio read finishes. The underlying data source and calculations are unchanged; the update improves perceived page readiness for heavy portfolio views.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 Products: changes only the Source workspace route composition and loading state. It does not alter canonical data, loaders, adapters, tenant records, or read-model contents.

## Client Applicability

- All clients: applies to users who can open the Source workspace route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Route composition for `/source/workspace`.
- A Source 360 loading shell shown while the existing portfolio promise resolves.

## QA / Validation

- PASS: `npx eslint 'src/app/(maestro)/source/workspace/page.tsx'`
- PASS: `git diff --check`
- PENDING: `npm run release:check -- --changed-only` after this release-record correction.

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy workflow updates worker jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for `/source/workspace`.

## Rollback Plan

Revert the route composition change and redeploy through the same Azure Container Apps main workflow.

## Audit Evidence

Inspect the pull request, CI checks, ACA deploy run, runtime invariant output, and signed-in Source workspace proof.

## Known Gaps

This improves route loading behavior but does not change the underlying portfolio query cost. If backend response time remains high, follow-up work should split or cache the heavy Source workspace read model.
