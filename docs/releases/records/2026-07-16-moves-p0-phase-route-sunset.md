# 2026-07-16-moves-p0-phase-route-sunset — Retire Embedded P0 Originate Form

## Release ID

`2026-07-16-moves-p0-phase-route-sunset`

## Status

`candidate`

## Plain-English Summary

The Moves P0 phase route still contained an embedded legacy Originate form after the new seven-question Start a Move workflow handed off to `/phase/0?focus=gate`. This release removes that embedded form from the phase workspace, honors the gate-focus route parameter, and makes P0 phase routes show the governed review/gate shell instead of restarting the old origination UI.

## Layer Impact

- `global-control-lane`: Updates shared Moves UI routing and phase workspace behavior for all tenants using Strategic Moves.
- Runtime UI only: No schema, migration, ingestion, candidate-data, or tenant-data contract changes.

## Client Applicability

- All clients: Yes, for Strategic Moves users.
- Specific clients: Meridian Health is the live reproduction tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`
  - Reads `focus=gate` and passes the initial P0 gate substep into the phase workspace.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Removes the embedded legacy `OriginateConsole` form and retired styles.
  - Replaces non-gate P0 substeps with a handoff panel pointing to P0 gate review.
  - Keeps P0 approval from overwriting the already-captured seven-question record with old local draft defaults.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Verifies P0 no longer renders the retired form and `focus=gate` opens gate approval.
- `src/components/strategic-moves/__tests__/moves-detail-route-sunset.test.ts`
  - Adds a source-level regression guard against remounting the retired P0 form.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/moves-detail-route-sunset.test.ts --runInBand`
- Pending: `npx eslint` on changed files.
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pending: `npm run release:check`
- Pending: `git diff --check`
- Pending: signed-in browser proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After deploy, verify the offending Meridian P0 phase URL no longer renders the retired form and that `?focus=gate` opens gate approval.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior digest-pinned ACA image. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- ACA revision: Pending.
- Live proof bundle: Pending.

## Known Gaps

None known for the embedded P0 phase-route form retirement. The dedicated Start a Move seven-question workflow remains in scope and is not removed.
