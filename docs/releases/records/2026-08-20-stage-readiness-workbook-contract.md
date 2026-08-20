# 2026-08-20-stage-readiness-workbook-contract — Stage Readiness Workbook Contract

## Release ID

`2026-08-20-stage-readiness-workbook-contract`

## Status

`candidate`

## Plain-English Summary

Strategic Moves now has a shared deterministic Stage Readiness Workbook contract. The contract turns existing evidence-readiness and evidence-need packets into a client-friendly workbook specification with pre-filled known items, visible missing inputs, explicit evidence-gap states, and hidden metadata for deterministic parsing in later increments.

## Layer Impact

Layer 4 / Products (`global-control-lane`): Strategic Moves workbook contract and renderer only. No tenant data, canonical data, migrations, retrieval, upload parsing, or runtime configuration changes.

## Client Applicability

- All clients: Strategic Moves can use the shared workbook contract once wired into phase transitions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not wired to runtime in this increment.

## Changes Included

- Adds `StageReadinessWorkbookSpec`, deterministic dimension-plan types, evidence source classes, and insufficient-evidence question state.
- Adds a resolver that converts existing Discovery evidence-readiness and Move evidence-need packets into a tailored workbook spec.
- Adds a deterministic XLSX renderer with `Start Here`, focused dimension tabs, `Evidence & Open Items`, and hidden `_metadata`.
- Adds an architecture/design note documenting existing capability reuse and the increment boundary.

## QA / Validation

- PASS — Stage readiness workbook resolver and XLSX render tests:
  `npm test -- --runTestsByPath src/lib/programs/stage-readiness-workbooks/__tests__/resolver.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/xlsx.test.ts`
- PASS — ESLint:
  `npx eslint src/lib/programs/stage-readiness-workbooks`
- PASS — TypeScript:
  `npx tsc --noEmit`
- PASS — Release control:
  `npm run release:check`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the updated runtime. Runtime behavior is unchanged until later wiring increments expose workbook download/upload.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: No runtime surface is wired in this increment.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main deploy workflow. No data rollback is required.

## Audit Evidence

Expected: PR, CI/check output, and ACA deploy run.

## Known Gaps

This increment does not parse uploaded completed workbooks, persist structured workbook responses, wire workbook generation into phase transitions, or feed the resolved plan into P2 prompts.
