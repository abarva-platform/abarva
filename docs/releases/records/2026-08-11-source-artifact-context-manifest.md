# 2026-08-11-source-artifact-context-manifest — Source Artifact Context Manifest

## Release ID

`2026-08-11-source-artifact-context-manifest`

## Status

`candidate`

## Plain-English Summary

Source artifact cards now show a compact context manifest beside the human acceptance action. The manifest explains the artifact's source of record, how Source stores and parses it, how the agent may use it, the current capability gap, the approval owner, and supported upload formats. This makes artifact acceptance easier to audit without changing the evidence, parser, or approval semantics.

## Layer Impact

- `global-control-lane`: Updates the shared Source event file/artifact UI. It exposes existing artifact-operation metadata already defined in code; no new calculation or data transformation is introduced.
- `client-data-lane`: No schema, migration, tenant data, parser, canonical model, or upload behavior change.

## Client Applicability

- All clients: Source New Event users reviewing files and deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pending before release: `npm run release:check`, `git diff --check`, PR checks, repo-owned ACA deploy workflow, ACA runtime invariant readback, and live health readback.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Must be verified after deployment.
- Worker image invariant: Must be verified after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming full Source New Event QA pass; not claimed by this release.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- Pull request URL: to be added after PR creation.
- Focused component test confirms the context manifest renders source-of-record, parser/storage, agent-use, next-gap, owner, and supported-format details.
- Deployment evidence: to be added after merge/deploy.

## Known Gaps

This release does not certify generated artifact quality, parse every uploaded file, create a prompt context manifest in the database, or prove full 11-stage Source New Event QA. It exposes the existing operation contract at the acceptance point so reviewers can see the evidence-use contract before accepting an artifact.
