# 2026-07-21-source-shell-stage-view-coherence — SOURCE-SHELL-006: viewed stage label/body coherence

## Release ID

`2026-07-21-source-shell-stage-view-coherence`

## Status

`candidate`

## Plain-English Summary

This fixes a Source shell navigation bug found during live proof for `SOURCE-SHELL-005`.
Opening a live event that was currently at Scope with `?stage=responses` showed the correct
Responses header/rail, but the Steps workspace rendered Scope's fallback body. That made the
page internally inconsistent: the label said one stage, while the work items belonged to
another.

The fix keeps the viewed-stage fallback coherent. If live fact-backed stage data is not
available and the user is viewing Responses or Evaluation, the Source analytics canvas now
uses the existing Responses or Evaluation scaffold instead of falling back to Scope.

## Layer Impact

- `global-control-lane`: Source event canvas rendering only. No schema, API, data-plane, auth,
  tenant, worker, or environment changes.

## Client Applicability

- All clients: yes. The fix applies to Source event detail pages for any tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`:
  - Imports the existing `SAMPLE_RESPONSES_STAGE` and `SAMPLE_EVALUATION_STAGE` view models.
  - Maps `viewStage="responses"` and `viewStage="evaluation"` to their own sample/fallback
    stage views when no live `stageView` is supplied.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx`:
  - Adds a regression where the event's current stage is Scope but the viewed stage is
    Responses. The test verifies the Responses step title appears and the Scope-only
    "Provide the volumetrics" step does not.
- `docs/backlog/source-product-backlog.md`:
  - Adds `SOURCE-SHELL-006`.

## QA / Validation

- `pass` — `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx`.
- `pass` — `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx --runInBand` — 4/4 passing. Jest prints the repo's known duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`.
- `blocked by unrelated baseline assertion` — `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand` — 40/41 passing. The lone failure expects the legacy text `Generated Draft`, while current output renders `AI-prepared draft`; the failure is outside this change and the rendered output was in the document-card test path, not the Source Shell V2 fallback mapping touched here.
- `blocked by unrelated baseline type errors` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` reaches TypeScript and then fails on existing Home graph dependencies/types: missing `@xyflow/react`, missing `@dagrejs/dagre`, and implicit `any` parameters in `HomeKnowledgeDesignContractSurface.tsx`. No errors reference the Source files touched here.
- `pass` — `npm run release:check` — Release Control Gate and Deploy Authority Gate passed. The command refreshed the legacy-purge report artifacts under `reports/data-standard/legacy-purge/`.

## Rollout Plan

Merge to `main` via PR. The repo-owned ACA main deploy workflow builds and deploys the next
production image for `app.abarva.ai`. No migration, flag, worker job, or manual runtime mutation
is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Reverting restores the prior fallback behavior; no data rollback is
needed.

## Audit Evidence

- PR: [#5239](https://github.com/abarva-platform/abarva/pull/5239).
- Focused regression and lint output: see QA / Validation.
- Signed-in live proof: to be added after deploy.

## Known Gaps

- Full signed-in live proof is pending deploy.
- The broader SSR suite has one unrelated baseline assertion mismatch (`Generated Draft` vs
  `AI-prepared draft`) that should be handled separately.
