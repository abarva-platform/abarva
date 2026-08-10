# Source Optimize Lifecycle Stage Normalization

## Release ID

`2026-08-10-source-optimize-lifecycle-stage-normalization`

## Status

`candidate`

## Plain-English Summary

The Source lifecycle guard now understands the sourcing journey before it
redirects an active approval URL back to the event canvas. Contract-optimization
events that still carry an old sourcing-stage key, such as `rfp`, now land on
the visible optimization checkpoint instead of exposing a stale URL.

## Layer Impact

`global-control-lane`: Source product routing only. This change affects route
normalization for active Source events and does not change schemas, tenant
records, calculations, evidence, or generated artifacts.

## Client Applicability

- All clients: Applies to Source contract-optimization events.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

Competitive sourcing events continue to use the full sourcing journey and keep
RFP-stage URLs when RFP is the current stage.

## Changes Included

- The lifecycle routing guard now receives persisted Source event motion
  metadata and uses the shared Source journey URL helper for active approval
  redirects.
- Regression tests cover both the optimization stale-stage case and the
  competitive sourcing RFP case.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/__tests__/lifecycle-routing-guard.test.ts --runInBand`
- PASS: `npx jest --runTestsByPath src/lib/source/__tests__/sourcing-motion-journeys.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/lifecycle-routing-guard.ts src/lib/source/__tests__/lifecycle-routing-guard.test.ts`
- PASS: `npx tsc --noEmit --pretty false`
- PENDING: `npm run release:check`
- PENDING: PR checks, ACA deployment, and signed-in browser proof.

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

Inspect the pull request diff, focused test output, release-check output, ACA
deploy workflow run, and signed-in browser proof that the active optimization
approval URL lands on the visible optimization checkpoint URL.

## Known Gaps

This release does not rewrite persisted event rows. It normalizes navigation at
runtime so existing optimization cases and newly opened cases use the
journey-appropriate stage URL.
