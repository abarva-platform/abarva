# 2026-08-15-source-canvas-width-utilization - Source Canvas Width Utilization

## Release ID

`2026-08-15-source-canvas-width-utilization`

## Status

`candidate`

## Plain-English Summary

This release fixes a shared Source New Event layout defect where the active
workflow card and its right-side task panels stopped short of the available
canvas width, leaving a large unused margin on wider screens. The fix lets the
active stage workflow, readiness panel, evidence table, guide panel, and upload
area use the available work pane while keeping the left journey rail and local
step branch stable.

This is a UI/layout and smoke-proof slice only. It does not change workflow
persistence, schema, tenant data, parser ingestion, approval automation,
authentication, membership, vendor messaging, vendor dispatch, or data-plane
writes.

## Layer Impact

- Layer 4 Products: updates the shared Source event canvas presentation and
  Source stage shell smoke proof.
- Layers 1-3: no client intake, adapter, canonical model, schema, loader, or
  data-plane changes.

## Client Applicability

- All clients: yes, for the shared Source New Event canvas after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none introduced.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
  - Removes fixed max-width caps from the shared active workflow card and
    right-side workflow panels.
  - Adds stable test IDs for the focused workflow card and active workflow
    pane so layout smoke can measure the right container.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx`
  - Asserts the focused workflow panel is width-aware and not capped.
  - Asserts the stage-ready panel uses the available right-side workflow pane.
- `scripts/qa/source-stage-shell-layout-harness.ts`
  - Adds canvas-width utilization measurement and fails below 92% utilization.
  - Reports utilization in the generated summary.
- `docs/backlog/tracks/04-source-commercial/SOURCE_NEW_EVENT_SRC48_OPERATING_DESIGN.md`
  - Adds the same canvas-width utilization requirement to the Stage Smoke
    Checklist.

## QA / Validation

- Pass: `npm run qa:source-new-event-journey-smoke`
  - Result: 1 suite passed, 15 tests passed.
  - Note: Jest printed existing duplicate manual mock warnings for
    markdown/GFM mocks.
- Pass: `npm run qa:source-stage-shell-layout`
  - Result: harness passed across all 11 stages and 1440/1100/900/768
    viewports.
  - Width utilization result: 100% canvas utilization in the generated summary.
- Pass: `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx scripts/qa/source-stage-shell-layout-harness.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Open a PR and merge through the protected `main` branch. The repo-owned Azure
Container Apps main deploy workflow builds and deploys the resulting image.
After deployment, run the ACA runtime invariant and signed-in browser/DOM proof
for Strategy, Scope, and RFP before claiming the change is live.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR; do not use ad-hoc ACA traffic
  mutation.
- Approved image digest: pending main deploy.
- ACA runtime invariant: pending main deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Strategy, Scope, and RFP canvas width
  utilization on a signed-in Source event after deployment.

## Rollback Plan

Revert the PR. No schema, persistence, data-plane, parser, auth, membership,
vendor dispatch, or approval automation rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy: pending.
- Runtime invariant: pending.
- Signed-in Strategy/Scope/RFP browser screenshots and DOM width proof: pending.
- Local focused proof: Source New Event journey smoke passed; Source stage shell
  layout harness passed with 100% canvas utilization across all stages and
  tested widths.

## Known Gaps

- This release fixes shared canvas width utilization. It does not add new
  stage content, evidence requirements, parser behavior, approval persistence,
  or vendor-response analytics.
