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
- Added compatibility mapping from the new P0 `known_evidence` capture section
  to the legacy `engagements.charter.evidence_family` key so the existing phase
  UI and the new generation guard read the same completed capture state.

## QA / Validation

- Passed local validation:
  - `npx jest src/lib/programs/__tests__/phase-capture-contract.test.ts src/__tests__/integration/programs/phase-capture-gate-routes.test.ts --runInBand`
  - scoped ESLint on changed route/test files
  - `npm run release:check`
- Passed production image build:
  - ACR build `cayb`
  - production Next compile and TypeScript succeeded inside the image build
- Passed live signed-in proof on Lakeshore:
  - P0 capture before: incomplete
  - Gate approval before capture: blocked
  - Generation before capture/gate: `409 generation_gate_blocked`
  - P0 capture after save: complete
  - Gate approval: `200`, P0 advanced to P1
  - Generation after approval: `200`, HTML artifact created
  - Golden bar: pass, two inline SVGs, no `[DATA GAP]`, not prose-only
  - Review/regenerate: `200`, regenerated review-required artifact created
  - Wrong-tenant SkyHarbor API attempts: `404`, no Lakeshore data surfaced
- Full local `tsc --noEmit` in the side worktree was blocked before image build
  by unrelated missing optional package declarations/modules (`js-yaml`,
  `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`). The
  production ACR image build subsequently passed TypeScript with the complete
  production dependency graph.

## Rollout Plan

Merge to main and deploy through the approved Azure Container Apps main lane. No migration is required. The route becomes active when the web image is deployed.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: None outside the app routes.
- Approved image digest: To be recorded after ACA build.
- Deployed image digest:
  `sha256:110d35562159cfadb6930ded80b1adfe97b94ada33db1c38a653c3f54f159abf`
- ACA revision: `ca-abarva-web-lab-eastus--m12ce9276`
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
- UI affordance may still be minimal; this release ensures the API path is
  supported and the legacy P0 phase tracker receives the same capture keys.
