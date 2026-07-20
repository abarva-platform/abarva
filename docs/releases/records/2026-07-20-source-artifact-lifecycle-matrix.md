# 2026-07-20-source-artifact-lifecycle-matrix — Source Artifact Lifecycle Matrix

## Release ID

`2026-07-20-source-artifact-lifecycle-matrix`

## Status

`candidate`

## Plain-English Summary

Source now exposes a single lifecycle matrix for event artifacts in the v2 Files
workspace. The matrix shows the canonical artifacts expected across every Source
phase, whether each artifact is required or gate-defining, whether generation is
prompt-backed, which export formats are routed, and whether the current event has
only uploaded evidence, an AI-prepared draft, or a client-approved final.

## Layer Impact

- `global-control-lane`: Updates shared Source shell behavior for every client
  using the Source analytics event shell.
- `client-data-lane`: No schema or data changes. The view reads existing event
  artifacts and canonical Source specs only.

## Client Applicability

- All clients: Yes, for Source event Files workspace rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: adds the deterministic artifact
  lifecycle matrix.
- `src/lib/source/source-event-shell-v2.ts`: threads lifecycle summary into the
  Source shell view model.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: renders
  the all-phase lifecycle matrix in Files.
- Focused tests cover lifecycle semantics and visible rendering.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- NOT RUN YET: production signed-in browser proof. Required after merge and ACA
  deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for a healthy revision with 100% traffic, then run signed-in
Source Files workspace proof on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment per shared runbook.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Files workspace.

## Rollback Plan

Revert the PR and redeploy the prior healthy main revision through the ACA main
deploy workflow. No migration rollback is required.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5106`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This release makes lifecycle status visible and deterministic. It does not add
new document-generation prompts, alter artifact export bytes, or redesign the
client-final upload UX.
