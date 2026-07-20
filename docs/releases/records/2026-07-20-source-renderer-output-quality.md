# 2026-07-20-source-renderer-output-quality — Source Renderer Output Quality

## Release ID

`2026-07-20-source-renderer-output-quality`

## Status

`candidate`

## Plain-English Summary

Source Files now separates artifact lifecycle quality from rendered document quality. The matrix can score actual artifact body text with the deterministic Source documentation QA gates when body text is available, and it honestly reports `Content not scored` when the live registry only has artifact metadata.

## Layer Impact

- `global-control-lane` / Product UI: adds content-QA status, counts, and findings to the Source Files artifact lifecycle matrix for every tenant using the redesigned Source shell.
- `global-control-lane` / Source governance logic: extends the lifecycle summary to carry deterministic rendered-content QA results without changing schema or artifact storage.
- `global-control-lane` / Export evidence: adds content-QA status, score, and findings to the artifact standards CSV.

## Client Applicability

- All clients: yes, for the redesigned Source shell Files workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`
- `src/lib/source/source-event-shell-v2.ts`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- Focused tests for lifecycle content QA and Files matrix rendering.

## QA / Validation

- Pass: focused Jest coverage for lifecycle matrix and SourceAnalyticsCanvas Files rendering (`npm test -- --runInBand src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`) — 19/19 passed. Jest reported existing duplicate manual mock warnings for markdown mocks.
- Pass: ESLint on touched Source files (`npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`).
- Pass: TypeScript check (`npx tsc --noEmit`).
- Pass: `npm run release:check`.
- Not-run yet: signed-in proof after merge/deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image for `app.abarva.ai`. No migration, data build, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files workspace should show content-QA summary and honest not-scored wording when registry rows do not include body text.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database rollback is needed.

## Audit Evidence

- PR: pending.
- ACA deploy run: pending.
- Signed-in screenshot: pending.

## Known Gaps

This slice does not add live body-text fetching to the event shell registry query. Rows without threaded artifact body text are intentionally reported as `Content not scored` rather than passed.
