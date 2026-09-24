# 2026-09-24-moves-file-vault-generated-export-summary — Moves File Vault Generated Export Summary

## Release ID

`2026-09-24-moves-file-vault-generated-export-summary`

## Status

`candidate`

## Plain-English Summary

The Moves File Cabinet summary now counts only AbarVa-generated export artifacts as review-ready DOCX/PPTX exports and models. Uploaded evidence or aggregate approval packets still count as current files, but no longer inflate the generated-export summary.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Moves File Cabinet display classification only.
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
- Pending: `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`.
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pending: `git diff --check`.
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
- Live signed-in proof required: yes, verify the File Cabinet summary does not count uploaded aggregate evidence/control packets as review-ready exports.

## Rollback Plan

Revert the PR to restore the previous File Cabinet generated-export summary logic.

## Audit Evidence

- PR URL: pending.
- CI/deploy/runtime proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release does not mutate or reclassify persisted artifact records. It only prevents the File Cabinet summary from treating non-generated uploaded packets as generated review-ready exports.
