# 2026-08-31-source-workspace-denominator-labels — Source Workspace Denominator Labels

## Release ID

`2026-08-31-source-workspace-denominator-labels`

## Status

`candidate`

## Plain-English Summary

The Source workspace now labels the portfolio register and contract-depth/action rows as separate evidence bands. This prevents a supplemental action row from appearing to change the portfolio contract denominator or from being read as realized savings.

## Layer Impact

`global-control-lane`

Layer 4 Products: updates Source workspace rendering and generated storyline copy only. No schema, loader, tenant data, or calculation changes are included.

## Client Applicability

- All clients: Source workspace users on the modern workspace surface.
- Specific clients: None named in this public release record.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace routing and provider flags only.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- Focused workspace rendering and adapter tests.

## QA / Validation

- `node node_modules/jest/bin/jest.js --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` — passed.

## Rollout Plan

Merge to main and let the repo-owned Azure Container Apps main deploy workflow publish the next web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the repo-owned deploy workflow.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace should show the portfolio register count separately from contract-depth/action rows.

## Rollback Plan

Revert the PR or deploy the previous healthy ACA revision through the approved main deploy workflow.

## Audit Evidence

PR, focused Jest output, ESLint output, ACA deploy run, runtime invariant proof, and signed-in Source workspace proof.

## Known Gaps

This release does not alter data-plane coverage, refresh cubes, or move supplemental action candidates into the portfolio register.
