# 2026-06-05-source-redesign-spec-13-transition — Source Transition Readiness

## Release ID

`2026-06-05-source-redesign-spec-13-transition`

## Status

`candidate`

## Plain-English Summary

Source Stage 10 now renders a real transition readiness workspace instead of falling back to the generic document tab. The stage shows the KT milestone plan, go-live readiness scorecard, cutover signers, APX-CDP-2026 / Q3 2026 freeze dependency, and transition risk register. The Source Deal Pack also includes a Stage 10 Transition section so exported packs do not skip the post-award handoff.

## Layer Impact

- `global-control-lane`: updates shared Source UI and export rendering for all Source events.
- `client-data-lane`: uses existing tenant/event/artifact substrate and deterministic event-bound transition evidence; no schema migration.

## Client Applicability

- All clients: yes, for Source events that expose Stage 10.
- Specific clients: Apex Retail Group gains the AMS transition dependency content used by the golden-event walkthrough.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `TransitionStageView`, `KtPlanTracker`, `TransitionReadinessScorecard`, and `RiskRegister`.
- Adds `buildSourceTransitionReadinessModel` for Stage 10 readiness structure.
- Wires Stage 10 into `UniversalCanvasShell`.
- Adds a Stage 10 Transition section to the Source Deal Pack renderer.
- Adds focused tests for canvas rendering and deal-pack inclusion.

## QA / Validation

- PASS: `npm test -- --runInBand src/__tests__/integration/source/source-event-canvas-render.test.tsx src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts` (67/67 tests passed).
- PASS: `npx tsc --noEmit --skipLibCheck --pretty false`.
- PASS: focused `npx eslint` over changed Source transition, canvas, deal-pack, and test files.
- PASS: `git diff --check`.
- NOT-RUN: post-deploy crawl; will run after merge and production deploy.

## Rollout Plan

Merge to `main`, deploy the Vercel production app, then run the post-deploy crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert the merge commit or disable the Stage 10 specialized branch in `UniversalCanvasShell`; the generic document workspace will continue to render without schema changes.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Production deployment: pending.
- Post-deploy crawl: pending.

## Known Gaps

- OpenAI-only generation is still not complete; legacy Claude-named generation routes remain out of scope for this slice.
- Full all-artifact browser E2E upload/download proof remains a separate hardening slice.
- Stage 11 Value extension and board-pack generation are covered by later specs.
