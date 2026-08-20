# 2026-08-20-stage-readiness-workbook-parser — Stage Readiness Workbook Parser

## Release ID

`2026-08-20-stage-readiness-workbook-parser`

## Status

`candidate`

## Plain-English Summary

Strategic Moves now has a pure parser for Stage Readiness Workbook XLSX files. The parser reads the workbook metadata, maps visible response rows back to deterministic question IDs, and returns proposed response rows plus validation issues. It does not persist uploaded responses or update governed Move state.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves workbook parsing library. No tenant data, canonical data, migrations, upload endpoint, retrieval, phase-gate automation, or runtime configuration changes.

## Client Applicability

- All clients: Future workbook upload flows can parse Stage Readiness Workbook responses against the workbook metadata.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this increment.

## Changes Included

- Adds `parseStageReadinessWorkbookXlsx` for read-only XLSX parsing.
- Validates hidden workbook metadata, expected Move ID, and expected phase.
- Returns proposed response rows with question ID, dimension ID, source class, visible row location, response/context/evidence/owner/status, and summary counts.
- Adds parser tests for round-trip generated workbook responses and wrong-Move/wrong-phase rejection.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/stage-readiness-workbooks/__tests__/parser.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/resolver.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/xlsx.test.ts` — PASS (3 suites, 5 tests).
- `npx eslint src/lib/programs/stage-readiness-workbooks` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — PASS.
- `npm run release:check` — PASS.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. The parser is not yet wired to an upload route and performs no persistence.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Not applicable until an upload route/UI invokes the parser.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, and ACA deploy run.

## Known Gaps

This increment does not add upload parsing routes, proposed-change persistence, human accept/reject workflow, structured response writes, or P2 prompt integration.
