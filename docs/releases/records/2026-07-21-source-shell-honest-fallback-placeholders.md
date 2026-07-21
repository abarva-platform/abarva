# 2026-07-21-source-shell-honest-fallback-placeholders — SOURCE-SHELL-007: honest no-preview fallbacks

## Release ID

`2026-07-21-source-shell-honest-fallback-placeholders`

## Status

`candidate`

## Plain-English Summary

This completes the Source shell sample-stage fallback fix identified after live proof of
`SOURCE-SHELL-005`. `SOURCE-SHELL-006` wired the two existing but unused fixtures for Responses
and Evaluation. This follow-up removes the remaining silent Scope fallback for stages that do
not have sample fixtures yet: Pricing, Executive Decision, and Transition.

When one of those stages has no live fact-backed `stageView`, the canvas now renders a
stage-specific, honest placeholder that says no illustrative preview has been built yet. It does
not invent fake fixture content, and it does not show Scope work under another stage's label.

## Layer Impact

- `global-control-lane`: Source event canvas rendering only. No schema, API route, data-plane,
  auth, tenant, worker, environment, or traffic changes.

## Client Applicability

- All clients: yes. The fix applies to Source event detail pages for any tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - Makes Scope an explicit fallback branch instead of relying on the default.
  - Normalizes legacy stage aliases before resolving fallback content.
  - Adds a stage-specific honest placeholder for Pricing, Executive Decision, and Transition.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx`:
  - New regression test iterates the real `SOURCE_STAGE_ORDER` and renders
    `SourceAnalyticsCanvas` with `stageView={undefined}` for all 11 canonical stages.
  - Verifies fixture-backed stages show their own stage markers and the no-fixture stages show
    the honest placeholder, not Scope's `Provide the volumetrics` step.
- `docs/backlog/source-product-backlog.md`:
  - Records `SOURCE-SHELL-007` and updates `SOURCE-SHELL-006` with its merged PR.

## QA / Validation

- `pass` — `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx`.
- `pass` — `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx --runInBand` — 11/11 passing. Jest prints the repo's known duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`.
- `pass` — `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx --runInBand` — 4/4 passing with the same known duplicate manual mock warnings.
- `blocked by unrelated baseline failures` — `npx jest src/components/source/canvas/analytics/__tests__ --runInBand` — 63/65 passing. The two failures are the known baseline failures named in the handoff: `StrategyStage.test.tsx` cannot find `intel-panel`, and `SourceAnalyticsCanvas.thread.test.tsx` cannot find the old `Ask Ava` composer label.
- `blocked by unrelated baseline type errors` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` reaches TypeScript and then fails on existing Home graph dependencies/types: missing `@xyflow/react`, missing `@dagrejs/dagre`, and implicit `any` parameters in `HomeKnowledgeDesignContractSurface.tsx`. No errors reference the Source files touched here.
- `pass` — `npm run release:check` — Release Control Gate and Deploy Authority Gate passed.

## Rollout Plan

Merge to `main` via PR. The repo-owned ACA main deploy workflow builds and deploys the next
production image for `app.abarva.ai`. No migration, feature flag, worker job, or manual runtime
mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Reverting restores the prior fallback selector behavior; no data rollback
is needed.

## Audit Evidence

- PR: [#5242](https://github.com/abarva-platform/abarva/pull/5242).
- Focused regression and lint output: see QA / Validation.
- Signed-in live proof: to be added after deploy.

## Known Gaps

- Full signed-in live proof is pending deploy.
- Real sample fixtures for Pricing, Executive Decision, and Transition are intentionally not built
  in this bug-fix slice. The placeholder is honest and prevents cross-stage mislabeling; fixture
  design remains future product work.
