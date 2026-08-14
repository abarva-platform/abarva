# 2026-08-14-source-files-uploaded-ready-status — Source Files Uploaded Status

## Release ID

`2026-08-14-source-files-uploaded-ready-status`

## Status

`candidate`

## Plain-English Summary

The Source event Files checklist now separates "file uploaded" from "evidence ready." A row can show a green uploaded confirmation when a file is present or parsed, while the final Done check stays open until the evidence is cited, accepted, and meets the stage-readiness rules.

## Layer Impact

Layer 4 PRODUCTS: Source presentation only. The Files workspace renders clearer status labels from existing evidence lifecycle and file state.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, evidence-state mutation, or data-plane mutation changed.

## Client Applicability

- All clients: yes, for the live Source event detail Files workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx`

## QA / Validation

- `npx prettier --write src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx` — passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx` — passed.
- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx --runInBand` — passed, with pre-existing duplicate manual mock warnings.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, open a live Source event Files workspace and confirm uploaded rows show a green file-uploaded confirmation while non-ready rows still show Open.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is UI/read-model presentation only, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, CI output, focused Jest output, deploy workflow run, ACA runtime invariant proof, and live signed-in Source Files workspace proof.

## Known Gaps

This does not add requirement-specific parser routing or change the evidence lifecycle. It only clarifies visible status so users know a file landed without confusing upload with approval-ready evidence.
