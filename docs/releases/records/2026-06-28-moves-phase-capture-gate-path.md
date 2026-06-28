# 2026-06-28-moves-phase-capture-gate-path — Moves Phase Capture And Gate Approval Path

## Release ID

`2026-06-28-moves-phase-capture-gate-path`

## Status

`candidate`

## Plain-English Summary

Adds a supported signed-in path for Strategic Moves users to complete phase capture and approve a phase gate before artifact generation. This keeps the existing rigor: evidence upload alone does not unlock final artifacts; the user must complete the phase capture sections and approve the gate through a tenant-scoped route that writes the same durable state the generation guard already reads.

## Layer Impact

- `global-control-lane`: Adds shared Moves API routes and a reusable capture-section contract for all tenants.
- `client-data-lane`: Writes tenant-scoped `program_modules`, `engagements.charter`, `phase_snapshots`, deliverable/signoff records, and audit records only for the signed-in Move being operated on.

## Client Applicability

- All clients: The routes are universal and tenant-scoped.
- Specific clients: First live proof target is the Lakeshore CIO demo Move.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `src/lib/programs/phase-capture-contract.ts`.
- Added `GET/POST /api/v1/programs/[programId]/phase-capture`.
- Added `GET/POST /api/v1/programs/[programId]/phase-gate-approval`.
- Added unit coverage for the phase capture contract.

## QA / Validation

- Pending local validation before deployment:
  - `npx jest src/lib/programs/__tests__/phase-capture-contract.test.ts --runInBand`
  - scoped ESLint on new files
  - `npx tsc --noEmit`
  - `npm run release:check`
- Required live proof after deployment:
  - Signed-in Lakeshore capture before/after.
  - Signed-in gate approval before/after.
  - Generation guard response before/after.
  - At least one artifact generated only after approval.
  - Wrong-tenant negative proof remains blocked.

## Rollout Plan

Merge to main and deploy through the approved Azure Container Apps main lane. No migration is required. The route becomes active when the web image is deployed.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: None outside the app routes.
- Approved image digest: To be recorded after ACA build.
- ACA runtime invariant: `app.abarva.ai` must serve the deployed git SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the commit and redeploy the prior ACA image. No destructive data rollback is required; any capture, approval, snapshot, deliverable, and audit records written through the route are normal tenant-scoped Move history and should remain unless explicitly removed by an operator-approved cleanup plan.

## Audit Evidence

- PR / commit for this release.
- Local test output.
- ACA deployment revision and image digest.
- Live signed-in Lakeshore proof bundle.
- Cross-tenant negative proof.

## Known Gaps

- Preliminary draft lane is intentionally not included in this first pass.
- UI affordance may still be minimal; the API path is the supported signed-in path for this release.
