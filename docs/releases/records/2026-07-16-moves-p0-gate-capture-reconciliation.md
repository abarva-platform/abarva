# 2026-07-16-moves-p0-gate-capture-reconciliation — P0 Gate Capture Reconciliation

## Release ID

`2026-07-16-moves-p0-gate-capture-reconciliation`

## Status

`candidate`

## Plain-English Summary

The new Moves P0 Originate workflow saved the seven Start a Move answers into the Move charter/scaffold, but the P0 gate approval endpoint checked a separate durable phase-capture contract. Existing Moves could therefore show saved answers in the origination flow while gate approval still returned `P0 capture is incomplete`. This release reconciles those contracts: new P0 submissions write the durable phase-capture rows, existing P0 Moves can repair those rows from the saved charter during gate review, and the gate page now shows the saved seven answers separately from governance gate criteria.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves P0 origination and gate-approval behavior for all tenants.
- Runtime data writes: Adds intended `program_modules` writes for P0 phase-capture rows derived from the already-saved Move charter/scaffold.
- No data-layer/candidate impact: Does not promote candidate data, read candidate preview context, update Active Tenant Access, or change Home/module context behavior.

## Client Applicability

- All clients: Yes, for Strategic Moves P0 Originate and gate approval.
- Specific clients: Meridian Health is the live reproduction tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/p0-phase-capture.ts`
  - Maps the saved seven-answer Originate charter/scaffold into the durable P0 phase-capture contract, including the backend-only recommendation row required by gate approval.
- `src/lib/programs/origination-submit.ts`
  - Persists P0 phase-capture rows at Move creation/promotion time for new Moves.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
  - Repairs missing P0 phase-capture rows from the saved Move charter before returning `capture_incomplete`.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds a P0 gate-review panel showing the seven saved Originate answers and clarifies that gate criteria are a separate governance checklist.
- Tests:
  - Adds mapping coverage for Originate charter to P0 phase capture.
  - Adds route coverage for existing Moves that need repair from saved charter.
  - Adds UI coverage that the seven saved answers are visible on P0 gate approval.
  - Adds source-contract coverage that origination persists the P0 phase-capture rows.

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/p0-phase-capture.test.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/p0-phase-capture.ts src/lib/programs/__tests__/p0-phase-capture.test.ts src/lib/programs/origination-submit.ts 'src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts' src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in browser proof after ACA deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After deploy, verify the Meridian P0 gate URL repairs capture from the saved charter, displays the seven-answer review panel, and advances to P1 when the user approves.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior digest-pinned ACA image. No schema rollback is required. Existing `program_modules` rows created by the repair path are additive completed phase-capture records based on saved Move charter content and can remain safely.

## Audit Evidence

- PR URL: Pending.
- ACA revision: Pending.
- Live proof bundle: Pending.

## Known Gaps

None known for P0 charter-to-phase-capture reconciliation. This release does not change P1-P5 gate criteria, data-layer extraction, candidate promotion, or Tower outcome claims.
