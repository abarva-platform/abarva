# 2026-08-20-stage-readiness-workbook-ui-link — Stage Readiness Workbook Link

## Release ID

`2026-08-20-stage-readiness-workbook-ui-link`

## Status

`candidate`

## Plain-English Summary

Strategic Moves phase workspaces now expose the deterministic Stage Readiness Workbook download from the phase header. The link points at the signed-in read-only workbook route and lets operators download the next-phase workbook without changing phase state, uploading evidence, or approving a gate.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves UI link to an existing read-only workbook route. No tenant data, canonical data, migrations, upload parsing, retrieval, phase-gate automation, or runtime configuration changes.

## Client Applicability

- All clients: Strategic Moves users can download a stage-readiness workbook from active phase workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this increment.

## Changes Included

- Adds a `Download P{next} readiness workbook` link to the phase workspace header for P0 through P4.
- Leaves terminal P5 without the link because there is no next-phase workbook transition.
- Adds component coverage proving the P1 workspace links to `/api/v1/programs/{programId}/stage-readiness-workbook?phase=1`.

## QA / Validation

- `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — PASS (1 suite, 65 tests; existing async React `act(...)` warnings only).
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — PASS.
- `npm run release:check` — PASS.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. The link calls an existing read-only route and does not change data or gate state.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Phase workspace shows the link and the workbook route returns XLSX.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, ACA deploy run, signed-in phase workspace link proof, and signed-in workbook route smoke.

## Known Gaps

This increment does not add upload parsing, structured response persistence, workbook response ingestion, or P2 prompt integration.
