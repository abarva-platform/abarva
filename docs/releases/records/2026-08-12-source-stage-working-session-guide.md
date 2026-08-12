# 2026-08-12-source-stage-working-session-guide — Source Stage Working Session Guide

## Release ID

`2026-08-12-source-stage-working-session-guide`

## Status

`candidate`

## Plain-English Summary

Adds a compact working-session guide to the Source stage front door. Before a user uploads evidence or opens the approval gate, the page now explains who should join the session, which source systems to pull from, what file formats and fields matter, and what the completed evidence unlocks.

## Layer Impact

- Release lane: `global-control-lane`.
- `PRODUCTS`: Updates the Source workflow UI so stage evidence requests are easier to understand and act on.
- `CANONICAL MODEL`: No change. The guide reads the existing stage evidence requirements already projected into the Source screen.
- `SOURCE ADAPTERS`: No change.
- `CLIENT INTAKE`: No change.

## Client Applicability

- All clients: Yes, wherever the compact Source stage front door is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route and stage-front availability controls apply.

## Changes Included

- `src/components/source/canvas/SimpleStageFront.tsx`
- `src/components/source/canvas/__tests__/SimpleStageFront.test.tsx`
- `src/__tests__/integration/source/source-simple-front.test.tsx`

## QA / Validation

- `npx jest src/components/source/canvas/__tests__/SimpleStageFront.test.tsx src/__tests__/integration/source/source-simple-front.test.tsx --runInBand`
  - Passed: 13 tests.
  - Note: Jest emitted pre-existing duplicate manual-mock warnings for markdown mocks; the focused suites still passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the product image. No data migration, backfill, or feature-flag mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded after the ACA deploy completes.
- ACA runtime invariant: To be verified after deploy.
- Worker image invariant: To be verified after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible proof.

## Rollback Plan

Revert the PR or roll back to the prior ACA image digest. No database rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/check run: To be added after PR validation.
- ACA deploy run: To be added after merge.
- Runtime proof: To be added after deploy.

## Known Gaps

- Browser-visible proof is not yet captured for this candidate.
