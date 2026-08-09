# 2026-08-09-source-explore-purpose-copy — Source Explorer Purpose Copy

## Release ID

`2026-08-09-source-explore-purpose-copy`

## Status

`candidate`

## Plain-English Summary

The Source workspace Explore page now shows its purpose statement below the heading instead of hiding it. This makes the page explain that the explorer is for reconciling contract line items, evidence state, renewal, leverage, and source-system provenance before opening Contract 360.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: Source workspace presentation copy only. No data, loader, schema, model, metric, workflow, tenant routing, or persistence behavior changes.

## Client Applicability

- All clients: Source workspace users receive the clearer Explore page purpose statement.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx` renders the existing Explore `vm.thesis` text instead of suppressing it.
- No migrations, adapters, loaders, calculations, API routes, or workflow code changed.

## QA / Validation

- Pass: focused lint on `WorkspaceClient.tsx` plus the Source workspace executive-story and Explore test files.
- Pass: focused Source workspace Jest tests for executive-story and Explore behavior.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.
- Pending: signed-in Source browser proof after deployment.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the next shared web image. No manual migration or data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the main deploy workflow.
- ACA runtime invariant: Required by the main deploy workflow.
- Worker image invariant: Required by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source workspace Explore page.

## Rollback Plan

Revert this UI-only change and redeploy through the same repo-owned workflow. No database rollback is required.

## Audit Evidence

- Pull request for this release.
- Focused lint/test output.
- `npm run release:check` output.
- ACA deploy workflow run.
- Signed-in Source workspace screenshot or proof JSON showing the Explore purpose statement.

## Known Gaps

This change only makes the existing Explore purpose visible. It does not redesign the explorer, add new evidence, alter contract economics, or change optimization workflow behavior.
