# 2026-09-24-moves-file-cabinet-summary-grammar — Moves File Cabinet Summary Grammar

## Release ID

`2026-09-24-moves-file-cabinet-summary-grammar`

## Status

`candidate`

## Plain-English Summary

The Moves File Cabinet download summary now uses correct singular grammar when exactly one deliverable needs review. The summary reads `1 deliverable needs review` instead of `1 deliverable need review`.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Moves File Cabinet display copy only.
- No Layer 1 intake, Layer 2 adapter output, Layer 3 canonical state, artifact bytes, approval state, or data-plane state changes.

## Client Applicability

- All clients: applies wherever the Moves File Cabinet is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand` (`10` tests).
- Pass: `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pending: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow will build and deploy the exact merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: yes.
- Shared runtime mutators: no manual runtime mutation.
- Approved image digest: produced by repo-owned deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the File Cabinet summary uses singular grammar for one review item.

## Rollback Plan

Revert the PR to restore the previous File Cabinet summary copy.

## Audit Evidence

- PR URL: pending.
- CI/deploy/runtime proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release is intentionally limited to singular/plural copy in the File Cabinet summary. It does not regenerate any existing artifacts, change artifact classifications, change artifact quality scoring, or alter the underlying File Cabinet counts.
