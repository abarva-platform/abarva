# 2026-09-24-moves-file-vault-review-ready-label — Moves File Vault Review-Ready Label

## Release ID

`2026-09-24-moves-file-vault-review-ready-label`

## Status

`candidate`

## Plain-English Summary

The Moves File Cabinet summary now describes generated DOCX/PPTX files as review-ready exports instead of final-ready deliverables. This keeps the page aligned with the exported documents themselves, which still require human review, approval, and approved re-upload before becoming authoritative.

## Layer Impact

- `global-control-lane` / Layer 4 Products: updates Moves File Cabinet display wording only. No Layer 1 intake, Layer 2 adapter output, Layer 3 canonical state, artifact bytes, approval state, or data-plane state changes.

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

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand` (`9` tests).
- Pass: `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`.
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
- Live signed-in proof required: yes, verify the File Cabinet summary uses review-ready/export wording.

## Rollback Plan

Revert the PR to restore the previous File Cabinet summary text.

## Audit Evidence

- PR URL: pending.
- CI/deploy/runtime proof: pending.
- Signed-in browser proof: pending.

## Known Gaps

This release does not regenerate existing artifacts or change generated document status. It only corrects the File Cabinet summary so the UI does not overstate draft exports as final.
