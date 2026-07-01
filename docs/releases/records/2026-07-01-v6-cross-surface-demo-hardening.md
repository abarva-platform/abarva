# 2026-07-01-v6-cross-surface-demo-hardening — V6 Demo Surface Hardening

## Release ID

`2026-07-01-v6-cross-surface-demo-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens the demo V6 answer path across Intelligence, Tower, Source, and Moves. Airline Demo gets a richer SkyHarbor board-readiness answer grounded in named V6 systems, programs, AI initiatives, risks, and evidence gaps. Source and Moves can now synthesize tenant-specific V6 packs for Airline Demo and Industrial Demo instead of falling back to Apex fixtures or returning an empty non-Apex response. Tower program tables prefer loaded V6 business names and use an honest "Program name not loaded" fallback when a business name is missing.

## Layer Impact

- `global-control-lane`: Updates shared synthesis and answer-contract behavior for Source, Moves, Tower, and Intelligence routes/components used by all demo tenants.
- `client-data-lane`: Reads existing V6 demo CSV templates for Airline Demo and Industrial Demo; no database migration or data mutation is included.
- `public-demo`: Improves soft-launch demo readiness for the signed-in demo product surfaces.

## Client Applicability

- All clients: Tower visible program-label hygiene applies wherever the Tower answer path receives program facts.
- Specific clients: Airline Demo and Industrial Demo receive generated V6 Source and Moves tenant packs. Airline Demo receives richer SkyHarbor CTO/IROPS board-gap context.
- Internal only: None.
- Public/demo only: The V6 tenant-pack adapter reads synthetic demo packs.
- Feature flag: None.

## Changes Included

- Added `src/lib/module-v6/demo-tenant-packs.ts` to assemble Source and Moves demo instances from V6 CSV template rows.
- Updated `src/app/api/source/synthesis/route.ts` to use tenant-specific V6 Source packs for non-Apex demo tenants while preserving tenant fencing.
- Updated `src/app/api/programs/synthesis/route.ts` to use tenant-specific V6 Moves packs for non-Apex demo tenants while preserving tenant fencing.
- Updated `src/lib/intelligence/skyharbor-cto-readiness.ts` and ask-source wiring for SkyHarbor board-gap questions.
- Updated `src/lib/cio-tower/answer.ts` to prefer V6 business metadata names and avoid invented "Loaded program" labels.
- Added focused tests for Source, Moves, Intelligence, and Tower behavior.

## QA / Validation

- `npx jest src/app/api/source/synthesis/__tests__/route.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/intelligence/__tests__/skyharbor-cto-readiness.test.ts src/lib/intelligence/ask/__tests__/skyharbor-cto-readiness-source.test.ts --runInBand`
  - Result: Passed, 5 suites / 36 tests.
  - Note: Jest reports pre-existing duplicate manual mock warnings for markdown-related mocks.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps release path, then run signed-in production proof for Airline Demo and Industrial Demo across Intelligence, Tower, Source, and Moves.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deployment.
- Shared runtime mutators: None in this release.
- Approved image digest: To be captured after ACA image build.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. Run the planned 50-question cross-surface proof before calling this production-proven.

## Rollback Plan

Revert the merge commit and redeploy the previous known-good ACA image through the approved workflow. No data migration rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local focused Jest output: 5 suites / 36 tests passed.
- ACA deployment evidence: Pending.
- Signed-in 50-question proof: Pending.

## Known Gaps

This is locally validated only until merged, deployed through ACA, and browser/API-proven against the signed-in production runtime.
