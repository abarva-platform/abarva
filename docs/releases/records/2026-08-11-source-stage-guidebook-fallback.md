# 2026-08-11-source-stage-guidebook-fallback — Source Stage Guidebook Fallback

## Release ID

`2026-08-11-source-stage-guidebook-fallback`

## Status

`candidate`

## Plain-English Summary

Source event stages now keep the Guidebook workspace visible even when no authored tenant or global guidebook exists for the viewed stage. Instead of hiding guidance, the page shows a default stage playbook derived from the current stage model: next input, source owner, available templates, and gate condition.

## Layer Impact

- `global-control-lane`: Updates the shared Source New Event workflow UI. No schema, parser, tenant data, calculation, approval, or runtime configuration changes are included.

## Client Applicability

- All clients: Source event canvas users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source event canvas routing only; this release does not add a new flag.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx --runInBand`
- PASS: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check` after updating this record to the required release-control template.
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a Source New Event stage where no authored guidebook exists.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migration rollback is required.

## Audit Evidence

- Pull request URL after publication.
- GitHub checks and deploy workflow run.
- ACA revision/digest and signed-in browser proof after deployment.

## Known Gaps

This release does not author new stage-specific guidebook content or implement template/parser coverage. It only prevents the guidebook workspace from disappearing when authored content is missing.
