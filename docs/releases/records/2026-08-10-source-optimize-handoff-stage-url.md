# Source Optimize Handoff Stage URL

## Release ID

`2026-08-10-source-optimize-handoff-stage-url`

## Status

`candidate`

## Plain-English Summary

The Source Optimize handoff now preserves the optimization journey when an
existing optimization case is opened. If the stored event has a legacy sourcing
stage that is not shown in the optimization flow, Source redirects to the
visible commercial-baseline checkpoint instead of leaving a mismatched stage in
the URL.

## Layer Impact

`global-control-lane`: Source product routing only. This touches the optimization
handoff API and approval-page route resolution; it does not change schemas,
tenant records, calculations, or artifacts.

## Client Applicability

- All clients: Applies to tenants using Source contract-optimization events.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

Competitive sourcing journeys are unchanged.

## Changes Included

- The optimization API now returns a journey-aware event URL.
- The Source approval page now reads persisted `sourcing_motion` and passes it
  into the journey resolver.
- Focused tests cover the case where an optimization event carries a skipped
  legacy stage key.

## QA / Validation

- PASS: `npx jest --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts' --runInBand`
- PASS: `npx jest --runTestsByPath src/lib/source/__tests__/sourcing-motion-journeys.test.ts --runInBand`
- PASS: `npx eslint 'src/app/(maestro)/source/events/[eventId]/approval/page.tsx' 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts' 'src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/route.test.ts'`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `npm run release:check`
- NOT RUN YET: Live signed-in browser proof after merge and ACA deployment.

## Rollout Plan

Open a pull request, squash-merge through the protected repository lane, allow
the repo-owned Azure Container Apps main deploy workflow to build and deploy the
new image, then verify the live signed-in Source Optimize handoff.

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

Before release, inspect the pull request diff and validation output listed
above. After deployment, inspect the ACA deploy workflow run and signed-in
browser proof showing the Source Optimize case handoff lands on the visible
optimization checkpoint.

## Known Gaps

This release does not redesign the full Optimize Contract workflow and does not
rewrite existing persisted event stage keys. It keeps UI navigation aligned with
the journey-aware stage model.
