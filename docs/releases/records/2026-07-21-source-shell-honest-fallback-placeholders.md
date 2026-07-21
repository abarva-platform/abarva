# 2026-07-21-source-shell-honest-fallback-placeholders — SOURCE-SHELL-007: honest no-preview fallbacks

## Release ID

`2026-07-21-source-shell-honest-fallback-placeholders`

## Status

`live-proven`

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
- `pass` — GitHub PR checks for [#5242](https://github.com/abarva-platform/abarva/pull/5242), including ESLint, Typecheck + reasoning-layer tests, Chrome Firefox Safari mobile smoke, Production readiness gate, Release record and impact note, and the governance gates.
- `pass` — ACA main deploy run [29874391399](https://github.com/abarva-platform/abarva/actions/runs/29874391399) deployed main commit `0c65c742`, which contains this release's merge commit `6438a0c3`.
- `pass` — independent ACA runtime invariant check at `2026-07-21T22:45:19.769Z`: template image and 100% traffic revision image both `acrabarvalab001.azurecr.io/abarva/web@sha256:e322d727559e596e309d24745a77ab3161a7b4911a6250e6d068afd77824e02c`; active revision `ca-abarva-web-lab-eastus--m0c65c742`; traffic 100%; `/api/health` returned `ok=true`.
- `pass` — signed-in production browser proof with `.auth/agent-meridian.json` against `https://app.abarva.ai/source/events/cea10d0a-6d5d-49d2-8522-173c2d6fd520?stage=responses`: page stayed signed in, rendered `Confirm vendor response coverage`, and did not render Scope's `Provide the volumetrics`.
- `pass` — signed-in production browser proof with `.auth/agent-meridian.json` against `https://app.abarva.ai/source/events/cea10d0a-6d5d-49d2-8522-173c2d6fd520?stage=pricing`: page stayed signed in, rendered `No illustrative preview has been built for Pricing yet`, rendered `No required steps are defined for this stage yet`, and did not render Scope's `Provide the volumetrics`.

## Rollout Plan

Merged to `main` via PR [#5242](https://github.com/abarva-platform/abarva/pull/5242). The
repo-owned ACA main deploy workflow deployed a later main commit that contains this release. No
migration, feature flag, worker job, or manual runtime mutation was required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: `sha256:e322d727559e596e309d24745a77ab3161a7b4911a6250e6d068afd77824e02c`.
- ACA runtime invariant: passed for `ca-abarva-web-lab-eastus--m0c65c742` at 100% traffic.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: completed.

## Rollback Plan

Revert the merge commit. Reverting restores the prior fallback selector behavior; no data rollback
is needed.

## Audit Evidence

- PR: [#5242](https://github.com/abarva-platform/abarva/pull/5242).
- Focused regression and lint output: see QA / Validation.
- Deploy run: [29874391399](https://github.com/abarva-platform/abarva/actions/runs/29874391399).
- Runtime proof bundle: `/tmp/source-shell-fallback-aca-proof/runtime-invariant-proof.json`.
- Signed-in live proof screenshots: `/tmp/source-shell-fallback-responses.png` and
  `/tmp/source-shell-fallback-pricing.png`.

## Known Gaps

- Real sample fixtures for Pricing, Executive Decision, and Transition are intentionally not built
  in this bug-fix slice. The placeholder is honest and prevents cross-stage mislabeling; fixture
  design remains future product work.
