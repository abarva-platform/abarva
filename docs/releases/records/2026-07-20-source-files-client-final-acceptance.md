# 2026-07-20-source-files-client-final-acceptance — Source Files Client-Final Acceptance

## Release ID

`2026-07-20-source-files-client-final-acceptance`

## Status

`candidate`

## Plain-English Summary

The redesigned Source Files workspace now exposes the existing governed
client-final acceptance flow directly from AI-draft lifecycle rows. Generated
documents remain marked as AI-prepared drafts until a reviewed client-final file
is uploaded and accepted back into Source as the authoritative artifact of
record.

## Layer Impact

- `global-control-lane`: Adds a Source shell Files workspace action for
  accepting reviewed client-final artifacts.
- `client-data-lane`: No schema or migration. The action reuses the existing
  `client-final` API and artifact registry/file-cabinet lineage contract.

## Client Applicability

- All clients: Yes, for Source events using the redesigned Source Files
  workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: renders
  `AcceptClientFinalButton` for lifecycle rows that are AI drafts, and refreshes
  the shell after acceptance.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`:
  covers Files matrix visibility and client-final route submission.

## QA / Validation

- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- NOT RUN YET: signed-in Source Files proof after merge/deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for a healthy revision with 100% traffic, then run signed-in
Source Files workspace proof. The proof should show the Accept Client Final
action on at least one AI-draft lifecycle row.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment per shared runbook.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Files workspace.

## Rollback Plan

Revert this PR and redeploy the prior healthy main revision through the ACA main
deploy workflow. No migration rollback is required.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5114`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This slice wires the existing acceptance flow into the new Files workspace. It
does not change the backend client-final persistence contract or add a bulk
approval workflow.
