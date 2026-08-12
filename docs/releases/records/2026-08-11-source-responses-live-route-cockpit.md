# 2026-08-11-source-responses-live-route-cockpit — Source Responses Live Route Cockpit

## Release ID

`2026-08-11-source-responses-live-route-cockpit`

## Status

`candidate`

## Plain-English Summary

Wires the richer Responses-stage cockpit into the signed-in Source event detail route. The live event canvas now shows the same response package readiness, proposal intelligence, negotiation leverage, executive decision posture, and Continue-to-Evaluation gate that were already added to the Responses workflow components.

## Layer Impact

- Release lane: `global-control-lane` for shared Source product UX behavior.
- Product layer: Updates the Source event detail route and analytics canvas so the Responses stage exposes the package cockpit in the normal signed-in workflow path.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Applies to Source events that render through the shared signed-in event detail canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/page.tsx` builds the Responses-stage readiness and proposal intelligence projections for the live event route.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` passes those projections into the active Responses stage canvas and renders the Responses cockpit on the steps workspace.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx` covers the live analytics-route cockpit surface.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx --runInBand --silent`
- PASS: `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.vendorResponseCoverage.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- PASS: `git diff --check`
- Pending: release checker, PR checks, ACA deploy workflow, runtime invariant, and signed-in live route proof after merge.

## Rollout Plan

Merge through the normal PR path. Runtime activation requires the repo-owned Azure Container Apps main deploy workflow after merge. No migration, data load, feature flag, environment change, or manual operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Pending main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required after deploy before claiming live-proven.

## Rollback Plan

Revert the PR to remove the live-route Responses cockpit wiring and its focused test, then allow the repo-owned ACA main deploy workflow to redeploy main. No schema rollback, tenant-data rollback, or data-plane rollback is required.

## Audit Evidence

- Local validation commands listed above.
- PR review and CI evidence after publication.
- ACA main deploy workflow evidence after merge.
- Signed-in browser proof for the live Responses stage after deploy.

## Known Gaps

This release wires the Responses cockpit into the live event route. It does not implement long-form proposal parsing, vendor-isolated citation extraction, automated scoring math, or fully automated negotiation optimization.
