# 2026-07-23-moves-generated-artifact-phase-binding — Moves Generated Artifact Phase Binding

## Release ID

`2026-07-23-moves-generated-artifact-phase-binding`

## Status

`candidate`

## Plain-English Summary

The Moves File Cabinet now preserves the correct phase for generated deliverables that are merged from `generated_artifacts`. During the First Capital sandbox P3 proof, board-ready P3 generated artifacts were visible in Files & Evidence, but the cabinet API returned them with `phase: null`. That made phase-scoped UI and readiness summaries undercount or misclassify generated work. This change derives the phase from generated artifact metadata and the governed deliverable registry.

## Layer Impact

- `global-control-lane`: updates `GET /api/v1/programs/:programId/artifacts` response shaping only.
- Moves UI data binding: phase-scoped generated artifacts can now be displayed and counted under the correct phase.
- Governance/data model: no schema change, no candidate promotion, no gate-rule change, and no artifact persistence mutation.

## Client Applicability

- All clients: yes, because the File Cabinet API is shared.
- Specific clients: First Capital sandbox proof exposed the issue.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is a correctness fix to an existing shared route.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts`
  - derives generated artifact phase from explicit metadata when present;
  - otherwise derives phase from `deliverableTypeKey`, `registryKey`, or `renderableDoc.deliverableTypeKey` through `DELIVERABLE_REGISTRY`.
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts`
  - adds regression coverage proving a generated P3 `solution_design` artifact returns `phase: 3`.

## QA / Validation

- Pass: `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' --runInBand`
- Pass: `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts'`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the exact merge SHA, then verify the ACA runtime invariant and rerun the First Capital sandbox File Cabinet proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, First Capital sandbox File Cabinet generated artifacts should return/show non-null P3 phase.

## Rollback Plan

Revert the PR. The previous behavior only affected API response shaping for generated artifacts; no data migration or cleanup is required.

## Audit Evidence

- First Capital sandbox Move: `4bf889aa-d4ee-4c1d-936b-51574614d191`
- Live proof exposing bug: `/tmp/firstcapital-p3-approve-build-run-2026-07-23T18-19-26-798Z`
- Generated artifact API before fix showed board-ready P3 outputs with `phase: null`.
- PR URL: pending.
- ACA revision/runtime proof: pending.

## Known Gaps

- Uploaded evidence review/agent-ready promotion remains a separate workflow gap; this release only fixes generated artifact phase binding.
- P3 gate advancement still requires client/human approval of generated outputs before hard gates can pass.
