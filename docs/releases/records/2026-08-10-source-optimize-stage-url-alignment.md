# Source Optimize Stage URL Alignment

## Release ID

`2026-08-10-source-optimize-stage-url-alignment`

## Status

`candidate`

## Plain-English Summary

Source optimization approval links now use the same journey-aware stage routing
as the event canvas. When an existing optimization event still carries a legacy
stage key that is not shown in the optimization journey, the user lands on the
visible optimization checkpoint instead of seeing a mismatched URL.

## Layer Impact

`global-control-lane`: Source product routing only. The change affects how
Source event approval links are constructed and does not alter tenant data,
schemas, migrations, metrics, calculations, or generated artifacts.

## Client Applicability

- All clients: Applies to tenants using Source contract-optimization events.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

Competitive sourcing journeys continue to use the full sourcing-stage rail.

## Changes Included

- Added a Source journey helper that returns the canonical event-stage URL for a
  given motion and raw stage key.
- Updated the Source event approval route to use that helper for active-event
  redirects and the current-stage link.
- Added focused tests proving optimization events coerce skipped legacy stage
  keys to the visible optimization stage while competitive sourcing events keep
  their original stage URL.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/__tests__/sourcing-motion-journeys.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/sourcing-motion-journeys.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts 'src/app/(maestro)/source/events/[eventId]/approval/page.tsx'`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- NOT RUN YET: `npm run release:check` after this release record update.
- NOT RUN YET: Live signed-in browser proof after merge and ACA deployment.

## Rollout Plan

Open a pull request, squash-merge through the protected repository lane, allow
the repo-owned Azure Container Apps main deploy workflow to build and deploy the
new image, then verify the live signed-in Source optimization route.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No ad-hoc shared-runtime mutation.
- Approved image digest: Produced by the repo-owned ACA main deploy workflow.
- ACA runtime invariant: Must be verified by the deploy workflow before live
  proof is claimed.
- Worker image invariant: Must remain aligned with the deploy workflow checks.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the pull request. No database migration, tenant data mutation, or
artifact regeneration is involved.

## Audit Evidence

Before release, inspect the pull request diff and local validation output listed
above. After deployment, inspect the ACA deploy workflow run and signed-in
browser proof showing an optimization approval link landing on the visible
optimization checkpoint rather than an unmapped sourcing-stage URL.

## Known Gaps

This release does not redesign the full Optimize Contract workflow and does not
rewrite existing persisted event stage keys. It only guarantees the Source UI
uses the canonical journey-aware URL when linking to or redirecting active
optimization events.
