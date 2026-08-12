# 2026-08-12-source-stage-artifact-context-manifest — Source Stage Artifact Context Manifest

## Release ID

`2026-08-12-source-stage-artifact-context-manifest`

## Status

`candidate`

## Plain-English Summary

The simplified Source stage screen now shows a compact artifact context manifest before the user opens the approval gate. It separates evidence that will support the stage deliverable, required evidence that will be carried as a visible gap, and optional evidence that is not used yet. This makes generated deliverables easier to trust because the user can see the evidence posture before approval writes the artifact.

## Layer Impact

- Lane: `global-control-lane`.
- Product layer: Updates the shared Source New Event stage UI.
- Canonical model: No schema or tenant-data change.
- Source adapters: No parser or adapter change.
- AI generation path: No prompt, model, token, or egress change. The existing server-side generation receipt continues to record model, prompt version, token usage, quality checks, and upstream evidence codes after generation.

## Client Applicability

- All clients: Applies to Source New Event stage screens using the simplified front.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source simplified-stage routing only; this change adds no new flag.

## Changes Included

- `src/components/source/canvas/SimpleStageFront.tsx`
- `src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`
- `src/__tests__/integration/source/source-simple-front.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/source/canvas/__tests__/SimpleStageFront.test.tsx src/__tests__/integration/source/source-simple-front.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/SimpleStageFront.tsx src/components/source/canvas/__tests__/SimpleStageFront.test.tsx src/__tests__/integration/source/source-simple-front.test.tsx`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the approved runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before claiming the manifest is browser-visible in production.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request URL after publication.
- Focused component and integration test output.
- GitHub checks and deploy workflow run after merge.
- ACA revision/digest readback after deployment.

## Known Gaps

This release makes the artifact evidence posture visible before approval. It does not add new parsers, alter generation prompts, score artifact quality, complete rich proposal parsing, or certify the full 11-stage journey.
