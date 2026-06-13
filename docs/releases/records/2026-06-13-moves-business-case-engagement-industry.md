# 2026-06-13-moves-business-case-engagement-industry — Moves business-case function identity fix

## Release ID

`2026-06-13-moves-business-case-engagement-industry`

## Status

`candidate`

## Plain-English Summary

The Moves board-grade business-case loader now uses the Move's own recorded `engagements.industry_code` when resolving a Domain Function Pack. It still uses the client row for tenant labels, but no longer depends on `clients.industry_code` for the Move's function identity. This fixes SkyHarbor IROPS business-case generation rendering an honest "unbound" fallback even after the Move itself was bound to the airline IROPS Function Pack.

## Layer Impact

- `global-control-lane`: Shared Moves board-artifact generation behavior now reads the correct Move-level industry identity before rendering deterministic board-grade artifacts.
- `client-data-lane`: No schema change. The fix consumes existing `engagements.industry_code` and `engagements.baseline_metrics` from the client-scoped data plane.

## Client Applicability

- All clients: Applies to any Move whose function identity is recorded on the engagement row.
- Specific clients: Unblocks the SkyHarbor lab IROPS synthetic Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Existing `moves_orchestrated_deliverables` behavior is unchanged.

## Changes Included

- `src/lib/programs/board-artifacts/load-move-business-case-input.ts`
- `src/lib/programs/board-artifacts/load-move-business-case-input.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/board-artifacts/load-move-business-case-input.test.ts src/lib/programs/expert-kernel/domain/__tests__/airline-irops-recovery.test.ts src/lib/programs/expert-kernel/__tests__/move-business-case.test.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-business-case.test.ts --runInBand` passed: 4 suites, 69 tests.

## Rollout Plan

Merge to `main`, build a new ACA lab image, deploy it to `ca-abarva-web-lab-eastus`, and rerun the SkyHarbor Moves Workspace generation proof.

## Rollback Plan

Revert this release commit or redeploy the previous ACA image. No data rollback is required because there is no schema or data mutation in this change.

## Audit Evidence

- PR link to be added when opened.
- Live retest evidence will be captured in the existing 2026-06-13 E2E audit folder after deployment.

## Known Gaps

This fixes deterministic function-pack binding for generated board artifacts. It does not by itself add governed evidence rows or force the orchestrated LLM path when the orchestrator blocks or has insufficient evidence.
