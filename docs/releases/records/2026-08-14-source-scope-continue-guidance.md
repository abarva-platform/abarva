# 2026-08-14-source-scope-continue-guidance — Source Continue Guidance

## Release ID

`2026-08-14-source-scope-continue-guidance`

## Status

`candidate`

## Plain-English Summary

The Source active-step canvas now explains why Continue is locked or where Continue will take the user when it is ready. This makes the Scope workflow easier to follow without adding another panel or changing the underlying stage state.

## Layer Impact

Layer 4 PRODUCTS: Source presentation only. The active stage canvas renders a concise Continue hint from existing step requirement metadata.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, approval automation, evidence-state mutation, or data-plane mutation changed.

## Client Applicability

- All clients: yes, for the live Source event detail active-step workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx`

## QA / Validation

- `npx prettier --write src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — passed.
- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx --runInBand` — passed, with pre-existing duplicate manual mock warnings.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, open a live Source event Steps workspace and confirm the Continue button shows locked or ready guidance.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is UI presentation only, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, CI output, focused Jest output, deploy workflow run, ACA runtime invariant proof, and live signed-in Source Steps workspace proof.

## Known Gaps

This does not change stage completion logic or approval routing. It only explains the existing Continue gate more clearly.
