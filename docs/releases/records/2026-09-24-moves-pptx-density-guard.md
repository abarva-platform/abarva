# 2026-09-24-moves-pptx-density-guard — Moves PPTX Density Guard

## Release ID

`2026-09-24-moves-pptx-density-guard`

## Status

`candidate`

## Plain-English Summary

The Moves PPTX renderer now keeps document-length prose off slide faces. Section prose remains available in DOCX/HTML, while PPTX slides carry a short governing message plus short supporting bullets so generated decks do not become clipped landscape documents.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Moves generated PPTX rendering only. No Layer 1 intake, Layer 2 adapter output, Layer 3 canonical state, approval state, or data-plane state changes.

## Client Applicability

- All clients: applies wherever generated Moves PPTX exports use the shared deliverable renderer.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx`
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand` (`36` tests; expected rasterisation-failure console output from existing fallback tests).
- Pass: `npx eslint src/lib/deliverables/orchestrator/renderers.tsx src/lib/deliverables/orchestrator/__tests__/renderers.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: yes.
- Shared runtime mutators: no manual runtime mutation.
- Approved image digest: produced by repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify post-deploy route health. Regenerating existing artifacts is a separate product/API action.

## Rollback Plan

Revert the PR to restore the previous PPTX renderer behavior.

## Audit Evidence

- PR URL: pending.
- CI/deploy/runtime proof: pending.

## Known Gaps

This release does not regenerate existing PPTX files that were already produced before the renderer guard.
