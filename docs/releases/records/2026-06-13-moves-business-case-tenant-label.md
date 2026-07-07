# 2026-06-13-moves-business-case-tenant-label — Moves board pack tenant label fallback

## Release ID

`2026-06-13-moves-business-case-tenant-label`

## Status

`candidate`

## Plain-English Summary

Moves board-grade business-case artifacts now use the authenticated tenant key as a safe fallback for the deck display label when the client lookup by UUID does not return a client row. This prevents generated demo artifacts from rendering with a generic `Tenant` title when the Move is already tenancy-scoped and the active tenant is known.

## Layer Impact

- `global-control-lane`: adjusts the shared Moves board-artifact input loader used by the board-grade business-case route.
- `public-demo`: improves buyer-facing generated artifact copy for demo and lab walkthroughs.

## Client Applicability

- All clients: applies wherever a Move board-grade business-case deck is generated from a tenancy-scoped Move.
- Specific clients: verified against the SkyHarbor lab Move path.
- Internal only: no.
- Public/demo only: no, but the visible defect was found in the public demo/lab walkthrough.
- Feature flag: follows the existing Moves board-artifact route and feature flags; no new flag.

## Changes Included

- `src/lib/programs/board-artifacts/load-move-business-case-input.ts`
- `src/lib/programs/board-artifacts/load-move-business-case-input.test.ts`

## QA / Validation

- pass: `npm test -- --runTestsByPath src/lib/programs/board-artifacts/load-move-business-case-input.test.ts --runInBand`
- pass: `npx eslint src/lib/programs/board-artifacts/load-move-business-case-input.ts src/lib/programs/board-artifacts/load-move-business-case-input.test.ts`
- pass: `git diff --check`
- pass: `npm run audit:architecture-rules`
- not-run: lab ACA retest is pending merge/deploy because this release is still a candidate branch.

## Rollout Plan

Merge to `main`, build a new Azure Container Apps lab image, deploy to `ca-abarva-web-lab-eastus`, and rerun the SkyHarbor Moves artifact generation proof.

## Rollback Plan

Revert this commit or roll ACA lab traffic back to the previous healthy revision. No database migration or destructive data change is included.

## Audit Evidence

- PR and CI evidence to be attached after publication.
- Lab artifact row verification should show the generated deck title contains `SkyHarbor Air` instead of the generic `Tenant` fallback.

## Known Gaps

This release does not change the current absence of governed evidence lineage on the generated business-case artifact; it only fixes the display-label fallback for a tenancy-scoped Move.
