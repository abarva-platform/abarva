# 2026-08-11-source-artifact-quality-gate — Source Artifact Quality Gate

## Release ID

`2026-08-11-source-artifact-quality-gate`

## Status

`candidate`

## Plain-English Summary

Source artifact cards now show a compact quality/readiness gate before the
human acceptance action. The gate makes parser state, client-final acceptance,
search indexing, graph projection, operation wiring, and compliance review
visible at the point where a user decides whether an artifact can be trusted for
workflow use.

This is a visibility and workflow-safety improvement. It does not certify any
artifact as high quality by itself, and it does not change the underlying data,
parser, or approval semantics.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source event workspace artifact cards render the readiness facts
  already present in the Source shell view model.
- Canonical model: No schema or canonical model changes.
- Source adapters: No adapter or parser changes.

## Client Applicability

- All clients: Yes, wherever the Source event workspace artifact cards are used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx`

## QA / Validation

Local validation status:

- PASS — `npx jest src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx --runInBand`
- PASS — `npx eslint src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/ArtifactAcceptancePanel.test.tsx`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS — `npm run release:check`
- PASS — `git diff --check`

This record intentionally does not claim full Source journey QA, artifact
content certification, browser acceptance of all stages, or aVa answer quality.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main
deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after the main deploy workflow completes.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before calling the surface
  live-proven.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to redeploy the previous
Source artifact card behavior.

## Audit Evidence

- PR URL to be added after creation.
- GitHub Actions checks on the PR.
- Main deploy workflow run after merge.
- ACA revision/image digest proof after deploy.

## Known Gaps

- This release surfaces readiness facts; it does not parse richer documents,
  generate new quality scores, or certify artifact content.
- Full New Event 11-stage QA and Optimize Contract QA remain separate proof
  obligations.
