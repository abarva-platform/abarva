# 2026-07-20-source-artifact-lifecycle-code-match — Source Artifact Lifecycle Code Matching

## Release ID

`2026-07-20-source-artifact-lifecycle-code-match`

## Status

`candidate`

## Plain-English Summary

The Source artifact lifecycle matrix now reconciles live event artifacts by
`artifactCode` as well as the older `artifactType` shape. Signed-in proof of the
previous lifecycle matrix release showed the matrix itself was live, but the
generated-draft count could stay at zero when the runtime artifact payload used
`artifactCode`.

## Layer Impact

- `global-control-lane`: Corrects shared Source shell view-model binding for
  all Source event Files workspaces.
- `client-data-lane`: No schema or data changes. This only reads an already
  available runtime field.

## Client Applicability

- All clients: Yes, for Source event artifact lifecycle rendering.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-event-shell-v2.ts`: accepts and prioritizes
  `artifactCode` when binding file items and lifecycle matrix rows.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`:
  updates the lifecycle fixture to mirror production-shaped artifact payloads.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- NOT RUN YET: production signed-in browser proof after merge and deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for a healthy revision with 100% traffic, then rerun signed-in
Source Files workspace proof and confirm the lifecycle matrix counts generated
drafts from live event data.

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

- PR URL: `https://github.com/abarva-platform/abarva/pull/5110`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This corrective slice does not add new generation prompts, export routes, or
client-final upload UX. It only fixes lifecycle matching against live runtime
artifact payload shape.
