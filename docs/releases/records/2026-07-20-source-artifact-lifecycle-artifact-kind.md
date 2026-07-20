# 2026-07-20-source-artifact-lifecycle-artifact-kind — Source Artifact Lifecycle Registry Kind Matching

## Release ID

`2026-07-20-source-artifact-lifecycle-artifact-kind`

## Status

`candidate`

## Plain-English Summary

The Source artifact lifecycle matrix now reconciles live registry artifacts by
`artifactKind`, the field returned by `listSourceArtifactsForSourceEventId`.
Signed-in production proof after #5110 showed the matrix and governance text were
live, but generated drafts still counted as zero because the live artifact rows
did not expose the canonical deliverable code through `artifactCode` or
`artifactType`.

## Layer Impact

- `global-control-lane`: Corrects shared Source Files workspace lifecycle
  rendering for all Source events.
- `client-data-lane`: No schema, seed, or data mutation. This reads an existing
  registry field already delivered to the route.

## Client Applicability

- All clients: Yes, for Source event artifact lifecycle rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`: accepts `artifactKind` and uses it
  when binding file items.
- `src/lib/source/artifact-lifecycle-matrix.ts`: matches lifecycle rows by
  `artifactCode`, `artifactKind`, or legacy `artifactType`.
- Focused tests now include production registry-shaped `artifactKind` rows.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/source-event-shell-v2.ts src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- NOT RUN YET: signed-in Source Files proof confirming `AI
  DRAFTS` is greater than zero for the live event.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for healthy revision and 100% traffic, then run signed-in Source
Files workspace proof and capture a screenshot.

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

- PR URL: `https://github.com/abarva-platform/abarva/pull/5112`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This corrective slice only fixes lifecycle reconciliation against the registry
row shape. It does not add new artifact generation prompts, export routes, or
client-final acceptance UX.
