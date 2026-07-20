# 2026-07-20-source-artifact-audit-detail-matrix — Source Artifact Audit Detail Matrix

## Release ID

`2026-07-20-source-artifact-audit-detail-matrix`

## Status

`candidate`

## Plain-English Summary

The redesigned Source Files lifecycle matrix now surfaces the document-standard
details needed for artifact audit: evidence-only count, audience/client-facing
status, required exhibit count, page-depth guidance, missing-input policy,
evidence policy, source-register policy, prompt model, token budget, export
formats, AI-draft state, and client-final approval state.

## Layer Impact

- `global-control-lane`: Expands Source Files matrix metadata for all Source
  event artifacts.
- `client-data-lane`: No schema or data changes. The UI reads deterministic
  profile metadata already present in the Source documentation-standard
  registry.

## Client Applicability

- All clients: Yes, for Source events using the redesigned Source Files
  workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: binds lifecycle rows to the
  Source artifact profile registry and exposes audience, required exhibits,
  page/depth guidance, missing-input policy, evidence mode, and source-register
  policy.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: renders
  the expanded audit metadata and the evidence-only summary tile.
- Focused tests cover the richer matrix fields and summary.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- NOT RUN YET: signed-in Source Files proof after merge/deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for a healthy revision with 100% traffic, then run signed-in
Source Files workspace proof and capture the expanded artifact matrix.

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

- PR URL: `https://github.com/abarva-platform/abarva/pull/5115`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This slice surfaces deterministic profile metadata. It does not generate new
artifacts, change prompt bodies, or add a downloadable spreadsheet export of the
matrix.
