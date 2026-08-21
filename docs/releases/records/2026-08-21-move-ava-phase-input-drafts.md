# 2026-08-21-move-ava-phase-input-drafts — Move aVa Phase Input Drafts

## Release ID

`2026-08-21-move-ava-phase-input-drafts`

## Status

`candidate`

## Plain-English Summary

Adds a governed, structured drafting path for Strategic Moves phase inputs. The aVa panel can request cited field-level proposals from approved upstream phase state, show the basis for each proposal, and let the user place a proposal into local form state. The draft does not persist until the user explicitly saves it through the existing phase-capture endpoint and revision fence.

## Layer Impact

- Layer 4 Products: Updates the Moves phase workspace and adds a read-only proposal endpoint.
- No Layer 1 tenant input, Layer 2 adapter output, Layer 3 canonical data, registry state, graph state, retrieval index, or data-plane schema changes.

## Client Applicability

- All clients: Strategic Moves phase workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-input-draft/route.ts`
- `src/lib/programs/phase-input-draft-proposals.ts`
- `src/lib/programs/__tests__/phase-input-draft-proposals.test.ts`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- PASS — Focused Jest for the Move phase workspace and proposal builder.
- PASS — TypeScript and targeted ESLint before PR.
- PASS — `npm run release:check`.

## Rollout Plan

Merge through the repository PR path. The repo-owned Azure Container Apps main deploy workflow will build and deploy the image for `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge to main.
- Shared runtime mutators: None outside the repo-owned deploy.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Moves phase workspace draft request, local apply, explicit save, and reload/readback when a signed-in browser is available.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No migration, tenant-data rollback, registry rollback, or retrieval rollback is required.

## Audit Evidence

- PR URL: to be added by the PR.
- Focused tests: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/phase-input-draft-proposals.test.ts --runInBand`.
- Deployment evidence: ACA deploy run and runtime-invariant proof after merge.

## Known Gaps

- The first proposal builder is deterministic and source-bound. It is not a general model drafting engine.
- The existing free-form aVa chat remains separate from structured phase-input proposals.
- Signed-in live proof requires an authenticated session; the endpoint itself is read-only and cannot advance gates.
