# 2026-08-20-stage-readiness-workbook-route — Stage Readiness Workbook Download

## Release ID

`2026-08-20-stage-readiness-workbook-route`

## Status

`candidate`

## Plain-English Summary

Strategic Moves now exposes a signed-in, read-only XLSX download route for the deterministic Stage Readiness Workbook. The route uses the existing evidence-readiness evaluator, Move evidence-need packets, shared workbook contract, and deterministic renderer to produce a next-phase workbook without mutating tenant data or approving any phase gate.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves API route for workbook download. No tenant data, canonical data, migrations, upload parsing, retrieval, phase-gate automation, or runtime configuration changes.

## Client Applicability

- All clients: Strategic Moves users can request a stage-readiness workbook once the route is linked from the UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this increment.

## Changes Included

- Adds `GET /api/v1/programs/[programId]/stage-readiness-workbook`.
- Builds the workbook from current Move evidence-readiness and evidence-need packets.
- Returns XLSX with workbook id and content hash headers for auditability.
- Adds route tests for default phase, explicit phase, and invalid phase handling.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/__tests__/strategic-moves-context.test.ts 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' src/lib/programs/stage-readiness-workbooks/__tests__/resolver.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/xlsx.test.ts` — PASS (4 suites, 9 tests).
- `npx eslint 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/route.ts' 'src/app/api/v1/programs/[programId]/stage-readiness-workbook/__tests__/route.test.ts' src/lib/programs/stage-readiness-workbooks src/lib/programs/__tests__/strategic-moves-context.test.ts` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — PASS.
- `npm run release:check` — PASS.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. The route is read-only and does not change phase or data state.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Download route smoke after deploy.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, ACA deploy run, and signed-in workbook route smoke.

## Known Gaps

This increment does not add upload parsing, structured response persistence, UI buttons, or P2 prompt integration.
