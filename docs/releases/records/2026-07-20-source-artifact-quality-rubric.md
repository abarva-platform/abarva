# 2026-07-20-source-artifact-quality-rubric — Source Artifact Quality Rubric

## Release ID

`2026-07-20-source-artifact-quality-rubric`

## Status

`released`

## Plain-English Summary

The Source Files workspace now gives every canonical Source artifact a
deterministic quality-readiness signal. The rubric separates missing required
artifacts, AI-prepared drafts, upload-only evidence, and accepted client finals
instead of treating all files as equally ready. It also keeps the boundary
honest: this score covers lifecycle and approval hard gates only; prose,
visuals, exhibits, and citation quality still require renderer-output scoring.

## Layer Impact

- `global-control-lane`: Adds deterministic artifact quality scoring to the
  redesigned Source Files workspace and artifact standards export.
- `client-data-lane`: No schema, migration, query, or write-path change. The
  rubric is computed from existing artifact registry/lifecycle fields.

## Client Applicability

- All clients: Yes, for Source events using the redesigned Source Files
  workspace.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: adds the quality rubric model,
  per-artifact quality assessments, summary counts, and quality columns in the
  standards CSV export.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: surfaces
  quality score, hard-fail count, missing required artifacts, review-required
  artifacts, and per-row quality findings in the Files matrix.
- Focused tests cover required missing artifacts, AI draft review holds,
  upload-only evidence, accepted client finals, CSV columns, and UI rendering.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- PASS: PR checks for `https://github.com/abarva-platform/abarva/pull/5119`.
- PASS: ACA main deploy run `29724687575` completed successfully for merge SHA
  `2e4199fbf5bbb5db4a326940c8dca2e76199d6c1`.
- PASS: Signed-in Source Files proof confirmed `Quality score`, `Hard fails`,
  `Missing required`, `Review-required`, the honest rubric scope note,
  AI-draft review holds, required/gate-defining missing-artifact findings, and
  the standards CSV export command.

## Rollout Plan

Merged to `main` through PR `#5119`, deployed through the repo-owned Azure
Container Apps main deploy workflow, verified the ACA runtime invariant, and
ran signed-in Source Files proof that the rubric is visible and does not
overstate artifact-readiness.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by ACA run `29724687575`; see deployment
  evidence bundle uploaded by the workflow.
- ACA runtime invariant: Passed in ACA run `29724687575`.
- Worker image invariant: Passed in ACA run `29724687575`.
- Feature/env flag update path: None.
- Live signed-in proof required: Complete, Source Files workspace.

## Rollback Plan

Revert the PR and redeploy the prior healthy main revision through the ACA main
deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5119`.
- Local validation: Focused Jest, ESLint, TypeScript, and `release:check`
  passed before PR.
- PR checks: `https://github.com/abarva-platform/abarva/pull/5119`.
- Merge SHA: `2e4199fbf5bbb5db4a326940c8dca2e76199d6c1`.
- ACA deployment run:
  `https://github.com/abarva-platform/abarva/actions/runs/29724687575`.
- Signed-in screenshot:
  `/Users/anand/Downloads/source-5119-live-artifact-quality-rubric.png`.

## Known Gaps

This release scores artifact lifecycle and approval hard gates. It does not yet
parse generated artifact contents for required sections, visuals, citations,
page-level quality, banned terms, or expert narrative depth.
