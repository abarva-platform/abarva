# 2026-08-12-source-commercial-active-canvas — Source Commercial Active Canvas

## Release ID

`2026-08-12-source-commercial-active-canvas`

## Status

`candidate`

## Plain-English Summary

The Source commercial stages now show a compact active-canvas lens strip above the existing gated workflow. It makes Summary, Pricing, BAFO, Risks, Readiness, Missions, Signals, and Linked Program visible in one place while preserving the single active task area below.

## Layer Impact

- Product surface: Source event canvas only, for commercial stages.
- Canonical/data layer: No schema, migration, persistence, loader, adapter, upload, parser, or live data-plane change.
- Evidence governance: The strip reports readiness from the existing stage checklist and artifact gate state; it does not create facts or override approvals.

## Client Applicability

- All clients: Yes, for Source New Event commercial workflow UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `src/components/source/canvas/analytics/CommercialActiveCanvasStrip.tsx`.
- Wired the commercial active-canvas strip into `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`.
- Added focused regression coverage in `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`.
- Marked `SRC42` complete in `docs/backlog/tracks/04-source-commercial/BACKLOG.md`.

## QA / Validation

- PASS: Focused Jest for the analytics canvas commercial strip: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx --runInBand`.
- PASS: ESLint for affected files: `npx eslint src/components/source/canvas/analytics/CommercialActiveCanvasStrip.tsx src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageApproval.test.tsx`.
- PASS: TypeScript check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- PASS: Release check: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: Whitespace diff check: `git diff --check`.
- NOT RUN YET: GitHub PR checks.
- NOT RUN YET: Signed-in live Source commercial-stage proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA to the shared lab/product web runtime. After deploy, verify the ACA runtime invariant and perform signed-in browser proof on a Source commercial stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Only the main deploy workflow.
- Approved image digest: Pending deploy workflow.
- ACA runtime invariant: Pending deploy workflow evidence.
- Worker image invariant: Pending deploy workflow evidence.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source commercial-stage route.

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to deploy the reverted `main` image. No database rollback is required because there are no schema, persistence, or data-plane changes.

## Audit Evidence

To be filled after PR, CI, deploy, and live proof:

- PR URL:
- Merge commit:
- ACA deploy run:
- Runtime digest:
- Live screenshot:

## Known Gaps

This does not implement new commercial scoring, final award automation, persistence, upload parsing, workflow-engine changes, or linked-program data writes. It only simplifies navigation across existing commercial workflow surfaces.
