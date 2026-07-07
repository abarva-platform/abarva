# 2026-06-09-moves-phase-workspace-p0-actor — Moves P0 Workspace And Phase Advance Actor Guard

## Release ID

`2026-06-09-moves-phase-workspace-p0-actor`

## Status

`candidate`

## Plain-English Summary

This fixes the live SkyHarbor cold-start path where an approved P0 Move sent the user to `/phase/0`, but the phase workspace rejected phase 0 and showed a 404. The phase workspace now accepts P0 through P5, and the P0 workspace has Nexus opening guidance and canvas sections. The phase-advance API also resolves Clerk-only operator sessions to a tenant-scoped `persons` UUID before writing approval/audit fields, returning a clear setup error instead of a database UUID crash when the person row is missing.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves route and phase-advance behavior changes for all tenants.
- `internal-admin`: Operator/test personas now receive a clear setup error when their Clerk login is not backed by a tenant-scoped `persons` row for phase-gate writes.

## Client Applicability

- All clients: yes, the P0 phase workspace and phase-advance actor guard are shared.
- Specific clients: SkyHarbor is the live incident that exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `/strategic-moves/[moveId]/phase/[phaseNum]` now accepts canonical phase numbers `0..5`.
- `StrategicMovePhaseClient` includes P0 Originate guidance and canvas sections.
- `/api/v1/programs/[programId]/advance` resolves a UUID-backed phase-gate actor before requesting approval or advancing a phase.
- New helper `resolvePhaseGateActorPersonId` checks the current tenant-scoped `persons` row for Clerk-only sessions.
- Tests cover phase parsing, actor resolution, and the phase-advance setup-error path.

## QA / Validation

- `npx jest src/lib/programs/__tests__/strategic-move-route-params.test.ts src/lib/programs/__tests__/phase-gate-actor.test.ts --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts' --runInBand` passed.
- `npx eslint 'src/app/api/v1/programs/[programId]/advance/route.ts' 'src/app/api/v1/programs/[programId]/advance/__tests__/route.test.ts' src/lib/programs/phase-gate-actor.ts src/lib/programs/strategic-move-route-params.ts 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx' src/components/strategic-moves/StrategicMovePhaseClient.tsx src/lib/programs/__tests__/strategic-move-route-params.test.ts src/lib/programs/__tests__/phase-gate-actor.test.ts` passed.
- `npx tsc --noEmit --pretty false --incremental false` passed.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the merged commit, deploy it to `ca-abarva-web-lab-eastus`, shift traffic after the new revision is running, and browser-verify the SkyHarbor P0 phase route.

## Rollback Plan

Revert the PR and redeploy the previous Azure Container Apps image. No database migration is included in this release.

## Audit Evidence

- PR and CI checks after opening this candidate.
- Post-deploy browser proof for `/strategic-moves/<SkyHarbor move id>/phase/0`.
- API proof that phase advance returns `operator_person_required` instead of a raw UUID database error when a Clerk-only persona lacks a tenant-scoped person row.

## Known Gaps

This does not provision missing `persons` rows for operator plus-address personas. The product now reports that setup gap cleanly; a targeted provisioning run is still needed for any login expected to approve or self-approve phase gates.
